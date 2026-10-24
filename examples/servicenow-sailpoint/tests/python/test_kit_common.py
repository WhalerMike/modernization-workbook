import json

import pytest

import kit_common as kc
from conftest import FakeResponse, FakeSession


def test_config_env_overrides_file(tmp_path):
    path = tmp_path / "cfg.json"
    path.write_text(json.dumps({"SAILPOINT_TENANT": "from-file", "SN_INSTANCE": "contoso"}))
    cfg = kc.load_config(str(path), env={"SAILPOINT_TENANT": "from-env"})
    assert cfg["SAILPOINT_TENANT"] == "from-env"
    assert cfg["SN_INSTANCE"] == "contoso"
    assert cfg["SN_FINDING_TABLE"] == "u_identity_finding"


def test_config_file_refuses_secrets(tmp_path):
    path = tmp_path / "cfg.json"
    path.write_text(json.dumps({"SN_CLIENT_SECRET": "x"}))
    with pytest.raises(kc.KitError, match="must not contain secrets"):
        kc.load_config(str(path), env={})


@pytest.mark.parametrize("cloud,login,graph", [
    ("Global", "https://login.microsoftonline.com", "https://graph.microsoft.com"),
    ("USGov", "https://login.microsoftonline.us", "https://graph.microsoft.us"),
    ("USGovDoD", "https://login.microsoftonline.us", "https://dod-graph.microsoft.us"),
])
def test_graph_cloud_endpoints(cloud, login, graph):
    assert kc.graph_endpoints({"GRAPH_CLOUD": cloud}) == (login, graph)


def test_graph_cloud_rejects_unknown():
    with pytest.raises(kc.KitError):
        kc.graph_endpoints({"GRAPH_CLOUD": "GCC"})


def test_base_urls():
    assert kc.isc_base_url({"SAILPOINT_TENANT": "example"}) == "https://example.api.identitynow.com"
    assert kc.isc_base_url({"SAILPOINT_API_BASE": "https://alt.example/"}) == "https://alt.example"
    assert kc.sn_base_url({"SN_INSTANCE": "contoso"}) == "https://contoso.service-now.com"


def test_retry_after_seconds_and_date():
    assert kc.parse_retry_after("7") == 7.0
    from datetime import datetime, timezone
    now = datetime(2026, 10, 21, 7, 27, 50, tzinfo=timezone.utc).timestamp()
    assert kc.parse_retry_after("Wed, 21 Oct 2026 07:28:00 GMT", now=now) == pytest.approx(10.0)
    assert kc.parse_retry_after(None, default=3) == 3


def test_http_retries_429_with_retry_after():
    session = FakeSession()
    session.add("GET", "/x", FakeResponse(429, {"error": "slow"}, {"Retry-After": "2"}))
    session.add("GET", "/x", FakeResponse(200, {"ok": True}))
    slept = []
    http = kc.Http(session, sleep=slept.append)
    assert http.json("GET", "https://h/x") == {"ok": True}
    assert slept == [2.0]


def test_http_gives_up_after_max_retries():
    session = FakeSession().add("GET", "/x", FakeResponse(429, {}, {"Retry-After": "1"}), sticky=True)
    http = kc.Http(session, max_retries=2, sleep=lambda s: None)
    with pytest.raises(kc.KitError, match="HTTP 429"):
        http.json("GET", "https://h/x")
    assert len(session.calls) == 3


def test_isc_token_client_credentials():
    session = FakeSession().add("POST", "/oauth/token", FakeResponse(200, {"access_token": "isc-tok"}))
    headers = kc.isc_headers({"SAILPOINT_TENANT": "example", "SAILPOINT_CLIENT_ID": "cid"}, kc.Http(session),
                             env={"SAILPOINT_CLIENT_SECRET": "s"})
    assert headers["Authorization"] == "Bearer isc-tok"
    call = session.calls[0]
    assert call["url"] == "https://example.api.identitynow.com/oauth/token"
    assert call["data"]["grant_type"] == "client_credentials"


def test_isc_token_from_vault_skips_request():
    session = FakeSession()
    headers = kc.isc_headers({}, kc.Http(session), env={"SAILPOINT_ACCESS_TOKEN": "vault"})
    assert headers["Authorization"] == "Bearer vault" and not session.calls


