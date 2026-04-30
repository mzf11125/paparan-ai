"""Corporate actor identification — OpenCorporates API (free tier)."""
import re
import httpx
from langchain.tools import tool

_OC_BASE = "https://api.opencorporates.com/v0.4"
_HEADERS = {"User-Agent": "paparan-ai/1.0"}
_ASEAN_JURISDICTIONS = ["id", "my", "sg", "th", "ph", "vn", "mm", "kh", "la", "bn"]

_req_count = 0
_MAX_DAILY = 490

_COMPANY_PATTERNS = [
    r'\bPT\.?\s+([A-Z][A-Za-z\s&]+?)(?=\s+(?:Tbk|dan|,|\.|menandatangani|melakukan|akan))',
    r'\b([A-Z][A-Za-z\s]+?)\s+Tbk\b',
    r'\b([A-Z][A-Za-z\s&,\.]+?)\s+(?:Ltd|Limited|Corp|Corporation|Inc|Group|Holdings)\b',
]


def _oc_search(company_name: str, jurisdiction: str = "id") -> dict | None:
    global _req_count
    if _req_count >= _MAX_DAILY:
        return None
    try:
        _req_count += 1
        r = httpx.get(
            f"{_OC_BASE}/companies/search",
            params={"q": company_name, "jurisdiction_code": jurisdiction, "per_page": 1},
            headers=_HEADERS, timeout=8.0,
        )
        if r.status_code == 200:
            results = r.json().get("results", {}).get("companies", [])
            if results:
                c = results[0]["company"]
                return {
                    "company": c.get("name", company_name),
                    "jurisdiction": jurisdiction,
                    "registration_id": c.get("company_number", ""),
                    "status": c.get("current_status", "unknown"),
                    "opencorporates_url": c.get("opencorporates_url", ""),
                }
    except Exception:
        pass
    return None


@tool
def identify_corporate_actors(policy_text: str) -> list:
    """Identify and verify corporate entities named in policy text.

    Args:
        policy_text: Policy document or brief text

    Returns:
        List of {company, jurisdiction, registration_id, status, opencorporates_url}
    """
    companies = []
    seen = set()
    for pattern in _COMPANY_PATTERNS:
        for match in re.finditer(pattern, policy_text):
            name = match.group(1).strip().rstrip(".,")
            if len(name) > 3 and name.lower() not in seen:
                seen.add(name.lower())
                companies.append(name)

    results = []
    for company in companies[:8]:
        jurisdiction = "id"
        if any(kw in policy_text.lower() for kw in ["singapore", "sgd", "mas "]):
            jurisdiction = "sg"
        elif any(kw in policy_text.lower() for kw in ["malaysia", "ringgit", "bursa"]):
            jurisdiction = "my"

        result = _oc_search(company, jurisdiction)
        results.append(result or {
            "company": company, "jurisdiction": jurisdiction,
            "registration_id": None, "status": "unverified",
            "opencorporates_url": f"https://opencorporates.com/companies/{jurisdiction}?q={company.replace(' ', '+')}",
        })
    return results


@tool
def lookup_company(company_name: str, jurisdiction: str = "id") -> dict:
    """Look up a specific company on OpenCorporates.

    Args:
        company_name: Company name
        jurisdiction: ISO jurisdiction code (e.g. 'id', 'sg', 'my')

    Returns:
        Company registration details
    """
    result = _oc_search(company_name, jurisdiction)
    return result or {
        "company": company_name, "jurisdiction": jurisdiction, "status": "not_found",
        "opencorporates_url": f"https://opencorporates.com/companies/{jurisdiction}?q={company_name.replace(' ', '+')}",
    }


@tool
def get_asean_subsidiaries(company_name: str) -> list:
    """Search for a company across all ASEAN jurisdictions.

    Args:
        company_name: Parent company name

    Returns:
        List of registrations found across ASEAN jurisdictions
    """
    results = []
    for jur in _ASEAN_JURISDICTIONS:
        result = _oc_search(company_name, jur)
        if result and result.get("registration_id"):
            results.append(result)
    return results
