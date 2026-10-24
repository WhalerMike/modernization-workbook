"""Shared pieces for the ServiceNow + SailPoint ISC example clients.

Illustrative code: unit-tested against mocked responses, not yet proven
against live tenants. Python 3.10+, standard library plus ``requests``.

What lives here:
  * configuration from environment variables or a JSON config file
    (secrets are only ever read from the environment or a vault-fed token);
  * token acquisition for SailPoint ISC, ServiceNow and Microsoft Graph;
  * one HTTP wrapper that retries 429 and 503 using Retry-After;
  * paging helpers for Graph (@odata.nextLink), ISC Search (searchAfter),
    ISC list APIs (limit/offset) and the ServiceNow Table API
    (sysparm_limit/sysparm_offset).
"""

from __future__ import annotations

import base64
import email.utils
import hashlib
import json
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Iterable, Iterator, Mapping

import requests

KIT_VERSION = "0.1.0-pass1"

# Keys a config file may NOT carry. Secrets come from the environment or a
# vault-fed token variable, never from a file that might be committed.
SECRET_KEYS = {
    "SAILPOINT_CLIENT_SECRET",
    "SAILPOINT_ACCESS_TOKEN",
    "SN_CLIENT_SECRET",
    "SN_PASSWORD",
    "SN_ACCESS_TOKEN",
    "GRAPH_CLIENT_SECRET",
    "GRAPH_ACCESS_TOKEN",
}

CONFIG_KEYS = {
    "SAILPOINT_TENANT",
    "SAILPOINT_API_BASE",
    "SAILPOINT_CLIENT_ID",
    "SN_INSTANCE",
    "SN_BASE_URL",
    "SN_CLIENT_ID",
    "SN_USERNAME",
    "SN_FINDING_API_PATH",
    "SN_FINDING_TABLE",
    "SN_STATE_AWAITING_VERIFICATION",
    "SN_STATE_CLOSED",
    "SN_STATE_REOPENED",
    "GRAPH_TENANT_ID",
    "GRAPH_CLIENT_ID",
    "GRAPH_CERT_PATH",
    "GRAPH_CERT_THUMBPRINT",
    "GRAPH_CLOUD",
    "ISC_EMPLOYEE_ID_ATTRIBUTE",
    "ISC_AUTHORITATIVE_SOURCES",
    "ALLOWED_WRITER_APP_IDS",
} | SECRET_KEYS

DEFAULTS = {
    "SN_FINDING_API_PATH": "/api/x_example_idkit/identity_findings/finding",
    "SN_FINDING_TABLE": "u_identity_finding",
    # Program design: a custom task state value for "Awaiting verification".
    "SN_STATE_AWAITING_VERIFICATION": "18",
    "SN_STATE_CLOSED": "3",
    "SN_STATE_REOPENED": "1",
    "GRAPH_CLOUD": "Global",
    "ISC_EMPLOYEE_ID_ATTRIBUTE": "employeeNumber",
}

# Microsoft Learn, "Microsoft Graph national cloud deployments".
# GCC (Microsoft 365 Moderate) uses the worldwide endpoints.
GRAPH_CLOUDS = {
    "Global": ("https://login.microsoftonline.com", "https://graph.microsoft.com"),
    "USGov": ("https://login.microsoftonline.us", "https://graph.microsoft.us"),
    "USGovDoD": ("https://login.microsoftonline.us", "https://dod-graph.microsoft.us"),
}


class KitError(Exception):
    """Raised for configuration or API problems the caller should see."""


# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

