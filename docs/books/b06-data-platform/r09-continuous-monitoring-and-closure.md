---
title: "Runbook R09 — Continuous Monitoring & the CCM-BIR Closure Record"
description: "How to prove and keep the transformed posture: run the instance audit on a schedule, project each run onto the per-instance closure record, treat drift as a compliance violation, join the behavioral evidence from Entra ID and the hosts, and read 2027-04-01 as a validation deadline rather than a migration one."
doc-type: workbook-chapter
audience: [Technical, Customer]
family: b06-data-platform
book: B06
part: How
series-order: 109
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Runbook R09 — Continuous Monitoring & the CCM-BIR Closure Record

*Closure isn't a day on the calendar; it's a record that keeps coming back clean.*

::: {.callout-note}
## In this runbook
How to keep proving the transformed posture. The instance audit runs on a schedule; `New-FMPClosureRecord` projects each run onto the per-instance closure record (the program calls it the CCM-BIR record); `Compare-FMPClosureRun` turns the difference between two runs into drift events. The behavioral evidence (who connected, how) stays in Entra ID, SQL Server and the hosts and is joined, not copied. The chapter ends with the six evidence sets that close the transformation and the correct reading of the 2027-04-01 date.
:::

**Pairs with:** [Chapter 20 — The Closure Condition](20-the-closure-condition.md) and [Chapter 21 — What Done Looks Like](21-what-done-looks-like.md). Those chapters explain that a transformation achieves a *posture*, not a completion. This page is how you keep proving it. The audit that produces the evidence is read-only, and so are the two derivations over it. The MFA and connection-behavior fields are reported as **external joins** to Entra sign-in logs and host telemetry by design: the structural record points at that telemetry rather than duplicating it.

## Closure is a continuously verified posture

A migrated instance can be reconfigured to Mixed Mode by any administrator with sufficient permission, and new SQL Authentication or Windows logins can be created.[^r09-auth-mode] The transformed posture is therefore not a state you reach and stop watching. It's a condition maintained by continuous monitoring and by a governance process that treats regression as a compliance violation. The instrument is the same audit you've run since [Runbook R03](r03-the-authentication-audit.md), now on a recurring schedule.

## Step 1 — Run Spec3-D1.8 in continuous-monitoring mode (read-only)

`Spec3-D1.8-Get-SQLServerAuthAudit.ps1` is both the discovery baseline and the closure-verification instrument; the program names it the producer of the per-instance posture record. Run its **deep** form (`-QueryInstances`) on a schedule against the **retain and target** estate from [Runbook R02](r02-estate-discovery-and-consolidation-gate.md), keeping every run's JSON under version control so successive runs can be compared.

::: {.callout-warning}
## Illustrative, not tested against production
The commands and queries on this page are illustrative. They haven't been tested against a production estate. The audit script and the `FMP*` functions are the program's own tooling; their parameters are documented here as the program defines them. Review each, and run it first in a non-production environment.
:::

```powershell
# Scheduled deep audit of the surviving estate (read-only inventory queries)
./Spec3-D1.8-Get-SQLServerAuthAudit.ps1 `
    -TargetServers (Get-Content .\retain-and-target.txt) `
    -QueryInstances -TestConnectivity `
    -OutputPath .\output\$(Get-Date -Format yyyy-MM-dd)
