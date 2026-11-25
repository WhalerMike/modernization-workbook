---
title: "Module 5: AWS Health and the support plan"
description: "Gate G4 and workbook Chapter 04: read every open and upcoming AWS Health event for an account, with a customer managed policy of exactly three read actions, details and affected entities ten events at a time; keep AWS's actionability apart from the kit's retirement rule; read from the partition's own endpoint (us-east-1, or us-gov-west-1 in GovCloud); and know that the API needs a qualifying AWS Support plan, which AWS's own pages name differently. About 50 minutes, with a lab on fixtures and a test account lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 5
review-status: approved
reviewed-sha256: 44c4f63ca51a84dc3d33b91637c518424bf3e7b0fc0c927ed3fef7e407aea1be
last-reviewed: 2026-11-25
---
# Module 5: AWS Health and the support plan {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Gate G4 AWS Health. Workbook [Chapter 04](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md). About 50 minutes.*

**Watch:** the narrated deck for this module (about 13 minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_PN_Module_5_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PN_Module_5_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-pn-module-5) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-5/Training_PN_Module_5_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-5/Training_PN_Module_5_Narrated.vtt). The deck files join the next edition.

**Also:** the chapter's narrated tour, about 12 minutes: [▶ Watch](../../presentations/watch.html?v=DW_PN_04_AWS_Health_Narrated).

## Introduction (3 minutes)

AWS Health publishes issues, scheduled changes and account notifications per account, with the affected resources. AWS sends account email to the root user's address and up to three alternate contacts, and the dashboard keeps events for up to 90 days. The API is the scheduled, recorded read, but it needs a qualifying AWS Support plan: without one it answers `SubscriptionRequiredException` and nothing is read. AWS's own pages don't agree on which plans qualify, so the guide cites all three and tells you to check the account's plan against the current pages.

In this module you read the fixture account's events, see which ones AWS marked `ACTION_REQUIRED` and which the kit's rule marked, build the GovCloud request without sending it, and watch the kit refuse eleven events in one details call.

