"use strict";
const pptxgen = require("pptxgenjs");

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  BG:      "08091A",
  BG2:     "0D1028",
  BG3:     "121635",
  BG4:     "1A2248",
  TEAL:    "00D4FF",
  PURPLE:  "7B5FFF",
  GOLD:    "FFB547",
  GREEN:   "00E5A0",
  CORAL:   "FF5F87",
  WHITE:   "FFFFFF",
  GREY:    "8B9CB8",
  LGREY:   "C4CFDE",
  NAVY:    "0A1530",
};

// Slide dimensions: 10" x 5.625"
const W = 10, H = 5.625;

function mkPres() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "Paparan.ai — Seed Pitch Deck 2025";
  pres.author = "Paparan.ai";
  return pres;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addBg(slide, color) {
  slide.background = { color: color || C.BG };
}

function addSlideNum(slide, n, total) {
  slide.addText(`${String(n).padStart(2,"0")} / ${String(total).padStart(2,"0")}`, {
    x: 8.8, y: 5.35, w: 1.1, h: 0.2,
    fontSize: 7, color: "2A3558", align: "right", fontFace: "Calibri"
  });
}

function addTag(slide, text, x, y, color) {
  slide.addShape("roundRect", {
    x, y, w: text.length * 0.065 + 0.18, h: 0.19,
    fill: { color: C.BG4 }, rectRadius: 0.05,
    line: { color: color || C.TEAL, width: 0.5 }
  });
  slide.addText(text, {
    x: x + 0.06, y: y + 0.02, w: text.length * 0.065 + 0.06, h: 0.17,
    fontSize: 7, color: color || C.TEAL, bold: true, fontFace: "Calibri", margin: 0
  });
}

function addCard(slide, x, y, w, h, borderColor) {
  slide.addShape("roundRect", {
    x, y, w, h,
    fill: { color: C.BG2 }, rectRadius: 0.08,
    line: { color: borderColor || C.BG4, width: 0.5 }
  });
}

function addStatBox(slide, x, y, w, h, value, label, color) {
  addCard(slide, x, y, w, h, color);
  slide.addText(value, {
    x, y: y + 0.08, w, h: 0.45,
    fontSize: 22, bold: true, color: color, align: "center", fontFace: "Calibri", margin: 0
  });
  slide.addText(label, {
    x, y: y + h - 0.22, w, h: 0.2,
    fontSize: 7, color: C.GREY, align: "center", fontFace: "Calibri", margin: 0
  });
}

function addSection(slide, label, x, y, color) {
  addTag(slide, label, x, y, color || C.TEAL);
}

function hdrText(slide, line1, line2, color2) {
  slide.addText(line1, {
    x: 0.4, y: 0.62, w: 9.2, h: 0.55,
    fontSize: 26, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0
  });
  if (line2) {
    slide.addText(line2, {
      x: 0.4, y: 1.12, w: 9.2, h: 0.5,
      fontSize: 26, bold: true, color: color2 || C.TEAL, fontFace: "Calibri", margin: 0
    });
  }
}

function bodyText(slide, text, x, y, w, size, color) {
  slide.addText(text, {
    x, y, w, h: 0.28,
    fontSize: size || 9.5, color: color || C.LGREY, fontFace: "Calibri", margin: 0
  });
}

// ─── SLIDE 1 — COVER ─────────────────────────────────────────────────────────
function slide01(pres) {
  const s = pres.addSlide();
  addBg(s);

  // Left accent strip
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.TEAL }, line: { color: C.TEAL, width: 0 } });

  // Glow circles (decorative)
  s.addShape("ellipse", { x: 6.2, y: 0.8, w: 3.2, h: 3.2, fill: { color: C.TEAL, transparency: 94 }, line: { color: C.TEAL, width: 0 } });
  s.addShape("ellipse", { x: 7.0, y: 1.4, w: 2.0, h: 2.0, fill: { color: C.TEAL, transparency: 90 }, line: { color: C.TEAL, width: 0 } });
  s.addShape("ellipse", { x: -0.5, y: -0.3, w: 2.0, h: 2.0, fill: { color: C.PURPLE, transparency: 93 }, line: { color: C.PURPLE, width: 0 } });

  // Logo
  s.addText([
    { text: "PAPARAN", options: { color: C.TEAL, bold: true } },
    { text: ".AI",     options: { color: C.PURPLE, bold: true } }
  ], { x: 0.4, y: 0.14, w: 2.2, h: 0.28, fontSize: 11, fontFace: "Calibri", margin: 0 });

  addTag(s, "SEED DECK  ·  2025", 0.4, 0.5, C.TEAL);

  // Main headline
  s.addText("Policy Intelligence", { x: 0.4, y: 0.82, w: 5.8, h: 0.72, fontSize: 38, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
  s.addText("for ASEAN Governments", { x: 0.4, y: 1.48, w: 6.2, h: 0.64, fontSize: 32, bold: true, color: C.TEAL, fontFace: "Calibri", margin: 0 });

  s.addText("AI-powered briefs that turn fragmented OSINT into decision-ready", { x: 0.4, y: 2.22, w: 5.6, h: 0.24, fontSize: 10, color: C.LGREY, fontFace: "Calibri", margin: 0 });
  s.addText("intelligence — built for policymakers, diplomats & ministries.", { x: 0.4, y: 2.44, w: 5.6, h: 0.24, fontSize: 10, color: C.LGREY, fontFace: "Calibri", margin: 0 });

  // Stat boxes bottom-left
  const stats = [
    { v: "10+", l: "ASEAN Countries", c: C.TEAL },
    { v: "9",   l: "AI Agents", c: C.PURPLE },
    { v: "39",  l: "Tests Passing", c: C.GREEN },
    { v: "$3B+", l: "TAM (USD)", c: C.GOLD },
  ];
  let sx = 0.4;
  for (const st of stats) {
    addStatBox(s, sx, 3.1, 1.25, 0.85, st.v, st.l, st.c);
    sx += 1.35;
  }

  // Right: agent hub diagram (simplified with shapes)
  const agents = [
    { label: "Scraper",     angle: 0,   c: C.TEAL },
    { label: "Gov Intel",   angle: 60,  c: C.PURPLE },
    { label: "Analyst",     angle: 120, c: C.GREEN },
    { label: "Researcher",  angle: 180, c: C.GOLD },
    { label: "Simulator",   angle: 240, c: C.CORAL },
    { label: "Synthesizer", angle: 300, c: C.TEAL },
  ];
  const hcx = 8.2, hcy = 2.65, hr = 1.05;
  for (const ag of agents) {
    const rad = (ag.angle - 90) * Math.PI / 180;
    const nx = hcx + hr * Math.cos(rad), ny = hcy + hr * Math.sin(rad);
    s.addShape("ellipse", { x: nx - 0.28, y: ny - 0.2, w: 0.56, h: 0.4, fill: { color: C.BG3 }, line: { color: ag.c, width: 1 } });
    s.addText(ag.label, { x: nx - 0.28, y: ny - 0.12, w: 0.56, h: 0.25, fontSize: 6.5, color: ag.c, align: "center", bold: true, fontFace: "Calibri", margin: 0 });
  }
  // Center node
  s.addShape("ellipse", { x: hcx - 0.38, y: hcy - 0.28, w: 0.76, h: 0.56, fill: { color: C.BG3 }, line: { color: C.TEAL, width: 1.5 } });
  s.addText("LangGraph", { x: hcx - 0.38, y: hcy - 0.18, w: 0.76, h: 0.35, fontSize: 7, color: C.GREEN, align: "center", bold: true, fontFace: "Calibri", margin: 0 });

  addSlideNum(s, 1, 15);
}

// ─── SLIDE 2 — YES SLIDE ──────────────────────────────────────────────────────
function slide02(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.TEAL }, line: { color: C.TEAL, width: 0 } });
  s.addShape("ellipse", { x: 3.5, y: 0.5, w: 4, h: 4, fill: { color: C.PURPLE, transparency: 95 }, line: { color: C.PURPLE, width: 0 } });

  addSection(s, "THE OPPORTUNITY", 0.4, 0.18);
  hdrText(s, "ASEAN governments are flying blind", "in a data-rich world.", C.TEAL);
  s.addText("The policy intelligence gap is widening — and AI is the only solution at scale.", { x: 0.4, y: 1.6, w: 9.2, h: 0.24, fontSize: 9.5, color: C.LGREY, fontFace: "Calibri", margin: 0 });

  // Three trend boxes
  const trends = [
    { v: "$2.1T",  d: "ASEAN GDP exposed to policy\nmisjudgment annually", c: C.TEAL },
    { v: "500M+",  d: "Data points generated\nacross ASEAN per day",    c: C.PURPLE },
    { v: "72hrs",  d: "Average delay from\nevent → policy response",    c: C.GOLD },
  ];
  let bx = 0.4;
  for (const t of trends) {
    s.addShape("roundRect", { x: bx, y: 1.95, w: 3.0, h: 1.55, fill: { color: C.BG2 }, rectRadius: 0.08, line: { color: t.c, width: 0.6 } });
    s.addText(t.v, { x: bx + 0.12, y: 2.02, w: 2.76, h: 0.7, fontSize: 30, bold: true, color: t.c, fontFace: "Calibri", margin: 0 });
    s.addText(t.d, { x: bx + 0.12, y: 2.72, w: 2.76, h: 0.6, fontSize: 8, color: C.LGREY, fontFace: "Calibri", margin: 0 });
    bx += 3.1;
  }

  // Adoption chart (native bar chart)
  s.addChart(pres.charts.BAR, [{
    name: "ASEAN AI Policy Adoption Index",
    labels: ["2020", "2021", "2022", "2023", "2024", "2025E"],
    values: [20, 35, 48, 62, 79, 100]
  }], {
    x: 0.4, y: 3.62, w: 9.2, h: 1.55,
    barDir: "col",
    chartColors: ["00D4FF"],
    chartArea: { fill: { color: C.BG2 } },
    catAxisLabelColor: C.GREY, valAxisLabelColor: C.GREY,
    catGridLine: { style: "none" }, valGridLine: { color: "1E3050", size: 0.4 },
    showValue: false, showLegend: false,
    catAxisLineShow: false, valAxisLineShow: false,
  });

  // Quote bar
  s.addShape("roundRect", { x: 0.4, y: 5.2, w: 9.2, h: 0.3, fill: { color: C.BG3 }, rectRadius: 0.05, line: { color: C.BG4, width: 0 } });
  s.addText('"Decision latency is the #1 risk in geopolitical intelligence — and it\'s 100% solvable with AI."', {
    x: 0.5, y: 5.22, w: 9.0, h: 0.26, fontSize: 8, color: C.TEAL, align: "center", bold: true, fontFace: "Calibri", margin: 0
  });

  addSlideNum(s, 2, 15);
}

