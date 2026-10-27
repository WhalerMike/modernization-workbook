# Start Kit: read-only estate assessment

> **Status: illustrative. Unit-tested against fixtures, not proven against a live estate.**
> These scripts are the executable starting point for the read-only assessment in [Book 00, Chapter 08](../../docs/books/b00-orientation/08-pre-flight-and-assessment.md) and the estate discovery in [Book 06, Runbook R02](../../docs/books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md). They follow the discipline in [Book 01, Chapter 10](../../docs/books/b01-transformation-arc/10-analyzing-the-estate.md): read-only by policy, least privilege in two tiers, provenance on every run. Review every function, sign the modules, and run them first in a test forest. They aren't an endorsement by any agency, and no agency has adopted them.

**Download:** [start-kit.zip](https://whalermike.github.io/modernization-workbook/downloads/start-kit.zip), rebuilt from this folder on every site deploy. **Source:** [examples/start-kit](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/start-kit). The relative links below to the books work in the repository; from the zip, open them on the [workbook site](https://whalermike.github.io/modernization-workbook/).

## What it counts

One run produces a one-page summary (`Summary/StartKitSummary.md`) with these counts, each traced to the file it came from. A count whose source couldn't be collected says *not collected*, never zero.

| Count | From | Book 00 domain or Book 01 stream |
|---|---|---|
| Domains, domain controllers, sites | `Get-FMPForestTopology` | Forest topology (stream 1) |
| Trusts (unique pairs, and how many are external) | `Get-FMPTrustMap` | Trust relationships (stream 1) |
| Organizational units, and their delegations | `Get-FMPOUHierarchy` | OU hierarchy; ACL and delegation (stream 2) |
| Group Policy Objects, with empty, unlinked and conflicting ones | `Get-FMPGPOInventory` | GPO inventory (stream 7) |
| Users and enabled users; privileged and orphaned `adminCount` accounts | `Get-FMPUserInventory` | User objects (stream 3) |
| Groups, empty groups, circular nesting | `Get-FMPGroupInventory` | Group memberships (stream 6) |
| Computers by operating system, servers, stale computers, delegation | `Get-FMPComputerInventory` | Computer objects (stream 4) |
| Service accounts (users with SPNs, MSAs, gMSAs) | `Get-FMPUserInventory` | Service accounts (stream 5) |
| Service principal names, duplicates and orphans, forest-wide | `Get-FMPKerberosSpnMap` | Kerberos SPN map (stream 11) |
| LDAP clients binding unsigned or in clear text (Tier B) | `Get-FMPLdapBindingEvent` | LDAP bindings (stream 11) |
| DNS zones, stale records, DC locator records | `Get-FMPDNSAssessment` | DNS infrastructure (stream 8) |
| DHCP servers and scopes, reservations, failover (Tier B) | `Get-FMPDHCPInventory` | DHCP (stream 9) |
| Enterprise CAs, certificate templates, ESC1, ESC2, ESC4 and ESC6 | `Get-FMPPKIAssessment` | PKI and AD CS (stream 10) |
| Schema version and extensions | `Get-FMPSchemaExtensions` | Schema extensions (stream 1) |
| **SQL Server instances and hosts**, by version, edition, domain and authentication mode | `Invoke-FMPSqlEstateDiscovery` | Book 06, Runbooks R02 and R03 |

### How it counts SQL Server

No single instrument finds every instance ([Runbook R02](../../docs/books/b06-data-platform/r02-estate-discovery-and-consolidation-gate.md#step-1--build-the-estate-inventory-read-only)), so the kit fuses three independent signals and says, for every instance, which ones saw it:

1. **SPN.** Every `MSSQLSvc` service principal name in every domain of the forest. `MSSQLSvc/host:1433` is a TCP registration, `MSSQLSvc/host:SALES` a named instance, `MSSQLSvc/host` the default instance.
2. **Directory.** Computer objects and service accounts whose name or description contains `sql` (change it with `-NameHint`), and the computers allowed to use a SQL-named gMSA. Host-level only: a candidate host no other signal confirms is listed in `CandidateHosts`, not counted.
3. **Network.** With `-ProbeNetwork`, the SQL Server Browser on UDP 1434 of every host the first two signals found plus `-TargetServers`; with `-ProbeAllServers`, every enabled Windows Server computer too. With `-UseDbatools`, dbatools' `Find-DbaInstance` does this instead, if it's installed; it's never required. Neither logs in to SQL Server.

Instances are keyed on host and instance name, so one seen three times counts once. `SourcesAgree` is `Yes` when every signal that ran saw the instance on the same port; `SourceNotes` says what differs (*Not found by Network*, *Port differs*, *Version differs*). An instance found only by the network signal is usually an Express edition an installer dropped; one found only by an SPN is often a decommissioned host.

With `-QueryInstances`, each instance is then read with SELECT-only T-SQL over Windows authentication and `ApplicationIntent=ReadOnly`: version, edition, authentication mode, logins by type (`SQL_LOGIN`, `WINDOWS_LOGIN`, `WINDOWS_GROUP`, external), whether `sa` is enabled, databases, last user access from `sys.dm_db_index_usage_stats` with the engine start time beside it, and linked servers. `Get-FMPSqlQueryCatalog` prints every statement the kit can send. Field names match Runbook R03's audit (`ServerName`, `InstanceName`, `DiscoveryMethod`, `SQLVersion`, `SQLVersionMajor`, `SQLEdition`, `AuthenticationMode`, `SQLLogins`, `WindowsLogins`, `LinkedServers`), and each instance gets Runbook R02's first-pass gate: **retire** when no user database has been touched in `-ZombieThresholdDays` (default 400) *and* the engine has been up that long, otherwise **retain** for SQL Server 2022 or later, **consolidate** for earlier engines, and **review** when the version is unknown. The architects confirm or override every row.

## Pointing the kit at your own forest

Nothing in the kit is tied to a forest name. `contoso.example`, `child.contoso.example` and `partner.example` appear only in the test fixtures (`tests/fixtures/`) and in examples; at run time the kit asks Active Directory which forest it's in and reads every domain of it.

| You want to | Do this |
|---|---|
| Assess the forest the assessment host is joined to | Nothing: run `.\Invoke-FMPStartKit.ps1 -OutputPath <folder>`. The forest comes from `Get-ADForest`, the domains from its `Domains` list. |
| Assess only some domains | `-Domain corp.agency.example, field.corp.agency.example` |
| Assess a different forest that trusts this account | `-Forest other.agency.example` (passed to `Get-ADForest -Server`). Run from a host in that forest if the trust doesn't allow it. |
| Use a particular DNS server or DHCP server | Call the collector directly: `Get-FMPDNSAssessment -DnsServer ...`, `Get-FMPDHCPInventory -DhcpServer ...` |
| Add SQL hosts no signal finds | `-TargetServers (Get-Content .\hosts.txt)` with `-ProbeNetwork` |
| Change what the directory signal looks for | `Invoke-FMPSqlEstateDiscovery -NameHint db` (a substring of names and descriptions) |
| Change staleness and retirement thresholds | `-StaleThresholdDays 90`, `-ZombieThresholdDays 400`; `Get-FMPKerberosSpnMap -OrphanDays 180` |
| Recognize your own schema extensions | Add a line to `$script:FMPKnownExtensions` in `FMPADAssessment.psm1` |
| Count a different set of privileged groups | Edit `$script:FMPPrivilegedGroups` in `FMPADAssessment.psm1` |
| Run the tests against your own data shapes | Copy `tests/fixtures/ad-forest.json`, replace the objects with sanitized exports of your own (`Get-ADUser ... \| ConvertTo-Json`), keep the same keys, and adjust the expected counts in `tests/powershell/ADAssessment.Tests.ps1`. Never commit real exports. |

The output folders are named after the real domains (`<run>\corp.agency.example\Objects\...`), so a second run compares file by file with `Compare-FMPAssessments`.

## Prerequisites

- **Windows PowerShell 5.1 or PowerShell 7.** Both are tested.
- **A domain-joined assessment host**: a privileged access workstation or a hardened Windows 11 or Windows Server VM with restricted network access ([Book 00, Chapter 08](../../docs/books/b00-orientation/08-pre-flight-and-assessment.md#five-steps-from-default-read-to-approved-plans)).
- **RSAT modules.** Each collector checks for the module it needs when it runs; a missing module fails that collector alone and the run continues.

| Module | Used by | Windows client (Feature on Demand) | Windows Server |
|---|---|---|---|
| ActiveDirectory | Everything | `Rsat.ActiveDirectory.DS-LDS.Tools~~~~0.0.1.0` | `RSAT-AD-PowerShell` |
| GroupPolicy | GPO inventory | `Rsat.GroupPolicy.Management.Tools~~~~0.0.1.0` | `GPMC` |
| DnsServer | DNS assessment | `Rsat.Dns.Tools~~~~0.0.1.0` | `RSAT-DNS-Server` |
| DhcpServer | DHCP inventory | `Rsat.DHCP.Tools~~~~0.0.1.0` | `RSAT-DHCP` |
| AD CS tools (`certutil`) | CA policy flags (ESC6) | `Rsat.CertificateServices.Tools~~~~0.0.1.0` | AD CS management tools |
| dbatools (optional) | `-UseDbatools` | `Install-Module dbatools -Scope CurrentUser` | Same |

Confirm the exact Windows Server feature names with `Get-WindowsFeature -Name RSAT*` before scripting an install. `Test-FMPPrerequisites` reports what's installed. The kit needs no SqlServer module: the T-SQL pass uses the .NET SqlClient that ships with both PowerShell editions.

**Network paths** from the assessment host: ADWS (TCP 9389) to domain controllers for the ActiveDirectory module, SMB (TCP 445) for SYSVOL, RPC (TCP 135 and the dynamic range) to DNS servers, DHCP servers, CAs and domain controllers' event logs, UDP 1434 to SQL hosts for the Browser probe, and the SQL Server TCP ports for the T-SQL pass. Tell security operations the window, the account and the expected query pattern first: broad directory enumeration and a UDP sweep both look like reconnaissance.

## Rights each part needs

The assessment never uses Domain Admins, DnsAdmins, the CA administrator role or `sysadmin`. Tier A is a dedicated standard account with no added rights; Tier B adds only the narrow, read-only, time-bound delegations in [Book 02, Chapter 07](../../docs/books/b02-identity/07-read-only-discovery.md#the-delegation-request) and [Chapter 08](../../docs/books/b02-identity/08-assessing-the-forest.md#rights). Run `Test-FMPReadAccess` (the first step of every run) to see what this forest lets a default account read; it writes the gaps as `Preflight/DelegationRequest.md`.

| Part | Tier A (default read) | Tier B (narrow addition) |
|---|---|---|
| Topology, OUs, users, groups, computers, trusts, SPNs, schema | Authenticated user | Read permissions on OUs whose ACLs aren't readable by default |
| Group Policy | Read on GPOs and SYSVOL, usually default | Read on GPOs that security filtering hides |
| DNS zones and records | Often readable on AD-integrated zones | Read permission on each DNS server object for aging, scavenging and forwarders (never DnsAdmins) |
| AD CS templates and CAs | Read on the Public Key Services container (default) | Read access to each CA for `certutil -getreg`, or an administrator export |
| DHCP | The authorized-server list (default) | Membership of DHCP Users on each DHCP server |
| LDAP binding events | — | Event Log Readers on each domain controller; the directory team sets "16 LDAP Interface Events" to 2 for event 2889 (the kit never changes it) |
| SQL Server SPN and directory signals | Authenticated user | — |
| SQL Server network signal | No account: an unauthenticated UDP query | — |
| SQL Server T-SQL pass | — | A login on each instance with `VIEW SERVER STATE` (SQL Server 2019 and earlier) or `VIEW SERVER PERFORMANCE STATE` (2022 and later) for the usage DMVs; `VIEW ANY DEFINITION` (2022 and later: `VIEW ANY SECURITY DEFINITION`) to see every login, without which the login list is silently partial; `VIEW SERVER SECURITY STATE` on 2022 and later for `sys.linked_logins` |

Book 06 Runbook R03 names the same T-SQL requirement: confirm the login count against an instance you know. The Tier B items Book 00 lists that the kit doesn't collect (the CA's issued-certificate database, the Deleted Objects container contents, replication health, a native GPO backup) are best taken as administrator-run exports, which Book 02 Chapter 07 prefers to granting a right.

## Run it

```powershell
# Tier A: everything a standard account can read, plus the SPN and directory SQL signals.
.\Invoke-FMPStartKit.ps1 -OutputPath D:\Assessment

# Tier B, with the SQL Browser probe and the read-only T-SQL pass on every instance found.
.\Invoke-FMPStartKit.ps1 -OutputPath D:\Assessment -Tier B -ProbeNetwork -QueryInstances

# Only the SQL Server count, sweeping every enabled Windows Server for Express instances.
Import-Module .\powershell\FMPSqlEstate
Invoke-FMPSqlEstateDiscovery -OutputPath D:\Assessment\sql -ProbeAllServers -QueryInstances
```

Every collector is also a function you can run alone, with `-OutputPath` required. Sign the modules and run them under an `AllSigned` or `RemoteSigned` policy rather than bypassing execution policy.

## What a run writes

Everything goes under `<OutputPath>\<run-id>`, where the run identifier is Book 01's `YYYY-MM-DD-HHmm-<host>-tier<A|B>` in UTC:

```text
<run-id>\
├── AssessmentManifest.json   who, when (UTC), host, forest, the DC that served each domain,
│                             tier, parameters, PowerShell and module versions, every step's
│                             status, and the size and SHA-256 of every other file
├── Summary\        StartKitSummary.md, StartKitSummary.json
├── Preflight\      ReadAccess.json, DelegationRequest.md
├── SQL\            SqlEstate.csv, SqlEstate.json, SqlEstateSummary.json, SqlSignals.json,
│                   SqlServiceAccounts.csv, and with -QueryInstances SqlLogins.csv,
│                   SqlDatabases.csv, SqlLinkedServers.csv
├── <forest root>\  Forest\, Domains\, Schema\, PKI\, Kerberos\, DHCP\  (forest-wide)
└── <each domain>\  OUs\, GPOs\, DNS\, Objects\, ServiceAccounts\, Trusts\, Ldap\
```

The per-domain layout is Book 02 Appendix B's, so its output schema reference applies. Book 00's deliverable names map onto it: `ForestTopology.json`, `OUHierarchy.json`, `GPOInventory.json`, `DNSInventory.json`, `PKIInventory.json`, `ComputerInventory.json`, `UserInventory.json`, `GroupInventory.json`, `ServiceAccounts.csv`, `TrustMap.json`, `OUDelegations.json`, `SchemaExtensions.json` and `AssessmentManifest.json`; `PKISecurityReport.json` holds the escalation findings Book 00 calls `ESCVulnerabilities.csv`. The set is sensitive (privileged accounts, delegation, PKI weaknesses): store it encrypted and handle it under the agency's data classification policy.

## How read-only is enforced

- **No write cmdlets.** `tests/powershell/Safety.Tests.ps1` parses every script and module in the kit and fails on any command with a state-changing verb (`Set-`, `New-`, `Remove-`, `Add-`, `Enable-`, `Disable-`, `Clear-`, `Rename-`, `Move-`, `Copy-`, `Install-`, `Register-`, `Grant-`, `Revoke-`, `Reset-`, `Restore-`, `Backup-`, `Start-`, `Stop-`, `Update-`, `Publish-` and more), on `Out-File`, `Export-Csv`, `Set-Content`, `Invoke-Command`, `Invoke-Expression`, `Invoke-WebRequest` and `Invoke-RestMethod`, on any native program but `certutil.exe -getreg`, and on file redirection. A planted-violation test proves the checks catch each kind.
- **Writes only under `-OutputPath`.** Every file goes through four guarded writers that refuse any path outside a registered output root; the safety test fails if anything else writes, deletes or moves a file.
- **SELECT-only T-SQL.** Every statement lives in one catalog; `Invoke-FMPSqlQuery`, the only place T-SQL is sent, refuses anything but a single SELECT (no DML, DDL, `EXEC`, `SELECT INTO`, procedures, `OPENROWSET` or second statement), and the safety test checks every SQL string in the source and that nothing calls `ExecuteNonQuery`.
- **Provenance on every run.** The manifest is written last and hashes every other file.

## Test it

```text
pwsh -NoProfile -Command "Invoke-Pester -Path tests/powershell"
powershell -NoProfile -Command "Import-Module Pester -MinimumVersion 5.5; Invoke-Pester -Path tests/powershell"
```

Pester 5.5 or later. Windows PowerShell ships with Pester 3.4, so install Pester 5 for it (`Install-Module Pester -Scope CurrentUser -SkipPublisherCheck`). The tests mock every RSAT cmdlet, the SQL Browser reply and the T-SQL results from the fixtures, a fictional two-domain forest (`contoso.example`) with five SQL hosts, and fail if any unmocked cmdlet is called. They prove the code does what this README says against the fixtures and on both PowerShell editions. They don't prove that your forest, DNS, DHCP, CAs or SQL Servers return the same shapes.

## What changed from Appendix B

[Book 02, Appendix B](../../docs/books/b02-identity/appendix-b-forest-assessment-module.md) prints the `FMPADAssessment` module this kit packages. Packaging it as tested files changed:

| Area | Appendix B | The kit | Why |
|---|---|---|---|
| PowerShell 5.1 | `Key = if (...) { ... }` with no `else` inside a hashtable | `Key = $(if (...) { ... })` | Windows PowerShell 5.1 can't parse the first form, and the module declares 5.1 |
| Trust attributes | `[ordered]` dictionary indexed with the flag value | Plain hashtable | Indexing an ordered dictionary with an integer reads by position: `0x8` decoded as `UsesAESKeys` |
| GPO conflicts | `$node.Name` | The node's own `<Name>` child | Without one, `$node.Name` is the tag name, so unrelated unnamed settings were reported as conflicts |
| Output path | Default `D:\FMP\Assessment` | `-OutputPath` required, guarded | Write only where the operator says |
| Writes | `New-Item`, `Out-File`, `Export-Csv`, `Get-GPOReport -Path`, `certutil -ca.cert <file>` | Guarded writers; report strings; the CA certificate from the directory's `cACertificate` attribute | One write path that can be checked |
| GPO backup | `Backup-GPO -All` by default | Not in the kit | Needs delegated backup rights; take it as an administrator export |
| Trust verification | `Test-FMPTrust` (`netdom /verify`) | Not in the kit | Needs domain administrator credentials; run it separately under just-in-time elevation |
| Gitea | Push, issues and webhook functions | Not in the kit | They write to a repository; commit the run with your own reviewed process |
| DNS server settings | One failed read stops the collector | Each server setting recorded as `NotReadable` | Scavenging and forwarders are Tier B; zones still get collected at Tier A |
| Required modules | `ActiveDirectory`, `GroupPolicy` in the manifest | Checked per collector | One missing module fails one collector |
| Added | — | `Test-FMPReadAccess`, `Get-FMPSchemaExtensions`, `Get-FMPDHCPInventory`, `Get-FMPKerberosSpnMap`, `Get-FMPLdapBindingEvent`, `Get-FMPStartKitSummary` | Book 00's twelve domains plus DHCP, LDAP bindings and the SPN map |

## Known limits

- **Not proven live.** Property names follow Microsoft's documentation and Appendix B; a module version can differ. Check `Get-GPPermission ... | Get-Member` and `Get-WinEvent` property order on your hosts before relying on those columns.
- **Event 2889 field order** (client address, identity, bind type) is the order these events are commonly parsed in; Microsoft documents the content, not the property index.
- **The SQL Browser probe** misses an instance whose Browser service is stopped, a hidden instance, or a host whose firewall drops UDP 1434. That's why it's one signal of three; `-UseDbatools` adds TCP-port probes.
- **Port-only SPNs.** `MSSQLSvc/host:1433` names no instance. The kit joins it to the instance listening on that port; failing that, it assumes the default instance for 1433 and keeps any other port as `PORT-<n>`.
- **Last-use evidence.** `sys.dm_db_index_usage_stats` is cleared when the engine restarts, so the gate retires an instance only when the uptime covers the threshold; long-horizon evidence comes from login auditing, backup history and the application portfolio (Runbook R02, Lens 1).
- **No failover-cluster detection beyond `IsClustered`.** Microsoft Entra authentication isn't supported on failover cluster instances; flag them from your cluster inventory (Runbook R03).
- **Not covered:** RADIUS and NPS (Book 09), transaction profiles (Book 01 Chapter 10), the plan generators, and ESC patterns beyond ESC1, 2, 4 and 6.

```
examples/start-kit/
  README.md
  Invoke-FMPStartKit.ps1                  the run: pre-flight, assessment, SQL, summary, manifest
  powershell/StartKit.Common.ps1          output guard, writers, provenance manifest
  powershell/FMPADAssessment/             Appendix B's module, packaged, plus the added collectors
  powershell/FMPSqlEstate/                SQL Server signals, T-SQL pass, fusion and counts
  tests/fixtures/                         the fictional forest and SQL estate
  tests/powershell/                       Pester 5: safety, SQL, AD, end to end
```
