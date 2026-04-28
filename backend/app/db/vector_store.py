"""
PGVector store configuration and retrieval for Paparan AI.

Provides LangChain PGVector stores for:
- feed_items: Cached news and policy intelligence
- documents: User-uploaded documents for RAG
- sdi_indicators: Bappenas SDI metadata for semantic search
- paparan_briefs: Generated policy briefs

Each store has a configured retriever with as_retriever() for agent use.
"""

from __future__ import annotations

from typing import Optional, Any, Literal
from functools import lru_cache

from langchain_postgres import PGVector
from langchain_openai import OpenAIEmbeddings
from langchain_core.vectorstores import VectorStoreRetriever
from langchain_core.documents import Document
from pydantic import BaseModel, Field

from app.config import settings


# ============================================================================
# Configuration
# ============================================================================

# Embedding model configuration
# Uses Anthropic's Voyage embeddings by default
# Falls back to OpenAI embeddings if ANTHROPIC_API_KEY is not available
EMBEDDING_MODEL = settings.embedding_model  # "voyage-3"
EMBEDDING_DIMENSION = settings.embedding_dimension  # 1536

# Vector store configuration
COLLECTION_FEED_ITEMS = "feed_items"
COLLECTION_DOCUMENTS = "documents"
COLLECTION_SDI_INDICATORS = "sdi_indicators"
COLLECTION_PAPARAN_BRIEFS = "paparan_briefs"

# Default retrieval settings
DEFAULT_K_RESULTS = settings.default_k_results  # 5
SIMILARITY_THRESHOLD = settings.similarity_threshold  # 0.85


# ============================================================================
# Embedding Functions
# ============================================================================

def get_embeddings():
    """
    Get the configured embedding model.

    Returns:
        Embeddings instance for vector operations.
    """
    # Check for OpenAI API key first
    import os
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if openai_key and not openai_key.startswith("sk-dummy"):
        return OpenAIEmbeddings(model="text-embedding-3-small")

    # Log warning and return None - caller must handle this
    print("Warning: No valid OPENAI_API_KEY found. Vector operations will not work.")
    return None


# Global embeddings instance - initialized lazily
embeddings = None


# ============================================================================
# PGVector Stores
# ============================================================================

def create_vector_store(
    collection_name: str,
    embeddings_instance = None,
) -> PGVector:
    """
    Create a PGVector store for a collection.

    Args:
        collection_name: Name of the collection/table.
        embeddings_instance: Custom embeddings instance (uses default if None).

    Returns:
        Configured PGVector store, or None if embeddings not available.
    """
    emb = embeddings_instance or embeddings
    if emb is None:
        return None
    return PGVector(
        embeddings=emb,
        collection_name=collection_name,
        connection=settings.DATABASE_URL,
        use_jsonb=True,
    )


# Lazy-initialized stores - created on first access to avoid DB connection at startup
_feed_store: PGVector = None
_document_store: PGVector = None
_sdi_indicator_store: PGVector = None
_briefs_store: PGVector = None


def get_feed_store() -> PGVector:
    """Get or create the feed items store."""
    global _feed_store
    if _feed_store is None:
        try:
            _feed_store = create_vector_store(COLLECTION_FEED_ITEMS)
        except Exception as e:
            print(f"Warning: Could not initialize feed_store: {e}")
            _feed_store = None
    return _feed_store


def get_document_store() -> PGVector:
    """Get or create the documents store."""
    global _document_store
    if _document_store is None:
        try:
            _document_store = create_vector_store(COLLECTION_DOCUMENTS)
        except Exception as e:
            print(f"Warning: Could not initialize document_store: {e}")
            _document_store = None
    return _document_store


def get_sdi_indicator_store() -> PGVector:
    """Get or create the SDI indicators store."""
    global _sdi_indicator_store
    if _sdi_indicator_store is None:
        try:
            _sdi_indicator_store = create_vector_store(COLLECTION_SDI_INDICATORS)
        except Exception as e:
            print(f"Warning: Could not initialize sdi_indicator_store: {e}")
            _sdi_indicator_store = None
    return _sdi_indicator_store


def get_briefs_store() -> PGVector:
    """Get or create the briefs store."""
    global _briefs_store
    if _briefs_store is None:
        try:
            _briefs_store = create_vector_store(COLLECTION_PAPARAN_BRIEFS)
        except Exception as e:
            print(f"Warning: Could not initialize briefs_store: {e}")
            _briefs_store = None
    return _briefs_store


# Module-level accessors for backward compatibility
# These are callable functions that return the store
feed_store = get_feed_store
document_store = get_document_store
sdi_indicator_store = get_sdi_indicator_store
briefs_store = get_briefs_store


