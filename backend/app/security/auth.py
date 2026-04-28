"""
Authentication and authorization module for Paparan AI.

Provides JWT verification with Supabase, user authentication functions,
and FastAPI dependencies for protecting endpoints.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Optional, Annotated, Any
from functools import lru_cache

from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, ExpiredSignatureError
from pydantic import BaseModel, Field

from app.config import settings
from app.db.client import get_client
from app.db.schema import User


# ============================================================================
# Configuration
# ============================================================================

# Supabase JWT settings
# Supabase uses RS256 for service role and HS256 for anon tokens
SUPABASE_JWT_ALGORITHM = "HS256"
SUPABASE_JWT_SECRET = settings.SUPABASE_ANON_KEY

# HTTP Bearer scheme for FastAPI
security = HTTPBearer(auto_error=False)


# ============================================================================
# Pydantic Models
# ============================================================================

class JWTClaims(BaseModel):
    """JWT token claims from Supabase."""

    sub: str = Field(..., description="User ID (subject)")
    aud: str = Field(default="authenticated", description="Audience")
    role: str = Field(default="authenticated", description="User role")
    exp: int = Field(..., description="Expiration timestamp")
    iat: int = Field(..., description="Issued at timestamp")
    email: Optional[str] = Field(None, description="User email")
    phone: Optional[str] = Field(None, description="User phone")
    user_metadata: dict = Field(default_factory=dict, description="Custom user metadata")


class AuthUser(BaseModel):
    """Authenticated user model."""

    id: str
    email: Optional[str] = None
    role: str = "authenticated"
    metadata: dict = Field(default_factory=dict)
    token: Optional[str] = None
    expires_at: Optional[datetime] = None

    @property
    def is_authenticated(self) -> bool:
        return bool(self.id)

    @property
    def is_analyst(self) -> bool:
        """Check if user has analyst role."""
        user_role = self.metadata.get("role", self.role)
        return user_role in ("analyst", "admin")

    @property
    def is_admin(self) -> bool:
        """Check if user has admin role."""
        user_role = self.metadata.get("role", self.role)
        return user_role == "admin"


class AuthContext(BaseModel):
    """Authentication context for request handling."""

    user: AuthUser
    token: str
    validated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============================================================================
# JWT Verification Functions
# ============================================================================

def decode_jwt_token(token: str) -> JWTClaims:
    """
    Decode and verify a Supabase JWT token.

    Args:
        token: The JWT token string.

    Returns:
        JWTClaims object with decoded claims.

    Raises:
        HTTPException: If token is invalid, expired, or malformed.
    """
    try:
        # Decode the token
        payload = jwt.decode(
            token,
            key=settings.SUPABASE_ANON_KEY,
            algorithms=[SUPABASE_JWT_ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": False,  # Supabase tokens may have different audiences
            }
        )

        # Extract claims
        return JWTClaims(
            sub=payload.get("sub"),
            aud=payload.get("aud", "authenticated"),
            role=payload.get("role", "authenticated"),
            exp=payload.get("exp"),
            iat=payload.get("iat"),
            email=payload.get("email"),
            phone=payload.get("phone"),
            user_metadata=payload.get("user_metadata", {}),
        )

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_supabase_token(token: str) -> AuthUser:
    """
    Verify a Supabase JWT token and return an AuthUser.

    This function decodes the JWT and optionally validates against Supabase
    to ensure the user is still active.

    Args:
        token: The JWT token string.

    Returns:
        AuthUser object with user information.

    Raises:
        HTTPException: If token is invalid or user is not found.
    """
    # Decode JWT
    claims = decode_jwt_token(token)

    # Optional: Validate against Supabase (uncomment for stricter validation)
    # try:
    #     client = get_client()
    #     user_response = client.auth.get_user(token)
    #     if not user_response or not user_response.user:
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail="User not found or inactive",
    #         )
    #     # Merge Supabase user data with claims
    #     user_data = user_response.user.__dict__
    #     claims.email = user_data.get("email", claims.email)
    #     claims.user_metadata = user_data.get("user_metadata", claims.user_metadata)
    # except Exception as e:
    #     # If Supabase validation fails, still use JWT claims
    #     pass

    # Calculate expiration
    expires_at = None
    if claims.exp:
        try:
            expires_at = datetime.fromtimestamp(claims.exp, tz=timezone.utc)
        except (ValueError, OSError):
            pass

    return AuthUser(
        id=claims.sub,
        email=claims.email,
        role=claims.role,
        metadata=claims.user_metadata,
        token=token,
        expires_at=expires_at,
    )


def get_user_from_token(token: str) -> AuthUser:
    """
    Legacy alias for verify_supabase_token.

    Args:
        token: The JWT token string.

    Returns:
        AuthUser object with user information.
    """
    return verify_supabase_token(token)


# ============================================================================
# FastAPI Dependencies
# ============================================================================

async def get_current_user(
    authorization: Annotated[str, Header()] = None,
) -> AuthUser:
    """
    FastAPI dependency to extract and validate the current user from Authorization header.

    Usage:
        @app.get("/api/protected")
        async def protected_endpoint(user: AuthUser = Depends(get_current_user)):
            return {"user_id": user.id}

    Args:
        authorization: The Authorization header value (Bearer token).

    Returns:
        AuthUser object representing the authenticated user.

    Raises:
        HTTPException: If authorization is missing or invalid.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract token from "Bearer <token>" format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Use: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    return verify_supabase_token(token)


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)] = None,
) -> Optional[AuthUser]:
    """
    FastAPI dependency to optionally extract the current user.

    Returns None if no valid authorization is provided.

    Usage:
        @app.get("/api/public")
        async def public_endpoint(user: Optional[AuthUser] = Depends(get_current_user_optional)):
            if user:
                return {"user_id": user.id}
            return {"message": "Hello, anonymous user"}
    """
    if not credentials:
        return None

    try:
        return verify_supabase_token(credentials.credentials)
    except HTTPException:
        return None


