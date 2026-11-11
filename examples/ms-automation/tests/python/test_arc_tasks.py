import datetime as dt
import json
import re
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
KIT = HERE.parents[1]
FIX = KIT / "tests" / "fixtures"
sys.path.insert(0, str(KIT / "python"))

import arc_tasks as at  # noqa: E402
from armkit import ARG_PAGE_MAX, ArmClient, ArmError, IncompleteResult, load_arm_calls, required_role  # noqa: E402

AS_OF = dt.datetime(2026, 11, 3, tzinfo=dt.timezone.utc)
SUB = "00000000-0000-0000-0000-00000000000a"


def load(name):
    return json.loads((FIX / f"{name}.json").read_text(encoding="utf-8"))


class FakeArm:
    def __init__(self, responses):
        self.responses, self.calls = list(responses), []

    def __call__(self, method, url, headers, body):
        self.calls.append({"method": method, "url": url, "headers": headers, "body": json.loads(body) if body else None})
        status, hdrs, payload = self.responses.pop(0)
        return status, hdrs, json.dumps(payload).encode()


def client(responses, cloud="gcc"):
    fake, sleeps = FakeArm(responses), []
    return ArmClient(cloud, lambda scope: "t0ken", transport=fake, sleep=sleeps.append), fake, sleeps


# ------------------------------------------------------------ armkit


def test_arm_host_and_scope_follow_the_azure_cloud():
    assert ArmClient("gcc", lambda s: "t").root == "https://management.azure.com"
    assert ArmClient("gcchigh", lambda s: "t").scope == "https://management.usgovcloudapi.net/.default"
    assert ArmClient("dod", lambda s: "t").root == "https://management.usgovcloudapi.net"


def test_resource_graph_pages_with_skiptoken_and_same_query_and_scope():
    rows = [{"id": str(i)} for i in range(3)]
    g, fake, _ = client([(200, {}, {"data": rows[:2], "$skipToken": "T1", "resultTruncated": "false"}),
                         (200, {}, {"data": rows[2:], "resultTruncated": "false"})])
    out = g.resource_graph("resources | project id", subscriptions=[SUB])
    assert out == rows and len(fake.calls) == 2
    first, second = fake.calls[0]["body"], fake.calls[1]["body"]
    assert first["query"] == second["query"] and first["subscriptions"] == second["subscriptions"] == [SUB]
    assert first["options"]["$top"] == ARG_PAGE_MAX and second["options"]["$skipToken"] == "T1"
    assert fake.calls[0]["url"] == "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2024-04-01"
    assert fake.calls[0]["headers"]["Authorization"] == "Bearer t0ken"


def test_truncated_result_without_token_raises():
    g, _, _ = client([(200, {}, {"data": [{"id": "1"}], "resultTruncated": "true"})])
    with pytest.raises(IncompleteResult):
        g.resource_graph("resources | take 5", subscriptions=[SUB])


def test_resource_graph_needs_a_scope():
    g, _, _ = client([])
    with pytest.raises(ValueError, match="empty scope"):
        g.resource_graph("resources | project id")


def test_429_waits_retry_after_then_quota_reset():
    g, fake, sleeps = client([
        (429, {"retry-after": "4"}, {}),
        (429, {"x-ms-user-quota-resets-after": "00:00:03"}, {}),
        (200, {}, {"data": [], "resultTruncated": "false"}),
    ])
    assert g.resource_graph("resources | project id", subscriptions=[SUB]) == []
    assert sleeps == [4.0, 3.0] and len(fake.calls) == 3


def test_subscriptions_follow_next_link_and_keep_enabled():
    g, fake, _ = client([
        (200, {}, {"value": [{"subscriptionId": "b", "state": "Enabled"}], "nextLink": "https://management.azure.com/subscriptions?api-version=2022-12-01&$skiptoken=X"}),
        (200, {}, {"value": [{"subscriptionId": "a", "state": "Enabled"}, {"subscriptionId": "c", "state": "Disabled"}]}),
    ])
    assert g.subscriptions() == ["a", "b"]
    assert fake.calls[1]["url"].endswith("$skiptoken=X")


def test_next_link_to_another_host_is_refused():
    g, _, _ = client([(200, {}, {"value": [], "nextLink": "https://evil.example/subscriptions"})])
    with pytest.raises(ValueError, match="refusing"):
        g.subscriptions()


def test_gcchigh_client_refuses_the_commercial_host():
    g, _, _ = client([], cloud="gcchigh")
    with pytest.raises(ValueError):
        g.url("GET", "https://management.azure.com/subscriptions")


def test_undeclared_call_is_refused():
    g, _, _ = client([])
    with pytest.raises(PermissionError, match="undeclared"):
        g.request("GET", "/subscriptions/x/providers/Microsoft.HybridCompute/machines")


def test_error_raises_with_code():
    g, _, _ = client([(403, {}, {"error": {"code": "AuthorizationFailed"}})])
    with pytest.raises(ArmError) as e:
        g.subscriptions()
    assert e.value.code == "AuthorizationFailed"


# ------------------------------------------------------------ read-only guarantees


def test_calls_need_only_reader():
    assert required_role()["name"] == "Reader" and required_role()["actions"] == ["*/read"]
    for c in load_arm_calls():
        assert all(a.endswith("/read") for a in c.actions)
        assert c.method in ("GET", "POST")
    posts = [c for c in load_arm_calls() if c.method == "POST"]
    assert [c.id for c in posts] == ["resource-graph-query"]  # the one POST is a read (Resource Graph)


def test_every_task_declares_its_calls():
    for task in at.QUERIES:
        assert {c.id for c in load_arm_calls(task)} == {"subscriptions-list", "resource-graph-query"}


