#!/bin/sh
set -e

echo "[Entrypoint] Running database migrations..."
node_modules/.bin/prisma migrate deploy

echo "[Entrypoint] Starting server..."
exec node server.js
