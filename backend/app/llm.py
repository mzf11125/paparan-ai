"""LLM factory — returns the configured model for all agents.

Primary LLM Provider: Z.AI (GLM-5.1)
Set LLM_PROVIDER=zai and ZAI_API_KEY in .env to use Z.AI GLM models.

Available providers:
- zai: Z.AI GLM models (glm-5.1, glm-5, glm-4.7, etc.) - DEFAULT
- anthropic: Anthropic Claude models (fallback)
- agentrouter: AgentRouter (Claude-compatible)
- zhipu: Zhipu AI GLM (legacy JWT-based, same as zai)

Z.AI uses OpenAI-compatible API with GLM models.
Supports thinking mode for chain-of-thought reasoning.
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


def create_zai_model(
    model: str,
    base_url: str,
    api_key: str,
    max_tokens: int = None,
    temperature: float = None,
    enable_thinking: bool = False,
) -> ChatOpenAI:
    """Create a ChatOpenAI instance configured for Z.AI GLM models.

    Z.AI uses OpenAI-compatible API with support for:
    - Thinking mode (chain-of-thought)
    - Large context windows (up to 131K tokens for glm-5.1)
    - Streaming responses

    Args:
        model: GLM model name (glm-5.1, glm-5, glm-4.7, etc.)
        base_url: Z.AI API base URL
        api_key: Z.AI API key
        max_tokens: Maximum output tokens (default: model-dependent)
        temperature: Sampling temperature (default: 0.7)
        enable_thinking: Enable chain-of-thought reasoning (default: False)

    Returns:
        Configured ChatOpenAI instance for Z.AI
    """
    # Set default max_tokens based on model if not specified
    if max_tokens is None:
        if model.startswith("glm-5.1"):
            max_tokens = 131072
        elif model.startswith("glm-5"):
            max_tokens = 65536
        elif model.startswith("glm-4.7") or model.startswith("glm-4.6"):
            max_tokens = 65536
        else:
            max_tokens = 16384

    # Set default temperature
    if temperature is None:
        temperature = 0.7

    # Build kwargs for thinking mode and other Z.AI specific parameters
    kwargs = {
        "model": model,
        "base_url": base_url,
        "api_key": api_key,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    # Add thinking mode if enabled (Z.AI specific parameter)
    if enable_thinking:
        # Pass thinking as extra_body or model_kwargs
        kwargs["extra_body"] = {
            "thinking": {"type": "enabled"}
        }

    return ChatOpenAI(**kwargs)


# DeepAgents model — returns either a string or BaseChatModel instance
# Used by create_deep_agent(model=get_agent_model())
def get_agent_model():
    """Get the configured LLM model for DeepAgents.

    Returns:
        str or BaseChatModel: Model identifier or configured model instance

    Raises:
        ValueError: If required API key is missing for the selected provider
    """
    if settings.LLM_PROVIDER == "zai":
        if not settings.ZAI_API_KEY:
            raise ValueError("ZAI_API_KEY is required when LLM_PROVIDER=zai")
        return create_zai_model(
            model=settings.ZAI_MODEL,
            base_url=settings.ZAI_BASE_URL,
            api_key=settings.ZAI_API_KEY,
            max_tokens=settings.ZAI_MAX_TOKENS,
            temperature=settings.ZAI_TEMPERATURE,
            enable_thinking=settings.ZAI_ENABLE_THINKING,
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

    # Default: return string for Anthropic (fallback)
    return "anthropic:claude-opus-4-5"


# LangChain chat model — used by researcher, metadata_extractor, rpjmn_tools
def get_chat_model(
    max_tokens: int = None,
    temperature: float = None,
    enable_thinking: bool = None,
):
    """Get the configured chat model for direct LLM calls.

    Args:
        max_tokens: Override default max_tokens
        temperature: Override default temperature
        enable_thinking: Override thinking mode setting

    Returns:
        BaseChatModel: Configured chat model instance

    Raises:
        ValueError: If required API key is missing for the selected provider
    """
    # Use settings defaults if not overridden
    if settings.LLM_PROVIDER == "zai":
        if not settings.ZAI_API_KEY:
            raise ValueError("ZAI_API_KEY is required when LLM_PROVIDER=zai")

        return create_zai_model(
            model=settings.ZAI_MODEL,
            base_url=settings.ZAI_BASE_URL,
            api_key=settings.ZAI_API_KEY,
            max_tokens=max_tokens or settings.ZAI_MAX_TOKENS,
            temperature=temperature or settings.ZAI_TEMPERATURE,
            enable_thinking=enable_thinking if enable_thinking is not None else settings.ZAI_ENABLE_THINKING,
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

    # Fallback to Anthropic
    return init_chat_model("claude-opus-4-5", model_provider="anthropic")


# DeepAgents kwargs — no longer needed, kept for backwards compatibility
def get_agent_kwargs() -> dict:
    return {}


# Convenience function for creating a model with specific settings
def create_model_with_options(
    model: str = None,
    provider: str = None,
    max_tokens: int = None,
    temperature: float = None,
    enable_thinking: bool = None,
) -> ChatOpenAI:
    """Create a model instance with custom options.

    Args:
        model: Model name (defaults to configured model)
        provider: Provider override (zai, anthropic, zhipu, agentrouter)
        max_tokens: Max output tokens
        temperature: Sampling temperature
        enable_thinking: Enable thinking mode

    Returns:
        Configured ChatOpenAI instance
    """
    # Use defaults from settings if not specified
    model = model or settings.ZAI_MODEL
    provider = provider or settings.LLM_PROVIDER
    max_tokens = max_tokens or settings.ZAI_MAX_TOKENS
    temperature = temperature or settings.ZAI_TEMPERATURE
    enable_thinking = enable_thinking if enable_thinking is not None else settings.ZAI_ENABLE_THINKING

    if provider == "zai":
        if not settings.ZAI_API_KEY:
            raise ValueError("ZAI_API_KEY is required for provider=zai")
        return create_zai_model(
            model=model,
            base_url=settings.ZAI_BASE_URL,
            api_key=settings.ZAI_API_KEY,
            max_tokens=max_tokens,
            temperature=temperature,
            enable_thinking=enable_thinking,
        )

    # For other providers, use get_chat_model
    original_provider = settings.LLM_PROVIDER
    settings.LLM_PROVIDER = provider
    try:
        return get_chat_model(
            max_tokens=max_tokens,
            temperature=temperature,
            enable_thinking=enable_thinking,
        )
    finally:
        settings.LLM_PROVIDER = original_provider
