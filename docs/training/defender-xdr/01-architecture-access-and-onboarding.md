---
title: "Module 1: Architecture, access and onboarding"
description: "Guide Steps 1 and 2: Defender XDR's components, its two trust boundaries and one control plane per setting; government-cloud availability feature by feature, with Security Exposure Management not available in US Government clouds; unified RBAC roles assigned through PIM and the Graph read path in the tenant's own cloud; onboarding Windows clients through Intune and servers through Defender for Servers, and proving the sensor is on and healthy with the coverage query and the detection test. Lab 2 runs the guide's Validate commands in a test tenant. About 40 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 12"
series-order: 1
review-status: pending
last-reviewed: 2026-11-13
---
# Module 1: Architecture, access and onboarding {.unnumbered}

*Part of the [Defender XDR learning path](index.md). Guide [Step 1](../../books/guides/defender-xdr-implementation.md#step-1-service-architecture-and-access) and [Step 2](../../books/guides/defender-xdr-implementation.md#step-2-endpoint-onboarding). About 40 minutes, plus Lab 2.*

## Introduction (3 minutes) {#xdr-m1-introduction}

Before any prevention setting matters, two things have to be true: the right people can see and act on the service, in the tenant's own cloud, and the sensor is on every device it should be. In this module you learn the service's shape and its government-cloud limits, set who can do what, and prove the sensor's coverage with a query whose result you can file.

**The federal requirement.** The full table is the guide's [Requirements and KSIs](../../books/guides/defender-xdr-implementation.md#requirements-and-ksis).

| Gate | Requirement it supports | KSI | Evidence |
|---|---|---|---|
| G1 | NIST SP 800-53 AC-2, AC-6 (least privilege for security tooling); AU-9 (4) | KSI-IAM-ELP, KSI-MLA-ALA | Role export, PIM report |
| G2 | CM-8 (inventory), SI-4 (system monitoring); OMB M-22-09's device actions, including EDR deployed widely | KSI-PIY-GIV, KSI-MLA-OSM | Coverage file, exception register |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines its own evidence up with them; it doesn't report KSIs itself. The gates support these controls; the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#xdr-m1-objectives}

After this module, you'll be able to:

- name Defender XDR's components, its two trust boundaries and which control plane holds which setting;
- read the government-cloud availability table and record a feature that isn't available as a disposition, not a failed control;
- describe the program's unified RBAC roles and why they are assigned through PIM;
- connect to Microsoft Graph in GCC, GCC High or DoD and read incidents;
- prove onboarding and sensor health on one device and across the fleet.

## Prerequisites (1 minute) {#xdr-m1-prerequisites}

- The guide's [How to read this guide](../../books/guides/defender-xdr-implementation.md#how-to-read-this-guide) and [prerequisites](../../books/guides/defender-xdr-implementation.md#prerequisites).
- The [Privileged Access implementation guide](../../books/guides/privileged-access-implementation.md)'s PIM model, for the eligible roles. Skim it.

## Unit 1: Components, boundaries and control planes (8 minutes) {#xdr-m1-unit-1}

Read the guide's [reference architecture](../../books/guides/defender-xdr-implementation.md#reference-architecture). Defender XDR joins Defender for Endpoint, Defender for Identity, Defender for Office 365 and Defender for Cloud Apps in one portal and one incident queue. Two boundaries matter: the agency's, which holds the devices, the SOC's tools and the evidence store, and Microsoft's, which holds the service; for a US Government tenant Microsoft's side is built in Azure US Government, and GCC, GCC High and DoD each have their own portal.

Intune is Microsoft's recommended tool for distributing Defender for Endpoint settings, and it assigns them to Entra **device** groups, never user groups. Settings Intune doesn't hold (automation levels, device groups, attack disruption exclusions, custom detections) live in the Defender portal. Servers in Azure, AWS, Google Cloud or Oracle Cloud Infrastructure reach Defender through Defender for Servers and Azure Arc, as [Devices, Chapter 09](../../books/b05-devices/09-servers-under-azure-arc.md) describes. The rule to remember: one control plane per setting.

## Unit 2: What each government cloud has (7 minutes) {#xdr-m1-unit-2}

Read the guide's [government-cloud availability table](../../books/guides/defender-xdr-implementation.md#government-cloud-availability). Defender for Endpoint's prevention, detection, investigation and remediation are available in GCC, GCC High and DoD. Microsoft Security Exposure Management is not: Learn says Public Cloud only. Several features are *not yet specified*, which means Learn doesn't say, not that they are available: custom detection rules through Graph, automatic attack disruption, and web content filtering on Windows. Note the portal and Graph host for your cloud: GCC uses `security.microsoft.com` and the worldwide Graph host; GCC High and DoD have their own. A feature the tenant's cloud doesn't offer is recorded in the decision record and the closure register as not applicable, not as a failed control.

## Unit 3: Roles and the read path (7 minutes) {#xdr-m1-unit-3}

Read the guide's [Step 1](../../books/guides/defender-xdr-implementation.md#step-1-service-architecture-and-access) and its [RACI](../../books/guides/defender-xdr-implementation.md#raci). Unified RBAC's permission groups are Security operations, Security posture, Authorization and settings, and Data operations. The program's roles are a read role, a responder role, a detection-engineer role with **Detection tuning (Manage)**, and **Advanced live response** for Tier 0 analysts only, each assigned to groups PIM governs. Create every role and assignment before activating the workloads; activation needs at least Security Administrator in Entra ID. The SOC's read path is Microsoft Graph, connected with the `-Environment` value of the tenant's cloud: `Global` for GCC, `USGov` for GCC High, `USGovDoD` for DoD. A session in the wrong cloud returns an empty list, and an empty list looks like a pass.

## Unit 4: Onboarding and sensor health (8 minutes) {#xdr-m1-unit-4}

Read the guide's [Step 2](../../books/guides/defender-xdr-implementation.md#step-2-endpoint-onboarding). Windows clients onboard through Intune's EDR policy (ES-004 in [Devices, Chapter 08](../../books/b05-devices/08-gpo-to-intune-policy-migration.md#es-004-endpoint-detection-and-response)), ring 0 first, then ring 1. In government clouds, Windows Server 2019 needs KB4586839 *before* onboarding so it reaches the right environment. A device the sensor can't reach goes in the exception register with a compensating control. The sensor-health values are **Active**, **Inactive**, **No sensor data**, **Impaired communications** and **Misconfigured**; every device not Active for seven days is a ticket. To roll back, offboard with the offboarding package: it expires seven days after download, and onboarding and offboarding are never deployed to the same device.

## Exercise: Lab 2, a test tenant {#xdr-m1-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Install the Graph modules and connect in the tenant's cloud
Install-Module Microsoft.Graph.Authentication, Microsoft.Graph.Security -Scope CurrentUser
Connect-MgGraph -Environment <graph-environment> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All
New-Item -ItemType Directory -Path <evidence-folder>

# Step 2: Read incidents
Get-MgSecurityIncident -Top 5 | Select-Object Id, DisplayName, Severity, Status, CreatedDateTime

# Step 3: Check the sensor on <pilot-device>
sc.exe query sense
Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows Advanced Threat Protection\Status' -Name OnboardingState

# Step 4: File the fleet's coverage
$q = 'DeviceInfo | where Timestamp > ago(1d) | summarize arg_max(Timestamp, *) by DeviceId | where OSPlatform startswith "Windows" | summarize Devices = count() by OnboardingStatus, SensorHealthState'
Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $q } | ConvertTo-Json -Depth 5 | Out-File <evidence-folder>/g2-coverage.json

# Step 5: Run the detection test
powershell.exe -NoExit -ExecutionPolicy Bypass -WindowStyle Hidden $ErrorActionPreference = 'silentlycontinue';(New-Object System.Net.WebClient).DownloadFile('http://127.0.0.1/1.exe', 'C:\\test-MDATP-test\\invoice.exe');Start-Process 'C:\\test-MDATP-test\\invoice.exe'

# Step 6: Back it out
Disconnect-MgGraph
```

:::

<!-- labs:end -->

You read incidents through Graph in the tenant's cloud, check the sensor on one test device, file the fleet's coverage, and run Microsoft's detection test.

- **You need:** a test tenant licensed for Defender for Endpoint Plan 2; a delegated account with Security Reader (or Global Reader, Security Operator or Security Administrator), activated through PIM; a ring 0 Windows test device onboarded through Intune's EDR policy, where you can open an elevated prompt; PowerShell 7 on your workstation.
- **You'll replace:** `<graph-environment>` (`Global` for GCC; `USGov` for GCC High; `USGovDoD` for DoD), `<pilot-device>` (the test device) and `<evidence-folder>` (a new folder for this lab's files, for example `C:\Evidence\xdr-lab`).

1. **Install the Graph modules and connect in the tenant's cloud.** On your workstation, in PowerShell 7:

    ```powershell
    Install-Module Microsoft.Graph.Authentication, Microsoft.Graph.Security -Scope CurrentUser
    Connect-MgGraph -Environment <graph-environment> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All
    New-Item -ItemType Directory -Path <evidence-folder>
    ```

    `SecurityIncident.Read.All` is the least-privileged permission to list incidents; `ThreatHunting.Read.All` runs hunting queries. The labs in Modules 2 to 5 connect the same way.

2. **Read incidents.**

    ```powershell
    Get-MgSecurityIncident -Top 5 | Select-Object Id, DisplayName, Severity, Status, CreatedDateTime
    ```

    Expected result, as the guide states it: up to five incidents (or an empty list in a new tenant) with no permission error. An error naming the role means the account lacks one of the four roles above.

3. **Check the sensor on `<pilot-device>`.** On the test device, in an elevated PowerShell session:

    ```powershell
    sc.exe query sense
    Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows Advanced Threat Protection\Status' -Name OnboardingState
    ```

    Expected result: the SENSE service is running, and `OnboardingState` is `1`, the value Learn gives for an onboarded device.

4. **File the fleet's coverage.** Back on your workstation:

    ```powershell
    $q = 'DeviceInfo | where Timestamp > ago(1d) | summarize arg_max(Timestamp, *) by DeviceId | where OSPlatform startswith "Windows" | summarize Devices = count() by OnboardingStatus, SensorHealthState'
    Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $q } | ConvertTo-Json -Depth 5 | Out-File <evidence-folder>/g2-coverage.json
    ```

    Expected result: every device is onboarded with `SensorHealthState` `Active`, or is in the exception register. Learn doesn't list the exact `OnboardingStatus` strings, so the query groups by them rather than filtering on one.

5. **Run the detection test** on `<pilot-device>`, under the change record for the test device, from an elevated **Command Prompt**, exactly as Learn publishes it:

    ```powershell
    powershell.exe -NoExit -ExecutionPolicy Bypass -WindowStyle Hidden $ErrorActionPreference = 'silentlycontinue';(New-Object System.Net.WebClient).DownloadFile('http://127.0.0.1/1.exe', 'C:\\test-MDATP-test\\invoice.exe');Start-Process 'C:\\test-MDATP-test\\invoice.exe'
    ```

    Expected result: an alert for the device appears in the Defender portal in about 10 minutes. Learn's page lists Windows Server 2012 R2, Windows Server 2016 and later, and Azure Stack HCI as supported, not Windows 10 or 11; on a client, treat a missing alert as inconclusive and rely on step 4 and Module 2's network protection test.

6. **Back it out** when you finish the path. The steps above changed nothing but the alert the test raised; resolve that incident in the test tenant, and disconnect:

    ```powershell
    Disconnect-MgGraph
    ```

## Knowledge check (5 minutes) {#xdr-m1-knowledge-check}

1. An Attack Surface Reduction policy in Intune is assigned to a user group. What happens?
    a. It applies to every device the users sign in to.
    b. It never applies: Defender for Endpoint management supports device objects only.
    c. It applies after the next Group Policy refresh.

2. A Zero Trust Assessment test that needs Microsoft Security Exposure Management is skipped in a GCC High tenant. How is it recorded?
    a. As a failed control.
    b. As not applicable: Learn says Exposure Management is available in Public Cloud only, not in US Government clouds.
    c. As a pass.

3. A GCC High tenant's SOC runs `Connect-MgGraph` without `-Environment` and lists incidents. The list is empty. What is the most likely reason?
    a. The tenant has no incidents.
    b. The session read the worldwide host instead of the tenant's own cloud; connect with `-Environment USGov`.
    c. The account lacks Security Reader.

4. When do you activate unified RBAC's workloads?
    a. First, so the new roles can be created.
    b. After every role and assignment has been created.
    c. Never in a government cloud.

5. A Windows Server 2019 server is about to be onboarded in a GCC tenant. What has to be installed first?
    a. KB4586839, so the server reaches the right environment.
    b. The Defender for Identity sensor.
    c. Nothing; Windows Server 2019 isn't supported.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [reference architecture](../../books/guides/defender-xdr-implementation.md#reference-architecture).
2. **b.** See Unit 2 and the [availability table](../../books/guides/defender-xdr-implementation.md#government-cloud-availability).
3. **b.** An error would name the role; an empty list with no error is the wrong-cloud danger. See Unit 3 and the guide's [dangers](../../books/guides/defender-xdr-implementation.md#dangers).
4. **b.** See Unit 3 and the guide's [Step 1](../../books/guides/defender-xdr-implementation.md#step-1-service-architecture-and-access).
5. **a.** See Unit 4 and the guide's [Step 2](../../books/guides/defender-xdr-implementation.md#step-2-endpoint-onboarding).
:::

## Summary (2 minutes) {#xdr-m1-summary}

You placed each setting in its control plane, checked what your cloud offers, read incidents through Graph in the tenant's own cloud, and proved the sensor on a device and across the fleet. **Evidence an ISSO keeps from this module:** the role export and the PIM assignment report, the EDR policy export and its assignments, the weekly coverage file, the detection test with the alert it raised, and the exception register for every device not onboarded.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Next: Module 2, Prevention and Attack Surface Reduction →](02-prevention-and-attack-surface-reduction.md)
:::
