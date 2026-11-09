# Ticket-to-Machine task catalog pack

> **Status: illustrative.** A template and a checker, unit-tested; every example is fictional. The lanes, severities and response windows are program design from [Book 13, Appendix B](../../docs/books/b13-governance/appendix-b-ticket-to-machine-reference.md), not federal requirements.

## What this pack is

A workbook for listing your agency's day-to-day Ticket-to-Machine tasks: one row per task, with its lane, its trigger, its drift class and severity, the five clauses of the request chain, the controls it evidences and its owner. Formulas flag the rows that aren't ready. A small Python tool applies the same checks to a CSV export and turns each row into a sample ticket contract.

It is the work-side half of the guide [Building an internal Ticket-to-Machine task catalog](../../docs/books/guides/ttm-task-catalog.md).

## One way only: download it at work, nothing comes back

1. Download the pack at work, from the workbook's [Downloads](../../docs/downloads.md) page.
2. Fill it in inside your agency, with your agency's tools.
3. Nothing you write goes back to the public workbook. Don't open an issue or a pull request with your rows, and don't paste them anywhere outside your agency.

The pack itself is neutral. Every name in it (contoso.example, the service identities, the teams) is invented.

## Where to store the filled catalog

- Store it on agency OneDrive, SharePoint or Teams, or in a repository your agency hosts inside its boundary.
- Never store it in a personal repository, a public repository or a personal cloud drive.
- **A filled catalog maps how your systems are administered.** It names the identities that change things, the approvers and the gaps. Ask your ISSO how to label it, who may see it and where it must live.

## What's in it

```
examples/ttm-task-catalog/
  README.md               this file
  catalog_template.xlsx   the workbook (no macros): ReadMe, Tasks, Checks, Examples, Example checks, Controls, Lists
  catalog_template.csv    the Tasks columns, no rows
  examples.csv            25 fictional tasks, the same rows as the Examples sheet
  copilot-prompts.md      prompts for Microsoft 365 Copilot Chat and, in an agency-hosted repository, GitHub Copilot
  check_catalog.py        checks a CSV export and writes sample ticket contracts
  build_template.py       rebuilds the workbook and the two CSVs (needs openpyxl)
  catalog_schema.py       the columns, drop-down values, control mapping and checks, in one place
  examples_data.py        the worked examples
  tests/python/           pytest
```

The checker needs the integration kit's `finding_contract.py`, which the download includes at `servicenow-sailpoint/clients/python/`. The drift classes, default severities, priorities, response windows and re-read systems are read from that file, never retyped.

## The workbook

| Sheet | What it holds |
|---|---|
| ReadMe | How to use the workbook |
| Tasks | Your rows. 200 rows are ready, each with drop-downs and the response-window formula |
| Checks | One line per Tasks row: the seven checks, PASS or FIX, and a summary |
| Examples | 25 worked rows. EX-P1, EX-P2 and EX-P3 fail on purpose, for practice |
| Example checks | The same checks over the Examples sheet |
| Controls | Each task type with its suggested NIST SP 800-53 controls and KSIs, and the control-to-indicator table with its source |
| Lists | The drop-down values, the default severity per class, and the windows |

**The checks.** A row needs a fix when:

1. Owner, C2 Approver role or C4 Re-read check is blank.
2. The severity differs from the drift class's default and Notes is blank.
3. A class Book 13 sends to a person first (`missing_identity`, `orphan_account`, `unauthorized_write`) uses a machine lane.
4. C5 Evidence kept is blank.
5. No NIST SP 800-53 control is mapped.
6. High impact is yes, but Human approval before action isn't.
7. The executing identity is an AI agent, and it has no sponsor, or a high-impact or human-decision task has no human approval, or the re-read isn't by an independent checker.

**About the KSIs.** Key Security Indicators are FedRAMP 20x indicators for cloud service providers. An agency doesn't report KSIs. It lines its own evidence up with what its providers report against them ([Book 00, Appendix B](../../docs/books/b00-orientation/appendix-b-engagement-archetype.md)). The Controls sheet uses only indicator IDs the workbook already cites, mostly from [Book 13, Appendix A](../../docs/books/b13-governance/appendix-a-requirements-mapping.md); IA-4, AC-6(5) and CM-8(4) map to none.

## Steps

1. Read the Examples sheet and the Example checks sheet.
2. On the Tasks sheet, add one row per task. Use the drop-downs.
3. For each task, name the five clauses: who asks (C1), who approves (C2), what runs and as which identity (C3), the re-read check (C4) and the evidence kept (C5).
4. If an AI agent does the work, name its sponsor, have a person approve high-impact work before it runs, and have an independent checker do the re-read.
5. Copy controls and KSIs from the Controls sheet. Your ISSO decides the final controls.
6. Open the Checks sheet. Fix every row marked FIX.
7. Have each task's owner and your ISSO review the catalog, then set Status to Approved.
8. Optional: use [copilot-prompts.md](copilot-prompts.md) to draft rows and find gaps. Check every suggestion against the workbook and with your ISSO.

