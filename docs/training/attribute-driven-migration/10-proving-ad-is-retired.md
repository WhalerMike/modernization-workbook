---
title: "Attribute-Driven Migration, Module 10: Prove AD Is Retired"
subtitle: "Write the program G5 evidence packet with the AD retirement evidence kit: compare the forest with the island register, read each finding back to its Phase 5 step, and hand the gate owner a packet whose hashes anyone can check"
description: "Module 10 of the Attribute-Driven Migration learning path. You learn where the kit sits between Book 00's Phase 5 steps and gate G5, what Microsoft Learn documents and leaves to you, the island register, the eight checks and the hashed packet, then, in Windows PowerShell 5.1, write the packet for an island with leftovers, read the summary, check the manifest, break it on purpose, move the clock past the island's end of life and write a full retirement. Program gate G5; Book 19, Chapter 11."
research-status: draft
research-type: training module
research-book: "Book 19"
series-order: 10
date-modified: 2026-11-27
review-status: pending
---
# Attribute-Driven Migration, Module 10: Prove AD Is Retired {.unnumbered}

**Learning path:** [Building the Attribute-Driven Migration](index.md) · Module 10 of 10 · 45 minutes · Program gate [G5](../../books/b00-orientation/10-retirement-steady-state-and-success.md#phase-5-ad-ds-retirement), after the guide's gates · Workbook [Chapter 11](../../books/b19-developer-workbook/11-proving-ad-is-retired.md)

## Unit 1: Introduction

*5 minutes, with the objectives and prerequisites*

The migration ends when Active Directory does. The program's last gate, G5 (*AD Retired*), passes when the domain controllers are decommissioned, or retained as a documented Kerberos island with an end-of-life date, the evidence packet is in the repository and the SIEM, and nothing in production still depends on AD authentication ([Book 01, Chapter 12](../../books/b01-transformation-arc/12-migration-roadmap.md)). In this module you write that packet with the AD retirement evidence kit, on two fictional estates, and read what it says.

G5 is the program's gate, not the implementation guide's Gate 5: the guide's ten gates all finish before it.

**The federal requirement.** From [Chapter 11's table](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#federal-requirements-and-evidence):

| Requirement | KSI | Evidence the ISSO keeps |
|---|---|---|
| CM-8 System Component Inventory: every domain controller is decommissioned or in the register, and no metadata or DC locator record outlives its server | KSI-PIY-GIV | `dcs.json`, `ntds.json`, `srv.json` and `findings.json` in the evidence repository |
| SA-22 Unsupported System Components: the island and each workload have an end-of-life date that hasn't passed | None in the kit's config | `findings.json` |
| IA-2; AU-6: nothing outside the register still authenticates through the domain controllers, and the export isn't empty while domain controllers run (AD-G5-09) | None in the kit's config | `auth.json`; the SIEM |
| CA-7 Continuous Monitoring: the packet hashes every file and the register, and an edit after it was written shows | KSI-MLA-EVC | `manifest.json`, and its hash in the SIEM |

: Chapter 11's requirements, KSIs and evidence for this module {.striped .hover}

Chapter 11 says why AC-2 carries no KSI there. Key Security Indicators are FedRAMP 20x indicators for cloud service providers. The agency authorizes its own system and lines this evidence up with what its providers report against them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). The evidence supports the controls; the gate owner checks it and the assessor decides each one *(design guidance)*.

### Learning objectives

In this module, you'll:

- Explain what the island register is and why the kit compares the forest with it.
- Read each of the kit's findings back to the Phase 5 step it sends you to.
- Check a packet's hashes, and show that an edit after it was written is caught.
- Explain why a missing authentication export isn't a clean result.

### Prerequisites

- [Module 8](08-drift-and-evidence.md): the hashed evidence package. This packet is smaller, but the idea is the same.
- Windows PowerShell 5.1 with Pester 5. Windows ships Pester 3, so install Pester 5 first: `Install-Module Pester -MinimumVersion 5.5.0 -Scope CurrentUser -SkipPublisherCheck`.

## Unit 2: Where the kit sits

*8 minutes*

Book 00 gives Phase 5's steps: demote each domain controller, clean up its metadata, keep the records, sanitize the hosts. The Non-Person Identity workbook builds the island list of accounts that stay on Kerberos. WD-183 makes the platform host's own AD objects one dated exception that ends at G5 or the island's end of life. The kit checks all of it against one register. Read:

- [Book 00, Chapter 10: Phase 5, AD DS retirement](../../books/b00-orientation/10-retirement-steady-state-and-success.md#phase-5-ad-ds-retirement).
- [Chapter 11: where the kit sits](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#where-the-kit-sits).
- [*Building Non-Person Identity*, Chapter 06: the island list and the reconciliation](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-island-list-and-the-reconciliation).
- [WD-183](../../about/decision-register.md#wd-183).

## Unit 3: The checks and the packet

*7 minutes*

Learn documents each piece one domain controller, record or event at a time: demotion, metadata cleanup, the DC locator records, and the Kerberos and NTLM events on the domain controllers. The kit reads them across the forest, compares them with the register, and writes a packet with a SHA-256 per file. Read:

- [Chapter 11: what it leaves to you](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#what-it-leaves-to-you).
- [Chapter 11: the code](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#the-code-what-examplesad-retirement-evidence-adds).

## Unit 4: Exercise: Lab 1 (fixtures, no forest)

*20 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\attribute-driven-migration-code\ad-retirement-evidence

$Run = "C:\FMWLabs\results\attribute-driven-migration-10-proving-ad-is-retired\lab1\$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ'))"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Read the island register
Get-Content config/island-register.json

# Step 2: Write the packet for an island with leftovers
./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath "$Run\g5" -AsOf 2026-11-27
$LASTEXITCODE

# Step 3: Read the summary
Get-Content "$Run\g5\summary.md"

# Step 4: Check every hash in the manifest
Import-Module ./powershell/AdRetirementEvidence/AdRetirementEvidence.psm1
$m = Get-Content "$Run\g5\manifest.json" -Raw | ConvertFrom-Json
$m.files | ForEach-Object { '{0,-15} {1}' -f $_.path, ($_.sha256 -eq (Get-AreSha256 "$Run\g5\$($_.path)")) }
$m.register.sha256 -eq (Get-AreSha256 config/island-register.json)
"$($m.controls -join ', ') | $($m.ksis -join ', ')"

# Step 5: Break it on purpose
Add-Content "$Run\g5\findings.json" '[]'
$m.files | Where-Object { $_.sha256 -ne (Get-AreSha256 "$Run\g5\$($_.path)") } | ForEach-Object path

# Step 6: Move the clock past the island's end of life
./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath "$Run\g5-late" -AsOf 2028-10-01
Select-String -Path "$Run\g5-late\summary.md" -Pattern 'AD-G5-02' | ForEach-Object Line

# Step 7: Write the packet for a full retirement
./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/retired -RegisterPath tests/fixtures/retired/island-register.json -OutputPath "$Run\g5-retired" -AsOf 2026-11-27
$LASTEXITCODE

# Step 8: Run the tests
Invoke-Pester -Path tests -Output None -PassThru | Select-Object PassedCount, FailedCount
```

:::

<!-- labs:end -->

You write the packet for an island with leftovers, read the summary, check the manifest, break it on purpose, move the clock past the island's end of life, and write a full retirement. These are the steps of [Chapter 11, Lab 1](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#lab-1-fixtures-no-forest), which explains each result.

Every step runs in Windows PowerShell 5.1, the edition the kit declares. Open **Windows PowerShell** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\attribute-driven-migration-code\ad-retirement-evidence
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results:

```powershell
$Run = "C:\FMWLabs\results\attribute-driven-migration-10-proving-ad-is-retired\lab1\$((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHHmmssZ'))"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-27T143005Z`:

```text
C:\FMWLabs\results\attribute-driven-migration-10-proving-ad-is-retired\lab1\<run>
```

The kit runs the same in PowerShell 7, with the same packet, byte for byte. In a clone of the repository, use `examples/ad-retirement-evidence`.

1. **Read the island register.**

   ```powershell
   Get-Content config/island-register.json
   ```

   Expected output:

   ```text
   {
     "_comment": "The documented Kerberos island, if the agency keeps one at G5 (Book 01, Chapter 12; WD-065; WD-183): each domain controller kept, the workloads it still serves, their owner and the island's end-of-life date. Empty domainControllers means full retirement. Fictional; copy and edit at work.",
     "domain": "corp.contoso.example",
     "endOfLife": "2028-09-30",
     "owner": "Platform lead",
     "domainControllers": ["DC-ISLAND01"],
     "workloads": [
       { "name": "Legacy payroll interface (fictional)", "accounts": ["svc-payroll-if", "gmsa-payrollif$"], "spns": ["HTTP/payroll-if.corp.contoso.example"], "endOfLife": "2028-06-30" }
     ],
     "trusts": [],
     "allowedHosts": ["PAYROLL-IF01", "DC-ISLAND01", "PLATFORM01"],
     "authWindowDays": 30
   }
   ```

   One domain controller kept, one workload, no trusts, three hosts allowed to authenticate. The island ends on 2028-09-30 and its workload on 2028-06-30.

2. **Write the packet for an island with leftovers.** The second command prints the exit code.

   ```powershell
   ./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath "$Run\g5" -AsOf 2026-11-27
   $LASTEXITCODE
   ```

   Expected output:

   ```text
   Domain         : corp.contoso.example
   Ready          : False
   Findings       : 7
   Warnings       : 1
   ManifestSha256 : 2b0a5f1133c9d73cb00a7ed8cb7939d9bd252383de40b3bf2695b1bf74528817
   OutputPath     : C:\FMWLabs\results\attribute-driven-migration-10-proving-ad-is-retired\lab1\<run>\g5

   2
   ```

   Exit 2: the packet has findings, so it isn't ready for the gate owner.

3. **Read the summary.**

   ```powershell
   Get-Content "$Run\g5\summary.md"
   ```

   Expected output:

   ```text
   # G5 evidence packet: corp.contoso.example, 2026-11-27

   - Mode: Kerberos island (DC-ISLAND01, end of life 2028-09-30)
   - Domain controllers read: 2; DC locator SRV records: 2; trusts: 1
   - Authentication rows read: 4 over 30 days
   - Findings: 7; warnings: 1
   - Ready for the gate owner: no

   ## Findings

   - AD-G5-01 (Finding) DC02: A domain controller that is neither decommissioned nor in the island register
   - AD-G5-03 (Finding) DC03: An NTDS Settings object for a server that is no longer a domain controller: clean up its metadata
   - AD-G5-04 (Finding) DC03.corp.contoso.example: A DC locator SRV record pointing at a host that is not an island domain controller
   - AD-G5-05 (Finding) partner.fabrikam.example: A trust the register doesn't list (direction: Outbound)
   - AD-G5-06 (Finding) svc-reports MSSQLSvc/rpt-sql01.corp.contoso.example:1433: An SPN on an account the register does not list: a service still depends on Kerberos from the domain
   - AD-G5-07 (Finding) jlee: 14 authentication events on the domain controllers in the window from an account the register does not list
   - AD-G5-07 (Finding) svc-reports: 96 authentication events on the domain controllers in the window from an account the register does not list
   - AD-G5-08 (Warn) FIN-PC-0442: An enabled computer that signed in to the domain in the window and is not a listed host

   The packet supports CM-8, AC-2, IA-2, AU-6, CA-7 and SA-22; the gate owner checks it and the assessor decides each control.
   ```

   The payroll interface's own sign-ins aren't findings: the register lists its account and its host.

4. **Check every hash in the manifest**, then the controls and KSIs it records:

   ```powershell
   Import-Module ./powershell/AdRetirementEvidence/AdRetirementEvidence.psm1
   $m = Get-Content "$Run\g5\manifest.json" -Raw | ConvertFrom-Json
   $m.files | ForEach-Object { '{0,-15} {1}' -f $_.path, ($_.sha256 -eq (Get-AreSha256 "$Run\g5\$($_.path)")) }
   $m.register.sha256 -eq (Get-AreSha256 config/island-register.json)
   "$($m.controls -join ', ') | $($m.ksis -join ', ')"
   ```

   Expected output:

   ```text
   auth.json       True
   computers.json  True
   dcs.json        True
   findings.json   True
   ntds.json       True
   spns.json       True
   srv.json        True
   summary.md      True
   trusts.json     True
   True
   CM-8, AC-2, IA-2, AU-6, CA-7, SA-22 | KSI-PIY-GIV, KSI-MLA-EVC
   ```

5. **Break it on purpose.** Add a line to the findings, then list the files whose hash no longer matches:

   ```powershell
   Add-Content "$Run\g5\findings.json" '[]'
   $m.files | Where-Object { $_.sha256 -ne (Get-AreSha256 "$Run\g5\$($_.path)") } | ForEach-Object path
   ```

   Expected output:

   ```text
   findings.json
   ```

6. **Move the clock past the island's end of life.**

   ```powershell
   ./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/island -OutputPath "$Run\g5-late" -AsOf 2028-10-01
   Select-String -Path "$Run\g5-late\summary.md" -Pattern 'AD-G5-02' | ForEach-Object Line
   ```

   Expected output:

   ```text
   Domain         : corp.contoso.example
   Ready          : False
   Findings       : 9
   Warnings       : 0
   ManifestSha256 : 3bafa9556d919674cec02d86550791a6e422bdc17269b5fd3eef7d8c3553cf66
   OutputPath     : C:\FMWLabs\results\attribute-driven-migration-10-proving-ad-is-retired\lab1\<run>\g5-late

   - AD-G5-02 (Finding) corp.contoso.example: The island's end of life, 2028-09-30, has passed
   - AD-G5-02 (Finding) Legacy payroll interface (fictional): The workload's end of life, 2028-06-30, has passed
   ```

   Two more findings, and the PC's warning is gone: its last sign-in is outside the 30-day window.

7. **Write the packet for a full retirement.**

   ```powershell
   ./Invoke-AreEvidence.ps1 -Domain corp.contoso.example -FixturePath tests/fixtures/retired -RegisterPath tests/fixtures/retired/island-register.json -OutputPath "$Run\g5-retired" -AsOf 2026-11-27
   $LASTEXITCODE
   ```

   Expected output:

   ```text
   Domain         : corp.contoso.example
   Ready          : True
   Findings       : 0
   Warnings       : 0
   ManifestSha256 : 7079229195a63138e4b4012092266b7ac9ae97529a600e611d47d9c57234a755
   OutputPath     : C:\FMWLabs\results\attribute-driven-migration-10-proving-ad-is-retired\lab1\<run>\g5-retired

   0
   ```

8. **Run the tests.**

   ```powershell
   Invoke-Pester -Path tests -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   Expected output:

   ```text
   PassedCount FailedCount
   ----------- -----------
            15           0
   ```

**Check your work:** given a packet, you can say which Phase 5 step each finding sends you back to, and show that its files are the ones the kit wrote.

## Unit 5: Exercise: Lab 2 (your test forest)

*Not timed. Not run by the authors.*

Grant your test account the workspace role the kit declares, export the authentication rows with the kit's query, write a register for your test island, check the reads, write the packet, record its manifest hash, and back it out. Follow [Chapter 11, Lab 2](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#lab-2-test-forest-and-test-workspace).

<!-- labs:begin module-lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #module-lab-2-commands collapse="false" title="The Lab 2 commands, against your test environment"}
Every command in [Chapter 11, Lab 2](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#lab-2-test-forest-and-test-workspace), in order, against your test environment, never production.

Replace each `<placeholder>` with your test environment's value.

The chapter's steps say what each command does and what to look for.

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

- **You need:** a test forest, never production, whose domain controllers forward their Security log to a test Log Analytics workspace; a domain-joined machine with RSAT's Active Directory module; and PowerShell 7 with Az.Accounts and Az.OperationalInsights for the workspace steps.
- **Back it out:** step 7 deletes the packet, the authentication export and the register copy, and removes the role assignment.

## Unit 6: Knowledge check

*5 minutes*

1. A domain controller was switched off but never demoted. What does the packet report?
   a. Nothing: it's off.
   b. AD-G5-01 if Active Directory still lists it, and AD-G5-03 and AD-G5-04 for the NTDS Settings object and DC locator record it leaves.
   c. A warning for the device track.
2. The authentication export has no rows at all. What does that show?
   a. Nothing signs in through the domain controllers any more.
   b. Nothing yet: the events aren't reaching the workspace. While domain controllers still run, the kit reports AD-G5-09 and exits 2; fix auditing and forwarding and export again.
   c. The island has ended.
3. Why does the manifest record the island register's SHA-256?
   a. So a register widened to make findings disappear is visible as a changed register.
   b. To make the packet larger.
   c. Because the SIEM requires it.
4. Why is AD-G5-08 a warning and not a finding?
   a. Computers don't matter at G5.
   b. `lastLogonTimestamp` is approximate by design, and devices are proved by the device track.
   c. The kit can't read computers.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [what it leaves to you](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#what-it-leaves-to-you) and steps 2 and 3 of the lab.
2. **b.** See [Chapter 11's dangers](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#dangers) and Lab 2, step 2.
3. **a.** See [Chapter 11's dangers](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#dangers) and step 4 of the lab.
4. **b.** See [the checks](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#the-checks).
:::

## Unit 7: Summary

*2 minutes*

You compared a fictional forest with its island register, read each finding back to its Phase 5 step, checked the packet's hashes and caught an edit, watched the island's end of life become a finding, and wrote a full retirement that reads clean.

**Evidence an ISSO keeps from this module:** the packet (what was read, `findings.json`, `summary.md` and `manifest.json`) in the evidence repository, the manifest's hash in the SIEM record, and the reviewed island register whose hash the manifest carries. The records and sanitization of each retired domain controller are Book 00's [decommissioning checklist](../../books/b00-orientation/10-retirement-steady-state-and-success.md#records-before-hardware-the-decommissioning-checklist), which the kit doesn't check. Before the gate, work through the [Chapter 11 checklist](../../books/b19-developer-workbook/11-proving-ad-is-retired.md#checklist).

::: {.callout-tip}
## You've finished the path
[Previous: Module 9](09-deploying-to-test-and-production.md) · [Learning path](index.md) · [Labs](../labs.md#adm)
:::
