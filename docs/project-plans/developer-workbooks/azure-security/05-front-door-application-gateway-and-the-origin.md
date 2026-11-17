---
title: "Chapter 05 — Front Door, Application Gateway and the Origin"
description: "The guide's Step 5 as code: each Front Door Standard or Premium origin's lock-down read from configuration, whether a Private Link connection Front Door uses, or an App Service access restriction that allows only the AzureFrontDoor.Backend service tag with this profile's X-Azure-FDID header and denies everything else; origin groups that mix private and public origins or have no second origin to fail over to; TLS 1.2 minimum on custom domains and a predefined policy on application gateways; and classic Front Door profiles before their retirement. Labs against a fictional estate and a test subscription, ending with the guide's refused direct request."
doc-type: workbook-chapter
audience: [Technical]
family: dw-azure-security
part: How
series-order: 5
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
last-reviewed: 2026-11-17
---
# Chapter 05 — Front Door, Application Gateway and the Origin

*The service tag tells an origin a request came from a Front Door. Only the header tells it the request came from yours.*

::: {.callout-note}
## In this chapter
The code behind the guide's [Step 5, Front Door and Application Gateway](../../../books/guides/azure-security-implementation.md#step-5-front-door-and-application-gateway). You start with Learn's two ways to lock an origin to the edge, Private Link or the service tag and the `X-Azure-FDID` header together, and its TLS and failover guidance. Then you read how the kit checks each origin's configuration, and where it stops and says "test this by hand". Lab 1 checks Contoso's five origins; Lab 2 checks a test profile and ends with the guide's own test: a direct request to the origin, refused.
:::

## Goal and audience

**Goal.** By the end of this chapter you can say, for every Front Door origin, whether its configuration lets only your Front Door reach it, which origin groups can't fail over or mix private and public origins, which custom domains or application gateways allow TLS below 1.2, and which classic profiles still need migrating; and you know which of those answers still need the guide's request test.

**Audience.** Application owners, who own origins and certificates, and platform owners, who own the profiles. Read [Chapter 04](04-the-web-application-firewall.md) first: the WAF only protects what can't be reached around it.

## Start with Microsoft Learn

### What Learn gives you

Learn's origin security page says to use the `AzureFrontDoor.Backend` service tag and the `X-Azure-FDID` header together, because the tag's addresses are shared by every Front Door customer.[^azs05-origin] For an App Service origin, Learn's tutorial does both in one access restriction, `az webapp config access-restriction add --service-tag AzureFrontDoor.Backend --http-header x-azure-fdid=<front-door-id>`.[^azs05-appsvc] Where the origin type supports it, Private Link is the alternative: Front Door Premium requests a private endpoint connection the origin owner approves, and an origin group shouldn't mix public and private origins.[^azs05-pl] The App Service configuration API returns the access restrictions as `ipSecurityRestrictions` (with `tag`, `ipAddress`, `headers` and `action`) and the default action for unmatched requests, and Learn says the `X-Azure-FDID` header matches exactly.[^azs05-webcfg] The Front Door origins API returns each origin's `azureOrigin` and `sharedPrivateLinkResource` with its status.[^azs05-origins] On TLS: 1.2 or 1.3 only, and a predefined policy such as `AppGwSslPolicy20220101` on Application Gateway.[^azs05-ingress][^azs05-agw-tls] Classic Front Door retires March 31, 2027.[^azs05-classic]

### What it leaves to you

| What Learn gives | Why it matters | What the kit adds (pinned by a test) |
|---|---|---|
| The command that adds the restriction | It doesn't read back what an origin has today, across every profile | Every Standard and Premium origin read through its profile's origin groups (`Edge (Step 5)` tests) |
| Tag and header together | A rule with the tag alone admits any customer's Front Door | AZS-EDGE-03 for a tag rule with no header |
| The header value is the profile's Front Door ID | A header copied from another profile admits that profile, not this one | The header compared with this profile's `frontDoorId` (AZS-EDGE-02, test "refuses another profile's X-Azure-FDID") |
| Restrictions, not their default | An Allow rule for any address, or a default action of Allow, opens the origin whatever the tag rule says | AZS-EDGE-02 for either |
| "Don't mix public and private origins in one group" | A sentence, not a check | AZS-EDGE-05 |
| The quickstart's two origins | One origin can't fail over | AZS-EDGE-08 for an origin group with fewer than two enabled origins |
| Origins of every type | Storage, API Management and other origins restrict access their own ways | AZS-EDGE-04: the kit says which origins it couldn't check, so a person tests them |

