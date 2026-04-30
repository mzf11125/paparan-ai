"""Bappenas and data.go.id integration tools."""
import httpx
from typing import Optional
from langchain.tools import tool
from app.config import settings


# SDI K/L code mappings (Kementrian/Lembaga codes)
# Based on Satu Data Indonesia standard codes
KL_CODE_MAPPING = {
    # Kementrian
    "Kementrian Dalam Negeri": "001",
    "Kementrian Luar Negeri": "002",
    "Kementrian Pertahanan": "003",
    "Kementrian Hukum dan Hak Asasi Manusia": "004",
    "Kementrian Keuangan": "005",
    "Kementrian Pendidikan Dasar dan Menengah": "006",
    "Kementrian Kesehatan": "007",
    "Kementrian Sosial": "008",
    "Kementrian Tenaga Kerja": "009",
    "Kementrian Pariwisata dan Ekonomi Kreatif": "010",
    "Kementrian Perdagangan": "011",
    "Kementrian Pertanian": "012",
    "Kementrian Kelautan dan Perikanan": "013",
    "Kementrian Energi dan Sumber Daya Mineral": "014",
    "Kementrian Industri": "015",
    "Kementrian Perhubungan": "016",
    "Kementrian Komunikasi dan Informatika": "017",
    "Kementrian Badan Usaha Milik Negara": "018",
    "Kementrian Agraria dan Tata Ruang": "019",
    "Kementrian Lingkungan Hidup dan Kehutanan": "020",
    "Kementrian Koperasi dan UKM": "021",
    "Kementrian Pemberdayaan Perempuan dan Perlindungan Anak": "022",
    "Kementrian Pemberdayaan Aparatur Negara dan Reformasi Birokrasi": "023",
    "Kementrian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi": "024",
    "Kementrian Agama": "025",
    "Kementrian Koordinator Bidang Politik, Hukum, dan Keamanan": "026",
    "Kementrian Koordinator Bidang Ekonomi": "027",
    "Kementrian Koordinator Bidang Pembangunan Manusia dan Kebudayaan": "028",
    "Kementrian Koordinator Bidang Kemaritiman dan Investasi": "029",
    "Kementrian Investasi/BKPM": "030",
    # Lembaga
    "Bappenas": "101",
    "Badan Pusat Statistik": "102",
    "Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah": "103",
    "Badan Pengelola Keuangan Haji": "104",
    "Badan Pengawas Perdagangan Berjangka Komoditi": "105",
    "Badan Pengawas Tenaga Nuklir": "106",
    "Badan Tenaga Nuklir Nasional": "107",
    "Badan Pengkajian dan Penerapan Teknologi": "108",
    "Badan Riset dan Inovasi Nasional": "109",
    "Badan Informasi Geospasial": "110",
    "Badan Pengawas Pemilihan Umum": "111",
    "Komisi Pemilihan Umum": "112",
    "Badan Pengawasan Keuangan dan Pembangunan": "113",
    "Badan Pemeriksa Keuangan": "114",
    "Badan Nasional Penanggulangan Bencana": "115",
    "Badan Narkotika Nasional": "116",
    "Otoritas Jasa Keuangan": "117",
    "Lembaga Penjamin Simpanan": "118",
    "Badan Pengelola Transportasi Jabodetabek": "119",
    "Lembaga Penyiaran Publik RRI": "120",
    "Lembaga Penyiaran Publik TVRI": "121",
    "Badan Standardisasi dan Kebijakan Jasa Industri": "122",
    "Badan Pengawas Obat dan Makanan": "123",
    "Komisi Pengawas Persaingan Usaha": "124",
    "Komisi Pemberantasan Korupsi": "125",
    "Komisi Nasional Hak Asasi Manusia": "126",
    "Komisi Informasi": "127",
    "Komisi Pengawas Persaingan Usaha Daerah": "128",
    "Ombudsman Republik Indonesia": "129",
    "Komisi Aparatur Sipil Negara": "130",
    "Komisi Nasional Lanjut Usia": "131",
    "Komisi Nasional Disabilitas": "132",
    "Komisi Nasional Anti Kekerasan terhadap Perempuan": "133",
    "Komisi Nasional Kekekerasan Anak": "134",
    "Komisi Pengawas Persaingan Usaha": "135",
    "Arsip Nasional Republik Indonesia": "136",
    "Perpustakaan Nasional": "137",
    "Badan Meteorologi, Klimatologi, dan Geofisika": "138",
    "Badan Standardisasi Nasional": "139",
    "Badan Ketahanan Pangan": "140",
    "Badan Narkotika Nasional": "141",
    "Badan Nasional Pengelola Perbatasan": "142",
    "Komisi Nasional Anti Kekerasan terhadap Perempuan": "143",
    "Komisi Pengawas Persaingan Usaha Daerah": "144",
    "Badan Pembinaan Ideologi Pancasila": "145",
    "Badan Intelijen Negara": "146",
    "Badan Siber dan Sandi Negara": "147",
    "Kementrian Investasi/BKPM": "148",
}

