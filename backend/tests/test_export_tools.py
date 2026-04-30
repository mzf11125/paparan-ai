"""Tests for PDF and PPTX export tools."""
from app.db.schema import PolicyBrief, Development, Source, Action
from app.tools.export_tools import generate_pdf, generate_pptx, generate_diplomat_pdf


def _make_brief():
    return PolicyBrief(
        id="test-001", title="ASEAN Digital Trade Policy 2026",
        date="2026-04-27", region="ASEAN", classification="confidential",
        executiveSummary=["ASEAN accelerates digital trade.", "Indonesia leads RDTII adoption."],
        currentSituation="ASEAN member states are aligning digital trade frameworks.",
        developments=[Development(id="d1", text="New ASEAN DTS roadmap endorsed.", impact="HIGH",
                                  delta="NEW", sourceId="s1", date="2026-04-27")],
        implications="Significant regulatory harmonization required.",
        risks=["Regulatory fragmentation risk"], opportunities=["Digital trade growth"],
        actions=[Action(priority="HIGH", text="Align national DTS frameworks", owner="Kemdag", deadline="2026-Q3")],
        sources=[Source(id="s1", title="ASEAN Secretariat", url="https://asean.org", confidence="HIGH", date="2026-04-27")],
        source_count=1, confidence_score="HIGH",
    )


def test_generate_pdf_returns_valid_bytes():
    brief = _make_brief()
    pdf_bytes = generate_pdf(brief)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes[:4] == b"%PDF"


def test_generate_pdf_watermark():
    brief = _make_brief()
    pdf_bytes = generate_pdf(brief, watermark="CONFIDENTIAL")
    assert len(pdf_bytes) > 1000


def test_generate_pptx_returns_valid_bytes():
    brief = _make_brief()
    pptx_bytes = generate_pptx(brief)
    assert isinstance(pptx_bytes, bytes)
    assert pptx_bytes[:2] == b"PK"  # ZIP magic bytes


def test_generate_diplomat_pdf():
    brief = _make_brief()
    pdf_bytes = generate_diplomat_pdf(
        brief, to="H.E. Minister of Trade",
        from_name="Paparan Intelligence Unit",
        ref_no="PAP-2026-0001",
        distribution=["Kementrian Perdagangan", "Bappenas"]
    )
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes[:4] == b"%PDF"
