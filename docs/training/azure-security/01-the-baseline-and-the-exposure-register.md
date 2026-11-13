---
title: "Module 1: The baseline and the exposure register"
description: "Guide Steps 1 and 2, with how the guide is organized: what the landing-zone books already design and what the guide engineers on top; protecting the management group hierarchy, assigning the security benchmark and the FedRAMP initiative in audit at the intermediate root, and sending platform logs to the workspace; then the Resource Graph inventory of every public IP, Front Door profile, application gateway and public PaaS endpoint, with an owner on every row. Where agencies are: GCC pairs with commercial Azure, Azure Government differs, and the same controls on AWS, Google Cloud and Oracle Cloud Infrastructure. The lab runs the guide's read-only checks in a test subscription. About 50 minutes, plus the lab, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 10"
series-order: 1
review-status: pending
last-reviewed: 2026-11-13
---
# Module 1: The baseline and the exposure register {.unnumbered}

*Part of the [Azure Security Engineering learning path](index.md). Guide [Step 1](../../books/guides/azure-security-implementation.md#step-1-landing-zone-security-baseline) and [Step 2](../../books/guides/azure-security-implementation.md#step-2-public-exposure-inventory). About 50 minutes, plus the lab.*

## Introduction (4 minutes) {#azs-m1-introduction}

A landing zone decides what can be deployed. It doesn't decide what the internet can reach, and nothing in Steps 3 to 8 can be proved complete without a list of what is exposed. In this module you learn how the guide is put together, add the security settings the baseline needs on top of the landing zone, and build the exposure register every later module checks against.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs](../../books/guides/azure-security-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| Step 1: CM-2 (baseline configuration), CM-6 (configuration settings), CA-7 (continuous monitoring) | KSI-SVC-ACM, KSI-MLA-EVC | Initiative assignments, the compliance export |
| Step 2: CM-8 (system component inventory), SC-7 (boundary protection) | KSI-CNA-MAT | The dated register, reconciled with Defender for Cloud |

KSIs are FedRAMP 20x indicators written for cloud service providers. The agency lines its own evidence up with them; it doesn't report KSIs itself ([Book 00, Appendix B](../../books/b00-orientation/appendix-b-engagement-archetype.md)). The steps *support* these controls; the organization sets their parameters, and the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#azs-m1-objectives}

After this module, you'll be able to:

- say which parts of Azure security the books design and which the guide engineers, and read the guide's authority labels;
- protect the management group hierarchy, and assign the security initiatives in `DoNotEnforce` at the intermediate root;
- find platform resources that don't send logs to the workspace;
- build the exposure register from Resource Graph, and find the rows with no owner;
- name what differs in Azure Government, and the equivalent controls on AWS, Google Cloud and Oracle Cloud Infrastructure.

## Prerequisites (1 minute) {#azs-m1-prerequisites}

- [Book 10, Chapter 05](../../books/b10-cloud-boundary/05-the-landing-zone.md): the management group hierarchy, the boundary policies and the exemption rule. Skim it; Unit 2 builds on it.
- The guide's [prerequisites](../../books/guides/azure-security-implementation.md#prerequisites): the roles, eligible through PIM, and the tools.

## Unit 1: How the guide is built (8 minutes) {#azs-m1-unit-1}

Read the guide's [How to read this guide](../../books/guides/azure-security-implementation.md#how-to-read-this-guide), [Where each topic is covered](../../books/guides/azure-security-implementation.md#coverage) and [The track at a glance](../../books/guides/azure-security-implementation.md#the-track-at-a-glance). Three things to take away:

- **The books design; the guide engineers.** Book 10 builds the hierarchy, the provisioning loop and the ownership of the boundary; Book 12 chooses the posture tool; Book 09 owns the agency's network edge. The guide adds the service-by-service engineering a Zero Trust assessment tests, and links to the books rather than restating them.
- **Labels.** *Mandated* only where a federal source requires it, *Microsoft-recommended* where Learn recommends it, *Risk-based recommended* for the program's position. A feature the tenant isn't licensed for, or a cloud doesn't offer, is a licensing or environment decision: an assessment test that can't run against it is *Skipped*, not *Fail*.
- **Order.** Steps 1 and 2 come first; Steps 3 to 8 can run in parallel by workload once the inventory exists; Step 9 turns each of them into policy; Step 10 runs from the start. The rest of this path follows that order.

## Unit 2: The landing-zone security baseline (10 minutes) {#azs-m1-unit-2}

Read the guide's [Step 1](../../books/guides/azure-security-implementation.md#step-1-landing-zone-security-baseline). It adds four things to Book 10's landing zone:

- **Protect the hierarchy.** Creating management groups needs authorization, and new subscriptions land in a default group.
- **Assign the security benchmark and the FedRAMP initiative in audit** at the intermediate root. `DoNotEnforce` evaluates compliance without enforcing the effect; Step 9 enforces later, after at least one evaluation cycle and a compliance review with the ISSO.
- **Send platform logs to the workspace.** Every hub resource gets a diagnostic setting; a Resource Graph query finds the resources to check.
- **Turn on Defender for Cloud** on every subscription, with continuous export to the workspace.

Rollback is one command: delete the assignment. Nothing at the root is excluded; exemptions come only through Step 9, with an expiry.

## Unit 3: The public exposure inventory (10 minutes) {#azs-m1-unit-3}

Read the guide's [Step 2](../../books/guides/azure-security-implementation.md#step-2-public-exposure-inventory). Learn recommends an inventory of every public IP and its protection status, kept with Resource Graph, and a quarterly review. The guide's four queries list public IPs with their DDoS state, Front Door profiles, application gateways with their WAF policy, and PaaS resources whose public network access isn't disabled. The register adds the owner, the DNS names and certificates that point at each exposure, and whether a WAF covers it.

Two cautions from the guide. The `publicNetworkAccess` query is a starting list, not a complete one, because the property varies by service. And the register is a map of the attack surface: it stays inside the boundary, never in a public repository.

## Unit 4: Where agencies are (8 minutes) {#azs-m1-unit-4}

Read the guide's [government-cloud availability](../../books/guides/azure-security-implementation.md#gov-availability) table and [the same controls on AWS, Google Cloud and Oracle Cloud](../../books/guides/azure-security-implementation.md#other-clouds).

- **GCC Moderate first.** Microsoft 365 GCC pairs with commercial Azure, so a GCC agency's subscriptions are usually commercial, and the guide's commands run as written with `<cloud>` set to `AzureCloud`.
- **Azure Government, as a side note.** GCC High and DoD pair with Azure Government. Its endpoints differ; the landing zone accelerators need adapting; Lighthouse has no PIM for delegated access. Later modules name the gaps that matter to their steps.
- **Other clouds.** The table compares DDoS protection, the web application firewall, the inspecting firewall and private access to PaaS across Azure, AWS, Google Cloud and Oracle Cloud Infrastructure. An agency whose HR platform runs on Oracle Cloud Infrastructure has OCI WAF, OCI Network Firewall and OCI private endpoints to engineer the same way; their availability in OCI Government Cloud is not yet specified.

**Watch.** The guide's narrated deck covers this module in its first eight slides, from *Azure security, engineered one service at a time* to *Steps 1 and 2: baseline in audit, then inventory*. Its video is being exported; until it is on the [Presentations](../../presentations/index.md) page, read the slides' narration in the [script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-azure-security/Guide_Azure_Security_Narration_Script.md).

## Exercise: Lab 2, a test subscription {#azs-m1-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Sign in to the cloud the subscription lives in, and add the extensions
az cloud set --name <cloud>
az login
az account set --subscription <subscription-id>
az extension add --name resource-graph
az extension add --name azure-firewall

# Step 2: Check the initiatives are in audit at the pilot group
az policy assignment list --scope /providers/Microsoft.Management/managementGroups/<mg-id> -o table

# Step 3: List the platform resources that need a diagnostic setting
az graph query -q "Resources | where type in~ ('microsoft.network/azurefirewalls','microsoft.network/applicationgateways','microsoft.cdn/profiles','microsoft.keyvault/vaults','microsoft.network/publicipaddresses') | project id, type, subscriptionId" --first 1000

# Step 4: Check one of them sends its logs to the workspace
az monitor diagnostic-settings list --resource <resource-id> -o table

# Step 5: Make a folder for the inventory, and run the four queries
New-Item -ItemType Directory -Force -Path out
az graph query -q "Resources | where type =~ 'microsoft.network/publicipaddresses' | project id, name, subscriptionId, resourceGroup, ip = tostring(properties.ipAddress), sku = tostring(sku.name), ddosMode = tostring(properties.ddosSettings.protectionMode), attachedTo = tostring(properties.ipConfiguration.id), owner = tostring(tags['owner'])" --first 1000 -o json > out/public-ips.json
az graph query -q "Resources | where type =~ 'microsoft.cdn/profiles' | project id, name, sku = tostring(sku.name), owner = tostring(tags['owner'])" --first 1000 -o json > out/frontdoor.json
az graph query -q "Resources | where type =~ 'microsoft.network/applicationgateways' | project id, name, sku = tostring(properties.sku.tier), wafPolicy = tostring(properties.firewallPolicy.id), owner = tostring(tags['owner'])" --first 1000 -o json > out/appgw.json
az graph query -q "Resources | where isnotempty(properties.publicNetworkAccess) and tostring(properties.publicNetworkAccess) !~ 'Disabled' | project id, type, publicNetworkAccess = tostring(properties.publicNetworkAccess), owner = tostring(tags['owner'])" --first 1000 -o json > out/paas-public.json

# Step 6: Find the public IPs with no owner
(Get-Content -Raw out/public-ips.json | ConvertFrom-Json).data | Where-Object { -not $_.owner } | Format-Table name, resourceGroup, ip, ddosMode

# Step 7: Back it out
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

You run the guide's Step 1 and Step 2 checks in a test subscription. Every command reads; the only thing written is the `out` folder on your own machine.

- **You need:** a test tenant and test subscription, never production, where someone has applied the guide's Step 1 to a pilot management group; Reader on that management group and its subscriptions; Azure CLI on a Windows machine with PowerShell 7.
- **You'll replace:** `<cloud>` (`AzureCloud` for a GCC tenant's commercial subscriptions, `AzureUSGovernment` for Azure Government), `<subscription-id>`, `<mg-id>` (the pilot management group) and `<resource-id>` (one resource ID from step 3's output).
- **Not run by the authors.** The expected results are the ones the guide's **Validate** steps state; nothing here shows output the authors captured.

1. **Sign in to the cloud the subscription lives in, and add the extensions.**

    ```powershell
    az cloud set --name <cloud>
    az login
    az account set --subscription <subscription-id>
    az extension add --name resource-graph
    az extension add --name azure-firewall
    ```

2. **Check the initiatives are in audit at the pilot group.**

    ```powershell
    az policy assignment list --scope /providers/Microsoft.Management/managementGroups/<mg-id> -o table
    ```

    Expected result, from the guide's Validate: the security benchmark and FedRAMP initiatives are listed with enforcement mode `DoNotEnforce`.

3. **List the platform resources that need a diagnostic setting.**

    ```powershell
    az graph query -q "Resources | where type in~ ('microsoft.network/azurefirewalls','microsoft.network/applicationgateways','microsoft.cdn/profiles','microsoft.keyvault/vaults','microsoft.network/publicipaddresses') | project id, type, subscriptionId" --first 1000
    ```

4. **Check one of them sends its logs to the workspace.** Use an `id` from step 3 as `<resource-id>`.

    ```powershell
    az monitor diagnostic-settings list --resource <resource-id> -o table
    ```

    Expected result, from the guide's Validate: a diagnostic setting to the platform team's workspace. A resource with none is a gap for the platform owner.

5. **Make a folder for the inventory, and run the four queries.**

    ```powershell
    New-Item -ItemType Directory -Force -Path out
    az graph query -q "Resources | where type =~ 'microsoft.network/publicipaddresses' | project id, name, subscriptionId, resourceGroup, ip = tostring(properties.ipAddress), sku = tostring(sku.name), ddosMode = tostring(properties.ddosSettings.protectionMode), attachedTo = tostring(properties.ipConfiguration.id), owner = tostring(tags['owner'])" --first 1000 -o json > out/public-ips.json
    az graph query -q "Resources | where type =~ 'microsoft.cdn/profiles' | project id, name, sku = tostring(sku.name), owner = tostring(tags['owner'])" --first 1000 -o json > out/frontdoor.json
    az graph query -q "Resources | where type =~ 'microsoft.network/applicationgateways' | project id, name, sku = tostring(properties.sku.tier), wafPolicy = tostring(properties.firewallPolicy.id), owner = tostring(tags['owner'])" --first 1000 -o json > out/appgw.json
    az graph query -q "Resources | where isnotempty(properties.publicNetworkAccess) and tostring(properties.publicNetworkAccess) !~ 'Disabled' | project id, type, publicNetworkAccess = tostring(properties.publicNetworkAccess), owner = tostring(tags['owner'])" --first 1000 -o json > out/paas-public.json
    ```

6. **Find the public IPs with no owner.** This filter is the path's, not the guide's: it reads the `data` array the Resource Graph extension writes.

    ```powershell
    (Get-Content -Raw out/public-ips.json | ConvertFrom-Json).data | Where-Object { -not $_.owner } | Format-Table name, resourceGroup, ip, ddosMode
    ```

    Expected result, from the guide's Validate: every row has an owner, or each ownerless row has a ticket. Module 5 counts the rows again for the metrics.

7. **Back it out** when you finish the path. The lab created nothing in Azure. The `out` folder is a map of the test subscription's attack surface: delete it.

    ```powershell
    Remove-Item -Recurse -Force out
    ```

## Knowledge check (5 minutes) {#azs-m1-check}

1. Why does Step 1 assign the security initiatives in `DoNotEnforce`?
    a. Because the FedRAMP initiative can't be enforced.
    b. To evaluate compliance without enforcing the effect until at least one evaluation cycle and a compliance review with the ISSO; Step 9 enforces.
    c. Because `DoNotEnforce` stops remediation tasks from running.

2. A test the Zero Trust assessment can't run because the cloud doesn't offer the feature is recorded as:
    a. *Fail*, because the control is missing.
    b. *Skipped*, as an environment decision, not a failed control.
    c. *Pass*, because nothing is exposed.

3. Where does the exposure register live?
    a. In the workbook's public repository, so assessors can find it.
    b. Inside the boundary, because it is a map of the attack surface.
    c. Only in Defender for Cloud.

4. The `publicNetworkAccess` query returns no rows for one service you know is public. What does the guide say about the query?
    a. It is complete, so the service must be private.
    b. It is a starting list: the property's name and values vary by service.
    c. It only reads Front Door.

5. A GCC agency's subscriptions are usually in which cloud?
    a. Azure Government, because GCC is a government cloud.
    b. Commercial Azure, which Microsoft 365 GCC pairs with; GCC High and DoD pair with Azure Government.
    c. Either, chosen per subscription by the tenant.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 2 and the guide's [Step 1](../../books/guides/azure-security-implementation.md#step-1-landing-zone-security-baseline).
2. **b.** See Unit 1 and the guide's [How to read this guide](../../books/guides/azure-security-implementation.md#how-to-read-this-guide).
3. **b.** See Unit 3 and the guide's [Step 2](../../books/guides/azure-security-implementation.md#step-2-public-exposure-inventory).
4. **b.** See Unit 3.
5. **b.** See Unit 4 and the [availability table](../../books/guides/azure-security-implementation.md#gov-availability).
:::

## Summary (2 minutes) {#azs-m1-summary}

You learned how the guide divides the work with the books, checked the baseline's initiatives in audit and the platform logs, and built the exposure register with an owner on every row. **Evidence an ISSO keeps from this module:** the hierarchy settings and initiative assignments exports, policy compliance in the workspace, the query text and the dated register, and the reconciliation with Defender for Cloud.

::: {.callout-tip}
## Continue the path
[Learning path](index.md) · [Next: Module 2, DDoS protection and the web application firewall →](02-ddos-protection-and-the-waf.md)
:::