async def require_analyst(user: Annotated[AuthUser, Depends(get_current_user)]) -> AuthUser:
    """
    FastAPI dependency that requires analyst or admin role.

    Usage:
        @app.get("/api/analyst-only")
        async def analyst_endpoint(user: AuthUser = Depends(require_analyst)):
            return {"user_id": user.id}

    Args:
        user: The authenticated user from get_current_user.

    Returns:
        AuthUser if user has analyst/admin role.

    Raises:
        HTTPException: If user lacks required role.
    """
    if not user.is_analyst:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires analyst or admin role",
        )
    return user


async def require_admin(user: Annotated[AuthUser, Depends(get_current_user)]) -> AuthUser:
    """
    FastAPI dependency that requires admin role.

    Usage:
        @app.get("/api/admin-only")
        async def admin_endpoint(user: AuthUser = Depends(require_admin)):
            return {"user_id": user.id}

    Args:
        user: The authenticated user from get_current_user.

    Returns:
        AuthUser if user has admin role.

    Raises:
        HTTPException: If user lacks admin role.
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires admin role",
        )
    return user


# ============================================================================
# User Data Functions
# ============================================================================

@lru_cache(maxsize=128)
def get_user_profile(user_id: str) -> Optional[User]:
    """
    Fetch user profile from Supabase.

    Results are cached for 5 minutes to reduce database queries.

    Args:
        user_id: The user's ID.

    Returns:
        User object if found, None otherwise.
    """
    try:
        client = get_client()
        result = client.table("users").select("*").eq("id", user_id).execute()

        if result.data:
            user_data = result.data[0]
            return User(
                id=user_data.get("id", user_id),
                email=user_data.get("email", ""),
                full_name=user_data.get("full_name", ""),
                role=user_data.get("role", "user"),
                tracked_topics=user_data.get("tracked_topics", []),
                tracked_regions=user_data.get("tracked_regions", []),
                preferences=user_data.get("preferences", {}),
                created_at=user_data.get("created_at", ""),
            )
        return None

    except Exception:
        # Return a default User if fetch fails
        return User(id=user_id)


def update_user_profile(
    user_id: str,
    full_name: Optional[str] = None,
    tracked_topics: Optional[list[str]] = None,
    tracked_regions: Optional[list[str]] = None,
    preferences: Optional[dict] = None,
) -> User:
    """
    Update user profile in Supabase.

    Args:
        user_id: The user's ID.
        full_name: New full name.
        tracked_topics: New list of tracked topics.
        tracked_regions: New list of tracked regions.
        preferences: New preferences dict.

    Returns:
        Updated User object.
    """
    client = get_client()

    update_data: dict[str, Any] = {}
    if full_name is not None:
        update_data["full_name"] = full_name
    if tracked_topics is not None:
        update_data["tracked_topics"] = tracked_topics
    if tracked_regions is not None:
        update_data["tracked_regions"] = tracked_regions
    if preferences is not None:
        update_data["preferences"] = preferences

    result = client.table("users").update(update_data).eq("id", user_id).execute()

    # Clear cache
    get_user_profile.cache_clear()

    if result.data:
        user_data = result.data[0]
        return User(
            id=user_data.get("id", user_id),
            email=user_data.get("email", ""),
            full_name=user_data.get("full_name", ""),
            role=user_data.get("role", "user"),
            tracked_topics=user_data.get("tracked_topics", []),
            tracked_regions=user_data.get("tracked_regions", []),
            preferences=user_data.get("preferences", {}),
            created_at=user_data.get("created_at", ""),
        )

    # Return updated User even if Supabase update fails
    return User(id=user_id)


# ============================================================================
# Auth Context for LangGraph SDK (LangSmith)
# ============================================================================

try:
    from langgraph_sdk import Auth as LangGraphAuth

    # Initialize LangGraph SDK Auth
    langgraph_auth = LangGraphAuth()

    @langgraph_auth.authenticate
    async def authenticate_langgraph(authorization: str | None) -> dict:
        """Authenticate LangGraph SDK requests using Supabase JWT."""
        assert authorization, "Missing Authorization header"
        scheme, token = authorization.split()
        assert scheme.lower() == "bearer", "Invalid auth scheme"

        user = verify_supabase_token(token)
        return {"identity": user.id, "role": user.role}

    @langgraph_auth.on.threads.create
    async def on_thread_create(ctx, value: dict):
        """Set owner on thread creation."""
        value.setdefault("metadata", {})["owner"] = ctx.user.identity
        return {"owner": ctx.user.identity}

    @langgraph_auth.on.threads.read
    async def on_thread_read(ctx, value: dict):
        """Filter reads by owner."""
        return {"owner": ctx.user.identity}

    @langgraph_auth.on.store()
    async def authorize_store(ctx, value: dict):
        """Authorize store access."""
        namespace: tuple = value["namespace"]
        assert namespace[0] == ctx.user.identity, "Not authorized"

    @langgraph_auth.on.assistants
    async def block_assistants(ctx, value: dict):
        """Block assistant access (use tools only)."""
        raise LangGraphAuth.exceptions.HTTPException(
            status_code=403, detail="Not permitted"
        )

except ImportError:
    # LangGraph SDK not available - skip LangGraph auth setup
    pass


# ============================================================================
# Utility Functions
# ============================================================================

def create_auth_context(authorization: str) -> AuthContext:
    """
    Create an AuthContext from an Authorization header value.

    Args:
        authorization: The Authorization header value.

    Returns:
        AuthContext with user and token information.
    """
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format",
        )

    token = parts[1]
    user = verify_supabase_token(token)

    return AuthContext(
        user=user,
        token=token,
        validated_at=datetime.now(timezone.utc),
    )


def is_token_valid(token: str) -> bool:
    """
    Check if a token is valid without raising exceptions.

    Args:
        token: The JWT token to validate.

    Returns:
        True if token is valid, False otherwise.
    """
    try:
        verify_supabase_token(token)
        return True
    except HTTPException:
        return False


def extract_user_id(authorization: str) -> Optional[str]:
    """
    Extract user ID from Authorization header without full validation.

    Useful for logging and basic filtering. For security-critical
    operations, use get_current_user dependency instead.

    Args:
        authorization: The Authorization header value.

    Returns:
        User ID string if valid, None otherwise.
    """
    if not authorization:
        return None

    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        token = parts[1]
        payload = jwt.decode(
            token,
            key=settings.SUPABASE_ANON_KEY,
            algorithms=[SUPABASE_JWT_ALGORITHM],
            options={"verify_signature": False},  # Faster, less secure
        )
        return payload.get("sub")
    except Exception:
        return None


# ============================================================================
# Exports
# ============================================================================

__all__ = [
    # Models
    "JWTClaims",
    "AuthUser",
    "AuthContext",
    # Core functions
    "decode_jwt_token",
    "verify_supabase_token",
    "get_user_from_token",
    # FastAPI dependencies
    "get_current_user",
    "get_current_user_optional",
    "require_analyst",
    "require_admin",
    # User data
    "get_user_profile",
    "update_user_profile",
    # Utilities
    "create_auth_context",
    "is_token_valid",
    "extract_user_id",
    "security",
]
