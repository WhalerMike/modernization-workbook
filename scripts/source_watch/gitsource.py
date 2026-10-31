"""Git history for sources that live in GitHub: Microsoft Learn pages and GitHub files.

Every learn.microsoft.com page names the file it is built from and the commit
it was built at, in two meta tags:

    <meta name="original_content_git_url" content="https://github.com/MicrosoftDocs/entra-docs-pr/blob/live/docs/agent-id/whats-new-agent-id.md" />
    <meta name="git_commit_id" content="328408b50672fc081a29e9fe01684bcd7667dd9f" />

The commit moves whenever the file does, whatever the page's hand-set
`ms.date` says. The source is usually a private `-pr` repository; most have a
public copy with the same commits (`MicrosoftDocs/entra-docs`), where the
change can be read line by line. Some (Intune's `memdocs-pr`, the REST API
reference) have none.

A GitHub URL cited at a branch (`/blob/main/...`, `/tree/main/...`) moves
too: its latest commit is looked up on each run. One pinned to a commit or a
tag can't change, so it gets no lookup; new releases come from the feeds.

Uses the GitHub REST API with the workflow's token (netfetch.github_headers).
Standard library only.
"""

from __future__ import annotations

import json
import re
from typing import Callable
from urllib.parse import quote, unquote

from netfetch import fetch, github_headers

API = "https://api.github.com"

# Private source repository -> public copy, where the name isn't the private
# name without `-pr`.
PUBLIC = {
    "microsoftgraph/microsoft-graph-docs": "microsoftgraph/microsoft-graph-docs-contrib",
}

GITHUB_FILE = re.compile(r"^https://github\.com/([^/]+/[^/]+)/(blob|tree)/([^/]+)/?(.*)$")
SHA = re.compile(r"^[0-9a-f]{40}$")
TAG = re.compile(r"^v?\d+(\.\d+)*([-+.][\w.]+)?$")

Getter = Callable[[str], "tuple[int, object]"]


def api_get(url: str) -> tuple[int, object]:
    """(HTTP status, parsed JSON or None) for one GitHub API call."""
    resp = fetch(url, timeout=30, retries=2, headers=github_headers())
    if resp.status != 200:
        return resp.status, None
    try:
        return 200, json.loads(resp.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return 0, None


def learn_source(git_url: str) -> tuple[str, str] | None:
    """(source repository, file path) from a Learn page's original_content_git_url."""
    m = GITHUB_FILE.match(git_url or "")
    if not m or m.group(2) != "blob":
        return None
    return m.group(1), unquote(m.group(4))


def public_repo(repo: str) -> str:
    """The public copy of a Learn source repository (it may not exist)."""
    if repo in PUBLIC:
        return PUBLIC[repo]
    return repo[: -len("-pr")] if repo.endswith("-pr") else repo


def github_branch_target(url: str) -> tuple[str, str, str] | None:
    """(repository, branch, path) for a GitHub file or folder URL cited at a branch;
    None when it is pinned to a commit or a tag (it can't change), or isn't one."""
    m = GITHUB_FILE.match(url.split("#")[0].split("?")[0])
    if not m:
        return None
    repo, ref, path = m.group(1), m.group(3), unquote(m.group(4)).rstrip("/")
    if SHA.match(ref) or TAG.match(ref):
        return None
    return repo, ref, path


def latest_commit(repo: str, ref: str, path: str, get: Getter = api_get) -> str | None:
    """The newest commit on `ref` that touched `path` (a file or a folder), or None."""
    q = f"sha={quote(ref)}&per_page=1" + (f"&path={quote(path)}" if path else "")
    status, data = get(f"{API}/repos/{repo}/commits?{q}")
    if status != 200 or not isinstance(data, list) or not data:
        return None
    return data[0].get("sha")


def changes(repo: str, path: str, old: str, new: str, ref: str = "", max_lines: int = 12, get: Getter = api_get) -> dict:
    """What changed in `path` (a file or a folder) of `repo` after commit `old`, up to
    commit `new`: the commits that touched it, newest first, and up to `max_lines`
    added or removed lines.

    {"repo", "path", "compare_url", "status": "ok" | "not public" | "error",
     "commits": [{"sha", "date", "message"}], "more_commits": bool, "lines": ["+ ...", "- ..."], "more_lines": n}
    """
    out = {
        "repo": repo,
        "path": path,
        "compare_url": f"https://github.com/{repo}/compare/{old[:12]}...{new[:12]}",
        "status": "ok",
        "commits": [],
        "more_commits": False,
        "lines": [],
        "more_lines": 0,
    }
    q = "per_page=30" + (f"&sha={quote(ref)}" if ref else "") + (f"&path={quote(path)}" if path else "")
    status, history = get(f"{API}/repos/{repo}/commits?{q}")
    if status == 404:
        out["status"], out["compare_url"] = "not public", ""
        return out
    if status != 200 or not isinstance(history, list):
        out["status"] = "error"
        return out
    shas = [c.get("sha", "") for c in history]
    start = shas.index(new) if new in shas else 0
    end = shas.index(old) if old in shas else len(shas)
    out["more_commits"] = old not in shas
    for c in history[start:end]:
        msg = (c.get("commit", {}).get("message") or "").split("\n")[0]
        if msg.startswith(("Merge ", "Merging ")):
            continue  # a public copy's sync merges say nothing about the file
        date = c.get("commit", {}).get("committer", {}).get("date", "")[:10]
        out["commits"].append({"sha": c.get("sha", "")[:12], "date": date, "message": msg})
    status, data = get(f"{API}/repos/{repo}/compare/{old}...{new}")
    if status != 200 or not isinstance(data, dict):
        return out  # the commits still say what happened; the lines are a bonus
    prefix = path.rstrip("/") + "/"
    lines = []
    for f in data.get("files", []):
        name = f.get("filename", "")
        if path and name != path and not name.startswith(prefix):
            continue
        for line in (f.get("patch") or "").split("\n"):
            if line.startswith(("+", "-")) and not line.startswith(("+++", "---")) and line[1:].strip():
                lines.append(f"{line[0]} {line[1:].strip()}")
    out["lines"], out["more_lines"] = lines[:max_lines], max(0, len(lines) - max_lines)
    return out
