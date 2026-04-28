"""Tests for knowledge graph tools."""
from app.tools.knowledge_graph import upsert_entity, query_entity_graph, get_entity_relations, _GRAPH


def setup_function():
    _GRAPH.clear()


def test_upsert_and_query():
    upsert_entity.invoke({
        "name": "Bank Indonesia", "entity_type": "institution",
        "attributes": {"country": "ID", "sector": "monetary"},
        "relations": [{"target": "OJK", "relation": "coordinates_with"}]
    })
    results = query_entity_graph.invoke({"query": "bank indonesia"})
    assert len(results) == 1
    assert results[0]["name"] == "Bank Indonesia"


def test_query_by_type():
    upsert_entity.invoke({"name": "ASEAN DTS Roadmap", "entity_type": "policy",
                          "attributes": {}, "relations": []})
    results = query_entity_graph.invoke({"query": "policy"})
    assert any(r["name"] == "ASEAN DTS Roadmap" for r in results)


def test_get_relations():
    upsert_entity.invoke({
        "name": "OJK", "entity_type": "institution",
        "attributes": {}, "relations": [{"target": "Bank Indonesia", "relation": "reports_to"}]
    })
    rels = get_entity_relations.invoke({"name": "OJK"})
    assert len(rels) == 1
    assert rels[0]["target"] == "Bank Indonesia"


def test_query_no_match():
    results = query_entity_graph.invoke({"query": "nonexistent_xyz"})
    assert results == []
