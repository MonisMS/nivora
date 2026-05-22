import "server-only";
import OpenAI from "openai";
import { db } from "@/lib/db";
import { complaints, decisionLog } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { classifyTools, escalateTools } from "./tools";
import { DEPT_MAP, getSlaMs, generateRefNumber } from "@/lib/utils";
import { vnow } from "@/lib/clock";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Shared helpers ────────────────────────────────────────────────────────────

export async function logDecision(
  complaintId: number,
  observed: string,
  decided: string,
  acted: string
) {
  await db.insert(decisionLog).values({ complaintId, observed, decided, acted });
}

async function runToolLoop(
  messages: ChatCompletionMessageParam[],
  tools: ChatCompletionTool[],
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<unknown>,
  maxSteps = 8
): Promise<void> {
  for (let step = 0; step < maxSteps; step++) {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
    });

    const msg = res.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls?.length) break;

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;
      let result: unknown;
      try {
        const args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
        result = await onToolCall(call.function.name, args);
      } catch {
        result = { error: "parse or handler error" };
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }
}

// ── File a new complaint ──────────────────────────────────────────────────────

export async function fileComplaint(text: string) {
  const now = await vnow();
  const refNumber = generateRefNumber();

  let category = "other";
  let severity = "medium";
  let department = DEPT_MAP.other.dept;
  let departmentHindi = DEPT_MAP.other.hindi;
  let slaHours = 168;

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are Nivora, an autonomous civic grievance agent for Lucknow, UP, India.
A citizen has filed a complaint. You MUST call classify_grievance first, then route_to_department.
Both tool calls are required. Do not respond with plain text.`,
    },
    { role: "user", content: `Citizen complaint: "${text}"` },
  ];

  await runToolLoop(messages, classifyTools, async (name, args) => {
    if (name === "classify_grievance") {
      category = (args.category as string) ?? "other";
      severity = (args.severity as string) ?? "medium";
      return { success: true, category, severity };
    }
    if (name === "route_to_department") {
      department = args.department as string;
      departmentHindi = args.departmentHindi as string;
      slaHours = (args.slaHours as number) ?? getSlaMs(category, severity) / 3600000;
      return { success: true, department, slaHours };
    }
    return { error: "unknown tool" };
  });

  const slaDeadlineMs = (now + slaHours * 3600 * 1000).toString();
  const hindiAck = `आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: ${refNumber}।\nयह शिकायत "${departmentHindi}" को भेज दी गई है। निर्धारित समय: ${slaHours} घंटे।`;

  const [complaint] = await db
    .insert(complaints)
    .values({
      refNumber,
      text,
      category,
      severity,
      department,
      departmentHindi,
      status: "pending",
      escalationLevel: 0,
      slaDeadlineMs,
      hindiUpdate: hindiAck,
    })
    .returning();

  await logDecision(
    complaint.id,
    `New complaint received: "${text.slice(0, 80)}"`,
    `Classified as ${category.toUpperCase()} / ${severity.toUpperCase()} → routed to ${department}`,
    `Registered ref ${refNumber}. SLA: ${slaHours}h. Hindi acknowledgment sent.`
  );

  return complaint;
}

// ── Escalate a single breached complaint ─────────────────────────────────────

export async function escalateComplaint(complaintId: number) {
  const [complaint] = await db
    .select()
    .from(complaints)
    .where(eq(complaints.id, complaintId));

  if (!complaint) return null;

  const deptInfo = DEPT_MAP[complaint.category] ?? DEPT_MAP.other;
  const slaBreachedHours = Math.round(
    ((await vnow()) - parseInt(complaint.slaDeadlineMs)) / 3600000
  );

  let escalatedTo = deptInfo.escalateTo;
  let escalatedToHindi = deptInfo.escalateToHindi;
  let hindiUpdate = "";

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are Nivora, an autonomous escalation agent for civic grievances in Lucknow, India.
A complaint has breached its SLA. You MUST call escalate_grievance to re-draft a firmer complaint to a higher authority and generate a Hindi SMS for the citizen.`,
    },
    {
      role: "user",
      content: `Original complaint: "${complaint.text}"
Category: ${complaint.category} | Severity: ${complaint.severity}
Assigned to: ${complaint.department}
SLA breached by: ${slaBreachedHours} hours
Escalation level: ${complaint.escalationLevel} (0 = first escalation)
Higher authority: ${deptInfo.escalateTo} (${deptInfo.escalateToHindi})
Reference: ${complaint.refNumber}`,
    },
  ];

  let firmerText = "";

  await runToolLoop(messages, escalateTools, async (name, args) => {
    if (name === "escalate_grievance") {
      escalatedTo = args.escalatedTo as string;
      escalatedToHindi = args.escalatedToHindi as string;
      firmerText = args.firmerText as string;
      hindiUpdate = args.hindiUpdate as string;
      return { success: true };
    }
    return { error: "unknown tool" };
  });

  await db
    .update(complaints)
    .set({
      status: "escalated",
      escalationLevel: complaint.escalationLevel + 1,
      department: escalatedTo,
      departmentHindi: escalatedToHindi,
      hindiUpdate,
    })
    .where(eq(complaints.id, complaintId));

  await logDecision(
    complaintId,
    `SLA breached by ${slaBreachedHours}h. "${complaint.department}" did not respond.`,
    `Escalate to higher authority: ${escalatedTo}. Re-draft firmer complaint.`,
    `Escalated to ${escalatedTo}. Level: ${complaint.escalationLevel + 1}. Re-drafted: "${firmerText.slice(0, 120)}"`
  );

  return { escalatedTo, hindiUpdate };
}
