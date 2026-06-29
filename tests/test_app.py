from copy import deepcopy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture(autouse=True)
def restore_activities():
    original = deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(deepcopy(original))


@pytest.fixture()
def client():
    return TestClient(app_module.app)


def test_unregister_participant_removes_them_from_activity(client):
    activity_name = "Chess Club"
    participant = "michael@mergington.edu"

    response = client.delete(
        f"/activities/{quote(activity_name, safe='')}/participants/{quote(participant, safe='')}"
    )

    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {participant} from {activity_name}"
    assert participant not in client.get("/activities").json()[activity_name]["participants"]


def test_unregister_missing_participant_returns_not_found(client):
    response = client.delete(
        "/activities/Chess Club/participants/does-not-exist@mergington.edu"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found"
