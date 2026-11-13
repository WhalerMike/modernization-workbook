---
title: "Module 4: Private applications and administrative paths"
description: "Guide Steps 6 and 10: replacing the VPN's address pool with one path per application. Quick Access as the bridge and application discovery; per-app Private Access applications from Learn's Graph tutorial, bound to a connector group, with only the segments they use, a group assignment and Conditional Access in report-only first; connector groups for on-premises networks and for AWS, Google Cloud and Oracle Cloud Infrastructure; then administrative RDP behind the phishing-resistant authentication strength, and the Private Access sensor on domain controllers, application SPNs first. Lab 2 publishes one application and one administrative host in a test tenant and tests the paths. About 50 minutes, plus Lab 2, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 09"
series-order: 4
review-status: pending
last-reviewed: 2026-11-13
---
# Module 4: Private applications and administrative paths {.unnumbered}

*Part of the [Global Secure Access learning path](index.md). Guide [Step 6](../../books/guides/global-secure-access-implementation.md#step-6-private-applications) and [Step 10](../../books/guides/global-secure-access-implementation.md#step-10-privileged-protocols). About 50 minutes, plus Lab 2.*

**Watch first:** slide 13 of the guide's narrated deck (per-app private access and admin paths), in its [narration script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-global-secure-access/Guide_Global_Secure_Access_Narration_Script.md).

## Introduction (3 minutes) {#gsa-m4-intro}

A VPN gives a user an address on the network and lets the network decide the rest. Private Access gives each application its own path: its own hosts and ports, its own assigned group, its own Conditional Access. A compromised user or device can reach what it was assigned and nothing else. In this module you publish an application the way Learn's Graph tutorial does, then do the same for the paths an attacker wants most, administrative RDP and domain controllers.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs, by step](../../books/guides/global-secure-access-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| AC-3, AC-6, AC-17, AC-17(3): each application reachable only by its assigned group, on its ports, under Conditional Access | KSI-IAM-ELP, KSI-CNA-ULN, KSI-CNA-MAT | App, segment, assignment and policy exports; the reachable and unreachable port tests; the Quick Access residual list |
| IA-2(1), IA-2(2), AC-6(9), AC-17: administrative paths require phishing-resistant authentication and a compliant device | KSI-IAM-APM, KSI-IAM-ELP, KSI-MLA-LET | App and policy exports, the sensor mode, the `klist` test record, the break-glass rehearsal |

The steps support these controls and provide evidence for them; the assessor decides whether each is satisfied. The program's mapping also lines Step 6 up with OMB M-22-09's application access without a VPN and TIC 3.0 Remote User Pattern 1, and Step 10 with M-22-09's phishing-resistant MFA.

## Learning objectives (1 minute) {#gsa-m4-objectives}

After this module, you'll be able to:

- explain why Quick Access is a bridge that should shrink to nothing;
- create a Private Access application, bind it to a connector group, add only its segments, assign a group and put Conditional Access on it;
- say where connector groups go, including for applications in AWS, Google Cloud and Oracle Cloud Infrastructure;
- publish administrative hosts as their own applications behind the phishing-resistant authentication strength;
- describe the domain controller sensor's audit-first order and its break-glass mode, and run Learn's `klist` test.

## Prerequisites (1 minute) {#gsa-m4-prerequisites}

- [Module 2](02-the-client-and-microsoft-traffic.md). Module 3 isn't needed here: the compliant network check doesn't apply to Private Access apps.
- [Book 09, Chapter 05: Private Access as the VPN and DirectAccess replacement](../../books/b09-network/05-sd-wan-sase-and-governed-transport.md#private-access-as-the-vpn-and-directaccess-replacement), for Quick Access, connectors and private DNS. About 15 minutes.

## Unit 1: Quick Access, per-app access and connectors (10 minutes) {#gsa-m4-per-app}

Read the guide's [Step 6](../../books/guides/global-secure-access-implementation.md#step-6-private-applications). Book 09 holds the design: Quick Access as the bridge, application discovery to find what is used, then per-app applications with their own assignments and policy. Learn's Graph tutorial is the build: instantiate the custom application template, mark it a Private Access app, bind it to a connector group, add only the segments it uses (one host, its ports, its protocol), assign a group with the app's `User` role (not individuals; nested groups aren't supported), and put Conditional Access on it in report-only first. Segments may not overlap between Private Access apps, except that a per-app segment overrides an overlapping Quick Access segment, and clients take up to 15 minutes to pick up a change. Microsoft advises against an MFA sign-in frequency on Quick Access, because DNS queries trigger prompts.

Connectors are outbound only, run on the program's server standard (Windows Server 2019 or later), and come at least two to a group. **Where agencies are, across clouds.** Learn describes Private Access as reaching private apps across hybrid and multicloud environments, through connectors on Windows Server hosts with line of sight to the application, so an application in AWS, Google Cloud or Oracle Cloud Infrastructure gets a connector group in that cloud's network, as an on-premises one does. Learn has no connector procedure specific to any of the three (*not yet specified*), and the guide doesn't compare those providers' own access services ([comparison](../../books/guides/global-secure-access-implementation.md#comparison)).

## Unit 2: Administrative paths (8 minutes) {#gsa-m4-admin}

Read the guide's [Step 10](../../books/guides/global-secure-access-implementation.md#step-10-privileged-protocols), 10.1 and 10.2. Administrative hosts are published as their own applications, separate from user applications: one app per tier or host group, RDP on `3389`, assigned only to the privileged group whose PIM activation grants it. Their policy requires the built-in phishing-resistant authentication strength, ID `00000000-0000-0000-0000-000000000004`, and a compliant device, in report-only first. Enforcement ends with direct RDP removed from the VPN and from the server firewall except from connector IPs.

## Unit 3: Domain controllers, for as long as they remain (8 minutes) {#gsa-m4-dc}

Read the guide's Step 10, 10.3 and its How-section. The program retires its domain controllers; until then they are Tier 0. Learn's procedure publishes the DCs on TCP 88, names the SPNs to protect, opens inbound TCP 1337, installs one sensor per DC silently and registers it with a token. The sensor installs in **Audit** mode. Learn's advice is to test with application SPNs first and protect the DC's own SPN only later, to avoid admin lockout, and to assess NTLM use before restricting it. The registration token is a credential: acquire it on a privileged access workstation, use it once, clear the session. The rollback is the sensor's break-glass mode, from the admin center or `TmpBreakglass` set to `1` and the sensor restarted.

## Exercise: Lab 2, a test tenant {#gsa-m4-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

In PowerShell 7:

```powershell
# Step 1: List the connectors and connector groups
Set-Location <lab-folder>
Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All","Policy.ReadWrite.ConditionalAccess","Policy.Read.All","Application.ReadWrite.All"
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationProxy/connectorGroups" | ConvertTo-Json -Depth 10
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationProxy/connectors" | ConvertTo-Json -Depth 10

# Step 2: Create the application and mark it a Private Access app
$app = Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/applicationTemplates/8adf8e6e-67b2-4cf2-a259-e3dc5476c621/instantiate" `
  -Body '{"displayName":"PA-<app-name>"}' -ContentType "application/json"
$app.application.id; $app.servicePrincipal.id; $app.application.appId
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/applications/<app-object-id>" -ContentType "application/json" `
  -Body '{"onPremisesPublishing":{"applicationType":"nonwebapp","isAccessibleViaZTNAClient":true}}'

# Step 3: Bind it to the connector group and add its segment
Invoke-MgGraphRequest -Method PUT -Uri "https://graph.microsoft.com/beta/applications/<app-object-id>/connectorGroup/`$ref" -ContentType "application/json" `
  -Body '{"@odata.id":"https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationproxy/connectorGroups/<connector-group-id>"}'
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/applications/<app-object-id>/onPremisesPublishing/segmentsConfiguration/microsoft.graph.ipSegmentConfiguration/applicationSegments" `
  -ContentType "application/json" -Body '{"destinationHost":"<app-fqdn>","destinationType":"fqdn","port":0,"ports":["<app-ports>"],"protocol":"tcp"}'

# Step 4: Assign the pilot group
$sp = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/<sp-object-id>?`$select=appRoles"
$sp.appRoles | Select-Object id, value, displayName
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/<sp-object-id>/appRoleAssignments" -ContentType "application/json" `
  -Body '{"principalId":"<pilot-group-id>","principalType":"Group","appRoleId":"<user-role-id>","resourceId":"<sp-object-id>"}'

# Step 5: Put Conditional Access on it, in report-only
$ca = @'
{
  "displayName": "NET-PA-<app-name>-Device-MFA",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "applications": { "includeApplications": [ "<app-id>" ] },
    "users": { "includeGroups": [ "<pilot-group-id>" ], "excludeGroups": [ "<emergency-group-id>" ] }
  },
  "grantControls": { "operator": "AND", "builtInControls": [ "mfa", "compliantDevice" ] }
}
'@
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" -Body $ca -ContentType "application/json"

# Step 6: Publish the administrative host the same way
$adm = Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/applicationTemplates/8adf8e6e-67b2-4cf2-a259-e3dc5476c621/instantiate" `
  -Body '{"displayName":"PA-AdminRDP"}' -ContentType "application/json"
$adm.application.id; $adm.servicePrincipal.id; $adm.application.appId
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/applications/<admin-app-object-id>" -ContentType "application/json" `
  -Body '{"onPremisesPublishing":{"applicationType":"nonwebapp","isAccessibleViaZTNAClient":true}}'
Invoke-MgGraphRequest -Method PUT -Uri "https://graph.microsoft.com/beta/applications/<admin-app-object-id>/connectorGroup/`$ref" -ContentType "application/json" `
  -Body '{"@odata.id":"https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationproxy/connectorGroups/<connector-group-id>"}'
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/applications/<admin-app-object-id>/onPremisesPublishing/segmentsConfiguration/microsoft.graph.ipSegmentConfiguration/applicationSegments" `
  -ContentType "application/json" -Body '{"destinationHost":"<admin-host-fqdn>","destinationType":"fqdn","port":0,"ports":["3389-3389"],"protocol":"tcp"}'
$asp = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/<admin-sp-object-id>?`$select=appRoles"
$asp.appRoles | Select-Object id, value, displayName
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/<admin-sp-object-id>/appRoleAssignments" -ContentType "application/json" `
  -Body '{"principalId":"<admin-group-id>","principalType":"Group","appRoleId":"<admin-user-role-id>","resourceId":"<admin-sp-object-id>"}'

# Step 7: Require phishing-resistant authentication, in report-only
$ca = @'
{
  "displayName": "NET-PA-AdminRDP-PhishingResistant",
  "state": "enabledForReportingButNotEnforced",
  "conditions": {
    "applications": { "includeApplications": [ "<admin-app-id>" ] },
    "users": { "includeGroups": [ "<admin-group-id>" ], "excludeGroups": [ "<emergency-group-id>" ] }
  },
  "grantControls": { "operator": "AND", "builtInControls": [ "compliantDevice" ],
                     "authenticationStrength": { "id": "00000000-0000-0000-0000-000000000004" } }
}
'@
Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" -Body $ca -ContentType "application/json"
$p = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles?`$filter=trafficForwardingType eq 'private'"
$p.value | Select-Object id, name, state
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<profile-id>" -Body '{"state":"enabled"}' -ContentType "application/json"

# Step 8: Test the application's path
Test-NetConnection -ComputerName <app-fqdn> -Port <app-port>
Test-NetConnection -ComputerName <app-fqdn> -Port <other-port>
```

In the Log Analytics workspace's Logs:

```kusto
// Step 9: Read the private sessions
NetworkAccessTraffic
| where TimeGenerated > ago(24h) and TrafficType == "private"
| summarize Sessions = count() by DestinationFqdn, UserPrincipalName

// Step 11: Read the report-only results for both policies
SigninLogs
| where TimeGenerated > ago(7d)
| mv-expand CAP = ConditionalAccessPolicies
| where tostring(CAP.displayName) startswith "NET-PA-"
| summarize count() by Policy = tostring(CAP.displayName), Result = tostring(CAP.result)
```

In Command Prompt:

```cmd
REM Step 12: Optional: Learn's sensor test
klist purge
klist get cifs/<server-fqdn>
```

:::

<!-- labs:end -->

You publish one test application and one administrative host through Private Access, each with its own segments, group and report-only policy, enable the Private Access profile for the pilot, and test the paths. An optional last step runs Learn's sensor test where a test domain has the sensor.

- **You need:** Module 2's lab done; a Private Access test license; a test connector group with two connectors on Windows Server 2019 or later, installed as [Book 09, Chapter 05](../../books/b09-network/05-sd-wan-sase-and-governed-transport.md#private-access-as-the-vpn-and-directaccess-replacement) describes; a test application server and a test administrative host reachable from the connectors; a privileged test group for the administrative host; phishing-resistant methods registered for its members; an Application Administrator and a Conditional Access Administrator, activated through PIM.
- **You'll replace:** `<lab-folder>`, `<pilot-group-id>`, `<emergency-group-id>`, `<connector-group-id>` (from step 1), `<app-name>`, `<app-fqdn>` and `<app-ports>` (the test application, for example `app01.contoso.example` and `443-443`), `<app-port>` (its port, for example `443`), `<other-port>` (a port the segment doesn't include, for example `445`), `<admin-host-fqdn>`, `<admin-group-id>` (the privileged test group), `<profile-id>` (the Private Access profile, from step 7), `<server-fqdn>` (for step 12), and the IDs each step prints: `<app-object-id>`, `<sp-object-id>`, `<app-id>` and `<user-role-id>` for the application; `<admin-app-object-id>`, `<admin-sp-object-id>`, `<admin-app-id>` and `<admin-user-role-id>` for the administrative host.

1. **List the connectors and connector groups:**

    ```powershell
    Set-Location <lab-folder>
    Connect-MgGraph -Environment Global -Scopes "NetworkAccess.ReadWrite.All","Policy.ReadWrite.ConditionalAccess","Policy.Read.All","Application.ReadWrite.All"
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationProxy/connectorGroups" | ConvertTo-Json -Depth 10
    Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationProxy/connectors" | ConvertTo-Json -Depth 10
    ```

    The test group's `id` is `<connector-group-id>`; the guide's connector resilience metric wants at least two active connectors in it.

2. **Create the application and mark it a Private Access app** (the guide's Step 6.1):

    ```powershell
    $app = Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/applicationTemplates/8adf8e6e-67b2-4cf2-a259-e3dc5476c621/instantiate" `
      -Body '{"displayName":"PA-<app-name>"}' -ContentType "application/json"
    $app.application.id; $app.servicePrincipal.id; $app.application.appId
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/applications/<app-object-id>" -ContentType "application/json" `
      -Body '{"onPremisesPublishing":{"applicationType":"nonwebapp","isAccessibleViaZTNAClient":true}}'
    ```

    The three IDs printed are `<app-object-id>`, `<sp-object-id>` and `<app-id>`.

3. **Bind it to the connector group and add its segment** (the guide's Steps 6.2 and 6.3):

    ```powershell
    Invoke-MgGraphRequest -Method PUT -Uri "https://graph.microsoft.com/beta/applications/<app-object-id>/connectorGroup/`$ref" -ContentType "application/json" `
      -Body '{"@odata.id":"https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationproxy/connectorGroups/<connector-group-id>"}'
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/applications/<app-object-id>/onPremisesPublishing/segmentsConfiguration/microsoft.graph.ipSegmentConfiguration/applicationSegments" `
      -ContentType "application/json" -Body '{"destinationHost":"<app-fqdn>","destinationType":"fqdn","port":0,"ports":["<app-ports>"],"protocol":"tcp"}'
    ```

4. **Assign the pilot group** with the app's `User` role (the guide's Step 6.4):

    ```powershell
    $sp = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/<sp-object-id>?`$select=appRoles"
    $sp.appRoles | Select-Object id, value, displayName
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/<sp-object-id>/appRoleAssignments" -ContentType "application/json" `
      -Body '{"principalId":"<pilot-group-id>","principalType":"Group","appRoleId":"<user-role-id>","resourceId":"<sp-object-id>"}'
    ```

5. **Put Conditional Access on it, in report-only** (the guide's Step 6.5):

    ```powershell
    $ca = @'
    {
      "displayName": "NET-PA-<app-name>-Device-MFA",
      "state": "enabledForReportingButNotEnforced",
      "conditions": {
        "applications": { "includeApplications": [ "<app-id>" ] },
        "users": { "includeGroups": [ "<pilot-group-id>" ], "excludeGroups": [ "<emergency-group-id>" ] }
      },
      "grantControls": { "operator": "AND", "builtInControls": [ "mfa", "compliantDevice" ] }
    }
    '@
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" -Body $ca -ContentType "application/json"
    ```

6. **Publish the administrative host the same way** (the guide's Step 10.1: Steps 6.1 to 6.4 with the host and `3389-3389`, assigned only to the privileged group):

    ```powershell
    $adm = Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/applicationTemplates/8adf8e6e-67b2-4cf2-a259-e3dc5476c621/instantiate" `
      -Body '{"displayName":"PA-AdminRDP"}' -ContentType "application/json"
    $adm.application.id; $adm.servicePrincipal.id; $adm.application.appId
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/applications/<admin-app-object-id>" -ContentType "application/json" `
      -Body '{"onPremisesPublishing":{"applicationType":"nonwebapp","isAccessibleViaZTNAClient":true}}'
    Invoke-MgGraphRequest -Method PUT -Uri "https://graph.microsoft.com/beta/applications/<admin-app-object-id>/connectorGroup/`$ref" -ContentType "application/json" `
      -Body '{"@odata.id":"https://graph.microsoft.com/beta/onPremisesPublishingProfiles/applicationproxy/connectorGroups/<connector-group-id>"}'
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/beta/applications/<admin-app-object-id>/onPremisesPublishing/segmentsConfiguration/microsoft.graph.ipSegmentConfiguration/applicationSegments" `
      -ContentType "application/json" -Body '{"destinationHost":"<admin-host-fqdn>","destinationType":"fqdn","port":0,"ports":["3389-3389"],"protocol":"tcp"}'
    $asp = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/<admin-sp-object-id>?`$select=appRoles"
    $asp.appRoles | Select-Object id, value, displayName
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/servicePrincipals/<admin-sp-object-id>/appRoleAssignments" -ContentType "application/json" `
      -Body '{"principalId":"<admin-group-id>","principalType":"Group","appRoleId":"<admin-user-role-id>","resourceId":"<admin-sp-object-id>"}'
    ```

7. **Require phishing-resistant authentication, in report-only** (the guide's Step 10.2, scoped to the privileged group), then **enable the Private Access profile** (the guide's Step 6.6):

    ```powershell
    $ca = @'
    {
      "displayName": "NET-PA-AdminRDP-PhishingResistant",
      "state": "enabledForReportingButNotEnforced",
      "conditions": {
        "applications": { "includeApplications": [ "<admin-app-id>" ] },
        "users": { "includeGroups": [ "<admin-group-id>" ], "excludeGroups": [ "<emergency-group-id>" ] }
      },
      "grantControls": { "operator": "AND", "builtInControls": [ "compliantDevice" ],
                         "authenticationStrength": { "id": "00000000-0000-0000-0000-000000000004" } }
    }
    '@
    Invoke-MgGraphRequest -Method POST -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" -Body $ca -ContentType "application/json"
    $p = Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles?`$filter=trafficForwardingType eq 'private'"
    $p.value | Select-Object id, name, state
    Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/forwardingProfiles/<profile-id>" -Body '{"state":"enabled"}' -ContentType "application/json"
    ```

    Then assign the pilot group and the privileged group to the Private Access profile in **Global Secure Access** > **Connect** > **Traffic forwarding**, as Module 2 did for the Microsoft traffic profile.

8. **Test the application's path** (the guide's Step 6 Validate), on the pilot device off the corporate network, as a pilot user, about 15 minutes after the last change:

    ```powershell
    Test-NetConnection -ComputerName <app-fqdn> -Port <app-port>
    Test-NetConnection -ComputerName <app-fqdn> -Port <other-port>
    ```

    The guide's expected result: the application's port is reachable (`TcpTestSucceeded : True`), and a port outside the segment fails (`TcpTestSucceeded : False`). In the client's **Advanced diagnostics** > **Forwarding profile**, use **Policy tester** with `<app-fqdn>` to see which rule handles it.

9. **Read the private sessions** in the workspace's **Logs**:

    ```kusto
    NetworkAccessTraffic
    | where TimeGenerated > ago(24h) and TrafficType == "private"
    | summarize Sessions = count() by DestinationFqdn, UserPrincipalName
    ```

10. **Test the administrative path** (the guide's Step 10 Validate): as a member of the privileged group, on the pilot device with the client on, connect with Remote Desktop to `<admin-host-fqdn>`. The sign-in log for **PA-AdminRDP** shows the policy's report-only result: the phishing-resistant authentication strength required, and whether a phishing-resistant method was used.

11. **Read the report-only results for both policies:**

    ```kusto
    SigninLogs
    | where TimeGenerated > ago(7d)
    | mv-expand CAP = ConditionalAccessPolicies
    | where tostring(CAP.displayName) startswith "NET-PA-"
    | summarize count() by Policy = tostring(CAP.displayName), Result = tostring(CAP.result)
    ```

    The guide reads them for five business days before setting a policy to **On**; in this lab, leave both in report-only. Module 6 rolls the applications and policies back.

12. **Optional: Learn's sensor test**, only where a test domain has a domain controller with the Private Access sensor installed and registered by the guide's [Step 10.3](../../books/guides/global-secure-access-implementation.md#step-10-privileged-protocols) and an application SPN protected. On a test member computer, in Command Prompt:

    ```cmd
    klist purge
    klist get cifs/<server-fqdn>
    ```

    Learn's expected results: with client and sensor off, the ticket is issued; with the sensor on and the client off, SMB to the share is blocked; with both on, the ticket is issued after the Conditional Access prompt. Run the commands in each of the three states and record each outcome.

## Knowledge check (5 minutes) {#gsa-m4-check}

1. What should happen to Quick Access as per-app applications are published?
    a. It stays as the default route for everything not yet published, indefinitely.
    b. It shrinks to nothing: application discovery shows what is used, and each piece moves into its own app.
    c. It is deleted on the first day.

2. Why does Microsoft advise against an MFA sign-in frequency on Quick Access?
    a. DNS queries trigger prompts.
    b. Quick Access doesn't support Conditional Access.
    c. MFA isn't available for Private Access.

3. An application runs in Oracle Cloud Infrastructure. How does the guide reach it?
    a. Through a connector group in that cloud's network, with line of sight to the application, as for an on-premises one.
    b. It can't; Private Access reaches only on-premises applications.
    c. Through Oracle's own access service, which the guide compares in full.

4. Which authentication strength does the administrative RDP policy require?
    a. Multifactor authentication.
    b. The built-in phishing-resistant strength, ID `00000000-0000-0000-0000-000000000004`, with a compliant device.
    c. Passwordless.

5. In what order does Learn protect SPNs with the domain controller sensor?
    a. The DC's own SPN first, because it matters most.
    b. Application SPNs first, the DC's own SPN later, to avoid admin lockout.
    c. All SPNs at once, in Enforce mode.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [Step 6](../../books/guides/global-secure-access-implementation.md#step-6-private-applications) Validate.
2. **a.** See Unit 1 and the guide's Step 6, 6.5.
3. **a.** See Unit 1 and the guide's [comparison](../../books/guides/global-secure-access-implementation.md#comparison).
4. **b.** See Unit 2 and the guide's [Step 10](../../books/guides/global-secure-access-implementation.md#step-10-privileged-protocols), 10.2.
5. **b.** See Unit 3 and the guide's Step 10, 10.3.
:::

## Summary (2 minutes) {#gsa-m4-summary}

You published one application and one administrative host as their own Private Access apps, each with only its segments, its own group and a report-only policy, tested the reachable and unreachable ports, and read the private sessions and the policies' results. **Evidence an ISSO keeps from this module:** the app, segment, assignment and policy exports; the port test record; the Policy tester result; the private session query; the administrative sign-in record; the `klist` test record where a sensor exists; and the Quick Access residual list.

::: {.callout-tip}
## Continue the path
[← Previous: Module 3](03-compliant-network-and-tenant-restrictions.md) · [Learning path](index.md) · [Next: Module 5, Internet Access and TLS inspection →](05-internet-access-and-tls-inspection.md)
:::
