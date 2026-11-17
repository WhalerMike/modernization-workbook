# Defender XDR engineering and operations as code

A Defender license is not a defended endpoint. This kit checks, gate by gate, that Microsoft Defender XDR is doing on Windows clients and Windows Server what the agency decided it should, and keeps the evidence. It is the code behind the [Defender XDR implementation guide](../../docs/books/guides/defender-xdr-implementation.md) and the developer workbook [*Building Defender XDR*](../../docs/project-plans/developer-workbooks/defender-xdr/index.md).

- **Read, through Microsoft Graph.** Incidents (`GET /security/incidents`), advanced hunting (`POST /security/runHuntingQuery`, the guide's own queries) and custom detection rules (`GET /security/rules/detectionRules`), on `graph.microsoft.com`, which GCC uses. On the device, the Defender and NetSecurity cmdlets Learn names (`Get-MpComputerStatus`, `Get-MpPreference`, `Get-NetFirewallProfile`), read-only.
- **Compare with the agency's plan.** Unified RBAC roles against the role design; onboarding and sensor health against the CM-8 inventory and the exception register; each device's prevention settings against its ring's stage; every Attack Surface Reduction rule through audit, warn and block, ring by ring, with the OMA-URI value for each ring now and next; exposed devices against owners; incidents against the severity table; detections against their validation windows; device group automation levels against the response ladder.
- **Evidence.** Every run writes a folder with a manifest. `Invoke-XdrEvidence.ps1` records it with its NIST SP 800-53 Rev 5 controls and FedRAMP 20x KSIs, the run's own check result, the SHA-256 of every file and of the record before it.
- **One write, gated.** Custom detections deploy from the repository through Graph's `detectionRules` API, from `deploy/Publish-XdrDetections.ps1`, only with `-Apply` and the plan's approved SHA-256. Every other change (an Intune policy, a device group's level, an exclusion) is for a person to make, under a change record, from what the kit prints.

Illustrative: tested against fictional fixtures (the `contoso.example` tenant) and stand-in runners, not against a live tenant. Windows clients and Windows Server only.

## Layout

```
Invoke-XdrAccess.ps1          G1  cloud and Graph host, a first read, the role export against config/roles.json, permissions per task
Get-XdrDeviceState.ps1        G2  this device's Defender state, read-only, as <device>.json (run on each sampled device)
Invoke-XdrCoverage.ps1        G2  onboarding and sensor health against the inventory and the exception register
Invoke-XdrPrevention.ps1      G3  device state against the ring's stage; audit and block events
Invoke-XdrAsr.ps1             G4  rule-by-ring matrix, readiness for the next stage, OMA-URI values, device check, expired exclusions
Invoke-XdrExposure.ps1        G5  vulnerabilities, exposed devices and owners, the Security Exposure Management disposition
Invoke-XdrIncidents.ps1       G6  incidents against the severity table
Invoke-XdrDetections.ps1      G7  validate, test and plan the detection repository
Invoke-XdrSignals.ps1         G8  the cross-source query as a priority list
Invoke-XdrAutomation.ps1      G9  device group levels against the ladder; attack disruption exclusions; Contain User sensor version
Invoke-XdrMetrics.ps1         G10 the guide's metrics from a month's run folders
Invoke-XdrMonthlyRun.ps1      G10 every check, the metrics and the evidence in one command
Invoke-XdrEvidence.ps1        record a run folder as evidence; -Check verifies the chain and a stage's go/no-go
config/                       calls (permission and Learn page per call), queries, ASR rules, roles, severity, ladder, prevention, coverage, requirements
templates/                    every input the agency fills: inventory, registers, plans, owners, exports, a detection rule and its test
copilot-prompts.md            prompts for Microsoft 365 Copilot Chat to fill and review the inputs at work
powershell/DefenderXdr/       the module (parts/*.ps1, one file per gate)
deploy/                       the runbook's scripts for test and production (see Deploy)
tests/                        Pester 5; fixtures under tests/fixtures (make_fixtures.py writes them)
```

## Permissions and clouds

`Get-XdrRequiredPermission` prints each call's least-privileged permission, the roles a delegated user also needs, and the Learn page. Read on Microsoft Learn on November 11 and 17, 2026.

| Call | Least privilege | GCC |
|---|---|---|
| `GET /security/incidents` | `SecurityIncident.Read.All`, and Security Reader, Global Reader, Security Operator or Security Administrator | Available on `graph.microsoft.com` |
| `POST /security/runHuntingQuery` | `ThreatHunting.Read.All` | Available on `graph.microsoft.com` |
| `GET /security/rules/detectionRules` | `CustomDetection.Read.All` | Not yet specified: Learn's page has no national-cloud table |
| `POST`, `PATCH /security/rules/detectionRules` | `CustomDetection.ReadWrite.All`, and Detection tuning (Manage) or Security Administrator | Not yet specified; the interim path is `detections.deployVia: portal` |

The settings file names the cloud (`gcc` or `global`); any other name throws, and there is no default. A live run refuses a Graph session in another environment or tenant. Security Exposure Management is available in Public Cloud only; for GCC the exposure check records it as not applicable, the disposition the [Zero Trust Assessment results kit](../zta-results/README.md) uses, with the guide's interim path.

## Lab 1: fixtures, no tenant

From `examples/defender-xdr`, in PowerShell 7:

```powershell
./Invoke-XdrMonthlyRun.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -RunRoot out/month -EvidencePath out/evidence -AsOf 2026-11-16T12:00:00Z
Get-Content out/month/metrics/metrics.md
./Invoke-XdrEvidence.ps1 -EvidencePath out/evidence -Check
```

The fixtures carry the faults each chapter's lab finds: 9 of 14 devices protected, three prevention drifts, an ASR plan with rules ready to move and rules held, a server that enforces nothing its plan says, two incidents outside the table, a detection with automated actions, and a device group off the ladder.

## Lab 2: a test tenant

```powershell
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All,CustomDetection.Read.All
./Invoke-XdrMonthlyRun.ps1 -SettingsPath <settings-file> -RunRoot out/test-month -EvidencePath out/test-evidence
```

`<settings-file>` is your copy of `deploy/settings.template.json` with every placeholder filled. Never production for a first run.

## Deploy

```
deploy/settings.template.json      one per environment; no secrets
deploy/Test-XdrPreflight.ps1       PF-01 settings and inputs; PF-02 Graph module; PF-03 session cloud and tenant; PF-04 granted scopes; PF-05 first read; PF-06 output root; PF-07 production needs the test stage's go/no-go
deploy/Invoke-XdrScheduledRun.ps1  the monthly run, recorded with the change record
deploy/Publish-XdrDetections.ps1   the detection plan through Graph: dry run, or -Apply with the approved SHA-256
deploy/Invoke-XdrRollback.ps1      plan the rollback (disable what the stage published; each ring's ASR value as it was), then apply it the same way
deploy/XdrDeploy.psm1              the module behind them
deploy/tests/                      Pester 5 and fixtures (fictional test and production environments)
```

`Invoke-XdrEvidence.ps1 -Check -Stage test` is the evidence half of the go/no-go: every step the stage needs (`config/requirements.json`) has a record whose files are intact and whose run's own check passed.

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 | KSIs | What the ISSO keeps |
|---|---|---|---|
| Access (G1) | AC-2, AC-6, AU-9 | KSI-IAM-ELP, KSI-MLA-ALA | `results.csv`, `permissions.csv` |
| Coverage (G2) | CM-8, SI-4 | KSI-PIY-GIV, KSI-MLA-OSM | `coverage.csv`, `tickets.csv`, `by-ring.csv` |
| Prevention (G3) | SI-3, SC-7, CM-6, SI-7 | KSI-SVC-ACM, KSI-CNA-EIS, KSI-MLA-EVC | `device-checks.csv`, `drift.csv`, `events.csv` |
| ASR (G4) | CM-7, CM-6, SI-3 | KSI-SVC-ACM, KSI-MLA-EVC | `matrix.csv`, `readiness.csv`, `device-checks.csv`, `oma-uri/` |
| Exposure (G5) | RA-5, SI-2, CM-8 | KSI-MLA-EVC, KSI-PIY-GIV | `exposed.csv`, `unowned.csv`, `exposure-management.json` |
| Incidents (G6) | IR-4, IR-5, IR-6, AU-6 | KSI-INR-RIR, KSI-INR-RPI, KSI-MLA-RVL | `incidents.csv`, `findings.csv` |
| Detections (G7) | SI-4, AU-6, CM-3 | KSI-MLA-OSM, KSI-MLA-LET, KSI-CMT-LMC | `validation.csv`, `tests.csv`, `plan.json`, `deployed-rules.json` |
| Signals (G8) | SI-4, AU-6, AC-2 | KSI-MLA-OSM, KSI-MLA-RVL | `priority.csv` |
| Automation (G9) | IR-4, SI-4 | KSI-INR-RIR | `groups.csv`, `exclusions.csv`, `sensor.csv` |
| Metrics (G10) | CA-7, AU-11, IR-3 | KSI-MLA-EVC, KSI-INR-AAR | `metrics.md`, `metrics.json` |
| Evidence | CA-7, AU-9 | KSI-MLA-EVC, KSI-MLA-OSM | `records/`, `records.csv`, `SHA256SUMS` |

The pairs are the guide's *Requirements and KSIs* table. The kit's evidence supports these controls; the agency's assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with them and doesn't report KSIs itself.

## Your inputs stay at work

The kit ships neutral templates and fictional examples. The agency's inventory, registers, plans, role export, device states, detections and evidence stay inside the agency's boundary: fill them at work, with [`copilot-prompts.md`](copilot-prompts.md) in Microsoft 365 Copilot Chat if that helps, and keep them on agency storage. Never put them in a public or personal repository.

## Run the tests

```powershell
Invoke-Pester -Path tests
Invoke-Pester -Path deploy/tests
```

PowerShell 7.1 or later and Pester 5. No module, tenant or network is needed. One test reads the Zero Trust Assessment results kit's taxonomy at `../zta-results/config/taxonomy.json`, which the download includes.