The kit reads configuration. The guide's Validate step is a request: a direct request to the origin refused, the same request through Front Door accepted.[^azs05-guide] Configuration that looks locked is the reason to run that test, not a substitute for it; the metric the kit computes is "locked by configuration", and the chapter says so.

## The code: the `edge` area

`Get-AzsEdgeCheck` reads the classic profiles, the Standard and Premium profiles with their origin groups, origins and custom domains, each App Service origin's site configuration, and the application gateways. For each origin it records one lock-down state:

| State | When | Locked |
|---|---|---|
| `PrivateLink` | `sharedPrivateLinkResource.status` is `Approved` | Yes |
| `ServiceTag+FDID` | An App Service origin with an Allow rule for the `AzureFrontDoor.Backend` service tag whose `x-azure-fdid` header is this profile's Front Door ID, no Allow rule for any address, and no default action of Allow | Yes |
| `TagOnly` | The tag rule has no header | No (AZS-EDGE-03) |
| `OtherFrontDoor` | The header isn't this profile's ID | No (AZS-EDGE-02) |
| `Open` | No tag rule, an Allow rule for any address, or a default of Allow | No (AZS-EDGE-02) |
| `Unchecked` | Any other origin type, or a hostname with no Azure resource | Not counted (AZS-EDGE-04) |

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| AZS-EDGE-01 | Finding | A classic Front Door profile | Learn[^azs05-classic] |
| AZS-EDGE-02 | Finding | An App Service origin reachable around Front Door | Learn[^azs05-origin][^azs05-appsvc] |
| AZS-EDGE-03 | Finding | The service tag without the header | Learn[^azs05-origin] |
| AZS-EDGE-04 | Warn | An origin the kit can't check | *Design guidance* (the kit's limit) |
| AZS-EDGE-05 | Finding | Private Link and public origins in one group | Learn[^azs05-pl] |
| AZS-EDGE-06 | Finding | A custom domain's minimum TLS below 1.2 | Learn[^azs05-ingress] |
| AZS-EDGE-07 | Finding | An application gateway's TLS policy not one of the baseline's predefined policies | Learn[^azs05-ingress][^azs05-agw-tls] |
| AZS-EDGE-08 | Warn | Fewer than two enabled origins in a group | Learn[^azs05-afd-cli] |

The baseline's predefined policies are `AppGwSslPolicy20220101` and `AppGwSslPolicy20220101S`, the two Learn names; the minimum Front Door TLS is `TLS12`. Both are in `config/baseline.json`. The origin groups' and custom domains' calls are unverified: the kit reads `tlsSettings.minimumTlsVersion` and the health probe settings by their ARM names, which Lab 2 confirms (research gaps, row 6). Two tests cover this area.

::: {.callout-important}
## Illustrative code
The labs run the kit against a fictional estate served from files. Review the code, and run Lab 2 in a test subscription, before it reads a real one.
:::

## Lab 1: fixtures, no subscription

You need PowerShell 7.1 or later with Pester 5. Work in `examples/azure-security`. Contoso's `afd-portal` (Premium) has two origin groups: `og-portal` with two App Service origins, and `og-api` with a Private Link origin and a public one. `afd-careers` (Standard) has one origin, a storage static website.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/azure-security`. Each step below says what it does and what to look for.

