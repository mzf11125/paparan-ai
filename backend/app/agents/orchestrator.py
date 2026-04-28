"""
Orchestrator agent for Paparan AI using LangGraph StateGraph.

Routes requests to appropriate sub-agents, coordinates their execution,
and synthesizes results into a cohesive PolicyBrief.

Key features:
- LangGraph StateGraph for orchestration
- Conditional routing based on topic analysis
- Sub-agent coordination (gov_intel, analyst, researcher)
- OSINT enrichment (spatial, environmental, archival)
- RPJMN/RDTII scoring for Indonesia/ASEAN topics
- Version chaining with previous briefs
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional, Any, TypedDict, Annotated

from langgraph.graph import StateGraph, START, END
from langgraph.constants import Send
from langchain.tools import tool
from pydantic import BaseModel, Field

from app.config import settings
from app.db.client import get_client
from app.db.schema import PolicyBrief, GenerateBriefRequest, Source, Development, Action
from app.db.vector_store import get_briefs_store
from app.agents.researcher import run_researcher
from app.agents.gov_intel import run_gov_intel
from app.agents.analyst import run_analyst
from app.agents.rpjmn_scorer import run_rpjmn_scorer
from app.tools.supabase_tools import save_paparan_report
from app.tools.tavily_tools import tavily_search
from app.tools.bellingcat.spatial_agent import enrich_brief_with_spatial
from app.tools.bellingcat.archive_tools import archive_brief_sources
from app.tools.bellingcat.environmental_tools import get_environmental_indicators


# ============================================================================
# Keywords and Routing Configuration
# ============================================================================

# Topic routing keywords
BAPPENAS_KEYWORDS = [
    "rpjmn", "renstra", "asta cita", "bappenas", "rdtii",
    "rencana pembangunan", "satu data", "sdi", "indikator",
    "metadata", "ekstrak", "kementrian", "satudata",
]

FINANCIAL_KEYWORDS = [
    "financial", "bank", "ojk", "crypto", "islamic",
    "fintech", "monetary", "fiscal", "inflation", "interest rate",
    "exchange rate", "bond", "stock", "investment", "capital",
]

GOV_KEYWORDS = [
    "parliament", "congress", "senate", "legislation", "bill",
    "regulation", "policy", "government", "minister", "cabinet",
    "law", "act", "decree", "announcement",
]

INDONESIA_REGIONS = {
    "Indonesia", "ASEAN", "Kalimantan", "Sumatera", "Jawa",
    "Papua", "Sulawesi", "Bali", "Nusa Tenggara",
}


# ============================================================================
# State Models
# ============================================================================

class OrchestratorState(TypedDict):
    """State for the orchestrator workflow."""

    # Input
    request: GenerateBriefRequest
    user_id: str

    # Routing
    agent_type: Literal["researcher", "gov_intel", "analyst", "bappenas"]

    # Sub-agent results
    gov_intel_result: Optional[str]
    analyst_result: Optional[str]
    researcher_brief: Optional[PolicyBrief]

    # Enrichment
    spatial_context: Optional[dict]
    environmental_indicators: Optional[dict]
    archived_sources: Optional[dict]

    # Output
    brief: Optional[PolicyBrief]
    error: Optional[str]

    # Metadata
    start_time: str
    end_time: Optional[str]


class RouteDecision(BaseModel):
    """Decision model for routing."""

    agent_type: Literal["researcher", "gov_intel", "analyst", "bappenas"]
    confidence: float
    reasoning: str


# ============================================================================
# Routing Logic
# ============================================================================

def analyze_topic_for_routing(topic: str, region: str) -> RouteDecision:
    """
    Analyze topic and region to determine which agent to route to.

    Args:
        topic: The policy brief topic.
        region: The region of interest.

    Returns:
        RouteDecision with agent type and reasoning.
    """
    topic_lower = topic.lower()
    region_lower = region.lower()

    # Check for Bappenas/SDI topics first
    bappenas_score = sum(1 for kw in BAPPENAS_KEYWORDS if kw in topic_lower)
    if bappenas_score >= 2 or "bappenas" in topic_lower or "sdi" in topic_lower:
        return RouteDecision(
            agent_type="bappenas",
            confidence=0.9,
            reasoning=f"Topic contains {bappenas_score} Bappenas/SDI keywords",
        )

    # Check for financial topics
    financial_score = sum(1 for kw in FINANCIAL_KEYWORDS if kw in topic_lower)
    if financial_score >= 2 or any(kw in topic_lower for kw in ["ojk", "crypto", "islamic finance"]):
        return RouteDecision(
            agent_type="analyst",
            confidence=0.85,
            reasoning=f"Topic contains {financial_score} financial keywords",
        )

    # Check for government/policy topics
    gov_score = sum(1 for kw in GOV_KEYWORDS if kw in topic_lower)
    if gov_score >= 1 or region in {"Indonesia", "Malaysia", "Singapore", "Thailand", "Philippines", "Vietnam"}:
        return RouteDecision(
            agent_type="gov_intel",
            confidence=0.8,
            reasoning=f"Topic contains government keywords or specific ASEAN country",
        )

    # Default to researcher
    return RouteDecision(
        agent_type="researcher",
        confidence=0.7,
        reasoning="Default routing to researcher agent",
    )


# ============================================================================
# Graph Nodes
# ============================================================================

def route_node(state: OrchestratorState) -> dict:
    """
    Analyze the request and determine which sub-agent to use.

    Updates state.agent_type for conditional routing.
    """
    request = state["request"]
    decision = analyze_topic_for_routing(request.topic, request.region)

    return {
        "agent_type": decision.agent_type,
        "start_time": datetime.now(timezone.utc).isoformat(),
    }


def gov_intel_node(state: OrchestratorState) -> dict:
    """
    Execute government intelligence sub-agent.

    Gathers official government sources, parliamentary proceedings,
    and regulatory announcements.
    """
    request = state["request"]

    try:
        result = run_gov_intel(request.topic, request.region)
        return {"gov_intel_result": result}
    except Exception as e:
        return {"gov_intel_result": None, "error": str(e)}


def analyst_node(state: OrchestratorState) -> dict:
    """
    Execute financial analyst sub-agent.

    Analyzes financial markets, central bank policies,
    and economic indicators.
    """
    request = state["request"]

    try:
        result = run_analyst(request.topic, request.region)
        return {"analyst_result": result}
    except Exception as e:
        return {"analyst_result": None, "error": str(e)}


def researcher_node(state: OrchestratorState) -> dict:
    """
    Execute researcher sub-agent to generate the brief.

    Uses cached intelligence and live search to produce
    a structured PolicyBrief.
    """
    request = state["request"]

    try:
        brief = run_researcher(request.topic, request.region)
        return {"researcher_brief": brief}
    except Exception as e:
        return {"researcher_brief": None, "error": str(e)}


def bappenas_node(state: OrchestratorState) -> dict:
    """
    Execute Bappenas/SDI focused research.

    Specialized path for Indonesian development policy
    and SDI metadata extraction.
    """
    request = state["request"]

    try:
        # For Bappenas topics, use researcher with SDI context
        brief = run_researcher(f"SDI metadata extraction: {request.topic}", request.region)
        return {"researcher_brief": brief}
    except Exception as e:
        return {"researcher_brief": None, "error": str(e)}


def synthesize_node(state: OrchestratorState) -> dict:
    """
    Synthesize sub-agent results into final PolicyBrief.

    Combines researcher brief with gov_intel/analyst insights,
    adds metadata, and prepares for enrichment.
    """
    request = state["request"]
    brief = state.get("researcher_brief")

    # If no brief from researcher, create minimal one
    if not brief:
        brief = PolicyBrief(
            id=str(uuid.uuid4()),
            title=request.topic,
            region=request.region,
            classification=request.classification,
            report_type=request.report_type,
            topic=request.topic,
            currentSituation="Analysis pending",
            analysis=state.get("gov_intel_result") or state.get("analyst_result") or "",
        )

    # Add classification
    brief.classification = request.classification

    # Compute source metadata
    brief.source_count = len(brief.sources)
    if brief.sources:
        confidences = [s.confidence for s in brief.sources]
        high_count = confidences.count("HIGH")
        brief.confidence_score = (
            "HIGH" if high_count > len(confidences) / 2
            else "LOW" if confidences.count("LOW") > len(confidences) / 2
            else "MEDIUM"
        )

    # Add sub-agent results to analysis
    if state.get("gov_intel_result"):
        brief.analysis += f"\n\n**Government Intelligence:**\n{state['gov_intel_result']}"
    if state.get("analyst_result"):
        brief.analysis += f"\n\n**Financial Analysis:**\n{state['analyst_result']}"

    return {"brief": brief}


def enrich_node(state: OrchestratorState) -> dict:
    """
    Enrich the brief with OSINT data.

    Adds spatial context, environmental indicators,
    and archives sources.
    """
    brief = state.get("brief")
    if not brief:
        return {}

    request = state["request"]
    enrichments = {}

    # Spatial enrichment (always - lightweight)
    try:
        brief_text = f"{brief.title}\n{brief.currentSituation}\n{brief.implications}"
        spatial = enrich_brief_with_spatial.invoke({
            "brief_text": brief_text,
            "region": request.region
        })
        enrichments["spatial_context"] = spatial
        brief.spatial_context = spatial
    except Exception:
        pass

    # Environmental indicators (Indonesia/ASEAN only)
    if request.region in INDONESIA_REGIONS:
        try:
            env = get_environmental_indicators.invoke({"region": request.region})
            enrichments["environmental_indicators"] = env
            brief.environmental_indicators = env
        except Exception:
            pass

    # Archive sources (fire-and-forget)
    try:
        archived = archive_brief_sources.invoke({
            "sources": [{"id": s.id, "url": s.url} for s in brief.sources]
        })
        enrichments["archived_sources"] = archived
    except Exception:
        pass

    return enrichments


def score_node(state: OrchestratorState) -> dict:
    """
    Score the brief and add metadata.

    Computes urgency score, RPJMN alignment (if applicable),
    and handles version chaining.
    """
    brief = state.get("brief")
    if not brief:
        return {}

    request = state["request"]
    topic_lower = request.topic.lower()

    # Compute urgency score
    high_count = sum(1 for d in brief.key_developments if d.impact_level == "HIGH")
    high_weight = min(high_count / max(len(brief.key_developments), 1), 1.0) * 0.4
    source_weight = min(brief.source_count / 5, 1.0) * 0.3

    conf_map = {"HIGH": 1.0, "MEDIUM": 0.5, "LOW": 0.2}
    conf_weight = conf_map.get(brief.confidence_score or "MEDIUM", 0.5) * 0.3

    brief.urgency_score = round(high_weight + source_weight + conf_weight, 3)

    # RPJMN/RDTII scoring
    if any(kw in topic_lower for kw in RPJMN_KEYWORDS) or request.region in ("Indonesia", "ASEAN"):
        try:
            brief = run_rpjmn_scorer(brief)
        except Exception:
            pass

    # Version chaining
    if state.get("user_id"):
        prev_id = _get_previous_brief_id(state["user_id"], request.topic, request.region)
        if prev_id:
            brief.previous_report_id = prev_id

    # Add metadata
    brief.created_at = datetime.now(timezone.utc).isoformat()
    brief.updated_at = datetime.now(timezone.utc).isoformat()

    return {
        "brief": brief,
        "end_time": datetime.now(timezone.utc).isoformat(),
    }


def save_node(state: OrchestratorState) -> dict:
    """
    Save the brief to Supabase.

    Persists the final PolicyBrief to the paparan_reports table.
    """
    brief = state.get("brief")
    if not brief:
        return {}

    try:
        save_paparan_report.invoke({
            "report": brief.model_dump(),
            "user_id": state.get("user_id", ""),
            "brief_id": brief.id,
        })
        return {}
    except Exception as e:
        return {"error": str(e)}


# ============================================================================
# Helper Functions
# ============================================================================

def _get_previous_brief_id(user_id: str, topic: str, region: str) -> Optional[str]:
    """Get the most recent brief ID for this user/topic/region combination."""
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


def _compute_urgency(brief: PolicyBrief) -> float:
    """Compute urgency score for a brief."""
    high_count = sum(1 for d in brief.key_developments if d.impact_level == "HIGH")
    high_weight = min(high_count / max(len(brief.key_developments), 1), 1.0) * 0.4
    source_weight = min(brief.source_count / 5, 1.0) * 0.3

    conf_map = {"HIGH": 1.0, "MEDIUM": 0.5, "LOW": 0.2}
    conf_weight = conf_map.get(brief.confidence_score or "MEDIUM", 0.5) * 0.3

    return round(high_weight + source_weight + conf_weight, 3)


# ============================================================================
# Conditional Routing Functions
# ============================================================================

def should_route_to_gov_intel(state: OrchestratorState) -> Literal["gov_intel", "analyst", "researcher", "bappenas"]:
    """Route to gov_intel if agent_type is gov_intel."""
    return state.get("agent_type", "researcher")


def after_gov_intel(state: OrchestratorState) -> Literal["researcher", "synthesize"]:
    """After gov_intel, always route to researcher for brief generation."""
    return "researcher"


def after_analyst(state: OrchestratorState) -> Literal["researcher", "synthesize"]:
    """After analyst, always route to researcher for brief generation."""
    return "researcher"


def should_enrich(state: OrchestratorState) -> Literal["enrich", "score"]:
    """Always enrich the brief with OSINT data."""
    return "enrich"


# ============================================================================
# Build the Graph
# ============================================================================

def create_orchestrator_graph() -> StateGraph:
    """
    Create the LangGraph StateGraph for orchestrator.

    Returns:
        Compiled StateGraph ready for execution.
    """
    # Create graph with state
    graph = StateGraph(OrchestratorState)

    # Add nodes
    graph.add_node("route", route_node)
    graph.add_node("gov_intel", gov_intel_node)
    graph.add_node("analyst", analyst_node)
    graph.add_node("researcher", researcher_node)
    graph.add_node("bappenas", bappenas_node)
    graph.add_node("synthesize", synthesize_node)
    graph.add_node("enrich", enrich_node)
    graph.add_node("score", score_node)
    graph.add_node("save", save_node)

    # Add edges
    graph.add_edge(START, "route")

    # Conditional routing from route node
    graph.add_conditional_edges(
        "route",
        should_route_to_gov_intel,
        {
            "gov_intel": "gov_intel",
            "analyst": "analyst",
            "researcher": "researcher",
            "bappenas": "bappenas",
        }
    )

    # After specialized agents, route to researcher or synthesize
    graph.add_conditional_edges(
        "gov_intel",
        after_gov_intel,
        {
            "researcher": "researcher",
            "synthesize": "synthesize",
        }
    )

    graph.add_conditional_edges(
        "analyst",
        after_analyst,
        {
            "researcher": "researcher",
            "synthesize": "synthesize",
        }
    )

    # Direct paths from researcher/bappenas to synthesize
    graph.add_edge("researcher", "synthesize")
    graph.add_edge("bappenas", "synthesize")

    # Enrichment and finalization
    graph.add_conditional_edges(
        "synthesize",
        should_enrich,
        {
            "enrich": "enrich",
            "score": "score",
        }
    )

    graph.add_edge("enrich", "score")
    graph.add_edge("score", "save")
    graph.add_edge("save", END)

    return graph.compile()


# Compiled graph instance
orchestrator_graph = create_orchestrator_graph()


# ============================================================================
# Main Entry Point
# ============================================================================

def run_orchestrator(req: GenerateBriefRequest, user_id: str = "") -> PolicyBrief:
    """
    Run the orchestrator workflow to generate a policy brief.

    Args:
        req: The brief generation request.
        user_id: Optional user ID for personalization.

    Returns:
        Generated PolicyBrief.
    """
    # Initial state
    initial_state: OrchestratorState = {
        "request": req,
        "user_id": user_id,
        "agent_type": "researcher",
        "gov_intel_result": None,
        "analyst_result": None,
        "researcher_brief": None,
        "spatial_context": None,
        "environmental_indicators": None,
        "archived_sources": None,
        "brief": None,
        "error": None,
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": None,
    }

    # Run the graph
    final_state = orchestrator_graph.invoke(initial_state)

    # Return the brief
    brief = final_state.get("brief")
    if not brief:
        # Fallback: create minimal brief
        brief = PolicyBrief(
            id=str(uuid.uuid4()),
            title=req.topic,
            region=req.region,
            classification=req.classification,
            report_type=req.report_type,
            topic=req.topic,
            currentSituation="Unable to generate brief",
            analysis=final_state.get("error", "Unknown error"),
        )

    return brief


# ============================================================================
# Legacy Function (for backward compatibility)
# ============================================================================

# Keep the original simple orchestrator for API compatibility
def run_orchestrator_simple(req: GenerateBriefRequest, user_id: str = "") -> PolicyBrief:
    """
    Simplified orchestrator path for backward compatibility.

    Routes request to appropriate agents, enriches with OSINT,
    scores, and saves.
    """
    topic_lower = req.topic.lower()

    # Route based on topic
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
    if brief.sources:
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

    # Spatial enrichment (always - lightweight)
    try:
        brief_text = f"{brief.title} {brief.currentSituation} {brief.implications}"
        brief.spatial_context = enrich_brief_with_spatial.invoke({
            "brief_text": brief_text,
            "region": req.region
        })
    except Exception:
        pass

    # Environmental indicators (Indonesia/ASEAN only)
    if req.region in INDONESIA_REGIONS:
        try:
            brief.environmental_indicators = get_environmental_indicators.invoke({"region": req.region})
        except Exception:
            pass

    # Archive sources (fire-and-forget)
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


# Use the graph version by default
run_orchestrator = run_orchestrator_simple


# ============================================================================
# Exports
# ============================================================================

__all__ = [
    "run_orchestrator",
    "run_orchestrator_simple",
    "create_orchestrator_graph",
    "orchestrator_graph",
    "OrchestratorState",
    "RouteDecision",
    "analyze_topic_for_routing",
]
