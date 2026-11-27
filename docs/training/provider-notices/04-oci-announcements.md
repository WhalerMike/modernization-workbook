---
title: "Module 4: Oracle Cloud Infrastructure announcements"
description: "Gate G3 and workbook Chapter 03: read every Oracle Cloud Infrastructure announcement for a tenancy, the latest in each chain, with its affected resources, using one policy statement (read announcements in tenancy); keep Oracle's own ACTION_REQUIRED date; see a rescheduled maintenance window replace the original; and know which realms the kit reads (OC1, OC2). An agency whose HR platform runs on OCI reads that tenancy here. About 45 minutes, with a lab on fixtures and a test tenancy lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 4
review-status: approved
reviewed-sha256: a3918e2e4d8566d23029ad981f14367c4433e3e410c00c215f2fdca2db979795
last-reviewed: 2026-11-25
---
# Module 4: Oracle Cloud Infrastructure announcements {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Gate G3 Oracle Cloud Infrastructure. Workbook [Chapter 03](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md). About 45 minutes.*

**Watch:** the narrated deck for this module (about 13 minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_PN_Module_4_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PN_Module_4_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-pn-module-4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-4/Training_PN_Module_4_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-4/Training_PN_Module_4_Narrated.vtt). The deck files join the next edition.

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_PN_03_OCI_Announcements_Narrated).

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
- name the realms the kit reads.

## Prerequisites (1 minute)

- [Module 1](01-why-provider-notices-go-unread.md): the record and its action basis.
- The guide's [five providers compared](../../books/guides/provider-notices-implementation.md#the-five-providers-compared), its OCI column.

## Unit 1: What the gate asks for (6 minutes)

Read the guide's [Step 3](../../books/guides/provider-notices-implementation.md#step-3-oracle-cloud-infrastructure-announcements): the policy statement, configuring the OCI CLI, cross-checking Oracle's own `list` command, and collecting. Then read its availability paragraph (OC2 endpoints in `us-langley-1` and `us-luke-1`), its Interim path (the announcement email, filed with the change record, and the named `noticeContacts`), and the Validate (G3) callout.

## Unit 2: The announcement reader (10 minutes)

Read the workbook chapter in this order:

