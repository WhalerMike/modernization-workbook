"""Non-person identity evidence: package each drift run for the ISSO with a SHA-256 per file, the tenant
ID and a hash chain, verify a package, and assemble a period's packages into the control evidence for
AC-2, AC-6(5), IA-4, IA-5 and IA-9 and for M-25-21, with the plan's Gate 7 criteria.

Chapter 10 of the developer workbook *Building Non-Person Identity*. A drift run is the folder
examples/non-person-identity/Invoke-NpiDriftRun.ps1 writes: run.json, and one folder per task
(inventory, ownership, drift), each with the manifest.json the PowerShell code wrote. The register's
comparison with the approved baseline happens in that run; this file compares packages by finding
fingerprint, so a period shows what opened and what closed. It adds to drift_pipeline.py and
pa_evidence.py and changes neither: it reuses their hashing, JSON, fingerprint, refusal, row-reading
and time helpers, and the same rules (a failed read proves nothing; runs of different tenants are
refused; a package is written once and chained to the one before).

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python npi_evidence.py package --run <run> [--previous-manifest <file>] --out <dir> [--meta-from-env]
    python npi_evidence.py verify  <package>
    python npi_evidence.py period  --evidence <dir> --since <date> --until <date> --out <dir> [--vintage <dir>]

Exit codes: 0 packaged or verified (or a period with every check met), 2 a period with gaps or open
Gate 7 criteria, 1 error or refusal.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

from drift_pipeline import (  # noqa: E402
    EXIT_DRIFT, EXIT_ERROR, EXIT_OK, SUMS, DriftError, dump_json, fingerprint, metadata_from_env,
    read_json, sha256_file, write_text,
)
from pa_evidence import _iso, _utc, read_rows  # noqa: E402

RUN_SCHEMA = "fmp-npi-run/1"
EVIDENCE_SCHEMA = "fmp-npi-evidence/1"
PERIOD_SCHEMA = "fmp-npi-period/1"
EVIDENCE_MANIFEST = "EVIDENCE-MANIFEST.json"
PERIOD_MANIFEST = "PERIOD-MANIFEST.json"
TASKS = {"inventory": "inventory", "ownership": "ownership", "drift": "drift"}
READ_METHODS = ("GET", "READ")       # Graph and Resource Manager GETs; Active Directory Get-AD* reads
COUNTED = ("Finding", "Warn")
CONTRACT_CHAPTERS = ("03", "04", "05", "06", "07", "08", "09")

# The program's mapping of each control to the rules and chapters that give evidence for it (design
# guidance, from the companion guide's federal requirements section). The assessor decides the control.
CONTROLS = [
    {"control": "AC-2", "title": "Account Management",
     "rules": ("NPI-INV-02", "NPI-INV-03", "NPI-OWN-01", "NPI-OWN-02", "NPI-OWN-08", "NPI-DRF-01", "NPI-DRF-02", "NPI-DRF-03", "NPI-DRF-04", "NPI-REV-02"),
     "chapters": ("03",)},
    {"control": "AC-6(5)", "title": "Least Privilege, Privileged Accounts",
     "rules": ("NPI-INV-01", "NPI-INV-06", "NPI-DRF-08", "NPI-REV-01"), "chapters": ("07",)},
    {"control": "IA-4", "title": "Identifier Management",
     "rules": ("NPI-OWN-06", "NPI-OWN-07", "NPI-INV-09", "NPI-DRF-01", "NPI-VIN-01", "NPI-VIN-05"), "chapters": ()},
    {"control": "IA-5", "title": "Authenticator Management",
     "rules": ("NPI-INV-04", "NPI-INV-05", "NPI-DRF-05", "NPI-DRF-06", "NPI-DRF-07"), "chapters": ("04", "06")},
    {"control": "IA-9", "title": "Service Identification and Authentication",
     "rules": ("NPI-DRF-07",), "chapters": ("05", "08")},
    {"control": "M-25-21", "title": "AI use-case inventory and governance (OMB)",
     "rules": ("NPI-REV-02", "NPI-REV-03", "NPI-VIN-01", "NPI-VIN-02", "NPI-VIN-03", "NPI-VIN-04", "NPI-VIN-05"), "chapters": ("09",)},
]


# ---------------------------------------------------------------- a drift run

def _task_findings(rows: list[dict[str, Any]], task: str) -> list[dict[str, Any]]:
    """Findings in one shape, each with its fingerprint. Chapters 01 and 02 write no fingerprint, so it
    is computed here the way Chapter 10 computes it: fingerprint(rule, objectKey, "")."""
    out = []
    for r in rows:
        rule, key = str(r.get("Rule", "")), str(r.get("ObjectKey", ""))
        fp = fingerprint(rule, key, "")
        if r.get("Fingerprint") and r["Fingerprint"] != fp:
            raise DriftError(f"{task}: finding {r.get('Id')} has fingerprint {r['Fingerprint']}, not {fp}")
        out.append({"task": task, "chapter": str(r.get("Chapter") or {"inventory": "01", "ownership": "02"}.get(task, "10")),
                    "rule": rule, "severity": str(r.get("Severity", "")), "object_key": key, "object": str(r.get("Object", "")),
                    "issue": str(r.get("Issue", "")), "fingerprint": fp})
    return out


def load_npi_run(run_dir: Path) -> dict[str, Any]:
    """Read one drift run and check it: run.json, each task's manifest by its SHA-256, every file
    against its manifest, nothing extra, every request a read, one tenant, cloud and mode throughout,
    and every finding's fingerprint. A task that ended in Error must have no folder."""
    run_dir = Path(run_dir)
    index_path = run_dir / "run.json"
    if not index_path.is_file():
        raise DriftError(f"{run_dir}: no run.json; not a non-person identity drift run")
    index = read_json(index_path)
    if index.get("schema") != RUN_SCHEMA:
        raise DriftError(f"{run_dir}: run.json isn't {RUN_SCHEMA}")
    if index.get("readOnly") is not True:
        raise DriftError(f"{run_dir}: run.json doesn't say the run was read-only")
    tenant = str(index.get("tenantId") or "").strip().lower()
    if not tenant:
        raise DriftError(f"{run_dir}: run.json records no tenant ID")
    allowed, status, messages, data = {"run.json"}, {}, {}, {}
    for task, folder in TASKS.items():
        entry = (index.get("tasks") or {}).get(task)
        if entry is None:
            status[task] = "not run"
            continue
        if entry.get("folder") != folder:
            raise DriftError(f"{run_dir}: task {task} names folder {entry.get('folder')!r}, expected {folder!r}")
        status[task] = entry.get("status", "")
        tdir = run_dir / folder
        if status[task] != "OK":
            messages[task] = str(entry.get("message", ""))
            if tdir.exists():
                raise DriftError(f"{run_dir}: task {task} ended {status[task]} but left a folder")
            continue
        allowed.add(folder)
        mpath = tdir / "manifest.json"
        if not mpath.is_file():
            raise DriftError(f"{run_dir}: {folder}/manifest.json is missing")
        if sha256_file(mpath) != str(entry.get("manifestSha256", "")).lower():
            raise DriftError(f"{run_dir}: {folder}/manifest.json doesn't match the SHA-256 in run.json")
        m = read_json(mpath)
        if m.get("task") != task:
            raise DriftError(f"{run_dir}: {folder}/manifest.json is for task {m.get('task')!r}")
        for key, want in (("cloud", index.get("cloud")), ("mode", index.get("mode"))):
            if str(m.get(key, "")).lower() != str(want or "").lower():
                raise DriftError(f"{run_dir}: {folder} was read in {key} {m.get(key)!r}, run.json says {want!r}")
        if str(m.get("tenantId") or "").strip().lower() != tenant:
            raise DriftError(f"{run_dir}: {folder} records tenant {m.get('tenantId')!r}, run.json records {index.get('tenantId')!r}")
        listed = dict(m.get("files") or {})
        present = {p.relative_to(tdir).as_posix() for p in tdir.rglob("*") if p.is_file()} - {"manifest.json"}
        if present != set(listed):
            raise DriftError(f"{run_dir}: {folder} files differ from its manifest (extra {sorted(present - set(listed))}, missing {sorted(set(listed) - present)})")
        for rel, digest in listed.items():
            if sha256_file(tdir / rel) != str(digest).lower():
                raise DriftError(f"{run_dir}: {folder}/{rel} doesn't match the SHA-256 in its manifest")
        bad = [r for r in read_rows_value(m.get("requests")) if str(r.get("method", "")).upper() not in READ_METHODS]
        if bad:
            raise DriftError(f"{run_dir}: {folder} records a {bad[0].get('method')} request; the drift run only reads")
        data[task] = {"manifest": m, "findings": _task_findings(read_rows(tdir / "findings.json"), task)}
        if task == "drift":
            data[task]["chapter_findings"] = _task_findings(read_rows(tdir / "chapter-findings.json"), "contract")
            data[task]["summary"] = read_json(tdir / "summary.json")
            data[task]["review_cycle"] = read_rows(tdir / "review-cycle.json")
    extra = {p.name for p in run_dir.iterdir()} - allowed
    if extra:
        raise DriftError(f"{run_dir}: unexpected entries {sorted(extra)}")
    window = index.get("auditWindow") or {}
    return {
        "path": run_dir, "run_id": index["runId"], "as_of": index["asOf"], "cloud": index["cloud"], "mode": index["mode"],
        "tenant_id": tenant, "window": {"since": window.get("since"), "until": window.get("until")},
        "baseline": index.get("baseline"), "status": status, "messages": messages, "tasks": data,
        "run_json_sha256": sha256_file(index_path),
    }


