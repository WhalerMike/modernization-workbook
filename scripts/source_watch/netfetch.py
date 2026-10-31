"""HTTP for the source watcher: one generic User-Agent, polite pacing, retries.

Every request carries only the generic User-Agent below and ordinary Accept
headers. No email address, name or other personal data is ever sent. The
GitHub API is the one exception that gets an extra header: the workflow's
own GITHUB_TOKEN, when it is set (see `github_headers`).

Standard library only, plus the `curl` binary for the hosts in `CURL_HOSTS`.
"""

from __future__ import annotations

import gzip
import http.cookiejar
import os
import re
import shutil
import socket
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
import zlib
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urljoin, urlsplit

USER_AGENT = "FederalModernizationWorkbook-SourceWatch/1.0 (+https://github.com/WhalerMike/modernization-workbook)"
BASE_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.5",
    "Accept-Language": "en-US,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
}
PERMANENT = {301, 308}
RETRY_STATUS = {429, 500, 502, 503, 504}

# Hosts fetched with curl instead of urllib, a host and its subdomains. www.cisa.gov
# answers 403 to every request from Python's HTTP client, whatever its headers, but
# serves the same URL, with the same User-Agent and headers, to curl. watch.py sets
# this from `curl_hosts` in config.json. Without a curl binary, urllib is used.
CURL_HOSTS: list[str] = []
CURL = shutil.which("curl")
_CURL_MARK = "--source-watch-status--"
_STATUS_LINE = re.compile(r"^HTTP/\S+\s+(\d{3})")


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


def use_curl(url: str) -> bool:
    """True when `url` is on a CURL_HOSTS host and a curl binary is installed."""
    host = (urlsplit(url).hostname or "").lower()
    return bool(CURL) and any(host == d or host.endswith("." + d) for d in CURL_HOSTS)


def _urllib_get(resp: Response, url: str, headers: dict[str, str], timeout: float, max_bytes: int) -> tuple[bytes, float]:
    """One GET through urllib. Fills `resp`; returns (raw body, Retry-After seconds)."""
    recorder = _Recorder()
    opener = urllib.request.build_opener(recorder, urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    req = urllib.request.Request(url, headers=headers, method="GET")
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
    return raw, retry_after


def parse_curl_headers(text: str) -> list[tuple[int, dict[str, str]]]:
    """(status, lower-cased headers) for each response curl -D wrote, one per redirect hop."""
    blocks: list[tuple[int, dict[str, str]]] = []
    for line in text.splitlines():
        m = _STATUS_LINE.match(line)
        if m:
            blocks.append((int(m.group(1)), {}))
        elif blocks and ":" in line:
            k, v = line.split(":", 1)
            blocks[-1][1][k.strip().lower()] = v.strip()
    return blocks


def _curl_get(resp: Response, url: str, headers: dict[str, str], timeout: float, max_bytes: int) -> tuple[bytes, float]:
    """One GET through curl, with the same headers. Fills `resp` like `_urllib_get`,
    including the redirect chain, read from the headers of every hop."""
    cmd = [CURL, "-sS", "-L", "--max-redirs", "10", "--compressed", "-m", str(int(timeout)), "-w", _CURL_MARK + "%{http_code}"]
    for k, v in headers.items():
        if k.lower() != "accept-encoding":  # --compressed asks for what this curl can decode
            cmd += ["-H", f"{k}: {v}"]
    with tempfile.TemporaryDirectory() as tmp:
        head = Path(tmp) / "headers"
        try:
            p = subprocess.run([*cmd, "-D", str(head), url], capture_output=True, timeout=timeout + 15)
        except (subprocess.TimeoutExpired, OSError) as e:
            resp.error = f"curl: {type(e).__name__}"
            return b"", 0.0
        blocks = parse_curl_headers(head.read_text("latin-1")) if head.exists() else []
    raw, _, code = p.stdout.rpartition(_CURL_MARK.encode())
    resp.status = int(code) if code.isdigit() else 0
    if not resp.status:
        resp.error = f"curl exit {p.returncode}: {p.stderr.decode('utf-8', 'replace').strip()}"[:200]
        return b"", 0.0
    current = url
    for status, hop in blocks[:-1]:
        if 300 <= status < 400 and hop.get("location"):
            current = urljoin(current, hop["location"])
            resp.chain.append((status, current))
    resp.final_url = current
    resp.headers = blocks[-1][1] if blocks else {}
    resp.headers.pop("content-encoding", None)  # curl has already decoded the body
    ra = resp.headers.get("retry-after", "")
    return raw[: max_bytes + 1], float(ra) if ra.isdigit() else 0.0


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
    get = _curl_get if use_curl(url) else _urllib_get
    for attempt in range(retries + 1):
        resp = Response(url=url, attempts=attempt + 1)
        if pacer:
            pacer.wait(url)
        raw, retry_after = get(resp, url, {**BASE_HEADERS, **(headers or {})}, timeout, max_bytes)
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
