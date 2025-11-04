#!/bin/sh
set -e

DB_PATH="/app/data/playlist.db"
SEED_PATH="/app/.seed/playlist.db"

mkdir -p /app/data

# If DB missing, hydrate from seed
if [ ! -f "$DB_PATH" ] && [ -f "$SEED_PATH" ]; then
  cp "$SEED_PATH" "$DB_PATH" || true
fi

# If songs table is missing, hydrate from seed (handles legacy/empty DB)
if ! sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='songs';" | grep -q songs; then
  if [ -f "$SEED_PATH" ]; then
    cp "$SEED_PATH" "$DB_PATH" || true
  fi
fi

export NODE_PATH="/app/node_modules:/app/.next/standalone/node_modules"
exec node /app/server.js

