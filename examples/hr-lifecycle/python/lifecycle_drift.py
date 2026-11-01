"""Lifecycle drift classes and the six lifecycle metrics, written as one read-only run for the drift
pipeline to package for the ISSO.

Gate 7 of the HR-driven identity implementation guide. It finds the lifecycle drift classes of Book 03,
Chapter 11 (missing identity, stale access, orphan account, unauthorized write, credential drift,
contractor credential drift), computes the six metrics from the other chapters' outputs, and writes a
run folder: run.json, with a SHA-256 of each chapter output it read, and lifecycle/ with the findings,
the metrics and a manifest. Attribute drift is the ADM guide's Gate 9 (the validation kit and
examples/hcm-entra's correlation); this run doesn't repeat it. examples/drift-pipeline/python/hr_evidence.py
packages each run with a hash chain and assembles a period (Book 19, Chapter 09's pipeline).

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python python/lifecycle_drift.py run --hr tests/fixtures/ch07/hr-export.csv --contractors out/ch02/extract/decisions.json --users tests/fixtures/ch07/workforce-users.json --exceptions tests/fixtures/ch07/exceptions.csv --cards tests/fixtures/ch07/cards.csv --derivation tests/fixtures/ch07/derivation.json --writers out/ch01 --readiness out/ch03/readiness --residual out/ch04/residual --timing out/ch06 --config config/drift.json --since 2026-10-01 --until 2026-11-01 --cloud gcc --tenant-id 00000000-0000-4000-8000-00000000c0de --mode fixture --out out/ch07/2026-11-01T0600Z

Exit codes: 0 no drift and every metric within its threshold, 2 drift or a metric out of bounds, 1 error.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, HrlcError, cloud, dump_json, exit_code, finding, read_csv, read_json, sha256_file, sort_findings,
    summary_line, values, write_output, write_text,
)

RUN_SCHEMA = "fmp-hr-run/1"
INPUT_TASKS = {"writers": "writers-scan", "readiness": "joiner-readiness", "residual": "access-residual", "timing": "separation-timing"}


def chapter_output(folder: Path | None, task: str) -> tuple[dict[str, Any] | None, str | None]:
    """A chapter's output folder, checked against its own manifest; (None, None) when not given."""
    if folder is None:
        return None, None
    m = Path(folder) / "manifest.json"
    if not m.is_file():
        raise HrlcError(f"{folder}: no manifest.json")
    man = read_json(m)
    if man.get("task") != task:
        raise HrlcError(f"{folder}: manifest is for task {man.get('task')!r}, expected {task!r}")
    for rel, digest in (man.get("files") or {}).items():
        if sha256_file(Path(folder) / rel) != digest:
            raise HrlcError(f"{folder}/{rel} doesn't match its manifest")
    return man, sha256_file(m)