# SDI goal codes based on Perpres 195/2024
SDI_GOAL_MAPPING = {
    "SDI 1": "Memperkuat data untuk pembangunan SDGs",
    "SDI 2": "Memperkuat data untuk pembangunan berkelanjutan",
    "SDI 3": "Memperkuat data untuk pembangunan inklusif",
    "SDI 4": "Memperkuat data untuk pembangunan berbasis wilayah",
    "SDI 5": "Memperkuat data untuk pemerintahan berbasis data",
}

# Sector mapping based on Perpres 195/2024
SECTOR_MAPPING = {
    "Ekonomi": ["01", "Ekonomi Makro", "Pembangunan Ekonomi"],
    "Sosial": ["02", "Kesejahteraan Sosial", "Pemberdayaan Masyarakat"],
    "Politik": ["03", "Politik Hukum dan Keamanan", "Demokrasi"],
    "Pertahanan": ["04", "Pertahanan", "Keamanan"],
    "Hukum": ["05", "Hukum", "Hak Asasi Manusia"],
    "Pendidikan": ["06", "Pendidikan", "Kebudayaan"],
    "Kesehatan": ["07", "Kesehatan", "Pelayanan Kesehatan"],
    "Pembangunan": ["08", "Pembangunan", "Perumahan"],
    "Lingkungan": ["09", "Lingkungan Hidup", "Kehutanan"],
    "Pertanian": ["10", "Pertanian", "Ketahanan Pangan"],
    "Kelautan": ["11", "Kelautan", "Perikanan"],
    "Energi": ["12", "Energi", "Sumber Daya Mineral"],
    "Industri": ["13", "Industri", "Perdagangan"],
    "Perhubungan": ["14", "Perhubungan", "Transportasi"],
    "Komunikasi": ["15", "Komunikasi", "Informatika"],
    "Pariwisata": ["16", "Pariwisata", "Ekonomi Kreatif"],
    "Keuangan": ["17", "Keuangan", "Perbankan"],
    "Tenaga Kerja": ["18", "Tenaga Kerja", "Ketenagakerjaan"],
    "Pemberdayaan": ["19", "Pemberdayaan", "Koperasi UKM"],
}

# Unit type enum
UNIT_TYPE_ENUM = ["nominal", "ratio", "index", "count", "percentage", "rate", "duration", "currency"]

# Temporal resolution enum
TEMPORAL_RESOLUTION_ENUM = [
    "realtime",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "quarterly",
    "semiannual",
    "annual",
    "biennial",
    "quinary",
]

# Availability status enum
AVAILABILITY_STATUS_ENUM = ["available", "partial", "scheduled", "discontinued"]


@tool
def get_kl_code(kl_name: str) -> str:
    """Get K/L code from Kementrian/Lembaga name.

    Args:
        kl_name: Name of Kementrian or Lembaga

    Returns:
        K/L code string (e.g., "007" for Kementrian Kesehatan)
    """
    # Try exact match first
    if kl_name in KL_CODE_MAPPING:
        return KL_CODE_MAPPING[kl_name]

    # Try case-insensitive partial match
    kl_name_lower = kl_name.lower()
    for name, code in KL_CODE_MAPPING.items():
        if kl_name_lower in name.lower() or name.lower() in kl_name_lower:
            return code

    # Return default/unknown code
    return "999"


