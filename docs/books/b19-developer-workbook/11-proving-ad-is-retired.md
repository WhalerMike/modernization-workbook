---
title: "Chapter 11 — Proving AD Is Retired"
description: "The program's last gate, G5 (AD Retired), proved with the AD retirement evidence kit: what Microsoft Learn documents for demoting domain controllers, cleaning up their metadata, checking the DC locator records and reading Kerberos and NTLM events, what it leaves to you, and the read-only kit that compares the forest with the island register and writes a hashed evidence packet. Labs against fixtures, in Windows PowerShell 5.1, and in a test forest."
doc-type: workbook-chapter
audience: [Technical]
family: b19-developer-workbook
book: B19
part: How
series-order: 11
status: draft
review-status: pending
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
---
# Chapter 11 — Proving AD Is Retired

*A domain controller that was switched off is not a retired domain. The forest is retired when nothing still runs on it, nothing still points at it, and nothing still signs in through it, and the evidence says so.*

::: {.callout-note}
## In this chapter
How the program proves its last gate, G5 (*AD Retired*), with code. [Book 00, Chapter 10](../b00-orientation/10-retirement-steady-state-and-success.md#phase-5-ad-ds-retirement) gives Phase 5's steps: demote each domain controller, clean up its metadata, keep the records, sanitize the hosts. This chapter doesn't repeat them. It builds on `examples/ad-retirement-evidence`, the read-only kit that checks they happened: it reads the domain controllers, their NTDS Settings objects, the DC locator records, the trusts, the SPNs, the computers and the authentication still reaching the domain controllers, compares them with the island register, and writes an evidence packet with a SHA-256 per file. Lab 1 runs on a laptop in Windows PowerShell 5.1, against fixtures; Lab 2 uses a test forest and a test workspace.
:::

## Goal and audience

**Goal.** By the end of this chapter you can run the G5 evidence packet against a forest, read each finding and say which Phase 5 step it sends you back to, keep a Kerberos island as a register the kit checks rather than a promise, and hand the gate owner a packet whose hashes anyone can check. For each rule in the code you can say whether it is Microsoft's documentation or the program's own design.

**Audience.** Identity and platform engineers who run Phase 5, and the gate owners and ISSOs who receive the packet. You should be comfortable with Windows PowerShell and the Active Directory module. You don't need a forest until Lab 2.

## Where the kit sits

Four pages already say what G5 needs. This chapter builds the evidence for it and doesn't restate them.

- [Book 01, Chapter 12](../b01-transformation-arc/12-migration-roadmap.md) sets the gate: domain controllers decommissioned, or retained as a documented Kerberos island with an end-of-life date; evidence packet in the repository and the SIEM; no live production dependency on AD authentication.
- [Book 00, Chapter 10](../b00-orientation/10-retirement-steady-state-and-success.md#phase-5-ad-ds-retirement) gives Phase 5's steps, how to remove each domain controller cleanly, the records and sanitization checklist, and who clears G5.
- [*Building Non-Person Identity*, Chapter 06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-island-list-and-the-reconciliation) builds the island list: every account that stays on Kerberos, with its SPNs, its end date and the bound it must sit within, and every gMSA and dMSA reconciled before AD is retired.
- [WD-183](../../about/decision-register.md#wd-183) records the platform host's own AD dependencies (its computer account, its LDAP bind account and its gMSAs) as one dated exception to [WD-065](../../about/decision-register.md#wd-065), ending at G5 or at the island's end of life.

The kit is the check between those pages and the gate. The island register it reads is the documented Kerberos island in a form code can compare: the domain controllers kept, the workloads with their accounts and SPNs, the trusts, the hosts allowed to authenticate, and the end-of-life dates. Its workloads are the island list's accounts, and the platform host's AD objects are among them until WD-183's exception ends *(Design guidance)*. An empty `domainControllers` list means full retirement. How the island fits the whole migration, and which tracks feed it, is on the [Attribute-Driven Migration topic page](../../topics/attribute-driven-migration.md).

Gate numbers differ between documents. G5 here is the program's gate in Book 01. It isn't Gate 5 of the [implementation guide](../guides/attribute-driven-migration-implementation.md), which is the targeting conventions gate. The guide's ten gates all finish before the program's G5.

Microsoft supports AD DS in current Windows Server releases; retiring it is the agency's decision ([WD-014](../../about/decision-register.md#wd-014)). This chapter assumes the agency's domain controllers and member servers run Windows Server 2019 or later: the agency has finished its Windows Server 2016 upgrades, and 2019 is the minimum. That is an assumption about the estate, not a requirement of the kit.

## Start with Microsoft's documentation

### What Learn gives you

Microsoft has no sample that proves a domain is retired. It documents each piece: how a domain controller leaves, how to check what's left, and the events that show who still authenticates.

| Learn documents | What it says | Where the kit uses it |
|---|---|---|
| Demoting domain controllers | A normal demotion removes the domain controller's metadata; forced removal leaves it and needs metadata cleanup at once[^c11-demote] | AD-G5-01 and AD-G5-03 check the result |
| Metadata cleanup | After cleanup, the server object in Active Directory Sites and Services has no NTDS Settings object[^c11-metadata] | AD-G5-03 reads every `nTDSDSA` object in the Configuration partition |
| DC locator SRV records | Domain controllers register `_ldap._tcp.dc._msdcs.<domain>`; `nslookup` shows one record per domain controller[^c11-srv] | AD-G5-04 resolves the same name with `Resolve-DnsName` |
| The Active Directory module | `Get-ADDomainController -Filter *` returns every domain controller; `Get-ADObject`, `Get-ADTrust` and `Get-ADComputer` read the rest[^c11-getdc][^c11-getobject][^c11-gettrust][^c11-getcomputer] | Every read, at the default read any domain account has |
| Events 4768, 4769 and 4776 | 4768 (a TGT) and 4769 (a service ticket) are generated only on domain controllers; 4776 (NTLM credential validation) on the computer authoritative for the account, which for a domain account is a domain controller[^c11-4768][^c11-4769][^c11-4776] | `queries/dc-authentication.kql` counts them by account and client |
| The `SecurityEvent` table | Security events collected from Windows machines by Microsoft Defender for Cloud or Microsoft Sentinel, with `EventID`, `TargetUserName`, `IpAddress`, `Workstation` and `Computer`[^c11-securityevent] | The query reads it in the workspace the domain controllers forward to |
| `Invoke-AzOperationalInsightsQuery` | Runs a query against a workspace by ID; the rows are in `.Results`[^c11-laquery] | Lab 2, step 2, exports the rows |
| `lastLogonTimestamp` | Updated only when the stored value is older than the sync interval; the first update after a domain functional level raise is 14 days minus a random part of 5[^c11-lastlogon] | AD-G5-08 is a warning, read over a 30-day window |

### What it leaves to you

Learn's pages work one domain controller, one record or one event at a time. G5 is a statement about the whole forest. Each row is pinned by a test in `tests/AdRetirementEvidence.Tests.ps1`.

| Learn, one piece at a time | Why it matters at G5 | What `examples/ad-retirement-evidence` adds |
|---|---|---|
| Each domain controller is demoted on its own | A domain controller nobody remembered keeps running | AD-G5-01: every domain controller is in the island register or a finding |
| Verify cleanup by looking in Sites and Services | One forced removal leaves an NTDS Settings object behind, and replication keeps trying it | AD-G5-03: an NTDS Settings object for a server that is no longer a domain controller |
| Verify SRV records by `nslookup` after install | A record left for a removed domain controller sends clients to a host that's gone, or to whoever has its address next | AD-G5-04: every DC locator record points at an island domain controller |
| Trusts, SPNs and sign-ins are documented separately | A trust, an SPN on a user account or a person still signing in is a live dependency on AD | AD-G5-05, AD-G5-06 and AD-G5-07, each against the register; AD-G5-09 when no authentication rows were read while domain controllers still run, so an empty export can't pass for a quiet forest |
| No end date is part of any of them | An island without an end of life is a forest that was never retired | AD-G5-02: the island and each workload have a date, and it hasn't passed |
| Nothing ties the reads together | The gate owner gets screenshots, not evidence | One packet: what was read, the findings, a summary and a manifest with each file's SHA-256, the register's SHA-256, the controls and the KSIs |

**The verdict.** Follow Learn to demote, clean up and check each domain controller. Then run the kit across the forest, against the register, and give the gate owner its packet.

## The code: what `examples/ad-retirement-evidence` adds

[`examples/ad-retirement-evidence`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/ad-retirement-evidence) is one Windows PowerShell module, a runner, a query, the island register and its tests. It declares Windows PowerShell 5.1, where the Active Directory module is native, and runs unchanged in PowerShell 7. Its [README](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/ad-retirement-evidence/README.md) lists the nine checks.

### The reads

`Get-AreEstate` reads seven things, every one declared in `config/calls.json` with the right it needs: the domain controllers, the NTDS Settings objects, the trusts, the objects with an SPN and the enabled computers, at the default read any domain account has; the DC locator SRV records, as a DNS query; and the authentication rows, from the CSV export of `queries/dc-authentication.kql` or, with `-WorkspaceId`, from the workspace as a Log Analytics Data Reader. With `-FixturePath` it reads the same shapes from JSON, which is how Lab 1 runs with no forest. With `-NoDomain`, after the last domain controller is gone, it reads only DNS and the authentication rows. A test fails if the module calls a cmdlet that changes Active Directory or DNS.

### The checks

`Test-AreG5` compares the reads with the register and returns findings and warnings. It changes nothing. A computer that signed in to the domain in the window is a warning, not a finding (AD-G5-08), because `lastLogonTimestamp` is approximate by design[^c11-lastlogon] and the device side of G4 is Intune's to prove. No authentication rows at all while domain controllers still run is a finding of its own (AD-G5-09): the events aren't reaching the workspace, so AD-G5-07's silence proves nothing. Everything else is a finding, and the packet is ready for the gate owner only when there are none.

### The packet

`New-AreEvidencePacket` writes `dcs.json`, `ntds.json`, `trusts.json`, `spns.json`, `computers.json`, `srv.json`, `auth.json`, `findings.json`, `summary.md` and `manifest.json`. The manifest records each file's SHA-256, hashed with LF line endings, the register's SHA-256, the date in UTC, and the controls and KSIs from `config/requirements.json`. The files are the same bytes in Windows PowerShell 5.1 and PowerShell 7, so a packet rebuilt from the same reads in either edition has the same manifest hash: the module writes its own JSON, because `ConvertTo-Json` indents and escapes differently in the two editions. A test pins the fixture packet's manifest hash.

G5 asks for the packet "in the repository and the SIEM". The kit writes it for the repository; the manifest's hash is what the SIEM record carries *(Design guidance)*.

### The tests

`tests/AdRetirementEvidence.Tests.ps1` has 15 Pester tests on two fictional estates: a Kerberos island with leftovers (a second domain controller, metadata and an SRV record for a removed one, a trust, a reporting service's SPN and its NTLM sign-ins, a person signing in to a domain controller, a PC still signing in to the domain), the same island with an empty authentication export (AD-G5-09, and the runner exits `2`), and a full retirement with nothing left. They pass in Windows PowerShell 5.1 and in PowerShell 7 with Pester 5.

::: {.callout-important}
## Illustrative code
The commands below run the kit against fictional fixtures. The kit is read only, but it has not been run against a live forest or workspace. Review the code, and run Lab 2 in a test forest, before its packet is evidence anyone relies on.
:::

## Lab 1: fixtures, no forest

You need Windows PowerShell 5.1 with Pester 5 (`Install-Module Pester -MinimumVersion 5.5.0 -Scope CurrentUser -SkipPublisherCheck`, since Windows ships Pester 3). Open **Windows PowerShell** and work in `examples/ad-retirement-evidence`. The kit also runs in PowerShell 7 and writes the same packet; the console output differs a little.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/ad-retirement-evidence`. Each step below says what it does and what to look for.

```powershell
# Step 1: Read the island register
Get-Content config/island-register.json

# Step 2: Write the packet for an island with leftovers
./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath out/g5 -AsOf 2026-11-27

# Step 3: Read the summary
Get-Content out/g5/summary.md

# Step 4: Check every hash in the manifest
Import-Module ./powershell/AdRetirementEvidence/AdRetirementEvidence.psm1
$m = Get-Content out/g5/manifest.json -Raw | ConvertFrom-Json
$m.files | ForEach-Object { '{0,-15} {1}' -f $_.path, ($_.sha256 -eq (Get-AreSha256 "out/g5/$($_.path)")) }
$m.register.sha256 -eq (Get-AreSha256 config/island-register.json)
"$($m.controls -join ', ') | $($m.ksis -join ', ')"

# Step 5: Break it on purpose
Add-Content out/g5/findings.json '[]'
$m.files | Where-Object { $_.sha256 -ne (Get-AreSha256 "out/g5/$($_.path)") } | ForEach-Object path

# Step 6: Move the clock past the island's end of life
./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath out/g5-late -AsOf 2028-10-01
Select-String -Path out/g5-late/summary.md -Pattern 'AD-G5-02' | ForEach-Object Line

# Step 7: Write the packet for a full retirement
./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/retired -RegisterPath tests/fixtures/retired/island-register.json -OutputPath out/g5-retired -AsOf 2026-11-27

# Step 8: Run the tests
Invoke-Pester -Path tests
```

:::

<!-- labs:end -->

1. **Read the island register.** This is the documented Kerberos island the kit checks against: one domain controller kept, one workload with its accounts and SPN, no trusts, three hosts allowed to authenticate, and the end-of-life dates.

   ```powershell
   Get-Content config/island-register.json
   ```

   <!-- capture:begin 11-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/adm/11-1.txt))](captures/11-1.png){.lightbox fig-alt="Terminal window showing Get-Content config/island-register.json and what it printed"}

   <!-- capture:end -->

   The island ends on `2028-09-30`; the payroll interface workload ends earlier, on `2028-06-30`.

2. **Write the packet for an island with leftovers.**

   ```powershell
   ./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath out/g5 -AsOf 2026-11-27
   ```

   <!-- capture:begin 11-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/adm/11-2.txt))](captures/11-2.png){.lightbox fig-alt="Terminal window showing ./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixt… and what it printed"}

   <!-- capture:end -->

   `Ready` is `False`, with 7 findings and 1 warning, and the run exits `2`.

3. **Read the summary.**

   ```powershell
   Get-Content out/g5/summary.md
   ```

   <!-- capture:begin 11-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/adm/11-3.txt))](captures/11-3.png){.lightbox fig-alt="Terminal window showing Get-Content out/g5/summary.md and what it printed"}

   <!-- capture:end -->

   Each finding sends you back to a Phase 5 step: DC02 is still a domain controller (demote it or add it to the island); DC03 left an NTDS Settings object and an SRV record (clean up its metadata, as Book 00's step 3 says); the trust with `partner.fabrikam.example` isn't in the register; `svc-reports` still has an SPN and 96 NTLM validations; `jlee` still gets Kerberos tickets from a domain controller; and `FIN-PC-0442` still signs in to the domain, a warning for the device track. The payroll interface's own sign-ins (`svc-payroll-if`, `PAYROLL-IF01$`) aren't findings: the register lists them.

4. **Check every hash in the manifest**, then the controls and KSIs it records:

   ```powershell
   Import-Module ./powershell/AdRetirementEvidence/AdRetirementEvidence.psm1
   $m = Get-Content out/g5/manifest.json -Raw | ConvertFrom-Json
   $m.files | ForEach-Object { '{0,-15} {1}' -f $_.path, ($_.sha256 -eq (Get-AreSha256 "out/g5/$($_.path)")) }
   $m.register.sha256 -eq (Get-AreSha256 config/island-register.json)
   "$($m.controls -join ', ') | $($m.ksis -join ', ')"
   ```

   <!-- capture:begin 11-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/adm/11-4.txt))](captures/11-4.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/AdRetirementEvidence/AdRetirementEvidence.psm1 and what it printed"}

   <!-- capture:end -->

   Nine files, each `True`; the register's hash matches; then `CM-8, AC-2, IA-2, AU-6, CA-7, SA-22 | KSI-PIY-GIV, KSI-MLA-EVC`.

5. **Break it on purpose.** Add a line to the findings after the packet was written, then list the files whose hash no longer matches:

   ```powershell
   Add-Content out/g5/findings.json '[]'
   $m.files | Where-Object { $_.sha256 -ne (Get-AreSha256 "out/g5/$($_.path)") } | ForEach-Object path
   ```

   <!-- capture:begin 11-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/adm/11-5.txt))](captures/11-5.png){.lightbox fig-alt="Terminal window showing Add-Content out/g5/findings.json '[]' and what it printed"}

   <!-- capture:end -->

   It prints `findings.json`: an edit after the packet was written shows.

6. **Move the clock past the island's end of life.**

   ```powershell
   ./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath out/g5-late -AsOf 2028-10-01
   Select-String -Path out/g5-late/summary.md -Pattern 'AD-G5-02' | ForEach-Object Line
   ```

   <!-- capture:begin 11-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/adm/11-6.txt))](captures/11-6.png){.lightbox fig-alt="Terminal window showing ./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixt… and what it printed"}

   <!-- capture:end -->

   Nine findings now, and no warning: the island's end of life and the workload's have both passed (two AD-G5-02 lines), and the PC's last sign-in is outside the 30-day window.

7. **Write the packet for a full retirement**, with no domain controller, no DC locator record, no trust and no authentication left:

   ```powershell
   ./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/retired -RegisterPath tests/fixtures/retired/island-register.json -OutputPath out/g5-retired -AsOf 2026-11-27
   ```

   <!-- capture:begin 11-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/adm/11-7.txt))](captures/11-7.png){.lightbox fig-alt="Terminal window showing ./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixt… and what it printed"}

   <!-- capture:end -->

   `Ready` is `True`, with no findings and no warnings, and the run exits `0`.

8. **Run the tests.**

   ```powershell
   Invoke-Pester -Path tests
   ```

   <!-- capture:begin 11-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/adm/11-8.txt))](captures/11-8.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests and what it printed"}

   <!-- capture:end -->

   `Tests Passed: 15` and `Failed: 0` (Windows PowerShell 5.1 prints each count of the summary on its own line).

**Expected result:** each row of the gap table seen in a packet, and 15 tests passing.

## Lab 2: test forest and test workspace

**Not run by the authors.** Use a test forest, never production, whose domain controllers forward their Security log to a test Log Analytics workspace with Microsoft Sentinel or Defender for Cloud collecting `SecurityEvent`.[^c11-securityevent] You need a domain-joined Windows machine with RSAT's Active Directory module (on Windows 11, **Settings** > **System** > **Optional features**)[^c11-rsat] and PowerShell 7 with Az.Accounts and Az.OperationalInsights beside Windows PowerShell 5.1. Work in `examples/ad-retirement-evidence`. Steps 1 and 2 and the last command of step 7 run in PowerShell 7 (Azure); steps 3 to 6 and the rest of step 7 run in Windows PowerShell 5.1 (Active Directory). You'll replace: `<tenant-id>` and `<subscription-id>` (the test tenant and the subscription that holds the workspace), `<workspace-id>` (the workspace ID) and `<workspace-resource-id>` (its Azure resource ID), `<your-upn>` (your own sign-in name), `<test-domain>` (the test domain's DNS name), `<island-dc>` (the test domain controller you keep, as its NetBIOS name), `<island-host>` (a member server the island workload runs on), `<island-account>` (that workload's service account or gMSA, without `$`) and `<island-spn>` (its SPN).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/ad-retirement-evidence`. Each step below says what it does and what to look for.

```powershell
# Step 1: Grant the read
# In PowerShell 7
Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id> -Subscription <subscription-id>
New-AzRoleAssignment -SignInName <your-upn> -RoleDefinitionName 'Log Analytics Data Reader' -Scope <workspace-resource-id>

# Step 2: Export the authentication rows
# In PowerShell 7
$kql = Get-Content queries/dc-authentication.kql -Raw
(Invoke-AzOperationalInsightsQuery -WorkspaceId <workspace-id> -Query $kql).Results | Export-Csv dc-auth.csv -NoTypeInformation
(Import-Csv dc-auth.csv).Count

# Step 3: Write the test island's register
# In Windows PowerShell 5.1
$r = Get-Content config/island-register.json -Raw | ConvertFrom-Json
$r.domain = '<test-domain>'; $r.domainControllers = @('<island-dc>'); $r.allowedHosts = @('<island-dc>', '<island-host>')
$r.workloads[0].accounts = @('<island-account>'); $r.workloads[0].spns = @('<island-spn>')
$r | ConvertTo-Json -Depth 5 | Set-Content island-register.json -Encoding UTF8

# Step 4: Check the reads
# In Windows PowerShell 5.1
Get-ADDomainController -Filter * -Server <test-domain> | Select-Object Name, Site
Resolve-DnsName -Type SRV -Name "_ldap._tcp.dc._msdcs.<test-domain>" | Where-Object Type -eq 'SRV' | Select-Object NameTarget, Port

# Step 5: Write the packet
# In Windows PowerShell 5.1
./Invoke-AreEvidence.ps1 -Domain <test-domain> -AuthPath .\dc-auth.csv -RegisterPath .\island-register.json -OutputPath .\g5-packet
Get-Content .\g5-packet\summary.md

# Step 6: Record the manifest's hash
# In Windows PowerShell 5.1
Import-Module ./powershell/AdRetirementEvidence/AdRetirementEvidence.psm1
Get-AreSha256 .\g5-packet\manifest.json

# Step 7: Back it out
# In Windows PowerShell 5.1
Remove-Item -Recurse -Force .\g5-packet
Remove-Item -Force .\dc-auth.csv, .\island-register.json

# Step 7: Back it out
# In PowerShell 7
Remove-AzRoleAssignment -SignInName <your-upn> -RoleDefinitionName 'Log Analytics Data Reader' -Scope <workspace-resource-id>
```

:::

<!-- labs:end -->

1. **Grant the read**, in PowerShell 7. Someone with the right to assign roles on the workspace gives your test account the role the kit declares, at the workspace's scope only:[^c11-rbac]

   ```powershell
   # In PowerShell 7
   Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id> -Subscription <subscription-id>
   New-AzRoleAssignment -SignInName <your-upn> -RoleDefinitionName 'Log Analytics Data Reader' -Scope <workspace-resource-id>
   ```

   Log Analytics Data Reader is the role Learn gives "the bare minimum permissions needed to run queries"; Log Analytics Reader, by contrast, carries `*/read` across its scope.[^c11-la-roles] Assigned at the workspace, it reaches that workspace only.

2. **Export the authentication rows**, in PowerShell 7, with the kit's query:[^c11-laquery]

   ```powershell
   # In PowerShell 7
   $kql = Get-Content queries/dc-authentication.kql -Raw
   (Invoke-AzOperationalInsightsQuery -WorkspaceId <workspace-id> -Query $kql).Results | Export-Csv dc-auth.csv -NoTypeInformation
   (Import-Csv dc-auth.csv).Count
   ```

   Expect at least one row for each domain controller that is still running. No rows at all means the events aren't reaching the workspace, not that nobody signs in, and the kit says so: step 5 then reports AD-G5-09 and exits `2`. Fix it at the source, with the audit subcategories on the domain controllers (Audit Kerberos Authentication Service, Audit Kerberos Service Ticket Operations and Audit Credential Validation)[^c11-4768][^c11-4769][^c11-4776] and their forwarding, and export again.

3. **Write the test island's register**, in Windows PowerShell 5.1, from the kit's copy:

   ```powershell
   # In Windows PowerShell 5.1
   $r = Get-Content config/island-register.json -Raw | ConvertFrom-Json
   $r.domain = '<test-domain>'; $r.domainControllers = @('<island-dc>'); $r.allowedHosts = @('<island-dc>', '<island-host>')
   $r.workloads[0].accounts = @('<island-account>'); $r.workloads[0].spns = @('<island-spn>')
   $r | ConvertTo-Json -Depth 5 | Set-Content island-register.json -Encoding UTF8
   ```

   For a full retirement test, set `$r.domainControllers = @()` instead.

4. **Check the reads**, in Windows PowerShell 5.1, as a domain user with default read:[^c11-getdc]

   ```powershell
   # In Windows PowerShell 5.1
   Get-ADDomainController -Filter * -Server <test-domain> | Select-Object Name, Site
   Resolve-DnsName -Type SRV -Name "_ldap._tcp.dc._msdcs.<test-domain>" | Where-Object Type -eq 'SRV' | Select-Object NameTarget, Port
   ```

   Expect each test domain controller, and one SRV record for each.[^c11-srv]

5. **Write the packet**, in Windows PowerShell 5.1:

   ```powershell
   # In Windows PowerShell 5.1
   ./Invoke-AreEvidence.ps1 -Domain <test-domain> -AuthPath .\dc-auth.csv -RegisterPath .\island-register.json -OutputPath .\g5-packet
   Get-Content .\g5-packet\summary.md
   ```

   Expect `Ready` to be `True` only if every other test domain controller is gone and nothing outside the register signs in. Otherwise each finding names what is left; AD-G5-09 means step 2's export came back empty.

6. **Record the manifest's hash**, in Windows PowerShell 5.1, for the SIEM record:

   ```powershell
   # In Windows PowerShell 5.1
   Import-Module ./powershell/AdRetirementEvidence/AdRetirementEvidence.psm1
   Get-AreSha256 .\g5-packet\manifest.json
   ```

   It's the `ManifestSha256` step 5 printed. In production, the packet is committed to the evidence repository and the hash goes into the SIEM record, as G5 asks; in the test forest, keep both with the test notes.

7. **Back it out.** In Windows PowerShell 5.1, delete what the lab wrote: the authentication rows hold account names, so they don't stay on the machine:

   ```powershell
   # In Windows PowerShell 5.1
   Remove-Item -Recurse -Force .\g5-packet
   Remove-Item -Force .\dc-auth.csv, .\island-register.json
   ```

   Then, in PowerShell 7, remove the role assignment:[^c11-rbac]

   ```powershell
   # In PowerShell 7
   Remove-AzRoleAssignment -SignInName <your-upn> -RoleDefinitionName 'Log Analytics Data Reader' -Scope <workspace-resource-id>
   ```

After the last domain controller of a real forest is gone there is nothing left to read with the Active Directory module, and `-NoDomain` records the full retirement from DNS and the SIEM alone, as the kit's [README](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/ad-retirement-evidence/README.md#lab-2-a-test-forest) shows.

## Verified facts

| Item | Value | Source |
|---|---|---|
| Removing a domain controller | A normal demotion removes its metadata; forced removal leaves orphaned metadata and needs cleanup at once | [^c11-demote] [^c11-metadata] |
| Cleanup verified | No NTDS Settings object under the server object in Active Directory Sites and Services | [^c11-metadata] |
| DC locator record | `_ldap._tcp.dc._msdcs.<domain>`, one SRV record per domain controller | [^c11-srv] |
| Reading the domain controllers | `Get-ADDomainController -Filter *`; `-Server` takes a domain or a server name | [^c11-getdc] |
| Kerberos events | 4768 (TGT requested) and 4769 (service ticket requested), only on domain controllers | [^c11-4768] [^c11-4769] |
| NTLM event | 4776, on the computer authoritative for the account: a domain controller for a domain account | [^c11-4776] |
| Where the events land | `SecurityEvent`, collected by Microsoft Defender for Cloud or Microsoft Sentinel | [^c11-securityevent] |
| Querying the workspace | `Invoke-AzOperationalInsightsQuery -WorkspaceId -Query`; rows in `.Results` | [^c11-laquery] |
| Workspace roles | Log Analytics Data Reader, the role the kit declares: "the bare minimum permissions needed to run queries" (`workspaces/query/read` and `workspaces/read`, and the `workspaces/tables/data/read` data action), assignable at the workspace alone; Log Analytics Reader: `*/read` across the scope, including querying data | [^c11-la-roles] |
| `lastLogonTimestamp` | Updated when older than `msDS-LogonTimeSyncInterval`; the first update after a functional level raise is 14 days minus a random part of 5 | [^c11-lastlogon] |
| Active Directory module | Part of RSAT, added on Windows 10 1809 and later through Optional features | [^c11-rsat] |
| Microsoft's position on AD DS | Supported; retiring it is the agency's decision | [WD-014](../../about/decision-register.md#wd-014) |

The kit declares Log Analytics Data Reader for the workspace query, the narrowest built-in role Learn gives for running queries; Lab 2 grants it at the workspace scope only.[^c11-la-roles]

## Federal requirements and evidence

The packet is the evidence G5 asks for. Each row names the file or command that proves it. Controls are from the Moderate baseline;[^c11-moderate] indicators are from FedRAMP's list.[^c11-ksi] The controls and indicators are the ones in the kit's `config/requirements.json`, and a KSI is shown only where this repository's verified mappings pair it with that control ([Book 13, Appendix A](../b13-governance/appendix-a-requirements-mapping.md)). Which output supports which control is the program's reading *(design guidance)*. The evidence supports the controls; the gate owner checks it, and the assessor decides each control.

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| Every domain controller is decommissioned or in the island register, and no NTDS Settings object or DC locator record outlives its server (Lab 1, steps 2 and 3: AD-G5-01, AD-G5-03, AD-G5-04 in `findings.json`; `dcs.json`, `ntds.json`, `srv.json`) | CM-8 (System Component Inventory) | KSI-PIY-GIV | The evidence repository |
| The island and each workload carry an end-of-life date that hasn't passed (step 6: AD-G5-02) | SA-22 (Unsupported System Components) | None: the kit's config pairs no indicator with SA-22 | The evidence repository |
| No account outside the register holds an SPN, and no trust outside it remains (steps 2 and 3: AD-G5-05, AD-G5-06; `spns.json`, `trusts.json`) | AC-2 (Account Management) | None: Book 13, Appendix A maps KSI-IAM-AAM to AC-2's enhancements AC-2(2), AC-2(3) and AC-2(13), not to AC-2, and the packet shows accounts still in use, not accounts disabled or removed, so it supports none of the three. The kit's config doesn't list KSI-IAM-AAM | The evidence repository |
| Nothing outside the register still authenticates through the domain controllers, and the export isn't empty while domain controllers run (steps 2 and 3: AD-G5-07, AD-G5-09; `auth.json`) | IA-2 (Identification and Authentication); AU-6 (Audit Record Review, Analysis, and Reporting) | None in the kit's config: the indicator Book 13, Appendix A pairs with AU-6, KSI-MLA-RVL, isn't one the kit lists | The evidence repository; the SIEM |
| The packet hashes every file and the register, and an edit after it was written shows (steps 4 and 5: `manifest.json`, `Get-AreSha256`) | CA-7 (Continuous Monitoring) | KSI-MLA-EVC | The evidence repository; the manifest hash in the SIEM |
| A full retirement reads clean (step 7: `Ready` `True`) | CM-8; CA-7 | KSI-PIY-GIV; KSI-MLA-EVC | The evidence repository |
| The checks and the packet pass their tests in both editions (step 8: 15 tests) | CA-7 | KSI-MLA-EVC | The repository's test results |
| The reader holds only the workspace role the kit declares, at the workspace, and loses it afterwards (Lab 2, steps 1 and 7) | AC-2 | None, as above | The Azure activity log |
| The test forest's packet and its manifest hash (Lab 2, steps 5 and 6) | CA-7; CM-8 | KSI-MLA-EVC; KSI-PIY-GIV | The evidence repository; the SIEM |

Key Security Indicators are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system: it lines this evidence up with what its providers report against them, and doesn't report KSIs itself ([Book 00, Appendix B](../b00-orientation/appendix-b-engagement-archetype.md)). Closing the domain's authorization once it is gone is [Book 14, Appendix I](../b14-compliance/appendix-i-closing-a-systems-authorization.md).

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A domain controller switched off, not demoted | Its metadata stays, replication keeps trying it, and its SRV records still send clients to it | AD-G5-01, AD-G5-03 and AD-G5-04 read what Active Directory and DNS still say, not what was powered down |
| An island with no end | The forest stays, under a new name | AD-G5-02: the island and each workload need a date that hasn't passed |
| A register that grows to fit the findings | Every finding disappears into the island | The manifest records the register's SHA-256; a change to the register is a reviewed change, and its workloads come from the island list ([Chapter 06 of *Building Non-Person Identity*](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md)) |
| No authentication rows read as clean | Auditing is off, or forwarding broke, and AD-G5-07 finds nothing | AD-G5-09: no rows at all while domain controllers still run is a finding, and the run exits `2`. The kit checks the total, not each domain controller, so the checklist asks for rows from each one |
| `lastLogonTimestamp` taken as exact | A computer that signed in last week looks idle, or the reverse | AD-G5-08 is a warning over a 30-day window; devices are proved by the device track, not here |
| Account names in the wrong place | The authentication export and `auth.json` name people and services | The packet goes to the evidence repository, not a public one; Lab 2 deletes the export |
| A packet edited after it was written | The gate owner relies on a packet that isn't what the kit read | The manifest's hashes, checked in Lab 1, steps 4 and 5; the manifest hash in the SIEM |
| A packet that differs by edition | The same reads hashed in 5.1 and 7 give two manifest hashes | The module writes its own JSON; a test pins the fixture manifest hash |
| A write in the evidence run | A check that changes Active Directory or DNS | Read only: a test fails on any cmdlet that changes Active Directory or DNS |

## Checklist

- [ ] The island register is reviewed data: its domain controllers, workloads, trusts and hosts match the island list, and its end-of-life dates are the ones the authorizing official accepted.
- [ ] The platform host's AD objects are in the register until WD-183's exception ends, and gone after.
- [ ] The packet has no AD-G5-09, and `auth.json` has rows from every domain controller that still runs, over the register's window: the kit fails an empty export, not one that is missing a single domain controller.
- [ ] The packet has no finding, and each warning has an owner.
- [ ] Every file in the manifest matches its hash, and the register's hash matches the reviewed register.
- [ ] The packet is committed to the evidence repository and the manifest hash is in the SIEM record.
- [ ] The kit's tests pass in Windows PowerShell 5.1 and PowerShell 7.
- [ ] Book 00, Chapter 10's records and sanitization checklist is done for every retired domain controller; the kit doesn't check it.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 10 — Deploying to Test and Production](10-deploying-to-test-and-production.md) · [Workbook index](index.md)
:::

[^c11-demote]: Microsoft Learn, "Demote domain controllers and domains," <https://learn.microsoft.com/windows-server/identity/ad-ds/deploy/demoting-domain-controllers-and-domains--level-200-> (accessed Nov 9, 2026, for Book 00, Chapter 10).
[^c11-metadata]: Microsoft Learn, "Clean up Active Directory Domain Controller server metadata," <https://learn.microsoft.com/windows-server/identity/ad-ds/deploy/ad-ds-metadata-cleanup> (accessed Nov 9, 2026, for Book 00, Chapter 10).
[^c11-srv]: Microsoft Learn, "Verify that SRV Domain Name System (DNS) records have been created," Method 3 (`nslookup` for `_ldap._tcp.dc._msdcs.Domain_Name`), <https://learn.microsoft.com/troubleshoot/windows-server/networking/verify-srv-dns-records-have-been-created> (accessed Nov 27, 2026).
[^c11-getdc]: Microsoft Learn, "Get-ADDomainController," <https://learn.microsoft.com/powershell/module/activedirectory/get-addomaincontroller> (accessed Nov 27, 2026).
[^c11-getobject]: Microsoft Learn, "Get-ADObject," <https://learn.microsoft.com/powershell/module/activedirectory/get-adobject> (link from the kit's `config/calls.json`; not reread for this chapter).
[^c11-gettrust]: Microsoft Learn, "Get-ADTrust," <https://learn.microsoft.com/powershell/module/activedirectory/get-adtrust> (link from the kit's `config/calls.json`; not reread for this chapter).
[^c11-getcomputer]: Microsoft Learn, "Get-ADComputer," <https://learn.microsoft.com/powershell/module/activedirectory/get-adcomputer> (link from the kit's `config/calls.json`; not reread for this chapter).
[^c11-4768]: Microsoft Learn, "4768(S, F) A Kerberos authentication ticket (TGT) was requested," subcategory Audit Kerberos Authentication Service ("This event generates only on domain controllers"), <https://learn.microsoft.com/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4768> (accessed Nov 27, 2026).
[^c11-4769]: Microsoft Learn, "4769(S, F) A Kerberos service ticket was requested," subcategory Audit Kerberos Service Ticket Operations, <https://learn.microsoft.com/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4769> (accessed Nov 27, 2026).
[^c11-4776]: Microsoft Learn, "4776(S, F) The computer attempted to validate the credentials for an account," subcategory Audit Credential Validation ("For domain accounts, the domain controller is authoritative"), <https://learn.microsoft.com/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4776> (accessed Nov 27, 2026).
[^c11-securityevent]: Microsoft Learn, "Azure Monitor Logs reference - SecurityEvent," <https://learn.microsoft.com/azure/azure-monitor/reference/tables/securityevent> (accessed Nov 27, 2026).
[^c11-laquery]: Microsoft Learn, "Invoke-AzOperationalInsightsQuery," <https://learn.microsoft.com/powershell/module/az.operationalinsights/invoke-azoperationalinsightsquery> (accessed Nov 27, 2026).
[^c11-la-roles]: Microsoft Learn, "Manage access to Log Analytics workspaces," Built-in roles (Log Analytics Data Reader, Log Analytics Reader) and the resource scope ("Access to only the specified workspace"), <https://learn.microsoft.com/azure/azure-monitor/logs/manage-access#built-in-roles> (accessed Nov 28, 2026).
[^c11-rbac]: Microsoft Learn, "Assign Azure roles using Azure PowerShell" (`New-AzRoleAssignment` with `-SignInName`, `-RoleDefinitionName` and `-Scope`), <https://learn.microsoft.com/azure/role-based-access-control/role-assignments-powershell> (accessed Nov 27, 2026, for Chapter 09).
[^c11-lastlogon]: Microsoft Learn, "Last-Logon-Timestamp attribute," <https://learn.microsoft.com/windows/win32/adschema/a-lastlogontimestamp> (accessed Nov 27, 2026).
[^c11-rsat]: Microsoft Learn, "Remote Server Administration Tools," RSAT for Windows 10, version 1809 or later versions (Optional features), <https://learn.microsoft.com/troubleshoot/windows-server/system-management-components/remote-server-administration-tools> (accessed Nov 27, 2026).
[^c11-moderate]: National Institute of Standards and Technology, SP 800-53B Moderate baseline, release 5.2.0 OSCAL profile (includes AC-2, AU-6, CA-7, CM-8, IA-2 and SA-22), <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json> (as cited in Chapter 09, accessed Nov 2, 2026; SA-22 and IA-2 not reread for this chapter).
[^c11-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026* (indicators KSI-PIY-GIV and KSI-MLA-EVC), <https://www.fedramp.gov/2026/reference/key-security-indicators/> (as cited in Chapter 09, accessed Nov 2, 2026).
