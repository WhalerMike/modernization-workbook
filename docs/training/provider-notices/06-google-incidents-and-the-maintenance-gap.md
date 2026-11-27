---
title: "Module 6: Google incidents and the maintenance gap"
description: "Gate G5 and workbook Chapter 05: read a Google Cloud project's Personalized Service Health incidents with roles/servicehealth.viewer, and write down what the API doesn't cover: it has one event category, INCIDENT, so planned maintenance never arrives, and Personalized Service Health isn't in Assured Workloads' FedRAMP Moderate or FedRAMP High packages. See the kit refuse a call nobody verified. About 45 minutes, with a lab on fixtures and a test project lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 15"
series-order: 6
review-status: approved
reviewed-sha256: 57a8577e2b42e65127bc98488881bd8c13563c1336c61478f3cf4c0341503372
last-reviewed: 2026-11-25
---
# Module 6: Google incidents and the maintenance gap {.unnumbered}

*Part of the [Provider Notices learning path](index.md). Gate G5 Google Cloud. Workbook [Chapter 05](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md). About 45 minutes.*

**Watch:** the narrated deck for this module (about 12 minutes, captions): [▶ Watch](../../presentations/watch.html?v=Training_PN_Module_6_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_PN_Module_6_Narrated.mp4) · [Deck source](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-pn-module-6) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-6/Training_PN_Module_6_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-pn-module-6/Training_PN_Module_6_Narrated.vtt). The deck files join the next edition.

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_PN_05_Google_Personalized_Service_Health_Narrated).

## Introduction (3 minutes)

Personalized Service Health lists the Google Cloud incidents relevant to a project or organization. Its API has one event category, `INCIDENT`: planned maintenance and security notices reach a Google Cloud project by other channels, such as the Essential Contacts categories. And Assured Workloads' supported-products page lists Personalized Service Health under 25 regional packages but not under FedRAMP Moderate, FedRAMP High, CJIS or ITAR.

So this gate is half collection and half honesty. In this module you read the fixture project's incidents, show that only one kind can ever arrive, and see the kit refuse the organization-level call that nobody has verified. The gap is written down with the ISSO, not papered over.

**The federal requirement.** Gate G5 supports SA-9 c and SI-5 a, and recording the gaps supports RA-3 f. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Step 5](../../books/guides/provider-notices-implementation.md#step-5-google-cloud-personalized-service-health) names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| SA-9 c | KSI-SCR-MIT, KSI-SCR-MON | `Get-PnRequiredPermission -Provider google`; the role binding |
| SA-9 c; SI-5 a | KSI-SCR-MIT, KSI-SCR-MON | `raw/google.json`, `notices.json`, `manifest.json` |
| SA-9 c | KSI-SCR-MON | A call nobody verified isn't run |
| SA-9 c; RA-3 (risk assessment), part f | KSI-SCR-MON, KSI-SCR-MIT | The gaps (no maintenance; not in the FedRAMP packages), written down with the ISSO |

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

This is the workbook's [Chapter 05, Lab 1](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#lab-1-fixtures-no-tenant), which explains each result. The project is fictional, `contoso-example-prod`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\provider-notices-code\provider-notices

$Run = "C:\FMWLabs\results\provider-notices-06-google-incidents-and-the-maintenance-gap\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: List what Google Cloud needs
Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
Get-PnRequiredPermission -Provider google | Format-List Call, Permissions, Verified | Out-String -Width 400

# Step 2: Collect Google Cloud from the day-one fixtures
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider google -AsOf 2026-11-09T12:00:00Z -OutputPath "$Run\google"

# Step 3: Read the records
Import-Csv "$Run\google\notices.csv" | Format-Table kind, status, title, services, regions

# Step 4: Collect the second week
./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider google -AsOf 2026-11-16T12:00:00Z -OutputPath "$Run\google-day2"
Import-Csv "$Run\google-day2\notices.csv" | Format-Table kind, status, title, windowEnd

# Step 5: See what kinds Google can send
Import-Csv "$Run\google\notices.csv", "$Run\google-day2\notices.csv" | Group-Object kind | Format-Table Name, Count

# Step 6: Ask the live invoker for the organization call
$s = Read-PnSettings -Path tests/fixtures/settings.lab.json
$s.providers.google.scope = 'organization'; $s.providers.google.organization = '123456789012'
try { Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $s -SkipContextCheck) -CallId google-organization-events } catch { $_.Exception.Message }

