import asyncio
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.config import settings
from app.db.client import get_client
from app.db.schema import GenerateBriefRequest, ChatRequest, PolicyBrief
from app.agents.orchestrator import run_orchestrator
from app.agents.conversational import conv_agent
from app.agents.scraper import run_scraper

app = FastAPI(title="Paparan API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_user_id(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        scheme, token = authorization.split()
        assert scheme.lower() == "bearer"
        client = get_client()
        user = client.auth.get_user(token)
        assert user and user.user
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/paparan", response_model=PolicyBrief)
def generate_brief(req: GenerateBriefRequest, user_id: str = Depends(get_user_id)):
    try:
        return run_orchestrator(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feed")
def get_feed(region: str = "", limit: int = 20, offset: int = 0, user_id: str = Depends(get_user_id)):
    client = get_client()
    q = client.table("feed_items").select("id,title,summary,url,source,region,topic_tags,published_at")
    if region:
        q = q.eq("region", region)
    result = q.order("retrieved_at", desc=True).range(offset, offset + limit - 1).execute()
    return result.data


@app.get("/api/search")
def semantic_search(q: str, region: str = "", limit: int = 10, user_id: str = Depends(get_user_id)):
    from app.tools.supabase_tools import semantic_search as _search
    return _search.invoke({"query": q, "region": region, "limit": limit})


@app.get("/api/briefs")
def list_briefs(user_id: str = Depends(get_user_id)):
    client = get_client()
    result = client.table("paparan_reports").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data


@app.get("/api/briefs/{brief_id}")
def get_brief(brief_id: str, user_id: str = Depends(get_user_id)):
    client = get_client()
    result = client.table("paparan_reports").select("*").eq("id", brief_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Brief not found")
    return result.data[0]


@app.post("/api/chat")
async def chat(req: ChatRequest, user_id: str = Depends(get_user_id)):
    """Streaming SSE conversational RAG endpoint."""
    messages = [{"role": "user", "content": req.message}]

    async def stream():
        for chunk in conv_agent.stream({"messages": messages}, stream_mode="values"):
            last = chunk["messages"][-1]
            if hasattr(last, "content") and last.type == "ai":
                yield f"data: {last.content}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.get("/api/chat/history/{thread_id}")
def chat_history(thread_id: str, user_id: str = Depends(get_user_id)):
    # Placeholder — wire to LangMem thread store when available
    return {"thread_id": thread_id, "messages": []}


@app.post("/api/upload")
async def upload_document(user_id: str = Depends(get_user_id)):
    # Placeholder — full implementation in Task 5 (document upload)
    return {"status": "not_implemented"}


@app.post("/api/scrape/trigger")
def trigger_scrape(user_id: str = Depends(get_user_id)):
    result = run_scraper()
    return {"saved_count": result["saved_count"]}


@app.post("/api/scrape/cron")
def cron_scrape():
    """Called by Railway cron — no auth required (internal)."""
    result = run_scraper()
    return {"saved_count": result["saved_count"]}
