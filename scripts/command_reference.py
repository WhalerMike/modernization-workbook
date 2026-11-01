#!/usr/bin/env python3
"""Build the Command Reference page from the help in the example kits, and check that help.

Every command a reader can run from `examples/` is listed on one page,
docs/reference/commands.md: each kit's entry scripts, the functions its
PowerShell modules export, and its Python command-line tools. The page's body
is generated from the commands' own help on every site build, so it can't
drift from the code:

  PowerShell  comment-based help (.SYNOPSIS, .EXAMPLE), at the top of a script,
              or just inside or just before a function. `Get-Help <command>`
              and `<command> -?` show the same text.
  Python      the module docstring: its first line is the synopsis, and an
              example is a line that runs the tool (`python tool.py ...`).
              `python tool.py --help` prints argparse's usage.

    python scripts/command_reference.py                 # write the page body
    python scripts/command_reference.py --check         # fail if a public command lacks help
    python scripts/command_reference.py --missing       # list commands that lack a synopsis or example
    python scripts/command_reference.py --missing --kit privileged-access

A command is public when its module exports it (Export-ModuleMember, or
FunctionsToExport in the manifest); a module that exports nothing explicitly
exports every function. Tests (anything under a `tests` folder) and the pinned
Microsoft samples under `third_party` aren't commands and aren't listed.

It runs as a Quarto pre-render script (see `project: pre-render` in
_quarto.yml) and writes docs/reference/_commands-body.md, which the committed
page includes. The body is git-ignored; Quarto resolves includes up front, so
on a fresh checkout run the script once before the first render (the deploy
workflow and scripts/check_changed.py do).

--check fails when a public command has no synopsis or no example. The pull
request checks run it when example code or this script changes.
"""
from __future__ import annotations

import argparse
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples"
DOCS = ROOT / "docs"
PAGE = DOCS / "reference" / "commands.md"
BODY = DOCS / "reference" / "_commands-body.md"
REPO_URL = "https://github.com/WhalerMike/modernization-workbook"
SKIP_DIRS = {"tests", "test", "third_party", "node_modules", "__pycache__", ".pytest_cache"}

KIND_LABEL = {"script": "Script", "python": "Python tool", "function": "Function"}


@dataclass
class Command:
    kit: str
    name: str
    kind: str                      # script | python | function
    path: str                      # repo-relative POSIX path of the file
    module: str = ""               # PowerShell module for a function
    synopsis: str = ""
    has_example: bool = False
    taught_in: list[tuple[str, str]] = field(default_factory=list)   # (page path, title)


# ------------------------------------------------------------------ help parsing

# A dot and a word, then whitespace or the end of the line: PowerShell reads it as a keyword.
# ".attributes, else" (punctuation straight after the word) is ordinary text.
HELP_KEYWORD = re.compile(r"^\s*\.([A-Za-z]+)(?:\s+.*)?$")
KEYWORDS = {"SYNOPSIS", "DESCRIPTION", "PARAMETER", "EXAMPLE", "INPUTS", "OUTPUTS", "NOTES", "LINK",
            "COMPONENT", "ROLE", "FUNCTIONALITY", "FORWARDHELPTARGETNAME", "FORWARDHELPCATEGORY",
            "REMOTEHELPRUNSPACE", "EXTERNALHELP"}


def parse_help(block: str) -> tuple[str, bool]:
    """(synopsis, has_example) from the text inside a <# ... #> help block.

    PowerShell drops the whole block when a line starts with a dot and a word that isn't a
    help keyword (".Calls on the object ..."), so such a block counts as no help at all.
    """
    sections: dict[str, list[str]] = defaultdict(list)
    current = None
    for line in block.splitlines():
        m = HELP_KEYWORD.match(line)
        if m and m.group(1).upper() not in KEYWORDS:
            return "", False
        if m:
            current = m.group(1).upper()
            sections[current]
            if current == "EXAMPLE":
                sections["EXAMPLE"].append("")       # count the example even if its body is on later lines
            continue
        if current:
            sections[current].append(line.strip())
    synopsis = " ".join(x for x in sections.get("SYNOPSIS", []) if x).strip()
    example = any(x for x in sections.get("EXAMPLE", []) if x)
    return synopsis, example


def is_help(block: str) -> bool:
    return bool(re.search(r"^\s*\.(SYNOPSIS|DESCRIPTION|EXAMPLE)\b", block, re.M))


