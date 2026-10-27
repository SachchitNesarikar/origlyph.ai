"""Tests for Haversine distance calculations and coordinate validation."""
import pytest
from app.services.geo import haversine_distance, EARTH_RADIUS_KM


def test_haversine_same_point():
    """Distance between a point and itself must be 0.0 km."""
    dist = haversine_distance(35.6895, 139.6917, 35.6895, 139.6917)
    assert dist == 0.0


def test_haversine_known_cities():
    """
    Test known distance between London (51.5074, -0.1278) and Paris (48.8566, 2.3522).
    Great circle distance is ~343 km (within ±2 km tolerance).
    """
    london_lat, london_lon = 51.5074, -0.1278
    paris_lat, paris_lon = 48.8566, 2.3522

    distance = haversine_distance(london_lat, london_lon, paris_lat, paris_lon)
    assert 340.0 <= distance <= 346.0


def test_haversine_antipodal_points():
    """Distance between antipodal points should approach half the Earth's circumference (~20,015 km)."""
    # North Pole to South Pole
    dist = haversine_distance(90.0, 0.0, -90.0, 0.0)
    expected = 3.1415926535 * EARTH_RADIUS_KM
    assert pytest.approx(dist, rel=1e-3) == round(expected, 2)


def test_haversine_invalid_coordinates():
    """Haversine must raise ValueError on out-of-range coordinates."""
    with pytest.raises(ValueError):
        haversine_distance(95.0, 0.0, 0.0, 0.0)

    with pytest.raises(ValueError):
        haversine_distance(0.0, 0.0, -95.0, 0.0)

    with pytest.raises(ValueError):
        haversine_distance(0.0, 185.0, 0.0, 0.0)

    with pytest.raises(ValueError):
        haversine_distance(0.0, 0.0, 0.0, -190.0)
