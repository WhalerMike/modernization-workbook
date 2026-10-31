#!/usr/bin/env python3
"""Check every source the books cite, and the new-publication feeds, once.

For each cited URL (see citations.py) this fetches the page and compares it
with what the previous run recorded in the state file:

- unchanged: the page's fingerprint matches, or differs by less than the
  threshold (config.json `threshold_pct`, default 2% of paragraphs).
- changed:   learn.microsoft.com's `ms.date` moved, more paragraphs than the
  threshold were added or removed, or a PDF/binary's sha256 changed.
- moved:     the URL now answers with a permanent redirect (301/308) to a
  different address than last time.
- gone:      404 or 410.
- blocked:   401/403/429, another 4xx, or no answer for `fail_runs_before_blocked`
  runs in a row. Reported once, when the status first changes, as "needs
  manual check"; never week after week.

Fingerprints: learn.microsoft.com pages by their `ms.date` / `updated_at`
meta tags plus a hash of the main-content text; other HTML pages by a short
hash per paragraph of the normalized main text (scripts, styles, navigation,
headers, footers and "last updated"/copyright lines removed), so a run can
say how many paragraphs were added or removed and quote the added ones;
PDFs and other files by sha256 and size.

Then it polls the feeds in data/source-watch/feeds.json and keeps the new
items whose title or summary matches a topic keyword (see feeds.py).

The first run (no state) is a baseline: it records everything and reports
only "baseline established". A URL first cited since the last run, or a feed
seen for the first time, is baselined silently the same way.

    python scripts/source_watch/watch.py --dry-run --limit 60
    python scripts/source_watch/watch.py --only-domain cisa.gov --dry-run
    python scripts/source_watch/watch.py --results-out results.json --report-out report.md

`--dry-run` prints the report instead of writing it, and never opens an
issue (watch.py never does; report.py --open-issue does). State is saved to
`--state` unless `--no-save`; the workflow pushes it to the
`source-watch-state` branch only on a real (non-dry) run.

Standard library only, so the workflow needs no extra Python packages.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))

import citations  # noqa: E402
import feeds as feedlib  # noqa: E402
import gitsource  # noqa: E402
import report  # noqa: E402
import review_dates  # noqa: E402
import review_gate  # noqa: E402
from netfetch import HostPacer, fetch  # noqa: E402

ROOT = citations.ROOT
DATA = ROOT / "data" / "source-watch"
STATE = DATA / "state.json"
CONFIG = DATA / "config.json"
FEEDS = DATA / "feeds.json"
STATE_VERSION = 1

DEFAULTS = {
    "threshold_pct": 2.0,
    "concurrency": 8,
    "timeout_s": 30,
    "retries": 2,
    "host_delay_s": 1.0,
    "host_delays": {},
    "fail_runs_before_blocked": 2,
    "max_bytes": 50_000_000,
    "skip_hosts": [],
    "excerpt_chars": 280,
    "max_excerpts": 3,
    "min_paragraph_chars": 20,
}

# ---------------------------------------------------------------- fingerprints

SKIP_TAGS = {
    "script",
    "style",
    "noscript",
    "template",
    "svg",
    "nav",
    "header",
    "footer",
    "aside",
    "form",
    "button",
    "select",
    "iframe",
}
MAIN_TAGS = {"main", "article"}
BLOCK_TAGS = {
    "p",
    "div",
    "section",
    "li",
    "ul",
    "ol",
    "dl",
    "dt",
    "dd",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "tr",
    "td",
    "th",
    "table",
    "thead",
    "tbody",
    "pre",
    "blockquote",
    "br",
    "hr",
    "figcaption",
    "caption",
    "summary",
    "details",
    "main",
    "article",
    "body",
}
VOLATILE = re.compile(
    r"last (updated|modified|reviewed|revised)|updated on|page last|reviewed on|copyright|©|\(c\) \d{4}|"
    r"all rights reserved|cookie|you are here|skip to main|share this page|print this page|"
    r"was this page helpful|feedback|\b\d+ min(ute)?s? (read|to read)\b|contributors?\b",
    re.I,
)
WS = re.compile(r"\s+")


LINK_ONLY = "\x01"  # marks a block whose text is all link text


class _Text(HTMLParser):
    """Collects paragraph text, dropping SKIP_TAGS subtrees; keeps the text
    inside <main>/<article>/role=main separately. Blocks made only of links
    ("related articles", tag clouds, link lists) are marked and dropped:
    they rotate on many sites and say nothing about the cited content."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.main = 0
        self.all_parts: list[str] = []
        self.main_parts: list[str] = []
        self.meta: dict[str, str] = {}
        self.title = ""
        self._in_title = False
        self._stack: list[tuple[str, bool]] = []  # (tag, opened main)
        self._block_text = False  # current block has text
        self._block_plain = False  # ... some of it outside a link

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "meta":
            name = (a.get("name") or a.get("property") or "").lower()
            if name in {"ms.date", "updated_at", "og:title", "article:modified_time", "dcterms.modified",
                        "original_content_git_url", "git_commit_id"}:
                self.meta[name] = a.get("content", "").strip()
            return
        if tag == "title":
            self._in_title = True
        if tag in SKIP_TAGS:
            self.skip += 1
        opens_main = tag in MAIN_TAGS or a.get("role") == "main"
        if opens_main:
            self.main += 1
        if tag not in {
            "br",
            "hr",
            "img",
            "input",
            "link",
            "source",
            "wbr",
            "col",
            "area",
            "base",
            "embed",
            "param",
            "track",
        }:
            self._stack.append((tag, opens_main))
        if tag in BLOCK_TAGS:
            self._break()

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag in BLOCK_TAGS:
            self._break()
        # Pop to the matching open tag (tolerates unclosed children).
        for i in range(len(self._stack) - 1, -1, -1):
            if self._stack[i][0] == tag:
                for t, opened in self._stack[i:]:
                    if t in SKIP_TAGS and self.skip:
                        self.skip -= 1
                    if opened and self.main:
                        self.main -= 1
                del self._stack[i:]
                break

    def handle_data(self, data):
        if self._in_title:
            self.title += data
            return
        if self.skip:
            return
        if data.strip():
            self._block_text = True
            if not any(t == "a" for t, _ in self._stack):
                self._block_plain = True
        self.all_parts.append(data)
        if self.main:
            self.main_parts.append(data)

    def _break(self):
        end = (LINK_ONLY + "\n") if self._block_text and not self._block_plain else "\n"
        self._block_text = self._block_plain = False
        self.all_parts.append(end)
        if self.main:
            self.main_parts.append(end)


