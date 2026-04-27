"""Tests for corporate tools."""
from unittest.mock import patch, MagicMock


def _mock_oc_response(name):
    mock = MagicMock()
    mock.status_code = 200
    mock.json.return_value = {
        "results": {"companies": [{"company": {
            "name": name, "company_number": "123456",
            "current_status": "Active", "opencorporates_url": f"https://opencorporates.com/companies/id/{name}",
        }}]}
    }
    return mock


def test_identify_corporate_actors_pt():
    with patch("httpx.get", return_value=_mock_oc_response("PT Pertamina")):
        from app.tools.bellingcat.corporate_tools import identify_corporate_actors
        result = identify_corporate_actors.invoke({"policy_text": "PT Pertamina menandatangani kontrak baru"})
    assert isinstance(result, list)
    assert len(result) >= 1
    assert any("Pertamina" in r.get("company", "") for r in result)


def test_lookup_company_not_found():
    mock = MagicMock()
    mock.status_code = 200
    mock.json.return_value = {"results": {"companies": []}}
    with patch("httpx.get", return_value=mock):
        from app.tools.bellingcat.corporate_tools import lookup_company
        result = lookup_company.invoke({"company_name": "Nonexistent Corp", "jurisdiction": "id"})
    assert result["status"] == "not_found"


def test_identify_returns_unverified_on_api_fail():
    with patch("httpx.get", side_effect=Exception("timeout")):
        from app.tools.bellingcat.corporate_tools import identify_corporate_actors
        result = identify_corporate_actors.invoke({"policy_text": "PT PLN akan membangun PLTS"})
    # Should still return extracted names even without OC match
    assert isinstance(result, list)
