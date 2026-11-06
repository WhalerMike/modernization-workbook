"""Turn a drift pipeline evidence package into NIST OSCAL JSON: Assessment Results and a POA&M.

Illustrative: unit-tested against fixtures, not proven against a live tenant or accepted by any
assessor's tooling. Standard library only to generate; `validate` needs jsonschema and regex.

    python oscal_export.py export   --package <evidence-dir>/<run-id> --out <dir>
                                    [--acceptances <file>] [--control-map <file>] [--include-names]
                                    [--due-days 30] [--ssp-href ssp.json] [--ap-href assessment-plan.json]
    python oscal_export.py validate <oscal-file>...

Reads the package's drift report and EVIDENCE-MANIFEST.json (after verifying the package) and writes
assessment-results.json and poam.json. Targets OSCAL 1.2.3 (OSCAL_VERSION). Every UUID is a uuid5 over a
stable key, and every timestamp comes from the run, so the same package gives the same bytes.

Dispositions (Book 14, Chapter 11): a failing finding with no acceptance is actionable drift (risk status
open); one with an in-date acceptance is a governed exception (deviation-approved); one whose acceptance
expired before the run's date is a lapsed acceptance (open). The acceptance register is an input; this
script doesn't decide acceptances.

Exit codes: 0 done (or valid), 1 error, refusal or invalid output.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import uuid
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
import drift_pipeline as dp  # noqa: E402

OSCAL_VERSION = "1.2.3"
NS = "https://agency.example.gov/ns/fmp"            # the agency's own property namespace (as in Book 14, Chapter 11)
UUID_NS = uuid.uuid5(uuid.NAMESPACE_URL, "https://agency.example.gov/ns/fmp/oscal-export/1")
DATA = Path(__file__).resolve().parents[1] / "data"
DEFAULT_CONTROL_MAP = DATA / "check-controls.json"
SCHEMAS = {"assessment-results": DATA / "oscal-1.2.3" / "oscal_assessment-results_schema.json",
           "plan-of-action-and-milestones": DATA / "oscal-1.2.3" / "oscal_poam_schema.json"}
ACCEPTANCE_SCHEMA = "fmp-acceptances/1"
CONTROL_MAP_SCHEMA = "fmp-check-controls/1"
FALLBACK_CONTROLS = ["CA-7"]                         # a check or track the map doesn't list

STATUS = {                                           # disposition -> OSCAL risk status (Book 14, Chapter 11)
    "actionable_drift": "open",
    "lapsed_acceptance": "open",
    "governed_exception": "deviation-approved",
    "resolved": "closed",
}


def uid(*key: str) -> str:
    """A deterministic UUID (version 5) over a stable key."""
    return str(uuid.uuid5(UUID_NS, "|".join(key)))


def oscal_control_id(control: str) -> str:
    """AC-2(1) -> ac-2.1, the form OSCAL catalogs use."""
    return control.strip().lower().replace("(", ".").replace(")", "")


def prop(name: str, value: str) -> dict[str, str]:
    return {"name": name, "ns": NS, "value": value}


# ---------------------------------------------------------------- inputs

def load_control_map(path: Path | None = None) -> dict[str, Any]:
    data = dp.read_json(Path(path or DEFAULT_CONTROL_MAP))
    if data.get("schema") != CONTROL_MAP_SCHEMA:
        raise dp.DriftError(f"{path or DEFAULT_CONTROL_MAP}: not a check-to-control map ({CONTROL_MAP_SCHEMA})")
    return data


def controls_for(check_id: str, track: str, cmap: dict[str, Any]) -> list[str]:
    found = (cmap.get("checks") or {}).get(check_id) or (cmap.get("tracks") or {}).get(track)
    return list(found or FALLBACK_CONTROLS)


def load_acceptances(path: Path | None) -> dict[str, dict[str, str]]:
    """The acceptance register, by finding fingerprint. None gives an empty register."""
    if path is None:
        return {}
    data = dp.read_json(Path(path))
    if data.get("schema") != ACCEPTANCE_SCHEMA:
        raise dp.DriftError(f"{path}: not an acceptance register ({ACCEPTANCE_SCHEMA})")
    out: dict[str, dict[str, str]] = {}
    for a in data.get("acceptances", []):
        for k in ("ref", "fingerprint", "expires"):
            if not a.get(k):
                raise dp.DriftError(f"{path}: an acceptance has no '{k}'")
        try:
            dt.date.fromisoformat(a["expires"])
        except ValueError:
            raise dp.DriftError(f"{path}: acceptance {a['ref']} has a bad expiry date {a['expires']!r}") from None
        if a["fingerprint"] in out:
            raise dp.DriftError(f"{path}: two acceptances for fingerprint {a['fingerprint']}")
        out[a["fingerprint"]] = a
    return out


def disposition(fingerprint: str, as_of: str, register: dict[str, dict[str, str]]) -> tuple[str, dict[str, str] | None]:
    """Judged at the run's date, so a rerun with the same inputs gives the same answer. An acceptance
    holds through its 'expires' day."""
    acc = register.get(fingerprint)
    if acc is None:
        return "actionable_drift", None
    if dt.date.fromisoformat(acc["expires"]) < dt.date.fromisoformat(as_of[:10]):
        return "lapsed_acceptance", acc
    return "governed_exception", acc


def current_findings(report: dict[str, Any]) -> list[dict[str, Any]]:
    """The failing rows as of this run, each once: new, changed (after), unchanged, detail-only (after),
    and earlier findings of checks that couldn't be re-read (they stay open)."""
    rows: list[dict[str, Any]] = []
    rows += [dict(f, state="read") for f in report["new"]]
    rows += [dict(c["after"], state="read") for c in report["changed"]]
    rows += [dict(f, state="read") for f in report["unchanged"]]
    rows += [dict(c["after"], state="read") for c in report["detail_only"]]
    for u in report["unverified"]:
        rows += [dict(f, state="not-reread") for f in u["findings"]]
    seen: dict[str, dict[str, Any]] = {}
    for r in rows:
        seen.setdefault(r["fingerprint"], r)
    return [seen[k] for k in sorted(seen)]