# ============================================================================
# Retrievers
# ============================================================================

def create_retriever(
    store: PGVector,
    search_type: Literal["similarity", "similarity_score_threshold", "mmr"] = "similarity",
    k: int = DEFAULT_K_RESULTS,
    score_threshold: Optional[float] = None,
    fetch_k: int = 20,
) -> VectorStoreRetriever:
    """
    Create a retriever from a vector store with configurable parameters.

    Args:
        store: The PGVector store.
        search_type: Type of search (similarity, similarity_score_threshold, mmr).
        k: Number of results to return.
        score_threshold: Minimum similarity score (for similarity_score_threshold).
        fetch_k: Number of docs to fetch for MMR (higher = more diverse).

    Returns:
        Configured VectorStoreRetriever.
    """
    search_kwargs = {"k": k}

    if search_type == "similarity_score_threshold":
        search_kwargs["score_threshold"] = score_threshold or SIMILARITY_THRESHOLD
    elif search_type == "mmr":
        search_kwargs["fetch_k"] = fetch_k

    return store.as_retriever(
        search_type=search_type,
        search_kwargs=search_kwargs,
    )


# Lazy retrievers - created on first access
_feed_retriever: VectorStoreRetriever = None
_document_retriever: VectorStoreRetriever = None
_sdi_retriever: VectorStoreRetriever = None
_briefs_retriever: VectorStoreRetriever = None


def get_feed_retriever() -> VectorStoreRetriever:
    """Get or create the feed items retriever."""
    global _feed_retriever
    if _feed_retriever is None:
        store = get_feed_store()
        if store:
            _feed_retriever = create_retriever(store, search_type="similarity", k=DEFAULT_K_RESULTS)
    return _feed_retriever


def get_document_retriever() -> VectorStoreRetriever:
    """Get or create the documents retriever."""
    global _document_retriever
    if _document_retriever is None:
        store = get_document_store()
        if store:
            _document_retriever = create_retriever(store, search_type="mmr", k=4, fetch_k=20)
    return _document_retriever


def get_sdi_retriever() -> VectorStoreRetriever:
    """Get or create the SDI retriever."""
    global _sdi_retriever
    if _sdi_retriever is None:
        store = get_sdi_indicator_store()
        if store:
            _sdi_retriever = create_retriever(store, search_type="similarity_score_threshold", k=10, score_threshold=0.75)
    return _sdi_retriever


def get_briefs_retriever() -> VectorStoreRetriever:
    """Get or create the briefs retriever."""
    global _briefs_retriever
    if _briefs_retriever is None:
        store = get_briefs_store()
        if store:
            _briefs_retriever = create_retriever(store, search_type="similarity", k=3)
    return _briefs_retriever


# Module-level accessors for backward compatibility
feed_retriever = get_feed_retriever
document_retriever = get_document_retriever
sdi_retriever = get_sdi_retriever
briefs_retriever = get_briefs_retriever


# ============================================================================
# Helper Functions
# ============================================================================

