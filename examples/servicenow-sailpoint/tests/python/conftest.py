"""Test helpers: put clients/python on sys.path and provide a fake HTTP session."""

import json
import os
import sys
from pathlib import Path

import pytest

KIT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(KIT / "clients" / "python"))
FIXTURES = KIT / "tests" / "fixtures"


class FakeResponse:
    def __init__(self, status_code=200, body=None, headers=None):
        self.status_code = status_code
        self._body = body
        self.headers = headers or {}
        self.content = b"" if body is None else json.dumps(body).encode()
        self.text = "" if body is None else json.dumps(body)

    def json(self):
        return self._body


class FakeSession:
    """Answers requests from a list of (predicate, response) rules, in order.

    Each rule is used once unless sticky=True. Every call is recorded.
    """

    def __init__(self):
        self.rules = []
        self.calls = []

    def add(self, method, url_contains, response, sticky=False):
        self.rules.append({"method": method, "url": url_contains, "response": response, "sticky": sticky})
        return self

    def request(self, method, url, **kwargs):
        self.calls.append({"method": method, "url": url, **kwargs})
        for rule in self.rules:
            if rule["method"] == method and rule["url"] in url:
                if not rule["sticky"]:
                    self.rules.remove(rule)
                return rule["response"]
        raise AssertionError(f"Unexpected request {method} {url}")


@pytest.fixture
def session():
    return FakeSession()


@pytest.fixture
def no_env(monkeypatch):
    for key in list(os.environ):
        if key.startswith(("SAILPOINT_", "SN_", "GRAPH_", "ISC_")):
            monkeypatch.delenv(key, raising=False)


def load_fixture(name):
    with open(FIXTURES / name, encoding="utf-8") as handle:
        data = json.load(handle)
    return data.get("value", data) if isinstance(data, dict) else data
