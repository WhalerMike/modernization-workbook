"""Unit tests for the illustrative Catalyst SD-WAN evidence collector.

Every HTTP call is answered by a fake transport from the JSON fixtures; nothing
here talks to a real fabric.
"""

from __future__ import annotations

import csv
import json
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / "python"))

import sdwan_evidence as se  # noqa: E402

FIXTURES = HERE / "fixtures"
FLOOR = json.loads((ROOT / "data" / "ed-26-03-fixed-releases.json").read_text(encoding="utf-8"))
ADVISORIES = {a["id"]: a for a in FLOOR["advisories"]}
NOW = datetime(2026, 10, 24, 12, 0, tzinfo=timezone.utc)


def fixture(name: str) -> bytes:
    return (FIXTURES / name).read_bytes()


class FakeTransport:
    """Records every request and answers from fixtures."""

    def __init__(self, session_mode: bool = False, session_fails: bool = False):
        self.calls: list[tuple[str, str, dict[str, str], bytes | None]] = []
        self.session_mode = session_mode
        self.session_fails = session_fails

    def __call__(self, method, url, headers, body):
        self.calls.append((method, url, dict(headers), body))
        path = urllib.parse.urlparse(url).path
        if (method, path) == ("POST", "/jwt/login"):
            return se.Response(200, {"Content-Type": "application/json"}, fixture("jwt-login.json"))
        if (method, path) == ("POST", "/j_security_check"):
            if self.session_fails:
                return se.Response(200, {}, b"<html><body>login</body></html>")
            return se.Response(200, {"Set-Cookie": "JSESSIONID=abc123example; Path=/; Secure; HttpOnly"}, b"")
        if (method, path) == ("GET", "/dataservice/client/token"):
            return se.Response(200, {}, b"session-xsrf-example")
        if (method, path) == ("POST", "/logout"):
            return se.Response(200, {}, b"")
        if (method, path) == ("GET", "/dataservice/device"):
            return se.Response(200, {}, fixture("devices.json"))
        if (method, path) == ("GET", "/dataservice/auditlog"):
            return se.Response(200, {}, fixture("auditlog.json"))
        return se.Response(404, {}, b"{}")


def make_cfg(**overrides):
    cfg = json.loads((ROOT / "config" / "config.example.json").read_text(encoding="utf-8"))
    cfg.update(overrides)
    return cfg


# --- versions -------------------------------------------------------------

def test_parse_version_handles_ios_xe_letters():
    assert se.parse_version("20.15.4.2") == (20, 15, 4, 2)
    assert se.parse_version("17.15.04c") == (17, 15, 4)
    assert se.parse_version("17.18.02.0.1234") == (17, 18, 2, 0, 1234)
    with pytest.raises(ValueError):
        se.parse_version("unknown")


@pytest.mark.parametrize("version,status", [
    ("20.18.2.1", "pass"),     # exactly the fix
    ("20.18.1.0", "fail"),     # below the fix
    ("20.18.5.0", "pass"),     # newer than every listed fix
    ("20.12.5.3", "pass"),     # same-branch fix
    ("20.12.5.1", "fail"),     # below the same-branch fix
    ("20.12.6.0", "fail"),     # on the 20.12.6 branch, below 20.12.6.1
    ("20.12.7.0", "pass"),     # later branch than every fix
    ("20.11.1.0", "fail"),     # train has no fix: migrate
    ("20.8.1.0", "fail"),      # older than the minimum train
    ("26.1.1.0", "confirm"),   # train not listed in this advisory
])
def test_check_release_cve_2026_20127(version, status):
    got, reason = se.check_release(version, ADVISORIES["cisco-sa-sdwan-rpa-EHchtZk"],
                                   FLOOR["end_of_maintenance_trains"])
    assert got == status, reason


def test_end_of_maintenance_train_fails_where_advisory_is_silent():
    status, reason = se.check_release("20.16.1.0", ADVISORIES["cisco-sa-sdwan-privesc-4uxFrdzx"],
                                      FLOOR["end_of_maintenance_trains"])
    assert status == "fail" and "End of Software Maintenance" in reason


