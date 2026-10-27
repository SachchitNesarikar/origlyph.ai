"""Health check and metadata routes."""
from fastapi import APIRouter
from ..config import settings
from ..models.api import HealthResponse
from ..services.artifact_store import store

router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return backend health and catalog statistics."""
    playable = len(store.get_playable())
    total = len(store.get_all())
    env = settings.ENV
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        playable_artifacts=playable,
        total_artifacts=total,
        environment=env,
    )


@router.get("/manifest")
def get_manifest():
    """Return dataset source manifest and attribution records."""
    return store.get_manifest()
