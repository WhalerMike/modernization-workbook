#!/usr/bin/env python3
"""Build the sample project plans from data/project-plans/*.yaml.

Each YAML file is one plan: tasks with durations (working days) and
predecessors, decisions and gates as zero-duration milestones, and the
narrative around them. This script runs the critical path method (a forward
and a backward pass), then writes, for each plan:

  docs/project-plans/<slug>.md                 the page
  docs/project-plans/images/<slug>-gantt.svg   the Gantt chart
  docs/project-plans/files/<slug>.csv          for Excel
  docs/project-plans/files/<slug>.xml          for Microsoft Project (MSPDI)

Predecessors are finish-to-start unless written "ID:SS" (start-to-start);
"+N" adds N working days of lag ("P2.11:SS+5", "P3.1+2"). A task of kind
"external" takes its date from another plan ("ref: other-slug:TASK"), the
way an integrated master schedule links its projects.

    python scripts/project_plans/build.py           # write every plan
    python scripts/project_plans/build.py --check   # exit 1 if any output is stale

Outputs are generated: edit the YAML, never the outputs. The site build
doesn't run this script; it uses the committed outputs.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import html
import io
import math
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "project-plans"
OUT = ROOT / "docs" / "project-plans"
GH = "https://github.com/WhalerMike/modernization-workbook/blob/main"
SITE = "https://whalermike.github.io/modernization-workbook/"

PRED = re.compile(r"^(?P<id>[A-Za-z0-9.\-]+?)(?::(?P<type>FS|SS))?(?:\+(?P<lag>\d+))?$")
NEAR_CRITICAL = 5  # days of float at or under which a task is "near-critical"


class PlanError(Exception):
    pass


# ------------------------------------------------------------------ loading


def load_plans(extra: list[Path] | None = None) -> dict[str, dict]:
    plans = {}
    for path in sorted(DATA.glob("*.yaml")) + list(extra or []):
        plan = yaml.safe_load(path.read_text(encoding="utf-8"))
        plan["_file"] = path.resolve().relative_to(ROOT).as_posix()
        if plan["slug"] != path.stem:
            raise PlanError(f"{path.name}: slug {plan['slug']!r} must match the file name")
        plans[plan["slug"]] = plan
    return plans


def validate(plan: dict) -> None:
    name = plan["_file"]
    ids = [t["id"] for t in plan["tasks"]]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        raise PlanError(f"{name}: duplicate task ids {sorted(dupes)}")
    known = set(ids)
    for t in plan["tasks"]:
        kind = t.get("kind", "task")
        if kind not in ("task", "decision", "gate", "external"):
            raise PlanError(f"{name}: {t['id']}: unknown kind {kind!r}")
        if kind == "task" and not isinstance(t.get("dur"), int):
            raise PlanError(f"{name}: {t['id']}: a task needs an integer dur")
        if kind != "task" and t.get("dur"):
            raise PlanError(f"{name}: {t['id']}: a {kind} is a milestone; it takes no dur")
        if kind == "decision" and not (t.get("owner") and t.get("options") and t.get("late")):
            raise PlanError(f"{name}: {t['id']}: a decision needs owner, options and late")
        if kind == "gate" and not (t.get("owner") and t.get("criteria")):
            raise PlanError(f"{name}: {t['id']}: a gate needs owner and criteria")
        if kind == "external" and ":" not in t.get("ref", ""):
            raise PlanError(f"{name}: {t['id']}: an external milestone needs ref: slug:ID")
        if t.get("phase") not in plan["phases"]:
            raise PlanError(f"{name}: {t['id']}: phase {t.get('phase')!r} isn't in phases")
        for p in t.get("after", []):
            m = PRED.match(str(p))
            if not m or m["id"] not in known:
                raise PlanError(f"{name}: {t['id']}: unknown predecessor {p!r}")
        src = t.get("source", "")
        if not src:
            raise PlanError(f"{name}: {t['id']}: every row needs a source")
        if not src.startswith("http"):
            target = (OUT / src.split("#")[0]).resolve()
            sibling = (DATA / (Path(src.split("#")[0]).stem + ".yaml")).exists() and "/" not in src
            if not target.exists() and not sibling:
                raise PlanError(f"{name}: {t['id']}: source {src!r} doesn't exist")


def preds(t: dict) -> list[tuple[str, str, int]]:
    out = []
    for p in t.get("after", []):
        m = PRED.match(str(p))
        out.append((m["id"], m["type"] or "FS", int(m["lag"] or 0)))
    return out


def dependency_order(plans: dict[str, dict]) -> list[str]:
    order, seen = [], set()

    def visit(slug: str, stack: tuple[str, ...]) -> None:
        if slug in seen:
            return
        if slug in stack:
            raise PlanError(f"plans reference each other in a loop: {' -> '.join(stack + (slug,))}")
        for t in plans[slug]["tasks"]:
            if t.get("kind") == "external":
                ref = t["ref"].split(":")[0]
                if ref not in plans:
                    raise PlanError(f"{slug}: {t['id']}: unknown plan {ref!r}")
                visit(ref, stack + (slug,))
        seen.add(slug)
        order.append(slug)

    for slug in plans:
        visit(slug, ())
    return order


# ------------------------------------------------------------------ CPM


def schedule(plan: dict, plans: dict[str, dict]) -> None:
    tasks = {t["id"]: t for t in plan["tasks"]}
    for t in tasks.values():
        t["dur"] = t.get("dur", 0)
        t["_preds"] = preds(t)
    # Forward pass, in topological order.
    order, state = [], {}

    def visit(tid: str) -> None:
        if state.get(tid) == 2:
            return
        if state.get(tid) == 1:
            raise PlanError(f"{plan['_file']}: dependency loop through {tid}")
        state[tid] = 1
        for p, _, _ in tasks[tid]["_preds"]:
            visit(p)
        state[tid] = 2
        order.append(tid)

    for tid in tasks:
        visit(tid)
    for tid in order:
        t = tasks[tid]
        if t.get("kind") == "external":
            slug, ref, *edge = t["ref"].split(":")
            other = {x["id"]: x for x in plans[slug]["tasks"]}
            if ref not in other or "_ef" not in other[ref] or edge not in ([], ["start"]):
                raise PlanError(f"{plan['_file']}: {tid}: {t['ref']} not found or not scheduled")
            # "slug:ID" is the other item's finish; "slug:ID:start" its start.
            t["_es"] = other[ref]["_es"] if edge else other[ref]["_ef"]
            t["_ref_title"] = plans[slug]["short_title"]
            t["_ref_name"] = other[ref]["name"]
        else:
            es = 0
            for p, typ, lag in t["_preds"]:
                q = tasks[p]
                es = max(es, (q["_ef"] if typ == "FS" else q["_es"]) + lag)
            t["_es"] = es
        t["_ef"] = t["_es"] + t["dur"]
    succs: dict[str, list[tuple[str, str, int]]] = {tid: [] for tid in tasks}
    for t in tasks.values():
        for p, typ, lag in t["_preds"]:
            succs[p].append((t["id"], typ, lag))
    # An external milestone with predecessors is a deadline: its date is fixed
    # by the other plan, and this plan's work must finish by it. One with
    # successors is an input. One with neither is shown for reference. Only
    # inputs extend this plan's finish.
    for t in tasks.values():
        if t.get("kind") == "external":
            t["_role"] = "deadline" if t["_preds"] else "input" if succs[t["id"]] else "reference"
    finish = max(t["_ef"] for t in tasks.values() if t.get("_role") in (None, "input"))
    # Backward pass.
    for tid in reversed(order):
        t = tasks[tid]
        if t.get("_role") in ("deadline", "reference"):
            lf = t["_es"]
        else:
            lf = finish
            for s, typ, lag in succs[tid]:
                st = tasks[s]
                lf = min(lf, st["_ls"] - lag if typ == "FS" else st["_ls"] - lag + t["dur"])
        t["_lf"] = lf
        t["_ls"] = lf - t["dur"]
        t["_float"] = t["_ls"] - t["_es"]
        t["_crit"] = t["_float"] <= 0 and t.get("kind") != "external"
        t["_succs"] = [s for s, _, _ in succs[tid]]
    for t in tasks.values():
        if t.get("_role") == "deadline":
            # Margin: working days between the latest predecessor's finish and the fixed date.
            t["_margin"] = min(
                t["_es"] - ((tasks[p]["_ef"] if typ == "FS" else tasks[p]["_es"]) + lag) for p, typ, lag in t["_preds"]
            )
            if t["_margin"] < 0:
                print(f"project plans: warning: {plan['slug']}: {t['id']} is missed by {-t['_margin']} working days", file=sys.stderr)
    for t in tasks.values():
        if t.get("kind") == "decision" and not t["_succs"]:
            raise PlanError(f"{plan['_file']}: decision {t['id']} isn't needed by anything; add it to a task's after")
    plan["_finish"] = finish
    plan["_order"] = order


# ------------------------------------------------------------------ helpers


def week_start(day: int) -> int:
    return day // 5 + 1


def week_end(day: int) -> int:
    """The week a task finishing at offset `day` (exclusive) ends in."""
    return max(1, math.ceil(day / 5))


def weeks(t: dict) -> str:
    if t["dur"] == 0:
        return f"end of wk {week_end(t['_ef'])}" if t["_ef"] else "wk 1"
    a, b = week_start(t["_es"]), week_end(t["_ef"])
    return f"wk {a}" if a == b else f"wk {a}–{b}"


def days(n: int) -> str:
    return "0" if n == 0 else f"{n} d"


def float_text(t: dict) -> str:
    if t.get("kind") == "external" and t["_role"] != "input":
        return "fixed date"
    return f"**{t['_float']} d (late)**" if t["_float"] < 0 else days(t["_float"])


def esc(s: str) -> str:
    return str(s).replace("|", "\\|")


def link_list(ids: list[str]) -> str:
    return ", ".join(ids) if ids else "—"


def pred_text(t: dict) -> str:
    out = []
    for p, typ, lag in t["_preds"]:
        out.append(p + ("" if typ == "FS" else f" ({typ})") + (f" +{lag} d" if lag else ""))
    return ", ".join(out) if out else "—"


def full_name(t: dict) -> str:
    """The ID and name, without repeating an ID the name already starts with (gates)."""
    return t["name"] if t["name"].startswith(t["id"]) else f'{t["id"]}  {t["name"]}'


def kind_label(t: dict) -> str:
    return {"task": "Task", "decision": "Decision", "gate": "Gate", "external": "External"}[t.get("kind", "task")]


def workday(start: dt.date, offset: int) -> dt.date:
    d = start
    n = 0
    while n < offset:
        d += dt.timedelta(days=1)
        if d.weekday() < 5:
            n += 1
    return d


# ------------------------------------------------------------------ Gantt (SVG)

INK = "#1e293b"
MUTED = "#64748b"
GRID = "#e2e8f0"
BAND = "#f8fafc"
BLUE = "#2563EB"
RED = "#DC2626"
AMBER = "#D97706"
VIOLET = "#7C3AED"
GREEN = "#059669"
FONT = "Inter, 'DM Sans', Arial, sans-serif"


def gantt(plan: dict) -> str:
    rows = []
    for ph, label in plan["phases"].items():
        members = [t for t in plan["tasks"] if t["phase"] == ph]
        if members:
            rows.append(("phase", label))
            rows += [("task", t) for t in members]
    total_weeks = max(4, math.ceil(plan["_finish"] / 5))
    label_w, chart_w, row_h, top = 360, 600, 17, 34
    px_day = chart_w / (total_weeks * 5)
    legend_h = 40
    height = top + len(rows) * row_h + legend_h
    width = label_w + chart_w + 20
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="t d" font-family="{FONT}">',
        f'<title id="t">{html.escape(plan["short_title"])}: schedule</title>',
        f'<desc id="d">Gantt chart of {len(plan["tasks"])} tasks over {total_weeks} weeks. Critical-path tasks are red; '
        "other tasks are blue, with a grey line for their float. Gates are violet diamonds, decisions amber diamonds, "
        "and milestones from another plan green diamonds.</desc>",
        f'<rect width="{width}" height="{height}" fill="#ffffff"/>',
    ]
    # Week grid and labels.
    step = 4 if total_weeks > 24 else 2 if total_weeks > 8 else 1
    for w in range(0, total_weeks + 1):
        x = label_w + w * 5 * px_day
        if w % step == 0:
            out.append(f'<line x1="{x:.1f}" y1="{top - 6}" x2="{x:.1f}" y2="{top + len(rows) * row_h}" stroke="{GRID}" stroke-width="1"/>')
            if w < total_weeks:
                out.append(f'<text x="{x + 2:.1f}" y="{top - 12}" font-size="10" fill="{MUTED}">wk {w + 1}</text>')
    y = top
    for kind, item in rows:
        if kind == "phase":
            out.append(f'<rect x="0" y="{y}" width="{width}" height="{row_h}" fill="{BAND}"/>')
            out.append(f'<text x="6" y="{y + 12.5}" font-size="11" font-weight="600" fill="{INK}">{html.escape(item)}</text>')
        else:
            t = item
            label = full_name(t)
            if len(label) > 58:
                label = label[:56].rstrip() + "…"
            out.append(f'<text x="14" y="{y + 12}" font-size="10.5" fill="{INK if t["_crit"] else MUTED}">{html.escape(label)}</text>')
            x0 = label_w + t["_es"] * px_day
            cy = y + row_h / 2
            if t["dur"]:
                x1 = label_w + t["_ef"] * px_day
                if t["_float"]:
                    xf = label_w + t["_lf"] * px_day
                    out.append(f'<line x1="{x1:.1f}" y1="{cy:.1f}" x2="{xf:.1f}" y2="{cy:.1f}" stroke="#cbd5e1" stroke-width="2"/>')
                colour = RED if t["_crit"] else BLUE
                out.append(f'<rect x="{x0:.1f}" y="{y + 4}" width="{max(2, x1 - x0):.1f}" height="{row_h - 8}" rx="2" fill="{colour}"/>')
            else:
                colour = {"gate": VIOLET, "decision": AMBER, "external": GREEN}[t["kind"]]
                r = 5.5
                stroke = f' stroke="{RED}" stroke-width="1.6"' if t["_crit"] else ""
                out.append(
                    f'<path d="M{x0:.1f} {cy - r:.1f} L{x0 + r:.1f} {cy:.1f} L{x0:.1f} {cy + r:.1f} L{x0 - r:.1f} {cy:.1f} Z" fill="{colour}"{stroke}/>'
                )
        y += row_h
    # Legend.
    ly = y + 22
    items = [
        ("bar", RED, "Critical path"),
        ("bar", BLUE, "Other task"),
        ("line", "#cbd5e1", "Float"),
        ("dia", VIOLET, "Gate"),
        ("dia", AMBER, "Decision"),
        ("dia", GREEN, "From another plan"),
    ]
    lx = 14
    for shape, colour, text in items:
        if shape == "bar":
            out.append(f'<rect x="{lx}" y="{ly - 9}" width="18" height="9" rx="2" fill="{colour}"/>')
        elif shape == "line":
            out.append(f'<line x1="{lx}" y1="{ly - 4.5}" x2="{lx + 18}" y2="{ly - 4.5}" stroke="{colour}" stroke-width="2"/>')
        else:
            out.append(f'<path d="M{lx + 9} {ly - 10} L{lx + 14.5} {ly - 4.5} L{lx + 9} {ly + 1} L{lx + 3.5} {ly - 4.5} Z" fill="{colour}"/>')
        out.append(f'<text x="{lx + 24}" y="{ly}" font-size="10.5" fill="{INK}">{text}</text>')
        lx += 24 + len(text) * 6.2 + 22
    out.append(f'<text x="{width - 14}" y="{ly}" font-size="10.5" fill="{MUTED}" text-anchor="end">A red outline marks a milestone on the critical path</text>')
    out.append("</svg>")
    return "\n".join(out) + "\n"


# ------------------------------------------------------------------ CSV and MSPDI


def to_csv(plan: dict) -> str:
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\r\n")
    w.writerow(["ID", "Phase", "Type", "Name", "Owner or approver", "Duration (working days)", "Predecessors",
                "Weeks", "Early start (day)", "Early finish (day)", "Late finish (day)", "Total float (days)",
                "Critical", "Options (decisions)", "If late (decisions)", "Criteria (gates)", "Source"])
    for t in plan["tasks"]:
        src = t["source"]
        if not src.startswith("http"):
            src = f"{GH}/docs/project-plans/{src}" if not src.startswith("../") else f"{GH}/docs/{src[3:]}"
        w.writerow([t["id"], plan["phases"][t["phase"]], kind_label(t), t["name"], t.get("owner", ""), t["dur"],
                    pred_text(t), weeks(t), t["_es"], t["_ef"], t["_lf"], t["_float"], "Yes" if t["_crit"] else "No",
                    t.get("options", ""), t.get("late", ""), t.get("criteria", ""), src])
    return "\ufeff" + buf.getvalue()


def site_url(src: str) -> str:
    """A row's source link as an absolute URL on the published site."""
    if src.startswith("http"):
        return src
    page = src if not src.startswith("../") else src[3:]
    base = "docs/project-plans/" if not src.startswith("../") else "docs/"
    path, _, anchor = page.partition("#")
    return f"{SITE}{base}{path[:-3]}.html" + (f"#{anchor}" if anchor else "")


