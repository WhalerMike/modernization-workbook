---
title: "Module 5: Internet Access and TLS inspection"
description: "Guide Steps 5 and 9: Internet Access security profiles from Learn's Graph tutorial (a filtering policy for the categories the acceptable-use policy names, a security profile, the link and a Conditional Access policy that assigns it to the pilot), threat intelligence in the baseline profile, Learn's limits, QUIC, and bypass governance with an expiry on every entry; then TLS inspection, last: a dedicated issuing CA, trust deployed before activation, Learn's system and recommended bypass categories, the privacy officer's scope and user notice, pinned applications, and the 1% failure line. Lab 2 builds the pilot security profile, tests a block and reads the TLS outcomes in a test tenant. About 50 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 09"
series-order: 5
review-status: pending
last-reviewed: 2026-11-13
---
# Module 5: Internet Access and TLS inspection {.unnumbered}

*Part of the [Global Secure Access learning path](index.md). Guide [Step 5](../../books/guides/global-secure-access-implementation.md#step-5-internet-traffic) and [Step 9](../../books/guides/global-secure-access-implementation.md#step-9-tls-inspection). About 50 minutes, plus Lab 2.*

**Watch first:** slides 12 and 14 of the guide's narrated deck (Internet Access through security profiles; tenant restrictions and TLS inspection), in its [narration script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-global-secure-access/Guide_Global_Secure_Access_Narration_Script.md).

## Introduction (3 minutes) {#gsa-m5-intro}

Internet Access is the identity-aware web gateway for remote users: Conditional Access decides which security profile a user gets, and the profile decides what the user can reach. It comes late in the run order because it is separately licensed and because an agency may keep its current gateway. TLS inspection comes last of all: it is the step most likely to break applications and to read content the agency shouldn't, so it starts only after filtering works on server names alone, from a dedicated CA, within a scope the privacy officer approved.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs, by step](../../books/guides/global-secure-access-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| SC-7, SC-7(5), SI-3, SI-4: web access filtered by identity-aware policy, bypasses governed | KSI-CNA-ULN, KSI-CNA-RNT, KSI-CNA-MAT | Filtering policy, profile and Conditional Access exports; the blocked-category test; the bypass register |
| SC-8, SC-12, SC-17, SI-4: encrypted web traffic inspected within an approved privacy scope, with a governed CA | KSI-SVC-SIN, KSI-SVC-ASM, KSI-CNA-MAT | The certificate and chain, the trust profile's status, the policy export, the issuer check, the failure rate, the privacy approval and user notice |

The steps support these controls and provide evidence for them; the assessor decides whether each is satisfied. The program's mapping also lines Step 5 up with TIC 3.0 Remote User Pattern 3 and Step 9 with TIC 3.0's Web PEP capabilities.

## Learning objectives (1 minute) {#gsa-m5-objectives}

After this module, you'll be able to:

- build a filtering policy, a security profile, the link between them and the Conditional Access policy that assigns it;
- explain why both the Microsoft and internet profiles are enabled, and what Learn's limits leave out;
- govern every bypass and allow-list entry with an owner, a reason and an expiry;
- choose the CA for TLS inspection and deploy trust before activation;
- set the privacy boundary, handle pinned applications, and read the TLS outcomes against the 1% line.

## Prerequisites (1 minute) {#gsa-m5-prerequisites}

- [Module 2](02-the-client-and-microsoft-traffic.md).
- [Book 09, Chapter 05: Internet Access policy](../../books/b09-network/05-sd-wan-sase-and-governed-transport.md#internet-access-policy). About 10 minutes.
- [Book 07, Chapter 04: The target PKI](../../books/b07-pki/04-the-target-pki.md), for the dedicated issuing CA. Skim it.

## Unit 1: Security profiles and their limits (10 minutes) {#gsa-m5-profiles}

Read the guide's [Step 5](../../books/guides/global-secure-access-implementation.md#step-5-internet-traffic), 5.1 to 5.5. Security profiles group web content filtering, threat intelligence, TLS inspection and file policies; Conditional Access assigns a profile to users, and the baseline profile applies to all traffic, last. The internet profile doesn't include the Microsoft traffic profile's destinations, so both are enabled for full coverage. The category list is the agency's acceptable-use policy; `ArtificialIntelligence` is Learn's example. Threat intelligence filtering goes in the baseline profile, so it covers everyone in the internet profile. Learn's limits: 256 security profiles, 1,000 policies, 1,000 rules and 8,000 destinations per tenant; HTTP and HTTPS on ports 80 and 443 only; no IPv6 and no UDP.

The pages the guide read don't say whether a report-only Conditional Access policy applies a security profile. So the pilot is a group-scoped policy set to **On** for the pilot only, with an **Allow** policy with logging for categories under review.

## Unit 2: QUIC and bypasses (6 minutes) {#gsa-m5-quic-bypass}

Read the guide's Step 5, 5.6 and 5.7. Internet Access doesn't forward QUIC end to end. Learn's newer guidance keeps QUIC on and blocks UDP 443 with the cloud firewall, which is preview; its TLS inspection page blocks outbound UDP 443 with Windows Firewall. Until the cloud firewall for clients is generally available, the guide uses the generally available path: an Intune-delivered firewall rule equivalent to Learn's command, piloted first. Every custom bypass and allow-list entry is a recorded exception with an owner approval, a reason and an expiry, as Learn's change guidance asks. Custom bypass doesn't work on remote networks; those bypasses are made on the branch equipment.

## Unit 3: TLS inspection, last (12 minutes) {#gsa-m5-tls}

Read the guide's [Step 9](../../books/guides/global-secure-access-implementation.md#step-9-tls-inspection). TLS inspection decrypts at the service edge so full URLs, files and content can be filtered, then re-encrypts; it is the prerequisite for URL rules, file and content policies and AI prompt inspection. Learn offers a Microsoft-managed certificate or the agency's own; with the agency's own, the agency signs an intermediate CA from which the service issues short-lived leaf certificates, valid at least six months, one active at a time. Learn's tutorial suggests a dedicated CA, not the production PKI; the guide issues it from a dedicated issuing CA under the agency's root, never from the CA that issues authentication certificates.

Trust comes before activation, because an expired inspection certificate disables all TLS inspection across the tenant; the guide renews at least 90 days ahead. Learn auto-creates a system bypass rule and an editable recommended bypass for the Education, Finance, Government, and Health & Medicine categories; the guide keeps them, adds what the privacy officer names, and tells users before inspection starts. Pinned applications fail under inspection and get a custom bypass, without duplicating the system list. Microsoft's recommendation treats a failure rate above 1% as a systemic problem.

**Where agencies are.** Internet Access and TLS inspection need an Internet Access or Microsoft Entra Suite license. Both are generally available and available in GCC by Learn's product-wide statement, and not yet supported in GCC High or DoD; the cloud firewall for clients and the Explicit Forward Proxy are preview, with GCC availability *not yet specified* ([availability](../../books/guides/global-secure-access-implementation.md#availability)). An agency that keeps its current gateway records `retain-current` or `coexist` for the internet function in Module 1's decision record.

## Exercise: Lab 2, a test tenant {#gsa-m5-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

In PowerShell 7:

```powershell
# Step 1: Find and enable the Internet Access profile
Set-Location <lab-folder>
Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All","Policy.ReadWrite.ConditionalAccess","Policy.Read.All","Application.ReadWrite.All"
$p = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles?`$filter=trafficForwardingType eq 'internet'"
$p.value | Select-Object id, name, state
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<profile-id>" -Body '{"state":"enabled"}' -ContentType "application/json"

# Step 2: Create the filtering policy
$policy = @'
{
  "name": "NET-WCF-Block-HighRisk",
  "policyRules": [
    { "@odata.type": "#microsoft.graph.networkaccess.webCategoryFilteringRule", "name": "Categories", "ruleType": "webCategory",
      "destinations": [ { "@odata.type": "#microsoft.graph.networkaccess.webCategory", "name": "ArtificialIntelligence" } ] }
  ],
  "action": "block"
}
'@
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/networkaccess/filteringPolicies" -Body $policy -ContentType "application/json"

# Step 3: Create the security profile and link the policy
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/networkaccess/filteringProfiles" -ContentType "application/json" `
  -Body '{"name":"SP-Pilot","state":"enabled","priority":100,"policies":[]}'
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/networkaccess/filteringProfiles/<security-profile-id>/policies" -ContentType "application/json" `
  -Body '{"priority":100,"state":"enabled","@odata.type":"#microsoft.graph.networkaccess.filteringPolicyLink","loggingState":"enabled","policy":{"id":"<filtering-policy-id>","@odata.type":"#microsoft.graph.networkaccess.filteringPolicy"}}'

# Step 4: Assign it to the pilot with Conditional Access
$ca = @'
{
  "displayName": "NET-IA-SecurityProfile-Pilot",
  "state": "enabled",
  "conditions": {
    "applications": { "includeApplications": [ "5dc48733-b5df-475c-a49b-fa307ef00853" ] },
    "users": { "includeGroups": [ "<pilot-group-id>" ], "excludeGroups": [ "<emergency-group-id>" ] }
  },
  "sessionControls": { "globalSecureAccessFilteringProfile": { "profileId": "<security-profile-id>", "isEnabled": true } }
}
'@
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/identity/conditionalAccess/policies" -Body $ca -ContentType "application/json"
```

In the Log Analytics workspace's Logs:

```kusto
// Step 5: Test the block
NetworkAccessTraffic
| where TimeGenerated > ago(24h) and TrafficType == "internet"
| summarize Allowed = countif(Action == "Allowed"), Denied = countif(Action == "Denied") by UserPrincipalName
```

In PowerShell 7:

```powershell
# Step 6: Block QUIC on the test device
New-NetFirewallRule -DisplayName "Block QUIC" -Direction Outbound -Action Block -Protocol UDP -RemotePort 443
Get-NetFirewallRule -DisplayName "Block QUIC" | Select-Object DisplayName, Enabled, Direction, Action
```

In the Log Analytics workspace's Logs:

```kusto
// Step 8: Read the TLS outcomes
let T = NetworkAccessTraffic
    | where TimeGenerated > ago(24h) and TrafficType == "internet" and isnotempty(TlsStatus)
    | summarize Count = count() by TlsStatus, TlsAction;
let Total = toscalar(T | summarize sum(Count));
T | extend Share = round(100.0 * Count / Total, 2)
```

In PowerShell 7:

```powershell
# Step 9: Export what you built
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/filteringProfiles?`$expand=policies" | ConvertTo-Json -Depth 20 | Out-File .\gsa-05-filtering-profiles.json
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/filteringPolicies" | ConvertTo-Json -Depth 20 | Out-File .\gsa-05-filtering-policies.json
```

:::

<!-- labs:end -->

You enable the internet profile for the pilot, build a security profile that blocks one category, assign it to the pilot with Conditional Access, test the block, add the QUIC rule on the test device, and read the TLS inspection outcomes once a pilot TLS policy exists.

- **You need:** Module 2's lab done; an Internet Access test license; a Conditional Access Administrator and a Global Secure Access Administrator, activated through PIM; for the TLS steps, a TLS inspection certificate created and enabled and trusted on the test device, and a pilot TLS inspection policy linked to the pilot security profile, as the guide's [Step 9](../../books/guides/global-secure-access-implementation.md#step-9-tls-inspection), 9.1 to 9.4, describes, with the privacy officer's approval of the test scope.
- **You'll replace:** `<lab-folder>`, `<pilot-group-id>`, `<emergency-group-id>`, `<profile-id>` (the internet profile, from step 1), `<filtering-policy-id>` (from step 2) and `<security-profile-id>` (from step 3).

1. **Find and enable the Internet Access profile** (the guide's Step 5.1), then assign the pilot group to it in **Global Secure Access** > **Connect** > **Traffic forwarding**, as Module 2 did for the Microsoft traffic profile:

    ```powershell
    Set-Location <lab-folder>
    Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All","Policy.ReadWrite.ConditionalAccess","Policy.Read.All","Application.ReadWrite.All"
    $p = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles?`$filter=trafficForwardingType eq 'internet'"
    $p.value | Select-Object id, name, state
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<profile-id>" -Body '{"state":"enabled"}' -ContentType "application/json"
    ```

2. **Create the filtering policy** (the guide's Step 5.2, with Learn's example category):

    ```powershell
    $policy = @'
    {
      "name": "NET-WCF-Block-HighRisk",
      "policyRules": [
        { "@odata.type": "#microsoft.graph.networkaccess.webCategoryFilteringRule", "name": "Categories", "ruleType": "webCategory",
          "destinations": [ { "@odata.type": "#microsoft.graph.networkaccess.webCategory", "name": "ArtificialIntelligence" } ] }
      ],
      "action": "block"
    }
    '@
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/networkaccess/filteringPolicies" -Body $policy -ContentType "application/json"
    ```

    The response's `id` is `<filtering-policy-id>`.

3. **Create the security profile and link the policy** (the guide's Step 5.3):

    ```powershell
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/networkaccess/filteringProfiles" -ContentType "application/json" `
      -Body '{"name":"SP-Pilot","state":"enabled","priority":100,"policies":[]}'
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/networkaccess/filteringProfiles/<security-profile-id>/policies" -ContentType "application/json" `
      -Body '{"priority":100,"state":"enabled","@odata.type":"#microsoft.graph.networkaccess.filteringPolicyLink","loggingState":"enabled","policy":{"id":"<filtering-policy-id>","@odata.type":"#microsoft.graph.networkaccess.filteringPolicy"}}'
    ```

    The first response's `id` is `<security-profile-id>`.

4. **Assign it to the pilot with Conditional Access** (the guide's Step 5.4):

    ```powershell
    $ca = @'
    {
      "displayName": "NET-IA-SecurityProfile-Pilot",
      "state": "enabled",
      "conditions": {
        "applications": { "includeApplications": [ "5dc48733-b5df-475c-a49b-fa307ef00853" ] },
        "users": { "includeGroups": [ "<pilot-group-id>" ], "excludeGroups": [ "<emergency-group-id>" ] }
      },
      "sessionControls": { "globalSecureAccessFilteringProfile": { "profileId": "<security-profile-id>", "isEnabled": true } }
    }
    '@
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/identity/conditionalAccess/policies" -Body $ca -ContentType "application/json"
    ```

5. **Test the block** (the guide's Step 5 Validate): on the pilot device, as a pilot user, browse to a site in the `ArtificialIntelligence` category. Expect the block page. Then, in the workspace's **Logs**:

    ```kusto
    NetworkAccessTraffic
    | where TimeGenerated > ago(24h) and TrafficType == "internet"
    | summarize Allowed = countif(Action == "Allowed"), Denied = countif(Action == "Denied") by UserPrincipalName
    ```

    The pilot user's row shows a `Denied` count for the test.

6. **Block QUIC on the test device** (the guide's Step 5.6, the generally available path), in PowerShell as an administrator on the pilot device:

    ```powershell
    New-NetFirewallRule -DisplayName "Block QUIC" -Direction Outbound -Action Block -Protocol UDP -RemotePort 443
    Get-NetFirewallRule -DisplayName "Block QUIC" | Select-Object DisplayName, Enabled, Direction, Action
    ```

    In production, the same rule goes out as an Intune-delivered firewall rule, piloted first.

7. **Check the inspection issuer** (the guide's Step 9 Validate), once the pilot TLS policy is linked to `SP-Pilot`: on the pilot device, browse to an inspected site and open the browser's certificate viewer. The issuer is **Microsoft Global Secure Access Intermediate**, or your test intermediate if you used your own certificate.

8. **Read the TLS outcomes** in the workspace's **Logs** (the guide's Step 9 query):

    ```kusto
    let T = NetworkAccessTraffic
        | where TimeGenerated > ago(24h) and TrafficType == "internet" and isnotempty(TlsStatus)
        | summarize Count = count() by TlsStatus, TlsAction;
    let Total = toscalar(T | summarize sum(Count));
    T | extend Share = round(100.0 * Count / Total, 2)
    ```

    `TlsAction` reads `Bypassed` or `Intercepted`. Learn's pages give `TlsStatus` values differently in two places, so read the values your workspace actually holds before writing an alert; the failure share should stay under 1%.

9. **Export what you built:**

    ```powershell
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/filteringProfiles?`$expand=policies" | ConvertTo-Json -Depth 20 | Out-File .\gsa-05-filtering-profiles.json
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/filteringPolicies" | ConvertTo-Json -Depth 20 | Out-File .\gsa-05-filtering-policies.json
    ```

    Keep everything in place: Module 6 rolls it back in the guide's order, and removes the TLS policy in Learn's order (the link from the security profile, then the policy, then the certificate).

## Knowledge check (5 minutes) {#gsa-m5-check}

1. Why does the guide enable both the Microsoft traffic profile and the internet profile?
    a. The internet profile doesn't include the Microsoft traffic profile's destinations.
    b. Learn requires both before either works.
    c. The internet profile carries only UDP.

2. Where does the guide put threat intelligence filtering?
    a. In the pilot security profile only.
    b. In the baseline profile, so it covers everyone in the internet profile.
    c. Nowhere; it is a preview feature.

3. What does every custom bypass and allow-list entry carry?
    a. Nothing; bypasses are temporary by design.
    b. An owner approval, a reason and an expiry, in the exception register.
    c. A TLS inspection rule.

4. Which CA issues the TLS inspection intermediate, in the program's position?
    a. The CA that issues authentication certificates, to reuse its trust.
    b. A dedicated issuing CA under the agency's root.
    c. Any public CA.

5. What happens when the inspection certificate expires?
    a. Only new sessions are inspected with a fallback certificate.
    b. All TLS inspection across the tenant stops, so the guide renews at least 90 days ahead and deploys trust before activation.
    c. Traffic is blocked until renewal.

::: {.callout-tip collapse="true"}
## Check your answers
1. **a.** See Unit 1 and the guide's [Step 5](../../books/guides/global-secure-access-implementation.md#step-5-internet-traffic), 5.1.
2. **b.** See Unit 1 and the guide's Step 5, 5.5.
3. **b.** See Unit 2 and the guide's Step 5, 5.7.
4. **b.** See Unit 3 and the guide's [Step 9](../../books/guides/global-secure-access-implementation.md#step-9-tls-inspection), 9.1.
5. **b.** See Unit 3 and the guide's Step 9, 9.3 and its How-section.
:::

## Summary (2 minutes) {#gsa-m5-summary}

You enabled the internet profile for the pilot, built a security profile with one blocked category and assigned it with Conditional Access, proved the block, added the QUIC rule, checked the inspection issuer and read the TLS outcomes. **Evidence an ISSO keeps from this module:** `gsa-05-filtering-profiles.json`, `gsa-05-filtering-policies.json` and the Conditional Access export; the blocked-category test and the traffic query; the bypass register; the certificate and chain, the trust profile's deployment status, the issuer check and the TLS failure share; the privacy approval and the user notice.

::: {.callout-tip}
## Continue the path
[← Previous: Module 4](04-private-apps-and-admin-paths.md) · [Learning path](index.md) · [Next: Module 6, Rings, rollback and the evidence package →](06-rings-rollback-and-the-evidence-package.md)
:::