# ---------------------------------------------------------------- the documents

def _label(f: dict[str, Any], include_names: bool) -> str:
    if include_names and f["object"]:
        return f"{f['object']} ({f['object_id']})" if f["object_id"] else f["object"]
    return f["object_id"] or "(name withheld; see the evidence package)"


def _stamp(as_of: str) -> str:
    return as_of if as_of.endswith("Z") else as_of + "Z"


def _due(as_of: str, days: int) -> str:
    d = dt.date.fromisoformat(as_of[:10]) + dt.timedelta(days=days)
    return f"{d.isoformat()}T00:00:00Z"


def _context(package_dir: Path) -> dict[str, Any]:
    """Verify the package, then read what the converter needs from it."""
    package_dir = Path(package_dir)
    dp.verify(package_dir)
    manifest = dp.read_json(package_dir / dp.EVIDENCE_MANIFEST)
    report = dp.read_json(package_dir / "drift" / "drift-report.json")
    if report["current"]["run_id"] != manifest["run_id"]:
        raise dp.DriftError(f"{package_dir}: the drift report is for run {report['current']['run_id']}, the package for {manifest['run_id']}")
    if not manifest.get("tenant_id"):
        raise dp.DriftError(f"{package_dir}: the package records no tenant ID, so its items can't be keyed to a system")
    files = {f["path"]: f["sha256"] for f in manifest["files"]}
    return {"manifest": manifest, "report": report, "files": files,
            "manifest_sha256": dp.sha256_file(package_dir / dp.EVIDENCE_MANIFEST)}


def _back_matter(ctx: dict[str, Any]) -> dict[str, Any]:
    """The evidence files the observations cite, each with its SHA-256 from the evidence manifest."""
    run = ctx["manifest"]["run_id"]
    res = []
    for rel in ("drift/drift-report.json", "kit-run/Results/ValidationResults.json"):
        if rel in ctx["files"]:
            res.append({"uuid": uid("resource", run, rel), "title": rel,
                        "rlinks": [{"href": f"{run}/{rel}", "hashes": [{"algorithm": "SHA-256", "value": ctx["files"][rel]}]}]})
    res.append({"uuid": uid("resource", run, dp.EVIDENCE_MANIFEST), "title": dp.EVIDENCE_MANIFEST,
                "rlinks": [{"href": f"{run}/{dp.EVIDENCE_MANIFEST}", "hashes": [{"algorithm": "SHA-256", "value": ctx["manifest_sha256"]}]}]})
    return {"resources": res}