@tool
def get_kl_name(kl_code: str) -> str:
    """Get K/L name from code.

    Args:
        kl_code: K/L code (e.g., "007")

    Returns:
        Kementrian/Lembaga name
    """
    for name, code in KL_CODE_MAPPING.items():
        if code == kl_code:
            return name
    return "Unknown"


@tool
def get_sector_code(sector_name: str) -> str:
    """Get sector code from sector name.

    Args:
        sector_name: Sector name (e.g., "Kesehatan")

    Returns:
        Sector code (e.g., "07")
    """
    for sector, codes in SECTOR_MAPPING.items():
        if sector_name.lower() in [c.lower() for c in codes]:
            return codes[0]
    return "00"


@tool
def get_sdi_goal_code(goal_name: str) -> str:
    """Get SDI goal code from goal description.

    Args:
        goal_name: SDI goal name or description

    Returns:
        SDI goal code (e.g., "SDI 1")
    """
    goal_lower = goal_name.lower()
    for code, desc in SDI_GOAL_MAPPING.items():
        if goal_lower in desc.lower() or desc.lower() in goal_lower:
            return code
    return ""


@tool
def search_data_go_id(query: str, category: str = "", limit: int = 5) -> str:
    """Search data.go.id for datasets and indicators.

    Args:
        query: Search query for datasets/indicators
        category: Optional category filter (e.g., "kesehatan", "ekonomi")
        limit: Maximum number of results to return

    Returns:
        JSON string of search results from data.go.id
    """
    try:
        base_url = "https://satudata.go.id/api/v1"

        # Build search parameters
        params = {
            "q": query,
            "limit": min(limit, 20),
        }
        if category:
            params["category"] = category

        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{base_url}/search", params=params)
            response.raise_for_status()
            data = response.json()

            # Format results as readable text
            results = data.get("results", [])
            if not results:
                return f"No results found for query: {query}"

            formatted = []
            for r in results[:limit]:
                formatted.append(
                    f"Title: {r.get('title', 'N/A')}\n"
                    f"Organization: {r.get('organization', 'N/A')}\n"
                    f"Category: {r.get('category', 'N/A')}\n"
                    f"Description: {r.get('description', 'N/A')[:200]}\n"
                    f"URL: {r.get('url', 'N/A')}\n"
                )
            return "\n---\n".join(formatted)

    except Exception as e:
        return f"Error searching data.go.id: {str(e)}"


