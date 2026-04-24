from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
from app.tools.tavily_tools import tavily_search
from app.tools.supabase_tools import semantic_search, save_feed_item
from app.tools.skills_loader import get_skill_prompt

_model = init_chat_model("claude-sonnet-4-5", model_provider="anthropic")

_SYSTEM = f"""You are a financial policy analyst specializing in ASEAN regulatory and financial intelligence.
Analyze central bank policies, financial regulations, Islamic finance, and Web3/crypto regulation.
Always cite sources. Classify impact as HIGH, MEDIUM, or LOW.

{get_skill_prompt("earnings-analysis")}
{get_skill_prompt("macro-rates-monitor")}
{get_skill_prompt("equity-research")}
{get_skill_prompt("competitive-analysis")}

Key sources: OJK (ojk.go.id), Bank Indonesia (bi.go.id), Salaam Gateway, CoinDesk, The Block.
"""

analyst_agent = create_agent(
    _model,
    [tavily_search, semantic_search, save_feed_item],
    system_prompt=_SYSTEM,
)


def run_analyst(topic: str, region: str = "ASEAN") -> str:
    query = f"{region} financial regulatory policy {topic} 2026"
    result = analyst_agent.invoke({"messages": [{"role": "user", "content": query}]})
    return result["messages"][-1].content
