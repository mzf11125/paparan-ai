"""SDI (Satu Data Indonesia) reference lookup tools."""
import httpx
import re
from typing import Optional
from langchain.tools import tool
from langchain_core.documents import Document
from app.db.client import get_client
from app.db.vector_store import get_sdi_indicator_store, get_sdi_retriever
from app.config import settings


# Input validation patterns to prevent injection
VALID_KL_CODE_PATTERN = re.compile(r'^\d{3}$')
VALID_SECTOR_CODE_PATTERN = re.compile(r'^\d{2}$')
VALID_INDICATOR_ID_PATTERN = re.compile(r'^[A-Za-z0-9\.\-]+$')
SAFE_TEXT_PATTERN = re.compile(r'^[\w\s\.\-,\(\)\']+$')


def validate_kl_code(kl_code: str) -> bool:
    """Validate KL code format (3 digits)."""
    return bool(VALID_KL_CODE_PATTERN.match(kl_code))


def validate_sector_code(sector_code: str) -> bool:
    """Validate sector code format (2 digits)."""
    return bool(VALID_SECTOR_CODE_PATTERN.match(sector_code))


def validate_indicator_id(indicator_id: str) -> bool:
    """Validate indicator ID format."""
    return bool(VALID_INDICATOR_ID_PATTERN.match(indicator_id))


def sanitize_text_input(text: str, max_length: int = 500) -> str:
    """Sanitize text input to prevent injection."""
    if not text:
        return ""
    # Remove potentially dangerous characters and limit length
    sanitized = re.sub(r'[;<>"\']', '', text)
    return sanitized[:max_length].strip()


@tool
def get_sdi_reference_indicator(indicator_id: str) -> str:
    """
    Get SDI reference indicator from database or external source.

    Args:
        indicator_id: Indicator ID to lookup (e.g., "BAPPENAS.00123" or "007.001")

    Returns:
        JSON string with indicator reference data
    """
    # Input validation
    indicator_id = sanitize_text_input(indicator_id, 100)
    if not indicator_id:
        return "Invalid indicator ID: cannot be empty"

    client = get_client()

    # First, check database
    result = client.table("sdi_indicators").select("*").eq("indicator_id", indicator_id).execute()

    if result.data:
        return _format_indicator_for_tool(result.data[0])

    # If not in database, try external SDI reference
    try:
        # Try satudata.go.id API
        api_url = f"{settings.DATA_GO_ID_URL}/api/v1/indicator/{indicator_id}"
        with httpx.Client(timeout=10.0) as client_http:
            response = client_http.get(api_url)
            if response.status_code == 200:
                return response.text
    except Exception:
        pass

    return f"No reference found for indicator ID: {indicator_id}"


@tool
def search_sdi_indicators(query: str, kl_code: str = "", sector: str = "", limit: int = 10) -> str:
    """
    Search for SDI indicators in database using semantic search.

    Args:
        query: Search query in Indonesian or English
        kl_code: Filter by K/L code (optional)
        sector: Filter by sector (optional)
        limit: Maximum results to return

    Returns:
        JSON string with matching indicators
    """
    # Input validation
    query = sanitize_text_input(query, 500)
    if kl_code and not validate_kl_code(kl_code):
        return f"Invalid KL code format: {kl_code}. Expected 3-digit code (e.g., '007')"
    if sector and not validate_sector_code(sector):
        return f"Invalid sector code format: {sector}. Expected 2-digit code (e.g., '01')"
    if limit and (not isinstance(limit, int) or limit < 1 or limit > 100):
        return "Invalid limit: must be between 1 and 100"

    client = get_client()

    # Try semantic search first
    try:
        results = get_sdi_retriever().invoke(query)
        formatted_results = []

        for doc in results[:limit]:
            # Parse metadata from vector store
            metadata = doc.metadata or {}
            formatted = {
                "id": metadata.get("id", ""),
                "indicator_id": metadata.get("indicator_id", ""),
                "indicator_name": metadata.get("indicator_name", ""),
                "producing_institution": metadata.get("producing_institution", ""),
                "kl_code": metadata.get("kl_code", ""),
                "definition": metadata.get("definition", "")[:200] + "..." if len(metadata.get("definition", "")) > 200 else metadata.get("definition", ""),
            }

            # Apply filters
            if kl_code and formatted.get("kl_code") != kl_code:
                continue
            if sector and metadata.get("sector") != sector:
                continue

            formatted_results.append(formatted)

        if formatted_results:
            from json import dumps
            return dumps(formatted_results, ensure_ascii=False)

    except Exception as e:
        # Fall back to text search if vector search fails
        pass

    # Fallback to text search using Supabase RPC function
    # Using the secure search_indicators_by_text function created in migration 003
    try:
        # Call the secure SQL function that uses parameterized queries
        result = client.rpc("search_indicators_by_text", {
            "search_query": query
        }).execute()

        if result.data:
            # Apply additional filters in Python (safe from SQL injection)
            filtered_results = result.data
            if kl_code:
                filtered_results = [r for r in filtered_results if r.get("kl_code") == kl_code]
            if sector:
                filtered_results = [r for r in filtered_results if r.get("sector") == sector]

            # Apply limit
            filtered_results = filtered_results[:limit]

            if filtered_results:
                from json import dumps
                # Format results to match expected output
                formatted_results = []
                for r in filtered_results:
                    formatted_results.append({
                        "id": r.get("id", ""),
                        "indicator_id": r.get("indicator_id", ""),
                        "indicator_name": r.get("indicator_name", ""),
                        "producing_institution": r.get("producing_institution", ""),
                        "kl_code": r.get("kl_code", ""),
                        "definition": r.get("definition", "")[:200] + "..." if len(r.get("definition", "")) > 200 else r.get("definition", ""),
                    })
                return dumps(formatted_results, ensure_ascii=False)

    except Exception as e:
        # Log error for monitoring
        import logging
        logging.warning(f"Text search failed: {str(e)}")
        pass

    return "No indicators found matching the query."


