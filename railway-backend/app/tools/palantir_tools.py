"""Palantir ontology tools — wired to real Supabase data instead of stubs."""
from langchain.tools import tool
from app.db.client import get_client
from app.tools.knowledge_graph import query_entity_graph


@tool
def get_sdi_indicator(indicator_id: str) -> dict:
    """Get an SDI indicator by ID from the database.

    Args:
        indicator_id: SDI indicator ID (e.g. 'IND-001')

    Returns:
        Indicator dict or not_found
    """
    try:
        client = get_client()
        result = client.table("sdi_indicators").select("*").eq("indicator_id", indicator_id).limit(1).execute()
        if result.data:
            r = result.data[0]
            return {"indicator_id": r["indicator_id"], "name": r["indicator_name"],
                    "unit": r["unit"], "frequency": r["temporal_resolution"],
                    "kl_code": r["kl_code"], "sector": r["sector"]}
    except Exception:
        pass
    return {"status": "not_found", "indicator_id": indicator_id}


@tool
def get_sdi_institution(kl_code: str) -> dict:
    """Get a K/L institution by code.

    Args:
        kl_code: 3-digit K/L code (e.g. '007')

    Returns:
        Institution dict with name and category
    """
    try:
        client = get_client()
        result = client.table("kl_code_reference").select("*").eq("code", kl_code).limit(1).execute()
        if result.data:
            r = result.data[0]
            return {"kl_code": r["code"], "name": r["name"], "category": r["category"]}
    except Exception:
        pass
    return {"status": "not_found", "kl_code": kl_code}


@tool
def get_sdi_dataset(dataset_id: str) -> dict:
    """Get a Bappenas document/dataset by ID.

    Args:
        dataset_id: Document UUID

    Returns:
        Dataset metadata dict
    """
    try:
        client = get_client()
        result = client.table("bappenas_documents").select(
            "id,filename,processing_status,metadata,uploaded_at"
        ).eq("id", dataset_id).limit(1).execute()
        if result.data:
            r = result.data[0]
            return {"dataset_id": r["id"], "filename": r["filename"],
                    "availability": r["processing_status"], "metadata": r.get("metadata", {})}
    except Exception:
        pass
    return {"status": "not_found", "dataset_id": dataset_id}


@tool
def get_policy_document(doc_id: str) -> dict:
    """Get a policy brief/report by ID.

    Args:
        doc_id: Report UUID

    Returns:
        Policy document summary
    """
    try:
        client = get_client()
        result = client.table("paparan_reports").select(
            "id,topic,region,content,created_at"
        ).eq("id", doc_id).limit(1).execute()
        if result.data:
            r = result.data[0]
            content = r.get("content", {})
            return {"doc_id": r["id"], "title": content.get("title", r["topic"]),
                    "region": r["region"], "date": r["created_at"][:10],
                    "type": "PolicyBrief"}
    except Exception:
        pass
    return {"status": "not_found", "doc_id": doc_id}


@tool
def get_regulation(reg_id: str) -> dict:
    """Search for a regulation by ID or keyword in feed items.

    Args:
        reg_id: Regulation ID, number, or keyword (e.g. 'Perpres 195/2024')

    Returns:
        Regulation info dict
    """
    try:
        from app.tools.supabase_tools import semantic_search
        results = semantic_search.invoke({"query": reg_id, "limit": 1})
        if results:
            r = results[0]
            return {"reg_id": reg_id, "title": r["metadata"].get("title", reg_id),
                    "url": r["metadata"].get("url", ""), "jurisdiction": "Indonesia",
                    "content_snippet": r["content"][:300]}
    except Exception:
        pass
    return {"status": "not_found", "reg_id": reg_id}


@tool
def get_entity(entity_name: str) -> dict:
    """Get an entity (organization, institution, person) by name.

    Args:
        entity_name: Entity name to look up

    Returns:
        Entity dict with type, region, relations
    """
    # Check knowledge graph first
    kg_results = query_entity_graph.invoke({"query": entity_name})
    if kg_results:
        return kg_results[0]

    # Fallback: semantic search in feed items
    try:
        from app.tools.supabase_tools import semantic_search
        results = semantic_search.invoke({"query": entity_name, "limit": 1})
        if results:
            return {"entity_name": entity_name, "type": "unknown",
                    "region": results[0]["metadata"].get("region", "ASEAN"),
                    "source": results[0]["metadata"].get("url", "")}
    except Exception:
        pass
    return {"status": "not_found", "entity_name": entity_name}
