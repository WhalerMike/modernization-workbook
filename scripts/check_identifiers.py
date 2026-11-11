#!/usr/bin/env python3
"""Flag organization-specific identifiers on published pages (convention G-04).

The workbook never embeds a customer name, tenant domain, person, application
name, private count or private object identifier (Book 00, Appendix D,
"Terminology"). Agency names are caught by scripts/check_neutrality.py. This
check catches two identifier shapes that a pasted tenant export leaves behind:

- **Tenant names**: a `<name>.onmicrosoft.com` (or `.onmicrosoft.us`) domain
  anywhere on a published page, code included, unless `<name>` is a documented
  example tenant (Contoso, Fabrikam, `tenant`, `yourdomain`, `yourtenant`,
  `agency`, `example`, and names that start with one of them, such as
  `contosoexample`). Placeholders such as `<tenant>.onmicrosoft.com` don't
  match at all.
- **Real-looking GUIDs**: a GUID in prose, outside fenced and inline code,
  link targets and HTML comments, unless it is synthetic (Learn's example
  format `00001111-aaaa-2222-bbbb-3333cccc4444`, runs such as
  `a0000000-0000-4000-8000-000000000020`, or fewer than ten distinct hex
  digits). A GUID in a code block or in inline code (such as Microsoft's
  published ID for a built-in role, in a table cell) is an example's own input
  or output; a bare GUID in prose is the one most likely to have come from a
  real tenant.

    python scripts/check_identifiers.py                 # every published page; exit 1 on a hit
    python scripts/check_identifiers.py docs/x.md       # just these files

A hit is reported as <file>:<line> and the kind of identifier, never the value,
because Actions logs on this repository are public. A legitimate use carries an
allow marker on the same line or alone on the line above, with a reason:

    <!-- identifiers-ok: Microsoft's published ID for the Global Administrator role -->

Scope: the published pages scripts/check_claims.py reads (the site's render
roots, minus files and folders starting with "_", and the example kits'
README.md files).
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_claims  # noqa: E402  (shares the published-page scope)

TENANT = re.compile(r"(?<![A-Za-z0-9.-])([A-Za-z0-9][A-Za-z0-9-]*)\.onmicrosoft\.(?:com|us)\b", re.I)
EXAMPLE_TENANT = re.compile(r"(?:contoso|fabrikam|tenant|yourdomain|yourtenant|agency|example)", re.I)
URL_ESCAPE = re.compile(r"%[0-9A-Fa-f]{2}")
GUID = re.compile(r"(?<![0-9A-Fa-f-])[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}"
                  r"(?![0-9A-Fa-f-])")
# Learn's example GUID format, and the obvious stand-ins: long runs of one digit, counting sequences.
SYNTHETIC = re.compile(r"(.)\1{3}|0123|1234|2345|3456|4567|5678|6789|abcd|a1b2|b2c3|c3d4", re.I)
ALLOW = re.compile(r"<!--\s*identifiers-ok:\s*\S.*?-->", re.I)
ALLOW_ALONE = re.compile(r"^\s*<!--\s*identifiers-ok:\s*\S.*?-->\s*$", re.I)

FENCE = check_claims.FENCE
COMMENT = check_claims.COMMENT
INLINE_CODE = check_claims.INLINE_CODE
LINK_TARGET = check_claims.LINK_TARGET


def in_scope(path: str) -> bool:
    return check_claims.in_scope(path)


def is_example_tenant(name: str) -> bool:
    return bool(EXAMPLE_TENANT.match(name))


def is_synthetic(guid: str) -> bool:
    hexdigits = guid.replace("-", "").lower()
    return len(set(hexdigits)) < 10 or bool(SYNTHETIC.search(hexdigits))


def _blank(m: re.Match) -> str:
    return re.sub(r"[^\n]", " ", m.group(0))


def prose_lines(text: str) -> list[str]:
    """The page's lines with fenced and inline code, comments and link targets blanked."""
    text = COMMENT.sub(_blank, text)
    out, fence = [], None
    for line in text.split("\n"):
        m = FENCE.match(line)
        if fence:
            if m and m.group(1)[0] == fence[0] and len(m.group(1)) >= len(fence):
                fence = None
            out.append("")
            continue
        if m:
            fence = m.group(1)
            out.append("")
            continue
        line = INLINE_CODE.sub(_blank, line)
        line = LINK_TARGET.sub(_blank, line)
        out.append(line)
    return out


def hits(text: str) -> list[tuple[int, str]]:
    """(line number, kind) for every unmarked organization-specific identifier."""
    raw_lines = text.split("\n")
    out = []

    def allowed(n: int) -> bool:
        raw = raw_lines[n - 1]
        return bool(ALLOW.search(raw) or (n > 1 and ALLOW_ALONE.match(raw_lines[n - 2])))

    for n, raw in enumerate(raw_lines, 1):
        for m in TENANT.finditer(URL_ESCAPE.sub(" ", raw)):
            if not is_example_tenant(m.group(1)) and not allowed(n):
                out.append((n, "tenant name that isn't a documented example tenant"))
                break
    for n, line in enumerate(prose_lines(text), 1):
        for m in GUID.finditer(line):
            g = m.group(0).lower()
            if is_synthetic(g) or allowed(n):
                continue
            out.append((n, "real-looking GUID in prose (not a synthetic example)"))
            break
    return sorted(out)


def tracked() -> list[str]:
    out = subprocess.run(["git", "ls-files", "-z"], cwd=REPO, capture_output=True, check=True).stdout
    return [p for p in out.decode("utf-8").split("\0") if p]


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")   # type: ignore[attr-defined]
        except AttributeError:
            pass
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("files", nargs="*", help="repo-relative files (default: every published page in scope)")
    args = ap.parse_args(argv)

    files = [f.replace("\\", "/") for f in args.files] if args.files else tracked()
    files = sorted(f for f in files if in_scope(f) and (REPO / f).is_file())
    total = 0
    for f in files:
        text = (REPO / f).read_text(encoding="utf-8", errors="replace")
        for n, kind in hits(text):
            print(f"{f}:{n}: {kind}; use a documented example or a <placeholder> "
                  f"(or mark a legitimate use with <!-- identifiers-ok: reason -->)")
            total += 1
    print(f"{len(files)} file(s) checked; {total} hit(s)")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
