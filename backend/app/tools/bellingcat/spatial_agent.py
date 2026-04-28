"""Spatial intelligence agent — satellite imagery links + geospatial brief enrichment."""
from langchain.tools import tool
from app.tools.spatial_tools import geolocate_policy_area, get_region_bbox, _ASEAN_BBOXES


@tool
def get_satellite_context(region: str, topic: str = "") -> dict:
    """Get satellite imagery viewer links for a policy region.

    Args:
        region: Region name (e.g. 'Kalimantan', 'South China Sea')
        topic: Optional policy topic for context

    Returns:
        Dict with sentinel_hub_url, google_earth_url, lat, lon
    """
    bbox = get_region_bbox.invoke({"region": region})
    lat, lon = bbox["centroid"]
    return {
        "region": region,
        "lat": lat, "lon": lon,
        "sentinel_hub_url": (
            f"https://apps.sentinel-hub.com/eo-browser/"
            f"?zoom=9&lat={lat}&lng={lon}&themeId=DEFAULT-THEME"
        ),
        "google_earth_url": f"https://earth.google.com/web/@{lat},{lon},1000a",
        "osm_url": f"https://www.openstreetmap.org/#map=9/{lat}/{lon}",
        "topic": topic,
    }


@tool
def enrich_brief_with_spatial(brief_text: str, region: str) -> dict:
    """Enrich a policy brief with full spatial context.

    Args:
        brief_text: Full brief text for location extraction
        region: Primary region of the brief

    Returns:
        spatial_context dict with locations, map URLs, satellite links
    """
    geo = geolocate_policy_area.invoke({"brief_text": brief_text})
    sat = get_satellite_context.invoke({"region": region})

    return {
        "locations": geo.get("locations", []),
        "primary_region": geo.get("primary_region", region),
        "map_url": geo.get("map_url", sat["osm_url"]),
        "satellite_url": sat["sentinel_hub_url"],
        "google_earth_url": sat["google_earth_url"],
        "spatial_context_summary": geo.get("spatial_context_summary", f"Region: {region}"),
    }
