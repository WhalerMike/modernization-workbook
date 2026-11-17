# Building Global Secure Access (developer workbook) — plan and chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/global-secure-access/`. Files and folders starting with `_` aren't rendered. This workbook is the code-first companion to the [Global Secure Access implementation guide](../../../books/guides/global-secure-access-implementation.md) (draft, review pending) and its learning path, `docs/training/global-secure-access/` (six modules). The guide's twelve steps follow the twelve network topics of the Zero Trust closure update (GSA-01 to GSA-12); its run order is 1, 2, 12 (logging), 3, 4, 7, 8, 6, 10, 5, 9, 11, 12 (evidence). Written November 17, 2026.

## Chapters

The guide's steps, grouped into chapters whose work can be scripted and tested, in the guide's run order, two chapters per learning path module, plus the runbook.

| File | Title | Guide steps | Kit area (`Invoke-GsaCheck.ps1 -Area`) | Module |
|---|---|---|---|---|
| `01-decision-licensing-and-gcc-availability.md` | Chapter 01 — Decision, Licensing and GCC Availability | 1 | `decision` (GSA-DEC-01 to -09), `config/availability.json` | 1 |
| `02-configuration-export-and-logs-first.md` | Chapter 02 — The Configuration Export and Logs First | 2, 12.1 | collection; `baseline` (GSA-ARC-01 to -04, GSA-LOG-01) | 1 |
| `03-the-client-and-its-coverage.md` | Chapter 03 — The Client and Its Coverage | 3 | `client` (GSA-CLI-01 to -07); `tools/Get-GsaClientState.ps1` | 2 |
| `04-microsoft-traffic-and-change-plans.md` | Chapter 04 — Microsoft Traffic and Change Plans | 4 | `traffic` (GSA-MS-01 to -04); `Invoke-GsaPlan.ps1` | 2 |
| `05-compliant-network-and-tenant-restrictions.md` | Chapter 05 — The Compliant Network and Tenant Restrictions | 7, 8 | `compliant-network` (GSA-CN-01 to -07), `tenant-restrictions` (GSA-TR-01 to -04); `-AllowEnforce` | 3 |
| `06-private-apps-and-admin-paths.md` | Chapter 06 — Private Applications and Administrative Paths | 6, 10 | `private-access` (GSA-PA-01 to -09) | 4 |
| `07-internet-access-and-tls-inspection.md` | Chapter 07 — Internet Access, QUIC and TLS Inspection | 5, 9 | `internet-access` (GSA-IA-01 to -06), `tls` (GSA-TLS-01 to -06) | 5 |
| `08-rings-metrics-and-evidence.md` | Chapter 08 — Rings, Metrics and the Evidence Package | 11, 12 | `telemetry` (GSA-LOG-01 to -03); `Invoke-GsaMetrics.ps1`; `Invoke-GsaEvidence.ps1`; rollback plan | 6 |
| `09-deploying-to-test-and-production.md` | Chapter 09 — Deploying to Test and Production | 11 (rings), all | `deploy/` (preflight PF-01 to -06, smoke test, rollback) | 6 |

## The kit: `examples/global-secure-access` (new)

PowerShell 7.1 and Pester 5, one module (`powershell/GlobalSecureAccess`), five entry scripts, `deploy/` and `tools/`. Read-only collectors in fixture mode (Lab 1) and live mode (Lab 2: Microsoft Graph PowerShell in a delegated session, the Azure CLI); every call in `config/calls.json` with Learn's least-privileged permission (read November 17, 2026), the beta flag and a verified flag; checks per area; plans and rollback plans as files applied only with `-Apply`, the plan's SHA-256 and a live delegated session; metrics and ring exit; hashed, chained evidence with controls and KSIs from `config/requirements.json` (the guide's requirements table). Fixtures: one fictional tenant, `contoso.example`, at its pilot (`tests/fixtures/pilot`, with defects) and two weeks later at ring 1 (`tests/fixtures/ring1`, fixed), written by `tests/fixtures/make_fixtures.py`. 70 Pester tests.

## What it reuses, and what it doesn't rebuild

- **The guide** owns the steps, commands, authority labels, RACI, evidence catalog, metrics and the requirements table. The kit's queries are the guide's KQL verbatim (`config/queries.json`); its Conditional Access files are the guide's policies (`config/policies`); its controls and KSIs are the guide's requirements table. Chapters link the guide's steps instead of restating them.
- **`examples/zta-results`** turns a Zero Trust Assessment export into the closure register; its `network-access` finding family already points at the guide. Chapter 08 hands that register this kit's evidence package as the "ready for closure" evidence; nothing in the ZTA kit is rebuilt.
- **`examples/privileged-access`** owns emergency access checks and PIM; Chapter 06 links it for the privileged groups behind the administrative apps. **`examples/validation-kit`** VK-CA-01 is the general Conditional Access read; this kit reads the same endpoint for its own NET- policies and links it. **`examples/drift-pipeline`** is the general drift pipeline; Chapter 08 links it for scheduled comparison and uses this kit's own hashed evidence for the network package.
- **Book 09, Chapter 05**, **Book 04, Chapter 07 and Appendix C**, **Book 12, Chapter 03** and **Book 11, Chapter 10** hold the design; chapters link them.

## GCC

Learn states availability for the product: Global Secure Access is available in GCC. Preview features are *not yet specified* (`config/availability.json`, the guide's table as of November 11, 2026). Interim paths: QUIC blocked with an Intune-delivered Windows Firewall rule instead of the cloud firewall for clients; client-based acquisition instead of the Explicit Forward Proxy; category and FQDN filtering instead of HTTP method filtering; per-app applications instead of custom Private Access profiles; joined or hybrid joined devices instead of registered devices. GCC Moderate only, commercial Azure only; nothing else appears.

## Rules

As the Privileged Access brief: front matter with `family: dw-global-secure-access`, `review-status: pending` (never approve); Learn first, with access dates; exact command blocks in every lab, placeholders listed once; Lab 1 captured by `scripts/kit_captures.py gsa`; Lab 2 labeled not run; a requirements table per chapter worded "supports"; footnote keys `[^gsaNN-key]`, `[^gsawi-key]` on the index; no agency names; `contoso.example` only; each chapter keeps `_verification/<file>.md`; open questions in `_verification/research-gaps.md`. Chapter 09 is a runbook with no Lab 1 or Lab 2 heading.
