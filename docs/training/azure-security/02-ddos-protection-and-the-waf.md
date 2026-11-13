---
title: "Module 2: DDoS protection and the web application firewall"
description: "Guide Steps 3 and 4: what DDoS infrastructure protection gives every public IP and what Network Protection and IP Protection add, choosing the tier, linking networks, logs, the under-attack alert and the exercise through an approved partner; then Azure WAF on Application Gateway and Front Door, from detection mode with request body inspection to prevention, with the default and bot rule sets, a rate limit, logs and narrowly scoped exceptions. Where agencies are: no bot protection or geo-filtering custom rules in sovereign clouds. The lab runs the guide's Validate checks in a test subscription, including a test request the WAF should block. About 50 minutes, plus the lab, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 10"
series-order: 2
review-status: pending
last-reviewed: 2026-11-13
---
# Module 2: DDoS protection and the web application firewall {.unnumbered}

*Part of the [Azure Security Engineering learning path](index.md). Guide [Step 3](../../books/guides/azure-security-implementation.md#step-3-ddos-protection) and [Step 4](../../books/guides/azure-security-implementation.md#step-4-web-application-firewall). About 50 minutes, plus the lab.*

## Introduction (3 minutes) {#azs-m2-introduction}

DDoS protection works at layers 3 and 4; a web application firewall works at layer 7. An internet-facing workload needs both, and each has to be in the mode that acts, not only the mode that logs. In this module you take every public IP in the register from Module 1 to DDoS protection with logs and an alert, and every HTTP endpoint to a WAF in prevention mode.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs](../../books/guides/azure-security-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| Step 3: SC-5 (denial-of-service protection), SI-4 (system monitoring) | KSI-CNA-RVP (cites SC-5), KSI-MLA-LET | Coverage, metrics and logs, the simulation report |
| Step 4: SC-7 (boundary protection), SI-10 (information input validation) | KSI-CNA-MAT (cites SI-10), KSI-CNA-RVP | WAF exports, logs, the blocked test request |

KSIs are FedRAMP 20x indicators written for cloud service providers; the agency lines its own evidence up with them. The steps *support* these controls, and the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#azs-m2-objectives}

After this module, you'll be able to:

- say what DDoS infrastructure protection, IP Protection and Network Protection each give, and what neither covers;
- check that every public IP is protected, logged and alerting;
- explain why a simulation runs only through an approved partner, and only against your own protected IPs;
- take a WAF policy from detection to prevention with request body inspection, the current rule set and a rate limit;
- prove the WAF blocks a test request, and roll it back if it blocks legitimate traffic.

## Prerequisites (1 minute) {#azs-m2-prerequisites}

- [Module 1](01-the-baseline-and-the-exposure-register.md), and its `public-ips.json` query.
- The guide's [decision record template](../../books/guides/azure-security-implementation.md#decision-record): the DDoS tier and the Front Door tier are recorded there.

## Unit 1: DDoS protection on every public IP (10 minutes) {#azs-m2-unit-1}

Read the guide's [Step 3](../../books/guides/azure-security-implementation.md#step-3-ddos-protection). Points to take away:

- **Three tiers.** Every public IP gets infrastructure protection at no cost. Network Protection and IP Protection add adaptive tuning, attack analytics, metrics, alerts and mitigation reports; Network Protection also adds the Rapid Response team, cost protection and a WAF discount, and protects Basic public IPs. Network Protection suits many public IPs across subscriptions; IP Protection suits a few critical ones.
- **What neither covers.** A public IP on a NAT gateway isn't supported, and both work at layers 3 and 4: layer 7 needs the WAF.
- **Moving a protected network.** A virtual network with DDoS protection can't be moved between resource groups or subscriptions; disabling protection to move it resets the tuned thresholds.
- **Logs and the alert.** The metric *Under DDoS attack or not* (`IfUnderDDoSAttack`) is 1 during mitigation; Learn's tutorial alerts at a maximum of 1 or more.
- **The exercise.** Learn allows simulations only through its approved partners, only against the agency's own protected public IPs, in staging or off-peak windows. Write the response team and runbook first.

## Unit 2: The web application firewall (12 minutes) {#azs-m2-unit-2}

Read the guide's [Step 4](../../books/guides/azure-security-implementation.md#step-4-web-application-firewall). Points to take away:

- **Detection logs; only prevention blocks.** A WAF left in detection mode lets attacks reach the backend. That is the first danger in the guide's [dangers table](../../books/guides/azure-security-implementation.md#dangers).
- **What Microsoft's Zero Trust recommendations check:** prevention mode, request body inspection, the default rule set, the bot protection rule set, rate limiting, a JavaScript challenge and diagnostic logging; for Application Gateway the HTTP DDoS rule set; for Front Door a CAPTCHA challenge too.
- **The rule set version.** The CLI's default is `Microsoft_DefaultRuleSet` 2.1; Learn recommends the latest, 2.2 at the guide's reading, validated in log mode before blocking. Name the version you've validated.
- **Tune, then enforce.** Detection for at least one full business cycle, read the firewall log for matches on legitimate traffic, scope each exception to the narrowest rule, then switch to prevention one application at a time. Rollback is the reverse switch, in minutes.
- **Front Door** managed rules need the Premium tier. The guide gives the same policy as Bicep from the Azure Verified Modules registry.

## Unit 3: Where agencies are (4 minutes) {#azs-m2-unit-3}

Read the DDoS and WAF rows of the guide's [availability table](../../books/guides/azure-security-implementation.md#gov-availability). In commercial Azure, which a GCC tenant uses, everything in this module is available. As a side note for Azure Government: WAF on Application Gateway is supported, but geo-filtering custom rules and bot protection rule sets aren't, so leave the bot manager rule set out and record the Zero Trust test as *Skipped-Not-Applicable* (environment); Front Door WAF's sovereign-cloud limits are not yet specified; and the simulation partner Red Button is public cloud only.

On other clouds, the guide's [comparison](../../books/guides/azure-security-implementation.md#other-clouds) names AWS Shield and AWS WAF, Google Cloud Armor, and OCI WAF as a regional policy on a load balancer or at the edge; DDoS protection on Oracle Cloud Infrastructure isn't compared there.

**Watch.** The guide's narrated deck covers this module in slides 9 and 10, *DDoS protection on every public IP* and *the WAF, from detection to prevention*. Its video is being exported; until then, read the narration in the [script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-azure-security/Guide_Azure_Security_Narration_Script.md).

## Exercise: Lab 2, a test subscription {#azs-m2-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Check every public IP's DDoS state
az graph query -q "Resources | where type =~ 'microsoft.network/publicipaddresses' | project name, resourceGroup, ddosMode = tostring(properties.ddosSettings.protectionMode)" --first 1000 -o table

# Step 2: Export the plan and its linked networks
az network ddos-protection show --resource-group <rg> --name <ddos-plan>

# Step 3: Check the protected IP's logs and alert
az monitor diagnostic-settings list --resource <pip-resource-id> -o table
az monitor metrics alert show --name ddos-under-attack-<pip> --resource-group <rg>

# Step 4: Check the WAF policy's mode, body inspection and rule sets
az network application-gateway waf-policy show --name <waf-policy> --resource-group <rg> --query "{mode:policySettings.mode, body:policySettings.requestBodyCheck, sets:managedRules.managedRuleSets[].ruleSetType}"

# Step 5: Send a test request carrying a benign SQL injection string
curl.exe -s -o NUL -w "%{http_code}`n" "https://<test-host>/<test-path>?id=1%27%20OR%201%3D1--"

# Step 6: Find the matching row in the firewall log
az extension add --name log-analytics
az monitor log-analytics query --workspace <workspace-guid> --analytics-query "AGWFirewallLogs | where TimeGenerated > ago(1h) | take 20" -o table
```

:::

<!-- labs:end -->

You run the guide's Step 3 and Step 4 checks in a test subscription where someone has applied those steps to a test application, and send one test request the WAF should block. Nothing in Azure changes. The DDoS simulation isn't part of the lab: Learn allows it only through an approved partner.

- **You need:** a test subscription, never production, with a DDoS Network Protection plan linked to a test virtual network, a protected Standard public IP with its diagnostic setting and alert, and a test application behind an Application Gateway WAF_v2 whose policy is in prevention mode; Reader on the subscription and Log Analytics Reader on the workspace; Azure CLI on a Windows machine with PowerShell 7, signed in as Module 1's step 1 shows.
- **You'll replace:** `<rg>`, `<ddos-plan>`, `<pip>`, `<pip-resource-id>` (the public IP's resource ID), `<waf-policy>`, `<test-host>` (the test application's host name), `<test-path>` (a path on it) and `<workspace-guid>` (the *Workspace ID* on the Log Analytics workspace's Overview page, a GUID, not its resource ID).
- **Not run by the authors.** The expected results are the ones the guide's **Validate** steps state.

1. **Check every public IP's DDoS state.** The query is Module 1's, narrowed to the columns this step reads.

    ```powershell
    az graph query -q "Resources | where type =~ 'microsoft.network/publicipaddresses' | project name, resourceGroup, ddosMode = tostring(properties.ddosSettings.protectionMode)" --first 1000 -o table
    ```

    Expected result, from the guide's Validate: every public IP shows `ddosMode` `Enabled`, or `VirtualNetworkInherited` in a linked network.

2. **Export the plan and its linked networks.**

    ```powershell
    az network ddos-protection show --resource-group <rg> --name <ddos-plan>
    ```

3. **Check the protected IP's logs and alert.**

    ```powershell
    az monitor diagnostic-settings list --resource <pip-resource-id> -o table
    az monitor metrics alert show --name ddos-under-attack-<pip> --resource-group <rg>
    ```

    Look for the diagnostic setting to the workspace, and the alert's condition on `IfUnderDDoSAttack` at a maximum of 1 or more.

4. **Check the WAF policy's mode, body inspection and rule sets.**

    ```powershell
    az network application-gateway waf-policy show --name <waf-policy> --resource-group <rg> --query "{mode:policySettings.mode, body:policySettings.requestBodyCheck, sets:managedRules.managedRuleSets[].ruleSetType}"
    ```

    Expected result, from the guide's Validate: `Prevention`, `true` and the rule sets.

5. **Send a test request carrying a benign SQL injection string.** The request is the path's; it asks for `1' OR 1=1--` on the test path.

    ```powershell
    curl.exe -s -o NUL -w "%{http_code}`n" "https://<test-host>/<test-path>?id=1%27%20OR%201%3D1--"
    ```

    Expected result, from the guide's Validate: `403`.

6. **Find the matching row in the firewall log.** The guide's Step 4 sends the firewall log to resource-specific tables, which Learn's [Application Gateway diagnostic logs](https://learn.microsoft.com/azure/application-gateway/application-gateway-diagnostics) page names `AGWFirewallLogs`. The query command is in the Azure CLI's `log-analytics` extension. Logs can take a few minutes to arrive.

    ```powershell
    az extension add --name log-analytics
    az monitor log-analytics query --workspace <workspace-guid> --analytics-query "AGWFirewallLogs | where TimeGenerated > ago(1h) | take 20" -o table
    ```

    Expected result, from the guide's Validate: the firewall log has the row for your request.

7. **Back it out.** The lab changed nothing in Azure, so there is nothing to undo. If step 5 returned anything but `403`, the WAF isn't blocking: report it to the application owner; don't fix it in the lab.

## Knowledge check (5 minutes) {#azs-m2-check}

1. A public IP is attached to a NAT gateway. What does DDoS Network Protection do for it?
    a. It protects it like any other Standard public IP.
    b. Nothing: NAT gateway IPs aren't supported, so the guide lists them as an exclusion.
    c. It protects it only at layer 7.

2. Which tier adds the Rapid Response team and cost protection?
    a. DDoS IP Protection.
    b. DDoS Network Protection.
    c. Infrastructure protection, which every public IP gets free.

3. How may the agency exercise its DDoS response?
    a. With any load-testing tool, against any Azure public IP.
    b. Only through Learn's approved partners, only against its own protected public IPs, preferably in staging or off-peak windows.
    c. It can't; Microsoft runs the exercise.

4. A WAF policy shows `Detection`. What happens to an attack request?
    a. It is blocked and logged.
    b. It is logged and forwarded to the backend.
    c. It is dropped silently.

5. In Azure Government, the Zero Trust test for a bot protection rule set can't pass. How is it recorded?
    a. *Fail*, with a remediation date.
    b. *Skipped-Not-Applicable* (environment), because sovereign clouds don't support bot protection rule sets.
    c. *Pass*, because the default rule set covers bots.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [Step 3](../../books/guides/azure-security-implementation.md#step-3-ddos-protection).
2. **b.** See Unit 1.
3. **b.** See Unit 1.
4. **b.** See Unit 2 and the guide's [Step 4](../../books/guides/azure-security-implementation.md#step-4-web-application-firewall).
5. **b.** See Unit 3 and the [availability table](../../books/guides/azure-security-implementation.md#gov-availability).
:::

## Summary (2 minutes) {#azs-m2-summary}

You checked that every public IP is under DDoS protection with logs and an alert, and that the WAF is in prevention mode with body inspection, its rule sets and a blocked test request in its log. **Evidence an ISSO keeps from this module:** the plan and its linked networks, the per-IP mode export, DDoS metrics, logs and alert history, the simulation report when the exercise runs, the WAF policy exports, the WAF logs and the blocked test request with its log row, and the rule-exception register.

::: {.callout-tip}
## Continue the path
[← Previous: Module 1](01-the-baseline-and-the-exposure-register.md) · [Learning path](index.md) · [Next: Module 3, The edge and the egress →](03-the-edge-and-the-egress.md)
:::
