"""Environmental intelligence — GFW deforestation, NASA FIRMS fire hotspots, Global Fishing Watch."""
import httpx
from langchain.tools import tool
from app.config import settings
from app.tools.spatial_tools import get_region_bbox


def _gfw_deforestation(bbox: dict, days: int) -> dict:
    """Query Global Forest Watch GLAD integrated alerts API."""
    try:
        min_lon = bbox["min_lon"]; max_lon = bbox["max_lon"]
        min_lat = bbox["min_lat"]; max_lat = bbox["max_lat"]
        url = "https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query"
        payload = {
            "sql": (
                f"SELECT count(*) as alert_count, sum(area__ha) as area_ha "
                f"FROM data "
                f"WHERE gfw_integrated_alerts__date >= CURRENT_DATE - INTERVAL '{days} days' "
                f"AND longitude BETWEEN {min_lon} AND {max_lon} "
                f"AND latitude BETWEEN {min_lat} AND {max_lat}"
            )
        }
        r = httpx.post(url, json=payload, timeout=10.0,
                       headers={"Content-Type": "application/json"})
        if r.status_code == 200:
            data = r.json().get("data", [{}])
            row = data[0] if data else {}
            return {
                "alert_count": row.get("alert_count", 0),
                "area_ha": round(row.get("area_ha") or 0, 2),
                "source_url": "https://www.globalforestwatch.org/map/",
                "days": days,
            }
    except Exception:
        pass
    return {"alert_count": None, "area_ha": None, "source_url": "https://www.globalforestwatch.org", "days": days}


def _firms_hotspots(bbox: dict, days: int) -> dict:
    """Query NASA FIRMS fire hotspot API."""
    if not settings.FIRMS_MAP_KEY:
        return {"count": None, "source_url": "https://firms.modaps.eosdis.nasa.gov", "note": "FIRMS_MAP_KEY not set"}
    try:
        min_lon = bbox["min_lon"]; max_lon = bbox["max_lon"]
        min_lat = bbox["min_lat"]; max_lat = bbox["max_lat"]
        bbox_str = f"{min_lon},{min_lat},{max_lon},{max_lat}"
        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{settings.FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/{bbox_str}/{min(days, 10)}"
        r = httpx.get(url, timeout=10.0)
        if r.status_code == 200:
            lines = [l for l in r.text.strip().splitlines() if l and not l.startswith("latitude")]
            return {"count": len(lines), "source_url": "https://firms.modaps.eosdis.nasa.gov/map/", "days": days}
    except Exception:
        pass
    return {"count": None, "source_url": "https://firms.modaps.eosdis.nasa.gov", "days": days}


def _gfw_fishing(bbox: dict) -> dict:
    """Query Global Fishing Watch public events API."""
    try:
        min_lon = bbox["min_lon"]; max_lon = bbox["max_lon"]
        min_lat = bbox["min_lat"]; max_lat = bbox["max_lat"]
        url = "https://gateway.api.globalfishingwatch.org/v3/events"
        params = {
            "datasets": "public-global-fishing-events:latest",
            "start-date": "2026-01-01",
            "end-date": "2026-04-27",
            "bbox": f"{min_lon},{min_lat},{max_lon},{max_lat}",
            "limit": 1,
        }
        r = httpx.get(url, params=params, timeout=10.0)
        if r.status_code == 200:
            data = r.json()
            total = data.get("total", 0)
            return {
                "vessel_count": total,
                "source_url": "https://globalfishingwatch.org/map/",
                "anomaly_flag": total > 500,
            }
    except Exception:
        pass
    return {"vessel_count": None, "source_url": "https://globalfishingwatch.org", "anomaly_flag": False}


@tool
def get_deforestation_alerts(region: str, days: int = 30) -> dict:
    """Get deforestation alerts for a region from Global Forest Watch.

    Args:
        region: Region name (e.g. 'Kalimantan', 'Indonesia', 'Riau')
        days: Lookback window in days

    Returns:
        Dict with alert_count, area_ha, source_url
    """
    bbox = get_region_bbox.invoke({"region": region})
    return _gfw_deforestation(bbox, days)


@tool
def get_fire_hotspots(region: str, days: int = 7) -> dict:
    """Get fire/hotspot data from NASA FIRMS for a region.

    Args:
        region: Region name
        days: Lookback window (max 10 for NRT data)

    Returns:
        Dict with count, source_url
    """
    bbox = get_region_bbox.invoke({"region": region})
    return _firms_hotspots(bbox, days)


@tool
def get_fishing_activity(region: str) -> dict:
    """Get fishing vessel activity from Global Fishing Watch.

    Args:
        region: Region name (e.g. 'Indonesia', 'South China Sea')

    Returns:
        Dict with vessel_count, anomaly_flag, source_url
    """
    bbox = get_region_bbox.invoke({"region": region})
    return _gfw_fishing(bbox)


@tool
def get_environmental_indicators(region: str) -> dict:
    """Get aggregated environmental indicators for a region.

    Args:
        region: Region name

    Returns:
        Dict with deforestation, fire_hotspots, fishing_activity, region, timestamp
    """
    from datetime import datetime
    return {
        "region": region,
        "timestamp": datetime.utcnow().isoformat(),
        "deforestation": get_deforestation_alerts.invoke({"region": region, "days": 30}),
        "fire_hotspots": get_fire_hotspots.invoke({"region": region, "days": 7}),
        "fishing_activity": get_fishing_activity.invoke({"region": region}),
    }
