"""
tavily_tools.py — Enhanced OSINT search tools for Paparan.ai policy intelligence.

Improvements over v1:
- Cache-first: checks Supabase feed_items before hitting Tavily API
- Structured SearchResult output (not raw strings)
- ASEAN-specific source tiers with domain expertise
- Date filtering for recency control
- Retry + exponential backoff on fetch failures
- Smart content extraction (boilerplate removal, smart truncation)
- Deduplication across results
- Parallel fetch with asyncio (sync wrapper provided for LangGraph)
- search_depth support ("basic" / "advanced")
- Tavily include_answer for quick AI summaries
- Per-tool topic routing (gov / news / finance / general)
"""

from __future__ import annotations

import asyncio
import hashlib
import re
import time
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional
from urllib.parse import urlparse

import httpx
from langchain.tools import tool
from markdownify import markdownify
from pydantic import BaseModel, Field
from tavily import TavilyClient

from app.config import settings

# ── Client ────────────────────────────────────────────────────────────────────

_tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)

# ── Source tier registry ──────────────────────────────────────────────────────
# Each tier maps domain → (tavily_topic, priority_weight)
# priority_weight used when ranking results across tiers

SOURCE_TIERS: dict[str, tuple[str, float]] = {
    # ── Tier 0: Indonesian Government (highest trust) ──────────────────────
    "bappenas.go.id":       ("general", 1.0),
    "dpr.go.id":            ("general", 1.0),
    "bi.go.id":             ("finance", 1.0),
    "ojk.go.id":            ("finance", 1.0),
    "kemenkeu.go.id":       ("finance", 1.0),
    "bps.go.id":            ("general", 1.0),
    "setneg.go.id":         ("general", 1.0),
    "data.go.id":           ("general", 1.0),
    # ── Tier 1: ASEAN & International Institutions ─────────────────────────
    "asean.org":            ("general", 0.95),
    "worldbank.org":        ("finance", 0.95),
    "imf.org":              ("finance", 0.95),
    "adb.org":              ("finance", 0.95),
    "parliament.gov.my":    ("general", 0.9),
    "parliament.gov.sg":    ("general", 0.9),
    "congress.gov.ph":      ("general", 0.9),
    "quochoi.vn":           ("general", 0.9),
    # ── Tier 2: Premium News ───────────────────────────────────────────────
    "reuters.com":          ("news", 0.85),
    "apnews.com":           ("news", 0.85),
    "bloomberg.com":        ("news", 0.85),
    "ft.com":               ("news", 0.85),
    "channelnewsasia.com":  ("news", 0.85),
    "straitstimes.com":     ("news", 0.80),
    "bangkokpost.com":      ("news", 0.75),
    "thejakartapost.com":   ("news", 0.80),
    # ── Tier 3: Indonesian News & Finance ──────────────────────────────────
    "antaranews.com":       ("news", 0.75),
    "kontan.co.id":         ("finance", 0.75),
    "bisnis.com":           ("finance", 0.75),
    "kompas.com":           ("news", 0.70),
    "tempo.co":             ("news", 0.70),
    # ── Tier 4: OSINT / Policy Research ───────────────────────────────────
    "acleddata.com":        ("general", 0.85),
    "globalfishingwatch.org": ("general", 0.82),
    "globalforestwatch.org":  ("general", 0.82),
    "firms.modaps.eosdis.nasa.gov": ("general", 0.80),
    "crisisgroup.org":      ("general", 0.85),
    "iseas.edu.sg":         ("general", 0.85),
    "lowyinstitute.org":    ("general", 0.80),
    "csis.org":             ("general", 0.80),
    "opencorporates.com":   ("general", 0.75),
    "marinetraffic.com":    ("general", 0.72),
    "vesselfinder.com":     ("general", 0.70),
    "archive.org":          ("general", 0.70),
    "web.archive.org":      ("general", 0.70),
    "sentinel-hub.com":     ("general", 0.78),
    "earthengine.google.com": ("general", 0.78),
    "reliefweb.int":        ("general", 0.80),
    "hrw.org":              ("general", 0.78),
    # ── Tier 5: Islamic Finance / Web3 ─────────────────────────────────────
    "salaamgateway.com":    ("news", 0.65),
    "coindesk.com":         ("news", 0.60),
}

