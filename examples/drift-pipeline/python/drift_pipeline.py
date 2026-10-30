"""Drift pipeline: compare two validation kit runs, draft findings, and package evidence for the ISSO.

Illustrative: unit-tested against fixtures, not proven against a live tenant. Standard library only.

    python drift_pipeline.py compare --previous <kit-run> --current <kit-run> --out <dir> [--allow-tenant-mismatch]
    python drift_pipeline.py issues  --diff <dir>/drift-report.json --out <dir>/issues.json
    python drift_pipeline.py package --kit-run <kit-run> --diff <dir>/drift-report.json
                                     --provenance hcm-entra=<file> ... --out <evidence-dir>
    python drift_pipeline.py verify  <evidence-dir>/<run-id>
    python drift_pipeline.py cloud   --name gcc

Exit codes: 0 no drift (or verified), 2 drift found (new, changed or unverified results),
1 error or refusal (a run that fails its own manifest, runs that can't be compared, including runs of
different or unrecorded tenants without --allow-tenant-mismatch, a package
that fails verification).
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Any

EXIT_OK, EXIT_ERROR, EXIT_DRIFT = 0, 1, 2

DIFF_SCHEMA = "fmp-drift-diff/1"
EVIDENCE_SCHEMA = "fmp-drift-evidence/1"
KIT_MANIFEST = "ValidationManifest.json"
KIT_RESULTS = "Results/ValidationResults.json"
EVIDENCE_MANIFEST = "EVIDENCE-MANIFEST.json"
SUMS = "SHA256SUMS"
COUNTED = ("Finding", "Warn")          # the kit's Count: Info rows give context and don't count
UNREAD = ("Error", "NotApplicable")    # a check that didn't read the tenant proves nothing

# Sign-in and Graph hosts per cloud. GCC uses the worldwide endpoints; GCC High and DoD share
# the US Government authority and Azure environment but have different Graph hosts.
# Sources: Learn "Microsoft Graph national cloud deployments"; "Use the Azure Login action with
# OpenID Connect"; "Configure an application to trust a managed identity" (audiences);
# Connect-MgGraph (environment names).
CLOUDS: dict[str, dict[str, str]] = {
    "gcc": {
        "authority": "https://login.microsoftonline.com",
        "graph": "https://graph.microsoft.com",
        "azure_environment": "AzureCloud",
        "audience": "api://AzureADTokenExchange",
        "mg_environment": "Global",
    },
    "gcchigh": {
        "authority": "https://login.microsoftonline.us",
        "graph": "https://graph.microsoft.us",
        "azure_environment": "AzureUSGovernment",
        "audience": "api://AzureADTokenExchangeUSGov",
        "mg_environment": "USGov",
    },
    "dod": {
        "authority": "https://login.microsoftonline.us",
        "graph": "https://dod-graph.microsoft.us",
        "azure_environment": "AzureUSGovernment",
        "audience": "api://AzureADTokenExchangeUSGov",
        "mg_environment": "USGovDoD",
    },
}


class DriftError(Exception):
    """A refusal: the inputs can't be trusted or can't be compared."""


# ---------------------------------------------------------------- helpers

def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path: Path) -> Any:
    # The validation kit writes UTF-8; tolerate a byte order mark from other writers.
    return json.loads(path.read_text(encoding="utf-8-sig"))


def dump_json(obj: Any) -> str:
    return json.dumps(obj, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def cloud_profile(name: str) -> dict[str, str]:
    """The hosts for one cloud. An unknown name is refused, never mapped to worldwide."""
    key = (name or "").strip().lower()
    if key not in CLOUDS:
        raise DriftError(f"unknown cloud {name!r}; expected one of {', '.join(CLOUDS)}")
    return dict(CLOUDS[key], name=key)


# ---------------------------------------------------------------- a validation kit run

def load_run(run_dir: Path) -> dict[str, Any]:
    """Read one validation kit run and check it against its own ValidationManifest.json.

    Every file the manifest lists must exist with the same SHA-256, and no other file may be
    present: a run that was edited, truncated or added to after the kit wrote it is refused."""
    run_dir = Path(run_dir)
    manifest_path = run_dir / KIT_MANIFEST
    if not manifest_path.is_file():
        raise DriftError(f"{run_dir}: no {KIT_MANIFEST}; not a validation kit run")
    manifest = read_json(manifest_path)
    listed = {f["RelativePath"]: f for f in manifest.get("Files", [])}
    present = {p.relative_to(run_dir).as_posix() for p in run_dir.rglob("*") if p.is_file()} - {KIT_MANIFEST}
    if present != set(listed):
        extra, missing = sorted(present - set(listed)), sorted(set(listed) - present)
        raise DriftError(f"{run_dir}: files differ from the kit manifest (extra {extra}, missing {missing})")
    for rel, meta in listed.items():
        if sha256_file(run_dir / rel).lower() != str(meta["SHA256"]).lower():
            raise DriftError(f"{run_dir}: {rel} doesn't match the SHA-256 in the kit manifest")
    if manifest.get("ReadOnly") is not True:
        raise DriftError(f"{run_dir}: the kit manifest doesn't say the run was read-only")
    if KIT_RESULTS not in listed:
        raise DriftError(f"{run_dir}: no {KIT_RESULTS}")
    results = read_json(run_dir / KIT_RESULTS)
    return {
        "path": run_dir,
        "manifest": manifest,
        "manifest_sha256": sha256_file(manifest_path),
        "run_id": manifest["RunId"],
        "as_of": manifest["AsOfUtc"],
        "mode": manifest["Mode"],
        "cloud": manifest["Cloud"],
        # Recorded by the kit from the run's own sign-in (the token's tid claim) or, for a fixture
        # run, the fixture tenant's placeholder. None in a manifest written before the kit recorded it.
        "tenant_id": (str(manifest.get("TenantId") or "").strip() or None),
        "options": manifest.get("Options") or {},
        "checks": {r["CheckId"]: r for r in results},
    }


def _object(row: dict[str, Any]) -> str:
    return str(row.get("ObjectId") or row.get("Object") or "")


def _key(check_id: str, row: dict[str, Any]) -> tuple[str, str, str]:
    return (check_id, _object(row), str(row.get("Issue", "")))


def fingerprint(check_id: str, obj: str, issue: str) -> str:
    """A stable ID for one finding: the same check, object and issue give the same value."""
    return hashlib.sha256(f"{check_id}|{obj}|{issue}".encode("utf-8")).hexdigest()[:16]


def _finding(check: dict[str, Any], row: dict[str, Any]) -> dict[str, Any]:
    check_id = check["CheckId"]
    return {
        "check_id": check_id,
        "track": check.get("Track", ""),
        "title": check.get("Title", ""),
        "severity": row.get("Severity", ""),
        "object": str(row.get("Object", "")),
        "object_id": str(row.get("ObjectId", "")),
        "issue": str(row.get("Issue", "")),
        "detail": str(row.get("Detail", "")),
        "fingerprint": fingerprint(check_id, _object(row), str(row.get("Issue", ""))),
    }


def _counted_rows(check: dict[str, Any]) -> list[dict[str, Any]]:
    return [r for r in (check.get("Details") or []) if r.get("Severity") in COUNTED]


# ---------------------------------------------------------------- compare

def tenant_problem(prev: dict[str, Any], curr: dict[str, Any]) -> str | None:
    """Why two runs can't be shown to come from one tenant, or None when their tenant IDs match."""
    a, b = prev.get("tenant_id"), curr.get("tenant_id")
    missing = [name for name, v in (("previous", a), ("current", b)) if not v]
    if missing:
        return f"no tenant ID in the {' and '.join(missing)} run's kit manifest, so the runs can't be shown to come from one tenant"
    if str(a).lower() != str(b).lower():
        return f"tenant differs: {a} then {b}"
    return None


