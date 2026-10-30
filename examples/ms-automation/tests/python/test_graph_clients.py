"""Developer workbook Chapter 02: the client pattern for worldwide, GCC, GCC High and DoD.

Each test pins one behavior the chapter's gap table says the client adds to Microsoft's
sample: the cloud's endpoints (Graph and Resource Manager), least privilege per call,
paging, Retry-After, and beta calls the run doesn't depend on. Nothing here calls the
network: a fake transport answers, and tokens are unsigned test JWTs.
"""

import base64
import json
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "python"))

import entra_tasks as et  # noqa: E402
import intune_tasks as it  # noqa: E402
from graphkit import (  # noqa: E402
    CLOUDS,
    GraphClient,
    audit_roles,
    endpoints,
    load_calls,
    permissions_for,
    preflight,
    retry_after,
    scope_for,
    token_roles,
    try_beta,
)


def jwt(claims: dict) -> str:
    """An unsigned token with the given claims. Shape only; no real token is ever used."""
    enc = lambda d: base64.urlsafe_b64encode(json.dumps(d).encode()).rstrip(b"=").decode()  # noqa: E731
    return f"{enc({'alg': 'none', 'typ': 'JWT'})}.{enc(claims)}.sig"


class Fake:
    """Replays queued (status, headers, body) responses and records every call."""

    def __init__(self, responses):
        self.responses, self.calls = list(responses), []

    def __call__(self, method, url, headers, body):
        self.calls.append({"method": method, "url": url, "headers": dict(headers)})
        status, hdrs, payload = self.responses.pop(0)
        return status, hdrs, json.dumps(payload).encode()


def graph(responses=(), cloud="gcc", **kw):
    fake, sleeps = Fake(responses), []
    return GraphClient(cloud, lambda scope: "t0ken", transport=fake, sleep=sleeps.append, **kw), fake, sleeps


# ------------------------------------------------------------ the right cloud


EXPECTED_CLOUDS = {k: v for k, v in json.loads((HERE.parent / "fixtures" / "clouds.json").read_text(encoding="utf-8")).items() if not k.startswith("_")}


@pytest.mark.parametrize("cloud", sorted(EXPECTED_CLOUDS))
def test_endpoints_per_cloud(cloud):
    # tests/fixtures/clouds.json is shared with the Pester tests, so both clients agree.
    assert endpoints(cloud) == EXPECTED_CLOUDS[cloud]
    assert sorted(CLOUDS) == sorted(EXPECTED_CLOUDS)


def test_gcc_is_the_worldwide_service_with_commercial_resource_manager():
    # The target estate: Microsoft 365 GCC with commercial Azure. Nothing about it is a .us host.
    gcc = endpoints("gcc")
    assert gcc == endpoints("global")
    assert all(".us" not in v for k, v in gcc.items() if k.endswith(("login", "graph", "arm")))
    assert scope_for("gcc") == "https://graph.microsoft.com/.default"
    assert scope_for("gcc", "arm") == "https://management.azure.com/.default"


def test_unknown_cloud_names_are_refused_not_defaulted():
    for name in ("GCCHigh", "gcc-moderate", "usgov", "", "Global"):
        with pytest.raises(ValueError):
            endpoints(name)
        with pytest.raises(ValueError):
            GraphClient(name, lambda s: "t")
    with pytest.raises(ValueError):
        scope_for("gcc", "keyvault")


def test_endpoints_returns_a_copy():
    e = endpoints("gcc")
    e["graph"] = "https://graph.contoso.example"
    assert CLOUDS["gcc"]["graph"] == "https://graph.microsoft.com"


def test_dod_token_never_goes_to_the_gcchigh_host():
    g, _, _ = graph(cloud="dod")
    with pytest.raises(ValueError, match="refusing"):
        g.url("https://graph.microsoft.us/v1.0/users")
    assert g.url("/users") == "https://dod-graph.microsoft.us/v1.0/users"


# ------------------------------------------------------------ least privilege per call


def test_every_task_permission_is_the_union_of_its_calls():
    for task, perms in {**et.PERMISSIONS, **it.PERMISSIONS}.items():
        assert permissions_for(load_calls(task)) == sorted(perms), task


def test_every_declared_call_names_a_stage_and_least_privileged_permissions():
    for c in load_calls():
        assert c.method == "GET", c.id  # the example only reads
        assert c.stage in ("v1.0", "beta") and c.version == c.stage, c.id
        assert c.permissions and not any(p.endswith("ReadWrite.All") for p in c.permissions), c.id


def test_a_task_client_refuses_a_call_outside_its_list():
    g, fake, _ = graph(calls=load_calls("ca-export"))
    with pytest.raises(PermissionError, match="undeclared call"):
        g.request("GET", "/users")
    assert fake.calls == []


def test_the_fetch_functions_make_only_their_tasks_declared_calls():
    def answer_everything(n):
        return [(200, {}, {"value": []})] * n

    cases = [
        ("stale-users", et.fetch_users, 1),
        ("ca-export", et.fetch_ca, 2),
        ("pim-report", et.fetch_pim, 3),
        ("app-credentials", et.fetch_apps, 1),
        ("mfa-registration", et.fetch_mfa, 1),
        ("stale-checkin", it.fetch_devices, 1),
    ]
    for task, fetch, n in cases:
        g, fake, _ = graph(answer_everything(n), calls=load_calls(task))
        fetch(g)
        assert len(fake.calls) == n, task
    g, fake, _ = graph(
        [(200, {}, {"value": [{"id": "cp1"}]}), (200, {}, {"value": []}), (200, {}, {"value": []})],
        calls=load_calls("compliance-coverage"),
    )
    it.fetch_compliance_policies(g)
    assert [c["url"].split("?")[0].rsplit("/", 1)[-1] for c in fake.calls] == ["deviceCompliancePolicies", "assignments", "deviceStatuses"]