@tool
def get_bappenas_metadata(document_url: str) -> dict:
    """Fetch metadata from Bappenas document URL.

    Args:
        document_url: URL to Bappenas or data.go.id document

    Returns:
        Dictionary with document metadata
    """
    try:
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            # For data.go.id, use their API if available
            if "satudata.go.id" in document_url or "data.go.id" in document_url:
                # Try to extract dataset ID from URL
                # Pattern: https://satudata.go.id/dataset/{id}
                parts = document_url.rstrip("/").split("/")
                dataset_id = parts[-1] if parts else None

                if dataset_id:
                    api_url = f"https://satudata.go.id/api/v1/dataset/{dataset_id}"
                    response = client.get(api_url)
                    response.raise_for_status()
                    return response.json()

            # For other Bappenas URLs, try to fetch and parse
            response = client.get(document_url, headers={"User-Agent": "Mozilla/5.0"})
            response.raise_for_status()

            # Basic metadata extraction from HTML
            import re
            html = response.text

            # Try to extract title
            title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE)
            title = title_match.group(1) if title_match else ""

            # Try to extract meta description
            desc_match = re.search(r'<meta\s+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
            description = desc_match.group(1) if desc_match else ""

            return {
                "title": title,
                "description": description,
                "url": document_url,
                "source": "bappenas",
            }

    except Exception as e:
        return {
            "title": "",
            "description": "",
            "url": document_url,
            "source": "bappenas",
            "error": str(e),
        }


@tool
def validate_kl_code(kl_code: str) -> bool:
    """Validate if a K/L code exists in SDI standard.

    Args:
        kl_code: K/L code to validate (e.g., "007")

    Returns:
        True if valid, False otherwise
    """
    return any(code == kl_code for code in KL_CODE_MAPPING.values())


@tool
def validate_unit_type(unit_type: str) -> bool:
    """Validate if unit type is in SDI standard enum.

    Args:
        unit_type: Unit type to validate (e.g., "nominal", "ratio")

    Returns:
        True if valid, False otherwise
    """
    return unit_type.lower() in [ut.lower() for ut in UNIT_TYPE_ENUM]


@tool
def validate_temporal_resolution(temporal_resolution: str) -> bool:
    """Validate if temporal resolution is in SDI standard enum.

    Args:
        temporal_resolution: Temporal resolution to validate (e.g., "monthly")

    Returns:
        True if valid, False otherwise
    """
    return temporal_resolution.lower() in [tr.lower() for tr in TEMPORAL_RESOLUTION_ENUM]


@tool
def get_all_kl_codes() -> str:
    """Get all available K/L codes and names.

    Returns:
        Formatted string of all K/L codes
    """
    lines = ["Kementrian/Lembaga Codes (SDI Standard):", ""]
    for name, code in sorted(KL_CODE_MAPPING.items(), key=lambda x: x[1]):
        lines.append(f"{code}: {name}")
    return "\n".join(lines)


@tool
def get_all_sectors() -> str:
    """Get all available sectors and their codes.

    Returns:
        Formatted string of all sectors
    """
    lines = ["Sectors (Perpres 195/2024):", ""]
    for sector, codes in SECTOR_MAPPING.items():
        lines.append(f"{codes[0]}: {sector} - {', '.join(codes[1:])}")
    return "\n".join(lines)


@tool
def get_all_sdi_goals() -> str:
    """Get all SDI goals and their codes.

    Returns:
        Formatted string of all SDI goals
    """
    lines = ["SDI Goals (Perpres 195/2024):", ""]
    for code, desc in SDI_GOAL_MAPPING.items():
        lines.append(f"{code}: {desc}")
    return "\n".join(lines)


@tool
def resolve_abbreviation(text: str) -> str:
    """Resolve common Indonesian government abbreviations.

    Args:
        text: Text containing potential abbreviations

    Returns:
        Text with resolved abbreviations
    """
    abbreviations = {
        "K/L": "Kementrian/Lembaga",
        "K/L-": "Kementrian/Lembaga-",
        "BPS": "Badan Pusat Statistik",
        "Bappenas": "Badan Perencanaan Pembangunan Nasional",
        "Kemenkes": "Kementrian Kesehatan",
        "Kemendikbud": "Kementrian Pendidikan, Kebudayaan, Riset, dan Teknologi",
        "Kemendikbudristek": "Kementrian Pendidikan, Kebudayaan, Riset, dan Teknologi",
        "Kemenkeu": "Kementrian Keuangan",
        "Kemenlu": "Kementrian Luar Negeri",
        "Kemenag": "Kementrian Agama",
        "Kemenhub": "Kementrian Perhubungan",
        "Kemendagri": "Kementrian Dalam Negeri",
        "Kemenparekraf": "Kementrian Pariwisata dan Ekonomi Kreatif",
        "Kemendag": "Kementrian Perdagangan",
        "Kemendik": "Kementrian Perindustrian",
        "Kementan": "Kementrian Pertanian",
        "Kemendesa": "Kementrian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi",
        "Kemenkop UKM": "Kementrian Koperasi dan UKM",
        "PPPA": "Kementrian Pemberdayaan Perempuan dan Perlindungan Anak",
        "PAN RB": "Kementrian Pemberdayaan Aparatur Negara dan Reformasi Birokrasi",
        "PUPR": "Kementrian Pekerjaan Umum dan Perumahan Rakyat",
        "ESDM": "Kementrian Energi dan Sumber Daya Mineral",
        "LHK": "Kementrian Lingkungan Hidup dan Kehutanan",
        "KKP": "Kementrian Kelautan dan Perikanan",
        "Kominfo": "Kementrian Komunikasi dan Informatika",
        "BPJS": "Badan Penyelenggara Jaminan Sosial",
        "OJK": "Otoritas Jasa Keuangan",
        "LPS": "Lembaga Penjamin Simpanan",
        "BPK": "Badan Pemeriksa Keuangan",
        "BPKP": "Badan Pengawas Keuangan dan Pembangunan",
        "KPK": "Komisi Pemberantasan Korupsi",
        "Ombudsman": "Ombudsman Republik Indonesia",
    }

    result = text
    for abbrev, full in abbreviations.items():
        result = result.replace(abbrev, full)
    return result