def script_help(text: str) -> str:
    """The comment-based help block at the top of a script, or ''."""
    i = 0
    lines = text.splitlines(keepends=True)
    pos = 0
    for line in lines:
        s = line.strip()
        if not s or s.startswith("#") and not s.startswith("<#"):
            pos += len(line)
            i += 1
            continue
        break
    rest = text[pos:]
    m = re.match(r"\s*<#(.*?)#>", rest, re.S)
    if m and is_help(m.group(1)):
        return m.group(1)
    # Help may also sit just before param() after other comment blocks; take the first help block
    # that comes before the param block.
    param = re.search(r"^\s*(\[CmdletBinding[^\]]*\]\s*)?param\s*\(", text, re.M | re.I)
    head = text[: param.start()] if param else text[:4000]
    for m in re.finditer(r"<#(.*?)#>", head, re.S):
        if is_help(m.group(1)):
            return m.group(1)
    return ""


FUNC = re.compile(r"^[ \t]*function\s+(?:global:|script:)?([A-Za-z][\w]*-[\w]+)\s*(?:\([^)]*\))?\s*\{", re.M | re.I)


def function_help(text: str, m: re.Match) -> str:
    """Help for the function whose definition starts at match m: inside the body, or just before it."""
    after = text[m.end():]
    inside = re.match(r"\s*<#(.*?)#>", after, re.S)
    if inside and is_help(inside.group(1)):
        return inside.group(1)
    before = text[: m.start()]
    prev = re.search(r"<#((?:(?!<#).)*?)#>\s*\Z", before, re.S)
    if prev and is_help(prev.group(1)):
        return prev.group(1)
    return ""


def exported_functions(psm1: Path, text: str, defined: list[str] | None = None) -> list[str]:
    names: list[str] = []
    for m in re.finditer(r"Export-ModuleMember\b(.*?)(?=\n\s*\n|\n[^\s,`]|\Z)", text, re.S | re.I):
        body = m.group(1)
        fm = re.search(r"-Function\s+(.*?)(?=\s-[A-Za-z]+\s|\Z)", body, re.S | re.I)
        if fm:
            names += re.findall(r"[A-Za-z][\w]*-[\w]+", fm.group(1))
    psd1 = psm1.with_suffix(".psd1")
    if psd1.exists():
        pt = psd1.read_text(encoding="utf-8", errors="replace")
        fm = re.search(r"FunctionsToExport\s*=\s*(@\((.*?)\)|'[^']*'|\"[^\"]*\")", pt, re.S)
        if fm and "*" not in fm.group(1):
            names += re.findall(r"[A-Za-z][\w]*-[\w]+", fm.group(1))
    if defined is None:
        defined = [m.group(1) for m in FUNC.finditer(text)]
    if not names:
        return defined
    seen, out = set(), []
    for n in names:
        if n in defined and n not in seen:
            seen.add(n)
            out.append(n)
    return out


EXAMPLE_LINE = re.compile(r"^\s*(?:\$\s+)?(?:python3?|py)\s+(?:-m\s+)?\S+", re.M)


def python_help(text: str) -> tuple[str, bool]:
    m = re.match(r"(?:#![^\n]*\n)?(?:#[^\n]*\n|\s)*(?:[rRuU]?)(\"\"\"|''')(.*?)\1", text, re.S)
    doc = m.group(2) if m else ""
    synopsis = ""
    for line in doc.strip().splitlines():
        if line.strip():
            synopsis = line.strip()
            break
    return synopsis, bool(EXAMPLE_LINE.search(doc))


# ------------------------------------------------------------------ scanning

def walk(kit_dir: Path):
    for p in sorted(kit_dir.rglob("*")):
        rel = p.relative_to(kit_dir).parts
        if any(part in SKIP_DIRS for part in rel[:-1]):
            continue
        if p.is_file():
            yield p


