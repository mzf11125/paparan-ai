"""Tests for spatial tools."""
from unittest.mock import patch
from app.tools.spatial_tools import get_region_bbox, geolocate_policy_area, _ASEAN_BBOXES


def test_get_region_bbox_known():
    result = get_region_bbox.invoke({"region": "Indonesia"})
    assert result["centroid"] == [-2.5, 118.0]
    assert "min_lon" in result


def test_get_region_bbox_fallback():
    with patch("app.tools.spatial_tools._nominatim_geocode", return_value=None):
        result = get_region_bbox.invoke({"region": "UnknownPlace"})
    assert result["centroid"] == _ASEAN_BBOXES["ASEAN"]["centroid"]


def test_geolocate_policy_area_extracts_country():
    with patch("app.tools.spatial_tools._nominatim_geocode") as mock_geo:
        mock_geo.return_value = {"lat": -2.5, "lon": 118.0, "display_name": "Indonesia"}
        result = geolocate_policy_area.invoke({"brief_text": "pembangunan infrastruktur di Indonesia"})
    assert result["primary_region"] == "Indonesia"
    assert "map_url" in result


def test_geolocate_returns_structure():
    with patch("app.tools.spatial_tools._nominatim_geocode", return_value=None):
        result = geolocate_policy_area.invoke({"brief_text": "no places here"})
    assert "locations" in result
    assert "primary_region" in result
    assert "map_url" in result
