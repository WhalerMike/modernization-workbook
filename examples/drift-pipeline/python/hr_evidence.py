"""HR-driven identity evidence: package each lifecycle drift run for the ISSO with a SHA-256 per file, the
tenant ID and a hash chain, verify a package, and assemble a period's packages into the metric series
and control evidence for AC-2, AU-6, PS-4, PS-5 and CA-7, with the guide's Gate 7 criteria.

The developer workbook *Building HR-Driven Identity*, Chapter 07. A run is the folder
examples/hr-lifecycle/python/lifecycle_drift.py writes: run.json (with the SHA-256 of each chapter output
it read) and lifecycle/ (findings, the six metrics and a manifest). This file adds to drift_pipeline.py
and pa_evidence.py and changes neither: it reuses their hashing, JSON and time helpers, and the same rules (runs of different tenants are refused; a package is written once and
chained to the one before; a period with a gap or a broken chain isn't complete).

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python hr_evidence.py package --run <run> [--previous-manifest <file>] --out <dir> [--meta-from-env]
    python hr_evidence.py verify  <package>
    python hr_evidence.py period  --evidence <dir> --since <date> --until <date> --out <dir>

Exit codes: 0 packaged or verified (or a period with every criterion met), 2 a period with gaps, open
findings or metrics out of bounds, 1 error or refusal.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

from drift_pipeline import (  # noqa: E402
    EXIT_DRIFT, EXIT_ERROR, EXIT_OK, SUMS, DriftError, dump_json, metadata_from_env, read_json, sha256_file, write_text,
)
from pa_evidence import _iso  # noqa: E402

RUN_SCHEMA = "fmp-hr-run/1"
EVIDENCE_SCHEMA = "fmp-hr-evidence/1"
PERIOD_SCHEMA = "fmp-hr-period/1"
EVIDENCE_MANIFEST = "EVIDENCE-MANIFEST.json"
PERIOD_MANIFEST = "PERIOD-MANIFEST.json"
COUNTED = ("Finding", "Warn")

# The program's mapping of each control to the drift classes and metrics that give evidence for it (design
# guidance, from Book 03, Chapter 11's control support table). The assessor decides the control.
CONTROLS = [
    {"control": "AC-2", "title": "Account Management", "rules": ("LD-01", "LD-02", "LD-03"), "metrics": ("correlationCoverage", "joinerReadinessRate")},
    {"control": "AU-6", "title": "Audit Record Review, Analysis, and Reporting", "rules": ("LD-04",), "metrics": ()},
    {"control": "PS-4", "title": "Personnel Termination", "rules": ("LD-02", "LD-05", "LD-06"), "metrics": ("separationToBlockHoursP90", "separationToRevocationHoursP90")},
    {"control": "PS-5", "title": "Personnel Transfer", "rules": (), "metrics": ("transferToReviewHours",)},
    {"control": "CA-7", "title": "Continuous Monitoring", "rules": ("LD-07", "LD-08"), "metrics": ("separationToBlockHoursP90", "separationToRevocationHoursP90", "transferToReviewHours", "joinerReadinessRate", "correlationCoverage", "derivationPurity")},
]


def _utc(s: str) -> dt.datetime:
    """An ISO 8601 date or date-time in UTC; a bare date is midnight UTC (pa_evidence's _utc would read a
    naive value in the machine's own zone)."""
    t = dt.datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    return (t if t.tzinfo else t.replace(tzinfo=dt.timezone.utc)).astimezone(dt.timezone.utc)


def load_hr_run(run_dir: Path) -> dict[str, Any]:
    """Read one run and check it: run.json, the lifecycle manifest by its SHA-256, every file against the
    manifest, nothing extra, one tenant, cloud and mode, and a read-only run with no requests that write."""
    run_dir = Path(run_dir)
    ip = run_dir / "run.json"
    if not ip.is_file():
        raise DriftError(f"{run_dir}: no run.json; not an HR lifecycle run")
    idx = read_json(ip)
    if idx.get("schema") != RUN_SCHEMA:
        raise DriftError(f"{run_dir}: run.json isn't {RUN_SCHEMA}")
    if idx.get("readOnly") is not True:
        raise DriftError(f"{run_dir}: run.json doesn't say the run was read-only")
    tenant = str(idx.get("tenantId") or "").strip().lower()
    if not tenant:
        raise DriftError(f"{run_dir}: run.json records no tenant ID")
    entry = (idx.get("tasks") or {}).get("lifecycle") or {}
    if entry.get("status") != "OK" or entry.get("folder") != "lifecycle":
        raise DriftError(f"{run_dir}: the lifecycle task didn't end OK")
    tdir = run_dir / "lifecycle"
    mpath = tdir / "manifest.json"
    if sha256_file(mpath) != str(entry.get("manifestSha256", "")).lower():
        raise DriftError(f"{run_dir}: lifecycle/manifest.json doesn't match the SHA-256 in run.json")
    m = read_json(mpath)
    for key in ("cloud", "mode"):
        if str(m.get(key, "")).lower() != str(idx.get(key, "")).lower():
            raise DriftError(f"{run_dir}: lifecycle was read in {key} {m.get(key)!r}, run.json says {idx.get(key)!r}")
    if str(m.get("tenantId") or "").lower() != tenant:
        raise DriftError(f"{run_dir}: lifecycle records tenant {m.get('tenantId')!r}, run.json {idx.get('tenantId')!r}")
    listed = dict(m.get("files") or {})
    present = {p.relative_to(tdir).as_posix() for p in tdir.rglob("*") if p.is_file()} - {"manifest.json"}
    if present != set(listed):
        raise DriftError(f"{run_dir}: lifecycle files differ from its manifest (extra {sorted(present - set(listed))}, missing {sorted(set(listed) - present)})")
    for rel, digest in listed.items():
        if sha256_file(tdir / rel) != str(digest).lower():
            raise DriftError(f"{run_dir}: lifecycle/{rel} doesn't match the SHA-256 in its manifest")
    if any(str(r.get("method", "")).upper() != "GET" for r in m.get("requests") or []):
        raise DriftError(f"{run_dir}: the run records a request that isn't a GET")
    extra = {p.name for p in run_dir.iterdir()} - {"run.json", "lifecycle"}
    if extra:
        raise DriftError(f"{run_dir}: unexpected entries {sorted(extra)}")
    findings = read_json(tdir / "findings.json")
    return {"path": run_dir, "run_id": idx["runId"], "as_of": idx["asOf"], "cloud": idx["cloud"], "mode": idx["mode"],
            "tenant_id": tenant, "window": idx.get("window") or {}, "inputs": idx.get("inputs") or {},
            "findings": [f for f in findings if f.get("Severity") in COUNTED], "metrics": read_json(tdir / "metrics.json"),
            "run_json_sha256": sha256_file(ip)}


def _counts(findings: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    c: dict[str, dict[str, int]] = {}
    for f in findings:
        c.setdefault(f["Rule"], {"Finding": 0, "Warn": 0})[f["Severity"]] += 1
    return dict(sorted(c.items()))


def summary_markdown(m: dict[str, Any]) -> str:
    s = m["since_previous"]
    lines = ["# HR-driven identity lifecycle evidence", "",
             f"Run **{m['run_id']}** ({m['cloud']}, {m['mode']}, tenant {m['tenant_id']}); window {m['window'].get('since')} to {m['window'].get('until')}.", "",
             f"Open findings {len(m['open'])}. Since the previous package: new {len(s['new'])}, resolved {len(s['resolved'])}. "
             f"Chapter outputs read: {', '.join(sorted(m['inputs'])) or 'none'}.", "",
             "| Metric | Value | Threshold | Status |", "|---|---|---|---|"]
    lines += [f"| {x['metric']} | {x['value']} | {x['direction']} {x['threshold']} | {x['status']} |" for x in m["metrics"]]
    lines += ["", "| Rule | Severity | Object key | Fingerprint |", "|---|---|---|---|"]
    lines += [f"| {f['rule']} | {f['severity']} | {f['object_key']} | {f['fingerprint']} |" for f in m["open"]]
    lines += ["", "Names and issue text are in the run's findings file, under the evidence store's access control."]
    return "\n".join(lines) + "\n"


def package_hr(run_dir: Path, out_root: Path, previous_manifest: Path | None = None, metadata: dict[str, Any] | None = None) -> Path:
    """Write <out_root>/<run-id>/: the run as written (run/), summary.md, EVIDENCE-MANIFEST.json and SHA256SUMS."""
    run = load_hr_run(run_dir)
    dest = Path(out_root) / run["run_id"]
    if dest.exists():
        raise DriftError(f"{dest} already exists; an evidence package is written once")
    open_rows = sorted(({"fingerprint": f["Fingerprint"], "rule": f["Rule"], "severity": f["Severity"], "object_key": f["ObjectKey"]}
                        for f in run["findings"]), key=lambda f: (f["fingerprint"], f["rule"]))
    previous, since = None, {"new": [f["fingerprint"] for f in open_rows], "resolved": []}
    if previous_manifest is not None:
        prev = read_json(Path(previous_manifest))
        if prev.get("schema") != EVIDENCE_SCHEMA:
            raise DriftError(f"{previous_manifest}: not an HR lifecycle evidence manifest")
        if str(prev.get("tenant_id")) != run["tenant_id"] or str(prev.get("cloud")).lower() != run["cloud"].lower() or prev.get("mode") != run["mode"]:
            raise DriftError(f"the previous package is for tenant {prev.get('tenant_id')} ({prev.get('cloud')}, {prev.get('mode')}), this run for {run['tenant_id']} ({run['cloud']}, {run['mode']})")
        if not _utc(run["as_of"]) > _utc(prev["as_of"]):
            raise DriftError(f"this run ({run['as_of']}) isn't later than the previous package ({prev['as_of']})")
        before, after = {f["fingerprint"] for f in prev.get("open", [])}, {f["fingerprint"] for f in open_rows}
        since = {"new": sorted(after - before), "resolved": sorted(before - after)}
        previous = {"run_id": prev["run_id"], "evidence_manifest_sha256": sha256_file(Path(previous_manifest))}
    for p in sorted(Path(run_dir).rglob("*")):
        if p.is_file():
            target = dest / "run" / p.relative_to(run_dir)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(p, target)
    manifest = {"schema": EVIDENCE_SCHEMA, "run_id": run["run_id"], "as_of": run["as_of"], "cloud": run["cloud"], "tenant_id": run["tenant_id"],
                "mode": run["mode"], "read_only": True, "window": run["window"], "inputs": run["inputs"], "run_json_sha256": run["run_json_sha256"],
                "metadata": dict(sorted((metadata or {}).items())), "metrics": run["metrics"], "counts": _counts(run["findings"]),
                "open": open_rows, "since_previous": since, "previous": previous}
    write_text(dest / "summary.md", summary_markdown(manifest))
    listed = sorted(p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file())
    manifest["files"] = [{"path": rel, "bytes": (dest / rel).stat().st_size, "sha256": sha256_file(dest / rel)} for rel in listed]
    write_text(dest / EVIDENCE_MANIFEST, dump_json(manifest))
    write_text(dest / SUMS, "\n".join(f"{sha256_file(dest / rel)}  {rel}" for rel in listed + [EVIDENCE_MANIFEST]) + "\n")
    return dest


def verify_hr(package_dir: Path) -> dict[str, Any]:
    package_dir = Path(package_dir)
    mpath = package_dir / EVIDENCE_MANIFEST
    if not mpath.is_file():
        raise DriftError(f"{package_dir}: no {EVIDENCE_MANIFEST}")
    manifest = read_json(mpath)
    if manifest.get("schema") != EVIDENCE_SCHEMA:
        raise DriftError(f"{package_dir}: not an HR lifecycle evidence package")
    listed = {f["path"]: f for f in manifest["files"]}
    present = {p.relative_to(package_dir).as_posix() for p in package_dir.rglob("*") if p.is_file()} - {EVIDENCE_MANIFEST, SUMS}
    if present != set(listed):
        raise DriftError(f"{package_dir}: files differ from the manifest (extra {sorted(present - set(listed))}, missing {sorted(set(listed) - present)})")
    for rel, meta in listed.items():
        if sha256_file(package_dir / rel) != meta["sha256"]:
            raise DriftError(f"{package_dir}: {rel} doesn't match its SHA-256")
    sums = dict(reversed(line.split("  ", 1)) for line in (package_dir / SUMS).read_text(encoding="utf-8").splitlines())
    if set(sums) != set(listed) | {EVIDENCE_MANIFEST}:
        raise DriftError(f"{package_dir}: {SUMS} doesn't list the same files")
    for rel, digest in sums.items():
        if sha256_file(package_dir / rel) != digest:
            raise DriftError(f"{package_dir}: {rel} doesn't match {SUMS}")
    run = load_hr_run(package_dir / "run")
    if run["run_json_sha256"] != manifest["run_json_sha256"] or run["tenant_id"] != manifest["tenant_id"]:
        raise DriftError(f"{package_dir}: the run inside isn't the one the package recorded")
    return {"run_id": manifest["run_id"], "files": len(listed) + 1, "evidence_manifest_sha256": sha256_file(mpath)}


def period_hr(evidence_root: Path, since: str, until: str, out_root: Path) -> tuple[Path, dict[str, Any]]:
    """Verify every package whose window falls in [since, until], check the chain and the coverage, list the
    findings opened and closed, give each metric's series across the period, and map what is open at the end
    to the controls and the Gate 7 criteria."""
    t0, t1 = _utc(since), _utc(until)
    if t1 <= t0:
        raise DriftError("the period ends before it starts")
    pkgs = []
    for m in sorted(Path(evidence_root).glob(f"*/{EVIDENCE_MANIFEST}")):
        man = read_json(m)
        w = man.get("window") or {}
        if man.get("schema") != EVIDENCE_SCHEMA or not w.get("since") or _utc(w["until"]) <= t0 or _utc(w["since"]) >= t1:
            continue
        verify_hr(m.parent)
        pkgs.append({"manifest": man, "sha256": sha256_file(m)})
    if not pkgs:
        raise DriftError(f"no evidence package in {evidence_root} covers {since} to {until}")
    pkgs.sort(key=lambda p: _utc(p["manifest"]["as_of"]))
    for key in ("tenant_id", "cloud", "mode"):
        vals = {str(p["manifest"][key]).lower() for p in pkgs}
        if len(vals) != 1:
            raise DriftError(f"the packages differ in {key}: {sorted(vals)}")
    breaks, gaps, cursor = [], [], t0
    for a, b in zip(pkgs, pkgs[1:]):
        prev = b["manifest"].get("previous") or {}
        if prev.get("run_id") != a["manifest"]["run_id"] or prev.get("evidence_manifest_sha256") != a["sha256"]:
            breaks.append({"run_id": b["manifest"]["run_id"], "expected_previous": a["manifest"]["run_id"], "recorded_previous": prev.get("run_id")})
    for p in pkgs:
        w = p["manifest"]["window"]
        if _utc(w["since"]) > cursor:
            gaps.append({"since": _iso(cursor), "until": w["since"]})
        cursor = max(cursor, _utc(w["until"]))
    if cursor < t1:
        gaps.append({"since": _iso(cursor), "until": _iso(t1)})
    last = pkgs[-1]["manifest"]
    series: dict[str, list[dict[str, Any]]] = {}
    for p in pkgs:
        for x in p["manifest"]["metrics"]:
            series.setdefault(x["metric"], []).append({"run_id": p["manifest"]["run_id"], "value": x["value"], "status": x["status"]})
    out_of_bounds = sorted({k for k, v in series.items() if any(s["status"] == "out of bounds" for s in v)})
    not_measured = sorted({k for k, v in series.items() if any(s["status"] == "not measured" for s in v)})
    open_end = last["open"]

    def count(rules: tuple[str, ...]) -> int:
        return sum(1 for f in open_end if f["rule"] in rules and f["severity"] == "Finding")

    controls = [{"control": c["control"], "title": c["title"], "open_findings": count(c["rules"]),
                 "metrics_out_of_bounds": [m for m in c["metrics"] if m in out_of_bounds],
                 "metrics_not_measured": [m for m in c["metrics"] if m in not_measured],
                 "status": "evidence present; the assessor decides"} for c in CONTROLS]
    running = not gaps and not breaks
    gate7 = [
        {"criterion": "Lifecycle drift classes found and closed at the source", "from_this_code": f"{len(open_end)} open at the end; opened {len({fp for p in pkgs[1:] for fp in p['manifest']['since_previous']['new']})}, closed {len({fp for p in pkgs[1:] for fp in p['manifest']['since_previous']['resolved']})}",
         "status": "met" if count(("LD-01", "LD-02", "LD-03", "LD-04", "LD-05", "LD-06")) == 0 else "not met"},
        {"criterion": "Metrics on the ConMon cadence, within the agency's thresholds", "from_this_code": f"{len(pkgs)} package(s); out of bounds: {', '.join(out_of_bounds) or 'none'}; not measured: {', '.join(not_measured) or 'none'}",
         "status": "met" if running and not out_of_bounds and not not_measured else "not met"},
        {"criterion": "Evidence kept outside the directory, unbroken", "from_this_code": f"chain breaks {len(breaks)}, coverage gaps {len(gaps)}", "status": "met" if running else "not met"},
        {"criterion": "Sole source proved per population (seven days of provisioning logs against the audit log)", "from_this_code": "not decided by this code (Book 03, Appendix C)", "status": "not decided by this code"},
    ]
    complete = all(g["status"] == "met" for g in gate7[:3])
    pid = f"period-{t0.strftime('%Y-%m-%d')}_{t1.strftime('%Y-%m-%d')}"
    dest = Path(out_root) / pid
    if dest.exists():
        raise DriftError(f"{dest} already exists; a period is assembled once")
    manifest = {"schema": PERIOD_SCHEMA, "period": {"since": _iso(t0), "until": _iso(t1)}, "tenant_id": last["tenant_id"],
                "cloud": last["cloud"], "mode": last["mode"],
                "packages": [{"run_id": p["manifest"]["run_id"], "window": p["manifest"]["window"], "evidence_manifest_sha256": p["sha256"]} for p in pkgs],
                "chain_breaks": breaks, "coverage_gaps": gaps, "metric_series": series, "metrics_out_of_bounds": out_of_bounds, "metrics_not_measured": not_measured, "open_at_end": len(open_end),
                "controls": controls, "gate7": gate7, "complete": complete}
    dest.mkdir(parents=True)
    write_text(dest / PERIOD_MANIFEST, dump_json(manifest))
    lines = ["# HR-driven identity evidence for the period", "",
             f"Period {manifest['period']['since']} to {manifest['period']['until']}; tenant {manifest['tenant_id']} ({manifest['cloud']}, {manifest['mode']}); "
             f"{len(pkgs)} package(s), chain breaks {len(breaks)}, coverage gaps {len(gaps)}, open findings at the end {len(open_end)}.", "",
             "| Control | Open findings | Metrics out of bounds | Metrics not measured |", "|---|---|---|---|"]
    lines += [f"| {c['control']} {c['title']} | {c['open_findings']} | {', '.join(c['metrics_out_of_bounds']) or 'none'} | {', '.join(c['metrics_not_measured']) or 'none'} |" for c in controls]
    lines += ["", "| Gate 7 criterion | From this code | Status |", "|---|---|---|"]
    lines += [f"| {g['criterion']} | {g['from_this_code']} | {g['status']} |" for g in gate7]
    lines += ["", "Object keys and fingerprints only. The control mapping is the program's (design guidance); the assessor decides each control."]
    write_text(dest / "period-summary.md", "\n".join(lines) + "\n")
    write_text(dest / SUMS, "\n".join(f"{sha256_file(dest / n)}  {n}" for n in ("period-summary.md", PERIOD_MANIFEST)) + "\n")
    return dest, manifest


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("package", help="write the evidence package for one lifecycle run")
    p.add_argument("--run", type=Path, required=True)
    p.add_argument("--previous-manifest", type=Path)
    p.add_argument("--meta-from-env", action="store_true")
    p.add_argument("--out", type=Path, required=True)
    v = sub.add_parser("verify", help="verify an evidence package")
    v.add_argument("package", type=Path)
    q = sub.add_parser("period", help="assemble a period's packages for the ISSO")
    q.add_argument("--evidence", type=Path, required=True)
    q.add_argument("--since", required=True)
    q.add_argument("--until", required=True)
    q.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    try:
        if args.cmd == "package":
            meta = metadata_from_env(dict(os.environ)) if args.meta_from_env else {}
            dest = package_hr(args.run, args.out, args.previous_manifest, meta)
            m = read_json(dest / EVIDENCE_MANIFEST)
            print(json.dumps({"package": dest.name, "evidence_manifest_sha256": sha256_file(dest / EVIDENCE_MANIFEST), "open": len(m["open"]),
                              "new": len(m["since_previous"]["new"]), "resolved": len(m["since_previous"]["resolved"])}, sort_keys=True))
            return EXIT_OK
        if args.cmd == "verify":
            print(json.dumps(verify_hr(args.package), sort_keys=True))
            return EXIT_OK
        dest, m = period_hr(args.evidence, args.since, args.until, args.out)
        print(json.dumps({"period": dest.name, "complete": m["complete"], "packages": len(m["packages"]), "coverage_gaps": len(m["coverage_gaps"]),
                          "chain_breaks": len(m["chain_breaks"]), "open_at_end": m["open_at_end"]}, sort_keys=True))
        return EXIT_OK if m["complete"] else EXIT_DRIFT
    except (DriftError, OSError, ValueError, KeyError) as err:
        print(f"error: {err}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
