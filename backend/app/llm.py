"""LLM factory — returns the configured model for all agents.

Set LLM_PROVIDER=zai and ZAI_API_KEY in .env to use z.ai instead of Claude.
Set LLM_PROVIDER=agentrouter and AGENTROUTER_API_KEY in .env to use AgentRouter.
Set LLM_PROVIDER=zhipu and ZHIPU_API_KEY in .env to use Zhipu AI GLM.
z.ai is OpenAI-compatible, so it uses the openai provider with a custom base_url.
AgentRouter is Claude-compatible, so it uses the anthropic provider with a custom base_url.
Zhipu AI is OpenAI-compatible but requires JWT token generation from API key.

For DeepAgents (create_deep_agent), the model parameter can be:
- A string like "anthropic:claude-opus-4-5" (for default Anthropic)
- A configured BaseChatModel instance (for custom providers like zai/agentrouter/zhipu)
"""
import time
import jwt
import httpx
from langchain.chat_models import init_chat_model
from langchain_openai import ChatOpenAI
from app.config import settings


def generate_zhipu_token(api_key: str) -> str:
    """Generate JWT token for Zhipu AI API authentication.

    Zhipu AI uses API key format: id.secret
    The token is generated using HS256 algorithm with the secret.
    """
    try:
        api_key_id, api_key_secret = api_key.split(".")
    except ValueError:
        raise ValueError(
            "Invalid ZHIPU_API_KEY format. Expected 'id.secret' format. "
            "Your key appears to be in a different format."
        )

    # Generate JWT token with 1 hour expiration
    payload = {
        "api_key": api_key_id,
        "exp": int(time.time() * 1000) + 3600 * 1000,
        "timestamp": int(time.time() * 1000),
    }

    token = jwt.encode(
        payload,
        api_key_secret,
        algorithm="HS256",
        headers={"alg": "HS256", "sign_type": "SIGN"},
    )

    return token


class ZhipuAuthTransport(httpx.HTTPTransport):
    """Custom HTTP transport that injects Zhipu JWT token into requests."""

    def __init__(self, api_key: str, **kwargs):
        super().__init__(**kwargs)
        self.api_key = api_key
        self._token = None
        self._token_expiry = 0

    def get_token(self) -> str:
        """Get current token, generating a new one if expired."""
        now = time.time()
        if self._token is None or now > self._token_expiry:
            self._token = generate_zhipu_token(self.api_key)
            # Set expiry to 50 minutes to refresh before actual expiry (1 hour)
            self._token_expiry = now + 3000  # 50 minutes
        return self._token

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        """Inject Authorization header with JWT token."""
        # Set Authorization header with Bearer token
        token = self.get_token()
        request.headers["Authorization"] = f"Bearer {token}"
        return super().handle_request(request)


def create_zhipu_model(model: str, base_url: str, api_key: str) -> ChatOpenAI:
    """Create a ChatOpenAI instance configured for Zhipu AI GLM.

    Uses custom HTTP transport to inject JWT token for authentication.
    """
    # Create custom HTTP client with Zhipu auth
    transport = ZhipuAuthTransport(api_key)
    http_client = httpx.Client(transport=transport)

    return ChatOpenAI(
        model=model,
        base_url=base_url,
        api_key="dummy",  # Not used, auth is via JWT token
        http_client=http_client,
    )

# DeepAgents model — returns either a string or BaseChatModel instance
# Used by create_deep_agent(model=get_agent_model())
def get_agent_model():
    if settings.LLM_PROVIDER == "zai":
        if not settings.ZAI_API_KEY:
            raise ValueError("ZAI_API_KEY is required when LLM_PROVIDER=zai")
        return init_chat_model(
            settings.ZAI_MODEL,
            model_provider="openai",
            base_url=settings.ZAI_BASE_URL,
            api_key=settings.ZAI_API_KEY,
        )
    if settings.LLM_PROVIDER == "agentrouter":
        if not settings.AGENTROUTER_API_KEY:
            raise ValueError("AGENTROUTER_API_KEY is required when LLM_PROVIDER=agentrouter")
        return init_chat_model(
            settings.AGENTROUTER_MODEL,
            model_provider="anthropic",
            base_url=settings.AGENTROUTER_BASE_URL,
            api_key=settings.AGENTROUTER_API_KEY,
        )
    if settings.LLM_PROVIDER == "zhipu":
        if not settings.ZHIPU_API_KEY:
            raise ValueError("ZHIPU_API_KEY is required when LLM_PROVIDER=zhipu")
        return create_zhipu_model(
            model=settings.ZHIPU_MODEL,
            base_url=settings.ZHIPU_BASE_URL,
            api_key=settings.ZHIPU_API_KEY,
        )
    # Default: return string for Anthropic
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
    if settings.LLM_PROVIDER == "agentrouter":
        if not settings.AGENTROUTER_API_KEY:
            raise ValueError("AGENTROUTER_API_KEY is required when LLM_PROVIDER=agentrouter")
        return init_chat_model(
            settings.AGENTROUTER_MODEL,
            model_provider="anthropic",
            base_url=settings.AGENTROUTER_BASE_URL,
            api_key=settings.AGENTROUTER_API_KEY,
        )
    if settings.LLM_PROVIDER == "zhipu":
        if not settings.ZHIPU_API_KEY:
            raise ValueError("ZHIPU_API_KEY is required when LLM_PROVIDER=zhipu")
        return create_zhipu_model(
            model=settings.ZHIPU_MODEL,
            base_url=settings.ZHIPU_BASE_URL,
            api_key=settings.ZHIPU_API_KEY,
        )
    return init_chat_model("claude-opus-4-5", model_provider="anthropic")


# DeepAgents kwargs — no longer needed, kept for backwards compatibility
def get_agent_kwargs() -> dict:
    return {}
