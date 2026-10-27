"""Geographic distance calculation and exponential scoring for Origlyph."""
import math
from typing import Tuple

# Mean Earth radius in kilometers (IUGG recommendation)
EARTH_RADIUS_KM = 6371.0088

# Scoring constants
MAX_SCORE = 5000
DECAY_DISTANCE_KM = 1500.0  # v2: was 200 km, which scored "correct continent" guesses ~0

# Transparent progressive hint penalties
HINT_PENALTIES = {
    0: 0,
    1: 500,   # 10% penalty for general historical context
    2: 1200,  # 24% penalty for regional/geographical clue
    3: 2200,  # 44% penalty for specific landmark/tradition clue
}


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth's surface
    using the Haversine formula.

    Returns distance in kilometers.
    """
    # Guard against invalid inputs
    if None in (lat1, lon1, lat2, lon2):
        raise ValueError("Latitude and longitude must not be None")

    if not (-90.0 <= lat1 <= 90.0 and -90.0 <= lat2 <= 90.0):
        raise ValueError(f"Latitude out of bounds [-90, 90]: {lat1}, {lat2}")

    if not (-180.0 <= lon1 <= 180.0 and -180.0 <= lon2 <= 180.0):
        raise ValueError(f"Longitude out of bounds [-180, 180]: {lon1}, {lon2}")

    # Convert decimal degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )

    # Clamp 'a' to [0, 1] to avoid math domain errors due to floating point inaccuracies
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = EARTH_RADIUS_KM * c
    return round(distance, 2)


def calculate_base_score(distance_km: float, scale_km: float = DECAY_DISTANCE_KM) -> int:
    """
    Calculate raw score (0 - 5000) using a tunable exponential decay function:
        score = round(MAX_SCORE * exp(-distance_km / scale_km))
    """
    if distance_km < 0:
        raise ValueError(f"Distance cannot be negative: {distance_km}")

    raw = MAX_SCORE * math.exp(-distance_km / scale_km)
    return int(round(raw))


def calculate_score(distance_km: float, hints_used: int = 0) -> Tuple[int, int, int]:
    """
    Calculate (base_score, hint_penalty, final_score).
    Final score is bounded between 0 and MAX_SCORE.
    """
    base_score = calculate_base_score(distance_km)
    penalty = HINT_PENALTIES.get(min(max(0, hints_used), 3), 0)
    final_score = max(0, base_score - penalty)
    return base_score, penalty, final_score


def get_accuracy_rating(distance_km: float) -> str:
    """Return an editorial cultural heritage investigator rating based on guess accuracy."""
    if distance_km <= 50.0:
        return "Pinpoint Master (Exact Site)"
    elif distance_km <= 250.0:
        return "Regional Scholar (Accurate Subregion)"
    elif distance_km <= 750.0:
        return "Provincial Wayfarer (Neighboring Basin)"
    elif distance_km <= 2000.0:
        return "Continental Navigator (Correct Continent/Sphere)"
    else:
        return "Global Cartographer (Intercontinental Distance)"
