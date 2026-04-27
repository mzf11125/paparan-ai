"""Cross-brief synthesis agent."""
from deepagents import create_deep_agent
from langchain.tools import tool
from app.tools.supabase_tools import semantic_search
from app.llm import get_agent_model, get_agent_kwargs

_SYSTEM = """You are a policy intelligence synthesis analyst. Given multiple policy briefs,
identify common themes, diverging signals, aggregate risk, and recommended focus areas.
Return structured JSON analysis."""

synthesizer_agent = create_deep_agent(
    model=get_agent_model(),
    tools=[semantic_search],
    system_prompt=_SYSTEM,
    **get_agent_kwargs(),
)


def run_synthesizer(brief_contents: list[dict]) -> dict:
    """Synthesize insights across multiple briefs.

    Args:
        brief_contents: List of brief dicts with title, executiveSummary, implications

    Returns:
        Synthesis dict with common_themes, diverging_signals, aggregate_risk, recommended_focus
    """
    import json
    combined = "\n\n---\n\n".join(
        f"Brief: {b.get('title', '')}\nSummary: {' '.join(b.get('executiveSummary', []))}\nImplications: {b.get('implications', '')}"
        for b in brief_contents[:10]
    )
    prompt = f"""Synthesize these {len(brief_contents)} policy briefs:

{combined[:6000]}

Return JSON: {{"common_themes": ["..."], "diverging_signals": ["..."],
"aggregate_risk": "HIGH|MEDIUM|LOW", "recommended_focus": ["..."],
"key_entities": ["..."]}}"""

    result = synthesizer_agent.invoke({"messages": [{"role": "user", "content": prompt}]})
    raw = result["messages"][-1].content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    try:
        return json.loads(raw)
    except Exception:
        return {"common_themes": [], "diverging_signals": [], "aggregate_risk": "MEDIUM",
                "recommended_focus": [], "error": raw[:200]}
