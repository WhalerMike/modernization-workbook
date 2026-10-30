"""Offline checks for a GitHub Actions workflow that signs in to Azure with a federated credential.

Reads the workflow as YAML and never runs it. The rules come from Learn's Azure Login page, the
pinned Azure Login action.yml, Learn's federated credential pages, and GitHub's documentation
for what Learn doesn't cover (schedule, OIDC claims, pinning). Rules marked design guidance are
the program's positions.

    python workflow_lint.py <workflow.yml> [--learn-samples]

Exit codes: 0 no findings (warnings allowed), 2 findings, 1 error.
Illustrative: unit-tested against fixtures, not proven against a live tenant.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from drift_pipeline import CLOUDS  # noqa: E402

HERE = Path(__file__).resolve().parent
THIRD_PARTY = HERE.parents[1] / "third_party"
ACTION_YML = THIRD_PARTY / "azure-login-action" / "action.yml"
ACTION_SNAPSHOT = THIRD_PARTY / "azure-login-action" / "snapshot.json"
LEARN_PAGE = THIRD_PARTY / "azure-login-oidc-sample" / "connect-from-azure-openid-connect.md"

SHA = re.compile(r"^[0-9a-f]{40}$")
WRITE_SCOPES_OK_WITH_OIDC = {"id-token"}
AUDIENCE_BY_ENVIRONMENT = {   # Learn: "Configure an application to trust a managed identity" (audiences)
    "azurecloud": "api://AzureADTokenExchange",
    "azureusgovernment": "api://AzureADTokenExchangeUSGov",
    "azurechinacloud": "api://AzureADTokenExchangeChina",
}


def finding(rule: str, severity: str, where: str, issue: str) -> dict[str, str]:
    return {"rule": rule, "severity": severity, "where": where, "issue": issue}


def action_inputs(path: Path = ACTION_YML) -> dict[str, Any]:
    return yaml.safe_load(path.read_text(encoding="utf-8"))["inputs"]


def pinned_major(path: Path = ACTION_SNAPSHOT) -> int:
    release = json.loads(path.read_text(encoding="utf-8"))["release"]
    return int(re.match(r"v(\d+)", release).group(1))


def learn_samples(path: Path = LEARN_PAGE) -> list[str]:
    """The YAML blocks of Learn's page, as published (one string each)."""
    text = path.read_text(encoding="utf-8")
    return re.findall(r"```yaml[ \t]*\r?\n(.*?)```", text, re.S)


def _triggers(doc: dict[Any, Any]) -> list[str]:
    on = doc.get("on", doc.get(True))      # YAML 1.1 reads a bare `on` key as true
    if isinstance(on, str):
        return [on]
    if isinstance(on, list):
        return [str(x) for x in on]
    if isinstance(on, dict):
        return [str(k) for k in on]
    return []


def _permissions(block: Any) -> dict[str, str]:
    if block is None:
        return {}
    if isinstance(block, str):           # read-all / write-all
        return {"*": block.split("-")[0]}
    return {str(k): str(v) for k, v in block.items()}


