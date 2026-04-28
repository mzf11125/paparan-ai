"""
Palantir-inspired Ontology Model for Paparan AI.

This module defines the domain ontology following Palantir Foundry Ontology theory:
- Objects: Typed entities with Properties
- Links: Relationships between Objects
- Actions: State changes triggered by events
- Interfaces: Shared shapes across Object Types

All agent outputs are validated against these models.
"""
from typing import Literal, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class Impact(str, Enum):
    """Impact level for developments and actions."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Delta(str, Enum):
    """Delta tracking for changes over time."""
    NEW = "NEW"
    UPDATED = "UPDATED"
    ESCALATED = "ESCALATED"
    DE_ESCALATED = "DE-ESCALATED"


class Confidence(str, Enum):
    """Confidence level for sources and analysis."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ClassificationLevel(str, Enum):
    """Security classification level."""
    UNCLASSIFIED = "unclassified"
    OFFICIAL = "official"
    CONFIDENTIAL = "confidential"
    SECRET = "secret"


class SourceType(str, Enum):
    """Type of intelligence source."""
    GOVERNMENT = "government"
    NEWS = "news"
    RESEARCH = "research"
    UPLOADED = "uploaded"
    SOCIAL = "social"


class ReportType(str, Enum):
    """Type of policy brief."""
    ON_DEMAND = "on_demand"
    DAILY = "daily"
    WEEKLY = "weekly"


# ============================================================================
# INTERFACES (Shared Shapes)
# ============================================================================

class IntelligenceItem(BaseModel):
    """
    Interface for all intelligence items.

    Shared properties across PolicyBrief and FeedItem.
    """
    title: str
    region: str
    classification: ClassificationLevel = ClassificationLevel.UNCLASSIFIED
    delta: Delta = Delta.NEW
    date: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class Citable(BaseModel):
    """
    Interface for items that can cite sources.

    Shared properties across PolicyBrief and Development.
    """
    sources: list["Source"] = []
    confidence: Confidence = Confidence.MEDIUM


# ============================================================================
# OBJECT TYPES
# ============================================================================

class Source(BaseModel):
    """
    Object Type: Source

    A referenced source for intelligence.
    Part of the Citable interface.
    """
    id: str = ""
    url: str = ""
    title: str = ""
    source_type: SourceType = SourceType.NEWS
    confidence: Confidence = Confidence.MEDIUM
    retrieved_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    published_at: str = ""
    author: str = ""
    publication: str = ""

    # Metadata for tracking
    tier: str = "unknown"  # primary, tier1, indonesia, islamic_web3
    is_government: bool = False


class Development(BaseModel):
    """
    Object Type: Development

    A tracked development or delta in policy intelligence.
    Implements Citable interface.
    """
    id: str = ""
    description: str
    delta_type: Delta = Delta.NEW
    impact_level: Impact = Impact.MEDIUM
    entities: list[str] = Field(default_factory=list)
    source_id: Optional[str] = None
    sources: list[Source] = Field(default_factory=list)
    confidence: Confidence = Confidence.MEDIUM
    date: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    # Additional context
    category: str = ""  # e.g., "Trade Policy", "Digital Economy"
    countries: list[str] = Field(default_factory=list)
    relevance_score: float = 0.0


class Action(BaseModel):
    """
    Object Type: Action

    A recommended action arising from intelligence.
    """
    priority: Impact = Impact.MEDIUM
    text: str
    owner: str = ""
    deadline: str = ""
    category: str = ""  # e.g., "Monitor", "Engage", "Analyze"
    status: Literal["pending", "in_progress", "completed", "cancelled"] = "pending"


class PolicyBrief(IntelligenceItem, Citable):
    """
    Object Type: PolicyBrief

    A complete policy intelligence brief.

    This is the primary output of the orchestrator agent.
    Implements both IntelligenceItem and Citable interfaces.
    """
    id: str = ""
    user_id: str = ""
    report_type: ReportType = ReportType.ON_DEMAND
    topic: str = ""
    previous_report_id: Optional[str] = None

    # 7-section brief structure
    executive_summary: list[str] = Field(default_factory=list)
    key_developments: list[Development] = Field(default_factory=list)
    current_situation: str = ""
    analysis: str = ""
    implications: str = ""
    risks: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)
    recommendations: list[Action] = Field(default_factory=list)
    timeline: str = ""
    risk_assessment: str = ""

    # Delta tracking (compared to previous_report_id)
    delta_summary: Optional[dict] = None

    # Intelligence enhancements
    rpjmn_alignment: Optional[dict] = None
    urgency_score: float = 0.0
    source_count: int = 0
    confidence_score: Confidence = Confidence.MEDIUM
    diplomat_meta: Optional[dict] = None

    # Bellingcat / OSINT enrichment
    spatial_context: Optional[dict] = None
    environmental_indicators: Optional[dict] = None
    conflict_context: Optional[dict] = None

    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    tags: list[str] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)


class FeedItem(IntelligenceItem):
    """
    Object Type: FeedItem

    A cached news item or feed entry.

    Implements IntelligenceItem interface.
    Stored in feed_items table with embeddings for semantic search.
    """
    id: str = ""
    url: str = ""
    summary: str = ""
    source: str = ""
    topic_tags: list[str] = Field(default_factory=list)
    published_at: str = ""
    retrieved_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    expires_at: str = ""

    # Embedding metadata
    embedding: Optional[list[float]] = None
    similarity_score: float = 0.0

    # Source classification
    tier: str = "unknown"
    is_government: bool = False


