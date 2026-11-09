#!/usr/bin/env python3
"""Build the decision register from data/decisions.yml and the project plans.

The register (docs/about/decision-register.md) lists two kinds of decision:

  The workbook's decisions   choices the workbook's editor made about its content,
                             method and design, one entry each in data/decisions.yml,
                             from the repository's first pull request on.
  The plans' decision points the decisions each sample project plan leaves to the
                             agency that adopts it, read from the `kind: decision`
                             tasks in data/project-plans/*.yaml.

Add a decision by appending an entry to data/decisions.yml with the next WD
number, then run this script. To change a decision, don't edit the old entry's
choice: add a new entry and mark the old one `status: superseded` with
`superseded_by`. A reviewer's challenge sets `status: challenged` and lists the
issue in `challenges` until the editor settles it.

    python scripts/decisions/build.py           # write the register
    python scripts/decisions/build.py --check   # exit 1 if the register is stale or an entry is invalid

The register is generated: edit the YAML, never the page. The site build
doesn't run this script; it uses the committed page.
"""

from __future__ import annotations

import argparse
import datetime as dt
import functools
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "decisions.yml"
PLANS = ROOT / "data" / "project-plans"
OUT = ROOT / "docs" / "about" / "decision-register.md"
REPO = "https://github.com/WhalerMike/modernization-workbook"
FEEDBACK = f"{REPO}/issues/new?template=decision-feedback.yml"

BASIS = {
    "requirement": "External requirement",
    "microsoft-learn": "Microsoft Learn",
    "workbook-design": "Workbook design",
}
STATUS = ("settled", "challenged", "superseded")
FIELDS = ("id", "date", "question", "options", "choice", "rationale", "basis", "sources", "pages", "prs", "status")
ID = re.compile(r"WD-\d{3}")
BOOK_REF = re.compile(r"\bBooks? (\d\d)(?:(?:, | and )(\d\d))*")


class DecisionError(Exception):
    pass


@functools.cache
def render_rules():
    """The site's render list (_quarto.yml), as the Word bundle builder reads it."""
    sys.path.insert(0, str(ROOT / "scripts"))
    import build_bundles
    return build_bundles.RenderRules()


@functools.cache
def book_titles() -> dict[str, str]:
    """'04' -> 'Access and Privilege', from each book's index page title."""
    titles = {}
    for index in sorted((ROOT / "docs" / "books").glob("b[0-9][0-9]-*/index.md")):
        m = re.search(r'^title:\s*"?Book (\d\d) [—-] (.+?)"?\s*$', index.read_text(encoding="utf-8"), re.M)
        if m:
            titles[m.group(1)] = m.group(2).replace(" & ", " and ")
    return titles


def name_books(text: str, titles: dict[str, str]) -> str:
    """Replace "Book 04" (and "Books 02 and 04") with the books' titles, in italics."""
    def one(m: re.Match) -> str:
        nums = re.findall(r"\d\d", m.group(0))
        names = [f"*{titles.get(n, 'Book ' + n)}*" for n in nums]
        return names[0] if len(names) == 1 else ", ".join(names[:-1]) + " and " + names[-1]
    return BOOK_REF.sub(one, text)


def cell(text: object) -> str:
    """One line of Markdown that is safe inside a table cell."""
    return re.sub(r"\s+", " ", str(text)).replace("|", "\\|").strip()


def page_link(path: str) -> str:
    """A link from docs/about/ to a repository path: a site page if it publishes, else GitHub."""
    p = path.split("#")[0]
    anchor = path[len(p):]
    if not (ROOT / p).exists():
        raise DecisionError(f"page not found: {path}")
    published = p.startswith("docs/") and p.endswith((".md", ".qmd")) and render_rules().published(ROOT / p)
    if published:
        rel = Path(p).relative_to("docs")
        target = ("../" + rel.as_posix()) if rel.parts[0] != "about" else rel.name
        m = re.search(r'^title:\s*"?(.+?)"?\s*$', (ROOT / p).read_text(encoding="utf-8"), re.M)
        title = m.group(1).replace('\\"', '"') if m else Path(p).stem
        title = re.sub(r"^Book \d\d [—-] ", "", title).replace(" & ", " and ")
        return f"[{cell(name_books(title, book_titles()))}]({target}{anchor})"
    return f"[`{p}`]({REPO}/blob/main/{p}{anchor})"


def source_link(src: object) -> str:
    if isinstance(src, dict):
        return f"[{src['title']}]({src['url']})"
    return f"<{src}>"


# ------------------------------------------------------------------ loading


