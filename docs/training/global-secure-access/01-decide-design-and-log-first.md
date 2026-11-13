---
title: "Module 1: Decide, design and log first"
description: "Guide Steps 1, 2 and 12's logging: why the twelve steps run in a different order from their numbers; deciding each function (Microsoft traffic, internet, private, branch) on its own gate, with a dated availability quote and exit criteria; the reference architecture's planes and trust boundaries; the weekly configuration export with its hash manifest; and the diagnostic setting that sends the four network log categories to the workspace before any pilot. Lab 2 reads the licenses and onboarding state, exports the baseline and turns on the telemetry in a test tenant. About 45 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 09"
series-order: 1
review-status: pending
last-reviewed: 2026-11-13
---
# Module 1: Decide, design and log first {.unnumbered}

*Part of the [Global Secure Access learning path](index.md). Guide [Step 1](../../books/guides/global-secure-access-implementation.md#step-1-decision-and-licensing), [Step 2](../../books/guides/global-secure-access-implementation.md#step-2-reference-architecture) and the logging half of [Step 12](../../books/guides/global-secure-access-implementation.md#step-12-telemetry-and-evidence). About 45 minutes, plus Lab 2.*

**Watch first:** slides 2 to 9 of the guide's narrated deck (why, TIC 3.0, the twelve steps, availability, the reference architecture, the RACI, Steps 1 and 2), in its [narration script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-global-secure-access/Guide_Global_Secure_Access_Narration_Script.md).

## Introduction (3 minutes) {#gsa-m1-intro}

Global Secure Access is three things under one name: a Microsoft traffic profile that comes with Microsoft Entra ID P1 or P2, and Internet Access and Private Access, which are licensed separately. Each has its own gate, so the decision is made per function, not for the product. And because nothing should block before there is a record of what it blocked, the network logs go on before the first pilot user does. In this module you decide, write the architecture down for your tenant, take the first configuration export, and turn on the telemetry.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs, by step](../../books/guides/global-secure-access-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| PL-2, SA-9, CA-3: the function, its availability, license, compensating controls and exit criteria decided and approved | Not mapped (a decision record isn't mapped to an indicator) | The decision record, the license export, the tenant status, the dated availability quote |
| SC-7, AC-4, CM-2, CM-8: boundaries, planes and flows documented and exported | KSI-CNA-ULN, KSI-PIY-GIV | The architecture record and the hashed configuration export |
| AU-2, AU-6, AU-12, SI-4: network logs exported and fresh | KSI-MLA-OSM, KSI-MLA-LET, KSI-MLA-RVL | The diagnostic setting GET and the freshness result |

The steps support these controls and provide evidence for them; your organization still sets their parameters and owns the policy and procedures, and the assessor decides whether each is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with them and doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)).

## Learning objectives (1 minute) {#gsa-m1-objectives}

After this module, you'll be able to:

- explain why the guide runs its steps in the order 1, 2, 12, 3, 4, 7, 8, 6, 10, 5, 9, 11, 12;
- decide each function on its own gate and record the decision with an availability quote, compensating controls and exit criteria;
- name the seven zones and planes of the reference architecture and who owns each;
- export the configuration as hashed evidence, and say why the Graph network access API is run by hand;
- turn on the four network log categories and check that each is fresh.

## Prerequisites (1 minute) {#gsa-m1-prerequisites}

