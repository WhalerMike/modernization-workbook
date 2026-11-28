---
title: "Chapter 08 — Shutting Down a Retired or Replaced Application"
description: "Book 18 Appendix B's six shutdown gates for one application, in code: the app-retirement kit reads the application's footprint (its decision, records disposition, schedule, Entra app registration, DNS records, certificates, accounts, firewall rules, monitoring sources, licenses and the systems that call it), checks the gates with seven rules, and writes the decommission plan with the commands each owning team runs and a manifest of SHA-256 hashes. Read only: it runs none of the commands. Lab 1 writes the plan for a fictional application at two points in its retirement and checks the manifest; Lab 2 switches off a throwaway app registration in a test tenant and writes the plan from its live sign-in state."
doc-type: workbook-chapter
audience: [Technical]
family: dw-application-modernization
part: How
series-order: 8
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 08 — Shutting Down a Retired or Replaced Application

*A retired application is switched off in one change and removed in a dozen others. The plan is what keeps the dozen from being forgotten.*

::: {.callout-note}
## In this chapter
The end of an application's life: [Book 18, Appendix B](../../../books/b18-application-modernization/appendix-b-shutting-down-a-retired-application.md)'s six gates, run by the [`examples/app-retirement`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/app-retirement) kit. You start with what the appendix and Microsoft Learn give you, then read how the kit checks each gate, what it prints for the owning teams, and what it leaves to them. Lab 1 writes the decommission plan for a fictional application on a laptop; Lab 2 switches off a throwaway app registration in a test tenant and writes its plan from the live sign-in state. The appendix holds the procedure, who signs each gate and the commands; this chapter doesn't repeat them.
:::

## Goal and audience

**Goal.** By the end of this chapter you can write an application's decommission plan at any of its gates, say which gate it's blocked at and why, hand each owning team its removal commands, and show later that the plan you filed is the plan the kit wrote.

**Audience.** The application owner, who signs R1, R2 and R4; the identity, DNS, PKI, network and security operations teams, who each remove their part at R5; and the ISSO, who files the last plan's manifest with the authorization closure at R6. You should have read Appendix B. No earlier chapter of this workbook is needed.

## Start with the appendix and Microsoft Learn

### What they give you

Appendix B gives the six gates in order (R1 Decide, R2 Quiet, R3 Records, R4 Switch off, R5 Remove, R6 Close), who signs each, the footprint an application leaves in systems it doesn't own, and the commands from Microsoft Learn. Its order keeps the retirement reversible: nothing is deleted until the application has been quiet, its records are dealt with, and it has stayed switched off for a 30-day window, which is the program's design.

Microsoft Learn gives the facts the gates rest on. Setting a service principal's `accountEnabled` to `false` disables sign-in to the application, prevents tokens from being issued for it, and shows the enterprise application as *Deactivated*; setting it back to `true` restores sign-in.[^am08-disable] A deleted application moves to a temporary container and can be restored within 30 days, after which it's permanently deleted.[^am08-delete] [^am08-restore] The last sign-in of an application, as a client or a resource, delegated or app-only, is in `servicePrincipalSignInActivities`, a Graph beta report.[^am08-spsignin] [^am08-spsignin-resource] [Book 14, Appendix I](../../../books/b14-compliance/appendix-i-closing-a-systems-authorization.md) holds the authorization side: the ten closure steps and the authorizing official's closing decision that R6 waits for.

### What they leave to you

Each row is pinned by a test in `tests/AppRetirement.Tests.ps1`.