class Document(BaseModel):
    """
    Object Type: Document

    A user-uploaded document for RAG indexing.
    """
    id: str = ""
    user_id: str = ""
    file_path: str = ""
    file_name: str = ""
    file_size: int = 0
    content_type: str = ""
    parsed_text: str = ""
    metadata: dict = Field(default_factory=dict)

    # Embedding for semantic search
    embedding: Optional[list[float]] = None

    # Processing status
    uploaded_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    processed_at: Optional[str] = None
    status: Literal["pending", "processing", "completed", "failed"] = "pending"

    # Chunking metadata
    chunk_count: int = 0
    chunks: list[str] = Field(default_factory=list)


class User(BaseModel):
    """
    Object Type: User

    Application user with preferences and tracked topics.
    """
    id: str = ""
    email: str = ""
    full_name: str = ""
    role: Literal["user", "analyst", "admin"] = "user"
    tracked_topics: list[str] = Field(default_factory=list)
    tracked_regions: list[str] = Field(default_factory=list)
    preferences: dict = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class Alert(BaseModel):
    """
    Object Type: Alert

    User-configured alert for monitoring specific topics.
    """
    id: str = ""
    user_id: str = ""
    query: str = ""
    regions: list[str] = Field(default_factory=list)
    frequency: Literal["daily", "weekly", "monthly"] = "daily"
    last_triggered: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class AgentMemory(BaseModel):
    """
    Object Type: AgentMemory

    Memory stored by agents for cross-session context.
    """
    id: str = ""
    user_id: str = ""
    memory_type: Literal["preferences", "topics", "context", "feedback"] = "context"
    content: dict = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    expires_at: Optional[str] = None


# ============================================================================
# LINK TYPES (Represented as Pydantic models for API responses)
# ============================================================================

class BriefSourceLink(BaseModel):
    """Link: brief_has_source (PolicyBrief -> Source)"""
    brief_id: str
    source_id: str
    linked_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class BriefDevelopmentLink(BaseModel):
    """Link: brief_has_development (PolicyBrief -> Development)"""
    brief_id: str
    development_id: str
    position: int = 0  # Order in brief
    linked_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class UserWatchlistLink(BaseModel):
    """Link: user_watches_brief (User -> PolicyBrief)"""
    user_id: str
    brief_id: str
    notes: str = ""
    added_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class UserAlertLink(BaseModel):
    """Link: user_has_alert (User -> Alert)"""
    user_id: str
    alert_id: str
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class GenerateBriefRequest(BaseModel):
    """Request to generate a policy brief."""
    topic: str
    region: str = "ASEAN"
    classification: ClassificationLevel = ClassificationLevel.UNCLASSIFIED
    report_type: ReportType = ReportType.ON_DEMAND
    include_sources: bool = True
    max_sources: int = 10
    user_id: str = ""


class GenerateBriefResponse(BaseModel):
    """Response from brief generation."""
    brief_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    message: str = ""
    brief: Optional[PolicyBrief] = None
    processing_time_ms: int = 0


class SearchRequest(BaseModel):
    """Request for semantic search."""
    query: str
    region: str = ""
    limit: int = 5
    threshold: float = 0.75
    user_id: str = ""


class SearchResponse(BaseModel):
    """Response from semantic search."""
    results: list[FeedItem]
    total_count: int
    query: str
    search_time_ms: int


class ChatMessage(BaseModel):
    """Chat message in conversation."""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    sources: list[Source] = Field(default_factory=list)


class ChatRequest(BaseModel):
    """Request for conversational RAG."""
    message: str
    thread_id: str = ""
    user_id: str = ""
    use_context: bool = True
    max_sources: int = 5


class ChatResponse(BaseModel):
    """Response from conversational agent."""
    thread_id: str
    message: ChatMessage
    sources_used: list[Source] = Field(default_factory=list)
    is_complete: bool = True


class ScrapeRequest(BaseModel):
    """Request to trigger scraping."""
    sources: list[str] = []
    topics: list[str] = []
    regions: list[str] = []
    max_results: int = 10
    force_refresh: bool = False


class ScrapeResponse(BaseModel):
    """Response from scraping operation."""
    items_scraped: int
    items_cached: int
    items_failed: int
    duration_ms: int
    errors: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    """Health check response."""
    status: Literal["healthy", "degraded", "unhealthy"]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    version: str = "0.1.0"
    services: dict = Field(default_factory=dict)


# ============================================================================
# VALIDATION HELPERS
# ============================================================================

def validate_intelligence_item(item: dict) -> IntelligenceItem:
    """Validate and convert dict to IntelligenceItem."""
    return IntelligenceItem(**item)


def validate_policy_brief(brief: dict) -> PolicyBrief:
    """Validate and convert dict to PolicyBrief."""
    return PolicyBrief(**brief)


def validate_feed_item(item: dict) -> FeedItem:
    """Validate and convert dict to FeedItem."""
    return FeedItem(**item)


def validate_development(dev: dict) -> Development:
    """Validate and convert dict to Development."""
    return Development(**dev)


# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    # Enums
    "Impact", "Delta", "Confidence", "ClassificationLevel",
    "SourceType", "ReportType",
    # Object Types
    "Source", "Development", "Action", "PolicyBrief",
    "FeedItem", "Document", "User", "Alert", "AgentMemory",
    # Link Types
    "BriefSourceLink", "BriefDevelopmentLink",
    "UserWatchlistLink", "UserAlertLink",
    # Request/Response
    "GenerateBriefRequest", "GenerateBriefResponse",
    "SearchRequest", "SearchResponse",
    "ChatMessage", "ChatRequest", "ChatResponse",
    "ScrapeRequest", "ScrapeResponse", "HealthResponse",
    # Validators
    "validate_intelligence_item", "validate_policy_brief",
    "validate_feed_item", "validate_development",
]