```

The audit JSON's `InstanceAudits[]` already carries the raw closure signals: `AuthenticationMode` (read from `SERVERPROPERTY('IsIntegratedSecurityOnly')`, so it reports the *running* mode as "Windows Authentication Only" or "Mixed Mode (Windows + SQL)"), the `SQLLogins`, `WindowsLogins` and `OrphanedLogins` arrays (login-type counts), the `IsSA`, `IsDisabled` and `PasswordLastSet` columns in the per-login `*_logins.csv`, and the service-identity and `EntraIDReady` fields (Arc and extension state). It's the same output Runbook R03 documents. Continuous monitoring isn't a different script, only a different cadence.

## Step 2 — Assemble the per-instance closure record

The closure record's field set is the canonical one in [Chapter 20](20-the-closure-condition.md); this runbook doesn't define its own. The SQL Server authentication transformation is closed for an instance when its record **simultaneously** shows every field below. The first column numbers Chapter 20's five conditions; the second is the field; the third states what the field proves, corrected where the source overstated it; the last is where the evidence comes from.

| Condition | Closure field | What it proves | Source |
|---|---|---|---|
| 1 | Zero active **type-U and type-G** logins, other than the documented break-glass group in the exception registry | No usable Windows-backed principal remains outside the registered emergency path[^r09-principals] | `WindowsLogins` array cross-referenced to the exception registry |
| 2 | `LoginMode = 1` (Windows Authentication mode); on SQL Server 2025 also `SERVERPROPERTY('IsExternalAuthenticationOnly') = 1` | SQL logins are refused. It doesn't prove Windows logins are gone; SQL Server has no setting that turns Windows Authentication off.[^r09-auth-modes][^r09-disable-sql] | `AuthenticationMode` |
| 2 | Zero active **type-S** logins outside the exception registry | No SQL Authentication principal can connect | `SQLLogins` (type S) cross-referenced to the exception registry |
| 2 | `sa` **disabled and renamed** | The well-known SQL login can't be used[^r09-auth-mode] | `IsSA` and `IsDisabled` in `*_logins.csv` (the source called them `sa` and `Disabled`) |
| 3 | Every other active login is **type E or X** and maps to a known user, application or group | Entra principals are reconciled, not just present ([Chapter 17](17-dynamic-membership-delegation-and-privilege.md)) | Login census joined to the Entra inventory ([Runbook R07](r07-groups-aus-and-the-conditional-access-perimeter.md)) |
| 3 | Zero remote **NTLM or Kerberos** connections over the validation period | Nothing but Entra authentication is in use | `auth_scheme` sampling, SQL Server Audit and host logon events (Step 4; external join) |
| 3 | The expected principals obtain SQL tokens and log in | Entra authentication is observed working | Entra sign-in logs (external join) and SQL Server Audit (Step 4) |
| 4 | Arc Connected Machine agent **connected** | The host is reachable from the cloud control plane | Service-identity and Arc fields; `azcmagent show` reports *Agent Status* ([Runbook R04](r04-arc-deployment-and-managed-identity.md))[^r09-azcmagent] |
| 4 | Azure extension for SQL Server **deployed** | The engine has the extension that manages its Entra configuration | Extension state |
| 4 | Microsoft Entra authentication **configured** on the instance | The engine can validate Entra tokens: through the primary managed identity on SQL Server 2025, or an app registration on SQL Server 2022[^r09-mi] | `EntraIDReady` plus extension state |
| 5 | **MFA through Conditional Access** for human SQL Server sign-ins over the validation period | Every human sign-in to the SQL resource met MFA | Entra sign-in logs and Conditional Access results (external join) |

The source called the Entra-configuration row "Managed Identity active." That holds only for SQL Server 2025: the managed identity setup for Entra authentication is supported on Arc-enabled SQL Server 2025 on Windows, while SQL Server 2022 uses an app registration for inbound Entra authentication.[^r09-mi] On SQL Server 2025 the record also captures `SERVERPROPERTY('IsExternalAuthenticationOnly') = 1`, which shows the Disable SQL Authentication setting is on; that setting blocks every SQL login, including `sa`, and still accepts Entra and Windows authentication.[^r09-disable-sql]

**`New-FMPClosureRecord`**, in the program's `FMPSqlServerMigration` module, is the ingestion-and-projection step. It reads one scheduled D1.8 JSON and, per instance, projects it onto the structural fields the audit carries: Windows Authentication mode, zero active type-S outside the exception registry, zero active type-U and type-G, `sa` disabled, Arc enrolled and healthy, Entra authentication configured. It emits a sealed closure record with a `verdict` (`closed`, `closed_excepted` or `open`) and the `failing_fields` for any open instance. An optional `-ExceptionRegistryPath` tolerates an excepted instance's type-S login (verdict `closed_excepted`). The MFA field is reported as `external`: the record points at the Entra sign-in logs and the `Export-FMPConditionalAccess` output from Runbook R07 rather than asserting it from the structural audit.

As the program defines it, the projection is narrower than the field set in three places, so the reviewer closes the gaps before reading a verdict. It lists `sa` disabled, not renamed: confirm the name in `*_logins.csv`. Its registry tolerance covers type-S logins only, so an instance holding the registered break-glass group reports the Windows-login field as failing: confirm that the only failing type-U or type-G login is that registered group. And the Condition 3 reconciliation, protocol and sign-in fields come from the joins of Step 4 and Runbook R07, recorded alongside the closure record.

```powershell
Import-Module FMPSqlServerMigration
New-FMPClosureRecord `
    -AuditPath             .\output\2027-03-01\sqlserver-auth-audit.json `
    -ExceptionRegistryPath .\config\sql-exception-registry.json `
    -OutputPath            .\output\2027-03-01\ccm-bir-closure.json
```

