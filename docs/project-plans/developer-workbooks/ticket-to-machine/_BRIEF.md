# Building Ticket-to-Machine (developer workbook) — chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/ticket-to-machine/`. Files and folders starting with `_` aren't rendered. The workbook index (`index.md`) holds the outline and the pieces table; write chapters with the file names below. This workbook is the code-first companion to Book 13, Chapter 10 and Appendix B, the example guide `docs/books/guides/ttm-servicenow-sailpoint.md` and the implementation example `docs/books/guides/snow-sailpoint-integration-kit.md`. It builds on `examples/servicenow-sailpoint` and nothing else.

| File | Title | Code |
|---|---|---|
| `01-the-loop-and-the-typed-task.md` | Chapter 01 — The Loop and the Typed Task | `clients/python/finding_contract.py`, `tests/python/test_finding_contract.py` |
| `02-servicenow-client-and-least-privilege.md` | Chapter 02 — The ServiceNow Client and Least Privilege | `config/calls.json`, `clients/python/kit_calls.py`, `tests/python/test_kit_calls.py` |
| `03-sailpoint-client-and-scopes.md` | Chapter 03 — The SailPoint Client and Its Scopes | the ISC and Graph rows of `config/calls.json`; `kit_calls.py --granted` |
| `04-drift-to-a-typed-task.md` | Chapter 04 — Drift to a Typed Task | `clients/python/workflow_payload.py`, `tests/fixtures/events/`, the multivalued change and de-duplication key fixes in the workflow and the Scripted REST script |
| `05-the-re-read-rule.md` | Chapter 05 — The Re-read Rule | `reread_verification.py` offline mode and the empty-intended-state guard, `tests/fixtures/reread/` |
| `06-drift-reconciliation.md` | Chapter 06 — Drift Reconciliation | `clients/python/drift_compare.py`, `tests/fixtures/hr_extract_day2.csv` |
| `07-evidence-records.md` | Chapter 07 — Evidence Records for Book 13 and the ISSO | `clients/python/evidence_export.py`, `tests/fixtures/evidence/` |
| `08-one-writer-per-attribute.md` | Chapter 08 — One Writer per Attribute | `clients/python/writer_check.py`, `tests/fixtures/writers/` |

## Every chapter has

In this chapter; goal and audience; the code (what exists in the kit, what the chapter adds, the tests); an Illustrative code callout; Lab 1 against fixtures with no tenant; Lab 2 in a ServiceNow Personal Developer Instance or a SailPoint sandbox, with a back-out step, marked as not run by the authors; the verified facts (endpoint, authentication, least-privileged role or scope, FedRAMP status) with footnotes; What couldn't be verified; Federal requirements and evidence (what the output proves, for which control at Moderate, who keeps it; link Book 13, Appendix A and the federal framework crosswalk rather than restating them); dangers with the guard for each; a checklist; Continue the book; footnotes. Run every lab command before writing its expected output.

## Rules

- Front matter as in Chapter 01, including `family: dw-ticket-to-machine` and `review-status: pending`. Never set `approved` yourself: the owner approves a page with `python scripts/source_watch/review_gate.py --approve <page>`. Any change to an approved page sends it back to the weekly review list.
- No "Book NN" in this workbook's own name or title. No narrated chapter tour until the chapter is approved.
- **Vendor documentation first.** ServiceNow facts from servicenow.com/docs; SailPoint facts from developer.sailpoint.com, documentation.sailpoint.com and SailPoint's published OpenAPI specification (`sailpoint-oss/api-specs`); Microsoft facts from Microsoft Learn, found with the Microsoft Learn MCP tools; authorization status from the FedRAMP Marketplace. Footnote each with "(read <date>)". Never invent an endpoint, a scope or a role; what a vendor's page doesn't settle goes under "What couldn't be verified" and on the kit README's verify list.
- **An example, not an endorsement.** The products are named to make the vendor-neutral design concrete. Say so where it matters.
- **The estate.** FedRAMP Moderate civilian: ServiceNow Government Community Cloud, SailPoint ISC, Microsoft 365 GCC (worldwide Graph endpoints). Federal requirements are civilian: NIST SP 800-53 Rev. 5 at Moderate, SP 800-63, FedRAMP, CISA and OMB.
- **Least privilege per call.** Every HTTP call a Python client makes is declared in `config/calls.json` with its task, its least privilege and the vendor page; `test_kit_calls.py` fails on an undeclared call.
- **Read-only by default.** Writes go only to ServiceNow, only with `--apply`, and nothing in the kit writes to Entra ID, Active Directory or ISC.
- Every new external claim cites the vendor's page or a workbook chapter with a read date. Footnote keys are unique in this workbook: `[^ttmNN-key]` in Chapter NN, `[^ttmi-key]` on the index.
- Label the program's own positions *Design guidance*, and mappings the vendor doesn't make *(inference)*.
- Never name an agency. Use `contoso.example`, `contoso` (ServiceNow instance), `example` (ISC tenant), `x_example_idkit` (scope) and the invented identifiers in the fixtures.
- Code changes come with tests in the kit's own suites (pytest under `tests/python`, node:test under `tests/servicenow`). New tools are Python; say where the PowerShell module has no counterpart.
- Keep LF line endings in new files; keep an existing file's line endings when you edit it.
- Each chapter keeps `_verification/<file-stem>.md`: the sources opened, a claims log and a carry-forward ledger. Open questions go in `_verification/research-gaps.md`, Chapter NN in rows (NN − 1) × 10 + 1 to NN × 10 − 1.
