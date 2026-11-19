---
title: "Chapter 02 — The Workbook Template and Its Validator"
description: "The guide's Step 2 as code: the workbook's gallery template (Notebook/1.0), built from the manifest and one KQL file per query, with a header, five parameters, one tab per daily check and every query scoped to the workspace parameter; and a validator, DC-V-01 to DC-V-10, that checks the kit's template or any copy exported from the portal's Advanced Editor against the manifest: tabs, tables, look-backs, the workspace scope, the not-evidence banner, link-outs and their hosts, the telemetry list, and no GUIDs, subscription paths, addresses or secrets. Labs against the kit's template, an edited export and a test workspace."
doc-type: workbook-chapter
audience: [Technical]
family: dw-daily-checks
part: How
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 02 — The Workbook Template and Its Validator

*A workbook edited in the portal is a change nobody reviewed. Keep it as a file, and check every copy against the manifest.*

::: {.callout-note}
## In this chapter
The code behind the guide's [Step 2](../../../books/guides/daily-checks-dashboard-implementation.md#step-2). You start with Learn's workbook ARM template page, which explains the Advanced Editor's Gallery Template and ARM template tabs, shows `serializedData`, and advises masking the sensitive values an export embeds. Then you read how the kit builds its template from the manifest and `queries/*.kql`, and the ten checks its validator runs. Lab 1 confirms the template is the build, validates it, finds the four edits in a copy exported after someone changed the workbook in the portal, and records a validation. Lab 2 saves a test copy in the portal, exports it and validates the export.
:::

## Goal and audience

**Goal.** By the end of this chapter you can rebuild the workbook's template from reviewed files, prove a template has one tab per daily check and no embedded IDs, and catch the portal edits that would otherwise drift into production unreviewed.

**Audience.** Developers who maintain the kit, and the security operations engineer who edits the workbook. No tenant until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