## Step 3 — Detect drift as a compliance violation

The program records specific transitions as **compliance violations**, not advisory signals. The difference between two scheduled D1.8 runs surfaces each one:

- `LoginMode` changing **1 → 2** (Windows Authentication mode to mixed mode): mixed mode enabled without authorization. The new mode takes effect only when the service restarts,[^r09-auth-mode] and the D1.8 audit reads the running mode, so a change made in the registry is invisible to the audit until that restart. If earlier warning matters, add a registry check of `LoginMode` alongside the audit.
- A **new type-S** login present this run but not last: a SQL Authentication login was created.
- A **new type-U or type-G** login on a previously Entra-only instance: Windows-backed identity was reintroduced.
- The **Arc agent offline** or the SQL Server extension unavailable: Entra token validation on the engine is at risk.

**`Compare-FMPClosureRun`**, in the `FMPSqlServerMigration` module, is the mechanical diff. It indexes a baseline and a current D1.8 run by instance and emits one event per regression (`mixed_mode_enabled`, `new_sql_auth_login`, `new_windows_login`, `arc_agent_offline`, each flagged `violation = true`), plus informational `instance_appeared` and `instance_disappeared` events. An appeared instance is a possible discovery gap; re-run Runbook R02. The envelope's `compliance_violation` is true whenever any violation event is present.

```powershell
Compare-FMPClosureRun `
    -BaselinePath .\output\2027-02-01\sqlserver-auth-audit.json `
    -CurrentPath  .\output\2027-03-01\sqlserver-auth-audit.json `
    -OutputPath   .\output\2027-03-01\closure-drift.json
