# Research gaps

Open questions found while writing *Building SQL Server Identity* on November 24, 2026, merged from the three files that first held them (Chapters 01 to 03, 04 to 06 and 07 to 10). The same day the kit (`examples/sql-server-identity`) was fixed (89 Pester tests pass) and every chapter brought in line with it; each gap those fixes closed is marked **Resolved Nov 24, 2026** with how. The rest are open: each needs a decision, a test or a kit change before the chapter it names is approved. Kit items describe the code as it stands after the fixes.

## Chapters 01 to 03

| # | Gap | Where it shows | Status |
|---|---|---|---|
| G-01-1 | `Export-SqlArcSnapshot.ps1` didn't parse (`"Wrote $OutputPath: …"` read as a scope-qualified variable) | Chapter 03, Lab 2, step 2 | **Resolved Nov 24, 2026:** the line reads `$($OutputPath):`; every `.ps1` in the kit parses (PowerShell parser, no errors) |
| G-01-2 | The Arc snapshot's Resource Graph queries projected no `id`, so `Search-AzGraph` returned no skip token and stopped at 1,000 rows | Chapter 03, Dangers | **Resolved Nov 24, 2026:** each query projects `id` and ends `order by id asc`, as Module 4 does; the Dangers row says the snapshot pages |
| G-01-3 | Who converts the SQL Server engine's service account: the kit's text said Building Non-Person Identity, which hands SQL Server accounts to the Data Platform plan | Chapter 02, The code | **Resolved Nov 24, 2026:** the brief and the kit now agree with NPI: the Data Platform project converts it, by the service account guide's method; the finding reads "… is a user account with a password: the Data Platform project converts it (service account guide)" |
| G-01-4 | `Export-SqlAuditSnapshot.ps1` stated too few rights (`VIEW SERVER SECURITY STATE` and `CONNECT ANY DATABASE` missing) and stopped at the first unreadable database | Chapter 02, Lab 2 | **Resolved Nov 24, 2026:** the help names both; a database it can't read is skipped with a `Skipped database …` warning. Chapter 02's and Chapter 09's prerequisites list the rights. The kit README's Requirements line still lists only the narrower rights |
| G-01-5 | Both exporters cut instance names to the host, so a default and a named instance on one host collided | Chapters 02 and 03, Lab 2 | **Resolved Nov 24, 2026:** the audit snapshot keeps `SERVERPROPERTY('ServerName')` whole and the Arc snapshot turns the resource name's `HOST_INSTANCE` into `HOST\INSTANCE` (not `properties.instanceName`); not checked against a live named instance |
| G-01-6 | Whether Resource Graph returns the instance's Entra configuration (`properties.authentication.mode`, `sqlServerEntraIdentity` in the 2026-03-01-preview template reference, not in 2024-01-01) | Chapter 03, The code; Lab 2, step 4 | Open: read one Arc SQL Server resource in a test subscription; if the property is there, the snapshot could read it instead of a portal confirmation |
| G-01-7 | `containerResourceId`, which the snapshot uses to find an instance's host machine, isn't in Learn's current template reference (read-only properties aren't listed there) | Chapter 03, The code | Open: confirm on the Azure Arc data REST API reference (`/rest/api/azurearcdata/sql-server-instances/get` returned 404) |
| G-01-8 | The Arc check reported a failover cluster instance's agent as `not installed` (its nodes have their own names) | Chapter 03, Lab 1, step 2 | **Resolved Nov 24, 2026:** `Agent` reads `cluster: see its nodes`; Category 3 as before |
| G-01-9 | `Get-SqlAuthFinding` reported `LocalSystem` and `NT AUTHORITY\…` accounts as "a user account with a password" | Chapter 02, The code | **Resolved Nov 24, 2026:** built-in accounts get their own finding ("move the engine to a virtual account or gMSA (Book 06, Chapter 07)") |
| G-01-10 | The estate classifier has no engine start time, so it can't apply the Start Kit's rule that a retire needs the engine up for the threshold; Lab 2's conversion works around it | Chapter 01, Lab 2, step 3 | Open: an `engineStartTime` per instance in the estate shape |
| G-01-11 | No converter from the Start Kit's output to the kit's `estate.json`; Chapter 01's Lab 2 carries one as a command block | Chapter 01, Lab 2 | Open: a converter function in the kit, with a test on the Start Kit's fixture shape |
| G-01-12 | The minimum SqlServer module version for `Invoke-Sqlcmd -Encrypt Mandatory` isn't stated in the kit. Learn's `Invoke-Sqlcmd` page says `-Encrypt` is new in version 22, which Chapter 04 and Chapter 10 cite | Chapter 02, Lab 2 | Open: state the version in the kit README and the exporter's help |
| G-01-13 | WD-085 is superseded by WD-155; the module's comment (`Get-SqlArcCategory`) still names WD-028 and WD-085 | Chapter 03, The cloud | Open (kit comment only); the chapter names WD-155 |
| G-01-14 | The zombie definition: Book 06, Chapter 05 asks for no connections in 400 days, no restores consumed and a retired owning application; the kit, like R02's automated pass, retires on idle days alone or on decommissioned applications alone | Chapter 01, The code | Open: a narrower test than Chapter 05's, not a contradiction of R02; the architects' sign-off and backup history stay the guard |

