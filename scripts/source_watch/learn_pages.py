#!/usr/bin/env python3
"""The Microsoft Learn pages the Learn coverage map tracks, and which came and went.

Five Learn folders are tracked, each built from a public GitHub repository:

| Site key | Repository folder | Published at |
|---|---|---|
| windows-server-identity | MicrosoftDocs/windowsserverdocs `WindowsServerDocs/identity/` | learn.microsoft.com/windows-server/identity/... |
| entra | MicrosoftDocs/entra-docs `docs/` | learn.microsoft.com/entra/... |
| windows-server-get-started | MicrosoftDocs/windowsserverdocs `WindowsServerDocs/get-started/` | learn.microsoft.com/windows-server/get-started/... |
| windows-server-security | MicrosoftDocs/windowsserverdocs `WindowsServerDocs/security/` | learn.microsoft.com/windows-server/security/... |
| windows-server-file-server | MicrosoftDocs/windowsserverdocs `WindowsServerDocs/storage/file-server/` | learn.microsoft.com/windows-server/storage/file-server/... |

The last three hold Windows Server's release notes (what's new, features
removed or no longer developed) and the security and SMB pages those changes
lean on: Kerberos, NTLM, TLS, Credential Guard, SMB signing and hardening.

A file is a page when docfx would publish it: a `.md` or `.yml` file under the
folder, not in an `includes/` or `media/` folder, not a table of contents
(`toc.yml`), a breadcrumb, a context file (`context/*.yml`) or the zone pivot
list. The Entra side leaves out `docs/identity/saas-apps/` (one tutorial per
SaaS application); the security side leaves out `guarded-fabric-shielded-vm/`
(Hyper-V shielded virtual machines) and `gdpr/` (one page on GDPR requests). A page's URL is the repository's docfx mapping: the path
under the docset's build folder (`build_source_folder` in
`.openpublishing.publish.config.json`), without its extension, under the
docset's `dest` in `docfx.json` (`windows-server`, `entra`); an `index` file is
published at its folder. URLs are compared lower-cased, with no locale, query,
anchor or trailing slash (`norm`).

This module is shared. `scripts/learn_coverage.py` uses the rules above to build
the coverage data in `data/learn-coverage/`, and the weekly source watch
(`watch.py`) calls `check` to list the pages added to or removed from the two
folders since its previous run, from one GitHub API call per folder (the
folder's tree), keeping the previous list in its state file.

    python scripts/source_watch/learn_pages.py      # count the pages on Learn now (network)

Standard library only, so the workflow needs no extra Python packages.
"""

from __future__ import annotations

import fnmatch
import posixpath
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable
from urllib.parse import quote, urlsplit

HOST = "learn.microsoft.com"
API = "https://api.github.com"


@dataclass(frozen=True)
class Site:
    key: str            # data/learn-coverage/<key>.yml
    name: str           # the heading on the reference page
    repo: str           # owner/name on GitHub
    branch: str
    build_folder: str   # the docset's build_source_folder
    dest: str           # docfx.json build.dest: the URL path the docset publishes under
    folder: str         # the tracked folder, relative to the repository root
    exclude: tuple[str, ...] = ()   # folders under it that are left out, relative to the repository root
    skip: tuple[str, ...] = ()      # single pages left out (fnmatch patterns on the repository path), not listed
    area_depth: dict = None  # top folder -> how many folder levels name the area (default 1)

    def area(self, path: str) -> str:
        """The page's area, lower-cased: its first folder under the tracked folder (two for Entra's identity/)."""
        rel = path[len(self.folder) + 1:] if path.startswith(self.folder + "/") else path
        parts = rel.split("/")[:-1]
        if not parts:
            return "general"
        depth = (self.area_depth or {}).get(parts[0].lower(), 1)
        return (parts[depth - 1] if len(parts) >= depth else parts[0]).lower()


SITES = (
    Site(
        key="windows-server-identity",
        name="Windows Server identity",
        repo="MicrosoftDocs/windowsserverdocs",
        branch="main",
        build_folder="WindowsServerDocs",
        dest="windows-server",
        folder="WindowsServerDocs/identity",
    ),
    Site(
        key="entra",
        name="Microsoft Entra",
        repo="MicrosoftDocs/entra-docs",
        branch="main",
        build_folder="docs",
        dest="entra",
        folder="docs",
        exclude=("docs/identity/saas-apps",),
        skip=("docs/standards/configure-cmmc-*", "docs/standards/configure-for-cmmc-*"),
        area_depth={"identity": 2},
    ),
    Site(
        key="windows-server-get-started",
        name="Windows Server releases",
        repo="MicrosoftDocs/windowsserverdocs",
        branch="main",
        build_folder="WindowsServerDocs",
        dest="windows-server",
        folder="WindowsServerDocs/get-started",
    ),
    Site(
        key="windows-server-security",
        name="Windows Server security",
        repo="MicrosoftDocs/windowsserverdocs",
        branch="main",
        build_folder="WindowsServerDocs",
        dest="windows-server",
        folder="WindowsServerDocs/security",
        exclude=("WindowsServerDocs/security/guarded-fabric-shielded-vm", "WindowsServerDocs/security/gdpr"),
    ),
    Site(
        key="windows-server-file-server",
        name="Windows Server file server and SMB",
        repo="MicrosoftDocs/windowsserverdocs",
        branch="main",
        build_folder="WindowsServerDocs",
        dest="windows-server",
        folder="WindowsServerDocs/storage/file-server",
    ),
)
SITE = {s.key: s for s in SITES}

