"""A small, dependency-free Azure Resource Manager and Resource Graph client for Module 4.

It applies Module 1's rules to Azure Resource Manager (ARM), which differs from Graph
in four ways that matter to a script:

* **Another host, another token.** ARM is `management.azure.com` in commercial Azure
  (which a GCC tenant's subscriptions use; graphkit.CLOUDS). A token is issued for one resource: a Graph token
  can't call ARM. The client refuses to send its token to any other host, including a
  `nextLink` that points elsewhere.
* **Azure RBAC, not token permissions.** An ARM token carries no `roles` claim to
  check. Azure RBAC decides at each call; every call here needs only Reader.
  `arm-calls.json` lists each call with its api-version and the RBAC action it's
  checked against, and the client refuses any call that isn't listed.
* **api-version on every call.** ARM has no v1.0 or beta; each resource provider
  versions its API, and the version is a query parameter the call declares.
* **Resource Graph paging is a token in the body.** A query returns at most 1,000
  rows. More come back by repeating the same query and scopes with `$skipToken`.
  When `resultTruncated` is true there's no token, and the result is incomplete:
  the client raises instead of returning part of the data (resource_graph).

Throttling: on 429 (and 503/504) wait for `Retry-After` (graphkit.retry_after); for
Resource Graph, fall back to `x-ms-user-quota-resets-after` (hh:mm:ss) when there is
no `Retry-After`. Tokens come from a callable, `token_provider(scope)`, as in
graphkit; `graphkit.azure_identity_provider` builds one. Standard library only.
"""

from __future__ import annotations

import json
import re
import sys
import time
import urllib.parse
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable, Iterator

sys.path.insert(0, str(Path(__file__).resolve().parent))
from graphkit import RETRY_STATUSES, Transport, endpoints, retry_after, scope_for, urllib_transport  # noqa: E402

ARM_CALLS_FILE = Path(__file__).resolve().parents[1] / "arm-calls.json"
ARG_PAGE_MAX = 1000  # "The first parameter has a maximum allowed value of 1000."


class ArmError(Exception):
    def __init__(self, status: int, body: object, url: str):
        code = body.get("error", {}).get("code", "") if isinstance(body, dict) else ""
        super().__init__(f"ARM {status} {code} for {url}")
        self.status, self.body, self.url, self.code = status, body, url, code


class IncompleteResult(Exception):
    """A Resource Graph result that can't be paged to the end (resultTruncated, no $skipToken)."""


@dataclass(frozen=True)
class ArmCall:
    """One ARM call a task makes: method, path template, api-version, the RBAC action checked."""

    id: str
    method: str
    path: str
    api_version: str
    actions: tuple[str, ...]
    tasks: tuple[str, ...]

    def matches(self, method: str, path: str) -> bool:
        pattern = "^" + re.sub(r"\\\{[^}]+\\\}", "[^/]+", re.escape(self.path)) + "$"
        return method.upper() == self.method and re.match(pattern, path, re.IGNORECASE) is not None


def load_arm_calls(task: str | None = None, path: Path = ARM_CALLS_FILE) -> list[ArmCall]:
    """The calls in arm-calls.json; with a task, only that task's calls."""
    data = json.loads(path.read_text(encoding="utf-8"))
    calls = [
        ArmCall(c["id"], c["method"].upper(), c["path"], c["api_version"], tuple(c["actions"]), tuple(c["tasks"]))
        for c in data["calls"]
    ]
    if task is not None:
        calls = [c for c in calls if task in c.tasks]
        if not calls:
            raise ValueError(f"no calls declared for task {task!r} in {path.name}")
    return calls


def required_role(path: Path = ARM_CALLS_FILE) -> dict:
    """The Azure role the calls need ({name, id, actions}): Reader."""
    return json.loads(path.read_text(encoding="utf-8"))["role"]


def _quota_reset(headers: dict) -> float | None:
    """Seconds from Resource Graph's x-ms-user-quota-resets-after (hh:mm:ss), if present."""
    value = headers.get("x-ms-user-quota-resets-after")
    m = re.fullmatch(r"(\d+):(\d{2}):(\d{2})(?:\.\d+)?", value or "")
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3)) if m else None


