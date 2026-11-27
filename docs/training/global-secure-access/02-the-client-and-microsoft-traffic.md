---
title: "Module 2: The client and Microsoft traffic"
description: "Guide Steps 3 and 4: the Windows client's prerequisites and limits, packaging it as an Intune Win32 app with Learn's commands and detection rule, turning off DNS over HTTPS, hardening the client from ring 2, and counting client coverage; then the Microsoft traffic profile, which alone acquires Microsoft 365 and Entra ID traffic, scoped to the pilot, with source IP restoration and the signaling the compliant network check needs. Lab 2 packages and checks the client and enables the profile in a test tenant. About 45 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 09"
series-order: 2
review-status: approved
reviewed-sha256: ef98c166a14697f4314c78a23e26439aee07a9f27a6b0d16720934b3b97f9189
last-reviewed: 2026-11-18
---
# Module 2: The client and Microsoft traffic {.unnumbered}

*Part of the [Global Secure Access learning path](index.md). Guide [Step 3](../../books/guides/global-secure-access-implementation.md#step-3-client-deployment) and [Step 4](../../books/guides/global-secure-access-implementation.md#step-4-microsoft-traffic). About 45 minutes, plus Lab 2.*

**Watch:** the narrated deck for this module (about 11 minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_GSA_Module_2_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_GSA_Module_2_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-gsa-module-2) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-gsa-module-2/Training_GSA_Module_2_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-gsa-module-2/Training_GSA_Module_2_Narrated.vtt). The deck files join the next edition.

, in its [video](../../presentations/watch.html?v=Guide_Global_Secure_Access_Narrated) or its [narration script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-global-secure-access/Guide_Global_Secure_Access_Narration_Script.md).

## Introduction (3 minutes) {#gsa-m2-intro}

