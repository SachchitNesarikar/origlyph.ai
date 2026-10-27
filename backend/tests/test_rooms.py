"""HTTP tests for private room creation, scoring, and persistence."""
from fastapi.testclient import TestClient

from app.main import app
from app.routes import rooms as room_routes
from app.services.room_store import RoomStore

client = TestClient(app)


def test_room_competitive_round_hides_answer_until_each_player_guesses(
    tmp_path, monkeypatch
):
    monkeypatch.setattr(
        room_routes, "room_store", RoomStore(tmp_path / "rooms.sqlite3")
    )

    created = client.post("/api/rooms", json={"nickname": "Host"})
    assert created.status_code == 201
    creator = created.json()
    room_code = creator["room"]["room_code"]
    player_token = creator["player_token"]

    assert "latitude" not in creator["room"]["artifact"]
    assert "longitude" not in creator["room"]["artifact"]
    assert creator["room"]["own_guess"] is None

    joined = client.post(
        f"/api/rooms/{room_code}/join", json={"nickname": "Guest"}
    )
    assert joined.status_code == 200
    guest = joined.json()
    assert guest["room"]["artifact"]["id"] == creator["room"]["artifact"]["id"]

    host_guess = client.post(
        f"/api/rooms/{room_code}/guess",
        headers={"X-Room-Token": player_token},
        json={"latitude": 35.7, "longitude": 139.7},
    )
    assert host_guess.status_code == 200
    host_state = host_guess.json()
    assert host_state["own_guess"]["final_score"] > 0
    assert "target_latitude" not in host_state["artifact"]
    assert {player["nickname"] for player in host_state["players"]} == {"Host", "Guest"}

    guest_guess = client.post(
        f"/api/rooms/{room_code}/guess",
        headers={"X-Room-Token": guest["player_token"]},
        json={"latitude": 35.7, "longitude": 139.7},
    )
    assert guest_guess.status_code == 200
    assert all(player["submitted"] for player in guest_guess.json()["players"])


def test_room_tokens_and_single_guess_are_enforced_and_survive_reopen(
    tmp_path, monkeypatch
):
    database_path = tmp_path / "persistent-rooms.sqlite3"
    monkeypatch.setattr(room_routes, "room_store", RoomStore(database_path))

    created = client.post("/api/rooms", json={"nickname": "Player"})
    assert created.status_code == 201
    room_code = created.json()["room"]["room_code"]
    player_token = created.json()["player_token"]

    denied = client.get(
        f"/api/rooms/{room_code}", headers={"X-Room-Token": "invalid"}
    )
    assert denied.status_code == 403

    guess_payload = {"latitude": 0.0, "longitude": 0.0}
    first = client.post(
        f"/api/rooms/{room_code}/guess",
        headers={"X-Room-Token": player_token},
        json=guess_payload,
    )
    assert first.status_code == 200

    duplicate = client.post(
        f"/api/rooms/{room_code}/guess",
        headers={"X-Room-Token": player_token},
        json=guess_payload,
    )
    assert duplicate.status_code == 409

    monkeypatch.setattr(room_routes, "room_store", RoomStore(database_path))
    restored = client.get(
        f"/api/rooms/{room_code}", headers={"X-Room-Token": player_token}
    )
    assert restored.status_code == 200
    assert restored.json()["own_guess"]["guess_latitude"] == 0.0
