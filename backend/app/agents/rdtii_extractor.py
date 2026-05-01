"""RDTII Regulatory Evidence Extractor — LLM-based clause extraction mapped to RDTII pillars."""
import json
import uuid
from datetime import datetime

from app.db.schema import RegulatoryEvidence
from app.llm import get_chat_model
from app.tools.skills_loader import get_humanizer_prompt
from app.tools.text_utils import sanitize_text
from app.tools.rdtii_tools import RDTII_PILLARS, RDTII_INDICATOR_MAP

_model = get_chat_model()

_PILLAR_SUMMARY = "\n".join(
    f"  {pid}: {p['name']} — keywords: {', '.join(p['keywords'][:4])}"
    for pid, p in RDTII_PILLARS.items()
)

_INDICATOR_SUMMARY = "\n".join(
    f"  {code}: {desc}" for code, desc in RDTII_INDICATOR_MAP.items()
)

_SYSTEM = get_humanizer_prompt() + f"""

You are a regulatory analyst extracting evidence from ASEAN policy documents.
Map specific clauses to RDTII (Regional Digital Trade Integration Index) pillars.

RDTII Pillars:
{_PILLAR_SUMMARY}

RDTII Indicators:
{_INDICATOR_SUMMARY}

Return ONLY valid JSON. No prose outside the JSON object.
"""

_SCHEMA = """{{
  "evidence": [
    {{
      "clause_text": "exact or paraphrased clause from the document",
      "pillar_id": "P1|P2|P3|P4|P5|P6|P7",
      "indicator_code": "e.g. 3.1",
      "confidence": "HIGH|MEDIUM|LOW"
    }}
  ]
}}"""


def run_rdtii_extractor(
    text: str,
    source_url: str = "",
    country: str = "",
    brief_id: str = "",
) -> list[RegulatoryEvidence]:
    """Extract clause-level RDTII evidence from policy text using Claude.

    Args:
        text: Policy document text (will be truncated to 8000 chars)
        source_url: URL of the source document
        country: Country the document originates from
        brief_id: Associated brief ID for DB linkage

    Returns:
        List of RegulatoryEvidence objects
    """
    prompt = f"""Extract RDTII regulatory evidence from this policy text.

Country: {country or 'ASEAN'}
Source: {source_url or 'unknown'}

Document text:
{text[:8000]}

{_SCHEMA}

Extract every clause that maps to an RDTII pillar. If no relevant clauses exist, return {{"evidence": []}}."""

    try:
        response = _model.invoke([
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": prompt},
        ])
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        data = json.loads(raw)
        now = datetime.utcnow().isoformat()
        results = []
        for item in data.get("evidence", []):
            pillar = item.get("pillar_id", "P1")
            if pillar not in RDTII_PILLARS:
                continue
            results.append(RegulatoryEvidence(
                id=str(uuid.uuid4()),
                brief_id=brief_id,
                source_url=source_url,
                clause_text=sanitize_text(item.get("clause_text", "")),
                pillar_id=pillar,
                indicator_code=item.get("indicator_code", ""),
                country=country,
                confidence=item.get("confidence", "MEDIUM"),
                extracted_at=now,
            ))
        return results
    except Exception:
        return []