def paragraphs(text: str, min_chars: int) -> list[str]:
    out = []
    for line in text.split("\n"):
        if LINK_ONLY in line:
            continue
        line = WS.sub(" ", line).strip()
        if len(line) >= min_chars and not VOLATILE.search(line):
            out.append(line)
    return out


def para_hash(p: str) -> str:
    return hashlib.sha1(p.lower().encode("utf-8")).hexdigest()[:10]


def html_fingerprint(body: bytes, content_type: str, min_chars: int) -> tuple[dict, list[str]]:
    charset = "utf-8"
    m = re.search(r"charset=([\w-]+)", content_type, re.I)
    if m:
        charset = m.group(1)
    try:
        text = body.decode(charset, errors="replace")
    except LookupError:
        text = body.decode("utf-8", errors="replace")
    parser = _Text()
    try:
        parser.feed(text)
        parser.close()
    except Exception:  # HTMLParser is lenient, but never let one page stop the run
        pass
    main = paragraphs("".join(parser.main_parts), min_chars)
    paras = main if sum(map(len, main)) >= 200 else paragraphs("".join(parser.all_parts), min_chars)
    fp = {
        "kind": "html",
        "title": WS.sub(" ", parser.title).strip()[:200] or parser.meta.get("og:title", "")[:200],
        "paras": " ".join(para_hash(p) for p in paras),
        "text_hash": hashlib.sha256("\n".join(paras).lower().encode("utf-8")).hexdigest()[:16],
    }
    for key in ("ms.date", "updated_at"):
        if parser.meta.get(key):
            fp[key.replace(".", "_")] = parser.meta[key]
    # learn.microsoft.com: the source file and the commit the page was built at (see gitsource.py).
    if parser.meta.get("original_content_git_url") and parser.meta.get("git_commit_id"):
        fp["git_url"], fp["git_commit"] = parser.meta["original_content_git_url"], parser.meta["git_commit_id"]
    return fp, paras


