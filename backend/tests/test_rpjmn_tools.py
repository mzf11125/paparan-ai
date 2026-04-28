"""Tests for RPJMN and RDTII tools."""
from app.tools.rpjmn_tools import score_brief_against_rpjmn, ASTA_CITA_PILLARS
from app.tools.rdtii_tools import map_policy_to_rdtii_pillar, score_policy_against_rdtii, RDTII_PILLARS


def test_rpjmn_returns_8_pillars():
    scores = score_brief_against_rpjmn.invoke({"brief_text": "infrastruktur digital ASEAN"})
    assert len(scores) == 8
    assert all(k in scores for k in ASTA_CITA_PILLARS)


def test_rpjmn_scores_are_floats_in_range():
    scores = score_brief_against_rpjmn.invoke({"brief_text": "korupsi reformasi birokrasi hukum"})
    for v in scores.values():
        assert 0.0 <= v <= 1.0


def test_rpjmn_hits_correct_pillar():
    scores = score_brief_against_rpjmn.invoke({"brief_text": "korupsi kpk reformasi birokrasi transparansi akuntabilitas"})
    assert scores["AC7"] > 0


def test_rdtii_mapper_returns_string():
    result = map_policy_to_rdtii_pillar.invoke({"text": "digital payment fintech cross-border"})
    assert isinstance(result, str)
    assert ":" in result


def test_rdtii_mapper_hits_correct_pillar():
    result = map_policy_to_rdtii_pillar.invoke({"text": "cybersecurity cyber trust encryption"})
    assert "P6" in result


def test_rdtii_score_returns_all_pillars():
    scores = score_policy_against_rdtii.invoke({"text": "e-commerce digital trade platform"})
    assert len(scores) == len(RDTII_PILLARS)
    assert all(0.0 <= v <= 1.0 for v in scores.values())
