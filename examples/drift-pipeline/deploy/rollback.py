"""Record each change a deployment stage makes, and write the rollback for them, newest first.

Book 19, Chapter 10. Every step in the runbook that changes something records it with `add`, in the stage's
deploy-record.json. `plan` reads the record and writes the rollback as scripts the operator reviews and runs
in a signed-in session; it changes nothing itself, which is its dry run:

  rollback-cloud.ps1   Microsoft Graph, Azure and Azure CLI steps, signed in with the deployment identity's
                       certificate (the sign-in lines come from the settings file; no secret is written);
  rollback-ad.ps1      Group Policy steps, for an administrator with Link GPOs permission on the OU;
  rollback-manual.md   steps that run on a server or in an admin center, with the exact path.

The rollback follows the implementation guide's rule: re-enable, never re-create. In production a dynamic
group is paused rather than deleted, a workflow disabled, a GPO link re-enabled (or disabled again), and a
locked retention policy is reported as something that can't be rolled back. In the test stage the objects
the stage created are removed.

Illustrative: unit-tested against fixtures, not run against a live tenant. Standard library only.

    python deploy/rollback.py add  --settings <file> --kind <kind> --id <id> [--name <name>] [--note <text>]
    python deploy/rollback.py plan --settings <file> [--out <dir>]
    python deploy/rollback.py kinds

Exit codes: 0 written, 1 refused (an unknown kind, a record from another stage or change record).
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
from pathlib import Path
from typing import Any, Callable

sys.path.insert(0, str(Path(__file__).resolve().parent))

import adm_deploy as ad  # noqa: E402
import evidence as ev  # noqa: E402

RECORD_SCHEMA = "adm-deploy-record/1"
EXIT_OK, EXIT_ERROR = 0, 1


class RecordError(Exception):
    """A deploy record the rollback refuses to use."""


Step = tuple[str, str]  # (where: cloud | ad | server | portal | none, command or instruction)


def _q(v: str) -> str:
    return "'" + str(v).replace("'", "''") + "'"


def k_provisioning_job(e: dict, s: dict) -> list[Step]:
    sp, job = s["hcm_entra"]["provisioning_app_object_id"], e["id"]
    return [("cloud", f"Invoke-MgGraphRequest -Method POST -Uri {_q(f'/v1.0/servicePrincipals/{sp}/synchronization/jobs/{job}/pause')}")]


def k_hr_batch(e: dict, s: dict) -> list[Step]:
    steps = [("cloud", "Invoke-MgGraphRequest -Method POST -Uri "
              + _q(f"/v1.0/servicePrincipals/{s['hcm_entra']['provisioning_app_object_id']}/synchronization/jobs/"
                   f"{s['hcm_entra']['provisioning_job_id']}/pause"))]
    if s["environment"] == "test":
        steps.append(("server", f"From examples/hcm-entra, send the batch's records again as leavers (Chapter 01, Lab 2, "
                                f"step 7) using the extract recorded in {e['id']}"))
    else:
        steps.append(("none", f"Correct the records at the HR source, never in the directory (guide, Gate 2); batch {e['id']}"))
    return steps


def k_dynamic_group(e: dict, s: dict) -> list[Step]:
    if s["environment"] == "test":
        return [("cloud", f"Remove-MgGroup -GroupId {_q(e['id'])}")]
    return [("cloud", f"Update-MgGroup -GroupId {_q(e['id'])} -MembershipRuleProcessingState 'Paused'")]


def k_lcw_workflow(e: dict, s: dict) -> list[Step]:
    steps = [("cloud", f"Update-MgIdentityGovernanceLifecycleWorkflow -WorkflowId {_q(e['id'])} "
                       "-BodyParameter @{ isEnabled = $false; isSchedulingEnabled = $false }")]
    if s["environment"] == "test":
        steps.append(("cloud", f"Remove-MgIdentityGovernanceLifecycleWorkflow -WorkflowId {_q(e['id'])}"))
    return steps


def k_gpo_link_created(e: dict, s: dict) -> list[Step]:
    return [("ad", f"Set-GPLink -Name {_q(e['id'])} -Target {_q(e['name'])} -LinkEnabled No "
                   f"-Domain {_q(s['group_policy']['ad_domain'])}")]


def k_gpo_link_disabled(e: dict, s: dict) -> list[Step]:
    return [("ad", f"Set-GPLink -Name {_q(e['id'])} -Target {_q(e['name'])} -LinkEnabled Yes "
                   f"-Domain {_q(s['group_policy']['ad_domain'])}")]


def k_intune_policy(e: dict, s: dict) -> list[Step]:
    if s["environment"] == "test":
        return [("cloud", f"Invoke-MgGraphRequest -Method DELETE -Uri {_q('/beta/deviceManagement/configurationPolicies/' + e['id'])}")]
    return [("portal", f"Intune admin center > Devices > Manage devices > Configuration > {e.get('name') or e['id']} > "
                       "Properties > Assignments > Edit: remove the wave's group, Review + Save, Save")]


def k_policy_assignment(e: dict, s: dict) -> list[Step]:
    return [("cloud", f"Remove-AzPolicyAssignment -Name {_q(e['id'])} -Scope {_q(e['name'])}")]


def k_policy_definition(e: dict, s: dict) -> list[Step]:
    if s["environment"] == "test":
        return [("cloud", f"Remove-AzPolicyDefinition -Name {_q(e['id'])} -Force")]
    return [("none", f"Keep policy definition {e['id']}: production keeps the definition and removes its assignment")]


def k_role_assignment(e: dict, s: dict) -> list[Step]:
    return [("cloud", f"az role assignment delete --ids {_q(e['id'])}")]


def k_arc_server(e: dict, s: dict) -> list[Step]:
    return [("server", f"On {e['id']}: sudo azcmagent disconnect (needs an identity that can delete the Arc resource; "
                       "Chapter 08, Lab 2, step 7)")]


def k_federated_credential(e: dict, s: dict) -> list[Step]:
    return [("cloud", f"az ad app federated-credential delete --id {_q(e['name'])} --federated-credential-id {_q(e['id'])}")]


def k_retention_policy(e: dict, s: dict) -> list[Step]:
    if e.get("note", "").lower().startswith("locked"):
        return [("none", f"Locked retention policy on {e['id']} can't be deleted or shortened: no rollback (Chapter 09)")]
    acct, cont = e["name"], e["id"]
    return [("cloud", f"$etag = az storage container immutability-policy show --account-name {_q(acct)} "
                      f"--container-name {_q(cont)} --query etag --output tsv"),
            ("cloud", f"az storage container immutability-policy delete --account-name {_q(acct)} "
                      f"--container-name {_q(cont)} --if-match $etag")]


KINDS: dict[str, tuple[str, Callable[[dict, dict], list[Step]]]] = {
    "provisioning-job": ("the API-driven provisioning job started for this stage", k_provisioning_job),
    "hr-batch": ("a batch the HR middleware sent (id: its provenance.json)", k_hr_batch),
    "dynamic-group": ("a dynamic group created from the rule library", k_dynamic_group),
    "lcw-workflow": ("a Lifecycle Workflows workflow", k_lcw_workflow),
    "gpo-link-created": ("a GPO link this stage created (id: GPO name, name: OU)", k_gpo_link_created),
    "gpo-link-disabled": ("a GPO link this stage disabled at cut-over (id: GPO name, name: OU)", k_gpo_link_disabled),
    "intune-policy": ("a settings catalog policy created or assigned (id: policy ID, name: policy name)", k_intune_policy),
    "policy-assignment": ("an Azure Policy assignment (id: its name, name: its scope)", k_policy_assignment),
    "policy-definition": ("an Azure Policy definition (id: its name)", k_policy_definition),
    "role-assignment": ("an Azure role assignment (id: its resource ID)", k_role_assignment),
    "arc-server": ("a server connected to Azure Arc (id: its name)", k_arc_server),
    "federated-credential": ("a federated credential (id: its name, name: the app's object ID)", k_federated_credential),
    "retention-policy": ("a container retention policy (id: container, name: account; note 'locked' once locked)",
                         k_retention_policy),
}


# The runbook step whose evidence a recorded change belongs to (deploy/requirements.json); --step overrides.
KIND_STEP = {"provisioning-job": "hr", "hr-batch": "hr", "dynamic-group": "rules", "lcw-workflow": "lcw",
             "gpo-link-created": "gpo", "gpo-link-disabled": "gpo", "intune-policy": "gpo",
             "policy-assignment": "mc", "policy-definition": "mc", "role-assignment": "mc", "arc-server": "arc",
             "federated-credential": "drift", "retention-policy": "drift"}


def record_path(s: dict, settings_path: Path) -> Path:
    return Path(ad.derived(s, settings_path)["ADM_EVIDENCE_DIR"]) / "deploy-record.json"


def load_record(path: Path) -> dict[str, Any]:
    path = Path(path)
    if not path.is_file():
        raise RecordError(f"{path}: no deploy record")
    rec = json.loads(path.read_text(encoding="utf-8"))
    if rec.get("schema") != RECORD_SCHEMA or not isinstance(rec.get("entries"), list):
        raise RecordError(f"{path}: not a deploy record ({RECORD_SCHEMA})")
    return rec


def add(s: dict, settings_path: Path, kind: str, ident: str, name: str = "", note: str = "",
        when: str | None = None) -> Path:
    if kind not in KINDS:
        raise RecordError(f"unknown kind {kind!r}; run 'rollback.py kinds'")
    path = record_path(s, settings_path)
    rec = load_record(path) if path.is_file() else {"schema": RECORD_SCHEMA, "entries": []}
    rec["entries"].append({
        "seq": len(rec["entries"]) + 1, "kind": kind, "id": ident, "name": name, "note": note,
        "environment": s["environment"], "change_record": s["change_record"],
        "recorded_at": when or dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(rec, indent=2) + "\n", encoding="utf-8", newline="\n")
    return path


def plan(s: dict, record: dict) -> list[dict[str, Any]]:
    """The rollback steps, newest change first."""
    out = []
    for e in sorted(record["entries"], key=lambda x: x["seq"], reverse=True):
        if e["environment"] != s["environment"] or e["change_record"] != s["change_record"]:
            raise RecordError(f"entry {e['seq']} is {e['environment']}/{e['change_record']}; "
                              f"the settings are {s['environment']}/{s['change_record']}")
        if e["kind"] not in KINDS:
            raise RecordError(f"entry {e['seq']}: no rollback for kind {e['kind']!r}")
        for where, cmd in KINDS[e["kind"]][1](e, s):
            out.append({"seq": e["seq"], "kind": e["kind"], "where": where, "step": cmd})
    return out


def cloud_preamble(s: dict) -> list[str]:
    c = ad.dp.cloud_profile(s["cloud"])
    d = s["identities"]["deploy"]
    return [
        "#Requires -Version 7.2",
        f"# Rollback for {s['environment']} / {s['change_record']}, written by deploy/rollback.py. Review before running.",
        "$ErrorActionPreference = 'Stop'",
        f"Connect-MgGraph -ClientId {_q(d['client_id'])} -TenantId {_q(s['tenant_id'])} "
        f"-CertificateThumbprint {_q(d['certificate_thumbprint'])} -Environment {_q(c['mg_environment'])} -NoWelcome",
        f"Connect-AzAccount -ServicePrincipal -ApplicationId {_q(d['client_id'])} -Tenant {_q(s['tenant_id'])} "
        f"-CertificateThumbprint {_q(d['certificate_thumbprint'])} -Environment {_q(c['azure_environment'])} "
        f"-Subscription {_q(s['subscription_id'])} | Out-Null",
        f"az cloud set --name {_q(c['azure_environment'])}",
        f"az login --service-principal --username {_q(d['client_id'])} --certificate {_q(d['certificate_pem'])} "
        f"--tenant {_q(s['tenant_id'])} --output none",
        f"az account set --subscription {_q(s['subscription_id'])}",
    ]


def write_plan(s: dict, steps: list[dict[str, Any]], out: Path) -> dict[str, Path]:
    out.mkdir(parents=True, exist_ok=True)
    cloud = cloud_preamble(s)
    adl = ["#Requires -Version 5.1", f"# Rollback (Group Policy) for {s['environment']} / {s['change_record']}. "
           "Run as an administrator with Link GPOs permission on the OU.", "$ErrorActionPreference = 'Stop'",
           "Import-Module GroupPolicy"]
    manual = [f"# Manual rollback steps for {s['environment']} / {s['change_record']}", ""]
    for st in steps:
        line = f"# [{st['seq']}] {st['kind']}"
        if st["where"] == "cloud":
            cloud += [line, st["step"]]
        elif st["where"] == "ad":
            adl += [line, st["step"]]
        else:
            manual.append(f"- [{st['seq']}] {st['kind']} ({st['where']}): {st['step']}")
    files = {"cloud": out / "rollback-cloud.ps1", "ad": out / "rollback-ad.ps1", "manual": out / "rollback-manual.md"}
    for key, lines in (("cloud", cloud), ("ad", adl), ("manual", manual)):
        files[key].write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    return files


def _rel(path: Path) -> str:
    try:
        return os.path.relpath(path).replace(os.sep, "/")
    except ValueError:
        return str(path)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("add", help="record one change")
    a.add_argument("--settings", required=True, type=Path)
    a.add_argument("--kind", required=True)
    a.add_argument("--id", required=True)
    a.add_argument("--name", default="")
    a.add_argument("--note", default="")
    a.add_argument("--step", help="the runbook step this change belongs to (default from the kind)")
    p = sub.add_parser("plan", help="write the rollback scripts; runs nothing")
    p.add_argument("--settings", required=True, type=Path)
    p.add_argument("--out", type=Path, help="default: the stage's evidence folder")
    sub.add_parser("kinds", help="list the kinds of change the rollback knows")
    args = ap.parse_args(argv)
    if args.cmd == "kinds":
        for k, (desc, _) in KINDS.items():
            print(f"{k:<22} {desc}")
        return EXIT_OK
    try:
        s = ad.load_settings(args.settings)
        if args.cmd == "add":
            path = add(s, args.settings, args.kind, args.id, args.name, args.note)
            step = args.step or KIND_STEP[args.kind]
            rec = ev.add(s, args.settings, step, f"rollback.py add --kind {args.kind} --id {args.id}", "recorded",
                         details={"kind": args.kind, "id": args.id, "name": args.name, "note": args.note})
            print(f"recorded {args.kind} {args.id} in {_rel(path)}; evidence {rec.name}")
            return EXIT_OK
        rec_path = record_path(s, args.settings)
        steps = plan(s, load_record(rec_path))
        files = write_plan(s, steps, args.out or rec_path.parent)
        rec = ev.add(s, args.settings, "rollback", "rollback.py plan", "recorded", list(files.values()) + [rec_path],
                     {"steps": len(steps)})
    except (ad.SettingsError, RecordError, ev.EvidenceError, OSError, json.JSONDecodeError) as exc:
        print(f"refused: {exc}", file=sys.stderr)
        return EXIT_ERROR
    for st in steps:
        print(f"[{st['seq']}] {st['kind']:<18} {st['where']:<6} {st['step']}")
    counts = {w: sum(st["where"] == w for st in steps) for w in ("cloud", "ad", "server", "portal", "none")}
    print(f"rollback plan: {len(steps)} step(s), newest first: " + ", ".join(f"{v} {k}" for k, v in counts.items() if v))
    for key, path in files.items():
        print(f"wrote {_rel(path)}")
    print(f"evidence {rec.name}: rollback plan recorded")
    print("nothing was run: review the scripts, then run them in a signed-in session")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
