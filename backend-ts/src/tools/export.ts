import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import PptxGenJS from "pptxgenjs";
// @ts-ignore
const PptxGen = (PptxGenJS as any).default ?? PptxGenJS;
import type { PolicyBrief } from "../db/schema.js";

const NAVY = rgb(0.1, 0.227, 0.42);
const RED = rgb(0.753, 0.224, 0.169);
const ORANGE = rgb(0.902, 0.494, 0.133);
const GREY = rgb(0.29, 0.29, 0.29);
const MID_GREY = rgb(0.5, 0.5, 0.5);
const WHITE = rgb(1, 1, 1);

// ── PDF ───────────────────────────────────────────────────────────────────────

export async function generatePdf(brief: PolicyBrief): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const [PW, PH] = PageSizes.A4;
  const MARGIN = 50;
  const CW = PW - MARGIN * 2;
  const BANNER = 18;
  const BOTTOM_MARGIN = BANNER + 15;

  function newPage() {
    const p = pdfDoc.addPage(PageSizes.A4);
    p.drawRectangle({ x: 0, y: PH - BANNER, width: PW, height: BANNER, color: NAVY });
    p.drawText(brief.classification.toUpperCase(), { x: PW / 2 - 20, y: PH - 13, size: 7, font: bold, color: WHITE });
    p.drawRectangle({ x: 0, y: 0, width: PW, height: BANNER, color: NAVY });
    p.drawText("Paparan Policy Intelligence", { x: MARGIN, y: 5, size: 7, font: regular, color: WHITE });
    return p;
  }

  function wrap(text: string, font: typeof bold, size: number, maxW: number): string[] {
    const words = text.split(" ");
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxW && cur) { out.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) out.push(cur);
    return out.length ? out : [""];
  }

  let page = newPage();
  let y = PH - BANNER - 25;

  function ensureSpace(needed: number) {
    if (y - needed < BOTTOM_MARGIN) { page = newPage(); y = PH - BANNER - 25; }
  }

  function drawText(text: string, size: number, font: typeof bold, color: typeof NAVY, indent = 0) {
    const lines = wrap(text, font, size, CW - indent);
    for (const line of lines) {
      ensureSpace(size + 3);
      page.drawText(line, { x: MARGIN + indent, y: y - size, size, font, color });
      y -= size + 3;
    }
  }

  function drawRule() {
    ensureSpace(6);
    page.drawLine({ start: { x: MARGIN, y: y - 2 }, end: { x: MARGIN + CW, y: y - 2 }, thickness: 0.4, color: NAVY });
    y -= 6;
  }

  function section(title: string) {
    y -= 8;
    drawText(title.toUpperCase(), 8, bold, NAVY);
    drawRule();
  }

  // ── Content ────────────────────────────────────────────────────────────────

  drawText("POLICY INTELLIGENCE BRIEF — PAPARAN", 7, regular, MID_GREY);
  y -= 4;
  drawText(brief.title, 14, bold, NAVY);
  y -= 2;
  drawText(`${brief.region}  ·  ${brief.date}  ·  ${brief.classification.toUpperCase()}`, 8, regular, GREY);

  section("Executive Summary");
  brief.executiveSummary.forEach((item, i) => { drawText(`${i + 1}.  ${item}`, 9, regular, GREY); y -= 2; });

  section("Current Situation");
  drawText(brief.currentSituation, 9, regular, GREY);

  section("Key Developments");
  brief.developments.forEach(d => {
    const col = d.impact === "HIGH" ? RED : d.impact === "MEDIUM" ? ORANGE : rgb(0.15, 0.68, 0.38);
    // Draw badge in color, then text in grey on same line
    ensureSpace(12);
    const badge = `[${d.impact}]  `;
    const badgeW = bold.widthOfTextAtSize(badge, 9);
    page.drawText(badge, { x: MARGIN, y: y - 9, size: 9, font: bold, color: col });
    const textLines = wrap(d.text, regular, 9, CW - badgeW);
    page.drawText(textLines[0], { x: MARGIN + badgeW, y: y - 9, size: 9, font: regular, color: GREY });
    y -= 12;
    for (let i = 1; i < textLines.length; i++) {
      ensureSpace(12);
      page.drawText(textLines[i], { x: MARGIN, y: y - 9, size: 9, font: regular, color: GREY });
      y -= 12;
    }
    y -= 2;
  });

  section("Strategic Implications");
  drawText(brief.implications, 9, regular, GREY);

  section("Risks");
  brief.risks.forEach(r => { drawText(`•  ${r}`, 9, regular, GREY, 8); y -= 1; });

  section("Opportunities");
  brief.opportunities.forEach(o => { drawText(`•  ${o}`, 9, regular, GREY, 8); y -= 1; });

  section("Recommended Actions");
  brief.actions.slice(0, 5).forEach(a => {
    const col = a.priority === "HIGH" ? RED : GREY;
    const meta = [a.owner, a.deadline].filter(Boolean).join("  ·  ");
    drawText(`[${a.priority}]  ${a.text}`, 8, regular, col);
    if (meta) drawText(meta, 7, regular, MID_GREY, 16);
    y -= 2;
  });

  section("Sources");
  brief.sources.forEach(s => {
    drawText(`${s.title}  [${s.confidence}]`, 8, bold, GREY);
    drawText(s.url, 7, regular, MID_GREY);
    y -= 2;
  });

  if (brief.rpjmn_alignment) {
    section("RPJMN / RDTII Alignment");
    Object.entries(brief.rpjmn_alignment)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .forEach(([k, v]) => {
        ensureSpace(14);
        const barW = Math.round(v * 100);
        page.drawText(k.padEnd(4), { x: MARGIN, y: y - 9, size: 8, font: regular, color: GREY });
        page.drawRectangle({ x: MARGIN + 30, y: y - 9, width: barW, height: 7, color: NAVY });
        page.drawText(`${(v * 100).toFixed(0)}%`, { x: MARGIN + 30 + barW + 4, y: y - 9, size: 7, font: regular, color: GREY });
        y -= 13;
      });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// ── PPTX ──────────────────────────────────────────────────────────────────────

export async function generatePptx(brief: PolicyBrief): Promise<Buffer> {
  const pptx = new PptxGen();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = brief.title;

  const BG = "F8F9FC";
  const T = { color: "1a3a6b", bold: true, fontFace: "Calibri" };

  const s1 = pptx.addSlide();
  s1.background = { color: "1a3a6b" };
  s1.addText("POLICY INTELLIGENCE BRIEF", { x: 0.5, y: 1.2, w: 9, h: 0.4, fontSize: 11, color: "AABBDD", bold: true, fontFace: "Calibri" });
  s1.addText(brief.title, { x: 0.5, y: 1.8, w: 9, h: 2, fontSize: 22, color: "FFFFFF", bold: true, fontFace: "Calibri", wrap: true });
  s1.addText(`${brief.region}  ·  ${brief.date}  ·  ${brief.classification.toUpperCase()}`, { x: 0.5, y: 4.2, w: 9, h: 0.4, fontSize: 12, color: "AABBDD", fontFace: "Calibri" });

  const s2 = pptx.addSlide();
  s2.background = { color: BG };
  s2.addText("Executive Summary", { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, ...T });
  brief.executiveSummary.slice(0, 5).forEach((item, i) => {
    s2.addText(`${i + 1}.  ${item}`, { x: 0.5, y: 1.0 + i * 0.7, w: 9, h: 0.65, fontSize: 11, color: "333333", fontFace: "Calibri", wrap: true });
  });

  const s3 = pptx.addSlide();
  s3.background = { color: BG };
  s3.addText("Key Developments", { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, ...T });
  brief.developments.slice(0, 5).forEach((d, i) => {
    const col = d.impact === "HIGH" ? "C0392B" : d.impact === "MEDIUM" ? "E67E22" : "27AE60";
    s3.addText([
      { text: `[${d.impact}]  `, options: { bold: true, color: col } },
      { text: d.text, options: { color: "333333" } },
    ], { x: 0.5, y: 1.0 + i * 0.72, w: 9, h: 0.65, fontSize: 10, fontFace: "Calibri", wrap: true });
  });

  const s4 = pptx.addSlide();
  s4.background = { color: BG };
  s4.addText("Risks & Opportunities", { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, ...T });
  s4.addText("Risks", { x: 0.5, y: 1.0, w: 4.2, h: 0.35, fontSize: 13, bold: true, color: "C0392B", fontFace: "Calibri" });
  brief.risks.slice(0, 4).forEach((r, i) => s4.addText(`• ${r}`, { x: 0.5, y: 1.4 + i * 0.6, w: 4.2, h: 0.55, fontSize: 10, color: "333333", fontFace: "Calibri", wrap: true }));
  s4.addText("Opportunities", { x: 5.2, y: 1.0, w: 4.3, h: 0.35, fontSize: 13, bold: true, color: "27AE60", fontFace: "Calibri" });
  brief.opportunities.slice(0, 4).forEach((o, i) => s4.addText(`• ${o}`, { x: 5.2, y: 1.4 + i * 0.6, w: 4.3, h: 0.55, fontSize: 10, color: "333333", fontFace: "Calibri", wrap: true }));

  const s5 = pptx.addSlide();
  s5.background = { color: BG };
  s5.addText("Recommended Actions", { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 18, ...T });
  const rows = [
    [{ text: "Priority", options: { bold: true, color: "FFFFFF", fill: "1a3a6b" } }, { text: "Action", options: { bold: true, color: "FFFFFF", fill: "1a3a6b" } }, { text: "Owner", options: { bold: true, color: "FFFFFF", fill: "1a3a6b" } }, { text: "Deadline", options: { bold: true, color: "FFFFFF", fill: "1a3a6b" } }],
    ...brief.actions.slice(0, 5).map(a => [
      { text: a.priority, options: { bold: true, color: a.priority === "HIGH" ? "C0392B" : "333333" } },
      { text: a.text.slice(0, 80), options: { color: "333333" } },
      { text: a.owner || "—", options: { color: "333333" } },
      { text: a.deadline || "—", options: { color: "333333" } },
    ]),
  ];
  s5.addTable(rows, { x: 0.5, y: 1.0, w: 9, colW: [1.2, 4.8, 1.5, 1.5], fontSize: 10, fontFace: "Calibri", border: { pt: 0.5, color: "DDDDDD" } });

  const buf = await pptx.stream();
  return buf as unknown as Buffer;
}
