from typing import Literal
from pydantic import BaseModel

Impact = Literal["HIGH", "MEDIUM", "LOW"]
Delta = Literal["NEW", "UPDATED", "ESCALATED", "DE-ESCALATED"]
Confidence = Literal["HIGH", "MEDIUM", "LOW"]
ClassificationLevel = Literal["unclassified", "official", "confidential", "secret"]


class Source(BaseModel):
    id: str
    title: str
    url: str = ""
    confidence: Confidence
    date: str


class Development(BaseModel):
    id: str
    text: str
    impact: Impact
    delta: Delta
    sourceId: str
    date: str = ""
    entities: list[str] = []


class Action(BaseModel):
    priority: Impact
    text: str
    owner: str = ""
    deadline: str = ""


class PolicyBrief(BaseModel):
    id: str
    title: str
    date: str
    region: str
    lastUpdated: str = ""
    classification: ClassificationLevel = "unclassified"
    executiveSummary: list[str]
    currentSituation: str
    developments: list[Development]
    implications: str
    risks: list[str]
    opportunities: list[str]
    actions: list[Action]
    sources: list[Source]
    tags: list[str] = []
    previous_report_id: str | None = None
    # Intelligence enhancements
    rpjmn_alignment: dict | None = None
    urgency_score: float | None = None
    source_count: int = 0
    confidence_score: str = "MEDIUM"
    diplomat_meta: dict | None = None
    # Bellingcat / OSINT enrichment
    spatial_context: dict | None = None
    archived_sources: list | None = None
    environmental_indicators: dict | None = None
    conflict_context: dict | None = None
    # RDTII regulatory evidence
    rdtii_evidence: list | None = None


class RegulatoryEvidence(BaseModel):
    id: str = ""
    brief_id: str = ""
    source_url: str = ""
    clause_text: str
    pillar_id: str          # P1–P7
    indicator_code: str     # e.g. "6.1"
    country: str = ""
    confidence: Confidence = "MEDIUM"
    extracted_at: str = ""


class FeedItem(BaseModel):
    id: str = ""
    title: str
    summary: str
    url: str
    source: str
    region: str
    topic_tags: list[str] = []
    published_at: str = ""
    classification: ClassificationLevel = "unclassified"
    delta: Delta = "NEW"


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class GenerateBriefRequest(BaseModel):
    topic: str
    region: str = "ASEAN"
    classification: ClassificationLevel = "unclassified"


class ChatRequest(BaseModel):
    message: str
    thread_id: str = ""
    user_id: str = ""
