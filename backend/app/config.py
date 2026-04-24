from pydantic_settings import BaseSettings

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

    class Config:
        env_file = ".env"

settings = Settings()
