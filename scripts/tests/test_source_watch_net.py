"""Tests for the source watcher's curl path: scripts/source_watch/netfetch.py.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "source_watch"))

import netfetch as nf  # noqa: E402

PAGE = "https://www.cisa.gov/news-events/directives/bod-25-01"
HOPS = (
    "HTTP/1.1 301 Moved Permanently\r\nLocation: /directives/bod-25-01\r\nContent-Length: 0\r\n\r\n"
    "HTTP/2 200\r\ncontent-type: text/html; charset=UTF-8\r\ncontent-encoding: gzip\r\n\r\n"
)


def fake_curl(headers: str, body: bytes, code: str = "200", returncode: int = 0, stderr: bytes = b""):
    """A subprocess.run stand-in: writes `headers` where -D points and prints body + status."""
    calls = []

    def run(cmd, **kwargs):
        calls.append(cmd)
        Path(cmd[cmd.index("-D") + 1]).write_text(headers, "latin-1")
        return subprocess.CompletedProcess(cmd, returncode, body + nf._CURL_MARK.encode() + code.encode(), stderr)

    return run, calls


class UseCurl(unittest.TestCase):
    def test_host_and_subdomains_only(self):
        with mock.patch.object(nf, "CURL", "/usr/bin/curl"), mock.patch.object(nf, "CURL_HOSTS", ["cisa.gov"]):
            self.assertTrue(nf.use_curl("https://cisa.gov/logging"))
            self.assertTrue(nf.use_curl("https://www.cisa.gov/logging"))
            self.assertTrue(nf.use_curl("https://niccs.cisa.gov/tools/nice-framework"))
            self.assertFalse(nf.use_curl("https://notcisa.gov/x"))
            self.assertFalse(nf.use_curl("https://csrc.nist.gov/pubs"))

    def test_no_binary_means_urllib(self):
        with mock.patch.object(nf, "CURL", None), mock.patch.object(nf, "CURL_HOSTS", ["cisa.gov"]):
            self.assertFalse(nf.use_curl(PAGE))


class CurlGet(unittest.TestCase):
    def setUp(self):
        patches = [mock.patch.object(nf, "CURL", "curl"), mock.patch.object(nf, "CURL_HOSTS", ["cisa.gov"])]
        for p in patches:
            p.start()
            self.addCleanup(p.stop)

    def test_parse_headers_one_block_per_hop(self):
        blocks = nf.parse_curl_headers(HOPS)
        self.assertEqual([s for s, _ in blocks], [301, 200])
        self.assertEqual(blocks[0][1]["location"], "/directives/bod-25-01")

    def test_page_with_permanent_redirect(self):
        run, calls = fake_curl(HOPS, b"<html><main>BOD 25-01</main></html>")
        with mock.patch.object(nf.subprocess, "run", run):
            r = nf.fetch(PAGE, retries=0)
        self.assertEqual(r.status, 200)
        self.assertEqual(r.body, b"<html><main>BOD 25-01</main></html>")
        self.assertEqual(r.chain, [(301, "https://www.cisa.gov/directives/bod-25-01")])
        self.assertTrue(r.permanent_redirect)
        self.assertEqual(r.final_url, "https://www.cisa.gov/directives/bod-25-01")
        self.assertNotIn("content-encoding", r.headers)  # curl decoded it; don't gunzip again
        cmd = calls[0]
        self.assertIn(f"User-Agent: {nf.USER_AGENT}", cmd)
        self.assertFalse(any(a.lower().startswith("accept-encoding") for a in cmd))
        self.assertEqual(cmd[-1], PAGE)

    def test_gone(self):
        run, _ = fake_curl("HTTP/1.1 404 Not Found\r\n\r\n", b"not here", code="404")
        with mock.patch.object(nf.subprocess, "run", run):
            r = nf.fetch(PAGE, retries=0)
        self.assertEqual((r.status, r.chain), (404, []))

    def test_no_answer_is_an_error_and_retried(self):
        run, calls = fake_curl("", b"", code="000", returncode=28, stderr=b"curl: (28) Operation timed out")
        with mock.patch.object(nf.subprocess, "run", run), mock.patch.object(nf.time, "sleep"):
            r = nf.fetch(PAGE, retries=1)
        self.assertEqual(r.status, 0)
        self.assertIn("curl exit 28", r.error)
        self.assertEqual((len(calls), r.attempts), (2, 2))

    def test_other_hosts_still_use_urllib(self):
        with mock.patch.object(nf.subprocess, "run") as run, mock.patch.object(nf, "_urllib_get", return_value=(b"ok", 0.0)) as get:
            nf.fetch("https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final", retries=0)
        run.assert_not_called()
        get.assert_called_once()


if __name__ == "__main__":
    unittest.main()
