"""Paparan API - FastAPI application for policy briefs and Bappenas metadata extraction."""
import asyncio
import hashlib
import json
import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.config import settings
from app.db.client import get_client
from app.db.schema import GenerateBriefRequest, ChatRequest, PolicyBrief
from app.db.sdi_schema import (
    ExtractionJobResponse,
    ResolveFlagRequest,
    ConsistencyCheckRequest,
)
from app.agents.orchestrator import run_orchestrator
from app.agents.conversational import conv_agent
from app.agents.scraper import run_scraper
from app.agents.metadata_extractor import run_extraction_job
from app.agents.consistency_checker import (
    run_consistency_check_async,
    resolve_flag,
    get_user_flags,
    check_single_indicator,
)
from app.agents.asean_simulator import run_asean_simulator
from app.agents.synthesizer import run_synthesizer
from app.tools.document_processor import (
    extract_text,
    compute_file_hash,
    extract_metadata_from_text,
)
from app.tools.export_tools import generate_pdf, generate_pptx, generate_diplomat_pdf
from app.tools.knowledge_graph import query_entity_graph, upsert_entity
from app.tools.rpjmn_tools import generate_talking_points
from app.agents.rpjmn_scorer import run_rpjmn_scorer
from app.tools.bellingcat.maritime_tools import track_maritime_activity
from app.tools.bellingcat.environmental_tools import get_environmental_indicators
from app.tools.bellingcat.conflict_tools import get_conflict_events
from app.tools.bellingcat.corporate_tools import identify_corporate_actors
from app.tools.bellingcat.archive_tools import archive_source

app = FastAPI(title="Paparan API")

