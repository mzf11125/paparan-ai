"""RPJMN alignment scoring agent."""
from deepagents import create_deep_agent
from app.tools.rpjmn_tools import score_brief_against_rpjmn, get_rpjmn_pillar_info, generate_talking_points
from app.tools.rdtii_tools import map_policy_to_rdtii_pillar, score_policy_against_rdtii
from app.db.schema import PolicyBrief
from app.llm import get_agent_model, get_agent_kwargs

_SYSTEM = """You are an RPJMN alignment analyst. Given a policy brief, score it against
RPJMN 2025-2029 Asta Cita pillars and identify RDTII pillar relevance.
Use score_brief_against_rpjmn and score_policy_against_rdtii tools.
Return a JSON object with rpjmn_alignment and rdtii_alignment dicts."""

_scorer = create_deep_agent(
    model=get_agent_model(),
    tools=[score_brief_against_rpjmn, get_rpjmn_pillar_info, map_policy_to_rdtii_pillar, score_policy_against_rdtii],
    system_prompt=_SYSTEM,
    **get_agent_kwargs(),
)


def run_rpjmn_scorer(brief: PolicyBrief) -> PolicyBrief:
    """Score brief against RPJMN pillars and attach alignment scores."""
    brief_text = f"{brief.title}\n{brief.currentSituation}\n{brief.implications}\n" + \
                 " ".join(brief.executiveSummary)

    # Direct scoring without LLM overhead for reliability
    rpjmn_scores = score_brief_against_rpjmn.invoke({"brief_text": brief_text})
    rdtii_scores = score_policy_against_rdtii.invoke({"text": brief_text})

    brief.rpjmn_alignment = {"rpjmn": rpjmn_scores, "rdtii": rdtii_scores}
    return brief