def add_feed_item(
    title: str,
    content: str,
    url: str,
    source: str,
    region: str,
    tier: str = "unknown",
    is_government: bool = False,
    item_id: str = "",
) -> str:
    """
    Add a feed item to the vector store.

    Args:
        title: Item title.
        content: Content to embed.
        url: Source URL.
        source: Source domain.
        region: Region code.
        tier: Source tier.
        is_government: Whether source is government.
        item_id: Optional item ID.

    Returns:
        Success message.
    """
    try:
        doc = Document(
            page_content=f"{title}\n\n{content}",
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
        return f"Added feed item: {url}"
    except Exception as e:
        return f"Failed to add feed item: {e}"


def add_document(
    content: str,
    user_id: str,
    file_name: str,
    document_id: str = "",
    metadata: dict | None = None,
) -> str:
    """
    Add a user document to the vector store.

    Args:
        content: Document text content.
        user_id: User ID.
        file_name: Original file name.
        document_id: Optional document ID.
        metadata: Additional metadata.

    Returns:
        Success message.
    """
    try:
        doc = Document(
            page_content=content,
            metadata={
                "user_id": user_id,
                "file_name": file_name,
                "document_id": document_id,
                "object_type": "Document",
                **(metadata or {}),
            },
        )
        document_store.add_documents([doc])
        return f"Added document: {file_name}"
    except Exception as e:
        return f"Failed to add document: {e}"


def add_sdi_indicator(
    indicator_text: str,
    kl_code: str,
    sector: str,
    user_id: str,
    indicator_id: str = "",
    metadata: dict | None = None,
) -> str:
    """
    Add an SDI indicator to the vector store.

    Args:
        indicator_text: Indicator description.
        kl_code: K/L code.
        sector: Sector code.
        user_id: User ID.
        indicator_id: Optional indicator ID.
        metadata: Additional metadata.

    Returns:
        Success message.
    """
    try:
        doc = Document(
            page_content=indicator_text,
            metadata={
                "kl_code": kl_code,
                "sector": sector,
                "user_id": user_id,
                "indicator_id": indicator_id,
                "object_type": "SDIIndicator",
                **(metadata or {}),
            },
        )
        sdi_indicator_store.add_documents([doc])
        return f"Added SDI indicator: {kl_code}"
    except Exception as e:
        return f"Failed to add SDI indicator: {e}"


def add_policy_brief(
    brief_text: str,
    topic: str,
    region: str,
    brief_id: str = "",
    metadata: dict | None = None,
) -> str:
    """
    Add a policy brief to the vector store.

    Args:
        brief_text: Brief content to embed.
        topic: Brief topic.
        region: Region.
        brief_id: Optional brief ID.
        metadata: Additional metadata.

    Returns:
        Success message.
    """
    try:
        doc = Document(
            page_content=brief_text,
            metadata={
                "topic": topic,
                "region": region,
                "brief_id": brief_id,
                "object_type": "PolicyBrief",
                **(metadata or {}),
            },
        )
        briefs_store.add_documents([doc])
        return f"Added policy brief: {topic}"
    except Exception as e:
        return f"Failed to add policy brief: {e}"


# ============================================================================
# Batch Operations
# ============================================================================

def batch_add_feed_items(items: list[dict]) -> dict:
    """
    Add multiple feed items in batch.

    Args:
        items: List of dicts with keys matching add_feed_item args.

    Returns:
        Summary with success/failure counts.
    """
    success_count = 0
    failure_count = 0

    for item in items:
        result = add_feed_item(
            title=item.get("title", ""),
            content=item.get("content", ""),
            url=item.get("url", ""),
            source=item.get("source", ""),
            region=item.get("region", ""),
            tier=item.get("tier", "unknown"),
            is_government=item.get("is_government", False),
            item_id=item.get("item_id", ""),
        )
        if "Failed" in result:
            failure_count += 1
        else:
            success_count += 1

    return {
        "total": len(items),
        "success": success_count,
        "failed": failure_count,
    }


def batch_add_documents(
    documents: list[dict],
    user_id: str,
) -> dict:
    """
    Add multiple documents in batch.

    Args:
        documents: List of dicts with content, file_name, etc.
        user_id: User ID for all documents.

    Returns:
        Summary with success/failure counts.
    """
    success_count = 0
    failure_count = 0

    for doc in documents:
        result = add_document(
            content=doc.get("content", ""),
            user_id=user_id,
            file_name=doc.get("file_name", ""),
            document_id=doc.get("document_id", ""),
            metadata=doc.get("metadata"),
        )
        if "Failed" in result:
            failure_count += 1
        else:
            success_count += 1

    return {
        "total": len(documents),
        "success": success_count,
        "failed": failure_count,
    }


# ============================================================================
# Search Functions
# ============================================================================

def search_feed_items(
    query: str,
    k: int = DEFAULT_K_RESULTS,
    filter_dict: dict | None = None,
) -> list[tuple[Document, float]]:
    """
    Search feed items by similarity.

    Args:
        query: Search query.
        k: Number of results.
        filter_dict: Optional metadata filters.

    Returns:
        List of (Document, score) tuples.
    """
    return feed_store.similarity_search_with_score(
        query,
        k=k,
        filter=filter_dict,
    )


def search_documents(
    query: str,
    k: int = 4,
    user_id: str = "",
) -> list[tuple[Document, float]]:
    """
    Search user documents by similarity.

    Args:
        query: Search query.
        k: Number of results.
        user_id: Optional user ID filter.

    Returns:
        List of (Document, score) tuples.
    """
    filter_dict = {"user_id": user_id} if user_id else None
    return document_store.similarity_search_with_score(
        query,
        k=k,
        filter=filter_dict,
    )


def search_sdi_indicators(
    query: str,
    k: int = 10,
    filter_dict: dict | None = None,
) -> list[tuple[Document, float]]:
    """
    Search SDI indicators by similarity.

    Args:
        query: Search query.
        k: Number of results.
        filter_dict: Optional metadata filters.

    Returns:
        List of (Document, score) tuples.
    """
    return sdi_indicator_store.similarity_search_with_score(
        query,
        k=k,
        filter=filter_dict,
    )


def search_policy_briefs(
    query: str,
    k: int = 3,
    region: str = "",
) -> list[tuple[Document, float]]:
    """
    Search policy briefs by similarity.

    Args:
        query: Search query.
        k: Number of results.
        region: Optional region filter.

    Returns:
        List of (Document, score) tuples.
    """
    filter_dict = {"region": region} if region else None
    return briefs_store.similarity_search_with_score(
        query,
        k=k,
        filter=filter_dict,
    )


# ============================================================================
# Deletion Functions
# ============================================================================

def delete_feed_items(filter_dict: dict) -> int:
    """
    Delete feed items matching metadata filter.

    Args:
        filter_dict: Metadata filter dict.

    Returns:
        Number of items deleted.
    """
    return feed_store.delete(filter_dict)


def delete_documents(user_id: str = "", document_id: str = "") -> int:
    """
    Delete documents matching filter.

    Args:
        user_id: Optional user ID filter.
        document_id: Optional specific document ID.

    Returns:
        Number of documents deleted.
    """
    filter_dict = {}
    if user_id:
        filter_dict["user_id"] = user_id
    if document_id:
        filter_dict["document_id"] = document_id
    return document_store.delete(filter_dict if filter_dict else None)


def delete_sdi_indicators(user_id: str = "", indicator_id: str = "") -> int:
    """
    Delete SDI indicators matching filter.

    Args:
        user_id: Optional user ID filter.
        indicator_id: Optional specific indicator ID.

    Returns:
        Number of indicators deleted.
    """
    filter_dict = {}
    if user_id:
        filter_dict["user_id"] = user_id
    if indicator_id:
        filter_dict["indicator_id"] = indicator_id
    return sdi_indicator_store.delete(filter_dict if filter_dict else None)


# ============================================================================
# Store Statistics
# ============================================================================

def get_store_stats(collection_name: str) -> dict:
    """
    Get statistics for a vector store collection.

    Args:
        collection_name: Name of the collection.

    Returns:
        Stats dict with count, dimension info.
    """
    try:
        stores = {
            COLLECTION_FEED_ITEMS: feed_store,
            COLLECTION_DOCUMENTS: document_store,
            COLLECTION_SDI_INDICATORS: sdi_indicator_store,
            COLLECTION_PAPARAN_BRIEFS: briefs_store,
        }

        store = stores.get(collection_name)
        if not store:
            return {"error": f"Unknown collection: {collection_name}"}

        # Get connection and query count
        # Note: PGVector doesn't expose a direct count method
        # This would require direct SQL query
        return {
            "collection": collection_name,
            "embedding_model": EMBEDDING_MODEL,
            "embedding_dimension": EMBEDDING_DIMENSION,
        }

    except Exception as e:
        return {"error": str(e)}


# ============================================================================
# Cached Retrievers (for performance)
# ============================================================================

@lru_cache(maxsize=32)
def get_cached_retriever(
    collection: str,
    search_type: str = "similarity",
    k: int = DEFAULT_K_RESULTS,
) -> VectorStoreRetriever:
    """
    Get a cached retriever configuration.

    Args:
        collection: Collection name.
        search_type: Search type.
        k: Number of results.

    Returns:
        Cached VectorStoreRetriever.
    """
    stores = {
        COLLECTION_FEED_ITEMS: feed_store,
        COLLECTION_DOCUMENTS: document_store,
        COLLECTION_SDI_INDICATORS: sdi_indicator_store,
        COLLECTION_PAPARAN_BRIEFS: briefs_store,
    }

    store = stores.get(collection)
    if not store:
        raise ValueError(f"Unknown collection: {collection}")

    return create_retriever(store, search_type=search_type, k=k)


# ============================================================================
# Exports
# ============================================================================

__all__ = [
    # Stores
    "feed_store",
    "document_store",
    "sdi_indicator_store",
    "briefs_store",
    # Retrievers
    "feed_retriever",
    "document_retriever",
    "sdi_retriever",
    "briefs_retriever",
    # Creation
    "create_vector_store",
    "create_retriever",
    "get_embeddings",
    # Add functions
    "add_feed_item",
    "add_document",
    "add_sdi_indicator",
    "add_policy_brief",
    # Batch functions
    "batch_add_feed_items",
    "batch_add_documents",
    # Search functions
    "search_feed_items",
    "search_documents",
    "search_sdi_indicators",
    "search_policy_briefs",
    # Delete functions
    "delete_feed_items",
    "delete_documents",
    "delete_sdi_indicators",
    # Stats
    "get_store_stats",
    "get_cached_retriever",
    # Constants
    "COLLECTION_FEED_ITEMS",
    "COLLECTION_DOCUMENTS",
    "COLLECTION_SDI_INDICATORS",
    "COLLECTION_PAPARAN_BRIEFS",
    "EMBEDDING_MODEL",
    "EMBEDDING_DIMENSION",
    "DEFAULT_K_RESULTS",
    "SIMILARITY_THRESHOLD",
]
