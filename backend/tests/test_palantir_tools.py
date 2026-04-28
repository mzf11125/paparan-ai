"""Tests for enhanced palantir tools."""
from unittest.mock import MagicMock, patch
import app.tools.palantir_tools as pt


def _mock_client(rows):
    m = MagicMock()
    m.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = rows
    return m


def test_get_sdi_institution_found():
    with patch.object(pt, "get_client", return_value=_mock_client(
        [{"code": "007", "name": "Kementrian Kesehatan", "category": "Kementrian"}]
    )):
        result = pt.get_sdi_institution.invoke({"kl_code": "007"})
    assert result["name"] == "Kementrian Kesehatan"
    assert result["kl_code"] == "007"


def test_get_sdi_institution_not_found():
    with patch.object(pt, "get_client", return_value=_mock_client([])):
        result = pt.get_sdi_institution.invoke({"kl_code": "999"})
    assert result["status"] == "not_found"


def test_get_policy_document_not_found():
    with patch.object(pt, "get_client", return_value=_mock_client([])):
        result = pt.get_policy_document.invoke({"doc_id": "nonexistent"})
    assert result["status"] == "not_found"


def test_get_entity_falls_back():
    with patch.object(pt, "query_entity_graph") as mock_kg:
        mock_kg.invoke = MagicMock(return_value=[])
        with patch.object(pt, "get_client", return_value=_mock_client([])):
            result = pt.get_entity.invoke({"entity_name": "Unknown Corp"})
    assert "entity_name" in result or "status" in result
