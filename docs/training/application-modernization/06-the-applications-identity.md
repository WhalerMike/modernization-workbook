---
title: "Module 6: The application's identity"
description: "Workbook Chapter 06 and Book 18 Appendix A: one application's own Microsoft Entra identity through the remediation factory's work packages. The before snapshot, which of WP1 to WP6 it needs and where each is built, WP4's redirect URI check against owned domains and DNS with an OAuth regression test, WP5's assignment plan, one write path gated on the plan's approved SHA-256, and the rollback. About 70 minutes, with a lab on a fictional application and a test-tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 18"
series-order: 6
review-status: approved
reviewed-sha256: 66c2de03f1802ccf1d204fb1d1438ec998c2ff1f2ebae9fcff9d8cfae4b8c4ad
last-reviewed: 2026-11-25
---
# Module 6: The application's identity {.unnumbered}

*Part of the [Application Modernization learning path](index.md). Book 18, [Appendix A](../../books/b18-application-modernization/appendix-a-identity-remediation-work-packages.md) and [Chapter 10](../../books/b18-application-modernization/10-running-the-portfolio-in-waves.md#identity-remediation-factory). Workbook [Chapter 06](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md). About 70 minutes.*

## Introduction (3 minutes)

A modernized application is still exposed if its app registration sends tokens to a host someone else now controls, or lets every user in the tenant sign in. In this module you take one fictional application's snapshot, find its redirect URIs on a lapsed domain and a dangling CNAME, plan their removal and prove it, plan assignment, and see the write path refuse a plan without its approved hash.

**The federal requirement.** The output of this module's lab is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md#federal-requirements-and-evidence) table has a row for each lab step, and the kit's `config/requirements.json` holds the mapping.

| Requirement | KSI | Evidence |
|---|---|---|
| CM-8, System Component Inventory; CM-2, Baseline Configuration | KSI-PIY-GIV, KSI-SVC-ACM | The before snapshot |
| SC-7, Boundary Protection; CM-3(2) | KSI-CNA-MAT, KSI-CMT-VTD | `wp4-redirect-check.csv`, the plan and `wp4-oauth-regression.csv` |
| AC-2, Account Management; AC-6, Least Privilege | KSI-IAM-AAM, KSI-IAM-ELP | `wp5-assignment-plan.json` and the assigned and unassigned tests |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*.

## Learning objectives (1 minute)

After this module, you'll be able to:

- take an application's before snapshot and say which work packages it needs;
- name the six redirect URI findings, and why a dangling CNAME goes to the domain owner first;
- plan a redirect cleanup and prove it with an OAuth regression test;
- plan assignment so nobody is locked out, and apply a plan only with its approved SHA-256.

## Prerequisites (1 minute)

- Book 18, [Appendix A](../../books/b18-application-modernization/appendix-a-identity-remediation-work-packages.md): its work packages and rollback table.
- For WP1 to WP3: the [Non-Person Identity learning path](../non-person-identity/index.md) teaches owners, least privilege and the conversion.

## Unit 1: The factory's work packages (10 minutes)

Read Book 18's [Chapter 10](../../books/b18-application-modernization/10-running-the-portfolio-in-waves.md#identity-remediation-factory) identity remediation factory, then [Appendix A](../../books/b18-application-modernization/appendix-a-identity-remediation-work-packages.md) through WP5 and its rollback table.

## Unit 2: The work packages in code (8 minutes)

Read the workbook chapter's [What they leave to you](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md#what-they-leave-to-you), [The code](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md#the-code) and [Dangers](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md#dangers).

## Exercise: Lab 1, fixtures, no tenant (35 minutes)

This is the workbook's [Chapter 06, Lab 1](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md#lab-1-fixtures-no-tenant), split into steps. You need PowerShell 7.4 or later and Pester 5. The application and its tenant are fictional: nothing signs in, and nothing is sent.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\app-modernization

$Run = "C:\FMWLabs\results\application-modernization-06-the-applications-identity\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Take the before snapshot
Import-Module ./powershell/AppModernization/AppModernization.psm1
Get-AmAppSnapshot -AppId 00001111-aaaa-2222-bbbb-3333cccc4444 -OutDir "$Run\pack" -Stage before -FixturePath tests/fixtures/identity | Format-List

# Step 2: See which work packages it needs, and where each is built
Get-AmWorkPackage -SnapshotDir "$Run\pack" -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json | Format-Table WorkPackage, Needed, Why, BuiltIn -Wrap

# Step 3: Check every redirect URI
Test-AmRedirectUri -SnapshotDir "$Run\pack" -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json -OutDir "$Run\pack" | Format-Table Platform, Uri, OwnedDomain, Resolves, CnameTarget, Findings -Wrap

# Step 4: Try to keep the dangling URI
try { New-AmRedirectPlan -SnapshotDir "$Run\pack" -CheckPath "$Run\pack\wp4-redirect-check.csv" -Keep 'https://cases-old.contoso.example/signin-oidc' -ChangeId CHG-0001 -OutDir "$Run\pack" } catch { $_.Exception.Message }

# Step 5: Plan the cleanup
New-AmRedirectPlan -SnapshotDir "$Run\pack" -CheckPath "$Run\pack\wp4-redirect-check.csv" -Keep 'https://cases.contoso.example/signin-oidc', 'https://cases.contoso.example/' -ChangeId CHG-0001 -OutDir "$Run\pack" | Format-List
./Invoke-AmIdentityApply.ps1 -PlanPath "$Run\pack\wp4-redirect-plan.json"

# Step 6: Run the OAuth regression test
Test-AmOAuthRegression -PlanPath "$Run\pack\wp4-redirect-plan.json" -TenantId aaaabbbb-0000-cccc-1111-dddd2222eeee -FixturePath tests/fixtures/identity/oauth-responses.json -OutDir "$Run\pack" | Format-Table

# Step 7: Try to require assignment with nobody assigned
try { New-AmAssignmentPlan -SnapshotDir "$Run\pack" -AssignmentsPath tests/fixtures/identity/no-assignments.json -ChangeId CHG-0001 -OutDir "$Run\pack" } catch { $_.Exception.Message }

# Step 8: Plan the assignment
New-AmAssignmentPlan -SnapshotDir "$Run\pack" -AssignmentsPath tests/fixtures/identity/reviewed-assignments.json -ChangeId CHG-0001 -OutDir "$Run\pack" | Format-List
./Invoke-AmIdentityApply.ps1 -PlanPath "$Run\pack\wp5-assignment-plan.json"

# Step 9: Plan the rollback, and see the gate refuse a plan without its approved hash
New-AmRollbackPlan -SnapshotDir "$Run\pack" -CheckPath "$Run\pack\wp4-redirect-check.csv" -ChangeId CHG-0001 -OutDir "$Run\pack" | Format-List
(Read-AmJson -Path "$Run\pack\rollback-plan.json").notRestored
try { ./Invoke-AmIdentityApply.ps1 -PlanPath "$Run\pack\wp5-assignment-plan.json" -ApprovedSha256 0000 -Apply } catch { $_.Exception.Message }

# Step 10: Run this chapter's tests
Invoke-Pester -Path tests/Identity.Tests.ps1 -FullNameFilter 'The snapshot*', 'WP4*', 'WP5*', 'The write path*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# Step 11: Write the step's evidence records
Write-AmEvidenceRecord -Step SNAPSHOT -Path (Get-ChildItem "$Run\pack" -Filter 'before-*.json' | ForEach-Object FullName) -OutputPath "$Run\evidence" -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
Write-AmEvidenceRecord -Step WP4 -Path "$Run\pack\wp4-redirect-check.csv", "$Run\pack\wp4-redirect-plan.json", "$Run\pack\wp4-oauth-regression.csv" -OutputPath "$Run\evidence" -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
Write-AmEvidenceRecord -Step WP5 -Path "$Run\pack\wp5-assignment-plan.json" -OutputPath "$Run\evidence" -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs

# After the steps
Get-ChildItem C:\FMWLabs\results\application-modernization-06-the-applications-identity\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\app-modernization
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\application-modernization-06-the-applications-identity\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\application-modernization-06-the-applications-identity\lab1\<run>
```

The run's date is only the folder's name. The data's date is the fixtures' and `-AsOf`, which stay the same, so every run's results match this page, plan hashes included. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/app-modernization`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Take the before snapshot:**

    ```powershell
    Import-Module ./powershell/AppModernization/AppModernization.psm1
    Get-AmAppSnapshot -AppId 00001111-aaaa-2222-bbbb-3333cccc4444 -OutDir "$Run\pack" -Stage before -FixturePath tests/fixtures/identity | Format-List
    ```

    Expected output:

    ```text
    Stage              : before
    App                : Case Triage (fictional)
    Owners             : 1
    AppPermissions     : 1
    DelegatedGrants    : 1
    Assignments        : 0
    RedirectUris       : 7
    Secrets            : 1
    AssignmentRequired : False
    ```

    One owner, one application permission, one tenant-wide grant, no assignments, seven redirect URIs, one secret, and assignment not required.

2. **See which work packages it needs, and where each is built:**

    ```powershell
    Get-AmWorkPackage -SnapshotDir "$Run\pack" -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json | Format-Table WorkPackage, Needed, Why, BuiltIn -Wrap
    ```

    Expected output:

    ```text
    WorkPackage Needed Why                                              BuiltIn
    ----------- ------ ---                                              -------
    WP1           True owners 1; service record none                    Non-Person Identity workbook, Chapter 02
    WP2           True application permissions 1; tenant-wide grants 1  Non-Person Identity workbook, Chapter 07
    WP3           True secrets 1                                        Non-Person Identity workbook, Chapter 05
    WP4           True URIs with findings 5                             This kit: Test-AmRedirectUri, New-AmRedirectPlan
    WP5           True assignment required False; user consent grants 0 This kit: New-AmAssignmentPlan
    WP6           True every application                                This kit: Get-AmSignInCheck, Protect-AmEvidencePack
    ```

    All six. WP1 to WP3 go to the Non-Person Identity kit; WP4 and WP5 are next.

3. **Check every redirect URI:**

    ```powershell
    Test-AmRedirectUri -SnapshotDir "$Run\pack" -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json -OutDir "$Run\pack" | Format-Table Platform, Uri, OwnedDomain, Resolves, CnameTarget, Findings -Wrap
    ```

    Expected output, in a window 120 characters wide (a narrower or wider window wraps the `Findings` column differently):

    ```text
    Platform Uri                                           OwnedDomain Resolves CnameTarget                         Finding
                                                                                                                    s
    -------- ---                                           ----------- -------- -----------                         -------
    web      https://cases.contoso.example/signin-oidc            True     True
    web      https://*.contoso.example/signin-oidc                True    False                                     AM-RU-0
                                                                                                                    1
    web      http://cases-test.contoso.example/signin-oidc        True     True                                     AM-RU-0
                                                                                                                    2
    web      https://cases-old.contoso.example/signin-oidc        True    False contoso-cases-old.azurewebsites.net AM-RU-0
                                                                                                                    4 AM-RU
                                                                                                                    -05
    web      https://cases.fabrikam.example/signin-oidc          False     True                                     AM-RU-0
                                                                                                                    3
    spa      https://cases.contoso.example/                       True     True
    spa      http://localhost:5173/                               True     True                                     AM-RU-0
                                                                                                                    6
    ```

    Two clean URIs. A wildcard (AM-RU-01), an `http` host (AM-RU-02), a host on someone else's domain (AM-RU-03), a host whose CNAME points at a cloud name that no longer resolves (AM-RU-04 and AM-RU-05: give it to the domain owner first), and the kit's own Vite development server (AM-RU-06), which belongs on a separate registration.

4. **Try to keep the dangling URI:**

    ```powershell
    try { New-AmRedirectPlan -SnapshotDir "$Run\pack" -CheckPath "$Run\pack\wp4-redirect-check.csv" -Keep 'https://cases-old.contoso.example/signin-oidc' -ChangeId CHG-0001 -OutDir "$Run\pack" } catch { $_.Exception.Message }
    ```

    Expected output, the error's message:

    ```text
    AM-RU-PLAN: https://cases-old.contoso.example/signin-oidc can't be kept: AM-RU-04, AM-RU-05. Fix the host, or remove the URI.
    ```

    Refused, with the findings named. `try` and `catch` print the message and keep the window going.

5. **Plan the cleanup:**

    ```powershell
    New-AmRedirectPlan -SnapshotDir "$Run\pack" -CheckPath "$Run\pack\wp4-redirect-check.csv" -Keep 'https://cases.contoso.example/signin-oidc', 'https://cases.contoso.example/' -ChangeId CHG-0001 -OutDir "$Run\pack" | Format-List
    ./Invoke-AmIdentityApply.ps1 -PlanPath "$Run\pack\wp4-redirect-plan.json"
    ```

    Expected output:

    ```text
    Plan       : wp4-redirect-plan.json
    Kind       : wp4-redirect-uris
    Commands   : 1
    PlanSha256 : eaf3eb04ec6cec0b0d0ad762ea79e6da84b82bbc99446c8256a03b0227d84b15

    Dry run of wp4-redirect-uris for 00001111-aaaa-2222-bbbb-3333cccc4444, change CHG-0001. Plan SHA-256 eaf3eb04ec6cec0b0d0ad762ea79e6da84b82bbc99446c8256a03b0227d84b15.
    Nothing was changed. The commands -Apply would run, in order:
      Update-MgApplication -ApplicationId 'a0000000-0000-4000-8000-000000000101' -Web @{ RedirectUris = @('https://cases.contoso.example/signin-oidc') } -Spa @{ RedirectUris = @('https://cases.contoso.example/') } -PublicClient @{ RedirectUris = @() }
    ```

    One command, and the plan's SHA-256: the value the approver records in the change. Without `-Apply` nothing is sent.

6. **Run the OAuth regression test:**

    ```powershell
    Test-AmOAuthRegression -PlanPath "$Run\pack\wp4-redirect-plan.json" -TenantId aaaabbbb-0000-cccc-1111-dddd2222eeee -FixturePath tests/fixtures/identity/oauth-responses.json -OutDir "$Run\pack" | Format-Table
    ```

    Expected output:

    ```text
    Uri                                           Expected    Observed    Pass
    ---                                           --------    --------    ----
    https://cases.contoso.example/signin-oidc     accepted    accepted    True
    https://cases.contoso.example/                accepted    accepted    True
    http://cases-test.contoso.example/signin-oidc AADSTS50011 AADSTS50011 True
    https://cases-old.contoso.example/signin-oidc AADSTS50011 AADSTS50011 True
    https://cases.fabrikam.example/signin-oidc    AADSTS50011 AADSTS50011 True
    http://localhost:5173/                        AADSTS50011 AADSTS50011 True
    ```

    The two kept URIs accepted; the four removed ones refused with `AADSTS50011`. The wildcard isn't tried: it can't be sent as a redirect URI.

7. **Try to require assignment with nobody assigned:**

    ```powershell
    try { New-AmAssignmentPlan -SnapshotDir "$Run\pack" -AssignmentsPath tests/fixtures/identity/no-assignments.json -ChangeId CHG-0001 -OutDir "$Run\pack" } catch { $_.Exception.Message }
    ```

    Expected output, the error's message:

    ```text
    AM-AS-01: nobody would be assigned. Requiring assignment now would refuse every user and client.
    ```

    Refused (AM-AS-01): it would lock everyone out.

8. **Plan the assignment:**

    ```powershell
    New-AmAssignmentPlan -SnapshotDir "$Run\pack" -AssignmentsPath tests/fixtures/identity/reviewed-assignments.json -ChangeId CHG-0001 -OutDir "$Run\pack" | Format-List
    ./Invoke-AmIdentityApply.ps1 -PlanPath "$Run\pack\wp5-assignment-plan.json"
    ```

    Expected output:

    ```text
    Plan       : wp5-assignment-plan.json
    Kind       : wp5-assignment
    Commands   : 3
    PlanSha256 : abff2e32f31a61dac348de8631d1434b899eeb8f84dc7b022f7746c38cd1d67f

    Dry run of wp5-assignment for 00001111-aaaa-2222-bbbb-3333cccc4444, change CHG-0001. Plan SHA-256 abff2e32f31a61dac348de8631d1434b899eeb8f84dc7b022f7746c38cd1d67f.
    Nothing was changed. The commands -Apply would run, in order:
      New-MgServicePrincipalAppRoleAssignedTo -ServicePrincipalId 'a0000000-0000-4000-8000-000000000102' -BodyParameter @{ principalId = 'a0000000-0000-4000-8000-000000000301'; resourceId = 'a0000000-0000-4000-8000-000000000102'; appRoleId = '00000000-0000-0000-0000-000000000000' }
      New-MgServicePrincipalAppRoleAssignedTo -ServicePrincipalId 'a0000000-0000-4000-8000-000000000102' -BodyParameter @{ principalId = 'a0000000-0000-4000-8000-000000000302'; resourceId = 'a0000000-0000-4000-8000-000000000102'; appRoleId = '00000000-0000-0000-0000-000000000000' }
      Update-MgServicePrincipal -ServicePrincipalId 'a0000000-0000-4000-8000-000000000102' -AppRoleAssignmentRequired:$true
    ```

    Two assignments, then the switch.

9. **Plan the rollback, and see the gate refuse a plan without its approved hash:**

    ```powershell
    New-AmRollbackPlan -SnapshotDir "$Run\pack" -CheckPath "$Run\pack\wp4-redirect-check.csv" -ChangeId CHG-0001 -OutDir "$Run\pack" | Format-List
    (Read-AmJson -Path "$Run\pack\rollback-plan.json").notRestored
    try { ./Invoke-AmIdentityApply.ps1 -PlanPath "$Run\pack\wp5-assignment-plan.json" -ApprovedSha256 0000 -Apply } catch { $_.Exception.Message }
    ```

    Expected output:

    ```text
    Plan       : rollback-plan.json
    Kind       : rollback
    Commands   : 2
    PlanSha256 : 95e545862d646d4afb8a6a4c5e750da76fe37c5d3e2a5fcf37914304bb2876ef

    https://cases-old.contoso.example/signin-oidc
    https://cases.fabrikam.example/signin-oidc
    AM-APPLY-02: the plan's SHA-256 is abff2e32f31a61dac348de8631d1434b899eeb8f84dc7b022f7746c38cd1d67f, not the approved 0000. Review the plan again.
    ```

    The rollback won't restore the URI on someone else's domain or the dangling one. The apply stops with AM-APPLY-02 before it looks for a Graph session.

10. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests/Identity.Tests.ps1 -FullNameFilter 'The snapshot*', 'WP4*', 'WP5*', 'The write path*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    Expected output:

    ```text
    PassedCount FailedCount
    ----------- -----------
             26           0
    ```

11. **Write the step's evidence records:**

    ```powershell
    Write-AmEvidenceRecord -Step SNAPSHOT -Path (Get-ChildItem "$Run\pack" -Filter 'before-*.json' | ForEach-Object FullName) -OutputPath "$Run\evidence" -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
    Write-AmEvidenceRecord -Step WP4 -Path "$Run\pack\wp4-redirect-check.csv", "$Run\pack\wp4-redirect-plan.json", "$Run\pack\wp4-oauth-regression.csv" -OutputPath "$Run\evidence" -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
    Write-AmEvidenceRecord -Step WP5 -Path "$Run\pack\wp5-assignment-plan.json" -OutputPath "$Run\evidence" -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
    ```

    Expected output:

    ```text
    Record                   Step     Files KSIs
    ------                   ----     ----- ----
    record-001-SNAPSHOT.json SNAPSHOT     6 KSI-PIY-GIV KSI-SVC-ACM


    Record              Step Files KSIs
    ------              ---- ----- ----
    record-002-WP4.json WP4      3 KSI-CNA-MAT KSI-CMT-VTD


    Record              Step Files KSIs
    ------              ---- ----- ----
    record-003-WP5.json WP5      1 KSI-IAM-AAM KSI-IAM-ELP
    ```

Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\application-modernization-06-the-applications-identity\lab1 -Name
```

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Exercise: Lab 2, a test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 06, Lab 2](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md#lab-2-a-test-tenant). It has the exact commands.

- **You need:** a Microsoft Entra test tenant, a test group with two test users, a host on a domain you control that resolves and a name on it that doesn't, and Cloud Application Administrator for the lab; never production.
- **What you do:** create a test app registration, take its snapshot live, plan and apply WP4 and WP5 with their approved hashes, run the regression test against the sign-in endpoint, test as an assigned and an unassigned user, and rehearse the rollback.
- **Back-out:** delete the test app registration and the lab's files.

## Knowledge check (5 minutes)

1. A redirect URI's host has a CNAME to a cloud resource name that no longer resolves. What does the kit report, and what happens first?
    a. AM-RU-02; remove it at once
    b. AM-RU-04 and AM-RU-05; the domain owner removes the record or reclaims the resource before anything else
    c. Nothing; it's on an owned domain
    d. AM-RU-06; move it to a development registration
2. Why does the WP5 plan assign groups and client applications before it requires assignment?
    a. Graph requires that order
    b. Turned on first, it would refuse every user and client
    c. Assignments are cheaper
    d. It doesn't matter
3. What does `Invoke-AmIdentityApply.ps1` do without `-Apply`?
    a. Applies the plan
    b. Prints the commands the plan would run and changes nothing
    c. Deletes the plan
    d. Signs in to Graph
4. Who should test WP5's assignment requirement?
    a. A Global Administrator
    b. The affected identities: an assigned and an unassigned test user
    c. The agent
    d. Nobody; the plan proves it

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in Lab 1, step 3.
2. **b.** Taught in [What they leave to you](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md#what-they-leave-to-you).
3. **b.** Taught in Lab 1, step 5.
4. **b.** Taught in [Dangers](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md#dangers).
:::

## Summary (2 minutes)

You took a snapshot, found which work packages apply, checked seven redirect URIs, planned and proved the cleanup, planned assignment, planned the rollback, saw the gate refuse a wrong hash, and wrote three chained evidence records.

**The evidence an ISSO keeps** from this module: the before snapshot, the redirect check and regression CSVs, both plans with their approved SHA-256 in the change record, the apply logs, and the `SNAPSHOT`, `WP4` and `WP5` evidence records. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md#checklist).

**Next:** [Module 7: The evidence pack](07-the-evidence-pack.md).