```powershell
# Step 1: Run the edge check
./Invoke-AzsCheck.ps1 -Area edge -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/week1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/week1/edge

# Step 2: Read each origin's lock-down
Import-Module ./powershell/AzureSecurity/AzureSecurity.psm1
(Read-AzsJson -Path out/week1/edge/edge.json) | Where-Object kind -EQ origin | ForEach-Object { "{0,-12} {1,-11} {2,-15} {3,-16} {4}" -f $_.profile, $_.originGroup, $_.name, $_.lockdown, $_.hostName }

# Step 3: Read the findings
Import-Csv out/week1/edge/findings.csv | ForEach-Object { "{0} {1,-7} {2}: {3}" -f $_.rule, $_.severity, $_.name, $_.detail }

# Step 4: Run this chapter's tests
Invoke-Pester -Path tests/Areas.Tests.ps1 -FullNameFilter 'Edge*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Run the edge check:**

   ```powershell
   ./Invoke-AzsCheck.ps1 -Area edge -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/week1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/week1/edge
   ```

   <!-- capture:begin 05-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/azs/05-1.txt))](captures/05-1.png){.lightbox fig-alt="Terminal window showing ./Invoke-AzsCheck.ps1 -Area edge -SettingsPath tests/fixtures/settings.lab.js… and what it printed"}

   <!-- capture:end -->

   Two of five origins locked by configuration.

2. **Read each origin's lock-down:**

   ```powershell
   Import-Module ./powershell/AzureSecurity/AzureSecurity.psm1
   (Read-AzsJson -Path out/week1/edge/edge.json) | Where-Object kind -EQ origin | ForEach-Object { "{0,-12} {1,-11} {2,-15} {3,-16} {4}" -f $_.profile, $_.originGroup, $_.name, $_.lockdown, $_.hostName }
   ```

   <!-- capture:begin 05-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/azs/05-2.txt))](captures/05-2.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/AzureSecurity/AzureSecurity.psm1 and what it printed"}

   <!-- capture:end -->

   `origin-east` has the tag and the header; `origin-west` has the tag only. `api-private` reaches its origin over Private Link.

3. **Read the findings:**

   ```powershell
   Import-Csv out/week1/edge/findings.csv | ForEach-Object { "{0} {1,-7} {2}: {3}" -f $_.rule, $_.severity, $_.name, $_.detail }
   ```

   <!-- capture:begin 05-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/azs/05-3.txt))](captures/05-3.png){.lightbox fig-alt="Terminal window showing Import-Csv out/week1/edge/findings.csv | ForEach-Object { '{0} {1,-7} {2}: {3… and what it printed"}

   <!-- capture:end -->

   `og-api` mixes a private and a public origin; `careers.contoso.example` allows TLS 1.0; `appgw-intranet` uses `AppGwSslPolicy20150501`; `og-careers` has one origin; and the classic `fd-legacy-intranet` is still there.

4. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/Areas.Tests.ps1 -FullNameFilter 'Edge*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 05-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/azs/05-4.txt))](captures/05-4.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/Areas.Tests.ps1 -FullNameFilter 'Edge*' -Output Non… and what it printed"}

   <!-- capture:end -->

**Expected result:** every origin with one lock-down state, the two the kit couldn't check named, and the TLS and failover gaps beside them.

When you're done, delete `out`:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 05-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/azs/05-5.txt))](captures/05-5.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test subscription

Use a test tenant with a test management group and subscription in commercial Azure, never production, with a Front Door Premium profile and an App Service origin, as the guide's Step 5 pilot builds them. You need Reader on the test management group, Azure CLI with the `resource-graph` extension, and PowerShell 7. Work in `examples/azure-security`. The authors haven't run this lab.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/azure-security`. Each step below says what it does and what to look for.

```powershell
# Step 1: Sign in to commercial Azure
az cloud set --name AzureCloud
az login --tenant <tenant-id>
az extension add --name resource-graph

# Step 2: Write the test settings file
$s = Get-Content deploy/settings.template.json -Raw | ConvertFrom-Json
$s.environment = 'test'; $s.tenantId = '<tenant-id>'; $s.tenantRootGroupId = '<tenant-id>'; $s.managementGroup = '<test-mg-id>'
$s.workspaceId = '<workspace-id>'; $s.connectivitySubscriptionId = '<test-subscription-id>'; $s.hubVnetId = '<hub-vnet-id>'
$s.workloadSubscriptionIds = @('<test-subscription-id>'); $s.requiredAssignments = @('<baseline-assignment-name>')
$s.securityInitiative = [pscustomobject]@{ assignmentName = 'azs-security'; definitionName = 'not-used-in-lab-2'; identityRole = 'Reader'; enforceBy = '2027-01-31' }
$s.location = '<location>'; $s.outputRoot = '<output-folder>'; $s.evidencePath = '<output-folder>'; $s.changeRecord = 'lab-2'
$s.PSObject.Properties.Remove('testEvidencePath'); $s.PSObject.Properties.Remove('_comment')
$s | ConvertTo-Json -Depth 5 | Set-Content <output-folder>/settings.test.json

# Step 3: Run the edge check, live
./Invoke-AzsCheck.ps1 -Area edge -SettingsPath <output-folder>/settings.test.json -OutputPath <output-folder>/edge -AllowUnverified

# Step 4: Compare the origin's restrictions with what the kit read
az webapp config access-restriction show --resource-group <rg> --name <app-name>

# Step 5: Run the guide's test: the origin refuses a direct request, and Front Door's is accepted
(Invoke-WebRequest -Uri 'https://<app-name>.azurewebsites.net/' -SkipHttpErrorCheck).StatusCode
(Invoke-WebRequest -Uri 'https://<endpoint-host>/' -SkipHttpErrorCheck).StatusCode

# Step 6: Back it out
Remove-Item -Recurse -Force <output-folder>/edge
az logout
```

:::

<!-- labs:end -->

