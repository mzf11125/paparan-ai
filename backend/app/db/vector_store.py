from langchain_postgres import PGVector
from langchain_anthropic import AnthropicEmbeddings
from langchain_core.vectorstores import VectorStoreRetriever
from app.config import settings

embeddings = AnthropicEmbeddings(model="voyage-3")

feed_store = PGVector(
    embeddings=embeddings,
    collection_name="feed_items",
    connection=settings.DATABASE_URL,
)

document_store = PGVector(
    embeddings=embeddings,
    collection_name="documents",
    connection=settings.DATABASE_URL,
)

feed_retriever: VectorStoreRetriever = feed_store.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5},
)

document_retriever: VectorStoreRetriever = document_store.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 4, "fetch_k": 20},
)
