"""API request and response models for Origlyph endpoints."""
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from .artifact import Artifact, ArtifactChallengeView, Relation


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "2.0.0"
    playable_artifacts: int
    total_artifacts: int
    environment: str


class GuessRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Player guess latitude between -90 and 90")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Player guess longitude between -180 and 180")
    hints_used: int = Field(0, ge=0, le=3, description="Number of progressive hints used during this round")

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if v < -90.0 or v > 90.0:
            raise ValueError("Latitude must be between -90.0 and 90.0")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if v < -180.0 or v > 180.0:
            raise ValueError("Longitude must be between -180.0 and 180.0")
        return v


class GuessResponse(BaseModel):
    artifact_id: str
    guess_latitude: float
    guess_longitude: float
    target_latitude: float
    target_longitude: float
    distance_km: float
    base_score: int
    hint_penalty: int
    final_score: int
    max_score: int = 5000
    location_basis: str
    accuracy_rating: str
    artifact: Artifact


class HintRequest(BaseModel):
    hint_level: int = Field(1, ge=1, le=3, description="Progressive hint tier (1 = subtle context, 2 = regional clues, 3 = specific landmark/cultural clues)")


class HintResponse(BaseModel):
    artifact_id: str
    hint_level: int
    hint_text: str
    score_penalty: int
    supporting_fact_ids: List[str]
    caveat_or_uncertainty: Optional[str] = None


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "Artifact", "Creator", "Place", "Cultural Tradition", "Collection"
    is_center: bool = False
    metadata: dict = Field(default_factory=dict)


class GraphEdge(BaseModel):
    source: str
    target: str
    label: str
    evidence_source_id: Optional[str] = None
    notes: Optional[str] = None


class ProvenanceGraphResponse(BaseModel):
    artifact_id: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
