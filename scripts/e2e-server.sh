#!/usr/bin/env bash
# Servidor para las pruebas E2E: el mismo build independiente que va a producción (no el modo dev).
# Uso: PORT=3105 bash scripts/e2e-server.sh   (SKIP_BUILD=1 reutiliza el build existente)
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-3105}"
if [ "${SKIP_BUILD:-0}" != "1" ] || [ ! -f .next/standalone/server.js ]; then
  npm run build
fi
rm -rf .next/standalone/public .next/standalone/.next/static
cp -R public .next/standalone/public
cp -R .next/static .next/standalone/.next/static
export PORT HOSTNAME=127.0.0.1 NODE_ENV=production
exec node .next/standalone/server.js
