---
title: "Module 2: Azure Service Health and alerts"
description: "Gate G1 and workbook Chapter 01: read every Service Health event for the subscriptions in scope through Azure Resource Graph with Learn's own sample queries, with Reader and Service Health Security Reader; merge one event across subscriptions; make retirements and security advisories action required by a stated rule; and plan Service Health alerts at scale with the built-in Azure Policy definition, applied only with its approved SHA-256. About 55 minutes, with a lab on fixtures and a test subscription lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 2
review-status: pending
---
# Module 2: Azure Service Health and alerts {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Gate G1 Azure Service Health. Workbook [Chapter 01](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md). About 55 minutes.*

The narrated deck for this module, and the chapter's narrated tour, come later.

## Introduction (3 minutes)

Service Health is where Azure publishes service issues, planned maintenance, health advisories (retirements among them) and security advisories for a subscription. The portal tells nobody unless someone created a Service Health alert, and an alert fires only for the subscriptions, services and regions its rule names. Resource Graph's `ServiceHealthResources` table answers the same questions for every subscription in scope with one query, and Microsoft Learn publishes the queries.

In this module you read the fixture subscriptions with the kit's query, built from Learn's samples, and then plan the built-in Azure Policy that creates Service Health alerts in every subscription. The plan changes nothing until someone approves its hash.

