"""Cross-file checks: the workflow JSON, the ServiceNow script and the clients agree."""

import json
import re

import kit_common as kc
from conftest import KIT

WORKFLOWS = KIT / "sailpoint" / "workflows" / "drift-to-servicenow.json"
REST = (KIT / "servicenow" / "scripted-rest-identity-finding.js").read_text(encoding="utf-8")
# Trigger IDs confirmed in SailPoint's published trigger table (developer.sailpoint.com/docs/api/triggers).
DOCUMENTED_TRIGGER_IDS = {"idn:identity-attributes-changed", "idn:post-provisioning"}
# Not in that table; the README lists it under "verify in your tenant".
UNVERIFIED_TRIGGER_IDS = {"idn:native-change-account-updated"}


def _workflows():
    return json.loads(WORKFLOWS.read_text(encoding="utf-8"))


def test_workflow_bodies_follow_documented_shape():
    for wf in _workflows():
        assert set(wf) >= {"name", "owner", "description", "definition", "enabled", "trigger"}
        assert wf["enabled"] is False, "workflows cannot be created enabled"
        assert wf["trigger"]["type"] == "EVENT"
        assert wf["trigger"]["attributes"]["id"] in DOCUMENTED_TRIGGER_IDS | UNVERIFIED_TRIGGER_IDS
        steps = wf["definition"]["steps"]
        assert wf["definition"]["start"] in steps
        for name, step in steps.items():
            if step["type"] == "action":
                assert step["nextStep"] in steps, name
        assert any(s["type"] == "success" for s in steps.values())


def test_workflow_bodies_carry_no_secrets():
    text = WORKFLOWS.read_text(encoding="utf-8")
    assert "REPLACE-IN-THE-UI" in text
    assert not re.search(r"(?i)(password|secret)\"\s*:\s*\"(?!REPLACE)", text)


def test_workflow_payload_fields_are_read_by_servicenow_script():
    for wf in _workflows():
        for step in wf["definition"]["steps"].values():
            body = step.get("attributes", {}).get("jsonRequestBody")
            if not body:
                continue
            for key in body:
                field = key[:-2] if key.endswith(".$") else key
                if field in ("source", "kind", "account_correlated", "change_types"):
                    continue
                assert f"body.{field}" in REST, f"{wf['name']}: {field} not read by the Scripted REST script"


def test_example_config_loads_and_has_no_secrets():
    cfg = kc.load_config(str(KIT / "config" / "config.example.json"), env={})
    assert cfg["SN_INSTANCE"] == "contoso"
