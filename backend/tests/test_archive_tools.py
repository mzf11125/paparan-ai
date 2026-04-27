"""Tests for archive tools."""
from unittest.mock import patch, MagicMock


def _mock_cdx_response(has_data=True):
    mock = MagicMock()
    mock.status_code = 200
    if has_data:
        mock.json.return_value = [
            ["timestamp", "original", "statuscode"],
            ["20260101120000", "https://bappenas.go.id/test", "200"],
        ]
    else:
        mock.json.return_value = [["timestamp", "original", "statuscode"]]
    return mock


def test_check_archive_found():
    with patch("httpx.get", return_value=_mock_cdx_response(True)):
        from app.tools.bellingcat.archive_tools import check_archive
        result = check_archive.invoke({"url": "https://bappenas.go.id/test"})
    assert result["archived"] is True
    assert "web.archive.org" in result["archive_url"]


def test_check_archive_not_found():
    with patch("httpx.get", return_value=_mock_cdx_response(False)):
        from app.tools.bellingcat.archive_tools import check_archive
        result = check_archive.invoke({"url": "https://example.com/new"})
    assert result["archived"] is False


def test_archive_source_returns_url():
    mock_check = MagicMock()
    mock_check.return_value = {"archived": False, "recent": False}
    mock_save = MagicMock()
    mock_save.status_code = 200
    mock_save.headers = {"Content-Location": "/web/20260427120000/https://bappenas.go.id/test"}
    with patch("app.tools.bellingcat.archive_tools.check_archive") as mc:
        mc.invoke = mock_check
        with patch("httpx.get", return_value=mock_save):
            from app.tools.bellingcat.archive_tools import archive_source
            result = archive_source.invoke({"url": "https://bappenas.go.id/test"})
    assert "archive_url" in result
    assert result["archive_url"] is not None


def test_archive_brief_sources():
    with patch("app.tools.bellingcat.archive_tools.archive_source") as mock_as:
        mock_as.invoke = MagicMock(return_value={"archive_url": "https://web.archive.org/web/123/https://test.com", "status": "archived"})
        from app.tools.bellingcat.archive_tools import archive_brief_sources
        result = archive_brief_sources.invoke({
            "sources": [{"id": "s1", "url": "https://test.com"}, {"id": "s2", "url": ""}]
        })
    assert len(result) == 1  # empty URL skipped
    assert result[0]["source_id"] == "s1"
