"""Tests for provenance graph construction, relationship semantics, and multi-node topology."""
from app.services.artifact_store import store
from app.services.provenance import build_artifact_provenance_graph, build_global_provenance_graph


def test_artifact_provenance_graph_structure():
    """Verify nodes and directed edges for Katsushika Hokusai's Great Wave."""
    artifact = store.get_by_id("artifact-001")
    assert artifact is not None

    graph = build_artifact_provenance_graph(artifact)
    node_types = {n.type for n in graph.nodes}
    assert "Artifact" in node_types
    assert "Creator" in node_types
    assert "Place" in node_types
    assert "Cultural Tradition" in node_types
    assert "Collection" in node_types

    # Verify edge labels have valid cultural relations
    edge_labels = {e.label for e in graph.edges}
    assert "created by" in edge_labels
    assert "created in" in edge_labels
    assert "associated with" in edge_labels
    assert "held by" in edge_labels


def test_global_provenance_graph():
    """Verify aggregated global graph interconnects multiple artifacts and creators."""
    global_graph = build_global_provenance_graph()
    assert len(global_graph["nodes"]) > 15
    assert len(global_graph["edges"]) > 15
