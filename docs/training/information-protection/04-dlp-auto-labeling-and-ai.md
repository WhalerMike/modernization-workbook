---
title: "Module 4: DLP, auto-labeling and AI"
description: "Guide Steps 8, 9 and 11: DLP designed from data outcomes, simulation as the pilot and enforcement ring by ring, with exceptions that stay narrow and expire; custom sensitive information types kept as code and service-side auto-labeling that moves from simulation to labeling only with the policy owner's approval; and Microsoft 365 Copilot, which honors the labels and permissions already built, with a DLP policy that keeps named labels out of Copilot. Lab 1 finds a retired policy back in simulation, an expired exception and an auto-labeling policy that turned itself on; Lab 2 reads each policy's mode in a test tenant."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 20"
series-order: 4
review-status: pending
---
# Module 4: DLP, auto-labeling and AI {.unnumbered}

*Part of the [Information Protection learning path](index.md). Guide [Step 8](../../books/guides/information-protection-implementation.md#step-8-dlp-and-endpoint-dlp), [Step 9](../../books/guides/information-protection-implementation.md#step-9-auto-labeling-and-sensitive-information-types) and [Step 11](../../books/guides/information-protection-implementation.md#step-11-ai-data-security). About 45 minutes, plus Lab 1 and Lab 2.*

## Introduction (3 minutes) {#ip-m4-introduction}

Labels protect what people label. DLP stops labeled and sensitive content leaving by the paths the agency cares about; auto-labeling finds what people didn't label; and AI assistants see only what their users can see, so the same controls govern them. Each of these acts on content at scale, so each moves from simulation to enforcement only by a recorded decision, and the export has to show which stage every policy is in.

## Learning objectives (1 minute) {#ip-m4-objectives}

By the end of this module, you'll be able to:

- design a DLP policy from a data outcome and run simulation as its pilot;
- keep exceptions narrow, in one register, with an approver and an expiry;
- test a custom sensitive information type and move an auto-labeling policy to labeling only with approval;
- explain how Copilot honors labels and usage rights, and keep named labels out of Copilot with DLP.

## Prerequisites (1 minute) {#ip-m4-prerequisites}

[Module 3](03-encryption-and-recovery.md).

## Unit 1: DLP from outcomes (10 minutes) {#ip-m4-unit-1}

Read [Book 20, Chapter 08](../../books/b20-information-protection/08-dlp-and-endpoint-controls.md): [design from data outcomes](../../books/b20-information-protection/08-dlp-and-endpoint-controls.md#design-from-data-outcomes), [simulation is the pilot](../../books/b20-information-protection/08-dlp-and-endpoint-controls.md#simulation-is-the-pilot), [exceptions without holes](../../books/b20-information-protection/08-dlp-and-endpoint-controls.md#exceptions-without-holes) and [endpoint DLP on Windows](../../books/b20-information-protection/08-dlp-and-endpoint-controls.md#endpoint-dlp-on-windows). DLP for SharePoint, OneDrive, email, Teams and endpoints is available in GCC; the simulation-mode dashboard isn't listed, so the program uses the `TestWithoutNotifications` mode as the pilot either way.

## Unit 2: Auto-labeling (10 minutes) {#ip-m4-unit-2}

Read [Book 20, Chapter 09](../../books/b20-information-protection/09-auto-labeling-and-sensitive-information-types.md): [the classifier ladder](../../books/b20-information-protection/09-auto-labeling-and-sensitive-information-types.md#the-classifier-ladder), [custom types as code](../../books/b20-information-protection/09-auto-labeling-and-sensitive-information-types.md#custom-types-as-code) and [service-side auto-labeling](../../books/b20-information-protection/09-auto-labeling-and-sensitive-information-types.md#how-service-side-auto-labeling-from-simulation-to-rollout). Two warnings matter: a simulation's "Not available" isn't zero matches, and the portal can turn a policy on by itself seven days after simulation if nobody edits it. The program leaves that option unselected.

## Unit 3: AI data security (8 minutes) {#ip-m4-unit-3}

Read [Book 20, Chapter 11](../../books/b20-information-protection/11-ai-data-security.md): [the AI data decisions](../../books/b20-information-protection/11-ai-data-security.md#the-ai-data-decisions) and [governing sensitive data in AI interactions](../../books/b20-information-protection/11-ai-data-security.md#how-govern-sensitive-data-in-ai-interactions). In GCC, DSPM for AI sees only Microsoft Copilot and supported AI sites and can't create the "browse to URL" policy, so endpoint DLP carries unapproved AI sites. The developer workbook's [Chapter 06](../../project-plans/developer-workbooks/information-protection/06-dlp-and-auto-labeling.md) holds every DLP and auto-labeling policy, including the Copilot one, to its planned stage.

## Exercise: Lab 1, fixtures, no tenant (20 minutes) {#ip-m4-lab-1}

Run the developer workbook's [Chapter 06 Lab 1](../../project-plans/developer-workbooks/information-protection/06-dlp-and-auto-labeling.md#lab-1-fixtures-no-tenant). It has the exact commands and what each printed; this module doesn't repeat them.

- **What you'll see:** a retired DLP ring policy back in simulation; a partner domain still excepted after its register entry expired; an auto-labeling policy labeling while the plan has it in simulation.
- **What to look for:** the message says which way each policy moved: enforcing early, or enforcement off.
- **Back-out:** the lab ends by deleting `out`.

## Exercise: Lab 2, a test tenant {#ip-m4-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Connect to Security & Compliance PowerShell
Connect-IPPSSession -UserPrincipalName <admin-upn>

# Step 2: Read the DLP policies and rules
Get-DlpCompliancePolicy | Format-Table Name, Mode, Enabled, Workload
Get-DlpComplianceRule | Format-Table Name, Policy, Disabled

# Step 3: Read the auto-labeling policies
Get-AutoSensitivityLabelPolicy | Format-List Name,Mode,Enabled,SharePointLocation

# Step 4: Back it out
Disconnect-ExchangeOnline -Confirm:$false
```

:::

<!-- labs:end -->

You read each DLP and auto-labeling policy's mode, as the guide's G8, G9 and G11 Validate steps do. Every step reads.

- **You need:** a test tenant with at least one DLP policy and one auto-labeling policy created in simulation, as Book 20's Chapters 08 and 09 show.
- **You'll replace:** `<admin-upn>`.

1. **Connect to Security & Compliance PowerShell.**

    ```powershell
    Connect-IPPSSession -UserPrincipalName <admin-upn>
    ```

2. **Read the DLP policies and rules.**

    ```powershell
    Get-DlpCompliancePolicy | Format-Table Name, Mode, Enabled, Workload
    Get-DlpComplianceRule | Format-Table Name, Policy, Disabled
    ```

    Expected result, as the guide states it: each production policy is `Enable`, retired ring policies are `Disable`, and nothing is in a test mode the rollout plan doesn't put there.

3. **Read the auto-labeling policies.**

    ```powershell
    Get-AutoSensitivityLabelPolicy | Format-List Name,Mode,Enabled,SharePointLocation
    ```

    Expected result: a policy still in simulation says `TestWithoutNotifications` or `TestWithNotifications`; none says `Enable` without an approval in the change record.

4. **Back it out.** Nothing changed in the tenant. Disconnect:

    ```powershell
    Disconnect-ExchangeOnline -Confirm:$false
    ```

## Knowledge check (5 minutes) {#ip-m4-knowledge-check}

1. Where does a DLP policy start?
    a. From a Microsoft template, enforced for everyone.
    b. From a data outcome, in simulation for a pilot group.
    c. From the last incident.

2. A partner agreement ended last month, but the domain is still an exception in the production rule. What finds it?
    a. Nothing, until someone notices.
    b. The exception register's expiry, checked against the exceptions in the export.
    c. The DLP alert queue.

3. An auto-labeling policy is in `Enable` though nobody approved it. What is a likely cause?
    a. The portal's option to turn it on seven days after simulation was left selected.
    b. Simulation always ends in `Enable`.
    c. GCC turns policies on by default.

4. How does Microsoft 365 Copilot treat a file labeled CUI Specified that the user can't open?
    a. It summarizes it anyway.
    b. It works in the user's security context and honors labels and their usage rights, so it can't use content the user can't.
    c. It needs a separate permission set.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** [Book 20, Chapter 08](../../books/b20-information-protection/08-dlp-and-endpoint-controls.md#design-from-data-outcomes).
2. **b.** [Chapter 06 of the developer workbook](../../project-plans/developer-workbooks/information-protection/06-dlp-and-auto-labeling.md#the-code).
3. **a.** [Book 20, Chapter 09](../../books/b20-information-protection/09-auto-labeling-and-sensitive-information-types.md#how-service-side-auto-labeling-from-simulation-to-rollout).
4. **b.** [Book 20, Chapter 11](../../books/b20-information-protection/11-ai-data-security.md#why-ai-changes-the-problem-not-the-controls).
:::

## Summary (2 minutes) {#ip-m4-summary}

DLP from outcomes, simulation as the pilot, and exceptions that expire; auto-labeling that labels only with approval; and AI governed by the labels and DLP already built. **Federal requirements:** G8, G9 and G11 support AC-4, MP-7, SI-4, IR-4, AC-16, CM-12 and AC-6, with KSI-SVC-SIN, KSI-SVC-RUD, KSI-MLA-RVL, KSI-SVC-ACM and KSI-MLA-LET, as the guide's [Requirements and KSIs](../../books/guides/information-protection-implementation.md#requirements-and-ksis) table sets out; the agency's assessor decides whether a control is satisfied.

## Continue the path

[← Previous: Module 3 — Encryption and recovery](03-encryption-and-recovery.md) · [Path index](index.md) · [Next: Module 5 — Audit, drift and evidence →](05-audit-drift-and-evidence.md)
