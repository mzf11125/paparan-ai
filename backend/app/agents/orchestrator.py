from app.agents.researcher import run_researcher
from app.agents.gov_intel import run_gov_intel
from app.agents.analyst import run_analyst
from app.agents.scraper import run_scraper
from app.tools.supabase_tools import save_paparan_report
from app.db.schema import PolicyBrief, GenerateBriefRequest


def run_orchestrator(req: GenerateBriefRequest) -> PolicyBrief:
    """Route request to appropriate agents, synthesize, and save."""
    topic_lower = req.topic.lower()

    # Run relevant sub-agents based on topic
    if any(k in topic_lower for k in ["financial", "bank", "ojk", "crypto", "islamic", "fintech"]):
        run_analyst(req.topic, req.region)
    else:
        run_gov_intel(req.topic, req.region)

    # Deep research agent produces the final structured brief
    brief = run_researcher(req.topic, req.region)
    brief.classification = req.classification

    # Persist
    save_paparan_report.invoke({"report": brief.model_dump()})
    return brief
