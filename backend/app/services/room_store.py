"""Persistent SQLite storage for private multiplayer rooms."""
import hashlib
import secrets
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Any


ROOM_CAPACITY = 8
ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
DEFAULT_DB_PATH = Path(__file__).resolve().parents[2] / "data" / "rooms.sqlite3"


class RoomNotFoundError(Exception):
    pass


class RoomAccessError(Exception):
    pass


class RoomConflictError(Exception):
    pass


def hash_player_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class RoomStore:
    def __init__(self, database_path: Path = DEFAULT_DB_PATH):
        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA busy_timeout = 10000")
        return connection

    def _initialize(self) -> None:
        with closing(self._connect()) as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS rooms (
                    code TEXT PRIMARY KEY,
                    artifact_id TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS room_players (
                    token_hash TEXT PRIMARY KEY,
                    room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
                    nickname TEXT NOT NULL,
                    guess_latitude REAL,
                    guess_longitude REAL,
                    distance_km REAL,
                    base_score INTEGER,
                    hint_penalty INTEGER,
                    final_score INTEGER,
                    UNIQUE(room_code, nickname)
                );
                CREATE INDEX IF NOT EXISTS idx_room_players_room
                    ON room_players(room_code);
                """
            )

    def create_room(self, artifact_id: str, nickname: str) -> tuple[str, str]:
        for _ in range(10):
            room_code = "".join(secrets.choice(ROOM_CODE_ALPHABET) for _ in range(6))
            player_token = secrets.token_urlsafe(32)
            try:
                with closing(self._connect()) as connection:
                    with connection:
                        connection.execute(
                            "INSERT INTO rooms (code, artifact_id) VALUES (?, ?)",
                            (room_code, artifact_id),
                        )
                        connection.execute(
                            "INSERT INTO room_players (token_hash, room_code, nickname) VALUES (?, ?, ?)",
                            (hash_player_token(player_token), room_code, nickname),
                        )
                return room_code, player_token
            except sqlite3.IntegrityError:
                continue
        raise RuntimeError("Could not allocate a unique room code after 10 attempts")

    def join_room(self, room_code: str, nickname: str) -> str:
        player_token = secrets.token_urlsafe(32)
        with closing(self._connect()) as connection:
            with connection:
                room = connection.execute(
                    "SELECT code FROM rooms WHERE code = ?", (room_code.upper(),)
                ).fetchone()
                if room is None:
                    raise RoomNotFoundError

                player_count = connection.execute(
                    "SELECT COUNT(*) AS count FROM room_players WHERE room_code = ?",
                    (room_code.upper(),),
                ).fetchone()["count"]
                if player_count >= ROOM_CAPACITY:
                    raise RoomConflictError("This room is full")

                duplicate = connection.execute(
                    "SELECT 1 FROM room_players WHERE room_code = ? AND lower(nickname) = lower(?)",
                    (room_code.upper(), nickname),
                ).fetchone()
                if duplicate:
                    raise RoomConflictError("That nickname is already in this room")

                connection.execute(
                    "INSERT INTO room_players (token_hash, room_code, nickname) VALUES (?, ?, ?)",
                    (hash_player_token(player_token), room_code.upper(), nickname),
                )
        return player_token

    def get_room(self, room_code: str, player_token: str) -> dict[str, Any]:
        code = room_code.upper()
        token_hash = hash_player_token(player_token)
        with closing(self._connect()) as connection:
            room = connection.execute(
                "SELECT code, artifact_id, created_at FROM rooms WHERE code = ?", (code,)
            ).fetchone()
            if room is None:
                raise RoomNotFoundError

            players = connection.execute(
                """
                SELECT nickname, final_score
                FROM room_players
                WHERE room_code = ?
                ORDER BY final_score IS NULL, final_score DESC, lower(nickname)
                """,
                (code,),
            ).fetchall()
            own_player = connection.execute(
                """
                SELECT nickname, guess_latitude, guess_longitude, distance_km,
                       base_score, hint_penalty, final_score
                FROM room_players
                WHERE room_code = ? AND token_hash = ?
                """,
                (code, token_hash),
            ).fetchone()

        if own_player is None:
            raise RoomAccessError

        return {
            "room_code": room["code"],
            "artifact_id": room["artifact_id"],
            "players": [
                {
                    "nickname": player["nickname"],
                    "submitted": player["final_score"] is not None,
                    "score": player["final_score"],
                }
                for player in players
            ],
            "own_guess": dict(own_player),
        }

    def save_guess(
        self,
        room_code: str,
        player_token: str,
        latitude: float,
        longitude: float,
        distance_km: float,
        base_score: int,
        hint_penalty: int,
        final_score: int,
    ) -> None:
        with closing(self._connect()) as connection:
            with connection:
                cursor = connection.execute(
                    """
                    UPDATE room_players
                    SET guess_latitude = ?, guess_longitude = ?, distance_km = ?,
                        base_score = ?, hint_penalty = ?, final_score = ?
                    WHERE room_code = ? AND token_hash = ? AND final_score IS NULL
                    """,
                    (
                        latitude,
                        longitude,
                        distance_km,
                        base_score,
                        hint_penalty,
                        final_score,
                        room_code.upper(),
                        hash_player_token(player_token),
                    ),
                )
                if cursor.rowcount == 0:
                    exists = connection.execute(
                        "SELECT 1 FROM room_players WHERE room_code = ? AND token_hash = ?",
                        (room_code.upper(), hash_player_token(player_token)),
                    ).fetchone()
                    if exists is None:
                        raise RoomAccessError
                    raise RoomConflictError("You have already submitted your guess")
