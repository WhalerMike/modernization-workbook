"""Keep an API response as evidence: read JSON on standard input, drop secrets, write it, print one line.

The runbook pipes each ISC response (a created or patched workflow, a test
run, an execution) through this into the stage's evidence folder. Any key
that names a secret (oAuthClientSecret, client_secret, password, secret,
access_token) is replaced with "[removed]" before the file is written. It
prints the fields a person checks: id, name, enabled, workflowExecutionId,
status. A body that isn't JSON (an HTTP error page, an empty answer) is
written as text and exits 1, so the step stops.

Reads standard input only; it calls no network.

Example (from the kit root):

  curl -s ... | python deploy/record.py out/evidence/test/workflow-1.json
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any

SECRET_NAMES = {"oauthclientsecret", "client_secret", "clientsecret", "password", "secret", "access_token"}
SHOWN = ("id", "name", "enabled", "workflowExecutionId", "status", "message", "detailCode")


def redact(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: ("[removed]" if k.lower() in SECRET_NAMES and v not in (None, "") else redact(v))
                for k, v in value.items()}
    if isinstance(value, list):
        return [redact(v) for v in value]
    return value


def main(argv: list[str] | None = None, stdin=None, out=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    stdin = stdin or sys.stdin
    out = out or sys.stdout
    if len(argv) != 1:
        print("usage: ... | python deploy/record.py <evidence-file.json>", file=sys.stderr)
        return 2
    path = argv[0]
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    text = stdin.read()
    try:
        body = json.loads(text)
    except json.JSONDecodeError:
        with open(path, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(text)
        print(f"not JSON ({len(text)} characters), kept in {path}: stop and read it", file=out)
        return 1
    body = redact(body)
    with open(path, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(body, handle, indent=2, sort_keys=True)
        handle.write("\n")
    items = body if isinstance(body, list) else [body]
    for item in items:
        if isinstance(item, dict):
            shown = [f"{k}={item[k]}" for k in SHOWN if k in item]
            print(" ".join(shown) or "(no id, name, enabled or status)", file=out)
    print(f"kept in {path}", file=out)
    return 1 if isinstance(body, dict) and ("detailCode" in body or "error" in body) else 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
