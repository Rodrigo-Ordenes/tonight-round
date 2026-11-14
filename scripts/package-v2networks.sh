#!/usr/bin/env bash
# Construye Tonight y arma dist/tonight-v2networks (app.js + server/). Lo usa release-v2networks.sh.
# Con MAKE_ZIP=1 también genera un zip (alternativa si el hosting no tuviera git).
set -euo pipefail
cd "$(dirname "$0")/.."

SITE_URL="${SITE_URL:-https://tonight.misitio.cl}"
OUT=dist/tonight-v2networks

npm test
rm -rf .next "$OUT" "$OUT.zip"
NEXT_PUBLIC_SITE_URL="$SITE_URL" npm run build

SERVER="$OUT/server"
mkdir -p "$SERVER/.next"
cp -R .next/standalone/. "$SERVER/"
cp -R .next/static "$SERVER/.next/static"
cp -R public "$SERVER/public"
# Qué versión corre en el hosting: https://<sitio>/version.txt (commit y fecha de compilación)
printf '%s\n%s\n' "$(git rev-parse --short HEAD)" "$(date -u +%Y-%m-%dT%H:%MZ)" > "$SERVER/public/version.txt"
rm -f "$SERVER"/.env*
# sharp solo sirve al optimizador de imágenes (apagado) y trae un binario de la máquina donde se compila
rm -rf "$SERVER/node_modules/@img" "$SERVER/node_modules/sharp"
cp deploy/v2networks/app.js "$OUT/app.js"
# Sin dependencias a propósito: el paquete ya las trae; no hay que usar "Run NPM Install".
printf '{"name":"tonight","private":true,"main":"app.js"}\n' > "$OUT/package.json"

if [ "${MAKE_ZIP:-0}" = "1" ]; then
  (cd "$OUT" && zip -qry "../$(basename "$OUT").zip" .)
fi
echo "Listo: $OUT para $SITE_URL"
