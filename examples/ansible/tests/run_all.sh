#!/usr/bin/env bash
# Every check the kit claims, in one run: yamllint, ansible-lint, a syntax check of every
# playbook, and the Python tests (inventory, read-only discipline, local runs).
# Run from anywhere on a Linux or WSL control node with ansible-core, ansible-lint, yamllint
# and pytest installed, and the collections in requirements.yml.
set -euo pipefail
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export ANSIBLE_CONFIG="$KIT/ansible.cfg"
cd "$KIT"

echo "== versions"
ansible --version | head -1
ansible-lint --version | head -1
yamllint --version

echo "== yamllint"
yamllint --strict .

echo "== ansible-lint"
ansible-lint --strict playbooks/

echo "== syntax check"
for playbook in playbooks/*.yml; do
  ansible-playbook --syntax-check "$playbook"
done

echo "== pytest"
python3 -m pytest -q tests
