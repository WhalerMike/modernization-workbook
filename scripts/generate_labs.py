#!/usr/bin/env python3

"""Make the labs easy to find: the Labs page, and "Try it" links in the implementation guides.

A training module whose Lab 1 or Lab 2 exercise links to developer workbook chapters' labs, rather than
writing the commands out, gets each linked chapter's command list under the exercise, between
labs:begin module-lab-N-commands markers (a deployment module's Lab 2 takes the chapter's live test stage).
Steps that run no command are listed as such, so a portal-only step is visible.

Every developer workbook chapter except the deployment runbooks ends with two labs: "Lab 1", on the kit's fixtures with no tenant, and
"Lab 2", in a non-production tenant, instance or subscription. The learning paths' modules have exercises
built on them. This script reads them from the pages themselves and writes:

  docs/training/labs.md     every lab in one place: each chapter's Lab 1 (with what it needs) and Lab 2
                            (with where it runs), linked straight to the lab, and the module that uses it

and, in each implementation guide that has a developer workbook, generated blocks between labs:begin and
labs:end markers (the review gate leaves them out, as it does the tour blocks):

  - after "How to read this guide", a "Labs for this guide" box that links the guide's labs on the Labs page;
  - after each gate's Validate callout, where a learning path maps its modules to the guide's gates
    (Ticket-to-Machine and HR-Driven Identity), a "Try it" box with that gate's labs and module, or,
    where a workbook maps the guide's gates to its chapters (Privileged Access), one with that chapter's labs;
    a guide that already has its own "Try it" callout there (Provider Notices) keeps it, and the generated
    box follows it as "Labs and training";

and, at the top of every lab and module exercise, "Every command in Lab N": each of the lab's own
```bash and ```powershell blocks, in order, under the step it belongs to, so a reader can follow the lab
top to bottom (labs give every action as an exact command; see CONTRIBUTING).

    python scripts/generate_labs.py            # write the page and the guide blocks
    python scripts/generate_labs.py --check    # exit 1 if either is stale
"""
from __future__ import annotations

import argparse
import posixpath
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "docs" / "training" / "labs.md"


@dataclass
class Workbook:
    key: str
    title: str
    docs: str
    zip: str
    guide: str | None = None
    training: str | None = None         # the learning path's folder, whose index maps modules to gates
    elsewhere: dict = field(default_factory=dict)   # chapter -> (label, page): a module in another path teaches it
    gates: dict | None = None           # without a gate table in the path: the guide's gate number -> its workbook chapters
    chapters: list = field(default_factory=list)


WORKBOOKS = [
    Workbook("ttm", "Building Ticket-to-Machine", "docs/project-plans/developer-workbooks/ticket-to-machine",
             "ticket-to-machine-code.zip", "docs/books/guides/ttm-servicenow-sailpoint.md", "docs/training/ticket-to-machine"),
    Workbook("hr", "Building HR-Driven Identity", "docs/project-plans/developer-workbooks/hr-driven-identity",
             "hr-driven-identity-code.zip", "docs/books/guides/hr-driven-identity-implementation.md", "docs/training/hr-driven-identity"),
    Workbook("adm", "Building the Attribute-Driven Migration (Book 19)", "docs/books/b19-developer-workbook",
             "attribute-driven-migration-code.zip", "docs/books/guides/attribute-driven-migration-implementation.md",
             "docs/training/attribute-driven-migration",
             {"02": ("Microsoft Automation, Module 1", "docs/training/ms-automation-foundations.md")}),
    Workbook("pa", "Building Privileged Access", "docs/project-plans/developer-workbooks/privileged-access",
             "privileged-access-code.zip", "docs/books/guides/privileged-access-implementation.md",
             "docs/training/privileged-access", gates={str(n): [f"{n:02d}"] for n in range(1, 9)}),
    Workbook("npi", "Building Non-Person Identity", "docs/project-plans/developer-workbooks/non-person-identity",
             "non-person-identity-code.zip", "docs/books/guides/non-person-identity-implementation.md",
             "docs/training/non-person-identity"),
    Workbook("pn", "Building Provider Notices", "docs/project-plans/developer-workbooks/provider-notices",
             "provider-notices-code.zip", "docs/books/guides/provider-notices-implementation.md",
             "docs/training/provider-notices"),
    Workbook("xdr", "Building Defender XDR", "docs/project-plans/developer-workbooks/defender-xdr",
             "defender-xdr-code.zip", "docs/books/guides/defender-xdr-implementation.md",
             "docs/training/defender-xdr"),
    Workbook("gsa", "Building Global Secure Access", "docs/project-plans/developer-workbooks/global-secure-access",
             "global-secure-access-code.zip", "docs/books/guides/global-secure-access-implementation.md",
             "docs/training/global-secure-access"),
    Workbook("azs", "Building Azure Security", "docs/project-plans/developer-workbooks/azure-security",
             "azure-security-code.zip", "docs/books/guides/azure-security-implementation.md",
             "docs/training/azure-security"),
    Workbook("dc", "Building the Daily Checks Workbook", "docs/project-plans/developer-workbooks/daily-checks",
             "daily-checks-workbook-code.zip", "docs/books/guides/daily-checks-dashboard-implementation.md",
             "docs/training/daily-checks-dashboard"),
    Workbook("ip", "Building Information Protection", "docs/project-plans/developer-workbooks/information-protection",
             "information-protection-code.zip", "docs/books/guides/information-protection-implementation.md",
             "docs/training/information-protection", gates={"1": ["01", "03"], "2": ["04"], "3": ["04"], "4": ["04"], "5": ["05"], "6": ["05"], "7": ["05"],
                    "8": ["06"], "9": ["06"], "10": ["01", "07"], "11": ["06", "07"], "12": ["02", "08", "09"]}),
    # Book 06's runbooks R01 to R10 are its implementation guide, so there is no guide here.
    Workbook("sql", "Building SQL Server Identity", "docs/project-plans/developer-workbooks/sql-server-identity",
             "sql-server-identity-code.zip", training="docs/training/data-platform"),
    Workbook("am", "Building Application Modernization", "docs/project-plans/developer-workbooks/application-modernization",
             "app-modernization.zip", training="docs/training/application-modernization"),
]
# Learning paths whose modules have their own exercises but no developer workbook behind them.
MS_AUTOMATION = ["docs/training/ms-automation-foundations.md", "docs/training/ms-automation-entra.md",
                 "docs/training/ms-automation-intune.md", "docs/training/ms-automation-arc.md"]
