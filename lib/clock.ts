import "server-only";
import { db } from "@/lib/db";
import { appState, complaints } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

// Always read/write the lowest-id row so reads and writes target the same
// row even if a stray duplicate ever lands in app_state.
async function getOffset(): Promise<number> {
  const rows = await db.select().from(appState).orderBy(appState.id).limit(1);
  if (!rows.length) {
    await db.insert(appState).values({ clockOffsetMs: "0" });
    return 0;
  }
  return parseInt(rows[0].clockOffsetMs ?? "0");
}

async function upsertOffset(newOffset: number): Promise<void> {
  const existing = await db.select().from(appState).orderBy(appState.id).limit(1);
  if (existing.length) {
    await db
      .update(appState)
      .set({ clockOffsetMs: newOffset.toString() })
      .where(eq(appState.id, existing[0].id));
  } else {
    await db.insert(appState).values({ clockOffsetMs: newOffset.toString() });
  }
}

export async function vnow(): Promise<number> {
  return Date.now() + (await getOffset());
}

export async function advanceClock(hours: number = 24): Promise<{
  newOffsetHours: number;
  escalated: number[];
}> {
  const currentOffset = await getOffset();
  const newOffset = currentOffset + hours * 3600 * 1000;
  const newNow = Date.now() + newOffset;

  await upsertOffset(newOffset);

  const pending = await db
    .select()
    .from(complaints)
    .where(inArray(complaints.status, ["pending"]));

  const breached = pending.filter((c) => parseInt(c.slaDeadlineMs) < newNow);

  // Lazy import breaks the run.ts ↔ clock.ts circular dependency
  const { escalateComplaint } = await import("@/lib/agent/run");

  // Escalate in parallel — each is an independent OpenAI round-trip, so running
  // them sequentially makes a multi-breach advance feel like it's hung.
  await Promise.all(breached.map((c) => escalateComplaint(c.id)));
  const escalated = breached.map((c) => c.id);

  return { newOffsetHours: Math.round(newOffset / 3600000), escalated };
}

export async function resetClock(): Promise<void> {
  await upsertOffset(0);
}