- [Book 09, Chapter 05: Microsoft's security service edge](../../books/b09-network/05-sd-wan-sase-and-governed-transport.md#microsofts-security-service-edge-global-secure-access), its gates in particular. About 15 minutes.
- [Book 12, Chapter 03: Global Secure Access logs and alerts](../../books/b12-security-operations/03-identity-telemetry.md#global-secure-access-logs-and-alerts), for the categories and tables.

## Unit 1: The run order and the beta API (6 minutes) {#gsa-m1-run-order}

Read the guide's [How to read this guide](../../books/guides/global-secure-access-implementation.md#how-to-read) and [Where each topic lives](../../books/guides/global-secure-access-implementation.md#topic-map). The steps are numbered to match the twelve network topics of the Zero Trust closure update, but they run in another order so the logs exist before anything is enforced and nothing blocks before its path exists: 1, 2, 12 (logging only), 3, 4, 7, 8, 6, 10, 5, 9, 11, then 12 again for the evidence package. This path follows that order.

Microsoft's network access APIs are on the Graph `/beta` endpoint, which Learn says is subject to change and not supported in production applications. The guide runs Learn's requests interactively, by an administrator, and keeps each result as evidence; it doesn't build unattended production automation on them *(Risk-based recommended)*. The placeholders in the guide's [placeholder table](../../books/guides/global-secure-access-implementation.md#how-to-read) are the ones every lab in this path uses.

## Unit 2: Where agencies are, and the decision per function (10 minutes) {#gsa-m1-decision}

Read the guide's [Government cloud and licensing, feature by feature](../../books/guides/global-secure-access-implementation.md#availability) and [Step 1](../../books/guides/global-secure-access-implementation.md#step-1-decision-and-licensing). Learn's limitations page says the service is available in GCC; no feature page narrows that, so the GCC column rests on the one sentence, and a preview feature's GCC availability is *not yet specified*. Re-read the limitations page before each ring.

Licensing follows the profiles. The Microsoft traffic profile, and with it source IP restoration, the compliant network check and universal tenant restrictions, comes with Entra ID P1 or P2; Internet Access and Private Access need their own licenses or the Microsoft Entra Suite. So the decision record has one row per function: adopt, retain the current VPN or SSE, coexist, or defer. A `retain-current` or `defer` row names its compensating controls (for example, the current FedRAMP-authorized SSE, per-application VPN access lists, named-location Conditional Access). The guide's [TIC 3.0 alignment](../../books/guides/global-secure-access-implementation.md#tic-alignment) and [comparison with other SSE offerings](../../books/guides/global-secure-access-implementation.md#comparison) feed the same record.

## Unit 3: The reference architecture (8 minutes) {#gsa-m1-architecture}

Read the guide's [reference architecture](../../books/guides/global-secure-access-implementation.md#reference-architecture) and [Step 2](../../books/guides/global-secure-access-implementation.md#step-2-reference-architecture). Seven zones and planes: the managed endpoint, the branch, the control plane (Conditional Access decides and never carries traffic), the policy plane (profiles, TLS inspection, signaling), the data plane (Microsoft's service edge in commercial Azure regions), the agency's private network (connectors and sensors, outbound only) and the evidence zone. Step 2 makes it the agency's: which profiles each population gets, how many connector groups and where (two connectors minimum each), the private DNS suffixes, which branches use remote networks, and where telemetry lands. Learn's operations guidance is to back up the configuration through Graph JSON exports weekly and before every change; the guide hashes that export, and it becomes the configuration evidence for every later step.

## Unit 4: Logs before the pilot (6 minutes) {#gsa-m1-logs}

Read the guide's [Step 12](../../books/guides/global-secure-access-implementation.md#step-12-telemetry-and-evidence), 12.1 to 12.3. Traffic and remote network health logs stay in the service for 30 days; a dedicated Entra diagnostic setting exports `NetworkAccessTrafficLogs`, `NetworkAccessConnectionEvents`, `RemoteNetworkHealthLogs` and `NetworkAccessAlerts` to the workspace, and the freshness query runs daily. A sudden drop in traffic volume is an alert in itself. And the TIC 3.0 Remote User Use Case says CISA's visibility must be preserved through telemetry sharing, so how the logs reach CISA is agreed with the agency's TIC delegates before the VPN's web path is retired.

## Exercise: Lab 2, a test tenant {#gsa-m1-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

In PowerShell 7:

```powershell
# Step 1: Open the lab folder and connect
New-Item -ItemType Directory -Path <lab-folder>
Set-Location <lab-folder>
Install-Module Microsoft.Graph -Scope CurrentUser
Connect-MgGraph -Environment Global -Scopes "Organization.Read.All","NetworkAccess.Read.All"

# Step 2: Read the licenses and the onboarding state
Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits, @{n="Enabled";e={$_.PrepaidUnits.Enabled}} |
    Export-Csv .\gsa-01-licenses.csv -NoTypeInformation
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/tenantStatus" |
    ConvertTo-Json -Depth 5 | Out-File .\gsa-01-tenant-status.json
Import-Csv .\gsa-01-licenses.csv | Format-Table
Get-Content .\gsa-01-tenant-status.json

# Step 3: Export the baseline configuration
Disconnect-MgGraph
Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All","Policy.ReadWrite.ConditionalAccess","Policy.Read.All","Application.ReadWrite.All"
$out = ".\gsa-config-$(Get-Date -Format yyyyMMdd)"; New-Item -ItemType Directory $out | Out-Null
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
Get-ChildItem $out
```

In a POSIX shell (Git Bash on Windows):

```bash
# Step 4: Turn on the network telemetry
ARM="https://management.azure.com"
WORKSPACE_ID="/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.OperationalInsights/workspaces/<workspace>"
az rest --method PUT \
  --uri "${ARM}/providers/microsoft.aadiam/diagnosticSettings/gsa-network-telemetry?api-version=2017-04-01" \
  --headers "Content-Type=application/json" \
  --body "{\"properties\":{\"workspaceId\":\"${WORKSPACE_ID}\",\"logs\":[
    {\"category\":\"NetworkAccessTrafficLogs\",\"enabled\":true},
    {\"category\":\"NetworkAccessConnectionEvents\",\"enabled\":true},
    {\"category\":\"RemoteNetworkHealthLogs\",\"enabled\":true},
    {\"category\":\"NetworkAccessAlerts\",\"enabled\":true}]}}"
az rest --method GET --uri "${ARM}/providers/microsoft.aadiam/diagnosticSettings?api-version=2017-04-01" -o jsonc > gsa-12-diagnostic-settings.json
cat gsa-12-diagnostic-settings.json
```

In the Log Analytics workspace's Logs:

```kusto
// Step 5: Check freshness
union isfuzzy=true withsource=Table NetworkAccessTraffic, NetworkAccessConnectionEvents, RemoteNetworkHealthLogs, NetworkAccessAlerts
| where TimeGenerated > ago(1d)
| summarize Rows = count(), Last = max(TimeGenerated) by Table
```

:::

<!-- labs:end -->

You read the tenant's licenses and onboarding state, take the first configuration export with its hash manifest, and turn on the network log categories, all in a test tenant.

- **You need:** a test tenant with Global Secure Access onboarded; an administrator with Global Secure Access Administrator or Security Administrator activated through PIM; PowerShell 7 with the Microsoft Graph PowerShell SDK; Azure CLI in a Bash shell, signed in with `az login` as a Security Administrator; and a Log Analytics workspace in an Azure test subscription.
- **You'll replace:** `<lab-folder>` (a new, empty folder that only you and the evidence custodians can read, for example `D:\Labs\GSA`), and `<subscription-id>`, `<resource-group>` and `<workspace>` (the test workspace). Keep `<lab-folder>`: every module's lab writes its evidence there.

1. **Open the lab folder and connect** with the read scopes of the guide's Step 1.1:

    ```powershell
    New-Item -ItemType Directory -Path <lab-folder>
    Set-Location <lab-folder>
    Install-Module Microsoft.Graph -Scope CurrentUser
    Connect-MgGraph -Environment Global -Scopes "Organization.Read.All","NetworkAccess.Read.All"
    ```

2. **Read the licenses and the onboarding state** (the guide's Step 1.1):

    ```powershell
    Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits, @{n="Enabled";e={$_.PrepaidUnits.Enabled}} |
        Export-Csv .\gsa-01-licenses.csv -NoTypeInformation
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/tenantStatus" |
        ConvertTo-Json -Depth 5 | Out-File .\gsa-01-tenant-status.json
    Import-Csv .\gsa-01-licenses.csv | Format-Table
    Get-Content .\gsa-01-tenant-status.json
    ```

    Learn doesn't publish the service plan identifiers on the pages the guide read, so compare the SKUs by product name with the licensing section of Learn's "What is Global Secure Access?" in the Microsoft 365 admin center. The guide's Validate: `gsa-01-tenant-status.json` shows the tenant onboarded, and the license count is no smaller than the pilot and the first ring.

3. **Export the baseline configuration** (the guide's Step 2.1), in a session with the guide's scopes:

    ```powershell
    Disconnect-MgGraph
    Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All","Policy.ReadWrite.ConditionalAccess","Policy.Read.All","Application.ReadWrite.All"
    $out = ".\gsa-config-$(Get-Date -Format yyyyMMdd)"; New-Item -ItemType Directory $out | Out-Null
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
    Get-ChildItem $out
    ```

    The guide's Validate: the export folder and its hash manifest exist. The folder holds one JSON file for each of the nine URIs, and `manifest.csv`.

4. **Turn on the network telemetry** (the guide's Step 12.1), in Bash. This writes a diagnostic setting to the test tenant; Module 6 removes it.

    ```bash
    ARM="https://management.azure.com"
    WORKSPACE_ID="/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.OperationalInsights/workspaces/<workspace>"
    az rest --method PUT \
      --uri "${ARM}/providers/microsoft.aadiam/diagnosticSettings/gsa-network-telemetry?api-version=2017-04-01" \
      --headers "Content-Type=application/json" \
      --body "{\"properties\":{\"workspaceId\":\"${WORKSPACE_ID}\",\"logs\":[
        {\"category\":\"NetworkAccessTrafficLogs\",\"enabled\":true},
        {\"category\":\"NetworkAccessConnectionEvents\",\"enabled\":true},
        {\"category\":\"RemoteNetworkHealthLogs\",\"enabled\":true},
        {\"category\":\"NetworkAccessAlerts\",\"enabled\":true}]}}"
    az rest --method GET --uri "${ARM}/providers/microsoft.aadiam/diagnosticSettings?api-version=2017-04-01" -o jsonc > gsa-12-diagnostic-settings.json
    cat gsa-12-diagnostic-settings.json
    ```

    The GET lists a setting named `gsa-network-telemetry` with the four categories enabled and your workspace's resource ID.

5. **Check freshness.** In the Azure portal, open the test workspace, select **Logs**, and run the guide's Step 12 query:

    ```kusto
    union isfuzzy=true withsource=Table NetworkAccessTraffic, NetworkAccessConnectionEvents, RemoteNetworkHealthLogs, NetworkAccessAlerts
    | where TimeGenerated > ago(1d)
    | summarize Rows = count(), Last = max(TimeGenerated) by Table
    ```

    The guide's Validate is that each category has rows within an hour of pilot traffic. There is no pilot traffic yet, so expect few or no rows now; run the query again after Module 2's lab, and keep both results.

## Knowledge check (5 minutes) {#gsa-m1-check}

1. Why does the guide run Step 12's logging before Step 3?
    a. Because the diagnostic setting can't be created after the client is deployed.
    b. So the logs exist before anything is enforced, and every later Validate step has a record to read.
    c. Because Learn requires steps to run in numeric order.

2. A preview feature, such as the cloud firewall for clients, is in your plan. What is its GCC availability in the guide's table?
    a. Available, because the product is available in GCC.
    b. *Not yet specified*: the GCC column rests on Learn's product-wide sentence, and preview features aren't covered by it.
    c. Not available.

3. Which function comes with Microsoft Entra ID P1 or P2, without a separate Global Secure Access license?
    a. The Microsoft traffic profile, with source IP restoration, the compliant network check and universal tenant restrictions.
    b. Internet Access web content filtering.
    c. Private Access per-app access.

4. Why does the guide run the Graph network access requests by hand and keep the result?
    a. The API is on the beta endpoint, which Learn says is subject to change and not supported in production applications.
    b. The API doesn't work from GCC.
    c. The requests need a Global Administrator.

5. How long does the service itself keep traffic logs?
    a. 7 days.
    b. 30 days; longer retention needs export through diagnostic settings.
    c. One year.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [Where each topic lives](../../books/guides/global-secure-access-implementation.md#topic-map).
2. **b.** See Unit 2 and the guide's [availability table](../../books/guides/global-secure-access-implementation.md#availability).
3. **a.** See Unit 2 and the [availability table](../../books/guides/global-secure-access-implementation.md#availability).
4. **a.** See Unit 1 and the guide's [How to read this guide](../../books/guides/global-secure-access-implementation.md#how-to-read).
5. **b.** See Unit 4 and the guide's [Step 12](../../books/guides/global-secure-access-implementation.md#step-12-telemetry-and-evidence).
:::

## Summary (2 minutes) {#gsa-m1-summary}

You decided each function on its own gate, wrote the architecture down, took the first hashed configuration export and turned on the network telemetry before anyone was in a pilot. **Evidence an ISSO keeps from this module:** the decision record with its dated availability quote and approver, `gsa-01-licenses.csv` and `gsa-01-tenant-status.json`, the architecture record, the export folder with its `manifest.csv`, the diagnostic setting GET and the freshness result.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Next: Module 2, The client and Microsoft traffic →](02-the-client-and-microsoft-traffic.md)
:::
