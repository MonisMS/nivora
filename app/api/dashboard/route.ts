import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { complaints, decisionLog, appState } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const [allComplaints, allLogs, stateRows] = await Promise.all([
      db.select().from(complaints).orderBy(desc(complaints.createdAt)),
      db.select().from(decisionLog).orderBy(desc(decisionLog.createdAt)),
      db.select().from(appState).limit(1),
    ]);

    const clockOffsetMs = stateRows[0]?.clockOffsetMs ? parseInt(stateRows[0].clockOffsetMs) : 0;
    const virtualNow = Date.now() + clockOffsetMs;

    return NextResponse.json({
      complaints: allComplaints,
      logs: allLogs,
      virtualNow,
      clockOffsetHours: Math.round(clockOffsetMs / 3600000),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
