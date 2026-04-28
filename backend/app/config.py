"""Application configuration with environment variables and source tier config."""
import os
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Anthropic / Claude
    ANTHROPIC_API_KEY: str
    anthropic_model: str = "claude-sonnet-4-20250514"

    # Tavily Search
    TAVILY_API_KEY: str
    tavily_max_results: int = 10

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    DATABASE_URL: str  # postgresql+psycopg://... for PGVector

    # LangSmith
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_TRACING: bool = False
    LANGSMITH_PROJECT: str = "paparan-ai"

    # Application
    app_name: str = "Paparan AI"
    app_version: str = "0.1.0"
    FRONTEND_URL: str = "http://localhost:5173"
    api_port: int = 8000

    # Source tiers
    PRIMARY_SOURCES: list[str] = [
        "parliament.gov.my", "parliament.gov.sg", "dpr.go.id",
        "bi.go.id", "asean.org", "worldbank.org", "imf.org",
        "congress.gov.ph", "senate.gov.ph", "quochoi.vn",
        "parliament.go.th", "agc.gov.sg",
    ]
    TIER1_SOURCES: list[str] = ["reuters.com", "apnews.com", "bloomberg.com", "ft.com"]
    INDONESIA_SOURCES: list[str] = ["antaranews.com", "kontan.co.id", "bisnis.com", "ojk.go.id"]
    ISLAMIC_WEB3_SOURCES: list[str] = ["salaamgateway.com", "coindesk.com", "theblock.co"]

    # Bappenas / SDI Configuration
    BAPPENAS_API_URL: str = "https://satudata.go.id/api/v1"
    DATA_GO_ID_URL: str = "https://satudata.go.id"
    SDI_REFERENCE_URL: str = "https://satudata.go.id/dokumen"

    # Consistency checking thresholds
    SIMILARITY_THRESHOLD: float = 0.85
    CONSISTENCY_CHECK_BATCH_SIZE: int = 50

    # Document processing
    MAX_FILE_SIZE_MB: int = 50
    MAX_EXTRACT_LENGTH: int = 50000
    SUPPORTED_FILE_EXTENSIONS: list[str] = [".pdf", ".txt", ".md", ".markdown"]

    # Extraction agent configuration
    EXTRACTION_MODEL: str = "claude-opus-4-5"
    EXTRACTION_MAX_TOKENS: int = 128000
    EXTRACTION_TIMEOUT_SECONDS: int = 60

    # Job processing
    JOB_PROCESSING_TIMEOUT: int = 300
    JOB_RETRY_ATTEMPTS: int = 3
    JOB_RETRY_DELAY_SECONDS: int = 5

    # Bellingcat / OSINT
    FIRMS_MAP_KEY: str = ""
    ACLED_API_KEY: str = ""
    ACLED_EMAIL: str = ""

    # LLM provider — "anthropic" (default) or "zai"
    LLM_PROVIDER: str = "anthropic"
    ZAI_API_KEY: str = ""
    ZAI_BASE_URL: str = "https://api.z.ai/v1"
    ZAI_MODEL: str = "z1-preview"

    # Scraping
    scrape_interval_hours: int = 24
    feed_cache_expiry_hours: int = 24
    max_concurrent_requests: int = 5

    # Embeddings
    embedding_model: str = "voyage-3"
    embedding_dimension: int = 1536

    # Text Splitting
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Retrieval
    default_k_results: int = 5
    similarity_threshold: float = 0.85

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Regional configurations
ASEAN_COUNTRIES: List[str] = [
    "Indonesia",
    "Malaysia",
    "Singapore",
    "Thailand",
    "Philippines",
    "Vietnam",
    "Brunei",
    "Laos",
    "Myanmar",
    "Cambodia",
]

REGION_MAPPING: dict[str, str] = {
    "ID": "Indonesia",
    "MY": "Malaysia",
    "SG": "Singapore",
    "TH": "Thailand",
    "PH": "Philippines",
    "VN": "Vietnam",
    "BN": "Brunei",
    "LA": "Laos",
    "MM": "Myanmar",
    "KH": "Cambodia",
}


# Topic categories for classification
TOPIC_CATEGORIES: List[str] = [
    "Trade Policy",
    "Digital Economy",
    "Financial Regulation",
    "Infrastructure",
    "Energy",
    "Environment",
    "Geopolitics",
    "Islamic Finance",
    "Web3 & Crypto",
    "Central Bank Policy",
    "Fiscal Policy",
    "Labor & Employment",
]


def get_source_tier(source: str, settings: Settings = None) -> str:
    """Determine the tier of a news source."""
    if settings is None:
        settings = get_settings()
    if source in settings.PRIMARY_SOURCES:
        return "primary"
    elif source in settings.TIER1_SOURCES:
        return "tier1"
    elif source in settings.INDONESIA_SOURCES:
        return "indonesia"
    elif source in settings.ISLAMIC_WEB3_SOURCES:
        return "islamic_web3"
    return "unknown"


def get_tavily_topic_for_source(source: str, settings: Settings = None) -> str:
    """Map source tier to Tavily search topic."""
    tier = get_source_tier(source, settings)
    topic_mapping = {
        "primary": "general",
        "tier1": "news",
        "indonesia": "news",
        "islamic_web3": "finance",
    }
    return topic_mapping.get(tier, "general")


def is_government_source(source: str, settings: Settings = None) -> bool:
    """Check if source is a government/official source."""
    return get_source_tier(source, settings) == "primary"


def get_all_sources(settings: Settings = None) -> List[str]:
    """Get all configured sources."""
    if settings is None:
        settings = get_settings()
    return (
        settings.PRIMARY_SOURCES
        + settings.TIER1_SOURCES
        + settings.INDONESIA_SOURCES
        + settings.ISLAMIC_WEB3_SOURCES
    )


# Settings instance for easy import
settings = get_settings()