```

Each drift event triggers the program's remediation workflow. Because the audit is read-only and the diff is mechanical, drift is caught at the next scheduled run rather than at incident time.

## Step 4 — The behavioral layer

The closure record monitors the **configuration** state: is `LoginMode` correct, are the login types correct. The behavioral layer watches the **connections**. The source assigned that whole job to Microsoft Defender for SQL and said any NTLM or Kerberos event in Defender telemetry should be zero. That's corrected here, consistent with [Chapter 20](20-the-closure-condition.md), because the behavioral evidence comes from three sources with different jobs:

- **Microsoft Defender for SQL servers on machines**, enabled through Defender for Cloud on the Arc-enabled host, runs vulnerability assessment and raises threat alerts such as potential SQL injection, access from an unusual location, access from an unfamiliar principal or potentially harmful application, and brute force of SQL credentials.[^r09-defender] It's an alerting service, not a log of every authentication and its protocol.
- **Microsoft Entra sign-in logs** record each token issued for the SQL resource, in four log types: interactive user, non-interactive user, service principal and managed identity sign-ins, each with its Conditional Access result.[^r09-signins] A client can reuse a cached token across connections, so a sign-in event isn't one-to-one with a connection.
- **The instance and the host** record the authentication protocol itself. `sys.dm_exec_connections.auth_scheme` shows `NTLM` or `KERBEROS` for Windows-authenticated connections,[^r09-auth-scheme] Windows logon events name the authentication package, the NTLM Operational log records NTLM use when the *Restrict NTLM* audit policies are on ([Runbook R06](r06-ntlm-detection-and-remediation.md)), and SQL Server Audit records successful and failed logins.[^r09-sqlaudit]

In the transformed posture the baseline is Entra-authenticated connections only, so **any NTLM- or Kerberos-authenticated connection** to an instance, visible in `auth_scheme`, SQL Server Audit or the host's logon events, should be zero and is an immediate alert. An NTLM connection means one of three things, all requiring investigation: an instance regressed to Mixed Mode (the closure record should already have caught it), an instance was outside the original audit scope (a discovery gap; re-run Runbook R02), or a connection pattern the plan didn't anticipate.

### Illustrative workspace queries

Where the Azure Monitor agent forwards the hosts' Windows logs to a Log Analytics workspace ([Chapter 20](20-the-closure-condition.md)), the protocol checks can run there as scheduled queries. Which table holds the Security log depends on how it's collected. A data collection rule's *Windows Event Logs* data source writes Security events to the `Event` table with the other logs; the Microsoft Sentinel connector *Windows Security Events via AMA* uses the same agent and collects the same events into the `SecurityEvent` table, which has the logon fields as columns.[^r09-ama-events] The NTLM Operational log is a separate channel, `Microsoft-Windows-NTLM/Operational`,[^r09-ntlm-channel] so the rule needs its own XPath entry for it, in the documented `LogName!XPathQuery` form: `Microsoft-Windows-NTLM/Operational!*[System[(EventID=8004)]]` on domain controllers.[^r09-ama-events][^r09-mdi-8004] Those events land in the `Event` table.

::: {.callout-warning}
## Illustrative queries, not tested against production
These KQL queries are illustrative. Their table and column names come from Microsoft's Azure Monitor table reference, but they haven't been run against a production workspace. Replace the host names, confirm that the filter values match what your workspace records, and tune the time window before you turn any of them into an alert rule.
:::

The first query finds successful NTLM network logons on the SQL Server hosts. It assumes the Sentinel connector, so the events are in `SecurityEvent`; `EventID`, `LogonType`, `AuthenticationPackageName`, `Account`, `IpAddress` and `WorkstationName` are columns of that table.[^r09-securityevent] Event 4624 reports the package as `NTLM` for NTLM-family authentication, and logon type 3 is a network logon.[^r09-4624]

```kusto
// NTLM network logons on SQL Server hosts (SecurityEvent, Sentinel AMA connector)
let SqlHosts = dynamic(["sqlhost01.example.gov", "sqlhost02.example.gov"]);
SecurityEvent
| where TimeGenerated > ago(1d)
| where EventID == 4624 and LogonType == 3
| where AuthenticationPackageName == "NTLM"
| where Computer in~ (SqlHosts)
| summarize Logons = count(), LastSeen = max(TimeGenerated)
    by Computer, Account, IpAddress, WorkstationName
```

The second query reads event 8004 from the domain controllers' NTLM Operational log. The `Event` table keeps the event's fields in `EventData` and its message in `RenderedDescription`, not as separate columns,[^r09-event-table] so the filter matches the SQL Server host names in the message text. Event 8004 records the server each NTLM request was for.[^r09-mdi-8004]

```kusto
// NTLM requests audited by domain controllers (event 8004, Event table)
let SqlHostNames = dynamic(["sqlhost01", "sqlhost02"]);
Event
| where TimeGenerated > ago(1d)
| where EventLog == "Microsoft-Windows-NTLM/Operational" and EventID == 8004
| where RenderedDescription has_any (SqlHostNames)
| project TimeGenerated, Computer, RenderedDescription, EventData
```

The third query covers the sign-in side. Once Entra sign-in logs are sent to the workspace through diagnostic settings, each log type is its own table: interactive user sign-ins in `SigninLogs`, and the non-interactive user, service principal and managed identity sign-ins in `AADNonInteractiveUserSignInLogs`, `AADServicePrincipalSignInLogs` and `AADManagedIdentitySignInLogs`.[^r09-signin-streams] All four tables carry `ResourceDisplayName`, `ResultType` and `ConditionalAccessStatus`; `SigninLogs` documents a `ResultType` of 0 as success.[^r09-signinlogs-table] The filter uses the name of the *Azure SQL Database* first-party application, which is the resource Microsoft documents for Conditional Access on Azure SQL,[^r09-ca-sql] and tokens for SQL Server's Entra authentication use the same `https://database.windows.net/` audience ([Runbook R07](r07-groups-aus-and-the-conditional-access-perimeter.md)). That guidance is written for Azure SQL, and this runbook hasn't confirmed the resource name a sign-in to SQL Server enabled by Azure Arc records, so check `ResourceDisplayName` and `ResourceIdentity` on the pilot instance's sign-ins before you rely on the filter.

