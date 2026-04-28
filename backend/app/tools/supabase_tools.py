"""
Supabase cache and storage tools for Paparan AI.

Provides functions for:
- Feed item caching with expiry checking
- Policy brief storage and retrieval
- Semantic search using vector retrievers
- User memory management for agent context
- Batch operations for efficient data handling
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Literal
from uuid import uuid4

from langchain.tools import tool
from langchain_core.documents import Document
from pydantic import BaseModel, Field

from app.config import settings
from app.db.client import get_client
from app.db.vector_store import (
    feed_store,
    feed_retriever,
    document_store,
    document_retriever,
)
from app.db.schema import FeedItem, PolicyBrief, Source, AgentMemory


# ============================================================================
# Pydantic Models
# ============================================================================

class CacheResult(BaseModel):
    """Result from cache check operation."""

    is_cached: bool
    item: Optional[FeedItem] = None
    is_expired: bool = False
    age_hours: float = 0.0
    expires_at: Optional[str] = None


class SaveResult(BaseModel):
    """Result from save operation."""

    success: bool
    item_id: str = ""
    message: str = ""
    was_update: bool = False


class SemanticSearchResult(BaseModel):
    """Result from semantic search operation."""

    query: str
    results: list[FeedItem] = Field(default_factory=list)
    total_count: int = 0
    search_time_ms: float = 0.0
    used_vector_search: bool = True


# ============================================================================
# Feed Cache Tools
# ============================================================================

@tool
def check_feed_cache(url: str) -> dict:
    """
    Check if a URL is already cached in feed_items and not expired.

    Args:
        url: The URL to check in the cache.

    Returns:
        Dict with cache status, item data if found, and expiry info.
    """
    try:
        client = get_client()
        now = datetime.now(timezone.utc).isoformat()

        result = client.table("feed_items").select("*").eq("url", url).execute()

        if not result.data:
            return {
                "is_cached": False,
                "item": None,
                "is_expired": False,
                "message": "URL not found in cache",
            }

        item = result.data[0]
        expires_at = item.get("expires_at")

        # Check expiry
        is_expired = False
        if expires_at:
            try:
                expiry_dt = datetime.fromisoformat(expires_at)
                is_expired = expiry_dt < datetime.now(timezone.utc)
            except (ValueError, TypeError):
                pass

        # Calculate age
        age_hours = 0.0
        retrieved_at = item.get("retrieved_at")
        if retrieved_at:
            try:
                retrieved_dt = datetime.fromisoformat(retrieved_at)
                age_hours = (datetime.now(timezone.utc) - retrieved_dt).total_seconds() / 3600
            except (ValueError, TypeError):
                pass

        return {
            "is_cached": True,
            "item": item if not is_expired else None,
            "is_expired": is_expired,
            "age_hours": round(age_hours, 2),
            "expires_at": expires_at,
            "message": "Cache hit" if not is_expired else "Cache expired",
        }

    except Exception as e:
        return {
            "is_cached": False,
            "item": None,
            "is_expired": False,
            "error": str(e),
            "message": f"Cache check failed: {e}",
        }


@tool
def save_feed_item(
    title: str,
    summary: str,
    url: str,
    source: str,
    region: str,
    topic_tags: list[str],
    tier: str = "unknown",
    is_government: bool = False,
    published_at: str = "",
    content: str = "",
    ttl_hours: int = 24,
) -> str:
    """
    Save a feed item to Supabase with configurable TTL and vector indexing.

    Args:
        title: Item title.
        summary: Content summary.
        url: Source URL.
        source: Source domain name.
        region: Region/country code.
        topic_tags: List of topic tags.
        tier: Source tier (primary, tier1, indonesia, islamic_web3, unknown).
        is_government: Whether source is government/official.
        published_at: ISO timestamp of original publication.
        content: Full content for vector embedding (optional).
        ttl_hours: Time-to-live in hours (default 24).

    Returns:
        Success message with item ID.
    """
    try:
        client = get_client()

        # Calculate expiry
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=ttl_hours)).isoformat()
        retrieved_at = datetime.now(timezone.utc).isoformat()

        # Generate ID if needed
        item_id = str(uuid4())

        # Check for existing item
        existing = client.table("feed_items").select("id").eq("url", url).execute()
        was_update = bool(existing.data)
        if was_update:
            item_id = existing.data[0]["id"]

        # Prepare item data
        item_data = {
            "id": item_id,
            "title": title,
            "summary": summary or content[:500] if content else "",
            "url": url,
            "source": source,
            "region": region,
            "topic_tags": topic_tags,
            "tier": tier,
            "is_government": is_government,
            "published_at": published_at or retrieved_at,
            "retrieved_at": retrieved_at,
            "expires_at": expires_at,
        }

        # Add content if provided
        if content:
            item_data["content"] = content

        # Upsert to Supabase
        client.table("feed_items").upsert(
            item_data,
            on_conflict="url"
        ).execute()

        # Also index in vector store for semantic search
        try:
            doc = Document(
                page_content=f"{title}\n\n{summary or content[:2000]}",
                metadata={
                    "url": url,
                    "source": source,
                    "region": region,
                    "tier": tier,
                    "is_government": is_government,
                    "object_type": "FeedItem",
                    "item_id": item_id,
                },
            )
            feed_store.add_documents([doc])
        except Exception as embed_error:
            # Don't fail save if embedding fails
            pass

        action = "Updated" if was_update else "Saved"
        return f"{action} feed item: {item_id} ({url})"

    except Exception as e:
        return f"Failed to save feed item: {e}"


@tool
def batch_save_feed_items(items: list[dict]) -> dict:
    """
    Save multiple feed items in a single batch operation.

    Args:
        items: List of feed item dicts with keys matching save_feed_item args.

    Returns:
        Summary dict with success count, failure count, and details.
    """
    success_count = 0
    failure_count = 0
    errors = []

    for item in items:
        result = save_feed_item.invoke(item)
        if "Failed" in result:
            failure_count += 1
            errors.append(result)
        else:
            success_count += 1

    return {
        "total": len(items),
        "success": success_count,
        "failed": failure_count,
        "errors": errors[:10],  # First 10 errors
    }


@tool
def clean_expired_cache(hours: int = 24) -> dict:
    """
    Remove expired feed items from the cache.

    Args:
        hours: Remove items expired more than this many hours ago.

    Returns:
        Summary of cleanup operation.
    """
    try:
        client = get_client()
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        cutoff_iso = cutoff.isoformat()

        # Delete expired items
        result = (
            client.table("feed_items")
            .delete()
            .lt("expires_at", cutoff_iso)
            .execute()
        )

        count = result.count if hasattr(result, "count") else 0

        return {
            "deleted_count": count,
            "cutoff": cutoff_iso,
            "message": f"Cleaned {count} expired items",
        }

    except Exception as e:
        return {
            "deleted_count": 0,
            "error": str(e),
            "message": f"Cleanup failed: {e}",
        }


# ============================================================================
# Policy Brief Storage
# ============================================================================

@tool
def save_paparan_report(
    report: dict,
    user_id: str = "",
    brief_id: str = "",
) -> str:
    """
    Save a PolicyBrief to paparan_reports table.

    Args:
        report: PolicyBrief dict or JSON-serializable object.
        user_id: User ID for ownership tracking.
        brief_id: Optional specific ID (generates UUID if not provided).

    Returns:
        Success message with brief ID.
    """
    try:
        client = get_client()

        # Generate ID if not provided
        if not brief_id:
            brief_id = str(uuid4())

        # Prepare report data
        report_data = {
            "id": brief_id,
            "topic": report.get("title", report.get("topic", "")),
            "region": report.get("region", "ASEAN"),
            "content": report,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        # Insert to Supabase
        result = client.table("paparan_reports").insert(report_data).execute()

        if result.data:
            return f"Saved report: {brief_id}"
        return f"Failed to save report: {brief_id}"

    except Exception as e:
        return f"Failed to save report: {e}"


@tool
def get_paparan_report(brief_id: str, user_id: str = "") -> Optional[dict]:
    """
    Retrieve a PolicyBrief by ID.

    Args:
        brief_id: The brief ID to retrieve.
        user_id: Optional user ID for access control.

    Returns:
        PolicyBrief dict if found, None otherwise.
    """
    try:
        client = get_client()

        query = client.table("paparan_reports").select("*").eq("id", brief_id)
        if user_id:
            query = query.eq("user_id", user_id)

        result = query.execute()

        if result.data:
            return result.data[0]
        return None

    except Exception:
        return None


@tool
def list_paparan_reports(
    user_id: str = "",
    region: str = "",
    limit: int = 20,
    offset: int = 0,
) -> list[dict]:
    """
    List PolicyBriefs with optional filters.

    Args:
        user_id: Filter by user ID.
        region: Filter by region.
        limit: Max results to return.
        offset: Pagination offset.

    Returns:
        List of PolicyBrief dicts.
    """
    try:
        client = get_client()

        query = client.table("paparan_reports").select("*")

        if user_id:
            query = query.eq("user_id", user_id)
        if region:
            query = query.eq("region", region)

        result = (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        return result.data or []

    except Exception:
        return []


# ============================================================================
# Semantic Search
# ============================================================================

@tool
def semantic_search(
    query: str,
    region: str = "",
    limit: int = 5,
    threshold: float = 0.75,
    search_type: Literal["similarity", "mmr"] = "similarity",
    filter_tier: str = "",
) -> list[dict]:
    """
    Semantic search over feed_items using vector similarity.

    Args:
        query: Search query text.
        region: Optional region filter.
        limit: Max results to return (1-20).
        threshold: Minimum similarity score (0-1).
        search_type: "similarity" for basic, "mmr" for diverse results.
        filter_tier: Optional source tier filter.

    Returns:
        List of dicts with content, metadata, and score.
    """
    try:
        # Build filter dict
        filter_dict = {}
        if region:
            filter_dict["region"] = region
        if filter_tier:
            filter_dict["tier"] = filter_tier

        # Configure search kwargs
        search_kwargs = {"k": min(limit, 20)}
        if threshold > 0:
            search_kwargs["score_threshold"] = threshold

        # Get retriever
        if search_type == "mmr":
            retriever = feed_store.as_retriever(
                search_type="mmr",
                search_kwargs={"k": search_kwargs["k"], "fetch_k": limit * 3},
            )
        else:
            retriever = feed_store.as_retriever(
                search_type="similarity_score_threshold",
                search_kwargs=search_kwargs,
            )

        # Execute search
        if filter_dict:
            # With metadata filter
            docs_with_scores = feed_store.similarity_search_with_score(
                query,
                k=limit,
                filter=filter_dict,
            )
        else:
            docs_with_scores = feed_store.similarity_search_with_score(
                query,
                k=limit,
            )

        # Format results
        results = []
        for doc, score in docs_with_scores:
            results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score),
            })

        return results

    except Exception as e:
        return [{"error": str(e), "content": "", "metadata": {}, "score": 0.0}]


@tool
def semantic_search_documents(
    query: str,
    user_id: str = "",
    limit: int = 5,
) -> list[dict]:
    """
    Semantic search over user-uploaded documents.

    Args:
        query: Search query text.
        user_id: Filter by user ID.
        limit: Max results to return.

    Returns:
        List of dicts with content, metadata, and score.
    """
    try:
        filter_dict = {}
        if user_id:
            filter_dict["user_id"] = user_id

        docs_with_scores = document_store.similarity_search_with_score(
            query,
            k=limit,
            filter=filter_dict if filter_dict else None,
        )

        results = []
        for doc, score in docs_with_scores:
            results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score),
            })

        return results

    except Exception as e:
        return [{"error": str(e), "content": "", "metadata": {}, "score": 0.0}]


@tool
def hybrid_search(
    query: str,
    region: str = "",
    limit: int = 10,
    semantic_weight: float = 0.7,
) -> list[dict]:
    """
    Hybrid search combining semantic vector search and keyword matching.

    Args:
        query: Search query text.
        region: Optional region filter.
        limit: Max results to return.
        semantic_weight: Weight for semantic results (0-1, default 0.7).

    Returns:
        Combined and ranked results.
    """
    try:
        client = get_client()

        # Get semantic results
        semantic_results = semantic_search.invoke({
            "query": query,
            "region": region,
            "limit": limit,
            "search_type": "similarity",
        })

        # Get keyword results
        keyword_query = client.table("feed_items").select("*")
        if region:
            keyword_query = keyword_query.eq("region", region)

        keyword_query = (
            keyword_query.or_(f"title.ilike.%{query}%,summary.ilike.%{query}%")
            .order("retrieved_at", desc=True)
            .limit(limit)
            .execute()
        )

        keyword_results = [
            {"content": f"{r.get('title','')}\n{r.get('summary','')}", "metadata": r, "score": 0.5}
            for r in keyword_results.data or []
        ]

        # Combine and re-rank
        combined = {}

        # Add semantic results with weighted score
        for r in semantic_results:
            url = r["metadata"].get("url", "")
            if url and url not in combined:
                combined[url] = {
                    **r,
                    "combined_score": r.get("score", 0) * semantic_weight,
                }
            elif url:
                combined[url]["combined_score"] += r.get("score", 0) * semantic_weight

        # Add keyword results with weighted score
        for r in keyword_results:
            url = r["metadata"].get("url", "")
            if url and url not in combined:
                combined[url] = {
                    **r,
                    "combined_score": (1 - semantic_weight) * 0.5,
                }
            elif url:
                combined[url]["combined_score"] += (1 - semantic_weight) * 0.5

        # Sort by combined score
        ranked = sorted(combined.values(), key=lambda x: x.get("combined_score", 0), reverse=True)
        return ranked[:limit]

    except Exception as e:
        return [{"error": str(e), "content": "", "metadata": {}, "score": 0.0}]


# ============================================================================
# User Memory Management
# ============================================================================

@tool
def get_user_memory(
    user_id: str,
    memory_type: Literal["preferences", "topics", "context", "feedback", ""] = "",
) -> list[dict]:
    """
    Fetch agent memory for a user, optionally filtered by type.

    Args:
        user_id: The user's ID.
        memory_type: Filter by memory type (empty for all).

    Returns:
        List of memory dicts.
    """
    try:
        client = get_client()

        query = client.table("agent_memory").select("*").eq("user_id", user_id)

        if memory_type:
            query = query.eq("memory_type", memory_type)

        # Filter out expired memories
        now = datetime.now(timezone.utc).isoformat()
        query = query.or_(f"expires_at.is.null,expires_at.gte.{now}")

        result = query.order("created_at", desc=True).execute()

        return result.data or []

    except Exception:
        return []


@tool
def save_user_memory(
    user_id: str,
    memory_type: Literal["preferences", "topics", "context", "feedback"],
    content: dict,
    ttl_hours: int = 168,  # 7 days default
) -> str:
    """
    Save agent memory for a user with expiry.

    Args:
        user_id: The user's ID.
        memory_type: Type of memory (preferences, topics, context, feedback).
        content: Memory content as dict.
        ttl_hours: Time-to-live in hours (default 168 = 7 days).

    Returns:
        Success message with memory ID.
    """
    try:
        client = get_client()

        memory_id = str(uuid4())
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=ttl_hours)).isoformat()

        memory_data = {
            "id": memory_id,
            "user_id": user_id,
            "memory_type": memory_type,
            "content": content,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at,
        }

        result = client.table("agent_memory").insert(memory_data).execute()

        if result.data:
            return f"Saved memory: {memory_id} (type: {memory_type})"
        return f"Failed to save memory"

    except Exception as e:
        return f"Failed to save memory: {e}"


@tool
def update_user_preferences(
    user_id: str,
    tracked_topics: list[str] | None = None,
    tracked_regions: list[str] | None = None,
    preferences: dict | None = None,
) -> str:
    """
    Update user preferences in memory.

    Args:
        user_id: The user's ID.
        tracked_topics: Topics to track.
        tracked_regions: Regions to track.
        preferences: Additional preference dict.

    Returns:
        Success message.
    """
    try:
        # Get existing preferences
        existing_memories = get_user_memory.invoke({
            "user_id": user_id,
            "memory_type": "preferences",
        })

        existing_content = {}
        if existing_memories:
            existing_content = existing_memories[0].get("content", {})

        # Merge updates
        if tracked_topics is not None:
            existing_content["tracked_topics"] = tracked_topics
        if tracked_regions is not None:
            existing_content["tracked_regions"] = tracked_regions
        if preferences is not None:
            existing_content.update(preferences)

        # Save updated preferences
        return save_user_memory.invoke({
            "user_id": user_id,
            "memory_type": "preferences",
            "content": existing_content,
            "ttl_hours": 8760,  # 1 year
        })

    except Exception as e:
        return f"Failed to update preferences: {e}"


@tool
def clear_expired_memory(user_id: str = "") -> dict:
    """
    Remove expired agent memories.

    Args:
        user_id: Optional user ID to limit cleanup.

    Returns:
        Summary of cleanup operation.
    """
    try:
        client = get_client()
        now = datetime.now(timezone.utc).isoformat()

        query = client.table("agent_memory").delete().lt("expires_at", now)
        if user_id:
            query = query.eq("user_id", user_id)

        result = query.execute()
        count = result.count if hasattr(result, "count") else 0

        return {
            "deleted_count": count,
            "user_id": user_id or "all",
            "message": f"Cleared {count} expired memories",
        }

    except Exception as e:
        return {
            "deleted_count": 0,
            "error": str(e),
            "message": f"Cleanup failed: {e}",
        }


# ============================================================================
# Stats and Monitoring
# ============================================================================

@tool
def get_feed_stats(region: str = "") -> dict:
    """
    Get statistics about cached feed items.

    Args:
        region: Optional region filter.

    Returns:
        Stats dict with counts, freshness info, etc.
    """
    try:
        client = get_client()

        query = client.table("feed_items").select("*")
        if region:
            query = query.eq("region", region)

        result = query.execute()

        items = result.data or []
        now = datetime.now(timezone.utc)

        total = len(items)
        by_region = {}
        by_tier = {}
        expired_count = 0

        for item in items:
            # Count by region
            r = item.get("region", "unknown")
            by_region[r] = by_region.get(r, 0) + 1

            # Count by tier
            t = item.get("tier", "unknown")
            by_tier[t] = by_tier.get(t, 0) + 1

            # Check expiry
            expires_at = item.get("expires_at")
            if expires_at:
                try:
                    expiry_dt = datetime.fromisoformat(expires_at)
                    if expiry_dt < now:
                        expired_count += 1
                except (ValueError, TypeError):
                    pass

        return {
            "total_items": total,
            "expired_items": expired_count,
            "active_items": total - expired_count,
            "by_region": by_region,
            "by_tier": by_tier,
        }

    except Exception as e:
        return {
            "total_items": 0,
            "error": str(e),
        }


# ============================================================================
# Exports
# ============================================================================

__all__ = [
    # Feed cache
    "check_feed_cache",
    "save_feed_item",
    "batch_save_feed_items",
    "clean_expired_cache",
    # Policy briefs
    "save_paparan_report",
    "get_paparan_report",
    "list_paparan_reports",
    # Semantic search
    "semantic_search",
    "semantic_search_documents",
    "hybrid_search",
    # User memory
    "get_user_memory",
    "save_user_memory",
    "update_user_preferences",
    "clear_expired_memory",
    # Stats
    "get_feed_stats",
    # Models
    "CacheResult",
    "SaveResult",
    "SemanticSearchResult",
]