def load_decisions() -> list[dict]:
    entries = yaml.safe_load(DATA.read_text(encoding="utf-8")) or []
    seen = set()
    for e in entries:
        missing = [f for f in FIELDS if f not in e]
        if missing:
            raise DecisionError(f"{e.get('id', '?')}: missing {', '.join(missing)}")
        if not ID.fullmatch(e["id"]) or e["id"] in seen:
            raise DecisionError(f"{e['id']}: IDs are WD-NNN and unique")
        seen.add(e["id"])
        if e["basis"] not in BASIS:
            raise DecisionError(f"{e['id']}: basis must be one of {', '.join(BASIS)}")
        if e["status"] not in STATUS:
            raise DecisionError(f"{e['id']}: status must be one of {', '.join(STATUS)}")
        if e["status"] == "superseded" and not e.get("superseded_by"):
            raise DecisionError(f"{e['id']}: a superseded decision names its superseded_by")
        if e["status"] == "challenged" and not e.get("challenges"):
            raise DecisionError(f"{e['id']}: a challenged decision lists its challenges (issue numbers)")
        if not isinstance(e["date"], dt.date):
            raise DecisionError(f"{e['id']}: date is YYYY-MM-DD")
    for e in entries:
        if e.get("superseded_by") and e["superseded_by"] not in seen:
            raise DecisionError(f"{e['id']}: superseded_by {e['superseded_by']} is not in the register")
    return entries


def load_plan_decisions(titles: dict[str, str]) -> list[dict]:
    plans = []
    for path in sorted(PLANS.glob("*.yaml")):
        plan = yaml.safe_load(path.read_text(encoding="utf-8"))
        rows = [t for t in plan.get("tasks", []) if t.get("kind") == "decision"]
        if rows:
            plans.append({"slug": plan["slug"], "title": plan.get("short_title", plan["title"]), "rows": rows})
    return plans


# ------------------------------------------------------------------ writing


