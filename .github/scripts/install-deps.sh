#!/usr/bin/env bash
# Install the workflow's Ubuntu packages, with fallbacks for when the runner
# can't reach its apt mirror (as on November 11, 2026, when every run failed
# with "Temporary failure resolving 'azure.archive.ubuntu.com'").
#
#   .github/scripts/install-deps.sh librsvg2-bin python3-yaml python3-pytest ...
#
# 1. apt from the runner's configured mirror, bounded in time.
# 2. apt again from archive.ubuntu.com directly (the runner's mirror list bypassed).
# 3. pip for every python3-* package (PyPI is a different service); a package
#    pip can't supply (librsvg2-bin) is reported, and the steps that need it
#    fail with their own message (scripts/build_bundles.py names rsvg-convert).
set -uo pipefail

PACKAGES=("$@")
APT_OPTS=(-o Acquire::Retries=2 -o Acquire::http::Timeout=20 -o Acquire::https::Timeout=20)

apt_install() {
  timeout 600 sudo apt-get "${APT_OPTS[@]}" update &&
    timeout 900 sudo apt-get "${APT_OPTS[@]}" install -y "${PACKAGES[@]}"
}

if apt_install; then
  exit 0
fi

echo "::warning::apt failed from the runner's mirror; retrying from archive.ubuntu.com"
for f in /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list; do
  [ -f "$f" ] && sudo sed -i 's|mirror+file:/etc/apt/apt-mirrors.txt|http://archive.ubuntu.com/ubuntu/|g' "$f"
done
if apt_install; then
  exit 0
fi

echo "::warning::apt failed again; installing the Python packages from PyPI instead"
declare -A PIP_NAME=(
  [python3-yaml]=pyyaml [python3-jsonschema]=jsonschema [python3-regex]=regex
  [python3-pytest]=pytest [python3-cryptography]=cryptography
  [python3-requests]=requests [python3-openpyxl]=openpyxl
)
pip=() missing=()
for p in "${PACKAGES[@]}"; do
  if [ -n "${PIP_NAME[$p]:-}" ]; then pip+=("${PIP_NAME[$p]}"); else missing+=("$p"); fi
done
if [ ${#pip[@]} -gt 0 ]; then
  python3 -m pip install --user --break-system-packages "${pip[@]}" || exit 1
fi
if [ ${#missing[@]} -gt 0 ]; then
  echo "::warning::Not installed (no PyPI equivalent): ${missing[*]}. Steps that need them will report it."
fi
exit 0
