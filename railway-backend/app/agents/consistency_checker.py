"""Cross-K/L consistency checker using LangGraph and PGVector semantic search."""
import json
import uuid
from datetime import datetime
from typing import Annotated, Literal, TypedDict

from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END

from app.config import settings
from app.db.client import get_client
from app.db.sdi_schema import (
    ConflictType,
    ConflictStatus,
    ConsistencyFlag,
    ConsistencyCheckResult,
)

# Lazy initialization of embeddings for semantic comparison
def get_embeddings():
    """Get embeddings instance, initialized on first use."""
    from functools import lru_cache
    @lru_cache
    def _get():
        return OpenAIEmbeddings(model="text-embedding-3-small")
    return _get()

embeddings = None  # Will be initialized on first use via get_embeddings()

# Direct PGVector connection for raw SQL queries
from psycopg2 import sql
from psycopg2.extras import execute_values

# Consistency check state
class ConsistencyState(TypedDict):
    """State for consistency checking workflow."""
    user_id: str
    indicator_ids: list[str]
    check_type: str
    batch_size: int
    threshold: float
    indicators: list[dict]
    current_batch: int
    flags: list[dict]
    similarity_results: list[dict]
    field_comparison_results: list[dict]
    final_result: dict
    error: str


# System prompt for comparison analysis
_COMPARISON_PROMPT = """Anda adalah ahli analisis konsistensi data indikator SDI.

TUGAS: Bandingkan dua indikator dan identifikasi potensi konflik.

JENIS KONFLIK YANG HARUS DIDENTIFIKASI:

1. DUPLIKAT
   - Nama indikator sangat serupa (kemungkinan sama)
   - Definisi hampir identik
   - Satuan sama
   - Skor kesamaan >= 0.90

2. KETIDAKSESAMAAN UNIT
   - Nama indikator serupa tapi satuan berbeda
   - Contoh: "Jumlah penduduk" (orang) vs "Jumlah penduduk" (ribu)
   - Skor kesamaan 0.70-0.90

3. KETIDAKSESAMAAN DEFINISI
   - Nama sama tapi definisi berbeda signifikan
   - Konsep atau pendekatan pengukuran berbeda
   - Skor kesamaan 0.60-0.85

4. KETIDAKSESAMAAN TEMPORAL
   - Cakupan waktu berbeda (misalnya: tahunan vs kuartalan)
   - Resolusi temporal berbeda

5. KETIDAKSESAMAAN KL_CODE
   - Produsen data berbeda untuk indikator serupa
   - Menunjukkan duplikasi lintas K/L yang tidak ditandai

OUTPUT FORMAT (hanya JSON):
{
  "conflict_type": "duplicate|unit_mismatch|definition_inconsistency|temporal_inconsistency|kl_code_mismatch",
  "similarity_score": 0.95,
  "description": "Deskripsi konflik dalam Bahasa Indonesia",
  "details": {
    "field_differences": {
      "unit": {"a": "orang", "b": "ribu"},
      "definition": {"a": "definisi A", "b": "definisi B"}
    }
  }
}

JANGAN output teks lain selain JSON valid."""


def _get_indicators_by_ids(user_id: str, indicator_ids: list[str]) -> list[dict]:
    """Fetch indicators from database."""
    client = get_client()

    if not indicator_ids:
        # Get all indicators for user
        result = client.table("sdi_indicators").select("*").eq("user_id", user_id).execute()
        return result.data

    # Get specific indicators
    result = client.table("sdi_indicators").select("*").in_("id", indicator_ids).eq("user_id", user_id).execute()
    return result.data


def _compute_semantic_similarity(text_a: str, text_b: str) -> float:
    """Compute semantic similarity between two texts using embeddings."""
    try:
        emb_a = embeddings.embed_query(text_a)
        emb_b = embeddings.embed_query(text_b)

        # Cosine similarity
        dot_product = sum(a * b for a, b in zip(emb_a, emb_b))
        magnitude_a = sum(a * a for a in emb_a) ** 0.5
        magnitude_b = sum(b * b for b in emb_b) ** 0.5

        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0

        return dot_product / (magnitude_a * magnitude_b)

    except Exception:
        return 0.0


