---
title: "Module 1: Classes, access and the baseline"
description: "Guide Steps 1 and 12: the data classes and their owners before any label, what Purview doesn't offer in GCC and the interim paths, the three shells and the read roles through PIM, a read that checks its tenant, and the configuration baseline export every later check reads. Lab 1 on the kit's fixtures; Lab 2 counts content and reads the type catalog in a test tenant."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 20"
series-order: 1
review-status: approved
reviewed-sha256: 7eb6ab41d77ad18a63bac42f59422e0c2744f7847dc5b06f6121068552570533
last-reviewed: 2026-11-25
---
# Module 1: Classes, access and the baseline {.unnumbered}

*Part of the [Information Protection learning path](index.md). Guide [Step 1](../../books/guides/information-protection-implementation.md#step-1-classes-decisions-and-inventory) and the baseline of [Step 12](../../books/guides/information-protection-implementation.md#step-12-operations-and-evidence). About 40 minutes, plus Lab 1 and Lab 2.*

## Introduction (3 minutes) {#ip-m1-introduction}

Nothing in Purview protects data the agency hasn't classified. Book 20 starts with the classes: what each is, who owns it, which authority binds it, and where its content already lives. Then it needs a way to read the tenant that every later step trusts: the right tenant, the right roles, and a dated export to compare against. This module covers both, and the list of what GCC doesn't offer, which shapes every later module.

## Learning objectives (1 minute) {#ip-m1-objectives}

By the end of this module, you'll be able to:

- explain why the class register and decision records come before the first label;
- name the six Purview features the design uses that GCC doesn't offer, and the interim path for each;
- connect the three shells in GCC with read roles held through PIM, and say why the read checks its tenant;
- export the configuration baseline and say which files it holds and why audit status is read in Exchange Online PowerShell.

## Prerequisites (1 minute) {#ip-m1-prerequisites}

The path's [prerequisites](index.md#ip-prerequisites), and the kit unzipped as [Get the code](index.md#get-the-code) says.

## Unit 1: Classes before labels (8 minutes) {#ip-m1-unit-1}

Read [Book 20, Chapter 01](../../books/b20-information-protection/01-data-inventory-and-classification.md): [the authoritative data classes](../../books/b20-information-protection/01-data-inventory-and-classification.md#b20-01-the-authoritative-data-classes), [the federal overlay decisions](../../books/b20-information-protection/01-data-inventory-and-classification.md#b20-01-the-federal-overlay-decisions) and the [decision record template](../../books/b20-information-protection/01-data-inventory-and-classification.md#decision-record-template). Each class has an owner, an authority and a handling rule; each control later gets a decision record that names its license, its cloud availability and its compensating control. The CUI framework behind the classes is [Book 12, Chapter 09](../../books/b12-security-operations/09-data-protection-and-classification.md). Then the [inventory](../../books/b20-information-protection/01-data-inventory-and-classification.md#b20-01-inventory-find-where-the-data-already-is): content explorer counts what each sensitive information type finds, so the rollout starts where the data is.

## Unit 2: What GCC doesn't offer (8 minutes) {#ip-m1-unit-2}

Read the guide's [GCC availability by feature](../../books/guides/information-protection-implementation.md#government-cloud-availability), read on Learn on November 24, 2026. Six features the design would use aren't available in GCC: the SharePoint library default label, authentication context through site labels, Teams data in content explorer, client-side auto-labeling on Office mobile, the Communication Compliance retention period per policy, and DSPM for AI beyond Microsoft Copilot and supported AI sites. Each gets a decision record with its interim path; none is a failed control. Three more aren't listed at all and are *not yet specified*: the super user feature, SharePoint label integration and DLP simulation mode.

## Unit 3: One read path, one baseline (10 minutes) {#ip-m1-unit-3}

Read the guide's [shells table](../../books/guides/information-protection-implementation.md#prerequisites): Security & Compliance PowerShell and Exchange Online PowerShell need no extra parameters in GCC; Rights Management uses the AIPService module. Then [Book 20, Chapter 12's configuration baseline](../../books/b20-information-protection/12-operations-and-evidence.md#the-configuration-baseline): nine dated JSON files that every later export is compared with. The developer workbook's [Chapter 01](../../project-plans/developer-workbooks/information-protection/01-access-and-the-read-path.md) and [Chapter 02](../../project-plans/developer-workbooks/information-protection/02-the-baseline-export.md) turn it into one export that reads one shell at a time and stops if the session's tenant isn't the one the settings name.

## Exercise: Lab 1, fixtures, no tenant (20 minutes) {#ip-m1-lab-1}

Run the developer workbook's [Chapter 01 Lab 1](../../project-plans/developer-workbooks/information-protection/01-access-and-the-read-path.md#lab-1-fixtures-no-tenant), [Chapter 02 Lab 1](../../project-plans/developer-workbooks/information-protection/02-the-baseline-export.md#lab-1-fixtures-no-tenant) and [Chapter 03 Lab 1](../../project-plans/developer-workbooks/information-protection/03-the-data-inventory.md#lab-1-fixtures-no-tenant). They have the exact commands and what each printed; this module doesn't repeat them.

- **What you'll see:** a person holding an investigator role the register doesn't name; an export of a fictional tenant, one shell at a time; a class naming a sensitive information type the tenant doesn't have, and one with no owner.
- **What to look for:** the manifest of the export, which lists each read and its count, and where most of the content sits.
- **Back-out:** nothing to delete. Each lab leaves the kit's folder as you unzipped it and keeps its results in a dated run folder under `C:\FMWLabs\results`, so you can run it again and compare.

## Exercise: Lab 2, a test tenant {#ip-m1-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Connect to Security & Compliance PowerShell
Connect-IPPSSession -UserPrincipalName <admin-upn>

# Step 2: Export the type catalog
Get-DlpSensitiveInformationType | Select-Object Name, Id, Publisher | Export-Csv "<evidence-folder>\sit-catalog.csv" -NoTypeInformation -Encoding UTF8

# Step 3: Count one type's content in SharePoint
$page = Export-ContentExplorerData -TagType SensitiveInformationType -TagName 'U.S. Social Security Number (SSN)' -ConfidenceLevel high -Workload SharePoint -PageSize 1000
$page[0] | Select-Object TotalCount, MorePagesAvailable

# Step 4: Back it out
Disconnect-ExchangeOnline -Confirm:$false
```

:::

<!-- labs:end -->

You read the tenant's type catalog and count one type's content, as the guide's G1 Validate step does. Every step reads.

- **You need:** a test tenant with some test content containing the Social Security number type (test values your security team keeps for DLP tests, never real numbers), and an account holding Compliance Administrator and Content Explorer List viewer through PIM.
- **You'll replace:** `<admin-upn>` (your account) and `<evidence-folder>` (a folder inside the agency's boundary).

1. **Connect to Security & Compliance PowerShell.**

    ```powershell
    Connect-IPPSSession -UserPrincipalName <admin-upn>
    ```

2. **Export the type catalog.**

    ```powershell
    Get-DlpSensitiveInformationType | Select-Object Name, Id, Publisher | Export-Csv "<evidence-folder>\sit-catalog.csv" -NoTypeInformation -Encoding UTF8
    ```

    Expected result, as the guide states it: every type your class register names is in the file.

3. **Count one type's content in SharePoint.**

    ```powershell
    $page = Export-ContentExplorerData -TagType SensitiveInformationType -TagName 'U.S. Social Security Number (SSN)' -ConfidenceLevel high -Workload SharePoint -PageSize 1000
    $page[0] | Select-Object TotalCount, MorePagesAvailable
    ```

    Expected result: a count returns. Zero is a result too, if no test content has been classified yet.

4. **Back it out.** Nothing changed in the tenant. Disconnect:

    ```powershell
    Disconnect-ExchangeOnline -Confirm:$false
    ```

## Knowledge check (5 minutes) {#ip-m1-knowledge-check}

1. A ScubaGear test on a Purview feature is skipped because the feature is in development in GCC. How does the program record it?
    a. As a failed control, to be fixed.
    b. As an environment fact, with a decision record naming the compensating control.
    c. As a pass.

2. Which shell gives the true value of `UnifiedAuditLogIngestionEnabled`?
    a. Security & Compliance PowerShell.
    b. Exchange Online PowerShell.
    c. Either.

3. Why does the export call `Get-ConnectionInformation` before reading?
    a. To check the module version.
    b. To compare the session's tenant with the settings, so a clean answer from the wrong tenant can't pass.
    c. To find the GCC endpoint.

4. A class in the register names a type the tenant's catalog doesn't have. What happens?
    a. Content explorer counts it as zero and the check passes.
    b. The inventory check fails for that class, and the export doesn't ask for it.
    c. The export stops.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** A feature Learn lists as in development, or doesn't list, for GCC is an environment fact ([the guide](../../books/guides/information-protection-implementation.md#government-cloud-availability); [Book 11, Chapter 10](../../books/b11-zero-trust/10-evidence-not-verdicts.md#a-normalized-result-taxonomy)).
2. **b.** In Security & Compliance PowerShell the property always reads `False` ([the guide's G10](../../books/guides/information-protection-implementation.md#step-10-audit-insider-risk-and-communication-compliance)).
3. **b.** [Chapter 02](../../project-plans/developer-workbooks/information-protection/02-the-baseline-export.md#runners).
4. **b.** [Chapter 03](../../project-plans/developer-workbooks/information-protection/03-the-data-inventory.md#the-code).
:::

## Summary (2 minutes) {#ip-m1-summary}

Classes and decision records come first; GCC's gaps are decisions, not failures; one read path in the right tenant feeds every check; and the baseline export is the Configured evidence for the whole book. **Federal requirements:** this module's gates support RA-2, CM-12, PM-5(1) and AC-6 (G1) and CM-3 and CA-7 (the baseline), with KSI-PIY-GIV, KSI-IAM-ELP, KSI-SVC-ACM and KSI-CMT-LMC, as the guide's [Requirements and KSIs](../../books/guides/information-protection-implementation.md#requirements-and-ksis) table sets out; the agency's assessor decides whether a control is satisfied.

## Continue the path

[Path index](index.md) · [Next: Module 2 — Labels, publication and containers →](02-labels-publication-and-containers.md)