def test_batch_checks_each_request_inside():
    g, fake, _ = graph(calls=load_calls("stale-checkin"))
    with pytest.raises(PermissionError):
        g.batch([{"id": "1", "method": "GET", "url": "/deviceManagement/managedDevices"}, {"id": "2", "method": "GET", "url": "/users"}])
    assert fake.calls == []


def test_token_roles_and_audit():
    t = jwt({"aud": "https://graph.microsoft.com", "roles": ["Policy.Read.All", "Directory.Read.All"]})
    assert token_roles(t) == {"Policy.Read.All", "Directory.Read.All"}
    assert audit_roles(t, ["Policy.Read.All"]) == {"missing": [], "extra": ["Directory.Read.All"]}
    assert audit_roles(t, ["Policy.Read.All", "AuditLog.Read.All"])["missing"] == ["AuditLog.Read.All"]
    assert token_roles(jwt({"aud": "x"})) == set()
    with pytest.raises(ValueError):
        token_roles("not-a-jwt")


def test_preflight_stops_on_missing_and_warns_on_extra():
    msgs = []
    over = GraphClient("gcc", lambda s: jwt({"roles": ["Policy.Read.All", "Policy.ReadWrite.ConditionalAccess"]}))
    assert preflight(over, ["Policy.Read.All"], msgs.append) is True
    assert msgs == ["warning: token also holds Policy.ReadWrite.ConditionalAccess, which this task doesn't use"]
    under = GraphClient("gcc", lambda s: jwt({"roles": []}))
    assert preflight(under, ["Policy.Read.All"], msgs.append) is False
    assert msgs[-1].startswith("token lacks Policy.Read.All")


def test_the_token_is_asked_for_the_clouds_graph_scope():
    asked = []
    GraphClient("dod", lambda s: asked.append(s) or jwt({"roles": []})).audit_token([])
    assert asked == ["https://dod-graph.microsoft.us/.default"]


# ------------------------------------------------------------ paging


def test_headers_go_on_every_page_not_only_the_first():
    g, fake, _ = graph(
        [
            (200, {}, {"value": [{"id": 1}], "@odata.nextLink": "https://graph.microsoft.com/v1.0/users?$skiptoken=A"}),
            (200, {}, {"value": [{"id": 2}]}),
        ]
    )
    assert [u["id"] for u in g.get_all("/users?$count=true", advanced=True)] == [1, 2]
    for c in fake.calls:
        assert c["headers"]["ConsistencyLevel"] == "eventual" and c["headers"]["x-ms-throttle-priority"] == "Low"


def test_a_throttled_page_is_retried_with_the_last_good_link():
    link = "https://graph.microsoft.com/v1.0/users?$skiptoken=GOOD"
    g, fake, sleeps = graph(
        [
            (200, {}, {"value": [{"id": 1}], "@odata.nextLink": link}),
            (429, {"retry-after": "2"}, {"error": {"code": "TooManyRequests"}}),
            (200, {}, {"value": [{"id": 2}]}),
        ]
    )
    assert [u["id"] for u in g.get_all("/users")] == [1, 2]
    assert [c["url"] for c in fake.calls[1:]] == [link, link] and sleeps == [2.0]


# ------------------------------------------------------------ Retry-After


def test_retry_after_reads_an_http_date():
    now = 1_000_000_000.0  # 2001-09-09T01:46:40Z
    assert retry_after({"retry-after": "Sun, 09 Sep 2001 01:46:50 GMT"}, 0, now=now) == 10.0
    assert retry_after({"retry-after": "Sun, 09 Sep 2001 01:46:00 GMT"}, 0, now=now) == 0.0


def test_no_retry_after_header_backs_off():
    # Learn's throttling limits page: conditional access resources don't send Retry-After on 429.
    g, _, sleeps = graph([(429, {}, {}), (429, {}, {}), (200, {}, {"value": []})], calls=load_calls("ca-export"))
    list(g.get_all("/identity/conditionalAccess/policies"))
    assert sleeps == [1.0, 2.0]


# ------------------------------------------------------------ beta without depending on it


def test_an_undeclared_beta_call_is_refused_even_without_a_list():
    g, fake, _ = graph()
    with pytest.raises(PermissionError, match="undeclared beta call"):
        g.request("GET", "https://graph.microsoft.com/beta/users")
    assert fake.calls == []


def test_v1_calls_without_a_list_still_work():
    g, _, _ = graph([(200, {}, {"id": "org"})])
    assert g.request("GET", "/organization")["id"] == "org"


def test_try_beta_reports_not_evaluated_on_400_and_404_but_raises_on_403():
    path = "/deviceManagement/windowsAutopilotDeviceIdentities"
    for status, code in ((400, "BadRequest"), (404, "ResourceNotFound")):
        g, _, _ = graph([(status, {}, {"error": {"code": code}})])
        assert try_beta(g, path) == {"stage": "beta", "available": False, "items": [], "reason": f"Graph {status} {code}"}
    g, _, _ = graph([(403, {}, {"error": {"code": "Forbidden"}})])
    with pytest.raises(Exception, match="403"):
        try_beta(g, path)


def test_try_beta_on_an_undeclared_path_makes_no_call():
    g, fake, _ = graph()
    r = try_beta(g, "/users")
    assert r["available"] is False and "undeclared beta call" in r["reason"] and fake.calls == []