def assert_comparable(prev: dict[str, Any], curr: dict[str, Any], allow_tenant_mismatch: bool = False) -> list[str]:
    """Refuse runs that can't be compared; return notes for differences that can be.

    Two runs from different tenants in the same cloud, or a run whose manifest records no tenant,
    are refused unless allow_tenant_mismatch is set; the override is then written into the notes."""
    if prev["mode"] != curr["mode"]:
        raise DriftError(f"mode differs: {prev['mode']} then {curr['mode']}; a fixture run is not evidence about a tenant")
    if str(prev["cloud"]).lower() != str(curr["cloud"]).lower():
        raise DriftError(f"cloud differs: {prev['cloud']} then {curr['cloud']}")
    notes = []
    problem = tenant_problem(prev, curr)
    if problem and not allow_tenant_mismatch:
        raise DriftError(f"{problem}; compare runs of one tenant, or pass --allow-tenant-mismatch for a reviewed exception")
    if problem:
        notes.append(f"Compared despite a tenant check failure (--allow-tenant-mismatch): {problem}")
    if not str(curr["as_of"]) > str(prev["as_of"]):
        raise DriftError(f"the current run ({curr['as_of']}) isn't later than the previous one ({prev['as_of']})")
    for k in sorted(set(prev["options"]) | set(curr["options"])):
        a, b = prev["options"].get(k), curr["options"].get(k)
        if a != b:
            notes.append(f"Option {k} changed from {a!r} to {b!r}: findings it affects may reflect the change, not the tenant")
    return notes


