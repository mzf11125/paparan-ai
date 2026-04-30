"""Maritime intelligence tools — vessel tracking in ASEAN waters."""
import httpx
from langchain.tools import tool
from app.tools.spatial_tools import _ASEAN_BBOXES

# Strait bounding boxes [min_lon, min_lat, max_lon, max_lat]
_STRAIT_BBOXES = {
    "Malacca Strait":    [99.0, 1.0, 104.5, 6.5],
    "Lombok Strait":     [115.5, -9.0, 116.5, -8.0],
    "Sunda Strait":      [105.5, -6.5, 106.5, -5.5],
    "South China Sea":   [109.0, 0.0, 121.0, 22.0],
    "Makassar Strait":   [116.0, -5.0, 120.0, 2.0],
    "Banda Sea":         [124.0, -8.0, 132.0, -3.0],
}

# Baseline vessel counts for anomaly detection (approximate)
_BASELINE_VESSELS = {
    "Malacca Strait": 250, "South China Sea": 400,
    "Lombok Strait": 80, "Sunda Strait": 60,
    "Makassar Strait": 120, "Banda Sea": 50,
}

_HEADERS = {"User-Agent": "paparan-ai/1.0"}


def _query_vesselfinder(bbox: list) -> int | None:
    """Query VesselFinder public map API for vessel count in bbox."""
    try:
        min_lon, min_lat, max_lon, max_lat = bbox
        url = "https://www.vesselfinder.com/api/pub/vesselsonmap"
        params = {"bbox": f"{min_lat},{min_lon},{max_lat},{max_lon}", "zoom": 6}
        r = httpx.get(url, params=params, headers=_HEADERS, timeout=8.0)
        if r.status_code == 200:
            data = r.json()
            # VesselFinder returns array of vessel arrays
            return len(data) if isinstance(data, list) else None
    except Exception:
        pass
    return None


@tool
def track_maritime_activity(region: str, date_range: str = "7d") -> dict:
    """Track vessel activity in an ASEAN maritime region.

    Args:
        region: Region name (e.g. 'Malacca Strait', 'South China Sea', 'Indonesia')
        date_range: Time range string (e.g. '7d', '30d') — informational only

    Returns:
        Dict with vessel_count, anomaly_flag, baseline, source_url
    """
    # Match to strait or country bbox
    bbox = _STRAIT_BBOXES.get(region)
    if not bbox:
        country_bbox = _ASEAN_BBOXES.get(region, _ASEAN_BBOXES["ASEAN"])
        bbox = [country_bbox["min_lon"], country_bbox["min_lat"],
                country_bbox["max_lon"], country_bbox["max_lat"]]

    vessel_count = _query_vesselfinder(bbox)
    baseline = _BASELINE_VESSELS.get(region, 100)
    anomaly = False
    if vessel_count is not None:
        anomaly = vessel_count > baseline * 1.5 or vessel_count < baseline * 0.5

    min_lon, min_lat, max_lon, max_lat = bbox
    return {
        "region": region,
        "vessel_count": vessel_count,
        "baseline": baseline,
        "anomaly_flag": anomaly,
        "date_range": date_range,
        "source_url": f"https://www.marinetraffic.com/en/ais/home/centerx:{(min_lon+max_lon)/2:.1f}/centery:{(min_lat+max_lat)/2:.1f}/zoom:6",
        "vesselfinder_url": f"https://www.vesselfinder.com/?lat={(min_lat+max_lat)/2:.2f}&lon={(min_lon+max_lon)/2:.2f}&zoom=6",
    }


@tool
def get_strait_traffic(strait: str) -> dict:
    """Get vessel traffic data for a specific ASEAN strait.

    Args:
        strait: Strait name — 'Malacca Strait', 'Lombok Strait', 'Sunda Strait',
                'South China Sea', 'Makassar Strait', 'Banda Sea'

    Returns:
        Dict with vessel_count, anomaly_flag, strategic_importance
    """
    strategic = {
        "Malacca Strait": "World's busiest shipping lane — 80,000+ vessels/year",
        "South China Sea": "Disputed waters — $3.4T annual trade",
        "Lombok Strait": "Deep-water alternative to Malacca",
        "Sunda Strait": "Indonesia's western gateway",
        "Makassar Strait": "Eastern Indonesia trade route",
        "Banda Sea": "Remote eastern Indonesia",
    }
    result = track_maritime_activity.invoke({"region": strait})
    result["strategic_importance"] = strategic.get(strait, "ASEAN maritime corridor")
    return result


@tool
def search_maritime_news(region: str, days: int = 7) -> str:
    """Search recent maritime and shipping news for an ASEAN region.

    Args:
        region: Region or strait name
        days: Recency window in days

    Returns:
        Markdown news results
    """
    from app.tools.tavily_tools import tavily_search
    return tavily_search.invoke({
        "query": f"{region} maritime shipping vessel trade {days} days",
        "topic": "news", "max_results": 5, "days": days,
    })
