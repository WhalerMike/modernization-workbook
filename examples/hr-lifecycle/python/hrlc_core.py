"""Shared pieces of the HR lifecycle example: the cloud table, the declared call list, findings,
time helpers, and the output folder every tool writes (its files plus a manifest with a SHA-256 per
file).

Not a command: the tools in this folder import it. Standard library only; Python 3.10 or later.
Illustrative: unit-tested against fixtures, not proven against a live tenant.
"""
from __future__ import annotations

import csv
import datetime as dt
import hashlib
import json
from pathlib import Path
from typing import Any, Iterable

KIT = Path(__file__).resolve().parents[1]
CALLS = KIT / "config" / "calls.json"

EXIT_OK, EXIT_ERROR, EXIT_FINDINGS = 0, 1, 2
SEVERITIES = ("Finding", "Warn", "Info")
COUNTED = ("Finding", "Warn")

# Graph host per cloud (Learn, "Microsoft Graph national cloud deployments"): Microsoft 365 GCC uses
# the worldwide service; GCC High and DoD have their own hosts. No default: a tool must be told.
CLOUDS = {
    "gcc": {"graph": "graph.microsoft.com", "login": "login.microsoftonline.com", "azureGovernment": False},
    "gcchigh": {"graph": "graph.microsoft.us", "login": "login.microsoftonline.us", "azureGovernment": True},
    "dod": {"graph": "dod-graph.microsoft.us", "login": "login.microsoftonline.us", "azureGovernment": True},
}


class HrlcError(Exception):
    """A refusal or bad input: the tool stops and exits 1."""


def cloud(name: str | None) -> dict[str, Any]:
    if not name:
        raise HrlcError("name the cloud: --cloud gcc, gcchigh or dod (there is no default)")
    key = name.lower()
    if key not in CLOUDS:
        raise HrlcError(f"unknown cloud {name!r}; expected gcc, gcchigh or dod")
    return dict(CLOUDS[key], name=key)


# ---------------------------------------------------------------- the declared calls

def load_calls(path: Path = CALLS) -> dict[str, Any]:
    data = read_json(path)
    for c in data["calls"]:
        if c["method"] != "GET":
            raise HrlcError(f"call {c['id']} is {c['method']}; this example only reads")
        if c["task"] not in data["tasks"]:
            raise HrlcError(f"call {c['id']} names unknown task {c['task']}")
    return data


def task_calls(task: str, data: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    data = data or load_calls()
    if task not in data["tasks"]:
        raise HrlcError(f"unknown task {task!r}; expected one of {', '.join(sorted(data['tasks']))}")
    return [c for c in data["calls"] if c["task"] == task]


def call_permissions(call: dict[str, Any]) -> set[str]:
    return {p.strip() for p in call["permission"].split(",") if p.strip()}


def task_permissions(task: str, data: dict[str, Any] | None = None) -> list[str]:
    """The declared permissions for a task (the tests check they equal the union of its calls)."""
    data = data or load_calls()
    return sorted(data["tasks"][task]["graphPermissions"])


# ---------------------------------------------------------------- files

def read_json(path: Path) -> Any:
    with open(path, encoding="utf-8-sig") as f:
        return json.load(f)


def values(data: Any) -> list[dict[str, Any]]:
    """A Graph export: either {'value': [...]} or a bare list."""
    if isinstance(data, dict) and "value" in data:
        return list(data["value"])
    if isinstance(data, list):
        return data
    raise HrlcError("expected a Graph collection ({'value': [...]}) or a list")


def read_csv(path: Path) -> list[dict[str, str]]:
    with open(path, encoding="utf-8-sig", newline="") as f:
        return [{k: (v or "").strip() for k, v in row.items()} for row in csv.DictReader(f)]


def dump_json(obj: Any) -> str:
    return json.dumps(obj, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, lineterminator="\n", extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)


def csv_text(rows: list[dict[str, Any]], fields: list[str]) -> str:
    """CSV with LF line endings, for a file listed in an output manifest."""
    import io
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=fields, lineterminator="\n", extrasaction="ignore")
    w.writeheader()
    for r in rows:
        w.writerow(r)
    return buf.getvalue()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


# ---------------------------------------------------------------- time

def parse_time(value: str | None) -> dt.datetime | None:
    """An ISO 8601 date or date-time as an aware UTC datetime; a bare date is midnight UTC."""
    if value is None or str(value).strip() == "":
        return None
    s = str(value).strip().replace("Z", "+00:00")
    try:
        t = dt.datetime.fromisoformat(s)
    except ValueError as e:
        raise HrlcError(f"not an ISO 8601 date or time: {value!r}") from e
    if t.tzinfo is None:
        t = t.replace(tzinfo=dt.timezone.utc)
    return t.astimezone(dt.timezone.utc)


def iso(t: dt.datetime | None) -> str:
    return "" if t is None else t.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def hours(a: dt.datetime, b: dt.datetime) -> float:
    return round((b - a).total_seconds() / 3600, 2)


# ---------------------------------------------------------------- findings

def fingerprint(rule: str, key: str) -> str:
    """A stable ID for one finding: the same rule and object key give the same value (the drift
    pipeline's rule: no names, no free text)."""
    return hashlib.sha256(f"{rule}|{key}|".encode("utf-8")).hexdigest()[:16]


def finding(rule: str, severity: str, key: str, obj: str, issue: str, **extra: Any) -> dict[str, Any]:
    if severity not in SEVERITIES:
        raise ValueError(f"severity {severity!r}")
    row = {"Rule": rule, "Severity": severity, "ObjectKey": key, "Object": obj, "Issue": issue,
           "Fingerprint": fingerprint(rule, key)}
    row.update(extra)
    return row


def sort_findings(rows: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    order = {s: i for i, s in enumerate(SEVERITIES)}
    return sorted(rows, key=lambda r: (order[r["Severity"]], r["Rule"], r["ObjectKey"]))


def counts(rows: Iterable[dict[str, Any]]) -> dict[str, int]:
    c = {s: 0 for s in SEVERITIES}
    for r in rows:
        c[r["Severity"]] += 1
    return c


def summary_line(label: str, rows: list[dict[str, Any]]) -> str:
    c = counts(rows)
    return f"{label}: {c['Finding']} Finding, {c['Warn']} Warn, {c['Info']} Info"


def exit_code(rows: list[dict[str, Any]]) -> int:
    return EXIT_FINDINGS if any(r["Severity"] in COUNTED for r in rows) else EXIT_OK


# ---------------------------------------------------------------- the output folder

def write_output(out_dir: Path, task: str, files: dict[str, Any], meta: dict[str, Any]) -> Path:
    """Write each file (dict or list as JSON, str as text) into out_dir, then manifest.json with the
    task, the run's metadata and a SHA-256 per file. Refuses to write into a folder that already
    holds a manifest: an output is written once."""
    out_dir = Path(out_dir)
    if (out_dir / "manifest.json").exists():
        raise HrlcError(f"{out_dir} already holds a manifest.json; write each run to a new folder")
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, content in files.items():
        if isinstance(content, str):
            write_text(out_dir / name, content)
        else:
            write_text(out_dir / name, dump_json(content))
    listed = {name: sha256_file(out_dir / name) for name in sorted(files)}
    manifest = {"schema": "fmp-hrlc-output/1", "task": task, "readOnly": True, "files": listed}
    manifest.update(meta)
    write_text(out_dir / "manifest.json", dump_json(manifest))
    return out_dir / "manifest.json"
