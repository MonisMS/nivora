# Nivora

**Your AI advocate that monitors, follows up, and escalates civic grievances — so you never have to chase the government again.**

> APL Qualifiers — Round 1 · Problem Statement **PS-07: Jansunwai grievance resolution agent**

---

## Team

- **Team Name:** NULL
- **Member:** Monis Sarwar ([@MonisMS](https://github.com/MonisMS))

## What is Nivora?

Nivora is an autonomous AI middleware layer — a **citizen's advocate** sitting on top of UP's existing Jansunwai/IGRS grievance system. A citizen files their complaint on Jansunwai as usual, then hands the reference number to Nivora. That's all they do. Nivora takes over from there: it monitors the complaint, tracks the SLA deadline, and when a department ignores it, **escalates automatically** — re-drafting a firmer complaint to a higher authority and notifying the citizen in vernacular Hindi at every step.

**Nivora does not replace Jansunwai. It adds autonomous intelligence on top of it.**

## Problem Statement (PS-07)

UP's Jansunwai portal receives millions of complaints, but resolution is slow and opaque. The portal's only follow-up mechanism is a manual "reminder" button — the burden of chasing falls entirely on the citizen. Complaints are frequently closed without being resolved, routed to the wrong department, and communicated only in English that rural and elderly citizens can't read. Nivora closes this gap by sitting as an intelligent agent layer on top of the existing system — proactively monitoring, escalating, and communicating so the citizen doesn't have to.

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

pnpm db:push             # create the schema on Neon
pnpm dev                 # http://localhost:3000
```

**Demo:** file a grievance → watch it get classified and routed → click **Advance Clock** to fast-forward time → watch Nivora autonomously escalate the breached complaint in the Decision Log.

## Known Limitations

- The department backend is a **simulator** (no live Jansunwai/IGRS integration — that's a closed government system).
- Time is advanced via a manual **"Advance Clock"** control to demonstrate SLA breaches within the demo window.
- Single-citizen demo flow; no authentication or multi-user accounts.
- Vernacular generation is Hindi-focused; broader dialect (Awadhi) support is future work.