Everything after this module depends on two things: a client on every managed Windows device, and the Microsoft traffic profile carrying that device's Microsoft 365 and Entra ID traffic. The profile is what makes the real source address visible to Entra ID, and it is the prerequisite for the compliant network check and universal tenant restrictions in Module 3. In this module you package the client the way Learn does, scope the profile to a pilot group, turn on source IP restoration, and measure how much of the pilot's traffic the service actually carries.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs, by step](../../books/guides/global-secure-access-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| CM-6, CM-7, SI-4: managed devices carry the client and can't silently turn it off | KSI-MLA-EVC, KSI-CNA-RNT | The Intune app's assignment export and detection rule, remediation results, the device usage summary |
| AC-17, AU-3, SI-4: Microsoft 365 and Entra traffic acquired, sign-ins carrying the real source IP | KSI-IAM-ELP, KSI-MLA-OSM | The profile export and its assignments, the signaling GET, the sign-in query result |

The steps support these controls and provide evidence for them; the assessor decides whether each is satisfied. The program's mapping also lines Step 3 up with OMB M-22-09's device inventory expectations and Step 4 with TIC 3.0 Remote User Pattern 2.

## Learning objectives (1 minute) {#gsa-m2-objectives}

After this module, you'll be able to:

- name the client's platforms, prerequisites and the configurations it doesn't support;
- package the client as a Win32 app with Learn's install command, return codes and detection rule;
- explain why DNS over HTTPS is turned off and why the hardening remediation waits for ring 2;
- enable the Microsoft traffic profile for a pilot group and turn on source IP restoration;
- compute client coverage and the share of sign-ins carried by the service.

## Prerequisites (1 minute) {#gsa-m2-prerequisites}

- [Module 1](01-decide-design-and-log-first.md), with the telemetry on.
- [Book 05, Chapter 04: Intune-first onboarding](../../books/b05-devices/04-intune-first-onboarding.md), for the Win32 app model. Skim it.

## Unit 1: Where agencies are: the client's reach (5 minutes) {#gsa-m2-where}

Read the opening of the guide's [Step 3](../../books/guides/global-secure-access-implementation.md#step-3-client-deployment). The client runs on Windows 10 LTSC 2021 or later, Windows 11 and Windows 11 on Arm (a separate installer), and on Azure Virtual Desktop single-session and Windows 365, not AVD multi-session. The device must be joined, hybrid joined or registered in the tenant; registered devices carry only Private Access. It can't be installed on a machine that hosts virtual machines with a Hyper-V external switch, it tunnels IPv4 only, and it doesn't support secure DNS, DNS over TCP from browsers' built-in resolvers, or Group Policy NRPT rules. Those hosts go on the exception list with an owner and a review date. Like the rest of the service, the client is available in GCC.

## Unit 2: Package, harden, upgrade (10 minutes) {#gsa-m2-client}

Read the guide's Step 3, 3.1 to 3.5. Learn's installation script sets IPv4 preferred, runs the installer quietly and returns `3010` when a restart is needed; the Win32 app uses Learn's install and uninstall commands, the return codes `0`, `3010` and `1618`, and a file version detection rule. Because the client doesn't support secure DNS, an Intune settings catalog profile sets **Control the mode of DNS-over-HTTPS** to **Disabled** in Edge and Chrome. Learn's advice on hardening is to let users run unrestricted first, confirm nobody needs to disable the client, and only then hide the disable and sign-out buttons and restrict non-privileged users; the guide deploys that remediation from ring 2, not in the pilot. Upgrades follow Learn's phased approach: a new app for each version, widened ring by ring, the old one deleted last.

## Unit 3: The Microsoft traffic profile and source IP restoration (10 minutes) {#gsa-m2-microsoft-traffic}

Read the guide's [Step 4](../../books/guides/global-secure-access-implementation.md#step-4-microsoft-traffic). Microsoft 365 and Entra ID traffic can be acquired only by this profile, never by the Internet Access profile. Enable it, assign the pilot group in the portal (the pages the guide read give no Graph request for the assignment), and set signaling explicitly: it carries source IP restoration, it is on by default only for tenants onboarded after June 2025, and it is the same setting Module 3's compliant network check needs. Learn's caution matters later: once Conditional Access policies depend on IP locations or the compliant network, turning signaling off can block users, so those policies come out of enforcement first.

The profile has no report-only mode. The pilot group is the audit phase, read through the sign-in query for five business days; the rollback is removing the ring's group from the assignment.

## Exercise: Lab 1, fixtures, no tenant {#gsa-m2-lab-1}
*About 20 minutes per chapter. No tenant: it runs on a laptop.*

This module's fixture labs are in the developer workbook [*Building Global Secure Access*](../../project-plans/developer-workbooks/global-secure-access/index.md). Each runs the kit in `examples/global-secure-access` against one fictional tenant, `contoso.example`, with every command as a copy-paste block and the kit's real output beside it. Follow them as written; their commands are listed below:

<!-- labs:begin module-lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #module-lab-1-commands collapse="false" title="The Lab 1 commands, on the fixtures"}
Every command in the 2 chapters' labs, chapter by chapter, in order, on the kit's fixtures, with no tenant.

The chapter's steps say what each command does and what to look for.

**[Chapter 03, Lab 1](../../project-plans/developer-workbooks/global-secure-access/03-the-client-and-its-coverage.md#lab-1-fixtures-no-tenant)**

```powershell
Set-Location C:\FMWLabs\global-secure-access-code\global-secure-access

$Run = "C:\FMWLabs\results\global-secure-access-03\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: List what the client area reads
Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1
Get-GsaRequiredPermission -Area client | Format-Table

# Step 2: Read the pilot tenant's device usage summary
./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -Area client -OutputPath "$Run/client" -AsOf 2026-11-16T12:00:00Z
Read-GsaJson -Path "$Run/client/raw/device-usage.json"

# Step 3: Read the four pilot devices' client records
(Read-GsaInputs -Path tests/fixtures/pilot/inputs).clients | ForEach-Object { [pscustomobject]@{ Device = $_.device; Version = $_.clientVersion; DisabledComponents = $_.ipv6DisabledComponents; Health = $_.health; Hardening = $_.hardening.Count } } | Format-Table

# Step 4: Run the client checks
./Invoke-GsaCheck.ps1 -Area client -SettingsPath tests/fixtures/settings.lab.json -CollectionPath "$Run/client" -InputsPath tests/fixtures/pilot/inputs -OutputPath "$Run/check-client" -AsOf 2026-11-16T12:00:00Z

# Step 5: See the same devices against ring 2's rule
$s = Read-GsaSettings -Path tests/fixtures/settings.lab.json
$s.ring = 'ring2'
Test-GsaClient -Collection (Read-GsaCollection -Path "$Run/client") -Inputs (Read-GsaInputs -Path tests/fixtures/pilot/inputs) -Settings $s -AsOf 2026-11-16 | Where-Object Id -EQ 'GSA-CLI-06' | Format-Table Object, Status, Detail

# Step 6: Read the device script's header
Get-Content ./tools/Get-GsaClientState.ps1 -TotalCount 11

# Step 7: Run this chapter's tests
Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Chapter 03*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# Step 7: Run this chapter's tests
Get-ChildItem C:\FMWLabs\results\global-secure-access-03\lab1 -Name
```

**[Chapter 04, Lab 1](../../project-plans/developer-workbooks/global-secure-access/04-microsoft-traffic-and-change-plans.md#lab-1-fixtures-no-tenant)**

```powershell
Set-Location C:\FMWLabs\global-secure-access-code\global-secure-access

$Run = "C:\FMWLabs\results\global-secure-access-04\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: List the traffic reads, and every write a plan can send
Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1
Get-GsaRequiredPermission -Area traffic | Format-Table -AutoSize | Out-String -Width 250
Get-GsaRequiredPermission -Writes | Format-Table

# Step 2: Collect the whole pilot tenant
./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -OutputPath "$Run/pilot" -AsOf 2026-11-16T12:00:00Z

# Step 3: Run the traffic checks
./Invoke-GsaCheck.ps1 -Area traffic -SettingsPath tests/fixtures/settings.lab.json -CollectionPath "$Run/pilot" -InputsPath tests/fixtures/pilot/inputs -OutputPath "$Run/check-traffic" -AsOf 2026-11-16T12:00:00Z

# Step 4: Read the guide's sign-in query, day by day
(Read-GsaCollection -Path "$Run/pilot")['law-query']['signin-share'] | ForEach-Object { [pscustomobject]$_ } | Format-Table TimeGenerated, Total, ThroughGSA, PctThroughGSA

# Step 5: Plan the pilot from its desired state
./Invoke-GsaPlan.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath "$Run/pilot" -DesiredPath config/desired.lab.json -OutputPath "$Run/plan" -AsOf 2026-11-16T12:00:00Z

# Step 6: Read the plan's first step in full
(Read-GsaJson -Path "$Run/plan/plan.json").steps | ForEach-Object { [pscustomobject]$_ } | Select-Object -First 1 | Format-List id, call, method, uri, why

# Step 7: Try to apply it in fixture mode
try { ./Invoke-GsaPlan.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath "$Run/pilot" -DesiredPath config/desired.lab.json -OutputPath "$Run/plan" -AsOf 2026-11-16T12:00:00Z -Apply -ApprovedSha256 ('0' * 64) } catch { $_.Exception.Message }

# Step 8: Run this chapter's tests
Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Chapter 04*', 'Plans*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# Step 8: Run this chapter's tests
Get-ChildItem C:\FMWLabs\results\global-secure-access-04\lab1 -Name
```
:::

<!-- labs:end -->

- [Chapter 03, Lab 1](../../project-plans/developer-workbooks/global-secure-access/03-the-client-and-its-coverage.md#lab-1-fixtures-no-tenant): client coverage and each pilot device's version, IPv4 preference, DNS over HTTPS, health and hardening.
- [Chapter 04, Lab 1](../../project-plans/developer-workbooks/global-secure-access/04-microsoft-traffic-and-change-plans.md#lab-1-fixtures-no-tenant): the Microsoft traffic checks, the sign-in share, and a change plan approved by its hash.

## Exercise: Lab 2, a test tenant {#gsa-m2-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

In Command Prompt:

```cmd
REM Step 1: Package the client
IntuneWinAppUtil.exe -c C:\Packages\GSA -s Install-GSAClient.ps1 -o C:\Packages\Out -q
```

In PowerShell 7:

```powershell
# Step 4: Check the client on the pilot device
(Get-Item "C:\Program Files\Global Secure Access Client\TrayApp\GlobalSecureAccessClient.exe").VersionInfo.FileVersion
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Global Secure Access Client" |
    Select-Object HideSignOutButton, HideDisablePrivateAccessButton, HideDisableButton, RestrictNonPrivilegedUsers
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters" -Name DisabledComponents

# Step 5: Count the devices the service sees
Set-Location <lab-folder>
Connect-MgGraph -Environment Global -Scopes "NetworkAccessPolicy.Read.All"
$end = (Get-Date).ToUniversalTime(); $start = $end.AddDays(-7); $pivot = $end.AddDays(-1)
$f = "yyyy-MM-ddTHH:mm:ssZ"
Invoke-MgGraphRequest -Method GET -Uri ("https://graph.microsoft.com/beta/networkAccess/reports/getDeviceUsageSummary(startDateTime={0},endDateTime={1},activityPivotDateTime={2})" -f $start.ToString($f), $end.ToString($f), $pivot.ToString($f)) |
    ConvertTo-Json -Depth 5 | Out-File .\gsa-03-device-usage.json
Get-Content .\gsa-03-device-usage.json

# Step 6: Find and enable the Microsoft traffic profile
Disconnect-MgGraph
Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All"
$p = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles?`$filter=trafficForwardingType eq 'm365'"
$p.value | Select-Object id, name, state
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<profile-id>" -Body '{"state":"enabled"}' -ContentType "application/json"

# Step 8: Turn on signaling and record it
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess" -Body '{"signalingStatus":"enabled"}' -ContentType "application/json"
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess" |
    ConvertTo-Json -Depth 5 | Out-File .\gsa-04-signaling.json
Get-Content .\gsa-04-signaling.json
```

In the Log Analytics workspace's Logs:

```kusto
// Step 9: Validate source IP restoration
SigninLogs
| where TimeGenerated > ago(7d)
| summarize Total = count(), ThroughGSA = countif(tostring(IsThroughGlobalSecureAccess) =~ "true") by bin(TimeGenerated, 1d)
| extend PctThroughGSA = round(100.0 * ThroughGSA / Total, 1)
```

:::

<!-- labs:end -->

You package the client, check it on a pilot device, count the devices the service sees, and enable the Microsoft traffic profile with signaling for the pilot group.

- **You need:** Module 1's lab done; one Windows 11 test device joined to Microsoft Entra ID, enrolled in Intune and in the pilot group; the client installer downloaded from **Global Secure Access** > **Connect** > **Client download** and Learn's installation script, saved as `GlobalSecureAccessClient.exe` and `Install-GSAClient.ps1` in `C:\Packages\GSA`; the Microsoft Win32 Content Prep Tool (`IntuneWinAppUtil.exe`); an Intune administrator; and an Application Administrator for the profile assignment.
- **You'll replace:** `<lab-folder>` (Module 1's folder), `<pilot-group-id>` (the pilot group's object ID) and `<profile-id>` (from step 6's output).

1. **Package the client** (the guide's Step 3.1), in Command Prompt on the packaging workstation:

    ```cmd
    IntuneWinAppUtil.exe -c C:\Packages\GSA -s Install-GSAClient.ps1 -o C:\Packages\Out -q
    ```

    `C:\Packages\Out` holds the `.intunewin` package.

2. **Create the Win32 app in Intune** with the guide's Step 3.2 values, in the Intune admin center:
    1. Upload the `.intunewin` package from `C:\Packages\Out`.
    2. Install command: `powershell.exe -ExecutionPolicy Bypass -File Install-GSAClient.ps1`.
    3. Uninstall command: `"GlobalSecureAccessClient.exe" /uninstall /quiet /norestart`.
    4. Install behavior: **System**.
    5. Return codes: `0` success, `3010` soft reboot, `1618` retry.
    6. Detection rule: **File**, path `C:\Program Files\Global Secure Access Client\TrayApp`, file `GlobalSecureAccessClient.exe`, **String (version)** greater than or equal to the packaged version.
    7. Assignment: **Required** to the pilot group, with the restart grace period enabled.

3. **Turn off DNS over HTTPS** (the guide's Step 3.3): create an Intune settings catalog profile that sets **Control the mode of DNS-over-HTTPS** to **Disabled** for both Microsoft Edge and Google Chrome, and assign it to the pilot group. Don't deploy the Step 3.4 hardening remediation in this lab: the guide deploys it from ring 2.

4. **Check the client on the pilot device** (the guide's Step 3 Validate), in PowerShell as an administrator, once Intune reports the app installed:

    ```powershell
    (Get-Item "C:\Program Files\Global Secure Access Client\TrayApp\GlobalSecureAccessClient.exe").VersionInfo.FileVersion
    Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Global Secure Access Client" |
        Select-Object HideSignOutButton, HideDisablePrivateAccessButton, HideDisableButton, RestrictNonPrivilegedUsers
    Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters" -Name DisabledComponents
    ```

    The file version is the packaged version or later. `DisabledComponents` is `0x20` (32), IPv4 preferred. The four hardening values aren't set yet, because the remediation waits for ring 2. Then open the client's **Advanced diagnostics** > **Health check** and keep the export; the tray must read **Connected**.

5. **Count the devices the service sees** (the guide's Step 3 Validate), on the administrator workstation, from `<lab-folder>`. Global Secure Access Log Reader is enough:

    ```powershell
    Set-Location <lab-folder>
    Connect-MgGraph -Environment Global -Scopes "NetworkAccessPolicy.Read.All"
    $end = (Get-Date).ToUniversalTime(); $start = $end.AddDays(-7); $pivot = $end.AddDays(-1)
    $f = "yyyy-MM-ddTHH:mm:ssZ"
    Invoke-MgGraphRequest -Method GET -Uri ("https://graph.microsoft.com/beta/networkAccess/reports/getDeviceUsageSummary(startDateTime={0},endDateTime={1},activityPivotDateTime={2})" -f $start.ToString($f), $end.ToString($f), $pivot.ToString($f)) |
        ConvertTo-Json -Depth 5 | Out-File .\gsa-03-device-usage.json
    Get-Content .\gsa-03-device-usage.json
    ```

    Compare `activeDeviceCount` with Intune's count of in-scope Windows devices; the ratio is the guide's client coverage metric.

6. **Find and enable the Microsoft traffic profile** (the guide's Step 4.1). This writes to the test tenant; Module 6 rolls it back.

    ```powershell
    Disconnect-MgGraph
    Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All"
    $p = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles?`$filter=trafficForwardingType eq 'm365'"
    $p.value | Select-Object id, name, state
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<profile-id>" -Body '{"state":"enabled"}' -ContentType "application/json"
    ```

7. **Assign the pilot group** (the guide's Step 4.2), in the Microsoft Entra admin center as an Application Administrator:
    1. Go to **Global Secure Access** > **Connect** > **Traffic forwarding**.
    2. Open **Microsoft traffic profile** > **User and group assignments**.
    3. Assign the pilot group, and save.

8. **Turn on signaling and record it** (the guide's Step 4.3):

    ```powershell
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess" -Body '{"signalingStatus":"enabled"}' -ContentType "application/json"
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess" |
        ConvertTo-Json -Depth 5 | Out-File .\gsa-04-signaling.json
    Get-Content .\gsa-04-signaling.json
    ```

    `signalingStatus` reads `enabled`.

9. **Validate source IP restoration** (the guide's Step 4 Validate, Learn's deployment guide test): on the pilot device, sign in to SharePoint with the client running, then disable the client from the tray and sign in again in a new browser session. In the sign-in logs, the two sign-ins show the same IP address. Re-enable the client. Then, in the workspace's **Logs**, run the guide's query:

    ```kusto
    SigninLogs
    | where TimeGenerated > ago(7d)
    | summarize Total = count(), ThroughGSA = countif(tostring(IsThroughGlobalSecureAccess) =~ "true") by bin(TimeGenerated, 1d)
    | extend PctThroughGSA = round(100.0 * ThroughGSA / Total, 1)
    ```

    `PctThroughGSA` is the share of sign-ins the service carried; the guide's starting target is 95% for in-scope users. Run Module 1's freshness query again now and keep the result. Keep the profile and signaling on: Module 3 needs them.

## Knowledge check (5 minutes) {#gsa-m2-check}

1. Why does the guide turn off DNS over HTTPS in Edge and Chrome?
    a. It slows the tunnel.
    b. The client doesn't support secure DNS.
    c. TIC 3.0 forbids it.

2. When does the guide deploy the remediation that hides the client's **Disable** button and restricts non-privileged users?
    a. In the pilot, so nobody can turn the client off.
    b. From ring 2, after confirming nobody in the pilot needs to disable it, as Learn advises.
    c. Never; Learn advises against it.

3. Which profile can acquire Microsoft 365 and Entra ID traffic?
    a. Only the Microsoft traffic profile.
    b. The Internet Access profile, if Microsoft destinations are added.
    c. Either, whichever is enabled first.

4. A tenant onboarded in 2024. What does the guide do about source IP restoration?
    a. Nothing; it is on by default for every tenant.
    b. Sets signaling explicitly and records the state, because the default applies only to tenants onboarded after June 2025.
    c. Turns it on only after the compliant network policy is enforced.

5. How does the guide compute client coverage?
    a. The number of Win32 app installs reported by Intune.
    b. The device usage summary's `activeDeviceCount` divided by Intune's count of in-scope Windows devices.
    c. The share of sign-ins through the service.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [Step 3](../../books/guides/global-secure-access-implementation.md#step-3-client-deployment), 3.3.
2. **b.** See Unit 2 and the guide's Step 3, 3.4.
3. **a.** See Unit 3 and the guide's [Step 4](../../books/guides/global-secure-access-implementation.md#step-4-microsoft-traffic).
4. **b.** See Unit 3 and the guide's Step 4, 4.3.
5. **b.** See the lab's step 5 and the guide's [Metrics](../../books/guides/global-secure-access-implementation.md#metrics).
:::

## Summary (2 minutes) {#gsa-m2-summary}

You packaged the client with Learn's values, checked it on a pilot device, counted the devices the service sees, and enabled the Microsoft traffic profile with signaling for the pilot. **Evidence an ISSO keeps from this module:** the Intune app's assignment export and detection rule, the client health check export, `gsa-03-device-usage.json` with the coverage ratio, the profile export and its assignments, `gsa-04-signaling.json`, the source IP comparison and the sign-in share result.

::: {.callout-tip}
## Continue the path
[← Previous: Module 1](01-decide-design-and-log-first.md) · [Learning path](index.md) · [Next: Module 3, The compliant network and tenant restrictions →](03-compliant-network-and-tenant-restrictions.md)
:::