def _metadata(ctx: dict[str, Any], title: str) -> dict[str, Any]:
    m = ctx["manifest"]
    return {
        "title": title,
        "last-modified": _stamp(m["as_of"]),
        "version": m["run_id"],
        "oscal-version": OSCAL_VERSION,
        "props": [prop("run-id", m["run_id"]), prop("cloud", str(m["cloud"])), prop("mode", m["mode"]),
                  prop("tenant-id", m["tenant_id"]), prop("evidence-manifest-sha256", ctx["manifest_sha256"])],
    }


def build(package_dir: Path, register: dict[str, dict[str, str]], cmap: dict[str, Any], *, include_names: bool = False,
          due_days: int = 30, ssp_href: str = "ssp.json", ap_href: str = "assessment-plan.json") -> dict[str, dict[str, Any]]:
    """Both documents, from one verified evidence package: {'assessment-results': doc, 'poam': doc}."""
    ctx = _context(package_dir)
    m, report = ctx["manifest"], ctx["report"]
    run, tenant, as_of = m["run_id"], m["tenant_id"], _stamp(m["as_of"])
    mode_note = " Fixture run: not evidence about a tenant." if m["mode"] == "Fixture" else ""
    back = _back_matter(ctx)
    drift_res = next((r for r in back["resources"] if r["title"] == "drift/drift-report.json"), None)
    rel_evidence = [{"href": "#" + drift_res["uuid"], "description": "The run's drift report (SHA-256 in the back matter)."}] if drift_res else []

    findings = current_findings(report)
    tracks = {f["check_id"]: f["track"] for f in findings}
    for u in report["unverified"]:
        tracks.setdefault(u["check_id"], u["check_id"].split("-")[1] if u["check_id"].count("-") >= 2 else "")

    observations, risks, items = [], [], []
    by_control: dict[str, list[tuple[str, str]]] = {}

    for f in findings:
        disp, acc = disposition(f["fingerprint"], m["as_of"], register)
        oid = uid("observation", run, f["fingerprint"])
        rid = uid("risk", tenant, f["fingerprint"])
        controls = controls_for(f["check_id"], f["track"], cmap)
        label = _label(f, include_names)
        observations.append({
            "uuid": oid,
            "title": f"{f['check_id']}: {f['title']}",
            "description": f"{f['issue']}. Object: {label}.",
            "methods": ["TEST"], "types": ["finding"],
            "props": [prop("fingerprint", f["fingerprint"]), prop("check-id", f["check_id"]), prop("severity", f["severity"]),
                      prop("read-this-run", "true" if f["state"] == "read" else "false")],
            "relevant-evidence": rel_evidence,
            "collected": as_of,
        })
        risk_props = [prop("disposition", disp), prop("fingerprint", f["fingerprint"])]
        risk: dict[str, Any] = {
            "uuid": rid,
            "title": f"{f['check_id']} on {label}",
            "description": f["issue"],
            "statement": f"{', '.join(c.upper() for c in controls)} not shown satisfied: {f['issue']} ({f['check_id']}, {label}).",
            "status": STATUS[disp],
            "props": risk_props,
            "related-observations": [{"observation-uuid": oid}],
        }
        if acc:
            risk_props += [prop("acceptance-ref", acc["ref"]), prop("acceptance-expires", acc["expires"])]
            risk["deadline"] = f"{acc['expires']}T00:00:00Z"
        else:
            risk["deadline"] = _due(m["as_of"], due_days)
        risks.append(risk)
        items.append({
            "uuid": uid("poam-item", tenant, f["fingerprint"]),    # no run id: the item keeps its identity across runs
            "title": f"{f['check_id']}: {'accepted exception' if disp == 'governed_exception' else 'remediate'} on {label}",
            "description": f["issue"],
            "props": [prop("disposition", disp), prop("fingerprint", f["fingerprint"])]
                     + [prop("control-id", oscal_control_id(c)) for c in controls],
            "related-observations": [{"observation-uuid": oid}],
            "related-risks": [{"risk-uuid": rid}],
        })
        for c in controls:
            by_control.setdefault(oscal_control_id(c), []).append((oid, rid))

    # A finding a check that read the tenant no longer shows: closed on that re-test evidence.
    closed_obs, closed_risks, closed_items = [], [], []
    for f in sorted(report["resolved"], key=lambda r: r["fingerprint"]):
        oid = uid("observation", run, f["fingerprint"], "resolved")
        rid = uid("risk", tenant, f["fingerprint"])
        label = _label(f, include_names)
        closed_obs.append({"uuid": oid, "title": f"{f['check_id']}: {f['title']}",
                           "description": f"Not found by the check this run ({f['issue']}). Object: {label}.",
                           "methods": ["TEST"], "types": ["finding"],
                           "props": [prop("fingerprint", f["fingerprint"]), prop("check-id", f["check_id"])],
                           "relevant-evidence": rel_evidence, "collected": as_of})
        closed_risks.append({"uuid": rid, "title": f"{f['check_id']} on {label}", "description": f["issue"],
                             "statement": f"No longer found: {f['issue']} ({f['check_id']}, {label}).",
                             "status": STATUS["resolved"],
                             "props": [prop("disposition", "resolved"), prop("fingerprint", f["fingerprint"])],
                             "related-observations": [{"observation-uuid": oid}]})
        closed_items.append({"uuid": uid("poam-item", tenant, f["fingerprint"]),
                             "title": f"{f['check_id']}: closed on re-test evidence ({label})", "description": f["issue"],
                             "props": [prop("disposition", "resolved"), prop("fingerprint", f["fingerprint"])],
                             "related-observations": [{"observation-uuid": oid}], "related-risks": [{"risk-uuid": rid}]})

    # A check that couldn't read the tenant proves nothing: an observation, never a pass.
    unverified_obs = [
        {"uuid": uid("observation", run, "unverified", u["check_id"]),
         "title": f"{u['check_id']}: not verified this run ({u['reason']})",
         "description": u.get("message") or "The check did not read the tenant, so it proves nothing either way.",
         "methods": ["TEST"], "types": ["finding"],
         "props": [prop("check-id", u["check_id"]), prop("verification", "unverified"), prop("reason", u["reason"])],
         "relevant-evidence": rel_evidence, "collected": as_of}
        for u in sorted(report["unverified"], key=lambda r: r["check_id"])]

    reviewed = sorted({oscal_control_id(c) for cid, tr in tracks.items() for c in controls_for(cid, tr, cmap)})
    ar_findings = []
    for cid in sorted(by_control):
        pairs = sorted(set(by_control[cid]))
        ar_findings.append({
            "uuid": uid("finding", run, cid),
            "title": f"{cid.upper()}: not satisfied",
            "description": f"{len(pairs)} failing finding(s) from the validation kit map to {cid.upper()} this run.",
            "target": {"type": "objective-id", "target-id": f"{cid}_obj",
                       "status": {"state": "not-satisfied", "reason": "fail"}},
            "related-observations": [{"observation-uuid": o} for o in sorted({p[0] for p in pairs})],
            "related-risks": [{"risk-uuid": r} for r in sorted({p[1] for p in pairs})],
        })

    prev = report["previous"]["run_id"] if report["previous"] else None
    title_run = f"validation kit run {run}"
    result: dict[str, Any] = {
        "uuid": uid("result", run),
        "title": f"Drift pipeline results: {title_run}",
        "description": (f"Read-only validation kit run compared with {prev or 'no earlier run (baseline)'}. "
                        f"Counts: {json.dumps(report['counts'], sort_keys=True)}.{mode_note}"),
        "start": as_of,
        "props": [prop("source", "examples/drift-pipeline"), prop("illustrative", "true")],
        "reviewed-controls": {"control-selections": [{"include-controls": [{"control-id": c} for c in reviewed]}]},
        "observations": observations + closed_obs + unverified_obs,
        "risks": risks + closed_risks,
        "findings": ar_findings,
    }
    ar = {"assessment-results": {
        "uuid": uid("assessment-results", run),
        "metadata": _metadata(ctx, f"Assessment results: {title_run}"),
        "import-ap": {"href": ap_href},
        "results": [result],
        "back-matter": back,
    }}
    poam = {"plan-of-action-and-milestones": {
        "uuid": uid("poam", run),
        "metadata": _metadata(ctx, f"Plan of action and milestones: {title_run}"),
        "import-ssp": {"href": ssp_href},
        "observations": observations + closed_obs,
        "risks": risks + closed_risks,
        "poam-items": items + closed_items,
        "back-matter": back,
    }}
    return {"assessment-results": ar, "poam": poam}


