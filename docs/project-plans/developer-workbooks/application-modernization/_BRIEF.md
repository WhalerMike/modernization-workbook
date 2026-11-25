# Building Application Modernization (developer workbook) — chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/application-modernization/`. Files starting with `_` aren't rendered. The workbook is the code-first companion to Book 18 (`docs/books/b18-application-modernization/`), its Chapter 08 and Appendix A, and the kit `examples/app-modernization`. Started November 24, 2026, from the Topics page's gap matrix ("Fill in the gap matrix").

| File | Title | Book 18 | Code |
|---|---|---|---|
| `01-the-contract-and-the-schema-the-service-owns.md` | Chapter 01 — The Contract and the Schema the Service Owns | Ch 03, 08 | `openapi.yaml`, `OpenApiContractTest`, `CaseApiTest`, `ApiExceptionHandler`, `V1__baseline.sql`, `LabRecordsTest` |
| `02-moving-the-data-the-transform-and-the-load.md` | Chapter 02 — Moving the Data: the Transform and the Load | Ch 04 | `migration/`: `MigrateCli`, `Transform`, `TargetStore`, `Migrator`; `LabReportsTest` |
| `03-proving-the-move.md` | Chapter 03 — Proving the Move | Ch 04 | `Validator`, `Canonical`, `ValidationReport`; `LabReportsTest` |
| `04-an-agent-that-only-proposes.md` | Chapter 04 — An Agent That Only Proposes | Ch 05 | `service/.../ai/`, `ProposalService`; `AgentGuardrailTest`, `TriageAndApprovalTest`, `LabRecordsTest` |
| `05-the-front-end-its-accessibility-check-and-the-containers.md` | Chapter 05 — The Front End, Its Accessibility Check and the Containers | Ch 03, 06 | `web/`: `App.test.jsx`, `a11y.test.jsx`, `fakeService.js`; `docker-compose.yml` |
| `06-the-applications-identity-redirect-uris-and-assignment.md` | Chapter 06 — The Application's Identity: Redirect URIs and Assignment | Appendix A, WP1 to WP5 | `AppModernization.psm1` (snapshot, WP4, WP5, rollback), `Invoke-AmIdentityApply.ps1` |
| `07-the-post-change-test-and-the-evidence-pack.md` | Chapter 07 — The Post-Change Test and the Evidence Pack | Appendix A, WP6 | `AppModernization.psm1` (WP6, evidence records), `config/requirements.json` |

## Link, don't repeat

Book 18 holds the why and the architecture; Appendix A holds the work packages' commands, rollback, exclusions and GCC table. WP1 to WP3 are built by *Building Non-Person Identity* (Chapters 02, 07 and 05): link them, never rebuild them. Book 13, Chapter 14 holds the governance record.

## Rules

- Front matter as in Chapter 01: `doc-type: workbook-chapter`, `family: dw-application-modernization`, `part: How`, `series-order: N`, `review-status: pending`. Never set `approved`: the owner approves with `python scripts/source_watch/review_gate.py --approve <page>`.
- Every chapter: In this chapter; goal and audience; start with the book and the standards (a gap table whose rows the kit's tests pin); the code; an Illustrative code callout; Lab 1 on fixtures, every step an exact `powershell` block run from `examples/app-modernization`, captured by `python scripts/kit_captures.py am`, ending with `Write-AmEvidenceRecord`; Lab 2 in a test environment, placeholders listed once, a back-out step, not run by the authors; verified facts; federal requirements and evidence; dangers; checklist; Continue the book; footnotes `[^amNN-key]`.
- Microsoft Learn first for every Microsoft fact; reuse Book 18's verified footnotes and say they are carried. Controls and KSIs only from `config/requirements.json`, whose pairs are ones the other kits use. "Supports", never "satisfies". KSIs are FedRAMP 20x indicators for cloud service providers.
- No agency names, no real tenant IDs or hosts: Learn's example GUIDs, `contoso.example`, fictional applicants.
- GCC Moderate only. No cloud comparison is made, so OCI doesn't come up; if one is added, it covers OCI.
- Lab 1 outputs must be stable: no timings, no hashes of files that hold timestamps (Surefire and Vitest reports), `-AsOf` on every evidence record.
