---
title: "Module 5: Policy, drift and evidence"
description: "Guide Steps 9 and 10: gathering the security definitions from Steps 3 to 8 into one initiative at the intermediate root, assigning it in DoNotEnforce and then Default, remediation tasks, exemptions that expire, and the monthly compliance export; then the operating model: the DDoS incident runbook, the recurring reviews, the RACI, the evidence catalog, the metrics and the requirements each step supports, ending at control states an assessor can check. The lab exports the compliance summary and the exemption register from a test management group and computes two of the guide's metrics. About 50 minutes, plus the lab, with a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 10"
series-order: 5
review-status: pending
last-reviewed: 2026-11-13
---
# Module 5: Policy, drift and evidence {.unnumbered}

*Part of the [Azure Security Engineering learning path](index.md). Guide [Step 9](../../books/guides/azure-security-implementation.md#step-9-policy-and-drift) and [Step 10](../../books/guides/azure-security-implementation.md#step-10-operations-and-evidence). About 50 minutes, plus the lab.*

## Introduction (3 minutes) {#azs-m5-introduction}

Everything in Modules 1 to 4 can drift: a new public IP in a workload subscription, a WAF switched back to detection, a vault created with public access on. Policy holds the engineering in place and reports what drifted; the operating model gives each control an owner, a cadence and a test; and the evidence catalog turns both into what an assessor can inspect. This module ends the path there.

**The federal requirement.** The full table is the guide's [Federal requirements and KSIs](../../books/guides/azure-security-implementation.md#requirements).

| Requirement | KSI | Evidence |
|---|---|---|
| Step 9: CM-2 (baseline configuration), CM-6 (configuration settings), CA-7 (continuous monitoring) | KSI-SVC-ACM, KSI-CNA-EIS, KSI-MLA-EVC | The monthly export, the exemption register |
| Step 10: IR-4 (incident handling), CP-4 (contingency plan testing), AU-6 (audit record review) | KSI-INR-RIR, KSI-INR-AAR, KSI-RPL-TRC, KSI-MLA-OSM | Review records, exercises, after-action reports |

KSIs are FedRAMP 20x indicators written for cloud service providers; the agency lines its own evidence up with them. The steps *support* these controls; the organization sets their parameters, and the assessor decides whether each is satisfied.

## Learning objectives (1 minute) {#azs-m5-objectives}

After this module, you'll be able to:

- gather the security definitions into one initiative, and move it from `DoNotEnforce` to `Default` after a compliance review;
- explain what a remediation task does, and what stays after a rollback;
- create an exemption with a category and an expiry, and find the ones past it;
- run the DDoS incident runbook and the recurring reviews, and read the RACI;
- compute the guide's metrics as protected coverage, not settings, and say what makes a finding ready for closure.

## Prerequisites (1 minute) {#azs-m5-prerequisites}

- Modules [1](01-the-baseline-and-the-exposure-register.md) to [4](04-private-link-dns-and-key-vault.md).
- [Book 10, Chapter 05, Enforcing without breaking things](../../books/b10-cloud-boundary/05-the-landing-zone.md#enforcing-without-breaking-things) and [Book 13, Chapter 02](../../books/b13-governance/02-drift-is-the-primary-threat.md): audit first, then deny, and why drift is the threat. Skim both.

## Unit 1: Policy and drift (12 minutes) {#azs-m5-unit-1}

Read the guide's [Step 9](../../books/guides/azure-security-implementation.md#step-9-policy-and-drift). Points to take away:

- **One initiative at the intermediate root**, gathering the DDoS, WAF, private DNS, public-access and Key Vault definitions. Built-ins differ by cloud, so the guide has you look each one up by display name in the cloud you're in.
- **`DoNotEnforce`, then `Default`**, after at least one evaluation cycle and a review of the non-compliant list with owners. Policies with `deployIfNotExists` or `modify` need a managed identity; grant the narrowest role each definition names, not Contributor, where the initiative allows it.
- **Remediation tasks** fix what already exists. Rolling the assignment back to `DoNotEnforce` takes minutes, but resources a remediation created stay until removed.
- **Exemptions expire.** *Mitigated* when the intent is met another way, *Waiver* when non-compliance is accepted for a time; an expired exemption is kept for the record but no longer honored. No `notScopes` for convenience.
- **Export compliance each month,** with the summary and the non-compliant list.

## Unit 2: Operations and evidence (14 minutes) {#azs-m5-unit-2}

Read the guide's [Step 10](../../books/guides/azure-security-implementation.md#step-10-operations-and-evidence), its [RACI](../../books/guides/azure-security-implementation.md#raci), [evidence catalog](../../books/guides/azure-security-implementation.md#evidence-catalog) and [metrics](../../books/guides/azure-security-implementation.md#metrics), and the [control states and assessment mapping](../../books/guides/azure-security-implementation.md#control-states). Points to take away:

- **The DDoS runbook** *(design guidance, built on Learn's response strategy)*: the alert pages the security monitor; check application health and the WAF logs for a layer-7 component; lower rate limits through an emergency change if needed; open a severity A request for Rapid Response under Network Protection; then the after-action report.
- **The cadence** *(design guidance)*: weekly exposure register; monthly compliance export and exemptions; quarterly DDoS coverage and cost, firewall rules, Key Vault access and the WAF rule-set version; twice-yearly failover and vault restore tests; a yearly DDoS simulation with an approved partner.
- **Measure coverage, not settings.** Each metric divides what is protected and tested by what exists: exposure ownership, DDoS coverage, WAF prevention coverage, origin lock-down, egress inspection, private PaaS, vault posture, policy compliance, exemption hygiene, detection to page, exercise currency and WAF effectiveness.
- **Closure.** A finding the guide addresses is ready for closure when every applicable control state (Designed, Configured, Enforced, Evidenced, Operated) has evidence; the authorizing official or assessor decides. Findings from a Zero Trust assessment enter the closure chain of [Book 11, Chapter 10](../../books/b11-zero-trust/10-evidence-not-verdicts.md#the-closure-chain).

## Unit 3: Where agencies are (3 minutes) {#azs-m5-unit-3}

Azure Policy has no variation listed between commercial Azure and Azure Government, but the FedRAMP initiatives exist in separate versions for each cloud, and built-in definitions differ by cloud: look them up where you are, as the lab does. A test that can't run because the cloud doesn't offer the feature is recorded as an environment decision, and the guide's [dangers table](../../books/guides/azure-security-implementation.md#dangers) lists assuming commercial features in Azure Government as a danger of its own.

**Watch.** The guide's narrated deck covers this module in its last three slides, *policy holds it; exemptions expire*, *owners, cadence, metrics and requirements* and *dangers, open questions and what comes next*. Its video is being exported; until then, read the narration in the [script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-azure-security/Guide_Azure_Security_Narration_Script.md).

## Exercise: Lab 2, a test subscription {#azs-m5-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Check the initiative's enforcement mode
az policy assignment show --name azs-security --scope /providers/Microsoft.Management/managementGroups/<mg-id> --query "{name:name, enforcementMode:enforcementMode}"

# Step 2: Look up one built-in definition in the cloud you're in
az policy definition list --query "[?displayName=='Virtual networks should be protected by Azure DDoS Protection'].{name:name, effects:parameters.effect.allowedValues}" -o json

# Step 3: Export this month's compliance
New-Item -ItemType Directory -Force -Path out
az policy state summarize --management-group <mg-id> -o json > out/policy-summary.json
az policy state list --management-group <mg-id> --filter "complianceState eq 'NonCompliant'" -o json > out/policy-noncompliant.json

# Step 4: List the exemptions with their category and expiry
az policy exemption list --management-group <mg-id> --filter "atScopeAndBelow()" --query "[].{name:name, category:exemptionCategory, expiresOn:expiresOn}" -o table

# Step 5: Compute exposure ownership and DDoS coverage from the register
az graph query -q "Resources | where type =~ 'microsoft.network/publicipaddresses' | project id, name, ddosMode = tostring(properties.ddosSettings.protectionMode), owner = tostring(tags['owner'])" --first 1000 -o json > out/public-ips.json
$ips = (Get-Content -Raw out/public-ips.json | ConvertFrom-Json).data
'Exposure ownership: {0} of {1}' -f @($ips | Where-Object { $_.owner }).Count, @($ips).Count
'DDoS coverage: {0} of {1}' -f @($ips | Where-Object { $_.ddosMode -in 'Enabled', 'VirtualNetworkInherited' }).Count, @($ips).Count

# Step 6: Back it out
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

You export the evidence Step 9 files each month from a test management group where someone has assigned the security initiative, list its exemptions, and compute two of the guide's metrics from the exposure register. Every command reads; the only thing written is the `out` folder on your own machine.

- **You need:** a test tenant's pilot management group, never production, with the guide's `azs-security` initiative assigned; Reader on the management group and its subscriptions; Azure CLI on a Windows machine with PowerShell 7, signed in as Module 1's step 1 shows.
- **You'll replace:** `<mg-id>` (the pilot management group).
- **Not run by the authors.** The expected results are the ones the guide's **Validate** steps state.

1. **Check the initiative's enforcement mode.**

    ```powershell
    az policy assignment show --name azs-security --scope /providers/Microsoft.Management/managementGroups/<mg-id> --query "{name:name, enforcementMode:enforcementMode}"
    ```

    `DoNotEnforce` during the audit phase; `Default` once the compliance review has passed.

2. **Look up one built-in definition in the cloud you're in.**

    ```powershell
    az policy definition list --query "[?displayName=='Virtual networks should be protected by Azure DDoS Protection'].{name:name, effects:parameters.effect.allowedValues}" -o json
    ```

3. **Export this month's compliance.**

    ```powershell
    New-Item -ItemType Directory -Force -Path out
    az policy state summarize --management-group <mg-id> -o json > out/policy-summary.json
    az policy state list --management-group <mg-id> --filter "complianceState eq 'NonCompliant'" -o json > out/policy-noncompliant.json
    ```

    Expected result, from the guide's Validate: `out/policy-summary.json` shows the initiative's compliance.

4. **List the exemptions with their category and expiry.** The listing is Learn's management-group example from the `az policy exemption list` reference, with the columns this step reads.

    ```powershell
    az policy exemption list --management-group <mg-id> --filter "atScopeAndBelow()" --query "[].{name:name, category:exemptionCategory, expiresOn:expiresOn}" -o table
    ```

    Expected result, from the guide's Validate: no exemption past its expiry without a renewal decision, and none without an expiry.

5. **Compute exposure ownership and DDoS coverage from the register.** The query is Module 1's; the arithmetic is the guide's [metrics](../../books/guides/azure-security-implementation.md#metrics) table, computed by this path. Exclude public IPs on NAT gateways by hand, as the metric says.

    ```powershell
    az graph query -q "Resources | where type =~ 'microsoft.network/publicipaddresses' | project id, name, ddosMode = tostring(properties.ddosSettings.protectionMode), owner = tostring(tags['owner'])" --first 1000 -o json > out/public-ips.json
    $ips = (Get-Content -Raw out/public-ips.json | ConvertFrom-Json).data
    'Exposure ownership: {0} of {1}' -f @($ips | Where-Object { $_.owner }).Count, @($ips).Count
    'DDoS coverage: {0} of {1}' -f @($ips | Where-Object { $_.ddosMode -in 'Enabled', 'VirtualNetworkInherited' }).Count, @($ips).Count
    ```

    The guide's target for both is 100%.

6. **Back it out.** The lab created nothing in Azure. File the two exports with their date, cloud, subscription and tester if this is a real review; otherwise delete the folder.

    ```powershell
    Remove-Item -Recurse -Force out
    ```

## Knowledge check (5 minutes) {#azs-m5-check}

1. When does the security initiative move from `DoNotEnforce` to `Default`?
    a. Immediately after assignment.
    b. After at least one evaluation cycle and a review of the non-compliant list with owners.
    c. Only after the assessor approves.

2. An exemption's expiry date has passed. What happens?
    a. It is deleted automatically.
    b. It is kept for the record but no longer honored; the guide reports expired exemptions each month.
    c. It renews for another year.

3. You roll Step 9 back to `DoNotEnforce`. What stays?
    a. Nothing.
    b. Resources a remediation task created, until removed.
    c. The deny effects.

4. Which is a metric the guide uses?
    a. "DDoS Protection is turned on."
    b. Public IPs with Network or IP Protection divided by public IPs, excluding NAT gateway IPs.
    c. The number of policies assigned.

5. When is a finding this guide addresses ready for closure?
    a. When the Zero Trust assessment shows a pass.
    b. When every applicable control state has evidence; the authorizing official or assessor decides.
    c. When the platform owner signs the RACI.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See Unit 1 and the guide's [Step 9](../../books/guides/azure-security-implementation.md#step-9-policy-and-drift).
2. **b.** See Unit 1.
3. **b.** See Unit 1 and the guide's [Step 9](../../books/guides/azure-security-implementation.md#step-9-policy-and-drift) How template.
4. **b.** See Unit 2 and the guide's [metrics](../../books/guides/azure-security-implementation.md#metrics).
5. **b.** See Unit 2 and the guide's [control states](../../books/guides/azure-security-implementation.md#control-states).
:::

## Summary (2 minutes) {#azs-m5-summary}

You checked the initiative's enforcement, exported the month's compliance and the exemption register, and computed two of the guide's metrics as coverage. **Evidence an ISSO keeps from this module:** the initiative definition and assignment exports, the monthly compliance exports, deny events, the exemption register with decision records, the RACI and review calendar, review records, exercise and failover records, and accepted risks with the authorizing official's signature.

::: {.callout-tip}
## Continue the path
[← Previous: Module 4](04-private-link-dns-and-key-vault.md) · [Learning path](index.md)
:::