@tool
def get_kl_reference(kl_code: str) -> str:
    """
    Get K/L reference from lookup table.

    Args:
        kl_code: 3-digit K/L code

    Returns:
        K/L name and category
    """
    # Input validation
    kl_code = sanitize_text_input(kl_code, 10)
    if not validate_kl_code(kl_code):
        return f"Invalid KL code format: {kl_code}. Expected 3-digit code (e.g., '007')"

    client = get_client()
    result = client.table("kl_code_reference").select("*").eq("code", kl_code).execute()

    if result.data:
        ref = result.data[0]
        return f"K/L Code {ref['code']}: {ref['name']} ({ref['category']})"

    return f"Unknown K/L code: {kl_code}"


@tool
def get_sector_reference(sector_code: str) -> str:
    """
    Get sector reference from lookup table.

    Args:
        sector_code: 2-digit sector code

    Returns:
        Sector name
    """
    # Input validation
    sector_code = sanitize_text_input(sector_code, 10)
    if not validate_sector_code(sector_code):
        return f"Invalid sector code format: {sector_code}. Expected 2-digit code (e.g., '01')"

    client = get_client()
    result = client.table("sector_reference").select("*").eq("code", sector_code).execute()

    if result.data:
        return f"Sector {result.data[0]['code']}: {result.data[0]['name']}"

    return f"Unknown sector code: {sector_code}"


@tool
def get_sdi_goal_reference(goal_code: str) -> str:
    """
    Get SDI goal reference from lookup table.

    Args:
        goal_code: SDI goal code (e.g., "SDI 1")

    Returns:
        SDI goal description
    """
    # Input validation
    goal_code = sanitize_text_input(goal_code, 20)
    if not goal_code:
        return "Invalid goal code: cannot be empty"

    client = get_client()
    result = client.table("sdi_goal_reference").select("*").eq("code", goal_code).execute()

    if result.data:
        return f"{result.data[0]['code']}: {result.data[0]['description']}"

    return f"Unknown SDI goal code: {goal_code}"


@tool
def get_all_kl_references() -> str:
    """
    Get all K/L reference codes.

    Returns:
        Formatted list of all K/L codes
    """
    client = get_client()
    result = client.table("kl_code_reference").select("*").order("code").execute()

    lines = ["K/L Reference Codes:", ""]
    for ref in result.data:
        lines.append(f"{ref['code']}: {ref['name']} ({ref['category']})")

    return "\n".join(lines)


@tool
def get_all_sector_references() -> str:
    """
    Get all sector reference codes.

    Returns:
        Formatted list of all sector codes
    """
    client = get_client()
    result = client.table("sector_reference").select("*").order("code").execute()

    lines = ["Sector Reference Codes (Perpres 195/2024):", ""]
    for ref in result.data:
        lines.append(f"{ref['code']}: {ref['name']}")

    return "\n".join(lines)


