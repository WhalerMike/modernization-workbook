#!/usr/bin/env python3
"""Turn a source-watch run into a Markdown digest, and open it as an issue.

    python scripts/source_watch/report.py --results results.json            # print
    python scripts/source_watch/report.py --results results.json --open-issue

The digest is grouped book -> chapter -> source: what changed (how many
paragraphs, the new ms.date, excerpts of added paragraphs), what moved and
where to, what is gone. Then new publications by book, then sources that
need a manual check. Chapter links go to the chapter file on GitHub.

--open-issue opens one issue titled "Source watch — week of YYYY-MM-DD",
labelled `source-watch` (created if missing) and assigned to the owner, but
only when there is something to report. A baseline run opens a one-time
"baseline established" issue. If an open issue with the same title exists
(a re-run in the same week), the digest is added to it as a comment. The
body is cut to fit GitHub's 65,536-character limit, with counts of what was
left out; the workflow attaches the full report as an artifact.

Uses the GitHub REST API with GITHUB_TOKEN (urllib, standard library only).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote, urlsplit

sys.path.insert(0, str(Path(__file__).resolve().parent))

from netfetch import USER_AGENT  # noqa: E402

REPO = os.environ.get("GITHUB_REPOSITORY", "WhalerMike/modernization-workbook")
BRANCH = "main"
LABEL = "source-watch"
ASSIGNEE = "WhalerMike"
BODY_LIMIT = 65_536
BUDGET = 60_000  # leaves room for the truncation note
TYPE_LABEL = {"changed": "Changed", "moved": "Moved", "gone": "Gone"}
TYPE_ORDER = {"gone": 0, "moved": 1, "changed": 2}


def title_for(results: dict) -> str:
    return f"Source watch — week of {results['week_of']}"


def run_url() -> str:
    server, run = os.environ.get("GITHUB_SERVER_URL", "https://github.com"), os.environ.get("GITHUB_RUN_ID")
    return f"{server}/{REPO}/actions/runs/{run}" if run else ""


def md(text: str) -> str:
    """Escape what would break a Markdown link label or table cell."""
    return (text or "").replace("|", "\\|").replace("[", "\\[").replace("]", "\\]").replace("\n", " ")


def book_heading(code: str, books: dict) -> str:
    b = books.get(code, {})
    planned = " (planned)" if b.get("status", "").lower() == "planned" else ""
    return f"### {code} — {b.get('title', code)}{planned}"


def chapter_link(path: str, chapters: dict) -> str:
    name = Path(path).name
    return f"[{md(chapters.get(path, name))}](https://github.com/{REPO}/blob/{BRANCH}/{quote(path)}) (`{name}`)"


def source_label(e: dict, cited: str = "") -> str:
    """The footnote's own title for the source, else the page title, else the URL."""
    title = cited or e.get("title") or e["url"]
    return f"[{md(title[:160])}]({e['url']})"


def event_block(e: dict, footnotes: list[str], cited: str = "", first_at: str = "") -> str:
    """One source's entry. `first_at` names where a source cited in several
    chapters was first listed; later entries skip the excerpts."""
    keys = " ".join(f"`[^{k}]`" for k in footnotes)
    kind = TYPE_LABEL.get(e["type"], e["type"].title())
    lines = [f"- **{kind}** — {source_label(e, cited)} {keys}".rstrip()]
    if e["type"] == "gone":
        lines.append(f"  - HTTP {e.get('code')}: find the new address or a replacement source.")
    elif e["type"] == "moved":
        lines.append(
            f"  - Now redirects ({e.get('code')}) to <{e['final_url']}>"
            + (f" (was <{e['was']}>)" if e.get("was") and e["was"] != e["url"] else "")
        )
        if e.get("changed"):
            lines.append(f"  - Content also changed: {e['changed']['magnitude']}")
    else:
        detail = [e.get("magnitude", "")]
        if e.get("ms_date"):
            detail.append(f"ms.date {e['ms_date'][0][:10]} → {e['ms_date'][1][:10]}")
        if e.get("updated_at"):
            detail.append(f"updated_at → {e['updated_at'][1][:10]}")
        if first_at and e.get("excerpts"):
            detail.append(f"added text quoted under {first_at}")
        lines.append("  - " + "; ".join(d for d in detail if d))
        if not first_at:
            for x in e.get("excerpts", []):
                lines.append(f"  > {x}")
    return "\n".join(lines)