def _compare_indicators_field_by_field(ind_a: dict, ind_b: dict) -> dict:
    """Deep comparison of indicator fields."""
    differences = {}

    # Compare units
    if ind_a.get("unit") != ind_b.get("unit"):
        differences["unit"] = {
            "a": ind_a.get("unit", ""),
            "b": ind_b.get("unit", ""),
        }

    # Compare definitions
    def_a = ind_a.get("definition", "")
    def_b = ind_b.get("definition", "")
    if def_a != def_b:
        # Compute semantic similarity
        sim = _compute_semantic_similarity(def_a, def_b)
        differences["definition"] = {
            "a": def_a[:200] + "..." if len(def_a) > 200 else def_a,
            "b": def_b[:200] + "..." if len(def_b) > 200 else def_b,
            "similarity": sim,
        }

    # Compare temporal resolution
    if ind_a.get("temporal_resolution") != ind_b.get("temporal_resolution"):
        differences["temporal_resolution"] = {
            "a": ind_a.get("temporal_resolution", ""),
            "b": ind_b.get("temporal_resolution", ""),
        }

    # Compare spatial coverage
    spa_a = ind_a.get("spatial_coverage", "")
    spa_b = ind_b.get("spatial_coverage", "")
    if spa_a.lower() != spa_b.lower() and (spa_a or spa_b):
        differences["spatial_coverage"] = {
            "a": spa_a,
            "b": spa_b,
        }

    # Compare KL code
    kl_a = ind_a.get("kl_code", "")
    kl_b = ind_b.get("kl_code", "")
    if kl_a and kl_b and kl_a != kl_b:
        differences["kl_code"] = {
            "a": kl_a,
            "b": kl_b,
        }

    return differences


def _classify_conflict(ind_a: dict, ind_b: dict, similarity: float, differences: dict) -> str:
    """Classify the type of conflict between two indicators."""
    # Check for exact duplicate (high similarity, same unit, same KL)
    if similarity >= 0.90:
        if ind_a.get("unit") == ind_b.get("unit") and ind_a.get("kl_code") == ind_b.get("kl_code"):
            return "duplicate"

    # Check for KL code mismatch (same indicator, different K/L)
    if differences.get("kl_code"):
        name_a = ind_a.get("indicator_name", "").lower()
        name_b = ind_b.get("indicator_name", "").lower()
        # Check if names are very similar
        if name_a == name_b or (name_a in name_b or name_b in name_a):
            return "kl_code_mismatch"

    # Check for unit mismatch (similar definition, different unit)
    if differences.get("unit"):
        def_sim = differences.get("definition", {}).get("similarity", 0)
        if def_sim >= 0.75:
            return "unit_mismatch"

    # Check for definition inconsistency
    if differences.get("definition"):
        def_sim = differences.get("definition", {}).get("similarity", 0)
        if 0.60 <= def_sim < 0.85:
            return "definition_inconsistency"

    # Check for temporal inconsistency
    if differences.get("temporal_resolution"):
        return "temporal_inconsistency"

    # Default: duplicate for high similarity
    if similarity >= settings.SIMILARITY_THRESHOLD:
        return "duplicate"

    return ""


def _generate_flag_description(conflict_type: str, ind_a: dict, ind_b: dict, differences: dict) -> str:
    """Generate Indonesian description for the consistency flag."""
    name_a = ind_a.get("indicator_name", "Indikator A")
    name_b = ind_b.get("indicator_name", "Indikator B")

    descriptions = {
        "duplicate": f"Indikator duplikat terdeteksi. '{name_a}' dan '{name_b}' tampaknya merujuk pada indikator yang sama.",
        "unit_mismatch": f"Ketidaksamaan satuan terdeteksi. '{name_a}' menggunakan satuan {ind_a.get('unit', '')} sedangkan '{name_b}' menggunakan {ind_b.get('unit', '')}.",
        "definition_inconsistency": f"Ketidaksamaan definisi terdeteksi antara '{name_a}' dan '{name_b}'. Perlu klarifikasi konsep yang digunakan.",
        "temporal_inconsistency": f"Ketidaksamaan temporal terdeteksi. '{name_a}' menggunakan resolusi {ind_a.get('temporal_resolution', '')} sedangkan '{name_b}' menggunakan {ind_b.get('temporal_resolution', '')}.",
        "kl_code_mismatch": f"Indikator serupa dari K/L berbeda. '{name_a}' (K/L {ind_a.get('kl_code', '')}) dan '{name_b}' (K/L {ind_b.get('kl_code', '')}) mungkin adalah indikator yang sama.",
    }

    # Add detail suffix
    base_desc = descriptions.get(conflict_type, f"Potensi konflik antara '{name_a}' dan '{name_b}'.")

    if differences.get("unit"):
        base_desc += f" Satuan berbeda: {differences['unit']['a']} vs {differences['unit']['b']}."

    return base_desc


