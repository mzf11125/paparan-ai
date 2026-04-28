"""Diagnostic tool status checker. Run with: cd backend && python scripts/check_tools.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def _check(tool_fn, kwargs: dict) -> tuple[bool, str]:
    try:
        result = tool_fn.invoke(kwargs)
        s = str(result)
        is_stub = "[stub]" in s or "'status': 'stub'" in s or '"status": "stub"' in s
        if is_stub:
            desc = (tool_fn.description or "").split("\n")[0]
            return False, desc[:60]
        return True, f"calls {tool_fn.name} API"
    except Exception as e:
        return False, f"Error — {str(e)[:52]}"


def _load_checks():
    checks = []

    try:
        from app.tools.tavily_tools import tavily_search
        checks.append(("web_search", tavily_search, {"query": "ASEAN policy 2026", "max_results": 1}))
    except Exception as e:
        checks.append(("web_search", None, str(e)[:55]))

    try:
        from app.tools.palantir_tools import get_sdi_indicator, get_policy_document, get_entity
        checks.append(("sdi_indicator",   get_sdi_indicator,  {"indicator_id": "IND-001"}))
        checks.append(("policy_document", get_policy_document,{"doc_id": "DOC-001"}))
        checks.append(("ontology_entity", get_entity,         {"entity_name": "Bappenas"}))
    except Exception as e:
        checks.append(("palantir_tools", None, str(e)[:55]))

    try:
        from app.tools.spatial_tools import get_region_bbox, enrich_with_geodata
        checks.append(("spatial_bbox",   get_region_bbox,    {"region": "Indonesia"}))
        checks.append(("spatial_enrich", enrich_with_geodata,{"brief_id": "b-001", "region": "ASEAN"}))
    except Exception as e:
        checks.append(("spatial_tools", None, str(e)[:55]))

    try:
        from app.tools.supabase_tools import semantic_search
        checks.append(("semantic_search", semantic_search, {"query": "ASEAN fintech", "limit": 1}))
    except Exception as e:
        checks.append(("semantic_search", None, str(e)[:55]))

    return checks


C1, C2 = 16, 58

print(f"  ┌{'─'*(C1+2)}┬{'─'*(C2+2)}┐")
print(f"  │ {'Tool':<{C1}} │ {'Status':<{C2}} │")
print(f"  ├{'─'*(C1+2)}┼{'─'*(C2+2)}┤")

checks = _load_checks()
for i, entry in enumerate(checks):
    name, fn, kwargs = entry
    if fn is None:
        # import failed
        icon, msg = "❌ Error", f"Import failed — {kwargs}"
    else:
        ok, msg = _check(fn, kwargs)
        icon = "✅ Real" if ok else "❌ Stub"
    status = f"{icon} — {msg}"
    print(f"  │ {name:<{C1}} │ {status:<{C2}} │")
    if i < len(checks) - 1:
        print(f"  ├{'─'*(C1+2)}┼{'─'*(C2+2)}┤")

print(f"  └{'─'*(C1+2)}┴{'─'*(C2+2)}┘")