def source_blocks(results: dict) -> list[tuple[str, str, str]]:
    """[(book heading, chapter line, event block)] in book/chapter order."""
    books, chapters = results.get("books", {}), results.get("chapters", {})
    grouped: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))
    for e in results.get("events", []):
        if e["type"] not in TYPE_LABEL:
            continue
        by_chapter: dict[tuple[str, str], list[str]] = defaultdict(list)
        for c in e.get("citations", []):
            by_chapter[(c["book"], c["chapter"])].append(c["footnote"])
        for (book, chapter), keys in by_chapter.items():
            grouped[book][chapter].append((e, keys))
    out, first_at = [], {}
    for book in sorted(grouped):
        for chapter in sorted(grouped[book]):
            for e, keys in sorted(grouped[book][chapter], key=lambda x: (TYPE_ORDER.get(x[0]["type"], 9), x[0]["url"])):
                cited = next(
                    (c.get("title", "") for c in e.get("citations", []) if c["chapter"] == chapter and c.get("title")),
                    "",
                )
                block = event_block(e, keys, cited, first_at.get(e["url"], ""))
                first_at.setdefault(e["url"], f"{book} `{Path(chapter).name}`")
                out.append((book_heading(book, books), f"#### {chapter_link(chapter, chapters)}", block))
    return out


def feed_blocks(results: dict) -> list[tuple[str, str, str]]:
    books = results.get("books", {})
    out = []
    for item in results.get("feed_items", []):
        for b in item["books"]:
            date = f" · {item['date']}" if item.get("date") else ""
            matched = f" · matched: {', '.join(item['matched'][:6])}" if item.get("matched") else ""
            line = f"- [{md(item['title'][:200])}]({item['url']}) — {md(item['feed_name'])}{date}{matched}"
            out.append((book_heading(b, books), "", line))
    out.sort(key=lambda x: x[0])
    return out


def manual_rows(results: dict) -> list[str]:
    rows = []
    for e in results.get("events", []):
        if e["type"] not in ("blocked", "recovered"):
            continue
        where = sorted({c["book"] for c in e.get("citations", [])})
        status = "needs manual check" if e["type"] == "blocked" else f"answers again (was {e.get('was')})"
        rows.append(f"| <{e['url']}> | {status} | {md(e.get('reason', ''))} | {', '.join(where)} |")
    for f in results.get("feed_errors", []):
        rows.append(f"| feed `{f['feed']}` <{f['url']}> | feed failed | {md(f['error'][:150])} | — |")
    return rows


def review_rows(results: dict) -> list[str]:
    rows = []
    for r in results.get("review_due", []):
        when = f"{r['last_reviewed']} ({r['age_days']} days ago)" if r.get("last_reviewed") else "never"
        link = f"https://github.com/{REPO}/blob/{BRANCH}/{quote(r['page'])}"
        rows.append(f"| [{md(r['title'][:150])}]({link}) | {md(r.get('status', ''))} | {when} |")
    return rows


def has_findings(results: dict) -> bool:
    return bool(
        results.get("baseline")
        or source_blocks(results)
        or results.get("feed_items")
        or manual_rows(results)
        or review_rows(results)
    )


def duration(seconds: int) -> str:
    return f"{seconds} s" if seconds < 120 else f"{round(seconds / 60)} min"