def _find_similar_indicators_batch(indicators: list[dict], threshold: float) -> list[tuple]:
    """
    Find similar indicators in a batch using semantic similarity.

    Returns:
        List of tuples (ind_a, ind_b, similarity)
    """
    similar_pairs = []

    for i, ind_a in enumerate(indicators):
        for j, ind_b in enumerate(indicators):
            if j <= i:  # Avoid duplicates and self-comparison
                continue

            # Compare names
            name_a = ind_a.get("indicator_name", "")
            name_b = ind_b.get("indicator_name", "")
            combined_names = f"{name_a} {name_b}"

            # Compute semantic similarity of combined text
            def_a = ind_a.get("definition", "")
            def_b = ind_b.get("definition", "")

            # Combine for better semantic matching
            combined_text = f"{name_a}\n{def_a}\n---\n{name_b}\n{def_b}"

            # Get embedding and compute similarity
            try:
                emb = embeddings.embed_query(combined_text)

                # For stored indicators, we would need to retrieve their embeddings
                # For now, compute name similarity
                name_similarity = _compute_semantic_similarity(name_a, name_b)

                # Also compute definition similarity if available
                if def_a and def_b:
                    def_similarity = _compute_semantic_similarity(def_a, def_b)
                    avg_similarity = (name_similarity + def_similarity) / 2
                else:
                    avg_similarity = name_similarity

                if avg_similarity >= threshold:
                    similar_pairs.append((ind_a, ind_b, avg_similarity))

            except Exception:
                continue

    return similar_pairs


def run_consistency_check(
    user_id: str,
    indicator_ids: list[str] | None = None,
    check_type: str = "all",
    threshold: float | None = None,
    batch_size: int | None = None
) -> ConsistencyCheckResult:
    """
    Run consistency check for user's indicators.

    Args:
        user_id: User ID whose indicators to check
        indicator_ids: Specific indicator IDs to check (None for all)
        check_type: Type of check (all, unit, definition, kl_code)
        threshold: Similarity threshold (default from settings)
        batch_size: Batch size for processing (default from settings)

    Returns:
        ConsistencyCheckResult with flags found
    """
    if threshold is None:
        threshold = settings.SIMILARITY_THRESHOLD
    if batch_size is None:
        batch_size = settings.CONSISTENCY_CHECK_BATCH_SIZE

    # Fetch indicators
    indicators = _get_indicators_by_ids(user_id, indicator_ids or [])

    if not indicators:
        return ConsistencyCheckResult(
            indicators_checked=0,
            flags_found=0,
            flags=[],
        )

    flags = []

    # Find similar indicators
    similar_pairs = _find_similar_indicators_batch(indicators, threshold)

    # Process each similar pair
    for ind_a, ind_b, similarity in similar_pairs:
        # Deep field comparison
        differences = _compare_indicators_field_by_field(ind_a, ind_b)

        # Classify conflict type
        conflict_type = _classify_conflict(ind_a, ind_b, similarity, differences)

        if not conflict_type:
            continue

        # Generate description
        description = _generate_flag_description(
            conflict_type,
            ind_a,
            ind_b,
            differences
        )

        # Create flag
        flag = ConsistencyFlag(
            id=str(uuid.uuid4()),
            indicator_a_id=ind_a["id"],
            indicator_b_id=ind_b["id"],
            indicator_a_name=ind_a["indicator_name"],
            indicator_b_name=ind_b["indicator_name"],
            conflict_type=ConflictType(conflict_type),
            similarity_score=similarity,
            description=description,
            details=differences,
            status=ConflictStatus.open,
        )

        flags.append(flag.model_dump())

    return ConsistencyCheckResult(
        indicators_checked=len(indicators),
        flags_found=len(flags),
        flags=flags,
        checked_at=datetime.utcnow(),
    )


