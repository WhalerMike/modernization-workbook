#!/usr/bin/env python3
"""Build the Permissions by Run page from the permission files the example kits keep.

Each kit that calls a live service declares every call it makes, the task (run) that makes it and the
least privilege it needs, in its own config file, and its tests fail when the code makes a call that
isn't declared. This script reads those files and writes docs/reference/permissions-by-run.md: for each
kit, each run, whether it only reads or also changes something, and what it needs. The page is
generated, so it can't drift from the kits; `--check` fails while it's out of date.

    python scripts/build_permissions.py            # write the page
    python scripts/build_permissions.py --check    # exit 1 if the page is stale

The files differ by kit, so each kit has a reader below. Kits that state their permissions only in
their README are listed at the end with a link, not copied.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "docs" / "reference" / "permissions-by-run.md"
GH = "https://github.com/WhalerMike/modernization-workbook/blob/main"
# A Microsoft Graph permission name, such as AuditLog.Read.All or Policy.ReadWrite.ConditionalAccess.
GRAPH = re.compile(r"^[A-Z][A-Za-z]+(?:-[A-Za-z]+)?(?:\.[A-Z][A-Za-z]+)+$")
WRITE_METHODS = {"POST", "PATCH", "PUT", "DELETE"}
# POSTs that read: a hunting query, a search, a token request, a Resource Graph query.
READING_POST = re.compile(r"runHuntingQuery|/search|/oauth/token|/token$|Microsoft\.ResourceGraph", re.I)
# The run name for a kit whose calls aren't split by task.
EVERY = "(every call)"

# Kits in the order the page lists them: folder, title, the guide or workbook that teaches it.
KITS = [
    ("non-person-identity", "Non-Person Identity",
     "docs/project-plans/developer-workbooks/non-person-identity/index.md"),
    ("privileged-access", "Privileged Access", "docs/project-plans/developer-workbooks/privileged-access/index.md"),
    ("hr-lifecycle", "HR-Driven Identity", "docs/project-plans/developer-workbooks/hr-driven-identity/index.md"),
    ("servicenow-sailpoint", "Ticket-to-Machine (ServiceNow and SailPoint)",
     "docs/project-plans/developer-workbooks/ticket-to-machine/index.md"),
    ("global-secure-access", "Global Secure Access", "docs/project-plans/developer-workbooks/global-secure-access/index.md"),
    ("defender-xdr", "Defender XDR", "docs/project-plans/developer-workbooks/defender-xdr/index.md"),
    ("azure-security", "Azure Security", "docs/project-plans/developer-workbooks/azure-security/index.md"),
    ("information-protection", "Information Protection",
     "docs/project-plans/developer-workbooks/information-protection/index.md"),
    ("provider-notices", "Provider Notices", "docs/project-plans/developer-workbooks/provider-notices/index.md"),
    ("sql-server-identity", "SQL Server Identity", "docs/project-plans/developer-workbooks/sql-server-identity/index.md"),
    ("help-desk-automation", "Help Desk Automation", "docs/project-plans/developer-workbooks/help-desk-automation/index.md"),
    ("ms-automation", "Microsoft Automation", "docs/training/ms-automation-foundations.md"),
]
# Which identity runs each kit's read runs on the platform host (WD-181). A run that changes something,
# needs a write permission to read, or needs an Active Directory delegation beyond default read isn't
# scheduled there; RUN_HOST overrides a single run.
GMSA = "`gmsa-fmpassess$`"
HOST = {
    "non-person-identity": f"{GMSA}; Graph and Azure as the Non-Person Identity reader app",
    "privileged-access": f"{GMSA}; Graph and Azure as the Privileged Access reader app",
    "hr-lifecycle": f"{GMSA}; Graph as the HR-Driven Identity reader app",
    "servicenow-sailpoint": f"{GMSA}; Graph as the Ticket-to-Machine reader app; ServiceNow and SailPoint as the kit's read clients",
    "global-secure-access": f"{GMSA}; Graph as the Global Secure Access reader app",
    "defender-xdr": f"{GMSA}; Graph as the Defender XDR reader app",
    "azure-security": f"{GMSA}; Azure as the Azure Security reader app, Reader at its scope",
    "information-protection": f"{GMSA}; Purview's modules as the Information Protection reader app",
    "provider-notices": "WD-179's server and reader app",
    "sql-server-identity": f"{GMSA}; Azure as the SQL Server Identity reader app",
    "help-desk-automation": f"{GMSA}; Graph and Azure as the help desk audit reader app",
    "ms-automation": "Not scheduled: a learning path's labs",
}
RUN_HOST = {
    ("non-person-identity", "inventory"): f"Weekly in the estate inventory: {GMSA} and its reader app (WD-180)",
    ("privileged-access", "inventory"): f"Weekly in the estate inventory: {GMSA} and its reader app (WD-180)",
    ("non-person-identity", "cloud-workload"): f"{GMSA}; AWS and Oracle Cloud sign-ins aren't decided (Chapter 13)",
    ("non-person-identity", "kerberos-apply"): "The pipeline's own gMSA, `gmsa-msapipe$`, after SailPoint approves (WD-163)",
    ("help-desk-automation", "typed-change-plan"): "On request, not scheduled: planned for each ticket before approval",
    ("help-desk-automation", "request-queue"): "The request pipeline (WD-182): `gmsa-fmphelpdesk$` and the request worker app, after SailPoint approves",
    ("help-desk-automation", "password-reset"): "The request pipeline (WD-182): `gmsa-fmphelpdesk$` and the request worker app, after SailPoint approves",
    ("help-desk-automation", "authenticator-reset"): "The request pipeline (WD-182): `gmsa-fmphelpdesk$` and the request worker app, after SailPoint approves",
    ("help-desk-automation", "account-create"): "The request pipeline (WD-182): `gmsa-fmphelpdesk$` and the request worker app, after SailPoint approves",
    ("help-desk-automation", "typed-change-apply"): "The request pipeline (WD-182): `gmsa-fmphelpdesk$` and the request worker app, after SailPoint approves",
    ("sql-server-identity", "audit-snapshot"): f"{GMSA}, through a Windows login on each instance with the read permissions",
}
BY_HAND = "Not scheduled: run by the person or pipeline the kit's chapter names"
# The chapter of the kit's workbook that teaches a run, for runs whose permission file doesn't give one (or
# gives a runbook): used by the production assessments section. Read from each kit's chapters and README.
TAUGHT = {
    "privileged-access": {"inventory": "01", "emergency-access": "02", "ca-read": "03", "pim-plan": "04",
                          "pim-alerts": "04", "pim-groups-read": "05", "azure-pim-read": "06",
                          "access-reviews-plan": "07", "access-reviews-evidence": "07", "pim-audit": "08"},
    "servicenow-sailpoint": {"drift": "06", "evidence": "07", "writer-check": "08", "deploy-check": "09"},
    "global-secure-access": {"decision": "01", "baseline": "02", "client": "03", "traffic": "04",
                             "internet-access": "07", "tls": "07", "compliant-network": "05",
                             "tenant-restrictions": "05", "private-access": "06", "telemetry": "08"},
    "defender-xdr": {"access": "01", "coverage": "02", "prevention": "03", "asr": "04", "exposure": "05",
                     "incidents": "05", "detections": "06", "signals": "07", "preflight": "09"},
    "azure-security": {"baseline": "01", "exposure": "02", "ddos": "03", "waf": "04", "edge": "05",
                       "firewall": "06", "private": "07", "policy": "08"},
    "information-protection": {"access": "01", "inventory": "03", "labels": "04", "protection": "05",
                               "autolabel": "06", "dlp": "06", "audit": "07", "drift": "08"},
    "sql-server-identity": {"audit-snapshot": "02", "arc-snapshot": "03"},
}
# The estate inventory (WD-180): one weekly run of four kits, under the assessment gMSA and one reader app
# holding the union of its kits' read rows, as examples/estate-inventory/README.md states.
ESTATE_RUNS = [("non-person-identity", "inventory"), ("privileged-access", "inventory")]


def on_host(r: "Run") -> str:
    if (r.kit, r.name) in RUN_HOST:
        return RUN_HOST[(r.kit, r.name)]
    if r.changes:
        return BY_HAND
    if any("ReadWrite" in g for g in r.graph):
        return "Not scheduled: its read needs a write permission, which no scheduled identity holds; run by hand"
    if any(o.lower().startswith("delegated") for o in r.other):
        return "Not scheduled: needs an Active Directory delegation beyond default read; run by hand with a time-bound one"
    return HOST.get(r.kit, "—")


# A sentence under a kit's table, for what its permission file doesn't cover.
KIT_NOTES = {
    "azure-security": "These are the checks, which only read. The kit's one write, the deployment runbook's assignment "
                      "of the security initiative in `DoNotEnforce` and its rollback (`deploy/New-AzsPolicyPlan.ps1 "
                      "-Apply`, `deploy/Invoke-AzsRollback.ps1`), isn't in its call file; the deployment chapter names "
                      "what it needs.",
    "sql-server-identity": "Lab 1 runs on fixtures and needs none of this. Grant the audit login these permissions, or "
                           "the `##MS_DefinitionReader##` server role, not `##MS_SecurityDefinitionReader##`, which "
                           "also shows SQL login password hashes. Which account each SQL Server service runs as is "
                           "read on the host, not here: see Runbook R02 under Kits that state their needs in prose.",
}
# Kits that state what they need only in prose: where to read it.
IN_PROSE = [
    ("start-kit", "Start Kit (forest, SQL Server estate, RADIUS and NPS)",
     "examples/start-kit/README.md", "the table of rights for each depth of discovery, including the SQL Server T-SQL pass"),
    ("estate-inventory", "Estate inventory (one scheduled run of four kits)", "examples/estate-inventory/README.md",
     "the run account and the reader app: the union of its kits' read rows on this page (WD-180)"),
    ("validation-kit", "Validation kit", "examples/validation-kit/README.md", "Requirements"),
    ("daily-checks-workbook", "Daily checks workbook", "examples/daily-checks-workbook/README.md", "Requirements"),
    ("zta-results", "Zero Trust Assessment results", "examples/zta-results/README.md",
     "reads the assessment's exported file only; the assessment itself needs the roles Microsoft's module names"),
    ("platform-host", "Platform host interface check", "examples/platform-host/README.md", "Requirements"),
    ("cisco-sdwan", "Cisco Catalyst SD-WAN evidence collector", "examples/cisco-sdwan/README.md",
     "a read-only SD-WAN Manager account"),
    ("dp-consolidation", "Distribution point consolidation", "examples/dp-consolidation/README.md", "Requirements"),
]
PROSE_PAGES = [
    ("Book 06, Runbook R02: the rights each depth of discovery needs",
     "docs/books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#the-rights-each-depth-of-discovery-needs"),
]


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def as_list(v) -> list[str]:
    if v is None or v is False:
        return []
    if isinstance(v, str):
        return [v]
    if isinstance(v, list):
        return [str(x) for x in v]
    return [str(v)]


class Run:
    def __init__(self, kit: str, name: str) -> None:
        self.kit, self.name = kit, name
        self.chapter = ""
        self.mode = ""           # "read" or "write" when the kit says; else worked out from the calls
        self.writes = False
        self.graph: set[str] = set()
        self.roles: set[str] = set()
        self.other: set[str] = set()
        self.calls = 0

    def needs(self, values, where: str = "other") -> None:
        for v in as_list(values):
            v = " ".join(v.split())
            if not v:
                continue
            if where == "roles":
                self.roles.add(v)
            elif GRAPH.match(v):
                self.graph.add(v)
            else:
                self.other.add(v)

    @property
    def changes(self) -> bool:
        return self.mode == "write" if self.mode else self.writes


def is_write(call: dict) -> bool:
    for key in ("writes", "write"):
        if key in call:
            return bool(call[key])
    method = str(call.get("method", "")).upper()
    where = " ".join(str(call.get(k, "")) for k in ("path", "uri", "id", "operation"))
    if call.get("kind") == "token":
        return False
    return method in WRITE_METHODS and not (method == "POST" and READING_POST.search(where))


def runs_for(kit: str) -> dict[str, Run]:
    folder = ROOT / "examples" / kit
    files = sorted((folder / "config").glob("calls*.json")) or sorted(folder.glob("graph-calls.json"))
    perm_file = folder / "config" / "permissions.json"
    runs: dict[str, Run] = {}

    def run(name: str) -> Run:
        return runs.setdefault(name, Run(kit, name))

    for f in files:
        data = load(f)
        tasks = data.get("tasks") or {}
        for name, t in tasks.items():
            r = run(name)
            if isinstance(t, str):
                continue
            r.chapter = str(t.get("chapter", r.chapter))
            r.mode = t.get("mode", r.mode)
            r.needs(t.get("graphPermissions"))
            r.needs(t.get("azureRoles"), "roles")
            r.needs(t.get("adRights"))
            for k in ("delegatedRole", "delegatedRoles", "pipelineIdentity"):
                r.needs(t.get(k), "roles")
            for k, label in (("awsAccess", "AWS"), ("ociAccess", "Oracle Cloud")):
                if t.get(k):
                    r.needs(f"{label}: {t[k]}")
        for call in data.get("calls", []):
            names = as_list(call.get("tasks")) or as_list(call.get("task")) or as_list(call.get("area")) or [EVERY]
            for name in names:
                r = run(name)
                r.calls += 1
                r.writes = r.writes or is_write(call)
                r.needs(call.get("permissions"))
                r.needs(call.get("permission"))
                r.needs(call.get("adRight"))
                for k in ("roles", "role", "azureRole", "delegatedRole", "delegatedRoles", "delegatedReadRole"):
                    r.needs(call.get(k), "roles")
    if perm_file.exists():
        for name, t in load(perm_file)["tasks"].items():
            r = run(name)
            r.mode = t.get("mode", r.mode)
            r.chapter = t.get("runbook", r.chapter)
            r.needs(t.get("azureRoles"), "roles")
            for version, perms in (t.get("sql") or {}).items():
                r.needs(f"SQL ({version}): " + ", ".join(perms))
            for never in t.get("never", []):
                r.needs(f"never `{never}`")
    return runs


def cell(values: set[str]) -> str:
    return "<br>".join(f"`{v}`" if GRAPH.match(v) else v.replace("|", "\\|") for v in sorted(values, key=str.lower)) or "—"


def link(path: str, here: str = "docs/reference") -> str:
    target, _, anchor = path.partition("#")
    rel = Path(*[".."] * len(Path(here).parts)) / target
    return rel.as_posix() + (f"#{anchor}" if anchor else "")


def taught_in(kit: str, guide: str, r: "Run") -> str:
    """A link to the chapter of the kit's workbook that teaches the run, or to the workbook."""
    folder = (ROOT / guide).parent
    number = TAUGHT.get(kit, {}).get(r.name) or (r.chapter if r.chapter.isdigit() else "")
    found = sorted(folder.glob(f"{number}-*.md")) if number and guide.endswith("index.md") else []
    if found:
        return f"[Chapter {number}]({link(found[0].relative_to(ROOT).as_posix())})"
    title = next(t for k, t, _ in KITS if k == kit)
    return f"[{title}]({link(guide)})"


