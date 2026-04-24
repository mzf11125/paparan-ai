import json
from langchain.chat_models import init_chat_model
from langchain.tools import tool
from langchain_core.documents import Document
from app.tools.tavily_tools import tavily_search
from app.tools.supabase_tools import semantic_search
from app.db.vector_store import feed_retriever
from app.db.schema import PolicyBrief, Development, Source, Action

_model = init_chat_model("claude-sonnet-4-5", model_provider="anthropic")

BRIEF_SCHEMA = """Return ONLY valid JSON matching this schema:
{
  "title": "string",
  "executiveSummary": ["string"],
  "currentSituation": "string",
  "developments": [{"id":"d1","text":"string","impact":"HIGH|MEDIUM|LOW","delta":"NEW","sourceId":"s1","entities":[]}],
  "implications": "string",
  "risks": ["string"],
  "opportunities": ["string"],
  "actions": [{"priority":"HIGH","text":"string","owner":"","deadline":""}],
  "sources": [{"id":"s1","title":"string","url":"string","confidence":"HIGH","date":"2026-04-24"}],
  "tags": ["string"]
}"""


def run_researcher(topic: str, region: str = "ASEAN") -> PolicyBrief:
    # Cache-first: check vector store before hitting Tavily
    cached = feed_retriever.invoke(topic)
    cache_context = "\n\n".join(
        f"Source: {d.metadata.get('url','')}\n{d.page_content}" for d in cached
    )

    # Supplement with live search if cache is thin
    live_context = ""
    if len(cached) < 3:
        live_context = tavily_search.invoke({"query": f"{region} {topic} policy 2026", "topic": "news", "max_results": 5})

    prompt = f"""Research this ASEAN policy topic and produce a structured brief.

Topic: {topic}
Region: {region}

Cached intelligence:
{cache_context}

Live search results:
{live_context}

{BRIEF_SCHEMA}

Produce the JSON brief now. Use only information from the sources above."""

    response = _model.invoke([{"role": "user", "content": prompt}])
    raw = response.content.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    data = json.loads(raw)
    import uuid
    from datetime import datetime
    data["id"] = str(uuid.uuid4())
    data["date"] = datetime.utcnow().strftime("%Y-%m-%d")
    data["region"] = region
    return PolicyBrief(**data)
