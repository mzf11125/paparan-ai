"""Document processor for PDF and text file extraction."""
import hashlib
from io import BytesIO
from typing import Optional

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None


def compute_file_hash(file_content: bytes) -> str:
    """Compute SHA-256 hash of file content for deduplication."""
    return hashlib.sha256(file_content).hexdigest()


def extract_text_from_pdf(file_content: bytes, max_length: int = 50000) -> dict:
    """
    Extract text from PDF file content using pypdf2.

    Args:
        file_content: Raw bytes of PDF file
        max_length: Maximum characters to extract per page

    Returns:
        dict with 'text' (full text), 'pages' (list of page texts),
        'page_count' (number of pages), 'success' (bool), 'error' (str if failed)
    """
    if PdfReader is None:
        return {
            "success": False,
            "error": "pypdf not installed. Install with: pip install pypdf",
            "text": "",
            "pages": [],
            "page_count": 0,
        }

    try:
        pdf_file = BytesIO(file_content)
        reader = PdfReader(pdf_file)

        if not reader.pages:
            return {
                "success": False,
                "error": "PDF file appears to be empty or corrupted",
                "text": "",
                "pages": [],
                "page_count": 0,
            }

        pages = []
        full_text_parts = []

        for i, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    # Limit per page to prevent memory issues
                    page_text = page_text[:max_length]
                    pages.append({
                        "page_number": i + 1,
                        "text": page_text,
                    })
                    full_text_parts.append(page_text)
            except Exception as e:
                pages.append({
                    "page_number": i + 1,
                    "text": f"[Error reading page: {str(e)}]",
                })

        full_text = "\n\n".join(full_text_parts)

        return {
            "success": True,
            "text": full_text,
            "pages": pages,
            "page_count": len(reader.pages),
            "error": None,
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to parse PDF: {str(e)}",
            "text": "",
            "pages": [],
            "page_count": 0,
        }


def extract_text_from_plain_text(file_content: bytes) -> dict:
    """
    Extract text from plain text file content.

    Args:
        file_content: Raw bytes of text file

    Returns:
        dict with 'text', 'pages', 'page_count', 'success', 'error'
    """
    try:
        # Try UTF-8 first, then fallback to other encodings
        encodings = ["utf-8", "latin-1", "cp1252"]
        text = None
        used_encoding = None

        for encoding in encodings:
            try:
                text = file_content.decode(encoding)
                used_encoding = encoding
                break
            except UnicodeDecodeError:
                continue

        if text is None:
            return {
                "success": False,
                "error": "Could not decode text file with common encodings",
                "text": "",
                "pages": [],
                "page_count": 0,
            }

        # Treat the entire file as one page for consistency
        return {
            "success": True,
            "text": text,
            "pages": [{"page_number": 1, "text": text}],
            "page_count": 1,
            "error": None,
            "encoding": used_encoding,
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to parse text file: {str(e)}",
            "text": "",
            "pages": [],
            "page_count": 0,
        }


def extract_text(file_content: bytes, filename: str) -> dict:
    """
    Extract text from PDF or plain text file based on extension.

    Args:
        file_content: Raw bytes of file
        filename: Name of file (used to determine type)

    Returns:
        dict with extraction results
    """
    filename_lower = filename.lower()

    if filename_lower.endswith(".pdf"):
        return extract_text_from_pdf(file_content)
    elif filename_lower.endswith((".txt", ".text", ".md", ".markdown")):
        return extract_text_from_plain_text(file_content)
    else:
        return {
            "success": False,
            "error": f"Unsupported file type: {filename}. Supported: .pdf, .txt, .md",
            "text": "",
            "pages": [],
            "page_count": 0,
        }


def extract_metadata_from_text(text: str) -> dict:
    """
    Attempt to extract basic metadata from document text.

    Args:
        text: Full document text

    Returns:
        dict with detected metadata fields
    """
    import re

    metadata = {
        "title": "",
        "document_type": "",
        "year": "",
        "ministry": "",
        "keywords": [],
    }

    # Try to detect document type (RPJMN, Renstra, etc.)
    doc_type_patterns = [
        (r"RPJMN|Rencana Pembangunan Jangka Menengah Nasional", "RPJMN"),
        (r"Renstra|Rencana Strategis", "Renstra"),
        (r"RKP|Rencana Kerja Pemerintah", "RKP"),
        (r"Rencana Aksi|Action Plan", "Rencana Aksi"),
    ]

    for pattern, doc_type in doc_type_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            metadata["document_type"] = doc_type
            break

    # Try to extract year (4-digit number around common year keywords)
    year_match = re.search(r"(?:tahun|thn|periode\s+)(\d{4})", text, re.IGNORECASE)
    if not year_match:
        year_match = re.search(r"\b(202[0-9]|203[0-9])\b", text)
    if year_match:
        metadata["year"] = year_match.group(1)

    # Try to extract ministry/institution name (Kementrian/Lembaga)
    # Look for patterns like "Kementrian [X]", "Lembaga [Y]"
    ministry_patterns = [
        r"Kementrian\s+([A-Za-z\s]+?)(?:\n|,|\.|$)",
        r"Kementeran\s+([A-Za-z\s]+?)(?:\n|,|\.|$)",
        r"Lembaga\s+([A-Za-z\s]+?)(?:\n|,|\.|$)",
    ]

    for pattern in ministry_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            ministry = match.group(1).strip()
            # Limit length and clean
            ministry = ministry[:50].strip()
            if len(ministry) > 3:
                metadata["ministry"] = ministry
                break

    # Extract keywords from document (frequent terms)
    words = re.findall(r"\b[a-z]{4,}\b", text.lower())
    word_freq = {}
    for word in words:
        word_freq[word] = word_freq.get(word, 0) + 1

    # Get top 10 most common words as keywords
    keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
    metadata["keywords"] = [kw for kw, _ in keywords]

    return metadata