def compare(prev: dict[str, Any] | None, curr: dict[str, Any], allow_tenant_mismatch: bool = False) -> dict[str, Any]:
    """Diff two runs: new, resolved, changed, unchanged and unverified findings, and check status changes.

    A finding is one Finding or Warn row, keyed by check, object ID (or name) and issue.
    "Changed" means the same object and check with a different severity or issue text; a
    difference only in Detail is listed as detail_only and opens nothing. A check that ended in
    Error or NotApplicable, or didn't run, proves nothing about its earlier findings: they are
    "unverified", never "resolved". Runs of different or unrecorded tenants are refused unless
    allow_tenant_mismatch is set (assert_comparable)."""
    report: dict[str, Any] = {
        "schema": DIFF_SCHEMA,
        "baseline": prev is None,
        "previous": None if prev is None else {"run_id": prev["run_id"], "as_of": prev["as_of"], "kit_manifest_sha256": prev["manifest_sha256"],
                                               "tenant_id": prev.get("tenant_id")},
        "current": {"run_id": curr["run_id"], "as_of": curr["as_of"], "kit_manifest_sha256": curr["manifest_sha256"],
                    "mode": curr["mode"], "cloud": curr["cloud"], "tenant_id": curr.get("tenant_id")},
        "notes": [],
        "checks": [],
        "new": [], "resolved": [], "changed": [], "detail_only": [], "unchanged": [], "unverified": [],
    }
    if prev is None:
        for cid, check in sorted(curr["checks"].items()):
            report["new"] += [_finding(check, r) for r in _counted_rows(check)]
            if check.get("Status") in UNREAD:
                report["unverified"].append({"check_id": cid, "reason": check["Status"], "message": check.get("Message", ""), "findings": []})
        report["notes"].append("No previous run: this run is the baseline. Its findings are recorded, not opened one by one.")
        if not curr.get("tenant_id"):
            report["notes"].append("The kit manifest records no tenant ID: the next run can't be compared with this one without --allow-tenant-mismatch.")
        return _finish(report)

    report["notes"] += assert_comparable(prev, curr, allow_tenant_mismatch)
    for cid in sorted(set(prev["checks"]) | set(curr["checks"])):
        p, c = prev["checks"].get(cid), curr["checks"].get(cid)
        before = p.get("Status") if p else None
        after = c.get("Status") if c else None
        if before != after:
            report["checks"].append({"check_id": cid, "before": before, "after": after})
        p_rows = {_key(cid, r): r for r in _counted_rows(p)} if p else {}
        if c is None or after in UNREAD:
            reason = "not run" if c is None else after
            report["unverified"].append({
                "check_id": cid, "reason": reason, "message": "" if c is None else c.get("Message", ""),
                "findings": [_finding(p, r) for k, r in sorted(p_rows.items())],
            })
            continue
        c_rows = {_key(cid, r): r for r in _counted_rows(c)}
        for k in sorted(set(p_rows) & set(c_rows)):
            a, b = p_rows[k], c_rows[k]
            if a.get("Severity") != b.get("Severity"):
                report["changed"].append({"before": _finding(p, a), "after": _finding(c, b)})
            elif a.get("Detail", "") != b.get("Detail", ""):
                report["detail_only"].append({"before": _finding(p, a), "after": _finding(c, b)})
            else:
                report["unchanged"].append(_finding(c, b))
        gone = {k: p_rows[k] for k in set(p_rows) - set(c_rows)}
        came = {k: c_rows[k] for k in set(c_rows) - set(p_rows)}
        # Same object, one row before and one after, different issue text: a change, not a new pair.
        for obj in sorted({k[1] for k in gone} & {k[1] for k in came}):
            g = [k for k in gone if k[1] == obj]
            n = [k for k in came if k[1] == obj]
            if len(g) == 1 and len(n) == 1:
                report["changed"].append({"before": _finding(p, gone.pop(g[0])), "after": _finding(c, came.pop(n[0]))})
        report["resolved"] += [_finding(p, gone[k]) for k in sorted(gone)]
        report["new"] += [_finding(c, came[k]) for k in sorted(came)]
    return _finish(report)


