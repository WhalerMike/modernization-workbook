---
title: "Module 3: Microsoft 365 Message center"
description: "Gate G2 and workbook Chapter 02: read a tenant's Message center posts and service health issues through the Microsoft Graph service communications API with only ServiceMessage.Read.All and ServiceHealth.Read.All, on the Graph host for the tenant's cloud (GCC on the worldwide endpoint, GCC High and DoD on their own); map posts to kinds; keep Microsoft's actionRequiredByDateTime apart from the kit's rule; and refuse a next link on another host. About 50 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 3
review-status: approved
reviewed-sha256: c0d1d4c4608bdb5184e7990b7a332fa5b23098f2a4270fffc0aa415f0623164f
last-reviewed: 2026-11-09
---
# Module 3: Microsoft 365 Message center {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Gate G2 Microsoft 365. Workbook [Chapter 02](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md). About 50 minutes.*

The narrated deck for this module, and the chapter's narrated tour, come later.

## Introduction (3 minutes)

The Message center is where Microsoft announces changes, retirements and actions for a Microsoft 365 tenant; service health lists incidents and advisories. Each administrator's view of the Message center is their own, and the "Act by" date is rare enough that Microsoft says to pay extra attention when it appears. Graph's service communications API reads both, with two read permissions.

In this module you read the fixture tenant's posts and issues, see which ones Microsoft said need action and which the kit's rule marked, and watch the kit refuse to follow a next link off the tenant's own Graph host. A GCC High tenant read on the worldwide host returns nothing, and an empty list looks like a quiet week.

