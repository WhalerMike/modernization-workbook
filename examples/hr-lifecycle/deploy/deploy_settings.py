"""One environment settings file for the deployment runbook: load it, check it, and write the
middleware's settings from it.

The same commands run against the test tenant and the production tenant; only the settings file
changes. The file holds names and IDs, never a secret: certificates for the integration identities
stay in a key vault, and tokens live only in environment variables for the length of a step.

    python deploy/deploy_settings.py check --settings deploy/settings.test.json
    python deploy/deploy_settings.py middleware --settings deploy/settings.test.json --app employee --out evidence/test/middleware-employee.json
    python deploy/deploy_settings.py record-workflows --settings deploy/settings.test.json --ids evidence/test/workflow-ids.json
    python deploy/deploy_settings.py get --settings deploy/settings.test.json identities.keyVault

Illustrative: unit-tested against fixtures, not run against a live tenant. Standard library only.
Exit codes: 0 clean, 2 findings, 1 error or refusal.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
KIT = HERE.parent
sys.path.insert(0, str(KIT / "python"))
from hrlc_core import (  # noqa: E402
    EXIT_ERROR, HrlcError, cloud, dump_json, exit_code, finding, read_json, sort_findings,
    summary_line, write_text,
)

SCHEMA = "fmp-hrlc-deploy/1"
ENVIRONMENTS = ("test", "production")
APPS = ("employee", "contractor")
WORKFLOW_KEYS = ("pre-hire", "day-one", "mover", "leaver", "post-leaver", "contractor-leaver")  # config/workflows stems
# The same key pattern examples/hcm-entra refuses in its settings, plus values that are secrets.
SECRET_KEY = re.compile(r"(secret|password|passwd|token|credential|private|apikey|api_key|bearer)", re.I)
SECRET_VALUE = re.compile(r"(^eyJ[A-Za-z0-9_-]{10,}\.|-----BEGIN [A-Z ]*(PRIVATE KEY|CERTIFICATE)-----)")
PLACEHOLDER = re.compile(r"<[a-z0-9-]+>")
# Directory roles the runbook needs, by Learn's template ID ("Microsoft Entra built-in roles").
ROLE_TEMPLATES = {
    "Application Administrator": "9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3",
    "Hybrid Identity Administrator": "8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2",
    "Lifecycle Workflows Administrator": "59d46f88-662b-457b-bceb-5c3809e5908f",
    "Identity Governance Administrator": "45d8d3c5-c802-45c6-b32a-1d70b5e1e86e",
    "Authentication Policy Administrator": "0526716b-113d-4c15-b2c8-68e3c22b9f80",
    "User Administrator": "fe930be7-5e62-47db-91af-98c3a49a38b1",  # the test stage's rollback removes smoke accounts
}
# Graph PowerShell -Environment name per cloud (Learn, "Authentication module cmdlets").
MG_ENVIRONMENT = {"gcc": "Global", "gcchigh": "USGov", "dod": "USGovDoD"}
# Azure CLI cloud per tenant cloud (Learn, "Connect to Azure Government with Azure CLI"). A GCC tenant is a
# commercial Entra tenant, so its key vault sits in a commercial subscription (the guide's inference).
AZURE_CLOUD = {"gcc": "AzureCloud", "gcchigh": "AzureUSGovernment", "dod": "AzureUSGovernment"}


def load(path: Path) -> dict[str, Any]:
    data = read_json(Path(path))
    if not isinstance(data, dict) or data.get("schema") != SCHEMA:
        raise HrlcError(f"{path} is not a deployment settings file (schema {SCHEMA})")
    return data


def _walk(obj: Any, path: str = ""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from _walk(v, f"{path}.{k}" if path else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from _walk(v, f"{path}[{i}]")
    else:
        yield path, obj


def check(settings: dict[str, Any]) -> list[dict[str, Any]]:
    """DS-01 to DS-05: no secrets, nothing left as a placeholder, a known environment and cloud, a
    change record for production, and every ID the runbook reads."""
    rows: list[dict[str, Any]] = []
    for path, value in _walk(settings):
        leaf = path.split(".")[-1].split("[")[0]
        if leaf.startswith("_"):
            continue
        if SECRET_KEY.search(leaf):
            rows.append(finding("DS-01", "Finding", path, path, "a key that looks like a secret; secrets never go in the settings file"))
        if isinstance(value, str) and SECRET_VALUE.search(value.strip()):
            rows.append(finding("DS-01", "Finding", path, path, "a value that looks like a token, key or certificate; keep it in the key vault"))
        if isinstance(value, str) and PLACEHOLDER.search(value):
            rows.append(finding("DS-02", "Finding", path, path, f"still a placeholder: {value}"))
    env = settings.get("environment")
    if env not in ENVIRONMENTS:
        rows.append(finding("DS-03", "Finding", "environment", "environment", f"environment must be test or production, not {env!r}"))
    try:
        cloud(settings.get("cloud"))
    except HrlcError as e:
        rows.append(finding("DS-03", "Finding", "cloud", "cloud", str(e)))
    if env == "production" and not str(settings.get("changeRecord", "")).strip():
        rows.append(finding("DS-04", "Finding", "changeRecord", "changeRecord", "production needs an approved change record"))
    for app in APPS:
        job = settings.get("provisioning", {}).get(app, {})
        for key in ("servicePrincipalId", "jobId"):
            if not job.get(key):
                rows.append(finding("DS-05", "Finding", f"provisioning.{app}.{key}", app, f"no {key} for the {app} provisioning app"))
    for key in WORKFLOW_KEYS:
        if not settings.get("workflows", {}).get(key):
            rows.append(finding("DS-05", "Finding", f"workflows.{key}", key, f"no workflow ID for {key}"))
    for name in settings.get("roles", []):
        if name not in ROLE_TEMPLATES:
            rows.append(finding("DS-05", "Finding", f"roles.{name}", name, "not a role this runbook knows the template ID for"))
    return sort_findings(rows)


def endpoint(settings: dict[str, Any], app: str) -> str:
    """The provisioning app's /bulkUpload URL on the cloud's Graph host, built from the IDs."""
    if app not in APPS:
        raise HrlcError(f"app must be one of {', '.join(APPS)}")
    job = settings["provisioning"][app]
    host = cloud(settings["cloud"])["graph"]
    return f"https://{host}/v1.0/servicePrincipals/{job['servicePrincipalId']}/synchronization/jobs/{job['jobId']}/bulkUpload"


def middleware_settings(settings: dict[str, Any], app: str, example: Path) -> dict[str, Any]:
    """examples/hcm-entra's settings.example.json with this environment's endpoint in it."""
    out = read_json(example)
    out["endpoint"] = endpoint(settings, app)
    out["_comment"] = (f"Written by deploy/deploy_settings.py for the {settings['environment']} environment, "
                       f"{app} app. Non-secret settings only.")
    return out


def record_workflows(path: Path, ids: dict[str, str]) -> dict[str, Any]:
    """Put the IDs of the workflows a stage created (file stem to ID) into the settings file."""
    settings = load(path)
    unknown = sorted(set(ids) - set(WORKFLOW_KEYS))
    if unknown:
        raise HrlcError(f"not a workflow this runbook deploys: {', '.join(unknown)}")
    settings.setdefault("workflows", {}).update(ids)
    write_text(path, dump_json_ordered(settings))
    return settings


def dump_json_ordered(obj: Any) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def get(settings: dict[str, Any], key: str) -> str:
    """One value for a shell command: a dotted path in the file, or a value derived from the cloud."""
    derived = {
        "graphResource": lambda: "https://" + cloud(settings["cloud"])["graph"],
        "azureCloud": lambda: AZURE_CLOUD[cloud(settings["cloud"])["name"]],
        "mgEnvironment": lambda: MG_ENVIRONMENT[cloud(settings["cloud"])["name"]],
    }
    if key in derived:
        return derived[key]()
    value: Any = settings
    for part in key.split("."):
        if not isinstance(value, dict) or part not in value:
            raise HrlcError(f"no {key} in the settings file")
        value = value[part]
    if isinstance(value, (dict, list)):
        raise HrlcError(f"{key} isn't a single value")
    return str(value)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check", help="check the settings file (DS-01 to DS-05)")
    c.add_argument("--settings", type=Path, required=True)
    m = sub.add_parser("middleware", help="write examples/hcm-entra settings for one provisioning app")
    m.add_argument("--settings", type=Path, required=True)
    m.add_argument("--app", required=True, choices=APPS)
    m.add_argument("--example", type=Path, default=KIT.parent / "hcm-entra" / "config" / "settings.example.json")
    m.add_argument("--out", type=Path, required=True)
    r = sub.add_parser("record-workflows", help="put created workflows' IDs (file stem to ID, JSON) into the settings file")
    r.add_argument("--settings", type=Path, required=True)
    r.add_argument("--ids", type=Path, required=True)
    g = sub.add_parser("get", help="print one value: a dotted path, or graphResource, azureCloud, mgEnvironment")
    g.add_argument("--settings", type=Path, required=True)
    g.add_argument("key")
    args = ap.parse_args(argv)
    try:
        if args.cmd == "record-workflows":
            s = record_workflows(args.settings, read_json(args.ids))
            print(f"Recorded {len(read_json(args.ids))} workflow IDs in {args.settings.as_posix()}")
            return exit_code(check(s))
        s = load(args.settings)
        if args.cmd == "get":
            print(get(s, args.key))
            return 0
        rows = check(s)
        if args.cmd == "check":
            for r in rows:
                print(f"{r['Rule']} {r['Severity']} {r['Object']}: {r['Issue']}")
            print(summary_line(f"Settings {args.settings.name} ({s.get('environment')}, {s.get('cloud')})", rows))
            return exit_code(rows)
        if rows:
            raise HrlcError(f"the settings file has {len(rows)} findings; run check first")
        if args.out.exists():
            raise HrlcError(f"{args.out} exists; write each environment's middleware settings once")
        write_text(args.out, dump_json(middleware_settings(s, args.app, args.example)))
        print(f"Middleware settings for {args.app} written to {args.out.as_posix()}: {endpoint(s, args.app)}")
        return 0
    except (HrlcError, ValueError, KeyError, OSError) as e:
        print(f"error: {e}", file=sys.stderr)
        return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())
