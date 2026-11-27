---
title: "Module 2: Labels, publication and containers"
description: "Guide Steps 2, 3 and 4: a small label taxonomy with markings and rights that go to groups, never individuals; publishing it through a pilot policy with defaults the agency can justify and mandatory labeling; container labels that govern privacy, guests, sharing and unmanaged devices for teams and sites; and why a label is never deleted. Lab 1 finds four faults on the kit's fixtures; Lab 2 exports a test tenant's labels and policies and finds the labeled sample in the audit log."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 20"
series-order: 2
review-status: approved
reviewed-sha256: e69d42e93654ab8b32c889d80937517a5f058da95cfb3882d51d5f059225247b
last-reviewed: 2026-11-25
---
# Module 2: Labels, publication and containers {.unnumbered}

*Part of the [Information Protection learning path](index.md). Guide [Step 2](../../books/guides/information-protection-implementation.md#step-2-the-label-taxonomy), [Step 3](../../books/guides/information-protection-implementation.md#step-3-publication-and-defaults) and [Step 4](../../books/guides/information-protection-implementation.md#step-4-container-labels). About 40 minutes, plus Lab 1 and Lab 2.*

## Introduction (3 minutes) {#ip-m2-introduction}

A label is a promise about who can open the content. It carries a marking people see and, for CUI, encryption that decides who can open it anywhere. Users get labels through policies, with a default that's right more often than it's wrong. Teams and sites get container labels that decide who can come in. This module covers the taxonomy, its publication and the containers, and what the export has to show for each.

## Learning objectives (1 minute) {#ip-m2-objectives}

By the end of this module, you'll be able to:

- explain the program's taxonomy and why rights go to groups or the domain, never individuals;
- publish labels through a pilot policy first, set defaults and mandatory labeling, and explain the downgrade justification;
- explain what a container label governs and what it doesn't (the files inside don't inherit it);
- check the export against the design, and say why an unplanned label is unpublished, never deleted.

## Prerequisites (1 minute) {#ip-m2-prerequisites}

[Module 1](01-classes-access-and-the-baseline.md).

## Unit 1: The taxonomy (8 minutes) {#ip-m2-unit-1}

