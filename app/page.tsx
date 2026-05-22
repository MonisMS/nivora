"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, RotateCcw, Database, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type Complaint = {
  id: number;
  refNumber: string;
  text: string;
  category: string;
  severity: string;
  department: string;
  departmentHindi: string;
  locality: string | null;
  status: string;
  escalationLevel: number;
  slaDeadlineMs: string;
  hindiUpdate: string | null;
  createdAt: string;
};

type LogEntry = {
  id: number;
  complaintId: number;
  observed: string;
  decided: string;
  acted: string;
  createdAt: string;
};

type DashboardData = {
  complaints: Complaint[];
  logs: LogEntry[];
  virtualNow: number;
  clockOffsetHours: number;
};

const statusConfig: Record<string, { label: string; dot: string; text: string; live?: boolean }> = {
  pending:   { label: "Pending",   dot: "bg-muted-foreground",      text: "text-muted-foreground" },
  escalated: { label: "Escalated", dot: "bg-alarm",                 text: "text-alarm", live: true },
  resolved:  { label: "Resolved",  dot: "bg-relief",                text: "text-relief" },
};

const severityDot: Record<string, string> = {
  critical: "bg-alarm",
  high:     "bg-signal",
  medium:   "bg-muted-foreground/70",
  low:      "bg-muted-foreground/40",
};

function StatusPill({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cfg.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot, cfg.live && "nv-live")} />
      {cfg.label}
    </span>
  );
}

