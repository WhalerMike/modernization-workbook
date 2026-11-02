---
title: "Module 6: Conditional Access for workload identities"
description: "Gate G4 and workbook Chapter 08: hold CA015 and CA037 as reviewed files, scoped to Tier 1 single-tenant service principals by object ID, ring by ring; check them before merge and against the tenant; create every policy report-only; summarize the service principal sign-ins; and enforce a ring only with D-N5, -AllowEnforce and the reviewed summary's hash. About 65 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04"
last-reviewed: 2026-11-02
series-order: 6
---

# Module 6: Conditional Access for workload identities {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). Gate G4 Least privilege. Workbook [Chapter 08](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md). About 65 minutes.*

**Watch first (optional):** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_08_Workload_CA_Narrated). A narrated deck for this module comes later.

## Introduction (3 minutes)

Conditional Access for workload identities is narrow. Block is the only grant control. It covers single-tenant service principals registered in your tenant, and nothing else: not Microsoft or SaaS apps, not multitenant apps, not managed identities. A policy assigned to a group that holds a service principal isn't enforced for it. And Workload ID Premium is needed to create or change these policies.

So the scope matters as much as the policy. In this module you hold the program's two policies, CA015 (location) and CA037 (high risk), as reviewed files, scoped by object ID ring by ring. Every policy is created report-only. A ring is enforced only after a person reviews its sign-ins, the CISO records decision D-N5, and the change says `-AllowEnforce`.

