import httpx
from markdownify import markdownify
from langchain.tools import tool
from tavily import TavilyClient
from app.config import settings

_tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)

_SOURCE_TOPIC_MAP = {
    **{s: "general" for s in settings.PRIMARY_SOURCES},
    **{s: "news" for s in settings.TIER1_SOURCES},
    **{s: "finance" for s in settings.INDONESIA_SOURCES},
    **{s: "finance" for s in settings.ISLAMIC_WEB3_SOURCES},
}


def fetch_webpage(url: str) -> str:
    try:
        r = httpx.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10.0, follow_redirects=True)
        r.raise_for_status()
        return markdownify(r.text)[:8000]
    except Exception as e:
        return f"Error fetching {url}: {e}"


@tool
def tavily_search(query: str, topic: str = "general", max_results: int = 3) -> str:
    """Search the web using Tavily and return full page content."""
    results = _tavily.search(query, max_results=max_results, topic=topic).get("results", [])
    parts = []
    for r in results:
        content = fetch_webpage(r["url"])
        parts.append(f"## {r['title']}\n**URL:** {r['url']}\n\n{content}\n---")
    return "\n".join(parts) if parts else "No results found."


@tool
def scrape_source_tier(source_domain: str, query: str) -> str:
    """Search a specific source domain using the appropriate Tavily topic filter."""
    topic = _SOURCE_TOPIC_MAP.get(source_domain, "general")
    full_query = f"site:{source_domain} {query}"
    return tavily_search.invoke({"query": full_query, "topic": topic, "max_results": 2})
