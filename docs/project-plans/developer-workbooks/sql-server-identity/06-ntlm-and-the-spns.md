---
title: "Chapter 06 — NTLM and the SPNs"
description: "Runbook R06's detection phase as code: an NTLM audit that joins the audit snapshot, the estate, the domain's MSSQLSvc SPNs, linked servers and client records, and names each pattern that makes SQL Server connections use NTLM or fail: a missing SPN, an SPN on the wrong account, a duplicate SPN, remote NTLM sessions, linked-server passthrough and clients that aren't domain-joined. The setspn fixes are written to a file for review, never run. Labs on the fictional estate, then read-only setspn queries and a snapshot of a test instance."
doc-type: workbook-chapter
audience: [Technical]
family: dw-sql-server-identity
part: How
series-order: 6
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: e994bd6fabd054c6815b932dfbb02c07960d215f31eb651d6589e15069afd201
last-reviewed: 2026-11-25
---
# Chapter 06 — NTLM and the SPNs

*You can't remove NTLM you haven't found, and most of what you find is a missing or misplaced name.*

::: {.callout-note}
## In this chapter
The code behind [Book 06, Chapter 14](../../../books/b06-data-platform/14-ntlm-and-the-patterns-that-generate-it.md)'s connection patterns, the discovery phase of [Chapter 15](../../../books/b06-data-platform/15-the-three-phases-of-ntlm-elimination.md), and [Runbook R06](../../../books/b06-data-platform/r06-ntlm-detection-and-remediation.md). You start with what Learn gives you: the SPN formats, the table of what happens for each SPN state, and `setspn`. Then you read the kit's NTLM audit and the fix file it writes. Lab 1 runs it on the fictional estate's day-1 and day-30 snapshots. Lab 2 queries a test domain's SPNs read-only, snapshots a test instance, runs the audit, and shows the SPN fix as a change with its back-out.
:::

## Goal and audience

**Goal.** By the end of this chapter you can list, per instance, every reason its connections use NTLM or fail Kerberos, with the `setspn` line that would fix each SPN problem, ready for a change window.

**Audience.** Developers who build or maintain the kit, the DBA who owns the instance, and the directory administrator who owns SPNs. You don't need a domain until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

Windows Authentication tries Kerberos first. The client builds an SPN for the instance; if it can't get a ticket for it, authentication uses NTLM. For TCP the SPN is `MSSQLSvc/<FQDN>:<port>`; for other protocols it's `MSSQLSvc/<FQDN>` (default instance) or `MSSQLSvc/<FQDN>:<instancename>` (named instance), registered on the account the service runs under.[^sq06-spn] Learn's authentication-defaults table is the triage key:[^sq06-spn]

| SPN state | What happens |
|---|---|
| Maps to the account the service runs under | Local connections use NTLM; remote connections use Kerberos |
| Maps to an incorrect account | Authentication fails |
| Lookup fails, or no SPN | Local and remote connections use NTLM |

A connection made on the server itself always reports NTLM, even when Kerberos is set up correctly, so judge only remote connections.[^sq06-auth-type] A misplaced SPN is moved with `setspn -D` from the wrong account.[^sq06-misplaced] `setspn -S` adds an SPN after checking for duplicates, `-D` deletes, `-L` lists an account's SPNs, `-Q` queries, `-X` searches for duplicates and `-F` widens to the forest.[^sq06-setspn] `sys.linked_logins` records whether a linked server login passes the caller's own credentials (`uses_self_credential`).[^sq06-linked-logins] `klist purge` and `klist get` clear and request Kerberos tickets on a client.[^sq06-klist]

### What it leaves to you