def scan(examples: Path = EXAMPLES, root: Path = ROOT) -> list[Command]:
    cmds: list[Command] = []
    for kit_dir in sorted(p for p in examples.iterdir() if p.is_dir() and p.name not in SKIP_DIRS):
        kit = kit_dir.name
        files = list(walk(kit_dir))
        # A .ps1 a module dot-sources is part of the module, not a script, and may define the
        # functions it exports. The dot-source line names the file, or the subfolder holding it
        # (validation-kit loads Checks\<track>.ps1 in a loop).
        module_parts: dict[Path, list[Path]] = {}
        for p in files:
            if p.suffix == ".psm1":
                text = p.read_text(encoding="utf-8", errors="replace")
                lines = [ln for ln in text.splitlines() if re.match(r"\s*\.\s+[(\$'\"]", ln)] + \
                        [m.group(0) for m in re.finditer(r"foreach\b[^\n]*\n(?:[^\n]*\n){0,3}?\s*\.\s+[^\n]*", text)]
                dot = "\n".join(lines)
                module_parts[p] = [q for q in files if q.suffix == ".ps1" and (
                    q.name in dot or (p.parent in q.parents and q.parent != p.parent and f"'{q.parent.name}'" in dot))]
        part_files = {q for qs in module_parts.values() for q in qs}
        for p in files:
            rel = p.relative_to(root).as_posix()
            if p.suffix == ".psm1":
                text = p.read_text(encoding="utf-8", errors="replace")
                parts = [(text, p)] + [(q.read_text(encoding="utf-8", errors="replace"), q) for q in module_parts[p]]
                defs = {}
                for t, q in parts:
                    for m in FUNC.finditer(t):
                        defs.setdefault(m.group(1), (t, m, q))
                for name in exported_functions(p, text, list(defs)):
                    if name in defs:
                        t, m, q = defs[name]
                        syn, ex = parse_help(function_help(t, m))
                        where = q.relative_to(root).as_posix()
                    else:
                        syn, ex, where = "", False, rel
                    cmds.append(Command(kit, name, "function", where, p.stem, syn, ex))
            elif p in part_files:
                continue
            elif p.suffix == ".ps1" and not p.name.endswith(".Tests.ps1"):
                text = p.read_text(encoding="utf-8", errors="replace")
                syn, ex = parse_help(script_help(text))
                cmds.append(Command(kit, p.name, "script", rel, "", syn, ex))
            elif p.suffix == ".py":
                text = p.read_text(encoding="utf-8", errors="replace")
                if re.search(r"^if\s+__name__\s*==\s*['\"]__main__['\"]", text, re.M):
                    syn, ex = python_help(text)
                    cmds.append(Command(kit, p.name, "python", rel, "", syn, ex))
    return cmds