def render_baseline(results: dict) -> str:
    c = results.get("counts", {})
    lines = [
        f"# {title_for(results)}: baseline established",
        "",
        f"Baseline established: **{results.get('sources_total', 0):,} sources**, **{results.get('feeds_total', 0)} feeds**.",
        "",
        "The source watcher recorded a fingerprint of every source the books cite and marked every current feed item as seen. "
        "From next week, it opens an issue only when a cited source changed, moved or disappeared, or a relevant new publication appeared.",
        "",
        f"Checked {c.get('checked', 0):,} sources in {duration(c.get('seconds', 0))}: "
        f"{c.get('ok', 0):,} read, {c.get('gone', 0)} gone, {c.get('blocked', 0)} refused the watcher, "
        f"{c.get('error', 0)} did not answer (reported if that happens again next run).",
    ]
    gone = source_blocks(results)
    if gone:
        lines += [
            "",
            "## Already gone at baseline",
            "",
            "These cited sources answer 404 or 410 today. Find the new address or a replacement.",
        ]
        last_book = last_chapter = None
        for book, chapter, block in gone:
            if book != last_book:
                lines += ["", book]
                last_book, last_chapter = book, None
            if chapter != last_chapter:
                lines += ["", chapter]
                last_chapter = chapter
            lines.append(block)
    blocked = [e for e in results.get("events", []) if e["type"] == "blocked"]
    if blocked:
        hosts: dict[str, list[dict]] = defaultdict(list)
        for e in blocked:
            hosts[urlsplit(e["url"]).netloc].append(e)
        lines += [
            "",
            "## Could not be read (needs manual check)",
            "",
            "These refused the watcher (bot blocking, sign-in walls) and won't be fingerprinted. Check them by hand when you review a chapter.",
            "",
            "| Host | Sources | Reason |",
            "|---|---:|---|",
        ]
        for host, es in sorted(hosts.items(), key=lambda x: -len(x[1])):
            reasons = sorted({e.get("reason", "") for e in es})
            lines.append(f"| {host} | {len(es)} | {md(', '.join(reasons)[:120])} |")
        lines += ["", "<details><summary>All unreadable sources</summary>", ""]
        lines += [f"- <{e['url']}> ({', '.join(sorted({c['book'] for c in e.get('citations', [])}))})" for e in blocked]
        lines += ["", "</details>"]
    if run_url():
        lines += ["", f"Workflow run: {run_url()}"]
    return "\n".join(lines) + "\n"


def render(results: dict, budget: int | None = None) -> str:
    if results.get("baseline"):
        return render_baseline(results)
    src, feeds, manual = source_blocks(results), feed_blocks(results), manual_rows(results)
    reviews = review_rows(results)
    events = [e for e in results.get("events", []) if e["type"] in TYPE_LABEL]
    n = {t: sum(1 for e in events if e["type"] == t) for t in TYPE_LABEL}
    c = results.get("counts", {})
    head = [
        f"# {title_for(results)}",
        "",
        f"**{n['changed']} changed, {n['moved']} moved, {n['gone']} gone** of {c.get('checked', 0):,} cited sources checked; "
        f"**{len(results.get('feed_items', []))} new publications**; **{len(manual)} need a manual check**; **{len(reviews)} research pages due for review**.",
        "",
        "Each run compares against the previous one, so each change is reported once. Review the chapters below, "
        "then close this issue. See [how to read this issue](https://github.com/"
        + REPO
        + "/blob/main/scripts/source_watch/README.md).",
    ]
    if results.get("filtered"):
        head += ["", "_Test run: only part of the sources were checked (--limit / --only-domain / --url)._"]
    if run_url():
        head += ["", f"Workflow run (full report attached as an artifact): {run_url()}"]
    parts = ["\n".join(head)]
    size = len(parts[0])
    omitted = {"sources": 0, "publications": 0, "manual": 0, "reviews": 0}

    def add(text: str, key: str) -> bool:
        nonlocal size
        if budget is not None and size + len(text) + 1 > budget:
            omitted[key] += 1
            return False
        parts.append(text)
        size += len(text) + 1
        return True

    def section(title: str, blocks: list[tuple[str, str, str]], key: str) -> None:
        if not blocks:
            return
        add(f"\n## {title}\n", key)
        last_book = last_chapter = None
        for book, chapter, block in blocks:
            text = ""
            if book != last_book:
                text += f"\n{book}\n"
                last_chapter = None
            if chapter and chapter != last_chapter:
                text += f"\n{chapter}\n"
            if add(text + block, key):
                last_book, last_chapter = book, chapter

    section("Changed, moved or gone sources", src, "sources")
    section("New publications", feeds, "publications")
    if manual:
        add(
            "\n## Needs manual check\n\nThese could not be read automatically, or answer again after failing. Open each in a browser.\n\n"
            "| Source | Status | Reason | Books |\n|---|---|---|---|",
            "manual",
        )
        for row in manual:
            add(row, "manual")
    if reviews:
        add(
            "\n## Research due for review\n\nThese research pages were last reviewed more than 90 days ago, or never. "
            "Check each against its sources and update its `last-reviewed` date; a page is listed every week until then.\n\n"
            "| Page | Status | Last reviewed |\n|---|---|---|",
            "reviews",
        )
        for row in reviews:
            add(row, "reviews")
    if any(omitted.values()):
        parts.append(
            f"\n---\n**Truncated to fit an issue:** {omitted['sources']} more source entries, "
            f"{omitted['publications']} more publications, {omitted['manual']} more manual checks and {omitted['reviews']} more research pages are not shown. "
            "The full report is attached to the workflow run as the `source-watch-report` artifact."
            + (f" {run_url()}" if run_url() else "")
        )
    return "\n".join(parts) + "\n"


