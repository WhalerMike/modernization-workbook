---
title: "Module 6: Rings, rollback and the evidence package"
description: "Guide Steps 11 and 12's evidence, with the RACI, evidence catalog, metrics, dangers and rollback: the four cutover rings and their exit criteria, the change window and backout triggers, coexistence with the VPN, DirectAccess and a third-party SSE, branches and TIC parity; who does what, and that the authorizing official decides closure; the five control states and the evidence for each; the metrics that measure coverage, not settings; and the guide's rollback order, newest first, signaling last. Lab 2 measures a ring's exit criteria, takes the evidence export, and rolls the whole test tenant back in the guide's order. About 40 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 09"
series-order: 6
review-status: pending
last-reviewed: 2026-11-13
---
# Module 6: Rings, rollback and the evidence package {.unnumbered}

*Part of the [Global Secure Access learning path](index.md). Guide [Step 11](../../books/guides/global-secure-access-implementation.md#step-11-coexistence-and-migration), [Step 12](../../books/guides/global-secure-access-implementation.md#step-12-telemetry-and-evidence), the [RACI](../../books/guides/global-secure-access-implementation.md#raci), [evidence catalog](../../books/guides/global-secure-access-implementation.md#evidence), [metrics](../../books/guides/global-secure-access-implementation.md#metrics) and [rollback](../../books/guides/global-secure-access-implementation.md#rollback). About 40 minutes, plus Lab 2.*

**Watch first:** slides 8, 15 and 16 of the guide's narrated deck (the RACI; rings, rollback and telemetry; dangers and open questions), in its [narration script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-global-secure-access/Guide_Global_Secure_Access_Narration_Script.md).

## Introduction (3 minutes) {#gsa-m6-intro}

Modules 1 to 5 built every piece for a pilot. This module makes it a migration: users move ring by ring, each ring exits on measured criteria, the VPN route for an application goes only after its wave holds, and anything can be rolled back in a known order. At the end, each network finding gets an evidence package an assessor can check, and the decision about closure stays with the authorizing official.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs, by step](../../books/guides/global-secure-access-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| CM-3, CM-4, CP-2: each wave moved with exit criteria, rollback and validation | KSI-CMT-LMC, KSI-CMT-VTD | Ring exit records with the criteria and their measured values |
| AU-2, AU-6, AU-12, SI-4: network logs exported, fresh, reviewed and shared as agreed | KSI-MLA-OSM, KSI-MLA-LET, KSI-MLA-RVL | The diagnostic setting GET, the freshness result, the CISA telemetry agreement |

The steps support these controls and provide evidence for them; the assessor decides whether each is satisfied. Step 12's logging is mandated in part, by OMB M-26-14 and TIC 3.0's telemetry requirement; the specific measures are the program's.

## Learning objectives (1 minute) {#gsa-m6-objectives}

After this module, you'll be able to:

- run the four rings with their exit criteria, the change window and backout triggers set in advance;
- keep the VPN, DirectAccess and a third-party SSE working beside the service during the move, and explain branch parity;
- say who is responsible, accountable, consulted and informed for each activity, and who decides closure;
- assemble the evidence package: configuration, test, operational, exception and reassessment;
- compute the guide's coverage metrics and roll back in the guide's order.

## Prerequisites (1 minute) {#gsa-m6-prerequisites}

- Modules [1](01-decide-design-and-log-first.md) to [5](05-internet-access-and-tls-inspection.md).
- [Book 11, Chapter 10: the closure chain](../../books/b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain). About 10 minutes.

## Unit 1: The rings and coexistence (8 minutes) {#gsa-m6-rings}

Read the guide's [Step 11](../../books/guides/global-secure-access-implementation.md#step-11-coexistence-and-migration). Ring 0 is the implementing team; ring 1 a pilot of fewer than 20 users for 10 business days; ring 2 about 10% of users, including one branch, for 20 business days; ring 3 everyone, in waves. The emergency access group is excluded from every policy in Steps 5 to 10 and tested on the date each ring starts. Backout triggers are set before each ring. Enabling a new traffic profile or restructuring connector groups is a major change for the change advisory board, as Learn categorizes them.

During the move, the VPN stays for applications not yet published, in split-include mode where it supports it; DirectAccess can't coexist with Private Access on the same device; a proxy set at the OS or browser level excludes every FQDN and IP the client tunnels; and a third-party SSE kept for internet traffic follows its coexistence page on Learn. A remote network carries the Microsoft and internet profiles, not Private Access, and applies only the baseline profile with no Conditional Access, so for TIC parity the guide keeps the client on managed devices at branches. A VPN route is removed only after the VPN's own logs show no traffic for the migrated application for 10 business days.

## Unit 2: Who does what, and the evidence (10 minutes) {#gsa-m6-raci-evidence}

Read the guide's [RACI](../../books/guides/global-secure-access-implementation.md#raci), [control states](../../books/guides/global-secure-access-implementation.md#control-states) and [evidence catalog](../../books/guides/global-secure-access-implementation.md#evidence). The guide maps Microsoft's operations RACI to six roles and adds the assessor, who is independent of the work: the policy owner is accountable, the platform owner responsible, operators run the rings, connectors and sensors, the security monitor owns alerts, freshness and metrics, the help desk takes tier-1 issues. The assessor recommends a finding ready for closure; the authorizing official, or the assessor for an assessment finding, decides. Learn's advice is at least two people per role.

A finding is ready for closure when every applicable control state (Designed, Configured, Enforced, Evidenced, Operated) has evidence. The evidence catalog has five kinds: configuration (the hashed Graph export, rerun before every change), test (each Validate record), operational (the queries, on the day-two cadence), exception (the register, with approver and expiry), and reassessment (the Zero Trust Assessment rerun after each ring). A test skipped because the tenant has no Internet Access or Private Access license is a licensing result, not a failed control.

## Unit 3: Metrics, dangers and rollback (8 minutes) {#gsa-m6-metrics-rollback}

Read the guide's [metrics](../../books/guides/global-secure-access-implementation.md#metrics), [dangers](../../books/guides/global-secure-access-implementation.md#dangers) and [rollback](../../books/guides/global-secure-access-implementation.md#rollback). Each metric measures protected coverage or effectiveness, not whether a setting exists: client coverage (98% after ring 3), sign-ins through the service (95%), compliant network enforcement (100% after ring 3), Quick Access residual and unassigned apps (zero), connector resilience (100%), TLS failure share (under 1%) and certificate life (over 90 days), telemetry freshness (no silent table). In an incident that touches several steps, reverse newest first: Conditional Access policies from Steps 10, 7, 6 and 5 to report-only; security profile links removed; universal tenant restrictions tagging disabled; the affected groups removed from the traffic profiles; the VPN route restored; signaling disabled only after no policy depends on it. Every rollback is a change with a record, followed by the Step 2.1 export.

## Exercise: Lab 2, a test tenant {#gsa-m6-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

In the Log Analytics workspace's Logs:

```kusto
// Step 1: Measure ring 1's exit criteria
SigninLogs
| where TimeGenerated > ago(7d)
| summarize Total = count(), ThroughGSA = countif(tostring(IsThroughGlobalSecureAccess) =~ "true") by bin(TimeGenerated, 1d)
| extend PctThroughGSA = round(100.0 * ThroughGSA / Total, 1)

// Step 1: Measure ring 1's exit criteria
let T = NetworkAccessTraffic
    | where TimeGenerated > ago(24h) and TrafficType == "internet" and isnotempty(TlsStatus)
    | summarize Count = count() by TlsStatus, TlsAction;
let Total = toscalar(T | summarize sum(Count));
T | extend Share = round(100.0 * Count / Total, 2)

// Step 1: Measure ring 1's exit criteria
union isfuzzy=true withsource=Table NetworkAccessTraffic, NetworkAccessConnectionEvents, RemoteNetworkHealthLogs, NetworkAccessAlerts
| where TimeGenerated > ago(1d)
| summarize Rows = count(), Last = max(TimeGenerated) by Table
```

In PowerShell 7:

```powershell
# Step 2: Take the evidence export
Set-Location <lab-folder>
Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All","Policy.ReadWrite.ConditionalAccess","Policy.Read.All","Application.ReadWrite.All"
$out = ".\gsa-config-$(Get-Date -Format yyyyMMdd)-ring1"; New-Item -ItemType Directory $out | Out-Null
$uris = @{
  "forwardingProfiles" = "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles?`$expand=policies"
  "filteringProfiles"  = "https://graph.microsoft.com/beta/networkAccess/filteringProfiles?`$expand=policies"
  "filteringPolicies"  = "https://graph.microsoft.com/beta/networkAccess/filteringPolicies"
  "caSignaling"        = "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess"
  "crossTenantTagging" = "https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess"
  "connectors"         = "https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationProxy/connectors"
  "connectorGroups"    = "https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationProxy/connectorGroups"
  "caPolicies"         = "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies"
  "namedLocations"     = "https://graph.microsoft.com/beta/identity/conditionalAccess/namedLocations"
}
foreach ($k in $uris.Keys) {
  Invoke-MgGraphRequest -Method GET -Uri $uris[$k] | ConvertTo-Json -Depth 20 | Out-File "$out\$k.json"
}
Get-ChildItem $out | Get-FileHash -Algorithm SHA256 | Export-Csv "$out\manifest.csv" -NoTypeInformation

