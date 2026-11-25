# Information protection with Microsoft Purview, as code

A published label isn't protected data. This kit reads the agency's Microsoft Purview configuration, compares it with the agency's own plan, finds drift between two months, and keeps the evidence. It is the code behind the [information protection implementation guide](../../docs/books/guides/information-protection-implementation.md) and the developer workbook [*Building Information Protection*](../../docs/project-plans/developer-workbooks/information-protection/index.md), on top of [Book 20](../../docs/books/b20-information-protection/index.md).

- **Read only.** `Export-IpBaseline.ps1` runs the read cmdlets in `config/calls.json`, one shell at a time. These are the Security & Compliance PowerShell and Exchange Online PowerShell cmdlets from the ExchangeOnlineManagement module, and `Get-AipServiceConfiguration` from the AIPService module. It writes Book 20, Chapter 12's baseline files into a dated snapshot folder. The kit runs no `Set-`, `New-`, `Remove-`, `Enable-` or `Disable-` cmdlet. After each Exchange module connection, `Get-ConnectionInformation` checks that the session's tenant is the one the settings name.
- **Compared with the plan.** The checks read a snapshot and compare it with the agency's plan and registers:
  - every label with its encryption, header marking, rights holders and container settings;
  - every label policy with its labels, scope, exclusion group, defaults and mandatory labeling, in order;
  - Rights Management, where the super user feature should be off with no standing super users;
  - the IRM and message encryption settings, mail flow rules by stage, and co-authoring;
  - DLP and auto-labeling policies by stage (`simulation`, `notify`, `enforce`, `retired`), and every DLP exception against the exception register;
  - audit ingestion, retention and the synthetic events;
  - the class register against the tenant's sensitive information types;
  - the Purview role groups against the role register.
- **Drift.** `Invoke-IpDrift.ps1` compares two exports with Book 20, Chapter 12's drift signals (`config/drift.json`). A difference that a change ticket explains passes. One that no ticket explains fails, and the super user feature or audit turning off is P1.
- **Evidence.** Every run writes a folder with a manifest. `Invoke-IpEvidence.ps1` records it with:
  - its NIST SP 800-53 Rev 5 controls and FedRAMP KSIs;
  - the run's own check result;
  - the SHA-256 of every file and of the record before it.

Illustrative: tested against fictional fixtures (the `contoso.example` tenant) and stand-in runners, not against a live tenant. Microsoft 365 GCC (Moderate), with `commercial` for a commercial test tenant.

## Layout

```
Export-IpBaseline.ps1          Ch 02  the baseline export (-ListOnly prints the reads; -FixturePath reads a fixture tenant)
Invoke-IpAccess.ps1            Ch 01  settings, the snapshot's tenant, the role register; permissions.csv
Invoke-IpInventory.ps1         Ch 03  the class register against the SIT catalog and the content counts
Invoke-IpLabels.ps1            Ch 04  labels, label policies and container labels against the plan
Invoke-IpProtection.ps1        Ch 05  Rights Management, IRM, message encryption, mail flow rules, co-authoring
Invoke-IpDlp.ps1               Ch 06  DLP stages and the exception register
Invoke-IpAutoLabel.ps1         Ch 06  auto-labeling stages and custom sensitive information types
Search-IpSyntheticEvents.ps1   Ch 07  the audit search after the synthetic-event test
Invoke-IpAudit.ps1             Ch 07  audit on, retention, the synthetic events in time
Invoke-IpDrift.ps1             Ch 08  drift between two exports, explained or not by a change ticket
Invoke-IpMonthlyRun.ps1        Ch 08  every check, drift, the metrics and the evidence in one command
Invoke-IpEvidence.ps1          Ch 08  record a run folder as evidence; -Check verifies the chain and a stage's go/no-go
config/                        calls (cmdlet, shell, role and Learn page per read), drift signals, requirements
templates/                     the inputs the agency fills: the plan, the role, class and exception registers, the change list
powershell/InformationProtection/   the module (parts/*.ps1, one file per subject)
deploy/                        Ch 09  the runbook: settings template, preflight, the scheduled monthly run
tests/                         Pester 5; fixtures under tests/fixtures (make_fixtures.py writes them)
```

## Shells and clouds

| Shell | Module | GCC | PowerShell |
|---|---|---|---|
| Security & Compliance PowerShell | ExchangeOnlineManagement | `Connect-IPPSSession`: no extra parameters in Microsoft 365 or Microsoft 365 GCC | Module 3.10.0 and later need 7.6.0 or later |
| Exchange Online PowerShell | ExchangeOnlineManagement | `Connect-ExchangeOnline` | As above |
| Rights Management | AIPService | `Connect-AipService`; Learn names no GCC value, so the default is used | 7.4 or later with module 3.1.0.0 or later |

