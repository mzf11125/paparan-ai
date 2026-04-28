"""
Scraper agent for Paparan AI using LangGraph StateGraph.

Handles automated feed ingestion from ASEAN government sources,
news outlets, and policy research institutions.

Key features:
- LangGraph StateGraph for scraping workflow
- Cache checking to avoid duplicate work
- Parallel fetching with concurrency control
- Automatic embedding and vector indexing
- Source archiving to Wayback Machine
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional, Any, TypedDict, List
from urllib.parse import urlparse

from langgraph.graph import StateGraph, START, END
from langchain.tools import tool
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from pydantic import BaseModel

from app.config import settings
from app.tools.tavily_tools import (
    tavily_search,
    search_government_sources,
    search_asean_news,
    scrape_source_tier,
    fetch_webpage,
)
from app.tools.supabase_tools import (
    check_feed_cache,
    save_feed_item,
    batch_save_feed_items,
)
from app.tools.bellingcat.archive_tools import archive_source
from app.db.vector_store import get_feed_store


# ============================================================================
# Configuration
# ============================================================================

# Default ASEAN policy queries for scraping
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

# Source-specific queries
SOURCE_QUERIES = {
    "indonesia": [
        "site:dpr.go.id legislasi 2026",
        "site:bi.go.id kebijakan moneter 2026",
        "site:ojk.go.id regulasi fintech 2026",
        "site:kemenkeu.go.id kebijakan fiskal 2026",
    ],
    "malaysia": [
        "site:parliament.gov.my bills 2026",
        "site:bnm.gov.my monetary policy 2026",
    ],
    "singapore": [
        "site:parliament.gov.sg bills 2026",
        "site:mas.gov.sg regulatory 2026",
    ],
    "philippines": [
        "site:congress.gov.ph bills 2026",
        "site:bsp.gov.ph policy 2026",
    ],
    "vietnam": [
        "site:quochoi.vn luat 2026",
    ],
    "asean": [
        "site:asean.org declaration 2026",
    ],
}

# Text splitting for embedding
splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.chunk_size,  # 1000
    chunk_overlap=settings.chunk_overlap,  # 200
)

# Scraping settings
MAX_CONCURRENT_REQUESTS = settings.max_concurrent_requests  # 5
DEFAULT_TTL_HOURS = settings.feed_cache_expiry_hours  # 24


# ============================================================================
# State Models
# ============================================================================

class ScraperState(TypedDict):
    """State for the scraper workflow."""

    # Input
    queries: list[str]
    regions: list[str]
    force_refresh: bool

    # Progress
    total_queries: int
    completed_queries: int
    saved_count: int
    skipped_count: int
    failed_count: int

    # Results
    feed_items: list[dict]
    errors: list[str]

    # Metadata
    start_time: str
    end_time: Optional[str]


class ScrapedItem(BaseModel):
    """A scraped feed item."""

    title: str
    url: str
    content: str
    source: str
    region: str
    tier: str
    is_government: bool
    published_at: str
    topic_tags: list[str]


# ============================================================================
# Helper Functions
# ============================================================================

def extract_domain(url: str) -> str:
    """Extract base domain from URL."""
    try:
        return urlparse(url).netloc.lstrip("www.")
    except Exception:
        return ""


def detect_region_from_text(text: str) -> str:
    """Detect region/country from text."""
    text_lower = text.lower()

    region_keywords = {
        "Indonesia": ["indonesia", "jakarta", "dpr", "bi", "ojk", "kemenkeu"],
        "Malaysia": ["malaysia", "kuala lumpur", "parliament.gov.my"],
        "Singapore": ["singapore", "parliament.gov.sg", "mas"],
        "Thailand": ["thailand", "bangkok", "parliament.go.th"],
        "Philippines": ["philippines", "congress.gov.ph", "manila"],
        "Vietnam": ["vietnam", "quochoi", "hanoi"],
        "Brunei": ["brunei"],
        "Laos": ["laos"],
        "Myanmar": ["myanmar"],
        "Cambodia": ["cambodia"],
    }

    for region, keywords in region_keywords.items():
        if any(kw in text_lower for kw in keywords):
            return region

    return "ASEAN"


def classify_source_tier(domain: str) -> tuple[str, bool]:
    """
    Classify a source domain by tier and government status.

    Returns:
        Tuple of (tier, is_government).
    """
    from app.config import get_source_tier

    tier = get_source_tier(domain)
    is_gov = get_source_tier(domain) == "primary" or domain.endswith(".go.id")

    return tier, is_gov


def parse_tavily_result(result_block: str) -> Optional[dict]:
    """
    Parse a Tavily search result block into structured data.

    Args:
        result_block: A markdown block from Tavily results.

    Returns:
        Dict with title, url, content, or None if parsing fails.
    """
    lines = result_block.strip().splitlines()
    if len(lines) < 2:
        return None

    # Extract title (first line, remove leading #)
    title = lines[0].lstrip("#").strip()

    # Extract URL
    url = ""
    for line in lines:
        if line.startswith("**URL:**"):
            url = line.replace("**URL:**", "").strip()
            break

    if not url:
        return None

    # Extract content (lines after URL)
    url_idx = next(i for i, l in enumerate(lines) if "**URL:**" in l)
    content = "\n".join(lines[url_idx + 1:]).strip()

    # Extract source domain
    domain = extract_domain(url)
    tier, is_gov = classify_source_tier(domain)

    return {
        "title": title,
        "url": url,
        "content": content,
        "source": domain,
        "tier": tier,
        "is_government": is_gov,
    }


# ============================================================================
# Graph Nodes
# ============================================================================

def init_scrape_node(state: ScraperState) -> dict:
    """
    Initialize the scrape workflow.

    Sets up the initial state and prepares for processing.
    """
    queries = state.get("queries", ASEAN_QUERIES)

    return {
        "total_queries": len(queries),
        "completed_queries": 0,
        "saved_count": 0,
        "skipped_count": 0,
        "failed_count": 0,
        "feed_items": [],
        "errors": [],
        "start_time": datetime.now(timezone.utc).isoformat(),
    }


def scrape_query_node(state: ScraperState) -> dict:
    """
    Scrape results for a single query.

    This would be called in parallel for multiple queries in a real implementation.
    For now, processes sequentially.
    """
    # For sequential processing, take the next query
    queries = state.get("queries", ASEAN_QUERIES)
    completed = state.get("completed_queries", 0)

    if completed >= len(queries):
        return {}

    query = queries[completed]
    regions = state.get("regions", ["ASEAN"])
    force_refresh = state.get("force_refresh", False)

    saved = 0
    skipped = 0
    failed = 0
    items = []
    errors = []

    try:
        # Search for content
        raw = tavily_search.invoke({
            "query": query,
            "topic": "news",
            "max_results": 5,
            "days": 1,  # Last day only
        })

        # Parse results
        for block in raw.split("---"):
            parsed = parse_tavily_result(block)
            if not parsed:
                continue

            url = parsed["url"]

            # Check cache unless force refresh
            if not force_refresh:
                cache_result = check_feed_cache.invoke({"url": url})
                if cache_result.get("is_cached") and not cache_result.get("is_expired"):
                    skipped += 1
                    continue

            # Detect region
            region = detect_region_from_text(query + " " + parsed["content"])
            if region not in regions and "ASEAN" in regions:
                region = "ASEAN"

            # Generate topic tags from query
            topic_tags = query.split()[:3]

            # Save to cache and vector store
            try:
                save_result = save_feed_item.invoke({
                    "title": parsed["title"],
                    "summary": parsed["content"][:500],
                    "url": url,
                    "source": parsed["source"],
                    "region": region,
                    "topic_tags": topic_tags,
                    "tier": parsed["tier"],
                    "is_government": parsed["is_government"],
                    "content": parsed["content"],
                    "ttl_hours": DEFAULT_TTL_HOURS,
                })

                if "Failed" not in save_result:
                    saved += 1
                    items.append({
                        "title": parsed["title"],
                        "url": url,
                        "region": region,
                        "tier": parsed["tier"],
                    })

                    # Archive to Wayback Machine (fire-and-forget)
                    try:
                        archive_source.invoke({"url": url})
                    except Exception:
                        pass
                else:
                    failed += 1

            except Exception as e:
                failed += 1
                errors.append(f"Save failed for {url}: {e}")

    except Exception as e:
        failed += 1
        errors.append(f"Search failed for '{query}': {e}")

    return {
        "completed_queries": completed + 1,
        "saved_count": state.get("saved_count", 0) + saved,
        "skipped_count": state.get("skipped_count", 0) + skipped,
        "failed_count": state.get("failed_count", 0) + failed,
        "feed_items": state.get("feed_items", []) + items,
        "errors": state.get("errors", []) + errors,
    }


def should_continue_scraping(state: ScraperState) -> Literal["continue", "finalize"]:
    """
    Decide whether to continue scraping or finalize.

    Routes back to scrape_query_node if there are more queries,
    otherwise routes to finalize.
    """
    completed = state.get("completed_queries", 0)
    total = state.get("total_queries", len(state.get("queries", ASEAN_QUERIES)))

    if completed < total:
        return "continue"
    return "finalize"


def finalize_node(state: ScraperState) -> dict:
    """
    Finalize the scraping workflow.

    Computes summary statistics and finalizes the state.
    """
    return {
        "end_time": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# Build the Graph
# ============================================================================

def create_scraper_graph() -> StateGraph:
    """
    Create the LangGraph StateGraph for the scraper.

    Returns:
        Compiled StateGraph ready for execution.
    """
    graph = StateGraph(ScraperState)

    # Add nodes
    graph.add_node("init", init_scrape_node)
    graph.add_node("scrape_query", scrape_query_node)
    graph.add_node("finalize", finalize_node)

    # Add edges
    graph.add_edge(START, "init")
    graph.add_edge("init", "scrape_query")

    # Conditional edge for looping
    graph.add_conditional_edges(
        "scrape_query",
        should_continue_scraping,
        {
            "continue": "scrape_query",
            "finalize": "finalize",
        }
    )

    graph.add_edge("finalize", END)

    return graph.compile()


# Compiled graph instance
scraper_graph = create_scraper_graph()


# ============================================================================
# Main Entry Point
# ============================================================================

def run_scraper(
    queries: list[str] | None = None,
    regions: list[str] | None = None,
    force_refresh: bool = False,
) -> dict:
    """
    Run the scraper workflow.

    Args:
        queries: Optional list of search queries (uses ASEAN_QUERIES if None).
        regions: Optional list of regions to filter (uses ["ASEAN"] if None).
        force_refresh: Whether to bypass cache and refresh all items.

    Returns:
        Dict with scraping results and statistics.
    """
    # Initial state
    initial_state: ScraperState = {
        "queries": queries or ASEAN_QUERIES,
        "regions": regions or ["ASEAN"],
        "force_refresh": force_refresh,
        "total_queries": 0,
        "completed_queries": 0,
        "saved_count": 0,
        "skipped_count": 0,
        "failed_count": 0,
        "feed_items": [],
        "errors": [],
        "start_time": datetime.now(timezone.utc).isoformat(),
        "end_time": None,
    }

    # Run the graph
    try:
        final_state = scraper_graph.invoke(initial_state)
    except Exception as e:
        # Fallback to simple sequential scraping if graph fails
        return run_scraper_simple(queries, regions, force_refresh)

    return {
        "saved_count": final_state.get("saved_count", 0),
        "skipped_count": final_state.get("skipped_count", 0),
        "failed_count": final_state.get("failed_count", 0),
        "total_processed": final_state.get("completed_queries", 0),
        "feed_items": final_state.get("feed_items", []),
        "errors": final_state.get("errors", [])[:10],  # First 10 errors
        "start_time": final_state.get("start_time", ""),
        "end_time": final_state.get("end_time", ""),
    }


def run_scraper_simple(
    queries: list[str] | None = None,
    regions: list[str] | None = None,
    force_refresh: bool = False,
) -> dict:
    """
    Simple sequential scraper (fallback).

    Processes queries one at a time without graph complexity.
    """
    queries = queries or ASEAN_QUERIES
    regions = regions or ["ASEAN"]

    saved = 0
    skipped = 0
    failed = 0
    items = []
    errors = []
    start_time = datetime.now(timezone.utc).isoformat()

    for query in queries:
        try:
            raw = tavily_search.invoke({
                "query": query,
                "topic": "news",
                "max_results": 3,
                "days": 1,
            })

            for block in raw.split("---"):
                parsed = parse_tavily_result(block)
                if not parsed:
                    continue

                url = parsed["url"]

                if not force_refresh:
                    cache_result = check_feed_cache.invoke({"url": url})
                    if cache_result.get("is_cached") and not cache_result.get("is_expired"):
                        skipped += 1
                        continue

                region = detect_region_from_text(query + " " + parsed["content"])
                topic_tags = query.split()[:3]

                try:
                    save_result = save_feed_item.invoke({
                        "title": parsed["title"],
                        "summary": parsed["content"][:500],
                        "url": url,
                        "source": parsed["source"],
                        "region": region,
                        "topic_tags": topic_tags,
                        "tier": parsed["tier"],
                        "is_government": parsed["is_government"],
                        "content": parsed["content"],
                    })

                    if "Failed" not in save_result:
                        saved += 1
                        items.append({"title": parsed["title"], "url": url, "region": region})
                    else:
                        failed += 1

                except Exception:
                    failed += 1

        except Exception as e:
            errors.append(str(e))
            failed += 1

    return {
        "saved_count": saved,
        "skipped_count": skipped,
        "failed_count": failed,
        "total_processed": len(queries),
        "feed_items": items,
        "errors": errors[:10],
        "start_time": start_time,
        "end_time": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# Specialized Scrapers
# ============================================================================

def scrape_indonesia_government(force_refresh: bool = False) -> dict:
    """
    Scrape Indonesian government sources specifically.

    Args:
        force_refresh: Whether to bypass cache.

    Returns:
        Scraping results.
    """
    queries = SOURCE_QUERIES.get("indonesia", [])

    return run_scraper(
        queries=queries,
        regions=["Indonesia", "ASEAN"],
        force_refresh=force_refresh,
    )


def scrape_asean_government(force_refresh: bool = False) -> dict:
    """
    Scrape ASEAN regional government sources.

    Args:
        force_refresh: Whether to bypass cache.

    Returns:
        Scraping results.
    """
    queries = []
    for country in ["malaysia", "singapore", "philippines", "vietnam", "asean"]:
        queries.extend(SOURCE_QUERIES.get(country, []))

    return run_scraper(
        queries=queries,
        regions=["ASEAN"],
        force_refresh=force_refresh,
    )


def scrape_by_tier(tier: str, force_refresh: bool = False) -> dict:
    """
    Scrape sources by tier.

    Args:
        tier: Source tier to scrape (primary, tier1, indonesia, islamic_web3).
        force_refresh: Whether to bypass cache.

    Returns:
        Scraping results.
    """
    from app.config import get_all_sources

    sources = get_all_sources()

    # Build queries for this tier
    tier_sources = []
    if tier == "primary":
        tier_sources = settings.PRIMARY_SOURCES
    elif tier == "tier1":
        tier_sources = settings.TIER1_SOURCES
    elif tier == "indonesia":
        tier_sources = settings.INDONESIA_SOURCES
    elif tier == "islamic_web3":
        tier_sources = settings.ISLAMIC_WEB3_SOURCES

    queries = [f"site:{source} policy 2026" for source in tier_sources[:5]]

    return run_scraper(
        queries=queries,
        regions=["ASEAN"],
        force_refresh=force_refresh,
    )


# ============================================================================
# Batch Operations
# ============================================================================

async def scrape_all_tiers(force_refresh: bool = False) -> dict:
    """
    Scrape all source tiers in parallel.

    Args:
        force_refresh: Whether to bypass cache.

    Returns:
        Combined results from all tiers.
    """
    tiers = ["primary", "tier1", "indonesia", "islamic_web3"]

    tasks = [
        asyncio.to_thread(scrape_by_tier, tier, force_refresh)
        for tier in tiers
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    combined = {
        "saved_count": 0,
        "skipped_count": 0,
        "failed_count": 0,
        "feed_items": [],
        "errors": [],
        "by_tier": {},
    }

    for tier, result in zip(tiers, results):
        if isinstance(result, Exception):
            combined["errors"].append(f"{tier}: {str(result)}")
            continue

        combined["by_tier"][tier] = result
        combined["saved_count"] += result.get("saved_count", 0)
        combined["skipped_count"] += result.get("skipped_count", 0)
        combined["failed_count"] += result.get("failed_count", 0)
        combined["feed_items"].extend(result.get("feed_items", []))
        combined["errors"].extend(result.get("errors", []))

    return combined


# ============================================================================
# Scheduled Scraping
# ============================================================================

def should_scrape() -> bool:
    """
    Check if scraping should run based on configured interval.

    Returns:
        True if enough time has passed since last scrape.
    """
    # In production, check last scrape timestamp from database
    # For now, always return True
    return True


def scheduled_scrape() -> dict:
    """
    Run scheduled scraping based on configuration.

    Called by cron jobs or scheduled tasks.
    """
    if not should_scrape():
        return {"status": "skipped", "reason": "Too soon since last scrape"}

    return run_scraper()


# ============================================================================
# Exports
# ============================================================================

__all__ = [
    # Main functions
    "run_scraper",
    "run_scraper_simple",
    "create_scraper_graph",
    "scraper_graph",
    # Specialized scrapers
    "scrape_indonesia_government",
    "scrape_asean_government",
    "scrape_by_tier",
    # Batch operations
    "scrape_all_tiers",
    # Scheduled scraping
    "should_scrape",
    "scheduled_scrape",
    # Configuration
    "ASEAN_QUERIES",
    "SOURCE_QUERIES",
    # Helpers
    "extract_domain",
    "detect_region_from_text",
    "classify_source_tier",
    "parse_tavily_result",
    # Models
    "ScraperState",
    "ScrapedItem",
]
