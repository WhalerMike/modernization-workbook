"""Each workflow's request body resolves against a sample trigger input into an accepted payload."""

import json

import pytest

import workflow_payload as wp
from conftest import FIXTURES

EVENTS = FIXTURES / "events"


def _event(name):
    return json.loads((EVENTS / name).read_text(encoding="utf-8"))


def test_native_change_reverts_every_kind_of_change():
    r = wp.build("idn:native-change-account-updated", _event("native-change-account-updated.json"))
    p = r["payload"]
    assert r["contract"]["ok"] and not r["contract"]["warnings"]
    assert p["drift_class"] == "unauthorized_write" and p["system"] == "isc_account"
    assert p["account_id"] == "2c91800000000000000000000a1001ad"
    intended = p["intended_state"]
    assert intended["attributes"] == {"title": "Analyst"}
    assert {"attribute": "proxyAddresses", "value": "smtp:ap-approver@contoso.example"} in intended["entitlements_absent"]
    assert {"attribute": "memberOf", "value": "CN=Payables Approvers,OU=Groups,DC=contoso,DC=example"} in intended["entitlements_absent"]
    assert r["unmapped_input_fields"] == ["eventType"]


def test_without_multi_value_mapping_the_intended_state_is_vacuous():
    """The gap Chapter 04 closes: a change only to a multivalued attribute left nothing to re-read."""
    workflows = wp.load_workflows()
    for w in workflows:
        body = wp.http_body(w)
        body.pop("multi_value_changes.$", None)
    event = _event("native-change-account-updated.json")
    event["singleValueAttributeChanges"] = []
    event["entitlementChanges"] = []
    r = wp.build("idn:native-change-account-updated", event, workflows)
    assert "multiValueAttributeChanges" in r["unmapped_input_fields"]
    assert any("names nothing a re-read can check" in w for w in r["contract"]["warnings"])


def test_attribute_change_keeps_the_new_value():
    r = wp.build("idn:identity-attributes-changed", _event("identity-attributes-changed.json"))
    assert r["contract"]["ok"]
    assert r["payload"]["intended_state"] == {"attributes": {"department": "Finance"}}
    assert r["payload"]["attribute"] == "department"
    assert r["contract"]["normalized"]["dedupe_key"].endswith("|attribute_drift|department")


def test_provisioning_event_is_a_closure_signal():
    r = wp.build("idn:post-provisioning", _event("provisioning-completed.json"))
    assert r["payload"]["kind"] == "closure_signal"
    assert r["payload"]["recipient_id"] == "2c9180000000000000000000000e1001"
    assert r["payload"]["account_requests"][0]["provisioningResult"] == "SUCCESS"
    assert r["contract"]["ok"]


def test_complex_paths_are_refused():
    with pytest.raises(wp.PayloadError):
        wp.resolve_path({}, "$.changes[?(@.attribute == 'department')]")
    assert wp.resolve_path({"a": {"b": 1}}, "$.a.c") is None


def test_unknown_trigger_is_refused():
    with pytest.raises(wp.PayloadError):
        wp.build("idn:nope", {})


def test_cli_prints_the_payload(capsys):
    rc = wp.main(["--trigger", "idn:native-change-account-updated",
                  "--event", str(EVENTS / "native-change-account-updated.json")])
    out = capsys.readouterr().out
    assert rc == 0
    assert "contract: accepted: P2, priority 2" in out
    assert "input fields not sent: eventType" in out