# Step 3: List the IDs the rollback needs
$pol = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies"
$pol.value | Where-Object { $_.displayName -like "NET-*" } | Select-Object id, displayName, state
$fp = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles"
$fp.value | Select-Object id, name, trafficForwardingType, state

# Step 4: Roll back the Conditional Access policies to report-only
$ro = '{"state":"enabledForReportingButNotEnforced"}'
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<admin-policy-id>" -Body $ro -ContentType "application/json"
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<cn-policy-id>" -Body $ro -ContentType "application/json"
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<pa-policy-id>" -Body $ro -ContentType "application/json"
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<ia-policy-id>" -Body $ro -ContentType "application/json"

# Step 5: Remove the security profile's links
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<ia-policy-id>" -Body '{"state":"disabled"}' -ContentType "application/json"

# Step 6: Disable universal tenant restrictions tagging
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess" -Body '{"networkPacketTaggingStatus":"disabled"}' -ContentType "application/json"

# Step 7: Take the groups out of the traffic profiles, then disable the profiles
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<private-profile-id>" -Body '{"state":"disabled"}' -ContentType "application/json"
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<internet-profile-id>" -Body '{"state":"disabled"}' -ContentType "application/json"
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<m365-profile-id>" -Body '{"state":"disabled"}' -ContentType "application/json"

