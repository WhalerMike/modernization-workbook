"""Evidence records for the deployment runbook: one JSON file per scripted step, naming the federal
requirements and the FedRAMP 20x Key Security Indicators the step supports, and a check that every
step a stage needs has a passing record before promotion.

Each deploy script calls `record()` after its run. A record holds the time (UTC), the environment,
tenant, cloud, mode and change record, the exact command, the result and its counts, the output folder
and the SHA-256 of that folder's manifest, and the requirement and KSI IDs from STEPS. The evidence
folder also keeps `evidence-index.csv` (one row per record) and `SHA256SUMS` over every file in it,
in `sha256sum -c` format, so the ISSO can check it with no tool of ours.

KSIs are FedRAMP's indicators for cloud service providers. The agency doesn't report KSIs; these IDs
line its own evidence up with what its providers report. The control-to-KSI pairs follow the
program's crosswalk (Book 13, Appendix A; Book 04, Chapter 10) and, for AC-2(1) and PS-4, the HR-driven
identity implementation guide's Gate 3 and Gate 6 tables.

    python deploy/evidence.py check --evidence-dir evidence/test/records --stage test
    python deploy/evidence.py show --step smoke-leaver

Illustrative: unit-tested against fixtures, not run against a live tenant. Standard library only.
Exit codes: 0 every required step has passing evidence, 2 findings, 1 error.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import io
import json
import os
import shlex
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "python"))
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, HrlcError, dump_json, exit_code, finding, read_json, sha256_file, sort_findings,
    summary_line, write_text,
)

SCHEMA = "fmp-hrlc-evidence/1"
DEFAULT_DIR = Path("out") / "evidence"
NOW_ENV = "HRLC_EVIDENCE_NOW"   # a fixed time for tests and reproducible dry runs

# Step -> the gate, NIST SP 800-53 Rev. 5 controls (Moderate), other federal requirements, and KSIs.
STEPS: dict[str, dict[str, Any]] = {
    "settings-check": {"gate": "All", "nist": ["CM-3", "CM-6", "IA-5"], "other": [],
                       "ksi": ["KSI-SVC-ACM", "KSI-SVC-ASM", "KSI-CMT-LMC"]},
    "preflight": {"gate": "Prerequisites, G1", "nist": ["AC-2", "AC-5", "AC-6", "CM-3(2)", "CM-6"],
                  "other": ["CISA BOD 25-01 MS.AAD.7.5v1", "FedRAMP AGU-USE-ABU"],
                  "ksi": ["KSI-IAM-JIT", "KSI-IAM-ELP", "KSI-CMT-VTD", "KSI-MLA-EVC"]},
    "workflows-recorded": {"gate": "G3, G6", "nist": ["AC-2(1)", "CM-3"], "other": [],
                           "ksi": ["KSI-IAM-JIT", "KSI-CMT-RMV", "KSI-CMT-LMC"]},
    "smoke-joiner": {"gate": "G2, G3", "nist": ["AC-2", "AC-2(1)", "IA-4(4)", "IA-5", "CM-4(2)"],
                     "other": ["OMB M-22-09"], "ksi": ["KSI-IAM-AAM", "KSI-IAM-JIT", "KSI-IAM-APM", "KSI-CMT-VTD"]},
    "smoke-mover": {"gate": "G4", "nist": ["AC-2", "AC-6", "PS-5", "CM-4(2)"], "other": [],
                    "ksi": ["KSI-IAM-AAM", "KSI-IAM-ELP", "KSI-CMT-VTD"]},
    "smoke-leaver": {"gate": "G6", "nist": ["PS-4", "AC-2(3)", "CM-4(2)"], "other": [],
                     "ksi": ["KSI-IAM-ELP", "KSI-IAM-AAM", "KSI-IAM-JIT", "KSI-IAM-SUS", "KSI-CMT-VTD"]},
    "smoke-scope": {"gate": "G2 to G6", "nist": ["AC-2", "AC-2(1)", "PS-4", "PS-5", "CM-4(2)"],
                    "other": ["OMB M-22-09"],
                    "ksi": ["KSI-IAM-AAM", "KSI-IAM-JIT", "KSI-IAM-ELP", "KSI-IAM-SUS", "KSI-CMT-VTD"]},
    "rollback-plan": {"gate": "Rollback", "nist": ["CM-3", "CM-5"], "other": [],
                      "ksi": ["KSI-CMT-RMV", "KSI-CMT-RVP", "KSI-IAM-JIT"]},
    "rollback-verify": {"gate": "Rollback", "nist": ["CM-3", "CM-4(2)"], "other": [],
                        "ksi": ["KSI-CMT-LMC", "KSI-CMT-VTD"]},
}
# The steps each stage must have passing evidence for before it counts as done.
REQUIRED = {
    "test": ["settings-check", "preflight", "workflows-recorded", "smoke-joiner", "smoke-mover", "smoke-leaver",
             "rollback-plan", "rollback-verify"],
    "production": ["settings-check", "preflight", "workflows-recorded", "smoke-scope", "rollback-plan"],
}
INDEX_FIELDS = ["timestamp", "step", "environment", "result", "record", "recordSha256"]


def now() -> dt.datetime:
    fixed = os.environ.get(NOW_ENV)
    if fixed:
        return dt.datetime.fromisoformat(fixed.replace("Z", "+00:00")).astimezone(dt.timezone.utc)
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0)


def command_line(script: str, argv: list[str]) -> str:
    return "python deploy/" + script + (" " + shlex.join(argv) if argv else "")


def record(evidence_dir: Path, step: str, settings: dict[str, Any], mode: str, command: str,
           rows: list[dict[str, Any]], output: Path | None = None) -> Path:
    """Write one evidence record, add it to the index and rewrite SHA256SUMS. A step passes when it
    has no Finding and no Warn (its exit code is 0)."""
    if step not in STEPS:
        raise HrlcError(f"no requirements mapped for step {step!r}")
    evidence_dir = Path(evidence_dir)
    t = now()
    stamp = t.strftime("%Y%m%dT%H%M%SZ")
    counts = {s: sum(1 for r in rows if r["Severity"] == s) for s in ("Finding", "Warn", "Info")}
    out_manifest = Path(output) / "manifest.json" if output else None
    rec = {
        "schema": SCHEMA, "step": step, "gate": STEPS[step]["gate"], "timestamp": t.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "environment": settings.get("environment"), "cloud": settings.get("cloud"), "tenantId": settings.get("tenantId"),
        "changeRecord": settings.get("changeRecord"), "mode": mode, "command": command,
        "result": "pass" if exit_code(rows) == 0 else "fail", "counts": counts,
        "rules": sorted({r["Rule"] for r in rows if r["Severity"] in ("Finding", "Warn")}),
        "output": Path(output).as_posix() if output else None,
        "outputManifestSha256": sha256_file(out_manifest) if out_manifest and out_manifest.exists() else None,
        "requirements": {"nist80053": STEPS[step]["nist"], "other": STEPS[step]["other"]},
        "ksi": STEPS[step]["ksi"],
    }
    path = evidence_dir / f"{step}-{stamp}.json"
    n = 1
    while path.exists():
        n += 1
        path = evidence_dir / f"{step}-{stamp}-{n}.json"
    write_text(path, dump_json(rec))
    index = evidence_dir / "evidence-index.csv"
    new = not index.exists()
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=INDEX_FIELDS, lineterminator="\n")
    if new:
        w.writeheader()
    w.writerow({"timestamp": rec["timestamp"], "step": step, "environment": rec["environment"],
                "result": rec["result"], "record": path.name, "recordSha256": sha256_file(path)})
    with open(index, "a", encoding="utf-8", newline="") as f:
        f.write(buf.getvalue())
    write_sums(evidence_dir)
    return path


def write_sums(evidence_dir: Path) -> None:
    lines = [f"{sha256_file(p)}  {p.relative_to(evidence_dir).as_posix()}"
             for p in sorted(evidence_dir.rglob("*")) if p.is_file() and p.name != "SHA256SUMS"]
    write_text(evidence_dir / "SHA256SUMS", "\n".join(lines) + "\n")


def check(evidence_dir: Path, stage: str, base: Path | None = None) -> list[dict[str, Any]]:
    """EV-01 to EV-04: for each step the stage requires, the newest record exists, passed, is for that
    stage, and its output folder's manifest still has the hash it was recorded with; and SHA256SUMS
    matches every file in the folder."""
    evidence_dir = Path(evidence_dir)
    base = Path(base) if base else Path.cwd()
    if stage not in REQUIRED:
        raise HrlcError("--stage must be test or production")
    rows: list[dict[str, Any]] = []
    sums = evidence_dir / "SHA256SUMS"
    listed: dict[str, str] = {}
    if sums.exists():
        for line in sums.read_text(encoding="utf-8").splitlines():
            if line.strip():
                digest, name = line.split("  ", 1)
                listed[name] = digest
    for name, digest in listed.items():
        p = evidence_dir / name
        if not p.exists() or sha256_file(p) != digest:
            rows.append(finding("EV-04", "Finding", f"sums:{name}", name, "doesn't match SHA256SUMS"))
    records = []
    for p in sorted(evidence_dir.glob("*.json")):
        r = read_json(p)
        if r.get("schema") == SCHEMA:
            if p.relative_to(evidence_dir).as_posix() not in listed:
                rows.append(finding("EV-04", "Finding", f"sums:{p.name}", p.name, "not in SHA256SUMS"))
            records.append((r, p))
    for step in REQUIRED[stage]:
        mine = sorted([x for x in records if x[0]["step"] == step], key=lambda x: (x[0]["timestamp"], x[1].name))
        req = STEPS[step]
        label = f"{step} ({', '.join(req['nist'])}; {', '.join(req['ksi'])})"
        if not mine:
            rows.append(finding("EV-01", "Finding", step, step, f"no evidence record for {label}"))
            continue
        r, p = mine[-1]
        if r.get("environment") != stage:
            rows.append(finding("EV-02", "Finding", step, p.name, f"the record is for {r.get('environment')}, not {stage}"))
        elif r.get("result") != "pass":
            rows.append(finding("EV-02", "Finding", step, p.name,
                                f"the newest record failed: {', '.join(r.get('rules') or [])}"))
        elif r.get("output") and r.get("outputManifestSha256"):
            man = base / r["output"] / "manifest.json"
            if not man.exists() or sha256_file(man) != r["outputManifestSha256"]:
                rows.append(finding("EV-03", "Finding", step, p.name, f"{r['output']}/manifest.json is missing or changed"))
            else:
                rows.append(finding("EV-01", "Info", step, p.name, f"passed at {r['timestamp']}: {label}"))
        else:
            rows.append(finding("EV-01", "Info", step, p.name, f"passed at {r['timestamp']}: {label}"))
    return sort_findings(rows)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check", help="check a stage's evidence (EV-01 to EV-04): the go/no-go's evidence criterion")
    c.add_argument("--evidence-dir", type=Path, default=DEFAULT_DIR)
    c.add_argument("--stage", required=True, choices=sorted(REQUIRED))
    c.add_argument("--base", type=Path, help="the folder the records' output paths are relative to (default: here)")
    s = sub.add_parser("show", help="print the requirements and KSIs a step's record carries")
    s.add_argument("--step", required=True, choices=sorted(STEPS))
    args = ap.parse_args(argv)
    try:
        if args.cmd == "show":
            st = STEPS[args.step]
            print(f"{args.step} ({st['gate']}): NIST {', '.join(st['nist'])}"
                  + (f"; {', '.join(st['other'])}" if st["other"] else "") + f"; {', '.join(st['ksi'])}")
            return 0
        rows = check(args.evidence_dir, args.stage, args.base)
        for r in rows:
            print(f"{r['Rule']} {r['Severity']:7} {r['Object']}: {r['Issue']}")
        print(summary_line(f"Evidence for the {args.stage} stage in {args.evidence_dir.as_posix()}", rows))
        return exit_code(rows)
    except (HrlcError, ValueError, KeyError, OSError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
