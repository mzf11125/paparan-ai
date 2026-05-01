"""Metadata extraction agent for SDI-compliant indicator extraction from RPJMN/Renstra documents."""
import json
import uuid
from datetime import datetime
from typing import Optional

from langchain.tools import tool
from langchain_core.documents import Document

from app.tools.document_processor import extract_text, extract_metadata_from_text
from app.tools.sdi_tools import (
    search_sdi_indicators,
    find_similar_indicators,
    validate_sdi_indicator,
    get_kl_reference,
    get_sector_reference,
    get_sdi_goal_reference,
)
from app.tools.bappenas_tools import (
    get_kl_code,
    get_sector_code,
    resolve_abbreviation,
)
from app.config import settings
from app.llm import get_chat_model
from app.tools.skills_loader import get_humanizer_prompt
from app.tools.text_utils import sanitize_brief_text

# Initialize model for extraction
_model = get_chat_model()

# Append humanizer rules (em dash ban, anti-AI-tell) to the extraction system prompt
_HUMANIZER_ADDENDUM = "\n\n---\n" + get_humanizer_prompt()

# SDI-compliant extraction prompt in Indonesian
_SYSTEM_PROMPT = """Anda adalah ahli ekstraksi metadata indikator SDI (Satu Data Indonesia) dari dokumen RPJMN/Renstra.

TUGAS UTAMA:
1. Ekstrak indikator dari dokumen yang diberikan
2. Validasi setiap indikator sesuai standar SDI (Perpres 195/2024)
3. Tandai tingkat kepercayaan (confidence) berdasarkan kejelasan informasi

STANDAR SDI WAJIB:

A. Identitas (Identity)
- indicator_id: Format "KL_CODE.XXXX" (contoh: 007.00123 untuk Kementrian Kesehatan)
- indicator_name: Nama indikator dalam Bahasa Indonesia (WAJIB)
- indicator_name_en: Nama indikator dalam Bahasa Inggris (opsional)

B. Definisi (Definition)
- definition: Definisi lengkap indikator (WAJIB)
- methodology: Metodologi pengumpulan dan perhitungan data (disarankan)

C. Produsen Data (Data Producer)
- producing_institution: Nama Kementrian/Lembaga produsen data (WAJIB)
- kl_code: Kode K/L 3 digit sesuai standar SDI (WAJIB)

D. Spasio Waktu (Spatial & Temporal)
- spatial_coverage: Cakupan spasial (nasional, provinsi, kabupaten, kota, dll)
- temporal_coverage: Cakupan temporal (rentang waktu data)
- temporal_resolution: Resolusi temporal (realtime/daily/weekly/monthly/quarterly/annual/biennial)

E. Unit (Satuan)
- unit: Satuan pengukuran (contoh: %, orang, rupiah, ton, km2)
- unit_type: Tipe satuan (nominal/ratio/index/count/percentage/rate/duration/currency)

F. Ketersediaan (Availability)
- availability_status: Status ketersediaan (available/partial/scheduled/discontinued)
- last_updated: Tanggal terakhir diperbarui

G. Rekomendasi
- sector: Sektor per Perpres 195/2024 (01-19)
- sub_sector: Sub-sektor spesifik
- sdi_goal_code: Kode tujuan SDI (SDI 1-5)
- sdg_code: Kode SDG terkait (contoh: 3.4.1, 4.2.1)
- data_quality_notes: Catatan kualitas data
- extraction_confidence: HIGH/MEDIUM/LOW berdasarkan kejelasan informasi

PANDUAN PENTING:
1. Gunakan TOOLS untuk memvalidasi kode K/L dan sektor
2. Sertakan kutipan asli (source_excerpt) dari dokumen untuk verifikasi
3. Catat nomor halaman jika tersedia
4. Jangan mengarang (hallucinate) - gunakan informasi yang ada dalam dokumen saja
5. Jika indikator tidak lengkap, tandai sebagai LOW confidence
6. Gunakan resolve_abbreviation untuk memperluas singkatan K/L

OUTPUT FORMAT:
Hanya kembalikan JSON valid dengan struktur berikut:
{
  "indicators": [
    {
      "indicator_id": "KL_CODE.XXXXX",
      "indicator_name": "nama indikator dalam Bahasa",
      "indicator_name_en": "English name",
      "definition": "definisi lengkap",
      "methodology": "metodologi perhitungan",
      "producing_institution": "nama K/L",
      "kl_code": "XXX",
      "spatial_coverage": "cakupan spasial",
      "temporal_coverage": "rentang waktu",
      "temporal_resolution": "annual",
      "unit": "satuan",
      "unit_type": "nominal",
      "availability_status": "available",
      "last_updated": "YYYY-MM-DD",
      "sector": "01",
      "sub_sector": "",
      "sdi_goal_code": "SDI 1",
      "sdg_code": "3.4.1",
      "data_quality_notes": "catatan kualitas",
      "extraction_confidence": "HIGH/MEDIUM/LOW",
      "source_page_number": 1,
      "source_excerpt": "kutipan asli dari dokumen"
    }
  ]
}

JANGAN output teks lain selain JSON valid. Mulai dan akhiri dengan { dan }.
"""

