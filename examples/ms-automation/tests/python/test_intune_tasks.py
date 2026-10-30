import datetime as dt
import json
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
FIX = HERE.parent / "fixtures"
sys.path.insert(0, str(HERE.parents[1] / "python"))

import intune_tasks as it  # noqa: E402
from graphkit import GraphClient  # noqa: E402

AS_OF = dt.datetime(2026, 10, 30, tzinfo=dt.timezone.utc)


def load(name):
    return json.loads((FIX / f"{name}.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def data():
    return load("intune")


class FakeGraph:
    """Answers GETs from a {url-suffix: body} map and records every URL."""

    def __init__(self, routes):
        self.routes, self.urls = routes, []

    def __call__(self, method, url, headers, body):
        assert method == "GET", "the Intune tasks only read"
        self.urls.append(url)
        for suffix, payload in self.routes.items():
            if url.endswith(suffix):
                return 200, {}, json.dumps(payload).encode()
        return 404, {}, json.dumps({"error": {"code": "NotFound"}}).encode()


def client(routes, cloud="gcc"):
    fake = FakeGraph(routes)
    return GraphClient(cloud, lambda scope: "t0ken", transport=fake, sleep=lambda s: None), fake


# ------------------------------------------------------------ evaluate functions


def test_noncompliant_devices(data):
    out = it.evaluate_noncompliant(data["managedDevices"], data["compliancePolicies"])
    assert [(r["deviceName"], r["complianceState"]) for r in out["devices"]] == [
        ("IPH-0001", "noncompliant"), ("WS-0002", "noncompliant"), ("WS-0003", "inGracePeriod"), ("WS-0005", "error")]
    assert out["devices"][1]["failingPolicies"] == ["CP-001 Windows workstation baseline (nonCompliant)"]
    assert out["devices"][1]["nameNotUnique"] is True  # two managed devices are called WS-0002
    assert out["devices"][2]["graceExpires"] == "2026-10-31T00:00:00Z"
    assert out["devices"][3]["failingPolicies"] == ["CP-001 Windows workstation baseline (error)"]
    assert out["counts"] == {"noncompliant": 2, "inGracePeriod": 1, "error": 1, "conflict": 0}


def test_compliance_coverage(data):
    out = it.evaluate_coverage(data["managedDevices"], data["compliancePolicies"])
    assert {r["displayName"][:6]: r["finding"] for r in out["policies"]} == {
        "CP-001": None, "CP-005": "exclusionOnly", "CP-099": "unassigned", "CP-IOS": None}
    assert out["policyFindings"] == 2
    # KSK-0001 is reported only as notAssigned; MAC-0001 has no status at all.
    assert [r["deviceName"] for r in out["devicesWithNoPolicyReported"]] == ["KSK-0001", "MAC-0001"]
    assert out["ambiguousNames"] == ["WS-0002"]


def test_stale_checkin(data):
    rows = it.evaluate_stale_checkin(data["managedDevices"], AS_OF)
    assert [(r["deviceName"], r["daysSinceSync"], r["band"]) for r in rows] == [
        ("KSK-0001", None, "noSync"), ("WS-0005", 121, "beyondCleanup"), ("WS-0004", 20, "beyondValidity")]


def test_stale_checkin_thresholds(data):
    rows = it.evaluate_stale_checkin(data["managedDevices"], AS_OF, validity_days=30, cleanup_days=120)
    assert [(r["deviceName"], r["band"]) for r in rows] == [("KSK-0001", "noSync"), ("WS-0005", "beyondCleanup")]


def test_device_posture(data):
    out = it.evaluate_posture(data["managedDevices"])
    assert (out["devices"], out["notEncrypted"], out["belowOsFloor"]) == (9, 3, 1)
    assert {r["deviceName"]: r["findings"] for r in out["findings"]} == {
        "KSK-0001": ["notEncrypted"], "MAC-0001": ["notEncrypted"], "WS-0002": ["notEncrypted", "belowOsFloor"]}


def test_device_posture_custom_floor(data):
    out = it.evaluate_posture(data["managedDevices"], {"Windows": "10.0.26200", "iOS": "26.0"}, encryption_os=())
    assert {r["deviceName"] for r in out["findings"]} == {"WS-0002", "WS-0003", "WS-0004", "KSK-0001", "IPH-0001"}
    assert out["notEncrypted"] == 0


def test_version_compare():
    assert it.version_tuple("10.0.22631.4317") == (10, 0, 22631, 4317)
    assert it._below("10.0.22631.4317", "10.0.26100") and not it._below("10.0.26100", "10.0.26100.0")
    assert it._below(None, "10.0.26100") and it._below("", "1")


def test_autopilot_profiles(data):
    out = it.evaluate_autopilot(data["autopilotDevices"])
    assert out["total"] == 6 and out["counts"]["assignedInSync"] == 2
    assert [(r["serialNumber"], r["status"]) for r in out["notInSync"]] == [
        ("SN-1004", "assignedOutOfSync"), ("SN-1003", "failed"), ("SN-1002", "notAssigned"), ("SN-1005", "pending")]
    assert out["notInSync"][1]["detail"] == "hardwareRequirementsNotMet"


def test_expected_results_file_matches(data):
    """tests/fixtures/expected.json's intune block is what the PowerShell tests compare against."""
    got = {
        "noncompliant": it.evaluate_noncompliant(data["managedDevices"], data["compliancePolicies"]),
        "coverage": it.evaluate_coverage(data["managedDevices"], data["compliancePolicies"]),
        "staleCheckin": it.evaluate_stale_checkin(data["managedDevices"], AS_OF),
        "posture": it.evaluate_posture(data["managedDevices"]),
        "autopilot": it.evaluate_autopilot(data["autopilotDevices"]),
    }
    assert json.loads(json.dumps(got)) == load("expected")["intune"]


def test_permissions_are_read_only():
    perms = {p for ps in it.PERMISSIONS.values() for p in ps}
    assert perms == {"DeviceManagementManagedDevices.Read.All", "DeviceManagementConfiguration.Read.All", "DeviceManagementServiceConfig.Read.All"}
    assert set(it.PERMISSIONS) == set(it.EVIDENCES)


# ------------------------------------------------------------ fetch functions (fake transport)


def test_fetch_devices_selects_no_personal_fields():
    g, fake = client({"/deviceManagement/managedDevices?$select=" + it.DEVICE_SELECT: {"value": [{"id": "md1"}]}})
    assert it.fetch_devices(g) == [{"id": "md1"}]
    url = fake.urls[0]
    assert url.startswith("https://graph.microsoft.com/v1.0/deviceManagement/managedDevices")
    for personal in ("userPrincipalName", "emailAddress", "userDisplayName", "userName"):
        assert personal not in url


def test_fetch_compliance_policies_embeds_assignments_and_statuses():
    g, fake = client(
        {
            "/deviceCompliancePolicies?$select=id,displayName": {"value": [{"id": "cp1", "displayName": "CP-001"}]},
            "/deviceCompliancePolicies/cp1/assignments": {"value": [{"id": "a1", "target": {}}]},
            "/deviceCompliancePolicies/cp1/deviceStatuses?$select=" + it.STATUS_SELECT: {"value": [{"id": "s1", "status": "compliant"}]},
        }
    )
    pols = it.fetch_compliance_policies(g)
    assert pols[0]["assignments"][0]["id"] == "a1" and pols[0]["deviceStatuses"][0]["id"] == "s1"
    assert all("userPrincipalName" not in u for u in fake.urls) and len(fake.urls) == 3


def test_fetch_autopilot_uses_beta_on_the_clouds_host():
    g, fake = client({"/beta/deviceManagement/windowsAutopilotDeviceIdentities?$select=" + it.AUTOPILOT_SELECT: {"value": []}}, cloud="gcchigh")
    assert it.fetch_autopilot(g) == []
    assert fake.urls[0].startswith("https://graph.microsoft.us/beta/deviceManagement/windowsAutopilotDeviceIdentities")


def test_cli_from_json(tmp_path, capsys):
    f = tmp_path / "intune.json"
    f.write_text((FIX / "intune.json").read_text(encoding="utf-8"), encoding="utf-8")
    assert it.main(["--from-json", str(f), "--as-of", "2026-10-30T00:00:00Z", "stale-checkin"]) == 0
    out = json.loads(capsys.readouterr().out)
    assert out["task"] == "stale-checkin" and "NIST SP 800-53 CM-8" in out["evidences"]
    assert out["result"][0]["deviceName"] == "KSK-0001"


def test_cli_os_floor(tmp_path, capsys):
    f = tmp_path / "intune.json"
    f.write_text((FIX / "intune.json").read_text(encoding="utf-8"), encoding="utf-8")
    assert it.main(["--from-json", str(f), "device-posture", "--os-floor", "Windows=10.0.26200"]) == 0
    assert json.loads(capsys.readouterr().out)["result"]["belowOsFloor"] == 4