**The federal requirement.** Gate G2 supports SA-9 c, SI-5 a and, for posts that announce a change, CM-3 b. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Step 2](../../books/guides/provider-notices-implementation.md#step-2-microsoft-365-message-center-and-service-health) names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| SA-9 c | KSI-SCR-MIT, KSI-SCR-MON | `Get-PnRequiredPermission -Provider m365`: two read permissions; the consent record |
| SA-9 c; SI-5 a | KSI-SCR-MIT, KSI-SCR-MON | `raw/m365.json`, `notices.json`, `manifest.json`; every request on the tenant's own Graph host |
| SI-5; CM-3 b (review proposed changes), through the tasks Module 7 routes | KSI-SCR-MON, KSI-CMT-LMC, KSI-CMT-RVP | Change and retirement notices with their `actionBasis` |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- name the two Graph permissions the reader needs, and the role data privacy messages need;
- say which Graph host each Microsoft 365 cloud uses, and why the wrong one fails silently;
- map Message center posts and service health issues to the record's kinds;
- tell a date Microsoft set from the kit's rule for a `preventOrFixIssue` post;
- show that the kit refuses a next link on another host.

## Prerequisites (1 minute)

- [Module 1](01-why-provider-notices-go-unread.md): the record and its action basis.
- [Book 15, Chapter 03](../../books/b15-day2-operations/03-intake-triage-and-routing.md#notifications-that-claim-to-come-from-microsoft): why nothing is approved on the strength of an email.

## Unit 1: What the gate asks for (7 minutes)

Read the guide's [Step 2](../../books/guides/provider-notices-implementation.md#step-2-microsoft-365-message-center-and-service-health): consent to the two permissions, sign in to the tenant's own cloud (`Global` for GCC, `USGov` for GCC High, `USGovDoD` for DoD), and collect. Then read its Government-cloud availability and Interim path paragraphs, and the Validate (G2) callout: a post with an action-required date is action required with that date and the basis `provider: actionRequiredByDateTime`.

## Unit 2: The Graph reader (10 minutes)

Read the workbook chapter in this order:

- [What Microsoft gives you](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#what-microsoft-gives-you): the three list calls, their permissions and the national cloud hosts.
- [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#what-it-leaves-to-you): categories and tags, `actionRequiredByDateTime`, next links and a post's end date.
- [The code](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#the-code): how each post and issue becomes a kind, and the session guard.
- [Dangers](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#dangers).

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This is the workbook's [Chapter 02, Lab 1](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/provider-notices`, in PowerShell 7. The tenant is fictional, in `gcc`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/provider-notices`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what Microsoft 365 needs
Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
Get-PnRequiredPermission -Provider m365 | Format-Table Call, Permissions, Verified

# Step 2: See each cloud's Graph host
foreach ($c in 'gcc', 'gcchigh', 'dod') { $x = Get-PnCloud -Provider m365 -Cloud $c; '{0,-8} {1,-32} {2}' -f $c, $x.Graph, $x.GraphEnvironment }

# Step 3: Collect Microsoft 365 from the day-one fixtures
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider m365 -AsOf 2026-11-09T12:00:00Z -OutputPath out/m365

# Step 4: Read the records
Import-Csv out/m365/notices.csv | Format-Table noticeId, kind, status, actionRequired, actionRequiredBy, title

# Step 5: See who said each one needs action
(Read-PnJson -Path out/m365/notices.json).notices | ForEach-Object { [pscustomobject]@{ noticeId = $_.noticeId; actionBasis = $_.actionBasis } } | Format-Table

# Step 6: Collect the second week and read what changed
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider m365 -AsOf 2026-11-16T12:00:00Z -OutputPath out/m365-day2
Import-Csv out/m365-day2/notices.csv | Format-Table noticeId, kind, status, actionRequiredBy, title

# Step 7: Build the live request without sending it, then try a next link on another host
$s = Read-PnSettings -Path tests/fixtures/settings.lab.json
(Get-PnLiveCommand -CallId m365-messages -Settings $s).Uri
Get-PnLiveCommand -CallId m365-messages -Settings $s -Arguments @{ nextLink = 'https://graph.example.net/v1.0/admin/serviceAnnouncement/messages?skip=100' }

# Step 8: Run this chapter's tests
Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Microsoft 365 service communications*', '*Graph*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what Microsoft 365 needs:**

    ```powershell
    Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
    Get-PnRequiredPermission -Provider m365 | Format-Table Call, Permissions, Verified
    ```

    ```text
    Call                  Permissions             Verified
    ----                  -----------             --------
    m365-messages         ServiceMessage.Read.All     True
    m365-issues           ServiceHealth.Read.All      True
    m365-health-overviews ServiceHealth.Read.All      True
    ```

2. **See each cloud's Graph host:**

    ```powershell
    foreach ($c in 'gcc', 'gcchigh', 'dod') { $x = Get-PnCloud -Provider m365 -Cloud $c; '{0,-8} {1,-32} {2}' -f $c, $x.Graph, $x.GraphEnvironment }
    ```

    ```text
    gcc      https://graph.microsoft.com      Global
    gcchigh  https://graph.microsoft.us       USGov
    dod      https://dod-graph.microsoft.us   USGovDoD
    ```

3. **Collect Microsoft 365 from the day-one fixtures:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider m365 -AsOf 2026-11-09T12:00:00Z -OutputPath out/m365
    ```

    Expect the row `m365     gcc                6      5        2  advisory 3, change 1, incident 1, retirement 1`: six notices, five open, two needing action.

4. **Read the records:**

    ```powershell
    Import-Csv out/m365/notices.csv | Format-Table noticeId, kind, status, actionRequired, actionRequiredBy, title
    ```

    `m365:MC900001` is a retirement due `2027-01-31T08:00:00Z`; `m365:MC900003` is a change that needs action with no date; the resolved issue `m365:TM900102` is closed.

5. **See who said each one needs action:**

    ```powershell
    (Read-PnJson -Path out/m365/notices.json).notices | ForEach-Object { [pscustomobject]@{ noticeId = $_.noticeId; actionBasis = $_.actionBasis } } | Format-Table
    ```

    ```text
    noticeId      actionBasis
    --------      -----------
    m365:EX900101 none
    m365:MC900001 provider: actionRequiredByDateTime
    m365:MC900002 none
    m365:MC900003 rule: Message center category preventOrFixIssue
    m365:MC900004 none
    m365:TM900102 none
    ```

6. **Collect the second week and read what changed:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider m365 -AsOf 2026-11-16T12:00:00Z -OutputPath out/m365-day2
    Import-Csv out/m365-day2/notices.csv | Format-Table noticeId, kind, status, actionRequiredBy, title
    ```

    Seven notices. A new post, `m365:MC900005`, is a change due `2027-02-28T08:00:00Z`; `m365:MC900003`'s title now starts `(Updated)`; and the incident `m365:EX900101` is closed.

7. **Build the live request without sending it, then try a next link on another host:**

    ```powershell
    $s = Read-PnSettings -Path tests/fixtures/settings.lab.json
    (Get-PnLiveCommand -CallId m365-messages -Settings $s).Uri
    Get-PnLiveCommand -CallId m365-messages -Settings $s -Arguments @{ nextLink = 'https://graph.example.net/v1.0/admin/serviceAnnouncement/messages?skip=100' }
    ```

    The first line prints `https://graph.microsoft.com/v1.0/admin/serviceAnnouncement/messages`. The second is refused: `Exception: Refusing https://graph.example.net/v1.0/admin/serviceAnnouncement/messages?skip=100: it isn't on the gcc Graph host https://graph.microsoft.com.`

8. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Microsoft 365 service communications*', '*Graph*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expect `PassedCount 15`, `FailedCount 0`.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, a test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 02, Lab 2](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#lab-2-a-test-tenant). It has the exact commands.

- **You need:** a Microsoft 365 test tenant in the worldwide or GCC cloud, never production, and a test administrator who holds an admin role; an administrator consents to the two read scopes once.
- **What you do:** sign in, delegated, with only `ServiceMessage.Read.All` and `ServiceHealth.Read.All`; cross-check Learn's own cmdlet against the collection; look at the posts that need action; and record the tags you see on retirement posts, which Learn doesn't list.
- **Back-out:** step 4 signs out, deletes the run, and removes the consent in the Microsoft Entra admin center if it was granted only for this lab.

## Knowledge check (5 minutes)

1. Which permissions does the Microsoft 365 reader need?
    a. `Directory.Read.All` and `AuditLog.Read.All`
    b. `ServiceMessage.Read.All` for posts and `ServiceHealth.Read.All` for issues and health overviews
    c. Global Administrator
    d. `ServiceHealth.ReadWrite.All`
2. A GCC tenant is read on which Graph host?
    a. `graph.microsoft.us`
    b. `dod-graph.microsoft.us`
    c. `graph.microsoft.com`, the worldwide endpoint
    d. Any of them; the API is the same
3. `m365:MC900003` is action required with no date. Why?
    a. Microsoft set `actionRequiredByDateTime`
    b. The kit's rule marks a `preventOrFixIssue` post without a date as action required, and labels it `rule:`
    c. It is tagged Retirement
    d. The kit sets every change to action required by default
4. A response's `@odata.nextLink` points to a host that isn't the tenant's Graph host. What does the kit do?
    a. Follows it
    b. Follows it without the token
    c. Refuses it
    d. Stops paging silently
5. Who can see data privacy messages in the Message center?
    a. Any reader with `ServiceMessage.Read.All`
    b. Global Administrators and Message Center Privacy Readers
    c. Nobody through Graph
    d. Service desk agents

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [What Microsoft gives you](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#what-microsoft-gives-you).
2. **c.** Taught in the guide's [Step 2](../../books/guides/provider-notices-implementation.md#step-2-microsoft-365-message-center-and-service-health) and [What Microsoft gives you](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#what-microsoft-gives-you).
3. **b.** Taught in [The code](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#the-code).
4. **c.** Taught in [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#what-it-leaves-to-you) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#dangers).
5. **b.** Taught in the guide's [prerequisites](../../books/guides/provider-notices-implementation.md#prerequisites) and [What Microsoft gives you](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#what-microsoft-gives-you).
:::

## Summary (2 minutes)

You listed the reader's two permissions, saw each cloud's Graph host, collected six posts and issues and then the second week's seven, told Microsoft's dates from the kit's rule, and watched the kit refuse a next link on another host.

**The evidence an ISSO keeps** for G2 from this module: `raw/m365.json`, `notices.json`, `notices.csv` and `manifest.json`, dated; the permission list from step 1; and in Lab 2 the consent record. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/provider-notices/02-microsoft-365-message-center-and-service-health.md#checklist).

**Next:** [Module 4: Oracle Cloud Infrastructure announcements](04-oci-announcements.md).
