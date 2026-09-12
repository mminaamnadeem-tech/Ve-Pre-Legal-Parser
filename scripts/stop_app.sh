#!/usr/bin/env bash
set -euo pipefail

if command -v pkill >/dev/null 2>&1; then
  pkill -f "uvicorn app.main:app" || true
else
  echo "pkill not available; nothing to stop."
fi
