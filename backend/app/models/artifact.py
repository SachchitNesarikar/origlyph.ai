"""Data models for Origlyph cultural heritage artifacts and provenance."""
from typing import List, Optional
from pydantic import BaseModel, Field


class VerifiedFact(BaseModel):
    id: str = Field(..., description="Unique fact identifier, e.g. f001-1")
    category: str = Field(..., description="Category: geography, production, excavation, epigraphy, etc.")
    fact_text: str = Field(..., description="Evidence-supported historical fact text")
    source_citation: str = Field(..., description="Canonical citation or accession reference")


class Relation(BaseModel):
    target_id: str = Field(..., description="Identifier of the target entity")
    relation_type: str = Field(..., description="Semantic predicate: created by, created in, associated with, held by, related to")
    target_name: str = Field(..., description="Human-readable title or label of the target entity")
    target_type: str = Field(..., description="Target entity type: Creator, Place, Cultural Tradition, Collection, Artifact")
    evidence_source_id: Optional[str] = Field(None, description="Supporting verified fact or source id")
    notes: Optional[str] = Field(None, description="Curatorial explanation of why this connection exists")


class Artifact(BaseModel):
    """Full canonical artifact schema per Origlyph specification."""
    id: str = Field(..., description="Unique artifact ID, e.g. artifact-001")
    title: str = Field(..., description="Documented artifact title")
    description: str = Field(..., description="Source-supported description")
    media_url: Optional[str] = Field(None, description="Direct URL to media image or file")
    thumbnail_url: Optional[str] = Field(None, description="URL to thumbnail preview")
    source_name: str = Field(..., description="Source institution or archive")
    source_url: str = Field(..., description="Canonical record URL")
    creator: Optional[str] = Field(None, description="Attributed creator or artisan workshop")
    date_created: Optional[str] = Field(None, description="Documented date or era")
    creation_location: Optional[str] = Field(None, description="Where artifact was manufactured/painted")
    depicted_location: Optional[str] = Field(None, description="Geographic place depicted in the artwork")
    discovery_location: Optional[str] = Field(None, description="Archaeological site where uncovered")
    current_collection: Optional[str] = Field(None, description="Holding museum or institution")
    latitude: Optional[float] = Field(None, description="Target decimal latitude for scored challenge")
    longitude: Optional[float] = Field(None, description="Target decimal longitude for scored challenge")
    location_basis: Optional[str] = Field(None, description="Basis for coordinates: creation, depicted, or discovery")
    location_confidence: str = Field("unknown", description="verified, approximate, or unverified")
    rights_statement: Optional[str] = Field(None, description="Copyright, CC license, or Public Domain status")
    attribution: Optional[str] = Field(None, description="Formal attribution line")
    verified_facts: List[VerifiedFact] = Field(default_factory=list, description="Curated evidence-backed facts")
    relations: List[Relation] = Field(default_factory=list, description="Provenance graph connections")

    @property
    def is_playable(self) -> bool:
        """Determines if the artifact is eligible for scored map challenges."""
        return (
            self.latitude is not None
            and self.longitude is not None
            and self.location_confidence in ("verified", "approximate")
            and not (self.latitude == 0.0 and self.longitude == 0.0)
        )


class ArtifactChallengeView(BaseModel):
    """Player-facing artifact challenge payload (answer coordinates hidden)."""
    id: str
    title: str
    description: str
    media_url: Optional[str]
    thumbnail_url: Optional[str]
    source_name: str
    source_url: str
    creator: Optional[str]
    date_created: Optional[str]
    location_basis: Optional[str]
    location_confidence: str
    rights_statement: Optional[str]
    attribution: Optional[str]
    verified_fact_count: int
    is_playable: bool
