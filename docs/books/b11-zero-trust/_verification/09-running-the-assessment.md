# Verification — Chapter 09, Running the Assessment and Ingesting the Evidence

Writer W4. Sources: `docs/whitepapers/scubagear-integration-whitepaper.md` (v1.3) and `docs/operational-guides/zero-trust-assessment/index.md` (plus its short twin, which went to Ch10). All external sources opened October 21, 2026. ScubaGear docs read from GitHub at tag `v1.8.0` (and `main` where noted); Zero Trust Assessment read from the repository README, PowerShell guide and source files on `main`, release data from the GitHub API; federal documents as PDF text. Nothing was executed against a tenant.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | BOD 25-01 tenant inventory (name, owning agency/component), annual Q1 update | Before the first run | verified | BOD 25-01 required action 1 |
| 2 | ZTA coverage depends on connections, permissions, licenses; Infrastructure pillar only tagged subscriptions | Before the first run | verified | ZTA README |
| 3 | ScubaGear Windows-only because a Microsoft library is tied to PowerShell 5 | Before; registry | verified | ScubaGear dependencies.md (v1.8.0) |
| 4 | Source: "ScubaGear does not support PowerShell 7" | Registry | verified (wording kept narrower) | psgallery.md says PS 5 required because some SharePoint modules incompatible with PS 7; chapter cites the dependencies note |
| 5 | ZTA needs PowerShell 7; current source 7.6+; Windows for full coverage (SPO, AIP skipped elsewhere); dedicated VM recommended | Before; ZTA | verified (new) | ZTA PowerShell guide, Prerequisites |
| 6 | ZTA report/export sensitive; store securely, delete generated folder | Before | verified | Learn get-started |
| 7 | M-26-14: identity and privilege-change logs; top-level SOC availability; 6 months searchable, 1 year retrievable; 90 days from LRA for first Agency Logging Plan | Before | verified | M-26-14 Agency Logging Plan, Agency Actions, App. B |
| 8 | CISA published the LRA August 20, 2026 | Before | verified (new) | cisa.gov/logging |
| 9 | ScubaGear: OPA + Rego from baseline documents; CC0 | Running ScubaGear | verified | ScubaGear README |
| 10 | Current release v1.8.0, May 7, 2026 | Running ScubaGear | verified | GitHub releases API |
| 11 | v1.8.0 products: aad, defender, exo, powerplatform, sharepoint, teams | Running ScubaGear | verified | v1.8.0 parameters.md |
| 12 | `Install-Module -Name ScubaGear`; `Initialize-SCuBA` at v1.8.0, renamed `Install-ScubaDependencies` on main with alias; `Invoke-SCuBA -Version` | Code | verified (corrected: README on main shows the new name, not yet released) | v1.8.0 and main dependencies.md; v1.8.0 README |
| 13 | BOD submissions use config file and `-Organization`; others `-SilenceBODWarnings` | Code | verified | v1.8.0 README |
| 14 | `-M365Environment` values commercial, gcc, gcchigh, dod; `-ConfigFilePath`, `-OutPath` | Code | verified | v1.8.0 parameters.md |
| 15 | Config file: annotations, omissions with rationale and optional expiration, exclusions (e.g., emergency access) | Running ScubaGear | verified | v1.8.0 configuration.md |
| 16 | Output files incl. `ScubaResults_{UUID}.json`, `ScubaResults.csv`, `ActionPlan.csv` (failing SHALL only) | Outputs table | verified (source listed none of these) | v1.8.0 reports.md |
| 17 | JSON carries ID, requirement, result, criticality, details, original result, comments | Outputs | verified | tooloutputschema.md (main) |
| 18 | CyberScope: submit ScubaResults JSON without changing the file name | Outputs | verified | BOD 25-01 implementation guidance |
| 19 | Reporting: CISA monitoring integration or quarterly machine-readable; three routes | Reporting | verified | BOD 25-01; implementation guidance |
| 20 | ScubaConnect: cloud-native, Terraform, automates ScubaGear and ScubaGoggles across tenants | Reporting | verified | ScubaConnect README |
| 21 | Source: GWS baselines carried BOD 25-01 Requirement indicators "since 10 July 2026" | Google Workspace | corrected | Required Configurations page lists 70 GWS policies, all due 12/01/2026; the July 10 date could not be confirmed and was dropped |
| 22 | ScubaGoggles v1.0.0 July 24, 2026 | Google Workspace | verified | GitHub releases API |
| 23 | Program registry has no ScubaGoggles entry | Google Workspace | restated-as-design | Program fact from source |
| 24 | ZTA: hundreds of items, Entra/Intune/Azure networking/Purview guidance, SFI and ZT pillars | Running ZTA | verified | Learn ZTA overview |
| 25 | ZTA is a community project by Microsoft employees, not an official product, no Microsoft support | Running ZTA | verified (new) | ZTA README |
| 26 | Release 2.6.0 introduced redesigned report and seven default pillars; 3.1.0 on Oct 20, 2026 | Running ZTA | verified (new; source implied four pillars) | ZTA guide; GitHub releases API |
| 27 | `Install-PSResource`, `Connect-ZtAssessment -Tenant`, `Invoke-ZtAssessment -Path -DisableTelemetry` | Code | verified | ZTA README and guide; Learn shows `Install-Module` |
| 28 | Default output `.\ZeroTrustReport\ZeroTrustAssessmentReport.html` | Running ZTA | verified | Learn get-started |
| 29 | Connects separately to Graph, Azure, Exchange, S&C, SPO, AIP; Graph doesn't grant the others | Running ZTA | verified | ZTA guide |
| 30 | GCC uses worldwide Graph and Azure portal endpoints; `-Environment` Global/USGov/USGovDoD/China/Germany | Running ZTA | verified | Learn Graph national clouds; `Connect-ZtAssessment.ps1` |
| 31 | Telemetry carries tenant ID; `-DisableTelemetry` | Running ZTA | verified (new) | ZTA guide |
| 32 | May take >24 hours; don't stop it | Running ZTA | verified | Learn get-started |
| 33 | Outputs: report HTML, classic HTML, `zt-export\ZeroTrustAssessmentReport.json`, `ZeroTrustWorkshop.json`, export folder is assessment data | Outputs table | verified (corrected: source said JSON not needed and implied a single HTML) | ZTA README and guide |
| 34 | Source: "HTML embeds the full dataset" | ZTA ingestion | restated-as-design | Stated as the program toolkit's behavior; not documented by Microsoft |
| 35 | Statuses Passed, Failed, Investigate, Skipped, Planned, Error | Running ZTA | verified | ZTA source `Get-ZtTestResultStatus.ps1` |
| 36 | Missing prerequisites → skipped checks, "not evidence that the tenant meets a recommendation" | Running ZTA | verified | ZTA guide |
| 37 | Registry YAML excerpt and five properties; drift on registry | ScubaGear as adapter | restated-as-design | Program canon |
| 38 | `runner-class: github-hosted` | ScubaGear as adapter | restated-as-design (qualified) | Program reading added: a Windows runner the agency controls inside its boundary, given the sensitivity guidance |
| 39 | Source: results pass/fail/manual/not-applicable | Policy results to claims | corrected | ScubaGear results are Pass, Fail, Warning, N/A, Omitted, Incorrect Result, Error; SHALL/SHOULD criticality (tooloutputschema.md) |
| 40 | CISA maps SCuBA policies to SP 800-53 r5 FedRAMP High | Claims | verified | v1.8.0 mappings.md |
| 41 | OSCAL assessment results and POA&M model descriptions | Pipeline | verified | NIST OSCAL layers reference |
| 42 | Deterministic bundle, byte-identical; four downstream uses | Pipeline | restated-as-design | Program design |
| 43 | Source: BOD 25-01 "core logging intent satisfied directly by SCuBA findings; rapid detection intent not" | Pipeline | removed | No such intents found in the BOD 25-01 text; replaced with the bounded claim (configuration-conformance evidence only) |
| 44 | Gov cloud feature availability defined as differences from commercial service description | Boundary case | verified | Learn Office 365 GCC service description |
| 45 | Drift crosswalk table and severities | Drift | restated-as-design | Program drift standard; "AAL recorded in the COR" reworded as authentication assurance recorded for the population |
| 46 | Worked trace: MS.AAD.1.1v1 maps to IA-2(1); fails because a mail protocol permits basic auth | Worked trace | corrected | CISA maps MS.AAD.1.1v1 to CM-7 (aad.md, mapping CSV); the check reads Conditional Access policies (ExclusionType CapExclusions), so the illustrative failure is restated as no enabled CA policy blocking legacy auth for all users |
| 47 | MS.AAD.1.1v1 on BOD 25-01 mandatory list | Worked trace | verified | Required Configurations page |
| 48 | Source: `pip install fmp` from "the repository" | ZTA ingestion | corrected (safety) | PyPI `fmp` is an unrelated import-formatter package (v0.3.3); callout added to install from the program's repository only |
| 49 | Toolkit commands, wrapper parameters, env vars, FMP.ConfigTools, troubleshooting | ZTA ingestion | restated-as-design | Program toolkit; kept under the illustrative-code warning |
| 50 | Download SHA-256 for `Invoke-ZtDashboard.ps1` v1.0 | ZTA ingestion | removed | The hash referred to v1.0 while the table listed v1.1; chapter says to compare with the published hash instead |
| 51 | Honest limits | Honest limits | restated-as-design | Program |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| ScubaGear paper: Problem/solution/ask box | Ch09 opening prose; ask items to Ch10 (exceptions, enforcement pairing, drift to AO) | — |
| ScubaGear paper: Executive summary | Ch09 opening | — |
| §1 ScubaGear as a registered adapter (YAML, scope note on SCuBA beyond M365, runtime, five properties, drift on registry) | Ch09 "ScubaGear as a registered adapter"; scope note to "Google Workspace" (corrected dates) | — |
| §2 From OPA/Rego policies to canonical claims (three properties) | Ch09 "From policy results to claims" (result values corrected) | — |
| §3 Where ScubaGear lands in the evidence chain | Ch09 "The four-stage pipeline" and diagram | — |
| §4 The GCC-Moderate boundary case | Ch09 "The government-cloud boundary case" | Internal Boundary Impact Model link not carried (not a workbook page); Book 10 linked |
| §5 SCuBA in the Federal SSOT story: what ScubaGear sees | Ch09 pipeline section ("What ScubaGear sees") | — |
| §5 Federal mandate alignment (Evidence Act, FDS, etc.) | Bounded claim kept | Mandate catalog belongs to Book 02 Ch02; BOD 25-01 "intents" claim removed (unverifiable) |
| §5 Three-way GCC-Moderate conflict (B.1.1, GCC-BOUNDARY-3WAY-001) | Not carried | Internal compliance-series finding, not a workbook page; boundary handled in Book 10 |
| §5 Drift taxonomy cross-walk | Ch09 "Drift: what a finding can raise" | — |
| §5 Worked trace | Ch09 worked trace and diagram (corrected) | — |
| §5 Reference deployment | Not carried | Book 02 Ch11 covers it and isn't ScubaGear-specific |
| §6 Why "interval" matters | Ch09 "Interval evidence"; windowed conformance also in Ch10 | — |
| §7 Adoption posture | Ch10 (exceptions, enforcement pairing, drift to AO); step 1 in Ch09 running sections | — |
| §8 Honest limits | Ch09 "Honest limits" | — |
| §9 Conclusion | Ch09 epigraph and opening | — |
| Footnote on PR provenance (#390 etc.) | Not carried | Internal repository history |
| ZTA guide: intro and "What you get" | Ch10 dashboard table; Ch09 ingestion intro | — |
| ZTA guide: Controlled-data callout | Ch09 "Before the first run" (output handling) | — |
| ZTA guide: Prerequisites | Ch09 ingestion callout (corrected PyPI risk) | — |
| ZTA guide: Step 1 Run the assessment | Ch09 "Running the Zero Trust Assessment" (updated: PS 7.6, seven pillars, roles, telemetry) | — |
| ZTA guide: Step 2 Generate the dashboard; Step 3 Remediation playbook | Ch09 "Ingesting the Zero Trust Assessment" | — |
| ZTA guide: Reading the dashboard; boundary-scope warning | Ch10 | — |
| ZTA guide: Power BI quickstart | Ch10 | — |
| ZTA guide: Troubleshooting; Script parameters; Environment variables; FMP.ConfigTools | Ch09 ingestion tables and code | — |
| ZTA guide: Downloads (hash table) | Ch09 `Get-FileHash` step | Version/hash mismatch removed |

## Review round 1 (October 21, 2026)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| R1 | PowerShell version: was "Windows PowerShell 5.1" | Install | corrected | ScubaGear v1.8.0 dependencies page says "PowerShell 5" (no minor version), https://github.com/cisagov/ScubaGear/blob/v1.8.0/docs/prerequisites/dependencies.md (opened Oct 21, 2026); matches Ch05 |
| R2 | Tenant inventory update: was "first quarter of each fiscal year" | Scope | corrected | BOD 25-01 Required Actions: "Update this inventory in the first quarter annually", https://www.cisa.gov/news-events/directives/bod-25-01-implementing-secure-practices-cloud-services (opened Oct 21, 2026); matches Ch04 |

## Source watch, October 26, 2026

Re-checked after the weekly source watch (issue #160) reported a change in a cited source. Checked October 26, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| ScubaGear 2.0.0 is current; v2.0.0 README installs dependencies with `Install-ScubaDependencies`; this chapter's steps were checked at 1.8.0 and say so; the registry excerpt's `runtime-version: "1.8.0"` pin is left as the program's recorded pin | text, `c09-scuba-release`, `c09-scuba-deps` updated |