# The Zero Trust Assessment learning path: its modules carry the labs for the guide and the results kit.
ZTA = ["docs/training/zero-trust-assessment/01-evidence-not-a-verdict.md",
       "docs/training/zero-trust-assessment/02-running-the-assessment-safely.md",
       "docs/training/zero-trust-assessment/03-from-results-to-a-closure-register.md",
       "docs/training/zero-trust-assessment/04-reconcile-re-run-and-keep-the-evidence.md"]


@dataclass
class KitPath:
    """A learning path with no developer workbook, whose modules carry the labs for one kit, as the
    Zero Trust Assessment path's do. Its modules are the folder's numbered pages."""
    key: str            # the Labs page anchor
    heading: str
    folder: str
    guide: str
    zip: str
    caption: str
    guide_label: str = "its implementation guide"

    def modules(self) -> list[str]:
        return sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / self.folder).glob("[0-9][0-9]-*.md"))


KIT_PATHS = [
    KitPath("network-sd-wan", "The SD-WAN governor learning path", "docs/training/network-sd-wan",
            "docs/books/guides/cisco-sdwan-implementation.md", "cisco-sdwan.zip", "The SD-WAN governor"),
    KitPath("pki", "The PKI and Certificates learning path", "docs/training/pki",
            "docs/books/b07-pki/index.md", "start-kit.zip", "PKI and Certificates", "Book 07"),
    KitPath("ddi", "The DNS, DHCP and IPAM learning path", "docs/training/dns-dhcp-ipam",
            "docs/books/guides/infoblox-nios-implementation.md", "start-kit.zip", "DNS, DHCP and IPAM"),
]

BEGIN = "<!-- labs:begin {} (generated by scripts/generate_labs.py; not part of the reviewed page) -->"
END = "<!-- labs:end -->"
MARKED = re.compile(r"^( *)<!-- labs:begin[^\n]*-->\n(?:(?!<!-- labs:begin).)*?^\1<!-- labs:end -->\n\n", re.S | re.M)
HEADING = re.compile(r"^## (.+?)\s*(\{#([\w-]+)\})?\s*$", re.M)


def slug(text: str) -> str:
    """The identifier Pandoc gives a heading (its auto_identifiers rules)."""
    t = unicodedata.normalize("NFKD", text)
    t = t.replace("`", "").replace("*", "")
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t).lower()
    t = "".join(c for c in t if c.isalnum() or c in " -_.")
    t = re.sub(r"\s+", "-", t.strip())
    return re.sub(r"^[^a-z]+", "", t) or "section"


def front(md: str, key: str) -> str:
    m = re.search(rf'^{key}:\s*"(.*)"\s*$', md, re.M)
    return m.group(1) if m else ""


