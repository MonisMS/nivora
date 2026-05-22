import { NextRequest, NextResponse } from "next/server";
import { fileComplaint } from "@/lib/agent/run";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "Complaint text is required" }, { status: 400 });
    }
    const complaint = await fileComplaint(text.trim());
    return NextResponse.json({ complaint });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to file complaint" }, { status: 500 });
  }
}
