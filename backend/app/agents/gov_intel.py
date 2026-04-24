from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
from langchain.tools import tool
from app.tools.tavily_tools import tavily_search
from app.tools.supabase_tools import semantic_search, save_feed_item
from app.tools.skills_loader import get_skill_prompt
from app.config import settings

_model = init_chat_model("claude-sonnet-4-5", model_provider="anthropic")

_SYSTEM = f"""You are a government intelligence analyst specializing in ASEAN policy.
Your task: research parliamentary bills, regulatory announcements, and government policy
across ASEAN member states. Always cite sources with URLs.

{get_skill_prompt("global-government-analysis")}

Focus countries: Malaysia, Singapore, Indonesia, Thailand, Philippines, Vietnam, ASEAN regional.
Output structured findings with: title, summary, url, region, topic_tags, impact (HIGH/MEDIUM/LOW).
"""

gov_agent = create_agent(
    _model,
    [tavily_search, semantic_search, save_feed_item],
    system_prompt=_SYSTEM,
)


def run_gov_intel(topic: str, region: str = "ASEAN") -> str:
    query = f"{region} government policy {topic} 2026"
    result = gov_agent.invoke({"messages": [{"role": "user", "content": query}]})
    return result["messages"][-1].content
