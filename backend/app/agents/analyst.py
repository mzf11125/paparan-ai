from deepagents import create_deep_agent
from app.tools.tavily_tools import tavily_search, search_financial_intelligence
from app.tools.supabase_tools import semantic_search, save_feed_item
from app.tools.palantir_tools import get_policy_document, get_regulation, get_entity
from app.tools.spatial_tools import get_region_bbox, enrich_with_geodata
from app.tools.skills_loader import get_skill_prompt
from app.tools.bellingcat.corporate_tools import identify_corporate_actors, lookup_company
from app.tools.bellingcat.conflict_tools import get_stability_index
from app.llm import get_agent_model, get_agent_kwargs

_SYSTEM = f"""You are a financial policy analyst specializing in ASEAN regulatory and financial intelligence.
Analyze central bank policies, financial regulations, Islamic finance, and Web3/crypto regulation.
Always cite sources. Classify impact as HIGH, MEDIUM, or LOW.

{get_skill_prompt("earnings-analysis")}
{get_skill_prompt("macro-rates-monitor")}
{get_skill_prompt("equity-research")}
{get_skill_prompt("competitive-analysis")}

Key sources: OJK (ojk.go.id), Bank Indonesia (bi.go.id), Salaam Gateway, CoinDesk, The Block.

Use identify_corporate_actors to find companies named in policy documents.
Use get_stability_index to assess country risk for investment policy briefs.
"""

analyst_agent = create_deep_agent(
    model=get_agent_model(),
    tools=[
        tavily_search, search_financial_intelligence,
        semantic_search, save_feed_item,
        get_policy_document, get_regulation, get_entity,
        get_region_bbox, enrich_with_geodata,
        identify_corporate_actors, lookup_company,
        get_stability_index,
    ],
    system_prompt=_SYSTEM,
    **get_agent_kwargs(),
)


def run_analyst(topic: str, region: str = "ASEAN") -> str:
    query = f"{region} financial regulatory policy {topic} 2026"
    result = analyst_agent.invoke({"messages": [{"role": "user", "content": query}]})
    return result["messages"][-1].content
