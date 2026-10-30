#!/usr/bin/env python3
"""Check dependency evidence maps and keep their summaries generated.

An evidence map (Book 18 Chapter 02, "Recording dependencies as an evidence
map") is a YAML file of typed entities joined by typed, directed, sourced and
dated relationships. Maps live in examples/evidence-maps/*.yml; the schema is
data/schemas/evidence-map.schema.json. Next to each map sits a generated
summary, <map>.summary.md: master records ranked by what points at them, each
system's dependency inputs, outside exchanges with their agreement terms, and
the open questions. The map is the authoritative record; the summary is
derived from it.

    python scripts/check_evidence_maps.py                 # check, rewrite every summary
    python scripts/check_evidence_maps.py --check         # exit 1 on an error or a stale summary
    python scripts/check_evidence_maps.py --check a.yml   # just these maps

Errors (exit 1): the schema; duplicate or dangling ids; a link with no
evidence that isn't marked assumed and tied to an open question; a date later
than the map's as_of; a basis that contradicts the status; a governs or
contains link between the wrong kinds of entity; and, with --check, a summary
that doesn't match its map. Warnings (reported, exit 0): a current link not
observed within stale_after_days or never observed; an agreement term that has
lapsed; an answered question still propping up an assumed link. With
--as-of DATE (the weekly run uses today), staleness and terms are judged at
that date instead of the map's as_of, and a term ending within 180 days is a
warning too; a map marked example: true is still judged at its own as_of. An
assumed link with an open question isn't also reported as never observed.

Needs PyYAML and jsonschema.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[1]
SCHEMA = REPO / "data" / "schemas" / "evidence-map.schema.json"
MAPS = REPO / "examples" / "evidence-maps"
SUMMARY_SUFFIX = ".summary.md"
DEPENDENCY_KINDS = ("reads", "writes", "feeds", "calls")
CONFIDENCE_ORDER = ("measured", "attested", "assumed")    # strongest first
TERM_SOON_DAYS = 180


class _StringDates(yaml.SafeLoader):
    """SafeLoader that leaves dates as strings, so the schema sees what the file says."""


_StringDates.yaml_implicit_resolvers = {
    k: [(tag, rx) for tag, rx in v if tag != "tag:yaml.org,2002:timestamp"]
    for k, v in yaml.SafeLoader.yaml_implicit_resolvers.items()
}


def load(path: Path) -> object:
    return yaml.load(path.read_text(encoding="utf-8"), Loader=_StringDates)


@dataclass
class Report:
    path: str
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def schema_errors(doc: object) -> list[str]:
    import jsonschema

    validator = jsonschema.Draft202012Validator(json.loads(SCHEMA.read_text(encoding="utf-8")))
    out = []
    for e in sorted(validator.iter_errors(doc), key=lambda e: [str(p) for p in e.absolute_path]):
        where = "/".join(str(p) for p in e.absolute_path) or "(top)"
        out.append(f"schema: {where}: {e.message}")
    return out


def day(s: str) -> dt.date:
    return dt.date.fromisoformat(s)


def check(doc: dict, today: dt.date | None = None) -> tuple[list[str], list[str]]:
    """The rules a schema can't express. Assumes the document passed the schema.

    Dates on the map are checked against its as_of. Staleness and agreement
    terms are judged at `today` when given (the weekly run), else at as_of.
    """
    errors: list[str] = []
    warnings: list[str] = []
    as_of = day(doc["map"]["as_of"])
    live = today is not None and not doc["map"].get("example")      # an example stays at its own date
    now = today if live else as_of
    stale = doc["map"].get("stale_after_days", 365)
    entities = {e["id"]: e for e in doc["entities"]}
    rels = doc["relationships"]
    questions = {q["id"]: q for q in doc.get("open_questions", [])}

    seen: set[str] = set()
    for kind, items in (("entity", doc["entities"]), ("relationship", rels), ("question", doc.get("open_questions", []))):
        for item in items:
            if item["id"] in seen:
                errors.append(f"{kind} {item['id']}: id used more than once")
            seen.add(item["id"])

    def not_after_as_of(what: str, value: str | None) -> None:
        if value and day(value) > as_of:
            errors.append(f"{what}: {value} is after the map's as_of {as_of}")

    for e in doc["entities"]:
        if "term_ends" in e:
            left = (day(e["term_ends"]) - now).days
            if left < 0:
                warnings.append(f"entity {e['id']}: term ended {e['term_ends']}; renew it or record the exchange as retired")
            elif live and left <= TERM_SOON_DAYS:
                warnings.append(f"entity {e['id']}: term ends {e['term_ends']}, {left} days from {now}; renewal due")

    for r in rels:
        rid = r["id"]
        for end in ("from", "to"):
            if r[end] not in entities:
                errors.append(f"relationship {rid}: {end} {r[end]} is not an entity on this map")
        if r["from"] == r["to"]:
            errors.append(f"relationship {rid}: links {r['from']} to itself")
        if "question" in r and r["question"] not in questions:
            errors.append(f"relationship {rid}: question {r['question']} is not an open question on this map")
        if not r["evidence"]:
            if r["confidence"] != "assumed" or "question" not in r:
                errors.append(f"relationship {rid}: no evidence, so it must be confidence: assumed with a question that would settle it")
        for i, ev in enumerate(r["evidence"]):
            not_after_as_of(f"relationship {rid}: evidence {i + 1} revised", ev["revised"])
        not_after_as_of(f"relationship {rid}: observed", r.get("observed"))
        if (r["basis"] == "planned") != (r["status"] == "planned"):
            errors.append(f"relationship {rid}: basis {r['basis']} with status {r['status']}; a planned link is both")
        if r["basis"] == "historical" and r["status"] != "retired":
            errors.append(f"relationship {rid}: a historical link is retired, not {r['status']}")
        src, dst = entities.get(r["from"]), entities.get(r["to"])
        if src and dst:
            if r["kind"] == "governs" and src["type"] not in ("governance_document", "finding"):
                errors.append(f"relationship {rid}: only a governance document or a finding governs; {r['from']} is a {src['type']}")
            if r["kind"] == "contains" and (src["type"] != "data_store" or dst["type"] != "data_element"):
                errors.append(f"relationship {rid}: contains runs from a data store to a data element")
        if r["status"] == "current" and r["basis"] != "planned":
            open_q = r.get("question") in questions and "answered" not in questions[r["question"]]
            if "observed" not in r:
                if not (r["confidence"] == "assumed" and open_q):     # otherwise already tracked as a question
                    warnings.append(f"relationship {rid}: current, but nobody has recorded observing it")
            elif (now - day(r["observed"])).days > stale:
                warnings.append(f"relationship {rid}: last observed {r['observed']}, more than {stale} days before {now}")
        q = questions.get(r.get("question", ""))
        if q and "answered" in q and r["confidence"] == "assumed":
            warnings.append(f"relationship {rid}: question {q['id']} was answered {q['answered']}, but the link is still assumed")

    for q in questions.values():
        for ref in q["about"]:
            if ref not in entities and ref not in {r["id"] for r in rels}:
                errors.append(f"question {q['id']}: about {ref}, which is not on this map")
        not_after_as_of(f"question {q['id']}: asked", q["asked"])
        not_after_as_of(f"question {q['id']}: answered", q.get("answered"))
    return errors, warnings


def weakest(confidences: list[str]) -> str:
    return max(confidences, key=CONFIDENCE_ORDER.index) if confidences else "—"


def summary(doc: dict, map_name: str) -> str:
    """The generated summary for one map. Deterministic: depends only on the map."""
    m = doc["map"]
    as_of = day(m["as_of"])
    entities = {e["id"]: e for e in doc["entities"]}
    current = [r for r in doc["relationships"] if r["status"] == "current"]
    deps = [r for r in current if r["kind"] in DEPENDENCY_KINDS]

    def name(eid: str) -> str:
        return entities[eid]["name"] if eid in entities else eid

    lines = [
        f"<!-- generated from {map_name} by scripts/check_evidence_maps.py; do not hand-edit -->",
        "",
        f"# {m['title']} — evidence map summary",
        "",
        f"Map `{m['id']}`, as of {m['as_of']}. {len(entities)} entities, {len(doc['relationships'])} relationships "
        f"({len(current)} current), {len(doc.get('open_questions', []))} open question(s).",
        "",
        "## Master records, ranked by what depends on them",
        "",
        "Incoming current reads, writes, feeds and calls. Outside exchanges are counted separately because the agency can't change them alone.",
        "",
        "| Rank | Master record | Incoming | From outside exchanges | Assumed | Governed by |",
        "|---:|---|---:|---:|---:|---|",
    ]
    masters = [e for e in doc["entities"] if e.get("master_record")]
    rows = []
    for e in masters:
        inc = [r for r in deps if r["to"] == e["id"]]
        outside = [r for r in inc if entities.get(r["from"], {}).get("type") == "data_exchange"]
        assumed = [r for r in inc if r["confidence"] == "assumed"]
        gov = sorted(name(r["from"]) for r in current if r["kind"] == "governs" and r["to"] == e["id"])
        rows.append((len(inc), len(outside), e, len(assumed), gov))
    rows.sort(key=lambda t: (-t[0], -t[1], t[2]["id"]))
    for rank, (n_in, n_out, e, n_assumed, gov) in enumerate(rows, 1):
        lines.append(f"| {rank} | {e['name']} | {n_in} | {n_out} | {n_assumed} | {'; '.join(gov) or '—'} |")
    if not rows:
        lines.append("| — | No entity is marked master_record | | | | |")

    lines += [
        "",
        "## Dependency inputs per system",
        "",
        "The inputs Chapter 02's dependency score is computed from. The confidence is the weakest among the system's current links.",
        "",
        "| System | Type | Depends on | Depended on by | Outside exchanges involved | Assumed share | Weakest confidence |",
        "|---|---|---:|---:|---:|---:|---|",
    ]
    for e in sorted((e for e in doc["entities"] if e["type"] in ("application", "process", "data_exchange")),
                    key=lambda e: e["id"]):
        out_ = [r for r in deps if r["from"] == e["id"]]
        in_ = [r for r in deps if r["to"] == e["id"]]
        mine = out_ + in_
        ext = {r["from"] if entities.get(r["from"], {}).get("type") == "data_exchange" else r["to"]
               for r in mine if "data_exchange" in (entities.get(r["from"], {}).get("type"), entities.get(r["to"], {}).get("type"))}
        ext.discard(e["id"])                                  # an exchange doesn't count itself
        share = f"{sum(r['confidence'] == 'assumed' for r in mine) / len(mine):.0%}" if mine else "—"
        lines.append(f"| {e['name']} | {e['type'].replace('_', ' ')} | {len(out_)} | {len(in_)} | {len(ext)} | {share} | "
                     f"{weakest([r['confidence'] for r in mine])} |")

    exchanges = [e for e in doc["entities"] if e["type"] == "data_exchange" or
                 (e["type"] == "governance_document" and "term_ends" in e)]
    lines += ["", "## Outside exchanges and agreement terms", ""]
    if exchanges:
        lines += ["| Entity | Partner | Term ends | Days left at as_of |", "|---|---|---|---:|"]
        for e in sorted(exchanges, key=lambda e: (e.get("term_ends", "9999-12-31"), e["id"])):
            if "term_ends" in e:
                left = (day(e["term_ends"]) - as_of).days
                flag = " (lapsed)" if left < 0 else (" (renewal due)" if left <= TERM_SOON_DAYS else "")
                lines.append(f"| {e['name']} | {e.get('partner', '—')} | {e['term_ends']} | {left}{flag} |")
            else:
                lines.append(f"| {e['name']} | {e.get('partner', '—')} | not recorded | — |")
    else:
        lines.append("None on this map.")

    lines += ["", "## Open questions", ""]
    qs = doc.get("open_questions", [])
    if qs:
        lines += ["| Question | About | Owner | Asked | Answered |", "|---|---|---|---|---|"]
        for q in sorted(qs, key=lambda q: (q["asked"], q["id"])):
            about = "; ".join(name(a) if a in entities else a for a in q["about"])
            lines.append(f"| {q['question']} | {about} | {q['owner']} | {q['asked']} | {q.get('answered', 'open')} |")
    else:
        lines.append("None.")
    return "\n".join(lines) + "\n"


def summary_path(map_path: Path) -> Path:
    return map_path.with_name(map_path.stem + SUMMARY_SUFFIX)


def run(paths: list[Path], write: bool, today: dt.date | None = None) -> list[Report]:
    reports = []
    for p in paths:
        rel = p.resolve().relative_to(REPO).as_posix() if p.resolve().is_relative_to(REPO) else str(p)
        rep = Report(rel)
        reports.append(rep)
        try:
            doc = load(p)
        except yaml.YAMLError as exc:
            rep.errors.append(f"YAML: {exc}")
            continue
        rep.errors += schema_errors(doc)
        if rep.errors:
            continue
        errs, warns = check(doc, today)
        rep.errors += errs
        rep.warnings += warns
        if rep.errors:
            continue
        want = summary(doc, p.name)
        sp = summary_path(p)
        have = sp.read_text(encoding="utf-8").replace("\r\n", "\n") if sp.is_file() else None
        if have != want:
            if write:
                sp.write_text(want, encoding="utf-8", newline="\n")
                print(f"wrote {sp.relative_to(REPO).as_posix() if sp.resolve().is_relative_to(REPO) else sp}")
            else:
                rep.errors.append(f"{sp.name} is {'missing' if have is None else 'out of date'}; "
                                  "run python scripts/check_evidence_maps.py and commit the result")
    return reports


def default_maps() -> list[Path]:
    return sorted(p for p in MAPS.glob("*.yml") if not p.name.endswith(SUMMARY_SUFFIX))


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")   # type: ignore[attr-defined]
        except AttributeError:
            pass
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("maps", nargs="*", type=Path, help=f"maps to check (default: every *.yml in {MAPS.relative_to(REPO).as_posix()})")
    ap.add_argument("--check", action="store_true", help="don't rewrite summaries; fail if one differs")
    ap.add_argument("--as-of", type=dt.date.fromisoformat, metavar="YYYY-MM-DD",
                    help="judge staleness and agreement terms at this date, and warn on renewals due (the weekly run)")
    args = ap.parse_args(argv)

    paths = args.maps or default_maps()
    if not paths:
        print("no evidence maps found")
        return 0
    reports = run(paths, write=not args.check, today=args.as_of)
    failed = False
    for rep in reports:
        status = "FAIL" if rep.errors else ("warn" if rep.warnings else "ok")
        print(f"{status:4}  {rep.path}")
        for e in rep.errors:
            print(f"      error: {e}")
        for w in rep.warnings:
            print(f"      warning: {w}")
        failed |= bool(rep.errors)
    print(f"{len(reports)} map(s); {sum(bool(r.errors) for r in reports)} with errors, "
          f"{sum(len(r.warnings) for r in reports)} warning(s)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
