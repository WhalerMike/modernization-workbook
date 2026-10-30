"""A small, dependency-free Microsoft Graph client for the workbook's automation examples.

It does the things every Graph script has to get right, and nothing else
(the developer workbook's Chapter 02 explains each one):

* **The right cloud.** A Microsoft 365 GCC tenant uses the worldwide endpoints;
  GCC High and DoD use their own sign-in and Graph hosts (see CLOUDS). Azure
  Resource Manager follows the Azure cloud: commercial for GCC, Azure Government
  for GCC High and DoD. The client refuses to send its token to any other host,
  including a nextLink that points elsewhere.
* **Least privilege per call.** `graph-calls.json` lists every call the tasks make,
  with its least-privileged application permission. Given a task's calls, the client
  refuses any call that isn't listed, and `audit_roles` compares the token's `roles`
  claim with what the task needs.
* **Paging.** Collections come back a page at a time; follow `@odata.nextLink`
  until it stops (get_all), sending the same headers on every page.
* **Throttling.** On 429 (and 503/504) wait for `Retry-After` (seconds or an HTTP
  date), else back off exponentially, then retry, up to a limit (request).
* **Beta without depending on it.** A `/beta` path is refused unless a listed call
  declares it; `try_beta` turns "beta isn't there" into a result a report can carry.
* **Batching and delta.** Up to 20 requests per `$batch` (batch); `@odata.deltaLink`
  for change tracking (delta).

Tokens come from a callable you pass in: `token_provider(scope) -> access token`.
`azure_identity_provider` builds one from the `azure-identity` package with a
certificate or a managed identity; the examples never accept a client secret.
The tests pass a fake transport and a fake token, so nothing here needs the network
to be tested.

Standard library only (azure-identity is imported only when you ask for it).
"""

from __future__ import annotations

import base64
import email.utils
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable, Iterator

# Endpoints per cloud: Microsoft Learn, "Microsoft Graph national cloud deployments",
# "Compare Azure Government and global Azure" and "Get-MgEnvironment". GCC is the
# worldwide service: Office 365 GCC is paired with Microsoft Entra ID in (commercial)
# Azure, so its Azure Resource Manager host is the commercial one too.
CLOUDS: dict[str, dict[str, str]] = {
    "global": {"login": "https://login.microsoftonline.com", "graph": "https://graph.microsoft.com",
               "arm": "https://management.azure.com", "ps_env": "Global", "azure_env": "AzureCloud"},
    "gcc": {"login": "https://login.microsoftonline.com", "graph": "https://graph.microsoft.com",
            "arm": "https://management.azure.com", "ps_env": "Global", "azure_env": "AzureCloud"},
    "gcchigh": {"login": "https://login.microsoftonline.us", "graph": "https://graph.microsoft.us",
                "arm": "https://management.usgovcloudapi.net", "ps_env": "USGov", "azure_env": "AzureUSGovernment"},
    "dod": {"login": "https://login.microsoftonline.us", "graph": "https://dod-graph.microsoft.us",
            "arm": "https://management.usgovcloudapi.net", "ps_env": "USGovDoD", "azure_env": "AzureUSGovernment"},
}
VERSIONS = ("v1.0", "beta")
CALLS_FILE = Path(__file__).resolve().parents[1] / "graph-calls.json"

RETRY_STATUSES = {429, 503, 504}
BATCH_LIMIT = 20  # "JSON batch requests are currently limited to 20 individual requests."

Transport = Callable[[str, str, dict, bytes | None], tuple[int, dict, bytes]]


def endpoints(cloud: str) -> dict[str, str]:
    """The sign-in, Graph and Resource Manager endpoints for a cloud. An unknown name is an error, never a default."""
    if cloud not in CLOUDS:
        raise ValueError(f"unknown cloud {cloud!r}; one of {sorted(CLOUDS)}")
    return dict(CLOUDS[cloud])


