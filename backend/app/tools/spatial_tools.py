"""Enhanced spatial tools — real Nominatim geocoding + OSM map URLs."""
import time
import re
import httpx
from langchain.tools import tool

_ASEAN_BBOXES = {
    "Malaysia":    {"min_lon": 99.6,  "max_lon": 119.3, "min_lat": 0.8,   "max_lat": 7.4,  "centroid": [4.2,  108.0]},
    "Singapore":   {"min_lon": 103.6, "max_lon": 104.0, "min_lat": 1.2,   "max_lat": 1.5,  "centroid": [1.35, 103.82]},
    "Indonesia":   {"min_lon": 95.0,  "max_lon": 141.0, "min_lat": -11.0, "max_lat": 6.0,  "centroid": [-2.5, 118.0]},
    "Thailand":    {"min_lon": 97.3,  "max_lon": 105.6, "min_lat": 5.6,   "max_lat": 20.5, "centroid": [13.0, 101.5]},
    "Philippines": {"min_lon": 116.9, "max_lon": 126.6, "min_lat": 4.6,   "max_lat": 21.1, "centroid": [12.9, 121.8]},
    "Vietnam":     {"min_lon": 102.1, "max_lon": 109.5, "min_lat": 8.4,   "max_lat": 23.4, "centroid": [16.0, 106.0]},
    "Myanmar":     {"min_lon": 92.2,  "max_lon": 101.2, "min_lat": 9.8,   "max_lat": 28.5, "centroid": [19.0, 96.5]},
    "Cambodia":    {"min_lon": 102.3, "max_lon": 107.6, "min_lat": 10.4,  "max_lat": 14.7, "centroid": [12.6, 104.9]},
    "Laos":        {"min_lon": 100.1, "max_lon": 107.6, "min_lat": 13.9,  "max_lat": 22.5, "centroid": [18.0, 103.8]},
    "Brunei":      {"min_lon": 114.1, "max_lon": 115.4, "min_lat": 4.0,   "max_lat": 5.1,  "centroid": [4.5,  114.7]},
    "ASEAN":       {"min_lon": 92.0,  "max_lon": 141.0, "min_lat": -11.0, "max_lat": 28.0, "centroid": [8.5,  116.5]},
}

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_HEADERS = {"User-Agent": "paparan-ai/1.0 (policy-intelligence; contact@paparan.ai)"}

# Known ASEAN place name patterns for extraction
_PLACE_PATTERNS = [
    r'\b(Kalimantan\s+\w+)\b', r'\b(Sumatera\s+\w+)\b', r'\b(Jawa\s+\w+)\b',
    r'\b(Sulawesi\s+\w+)\b', r'\b(Papua\s+\w*)\b', r'\b(IKN|Nusantara)\b',
    r'\b(Provinsi\s+[\w\s]+?)(?=\s+(?:dan|,|\.))', r'\b(Kabupaten\s+[\w\s]+?)(?=\s+(?:dan|,|\.))',
    r'\b(Malaysia|Singapore|Indonesia|Thailand|Philippines|Vietnam|Myanmar|Cambodia|Laos|Brunei)\b',
    r'\b(Jakarta|Surabaya|Bandung|Medan|Makassar|Kuala Lumpur|Bangkok|Manila|Hanoi|Yangon)\b',
]


def _nominatim_geocode(place: str) -> dict | None:
    """Geocode a place name via Nominatim. Returns {lat, lon, display_name} or None."""
    try:
        time.sleep(1)  # Nominatim rate limit: 1 req/sec
        r = httpx.get(_NOMINATIM_URL, params={"q": place, "format": "json", "limit": 1},
                      headers=_HEADERS, timeout=8.0)
        data = r.json()
        if data:
            return {"lat": float(data[0]["lat"]), "lon": float(data[0]["lon"]),
                    "display_name": data[0].get("display_name", place)}
    except Exception:
        pass
    return None


def _osm_embed_url(lat: float, lon: float, zoom: int = 8) -> str:
    delta = 360 / (2 ** zoom)
    return (f"https://www.openstreetmap.org/export/embed.html?"
            f"bbox={lon-delta:.4f},{lat-delta:.4f},{lon+delta:.4f},{lat+delta:.4f}&layer=mapnik")


@tool
def get_region_bbox(region: str) -> dict:
    """Get bounding box and centroid for an ASEAN region.

    Args:
        region: Country or region name (e.g. 'Indonesia', 'ASEAN')

    Returns:
        Dict with min_lon, max_lon, min_lat, max_lat, centroid
    """
    if region in _ASEAN_BBOXES:
        return {"region": region, **_ASEAN_BBOXES[region]}
    # Try Nominatim for unknown regions
    geo = _nominatim_geocode(region)
    if geo:
        lat, lon = geo["lat"], geo["lon"]
        return {"region": region, "centroid": [lat, lon],
                "min_lat": lat - 2, "max_lat": lat + 2,
                "min_lon": lon - 2, "max_lon": lon + 2}
    return {"region": region, **_ASEAN_BBOXES["ASEAN"]}


@tool
def enrich_with_geodata(brief_id: str, region: str) -> dict:
    """Enrich a brief with geocoded spatial data and map URLs.

    Args:
        brief_id: Brief ID to enrich
        region: Region name

    Returns:
        Dict with centroid, bbox, osm_url, map_embed_url
    """
    bbox = get_region_bbox.invoke({"region": region})
    lat, lon = bbox["centroid"]
    return {
        "brief_id": brief_id, "region": region,
        "centroid": [lat, lon],
        "bbox": bbox,
        "osm_url": f"https://www.openstreetmap.org/#map=8/{lat}/{lon}",
        "map_embed_url": _osm_embed_url(lat, lon),
    }


@tool
def geolocate_policy_area(brief_text: str) -> dict:
    """Extract and geocode policy-relevant locations from brief text.

    Args:
        brief_text: Full text of the policy brief

    Returns:
        Dict with locations list, primary_region, spatial_context_summary, map_url
    """
    # Extract place names
    places = []
    for pattern in _PLACE_PATTERNS:
        matches = re.findall(pattern, brief_text, re.IGNORECASE)
        places.extend([m.strip() for m in matches if len(m.strip()) > 3])

    # Deduplicate, keep top 5
    seen = set()
    unique_places = []
    for p in places:
        if p.lower() not in seen:
            seen.add(p.lower())
            unique_places.append(p)
    unique_places = unique_places[:5]

    locations = []
    for place in unique_places:
        geo = _nominatim_geocode(place)
        if geo:
            locations.append({
                "name": place, "lat": geo["lat"], "lon": geo["lon"],
                "display_name": geo["display_name"],
                "map_url": f"https://www.openstreetmap.org/#map=10/{geo['lat']}/{geo['lon']}",
                "satellite_url": f"https://apps.sentinel-hub.com/eo-browser/?zoom=10&lat={geo['lat']}&lng={geo['lon']}&themeId=DEFAULT-THEME",
            })

    # Determine primary region from text
    primary = "ASEAN"
    for country in ["Indonesia", "Malaysia", "Singapore", "Thailand", "Philippines", "Vietnam", "Myanmar"]:
        if country.lower() in brief_text.lower():
            primary = country
            break

    bbox = _ASEAN_BBOXES.get(primary, _ASEAN_BBOXES["ASEAN"])
    lat, lon = bbox["centroid"]

    return {
        "locations": locations,
        "primary_region": primary,
        "map_url": _osm_embed_url(lat, lon),
        "spatial_context_summary": f"{len(locations)} location(s) identified in {primary}",
    }
