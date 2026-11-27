---
title: "Data Platform, Module 6: NTLM and the SPNs"
subtitle: "Find every reason an instance's connections use NTLM or fail Kerberos, and write each SPN fix for review instead of running it"
description: "Module 6 of the Data Platform and SQL Server Identity learning path. You learn the connection patterns that generate NTLM at the SQL layer, why a misplaced or duplicate SPN fails instead of falling back, and why only remote connections count. Lab 1 runs the kit's NTLM audit on the fictional estate's day-1 and day-30 snapshots and reads the setspn fix file it writes for review. Runbook R06; workbook Chapter 06."
research-status: draft
research-type: training module
research-book: "Book 06"
series-order: 6
date-modified: 2026-11-25
review-status: approved
reviewed-sha256: 5dfd2cbec363bca1969a403ba0ea3aa284fbf50f51864bd5cea86f0d353be0c7
last-reviewed: 2026-11-25
---
# Data Platform, Module 6: NTLM and the SPNs {.unnumbered}

**Learning path:** [Data Platform and SQL Server Identity](index.md) · Module 6 of 10 · 50 minutes · Runbook [R06](../../books/b06-data-platform/r06-ntlm-detection-and-remediation.md) · Workbook [Chapter 06](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-dp-module-6) · [▶ Watch](../../presentations/watch.html?v=Training_DP_Module_6_Narrated) (about 12 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_DP_Module_6_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-dp-module-6/Training_DP_Module_6_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-dp-module-6/Training_DP_Module_6_Narrated.vtt).

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

You can't remove NTLM you haven't found, and most of what you find is a missing or misplaced name. Windows Authentication tries Kerberos first; when the client can't get a ticket for the instance's SPN, it uses NTLM, and when the SPN sits on the wrong account, authentication fails outright. In this module you list, per instance, every reason its connections use NTLM or fail Kerberos, with the `setspn` line that would fix each SPN problem, ready for a change window.

