import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Civic department map ──────────────────────────────────────────────────────

type DeptInfo = {
  dept: string;
  hindi: string;
  escalateTo: string;
  escalateToHindi: string;
  slaHours: { critical: number; high: number; medium: number; low: number };
};

export const DEPT_MAP: Record<string, DeptInfo> = {
  water: {
    dept: "Lucknow Jal Sansthan",
    hindi: "जलकल विभाग, नगर निगम लखनऊ",
    escalateTo: "Chief Engineer, UP Jal Nigam",
    escalateToHindi: "मुख्य अभियंता, उत्तर प्रदेश जल निगम",
    slaHours: { critical: 6, high: 24, medium: 72, low: 168 },
  },
  electricity: {
    dept: "MVVNL / LESA Lucknow",
    hindi: "मध्यांचल विद्युत वितरण निगम लि.",
    escalateTo: "Executive Engineer, MVVNL Lucknow Circle",
    escalateToHindi: "अधिशासी अभियंता, मध्यांचल विद्युत वितरण निगम",
    slaHours: { critical: 4, high: 24, medium: 72, low: 336 },
  },
  roads: {
    dept: "PWD (Lok Nirman Vibhag)",
    hindi: "लोक निर्माण विभाग",
    escalateTo: "Superintending Engineer, PWD Lucknow Zone",
    escalateToHindi: "अधीक्षण अभियंता, लोक निर्माण विभाग",
    slaHours: { critical: 12, high: 48, medium: 120, low: 240 },
  },
  sanitation: {
    dept: "Nagar Nigam Lucknow",
    hindi: "नगर निगम लखनऊ",
    escalateTo: "Municipal Commissioner, Nagar Nigam",
    escalateToHindi: "नगर आयुक्त, नगर निगम लखनऊ",
    slaHours: { critical: 12, high: 48, medium: 120, low: 168 },
  },
  sewerage: {
    dept: "UP Jal Nigam (Sewerage)",
    hindi: "उत्तर प्रदेश जल निगम (मलजल)",
    escalateTo: "Superintending Engineer, UP Jal Nigam Sewerage",
    escalateToHindi: "अधीक्षण अभियंता, उत्तर प्रदेश जल निगम (मलजल)",
    slaHours: { critical: 6, high: 24, medium: 72, low: 168 },
  },
  development: {
    dept: "Lucknow Development Authority (LDA)",
    hindi: "लखनऊ विकास प्राधिकरण",
    escalateTo: "Vice Chairman, LDA",
    escalateToHindi: "उपाध्यक्ष, लखनऊ विकास प्राधिकरण",
    slaHours: { critical: 24, high: 72, medium: 168, low: 336 },
  },
  other: {
    dept: "District Magistrate Office, Lucknow",
    hindi: "जिलाधिकारी कार्यालय, लखनऊ",
    escalateTo: "Divisional Commissioner, Lucknow",
    escalateToHindi: "मंडलायुक्त, लखनऊ मंडल",
    slaHours: { critical: 24, high: 72, medium: 168, low: 336 },
  },
};

export function getSlaMs(category: string, severity: string): number {
  const dept = DEPT_MAP[category] ?? DEPT_MAP.other;
  const hours = dept.slaHours[severity as keyof typeof dept.slaHours] ?? 168;
  return hours * 3600 * 1000;
}

export function generateRefNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `UP-LKO-${year}-${seq}`;
}