**The federal requirement.** Gate G4 supports SA-9 c and SI-5 a, and, for events AWS marks `ACTION_REQUIRED`, SI-5 d. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Step 4](../../books/guides/provider-notices-implementation.md#step-4-aws-health) names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| SA-9 c | KSI-SCR-MIT, KSI-SCR-MON | `Get-PnRequiredPermission -Provider aws`; the policy document with three read actions |
| SA-9 c; SI-5 a | KSI-SCR-MIT, KSI-SCR-MON | `raw/aws.json`, `notices.json`, `manifest.json`; the reads on the partition's own endpoint |
| SI-5 d (implement directives in the established time frames), through the task Module 7 routes | KSI-SCR-MON | Events AWS marks `ACTION_REQUIRED`, with AWS's due date; the kit's rule labeled as the kit's |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- write the reader's policy with exactly three read actions, and say why not `AWSHealthFullAccess` or a wildcard;
- explain the support-plan requirement, the error without it, and why to check the plan against AWS's current pages;
- map AWS Health event categories to the record's kinds, with AWS's `actionability` kept apart from the kit's rule;
- name each partition's Health endpoint region, and why GovCloud relies on the API rather than EventBridge.

## Prerequisites (1 minute)

- [Module 1](01-why-provider-notices-go-unread.md): the record and its action basis.
- The guide's [five providers compared](../../books/guides/provider-notices-implementation.md#the-five-providers-compared), its AWS column.

## Unit 1: What the gate asks for (8 minutes)

Read the guide's [Step 4](../../books/guides/provider-notices-implementation.md#step-4-aws-health): its prerequisites paragraph first, with the three AWS pages that name the qualifying plans differently, then the read policy, the cross-check from the Health endpoint, and the collection. Then read its Government-cloud availability paragraph, its Interim path (an EventBridge rule on `aws.health` events; without a support plan, the dashboard and its email), and the Validate (G4) callout.

## Unit 2: The event reader (10 minutes)

Read the workbook chapter in this order:

- [What AWS gives you](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#what-aws-gives-you): the Event, the one-to-ten ARN limit on details, the support plan, and the endpoints.
- [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#what-it-leaves-to-you): batching, the kind mapping, `actionability`, epoch times and the partition guard.
- [The code](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#the-code): each `eventTypeCategory` mapped to a kind.
- [Dangers](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#dangers).

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This is the workbook's [Chapter 04, Lab 1](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#lab-1-fixtures-no-tenant), which explains each result. The account is AWS's documentation account, `111122223333`, in partition `aws`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\provider-notices-code\provider-notices

$Run = "C:\FMWLabs\results\provider-notices-05-aws-health-and-the-support-plan\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: List what AWS needs
Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
Get-PnRequiredPermission -Provider aws | Format-Table Call, Permissions, Verified

# Step 2: See each partition's Health endpoint region
foreach ($p in 'aws', 'aws-us-gov') { $c = Get-PnCloud -Provider aws -Cloud $p; '{0,-11} {1,-14} {2}' -f $p, $c.Region, $c.ArnPrefix }

# Step 3: Collect AWS from the day-one fixtures
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider aws -AsOf 2026-11-09T12:00:00Z -OutputPath "$Run\aws"

# Step 4: Read the records
Import-Csv "$Run\aws\notices.csv" | Format-Table kind, status, actionRequired, actionRequiredBy, title, resources | Out-String -Width 400

# Step 5: See who said each one needs action
(Read-PnJson -Path "$Run\aws\notices.json").notices | ForEach-Object { [pscustomobject]@{ title = $_.title; actionBasis = $_.actionBasis } } | Format-Table | Out-String -Width 400

# Step 6: Build the GovCloud request without sending it
$s = Read-PnSettings -Path tests/fixtures/settings.lab.json
$s.providers.aws.partition = 'aws-us-gov'
(Get-PnLiveCommand -CallId aws-describe-events -Settings $s).Arguments -join ' '

# Step 7: Ask for details of eleven events in one call
try { Get-PnLiveCommand -CallId aws-describe-event-details -Settings $s -Arguments @{ arns = @(1..11 | ForEach-Object { "arn:aws-us-gov:health:us-gov-west-1::event/EC2/EXAMPLE/$_" }) } } catch { $_.Exception.Message }

# Step 8: Run this chapter's tests
Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'AWS Health*', '*AWS*', '*10 ARNs*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Get-ChildItem C:\FMWLabs\results\provider-notices-05-aws-health-and-the-support-plan\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\provider-notices-code\provider-notices
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\provider-notices-05-aws-health-and-the-support-plan\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\provider-notices-05-aws-health-and-the-support-plan\lab1\<run>
```

The run's date is only the folder's name. The data's date is `-AsOf`, which stays the same, so every run's results match this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/provider-notices-code/provider-notices`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **List what AWS needs:**

    ```powershell
    Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
    Get-PnRequiredPermission -Provider aws | Format-Table Call, Permissions, Verified
    ```

    Expected output:

    ```text
    Call                           Permissions                     Verified
    ----                           -----------                     --------
    aws-describe-events            health:DescribeEvents               True
    aws-describe-event-details     health:DescribeEventDetails         True
    aws-describe-affected-entities health:DescribeAffectedEntities     True
    ```

    Three read actions, one per call: the whole policy.

2. **See each partition's Health endpoint region:**

    ```powershell
    foreach ($p in 'aws', 'aws-us-gov') { $c = Get-PnCloud -Provider aws -Cloud $p; '{0,-11} {1,-14} {2}' -f $p, $c.Region, $c.ArnPrefix }
    ```

    Expected output:

    ```text
    aws         us-east-1      arn:aws:
    aws-us-gov  us-gov-west-1  arn:aws-us-gov:
    ```

3. **Collect AWS from the day-one fixtures:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider aws -AsOf 2026-11-09T12:00:00Z -OutputPath "$Run\aws"
    ```

    Expected output:

    ```text
    Collected as of 2026-11-09T12:00:00Z (Fixture mode, environment lab)

    Provider Cloud        Notices   Open   Action  By kind
    aws      aws                5      4        3  incident 1, maintenance 1, retirement 2, security 1

    5 notices, each valid against schema/notice.schema.json. Written to C:\FMWLabs\results\provider-notices-05-aws-health-and-the-support-plan\lab1\<run>\aws: notices.json, notices.csv, raw/, manifest.json
    ```

4. **Read the records:**

    ```powershell
    Import-Csv "$Run\aws\notices.csv" | Format-Table kind, status, actionRequired, actionRequiredBy, title, resources | Out-String -Width 400
    ```

    Expected output:

    ```text
    kind        status actionRequired actionRequiredBy     title                              resources
    ----        ------ -------------- ----------------     -----                              ---------
    retirement  open   true           2026-12-01T00:00:00Z EC2: Instance retirement scheduled arn:aws:ec2:us-east-1:111122223333:instance/i-0abc1234example
    security    open   true                                IAM: Security notification         arn:aws:iam::111122223333:user/example-user
    maintenance open   false                               RDS: Maintenance scheduled         arn:aws:rds:us-east-1:111122223333:db:example-db-01
    incident    closed false                               S3: Operational issue
    retirement  open   true           2027-01-15T00:00:00Z LAMBDA: Planned lifecycle event    arn:aws:lambda:us-west-2:111122223333:function:example-function
    ```

    Two retirements, `EC2: Instance retirement scheduled` due `2026-12-01T00:00:00Z` and `LAMBDA: Planned lifecycle event` due `2027-01-15T00:00:00Z`, each with its resource; `RDS: Maintenance scheduled` on a database; `IAM: Security notification`, action required; and `S3: Operational issue`, closed.

5. **See who said each one needs action:**

    ```powershell
    (Read-PnJson -Path "$Run\aws\notices.json").notices | ForEach-Object { [pscustomobject]@{ title = $_.title; actionBasis = $_.actionBasis } } | Format-Table | Out-String -Width 400
    ```

    Expected output:

    ```text
    title                              actionBasis
    -----                              -----------
    EC2: Instance retirement scheduled provider: actionability ACTION_REQUIRED
    IAM: Security notification         provider: actionability ACTION_REQUIRED
    RDS: Maintenance scheduled         none
    S3: Operational issue              none
    LAMBDA: Planned lifecycle event    rule: AWS scheduled change whose event type code names a retirement; due at its start time
    ```

6. **Build the GovCloud request without sending it:**

    ```powershell
    $s = Read-PnSettings -Path tests/fixtures/settings.lab.json
    $s.providers.aws.partition = 'aws-us-gov'
    (Get-PnLiveCommand -CallId aws-describe-events -Settings $s).Arguments -join ' '
    ```

    Expected output:

    ```text
    health describe-events --region us-gov-west-1 --filter {"eventStatusCodes":["open","upcoming"]} --output json
    ```

7. **Ask for details of eleven events in one call:**

    ```powershell
    try { Get-PnLiveCommand -CallId aws-describe-event-details -Settings $s -Arguments @{ arns = @(1..11 | ForEach-Object { "arn:aws-us-gov:health:us-gov-west-1::event/EC2/EXAMPLE/$_" }) } } catch { $_.Exception.Message }
    ```

    Expected output, the error's message:

    ```text
    aws-describe-event-details takes 1 to 10 event ARNs; got 11.
    ```

    The kit refuses before anything runs. `try` and `catch` print the message and keep the window going.

8. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'AWS Health*', '*AWS*', '*10 ARNs*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expected output:

    ```text
    PassedCount FailedCount
    ----------- -----------
             11           0
    ```

Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\provider-notices-05-aws-health-and-the-support-plan\lab1 -Name
```

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Exercise: Lab 2, a test account (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 04, Lab 2](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#lab-2-a-test-account). It has the exact commands.

- **You need:** an AWS test account, never production, with a qualifying AWS Support plan (without one, step 3's error is the expected result); an IAM administrator; and an IAM role and CLI profile for the reader.
- **What you do:** write and create the read policy with exactly the three actions, check that the signed-in ARN starts with `arn:aws:`, and cross-check `aws health describe-events` against the collection.
- **Back-out:** step 4 detaches and deletes the policy and deletes the run, which names the account's resources.

## Knowledge check (5 minutes)

1. What does the AWS Health API answer for an account without a qualifying AWS Support plan?
    a. An empty list
    b. `SubscriptionRequiredException`
    c. Only closed events
    d. The same events, a day late
2. Why does the guide cite three AWS pages for the support plan?
    a. They agree, and three is more convincing
    b. AWS's pages name the qualifying plans differently, so the agency checks the account's plan against the current pages
    c. One page per partition
    d. Only one page mentions a plan at all
3. Which policy should the reader hold?
    a. `AWSHealthFullAccess`
    b. A policy that allows `health:Describe*`
    c. A customer managed policy with exactly `health:DescribeEvents`, `health:DescribeEventDetails` and `health:DescribeAffectedEntities`
    d. `ReadOnlyAccess`
4. The Lambda lifecycle event is action required. Who said so?
    a. AWS, through `actionability`
    b. The kit's rule: a scheduled change whose event type code names a retirement is a retirement, due at its start
    c. The ISSO
    d. Nobody; it isn't action required
5. An account is in AWS GovCloud (US). Which endpoint does the kit read, and why not EventBridge?
    a. `us-east-1`; EventBridge is too slow
    b. `us-gov-west-1`, the single regional endpoint; EventBridge there doesn't send public events from the Service Health view
    c. Any GovCloud region; EventBridge isn't available at all
    d. `us-gov-east-1`; EventBridge needs a support plan

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in the guide's [Step 4](../../books/guides/provider-notices-implementation.md#step-4-aws-health) and [What AWS gives you](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#what-aws-gives-you).
2. **b.** Taught in the guide's [Step 4](../../books/guides/provider-notices-implementation.md#step-4-aws-health) prerequisites and [What AWS gives you](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#what-aws-gives-you).
3. **c.** Taught in [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#what-it-leaves-to-you) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#dangers).
4. **b.** Taught in [The code](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#the-code).
5. **b.** Taught in the guide's [Step 4](../../books/guides/provider-notices-implementation.md#step-4-aws-health) and [What AWS gives you](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#what-aws-gives-you).
:::

## Summary (2 minutes)

You read the reader's three actions, saw each partition's endpoint, collected five events, told AWS's `actionability` from the kit's rule, built the GovCloud request, and watched the kit refuse eleven ARNs in one call.

**The evidence an ISSO keeps** for G4 from this module: `raw/aws.json`, `notices.json`, `notices.csv` and `manifest.json`, dated; the policy document; and a record of the account's support plan, checked against AWS's current pages. An account without one is a gap to record with the ISSO. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/provider-notices/04-aws-health.md#checklist).

**Next:** [Module 6: Google incidents and the maintenance gap](06-google-incidents-and-the-maintenance-gap.md).