# Parse ALLOWED_ORIGINS from env (comma-separated)
allowed_origins = getattr(settings, 'ALLOWED_ORIGINS', settings.FRONTEND_URL)
if isinstance(allowed_origins, str):
    allowed_origins = [origin.strip() for origin in allowed_origins.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_user_id(authorization: str | None = Header(default=None)) -> str:
    """Extract and validate user ID from Bearer token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        scheme, token = authorization.split()
        assert scheme.lower() == "bearer"
        client = get_client()
        user = client.auth.get_user(token)
        assert user and user.user

        # Check email whitelist if configured
        if settings.WHITELISTED_EMAILS:
            whitelist = [e.strip() for e in settings.WHITELISTED_EMAILS.split(',')]
            user_email = user.user.email
            if user_email not in whitelist:
                raise HTTPException(
                    status_code=403,
                    detail=f"Email {user_email} is not authorized to access this application"
                )

        return user.user.id
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/health")
def health():
    return {"status": "ok"}


# === Existing Paparan API Endpoints ===

@app.post("/api/paparan", response_model=PolicyBrief)
def generate_brief(req: GenerateBriefRequest, user_id: str = Depends(get_user_id)):
    try:
        return run_orchestrator(req, user_id=user_id)
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


@app.post("/api/scrape/trigger")
def trigger_scrape(user_id: str = Depends(get_user_id)):
    result = run_scraper()
    return {"saved_count": result["saved_count"]}


@app.post("/api/scrape/cron")
def cron_scrape():
    """Called by Railway cron — no auth required (internal)."""
    result = run_scraper()
    return {"saved_count": result["saved_count"]}


# === Bappenas Metadata Extraction API Endpoints ===

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_user_id),
):
    """Upload document for SDI metadata extraction."""
    # Validate file size
    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    content = await file.read()

    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB"
        )

    # Validate file type
    filename = file.filename or "unknown"
    filename_lower = filename.lower()

    if not any(filename_lower.endswith(ext) for ext in settings.SUPPORTED_FILE_EXTENSIONS):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type. Supported: {', '.join(settings.SUPPORTED_FILE_EXTENSIONS)}"
        )

    # Compute file hash for deduplication
    file_hash = compute_file_hash(content)

    client = get_client()

    # Check for duplicate file
    existing = client.table("bappenas_documents").select("id").eq("file_hash", file_hash).execute()
    if existing.data:
        return {
            "status": "duplicate",
            "message": "File already uploaded",
            "document_id": existing.data[0]["id"],
        }

    # Extract text from file
    extraction_result = extract_text(content, filename)

    if not extraction_result.get("success"):
        raise HTTPException(
            status_code=422,
            detail=f"Failed to extract text: {extraction_result.get('error')}"
        )

    # Extract basic metadata
    doc_metadata = extract_metadata_from_text(extraction_result["text"])

    # Store document
    document_data = {
        "user_id": user_id,
        "filename": filename,
        "file_hash": file_hash,
        "file_size": len(content),
        "content_type": file.content_type or "application/octet-stream",
        "page_count": extraction_result.get("page_count", 0),
        "extracted_text": extraction_result["text"][:settings.MAX_EXTRACT_LENGTH],
        "metadata": doc_metadata,
        "processing_status": "pending",
    }

    result = client.table("bappenas_documents").insert(document_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save document")

    document_id = result.data[0]["id"]

    # Create extraction job
    job_data = {
        "user_id": user_id,
        "document_id": document_id,
        "status": "pending",
        "progress": 0,
    }

    job_result = client.table("extraction_jobs").insert(job_data).execute()

    if job_result.data:
        job_id = job_result.data[0]["id"]

        # Schedule async processing (in production, use Celery/Redis)
        # For now, process synchronously
        _process_extraction_job(job_id, document_id, user_id, extraction_result["text"], filename)

    return {
        "status": "uploaded",
        "document_id": document_id,
        "job_id": job_result.data[0]["id"] if job_result.data else None,
    }


def _process_extraction_job(job_id: str, document_id: str, user_id: str, text: str, filename: str):
    """Process extraction job (async placeholder - runs synchronously for now)."""
    client = get_client()

    # Update job status to processing
    client.table("extraction_jobs").update({
        "status": "processing",
        "progress": 25,
        "started_at": datetime.utcnow().isoformat(),
    }).eq("id", job_id).execute()

    try:
        # Run extraction
        extraction_result = run_extraction_job(text, filename, document_id, user_id)

        if not extraction_result.get("success"):
            raise Exception(extraction_result.get("error", "Extraction failed"))

        # Store indicators
        indicators = extraction_result.get("indicators", [])

        # Store each indicator
        for ind in indicators:
            ind["user_id"] = user_id
            ind["document_id"] = document_id

        if indicators:
            client.table("sdi_indicators").insert(indicators).execute()

            # Update job progress
            client.table("extraction_jobs").update({
                "status": "processing",
                "progress": 75,
                "result_indicators_count": len(indicators),
            }).eq("id", job_id).execute()

            # Run consistency check on new indicators
            consistency_result = run_consistency_check_async(user_id, None)
            json.loads(consistency_result)

        # Mark document as processed
        client.table("bappenas_documents").update({
            "processing_status": "completed",
            "processed_at": datetime.utcnow().isoformat(),
        }).eq("id", document_id).execute()

        # Mark job as completed
        client.table("extraction_jobs").update({
            "status": "completed",
            "progress": 100,
            "completed_at": datetime.utcnow().isoformat(),
            "result_indicators_count": len(indicators),
        }).eq("id", job_id).execute()

    except Exception as e:
        client.table("extraction_jobs").update({
            "status": "failed",
            "error_message": str(e),
            "completed_at": datetime.utcnow().isoformat(),
        }).eq("id", job_id).execute()

        client.table("bappenas_documents").update({
            "processing_status": "failed",
        }).eq("id", document_id).execute()


@app.get("/api/bappenas/documents")
def list_bappenas_documents(
    status: str = "",
    limit: int = 20,
    offset: int = 0,
    user_id: str = Depends(get_user_id),
):
    """List uploaded Bappenas documents."""
    client = get_client()
    query = client.table("bappenas_documents").select("*").eq("user_id", user_id)

    if status:
        query = query.eq("processing_status", status)

    result = query.order("uploaded_at", desc=True).range(offset, offset + limit - 1).execute()
    return result.data


@app.get("/api/bappenas/documents/{document_id}")
def get_bappenas_document(document_id: str, user_id: str = Depends(get_user_id)):
    """Get a specific Bappenas document."""
    client = get_client()
    result = client.table("bappenas_documents").select("*").eq("id", document_id).eq("user_id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")

    return result.data[0]


@app.get("/api/bappenas/indicators")
def list_indicators(
    document_id: Optional[str] = None,
    kl_code: Optional[str] = None,
    sector: Optional[str] = None,
    confidence: Optional[str] = None,
    limit: int = 20,
    page: int = 1,
    user_id: str = Depends(get_user_id),
):
    """List extracted SDI indicators."""
    client = get_client()
    query = client.table("sdi_indicators").select("*").eq("user_id", user_id)

    if document_id:
        query = query.eq("document_id", document_id)
    if kl_code:
        query = query.eq("kl_code", kl_code)
    if sector:
        query = query.eq("sector", sector)
    if confidence:
        query = query.eq("extraction_confidence", confidence.upper())

    offset = (page - 1) * limit
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

    return result.data


@app.get("/api/bappenas/indicators/{indicator_id}")
def get_indicator(indicator_id: str, user_id: str = Depends(get_user_id)):
    """Get a specific indicator."""
    client = get_client()
    result = client.table("sdi_indicators").select("*").eq("id", indicator_id).eq("user_id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Indicator not found")

    return result.data[0]


@app.get("/api/bappenas/jobs")
def list_jobs(
    status: str = "",
    limit: int = 20,
    user_id: str = Depends(get_user_id),
):
    """List extraction jobs."""
    client = get_client()
    query = client.table("extraction_jobs").select("*").eq("user_id", user_id)

    if status:
        query = query.eq("status", status)

    result = query.order("created_at", desc=True).limit(limit).execute()
    return result.data


@app.get("/api/bappenas/jobs/{job_id}")
def get_job(job_id: str, user_id: str = Depends(get_user_id)):
    """Get job status."""
    client = get_client()
    result = client.table("extraction_jobs").select("*").eq("id", job_id).eq("user_id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    job_data = result.data[0]
    return ExtractionJobResponse(
        job_id=job_data["id"],
        status=job_data["status"],
        progress=job_data.get("progress", 0),
        error_message=job_data.get("error_message", ""),
        result_indicators_count=job_data.get("result_indicators_count", 0),
        created_at=job_data["created_at"],
        started_at=job_data.get("started_at"),
        completed_at=job_data.get("completed_at"),
    ).model_dump()


@app.post("/api/bappenas/indicators/check-consistency")
def check_consistency(
    req: ConsistencyCheckRequest,
    user_id: str = Depends(get_user_id),
):
    """Trigger consistency check for indicators."""
    result = run_consistency_check_async(
        user_id=user_id,
        indicator_ids=req.indicator_ids,
        check_type=req.check_type,
    )

    return json.loads(result)


@app.get("/api/bappenas/consistency-flags")
def list_consistency_flags(
    status: str = "open",
    limit: int = 50,
    user_id: str = Depends(get_user_id),
):
    """List consistency flags."""
    return get_user_flags(user_id, status)[:limit]


@app.put("/api/bappenas/consistency-flags/{flag_id}/resolve")
def resolve_consistency_flag(
    flag_id: str,
    req: ResolveFlagRequest,
    user_id: str = Depends(get_user_id),
):
    """Resolve a consistency flag."""
    return resolve_flag(flag_id, user_id, req.resolution_notes)


@app.get("/api/bappenas/indicators/{indicator_id}/check-consistency")
def check_indicator_consistency(indicator_id: str, user_id: str = Depends(get_user_id)):
    """Check a single indicator for consistency."""
    flags = check_single_indicator(user_id, indicator_id)
    return {"indicator_id": indicator_id, "potential_conflicts": flags}


@app.delete("/api/bappenas/documents/{document_id}")
def delete_document(document_id: str, user_id: str = Depends(get_user_id)):
    """Delete a document and its related data."""
    client = get_client()
    result = client.table("bappenas_documents").delete().eq("id", document_id).eq("user_id", user_id).execute()
    return {"deleted": result.count > 0 if hasattr(result, "count") else True}


@app.delete("/api/bappenas/indicators/{indicator_id}")
def delete_indicator(indicator_id: str, user_id: str = Depends(get_user_id)):
    """Delete an indicator."""
    client = get_client()
    result = client.table("sdi_indicators").delete().eq("id", indicator_id).eq("user_id", user_id).execute()
    return {"deleted": result.count > 0 if hasattr(result, "count") else True}


# === Reference Data Endpoints ===

@app.get("/api/bappenas/references/kl-codes")
def get_kl_codes():
    """Get all K/L reference codes."""
    client = get_client()
    result = client.table("kl_code_reference").select("*").order("code").execute()
    return result.data


@app.get("/api/bappenas/references/sectors")
def get_sectors():
    """Get all sector reference codes."""
    client = get_client()
    result = client.table("sector_reference").select("*").order("code").execute()
    return result.data


@app.get("/api/bappenas/references/sdi-goals")
def get_sdi_goals():
    """Get all SDI goal reference codes."""
    client = get_client()
    result = client.table("sdi_goal_reference").select("*").execute()
    return result.data


# === Export Endpoints ===

@app.get("/api/briefs/{brief_id}/export/pdf")
def export_brief_pdf(brief_id: str, user_id: str = Depends(get_user_id)):
    """Export brief as PDF."""
    client = get_client()
    result = client.table("paparan_reports").select("*").eq("id", brief_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Brief not found")
    brief = PolicyBrief(**result.data[0]["content"])
    pdf_bytes = generate_pdf(brief)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="brief-{brief_id}.pdf"'},
    )


@app.get("/api/briefs/{brief_id}/export/pptx")
def export_brief_pptx(brief_id: str, user_id: str = Depends(get_user_id)):
    """Export brief as PowerPoint."""
    client = get_client()
    result = client.table("paparan_reports").select("*").eq("id", brief_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Brief not found")
    brief = PolicyBrief(**result.data[0]["content"])
    pptx_bytes = generate_pptx(brief)
    return StreamingResponse(
        iter([pptx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="brief-{brief_id}.pptx"'},
    )


class DiplomatExportRequest(BaseModel):
    to: str
    from_name: str
    ref: str = ""
    distribution: list[str] = []


@app.post("/api/briefs/{brief_id}/export/diplomat-pdf")
def export_diplomat_pdf(brief_id: str, req: DiplomatExportRequest, user_id: str = Depends(get_user_id)):
    """Export brief as formal diplomatic memo PDF."""
    client = get_client()
    result = client.table("paparan_reports").select("*").eq("id", brief_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Brief not found")
    brief = PolicyBrief(**result.data[0]["content"])

    # Auto-generate ref number if not provided
    ref_no = req.ref
    if not ref_no:
        from datetime import datetime
        seq_result = client.rpc("nextval", {"sequence_name": "paparan_ref_seq"}).execute()
        seq = seq_result.data if seq_result.data else 1
        ref_no = f"PAP-{datetime.utcnow().year}-{int(seq):04d}"

    pdf_bytes = generate_diplomat_pdf(brief, req.to, req.from_name, ref_no, req.distribution)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="diplomat-{ref_no}.pdf"'},
    )


@app.post("/api/briefs/{brief_id}/rpjmn-score")
def score_rpjmn(brief_id: str, user_id: str = Depends(get_user_id)):
    """Score a brief against RPJMN 2025-2029 Asta Cita pillars."""
    client = get_client()
    result = client.table("paparan_reports").select("*").eq("id", brief_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Brief not found")
    brief = PolicyBrief(**result.data[0]["content"])
    brief = run_rpjmn_scorer(brief)
    client.table("paparan_reports").update({"content": brief.model_dump()}).eq("id", brief_id).execute()
    return brief


@app.post("/api/briefs/{brief_id}/talking-points")
def get_talking_points(brief_id: str, user_id: str = Depends(get_user_id)):
    """Generate diplomat talking points for a brief."""
    client = get_client()
    result = client.table("paparan_reports").select("*").eq("id", brief_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Brief not found")
    brief = PolicyBrief(**result.data[0]["content"])
    brief_text = f"{brief.title}\n{brief.currentSituation}\n{brief.implications}"
    points = generate_talking_points.invoke({"brief_text": brief_text, "topic": brief.title})
    return {"brief_id": brief_id, "talking_points": points}


@app.post("/api/briefs/{brief_id}/acknowledge")
def acknowledge_brief(brief_id: str, acknowledged_by: str, user_id: str = Depends(get_user_id)):
    """Record read receipt / acknowledgement for a diplomat brief."""
    from datetime import datetime
    client = get_client()
    result = client.table("paparan_reports").select("content").eq("id", brief_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Brief not found")
    content = result.data[0]["content"]
    diplomat_meta = content.get("diplomat_meta") or {}
    diplomat_meta["acknowledged_at"] = datetime.utcnow().isoformat()
    diplomat_meta["acknowledged_by"] = acknowledged_by
    content["diplomat_meta"] = diplomat_meta
    client.table("paparan_reports").update({"content": content}).eq("id", brief_id).execute()
    return {"acknowledged_at": diplomat_meta["acknowledged_at"], "acknowledged_by": acknowledged_by}


@app.get("/api/briefs/{brief_id}/versions")
def get_brief_versions(brief_id: str, user_id: str = Depends(get_user_id)):
    """Get version history for a brief."""
    client = get_client()
    result = client.table("brief_versions").select("*").eq("brief_id", brief_id).order("version_num").execute()
    return result.data


# === ASEAN Intelligence Endpoints ===

class SimulateRequest(BaseModel):
    scenario: str
    affected_pillars: list[str] = []


@app.post("/api/asean/simulate")
def asean_simulate(req: SimulateRequest, user_id: str = Depends(get_user_id)):
    """Simulate an ASEAN policy scenario."""
    try:
        return run_asean_simulator(req.scenario, req.affected_pillars or None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/asean/knowledge-graph")
def get_knowledge_graph(q: str = "ASEAN", user_id: str = Depends(get_user_id)):
    """Query the ASEAN policy knowledge graph."""
    return query_entity_graph.invoke({"query": q})


# === Cross-Brief Synthesis ===

class SynthesizeRequest(BaseModel):
    brief_ids: list[str]


@app.post("/api/briefs/synthesize")
def synthesize_briefs(req: SynthesizeRequest, user_id: str = Depends(get_user_id)):
    """Synthesize insights across multiple briefs."""
    if len(req.brief_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 brief IDs")
    if len(req.brief_ids) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 briefs per synthesis")
    client = get_client()
    briefs = []
    for bid in req.brief_ids:
        r = client.table("paparan_reports").select("content").eq("id", bid).eq("user_id", user_id).execute()
        if r.data:
            briefs.append(r.data[0]["content"])
    if not briefs:
        raise HTTPException(status_code=404, detail="No briefs found")
    try:
        return run_synthesizer(briefs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === Feedback / Outcome Endpoints ===

class OutcomeRequest(BaseModel):
    rating: int
    outcome_notes: str = ""
    action_taken: bool = False


@app.post("/api/briefs/{brief_id}/outcome")
def record_outcome(brief_id: str, req: OutcomeRequest, user_id: str = Depends(get_user_id)):
    """Record policymaker outcome and rating for a brief."""
    if not (1 <= req.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    client = get_client()
    result = client.table("brief_outcomes").insert({
        "brief_id": brief_id, "user_id": user_id,
        "rating": req.rating, "outcome_notes": req.outcome_notes,
        "action_taken": req.action_taken,
    }).execute()
    return result.data[0] if result.data else {"status": "recorded"}


@app.get("/api/briefs/{brief_id}/outcome")
def get_outcomes(brief_id: str, user_id: str = Depends(get_user_id)):
    """Get outcomes and ratings for a brief."""
    client = get_client()
    result = client.table("brief_outcomes").select("*").eq("brief_id", brief_id).execute()
    outcomes = result.data or []
    avg_rating = sum(o["rating"] for o in outcomes) / len(outcomes) if outcomes else None
    return {"brief_id": brief_id, "outcomes": outcomes, "avg_rating": avg_rating}


# === Bellingcat / OSINT Intelligence Endpoints ===

@app.get("/api/intelligence/maritime/{region}")
def maritime_intelligence(region: str, user_id: str = Depends(get_user_id)):
    """Get vessel tracking data for an ASEAN maritime region."""
    try:
        return track_maritime_activity.invoke({"region": region})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/intelligence/environment/{region}")
def environmental_intelligence(region: str, user_id: str = Depends(get_user_id)):
    """Get environmental indicators (deforestation, fire, fishing) for a region."""
    try:
        return get_environmental_indicators.invoke({"region": region})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/intelligence/conflict/{region}")
def conflict_intelligence(region: str, days: int = 30, user_id: str = Depends(get_user_id)):
    """Get conflict and security events for an ASEAN region."""
    try:
        return get_conflict_events.invoke({"region": region, "days": days})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CorporateRequest(BaseModel):
    text: str


@app.post("/api/intelligence/corporate")
def corporate_intelligence(req: CorporateRequest, user_id: str = Depends(get_user_id)):
    """Identify corporate actors in policy text."""
    try:
        return identify_corporate_actors.invoke({"policy_text": req.text})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ArchiveRequest(BaseModel):
    url: str


@app.post("/api/intelligence/archive")
def archive_url(req: ArchiveRequest, user_id: str = Depends(get_user_id)):
    """Archive a URL to the Wayback Machine."""
    try:
        return archive_source.invoke({"url": req.url})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
