# Building Defender XDR (developer workbook) — plan and chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/defender-xdr/`. Files and folders starting with `_` aren't rendered. This workbook is the code-first companion to the [Defender XDR implementation guide](../../../books/guides/defender-xdr-implementation.md) (ten gates, draft, pending review) and its learning path `docs/training/defender-xdr/` (five modules). Written November 17, 2026.

## What already exists, and what this adds

Searched `origin/main` on November 17, 2026 by topic and key terms (Defender, ASR, `AttackSurfaceReductionRules`, `runHuntingQuery`, `detectionRules`, `SecurityIncident`, `DeviceInfo`, `SensorHealthState`, Exposure Management, device groups, automation levels) across `docs/books/guides/`, the books, the developer workbooks, the project plans, the deck sources and `examples/`.

| Exists | Where | How this workbook uses it |
|---|---|---|
| The ten gates, Validate commands, KQL, severity table, metrics, evidence catalog, requirements and KSIs | The implementation guide | The kit runs the guide's queries word for word (`config/queries.json`, pinned by a test) and its table pairs (`config/requirements.json`); chapters link the guide, not repeat it |
| ASR rules, their GUIDs, audit 30 days and warn 14 days | Book 05, Chapter 08, ES-005 | `config/asr-rules.json` holds the same fourteen rules with Learn's action types; the chapter links ES-005 for the values |
| Rule lifecycle, response ladder, device isolation, metric set | Book 12, Chapters 05, 06, 10, 11, 12 | Linked from Chapters 05 to 08 |
| The normalized result for an unavailable feature (Skipped-Not-Applicable) and the closure register | Book 11, Chapter 10; `examples/zta-results` | Chapter 05's Exposure Management disposition uses the same result name; a test reads the ZTA kit's taxonomy; the zip carries it |
| Arc servers missing the `MDE.Windows` extension | `examples/ms-automation` (`arc-extensions`) | Chapter 02 links it for the server side of onboarding; not rebuilt |
| Hashed, chained evidence with controls and KSIs | `examples/provider-notices`, `examples/zta-results` | The same record shape (`Write-XdrEvidence`, `Test-XdrEvidence`), with the run's own check result added so a go/no-go can't pass on a run that found something |
| PIM for the groups the Defender roles go to | `examples/privileged-access` | Chapter 01 links it; the kit only checks the role export names PIM-governed groups |
| Training labs (Lab 2 only, the guide's Validate commands) | `docs/training/defender-xdr/` | Kept; each module gains links to the chapters' Lab 1 ("link, don't repeat") |

No conflict found between the guide, Book 05 ES-005, Book 12 and the training path on the facts this workbook uses. One difference to note, not a conflict: the guide's availability table gives the Defender XDR API host for GCC as `api-gcc.security.microsoft.us`; this kit doesn't call that API at all. It reads through Microsoft Graph on `graph.microsoft.com`, which GCC uses.

## Chapters

| File | Title | Guide gates | Kit |
|---|---|---|---|
| `01-access-and-the-graph-read-path.md` | Chapter 01 — Access and the Graph Read Path | G1 | `Invoke-XdrAccess.ps1`; `config/roles.json`, `config/calls.json` |
| `02-onboarding-coverage-and-sensor-health.md` | Chapter 02 — Onboarding Coverage and Sensor Health | G2 | `Invoke-XdrCoverage.ps1`, `Get-XdrDeviceState.ps1`; `config/coverage.json` |
| `03-prevention-through-audit.md` | Chapter 03 — Prevention Through Audit | G3 | `Invoke-XdrPrevention.ps1`; `config/prevention.json` |
| `04-attack-surface-reduction-audit-warn-block.md` | Chapter 04 — Attack Surface Reduction: Audit, Warn, Block | G4 | `Invoke-XdrAsr.ps1`; `config/asr-rules.json` |
| `05-exposure-and-incidents.md` | Chapter 05 — Exposure and Incidents | G5, G6 | `Invoke-XdrExposure.ps1`, `Invoke-XdrIncidents.ps1`; `config/severity.json` |
| `06-detections-as-code.md` | Chapter 06 — Detections as Code | G7 | `Invoke-XdrDetections.ps1`; `deploy/Publish-XdrDetections.ps1` (Chapter 09 runs it) |
| `07-identity-signals-and-automation-boundaries.md` | Chapter 07 — Identity Signals and Automation Boundaries | G8, G9 | `Invoke-XdrSignals.ps1`, `Invoke-XdrAutomation.ps1`; `config/ladder.json` |
| `08-the-monthly-evidence-run.md` | Chapter 08 — The Monthly Evidence Run | G10 | `Invoke-XdrMonthlyRun.ps1`, `Invoke-XdrMetrics.ps1`, `Invoke-XdrEvidence.ps1`; `config/requirements.json` |
| `09-deploying-to-test-and-production.md` | Chapter 09 — Deploying to Test and Production | all | `deploy/` |

Learning path mapping: Module 1 (G1, G2) uses Chapters 01 and 02; Module 2 (G3, G4) Chapters 03 and 04; Module 3 (G5, G6) Chapter 05; Module 4 (G7, G8) Chapters 06 and 07; Module 5 (G9, G10) Chapters 07 and 08.

## The kit

`examples/defender-xdr`, PowerShell 7 and Pester 5, matching the provider notices kit's conventions: one module (`powershell/DefenderXdr`, a file per gate under `parts/`), entry scripts that each write a run folder with a manifest, a fixture invoker and a live invoker (Microsoft Graph PowerShell's `Invoke-MgGraphRequest`) behind one declared-call list, evidence records with controls, KSIs and the hash chain.