INDICATOR_SCHEMA = """{
  "indicators": [
    {
      "indicator_id": "KL_CODE.XXXXX",
      "indicator_name": "nama indikator dalam Bahasa",
      "indicator_name_en": "",
      "definition": "definisi lengkap indikator",
      "methodology": "",
      "producing_institution": "nama K/L lengkap",
      "kl_code": "XXX",
      "spatial_coverage": "",
      "temporal_coverage": "",
      "temporal_resolution": "annual",
      "unit": "satuan pengukuran",
      "unit_type": "nominal",
      "availability_status": "available",
      "last_updated": null,
      "sector": "",
      "sub_sector": "",
      "sdi_goal_code": "",
      "sdg_code": "",
      "data_quality_notes": "",
      "extraction_confidence": "MEDIUM",
      "source_page_number": null,
      "source_excerpt": ""
    }
  ]
}"""


@tool
def get_document_text_chunks(document_text: str, chunk_size: int = 8000, overlap: int = 500) -> str:
    """
    Split document text into manageable chunks for processing.

    Args:
        document_text: Full document text
        chunk_size: Maximum characters per chunk
        overlap: Overlap between chunks

    Returns:
        JSON string with chunk information
    """
    chunks = []
    for i in range(0, len(document_text), chunk_size - overlap):
        chunk_text = document_text[i:i + chunk_size]
        chunks.append({
            "chunk_id": len(chunks) + 1,
            "start_pos": i,
            "end_pos": min(i + chunk_size, len(document_text)),
            "text": chunk_text,
        })
        if i + chunk_size >= len(document_text):
            break

    return json.dumps({"chunks": chunks, "total_chunks": len(chunks)}, ensure_ascii=False)


@tool
def validate_indicator_with_tools(indicator: dict) -> str:
    """
    Validate indicator using SDI tools and get reference data.

    Args:
        indicator: Indicator dictionary to validate

    Returns:
        Validation result with corrected fields
    """
    result = {"valid": True, "corrections": {}, "warnings": []}

    # Validate using SDI validation tool
    validation = validate_sdi_indicator.invoke(indicator)

    if not validation.get("valid"):
        result["valid"] = False
        result["errors"] = validation.get("errors", [])

    # Check KL code reference
    if "kl_code" in indicator:
        ref = get_kl_reference.invoke(indicator["kl_code"])
        if "Unknown" not in ref:
            # Extract actual institution name
            result["corrections"]["producing_institution"] = ref.split(": ", 1)[1].split(" (")[0].strip()
        else:
            result["warnings"].append(f"Unknown K/L code: {indicator['kl_code']}")

    # Check sector reference
    if "sector" in indicator and indicator["sector"]:
        ref = get_sector_reference.invoke(indicator["sector"])
        if "Unknown" not in ref:
            # Extract sector name
            result["corrections"]["sector_name"] = ref.split(": ", 1)[1].strip()

    result["warnings"].extend(validation.get("warnings", []))

    return json.dumps(result, ensure_ascii=False)


