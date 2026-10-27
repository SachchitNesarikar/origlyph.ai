"""Tests for progressive hint engine, evidence grounding, and answer leakage prevention."""
import re
from app.services.artifact_store import store
from app.services.hint_engine import generate_hint


def test_hint_generation_all_playable_artifacts():
    """All playable artifacts must generate progressive hints for levels 1, 2, and 3."""
    playable = store.get_playable()
    assert len(playable) > 0

    for artifact in playable:
        for level in [1, 2, 3]:
            hint = generate_hint(artifact, artifact.verified_facts, level)
            assert hint.artifact_id == artifact.id
            assert hint.hint_level == level
            assert len(hint.hint_text) > 10
            assert len(hint.supporting_fact_ids) > 0
            assert hint.score_penalty > 0


def test_hint_does_not_leak_answer_coordinates():
    """
    CRITICAL SECURITY CHECK:
    Hint text must never disclose the numerical target coordinates (latitude / longitude).
    """
    for artifact in store.get_playable():
        lat_str = f"{artifact.latitude:.2f}"
        lon_str = f"{artifact.longitude:.2f}"

        for level in [1, 2, 3]:
            hint = generate_hint(artifact, artifact.verified_facts, level)
            payload_str = str(hint.model_dump())

            # Check that exact coordinate floating numbers are absent
            assert lat_str not in hint.hint_text, f"Target latitude leaked in hint level {level} for {artifact.id}"
            assert lon_str not in hint.hint_text, f"Target longitude leaked in hint level {level} for {artifact.id}"
            assert "latitude" not in payload_str.lower()
            assert "longitude" not in payload_str.lower()


def test_hint_for_empty_facts():
    """Artifact with no verified facts returns safe uncertainty notice."""
    empty_art = store.get_all()[0].model_copy()
    hint = generate_hint(empty_art, [], 1)
    assert "insufficient" in hint.hint_text.lower()
    assert hint.caveat_or_uncertainty is not None
