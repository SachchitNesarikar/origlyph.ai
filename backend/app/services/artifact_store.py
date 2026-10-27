"""In-memory artifact repository and data validator for Origlyph baseline."""
import json
from functools import lru_cache
import logging
from pathlib import Path
from typing import Dict, List, Optional
from ..models.artifact import Artifact, ArtifactChallengeView

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ARTIFACTS_FILE = DATA_DIR / "artifacts.json"
MANIFEST_FILE = DATA_DIR / "source_manifest.json"


@lru_cache(maxsize=1)
def _load_manifest() -> dict:
    if MANIFEST_FILE.exists():
        with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


class ArtifactStore:
    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = data_path or ARTIFACTS_FILE
        self._artifacts: Dict[str, Artifact] = {}
        self._views: Dict[str, ArtifactChallengeView] = {}
        self.load()

    def load(self) -> None:
        """Load and validate artifact records from JSON."""
        if not self.data_path.exists():
            logger.warning("Artifact data file does not exist at %s", self.data_path)
            self._artifacts = {}
            self._views = {}
            return

        with open(self.data_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        loaded = {}
        for item in raw_data:
            try:
                artifact = Artifact(**item)
                loaded[artifact.id] = artifact
            except Exception as e:
                logger.error("Failed to parse artifact record %s: %s", item.get("id"), e)

        self._artifacts = loaded
        self._views = {aid: self._build_view(a) for aid, a in loaded.items()}
        logger.info("Loaded %d artifacts (%d playable)", len(self._artifacts), len(self.get_playable()))

    def get_all(self) -> List[Artifact]:
        """Return all loaded artifacts."""
        return list(self._artifacts.values())

    def get_playable(self) -> List[Artifact]:
        """Return artifacts eligible for scored map challenges."""
        return [a for a in self._artifacts.values() if a.is_playable]

    def get_by_id(self, artifact_id: str) -> Optional[Artifact]:
        """Retrieve full artifact record by ID."""
        return self._artifacts.get(artifact_id)

    def get_challenge_view(self, artifact_id: str) -> Optional[ArtifactChallengeView]:
        """Return the precomputed challenge view (coordinates withheld)."""
        return self._views.get(artifact_id)

    @staticmethod
    def _build_view(artifact: Artifact) -> ArtifactChallengeView:
        return ArtifactChallengeView(
            id=artifact.id,
            title=artifact.title,
            description=artifact.description,
            media_url=artifact.media_url,
            thumbnail_url=artifact.thumbnail_url,
            source_name=artifact.source_name,
            source_url=artifact.source_url,
            creator=artifact.creator,
            date_created=artifact.date_created,
            location_basis=artifact.location_basis,
            location_confidence=artifact.location_confidence,
            rights_statement=artifact.rights_statement,
            attribution=artifact.attribution,
            verified_fact_count=len(artifact.verified_facts),
            is_playable=artifact.is_playable,
        )

    @staticmethod
    def get_manifest() -> dict:
        """Return source manifest JSON if present."""
        return _load_manifest()


# Global singleton instance
store = ArtifactStore()
