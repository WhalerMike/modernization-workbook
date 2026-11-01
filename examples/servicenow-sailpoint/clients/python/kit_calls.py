"""List the least privilege each task needs, and compare it with what an integration was granted.

Reads config/calls.json, the kit's declared call list: every HTTP call a
Python client makes, the task that makes it, and the least-privileged
permission, scope or role it needs, with the vendor page that says so.

  * --task NAME prints the calls and permissions for one task, by system;
  * --granted compares what you were actually granted on one system (ISC
    API client scopes, Microsoft Graph application permissions, ServiceNow
    roles) with what the task needs, and fails on anything missing or extra.

Grants are typed or exported by the operator; this tool calls no network.
A test (tests/python/test_kit_calls.py) runs the clients against a fake
HTTP session and fails if any call they make isn't declared here.

Examples (from the kit root):

  # What the re-read client needs, on every system
  python clients/python/kit_calls.py --task reread

  # Compare an ISC API client's scopes with what the drift client needs
  python clients/python/kit_calls.py --task drift --system isc --granted "sp:search:read,idn:accounts:read,idn:accounts:manage"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Iterable, Mapping

KIT = Path(__file__).resolve().parents[2]
CALLS = KIT / "config" / "calls.json"
SYSTEMS = ("isc", "servicenow", "graph")


def load_calls(path: Path | str = CALLS) -> dict:
    with open(path, encoding="utf-8") as handle:
        data = json.load(handle)
    for call in data["calls"]:
        if call["system"] not in SYSTEMS:
            raise ValueError(f"{call['id']}: unknown system {call['system']!r}")
        for task in call["tasks"]:
            if task not in data["tasks"]:
                raise ValueError(f"{call['id']}: undeclared task {task!r}")
    return data


def calls_for(data: Mapping[str, Any], task: str, system: str | None = None) -> list[dict]:
    if task not in data["tasks"]:
        raise ValueError(f"Unknown task {task!r}; one of {sorted(data['tasks'])}")
    return [c for c in data["calls"] if task in c["tasks"] and (system is None or c["system"] == system)]


def required(data: Mapping[str, Any], task: str, system: str, include_optional: bool = True) -> set[str]:
    """The permission names a task needs on a system (token calls excluded)."""
    out: set[str] = set()
    for call in calls_for(data, task, system):
        if call.get("kind") == "token" or (call.get("optional") and not include_optional):
            continue
        out.add(permission_name(call["permission"]))
    return out


def permission_name(text: str) -> str:
    """'x_example_idkit.verifier (read on ...)' -> 'x_example_idkit.verifier'."""
    return text.split(" (", 1)[0].strip()


def compare(needed: Iterable[str], granted: Iterable[str]) -> dict:
    needed, granted = set(needed), {g.strip() for g in granted if g.strip()}
    return {"missing": sorted(needed - granted), "extra": sorted(granted - needed), "ok": needed == granted}


def _template_regex(path: str) -> re.Pattern:
    parts = re.split(r"(\{[^}]+\})", path)
    return re.compile("".join("[^/]+" if p.startswith("{") else re.escape(p) for p in parts))


def match_call(data: Mapping[str, Any], method: str, url: str, task: str | None = None) -> dict | None:
    """The declared call a request matches, by method and the whole path (host and query ignored)."""
    path = re.sub(r"^https?://[^/]+", "", url).split("?", 1)[0]
    for call in data["calls"]:
        if call["method"] != method.upper() or (task and task not in call["tasks"]):
            continue
        if _template_regex(call["path"]).fullmatch(path):
            return call
    return None


def main(argv: list[str] | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--task", required=True, help="A task from config/calls.json (drift, reread, ...)")
    parser.add_argument("--system", choices=SYSTEMS, help="Only this system")
    parser.add_argument("--granted", help="Comma-separated permissions granted on --system; compares and fails on a difference")
    parser.add_argument("--required-only", action="store_true", help="With --granted, leave out optional calls")
    parser.add_argument("--calls", default=str(CALLS), help="The call list (default config/calls.json)")
    args = parser.parse_args(argv)
    data = load_calls(args.calls)
    if args.granted is not None and not args.system:
        parser.error("--granted needs --system")

    systems = [args.system] if args.system else list(SYSTEMS)
    print(f"Task {args.task}: {data['tasks'][args.task]}", file=out)
    for system in systems:
        calls = calls_for(data, args.task, system)
        if not calls:
            continue
        print(f"\n{system}", file=out)
        for call in calls:
            flag = " (optional)" if call.get("optional") else ""
            print(f"  {call['method']:<6} {call['path']:<58} {call['permission']}{flag}", file=out)
        print("  needs: " + ", ".join(sorted(required(data, args.task, system))), file=out)

    if args.granted is None:
        return 0
    result = compare(required(data, args.task, args.system, not args.required_only), args.granted.split(","))
    print("", file=out)
    print("missing: " + (", ".join(result["missing"]) or "none"), file=out)
    print("extra:   " + (", ".join(result["extra"]) or "none"), file=out)
    print("Least privilege holds." if result["ok"] else "Least privilege does not hold: fix the grant.", file=out)
    return 0 if result["ok"] else 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
