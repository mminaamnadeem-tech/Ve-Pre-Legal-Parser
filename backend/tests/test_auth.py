from fastapi.testclient import TestClient

from app import main

client = TestClient(main.app)


def test_health_check():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_signup_and_signin_flow(monkeypatch):
    def fake_signup(email, password):
        assert email == 'demo@example.com'
        assert password == 'SecretPassword123'
        return {
            'user': {'id': '7f4e8d4f-8c75-4f11-a8f6-0ed1a0c2d111', 'email': email},
            'session': None,
        }

    def fake_signin(email, password):
        if password == 'wrong-password':
            raise main.SupabaseAuthError('Invalid login credentials', 400)
        return {'user': {'id': '7f4e8d4f-8c75-4f11-a8f6-0ed1a0c2d111', 'email': email}}

    monkeypatch.setattr(main, 'supabase_signup', fake_signup)
    monkeypatch.setattr(main, 'supabase_signin', fake_signin)

    signup = client.post('/api/signup', json={
        'email': 'demo@example.com',
        'password': 'SecretPassword123',
    })
    assert signup.status_code == 201
    payload = signup.json()
    assert payload['user']['email'] == 'demo@example.com'
    assert payload['email_confirmation_required'] is True

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
