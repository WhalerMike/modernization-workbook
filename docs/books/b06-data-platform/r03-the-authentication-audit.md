---
title: "Runbook R03 — The Authentication Audit"
description: "The read-only foundation of the SQL Server transformation: the program's Get-SQLServerAuthAudit script (Spec3-D1.8) and the SPN inventory, SPN-collision, authentication-protocol, certificate-based-authentication and service-account-owner audits that feed it, with their parameters, prerequisites, output schemas, failure modes and known defects, and how to read Microsoft Entra ID readiness from the results."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 103
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R03 — The Authentication Audit

*The audit changes nothing, so run it first and run it often.*

::: {.callout-note}
## In this runbook
The audit script itself (prerequisites, parameters, invocations and output schema), how to read the readiness verdict it computes, the supporting discovery scripts and their run order, how the script degrades when something is missing, two input-format defects to work around, and how the audit output feeds continuous monitoring. Everything here is read-only.
:::

**Pairs with:** [Chapter 07 — The Authentication Audit](07-the-authentication-audit.md) and [Chapter 08 — Reading the Audit: Classification and Triage](08-reading-the-audit.md). Those chapters explain why you audit before you migrate; this runbook is the actual scripts, their parameters and their output.

## Start here: the audit is the foundation

Every later step (consolidation, Arc enablement, login migration, NTLM elimination) depends on knowing what you actually have. The audit produces that inventory. Run it first, keep its output under version control, and re-run it after every change to measure progress.

The scripts live in the program's repository under `tools/discovery/` as the `Spec*-D1.*` family, the Phase 1 deliverables of the program's discovery specifications. They are plain PowerShell, emit JSON and CSV, and need no write access to anything.

## The primary script: `Spec3-D1.8-Get-SQLServerAuthAudit.ps1`

The script discovers SQL Server instances and audits their authentication configuration for Microsoft Entra ID migration readiness.

### Prerequisites

- **The ActiveDirectory PowerShell module** (RSAT), for the live `MSSQLSvc` SPN query and for the orphaned-login check.
- **Remote CIM (WMI) access** to each host, to read the SQL Server services and their accounts from `Win32_Service`.
- **SQL Server permissions on each instance, only if `-QueryInstances` is set.** The script connects with Windows integrated authentication through the .NET SqlClient provider and reads `SERVERPROPERTY`, `sys.server_principals` and `sys.servers`. It doesn't need the SqlServer PowerShell module. Catalog views show only the metadata on securables the caller owns or has been granted some permission on,[^r03-linked-logins] so an under-privileged audit account returns a partial login list without any error. Grant the audit account the narrowest server-level read permissions that let it see every login, and confirm the login count against a known instance.

### Parameters

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `-OutputPath` | string | `.\output` | Directory for JSON and CSV output |
| `-D5InputFile` | string | — | Path to the `Spec1-D1.5` SPN-inventory JSON, used *instead of* the live SPN query (see the known defects below) |
| `-D1InputFile` | string | — | Path to a service-account scan JSON (`ServiceAccounts[]`), for cross-reference |
| `-TargetServers` | string[] | — | Explicit servers to add to the SPN-discovered set |
| `-DomainController` | string | — | Target a specific domain controller; automatic if omitted |
| `-SearchBase` | string | — | Optional Active Directory search base (DN) |
| `-TestConnectivity` | switch | off | Attempt a TCP connection to each discovered instance |
| `-QueryInstances` | switch | off | Connect to each instance to audit version, authentication mode, logins and linked servers (**needs SQL Server permissions**) |

### Usage

::: {.callout-warning}
## Illustrative, not tested against your estate
The invocations in this runbook are illustrative. They haven't been tested against a production forest or SQL Server estate. Review them and run them first in a test environment.
:::

```powershell
# 1. Discovery only (SPNs and host services, no SQL connection): the safest first pass.
./Spec3-D1.8-Get-SQLServerAuthAudit.ps1 -OutputPath .\output

# 2. Add hosts that have no MSSQLSvc SPN (for example SQL Server Express on an application server).
./Spec3-D1.8-Get-SQLServerAuthAudit.ps1 -TargetServers (Get-Content .\hosts.txt) -OutputPath .\output

# 3. Deep audit: connects to each instance for version, authentication mode, logins and linked servers.
./Spec3-D1.8-Get-SQLServerAuthAudit.ps1 -QueryInstances -TestConnectivity -OutputPath .\output
```

