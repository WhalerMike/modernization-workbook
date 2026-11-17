# Building Azure Security (developer workbook) — plan and chapter-writer brief

Workbook folder: `docs/project-plans/developer-workbooks/azure-security/`. Files and folders starting with `_` aren't rendered. This workbook is the code-first companion to the implementation guide `docs/books/guides/azure-security-implementation.md` (ten steps, draft, pending review) and its learning path `docs/training/azure-security/` (five modules). Its kit is `examples/azure-security` (new in this change). Started November 17, 2026, on the owner's request "Start the developer workbooks for XDR, GSA and Azure Security".

## Chapters

The guide's ten steps, grouped into eight chapters whose work the kit scripts and tests, then the deployment runbook (as *Building Privileged Access*, Chapter 09).

| File | Title | Guide steps | Kit: area and code | Training module |
|---|---|---|---|---|
| `01-the-landing-zone-baseline.md` | Chapter 01 — The Landing-Zone Baseline | 1 | `baseline`: `Get-AzsBaselineCheck`; the call list, invokers and run folder every chapter uses | 1 |
| `02-the-public-exposure-register.md` | Chapter 02 — The Public Exposure Register | 2 | `exposure`: `Get-AzsExposureCheck`, `register.json`/`.csv`, new and gone exposures, Defender for Cloud gaps | 1 |
| `03-ddos-protection.md` | Chapter 03 — DDoS Protection | 3 | `ddos`: `Get-AzsDdosCheck` (protection per public IP, logs, the `IfUnderDDoSAttack` alert) | 2 |
| `04-the-web-application-firewall.md` | Chapter 04 — The Web Application Firewall | 4 | `waf`: `Get-AzsWafCheck`, `plan-prevention.txt` | 2 |
| `05-front-door-application-gateway-and-the-origin.md` | Chapter 05 — Front Door, Application Gateway and the Origin | 5 | `edge`: `Get-AzsEdgeCheck` (origin lock-down, mixed groups, failover, TLS, classic) | 3 |
| `06-azure-firewall-and-egress.md` | Chapter 06 — Azure Firewall and Egress | 6 | `firewall`: `Get-AzsFirewallCheck`, `plan-deny.txt` | 3 |
| `07-private-link-dns-and-key-vault.md` | Chapter 07 — Private Link, DNS and Key Vault | 7, 8 | `private`: `Get-AzsPrivateCheck` | 4 |
| `08-policy-drift-and-evidence.md` | Chapter 08 — Policy, Drift and Evidence | 9, 10 | `policy`: `Get-AzsPolicyCheck`; `Invoke-AzsCompare.ps1`, `Invoke-AzsMetrics.ps1`, `Invoke-AzsEvidence.ps1`; `config/requirements.json` | 5 |
| `09-deploying-to-test-and-production.md` | Chapter 09 — Deploying to Test and Production | 1 to 10, in order | `deploy/`: settings template, `Test-AzsPreflight.ps1`, `Invoke-AzsScheduledRun.ps1`, `New-AzsPolicyPlan.ps1`, `Invoke-AzsRollback.ps1`, `AzsDeploy.psm1` | — |

## What the kit does

- **One call list.** `config/calls.json` declares 33 reads: 24 Azure Resource Graph queries (`az graph query --management-groups <mg-id>`) and 9 Resource Manager GETs (`az rest --method get`, `management.azure.com` only), each with its role (Reader) and Learn page. Calls whose query, path or properties weren't read on Learn are marked unverified, with what is missing; a live run refuses them without `-AllowUnverified`.
- **Eight checks.** One per area, each writing rows, findings (rules in `config/rules.json`, each with its source: a Learn statement with the guide's footnote key, or design guidance), a summary and the raw responses, with a manifest of SHA-256 hashes.
- **Plans, not writes.** Commands that would fix a finding go to `plan-prevention.txt` (WAF) and `plan-deny.txt` (firewall draft). The runbook's one write (the security initiative in `DoNotEnforce`) and its rollback are plans that apply only with `-Apply` and the approved SHA-256.
- **Drift, metrics, evidence.** Two runs compared by fingerprint; the guide's metrics computed where the kit can, marked where they come from exercise records or the workspace; each run recorded as a chained evidence record with the step's SP 800-53 controls and KSIs (`config/requirements.json`, the guide's table).
- **Fixtures.** A fictional Contoso estate (four subscriptions, a hub with Azure Firewall Premium and a DDoS plan, two spokes, two Front Door profiles and a classic one, two application gateways, three vaults, private DNS zones, endpoints and policy), read a week apart (`week1`, `week2`), written by `tests/fixtures/make_fixtures.py`.
- **Tests.** Pester 5: `tests` (core, the eight areas, drift and evidence) and `deploy/tests`.

## Overlap with existing material (searched origin/main, November 17, 2026)

| Existing | What it covers | How this workbook uses it |
|---|---|---|
| The guide, `azure-security-implementation.md` | The ten steps, commands, Validate checks, requirements and KSIs, RACI, metrics, dangers | Linked, not restated; each chapter names its step and reuses its footnoted Learn facts and the requirements table |
| The learning path, `docs/training/azure-security/` | Five modules with Lab 2 exercises | Each module gains a Lab 1 link to its chapters; nothing repeated |
| `examples/zta-results` | Zero Trust Assessment results, finding family `ddos-waf-exposure`, closure register | Chapter 08 links it: the register and the WAF and DDoS findings are that family's ready-for-closure evidence |
| `examples/drift-pipeline` | Compares validation kit runs (`ValidationManifest.json`) | Not reused: it refuses runs that aren't validation kit runs. The kit's comparison is its own, by finding fingerprint, as the provider notices and ZTA kits do; Chapter 08 says why |
| `examples/provider-notices` | Collector pattern, `az graph query` invoker, chained evidence | The module follows its layout and its evidence functions' design |
| `examples/privileged-access` | PIM for Azure roles (Chapter 06) | Linked from Chapter 01 (roles for this work) and Chapter 07 (Key Vault Administrator eligible) |
| `examples/validation-kit` | Read-only checks for other track guides | No Azure network or Key Vault checks there; not extended |
| `examples/evidence-maps` | A portfolio evidence map sample | Not relevant to this kit |
| Book 10 (landing zone), Book 11 Ch 10 (closure chain), Book 12 Ch 08 (posture) | Design of the boundary, the evidence contract, Defender for Cloud | Linked from Chapters 01, 02 and 08 |

No conflicting fact was found between the guide and this workbook. Items held open are in `_verification/research-gaps.md`.

## Rules

- Front matter: `doc-type: workbook-chapter`, `family: dw-azure-security`, `part: How`, `series-order: N`, `status: draft`, `review-status: pending`. Never approve a page.
- GCC Moderate with commercial Azure only. Never mention another government cloud for Microsoft; the guide's comparison names AWS GovCloud (US) as the program's AWS environment (WD-157) and keeps Oracle Cloud Infrastructure.
- Microsoft Learn first; reuse the guide's verified facts and footnote URLs; new reads dated November 17, 2026. What couldn't be verified stays *not yet specified* and goes in `research-gaps.md`.
- Claims: the kit's evidence *supports* a control; never "satisfies" or "meets".
- Labs: every step an exact command block run from `examples/azure-security`; Lab 1's output captured by `python scripts/kit_captures.py azs`; Lab 2 marked not run, with placeholders listed once and a back-out step. Chapter 09 has no Lab headings.
- Footnote keys `[^azsNN-key]` in Chapter NN, `[^azsi-key]` on the index.
- Fictional `contoso.example` values only; never an agency, a real tenant or a real address.
