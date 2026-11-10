---
title: "Module 1: Why provider notices go unread"
description: "Before the gates: why the notices five providers send about the agency's own estate land in a portal or one person's inbox with no owner, the six kinds of notice and who owns each, and the one record every provider's notice becomes, with its action basis and a fingerprint that a second read doesn't change. You collect two weeks of fictional notices from all five providers and read them as one list. About 45 minutes, with a lab on fixtures."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 1
review-status: approved
reviewed-sha256: f96afccbef01b13c713503378840244b0c1294dc3bafb801d33a119e176d7e97
last-reviewed: 2026-11-09
---
# Module 1: Why provider notices go unread {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Before the gates: the guide's [track at a glance](../../books/guides/provider-notices-implementation.md#the-track-at-a-glance). Workbook [Chapter 01](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md), the record. About 45 minutes.*

The narrated deck for this module, and the chapter's narrated tour, come later.

## Introduction (3 minutes)

Providers don't hide their notices. Azure shows them in Service Health, Microsoft 365 in the Message center, Oracle Cloud Infrastructure emails the tenancy administrator, AWS writes to the root user's address and up to three alternate contacts, and Google Cloud writes to its Essential Contacts. Every one of those channels ends at a person or a page, not a queue. The notice carries no owner, no due date and no way to show it was dealt with, and a retirement announced a year ahead is easy to agree with and easy to miss on the day.

In this module you see the answer the rest of the path builds: read each provider's own record, hold every notice as one record, and say for each one whether action is required, by when, and who said so. You collect two fictional weeks from all five providers and read them as one list.