Read on Microsoft Learn on November 24, 2026. The settings file names the cloud (`gcc` or `commercial`). Any other name throws, and there is no default. `Get-IpRequiredPermission` lists each read's role and Learn page.

Two of the guide's Validate steps aren't in the kit:

- **SharePoint tenant settings.** In PowerShell 7, Learn gives the SharePoint module only through `-UseWindowsPowerShell`, which runs it in Windows PowerShell 5.1.
- **DSPM for AI.** It has no read cmdlet.

Run those by hand, as the guide gives them.

## Lab 1: fixtures, no tenant

From `examples/information-protection`, in PowerShell 7:

```powershell
./Invoke-IpMonthlyRun.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -BaselinePath tests/fixtures/snapshots/2026-10-24 -SyntheticPath tests/fixtures/synthetic/2026-11-24.json -RunRoot out/month -EvidencePath out/evidence -AsOf 2026-11-24T15:00:00Z
Get-Content out/month/metrics/metrics.md
./Invoke-IpEvidence.ps1 -EvidencePath out/evidence -Check
```

The fixtures carry the faults each chapter's lab finds:

- **Access and inventory:** a person holding a role the register doesn't name; a class with no owner, and one naming a sensitive information type the tenant doesn't have.
- **Labels:** a person added to a CUI Specified label's rights; guests allowed on the CUI Specified site label; an unplanned label; a label missing from the production policy.
- **Rights Management and mail:** the super user feature left on; social ID sign-in on; a partner rule still in audit.
- **DLP and auto-labeling:** a retired DLP policy back in simulation; an expired exception; an auto-labeling policy labeling while the plan has it in simulation.
- **Audit:** a synthetic event that arrived late.
- **Drift:** six changes no ticket explains.

## Lab 2: a test tenant

```powershell
./Export-IpBaseline.ps1 -SettingsPath <settings-file> -OutputPath out/test-snapshot
./Invoke-IpMonthlyRun.ps1 -SettingsPath <settings-file> -SnapshotPath out/test-snapshot -RunRoot out/test-month -EvidencePath out/test-evidence
```

`<settings-file>` is your copy of `deploy/settings.template.json` with every placeholder filled. Never use production for a first run.

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 | KSIs | What the ISSO keeps |
|---|---|---|---|
| Export (G12) | CM-3, CA-7 | KSI-SVC-ACM, KSI-CMT-LMC | the snapshot folder and its manifest |
| Access (G1, G10) | AC-5, AC-6 | KSI-IAM-ELP | `results.csv`, `role-groups.csv`, `permissions.csv` |
| Inventory (G1) | RA-2, CM-12, PM-5(1) | KSI-PIY-GIV | `inventory.csv` |
| Labels (G2 to G4) | AC-16, MP-3, AC-3, AC-21 | KSI-SVC-ACM, KSI-MLA-RVL | `labels.csv` |
| Protection (G5 to G7) | SC-12, SC-13, SC-28, SC-8, AC-5, AC-6 | KSI-SVC-SIN, KSI-SVC-ASM, KSI-IAM-JIT | `results.csv`, `mail-flow-rules.csv` |
| DLP (G8, G11) | AC-4, MP-7, SI-4, IR-4 | KSI-SVC-SIN, KSI-SVC-RUD, KSI-MLA-RVL | `exceptions.csv` |
| Auto-labeling (G9) | AC-16, CM-12 | KSI-SVC-ACM | `results.csv` |
| Audit (G10) | AU-2, AU-12, AU-6, AU-11, SI-4 | KSI-MLA-LET, KSI-MLA-OSM | `synthetic.csv`, `synthetic-search.json` |
| Drift, metrics (G12) | CM-3, CA-7 | KSI-SVC-ACM, KSI-CMT-LMC | `drift.csv`, `metrics.md` |
| Evidence | CA-7, CM-3 | KSI-SVC-ACM | `records/`, `records.csv`, `SHA256SUMS` |

The pairs are the guide's *Requirements and KSIs* table, from Book 20, Appendix A. The kit's evidence supports these controls; the agency's assessor decides whether a control is satisfied. KSIs are FedRAMP's indicators for cloud service providers. The agency lines its own evidence up with them and doesn't report KSIs itself.

## Your inputs stay at work

The kit ships neutral templates and fictional examples. Keep these inside the agency's boundary:

- the plan, the registers and the change list;
- every export and its evidence.

An export names groups, label rights and super users, so keep it with the same access as the system security plan. Fill the inputs at work, with [`copilot-prompts.md`](copilot-prompts.md) in Microsoft 365 Copilot Chat if that helps. Never put them in a public or personal repository.

## Run the tests

```powershell
Invoke-Pester -Path tests
Invoke-Pester -Path deploy/tests
```

You need PowerShell 7.1 or later and Pester 5. No module, tenant or network is needed. Each test carries the chapter's tag (`ch01` to `ch09`), so `Invoke-Pester -Path tests -TagFilter ch04` runs one chapter's tests.