# ---------------------------------------------------------------- GitHub API


def api(method: str, path: str, data: dict | None = None):
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise SystemExit("report: GITHUB_TOKEN is not set; cannot open an issue (use --dry-run to print)")
    req = urllib.request.Request(
        f"https://api.github.com{path}",
        data=json.dumps(data).encode() if data is not None else None,
        method=method,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            body = r.read()
            return r.status, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        return e.code, None


def ensure_label() -> None:
    status, _ = api("GET", f"/repos/{REPO}/labels/{LABEL}")
    if status == 404:
        api(
            "POST",
            f"/repos/{REPO}/labels",
            {"name": LABEL, "color": "0e8a16", "description": "Weekly report of changed or new sources for the books"},
        )


def open_issue(results: dict, body: str, assignee: str) -> str:
    ensure_label()
    title = title_for(results) + (": baseline established" if results.get("baseline") else "")
    status, found = api("GET", f"/repos/{REPO}/issues?state=open&labels={LABEL}&per_page=50")
    for issue in found or []:
        if issue.get("title") == title and "pull_request" not in issue:
            status, c = api("POST", f"/repos/{REPO}/issues/{issue['number']}/comments", {"body": body})
            if status >= 300:
                raise SystemExit(f"report: commenting on issue #{issue['number']} failed (HTTP {status})")
            return issue["html_url"]
    status, issue = api(
        "POST", f"/repos/{REPO}/issues", {"title": title, "body": body, "labels": [LABEL], "assignees": [assignee]}
    )
    if status >= 300 or not issue:
        raise SystemExit(f"report: opening the issue failed (HTTP {status})")
    return issue["html_url"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Render a source-watch run and optionally open it as a GitHub issue.")
    parser.add_argument("--results", type=Path, required=True, help="results JSON written by watch.py --results-out")
    parser.add_argument("--full-out", type=Path, help="write the full (untruncated) report here")
    parser.add_argument("--open-issue", action="store_true", help="open the issue (needs GITHUB_TOKEN)")
    parser.add_argument("--dry-run", action="store_true", help="print the issue body; open nothing")
    parser.add_argument("--assignee", default=ASSIGNEE)
    args = parser.parse_args()
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    results = json.loads(args.results.read_text(encoding="utf-8"))
    full = render(results)
    if args.full_out:
        args.full_out.write_text(full, encoding="utf-8", newline="\n")
    body = full if len(full) <= BODY_LIMIT else render(results, BUDGET)
    if not has_findings(results):
        print("report: nothing to report; no issue opened")
        return 0
    if args.dry_run or not args.open_issue:
        print(body)
        print(
            f"\nreport: {len(body):,} characters (full report {len(full):,}); dry run, no issue opened", file=sys.stderr
        )
        return 0
    if results.get("filtered"):
        raise SystemExit("report: refusing to open an issue for a filtered test run")
    print(f"report: opened {open_issue(results, body, args.assignee)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
