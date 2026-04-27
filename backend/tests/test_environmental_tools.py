"""Tests for environmental tools."""
from unittest.mock import patch, MagicMock
import app.tools.bellingcat.environmental_tools as et


def test_get_environmental_indicators_structure():
    with patch.object(et, "_gfw_deforestation",
                      return_value={"alert_count": 42, "area_ha": 1200.5, "source_url": "https://gfw.org", "days": 30}):
        with patch.object(et, "_firms_hotspots",
                          return_value={"count": 15, "source_url": "https://firms.nasa.gov", "days": 7}):
            with patch.object(et, "_gfw_fishing",
                              return_value={"vessel_count": 320, "source_url": "https://gfw.org", "anomaly_flag": False}):
                result = et.get_environmental_indicators.invoke({"region": "Kalimantan"})

    assert "deforestation" in result
    assert "fire_hotspots" in result
    assert "fishing_activity" in result
    assert result["region"] == "Kalimantan"
    assert result["deforestation"]["alert_count"] == 42


def test_get_deforestation_graceful_failure():
    with patch("httpx.post", side_effect=Exception("network error")):
        result = et.get_deforestation_alerts.invoke({"region": "Indonesia", "days": 30})
    assert "alert_count" in result
    assert result["alert_count"] is None


def test_firms_no_key():
    with patch.object(et.settings, "FIRMS_MAP_KEY", ""):
        result = et.get_fire_hotspots.invoke({"region": "Riau", "days": 7})
    assert "source_url" in result
    assert result.get("note") == "FIRMS_MAP_KEY not set"