# Step 7: Build the project command without running it
(Get-PnLiveCommand -CallId google-events -Settings $s).Arguments -join ' '

# Step 8: Run this chapter's tests
Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Google Cloud Personalized Service Health*', '*Google*', '*unverified*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Get-ChildItem C:\FMWLabs\results\provider-notices-06-google-incidents-and-the-maintenance-gap\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\provider-notices-code\provider-notices
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\provider-notices-06-google-incidents-and-the-maintenance-gap\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\provider-notices-06-google-incidents-and-the-maintenance-gap\lab1\<run>
```

The run's date is only the folder's name. The data's date is `-AsOf`, which stays the same, so every run's results match this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/provider-notices-code/provider-notices`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **List what Google Cloud needs:**

    ```powershell
    Import-Module ./powershell/ProviderNotices/ProviderNotices.psm1
    Get-PnRequiredPermission -Provider google | Format-List Call, Permissions, Verified | Out-String -Width 400
    ```

    Expected output:

    ```text
    Call        : google-events
    Permissions : roles/servicehealth.viewer (Personalized Service Health Viewer) on the project: servicehealth.events.list
    Verified    : True

    Call        : google-organization-events
    Permissions : roles/servicehealth.viewer on the organization: servicehealth.organizationEvents.list
    Verified    : False
    ```

    Two calls: `google-events`, `roles/servicehealth.viewer (Personalized Service Health Viewer) on the project: servicehealth.events.list`, `Verified : True`; and `google-organization-events`, on the organization, `Verified : False`. `Out-String -Width 400` keeps each value on one line, whatever the width of your window.

2. **Collect Google Cloud from the day-one fixtures:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day1 -Provider google -AsOf 2026-11-09T12:00:00Z -OutputPath "$Run\google"
    ```

    Expected output:

    ```text
    Collected as of 2026-11-09T12:00:00Z (Fixture mode, environment lab)

    Provider Cloud        Notices   Open   Action  By kind
    google   global             2      1        0  incident 2

    2 notices, each valid against schema/notice.schema.json. Written to C:\FMWLabs\results\provider-notices-06-google-incidents-and-the-maintenance-gap\lab1\<run>\google: notices.json, notices.csv, raw/, manifest.json
    ```

3. **Read the records:**

    ```powershell
    Import-Csv "$Run\google\notices.csv" | Format-Table kind, status, title, services, regions
    ```

    Expected output:

    ```text
    kind     status title                                   services         regions
    ----     ------ -----                                   --------         -------
    incident open   Cloud SQL connection errors in us-east4 Google Cloud SQL us-east4
    incident closed Cloud Storage latency in us-central1    Cloud Storage    us-central1
    ```

4. **Collect the second week:**

    ```powershell
    ./Invoke-PnCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/day2 -Provider google -AsOf 2026-11-16T12:00:00Z -OutputPath "$Run\google-day2"
    Import-Csv "$Run\google-day2\notices.csv" | Format-Table kind, status, title, windowEnd
    ```

    Expected output:

    ```text
    Collected as of 2026-11-16T12:00:00Z (Fixture mode, environment lab)

    Provider Cloud        Notices   Open   Action  By kind
    google   global             2      0        0  incident 2

    2 notices, each valid against schema/notice.schema.json. Written to C:\FMWLabs\results\provider-notices-06-google-incidents-and-the-maintenance-gap\lab1\<run>\google-day2: notices.json, notices.csv, raw/, manifest.json

    kind     status title                                   windowEnd
    ----     ------ -----                                   ---------
    incident closed Cloud SQL connection errors in us-east4 2026-11-09T13:00:00Z
    incident closed Cloud Storage latency in us-central1    2026-11-04T13:20:00Z
    ```

    Both incidents are closed; the Cloud SQL incident ended `2026-11-09T13:00:00Z`.

5. **See what kinds Google can send:**

    ```powershell
    Import-Csv "$Run\google\notices.csv", "$Run\google-day2\notices.csv" | Group-Object kind | Format-Table Name, Count
    ```

    Expected output:

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
    try { Invoke-PnCall -Invoker (New-PnLiveInvoker -Settings $s -SkipContextCheck) -CallId google-organization-events } catch { $_.Exception.Message }
    ```

    Expected output, the error's message:

    ```text
    Call google-organization-events isn't verified against its provider's documentation (The gcloud group organization-events is listed on the gcloud beta reference; the exact GA flags for it weren't read. The REST call is verified). Pass -AllowUnverified to run it.
    ```

    The kit refuses before `gcloud` starts; `try` and `catch` print the message and keep the window going. The reason in the parentheses says the REST call is verified and the gcloud flags weren't read.