class ArmClient:
    def __init__(
        self,
        cloud: str,
        token_provider: Callable[[str], str],
        transport: Transport = urllib_transport,
        max_retries: int = 5,
        sleep: Callable[[float], None] = time.sleep,
        calls: Iterable[ArmCall] | None = None,
    ):
        self.cloud, self.root = cloud, endpoints(cloud)["arm"]
        self.scope = scope_for(cloud, "arm")
        self._token_provider, self._transport = token_provider, transport
        self.max_retries, self._sleep = max_retries, sleep
        self.calls = list(calls) if calls is not None else load_arm_calls()
        self.sent = 0  # HTTP requests sent, retries included

    def check_call(self, method: str, path: str) -> ArmCall:
        """The declared call for method and path; anything undeclared is refused."""
        call = next((c for c in self.calls if c.matches(method, path)), None)
        if call is None:
            raise PermissionError(f"undeclared call: {method} {path}; add it to arm-calls.json with its api-version and RBAC action")
        return call

    def url(self, method: str, path_or_url: str) -> str:
        """The full URL for a declared call, with its api-version. A full URL (a nextLink) must be on
        this cloud's ARM host and match a declared call; it keeps the query string ARM gave it."""
        if path_or_url.startswith("https://"):
            parts = urllib.parse.urlsplit(path_or_url)
            if parts.netloc != urllib.parse.urlsplit(self.root).netloc:
                raise ValueError(f"refusing to send the token to {path_or_url}: not {self.root}")
            self.check_call(method, parts.path)
            return path_or_url
        call = self.check_call(method, path_or_url)
        return f"{self.root}{path_or_url}?api-version={call.api_version}"

    def request(self, method: str, path_or_url: str, body: object = None) -> dict:
        """One call, retried on 429/503/504 after Retry-After (or Resource Graph's quota reset)."""
        url = self.url(method, path_or_url)
        data = json.dumps(body).encode() if body is not None else None
        for attempt in range(self.max_retries + 1):
            headers = {"Authorization": f"Bearer {self._token_provider(self.scope)}", "Accept": "application/json"}
            if data is not None:
                headers["Content-Type"] = "application/json"
            status, resp_headers, raw = self._transport(method, url, headers, data)
            self.sent += 1
            parsed = json.loads(raw) if raw else {}
            if status in RETRY_STATUSES and attempt < self.max_retries:
                wait = retry_after(resp_headers, attempt) if "retry-after" in resp_headers else _quota_reset(resp_headers)
                self._sleep(wait if wait is not None else retry_after({}, attempt))
                continue
            if status >= 400:
                raise ArmError(status, parsed, url)
            return parsed
        raise AssertionError("unreachable")

    def get_all(self, path: str) -> Iterator[dict]:
        """Every item of an ARM list, following `nextLink` (ARM's name for it) until it stops."""
        url: str | None = path
        while url:
            page = self.request("GET", url)
            yield from page.get("value", [])
            url = page.get("nextLink")

    def subscriptions(self) -> list[str]:
        """IDs of the enabled subscriptions the caller can see."""
        return sorted(s["subscriptionId"] for s in self.get_all("/subscriptions") if s.get("state", "Enabled") == "Enabled")

    def resource_graph(self, query: str, subscriptions: list[str] | None = None, management_groups: list[str] | None = None) -> list[dict]:
        """Every row of a Resource Graph query, paging with $skipToken (same query, same scopes).
        Raises IncompleteResult when Resource Graph says the result was cut short and can't be paged:
        a query with `take` or `limit`, or whose output columns are all dynamic or null."""
        if not subscriptions and not management_groups:
            raise ValueError("give the subscriptions or management groups to query; an empty scope can't be told from no access")
        body: dict = {"query": query, "options": {"$top": ARG_PAGE_MAX, "resultFormat": "objectArray"}}
        if subscriptions:
            body["subscriptions"] = list(subscriptions)
        if management_groups:
            body["managementGroups"] = list(management_groups)
        rows: list[dict] = []
        while True:
            page = self.request("POST", "/providers/Microsoft.ResourceGraph/resources", body)
            rows.extend(page.get("data", []))
            token = page.get("$skipToken")
            if token:
                body["options"] = {**body["options"], "$skipToken": token}
                continue
            if page.get("resultTruncated") in (True, "true", "True"):
                raise IncompleteResult(f"Resource Graph cut the result short at {len(rows)} rows and gave no $skipToken; project a string id column and don't use take or limit")
            return rows
