import { NextRequest, NextResponse } from "next/server";
import { advanceClock } from "@/lib/clock";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const hours = typeof body.hours === "number" ? body.hours : 24;
    const result = await advanceClock(hours);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to advance clock" }, { status: 500 });
  }
}
