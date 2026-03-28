#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
XRAY_BIN="${XRAY_BIN:-$ROOT_DIR/tools/xray/v26.3.27/xray}"
XRAY_CONFIG="${XRAY_CONFIG:-$ROOT_DIR/xray-test.json}"

if [[ ! -x "$XRAY_BIN" ]]; then
  echo "[xray] binary not found or not executable: $XRAY_BIN" >&2
  echo "[xray] set XRAY_BIN or place the binary at tools/xray/v26.3.27/xray" >&2
  exit 1
fi

if [[ ! -f "$XRAY_CONFIG" ]]; then
  echo "[xray] config not found: $XRAY_CONFIG" >&2
  exit 1
fi

exec "$XRAY_BIN" run -c "$XRAY_CONFIG"
