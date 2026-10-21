"""New-publication feeds for the source watcher.

data/source-watch/feeds.json lists the feeds and a topic map. Each topic has
keywords and the books it concerns. A new feed item is reported when its
title or summary (the fields a feed names in `match`) contains a topic
keyword, or when its feed names `books` of its own (every item of a FedRAMP
rules commit concerns Book 10). Keyword matching is whole-word; a keyword
with a capital letter (`TIC`, `DNS`, `Intune`) matches case-sensitively, an
all-lowercase one (`zero trust`) ignores case.

Feed types:

- `rss`:              RSS 2.0 or Atom (CISA advisories/news/blog, NIST drafts).
- `cisa_kev`:         CISA's Known Exploited Vulnerabilities catalog (JSON).
- `nist_xlsx`:        CSRC's spreadsheet of every current FIPS, SP, IR, ITL
                      Bulletin and CSWP, draft and final (new rows = new
                      publications or new stages).
- `federal_register`: the Federal Register API, by agency and search term.
- `github_commits`:   commits to a GitHub repository (optionally one path).
- `github_releases`:  releases of a GitHub repository.

Seen item ids are kept per feed in the state file. A feed seen for the first
time is baselined silently (all current items marked seen), unless
`--since-days` asks for recent items to be shown.

Standard library only.
"""

from __future__ import annotations

import datetime as dt
import email.utils
import html
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from io import BytesIO
from urllib.parse import urlencode

from netfetch import fetch, github_headers

MAX_SEEN = 20_000
TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")


def plain(text: str, limit: int = 400) -> str:
    text = WS.sub(" ", html.unescape(TAG.sub(" ", text or ""))).strip()
    return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0] + " …"


def parse_date(value: str) -> str:
    """Best-effort ISO date (YYYY-MM-DD) from RSS, Atom, ISO or mm/dd/yyyy text."""
    value = (value or "").strip()
    if not value:
        return ""
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", value)
    if m:
        return m.group(0)
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})$", value)
    if m:
        return f"{m.group(3)}-{int(m.group(1)):02d}-{int(m.group(2)):02d}"
    try:
        d = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return ""
    if d.year < 100:  # CISA writes two-digit years ("Wed, 21 Oct 26")
        d = d.replace(year=d.year + 2000)
    return d.date().isoformat()


# ------------------------------------------------------------------ fetchers


def _get(url: str, headers: dict | None = None):
    r = fetch(url, timeout=60, retries=2, headers=headers)
    if r.status != 200:
        raise RuntimeError(f"HTTP {r.status or r.error} from {url}")
    return r.body


def fetch_rss(feed: dict, since: str) -> list[dict]:
    root = ET.fromstring(_get(feed["url"]).lstrip(b"\xef\xbb\xbf"))
    items = []
    atom = "{http://www.w3.org/2005/Atom}"
    if root.tag == f"{atom}feed":
        for e in root.findall(f"{atom}entry"):
            link = e.find(f"{atom}link")
            items.append(
                {
                    "id": (e.findtext(f"{atom}id") or "").strip(),
                    "title": plain(e.findtext(f"{atom}title") or "", 300),
                    "url": link.get("href", "") if link is not None else "",
                    "date": parse_date(e.findtext(f"{atom}updated") or e.findtext(f"{atom}published") or ""),
                    "summary": plain(e.findtext(f"{atom}summary") or e.findtext(f"{atom}content") or ""),
                }
            )
        return items
    base = feed.get("base", "")
    for e in root.iter("item"):
        link = (e.findtext("link") or "").strip()
        guid = (e.findtext("guid") or "").strip()
        items.append(
            {
                "id": guid or link,
                "title": plain(e.findtext("title") or "", 300),
                "url": link if link.startswith("http") else base + link,
                "date": parse_date(e.findtext("pubDate") or ""),
                "summary": plain(e.findtext("description") or ""),
            }
        )
    return items


def fetch_cisa_kev(feed: dict, since: str) -> list[dict]:
    data = json.loads(_get(feed["url"]))
    out = []
    for v in data.get("vulnerabilities", []):
        cve = v.get("cveID", "")
        out.append(
            {
                "id": cve,
                "title": f"{cve}: {v.get('vulnerabilityName', '')}",
                "url": f"https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext={cve}",
                "date": parse_date(v.get("dateAdded", "")),
                "summary": plain(
                    f"{v.get('vendorProject', '')} {v.get('product', '')}. {v.get('shortDescription', '')}"
                ),
            }
        )
    return out


