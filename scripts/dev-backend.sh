#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_ENV="$ROOT_DIR/backend/.env"
BACKEND_ENV_EXAMPLE="$ROOT_DIR/backend/.env.example"

if [[ ! -f "$BACKEND_ENV" ]]; then
  cp "$BACKEND_ENV_EXAMPLE" "$BACKEND_ENV"
  echo "[backend] created backend/.env from .env.example"
fi

cd "$ROOT_DIR"
npm --workspace backend run dev

