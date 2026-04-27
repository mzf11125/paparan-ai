"""RDTII (Regional Digital Trade Integration Index) policy mapper tools.

Maps policy text to RDTII pillars based on ASEAN DTS Roadmap / Perpres 195/2024."""
from langchain.tools import tool

RDTII_PILLARS = {
    "P1": {"name": "Digital Trade Facilitation", "keywords": ["trade facilitation", "customs", "border", "single window", "paperless", "e-customs"]},
    "P2": {"name": "Digital Economy Infrastructure", "keywords": ["digital infrastructure", "broadband", "connectivity", "5g", "data center", "cloud"]},
    "P3": {"name": "Digital Payments & Fintech", "keywords": ["digital payment", "fintech", "qr code", "cross-border payment", "e-money", "swift", "rtgs"]},
    "P4": {"name": "E-Commerce & Digital Trade", "keywords": ["e-commerce", "marketplace", "digital trade", "online retail", "platform", "logistics"]},
    "P5": {"name": "Data Governance & Privacy", "keywords": ["data governance", "privacy", "data protection", "pdp", "cross-border data", "data localization"]},
    "P6": {"name": "Cybersecurity & Trust", "keywords": ["cybersecurity", "cyber", "trust", "authentication", "digital signature", "encryption"]},
    "P7": {"name": "Digital Inclusion & Capacity", "keywords": ["digital inclusion", "capacity building", "sme", "msme", "digital literacy", "training"]},
}

RDTII_INDICATOR_MAP = {
    "1.1": "Trade volume index", "1.2": "Tariff schedule digitization",
    "2.1": "Broadband penetration rate", "2.2": "Digital economy GDP share",
    "3.1": "Digital payment adoption rate", "3.2": "Fintech regulatory sandbox",
    "4.1": "E-commerce market size", "4.2": "Cross-border e-commerce share",
    "5.1": "Data protection law coverage", "5.2": "Cross-border data flow agreements",
    "6.1": "Cybersecurity index score", "6.2": "Incident response capability",
    "7.1": "Digital literacy rate", "7.2": "MSME digital adoption rate",
}


@tool
def map_policy_to_rdtii_pillar(text: str) -> str:
    """Map policy text to the most relevant RDTII pillar.

    Args:
        text: Policy text to analyze

    Returns:
        Pillar ID and name string e.g. 'P3: Digital Payments & Fintech'
    """
    text_lower = text.lower()
    best_pillar, best_score = "P1", 0
    for pid, pillar in RDTII_PILLARS.items():
        score = sum(1 for kw in pillar["keywords"] if kw in text_lower)
        if score > best_score:
            best_score, best_pillar = score, pid
    p = RDTII_PILLARS[best_pillar]
    return f"{best_pillar}: {p['name']}"


@tool
def score_policy_against_rdtii(text: str) -> dict:
    """Score policy text against all RDTII pillars.

    Args:
        text: Policy text to analyze

    Returns:
        Dict mapping pillar_id to score (0.0-1.0)
    """
    text_lower = text.lower()
    scores = {}
    for pid, pillar in RDTII_PILLARS.items():
        hits = sum(1 for kw in pillar["keywords"] if kw in text_lower)
        scores[pid] = round(min(hits / max(len(pillar["keywords"]) * 0.4, 1), 1.0), 3)
    return scores


@tool
def get_rdtii_indicator(indicator_code: str) -> str:
    """Get RDTII indicator description by code.

    Args:
        indicator_code: Code like '3.1' or '6.2'

    Returns:
        Indicator description string
    """
    return RDTII_INDICATOR_MAP.get(indicator_code, f"Unknown indicator: {indicator_code}")
