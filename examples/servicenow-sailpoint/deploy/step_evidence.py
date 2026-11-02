"""Evidence records for each scripted deployment step, hash-chained, and the check that a stage's evidence is complete.

Each time preflight.py, smoke_test.py or rollback.py writes its --out-json
file, it also appends one record to steps.jsonl in the same folder: the step
(the file's name), the UTC time, the environment, the exact command, the
result, the output file's SHA-256, and the requirements the step supports,
each NIST SP 800-53 control with the FedRAMP 20x Key Security Indicators whose
related controls include it. Records are chained the way the kit's evidence
export chains its records (evidence_export.chain): each carries prev_sha256
and record_sha256, so a removed, edited or reordered record shows.

The KSIs are FedRAMP's indicators for cloud service providers. The agency
doesn't report them; it lines its own evidence up with what its providers
report against them. The control-to-KSI pairs are taken from FedRAMP's
"Related SP 800-53 Controls" for each indicator, as the workbook cites them.

  python deploy/step_evidence.py --verify out/evidence/test --stage test

checks the chain, every required step's record (present, passing), and every
required file (the workflows, their executions and state changes, the re-read
and the evidence package). It prints one line per requirement and exits 1 on
anything missing or failing: the promotion go/no-go runs it on the test stage.
Reads files only; it calls no network.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shlex
import sys
from pathlib import Path
from typing import Any, Iterable

KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT / "clients" / "python"))

import evidence_export as ee  # noqa: E402
import kit_common as kc  # noqa: E402

STEPS_FILE = "steps.jsonl"

# NIST SP 800-53 Rev. 5 control -> FedRAMP 20x KSIs whose related controls include it.
KSI = {
    "SA-9": ["KSI-SCR-MIT"],
    "AC-6": ["KSI-IAM-ELP", "KSI-IAM-JIT"],
    "IA-5 (non-user)": ["KSI-IAM-SNU"],
    "AC-2": ["KSI-IAM-SNU", "KSI-IAM-JIT"],
    "CM-3": ["KSI-CMT-LMC", "KSI-CMT-RMV", "KSI-CMT-RVP", "KSI-CMT-VTD"],
    "CM-3(2)": ["KSI-CMT-LMC", "KSI-CMT-RVP", "KSI-CMT-VTD"],
    "CM-3(4)": ["KSI-CMT-RVP"],
    "CM-4(2)": ["KSI-CMT-LMC", "KSI-CMT-VTD"],
    "CM-5": ["KSI-CMT-RMV", "KSI-CMT-RVP", "KSI-IAM-JIT"],
    "CA-7": ["KSI-MLA-EVC"],
    "AU-12": ["KSI-MLA-LET"],
    "CP-10": ["KSI-RPL-ARP", "KSI-RPL-TRC"],
    "SA-10": ["KSI-SCR-MIT"],
}

# What each script's step supports. FedRAMP use of the services (Gate 1) has no control ID of its own here.
SCRIPT_REQUIREMENTS = {
    "deploy/preflight.py": ["SA-9", "AC-6", "IA-5 (non-user)", "CM-3", "CA-7"],
    "deploy/smoke_test.py raise": ["CM-3(2)", "CM-4(2)", "AU-12"],
    "deploy/smoke_test.py signal": ["CM-3(2)", "CM-4(2)", "AU-12"],
    "deploy/smoke_test.py check": ["CM-3(2)", "CM-4(2)", "CA-7"],
    "deploy/rollback.py": ["CM-3", "CP-10"],
}

# Step records the go/no-go needs from each stage (the --out-json names the runbook uses).
STAGE_STEPS = {
    "test": ["preflight-2-installed", "preflight-3-created", "check-1-native", "check-2-mover", "check-3-native",
             "preflight-4-enabled", "smoke-1-raise", "smoke-2-direct-open", "smoke-3-native-changed",
             "smoke-4-native-reverted", "smoke-5-signal", "smoke-8-direct-closed", "smoke-8-native-closed",
             "smoke-8-mover-closed", "rollback-verify"],
}
STAGE_STEPS["production"] = [s for s in STAGE_STEPS["test"] if s != "rollback-verify"]

# Files the go/no-go needs, with the check each must pass: (file, key, expected value or None for "present").
STAGE_FILES = {
    "test": [("fedramp-products.json", None, None)]
    + [(f"workflow-{n}.json", "id", None) for n in (1, 2, 3)]
    + [(f"execution-{n}.json", "status", "Completed") for n in (1, 2, 3)]
    + [(f"enable-{n}.json", "enabled", True) for n in (1, 2, 3)]
    + [(f"disable-{n}.json", "enabled", False) for n in (1, 2, 3)]
    + [("smoke-7-reread-applied.json", None, None), ("rollback-plan.txt", None, None)],
}
STAGE_FILES["production"] = [f for f in STAGE_FILES["test"]
                             if not f[0].startswith("disable-") and f[0] != "rollback-plan.txt"]


def requirements_for(script: str) -> list[dict]:
    return [{"control": c, "ksi": KSI[c]} for c in SCRIPT_REQUIREMENTS[script]]


def _sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def read_steps(folder: str) -> list[dict]:
    path = os.path.join(folder, STEPS_FILE)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def append(out_json: str, script: str, argv: Iterable[str], environment: str | None, settings: str, mode: str,
           ok: bool, summary: str, now: str | None = None) -> dict:
    """Append one chained step record beside out_json; return it."""
    folder = os.path.dirname(out_json) or "."
    previous = read_steps(folder)
    head = previous[-1]["record_sha256"] if previous else None
    base = script.split(" ")[0]
    record = {
        "record": os.path.splitext(os.path.basename(out_json))[0],
        "script": script,
        "timestamp": now or kc.utc_now(),
        "environment": environment,
        "settings": settings,
        "mode": mode,
        "command": "python " + base + " " + shlex.join(list(argv)),
        "result": "pass" if ok else "fail",
        "summary": summary,
        "output_file": os.path.basename(out_json),
        "output_sha256": _sha256_file(out_json),
        "requirements": requirements_for(script),
        "checker": f"deploy/step_evidence.py/{kc.KIT_VERSION}",
    }
    linked, _ = ee.chain([record], head)
    with open(os.path.join(folder, STEPS_FILE), "a", encoding="utf-8", newline="\n") as handle:
        handle.write(kc.canonical_json(linked[0]) + "\n")
    return linked[0]


def _value(path: str, key: str) -> Any:
    with open(path, encoding="utf-8") as handle:
        return json.load(handle).get(key)


def verify_stage(folder: str, stage: str) -> list[dict]:
    """One row per requirement of the stage: {"item", "ok", "detail"}."""
    rows: list[dict] = []
    steps = read_steps(folder)
    problems = ee.verify_chain(steps)
    rows.append({"item": STEPS_FILE + " chain", "ok": bool(steps) and not problems,
                 "detail": f"{len(steps)} records, chain unbroken" if steps and not problems
                 else ("; ".join(problems) or "no step records")})
    latest = {s["record"]: s for s in steps}
    for name in STAGE_STEPS[stage]:
        record = latest.get(name)
        if record is None:
            rows.append({"item": name, "ok": False, "detail": "no step record"})
            continue
        path = os.path.join(folder, record["output_file"])
        intact = os.path.exists(path) and _sha256_file(path) == record["output_sha256"]
        controls = ", ".join(r["control"] for r in record["requirements"])
        ksis = ", ".join(sorted({k for r in record["requirements"] for k in r["ksi"]}))
        ok = record["result"] == "pass" and record["mode"] == "live" and intact
        detail = f"{record['result']}, {record['mode']}, {record['timestamp']}; {controls}; {ksis}"
        if not intact:
            detail += "; the output file is missing or changed since it was recorded"
        rows.append({"item": name, "ok": ok, "detail": detail})
    for name, key, expected in STAGE_FILES[stage]:
        path = os.path.join(folder, name)
        if not os.path.exists(path):
            rows.append({"item": name, "ok": False, "detail": "missing"})
        elif key is None:
            rows.append({"item": name, "ok": True, "detail": "present"})
        else:
            try:
                value = _value(path, key)
            except (json.JSONDecodeError, AttributeError):
                value = None
            ok = value == expected if expected is not None else bool(value)
            rows.append({"item": name, "ok": ok, "detail": f"{key}={value}"})
    package = os.path.join(folder, "evidence-package")
    if os.path.isdir(package):
        issues = ee.verify_package(package)
        rows.append({"item": "evidence-package", "ok": not issues, "detail": "; ".join(issues) or "verifies"})
    else:
        rows.append({"item": "evidence-package", "ok": False, "detail": "missing"})
    return rows


def main(argv: list[str] | None = None, out=None) -> int:
    out = out or sys.stdout
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--verify", required=True, metavar="FOLDER", help="A stage's evidence folder")
    parser.add_argument("--stage", choices=sorted(STAGE_STEPS), required=True)
    args = parser.parse_args(argv)
    rows = verify_stage(args.verify, args.stage)
    for row in rows:
        print(f"  {'PASS' if row['ok'] else 'FAIL'}  {row['item']:<28} {row['detail']}", file=out)
    failed = sum(1 for r in rows if not r["ok"])
    print(f"Result: {len(rows) - failed} of {len(rows)} present and passing"
          + (": evidence complete" if not failed else ": evidence incomplete"), file=out)
    return 1 if failed else 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
