"""One writer per attribute: the check over the two provisioning exports."""

import json

import pytest

import writer_check as wc
from conftest import FIXTURES

SCHEMA = FIXTURES / "writers" / "entra_inbound_schema.json"
POLICIES = FIXTURES / "writers" / "isc_entra_source_policies.json"


def _load():
    return json.loads(SCHEMA.read_text()), json.loads(POLICIES.read_text())


def test_entra_writes_reads_flow_type():
    schema, _ = _load()
    writes = wc.entra_writes(schema, "Azure Active Directory")
    assert writes["department"] == "update"
    assert writes["userprincipalname"] == "create"


def test_isc_writes_uses_usage_type_and_aliases():
    _, policies = _load()
    writes = wc.isc_writes(policies, {"title": "jobTitle"})
    assert writes["jobtitle"] == "update" and "title" not in writes
    assert writes["displayname"] == "create"


def test_check_classifies_overlaps():
    schema, policies = _load()
    findings = wc.check(wc.entra_writes(schema, "Azure Active Directory"),
                        wc.isc_writes(policies, {"title": "jobTitle"}), wc.entra_display_names(schema))
    by = {f["attribute"]: f["severity"] for f in findings}
    assert by == {"department": "Finding", "jobTitle": "Finding", "displayName": "Warn",
                  "mailNickname": "Info", "userPrincipalName": "Info"}


def test_disabled_mapping_and_other_rules_are_ignored():
    schema, _ = _load()
    schema["synchronizationRules"][0]["objectMappings"][0]["enabled"] = False
    assert wc.entra_writes(schema, "Azure Active Directory") == {}


def test_wrong_directory_name_is_an_error():
    schema, _ = _load()
    with pytest.raises(ValueError, match="No synchronization rule targets"):
        wc.entra_writes(schema, "Microsoft Entra ID")


def test_cli(capsys):
    rc = wc.main(["--entra-schema", str(SCHEMA), "--isc-policies", str(POLICIES), "--alias", "title=jobTitle"])
    out = capsys.readouterr().out
    assert rc == 1
    assert "2 Finding, 1 Warn, 2 Info" in out
    with pytest.raises(ValueError):
        wc.parse_aliases(["nope"])
    assert wc.main(["--entra-schema", str(SCHEMA), "--isc-policies", str(POLICIES),
                    "--entra-directory", "Microsoft Entra ID"]) == 2