## Chapters 04 to 06

### G-04-1: disabling a Windows group login (Chapter 04; kit; Book 06)

`ALTER LOGIN … DISABLE` can't deny access to a Windows group (Learn: error 15151, by design), yet the kit wrote it for type `G` logins.

**Resolved Nov 24, 2026:** `New-SqlLoginPlan` writes `DENY CONNECT SQL TO [group];` for a group's cutover and `GRANT CONNECT SQL TO [group];` for its rollback; users and SQL logins are still disabled and enabled, and nothing is dropped. Learn's "DENY Server Permissions" and "GRANT Server Permissions" pages (read Nov 24, 2026) take a login mapped to a Windows group as the grantee, list `CONNECT SQL`, and need the current database to be `master`. The day-30 fixture shows the two groups with `hasConnectSql` false. Chapter 04 explains the choice; its "don't run the group lines" warning and Chapter 10's are gone. Runbook R05 Step 4's `ALTER LOGIN [CONTOSO\jdoe] DISABLE` is a user and stays right. Not changed here: Book 06's own wording where it says to *disable* the superseded group logins (R05 Step 4's "cut over the group logins too" and Chapter 12), which could name the deny. Not tested on an instance.

### G-04-2: the `auth_scheme` value of an Entra connection (Chapter 04)

`sys.dm_exec_connections` documents `auth_scheme` only as the SQL Server or Windows scheme (read Nov 24, 2026). The day-30 fixture records Entra sessions as `SQL`. Chapter 04's Lab 2, step 6 asks the reader to record the value. Open: a pilot result written back here.

### G-04-3: the day-30 fixture and R05's order (Chapter 04; kit)

The judge's ready rows said "disable, then observe", while the day-30 snapshot already listed the legacy logins as disabled and `payroll_report` as gone.

**Resolved Nov 24, 2026:** `Test-SqlParallelRun` reads login state and reports a login already disabled or denied as "already cut over (disabled or denied): observe 30 days, then drop"; the fixture keeps `payroll_report` (disabled) and denies the two groups `CONNECT SQL`, which is R05's create, validate, disable, observe, drop.

### G-04-4: a denied group that is a `sysadmin` member (Chapter 04; Chapter 10; kit) — new

Learn's "DENY (Transact-SQL)" (read Nov 24, 2026) says `DENY` "does not apply to object owners or members of the sysadmin fixed server role". The fixture's `CONTOSO\SQL-Admins` is in `sysadmin`, and the cutover denies it `CONNECT SQL`. Whether that deny stops the group's members isn't documented for a Windows group login in `sysadmin`. Open: test with a member on a test instance; if the member still connects, the cutover for such a group also needs its `sysadmin` membership removed (and restored in the rollback), a kit change. Chapter 04 (Dangers) and Chapter 10 (step 10) tell readers to test it in the test stage.

### G-05-1: least-privileged permission for listing groups (Chapter 05)

Learn's "List groups" page (read Nov 24, 2026) shows `Group-NestingSupport.ReadWrite.All` in the least-privileged column, with `Group.ReadBasic.All` and `Group.Read.All` as higher-privileged; a write permission can't be right for a read-only lab. Chapter 05 uses `Group.Read.All`. Open: check again before approval, and whether `Group.ReadBasic.All` returns `membershipRule` and `onPremisesSamAccountName`.

### G-05-2: the dynamic rule the kit writes (Chapter 05; kit; Book 06)

The rule was the organization-code clause alone, and a group with no codes got "rule a rule on an HR-maintained code".

**Resolved Nov 24, 2026:** the rule is `(user.extensionAttribute10 -in [...]) -and (user.accountEnabled -eq true) -and (user.userType -eq "Member")`, as Chapter 17 and R07's example require; with no codes the target says to ask HR for the code before writing the rule.