def page_title(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    fm = re.match(r"---\n(.*?)\n---", text, re.S)
    if fm:
        t = re.search(r"^title:\s*[\"']?(.*?)[\"']?\s*$", fm.group(1), re.M)
        if t:
            return t.group(1)
    h = re.search(r"^#\s+(.+?)(?:\s+\{[^}]*\})?\s*$", text, re.M)
    return h.group(1).strip() if h else path.stem


def page_rank(rel: str) -> tuple[int, str]:
    # Developer workbooks first: Book 19 and the workbooks under Projects.
    if "/developer-workbooks/" in rel or "/books/b19-developer-workbook/" in rel:
        return (0, rel)
    if rel.startswith("docs/books/"):
        return (1, rel)
    return (2, rel)


def link_chapters(cmds: list[Command], docs: Path = DOCS, root: Path = ROOT, limit: int = 2) -> None:
    """Fill taught_in: the published pages that name each command in code, best first."""
    by_name: dict[str, list[Command]] = defaultdict(list)
    for c in cmds:
        by_name[c.name].append(c)
    if not by_name:
        return
    token = re.compile(r"[A-Za-z][\w]*-[\w]+|[\w-]+\.(?:py|ps1)\b")
    hits: dict[str, set[str]] = defaultdict(set)
    skip = PAGE.resolve()
    for p in docs.rglob("*.md"):
        if "_verification" in p.parts or p.name.startswith("_") or p.resolve() == skip:
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        for n in set(token.findall(text)) & by_name.keys():
            hits[n].add(p.relative_to(root).as_posix())
    titles: dict[str, str] = {}
    for n, pages in hits.items():
        best = sorted(pages, key=page_rank)[:limit]
        for c in by_name[n]:
            for rel in best:
                if rel not in titles:
                    titles[rel] = page_title(root / rel)
                c.taught_in.append((rel, titles[rel]))


# ------------------------------------------------------------------ the page

def cell(s: str) -> str:
    return s.replace("|", "\\|").replace("\n", " ").strip()


def relpath(target: str, frm: str = "docs/reference/commands.md") -> str:
    up = len(Path(frm).parent.parts)
    return "../" * up + target


def render(cmds: list[Command]) -> str:
    kits: dict[str, list[Command]] = defaultdict(list)
    for c in cmds:
        kits[c.kit].append(c)
    out: list[str] = []
    w = out.append
    w("<!-- Generated by scripts/command_reference.py from the commands' own help on every build.")
    w("     Don't edit: change the help in the code. -->")
    w("")
    n_fn = sum(c.kind == "function" for c in cmds)
    n_sc = sum(c.kind == "script" for c in cmds)
    n_py = sum(c.kind == "python" for c in cmds)
    w(f"The example kits in the repository's [`examples`]({REPO_URL}/tree/main/examples) folder hold "
      f"{len(cmds)} commands: {n_sc} PowerShell scripts, {n_fn} functions their PowerShell modules export, "
      f"and {n_py} Python tools. This page lists each one with its synopsis and the pages that teach it. "
      f"The text comes from each command's own help, so the page and the help always agree.")
    w("")
    w("## Getting help for a command")
    w("")
    w("| Kind | Full help | Examples only |")
    w("|---|---|---|")
    w("| PowerShell script | `Get-Help ./Invoke-Example.ps1 -Full` | `Get-Help ./Invoke-Example.ps1 -Examples` |")
    w("| PowerShell function | `Import-Module ./powershell/Module/Module.psm1`, then `Get-Help Verb-Noun -Full` | `Get-Help Verb-Noun -Examples` |")
    w("| Python tool | `python tool.py --help` | the examples at the top of the file |")
    w("")
    w("`-?` after any PowerShell script or function prints its syntax and synopsis. Windows' `/?` isn't a "
      "PowerShell or Python convention and isn't supported. Run a kit's commands from the kit's folder, as "
      "its README says; the chapters walk through them in order.")
    w("")
    w("## Kits")
    w("")
    w("| Kit | Scripts | Functions | Python tools | README |")
    w("|---|---|---|---|---|")
    for kit, cs in sorted(kits.items()):
        readme = EXAMPLES / kit / "README.md"
        rlink = f"[README]({REPO_URL}/blob/main/examples/{kit}/README.md)" if readme.exists() else ""
        w(f"| [{kit}](#kit-{kit}) | {sum(c.kind == 'script' for c in cs)} | "
          f"{sum(c.kind == 'function' for c in cs)} | {sum(c.kind == 'python' for c in cs)} | {rlink} |")
    for kit, cs in sorted(kits.items()):
        w("")
        w(f"## {kit} {{#kit-{kit}}}")
        tools = sorted((c for c in cs if c.kind != "function"), key=lambda c: (c.kind, c.path))
        if tools:
            w("")
            w("| Command | Kind | What it does | Taught in |")
            w("|---|---|---|---|")
            for c in tools:
                w(row(c, kind=True))
        mods: dict[str, list[Command]] = defaultdict(list)
        for c in cs:
            if c.kind == "function":
                mods[c.path].append(c)
        for path, fs in sorted(mods.items()):
            w("")
            w(f"### Module {fs[0].module} {{#mod-{kit}-{fs[0].module.lower()}}}")
            w("")
            w(f"[`{path.split('/', 2)[2]}`]({REPO_URL}/blob/main/{path})")
            w("")
            w("| Function | What it does | Taught in |")
            w("|---|---|---|")
            for c in fs:
                w(row(c, kind=False))
    w("")
    return "\n".join(out)


def row(c: Command, kind: bool) -> str:
    name = f"[`{c.name}`]({REPO_URL}/blob/main/{c.path})" if c.kind != "function" else f"`{c.name}`"
    syn = cell(c.synopsis) or "*No synopsis yet.*"
    taught = "<br>".join(f"[{cell(t)}]({relpath(p)})" for p, t in c.taught_in) or "—"
    if kind:
        return f"| {name} | {KIND_LABEL[c.kind]} | {syn} | {taught} |"
    return f"| {name} | {syn} | {taught} |"


# ------------------------------------------------------------------ main

def missing(cmds: list[Command]) -> list[tuple[Command, list[str]]]:
    out = []
    for c in cmds:
        gaps = []
        if not c.synopsis:
            gaps.append("synopsis")
        if not c.has_example:
            gaps.append("example")
        if gaps:
            out.append((c, gaps))
    return out


def build() -> tuple[list[Command], str]:
    cmds = scan()
    link_chapters(cmds)
    return cmds, render(cmds)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true", help="fail on a stale page or a command without help")
    ap.add_argument("--missing", action="store_true", help="list commands that lack a synopsis or an example")
    ap.add_argument("--kit", help="with --missing: only this kit")
    a = ap.parse_args(argv)
    cmds, text = build()
    gaps = missing(cmds)
    if a.missing:
        shown = [(c, g) for c, g in gaps if not a.kit or c.kit == a.kit]
        for c, g in shown:
            print(f"{c.path}\t{c.name}\tmissing {' and '.join(g)}")
        print(f"{len(shown)} command(s) need help" + (f" in {a.kit}" if a.kit else ""), file=sys.stderr)
        return 1 if shown else 0
    if a.check:
        if gaps:
            print(f"{len(gaps)} public command(s) lack help (python scripts/command_reference.py --missing):")
            for c, g in gaps[:40]:
                print(f"  {c.path}: {c.name} (missing {' and '.join(g)})")
            if len(gaps) > 40:
                print(f"  ... and {len(gaps) - 40} more")
            return 1
        print(f"Command help complete: {len(cmds)} commands, each with a synopsis and an example")
        return 0
    BODY.parent.mkdir(parents=True, exist_ok=True)
    if not BODY.exists() or BODY.read_text(encoding="utf-8") != text:
        BODY.write_text(text, encoding="utf-8", newline="\n")
    print(f"wrote {BODY.relative_to(ROOT).as_posix()}: {len(cmds)} commands, {len(gaps)} still lack help")
    return 0

if __name__ == "__main__":
    sys.exit(main())