def scope_for(cloud: str, resource: str = "graph") -> str:
    """The app-only `.default` scope for one resource in one cloud. A token is for one resource:
    a Graph token can't call Resource Manager, and a worldwide token can't call GCC High."""
    if resource not in ("graph", "arm"):
        raise ValueError("resource is 'graph' or 'arm'")
    return f"{endpoints(cloud)[resource]}/.default"


class GraphError(Exception):
    def __init__(self, status: int, body: object, url: str):
        code = body.get("error", {}).get("code", "") if isinstance(body, dict) else ""
        super().__init__(f"Graph {status} {code} for {url}")
        self.status, self.body, self.url, self.code = status, body, url, code


@dataclass(frozen=True)
class Call:
    """One Graph call a task makes: method, version, path template, least-privileged permissions."""

    id: str
    method: str
    version: str
    path: str
    permissions: tuple[str, ...]
    stage: str
    tasks: tuple[str, ...]
    not_in_clouds: tuple[str, ...] = ()

    def matches(self, method: str, version: str, path: str) -> bool:
        pattern = "^" + re.sub(r"\\\{[^}]+\\\}", "[^/]+", re.escape(self.path)) + "$"
        return method.upper() == self.method and version == self.version and re.match(pattern, path) is not None


def load_calls(task: str | None = None, path: Path = CALLS_FILE) -> list[Call]:
    """The calls in graph-calls.json; with a task, only that task's calls."""
    data = json.loads(path.read_text(encoding="utf-8"))
    calls = [
        Call(c["id"], c["method"].upper(), c["version"], c["path"], tuple(c["permissions"]), c["stage"],
             tuple(c["tasks"]), tuple(c.get("not_in_clouds", ())))
        for c in data["calls"]
    ]
    if task is not None:
        calls = [c for c in calls if task in c.tasks]
        if not calls:
            raise ValueError(f"no calls declared for task {task!r} in {path.name}")
    return calls


def permissions_for(calls: Iterable[Call]) -> list[str]:
    """The union of the least-privileged permissions a set of calls needs, sorted."""
    return sorted({p for c in calls for p in c.permissions})


def token_roles(token: str) -> set[str]:
    """The `roles` claim of an app-only access token (its application permissions). The payload is
    read, not validated: this is a pre-flight check on our own token, never an authorization decision."""
    try:
        payload = token.split(".")[1]
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    except (IndexError, ValueError) as e:
        raise ValueError("not a JWT access token") from e
    return set(claims.get("roles", []))


def audit_roles(token: str, needed: Iterable[str]) -> dict[str, list[str]]:
    """What the token lacks for the task (missing) and holds beyond it (extra: unused permissions)."""
    have, want = token_roles(token), set(needed)
    return {"missing": sorted(want - have), "extra": sorted(have - want)}


def preflight(client: "GraphClient", needed: Iterable[str], warn: Callable[[str], None]) -> bool:
    """Before a live run: False (and a message) when the token lacks a permission the task needs;
    a warning for each permission it holds beyond them, since an unused permission is still exposure."""
    audit = client.audit_token(needed)
    if audit["missing"]:
        warn(f"token lacks {', '.join(audit['missing'])}; grant the task's permissions (graph-calls.json) and retry")
        return False
    for extra in audit["extra"]:
        warn(f"warning: token also holds {extra}, which this task doesn't use")
    return True


def urllib_transport(method: str, url: str, headers: dict, body: bytes | None) -> tuple[int, dict, bytes]:
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=100) as resp:
            return resp.status, {k.lower(): v for k, v in resp.headers.items()}, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, {k.lower(): v for k, v in e.headers.items()}, e.read()