@tool
def get_all_sdi_goal_references() -> str:
    """
    Get all SDI goal reference codes.

    Returns:
        Formatted list of all SDI goals
    """
    client = get_client()
    result = client.table("sdi_goal_reference").select("*").execute()

    lines = ["SDI Goal Reference Codes (Perpres 195/2024):", ""]
    for ref in result.data:
        lines.append(f"{ref['code']}: {ref['description']}")

    return "\n".join(lines)


@tool
def index_sdi_indicator(
    indicator_id: str,
    indicator_name: str,
    definition: str,
    producing_institution: str,
    kl_code: str,
    user_id: str
) -> str:
    """
    Index an SDI indicator in the vector store for semantic search.

    Args:
        indicator_id: Unique indicator identifier
        indicator_name: Name of the indicator
        definition: Definition of the indicator
        producing_institution: Institution producing the indicator
        kl_code: K/L code of the institution
        user_id: User ID for ownership

    Returns:
        Success message
    """
    # Input validation
    if not validate_indicator_id(indicator_id):
        return f"Invalid indicator_id format: {indicator_id}"
    indicator_name = sanitize_text_input(indicator_name, 500)
    definition = sanitize_text_input(definition, 5000)
    producing_institution = sanitize_text_input(producing_institution, 200)
    if not validate_kl_code(kl_code):
        return f"Invalid KL code format: {kl_code}"
    user_id = sanitize_text_input(str(user_id), 50)

    try:
        # Create combined text for embedding
        combined_text = f"{indicator_name}\n\n{definition}\n\n{producing_institution}"

        doc = Document(
            page_content=combined_text,
            metadata={
                "indicator_id": indicator_id,
                "indicator_name": indicator_name,
                "definition": definition,
                "producing_institution": producing_institution,
                "kl_code": kl_code,
                "user_id": user_id,
                "object_type": "SDIIndicator",
            },
        )

        get_sdi_indicator_store().add_documents([doc])
        return f"Indexed indicator: {indicator_id}"

    except Exception as e:
        return f"Error indexing indicator: {str(e)}"


@tool
def find_similar_indicators(
    indicator_name: str,
    definition: str,
    user_id: str,
    threshold: float = 0.85,
    limit: int = 5
) -> str:
    """
    Find semantically similar indicators to detect potential duplicates.

    Args:
        indicator_name: Name of indicator to compare
        definition: Definition of indicator to compare
        user_id: User ID for filtering
        threshold: Similarity threshold (0-1, default 0.85)
        limit: Maximum results to return

    Returns:
        List of similar indicators with similarity scores
    """
    # Input validation
    indicator_name = sanitize_text_input(indicator_name, 500)
    definition = sanitize_text_input(definition, 5000)
    user_id = sanitize_text_input(str(user_id), 50)
    if not isinstance(threshold, (int, float)) or threshold < 0 or threshold > 1:
        return "Invalid threshold: must be between 0 and 1"
    if not isinstance(limit, int) or limit < 1 or limit > 50:
        return "Invalid limit: must be between 1 and 50"

    try:
        # Combine for embedding search
        combined_text = f"{indicator_name}\n\n{definition}"

        # Search vector store
        results = get_sdi_indicator_store().similarity_search_with_score(
            query=combined_text,
            k=limit,
        )

        similar_indicators = []
        for doc, score in results:
            # Filter by user and threshold
            metadata = doc.metadata or {}
            if metadata.get("user_id") != user_id:
                continue

            # Convert distance to similarity (cosine distance to similarity)
            similarity = 1 - score  # assuming cosine distance
            if similarity < threshold:
                continue

            similar_indicators.append({
                "indicator_id": metadata.get("indicator_id", ""),
                "indicator_name": metadata.get("indicator_name", ""),
                "similarity": float(similarity),
            })

        from json import dumps
        return dumps(similar_indicators, ensure_ascii=False)

    except Exception as e:
        return f"Error finding similar indicators: {str(e)}"