def headings(md: str) -> list[tuple[str, str, int]]:
    """(text, id, position) for each level-two heading."""
    return [(m.group(1), m.group(3) or slug(m.group(1)), m.start()) for m in HEADING.finditer(md)]


def section(md: str, pos: int) -> str:
    nxt = HEADING.search(md, pos + 3)
    return md[pos:nxt.start() if nxt else len(md)]


def needs(text: str) -> str:
    """What a lab's opening paragraph says it needs: its "You need ..." sentence, or the tools in
    "Work in `<folder>`, with ...", without those words."""
    body = text.split("\n", 1)[1] if "\n" in text else ""
    first = body.strip().split("\n\n")[0].replace("\n", " ")
    m = (re.search(r"\bYou need ([^.]*(?:\.\d[^.]*)*)\.", first)
         or re.search(r"^Work in `[^`]+`(?: in [A-Za-z]+)?, with ([^.]*(?:\.\d[^.]*)*)\.", first))
    return m.group(1).strip() if m else ""


def first_sentence(text: str) -> str:
    body = text.split("\n", 1)[1].strip() if "\n" in text else ""
    m = re.match(r"(.+?[.:])(\s|$)", body.split("\n\n")[0].replace("\n", " "))
    return m.group(1) if m else ""


def rel(src: str, dst: str) -> str:
    return posixpath.relpath(dst, posixpath.dirname(src))


def read_workbooks() -> None:
    for wb in WORKBOOKS:
        wb.chapters = []
        for page in sorted((ROOT / wb.docs).glob("[0-9][0-9]-*.md")):
            md = page.read_text(encoding="utf-8")
            ch = {"nn": page.name[:2], "path": f"{wb.docs}/{page.name}", "title": front(md, "title")}
            for text, hid, pos in headings(md):
                if re.match(r"Lab 1\b", text):
                    ch["lab1"] = (hid, needs(section(md, pos)))
                    ch["cmds1"] = bool(FENCE.search(section(md, pos)))
                elif re.match(r"Lab 2\b", text):
                    ch["lab2"] = (hid, text.split(":", 1)[1].strip() if ":" in text else "", first_sentence(section(md, pos)))
                    ch["cmds2"] = bool(FENCE.search(section(md, pos)))
            wb.chapters.append(ch)


def modules(wb: Workbook) -> list[dict]:
    """The learning path's modules: title, page, exercise anchors, the guide gates and workbook chapters."""
    if not wb.training:
        return []
    index = (ROOT / wb.training / "index.md").read_text(encoding="utf-8")
    out = []
    for row in re.findall(r"^\| \d+ \| (.+)$", index, re.M):
        cells = [c.strip() for c in row.rstrip("|").split(" | ")]
        m = re.match(r"\[(.+?)\]\(([^)]+\.md)\)", cells[0])
        if not m or len(cells) < 3:
            continue
        path = posixpath.normpath(f"{wb.training}/{m.group(2)}")
        md = (ROOT / path).read_text(encoding="utf-8")
        ex = {}
        for text, hid, _ in headings(md):
            if "Lab 1" in text:
                ex["lab1"] = hid
            elif "Lab 2" in text:
                ex["lab2"] = hid
        out.append({"title": front(md, "title").split(": ", 1)[-1], "path": path, "ex": ex,
                    "gates": sorted(set(re.findall(r"\bG(\d+)\b", cells[1])), key=int),
                    "chapters": re.findall(r"\[(\d\d)\]", cells[2]), "n": len(out) + 1})
    return out


def lab_link(src: str, ch: dict, which: str) -> str:
    hid = ch[which][0]
    return f"{rel(src, ch['path'])}#{hid}"


def review_fields() -> list[str]:
    """The page's review gate fields, kept as review_gate.py --approve wrote them. The gate
    hashes the body, so the approval holds until the generated body changes."""
    if not PAGE.exists():
        return []
    text = PAGE.read_bytes().decode("utf-8").replace("\r\n", "\n")
    meta = re.match(r"\A---\s*\n(.*?)\n---", text, re.S)
    lines = meta.group(1).split("\n") if meta else []
    return [line for line in lines if re.match(r"(review-status|reviewed-sha256|last-reviewed):", line)]


