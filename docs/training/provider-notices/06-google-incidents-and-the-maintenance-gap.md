---
title: "Module 6: Google incidents and the maintenance gap"
description: "Gate G5 and workbook Chapter 05: read a Google Cloud project's Personalized Service Health incidents with roles/servicehealth.viewer, and write down what the API doesn't cover: it has one event category, INCIDENT, so planned maintenance never arrives, and Personalized Service Health isn't in Assured Workloads' FedRAMP Moderate, FedRAMP High, IL4 or IL5 packages. See the kit refuse a call nobody verified. About 45 minutes, with a lab on fixtures and a test project lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 6
review-status: approved
reviewed-sha256: 7f77116bfc3829af231cff6f185d73435d109da6a0c3f6ce7a918a06b0dca1b7
last-reviewed: 2026-11-09
---
# Module 6: Google incidents and the maintenance gap {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Gate G5 Google Cloud. Workbook [Chapter 05](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md). About 45 minutes.*

**Watch:** the narrated deck for this module (about 12 minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_PN_Module_6_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PN_Module_6_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-pn-module-6) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-6/Training_PN_Module_6_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-6/Training_PN_Module_6_Narrated.vtt). The deck files join the next edition.

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_PN_05_Google_Personalized_Service_Health_Narrated).

## Introduction (3 minutes)

Personalized Service Health lists the Google Cloud incidents relevant to a project or organization. Its API has one event category, `INCIDENT`: planned maintenance and security notices reach a Google Cloud project by other channels, such as the Essential Contacts categories. And Assured Workloads' supported-products page lists Personalized Service Health under 25 regional packages but not under FedRAMP Moderate, FedRAMP High, IL2, IL4, IL5, CJIS or ITAR.

So this gate is half collection and half honesty. In this module you read the fixture project's incidents, show that only one kind can ever arrive, and see the kit refuse the organization-level call that nobody has verified. The gap is written down with the ISSO, not papered over.