# ---------------------------------------------------------------- validation

def validate_document(doc: dict[str, Any]) -> list[str]:
    """Errors from NIST's JSON schema for the document's model; empty when valid. Needs jsonschema and regex."""
    import jsonschema          # third-party, only for validation
    import regex
    from jsonschema import validators

    root = next(iter(doc))
    if root not in SCHEMAS:
        return [f"no pinned schema for the root '{root}'"]
    schema = json.loads(SCHEMAS[root].read_text(encoding="utf-8"))

    def unicode_pattern(validator, pattern, instance, _schema):      # \p{L} isn't valid in Python's re
        if isinstance(instance, str) and not regex.search(pattern, instance):
            yield jsonschema.ValidationError(f"{instance!r} does not match {pattern!r}")

    v = validators.extend(jsonschema.Draft7Validator, {"pattern": unicode_pattern})
    return [f"{'/'.join(str(p) for p in e.absolute_path)}: {e.message[:200]}" for e in v(schema).iter_errors(doc)]


# ---------------------------------------------------------------- command line

def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("export", help="write assessment-results.json and poam.json")
    e.add_argument("--package", type=Path, required=True, help="an evidence package folder (<evidence-dir>/<run-id>)")
    e.add_argument("--out", type=Path, required=True)
    e.add_argument("--acceptances", type=Path, help="the acceptance register (fmp-acceptances/1)")
    e.add_argument("--control-map", type=Path, help="check-to-control map (default: data/check-controls.json)")
    e.add_argument("--include-names", action="store_true", help="put object names in titles and descriptions")
    e.add_argument("--due-days", type=int, default=30, help="days from the run to the deadline on an open item (an assumption; default 30)")
    e.add_argument("--ssp-href", default="ssp.json")
    e.add_argument("--ap-href", default="assessment-plan.json")
    v = sub.add_parser("validate", help="check OSCAL files against the pinned NIST schemas")
    v.add_argument("files", type=Path, nargs="+")
    args = ap.parse_args(argv)
    try:
        if args.cmd == "export":
            docs = build(args.package, load_acceptances(args.acceptances), load_control_map(args.control_map),
                         include_names=args.include_names, due_days=args.due_days, ssp_href=args.ssp_href, ap_href=args.ap_href)
            dp.write_text(args.out / "assessment-results.json", dp.dump_json(docs["assessment-results"]))
            dp.write_text(args.out / "poam.json", dp.dump_json(docs["poam"]))
            counts: dict[str, int] = {}
            for it in docs["poam"]["plan-of-action-and-milestones"]["poam-items"]:
                d = next(p["value"] for p in it["props"] if p["name"] == "disposition")
                counts[d] = counts.get(d, 0) + 1
            print(json.dumps({"oscal_version": OSCAL_VERSION, "poam_items": counts}, sort_keys=True))
            return dp.EXIT_OK
        bad = 0
        for f in args.files:
            errs = validate_document(dp.read_json(f))
            print(f"{f}: {'valid' if not errs else str(len(errs)) + ' error(s)'}")
            for er in errs[:20]:
                print("  " + er)
            bad += bool(errs)
        return dp.EXIT_ERROR if bad else dp.EXIT_OK
    except (dp.DriftError, OSError, ValueError, KeyError, ImportError) as err:
        print(f"error: {err}", file=sys.stderr)
        return dp.EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
