from __future__ import annotations

import json
import os
from pathlib import Path

from passlib.context import CryptContext
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from app.db import User, get_session, get_user_by_email, init_db

ROOT_DIR = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT_DIR / 'catalog.json'
TEMPLATE_DIR = ROOT_DIR / 'templates'

app = FastAPI(title='Pre-Legal API')
frontend_origin = os.getenv('FRONTEND_ORIGIN', '').rstrip('/')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['null', frontend_origin] if frontend_origin else ['null'],
    allow_origin_regex=r'^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

pwd_context = CryptContext(schemes=['pbkdf2_sha256'], deprecated='auto')


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
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


@app.on_event('startup')
def startup() -> None:
    init_db(reset=False)


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
    if get_user_by_email(str(payload.email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='User already exists')

    password_hash = pwd_context.hash(payload.password)
    with get_session() as session:
        user = User(email=str(payload.email), password_hash=password_hash)
        session.add(user)
        session.commit()
        session.refresh(user)

    return {'user': {'id': user.id, 'email': user.email}}


@app.post('/api/signin')
def signin(payload: SigninRequest):
    user = get_user_by_email(str(payload.email))
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    return {'user': {'id': user.id, 'email': user.email}}