def render(entries: list[dict], plans: list[dict], titles: dict[str, str]) -> str:
    by_id = {e["id"]: e for e in entries}
    counts = {s: sum(e["status"] == s for e in entries) for s in STATUS}
    plan_count = sum(len(p["rows"]) for p in plans)
    out = [
        "---",
        'title: "Decision Register"',
        'subtitle: "Every decision the workbook has made, why, and on what basis, so you can agree or disagree with each one"',
        'description: "The Federal Modernization Workbook\'s decision register: each editorial and design decision since the '
        'repository began, with the question, the options considered, the choice, the rationale, whether it rests on an '
        'external requirement, Microsoft Learn or the workbook\'s own design, its sources, the pages it affects, its date '
        'and its status; and the decision points the sample project plans leave to the adopting agency."',
        "doc-type: section-landing",
        "---",
        "",
        "<!-- Generated by scripts/decisions/build.py from data/decisions.yml and data/project-plans/*.yaml. "
        "Edit the YAML, not this page. -->",
        "",
        "# Decision Register {.unnumbered}",
        "",
        "This register lists the decisions behind the workbook, from the repository's first pull request on, one entry "
        "each. Each entry gives the question, the options that were considered, the choice, the reason for it, its "
        "basis, its sources and the pages it shaped. The [Reviewers' Guide](reviewers-guide.md) explains how to check "
        "an entry and how to tell us you agree or disagree with it. Use the entry's ID when you do.",
        "",
        f"There are **{len(entries)}** workbook decisions: {counts['settled']} settled, {counts['challenged']} "
        f"challenged and {counts['superseded']} superseded. Below them are the **{plan_count}** decision points "
        f"the sample project plans leave to the agency that adopts them.",
        "",
        "::: {.callout-note}",
        "## How to read the basis",
        "- **External requirement:** a federal requirement chose for us: a statute, an OMB memorandum, a CISA directive, "
        "a NIST publication or FedRAMP's rules. Disagree with the reading, not the requirement.",
        "- **Microsoft Learn:** the choice follows Microsoft's own documentation for how the product works or should be "
        "configured.",
        "- **Workbook design:** the workbook's own judgment. No source makes this choice, so it is the kind most open "
        "to argument.",
        ":::",
        "",
        "## Status",
        "",
        "| Status | Meaning |",
        "|---|---|",
        "| **settled** | Decided. The pages follow it. |",
        "| **challenged** | A reviewer has disagreed or asked for evidence in an open issue, and the workbook's editor "
        "hasn't ruled yet. The pages still follow the decision until then. |",
        "| **superseded** | Replaced by a later decision, named in the entry. Kept so the history stays readable. |",
        "",
        ": Decision status {.striped}",
        "",
        "## The workbook's decisions at a glance {#index}",
        "",
        "| ID | Date | Question | Basis | Status |",
        "|---|---|---|---|---|",
    ]
    for e in entries:
        status = e["status"] + (f" by {e['superseded_by']}" if e["status"] == "superseded" else "")
        out.append(f"| [{e['id']}](#{e['id'].lower()}) | {e['date']} | {cell(e['question'])} | "
                   f"{BASIS[e['basis']]} | {status} |")
    out += ["", ": Workbook decisions, oldest first {.striped .hover}", "", "## Each decision {#entries}", ""]
    for e in entries:
        out += [f"### {e['id']}: {cell(e['question'])} {{#{e['id'].lower()}}}", ""]
        rows = [
            ("Options considered", "; ".join(cell(name_books(o, titles)) for o in e["options"])),
            ("Choice", cell(name_books(e["choice"], titles))),
            ("Rationale", cell(name_books(e["rationale"], titles))),
            ("Basis", BASIS[e["basis"]]),
            ("Sources", "; ".join(source_link(s) for s in e["sources"]) or
             "None external: the choice rests on the pages it shaped."),
            ("Pages affected", ", ".join(page_link(p) for p in e["pages"])),
            ("Date", str(e["date"])),
            ("Status", e["status"]),
            ("Defined in", ", ".join(f"[#{n}]({REPO}/pull/{n})" for n in e["prs"]) or "—"),
        ]
        if e.get("plan"):
            slug, did = e["plan"].split("/")
            rows.insert(0, ("Plan decision", f"[{did}](../project-plans/{slug}.md#decision-points) in the "
                                             f"{slug.replace('-', ' ')} plan"))
        if e.get("superseded_by"):
            sup = e["superseded_by"]
            rows.append(("Superseded by", f"[{sup}](#{sup.lower()}): {cell(by_id[sup]['question'])}"))
        if e.get("challenges"):
            rows.append(("Challenges", ", ".join(f"[#{n}]({REPO}/issues/{n})" for n in e["challenges"])))
        if e.get("note"):
            rows.append(("Note", ID.sub(lambda m: f"[{m.group(0)}](#{m.group(0).lower()})",
                                        cell(name_books(e["note"], titles)))))
        out += ["| | |", "|---|---|"] + [f"| **{k}** | {v} |" for k, v in rows]
        out += ["", f"[Agree, disagree or send evidence on {e['id']}]({FEEDBACK}&title={e['id']}%3A+)", ""]
    out += [
        "## Decision points in the sample project plans {#plan-decisions}",
        "",
        "Each sample project plan names the decisions its project has to make, with the role that decides, the options "
        "and what happens if the decision is late. These are left to the agency that adopts the plan, so they have no "
        "choice here unless a workbook decision above settles the workbook's own default; that decision is named in the "
        "last column. Each plan's **Decision points** section has the decide-by week and float, and the plan's YAML in "
        "`data/project-plans/` is where each one is defined. IDs repeat across plans, so cite a plan decision with its "
        "plan, for example *Non-Person Identity Modernization, D-NP2*.",
        "",
    ]
    settled_by = {e["plan"]: e["id"] for e in entries if e.get("plan") and e["status"] != "superseded"}
    for plan in plans:
        out += [f"### {plan['title']} {{#plan-{plan['slug']}}}", "",
                f"Defined in [the plan's decision points](../project-plans/{plan['slug']}.md#decision-points) "
                f"and [`data/project-plans/{plan['slug']}.yaml`]({REPO}/blob/main/data/project-plans/{plan['slug']}.yaml).",
                "", "| ID | Decision | Decides | Options | Basis | Workbook decision |", "|---|---|---|---|---|---|"]
        for t in plan["rows"]:
            basis = f"[Source chapter]({t['source']})" if t.get("source") else "—"
            wd = settled_by.get(f"{plan['slug']}/{t['id']}")
            out.append(f"| {t['id']} | {cell(name_books(t['name'], titles))} | {cell(t.get('owner', '—'))} | "
                       f"{cell(name_books(t.get('options', '—'), titles))} | {basis} | "
                       f"{f'[{wd}](#{wd.lower()})' if wd else 'Left to the agency'} |")
        out += ["", f": {plan['title']}: decision points {{.striped .hover}}", ""]
    return "\n".join(out).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the decision register.")
    parser.add_argument("--check", action="store_true", help="exit 1 if the register is stale or an entry is invalid")
    args = parser.parse_args()
    try:
        titles = book_titles()
        text = render(load_decisions(), load_plan_decisions(titles), titles)
    except DecisionError as exc:
        print(f"decision register: {exc}", file=sys.stderr)
        return 1
    current = OUT.read_text(encoding="utf-8").replace("\r\n", "\n") if OUT.exists() else ""
    if args.check:
        if current != text:
            print(f"{OUT.relative_to(ROOT).as_posix()} is stale: run python scripts/decisions/build.py", file=sys.stderr)
            return 1
        print("decision register is current")
        return 0
    if current != text:
        OUT.write_text(text, encoding="utf-8", newline="\n")
        print(f"wrote {OUT.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
