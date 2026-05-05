// Static RPJMN 2025-2029 Asta Cita scoring — ported from rpjmn_tools.py

const ASTA_CITA: Record<string, { name: string; keywords: string[] }> = {
  AC1: { name: "Memperkuat Ideologi Pancasila", keywords: ["pancasila", "ideologi", "kebangsaan", "bhineka", "nasionalisme", "demokrasi", "konstitusi"] },
  AC2: { name: "Memantapkan Sistem Pertahanan dan Keamanan", keywords: ["pertahanan", "keamanan", "militer", "polri", "tni", "siber", "kedaulatan", "batas negara"] },
  AC3: { name: "Meningkatkan Lapangan Kerja Berkualitas", keywords: ["tenaga kerja", "lapangan kerja", "upah", "pengangguran", "industri", "manufaktur", "umkm", "investasi"] },
  AC4: { name: "Membangun dari Desa dan Bawah", keywords: ["desa", "daerah", "otonomi", "desentralisasi", "infrastruktur daerah", "transmigrasi", "perbatasan"] },
  AC5: { name: "Melanjutkan Hilirisasi dan Industrialisasi", keywords: ["hilirisasi", "industrialisasi", "sumber daya alam", "nikel", "batu bara", "kelapa sawit", "ekspor", "nilai tambah"] },
  AC6: { name: "Membangun dari Bawah untuk Pemerataan Ekonomi", keywords: ["pemerataan", "kemiskinan", "ketimpangan", "gini", "bansos", "subsidi", "perlindungan sosial", "inklusif"] },
  AC7: { name: "Memperkuat Reformasi Politik, Hukum, dan Birokrasi", keywords: ["reformasi", "birokrasi", "korupsi", "kpk", "hukum", "regulasi", "tata kelola", "transparansi", "akuntabilitas"] },
  AC8: { name: "Memperkuat Penyelarasan Kehidupan yang Harmonis", keywords: ["lingkungan", "iklim", "energi terbarukan", "digital", "teknologi", "inovasi", "riset", "pendidikan", "kesehatan"] },
};

// RDTII 7 pillars (Paparan's subset)
const RDTII_PILLARS: Record<string, { name: string; keywords: string[] }> = {
  P1: { name: "E-Commerce & Digital Trade", keywords: ["e-commerce", "digital trade", "online marketplace", "cross-border trade", "digital goods"] },
  P2: { name: "Data Governance & Privacy", keywords: ["data governance", "privacy", "personal data", "data protection", "gdpr", "pdp", "data localization"] },
  P3: { name: "Cybersecurity & Trust", keywords: ["cybersecurity", "cyber", "trust", "security", "encryption", "incident response", "cert"] },
  P4: { name: "Digital Inclusion & Capacity", keywords: ["digital inclusion", "capacity building", "digital literacy", "broadband", "connectivity", "access"] },
  P5: { name: "Cross-Border Data Policies", keywords: ["cross-border data", "data transfer", "data flow", "adequacy", "data localization", "data sovereignty"] },
  P6: { name: "Domestic Data Protection", keywords: ["data protection", "dpa", "breach notification", "data subject rights", "consent", "retention"] },
  P7: { name: "Digital Infrastructure", keywords: ["digital infrastructure", "cloud", "5g", "fiber", "data center", "internet exchange"] },
};

export function scoreRpjmn(text: string): Record<string, number> {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [id, pillar] of Object.entries(ASTA_CITA)) {
    const hits = pillar.keywords.filter(kw => lower.includes(kw)).length;
    scores[id] = Math.round(Math.min(hits / Math.max(pillar.keywords.length * 0.4, 1), 1) * 1000) / 1000;
  }
  return scores;
}

export function scoreRdtii(text: string): Record<string, number> {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [id, pillar] of Object.entries(RDTII_PILLARS)) {
    const hits = pillar.keywords.filter(kw => lower.includes(kw)).length;
    scores[id] = Math.round(Math.min(hits / Math.max(pillar.keywords.length * 0.4, 1), 1) * 1000) / 1000;
  }
  return scores;
}

export function urgencyScore(brief: { developments: Array<{ impact: string }> }): number {
  const highCount = brief.developments.filter(d => d.impact === "HIGH").length;
  return Math.min(highCount / Math.max(brief.developments.length, 1), 1);
}