**The federal requirement.** This is the Conditional Access part of Gate G4 (the guide's Step 4e). The guide's [Validate (G4 Least privilege)](../../books/guides/non-person-identity-implementation.md#step-4-cut-privilege) step names AC-6, AC-6(5) and IA-9, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| AC-3 Access Enforcement; IA-9 Service Identification and Authentication | KSI-IAM-ELP (AC-3); none cites IA-9 | The scope file; `findings.json`, NPI-WCA-01 to -09 |
| AC-6 Least Privilege; CM-5 Access Restrictions for Change | KSI-IAM-ELP, KSI-IAM-JIT (AC-6); KSI-CMT-RVP (CM-5) | The permissions for `wca-read`, `wca-signins` and `wca-apply` |
| CM-6 Configuration Settings; CM-3(2) Testing, Validation, and Documentation of Changes | KSI-SVC-ACM, KSI-MLA-EVC (CM-6); KSI-CMT-VTD (CM-3(2)) | The pre-merge check; the files in `workload-ca/` |
| AU-6 Audit Record Review; CA-7 Continuous Monitoring | KSI-MLA-RVL (AU-6); KSI-MLA-EVC (CA-7) | `signin-summary.json` and its SHA-256 |
| CM-4(2) Verification of Controls | KSI-CMT-VTD, KSI-CMT-LMC | The held, enforced and edited plans |
| SI-4 System Monitoring | KSI-IAM-SUS, KSI-MLA-RVL, KSI-SVC-EIS | `alert-rule.json` |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- state the four limits of Conditional Access for workload identities, and what covers the identities outside them;
- explain why each policy is rendered once per ring and always created report-only;
- run the pre-merge check, the tenant check and the plan, and read what each reports;
- read a sign-in summary and say whether a ring is ready for enforcement;
- show a ring held without `-AllowEnforce`, enforced with it, and held again with an edited summary.

## Prerequisites (1 minute)

- [Module 5](05-least-privilege.md): this module is the other half of Gate G4.
- [Module 1](01-inventory.md): the scope names service principals by the enterprise application's object ID, as the register records them.

## Unit 1: What the gate asks for (7 minutes)

Read the guide's [Step 4](../../books/guides/non-person-identity-implementation.md#step-4-cut-privilege), sub-steps 4d (custom security attributes and app filters) and 4e (Conditional Access for workload identities, and its limits). Then read the guide's [licenses](../../books/guides/non-person-identity-implementation.md#licenses) table: Conditional Access for workload identities needs Workload ID Premium.

## Unit 2: The limits and the scope (10 minutes)

Read the workbook chapter in this order:

- [The context the code depends on](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#the-context-the-code-depends-on): Learn's limits, CA015 and CA037, and decisions D-N4 and D-N5.
- [The files](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#the-files): the scope file, and one policy per ring *(design guidance)*.
- [The pre-merge check](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#the-pre-merge-check): NPI-WCA-01 to -09.

## Unit 3: Plan, sign-ins and enforcement (10 minutes)

- [The plan, the dry run and the writes](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#the-plan-the-dry-run-and-the-writes): Create, Update, NoChange, Blocked, Held and NotInRepository. The code has no delete.
- [Enforcement, ring by ring](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#enforcement-ring-by-ring): the five conditions.
- [The sign-in reader](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#the-sign-in-reader): the beta filter, the header for report-only results, and the four statuses.
- [Least privilege](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#least-privilege): three tasks, three sets of permissions.

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Chapter 08, Lab 1](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/non-person-identity`, in PowerShell 7. The tenant is fictional, and its egress ranges are documentation ranges.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Check Learn's sample and page as published
Invoke-Pester -Path tests/NpiWorkloadCa.Tests.ps1 -FullNameFilter '*(Learn), run as published*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 2: List what each task needs
Import-Module ./powershell/NpiWorkloadCa/NpiWorkloadCa.psm1
foreach ($t in 'wca-read', 'wca-signins', 'wca-apply') { "$t : " + ((Get-NpiWcaRequiredPermission -Task $t).GraphPermissions -join ', ') }

# Step 3: Run the pre-merge check on the files and the fixture scope
./Invoke-NpiWorkloadCa.ps1 -Mode Check -ScopePath tests/fixtures/ch08/scope.json

# Step 4: Run the same check on Learn's sample
Test-NpiWcaPolicyBody -Body (Read-NpiWcaLearnSample -Path ../third_party/entra-workload-identity-ca-page/workload-identity.md) -EgressName NL-WorkloadEgress -Name learn-sample |
    Format-Table Rule, Severity

# Step 5: Check the scope against the fictional tenant and plan, sending nothing
./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath tests/fixtures/ch08/scope.json -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca
Get-Content out/wca/plan.json -Raw | ConvertFrom-Json | Format-Table Kind, Name, Action

# Step 6: Read the service principal sign-ins and summarize them
./Invoke-NpiWorkloadCa.ps1 -Mode SignIns -Cloud gcc -ScopePath tests/fixtures/ch08/scope.json -FixturePath tests/fixtures/ch08/tenant.json -From 2026-10-12 -To 2026-10-30T12:00:00 -OutputPath out/wca-signins

# Step 7: Apply against the fake, twice
$scope = Read-NpiWcaScope -Path tests/fixtures/ch08/scope.json
$repo = Read-NpiWcaRepository
$asOf = [datetime]'2026-10-30T12:00:00'
$fake = New-NpiWcaFixtureInvoker -Path tests/fixtures/ch08/tenant.json -Cloud gcc
$findings = @(Test-NpiWcaRepository -Repository $repo -Scope $scope -AsOf $asOf)
foreach ($run in 1..2) {
    $client = New-NpiWcaClient -Cloud gcc -Task wca-apply -Invoke $fake.Invoke
    $plan = Get-NpiWcaPlan -Repository $repo -Scope $scope -Tenant (Get-NpiWcaTenant -Client $client) -Enforcement (Get-NpiWcaEnforcement -Scope $scope) -AsOf $asOf
    $sent = @(Invoke-NpiWcaPlan -Client $client -Plan $plan -Findings $findings | Where-Object Sent)
    "Run ${run}: $($sent.Count) sent"
}
$fake.Tenant.policies | Where-Object { $_.displayName -like 'CA0*' } | ForEach-Object { '{0,-50} {1}' -f $_.displayName, $_.state }

# Step 8: Try to enforce Ring 1, without and with -AllowEnforce
$sha = (Get-FileHash out/wca-signins/signin-summary.json -Algorithm SHA256).Hash.ToLower()
$s = Get-Content tests/fixtures/ch08/scope.json -Raw | ConvertFrom-Json -AsHashtable
$s.enforcement = @{ decision = @{ id = 'D-N5'; outcome = 'Enforce'; decidedBy = 'CISO'; decidedOn = '2026-10-30' }
                    rings = @(@{ ring = 'Ring1'; enforce = $true; signInReview = $sha; reviewedBy = 'ISSO'; reviewedOn = '2026-10-30' }); exclusions = @() }
$s | ConvertTo-Json -Depth 10 | Set-Content out/scope-ring1.json
./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath out/scope-ring1.json -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca-held
./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath out/scope-ring1.json -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca-enforce -AllowEnforce -SignInSummaryPath out/wca-signins/signin-summary.json

# Step 8: Try to enforce Ring 1, without and with -AllowEnforce
Copy-Item out/wca-signins/signin-summary.json out/signin-summary-edited.json
Add-Content out/signin-summary-edited.json ' ' -NoNewline
./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath out/scope-ring1.json -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca-edited -AllowEnforce -SignInSummaryPath out/signin-summary-edited.json

# Step 9: Read the alert definition
(Get-Content out/wca/alert-rule.json -Raw | ConvertFrom-Json).query

# Step 10: Run the tests
Invoke-Pester -Path tests

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Check Learn's sample and page as published:**

    ```powershell
    Invoke-Pester -Path tests/NpiWorkloadCa.Tests.ps1 -FullNameFilter '*(Learn), run as published*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 9`, `FailedCount 0`, `NotRunCount 39`.

2. **List what each task needs:**

    ```powershell
    Import-Module ./powershell/NpiWorkloadCa/NpiWorkloadCa.psm1
    foreach ($t in 'wca-read', 'wca-signins', 'wca-apply') { "$t : " + ((Get-NpiWcaRequiredPermission -Task $t).GraphPermissions -join ', ') }
    ```

    ```text
    wca-read : Application.Read.All, Policy.Read.All
    wca-signins : AuditLog.Read.All, Policy.Read.ConditionalAccess
    wca-apply : Application.Read.All, Policy.Read.All, Policy.ReadWrite.ConditionalAccess
    ```

3. **Run the pre-merge check on the files and the fixture scope:**

    ```powershell
    ./Invoke-NpiWorkloadCa.ps1 -Mode Check -ScopePath tests/fixtures/ch08/scope.json
    ```

    Expect `Pre-merge check: 0 Finding, 0 Warn, 0 Info`, and exit code 0. A Finding exits with code 1 and fails the pipeline.

4. **Run the same check on Learn's sample:**

    ```powershell
    Test-NpiWcaPolicyBody -Body (Read-NpiWcaLearnSample -Path ../third_party/entra-workload-identity-ca-page/workload-identity.md) -EgressName NL-WorkloadEgress -Name learn-sample |
        Format-Table Rule, Severity
    ```

    Expect five Findings: NPI-WCA-01 twice, NPI-WCA-07 twice and NPI-WCA-08 once.

5. **Check the scope against the fictional tenant and plan, sending nothing:**

    ```powershell
    ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath tests/fixtures/ch08/scope.json -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca
    Get-Content out/wca/plan.json -Raw | ConvertFrom-Json | Format-Table Kind, Name, Action
    ```

    ```text
    Checks: 0 Finding, 0 Warn, 2 Info
    Plan: 3 Create, 1 NoChange, 1 NotInRepository, 1 Update
    Dry run: 4 request(s) written to requests.json, none sent; rerun with -Apply to send them
    ```

    The portal-made policy is `NotInRepository`: reported and left alone. The two Info are Legacy Reports and Build Pipeline, eligible but not Tier 1.

6. **Read the service principal sign-ins and summarize them:**

    ```powershell
    ./Invoke-NpiWorkloadCa.ps1 -Mode SignIns -Cloud gcc -ScopePath tests/fixtures/ch08/scope.json -FixturePath tests/fixtures/ch08/tenant.json -From 2026-10-12 -To 2026-10-30T12:00:00 -OutputPath out/wca-signins
    ```

    Expect `Ring1: ready for enforcement` (Mail Automation and Payroll Export `Clear`) and `Ring2: not ready` (Deploy Bot `WouldBlock`, from `203.0.113.7`; HR Connector `NoSignIns`). The summary's SHA-256 is `d7767949b75e1e5d3f6a6bef6501eb7de8e98ddd8a9f22e1eb82698969d8752e`.

7. **Apply against the fake, twice:**

    ```powershell
    $scope = Read-NpiWcaScope -Path tests/fixtures/ch08/scope.json
    $repo = Read-NpiWcaRepository
    $asOf = [datetime]'2026-10-30T12:00:00'
    $fake = New-NpiWcaFixtureInvoker -Path tests/fixtures/ch08/tenant.json -Cloud gcc
    $findings = @(Test-NpiWcaRepository -Repository $repo -Scope $scope -AsOf $asOf)
    foreach ($run in 1..2) {
        $client = New-NpiWcaClient -Cloud gcc -Task wca-apply -Invoke $fake.Invoke
        $plan = Get-NpiWcaPlan -Repository $repo -Scope $scope -Tenant (Get-NpiWcaTenant -Client $client) -Enforcement (Get-NpiWcaEnforcement -Scope $scope) -AsOf $asOf
        $sent = @(Invoke-NpiWcaPlan -Client $client -Plan $plan -Findings $findings | Where-Object Sent)
        "Run ${run}: $($sent.Count) sent"
    }
    $fake.Tenant.policies | Where-Object { $_.displayName -like 'CA0*' } | ForEach-Object { '{0,-50} {1}' -f $_.displayName, $_.state }
    ```

    Expect `Run 1: 4 sent`, `Run 2: 0 sent`, then every CA015 and CA037 policy `enabledForReportingButNotEnforced`. CA001, a user policy, stays `enabled` and untouched.

8. **Try to enforce Ring 1, without and with `-AllowEnforce`:**

    ```powershell
    $sha = (Get-FileHash out/wca-signins/signin-summary.json -Algorithm SHA256).Hash.ToLower()
    $s = Get-Content tests/fixtures/ch08/scope.json -Raw | ConvertFrom-Json -AsHashtable
    $s.enforcement = @{ decision = @{ id = 'D-N5'; outcome = 'Enforce'; decidedBy = 'CISO'; decidedOn = '2026-10-30' }
                        rings = @(@{ ring = 'Ring1'; enforce = $true; signInReview = $sha; reviewedBy = 'ISSO'; reviewedOn = '2026-10-30' }); exclusions = @() }
    $s | ConvertTo-Json -Depth 10 | Set-Content out/scope-ring1.json
    ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath out/scope-ring1.json -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca-held
    ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath out/scope-ring1.json -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca-enforce -AllowEnforce -SignInSummaryPath out/wca-signins/signin-summary.json
    ```

    Expect `Plan: 3 Create, 1 Held, 1 NotInRepository, 1 Update` first, then `Plan: 3 Create, 1 NotInRepository, 2 Update`: CA015-Ring1 goes from report-only to enabled. Now change one byte of the summary and plan again:

    ```powershell
    Copy-Item out/wca-signins/signin-summary.json out/signin-summary-edited.json
    Add-Content out/signin-summary-edited.json ' ' -NoNewline
    ./Invoke-NpiWorkloadCa.ps1 -Mode Plan -Cloud gcc -ScopePath out/scope-ring1.json -FixturePath tests/fixtures/ch08/tenant.json -OutputPath out/wca-edited -AllowEnforce -SignInSummaryPath out/signin-summary-edited.json
    ```

    Expect `Plan: 3 Create, 1 Held, 1 NotInRepository, 1 Update` again: the edited summary's SHA-256 isn't the one the reviewer recorded.

9. **Read the alert definition:**

    ```powershell
    (Get-Content out/wca/alert-rule.json -Raw | ConvertFrom-Json).query
    ```

    Expect a query over `AADServicePrincipalSignInLogs` for `tostring(ResultType) == "53003"` and the four in-scope object IDs.

10. **Run the tests:**

    ```powershell
    Invoke-Pester -Path tests
    ```

    Expect 513 tests passed, 0 failed.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 08, Lab 2](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#lab-2-test-tenant). It has the exact commands.

- **You need:** a test tenant in the worldwide or GCC cloud, never production, with a Workload Identities Premium trial or license; one test app registration with a certificate; and a host whose public egress address you know.
- **What you do:** write a scope with the test app's enterprise application object ID in Ring 1, plan with a reading app, apply report-only, generate sign-ins from inside and outside the egress range, then, in a separate change after at least 14 days with the ring `Clear`, enforce Ring 1 and see a token from outside the range blocked.
- **Back-out:** step 7 removes Ring 1 from the enforcement record and applies, so both policies return to report-only. Then you turn them off or delete them by hand (the code never deletes), delete the named location, remove `Policy.ReadWrite.ConditionalAccess`, delete the apps and their certificates, and delete the `out` folders.

## Knowledge check (5 minutes)

1. A policy is assigned to a group that contains a Tier 1 service principal. What happens?
    a. It's enforced for every member of the group
    b. It isn't enforced for the service principal; it has to be assigned directly, by the enterprise application's object ID
    c. It's enforced only in report-only mode
    d. It applies to managed identities in the group too
2. How are managed identities governed, since this Conditional Access doesn't cover them?
    a. Through a group-assigned policy
    b. Through their role assignments and access reviews, recorded as out of scope with the control that covers them
    c. Through CA037
    d. They aren't governed
3. A new CA037 policy is created on the same run that enforces its ring. What state is it created in?
    a. Enabled
    b. Report-only; it turns on in the next run
    c. Off
    d. Deleted
4. Which of these is *not* one of the conditions for enforcing a ring?
    a. A D-N5 record that marks the ring
    b. `-AllowEnforce` on the run
    c. A sign-in summary whose SHA-256 the ring's record cites, showing the ring ready
    d. Deleting the portal-made policy that isn't in the repository
5. Ring 2 is `not ready`. Why?
    a. Deploy Bot signed in from `203.0.113.7`, outside the egress ranges, so it's `WouldBlock`
    b. Ring 2 has no policies
    c. Ring 2's principals are managed identities
    d. The window is under 14 days

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Learn: assign directly. Taught in [The context the code depends on](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#the-context-the-code-depends-on) and the guide's [Step 4](../../books/guides/non-person-identity-implementation.md#step-4-cut-privilege).
2. **b.** Taught in the guide's [Step 4](../../books/guides/non-person-identity-implementation.md#step-4-cut-privilege) (4e) and the chapter's [pre-merge check](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#the-pre-merge-check), NPI-WCA-06.
3. **b.** Taught in [Enforcement, ring by ring](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#enforcement-ring-by-ring).
4. **d.** A policy not in the repository is reported and never deleted. Taught in [The plan, the dry run and the writes](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#the-plan-the-dry-run-and-the-writes) and [Enforcement, ring by ring](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#enforcement-ring-by-ring).
5. **a.** A ring is ready only when every principal is `Clear`. Taught in [The sign-in reader](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#the-sign-in-reader) and [Lab 1](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#lab-1-fixtures-no-tenant), step 6.
:::

## Summary (2 minutes)

You checked the policy files and failed Learn's sample against the same rules, planned against a fictional tenant, created every policy report-only, summarized the service principal sign-ins, and saw a ring enforced only with D-N5, `-AllowEnforce` and the reviewed summary, and held again when the summary changed.

**The evidence an ISSO keeps** for the Conditional Access part of G4: the scope file, the pre-merge check, `findings.json`, `plan.json` and `requests.json`, `signin-summary.json` with the hash the D-N5 record cites, `alert-rule.json` and each run's `manifest.json`, dated. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/non-person-identity/08-conditional-access-for-workload-identities.md#checklist).

**Next:** [Module 7: Convert to managed identities and federation](07-federation-and-managed-identities.md).