### Output schema

Three artifacts under `-OutputPath`, named `FMP_Spec3_D1.8_SQLServerAuthAudit_<domain>_<timestamp>`:

- **`….json`**: `{ Metadata, Summary, InstanceAudits[] }`. Each `InstanceAudits` entry carries `ServerName`, `InstanceName`, `Port`, `DiscoveryMethod`, `SPNRegistration`, `ServiceAccountName`, the `SQLServiceAccount`, `SQLAgentAccount`, `SSRSAccount`, `SSISAccount` and `SSASAccount` service identities, `AuthenticationMode`, `SQLVersion`, `SQLVersionMajor`, `SQLEdition`, `TCPReachable`, **`EntraIDReady`**, **`EntraIDBlockers[]`**, `MigrationTarget`, `MigrationComplexity`, and the `SQLLogins`, `WindowsLogins`, `OrphanedLogins` and `LinkedServers` arrays.
- **`…_instances.csv`**: the flattened per-instance inventory (authentication mode, service accounts, login counts, orphaned logins, linked servers, readiness).
- **`…_logins.csv`**: per-login detail, with columns `ServerName`, `InstanceName`, `LoginName`, `LoginType` (`SQL_LOGIN`, `WINDOWS_LOGIN` or `WINDOWS_GROUP`), `IsDisabled`, `IsSA`, `CreatedDate` and `PasswordLastSet` (SQL logins only). It is written only when `-QueryInstances` returned logins.

Version, authentication mode, the login arrays and the linked servers come from the instance connection. In a discovery-only run they read `Unknown` or are empty, and `EntraIDReady` is `false`.

### Reading the result: migration readiness

The script computes `MigrationTarget` and `EntraIDBlockers` for you:

- **SQL Server 2022 or later (major version 16 or higher)** gets "Enable Entra ID auth via Azure Arc." It's ready once Arc-connected and configured ([Runbook R04](r04-arc-deployment-and-managed-identity.md)). Microsoft Entra authentication for SQL Server on premises starts with SQL Server 2022.[^r03-entra-sql]
- **SQL Server 2019 and earlier** gets "Upgrade to SQL 2022 + Arc, then Entra ID auth." Version is the gate (Category 3 in [Chapter 07](07-the-authentication-audit.md)).
- **Blockers** flagged in `EntraIDBlockers`: mixed-mode authentication, an **enabled `sa` account**, orphaned logins and linked servers. Each is a remediation item before cutover; logins are handled in [Runbook R05](r05-login-migration-and-parallel-run.md).

The script doesn't detect the one hard platform blocker: Microsoft Entra authentication isn't supported on SQL Server failover cluster instances.[^r03-entra-sql] Flag clustered instances from your cluster inventory and treat them as Category 3 until they're re-platformed or excepted.

## The supporting discovery family

`Get-SQLServerAuthAudit` is most useful when cross-referenced against the rest of the Spec family. These are the ones that matter for SQL Server:

| Script | Spec | What it gives you | Used by |
|---|---|---|---|
| `Spec1-D1.5-Get-KerberosSPNInventory.ps1` | D1.5 | Every SPN in the domain, including `MSSQLSvc`, with duplicates, orphans and a per-service-class migration target | the [R02](r02-estate-discovery-and-consolidation-gate.md) inventory and [Runbook R06](r06-ntlm-detection-and-remediation.md) |
| `Spec3-D1.7-Get-SPNCollisionReport.ps1` | D1.7 | SPN collisions, which cause Kerberos authentication failures and push connections to NTLM[^r03-dup-spn] | [Runbook R06](r06-ntlm-detection-and-remediation.md) |
| `Spec1-D1.4-Get-AuthenticationProtocolAudit.ps1` | D1.4 | Delegation (unconstrained, constrained, resource-based) and NTLM dependency indicators on computer objects | [Runbook R06](r06-ntlm-detection-and-remediation.md) |
| `Spec3-D1.10-Get-CertBasedAuthAudit.ps1` | D1.10 | Certificate-based authentication dependencies across the directory: the PKI inventory, machine and user certificates, smart-card-required accounts ([Chapter 22](22-where-sql-server-touches-adcs.md)) | [Runbook R10](r10-certificate-discovery-for-adcs.md) |
| `Spec3-D1.12-New-ServiceAccountOwnerMatrix.ps1` | D1.12 | The owner-to-service-account matrix and migration waves, built from whichever D1.x outputs you pass it (the D1.8 audit via `-D8InputFile`) | program planning |

