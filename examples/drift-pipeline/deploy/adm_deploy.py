"""One environment settings file for the Attribute-Driven Migration deployment runbook.

Book 19, Chapter 10 runs the same commands against a live test environment and then production; only the
settings file changes. This module loads that file, refuses anything that looks like a secret or a
placeholder left unfilled, derives the per-cloud values (Graph host, Azure environment, Graph PowerShell
environment, the Arc onboarding playbook) from the drift pipeline's cloud table, and prints the settings as
shell variables for the runbook's command blocks.

Illustrative: unit-tested against fixtures, not run against a live tenant. Standard library only.

    python deploy/adm_deploy.py env --settings <file> --shell bash          # eval "$(...)"
    python deploy/adm_deploy.py env --settings <file> --shell pwsh          # ... | Invoke-Expression
    python deploy/adm_deploy.py env --settings <file> --shell bash --wave <id>

Exit codes: 0 printed, 1 refused (a secret, a placeholder, an unknown cloud, a missing key).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shlex
import sys
from pathlib import Path
from typing import Any

DEPLOY = Path(__file__).resolve().parent
KIT = DEPLOY.parent
EXAMPLES = KIT.parent
REPO = EXAMPLES.parent
sys.path.insert(0, str(KIT / "python"))

import drift_pipeline as dp  # noqa: E402

SCHEMA = "adm-deploy-settings/1"
ENVIRONMENTS = ("test", "production")
# The same words the HR middleware's settings loader refuses, plus the storage ones.
SECRET_KEY = re.compile(r"(secret|password|passwd|pwd|token|credential|private|apikey|api_key|bearer|"
                        r"connection_?string|sas_?|account_?key)", re.I)
SECRET_VALUE = re.compile(r"(-----BEGIN [A-Z ]*PRIVATE KEY-----|AccountKey=|SharedAccessSignature=|[?&]sig=)", re.I)
PLACEHOLDER = re.compile(r"<[^<>]+>")
GUID = re.compile(r"^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$")
# Keys every settings file has; a dotted path is a nested key.
REQUIRED = (
    "schema", "environment", "cloud", "tenant_id", "tenant_domain", "subscription_id", "location",
    "resource_group", "change_record", "evidence_dir", "validation_inputs",
    "identities.deploy.client_id", "identities.deploy.certificate_thumbprint", "identities.deploy.certificate_pem",
    "identities.reader.client_id", "identities.reader.certificate_thumbprint",
    "identities.provisioning.client_id", "identities.provisioning.certificate_pem",
    "hcm_entra.provisioning_app_object_id", "hcm_entra.provisioning_job_id",
    "hcm_entra.provisioning_api_endpoint", "hcm_entra.extract_path", "hcm_entra.max_quarantined",
    "dynamic_rules.groups_admin_upn", "dynamic_rules.member_map",
    "lifecycle.extension_id", "lifecycle.workflow_name", "lifecycle.test_user_id",
    "group_policy.ad_domain", "group_policy.target_ou", "group_policy.gpo_backup_path", "group_policy.gpo_names",
    "group_policy.intune_group_id",
    "machine_configuration.configuration", "machine_configuration.storage_account",
    "machine_configuration.container", "machine_configuration.arc_server_name",
    "ansible.onboarding_wave", "ansible.cmdb_csv",
    "drift.repository", "drift.github_environment", "drift.evidence_storage_account", "drift.evidence_container",
    "smoke.required_pass", "smoke.allowed_unverified",
)
GUID_KEYS = ("tenant_id", "subscription_id", "identities.deploy.client_id", "identities.reader.client_id",
             "identities.provisioning.client_id", "hcm_entra.provisioning_app_object_id",
             "lifecycle.extension_id", "lifecycle.test_user_id", "group_policy.intune_group_id")
# Microsoft's azure_arc role requests its token for commercial Azure only (Chapter 08), so a GCC High or
# DoD estate onboards with the azcmagent playbook, which reads a service principal secret from Ansible Vault.
ARC_PLAYBOOK = {"AzureCloud": "playbooks/06_arc_onboarding_role.yml",
                "AzureUSGovernment": "playbooks/02_arc_onboarding.yml"}
VK_CLOUD = {"gcc": "gcc", "gcchigh": "gcchigh", "dod": "dod"}
# Learn, "Managing Storage in the Azure independent clouds using PowerShell": StorageEndpointSuffix per environment.
STORAGE_SUFFIX = {"AzureCloud": "core.windows.net", "AzureUSGovernment": "core.usgovcloudapi.net"}


class SettingsError(Exception):
    """A settings file the runbook refuses to use."""


def get(settings: dict[str, Any], dotted: str, default: Any = None) -> Any:
    node: Any = settings
    for part in dotted.split("."):
        if not isinstance(node, dict) or part not in node:
            return default
        node = node[part]
    return node


def _walk(node: Any, path: str = ""):
    if isinstance(node, dict):
        for k, v in node.items():
            yield from _walk(v, f"{path}.{k}" if path else str(k))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from _walk(v, f"{path}[{i}]")
    else:
        yield path, node


def secret_problems(settings: dict[str, Any]) -> list[str]:
    """Keys or values that look like a secret. The deployment identities use a certificate or a federated
    credential; nothing in this file may be usable to sign in on its own."""
    out = []
    for path, value in _walk(settings):
        key = path.rsplit(".", 1)[-1].split("[")[0]
        if key.startswith("_"):
            continue
        if SECRET_KEY.search(key):
            out.append(f"key '{path}' looks like a secret; secrets never go in the settings file")
        if isinstance(value, str) and SECRET_VALUE.search(value):
            out.append(f"value of '{path}' looks like a secret (a private key, an account key or a SAS)")
    return out


def placeholder_problems(settings: dict[str, Any]) -> list[str]:
    return [f"'{path}' still holds the placeholder {PLACEHOLDER.search(v).group(0)}"
            for path, v in _walk(settings)
            if not path.rsplit(".", 1)[-1].startswith("_") and isinstance(v, str) and PLACEHOLDER.search(v)]


def structure_problems(settings: dict[str, Any]) -> list[str]:
    out = []
    if settings.get("schema") != SCHEMA:
        out.append(f"schema is {settings.get('schema')!r}; expected {SCHEMA!r}")
    if settings.get("environment") not in ENVIRONMENTS:
        out.append(f"environment is {settings.get('environment')!r}; expected test or production")
    for key in REQUIRED:
        if get(settings, key) in (None, ""):
            out.append(f"missing '{key}'")
    try:
        dp.cloud_profile(str(settings.get("cloud", "")))
    except dp.DriftError as exc:
        out.append(str(exc))
    for key in GUID_KEYS:
        v = get(settings, key)
        if isinstance(v, str) and not PLACEHOLDER.search(v) and not GUID.match(v):
            out.append(f"'{key}' isn't a GUID")
    if not isinstance(get(settings, "group_policy.gpo_names"), list):
        out.append("'group_policy.gpo_names' must be a list")
    if settings.get("environment") == "production":
        waves = settings.get("waves")
        if not isinstance(waves, list) or not waves:
            out.append("production needs 'waves': at least one wave")
        else:
            for i, w in enumerate(waves):
                for k in ("id", "target_ou", "intune_group_id", "onboarding_wave"):
                    if w.get(k) in (None, ""):
                        out.append(f"waves[{i}] is missing '{k}'")
    return out


def load_settings(path: Path, allow_placeholders: bool = False) -> dict[str, Any]:
    """Read and check a settings file. Refuses secrets always, placeholders unless allowed (the template)."""
    path = Path(path)
    try:
        settings = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SettingsError(f"{path}: can't read settings ({exc})") from exc
    if not isinstance(settings, dict):
        raise SettingsError(f"{path}: settings must be a JSON object")
    problems = secret_problems(settings) + structure_problems(settings)
    if not allow_placeholders:
        problems += placeholder_problems(settings)
    if problems:
        shown = "; ".join(problems[:4]) + (f"; and {len(problems) - 4} more" if len(problems) > 4 else "")
        raise SettingsError(f"{path.name}: {len(problems)} problem(s): {shown}")
    return settings


def sha256_file(path: Path) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def wave(settings: dict[str, Any], wave_id: str | None) -> dict[str, Any] | None:
    if wave_id is None:
        return None
    for w in settings.get("waves") or []:
        if str(w.get("id")) == str(wave_id):
            return w
    raise SettingsError(f"no wave {wave_id!r} in the settings file")


def derived(settings: dict[str, Any], settings_path: Path, wave_id: str | None = None) -> dict[str, str]:
    """Every value the runbook's commands read, as ADM_* variables."""
    cloud = dp.cloud_profile(settings["cloud"])
    w = wave(settings, wave_id)
    ids = settings["identities"]
    gp, mc, an, dr = settings["group_policy"], settings["machine_configuration"], settings["ansible"], settings["drift"]
    evidence = Path(settings["evidence_dir"])
    if not evidence.is_absolute():
        evidence = (Path(settings_path).resolve().parent / evidence).resolve()
    out = {
        "ADM_SETTINGS": str(Path(settings_path).resolve()),
        "ADM_EXAMPLES": str(EXAMPLES),
        "ADM_DEPLOY": str(DEPLOY),
        "ADM_ENVIRONMENT": settings["environment"],
        "ADM_CHANGE_RECORD": settings["change_record"],
        "ADM_EVIDENCE_DIR": str(evidence / settings["environment"] / settings["change_record"]),
        "ADM_CLOUD": cloud["name"],
        "ADM_VK_CLOUD": VK_CLOUD[cloud["name"]],
        "ADM_AZ_CLOUD": cloud["azure_environment"],
        "ADM_MG_ENV": cloud["mg_environment"],
        "ADM_GRAPH": cloud["graph"],
        "ADM_TENANT_ID": settings["tenant_id"],
        "ADM_TENANT_DOMAIN": settings["tenant_domain"],
        "ADM_SUBSCRIPTION_ID": settings["subscription_id"],
        "ADM_LOCATION": settings["location"],
        "ADM_RESOURCE_GROUP": settings["resource_group"],
        "ADM_DEPLOY_CLIENT_ID": ids["deploy"]["client_id"],
        "ADM_DEPLOY_CERT_THUMBPRINT": ids["deploy"]["certificate_thumbprint"],
        "ADM_DEPLOY_CERT_PEM": ids["deploy"]["certificate_pem"],
        "ADM_READER_CLIENT_ID": ids["reader"]["client_id"],
        "ADM_READER_CERT_THUMBPRINT": ids["reader"]["certificate_thumbprint"],
        "ADM_PROVISIONING_CLIENT_ID": ids["provisioning"]["client_id"],
        "ADM_PROVISIONING_CERT_PEM": ids["provisioning"]["certificate_pem"],
        "ADM_PROV_SP_ID": settings["hcm_entra"]["provisioning_app_object_id"],
        "ADM_PROV_JOB_ID": settings["hcm_entra"]["provisioning_job_id"],
        "ADM_PROV_ENDPOINT": settings["hcm_entra"]["provisioning_api_endpoint"],
        "ADM_HR_EXTRACT": settings["hcm_entra"]["extract_path"],
        "ADM_GROUPS_ADMIN_UPN": settings["dynamic_rules"]["groups_admin_upn"],
        "ADM_DR_MEMBER_MAP": settings["dynamic_rules"]["member_map"],
        "ADM_VK_INPUTS": settings["validation_inputs"],
        "ADM_LCW_EXTENSION_ID": settings["lifecycle"]["extension_id"],
        "ADM_LCW_WORKFLOW_NAME": settings["lifecycle"]["workflow_name"],
        "ADM_LCW_TEST_USER_ID": settings["lifecycle"]["test_user_id"],
        "ADM_AD_DOMAIN": gp["ad_domain"],
        "ADM_TARGET_OU": (w or gp)["target_ou"],
        "ADM_GPO_BACKUP_PATH": gp["gpo_backup_path"],
        "ADM_GPO_NAMES": ",".join(gp["gpo_names"]),
        "ADM_INTUNE_GROUP_ID": (w or gp)["intune_group_id"],
        "ADM_MC_NAME": mc["configuration"],
        "ADM_MC_STORAGE": mc["storage_account"],
        "ADM_MC_CONTAINER": mc["container"],
        "ADM_MC_CONTENT_URI": f"https://{mc['storage_account']}.blob.{STORAGE_SUFFIX[cloud['azure_environment']]}/{mc['container']}",
        "ADM_ARC_SERVER": mc["arc_server_name"],
        "ADM_ARC_WAVE": str((w or an)["onboarding_wave"]),
        "ADM_CMDB_CSV": an["cmdb_csv"],
        "ADM_ARC_PLAYBOOK": ARC_PLAYBOOK[cloud["azure_environment"]],
        "ADM_DRIFT_REPO": dr["repository"],
        "ADM_DRIFT_ENV": dr["github_environment"],
        "ADM_EVIDENCE_ACCOUNT": dr["evidence_storage_account"],
        "ADM_EVIDENCE_CONTAINER": dr["evidence_container"],
        "ADM_WAVE": "" if w is None else str(w["id"]),
    }
    return out


def render(values: dict[str, str], shell: str) -> str:
    if shell == "bash":
        return "\n".join(f"export {k}={shlex.quote(v)}" for k, v in values.items())
    if shell == "pwsh":
        return "\n".join(f"$env:{k} = '" + v.replace("'", "''") + "'" for k, v in values.items())
    raise SettingsError(f"unknown shell {shell!r}; expected bash or pwsh")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    e = sub.add_parser("env", help="print the settings as ADM_* shell variables")
    e.add_argument("--settings", required=True, type=Path)
    e.add_argument("--shell", choices=("bash", "pwsh"), required=True)
    e.add_argument("--wave", help="production wave ID: its OU, Intune group and Arc wave replace the defaults")
    args = ap.parse_args(argv)
    try:
        settings = load_settings(args.settings)
        print(render(derived(settings, args.settings, args.wave), args.shell))
    except (SettingsError, dp.DriftError) as exc:
        print(f"refused: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