def load_config(path: str | None = None, env: Mapping[str, str] | None = None) -> dict[str, str]:
    """Merge defaults, an optional JSON config file, then environment variables.

    Environment variables win over the file. A secret key found in the file is
    refused, so a committed config file can never carry one.
    """
    env = os.environ if env is None else env
    cfg: dict[str, str] = dict(DEFAULTS)
    if path:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        bad = sorted(k for k in data if k in SECRET_KEYS)
        if bad:
            raise KitError(
                "Config file must not contain secrets: " + ", ".join(bad)
                + ". Set them as environment variables or fetch a token from your vault."
            )
        for key, value in data.items():
            if key in CONFIG_KEYS and value is not None:
                cfg[key] = str(value)
    for key in CONFIG_KEYS:
        if env.get(key):
            cfg[key] = env[key]
    return cfg


def isc_base_url(cfg: Mapping[str, str]) -> str:
    """ISC API base, https://{tenant}.api.identitynow.com unless overridden."""
    if cfg.get("SAILPOINT_API_BASE"):
        return cfg["SAILPOINT_API_BASE"].rstrip("/")
    tenant = cfg.get("SAILPOINT_TENANT")
    if not tenant:
        raise KitError("Set SAILPOINT_TENANT (or SAILPOINT_API_BASE).")
    return f"https://{tenant}.api.identitynow.com"


def sn_base_url(cfg: Mapping[str, str]) -> str:
    """ServiceNow base, https://{instance}.service-now.com unless overridden."""
    if cfg.get("SN_BASE_URL"):
        return cfg["SN_BASE_URL"].rstrip("/")
    instance = cfg.get("SN_INSTANCE")
    if not instance:
        raise KitError("Set SN_INSTANCE (or SN_BASE_URL).")
    return f"https://{instance}.service-now.com"


def graph_endpoints(cfg: Mapping[str, str]) -> tuple[str, str]:
    """Return (login authority root, Graph root) for GRAPH_CLOUD."""
    cloud = cfg.get("GRAPH_CLOUD", "Global")
    if cloud not in GRAPH_CLOUDS:
        raise KitError(f"GRAPH_CLOUD must be one of {sorted(GRAPH_CLOUDS)}; got {cloud!r}.")
    return GRAPH_CLOUDS[cloud]


# --------------------------------------------------------------------------
# HTTP with retries
# --------------------------------------------------------------------------

def parse_retry_after(value: str | None, default: float = 5.0, now: float | None = None) -> float:
    """Retry-After is either delta-seconds or an HTTP date."""
    if not value:
        return default
    value = value.strip()
    if value.isdigit():
        return float(value)
    try:
        when = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return default
    now = time.time() if now is None else now
    return max(0.0, when.timestamp() - now)


class Http:
    """A thin requests wrapper: retries 429/503 honoring Retry-After."""

    RETRY_STATUSES = (429, 503)

    def __init__(self, session: Any | None = None, max_retries: int = 5,
                 sleep: Callable[[float], None] = time.sleep, timeout: float = 60.0):
        self.session = session or requests.Session()
        self.max_retries = max_retries
        self.sleep = sleep
        self.timeout = timeout

    def request(self, method: str, url: str, **kwargs: Any) -> Any:
        kwargs.setdefault("timeout", self.timeout)
        attempt = 0
        while True:
            response = self.session.request(method, url, **kwargs)
            if response.status_code in self.RETRY_STATUSES and attempt < self.max_retries:
                delay = parse_retry_after(response.headers.get("Retry-After"),
                                          default=min(2 ** attempt, 60))
                self.sleep(delay)
                attempt += 1
                continue
            if response.status_code >= 400:
                raise KitError(f"{method} {url} failed: HTTP {response.status_code} {response.text[:300]}")
            return response

    def json(self, method: str, url: str, **kwargs: Any) -> Any:
        response = self.request(method, url, **kwargs)
        if not response.content:
            return None
        return response.json()


# --------------------------------------------------------------------------
# Tokens
# --------------------------------------------------------------------------

