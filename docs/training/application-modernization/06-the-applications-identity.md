---
title: "Module 6: The application's identity"
description: "Workbook Chapter 06 and Book 18 Appendix A: one application's own Microsoft Entra identity through the remediation factory's work packages. The before snapshot, which of WP1 to WP6 it needs and where each is built, WP4's redirect URI check against owned domains and DNS with an OAuth regression test, WP5's assignment plan, one write path gated on the plan's approved SHA-256, and the rollback. About 70 minutes, with a lab on a fictional application and a test-tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 18"
series-order: 6
review-status: pending
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

This is the workbook's [Chapter 06, Lab 1](../../project-plans/developer-workbooks/application-modernization/06-the-applications-identity-redirect-uris-and-assignment.md#lab-1-fixtures-no-tenant), which shows the output of every step. Work in `examples/app-modernization`, or the folder the path's [Get the code](index.md#get-the-code) gives, in PowerShell 7.4 or later.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/app-modernization`. Each step below says what it does and what to look for.

```powershell
# Step 1: Take the before snapshot
Import-Module ./powershell/AppModernization/AppModernization.psm1
Get-AmAppSnapshot -AppId 00001111-aaaa-2222-bbbb-3333cccc4444 -OutDir out/pack -Stage before -FixturePath tests/fixtures/identity | Format-List

# Step 2: See which work packages it needs, and where each is built
Get-AmWorkPackage -SnapshotDir out/pack -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json | Format-Table WorkPackage, Needed, Why, BuiltIn -Wrap

# Step 3: Check every redirect URI
Test-AmRedirectUri -SnapshotDir out/pack -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json -OutDir out/pack | Format-Table Platform, Uri, OwnedDomain, Resolves, CnameTarget, Findings -Wrap

# Step 4: Try to keep the dangling URI
New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -Keep 'https://cases-old.contoso.example/signin-oidc' -ChangeId CHG-0001 -OutDir out/pack

# Step 5: Plan the cleanup
New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -Keep 'https://cases.contoso.example/signin-oidc', 'https://cases.contoso.example/' -ChangeId CHG-0001 -OutDir out/pack | Format-List
./Invoke-AmIdentityApply.ps1 -PlanPath out/pack/wp4-redirect-plan.json

# Step 6: Run the OAuth regression test
Test-AmOAuthRegression -PlanPath out/pack/wp4-redirect-plan.json -TenantId aaaabbbb-0000-cccc-1111-dddd2222eeee -FixturePath tests/fixtures/identity/oauth-responses.json -OutDir out/pack | Format-Table

# Step 7: Try to require assignment with nobody assigned
New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath tests/fixtures/identity/no-assignments.json -ChangeId CHG-0001 -OutDir out/pack

# Step 8: Plan the assignment
New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath tests/fixtures/identity/reviewed-assignments.json -ChangeId CHG-0001 -OutDir out/pack | Format-List
./Invoke-AmIdentityApply.ps1 -PlanPath out/pack/wp5-assignment-plan.json

# Step 9: Plan the rollback, and see the gate refuse a plan without its approved hash
New-AmRollbackPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -ChangeId CHG-0001 -OutDir out/pack | Format-List
(Read-AmJson -Path out/pack/rollback-plan.json).notRestored
./Invoke-AmIdentityApply.ps1 -PlanPath out/pack/wp5-assignment-plan.json -ApprovedSha256 0000 -Apply

# Step 10: Run this chapter's tests
Invoke-Pester -Path tests/Identity.Tests.ps1 -FullNameFilter 'The snapshot*', 'WP4*', 'WP5*', 'The write path*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# Step 11: Write the step's evidence records
Write-AmEvidenceRecord -Step SNAPSHOT -Path (Get-ChildItem out/pack -Filter 'before-*.json' | ForEach-Object { "out/pack/$($_.Name)" }) -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
Write-AmEvidenceRecord -Step WP4 -Path out/pack/wp4-redirect-check.csv, out/pack/wp4-redirect-plan.json, out/pack/wp4-oauth-regression.csv -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
Write-AmEvidenceRecord -Step WP5 -Path out/pack/wp5-assignment-plan.json -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Take the before snapshot:**

    ```powershell
    Import-Module ./powershell/AppModernization/AppModernization.psm1
    Get-AmAppSnapshot -AppId 00001111-aaaa-2222-bbbb-3333cccc4444 -OutDir out/pack -Stage before -FixturePath tests/fixtures/identity | Format-List
    ```

    One owner, one application permission, one tenant-wide grant, no assignments, seven redirect URIs, one secret, and assignment not required.

2. **See which work packages it needs, and where each is built:**

    ```powershell
    Get-AmWorkPackage -SnapshotDir out/pack -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json | Format-Table WorkPackage, Needed, Why, BuiltIn -Wrap
    ```

    All six. WP1 to WP3 go to the Non-Person Identity kit; WP4 and WP5 are next.

3. **Check every redirect URI:**

    ```powershell
    Test-AmRedirectUri -SnapshotDir out/pack -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json -OutDir out/pack | Format-Table Platform, Uri, OwnedDomain, Resolves, CnameTarget, Findings -Wrap
    ```

    Two clean URIs. A wildcard (AM-RU-01), an `http` host (AM-RU-02), a host on someone else's domain (AM-RU-03), a host whose CNAME points at a cloud name that no longer resolves (AM-RU-04 and AM-RU-05: give it to the domain owner first), and the kit's own Vite development server (AM-RU-06), which belongs on a separate registration.

4. **Try to keep the dangling URI:**

    ```powershell
    New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -Keep 'https://cases-old.contoso.example/signin-oidc' -ChangeId CHG-0001 -OutDir out/pack
    ```

    Refused, with the findings named.

5. **Plan the cleanup:**

    ```powershell
    New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -Keep 'https://cases.contoso.example/signin-oidc', 'https://cases.contoso.example/' -ChangeId CHG-0001 -OutDir out/pack | Format-List
    ./Invoke-AmIdentityApply.ps1 -PlanPath out/pack/wp4-redirect-plan.json
    ```

    One command, and the plan's SHA-256: the value the approver records in the change. Without `-Apply` nothing is sent.

6. **Run the OAuth regression test:**

    ```powershell
    Test-AmOAuthRegression -PlanPath out/pack/wp4-redirect-plan.json -TenantId aaaabbbb-0000-cccc-1111-dddd2222eeee -FixturePath tests/fixtures/identity/oauth-responses.json -OutDir out/pack | Format-Table
    ```

    The two kept URIs accepted; the four removed ones refused with `AADSTS50011`. The wildcard isn't tried: it can't be sent as a redirect URI.

7. **Try to require assignment with nobody assigned:**

    ```powershell
    New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath tests/fixtures/identity/no-assignments.json -ChangeId CHG-0001 -OutDir out/pack
    ```

    Refused (AM-AS-01): it would lock everyone out.

8. **Plan the assignment:**

    ```powershell
    New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath tests/fixtures/identity/reviewed-assignments.json -ChangeId CHG-0001 -OutDir out/pack | Format-List
    ./Invoke-AmIdentityApply.ps1 -PlanPath out/pack/wp5-assignment-plan.json
    ```

    Two assignments, then the switch.

9. **Plan the rollback, and see the gate refuse a plan without its approved hash:**

    ```powershell
    New-AmRollbackPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -ChangeId CHG-0001 -OutDir out/pack | Format-List
    (Read-AmJson -Path out/pack/rollback-plan.json).notRestored
    ./Invoke-AmIdentityApply.ps1 -PlanPath out/pack/wp5-assignment-plan.json -ApprovedSha256 0000 -Apply
    ```

    The rollback won't restore the URI on someone else's domain or the dangling one. The apply stops with AM-APPLY-02 before it looks for a Graph session.

10. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests/Identity.Tests.ps1 -FullNameFilter 'The snapshot*', 'WP4*', 'WP5*', 'The write path*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

11. **Write the step's evidence records:**

    ```powershell
    Write-AmEvidenceRecord -Step SNAPSHOT -Path (Get-ChildItem out/pack -Filter 'before-*.json' | ForEach-Object { "out/pack/$($_.Name)" }) -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
    Write-AmEvidenceRecord -Step WP4 -Path out/pack/wp4-redirect-check.csv, out/pack/wp4-redirect-plan.json, out/pack/wp4-oauth-regression.csv -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
    Write-AmEvidenceRecord -Step WP5 -Path out/pack/wp5-assignment-plan.json -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
    ```

Delete the outputs when you're done:

```powershell
Remove-Item -Recurse -Force out
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