def read_rows_value(value: Any) -> list[dict[str, Any]]:
    """A JSON value PowerShell wrote as a list: a one-item array comes back as an object."""
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def open_findings(run: dict[str, Any]) -> list[dict[str, Any]]:
    """Every counted finding in the run, from every chapter, sorted by fingerprint."""
    out = []
    for task in TASKS:
        if task in run["tasks"]:
            out += [f for f in run["tasks"][task]["findings"] if f["severity"] in COUNTED]
    if "drift" in run["tasks"]:
        out += [f for f in run["tasks"]["drift"]["chapter_findings"] if f["severity"] in COUNTED]
    return sorted(out, key=lambda f: (f["fingerprint"], f["task"]))


# ---------------------------------------------------------------- the evidence package

def _counts(findings: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    c: dict[str, dict[str, int]] = {}
    for f in findings:
        c.setdefault(f["rule"], {"Finding": 0, "Warn": 0})[f["severity"]] += 1
    return dict(sorted(c.items()))


def summary_markdown(m: dict[str, Any]) -> str:
    """The package in one page, with rule IDs, object keys and fingerprints, never names."""
    s = m["since_previous"]
    lines = [
        "# Non-person identity drift evidence", "",
        f"Run **{m['run_id']}** ({m['cloud']}, {m['mode']}, tenant {m['tenant_id']}); audit window {m['audit_window']['since']} to "
        f"{m['audit_window']['until']}; approved baseline {(m['baseline'] or {}).get('runId') or 'none'}.", "",
        f"Open findings {len(m['open'])}. Since the previous package: new {len(s['new'])}, resolved {len(s['resolved'])}. "
        f"Chapters 03 to 09 received: {', '.join(m['chapters_received']) or 'none'}.", "",
        "| Task | Status |", "|---|---|",
    ] + [f"| {t} | {v} |" for t, v in m["tasks"].items()]
    lines += ["", "| Rule | Severity | Object key | Fingerprint |", "|---|---|---|---|"]
    lines += [f"| {f['rule']} | {f['severity']} | {f['object_key']} | {f['fingerprint']} |" for f in m["open"]]
    lines += ["", "Names and issue text are in the run's findings files, under the evidence store's access control."]
    return "\n".join(lines) + "\n"


def package_npi(run_dir: Path, out_root: Path, previous_manifest: Path | None = None, metadata: dict[str, Any] | None = None) -> Path:
    """Write <out_root>/<run-id>/: the run as written (run/), summary.md, EVIDENCE-MANIFEST.json (tenant,
    window, baseline, task status, the open findings by fingerprint, what opened and closed since the
    previous package, its manifest hash, a SHA-256 per file) and SHA256SUMS. The same inputs give the
    same bytes."""
    run = load_npi_run(run_dir)
    dest = Path(out_root) / run["run_id"]
    if dest.exists():
        raise DriftError(f"{dest} already exists; an evidence package is written once")
    now = open_findings(run)
    open_rows = [{k: f[k] for k in ("fingerprint", "rule", "severity", "chapter", "task", "object_key")} for f in now]
    previous, since = None, {"new": [f["fingerprint"] for f in open_rows], "resolved": []}
    if previous_manifest is not None:
        prev = read_json(Path(previous_manifest))
        if prev.get("schema") != EVIDENCE_SCHEMA:
            raise DriftError(f"{previous_manifest}: not a non-person identity evidence manifest")
        if str(prev.get("tenant_id")) != run["tenant_id"] or str(prev.get("cloud")).lower() != str(run["cloud"]).lower() or prev.get("mode") != run["mode"]:
            raise DriftError(f"the previous package is for tenant {prev.get('tenant_id')} ({prev.get('cloud')}, {prev.get('mode')}), this run for {run['tenant_id']} ({run['cloud']}, {run['mode']})")
        if not _utc(run["as_of"]) > _utc(prev["as_of"]):
            raise DriftError(f"this run ({run['as_of']}) isn't later than the previous package ({prev['as_of']})")
        before = {f["fingerprint"] for f in prev.get("open", [])}
        after = {f["fingerprint"] for f in open_rows}
        since = {"new": sorted(after - before), "resolved": sorted(before - after)}
        previous = {"run_id": prev["run_id"], "evidence_manifest_sha256": sha256_file(Path(previous_manifest))}
    for p in sorted(Path(run_dir).rglob("*")):
        if p.is_file():
            target = dest / "run" / p.relative_to(run_dir)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(p, target)
    drift = run["tasks"].get("drift", {})
    manifest = {
        "schema": EVIDENCE_SCHEMA, "run_id": run["run_id"], "as_of": run["as_of"], "cloud": run["cloud"], "tenant_id": run["tenant_id"],
        "mode": run["mode"], "read_only": True, "audit_window": run["window"], "baseline": run["baseline"], "tasks": run["status"],
        "run_json_sha256": run["run_json_sha256"], "metadata": dict(sorted((metadata or {}).items())),
        "chapters_received": sorted({f["chapter"] for f in drift.get("chapter_findings", [])}),
        "review_kinds_received": sorted((drift.get("summary") or {}).get("reviewKindsReceived") or []),
        "counts": _counts(now), "open": open_rows, "since_previous": since, "previous": previous,
    }
    write_text(dest / "summary.md", summary_markdown(manifest))
    listed = sorted(p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file())
    manifest["files"] = [{"path": rel, "bytes": (dest / rel).stat().st_size, "sha256": sha256_file(dest / rel)} for rel in listed]
    write_text(dest / EVIDENCE_MANIFEST, dump_json(manifest))
    write_text(dest / SUMS, "\n".join(f"{sha256_file(dest / rel)}  {rel}" for rel in listed + [EVIDENCE_MANIFEST]) + "\n")
    return dest


def verify_npi(package_dir: Path) -> dict[str, Any]:
    """Check a package as the ISSO would: every file against the manifest and SHA256SUMS, nothing
    extra, and the run inside against its own run.json and task manifests."""
    package_dir = Path(package_dir)
    mpath = package_dir / EVIDENCE_MANIFEST
    if not mpath.is_file():
        raise DriftError(f"{package_dir}: no {EVIDENCE_MANIFEST}")
    manifest = read_json(mpath)
    if manifest.get("schema") != EVIDENCE_SCHEMA:
        raise DriftError(f"{package_dir}: not a non-person identity evidence package")
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
    run = load_npi_run(package_dir / "run")
    if run["run_json_sha256"] != manifest["run_json_sha256"] or run["tenant_id"] != manifest["tenant_id"]:
        raise DriftError(f"{package_dir}: the run inside isn't the one the package recorded")
    return {"run_id": manifest["run_id"], "files": len(listed) + 1, "evidence_manifest_sha256": sha256_file(mpath)}


# ---------------------------------------------------------------- the annual vintage comparison

def load_vintage(vintage_dir: Path, tenant_id: str) -> dict[str, Any]:
    """The vintage comparison Invoke-NpiVintage.ps1 wrote, checked against its manifest and the tenant."""
    vintage_dir = Path(vintage_dir)
    m = read_json(vintage_dir / "manifest.json")
    if m.get("task") != "vintage":
        raise DriftError(f"{vintage_dir}: not a vintage comparison")
    if str(m.get("tenantId") or "").lower() != tenant_id:
        raise DriftError(f"{vintage_dir}: the vintage comparison is for tenant {m.get('tenantId')}, the packages for {tenant_id}")
    present = {p.name for p in vintage_dir.iterdir() if p.is_file()} - {"manifest.json"}
    if present != set(m.get("files") or {}):
        raise DriftError(f"{vintage_dir}: files differ from its manifest")
    for rel, digest in (m.get("files") or {}).items():
        if sha256_file(vintage_dir / rel) != str(digest).lower():
            raise DriftError(f"{vintage_dir}: {rel} doesn't match the SHA-256 in its manifest")
    findings = [f for f in _task_findings(read_rows(vintage_dir / "findings.json"), "vintage") if f["severity"] in COUNTED]
    return {"vintage": str(m.get("vintage")), "manifest_sha256": sha256_file(vintage_dir / "manifest.json"), "findings": findings}


# ---------------------------------------------------------------- a period, for the ISSO

def period_npi(evidence_root: Path, since: str, until: str, out_root: Path, vintage_dir: Path | None = None) -> tuple[Path, dict[str, Any]]:
    """Assemble a period's evidence (the plan's N7.4 and Gate 7): verify every package whose audit
    window falls in [since, until], check the hash chain between them and that their windows cover the
    period with no gap, list what opened and closed by fingerprint, and map the findings open at the
    end to AC-2, AC-6(5), IA-4, IA-5, IA-9 and M-25-21 and to the Gate 7 criteria. The packages stay
    where they are, cited by their manifest hashes."""
    t0, t1 = _utc(since), _utc(until)
    if t1 <= t0:
        raise DriftError("the period ends before it starts")
    pkgs = []
    for m in sorted(Path(evidence_root).glob(f"*/{EVIDENCE_MANIFEST}")):
        man = read_json(m)
        if man.get("schema") != EVIDENCE_SCHEMA:
            continue
        w = man.get("audit_window") or {}
        if not w.get("since") or _utc(w["until"]) <= t0 or _utc(w["since"]) >= t1:
            continue
        verify_npi(m.parent)
        pkgs.append({"dir": m.parent, "manifest": man, "sha256": sha256_file(m)})
    if not pkgs:
        raise DriftError(f"no evidence package in {evidence_root} covers {since} to {until}")
    pkgs.sort(key=lambda p: _utc(p["manifest"]["as_of"]))
    for key in ("tenant_id", "cloud", "mode"):
        values = {str(p["manifest"][key]).lower() for p in pkgs}
        if len(values) != 1:
            raise DriftError(f"the packages differ in {key}: {sorted(values)}")
    breaks, gaps, unverified = [], [], []
    for a, b in zip(pkgs, pkgs[1:]):
        prev = b["manifest"].get("previous") or {}
        if prev.get("run_id") != a["manifest"]["run_id"] or prev.get("evidence_manifest_sha256") != a["sha256"]:
            breaks.append({"run_id": b["manifest"]["run_id"], "expected_previous": a["manifest"]["run_id"], "recorded_previous": prev.get("run_id")})
    cursor = t0
    for p in pkgs:
        w = p["manifest"]["audit_window"]
        if _utc(w["since"]) > cursor:
            gaps.append({"since": _iso(cursor), "until": w["since"]})
        cursor = max(cursor, _utc(w["until"]))
        unverified += [{"run_id": p["manifest"]["run_id"], "task": t, "status": s} for t, s in p["manifest"]["tasks"].items() if s != "OK"]
    if cursor < t1:
        gaps.append({"since": _iso(cursor), "until": _iso(t1)})

    first, last = pkgs[0]["manifest"], pkgs[-1]["manifest"]
    opened = sorted({fp for p in pkgs[1:] for fp in p["manifest"]["since_previous"]["new"]})
    closed = sorted({fp for p in pkgs[1:] for fp in p["manifest"]["since_previous"]["resolved"]})
    open_end = list(last["open"])
    vintage = load_vintage(vintage_dir, str(last["tenant_id"])) if vintage_dir else None
    if vintage:
        open_end += [{k: f[k] for k in ("fingerprint", "rule", "severity", "chapter", "task", "object_key")} for f in vintage["findings"]]
    chapters = set(last.get("chapters_received") or [])

    def count(rules: tuple[str, ...] = (), chapter_list: tuple[str, ...] = (), severity: str = "Finding") -> int:
        return sum(1 for f in open_end if f["severity"] == severity and (f["rule"] in rules or (f["task"] == "contract" and f["chapter"] in chapter_list)))

    controls = []
    for c in CONTROLS:
        missing = [ch for ch in c["chapters"] if ch not in chapters]
        if c["control"] == "M-25-21" and not vintage:
            missing.append("the annual vintage comparison")
        controls.append({"control": c["control"], "title": c["title"], "rules": list(c["rules"]), "chapters": list(c["chapters"]),
                         "open_findings": count(c["rules"], c["chapters"]), "open_warnings": count(c["rules"], c["chapters"], "Warn"),
                         "missing_sources": missing,
                         "status": "evidence present; the assessor decides" if not missing else "evidence incomplete: " + ", ".join(f"Chapter {m}" if len(m) == 2 else m for m in missing)})
    running = not gaps and not breaks and not unverified
    review_ok = count(("NPI-REV-04",), (), "Warn") == 0 and count(("NPI-REV-01", "NPI-REV-02", "NPI-REV-03")) == 0
    orphans, pne = count(("NPI-DRF-03",)), count(("NPI-DRF-06",))
    ch06 = sum(1 for f in open_end if f["task"] == "contract" and f["chapter"] == "06" and f["severity"] == "Finding")
    gate7 = [
        {"criterion": "Every service account and service principal has an owner and sponsor, a reason and a target",
         "from_this_code": f"ownerless {orphans} (NPI-DRF-03); agents without a sponsor attestation {count(('NPI-REV-02',))}; Chapter 03 decisions {'received' if '03' in chapters else 'not received'}",
         "status": "not decided by this code (Chapter 03)" if "03" not in chapters else ("met" if orphans == 0 and count(("NPI-REV-02",)) == 0 else "not met")},
        {"criterion": "None holds a password that never expires", "from_this_code": f"{pne} enabled AD account(s) (NPI-DRF-06)", "status": "met" if pne == 0 else "not met"},
        {"criterion": "None is orphaned", "from_this_code": f"{orphans} orphan candidate(s) (NPI-DRF-03)", "status": "met" if orphans == 0 else "not met"},
        {"criterion": "Drift checks and review cycles running",
         "from_this_code": f"{len(pkgs)} package(s), coverage gaps {len(gaps)}, chain breaks {len(breaks)}, unverified task runs {len(unverified)}; review records missing {count(('NPI-REV-04',), (), 'Warn')}, review findings {count(('NPI-REV-01', 'NPI-REV-02', 'NPI-REV-03'))}",
         "status": "met" if running and review_ok else "not met"},
        {"criterion": "Every remaining gMSA and dMSA moved or in the dated Kerberos island",
         "from_this_code": f"Chapter 06 findings {'received, ' + str(ch06) + ' open' if '06' in chapters else 'not received'}",
         "status": ("met" if ch06 == 0 else "not met") if "06" in chapters else "not decided by this code (Chapter 06)"},
    ]
    complete = running and all(g["status"] == "met" for g in gate7)
    pid = f"period-{t0.strftime('%Y-%m-%d')}_{t1.strftime('%Y-%m-%d')}"
    dest = Path(out_root) / pid
    if dest.exists():
        raise DriftError(f"{dest} already exists; a period is assembled once")
    manifest = {
        "schema": PERIOD_SCHEMA, "period": {"since": _iso(t0), "until": _iso(t1)},
        "tenant_id": last["tenant_id"], "cloud": last["cloud"], "mode": last["mode"],
        "packages": [{"run_id": p["manifest"]["run_id"], "audit_window": p["manifest"]["audit_window"], "evidence_manifest_sha256": p["sha256"]} for p in pkgs],
        "chain_breaks": breaks, "coverage_gaps": gaps, "unverified": unverified,
        "baseline_at_start": first.get("baseline"), "baseline_at_end": last.get("baseline"),
        "opened": opened, "closed": closed, "open_at_end": len(open_end),
        "vintage": None if not vintage else {"vintage": vintage["vintage"], "manifest_sha256": vintage["manifest_sha256"], "findings": len(vintage["findings"])},
        "controls": controls, "gate7": gate7, "complete": complete,
    }
    dest.mkdir(parents=True)
    write_text(dest / PERIOD_MANIFEST, dump_json(manifest))
    write_text(dest / "period-summary.md", period_markdown(manifest))
    write_text(dest / SUMS, "\n".join(f"{sha256_file(dest / n)}  {n}" for n in ("period-summary.md", PERIOD_MANIFEST)) + "\n")
    return dest, manifest


def period_markdown(m: dict[str, Any]) -> str:
    lines = [
        "# Non-person identity evidence for the period", "",
        f"Period {m['period']['since']} to {m['period']['until']}; tenant {m['tenant_id']} ({m['cloud']}, {m['mode']}); "
        f"{len(m['packages'])} package(s), chain breaks {len(m['chain_breaks'])}, coverage gaps {len(m['coverage_gaps'])}, "
        f"unverified task runs {len(m['unverified'])}. Findings opened {len(m['opened'])}, closed {len(m['closed'])}, open at the end {m['open_at_end']}.",
        "", "| Control | Open findings | Open warnings | Status |", "|---|---|---|---|",
    ]
    lines += [f"| {c['control']} {c['title']} | {c['open_findings']} | {c['open_warnings']} | {c['status']} |" for c in m["controls"]]
    lines += ["", "| Gate 7 criterion | From this code | Status |", "|---|---|---|"]
    lines += [f"| {g['criterion']} | {g['from_this_code']} | {g['status']} |" for g in m["gate7"]]
    lines += ["", "| Package | Audit window | EVIDENCE-MANIFEST.json SHA-256 |", "|---|---|---|"]
    lines += [f"| {p['run_id']} | {p['audit_window']['since']} to {p['audit_window']['until']} | `{p['evidence_manifest_sha256']}` |" for p in m["packages"]]
    if m["vintage"]:
        lines += ["", f"AI use-case inventory vintage {m['vintage']['vintage']}: {m['vintage']['findings']} open finding(s); manifest SHA-256 `{m['vintage']['manifest_sha256']}`."]
    lines += ["", "Object keys and fingerprints only. The packages hold the names, under the evidence store's access control. "
              "The control mapping is the program's (design guidance); the assessor and the authorizing official decide each control."]
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- command line

def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("package", help="write the evidence package for one drift run")
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
    q.add_argument("--vintage", type=Path)
    q.add_argument("--out", type=Path, required=True)
    args = ap.parse_args(argv)
    try:
        if args.cmd == "package":
            meta = metadata_from_env(dict(os.environ)) if args.meta_from_env else {}
            dest = package_npi(args.run, args.out, args.previous_manifest, meta)
            m = read_json(dest / EVIDENCE_MANIFEST)
            print(json.dumps({"package": dest.name, "evidence_manifest_sha256": sha256_file(dest / EVIDENCE_MANIFEST), "open": len(m["open"]),
                              "new": len(m["since_previous"]["new"]), "resolved": len(m["since_previous"]["resolved"])}, sort_keys=True))
            return EXIT_OK
        if args.cmd == "verify":
            print(json.dumps(verify_npi(args.package), sort_keys=True))
            return EXIT_OK
        if args.cmd == "period":
            dest, m = period_npi(args.evidence, args.since, args.until, args.out, args.vintage)
            print(json.dumps({"period": dest.name, "complete": m["complete"], "packages": len(m["packages"]), "coverage_gaps": len(m["coverage_gaps"]),
                              "chain_breaks": len(m["chain_breaks"]), "opened": len(m["opened"]), "closed": len(m["closed"])}, sort_keys=True))
            return EXIT_OK if m["complete"] else EXIT_DRIFT
    except (DriftError, OSError, ValueError, KeyError) as err:
        print(f"error: {err}", file=sys.stderr)
        return EXIT_ERROR
    return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