def isc_headers(cfg: Mapping[str, str], http: Http, env: Mapping[str, str] | None = None) -> dict[str, str]:
    """Bearer header for ISC: a vault-fed token, else client credentials.

    Token endpoint: POST https://{tenant}.api.identitynow.com/oauth/token
    (SailPoint Developer, "Authentication").
    """
    env = os.environ if env is None else env
    token = env.get("SAILPOINT_ACCESS_TOKEN")
    if not token:
        client_id = cfg.get("SAILPOINT_CLIENT_ID")
        secret = env.get("SAILPOINT_CLIENT_SECRET")
        if not client_id or not secret:
            raise KitError("Set SAILPOINT_ACCESS_TOKEN, or SAILPOINT_CLIENT_ID and SAILPOINT_CLIENT_SECRET.")
        body = http.json("POST", isc_base_url(cfg) + "/oauth/token", data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": secret,
        })
        token = body["access_token"]
    return {"Authorization": f"Bearer {token}", "Accept": "application/json"}


def sn_headers(cfg: Mapping[str, str], http: Http, env: Mapping[str, str] | None = None) -> dict[str, str]:
    """Auth header for ServiceNow: token, OAuth client credentials, or basic.

    OAuth: POST https://{instance}.service-now.com/oauth_token.do with
    grant_type=client_credentials (inbound client-credentials integration).
    """
    env = os.environ if env is None else env
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    token = env.get("SN_ACCESS_TOKEN")
    if not token and cfg.get("SN_CLIENT_ID") and env.get("SN_CLIENT_SECRET"):
        body = http.json("POST", sn_base_url(cfg) + "/oauth_token.do", data={
            "grant_type": "client_credentials",
            "client_id": cfg["SN_CLIENT_ID"],
            "client_secret": env["SN_CLIENT_SECRET"],
        })
        token = body["access_token"]
    if token:
        headers["Authorization"] = f"Bearer {token}"
        return headers
    if cfg.get("SN_USERNAME") and env.get("SN_PASSWORD"):
        raw = f"{cfg['SN_USERNAME']}:{env['SN_PASSWORD']}".encode()
        headers["Authorization"] = "Basic " + base64.b64encode(raw).decode()
        return headers
    raise KitError("Set SN_ACCESS_TOKEN, SN_CLIENT_ID+SN_CLIENT_SECRET, or SN_USERNAME+SN_PASSWORD.")


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def build_client_assertion(cert_pem: bytes, key_pem: bytes, client_id: str, audience: str,
                           now: int | None = None) -> str:
    """A certificate-signed JWT client assertion (Microsoft identity platform,
    "certificate credentials"): PS256, x5t#S256 header, aud/iss/sub/jti/nbf/exp.

    Needs the optional ``cryptography`` package; only this function imports it.
    """
    try:
        from cryptography import x509
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding
    except ImportError as exc:  # pragma: no cover - depends on environment
        raise KitError("Certificate auth needs the 'cryptography' package, or set GRAPH_ACCESS_TOKEN.") from exc
    cert = x509.load_pem_x509_certificate(cert_pem)
    der = cert.public_bytes(serialization.Encoding.DER)
    key = serialization.load_pem_private_key(key_pem, password=None)
    now = int(time.time()) if now is None else now
    header = {"alg": "PS256", "typ": "JWT", "x5t#S256": _b64url(hashlib.sha256(der).digest())}
    claims = {"aud": audience, "iss": client_id, "sub": client_id, "jti": str(uuid.uuid4()),
              "nbf": now, "iat": now, "exp": now + 600}
    signing_input = (_b64url(json.dumps(header, separators=(",", ":")).encode()) + "."
                     + _b64url(json.dumps(claims, separators=(",", ":")).encode()))
    signature = key.sign(signing_input.encode(),
                         padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=32),
                         hashes.SHA256())
    return signing_input + "." + _b64url(signature)


