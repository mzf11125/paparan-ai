from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.tools.tavily_tools import tavily_search, scrape_source_tier
from app.tools.supabase_tools import check_feed_cache, save_feed_item
from app.db.vector_store import feed_store
from app.config import settings

ASEAN_QUERIES = [
    "ASEAN policy regulation 2026",
    "Malaysia parliament bill 2026",
    "Singapore regulatory announcement 2026",
    "Indonesia DPR legislation 2026",
    "Thailand parliament 2026",
    "Philippines congress bill 2026",
    "Vietnam regulatory policy 2026",
    "OJK fintech regulation 2026",
    "Bank Indonesia monetary policy 2026",
    "ASEAN digital economy 2026",
]

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)


class ScraperState(TypedDict):
    queries: list[str]
    saved_count: int


def scrape_node(state: ScraperState) -> ScraperState:
    saved = 0
    for query in state["queries"]:
        try:
            raw = tavily_search.invoke({"query": query, "topic": "news", "max_results": 3})
            # Parse results — each block starts with "## Title\n**URL:** url"
            for block in raw.split("---"):
                lines = block.strip().splitlines()
                if len(lines) < 2:
                    continue
                title = lines[0].lstrip("# ").strip()
                url_line = next((l for l in lines if l.startswith("**URL:**")), "")
                url = url_line.replace("**URL:**", "").strip()
                if not url:
                    continue
                # Cache check
                cached = check_feed_cache.invoke({"url": url})
                if cached:
                    continue
                summary = " ".join(lines[2:5])
                # Detect region from query
                region = "ASEAN"
                for country in ["Malaysia", "Singapore", "Indonesia", "Thailand", "Philippines", "Vietnam"]:
                    if country.lower() in query.lower():
                        region = country
                        break
                save_feed_item.invoke({
                    "title": title, "summary": summary, "url": url,
                    "source": "tavily", "region": region, "topic_tags": query.split()[:3],
                })
                # Auto-archive to Wayback Machine (fire-and-forget)
                try:
                    from app.tools.bellingcat.archive_tools import archive_source
                    archive_source.invoke({"url": url})
                except Exception:
                    pass
                saved += 1
        except Exception:
            continue
    return {"queries": state["queries"], "saved_count": state["saved_count"] + saved}


graph = StateGraph(ScraperState)
graph.add_node("scrape", scrape_node)
graph.add_edge(START, "scrape")
graph.add_edge("scrape", END)
scraper_agent = graph.compile()


def run_scraper():
    return scraper_agent.invoke({"queries": ASEAN_QUERIES, "saved_count": 0})