- **Reads only**, except one gated write: custom detections through Graph's `detectionRules` API from `deploy/Publish-XdrDetections.ps1` with `-Apply` and the plan's approved SHA-256, and its rollback. Every other change (Intune policies, device group levels, exclusions) is printed for a person to make under a change record.
- **Fixtures**: one fictional `contoso.example` estate on November 16, 2026, written by `tests/fixtures/make_fixtures.py`: fifteen inventory rows (one out of scope), Graph responses (incidents, hunting results in both PascalCase and camelCase, detection rules), eleven device-state files, the agency inputs (inventory, registers, plans, owners, exports, exercise record) and a three-rule detection repository. Each chapter's faults are in it.
- **GCC**: the settings file names `gcc` (Graph `Global`); there is no default. Security Exposure Management: not available in GCC, recorded as a disposition with the guide's interim path, no code that assumes it. Graph `detectionRules` GCC availability: not yet specified on Learn, so `detections.deployVia: portal` is the interim path (a portal sheet from the same files).
- **Tests**: `tests/` (Core, Checks, Evidence) and `deploy/tests/`.

## Every chapter has

In this chapter; goal and audience; *Start with Microsoft Learn's commands* (what the guide's Validate step and Learn give you, and what they leave to you, as a gap table whose rows the kit's tests pin); the code (what it reads, what it decides, the tests); an Illustrative code callout; Lab 1 on fixtures with no tenant (exact command blocks, captured output); Lab 2 in a test tenant with a back-out step, labeled not run; verified facts (Learn first, with access dates); federal requirements and evidence; dangers with the guard for each; a checklist; Continue the book; footnotes `[^xdrNN-key]` (`[^xdri-key]` on the index).

Chapter 09 is a runbook: no Microsoft sample section and no labs (no heading containing "Lab 1" or "Lab 2"). Its steps run the kit's `deploy/` scripts, each a command block, with fixture-mode output labeled with its date.

## Rules

- Front matter as the provider notices workbook's, `family: dw-defender-xdr`, `status: draft`, `review-status: pending`. Never approve.
- GCC Moderate only. Never name another government cloud. Never name an agency. Fictional `contoso.example` (initial domain `contosoexample.onmicrosoft.com`), documentation IP ranges.
- Learn first; claim language "supports"; KSIs as FedRAMP 20x indicators for cloud service providers.
- The story deck and the narrated chapter tours come in a second change, built from the kit's captures; one export run renders them later.