def _finish(report: dict[str, Any]) -> dict[str, Any]:
    report["counts"] = {k: len(report[k]) for k in ("new", "resolved", "changed", "detail_only", "unchanged", "unverified")}
    report["drift"] = bool(report["new"] or report["changed"] or report["unverified"])
    return report


def summary_markdown(report: dict[str, Any]) -> str:
    c = report["counts"]
    prev = report["previous"]["run_id"] if report["previous"] else "none (baseline)"
    lines = [
        "# Drift report", "",
        f"Current run **{report['current']['run_id']}** ({report['current']['cloud']}, {report['current']['mode']}); previous run **{prev}**.", "",
        f"New {c['new']}, resolved {c['resolved']}, changed {c['changed']}, detail only {c['detail_only']}, "
        f"unchanged {c['unchanged']}, unverified checks {c['unverified']}.",
    ]
    if report["notes"]:
        lines += [""] + [f"- {n}" for n in report["notes"]]
    if report["checks"]:
        lines += ["", "| Check | Before | After |", "|---|---|---|"]
        lines += [f"| {x['check_id']} | {x['before'] or 'not run'} | {x['after'] or 'not run'} |" for x in report["checks"]]
    lines += ["", "Object names are in drift-report.json, which goes to the evidence store, not to the issue tracker."]
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- findings to open

def _issue_object(f: dict[str, Any], include_names: bool) -> str:
    if include_names and f["object"]:
        return f"{f['object']} ({f['object_id']})" if f["object_id"] else f["object"]
    return f["object_id"] or "(name withheld; see the evidence package)"


