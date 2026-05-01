"""LangGraph StateGraph orchestrator for Paparan policy brief generation.

Graph topology:
  route_request
      ├─(bappenas)──► run_researcher
      ├─(financial)──► run_analyst ──► run_researcher
      └─(default) ──► run_gov_intel ──► run_researcher
                                            │
                                     score_rpjmn (if Indonesia/ASEAN)
                                            │
                                     extract_rdtii (if digital trade keywords)
                                            │
                                     enrich_osint
                                            │
                                         save_brief
"""
from typing import TypedDict, Literal, Optional
from langgraph.graph import StateGraph, END

from app.agents.researcher import run_researcher
from app.agents.gov_intel import run_gov_intel
from app.agents.analyst import run_analyst
from app.agents.rpjmn_scorer import run_rpjmn_scorer
from app.agents.rdtii_extractor import run_rdtii_extractor
from app.tools.supabase_tools import save_paparan_report
from app.db.schema import PolicyBrief, GenerateBriefRequest
from app.db.client import get_client
from app.tools.bellingcat.spatial_agent import enrich_brief_with_spatial
from app.tools.bellingcat.archive_tools import archive_brief_sources
from app.tools.bellingcat.environmental_tools import get_environmental_indicators

_RPJMN_KW = {"rpjmn", "renstra", "asta cita", "bappenas", "rdtii", "rencana pembangunan"}
_FINANCIAL_KW = {"financial", "bank", "ojk", "crypto", "islamic", "fintech"}
_BAPPENAS_KW = {"satu data", "sdi", "indikator", "metadata", "ekstrak", "kementrian"}
_DIGITAL_KW = {"digital trade", "e-commerce", "fintech", "cybersecurity", "data governance",
               "digital payment", "broadband", "digital inclusion"}
_INDONESIA_REGIONS = {"Indonesia", "ASEAN", "Kalimantan", "Sumatera", "Jawa", "Papua", "Sulawesi"}


class OrchestratorState(TypedDict):
    request: GenerateBriefRequest
    user_id: str
    brief: Optional[PolicyBrief]
    route: Literal["bappenas", "financial", "default"]


# ── Node functions ────────────────────────────────────────────────────────────

def node_route_request(state: OrchestratorState) -> OrchestratorState:
    topic = state["request"].topic.lower()
    if any(k in topic for k in _BAPPENAS_KW):
        route = "bappenas"
    elif any(k in topic for k in _FINANCIAL_KW):
        route = "financial"
    else:
        route = "default"
    return {**state, "route": route}


def node_run_gov_intel(state: OrchestratorState) -> OrchestratorState:
    req = state["request"]
    run_gov_intel(req.topic, req.region)
    return state


def node_run_analyst(state: OrchestratorState) -> OrchestratorState:
    req = state["request"]
    run_analyst(req.topic, req.region)
    return state


def node_run_researcher(state: OrchestratorState) -> OrchestratorState:
    req = state["request"]
    brief = run_researcher(req.topic, req.region)
    brief.classification = req.classification
    brief.source_count = len(brief.sources)
    confidences = [s.confidence for s in brief.sources]
    brief.confidence_score = (
        "HIGH" if confidences.count("HIGH") > len(confidences) / 2
        else "LOW" if confidences.count("LOW") > len(confidences) / 2
        else "MEDIUM"
    )
    brief.urgency_score = _compute_urgency(brief)
    return {**state, "brief": brief}


def node_score_rpjmn(state: OrchestratorState) -> OrchestratorState:
    req = state["request"]
    topic_lower = req.topic.lower()
    brief = state["brief"]
    if any(k in topic_lower for k in _RPJMN_KW) or req.region in _INDONESIA_REGIONS:
        brief = run_rpjmn_scorer(brief)
    return {**state, "brief": brief}


def node_extract_rdtii(state: OrchestratorState) -> OrchestratorState:
    req = state["request"]
    brief = state["brief"]
    topic_lower = req.topic.lower()
    if any(k in topic_lower for k in _DIGITAL_KW):
        text = f"{brief.title} {brief.currentSituation} {brief.implications}"
        evidence = run_rdtii_extractor(
            text=text,
            source_url=brief.sources[0].url if brief.sources else "",
            country=req.region,
            brief_id=brief.id,
        )
        brief.rdtii_evidence = [e.model_dump() for e in evidence]
    return {**state, "brief": brief}