def reader_app(kit: str, title: str) -> str:
    m = re.search(r"as the (.+? reader app)", HOST.get(kit, ""))
    return m.group(1) if m else f"{title} reader app"


def production_section() -> list[str]:
    """Every Reads only run, grouped by the identity that runs it in production under WD-181."""
    estate, by_app, by_hand = [], {}, []
    for kit, title, guide in KITS:
        for r in sorted(runs_for(kit).values(), key=lambda r: (TAUGHT.get(kit, {}).get(r.name) or r.chapter
                                                              or "99", r.name)):
            if r.changes:
                continue
            shown = "All the kit's calls" if r.name == EVERY else f"`{r.name}`"
            row = [title, shown, taught_in(kit, guide, r), cell(r.graph), cell(r.roles), cell(r.other), on_host(r)]
            if (kit, r.name) in ESTATE_RUNS:
                estate.append(row)
            elif on_host(r).startswith(("Not scheduled", "On request")):
                by_hand.append(row)
            else:
                by_app.setdefault((kit, title), []).append(row)
    head = ["| Kit | Run | Taught in | Microsoft Graph permissions | Roles | Other rights | Identity |",
            "|---|---|---|---|---|---|---|"]
    out = ["## Assessments you can run against production {#production-assessments}", "",
           "Every **Reads only** run on this page, grouped by the identity that runs it against the production "
           "forest, tenant and subscriptions under [WD-181](../about/decision-register.md#wd-181): the assessment "
           "gMSA, `gmsa-fmpassess$`, with default read in the forest, and for Microsoft Graph and Azure the reader "
           "app of the run's assessment set, which holds only that set's read rows and no write permission. A run "
           "here changes nothing. Its rights are the same as in its kit's table above; the chapter linked teaches it. "
           "**Changes** runs aren't listed here.", "",
           "### The estate inventory {#production-estate-inventory}", "",
           "One weekly scheduled run of four kits ([WD-180](../about/decision-register.md#wd-180), "
           f"[Book 10, Appendix B, D.6]({link('docs/books/b10-cloud-boundary/appendix-b-platform-host-interfaces.md#d.6-estate-inventory')})), "
           "under `gmsa-fmpassess$` at Tier A and one reader app granted the union of its cloud kits' read "
           f"permissions and Reader at the management group the settings name, as the [estate inventory README]"
           f"({GH}/examples/estate-inventory/README.md) states.", "", *head,
           f"| Start Kit | `Invoke-FMPStartKit.ps1` at Tier A: topology, OUs, accounts, SPNs, Group Policy, DNS "
           f"zones, AD CS templates, the DHCP and NPS server lists, SQL Server directory signals | "
           f"[Book 02, Chapter 08]({link('docs/books/b02-identity/08-assessing-the-forest.md#the-assessment-account')}) | "
           f"— | — | Tier A: default read (authenticated user), the [Start Kit README]({GH}/examples/start-kit/README.md)'s "
           f"rights table. Its Tier B additions are time-bound and run by hand, not on the schedule | "
           f"Weekly in the estate inventory: {GMSA} (WD-180) |"]
    out += ["| " + " | ".join(row) + " |" for row in estate]
    out += [f"| Validation kit | `Invoke-ValidationKit.ps1`: the read-only checks of the tracks the settings name | "
            f"[Validation kit README]({GH}/examples/validation-kit/README.md) | What `Get-VkRequiredScope` prints for "
            f"those tracks | — | — | Weekly in the estate inventory: {GMSA} and its reader app (WD-180) |", ""]
    for (kit, title), rows in by_app.items():
        app = reader_app(kit, title)
        out += [f"### {app[0].upper() + app[1:]} {{#production-{kit}}}", "", *head]
        out += ["| " + " | ".join(row) + " |" for row in rows]
        out.append("")
    out += ["### Reads only, but not under a reader app {#production-by-hand}", "",
            "These runs change nothing, but no scheduled read-only identity can run them: each row says why and "
            "who runs it.", "", *head]
    out += ["| " + " | ".join(row) + " |" for row in by_hand]
    out.append("")
    return out


