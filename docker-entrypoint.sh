#!/bin/sh
set -e

echo "[Entrypoint] Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "[Entrypoint] Starting server..."
exec node server.js
