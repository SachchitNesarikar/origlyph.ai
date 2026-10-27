"""Request and response models for private competitive rooms."""
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from .api import GuessResponse
from .artifact import ArtifactChallengeView


class RoomPlayerRequest(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=24)

    @field_validator("nickname")
    @classmethod
    def trim_nickname(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Nickname cannot be empty")
        return value


class RoomGuessRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class RoomPlayerView(BaseModel):
    nickname: str
    submitted: bool
    score: Optional[int] = None


class RoomStateResponse(BaseModel):
    room_code: str
    artifact: ArtifactChallengeView
    players: list[RoomPlayerView]
    player_count: int
    capacity: int
    own_guess: Optional[GuessResponse] = None


class RoomSessionResponse(BaseModel):
    player_token: str
    room: RoomStateResponse