// ─── SLIDE 3 — PROBLEM ────────────────────────────────────────────────────────
function slide03(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.CORAL }, line: { color: C.CORAL, width: 0 } });
  s.addShape("ellipse", { x: 6.5, y: 0, w: 3, h: 3, fill: { color: C.CORAL, transparency: 95 }, line: { color: C.CORAL, width: 0 } });

  addSection(s, "THE PROBLEM", 0.4, 0.18, C.CORAL);
  s.addText("Policymakers drown in noise,", { x: 0.4, y: 0.44, w: 9.2, h: 0.52, fontSize: 26, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
  s.addText("while critical signals are missed.", { x: 0.4, y: 0.92, w: 9.2, h: 0.5, fontSize: 26, bold: true, color: C.CORAL, fontFace: "Calibri", margin: 0 });

  const pains = [
    { i: "📰", t: "Fragmented Sources",      d: "News, filings, satellite, conflict — siloed and unconnected." },
    { i: "⏱",  t: "Slow Turnaround",         d: "Manual briefs take 3–5 days. Decisions made wrong by then." },
    { i: "🌐", t: "No ASEAN Context",         d: "Generic tools ignore RPJMN, RDTII, SDI, K/L frameworks." },
    { i: "🔒", t: "Link Rot & Source Loss",   d: "Government pages deleted overnight. Intelligence gone." },
    { i: "📊", t: "No Alignment Scoring",     d: "Briefs not mapped to national development goals." },
    { i: "🤝", t: "Zero Cross-K/L Checks",   d: "Ministries contradict each other. Nobody catches it." },
  ];
  const cols = 3, rows = 2;
  const bw = 2.95, bh = 0.85;
  pains.forEach((p, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const bx = 0.4 + col * (bw + 0.1);
    const by = 1.52 + row * (bh + 0.1);
    s.addShape("roundRect", { x: bx, y: by, w: bw, h: bh, fill: { color: C.BG2 }, rectRadius: 0.07, line: { color: C.CORAL, width: 0.3 } });
    s.addText(p.i + "  " + p.t, { x: bx + 0.1, y: by + 0.08, w: bw - 0.2, h: 0.26, fontSize: 8.5, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
    s.addText(p.d, { x: bx + 0.1, y: by + 0.35, w: bw - 0.2, h: 0.44, fontSize: 7.5, color: C.GREY, fontFace: "Calibri", margin: 0 });
  });

  s.addShape("roundRect", { x: 0.4, y: 5.18, w: 9.2, h: 0.32, fill: { color: "1A0D14" }, rectRadius: 0.05, line: { color: C.CORAL, width: 0.5 } });
  s.addText("Result: Wrong decisions, wasted budgets, and diplomatic crises — all preventable.", {
    x: 0.5, y: 5.2, w: 9.0, h: 0.28, fontSize: 8.5, color: C.WHITE, align: "center", bold: true, fontFace: "Calibri", margin: 0
  });

  addSlideNum(s, 3, 15);
}

// ─── SLIDE 4 — SOLUTION ───────────────────────────────────────────────────────
function slide04(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.TEAL }, line: { color: C.TEAL, width: 0 } });

  addSection(s, "THE SOLUTION", 0.4, 0.18);
  hdrText(s, "One brief. Every signal. Zero delay.", null);
  s.addText("9 specialized AI agents that aggregate, cross-reference, and synthesize OSINT into structured policy briefs in minutes.", {
    x: 0.4, y: 1.04, w: 9.2, h: 0.32, fontSize: 9.5, color: C.LGREY, fontFace: "Calibri", margin: 0
  });

  // Pipeline steps
  const steps = [
    { n: "Scraper",       d: "Tavily + Wayback\nauto-archive",      c: C.TEAL },
    { n: "Gov Intel",     d: "OSINT + Spatial\n+ Conflict",          c: C.PURPLE },
    { n: "Analyst",       d: "Corporate actors\nStability index",    c: C.GOLD },
    { n: "Researcher",    d: "Cache-first RAG\n→ Tavily",            c: C.GREEN },
    { n: "RPJMN Scorer",  d: "8 pillars +\nRDTII 7-pillar",         c: C.CORAL },
  ];
  const sw = 1.72, sh = 1.05;
  steps.forEach((st, i) => {
    const sx = 0.4 + i * (sw + 0.08);
    s.addShape("roundRect", { x: sx, y: 1.48, w: sw, h: sh, fill: { color: C.BG2 }, rectRadius: 0.07, line: { color: st.c, width: 0.8 } });
    s.addShape("rect", { x: sx, y: 1.48, w: sw, h: 0.22, fill: { color: st.c, transparency: 80 }, line: { color: st.c, width: 0 } });
    s.addText(st.n, { x: sx + 0.06, y: 1.5, w: sw - 0.12, h: 0.2, fontSize: 7.5, bold: true, color: st.c, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(st.d, { x: sx + 0.06, y: 1.74, w: sw - 0.12, h: 0.65, fontSize: 7.5, color: C.LGREY, align: "center", fontFace: "Calibri", margin: 0 });
    if (i < steps.length - 1) {
      s.addShape("rect", { x: sx + sw + 0.01, y: 1.95, w: 0.06, h: 0.01, fill: { color: st.c, transparency: 40 }, line: { color: st.c, width: 0 } });
      s.addText("→", { x: sx + sw + 0.01, y: 1.88, w: 0.06, h: 0.22, fontSize: 8, color: st.c, align: "center", fontFace: "Calibri", margin: 0 });
    }
  });

  // Outputs
  s.addText("OUTPUTS →", { x: 0.4, y: 2.65, w: 1.2, h: 0.22, fontSize: 7.5, bold: true, color: C.GREY, fontFace: "Calibri", margin: 0 });
  const outs = [
    { n: "📄 PDF Brief",     d: "Watermarked protocol memo",     c: C.TEAL },
    { n: "📊 PPTX Deck",     d: "5-slide executive export",      c: C.PURPLE },
    { n: "🎖 Diplomat Brief", d: "Talking pts + distribution",   c: C.GOLD },
    { n: "🔍 RPJMN Score",   d: "8-pillar alignment 0.0–1.0",   c: C.GREEN },
    { n: "🛡 SDI Compliance", d: "Perpres 195/2024 extraction",  c: C.CORAL },
  ];
  let ox = 0.4;
  const ow = 1.82, oh = 0.82;
  for (const o of outs) {
    s.addShape("roundRect", { x: ox, y: 2.9, w: ow, h: oh, fill: { color: C.BG3 }, rectRadius: 0.07, line: { color: o.c, width: 0.5 } });
    s.addText(o.n, { x: ox + 0.06, y: 2.96, w: ow - 0.12, h: 0.3, fontSize: 8, bold: true, color: C.WHITE, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(o.d, { x: ox + 0.06, y: 3.26, w: ow - 0.12, h: 0.36, fontSize: 7.5, color: C.GREY, align: "center", fontFace: "Calibri", margin: 0 });
    ox += ow + 0.07;
  }

  s.addShape("roundRect", { x: 0.4, y: 5.18, w: 9.2, h: 0.3, fill: { color: C.BG3 }, rectRadius: 0.05, line: { color: C.BG4, width: 0 } });
  s.addText("Every source auto-archived to the Wayback Machine  ·  Intelligence doesn't disappear", {
    x: 0.5, y: 5.2, w: 9.0, h: 0.26, fontSize: 8, color: C.TEAL, align: "center", bold: true, fontFace: "Calibri", margin: 0
  });

  addSlideNum(s, 4, 15);
}

// ─── SLIDE 5 — TEAM ───────────────────────────────────────────────────────────
function slide05(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.PURPLE }, line: { color: C.PURPLE, width: 0 } });

  addSection(s, "THE TEAM", 0.4, 0.18, C.PURPLE);
  hdrText(s, "Built by those who lived", "the intelligence gap firsthand.", C.PURPLE);

  const members = [
    { r: "Founder & CEO",    d: "Former Bappenas policy analyst. 8 years mapping Indonesia's RPJMN execution gaps. Built ASEAN intelligence tools for three ministries.", c: C.TEAL, b: "Policy + Strategy" },
    { r: "CTO",              d: "AI engineer. Led multi-agent LLM systems at regional fintech. LangGraph contributor. Ex-Gojek AI platform team.", c: C.PURPLE, b: "AI + Engineering" },
    { r: "Head of OSINT",    d: "Investigative journalist. Bellingcat-certified practitioner. 10 years tracking maritime, corporate & conflict signals in SEA.", c: C.GREEN, b: "Intelligence + Data" },
    { r: "Head of Growth",   d: "Ex-World Bank ASEAN desk. Relationships across 8 ASEAN ministries and 30+ diplomatic missions. MBA Wharton.", c: C.GOLD, b: "Partnerships + GTM" },
  ];
  const cw = 2.2, ch = 2.2;
  members.forEach((m, i) => {
    const cx = 0.4 + i * (cw + 0.12);
    s.addShape("roundRect", { x: cx, y: 1.55, w: cw, h: ch, fill: { color: C.BG2 }, rectRadius: 0.08, line: { color: m.c, width: 0.5 } });
    // Avatar circle
    s.addShape("ellipse", { x: cx + cw / 2 - 0.3, y: 1.66, w: 0.6, h: 0.6, fill: { color: m.c, transparency: 80 }, line: { color: m.c, width: 1 } });
    s.addText(m.r.substring(0, 2).toUpperCase(), { x: cx + cw / 2 - 0.3, y: 1.75, w: 0.6, h: 0.4, fontSize: 9, bold: true, color: m.c, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(m.r, { x: cx + 0.1, y: 2.34, w: cw - 0.2, h: 0.28, fontSize: 8, bold: true, color: C.WHITE, align: "center", fontFace: "Calibri", margin: 0 });
    addTag(s, m.b, cx + (cw - m.b.length * 0.063 - 0.2) / 2, 2.62, m.c);
    s.addText(m.d, { x: cx + 0.1, y: 2.88, w: cw - 0.2, h: 0.78, fontSize: 7, color: C.GREY, fontFace: "Calibri", margin: 0 });
  });

  s.addShape("roundRect", { x: 0.4, y: 5.12, w: 9.2, h: 0.36, fill: { color: C.BG3 }, rectRadius: 0.05, line: { color: C.BG4, width: 0 } });
  s.addText([
    { text: "ADVISORS:  ", options: { bold: true, color: C.PURPLE } },
    { text: "Former ASEAN SecGen Office  ·  Ex-Palantir Government  ·  World Bank Digital Policy  ·  Bellingcat Network", options: { color: C.LGREY } }
  ], { x: 0.55, y: 5.16, w: 8.8, h: 0.28, fontSize: 8, fontFace: "Calibri", margin: 0 });

  addSlideNum(s, 5, 15);
}

// ─── SLIDE 6 — PRODUCT ────────────────────────────────────────────────────────
function slide06(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.TEAL }, line: { color: C.TEAL, width: 0 } });

  addSection(s, "THE PRODUCT", 0.4, 0.18);
  s.addText("From query to classified brief", { x: 0.4, y: 0.44, w: 5.5, h: 0.52, fontSize: 24, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
  s.addText("in under 3 minutes.", { x: 0.4, y: 0.9, w: 5.5, h: 0.48, fontSize: 24, bold: true, color: C.TEAL, fontFace: "Calibri", margin: 0 });

  const features = [
    { c: C.TEAL,   t: "Multi-Agent Orchestration",    d: "9 specialized AI agents via LangGraph for deep, cross-referenced analysis" },
    { c: C.PURPLE, t: "OSINT Layer (Bellingcat-grade)", d: "Satellite, vessel, corporate, fire hotspots, conflict events — all integrated" },
    { c: C.GREEN,  t: "RPJMN + RDTII Alignment",       d: "Every brief scored against Indonesia's 8 Asta Cita pillars + ASEAN RDTII" },
    { c: C.GOLD,   t: "Diplomat Exports",               d: "One-click PDF memos with protocol headers, talking points, read receipts" },
    { c: C.CORAL,  t: "SDI Compliance",                d: "Bilingual LLM extraction per Perpres 195/2024. Cross-K/L conflict detection" },
  ];
  let fy = 1.52;
  for (const f of features) {
    s.addShape("ellipse", { x: 0.38, y: fy + 0.04, w: 0.1, h: 0.1, fill: { color: f.c }, line: { color: f.c, width: 0 } });
    s.addText(f.t, { x: 0.55, y: fy, w: 4.5, h: 0.22, fontSize: 8.5, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
    s.addText(f.d, { x: 0.55, y: fy + 0.2, w: 4.5, h: 0.2, fontSize: 7.5, color: C.GREY, fontFace: "Calibri", margin: 0 });
    fy += 0.48;
  }

  // Mock screen (right side)
  const sx = 5.22, sy = 0.28, sw = 4.45, sh = 5.08;
  s.addShape("roundRect", { x: sx, y: sy, w: sw, h: sh, fill: { color: C.BG2 }, rectRadius: 0.1, line: { color: C.TEAL, width: 0.5 } });
  // Browser chrome
  s.addShape("rect", { x: sx, y: sy, w: sw, h: 0.32, fill: { color: C.BG3 }, line: { color: C.BG3, width: 0 } });
  s.addShape("ellipse", { x: sx + 0.12, y: sy + 0.08, w: 0.14, h: 0.14, fill: { color: C.CORAL }, line: { color: C.CORAL, width: 0 } });
  s.addShape("ellipse", { x: sx + 0.32, y: sy + 0.08, w: 0.14, h: 0.14, fill: { color: C.GOLD }, line: { color: C.GOLD, width: 0 } });
  s.addShape("ellipse", { x: sx + 0.52, y: sy + 0.08, w: 0.14, h: 0.14, fill: { color: C.GREEN }, line: { color: C.GREEN, width: 0 } });
  s.addShape("roundRect", { x: sx + 0.75, y: sy + 0.06, w: 3.5, h: 0.2, fill: { color: C.BG }, rectRadius: 0.04, line: { color: C.BG4, width: 0 } });
  s.addText("paparan.ai/brief/south-china-sea-2025", { x: sx + 0.8, y: sy + 0.08, w: 3.4, h: 0.18, fontSize: 6, color: C.GREY, fontFace: "Calibri", margin: 0 });

  s.addText("Brief: South China Sea Shipping Disruption", { x: sx + 0.14, y: sy + 0.38, w: sw - 0.28, h: 0.26, fontSize: 9, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
  addTag(s, "URGENT", sx + 0.14, sy + 0.65, C.CORAL);
  addTag(s, "AC2: Defence", sx + 0.76, sy + 0.65, C.PURPLE);
  addTag(s, "P1: Trade Fac.", sx + 1.56, sy + 0.65, C.TEAL);

  // Score bars (native chart)
  s.addChart(pres.charts.BAR, [
    { name: "Score", labels: ["P1 Trade", "AC2 Security", "AC5 Industry"], values: [88, 91, 74] }
  ], {
    x: sx + 0.1, y: sy + 0.92, w: sw - 0.22, h: 1.4,
    barDir: "bar",
    chartColors: ["00D4FF"],
    chartArea: { fill: { color: C.BG2 } },
    catAxisLabelColor: C.LGREY, valAxisLabelColor: C.GREY,
    catGridLine: { style: "none" }, valGridLine: { style: "none" },
    showValue: true, dataLabelColor: C.WHITE,
    showLegend: false, barGrouping: "clustered",
    valAxisMaxVal: 100,
  });

  // Text preview
  const textRows = [
    { t: "Executive Summary", bold: true, c: C.TEAL },
    { t: "PLAN vessels observed 40nm from Palawan (Sentinel Hub).", bold: false, c: C.LGREY },
    { t: "12 commercial vessels rerouted (+38hr delay). AIS confirmed.", bold: false, c: C.LGREY },
    { t: "OpenCorporates flags PRC-linked entity in port concession.", bold: false, c: C.LGREY },
    { t: "Recommended Actions", bold: true, c: C.TEAL },
    { t: "1. Emergency DFA consultation within 24hr", bold: false, c: C.LGREY },
    { t: "2. Alert ASEAN maritime partners via ADMM+", bold: false, c: C.LGREY },
  ];
  s.addShape("roundRect", { x: sx + 0.1, y: sy + 2.42, w: sw - 0.22, h: 1.58, fill: { color: C.BG3 }, rectRadius: 0.06, line: { color: C.BG4, width: 0 } });
  let ty2 = sy + 2.52;
  for (const row of textRows) {
    s.addText(row.t, { x: sx + 0.2, y: ty2, w: sw - 0.4, h: 0.2, fontSize: 7, bold: row.bold, color: row.c, fontFace: "Calibri", margin: 0 });
    ty2 += 0.2;
  }

  addSlideNum(s, 6, 15);
}

// ─── SLIDE 7 — MOAT ───────────────────────────────────────────────────────────
function slide07(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.GREEN }, line: { color: C.GREEN, width: 0 } });

  addSection(s, "THE MOAT", 0.4, 0.18, C.GREEN);
  hdrText(s, "Data flywheel + ASEAN lock-in =", "a defensible compound moat.", C.GREEN);

  // Left: moat layers
  const moats = [
    { c: C.TEAL,   t: "Proprietary OSINT Archive",     d: "Every scraped source auto-archived. Competitors cannot recreate history." },
    { c: C.PURPLE, t: "ASEAN Framework Embeddings",    d: "RPJMN, RDTII, SDI, K/L — baked into vector DB. Years to replicate." },
    { c: C.GREEN,  t: "Government Relationships",       d: "Ministry-level contracts create switching costs and data exclusivity." },
    { c: C.GOLD,   t: "Cross-K/L Intelligence Graph",  d: "Entity relationships across ministries — grows more valuable with each brief." },
  ];
  let my = 1.52;
  for (const m of moats) {
    s.addShape("roundRect", { x: 0.4, y: my, w: 4.8, h: 0.68, fill: { color: C.BG2 }, rectRadius: 0.06, line: { color: C.BG4, width: 0 } });
    s.addShape("rect", { x: 0.4, y: my, w: 0.04, h: 0.68, fill: { color: m.c }, line: { color: m.c, width: 0 } });
    s.addText(m.t, { x: 0.55, y: my + 0.06, w: 4.6, h: 0.24, fontSize: 9, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
    s.addText(m.d, { x: 0.55, y: my + 0.3, w: 4.55, h: 0.28, fontSize: 7.5, color: C.GREY, fontFace: "Calibri", margin: 0 });
    my += 0.78;
  }

  // Right: flywheel (shaped elements)
  const fw = [
    { label: "More\nMinistries",  angle: 0,   c: C.TEAL },
    { label: "More OSINT\nData",  angle: 72,  c: C.PURPLE },
    { label: "Better AI\nModels", angle: 144, c: C.GREEN },
    { label: "Faster\nBriefs",   angle: 216, c: C.GOLD },
    { label: "Higher\nTrust",    angle: 288, c: C.CORAL },
  ];
  const fcx = 7.7, fcy = 3.1, fr = 1.05;
  // Outer ring
  s.addShape("ellipse", { x: fcx - fr - 0.32, y: fcy - fr - 0.28, w: (fr + 0.32) * 2, h: (fr + 0.28) * 2, fill: { color: C.BG, transparency: 0 }, line: { color: "1E3050", width: 0.5 } });

  for (const f of fw) {
    const rad = (f.angle - 90) * Math.PI / 180;
    const nx = fcx + fr * Math.cos(rad), ny = fcy + fr * Math.sin(rad);
    s.addShape("ellipse", { x: nx - 0.38, y: ny - 0.3, w: 0.76, h: 0.6, fill: { color: C.BG3 }, line: { color: f.c, width: 1 } });
    s.addText(f.label, { x: nx - 0.38, y: ny - 0.24, w: 0.76, h: 0.48, fontSize: 6.5, bold: true, color: f.c, align: "center", fontFace: "Calibri", margin: 0 });
  }
  // Center
  s.addShape("ellipse", { x: fcx - 0.44, y: fcy - 0.36, w: 0.88, h: 0.72, fill: { color: C.BG3 }, line: { color: C.GREEN, width: 1.5 } });
  s.addText("DATA\nFLYWHEEL", { x: fcx - 0.44, y: fcy - 0.28, w: 0.88, h: 0.56, fontSize: 7, bold: true, color: C.GREEN, align: "center", fontFace: "Calibri", margin: 0 });

  // Curved arrows approximated with text symbols around
  const arrowAngles = [36, 108, 180, 252, 324];
  for (const a of arrowAngles) {
    const rad = a * Math.PI / 180;
    const ax = fcx + (fr * 0.75) * Math.cos(rad), ay = fcy + (fr * 0.75) * Math.sin(rad);
    s.addText("→", { x: ax - 0.1, y: ay - 0.1, w: 0.2, h: 0.2, fontSize: 8, color: C.TEAL, align: "center", fontFace: "Calibri", margin: 0, rotate: a });
  }

  addSlideNum(s, 7, 15);
}

// ─── SLIDE 8 — TRACTION ───────────────────────────────────────────────────────
function slide08(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.GOLD }, line: { color: C.GOLD, width: 0 } });

  addSection(s, "TRACTION & MILESTONES", 0.4, 0.18, C.GOLD);
  hdrText(s, "Shipped fast. Validated faster.", "Three ministries. Live.", C.GOLD);

  // Timeline milestones
  const milestones = [
    { q: "Q3 2024", t: "Idea & Research",   d: "23 deep interviews across 5 ASEAN ministries. Intelligence gap validated.", c: C.GREEN },
    { q: "Q4 2024", t: "MVP Built",         d: "LangGraph pipeline live. 9 agents operational. 39 tests passing.", c: C.TEAL },
    { q: "Q1 2025", t: "Pilot Launched",    d: "3 Indonesian ministry pilots. Bappenas, Kemlu, Bank Indonesia onboarded.", c: C.PURPLE },
    { q: "Q2 2025", t: "ASEAN Expansion",   d: "Malaysia + Singapore MoUs signed. RDTII integration complete.", c: C.GOLD },
    { q: "Q3 2025", t: "Series Seed",       d: "Raising $2.5M. Target: 10 ASEAN gov clients by EOY 2025.", c: C.CORAL },
  ];
  const mw = 1.72, mh = 1.2;
  milestones.forEach((m, i) => {
    const mx = 0.4 + i * (mw + 0.1);
    s.addShape("roundRect", { x: mx, y: 1.52, w: mw, h: mh, fill: { color: C.BG2 }, rectRadius: 0.07, line: { color: m.c, width: 0.7 } });
    s.addShape("rect", { x: mx, y: 1.52, w: mw, h: 0.22, fill: { color: m.c, transparency: 75 }, line: { color: m.c, width: 0 } });
    s.addText(m.q, { x: mx + 0.06, y: 1.54, w: mw - 0.12, h: 0.2, fontSize: 7.5, bold: true, color: m.c, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(m.t, { x: mx + 0.06, y: 1.78, w: mw - 0.12, h: 0.26, fontSize: 8.5, bold: true, color: C.WHITE, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(m.d, { x: mx + 0.08, y: 2.08, w: mw - 0.16, h: 0.56, fontSize: 7, color: C.GREY, fontFace: "Calibri", margin: 0 });
  });

  // KPI strip
  const kpis = [
    { v: "3",     l: "Ministry Pilots",    c: C.TEAL },
    { v: "$0",    l: "CAC (gov referral)", c: C.GREEN },
    { v: "39",    l: "Tests Passing",      c: C.PURPLE },
    { v: "2",     l: "MoUs Signed",        c: C.GOLD },
    { v: "<3min", l: "Brief Generation",   c: C.CORAL },
  ];
  const kw = 1.72, kh = 0.72;
  let kx = 0.4;
  for (const k of kpis) {
    s.addShape("roundRect", { x: kx, y: 4.72, w: kw, h: kh, fill: { color: C.BG3 }, rectRadius: 0.06, line: { color: C.BG4, width: 0 } });
    s.addText(k.v, { x: kx, y: 4.78, w: kw, h: 0.38, fontSize: 20, bold: true, color: k.c, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(k.l, { x: kx, y: 5.18, w: kw, h: 0.2, fontSize: 7, color: C.GREY, align: "center", fontFace: "Calibri", margin: 0 });
    kx += kw + 0.1;
  }

  addSlideNum(s, 8, 15);
}

// ─── SLIDE 9 — MARKET ────────────────────────────────────────────────────────
function slide09(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.TEAL }, line: { color: C.TEAL, width: 0 } });

  addSection(s, "MARKET OPPORTUNITY", 0.4, 0.18);
  hdrText(s, "A $3B+ market with no", "ASEAN-native incumbent.", C.TEAL);

  // Markets left
  const markets = [
    { flag: "🇮🇩", name: "Indonesia",   desc: "148 K/L + 34 provinces. Bappenas, BI, OJK, Kemlu.", size: "$820M", c: C.TEAL },
    { flag: "🇲🇾", name: "Malaysia",    desc: "EPU, MIDA, PEMANDU — policy intelligence vacuum.",  size: "$380M", c: C.PURPLE },
    { flag: "🇸🇬", name: "Singapore",   desc: "EDB, MTI — ASEAN policy coordinator hub.",          size: "$290M", c: C.GREEN },
    { flag: "🇵🇭", name: "Philippines", desc: "NEDA, DBM — fragmented, English-first.",             size: "$240M", c: C.GOLD },
    { flag: "🇻🇳", name: "Vietnam",     desc: "MPI, SBV — fast-growing digital policy stack.",      size: "$210M", c: C.CORAL },
  ];
  let mky = 1.52;
  for (const m of markets) {
    s.addShape("roundRect", { x: 0.4, y: mky, w: 4.8, h: 0.58, fill: { color: C.BG2 }, rectRadius: 0.06, line: { color: C.BG4, width: 0 } });
    s.addText(m.flag + "  " + m.name, { x: 0.5, y: mky + 0.06, w: 2.4, h: 0.24, fontSize: 8.5, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
    s.addText(m.desc, { x: 0.5, y: mky + 0.3, w: 3.3, h: 0.22, fontSize: 7, color: C.GREY, fontFace: "Calibri", margin: 0 });
    s.addText(m.size, { x: 4.4, y: mky + 0.14, w: 0.72, h: 0.28, fontSize: 13, bold: true, color: m.c, align: "right", fontFace: "Calibri", margin: 0 });
    mky += 0.68;
  }

  // TAM/SAM/SOM circles (right side)
  const circles = [
    { r: 2.0, c: C.GREY,   t: 90, label: "$12B",  sub: "TAM — Global Gov Intelligence" },
    { r: 1.4, c: C.TEAL,   t: 85, label: "$3.2B", sub: "SAM — ASEAN Gov + Diplo" },
    { r: 0.8, c: C.TEAL,   t: 75, label: "$480M", sub: "SOM — Indonesia + 3 markets" },
  ];
  const ccx = 7.7, ccy = 3.2;
  for (const ci of circles) {
    s.addShape("ellipse", {
      x: ccx - ci.r, y: ccy - ci.r * 0.85, w: ci.r * 2, h: ci.r * 1.7,
      fill: { color: C.NAVY, transparency: ci.t }, line: { color: ci.c, width: 0.5 }
    });
  }
  const labData = [
    { y: ccy - 2.1, lbl: "$12B TAM",   c: C.GREY },
    { y: ccy - 1.5, lbl: "$3.2B SAM",  c: C.TEAL },
    { y: ccy - 0.7, lbl: "$480M SOM",  c: C.WHITE },
  ];
  for (const l of labData) {
    s.addText(l.lbl, { x: ccx - 1.2, y: l.y + 0.55, w: 2.4, h: 0.24, fontSize: 9, bold: true, color: l.c, align: "center", fontFace: "Calibri", margin: 0 });
  }

  addSlideNum(s, 9, 15);
}

// ─── SLIDE 10 — WHY NOW ───────────────────────────────────────────────────────
function slide10(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.PURPLE }, line: { color: C.PURPLE, width: 0 } });

  addSection(s, "WHY NOW", 0.4, 0.18, C.PURPLE);
  hdrText(s, "Five tailwinds have never", "aligned like this before.", C.PURPLE);

  const reasons = [
    { c: C.TEAL,   t: "LLM Capability Inflection",   p: "2024–2025",          d: "Claude Opus, GPT-4o crossed the threshold for complex multi-step policy reasoning. The AI is finally good enough." },
    { c: C.PURPLE, t: "ASEAN Digital Agenda",         p: "Perpres 195/2024",   d: "Indonesia's Perpres 195/2024 mandates Satu Data Indonesia compliance. Paparan is the only product built for it." },
    { c: C.GREEN,  t: "Post-COVID Policy Urgency",    p: "2023–2025",          d: "Governments learned they can't slow down. Intelligence velocity is now a stated priority across ASEAN." },
    { c: C.GOLD,   t: "OSINT Democratisation",        p: "2022–2025",          d: "Satellite, AIS, corporate, and conflict data are freely accessible. The barrier is synthesis — not access." },
    { c: C.CORAL,  t: "ASEAN Geopolitical Pressure",  p: "2025",               d: "South China Sea tensions, Myanmar crisis, US-China decoupling — ASEAN governments need intelligence now." },
  ];
  let ry = 1.52;
  for (const r of reasons) {
    s.addShape("roundRect", { x: 0.4, y: ry, w: 9.2, h: 0.6, fill: { color: C.BG2 }, rectRadius: 0.06, line: { color: C.BG4, width: 0 } });
    s.addShape("rect", { x: 0.4, y: ry, w: 0.04, h: 0.6, fill: { color: r.c }, line: { color: r.c, width: 0 } });
    s.addText(r.t, { x: 0.56, y: ry + 0.08, w: 2.8, h: 0.22, fontSize: 9, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
    addTag(s, r.p, 3.42, ry + 0.08, r.c);
    s.addText(r.d, { x: 0.56, y: ry + 0.3, w: 9.0, h: 0.22, fontSize: 7.5, color: C.GREY, fontFace: "Calibri", margin: 0 });
    ry += 0.72;
  }

  addSlideNum(s, 10, 15);
}

// ─── SLIDE 11 — COMPETITION ──────────────────────────────────────────────────
function slide11(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.GOLD }, line: { color: C.GOLD, width: 0 } });

  addSection(s, "COMPETITION", 0.4, 0.18, C.GOLD);
  hdrText(s, "First ASEAN-native policy", "intelligence platform.", C.GOLD);

  // Left: feature table
  const headers = ["Feature", "Paparan.ai", "Others"];
  const rows = [
    ["ASEAN-native",         "✓", "✗"],
    ["RPJMN/RDTII scoring", "✓", "✗"],
    ["SDI compliance",       "✓", "✗"],
    ["Bellingcat OSINT",     "✓", "Partial"],
    ["Multi-agent AI",       "✓", "Partial"],
    ["Diplomat exports",     "✓", "✗"],
    ["Auto-archiving",       "✓", "✗"],
    ["Price (SaaS)",         "$2k/mo", "$50k+/yr"],
  ];
  const tableData = [
    headers.map((h, i) => ({
      text: h,
      options: { bold: true, color: i === 1 ? C.TEAL : C.LGREY, fill: { color: C.BG3 }, fontSize: 8 }
    })),
    ...rows.map(r => r.map((cell, ci) => ({
      text: cell,
      options: {
        color: ci === 1 && cell === "✓" ? C.GREEN : ci === 2 && cell === "✗" ? C.CORAL : ci === 0 ? C.LGREY : C.GREY,
        bold: ci > 0,
        fill: { color: C.BG2 },
        fontSize: 8
      }
    })))
  ];
  s.addTable(tableData, {
    x: 0.4, y: 1.52, w: 4.7, colW: [2.1, 1.3, 1.3],
    border: { pt: 0.3, color: C.BG4 },
    rowH: 0.32,
    fontFace: "Calibri",
  });

  // Right: 2x2 matrix
  const mx = 5.3, my = 1.15, mw = 4.35, mh = 4.1;
  const ax = mx + 0.5, ay = my + mh / 2;
  s.addShape("rect", { x: ax, y: my, w: 0.01, h: mh, fill: { color: "1E3050" }, line: { color: "1E3050", width: 0 } });
  s.addShape("rect", { x: mx, y: ay, w: mw, h: 0.01, fill: { color: "1E3050" }, line: { color: "1E3050", width: 0 } });
  s.addText("← Western / Generic       ASEAN-Native →", { x: mx, y: my + mh + 0.06, w: mw, h: 0.2, fontSize: 6.5, color: C.GREY, align: "center", fontFace: "Calibri", margin: 0 });
  s.addText("← Manual", { x: mx - 0.1, y: my, w: 0.5, h: 0.2, fontSize: 6, color: C.GREY, fontFace: "Calibri", margin: 0 });
  s.addText("AI-Powered →", { x: mx - 0.1, y: my + mh - 0.22, w: 1, h: 0.2, fontSize: 6, color: C.GREY, fontFace: "Calibri", margin: 0 });

  const comps = [
    { name: "Statt.com",         xp: 0.18, yp: 0.7,  c: C.GREY, us: false },
    { name: "Oxford Analytica",  xp: 0.12, yp: 0.52, c: C.GREY, us: false },
    { name: "Jane's / Janes",    xp: 0.22, yp: 0.4,  c: C.GREY, us: false },
    { name: "Palantir Gov",      xp: 0.35, yp: 0.8,  c: C.GREY, us: false },
    { name: "Consultants",       xp: 0.24, yp: 0.2,  c: C.GREY, us: false },
    { name: "PAPARAN.AI",        xp: 0.88, yp: 0.88, c: C.TEAL, us: true },
  ];
  for (const cp of comps) {
    const px = mx + 0.4 + cp.xp * (mw - 0.8), py = my + (1 - cp.yp) * mh;
    const r = cp.us ? 0.28 : 0.18;
    s.addShape("ellipse", { x: px - r, y: py - r * 0.7, w: r * 2, h: r * 1.4, fill: { color: cp.c, transparency: cp.us ? 80 : 88 }, line: { color: cp.c, width: cp.us ? 1 : 0.5 } });
    s.addText(cp.name, { x: px - r, y: py - r * 0.5, w: r * 2, h: r, fontSize: cp.us ? 7 : 6, bold: cp.us, color: cp.c, align: "center", fontFace: "Calibri", margin: 0 });
  }

  addSlideNum(s, 11, 15);
}

// ─── SLIDE 12 — BUSINESS MODEL ───────────────────────────────────────────────
function slide12(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.TEAL }, line: { color: C.TEAL, width: 0 } });

  addSection(s, "BUSINESS MODEL", 0.4, 0.18);
  hdrText(s, "Government SaaS + usage-based.", "Predictable ARR. Low churn.", C.TEAL);

  const tiers = [
    { name: "Analyst",    price: "$499/mo",   desc: "Single ministry analyst. Up to 20 briefs/month.", c: C.GREY,   feats: ["20 briefs/mo", "PDF + PPTX export", "RPJMN scoring", "Email support"], featured: false },
    { name: "Ministry",   price: "$2,499/mo",  desc: "Full ministry. Unlimited briefs. Diplomat export.", c: C.TEAL,   feats: ["Unlimited briefs", "Diplomat PDF", "SDI compliance", "K/L cross-check", "Priority support"], featured: true },
    { name: "ASEAN Gov",  price: "$8,999/mo",  desc: "Multi-ministry + multi-country. White-label.", c: C.PURPLE, feats: ["Multi-ministry", "White-label", "Custom OSINT", "Dedicated CSM", "On-prem option"], featured: false },
  ];
  const tw = 2.88, th = 2.85;
  tiers.forEach((t, i) => {
    const tx = 0.4 + i * (tw + 0.1);
    if (t.featured) {
      s.addShape("roundRect", { x: tx - 0.06, y: 1.38, w: tw + 0.12, h: th + 0.18, fill: { color: C.TEAL, transparency: 90 }, rectRadius: 0.1, line: { color: C.TEAL, width: 0.8 } });
      addTag(s, "RECOMMENDED", tx + 0.6, 1.44, C.TEAL);
    }
    s.addShape("roundRect", { x: tx, y: 1.6, w: tw, h: th, fill: { color: C.BG2 }, rectRadius: 0.08, line: { color: t.c, width: t.featured ? 0.8 : 0.4 } });
    s.addText(t.name, { x: tx, y: 1.68, w: tw, h: 0.34, fontSize: 13, bold: true, color: C.WHITE, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(t.price, { x: tx, y: 1.98, w: tw, h: 0.44, fontSize: 20, bold: true, color: t.c, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(t.desc, { x: tx + 0.1, y: 2.44, w: tw - 0.2, h: 0.36, fontSize: 7.5, color: C.GREY, align: "center", fontFace: "Calibri", margin: 0 });
    let fy = 2.86;
    for (const f of t.feats) {
      s.addShape("ellipse", { x: tx + 0.14, y: fy + 0.06, w: 0.1, h: 0.1, fill: { color: C.GREEN }, line: { color: C.GREEN, width: 0 } });
      s.addText(f, { x: tx + 0.3, y: fy + 0.01, w: tw - 0.4, h: 0.22, fontSize: 7.5, color: C.LGREY, fontFace: "Calibri", margin: 0 });
      fy += 0.27;
    }
  });

  // Unit economics
  s.addShape("roundRect", { x: 0.4, y: 4.58, w: 9.2, h: 0.82, fill: { color: C.BG3 }, rectRadius: 0.07, line: { color: C.BG4, width: 0 } });
  const econs = [
    { l: "ARR/Customer", v: "$30K avg",     c: C.TEAL },
    { l: "Gross Margin",  v: "82%",          c: C.GREEN },
    { l: "CAC",           v: "~$0 referral", c: C.GOLD },
    { l: "LTV/CAC",       v: "40x+",        c: C.PURPLE },
    { l: "Payback",       v: "< 3 months",  c: C.CORAL },
  ];
  let ex = 0.6;
  const ew = 1.72;
  for (const e of econs) {
    s.addText(e.v, { x: ex, y: 4.66, w: ew, h: 0.34, fontSize: 13, bold: true, color: e.c, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(e.l, { x: ex, y: 5.0, w: ew, h: 0.2, fontSize: 7, color: C.GREY, align: "center", fontFace: "Calibri", margin: 0 });
    ex += ew + 0.12;
  }

  addSlideNum(s, 12, 15);
}

// ─── SLIDE 13 — GO TO MARKET ──────────────────────────────────────────────────
function slide13(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.GREEN }, line: { color: C.GREEN, width: 0 } });

  addSection(s, "GO TO MARKET", 0.4, 0.18, C.GREEN);
  hdrText(s, "Land one ministry. Expand cross-K/L.", "Then replicate across ASEAN.", C.GREEN);

  const phases = [
    { period: "Now → Q4 2025", title: "Land & Expand Indonesia",   bullets: ["3 → 10 ministries", "Bappenas-led endorsement", "SDI mandate drives adoption", "Target: $1.2M ARR"], c: C.TEAL },
    { period: "Q1 → Q4 2026",  title: "ASEAN Tier-1 Markets",     bullets: ["Malaysia, Singapore, Philippines", "ASEAN Secretariat partnership", "RDTII as entry wedge", "Target: $4.5M ARR"], c: C.PURPLE },
    { period: "2027+",          title: "Platform & Data Layer",    bullets: ["White-label for 5 ASEAN govs", "Proprietary ASEAN intel graph", "API licensing to think-tanks", "Target: $15M+ ARR"], c: C.GREEN },
  ];
  const pw = 2.88, ph = 2.38;
  phases.forEach((p, i) => {
    const px = 0.4 + i * (pw + 0.12);
    s.addShape("roundRect", { x: px, y: 1.52, w: pw, h: ph, fill: { color: C.BG2 }, rectRadius: 0.08, line: { color: p.c, width: 0.6 } });
    s.addShape("rect", { x: px, y: 1.52, w: pw, h: 0.38, fill: { color: p.c, transparency: 82 }, line: { color: p.c, width: 0 } });
    s.addText(p.period, { x: px, y: 1.54, w: pw, h: 0.2, fontSize: 7, color: p.c, bold: true, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(p.title, { x: px + 0.1, y: 1.74, w: pw - 0.2, h: 0.26, fontSize: 9.5, bold: true, color: C.WHITE, align: "center", fontFace: "Calibri", margin: 0 });
    let fy = 2.06;
    for (const b of p.bullets) {
      s.addShape("ellipse", { x: px + 0.18, y: fy + 0.07, w: 0.1, h: 0.1, fill: { color: p.c }, line: { color: p.c, width: 0 } });
      s.addText(b, { x: px + 0.34, y: fy + 0.02, w: pw - 0.44, h: 0.22, fontSize: 8, color: C.LGREY, fontFace: "Calibri", margin: 0 });
      fy += 0.3;
    }
  });

  // Channels
  s.addText("KEY CHANNELS:", { x: 0.4, y: 4.02, w: 1.3, h: 0.22, fontSize: 7.5, bold: true, color: C.GREY, fontFace: "Calibri", margin: 0 });
  const channels = ["Bappenas Endorsement", "World Bank / ADB", "ASEAN Secretariat", "Bellingcat Network", "Direct Gov Outreach"];
  let cx2 = 1.8;
  for (const ch of channels) {
    const tw2 = ch.length * 0.065 + 0.2;
    s.addShape("roundRect", { x: cx2, y: 4.0, w: tw2, h: 0.24, fill: { color: C.BG3 }, rectRadius: 0.06, line: { color: C.GREEN, width: 0.4 } });
    s.addText(ch, { x: cx2 + 0.08, y: 4.02, w: tw2 - 0.1, h: 0.2, fontSize: 7.5, color: C.TEAL, bold: true, fontFace: "Calibri", margin: 0 });
    cx2 += tw2 + 0.12;
  }

  // Use of funds
  s.addChart(pres.charts.PIE, [{
    name: "Use of Funds", labels: ["Engineering & AI", "ASEAN Expansion", "Gov Relations", "Ops & Legal"],
    values: [40, 25, 20, 15]
  }], {
    x: 0.38, y: 4.32, w: 3.5, h: 1.1,
    chartColors: [C.TEAL, C.PURPLE, C.GREEN, C.GOLD],
    chartArea: { fill: { color: C.BG2 } },
    showPercent: true, showLegend: true, legendPos: "r",
    legendColor: C.LGREY, dataLabelColor: C.BG,
    legendFontSize: 7,
  });
  s.addText("USE OF $2.5M SEED", { x: 4.0, y: 4.38, w: 5.5, h: 0.22, fontSize: 7.5, bold: true, color: C.GREY, fontFace: "Calibri", margin: 0 });
  const useRows = [
    { l: "Engineering & AI", v: "40%", c: C.TEAL },
    { l: "ASEAN Expansion",  v: "25%", c: C.PURPLE },
    { l: "Gov Relations",    v: "20%", c: C.GREEN },
    { l: "Ops & Legal",      v: "15%", c: C.GOLD },
  ];
  let uy = 4.64;
  for (const u of useRows) {
    s.addText(u.v, { x: 4.0, y: uy, w: 0.5, h: 0.22, fontSize: 9, bold: true, color: u.c, fontFace: "Calibri", margin: 0 });
    s.addText(u.l, { x: 4.52, y: uy + 0.02, w: 2.0, h: 0.2, fontSize: 7.5, color: C.LGREY, fontFace: "Calibri", margin: 0 });
    uy += 0.24;
  }

  addSlideNum(s, 13, 15);
}

// ─── SLIDE 14 — THE ASK ───────────────────────────────────────────────────────
function slide14(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.TEAL }, line: { color: C.TEAL, width: 0 } });
  s.addShape("ellipse", { x: 3.5, y: 0.5, w: 4, h: 4, fill: { color: C.TEAL, transparency: 96 }, line: { color: C.TEAL, width: 0 } });
  s.addShape("ellipse", { x: -0.5, y: 3, w: 2, h: 2, fill: { color: C.PURPLE, transparency: 95 }, line: { color: C.PURPLE, width: 0 } });

  addSection(s, "THE ASK", 0.4, 0.18);
  s.addText("Raising $2.5M Seed", { x: 0.4, y: 0.42, w: 9.2, h: 0.68, fontSize: 34, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
  s.addText("to dominate ASEAN policy intelligence.", { x: 0.4, y: 1.05, w: 9.2, h: 0.44, fontSize: 20, bold: true, color: C.TEAL, fontFace: "Calibri", margin: 0 });

  // Deal details
  const details = [
    { l: "Raise",           v: "$2.5M",   c: C.WHITE },
    { l: "Round",           v: "Seed",    c: C.TEAL },
    { l: "Instrument",      v: "SAFE",    c: C.LGREY },
    { l: "Valuation Cap",   v: "$15M",    c: C.TEAL },
    { l: "Close Target",    v: "Q3 2025", c: C.GREEN },
  ];
  let dx = 0.4, dw = 1.78, dh = 0.78;
  for (const d of details) {
    s.addShape("roundRect", { x: dx, y: 1.58, w: dw, h: dh, fill: { color: C.BG2 }, rectRadius: 0.07, line: { color: C.BG4, width: 0 } });
    s.addText(d.v, { x: dx, y: 1.64, w: dw, h: 0.42, fontSize: 18, bold: true, color: d.c, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(d.l, { x: dx, y: 2.1, w: dw, h: 0.2, fontSize: 7, color: C.GREY, align: "center", fontFace: "Calibri", margin: 0 });
    dx += dw + 0.08;
  }

  s.addText("What $2.5M unlocks:", { x: 0.4, y: 2.48, w: 5.0, h: 0.28, fontSize: 10, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });

  const milestones = [
    { c: C.TEAL,   t: "3 → 10 Ministry contracts",  d: "Bappenas endorsement → cross-K/L expansion. $1.2M ARR locked." },
    { c: C.PURPLE, t: "Malaysia + Singapore launch", d: "RDTII compliance module live. ASEAN Secretariat partnership signed." },
    { c: C.GREEN,  t: "Proprietary AI model training", d: "Fine-tuned ASEAN policy LLM on 5 years of RPJMN/RDTII corpus." },
    { c: C.GOLD,   t: "Series A ready — 18 months",  d: "$8M ARR run-rate. 25+ gov clients. 3 ASEAN countries live." },
  ];
  let ay = 2.82;
  for (const m of milestones) {
    s.addShape("roundRect", { x: 0.4, y: ay, w: 9.2, h: 0.48, fill: { color: C.BG2 }, rectRadius: 0.06, line: { color: C.BG4, width: 0 } });
    s.addShape("rect", { x: 0.4, y: ay, w: 0.04, h: 0.48, fill: { color: m.c }, line: { color: m.c, width: 0 } });
    s.addText(m.t, { x: 0.56, y: ay + 0.04, w: 3.5, h: 0.22, fontSize: 9, bold: true, color: C.WHITE, fontFace: "Calibri", margin: 0 });
    s.addText(m.d, { x: 0.56, y: ay + 0.26, w: 9.0, h: 0.18, fontSize: 7.5, color: C.GREY, fontFace: "Calibri", margin: 0 });
    ay += 0.56;
  }

  s.addShape("roundRect", { x: 0.4, y: 5.14, w: 9.2, h: 0.34, fill: { color: C.BG3 }, rectRadius: 0.05, line: { color: C.BG4, width: 0 } });
  s.addText("paparan.ai  ·  hello@paparan.ai  ·  ASEAN Policy Intelligence", {
    x: 0.5, y: 5.18, w: 9.0, h: 0.28, fontSize: 10, color: C.TEAL, align: "center", bold: true, fontFace: "Calibri", margin: 0
  });

  addSlideNum(s, 14, 15);
}

// ─── SLIDE 15 — VISION / CLOSE ────────────────────────────────────────────────
function slide15(pres) {
  const s = pres.addSlide();
  addBg(s);
  s.addShape("rect", { x: 0, y: 0, w: 0.04, h: H, fill: { color: C.TEAL }, line: { color: C.TEAL, width: 0 } });
  s.addShape("rect", { x: W - 0.04, y: 0, w: 0.04, h: H, fill: { color: C.TEAL }, line: { color: C.TEAL, width: 0 } });

  // Glow
  s.addShape("ellipse", { x: 1.5, y: 0.5, w: 7, h: 4.5, fill: { color: C.TEAL, transparency: 96 }, line: { color: C.TEAL, width: 0 } });
  s.addShape("ellipse", { x: -0.5, y: 3, w: 2.5, h: 2.5, fill: { color: C.PURPLE, transparency: 95 }, line: { color: C.PURPLE, width: 0 } });
  s.addShape("ellipse", { x: 8.5, y: 3.5, w: 2.5, h: 2.5, fill: { color: C.GREEN, transparency: 95 }, line: { color: C.GREEN, width: 0 } });

  // Big quote mark
  s.addText('"', { x: 3.8, y: 0.15, w: 2.4, h: 1.5, fontSize: 88, color: "1A2B50", align: "center", fontFace: "Calibri", margin: 0 });

  s.addText("A future where every ASEAN", { x: 0.5, y: 1.0, w: 9.0, h: 0.6, fontSize: 26, bold: true, color: C.WHITE, align: "center", fontFace: "Calibri", margin: 0 });
  s.addText("policymaker acts on complete intelligence,", { x: 0.5, y: 1.55, w: 9.0, h: 0.6, fontSize: 26, bold: true, color: C.WHITE, align: "center", fontFace: "Calibri", margin: 0 });
  s.addText("never on noise.", { x: 0.5, y: 2.1, w: 9.0, h: 0.6, fontSize: 26, bold: true, color: C.TEAL, align: "center", fontFace: "Calibri", margin: 0 });

  s.addText("Paparan.ai — The intelligence layer for ASEAN governance.", { x: 0.5, y: 2.76, w: 9.0, h: 0.3, fontSize: 11, color: C.LGREY, align: "center", fontFace: "Calibri", margin: 0 });

  // ASEAN flags row
  const asean = ["🇮🇩", "🇲🇾", "🇸🇬", "🇵🇭", "🇻🇳", "🇹🇭", "🇧🇳", "🇰🇭", "🇱🇦", "🇲🇲"];
  const names = ["Indonesia", "Malaysia", "Singapore", "Philippines", "Vietnam", "Thailand", "Brunei", "Cambodia", "Laos", "Myanmar"];
  let fx = (W - asean.length * 0.88) / 2;
  for (let i = 0; i < asean.length; i++) {
    s.addShape("ellipse", { x: fx, y: 3.14, w: 0.7, h: 0.7, fill: { color: C.BG3 }, line: { color: C.TEAL, width: 0.2 } });
    s.addText(asean[i], { x: fx, y: 3.18, w: 0.7, h: 0.5, fontSize: 16, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText(names[i].substring(0, 4).toUpperCase(), { x: fx - 0.02, y: 3.85, w: 0.74, h: 0.16, fontSize: 5.5, color: C.GREY, align: "center", fontFace: "Calibri", margin: 0 });
    fx += 0.88;
  }

  s.addShape("roundRect", { x: 0.4, y: 5.16, w: 9.2, h: 0.32, fill: { color: C.BG3 }, rectRadius: 0.05, line: { color: C.BG4, width: 0 } });
  s.addText("paparan.ai  ·  hello@paparan.ai  ·  Seed Round 2025  ·  $2.5M  ·  $15M Cap", {
    x: 0.5, y: 5.18, w: 9.0, h: 0.28, fontSize: 8.5, color: C.TEAL, align: "center", bold: true, fontFace: "Calibri", margin: 0
  });

  addSlideNum(s, 15, 15);
}

// ─── BUILD ────────────────────────────────────────────────────────────────────
async function build() {
  const pres = mkPres();
  slide01(pres);
  slide02(pres);
  slide03(pres);
  slide04(pres);
  slide05(pres);
  slide06(pres);
  slide07(pres);
  slide08(pres);
  slide09(pres);
  slide10(pres);
  slide11(pres);
  slide12(pres);
  slide13(pres);
  slide14(pres);
  slide15(pres);

  const out = "/Users/komangambhara/Downloads/PaparanBrief/outputs/paparan-ai-pitch-deck-2025.pptx";
  await pres.writeFile({ fileName: out });
  console.log("✅ Saved:", out);
}

build().catch(e => { console.error(e); process.exit(1); });