def node_enrich_osint(state: OrchestratorState) -> OrchestratorState:
    req = state["request"]
    brief = state["brief"]

    try:
        brief_text = f"{brief.title} {brief.currentSituation} {brief.implications}"
        brief.spatial_context = enrich_brief_with_spatial.invoke(
            {"brief_text": brief_text, "region": req.region}
        )
    except Exception:
        pass

    if req.region in _INDONESIA_REGIONS:
        try:
            brief.environmental_indicators = get_environmental_indicators.invoke(
                {"region": req.region}
            )
        except Exception:
            pass

    try:
        archived = archive_brief_sources.invoke(
            {"sources": [{"id": s.id, "url": s.url} for s in brief.sources]}
        )
        brief.archived_sources = archived
    except Exception:
        pass

    return {**state, "brief": brief}


def node_save_brief(state: OrchestratorState) -> OrchestratorState:
    brief = state["brief"]
    user_id = state.get("user_id", "")

    if user_id:
        prev_id = _get_previous_brief_id(user_id, state["request"].topic, state["request"].region)
        if prev_id:
            brief.previous_report_id = prev_id

    save_paparan_report.invoke({"report": brief.model_dump()})
    return state


# ── Conditional routing ───────────────────────────────────────────────────────

def _route_after_route_request(state: OrchestratorState) -> str:
    return state["route"]  # "bappenas" | "financial" | "default"


# ── Graph assembly ────────────────────────────────────────────────────────────

_builder = StateGraph(OrchestratorState)

_builder.add_node("route_request",   node_route_request)
_builder.add_node("run_gov_intel",   node_run_gov_intel)
_builder.add_node("run_analyst",     node_run_analyst)
_builder.add_node("run_researcher",  node_run_researcher)
_builder.add_node("score_rpjmn",     node_score_rpjmn)
_builder.add_node("extract_rdtii",   node_extract_rdtii)
_builder.add_node("enrich_osint",    node_enrich_osint)
_builder.add_node("save_brief",      node_save_brief)

_builder.set_entry_point("route_request")

_builder.add_conditional_edges(
    "route_request",
    _route_after_route_request,
    {
        "bappenas":  "run_researcher",
        "financial": "run_analyst",
        "default":   "run_gov_intel",
    },
)

_builder.add_edge("run_gov_intel",  "run_researcher")
_builder.add_edge("run_analyst",    "run_researcher")
_builder.add_edge("run_researcher", "score_rpjmn")
_builder.add_edge("score_rpjmn",    "extract_rdtii")
_builder.add_edge("extract_rdtii",  "enrich_osint")
_builder.add_edge("enrich_osint",   "save_brief")
_builder.add_edge("save_brief",     END)

_graph = _builder.compile()


# ── Public API ────────────────────────────────────────────────────────────────

def run_orchestrator(req: GenerateBriefRequest, user_id: str = "") -> PolicyBrief:
    """Invoke the LangGraph orchestrator and return the completed PolicyBrief."""
    final = _graph.invoke({"request": req, "user_id": user_id, "brief": None, "route": "default"})
    return final["brief"]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _compute_urgency(brief: PolicyBrief) -> float:
    high_count = sum(1 for d in brief.developments if d.impact == "HIGH")
    high_weight = min(high_count / max(len(brief.developments), 1), 1.0) * 0.4
    source_weight = min(brief.source_count / 5, 1.0) * 0.3
    conf_weight = {"HIGH": 1.0, "MEDIUM": 0.5, "LOW": 0.2}.get(brief.confidence_score, 0.5) * 0.3
    return round(high_weight + source_weight + conf_weight, 3)


def _get_previous_brief_id(user_id: str, topic: str, region: str) -> str | None:
    try:
        client = get_client()
        result = (
            client.table("paparan_reports")
            .select("id")
            .eq("user_id", user_id)
            .eq("topic", topic)
            .eq("region", region)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0]["id"] if result.data else None
    except Exception:
        return None