- [What Oracle gives you](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#what-oracle-gives-you): `list`, `get`, the Announcement model and the policy reference.
- [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#what-it-leaves-to-you): chains, two generic time fields, affected resources on the details call only, and the realm guard.
- [The code](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#the-code): each `announcementType` mapped to a kind.
- [Dangers](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#dangers), including HR platform maintenance seen only by the help desk.

## Exercise: Lab 1, fixtures, no tenant (15 minutes)

This is the workbook's [Chapter 03, Lab 1](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#lab-1-fixtures-no-tenant), which explains each result. The tenancy is fictional, in realm `oc1`, region `us-ashburn-1`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\provider-notices-code\provider-notices

$Run = "C:\FMWLabs\results\provider-notices-04-oci-announcements\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: List what OCI needs
Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
Get-PnRequiredPermission -Provider oci | Format-Table Call, Permissions, Verified

# Step 2: See the realms the kit knows
foreach ($r in 'oc1', 'oc2') { try { $c = Get-PnCloud -Provider oci -Cloud $r; "$r : $($c.Domain) $($c.Regions -join ', ')" } catch { "$r : $($_.Exception.Message)" } }

# Step 3: Collect OCI from the day-one fixtures
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider oci -AsOf 2026-11-09T12:00:00Z -OutputPath "$Run\oci-day1"

# Step 4: Read the records
Import-Csv "$Run\oci-day1\notices.csv" | Format-Table noticeId, kind, status, actionRequired, actionRequiredBy, windowStart, resources | Out-String -Width 400

# Step 5: Collect the second week
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider oci -AsOf 2026-11-16T12:00:00Z -OutputPath "$Run\oci-day2"
Import-Csv "$Run\oci-day2\notices.csv" | Format-Table noticeId, kind, status, windowStart, windowEnd

# Step 6: Build the live list command without running it
$s = Read-PnSettings -Path tests/fixtures/settings.lab.json
(Get-PnLiveCommand -CallId oci-announcements-list -Settings $s).Arguments -join ' '

# Step 7: Run this chapter's tests
Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Oracle Cloud Infrastructure announcements*', '*OCI*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Get-ChildItem C:\FMWLabs\results\provider-notices-04-oci-announcements\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\provider-notices-code\provider-notices
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\provider-notices-04-oci-announcements\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\provider-notices-04-oci-announcements\lab1\<run>
```

The run's date is only the folder's name. The data's date is `-AsOf`, which stays the same, so every run's results match this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/provider-notices-code/provider-notices`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **List what OCI needs:**

    ```powershell
    Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
    Get-PnRequiredPermission -Provider oci | Format-Table Call, Permissions, Verified
    ```

    Expected output:

    ```text
    Call                   Permissions                                                         Verified
    ----                   -----------                                                         --------
    oci-announcements-list Allow group <group> to inspect announcements in tenancy (list only)     True
    oci-announcement-get   Allow group <group> to read announcements in tenancy                    True
    ```

    `inspect` is enough to list; `read` is what the details call, with its affected resources, needs.

2. **See the realms the kit knows:**

    ```powershell
    foreach ($r in 'oc1', 'oc2') { try { $c = Get-PnCloud -Provider oci -Cloud $r; "$r : $($c.Domain) $($c.Regions -join ', ')" } catch { "$r : $($_.Exception.Message)" } }
    ```

    Expected output:

    ```text
    oc1 : oraclecloud.com
    oc2 : oraclegovcloud.com us-langley-1, us-luke-1
    ```

3. **Collect OCI from the day-one fixtures:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider oci -AsOf 2026-11-09T12:00:00Z -OutputPath "$Run\oci-day1"
    ```

    Expected output:

    ```text
    Collected as of 2026-11-09T12:00:00Z (Fixture mode, environment lab)

    Provider Cloud        Notices   Open   Action  By kind
    oci      oc1                4      3        1  advisory 1, change 1, incident 1, maintenance 1

    4 notices, each valid against schema/notice.schema.json. Written to C:\FMWLabs\results\provider-notices-04-oci-announcements\lab1\<run>\oci-day1: notices.json, notices.csv, raw/, manifest.json
    ```

4. **Read the records:**

    ```powershell
    Import-Csv "$Run\oci-day1\notices.csv" | Format-Table noticeId, kind, status, actionRequired, actionRequiredBy, windowStart, resources | Out-String -Width 400
    ```

    Expected output:

    ```text
    noticeId             kind        status actionRequired actionRequiredBy     windowStart          resources
    --------             ----        ------ -------------- ----------------     -----------          ---------
    oci:chain-example-01 maintenance open   false                               2026-11-22T04:00:00Z ocid1.dbsystem.oc1.iad.exampledb01
    oci:chain-example-02 change      open   true           2026-12-15T00:00:00Z                      ocid1.loadbalancer.oc1.iad.examplelb01
    oci:chain-example-03 advisory    open   false
    oci:chain-example-04 incident    closed false
    ```

    `oci:chain-example-01` is maintenance from `2026-11-22T04:00:00Z` on a database system, `ocid1.dbsystem.oc1.iad.exampledb01`; `oci:chain-example-02` is a change, action required by `2026-12-15T00:00:00Z` by Oracle's own type, on a load balancer; the incident is closed.

5. **Collect the second week:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider oci -AsOf 2026-11-16T12:00:00Z -OutputPath "$Run\oci-day2"
    Import-Csv "$Run\oci-day2\notices.csv" | Format-Table noticeId, kind, status, windowStart, windowEnd
    ```

    Expected output:

    ```text
    Collected as of 2026-11-16T12:00:00Z (Fixture mode, environment lab)

    Provider Cloud        Notices   Open   Action  By kind
    oci      oc1                4      3        1  advisory 1, change 1, incident 1, maintenance 1

    4 notices, each valid against schema/notice.schema.json. Written to C:\FMWLabs\results\provider-notices-04-oci-announcements\lab1\<run>\oci-day2: notices.json, notices.csv, raw/, manifest.json

    noticeId             kind        status windowStart          windowEnd
    --------             ----        ------ -----------          ---------
    oci:chain-example-01 maintenance open   2026-11-29T04:00:00Z 2026-11-29T08:00:00Z
    oci:chain-example-02 change      open
    oci:chain-example-03 advisory    open
    oci:chain-example-04 incident    closed                      2026-11-03T08:05:00Z
    ```

    Still four notices. `oci:chain-example-01` now runs `2026-11-29T04:00:00Z` to `2026-11-29T08:00:00Z`: the chain's latest announcement replaced the first, so Module 7 updates its task instead of opening a second.

6. **Build the live list command without running it:**

    ```powershell
    $s = Read-PnSettings -Path tests/fixtures/settings.lab.json
    (Get-PnLiveCommand -CallId oci-announcements-list -Settings $s).Arguments -join ' '
    ```

    Expected output:

    ```text
    announce announcements list --compartment-id ocid1.tenancy.oc1..aaaaaaaaexampletenancy --all --should-show-only-latest-in-chain true --region us-ashburn-1 --output json
    ```

7. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Oracle Cloud Infrastructure announcements*', '*OCI*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expected output:

    ```text
    PassedCount FailedCount
    ----------- -----------
              9           0
    ```

Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\provider-notices-04-oci-announcements\lab1 -Name
```

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Exercise: Lab 2, a test tenancy (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 03, Lab 2](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#lab-2-a-test-tenancy). It has the exact commands.

<!-- labs:begin module-lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #module-lab-2-commands collapse="false" title="The Lab 2 commands, against your test environment"}
Every command in [Chapter 03, Lab 2](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#lab-2-a-test-tenancy), in order, against your test environment, never production.

Replace each `<placeholder>` with your test environment's value.

The chapter's steps say what each command does and what to look for.

```powershell
# Step 1: Add the policy statement
Set-Content -Path statements.json -Value '["Allow group <group> to read announcements in tenancy"]'
$policy = oci iam policy create --compartment-id <tenancy-ocid> --name ProviderNoticesRead --description "Provider notices kit: read announcements" --statements file://statements.json | ConvertFrom-Json
$policy.data.id

# Step 2: Configure the CLI as the reader
oci setup config
oci --version

# Step 3: Cross-check the list with Oracle's command, then collect
oci announce announcements list --compartment-id <tenancy-ocid> --all --should-show-only-latest-in-chain true --region <home-region> --query "length(data.items)"
./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider oci -OutputPath out/oci-test
Import-Csv out/oci-test/notices.csv | Format-Table noticeId, kind, status, actionRequiredBy, resources

# Step 4: Back it out
oci iam policy delete --policy-id $policy.data.id --force
Remove-Item -Recurse -Force out/oci-test, statements.json
```
:::

<!-- labs:end -->

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

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in the guide's [Step 3](../../books/guides/provider-notices-implementation.md#step-3-oracle-cloud-infrastructure-announcements) and [What Oracle gives you](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#what-oracle-gives-you).
2. **b.** Taught in [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#what-it-leaves-to-you) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#dangers).
3. **b.** Taught in [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#what-it-leaves-to-you).
4. **b.** Taught in [The code](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#the-code).
:::

## Summary (2 minutes)

You read the reader's one policy statement, saw the realms the kit reads, collected four announcements with Oracle's own action date, and watched a rescheduled maintenance window stay one notice.

**The evidence an ISSO keeps** for G3 from this module: `raw/oci.json` (the list and each announcement's details), `notices.json`, `notices.csv` and `manifest.json`, dated; and in Lab 2 the policy. For a system that runs on OCI, such as an HR platform, route maintenance that names its resources to its owners (Module 7). Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/provider-notices/03-oracle-cloud-infrastructure-announcements.md#checklist).

**Next:** [Module 5: AWS Health and the support plan](05-aws-health-and-the-support-plan.md).
