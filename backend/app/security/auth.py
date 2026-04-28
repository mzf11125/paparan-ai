from langgraph_sdk import Auth
from app.db.client import get_client

auth = Auth()


@auth.authenticate
async def authenticate(authorization: str | None) -> Auth.types.MinimalUserDict:
    assert authorization, "Missing Authorization header"
    scheme, token = authorization.split()
    assert scheme.lower() == "bearer", "Invalid auth scheme"
    client = get_client()
    user = client.auth.get_user(token)
    assert user and user.user, "Invalid token"
    return {"identity": user.user.id}


@auth.on.threads.create
async def on_thread_create(ctx: Auth.types.AuthContext, value: dict):
    value.setdefault("metadata", {})["owner"] = ctx.user.identity
    return {"owner": ctx.user.identity}


@auth.on.threads.read
async def on_thread_read(ctx: Auth.types.AuthContext, value: dict):
    return {"owner": ctx.user.identity}


@auth.on.store()
async def authorize_store(ctx: Auth.types.AuthContext, value: dict):
    namespace: tuple = value["namespace"]
    assert namespace[0] == ctx.user.identity, "Not authorized"


@auth.on.assistants
async def block_assistants(ctx: Auth.types.AuthContext, value: dict):
    raise Auth.exceptions.HTTPException(status_code=403, detail="Not permitted")