**The federal requirement.** Gate G5 supports SA-9 c and SI-5 a, and recording the gaps supports RA-3 f. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Step 5](../../books/guides/provider-notices-implementation.md#step-5-google-cloud-personalized-service-health) names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| SA-9 c | KSI-SCR-MIT, KSI-SCR-MON | `Get-PnRequiredPermission -Provider google`; the role binding |
| SA-9 c; SI-5 a | KSI-SCR-MIT, KSI-SCR-MON | `raw/google.json`, `notices.json`, `manifest.json` |
| SA-9 c | KSI-SCR-MON | A call nobody verified isn't run |
| SA-9 c; RA-3 (risk assessment), part f | KSI-SCR-MON, KSI-SCR-MIT | The gaps (no maintenance; not in the FedRAMP or IL packages), written down with the ISSO |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/provider-notices-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- name the role and the one-time API enablement the reader needs;
- collect a project's incidents and read their products and locations;
- explain why Google Cloud's planned maintenance isn't in this gate, and where it reaches the project instead;
- say which Assured Workloads packages don't include Personalized Service Health, and what to record;
- show that the kit refuses an unverified call without `-AllowUnverified`.

## Prerequisites (1 minute)

- [Module 1](01-why-provider-notices-go-unread.md): the record and the six kinds.
- Book 15's [Honest limits](../../books/b15-day2-operations/14-provider-notices.md#honest-limits).

## Unit 1: What the gate asks for (6 minutes)

Read the guide's [Step 5](../../books/guides/provider-notices-implementation.md#step-5-google-cloud-personalized-service-health): enable the API, grant the viewer role, cross-check Google's own `gcloud service-health events list`, and collect. Then read its Government-cloud availability paragraph, its Interim path (the organization call, verified on Google's REST reference but run by the kit only with `-AllowUnverified`), and the Validate (G5) callout. Read the guide's [Dangers](../../books/guides/provider-notices-implementation.md#dangers) row "Google maintenance assumed covered".

## Unit 2: The incident reader and its gaps (8 minutes)

Read the workbook chapter in this order:

- [What Google gives you](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#what-google-gives-you): the list calls, the Event resource with its one category, the role and the Assured Workloads page.
- [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#what-it-leaves-to-you): impacts, updates, no action field, and the unverified call.
- [The code](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#the-code) and [Dangers](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#dangers).

## Exercise: Lab 1, fixtures, no tenant (15 minutes)

This is the workbook's [Chapter 05, Lab 1](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/provider-notices`, in PowerShell 7. The project is fictional, `contoso-example-prod`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/provider-notices`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what Google Cloud needs
Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
Get-PnRequiredPermission -Provider google | Format-List Call, Permissions, Verified

# Step 2: Collect Google Cloud from the day-one fixtures
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider google -AsOf 2026-11-09T12:00:00Z -OutputPath out/google

# Step 3: Read the records
Import-Csv out/google/notices.csv | Format-Table kind, status, title, services, regions

# Step 4: Collect the second week
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider google -AsOf 2026-11-16T12:00:00Z -OutputPath out/google-day2
Import-Csv out/google-day2/notices.csv | Format-Table kind, status, title, windowEnd

# Step 5: See what kinds Google can send
Import-Csv out/google/notices.csv, out/google-day2/notices.csv | Group-Object kind | Format-Table Name, Count

# Step 6: Ask the live invoker for the organization call
$s = Read-PnSettings -Path tests/fixtures/settings.lab.json
$s.providers.google.scope = 'organization'; $s.providers.google.organization = '123456789012'
Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $s -SkipContextCheck) -CallId google-organization-events

# Step 7: Build the project command without running it
(Get-PnLiveCommand -CallId google-events -Settings $s).Arguments -join ' '

# Step 8: Run this chapter's tests
Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Google Cloud Personalized Service Health*', '*Google*', '*unverified*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what Google Cloud needs:**

    ```powershell
    Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
    Get-PnRequiredPermission -Provider google | Format-List Call, Permissions, Verified
    ```

    Two calls: `google-events`, `roles/servicehealth.viewer (Personalized Service Health Viewer) on the project: servicehealth.events.list`, `Verified : True`; and `google-organization-events`, on the organization, `Verified : False`.

2. **Collect Google Cloud from the day-one fixtures:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider google -AsOf 2026-11-09T12:00:00Z -OutputPath out/google
    ```

    Expect the row `google   global             2      1        0  incident 2`.

3. **Read the records:**

    ```powershell
    Import-Csv out/google/notices.csv | Format-Table kind, status, title, services, regions
    ```

    ```text
    kind     status title                                   services         regions
    ----     ------ -----                                   --------         -------
    incident open   Cloud SQL connection errors in us-east4 Google Cloud SQL us-east4
    incident closed Cloud Storage latency in us-central1    Cloud Storage    us-central1
    ```

4. **Collect the second week:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider google -AsOf 2026-11-16T12:00:00Z -OutputPath out/google-day2
    Import-Csv out/google-day2/notices.csv | Format-Table kind, status, title, windowEnd
    ```

    Both incidents are closed; the Cloud SQL incident ended `2026-11-09T13:00:00Z`.

5. **See what kinds Google can send:**

    ```powershell
    Import-Csv out/google/notices.csv, out/google-day2/notices.csv | Group-Object kind | Format-Table Name, Count
    ```

    ```text
    Name     Count
    ----     -----
    incident     4
    ```

    One kind across both weeks. Maintenance, retirements and security notices never come through this API.

6. **Ask the live invoker for the organization call:**

    ```powershell
    $s = Read-PnSettings -Path tests/fixtures/settings.lab.json
    $s.providers.google.scope = 'organization'; $s.providers.google.organization = '123456789012'
    Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $s -SkipContextCheck) -CallId google-organization-events
    ```

    Expect an error before `gcloud` starts: `Exception: Call google-organization-events isn't verified against its provider's documentation (...). Pass -AllowUnverified to run it.` The reason in the parentheses says the REST call is verified and the gcloud flags weren't read.

7. **Build the project command without running it:**

    ```powershell
    (Get-PnLiveCommand -CallId google-events -Settings $s).Arguments -join ' '
    ```

    ```text
    service-health events list --project=contoso-example-prod --location=global --format=json
    ```

8. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Google Cloud Personalized Service Health*', '*Google*', '*unverified*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expect `PassedCount 8`, `FailedCount 0`.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, a test project (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 05, Lab 2](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#lab-2-a-test-project). It has the exact commands.

- **You need:** a Google Cloud test project, never production, its project owner, and a Google group for the reader. The project may have no incidents, which is a valid result.
- **What you do:** enable the API, grant the viewer role, sign in as the reader, cross-check Google's command against the collection, then record the gaps with the ISSO: whether the project is in an Assured Workloads FedRAMP or IL package, and in every case that Google's planned maintenance doesn't come through this API.
- **Back-out:** step 4 removes the role binding and deletes the run, and leaves the API enabled unless the project owner decides otherwise.

## Knowledge check (5 minutes)

1. Which role reads a project's Personalized Service Health events?
    a. `roles/viewer`
    b. `roles/servicehealth.viewer`
    c. `roles/owner`
    d. `roles/monitoring.viewer`
2. Why does Gate G5 cover incidents only?
    a. The kit filters out everything else
    b. The API's event category has one value, `INCIDENT`; planned maintenance isn't in it
    c. Google Cloud has no maintenance
    d. The viewer role can't see maintenance
3. A workload is in an Assured Workloads FedRAMP Moderate package. What does the agency do?
    a. Reads Personalized Service Health as usual
    b. Records the gap with the ISSO: Personalized Service Health isn't in that package, so the project relies on the provider's other channels
    c. Moves the workload to US Data Boundary
    d. Nothing; an empty list means no incidents
4. Why does the kit refuse `google-organization-events` without `-AllowUnverified`?
    a. Organizations can't be read
    b. The REST call is verified, but the gcloud flags for it weren't read, so the call is marked unverified
    c. It needs a support plan
    d. It writes to the organization
5. Where do Google Cloud's planned maintenance and security notices reach the agency?
    a. Through Personalized Service Health, a week later
    b. By other channels, such as the contacts set in Essential Contacts
    c. They don't exist
    d. Through Azure Service Health

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in the guide's [Step 5](../../books/guides/provider-notices-implementation.md#step-5-google-cloud-personalized-service-health) and [What Google gives you](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#what-google-gives-you).
2. **b.** Taught in [What Google gives you](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#what-google-gives-you).
3. **b.** Taught in the guide's [Step 5](../../books/guides/provider-notices-implementation.md#step-5-google-cloud-personalized-service-health) and the chapter's [Dangers](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#dangers).
4. **b.** Taught in [What it leaves to you](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#what-it-leaves-to-you).
5. **b.** Taught in Book 15's [six kinds of notice](../../books/b15-day2-operations/14-provider-notices.md#the-six-kinds-of-notice) and [Honest limits](../../books/b15-day2-operations/14-provider-notices.md#honest-limits).
:::

## Summary (2 minutes)

You read the reader's role, collected two incidents and then saw both close, showed that only one kind ever arrives, and watched the kit refuse a call nobody verified.

**The evidence an ISSO keeps** for G5 from this module: `raw/google.json`, `notices.json`, `notices.csv` and `manifest.json`, dated; the role binding; and the written gaps: no planned maintenance through the API, and any workload in a package that doesn't include Personalized Service Health. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#checklist).

**Next:** [Module 7: Routing to owners](07-routing-to-owners.md).