@tool
def validate_sdi_indicator(indicator_data: dict) -> dict:
    """
    Validate an SDI indicator against SDI standard requirements.

    Args:
        indicator_data: Dictionary with indicator fields

    Returns:
        Validation result with errors and warnings
    """
    errors = []
    warnings = []

    # Required fields
    required_fields = [
        "indicator_id",
        "indicator_name",
        "definition",
        "producing_institution",
        "kl_code",
        "unit",
        "unit_type",
    ]

    for field in required_fields:
        if field not in indicator_data or not indicator_data[field]:
            errors.append(f"Missing required field: {field}")

    # Validate indicator_id format
    if "indicator_id" in indicator_data:
        indicator_id = indicator_data["indicator_id"]
        if "." not in indicator_id:
            warnings.append("indicator_id should follow format: KL_CODE.XXXX (e.g., 007.00123)")

    # Validate kl_code format
    if "kl_code" in indicator_data:
        kl_code = str(indicator_data["kl_code"])
        if not kl_code.isdigit() or len(kl_code) != 3:
            errors.append(f"Invalid kl_code format: {kl_code}. Expected 3-digit code (e.g., 007)")

    # Validate temporal_resolution
    valid_temporal = ["realtime", "hourly", "daily", "weekly", "monthly",
                      "quarterly", "semiannual", "annual", "biennial", "quinary"]
    if "temporal_resolution" in indicator_data:
        if indicator_data["temporal_resolution"] not in valid_temporal:
            errors.append(f"Invalid temporal_resolution: {indicator_data['temporal_resolution']}")

    # Validate unit_type
    valid_unit_types = ["nominal", "ratio", "index", "count", "percentage", "rate", "duration", "currency"]
    if "unit_type" in indicator_data:
        if indicator_data["unit_type"] not in valid_unit_types:
            errors.append(f"Invalid unit_type: {indicator_data['unit_type']}")

    # Check for source excerpt (recommended)
    if "source_excerpt" in indicator_data and len(indicator_data.get("source_excerpt", "")) < 50:
        warnings.append("source_excerpt is too short for verification")

    # Check confidence level
    if "extraction_confidence" in indicator_data:
        if indicator_data["extraction_confidence"] not in ["HIGH", "MEDIUM", "LOW"]:
            errors.append(f"Invalid extraction_confidence: {indicator_data['extraction_confidence']}")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }


@tool
def suggest_indicator_id(prefix: str, count: int = 1) -> str:
    """
    Suggest next available indicator IDs for a K/L.

    Args:
        prefix: K/L code prefix (e.g., "007" for Kementrian Kesehatan)
        count: Number of IDs to suggest

    Returns:
        List of suggested indicator IDs
    """
    # Input validation
    prefix = sanitize_text_input(prefix, 10)
    if not validate_kl_code(prefix):
        return f"Invalid KL code format: {prefix}. Expected 3-digit code (e.g., '007')"
    if not isinstance(count, int) or count < 1 or count > 100:
        return "Invalid count: must be between 1 and 100"

    client = get_client()

    # Get max existing indicator ID for this prefix using a safe filter
    # Using ilike with pattern matching through Supabase's filter method
    result = client.table("sdi_indicators").select("indicator_id").filter("indicator_id", "like", f"{prefix}.%").execute()

    max_suffix = 0
    for row in result.data:
        indicator_id = row.get("indicator_id", "")
        if "." in indicator_id:
            suffix = indicator_id.split(".")[-1]
            try:
                suffix_int = int(suffix)
                max_suffix = max(max_suffix, suffix_int)
            except ValueError:
                pass

    suggestions = []
    for i in range(count):
        next_id = max_suffix + i + 1
        suggestions.append(f"{prefix}.{next_id:05d}")

    from json import dumps
    return dumps(suggestions, ensure_ascii=False)


def _format_indicator_for_tool(indicator: dict) -> str:
    """Format indicator data for tool output."""
    from json import dumps

    return dumps({
        "indicator_id": indicator.get("indicator_id", ""),
        "indicator_name": indicator.get("indicator_name", ""),
        "indicator_name_en": indicator.get("indicator_name_en", ""),
        "definition": indicator.get("definition", ""),
        "methodology": indicator.get("methodology", ""),
        "producing_institution": indicator.get("producing_institution", ""),
        "kl_code": indicator.get("kl_code", ""),
        "spatial_coverage": indicator.get("spatial_coverage", ""),
        "temporal_coverage": indicator.get("temporal_coverage", ""),
        "temporal_resolution": indicator.get("temporal_resolution", "annual"),
        "unit": indicator.get("unit", ""),
        "unit_type": indicator.get("unit_type", "nominal"),
        "availability_status": indicator.get("availability_status", "available"),
        "sector": indicator.get("sector", ""),
        "sub_sector": indicator.get("sub_sector", ""),
        "sdi_goal_code": indicator.get("sdi_goal_code", ""),
        "sdg_code": indicator.get("sdg_code", ""),
        "extraction_confidence": indicator.get("extraction_confidence", "MEDIUM"),
    }, ensure_ascii=False, indent=2)
