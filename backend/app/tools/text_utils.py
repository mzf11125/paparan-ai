"""Text post-processing utilities for policy document generation."""
import re

# Em dash (—), en dash (–), horizontal bar (―)
_DASH_RE = re.compile(r'\s*[—–―]\s*')


def sanitize_text(text: str) -> str:
    """Replace em/en dashes with comma or period to avoid AI-detection flags.

    Rules:
    - dash at end of clause before lowercase → replace with comma
    - dash between two capitalised words / start of new clause → replace with period + space
    - fallback → replace with comma
    """
    def _replace(m: re.Match) -> str:
        start = m.start()
        end = m.end()
        before = text[start - 1] if start > 0 else ''
        after = text[end] if end < len(text) else ''
        if after.isupper():
            return '. '
        if after.islower() or after in ('"', "'", '('):
            return ', '
        return ', '

    return _DASH_RE.sub(_replace, text)


def sanitize_brief_text(data: dict) -> dict:
    """Recursively sanitize all string values in a brief dict."""
    if isinstance(data, dict):
        return {k: sanitize_brief_text(v) for k, v in data.items()}
    if isinstance(data, list):
        return [sanitize_brief_text(i) for i in data]
    if isinstance(data, str):
        return sanitize_text(data)
    return data