def tag(text: str) -> str:
    # Azure Boards and Jira both split tags on ";" or ","; neither may appear inside one.
    return re.sub(r"[;,]", " -", text).strip()


def to_azure_boards(plan: dict) -> str:
    """Azure Boards CSV import: an Epic per phase, a Feature per row.

    Epic and Feature exist in the Agile, Scrum and CMMI processes. Title 1 and
    Title 2 make the parent-child links; the import can't set Assigned To,
    State or any other link type, so owners travel as tags and dependencies
    go in a separate file (see add-azure-boards-links.ps1).
    """
    start = plan["project_start"]
    if isinstance(start, str):
        start = dt.date.fromisoformat(start)
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\r\n")
    w.writerow(["Work Item Type", "Title 1", "Title 2", "Description", "Tags", "Start Date", "Target Date"])
    plan_tag = f"fmw-{plan['slug']}"
    for ph, label in plan["phases"].items():
        members = [t for t in plan["tasks"] if t["phase"] == ph]
        if not members:
            continue
        es = min(t["_es"] for t in members)
        ef = max(t["_ef"] for t in members)
        w.writerow(["Epic", f"{plan['short_title']}: {label}", "",
                    f"<p>{html.escape(label)} of the sample plan <a href=\"{SITE}docs/project-plans/{plan['slug']}.html\">{html.escape(plan['title'])}</a>.</p>",
                    f"fmw; {plan_tag}; Phase", workday(start, es).isoformat(), workday(start, max(0, ef - 1)).isoformat()])
        for t in members:
            parts = [f"<p><strong>{html.escape(t['id'])}</strong> · {kind_label(t)} · owner or approver: {html.escape(t.get('owner', ''))}</p>",
                     f"<p>Duration {t['dur']} working days · {weeks(t)} · total float {float_text(t).replace('**', '')} · predecessors: {html.escape(pred_text(t))}</p>"]
            for key, title in (("criteria", "Criteria"), ("options", "Options"), ("late", "If decided late")):
                if t.get(key):
                    parts.append(f"<p><strong>{title}:</strong> {html.escape(t[key])}</p>")
            if t.get("kind") == "external":
                parts.append(f"<p>Comes from {html.escape(t['ref'])} in another plan; its date is set there.</p>")
            parts.append(f"<p>Source: <a href=\"{site_url(t['source'])}\">{html.escape(site_url(t['source']))}</a></p>")
            tags = ["fmw", plan_tag, f"fmw-id-{t['id']}", kind_label(t), tag("Owner - " + t.get("owner", ""))]
            if t["_crit"]:
                tags.append("Critical path")
            s = workday(start, t["_es"])
            f = workday(start, max(t["_es"], t["_ef"] - 1)) if t["dur"] else workday(start, max(0, t["_ef"] - 1))
            w.writerow(["Feature", "", f"{t['id']} {t['name']}"[:255], "".join(parts), "; ".join(tags), s.isoformat(), f.isoformat()])
    return "\ufeff" + buf.getvalue()