def drift_classes(hr: list[dict[str, str]], contractors: list[dict[str, Any]], users: list[dict[str, Any]],
                  exceptions: list[dict[str, str]], cards: list[dict[str, str]], writer_findings: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], float | None]:
    out = []
    hr_by = {r["PersonNumber"]: r for r in hr}
    ctr_by = {d["PersonKey"]: d for d in contractors}
    excepted = {(e.get("Id") or e.get("UserPrincipalName") or "").lower() for e in exceptions if e.get("Owner")}
    enabled = [u for u in users if u.get("accountEnabled")]
    by_key = {}
    for u in users:
        if u.get("employeeId"):
            by_key.setdefault(str(u["employeeId"]), []).append(u)
    resolved = 0
    for u in enabled:
        key, upn = str(u.get("employeeId") or ""), u.get("userPrincipalName", u.get("id", ""))
        if u.get("id", "").lower() in excepted or upn.lower() in excepted:
            resolved += 1
            continue
        h, c = hr_by.get(key), ctr_by.get(key)
        if h and h.get("AssignmentStatusType") in ("ACTIVE", "SUSPENDED"):
            resolved += 1
        elif c and c.get("Action") == "active":
            resolved += 1
        elif h and h.get("AssignmentStatusType") == "INACTIVE":
            out.append(finding("LD-02", "Finding", key, upn, f"terminated in HR ({h.get('TerminationDate') or 'no date'}) and enabled in the directory (stale access)"))
        elif c and c.get("Action") == "inactive":
            out.append(finding("LD-02", "Finding", key, upn, f"contractor past the earliest end {c.get('EarliestEnd')} and enabled (stale access)"))
        else:
            out.append(finding("LD-03", "Finding", u.get("id", upn), upn, "enabled account that matches no worker or contractor record (orphan)"))
    for key, h in sorted(hr_by.items()):
        if h.get("AssignmentStatusType") in ("ACTIVE", "SUSPENDED") and key not in by_key:
            out.append(finding("LD-01", "Finding", key, key, "active worker record with no account (missing identity)"))
    for f in writer_findings:
        if f.get("Rule") in ("WS-01", "WS-04"):
            out.append(finding("LD-04", "Finding", f["ObjectKey"], f["Object"], f"unauthorized write: {f['Issue']}"))
    for c in cards:
        if c.get("CardStatus") != "Active":
            continue
        key = c["PersonKey"]
        h, d = hr_by.get(key), ctr_by.get(key)
        if h and h.get("AssignmentStatusType") == "INACTIVE":
            out.append(finding("LD-05", "Finding", key, key, "active PIV card for a separated worker (credential drift)"))
        elif not h and (d is None or d.get("Action") != "active"):
            why = "the contractor source doesn't hold" if d is None else f"whose engagement ended {d.get('EarliestEnd')}"
            out.append(finding("LD-06", "Finding", key, key, f"active PIV card for a person {why} (contractor credential drift)"))
    coverage = round(resolved / len(enabled), 4) if enabled else None
    return sort_findings(out), coverage


