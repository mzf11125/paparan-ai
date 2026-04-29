from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str
    TAVILY_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    DATABASE_URL: str
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_TRACING: bool = False
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5175,http://localhost:3000"

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

    # LLM provider — "anthropic" (default), "zai", "agentrouter", or "zhipu"
    LLM_PROVIDER: str = "anthropic"
    ZAI_API_KEY: str = ""
    ZAI_BASE_URL: str = "https://api.z.ai/v1"
    ZAI_MODEL: str = "z1-preview"

    # AgentRouter configuration
    AGENTROUTER_API_KEY: str = ""
    AGENTROUTER_BASE_URL: str = "https://agentrouter.org/"
    AGENTROUTER_MODEL: str = "claude-sonnet-4-5-20250929"

    # Zhipu AI GLM configuration
    ZHIPU_API_KEY: str = ""
    ZHIPU_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4/"
    ZHIPU_MODEL: str = "glm-5"

    # Email whitelist for access control (comma-separated string in .env)
    WHITELISTED_EMAILS: str = ""

    class Config:
        # Use absolute path to backend .env file
        env_file = Path(__file__).parent.parent / ".env"
        extra = "ignore"

settings = Settings()
