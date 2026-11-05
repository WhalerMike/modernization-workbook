#!/usr/bin/env python3
"""The Source Register: one permanent row for every source a slide or video links to.

data/source-register.json is the record, and docs/reference/source-register.md is generated
from it. A slide links to a row, never to the original, so a released deck stays right when an
original moves: only the row changes. The rules, which --check enforces:

  - A source's id is permanent. A row can be retired but never deleted or renamed.
  - A row that changes gets a line in its history, and the page goes back to the owner through
    the review gate.
  - A row's URL is one the books cite in a footnote, so the weekly source watch checks it, and a
    footnote can't change without the row changing with it.
  - Every link in a linked deck resolves: to a register row, a book page and heading, or a site page.

The Monday scan never edits the register. --digest writes each row's latest result to
data/source-watch/register-scan.json on the source-watch-state branch, and the page reads that
file in the browser, so a scan neither redeploys the site nor reopens a review. A moved or gone
source is listed in the scan's issue with the fix it needs, for the owner to approve.

    python scripts/source_watch/register.py --write     # regenerate the page
    python scripts/source_watch/register.py --check     # the rules above; against origin/main too
    python scripts/source_watch/register.py --digest data/source-watch/register-scan.json

Standard library only, so the workflow needs no extra Python packages.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
import citations  # noqa: E402

REGISTER = ROOT / "data" / "source-register.json"
PAGE = ROOT / "docs" / "reference" / "source-register.md"
STATE = ROOT / "data" / "source-watch" / "state.json"
SITE = "https://whalermike.github.io/modernization-workbook/"
PAGE_URL = f"{SITE}docs/reference/source-register.html"
SCAN_URL = ("https://raw.githubusercontent.com/WhalerMike/modernization-workbook/"
            "source-watch-state/data/source-watch/register-scan.json")
ID = re.compile(r"^[a-z][a-z0-9-]*$")
STATUSES = ("active", "retired")
ROW_FIELDS = ("title", "publisher", "url", "status")


def load(text: str | None = None) -> dict:
    return json.loads(text if text is not None else REGISTER.read_text(encoding="utf-8"))


def row_url(source_id: str) -> str:
    return f"{PAGE_URL}#{source_id}"


def slug(text: str) -> str:
    """The id Pandoc gives a heading."""
    text = re.sub(r"[*_`]", "", text).lower()
    text = re.sub(r"[^\w\s.-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    return re.sub(r"^[^a-z]+", "", text)


def page_headings(page: Path) -> list[tuple[str, str]]:
    """(heading text, id) for each heading from level 2 down."""
    found = []
    for m in re.finditer(r"^#{2,4} +(.+?)\s*$", page.read_text(encoding="utf-8"), re.M):
        text, attr = re.match(r"(.*?)(?:\s*\{(.*)\})?$", m.group(1)).groups()
        ident = re.search(r"#([\w.-]+)", attr or "")
        found.append((text.strip(), ident.group(1) if ident else slug(text)))
    return found


def review_fields() -> list[str]:
    """The page's review gate fields, kept as review_gate.py --approve wrote them. The gate
    hashes the body, so the approval holds until the generated body changes."""
    if not PAGE.exists():
        return []
    meta = re.match(r"\A---\s*\n(.*?)\n---", PAGE.read_bytes().decode("utf-8").replace("\r\n", "\n"), re.S)
    lines = meta.group(1).split("\n") if meta else []
    return [line for line in lines if re.match(r"(review-status|reviewed-sha256|last-reviewed):", line)]


def cell(text: str) -> str:
    return text.replace("|", "\\|").replace("[", "\\[").replace("]", "\\]")


def long_date(iso: str) -> str:
    d = dt.date.fromisoformat(iso)
    return f"{d.strftime('%B')} {d.day}, {d.year}"


def render(register: dict) -> str:
    sources = register["sources"]
    active = [s for s in sources if s["status"] == "active"]
    latest = max(h["date"] for s in sources for h in s["history"])
    lines = [
        "---",
        'title: "Source Register"',
        'subtitle: "Every source the slides and videos link to: one permanent row each, under revision control"',
        'description: "The Federal Modernization Workbook\'s register of the sources its slides and videos link to, '
        'each with a permanent address, a link to the original, its revision history and its latest weekly check."',
        "doc-type: reference",
        'fmw-eyebrow: "Reference"',
        f"date-modified: {latest}",
        *review_fields(),
        "---",
        "",
        "# Source Register {.unnumbered}",
        "",
        "<!-- Generated from data/source-register.json by scripts/source_watch/register.py. Don't edit this page. -->",
        "",
        f"This register lists {len(active)} sources. A slide or a video description links to a source's row here, "
        "and the row links to the original. A deck can't change once it's released, but a row can, so "
        "a link in a released deck stays right when a publisher moves a page.",
        "",
        "## How the register is controlled",
        "",
        "- **A source's address is permanent.** A row can be retired but never deleted or renamed, so a link to it never breaks.",
        "- **Every change is recorded and approved.** A new source, a changed address or a retired row "
        "goes through a reviewed pull request, adds a line to the revision history below, and sends this page back to its owner for approval.",
        "- **The weekly scan reads, and never edits.** Each row's address is one the books cite, so "
        "the Monday source watch checks it. The **Last scan** column shows the latest result. "
        "When a source moves or disappears, the scan proposes the fix in its report and the owner decides.",
        "",
        '<noscript><p>The Last scan column needs JavaScript.</p></noscript>',
        "",
    ]
    publishers: dict[str, list[dict]] = {}
    for s in sources:
        publishers.setdefault(s["publisher"], []).append(s)
    for publisher in sorted(publishers):
        lines += [f"## {publisher}", "", "| Source | Status | In the register since | Last scan |", "|---|---|---|---|"]
        for s in sorted(publishers[publisher], key=lambda r: r["title"].lower()):
            lines.append(f"| [{cell(s['title'])}]({s['url']}){{#{s['id']}}} | {s['status'].capitalize()} | "
                         f"{long_date(s['added'])} | [Not read yet]{{.fmw-scan data-source=\"{s['id']}\"}} |")
        lines.append("")
    lines += ["## Revision history", "", "| Date | Source | Change |", "|---|---|---|"]
    changes = [(h["date"], s["title"], s["id"], h["change"]) for s in sources for h in s["history"]]
    first = latest_first(changes)
    lines += first + ["", "```{=html}", SCRIPT.replace("@SCAN_URL@", SCAN_URL), "```", ""]
    return "\n".join(lines)


def latest_first(changes: list[tuple[str, str, str, str]]) -> list[str]:
    """One line per change, except that one change to a batch of rows on a day is one line."""
    groups: dict[tuple[str, str], list[tuple[str, str]]] = {}
    for date, title, ident, change in changes:
        groups.setdefault((date, change), []).append((title, ident))
    rows = []
    for (date, change), items in sorted(groups.items(), key=lambda kv: kv[0][0], reverse=True):
        who = f"[{cell(items[0][0])}](#{items[0][1]})" if len(items) == 1 else f"{len(items)} sources"
        rows.append(f"| {long_date(date)} | {who} | {change} |")
    return rows


SCRIPT = """<style>
tr:has(:target) { background: #e6f2f1; }
tr :target { scroll-margin-top: 5rem; }
</style>
<script>
(function () {
  // The scan's results live on the source-watch-state branch, not on this page, so a
  // weekly scan needs no deploy and leaves the reviewed page alone.
  var LABEL = { ok: "OK", gone: "Gone", blocked: "Needs a manual check", moved: "Moved", error: "No answer" };
  window.fmwRegisterScan = function (scan) {
    document.querySelectorAll(".fmw-scan").forEach(function (cell) {
      var row = scan.sources[cell.getAttribute("data-source")];
      if (!row) { cell.textContent = "Not scanned yet"; return; }
      cell.textContent = (LABEL[row.status] || row.status) + ", " + row.last_checked;
    });
  };
  fetch("@SCAN_URL@")
    .then(function (r) { if (!r.ok) { throw new Error(); } return r.json(); })
    .then(window.fmwRegisterScan)
    .catch(function () {
      document.querySelectorAll(".fmw-scan").forEach(function (cell) { cell.textContent = "Not available"; });
    });
})();
</script>"""


def write_page(register: dict) -> str:
    text = render(register)
    PAGE.write_text(text, encoding="utf-8", newline="\n")
    return text


def base_register() -> dict | None:
    """The register on the base branch, to compare against. None if it has none yet."""
    base = os.environ.get("REGISTER_BASE", "origin/main")
    run = subprocess.run(["git", "show", f"{base}:data/source-register.json"], cwd=ROOT, capture_output=True)
    return load(run.stdout.decode("utf-8")) if run.returncode == 0 else None


def compare(old: dict, new: dict) -> list[str]:
    """Permanent ids, and a history line for every row that changed."""
    problems = []
    now = {s["id"]: s for s in new["sources"]}
    for was in old["sources"]:
        s = now.get(was["id"])
        if not s:
            problems.append(f"{was['id']}: a row can be retired but never removed")
            continue
        changed = [f for f in ROW_FIELDS if was[f] != s[f]]
        if changed and len(s["history"]) <= len(was["history"]):
            problems.append(f"{was['id']}: {', '.join(changed)} changed with no line in its history")
        if s["history"][: len(was["history"])] != was["history"]:
            problems.append(f"{was['id']}: history can only be added to")
        if was["status"] == "retired" and s["status"] != "retired":
            problems.append(f"{was['id']}: a retired row stays retired")
    return problems


def check_rows(register: dict, cited: dict) -> list[str]:
    problems = []
    seen: set[str] = set()
    labels: set[str] = set()
    ids = {s["id"] for s in register["sources"]}
    for s in register["sources"]:
        where = s.get("id", "?")
        if not ID.match(where) or where in seen:
            problems.append(f"{where}: an id is lower case, letters, digits and hyphens, and unique")
        seen.add(where)
        if s["status"] not in STATUSES:
            problems.append(f"{where}: status is one of {', '.join(STATUSES)}")
        if not s["history"]:
            problems.append(f"{where}: no history")
        if s["status"] == "active" and s["url"] not in cited:
            problems.append(f"{where}: {s['url']} isn't cited in a footnote, so the weekly scan doesn't check it")
        for label in s["labels"]:
            if label in labels:
                problems.append(f"{where}: label {label!r} is on two rows")
            labels.add(label)
    for phrase, parts in register["phrases"].items():
        for part, target in parts.items():
            if target not in ids:
                problems.append(f"phrase {phrase!r}: {part!r} names no row: {target}")
    return problems


def check_deck_links(register: dict) -> list[str]:
    """Every link a linked deck carries resolves. A deck's links are in its _sources.json."""
    problems = []
    ids = {s["id"] for s in register["sources"]}
    for side in sorted((ROOT / "presentations").glob("*/*_Narrated_sources.json")):
        for slide in json.loads(side.read_text(encoding="utf-8")):
            for link in slide["links"]:
                base, _, anchor = link["url"].partition("#")
                where = f"{side.name}, slide {slide['slide']}, {link['text']!r}"
                if not base.startswith(SITE):
                    problems.append(f"{where}: goes straight to {base}; it should go through a register row")
                elif base == PAGE_URL:
                    if anchor not in ids:
                        problems.append(f"{where}: no register row {anchor}")
                else:
                    rel = base[len(SITE):] or "index.html"
                    page = next((p for p in (ROOT / rel[:-5]).parent.glob(Path(rel).stem + ".*")
                                 if p.suffix in (".md", ".qmd")), None)
                    if not page:
                        problems.append(f"{where}: no page {rel}")
                    elif anchor and anchor not in [i for _, i in page_headings(page)]:
                        problems.append(f"{where}: {rel} has no heading {anchor}")
    return problems


def check() -> list[str]:
    register = load()
    problems = check_rows(register, citations.collect())
    if not PAGE.exists() or PAGE.read_bytes().decode("utf-8") != render(register):
        problems.append("docs/reference/source-register.md is stale: run register.py --write")
    old = base_register()
    if old:
        problems += compare(old, register)
    return problems + check_deck_links(register)


def digest(state: dict, register: dict, generated: str) -> dict:
    """Each row's latest result from the scan's saved state."""
    known = state.get("sources", {})
    rows = {}
    for s in register["sources"]:
        entry = known.get(s["url"].split("#")[0])
        if entry:
            rows[s["id"]] = {"status": "moved" if entry.get("moved") else entry.get("status", "error"),
                             "last_checked": entry.get("last_checked", ""), "final_url": entry.get("final_url", "")}
    return {"generated": generated, "sources": rows}


def proposals(events: list[dict], register: dict | None = None) -> list[dict]:
    """What the owner has to decide after a scan: a row whose original moved, went or changed."""
    register = register or load()
    rows = []
    for s in register["sources"]:
        if s["status"] != "active":
            continue
        for e in events:
            if e["url"] == s["url"].split("#")[0] and e["type"] in ("moved", "gone", "changed"):
                fix = {"moved": f"change the row's URL to {e.get('final_url', '')}, once the page there is confirmed",
                       "gone": "find where it went, or retire the row",
                       "changed": "read the change; the row needs nothing unless the source is replaced"}[e["type"]]
                rows.append({"id": s["id"], "title": s["title"], "url": s["url"], "type": e["type"], "fix": fix})
    return rows


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Generate, check and digest the Source Register.")
    parser.add_argument("--write", action="store_true", help="regenerate the page")
    parser.add_argument("--check", action="store_true", help="fail on a broken rule")
    parser.add_argument("--digest", type=Path, metavar="OUT", help="write each row's latest scan result")
    parser.add_argument("--state", type=Path, default=STATE)
    args = parser.parse_args()
    if args.write:
        write_page(load())
        print(f"source register: wrote {PAGE.relative_to(ROOT).as_posix()}")
    if args.digest:
        state = json.loads(args.state.read_text(encoding="utf-8"))
        scan = digest(state, load(), state.get("last_run", ""))
        args.digest.parent.mkdir(parents=True, exist_ok=True)
        args.digest.write_text(json.dumps(scan, indent=1, sort_keys=True) + "\n", encoding="utf-8", newline="\n")
        print(f"source register: {len(scan['sources'])} rows in the digest")
    if args.check:
        problems = check()
        for p in problems:
            print(p, file=sys.stderr)
        if problems:
            return 1
        print("source register: every rule holds")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