Each row is pinned by a test in the `Chapter 06` block of `tests/SqlIdentity.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| A table of SPN states and outcomes | Nobody joins the SPN list to the account each instance runs under | `Get-SqlNtlmFinding`: the expected TCP SPN per instance, compared with who holds it |
| "Authentication fails" for a misplaced SPN | It shows as an error, not as NTLM, and is triaged as a different problem | Missing, wrong-account and duplicate SPNs as separate patterns, each with its effect |
| `setspn` switches | A fix typed in the change window is a fix nobody reviewed | `spn-fixes.txt`: each `setspn -S` and `-D` line, written for review, never run |
| Local connections report NTLM | Counting them hides the real remote NTLM, or invents it | Remote sessions only |
| `uses_self_credential` | Passthrough is a double hop that NTLM can't make | A linked-server passthrough finding with R06's options |
| Nothing about client state | A client off the domain can't get a ticket | A finding for each remote NTLM client that isn't domain-joined |

## The code

### The NTLM audit

`Get-SqlNtlmFinding` takes the audit snapshot (each instance's service account, port and connection sample), the estate (each instance's host), the SPN list (`spns.json`: one row per SPN and the account that holds it), the linked servers and the client records. For each instance it builds `MSSQLSvc/<host>:<port>` and reports:

| Pattern | When | Fix the kit writes |
|---|---|---|
| Missing SPN | Nobody holds the SPN | `setspn -S <spn> <service account>` |
| SPN on the wrong account | One account holds it, not the service account | `setspn -D` from that account, then `setspn -S` on the service account |
| Duplicate SPN | Two or more accounts hold it | `setspn -D` from each account that isn't the service account |
| Remote NTLM observed | Remote sessions with `auth_scheme` NTLM | Find each client (the clients rows, or `sys.dm_exec_connections` `client_net_address`); local sessions are excluded |
| Linked-server passthrough | `usesSelfCredential` true | Constrained delegation, a mapped login, or the SQL Server 2025 managed-identity linked server |
| Non-domain-joined client | A client record with `domainJoined` false | Move the principal to an Entra login with a token-based connection ([Chapter 07](07-the-application-chain.md)) |

The account the SPN belongs on is the service account, with one exception. A virtual account (`NT SERVICE\…`) or a built-in account (`NT AUTHORITY\…`) presents the computer account on the network, so for those the kit expects the SPN on `DOMAIN\HOST$`, built from the estate's `netbiosDomain` (the fixture's is `CONTOSO`; without it, the first label of `domain`, upper-cased) and the host's short name. The SPN list may be empty, as in a test domain with no `MSSQLSvc` SPN at all: every instance is then reported as missing its SPN.

`Invoke-SqlNtlmAudit.ps1` writes `ntlm.csv`, `ntlm.json`, `spn-fixes.txt` and `manifest.json`. The fix file starts with a line saying nothing in it has run.

Two of Chapter 14's patterns aren't detected. Cross-site connections, where a client can't reach a domain controller, look like a missing SPN in this data; confirm with `klist` before changing anything. And only the TCP form of the SPN is checked: an instance reached by named pipes or by a short host name needs its other forms checked by hand. Linked servers and client records come from files you fill in; `Export-SqlAuditSnapshot.ps1` doesn't read them.

::: {.callout-important}
## Illustrative code
Lab 1 reads fixtures; nothing connects. Tested against fixtures, not a live domain or instance. `spn-fixes.txt` changes the directory when someone runs it; nothing in the kit does.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\sql-server-identity-06\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Run the audit on day 1
./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath "$Run/ntlm"

# Step 2: Read the fix file
Get-Content "$Run/ntlm/spn-fixes.txt"

# Step 3: Read every fix, including the ones that aren't setspn
Import-Csv "$Run/ntlm/ntlm.csv" | Format-Table Instance, Pattern, Fix | Out-String -Width 400

# Step 4: Run it on day 30
./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath "$Run/ntlm-day30"

# Step 5: Open the manifest
Get-Content "$Run/ntlm/manifest.json"

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 06*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# After the steps
Get-ChildItem C:\FMWLabs\results\sql-server-identity-06\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped `sql-server-identity-code.zip` under the learning path's [Get the code](../../../training/data-platform/index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

<!-- capture:begin 06-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/06-1.txt))](captures/06-1.png){.lightbox fig-alt="Terminal window showing Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity and what it printed"}

<!-- capture:end -->

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\sql-server-identity-06\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

<!-- capture:begin 06-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/06-2.txt))](captures/06-2.png){.lightbox fig-alt="Terminal window showing $Run = 'C:\FMWLabs\results\sql-server-identity-06\lab1\$(Get-Date -AsUTC -For… and what it printed"}

<!-- capture:end -->

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\sql-server-identity-06\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Run the audit on day 1.** Seven findings on four instances:

   ```powershell
   ./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath "$Run/ntlm"
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

   Wrote 3 files and manifest.json to C:/FMWLabs/results/sql-server-identity-06/lab1/<run>/ntlm
   Evidence for NTLM (Find the NTLM patterns and plan the SPN fixes): IA-2, CM-6; KSI-SVC-ACM
   SPN fixes to review: 4, in C:/FMWLabs/results/sql-server-identity-06/lab1/<run>/ntlm/spn-fixes.txt
   ```

   <!-- capture:begin 06-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/06-3.txt))](captures/06-3.png){.lightbox fig-alt="Terminal window showing ./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day1/audit.json -Es… and what it printed"}

   <!-- capture:end -->

   SQLPRD01's SPN is correct, yet 41 sessions from `CONTOSO\svc-payroll` use NTLM. The client file shows that host is domain-joined, so look on the client side: [Chapter 14](../../../books/b06-data-platform/14-ntlm-and-the-patterns-that-generate-it.md) names aliases, HOSTS entries, DNS and old drivers. The kit doesn't write a client row for it.

2. **Read the fix file.** Four lines for three instances; nothing has run:

   ```powershell
   Get-Content "$Run/ntlm/spn-fixes.txt"
   ```

   ```text
   # Review each line; run with Domain Admin rights in a change window. Nothing here has run.
   setspn -S MSSQLSvc/sqlprd02.contoso.example:1433 CONTOSO\svc-sqlprd02
   setspn -D MSSQLSvc/sqlfci04.contoso.example:1433 CONTOSO\svc-oldsql
   setspn -S MSSQLSvc/sqlfci04.contoso.example:1433 CONTOSO\svc-sqlfci04
   setspn -D MSSQLSvc/sqlprd06.contoso.example:1433 CONTOSO\SQLPRD06$
   ```

   <!-- capture:begin 06-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/06-4.txt))](captures/06-4.png){.lightbox fig-alt="Terminal window showing Get-Content '$Run/ntlm/spn-fixes.txt' and what it printed"}

   <!-- capture:end -->

   On SQLPRD06 the SPN stays with the gMSA the service runs as and leaves the computer account.

3. **Read every fix, including the ones that aren't `setspn`:**

   ```powershell
   Import-Csv "$Run/ntlm/ntlm.csv" | Format-Table Instance, Pattern, Fix | Out-String -Width 400
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

   <!-- capture:begin 06-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/06-5.txt))](captures/06-5.png){.lightbox fig-alt="Terminal window showing Import-Csv '$Run/ntlm/ntlm.csv' | Format-Table Instance, Pattern, Fix | Out-S… and what it printed"}

   <!-- capture:end -->

