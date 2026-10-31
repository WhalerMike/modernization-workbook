"""Microsoft's Arc onboarding role, azure.azcollection.azure_arc: what it does and leaves to you.

06_arc_onboarding_role.yml calls Microsoft's role and adds only what the role leaves out. These
tests pin the facts that decision rests on, so an upstream change shows up as a failing test
when the pinned copy is updated:

  * Static tests read the unmodified copy in examples/third_party/azure-arc-role (skipped when
    the kit is used outside the repository, as from the download zip).
  * If the collection is installed, its role must be byte for byte the pinned copy.
  * One local run applies the role, unchanged, to the control node in check mode, with every
    outbound request sent to a dead local proxy, and shows it can't dry-run a server that has
    no agent. It needs root, the collection, and no agent on the control node.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest
import yaml

KIT = Path(__file__).resolve().parent.parent
SNAPSHOT = KIT.parent / "third_party" / "azure-arc-role"
ROLE = SNAPSHOT / "roles" / "azure_arc"
CHECK_PLAYBOOK = KIT / "tests" / "fixtures" / "microsoft_role_check.yml"
DEAD_PROXY = "http://127.0.0.1:9"

needs_snapshot = pytest.mark.skipif(not ROLE.is_dir(), reason="pinned copy not present (outside the repository)")


def tasks(name: str) -> list[dict]:
    return yaml.safe_load((ROLE / "tasks" / name).read_text(encoding="utf-8"))


def installed_collection() -> tuple[Path, str] | None:
    """The installed collection's role folder and version, or None."""
    if shutil.which("ansible-galaxy") is None:
        return None
    result = subprocess.run(["ansible-galaxy", "collection", "list", "azure.azcollection", "--format", "json"],
                            capture_output=True, text=True)
    if result.returncode != 0 or not result.stdout.strip():
        return None
    for path, collections in json.loads(result.stdout).items():
        if "azure.azcollection" in collections:
            version = str(collections["azure.azcollection"].get("version", ""))
            return Path(path) / "azure" / "azcollection" / "roles" / "azure_arc", version
    return None


def installed_role() -> Path | None:
    """The installed collection's role folder, or None."""
    found = installed_collection()
    return found[0] if found else None


@needs_snapshot
def test_role_asks_for_a_commercial_resource_manager_token():
    token = next(t for b in tasks("main.yml") if "block" in b for t in b["block"]
                 if "azure.azcollection.azure_rm_accesstoken_info" in t)
    assert token["azure.azcollection.azure_rm_accesstoken_info"]["scopes"] == ["https://management.azure.com/.default"]
    # The token is requested on the control node, so a service principal secret stays there.
    assert token["delegate_to"] == "localhost" and token["no_log"] is True


@needs_snapshot
def test_role_default_tag_is_the_sql_guard_not_what_learn_lists():
    defaults = yaml.safe_load((ROLE / "defaults" / "main.yml").read_text(encoding="utf-8"))
    # Learn's role variable table gives the default as {archost: "true"}; the role ships this.
    assert defaults["azure_arc_tags"] == {"ArcSQLServerExtensionDeployment": "Disabled"}
    assert defaults["azure_arc_cloud"] == "AzureCloud"


@needs_snapshot
def test_role_sends_a_signal_to_microsoft_by_default():
    defaults = yaml.safe_load((ROLE / "defaults" / "main.yml").read_text(encoding="utf-8"))
    assert defaults["azure_arc_log_enabled"] is True
    assert defaults["azure_arc_his_endpoints"]["AzureCloud"] == "https://gbl.his.arc.azure.com"
    put = next(t for t in tasks("log_signal.yml") if "ansible.builtin.uri" in t)
    body = tasks("log_signal.yml")[0]["ansible.builtin.set_fact"]["__azure_arc_signal_body"]
    assert put["ansible.builtin.uri"]["method"] == "PUT"
    assert {"subscriptionId", "resourceGroup", "tenantId", "location"} <= set(body)


@needs_snapshot
def test_role_passes_the_access_token_on_the_agent_command_line():
    argv = tasks("linux_connect.yml")[0]["ansible.builtin.command"]["argv"]
    assert "--access-token" in argv
    assert tasks("linux_connect.yml")[0]["no_log"] is True


@needs_snapshot
def test_role_cannot_dry_run_a_server_without_the_agent():
    check = tasks("linux_install.yml")[0]
    show = tasks("linux_show.yml")[0]
    # The install check runs a command, which check mode skips (rc 0), so the role decides the
    # agent is installed; the status read runs even in check mode and fails when it isn't.
    assert check["ansible.builtin.command"]["cmd"] == "azcmagent --version" and "check_mode" not in check
    assert show["check_mode"] is False and "failed_when" not in show


@needs_snapshot
def test_role_knows_nothing_of_owners_waves_or_batches():
    text = "\n".join(p.read_text(encoding="utf-8") for p in ROLE.rglob("*.yml"))
    for absent in ("config_owner", "patch_owner", "ConfigOwner", "PatchOwner", "serial", "wave"):
        assert absent not in text, absent


@needs_snapshot
def test_installed_role_is_the_pinned_copy():
    found = installed_collection()
    if found is None or not found[0].is_dir():
        pytest.skip("azure.azcollection isn't installed")
    role, version = found
    manifest = json.loads((SNAPSHOT / "snapshot.json").read_text(encoding="utf-8"))
    pinned = manifest["release"].split()[0].lstrip("v")
    if version != pinned:
        # requirements.yml installs the pinned version; a control node (or CI runner) with another
        # version of the collection already installed can't be compared byte for byte.
        pytest.skip(f"azure.azcollection {version} is installed, not the pinned {pinned}")
    for rel, meta in manifest["files"].items():
        if not rel.startswith("roles/azure_arc/"):
            continue
        body = (role / rel.removeprefix("roles/azure_arc/")).read_bytes()
        assert hashlib.sha256(body).hexdigest() == meta["sha256"], f"installed {rel} differs from the pinned copy"


@pytest.mark.skipif(not hasattr(os, "geteuid") or os.geteuid() != 0, reason="needs root on the control node")
@pytest.mark.skipif(shutil.which("ansible-playbook") is None, reason="ansible-playbook not installed")
def test_role_in_check_mode_fails_on_a_server_without_the_agent():
    if installed_role() is None:
        pytest.skip("azure.azcollection isn't installed")
    if shutil.which("azcmagent") or Path("/opt/azcmagent").exists():
        pytest.skip("the control node has the agent; the role would go on to request a token")
    env = dict(os.environ, ANSIBLE_CONFIG=str(KIT / "ansible.cfg"), ANSIBLE_NOCOLOR="1",
               HTTPS_PROXY=DEAD_PROXY, HTTP_PROXY=DEAD_PROXY, https_proxy=DEAD_PROXY, http_proxy=DEAD_PROXY)
    result = subprocess.run(["ansible-playbook", "-i", "localhost,", "-c", "local", "--check", "-v", str(CHECK_PLAYBOOK)],
                            capture_output=True, text=True, env=env, cwd=KIT)
    assert result.returncode != 0
    assert "azure_arc_azcmagent_installed: true" in result.stdout  # the kit's YAML callback format
    assert "Get azcmagent status" in result.stdout and "No such file or directory: b'azcmagent'" in result.stdout
    assert not Path("/opt/azcmagent").exists()