def test_sn_oauth_then_basic():
    session = FakeSession().add("POST", "/oauth_token.do", FakeResponse(200, {"access_token": "sn-tok"}))
    cfg = {"SN_INSTANCE": "contoso", "SN_CLIENT_ID": "cid"}
    assert kc.sn_headers(cfg, kc.Http(session), env={"SN_CLIENT_SECRET": "s"})["Authorization"] == "Bearer sn-tok"
    basic = kc.sn_headers({"SN_INSTANCE": "contoso", "SN_USERNAME": "u"}, kc.Http(FakeSession()),
                          env={"SN_PASSWORD": "p"})
    assert basic["Authorization"].startswith("Basic ")
    with pytest.raises(kc.KitError):
        kc.sn_headers({"SN_INSTANCE": "contoso"}, kc.Http(FakeSession()), env={})


def test_graph_token_secret_fallback_uses_cloud_authority():
    session = FakeSession().add("POST", "login.microsoftonline.us", FakeResponse(200, {"access_token": "g"}))
    cfg = {"GRAPH_CLOUD": "USGov", "GRAPH_TENANT_ID": "tid", "GRAPH_CLIENT_ID": "cid"}
    headers = kc.graph_headers(cfg, kc.Http(session), env={"GRAPH_CLIENT_SECRET": "s"})
    assert headers["Authorization"] == "Bearer g"
    call = session.calls[0]
    assert call["url"] == "https://login.microsoftonline.us/tid/oauth2/v2.0/token"
    assert call["data"]["scope"] == "https://graph.microsoft.us/.default"


def test_client_assertion_shape():
    crypto = pytest.importorskip("cryptography")
    from datetime import datetime, timedelta, timezone

    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID

    assert crypto
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "kit-test")])
    now = datetime.now(timezone.utc)
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
            .serial_number(1).not_valid_before(now).not_valid_after(now + timedelta(days=1))
            .sign(key, hashes.SHA256()))
    cert_pem = cert.public_bytes(serialization.Encoding.PEM)
    key_pem = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                                serialization.NoEncryption())
    jwt = kc.build_client_assertion(cert_pem, key_pem, "cid", "https://login/x/token", now=1000)
    header_b64, claims_b64, _ = jwt.split(".")
    pad = lambda s: s + "=" * (-len(s) % 4)  # noqa: E731
    import base64
    header = json.loads(base64.urlsafe_b64decode(pad(header_b64)))
    claims = json.loads(base64.urlsafe_b64decode(pad(claims_b64)))
    assert header["alg"] == "PS256" and "x5t#S256" in header
    assert claims["iss"] == claims["sub"] == "cid" and claims["exp"] == 1600


def test_graph_paging_follows_next_link():
    session = FakeSession()
    session.add("GET", "/users?", FakeResponse(200, {"value": [{"id": 1}], "@odata.nextLink": "https://g/next"}))
    session.add("GET", "https://g/next", FakeResponse(200, {"value": [{"id": 2}]}))
    assert [u["id"] for u in kc.graph_get_all(kc.Http(session), "https://g/users?$top=1", {})] == [1, 2]


def test_isc_search_paging_uses_search_after():
    session = FakeSession()
    session.add("POST", "/v3/search", FakeResponse(200, [{"id": "a"}, {"id": "b"}]))
    session.add("POST", "/v3/search", FakeResponse(200, [{"id": "c"}]))
    rows = list(kc.isc_search_all(kc.Http(session), "https://t", {}, {"indices": ["identities"]}, page_size=2))
    assert [r["id"] for r in rows] == ["a", "b", "c"]
    assert session.calls[1]["json"]["searchAfter"] == ["b"]
    assert session.calls[0]["json"]["sort"] == ["id"]


def test_isc_list_and_sn_table_paging():
    session = FakeSession()
    session.add("GET", "/v3/accounts", FakeResponse(200, [{"id": 1}, {"id": 2}]))
    session.add("GET", "/v3/accounts", FakeResponse(200, []))
    assert len(list(kc.isc_list_all(kc.Http(session), "https://t/v3/accounts", {}, limit=2))) == 2
    assert session.calls[1]["params"]["offset"] == 2

    session = FakeSession()
    session.add("GET", "/api/now/table/t", FakeResponse(200, {"result": [{"a": 1}, {"a": 2}]}))
    session.add("GET", "/api/now/table/t", FakeResponse(200, {"result": [{"a": 3}]}))
    rows = list(kc.sn_table_all(kc.Http(session), "https://sn", "t", {}, "active=true", ["a"], limit=2))
    assert len(rows) == 3
    assert session.calls[1]["params"]["sysparm_offset"] == 2
    assert session.calls[0]["params"]["sysparm_fields"] == "a"


def test_sha256_is_order_independent():
    assert kc.sha256_hex({"a": 1, "b": 2}) == kc.sha256_hex({"b": 2, "a": 1})