7. **Build the project command without running it:**

    ```powershell
    (Get-PnLiveCommand -CallId google-events -Settings $s).Arguments -join ' '
    ```

    Expected output:

    ```text
    service-health events list --project=contoso-example-prod --location=global --format=json
    ```

8. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests/Collectors.Tests.ps1, tests/Live.Tests.ps1 -FullNameFilter 'Google Cloud Personalized Service Health*', '*Google*', '*unverified*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expected output:

    ```text
    PassedCount FailedCount
    ----------- -----------
              8           0
    ```

Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\provider-notices-06-google-incidents-and-the-maintenance-gap\lab1 -Name
```

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Exercise: Lab 2, a test project (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 05, Lab 2](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#lab-2-a-test-project). It has the exact commands.

<!-- labs:begin module-lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #module-lab-2-commands collapse="false" title="The Lab 2 commands, against your test environment"}
Every command in [Chapter 05, Lab 2](../../project-plans/developer-workbooks/provider-notices/05-google-cloud-personalized-service-health.md#lab-2-a-test-project), in order, against your test environment, never production.

Replace each `<placeholder>` with your test environment's value.

The chapter's steps say what each command does and what to look for.

```powershell
# Step 1: Enable the API and grant the viewer role
gcloud services enable servicehealth.googleapis.com --project=<project-id>
gcloud projects add-iam-policy-binding <project-id> --member=group:<group-email> --role=roles/servicehealth.viewer

# Step 2: Sign in as the reader
gcloud auth login

# Step 3: Cross-check with Google's command, then collect
gcloud service-health events list --project=<project-id> --location=global --format=json | ConvertFrom-Json | Measure-Object | Select-Object Count
./Invoke-PnCollect.ps1 -SettingsPath <settings-file> -Provider google -OutputPath out/google-test
Import-Csv out/google-test/notices.csv | Format-Table kind, status, title, services, regions

# Step 4: Back it out
gcloud projects remove-iam-policy-binding <project-id> --member=group:<group-email> --role=roles/servicehealth.viewer
Remove-Item -Recurse -Force out/google-test
```
:::

<!-- labs:end -->

- **You need:** a Google Cloud test project, never production, its project owner, and a Google group for the reader. The project may have no incidents, which is a valid result.
- **What you do:** enable the API, grant the viewer role, sign in as the reader, cross-check Google's command against the collection, then record the gaps with the ISSO: whether the project is in an Assured Workloads FedRAMP package, and in every case that Google's planned maintenance doesn't come through this API.
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
