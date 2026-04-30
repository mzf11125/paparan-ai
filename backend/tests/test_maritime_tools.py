"""Tests for maritime tools."""
from unittest.mock import patch


def test_track_maritime_activity_returns_structure():
    with patch("app.tools.bellingcat.maritime_tools._query_vesselfinder", return_value=280):
        from app.tools.bellingcat.maritime_tools import track_maritime_activity
        result = track_maritime_activity.invoke({"region": "Malacca Strait"})
    assert "vessel_count" in result
    assert "anomaly_flag" in result
    assert "source_url" in result
    assert result["vessel_count"] == 280


def test_track_maritime_anomaly_flag():
    with patch("app.tools.bellingcat.maritime_tools._query_vesselfinder", return_value=600):
        from app.tools.bellingcat.maritime_tools import track_maritime_activity
        result = track_maritime_activity.invoke({"region": "Malacca Strait"})
    assert result["anomaly_flag"] is True  # 600 > 250 * 1.5


def test_track_maritime_api_failure():
    with patch("app.tools.bellingcat.maritime_tools._query_vesselfinder", return_value=None):
        from app.tools.bellingcat.maritime_tools import track_maritime_activity
        result = track_maritime_activity.invoke({"region": "South China Sea"})
    assert result["vessel_count"] is None
    assert result["anomaly_flag"] is False


def test_get_strait_traffic_includes_strategic():
    with patch("app.tools.bellingcat.maritime_tools._query_vesselfinder", return_value=100):
        from app.tools.bellingcat.maritime_tools import get_strait_traffic
        result = get_strait_traffic.invoke({"strait": "Malacca Strait"})
    assert "strategic_importance" in result
