from app.agents.researcher import run_researcher
from app.agents.gov_intel import run_gov_intel
from app.agents.analyst import run_analyst
from app.agents.rpjmn_scorer import run_rpjmn_scorer
from app.tools.supabase_tools import save_paparan_report
from app.db.schema import PolicyBrief, GenerateBriefRequest
from app.db.client import get_client
from app.tools.bellingcat.spatial_agent import enrich_brief_with_spatial
from app.tools.bellingcat.archive_tools import archive_brief_sources
from app.tools.bellingcat.environmental_tools import get_environmental_indicators

RPJMN_KEYWORDS = ["rpjmn", "renstra", "asta cita", "bappenas", "rdtii", "rencana pembangunan"]
FINANCIAL_KEYWORDS = ["financial", "bank", "ojk", "crypto", "islamic", "fintech"]
BAPPENAS_KEYWORDS = ["satu data", "sdi", "indikator", "metadata", "ekstrak", "kementrian"]
INDONESIA_REGIONS = {"Indonesia", "ASEAN", "Kalimantan", "Sumatera", "Jawa", "Papua", "Sulawesi"}


def _compute_urgency(brief: PolicyBrief) -> float:
    high_count = sum(1 for d in brief.developments if d.impact == "HIGH")
    high_weight = min(high_count / max(len(brief.developments), 1), 1.0) * 0.4
    source_weight = min(brief.source_count / 5, 1.0) * 0.3
    conf_weight = {"HIGH": 1.0, "MEDIUM": 0.5, "LOW": 0.2}.get(brief.confidence_score, 0.5) * 0.3
    return round(high_weight + source_weight + conf_weight, 3)


def _get_previous_brief_id(user_id: str, topic: str, region: str) -> str | None:
    try:
        client = get_client()
        result = client.table("paparan_reports") \
            .select("id") \
            .eq("user_id", user_id) \
            .eq("topic", topic) \
            .eq("region", region) \
            .order("created_at", desc=True) \
            .limit(1).execute()
        return result.data[0]["id"] if result.data else None
    except Exception:
        return None


def run_orchestrator(req: GenerateBriefRequest, user_id: str = "") -> PolicyBrief:
    """Route request to appropriate agents, enrich with OSINT, score, and save."""
    topic_lower = req.topic.lower()

    if any(k in topic_lower for k in BAPPENAS_KEYWORDS):
        brief = run_researcher(f"SDI metadata extraction: {req.topic}", req.region)
    elif any(k in topic_lower for k in FINANCIAL_KEYWORDS):
        run_analyst(req.topic, req.region)
        brief = run_researcher(req.topic, req.region)
    else:
        run_gov_intel(req.topic, req.region)
        brief = run_researcher(req.topic, req.region)

    brief.classification = req.classification

    # Source metadata
    brief.source_count = len(brief.sources)
    confidences = [s.confidence for s in brief.sources]
    brief.confidence_score = (
        "HIGH" if confidences.count("HIGH") > len(confidences) / 2
        else "LOW" if confidences.count("LOW") > len(confidences) / 2
        else "MEDIUM"
    )

    # RPJMN/RDTII scoring
    if any(k in topic_lower for k in RPJMN_KEYWORDS) or req.region in ("Indonesia", "ASEAN"):
        brief = run_rpjmn_scorer(brief)

    # Urgency scoring
    brief.urgency_score = _compute_urgency(brief)

    # Spatial enrichment (always — lightweight)
    try:
        brief_text = f"{brief.title} {brief.currentSituation} {brief.implications}"
        brief.spatial_context = enrich_brief_with_spatial.invoke({
            "brief_text": brief_text, "region": req.region
        })
    except Exception:
        pass

    # Environmental indicators (Indonesia/ASEAN only)
    if req.region in INDONESIA_REGIONS:
        try:
            brief.environmental_indicators = get_environmental_indicators.invoke({"region": req.region})
        except Exception:
            pass

    # Archive sources (fire-and-forget — don't block on failure)
    try:
        archived = archive_brief_sources.invoke({
            "sources": [{"id": s.id, "url": s.url} for s in brief.sources]
        })
        brief.archived_sources = archived
    except Exception:
        pass

    # Version chaining
    if user_id:
        prev_id = _get_previous_brief_id(user_id, req.topic, req.region)
        if prev_id:
            brief.previous_report_id = prev_id

    save_paparan_report.invoke({"report": brief.model_dump()})
    return brief
