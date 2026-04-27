"""LLM factory — returns the configured model for all agents.

Set LLM_PROVIDER=zai and ZAI_API_KEY in .env to use z.ai instead of Claude.
z.ai is OpenAI-compatible, so it uses the openai provider with a custom base_url.
"""
from langchain.chat_models import init_chat_model
from app.config import settings

# DeepAgents model string — used by create_deep_agent(model=...)
# Format: "provider:model-name"
def get_agent_model() -> str:
    if settings.LLM_PROVIDER == "zai":
        return f"openai:{settings.ZAI_MODEL}"
    return "anthropic:claude-opus-4-5"


# LangChain chat model — used by researcher, metadata_extractor, rpjmn_tools
def get_chat_model():
    if settings.LLM_PROVIDER == "zai":
        if not settings.ZAI_API_KEY:
            raise ValueError("ZAI_API_KEY is required when LLM_PROVIDER=zai")
        return init_chat_model(
            settings.ZAI_MODEL,
            model_provider="openai",
            base_url=settings.ZAI_BASE_URL,
            api_key=settings.ZAI_API_KEY,
        )
    return init_chat_model("claude-opus-4-5", model_provider="anthropic")


# DeepAgents kwargs — extra kwargs passed to create_deep_agent when using z.ai
def get_agent_kwargs() -> dict:
    if settings.LLM_PROVIDER == "zai":
        return {
            "model_kwargs": {
                "base_url": settings.ZAI_BASE_URL,
                "api_key": settings.ZAI_API_KEY,
            }
        }
    return {}
