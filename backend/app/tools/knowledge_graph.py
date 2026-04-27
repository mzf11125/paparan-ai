"""LangMem-based entity knowledge graph for ASEAN policy entities."""
from langchain.tools import tool

# In-memory store: {entity_name: {type, attributes, relations: [{target, relation}]}}
_GRAPH: dict = {}


@tool
def upsert_entity(name: str, entity_type: str, attributes: dict, relations: list) -> str:
    """Upsert an entity into the ASEAN policy knowledge graph.

    Args:
        name: Entity name (e.g. 'Bank Indonesia', 'ASEAN DTS Roadmap')
        entity_type: Type string (e.g. 'institution', 'policy', 'regulation')
        attributes: Dict of entity attributes
        relations: List of {target: str, relation: str} dicts

    Returns:
        Confirmation string
    """
    _GRAPH[name] = {"type": entity_type, "attributes": attributes, "relations": relations}
    return f"Upserted entity: {name}"


@tool
def query_entity_graph(query: str) -> list:
    """Query the ASEAN policy knowledge graph by name or type.

    Args:
        query: Search string matched against entity names and types

    Returns:
        List of matching entity dicts
    """
    q = query.lower()
    results = []
    for name, data in _GRAPH.items():
        if q in name.lower() or q in data.get("type", "").lower():
            results.append({"name": name, **data})
    return results[:10]


@tool
def get_entity_relations(name: str) -> list:
    """Get all relations for a named entity.

    Args:
        name: Entity name to look up

    Returns:
        List of relation dicts
    """
    entity = _GRAPH.get(name)
    if not entity:
        return []
    return entity.get("relations", [])
