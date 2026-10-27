"""Private room creation, joining, guessing, and leaderboard routes."""
import secrets

from fastapi import APIRouter, Header, HTTPException, status

from ..models.api import GuessResponse
from ..models.rooms import (
    RoomPlayerRequest,
    RoomGuessRequest,
    RoomSessionResponse,
    RoomStateResponse,
    RoomPlayerView,
)
from ..services.artifact_store import store
from ..services.geo import (
    calculate_score,
    get_accuracy_rating,
    haversine_distance,
)
from ..services.room_store import (
    ROOM_CAPACITY,
    RoomAccessError,
    RoomConflictError,
    RoomNotFoundError,
    RoomStore,
)

router = APIRouter(prefix="/rooms", tags=["Rooms"])
room_store = RoomStore()


def _build_state(room_code: str, player_token: str) -> RoomStateResponse:
    try:
        room = room_store.get_room(room_code, player_token)
    except RoomNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Room not found") from exc
    except RoomAccessError as exc:
        raise HTTPException(status_code=403, detail="Invalid room player token") from exc

    artifact = store.get_by_id(room["artifact_id"])
    challenge_view = store.get_challenge_view(room["artifact_id"])
    if artifact is None or challenge_view is None:
        raise HTTPException(status_code=409, detail="This room's artifact is no longer available")

    own = room["own_guess"]
    own_guess = None
    if own["final_score"] is not None:
        own_guess = GuessResponse(
            artifact_id=artifact.id,
            guess_latitude=own["guess_latitude"],
            guess_longitude=own["guess_longitude"],
            target_latitude=artifact.latitude,
            target_longitude=artifact.longitude,
            distance_km=own["distance_km"],
            base_score=own["base_score"],
            hint_penalty=own["hint_penalty"],
            final_score=own["final_score"],
            max_score=5000,
            location_basis=artifact.location_basis or "creation",
            accuracy_rating=get_accuracy_rating(own["distance_km"]),
            artifact=artifact,
        )

    return RoomStateResponse(
        room_code=room["room_code"],
        artifact=challenge_view,
        players=[
            RoomPlayerView(
                nickname=player["nickname"],
                submitted=player["submitted"],
                score=player["score"],
            )
            for player in room["players"]
        ],
        player_count=len(room["players"]),
        capacity=ROOM_CAPACITY,
        own_guess=own_guess,
    )


def _handle_room_error(error: Exception) -> HTTPException:
    if isinstance(error, RoomNotFoundError):
        return HTTPException(status_code=404, detail="Room not found")
    if isinstance(error, RoomConflictError):
        return HTTPException(status_code=409, detail=str(error))
    if isinstance(error, RoomAccessError):
        return HTTPException(status_code=403, detail="Invalid room player token")
    raise error


@router.post("", response_model=RoomSessionResponse, status_code=status.HTTP_201_CREATED)
def create_room(payload: RoomPlayerRequest) -> RoomSessionResponse:
    playable = store.get_playable()
    if not playable:
        raise HTTPException(status_code=503, detail="No playable artifacts are available")

    artifact = secrets.choice(playable)
    room_code, player_token = room_store.create_room(artifact.id, payload.nickname)
    return RoomSessionResponse(
        player_token=player_token,
        room=_build_state(room_code, player_token),
    )


@router.post(
    "/{room_code}/join",
    response_model=RoomSessionResponse,
    status_code=status.HTTP_200_OK,
)
def join_room(room_code: str, payload: RoomPlayerRequest) -> RoomSessionResponse:
    try:
        player_token = room_store.join_room(room_code, payload.nickname)
    except (RoomNotFoundError, RoomConflictError) as exc:
        raise _handle_room_error(exc) from exc
    return RoomSessionResponse(
        player_token=player_token,
        room=_build_state(room_code, player_token),
    )


@router.get("/{room_code}", response_model=RoomStateResponse)
def get_room(
    room_code: str,
    x_room_token: str = Header(..., alias="X-Room-Token"),
) -> RoomStateResponse:
    return _build_state(room_code, x_room_token)


@router.post("/{room_code}/guess", response_model=RoomStateResponse)
def submit_room_guess(
    room_code: str,
    payload: RoomGuessRequest,
    x_room_token: str = Header(..., alias="X-Room-Token"),
) -> RoomStateResponse:
    try:
        room = room_store.get_room(room_code, x_room_token)
    except (RoomNotFoundError, RoomAccessError) as exc:
        raise _handle_room_error(exc) from exc

    artifact = store.get_by_id(room["artifact_id"])
    if artifact is None or not artifact.is_playable or artifact.latitude is None or artifact.longitude is None:
        raise HTTPException(status_code=409, detail="This room's artifact cannot be scored")

    distance_km = haversine_distance(
        payload.latitude,
        payload.longitude,
        artifact.latitude,
        artifact.longitude,
    )
    base_score, penalty, final_score = calculate_score(distance_km, hints_used=0)

    try:
        room_store.save_guess(
            room_code,
            x_room_token,
            payload.latitude,
            payload.longitude,
            distance_km,
            base_score,
            penalty,
            final_score,
        )
    except (RoomConflictError, RoomAccessError) as exc:
        raise _handle_room_error(exc) from exc

    return _build_state(room_code, x_room_token)