**The federal requirement.** Gate G1 supports SA-9 c, SI-5 a and CA-7. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Step 1](../../books/guides/provider-notices-implementation.md#step-1-azure-service-health) names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| SA-9 c: monitor the provider's control compliance | KSI-SCR-MIT, KSI-SCR-MON | `Get-PnRequiredPermission -Provider azure`: Reader, and Service Health Security Reader for security advisories, nothing that writes |
| SA-9 c; SI-5 a: receive advisories | KSI-SCR-MIT, KSI-SCR-MON | `raw/azure.json`, `notices.json`, `manifest.json` with every call and its role |
| SI-5; CA-7: the alert path between collections | KSI-SCR-MON, KSI-MLA-EVC | The alert plan, `results.json`, and the change record that approved the hash |
| CM-3; CP-2: the assignment removed by an approved rollback | KSI-CMT-LMC, KSI-RPL-ARP | The change record (Lab 2) |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- name the least-privileged roles that read Service Health, and the one a security advisory's sensitive fields need;
- compare the kit's events query with Learn's samples;
- collect the fixture subscriptions and read each event's kind and action date;
- plan Service Health alerts at scale with Azure Policy, and show that fixture mode never applies the plan.

## Prerequisites (1 minute)

- [Module 1](01-why-provider-notices-go-unread.md): the record and its action basis.
- Optional: [Book 12, Chapter 04](../../books/b12-security-operations/04-platform-and-m365-telemetry.md), which sends the Azure activity log's `ServiceHealth` category to the workspace.

## Unit 1: What the gate asks for (8 minutes)

Read the guide's [Step 1](../../books/guides/provider-notices-implementation.md#step-1-azure-service-health): grant the reader its roles, sign in to the right cloud, collect, and alert at scale. Then read its Government-cloud availability and Interim path paragraphs, and the Validate (G1) callout at the end of the step: the collection passes when every subscription's events are listed and each security advisory has its summary.

## Unit 2: The collector and the alert policy (12 minutes)

Read the workbook chapter in this order:

- [What Microsoft gives you](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#what-microsoft-gives-you) and [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#what-it-leaves-to-you): one query from five samples, rows merged by tracking ID, and the kit's action rule.
- [The Azure collector](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#the-azure-collector): each `EventType` mapped to a kind, and the source link on the cloud's own Resource Manager host.
- [The alert policy](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#the-alert-policy): the built-in definition, the managed identity's role, the remediation, and why a resource group scope is refused.
- [Dangers](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#dangers): Reader alone, the wrong cloud, and alert rules edited by hand.

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This is the workbook's [Chapter 01, Lab 1](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#lab-1-fixtures-no-tenant), which explains each result, without its steps 5 and 6 (the retirement in full and the fingerprints), which Module 1 ran. So this lab's steps 5 to 7 are the chapter's steps 7 to 9. Work in `examples/provider-notices`, in PowerShell 7. The subscriptions are fictional.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/provider-notices`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what Azure needs
Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
Get-PnRequiredPermission -Provider azure | Format-List

# Step 2: Read the kit's events query
Get-PnAzureQuery -Name events

# Step 3: Collect Azure from the day-one fixtures
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider azure -AsOf 2026-11-09T12:00:00Z -OutputPath out/azure

# Step 4: Read the records
Import-Csv out/azure/notices.csv | Format-Table kind, status, actionRequired, actionRequiredBy, title

# Step 5: Plan the Service Health alert policy
./deploy/New-PnAlertPolicy.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -FixturePath deploy/tests/fixtures/environment-production.json -OutputPath out/alerts -AsOf 2026-11-16T12:00:00Z

# Step 6: Try to apply it in fixture mode
./deploy/New-PnAlertPolicy.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -FixturePath deploy/tests/fixtures/environment-production.json -OutputPath out/alerts -AsOf 2026-11-16T12:00:00Z -Apply -ApprovedSha256 ('0' * 64)

# Step 7: Run this chapter's tests
Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Normalizer.Tests.ps1 -FullNameFilter 'Azure Service Health*', 'The notice record*', 'The fingerprint*', 'Times and text*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what Azure needs:**

    ```powershell
    Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
    Get-PnRequiredPermission -Provider azure | Format-List
    ```

    Expect two calls, `azure-service-health-events` and `azure-impacted-resources`, each `Permissions : Reader on each subscription in scope`, with Service Health Security Reader as the elevated role, and `Verified : True`.

2. **Read the kit's events query:**

    ```powershell
    Get-PnAzureQuery -Name events
    ```

    One query that starts `ServiceHealthResources | where type =~ 'Microsoft.ResourceHealth/events'`: Learn's all-active filter, with the retirement sample's `eventSubType` and the impact times converted with `todatetime(tolong(...))`.

3. **Collect Azure from the day-one fixtures:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider azure -AsOf 2026-11-09T12:00:00Z -OutputPath out/azure
    ```

    ```text
    Collected as of 2026-11-09T12:00:00Z (Fixture mode, environment lab)

    Provider Cloud        Notices   Open   Action  By kind
    azure    AzureCloud         5      5        2  advisory 1, incident 1, maintenance 1, retirement 1, security 1

    5 notices, each valid against schema/notice.schema.json. Written to out/azure: notices.json, notices.csv, raw/, manifest.json
    ```

    Five notices from six rows: the incident's rows from two subscriptions are one notice.

4. **Read the records:**

    ```powershell
    Import-Csv out/azure/notices.csv | Format-Table kind, status, actionRequired, actionRequiredBy, title
    ```

    ```text
    kind        status actionRequired actionRequiredBy     title
    ----        ------ -------------- ----------------     -----
    incident    open   false                               Virtual Machines - East US - Connectivity issues
    advisory    open   false                               Update clients to TLS 1.2 or later for Azure Storage
    maintenance open   false                               Planned maintenance: Virtual Machines in East US 2
    retirement  open   true           2027-09-30T00:00:00Z Retirement: Basic SKU public IP addresses
    security    open   true                                Security advisory: action recommended for Azure Kubernetes Service clusters
    ```

    The retirement is due at the advisory's end; the security advisory needs action with no date, for the ISSO to review.

5. **Plan the Service Health alert policy:**

    ```powershell
    ./deploy/New-PnAlertPolicy.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -FixturePath deploy/tests/fixtures/environment-production.json -OutputPath out/alerts -AsOf 2026-11-16T12:00:00Z
    ```

    Expect two `WouldApply` steps: `AL-01`, `az policy assignment create` for the definition `98903777-a9f6-47f5-90a9-acaf62ab01a8` at the management group `mg-contoso-example` with a system-assigned identity, `--role` and `--identity-scope`; and `AL-02`, `az policy remediation create`. Then `Plan SHA-256: 6a1ec6adbd50bc2cec2bcc803ee45629bc0a0d7de416fcafd3216db443a4a3b7` and `Dry run: nothing changed.` The role ID in the fixture is made up; Lab 2 reads the real one.

6. **Try to apply it in fixture mode:**

    ```powershell
    ./deploy/New-PnAlertPolicy.ps1 -SettingsPath deploy/tests/fixtures/settings.production.json -FixturePath deploy/tests/fixtures/environment-production.json -OutputPath out/alerts -AsOf 2026-11-16T12:00:00Z -Apply -ApprovedSha256 ('0' * 64)
    ```

    Expect an error: `Exception: Fixture mode never applies.` The script refuses before it reads the hash.

7. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Normalizer.Tests.ps1 -FullNameFilter 'Azure Service Health*', 'The notice record*', 'The fingerprint*', 'Times and text*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expect `PassedCount 26`, `FailedCount 0`.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, a test subscription (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 01, Lab 2](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#lab-2-a-test-subscription). It has the exact commands.

- **You need:** an Azure test subscription in a test tenant, never production; a reader identity; a person who can create policy and role assignments there; and a second person to approve the plan's hash. The subscription may have no Service Health events, which is a valid result.
- **What you do:** grant Reader and Service Health Security Reader, sign in, cross-check Learn's own query against the collection, plan the alert policy at the subscription, apply it with the approved hash, and check the remediation and the alert rule.
- **Back-out:** step 6 plans and applies the rollback with its approved hash, deletes what the remediation created in the test subscription, and removes the reader's roles.

## Knowledge check (5 minutes)

1. A security advisory's summary is empty in the record. What is the likely cause?
    a. Microsoft hasn't written it yet
    b. The reader holds Reader but not Service Health Security Reader, which the sensitive fields need
    c. The query filtered it out
    d. The advisory is closed
2. The same incident appears in two subscriptions. How many notices does the kit write?
    a. Two, one per subscription
    b. One: rows are merged by tracking ID
    c. None until it closes
    d. One per region
3. How does the kit tell a retirement from a general health advisory?
    a. By the title
    b. A `HealthAdvisory` with `EventSubType` `Retirement` is a retirement
    c. By the priority
    d. It can't; both are advisories
4. What does `New-PnAlertPolicy.ps1` do without `-Apply`?
    a. It assigns the policy and skips remediation
    b. It writes a plan of two steps, prints its SHA-256 and changes nothing
    c. It edits the existing alert rules
    d. It creates the alert rule directly in each subscription
5. Someone wants to change the alert rule the policy created. What should they do?
    a. Edit the rule in the portal
    b. Delete the rule and create a new one
    c. Change the assignment's parameters and remediate again, because remediation may overwrite a hand edit
    d. Assign the policy at a resource group instead

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [What Microsoft gives you](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#what-microsoft-gives-you) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#dangers).
2. **b.** Taught in [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#what-it-leaves-to-you).
3. **b.** Taught in [The Azure collector](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#the-azure-collector).
4. **b.** Taught in [The alert policy](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#the-alert-policy).
5. **c.** Taught in the guide's [Step 1](../../books/guides/provider-notices-implementation.md#step-1-azure-service-health) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#dangers).
:::

## Summary (2 minutes)

You listed the two roles Azure's reader needs, read the kit's query against Learn's samples, collected five notices from the fixture subscriptions, and planned Service Health alerts at the management group as a plan that fixture mode refuses to apply.

**The evidence an ISSO keeps** for G1 from this module: `raw/azure.json`, `notices.json`, `notices.csv` and `manifest.json`, dated; the permission list from step 1; the alert `plan.json` with its SHA-256, and in Lab 2 the change record that approved it and the `results.json` of the apply. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#checklist).

**Next:** [Module 3: Microsoft 365 Message center](03-microsoft-365-message-center.md).
