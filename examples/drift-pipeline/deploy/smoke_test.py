"""Smoke test after an Attribute-Driven Migration deployment stage: read what the kits wrote and say go or no-go.

Book 19, Chapter 10. It reads only files the kits already write, so it needs no tenant of its own:

  --kit-run          a validation kit run folder: checked against its own manifest, then the tenant, cloud and
                     mode it read must be the settings', the checks in smoke.required_pass must be Pass, and
                     no check may end in Error unless smoke.allowed_unverified lists it;
  --hcm-provenance   the HR middleware's provenance.json: not held, quarantine within hcm_entra.max_quarantined;
  --dynamic-rules    the rule library's check-results.json: no Finding;
  --mc-provenance    machine configuration's provenance.json: no Finding, the mode the stage expects;
  --deploy-record    the runbook's deploy-record.json: every change has a rollback, for this stage and record.

It writes smoke-report.json (each check, each input's SHA-256, the result), which production's pre-flight
reads as the go/no-go record. --fixture accepts the kits' fixture runs (fixture mode and the fixture tenant),
so the test can be run on a laptop; a fixture report can never promote to production.

Illustrative: unit-tested against fixtures, not run against a live tenant. Standard library only.

    python deploy/smoke_test.py --settings <file> --kit-run <dir> [--hcm-provenance <file>]
        [--dynamic-rules <file>] [--mc-provenance <file> --mc-mode Audit] [--deploy-record <file>]
        --out <dir> [--fixture]

Exit codes: 0 pass, 2 a check failed (no-go), 1 error.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

import adm_deploy as ad  # noqa: E402
import evidence as ev  # noqa: E402
import rollback as rb  # noqa: E402

EXIT_OK, EXIT_ERROR, EXIT_NOGO = 0, 1, 2
SCHEMA = "adm-smoke-report/1"


def _row(rows: list[dict[str, Any]], ok: bool, check: str, message: str) -> None:
    rows.append({"result": "PASS" if ok else "FAIL", "check": check, "message": message})


def smoke_kit_run(s: dict[str, Any], run_dir: Path, fixture: bool, rows: list[dict[str, Any]]) -> None:
    try:
        run = ad.dp.load_run(run_dir)
    except ad.dp.DriftError as exc:
        _row(rows, False, "SM-01", str(exc))
        return
    _row(rows, True, "SM-01", f"kit run {run['run_id']} matches its own manifest (read-only)")
    if fixture:
        _row(rows, run["mode"] == "Fixture", "SM-02", f"fixture mode: run mode {run['mode']}, tenant not compared")
    else:
        _row(rows, run["mode"] != "Fixture", "SM-02", f"run mode {run['mode']} (a fixture run proves nothing here)")
        tid = (run["tenant_id"] or "").lower()
        _row(rows, tid == s["tenant_id"].lower(), "SM-03", f"run read tenant {run['tenant_id']}; settings {s['tenant_id']}")
    _row(rows, run["cloud"] == ad.VK_CLOUD[s["cloud"]], "SM-04", f"run cloud {run['cloud']}; settings {s['cloud']}")
    required = list(ad.get(s, "smoke.required_pass") or [])
    allowed = set(ad.get(s, "smoke.allowed_unverified") or [])
    for cid in required:
        c = run["checks"].get(cid)
        status = c["Status"] if c else "not run"
        count = c.get("Count", 0) if c else 0
        _row(rows, status == "Pass", "SM-05", f"{cid} {status}" + (f" ({count} finding(s))" if count else ""))
    errors = [cid for cid, c in run["checks"].items() if c["Status"] == "Error" and cid not in allowed]
    _row(rows, not errors, "SM-06", f"checks that ended in Error: {', '.join(errors)}" if errors
         else f"no unexpected Error (allowed unverified: {', '.join(sorted(allowed)) or 'none'})")


def smoke_hcm(s: dict[str, Any], path: Path, rows: list[dict[str, Any]]) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema") != "fmp-hcm-provenance/1":
        _row(rows, False, "SM-07", f"{path.name} isn't an hcm-entra provenance manifest")
        return
    counts = data.get("counts", {})
    limit = int(ad.get(s, "hcm_entra.max_quarantined", 0))
    _row(rows, not data.get("held"), "SM-07", "run not held by the mass-disable guard" if not data.get("held")
         else "run held by the mass-disable guard: release only with --confirm-large-delta after review")
    q = int(counts.get("quarantined", 0))
    _row(rows, q <= limit, "SM-08", f"{counts.get('ready', 0)} ready, {q} quarantined (limit {limit})")


def smoke_dynamic(path: Path, rows: list[dict[str, Any]]) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    findings = [f for f in data.get("findings", []) if f.get("Severity") == "Finding"]
    _row(rows, not findings, "SM-09", f"rule library: {data.get('rules')} rules, {len(findings)} finding(s)")


def smoke_mc(path: Path, mode: str | None, rows: list[dict[str, Any]]) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    finding = int((data.get("findings") or {}).get("Finding", 0))
    _row(rows, data.get("schema") == "fmp-mc-provenance/1" and finding == 0, "SM-10",
         f"machine configuration {data.get('configuration')} {data.get('version')}: {finding} finding(s)")
    if mode:
        _row(rows, data.get("mode") == mode, "SM-11", f"package mode {data.get('mode')}; this stage expects {mode}")


def smoke_record(s: dict[str, Any], path: Path, rows: list[dict[str, Any]]) -> None:
    record = rb.load_record(path)
    wrong = [e for e in record["entries"] if e["environment"] != s["environment"] or e["change_record"] != s["change_record"]]
    _row(rows, not wrong, "SM-12", f"{len(record['entries'])} change(s) recorded for {s['environment']}/{s['change_record']}"
         if not wrong else f"{len(wrong)} entr(ies) belong to another stage or change record")
    unknown = [e["kind"] for e in record["entries"] if e["kind"] not in rb.KINDS]
    _row(rows, not unknown, "SM-13", "every change has a rollback" if not unknown else f"no rollback for: {', '.join(unknown)}")


def smoke(settings_path: Path, kit_run: Path | None = None, hcm: Path | None = None, dyn: Path | None = None,
          mc: Path | None = None, mc_mode: str | None = None, record: Path | None = None,
          fixture: bool = False) -> dict[str, Any]:
    s = ad.load_settings(settings_path)
    rows: list[dict[str, Any]] = []
    inputs = {}
    if kit_run:
        smoke_kit_run(s, kit_run, fixture, rows)
        manifest = Path(kit_run) / ad.dp.KIT_MANIFEST
        if manifest.is_file():
            inputs["kit_run_manifest"] = ad.sha256_file(manifest)
    for key, path, fn in (("hcm_provenance", hcm, lambda p: smoke_hcm(s, p, rows)),
                          ("dynamic_rules", dyn, lambda p: smoke_dynamic(p, rows)),
                          ("mc_provenance", mc, lambda p: smoke_mc(p, mc_mode, rows)),
                          ("deploy_record", record, lambda p: smoke_record(s, p, rows))):
        if path:
            fn(Path(path))
            inputs[key] = ad.sha256_file(path)
    if not rows:
        raise ad.SettingsError("give at least one input to check")
    failed = [r for r in rows if r["result"] == "FAIL"]
    return {"schema": SCHEMA, "environment": s["environment"], "change_record": s["change_record"],
            "cloud": s["cloud"], "tenant_id": s["tenant_id"], "fixture": fixture,
            "checked_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "inputs": inputs, "rows": rows, "failed": len(failed), "result": "fail" if failed else "pass"}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--settings", required=True, type=Path)
    ap.add_argument("--kit-run", type=Path)
    ap.add_argument("--hcm-provenance", type=Path)
    ap.add_argument("--dynamic-rules", type=Path)
    ap.add_argument("--mc-provenance", type=Path)
    ap.add_argument("--mc-mode", choices=("Audit", "ApplyAndMonitor", "ApplyAndAutoCorrect"))
    ap.add_argument("--deploy-record", type=Path)
    ap.add_argument("--fixture", action="store_true", help="accept the kits' fixture runs; the report can't promote")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--step", default="smoke", help="the runbook step this smoke test evidences (default smoke)")
    args = ap.parse_args(argv)
    try:
        rep = smoke(args.settings, args.kit_run, args.hcm_provenance, args.dynamic_rules, args.mc_provenance,
                    args.mc_mode, args.deploy_record, args.fixture)
    except (ad.SettingsError, rb.RecordError, OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return EXIT_ERROR
    for r in rep["rows"]:
        print(f"{r['result']:<4} {r['check']}  {r['message']}")
    args.out.mkdir(parents=True, exist_ok=True)
    out = args.out / "smoke-report.json"
    out.write_text(json.dumps(rep, indent=2) + "\n", encoding="utf-8", newline="\n")
    try:
        rec = ev.add(ad.load_settings(args.settings), args.settings, args.step, "smoke_test.py " + " ".join(argv or sys.argv[1:]),
                     rep["result"], [out], {"fixture": rep["fixture"], "failed": rep["failed"]})
        print(f"evidence {rec.name}: {args.step} {rep['result']}, controls {', '.join(json.loads(rec.read_text(encoding='utf-8'))['controls'])}")
    except ev.EvidenceError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return EXIT_ERROR
    verdict = "GO" if rep["result"] == "pass" else "NO-GO"
    print(f"smoke test: {verdict} ({rep['failed']} failed) for {rep['environment']}/{rep['change_record']}"
          f"{', fixture mode' if rep['fixture'] else ''}; report sha256 {ad.sha256_file(out)}")
    return EXIT_OK if rep["result"] == "pass" else EXIT_NOGO


if __name__ == "__main__":
    sys.exit(main())