def test_cve_2026_76504_sets_the_current_manager_floor():
    adv = ADVISORIES["cisco-sa-sdwan-webauth-xr8beuuU"]
    assert se.check_release("20.18.3.1", adv)[0] == "fail"
    assert se.check_release("20.18.4.1", adv)[0] == "pass"
    assert se.check_release("26.2.1", adv)[0] == "pass"


def test_2022_advisory_does_not_affect_20_9_and_later():
    adv = ADVISORIES["cisco-sa-sd-wan-priv-E6e8tEdF"]
    assert se.check_release("20.18.4.1", adv)[0] == "pass"
    assert se.check_release("20.6.2", adv)[0] == "fail"


def test_floor_data_is_well_formed():
    kev = set()
    for adv in FLOOR["advisories"]:
        assert adv["url"].startswith("https://sec.cloudapps.cisco.com/")
        assert set(adv["kev_cves"]) <= set(adv["cves"])
        assert set(adv["products"]) <= {"manager", "controller", "validator"}
        for train, entry in adv["trains"].items():
            for fix in entry.get("fixed", []):
                assert se.train_of(se.parse_version(fix)) == train
        kev.update(adv["kev_cves"])
    # The nine Catalyst SD-WAN CVEs in the KEV catalog (version 2026.10.23).
    assert kev == {"CVE-2026-20127", "CVE-2022-20775", "CVE-2026-20122", "CVE-2026-20128",
                   "CVE-2026-20133", "CVE-2026-20182", "CVE-2026-20245", "CVE-2026-20262",
                   "CVE-2026-76504"}


# --- the client is read-only ---------------------------------------------

def test_client_refuses_writes():
    client = se.ManagerClient("https://sdwan-manager.contoso.example", FakeTransport())
    with pytest.raises(se.ReadOnlyViolation):
        client._send("POST", "/dataservice/template/policy/vsmart/activate/x")
    with pytest.raises(se.ReadOnlyViolation):
        client._send("PUT", "/dataservice/device")
    with pytest.raises(se.ReadOnlyViolation):
        client._send("DELETE", "/dataservice/auditlog")


def test_jwt_login_sets_bearer_and_csrf():
    transport = FakeTransport()
    client = se.ManagerClient("https://sdwan-manager.contoso.example", transport)
    client.login_jwt("reader", "example-password", duration=900)
    assert client.headers["Authorization"] == "Bearer example-jwt-access-token"
    assert client.headers["X-XSRF-TOKEN"] == "example-csrf-value"
    body = json.loads(transport.calls[0][3])
    assert body["duration"] == 900


def test_session_login_reads_cookie_and_token():
    transport = FakeTransport(session_mode=True)
    client = se.ManagerClient("https://sdwan-manager.contoso.example", transport)
    client.login_session("reader", "example-password")
    assert client.headers["Cookie"] == "JSESSIONID=abc123example"
    assert client.headers["X-XSRF-TOKEN"] == "session-xsrf-example"


def test_session_login_detects_html_login_page():
    client = se.ManagerClient("https://sdwan-manager.contoso.example", FakeTransport(session_fails=True))
    with pytest.raises(PermissionError):
        client.login_session("reader", "wrong")


def test_audit_query_uses_last_n_hours():
    transport = FakeTransport()
    client = se.ManagerClient("https://sdwan-manager.contoso.example", transport)
    client.get_audit_log(48)
    query = urllib.parse.parse_qs(urllib.parse.urlparse(transport.calls[-1][1]).query)["query"][0]
    rule = json.loads(query)["query"]["rules"][0]
    assert rule["operator"] == "last_n_hours" and rule["value"] == ["48"]


# --- end to end against fixtures ------------------------------------------

