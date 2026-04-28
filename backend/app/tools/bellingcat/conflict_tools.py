"""Conflict & event data — ACLED API with Tavily fallback."""
import httpx
from langchain.tools import tool
from app.config import settings
from app.tools.tavily_tools import tavily_search

_ACLED_URL = "https://api.acleddata.com/acled/read"

# ASEAN country name → ISO code mapping for ACLED
_COUNTRY_MAP = {
    "myanmar": "Myanmar", "burma": "Myanmar",
    "philippines": "Philippines", "phil": "Philippines",
    "indonesia": "Indonesia", "papua": "Indonesia",
    "thailand": "Thailand", "malaysia": "Malaysia",
    "vietnam": "Vietnam", "cambodia": "Cambodia",
    "laos": "Laos", "singapore": "Singapore",
}


def _acled_query(country: str, days: int) -> list:
    """Query ACLED API for conflict events."""
    if not settings.ACLED_API_KEY or not settings.ACLED_EMAIL:
        return []
    try:
        from datetime import datetime, timedelta
        since = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        r = httpx.get(
            _ACLED_URL,
            params={
                "key": settings.ACLED_API_KEY,
                "email": settings.ACLED_EMAIL,
                "country": country,
                "event_date": since,
                "event_date_where": ">=",
                "limit": 50,
                "fields": "event_date|event_type|actor1|location|fatalities|notes",
            },
            timeout=10.0,
        )
        if r.status_code == 200:
            return r.json().get("data", [])
    except Exception:
        pass
    return []


@tool
def get_conflict_events(region: str, days: int = 30) -> dict:
    """Get conflict and security events for an ASEAN region from ACLED.

    Args:
        region: Country or region name (e.g. 'Myanmar', 'Papua', 'Philippines')
        days: Lookback window in days

    Returns:
        Dict with events list, event_count, fatalities, source
    """
    country = _COUNTRY_MAP.get(region.lower(), region)
    events = _acled_query(country, days)

    if not events:
        # Tavily fallback
        news = tavily_search.invoke({
            "query": f"{region} conflict security incident {days} days",
            "topic": "news", "max_results": 3, "days": days,
        })
        return {
            "region": region, "event_count": None, "fatalities": None,
            "events": [], "source": "tavily_fallback", "news_summary": news[:500],
            "acled_url": f"https://acleddata.com/data-export-tool/?country={country}",
        }

    fatalities = sum(int(e.get("fatalities", 0) or 0) for e in events)
    event_types = {}
    for e in events:
        et = e.get("event_type", "Unknown")
        event_types[et] = event_types.get(et, 0) + 1

    return {
        "region": region, "country": country,
        "event_count": len(events),
        "fatalities": fatalities,
        "dominant_event_type": max(event_types, key=event_types.get) if event_types else "Unknown",
        "event_type_breakdown": event_types,
        "events": events[:10],  # return first 10
        "source": "acled",
        "acled_url": f"https://acleddata.com/data-export-tool/?country={country}",
    }


@tool
def get_stability_index(country: str) -> dict:
    """Compute a simple stability score for an ASEAN country.

    Args:
        country: Country name

    Returns:
        Dict with stability_score (0-1), trend, event_count, fatalities
    """
    result = get_conflict_events.invoke({"region": country, "days": 30})
    event_count = result.get("event_count") or 0
    fatalities = result.get("fatalities") or 0

    # Score: 1 = stable, 0 = highly unstable
    score = round(max(0.0, 1.0 - min(event_count / 100, 0.7) - min(fatalities / 500, 0.3)), 3)

    trend = "stable"
    if score < 0.4:
        trend = "deteriorating"
    elif score < 0.65:
        trend = "fragile"

    return {
        "country": country,
        "stability_score": score,
        "trend": trend,
        "event_count_30d": event_count,
        "fatalities_30d": fatalities,
        "dominant_event_type": result.get("dominant_event_type", "Unknown"),
    }


@tool
def search_conflict_news(region: str, days: int = 7) -> str:
    """Search conflict and security news for an ASEAN region.

    Args:
        region: Region or country name
        days: Recency window in days

    Returns:
        Markdown news results from conflict-focused sources
    """
    from app.tools.tavily_tools import _run_tavily_search
    bundle = _run_tavily_search(
        query=f"{region} conflict security stability",
        topic="news", max_results=5, days=days,
        include_domains=["acleddata.com", "crisisgroup.org", "reliefweb.int",
                         "hrw.org", "amnesty.org", "iseas.edu.sg"],
    )
    return bundle.to_markdown()
