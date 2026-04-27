from deepagents import create_deep_agent
from app.tools.tavily_tools import tavily_search, search_government_sources, search_asean_news
from app.tools.supabase_tools import semantic_search, save_feed_item
from app.tools.palantir_tools import get_sdi_indicator, get_sdi_institution, get_sdi_dataset, get_policy_document
from app.tools.spatial_tools import get_region_bbox, enrich_with_geodata, geolocate_policy_area
from app.tools.skills_loader import get_skill_prompt
from app.tools.bellingcat.conflict_tools import get_conflict_events, search_conflict_news
from app.tools.bellingcat.maritime_tools import search_maritime_news, track_maritime_activity
from app.llm import get_agent_model, get_agent_kwargs

_SYSTEM = f"""You are a government intelligence analyst specializing in ASEAN policy.
Your task: research parliamentary bills, regulatory announcements, and government policy
across ASEAN member states. Always cite sources with URLs.

{get_skill_prompt("global-government-analysis")}

Focus countries: Malaysia, Singapore, Indonesia, Thailand, Philippines, Vietnam, ASEAN regional.
Output structured findings with: title, summary, url, region, topic_tags, impact (HIGH/MEDIUM/LOW).

Use geolocate_policy_area to identify affected locations.
Use get_conflict_events for security-sensitive regions (Myanmar, Papua, Philippines).
Use search_maritime_news for trade and maritime policy topics.
"""

gov_agent = create_deep_agent(
    model=get_agent_model(),
    tools=[
        tavily_search, search_government_sources, search_asean_news,
        semantic_search, save_feed_item,
        get_sdi_indicator, get_sdi_institution, get_sdi_dataset, get_policy_document,
        get_region_bbox, enrich_with_geodata, geolocate_policy_area,
        get_conflict_events, search_conflict_news,
        track_maritime_activity, search_maritime_news,
    ],
    system_prompt=_SYSTEM,
    **get_agent_kwargs(),
)


def run_gov_intel(topic: str, region: str = "ASEAN") -> str:
    query = f"{region} government policy {topic} 2026"
    result = gov_agent.invoke({"messages": [{"role": "user", "content": query}]})
    return result["messages"][-1].content
