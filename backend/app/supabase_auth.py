from __future__ import annotations

import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')


class SupabaseAuthError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _settings() -> tuple[str, str]:
    url = os.getenv('SUPABASE_URL', '').rstrip('/')
    key = os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_PUBLISHABLE_KEY', '')
    if not url or not key:
        raise SupabaseAuthError('Supabase authentication is not configured', 503)
    return url, key


def _request(path: str, payload: dict) -> dict:
    url, key = _settings()
    try:
        response = httpx.post(
            f'{url}/auth/v1/{path}',
            headers={'apikey': key, 'Authorization': f'Bearer {key}'},
            json=payload,
            timeout=10,
        )
    except httpx.RequestError as error:
        raise SupabaseAuthError('Unable to reach Supabase') from error

    if response.is_success:
        return response.json()

    try:
        detail = response.json().get('msg') or response.json().get('message')
    except ValueError:
        detail = None
    raise SupabaseAuthError(detail or 'Supabase authentication failed', response.status_code)


def signup(email: str, password: str) -> dict:
    return _request('signup', {'email': email, 'password': password})


def signin(email: str, password: str) -> dict:
    return _request('token?grant_type=password', {'email': email, 'password': password})