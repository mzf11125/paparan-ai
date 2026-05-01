import os
from pathlib import Path

_REPO_ROOT = Path(__file__).parent.parent.parent.parent
_SKILLS_DIR = _REPO_ROOT / ".agents" / "skills"
_CLAUDE_SKILLS_DIR = _REPO_ROOT / ".claude" / "skills"


def get_skill_prompt(skill_name: str) -> str:
    """Load a skill's SKILL.md as a system prompt fragment.

    Searches .agents/skills first, then .claude/skills (resolving symlinks).
    """
    for base in (_SKILLS_DIR, _CLAUDE_SKILLS_DIR):
        for path in base.rglob("SKILL.md"):
            if skill_name.lower() in path.parent.name.lower():
                return path.read_text()
    return f"# {skill_name}\nNo skill file found. Proceed with general expertise."


def get_humanizer_prompt() -> str:
    """Return the humanizer-zh skill prompt for injection into document-generating calls."""
    return get_skill_prompt("humanizer-zh")