## Run check_catalog.py (if Python is allowed)

Ask first whether your agency allows Python on your workstation. The checker uses only the standard library and calls no network.

1. In Excel, open the Tasks sheet and choose **File > Save As > CSV UTF-8**. Save it as `catalog.csv` in the kit folder.
2. Open a terminal in the kit folder and run:

```
python check_catalog.py catalog.csv
```

3. To write each row's sample ticket contract and check it with the integration kit's contract:

```
python check_catalog.py catalog.csv --payloads payloads
python ../servicenow-sailpoint/clients/python/finding_contract.py --validate payloads/payloads.json
```

The payloads carry `SAMPLE-` identifiers. Replace them before any real use. Exit code 0 means every row passed, 1 means a row needs a fix, and 2 means the file isn't a catalog.

### Real output on examples.csv

`python check_catalog.py examples.csv`, run on November 2, 2026 (exit code 1, because of the three practice rows):

```
EX-01: PASS
    no typed finding (drift class none: a request or a routine event)
EX-02: PASS
    payload ok: attribute_drift P3 priority 3 window 24 hours system isc_identity
EX-03: PASS
    payload ok: stale_access P2 priority 2 window 1 hour system entra_user
EX-04: PASS
    no typed finding (drift class none: a request or a routine event)
EX-05: PASS
    payload ok: attribute_drift P3 priority 3 window 24 hours system entra_user
EX-06: PASS
    payload ok: stale_access P2 priority 2 window 1 hour system isc_account
EX-07: PASS
    payload ok: orphan_account P2 priority 2 window 1 hour system isc_account
EX-08: PASS
    payload ok: stale_access P2 priority 2 window 1 hour system entra_user
EX-09: PASS
    no typed finding (drift class none: a request or a routine event)
EX-10: PASS
    payload ok: credential_drift P1 priority 1 window Immediate system entra_user
EX-11: PASS
    payload ok: unauthorized_write P2 priority 2 window 1 hour system entra_user
    contract warning: intended_state names nothing a re-read can check (expected: Book 13 routes this class to a person, who sets it)
EX-12: PASS
    payload ok: attribute_drift P3 priority 3 window 24 hours system -
    contract warning: no system: the re-read client won't know where to read the subject
EX-13: PASS
    payload ok: orphan_account P2 priority 2 window 1 hour system -
    contract warning: no system: the re-read client won't know where to read the subject
EX-14: PASS
    payload ok: missing_identity P2 priority 2 window 1 hour system entra_user
    contract warning: intended_state names nothing a re-read can check (expected: Book 13 routes this class to a person, who sets it)
EX-15: PASS
    payload ok: schema_drift P3 priority 3 window 24 hours system -
    contract warning: no system: the re-read client won't know where to read the subject
EX-16: PASS
    payload ok: unauthorized_write P2 priority 2 window 1 hour system isc_account
    contract warning: intended_state names nothing a re-read can check (expected: Book 13 routes this class to a person, who sets it)
EX-17: PASS
    no typed finding (drift class none: a request or a routine event)
EX-18: PASS
    no typed finding (drift class none: a request or a routine event)
EX-19: PASS
    payload ok: missing_identity P2 priority 2 window 1 hour system entra_user
    contract warning: intended_state names nothing a re-read can check (expected: Book 13 routes this class to a person, who sets it)
EX-20: PASS
    payload ok: credential_drift P2 priority 2 window 1 hour system -
    contract warning: no system: the re-read client won't know where to read the subject
EX-21: PASS
    no typed finding (drift class none: a request or a routine event)
EX-22: PASS
    no typed finding (drift class none: a request or a routine event)
EX-P1: FIX - Human-decision class sent to a machine; No evidence named
    payload ok: missing_identity P2 priority 2 window 1 hour system entra_user
    contract warning: intended_state names nothing a re-read can check (expected: Book 13 routes this class to a person, who sets it)
EX-P2: FIX - Missing owner, approver or re-read; Severity differs, no note; No control mapped
    payload ok: stale_access P4 priority 4 window 72 hours system -
    contract warning: no system: the re-read client won't know where to read the subject
EX-P3: FIX - High impact, no human approval; AI agent without safeguards
    no typed finding (drift class none: a request or a routine event)
25 rows: 22 PASS, 3 FIX; 17 sample payloads, 17 accepted by finding_contract
```

The three FIX rows are the practice rows. The contract warnings are expected: a class a person decides first has no intended state until the person sets it, and a row whose re-read system is `other` names it in the row, not in the contract.

## Rebuild and test

The workbook and CSVs are built from `catalog_schema.py` and `examples_data.py`. After changing either, run:

```
pip install openpyxl
python build_template.py
python -m pytest -q tests/python
```

The tests check that the vocabulary matches `finding_contract.py`, the lanes match Book 13 Appendix B, the control-to-indicator rows match Book 13 Appendix A, every KSI is one the workbook cites, the committed files match a fresh build, and the checker and its seven rules behave as described.
