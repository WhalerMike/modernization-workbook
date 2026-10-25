import datetime as dt
import json
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
FIX = HERE.parent / "fixtures"
sys.path.insert(0, str(HERE.parents[1] / "python"))

import entra_tasks as et  # noqa: E402
from graphkit import BATCH_LIMIT, GraphClient, GraphError, retry_after  # noqa: E402

AS_OF = dt.datetime(2026, 10, 25, tzinfo=dt.timezone.utc)


def load(name):
    return json.loads((FIX / f"{name}.json").read_text(encoding="utf-8"))


class FakeGraph:
    """Replays queued (status, headers, body) responses and records every call."""

    def __init__(self, responses):
        self.responses, self.calls = list(responses), []

    def __call__(self, method, url, headers, body):
        self.calls.append({"method": method, "url": url, "headers": headers, "body": json.loads(body) if body else None})
        status, hdrs, payload = self.responses.pop(0)
        return status, hdrs, json.dumps(payload).encode()


def client(responses, cloud="gcc", **kw):
    fake = FakeGraph(responses)
    sleeps = []
    g = GraphClient(cloud, lambda scope: "t0ken", transport=fake, sleep=sleeps.append, **kw)
    return g, fake, sleeps


# ------------------------------------------------------------ graphkit


def test_cloud_endpoints_and_scope():
    assert GraphClient("gcc", lambda s: "t").base == "https://graph.microsoft.com/v1.0"
    assert GraphClient("gcchigh", lambda s: "t").scope == "https://graph.microsoft.us/.default"
    assert GraphClient("dod", lambda s: "t").base == "https://dod-graph.microsoft.us/v1.0"
    with pytest.raises(ValueError):
        GraphClient("gcc-moderate", lambda s: "t")


def test_paging_follows_next_link_and_stops():
    g, fake, _ = client(
        [
            (200, {}, {"value": [{"id": 1}, {"id": 2}], "@odata.nextLink": "https://graph.microsoft.com/v1.0/users?$skiptoken=X"}),
            (200, {}, {"value": [{"id": 3}]}),
        ]
    )
    assert [u["id"] for u in g.get_all("/users")] == [1, 2, 3]
    assert fake.calls[1]["url"].endswith("$skiptoken=X")
    assert fake.calls[0]["headers"]["Authorization"] == "Bearer t0ken"
    assert fake.calls[0]["headers"]["x-ms-throttle-priority"] == "Low"


def test_next_link_to_another_host_is_refused():
    g, _, _ = client([(200, {}, {"value": [], "@odata.nextLink": "https://evil.example/steal"})])
    with pytest.raises(ValueError, match="refusing"):
        list(g.get_all("/users"))


def test_gcchigh_client_refuses_worldwide_link():
    g, _, _ = client([], cloud="gcchigh")
    with pytest.raises(ValueError):
        g.url("https://graph.microsoft.com/v1.0/users")


def test_429_waits_retry_after_then_succeeds():
    g, fake, sleeps = client([(429, {"retry-after": "7"}, {"error": {"code": "TooManyRequests"}}), (200, {}, {"id": "ok"})])
    assert g.request("GET", "/organization")["id"] == "ok"
    assert sleeps == [7.0] and len(fake.calls) == 2


def test_gives_up_after_max_retries():
    g, _, sleeps = client([(503, {}, {})] * 3, max_retries=2)
    with pytest.raises(GraphError) as e:
        g.request("GET", "/users")
    assert e.value.status == 503 and sleeps == [1.0, 2.0]


def test_403_raises_with_code():
    g, _, _ = client([(403, {}, {"error": {"code": "Authorization_RequestDenied"}})])
    with pytest.raises(GraphError) as e:
        g.request("GET", "/users")
    assert e.value.code == "Authorization_RequestDenied"


def test_advanced_query_header():
    g, fake, _ = client([(200, {}, {"value": []})])
    list(g.get_all("/users?$count=true&$filter=endsWith(mail,'@contoso.example')", advanced=True))
    assert fake.calls[0]["headers"]["ConsistencyLevel"] == "eventual"


def test_retry_after_fallback():
    assert retry_after({}, 0) == 1.0 and retry_after({}, 3) == 8.0 and retry_after({}, 10) == 60.0
    assert retry_after({"retry-after": "bad"}, 1) == 2.0


def test_batch_chunks_of_20_and_retries_throttled_items():
    reqs = [{"id": str(i), "method": "GET", "url": f"/users/u{i}"} for i in range(45)]

    def ok(chunk, throttle=()):
        return (200, {}, {"responses": [
            {"id": r["id"], "status": 429 if r["id"] in throttle else 200, "headers": {"Retry-After": "3"} if r["id"] in throttle else {}, "body": {}}
            for r in chunk
        ]})

    responses = [ok(reqs[0:20], throttle={"5"}), ok(reqs[20:40]), ok(reqs[40:45]), ok([reqs[5]])]
    g, fake, sleeps = client(responses)
    out = g.batch(reqs)
    assert len(out) == 45 and all(r["status"] == 200 for r in out.values())
    assert [len(c["body"]["requests"]) for c in fake.calls] == [20, 20, 5, 1]
    assert all(len(c["body"]["requests"]) <= BATCH_LIMIT for c in fake.calls)
    assert sleeps == [3.0]