DOMAIN_TO_TOPIC = {d: t for d, (t, _) in SOURCE_TIERS.items()}
DOMAIN_TO_WEIGHT = {d: w for d, (_, w) in SOURCE_TIERS.items()}


def _domain(url: str) -> str:
    """Extract base domain from URL."""
    try:
        return urlparse(url).netloc.lstrip("www.")
    except Exception:
        return ""


def _content_hash(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


# ── Pydantic models ───────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    title: str
    url: str
    domain: str
    content: str
    source_tier: str = "unknown"
    priority_weight: float = 0.5
    published_date: Optional[str] = None
    tavily_score: Optional[float] = None
    ai_summary: Optional[str] = None

    def to_markdown(self) -> str:
        tier_label = f"[{self.source_tier.upper()}·{self.priority_weight:.2f}]"
        date_label = f" · {self.published_date}" if self.published_date else ""
        summary_block = f"\n> **AI Summary:** {self.ai_summary}\n" if self.ai_summary else ""
        return (
            f"## {self.title} {tier_label}{date_label}\n"
            f"**URL:** {self.url}\n"
            f"{summary_block}\n"
            f"{self.content}\n"
            f"---"
        )


class SearchBundle(BaseModel):
    query: str
    results: list[SearchResult] = Field(default_factory=list)
    total_found: int = 0
    cache_hits: int = 0
    api_calls: int = 0
    elapsed_ms: float = 0.0

    def to_markdown(self) -> str:
        if not self.results:
            return f"No results found for: {self.query}"
        meta = (
            f"*{self.total_found} results · "
            f"{self.cache_hits} cached · "
            f"{self.api_calls} API calls · "
            f"{self.elapsed_ms:.0f}ms*\n\n"
        )
        return meta + "\n".join(r.to_markdown() for r in self.results)


# ── Content fetching ──────────────────────────────────────────────────────────

_BOILERPLATE_PATTERNS = re.compile(
    r"(cookie|subscribe|newsletter|advertisement|follow us|share this|"
    r"related articles|you may also like|sign up|log in|register now)",
    re.IGNORECASE,
)

_FETCH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
}


def _clean_markdown(raw: str, max_chars: int = 6000) -> str:
    """Convert HTML→MD, strip boilerplate, smart-truncate at paragraph boundary."""
    md = markdownify(raw, heading_style="ATX", bullets="-")
    # Remove lines that are pure boilerplate
    lines = [l for l in md.splitlines() if not _BOILERPLATE_PATTERNS.search(l)]
    # Remove excessive blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
    if len(cleaned) <= max_chars:
        return cleaned
    # Truncate at last paragraph boundary before max_chars
    truncated = cleaned[:max_chars]
    last_para = truncated.rfind("\n\n")
    if last_para > max_chars * 0.7:
        truncated = truncated[:last_para]
    return truncated + "\n\n*[Content truncated]*"


async def _fetch_url_async(
    client: httpx.AsyncClient,
    url: str,
    retries: int = 2,
) -> str:
    """Fetch URL with retry + exponential backoff. Returns cleaned markdown."""
    for attempt in range(retries + 1):
        try:
            r = await client.get(url, headers=_FETCH_HEADERS, timeout=12.0, follow_redirects=True)
            r.raise_for_status()
            return _clean_markdown(r.text)
        except httpx.TimeoutException:
            if attempt < retries:
                await asyncio.sleep(2 ** attempt)
            return f"*Timeout fetching {url}*"
        except httpx.HTTPStatusError as e:
            return f"*HTTP {e.response.status_code} for {url}*"
        except Exception as e:
            if attempt < retries:
                await asyncio.sleep(2 ** attempt)
            else:
                return f"*Error fetching {url}: {e}*"
    return f"*Failed to fetch {url}*"


async def _fetch_all(urls: list[str]) -> list[str]:
    """Fetch multiple URLs concurrently."""
    async with httpx.AsyncClient() as client:
        return await asyncio.gather(*[_fetch_url_async(client, u) for u in urls])


