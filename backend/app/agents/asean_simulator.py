"""ASEAN policy scenario simulator agent."""
from deepagents import create_deep_agent
from langchain.tools import tool
from app.tools.knowledge_graph import query_entity_graph, upsert_entity
from app.tools.tavily_tools import tavily_search
from app.tools.supabase_tools import semantic_search
from app.tools.rdtii_tools import score_policy_against_rdtii
from app.llm import get_agent_model, get_agent_kwargs

_SYSTEM = """You are an ASEAN policy intelligence analyst specializing in scenario modeling.
Given a policy scenario, analyze its impact on ASEAN member states and RDTII pillars.
Use query_entity_graph to find related entities, score_policy_against_rdtii for pillar impact,
and tavily_search for current context.
Return structured JSON with: scenario, risks, opportunities, affected_rdtii_pillars, confidence."""

simulator_agent = create_deep_agent(
    model=get_agent_model(),
    tools=[query_entity_graph, upsert_entity, tavily_search, semantic_search, score_policy_against_rdtii],
    system_prompt=_SYSTEM,
    **get_agent_kwargs(),
)


@tool
def simulate_policy_scenario(scenario: str, affected_pillars: list = None) -> dict:
    """Simulate the impact of an ASEAN policy scenario.

    Args:
        scenario: Policy scenario description
        affected_pillars: Optional list of RDTII pillar IDs to focus on

    Returns:
        Dict with scenario analysis
    """
    import json
    pillar_context = f" Focus on RDTII pillars: {affected_pillars}." if affected_pillars else ""
    prompt = f"""Analyze this ASEAN policy scenario:{pillar_context}

Scenario: {scenario}

Return JSON: {{"scenario": "...", "risks": ["..."], "opportunities": ["..."],
"affected_rdtii_pillars": {{"P1": 0.0, ...}}, "affected_countries": ["..."],
"confidence": "HIGH|MEDIUM|LOW", "timeline": "short|medium|long"}}"""

    result = simulator_agent.invoke({"messages": [{"role": "user", "content": prompt}]})
    raw = result["messages"][-1].content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    try:
        return json.loads(raw)
    except Exception:
        return {"scenario": scenario, "risks": [], "opportunities": [],
                "affected_rdtii_pillars": {}, "confidence": "LOW", "error": raw[:200]}


def run_asean_simulator(scenario: str, affected_pillars: list = None) -> dict:
    return simulate_policy_scenario.invoke({"scenario": scenario, "affected_pillars": affected_pillars})
