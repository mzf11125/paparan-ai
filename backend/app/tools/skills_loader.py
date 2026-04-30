import os
from pathlib import Path

# Skills are installed by Claude Code's `npx skills add` command.
# They live in .claude/skills/<skill-name>/SKILL.md relative to the repo root.
_REPO_ROOT = Path(__file__).parent.parent.parent.parent
_SKILLS_DIR = _REPO_ROOT / ".claude" / "skills"


def get_skill_prompt(skill_name: str) -> str:
    """Load a skill's SKILL.md as a system prompt fragment."""
    # Try exact match first, then fuzzy match (skills may have ' copy' suffix)
    for path in _SKILLS_DIR.rglob("SKILL.md"):
        if skill_name.lower() in path.parent.name.lower():
            return path.read_text()
    return f"# {skill_name}\nNo skill file found. Proceed with general expertise."