def fetch_urls_parallel(urls: list[str]) -> list[str]:
    """Sync wrapper for parallel URL fetching (safe to call from LangGraph nodes)."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, _fetch_all(urls))
                return future.result()
        return loop.run_until_complete(_fetch_all(urls))
    except RuntimeError:
        return asyncio.run(_fetch_all(urls))


# ── Cache layer ───────────────────────────────────────────────────────────────

def _check_supabase_cache(query: str, max_age_hours: int = 6) -> list[SearchResult]:
    """
    Check Supabase feed_items for recent cached results matching the query.
    Returns SearchResult list (may be empty if cache miss or Supabase unavailable).
    """
    try:
        from app.db.client import supabase  # lazy import to avoid circular deps

        cutoff = (datetime.now(timezone.utc) - timedelta(hours=max_age_hours)).isoformat()
        rows = (
            supabase.table("feed_items")
            .select("title, url, content, source_domain, published_at")
            .ilike("content", f"%{query[:60]}%")
            .gte("published_at", cutoff)
            .limit(5)
            .execute()
        ).data or []

        results = []
        for row in rows:
            domain = row.get("source_domain") or _domain(row.get("url", ""))
            results.append(SearchResult(
                title=row.get("title", "Cached Result"),
                url=row.get("url", ""),
                domain=domain,
                content=row.get("content", "")[:6000],
                source_tier=_classify_tier(domain),
                priority_weight=DOMAIN_TO_WEIGHT.get(domain, 0.5),
                published_date=row.get("published_at", "")[:10],
            ))
        return results
    except Exception:
        return []


def _classify_tier(domain: str) -> str:
    if domain in {"bappenas.go.id", "dpr.go.id", "bi.go.id", "kemenkeu.go.id", "bps.go.id"}:
        return "gov-id"
    if domain in {"asean.org", "worldbank.org", "imf.org", "adb.org"}:
        return "intl-institution"
    if domain in {"parliament.gov.my", "parliament.gov.sg", "congress.gov.ph"}:
        return "gov-asean"
    if domain in {"reuters.com", "bloomberg.com", "ft.com", "apnews.com"}:
        return "tier1-news"
    if domain in {"acleddata.com", "crisisgroup.org", "iseas.edu.sg", "lowyinstitute.org",
                  "globalforestwatch.org", "globalfishingwatch.org", "reliefweb.int", "hrw.org"}:
        return "policy-research"
    if domain.endswith(".go.id") or domain.endswith(".gov.id"):
        return "gov-id"
    return "general"


# ── Core search function ───────────────────────────────────────────────────────

def _run_tavily_search(
    query: str,
    topic: str = "general",
    max_results: int = 5,
    search_depth: Literal["basic", "advanced"] = "basic",
    days: Optional[int] = None,
    include_domains: Optional[list[str]] = None,
    exclude_domains: Optional[list[str]] = None,
    include_answer: bool = False,
    cache_max_age_hours: int = 6,
) -> SearchBundle:
    """
    Core search: cache-first → Tavily API → parallel fetch → deduplicate → rank.
    """
    t0 = time.perf_counter()
    bundle = SearchBundle(query=query)
    seen_urls: set[str] = set()

    # 1. Cache check
    cached = _check_supabase_cache(query, max_age_hours=cache_max_age_hours)
    for r in cached:
        if r.url not in seen_urls:
            seen_urls.add(r.url)
            bundle.results.append(r)
            bundle.cache_hits += 1

    # If cache fully satisfies the request, skip API
    if len(bundle.results) >= max_results:
        bundle.results = bundle.results[:max_results]
        bundle.total_found = len(bundle.results)
        bundle.elapsed_ms = (time.perf_counter() - t0) * 1000
        return bundle

    # 2. Tavily API call
    try:
        kwargs: dict = dict(
            query=query,
            max_results=max_results,
            topic=topic,
            search_depth=search_depth,
            include_answer=include_answer,
        )
        if days:
            kwargs["days"] = days
        if include_domains:
            kwargs["include_domains"] = include_domains
        if exclude_domains:
            kwargs["exclude_domains"] = exclude_domains

        response = _tavily.search(**kwargs)
        bundle.api_calls += 1

        raw_results = response.get("results", [])
        ai_answer = response.get("answer")  # only present if include_answer=True

        # 3. Parallel fetch full content for new URLs only
        new_results = [r for r in raw_results if r.get("url") not in seen_urls]
        urls_to_fetch = [r["url"] for r in new_results]
        fetched_contents = fetch_urls_parallel(urls_to_fetch) if urls_to_fetch else []

        for raw, content in zip(new_results, fetched_contents):
            url = raw.get("url", "")
            if url in seen_urls:
                continue
            seen_urls.add(url)
            domain = _domain(url)
            result = SearchResult(
                title=raw.get("title", ""),
                url=url,
                domain=domain,
                content=content,
                source_tier=_classify_tier(domain),
                priority_weight=DOMAIN_TO_WEIGHT.get(domain, 0.5),
                published_date=raw.get("published_date"),
                tavily_score=raw.get("score"),
                # Attach AI answer only to first result
                ai_summary=ai_answer if (not bundle.results and ai_answer) else None,
            )
            bundle.results.append(result)

    except Exception as e:
        # Don't crash the agent — return cache results + error note
        bundle.results.append(SearchResult(
            title="Search Error",
            url="",
            domain="",
            content=f"Tavily search failed: {e}. Returning cached results only.",
        ))

    # 4. Rank: gov sources first, then by priority_weight, then by tavily_score
    bundle.results.sort(
        key=lambda r: (
            -r.priority_weight,
            -(r.tavily_score or 0.0),
        )
    )

    bundle.results = bundle.results[:max_results]
    bundle.total_found = len(bundle.results)
    bundle.elapsed_ms = (time.perf_counter() - t0) * 1000
    return bundle


# ── LangChain tools ───────────────────────────────────────────────────────────

@tool
def tavily_search(
    query: str,
    topic: str = "general",
    max_results: int = 5,
    days: int = 30,
    search_depth: str = "basic",
) -> str:
    """
    Search the web for policy intelligence using Tavily.

    Args:
        query: Search query. Be specific — include country names, policy areas,
               institution names (e.g. "Bappenas RPJMN 2025 infrastruktur digital").
        topic: Search topic filter — "general", "news", or "finance".
        max_results: Number of results to return (1–10). Default 5.
        days: Only return results from the last N days. Default 30.
        search_depth: "basic" (fast) or "advanced" (thorough, costs more API credits).

    Returns:
        Ranked markdown with title, URL, source tier, and full page content.
    """
    depth: Literal["basic", "advanced"] = "advanced" if search_depth == "advanced" else "basic"
    bundle = _run_tavily_search(
        query=query,
        topic=topic,
        max_results=max_results,
        search_depth=depth,
        days=days,
        include_answer=True,
    )
    return bundle.to_markdown()


@tool
def search_government_sources(query: str, country: str = "indonesia") -> str:
    """
    Search official government and institutional sources only.
    Use for: policy verification, official statistics, government announcements.

    Args:
        query: Policy or data query.
        country: Target country — "indonesia", "malaysia", "singapore",
                 "philippines", "vietnam", "asean", or "international".

    Returns:
        Results restricted to trusted government/institutional domains.
    """
    domain_map: dict[str, list[str]] = {
        "indonesia": [
            "bappenas.go.id", "dpr.go.id", "bi.go.id", "kemenkeu.go.id",
            "bps.go.id", "ojk.go.id", "setneg.go.id", "data.go.id",
        ],
        "malaysia":     ["parliament.gov.my", "treasury.gov.my", "bnm.gov.my"],
        "singapore":    ["parliament.gov.sg", "mas.gov.sg", "mti.gov.sg"],
        "philippines":  ["congress.gov.ph", "bsp.gov.ph", "neda.gov.ph"],
        "vietnam":      ["quochoi.vn", "sbv.gov.vn"],
        "asean":        ["asean.org", "adb.org"],
        "international": ["worldbank.org", "imf.org", "un.org", "oecd.org"],
    }
    domains = domain_map.get(country.lower(), domain_map["international"])
    bundle = _run_tavily_search(
        query=query,
        topic="general",
        max_results=5,
        search_depth="advanced",
        include_domains=domains,
        include_answer=False,
        cache_max_age_hours=12,
    )
    return bundle.to_markdown()


@tool
def search_policy_research(query: str, days: int = 90) -> str:
    """
    Search think tanks, research institutes, and policy journals.
    Use for: academic analysis, regional outlooks, conflict/stability assessments.

    Args:
        query: Research topic or policy question.
        days: Recency window in days (default 90).

    Returns:
        Results from ISEAS, Lowy Institute, Crisis Group, CSIS, and similar.
    """
    research_domains = [
        "iseas.edu.sg", "lowyinstitute.org", "crisisgroup.org",
        "csis.org", "chathamhouse.org", "sipri.org", "rand.org",
        "brookings.edu", "cfr.org", "acleddata.com",
        "globalforestwatch.org", "globalfishingwatch.org", "reliefweb.int",
    ]
    bundle = _run_tavily_search(
        query=query,
        topic="general",
        max_results=5,
        search_depth="advanced",
        include_domains=research_domains,
        days=days,
        include_answer=True,
    )
    return bundle.to_markdown()


@tool
def search_asean_news(query: str, days: int = 7) -> str:
    """
    Search recent ASEAN and Southeast Asia news.
    Use for: breaking developments, ministerial statements, diplomatic events.

    Args:
        query: News topic or event.
        days: Recency window (default 7 — last week).

    Returns:
        Recent news ranked by source credibility and recency.
    """
    bundle = _run_tavily_search(
        query=f"ASEAN Southeast Asia {query}",
        topic="news",
        max_results=6,
        search_depth="basic",
        days=days,
        include_answer=True,
        exclude_domains=["reddit.com", "quora.com", "medium.com"],
    )
    return bundle.to_markdown()


@tool
def search_financial_intelligence(query: str, days: int = 14) -> str:
    """
    Search financial news and economic data sources.
    Use for: trade data, investment flows, fiscal policy, central bank decisions.

    Args:
        query: Financial or economic query.
        days: Recency window (default 14 days).

    Returns:
        Results from Bloomberg, Reuters, FT, central banks, and IFIs.
    """
    bundle = _run_tavily_search(
        query=query,
        topic="finance",
        max_results=5,
        search_depth="basic",
        days=days,
        include_answer=True,
    )
    return bundle.to_markdown()


@tool
def scrape_source_tier(source_domain: str, query: str, days: int = 30) -> str:
    """
    Deep-search a specific trusted source domain.
    Use when you need authoritative information from one specific institution.

    Args:
        source_domain: Domain to search (e.g. "bi.go.id", "asean.org").
        query: Topic to search within that domain.
        days: Recency window (default 30 days).

    Returns:
        Full content from the specified source with source tier metadata.
    """
    topic = DOMAIN_TO_TOPIC.get(source_domain, "general")
    bundle = _run_tavily_search(
        query=f"site:{source_domain} {query}",
        topic=topic,
        max_results=3,
        search_depth="advanced",
        days=days,
        include_answer=False,
    )
    return bundle.to_markdown()


@tool
def fetch_webpage(url: str) -> str:
    """
    Fetch and extract the full text content of a specific URL.
    Use when you have a direct URL and need its complete content.

    Args:
        url: Full URL to fetch (must start with http:// or https://).

    Returns:
        Cleaned markdown content of the page, up to 6000 characters.
    """
    contents = fetch_urls_parallel([url])
    content = contents[0] if contents else "*Failed to fetch page*"
    domain = _domain(url)
    tier = _classify_tier(domain)
    weight = DOMAIN_TO_WEIGHT.get(domain, 0.5)
    return f"**Source:** {url}\n**Tier:** {tier} (weight: {weight:.2f})\n\n{content}"


# ── Tool registry (for orchestrator import) ───────────────────────────────────

ALL_TAVILY_TOOLS = [
    tavily_search,
    search_government_sources,
    search_policy_research,
    search_asean_news,
    search_financial_intelligence,
    scrape_source_tier,
    fetch_webpage,
]