def _xlsx_rows(blob: bytes) -> list[dict[str, str]]:
    ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    z = zipfile.ZipFile(BytesIO(blob))
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("x:si", ns):
            shared.append("".join(t.text or "" for t in si.iter(f"{{{ns['x']}}}t")))
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = []
    for row in sheet.iter(f"{{{ns['x']}}}row"):
        cells = {}
        for c in row.findall("x:c", ns):
            col = re.match(r"[A-Z]+", c.get("r", "")).group(0)
            v = c.find("x:v", ns)
            if v is None:
                t = c.find("x:is/x:t", ns)
                val = t.text if t is not None else ""
            else:
                val = shared[int(v.text)] if c.get("t") == "s" else (v.text or "")
            cells[col] = val
        rows.append(cells)
    if not rows:
        return []
    header = rows[0]
    return [{header.get(k, k): v for k, v in r.items()} for r in rows[1:]]


def fetch_nist_xlsx(feed: dict, since: str) -> list[dict]:
    out = []
    for r in _xlsx_rows(_get(feed["url"])):
        # ITL Bulletins have no PubID; their series and title identify them.
        pub = r.get("PubID", "").strip() or f"{r.get('Series', '').strip()}: {r.get('Title', '').strip()}"
        if pub.startswith(": "):
            continue
        stage = r.get("Stage", "").strip()
        sub = r.get("Substage", "").strip()
        release = r.get("Release Date", "")
        out.append(
            {
                "id": f"{pub}|{stage}|{sub}|{release}",
                "title": (f"{WS.sub(' ', pub)}: {r.get('Title', '').strip()}" if r.get("PubID") else pub)
                + f" ({' '.join(x for x in (stage, sub) if x)})",
                "url": r.get("URL", "") or r.get("CurrentURL", ""),
                "date": parse_date(release),
                "summary": plain(r.get("Abstract", "")),
                "keywords": r.get("Keywords", ""),
            }
        )
    return out


def fetch_federal_register(feed: dict, since: str) -> list[dict]:
    params = [("per_page", "100"), ("order", "newest"), ("conditions[publication_date][gte]", since)]
    params += [("conditions[agencies][]", a) for a in feed.get("agencies", [])]
    if feed.get("term"):
        params.append(("conditions[term]", feed["term"]))
    for t in feed.get("types", []):
        params.append(("conditions[type][]", t))
    for f in ("document_number", "title", "abstract", "html_url", "publication_date", "agencies", "type"):
        params.append(("fields[]", f))
    url = "https://www.federalregister.gov/api/v1/documents.json?" + urlencode(params)
    out = []
    for _ in range(5):  # at most 500 documents a run
        data = json.loads(_get(url))
        for d in data.get("results", []):
            agencies = ", ".join(a.get("name") or a.get("raw_name", "") for a in d.get("agencies", []))
            out.append(
                {
                    "id": d.get("document_number", ""),
                    "title": plain(d.get("title", ""), 300),
                    "url": d.get("html_url", ""),
                    "date": d.get("publication_date", ""),
                    "summary": plain(d.get("abstract") or ""),
                    "agencies": f"{d.get('type', '')} · {agencies}",
                }
            )
        url = data.get("next_page_url")
        if not url:
            break
    return out


def fetch_github_commits(feed: dict, since: str) -> list[dict]:
    q = {"per_page": "100", "since": f"{since}T00:00:00Z"}
    if feed.get("path"):
        q["path"] = feed["path"]
    data = json.loads(_get(f"https://api.github.com/repos/{feed['repo']}/commits?{urlencode(q)}", github_headers()))
    return [
        {
            "id": c["sha"],
            "title": f"{feed['repo']}: {(c['commit']['message'] or '').splitlines()[0][:200]}",
            "url": c.get("html_url", ""),
            "date": parse_date(c["commit"]["committer"]["date"]),
            "summary": plain(c["commit"]["message"]),
        }
        for c in data
    ]


