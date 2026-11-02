"""Shared pieces for the deployment runbook's scripts (preflight, render, smoke test, rollback).

Illustrative code: unit-tested against fixtures and a fake HTTP session, not
yet run against a live ServiceNow instance or SailPoint tenant.

One environment settings file drives every script. It holds endpoints and
names, never a secret: kit_common.load_config refuses a secret key in a file,
and credentials come from environment variables filled from the vault. The
same commands run against the test stage and production; only the settings
file changes (deploy/environment.example.json is the template).

Three run modes, the same in every script:

  live         the default: real calls, with credentials from the environment;
  --dry-run    no network: the offline checks run and the calls are listed;
  --fixtures   the calls are answered from a saved file (tests, and the
               runbook chapter's printed output), with the file's "env"
               standing in for the environment.

Run directly, it prints one value from a settings file, so the runbook's
commands read client IDs and endpoints from the file instead of retyping them:

  python deploy/deploy_common.py deploy/environment.test.json deploy.clients.evidence_reader
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Mapping
from urllib.parse import urlsplit

KIT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(KIT / "clients" / "python"))

import kit_calls as kcalls  # noqa: E402
import kit_common as kc  # noqa: E402

ENVIRONMENTS = ("test", "production")
PLACEHOLDER = re.compile(r"<[^<>]+>|REPLACE")
# Endpoint keys a stray environment variable could silently override (kit_common lets the
# environment win over a file), sending test commands to production or the reverse.
ENDPOINT_KEYS = ("SN_INSTANCE", "SN_BASE_URL", "SAILPOINT_TENANT", "SAILPOINT_API_BASE")
# Credentials, read from the environment only.
CREDENTIAL_KEYS = ("SN_CLIENT_ID", "SN_CLIENT_SECRET", "SN_ACCESS_TOKEN", "SN_USERNAME", "SN_PASSWORD",
                   "SAILPOINT_CLIENT_ID", "SAILPOINT_CLIENT_SECRET", "SAILPOINT_ACCESS_TOKEN")
# Each integration identity in the settings file's "granted" block, and the kit tasks whose
# least privilege it must hold exactly: (system, [tasks]).
IDENTITIES = {
    "finding_writer": ("servicenow", ["drift-push", "smoke-raise"]),
    "verifier": ("servicenow", ["reread"]),
    "evidence_reader": ("servicenow", ["evidence", "deploy-check"]),
    "isc_reader": ("isc", ["drift", "reread"]),
    "isc_deploy_checker": ("isc", ["deploy-check"]),
    "isc_workflow_admin": ("isc", ["workflows"]),
    "isc_workflow_tester": ("isc", ["workflow-test"]),
}
G1_FEATURES = ("workflows", "native_change_detection", "http_request_step")
WORKFLOWS_FILE = KIT / "sailpoint" / "workflows" / "drift-to-servicenow.json"
# The kit's workflow file posts to this example instance; the render step replaces it.
EXAMPLE_SN_BASE = "https://contoso.service-now.com"
# The synthetic findings the smoke test follows: (source, subject key in "synthetic", class, attribute?).
SMOKE_FINDINGS = {
    "direct": ("drift-reconciliation", "entra_user_id", "attribute_drift", True),
    "native": ("sailpoint-isc", "account_id", "unauthorized_write", False),
    "mover": ("sailpoint-isc", "identity_id", "attribute_drift", True),
}


class Settings:
    """The settings file: kit config keys (upper case) plus a "deploy" block."""

    def __init__(self, path: str, raw: dict, cfg: dict):
        self.path = path
        self.raw = raw
        self.cfg = cfg
        self.deploy = raw.get("deploy") or {}

    @property
    def environment(self) -> str:
        return str(self.deploy.get("environment", ""))

    @property
    def synthetic(self) -> dict:
        return self.deploy.get("synthetic") or {}

    def placeholders(self) -> list[str]:
        """Dotted paths of every value still holding a <placeholder> or REPLACE."""
        out: list[str] = []

        def walk(value: Any, path: str) -> None:
            if isinstance(value, dict):
                for key, item in value.items():
                    if not key.startswith("_"):
                        walk(item, f"{path}.{key}" if path else key)
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    walk(item, f"{path}[{i}]")
            elif isinstance(value, str) and PLACEHOLDER.search(value):
                out.append(path)

        walk(self.raw, "")
        return out


def load_settings(path: str, env: Mapping[str, str] | None = None) -> Settings:
    """Read the settings file. Endpoints come from the file alone; client IDs from the environment.

    A secret in the file raises kc.KitError (kit_common's own rule).
    """
    env = os.environ if env is None else env
    with open(path, encoding="utf-8") as handle:
        raw = json.load(handle)
    cfg = kc.load_config(path, env={})
    for key in ("SN_CLIENT_ID", "SAILPOINT_CLIENT_ID"):
        if env.get(key):
            cfg[key] = env[key]
    return Settings(path, raw, cfg)


def endpoint_overrides(settings: Settings, env: Mapping[str, str]) -> list[str]:
    """Environment variables that would override the file's endpoints in the kit's other clients."""
    out = []
    for key in ENDPOINT_KEYS:
        if env.get(key) and env[key].rstrip("/") != str(settings.cfg.get(key, "")).rstrip("/"):
            out.append(key)
    return out


def role_mismatch(settings: Settings, env: Mapping[str, str], sn_role: str | None, isc_role: str | None) -> list[str]:
    """Messages when the client IDs in the environment aren't the ones this step should run as.

    Only checked when a client ID is set; a vault-fed token can't be checked here.
    """
    clients = settings.deploy.get("clients") or {}
    out = []
    for key, role in (("SN_CLIENT_ID", sn_role), ("SAILPOINT_CLIENT_ID", isc_role)):
        if role and env.get(key) and env[key] != clients.get(role):
            out.append(f"{key} is not the {role} client in the settings file")
    return out


def required_for(identity: str) -> tuple[str, set[str]]:
    system, tasks = IDENTITIES[identity]
    data = kcalls.load_calls()
    needed: set[str] = set()
    for task in tasks:
        needed |= kcalls.required(data, task, system)
    return system, needed


def smoke_key(settings: Settings, which: str) -> str:
    """The de-duplication key the Scripted REST script gives one of the smoke test's findings."""
    source, subject_key, drift_class, has_attribute = SMOKE_FINDINGS[which]
    syn = settings.synthetic
    key = "|".join([source, str(syn.get(subject_key, "")), drift_class])
    return key + ("|" + str(syn.get("attribute", "")) if has_attribute else "")


def load_workflows() -> list[dict]:
    with open(WORKFLOWS_FILE, encoding="utf-8") as handle:
        return json.load(handle)


# --------------------------------------------------------------------------
# Fixture mode: answer calls from a saved file
# --------------------------------------------------------------------------

class ReplayResponse:
    def __init__(self, status_code: int, body: Any, headers: Mapping[str, str] | None = None):
        self.status_code = status_code
        self._body = body
        self.headers = dict(headers or {})
        self.text = "" if body is None else json.dumps(body)
        self.content = self.text.encode()

    def json(self) -> Any:
        return self._body


class ReplaySession:
    """A requests.Session stand-in that answers from {"responses": [...]} in a fixture file.

    Each response has method, path (the URL path, with {placeholders} allowed), status and
    body; it is used once unless "repeat" is true, and with "query_contains" it answers only
    a call whose query parameters contain that text ("body_contains": its JSON body). Every call is recorded in .calls.
    """

    def __init__(self, responses: list[dict]):
        self.responses = list(responses)
        self.calls: list[dict] = []

    def request(self, method: str, url: str, **kwargs: Any) -> ReplayResponse:
        self.calls.append({"method": method, "url": url, **kwargs})
        path = urlsplit(url).path
        query = json.dumps(kwargs.get("params") or {}, sort_keys=True)
        body = json.dumps(kwargs.get("json"), sort_keys=True)
        for item in self.responses:
            if item.get("query_contains") and item["query_contains"] not in query:
                continue
            if item.get("body_contains") and item["body_contains"] not in body:
                continue
            if item["method"] == method and kcalls._template_regex(item["path"]).fullmatch(path):
                if not item.get("repeat"):
                    self.responses.remove(item)
                return ReplayResponse(item.get("status", 200), item.get("body"), item.get("headers"))
        raise kc.KitError(f"The fixture has no response for {method} {path}")


def load_fixture(path: str) -> tuple[dict[str, str], ReplaySession]:
    with open(path, encoding="utf-8") as handle:
        data = json.load(handle)
    return dict(data.get("env") or {}), ReplaySession(data.get("responses") or [])


def mode_setup(args: Any, http: kc.Http | None) -> tuple[dict[str, str] | Mapping[str, str], kc.Http | None, str]:
    """(env, http, mode label) for --fixtures, --dry-run or live."""
    if getattr(args, "fixtures", None):
        env, session = load_fixture(args.fixtures)
        return env, http or kc.Http(session, sleep=lambda s: None), "fixtures"
    if getattr(args, "dry_run", False):
        return os.environ, None, "dry-run"
    return os.environ, http or kc.Http(), "live"


def get_setting(path: str, dotted: str) -> str:
    """One value from a settings file by its dotted path, for example deploy.clients.verifier."""
    with open(path, encoding="utf-8") as handle:
        value: Any = json.load(handle)
    for part in dotted.split("."):
        if not isinstance(value, dict) or part not in value:
            raise KeyError(f"{dotted!r} is not in {path}")
        value = value[part]
    if isinstance(value, (dict, list)):
        raise KeyError(f"{dotted!r} in {path} is not a single value")
    if isinstance(value, str) and PLACEHOLDER.search(value):
        raise KeyError(f"{dotted!r} in {path} is still a placeholder: {value}")
    return str(value)


def write_json(path: str | None, value: Any) -> None:
    if not path:
        return
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, sort_keys=True)
        handle.write("\n")


def main(argv: list[str] | None = None, out=None) -> int:
    out = out or sys.stdout
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) != 2:
        print("usage: python deploy/deploy_common.py <settings.json> <dotted.path>", file=sys.stderr)
        return 2
    try:
        print(get_setting(argv[0], argv[1]), file=out)
    except (KeyError, OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