# Step 8: Disable signaling, last
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess" -Body '{"signalingStatus":"disabled"}' -ContentType "application/json"
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess"

# Step 9: Take the export again
$out = ".\gsa-config-$(Get-Date -Format yyyyMMdd)-rolled-back"; New-Item -ItemType Directory $out | Out-Null
foreach ($k in $uris.Keys) {
  Invoke-MgGraphRequest -Method GET -Uri $uris[$k] | ConvertTo-Json -Depth 20 | Out-File "$out\$k.json"
}
Get-ChildItem $out | Get-FileHash -Algorithm SHA256 | Export-Csv "$out\manifest.csv" -NoTypeInformation

# Step 10: Remove the lab's test objects
Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<admin-policy-id>"
Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<cn-policy-id>"
Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<pa-policy-id>"
Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<ia-policy-id>"
Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/applications/<admin-app-object-id>"
Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/applications/<app-object-id>"
Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/beta/networkAccess/filteringProfiles/<security-profile-id>"
Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/beta/networkAccess/filteringPolicies/<filtering-policy-id>"
Disconnect-MgGraph

# Step 11: Remove the QUIC rule
Remove-NetFirewallRule -DisplayName "Block QUIC"
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 12: Delete the telemetry setting
ARM="https://management.azure.com"
az rest --method DELETE --uri "${ARM}/providers/microsoft.aadiam/diagnosticSettings/gsa-network-telemetry?api-version=2017-04-01"
az rest --method GET --uri "${ARM}/providers/microsoft.aadiam/diagnosticSettings?api-version=2017-04-01" -o jsonc
```

:::

<!-- labs:end -->

You measure ring 1's exit criteria on the pilot, take the evidence export, then roll the whole test tenant back in the guide's order and take the export again, so the evidence shows the state after it. This lab removes what Modules 1 to 5 built.

- **You need:** Modules 1 to 5's labs done; the same roles, activated through PIM; Azure CLI in a Bash shell for the last step.
- **You'll replace:** `<lab-folder>`; the four policy IDs from step 3's output, `<admin-policy-id>` (NET-PA-AdminRDP-PhishingResistant), `<cn-policy-id>` (NET-CN-Require-Compliant-Network-Pilot), `<pa-policy-id>` (NET-PA-`<app-name>`-Device-MFA) and `<ia-policy-id>` (NET-IA-SecurityProfile-Pilot); `<m365-profile-id>`, `<internet-profile-id>` and `<private-profile-id>` (the three forwarding profiles, from step 3's output); `<security-profile-id>`, `<filtering-policy-id>`, `<app-object-id>` and `<admin-app-object-id>` (from Modules 4 and 5); and `<subscription-id>`, `<resource-group>` and `<workspace>`.

1. **Measure ring 1's exit criteria.** In the workspace's **Logs**, run Step 4's sign-in share, then Step 9's TLS outcomes, then Step 12's freshness query, and keep each result with the date:

    ```kusto
    SigninLogs
    | where TimeGenerated > ago(7d)
    | summarize Total = count(), ThroughGSA = countif(tostring(IsThroughGlobalSecureAccess) =~ "true") by bin(TimeGenerated, 1d)
    | extend PctThroughGSA = round(100.0 * ThroughGSA / Total, 1)
    ```

    ```kusto
    let T = NetworkAccessTraffic
        | where TimeGenerated > ago(24h) and TrafficType == "internet" and isnotempty(TlsStatus)
        | summarize Count = count() by TlsStatus, TlsAction;
    let Total = toscalar(T | summarize sum(Count));
    T | extend Share = round(100.0 * Count / Total, 2)
    ```

    ```kusto
    union isfuzzy=true withsource=Table NetworkAccessTraffic, NetworkAccessConnectionEvents, RemoteNetworkHealthLogs, NetworkAccessAlerts
    | where TimeGenerated > ago(1d)
    | summarize Rows = count(), Last = max(TimeGenerated) by Table
    ```

    Write the ring exit record: each criterion of the guide's ring 1 row (10 business days; no unresolved Sev-2 ticket; client active on all pilot devices, from Module 2's device usage summary; report-only results clean, from Modules 3 and 4), with its measured value. A table with no rows in 24 hours fails the freshness metric.

2. **Take the evidence export** (the guide's Step 2.1, rerun before every change):

    ```powershell
    Set-Location <lab-folder>
    Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All","Policy.ReadWrite.ConditionalAccess","Policy.Read.All","Application.ReadWrite.All"
    $out = ".\gsa-config-$(Get-Date -Format yyyyMMdd)-ring1"; New-Item -ItemType Directory $out | Out-Null
    $uris = @{
      "forwardingProfiles" = "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles?`$expand=policies"
      "filteringProfiles"  = "https://graph.microsoft.com/beta/networkAccess/filteringProfiles?`$expand=policies"
      "filteringPolicies"  = "https://graph.microsoft.com/beta/networkAccess/filteringPolicies"
      "caSignaling"        = "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess"
      "crossTenantTagging" = "https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess"
      "connectors"         = "https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationProxy/connectors"
      "connectorGroups"    = "https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationProxy/connectorGroups"
      "caPolicies"         = "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies"
      "namedLocations"     = "https://graph.microsoft.com/beta/identity/conditionalAccess/namedLocations"
    }
    foreach ($k in $uris.Keys) {
      Invoke-MgGraphRequest -Method GET -Uri $uris[$k] | ConvertTo-Json -Depth 20 | Out-File "$out\$k.json"
    }
    Get-ChildItem $out | Get-FileHash -Algorithm SHA256 | Export-Csv "$out\manifest.csv" -NoTypeInformation
    ```

3. **List the IDs the rollback needs:**

    ```powershell
    $pol = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies"
    $pol.value | Where-Object { $_.displayName -like "NET-*" } | Select-Object id, displayName, state
    $fp = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles"
    $fp.value | Select-Object id, name, trafficForwardingType, state
    ```

4. **Roll back the Conditional Access policies to report-only**, Steps 10, 7, 6 and 5 in that order (the guide's rollback, first line):

    ```powershell
    $ro = '{"state":"enabledForReportingButNotEnforced"}'
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<admin-policy-id>" -Body $ro -ContentType "application/json"
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<cn-policy-id>" -Body $ro -ContentType "application/json"
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<pa-policy-id>" -Body $ro -ContentType "application/json"
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<ia-policy-id>" -Body $ro -ContentType "application/json"
    ```

5. **Remove the security profile's links.** Remove the TLS inspection policy in Learn's order, in **Global Secure Access** > **Secure** > **TLS inspection policies**: unlink it from `SP-Pilot`, delete the policy, then remove the certificate in **TLS inspection settings**. Then, for the filtering policy, set its Conditional Access policy to `disabled` (the guide's Step 5 rollback):

    ```powershell
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<ia-policy-id>" -Body '{"state":"disabled"}' -ContentType "application/json"
    ```

6. **Disable universal tenant restrictions tagging** (the guide's Step 8 rollback; the tenant restrictions v2 policy stays):

    ```powershell
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess" -Body '{"networkPacketTaggingStatus":"disabled"}' -ContentType "application/json"
    ```

7. **Take the groups out of the traffic profiles, then disable the profiles.** In **Global Secure Access** > **Connect** > **Traffic forwarding**, remove the pilot and privileged groups from each profile's **User and group assignments**. Then:

    ```powershell
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<private-profile-id>" -Body '{"state":"disabled"}' -ContentType "application/json"
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<internet-profile-id>" -Body '{"state":"disabled"}' -ContentType "application/json"
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<m365-profile-id>" -Body '{"state":"disabled"}' -ContentType "application/json"
    ```

    In production, the next line of the guide's rollback is restoring the VPN route; the test tenant has none.

8. **Disable signaling, last**, now that no policy enforces on it:

    ```powershell
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess" -Body '{"signalingStatus":"disabled"}' -ContentType "application/json"
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess"
    ```

9. **Take the export again** (the guide: every rollback is followed by the Step 2.1 export), in the same session as step 2, which defined `$uris`:

    ```powershell
    $out = ".\gsa-config-$(Get-Date -Format yyyyMMdd)-rolled-back"; New-Item -ItemType Directory $out | Out-Null
    foreach ($k in $uris.Keys) {
      Invoke-MgGraphRequest -Method GET -Uri $uris[$k] | ConvertTo-Json -Depth 20 | Out-File "$out\$k.json"
    }
    Get-ChildItem $out | Get-FileHash -Algorithm SHA256 | Export-Csv "$out\manifest.csv" -NoTypeInformation
    ```

    The new `forwardingProfiles.json` shows the three profiles `disabled`, `caSignaling.json` shows signaling `disabled`, `crossTenantTagging.json` shows tagging `disabled`, and `caPolicies.json` shows no `NET-` policy `enabled`.

10. **Remove the lab's test objects.** Delete the four test policies, the two Private Access applications, the security profile and the filtering policy:

    ```powershell
    Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<admin-policy-id>"
    Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<cn-policy-id>"
    Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<pa-policy-id>"
    Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<ia-policy-id>"
    Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/applications/<admin-app-object-id>"
    Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/applications/<app-object-id>"
    Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/beta/networkAccess/filteringProfiles/<security-profile-id>"
    Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/beta/networkAccess/filteringPolicies/<filtering-policy-id>"
    Disconnect-MgGraph
    ```

    In Intune, remove the client app's **Required** assignment and assign the uninstall to the pilot group, the guide's Step 3 rollback, and remove the DNS over HTTPS profile's assignment.

11. **Remove the QUIC rule** on the pilot device, in PowerShell as an administrator:

    ```powershell
    Remove-NetFirewallRule -DisplayName "Block QUIC"
    ```

12. **Delete the telemetry setting**, in Bash. In production this ends the evidence trail and happens only by change; in the test tenant it ends the lab:

    ```bash
    ARM="https://management.azure.com"
    az rest --method DELETE --uri "${ARM}/providers/microsoft.aadiam/diagnosticSettings/gsa-network-telemetry?api-version=2017-04-01"
    az rest --method GET --uri "${ARM}/providers/microsoft.aadiam/diagnosticSettings?api-version=2017-04-01" -o jsonc
    ```

    The GET no longer lists `gsa-network-telemetry`. Keep `<lab-folder>`: it is the path's evidence package, with both exports and their manifests.

## Knowledge check (5 minutes) {#gsa-m6-check}

1. When is the VPN route for a migrated application removed?
    a. As soon as the application is published in Private Access.
    b. Only after the wave holds, with the VPN's own logs showing no traffic for that application for 10 business days.
    c. At the end of ring 1.

2. A user at a branch is behind a remote network and has no client. What policy applies to that user's traffic?
    a. The same identity-aware Conditional Access policy as a client user.
    b. Only the baseline profile, with no Conditional Access; so the guide keeps the client on managed devices at branches.
    c. Private Access only.

3. In the guide's rollback, what comes last?
    a. Conditional Access policies to report-only.
    b. Removing the groups from the traffic profiles.
    c. Disabling signaling, only after no policy depends on it.

4. Who decides that a network finding is closed?
    a. The platform owner, once every Validate step passed.
    b. The authorizing official, or the assessor for an assessment finding; the assessor recommends it ready for closure.
    c. The Zero Trust Assessment, when the test passes.

5. Which metric does the guide use for client coverage after ring 3, and what is its starting target?
    a. Win32 app installs; 100%.
    b. The device usage summary's active devices over Intune's in-scope Windows devices; 98%.
    c. Sign-ins through the service; 95%.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [Step 11](../../books/guides/global-secure-access-implementation.md#step-11-coexistence-and-migration) Validate.
2. **b.** See Unit 1 and the guide's Step 11, 11.3.
3. **c.** See Unit 3 and the guide's [Rollback](../../books/guides/global-secure-access-implementation.md#rollback).
4. **b.** See Unit 2 and the guide's [RACI](../../books/guides/global-secure-access-implementation.md#raci).
5. **b.** See Unit 3 and the guide's [Metrics](../../books/guides/global-secure-access-implementation.md#metrics).
:::

## Summary (2 minutes) {#gsa-m6-summary}

You measured a ring's exit criteria, took the evidence export, rolled the test tenant back in the guide's order, took the export again to show the state after the rollback, and removed the lab's test objects. **Evidence an ISSO keeps from this module:** the ring exit record with each criterion's measured value, the ring 1 and rolled-back exports with their manifests, the rollback change record, the exception register, and, in production, the CISA telemetry agreement and the Zero Trust Assessment rerun after each ring with each network finding's closure chain entry updated.

::: {.callout-tip}
## Continue the path
[← Previous: Module 5](05-internet-access-and-tls-inspection.md) · [Learning path](index.md) · [Training](../index.md)
:::