def page_text() -> str:
    src = "docs/training/labs.md"
    out = ["---", 'title: "Labs"',
           'subtitle: "Every hands-on lab in the workbook: what it needs, where it runs, and a direct link"',
           'description: "Every developer workbook lab and learning path exercise in one place. Lab 1 runs on the kit\'s fixtures on a laptop, with no tenant; Lab 2 repeats it in a non-production tenant, instance or subscription. Each row links straight to the lab, with what it needs and the training module that uses it."',
           "doc-type: section-landing", 'fmw-eyebrow: "Training"', *review_fields(), "---",
           "<!-- Generated by scripts/generate_labs.py from the chapters and modules. Edit those, or the script, not this file. -->", "",
           "# Labs {.unnumbered}", "",
           "Every developer workbook chapter except the deployment runbooks ends with two labs, and every learning path module has an exercise built on them. The runbooks are not gates, so they have no labs of their own; three learning path modules still carry exercises for them: [Non-Person Identity, Module 11](non-person-identity/11-deploying-to-test-and-production.md), [Attribute-Driven Migration, Module 9](attribute-driven-migration/09-deploying-to-test-and-production.md) and [Provider Notices, Module 9](provider-notices/09-deploying-to-test-and-production.md).", "",
           "- **Lab 1: fixtures, no tenant.** It runs on a laptop against the kit's fictional fixtures. Nothing signs in, and nothing leaves the machine. Where a chapter shows a terminal image after a command, that image is the kit's real output on those fixtures.",
           "- **Lab 2.** It repeats the chapter in a non-production tenant, instance or subscription, never production. The authors haven't run the Lab 2s; each says so, and says how to back out what it built.", "",
           "Every lab opens with the list of every command it runs, in order: follow it top to bottom. *commands* in the tables below links straight to that list. Start with Lab 1. Each workbook's code downloads as one zip from its section below, or from [Downloads](../downloads.md#kits).", ""]
    for wb in WORKBOOKS:
        mods = modules(wb)
        by_ch = {}
        for m in mods:
            for c in m["chapters"]:
                by_ch.setdefault(c, []).append(m)
        index = f"{wb.docs}/index.md"
        out += [f"## {wb.title} {{#{wb.key}}}", ""]
        line = f"[The workbook]({rel(src, index)})"
        if wb.guide:
            line += f" · [its implementation guide]({rel(src, wb.guide)})"
        if wb.training:
            line += f" · [its learning path]({rel(src, wb.training + '/index.md')})"
        line += f" · [the code: {wb.zip}](../../downloads/{wb.zip})"
        out += [line, ""]
        head = "| Chapter | Lab 1, no tenant | You need | Lab 2 runs in |" + (" Module |" if mods else "")
        out += [head, "|" + "---|" * (5 if mods else 4)]
        for ch in wb.chapters:
            if "lab1" not in ch and "lab2" not in ch:
                continue
            title = re.sub(r"^Chapter \d+ — ", "", ch["title"])
            row = [f"[{ch['nn']} {title}]({rel(src, ch['path'])})",
                   (f"[Lab 1]({lab_link(src, ch, 'lab1')})" + (f" · [commands]({rel(src, ch['path'])}#lab-1-commands)" if ch.get("cmds1") else ""))
                   if "lab1" in ch else "—",
                   ch.get("lab1", ("", ""))[1].replace("|", "\\|") or "—",
                   (f"[{ch['lab2'][1] or 'Lab 2'}]({lab_link(src, ch, 'lab2')})" + (f" · [commands]({rel(src, ch['path'])}#lab-2-commands)" if ch.get("cmds2") else ""))
                   if "lab2" in ch else "—"]
            if mods:
                links = [f"[Module {m['n']}]({rel(src, m['path'])})" for m in by_ch.get(ch["nn"], [])]
                if ch["nn"] in wb.elsewhere:
                    label, page = wb.elsewhere[ch["nn"]]
                    links.append(f"[{label}]({rel(src, page)})")
                row.append(", ".join(links) or "—")
            out.append("| " + " | ".join(row) + " |")
        out += ["", f": {wb.title}: labs by chapter {{.striped .hover}}", ""]
    out += ["## Microsoft Automation learning path {#ms-automation}", "",
            "[The learning path](index.md#microsoft-automation-learning-path) · [the code: microsoft-automation-code.zip](../../downloads/microsoft-automation-code.zip)", "",
            "| Module | Lab 1, no tenant | Lab 2 |", "|---|---|---|"]
    for path in MS_AUTOMATION:
        md = (ROOT / path).read_text(encoding="utf-8")
        ex = {("lab1" if "Lab 1" in t else "lab2"): h for t, h, _ in headings(md) if "Lab 1" in t or "Lab 2" in t}
        name = front(md, "title").replace("Microsoft Automation, ", "")
        out.append(f"| [{name}]({rel(src, path)}) | " + " | ".join(
            f"[{k.replace('lab', 'Lab ')}]({rel(src, path)}#{ex[k]})" if k in ex else "—" for k in ("lab1", "lab2")) + " |")
    out += ["", ": Microsoft Automation: labs by module {.striped .hover}", "",
            "## The Zero Trust Assessment learning path {#zta}", "",
            "[The learning path](zero-trust-assessment/index.md) · [its implementation guide](../books/guides/zero-trust-assessment-implementation.md)"
            " · [the code: zta-results.zip](../../downloads/zta-results.zip)", "",
            "| Module | Lab 1, no tenant | Lab 2 |", "|---|---|---|"]
    for path in ZTA:
        md = (ROOT / path).read_text(encoding="utf-8")
        ex = {("lab1" if "Lab 1" in t else "lab2"): h for t, h, _ in headings(md) if "Lab 1" in t or "Lab 2" in t}
        name = front(md, "title")
        out.append(f"| [{name}]({rel(src, path)}) | " + " | ".join(
            f"[{k.replace('lab', 'Lab ')}]({rel(src, path)}#{ex[k]})" if k in ex else "—" for k in ("lab1", "lab2")) + " |")
    out += ["", ": The Zero Trust Assessment: labs by module {.striped .hover}", ""]
    for kp in KIT_PATHS:
        out += [f"## {kp.heading} {{#{kp.key}}}", "",
                f"[The learning path]({rel(src, kp.folder + '/index.md')}) · [{kp.guide_label}]({rel(src, kp.guide)})"
                f" · [the code: {kp.zip}](../../downloads/{kp.zip})", "",
                "| Module | Lab 1, no tenant | Lab 2 |", "|---|---|---|"]
        for path in kp.modules():
            md = (ROOT / path).read_text(encoding="utf-8")
            ex = {("lab1" if "Lab 1" in t else "lab2"): h for t, h, _ in headings(md) if "Lab 1" in t or "Lab 2" in t}
            out.append(f"| [{front(md, 'title')}]({rel(src, path)}) | " + " | ".join(
                f"[{k.replace('lab', 'Lab ')}]({rel(src, path)}#{ex[k]})" if k in ex else "—" for k in ("lab1", "lab2")) + " |")
        out += ["", f": {kp.caption}: labs by module {{.striped .hover}}", ""]
    out += ["## What Lab 2 needs {#lab-2-environments}", "",
            "Each Lab 2 names its environment and its prerequisites in its first paragraph. Use synthetic data like the kit's fixtures, and never production:", "",
            "- **A Microsoft Entra test tenant**, in the worldwide or GCC cloud for learning, with the licenses the lab names; then rehearse in the agency's own cloud, as [Book 16's two-step lab path](../books/b16-people/06-vendor-training-and-labs.md) describes. Some labs add an Azure test subscription or a disposable server.",
            "- **A ServiceNow Personal Developer Instance**, free to members of ServiceNow's Developer Program, or a sub-production instance. [Chapter 01 of Building Ticket-to-Machine](../project-plans/developer-workbooks/ticket-to-machine/01-the-loop-and-the-typed-task.md#lab-2-a-servicenow-developer-instance) says how its instance is reset.",
            "- **A SailPoint Identity Security Cloud sandbox tenant**, the agency's own.",
            "- **A test forest with an enterprise CA**, never production, and a domain-joined host with the RSAT Active Directory module, for the PKI and Certificates path; its Lab 2 steps on the CA run as the test CA's administrator. Module 7's Lab 2 uses the Entra test tenant above instead.",
            "- **A test Active Directory domain** on a Windows Server 2019 or later virtual machine you can checkpoint and throw away, with the DNS Server and DHCP Server roles, for the DNS, DHCP and IPAM labs. [Module 1](dns-dhcp-ipam/01-read-the-naming-plane.md#ddi-m1-lab-2) builds it. Module 4's Lab 2 reads an Azure test subscription, an AWS GovCloud (US) account and an OCI tenancy that aren't production instead.",
            "- **A Catalyst SD-WAN test fabric**: a Manager in a lab overlay or a vendor sandbox, with a read-only Manager account, for the SD-WAN governor path.", ""]
    return "\n".join(out)