def metrics(cfg: dict[str, Any], timing: dict[str, Any] | None, readiness: dict[str, Any] | None, residual: dict[str, Any] | None,
            coverage: float | None, derivation: dict[str, Any] | None) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    purity = None
    if derivation:
        counts = {r["source"]: int(r["count"]) for r in derivation.get("accessGrantingMemberships", [])}
        total = sum(counts.values())
        rule = counts.get("dynamicGroup", 0) + counts.get("autoAssignment", 0)
        purity = round(rule / total, 4) if total else None
    measured = {
        "separationToBlockHoursP90": (timing or {}).get("separationToBlockHours", {}).get("p90"),
        "separationToRevocationHoursP90": (timing or {}).get("separationToRevocationHours", {}).get("p90"),
        "transferToReviewHours": (residual or {}).get("hours"),
        "joinerReadinessRate": (readiness or {}).get("rate"),
        "correlationCoverage": coverage,
        "derivationPurity": purity,
    }
    rows, out = [], []
    for name, spec in cfg["metrics"].items():
        v = measured.get(name)
        if v is None:
            status = "not measured"
            why = ("the mover's residual review is still open; the interval isn't final"
                   if name == "transferToReviewHours" and residual else f"metric not measured this run ({spec['source']})")
            out.append(finding("LD-08", "Warn", name, name, why))
        else:
            ok = v <= spec["threshold"] if spec["direction"] == "max" else v >= spec["threshold"]
            status = "within" if ok else "out of bounds"
            if not ok:
                out.append(finding("LD-07", "Warn", name, name, f"{v} against the threshold {spec['direction']} {spec['threshold']}"))
        rows.append({"metric": name, "value": v, "threshold": spec["threshold"], "direction": spec["direction"], "status": status})
    return rows, sort_findings(out)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run", help="find the lifecycle drift classes, compute the metrics and write the run folder")
    r.add_argument("--hr", type=Path, required=True, help="the HR export: PersonNumber, AssignmentStatusType, TerminationDate")
    r.add_argument("--contractors", type=Path, required=True, help="decisions.json from contractor_source.py extract")
    r.add_argument("--users", type=Path, required=True, help="workforce-users.json from graph_export.py --task drift-read")
    r.add_argument("--exceptions", type=Path, required=True, help="the validation kit's exceptions.csv (an exception with no owner doesn't count)")
    r.add_argument("--cards", type=Path, required=True, help="the card system's status export: PersonKey, CardStatus")
    r.add_argument("--derivation", type=Path, help="access-granting memberships by source, for derivation purity")
    r.add_argument("--writers", type=Path, help="writer_register.py scan output folder (Chapter 01)")
    r.add_argument("--readiness", type=Path, help="joiner_workflows.py readiness output folder (Chapter 03)")
    r.add_argument("--residual", type=Path, help="access_assignment.py residual output folder (Chapter 04)")
    r.add_argument("--timing", type=Path, help="separation_timing.py output folder (Chapter 06)")
    r.add_argument("--config", type=Path, required=True)
    r.add_argument("--since", required=True)
    r.add_argument("--until", required=True)
    r.add_argument("--cloud", required=True)
    r.add_argument("--tenant-id", required=True)
    r.add_argument("--mode", choices=("fixture", "tenant"), required=True, help="fixture for a lab; tenant for exports read from a tenant")
    r.add_argument("--out", type=Path, required=True, help="the run folder to create")
    args = ap.parse_args(argv)
    try:
        cl = cloud(args.cloud)
        if args.out.exists():
            raise HrlcError(f"{args.out} already exists; a run is written once")
        inputs, docs = {}, {}
        for name, task in INPUT_TASKS.items():
            man, digest = chapter_output(getattr(args, name), task)
            if man is not None:
                inputs[name] = {"task": task, "manifestSha256": digest}
                folder = getattr(args, name)
                docs[name] = read_json(folder / ("findings.json" if name == "writers" else "summary.json"))
        ld, coverage = drift_classes(read_csv(args.hr), read_json(args.contractors), values(read_json(args.users)),
                                     read_csv(args.exceptions), read_csv(args.cards), docs.get("writers") or [])
        mrows, mfind = metrics(read_json(args.config), docs.get("timing"), docs.get("readiness"), docs.get("residual"), coverage,
                               read_json(args.derivation) if args.derivation else None)
        rows = sort_findings(ld + mfind)
        run_id = args.out.name
        meta = {"tool": "lifecycle_drift.py", "cloud": cl["name"], "mode": args.mode,
                "tenantId": args.tenant_id.lower(), "window": {"since": args.since, "until": args.until}, "requests": []}
        man = write_output(args.out / "lifecycle", "lifecycle", {"findings.json": rows, "metrics.json": mrows}, meta)
        index = {"schema": RUN_SCHEMA, "runId": run_id, "asOf": f"{args.until}T00:00:00Z" if len(args.until) == 10 else args.until,
                 "cloud": cl["name"], "mode": meta["mode"], "tenantId": meta["tenantId"], "readOnly": True,
                 "window": meta["window"], "inputs": inputs,
                 "tasks": {"lifecycle": {"folder": "lifecycle", "status": "OK", "manifestSha256": sha256_file(man)}}}
        write_text(args.out / "run.json", dump_json(index))
        print(f"Run {run_id}: {len(inputs)} chapter outputs read ({', '.join(sorted(inputs)) or 'none'})")
        for m in mrows:
            print(f"  {m['metric']:<32} {str(m['value']):>8}  {m['direction']} {m['threshold']}  {m['status']}")
        print(summary_line("Lifecycle drift", rows))
        print(f"Run written to {args.out.as_posix()}; package it with examples/drift-pipeline/python/hr_evidence.py")
        return exit_code(rows)
    except (HrlcError, OSError, KeyError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