def label(text: str) -> str:
    # Jira labels can't contain spaces.
    return re.sub(r"[^a-z0-9.]+", "-", text.lower()).strip("-")


def to_jira(plan: dict) -> str:
    """Jira Cloud CSV import: an Epic per phase, a Task per row, Blocks links.

    Work item ID numbers every row; Parent points a Task at its phase's Epic,
    whose row comes first, as the importer requires. Each predecessor's row
    lists its successors in repeated Blocks columns ("this item blocks that
    one"), referring to rows in the same file. Labels can't hold spaces, so
    owner roles and kinds are hyphenated. Dates are yyyy-MM-dd: set that as
    the date format in the import wizard.
    """
    start = plan["project_start"]
    if isinstance(start, str):
        start = dt.date.fromisoformat(start)
    rows, number = [], {}
    n = 0
    for ph in plan["phases"]:
        members = [t for t in plan["tasks"] if t["phase"] == ph]
        if not members:
            continue
        n += 1
        epic = n
        rows.append(("epic", ph, epic))
        for t in members:
            n += 1
            number[t["id"]] = n
            rows.append(("task", t, epic))
    successors: dict[str, list[str]] = {t["id"]: [] for t in plan["tasks"]}
    for t in plan["tasks"]:
        for p, _, _ in t["_preds"]:
            successors[p].append(t["id"])
    max_labels = 6
    max_blocks = max([len(v) for v in successors.values()] + [1])
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\r\n")
    w.writerow(["Work item ID", "Work type", "Parent", "Summary", "Description"]
               + ["Labels"] * max_labels + ["Start date", "Due date"] + ["Blocks"] * max_blocks)
    plan_label = f"fmw-{plan['slug']}"
    page = f"{SITE}docs/project-plans/{plan['slug']}.html"
    for kind, item, epic in rows:
        if kind == "epic":
            members = [t for t in plan["tasks"] if t["phase"] == item]
            es = min(t["_es"] for t in members)
            ef = max(t["_ef"] for t in members)
            labels = ["fmw", plan_label, "phase"]
            w.writerow([epic, "Epic", "", f"{plan['short_title']}: {plan['phases'][item]}",
                        f"{plan['phases'][item]} of the sample plan {plan['title']}.\n{page}"]
                       + labels + [""] * (max_labels - len(labels))
                       + [workday(start, es).isoformat(), workday(start, max(0, ef - 1)).isoformat()]
                       + [""] * max_blocks)
            continue
        t = item
        lines = [f"{t['id']} · {kind_label(t)} · owner or approver: {t.get('owner', '')}",
                 f"Duration {t['dur']} working days · {weeks(t)} · total float {float_text(t).replace('**', '')} · predecessors: {pred_text(t)}"]
        for key, title in (("criteria", "Criteria"), ("options", "Options"), ("late", "If decided late")):
            if t.get(key):
                lines.append(f"{title}: {t[key]}")
        if t.get("kind") == "external":
            lines.append(f"Comes from {t['ref']} in another plan; its date is set there.")
        lines.append(f"Source: {site_url(t['source'])}")
        labels = ["fmw", plan_label, label(f"fmw-id-{t['id']}"), label(kind_label(t)), label("owner " + t.get("owner", ""))]
        if t["_crit"]:
            labels.append("critical-path")
        s = workday(start, t["_es"])
        f = workday(start, max(t["_es"], t["_ef"] - 1)) if t["dur"] else workday(start, max(0, t["_ef"] - 1))
        blocks = [number[x] for x in successors[t["id"]]]
        w.writerow([number[t["id"]], "Task", epic, f"{t['id']} {t['name']}"[:255], "\n".join(lines)]
                   + labels + [""] * (max_labels - len(labels))
                   + [s.isoformat(), f.isoformat()]
                   + blocks + [""] * (max_blocks - len(blocks)))
    return "﻿" + buf.getvalue()


