---
title: "Chapter 02 — The Consent Request Review"
description: "Book 15, Chapter 12's third task as a read-only scheduled job: every pending admin consent request in the tenant, read with ConsentRequest.Read.All through Learn's own filter, written as a register with each application's permissions, requesters and oldest request, and two findings: a request waiting longer than the agency's limit (HT-CR-01) and a permission broad enough that the identity governance approver must decide it (HT-CR-02). The verdict stays with a person. Labs on fixtures and in a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-help-desk-automation
part: How
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-27
review-status: pending
---
# Chapter 02 — The Consent Request Review

*A consent request nobody decides is a user waiting and a risk nobody has weighed. The review makes both visible every morning, and decides neither.*

::: {.callout-note}
## In this chapter
[Book 15, Chapter 12, task 3](../../../books/b15-day2-operations/12-the-day-two-runbook.md#admin-consent-for-a-third-party-application) puts the verdict on an admin consent request with the identity governance approver, after the service's authorization is recorded, and never with the help desk. This chapter builds the part a machine can do: list every pending request, how long it has waited and what it asks for. You start with Learn's *List appConsentRequests* and its filter, then read `Get-HtPendingConsentRequest`, its limits file and its two findings. Lab 1 reviews the fixture tenant, tightens the limit, and runs the review as the platform host's scheduled job would. Lab 2 reads a test tenant's real requests with the read-only permission and nothing else.
:::

## Goal and audience

**Goal.** By the end of this chapter you can produce, from a schedule and with one read-only permission, a register of every pending admin consent request and a short list of the ones that need a decision now, with a manifest that hashes both.

**Audience.** Developers who maintain the kit, the identity governance approver who decides the requests, and the ISSO. You don't need a tenant until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

Learn's *List appConsentRequests* reads `GET /identityGovernance/appConsent/appConsentRequests` with `ConsentRequest.Read.All` as the least-privileged permission, delegated and application; `ConsentRequest.ReadWrite.All` is higher. It supports `$filter` (`eq`) on the `userConsentRequests` relationship, and its second example lists the applications "with at least one userConsentRequest whose status is InProgress" with `userConsentRequests/any (u:u/status eq 'InProgress')`. The response "doesn't expand the related userConsentRequests relationship."[^ht02-list] A second call lists one application's user requests, with the same permission.[^ht02-user-list] The admin consent workflow itself, which only a Global Administrator can turn on, sends each request by email to the designated reviewers, and the tenant's setting **Consent request expires after (days)** sets how long a request stays valid.[^ht02-workflow]

### What it leaves to you

Each row is pinned by a test in the `Pending admin consent requests` block of `tests/HelpDeskAutomation.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| The applications with a pending request, without their user requests | Nobody can see who asked or for how long | A second declared call per application; requesters counted and the oldest request's age in days |
| An expiry, but no age at which a request is overdue | Requests wait until they expire, and nobody sees them waiting except by email | `maxAgeDays` in `config/consent-review.json` (5 in the fixtures); HT-CR-01 for an older request |
| Every permission looks alike in the list | A request for `Files.ReadWrite.All` is approved on the same quick look as `User.Read` | `broadScopes` patterns (`*.ReadWrite.All`, `Directory.*`, `RoleManagement.*`, `Mail.*`, `Files.ReadWrite*`, `Sites.FullControl.All`, `full_access_as_app`); HT-CR-02, a warning, sends the request to the identity governance approver |
| JSON from the API | Nothing an approver can sort, and nothing an ISSO can hash | `register.json`, `register.csv`, `findings.json` and `manifest.json` with each file's SHA-256, the controls and the KSIs |
| A write permission exists to approve or deny | A review job could decide | The task holds `ConsentRequest.Read.All` only; a test fails if a read task holds a write permission |

**The verdict.** Use Learn's filter as published. Build the second read, the age, the patterns and the evidence; leave the decision where Book 15 and [Book 04, Chapter 06](../../../books/b04-access/06-who-decides-access.md#who-approves-admin-consent) put it.

## The code

`Get-HtPendingConsentRequest -OutputPath [-ReviewPath] [-AsOf]` reads the applications through `consent-requests-list` with Learn's filter, then each one's user requests through `user-consent-requests-list`, and keeps those still `InProgress`. An application whose requests are all completed drops out. For each remaining one it writes a register row (`AppId`, `Application`, `Permissions`, `Requesters`, `OldestUtc`, `AgeDays`, `Broad`) and its findings, then the manifest. It returns `Pending`, `Findings` and `Warnings`.

| Rule | Severity | What it flags |
|---|---|---|
| HT-CR-01 | Finding | The oldest request is older than `maxAgeDays`: decide it or decline it |
| HT-CR-02 | Warning | A requested permission matches a `broadScopes` pattern: the identity governance approver decides, after the service's authorization is recorded |

On the platform host it runs as the `consent` job of `deploy/Invoke-HtScheduledRun.ps1`, daily at 07:00 under `gmsa-fmpassess$`, signed in as the help desk audit reader app ([WD-181](../../../about/decision-register.md#wd-181)); [Chapter 03](03-scheduled-checks-sync-roles-and-logs.md) covers the job runner and [Chapter 06](06-deploying-to-test-and-production.md) the registration. The job exits 2 when there are findings, so Task Scheduler's history shows them.

::: {.callout-important}
## Illustrative code
Lab 1 reads three fictional applications from `tests/fixtures/consent-requests.json`; nothing signs in. The kit hasn't been run against a live tenant. Run Lab 2 in a test tenant before scheduling it.
:::

## Lab 1: fixtures, no tenant

Work in `examples/help-desk-automation`, in PowerShell 7.1 or later, with Pester 5. The fixture tenant has three applications: Contoso Dashboards (one request, two days old, `User.Read openid`), Fabrikam File Sync (two requests, the oldest from November 12, asking for `Files.ReadWrite.All`) and Northwind Survey (one request, already completed).

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/help-desk-automation`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what the review needs
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
Get-HtRequiredPermission -Task consent-requests | Format-List

# Step 2: Read the limits
Get-Content config/consent-review.json

# Step 3: Review the fixture tenant
Get-HtPendingConsentRequest -OutputPath out/consent -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List

# Step 4: Read the register
Import-Csv out/consent/register.csv | Format-Table Application, Permissions, Requesters, AgeDays, Broad -AutoSize | Out-String -Width 200

# Step 5: Read the findings
Get-Content out/consent/findings.json

# Step 6: Read the manifest, and check one hash yourself
Get-Content out/consent/manifest.json
Get-HtSha256 out/consent/findings.json

# Step 7: Tighten the limit to zero days
$c = Get-Content config/consent-review.json -Raw | ConvertFrom-Json
$c.maxAgeDays = 0
$c | ConvertTo-Json | Set-Content out/consent-review.strict.json
Get-HtPendingConsentRequest -OutputPath out/consent-strict -FixturePath tests/fixtures -ReviewPath out/consent-review.strict.json -AsOf 2026-11-27T12:00:00Z | Format-List

# Step 8: Run it as the platform host's scheduled job would
& { ./deploy/Invoke-HtScheduledRun.ps1 -Job consent -SettingsPath tests/fixtures/settings.fixture.json -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z; "Exit code: $LASTEXITCODE" }
Get-ChildItem out/runs/consent -Recurse -Name

# Step 9: Run this chapter's tests
Invoke-Pester -Path tests -FullNameFilter 'Pending admin consent requests*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what the review needs:**

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
   Get-HtRequiredPermission -Task consent-requests | Format-List
   ```

   <!-- capture:begin 02-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/02-1.txt))](captures/02-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force and what it printed"}

   <!-- capture:end -->

   One permission, `ConsentRequest.Read.All`, and `Mode` `read`.

2. **Read the limits:**

   ```powershell
   Get-Content config/consent-review.json
   ```

   <!-- capture:begin 02-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/02-2.txt))](captures/02-2.png){.lightbox fig-alt="Terminal window showing Get-Content config/consent-review.json and what it printed"}

   <!-- capture:end -->

3. **Review the fixture tenant:**

   ```powershell
   Get-HtPendingConsentRequest -OutputPath out/consent -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z | Format-List
   ```

   <!-- capture:begin 02-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/02-3.txt))](captures/02-3.png){.lightbox fig-alt="Terminal window showing Get-HtPendingConsentRequest -OutputPath out/consent -FixturePath tests/fixtur… and what it printed"}

   <!-- capture:end -->

   Two pending applications (Northwind's request is completed), one finding and one warning.

4. **Read the register:**

   ```powershell
   Import-Csv out/consent/register.csv | Format-Table Application, Permissions, Requesters, AgeDays, Broad -AutoSize | Out-String -Width 200
   ```

   <!-- capture:begin 02-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/02-4.txt))](captures/02-4.png){.lightbox fig-alt="Terminal window showing Import-Csv out/consent/register.csv | Format-Table Application, Permissions, … and what it printed"}

   <!-- capture:end -->

   Fabrikam File Sync has waited 15 days, with two requesters, and `Files.ReadWrite.All` is marked broad.

5. **Read the findings:**

   ```powershell
   Get-Content out/consent/findings.json
   ```

   <!-- capture:begin 02-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/02-5.txt))](captures/02-5.png){.lightbox fig-alt="Terminal window showing Get-Content out/consent/findings.json and what it printed"}

   <!-- capture:end -->

6. **Read the manifest, and check one hash yourself:**

   ```powershell
   Get-Content out/consent/manifest.json
   Get-HtSha256 out/consent/findings.json
   ```

   <!-- capture:begin 02-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/02-6.txt))](captures/02-6.png){.lightbox fig-alt="Terminal window showing Get-Content out/consent/manifest.json and what it printed"}

   <!-- capture:end -->

   The second line matches the `sha256` the manifest gives `findings.json`.

7. **Tighten the limit to zero days.** Your own limits file, passed with `-ReviewPath`, makes every pending request overdue:

   ```powershell
   $c = Get-Content config/consent-review.json -Raw | ConvertFrom-Json
   $c.maxAgeDays = 0
   $c | ConvertTo-Json | Set-Content out/consent-review.strict.json
   Get-HtPendingConsentRequest -OutputPath out/consent-strict -FixturePath tests/fixtures -ReviewPath out/consent-review.strict.json -AsOf 2026-11-27T12:00:00Z | Format-List
   ```

   <!-- capture:begin 02-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/02-7.txt))](captures/02-7.png){.lightbox fig-alt="Terminal window showing $c = Get-Content config/consent-review.json -Raw | ConvertFrom-Json and what it printed"}

   <!-- capture:end -->

   `Findings` is now 2.

8. **Run it as the platform host's scheduled job would.** The fixture settings send the run to `out/runs`, in a folder named for its time:

   ```powershell
   & { ./deploy/Invoke-HtScheduledRun.ps1 -Job consent -SettingsPath tests/fixtures/settings.fixture.json -FixturePath tests/fixtures -AsOf 2026-11-27T12:00:00Z; "Exit code: $LASTEXITCODE" }
   Get-ChildItem out/runs/consent -Recurse -Name
   ```

   <!-- capture:begin 02-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/02-8.txt))](captures/02-8.png){.lightbox fig-alt="Terminal window showing & { ./deploy/Invoke-HtScheduledRun.ps1 -Job consent -SettingsPath tests/fixtu… and what it printed"}

   <!-- capture:end -->

   Exit code 2: the run has a finding.

9. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests -FullNameFilter 'Pending admin consent requests*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 02-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/02-9.txt))](captures/02-9.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests -FullNameFilter 'Pending admin consent requests*' -… and what it printed"}

   <!-- capture:end -->

**Expected result:** `PassedCount` 5 and `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 02-10 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ht/02-10.txt))](captures/02-10.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant

Use a Microsoft Entra test tenant, never production, with the admin consent workflow turned on and at least one pending request from a test user (Learn's *Configure the admin consent workflow* describes turning it on, as a Global Administrator)[^ht02-workflow]. Work in `examples/help-desk-automation`, in PowerShell 7.1 or later with the Microsoft Graph PowerShell SDK. You'll replace: `<tenant-id>` (the test tenant). The authors haven't run this lab. It reads only: there is nothing to back out except the sign-in and the run folder.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/help-desk-automation`. Each step below says what it does and what to look for.

```powershell
# Step 1: Sign in with the read permission only
Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes (Get-HtRequiredPermission -Task consent-requests).GraphPermissions -NoWelcome
(Get-MgContext).Scopes

# Step 2: Cross-check with Learn's own filter, then review
(Invoke-MgGraphRequest -Method GET -Uri "v1.0/identityGovernance/appConsent/appConsentRequests?`$filter=userConsentRequests/any (u:u/status eq 'InProgress')").value | ForEach-Object { $_.appDisplayName }
Get-HtPendingConsentRequest -OutputPath out/consent-test | Format-List
Import-Csv out/consent-test/register.csv | Format-Table Application, Permissions, Requesters, AgeDays, Broad -AutoSize | Out-String -Width 200

# Step 3: Back out
Disconnect-MgGraph
Remove-Item -Recurse -Force out/consent-test
```

:::

<!-- labs:end -->

1. **Sign in with the read permission only:**

   ```powershell
   Import-Module ./powershell/HelpDeskAutomation/HelpDeskAutomation.psm1 -Force
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes (Get-HtRequiredPermission -Task consent-requests).GraphPermissions -NoWelcome
   (Get-MgContext).Scopes
   ```

   The scopes list `ConsentRequest.Read.All` and nothing that writes.

2. **Cross-check with Learn's own filter, then review:**

   ```powershell
   (Invoke-MgGraphRequest -Method GET -Uri "v1.0/identityGovernance/appConsent/appConsentRequests?`$filter=userConsentRequests/any (u:u/status eq 'InProgress')").value | ForEach-Object { $_.appDisplayName }
   Get-HtPendingConsentRequest -OutputPath out/consent-test | Format-List
   Import-Csv out/consent-test/register.csv | Format-Table Application, Permissions, Requesters, AgeDays, Broad -AutoSize | Out-String -Width 200
   ```

   The names in the first list are the applications in the register.

3. **Back out:**

   ```powershell
   Disconnect-MgGraph
   Remove-Item -Recurse -Force out/consent-test
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| List appConsentRequests | `GET /identityGovernance/appConsent/appConsentRequests`; `ConsentRequest.Read.All` least privileged (delegated and application) | [^ht02-list] |
| The filter | `$filter` (`eq`) on `userConsentRequests`; `userConsentRequests/any (u:u/status eq 'InProgress')`; the response doesn't expand the relationship | [^ht02-list] |
| List userConsentRequests | One application's user requests, `ConsentRequest.Read.All` | [^ht02-user-list] |
| The workflow | Turned on by a Global Administrator; requests emailed to reviewers; requests expire after the configured days | [^ht02-workflow] |

Not yet specified: whether Learn's filter, sent URL-encoded as the kit sends it, behaves the same as the unencoded example; Lab 2, step 2 compares them.

## Federal requirements and evidence

The controls and KSIs are `config/requirements.json` for `consent-requests`.[^ht02-oscal] [^ht02-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The review reads with `ConsentRequest.Read.All` only and can't decide a request (Lab 1, step 1; Lab 2, step 1) | AC-6 | KSI-IAM-ELP | The identity governance approver; the ISSO keeps the app's permission list |
| Every pending request, its permissions, requesters and age, on a schedule (Lab 1, steps 3, 4 and 8: `register.json`, `register.csv`, the dated run folder) | CA-7; AC-20; SA-9 | KSI-IAM-ELP | The ISSO, with the run folders |
| Requests overdue or asking for broad permissions, sent to the approver (Lab 1, steps 5 and 7: `findings.json`) | AC-6; AC-20; SA-9 | KSI-IAM-ELP | The identity governance approver |
| The run's files are the ones it wrote (Lab 1, step 6: `manifest.json`) | CA-7 | KSI-IAM-ELP | The ISSO |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). The mapping is the program's *(design guidance)*. The review's records support these controls; the assessor decides them.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| The review job holds `ConsentRequest.ReadWrite.All` | A compromised reader can approve consent | The task declares the read permission only, and a test fails on a write permission in a read task |
| The help desk approves a broad request on the register's word | An unauthorized service gets tenant-wide data | HT-CR-02 names the approver; the register is input to the decision, not the decision |
| A limit nobody owns | `maxAgeDays` drifts until nothing is ever overdue | The limits file is the agency's copy, kept at work with an owner in the settings' config folder (Chapter 06), and changed through a change record; the manifest records the run's outputs, not its configuration |
| A completed request counted as pending | The register shows decided requests | Only `InProgress` user requests are counted |

## Checklist

- [ ] The reader app holds `ConsentRequest.Read.All`, and no consent write permission.
- [ ] The agency's `consent-review.json` has an owner and a limit the identity governance office agreed.
- [ ] Every HT-CR-02 warning goes to the identity governance approver, with the service's authorization status.
- [ ] The scheduled job's exit code 2 raises a ticket, not an email.

::: {.callout-tip}
## Continue the book
[← Chapter 01 — The Typed Change](01-the-typed-change.md) · [Workbook index](index.md) · [Next: Chapter 03 — Scheduled Checks →](03-scheduled-checks-sync-roles-and-logs.md)
:::

[^ht02-list]: Microsoft Learn, "List appConsentRequests" (permissions; `$filter` on `userConsentRequests`; Example 2), <https://learn.microsoft.com/graph/api/appconsentapprovalroute-list-appconsentrequests?view=graph-rest-1.0> (read November 27, 2026).
[^ht02-user-list]: Microsoft Learn, "List userConsentRequests," <https://learn.microsoft.com/graph/api/appconsentrequest-list-userconsentrequests?view=graph-rest-1.0> (read November 27, 2026; carried from the kit's `config/calls.json`).
[^ht02-workflow]: Microsoft Learn, "Configure the admin consent workflow" (prerequisites; reviewers; email notifications; "Consent request expires after (days)"), <https://learn.microsoft.com/entra/identity/enterprise-apps/configure-admin-consent-workflow> (read November 27, 2026).
[^ht02-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (read November 9, 2026; carried from *Building Provider Notices*).
[^ht02-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
