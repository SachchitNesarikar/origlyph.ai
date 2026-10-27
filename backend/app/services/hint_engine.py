"""Evidence-backed hint engine and AI adapter boundary for Origlyph."""
import os
import logging
from abc import ABC, abstractmethod
from typing import List, Optional
from ..models.artifact import Artifact, VerifiedFact
from ..models.api import HintResponse
from .geo import HINT_PENALTIES

logger = logging.getLogger(__name__)


class BaseHintAdapter(ABC):
    """Abstract adapter interface for hint generation."""

    @abstractmethod
    def generate_hint(
        self,
        artifact: Artifact,
        verified_facts: List[VerifiedFact],
        hint_level: int,
    ) -> HintResponse:
        """Generate an evidence-grounded hint without leaking exact coordinates."""
        pass


class DeterministicHintAdapter(BaseHintAdapter):
    """
    Deterministic hint generator backed by curated archival records.
    Requires no external API keys or LLM runtimes.
    """

    def generate_hint(
        self,
        artifact: Artifact,
        verified_facts: List[VerifiedFact],
        hint_level: int,
    ) -> HintResponse:
        hint_level = min(max(1, hint_level), 3)
        penalty = HINT_PENALTIES.get(hint_level, 500)

        # Safeguard: Do not proceed if record lacks verified facts
        if not verified_facts:
            return HintResponse(
                artifact_id=artifact.id,
                hint_level=hint_level,
                hint_text="Archival record contains insufficient verified geographic facts to formulate a reliable hint.",
                score_penalty=0,
                supporting_fact_ids=[],
                caveat_or_uncertainty="Uncertainty Notice: Target record is under curatorial review.",
            )

        fact_ids: List[str] = []
        caveat: Optional[str] = None

        if hint_level == 1:
            # Level 1: Historical context, era, and creation medium
            matching = [f for f in verified_facts if f.category in ("production", "biography", "series", "curatorial_note")]
            selected = matching[0] if matching else verified_facts[0]
            fact_ids.append(selected.id)

            era_text = f" This piece dates from {artifact.date_created}." if artifact.date_created else ""
            hint_text = (
                f"[Contextual Clue] {selected.fact_text}{era_text} "
                f"Consider the trade networks and material cultures active during this era."
            )

        elif hint_level == 2:
            # Level 2: Topographical, material, or environmental clues
            matching = [f for f in verified_facts if f.category in ("geography", "topography", "pigment", "pigments", "technique", "astronomy")]
            selected = matching[0] if matching else (verified_facts[1] if len(verified_facts) > 1 else verified_facts[0])
            fact_ids.append(selected.id)

            basis_hint = ""
            if artifact.location_basis == "creation":
                basis_hint = "Focus on the urban center or workshop where this masterwork was produced."
            elif artifact.location_basis == "depicted":
                basis_hint = "Focus on the physical landscape or vista represented in the composition."
            elif artifact.location_basis == "discovery":
                basis_hint = "Focus on the archaeological excavation site or river basin where the piece was unearthed."

            hint_text = f"[Topographical Clue] {selected.fact_text} {basis_hint}"

        else:
            # Level 3: Specific excavation, epigraphy, or archival landmark clues
            matching = [f for f in verified_facts if f.category in ("discovery", "excavation", "epigraphy", "decipherment", "masonry")]
            selected = matching[0] if matching else verified_facts[-1]
            fact_ids = [f.id for f in verified_facts[:2]]

            # Ensure we NEVER leak coordinates directly
            hint_text = (
                f"[Archival Evidence] {selected.fact_text} "
                f"Archival records link this item to historical collections referenced in '{artifact.source_name}'."
            )
            caveat = "Note: Historical borders and place names may have shifted relative to modern cartography."

        return HintResponse(
            artifact_id=artifact.id,
            hint_level=hint_level,
            hint_text=hint_text,
            score_penalty=penalty,
            supporting_fact_ids=fact_ids,
            caveat_or_uncertainty=caveat,
        )


class GemmaHintAdapter(BaseHintAdapter):
    """
    Adapter boundary for future Google Gemma integration (via Vertex AI or Ollama).

    Design specifications:
    - Never invents locations, dates, or provenance edges.
    - Constrained strictly to verified_facts passed in the prompt context.
    - If provider is unavailable, gracefully falls back to DeterministicHintAdapter.
    """

    def __init__(self):
        self.provider = os.getenv("GEMMA_PROVIDER", "deterministic").lower()
        self.endpoint = os.getenv("GEMMA_ENDPOINT", "http://localhost:11434/api/generate")
        self.model_name = os.getenv("GEMMA_MODEL_NAME", "gemma-2-9b-it")
        self._fallback = DeterministicHintAdapter()

    def generate_hint(
        self,
        artifact: Artifact,
        verified_facts: List[VerifiedFact],
        hint_level: int,
    ) -> HintResponse:
        # In baseline configuration or if provider is 'deterministic', execute curated fallback
        if self.provider == "deterministic":
            return self._fallback.generate_hint(artifact, verified_facts, hint_level)

        # Future Gemma runtime integration branch
        logger.info("GemmaHintAdapter invoked with provider: %s", self.provider)
        try:
            # Boundary placeholder: when GEMMA_PROVIDER != 'deterministic', a live model call
            # would execute here against Vertex AI or an Ollama local runtime.
            # If the service is unreachable or unconfigured, log and execute deterministic fallback.
            return self._fallback.generate_hint(artifact, verified_facts, hint_level)
        except Exception as exc:
            logger.warning("Gemma service invocation failed (%s). Falling back to deterministic engine.", exc)
            return self._fallback.generate_hint(artifact, verified_facts, hint_level)


# Global hint service factory
_engine = GemmaHintAdapter()


def generate_hint(
    artifact: Artifact,
    verified_facts: List[VerifiedFact],
    hint_level: int,
) -> HintResponse:
    """Public interface for generating evidence-backed progressive hints."""
    return _engine.generate_hint(artifact, verified_facts, hint_level)
