from datetime import datetime, timedelta, timezone
from typing import Optional
from langchain.tools import tool
from langchain_core.documents import Document
from app.db.client import get_client
from app.db.vector_store import feed_store, feed_retriever
from app.db.schema import FeedItem, PolicyBrief


@tool
def check_feed_cache(url: str) -> Optional[dict]:
    """Check if a URL is already cached in feed_items and not expired."""
    client = get_client()
    now = datetime.now(timezone.utc).isoformat()
    result = client.table("feed_items").select("*").eq("url", url).gt("expires_at", now).execute()
    return result.data[0] if result.data else None


@tool
def save_feed_item(title: str, summary: str, url: str, source: str, region: str, topic_tags: list[str]) -> str:
    """Save a feed item to Supabase with 24h TTL."""
    client = get_client()
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    client.table("feed_items").upsert({
        "title": title, "summary": summary, "url": url,
        "source": source, "region": region, "topic_tags": topic_tags,
        "expires_at": expires_at,
    }, on_conflict="url").execute()
    # Also index in vector store
    doc = Document(
        page_content=f"{title}\n{summary}",
        metadata={"url": url, "source": source, "region": region, "object_type": "FeedItem"},
    )
    feed_store.add_documents([doc])
    return f"Saved: {url}"


@tool
def save_paparan_report(report: dict) -> str:
    """Save a PolicyBrief to paparan_reports table."""
    client = get_client()
    client.table("paparan_reports").insert({
        "topic": report.get("title", ""),
        "region": report.get("region", "ASEAN"),
        "content": report,
    }).execute()
    return "Report saved"


@tool
def get_user_memory(user_id: str) -> list[dict]:
    """Fetch agent memory for a user."""
    client = get_client()
    result = client.table("agent_memory").select("*").eq("user_id", user_id).execute()
    return result.data or []


@tool
def save_user_memory(user_id: str, memory_type: str, content: dict) -> str:
    """Save agent memory for a user."""
    client = get_client()
    client.table("agent_memory").upsert({
        "user_id": user_id, "memory_type": memory_type, "content": content,
    }).execute()
    return "Memory saved"


@tool
def semantic_search(query: str, region: str = "", limit: int = 5) -> list[dict]:
    """Semantic search over feed_items using vector similarity."""
    filter_dict = {"region": region} if region else {}
    results = feed_store.similarity_search_with_score(
        query, k=limit, filter=filter_dict if filter_dict else None
    )
    return [
        {"content": doc.page_content, "metadata": doc.metadata, "score": float(score)}
        for doc, score in results
    ]
