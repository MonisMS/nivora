import "server-only";
import { db } from "@/lib/db";
import { complaints } from "@/lib/schema";
import { logDecision } from "@/lib/agent/run";

export async function seedComplaints() {
  const now = Date.now();
  const h = (n: number) => (now + n * 3600 * 1000).toString();

  const seeds = [
    // ── Already breached → escalates on FIRST advance-clock click ────────────
    {
      refNumber: "UP-LKO-2026-1001",
      text: "Indira Nagar mein transformer phunk gaya, poore mohalle ki bijli gul hai. Bachche hain ghar mein, bahut takleef ho rahi hai.",
      hindiText: "इंदिरा नगर में ट्रांसफार्मर फुंक गया, पूरे मोहल्ले की बिजली गुल है।",
      category: "electricity", severity: "critical",
      department: "MVVNL / LESA Lucknow", departmentHindi: "मध्यांचल विद्युत वितरण निगम लि.",
      locality: "Indira Nagar", status: "pending", escalationLevel: 0,
      slaDeadlineMs: h(-30),
      hindiUpdate: "आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: UP-LKO-2026-1001।\nयह शिकायत \"मध्यांचल विद्युत वितरण निगम\" को भेज दी गई है। निर्धारित समय: 24 घंटे।",
    },
    {
      refNumber: "UP-LKO-2026-1002",
      text: "Chowk area mein sewer line phat gayi hai. Ganda paani sadak par bah raha hai. Bimari failne ka darr hai.",
      hindiText: "चौक में सीवर लाइन फट गई, गंदा पानी सड़क पर बह रहा है।",
      category: "sewerage", severity: "critical",
      department: "UP Jal Nigam (Sewerage)", departmentHindi: "उत्तर प्रदेश जल निगम (मलजल)",
      locality: "Chowk", status: "pending", escalationLevel: 0,
      slaDeadlineMs: h(-10),
      hindiUpdate: "आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: UP-LKO-2026-1002।",
    },

    // ── Breaches after 1 advance of 24h ──────────────────────────────────────
    {
      refNumber: "UP-LKO-2026-1003",
      text: "Aliganj Sector O mein teen din se paani nahi aa raha. Tanker bhi nahi aaya. Peene ka paani kharidna pad raha hai.",
      hindiText: "अलीगंज में तीन दिन से पानी नहीं आ रहा।",
      category: "water", severity: "high",
      department: "Lucknow Jal Sansthan", departmentHindi: "जलकल विभाग, नगर निगम लखनऊ",
      locality: "Aliganj", status: "pending", escalationLevel: 0,
      slaDeadlineMs: h(20),
      hindiUpdate: "आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: UP-LKO-2026-1003।\nनिर्धारित समय: 72 घंटे।",
    },
    {
      refNumber: "UP-LKO-2026-1004",
      text: "Hazratganj main road par bahut bade gadde hain. Roz accidents ho rahe hain. Ek aadmi kal gir ke ghayil hua.",
      hindiText: "हजरतगंज मुख्य सड़क पर गड्ढे हैं, रोज दुर्घटनाएं हो रही हैं।",
      category: "roads", severity: "high",
      department: "PWD (Lok Nirman Vibhag)", departmentHindi: "लोक निर्माण विभाग",
      locality: "Hazratganj", status: "pending", escalationLevel: 0,
      slaDeadlineMs: h(18),
      hindiUpdate: "आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: UP-LKO-2026-1004।",
    },
    {
      refNumber: "UP-LKO-2026-1005",
      text: "Rajajipuram mein roz 8 ghante bijli katoti ho rahi hai. Ghar mein bujurg hain aur unhe dikkat ho rahi hai.",
      hindiText: "राजाजीपुरम में रोज 8 घंटे बिजली कटौती हो रही है।",
      category: "electricity", severity: "high",
      department: "MVVNL / LESA Lucknow", departmentHindi: "मध्यांचल विद्युत वितरण निगम लि.",
      locality: "Rajajipuram", status: "pending", escalationLevel: 0,
      slaDeadlineMs: h(16),
      hindiUpdate: "आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: UP-LKO-2026-1005।",
    },

    // ── Longer SLA — stays pending longer ────────────────────────────────────
    {
      refNumber: "UP-LKO-2026-1006",
      text: "Alambagh mein street lights ek mahine se kharab hain. Raat mein andhera rehta hai, mahilaon ko darr lagta hai.",
      hindiText: "आलमबाग में स्ट्रीट लाइट एक महीने से खराब हैं।",
      category: "sanitation", severity: "medium",
      department: "Nagar Nigam Lucknow", departmentHindi: "नगर निगम लखनऊ",
      locality: "Alambagh", status: "pending", escalationLevel: 0,
      slaDeadlineMs: h(120),
      hindiUpdate: "आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: UP-LKO-2026-1006।",
    },
    {
      refNumber: "UP-LKO-2026-1007",
      text: "Gomti Nagar mein LDA ki zameen par aavaasi nirman ho raha hai. Koi rok nahi hai.",
      hindiText: "गोमती नगर में LDA की जमीन पर अवैध निर्माण हो रहा है।",
      category: "development", severity: "medium",
      department: "Lucknow Development Authority (LDA)", departmentHindi: "लखनऊ विकास प्राधिकरण",
      locality: "Gomti Nagar", status: "pending", escalationLevel: 0,
      slaDeadlineMs: h(150),
      hindiUpdate: "आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: UP-LKO-2026-1007।",
    },
    {
      refNumber: "UP-LKO-2026-1008",
      text: "Chinhat mein peene ke paani mein badbu aur gandagi aa rahi hai. Logon ko pet ki bimari ho rahi hai.",
      hindiText: "चिनहट में पीने के पानी में बदबू और गंदगी आ रही है।",
      category: "water", severity: "high",
      department: "Lucknow Jal Sansthan", departmentHindi: "जलकल विभाग, नगर निगम लखनऊ",
      locality: "Chinhat", status: "pending", escalationLevel: 0,
      slaDeadlineMs: h(60),
      hindiUpdate: "आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: UP-LKO-2026-1008।",
    },
    {
      refNumber: "UP-LKO-2026-1009",
      text: "Aminabad bazaar mein nali jam hone se paani bhar gaya hai. Dukan wale pareshan hain.",
      hindiText: "अमीनाबाद बाजार में नाली जाम होने से जलभराव हो गया है।",
      category: "sanitation", severity: "medium",
      department: "Nagar Nigam Lucknow", departmentHindi: "नगर निगम लखनऊ",
      locality: "Aminabad", status: "pending", escalationLevel: 0,
      slaDeadlineMs: h(100),
      hindiUpdate: "आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: UP-LKO-2026-1009।",
    },
    {
      refNumber: "UP-LKO-2026-1010",
      text: "Aliganj mein bijli ka bill galat aaya hai. Meter reading ghalat hai, 3000 rupaye zyada charge kiye hain.",
      hindiText: "अलीगंज में बिजली का बिल गलत आया है, 3000 रुपये ज्यादा।",
      category: "electricity", severity: "low",
      department: "MVVNL / LESA Lucknow", departmentHindi: "मध्यांचल विद्युत वितरण निगम लि.",
      locality: "Aliganj", status: "pending", escalationLevel: 0,
      slaDeadlineMs: h(300),
      hindiUpdate: "आपकी शिकायत दर्ज कर ली गई है। संदर्भ संख्या: UP-LKO-2026-1010।",
    },

    // ── Already resolved — shows happy path ──────────────────────────────────
    {
      refNumber: "UP-LKO-2026-1011",
      text: "Gomti Nagar Vinay Khand mein kuda ek hafte se nahi utha. Badbu aa rahi thi.",
      hindiText: "गोमती नगर विनय खंड में कूड़ा एक हफ्ते से नहीं उठा था।",
      category: "sanitation", severity: "medium",
      department: "Nagar Nigam Lucknow", departmentHindi: "नगर निगम लखनऊ",
      locality: "Gomti Nagar", status: "resolved", escalationLevel: 0,
      slaDeadlineMs: h(-120),
      hindiUpdate: "आपकी शिकायत (UP-LKO-2026-1011) का समाधान हो गया है। नगर निगम की टीम ने कूड़ा उठा लिया। धन्यवाद।",
    },
    {
      refNumber: "UP-LKO-2026-1012",
      text: "Indira Nagar mein sadak ki hole patch kiya gaya. Sukriya.",
      hindiText: "इंदिरा नगर की सड़क का गड्ढा भर दिया गया।",
      category: "roads", severity: "low",
      department: "PWD (Lok Nirman Vibhag)", departmentHindi: "लोक निर्माण विभाग",
      locality: "Indira Nagar", status: "resolved", escalationLevel: 0,
      slaDeadlineMs: h(-200),
      hindiUpdate: "आपकी शिकायत (UP-LKO-2026-1012) का समाधान हो गया है। सड़क की मरम्मत कर दी गई है।",
    },

    // ── Already escalated — shows escalated state ─────────────────────────────
    {
      refNumber: "UP-LKO-2026-1013",
      text: "Chinhat mein live electric wire sadak par latki hai. Bachche khel rahe hain wahan, bahut khatarnak hai.",
      hindiText: "चिनहट में बिजली का तार सड़क पर लटक रहा है, करंट का खतरा।",
      category: "electricity", severity: "critical",
      department: "Executive Engineer, MVVNL Lucknow Circle", departmentHindi: "अधिशासी अभियंता, मध्यांचल विद्युत वितरण निगम",
      locality: "Chinhat", status: "escalated", escalationLevel: 1,
      slaDeadlineMs: h(-48),
      hindiUpdate: "सूचना: आपकी शिकायत (UP-LKO-2026-1013) निर्धारित समय में हल नहीं हुई। इसे उच्च अधिकारी (अधिशासी अभियंता, MVVNL) को स्वतः अग्रेषित कर दिया गया है।",
    },
    {
      refNumber: "UP-LKO-2026-1014",
      text: "Alambagh mein sadak khudi padi hai, chhe mahine se kaam adhura hai. Roz log gir rahe hain.",
      hindiText: "आलमबाग में सड़क खुदी पड़ी है, 6 महीने से काम अधूरा।",
      category: "roads", severity: "high",
      department: "Superintending Engineer, PWD Lucknow Zone", departmentHindi: "अधीक्षण अभियंता, लोक निर्माण विभाग",
      locality: "Alambagh", status: "escalated", escalationLevel: 1,
      slaDeadlineMs: h(-96),
      hindiUpdate: "सूचना: आपकी शिकायत (UP-LKO-2026-1014) SLA उल्लंघन के कारण उच्च अधिकारी को अग्रेषित की गई है।",
    },
    {
      refNumber: "UP-LKO-2026-1015",
      text: "Hazratganj mein paani ki main pipeline phat gayi. Hazaron litre paani barbaad ho raha hai.",
      hindiText: "हजरतगंज में पानी की मुख्य पाइपलाइन फटी, हजारों लीटर बर्बाद।",
      category: "water", severity: "critical",
      department: "Chief Engineer, UP Jal Nigam", departmentHindi: "मुख्य अभियंता, उत्तर प्रदेश जल निगम",
      locality: "Hazratganj", status: "escalated", escalationLevel: 2,
      slaDeadlineMs: h(-72),
      hindiUpdate: "सूचना: आपकी शिकायत (UP-LKO-2026-1015) दूसरी बार उच्च अधिकारी को अग्रेषित की गई है। शीघ्र समाधान हेतु कार्रवाई जारी है।",
    },
  ];

  let seeded = 0;
  let skipped = 0;

  for (const seed of seeds) {
    const [c] = await db
      .insert(complaints)
      .values(seed)
      .onConflictDoNothing()
      .returning();

    if (!c) { skipped++; continue; } // already exists

    await logDecision(
      c.id,
      `Complaint filed: "${seed.text.slice(0, 80)}"`,
      `${seed.category.toUpperCase()} / ${seed.severity.toUpperCase()} → ${seed.department}`,
      `Registered ${seed.refNumber}. Status: ${seed.status}. SLA set.`
    ).catch((err) => console.error(`[seed] logDecision failed for ${seed.refNumber}:`, err));

    seeded++;
  }

  return { seeded, skipped, total: seeds.length };
}
