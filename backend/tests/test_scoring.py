"""Tests for exponential scoring formula, progressive hint penalties, and rating tiers."""
import pytest
from app.services.geo import (
    calculate_base_score,
    calculate_score,
    get_accuracy_rating,
    MAX_SCORE,
    DECAY_DISTANCE_KM,
)


def test_maximum_score_at_zero_distance():
    """At 0 km distance, score must be exactly MAX_SCORE (5000)."""
    score = calculate_base_score(0.0)
    assert score == 5000


def test_score_monotonically_decreases_with_distance():
    """Score must strictly decrease as distance from target increases."""
    distances = [0.0, 25.0, 100.0, 200.0, 500.0, 1500.0, 5000.0]
    scores = [calculate_base_score(d) for d in distances]

    for i in range(len(scores) - 1):
        assert scores[i] > scores[i + 1], f"Expected score at {distances[i]} km > {distances[i+1]} km"


def test_score_at_decay_scale_distance():
    """At decay distance (200 km), score should be approximately 5000 * 1/e ≈ 1839."""
    score = calculate_base_score(DECAY_DISTANCE_KM)
    expected = round(MAX_SCORE * (1.0 / 2.718281828459))
    assert abs(score - expected) <= 2


def test_hint_penalties_applied():
    """Hint penalties must reduce the score accurately according to hint level."""
    distance = 10.0  # Base score ~4756
    base, pen0, final0 = calculate_score(distance, hints_used=0)
    assert pen0 == 0
    assert final0 == base

    _, pen1, final1 = calculate_score(distance, hints_used=1)
    assert pen1 == 500
    assert final1 == base - 500

    _, pen2, final2 = calculate_score(distance, hints_used=2)
    assert pen2 == 1200
    assert final2 == base - 1200

    _, pen3, final3 = calculate_score(distance, hints_used=3)
    assert pen3 == 2200
    assert final3 == base - 2200


def test_final_score_never_negative():
    """Score after penalty deduction must never fall below 0."""
    # At 5000 km, base score is ~178 (decay scale 1500 km). With hint penalties, final score must still be 0.
    base, pen, final = calculate_score(5000.0, hints_used=3)
    assert final >= 0


def test_continental_guess_is_still_worth_points():
    """v2 regression: a ~1,200 km guess scored ~2 points under the v1 200 km scale."""
    assert calculate_base_score(1200.0) > 2000


def test_accuracy_ratings():
    """Accuracy ratings return appropriate descriptive tiers."""
    assert "Pinpoint" in get_accuracy_rating(5.0)
    assert "Regional" in get_accuracy_rating(100.0)
    assert "Provincial" in get_accuracy_rating(350.0)
    assert "Continental" in get_accuracy_rating(1200.0)
    assert "Global" in get_accuracy_rating(6000.0)
