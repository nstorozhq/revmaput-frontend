#!/bin/sh
set -eu

if [ "${SSH_ORIGINAL_COMMAND:-}" != deploy ]; then
  printf '%s\n' 'This key can only publish Medicina.' >&2
  exit 1
fi

base=/var/www/medicina.storozhq.ru
umask 022
exec 9>"$base/.deploy.lock"
flock 9

release=$(mktemp -d "$base/releases/release.XXXXXXXX")
next="$base/.current-${release##*/}"
published=false

cleanup() {
  rm -f -- "$next"
  if [ "$published" = false ]; then
    rm -rf -- "$release"
  fi
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM

chmod 0755 "$release"
tar --extract --gzip --file=- --directory="$release" --no-same-owner --no-same-permissions
test -s "$release/index.html"
test -d "$release/assets"
test -z "$(find "$release" ! -type d ! -type f -print -quit)"

# Assets are content-addressed. Retain old URLs for pages opened before a deploy.
rsync -rt --ignore-existing "$release/assets/" "$base/shared/assets/"
ln -s "releases/${release##*/}" "$next"
mv -Tf -- "$next" "$base/current"
published=true

# Only prune releases created by this publisher, and always retain the active one.
find "$base/releases" -mindepth 1 -maxdepth 1 -type d -name 'release.*' -mtime +7 -print |
  while IFS= read -r old; do
    if [ "$old" != "$release" ]; then rm -rf -- "$old"; fi
  done

printf '%s\n' 'Medicina published.'