def to_dependencies(plan: dict) -> str:
    """Every predecessor link, for add-azure-boards-links.ps1 (or any tool)."""
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\r\n")
    w.writerow(["Successor", "Predecessor", "Type", "Lag (working days)"])
    for t in plan["tasks"]:
        for p, typ, lag in t["_preds"]:
            w.writerow([t["id"], p, "Finish-to-start" if typ == "FS" else "Start-to-start", lag])
    return buf.getvalue()


def to_mspdi(plan: dict) -> str:
    start = plan["project_start"]
    if isinstance(start, str):
        start = dt.date.fromisoformat(start)
    if start.weekday() != 0:
        raise PlanError(f"{plan['_file']}: project_start must be a Monday")

    def at(offset: int, end: bool) -> str:
        if end:
            d = workday(start, max(0, offset - 1))
            return f"{d.isoformat()}T17:00:00"
        return f"{workday(start, offset).isoformat()}T08:00:00"

    x = lambda s: html.escape(str(s), quote=False)  # noqa: E731
    out = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Project xmlns="http://schemas.microsoft.com/project">',
        f"  <Name>{x(plan['slug'])}.xml</Name>",
        f"  <Title>{x(plan['title'])}</Title>",
        "  <ScheduleFromStart>1</ScheduleFromStart>",
        f"  <StartDate>{at(0, False)}</StartDate>",
        "  <DefaultStartTime>08:00:00</DefaultStartTime>",
        "  <DefaultFinishTime>17:00:00</DefaultFinishTime>",
        "  <MinutesPerDay>480</MinutesPerDay>",
        "  <MinutesPerWeek>2400</MinutesPerWeek>",
        "  <DaysPerMonth>20</DaysPerMonth>",
        "  <DurationFormat>7</DurationFormat>",
        "  <CalendarUID>1</CalendarUID>",
        "  <Calendars>",
        "    <Calendar>",
        "      <UID>1</UID>",
        "      <Name>Standard</Name>",
        "      <IsBaseCalendar>1</IsBaseCalendar>",
        "      <BaseCalendarUID>-1</BaseCalendarUID>",
        "      <WeekDays>",
    ]
    for day_type in range(1, 8):
        if day_type in (1, 7):
            out += ["        <WeekDay>", f"          <DayType>{day_type}</DayType>", "          <DayWorking>0</DayWorking>", "        </WeekDay>"]
        else:
            out += [
                "        <WeekDay>",
                f"          <DayType>{day_type}</DayType>",
                "          <DayWorking>1</DayWorking>",
                "          <WorkingTimes>",
                "            <WorkingTime><FromTime>08:00:00</FromTime><ToTime>12:00:00</ToTime></WorkingTime>",
                "            <WorkingTime><FromTime>13:00:00</FromTime><ToTime>17:00:00</ToTime></WorkingTime>",
                "          </WorkingTimes>",
                "        </WeekDay>",
            ]
    out += ["      </WeekDays>", "    </Calendar>", "  </Calendars>", "  <Tasks>"]
    uid = {}
    n = 0
    for ph in plan["phases"]:
        n += 1
        for t in plan["tasks"]:
            if t["phase"] == ph:
                n += 1
                uid[t["id"]] = n
    n = 0
    for pi, (ph, label) in enumerate(plan["phases"].items(), start=1):
        members = [t for t in plan["tasks"] if t["phase"] == ph]
        if not members:
            continue
        n += 1
        es = min(t["_es"] for t in members)
        ef = max(t["_ef"] for t in members)
        out += [
            "    <Task>",
            f"      <UID>{n}</UID>",
            f"      <ID>{n}</ID>",
            f"      <Name>{x(label)}</Name>",
            f"      <OutlineNumber>{pi}</OutlineNumber>",
            "      <OutlineLevel>1</OutlineLevel>",
            "      <Summary>1</Summary>",
            f"      <Start>{at(es, False)}</Start>",
            f"      <Finish>{at(ef, True)}</Finish>",
            "    </Task>",
        ]
        for ci, t in enumerate(members, start=1):
            n += 1
            milestone = t["dur"] == 0
            s = at(t["_ef"], True) if milestone and t["_ef"] else at(t["_es"], False)
            f = at(t["_ef"], True) if t["_ef"] else s
            notes = [f"Owner or approver: {t.get('owner', '')}"]
            for key, title in (("options", "Options"), ("late", "If decided late"), ("criteria", "Criteria")):
                if t.get(key):
                    notes.append(f"{title}: {t[key]}")
            notes.append(f"Source: {t['source']}")
            out += [
                "    <Task>",
                f"      <UID>{n}</UID>",
                f"      <ID>{n}</ID>",
                f"      <Name>{x(full_name(t).replace('  ', ' '))}</Name>",
                f"      <OutlineNumber>{pi}.{ci}</OutlineNumber>",
                "      <OutlineLevel>2</OutlineLevel>",
                f"      <Start>{s}</Start>",
                f"      <Finish>{f}</Finish>",
                f"      <Duration>PT{t['dur'] * 8}H0M0S</Duration>",
                "      <DurationFormat>7</DurationFormat>",
                f"      <Milestone>{1 if milestone else 0}</Milestone>",
                f"      <Contact>{x(t.get('owner', ''))}</Contact>",
                f"      <Notes>{x(chr(10).join(notes))}</Notes>",
            ]
            if t.get("kind") == "external":
                out += ["      <ConstraintType>4</ConstraintType>", f"      <ConstraintDate>{s}</ConstraintDate>"]
            for p, typ, lag in t["_preds"]:
                out += [
                    "      <PredecessorLink>",
                    f"        <PredecessorUID>{uid[p]}</PredecessorUID>",
                    f"        <Type>{1 if typ == 'FS' else 3}</Type>",
                    f"        <LinkLag>{lag * 4800}</LinkLag>",
                    "        <LagFormat>7</LagFormat>",
                    "      </PredecessorLink>",
                ]
            out.append("    </Task>")
    out += ["  </Tasks>", "</Project>"]
    return "\n".join(out) + "\n"