def block(key: str, lines: list[str], title: str) -> str:
    return "\n".join([BEGIN.format(key), "", "::: {.callout-tip}", f"## {title}", *lines, ":::", "", END, "", ""])


def place(wb: Workbook, md: str) -> str:
    md = MARKED.sub("", md)
    src = wb.guide
    labs = f"{rel(src, 'docs/training/labs.md')}#{wb.key}"
    mods = modules(wb)
    by_nn = {c["nn"]: c for c in wb.chapters}
    placed = False
    # After each gate's Validate callout: that gate's labs and module, where a learning path maps them.
    # Guides name a gate "G1 Writers" or "Gate 1: schema and slots".
    if any(x["gates"] for x in mods):
        for m in reversed(list(re.finditer(r"^## Validate \(((?:G|Gate )(\d+)\b[^)]*)\)\n.*?^:::\n\n", md, re.S | re.M))):
            gate, num = m.group(1), m.group(2)
            these = [x for x in mods if num in x["gates"]]
            if not these:
                continue
            lines = []
            for x in these:
                for nn in x["chapters"]:
                    ch = by_nn.get(nn)
                    if not ch:
                        continue
                    t = re.sub(r"^Chapter \d+ — ", "", ch["title"])
                    if "lab1" in ch:
                        lines.append(f"- **On a laptop, no tenant:** [Chapter {nn}, Lab 1]({lab_link(src, ch, 'lab1')}) of *{t}*")
                    if "lab2" in ch:
                        lines.append(f"- **In {ch['lab2'][1] or 'a test tenant'}:** [Chapter {nn}, Lab 2]({lab_link(src, ch, 'lab2')})")
                lines.append(f"- **As training:** [Module {x['n']}: {x['title']}]({rel(src, x['path'])}), with a knowledge check")
            key = f"try-g{num}" if gate.startswith("Gate ") else f"try-{gate.split()[0].lower()}"
            # A guide that already has its own "Try it" callout after the Validate step (with the
            # fixture command) keeps it; the generated labs and module go after it, under another title.
            at, title = m.end(), f"Try it: {gate}"
            own = re.match(r"::: \{\.callout-tip\}\n## Try it:[^\n]*\n.*?^:::\n\n", md[at:], re.S | re.M)
            if own:
                at, title = at + own.end(), f"Labs and training: {gate}"
            md = md[:at] + block(key, lines, title) + md[at:]
            placed = True
    elif wb.gates:
        # No learning path: each gate's Try it box links its workbook chapter's two labs.
        for m in reversed(list(re.finditer(r"^## Validate \((G(\d+)\b[^)]*)\)\n.*?^:::\n\n", md, re.S | re.M))):
            gate, num = m.group(1), m.group(2)
            lines = []
            for nn in wb.gates.get(num, []):
                ch = by_nn.get(nn)
                if not ch:
                    continue
                t = re.sub(r"^Chapter \d+ — ", "", ch["title"])
                if "lab1" in ch:
                    lines.append(f"- **On a laptop, no tenant:** [Chapter {nn}, Lab 1]({lab_link(src, ch, 'lab1')}) of *{t}*")
                if "lab2" in ch:
                    lines.append(f"- **In {ch['lab2'][1] or 'a test tenant'}:** [Chapter {nn}, Lab 2]({lab_link(src, ch, 'lab2')})")
                mod = next((ROOT / wb.training).glob(f"{nn}-*.md"), None) if wb.training else None
                if mod:
                    path = f"{wb.training}/{mod.name}"
                    name = front(mod.read_text(encoding="utf-8"), "title").split(": ", 1)[-1]
                    lines.append(f"- **As training:** [Module {int(nn)}: {name}]({rel(src, path)}), with a knowledge check")
            if lines:
                md = md[:m.end()] + block(f"try-{gate.split()[0].lower()}", lines, f"Try it: {gate}") + md[m.end():]
                placed = True
    # After "How to read (or use) this guide": the guide's labs on the Labs page.
    h = next((p for t, _, p in headings(md) if t.startswith(("How to read this guide", "How to use this guide"))), None)
    if h is not None:
        nxt = HEADING.search(md, h + 3).start()
        lines = [f"Every gate's hands-on work is a lab in the developer workbook [*{wb.title}*]({rel(src, wb.docs + '/index.md')}): "
                 f"Lab 1 on a laptop with the kit's fixtures, Lab 2 in a non-production environment. "
                 f"[The Labs page]({labs}) lists them chapter by chapter, with what each needs and a direct link"
                 + ("; each gate below links its own labs." if placed else ".")]
        md = md[:nxt] + block("labs", lines, "Labs for this guide") + md[nxt:]
    return md


