"""Provenance graph service for building node-edge relationships and cultural contexts."""
from functools import lru_cache
from typing import Dict, List, Optional
from ..models.artifact import Artifact
from ..models.api import GraphNode, GraphEdge, ProvenanceGraphResponse
from .artifact_store import store


def build_artifact_provenance_graph(artifact: Artifact) -> ProvenanceGraphResponse:
    """
    Construct a verified provenance graph centered on a target artifact.
    Includes creators, places, traditions, collections, and related artifacts.
    """
    nodes: Dict[str, GraphNode] = {}
    edges: List[GraphEdge] = []

    # Center node: Target Artifact
    center_node = GraphNode(
        id=artifact.id,
        label=artifact.title,
        type="Artifact",
        is_center=True,
        metadata={
            "date": artifact.date_created,
            "source": artifact.source_name,
            "confidence": artifact.location_confidence,
        },
    )
    nodes[artifact.id] = center_node

    # Add explicit relationship edges
    for rel in artifact.relations:
        # Register or update target node
        if rel.target_id not in nodes:
            # Check if target is an artifact in our store for rich metadata
            target_artifact = store.get_by_id(rel.target_id)
            node_metadata = {}
            if target_artifact:
                node_metadata = {
                    "is_playable": target_artifact.is_playable,
                    "date": target_artifact.date_created,
                    "collection": target_artifact.current_collection,
                }

            nodes[rel.target_id] = GraphNode(
                id=rel.target_id,
                label=rel.target_name,
                type=rel.target_type,
                is_center=False,
                metadata=node_metadata,
            )

        # Register directed edge from artifact to related entity
        edges.append(
            GraphEdge(
                source=artifact.id,
                target=rel.target_id,
                label=rel.relation_type,
                evidence_source_id=rel.evidence_source_id,
                notes=rel.notes,
            )
        )

    # Contextual geographic node if distinct from existing relation
    if artifact.creation_location and not any(e.label == "created in" for e in edges):
        place_id = f"place-{artifact.id}-creation"
        nodes[place_id] = GraphNode(
            id=place_id,
            label=artifact.creation_location,
            type="Place",
            metadata={"role": "Creation Location"},
        )
        edges.append(
            GraphEdge(
                source=artifact.id,
                target=place_id,
                label="created in",
                notes="Documented creation or production origin",
            )
        )

    return ProvenanceGraphResponse(
        artifact_id=artifact.id,
        nodes=list(nodes.values()),
        edges=edges,
    )


@lru_cache(maxsize=1)
def build_global_provenance_graph() -> dict:
    """Construct an interconnected graph spanning all seed artifacts."""
    nodes: Dict[str, GraphNode] = {}
    edges: List[GraphEdge] = []

    for art in store.get_all():
        subgraph = build_artifact_provenance_graph(art)
        for n in subgraph.nodes:
            if n.id not in nodes:
                nodes[n.id] = n
        for e in subgraph.edges:
            edges.append(e)

    return {
        "nodes": [n.model_dump() for n in nodes.values()],
        "edges": [e.model_dump() for e in edges],
    }
