# Azure security engineering as code

The read-only kit behind the [Azure Security Engineering implementation guide](../../docs/books/guides/azure-security-implementation.md) and its developer workbook, [*Building Azure Security*](../../docs/project-plans/developer-workbooks/azure-security/index.md). It reads an Azure estate through Azure Resource Graph and Azure Resource Manager GETs, checks it against the guide's steps, writes findings and the public exposure register, compares two runs, computes the guide's metrics, and records each run as hashed, chained evidence tagged with NIST SP 800-53 Rev 5 controls and FedRAMP 20x KSIs.

- **Read only.** Every call is declared in [`config/calls.json`](config/calls.json): a Resource Graph query (`az graph query`, scoped to the intermediate root management group) or a Resource Manager GET (`az rest --method get` on `management.azure.com`), each with its least-privileged role (Reader) and the Microsoft Learn page it comes from. Calls not yet verified on Learn are marked; a live run refuses them unless `-AllowUnverified`, and the workbook's Lab 2 confirms them.
- **Commercial Azure only.** Microsoft 365 GCC (Moderate) pairs with commercial Azure, so the kit has one cloud, `AzureCloud`, and no default: the settings file names it and a live run refuses an Azure CLI set to any other cloud or signed in to another tenant.
- **Plans, not changes.** Where a fix is a command (switch a WAF policy to Prevention, move a firewall policy to Deny through a draft), the check writes it to a plan file for a person to review and run. The only write the kit can send is the deployment runbook's assignment of the security initiative in `DoNotEnforce`, and its rollback, each only with `-Apply` and the plan's approved SHA-256.
- **Illustrative.** Tested against a fictional Contoso estate (`tests/fixtures`), not run against a live subscription.

## Layout

```
Invoke-AzsCheck.ps1            run one area's checks, or all of them: rows, findings, summary, raw/, manifest
Invoke-AzsCompare.ps1          compare two runs by finding fingerprint: new, fixed, still open
Invoke-AzsMetrics.ps1          the guide's metrics from one run
Invoke-AzsEvidence.ps1         record a run folder as evidence; -Check verifies the folder and a stage's coverage
config/calls.json              every call: kind, query or path and API version, role, Learn page, verified or not
config/rules.json              every rule a check can report: severity, guide step, title, source
config/baseline.json           the posture the checks compare against (design guidance; change in a reviewed PR)
config/requirements.json       each step's SP 800-53 controls and KSIs, each area's steps, and each stage's
powershell/AzureSecurity/      the module: calls and invokers, the eight checks, compare, metrics, evidence
deploy/                        the runbook's scripts for test and production (see Deploy)
templates/                     neutral worksheets to fill at work
copilot-prompts.md             prompts for Microsoft 365 Copilot Chat to review your settings and findings
tests/                         Pester 5: the core, the eight areas, drift and evidence
tests/fixtures/week1, week2    the fictional estate read a week apart (make_fixtures.py writes them)
tests/fixtures/settings.lab.json   Lab 1's settings
```

## Areas and rules

| Area | Guide step | What it checks | Rules |
|---|---|---|---|
| `baseline` | 1 | Hierarchy settings, the required initiatives at the intermediate root, diagnostic logs from every platform resource, Defender for Cloud plans | AZS-BL-01 to 06 |
| `exposure` | 2 | The register: every public IP, Front Door profile, application gateway and public PaaS resource, its owner, DDoS state and WAF; new and gone since last week; gaps against Defender for Cloud's export | AZS-EX-01 to 05 |
| `ddos` | 3 | Each public IP's protection (IP Protection, inherited from a protected network, unprotected, NAT gateway, unattached), logs and the `IfUnderDDoSAttack` alert | AZS-DD-01 to 06 |
| `waf` | 4 | Each WAF policy's mode, body inspection, Default Rule Set, bot rules and rate limit; a WAF and logs on every internet-facing gateway and Front Door profile | AZS-WAF-01 to 08 |
| `edge` | 5 | Classic Front Door; each origin's lock-down (Private Link, or the `AzureFrontDoor.Backend` tag with this profile's `X-Azure-FDID`); mixed origin groups; failover; TLS | AZS-EDGE-01 to 08 |
| `firewall` | 6 | Threat intelligence and IDPS in Deny, Premium, TLS inspection, logs; each workload subnet's declared default route to the firewall | AZS-FW-01 to 07 |
| `private` | 7, 8 | Central `privatelink` zones linked to the hub; zone groups; public access on resources with private endpoints; vaults on RBAC with purge protection, a closed firewall, a private endpoint and AuditEvent | AZS-PL-01 to 06, AZS-KV-01 to 06 |
| `policy` | 9 | The security initiative and its enforce-by date, `notScopes`, exemptions with no expiry, expired or due soon, compliance by assignment | AZS-POL-01 to 06 |

`config/rules.json` gives each rule's source: a Microsoft Learn statement (with the guide's footnote key) or the program's design guidance.

## Lab 1: fixtures, no subscription

From `examples/azure-security`, in PowerShell 7 with Pester 5:

```powershell
./Invoke-AzsCheck.ps1 -Area all -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/week1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/week1 -DefenderExposurePath tests/fixtures/defender-exposure.csv
./Invoke-AzsCheck.ps1 -Area all -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/week2 -AsOf 2026-11-16T12:00:00Z -OutputPath out/week2 -PreviousRegisterPath out/week1/exposure/register.json -DefenderExposurePath tests/fixtures/defender-exposure.csv
./Invoke-AzsCompare.ps1 -Before out/week1 -After out/week2 -OutputPath out/drift -AsOf 2026-11-16T12:00:00Z
./Invoke-AzsMetrics.ps1 -RunPath out/week2 -OutputPath out/metrics -AsOf 2026-11-16T12:00:00Z
./Invoke-AzsEvidence.ps1 -EvidencePath out/evidence -RunPath out/week2 -AsOf 2026-11-16T12:00:00Z
./Invoke-AzsEvidence.ps1 -EvidencePath out/evidence -Check
```

Each chapter of the workbook runs its own area's part of this, step by step, with the output it prints.

## Lab 2: a test subscription

Sign in to commercial Azure as a Reader on the test management group, with the Resource Graph extension, then run the same command without `-FixturePath`:

```powershell
az cloud set --name AzureCloud
az login --tenant <tenant-id>
az extension add --name resource-graph
./Invoke-AzsCheck.ps1 -Area all -SettingsPath <settings-file> -OutputPath <output-folder> -AllowUnverified
```

`<settings-file>` is your copy of `deploy/settings.template.json` with every placeholder filled. Keep `<output-folder>` outside any repository: the register is a map of the attack surface.

## Deploy

The workbook's last chapter takes the kit to a test environment, then production, with the same commands and one settings file per environment. Nothing in it has been run against a live subscription.

```
deploy/settings.template.json     the settings file: copy it per environment, fill every <placeholder>; no secrets
deploy/Test-AzsPreflight.ps1      PF-01 to PF-07: settings, no secret, output outside the repository, cloud and tenant, the reader's first query, unverified calls, and in production the test stage's evidence
deploy/Invoke-AzsScheduledRun.ps1 the weekly run: every area, the register against last week's, the comparison, the metrics, an evidence record
deploy/New-AzsPolicyPlan.ps1      plans the security initiative's assignment in DoNotEnforce; applies only with -Apply and the approved SHA-256
deploy/Invoke-AzsRollback.ps1     plans the rollback (DoNotEnforce or Delete); applies the same way
deploy/AzsDeploy.psm1             the module behind them
deploy/tests/                     Pester 5 and fixtures (fictional contoso.example test and production settings)
```

`Invoke-AzsEvidence.ps1 -Check -Stage test` is the evidence half of the go/no-go: every step the stage needs has a passing record from a live run (fixture records never count), the chain is unbroken and `SHA256SUMS` matches.

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 | KSIs | What the ISSO keeps |
|---|---|---|---|
| Baseline (Step 1) | CM-2, CM-6, CA-7 | KSI-SVC-ACM, KSI-MLA-EVC | `baseline/` run folder |
| Exposure register (Step 2) | CM-8, SC-7 | KSI-CNA-MAT | `register.json`, `register.csv`, inside the boundary |
| DDoS (Step 3) | SC-5, SI-4 | KSI-CNA-RVP, KSI-MLA-LET | `ddos/` run folder |
| WAF (Step 4) | SC-7, SI-10 | KSI-CNA-MAT, KSI-CNA-RVP | `waf/` run folder, `plan-prevention.txt` |
| Edge (Step 5) | SC-7, SC-8, CP-2 | KSI-CNA-MAT, KSI-SVC-SIN | `edge/` run folder |
| Firewall (Step 6) | SC-7, SC-7(5), SI-4 | KSI-CNA-RNT, KSI-CNA-ULN | `firewall/` run folder, `plan-deny.txt` |
| Private Link and DNS (Step 7) | SC-7, AC-4 | KSI-CNA-ULN | `private/` run folder |
| Key Vault (Step 8) | SC-12, SC-28, IA-5 | KSI-SVC-ASM, KSI-IAM-SNU | `private/` run folder |
| Policy (Step 9) | CM-2, CM-6, CA-7 | KSI-SVC-ACM, KSI-CNA-EIS, KSI-MLA-EVC | `policy/` run folder |
| Drift and metrics (Steps 9, 10) | CM-6, CA-7, AU-6 | KSI-SVC-ACM, KSI-MLA-EVC, KSI-MLA-OSM | `drift/`, `metrics/` |
| Evidence | CA-7, AU-9 | KSI-MLA-EVC, KSI-MLA-OSM | `records/`, `records.csv`, `SHA256SUMS` |
| Preflight, plan, rollback | AC-6, CM-6; CM-3, CM-4; CM-3, CP-2 | KSI-IAM-ELP, KSI-SVC-ACM; KSI-CMT-LMC, KSI-CMT-RVP; KSI-CMT-LMC, KSI-RPL-ARP | `results.json`, `plan.json` |

The step-to-control and control-to-KSI pairs are the guide's "Federal requirements and KSIs" table; the rest reuse pairs the provider notices kit and the privileged access workbook verified ([`config/requirements.json`](config/requirements.json)). The kit's evidence supports these controls; the agency's assessor decides whether a control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with what its providers report against them and doesn't report KSIs itself.

## Your estate stays at work

The kit ships fictional fixtures and neutral templates. Your settings files, register, findings and evidence describe your attack surface: run the kit at work, keep its output on agency storage, and never put it in a public or personal repository. [`copilot-prompts.md`](copilot-prompts.md) has prompts for Microsoft 365 Copilot Chat to help fill the settings and read the findings there.

## Run the tests

```powershell
Invoke-Pester -Path tests
Invoke-Pester -Path deploy/tests
```

40 tests in `tests` and 11 in `deploy/tests`; no subscription, no network, and no `az` started (a stand-in answers the live-mode tests).