### G-05-3: one group, one role (Chapter 05; kit; Book 06)

**Resolved Nov 24, 2026:** `New-SqlLoginPlan` returns `Warnings` when the mapping would give a principal more than one database role, or `db_owner` or `sysadmin`, against Book 06, Chapter 16; `New-SqlLoginPlan.ps1` prints each as `Warning: …` (three on the fixture). Chapter 05 points there; the group map itself still doesn't read roles.

### G-05-4: Pattern 4 pairing record (Chapter 05; Book 06)

Book 06, Chapter 16 records the split pair "in both descriptions and the migration record"; Runbook R07 correlates the two halves "by an extension attribute". The kit follows Chapter 16. Open: pick one mechanism.

### G-06-1: SPN forms the audit checks (Chapter 06; kit)

The audit checks only `MSSQLSvc/<host>:<port>`. Learn's SPN formats include `MSSQLSvc/<FQDN>` and `MSSQLSvc/<FQDN>:<instancename>`, and R06 adds the short-name form where clients use it. Open.

### G-06-2: local sessions in the live snapshot (Chapter 06; kit)

`Export-SqlAuditSnapshot.ps1` marks a session local only when `client_net_address` is `<local machine>`, a value Learn's column description doesn't list; a loopback TCP connection may not show it. Open: confirm on a test instance (the kit README lists it as a known limit).

### G-06-3: virtual accounts and the computer account (Chapter 06; kit)

