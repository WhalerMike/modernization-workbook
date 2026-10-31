# Source watch

Once a week, the source watcher checks every source the books cite and a set
of federal and vendor publication feeds. When a cited source changed, moved
or disappeared, or a relevant new publication appeared, it opens one GitHub
issue, assigned to the owner (GitHub notifies him by email). The issue lists
each finding under the book and chapter it affects. In a quiet week it opens
no issue.

It runs as the [Source watch](../../.github/workflows/source-watch.yml)
workflow, Mondays at 11:00 UTC, and on demand from the Actions tab. It uses
the Python standard library only.

## What it checks

**Cited sources.** Every URL in a footnote definition (`[^key]: ...`) in
a book chapter, `docs/books/bNN-*/*.md`, or a research page,
`docs/research/*.md` (not the index). Research pages are reported together
under **RES — Research pages**, after the books, by page. Files and folders
starting with `_` are skipped.
So are URLs in inline code (`https://graph.microsoft.com`) and URL
templates (`.../products/{id}/`), which the text quotes rather than cites.
On October 29, 2026 that was 3,020 URLs in 5,780 citations (441 of them on
research pages), 1,850 of the URLs on learn.microsoft.com. A URL first cited
since the last run is fingerprinted silently and reported from the next
change on. Run
`python scripts/source_watch/citations.py` for the current counts.

Each URL gets one plain GET, with redirects followed. The request carries a
generic User-Agent,
`FederalModernizationWorkbook-SourceWatch/1.0 (+https://github.com/WhalerMike/modernization-workbook)`,
and nothing else that identifies anyone. Eight threads run at once, but each
host gets at most one request a second (learn.microsoft.com one every 0.4
s). Timeouts, connection errors, 429 and 5xx are retried twice with backoff.
Each page then falls into one of five classes:

| Class | Meaning |
|---|---|
| unchanged | The fingerprint matches, or differs by less than the threshold. Not reported. |
| changed | The page's text changed by at least the threshold (2% of its paragraphs by default). Also: learn.microsoft.com's `ms.date` moved; a Learn page's source file has a new commit and any paragraph changed; a GitHub file or folder cited at a branch has a new commit; or a PDF or other file's sha256 changed. |
| moved | The URL now answers with a permanent redirect (301/308) to a different address than last week. |
| gone | 404 or 410. |
| blocked | 401, 403, 429 or another 4xx, or no answer two runs in a row. Reported once, when it starts, under "Needs manual check". Never week after week. |

How a page is fingerprinted:

- **learn.microsoft.com.** The page's `ms.date` (the date the author last
  reviewed it) and `updated_at` meta tags, plus the paragraph hashes below.
  A moved `ms.date` is always reported. A new `updated_at` on its own is
  not, because Microsoft republishes pages without changing their content.
  Each page also names the file it is built from and the commit it was
  built at (`original_content_git_url`, `git_commit_id`), and the watcher
  keeps both. The commit moves whenever the file does, even when the
  author leaves `ms.date` alone, so a page with a new commit is reported
  when any paragraph changed, however few: a one-sentence edit to a long
  page falls under the 2% threshold. A new commit with no visible change
  (metadata, a comment) isn't reported. Text a page pulls in from a shared
  include file doesn't move the page's own commit; the paragraph check
  still catches that.
- **GitHub files cited at a branch** (`/blob/main/...`, `/tree/main/...`),
  such as CISA's SCuBA baselines. The newest commit that touched the
  file or folder is looked up through the GitHub API on each run. A new
  commit is reported as a change; the same commit means the file didn't
  change, so a difference in GitHub's own page around it isn't reported.
  A URL pinned to a commit or a tag (`/blob/v2.0.0/...`) can't change and
  gets no lookup; new releases come from the release feeds. A ref that
  looks like a version (`v2.0.0`, `1.8.0`) is taken as a tag, anything
  else as a branch.
- **Other HTML.** The main text: `<main>` or `<article>` if the page has one,
  else the whole body. Scripts, styles, navigation, headers, footers and
  asides are removed, then the tags, and whitespace is collapsed. Lines that
  change on every visit ("Last updated", copyright, "Was this page helpful",
  reading times) are dropped, and so are blocks made only of links
  ("related articles", link lists), which many sites rotate. The watcher stores a short hash per paragraph,
  so it can say how many paragraphs were added and removed and quote the
  added ones.
- **JSON answers** (the NVD API): sha256 of the data with per-request
  `timestamp` fields removed.
- **PDFs and other files.** sha256 and size.

A URL first cited since the last run is recorded silently, unless it is
already gone or refuses the watcher, which is reported. A URL no longer
cited is forgotten.

**New publications.** The feeds in
[`data/source-watch/feeds.json`](../../data/source-watch/feeds.json), each
opened and parsed when it was added:

| Feed | Source |
|---|---|
| CISA cybersecurity advisories, news, blog (RSS) | listed on [CISA's subscribe page](https://www.cisa.gov/about/contact-us/subscribe-updates-cisa) |
| CISA Known Exploited Vulnerabilities (JSON) | `cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` |
| NIST CSRC drafts open for comment (Atom) | linked from [csrc.nist.gov/publications](https://csrc.nist.gov/publications) |
| NIST CSRC publications, draft and final (XLSX) | the same page's spreadsheet of every current FIPS, SP, IR, ITL Bulletin and CSWP. CSRC has no feed of final publications. |
| Federal Register: OMB, OPM, GSA, DHS (CISA publishes as DHS), Commerce, NIST | the [Federal Register API](https://www.federalregister.gov/developers/documentation/api/v1), filtered by security, identity and cloud search terms |
| FedRAMP machine-readable rules | commits and releases of [FedRAMP/rules](https://github.com/FedRAMP/rules), which publishes `fedramp-consolidated-rules.json` (the 2026 Consolidated Rules as data) |

A new item is reported only if its title or summary contains a keyword from
the topic map in the same file. The keyword's topic names the books
(TIC/SASE/MTIPS/CLAW to B09; FedRAMP to B10; 800-63/PIV/FIPS 201 to B02, B03
and B04; and so on). A keyword with a capital letter (`TIC`, `DNS`) matches
case-sensitively; an all-lowercase one (`zero trust`) ignores case. A feed
can also name books of its own, in which case every new item is reported
(every FedRAMP rules commit goes to B10). Topics may point to planned books
(B12 Security Operations, B17 AI Identity Governance); the issue marks those
"(planned)".

**Research review dates.** Every research page (`docs/research/*.md`)
carries `last-reviewed: YYYY-MM-DD` in its front matter: the date someone
last checked it against its sources. A page last reviewed more than 90
days ago, or never, is listed in the issue. Unlike sources and feeds,
this isn't a one-time report: a due page is listed **every week** until
someone reviews it and updates the date. The research banner
(`assets/research-banner.lua`) shows the date in the page's status box
and says when it's overdue, and the Research page lists it in a Reviewed
column. Run `python scripts/source_watch/review_dates.py` to see what's
due now.

**Lifecycle review dates.** Other published pages may carry
`lifecycle_review: YYYY-MM-DD` in their front matter, the date by which the
page should be checked again. Once that date has passed, the page is listed
in the issue every week until someone checks it and moves the date. Pages
under a folder or file starting with `_`, and the research pages (which
have their own date, above), are skipped, and a page without the field is
never listed. On October 31, 2026, 366 published pages had the field; the
first 17 come due on November 22, 2026. The same command lists them.

**Gated pages awaiting review.** Some pages are held behind a review
gate: today, the developer workbooks under Projects
(`docs/project-plans/developer-workbooks/`). Their citations are watched like
a book's, reported under the code `DW`. In addition, each of its pages
records the owner's review in its front matter (`review-status`,
`reviewed-sha256`, `last-reviewed`). A page that isn't approved, or whose
body has changed since it was approved, is listed in the issue **every
week** until the owner reads it and approves it. Work that builds on a page,
such as its narrated chapter tour, waits for the approval. After reading a
page, record the approval in a reviewed pull request:

```sh
python scripts/source_watch/review_gate.py                 # pages awaiting review
python scripts/source_watch/review_gate.py --approve docs/project-plans/developer-workbooks/attribute-driven-migration/01-the-hr-to-entra-middleware.md
```

The hash covers the page body, not its front matter, and ignores trailing
spaces and line endings, so renaming a page or fixing whitespace doesn't
reopen a review. Add a folder to `GATED` in `review_gate.py` to gate another
book.

## How to read an issue

The title is **Source watch — week of YYYY-MM-DD** (the Monday) and the
label is `source-watch`. The issue has four sections:

1. **Changed, moved or gone sources**, by book, then chapter (linked to the
   chapter file), then source. Each entry gives the source's title as the
   footnote cites it and the footnote key (`[^c04-m2209]`, so you can find
   it in the chapter). It then says what happened:
   - *Changed*: `+7 / -2 of 140 paragraphs (6.4%)`, the new `ms.date` for a
     Microsoft Learn page, and up to three added paragraphs, quoted. A
     source cited in several chapters is quoted under the first one only.
     When git can say more, the entry links the comparison on GitHub,
     lists the commits that touched the source file with their messages,
     and quotes up to 12 added (`+`) and removed (`-`) lines in place of
     the paragraphs. That works for a GitHub file and for a Learn page
     whose source repository has a public copy (`MicrosoftDocs/entra-docs`
     for `entra-docs-pr`). On October 31, 2026, 359 of the 404 Learn pages
     the developer workbooks cite had one. For the rest (Intune's
     `memdocs-pr`, the REST API reference), the entry says the source
     isn't public and quotes the paragraphs as before.
     For a PDF, the old and new sizes. Read the passage the footnote
     supports and decide whether the chapter still holds.
   - *Moved*: the new address. Check it is the same document, then update
     the footnote.
   - *Gone*: find the new address or a replacement source.
2. **New publications**, by book: the item, its feed, date, and the
   keywords that matched. Decide whether a chapter should cite or answer it.
3. **Needs manual check**: sources that started refusing the watcher
   (bot blocking, sign-in walls, repeated timeouts), sources that answer
   again after failing, and feeds that started failing. Open each one in a
   browser.
4. **Research due for review**: each research page past its 90-day
   review, with its status and last-reviewed date. Review the page,
   update `last-reviewed` (and any row dates on the page), and it drops
   off the next week's issue.

A week with more than fits in an issue (GitHub's limit is 65,536
characters) is cut short, with counts of what was left out. The full report
is attached to the workflow run as the `source-watch-report` artifact (kept
90 days). A re-run in the same week adds a comment to that week's issue.

The first run records a baseline and opens one issue, "baseline
established: N sources, M feeds". It lists only the cited sources that are
already gone and those the watcher can't read (by host). Nothing else.

## Marking a change as reviewed

Close the issue. Each run compares against the previous run, not against
the date you last reviewed, so a change is reported once and never again.
The open `source-watch` issues are the review backlog. Don't close one until
its chapters are checked.

To have a source re-checked against a fresh baseline after you fix its
footnote, do nothing: a new or changed URL is baselined silently on the next
run. To re-baseline everything, delete the `source-watch-state` branch. The
next run then opens a new "baseline established" issue.

## Limits

- **Sites that block bots.** Some sites refuse automated requests. On
  2026-10-21, www.cisa.gov answered 403 to every page and RSS feed requested
  from Python, though the same URLs, with the same User-Agent, work from curl. The KEV
  JSON file still worked. The watcher identifies itself honestly and
  doesn't try to get around blocking, so blocked sources are listed once
  under "Needs manual check" and then left to you.
- **Agencies rename PDFs when they republish.** White House and CISA PDFs
  often reappear at a new path with no redirect. "Gone" or "moved" on a
  PDF usually means "find the new URL", not that the document was
  withdrawn. Any change to a PDF's bytes counts as changed, even when only
  its metadata was regenerated.
- **Dynamic pages.** Pages that rotate news, counters or recommendations in
  their main text can look changed every week. If one keeps showing up with
  small changes, raise `threshold_pct` in
  [`data/source-watch/config.json`](../../data/source-watch/config.json),
  or add the host to `skip_hosts`.
- **Text rendered by JavaScript** isn't seen. Such a page fingerprints only
  its static shell, so real changes can go unnoticed.
- **Moves that aren't redirects.** A page replaced by a "this page has moved"
  notice with status 200 shows up as *changed*, not *moved*.
- **Keyword matching is simple.** A feed item that matches a broad keyword
  can be irrelevant, and a relevant one can be missed. Tune the topic map in
  `feeds.json`.

## Running it locally

```sh
python scripts/source_watch/citations.py                      # counts
python scripts/source_watch/citations.py --json               # url -> citations
python scripts/source_watch/review_dates.py                    # research pages due for review, pages past their lifecycle review date

# Check 60 sources, mixed across hosts, into a scratch state file; print the report.
python scripts/source_watch/watch.py --state /tmp/sw.json --no-feeds --dry-run --limit 60
python scripts/source_watch/watch.py --state /tmp/sw.json --dry-run --only-domain cisa.gov
python scripts/source_watch/watch.py --state /tmp/sw.json --dry-run --url https://www.rfc-editor.org/rfc/rfc4120

# Feeds only; show items from the last 14 days instead of baselining silently.
python scripts/source_watch/watch.py --state /tmp/feeds.json --no-sources --dry-run --since-days 14

# What the workflow does (report.py --open-issue needs GITHUB_TOKEN).
python scripts/source_watch/watch.py --results-out _watch/results.json --report-out _watch/report.md
python scripts/source_watch/report.py --results _watch/results.json --dry-run
```

The default state file is `data/source-watch/state.json`, which git ignores.
`--no-save` leaves the state file untouched. `report.py` refuses to open an
issue for a run filtered by `--limit`, `--only-domain` or `--url`.

Files:

| File | What it does |
|---|---|
| `citations.py` | Extracts the footnoted URLs and maps each to book, chapter and footnote. Reads the books list from `docs/books/index.md`. |
| `netfetch.py` | HTTP: the generic User-Agent, per-host pacing, retries and the redirect record. |
| `gitsource.py` | Git history from the GitHub API: a Learn page's source repository and its public copy, a cited branch's latest commit, and the commits and changed lines between two commits. Called with the workflow's token. |
| `watch.py` | Fingerprints and classifies each source, polls the feeds, and writes the state and results. |
| `feeds.py` | The feed readers and the topic matching. |
| `report.py` | Renders the Markdown digest and opens the issue. |
| `review_dates.py` | Lists the research pages due for review (`last-reviewed` older than 90 days, or missing), and the pages whose `lifecycle_review` date has passed. |
| `data/source-watch/config.json` | Threshold, concurrency, timeouts, per-host delays and skipped hosts. |
| `data/source-watch/feeds.json` | The feeds and the topic → book map. |
| `source-watch-state` branch | `data/source-watch/state.json`: per-source fingerprints and per-feed seen ids. Kept off main, because every push to main redeploys the site. |
