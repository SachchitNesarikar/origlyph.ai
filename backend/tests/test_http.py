"""HTTP-level tests (TestClient) for answer-leak protection and routing behaviour."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_reveal_query_param_does_not_leak_over_http():
    res = client.get("/api/artifacts/artifact-001?reveal=true")
    assert res.status_code == 200
    body = res.json()
    assert "latitude" not in body and "longitude" not in body


def test_unknown_api_path_is_404_not_null():
    res = client.get("/api/does-not-exist")
    assert res.status_code == 404


def test_guess_round_trip_over_http():
    res = client.post("/api/artifacts/artifact-001/guess", json={"latitude": 35.7, "longitude": 139.7, "hints_used": 0})
    assert res.status_code == 200
    assert res.json()["final_score"] > 4900


def test_gzip_applied_to_catalog():
    res = client.get("/api/artifacts", headers={"Accept-Encoding": "gzip"})
    assert res.status_code == 200
