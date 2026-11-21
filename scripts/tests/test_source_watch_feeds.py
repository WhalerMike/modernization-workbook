"""Tests for the source watcher's feeds: the `exclude` filter and the
`fluidtopics_pages` page check in scripts/source_watch/feeds.py.

    python -m unittest discover -s scripts/tests -v
"""
from __future__ import annotations

import datetime as dt
import json
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "source_watch"))

import feeds  # noqa: E402

BASE = "https://docs.example.test/docs"


def meta(**kv):
    return [{"key": k, "values": v} for k, v in kv.items()]


MAPS = [
    {"id": "m1", "title": "Zurich Release Notes",
     "metadata": meta(**{"ft:clusterId": ["rn"], "ft:locale": ["en-US"], "ft:originId": ["zurich-bundle-rn-en-us"]})},
    {"id": "m2", "title": "Zurich-Release-Hinweise",
     "metadata": meta(**{"ft:clusterId": ["rn"], "ft:locale": ["de-DE"], "ft:originId": ["zurich-bundle-rn-de-de"]})},
    {"id": "m3", "title": "Platform security",
     "metadata": meta(**{"ft:clusterId": ["sec"], "ft:locale": ["en-US"], "ft:originId": ["zurich-bundle-sec-en-us"]})},
]
TOC = [{"tocId": "t0", "contentId": "c0", "title": "Zurich release notes",
        "prettyUrl": "/r/zurich/release-notes/family-release-notes.html",
        "children": [{"tocId": "t1", "contentId": "c1", "title": "Using the release notes",
                      "prettyUrl": "/r/zurich/release-notes/rn-getting-started.html", "children": []}]}]


def page(text: str) -> bytes:
    return (
        '<div><main><article><h1>Zurich release notes</h1>'
        '<div>Updated <span>October 8, 2026</span></div>'
        f"<p>{text}</p></article></main></div>"
    ).encode()


def fake_get(body: bytes):
    calls = []

    def get(url, headers=None):
        calls.append(url)
        if url.endswith("/api/khub/maps"):
            return json.dumps(MAPS).encode()
        if url.endswith("/toc"):
            return json.dumps(TOC).encode()
        if url.endswith("/topics/c0/content"):
            return body
        raise AssertionError(url)

    return get, calls


FEED = {"id": "snow", "type": "fluidtopics_pages", "base": BASE, "cluster": "rn", "locale": "en-US",
        "page": "family-release-notes.html", "delay_s": 0}


class FluidTopicsPages(unittest.TestCase):
    def test_one_item_per_matching_publication(self):
        get, calls = fake_get(page("The release includes new products."))
        with mock.patch.object(feeds, "_get", get):
            items = feeds.fetch_fluidtopics_pages(FEED, "2026-11-01")
        self.assertEqual(len(items), 1)  # the de-DE and non-rn maps are skipped
        item = items[0]
        self.assertTrue(item["id"].startswith("zurich-bundle-rn-en-us|"))
        self.assertEqual(item["date"], "2026-10-08")
        self.assertEqual(item["url"], BASE + "/r/zurich/release-notes/family-release-notes.html")
        self.assertIn("updated October 8, 2026", item["title"])
        self.assertEqual(calls, [f"{BASE}/api/khub/maps", f"{BASE}/api/khub/maps/m1/toc",
                                 f"{BASE}/api/khub/maps/m1/topics/c0/content"])

    def test_changed_text_changes_the_id(self):
        ids = []
        for text in ("First version.", "First version.", "Second version."):
            get, _ = fake_get(page(text))
            with mock.patch.object(feeds, "_get", get):
                ids.append(feeds.fetch_fluidtopics_pages(FEED, "2026-11-01")[0]["id"])
        self.assertEqual(ids[0], ids[1])
        self.assertNotEqual(ids[1], ids[2])

    def test_missing_page_is_an_error(self):
        get, _ = fake_get(page("x"))
        with mock.patch.object(feeds, "_get", get):
            with self.assertRaises(RuntimeError):
                feeds.fetch_fluidtopics_pages({**FEED, "page": "no-such-page.html"}, "2026-11-01")


class Exclude(unittest.TestCase):
    def test_excluded_items_are_seen_but_not_reported(self):
        got = [
            {"id": "a", "title": "acme/specs: Update dereferenced specifications", "url": "", "date": "2026-11-20", "summary": ""},
            {"id": "b", "title": "acme/specs: Add the workflows v2 path", "url": "", "date": "2026-11-20", "summary": ""},
        ]
        cfg = {"topics": [], "feeds": [{"id": "specs", "type": "stub", "books": ["B13"],
                                        "exclude": ": Update dereferenced specifications"}]}
        state = {"specs": {"seen": [], "last_run": "2026-11-16T11:00:00+00:00"}}
        with mock.patch.dict(feeds.FETCHERS, {"stub": lambda feed, since: got}):
            items, errors, _ = feeds.poll_all(cfg, state, dt.datetime(2026, 11, 23, 11, tzinfo=dt.timezone.utc),
                                              [], 0, lambda msg: None)
        self.assertEqual(errors, [])
        self.assertEqual([i["id"] for i in items], ["b"])
        self.assertEqual(sorted(state["specs"]["seen"]), ["a", "b"])


if __name__ == "__main__":
    unittest.main()