**Resolved Nov 24, 2026:** for a service account under `NT SERVICE\` or `NT AUTHORITY\`, `Get-SqlNtlmFinding` expects the SPN on `DOMAIN\HOST$`, built from the estate's `netbiosDomain` (fixture: `CONTOSO`). Chapter 06's Lab 2 writes `netbiosDomain` into its estate file.

### G-06-4: an empty SPN list (Chapter 06; kit)

**Resolved Nov 24, 2026:** `-Spns` takes `[AllowEmptyCollection()]`; every instance is then reported as missing its SPN.

### G-06-5: "Trace each client below" (Chapter 06; kit)

**Resolved Nov 24, 2026:** the fix text is "Find each client (the clients rows, or sys.dm_exec_connections client_net_address); local sessions are excluded".

## Chapters 07 to 10

### G-07-1: the Entra login name for an Arc server's managed identity (Chapter 07, Lab 2)

Book 06 Chapter 19 says the login is created from "the server's identity"; Learn's tutorial says an application's login uses "the name of the Microsoft Entra object". Open: confirm the display name Entra gives an Arc server's system-assigned identity, on a test server.

### G-07-2: an IIS application pool in the Hybrid Agent Extension Applications group (Chapter 07, Lab 2)

Learn names the group and says its members can get the token; it doesn't show adding `IIS AppPool\<name>`. Open: test `Add-LocalGroupMember` with an application pool identity and the token request from that pool.

### G-07-3: the kit's targets for non-Arc hosts (Chapter 07; kit)

**Resolved Nov 24, 2026:** off Arc or Azure, `Find-SqlConnectionString` gives the family's `servicePrincipalKeyword` (new in `config/drivers.json`), for `Microsoft.Data.SqlClient` "Authentication=Active Directory Service Principal (no managed identity off Arc; certificate preferred, Book 06 Ch 19)", never `Active Directory Default`. The fixtures don't exercise the branch.

### G-08-1: the kit's "AD CS decommission" wording against Book 07 (Chapter 08; kit)

**Resolved Nov 24, 2026:** the action text follows Book 06 Ch 22 and Book 07 Ch 04 (TLS: retained AD CS through the CLM platform, move before this CA is retired; login and endpoint: not renewed by the platform, replace or re-map; client-auth: NTLM interim, depends on the domain controllers' certificates). `Invoke-SqlCertDependency.ps1`'s last line still prints "Blocking an AD CS decommission: N of M", which Chapter 08 keeps and explains; the script's synopsis still says "re-issue or replace before that CA is decommissioned" (G-10-6).

### G-08-2: `KeySpec` in the certificate inventory (Chapter 08; kit)

Book 06 Chapter 22 asks to prove `KeySpec = 1` before the lifecycle platform renews SQL Server's certificate; the inventory shape has no `KeySpec`. Open: add it, read from the host in Lab 2 step 2.

### G-09-1: SQL Server 2025 with `IsExternalAuthenticationOnly` null (Chapter 09; kit)

**Resolved Nov 24, 2026:** `Get-SqlClosureRecord` needs `IsExternalAuthenticationOnly = 1` on SQL Server 2025, so an unreported (null) value is `NOT MET`.

### G-09-2: the scheduled reader's own Windows login (Chapter 09; kit)

**Resolved Nov 24, 2026 (kit):** `Export-SqlAuditSnapshot.ps1` takes an optional `-AccessToken` (string or `SecureString`), so the reader can be an Entra workload identity. Chapter 09's Lab 2 explains the token path and keeps the gMSA with a dated exception; how a scheduled task on the job host gets the token, and the token path itself, aren't tested.

### G-09-3: gMSA scheduled tasks with `-LogonType Password` (Chapter 09, Lab 2)

Microsoft's example uses it; the cmdlet page doesn't say which logon type a gMSA needs. Open: confirm on a test host.

### G-10-1: sealing dry runs (Chapter 10; kit)

**Resolved Nov 24, 2026:** `Add-SqlEvidenceRecord` and `deploy/Invoke-SqlEvidence.ps1` require `-Instance`, record each run's mode, and refuse a stage whose `DEPLOY` runs weren't `applied` unless `-Rehearsal` (recorded as a rehearsal). PF-06 accepts only a non-rehearsal test record for the same instance. Chapter 10's manual mode check is gone; it shows the refusals, the rehearsal seal and production preflight failing PF-06. PF-06 still matches stage and instance, not the change; the chapter has the reader confirm the record against the change record.

### G-10-2: the deployer's rights in preflight (Chapter 10; kit)

**Resolved Nov 24, 2026 (wording):** PRE's title no longer names the deployer's rights ("Preflight: settings, cloud, Arc eligibility, mapping, break-glass, sa and the earlier stage's evidence"), and `Test-SqlPreflight.ps1`'s help says Chapter 10 checks them by hand, which it does with `IS_SRVROLEMEMBER` and `HAS_PERMS_BY_NAME`. A PF check that reads them would still be an improvement.

### G-10-3: `-AccessToken` as a string (Chapter 10; kit)

**Resolved Nov 24, 2026:** `Invoke-SqlDeploy.ps1` and `Invoke-SqlRollback.ps1` declare `[object]$AccessToken` and convert a `SecureString`; Chapter 10 says either form works.

### G-10-4: group logins in the cutover (Chapter 10)

**Resolved Nov 24, 2026:** as G-04-1. The `sysadmin` group question is G-04-4.

### G-10-5: entry scripts write relative to the process folder, not PowerShell's (kit) — new

Found re-running Chapter 10 on November 24, 2026. The entry scripts and module write with .NET (`[IO.File]::WriteAllText` in `Write-SqlOutput`, `Write-SqlManifest`, `New-SqlLoginPlan.ps1`, `New-SqlDeploymentPlan.ps1`, `Invoke-SqlNtlmAudit.ps1` and both exporters; `AppendAllText` in `Add-SqlEvidenceRecord`). A relative `-OutputPath` resolves against the process's working directory, which `cd`/`Set-Location` doesn't change. A reader who opens PowerShell elsewhere and changes to `examples/sql-server-identity`, as every lab says, gets "Could not find a part of the path" and no output (reproduced: `pwsh` started in another folder, `Set-Location` to the kit, `./Invoke-SqlEstate.ps1 … -OutputPath out/cwdtest` fails). The captures pass only because `scripts/kit_captures.py` starts `pwsh` in the kit folder. Open: a kit change to resolve each path through PowerShell (`$ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath`) before calling .NET, and a test that runs a script after `Set-Location`.

### G-10-6: kit help text that predates the fixes (kit) — new

Open, wording only: `deploy/Invoke-SqlDeploy.ps1`'s description says "the cutover disables, and Invoke-SqlRollback.ps1 re-enables" (groups are denied and granted); `New-SqlLoginPlan.ps1`'s synopsis says the cutover "disables" and the rollback "re-enables"; `Invoke-SqlCertDependency.ps1`'s synopsis says "re-issue or replace before that CA is decommissioned"; `Compare-SqlAuditRun.ps1`'s synopsis lists the regressions without `Arc regressed` (its parameter help does name it); the kit README's Requirements line lists the narrower read rights (G-01-4).

### G-10-7: preflight and a mode changed without a restart (Chapter 10; kit)

PF-07 now warns on `sa`, but no PF check reads a `Mode anomaly` (the registry `LoginMode` against the running mode). Open: Chapter 10 keeps "resolve every `highest` and `high` finding first"; a PF warning would make it visible in the run.