def azure_identity_provider(
    cloud: str, tenant_id: str, client_id: str | None = None, certificate_path: str | None = None
) -> Callable[[str], str]:
    """A token provider from azure-identity: a certificate credential, or a managed identity
    when no certificate is given. Government clouds need the US Government authority: an
    azure-identity credential signs in to the public cloud unless it is told otherwise."""
    from azure.identity import AzureAuthorityHosts, CertificateCredential, ManagedIdentityCredential

    endpoints(cloud)  # refuse an unknown cloud before building anything
    authority = AzureAuthorityHosts.AZURE_GOVERNMENT if cloud in ("gcchigh", "dod") else AzureAuthorityHosts.AZURE_PUBLIC_CLOUD
    if certificate_path:
        cred = CertificateCredential(tenant_id, client_id, certificate_path, authority=authority)
    else:
        cred = ManagedIdentityCredential(client_id=client_id)  # a managed identity lives in one cloud
    return lambda scope: cred.get_token(scope).token


class GraphClient:
    def __init__(
        self,
        cloud: str,
        token_provider: Callable[[str], str],
        transport: Transport = urllib_transport,
        version: str = "v1.0",
        max_retries: int = 5,
        sleep: Callable[[float], None] = time.sleep,
        low_priority: bool = True,
        calls: Iterable[Call] | None = None,
    ):
        if version not in VERSIONS:
            raise ValueError(f"version is one of {VERSIONS}")
        self.cloud, self.root = cloud, endpoints(cloud)["graph"]
        self.base = f"{self.root}/{version}"
        self.scope = scope_for(cloud, "graph")
        self._token_provider, self._transport = token_provider, transport
        self.max_retries, self._sleep, self.low_priority = max_retries, sleep, low_priority
        # None: any v1.0 call (a beta call still needs a declared one). A list: only those calls.
        self.calls: list[Call] | None = list(calls) if calls is not None else None
        self.sent = 0  # HTTP requests sent, retries included

    def url(self, path_or_url: str) -> str:
        if path_or_url.startswith("https://"):
            if urllib.parse.urlsplit(path_or_url).netloc != urllib.parse.urlsplit(self.root).netloc:
                raise ValueError(f"refusing to send the token to {path_or_url}: not {self.root}")
            return path_or_url
        return self.base + ("" if path_or_url.startswith("/") else "/") + path_or_url

    def check_call(self, method: str, url: str) -> Call | None:
        """Refuse a call this client wasn't given: an undeclared call when the client has a list,
        any beta call that no listed call declares, or a call Learn says this cloud doesn't offer."""
        parts = urllib.parse.urlsplit(url).path.split("/", 2)
        version, path = parts[1], "/" + (parts[2] if len(parts) > 2 else "")
        if path == "/$batch":
            return None  # the requests inside a batch are checked one by one in batch()
        declared = self.calls if self.calls is not None else load_calls()
        call = next((c for c in declared if c.matches(method, version, path)), None)
        if call is None and (self.calls is not None or version != "v1.0"):
            kind = "beta call" if version == "beta" else "call"
            raise PermissionError(f"undeclared {kind}: {method} /{version}{path}; add it to graph-calls.json with its permission")
        if call is not None and self.cloud in call.not_in_clouds:
            raise PermissionError(f"{call.id} isn't offered in {self.cloud} (graph-calls.json not_in_clouds)")
        return call

    def audit_token(self, needed: Iterable[str]) -> dict[str, list[str]]:
        """Missing and extra application permissions on the token this client would send."""
        return audit_roles(self._token_provider(self.scope), needed)

    def request(self, method: str, path_or_url: str, body: object = None, advanced: bool = False) -> dict:
        """One call, retried on 429/503/504. `advanced=True` adds ConsistencyLevel: eventual,
        which Entra ID's advanced queries ($count, $search, some $filter and $orderby) need."""
        url = self.url(path_or_url)
        self.check_call(method, url)
        data = json.dumps(body).encode() if body is not None else None
        for attempt in range(self.max_retries + 1):
            headers = {"Authorization": f"Bearer {self._token_provider(self.scope)}", "Accept": "application/json"}
            if data is not None:
                headers["Content-Type"] = "application/json"
            if advanced:
                headers["ConsistencyLevel"] = "eventual"
            if self.low_priority:
                headers["x-ms-throttle-priority"] = "Low"  # background job: throttle us before interactive users
            status, resp_headers, raw = self._transport(method, url, headers, data)
            self.sent += 1
            parsed = json.loads(raw) if raw else {}
            if status in RETRY_STATUSES and attempt < self.max_retries:
                self._sleep(retry_after(resp_headers, attempt))
                continue  # the same URL again: a retried page never uses a link from a failed attempt
            if status >= 400:
                raise GraphError(status, parsed, url)
            return parsed
        raise AssertionError("unreachable")

    def get_all(self, path: str, advanced: bool = False) -> Iterator[dict]:
        """Every item in a collection, following @odata.nextLink until it stops. Every page gets the
        same headers (Learn: headers on the first request aren't carried to later pages by default)."""
        url: str | None = path
        while url:
            page = self.request("GET", url, advanced=advanced)
            yield from page.get("value", [])
            url = page.get("@odata.nextLink")

    def delta(self, path_or_link: str) -> tuple[list[dict], str]:
        """All changes since the link (or the full state, from a /delta path), and the new deltaLink."""
        items, url = [], path_or_link
        while True:
            page = self.request("GET", url)
            items.extend(page.get("value", []))
            if "@odata.nextLink" in page:
                url = page["@odata.nextLink"]
                continue
            return items, page["@odata.deltaLink"]

    def batch(self, requests: list[dict]) -> dict[str, dict]:
        """Run requests ({id, method, url}) in $batch calls of at most 20; retry throttled ones.
        Returns {id: {status, headers, body}}. Each request inside is checked like a single call."""
        ids = [r["id"] for r in requests]
        if len(set(ids)) != len(ids):
            raise ValueError("batch request ids must be unique")
        for r in requests:
            self.check_call(r["method"], self.base + ("" if r["url"].startswith("/") else "/") + r["url"])
        results: dict[str, dict] = {}
        pending = list(requests)
        for attempt in range(self.max_retries + 1):
            throttled, wait = [], 0.0
            for i in range(0, len(pending), BATCH_LIMIT):
                chunk = pending[i : i + BATCH_LIMIT]
                out = self.request("POST", "/$batch", {"requests": chunk})
                by_id = {r["id"]: r for r in chunk}
                for resp in out.get("responses", []):
                    if resp["status"] in RETRY_STATUSES and attempt < self.max_retries:
                        throttled.append(by_id[resp["id"]])
                        wait = max(wait, retry_after({k.lower(): v for k, v in resp.get("headers", {}).items()}, attempt))
                    else:
                        results[resp["id"]] = resp
            if not throttled:
                return results
            self._sleep(wait)
            pending = throttled
        return results