```kusto
// Sign-ins to the SQL resource across the four Entra sign-in log tables
union withsource = LogTable
    SigninLogs, AADNonInteractiveUserSignInLogs,
    AADServicePrincipalSignInLogs, AADManagedIdentitySignInLogs
| where TimeGenerated > ago(30d)
| where ResourceDisplayName == "Azure SQL Database"
| summarize SignIns = count(), Failures = countif(ResultType != "0")
    by LogTable, UserPrincipalName, ServicePrincipalName, ConditionalAccessStatus
```

The first two queries should return nothing once an instance is in the transformed posture; any row is the immediate alert described above. The third is the population for evidence set 2 below: every row should be a known user, service principal or managed identity.

By design, the closure record keeps the behavioral layer as an external join rather than copying Defender alerts, Entra sign-in logs and host events into the structural record: `New-FMPClosureRecord` marks the MFA field `external` and points at that telemetry. Each layer stays authoritative in its own console, and the closure decision reads both. Collapsing them into one artifact would duplicate a source of truth, which the program's single-source-of-truth principle forbids.

## The six live evidence sets

[Chapter 21](21-what-done-looks-like.md) names six evidence sets that close the transformation. Each is a **live output** of the monitoring above, satisfied continuously across a validation period, not assembled once. Sets 2 and 3 are restated from the source, which asked Entra sign-in logs to show "zero failed token requests attributable to NTLM/Kerberos fallback" and Defender for SQL to show "zero NTLM events"; neither service records that.

1. **Closure records**: one per production instance, all fields satisfied (Step 2).
2. **Entra sign-in logs**: every sign-in to the SQL resource over the validation period is accounted for by a known user, service principal or managed identity, with the expected Conditional Access result.[^r09-signins]
3. **Protocol telemetry**: zero NTLM- or Kerberos-authenticated connections over the same period, from `auth_scheme` sampling, SQL Server Audit and host logon events, with Defender for SQL alerts reviewed and closed (Step 4).
4. **`sa` report**: `sa` disabled and renamed on all instances (from the D1.8 `*_logins.csv`).
5. **Conditional Access MFA report**: MFA satisfied for 100% of human sign-ins to the SQL resource (`Export-FMPConditionalAccess` from Runbook R07, plus the sign-in logs).
6. **Exception registry**: every excepted instance with its justification, sunset date and its own closure record.

When all six are satisfied at the same time, and the monitoring confirms they have been for the validation period, the transformation is closed.

## Reading the 2027-04-01 date correctly

2027-04-01 is the date the program applies the **network-level NTLM block**, Phase C of its NTLM-elimination plan ([Runbook R06](r06-ntlm-detection-and-remediation.md)). It is the program's own date, not an external deadline: Microsoft lists NTLM as deprecated but still working,[^r09-ntlm-deprecated] and nothing in Microsoft's or the federal record falls due on that day. The external dates near it are product lifecycle dates. SQL Server 2017 reaches end of support on October 12, 2027;[^r09-eos-2027] the first year of Extended Security Updates for SQL Server 2016 ends on July 13, 2027, and the third and final year for SQL Server 2014 ends on July 12, 2027.[^r09-esu] Those dates bear on the pre-2022 long tail below, because only SQL Server 2022 and later can take Entra logins at all.

The block is a **consequence, not a migration completion date**, and it doesn't honor engine-level exception status. Read as a consequence, it reorganizes the schedule. Migration activity (the parallel run and cutover of [Runbook R05](r05-login-migration-and-parallel-run.md), `sa` disablement, type-S elimination) must finish **well before** the block, and the final months are the continuous-audit **validation period**, not the migration period. A posture confirmed only on the last day before the block is one nobody has had time to prove.

The exception long tail (pre-2022 instances and deferred-class applications) must carry certificate-based authentication as the program's authorized interim posture, with a sunset date reconciled against the block. As [Chapter 22](22-where-sql-server-touches-adcs.md) explains, that means the user signs in to Active Directory with a smart card or PIV certificate and the SQL Server connection still uses Windows Authentication, so it avoids NTLM only where the connection then negotiates Kerberos. Its certificate dependency is the subject of [Runbook R10](r10-certificate-discovery-for-adcs.md). When the migration is done, the audit has validated the posture continuously, and the six evidence sets are live and satisfied, the block arrives as a non-event.

