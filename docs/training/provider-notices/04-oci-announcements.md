---
title: "Module 4: Oracle Cloud Infrastructure announcements"
description: "Gate G3 and workbook Chapter 03: read every Oracle Cloud Infrastructure announcement for a tenancy, the latest in each chain, with its affected resources, using one policy statement (read announcements in tenancy); keep Oracle's own ACTION_REQUIRED date; see a rescheduled maintenance window replace the original; and know which realms the kit reads (OC1, OC2) and refuses (OC3). An agency whose HR platform runs on OCI reads that tenancy here. About 45 minutes, with a lab on fixtures and a test tenancy lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 4
review-status: approved
reviewed-sha256: 37eb7109bb77f009a93dd9b67a86b21c75867590f029612fc6fe1e6919fefa0b
last-reviewed: 2026-11-09
---
# Module 4: Oracle Cloud Infrastructure announcements {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Gate G3 Oracle Cloud Infrastructure. Workbook [Chapter 03](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md). About 45 minutes.*

The narrated deck for this module, and the chapter's narrated tour, come later.

## Introduction (3 minutes)

Oracle Cloud Infrastructure publishes maintenance, changes, action-required notices and production events for a tenancy as announcements. It emails the tenancy administrator; anyone else receives them only through managed email preferences or announcement subscriptions. So an agency whose HR platform runs on OCI gets that platform's maintenance notices at whatever address the tenancy was opened with. Updates to one announcement form a chain, and a rescheduled window arrives as a new announcement in the same chain.

In this module you read the fixture tenancy's announcements, see Oracle's own action-required date, and watch the second week's rescheduled maintenance replace the first in its chain, so it stays one notice with the new window.

**The federal requirement.** Gate G3 supports SA-9 c and SI-5 a, and, when maintenance names the agency's resources, CP-2 e. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Step 3](../../books/guides/provider-notices-implementation.md#step-3-oracle-cloud-infrastructure-announcements) names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| SA-9 c | KSI-SCR-MIT, KSI-SCR-MON | `Get-PnRequiredPermission -Provider oci`; the policy statement |
| SA-9 c; SI-5 a | KSI-SCR-MIT, KSI-SCR-MON | `raw/oci.json`, `notices.json`, `manifest.json`: every chain's latest announcement, with its details, in the tenancy's realm |
| CP-2 (contingency plan), part e | KSI-RPL-ARP | Maintenance that names the agency's resources, so Module 7's routing asks for a contingency plan review |
| SI-5; CA-7 | KSI-SCR-MON, KSI-MLA-EVC | A rescheduled window replaces the original and stays one notice |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- write the one policy statement the reader needs, and say what `inspect` instead of `read` loses;
- map Oracle's announcement types to the record's kinds, with Oracle's `ACTION_REQUIRED` date;
- explain why the kit keeps only the latest announcement in each chain;
- name the realms the kit reads and the one it refuses, and why.

## Prerequisites (1 minute)

- [Module 1](01-why-provider-notices-go-unread.md): the record and its action basis.
- The guide's [five providers compared](../../books/guides/provider-notices-implementation.md#the-five-providers-compared), its OCI column.

## Unit 1: What the gate asks for (6 minutes)

Read the guide's [Step 3](../../books/guides/provider-notices-implementation.md#step-3-oracle-cloud-infrastructure-announcements): the policy statement, configuring the OCI CLI, cross-checking Oracle's own `list` command, and collecting. Then read its Government-cloud availability paragraph (OC2 endpoints in `us-langley-1` and `us-luke-1`; OC3 not yet specified), its Interim path (the announcement email, filed with the change record, and the named `noticeContacts`), and the Validate (G3) callout.

## Unit 2: The announcement reader (10 minutes)

Read the workbook chapter in this order:

- [What Oracle gives you](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#what-oracle-gives-you): `list`, `get`, the Announcement model and the policy reference.
- [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#what-it-leaves-to-you): chains, two generic time fields, affected resources on the details call only, and the realm guard.
- [The code](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#the-code): each `announcementType` mapped to a kind.
- [Dangers](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#dangers), including HR platform maintenance seen only by the help desk.

## Exercise: Lab 1, fixtures, no tenant (15 minutes)

This is the workbook's [Chapter 03, Lab 1](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/provider-notices`, in PowerShell 7. The tenancy is fictional, in realm `oc1`, region `us-ashburn-1`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/provider-notices`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what OCI needs
Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
Get-PnRequiredPermission -Provider oci | Format-Table Call, Permissions, Verified

# Step 2: See the realms the kit knows
foreach ($r in 'oc1', 'oc2', 'oc3') { try { $c = Get-PnCloud -Provider oci -Cloud $r; "$r : $($c.Domain) $($c.Regions -join ', ')" } catch { "$r : $($_.Exception.Message)" } }

# Step 3: Collect OCI from the day-one fixtures
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider oci -AsOf 2026-11-09T12:00:00Z -OutputPath out/oci-day1

# Step 4: Read the records
Import-Csv out/oci-day1/notices.csv | Format-Table noticeId, kind, status, actionRequired, actionRequiredBy, windowStart, resources

# Step 5: Collect the second week
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider oci -AsOf 2026-11-16T12:00:00Z -OutputPath out/oci-day2
Import-Csv out/oci-day2/notices.csv | Format-Table noticeId, kind, status, windowStart, windowEnd

# Step 6: Build the live list command without running it
$s = Read-PnSettings -Path tests/fixtures/settings.lab.json
(Get-PnLiveCommand -CallId oci-announcements-list -Settings $s).Arguments -join ' '

# Step 7: Run this chapter's tests
Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Oracle Cloud Infrastructure announcements*', '*OCI*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what OCI needs:**

    ```powershell
    Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
    Get-PnRequiredPermission -Provider oci | Format-Table Call, Permissions, Verified
    ```

    ```text
    Call                   Permissions                                                         Verified
    ----                   -----------                                                         --------
    oci-announcements-list Allow group <group> to inspect announcements in tenancy (list only)     True
    oci-announcement-get   Allow group <group> to read announcements in tenancy                    True
    ```

    `inspect` is enough to list; `read` is what the details call, with its affected resources, needs.

2. **See the realms the kit knows:**

    ```powershell
    foreach ($r in 'oc1', 'oc2', 'oc3') { try { $c = Get-PnCloud -Provider oci -Cloud $r; "$r : $($c.Domain) $($c.Regions -join ', ')" } catch { "$r : $($_.Exception.Message)" } }
    ```

    ```text
    oc1 : oraclecloud.com
    oc2 : oraclegovcloud.com us-langley-1, us-luke-1
    oc3 : OCI realm oc3: the Announcements endpoint there is not yet specified (Oracle's page wasn't readable on November 9, 2026).
    ```

3. **Collect OCI from the day-one fixtures:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider oci -AsOf 2026-11-09T12:00:00Z -OutputPath out/oci-day1
    ```

    Expect the row `oci      oc1                4      3        1  advisory 1, change 1, incident 1, maintenance 1`.

4. **Read the records:**

    ```powershell
    Import-Csv out/oci-day1/notices.csv | Format-Table noticeId, kind, status, actionRequired, actionRequiredBy, windowStart, resources
    ```

    `oci:chain-example-01` is maintenance from `2026-11-22T04:00:00Z` on a database system, `ocid1.dbsystem.oc1.iad.exampledb01`; `oci:chain-example-02` is a change, action required by `2026-12-15T00:00:00Z` by Oracle's own type, on a load balancer; the incident is closed.

5. **Collect the second week:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider oci -AsOf 2026-11-16T12:00:00Z -OutputPath out/oci-day2
    Import-Csv out/oci-day2/notices.csv | Format-Table noticeId, kind, status, windowStart, windowEnd
    ```

    Still four notices. `oci:chain-example-01` now runs `2026-11-29T04:00:00Z` to `2026-11-29T08:00:00Z`: the chain's latest announcement replaced the first, so Module 7 updates its task instead of opening a second.

6. **Build the live list command without running it:**

    ```powershell
    $s = Read-PnSettings -Path tests/fixtures/settings.lab.json
    (Get-PnLiveCommand -CallId oci-announcements-list -Settings $s).Arguments -join ' '
    ```

    ```text
    announce announcements list --compartment-id ocid1.tenancy.oc1..aaaaaaaaexampletenancy --all --should-show-only-latest-in-chain true --region us-ashburn-1 --output json
    ```

7. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Oracle Cloud Infrastructure announcements*', '*OCI*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expect `PassedCount 9`, `FailedCount 0`.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, a test tenancy (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 03, Lab 2](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#lab-2-a-test-tenancy). It has the exact commands.

- **You need:** an OCI test tenancy, never production; an IAM administrator; and a test IAM group for the reader.
- **What you do:** add the `read announcements in tenancy` statement to a policy in the root compartment, configure the CLI as the reader, cross-check Oracle's `list` command against the collection, and record the key casing the CLI printed, which Oracle's reference doesn't show.
- **Back-out:** step 4 deletes the policy, as the IAM administrator, and the run, which names the tenancy's resources.

## Knowledge check (5 minutes)

1. Which policy statement does the reader's group need?
    a. `Allow group <group> to manage announcements in tenancy`
    b. `Allow group <group> to read announcements in tenancy`
    c. `Allow group <group> to inspect all-resources in tenancy`
    d. None; announcements are public
2. What does granting `inspect` instead of `read` lose?
    a. Nothing
    b. The details call's affected resources, so no notice can be routed as naming the agency's resources
    c. The list of announcements
    d. Access to the OC2 realm
3. Oracle reschedules a maintenance window. How many notices does the kit hold for it?
    a. Two: the original and the new one
    b. One: the latest announcement in the chain, with the new window
    c. None until the window starts
    d. One per affected resource
4. An announcement's type is `ACTION_REQUIRED`. What is its `actionBasis`?
    a. A kit rule
    b. The provider's own flag, with Oracle's `ACTION_REQUIRED_BY` date where one is given
    c. `none`
    d. The ISSO's decision
5. What does the kit do with realm `oc3`?
    a. Reads it on the OC2 endpoints
    b. Reads it on the commercial endpoint
    c. Refuses it, because its Announcements endpoint is not yet specified
    d. Treats it as `oc1`

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in the guide's [Step 3](../../books/guides/provider-notices-implementation.md#step-3-oracle-cloud-infrastructure-announcements) and [What Oracle gives you](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#what-oracle-gives-you).
2. **b.** Taught in [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#what-it-leaves-to-you) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#dangers).
3. **b.** Taught in [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#what-it-leaves-to-you).
4. **b.** Taught in [The code](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#the-code).
5. **c.** Taught in the guide's [Step 3](../../books/guides/provider-notices-implementation.md#step-3-oracle-cloud-infrastructure-announcements) and its [What couldn't be verified](../../books/guides/provider-notices-implementation.md#what-couldnt-be-verified).
:::

## Summary (2 minutes)

You read the reader's one policy statement, saw the realms the kit reads and refuses, collected four announcements with Oracle's own action date, and watched a rescheduled maintenance window stay one notice.

**The evidence an ISSO keeps** for G3 from this module: `raw/oci.json` (the list and each announcement's details), `notices.json`, `notices.csv` and `manifest.json`, dated; and in Lab 2 the policy. For a system that runs on OCI, such as an HR platform, route maintenance that names its resources to its owners (Module 7). Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#checklist).

**Next:** [Module 5: AWS Health and the support plan](05-aws-health-and-the-support-plan.md).
