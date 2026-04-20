import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
from models import User

@pytest.fixture(scope="session")
def client():
    # In a real environment, we'd use a test DB. 
    # For this submission, we use the existing app instance.
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="session")
def auth_token(client):
    """Helper to get a valid token for event_manager."""
    response = client.post("/api/auth/login", data={"username": "event_manager", "password": "test@123"})
    assert response.status_code == 200
    return response.json()["access_token"]

# --- Health & Root ---

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200

# --- Authentication ---

def test_login_success(client):
    response = client.post("/api/auth/login", data={"username": "event_manager", "password": "test@123"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_password(client):
    response = client.post("/api/auth/login", data={"username": "event_manager", "password": "wrongpassword"})
    assert response.status_code == 401

def test_login_nonexistent_user(client):
    response = client.post("/api/auth/login", data={"username": "ghost_user", "password": "password123"})
    assert response.status_code == 401

# --- Events ---

def test_get_events_unauthorized(client):
    response = client.get("/api/events")
    assert response.status_code == 401

def test_get_events_authorized(client, auth_token):
    response = client.get("/api/events", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# --- Orders ---

def test_get_orders_unauthorized(client):
    response = client.get("/api/orders")
    assert response.status_code == 401

def test_create_order_authorized(client, auth_token):
    # Get an event ID first
    events = client.get("/api/events", headers={"Authorization": f"Bearer {auth_token}"}).json()
    if events:
        event_id = events[0]["id"]
        order_data = {
            "event_id": event_id,
            "items": [{"id": 1, "qty": 2}],
            "pickup_zone": "Concourse A"
        }
        response = client.post("/api/orders", json=order_data, headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        assert "qr_code" in response.json()

# --- AI Intelligence ---

def test_ai_chat_authorized(client, auth_token):
    chat_data = {
        "message": "Hello, where is the nearest exit?",
        "history": []
    }
    response = client.post("/api/ai/chat", json=chat_data, headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert "response" in response.json()
    assert "sources" in response.json()

def test_ai_ops_manager_only(client, auth_token):
    ops_data = {
        "goal": "Reduce congestion at North Gate"
    }
    response = client.post("/api/ai/ops", json=ops_data, headers={"Authorization": f"Bearer {auth_token}"})
    # event_manager should have access
    assert response.status_code == 200
    assert "plan" in response.json()
