# SQL Server identity kit

> **Status: illustrative. Tested against fixtures of a fictional estate (`contoso.example`), not run against a live SQL Server, Active Directory or Azure subscription.**
> These scripts go with the developer workbook [*Building SQL Server Identity*](../../docs/project-plans/developer-workbooks/sql-server-identity/index.md), which runs them chapter by chapter, and with [Book 06 — Data Platform: SQL Server Identity](../../docs/books/b06-data-platform/index.md), whose chapters and runbooks they make executable. They aren't an endorsement of any product, and no agency has adopted them.

**Download:** [sql-server-identity-code.zip](https://whalermike.github.io/modernization-workbook/downloads/sql-server-identity-code.zip), rebuilt from this folder on every site deploy. The zip also holds a plain-text copy of every script, module, fixture and test, named with `.txt` added, for Microsoft 365 Copilot and mail systems that refuse `.ps1` files. Run the originals.

## What it does

| Script | Workbook chapter | Book 06 | Changes anything? | Writes |
|---|---|---|---|---|
| `Invoke-SqlEstate.ps1` | 01 The estate and the consolidation gate | Ch 04 to 06, R02 | No | `estate` |
| `Invoke-SqlAuthAudit.ps1` | 02 The authentication audit | Ch 07 to 08, R03 | No | `census`, `findings` |
| `Invoke-SqlArcCheck.ps1` | 03 Arc and the engine's identity | Ch 09 to 10, R04 | No | `arc` |
| `New-SqlLoginPlan.ps1`, `Test-SqlParallelRun.ps1` | 04 Entra logins and the parallel run | Ch 11 to 12, R05 | No (dry-run T-SQL) | `<instance>-create.sql`, `-cutover.sql`, `-rollback.sql`, `plan`; `parallel` |
| `Invoke-SqlGroupMap.ps1` | 05 Groups, roles and the perimeter | Ch 16 to 17, R07 | No | `groups` |
| `Invoke-SqlNtlmAudit.ps1` | 06 NTLM and the SPNs | Ch 14 to 15, R06 | No (writes the `setspn` fixes for review) | `ntlm`, `spn-fixes.txt` |
| `Invoke-SqlConnectionScan.ps1` | 07 The application chain | Ch 18 to 19, R08 | No | `connections` |
| `Invoke-SqlCertDependency.ps1` | 08 AD CS dependencies | Ch 22, R10 | No | `certificates` |
| `Invoke-SqlClosure.ps1`, `Compare-SqlAuditRun.ps1` | 09 Closure, drift and evidence | Ch 20 to 21, R09 | No | `closure`; `drift` |
| `deploy/Test-SqlPreflight.ps1` | 10 Deploying to test and production | R05, App B | No | `preflight` |
| `deploy/New-SqlDeploymentPlan.ps1` | 10 | R05 | No | `create.sql`, `cutover.sql`, `rollback.sql`, `plan.json`, `phases` |
| `deploy/Invoke-SqlDeploy.ps1` | 10 | R05 | Only with `-Apply` and the approved hash | `deploy` |
| `deploy/Invoke-SqlRollback.ps1` | 10 | R05 | Only with `-Apply` and the approved hash | `rollback` |
| `deploy/Invoke-SqlEvidence.ps1` | 10 | R09 | No | appends a record to the evidence chain |
| `Export-SqlAuditSnapshot.ps1` | Lab 2 of Chapters 02, 04, 06 and 09 | R03 | No (SELECT only) | an audit snapshot in the fixtures' shape |
| `Export-SqlArcSnapshot.ps1` | Lab 2 of Chapter 03 | R04 | No (Azure Resource Graph, Reader) | an Arc snapshot in the fixtures' shape |

Every run writes CSV and JSON and a `manifest.json`: the step, its mode, its as-of date, the NIST SP 800-53 Rev 5 controls and FedRAMP 20x KSIs it supports (from [`config/requirements.json`](config/requirements.json)), and the SHA-256 of every file it wrote, hashed with LF line endings so a hash approved on one platform matches on another. `Test-SqlManifest` re-hashes a run. `deploy/Invoke-SqlEvidence.ps1` seals a stage's runs into a hash chain and refuses a stage missing a required step, or one whose deployment was a dry run unless it's sealed as a `-Rehearsal`, which production preflight never accepts. KSIs are FedRAMP's indicators for cloud service providers: the agency lines its own evidence up with them and doesn't report them itself. Which step supports which control is the program's reading; the assessor decides.

`Invoke-SqlDeploy.ps1` and `Invoke-SqlRollback.ps1` are dry runs unless you pass `-Apply`. They refuse a plan file whose hash isn't the one you approved. The cutover disables the superseded users and SQL logins and denies `CONNECT SQL` to the superseded Windows groups, never dropping anything, so the rollback restores them at once.

## Requirements

- **Fixtures (Lab 1):** PowerShell 7.1 or later. Nothing else. Pester 5 for the tests.
- **Live (Lab 2 and the runbook):** the [SqlServer](https://learn.microsoft.com/powershell/module/sqlserver/) module, and a login with `VIEW SERVER STATE` (`VIEW SERVER PERFORMANCE STATE` and `VIEW SERVER SECURITY STATE` on SQL Server 2022 and later), `VIEW ANY DEFINITION` (`VIEW ANY SECURITY DEFINITION` on 2022 and later) and `CONNECT ANY DATABASE` to read, or an Entra token for such a principal; never `sysadmin` to read. For the Arc snapshot, `Az.Accounts` and `Az.ResourceGraph` signed in to `AzureCloud` with Reader on the subscriptions. For `-Apply`, an Entra account with `ALTER ANY LOGIN` (or `sysadmin`) on the test instance, and its access token.
- **Cloud:** a Microsoft 365 GCC (Moderate) tenant's Arc resources are in commercial Azure (`AzureCloud`), decided as [WD-028](../../docs/about/decision-register.md#wd-028). The Arc check refuses results from any other cloud.

## Run it on the fixtures

```powershell
./Invoke-SqlEstate.ps1 -EstatePath tests/fixtures/estate/estate.json -OutputPath out/estate
./Invoke-SqlAuthAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -OutputPath out/audit
./Invoke-SqlArcCheck.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -ArcPath tests/fixtures/arc/arc.json -OutputPath out/arc
./New-SqlLoginPlan.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Instance SQLPRD01 -MappingPath tests/fixtures/mapping/sqlprd01-mapping.csv -OutputPath out/logins
```

The fictional estate has eight instances: two SQL Server 2022 instances to retain, a 2025 consolidation target, a 2016 and a 2017 instance to consolidate (the 2017 one onto a dedicated target, because of a collation conflict), a vendor-locked 2019 failover cluster instance, a 2014 instance whose only database hasn't been touched in 912 days, and one known only by its SPN. Two audit snapshots, thirty days apart, show SQLPRD01 before and after its migration, and a new `sysadmin` Windows login on SQLPRD06 that the drift check catches. Every name, address and number is invented.

## Inputs you keep

| File | What it holds | Who fills it |
|---|---|---|
| The login mapping CSV (`WindowsLogin, EntraPrincipal, EntraType, Note`) | Each Windows or SQL login and the Entra group, user or application that replaces it | The DBA, with the identity team's reconciliation |
| The exception registry JSON | The break-glass group and each dated exception, with its approver | ISSO |
| Each application's `app.json` | Its driver and version, where it runs, and whether a vendor owns it | The application owner |
| `deploy/settings.<environment>.json` | One per environment, from `deploy/settings.template.json` | The change owner |

Keep the filled files inside your boundary.

## Test it

```powershell
Invoke-Pester -Path tests
```

90 tests: version mapping, every classification rule, the login census and the findings' severities, the Arc categories and the cloud check, idempotent and escaped T-SQL, disable-never-drop, unresolved logins, the parallel run's exit criteria, the four group patterns, every NTLM pattern and its `setspn` fix, masked passwords and the database-axis columns, certificate classes and windows, the five closure conditions with exceptions, drift, the manifest and tamper check, the evidence chain, and the runbook's hash refusal and production preflight.

## Known limits

- **The registry `LoginMode`** needs host access, so the live snapshot leaves it null and the mode-anomaly check only runs on what you supply.
- **Whether Entra authentication is configured** on an instance isn't read from Azure Resource Graph here; the Arc snapshot leaves it null until you confirm it in the portal, and the check treats null as not configured.
- **The database axis** (Book 06, Chapter 18) is inferred from the driver and `app.json`. Column D (no Entra path today) is the owner's call; the scan never sets it.
- **Local sessions** in the live snapshot are those whose `client_net_address` reads `<local machine>`; Learn doesn't document that value, so check it on your build before trusting the NTLM counts.
- **What `auth_scheme` an Entra connection reports** isn't documented; the kit reads only `NTLM` and `KERBEROS` rows.
- **Windows group logins** can't be disabled with `ALTER LOGIN` (Learn, error 15151), so the cutover denies them `CONNECT SQL` and the rollback grants it back. `DENY` doesn't bind members of `sysadmin`, so a group in that role leaves it first and rejoins on rollback; test both with a member on the test instance.
- **Database users** are mirrored with their role memberships only. Explicit permissions, default schemas and object ownership are read in Runbook R05's queries and mirrored by hand.

```
examples/sql-server-identity/
  README.md
  Invoke-SqlEstate.ps1, Invoke-SqlAuthAudit.ps1, Invoke-SqlArcCheck.ps1, New-SqlLoginPlan.ps1, Test-SqlParallelRun.ps1,
  Invoke-SqlGroupMap.ps1, Invoke-SqlNtlmAudit.ps1, Invoke-SqlConnectionScan.ps1, Invoke-SqlCertDependency.ps1,
  Invoke-SqlClosure.ps1, Compare-SqlAuditRun.ps1, Export-SqlAuditSnapshot.ps1, Export-SqlArcSnapshot.ps1
  deploy/                                    preflight, plan, deploy, rollback, evidence; settings template and examples
  powershell/SqlIdentity/SqlIdentity.psm1    every function: pure, read-only
  config/requirements.json                   each step's controls and KSIs, and what each stage must hold
  config/thresholds.json, config/drivers.json  the program's defaults and Book 06, Chapter 19's driver table
  tests/SqlIdentity.Tests.ps1                Pester 5
  tests/fixtures/                            the fictional estate, two audit runs, Arc, groups, SPNs, apps, certificates
```
