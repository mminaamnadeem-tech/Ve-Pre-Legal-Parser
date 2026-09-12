# IMPORTANT — be simple
Approach tasks in a simple, incremental way. Small, simple steps.
Validate and check each increment before moving on.
Do not over-engineer. Do not program defensively.

# Code style
Use UV as the Python package manager: always `uv run`, never `python3`;
always `uv add`, never `pip install`.
Favor clear, concise docstring comments; be sparing elsewhere.
Favor short modules. Keep the README concise. Clean up old files.
Never use emojis in code, print statements, or logs.

# Debugging
Always identify the root cause before fixing — prove it, do not guess.
Reproduce consistently. Change one thing at a time. Be methodical.
Do not jump to conclusions. Do not apply workarounds.

# Project Description
Pre-Legal is a SaaS product that lets users draft legal agreements based on templates in the templates directory. The user has a chat to establish which document they want and how to fill in the fields. The available documents are described in catalog.json.

# Development Process
Use your Atlassian tools to read the feature instructions from Jira.
Develop the feature — do not skip any steps.
Thoroughly test with unit tests and integration tests; fix any issues.
Submit a PR using your GitHub tools.

# Ai Design
When writing code to call an LLM, use your cerebras skill:
LiteLLM via OpenRouter to the `openai/gpt-oss-120b` model,
with Cerebras as the inference provider.
Use structured output so results can populate the document fields.

# Technical Design

Backend in `backend/` — a UV project using FastAPI.
Frontend in `frontend/`.
Provide scripts to start and stop the app.
Use SQLite, created fresh each time the container starts,
with a users table supporting sign-up and sign-in.