Learn explains two ways to manage a workbook as an ARM template: a workbook template, copied from the **Gallery Template** tab of the **Advanced Editor**, and a workbook instance, copied from the **ARM template** view. Its sample instance is a `Microsoft.Insights/workbooks` resource with `kind` `shared` and properties `displayName`, `serializedData` (the workbook's content, `{"version":"Notebook/1.0","items":[...]}`), `version`, `sourceId` and `category`; `workbookSourceId` is the resource the workbook is associated with. Learn warns that an exported template often embeds "potentially sensitive values such as subscription ID and resource group name," and that it's "a best practice to mask out any embedded sensitive values."[^dc02-arm] The resource reference gives API version 2023-06-01, with `kind` "Only valid value is shared."[^dc02-ref] Workbooks query Log Analytics workspaces through the `Logs (Analytics)` data source with KQL.[^dc02-sources]

### What it leaves to you

Each row is pinned by a test in the `Chapter 02` block of `tests/DailyChecks.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| Export from the portal, paste into a template | The template is whatever someone last saved | `New-DcTemplate` builds it from the manifest and `queries/*.kql`; a test keeps the committed file equal to the build |
| Mask embedded IDs by hand | A missed one goes into a public repository | DC-V-10 fails any GUID, subscription path, e-mail address, credential, `fallbackResourceIds` or parameter value in the template |
| A query is free text | A query can read a table nobody declared, or a month of data | DC-V-03 (tables per tab) and DC-V-04 (look-back per query) |
| Each query names its own resources | One query can read a different workspace than the rest | DC-V-05: every query reads the `{Workspace}` parameter |
| Nothing says what a tab means | A green tab is read as proof | DC-V-06: the not-evidence banner on every tab; DC-V-07: each manifest link-out, and only allowed hosts |

## The code

### The template

`New-DcTemplate` returns the gallery template: a header with the banner; a parameters item (`Workspace`, a resource picker filtered to Log Analytics workspaces, and four text parameters); a links item styled as tabs, one per manifest tab, each setting `selectedTab`; and one group per tab, visible when `selectedTab` is its id, holding a text item (the banner, the daily check, what to do, the link-outs with click paths, the GCC note) and one query item per manifest query, each a `KqlItem/1.0` with `queryType` 0, `resourceType` `microsoft.operationalinsights/workspaces` and `crossComponentResources` `["{Workspace}"]`. Every parameter value is empty and `fallbackResourceIds` is empty: Chapter 04's plan fills them per environment. `New-DcWorkbookTemplate.ps1` writes it to `workbook/daily-checks.workbook.json`; `-Check` compares.

### The validator

| Check | What it looks for |
|---|---|
| DC-V-01 | The file is a Notebook/1.0 gallery template |
| DC-V-02 | One tab link per manifest tab, in order, and one group per tab |
| DC-V-03 | Each tab's queries read its declared tables, and no table declared for another tab |
| DC-V-04 | Each query has an `ago()` look-back within the manifest's limit |
| DC-V-05 | Each query reads the `{Workspace}` parameter as a Logs query |
| DC-V-06 | Each tab carries the not-evidence banner |
| DC-V-07 | Each tab carries its manifest link-outs; every link goes to an allowed host or a parameter |
| DC-V-08 | Link-out tabs have no query; workbook tabs have every manifest query |
| DC-V-09 | The telemetry query's expected list equals the manifest's, limit for limit |
| DC-V-10 | No GUID, subscription path, e-mail address, credential, `fallbackResourceIds` or parameter value |

`Test-DcWorkbook.ps1` prints a line per check and every failure, and exits 1 on any failure; with `-OutputPath` it writes `results.json` and a hashed `manifest.json` for Chapter 04's evidence.

::: {.callout-important}
## Illustrative code
Lab 1 reads files only. The template's item format follows what the portal's Advanced Editor exports; Lab 2 round-trips it through the portal.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/daily-checks-workbook`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/daily-checks-workbook`. Each step below says what it does and what to look for.

```powershell
# Step 1: Confirm the committed template is the build of the manifest and the queries
./New-DcWorkbookTemplate.ps1 -Check

# Step 2: Validate it
./Test-DcWorkbook.ps1

# Step 3: Validate a copy exported after someone edited the workbook in the portal
./Test-DcWorkbook.ps1 -TemplatePath tests/fixtures/exported/edited.workbook.json

# Step 4: See what the export carried into its fallbackResourceIds
Import-Module ./powershell/DailyChecks/DailyChecks.psm1
(Read-DcJson -Path tests/fixtures/exported/edited.workbook.json).fallbackResourceIds

# Step 5: Record a validation of the kit's template
./Test-DcWorkbook.ps1 -OutputPath out/validate -AsOf 2026-11-16T07:05:00Z
(Test-DcRunFolder -Path out/validate).Detail

# Step 6: Run this chapter's tests
Invoke-Pester -Path tests/DailyChecks.Tests.ps1 -FullNameFilter 'Chapter 02*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Confirm the committed template is the build of the manifest and the queries:**

   ```powershell
   ./New-DcWorkbookTemplate.ps1 -Check
   ```

   <!-- capture:begin 02-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/dc/02-1.txt))](captures/02-1.png){.lightbox fig-alt="Terminal window showing ./New-DcWorkbookTemplate.ps1 -Check and what it printed"}

   <!-- capture:end -->

   The committed file matches the build.

2. **Validate it:**

   ```powershell
   ./Test-DcWorkbook.ps1
   ```

   <!-- capture:begin 02-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/dc/02-2.txt))](captures/02-2.png){.lightbox fig-alt="Terminal window showing ./Test-DcWorkbook.ps1 and what it printed"}

   <!-- capture:end -->

   All 63 checks pass.

3. **Validate a copy exported after someone edited the workbook in the portal.** Four edits, four failures:

   ```powershell
   ./Test-DcWorkbook.ps1 -TemplatePath tests/fixtures/exported/edited.workbook.json
   ```

   <!-- capture:begin 02-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/dc/02-3.txt))](captures/02-3.png){.lightbox fig-alt="Terminal window showing ./Test-DcWorkbook.ps1 -TemplatePath tests/fixtures/exported/edited.workbook.json and what it printed"}

   <!-- capture:end -->

   Four failures, and exit code 1: one risk query reads a workspace path instead of `{Workspace}` (DC-V-05), the devices query looks back 720 hours (DC-V-04), the grants tab lost its banner (DC-V-06), and the file carries a GUID and a subscription path (DC-V-10).

4. **See what the export carried into its `fallbackResourceIds`:**

   ```powershell
   Import-Module ./powershell/DailyChecks/DailyChecks.psm1
   (Read-DcJson -Path tests/fixtures/exported/edited.workbook.json).fallbackResourceIds
   ```

   <!-- capture:begin 02-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/dc/02-4.txt))](captures/02-4.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/DailyChecks/DailyChecks.psm1 and what it printed"}

   <!-- capture:end -->

   The workspace's full resource path: what Learn says to mask.

5. **Record a validation of the kit's template:**

   ```powershell
   ./Test-DcWorkbook.ps1 -OutputPath out/validate -AsOf 2026-11-16T07:05:00Z
   (Test-DcRunFolder -Path out/validate).Detail
   ```

   <!-- capture:begin 02-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/dc/02-5.txt))](captures/02-5.png){.lightbox fig-alt="Terminal window showing ./Test-DcWorkbook.ps1 -OutputPath out/validate -AsOf 2026-11-16T07:05:00Z and what it printed"}

   <!-- capture:end -->

   `1 file matches the manifest`: the folder is ready for Chapter 04's evidence record.

6. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/DailyChecks.Tests.ps1 -FullNameFilter 'Chapter 02*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 02-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/dc/02-6.txt))](captures/02-6.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/DailyChecks.Tests.ps1 -FullNameFilter 'Chapter 02*'… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 02-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/dc/02-7.txt))](captures/02-7.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test workspace

Use a test subscription with a Log Analytics workspace, never production. **The authors haven't run this lab.** It saves one test workbook through the portal, so you need Workbook Contributor on the test resource group, activated for the lab only. Work in `examples/daily-checks-workbook`, in PowerShell 7. You'll replace: `<downloads-folder>` (where you save the export).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/daily-checks-workbook`. Each step below says what it does and what to look for.

```powershell
# Step 3: Validate the export
./Test-DcWorkbook.ps1 -TemplatePath <downloads-folder>/daily-checks-export.json

# Step 4: Back it out
Remove-Item <downloads-folder>/daily-checks-export.json
```

:::

<!-- labs:end -->

1. **Open the template in the portal.** In the Azure portal: **Monitor** > **Workbooks** > **New**; open the **Advanced Editor** (the **</>** button); on the **Gallery Template** tab, replace the content with the content of `workbook/daily-checks.workbook.json`; select **Apply**, then **Done Editing**. Select the test workspace in **Workspace** and confirm that each of the ten tabs opens and shows the banner.
2. **Save, edit, export.** Select **Save** with the title "Daily checks (lab)" in the test resource group. Select **Edit**, change any one query's look-back, **Done Editing**, then open the **Advanced Editor** again and copy the **Gallery Template** tab's content into `<downloads-folder>/daily-checks-export.json`.
3. **Validate the export.** The edit you made, and the workspace the portal saved into the export, both fail:

   ```powershell
   ./Test-DcWorkbook.ps1 -TemplatePath <downloads-folder>/daily-checks-export.json
   ```

   Record any other difference the portal introduced (a field the kit doesn't write, a changed type number) in the workbook's research gaps.

4. **Back it out.** In the portal, open "Daily checks (lab)" and select **Delete**; then delete the export:

   ```powershell
   Remove-Item <downloads-folder>/daily-checks-export.json
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Two ways to manage workbooks as templates | Workbook templates (Gallery Template tab); workbook instances (ARM template view) | [^dc02-arm] |
| Instance properties | `displayName`, `serializedData`, `version`, `sourceId`, `category`; `kind` `shared` | [^dc02-arm] |
| `serializedData` | The workbook's content: `{"version":"Notebook/1.0","items":[...]}` | [^dc02-arm] |
| Sensitive values in exports | Subscription ID, resource group and resource IDs; mask them | [^dc02-arm] |
| API version | 2023-06-01; `kind` only `shared`; `category`, `displayName`, `serializedData` required | [^dc02-ref] |
| Query data source | `Logs (Analytics)` over Log Analytics workspaces, with KQL | [^dc02-sources] |
| GCC | The workbook resource is in the commercial Azure subscription; Sentinel workbooks are GA in Azure commercial | [^dc02-clouds] |

## Federal requirements and evidence

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The template is the reviewed build (Lab 1, step 1) | CM-2 (baseline configuration) | KSI-SVC-ACM | The repository's tests |
| The template matches the manifest and carries no IDs (Lab 1, steps 2 and 5: `results.json`, the template's SHA-256) | CM-2, CM-3 (configuration change control) | KSI-SVC-ACM, KSI-CMT-LMC | Security operations; the ISSO keeps the record (Chapter 04) |
| A portal edit is caught before it replaces the reviewed template (Lab 1, step 3; Lab 2, step 3) | CM-3 | KSI-CMT-LMC | Security operations |

The kit's records support these controls; the agency's assessor decides them. KSIs are FedRAMP 20x indicators for cloud service providers, framed as in Chapter 01.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A portal export committed as is | The subscription, resource group and workspace go into the repository | DC-V-10 |
| A tab that silently widens its look-back | A month of data looks like today's | DC-V-04 |
| One query on another workspace | A tab mixes two environments | DC-V-05 |
| The banner removed | The tab reads as proof | DC-V-06 |
| The telemetry list drifts from the manifest | A table drops out of the completeness check without anyone deciding it | DC-V-09 |

## Checklist

- [ ] `New-DcWorkbookTemplate.ps1 -Check` passes on the branch.
- [ ] `Test-DcWorkbook.ps1` passes every check.
- [ ] Every portal edit came back as an export, was validated and replaced the template through a reviewed change.
- [ ] No export with IDs in it was committed.

::: {.callout-tip}
## Continue the book
[← Chapter 01 — The Daily Checks and Where Each One Lives](01-the-daily-checks-and-where-each-lives.md) · [Workbook index](index.md) · [Next: Chapter 03 — What Each Tab Would Show →](03-what-each-tab-would-show.md)
:::

[^dc02-arm]: Microsoft Learn, "Azure Monitor workbooks and Azure Resource Manager templates," <https://learn.microsoft.com/azure/azure-monitor/visualize/workbooks-automate> (accessed November 18, 2026).
[^dc02-ref]: Microsoft Learn, "Microsoft.Insights/workbooks - Bicep, ARM template & Terraform AzAPI reference," <https://learn.microsoft.com/azure/templates/microsoft.insights/workbooks> (accessed November 18, 2026).
[^dc02-sources]: Microsoft Learn, "Azure Workbooks data sources," Logs (Analytics Tables, Application Insights), <https://learn.microsoft.com/azure/azure-monitor/visualize/workbooks-data-sources> (accessed November 18, 2026).
[^dc02-clouds]: Microsoft Learn, "Microsoft Sentinel feature support for Azure commercial/other clouds," Content and content management, <https://learn.microsoft.com/azure/sentinel/feature-availability> (accessed November 18, 2026).