def issue_drafts(report: dict[str, Any], include_names: bool = False) -> list[dict[str, Any]]:
    """What to open, comment on or close in the tracker, one entry per finding.

    Bodies carry the check, the object ID and the fingerprint, not user names, unless
    include_names is set (design guidance: the evidence store holds the names, the tracker
    doesn't need them). A baseline opens one summary issue, not one per finding."""
    run = report["current"]["run_id"]
    ref = f"Evidence: run {run}, kit manifest SHA-256 {report['current']['kit_manifest_sha256']}."
    out: list[dict[str, Any]] = []
    if report["baseline"]:
        out.append({"action": "open", "fingerprint": fingerprint("baseline", run, ""), "labels": ["drift", "baseline"],
                    "title": f"[drift] Baseline recorded: {run}",
                    "body": f"First run of the drift pipeline: {report['counts']['new']} finding(s) recorded as the baseline. {ref}"})
        return out
    for f in report["new"]:
        out.append({"action": "open", "fingerprint": f["fingerprint"], "labels": ["drift", "new"],
                    "title": f"[drift] {f['check_id']} new: {f['issue']}",
                    "body": "\n".join([f"Check: {f['check_id']} ({f['title']})", f"Severity: {f['severity']}",
                                       f"Object: {_issue_object(f, include_names)}", f"Issue: {f['issue']}",
                                       f"Fingerprint: {f['fingerprint']}", ref])})
    for ch in report["changed"]:
        a, b = ch["before"], ch["after"]
        body = "\n".join([f"Check: {b['check_id']} ({b['title']})", f"Object: {_issue_object(b, include_names)}",
                          f"Before: {a['severity']}: {a['issue']}", f"After: {b['severity']}: {b['issue']}",
                          f"Fingerprint: {b['fingerprint']} (was {a['fingerprint']})", ref])
        if a["fingerprint"] == b["fingerprint"]:
            # Same check, object and issue; only the severity moved. Comment on the open issue
            # (or open one if none is open).
            out.append({"action": "comment", "fingerprint": b["fingerprint"], "labels": ["drift", "changed"],
                        "title": f"[drift] {b['check_id']} changed: {b['issue']}", "body": body})
        else:
            out.append({"action": "open", "fingerprint": b["fingerprint"], "labels": ["drift", "changed"],
                        "title": f"[drift] {b['check_id']} changed: {b['issue']}", "body": body})
            out.append({"action": "close", "fingerprint": a["fingerprint"], "labels": ["drift"],
                        "title": f"[drift] {a['check_id']} superseded: {a['issue']}",
                        "body": f"Superseded by finding {b['fingerprint']} in run {run}. {ref}"})
    for u in report["unverified"]:
        out.append({"action": "open", "fingerprint": fingerprint(u["check_id"], "unverified", ""), "labels": ["drift", "unverified"],
                    "title": f"[drift] {u['check_id']} not verified ({u['reason']})",
                    "body": "\n".join([f"Check: {u['check_id']} ended {u['reason']}: {u['message']}".rstrip(": "),
                                       f"{len(u['findings'])} earlier finding(s) can't be confirmed resolved until it reads the tenant again.", ref])})
    for x in report["checks"]:
        # A check that couldn't read before and reads again closes its "not verified" issue.
        if x["before"] in UNREAD + (None,) and x["after"] is not None and x["after"] not in UNREAD:
            out.append({"action": "close", "fingerprint": fingerprint(x["check_id"], "unverified", ""), "labels": ["drift"],
                        "title": f"[drift] {x['check_id']} reads again",
                        "body": f"{x['check_id']} ended {x['after']} in run {run}. {ref}"})
    for f in report["resolved"]:
        out.append({"action": "close", "fingerprint": f["fingerprint"], "labels": ["drift"],
                    "title": f"[drift] {f['check_id']} resolved: {f['issue']}",
                    "body": f"No longer reported by {f['check_id']} in run {run}, which read the tenant. {ref}"})
    return out


# ---------------------------------------------------------------- provenance from the other kits