def graph_headers(cfg: Mapping[str, str], http: Http, env: Mapping[str, str] | None = None) -> dict[str, str]:
    """Bearer header for Microsoft Graph via client credentials.

    Certificate (GRAPH_CERT_PATH, a PEM holding certificate and key) is
    preferred; GRAPH_CLIENT_SECRET is the fallback; GRAPH_ACCESS_TOKEN skips
    acquisition entirely.
    """
    env = os.environ if env is None else env
    token = env.get("GRAPH_ACCESS_TOKEN")
    if not token:
        login, graph = graph_endpoints(cfg)
        tenant, client_id = cfg.get("GRAPH_TENANT_ID"), cfg.get("GRAPH_CLIENT_ID")
        if not tenant or not client_id:
            raise KitError("Set GRAPH_TENANT_ID and GRAPH_CLIENT_ID (or GRAPH_ACCESS_TOKEN).")
        token_url = f"{login}/{tenant}/oauth2/v2.0/token"
        form = {"grant_type": "client_credentials", "client_id": client_id, "scope": f"{graph}/.default"}
        if cfg.get("GRAPH_CERT_PATH"):
            with open(cfg["GRAPH_CERT_PATH"], "rb") as handle:
                pem = handle.read()
            form["client_assertion_type"] = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
            form["client_assertion"] = build_client_assertion(pem, pem, client_id, token_url)
        elif env.get("GRAPH_CLIENT_SECRET"):
            form["client_secret"] = env["GRAPH_CLIENT_SECRET"]
        else:
            raise KitError("Set GRAPH_CERT_PATH (preferred) or GRAPH_CLIENT_SECRET, or GRAPH_ACCESS_TOKEN.")
        token = http.json("POST", token_url, data=form)["access_token"]
    return {"Authorization": f"Bearer {token}", "Accept": "application/json"}


# --------------------------------------------------------------------------
# Paging
# --------------------------------------------------------------------------

def graph_get_all(http: Http, url: str, headers: Mapping[str, str]) -> Iterator[dict]:
    """Follow @odata.nextLink as an opaque URL until the last page."""
    next_url: str | None = url
    while next_url:
        page = http.json("GET", next_url, headers=dict(headers))
        yield from page.get("value", [])
        next_url = page.get("@odata.nextLink")


def isc_search_all(http: Http, base: str, headers: Mapping[str, str], body: dict,
                   page_size: int = 250) -> Iterator[dict]:
    """POST /v3/search with searchAfter paging (sorted on id)."""
    body = dict(body)
    body.setdefault("sort", ["id"])
    while True:
        page = http.json("POST", f"{base}/v3/search", headers=dict(headers),
                         params={"limit": page_size}, json=body)
        page = page or []
        yield from page
        if len(page) < page_size:
            return
        body["searchAfter"] = [str(page[-1].get("id"))]


def isc_list_all(http: Http, url: str, headers: Mapping[str, str], params: dict | None = None,
                 limit: int = 250) -> Iterator[dict]:
    """GET list APIs (for example /v3/accounts) with limit/offset paging."""
    offset = 0
    while True:
        query = dict(params or {})
        query.update({"limit": limit, "offset": offset})
        page = http.json("GET", url, headers=dict(headers), params=query) or []
        yield from page
        if len(page) < limit:
            return
        offset += limit


def sn_table_all(http: Http, base: str, table: str, headers: Mapping[str, str], query: str,
                 fields: Iterable[str] | None = None, limit: int = 100) -> Iterator[dict]:
    """GET /api/now/table/{table} with sysparm_offset / sysparm_limit."""
    offset = 0
    while True:
        params = {"sysparm_query": query, "sysparm_limit": limit, "sysparm_offset": offset,
                  "sysparm_exclude_reference_link": "true"}
        if fields:
            params["sysparm_fields"] = ",".join(fields)
        page = (http.json("GET", f"{base}/api/now/table/{table}", headers=dict(headers),
                          params=params) or {}).get("result", [])
        yield from page
        if len(page) < limit:
            return
        offset += limit


# --------------------------------------------------------------------------
# Evidence helpers
# --------------------------------------------------------------------------

def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def sha256_hex(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