| What the appendix gives | Why it matters | What the kit adds |
|---|---|---|
| R1: the disposition, owner and decision record; for a replace, the replacement | A retirement with no recorded decision can't be defended or undone | ART-01 names what's missing, including a replace with no replacement named |
| R2: from the quiet date, no dependent calls it and no one signs in | A dependent still calling breaks on the switch-off day | ART-03 compares each dependent's last call with the quiet date; ART-04 does the same for the last sign-in |
| R3: the records officer signs off | Records deleted with the application can't be recovered | ART-02 until both the sign-off and the confirmation dates are recorded |
| R4: sign-in disabled, reversibly | A switch-off that never happened leaves the application live | ART-05 when sign-in is still enabled after the switch-off date |
| "Nothing is deleted until" the window ends | An early removal can't be reversed if someone objects | ART-06, a warning, for any item removed inside the window |
| R5: every item removed by its owning team | A DNS record, certificate or account left behind looks like a live system to the next assessment | ART-07 for each item still there after the removal date; the plan prints the commands for the ones with a Learn cmdlet, and skips an account already disabled |
| R6: every other gate met | Closing an authorization with a gate open closes it on paper only | R6 stays `pending` until R1 to R5 are `met`, then shows `ready` |
| The plan's manifest goes with the closure | A plan edited after filing proves nothing | `manifest.json` holds the SHA-256 of each file and of the footprint, with the controls and KSIs |

**The verdict.** Use Appendix B's gates and Learn's commands as published. Build the date checks, the footprint list and the manifest, and keep every removal in the owning team's own change.

## The code

| Function | What it does | Writes |
|---|---|---|
| `Get-ArtFootprint` | Reads the footprint file; with `-ReadEntra`, refreshes each app registration's `accountEnabled` and last sign-in from Graph | Nothing |
| `Test-ArtRetirement` | Checks the six gates and returns each gate's state and the findings | Nothing |
| `New-ArtDecommissionPlan` | The plan: gates, findings, the commands for the owning teams, and the manifest | `plan.md`, `plan.json`, `findings.json`, `manifest.json` |
| `Get-ArtSha256` | A file's SHA-256, with line endings normalized so a hash taken on one platform matches on another | Nothing |
| `Invoke-ArtPlan.ps1` | Runs `New-ArtDecommissionPlan`, prints the summary, and exits with 2 when a finding blocks a gate | The plan |

The footprint is one JSON file assembled from the exports of the systems the application touched: the CMDB, DNS, the certificate inventory, Active Directory, Entra ID, the firewall, the SIEM and the license portal. The fixture, `tests/fixtures/footprint.json`, is *Grants Tracker (fictional)*, replaced by a shared service: quiet from October 20, 2026, switched off on November 3, with a 30-day window, so its items are due for removal from December 3. Live reads are in [`config/calls.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/app-retirement/config/calls.json); the controls and KSIs the manifest names are in [`config/requirements.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/app-retirement/config/requirements.json).

::: {.callout-important}
## Illustrative code
Lab 1's footprint is a fixture. The live read (`-ReadEntra`) hasn't been run against a tenant by the authors, and the sign-in activity it reads is a Graph beta report. The kit prints the removal commands and runs none of them: each owning team runs its own, in its own change, at its gate. The kit only knows about what the footprint lists.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/app-retirement`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/app-retirement`. Each step below says what it does and what to look for.

