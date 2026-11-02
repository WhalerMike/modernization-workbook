"""Evidence records for the Attribute-Driven Migration deployment runbook, and the check that each requirement has one.

Book 19, Chapter 10. Each runbook step leaves an evidence record: a JSON file with the time, the stage, the
change record, the command, the result, the files it produced (each with its SHA-256), and the NIST SP 800-53
controls and FedRAMP 20x Key Security Indicator IDs the step supports, taken from deploy/requirements.json.
Records go in <stage evidence folder>/evidence/, numbered in order, and every write refreshes
evidence/SHA256SUMS, in the format `sha256sum -c` reads, as the drift pipeline's packager does.
preflight.py, smoke_test.py and rollback.py write their own records; `add` writes one for a step whose
output comes from another kit. `check` says whether every requirement row for the stage has a passing
record whose files still match, and writes evidence-check.json, which production's pre-flight reads.

The KSIs are cloud providers' indicators under FedRAMP 20x. The agency lines its evidence up with what its
providers report against them; it doesn't report KSIs itself.

Illustrative: unit-tested against fixtures, not run against a live tenant. Standard library only.

    python deploy/evidence.py add   --settings <file> --step <step> --command <text> --result pass|fail|recorded [--file <path> ...]
    python deploy/evidence.py check --settings <file> [--out <dir>]
    python deploy/evidence.py table --stage test|production --step <step>      # the chapter's Markdown table

Exit codes: 0 written (check: every row evidenced), 2 check found a missing or failing row, 1 refused.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

import adm_deploy as ad  # noqa: E402

RECORD_SCHEMA = "adm-evidence-record/1"
CHECK_SCHEMA = "adm-evidence-check/1"
RESULTS = ("pass", "fail", "recorded")
REQUIREMENTS = ad.DEPLOY / "requirements.json"
SUMS = "SHA256SUMS"
EXIT_OK, EXIT_ERROR, EXIT_MISSING = 0, 1, 2


class EvidenceError(Exception):
    """An evidence record or check the runbook refuses."""


def requirements() -> list[dict[str, Any]]:
    return json.loads(REQUIREMENTS.read_text(encoding="utf-8"))["rows"]


def rows_for(stage: str, step: str | None = None) -> list[dict[str, Any]]:
    return [r for r in requirements() if r["stage"] in ("both", stage) and (step is None or r["step"] == step)]


def steps() -> list[str]:
    out: list[str] = []
    for r in requirements():
        if r["step"] not in out:
            out.append(r["step"])
    return out


def evidence_dir(s: dict, settings_path: Path) -> Path:
    return Path(ad.derived(s, settings_path)["ADM_EVIDENCE_DIR"]) / "evidence"


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _cite(f: Path, stage: Path) -> str:
    """A cited file's path, relative to the stage's evidence folder when it can be, so records move with it."""
    try:
        return os.path.relpath(f.resolve(), stage.resolve()).replace(os.sep, "/")
    except ValueError:
        return str(f.resolve())


def _resolve(path: str, stage: Path) -> Path:
    p = Path(path)
    return p if p.is_absolute() else stage / p


def write_sums(folder: Path) -> Path:
    """SHA256SUMS over every record in the folder, in the format `sha256sum -c` reads."""
    lines = [f"{ad.sha256_file(p)}  {p.name}" for p in sorted(folder.glob("*.json"))]
    out = folder / SUMS
    out.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    return out


def add(s: dict, settings_path: Path, step: str, command: str, result: str, files: list[Path] | None = None,
        details: dict[str, Any] | None = None, when: str | None = None) -> Path:
    if step not in steps():
        raise EvidenceError(f"unknown step {step!r}; expected one of {', '.join(steps())}")
    if result not in RESULTS:
        raise EvidenceError(f"result must be one of {', '.join(RESULTS)}")
    rows = rows_for(s["environment"], step)
    folder = evidence_dir(s, settings_path)
    folder.mkdir(parents=True, exist_ok=True)
    seq = len(list(folder.glob("[0-9][0-9][0-9]-*.json"))) + 1
    listed = []
    for f in files or []:
        f = Path(f)
        if not f.is_file():
            raise EvidenceError(f"{f}: no such file to cite as evidence")
        listed.append({"path": _cite(f, folder.parent), "name": f.name, "sha256": ad.sha256_file(f)})
    record = {
        "schema": RECORD_SCHEMA, "seq": seq, "step": step, "environment": s["environment"],
        "change_record": s["change_record"], "tenant_id": s["tenant_id"], "cloud": s["cloud"],
        "recorded_at": when or _now(), "command": command, "result": result,
        "requirements": [r["id"] for r in rows],
        "controls": sorted({c for r in rows for c in r["controls"]}),
        "ksis": sorted({k for r in rows for k in r["ksis"]}),
        "mandates": sorted({m for r in rows for m in r.get("mandates", [])}),
        "files": listed, "details": details or {},
    }
    path = folder / f"{seq:03d}-{step}.json"
    path.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8", newline="\n")
    write_sums(folder)
    return path


def records(folder: Path) -> list[dict[str, Any]]:
    out = []
    for p in sorted(folder.glob("[0-9][0-9][0-9]-*.json")):
        rec = json.loads(p.read_text(encoding="utf-8"))
        if rec.get("schema") == RECORD_SCHEMA:
            rec["_file"] = p.name
            out.append(rec)
    return out


def sums_problems(folder: Path) -> list[str]:
    sums = folder / SUMS
    if not sums.is_file():
        return ["no SHA256SUMS"]
    listed = {}
    for line in sums.read_text(encoding="utf-8").splitlines():
        if line.strip():
            h, name = line.split(None, 1)
            listed[name.strip()] = h
    present = {p.name for p in folder.glob("*.json")}
    out = [f"{n} isn't in SHA256SUMS" for n in sorted(present - set(listed))]
    out += [f"{n} is in SHA256SUMS but missing" for n in sorted(set(listed) - present)]
    out += [f"{n} doesn't match its SHA-256" for n in sorted(present & set(listed)) if ad.sha256_file(folder / n) != listed[n]]
    return out


def check(s: dict, settings_path: Path) -> dict[str, Any]:
    folder = evidence_dir(s, settings_path)
    recs = records(folder) if folder.is_dir() else []
    tamper = sums_problems(folder) if folder.is_dir() else ["no evidence folder"]
    rows_out = []
    for r in rows_for(s["environment"]):
        mine = [x for x in recs if x["step"] == r["step"] and x["environment"] == s["environment"]
                and x["change_record"] == s["change_record"]]
        latest = mine[-1] if mine else None
        decisive = [x for x in mine if x["result"] in ("pass", "fail")]
        problems = []
        if latest is None:
            problems.append("no evidence record for this step")
        else:
            if not decisive:
                problems.append("only 'recorded' entries: the step has no passing record")
            elif decisive[-1]["result"] == "fail":
                problems.append(f"the latest pass/fail record ({decisive[-1]['_file']}) failed")
            if any(x.get("details", {}).get("fixture") for x in mine):
                problems.append("a record came from fixture mode, which proves nothing about the stage")
            for x in mine:
                for f in x["files"]:
                    p = _resolve(f["path"], folder.parent)
                    if not p.is_file():
                        problems.append(f"{f['name']} ({x['_file']}) is missing")
                    elif ad.sha256_file(p) != f["sha256"]:
                        problems.append(f"{f['name']} ({x['_file']}) changed after it was recorded")
        rows_out.append({"id": r["id"], "step": r["step"], "requirement": r["requirement"],
                         "controls": r["controls"], "ksis": r["ksis"], "record": latest["_file"] if latest else None,
                         "status": "evidenced" if not problems else "missing", "problems": problems})
    failed = [x for x in rows_out if x["status"] != "evidenced"]
    return {"schema": CHECK_SCHEMA, "environment": s["environment"], "change_record": s["change_record"],
            "tenant_id": s["tenant_id"], "checked_at": _now(), "records": len(recs), "sums_problems": tamper,
            "rows": rows_out, "missing": len(failed), "result": "fail" if failed or tamper else "pass"}


def table(stage: str, step: str) -> str:
    lines = ["| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |", "|---|---|---|---|"]
    for r in rows_for(stage, step):
        req = r["requirement"]
        lines.append(f"| {req} | {r['does']} | {', '.join(r['ksis'])} | {r['evidence']} |")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("add", help="write one evidence record")
    a.add_argument("--settings", required=True, type=Path)
    a.add_argument("--step", required=True)
    a.add_argument("--command", required=True)
    a.add_argument("--result", required=True, choices=RESULTS)
    a.add_argument("--file", action="append", type=Path, default=[])
    c = sub.add_parser("check", help="is every requirement row for the stage evidenced?")
    c.add_argument("--settings", required=True, type=Path)
    c.add_argument("--out", type=Path, help="default: the stage's evidence folder")
    t = sub.add_parser("table", help="print a step's requirement table in Markdown")
    t.add_argument("--stage", required=True, choices=ad.ENVIRONMENTS)
    t.add_argument("--step", required=True)
    args = ap.parse_args(argv)
    if args.cmd == "table":
        print(table(args.stage, args.step))
        return EXIT_OK
    try:
        s = ad.load_settings(args.settings)
        if args.cmd == "add":
            path = add(s, args.settings, args.step, args.command, args.result, args.file)
            print(f"evidence {path.name}: {args.step} {args.result}")
            return EXIT_OK
        rep = check(s, args.settings)
    except (ad.SettingsError, EvidenceError, OSError, json.JSONDecodeError) as exc:
        print(f"refused: {exc}", file=sys.stderr)
        return EXIT_ERROR
    for r in rep["rows"]:
        print(f"{'OK  ' if r['status'] == 'evidenced' else 'MISS'} {r['id']:<8} {r['step']:<10} "
              f"{', '.join(r['ksis']):<40} {r['record'] or '-'}" + (f"  ({'; '.join(r['problems'])})" if r["problems"] else ""))
    for p in rep["sums_problems"]:
        print(f"MISS SHA256SUMS: {p}")
    out = args.out or evidence_dir(s, args.settings).parent
    out.mkdir(parents=True, exist_ok=True)
    target = out / "evidence-check.json"
    target.write_text(json.dumps(rep, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"evidence check: {len(rep['rows']) - rep['missing']} of {len(rep['rows'])} requirement rows evidenced for "
          f"{rep['environment']}/{rep['change_record']}; {rep['result'].upper()}; evidence-check.json sha256 {ad.sha256_file(target)}")
    return EXIT_OK if rep["result"] == "pass" else EXIT_MISSING


if __name__ == "__main__":
    sys.exit(main())