def run_consistency_check_async(
    user_id: str,
    indicator_ids: list[str] | None = None,
    check_type: str = "all",
) -> str:
    """
    Run consistency check and save flags to database.

    Args:
        user_id: User ID
        indicator_ids: Specific indicator IDs to check
        check_type: Type of check

    Returns:
        JSON string with results
    """
    try:
        result = run_consistency_check(user_id, indicator_ids, check_type)

        client = get_client()

        # Clear existing flags for these indicators (avoid duplicates)
        if indicator_ids:
            client.table("consistency_flags").delete().in_("indicator_a_id", indicator_ids).execute()
            client.table("consistency_flags").delete().in_("indicator_b_id", indicator_ids).execute()

        # Insert new flags
        for flag_data in result.flags:
            flag_data["user_id"] = user_id
            client.table("consistency_flags").insert(flag_data).execute()

        return json.dumps({
            "success": True,
            "indicators_checked": result.indicators_checked,
            "flags_found": result.flags_found,
            "flags": result.flags,
        }, ensure_ascii=False)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e),
        }, ensure_ascii=False)


def resolve_flag(flag_id: str, user_id: str, notes: str) -> dict:
    """
    Mark a consistency flag as resolved.

    Args:
        flag_id: ID of flag to resolve
        user_id: User ID resolving the flag
        notes: Resolution notes

    Returns:
        Result dictionary
    """
    client = get_client()

    result = client.table("consistency_flags").update({
        "status": "resolved",
        "resolved_at": datetime.utcnow().isoformat(),
        "resolved_by": user_id,
        "resolution_notes": notes,
    }).eq("id", flag_id).eq("user_id", user_id).execute()

    if result.data:
        return {"success": True, "flag": result.data[0]}
    else:
        return {"success": False, "error": "Flag not found"}


def get_user_flags(user_id: str, status: str = "open") -> list[dict]:
    """
    Get consistency flags for a user.

    Args:
        user_id: User ID
        status: Filter by status (default: open)

    Returns:
        List of flags
    """
    client = get_client()

    query = client.table("consistency_flags").select("*").eq("user_id", user_id)

    if status and status != "all":
        query = query.eq("status", status)

    result = query.order("created_at", desc=True).execute()
    return result.data


def check_single_indicator(user_id: str, indicator_id: str) -> list[dict]:
    """
    Check a single indicator for consistency with existing indicators.

    Args:
        user_id: User ID
        indicator_id: Indicator ID to check

    Returns:
        List of potential duplicate/conflict flags
    """
    # Get the indicator
    indicators = _get_indicators_by_ids(user_id, [indicator_id])

    if not indicators:
        return []

    target = indicators[0]

    # Get all other indicators
    all_indicators = _get_indicators_by_ids(user_id, [])

    # Find similar indicators
    similar_pairs = _find_similar_indicators_batch(
        [target] + [i for i in all_indicators if i["id"] != indicator_id],
        settings.SIMILARITY_THRESHOLD
    )

    flags = []
    for ind_a, ind_b, similarity in similar_pairs:
        # Only include pairs where one is our target
        if ind_a["id"] != indicator_id and ind_b["id"] != indicator_id:
            continue

        # Determine which is which
        if ind_b["id"] == indicator_id:
            ind_a, ind_b = ind_b, ind_a

        # Deep comparison
        differences = _compare_indicators_field_by_field(ind_a, ind_b)
        conflict_type = _classify_conflict(ind_a, ind_b, similarity, differences)

        if conflict_type:
            description = _generate_flag_description(conflict_type, ind_a, ind_b, differences)

            flags.append(ConsistencyFlag(
                id=str(uuid.uuid4()),
                indicator_a_id=ind_a["id"],
                indicator_b_id=ind_b["id"],
                indicator_a_name=ind_a["indicator_name"],
                indicator_b_name=ind_b["indicator_name"],
                conflict_type=ConflictType(conflict_type),
                similarity_score=similarity,
                description=description,
                details=differences,
                status=ConflictStatus.open,
            ).model_dump())

    return flags