def test_batch_rejects_duplicate_ids():
    g, _, _ = client([])
    with pytest.raises(ValueError):
        g.batch([{"id": "1", "method": "GET", "url": "/me"}] * 2)


def test_delta_returns_items_and_new_link():
    g, _, _ = client(
        [
            (200, {}, {"value": [{"id": "a"}], "@odata.nextLink": "https://graph.microsoft.com/v1.0/users/delta?$skiptoken=1"}),
            (200, {}, {"value": [{"id": "b"}], "@odata.deltaLink": "https://graph.microsoft.com/v1.0/users/delta?$deltatoken=Z"}),
        ]
    )
    items, link = g.delta("/users/delta?$select=id")
    assert [i["id"] for i in items] == ["a", "b"] and link.endswith("$deltatoken=Z")


# ------------------------------------------------------------ Entra tasks


def test_stale_users():
    rows = et.evaluate_stale_users(load("users")["users"], AS_OF, 90)
    assert [(r["userPrincipalName"].split("@")[0], r["daysIdle"]) for r in rows] == [("cy", None), ("ben", 116), ("fay", 90)]


def test_ca_export():
    d = load("ca")
    out = et.evaluate_ca_export(d["policies"], d["namedLocations"])
    assert out["counts"] == {"enabled": 1, "enabledForReportingButNotEnforced": 1, "disabled": 1}
    assert [s["displayName"][:5] for s in out["summary"]] == ["CA001", "CA022", "CA099"]
    assert out["summary"][1]["grant"] == ["authenticationStrength"] and out["summary"][1]["reportOnly"]
    assert out["summary"][2]["grant"] == ["compliantDevice", "mfa"]
    assert set(out["policies"]) == {"p-legacy", "p-pr", "p-old"} and "loc1" in out["namedLocations"]


def test_pim():
    d = load("pim")
    pra = "e8611ab8-c189-46e8-94e1-60213ab1f814"
    out = et.evaluate_pim(d["roleDefinitions"], d["eligibility"], d["assignments"], {et.GLOBAL_ADMIN, pra})
    assert out["globalAdministrators"] == 3 and out["MS.AAD.7.1v1"] == "pass"
    assert [(r["principalId"], r["role"]) for r in out["permanentActive"]] == [("bg1", "Global Administrator"), ("x9", "Privileged Role Administrator")]
    assert out["MS.AAD.7.4v1"] == "fail"


def test_pim_too_few_global_admins():
    d = load("pim")
    out = et.evaluate_pim(d["roleDefinitions"], d["eligibility"][:1], [], {et.GLOBAL_ADMIN})
    assert out["globalAdministrators"] == 1 and out["MS.AAD.7.1v1"] == "fail" and out["MS.AAD.7.4v1"] == "pass"


def test_app_credentials():
    rows = et.evaluate_app_credentials(load("apps")["applications"], AS_OF)
    got = [(r["keyId"], r["lifetimeDays"], r["daysLeft"], r["flags"]) for r in rows]
    assert got == [
        ("k4", 92, -54, ["MS.AAD.5.5v1", "expired"]),
        ("k3", 374, 16, ["MS.AAD.5.7v1", "expiring"]),
        ("k1", 365, 68, ["MS.AAD.5.5v1", "MS.AAD.5.6v1"]),
        ("k2", 365, 127, []),
        ("k5", 1827, 799, ["MS.AAD.5.7v1"]),
    ]


def test_mfa():
    out = et.evaluate_mfa(load("mfa")["registrationDetails"])
    assert out == {
        "members": 4,
        "notMfaRegistered": 1,
        "noPhishingResistantMethod": 2,
        "admins": 2,
        "adminsNoPhishingResistantMethod": ["ben@contoso.example"],
    }


def test_expected_results_file_matches(tmp_path):
    """tests/fixtures/expected.json is what the PowerShell tests compare against."""
    exp = load("expected")
    d = load("ca")
    ca = et.evaluate_ca_export(d["policies"], d["namedLocations"])
    p = load("pim")
    got = {
        "staleUsers": et.evaluate_stale_users(load("users")["users"], AS_OF, 90),
        "ca": {"summary": ca["summary"], "counts": ca["counts"]},
        "pim": et.evaluate_pim(p["roleDefinitions"], p["eligibility"], p["assignments"], {et.GLOBAL_ADMIN, "e8611ab8-c189-46e8-94e1-60213ab1f814"}),
        "appCredentials": et.evaluate_app_credentials(load("apps")["applications"], AS_OF),
        "mfa": et.evaluate_mfa(load("mfa")["registrationDetails"]),
    }
    assert json.loads(json.dumps(got)) == exp


def test_cli_from_json(tmp_path, capsys):
    f = tmp_path / "apps.json"
    f.write_text((FIX / "apps.json").read_text(encoding="utf-8"), encoding="utf-8")
    assert et.main(["--from-json", str(f), "--as-of", "2026-10-25T00:00:00Z", "app-credentials"]) == 0
    assert json.loads(capsys.readouterr().out)[0]["keyId"] == "k4"
