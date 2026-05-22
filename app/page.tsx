"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, Clock, Send, RotateCcw, Database,
  TrendingUp, Timer, Activity,
} from "lucide-react";
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

const statusConfig: Record<string, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  escalated: { label: "Escalated", className: "bg-red-500/15 text-red-400 border-red-500/30" },
  resolved:  { label: "Resolved",  className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

const severityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-500/20 text-red-300 border-red-500/40" },
  high:     { label: "High",     className: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  medium:   { label: "Medium",   className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  low:      { label: "Low",      className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <Badge variant="outline" className={cn("text-xs font-mono border", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = severityConfig[severity] ?? severityConfig.medium;
  return (
    <Badge variant="outline" className={cn("text-xs border", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [complaintText, setComplaintText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
        setLastAction(`Filed: ${c.refNumber} — classified and routed by agent`);
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
        setLastAction(`Clock advanced +24h → ${n} complaint${n !== 1 ? "s" : ""} auto-escalated`);
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
      setLastAction(`Seeded ${r.seeded} complaints (${r.skipped} already existed)`);
      await load();
    }
  }

  async function resetAll() {
    await fetch("/api/reset", { method: "POST" });
    setLastAction("Database reset — all complaints and logs cleared");
    await load();
  }

  const counts = data
    ? {
        total:     data.complaints.length,
        pending:   data.complaints.filter(c => c.status === "pending").length,
        escalated: data.complaints.filter(c => c.status === "escalated").length,
        resolved:  data.complaints.filter(c => c.status === "resolved").length,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Dot-grid atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #1e293b 1px, transparent 1px)",
          backgroundSize: "2rem 2rem",
          opacity: 0.4,
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Activity className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-none">Nivora</h1>
                <p className="text-slate-500 text-xs mt-0.5">Autonomous Grievance Agent · Lucknow, UP</p>
              </div>
            </div>
            <p className="text-slate-700 text-[10px] mt-2 font-mono">
              APL Qualifiers 2026 · PS-07: Jansunwai Resolution
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {data && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 font-semibold">
                  {data.clockOffsetHours >= 0 ? "+" : ""}{data.clockOffsetHours}h
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">
                  {new Date(data.virtualNow).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            )}
            <Button
              variant="outline" size="sm" onClick={seedData}
              className="bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white text-xs h-8"
            >
              <Database className="w-3 h-3 mr-1.5" /> Seed Demo
            </Button>
            <Button
              variant="outline" size="sm" onClick={resetAll}
              className="bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white text-xs h-8"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" /> Reset
            </Button>
            <Button
              size="sm" onClick={advanceClock} disabled={advancing}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 shadow-lg shadow-amber-500/20"
            >
              <Timer className="w-3 h-3 mr-1.5" />
              {advancing ? "Advancing…" : "Advance +24h"}
            </Button>
          </div>
        </header>

        {/* ── Stats row ───────────────────────────────────────────────── */}
        {counts && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total",     value: counts.total,     color: "text-slate-200" },
              { label: "Pending",   value: counts.pending,   color: "text-amber-400" },
              { label: "Escalated", value: counts.escalated, color: "text-red-400" },
              { label: "Resolved",  value: counts.resolved,  color: "text-emerald-400" },
            ].map(s => (
              <div
                key={s.label}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
              >
                <p className="text-slate-600 text-[10px] uppercase tracking-widest mb-1 font-mono">{s.label}</p>
                <p className={cn("text-3xl font-bold font-mono leading-none", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Toast-style feedback ────────────────────────────────────── */}
        {lastAction && (
          <div className="mb-5 flex items-center gap-2 px-4 py-2.5 bg-amber-500/8 border border-amber-500/20 rounded-lg text-amber-300 text-xs font-mono">
            <span className="text-amber-400">✓</span>
            {lastAction}
          </div>
        )}

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">

          {/* Left column */}
          <div className="flex flex-col gap-5">

            {/* File complaint */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  File a Grievance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe your complaint in English or Hindi/Hinglish — e.g. &quot;Nala Road mein paani bhar gaya, ek hafte se koi action nahi…&quot;"
                  value={complaintText}
                  onChange={e => setComplaintText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComplaint();
                  }}
                  rows={3}
                  className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600 resize-none text-sm focus-visible:ring-amber-500/30 focus-visible:border-amber-500/40"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-slate-700 text-[10px] font-mono">⌘+Enter to submit</span>
                  <Button
                    onClick={submitComplaint}
                    disabled={submitting || !complaintText.trim()}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-4"
                  >
                    {submitting ? "Agent processing…" : "Submit to Nivora"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Complaints table */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Active Grievances
                  {counts && (
                    <span className="ml-auto font-mono text-[10px] text-slate-600 normal-case font-normal">
                      {counts.total} total
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <p className="text-slate-600 text-sm text-center py-12 font-mono">Loading…</p>
                ) : !data?.complaints.length ? (
                  <p className="text-slate-600 text-sm text-center py-12 px-4">
                    No complaints yet.{" "}
                    <button onClick={seedData} className="text-amber-400 hover:underline">
                      Seed demo data
                    </button>{" "}
                    to load 15 sample grievances.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableHead className="text-slate-600 text-[10px] font-mono uppercase tracking-wider pl-5">Ref</TableHead>
                          <TableHead className="text-slate-600 text-[10px] font-mono uppercase tracking-wider">Category</TableHead>
                          <TableHead className="text-slate-600 text-[10px] font-mono uppercase tracking-wider">Severity</TableHead>
                          <TableHead className="text-slate-600 text-[10px] font-mono uppercase tracking-wider">Status</TableHead>
                          <TableHead className="text-slate-600 text-[10px] font-mono uppercase tracking-wider">Department</TableHead>
                          <TableHead className="text-slate-600 text-[10px] font-mono uppercase tracking-wider hidden lg:table-cell">Complaint</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.complaints.map(c => (
                          <TableRow key={c.id} className="border-slate-800 hover:bg-slate-800/40">
                            <TableCell className="pl-5 py-3">
                              <span className="font-mono text-[11px] text-amber-400/80 whitespace-nowrap">
                                {c.refNumber}
                              </span>
                              {c.escalationLevel > 0 && (
                                <span className="ml-1.5 text-red-400 text-[10px] font-mono">
                                  ↑L{c.escalationLevel}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="text-xs text-slate-300 capitalize">{c.category}</span>
                            </TableCell>
                            <TableCell className="py-3">
                              <SeverityBadge severity={c.severity} />
                            </TableCell>
                            <TableCell className="py-3">
                              <StatusBadge status={c.status} />
                            </TableCell>
                            <TableCell className="py-3 max-w-[160px]">
                              <p className="text-[11px] text-slate-400 truncate leading-tight">
                                {c.departmentHindi}
                              </p>
                            </TableCell>
                            <TableCell className="py-3 max-w-[260px] hidden lg:table-cell">
                              <p className="text-xs text-slate-500 truncate">{c.text}</p>
                              {c.hindiUpdate && (
                                <p className="text-[10px] text-slate-700 truncate mt-0.5">
                                  {c.hindiUpdate}
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column — Decision Log */}
          <Card className="bg-slate-900 border-slate-800 xl:sticky xl:top-6 xl:max-h-[calc(100vh-6rem)] flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Agent Decision Log
                {data && (
                  <span className="ml-auto font-mono text-[10px] text-slate-600 normal-case font-normal">
                    {data.logs.length} entries
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <Separator className="bg-slate-800 shrink-0" />
            <CardContent className="p-0 overflow-y-auto flex-1">
              {!data?.logs.length ? (
                <p className="text-slate-600 text-sm text-center py-12 px-4">
                  No decisions logged yet. File a complaint or seed demo data.
                </p>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {data.logs.map((log, i) => (
                    <div
                      key={log.id}
                      className={cn(
                        "px-4 py-4 text-xs space-y-2.5 transition-colors",
                        i === 0 && "bg-amber-500/5 border-l-2 border-l-amber-500/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-700 text-[10px]">
                          complaint #{log.complaintId} ·{" "}
                          {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                          })}
                        </span>
                        {i === 0 && (
                          <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">
                            LATEST
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <span className="text-slate-600 font-mono text-[10px] w-[52px] shrink-0 pt-px">OBSERVE</span>
                          <p className="text-slate-400 leading-relaxed">{log.observed}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-amber-500/60 font-mono text-[10px] w-[52px] shrink-0 pt-px">DECIDE</span>
                          <p className="text-slate-300 leading-relaxed">{log.decided}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-emerald-500/60 font-mono text-[10px] w-[52px] shrink-0 pt-px">ACT</span>
                          <p className="text-slate-400 leading-relaxed">{log.acted}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <footer className="mt-8 text-center text-slate-800 text-[10px] font-mono">
          Nivora · PS-07 · APL Qualifiers 2026 · @MonisMS
        </footer>
      </div>
    </div>
  );
}
