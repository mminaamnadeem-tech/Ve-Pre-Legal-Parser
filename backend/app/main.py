from __future__ import annotations

import json
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from app.supabase_auth import SupabaseAuthError, signin as supabase_signin, signup as supabase_signup

ROOT_DIR = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT_DIR / 'catalog.json'
TEMPLATE_DIR = ROOT_DIR / 'templates'

app = FastAPI(title='Pre-Legal API')
frontend_origin = os.getenv('FRONTEND_ORIGIN', '').rstrip('/')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['null', frontend_origin] if frontend_origin else ['null'],
    allow_origin_regex=r'^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$|^https://[a-z0-9-]+\.vercel\.app$',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str


def load_catalog() -> list[dict]:
    if not CATALOG_PATH.exists():
        return []
    with CATALOG_PATH.open('r', encoding='utf-8') as file:
        return json.load(file)


def find_template(filename: str) -> dict | None:
    normalized = filename.lower()
    for item in load_catalog():
        if item.get('filename', '').lower() == normalized:
            return item
    return None


@app.get('/')
def root() -> dict[str, str]:
    return {'status': 'ok', 'service': 'pre-legal-api'}


@app.get('/api/health')
def health_check() -> dict[str, str]:
    return {'status': 'ok'}


@app.get('/api/templates')
def list_templates() -> list[dict]:
    return load_catalog()


@app.get('/api/templates/{filename}')
def get_template_document(filename: str) -> dict:
    entry = find_template(filename)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Template not found')

    template_path = TEMPLATE_DIR / entry['filename']
    if not template_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Template file not found')

    content = template_path.read_text(encoding='utf-8')
    return {
        'template': entry.get('name', 'Unknown template'),
        'filename': entry.get('filename', filename),
        'content': content,
    }


@app.post('/api/signup', status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest):
    try:
        result = supabase_signup(str(payload.email), payload.password)
    except SupabaseAuthError as error:
        if error.status_code in {400, 422}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='User already exists or signup is not allowed') from error
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error

    user = result.get('user') or {}
    return {
        'user': {'id': user.get('id'), 'email': user.get('email', str(payload.email))},
        'email_confirmation_required': result.get('session') is None,
    }


@app.post('/api/signin')
def signin(payload: SigninRequest):
    try:
        result = supabase_signin(str(payload.email), payload.password)
    except SupabaseAuthError as error:
        if error.status_code in {400, 401}:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials') from error
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error

    user = result.get('user') or {}
    return {'user': {'id': user.get('id'), 'email': user.get('email', str(payload.email))}}
