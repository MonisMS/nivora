import { NextResponse } from "next/server";
import { resetClock } from "@/lib/clock";
import { db } from "@/lib/db";
import { complaints, decisionLog } from "@/lib/schema";

export async function POST() {
  try {
    await db.delete(decisionLog);
    await db.delete(complaints);
    await resetClock();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
