"""Integration and route tests for FastAPI endpoints, request models, error handling, and reveal payloads."""
import pytest
from fastapi import HTTPException
from app.models.api import GuessRequest, HintRequest
from app.routes.health import get_health, get_manifest
from app.routes.artifacts import (
    list_artifacts,
    get_artifact,
    get_hint,
    submit_guess,
    get_relations,
)


def test_health_endpoint():
    """Verify health endpoint returns status ok and artifact counts."""
    health = get_health()
    assert health.status == "ok"
    assert health.playable_artifacts >= 7
    assert health.total_artifacts >= 8
    assert health.version == "2.0.0"
    assert health.environment


def test_manifest_endpoint():
    """Verify manifest endpoint returns institutions and replacement guidelines."""
    manifest = get_manifest()
    assert "institutions" in manifest
    assert len(manifest["institutions"]) >= 5
    assert "replacement_guidelines" in manifest


def test_list_artifacts_withholds_coordinates():
    """Artifact list for players must never include latitude or longitude."""
    artifacts = list_artifacts(playable_only=False)
    assert len(artifacts) >= 8

    for view in artifacts:
        # Pydantic model serialization check
        serialized = view.model_dump()
        assert "latitude" not in serialized
        assert "longitude" not in serialized
        assert view.id
        assert view.title


def test_get_artifact_unknown_id():
    """Requesting an unknown artifact ID raises HTTP 404."""
    with pytest.raises(HTTPException) as excinfo:
        get_artifact("nonexistent-artifact-999")
    assert excinfo.value.status_code == 404
    assert "not found" in excinfo.value.detail.lower()


def test_get_artifact_challenge_mode_hides_coordinates():
    """Standard get_artifact (reveal=False) must withhold coordinates."""
    view = get_artifact("artifact-001", reveal=False)
    serialized = view.model_dump()
    assert "latitude" not in serialized
    assert "longitude" not in serialized


def test_reveal_flag_no_longer_leaks_answer():
    """v1 returned the full record (with coordinates) for reveal=true; v2 must not."""
    view = get_artifact("artifact-001", reveal=True)
    serialized = view.model_dump()
    assert "latitude" not in serialized
    assert "longitude" not in serialized
    assert "verified_facts" not in serialized


def test_hint_endpoint():
    """Requesting hint level 1 returns evidence context and penalty."""
    hint_req = HintRequest(hint_level=1)
    hint_resp = get_hint("artifact-001", hint_req)
    assert hint_resp.artifact_id == "artifact-001"
    assert hint_resp.hint_level == 1
    assert hint_resp.score_penalty == 500
    assert len(hint_resp.supporting_fact_ids) > 0


def test_guess_submission_and_reveal_payload():
    """Valid guess submission computes score, distance, and returns full evidence reveal payload."""
    # Near Tokyo (35.65, 139.70)
    guess_req = GuessRequest(latitude=35.6500, longitude=139.7000, hints_used=1)
    result = submit_guess("artifact-001", guess_req)

    assert result.artifact_id == "artifact-001"
    assert result.distance_km < 10.0
    assert result.base_score > 4700
    assert result.hint_penalty == 500
    assert result.final_score == result.base_score - 500
    assert result.target_latitude == 35.6895
    assert result.target_longitude == 139.6917

    # Verify supporting record and citations in reveal payload
    rec = result.artifact
    assert rec.title == "Under the Wave off Kanagawa (The Great Wave)"
    assert rec.source_url == "https://www.metmuseum.org/art/collection/search/45434"
    assert len(rec.verified_facts) >= 2
    assert rec.verified_facts[0].source_citation
    assert len(rec.relations) >= 3


def test_guess_on_unplayable_fixture_rejected():
    """Attempting a scored guess on an unverified fixture record raises 400 Bad Request."""
    guess_req = GuessRequest(latitude=10.0, longitude=10.0, hints_used=0)
    with pytest.raises(HTTPException) as excinfo:
        submit_guess("fixture-unverified-001", guess_req)
    assert excinfo.value.status_code == 400
    assert "lacks verified coordinates" in excinfo.value.detail


def test_relations_endpoint():
    """Verify relations endpoint returns provenance graph nodes and edges."""
    graph = get_relations("artifact-001")
    assert graph.artifact_id == "artifact-001"
    assert len(graph.nodes) >= 4
    assert len(graph.edges) >= 3

    center = next((n for n in graph.nodes if n.is_center), None)
    assert center is not None
    assert center.id == "artifact-001"