def fetch_github_releases(feed: dict, since: str) -> list[dict]:
    data = json.loads(_get(f"https://api.github.com/repos/{feed['repo']}/releases?per_page=30", github_headers()))
    return [
        {
            "id": str(r["id"]),
            "title": f"{feed['repo']} {r.get('tag_name', '')}: {r.get('name') or ''}".strip(),
            "url": r.get("html_url", ""),
            "date": parse_date(r.get("published_at") or ""),
            "summary": plain(r.get("body") or ""),
        }
        for r in data
        if not r.get("draft")
    ]


FETCHERS = {
    "rss": fetch_rss,
    "cisa_kev": fetch_cisa_kev,
    "nist_xlsx": fetch_nist_xlsx,
    "federal_register": fetch_federal_register,
    "github_commits": fetch_github_commits,
    "github_releases": fetch_github_releases,
}

# ------------------------------------------------------------------ topics


def compile_topics(topics: list[dict]) -> list[tuple[dict, list[tuple[str, re.Pattern]]]]:
    out = []
    for t in topics:
        pats = []
        for kw in t.get("keywords", []):
            flags = 0 if kw != kw.lower() else re.I
            pats.append((kw, re.compile(r"(?<![\w-])" + re.escape(kw) + r"(?![\w])", flags)))
        out.append((t, pats))
    return out


def match(item: dict, fields: list[str], topics) -> tuple[list[str], list[str]]:
    text = " \n ".join(str(item.get(f, "")) for f in fields)
    books, hits = [], []
    for topic, pats in topics:
        found = [kw for kw, p in pats if p.search(text)]
        if found:
            hits += [k for k in found if k not in hits]
            books += [b for b in topic.get("books", []) if b not in books]
    return books, hits


def poll_all(cfg: dict, feed_state: dict, now: dt.datetime, only: list[str], since_days: int, log):
    """Returns (reportable items, errors, counts). Updates feed_state in place."""
    topics = compile_topics(cfg.get("topics", []))
    items, errors, counts = [], [], {}
    today = now.date()
    for feed in cfg.get("feeds", []):
        fid = feed["id"]
        if only and fid not in only:
            continue
        st = feed_state.get(fid)
        first = st is None or bool(st.get("baseline_pending"))
        st = dict(st or {"seen": []})
        st.pop("baseline_pending", None)
        last = st.get("last_run", "")[:10]
        lookback = feed.get("lookback_days", 14)
        start = (
            (dt.date.fromisoformat(last) - dt.timedelta(days=7))
            if last
            else today - dt.timedelta(days=max(lookback, since_days))
        )
        try:
            got = FETCHERS[feed["type"]](feed, start.isoformat())
        except Exception as e:  # one broken feed must not stop the others
            # Reported once, when the feed first fails; not every week it stays down.
            if st.get("status") != "error":
                errors.append(
                    {
                        "feed": fid,
                        "name": feed.get("name", fid),
                        "url": feed.get("url") or feed.get("repo", ""),
                        "error": str(e)[:300],
                    }
                )
            st["status"], st["error"] = "error", str(e)[:300]
            feed_state[fid] = st if not first else {**st, "baseline_pending": True}
            counts[fid] = {"error": str(e)[:300]}
            log(f"  feed {fid}: ERROR {e}")
            continue
        seen = set(st["seen"])
        new = [i for i in got if i["id"] and i["id"] not in seen]
        cutoff = (today - dt.timedelta(days=since_days)).isoformat()
        report_new = new if not first else [i for i in new if since_days and i.get("date", "") >= cutoff]
        fields = feed.get("match", ["title", "summary"])
        shown = 0
        for i in report_new:
            books, hits = match(i, fields, topics)
            books += [b for b in feed.get("books", []) if b not in books]
            if not books:
                continue
            shown += 1
            items.append(
                {
                    **{k: v for k, v in i.items() if k not in ("keywords", "agencies")},
                    "feed": fid,
                    "feed_name": feed.get("name", fid),
                    "books": sorted(books),
                    "matched": hits,
                }
            )
        st["seen"] = (st["seen"] + [i["id"] for i in new if i["id"]])[-MAX_SEEN:]
        st["last_run"] = now.isoformat(timespec="seconds")
        st["status"], st["error"] = "ok", ""
        feed_state[fid] = st
        counts[fid] = {"fetched": len(got), "new": len(new), "reported": shown, "baseline": first}
        log(f"  feed {fid}: {len(got)} items, {len(new)} new, {shown} reported{' (baseline)' if first else ''}")
    return items, errors, counts
