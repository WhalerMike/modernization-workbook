---
title: "Module 3: The compliant network and tenant restrictions"
description: "Guide Steps 7 and 8: the compliant network check, which passes only for users on this tenant's Global Secure Access and denies a replayed token; its named location, the Intune exclusions, a pilot policy in report-only for 10 business days, its failure modes and Universal Continuous Access Evaluation; then universal tenant restrictions, which apply the tenant restrictions v2 policy to devices with the client without a proxy, and Learn's four-case test. Lab 2 builds both in a test tenant and reads the report-only results and the block log. About 45 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 09"
series-order: 3
review-status: pending
last-reviewed: 2026-11-13
---
# Module 3: The compliant network and tenant restrictions {.unnumbered}

*Part of the [Global Secure Access learning path](index.md). Guide [Step 7](../../books/guides/global-secure-access-implementation.md#step-7-compliant-network) and [Step 8](../../books/guides/global-secure-access-implementation.md#step-8-tenant-restrictions). About 45 minutes, plus Lab 2.*

**Watch first:** slides 11 and 14 of the guide's narrated deck (Microsoft traffic and the compliant network; tenant restrictions and TLS inspection), in its [narration script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-global-secure-access/Guide_Global_Secure_Access_Narration_Script.md).

## Introduction (3 minutes) {#gsa-m3-intro}

These are the two signals only Microsoft Entra can produce from the network, and both come with the Microsoft traffic profile you enabled in Module 2. The compliant network check binds sign-in and token use to the agency's own path, so a token stolen and replayed from somewhere else fails. Universal tenant restrictions keep agency devices from signing in to a personal or hostile tenant. Both can lock people out, so in this module you learn their failure modes first and run them in report-only or a pilot before they block anyone.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs, by step](../../books/guides/global-secure-access-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| AC-3, AC-12, SC-23: sign-in and token use bound to the agency's path | KSI-IAM-ELP, KSI-CNA-ULN, KSI-IAM-APM | The policy export, the named location, the report-only results, the disable-and-retry test, the break-glass rehearsal record |
| AC-20, AC-20(1), AC-4: agency devices sign in only to approved tenants | KSI-IAM-ELP, KSI-CNA-MAT | The tenant restrictions v2 exports, the tagging GET, the four-case test record |

The steps support these controls and provide evidence for them; the assessor decides whether each is satisfied. The program's mapping also lines Step 7 up with OMB M-22-09's identity and network verification.

## Learning objectives (1 minute) {#gsa-m3-objectives}

After this module, you'll be able to:

- explain what the compliant network check denies at authentication and, with Continuous Access Evaluation, in near real time;
- create the pilot policy in report-only with the emergency access group and the Intune applications excluded;
- list the five failure modes and the design response to each, including a service outage;
- turn on universal tenant restrictions after the tenant restrictions v2 policy, and say which data planes it reaches;
- run Learn's four-case test and read the block log.

## Prerequisites (1 minute) {#gsa-m3-prerequisites}

- [Module 2](02-the-client-and-microsoft-traffic.md), with the Microsoft traffic profile and signaling on for the pilot.
- [Book 04, Appendix C: tenant restrictions v2](../../books/b04-access/appendix-c-partner-access-profile-entra.md#tenant-restrictions-v2-the-outbound-edge), for the policy the tagging applies.

## Unit 1: The compliant network check (8 minutes) {#gsa-m3-compliant-network}

Read the guide's [Step 7](../../books/guides/global-secure-access-implementation.md#step-7-compliant-network), 7.1 to 7.3. The check passes only for users connected through this tenant's Global Secure Access, from the client or a remote network. It denies a replayed refresh token at authentication and, with services that support Continuous Access Evaluation such as Microsoft Graph, rejects a replayed access token in near real time. Turning signaling on creates the **All Compliant Network locations** named location; the policy blocks every location except it. Learn's example excludes **Microsoft Intune Enrollment** and **Microsoft Intune** to avoid a circular dependency where devices enroll, and the emergency access group. Learn's example goes straight to **On**; the guide, like every library policy, starts in report-only and scopes to the pilot for 10 business days.

## Unit 2: The failure modes, and Universal CAE (8 minutes) {#gsa-m3-failure-modes}

Read the guide's Step 7, 7.4, and its paragraph on Universal Continuous Access Evaluation. A disabled or missing client is blocked at the next authentication. In a Global Secure Access outage, users can't reach resources the check protects, so Microsoft's break-glass scripts that switch these policies to report-only are rehearsed and recorded in the contingency plan. Turning signaling off while policies are on blocks users, so the rollback order is policies first, signaling last. The check isn't supported for Private Access apps, which get Module 4's per-app policies instead. Mobile devices need Defender exclusions, out of the guide's Windows pilot. The Windows client 1.8.239.0 or later uses Universal CAE tokens, revoked in near real time; Learn's recommendation is not to disable CAE for these workloads, and the guide decides strict location enforcement per policy, not tenant-wide.

## Unit 3: Universal tenant restrictions (8 minutes) {#gsa-m3-tenant-restrictions}

Read the guide's [Step 8](../../books/guides/global-secure-access-implementation.md#step-8-tenant-restrictions). The tenant restrictions v2 policy comes first: default block, with partner policies for the agency's other tenants and each approved partner. Tagging then applies it to devices with the client or on a remote network, without a proxy. It reaches the authentication plane and the Microsoft Graph data plane, not the SharePoint or Exchange data plane, which only device-side signaling reaches. The setting is tenant-wide and has no report-only mode on the pages the guide read, so its pilot is the Microsoft traffic profile's assignment, with the block query read daily. The rollback is turning tagging off; the policy stays.

**Where agencies are.** Both features come with Entra ID P1 or P2 and the Microsoft traffic profile, are generally available, and are available in GCC by Learn's product-wide statement. Where the Microsoft traffic profile isn't adopted yet, the interim path is named-location Conditional Access and device-side tenant restrictions v2 by Group Policy ([Book 09, Chapter 12](../../books/b09-network/12-microsoft-365-traffic.md#tenant-restrictions-the-case-an-assessor-will-build)).

## Exercise: Lab 2, a test tenant {#gsa-m3-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

In PowerShell 7:

```powershell
# Step 1: Confirm signaling and read the named location
Set-Location <lab-folder>
Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All","Policy.ReadWrite.ConditionalAccess","Policy.Read.All","Application.ReadWrite.All"
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess"
$loc = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/identity/conditionalAccess/namedLocations"
$loc.value | Where-Object { $_.'@odata.type' -eq '#microsoft.graph.compliantNetworkNamedLocation' } | Select-Object id, displayName, isTrusted

# Step 2: Find the Intune applications to exclude
Get-MgServicePrincipal -Filter "displayName eq 'Microsoft Intune Enrollment'" | Select-Object AppId
Get-MgServicePrincipal -Filter "displayName eq 'Microsoft Intune'" | Select-Object AppId

# Step 3: Create the policy in report-only
$ca = @'
{
  "displayName": "NET-CN-Require-Compliant-Network-Pilot",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "users": { "includeGroups": [ "<pilot-group-id>" ], "excludeGroups": [ "<emergency-group-id>" ] },
    "applications": { "includeApplications": [ "All" ], "excludeApplications": [ "<intune-enrollment-app-id>", "<intune-app-id>" ] },
    "locations": { "includeLocations": [ "All" ], "excludeLocations": [ "<compliant-location-id>" ] }
  },
  "grantControls": { "operator": "OR", "builtInControls": [ "block" ] }
}
'@
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" -Body $ca -ContentType "application/json"
```

In the Log Analytics workspace's Logs:

```kusto
// Step 4: Read the would-be blocks
SigninLogs
| where TimeGenerated > ago(7d)
| mv-expand CAP = ConditionalAccessPolicies
| where tostring(CAP.displayName) == "NET-CN-Require-Compliant-Network-Pilot"
| summarize count() by Result = tostring(CAP.result), Through = tostring(IsThroughGlobalSecureAccess)
```

In PowerShell 7:

```powershell
# Step 5: Run Learn's disable-and-retry test with the policy on for the pilot
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<cn-policy-id>" -Body '{"state":"enabled"}' -ContentType "application/json"

# Step 5: Run Learn's disable-and-retry test with the policy on for the pilot
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<cn-policy-id>" -Body '{"state":"enabledForReportingButNotEnforced"}' -ContentType "application/json"

# Step 6: Read back the tenant restrictions v2 policy
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/policies/crossTenantAccessPolicy/default" | ConvertTo-Json -Depth 10 | Out-File .\gsa-08-trv2-default.json
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/policies/crossTenantAccessPolicy/partners" | ConvertTo-Json -Depth 10 | Out-File .\gsa-08-trv2-partners.json

# Step 7: Turn on tagging
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess" -Body '{"networkPacketTaggingStatus":"enabled"}' -ContentType "application/json"
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess" |
    ConvertTo-Json -Depth 5 | Out-File .\gsa-08-tagging.json
Get-Content .\gsa-08-tagging.json
```

In the Log Analytics workspace's Logs:

```kusto
// Step 9: Read the blocks
SigninLogs
| where TimeGenerated > ago(30d)
| where Identity contains "Tenant Restriction" and ResultType == 5000211
| summarize Blocked = count() by AppDisplayName, ResourceDisplayName, ResourceTenantId
```

:::

<!-- labs:end -->

You create the compliant network policy in report-only for the pilot, read what it would have blocked, run Learn's disable-and-retry test with the policy briefly on for the pilot, and turn on universal tenant restrictions and test them.

- **You need:** Module 2's lab done; the test tenant's emergency access group; a tenant restrictions v2 policy set up in the test tenant as [Book 04, Appendix C](../../books/b04-access/appendix-c-partner-access-profile-entra.md#tenant-restrictions-v2-the-outbound-edge) describes, with one allowed partner tenant; test accounts in the test tenant, in the allowed partner tenant and in a tenant that isn't allowed; a Conditional Access Administrator and a Global Secure Access Administrator, activated through PIM.
- **You'll replace:** `<lab-folder>`, `<pilot-group-id>`, `<emergency-group-id>` (the emergency access group's object ID), `<compliant-location-id>` (from step 1), `<intune-enrollment-app-id>` and `<intune-app-id>` (from step 2), and `<cn-policy-id>` (the new policy's ID, from step 3's output).

1. **Confirm signaling and read the named location** (the guide's Step 7.1):

    ```powershell
    Set-Location <lab-folder>
    Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All","Policy.ReadWrite.ConditionalAccess","Policy.Read.All","Application.ReadWrite.All"
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/settings/conditionalAccess"
    $loc = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/identity/conditionalAccess/namedLocations"
    $loc.value | Where-Object { $_.'@odata.type' -eq '#microsoft.graph.compliantNetworkNamedLocation' } | Select-Object id, displayName, isTrusted
    ```

    `signalingStatus` reads `enabled`, and one named location of type `compliantNetworkNamedLocation` is listed; its `id` is `<compliant-location-id>`.

2. **Find the Intune applications to exclude** (the guide's Step 7.2):

    ```powershell
    Get-MgServicePrincipal -Filter "displayName eq 'Microsoft Intune Enrollment'" | Select-Object AppId
    Get-MgServicePrincipal -Filter "displayName eq 'Microsoft Intune'" | Select-Object AppId
    ```

3. **Create the policy in report-only** (the guide's Step 7.3):

    ```powershell
    $ca = @'
    {
      "displayName": "NET-CN-Require-Compliant-Network-Pilot",
      "state": "enabledForReportingButNotEnforced",
      "conditions": {
        "users": { "includeGroups": [ "<pilot-group-id>" ], "excludeGroups": [ "<emergency-group-id>" ] },
        "applications": { "includeApplications": [ "All" ], "excludeApplications": [ "<intune-enrollment-app-id>", "<intune-app-id>" ] },
        "locations": { "includeLocations": [ "All" ], "excludeLocations": [ "<compliant-location-id>" ] }
      },
      "grantControls": { "operator": "OR", "builtInControls": [ "block" ] }
    }
    '@
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" -Body $ca -ContentType "application/json"
    ```

    The response carries the new policy's `id`, `<cn-policy-id>`, and `state` `enabledForReportingButNotEnforced`.

4. **Read the would-be blocks** after the pilot users have signed in, in the workspace's **Logs** (the guide's Step 7 Validate):

    ```kusto
    SigninLogs
    | where TimeGenerated > ago(7d)
    | mv-expand CAP = ConditionalAccessPolicies
    | where tostring(CAP.displayName) == "NET-CN-Require-Compliant-Network-Pilot"
    | summarize count() by Result = tostring(CAP.result), Through = tostring(IsThroughGlobalSecureAccess)
    ```

    The guide reads this for 10 business days. A non-zero `reportOnlyFailure` count with `Through` `true` is a defect to fix before enforcement. In a test tenant, the lab shortens the period; in production, never.

5. **Run Learn's disable-and-retry test with the policy on for the pilot.** Confirm first that your emergency access account isn't in the pilot group. Then set the policy to **On**:

    ```powershell
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<cn-policy-id>" -Body '{"state":"enabled"}' -ContentType "application/json"
    ```

    On the pilot device, as a pilot user: with the client running, sign in to an in-scope app; disable the client from the tray, open a new browser session and sign in again. Expect "You can't access this right now." Re-enable the client and confirm access. Then put the policy back in report-only, the guide's rollback:

    ```powershell
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<cn-policy-id>" -Body '{"state":"enabledForReportingButNotEnforced"}' -ContentType "application/json"
    ```

6. **Read back the tenant restrictions v2 policy** (the guide's Step 8.1):

    ```powershell
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/policies/crossTenantAccessPolicy/default" | ConvertTo-Json -Depth 10 | Out-File .\gsa-08-trv2-default.json
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/policies/crossTenantAccessPolicy/partners" | ConvertTo-Json -Depth 10 | Out-File .\gsa-08-trv2-partners.json
    ```

7. **Turn on tagging** (the guide's Step 8.2). It is tenant-wide, and it acts on everyone the Microsoft traffic profile carries, which in this lab is the pilot group:

    ```powershell
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess" -Body '{"networkPacketTaggingStatus":"enabled"}' -ContentType "application/json"
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess" |
        ConvertTo-Json -Depth 5 | Out-File .\gsa-08-tagging.json
    Get-Content .\gsa-08-tagging.json
    ```

    `networkPacketTaggingStatus` reads `enabled`.

8. **Run Learn's four-case test** (the guide's Step 8 Validate) from the pilot device with the client on, and record each outcome:
    1. A member of the test tenant signs in: signs in normally.
    2. An account from the allowed partner tenant signs in to that tenant: signs in.
    3. An account from a tenant that isn't allowed signs in: blocked.
    4. A guest in the test tenant signs in: isn't evaluated.

9. **Read the blocks** in the workspace's **Logs** (Learn's query, error `5000211`):

    ```kusto
    SigninLogs
    | where TimeGenerated > ago(30d)
    | where Identity contains "Tenant Restriction" and ResultType == 5000211
    | summarize Blocked = count() by AppDisplayName, ResourceDisplayName, ResourceTenantId
    ```

    Case 3's sign-in appears here. Keep the policy in report-only and tagging on: Module 6 rolls them back in the guide's order.

## Knowledge check (5 minutes) {#gsa-m3-check}

1. Learn's example compliant network policy is set straight to **On**. What does the guide do?
    a. The same, because the check can't run in report-only.
    b. Report-only for the pilot for 10 business days, reading the would-be blocks, then **On** ring by ring.
    c. **On** for everyone except the emergency access group.

2. Why are **Microsoft Intune Enrollment** and **Microsoft Intune** excluded from the policy?
    a. To avoid a circular dependency where devices enroll.
    b. Because Intune doesn't support Conditional Access.
    c. Because they are Private Access apps.

3. In a Global Secure Access outage, what keeps users working?
    a. Nothing; the check fails open.
    b. Microsoft's break-glass scripts that switch the policies to report-only, rehearsed and recorded in the contingency plan.
    c. Turning signaling off first.

4. Which data planes do universal tenant restrictions reach?
    a. Every Microsoft 365 data plane.
    b. The authentication plane and the Microsoft Graph data plane, not SharePoint or Exchange.
    c. Only the authentication plane.

5. In the four-case test, what happens to a guest in the agency's own tenant?
    a. Blocked.
    b. Signs in after a prompt.
    c. Isn't evaluated.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [Step 7](../../books/guides/global-secure-access-implementation.md#step-7-compliant-network), 7.3 and its How-section.
2. **a.** See Unit 1 and the guide's Step 7, 7.2.
3. **b.** See Unit 2 and the guide's Step 7, 7.4.
4. **b.** See Unit 3 and the guide's [Step 8](../../books/guides/global-secure-access-implementation.md#step-8-tenant-restrictions).
5. **c.** See the lab's step 8 and the guide's Step 8 Validate.
:::

## Summary (2 minutes) {#gsa-m3-summary}

You created the compliant network policy in report-only, read what it would have blocked, proved it blocks a client-less sign-in, put it back in report-only, and turned on universal tenant restrictions and tested all four cases. **Evidence an ISSO keeps from this module:** the policy export and the named location, the report-only results, the disable-and-retry record, the break-glass rehearsal record, `gsa-08-trv2-default.json`, `gsa-08-trv2-partners.json`, `gsa-08-tagging.json`, the four-case record and the block query result.

::: {.callout-tip}
## Continue the path
[← Previous: Module 2](02-the-client-and-microsoft-traffic.md) · [Learning path](index.md) · [Next: Module 4, Private applications and administrative paths →](04-private-apps-and-admin-paths.md)
:::