@tool
def check_for_duplicates(indicator_name: str, indicator_id: str, definition: str, user_id: str) -> str:
    """
    Check if similar indicators already exist in the database.

    Args:
        indicator_name: Name of indicator to check
        indicator_id: ID of indicator to check
        definition: Definition of indicator
        user_id: User ID for filtering

    Returns:
        JSON string with duplicate indicators found
    """
    # Use semantic similarity search
    result = find_similar_indicators.invoke({
        "indicator_name": indicator_name,
        "definition": definition,
        "user_id": user_id,
        "threshold": 0.85,
        "limit": 5,
    })

    similar = json.loads(result) if isinstance(result, str) else result

    # Filter out self-reference
    filtered = [
        ind for ind in similar
        if ind.get("indicator_id") != indicator_id
    ]

    return json.dumps({"duplicates": filtered}, ensure_ascii=False)


def run_extraction_job(document_text: str, filename: str, document_id: str, user_id: str) -> dict:
    """
    Run SDI metadata extraction job for a document.

    Args:
        document_text: Extracted text from document
        filename: Name of the source document
        document_id: UUID of the document
        user_id: User ID requesting extraction

    Returns:
        dict with extraction results
    """
    start_time = datetime.utcnow()

    # Resolve abbreviations in document
    resolved_text = resolve_abbreviation.invoke(document_text)

    # Get document metadata
    doc_metadata = extract_metadata_from_text(resolved_text)

    # Determine KL code from document metadata
    kl_code = ""
    if doc_metadata.get("ministry"):
        kl_code = get_kl_code.invoke(doc_metadata["ministry"])

    # Determine sector from document metadata
    sector_code = ""
    if doc_metadata.get("year") or doc_metadata.get("document_type"):
        # Try to infer sector from content
        pass

    # Prepare extraction prompt with context
    prompt = f"""Ekstrak indikator SDI dari dokumen berikut:

NAMA FILE: {filename}
JENIS DOKUMEN: {doc_metadata.get('document_type', 'Tidak diketahui')}
TAHUN: {doc_metadata.get('year', 'Tidak diketahui')}
KEMENTRIAN/LEMBAGA: {doc_metadata.get('ministry', 'Tidak diketahui')}
KODE K/L: {kl_code if kl_code else 'Perlu ditentukan'}

KONTEKS DOKUMEN:
Dokumen ini berisi indikator yang terkait dengan {doc_metadata.get('document_type', 'RPJMN/Renstra')}.

INSTRUKSI:
1. Ekstrak SEMUA indikator yang terkait dengan {doc_metadata.get('document_type', 'RPJMN/Renstra')}
2. Gunakan KODE K/L di atas sebagai prefix untuk indicator_id
3. Tandai extraction_confidence berdasarkan kejelasan informasi dalam dokumen
4. Sertakan source_excerpt yang tepat dari dokumen untuk setiap indikator
5. Gunakan TOOLS untuk validasi kode K/L, sektor, dan mengecek duplikat

{INDICATOR_SCHEMA}

Teks dokumen (bagian pertama, max 15000 karakter):
{resolved_text[:15000]}"""

    try:
        # Call Claude for extraction
        response = _model.invoke([
            {"role": "system", "content": _SYSTEM_PROMPT + _HUMANIZER_ADDENDUM},
            {"role": "user", "content": prompt},
        ])

        raw = response.content.strip()

        # Clean JSON response
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:].lstrip()

        data = sanitize_brief_text(json.loads(raw))
        indicators = data.get("indicators", [])

        # Validate and enrich each indicator
        validated_indicators = []
        high_conf = 0
        medium_conf = 0
        low_conf = 0
        by_ministry = {}

        for ind in indicators:
            # Add document reference
            ind["source_document_id"] = document_id
            ind["user_id"] = user_id

            # Resolve KL code if missing or invalid
            if not ind.get("kl_code") or not ind["kl_code"].isdigit():
                if doc_metadata.get("ministry"):
                    ind["kl_code"] = get_kl_code.invoke(doc_metadata["ministry"])
                else:
                    # Try to infer from producing_institution
                    institution = ind.get("producing_institution", "")
                    if institution:
                        ind["kl_code"] = get_kl_code.invoke(institution)

            # Resolve producing institution name if KL code available
            if ind.get("kl_code") and ind.get("kl_code").isdigit():
                ref = get_kl_reference.invoke(ind["kl_code"])
                if "Unknown" not in ref:
                    ind["producing_institution"] = ref.split(": ", 1)[1].split(" (")[0].strip()

            # Generate indicator_id if missing
            if not ind.get("indicator_id") or "." not in ind["indicator_id"]:
                # Use KL_CODE.XXXXX format with incrementing suffix
                base_id = f"{ind['kl_code']}.%05d" if ind.get("kl_code") else "BAPPENAS.%05d"
                ind["indicator_id"] = base_id

            # Validate indicator
            validation = validate_indicator_with_tools.invoke(ind)
            validation_data = json.loads(validation)

            # Add validation warnings to notes
            if validation_data.get("warnings"):
                notes = ind.get("data_quality_notes", "")
                warnings_str = "; ".join(validation_data["warnings"])
                ind["data_quality_notes"] = f"{notes} [Validasi: {warnings_str}]".strip() if notes else f"Validasi: {warnings_str}"

            # Apply corrections
            if validation_data.get("corrections"):
                ind.update(validation_data["corrections"])

            # Track confidence stats
            conf = ind.get("extraction_confidence", "MEDIUM")
            if conf == "HIGH":
                high_conf += 1
            elif conf == "MEDIUM":
                medium_conf += 1
            else:
                low_conf += 1

            # Track by ministry
            ministry = ind.get("producing_institution", "Unknown")
            by_ministry[ministry] = by_ministry.get(ministry, 0) + 1

            # Check for duplicates
            dup_check = check_for_duplicates.invoke({
                "indicator_name": ind.get("indicator_name", ""),
                "indicator_id": ind.get("indicator_id", ""),
                "definition": ind.get("definition", ""),
                "user_id": user_id,
            })
            dup_data = json.loads(dup_check)
            if dup_data.get("duplicates"):
                ind["data_quality_notes"] = f"{ind.get('data_quality_notes', '')} [POTENSIAL DUPLIKAT: {len(dup_data['duplicates'])} indikator serupa]".strip()

            validated_indicators.append(ind)

        # Build extraction summary
        summary = {
            "total_indicators": len(validated_indicators),
            "high_confidence": high_conf,
            "medium_confidence": medium_conf,
            "low_confidence": low_conf,
            "by_ministry": by_ministry,
            "by_sector": {},
        }

        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()

        return {
            "success": True,
            "indicators": validated_indicators,
            "extraction_summary": summary,
            "document_metadata": doc_metadata,
            "processing_time_seconds": processing_time,
        }

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Failed to parse JSON response: {str(e)}",
            "raw_response": response.content if 'response' in locals() else "",
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Extraction failed: {str(e)}",
        }


def run_extraction_for_indicators(document_text: str, user_id: str) -> dict:
    """
    Run extraction specifically for indicators (not full document analysis).

    Args:
        document_text: Document text to extract indicators from
        user_id: User ID

    Returns:
        dict with extraction results
    """
    return run_extraction_job(document_text, "document", "", user_id)


def extract_indicators_from_text(text: str, filename: str = "", user_id: str = "") -> list[dict]:
    """
    Simple wrapper to extract indicators from text.

    Args:
        text: Text to extract indicators from
        filename: Source filename (optional)
        user_id: User ID (optional)

    Returns:
        List of extracted indicators
    """
    document_id = str(uuid.uuid4())
    result = run_extraction_job(text, filename or "unknown.txt", document_id, user_id)

    if result.get("success"):
        return result.get("indicators", [])
    else:
        raise Exception(f"Extraction failed: {result.get('error')}")
