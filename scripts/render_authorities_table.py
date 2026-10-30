"""Render the compliance series' "Authorities Closed Here" tables from the spine.

The spine, data/federal-compliance-compliance-spine.yml, records every control
closure the compliance series claims in those tables: for each table, the page
it appears on, its caption, and one row per control (closing mechanism,
accreditation gate, authority drivers, evidence slot, FedRAMP 20x KSI theme and
whether conformance tooling alone can attest it). On each page the table sits
under a marker comment,

    <!-- authorities:TABLE-ID — generated from federal-compliance-compliance-spine.yml; do not hand-edit -->

and runs through its caption line (": ..."). This script rewrites that block.

    python scripts/render_authorities_table.py           # rewrite every table
    python scripts/render_authorities_table.py --check   # exit 1 if a page differs

--check also fails if a page carries a marker the spine doesn't define, or the
spine defines a table no page carries. To change a closure, edit the spine and
re-run; a hand edit to a table fails the check.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[1]
SPINE = REPO / "data" / "federal-compliance-compliance-spine.yml"
SPINE_NAME = SPINE.name
MARKER = re.compile(r"^<!-- authorities:(?P<id>[\w-]+) .*-->$")
COLUMNS = [
    ("control", "Control"),
    ("title", "Title"),
    ("mechanism", "Closing mechanism (function, not product)"),
    ("gate", "Accreditation gate"),
    ("drivers", "Authority drivers"),
    ("slot", "Evidence slot"),
    ("ksi", "FedRAMP 20x KSI"),
    ("attestable", "Tool-attestable?"),
]
ANCHOR = " †"   # Closure-Necessity anchor: no alternate closure path


def render(table_id: str, table: dict) -> list[str]:
    out = [f"<!-- authorities:{table_id} — generated from {SPINE_NAME}; do not hand-edit -->",
           "| " + " | ".join(h for _, h in COLUMNS) + " |",
           "|" + "---|" * len(COLUMNS)]
    for row in table["rows"]:
        cells = []
        for key, _ in COLUMNS:
            value = str(row[key])
            if key == "control" and row.get("anchor"):
                value += ANCHOR
            if "|" in value or "\n" in value:
                raise ValueError(f"{table_id} {row['control']}: {key} may not contain '|' or a line break")
            cells.append(value)
        out.append("| " + " | ".join(cells) + " |")
    out += ["", f": {table['caption']} {{.striped .hover}}"]
    return out


def block_end(lines: list[str], start: int, where: str) -> int:
    """Index of the caption line that closes the table starting at lines[start]."""
    i = start + 1
    while i < len(lines) and lines[i].startswith("|"):
        i += 1
    if i + 1 < len(lines) and lines[i] == "" and lines[i + 1].startswith(": "):
        return i + 1
    raise ValueError(f"{where}: table under the marker isn't followed by a blank line and a caption")


def process(spine: dict, write: bool) -> list[str]:
    problems, seen = [], set()
    tables = spine["tables"]
    for page in sorted({t["page"] for t in tables.values()}):
        path = REPO / page
        raw = path.read_bytes()
        crlf = b"\r\n" in raw
        lines = raw.decode("utf-8").replace("\r\n", "\n").split("\n")
        i, changed = 0, False
        while i < len(lines):
            m = MARKER.match(lines[i])
            if not m:
                i += 1
                continue
            tid = m.group("id")
            if tid not in tables or tables[tid]["page"] != page:
                problems.append(f"{page}:{i + 1}: marker authorities:{tid} isn't a table the spine places on this page")
                i += 1
                continue
            seen.add(tid)
            end = block_end(lines, i, f"{page}:{i + 1}")
            new = render(tid, tables[tid])
            if lines[i:end + 1] != new:
                changed = True
                problems.append(f"{page}:{i + 1}: authorities:{tid} differs from the spine")
                lines[i:end + 1] = new
            i += len(new)
        if changed and write:
            text = "\n".join(lines)
            path.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
    for tid, t in tables.items():
        if tid not in seen:
            problems.append(f"{t['page']}: no marker for spine table authorities:{tid}")
    # Pages outside the spine must not carry a marker either.
    for path in sorted((REPO / "docs").rglob("*.md")):
        rel = path.relative_to(REPO).as_posix()
        if rel in {t["page"] for t in tables.values()}:
            continue
        for n, line in enumerate(path.read_text(encoding="utf-8").split("\n"), 1):
            if MARKER.match(line.rstrip("\r")):
                problems.append(f"{rel}:{n}: marker on a page the spine doesn't list")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="report differences and exit 1; change nothing")
    args = ap.parse_args()
    spine = yaml.safe_load(SPINE.read_text(encoding="utf-8"))
    problems = process(spine, write=not args.check)
    n = len(spine["tables"])
    if args.check:
        for p in problems:
            print(f"ERROR: {p}", file=sys.stderr)
        if problems:
            print(f"{len(problems)} problem(s); edit {SPINE.relative_to(REPO).as_posix()} and run "
                  "scripts/render_authorities_table.py", file=sys.stderr)
            return 1
        print(f"authorities: {n} tables match the spine")
        return 0
    structural = [p for p in problems if "differs from the spine" not in p]
    for p in structural:
        print(f"ERROR: {p}", file=sys.stderr)
    print(f"authorities: {n} tables rendered, {len(problems) - len(structural)} rewritten")
    return 1 if structural else 0


if __name__ == "__main__":
    sys.exit(main())
