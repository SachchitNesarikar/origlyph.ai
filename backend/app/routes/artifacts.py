"""Artifact gameplay, evaluation, hints, and provenance routes."""
from typing import List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from ..config import settings
from ..models.artifact import Artifact, ArtifactChallengeView
from ..models.api import (
    GuessRequest,
    GuessResponse,
    HintRequest,
    HintResponse,
    ProvenanceGraphResponse,
)
from ..services.artifact_store import store
from ..services.geo import haversine_distance, calculate_score, get_accuracy_rating
from ..services.hint_engine import generate_hint
from ..services.provenance import build_artifact_provenance_graph, build_global_provenance_graph

router = APIRouter(prefix="/artifacts", tags=["Artifacts"])


@router.get("", response_model=List[ArtifactChallengeView])
def list_artifacts(
    playable_only: bool = Query(False, description="Filter only to playable artifacts with verified coordinates")
) -> List[ArtifactChallengeView]:
    """Retrieve catalog of artifacts for selection or challenge initiation."""
    artifacts = store.get_playable() if playable_only else store.get_all()
    return [v for v in (store.get_challenge_view(a.id) for a in artifacts) if v]


@router.get("/{artifact_id}", response_model=ArtifactChallengeView)
def get_artifact(
    artifact_id: str,
    reveal: bool = Query(False, deprecated=True, description="Ignored since v2: answers are only returned by POST /guess"),
) -> ArtifactChallengeView:
    """
    Retrieve the player-facing artifact view. Coordinates and the full record are
    returned only by the guess endpoint (v1 let `reveal=true` leak the answer).
    """
    view = store.get_challenge_view(artifact_id)
    if not view:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact with ID '{artifact_id}' not found",
        )
    return view


@router.post("/{artifact_id}/hint", response_model=HintResponse)
def get_hint(artifact_id: str, payload: HintRequest = HintRequest()) -> HintResponse:
    """
    Request a progressive evidence-grounded hint for the artifact.
    Does not leak hidden coordinate numbers.
    """
    artifact = store.get_by_id(artifact_id)
    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact with ID '{artifact_id}' not found",
        )

    return generate_hint(artifact, artifact.verified_facts, payload.hint_level)


@router.post("/{artifact_id}/guess", response_model=GuessResponse)
def submit_guess(artifact_id: str, guess: GuessRequest) -> GuessResponse:
    """
    Submit a geographic coordinate guess for an artifact.
    Computes Haversine distance, applies exponential scoring, penalizes hints used,
    and returns full supporting provenance and answer record.
    """
    artifact = store.get_by_id(artifact_id)
    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact with ID '{artifact_id}' not found",
        )

    # Ensure unverified records cannot be scored
    if not artifact.is_playable or artifact.latitude is None or artifact.longitude is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Artifact '{artifact_id}' lacks verified coordinates or is excluded from "
                "scored challenge mode. Coordinates must be supported by archival evidence."
            ),
        )

    # Calculate exact distance using Haversine formula
    distance_km = haversine_distance(
        guess.latitude,
        guess.longitude,
        artifact.latitude,
        artifact.longitude,
    )

    # Calculate exponential decay score and hint penalties
    base_score, penalty, final_score = calculate_score(
        distance_km,
        hints_used=guess.hints_used,
    )

    accuracy_rating = get_accuracy_rating(distance_km)

    return GuessResponse(
        artifact_id=artifact.id,
        guess_latitude=guess.latitude,
        guess_longitude=guess.longitude,
        target_latitude=artifact.latitude,
        target_longitude=artifact.longitude,
        distance_km=distance_km,
        base_score=base_score,
        hint_penalty=penalty,
        final_score=final_score,
        max_score=5000,
        location_basis=artifact.location_basis or "creation",
        accuracy_rating=accuracy_rating,
        artifact=artifact,
    )


@router.get("/{artifact_id}/relations", response_model=ProvenanceGraphResponse)
def get_relations(artifact_id: str) -> ProvenanceGraphResponse:
    """
    Retrieve provenance graph nodes and edges for an artifact, connecting
    creators, places, cultural traditions, collections, and related records.
    """
    artifact = store.get_by_id(artifact_id)
    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact with ID '{artifact_id}' not found",
        )

    return build_artifact_provenance_graph(artifact)


@router.post("/{artifact_id}/narrate")
async def narrate_artifact(artifact_id: str):
    """Return a narrated audio preview when ElevenLabs is configured."""
    artifact = store.get_by_id(artifact_id)
    if not artifact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact with ID '{artifact_id}' not found",
        )

    if not settings.ELEVENLABS_API_KEY or not settings.ELEVENLABS_VOICE_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ElevenLabs is not configured. Add ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID to enable narration.",
        )

    summary = (
        artifact.title
        + ". "
        + (artifact.description or "A significant cultural artifact from the archives.")
    )

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}",
                headers={
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": settings.ELEVENLABS_API_KEY,
                },
                json={
                    "text": summary,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.8},
                },
            )
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Narration failed: {exc}",
        ) from exc

    return StreamingResponse(response.iter_bytes(), media_type="audio/mpeg")
