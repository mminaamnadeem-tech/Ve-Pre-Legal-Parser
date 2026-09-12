# Pre-Legal Website

A web application for preparing legal agreements from reusable templates and a guided drafting flow.

## Overview

The project now includes a FastAPI backend with Supabase-backed sign-up and sign-in, plus a Vite React frontend for the NDA drafting experience. Templates remain stored under the templates directory and metadata is exposed through catalog.json.

## Project Structure

```text
pre-legal-website/
├── backend/            # FastAPI + Supabase Auth service
├── frontend/           # Vite React ingestion and document builder UI
├── scripts/            # Start and stop utilities
├── templates/          # Template source documents
├── catalog.json        # Template metadata
├── global-keymap.md    # Implementation constraints
├── README.md
└── LICENSE
```

## Getting Started

### Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Utility scripts

```bash
./scripts/start_app.sh
./scripts/stop_app.sh
```

## Verification

- Backend auth tests are stored in backend/tests/test_auth.py.
- Supabase Auth stores users and password credentials.
- Enable email confirmation in Supabase under Authentication > Providers > Email.

## License

See LICENSE.