FENCE = re.compile(r"^( *)```(bash|powershell|cmd|kusto)\n(.*?)^\1```", re.S | re.M)
STEP = re.compile(r"^(\d+)\. (?:\*\*(.+?)\*\*)?", re.M)
SHELL = {"bash": "a POSIX shell (Git Bash on Windows)", "powershell": "PowerShell 7", "cmd": "Command Prompt",
         "kusto": "the Log Analytics workspace's Logs"}
NOTE = {"bash": "#", "powershell": "#", "cmd": "REM", "kusto": "//"}   # each language's comment marker


def lab_commands(md: str) -> str:
    """Each lab (and module exercise) opened by the list of every command it runs, in order, taken from
    its own command blocks, each under the step it belongs to."""
    md = MARKED.sub("", md)
    for text, hid, pos in reversed(headings(md)):
        lab = re.search(r"\bLab ([12])\b", text)
        if not lab:
            continue
        sec = section(md, pos)
        blocks = list(FENCE.finditer(sec))
        if not blocks:
            continue
        # The step each block sits in: the last "N. **Title**" line before it.
        parts: list[tuple[str, list[str]]] = []          # (language, lines), consecutive blocks merged
        for b in blocks:
            step = None
            for s in STEP.finditer(sec, 0, b.start()):
                step = s
            # A paragraph at the margin after the step's line ends the list: a block below it
            # (the cleanup after "Expected result") belongs to no step.
            after = bool(step and re.search(r"^[^\s\d]", sec[sec.find("\n", step.end()) + 1:b.start()], re.M))
            if after:
                step = None
            ind = b.group(1)
            code = "\n".join(l[len(ind):] if l.startswith(ind) else l for l in b.group(3).rstrip("\n").splitlines())
            lines = [code]
            if step:
                title = re.sub(r"[`*]", "", step.group(2) or "").rstrip(":., ")
                lines.insert(0, f"{NOTE[b.group(2)]} Step {step.group(1)}" + (f": {title}" if title else ""))
            elif after:
                lines.insert(0, f"{NOTE[b.group(2)]} After the steps")
            if parts and parts[-1][0] == b.group(2):
                parts[-1][1].extend([""] + lines)
            else:
                parts.append((b.group(2), lines))
        n = lab.group(1)
        body = []
        for lang, lines in parts:
            if len(parts) > 1:
                body += [f"In {SHELL[lang]}:", ""]
            body += [f"```{lang}", *lines, "```", ""]
        # After the lab's opening paragraph (or right after its heading if it opens with a step).
        at = pos + len(sec.split("\n", 1)[0]) + 2          # past the heading line and its blank line
        if not re.match(r"\d+\. ", md[at:]):
            at = md.index("\n\n", at) + 2                   # past the opening paragraph
        first_dir = re.search(r"[Ww]ork in `(examples/[\w/-]+)`", sec)
        intro = (f"Every command in this lab, in order{', from `' + first_dir.group(1) + '`' if first_dir else ''}. "
                 "Each step below says what it does and what to look for.")
        new = "\n".join([BEGIN.format(f"lab-{n}-commands"), "",
                         f'::: {{.callout-note #lab-{n}-commands collapse="false" title="Every command in Lab {n}"}}',
                         intro, "", *body, ":::", "", END, "", ""])
        md = md[:at] + new + md[at:]
    return md


