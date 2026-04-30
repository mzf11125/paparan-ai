"""Tests for conflict tools."""
from unittest.mock import patch, MagicMock
import app.tools.bellingcat.conflict_tools as ct


def _mock_acled(events):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"data": events}
    return m


def test_get_conflict_events_with_acled():
    events = [
        {"event_date": "2026-04-01", "event_type": "Protests", "actor1": "Protesters",
         "location": "Yangon", "fatalities": "0", "notes": "Peaceful protest"},
        {"event_date": "2026-04-02", "event_type": "Violence against civilians",
         "actor1": "Military", "location": "Mandalay", "fatalities": "3", "notes": "Incident"},
    ]
    with patch.object(ct.settings, "ACLED_API_KEY", "testkey"):
        with patch.object(ct.settings, "ACLED_EMAIL", "test@test.com"):
            with patch("httpx.get", return_value=_mock_acled(events)):
                result = ct.get_conflict_events.invoke({"region": "Myanmar", "days": 30})
    assert result["event_count"] == 2
    assert result["fatalities"] == 3


def test_get_stability_index_range():
    with patch.object(ct, "get_conflict_events") as mock_ce:
        mock_ce.invoke = MagicMock(return_value={
            "event_count": 20, "fatalities": 5,
            "dominant_event_type": "Protests", "source": "acled",
        })
        result = ct.get_stability_index.invoke({"country": "Philippines"})
    assert 0.0 <= result["stability_score"] <= 1.0
    assert result["trend"] in ("stable", "fragile", "deteriorating")


def test_get_conflict_events_tavily_fallback():
    with patch.object(ct.settings, "ACLED_API_KEY", ""):
        with patch.object(ct.settings, "ACLED_EMAIL", ""):
            with patch.object(ct, "tavily_search") as mock_ts:
                mock_ts.invoke = MagicMock(return_value="No recent events found")
                result = ct.get_conflict_events.invoke({"region": "Cambodia", "days": 30})
    assert result["source"] == "tavily_fallback"