Run order for the SQL Server slice: **D1.5 and D1.7, then D1.8**, then `D1.12` to assign owners and waves across everything.

::: {.callout-important}
## Known defects in the input handoff
As reviewed for this edition, two script inputs don't match what their producers emit. Work around them until the program's scripts are reconciled:

- **`-D5InputFile` on D1.8 and D1.7.** Both scripts read the SPN inventory from an `SPNInventory` array (D1.8 also expects `Hostname`, `RawSPN` and `AccountName` fields), but `Spec1-D1.5` writes its records to a top-level `SPNs` array with `Host`, `SPN` and `SamAccountName` fields. Passing the file therefore yields no SPN-discovered instances, and because the file replaces the live query, the live query doesn't run either. Run D1.8 and D1.7 **without** `-D5InputFile`, so they query Active Directory directly, and use the D1.5 output for cross-checking.
- **`-D1InputFile` on D1.8.** The service-account scan it expects (`Spec3-D1.1`) isn't among the program's published discovery scripts yet. Leave the parameter unset, or supply a JSON file with a `ServiceAccounts[]` array keyed on `SamAccountName`.
:::

## Failure modes

The script degrades rather than crashing. Know what each state means:

- **ActiveDirectory module absent**: the SPN discovery is skipped, so only `-TargetServers` hosts are audited, and orphaned logins can't be checked. Install RSAT for full coverage.
- **Domain controller unreachable**: the SPN query returns nothing; pass `-DomainController` to target a reachable one.
- **CIM unreachable on a host**: service-account fields stay `Unknown` for that host; check WinRM and DCOM access and the host firewall.
- **SQL connection fails under `-QueryInstances`**: the instance is recorded with `AuthenticationMode` set to `Query Failed` and an empty login inventory, rather than aborting the run. Check SQL Server permissions and the firewall.
- **TCP timeout under `-TestConnectivity`**: `TCPReachable` is `Timeout` (a three-second budget), as opposed to `Yes` or `No`. An instance that answers `No` is skipped by `-QueryInstances`.

## Feeding continuous-monitoring closure

The audit JSON is the raw input for the continuous-monitoring evidence that [Chapter 20](20-the-closure-condition.md) and [Chapter 21](21-what-done-looks-like.md) describe and [Runbook R09](r09-continuous-monitoring-and-closure.md) automates. Re-running it on a schedule turns "did we eliminate NTLM, mixed mode and the enabled `sa` account" into a live artifact you can compare run to run, rather than a one-time claim. Wire the JSON into the program's continuous-monitoring ingestion (CCM-BIR in the program's tooling) the same way the rest of the discovery pipeline feeds it.

## Safety

This entire runbook is read-only. The discovery-only invocation (example 1) opens no SQL Server connection; it reads Active Directory and host service configuration. `-QueryInstances` runs read-only inventory queries. Nothing here changes a production security posture; that begins in [Runbook R04](r04-arc-deployment-and-managed-identity.md) (Arc) and [Runbook R05](r05-login-migration-and-parallel-run.md) (logins).

::: {.callout-tip}
## Continue the book
[← Previous: Runbook R02 — Estate Discovery & the Consolidation Gate](r02-estate-discovery-and-consolidation-gate.md) · [Book index](index.md) · [Next: Runbook R04 — Arc Deployment & the Managed Identity →](r04-arc-deployment-and-managed-identity.md)
:::

[^r03-linked-logins]: Microsoft Learn, "sys.linked_logins (Transact-SQL)," permissions (metadata visibility), <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-linked-logins-transact-sql> (accessed Oct 20, 2026).

[^r03-entra-sql]: Microsoft Learn, "Microsoft Entra authentication for SQL Server," <https://learn.microsoft.com/sql/relational-databases/security/authentication-access/azure-ad-authentication-sql-server-overview> (accessed Oct 20, 2026).

[^r03-dup-spn]: Microsoft Learn, "Kerberos generates KDC_ERR_S_PRINCIPAL_UNKNOWN or KDC_ERR_PRINCIPAL_NOT_UNIQUE error," <https://learn.microsoft.com/troubleshoot/windows-server/windows-security/kerberos-error-kdc-err-s-principal-unknown-or-not-unique> (accessed Oct 20, 2026).
