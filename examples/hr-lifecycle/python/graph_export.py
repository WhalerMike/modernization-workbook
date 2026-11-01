"""Export the Microsoft Graph reads one HR lifecycle task needs, GET only, to one JSON file per call.

Every call comes from config/calls.json with its least-privileged permission; a task reads only its
own calls, on its cloud's own Graph host, following @odata.nextLink only on that host. The other tools
read these files, so a lab runs the same code against fixtures. A bearer token for the cloud comes
from the HRLC_GRAPH_TOKEN environment variable; nothing is written to the tenant.

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python python/graph_export.py --task cba-read --list
    python python/graph_export.py --task cba-read --cloud gcc --param pkiId=<id> --out exports/cba

Exit codes: 0 exported (or listed), 1 error or refusal.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Callable

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, EXIT_OK, HrlcError, call_permissions, cloud, dump_json, load_calls, task_calls,
    task_permissions, write_text,
)

TOKEN_ENV = "HRLC_GRAPH_TOKEN"


def build_url(call: dict[str, Any], host: str, params: dict[str, str]) -> str:
    path, query = call["path"], call.get("query", "")
    for k, v in params.items():
        path = path.replace("{" + k + "}", urllib.parse.quote(v, safe=""))
        query = query.replace("{" + k + "}", v)
    if "{" in path or "{" in query:
        raise HrlcError(f"call {call['id']} needs a parameter: --param name=value for each {{name}} in {call['path']} {query}")
    url = f"https://{host}/v1.0{path}"
    return url + ("?" + urllib.parse.quote(query, safe="=&$,'()/:") if query else "")


def fetch_all(url: str, host: str, headers: dict[str, str], opener: Callable[[urllib.request.Request], Any]) -> list[Any]:
    """GET a collection and every page after it. A next link to another host is refused."""
    out: list[Any] = []
    while url:
        if urllib.parse.urlparse(url).hostname != host:
            raise HrlcError(f"refusing a next link off {host}: {url}")
        req = urllib.request.Request(url, method="GET", headers=headers)
        with opener(req) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        if "value" in body:
            out.extend(body["value"])
            url = body.get("@odata.nextLink", "")
        else:
            return [body]
    return out


def export(task: str, cloud_name: str, params: dict[str, str], out_dir: Path, token: str,
           opener: Callable[[urllib.request.Request], Any] = urllib.request.urlopen) -> list[dict[str, Any]]:
    c = cloud(cloud_name)
    if not token:
        raise HrlcError(f"no token: set {TOKEN_ENV} to a bearer token for {c['graph']}")
    written = []
    for call in task_calls(task):
        url = build_url(call, c["graph"], params)
        headers = {"Authorization": f"Bearer {token}", **call.get("headers", {})}
        rows = fetch_all(url, c["graph"], headers, opener)
        target = Path(out_dir) / f"{call['id']}.json"
        write_text(target, dump_json({"value": rows}))
        written.append({"call": call["id"], "url": url, "count": len(rows), "file": target.name})
    write_text(Path(out_dir) / "export.json", dump_json({"task": task, "cloud": c["name"], "calls": written}))
    return written


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--task", required=True, help="a task in config/calls.json")
    ap.add_argument("--list", action="store_true", help="print the task's calls and permissions, and stop")
    ap.add_argument("--cloud", help="gcc, gcchigh or dod (no default)")
    ap.add_argument("--param", action="append", default=[], help="name=value for a {name} in a call's path or query")
    ap.add_argument("--out", type=Path, help="folder for the exported JSON")
    args = ap.parse_args(argv)
    try:
        data = load_calls()
        calls = task_calls(args.task, data)
        if args.list:
            print(f"Task {args.task}: {', '.join(task_permissions(args.task, data))}")
            for c in calls:
                print(f"  GET {c['path']}  [{', '.join(sorted(call_permissions(c)))}]")
            return EXIT_OK
        if not args.out:
            raise HrlcError("--out is required to export")
        params = dict(p.split("=", 1) for p in args.param)
        for w in export(args.task, args.cloud, params, args.out, os.environ.get(TOKEN_ENV, "")):
            print(f"{w['call']}: {w['count']} rows -> {w['file']}")
        return EXIT_OK
    except (HrlcError, ValueError, OSError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