You'll replace the values of [Chapter 01, Lab 2](01-the-landing-zone-baseline.md#lab-2-a-test-subscription), and `<app-name>` (the App Service origin's name), `<rg>` (its resource group) and `<endpoint-host>` (the Front Door endpoint's host name, ending in `.azurefd.net`).

1. **Sign in to commercial Azure:**

   ```powershell
   az cloud set --name AzureCloud
   az login --tenant <tenant-id>
   az extension add --name resource-graph
   ```

2. **Write the test settings file:**

   ```powershell
   $s = Get-Content deploy/settings.template.json -Raw | ConvertFrom-Json
   $s.environment = 'test'; $s.tenantId = '<tenant-id>'; $s.tenantRootGroupId = '<tenant-id>'; $s.managementGroup = '<test-mg-id>'
   $s.workspaceId = '<workspace-id>'; $s.connectivitySubscriptionId = '<test-subscription-id>'; $s.hubVnetId = '<hub-vnet-id>'
   $s.workloadSubscriptionIds = @('<test-subscription-id>'); $s.requiredAssignments = @('<baseline-assignment-name>')
   $s.securityInitiative = [pscustomobject]@{ assignmentName = 'azs-security'; definitionName = 'not-used-in-lab-2'; identityRole = 'Reader'; enforceBy = '2027-01-31' }
   $s.location = '<location>'; $s.outputRoot = '<output-folder>'; $s.evidencePath = '<output-folder>'; $s.changeRecord = 'lab-2'
   $s.PSObject.Properties.Remove('testEvidencePath'); $s.PSObject.Properties.Remove('_comment')
   $s | ConvertTo-Json -Depth 5 | Set-Content <output-folder>/settings.test.json
   ```

3. **Run the edge check, live:**

   ```powershell
   ./Invoke-AzsCheck.ps1 -Area edge -SettingsPath <output-folder>/settings.test.json -OutputPath <output-folder>/edge -AllowUnverified
   ```

4. **Compare the origin's restrictions with what the kit read:**

   ```powershell
   az webapp config access-restriction show --resource-group <rg> --name <app-name>
   ```

   The rule's tag, address and header should match the origin's row in `<output-folder>/edge/edge.json`. In the portal, open the profile's **Domains** and confirm each custom domain's minimum TLS version against the `custom-domain` rows.

5. **Run the guide's test: the origin refuses a direct request, and Front Door's is accepted:**

   ```powershell
   (Invoke-WebRequest -Uri 'https://<app-name>.azurewebsites.net/' -SkipHttpErrorCheck).StatusCode
   (Invoke-WebRequest -Uri 'https://<endpoint-host>/' -SkipHttpErrorCheck).StatusCode
   ```

   The first should be 403; the second, the application's own status. If the kit said `ServiceTag+FDID` and the first request isn't refused, record it (research gaps, row 7).

6. **Back it out.** The lab changed nothing in Azure. Delete what it wrote and sign out:

   ```powershell
   Remove-Item -Recurse -Force <output-folder>/edge
   az logout
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Origin lock-down | `AzureFrontDoor.Backend` and `X-Azure-FDID` together; the tag's addresses are shared | [^azs05-origin] |
| App Service restriction | `az webapp config access-restriction add --service-tag AzureFrontDoor.Backend --http-header x-azure-fdid=` | [^azs05-appsvc] |
| Site configuration | GET `.../sites/{name}/config/web`; `ipSecurityRestrictions` (`tag` `ServiceTag`, `ipAddress`, `headers`, `action`), `ipSecurityRestrictionsDefaultAction`; `X-Azure-FDID` matched exactly | [^azs05-webcfg] |
| Front Door origins | GET `.../originGroups/{name}/origins`, API version `2025-04-15`; `azureOrigin`, `hostName`, `enabledState`, `sharedPrivateLinkResource.status` | [^azs05-origins] |
| Private Link origins | Premium; approve the connection; don't mix public and private origins in one group; probes follow the private path | [^azs05-pl] |
| TLS | 1.2 or 1.3 only; predefined policies such as `AppGwSslPolicy20220101`; `Set-AzApplicationGatewaySslPolicy -PolicyName "AppGwSslPolicy20220101S"` | [^azs05-ingress] [^azs05-agw-tls] |
| Classic Front Door | Retires March 31, 2027; no new profiles or domains | [^azs05-classic] |

## Federal requirements and evidence

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| Each origin's lock-down by configuration: `edge.json` origin rows, Lab 1 step 2, with the request test of Lab 2 step 5 | SC-7, boundary protection | KSI-CNA-MAT | Application owner |
| TLS 1.2 minimum on every custom domain and gateway: AZS-EDGE-06 and AZS-EDGE-07, or none | SC-8, transmission confidentiality and integrity | KSI-SVC-SIN | Application owner, platform owner |
| A second origin in every group: AZS-EDGE-08, or none, with the guide's failover test | CP-2, contingency plan | KSI-CNA-MAT | Application owner |
| Classic profiles named before their retirement: AZS-EDGE-01 | SC-7 | KSI-CNA-MAT | Platform owner |

The controls are the guide's Step 5 row (SC-7, SC-8, CP-2) and its KSIs; the guide notes KSI-CNA-MAT and KSI-SVC-SIN cite SC-8.[^azs05-guide]

## Dangers

| Danger | What goes wrong | The guard |
|---|---|---|
| The service tag alone | Any customer's Front Door reaches the origin | AZS-EDGE-03 |
| A header from another profile | The other profile reaches the origin; this one may not | The header compared with this profile's ID |
| Configuration taken as proof | A rule that reads right still lets a request through (another path, another slot, the SCM site) | The metric says "by configuration"; Lab 2 step 5 is the test |
| An origin the kit can't read | It's counted as locked by nobody and tested by nobody | AZS-EDGE-04 every week until someone tests it |

## Checklist

- [ ] Every origin is `PrivateLink` or `ServiceTag+FDID`, or has a decision record with a compensating control.
- [ ] Every `Unchecked` origin has a dated direct-request test.
- [ ] Every origin group has a second origin, and failover was tested this half year.
- [ ] No custom domain or gateway allows TLS below 1.2.
- [ ] No classic profile remains, or its migration is scheduled before March 31, 2027.

## Continue the book

Next, [Chapter 06](06-azure-firewall-and-egress.md): what leaves Azure, through the firewall. The guide's [Step 5](../../../books/guides/azure-security-implementation.md#step-5-front-door-and-application-gateway) holds the commands that lock the origin and set TLS.

[^azs05-guide]: Azure Security Engineering, [Step 5: Front Door and Application Gateway](../../../books/guides/azure-security-implementation.md#step-5-front-door-and-application-gateway) and [Federal requirements and KSIs](../../../books/guides/azure-security-implementation.md#requirements), with its sources read November 11, 2026.
[^azs05-origin]: Microsoft Learn, "Secure traffic to Azure Front Door origins," <https://learn.microsoft.com/azure/frontdoor/origin-security> (accessed Nov 11, 2026).
[^azs05-appsvc]: Microsoft Learn, "Tutorial: Create a highly available multi-region app in Azure App Service," section "Configure Azure Front Door," <https://learn.microsoft.com/azure/app-service/tutorial-multi-region-app> (accessed Nov 11, 2026).
[^azs05-webcfg]: Microsoft Learn, REST API, "Web Apps - Get Configuration" (`ipSecurityRestrictions`, `ipSecurityRestrictionsDefaultAction`; `X-Azure-FDID` exact match), <https://learn.microsoft.com/rest/api/appservice/web-apps/get-configuration> (accessed Nov 17, 2026).
[^azs05-origins]: Microsoft Learn, REST API, "AFD Origins - List By Origin Group" (API version 2025-04-15; `azureOrigin`, `sharedPrivateLinkResource` and its status), <https://learn.microsoft.com/rest/api/frontdoor/azurefrontdoorstandardpremium/afd-origins/list-by-origin-group> (accessed Nov 17, 2026).
[^azs05-pl]: Microsoft Learn, "Secure your origin with Private Link in Azure Front Door Premium," <https://learn.microsoft.com/azure/frontdoor/private-link> (accessed Nov 11, 2026).
[^azs05-ingress]: Microsoft Learn, "Internet ingress: expose your application to the internet," section "Security considerations," <https://learn.microsoft.com/azure/networking/design-guide/internet-ingress> (accessed Nov 11, 2026).
[^azs05-agw-tls]: Microsoft Learn, "Configure TLS policy versions and cipher suites on Application Gateway using PowerShell," <https://learn.microsoft.com/azure/application-gateway/application-gateway-configure-ssl-policy-powershell> (accessed Nov 11, 2026).
[^azs05-classic]: Microsoft Learn, "Migrate Azure Front Door (classic) to Standard or Premium tier," <https://learn.microsoft.com/azure/frontdoor/migrate-tier> (accessed Nov 11, 2026).
[^azs05-afd-cli]: Microsoft Learn, "Quickstart: Create an Azure Front Door using Azure CLI" (an origin group with two origins in different regions; stopping one shows failover), <https://learn.microsoft.com/azure/frontdoor/create-front-door-cli> (accessed Nov 11, 2026).