```powershell
# Step 1: Write the plan after the removal date
./Invoke-ArtPlan.ps1 -FootprintPath tests/fixtures/footprint.json -OutputPath out/retire -AsOf 2026-12-10

# Step 2: Read the findings
Get-Content out/retire/findings.json | ConvertFrom-Json | Format-Table Rule, Severity, Gate, Object

# Step 3: Read the plan
Get-Content out/retire/plan.md

# Step 3: Read the plan
**R4 switch off: Grants Tracker (fictional) (reversible: set it back to $true)**
$sp = Get-MgServicePrincipal -Filter "appId eq '`f3000000-0000-4000-8000-000000000501`'"
Update-MgServicePrincipal -ServicePrincipalId $sp.Id -AccountEnabled:$false
**R5 remove, after the reversible window: restorable for 30 days from the deleted items**
Remove-MgApplication -ApplicationId (Get-MgApplication -Filter "appId eq '`f3000000-0000-4000-8000-000000000501`'").Id
Remove-DnsServerResourceRecord -ComputerName DNS01 -ZoneName "corp.contoso.example" -RRType "A" -Name "grants" -RecordData "10.40.2.17"
Disable-ADAccount -Identity 'gmsa-grantsjob$'

# Step 4: The same application before its switch-off date
./Invoke-ArtPlan.ps1 -FootprintPath tests/fixtures/footprint.json -OutputPath out/retire-early -AsOf 2026-10-30
Get-Content out/retire-early/findings.json | ConvertFrom-Json | Format-Table Rule, Severity, Gate, Object

# Step 5: Leave sign-in on, and sign in after the quiet date
Import-Module ./powershell/AppRetirement/AppRetirement.psm1 -Force
$fp = Get-ArtFootprint -Path tests/fixtures/footprint.json
$fp.entraApps[0].accountEnabled = $true; $fp.entraApps[0].lastSignIn = '2026-10-25T09:00:00Z'
(Test-ArtRetirement -Footprint $fp -AsOf 2026-12-10).Findings | Where-Object Gate -in 'R2', 'R4' | Format-Table Rule, Gate, Object, Issue

# Step 6: Check the manifest
$m = Get-Content out/retire/manifest.json -Raw | ConvertFrom-Json
"Controls: $($m.controls -join ', ')"; "KSIs: $($m.ksis -join ', ')"
$m.footprint.sha256 -eq (Get-ArtSha256 tests/fixtures/footprint.json)
$m.files | ForEach-Object { [pscustomobject]@{ File = $_.path; Matches = $_.sha256 -eq (Get-ArtSha256 "out/retire/$($_.path)") } }

# Step 7: Edit the plan, and check again
Add-Content out/retire/plan.md 'R5 met (edited)'
$m.files | ForEach-Object { [pscustomobject]@{ File = $_.path; Matches = $_.sha256 -eq (Get-ArtSha256 "out/retire/$($_.path)") } }

# Step 8: Run the kit's tests
Invoke-Pester -Path tests -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Write the plan after the removal date:**

   ```powershell
   ./Invoke-ArtPlan.ps1 -FootprintPath tests/fixtures/footprint.json -OutputPath out/retire -AsOf 2026-12-10
   ```

   <!-- capture:begin 08-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/08-1.txt))](captures/08-1.png){.lightbox fig-alt="Terminal window showing ./Invoke-ArtPlan.ps1 -FootprintPath tests/fixtures/footprint.json -OutputPath… and what it printed"}

   <!-- capture:end -->

   R1, R3 and R4 are met; R2 and R5 are blocked, so the script exits with 2, which stops a pipeline that runs it.

2. **Read the findings:**

   ```powershell
   Get-Content out/retire/findings.json | ConvertFrom-Json | Format-Table Rule, Severity, Gate, Object
   ```

   <!-- capture:begin 08-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/08-2.txt))](captures/08-2.png){.lightbox fig-alt="Terminal window showing Get-Content out/retire/findings.json | ConvertFrom-Json | Format-Table Rule, … and what it printed"}

   <!-- capture:end -->

   A payments system called the application after the quiet date (ART-03). Six items are past their removal date (ART-07). A firewall rule was removed inside the window (ART-06): a warning, because the retirement was still meant to be reversible, and the owner explains it.

3. **Read the plan,** which is what the change board and the owning teams work from:

   ```powershell
   Get-Content out/retire/plan.md
   ```

   <!-- capture:begin 08-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/08-3.txt))](captures/08-3.png){.lightbox fig-alt="Terminal window showing Get-Content out/retire/plan.md and what it printed"}

   ::: {.callout-note title="plan.md, formatted"}
   **Decommission plan: Grants Tracker (fictional), 2026-12-10**

   Disposition: Replace by Grants module of the shared service (fictional). Decision PORT-2026-118. Quiet from 2026-10-20; switch off 2026-11-03; remove from 2026-12-03.

   | Gate | State |
   |---|---|
   | R1 Decide | met |
   | R2 Quiet | blocked |
   | R3 Records | met |
   | R4 Switch off | met |
   | R5 Remove | blocked |
   | R6 Close | pending |

   **Findings**

   - ART-03 (Finding, R2) Payments Gateway (fictional): Called the application on 2026-10-28, after the quiet date 2026-10-20
   - ART-07 (Finding, R5) DNS record: grants.corp.contoso.example A: Not yet removed; the removal date was 2026-12-03
   - ART-07 (Finding, R5) Certificate: CN=grants.corp.contoso.example: Not yet removed; the removal date was 2026-12-03
   - ART-07 (Finding, R5) Account (user): svc-grants: Not yet removed; the removal date was 2026-12-03
   - ART-07 (Finding, R5) Account (gmsa): gmsa-grantsjob$: Not yet removed; the removal date was 2026-12-03
   - ART-06 (Warn, R5) Firewall rule: FW-2291 Users to grants:443: Removed on 2026-11-10, before the reversible window ended on 2026-12-03
   - ART-07 (Finding, R5) Monitoring source: Grants Tracker IIS logs (fictional): Not yet removed; the removal date was 2026-12-03
   - ART-07 (Finding, R5) License: Reporting add-on (fictional) x40: Not yet removed; the removal date was 2026-12-03

   **Commands for the owning teams**

   Run each in its own change, at its gate. Certificates, firewall rules, monitoring sources, licenses and the CMDB item are removed by their owning teams in their own tools.

   ```powershell
   **R4 switch off: Grants Tracker (fictional) (reversible: set it back to $true)**
   $sp = Get-MgServicePrincipal -Filter "appId eq '`f3000000-0000-4000-8000-000000000501`'"
   Update-MgServicePrincipal -ServicePrincipalId $sp.Id -AccountEnabled:$false
   **R5 remove, after the reversible window: restorable for 30 days from the deleted items**
   Remove-MgApplication -ApplicationId (Get-MgApplication -Filter "appId eq '`f3000000-0000-4000-8000-000000000501`'").Id
   Remove-DnsServerResourceRecord -ComputerName DNS01 -ZoneName "corp.contoso.example" -RRType "A" -Name "grants" -RecordData "10.40.2.17"
   Disable-ADAccount -Identity 'gmsa-grantsjob$'
   ```

   R6 Close: the authorization closure (Book 14, Appendix I), the CMDB item retired, and this plan's manifest filed with it.
   :::

   <!-- capture:end -->

   The commands are Learn's syntax for this footprint. `svc-grants` was disabled at the switch-off, so it gets no `Disable-ADAccount` line; the gMSA wasn't, so it does.

4. **The same application before its switch-off date:**

   ```powershell
   ./Invoke-ArtPlan.ps1 -FootprintPath tests/fixtures/footprint.json -OutputPath out/retire-early -AsOf 2026-10-30
   Get-Content out/retire-early/findings.json | ConvertFrom-Json | Format-Table Rule, Severity, Gate, Object
   ```

   <!-- capture:begin 08-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/08-4.txt))](captures/08-4.png){.lightbox fig-alt="Terminal window showing ./Invoke-ArtPlan.ps1 -FootprintPath tests/fixtures/footprint.json -OutputPath… and what it printed"}

   <!-- capture:end -->

   R4 and R5 are `pending`, and nothing is overdue yet. The payments system already blocks R2: the plan finds it before the switch-off, when it's still cheap to fix.

5. **Leave sign-in on, and sign in after the quiet date,** on a copy of the footprint in memory:

   ```powershell
   Import-Module ./powershell/AppRetirement/AppRetirement.psm1 -Force
   $fp = Get-ArtFootprint -Path tests/fixtures/footprint.json
   $fp.entraApps[0].accountEnabled = $true; $fp.entraApps[0].lastSignIn = '2026-10-25T09:00:00Z'
   (Test-ArtRetirement -Footprint $fp -AsOf 2026-12-10).Findings | Where-Object Gate -in 'R2', 'R4' | Format-Table Rule, Gate, Object, Issue
   ```

   <!-- capture:begin 08-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/08-5.txt))](captures/08-5.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/AppRetirement/AppRetirement.psm1 -Force and what it printed"}

   <!-- capture:end -->

   ART-04 for the sign-in and ART-05 for the switch-off that didn't happen. With `-ReadEntra`, the kit reads both from Entra ID.

6. **Check the manifest:** the controls and KSIs, and each file's hash against the file:

   ```powershell
   $m = Get-Content out/retire/manifest.json -Raw | ConvertFrom-Json
   "Controls: $($m.controls -join ', ')"; "KSIs: $($m.ksis -join ', ')"
   $m.footprint.sha256 -eq (Get-ArtSha256 tests/fixtures/footprint.json)
   $m.files | ForEach-Object { [pscustomobject]@{ File = $_.path; Matches = $_.sha256 -eq (Get-ArtSha256 "out/retire/$($_.path)") } }
   ```

   <!-- capture:begin 08-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/08-6.txt))](captures/08-6.png){.lightbox fig-alt="Terminal window showing $m = Get-Content out/retire/manifest.json -Raw | ConvertFrom-Json and what it printed"}

   <!-- capture:end -->

7. **Edit the plan, and check again:**

   ```powershell
   Add-Content out/retire/plan.md 'R5 met (edited)'
   $m.files | ForEach-Object { [pscustomobject]@{ File = $_.path; Matches = $_.sha256 -eq (Get-ArtSha256 "out/retire/$($_.path)") } }
   ```

   <!-- capture:begin 08-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/08-7.txt))](captures/08-7.png){.lightbox fig-alt="Terminal window showing Add-Content out/retire/plan.md 'R5 met (edited)' and what it printed"}

   <!-- capture:end -->

   `plan.md` no longer matches. The manifest shows a change; it doesn't prevent one: file it where the ISSO controls who can write.

8. **Run the kit's tests:**

   ```powershell
   Invoke-Pester -Path tests -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 08-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/08-8.txt))](captures/08-8.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests -Output None -PassThru | Select-Object PassedCount,… and what it printed"}

   <!-- capture:end -->

**Expected result:** a plan blocked at R2 and R5 with seven findings and one warning, the same application earlier with only the R2 finding, ART-04 and ART-05 when sign-in is left on, a manifest whose hashes match until the plan is edited, and the tests passing. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 08-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/08-9.txt))](captures/08-9.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant

Use a Microsoft Entra test tenant, never production. You need the `Microsoft.Graph.Authentication` and `Microsoft.Graph.Applications` modules, and a test account with Cloud Application Administrator, to create, switch off and delete the throwaway app registration,[^am08-disable] [^am08-spcreate] and Reports Reader, to read its sign-in activity.[^am08-spsignin] The lab retires an app registration it creates itself, so nothing else in the tenant is touched. Work in `examples/app-retirement`, in one PowerShell 7 session. You'll replace `<test-tenant-id>`, the test tenant's ID.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/app-retirement`. Each step below says what it does and what to look for.

```powershell
# Step 1: Sign in, and create the application to retire
Connect-MgGraph -TenantId <test-tenant-id> -Scopes 'Application.ReadWrite.All','AuditLog.Read.All' -NoWelcome
$app = New-MgApplication -DisplayName 'Retirement lab (test)'
$sp = New-MgServicePrincipal -AppId $app.AppId
$app.AppId

# Step 2: Write its footprint
New-Item -ItemType Directory -Force out/lab | Out-Null
$fp = Get-Content tests/fixtures/footprint.json -Raw | ConvertFrom-Json -AsHashtable
$fp.application.name = 'Retirement lab (test)'
$fp.entraApps = @(@{ appId = $app.AppId; displayName = 'Retirement lab (test)'; accountEnabled = $true; lastSignIn = $null })
foreach ($k in 'dns', 'certificates', 'accounts', 'firewallRules', 'monitoring', 'licenses', 'dependents') { $fp[$k] = @() }
$today = (Get-Date).ToUniversalTime().Date
$fp.schedule = @{ quietFrom = $today.AddDays(-14).ToString('yyyy-MM-dd'); switchOff = $today.AddDays(-1).ToString('yyyy-MM-dd'); removeAfterDays = 30 }
$fp | ConvertTo-Json -Depth 5 | Set-Content out/lab/footprint.json

# Step 3: Write the plan from the live sign-in state
./Invoke-ArtPlan.ps1 -FootprintPath out/lab/footprint.json -OutputPath out/lab/plan-1 -ReadEntra
Get-Content out/lab/plan-1/findings.json | ConvertFrom-Json | Format-Table Rule, Gate, Object, Issue

# Step 4: Switch it off with the plan's R4 command, and write the plan again
Update-MgServicePrincipal -ServicePrincipalId $sp.Id -AccountEnabled:$false
./Invoke-ArtPlan.ps1 -FootprintPath out/lab/footprint.json -OutputPath out/lab/plan-2 -ReadEntra
Get-Content out/lab/plan-2/plan.json

# Step 5: Back it out
Update-MgServicePrincipal -ServicePrincipalId $sp.Id -AccountEnabled:$true
(Get-MgServicePrincipal -ServicePrincipalId $sp.Id -Property accountEnabled).AccountEnabled
Remove-MgServicePrincipal -ServicePrincipalId $sp.Id
Remove-MgApplication -ApplicationId $app.Id
Remove-Item -Recurse -Force out/lab
Disconnect-MgGraph
```

:::

<!-- labs:end -->

1. **Sign in, and create the application to retire:**

   ```powershell
   Connect-MgGraph -TenantId <test-tenant-id> -Scopes 'Application.ReadWrite.All','AuditLog.Read.All' -NoWelcome
   $app = New-MgApplication -DisplayName 'Retirement lab (test)'
   $sp = New-MgServicePrincipal -AppId $app.AppId
   $app.AppId
   ```

2. **Write its footprint:** the fixture's decision and records, this application only, quiet from two weeks ago and switched off yesterday:

   ```powershell
   New-Item -ItemType Directory -Force out/lab | Out-Null
   $fp = Get-Content tests/fixtures/footprint.json -Raw | ConvertFrom-Json -AsHashtable
   $fp.application.name = 'Retirement lab (test)'
   $fp.entraApps = @(@{ appId = $app.AppId; displayName = 'Retirement lab (test)'; accountEnabled = $true; lastSignIn = $null })
   foreach ($k in 'dns', 'certificates', 'accounts', 'firewallRules', 'monitoring', 'licenses', 'dependents') { $fp[$k] = @() }
   $today = (Get-Date).ToUniversalTime().Date
   $fp.schedule = @{ quietFrom = $today.AddDays(-14).ToString('yyyy-MM-dd'); switchOff = $today.AddDays(-1).ToString('yyyy-MM-dd'); removeAfterDays = 30 }
   $fp | ConvertTo-Json -Depth 5 | Set-Content out/lab/footprint.json
   ```

3. **Write the plan from the live sign-in state:**

   ```powershell
   ./Invoke-ArtPlan.ps1 -FootprintPath out/lab/footprint.json -OutputPath out/lab/plan-1 -ReadEntra
   Get-Content out/lab/plan-1/findings.json | ConvertFrom-Json | Format-Table Rule, Gate, Object, Issue
   ```

   ART-05: sign-in is still enabled after the switch-off date. If Graph says the service principal isn't found, wait a minute for it to replicate and run the step again. A new app registration has no sign-in activity, so there's no ART-04.

4. **Switch it off with the plan's R4 command, and write the plan again:**

   ```powershell
   Update-MgServicePrincipal -ServicePrincipalId $sp.Id -AccountEnabled:$false
   ./Invoke-ArtPlan.ps1 -FootprintPath out/lab/footprint.json -OutputPath out/lab/plan-2 -ReadEntra
   Get-Content out/lab/plan-2/plan.json
   ```

   R4 is `met` and R5 is `pending` until the window ends. In the Microsoft Entra admin center, the enterprise application's activation status shows *Deactivated*.

5. **Back it out:** turn sign-in back on, which is R4's reversal, then delete the throwaway application and the lab's files, which name the test tenant's objects:

   ```powershell
   Update-MgServicePrincipal -ServicePrincipalId $sp.Id -AccountEnabled:$true
   (Get-MgServicePrincipal -ServicePrincipalId $sp.Id -Property accountEnabled).AccountEnabled
   Remove-MgServicePrincipal -ServicePrincipalId $sp.Id
   Remove-MgApplication -ApplicationId $app.Id
   Remove-Item -Recurse -Force out/lab
   Disconnect-MgGraph
   ```

   The second line prints `True`. The deleted application stays in the tenant's deleted items for 30 days.[^am08-delete]

## Verified facts

| Item | Value | Source |
|---|---|---|
| Disabling sign-in | `accountEnabled` set to `false` on the service principal prevents tokens from being issued for the application and shows it as *Deactivated*; `true` restores sign-in; Cloud Application Administrator, Application Administrator or the service principal's owner | [^am08-disable] |
| Deleting an application | Moves it to a temporary container, restorable within 30 days, then permanently deleted; `Application.ReadWrite.All` delegated | [^am08-delete] [^am08-restore] |
| Reading `accountEnabled` | `GET /servicePrincipals(appId='{appId}')`; `Application.Read.All` | [^am08-spget] |
| Last sign-in | `servicePrincipalSignInActivities`, Graph beta, filterable by `appId`; `AuditLog.Read.All`; Reports Reader, Security Reader or Security Administrator for delegated access; listed for the global service, which GCC uses[^am08-graph-clouds] | [^am08-spsignin] |
| What the last sign-in proves | During the preview it may include partial sign-ins; a timestamp alone doesn't establish that authentication succeeded | [^am08-spsignin-resource] |
| Removal commands | `Remove-DnsServerResourceRecord` with `-RecordData`; `Disable-ADAccount` | [^am08-dns] [^am08-disable-ad] |
| The kit's tests | 15 Pester tests pass | Lab 1, November 27, 2026 |

## Federal requirements and evidence

The manifest's controls and KSIs are the kit's `config/requirements.json`, step `retirement-plan`: controls CM-8, AC-2, CA-3, SR-12 and SI-12, and KSIs KSI-PIY-GIV, KSI-IAM-AAM and KSI-CMT-LMC.[^am08-sp80053] [^am08-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| Every component the application left is listed, and each is flagged until it's removed (Lab 1, steps 2 and 3) | CM-8, System Component Inventory | KSI-PIY-GIV | The asset manager, who retires the CMDB item |
| The application's sign-in is off, and its accounts and registration are on the removal list (Lab 1, step 5; Lab 2, steps 3 and 4) | AC-2, Account Management | KSI-IAM-AAM | The identity team |
| No dependent still calls it, and the exchanges end with it (Lab 1, steps 2 and 4) | CA-3, Information Exchange | — | The application owner, with each partner system's owner |
| Each component is removed, after the window, by its owning team (Lab 1, step 3) | SR-12, Component Disposal | — | Each owning team, with its removal record |
| The records officer confirmed the records disposition before anything was removed (R3) | SI-12, Information Management and Retention | — | The records officer |
| The plan filed at R6 is the plan the kit wrote (Lab 1, steps 6 and 7) | Supports the closure record of [Book 14, Appendix I](../../../books/b14-compliance/appendix-i-closing-a-systems-authorization.md) | — | The ISSO, who files it with the closing decision |

The manifest also names KSI-CMT-LMC, which [Appendix B](../../../books/b18-application-modernization/appendix-b-shutting-down-a-retired-application.md#what-the-gates-support-and-the-evidence) lines up with each change; this table doesn't pair it with a control while that pairing is under review.

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them. The plan's evidence supports these controls; the agency's assessor decides them *(design guidance)*.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Something deleted before the window ends | Nothing to roll back to if a user or a dependent objects | The gate order; ART-06 warns on any early removal; the kit deletes nothing |
| A caller nobody listed | The switch-off breaks a system the plan never knew about | ART-03 is only as good as the dependency map: build the footprint's `dependents` from [Chapter 02's dependency edges](../../../books/b18-application-modernization/02-triaging-the-portfolio.md#recording-dependencies-as-an-evidence-map) and the firewall logs, and tell dependent owners before the quiet date |
| The last sign-in read as proof | A beta report in preview may include partial sign-ins, and isn't supported in production applications | ART-04 blocks on any timestamp after the quiet date, and the owner explains it; the application's own logs are read too |
| A footprint item never listed | A certificate keeps renewing, a DNS record keeps resolving | Assemble the footprint from each system's export, not from memory; each owning team signs its part of R5 |
| The kit run as a removal tool | A removal outside a change | A test fails if the module sends a Graph write or calls a removal cmdlet; the commands are only printed |
| A plan edited after filing | The closure rests on a plan nobody wrote | The manifest's hashes (Lab 1, step 7); file it where only the ISSO can write |

## Checklist

- [ ] The footprint was assembled from each system's export, and every owning team has seen its rows.
- [ ] R1 to R3 are `met` before the switch-off change is raised; any ART-03 or ART-04 is explained by the owner.
- [ ] The switch-off is its own change, with the reversal (`-AccountEnabled:$true`) in its back-out plan.
- [ ] No item was removed inside the window, or each ART-06 warning is explained.
- [ ] Every ART-07 item has a removal record from its owning team.
- [ ] R6 shows `ready`, and the last plan's `manifest.json` is filed with the closure record.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 07 — The Post-Change Test and the Evidence Pack](07-the-post-change-test-and-the-evidence-pack.md) · [Workbook index](index.md) · [Book 18, Appendix B](../../../books/b18-application-modernization/appendix-b-shutting-down-a-retired-application.md) · [Book 14, Appendix I](../../../books/b14-compliance/appendix-i-closing-a-systems-authorization.md)
:::

[^am08-disable]: Microsoft Learn, "Disable user sign-in for an application" (prerequisites; the Microsoft Graph PowerShell steps; restoring tenant-local sign-in), <https://learn.microsoft.com/entra/identity/enterprise-apps/disable-user-sign-in-portal> (read November 27, 2026; also cited by Book 18, Appendix B).
[^am08-delete]: Microsoft Learn, "Delete application," Microsoft Graph v1.0 (the 30-day temporary container; permissions), <https://learn.microsoft.com/graph/api/application-delete?view=graph-rest-1.0> (read November 27, 2026; also cited by Book 18, Appendix B).
[^am08-restore]: Microsoft Learn, "Restore an enterprise application," <https://learn.microsoft.com/entra/identity/enterprise-apps/restore-application> (accessed Nov 27, 2026; carried from Book 18, Appendix B).
[^am08-spget]: Microsoft Learn, "Get servicePrincipal," Microsoft Graph v1.0 (addressing by `appId`; least privileged permissions), <https://learn.microsoft.com/graph/api/serviceprincipal-get?view=graph-rest-1.0> (read November 27, 2026).
[^am08-spcreate]: Microsoft Learn, "Create servicePrincipal," Microsoft Graph v1.0 (the request must contain `appId`; permissions and roles; the `New-MgServicePrincipal` example), <https://learn.microsoft.com/graph/api/serviceprincipal-post-serviceprincipals?view=graph-rest-1.0> (read November 27, 2026).
[^am08-spsignin]: Microsoft Learn, "List servicePrincipalSignInActivities," Microsoft Graph beta (API availability; permissions; supported roles; the `appId` filter), <https://learn.microsoft.com/graph/api/reportroot-list-serviceprincipalsigninactivities?view=graph-rest-beta> (read November 27, 2026).
[^am08-spsignin-resource]: Microsoft Learn, "servicePrincipalSignInActivity resource type," Microsoft Graph beta (`lastSignInActivity`; the preview notes on partial sign-ins), <https://learn.microsoft.com/graph/api/resources/serviceprincipalsigninactivity?view=graph-rest-beta> (read November 27, 2026).
[^am08-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am08-dns]: Microsoft Learn, "Remove-DnsServerResourceRecord," <https://learn.microsoft.com/powershell/module/dnsserver/remove-dnsserverresourcerecord> (accessed Nov 27, 2026; carried from Book 18, Appendix B).
[^am08-disable-ad]: Microsoft Learn, "Disable-ADAccount," <https://learn.microsoft.com/powershell/module/activedirectory/disable-adaccount> (accessed Nov 27, 2026; carried from Book 18, Appendix B).
[^am08-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026; carried from Book 18, Appendix A; the control titles as Book 18, Appendix B and Book 14, Appendix I give them).
[^am08-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