def describe_provenance(kind: str, path: Path, as_of: str, max_age_days: int) -> dict[str, Any]:
    """Recognize a provenance file from the other kits and summarize it. Unknown files are refused."""
    data = read_json(path)
    entry: dict[str, Any] = {"kind": kind, "file": path.name, "sha256": sha256_file(path), "notes": []}
    dated = None
    if kind == "hcm-entra":
        if data.get("schema") != "fmp-hcm-provenance/1":
            raise DriftError(f"{path}: not an hcm-entra provenance manifest")
        entry.update(schema=data["schema"], as_of=data["as_of"], extract_sha256=data["extract_sha256"],
                     mapping_sha256=data["mapping_sha256"], counts=data.get("counts", {}), held=data.get("held"),
                     batches=[b["batch_sha256"] for b in data.get("batches", [])])
        dated = data["as_of"]
    elif kind == "machine-configuration":
        if data.get("schema") != "fmp-mc-provenance/1":
            raise DriftError(f"{path}: not a machine-configuration provenance manifest")
        entry.update(schema=data["schema"], built_at=data["built_at"], configuration=data["configuration"],
                     version=data["version"], policy_id=data["policy_id"], package_sha256=data["package"]["sha256"],
                     findings=data.get("findings", {}))
        dated = data["built_at"]
    elif kind == "dynamic-rules":
        if not {"base_ref", "rules", "findings", "shadow"} <= set(data):
            raise DriftError(f"{path}: not a dynamic-rules check-results file")
        severities: dict[str, int] = {}
        for f in data["findings"]:
            severities[f.get("Severity", "?")] = severities.get(f.get("Severity", "?"), 0) + 1
        entry.update(schema=None, base_ref=data["base_ref"], rules=data["rules"], findings=severities,
                     changed_files=len(data["shadow"]))
        entry["notes"].append("check-results.json carries no date or commit; the pipeline that produced it must record both")
    else:
        raise DriftError(f"unknown provenance kind {kind!r}; expected hcm-entra, machine-configuration or dynamic-rules")
    if dated:
        age = (dt.date.fromisoformat(as_of[:10]) - dt.date.fromisoformat(str(dated)[:10])).days
        entry["age_days"] = age
        if age > max_age_days:
            entry["notes"].append(f"older than {max_age_days} days at the time of this run")
    return entry


# ---------------------------------------------------------------- the evidence package

def package(kit_run: Path, report: dict[str, Any], provenance: list[tuple[str, Path]], out_root: Path,
            previous_manifest: Path | None = None, metadata: dict[str, Any] | None = None,
            max_age_days: int = 30) -> Path:
    """Write <out_root>/<run-id>/ with the kit run, the drift report, the other kits' provenance,
    EVIDENCE-MANIFEST.json (SHA-256 per file, run metadata, the previous package's manifest hash)
    and SHA256SUMS. The same inputs give the same bytes."""
    run = load_run(kit_run)
    if report["current"]["run_id"] != run["run_id"] or report["current"]["kit_manifest_sha256"] != run["manifest_sha256"]:
        raise DriftError("the drift report was made from a different kit run")
    dest = Path(out_root) / run["run_id"]
    if dest.exists():
        raise DriftError(f"{dest} already exists; an evidence package is written once")
    files: dict[str, Path] = {}
    for p in sorted(Path(kit_run).rglob("*")):
        if p.is_file():
            files["kit-run/" + p.relative_to(kit_run).as_posix()] = p
    entries = []
    for kind, path in provenance:
        entry = describe_provenance(kind, Path(path), run["as_of"], max_age_days)
        rel = f"provenance/{kind}/{Path(path).name}"
        if rel in files:
            raise DriftError(f"two provenance files for {rel}")
        files[rel] = Path(path)
        entry["path"] = rel
        entries.append(entry)
    previous = None
    if previous_manifest is not None:
        prev = read_json(Path(previous_manifest))
        if prev.get("schema") != EVIDENCE_SCHEMA:
            raise DriftError(f"{previous_manifest}: not an evidence manifest")
        expected = report["previous"]["run_id"] if report["previous"] else None
        if prev["run_id"] != expected:
            raise DriftError(f"the previous package is run {prev['run_id']}, but the drift report compared against {expected}")
        previous = {"run_id": prev["run_id"], "evidence_manifest_sha256": sha256_file(Path(previous_manifest))}
    elif report["previous"] is not None:
        raise DriftError("the drift report has a previous run; pass its EVIDENCE-MANIFEST.json to chain the packages")

    for rel, src in files.items():
        target = dest / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, target)
    write_text(dest / "drift" / "drift-report.json", dump_json(report))
    write_text(dest / "drift" / "drift-summary.md", summary_markdown(report))

    listed = sorted(p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file())
    manifest = {
        "schema": EVIDENCE_SCHEMA,
        "run_id": run["run_id"],
        "as_of": run["as_of"],
        "cloud": run["cloud"],
        "tenant_id": run["tenant_id"],
        "mode": run["mode"],
        "read_only": True,
        "metadata": dict(sorted((metadata or {}).items())),
        "kit": {"run_id": run["run_id"], "kit_version": run["manifest"].get("KitVersion"),
                "manifest_sha256": run["manifest_sha256"], "files_verified": len(run["manifest"].get("Files", []))},
        "drift": {"baseline": report["baseline"], "counts": report["counts"], "drift": report["drift"]},
        "previous": previous,
        "provenance": entries,
        "files": [{"path": rel, "bytes": (dest / rel).stat().st_size, "sha256": sha256_file(dest / rel)} for rel in listed],
    }
    write_text(dest / EVIDENCE_MANIFEST, dump_json(manifest))
    sums = [f"{sha256_file(dest / rel)}  {rel}" for rel in listed + [EVIDENCE_MANIFEST]]
    write_text(dest / SUMS, "\n".join(sums) + "\n")
    return dest


