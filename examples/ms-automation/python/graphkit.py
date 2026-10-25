"""A small, dependency-free Microsoft Graph client for the workbook's automation examples.

It does the four things every Graph script has to get right, and nothing else:

* **The right cloud.** A Microsoft 365 GCC tenant uses the worldwide endpoints;
  GCC High and DoD use their own sign-in and Graph hosts (see CLOUDS). The client
  refuses to send its token to any other host, including a nextLink that points
  elsewhere.
* **Paging.** Collections come back a page at a time; follow `@odata.nextLink`
  until it stops (get_all).
* **Throttling.** On 429 (and 503/504) wait for `Retry-After`, then retry, up to a
  limit (request).
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

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Callable, Iterator

# Endpoints per cloud: Microsoft Learn, "Microsoft Graph national cloud deployments"
# and "Microsoft Entra authentication & national clouds". GCC is the worldwide service.
CLOUDS: dict[str, dict[str, str]] = {
    "global": {"login": "https://login.microsoftonline.com", "graph": "https://graph.microsoft.com", "ps_env": "Global"},
    "gcc": {"login": "https://login.microsoftonline.com", "graph": "https://graph.microsoft.com", "ps_env": "Global"},
    "gcchigh": {"login": "https://login.microsoftonline.us", "graph": "https://graph.microsoft.us", "ps_env": "USGov"},
    "dod": {"login": "https://login.microsoftonline.us", "graph": "https://dod-graph.microsoft.us", "ps_env": "USGovDoD"},
}

RETRY_STATUSES = {429, 503, 504}
BATCH_LIMIT = 20  # "JSON batch requests are currently limited to 20 individual requests."

Transport = Callable[[str, str, dict, bytes | None], tuple[int, dict, bytes]]


class GraphError(Exception):
    def __init__(self, status: int, body: object, url: str):
        code = body.get("error", {}).get("code", "") if isinstance(body, dict) else ""
        super().__init__(f"Graph {status} {code} for {url}")
        self.status, self.body, self.url, self.code = status, body, url, code


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
    when no certificate is given. Government clouds need the US Government authority."""
    from azure.identity import AzureAuthorityHosts, CertificateCredential, ManagedIdentityCredential

    authority = AzureAuthorityHosts.AZURE_GOVERNMENT if cloud in ("gcchigh", "dod") else AzureAuthorityHosts.AZURE_PUBLIC_CLOUD
    if certificate_path:
        cred = CertificateCredential(tenant_id, client_id, certificate_path, authority=authority)
    else:
        cred = ManagedIdentityCredential(client_id=client_id)
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
    ):
        if cloud not in CLOUDS:
            raise ValueError(f"unknown cloud {cloud!r}; one of {sorted(CLOUDS)}")
        self.cloud, self.root = cloud, CLOUDS[cloud]["graph"]
        self.base = f"{self.root}/{version}"
        self.scope = f"{self.root}/.default"
        self._token_provider, self._transport = token_provider, transport
        self.max_retries, self._sleep, self.low_priority = max_retries, sleep, low_priority
        self.calls = 0

    def url(self, path_or_url: str) -> str:
        if path_or_url.startswith("https://"):
            if urllib.parse.urlsplit(path_or_url).netloc != urllib.parse.urlsplit(self.root).netloc:
                raise ValueError(f"refusing to send the token to {path_or_url}: not {self.root}")
            return path_or_url
        return self.base + ("" if path_or_url.startswith("/") else "/") + path_or_url

    def request(self, method: str, path_or_url: str, body: object = None, advanced: bool = False) -> dict:
        """One call, retried on 429/503/504. `advanced=True` adds ConsistencyLevel: eventual,
        which Entra ID's advanced queries ($count, $search, some $filter and $orderby) need."""
        url = self.url(path_or_url)
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
            self.calls += 1
            parsed = json.loads(raw) if raw else {}
            if status in RETRY_STATUSES and attempt < self.max_retries:
                self._sleep(retry_after(resp_headers, attempt))
                continue
            if status >= 400:
                raise GraphError(status, parsed, url)
            return parsed
        raise AssertionError("unreachable")

    def get_all(self, path: str, advanced: bool = False) -> Iterator[dict]:
        """Every item in a collection, following @odata.nextLink until it stops."""
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
        Returns {id: {status, headers, body}}."""
        ids = [r["id"] for r in requests]
        if len(set(ids)) != len(ids):
            raise ValueError("batch request ids must be unique")
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


def retry_after(headers: dict, attempt: int) -> float:
    """Seconds to wait: the Retry-After header if present, else exponential backoff (1, 2, 4 ... 60)."""
    value = headers.get("retry-after")
    try:
        return max(0.0, float(value))
    except (TypeError, ValueError):
        return float(min(60, 2**attempt))
