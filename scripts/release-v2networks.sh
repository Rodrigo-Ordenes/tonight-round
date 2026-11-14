#!/usr/bin/env bash
# Publica la app ya compilada en la rama v2-release. cPanel la clona desde "Git Version Control", sin Terminal.
# La historia es lineal a propósito: "Update from Remote" de cPanel no acepta force-push.
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH=v2-release
REMOTE_URL="${REMOTE_URL:-$(git remote get-url origin)}"
SOURCE="$(git rev-parse --short HEAD)"
[ -z "$(git status --porcelain)" ] || { echo "Hay cambios sin commit: la versión publicada no sería reproducible"; exit 1; }

bash scripts/package-v2networks.sh

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
if git ls-remote --exit-code --heads "$REMOTE_URL" "$BRANCH" >/dev/null; then
  git clone -q --depth 1 --branch "$BRANCH" "$REMOTE_URL" "$WORK"
else
  git init -q -b "$BRANCH" "$WORK"
  git -C "$WORK" remote add origin "$REMOTE_URL"
fi

find "$WORK" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R dist/tonight-v2networks/. "$WORK/"
find "$WORK" -name .gitignore -not -path "$WORK/.git/*" -delete
printf 'tmp/\nstderr.log\n.htaccess\n' > "$WORK/.gitignore"

git -C "$WORK" add -A
if git -C "$WORK" diff --cached --quiet; then echo "Sin cambios que publicar"; exit 0; fi
git -C "$WORK" commit -q -m "release: Tonight compilado desde $SOURCE"
if [ "${DRY_RUN:-0}" = "1" ]; then
  rm -rf "${DRY_RUN_OUT:?}"; cp -R "$WORK" "$DRY_RUN_OUT"; echo "Prueba lista en $DRY_RUN_OUT"; exit 0
fi
git -C "$WORK" push -q origin "$BRANCH"
echo "Publicado $SOURCE en $BRANCH"
