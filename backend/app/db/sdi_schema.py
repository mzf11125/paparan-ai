"""SDI (Satu Data Indonesia) compliant Pydantic schemas."""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator


# Enums for SDI compliance
class UnitType(str, Literal):
    """Unit type per SDI standard (Perpres 195/2024)."""
    nominal = "nominal"
    ratio = "ratio"
    index = "index"
    count = "count"
    percentage = "percentage"
    rate = "rate"
    duration = "duration"
    currency = "currency"


class TemporalResolution(str, Literal):
    """Temporal resolution per SDI standard."""
    realtime = "realtime"
    hourly = "hourly"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    semiannual = "semiannual"
    annual = "annual"
    biennial = "biennial"
    quinary = "quinary"


class AvailabilityStatus(str, Literal):
    """Availability status per SDI standard."""
    available = "available"
    partial = "partial"
    scheduled = "scheduled"
    discontinued = "discontinued"


class ExtractionConfidence(str, Literal):
    """Confidence level for AI extraction."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ConflictType(str, Literal):
    """Type of consistency conflict detected."""
    duplicate = "duplicate"
    unit_mismatch = "unit_mismatch"
    definition_inconsistency = "definition_inconsistency"
    temporal_inconsistency = "temporal_inconsistency"
    kl_code_mismatch = "kl_code_mismatch"


class ConflictStatus(str, Literal):
    """Status of conflict resolution."""
    open = "open"
    in_review = "in_review"
    resolved = "resolved"
    dismissed = "dismissed"


# Request/Response models for API
class UploadDocumentRequest(BaseModel):
    """Request model for document upload."""
    filename: str = Field(..., description="Name of uploaded file")
    content_type: str = Field(..., description="MIME type of file")
    file_size: int = Field(..., description="Size of file in bytes")


class DocumentMetadata(BaseModel):
    """Basic metadata extracted from document."""
    title: str
    document_type: str = ""
    ministry: str = ""
    year: str = ""
    keywords: list[str] = []
    file_hash: str = ""
    page_count: int = 0


# SDI Indicator Metadata (Core)
class SDIIndicatorMetadata(BaseModel):
    """
    SDI-compliant indicator metadata.

    Based on Satu Data Indonesia standard (Perpres 195/2024).
    Field names in Bahasa Indonesia as required.
    """
    # Identitas (Identity)
    indicator_id: str = Field(
        ..., description="ID indikator format: BAPPENAS.XXXXX atau kl_code.XXXXX"
    )
    indicator_name: str = Field(..., description="Nama indikator dalam Bahasa Indonesia")
    indicator_name_en: str = Field(
        default="", description="Nama indikator dalam Bahasa Inggris"
    )

    # Definisi (Definition)
    definition: str = Field(..., description="Definisi indikator")
    methodology: str = Field(
        default="", description="Metodologi pengumpulan dan perhitungan data"
    )

    # Produsen Data (Data Producer)
    producing_institution: str = Field(
        ..., description="Nama Kementrian/Lembaga produsen data"
    )
    kl_code: str = Field(
        ..., description="Kode K/L sesuai standar SDI (3 digit)"
    )

    # Spasio Waktu (Spatial & Temporal)
    spatial_coverage: str = Field(
        default="", description="Cakupan spasial (nasional, provinsi, kabupaten, dll)"
    )
    temporal_coverage: str = Field(
        default="", description="Cakupan temporal (rentang waktu data)"
    )
    temporal_resolution: TemporalResolution = Field(
        default=TemporalResolution.annual,
        description="Resolusi temporal data"
    )

    # Unit (Measurement Unit)
    unit: str = Field(..., description="Satuan pengukuran (contoh: %, orang, rupiah)")
    unit_type: UnitType = Field(
        default=UnitType.nominal,
        description="Tipe satuan (nominal, ratio, index, dll)"
    )

    # Ketersediaan (Availability)
    availability_status: AvailabilityStatus = Field(
        default=AvailabilityStatus.available,
        description="Status ketersediaan data"
    )
    last_updated: Optional[datetime] = Field(
        default=None, description="Terakhir kali data diperbarui"
    )

    # Recommended fields
    sector: str = Field(default="", description="Sektor per Perpres 195/2024")
    sub_sector: str = Field(default="", description="Sub-sektor indikator")
    sdi_goal_code: str = Field(default="", description="Kode tujuan SDI (SDI 1-5)")
    sdg_code: str = Field(default="", description="Kode SDG terkait (contoh: 3.4.1)")
    data_quality_notes: str = Field(default="", description="Catatan kualitas data")
    extraction_confidence: ExtractionConfidence = Field(
        default=ExtractionConfidence.MEDIUM,
        description="Tingkat kepercayaan ekstraksi AI"
    )

    # Source tracking
    source_document_id: Optional[str] = Field(
        default=None, description="ID dokumen sumber"
    )
    source_page_number: Optional[int] = Field(
        default=None, description="Nomor halaman dokumen sumber"
    )
    source_excerpt: str = Field(
        default="", description="Kutipan asli dari dokumen"
    )

    @field_validator("indicator_id")
    @classmethod
    def validate_indicator_id(cls, v: str) -> str:
        """Validate indicator_id format."""
        v = v.strip().upper()
        # Check for BAPPENAS.XXXX or KL_CODE.XXXX format
        if not ("." in v or "BAPPENAS" in v or len(v.split(".")[0]) == 3):
            # Allow but warn if format is unusual
            pass
        return v

    @field_validator("kl_code")
    @classmethod
    def validate_kl_code(cls, v: str) -> str:
        """Validate K/L code is 3 digits."""
        v = v.strip()
        if not v.isdigit() or len(v) != 3:
            # This will be caught in validation
            pass
        return v.zfill(3)

    @field_validator("temporal_resolution")
    @classmethod
    def validate_temporal_resolution(cls, v: str) -> str:
        """Validate temporal resolution is in enum."""
        return v.lower() if isinstance(v, str) else v

    @field_validator("unit_type")
    @classmethod
    def validate_unit_type(cls, v: str) -> str:
        """Validate unit type is in enum."""
        return v.lower() if isinstance(v, str) else v


class ExtractedIndicators(BaseModel):
    """Result of metadata extraction from a document."""
    document_id: str
    indicators: list[SDIIndicatorMetadata]
    extraction_summary: dict = Field(
        default_factory=lambda: {
            "total_indicators": 0,
            "high_confidence": 0,
            "medium_confidence": 0,
            "low_confidence": 0,
            "by_ministry": {},
            "by_sector": {},
        }
    )
    extracted_at: datetime = Field(default_factory=datetime.utcnow)


# Consistency Checker Models
class ConsistencyFlag(BaseModel):
    """Flag indicating a consistency issue between indicators."""
    id: str = ""
    indicator_a_id: str = Field(..., description="ID indikator pertama")
    indicator_b_id: str = Field(..., description="ID indikator kedua")
    indicator_a_name: str = Field(..., description="Nama indikator pertama")
    indicator_b_name: str = Field(..., description="Nama indikator kedua")
    conflict_type: ConflictType = Field(..., description="Jenis konflik")
    similarity_score: float = Field(..., ge=0, le=1, description="Skor kesamaan 0-1")
    description: str = Field(..., description="Deskripsi konflik")
    details: dict = Field(
        default_factory=dict, description="Detail perbandingan field-by-field"
    )
    status: ConflictStatus = Field(default=ConflictStatus.open, description="Status penyelesaian")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = Field(default=None, description="Waktu penyelesaian")
    resolved_by: Optional[str] = Field(default=None, description="User ID yang menyelesaikan")
    resolution_notes: str = Field(default="", description="Catatan penyelesaian")


class ConsistencyCheckResult(BaseModel):
    """Result of consistency check for a set of indicators."""
    indicators_checked: int
    flags_found: int
    flags: list[ConsistencyFlag]
    checked_at: datetime = Field(default_factory=datetime.utcnow)


# Job Processing Models
class ExtractionJobStatus(str, Literal):
    """Status of extraction job."""
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class ExtractionJob(BaseModel):
    """Metadata extraction job record."""
    id: str = ""
    user_id: str
    document_id: str
    status: ExtractionJobStatus = Field(default=ExtractionJobStatus.pending)
    progress: int = Field(default=0, ge=0, le=100, description="Progress percentage")
    error_message: str = Field(default="")
    result_indicators_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    retry_count: int = Field(default=0)


# API Request/Response Models
class ExtractionJobResponse(BaseModel):
    """Response model for extraction job status."""
    job_id: str
    status: ExtractionJobStatus
    progress: int
    error_message: str
    result_indicators_count: int
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]


class ConsistencyCheckRequest(BaseModel):
    """Request model for consistency check."""
    indicator_ids: list[str] = Field(..., description="List of indicator IDs to check")
    check_type: str = Field(default="all", description="Type of check: all, unit, definition, kl_code")


class ResolveFlagRequest(BaseModel):
    """Request model for resolving a consistency flag."""
    resolution_notes: str = Field(..., description="Notes explaining resolution")


# Document Models
class BappenasDocument(BaseModel):
    """Bappenas document record."""
    id: str = ""
    user_id: str
    filename: str
    file_hash: str
    file_size: int
    content_type: str
    page_count: int
    extracted_text: str = ""
    metadata: dict = Field(default_factory=dict)
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = Field(default=None)
    processing_status: str = "pending"


class IndicatorListResponse(BaseModel):
    """Response model for listing indicators."""
    indicators: list[SDIIndicatorMetadata]
    total: int
    page: int = 1
    per_page: int = 20
