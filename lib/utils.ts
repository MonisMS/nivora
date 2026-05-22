export const DEPT_MAP: Record<string, {
  dept: string; hindi: string;
  escalateTo: string; escalateToHindi: string;
  slaHours: Record<string, number>;
}> = {
  water: {
    dept: "Lucknow Jal Sansthan",
    hindi: "जलकल विभाग, नगर निगम लखनऊ",
    escalateTo: "Chief Engineer, UP Jal Nigam",
    escalateToHindi: "मुख्य अभियंता, उत्तर प्रदेश जल निगम",
    slaHours: { critical: 24, high: 72, medium: 168, low: 360 },
  },
  electricity: {
    dept: "MVVNL / LESA Lucknow",
    hindi: "मध्यांचल विद्युत वितरण निगम लि.",
    escalateTo: "Executive Engineer, MVVNL Lucknow Circle",
    escalateToHindi: "अधिशासी अभियंता, मध्यांचल विद्युत वितरण निगम",
    slaHours: { critical: 24, high: 72, medium: 168, low: 360 },
  },
  roads: {
    dept: "PWD (Lok Nirman Vibhag)",
    hindi: "लोक निर्माण विभाग",
    escalateTo: "Superintending Engineer, PWD Lucknow Zone",
    escalateToHindi: "अधीक्षण अभियंता, लोक निर्माण विभाग",
    slaHours: { critical: 48, high: 120, medium: 240, low: 720 },
  },
  sanitation: {
    dept: "Nagar Nigam Lucknow",
    hindi: "नगर निगम लखनऊ",
    escalateTo: "Municipal Commissioner, Lucknow Nagar Nigam",
    escalateToHindi: "नगर आयुक्त, नगर निगम लखनऊ",
    slaHours: { critical: 24, high: 72, medium: 168, low: 360 },
  },
  sewerage: {
    dept: "UP Jal Nigam (Sewerage)",
    hindi: "उत्तर प्रदेश जल निगम (मलजल)",
    escalateTo: "Chief Engineer, UP Jal Nigam",
    escalateToHindi: "मुख्य अभियंता, उत्तर प्रदेश जल निगम",
    slaHours: { critical: 24, high: 72, medium: 168, low: 360 },
  },
  development: {
    dept: "Lucknow Development Authority (LDA)",
    hindi: "लखनऊ विकास प्राधिकरण",
    escalateTo: "Vice Chairman, Lucknow Development Authority",
    escalateToHindi: "उपाध्यक्ष, लखनऊ विकास प्राधिकरण",
    slaHours: { critical: 72, high: 168, medium: 336, low: 720 },
  },
  other: {
    dept: "Nagar Nigam Lucknow",
    hindi: "नगर निगम लखनऊ",
    escalateTo: "Municipal Commissioner, Lucknow",
    escalateToHindi: "नगर आयुक्त, लखनऊ नगर निगम",
    slaHours: { critical: 24, high: 72, medium: 168, low: 360 },
  },
};

export function getSlaMs(category: string, severity: string): number {
  const dept = DEPT_MAP[category] ?? DEPT_MAP.other;
  const hours = dept.slaHours[severity] ?? 168;
  return hours * 3600 * 1000;
}

export function generateRefNumber(): string {
  const serial = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `UP-LKO-${year}-${serial}`;
}
