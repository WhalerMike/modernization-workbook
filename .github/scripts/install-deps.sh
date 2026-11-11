#!/usr/bin/env bash
# Install the workflow's Ubuntu packages, with fallbacks for when the runner
# can't reach its apt mirror (as on November 11, 2026, when every run failed
# with "Temporary failure resolving 'azure.archive.ubuntu.com'").
#
#   .github/scripts/install-deps.sh librsvg2-bin python3-yaml python3-pytest ...
#
# 1. apt from the runner's configured mirror, bounded in time, if its host resolves.
# 2. apt again from archive.ubuntu.com directly (the runner's mirror list bypassed).
# 3. pip for every python3-* package (PyPI is a different service); a package
#    pip can't supply (librsvg2-bin) fails the step, unless INSTALL_DEPS_ALLOW_MISSING=1
#    (the PR check and the weekly gates, which publish nothing) makes it a warning.
set -uo pipefail

PACKAGES=("$@")
APT_OPTS=(-o Acquire::Retries=2 -o Acquire::http::Timeout=20 -o Acquire::https::Timeout=20)

apt_install() {
  timeout 180 sudo apt-get "${APT_OPTS[@]}" update &&
    timeout 420 sudo apt-get "${APT_OPTS[@]}" install -y "${PACKAGES[@]}"
}

# The runner's mirror hosts, from its mirror list; if the first doesn't resolve, skip to step 2.
hosts=$(sed -n 's|^[a-z]*://\([^/]*\)/.*|\1|p' /etc/apt/apt-mirrors.txt 2>/dev/null)
mirror_ok=0
[ -z "$hosts" ] && mirror_ok=1   # no mirror list: the sources name their hosts directly
# apt tries the first (highest-priority) mirror for every file, so that one has to resolve.
first=$(printf '%s\n' "$hosts" | head -n 1)
if [ -n "$first" ] && getent hosts "$first" >/dev/null; then mirror_ok=1; fi
[ "$mirror_ok" = 0 ] && echo "::warning::the runner's apt mirror $first does not resolve"
if [ "$mirror_ok" = 1 ] && apt_install; then
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
  # apt's python3-* packages also pull in lxml (presentations/_build/link_sources.py needs it).
  python3 -m pip install --user --break-system-packages "${pip[@]}" lxml || exit 1
fi
if [ ${#missing[@]} -gt 0 ]; then
  # The deploy and the edition cut publish what they build, so a missing package fails them
  # (rsvg-convert missing means Word files without their SVG figures). Checks may go on.
  if [ "${INSTALL_DEPS_ALLOW_MISSING:-0}" = 1 ]; then
    echo "::warning::Not installed (no PyPI equivalent): ${missing[*]}. Steps that need them will report it."
  else
    echo "::error::Not installed (no PyPI equivalent): ${missing[*]}. Re-run when the apt mirror is back."
    exit 1
  fi
fi
exit 0
