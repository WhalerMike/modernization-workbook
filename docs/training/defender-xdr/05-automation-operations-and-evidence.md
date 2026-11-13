---
title: "Module 5: Automation, operations and evidence"
description: "Guide Steps 9 and 10: automated investigation and response levels per device group matched to the response ladder, with workstation groups at Full after a semi-automated pilot and server groups kept at a semi level; automatic attack disruption's exclusions for emergency access and service accounts; the operating cadence; the monthly evidence run that files the read-only queries and hashes them; synthetic events, the metrics and the evidence catalog an assessor reads. Lab 2 checks the sensor version and the device group levels and runs the monthly evidence run in a test tenant. About 40 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 12"
series-order: 5
review-status: pending
last-reviewed: 2026-11-13
---
# Module 5: Automation, operations and evidence {.unnumbered}

*Part of the [Defender XDR learning path](index.md). Guide [Step 9](../../books/guides/defender-xdr-implementation.md#step-9-automation-with-approval-boundaries) and [Step 10](../../books/guides/defender-xdr-implementation.md#step-10-operations-and-evidence). About 40 minutes, plus Lab 2.*

## Introduction (3 minutes) {#xdr-m5-introduction}

Automation is where speed and outage meet: the same setting that contains a compromised laptop in minutes can lock out the account the SOC needs to respond. In this module you set Defender's automation to the program's response ladder, exclude what must never be contained automatically, and then run the platform: the cadence, the monthly evidence run, the synthetic events and the metrics an assessor reads.

**The federal requirement.** The full table is the guide's [Requirements and KSIs](../../books/guides/defender-xdr-implementation.md#requirements-and-ksis).

| Gate | Requirement it supports | KSI | Evidence |
|---|---|---|---|
| G9 | NIST SP 800-53 IR-4 (1) (automated incident handling), SI-4 (7) (automated response) | KSI-INR-RIR | Device group levels, exclusions, Action center export |
| G10 | CA-7 (continuous monitoring), AU-11, IR-3 (incident response testing) | KSI-MLA-EVC, KSI-INR-AAR | Monthly package, exercise record |

The guide's closure map counts Gates 2, 7 and 10 and the synthetic events as the **audit and visibility** row: telemetry, retention, routing, detection and tests, evidenced by searchable synthetic events.

## Learning objectives (1 minute) {#xdr-m5-objectives}

After this module, you'll be able to:

- name the five automation levels and set each device group's level to the ladder;
- record attack disruption exclusions for emergency access and service accounts, with the authorizing official's approval;
- run the monthly evidence run and check its hashes a month later;
- use the synthetic events, metrics and evidence catalog to show that the controls work, not just that they exist.

## Prerequisites (1 minute) {#xdr-m5-prerequisites}

- [Modules 1 to 4](index.md).
- [Security Operations, Chapter 11, The response ladder](../../books/b12-security-operations/11-detection-engineering-and-response.md#the-response-ladder), and [Chapter 12, The metric set](../../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md#the-metric-set). Skim both.

## Unit 1: Automation with approval boundaries (10 minutes) {#xdr-m5-unit-1}

Read the guide's [Step 9](../../books/guides/defender-xdr-implementation.md#step-9-automation-with-approval-boundaries). Device group levels are **Full**; **Semi - require approval for core folders**; **Semi - require approval for non-temp folders**; **Semi - require approval for all folders**; and **No automated response**. The pilot puts ring 1's workstation group at **Semi - require approval for all folders**, so every remediation is proposed and an analyst approves it; two weeks of pending actions and the approval rate are the audit phase. Then workstation groups go to **Full**, Microsoft's recommended setting, and server groups stay at a semi level, because isolating a server is never autonomous in the program's ladder *(risk-based recommended)*.

Attack disruption's exclusions are set under **Settings** > **Microsoft Defender XDR** > **Automated response**: **Identities** for users, **Devices** for device groups and IP ranges. Exclude the emergency access accounts and the service accounts whose disablement would stop the SOC; Microsoft names those uses and cautions that exclusions reduce protection, and excluding a device group also affects automated investigation and response for it. **Contain User** needs sensor version v10.8470 or later. Attack disruption's availability in GCC isn't specified on Learn; confirm it in the tenant. Every attack disruption action can be undone by the security team.

## Unit 2: Operations, evidence and metrics (12 minutes) {#xdr-m5-unit-2}

Read the guide's [Step 10](../../books/guides/defender-xdr-implementation.md#step-10-operations-and-evidence), its [synthetic events](../../books/guides/defender-xdr-implementation.md#synthetic-events), [metrics](../../books/guides/defender-xdr-implementation.md#metrics) and [evidence catalog](../../books/guides/defender-xdr-implementation.md#evidence-catalog). The cadence *(risk-based recommended)*: sensor health and coverage, and prevention and Attack Surface Reduction drift, weekly; the metrics and evidence package monthly; detection tuning, the exception register review and an exercise with synthetic events quarterly.

The monthly evidence run files the read-only queries and incident export and hashes every file, from a workstation inside the boundary. Advanced hunting keeps 30 days, so the run is what lets anyone answer for an older month. The metrics measure protected coverage and effectiveness, not whether a setting exists: protected coverage counts devices with an Active sensor against the CM-8 inventory, because a policy assigned to a group says nothing about devices that never checked in; enforcement depth counts devices with every rule in block, because audit mode is configured but protects nothing. The synthetic events show the assessor that telemetry, detection and routing work end to end.

## Exercise: Lab 2, a test tenant {#xdr-m5-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: The sensor version on <pilot-device>
Get-ItemProperty -Path 'Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Advanced Threat Protection\Status' -Name "MsSenseDllVersion"

# Step 3: Run the monthly evidence run
New-Item -ItemType Directory -Path <evidence-folder>
Connect-MgGraph -Environment <graph-environment> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All
$queries = @{
  'coverage' = 'DeviceInfo | where Timestamp > ago(1d) | summarize arg_max(Timestamp, *) by DeviceId | where OSPlatform startswith "Windows" | summarize Devices = count() by OnboardingStatus, SensorHealthState'
  'asr'      = 'DeviceEvents | where Timestamp > ago(30d) | where ActionType startswith "Asr" | summarize EventCount=count() by ActionType'
  'prevention' = 'DeviceEvents | where Timestamp > ago(30d) | where ActionType in ("ExploitGuardNetworkProtectionBlocked","ControlledFolderAccessViolationBlocked","TamperingAttempt") | summarize Events = count(), Devices = dcount(DeviceId) by ActionType'
}
foreach ($k in $queries.Keys) {
  Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $queries[$k] } | ConvertTo-Json -Depth 5 | Out-File "<evidence-folder>/$k.json"
}
Get-MgSecurityIncident -Filter "createdDateTime ge $((Get-Date).AddDays(-30).ToString('yyyy-MM-ddTHH:mm:ssZ'))" -All | Select-Object Id, Severity, Status, Classification, Determination, CreatedDateTime, LastUpdateDateTime | Export-Csv "<evidence-folder>/incidents.csv" -NoTypeInformation
Get-ChildItem <evidence-folder> -File | Get-FileHash -Algorithm SHA256 | Export-Csv "<evidence-folder>/SHA256SUMS.csv" -NoTypeInformation

# Step 4: Check the hashes
$recorded = Import-Csv <evidence-folder>/SHA256SUMS.csv | Where-Object { (Split-Path $_.Path -Leaf) -ne 'SHA256SUMS.csv' }
$recorded | ForEach-Object { [pscustomobject]@{ Path = $_.Path; Matches = ((Get-FileHash -Algorithm SHA256 -LiteralPath $_.Path).Hash -eq $_.Hash) } } | Format-Table -AutoSize

# Step 5: Back it out
Disconnect-MgGraph
```

:::

<!-- labs:end -->

You check the sensor version for Contain User, review the device group levels and exclusions against the ladder, run the monthly evidence run, and check its hashes. Every step reads, apart from the evidence files it writes in your own folder.

- **You need:** Module 1's test tenant, reader account and `<pilot-device>`; an account that can view the Defender portal's settings; the ladder decision record for the test tenant (or the guide's [Step 9](../../books/guides/defender-xdr-implementation.md#step-9-automation-with-approval-boundaries) as the reference).
- **You'll replace:** `<graph-environment>`, `<pilot-device>` and `<evidence-folder>` as in Module 1. Use a new, empty `<evidence-folder>` for this lab, because step 4 hashes every file in it.

1. **The sensor version on `<pilot-device>`,** Learn's command, in PowerShell on the device:

    ```powershell
    Get-ItemProperty -Path 'Registry::HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Advanced Threat Protection\Status' -Name "MsSenseDllVersion"
    ```

    Expected result: a version of v10.8470 or later, which Contain User needs.

2. **Review the device group levels and exclusions.** In the Defender portal for your cloud:
    1. Go to **Settings** > **Microsoft Defender XDR** > **Automated responses** > **Devices**, and note each device group's level.
    2. Go to **Settings** > **Microsoft Defender XDR** > **Automated response** > **Identities**, and note the excluded users.
    3. Compare both with the ladder decision record.

    Expected result, as the guide states it: every server group at a semi level, every workstation group at Full or a recorded exception, and the emergency access accounts in the identity exclusions.

3. **Run the monthly evidence run,** the guide's script, on your workstation:

    ```powershell
    New-Item -ItemType Directory -Path <evidence-folder>
    Connect-MgGraph -Environment <graph-environment> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All
    $queries = @{
      'coverage' = 'DeviceInfo | where Timestamp > ago(1d) | summarize arg_max(Timestamp, *) by DeviceId | where OSPlatform startswith "Windows" | summarize Devices = count() by OnboardingStatus, SensorHealthState'
      'asr'      = 'DeviceEvents | where Timestamp > ago(30d) | where ActionType startswith "Asr" | summarize EventCount=count() by ActionType'
      'prevention' = 'DeviceEvents | where Timestamp > ago(30d) | where ActionType in ("ExploitGuardNetworkProtectionBlocked","ControlledFolderAccessViolationBlocked","TamperingAttempt") | summarize Events = count(), Devices = dcount(DeviceId) by ActionType'
    }
    foreach ($k in $queries.Keys) {
      Start-MgSecurityHuntingQuery -BodyParameter @{ Query = $queries[$k] } | ConvertTo-Json -Depth 5 | Out-File "<evidence-folder>/$k.json"
    }
    Get-MgSecurityIncident -Filter "createdDateTime ge $((Get-Date).AddDays(-30).ToString('yyyy-MM-ddTHH:mm:ssZ'))" -All | Select-Object Id, Severity, Status, Classification, Determination, CreatedDateTime, LastUpdateDateTime | Export-Csv "<evidence-folder>/incidents.csv" -NoTypeInformation
    Get-ChildItem <evidence-folder> -File | Get-FileHash -Algorithm SHA256 | Export-Csv "<evidence-folder>/SHA256SUMS.csv" -NoTypeInformation
    ```

    Expected result: `coverage.json`, `asr.json`, `prevention.json`, `incidents.csv` and `SHA256SUMS.csv` in the folder.

4. **Check the hashes,** as the next month's run does for last month's files:

    ```powershell
    $recorded = Import-Csv <evidence-folder>/SHA256SUMS.csv | Where-Object { (Split-Path $_.Path -Leaf) -ne 'SHA256SUMS.csv' }
    $recorded | ForEach-Object { [pscustomobject]@{ Path = $_.Path; Matches = ((Get-FileHash -Algorithm SHA256 -LiteralPath $_.Path).Hash -eq $_.Hash) } } | Format-Table -AutoSize
    ```

    Expected result: `Matches` is `True` for every evidence file. A `False` means a file changed after it was filed. The check leaves out `SHA256SUMS.csv` itself, which can appear in its own list because it is written in the same folder it hashes.

5. **Back it out.** Nothing changed in the tenant. Disconnect, and keep or delete the lab's evidence folder as your test-tenant practice sets:

    ```powershell
    Disconnect-MgGraph
    ```

## Knowledge check (5 minutes) {#xdr-m5-knowledge-check}

1. What level does the program set for a server device group?
    a. Full, as Microsoft recommends.
    b. A semi level: isolating a server is never autonomous in the program's ladder.
    c. No automated response, always.

2. Which accounts go in attack disruption's identity exclusions?
    a. Every administrator.
    b. The emergency access accounts and the service accounts whose disablement would stop the SOC, each with the authorizing official's approval.
    c. None; exclusions aren't allowed.

3. An assessor asks for the coverage query result from four months ago. Where does it come from?
    a. Advanced hunting, which keeps a year.
    b. That month's evidence run: advanced hunting keeps 30 days, so the filed, hashed result is the record.
    c. It can't be produced.

4. Why is protected coverage measured against the CM-8 inventory rather than the policy assignment?
    a. A policy assigned to a group says nothing about devices that never checked in.
    b. CM-8 is easier to query.
    c. The policy assignment isn't exportable.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [Step 9](../../books/guides/defender-xdr-implementation.md#step-9-automation-with-approval-boundaries).
2. **b.** See Unit 1.
3. **b.** See Unit 2 and the guide's [dangers](../../books/guides/defender-xdr-implementation.md#dangers).
4. **a.** See Unit 2 and the guide's [metrics](../../books/guides/defender-xdr-implementation.md#metrics).
:::

## Summary (2 minutes) {#xdr-m5-summary}

You checked the sensor version, reviewed the device group levels and exclusions against the ladder, ran the monthly evidence run and checked its hashes. **Evidence an ISSO keeps from this module:** the device group list with remediation levels, the attack disruption exclusions with approvals, the monthly Action center export, the quarterly exercise record, and the monthly package with `SHA256SUMS.csv`. Then work the guide's [checklist](../../books/guides/defender-xdr-implementation.md#checklist) gate by gate.

::: {.callout-tip}
## Continue the path
[← Previous: Module 4](04-hunting-detections-and-identity-signals.md) · [Learning path](index.md)
:::