def text_fingerprint(body: bytes, min_chars: int) -> tuple[dict, list[str]]:
    text = body.decode("utf-8", errors="replace").replace("\r\n", "\n")
    paras = [WS.sub(" ", b).strip() for b in re.split(r"\n\s*\n", text)]
    paras = [p for p in paras if len(p) >= min_chars and not VOLATILE.search(p)]
    return {
        "kind": "text",
        "title": "",
        "paras": " ".join(para_hash(p) for p in paras),
        "text_hash": hashlib.sha256("\n".join(paras).encode("utf-8")).hexdigest()[:16],
    }, paras


VOLATILE_KEYS = {"timestamp", "generated", "generatedat", "generated_at", "requesttime", "retrieved"}


def json_fingerprint(body: bytes) -> dict:
    """JSON API answers (NVD, ...) carry a per-request timestamp; hash the
    data without it."""

    def scrub(x):
        if isinstance(x, dict):
            return {k: scrub(v) for k, v in x.items() if k.lower() not in VOLATILE_KEYS}
        if isinstance(x, list):
            return [scrub(v) for v in x]
        return x

    try:
        data = scrub(json.loads(body))
    except ValueError:
        return binary_fingerprint(body)
    canon = json.dumps(data, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return {"kind": "binary", "title": "", "sha256": hashlib.sha256(canon).hexdigest(), "size": len(body)}


def binary_fingerprint(body: bytes) -> dict:
    return {"kind": "binary", "title": "", "sha256": hashlib.sha256(body).hexdigest(), "size": len(body)}


def fingerprint(resp, min_chars: int) -> tuple[dict, list[str]]:
    ctype = resp.headers.get("content-type", "").lower()
    if resp.body[:5] == b"%PDF-" or "pdf" in ctype:
        return binary_fingerprint(resp.body), []
    if "json" in ctype:
        return json_fingerprint(resp.body), []
    if "html" in ctype or (not ctype and resp.body.lstrip()[:15].lower().startswith((b"<!doctype", b"<html"))):
        return html_fingerprint(resp.body, ctype, min_chars)
    if ctype.startswith("text/plain") or ctype.startswith("text/markdown"):
        return text_fingerprint(resp.body, min_chars)
    return binary_fingerprint(resp.body), []


# --------------------------------------------------------------- classification

FINGERPRINT_KEYS = ("kind", "title", "paras", "text_hash", "ms_date", "updated_at", "git_url", "git_commit", "sha256", "size")


def norm_url(url: str) -> str:
    """For deciding whether a redirect is a real move: ignore scheme, `www.`,
    default ports, a trailing slash, letter case and the fragment."""
    s = urlsplit(url)
    host = s.netloc.lower().removeprefix("www.").removesuffix(":443").removesuffix(":80")
    path = s.path.rstrip("/").lower() or "/"
    return urlunsplit(("", host, path, s.query, ""))


def compare(old: dict, new: dict, paras: list[str], cfg: dict) -> dict | None:
    """None if unchanged (or under threshold), else a description of the change."""
    if not old.get("kind"):
        return None
    if old["kind"] != new["kind"]:
        return {"magnitude": "content type changed", "detail": f"{old['kind']} -> {new['kind']}", "pct": 100.0}
    if new["kind"] == "binary":
        if old.get("sha256") == new.get("sha256"):
            return None
        size_old, size_new = old.get("size", 0), new.get("size", 0)
        delta = size_new - size_old
        pct = abs(delta) / max(size_old, 1) * 100
        return {"magnitude": f"file changed ({size_old:,} -> {size_new:,} bytes, {delta:+,})", "pct": round(pct, 1)}
    olds, news = old.get("paras", "").split(), new.get("paras", "").split()
    added_c = Counter(news) - Counter(olds)
    removed_c = Counter(olds) - Counter(news)
    added, removed = sum(added_c.values()), sum(removed_c.values())
    pct = (added + removed) / max(len(olds), len(news), 1) * 100
    date_moved = bool(old.get("ms_date") and new.get("ms_date") and old["ms_date"] != new["ms_date"])
    # A Learn page whose source file has a new commit changed for real, so any changed
    # paragraph counts, however few. A new commit with no visible change (metadata, a
    # typo in a comment) isn't reported.
    commit_moved = bool(old.get("git_commit") and new.get("git_commit") and old["git_commit"] != new["git_commit"])
    if added + removed == 0 and not date_moved:
        return None
    if not date_moved and not commit_moved and pct < cfg["threshold_pct"]:
        return None
    excerpts, seen = [], set(added_c)
    for p in paras:
        h = para_hash(p)
        if h in seen and len(excerpts) < cfg["max_excerpts"]:
            seen.discard(h)
            excerpts.append(p if len(p) <= cfg["excerpt_chars"] else p[: cfg["excerpt_chars"]].rsplit(" ", 1)[0] + " …")
    out = {
        "magnitude": f"+{added} / -{removed} of {len(olds)} paragraphs ({pct:.1f}%)",
        "pct": round(pct, 1),
        "added": added,
        "removed": removed,
        "paragraphs": len(news),
        "excerpts": excerpts,
    }
    if date_moved:
        out["ms_date"] = [old["ms_date"], new["ms_date"]]
    if commit_moved:
        out["git_commit"] = [old["git_commit"], new["git_commit"]]
    return out


def classify(url: str, resp, prev: dict, cfg: dict, today: str) -> tuple[dict, dict | None]:
    """(new state entry, reportable event or None)."""
    entry = dict(prev)
    entry["last_checked"] = today
    entry.setdefault("first_seen", today)
    first = not prev
    code = resp.status
    entry["code"] = code
    event = None

    def transition(status: str, reason: str) -> dict | None:
        was = prev.get("status")
        entry["status"], entry["reason"] = status, reason
        if was == status:
            return None
        # A source seen for the first time is reported only if it is already
        # broken (gone) or unreadable (blocked), so it is never silently ignored.
        if first and status not in ("gone", "blocked"):
            return None
        return {"type": status, "code": code, "reason": reason, "was": was or "", "final_url": resp.final_url}

    if code in (404, 410):
        entry["fails"] = 0
        return entry, transition("gone", f"HTTP {code}")
    if 400 <= code < 500:
        entry["fails"] = 0
        return entry, transition("blocked", f"HTTP {code}")
    if 300 <= code < 400:  # a redirect urllib would not follow (loop, missing Location)
        entry["fails"] = 0
        return entry, transition("blocked", f"HTTP {code} redirect not followed")
    if code == 0 or code >= 500:
        entry["fails"] = prev.get("fails", 0) + 1
        reason = resp.error or f"HTTP {code}"
        if entry["fails"] >= cfg["fail_runs_before_blocked"]:
            return entry, transition("blocked", f"no answer {entry['fails']} runs in a row ({reason})")
        entry["reason"] = reason
        entry.setdefault("status", "error")
        return entry, None

    # 2xx/3xx with a body: compare fingerprints.
    entry["fails"] = 0
    fp, paras = fingerprint(resp, cfg["min_paragraph_chars"])
    entry["etag"] = resp.headers.get("etag", "")
    entry["last_modified"] = resp.headers.get("last-modified", "")
    was_status = prev.get("status")
    entry["status"], entry["reason"] = "ok", ""
    final = resp.final_url or url
    moved = resp.permanent_redirect and norm_url(final) != norm_url(url)
    prev_final = prev.get("final_url") or url
    if not first and moved and norm_url(final) != norm_url(prev_final):
        event = {"type": "moved", "code": resp.chain[-1][0], "final_url": final, "was": prev_final}
    entry["final_url"] = final
    entry["moved"] = bool(moved)
    if resp.truncated:
        entry["truncated"] = True
    change = None if first else compare(prev, fp, paras, cfg)
    if change and not (event and event["type"] == "moved"):
        event = {"type": "changed", **change}
        if fp.get("updated_at") and prev.get("updated_at") != fp.get("updated_at"):
            event["updated_at"] = [prev.get("updated_at", ""), fp["updated_at"]]
    elif change and event:
        event["changed"] = change
    if not event and not first and was_status in ("gone", "blocked"):
        event = {"type": "recovered", "code": code, "was": was_status, "reason": prev.get("reason", "")}
    for k in FINGERPRINT_KEYS:
        entry.pop(k, None)
    entry.update(fp)
    entry["last_ok"] = today
    return entry, event


def git_history(url: str, prev: dict, entry: dict, event: dict | None, get=gitsource.api_get) -> dict | None:
    """Add what git says to a source's check (see gitsource.py); returns the event to report.

    - A GitHub file or folder cited at a branch: its latest commit is looked up and kept
      in the state. A new commit is reported as a change, with the commits and changed
      lines; an unchanged commit means the cited file didn't change, so a "changed" from
      the page's HTML (GitHub's own page furniture) is dropped.
    - A changed Learn page whose source commit moved: the commits and changed lines from
      the source's public copy, when it has one.
    """
    target = gitsource.github_branch_target(url)
    if target:
        if entry.get("status") != "ok":
            return event
        repo, ref, path = target
        old = prev.get("git_commit", "")
        sha = gitsource.latest_commit(repo, ref, path, get)
        entry["git_commit"] = sha or old
        if not sha or not old or (event and event["type"] == "moved"):
            return event
        if sha == old:
            return None if event and event["type"] == "changed" else event
        git = gitsource.changes(repo, path, old, sha, ref=ref, get=get)
        what = "folder" if "/tree/" in url else "file"
        magnitude = f"{len(git['commits'])}{'+' if git['more_commits'] else ''} new commit(s) to the cited {what}"
        if not event or event["type"] != "changed":
            event = {"type": "changed", "pct": 0.0}
        event.update({"magnitude": magnitude, "git_commit": [old, sha], "git": git})
        return event
    if event and event["type"] == "changed" and event.get("git_commit"):
        src = gitsource.learn_source(entry.get("git_url", ""))
        if src:
            old, new = event["git_commit"]
            event["git"] = gitsource.changes(gitsource.public_repo(src[0]), src[1], old, new, get=get)
    return event


# ------------------------------------------------------------------- the run


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(
        json.dumps(data, indent=0, sort_keys=True, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n"
    )
    tmp.replace(path)


def fetch_key(url: str) -> str:
    """Citations that differ only by #fragment share one fetch."""
    return url.split("#", 1)[0]


def interleave(urls: list[str]) -> list[str]:
    """Round-robin by host, so the threads don't all queue behind one host."""
    by_host: dict[str, list[str]] = defaultdict(list)
    for u in urls:
        by_host[urlsplit(u).netloc.lower()].append(u)
    out, queues = [], sorted(by_host.values(), key=len, reverse=True)
    while queues:
        queues = [q for q in queues if q]
        for q in queues:
            out.append(q.pop(0))
    return out


def host_matches(url: str, domains: list[str]) -> bool:
    host = urlsplit(url).netloc.lower().split(":")[0]
    return any(host == d or host.endswith("." + d) for d in domains)


def check_sources(cited: dict, state: dict, cfg: dict, args, today: str, log) -> tuple[list[dict], dict]:
    targets: dict[str, list[str]] = defaultdict(list)  # fetch url -> cited urls
    for url in cited:
        targets[fetch_key(url)].append(url)
    urls = list(targets)
    if cfg["skip_hosts"]:
        urls = [u for u in urls if not host_matches(u, cfg["skip_hosts"])]
    if args.only_domain:
        urls = [u for u in urls if host_matches(u, args.only_domain)]
    if args.url:
        urls = [u for u in urls if u in args.url] + [u for u in args.url if u not in targets]
        for u in args.url:
            targets.setdefault(u, [u])
    urls = interleave(urls)
    if args.limit:
        urls = urls[: args.limit]
    pacer = HostPacer(cfg["host_delay_s"], cfg["host_delays"])
    sources = state.setdefault("sources", {})
    events: list[dict] = []
    counts: Counter = Counter()
    done = 0
    start = time.monotonic()

    def work(u: str):
        return u, fetch(u, timeout=cfg["timeout_s"], retries=cfg["retries"], max_bytes=cfg["max_bytes"], pacer=pacer)

    with ThreadPoolExecutor(max_workers=cfg["concurrency"]) as pool:
        for u, resp in pool.map(work, urls):
            prev = sources.get(u, {})
            entry, event = classify(u, resp, prev, cfg, today)
            event = git_history(u, prev, entry, event)
            sources[u] = entry
            counts["checked"] += 1
            counts[entry.get("status", "error")] += 1
            if not prev:
                counts["new"] += 1
            if event:
                counts["reported_" + event["type"]] += 1
                cites = [c for cu in targets[u] for c in cited.get(cu, [])]
                events.append({"url": u, "title": entry.get("title", ""), "citations": cites, **event})
            done += 1
            if done % 100 == 0 or done == len(urls):
                log(f"  {done:,}/{len(urls):,} sources checked ({time.monotonic() - start:.0f}s)")
    # Forget URLs no longer cited (only on a full run, never a filtered test run).
    if not (args.limit or args.only_domain or args.url):
        for u in [u for u in sources if u not in targets]:
            del sources[u]
            counts["uncited"] += 1
    counts["seconds"] = round(time.monotonic() - start)
    return events, dict(counts)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check the books' cited sources and the new-publication feeds.")
    parser.add_argument("--state", type=Path, default=STATE, help="state file (default data/source-watch/state.json)")
    parser.add_argument("--config", type=Path, default=CONFIG)
    parser.add_argument("--feeds", type=Path, default=FEEDS)
    parser.add_argument("--dry-run", action="store_true", help="print the report; write no report file")
    parser.add_argument("--no-save", action="store_true", help="don't write the state file")
    parser.add_argument("--limit", type=int, default=0, help="check only the first N sources (mixed across hosts)")
    parser.add_argument(
        "--only-domain", action="append", default=[], help="check only this domain (and subdomains); repeatable"
    )
    parser.add_argument("--url", action="append", default=[], help="check only this URL; repeatable")
    parser.add_argument("--no-sources", action="store_true", help="skip the cited sources (feeds only)")
    parser.add_argument("--no-feeds", action="store_true", help="skip the feeds (sources only)")
    parser.add_argument("--only-feed", action="append", default=[], help="poll only this feed id; repeatable")
    parser.add_argument(
        "--since-days",
        type=int,
        default=0,
        help="for a feed seen for the first time, report items from the last N days instead of baselining silently",
    )
    parser.add_argument("--results-out", type=Path, help="write the run's results as JSON (input to report.py)")
    parser.add_argument("--report-out", type=Path, help="write the Markdown report here")
    args = parser.parse_args()

    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    log = lambda msg: print(msg, file=sys.stderr, flush=True)  # noqa: E731
    cfg = {**DEFAULTS, **load_json(args.config, {})}
    feeds_cfg = load_json(args.feeds, {"topics": [], "feeds": []})
    state = load_json(args.state, {})
    now = dt.datetime.now(dt.timezone.utc)
    today = now.date().isoformat()
    # A first run is a baseline: record everything, report only "baseline
    # established". (--since-days previews recent feed items instead.)
    baseline = not state.get("sources") and not state.get("feeds") and not args.since_days
    state.setdefault("version", STATE_VERSION)
    state.setdefault("created", today)

    cited = citations.collect()
    log(f"source watch: {len(cited):,} cited URLs, state {args.state} ({'baseline' if baseline else 'incremental'})")
    events, counts = ([], {}) if args.no_sources else check_sources(cited, state, cfg, args, today, log)

    feed_items, feed_errors, feed_counts = [], [], {}
    if not args.no_feeds:
        feed_items, feed_errors, feed_counts = feedlib.poll_all(
            feeds_cfg, state.setdefault("feeds", {}), now, args.only_feed, args.since_days, log
        )
    state["last_run"] = now.isoformat(timespec="seconds")

    results = {
        "generated": now.isoformat(timespec="seconds"),
        "week_of": (now.date() - dt.timedelta(days=now.weekday())).isoformat(),
        "baseline": baseline,
        "filtered": bool(args.limit or args.only_domain or args.url),
        "counts": counts,
        "feed_counts": feed_counts,
        "sources_total": len(state.get("sources", {})),
        "feeds_total": len(feeds_cfg.get("feeds", [])),
        "events": events,
        "feed_items": feed_items,
        "feed_errors": feed_errors,
        "review_due": review_dates.due(now.date()),
        "review_gate": review_gate.waiting(),
        "books": citations.books(),
        "chapters": citations.chapter_titles(cited),
    }
    if not args.no_save:
        save_json(args.state, state)
    if args.results_out:
        save_json(args.results_out, results)
    text = report.render(results)
    if args.dry_run:
        print(text if report.has_findings(results) else "source watch: nothing to report (no issue would be opened)")
    elif args.report_out:
        args.report_out.parent.mkdir(parents=True, exist_ok=True)
        args.report_out.write_text(text, encoding="utf-8", newline="\n")
    if counts:
        log("source watch: sources: " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))
    if feed_counts:
        log(f"source watch: feeds: {len(feed_items)} items to report, {len(feed_errors)} feed errors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
