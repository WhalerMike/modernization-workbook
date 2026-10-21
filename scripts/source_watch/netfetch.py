"""HTTP for the source watcher: one generic User-Agent, polite pacing, retries.

Every request carries only the generic User-Agent below and ordinary Accept
headers. No email address, name or other personal data is ever sent. The
GitHub API is the one exception that gets an extra header: the workflow's
own GITHUB_TOKEN, when it is set (see `github_headers`).

Standard library only.
"""

from __future__ import annotations

import gzip
import http.cookiejar
import os
import socket
import threading
import time
import urllib.error
import urllib.request
import zlib
from dataclasses import dataclass, field
from urllib.parse import urlsplit

USER_AGENT = "FederalModernizationWorkbook-SourceWatch/1.0 (+https://github.com/WhalerMike/modernization-workbook)"
BASE_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.5",
    "Accept-Language": "en-US,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
}
PERMANENT = {301, 308}
RETRY_STATUS = {429, 500, 502, 503, 504}


@dataclass
class Response:
    url: str
    status: int = 0  # 0: no HTTP response (timeout, DNS, TLS, connection error)
    final_url: str = ""
    chain: list[tuple[int, str]] = field(default_factory=list)  # (redirect status, target)
    headers: dict[str, str] = field(default_factory=dict)
    body: bytes = b""
    truncated: bool = False
    error: str = ""
    attempts: int = 0

    @property
    def permanent_redirect(self) -> bool:
        return bool(self.chain) and all(code in PERMANENT for code, _ in self.chain)


class _Recorder(urllib.request.HTTPRedirectHandler):
    """Follows redirects like urllib does, recording each hop."""

    def __init__(self) -> None:
        self.chain: list[tuple[int, str]] = []

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: N802 (urllib API)
        self.chain.append((code, newurl))
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class HostPacer:
    """At most one request start per host every `delay` seconds."""

    def __init__(self, default_delay: float, overrides: dict[str, float] | None = None) -> None:
        self.default = default_delay
        self.overrides = {k.lower(): v for k, v in (overrides or {}).items()}
        self._locks: dict[str, threading.Lock] = {}
        self._next: dict[str, float] = {}
        self._guard = threading.Lock()

    def wait(self, url: str) -> None:
        host = urlsplit(url).netloc.lower()
        with self._guard:
            lock = self._locks.setdefault(host, threading.Lock())
        with lock:
            now = time.monotonic()
            start = max(now, self._next.get(host, 0.0))
            self._next[host] = start + self.overrides.get(host, self.default)
        if start > now:
            time.sleep(start - now)


def _decode(body: bytes, encoding: str) -> bytes:
    encoding = encoding.lower()
    try:
        if encoding == "gzip":
            return gzip.decompress(body)
        if encoding == "deflate":
            try:
                return zlib.decompress(body)
            except zlib.error:
                return zlib.decompress(body, -zlib.MAX_WBITS)
    except (OSError, EOFError, zlib.error):
        return body
    return body


def fetch(
    url: str,
    *,
    timeout: float = 30.0,
    retries: int = 2,
    max_bytes: int = 50_000_000,
    pacer: HostPacer | None = None,
    headers: dict[str, str] | None = None,
) -> Response:
    """GET `url`, following redirects. Retries timeouts, connection errors,
    429 and 5xx with backoff (honouring a short Retry-After)."""
    resp = Response(url=url)
    for attempt in range(retries + 1):
        resp = Response(url=url, attempts=attempt + 1)
        if pacer:
            pacer.wait(url)
        recorder = _Recorder()
        opener = urllib.request.build_opener(recorder, urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        req = urllib.request.Request(url, headers={**BASE_HEADERS, **(headers or {})}, method="GET")
        retry_after = 0.0
        try:
            with opener.open(req, timeout=timeout) as r:
                resp.status = r.status
                resp.final_url = r.geturl()
                resp.headers = {k.lower(): v for k, v in r.headers.items()}
                raw = r.read(max_bytes + 1)
        except urllib.error.HTTPError as e:
            resp.status = e.code
            resp.final_url = e.geturl() or url
            resp.headers = {k.lower(): v for k, v in (e.headers or {}).items()}
            try:
                raw = e.read(1_000_000)
            except (OSError, ValueError):
                raw = b""
            ra = resp.headers.get("retry-after", "")
            retry_after = float(ra) if ra.isdigit() else 0.0
        except (urllib.error.URLError, socket.timeout, TimeoutError, ConnectionError, OSError, ValueError) as e:
            reason = getattr(e, "reason", e)
            resp.error = f"{type(reason).__name__}: {reason}"[:200]
            raw = b""
        except Exception as e:  # http.client oddities (IncompleteRead, BadStatusLine, ...)
            resp.error = f"{type(e).__name__}: {e}"[:200]
            raw = b""
        resp.chain = recorder.chain
        if len(raw) > max_bytes:
            raw, resp.truncated = raw[:max_bytes], True
        resp.body = _decode(raw, resp.headers.get("content-encoding", ""))
        retryable = resp.status == 0 or resp.status in RETRY_STATUS
        if not retryable or attempt == retries:
            return resp
        time.sleep(min(30.0, max(retry_after, 2.0 * (attempt + 1))))
    return resp


def github_headers() -> dict[str, str]:
    """API headers for api.github.com: the workflow token if present, never a user identity."""
    h = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h
