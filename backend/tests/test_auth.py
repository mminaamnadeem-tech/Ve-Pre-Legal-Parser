from pathlib import Path

from fastapi.testclient import TestClient

db_path = Path(__file__).resolve().parents[1] / 'data' / 'prelegal.sqlite'
if db_path.exists():
    db_path.unlink()

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_signup_and_signin_flow():
    signup = client.post('/api/signup', json={
        'email': 'demo@example.com',
        'password': 'SecretPassword123',
    })
    assert signup.status_code == 201
    payload = signup.json()
    assert payload['user']['email'] == 'demo@example.com'

    signin = client.post('/api/signin', json={
        'email': 'demo@example.com',
        'password': 'SecretPassword123',
    })
    assert signin.status_code == 200
    assert signin.json()['user']['email'] == 'demo@example.com'

    bad_signin = client.post('/api/signin', json={
        'email': 'demo@example.com',
        'password': 'wrong-password',
    })
    assert bad_signin.status_code == 401


def test_list_templates_and_fetch_document():
    templates = client.get('/api/templates')
    assert templates.status_code == 200
    payload = templates.json()
    assert len(payload) > 0
    assert any(item['filename'] == 'AI-Addendum.md' for item in payload)

    detail = client.get('/api/templates/AI-Addendum.md')
    assert detail.status_code == 200
    document = detail.json()
    assert 'template' in document
    assert 'content' in document
    assert 'AI Services' in document['content']