4. **Run it on day 30.** SQLPRD01's remote NTLM is gone: its logins moved to Entra in Chapter 04. The SPN problems on the other instances are still there, because nobody ran the fixes:

   ```powershell
   ./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -EstatePath tests/fixtures/estate/estate.json -NtlmPath tests/fixtures/ntlm -OutputPath "$Run/ntlm-day30"
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

   Wrote 3 files and manifest.json to C:/FMWLabs/results/sql-server-identity-06/lab1/<run>/ntlm-day30
   Evidence for NTLM (Find the NTLM patterns and plan the SPN fixes): IA-2, CM-6; KSI-SVC-ACM
   SPN fixes to review: 4, in C:/FMWLabs/results/sql-server-identity-06/lab1/<run>/ntlm-day30/spn-fixes.txt
   ```

   <!-- capture:begin 06-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/06-6.txt))](captures/06-6.png){.lightbox fig-alt="Terminal window showing ./Invoke-SqlNtlmAudit.ps1 -AuditPath tests/fixtures/audit-day30/audit.json -E… and what it printed"}

   <!-- capture:end -->

   The linked-server and client findings come from the same fixture files on both days.

5. **Open the manifest.** The fix file is hashed with the findings, so the lines a change board approves are the lines that run:

   ```powershell
   Get-Content "$Run/ntlm/manifest.json"
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

   <!-- capture:begin 06-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/06-7.txt))](captures/06-7.png){.lightbox fig-alt="Terminal window showing Get-Content '$Run/ntlm/manifest.json' and what it printed"}

   <!-- capture:end -->

6. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 06*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             7           0
   ```

   <!-- capture:begin 06-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/06-8.txt))](captures/06-8.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 06*'… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\sql-server-identity-06\lab1 -Name
```

<!-- capture:begin 06-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/06-9.txt))](captures/06-9.png){.lightbox fig-alt="Terminal window showing Get-ChildItem C:\FMWLabs\results\sql-server-identity-06\lab1 -Name and what it printed"}

<!-- capture:end -->

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Lab 2: a test instance

**The authors haven't run this lab.** Use a test domain and a test instance, never production. Steps 1 to 5 only read. Step 6 is a change: run it only in an approved window, with its back-out ready. You need PowerShell 7 on a domain-joined Windows machine that is not the SQL Server host (local connections always report NTLM), with `setspn`, the `ActiveDirectory` module and the `SqlServer` module (version 22 or later); a Windows login on the instance with the read rights `Export-SqlAuditSnapshot.ps1` states; and a certificate the client trusts. Work in `examples/sql-server-identity`, all steps in one session. You'll replace: `<host-fqdn>` (the SQL Server host's fully qualified name), `<port>` (its TCP port) and `<service-account>` (the account the service runs as, `DOMAIN\name`).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Ask who holds the instance's SPN, and what the service account holds
setspn -Q MSSQLSvc/<host-fqdn>:<port>
setspn -L <service-account>

# Step 2: Search the domain for duplicate SPNs
setspn -X

# Step 3: Snapshot the instance, read-only
./Export-SqlAuditSnapshot.ps1 -SqlInstance '<host-fqdn>,<port>' -OutputPath out/lab2/audit.json -AsOf (Get-Date -Format yyyy-MM-dd)

# Step 4: Write the audit's other inputs
New-Item -ItemType Directory -Force out/lab2/ntlm | Out-Null
$netbios = (Get-ADDomain).NetBIOSName
$spns = Get-ADObject -LDAPFilter '(servicePrincipalName=MSSQLSvc/*)' -Properties servicePrincipalName, sAMAccountName | ForEach-Object { $acct = "$netbios\$($_.sAMAccountName)"; $_.servicePrincipalName | Where-Object { $_ -like 'MSSQLSvc/*' } | ForEach-Object { [ordered]@{ spn = $_; account = $acct } } }
[ordered]@{ spns = @($spns) } | ConvertTo-Json -Depth 4 | Set-Content out/lab2/ntlm/spns.json
'{ "linkedServers": [] }' | Set-Content out/lab2/ntlm/linked-servers.json
'{ "clients": [] }' | Set-Content out/lab2/ntlm/clients.json
$name = (Get-Content -Raw out/lab2/audit.json | ConvertFrom-Json).instances[0].name
[ordered]@{ netbiosDomain = $netbios; instances = @([ordered]@{ name = $name; host = '<host-fqdn>' }) } | ConvertTo-Json -Depth 4 | Set-Content out/lab2/estate.json

# Step 5: Run the audit
./Invoke-SqlNtlmAudit.ps1 -AuditPath out/lab2/audit.json -EstatePath out/lab2/estate.json -NtlmPath out/lab2/ntlm -OutputPath out/lab2/ntlm-result
Get-Content out/lab2/ntlm-result/spn-fixes.txt

# Step 6: The fix is a change
setspn -S MSSQLSvc/<host-fqdn>:<port> <service-account>
setspn -D MSSQLSvc/<host-fqdn>:<port> <service-account>

# Step 6: The fix is a change
klist purge
Invoke-Sqlcmd -ServerInstance '<host-fqdn>,<port>' -Query 'SELECT auth_scheme FROM sys.dm_exec_connections WHERE session_id = @@SPID;'
klist

# Step 7: Back it out
Remove-Item -Recurse -Force out/lab2
```

:::

<!-- labs:end -->

1. **Ask who holds the instance's SPN, and what the service account holds:**

   ```powershell
   setspn -Q MSSQLSvc/<host-fqdn>:<port>
   setspn -L <service-account>
   ```

2. **Search the domain for duplicate SPNs:**

   ```powershell
   setspn -X
   ```

3. **Snapshot the instance, read-only:**

   ```powershell
   ./Export-SqlAuditSnapshot.ps1 -SqlInstance '<host-fqdn>,<port>' -OutputPath out/lab2/audit.json -AsOf (Get-Date -Format yyyy-MM-dd)
   ```

4. **Write the audit's other inputs:** the estate row for this instance, every `MSSQLSvc` SPN in the domain with the account that holds it, and empty linked-server and client files (fill them in from `sys.linked_logins` and your client records if you have them):

   ```powershell
   New-Item -ItemType Directory -Force out/lab2/ntlm | Out-Null
   $netbios = (Get-ADDomain).NetBIOSName
   $spns = Get-ADObject -LDAPFilter '(servicePrincipalName=MSSQLSvc/*)' -Properties servicePrincipalName, sAMAccountName | ForEach-Object { $acct = "$netbios\$($_.sAMAccountName)"; $_.servicePrincipalName | Where-Object { $_ -like 'MSSQLSvc/*' } | ForEach-Object { [ordered]@{ spn = $_; account = $acct } } }
   [ordered]@{ spns = @($spns) } | ConvertTo-Json -Depth 4 | Set-Content out/lab2/ntlm/spns.json
   '{ "linkedServers": [] }' | Set-Content out/lab2/ntlm/linked-servers.json
   '{ "clients": [] }' | Set-Content out/lab2/ntlm/clients.json
   $name = (Get-Content -Raw out/lab2/audit.json | ConvertFrom-Json).instances[0].name
   [ordered]@{ netbiosDomain = $netbios; instances = @([ordered]@{ name = $name; host = '<host-fqdn>' }) } | ConvertTo-Json -Depth 4 | Set-Content out/lab2/estate.json
   ```

5. **Run the audit:**

   ```powershell
   ./Invoke-SqlNtlmAudit.ps1 -AuditPath out/lab2/audit.json -EstatePath out/lab2/estate.json -NtlmPath out/lab2/ntlm -OutputPath out/lab2/ntlm-result
   Get-Content out/lab2/ntlm-result/spn-fixes.txt
   ```

   Compare each finding with what steps 1 and 2 printed. If the service runs as a virtual account such as `NT Service\MSSQLSERVER`, its SPN sits on the computer account, and the kit expects it there: the estate file's `netbiosDomain` and the host name give `DOMAIN\HOST$`. If the domain has no `MSSQLSvc` SPN at all, `spns.json` holds an empty list and the audit reports the instance's SPN as missing.

6. **The fix is a change.** In the approved window only, as an account allowed to write SPNs, run the one reviewed line from `spn-fixes.txt`. For a missing SPN it's the first line below; the second is its back-out, ready before you start:

   ```powershell
   setspn -S MSSQLSvc/<host-fqdn>:<port> <service-account>
   setspn -D MSSQLSvc/<host-fqdn>:<port> <service-account>
   ```

   Then, from the client, clear the tickets, reconnect and read the scheme. `KERBEROS` means the fix worked; if the instance fails to accept connections, run the back-out line:

   ```powershell
   klist purge
   Invoke-Sqlcmd -ServerInstance '<host-fqdn>,<port>' -Query 'SELECT auth_scheme FROM sys.dm_exec_connections WHERE session_id = @@SPID;'
   klist
   ```

7. **Back it out.** Steps 1 to 5 changed nothing. If step 6 ran and the window's checks failed, its `setspn -D` line restores the old state. Delete the files:

   ```powershell
   Remove-Item -Recurse -Force out/lab2
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| SPN formats | TCP `MSSQLSvc/<FQDN>:<port>`; other protocols `MSSQLSvc/<FQDN>` or `MSSQLSvc/<FQDN>:<instancename>` | [^sq06-spn] |
| Authentication defaults | Correct account: local NTLM, remote Kerberos. Wrong account: fails. No SPN: NTLM | [^sq06-spn] |
| Automatic registration | At startup, only if the service account may write the SPN; virtual accounts and managed service accounts can | [^sq06-spn] |
| Local connections | Always report NTLM | [^sq06-auth-type] |
| `setspn` | `-S` checks for duplicates before adding; `-D`, `-L`, `-Q`, `-X`, `-F`; SPNs aren't case sensitive on Windows | [^sq06-setspn] |
| Misplaced SPN | Move it with `setspn -D` | [^sq06-misplaced] |
| Linked server passthrough | `sys.linked_logins.uses_self_credential` | [^sq06-linked-logins] |
| `klist` | `purge`, `get`, `tickets` | [^sq06-klist] |
| Lab 2 directory reads | `Get-ADObject -LDAPFilter … -Properties`; `Get-ADDomain` returns `NetBIOSName` | [^sq06-get-adobject] [^sq06-get-addomain] |

SPNs, delegation and the *Restrict NTLM* policies are on-premises Active Directory and Windows settings; no cloud availability applies.

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 controls it supports | FedRAMP 20x KSIs | Evidence the ISSO keeps |
|---|---|---|---|
| NTLM: the audit and fix plan (Lab 1, steps 1 to 5; Lab 2, steps 3 to 5) | CM-6 | KSI-SVC-ACM | `ntlm.csv` and `spn-fixes.txt` with the manifest; the change record for each `setspn` line that ran |
| NTLM: the audit and fix plan | IA-2 | — | The same findings, and the `auth_scheme` and `klist` record from a remote client after each fix (Lab 2, step 6) |

The kit's records support these controls and provide evidence for them; the agency still sets the parameters, policy and procedures, and the assessor decides whether each control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with them and doesn't report KSIs itself. IA-2 has no KSI pairing in the kit's `config/requirements.json`.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Running the fix file as a script | Every SPN in it moves at once, outside review | One reviewed line at a time, in a window, with its `setspn -D` or `-S` back-out |
| Measuring on the SQL Server host | Every connection reads NTLM | Lab 2 runs from another machine |
| A duplicate removed from the wrong account | The service account loses its SPN and Kerberos stops | The kit keeps the SPN on the service account; check with `setspn -L` before and after |
| A virtual or built-in service account | The SPN belongs on the computer account, and moving it to the service account string would break Kerberos | The kit expects `DOMAIN\HOST$` for `NT SERVICE\` and `NT AUTHORITY\` accounts; keep `netbiosDomain` right in the estate file |
| Cross-site NTLM read as a missing SPN | An SPN is added that changes nothing | `klist get` from the client site before any fix |
| A linked server "fixed" with unconstrained delegation | The first server holds a reusable ticket for every caller | R06's options: Entra authentication, constrained delegation, or a mapped login as a documented exception |
| Only the TCP SPN checked | Named pipes or short-name clients still use NTLM | Check the other SPN forms by hand where those clients exist |

## Checklist

- [ ] Every instance's TCP SPN is held by exactly one account: the one the service runs as.
- [ ] `setspn -X` reports no duplicate `MSSQLSvc` SPN in the domain.
- [ ] Each `setspn` line ran in an approved window, with its back-out written down first.
- [ ] Remote `auth_scheme` reads `KERBEROS` after each SPN fix, checked from a client.
- [ ] Every linked server with passthrough has a decision from R06's options.
- [ ] Every non-domain-joined client is on [Chapter 07](07-the-application-chain.md)'s list.

::: {.callout-tip}
## Continue the book
[← Chapter 05 — Groups, Roles and the Perimeter](05-groups-roles-and-the-perimeter.md) · [Workbook index](index.md) · [Next: Chapter 07 — The Application Chain →](07-the-application-chain.md)
:::

[^sq06-spn]: Microsoft Learn, "Register a Service Principal Name for Kerberos connections," sections "The role of the SPN in authentication," "Permissions," "SPN formats," "Manual SPN registration" and "Authentication defaults," <https://learn.microsoft.com/sql/database-engine/configure-windows/register-a-service-principal-name-for-kerberos-connections> (accessed Nov 24, 2026).
[^sq06-auth-type]: Microsoft Learn, "How to determine if the authentication type is Kerberos," <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/determine-the-authentication-type> (accessed Nov 24, 2026).
[^sq06-misplaced]: Microsoft Learn, "Explicit misplaced SPN problem in SQL Server," <https://learn.microsoft.com/troubleshoot/sql/database-engine/connect/explicit-spn-is-misplaced> (accessed Nov 24, 2026).
[^sq06-setspn]: Microsoft Learn, "setspn," parameters and remarks, <https://learn.microsoft.com/windows-server/administration/windows-commands/setspn> (accessed Nov 24, 2026).
[^sq06-linked-logins]: Microsoft Learn, "sys.linked_logins (Transact-SQL)," column `uses_self_credential`, <https://learn.microsoft.com/sql/relational-databases/system-catalog-views/sys-linked-logins-transact-sql> (accessed Nov 24, 2026).
[^sq06-klist]: Microsoft Learn, "klist," <https://learn.microsoft.com/windows-server/administration/windows-commands/klist> (accessed Nov 24, 2026).
[^sq06-get-adobject]: Microsoft Learn, "Get-ADObject" (ActiveDirectory module; `-LDAPFilter`, `-Properties`), <https://learn.microsoft.com/powershell/module/activedirectory/get-adobject> (accessed Nov 24, 2026).
[^sq06-get-addomain]: Microsoft Learn, "Get-ADDomain" (ActiveDirectory module; output includes `NetBIOSName`), <https://learn.microsoft.com/powershell/module/activedirectory/get-addomain> (accessed Nov 24, 2026).