def page() -> str:
    out = [
        "---",
        'title: "Permissions by Run"',
        'subtitle: "What each kit\'s runs need: Microsoft Graph permissions, roles and other rights, run by run"',
        'description: "Every run of the example kits that calls a live service, whether it only reads or also changes '
        'something, and the least privilege it needs, generated from the permission files the kits keep."',
        "doc-type: reference",
        "---",
        "<!-- Generated by scripts/build_permissions.py from each kit's permission files. "
        "Edit those, then run: python scripts/build_permissions.py -->",
        "",
        "Each kit that calls a live service keeps a file that lists every call it makes, the run that makes it "
        "and the least privilege it needs, and the kit's tests fail when its code makes a call the file doesn't "
        "declare. This page is built from those files, so it says what the code asks for. Grant a run only what "
        "its row lists.",
        "",
        "- **Reads only** runs can be scheduled under a service identity. **Changes** runs are dry runs unless "
        "they're given `-Apply` (or the kit's equivalent) and an approved plan, and most are run by a person with "
        "a delegated role; the kit's chapter says which.",
        "- **Microsoft Graph permissions** are the least-privileged permission Microsoft Learn names for each call. "
        "**Roles** are Microsoft Entra, Azure, Defender or Purview roles: the least-privileged role a person "
        "running the run needs, or an Azure role on the scope the kit names. **Other rights** are Active Directory, "
        "SQL Server, ServiceNow, SailPoint and other clouds' rights.",
        "- A run that combines several kits, such as the estate inventory, needs the union of their rows.",
        "- **On the platform host** says which identity runs it there, under [WD-181](../about/decision-register.md#wd-181): "
        "the assessment gMSA, `gmsa-fmpassess$`, with default read in the forest, and for Microsoft Graph and Azure a "
        "reader app per assessment set holding only that set's read rows. A gMSA can't sign in to Microsoft Entra ID, "
        "so the cloud reads need the app. A run that changes something, needs a write permission to read, or needs an "
        "Active Directory delegation beyond default read isn't scheduled; the help desk's approved requests run in "
        "WD-182's request pipeline under their own gMSA and write app.",
        "- A role or permission listed for a run is what the kit's file names. Some calls accept any one of "
        "several roles; the kit's chapter gives the choice.",
        "",
        "## At a glance {#at-a-glance}",
        "",
        "Every **Reads only** run, grouped by the identity that runs it against production, is under "
        "[Assessments you can run against production](#production-assessments).",
        "",
        "| Kit | Runs | Reads only | Changes | Microsoft Graph permissions (read runs) |",
        "|---|---|---|---|---|",
    ]
    sections = []
    for kit, title, guide in KITS:
        runs = runs_for(kit)
        if not runs:
            continue
        reads = [r for r in runs.values() if not r.changes]
        writes = [r for r in runs.values() if r.changes]
        read_graph = set().union(*(r.graph for r in reads)) if reads else set()
        anchor = kit
        out.append(f"| [{title}](#{anchor}) | {len(runs)} | {len(reads)} | {len(writes)} | {cell(read_graph)} |")
        files = sorted((ROOT / "examples" / kit / "config").glob("calls*.json")) or \
            sorted((ROOT / "examples" / kit).glob("graph-calls.json"))
        if (ROOT / "examples" / kit / "config" / "permissions.json").exists():
            files.append(ROOT / "examples" / kit / "config" / "permissions.json")
        src = ", ".join(f"[`{f.relative_to(ROOT).as_posix()}`]({GH}/{f.relative_to(ROOT).as_posix()})" for f in files)
        sec = [f"## {title} {{#{anchor}}}", "",
               f"From {src}. Taught in [{title}]({link(guide)}).", "",
               "| Run | Chapter or runbook | Reads or changes | Microsoft Graph permissions | Roles | Other rights "
               "| On the platform host (WD-181) |",
               "|---|---|---|---|---|---|---|"]
        order = sorted(runs.values(), key=lambda r: (r.chapter or "99", r.changes, r.name))
        for r in order:
            shown = "All the kit's calls" if r.name == EVERY else f"`{r.name}`"
            sec.append(f"| {shown} | {r.chapter or '—'} | {'Changes' if r.changes else 'Reads only'} | "
                       f"{cell(r.graph)} | {cell(r.roles)} | {cell(r.other)} | {on_host(r)} |")
        if kit in KIT_NOTES:
            sec += ["", KIT_NOTES[kit]]
        sections += sec + [""]
    out += ["", *sections, *production_section(),
            "## Kits that state their needs in prose {#in-prose}", "",
            "These kits don't keep a permission file; each states what it needs in the place linked.", "",
            "| Kit | Where it says what it needs |", "|---|---|"]
    for kit, title, readme, where in IN_PROSE:
        out.append(f"| {title} | [{readme.rsplit('/', 1)[0].split('/')[-1]} README]({GH}/{readme}): {where} |")
    for title, path in PROSE_PAGES:
        out.append(f"| SQL Server estate discovery | [{title}]({link(path)}) |")
    out.append("")
    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    text = page()
    current = PAGE.read_text(encoding="utf-8") if PAGE.exists() else ""
    if a.check:
        if current != text:
            print("docs/reference/permissions-by-run.md is out of date: run python scripts/build_permissions.py",
                  file=sys.stderr)
            return 1
        print("permissions page is current")
        return 0
    if current != text:
        PAGE.write_bytes(text.encode("utf-8"))
        print(f"wrote {PAGE.relative_to(ROOT).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
