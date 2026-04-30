"""Source preservation — Wayback Machine CDX API + auto-archiving."""
import httpx
from datetime import datetime, timedelta, timezone
from langchain.tools import tool

_CDX_URL = "https://web.archive.org/cdx/search/cdx"
_SAVE_URL = "https://web.archive.org/save/"
_HEADERS = {"User-Agent": "paparan-ai/1.0"}


@tool
def check_archive(url: str) -> dict:
    """Check if a URL is already archived in the Wayback Machine.

    Args:
        url: URL to check

    Returns:
        Dict with archived (bool), archive_url, last_archived
    """
    try:
        r = httpx.get(
            _CDX_URL,
            params={"url": url, "output": "json", "limit": 1,
                    "fl": "timestamp,original,statuscode", "filter": "statuscode:200"},
            headers=_HEADERS, timeout=8.0,
        )
        if r.status_code == 200:
            data = r.json()
            if data and len(data) > 1:  # first row is header
                ts = data[1][0]  # YYYYMMDDHHmmss
                archive_url = f"https://web.archive.org/web/{ts}/{url}"
                # Check if archived within last 7 days
                archived_dt = datetime.strptime(ts, "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
                recent = (datetime.now(timezone.utc) - archived_dt) < timedelta(days=7)
                return {"archived": True, "archive_url": archive_url,
                        "last_archived": ts, "recent": recent}
    except Exception:
        pass
    return {"archived": False, "archive_url": None, "last_archived": None, "recent": False}


@tool
def archive_source(url: str) -> dict:
    """Archive a URL to the Wayback Machine.

    Args:
        url: URL to archive

    Returns:
        Dict with archive_url, timestamp, status
    """
    # Check if already recently archived
    existing = check_archive.invoke({"url": url})
    if existing.get("recent"):
        return {"archive_url": existing["archive_url"], "status": "already_archived",
                "timestamp": existing["last_archived"]}

    try:
        r = httpx.get(f"{_SAVE_URL}{url}", headers=_HEADERS, timeout=30.0,
                      follow_redirects=True)
        if r.status_code == 200:
            # Wayback returns the archived URL in Content-Location header
            content_location = r.headers.get("Content-Location", "")
            ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
            archive_url = (f"https://web.archive.org{content_location}"
                           if content_location else f"https://web.archive.org/web/{ts}/{url}")
            return {"archive_url": archive_url, "status": "archived",
                    "timestamp": ts, "original_url": url}
    except Exception as e:
        pass

    # Fallback: return archive.ph link (user can manually submit)
    return {
        "archive_url": f"https://archive.ph/{url}",
        "status": "fallback_link",
        "timestamp": datetime.utcnow().strftime("%Y%m%d%H%M%S"),
        "original_url": url,
    }


@tool
def archive_brief_sources(sources: list) -> list:
    """Archive all sources from a brief to the Wayback Machine.

    Args:
        sources: List of source dicts with 'url' and 'id' keys

    Returns:
        List of {source_id, archive_url, status}
    """
    results = []
    for source in sources:
        url = source.get("url", "")
        if not url or not url.startswith("http"):
            continue
        result = archive_source.invoke({"url": url})
        results.append({
            "source_id": source.get("id", ""),
            "original_url": url,
            "archive_url": result.get("archive_url"),
            "status": result.get("status"),
        })
    return results
