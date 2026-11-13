---
title: "Module 3: The edge and the egress"
description: "Guide Steps 5 and 6: choosing Front Door Premium, Application Gateway WAF_v2 or both; locking the origin so nothing reaches it around the edge, with Private Link or the service tag and the X-Azure-FDID header together; TLS 1.2 or later, health probes and failover; then Azure Firewall as the inspection point for egress and east-west traffic, with workload default routes to it, threat intelligence and IDPS moved from alert to deny through a reviewed draft, logs, TLS inspection and segmentation. Where agencies are: Front Door regions and Private Link in Azure Government, Firewall Premium regions. The lab runs the guide's Validate checks in a test subscription, with a failover test that stops and restarts one test origin. About 55 minutes, plus the lab, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 10"
series-order: 3
review-status: pending
last-reviewed: 2026-11-13
---
# Module 3: The edge and the egress {.unnumbered}

*Part of the [Azure Security Engineering learning path](index.md). Guide [Step 5](../../books/guides/azure-security-implementation.md#step-5-front-door-and-application-gateway) and [Step 6](../../books/guides/azure-security-implementation.md#step-6-firewall-and-segmentation). About 55 minutes, plus the lab.*

## Introduction (3 minutes) {#azs-m3-introduction}

A WAF in prevention mode protects nothing if an attacker can call the origin directly. And a workload whose traffic leaves Azure without inspection can reach a command-and-control server unseen. This module covers both directions: traffic in, through an edge nothing can go around, and traffic out, through Azure Firewall with threat intelligence and IDPS denying.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs](../../books/guides/azure-security-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| Step 5: SC-7 (boundary protection), SC-8 (transmission confidentiality and integrity), CP-2 (contingency plan) | KSI-CNA-MAT (cites SC-8), KSI-SVC-SIN (cites SC-8) | The origin lock-down test, the TLS policy, the failover test |
| Step 6: SC-7, SC-7(5) (deny by default), SI-4 (system monitoring) | KSI-CNA-RNT (cites SC-7(5)), KSI-CNA-ULN (cites SC-7) | The firewall policy, the routes, the denied test request |

KSIs are FedRAMP 20x indicators written for cloud service providers; the agency lines its own evidence up with them. The steps *support* these controls, and the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#azs-m3-objectives}

After this module, you'll be able to:

- choose Front Door Premium, Application Gateway WAF_v2 or both for an application, and say why;
- lock an origin to the edge, and explain why the `AzureFrontDoor.Backend` service tag alone isn't enough;
- check TLS, health probes and failover;
- route a workload subnet's default route to Azure Firewall, and check it with the effective routes;
- move threat intelligence and IDPS from alert to deny through a draft, and say what deploying a draft replaces.

## Prerequisites (1 minute) {#azs-m3-prerequisites}

- [Module 2](02-ddos-protection-and-the-waf.md): the WAF the edge carries.
- [Book 09](../../books/b09-network/index.md), for the agency's own edge and TIC, which the guide leaves to it. Skim its index.

## Unit 1: Front Door, Application Gateway and the origin (14 minutes) {#azs-m3-unit-1}

Read the guide's [Step 5](../../books/guides/azure-security-implementation.md#step-5-front-door-and-application-gateway). Points to take away:

- **Selection** *(design guidance)*. Front Door Premium for internet-facing applications that need global reach, Private Link origins or managed WAF rules; Application Gateway WAF_v2 for regional applications or traffic that must enter through the agency's own virtual network; both, with Front Door reaching Application Gateway over Private Link, where the application needs regional inspection too. Migrate any classic Front Door before March 31, 2027.
- **Lock the origin.** Private Link where the origin type supports it, with the private endpoint connection approved and no public and private origins mixed in one origin group. Where it doesn't, the `AzureFrontDoor.Backend` service tag *and* the `X-Azure-FDID` header, because the tag's addresses are shared by every Front Door customer.
- **TLS** 1.2 or 1.3 only, with a predefined policy on Application Gateway. Front Door Standard and Premium require HTTPS on every custom domain.
- **Probes and failover.** An origin group with health probes and two origins in different regions; stopping one should leave the application available through the other.

## Unit 2: Azure Firewall and segmentation (14 minutes) {#azs-m3-unit-2}

Read the guide's [Step 6](../../books/guides/azure-security-implementation.md#step-6-firewall-and-segmentation). Points to take away:

- **What the Zero Trust recommendations check:** outbound traffic from virtual network workloads routed through the firewall, threat intelligence and IDPS in alert and deny mode, outbound TLS inspected, diagnostic logs on.
- **SKUs.** Threat intelligence deny needs Standard or Premium; IDPS, TLS inspection and full URL filtering need Premium; Standard upgrades to Premium without redeployment.
- **Alert first, then deny through a draft.** Two weeks in alert, reading the threat intelligence and IDPS logs for hits on legitimate traffic, then one reviewed draft deployed in a change window. Deploying a draft replaces the whole applied policy: changes made to the live policy after the draft was created are lost unless they're in the draft too.
- **TLS inspection** needs an intermediate CA certificate in Key Vault that clients trust; it doesn't decrypt the Education, Finance, Government and Health categories.
- **East-west** *(design guidance)*: spoke-to-spoke traffic through the hub firewall, not direct peering, and NSGs that deny by default in each spoke.

## Unit 3: Where agencies are (5 minutes) {#azs-m3-unit-3}

Read the Front Door, Private Link and Azure Firewall rows of the guide's [availability table](../../books/guides/azure-security-implementation.md#gov-availability), and [what couldn't be verified](../../books/guides/azure-security-implementation.md#what-couldnt-be-verified). In commercial Azure, which a GCC tenant uses, both steps run as written. As side notes for Azure Government: Front Door Standard and Premium are generally available in US Gov Arizona and US Gov Texas; Front Door Private Link lists three government regions but needs availability zones, which Learn shows only in US Gov Virginia, so test before relying on it; Azure Firewall Premium's government regions are on the products-by-region page, not Learn.

On other clouds, the guide's [comparison](../../books/guides/azure-security-implementation.md#other-clouds) names OCI Network Firewall, built on Palo Alto Networks, with IDPS, TLS inspection and URL filtering, reached through VCN route tables; AWS Network Firewall and Google Cloud NGFW aren't compared there.

**Watch.** The guide's narrated deck covers this module in slides 11 and 12, *an origin nothing can reach around the edge* and *egress through Azure Firewall, then deny*. Its video is being exported; until then, read the narration in the [script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-azure-security/Guide_Azure_Security_Narration_Script.md).

## Exercise: Lab 2, a test subscription {#azs-m3-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Call the origin directly, then through Front Door
curl.exe -s -o NUL -w "%{http_code}`n" "https://<origin-host>/"
curl.exe -s -o NUL -w "%{http_code}`n" "https://<afd-endpoint-host>/"

# Step 2: Export the origin's access restriction
az webapp config access-restriction show --resource-group <rg> --name <app-name>

# Step 3: Check the application gateway's TLS policy
Connect-AzAccount -Environment <cloud-environment>
Get-AzApplicationGatewaySslPolicy -ApplicationGateway (Get-AzApplicationGateway -Name <appgw> -ResourceGroupName <rg>)

# Step 4: Test failover: stop the second origin, and call Front Door
az webapp stop --name <app-name-2> --resource-group <rg>
curl.exe -s -o NUL -w "%{http_code}`n" "https://<afd-endpoint-host>/"

# Step 5: Start the second origin again
az webapp start --name <app-name-2> --resource-group <rg>

# Step 6: Check the test VM's effective routes
az network nic show-effective-route-table --resource-group <rg> --name <nic> -o table

# Step 7: Check the firewall policy's modes
az network firewall policy show --name <fw-policy> --resource-group <rg> --query "{ti:threatIntelMode, idps:intrusionDetection.mode}"

# Step 8: From the test VM, request the threat intelligence test domain
curl.exe -s -o NUL -w "%{http_code}`n" --max-time 15 "https://<ti-test-fqdn>/"

# Step 9: Find the denied request in the threat intelligence log
az extension add --name log-analytics
az monitor log-analytics query --workspace <workspace-guid> --analytics-query "AZFWThreatIntel | where TimeGenerated > ago(1h) | take 20" -o table

# Step 10: Back it out
az webapp show --name <app-name-2> --resource-group <rg> --query state
```

:::

<!-- labs:end -->

You run the guide's Step 5 and Step 6 checks in a test subscription where someone has applied those steps to a test application and a pilot spoke. One step writes: the failover test stops one test origin, and the next step starts it again.

- **You need:** a test subscription, never production, with a Front Door Premium profile in front of two App Service origins in different regions, each locked to Front Door with the access restriction of the guide's Step 5; an application gateway with a TLS policy; Azure Firewall Premium with its policy in `Deny`, and a pilot spoke subnet routed to it, holding a Windows test VM; Reader on the subscription, Website Contributor on the second test origin for the failover test, and Log Analytics Reader on the workspace; Azure CLI and the Az PowerShell module on a Windows machine with PowerShell 7, signed in as Module 1's step 1 shows.
- **You'll replace:** `<rg>`, `<app-name>` and `<app-name-2>` (the two test origins), `<origin-host>` (the first origin's own host name), `<afd-endpoint-host>` (the Front Door endpoint's host name), `<appgw>`, `<nic>` (the test VM's network interface), `<fw-policy>`, `<ti-test-fqdn>` (a test domain your security monitor confirms is on the threat intelligence feed), `<cloud-environment>` (`AzureCloud` or `AzureUSGovernment`) and `<workspace-guid>` (the workspace's *Workspace ID*).
- **Not run by the authors.** The expected results are the ones the guide's **Validate** steps state.

1. **Call the origin directly, then through Front Door.** The requests are the path's.

    ```powershell
    curl.exe -s -o NUL -w "%{http_code}`n" "https://<origin-host>/"
    curl.exe -s -o NUL -w "%{http_code}`n" "https://<afd-endpoint-host>/"
    ```

    Expected result, from the guide's Validate: the direct request is refused (403, or no route); the same request through Front Door succeeds.

2. **Export the origin's access restriction.**

    ```powershell
    az webapp config access-restriction show --resource-group <rg> --name <app-name>
    ```

    Look for the rule with the `AzureFrontDoor.Backend` service tag and the `x-azure-fdid` header together.

3. **Check the application gateway's TLS policy.**

    ```powershell
    Connect-AzAccount -Environment <cloud-environment>
    Get-AzApplicationGatewaySslPolicy -ApplicationGateway (Get-AzApplicationGateway -Name <appgw> -ResourceGroupName <rg>)
    ```

    Look for the predefined policy the guide's Step 5 sets, `AppGwSslPolicy20220101S`.

4. **Test failover: stop the second origin, and call Front Door.** This writes. Use only the test application.

    ```powershell
    az webapp stop --name <app-name-2> --resource-group <rg>
    curl.exe -s -o NUL -w "%{http_code}`n" "https://<afd-endpoint-host>/"
    ```

    Expected result, from the guide's Validate: the application stays available through the other origin.

5. **Start the second origin again.**

    ```powershell
    az webapp start --name <app-name-2> --resource-group <rg>
    ```

6. **Check the test VM's effective routes.**

    ```powershell
    az network nic show-effective-route-table --resource-group <rg> --name <nic> -o table
    ```

    Expected result, from the guide's Validate: `0.0.0.0/0` to the firewall's private IP.

7. **Check the firewall policy's modes.**

    ```powershell
    az network firewall policy show --name <fw-policy> --resource-group <rg> --query "{ti:threatIntelMode, idps:intrusionDetection.mode}"
    ```

    Expected result, from the guide's Validate: `Deny` and `Deny`.

8. **From the test VM, request the threat intelligence test domain.** Sign in to the test VM and run this in its PowerShell.

    ```powershell
    curl.exe -s -o NUL -w "%{http_code}`n" --max-time 15 "https://<ti-test-fqdn>/"
    ```

    Expected result, from the guide's Validate: the request is denied. curl prints `000` when the connection is refused or reset.

9. **Find the denied request in the threat intelligence log.** Back on your machine. The guide's Step 6 sends the firewall's logs to resource-specific tables, which Learn's [Azure Firewall monitoring data reference](https://learn.microsoft.com/azure/firewall/monitor-firewall-reference) names; threat intelligence events are in `AZFWThreatIntel`.

    ```powershell
    az extension add --name log-analytics
    az monitor log-analytics query --workspace <workspace-guid> --analytics-query "AZFWThreatIntel | where TimeGenerated > ago(1h) | take 20" -o table
    ```

    Expected result, from the guide's Validate: the denied request is logged.

10. **Back it out.** Step 5 started the origin step 4 stopped; check it answers through Front Door again. Nothing else changed.

    ```powershell
    az webapp show --name <app-name-2> --resource-group <rg> --query state
    ```

    Expected result: `Running`.

## Knowledge check (5 minutes) {#azs-m3-check}

1. An App Service origin allows traffic from the `AzureFrontDoor.Backend` service tag only. Is it locked to the agency's Front Door?
    a. Yes: the tag lists only the agency's Front Door addresses.
    b. No: the tag's addresses are shared by every Front Door customer, so the `X-Azure-FDID` header must be checked too, or Private Link used.
    c. Yes, if TLS 1.2 is required.

2. Which application gets Front Door Premium and Application Gateway together, by the guide's selection?
    a. Every application.
    b. One that needs global reach and regional inspection too, with Front Door reaching Application Gateway over Private Link.
    c. None; the two can't be combined.

3. Someone changed the live firewall policy after a draft was created. What happens when the draft is deployed?
    a. The two are merged.
    b. The draft replaces the whole applied policy, and the live change is lost unless it's in the draft too.
    c. The deployment fails.

4. Which firewall SKU is needed for IDPS and TLS inspection?
    a. Standard.
    b. Premium.
    c. Basic.

5. How do you prove a workload's egress goes through the firewall?
    a. The firewall's metrics show traffic.
    b. The effective route table on the workload's network interface shows `0.0.0.0/0` to the firewall's private IP.
    c. The NSG allows outbound traffic.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [Step 5](../../books/guides/azure-security-implementation.md#step-5-front-door-and-application-gateway).
2. **b.** See Unit 1.
3. **b.** See Unit 2 and the guide's [Step 6](../../books/guides/azure-security-implementation.md#step-6-firewall-and-segmentation).
4. **b.** See Unit 2.
5. **b.** See the guide's [Validate (Step 6)](../../books/guides/azure-security-implementation.md#step-6-firewall-and-segmentation).
:::

## Summary (2 minutes) {#azs-m3-summary}

You proved the origin refuses a direct request, checked TLS and failover, and checked that the pilot subnet's egress goes through a firewall denying on threat intelligence and IDPS. **Evidence an ISSO keeps from this module:** the profile, origin group, route and access-restriction exports; the TLS policy; the refused direct request and the failover test; the firewall policy export and route tables; the denied request and its log row; and the bypass and allow-list register.

::: {.callout-tip}
## Continue the path
[← Previous: Module 2](02-ddos-protection-and-the-waf.md) · [Learning path](index.md) · [Next: Module 4, Private Link, DNS and Key Vault →](04-private-link-dns-and-key-vault.md)
:::