def lint_text(text: str, inputs: dict[str, Any] | None = None, major: int | None = None) -> list[dict[str, str]]:
    inputs = inputs if inputs is not None else action_inputs()
    major = major if major is not None else pinned_major()
    try:
        doc = yaml.safe_load(text)
    except yaml.YAMLError as err:
        first = str(err).splitlines()[0]
        return [finding("WF-01", "Finding", "file", f"Not valid YAML ({first}); a workflow file that doesn't parse can't run")]
    if not isinstance(doc, dict) or "jobs" not in doc:
        return [finding("WF-01", "Finding", "file", "No jobs: a fragment, not a workflow")]
    out: list[dict[str, str]] = []
    triggers = _triggers(doc)
    if not triggers:
        out.append(finding("WF-01", "Finding", "on", "No trigger: a fragment, not a workflow"))
    elif "schedule" not in triggers:
        out.append(finding("WF-02", "Finding", "on", f"No schedule trigger (triggers: {', '.join(triggers)}): drift checks must run without a person"))
    if "permissions" not in doc:
        out.append(finding("WF-03", "Warn", "permissions", "No workflow-level permissions block: a job without its own block gets the repository's default token permissions"))
    elif any(v == "write" for v in _permissions(doc["permissions"]).values()):
        out.append(finding("WF-03", "Finding", "permissions", "Workflow-level permissions grant write; grant per job instead"))
    if "concurrency" not in doc:
        out.append(finding("WF-11", "Warn", "concurrency", "No concurrency group: a slow run and the next scheduled run can overlap and compare against each other"))
    env = doc.get("env") or {}
    cloud = str(env.get("CLOUD", "")).lower() or None
    if cloud and cloud not in CLOUDS:
        out.append(finding("WF-12", "Finding", "env.CLOUD", f"Unknown cloud {cloud!r}"))
        cloud = None
    if cloud and env.get("GRAPH_HOST") and env["GRAPH_HOST"].rstrip("/") != CLOUDS[cloud]["graph"]:
        out.append(finding("WF-12", "Finding", "env.GRAPH_HOST", f"{env['GRAPH_HOST']} isn't the Graph host for {cloud} ({CLOUDS[cloud]['graph']})"))

    for name, job in (doc.get("jobs") or {}).items():
        where = f"jobs.{name}"
        perms = _permissions(job.get("permissions"))
        if "permissions" not in job:
            out.append(finding("WF-03", "Warn", where, "No job-level permissions block"))
        steps = job.get("steps") or []
        logins = [s for s in steps if str(s.get("uses", "")).lower().startswith("azure/login@")]
        if perms.get("id-token") == "write":
            others = sorted(k for k, v in perms.items() if v == "write" and k not in WRITE_SCOPES_OK_WITH_OIDC)
            if others:
                out.append(finding("WF-04", "Finding", where, f"The job that can request an Azure token also has write on {', '.join(others)}; split it (design guidance)"))
        if logins and perms.get("id-token") != "write":
            out.append(finding("WF-04", "Finding", where, "azure/login with OIDC needs id-token: write on the job"))
        if logins and "environment" not in job:
            out.append(finding("WF-10", "Warn", where, "The job that signs in names no environment: the token's subject then depends on the branch or event, and a federated credential matches one subject exactly"))
        if "timeout-minutes" not in job:
            out.append(finding("WF-11", "Warn", where, "No timeout-minutes"))
        for i, step in enumerate(steps):
            sw = f"{where}.steps[{i}]"
            uses = str(step.get("uses", ""))
            with_ = step.get("with") or {}
            if uses and not uses.startswith("./"):
                ref = uses.split("@", 1)[1] if "@" in uses else ""
                if not SHA.match(ref):
                    out.append(finding("WF-05", "Finding", sw, f"{uses} isn't pinned to a full commit SHA"))
            for key in ("azcliversion", "azPSVersion"):
                if str(with_.get(key, "")).strip().lower() == "latest":
                    out.append(finding("WF-09", "Finding", sw, f"{key}: latest; the tool version changes under the evidence without a review"))
            if uses.lower().startswith("azure/login@"):
                ref = uses.split("@", 1)[1]
                m = re.match(r"v(\d+)", ref)
                if m and int(m.group(1)) < major:
                    out.append(finding("WF-08", "Finding", sw, f"{uses}: an older major version than the pinned release (v{major})"))
                for key in with_:
                    if key not in inputs:
                        out.append(finding("WF-06", "Finding", sw, f"azure/login has no input {key!r}"))
                if "creds" in with_:
                    out.append(finding("WF-06", "Finding", sw, "creds signs in with a client secret; use client-id and tenant-id with a federated credential"))
                if not with_.get("client-id") or not with_.get("tenant-id"):
                    out.append(finding("WF-06", "Finding", sw, "client-id and tenant-id are needed for OIDC sign-in"))
                env_name = str(with_.get("environment", inputs["environment"]["default"])).lower()
                audience = str(with_.get("audience", inputs["audience"]["default"]))
                expected = AUDIENCE_BY_ENVIRONMENT.get(env_name)
                if expected is None:
                    out.append(finding("WF-07", "Finding", sw, f"environment {env_name!r} isn't one this check knows"))
                elif "${{" not in audience and audience != expected:
                    out.append(finding("WF-07", "Finding", sw, f"audience {audience} doesn't match environment {env_name} (expected {expected})"))
                if cloud and "${{" not in env_name and env_name != CLOUDS[cloud]["azure_environment"].lower():
                    out.append(finding("WF-12", "Finding", sw, f"environment {env_name} isn't the Azure environment for {cloud} ({CLOUDS[cloud]['azure_environment']})"))
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Offline checks for an Azure sign-in workflow")
    ap.add_argument("workflow", nargs="?", type=Path)
    ap.add_argument("--learn-samples", action="store_true", help="lint the sample workflows in the pinned Learn page")
    args = ap.parse_args(argv)
    try:
        if args.learn_samples:
            texts = [(f"Learn sample {n}", t) for n, t in enumerate(learn_samples(), start=1)]
        elif args.workflow:
            texts = [(str(args.workflow), args.workflow.read_text(encoding="utf-8"))]
        else:
            ap.error("name a workflow or --learn-samples")
        bad = 0
        for label, text in texts:
            results = lint_text(text)
            print(f"{label}: {sum(r['severity'] == 'Finding' for r in results)} finding(s), {sum(r['severity'] == 'Warn' for r in results)} warning(s)")
            for r in results:
                print(f"  {r['severity']:<7} {r['rule']}  {r['where']}: {r['issue']}")
            bad += sum(r["severity"] == "Finding" for r in results)
        return 2 if bad else 0
    except (OSError, KeyError, ValueError) as err:
        print(f"error: {err}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