def try_beta(client: GraphClient, path: str) -> dict:
    """Read a beta collection without depending on it. Returns {stage, available, items, reason}.
    A refused call (undeclared, or not offered in this cloud) and a 400, 404 or 501 from Graph
    mean the beta data isn't there: the report says "not evaluated" instead of failing the run.
    Anything else, including 403 and throttling that outlasts the retries, still raises."""
    url = f"{client.root}/beta{path if path.startswith('/') else '/' + path}"
    try:
        client.check_call("GET", url)
    except PermissionError as e:
        return {"stage": "beta", "available": False, "items": [], "reason": str(e)}
    try:
        return {"stage": "beta", "available": True, "items": list(client.get_all(url)), "reason": ""}
    except GraphError as e:
        if e.status in (400, 404, 501):
            return {"stage": "beta", "available": False, "items": [], "reason": f"Graph {e.status} {e.code}".strip()}
        raise


def retry_after(headers: dict, attempt: int, now: float | None = None) -> float:
    """Seconds to wait: the Retry-After header (delay-seconds or an HTTP date) if present, else
    exponential backoff (1, 2, 4 ... 60)."""
    value = headers.get("retry-after")
    try:
        return max(0.0, float(value))
    except (TypeError, ValueError):
        pass
    if value:
        try:
            when = email.utils.parsedate_to_datetime(value).timestamp()
            return max(0.0, when - (time.time() if now is None else now))
        except (TypeError, ValueError, IndexError):
            pass
    return float(min(60, 2**attempt))