def test_run_produces_gate_findings_and_records(tmp_path):
    transport = FakeTransport()
    cfg = make_cfg()
    client = se.ManagerClient(cfg["manager_url"], transport)
    result = se.run(cfg, client, FLOOR, "reader", "example-password", now=NOW)

    assert all(call[0] in ("GET", "POST") for call in transport.calls)
    assert {urllib.parse.urlparse(c[1]).path for c in transport.calls if c[0] == "POST"} == {"/jwt/login"}

    assert result["gate"] == "fail"
    failing = {(f["host_name"], f.get("advisory_id")) for f in result["gate_findings"] if f["status"] == "fail"}
    # The Validator on 20.15.5.2 is below the CVE-2026-20245 fix (20.15.5.3).
    assert ("sdwan-validator-01", "cisco-sa-sdwan-privesc-4uxFrdzx") in failing
    # The Managers on 20.18.4.1 clear every Manager advisory, including CVE-2026-76504.
    assert not any(h.startswith("sdwan-manager") for h, _ in failing)
    # The extra controller is flagged for validation.
    unexpected = [f for f in result["gate_findings"] if f["record_kind"] == "unexpected_control_component"]
    assert [f["system_ip"] for f in unexpected] == ["10.255.0.99"]
    # Edges are inventoried but not gated against control-component advisories.
    assert not any(f.get("role") == "edge" for f in result["gate_findings"])

    inventory = [r for r in result["records"] if r["record_kind"] == "fleet_inventory"]
    assert len(inventory) == 7
    edge = next(r for r in inventory if r["role"] == "edge")
    assert edge["software_version"] == "17.18.02.0.1234" and edge["control_refs"] == ["CM-8", "SI-2"]

    audit = [r for r in result["records"] if r["record_kind"] == "management_audit"]
    assert audit[0]["evaluation_timestamp"].startswith("2026-")
    assert "successful_sign_in_review_against_authorized_users" in audit[0]["review_flags"]
    assert "source_outside_management_network" not in audit[0]["review_flags"]
    assert "source_outside_management_network" in audit[1]["review_flags"]

    json_path, csv_path = se.write_outputs(result, tmp_path)
    assert json.loads(json_path.read_text(encoding="utf-8"))["gate"] == "fail"
    rows = list(csv.DictReader(csv_path.open(encoding="utf-8")))
    assert any(r["status"] == "fail" for r in rows)


def test_gate_passes_when_everything_is_current():
    devices = [
        {"host-name": "m1", "system-ip": "10.255.0.1", "device-type": "vmanage", "version": "20.18.4.1"},
        {"host-name": "c1", "system-ip": "10.255.0.11", "device-type": "vsmart", "version": "20.18.4.1"},
        {"host-name": "v1", "system-ip": "10.255.0.21", "device-type": "vbond", "version": "20.18.4.1"},
    ]
    findings = se.gate_findings(devices, FLOOR, "2026-10-24T12:00:00Z")
    assert findings and se.gate_status(findings) == "pass"


# --- configuration safety -------------------------------------------------

def test_config_refuses_secrets(tmp_path):
    bad = make_cfg(api_password="example")
    path = tmp_path / "config.json"
    path.write_text(json.dumps(bad), encoding="utf-8")
    with pytest.raises(se.ConfigError):
        se.load_config(path)


def test_config_requires_https(tmp_path):
    path = tmp_path / "config.json"
    path.write_text(json.dumps(make_cfg(manager_url="http://sdwan-manager.contoso.example")), encoding="utf-8")
    with pytest.raises(se.ConfigError):
        se.load_config(path)


def test_example_config_loads():
    cfg = se.load_config(ROOT / "config" / "config.example.json")
    assert cfg["auth_mode"] == "jwt"


def test_main_fails_cleanly_without_credentials(tmp_path, monkeypatch):
    cfg = make_cfg(fixed_release_file=str(ROOT / "data" / "ed-26-03-fixed-releases.json"))
    path = tmp_path / "config.json"
    path.write_text(json.dumps(cfg), encoding="utf-8")
    monkeypatch.delenv("SDWAN_API_USERNAME", raising=False)
    monkeypatch.delenv("SDWAN_API_PASSWORD", raising=False)
    assert se.main(["--config", str(path)]) == 1