MODULE_LAB_LINK = re.compile(r"\[([^\]]+)\]\(([^)#\s]+\.md)(#[^)\s]*)?\)")
STEP_NOTE = re.compile(r"^(?:#|REM|//) Step (\d+)", re.M)


def chapter_lab(chapter: Path, anchor: str, n: str) -> list[str] | None:
    """A chapter's Lab n as the lines of its generated command list, plus the steps that run no command
    (done in a portal or by hand), in order."""
    md = MARKED.sub("", chapter.read_bytes().decode("utf-8"))
    for text, hid, pos in headings(md):
        if not re.search(rf"\bLab {n}\b", text) or (anchor and hid != anchor):
            continue
        sec = section(md, pos)
        listed = lab_commands(md)                       # the chapter's own generated command list
        m = re.search(rf'::: \{{\.callout-note #lab-{n}-commands[^\n]*\}}\n[^\n]*\n\n(.*?)^:::\n', listed, re.S | re.M)
        body = m.group(1).rstrip("\n").split("\n") if m else []
        with_code = {int(s) for s in STEP_NOTE.findall("\n".join(body))}
        manual = [f"- **Step {s.group(1)}:** {re.sub(r'[`*]', '', s.group(2)).rstrip(':., ')}"
                  for s in STEP.finditer(sec) if s.group(2) and int(s.group(1)) not in with_code]
        if manual:
            body += ([""] if body else []) + [
                "Steps with no command, done in the portal or by hand as the chapter's step says:", "", *manual]
        return body
    return None


