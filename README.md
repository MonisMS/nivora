# Nivora

**The autonomous agent that files, tracks, and escalates civic grievances until they're resolved.**

> APL Qualifiers — Round 1 · Problem Statement **PS-07: Jansunwai grievance resolution agent**

---

## Team

- **Team Name:** NULL
- **Member:** Monis Sarwar ([@your-github-handle](https://github.com/your-github-handle))

## What is Nivora?

Nivora is an autonomous AI agent for civic grievance redressal, modeled on UP's Jansunwai/IGRS public complaint system. A citizen files a complaint in Hindi or English; the agent classifies its category and severity, routes it to the correct department with a service-level deadline (SLA), and monitors resolution. When a department misses its SLA, Nivora **escalates on its own** — re-drafting a firmer complaint to a higher authority and notifying the citizen in their own language at every step. No human presses "escalate."

## Problem Statement (PS-07)

UP's Jansunwai portal receives millions of complaints, but the only follow-up mechanism is a manual "reminder" button — the citizen has to chase their own complaint. Grievances are frequently closed without being resolved, routed to the wrong department, and updated only in English. Nivora closes this gap with an agent that proactively tracks, escalates, and communicates in vernacular Hindi.

## Why it's a real agent (not a chatbot)

Nivora runs a genuine **plan → act → observe → adapt** loop with autonomous tool use:

1. **Classify** the grievance (category + severity)
2. **Route** to the correct department with an SLA deadline
3. **Observe** status over time (department simulator)
4. **Adapt:** on SLA breach, autonomously **escalate** — re-file a firmer complaint to a higher authority
5. **Notify** the citizen in vernacular Hindi at each state change

Every decision is shown in a live **Agent Decision Log** (observed → decided → acted).

## Tech Stack & Tools

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** Neon (serverless Postgres) + Drizzle ORM
- **AI / Agent:** OpenAI API (function/tool calling) — classification, escalation re-drafting, vernacular Hindi generation
- **UI:** Tailwind CSS + lucide-react

### AI tools disclosure (Rule 4.2)

- **OpenAI API** — powers the agent's reasoning, classification, complaint re-drafting, and Hindi text generation.
- **Claude Code** — used as a development assistant during the build.

## Setup / Run

```bash
pnpm install

# set your secrets in .env.local
# OPENAI_API_KEY=sk-...
# DATABASE_URL=postgresql://...   (Neon connection string)

pnpm drizzle-kit push    # create the schema on Neon
pnpm dev                 # http://localhost:3000
```

**Demo:** file a grievance → watch it get classified and routed → click **Advance Clock** to fast-forward time → watch Nivora autonomously escalate the breached complaint in the Decision Log.

## Known Limitations

- The department backend is a **simulator** (no live Jansunwai/IGRS integration — that's a closed government system).
- Time is advanced via a manual **"Advance Clock"** control to demonstrate SLA breaches within the demo window.
- Single-citizen demo flow; no authentication or multi-user accounts.
- Vernacular generation is Hindi-focused; broader dialect (Awadhi) support is future work.
