import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  refNumber: text("ref_number").notNull().unique(),
  text: text("text").notNull(),
  hindiText: text("hindi_text"),
  category: text("category").notNull().default("other"),
  severity: text("severity").notNull().default("medium"),
  department: text("department").notNull().default("Nagar Nigam Lucknow"),
  departmentHindi: text("department_hindi"),
  locality: text("locality"),
  status: text("status").notNull().default("pending"),
  escalationLevel: integer("escalation_level").notNull().default(0),
  slaDeadlineMs: text("sla_deadline_ms").notNull(),
  hindiUpdate: text("hindi_update"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const decisionLog = pgTable("decision_log", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull(),
  observed: text("observed").notNull(),
  decided: text("decided").notNull(),
  acted: text("acted").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appState = pgTable("app_state", {
  id: serial("id").primaryKey(),
  clockOffsetMs: text("clock_offset_ms").notNull().default("0"),
});

export type Complaint = typeof complaints.$inferSelect;
export type DecisionLog = typeof decisionLog.$inferSelect;