def verify(package_dir: Path) -> dict[str, Any]:
    """Check a package as the ISSO would: every file against the manifest and SHA256SUMS, nothing
    extra, and the kit run inside it against its own manifest."""
    package_dir = Path(package_dir)
    manifest = read_json(package_dir / EVIDENCE_MANIFEST)
    if manifest.get("schema") != EVIDENCE_SCHEMA:
        raise DriftError(f"{package_dir}: not an evidence package")
    listed = {f["path"]: f for f in manifest["files"]}
    present = {p.relative_to(package_dir).as_posix() for p in package_dir.rglob("*") if p.is_file()} - {EVIDENCE_MANIFEST, SUMS}
    if present != set(listed):
        raise DriftError(f"{package_dir}: files differ from the manifest (extra {sorted(present - set(listed))}, missing {sorted(set(listed) - present)})")
    for rel, meta in listed.items():
        if sha256_file(package_dir / rel) != meta["sha256"]:
            raise DriftError(f"{package_dir}: {rel} doesn't match its SHA-256")
    sums = {}
    for line in (package_dir / SUMS).read_text(encoding="utf-8").splitlines():
        digest, rel = line.split("  ", 1)
        sums[rel] = digest
    if set(sums) != set(listed) | {EVIDENCE_MANIFEST}:
        raise DriftError(f"{package_dir}: {SUMS} doesn't list the same files")
    for rel, digest in sums.items():
        if sha256_file(package_dir / rel) != digest:
            raise DriftError(f"{package_dir}: {rel} doesn't match {SUMS}")
    run = load_run(package_dir / "kit-run")
    if run["manifest_sha256"] != manifest["kit"]["manifest_sha256"]:
        raise DriftError(f"{package_dir}: the kit manifest isn't the one the package recorded")
    return {"run_id": manifest["run_id"], "files": len(listed) + 1,
            "evidence_manifest_sha256": sha256_file(package_dir / EVIDENCE_MANIFEST)}


def metadata_from_env(env: dict[str, str]) -> dict[str, Any]:
    """Run metadata from the GitHub Actions default variables. Identifiers only: no actor name, no token."""
    keys = ("GITHUB_REPOSITORY", "GITHUB_WORKFLOW_REF", "GITHUB_RUN_ID", "GITHUB_RUN_ATTEMPT", "GITHUB_SHA", "GITHUB_EVENT_NAME")
    return {k.lower(): env[k] for k in keys if env.get(k)}


