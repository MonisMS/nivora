import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const classifyTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "classify_grievance",
      description: "Classify the citizen grievance by category and severity",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["water", "electricity", "roads", "sanitation", "sewerage", "development", "other"],
          },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description: "critical=immediate danger/health risk, high=essential service down, medium=inconvenience, low=minor",
          },
          reasoning: { type: "string" },
        },
        required: ["category", "severity", "reasoning"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "route_to_department",
      description: "Assign the complaint to the correct government department",
      parameters: {
        type: "object",
        properties: {
          department: { type: "string" },
          departmentHindi: { type: "string" },
          slaHours: { type: "number" },
          reasoning: { type: "string" },
        },
        required: ["department", "departmentHindi", "slaHours", "reasoning"],
      },
    },
  },
];

export const escalateTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "escalate_grievance",
      description: "Escalate a complaint that has breached its SLA. Re-draft a firmer complaint to a higher authority.",
      parameters: {
        type: "object",
        properties: {
          escalatedTo: { type: "string" },
          escalatedToHindi: { type: "string" },
          firmerText: {
            type: "string",
            description: "Re-drafted complaint — firmer tone, cites SLA breach, references original issue",
          },
          hindiUpdate: {
            type: "string",
            description: "Hindi SMS/message to the citizen notifying them of the escalation",
          },
          reasoning: { type: "string" },
        },
        required: ["escalatedTo", "escalatedToHindi", "firmerText", "hindiUpdate", "reasoning"],
      },
    },
  },
];