NOT_PAGES = {"toc.yml", "zone-pivot-groups.yml", "docfx.json", "readme.md", "license.md",
             "thirdpartynotices.md", "security.md"}
NOT_PAGE_FOLDERS = {"includes", "media", "breadcrumb", "context", "obj"}


def is_page(site: Site, path: str) -> bool:
    """True if docfx publishes this repository file as a page of the tracked folder."""
    if not path.startswith(site.folder + "/") or not path.lower().endswith((".md", ".yml")):
        return False
    if any(path == x or path.startswith(x + "/") for x in site.exclude) or skipped(site, path):
        return False
    parts = path[len(site.folder) + 1:].split("/")
    if parts[-1].lower() in NOT_PAGES:
        return False
    return not any(p.lower() in NOT_PAGE_FOLDERS or p.startswith((".", "_")) for p in parts[:-1])


def skipped(site: Site, path: str) -> bool:
    """True for a single page the map leaves out (outside the workbook's scope)."""
    return any(fnmatch.fnmatchcase(path, x) for x in site.skip)


def page_url(site: Site, path: str) -> str:
    """The published URL of a repository file (no locale; lower-cased like `norm`)."""
    rel = path[len(site.build_folder) + 1:] if path.startswith(site.build_folder + "/") else path
    stem = posixpath.splitext(rel)[0]
    if posixpath.basename(stem).lower() == "index":
        stem = posixpath.dirname(stem)
    return f"https://{HOST}/" + "/".join(x for x in f"{site.dest}/{stem}".split("/") if x).lower()


LOCALE = re.compile(r"^[a-z]{2}(-[a-z]{2,4})+$")


def norm(url: str) -> str | None:
    """A Learn URL as the coverage map compares it, or None for any other host.

    Lower-cased, on learn.microsoft.com (docs.microsoft.com and technet/msdn docs
    hosts moved there), without the locale segment, query, anchor or trailing slash.
    """
    try:
        parts = urlsplit(url.strip())
    except ValueError:
        return None
    host = (parts.hostname or "").lower()
    if host not in (HOST, "docs.microsoft.com"):
        return None
    segs = [s for s in parts.path.split("/") if s]
    if segs and LOCALE.match(segs[0].lower()):
        segs = segs[1:]
    if not segs:
        return None
    return f"https://{HOST}/" + "/".join(segs).lower()


# ------------------------------------------------------------------ the weekly check

Getter = Callable[[str], "tuple[int, object]"]


def remote_pages(site: Site, get: Getter) -> dict[str, str]:
    """{url: repository path} for the folder's pages now, from the repository tree (one API call)."""
    url = f"{API}/repos/{site.repo}/git/trees/{quote(site.branch + ':' + site.folder, safe='')}?recursive=1"
    status, data = get(url)
    if status != 200 or not isinstance(data, dict) or "tree" not in data:
        raise RuntimeError(f"GitHub answered {status} for the {site.repo} tree")
    if data.get("truncated"):
        raise RuntimeError(f"GitHub truncated the {site.repo} tree")
    out = {}
    for item in data["tree"]:
        if item.get("type") != "blob":
            continue
        path = f"{site.folder}/{item['path']}"
        if is_page(site, path):
            out[page_url(site, path)] = path
    return out


def check(state: dict, get: Getter, log=lambda msg: None) -> dict:
    """Compare each folder's pages with the previous run's and update the state.

    state["learn_pages"] holds {site key: {url: path}}. A site seen for the first
    time is recorded silently. Returns {"added": [...], "removed": [...], "errors": [...]},
    each change {site, name, repo, url, path}.
    """
    saved = state.setdefault("learn_pages", {})
    result: dict[str, list] = {"added": [], "removed": [], "errors": []}
    for site in SITES:
        try:
            now = remote_pages(site, get)
        except (RuntimeError, OSError) as exc:
            log(f"learn pages: {exc}")
            result["errors"].append({"site": site.key, "name": site.name, "error": str(exc)})
            continue
        before = saved.get(site.key)
        if before is not None:
            for url in sorted(set(now) - set(before)):
                result["added"].append({"site": site.key, "name": site.name, "repo": site.repo, "url": url,
                                        "path": now[url]})
            for url in sorted(set(before) - set(now)):
                result["removed"].append({"site": site.key, "name": site.name, "repo": site.repo, "url": url,
                                          "path": before[url]})
        else:
            log(f"learn pages: {site.name}: {len(now):,} pages recorded (first run)")
        saved[site.key] = dict(sorted(now.items()))
    return result


def main() -> int:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import gitsource  # noqa: E402

    for site in SITES:
        pages = remote_pages(site, gitsource.api_get)
        print(f"{site.name}: {len(pages):,} pages in {site.repo}/{site.folder}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