## Safety

Everything in this runbook is **read-only**: scheduled Spec3-D1.8 runs in inventory mode, log reads and diffs. Continuous monitoring changes nothing on the instances it watches; its only outputs are evidence and drift events. A drift event is remediated through the relevant earlier runbook's review-required procedure ([Runbook R05](r05-login-migration-and-parallel-run.md) for logins, [Runbook R06](r06-ntlm-detection-and-remediation.md) for NTLM and SPNs), not here.

::: {.callout-tip}
## Continue the book
[← Previous: Runbook R08 — The Application Chain & Connection-String Migration](r08-application-chain-and-connection-strings.md) · [Book index](index.md) · [Next: Runbook R10 — Certificate Discovery for SQL Server's ADCS Dependencies →](r10-certificate-discovery-for-adcs.md)
:::

[^r09-auth-mode]: Microsoft Learn, "Change server authentication mode" (changing the mode requires a restart; `LoginMode` 1 = Windows only, 2 = mixed; `ALTER LOGIN sa DISABLE`), <https://learn.microsoft.com/sql/database-engine/configure-windows/change-server-authentication-mode> (accessed Oct 20, 2026).
[^r09-auth-modes]: Microsoft Learn, "Choose an authentication mode" ("Windows Authentication is always available and can't be disabled"), <https://learn.microsoft.com/sql/relational-databases/security/choose-an-authentication-mode> (accessed Oct 20, 2026).
[^r09-principals]: Microsoft Learn, "sys.server_principals (Transact-SQL)" (types S, U, G, E, X, C, K), <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-server-principals-transact-sql> (accessed Oct 20, 2026).
[^r09-azcmagent]: Microsoft Learn, "`azcmagent show`," <https://learn.microsoft.com/azure/azure-arc/servers/azcmagent-show> (accessed Oct 20, 2026).
[^r09-mi]: Microsoft Learn, "Managed identity for SQL Server enabled by Azure Arc" (SQL Server 2025; system-assigned only; primary managed identity; inbound connections by app registration from SQL Server 2022), <https://learn.microsoft.com/sql/sql-server/azure-arc/managed-identity> (accessed Oct 20, 2026).
[^r09-disable-sql]: Microsoft Learn, "Disable SQL authentication for SQL Server enabled by Azure Arc" (SQL Server 2025 on Windows; blocks all SQL logins including `sa`; `SERVERPROPERTY('IsExternalAuthenticationOnly')`), <https://learn.microsoft.com/sql/sql-server/azure-arc/disable-sql-authentication> (accessed Oct 20, 2026).
[^r09-defender]: Microsoft Learn, "Overview of Microsoft Defender for SQL servers on machines" (vulnerability assessment; Advanced Threat Protection alert types), <https://learn.microsoft.com/azure/defender-for-cloud/defender-for-sql-servers-introduction> (accessed Oct 20, 2026).
[^r09-signins]: Microsoft Learn, "What are Microsoft Entra sign-in logs?" (interactive, non-interactive, service principal and managed identity sign-ins), <https://learn.microsoft.com/entra/identity/monitoring-health/concept-sign-ins> (accessed Oct 20, 2026).
[^r09-auth-scheme]: Microsoft Learn, "sys.dm_exec_connections (Transact-SQL)" (`auth_scheme`), <https://learn.microsoft.com/sql/relational-databases/system-dynamic-management-objects/sys-dm-exec-connections-transact-sql> (accessed Oct 20, 2026).
[^r09-sqlaudit]: Microsoft Learn, "SQL Server Audit (Database Engine)," <https://learn.microsoft.com/sql/relational-databases/security/auditing/sql-server-audit-database-engine> (accessed Oct 20, 2026).
[^r09-ntlm-deprecated]: Microsoft Learn, "Deprecated features for Windows client," entry NTLM ("Use of NTLM will continue to work in the next release of Windows Server and the next annual release of Windows"), <https://learn.microsoft.com/windows/whats-new/deprecated-features> (accessed Oct 20, 2026).
[^r09-eos-2027]: Microsoft Learn, "Ending Support in 2027" (SQL Server 2017, October 12, 2027), <https://learn.microsoft.com/lifecycle/end-of-support/end-of-support-2027> (accessed Oct 20, 2026).
[^r09-esu]: Microsoft Learn, "SQL Server Extended Security Updates FAQ," table "ESU Availability and End Dates" (SQL Server 2014 Year 3 ends July 12, 2027; SQL Server 2016 Year 1 ends July 13, 2027), <https://learn.microsoft.com/lifecycle/faq/sql-server-extended-security-updates> (accessed Oct 20, 2026).
[^r09-ama-events]: Microsoft Learn, "Collect Windows events from virtual machine with Azure Monitor" (Security log in a DCR goes to the `Event` table; the Windows Security Events via AMA connector sends the same events to `SecurityEvent`; XPath entries in the form `LogName!XPathQuery`), <https://learn.microsoft.com/azure/azure-monitor/vm/data-collection-windows-events> (accessed Oct 21, 2026).
[^r09-ntlm-channel]: Microsoft Support, "Overview of NTLM auditing enhancements in Windows 11, version 24H2, Windows Server 2019, and later versions" (event log channel `Microsoft-Windows-NTLM/Operational`; Event Viewer path Applications and Services Logs > Microsoft > Windows > NTLM > Operational), <https://support.microsoft.com/en-us/servicing/os/windows/2025/07/overview-of-ntlm-auditing-enhancements-in-windows-11-version-24h2-and-windows-server-2025> (accessed Oct 21, 2026).
[^r09-mdi-8004]: Microsoft Learn, "Configure Windows event auditing" (Microsoft Defender for Identity), section "Configure NTLM auditing" (event 8004, collected on domain controllers only, carries the server-accessed data), <https://learn.microsoft.com/defender-for-identity/deploy/configure-windows-event-collection> (accessed Oct 21, 2026).
[^r09-securityevent]: Microsoft Learn, Azure Monitor table reference, "SecurityEvent" (columns `EventID`, `LogonType`, `AuthenticationPackageName`, `Account`, `IpAddress`, `WorkstationName`, `Computer`), <https://learn.microsoft.com/azure/azure-monitor/reference/tables/securityevent> (accessed Oct 21, 2026).
[^r09-4624]: Microsoft Learn, "4624(S): An account was successfully logged on" (logon type 3, Network; authentication package `NTLM` for NTLM-family authentication), <https://learn.microsoft.com/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4624> (accessed Oct 21, 2026).
[^r09-event-table]: Microsoft Learn, Azure Monitor table reference, "Event" (columns `EventLog`, `EventID`, `Computer`, `EventData`, `RenderedDescription`), <https://learn.microsoft.com/azure/azure-monitor/reference/tables/event> (accessed Oct 21, 2026).
[^r09-signin-streams]: Microsoft Learn, "What are the identity logs you can stream to an endpoint?" (SignInLogs, NonInteractiveUserSignInLogs, ServicePrincipalSignInLogs, ManagedIdentitySignInLogs), <https://learn.microsoft.com/entra/identity/monitoring-health/concept-diagnostic-settings-logs-options> (accessed Oct 21, 2026); Azure Monitor table reference, "AADNonInteractiveUserSignInLogs," "AADServicePrincipalSignInLogs" and "AADManagedIdentitySignInLogs," <https://learn.microsoft.com/azure/azure-monitor/reference/tables/aadnoninteractiveusersigninlogs>, <https://learn.microsoft.com/azure/azure-monitor/reference/tables/aadserviceprincipalsigninlogs>, <https://learn.microsoft.com/azure/azure-monitor/reference/tables/aadmanagedidentitysigninlogs> (accessed Oct 21, 2026).
[^r09-signinlogs-table]: Microsoft Learn, Azure Monitor table reference, "SigninLogs" (`ResourceDisplayName`, `ResourceIdentity`, `ConditionalAccessStatus`; `ResultType` "0 indicates success; other values are failures"), <https://learn.microsoft.com/azure/azure-monitor/reference/tables/signinlogs> (accessed Oct 21, 2026).
[^r09-ca-sql]: Microsoft Learn, "Conditional access" (Azure SQL Database, SQL Managed Instance and Azure Synapse; the target resource is the *Azure SQL Database* Microsoft application), <https://learn.microsoft.com/azure/azure-sql/database/conditional-access-configure> (accessed Oct 21, 2026).