**The federal requirement.** [Chapter 06's federal requirements and evidence table](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#federal-requirements-and-evidence) maps the audit and fix plan to NIST SP 800-53 CM-6, with KSI-SVC-ACM, and to IA-2, which has no KSI pairing in the kit. Runbook R06's [control states, change safety and evidence](../../books/b06-data-platform/r06-ntlm-detection-and-remediation.md#b06-r06-control-states) lists the evidence for each remediation state, from the reviewed plan to the `klist` and `auth_scheme` test records. Each table's KSI column names the FedRAMP 20x Key Security Indicators to line your evidence up with; your cloud providers report against them, the agency doesn't. The kit's records support these controls; the assessor decides whether each one is in place.

### Learning objectives

In this module, you'll:

- Name the patterns that make SQL Server connections use NTLM, and the two SPN problems that fail instead of falling back.
- Explain why local connections are left out of the count.
- Run the kit's NTLM audit over fixtures on day 1 and day 30 and read its findings.
- Read the fix file and say why nothing in it has run.

### Prerequisites

- [Module 5](05-groups-roles-and-the-perimeter.md).
- [Module 2](02-the-authentication-audit.md): the audit snapshots this module reads.

## Unit 2: The patterns that generate NTLM

*10 minutes*

Book 06, Chapter 14, *NTLMv1, NTLMv2 and the Patterns That Generate NTLM*, names four patterns at the SQL layer: a missing or incorrect SPN, cross-site connections that can't reach a domain controller, linked-server passthrough, and clients that aren't domain-joined. Its triage point matters most: an SPN on the wrong account doesn't fall back to NTLM, it fails, and a duplicate SPN breaks Kerberos too. Even with a correct SPN, local connections use NTLM, so you judge only remote ones. A linked server that passes the caller's credentials needs Kerberos delegation, because NTLM can't make the second hop. Read:

- Book 06, Chapter 14: [Pattern One: missing or incorrect SPN](../../books/b06-data-platform/14-ntlm-and-the-patterns-that-generate-it.md#pattern-one-missing-or-incorrect-spn), [Pattern Two: cross-site connections](../../books/b06-data-platform/14-ntlm-and-the-patterns-that-generate-it.md#pattern-two-cross-site-connections), [Pattern Three: linked-server passthrough authentication](../../books/b06-data-platform/14-ntlm-and-the-patterns-that-generate-it.md#pattern-three-linked-server-passthrough-authentication) and [Pattern Four: non-domain-joined application hosts](../../books/b06-data-platform/14-ntlm-and-the-patterns-that-generate-it.md#pattern-four-non-domain-joined-application-hosts).
- [Chapter 06: what Microsoft gives you](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#what-microsoft-gives-you), for the SPN formats and the table of what happens for each SPN state.

## Unit 3: Discovery first, fixes for review

*10 minutes*

Book 06, Chapter 15, *The Three Phases of NTLM Elimination for SQL Server*, starts with discovery: the authentication audit, Windows logging and `auth_scheme` per connection make the baseline that later phases measure against. The kit's NTLM audit joins the audit snapshot, the estate, the domain's `MSSQLSvc` SPNs, linked servers and client records, builds the expected TCP SPN for each instance, and compares it with who holds it. For a virtual or built-in service account it expects the SPN on the computer account. It writes each `setspn` fix to a file for review and never runs it; Runbook R06 puts each change in a window with its back-out. Two patterns aren't detected: cross-site connections look like a missing SPN in this data, and only the TCP SPN form is checked. Read:

- Book 06, Chapter 15: [Phase A — discovery](../../books/b06-data-platform/15-the-three-phases-of-ntlm-elimination.md#phase-a-discovery).
- Runbook R06: [Phase 1 — Detection](../../books/b06-data-platform/r06-ntlm-detection-and-remediation.md#phase-1-detection-read-only), [repair a collision](../../books/b06-data-platform/r06-ntlm-detection-and-remediation.md#repair-a-collision) and [linked-server passthrough](../../books/b06-data-platform/r06-ntlm-detection-and-remediation.md#linked-server-passthrough).
- [Chapter 06: what it leaves to you](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#what-it-leaves-to-you), [the NTLM audit](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#the-ntlm-audit) and [dangers](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#dangers).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*20 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\data-platform-06-ntlm-and-the-spns\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Run the audit on day 1
./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath "$Run\ntlm"

# Step 2: Read the fix file
Get-Content "$Run\ntlm\spn-fixes.txt"

# Step 3: Read every fix, including the ones that aren't setspn
Import-Csv "$Run\ntlm\ntlm.csv" | Format-Table Instance, Pattern, Fix | Out-String -Width 400

# Step 4: Run it on day 30
./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath "$Run\ntlm-day30"

# Step 5: Open the manifest
Get-Content "$Run\ntlm\manifest.json"

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 06*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# Step 7: List your runs
Get-ChildItem C:\FMWLabs\results\data-platform-06-ntlm-and-the-spns\lab1 -Name
```

:::

<!-- labs:end -->

You run the workbook chapter's Lab 1 on the kit's fictional estate. [Chapter 06, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#lab-1-fixtures-no-tenant) explains each result in more depth.

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, maximize the window (a narrow window wraps or cuts the widest table columns), then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\data-platform-06-ntlm-and-the-spns\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\data-platform-06-ntlm-and-the-spns\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Run the audit on day 1.** Seven findings on four instances:

   ```powershell
   ./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath "$Run\ntlm"
   ```

   ```text
   Instance Pattern                   Effect
   -------- -------                   ------
   SQLPRD01 Remote NTLM observed      41 remote NTLM sessions in the sample
   SQLPRD02 Missing SPN               Remote connections fall back to NTLM
   SQLFCI04 SPN on the wrong account  Held by CONTOSO\svc-oldsql, service runs as CONTOSO\svc-sqlfci04: authentication fails
   SQLPRD06 Duplicate SPN             Held by CONTOSO\gmsa-sqlprd06$ and CONTOSO\SQLPRD06$: Kerberos can't choose
   SQLPRD06 Remote NTLM observed      6 remote NTLM sessions in the sample
   SQLPRD01 Linked-server passthrough Calls to SQLLEG03 pass the caller's credentials: NTLM unless delegation is set
   SQLPRD06 Non-domain-joined client  dmz-web01 (192.0.2.15) can't get a Kerberos ticket

   Wrote 3 files and manifest.json to C:/FMWLabs/results/data-platform-06-ntlm-and-the-spns/lab1/<run>/ntlm
   Evidence for NTLM (Find the NTLM patterns and plan the SPN fixes): IA-2, CM-6; KSI-SVC-ACM
   SPN fixes to review: 4, in C:/FMWLabs/results/data-platform-06-ntlm-and-the-spns/lab1/<run>/ntlm/spn-fixes.txt
   ```

   SQLPRD01's SPN is correct, yet 41 sessions from `CONTOSO\svc-payroll` use NTLM. The client file shows that host is domain-joined, so look on the client side: [Chapter 14](../../books/b06-data-platform/14-ntlm-and-the-patterns-that-generate-it.md) names aliases, HOSTS entries, DNS and old drivers. The kit doesn't write a client row for it.

2. **Read the fix file.** Four lines for three instances; nothing has run:

   ```powershell
   Get-Content "$Run\ntlm\spn-fixes.txt"
   ```

   ```text
   # Review each line; run with Domain Admin rights in a change window. Nothing here has run.
   setspn -S MSSQLSvc/sqlprd02.contoso.example:1433 CONTOSO\svc-sqlprd02
   setspn -D MSSQLSvc/sqlfci04.contoso.example:1433 CONTOSO\svc-oldsql
   setspn -S MSSQLSvc/sqlfci04.contoso.example:1433 CONTOSO\svc-sqlfci04
   setspn -D MSSQLSvc/sqlprd06.contoso.example:1433 CONTOSO\SQLPRD06$
   ```

   On SQLPRD06 the SPN stays with the gMSA the service runs as and leaves the computer account.

3. **Read every fix, including the ones that aren't `setspn`:**

   ```powershell
   Import-Csv "$Run\ntlm\ntlm.csv" | Format-Table Instance, Pattern, Fix | Out-String -Width 400
   ```

   ```text
   Instance Pattern                   Fix
   -------- -------                   ---
   SQLPRD01 Remote NTLM observed      Find each client (the clients rows, or sys.dm_exec_connections client_net_address); local sessions are excluded
   SQLPRD02 Missing SPN               setspn -S MSSQLSvc/sqlprd02.contoso.example:1433 CONTOSO\svc-sqlprd02
   SQLFCI04 SPN on the wrong account  setspn -D MSSQLSvc/sqlfci04.contoso.example:1433 CONTOSO\svc-oldsql; setspn -S MSSQLSvc/sqlfci04.contoso.example:1433 CONTOSO\svc-sqlfci04
   SQLPRD06 Duplicate SPN             setspn -D MSSQLSvc/sqlprd06.contoso.example:1433 CONTOSO\SQLPRD06$
   SQLPRD06 Remote NTLM observed      Find each client (the clients rows, or sys.dm_exec_connections client_net_address); local sessions are excluded
   SQLPRD01 Linked-server passthrough Constrained delegation, a mapped login, or the SQL Server 2025 managed-identity linked server
   SQLPRD06 Non-domain-joined client  Move CONTOSO\Reports-Readers to an Entra login with a token-based connection (Chapter 07)
   ```

4. **Run it on day 30.** SQLPRD01's remote NTLM is gone: its logins moved to Entra in Chapter 04. The SPN problems on the other instances are still there, because nobody ran the fixes:

   ```powershell
   ./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath "$Run\ntlm-day30"
   ```

   ```text
   Instance Pattern                   Effect
   -------- -------                   ------
   SQLPRD02 Missing SPN               Remote connections fall back to NTLM
   SQLFCI04 SPN on the wrong account  Held by CONTOSO\svc-oldsql, service runs as CONTOSO\svc-sqlfci04: authentication fails
   SQLPRD06 Duplicate SPN             Held by CONTOSO\gmsa-sqlprd06$ and CONTOSO\SQLPRD06$: Kerberos can't choose
   SQLPRD06 Remote NTLM observed      6 remote NTLM sessions in the sample
   SQLPRD01 Linked-server passthrough Calls to SQLLEG03 pass the caller's credentials: NTLM unless delegation is set
   SQLPRD06 Non-domain-joined client  dmz-web01 (192.0.2.15) can't get a Kerberos ticket

   Wrote 3 files and manifest.json to C:/FMWLabs/results/data-platform-06-ntlm-and-the-spns/lab1/<run>/ntlm-day30
   Evidence for NTLM (Find the NTLM patterns and plan the SPN fixes): IA-2, CM-6; KSI-SVC-ACM
   SPN fixes to review: 4, in C:/FMWLabs/results/data-platform-06-ntlm-and-the-spns/lab1/<run>/ntlm-day30/spn-fixes.txt
   ```

   The linked-server and client findings come from the same fixture files on both days.

5. **Open the manifest.** The fix file is hashed with the findings, so the lines a change board approves are the lines that run:

   ```powershell
   Get-Content "$Run\ntlm\manifest.json"
   ```

   ```text
   {
     "step": "NTLM",
     "title": "Find the NTLM patterns and plan the SPN fixes",
     "mode": "read-only",
     "asOf": "2026-11-20",
     "controls": [
       "IA-2",
       "CM-6"
     ],
     "ksis": [
       "KSI-SVC-ACM"
     ],
     "files": [
       {
         "file": "ntlm.csv",
         "sha256": "42c98c3f64661de7c2940a4d6823818e5da9742e877064718cef3f688c5b285e"
       },
       {
         "file": "ntlm.json",
         "sha256": "662a82a45a542c34cb44b20b55c595a6624a1267a8f7b1ba30685e08c27b374f"
       },
       {
         "file": "spn-fixes.txt",
         "sha256": "5e1709df086a9db913f7a34eaae5231f1057ac361a368cc34b411d872536e521"
       }
     ]
   }
   ```

6. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 06*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             7           0
   ```

7. **List your runs.** Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

   ```powershell
   Get-ChildItem C:\FMWLabs\results\data-platform-06-ntlm-and-the-spns\lab1 -Name
   ```

   Expected output: one line per run, oldest first, the last one this run:

   ```text
   <run>
   ```

**Check your work:** you can say, for each of the fictional instances, why its connections use NTLM or fail Kerberos, and which reviewed `setspn` line would fix each SPN problem.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Query a test domain's SPNs read-only with `setspn`, snapshot a test instance, write the audit's other inputs, and run the audit. The SPN fix in step 6 is a change: run it only in an approved window, with its back-out line ready, then check `auth_scheme` and `klist` from a client. Follow [Chapter 06, Lab 2](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#lab-2-a-test-instance).

- **You need:** a test domain and a test instance, never production; PowerShell 7 on a domain-joined Windows machine that isn't the SQL Server host, with `setspn`, the `ActiveDirectory` module and the `SqlServer` module (version 22 or later); a Windows login on the instance with the read rights `Export-SqlAuditSnapshot.ps1` states; and a certificate the client trusts.
- **Back it out:** steps 1 to 5 change nothing. If step 6 ran and the window's checks failed, its `setspn -D` line restores the old state; step 7 deletes `out/lab2`.

## Unit 6: Knowledge check

*5 minutes*

1. On SQLFCI04 the SPN is held by `CONTOSO\svc-oldsql`, but the service runs as `CONTOSO\svc-sqlfci04`. What happens to remote connections?
   a. They fall back to NTLM.
   b. Authentication fails.
   c. They use Kerberos with the old account.

2. On SQLPRD06 the SPN is held by both the gMSA the service runs as and the computer account. Which line does the fix file write?
   a. `setspn -D` from the computer account, `CONTOSO\SQLPRD06$`, so the SPN stays with the gMSA.
   b. `setspn -D` from the gMSA, so the SPN stays with the computer account.
   c. `setspn -X`, to search the forest.

3. What has happened to the lines in `spn-fixes.txt` when the audit finishes?
   a. They have run against the domain.
   b. Nothing in the file has run; each line is reviewed and run in a change window, with its back-out.
   c. They ran in dry-run mode only.

4. Why does Lab 2 measure from a machine that isn't the SQL Server host?
   a. The host has no `setspn`.
   b. A connection made on the server itself always reports NTLM, even when Kerberos is set up correctly.
   c. The `SqlServer` module can't run on the host.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** An SPN on the wrong account fails rather than falls back. See Book 06, [Chapter 14: Pattern One](../../books/b06-data-platform/14-ntlm-and-the-patterns-that-generate-it.md#pattern-one-missing-or-incorrect-spn) and step 1 of [Chapter 06, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#lab-1-fixtures-no-tenant).
2. **a.** See step 2 of [Chapter 06, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#lab-1-fixtures-no-tenant) and [Chapter 06: dangers](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#dangers).
3. **b.** See [Chapter 06: the NTLM audit](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#the-ntlm-audit) and Runbook R06's [control states, change safety and evidence](../../books/b06-data-platform/r06-ntlm-detection-and-remediation.md#b06-r06-control-states).
4. **b.** See [Chapter 06: what Microsoft gives you](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#what-microsoft-gives-you) and [Chapter 06: dangers](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#dangers).
:::

## Unit 7: Summary

*2 minutes*

You found the missing, misplaced and duplicate SPNs, the remote NTLM, the linked-server passthrough and the client off the domain in the fictional estate, and saw that the SPN problems stay until someone runs the reviewed fixes. The fix file is hashed with the findings, so the lines a change board approves are the lines that run.

**Evidence an ISSO keeps from this module:** `ntlm.csv` and `spn-fixes.txt` with `manifest.json`, which records the SHA-256 of each file; the change record for each `setspn` line that ran; and the `auth_scheme` and `klist` record from a remote client after each fix (Chapter 06). Before shipping, work through the [Chapter 06 checklist](../../project-plans/developer-workbooks/sql-server-identity/06-ntlm-and-the-spns.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 5](05-groups-roles-and-the-perimeter.md) · [Learning path](index.md) · [Next: Module 7, The application chain →](07-the-application-chain.md)
:::