# ---------------------------------------------------------------- command line

def _parse_provenance(values: list[str]) -> list[tuple[str, Path]]:
    out = []
    for v in values or []:
        kind, sep, path = v.partition("=")
        if not sep:
            raise DriftError(f"--provenance takes kind=path, got {v!r}")
        out.append((kind, Path(path)))
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("compare", help="diff two validation kit runs")
    c.add_argument("--previous", type=Path, help="the previous kit run folder (omit for a baseline)")
    c.add_argument("--current", type=Path, required=True)
    c.add_argument("--out", type=Path, required=True)
    c.add_argument("--allow-tenant-mismatch", action="store_true",
                   help="compare runs whose kit manifests record different tenant IDs, or none (a reviewed exception; noted in the report)")
    i = sub.add_parser("issues", help="draft what to open and close")
    i.add_argument("--diff", type=Path, required=True)
    i.add_argument("--out", type=Path, required=True)
    i.add_argument("--include-names", action="store_true", help="put object names in issue bodies")
    p = sub.add_parser("package", help="write the evidence package")
    p.add_argument("--kit-run", type=Path, required=True)
    p.add_argument("--diff", type=Path, required=True)
    p.add_argument("--provenance", action="append", default=[], help="kind=path; kinds: hcm-entra, machine-configuration, dynamic-rules")
    p.add_argument("--previous-manifest", type=Path)
    p.add_argument("--meta", type=Path, help="JSON file of run metadata")
    p.add_argument("--meta-from-env", action="store_true", help="take run metadata from the GitHub Actions variables")
    p.add_argument("--max-age-days", type=int, default=30)
    p.add_argument("--out", type=Path, required=True)
    v = sub.add_parser("verify", help="verify an evidence package")
    v.add_argument("package", type=Path)
    k = sub.add_parser("cloud", help="print the sign-in and Graph hosts for a cloud")
    k.add_argument("--name", required=True)
    args = ap.parse_args(argv)

    try:
        if args.cmd == "compare":
            prev = load_run(args.previous) if args.previous else None
            report = compare(prev, load_run(args.current), args.allow_tenant_mismatch)
            write_text(args.out / "drift-report.json", dump_json(report))
            write_text(args.out / "drift-summary.md", summary_markdown(report))
            print(json.dumps({"counts": report["counts"], "baseline": report["baseline"], "drift": report["drift"]}, sort_keys=True))
            return EXIT_DRIFT if report["drift"] else EXIT_OK
        if args.cmd == "issues":
            drafts = issue_drafts(read_json(args.diff), include_names=args.include_names)
            write_text(args.out, dump_json(drafts))
            print(json.dumps({a: sum(d["action"] == a for d in drafts) for a in ("open", "comment", "close")}, sort_keys=True))
            return EXIT_OK
        if args.cmd == "package":
            meta = read_json(args.meta) if args.meta else {}
            if args.meta_from_env:
                meta.update(metadata_from_env(dict(os.environ)))
            dest = package(args.kit_run, read_json(args.diff), _parse_provenance(args.provenance), args.out,
                           args.previous_manifest, meta, args.max_age_days)
            print(json.dumps({"package": dest.name, "evidence_manifest_sha256": sha256_file(dest / EVIDENCE_MANIFEST)}, sort_keys=True))
            return EXIT_OK
        if args.cmd == "verify":
            print(json.dumps(verify(args.package), sort_keys=True))
            return EXIT_OK
        if args.cmd == "cloud":
            print(json.dumps(cloud_profile(args.name), indent=2, sort_keys=True))
            return EXIT_OK
    except (DriftError, OSError, ValueError, KeyError) as err:
        print(f"error: {err}", file=sys.stderr)
        return EXIT_ERROR
    return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
