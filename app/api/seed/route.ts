import { NextResponse } from "next/server";
import { seedComplaints } from "@/lib/seed";

export async function POST() {
  try {
    const result = await seedComplaints();
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