Read [Book 20, Chapter 02](../../books/b20-information-protection/02-sensitivity-label-architecture.md): [the taxonomy](../../books/b20-information-protection/02-sensitivity-label-architecture.md#b20-02-the-taxonomy-from-classes-to-labels) (Public, Internal, CUI Basic, a CUI Specified sublabel per authority held, and three site labels) and [the encryption settings](../../books/b20-information-protection/02-sensitivity-label-architecture.md#b20-02-encryption-settings): administrator-defined rights for every file label, to mail-enabled groups, Microsoft 365 groups or the tenant's domain, never individuals; content never set to expire by default. The `New-Label` syntax is in [Book 12, Chapter 09](../../books/b12-security-operations/09-data-protection-and-classification.md#the-label-taxonomy-as-code). In GCC, manual and mandatory labels are available; the label groups migration isn't listed and is irreversible.

## Unit 2: Publication and defaults (10 minutes) {#ip-m2-unit-2}

Read [Book 20, Chapter 03](../../books/b20-information-protection/03-label-publication-and-defaults.md): [defaults the agency can justify](../../books/b20-information-protection/03-label-publication-and-defaults.md#b20-03-defaults-the-agency-can-justify), mandatory labeling with a justification for every downgrade, and the [labeled-sample test](../../books/b20-information-protection/03-label-publication-and-defaults.md#b20-03-validate-a-labeled-sample). The default label is set per policy, by the label's GUID. In GCC, the SharePoint library default label and "default label policies to ensure documents being edited" are in development.

## Unit 3: Containers (8 minutes) {#ip-m2-unit-3}

Read [Book 20, Chapter 04](../../books/b20-information-protection/04-teams-groups-and-sharepoint-containers.md): [container classes and their settings](../../books/b20-information-protection/04-teams-groups-and-sharepoint-containers.md#b20-04-container-classes-and-their-settings) and the [five tests](../../books/b20-information-protection/04-teams-groups-and-sharepoint-containers.md#b20-04-validate). A container label sets privacy, guest access, sharing and unmanaged-device access; the files inside don't inherit it. Authentication context through labels is on the engineering backlog in GCC, so the unmanaged-device setting and its Conditional Access policy carry that part. The developer workbook's [Chapter 04](../../project-plans/developer-workbooks/information-protection/04-labels-policies-and-containers.md) checks the export against the plan, label by label and policy by policy.

## Exercise: Lab 1, fixtures, no tenant (20 minutes) {#ip-m2-lab-1}

Run the developer workbook's [Chapter 04 Lab 1](../../project-plans/developer-workbooks/information-protection/04-labels-policies-and-containers.md#lab-1-fixtures-no-tenant). It has the exact commands and what each printed; this module doesn't repeat them.

<!-- labs:begin module-lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #module-lab-1-commands collapse="false" title="The Lab 1 commands, on the fixtures"}
Every command in [Chapter 04 Lab 1](../../project-plans/developer-workbooks/information-protection/04-labels-policies-and-containers.md#lab-1-fixtures-no-tenant), in order, on the kit's fixtures, with no tenant.

The chapter's steps say what each command does and what to look for.

```powershell
Set-Location C:\FMWLabs\information-protection-code\information-protection

$Run = "C:\FMWLabs\results\information-protection-04\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Run the label check
./Invoke-IpLabels.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath "$Run/labels" -AsOf 2026-11-24T12:00:00Z

# Step 2: Read the label table
Import-Csv "$Run/labels/labels.csv" | Format-Table Label, Priority, Encryption, Header, RightsTo -AutoSize

# Step 3: See a policy's settings as the export holds them
(Get-Content tests/fixtures/snapshots/2026-11-24/label-policies.json | ConvertFrom-Json)[0].Settings

# Step 4: Run the chapter's tests
Invoke-Pester -Path tests/Kit.Tests.ps1 -TagFilter ch04 -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Get-ChildItem C:\FMWLabs\results\information-protection-04\lab1 -Name
```
:::

<!-- labs:end -->

- **What you'll see:** a person added to the CUI Specified label's rights; guests allowed on the CUI Specified site label; a legacy label the plan doesn't have; the production policy missing a site label.
- **What to look for:** the default label settings pass, because the check resolves the policy's GUIDs to label names.
- **Back-out:** nothing to delete. The lab leaves the kit's folder as you unzipped it and keeps its results in a dated run folder under `C:\FMWLabs\results`, so you can run it again and compare.

## Exercise: Lab 2, a test tenant {#ip-m2-lab-2}
*Not timed. Not run by the authors. Never production.*

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
# Step 1: Connect to Security & Compliance PowerShell
Connect-IPPSSession -UserPrincipalName <admin-upn>

# Step 2: List and save the labels
Get-Label | Sort-Object Priority | Format-Table Priority, Name, DisplayName, ContentType, ParentId
Get-Label | ConvertTo-Json -Depth 10 | Out-File "<evidence-folder>\labels.json" -Encoding utf8

# Step 3: List and save the policies
Get-LabelPolicy | Sort-Object Priority | Format-Table Name, Priority
Get-LabelPolicy | Select-Object Name, Priority, Labels, ExchangeLocation, ExchangeLocationException, Settings | ConvertTo-Json -Depth 6 | Out-File "<evidence-folder>\label-policies.json" -Encoding utf8

# Step 4: Switch to Exchange Online PowerShell and find the labeled sample
Disconnect-ExchangeOnline -Confirm:$false
Connect-ExchangeOnline -UserPrincipalName <admin-upn>
Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-1) -EndDate (Get-Date) -UserIds '<pilot-user-upn>' -RecordType SensitivityLabelAction -ResultSize 100 | Select-Object CreationDate, Operations, UserIds

# Step 5: Back it out
Disconnect-ExchangeOnline -Confirm:$false
```

:::

<!-- labs:end -->

You export the labels and policies and find the labeled sample in the audit log, as the guide's G2 and G3 Validate steps do. Every step reads.

- **You need:** a test tenant where [Chapter 02's How section](../../books/b20-information-protection/02-sensitivity-label-architecture.md#b20-02-how-build-the-taxonomy-in-a-test-tenant) built the taxonomy and [Chapter 03](../../books/b20-information-protection/03-label-publication-and-defaults.md) published a pilot policy, and a pilot user who ran the labeled-sample test today.
- **You'll replace:** `<admin-upn>`, `<pilot-user-upn>` and `<evidence-folder>`.

1. **Connect to Security & Compliance PowerShell.**

    ```powershell
    Connect-IPPSSession -UserPrincipalName <admin-upn>
    ```

2. **List and save the labels.**

    ```powershell
    Get-Label | Sort-Object Priority | Format-Table Priority, Name, DisplayName, ContentType, ParentId
    Get-Label | ConvertTo-Json -Depth 10 | Out-File "<evidence-folder>\labels.json" -Encoding utf8
    ```

    Expected result, as the guide states it: one row per label in the design table, in its priority order, with no label the design doesn't have.

3. **List and save the policies.**

    ```powershell
    Get-LabelPolicy | Sort-Object Priority | Format-Table Name, Priority
    Get-LabelPolicy | Select-Object Name, Priority, Labels, ExchangeLocation, ExchangeLocationException, Settings | ConvertTo-Json -Depth 6 | Out-File "<evidence-folder>\label-policies.json" -Encoding utf8
    ```

    Expected result: each policy's labels, scope, exclusion group and settings as designed, in the designed order.

4. **Switch to Exchange Online PowerShell and find the labeled sample.**

    ```powershell
    Disconnect-ExchangeOnline -Confirm:$false
    Connect-ExchangeOnline -UserPrincipalName <admin-upn>
    Search-UnifiedAuditLog -StartDate (Get-Date).AddDays(-1) -EndDate (Get-Date) -UserIds '<pilot-user-upn>' -RecordType SensitivityLabelAction -ResultSize 100 | Select-Object CreationDate, Operations, UserIds
    ```

    Expected result: an event for each step of the sample. If `SensitivityLabelAction` returns nothing, Book 20 says to search without `-RecordType` and filter on the operation names.

5. **Back it out.** Nothing changed in the tenant. Disconnect:

    ```powershell
    Disconnect-ExchangeOnline -Confirm:$false
    ```

## Knowledge check (5 minutes) {#ip-m2-knowledge-check}

1. A data owner asks for their own account to be added to a CUI Specified label's rights "just for this project". What does the program do?
    a. Add it, with an expiry.
    b. Add the person to the authorized-holder group, if the owner approves; rights go to groups, never individuals.
    c. Create a new label.

2. The export shows a label the design doesn't have. What is the fix?
    a. Delete it.
    b. Unpublish it from every policy, or add it to the design with a decision record; content that carries it keeps its meaning.
    c. Rename it.

3. A CUI file is saved in a site labeled `Internal site`. Is the file protected?
    a. Yes: it inherits the site's label.
    b. Only by its own label: container labels don't flow to the files inside.
    c. Only if the site is private.

4. In GCC, the SharePoint library default label is in development. What is the interim path?
    a. Wait for it.
    b. Owners label existing files, and a service-side auto-labeling policy scoped to the site catches new ones; IRM stays on a library until its files are labeled.
    c. Use the commercial cloud.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** [Book 20, Chapter 02, Encryption settings](../../books/b20-information-protection/02-sensitivity-label-architecture.md#b20-02-encryption-settings).
2. **b.** [Book 20, Chapter 12, Change control](../../books/b20-information-protection/12-operations-and-evidence.md#change-control-for-information-protection).
3. **b.** [Book 12, Chapter 09](../../books/b12-security-operations/09-data-protection-and-classification.md#labels-on-teams-groups-and-sites).
4. **b.** [The guide's GCC gaps](../../books/guides/information-protection-implementation.md#government-cloud-availability).
:::

## Summary (2 minutes) {#ip-m2-summary}

A small taxonomy with rights to groups; publication through a pilot with justified defaults; container labels for the places content lives; and the export checked against the design, never "fixed" by deleting a label. **Federal requirements:** G2 to G4 support AC-16, MP-3, AT-2, AC-3 and AC-21, with KSI-SVC-ACM and KSI-MLA-RVL, as the guide's [Requirements and KSIs](../../books/guides/information-protection-implementation.md#requirements-and-ksis) table sets out; the agency's assessor decides whether a control is satisfied.

## Continue the path

[← Previous: Module 1 — Classes, access and the baseline](01-classes-access-and-the-baseline.md) · [Path index](index.md) · [Next: Module 3 — Encryption and recovery →](03-encryption-and-recovery.md)