# ------------------------------------------------------------------ page


def page(plan: dict, plans: dict[str, dict]) -> str:
    tasks = plan["tasks"]
    slug = plan["slug"]
    total_weeks = math.ceil(plan["_finish"] / 5)
    gates = [t for t in tasks if t.get("kind") == "gate"]
    decisions = [t for t in tasks if t.get("kind") == "decision"]
    externals = [t for t in tasks if t.get("kind") == "external"]
    crit = [plan_t for plan_t in sorted(tasks, key=lambda t: (t["_es"], t["_ef"])) if plan_t["_crit"]]
    near = [t for t in sorted(tasks, key=lambda t: (t["_float"], t["_es"])) if 0 < t["_float"] <= NEAR_CRITICAL and t.get("kind") != "external"]
    by_id = {t["id"]: t for t in tasks}
    # Plans that consume this plan's milestones.
    consumers = []
    for other in plans.values():
        for t in other["tasks"]:
            if t.get("kind") == "external" and t["ref"].split(":")[0] == slug:
                consumers.append((other, t))

    def q(s: str) -> str:
        return '"' + s.replace('"', '\\"') + '"'

    L = [
        "---",
        f"title: {q(plan['title'])}",
        f"subtitle: {q(plan['subtitle'])}",
        f"description: {q(plan['description'])}",
        "doc-type: project-plan",
        f"plan-type: {q(plan['plan_type'])}",
        f"plan-books: {q(plan['books'])}",
        f"plan-weeks: {total_weeks}",
        f"fmw-eyebrow: {q('Project plan · Sample · ' + plan['plan_type'])}",
        "---",
        "",
        f"<!-- Generated by scripts/project_plans/build.py from {plan['_file']}. Edit the YAML, not this page. -->",
        "",
        f"# {plan['title']} {{.unnumbered}}",
        "",
        "::: {.callout-note}",
        "## A sample plan, not a commitment",
        "This is an illustrative plan built from the workbook's books, in the form a project manager would baseline: a work breakdown, a schedule network, a computed critical path, decision points, gates and risks. The durations are illustrative, sized to the books' roadmap weeks. Replace them with the agency's own estimates, then baseline the result. The plan names roles, not people, and no specific agency.",
        ":::",
        "",
        "## Plan at a glance",
        "",
        "| | |",
        "|---|---|",
        f"| **Plan type** | {plan['plan_type']}: {plan['covers']} |",
        f"| **Built from** | {plan['books']} |",
        f"| **Sponsor** | {plan['sponsor']} |",
        f"| **Plan manager** | {plan['manager']} |",
        f"| **Duration** | {total_weeks} weeks ({plan['_finish']} working days), computed from the network |",
        f"| **Work** | {sum(1 for t in tasks if t.get('kind', 'task') == 'task')} tasks, {len(gates)} gates, {len(decisions)} decision points"
        + (f", {len(externals)} milestone{'s' if len(externals) != 1 else ''} from other plans" if externals else "")
        + " |",
        f"| **Critical path** | {len(crit)} of {len(tasks)} items; {len(near)} more within {NEAR_CRITICAL} days of it |",
        f"| **Calendar** | {plan['start_label']}; five working days a week |",
        "",
        ": Plan at a glance {.striped}",
        "",
        plan["purpose"].strip(),
        "",
        "## Schedule",
        "",
        f"![The schedule as a Gantt chart: {total_weeks} weeks, with the critical path in red.](images/{slug}-gantt.svg)"
        f'{{fig-alt="Gantt chart of the {html.escape(plan["short_title"])} plan over {total_weeks} weeks, grouped by phase. '
        f"Critical-path tasks are red bars, other tasks are blue bars with a grey line showing their float, gates are violet diamonds, "
        f'decisions are amber diamonds and milestones from other plans are green diamonds. The tables below give every date and float."}}',
        "",
        "## Critical path",
        "",
        plan["critical_path_note"].strip(),
        "",
        "The critical path, in order. Each item has zero total float: a day lost on any of them is a day lost at the finish.",
        "",
        "| # | ID | Item | Owner or approver | When |",
        "|---|---|---|---|---|",
    ]
    for i, t in enumerate(crit, start=1):
        L.append(f"| {i} | {t['id']} | {esc(t['name'])} | {esc(t.get('owner', ''))} | {weeks(t)} |")
    L += ["", ": The critical path {.striped .hover}", ""]
    if near:
        L += [
            f"**Near-critical.** These items have {NEAR_CRITICAL} working days of float or less. Track them weekly: once their float is spent, they join the critical path.",
            "",
            "| ID | Item | Float | When |",
            "|---|---|---|---|",
        ]
        for t in near:
            L.append(f"| {t['id']} | {esc(t['name'])} | {days(t['_float'])} | {weeks(t)} |")
        L += ["", ": Near-critical items {.striped .hover}", ""]
    L += [
        "## Decision points",
        "",
        "Each decision is a zero-duration milestone in the network. *Decide by* is its late finish: the last week it can be made without moving the plan's finish. A decision with zero float sits on the critical path, so the meeting that makes it should be booked before the plan is baselined. Decision rights follow [Book 01, Chapter 09](../books/b01-transformation-arc/09-who-leads-the-transformation.md#decision-rights-across-the-program).",
        "",
        "| ID | Decision | Decides | Needed by | Decide by | Float | Options | If it's late |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for t in sorted(decisions, key=lambda t: (t["_lf"], t["id"])):
        L.append(
            f"| {t['id']} | {esc(t['name'])} | {esc(t['owner'])} | {link_list(t['_succs'])} | end of wk {week_end(t['_lf'])}"
            f" | {'**0 (critical)**' if t['_crit'] else days(t['_float'])} | {esc(t['options'])} | {esc(t['late'])} |"
        )
    L += ["", ": Decision points, by decide-by date {.striped .hover}", ""]
    L += [
        "## Gates",
        "",
        "Each gate is the next phase's entry condition. The approver signs it against the criteria, from evidence in the repository.",
        "",
        "| Gate | When | Approver | Criteria |",
        "|---|---|---|---|",
    ]
    for t in gates:
        L.append(f"| [{esc(t['name'])}]({t['source']}) | {weeks(t)} | {esc(t['owner'])} | {esc(t['criteria'])} |")
    L += ["", ": Gates {.striped .hover}", ""]
    if externals or consumers:
        L += ["## Links to other plans", ""]
        for t in externals:
            head = (f"- **{t['id']}, {t['name']},** is {'the start of ' if t['ref'].endswith(':start') else ''}{t['ref'].split(':')[1]} in the [{t['_ref_title']}]({t['ref'].split(':')[0]}.md) plan"
                    f" ({t['_ref_name']}), {weeks(t)}.")
            if t["_role"] == "input":
                L.append(f"{head} This plan waits for it; it can slip {days(t['_float'])} before it moves this plan. {t['late']}.")
            elif t["_role"] == "deadline":
                margin = t["_margin"]
                state = f"**missed by {-margin} working days**" if margin < 0 else "**no margin**" if margin == 0 else f"a margin of {days(margin)}"
                waits = " Later work in this plan waits for it." if t["_succs"] else ""
                L.append(f"{head} This plan must finish {link_list([p for p, _, _ in t['_preds']])} by then: {state}.{waits} {t['late']}.")
            else:
                L.append(f"{head} Shown for reference.")
        if consumers:
            L += [
                "",
                "Other plans that take a date from this one. *Waits for it*: that plan can't move until this item finishes, and its float says how far this item can slip before it moves that plan. *Must finish by it*: that plan's work has to be done before this item, and the margin says by how much.",
                "",
                "| This plan's item | When | Linked plan | Relationship | Float or margin |",
                "|---|---|---|---|---|",
            ]
            for other, x in sorted(consumers, key=lambda c: (by_id[c[1]["ref"].split(":")[1]]["_ef"], c[0]["short_title"])):
                mine = by_id[x["ref"].split(":")[1]]
                edge = "start of " if x["ref"].endswith(":start") else ""
                if x["_role"] == "deadline":
                    rel = f"Must finish {link_list([p for p, _, _ in x['_preds']])} by it"
                    m = x["_margin"]
                    val = f"**missed by {-m} d**" if m < 0 else "**no margin**" if m == 0 else f"{days(m)} margin"
                elif x["_role"] == "input":
                    rel, val = "Waits for it", days(x["_float"])
                else:
                    rel, val = "Reference only", "—"
                L.append(f"| {edge}{esc(full_name(mine))} | {weeks(mine)} | [{other['short_title']}]({other['slug']}.md) ({x['id']}) | {rel} | {val} |")
            L += ["", ": Plans that take a date from this one {.striped .hover}"]
        L.append("")
    L += [
        "## Work breakdown and schedule",
        "",
        "Every row, by phase. *Float* is total float in working days; **bold** rows are on the critical path. Each row links to the chapter it comes from.",
        "",
    ]
    for ph, label in plan["phases"].items():
        members = [t for t in tasks if t["phase"] == ph]
        if not members:
            continue
        L += [f"### {label}", "", "| ID | Item | Type | Owner or approver | Days | Predecessors | When | Float |", "|---|---|---|---|---|---|---|---|"]
        for t in members:
            name = f"[{esc(t['name'])}]({t['source']})"
            if t["_crit"]:
                name = f"**{name}**"
            L.append(
                f"| {t['id']} | {name} | {kind_label(t)} | {esc(t.get('owner', ''))} | {t['dur'] or '—'} | {esc(pred_text(t))} | {weeks(t)} | {float_text(t)} |"
            )
        L += ["", f": {label} {{.striped .hover}}", ""]
    owners: dict[str, list[int]] = {}
    for t in tasks:
        o = t.get("owner", "")
        k = {"task": 0, "decision": 1, "gate": 2, "external": 0}[t.get("kind", "task")]
        owners.setdefault(o, [0, 0, 0])[k] += 1
    L += [
        "## Responsibility",
        "",
        "Who owns what in this plan. Each row has one owner; consulted and informed parties follow the [decision matrix](../books/b01-transformation-arc/09-who-leads-the-transformation.md#decision-rights-across-the-program).",
        "",
        "| Owner or approver | Tasks | Decisions | Gates |",
        "|---|---|---|---|",
    ]
    for o, (a, b, c) in sorted(owners.items(), key=lambda kv: (-sum(kv[1]), kv[0])):
        L.append(f"| {esc(o)} | {a or '—'} | {b or '—'} | {c or '—'} |")
    L += ["", ": Ownership {.striped .hover}", ""]
    L += ["## Assumptions", ""] + [f"- {a}" for a in plan["assumptions"]] + [""]
    L += ["## Schedule risks", "", "| Risk | Effect on the schedule | Response |", "|---|---|---|"]
    for r in plan["risks"]:
        L.append(f"| {esc(r['risk'])} | {esc(r['impact'])} | {esc(r['response'])} |")
    L += ["", ": Schedule risks {.striped .hover}", ""]
    L += [
        "## Baseline and change control",
        "",
        "- **Baseline** the plan when its first gate is approved: the YAML file, as merged, is the baseline.",
        "- **Report** weekly, green, yellow or red, against the baseline ([Book 01, Chapter 12](../books/b01-transformation-arc/12-migration-roadmap.md#phase-3-general-rollout-weeks-1736)). Report float, not percent complete: a task's float says how much slip the plan can still absorb.",
        "- **Change** the plan only through a reviewed pull request that edits the YAML and regenerates this page, so every change to a date or a dependency has an author, a reviewer and a reason.",
        "- **Re-baseline** at each gate, after the approver signs it, and whenever a critical-path decision is made late.",
        "",
        "## Download and adapt",
        "",
        "| File | Use it for |",
        "|---|---|",
        f"| [{slug}.xml](files/{slug}.xml) | Microsoft Project desktop (open the XML file; it keeps the dependencies, milestones and owners). The dates start on a placeholder Monday: change the project start date. |",
        f"| [{slug}.csv](files/{slug}.csv) | Excel or any other scheduling tool: every row with its dependencies, early and late dates and float |",
        f"| [{slug}-azure-boards.csv](files/{slug}-azure-boards.csv) | Azure DevOps Boards: an Epic per phase and a Feature per task, gate and decision, with dates and tags (see below) |",
        f"| [{slug}-dependencies.csv](files/{slug}-dependencies.csv) · [add-azure-boards-links.ps1](files/add-azure-boards-links.ps1) | The plan's predecessor links, and a script that adds them in Azure Boards after the import |",
        f"| [{slug}-jira.csv](files/{slug}-jira.csv) | Jira: an Epic per phase and a Task per task, gate and decision, with dates, labels and Blocks links (see below) |",
        f"| [{Path(plan['_file']).name}]({GH}/{plan['_file']}) | The source. Edit the durations, owners and dependencies, then run `python scripts/project_plans/build.py` to recompute the critical path and regenerate this page, the chart and the downloads. |",
        "",
        ": Downloads {.striped}",
        "",
        "::: {.callout-tip}",
        "## Importing this plan into Azure DevOps Boards",
        f"1. In the project, select **Boards** > **Queries** > **Import work items**, choose [{slug}-azure-boards.csv](files/{slug}-azure-boards.csv), check the results and select **Save items**. It creates one Epic per phase with a Feature under it for each task, gate and decision, with start and target dates, which is what Delivery Plans show. Epic and Feature exist in the Agile, Scrum and CMMI processes; in the Basic process, change *Feature* to *Issue* in the file first.",
        f"2. The import can't create dependency links or assign people. To add the predecessor links, sign in with `az login`, add the CLI extension with `az extension add --name azure-devops`, and run `./add-azure-boards-links.ps1 -Organization https://dev.azure.com/<org> -Project <project> -Plan {slug}` beside [{slug}-dependencies.csv](files/{slug}-dependencies.csv). It finds the imported items by their `fmw-id-` tags and links each one to its predecessors.",
        "3. Assign people in Boards: each item carries its owner role as an *Owner - …* tag, and critical-path items carry *Critical path*. Azure Boards links don't hold lag or start-to-start timing; each item's description keeps them.",
        "",
        "The dates count from the plan's placeholder start; shift them when you set the real start. The script hasn't been run against a live organization yet: test it on a scratch project first.",
        ":::",
        "",
        "::: {.callout-tip}",
        "## Importing this plan into Jira",
        f"1. Run the CSV importer (in Jira Cloud, **Settings** > **System** > **External system import** > **CSV**) with [{slug}-jira.csv](files/{slug}-jira.csv). On the second step, set **Date format in import file** to `yyyy-MM-dd`.",
        "2. Map the columns: *Work item ID* to Work item ID, *Work type* to Work type, *Parent* to Parent, *Summary*, *Description* and every *Labels* column to their fields, *Start date* to the Start date field, *Due date* to Due date, and every *Blocks* column to the **Blocks** link type. Each phase becomes an Epic with a Task under it for each task, gate and decision; each Blocks column makes that row's item block the item it names, which carries the plan's dependencies.",
        "3. Assign people in Jira: each item carries its owner role as an `owner-…` label, and critical-path items carry `critical-path`. Jira links don't hold lag or start-to-start timing; each description keeps them.",
        "",
        "Test the import on a scratch project with a few rows first: the importer doesn't remove duplicate links and Jira has no bulk delete for them. If the Blocks links don't come through on your site, import the items first and add the links from the plan's dependency list in a second pass, as Atlassian recommends. The dates count from the plan's placeholder start.",
        ":::",
        "",
        "::: {.callout-tip}",
        "## Opening this plan in Project or Planner",
        "- **Microsoft Project desktop** opens the XML file directly, with every dependency, milestone and owner.",
        "- **Microsoft Planner** has no file import of its own: it doesn't read XML, CSV or Excel. To bring this plan into a Planner premium plan, open the XML file in Project desktop, save it as an `.mpp` file, and import that through the Project Power App. Tasks, durations, dependencies and milestones come across; resources and baselines don't, so assign owners again in Planner.",
        "- **Without Project desktop**, the CSV can feed a Power Automate flow that creates the tasks one by one, but dependencies in a premium plan need Microsoft's Project schedule APIs, so that's a build, not an import.",
        "- **In a government cloud tenant**, check that premium plans are available before relying on Planner for this schedule: Microsoft notes that converting a basic plan to a premium plan isn't available in GCC.",
        "",
        "Project for the web was retired on August 1, 2025, and Project Online on September 30, 2026; Planner is their successor. Project desktop is unaffected.",
        ":::",
        "",
    ]
    return "\n".join(L) + "\n"


# ------------------------------------------------------------------ main


def outputs(plans: dict[str, dict]) -> dict[Path, str]:
    files: dict[Path, str] = {}
    for slug in dependency_order(plans):
        validate(plans[slug])
        schedule(plans[slug], plans)
    for slug, plan in plans.items():
        files[OUT / f"{slug}.md"] = page(plan, plans)
        files[OUT / "images" / f"{slug}-gantt.svg"] = gantt(plan)
        files[OUT / "files" / f"{slug}.csv"] = to_csv(plan)
        files[OUT / "files" / f"{slug}.xml"] = to_mspdi(plan)
        files[OUT / "files" / f"{slug}-azure-boards.csv"] = to_azure_boards(plan)
        files[OUT / "files" / f"{slug}-dependencies.csv"] = to_dependencies(plan)
        files[OUT / "files" / f"{slug}-jira.csv"] = to_jira(plan)
    return files


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="exit 1 if any generated file differs from the YAML")
    ap.add_argument("--draft", type=Path, action="append", default=[],
                    help="dry run: validate and schedule this draft YAML with the committed plans, print a summary, write nothing")
    args = ap.parse_args()
    try:
        plans = load_plans(args.draft)
        files = outputs(plans)
    except PlanError as e:
        print(f"project plans: {e}", file=sys.stderr)
        return 2
    if args.draft:
        for d in args.draft:
            plan = plans[d.stem]
            print(f"{plan['slug']}: {math.ceil(plan['_finish'] / 5)} weeks ({plan['_finish']} working days)")
            for t in plan["tasks"]:
                if t.get("kind", "task") != "task" or t["_crit"] or t["_float"] <= NEAR_CRITICAL:
                    if t.get("kind") == "external":
                        flag = t["_role"] + (f" margin {t['_margin']}" if t["_role"] == "deadline" else f" float {t['_float']}" if t["_role"] == "input" else "")
                    else:
                        flag = "CRITICAL" if t["_crit"] else f"float {t['_float']} d"
                    print(f"  {t['id']:8} {t.get('kind', 'task'):8} {weeks(t):16} {flag:12} {full_name(t)}")
        return 0
    stale = []
    for path, text in files.items():
        data = text.encode("utf-8")
        if path.exists() and path.read_bytes() == data:
            continue
        stale.append(path.relative_to(ROOT).as_posix())
        if not args.check:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    if args.check and stale:
        print("project plans: stale outputs (run scripts/project_plans/build.py):\n  " + "\n  ".join(stale), file=sys.stderr)
        return 1
    print(f"project plans: {len(files)} files, {len(stale)} {'stale' if args.check else 'written'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
