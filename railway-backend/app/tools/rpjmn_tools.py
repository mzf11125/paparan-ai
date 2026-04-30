"""RPJMN 2025-2029 Asta Cita static reference data and scoring tools."""
from langchain.tools import tool

# 8 Asta Cita pillars with keyword lists for scoring
ASTA_CITA_PILLARS = {
    "AC1": {
        "name": "Memperkuat Ideologi Pancasila",
        "keywords": ["pancasila", "ideologi", "kebangsaan", "bhineka", "nasionalisme", "demokrasi", "konstitusi"],
    },
    "AC2": {
        "name": "Memantapkan Sistem Pertahanan dan Keamanan",
        "keywords": ["pertahanan", "keamanan", "militer", "polri", "tni", "siber", "kedaulatan", "batas negara"],
    },
    "AC3": {
        "name": "Meningkatkan Lapangan Kerja Berkualitas",
        "keywords": ["tenaga kerja", "lapangan kerja", "upah", "pengangguran", "industri", "manufaktur", "umkm", "investasi"],
    },
    "AC4": {
        "name": "Membangun dari Desa dan Bawah",
        "keywords": ["desa", "daerah", "otonomi", "desentralisasi", "infrastruktur daerah", "transmigrasi", "perbatasan"],
    },
    "AC5": {
        "name": "Melanjutkan Hilirisasi dan Industrialisasi",
        "keywords": ["hilirisasi", "industrialisasi", "sumber daya alam", "nikel", "batu bara", "kelapa sawit", "ekspor", "nilai tambah"],
    },
    "AC6": {
        "name": "Membangun dari Bawah untuk Pemerataan Ekonomi",
        "keywords": ["pemerataan", "kemiskinan", "ketimpangan", "gini", "bansos", "subsidi", "perlindungan sosial", "inklusif"],
    },
    "AC7": {
        "name": "Memperkuat Reformasi Politik, Hukum, dan Birokrasi",
        "keywords": ["reformasi", "birokrasi", "korupsi", "kpk", "hukum", "regulasi", "tata kelola", "transparansi", "akuntabilitas"],
    },
    "AC8": {
        "name": "Memperkuat Penyelarasan Kehidupan yang Harmonis",
        "keywords": ["lingkungan", "iklim", "energi terbarukan", "digital", "teknologi", "inovasi", "riset", "pendidikan", "kesehatan"],
    },
}


@tool
def score_brief_against_rpjmn(brief_text: str) -> dict:
    """Score a policy brief text against RPJMN 2025-2029 Asta Cita pillars.

    Args:
        brief_text: Full text of the policy brief to score

    Returns:
        Dict mapping pillar_id to score (0.0-1.0)
    """
    text_lower = brief_text.lower()
    scores = {}
    for pillar_id, pillar in ASTA_CITA_PILLARS.items():
        hits = sum(1 for kw in pillar["keywords"] if kw in text_lower)
        scores[pillar_id] = round(min(hits / max(len(pillar["keywords"]) * 0.4, 1), 1.0), 3)
    return scores


@tool
def get_rpjmn_pillar_info(pillar_id: str) -> dict:
    """Get name and keywords for an RPJMN Asta Cita pillar.

    Args:
        pillar_id: Pillar ID e.g. 'AC1' through 'AC8'

    Returns:
        Dict with name and keywords
    """
    return ASTA_CITA_PILLARS.get(pillar_id, {"name": "Unknown", "keywords": []})


@tool
def generate_talking_points(brief_text: str, topic: str) -> list:
    """Generate diplomat talking points and anticipated counterarguments from a brief.

    Args:
        brief_text: Full text of the policy brief
        topic: Brief topic for context

    Returns:
        List of talking point strings
    """
    from app.llm import get_chat_model
    model = get_chat_model()
    prompt = f"""From this policy brief on "{topic}", generate exactly 5 talking points and 3 anticipated counterarguments for a diplomat.

Brief:
{brief_text[:3000]}

Return as JSON: {{"talking_points": ["..."], "counterarguments": ["..."]}}"""
    import json
    resp = model.invoke([{"role": "user", "content": prompt}])
    raw = resp.content.strip().lstrip("```json").lstrip("```").rstrip("```")
    try:
        data = json.loads(raw)
        return data.get("talking_points", []) + [f"Counter: {c}" for c in data.get("counterarguments", [])]
    except Exception:
        return []