def module_labs(md: str, page: Path) -> str:
    """A training module whose Lab 1 or Lab 2 exercise points to developer workbook chapters' labs instead of
    writing the commands out gets each chapter's commands under it, generated from the chapter, so the module
    says exactly what to run (on the fixtures, or against the test environment) and can't drift from the chapter."""
    for text, hid, pos in reversed(headings(md)):
        lab = re.search(r"\bLab ([12])\b", text)
        if not lab or not text.startswith(("Unit", "Exercise")):
            continue
        n = lab.group(1)
        sec = section(md, pos)
        if FENCE.search(MARKED.sub("", sec)):
            continue                                     # the module writes its own commands
        parts, seen = [], set()
        for link in MODULE_LAB_LINK.finditer(sec):
            if not ((link.group(3) or "").startswith(f"#lab-{n}") or f"Lab {n}" in link.group(1)):
                continue
            target = f"{link.group(2)}{link.group(3) or ''}"
            chapter = (page.parent / link.group(2)).resolve()
            if target in seen or not chapter.exists():
                continue
            body = chapter_lab(chapter, (link.group(3) or "#")[1:], n)
            if body:
                seen.add(target)
                parts.append((link.group(1), target, body))
        if not parts and n == "2":
            # A deployment module's Lab 2 points to the chapter's live test stage rather than a "Lab 2" section.
            for link in MODULE_LAB_LINK.finditer(sec):
                anchor = (link.group(3) or "")[1:]
                chapter = (page.parent / link.group(2)).resolve()
                if not anchor.startswith("stage-") or not chapter.exists():
                    continue
                cmd = MARKED.sub("", chapter.read_bytes().decode("utf-8"))
                hit = next(((t, p) for t, h, p in headings(cmd) if h == anchor), None)
                if not hit:
                    continue
                stage = section(cmd, hit[1])
                head, rest = stage.split("\n", 1)
                listed = lab_commands(f"{head.split(' ', 1)[0]} Lab 2 {hit[0]}\n{rest}")
                m = re.search(r'::: \{\.callout-note #lab-2-commands[^\n]*\}\n[^\n]*\n\n(.*?)^:::\n', listed, re.S | re.M)
                if m:
                    parts.append((link.group(1), f"{link.group(2)}#{anchor}", m.group(1).rstrip("\n").split("\n")))
                    break
        if not parts:
            continue
        at = pos + len(sec.split("\n", 1)[0]) + 2
        at = md.index("\n\n", at) + 2
        if md[pos:at].rstrip().endswith("*") and not md[at:].startswith(("- ", "1. ")):
            at = md.index("\n\n", at) + 2
        where = "on the kit's fixtures, with no tenant" if n == "1" else "against your test environment, never production"
        title = "The Lab 1 commands, on the fixtures" if n == "1" else "The Lab 2 commands, against your test environment"
        out = []
        if len(parts) == 1:
            out += [f"Every command in [{parts[0][0]}]({parts[0][1]}), in order, {where}.", ""]
        else:
            out += [f"Every command in the {len(parts)} chapters' labs, chapter by chapter, in order, {where}.", ""]
        if n == "2":
            out += ["Replace each `<placeholder>` with your test environment's value.", ""]
        out += ["The chapter's steps say what each command does and what to look for.", ""]
        for i, (label, target, body) in enumerate(parts):
            if len(parts) > 1:
                out += [f"**[{label}]({target})**", ""]
            out += [*body, ""]
        new = "\n".join([BEGIN.format(f"module-lab-{n}-commands"), "",
                         f'::: {{.callout-note #module-lab-{n}-commands collapse="false" title="{title}"}}',
                         *out[:-1], ":::", "", END, "", ""])
        md = md[:at] + new + md[at:]
    return md


def lab_pages() -> list[Path]:
    pages = []
    for wb in WORKBOOKS:
        pages += sorted((ROOT / wb.docs).glob("[0-9][0-9]-*.md"))
        if wb.training:
            pages += sorted((ROOT / wb.training).glob("[0-9][0-9]-*.md"))
    return pages + [ROOT / p for p in MS_AUTOMATION + ZTA + [m for kp in KIT_PATHS for m in kp.modules()]]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    read_workbooks()
    files = {PAGE: page_text() + "\n"}
    for wb in WORKBOOKS:
        if wb.guide:
            p = ROOT / wb.guide
            files[p] = place(wb, p.read_bytes().decode("utf-8"))
    for p in lab_pages():
        files[p] = lab_commands(p.read_bytes().decode("utf-8"))
        if "docs/training/" in p.as_posix():
            files[p] = module_labs(files[p], p)
    stale = [p for p, t in files.items() if not p.exists() or p.read_bytes().decode("utf-8") != t]
    if a.check:
        if stale:
            print("labs: stale: " + ", ".join(p.relative_to(ROOT).as_posix() for p in stale), file=sys.stderr)
            return 1
        print("labs: current")
        return 0
    for p in stale:
        p.write_bytes(files[p].encode("utf-8"))
    print(f"labs: {len(stale)} file(s) written")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
