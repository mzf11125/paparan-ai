from langchain_postgres import PGVector
from langchain_openai import OpenAIEmbeddings
from langchain_core.vectorstores import VectorStoreRetriever
from app.config import settings
from functools import lru_cache

# Lazy initialization of embeddings to avoid startup issues
@lru_cache
def get_embeddings():
    """Get embeddings instance, initialized on first use."""
    return OpenAIEmbeddings(model="text-embedding-3-small")

# Lazy initialization of vector stores
def get_feed_store():
    """Get feed store, initialized on first use."""
    return PGVector(
        embeddings=get_embeddings(),
        collection_name="feed_items",
        connection=settings.DATABASE_URL,
    )

def get_document_store():
    """Get document store, initialized on first use."""
    return PGVector(
        embeddings=get_embeddings(),
        collection_name="documents",
        connection=settings.DATABASE_URL,
    )

def get_sdi_indicator_store():
    """Get SDI indicator store, initialized on first use."""
    return PGVector(
        embeddings=get_embeddings(),
        collection_name="sdi_indicators",
        connection=settings.DATABASE_URL,
    )

# Backwards compatibility aliases
embeddings = None  # Will be initialized on first use via get_embeddings()
feed_store = None
document_store = None
sdi_indicator_store = None
feed_retriever = None
document_retriever = None
sdi_retriever = None

def _initialize_stores():
    """Initialize all stores on first access."""
    global embeddings, feed_store, document_store, sdi_indicator_store
    global feed_retriever, document_retriever, sdi_retriever

    if embeddings is None:
        embeddings = get_embeddings()
        feed_store = get_feed_store()
        document_store = get_document_store()
        sdi_indicator_store = get_sdi_indicator_store()
        feed_retriever = feed_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5},
        )
        document_retriever = document_store.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 4, "fetch_k": 20},
        )
        sdi_retriever = sdi_indicator_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 10},
        )
    return embeddings, feed_store, document_store, sdi_indicator_store