function slaLabel(deadlineMs: string, now: number): { text: string; tone: string } {
  const deadline = Number(deadlineMs);
  if (!Number.isFinite(deadline)) return { text: "—", tone: "text-muted-foreground" };
  const diff = deadline - now;
  const hrs = diff / 3_600_000;
  if (diff <= 0) return { text: `Breached +${Math.abs(Math.round(hrs))}h`, tone: "text-alarm" };
  if (hrs < 24) return { text: `${Math.round(hrs)}h left`, tone: "text-signal" };
  return { text: `${Math.round(hrs / 24)}d left`, tone: "text-muted-foreground" };
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [complaintText, setComplaintText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Live virtual clock: server gives a snapshot; we extrapolate locally each
  // second so SLA timers visibly tick during the demo.
  const fetchedAt = useRef<number>(Date.now());
  const [liveNow, setLiveNow] = useState<number>(Date.now());

  const load = useCallback(async () => {
    // Retry a few times: Neon's free-tier compute can cold-start on the first
    // hit and time out, which would otherwise paint a blank dashboard.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const d: DashboardData = await res.json();
          setData(d);
          fetchedAt.current = Date.now();
          setLiveNow(d.virtualNow);
          break;
        }
      } catch {
        // network/cold-start — fall through to retry
      }
      await new Promise(r => setTimeout(r, 1200));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setInterval(() => {
      setData(d => {
        if (d) setLiveNow(d.virtualNow + (Date.now() - fetchedAt.current));
        return d;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  async function submitComplaint() {
    if (!complaintText.trim()) return;
    setSubmitting(true);
    setLastAction(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: complaintText }),
      });
      if (res.ok) {
        const c = await res.json();
        setComplaintText("");
        setLastAction(`Filed ${c.complaint.refNumber} — classified and routed by the agent`);
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function advanceClock() {
    setAdvancing(true);
    try {
      const res = await fetch("/api/advance-clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: 24 }),
      });
      if (res.ok) {
        const r = await res.json();
        const n = r.escalated?.length ?? 0;
        setLastAction(`Advanced 24h — ${n} complaint${n !== 1 ? "s" : ""} auto-escalated`);
        await load();
      }
    } finally {
      setAdvancing(false);
    }
  }

  async function seedData() {
    const res = await fetch("/api/seed", { method: "POST" });
    if (res.ok) {
      const r = await res.json();
      setLastAction(`Seeded ${r.seeded} complaints`);
      await load();
    }
  }

  async function resetAll() {
    await fetch("/api/reset", { method: "POST" });
    setLastAction("Reset — all complaints and logs cleared");
    await load();
  }

  const metrics = data
    ? {
        total:     data.complaints.length,
        pending:   data.complaints.filter(c => c.status === "pending").length,
        escalated: data.complaints.filter(c => c.status === "escalated").length,
        resolved:  data.complaints.filter(c => c.status === "resolved").length,
        breached:  data.complaints.filter(
          c => c.status !== "resolved" && Number(c.slaDeadlineMs) < liveNow
        ).length,
      }
    : null;

  return (
    <div className="app-bg min-h-screen text-foreground">
      <div className="max-w-[1320px] mx-auto px-6 py-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-lg bg-card/70 border border-panel-border">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" aria-hidden>
                <path d="M5 19V8l7-4 7 4v11" stroke="var(--signal)" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 19v-5h6v5" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="12" cy="9" r="1.4" fill="var(--signal)" />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-semibold text-xl tracking-wide leading-none">Nivora</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Autonomous grievance agent · Lucknow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data && (
              <div className="flex items-center gap-2 px-3 h-9 rounded-md bg-card/60 border border-panel-border text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {new Date(liveNow).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </span>
                {data.clockOffsetHours !== 0 && (
                  <span className="font-mono text-signal text-xs">+{data.clockOffsetHours}h</span>
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={seedData}
              className="h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-card/60">
              <Database className="w-4 h-4 mr-1.5" /> Seed
            </Button>
            <Button variant="ghost" size="sm" onClick={resetAll}
              className="h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-card/60">
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
            </Button>
            <Button size="sm" onClick={advanceClock} disabled={advancing}
              className="h-9 rounded-md bg-signal hover:bg-signal/85 text-signal-foreground font-semibold glow-signal transition-colors disabled:opacity-70">
              <Timer className="w-4 h-4 mr-1.5" />
              {advancing ? "Advancing…" : "Advance 24h"}
            </Button>
          </div>
        </header>

        {/* ── System-state metrics strip ──────────────────────────────── */}
        {metrics && (
          <div className="surface rounded-xl grid grid-cols-2 sm:grid-cols-5 divide-x divide-panel-border/60 mb-6 overflow-hidden">
            {[
              { label: "Total filed", value: metrics.total,     accent: "bg-muted-foreground/40", tone: "text-foreground" },
              { label: "Pending",     value: metrics.pending,   accent: "bg-muted-foreground",    tone: "text-foreground" },
              { label: "SLA breached",value: metrics.breached,  accent: "bg-signal",              tone: metrics.breached ? "text-signal" : "text-foreground" },
              { label: "Escalated",   value: metrics.escalated, accent: "bg-alarm",               tone: metrics.escalated ? "text-alarm" : "text-foreground" },
              { label: "Resolved",    value: metrics.resolved,  accent: "bg-relief",              tone: "text-foreground" },
            ].map(m => (
              <div key={m.label} className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full", m.accent)} />
                  <p className="text-muted-foreground text-xs">{m.label}</p>
                </div>
                <p className={cn("font-display font-semibold text-3xl tabular-nums leading-none mt-2", m.tone)}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">

          {/* ── Left column ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* File a grievance — the primary workflow */}
            <section className="surface rounded-xl p-6">
              <h2 className="font-display font-semibold text-lg tracking-wide">File a grievance</h2>
              <p className="text-muted-foreground text-sm mt-1 mb-4">
                Describe the issue in English or Hindi. The agent classifies it, routes it to
                the right department, and tracks the SLA.
              </p>
              <Textarea
                placeholder="e.g. Aliganj mein teen din se paani nahi aa raha, tanker bhi nahi aaya…"
                value={complaintText}
                onChange={e => setComplaintText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComplaint(); }}
                rows={4}
                className="bg-background/50 border-panel-border text-foreground placeholder:text-muted-foreground/60 resize-none text-[15px] leading-relaxed rounded-lg focus-visible:ring-signal/25 focus-visible:border-signal/40"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-muted-foreground/70 text-xs">⌘ + Enter to submit</span>
                <Button onClick={submitComplaint} disabled={submitting || !complaintText.trim()}
                  className="h-10 px-5 rounded-md bg-signal hover:bg-signal/85 text-signal-foreground font-semibold glow-signal transition-colors disabled:opacity-50">
                  {submitting ? "Processing…" : "Submit to Nivora"}
                </Button>
              </div>
              {lastAction && (
                <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-panel-border/60 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-relief nv-live shrink-0" />
                  <span className="text-foreground/75">{lastAction}</span>
                </div>
              )}
            </section>

            {/* Incident list */}
            <section className="surface rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-panel-border/60">
                <h2 className="font-display font-semibold text-lg tracking-wide">Active grievances</h2>
                {metrics && <span className="text-muted-foreground text-sm">{metrics.total} on board</span>}
              </div>

              {loading ? (
                <p className="text-muted-foreground text-sm px-6 py-16 text-center">Establishing link to grievance queue…</p>
              ) : !data?.complaints.length ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-foreground/80 text-sm">Queue empty — pipeline standing by.</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    <button onClick={seedData} className="text-signal hover:underline">Seed demo data</button>{" "}
                    to load 15 sample grievances.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-panel-border/50">
                  {data.complaints.map(c => {
                    const sla = slaLabel(c.slaDeadlineMs, liveNow);
                    return (
                      <li key={c.id} className="flex items-start gap-4 px-6 py-3.5 hover:bg-card/40 transition-colors">
                        <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", severityDot[c.severity] ?? severityDot.medium)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] text-foreground/90 leading-snug line-clamp-1">{c.text}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            <span className="font-mono text-muted-foreground/80">{c.refNumber}</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="capitalize">{c.category}</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="truncate max-w-[200px]">{c.departmentHindi}</span>
                            {c.escalationLevel > 0 && <span className="text-alarm">· L{c.escalationLevel}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusPill status={c.status} />
                          <span className={cn("font-mono text-xs", sla.tone)}>{sla.text}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* ── Right column — Decision Log ───────────────────────────── */}
          <section className="surface rounded-xl overflow-hidden xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] flex flex-col">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-panel-border/60 shrink-0">
              <h2 className="font-display font-semibold text-lg tracking-wide">Agent decision log</h2>
              <span className="w-1.5 h-1.5 rounded-full bg-relief nv-live" />
              {data && <span className="ml-auto text-muted-foreground text-sm">{data.logs.length}</span>}
            </div>

            <div className="overflow-y-auto flex-1">
              {!data?.logs.length ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-foreground/80 text-sm">Awaiting incoming grievances.</p>
                  <p className="text-muted-foreground text-sm mt-1">Agent routing pipeline standing by.</p>
                </div>
              ) : (
                <ul className="divide-y divide-panel-border/40">
                  {data.logs.map((log, i) => (
                    <li key={log.id} className={cn("px-6 py-4", i === 0 && "bg-signal/[0.04] border-l-2 border-l-signal/50")}>
                      <div className="flex items-center gap-2 mb-2.5 text-xs text-muted-foreground/70">
                        <span className="font-mono">#{log.complaintId}</span>
                        <span>·</span>
                        <span className="font-mono">
                          {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {i === 0 && <span className="ml-auto text-signal">Latest</span>}
                      </div>
                      <dl className="space-y-1.5 text-sm">
                        <div className="flex gap-3">
                          <dt className="w-14 shrink-0 text-muted-foreground/60">Observed</dt>
                          <dd className="text-muted-foreground flex-1 leading-relaxed">{log.observed}</dd>
                        </div>
                        <div className="flex gap-3">
                          <dt className="w-14 shrink-0 text-muted-foreground/60">Decided</dt>
                          <dd className="text-foreground/90 flex-1 leading-relaxed">{log.decided}</dd>
                        </div>
                        <div className="flex gap-3">
                          <dt className="w-14 shrink-0 text-muted-foreground/60">Acted</dt>
                          <dd className="text-muted-foreground flex-1 leading-relaxed">{log.acted}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-8 pt-5 border-t border-panel-border/60 text-muted-foreground/50 text-xs">
          Nivora · PS-07 · APL Qualifiers 2026 · @MonisMS
        </footer>
      </div>
    </div>
  );
}