**The federal requirement.** Every gate's collection supports SA-9 c and SI-5 a, and the record supports SI-5 and CA-7. The record is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. Book 15's [evidence table](../../books/b15-day2-operations/14-provider-notices.md#evidence-and-the-federal-requirements-it-supports) names them for the whole process, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#federal-requirements-and-evidence) table has a row for each lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| SA-9 (external system services), part c; SI-5 (security alerts, advisories and directives), part a | KSI-SCR-MIT, KSI-SCR-MON | `raw/`, `notices.json`, `manifest.json`: every notice each provider published, read with its calls and their roles |
| SI-5; CA-7 (continuous monitoring) | KSI-SCR-MON, KSI-MLA-EVC | `notices.json` and `notices.csv`: each notice one record, valid against the schema, with its kind, window, resources and action basis |
| CA-7 | KSI-MLA-EVC | A re-read changes no fingerprint, so a notice is routed once |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain why each provider's notices end at a person or a page, and why email stays an early warning, not the system of record;
- name the six kinds of notice and who owns each under Book 15's roles;
- read the record's fields, and tell a provider's own action date from one the kit's rule inferred;
- show that a second read of the same notices changes no fingerprint.

## Prerequisites (1 minute)

- None from this path: this is the first module.
- Optional: [Book 15, Chapter 03](../../books/b15-day2-operations/03-intake-triage-and-routing.md#notifications-that-claim-to-come-from-microsoft), which routes Microsoft's service health email today and never acts on an email alone.

## Unit 1: Why notices go unread, and who owns them (12 minutes)

Read [Book 15, Chapter 14](../../books/b15-day2-operations/14-provider-notices.md) in this order:

- [Why provider notices go unread](../../books/b15-day2-operations/14-provider-notices.md#why-provider-notices-go-unread): where each of the five providers sends its notices, and the pattern they share.
- [The six kinds of notice](../../books/b15-day2-operations/14-provider-notices.md#the-six-kinds-of-notice): maintenance, retirement, advisory, security, change and incident, and which providers say outright that action is required.
- [Who owns each kind](../../books/b15-day2-operations/14-provider-notices.md#who-owns-each-kind): Book 15's roles, and the two owners it leaves unnamed.
- [From notice to task to closure](../../books/b15-day2-operations/14-provider-notices.md#from-notice-to-task-to-closure): the loop Modules 7 and 8 build.

## Unit 2: One record for five providers (8 minutes)

Read:

- The guide's [track at a glance](../../books/guides/provider-notices-implementation.md#the-track-at-a-glance): each provider's types mapped to the six kinds, and "done when".
- The guide's [five providers compared](../../books/guides/provider-notices-implementation.md#the-five-providers-compared): where the notices live, which kinds each has, and who says action is required.
- The workbook's [The record](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#the-record): the fields of `fmp-provider-notice/1`, and why the fingerprint leaves out `firstSeen`.

## Exercise: Lab 1, fixtures, no tenant (15 minutes)

This lab collects all five providers at once, as the workbook's [Chapter 06, Lab 1](../../project-plans/developer-workbooks/provider-notices/06-routing-to-owners-and-ticket-to-machine-tasks.md#lab-1-fixtures-no-tenant) does in its step 3, then reads the record as [Chapter 01, Lab 1](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#lab-1-fixtures-no-tenant) does in its steps 5 and 6. Steps 2 and 3 are this module's own. Work in `examples/provider-notices`, in PowerShell 7. The estate is fictional.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/provider-notices`. Each step below says what it does and what to look for.

```powershell
# Step 1: Collect every provider from the day-one fixtures
Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/day1

# Step 2: Count the notices by kind, across providers
Import-Csv out/day1/notices.csv | Group-Object kind | Sort-Object Name | Format-Table Name, Count

# Step 3: See who said each one needs action
(Read-PnJson -Path out/day1/notices.json).notices | Where-Object { $_.actionRequired } | ForEach-Object { '{0,-6} {1,-11} {2,-21} {3}' -f $_.provider, $_.kind, $(if ($_.actionRequiredBy) { $_.actionRequiredBy } else { 'no date' }), $_.actionBasis }

# Step 4: Read the Azure retirement in full
(Read-PnJson -Path out/day1/notices.json).notices | Where-Object { $_.kind -eq 'retirement' -and $_.provider -eq 'azure' } | ForEach-Object { [pscustomobject]$_ } | Format-List noticeId, windowStart, windowEnd, actionRequiredBy, actionBasis, resources, sourceUrl, fingerprint

# Step 5: Read the same fixtures a day later and compare the fingerprints
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-10T12:00:00Z -OutputPath out/day1-again
'Fingerprints that differ: ' + @(Compare-Object @((Read-PnJson -Path out/day1/notices.json).notices | ForEach-Object { $_.fingerprint }) @((Read-PnJson -Path out/day1-again/notices.json).notices | ForEach-Object { $_.fingerprint })).Count

# Step 6: Run the record's tests
Invoke-Pester -Path tests/Normalizer.Tests.ps1 -FullNameFilter 'The notice record*', 'The fingerprint*', 'Times and text*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Collect every provider from the day-one fixtures:**

    ```powershell
    Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-09T12:00:00Z -OutputPath out/day1
    ```

    ```text
    Collected as of 2026-11-09T12:00:00Z (Fixture mode, environment lab)

    Provider Cloud        Notices   Open   Action  By kind
    azure    AzureCloud         5      5        2  advisory 1, incident 1, maintenance 1, retirement 1, security 1
    m365     gcc                6      5        2  advisory 3, change 1, incident 1, retirement 1
    oci      oc1                4      3        1  advisory 1, change 1, incident 1, maintenance 1
    aws      aws                5      4        3  incident 1, maintenance 1, retirement 2, security 1
    google   global             2      1        0  incident 2

    22 notices, each valid against schema/notice.schema.json. Written to out/day1: notices.json, notices.csv, raw/, manifest.json
    ```

    Five providers, five shapes, one list. Every provider names its own cloud; there is no default.

2. **Count the notices by kind, across providers:**

    ```powershell
    Import-Csv out/day1/notices.csv | Group-Object kind | Sort-Object Name | Format-Table Name, Count
    ```

    ```text
    Name        Count
    ----        -----
    advisory        5
    change          2
    incident        6
    maintenance     3
    retirement      4
    security        2
    ```

    The kind decides the owner. Book 15's table gives the four retirements to each affected system's owner, and the two security notices to security operations.

3. **See who said each one needs action:**

    ```powershell
    (Read-PnJson -Path out/day1/notices.json).notices | Where-Object { $_.actionRequired } | ForEach-Object { '{0,-6} {1,-11} {2,-21} {3}' -f $_.provider, $_.kind, $(if ($_.actionRequiredBy) { $_.actionRequiredBy } else { 'no date' }), $_.actionBasis }
    ```

    ```text
    aws    retirement  2026-12-01T00:00:00Z  provider: actionability ACTION_REQUIRED
    aws    security    no date               provider: actionability ACTION_REQUIRED
    aws    retirement  2027-01-15T00:00:00Z  rule: AWS scheduled change whose event type code names a retirement; due at its start time
    azure  retirement  2027-09-30T00:00:00Z  rule: Azure retirement (HealthAdvisory, EventSubType Retirement); due at the advisory end time
    azure  security    no date               rule: Azure security advisory; the ISSO reviews every one
    m365   retirement  2027-01-31T08:00:00Z  provider: actionRequiredByDateTime
    m365   change      no date               rule: Message center category preventOrFixIssue
    oci    change      2026-12-15T00:00:00Z  provider: announcementType ACTION_REQUIRED
    ```

    Eight notices need action. Four times the provider said so, and four times a kit rule did, and the record says which. Where the provider gave no date, the kit makes none up.

4. **Read the Azure retirement in full:**

    ```powershell
    (Read-PnJson -Path out/day1/notices.json).notices | Where-Object { $_.kind -eq 'retirement' -and $_.provider -eq 'azure' } | ForEach-Object { [pscustomobject]$_ } | Format-List noticeId, windowStart, windowEnd, actionRequiredBy, actionBasis, resources, sourceUrl, fingerprint
    ```

    Expect `noticeId : azure:RT5J-6KL`, due `2027-09-30T00:00:00Z` by the kit's rule, the one public IP address it names, the source link on `management.azure.com`, and `fingerprint : 02f776686826535d3b3709afe9090e6a16346e1bd34f48c794b9cbfff7cf4f7d`.

5. **Read the same fixtures a day later and compare the fingerprints:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -AsOf 2026-11-10T12:00:00Z -OutputPath out/day1-again
    'Fingerprints that differ: ' + @(Compare-Object @((Read-PnJson -Path out/day1/notices.json).notices | ForEach-Object { $_.fingerprint }) @((Read-PnJson -Path out/day1-again/notices.json).notices | ForEach-Object { $_.fingerprint })).Count
    ```

    The same 22 notices, and the last line is `Fingerprints that differ: 0`. A second read changes `firstSeen` in the run but no fingerprint, so the router in Module 7 sees nothing new.

6. **Run the record's tests:**

    ```powershell
    Invoke-Pester -Path tests/Normalizer.Tests.ps1 -FullNameFilter 'The notice record*', 'The fingerprint*', 'Times and text*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expect `PassedCount 17`, `FailedCount 0`.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test environment (2 minutes to read)

This module has no Lab 2 of its own: the record is the same in a test environment. Each provider's Lab 2, in Modules 2 to 6, fills it from a test subscription, tenant, tenancy, account or project. Before you start them, list who receives each provider's notices today; the guide's [prerequisites](../../books/guides/provider-notices-implementation.md#prerequisites) start with that decision, and the runbook's pre-flight checks that each enabled provider names its notice contacts.

## Knowledge check (5 minutes)

1. Why does the program read each provider's API instead of its email?
    a. The API is faster than email
    b. Email reaches a person who may have left, carries no owner or due date, and can be imitated; the provider's own record is the source of truth and email stays an early warning
    c. Providers have stopped sending email
    d. Email can't hold a retirement date
2. Who owns a retirement notice under Book 15's roles?
    a. The service desk supervisor
    b. Security operations
    c. The system owner of each affected system, who decides the schedule
    d. The provider
3. The Azure retirement's `actionBasis` starts with `rule:`. What does that mean?
    a. Microsoft set the date
    b. The kit inferred that action is required by a stated rule, because Azure has no field the kit reads that says so
    c. The notice is closed
    d. The ISSO approved it
4. You read the same fixtures a day later. Why does no fingerprint change?
    a. The kit caches the first read
    b. The fingerprint is a SHA-256 of the record without `firstSeen` and `fingerprint`, so only a provider's edit changes it
    c. The second run didn't read the fixtures
    d. Fingerprints are random
5. Which provider's API has no planned maintenance at all?
    a. Azure
    b. Microsoft 365
    c. Oracle Cloud Infrastructure
    d. Google Cloud

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in Book 15's [Why provider notices go unread](../../books/b15-day2-operations/14-provider-notices.md#why-provider-notices-go-unread).
2. **c.** Taught in Book 15's [Who owns each kind](../../books/b15-day2-operations/14-provider-notices.md#who-owns-each-kind).
3. **b.** Taught in the guide's [track at a glance](../../books/guides/provider-notices-implementation.md#the-track-at-a-glance) and the workbook's [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#what-it-leaves-to-you).
4. **b.** Taught in the workbook's [The record](../../project-plans/developer-workbooks/provider-notices/01-the-notice-record-and-azure-service-health.md#the-record).
5. **d.** Personalized Service Health has one category, `INCIDENT`. Taught in Book 15's [six kinds of notice](../../books/b15-day2-operations/14-provider-notices.md#the-six-kinds-of-notice) and the guide's [five providers compared](../../books/guides/provider-notices-implementation.md#the-five-providers-compared).
:::

## Summary (2 minutes)

You collected 22 fictional notices from five providers into one list, counted them by the six kinds, saw eight that need action and who said so, and showed that reading them again changes no fingerprint.

**The evidence an ISSO keeps** from this module's pattern: each run's `raw/`, `notices.json`, `notices.csv` and the `manifest.json` that lists every call with its role and hashes every file, dated. Modules 2 to 6 produce it for each provider; Module 8 chains it.

**Next:** [Module 2: Azure Service Health and alerts](02-azure-service-health-and-alerts.md).