def test_queries_page_safely_and_read_no_settings():
    for queries in at.QUERIES.values():
        for q in queries.values():
            assert re.search(r"project id = tolower\(id\)|by assignmentId", q)
            assert not re.search(r"\b(take|limit|sample)\b", q)
            assert re.search(r"\| order by (id|assignmentId) asc$", q)  # a unique sort keeps pages stable
            assert "settings" not in q.lower()


# ------------------------------------------------------------ the five checks


def test_extensions():
    d = load("arc")
    r = at.evaluate_extensions(d["machines"], d["extensions"])
    assert (r["machinesWithFindings"], r["missingRequired"], r["extensionsNotSucceeded"]) == (4, 2, 2)
    by = {f["name"]: f for f in r["findings"]}
    assert by["SRV-LEG-01"]["missing"] == ["Microsoft.Azure.AzureDefenderForServers/MDE.Windows"]
    assert len(by["lnx-web-02"]["missing"]) == 2
    assert by["SRV-APP-02"]["notSucceeded"][0]["provisioningState"] == "Failed"
    assert by["lnx-web-01"]["notSucceeded"][0]["provisioningState"] == "Creating"


def test_private_link():
    r = at.evaluate_private_link(load("arc")["machines"])
    assert r["publicEndpoint"] == 3 and [f["name"] for f in r["findings"]] == ["lnx-web-02", "SRV-APP-02", "SRV-LEG-01"]
    assert list(r["privateLinkScopes"].values()) == [4]


def test_lifecycle():
    d = load("arc")
    r = at.evaluate_lifecycle(d["machines"], d["sqlInstances"], at.load_lifecycle(), AS_OF)
    assert r["counts"] == {"unsupported": 2, "esuNotConfirmed": 2, "esuCovered": 0, "endingSoon": 1, "supported": 4}
    states = [(f["name"], f["state"]) for f in r["findings"]]
    assert states == [("SRV-LEG-01", "unsupported"), ("OLD-SQL-07_MSSQLSERVER", "unsupported"),
                      ("SRV-DB-01_MSSQLSERVER", "esuNotConfirmed"), ("SRV-LEG-01_MSSQLSERVER", "esuNotConfirmed"),
                      ("SRV-APP-02", "endingSoon")]
    assert sorted(u["name"] for u in r["notInTable"]) == ["SRV-APP-01_SQLEXPRESS", "lnx-web-01", "lnx-web-02"]


def test_lifecycle_esu_assignment_counts_only_inside_the_esu_window():
    m = [{"id": "x", "name": "W12", "osSku": "Windows Server 2012 R2 Standard", "esuAssignment": "Assigned"}]
    before = dt.datetime(2026, 10, 1, tzinfo=dt.timezone.utc)
    assert at.evaluate_lifecycle(m, [], at.load_lifecycle(), before)["findings"][0]["state"] == "esuCovered"
    assert at.evaluate_lifecycle(m, [], at.load_lifecycle(), AS_OF)["findings"][0]["state"] == "unsupported"


def test_lifecycle_esu_offered_without_an_end_date():
    m = [{"id": "x", "name": "W16", "osSku": "Windows Server 2016 Standard", "esuAssignment": "NotAssigned"}]
    after = dt.datetime(2027, 3, 1, tzinfo=dt.timezone.utc)
    f = at.evaluate_lifecycle(m, [], at.load_lifecycle(), after)["findings"][0]
    assert (f["state"], f["date"]) == ("esuNotConfirmed", None)


def test_lifecycle_window():
    d = load("arc")
    r = at.evaluate_lifecycle(d["machines"], d["sqlInstances"], at.load_lifecycle(), AS_OF, window_days=60)
    assert r["counts"]["endingSoon"] == 0 and r["counts"]["supported"] == 5


def test_sql_inventory():
    d = load("arc")
    r = at.evaluate_sql(d["machines"], d["sqlInstances"])
    assert r["instances"] == 5 and r["byEdition"] == {"Enterprise": 1, "Express": 1, "Standard": 3}
    assert {f["name"]: f["reasons"] for f in r["findings"]} == {
        "OLD-SQL-07_MSSQLSERVER": ["host not found among the Arc machines in scope"],
        "SRV-LEG-01_MSSQLSERVER": ["instance status Disconnected", "host status Disconnected"],
    }


def test_policy_summary():
    d = load("arc")
    r = at.evaluate_policy(d["assignments"], d["policyStates"])
    assert r["notEnforced"] == ["Require Arc private link scope"] and r["noStates"] == ["Tag taxonomy"]
    assert [x["displayName"] for x in r["withNonCompliant"]] == ["Arc server baseline", "Require Arc private link scope"]
    assert len(r["statesForUnknownAssignments"]) == 1


def test_empty_scope_is_flagged_not_clean():
    r = at.evaluate_private_link([])
    assert r["emptyScope"] is True and r["publicEndpoint"] == 0


def test_expected_results_file_matches():
    """tests/fixtures/expected-arc.json is what the PowerShell tests compare against."""
    d = load("arc")
    got = {t: at.evaluate(t, d, AS_OF) for t in at.QUERIES}
    assert json.loads(json.dumps(got)) == load("expected-arc")


def test_cli_from_json(capsys):
    assert at.main(["--from-json", str(FIX / "arc.json"), "--as-of", "2026-11-03T00:00:00Z", "policy-summary"]) == 0
    out = json.loads(capsys.readouterr().out)
    assert out["task"] == "policy-summary" and "NIST SP 800-53 CA-7" in out["evidences"]
