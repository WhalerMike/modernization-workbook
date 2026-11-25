---
title: "Chapter 06 — The Application's Identity: Redirect URIs and Assignment"
description: "Book 18 Appendix A's identity work packages for one application, in code: the read-only before snapshot of the app registration, service principal, owners, permissions, grants and assignments; which of WP1 to WP6 the application needs and where each is built (WP1 to WP3 by the Non-Person Identity kit); WP4's redirect URI check against owned domains and DNS, with a dangling-CNAME finding, a plan that refuses to keep a failing URI and an OAuth regression test; WP5's assignment plan that assigns groups and client applications before it requires assignment; one write path gated on the plan's approved SHA-256; and the rollback from the snapshot. Lab 1 runs it all on a fictional application; Lab 2 runs it on a test app registration in a test tenant and deletes it afterwards."
doc-type: workbook-chapter
audience: [Technical]
family: dw-application-modernization
part: How
series-order: 6
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 06 — The Application's Identity: Redirect URIs and Assignment

*A modernized application is still exposed if its app registration sends tokens to a host someone else now controls, or lets every user in the tenant sign in. Prove each redirect URI, then require assignment.*

::: {.callout-note}
## In this chapter
[Book 18, Appendix A](../../../books/b18-application-modernization/appendix-a-identity-remediation-work-packages.md)'s work packages for one application's own Microsoft Entra identity. You start with what Microsoft Learn says about redirect URIs and assignment, and what Appendix A asks. Then you read the kit's `AppModernization` module: the snapshot, the work package list, WP4 and WP5 as plans, and the one write path. WP1 to WP3 aren't rebuilt here: *Building Non-Person Identity* builds them, and the work package list points there. Lab 1 runs on a fictional application; Lab 2 uses a test app registration in a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can take an application's before snapshot, say which work packages it needs, plan its redirect URI cleanup and its assignment, prove the plan with an OAuth regression test, and apply it only with an approved hash.

**Audience.** Identity engineers running the remediation factory of Book 18's [Chapter 10](../../../books/b18-application-modernization/10-running-the-portfolio-in-waves.md#identity-remediation-factory), and the application's technical owner, who tests and signs off. You should be able to run PowerShell 7 and know what an app registration and an enterprise application are.

## Start with Microsoft Learn and the appendix

### What they give you

Microsoft recommends keeping ownership of every redirect URI, monitoring their DNS records, avoiding wildcards and insecure schemes, and keeping the list small.[^am06-best] Redirect URIs belong on the application object, never the service principal, and a sign-in with a URI that isn't registered fails with `AADSTS50011`; Microsoft advises separate registrations for development and production, and a shared URI with the destination in the `state` parameter where a wildcard served many subdomains.[^am06-reply] A CNAME that points at a cloud resource the agency no longer owns is a dangling record, to be removed or reclaimed first.[^am06-dangling] With **Assignment required** on, only assigned users and applications get tokens; it doesn't hold Global Administrators; user consent isn't allowed once it's on; and assigning a client application to a resource application is an API-only step.[^am06-props] [^am06-assign] An unassigned user gets `AADSTS50105`, and group-based assignment needs Entra ID P1 or P2.[^am06-50105]

Appendix A turns that into six work packages with a snapshot first, each with its commands, its validation and its rollback.

### What they leave to you

Each row is pinned by a test in `tests/Identity.Tests.ps1`.

| What Learn and the appendix give | Why it matters | What the kit adds |
|---|---|---|
| Six snapshot commands | Run by hand, one is missed, and the rollback has no source | `Get-AmAppSnapshot`: all six, named `before-` or `after-`; fixture mode reads files, live mode reads Graph and writes nothing |
| Six work packages | Not every application needs all six, and three are built elsewhere | `Get-AmWorkPackage`: which apply, why, and where each is built |
| "Own every redirect URI; monitor DNS" | A loop over URIs by hand misses a look-alike domain or a dangling CNAME | `Test-AmRedirectUri`: findings AM-RU-01 to -06 (wildcard, `http`, not owned, doesn't resolve, dangling CNAME, development loopback) |
| "Keep only the approved URIs" | A plan typed into a command can keep the wrong one | `New-AmRedirectPlan` refuses to keep a URI with a blocking finding, and writes a plan with its SHA-256 |
| `AADSTS50011` for an unregistered URI | Removing a URI without proof leaves doubt | `Test-AmOAuthRegression`: kept accepted, removed refused, written to a CSV |
| "Assign first, then require assignment" | Turned on first, it refuses every user and client | `New-AmAssignmentPlan` orders the commands, refuses with nobody assigned (AM-AS-01) or while user consent grants exist (AM-AS-02), and takes groups and client applications only |
| The rollback table | A rollback that re-adds a dangling URI repeats the risk | `New-AmRollbackPlan` never restores a URI that failed ownership (Appendix A) or dangles (the kit's rule) |
| Commands to run in the change window | A write without review | `Invoke-AmIdentityApply.ps1`: a dry run by default; writes only with `-Apply` and the approved SHA-256 |

**The verdict.** Use the Microsoft Graph PowerShell commands Appendix A names, as published. Build the checks, the plans and the gate around them.

## The code

| Function or script | Work package | What it does |
|---|---|---|
| `Get-AmAppSnapshot`, `Get-AmSnapshotSummary` | Snapshot | The six files and a one-line summary |
| `Get-AmWorkPackage` | WP1 to WP6 | Needed or not, why, and where it's built |
| `Test-AmRedirectUri` | WP4, step 1 | One row per URI with its findings; `wp4-redirect-check.csv` |
| `New-AmRedirectPlan` | WP4, step 3 | `wp4-redirect-plan.json` |
| `Test-AmOAuthRegression` | WP4, step 4 | `wp4-oauth-regression.csv` |
| `New-AmAssignmentPlan` | WP5 | `wp5-assignment-plan.json` from a reviewed list of groups and client applications |
| `New-AmRollbackPlan` | Rollback | `rollback-plan.json` |
| `Get-AmPlanCommand`, `Invoke-AmIdentityApply.ps1` | All | The plan's commands, then the gated write and `apply-<kind>.json` |

| Work package | Where it's built |
|---|---|
| WP1 Owner assignment | [*Building Non-Person Identity*, Chapter 02](../non-person-identity/02-ownership-and-the-orphan-rule.md): owners, `serviceManagementReference` and the orphan rule |
| WP2 Permission reduction | [Chapter 07](../non-person-identity/07-least-privilege-for-service-principals.md): the permission sweep and the reviewed removal plan |
| WP3 Secret to managed identity | [Chapter 05](../non-person-identity/05-workload-identity-federation-and-managed-identities.md): the conversion with a parallel run |
| WP4, WP5 | This chapter |
| WP6 | [Chapter 07](07-the-post-change-test-and-the-evidence-pack.md) of this workbook |

The fixtures in `tests/fixtures/identity` are one fictional application, *Case Triage (fictional)*, before and after its change, with Learn's example application ID, `contoso.example` as the owned domain, and a DNS file in place of a resolver.

::: {.callout-important}
## Illustrative code
Lab 1 reads files and sends nothing: the DNS answers and the identity platform's replies are fixtures. The live paths have been written from Appendix A's commands and haven't been run against a tenant. Run Lab 2 in a test tenant before any production change.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.4 or later with Pester 5. Work in `examples/app-modernization`.

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

   <!-- capture:begin 06-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-1.txt))](captures/06-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/AppModernization/AppModernization.psm1 and what it printed"}

   <!-- capture:end -->

   One owner, one application permission, one tenant-wide grant, no assignments, seven redirect URIs, one secret, and assignment not required.

2. **See which work packages it needs, and where each is built:**

   ```powershell
   Get-AmWorkPackage -SnapshotDir out/pack -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json | Format-Table WorkPackage, Needed, Why, BuiltIn -Wrap
   ```

   <!-- capture:begin 06-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-2.txt))](captures/06-2.png){.lightbox fig-alt="Terminal window showing Get-AmWorkPackage -SnapshotDir out/pack -OwnedDomainsPath tests/fixtures/iden… and what it printed"}

   <!-- capture:end -->

   All six. WP1 to WP3 go to the Non-Person Identity kit; WP4 and WP5 are next.

3. **Check every redirect URI:**

   ```powershell
   Test-AmRedirectUri -SnapshotDir out/pack -OwnedDomainsPath tests/fixtures/identity/owned-domains.txt -DnsPath tests/fixtures/identity/dns.json -OutDir out/pack | Format-Table Platform, Uri, OwnedDomain, Resolves, CnameTarget, Findings -Wrap
   ```

   <!-- capture:begin 06-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-3.txt))](captures/06-3.png){.lightbox fig-alt="Terminal window showing Test-AmRedirectUri -SnapshotDir out/pack -OwnedDomainsPath tests/fixtures/ide… and what it printed"}

   <!-- capture:end -->

   Two clean URIs. A wildcard (AM-RU-01), an `http` host (AM-RU-02), a host on someone else's domain (AM-RU-03), a host whose CNAME points at a cloud name that no longer resolves (AM-RU-04 and AM-RU-05: give it to the domain owner first), and the kit's own Vite development server (AM-RU-06), which belongs on a separate registration.

4. **Try to keep the dangling URI:**

   ```powershell
   New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -Keep 'https://cases-old.contoso.example/signin-oidc' -ChangeId CHG-0001 -OutDir out/pack
   ```

   <!-- capture:begin 06-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-4.txt))](captures/06-4.png){.lightbox fig-alt="Terminal window showing New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-che… and what it printed"}

   <!-- capture:end -->

   Refused, with the findings named.

5. **Plan the cleanup:** keep the two clean URIs:

   ```powershell
   New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -Keep 'https://cases.contoso.example/signin-oidc', 'https://cases.contoso.example/' -ChangeId CHG-0001 -OutDir out/pack | Format-List
   ./Invoke-AmIdentityApply.ps1 -PlanPath out/pack/wp4-redirect-plan.json
   ```

   <!-- capture:begin 06-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-5.txt))](captures/06-5.png){.lightbox fig-alt="Terminal window showing New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-che… and what it printed"}

   <!-- capture:end -->

   One command, and the plan's SHA-256: the value the approver records in the change. Without `-Apply` nothing is sent.

6. **Run the OAuth regression test:**

   ```powershell
   Test-AmOAuthRegression -PlanPath out/pack/wp4-redirect-plan.json -TenantId aaaabbbb-0000-cccc-1111-dddd2222eeee -FixturePath tests/fixtures/identity/oauth-responses.json -OutDir out/pack | Format-Table
   ```

   <!-- capture:begin 06-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-6.txt))](captures/06-6.png){.lightbox fig-alt="Terminal window showing Test-AmOAuthRegression -PlanPath out/pack/wp4-redirect-plan.json -TenantId aa… and what it printed"}

   <!-- capture:end -->

   The two kept URIs accepted; the four removed ones refused with `AADSTS50011`. The wildcard isn't tried: it can't be sent as a redirect URI.

7. **Try to require assignment with nobody assigned:**

   ```powershell
   New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath tests/fixtures/identity/no-assignments.json -ChangeId CHG-0001 -OutDir out/pack
   ```

   <!-- capture:begin 06-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-7.txt))](captures/06-7.png){.lightbox fig-alt="Terminal window showing New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath tests/fixtures/id… and what it printed"}

   <!-- capture:end -->

   Refused (AM-AS-01): it would lock everyone out.

8. **Plan the assignment** from the reviewed list: the users' group and the reports job that calls the application:

   ```powershell
   New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath tests/fixtures/identity/reviewed-assignments.json -ChangeId CHG-0001 -OutDir out/pack | Format-List
   ./Invoke-AmIdentityApply.ps1 -PlanPath out/pack/wp5-assignment-plan.json
   ```

   <!-- capture:begin 06-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-8.txt))](captures/06-8.png){.lightbox fig-alt="Terminal window showing New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath tests/fixtures/id… and what it printed"}

   <!-- capture:end -->

   Two assignments, then the switch.

9. **Plan the rollback, and see the gate refuse a plan without its approved hash:**

   ```powershell
   New-AmRollbackPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -ChangeId CHG-0001 -OutDir out/pack | Format-List
   (Read-AmJson -Path out/pack/rollback-plan.json).notRestored
   ./Invoke-AmIdentityApply.ps1 -PlanPath out/pack/wp5-assignment-plan.json -ApprovedSha256 0000 -Apply
   ```

   <!-- capture:begin 06-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-9.txt))](captures/06-9.png){.lightbox fig-alt="Terminal window showing New-AmRollbackPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-che… and what it printed"}

   <!-- capture:end -->

   The rollback won't restore the URI on someone else's domain or the dangling one. The apply stops with AM-APPLY-02 before it looks for a Graph session.

10. **Run this chapter's tests:**

    ```powershell
    Invoke-Pester -Path tests/Identity.Tests.ps1 -FullNameFilter 'The snapshot*', 'WP4*', 'WP5*', 'The write path*' -Output None -PassThru | Select-Object PassedCount, FailedCount
    ```

    <!-- capture:begin 06-10 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

    ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-10.txt))](captures/06-10.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/Identity.Tests.ps1 -FullNameFilter 'The snapshot*',… and what it printed"}

    <!-- capture:end -->

11. **Write the step's evidence records:**

    ```powershell
    Write-AmEvidenceRecord -Step SNAPSHOT -Path (Get-ChildItem out/pack -Filter 'before-*.json' | ForEach-Object { "out/pack/$($_.Name)" }) -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
    Write-AmEvidenceRecord -Step WP4 -Path out/pack/wp4-redirect-check.csv, out/pack/wp4-redirect-plan.json, out/pack/wp4-oauth-regression.csv -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
    Write-AmEvidenceRecord -Step WP5 -Path out/pack/wp5-assignment-plan.json -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
    ```

    <!-- capture:begin 06-11 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

    ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-11.txt))](captures/06-11.png){.lightbox fig-alt="Terminal window showing Write-AmEvidenceRecord -Step SNAPSHOT -Path (Get-ChildItem out/pack -Filter '… and what it printed"}

    <!-- capture:end -->

**Expected result:** five URIs with findings, the dangling URI refused, a one-command WP4 plan, six regression rows that pass, the empty assignment refused, a three-command WP5 plan, a rollback that leaves out two URIs, the gate refusing the wrong hash, the tests passing, and three chained records. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 06-12 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/06-12.txt))](captures/06-12.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant

Use a Microsoft Entra test tenant, never production, with a test group, two test users (one of them in the group), a host name on a domain you control that resolves, and a name on that domain that doesn't. You need PowerShell 7.4 or later with the `Microsoft.Graph.Applications` module, and an account with Cloud Application Administrator, activated for the lab. Work in `examples/app-modernization`. You'll replace: `<tenant-id>`, `<owned-domain>` (a domain the tenant's owner controls), `<kept-host>` (a host on it that resolves), `<unused-host>` (a name on it that doesn't resolve), `<test-group-id>` (the group's object ID) and `<approved-sha256>` (the hash each dry run prints, recorded as approved). The lab creates its own app registration and deletes it at the end.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/app-modernization`. Each step below says what it does and what to look for.

```powershell
# Step 1: Sign in, and create a test app registration with one good redirect URI and two bad ones
Connect-MgGraph -TenantId <tenant-id> -Scopes 'Application.ReadWrite.All','AppRoleAssignment.ReadWrite.All' -NoWelcome
$app = New-MgApplication -DisplayName 'am-lab-wp4-wp5' -Web @{ RedirectUris = @('https://<kept-host>/signin-oidc', 'https://<unused-host>/signin-oidc', 'https://am-lab.invalid/signin-oidc') }
$sp = New-MgServicePrincipal -AppId $app.AppId
Set-Content -Path lab-owned-domains.txt -Value '<owned-domain>'

# Step 2: Take the snapshot and check the URIs live
Import-Module ./powershell/AppModernization/AppModernization.psm1
Get-AmAppSnapshot -AppId $app.AppId -OutDir out/lab -Stage before | Format-List
Test-AmRedirectUri -SnapshotDir out/lab -OwnedDomainsPath lab-owned-domains.txt -OutDir out/lab | Format-Table Uri, OwnedDomain, Resolves, Findings

# Step 3: Plan, approve and apply WP4
New-AmRedirectPlan -SnapshotDir out/lab -CheckPath out/lab/wp4-redirect-check.csv -Keep 'https://<kept-host>/signin-oidc' -ChangeId LAB-1 -OutDir out/lab
./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/wp4-redirect-plan.json
./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/wp4-redirect-plan.json -ApprovedSha256 <approved-sha256> -Apply

# Step 4: Run the regression test against the sign-in endpoint
Test-AmOAuthRegression -PlanPath out/lab/wp4-redirect-plan.json -TenantId <tenant-id> -OutDir out/lab | Format-Table

# Step 5: Plan, approve and apply WP5
ConvertTo-Json @(@{ principalId = '<test-group-id>'; principalType = 'Group'; appRoleId = '00000000-0000-0000-0000-000000000000'; reason = 'Lab test group' }) | Set-Content lab-assignments.json
New-AmAssignmentPlan -SnapshotDir out/lab -AssignmentsPath lab-assignments.json -ChangeId LAB-1 -OutDir out/lab
./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/wp5-assignment-plan.json
./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/wp5-assignment-plan.json -ApprovedSha256 <approved-sha256> -Apply

# Step 6: Rehearse the rollback
New-AmRollbackPlan -SnapshotDir out/lab -CheckPath out/lab/wp4-redirect-check.csv -ChangeId LAB-1 -OutDir out/lab
./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/rollback-plan.json
./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/rollback-plan.json -ApprovedSha256 <approved-sha256> -Apply
(Get-MgApplication -ApplicationId $app.Id).Web.RedirectUris

# Step 7: Back it out
Remove-MgApplication -ApplicationId $app.Id
Remove-Item lab-owned-domains.txt, lab-assignments.json
Disconnect-MgGraph
```

:::

<!-- labs:end -->

1. **Sign in, and create a test app registration with one good redirect URI and two bad ones:**

   ```powershell
   Connect-MgGraph -TenantId <tenant-id> -Scopes 'Application.ReadWrite.All','AppRoleAssignment.ReadWrite.All' -NoWelcome
   $app = New-MgApplication -DisplayName 'am-lab-wp4-wp5' -Web @{ RedirectUris = @('https://<kept-host>/signin-oidc', 'https://<unused-host>/signin-oidc', 'https://am-lab.invalid/signin-oidc') }
   $sp = New-MgServicePrincipal -AppId $app.AppId
   Set-Content -Path lab-owned-domains.txt -Value '<owned-domain>'
   ```

2. **Take the snapshot and check the URIs live:**

   ```powershell
   Import-Module ./powershell/AppModernization/AppModernization.psm1
   Get-AmAppSnapshot -AppId $app.AppId -OutDir out/lab -Stage before | Format-List
   Test-AmRedirectUri -SnapshotDir out/lab -OwnedDomainsPath lab-owned-domains.txt -OutDir out/lab | Format-Table Uri, OwnedDomain, Resolves, Findings
   ```

   The unused name gets AM-RU-04; the `.invalid` host AM-RU-03 and AM-RU-04.

3. **Plan, approve and apply WP4:**

   ```powershell
   New-AmRedirectPlan -SnapshotDir out/lab -CheckPath out/lab/wp4-redirect-check.csv -Keep 'https://<kept-host>/signin-oidc' -ChangeId LAB-1 -OutDir out/lab
   ./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/wp4-redirect-plan.json
   ./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/wp4-redirect-plan.json -ApprovedSha256 <approved-sha256> -Apply
   ```

4. **Run the regression test against the sign-in endpoint:**

   ```powershell
   Test-AmOAuthRegression -PlanPath out/lab/wp4-redirect-plan.json -TenantId <tenant-id> -OutDir out/lab | Format-Table
   ```

   The kept URI accepted; the two removed refused with `AADSTS50011`.

5. **Plan, approve and apply WP5** for the test group:

   ```powershell
   ConvertTo-Json @(@{ principalId = '<test-group-id>'; principalType = 'Group'; appRoleId = '00000000-0000-0000-0000-000000000000'; reason = 'Lab test group' }) | Set-Content lab-assignments.json
   New-AmAssignmentPlan -SnapshotDir out/lab -AssignmentsPath lab-assignments.json -ChangeId LAB-1 -OutDir out/lab
   ./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/wp5-assignment-plan.json
   ./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/wp5-assignment-plan.json -ApprovedSha256 <approved-sha256> -Apply
   ```

   Then sign in to `https://myapps.microsoft.com` as each test user: the one in the group can open the app; the other gets `AADSTS50105`. Don't test with a Global Administrator, whom assignment doesn't hold.

6. **Rehearse the rollback:**

   ```powershell
   New-AmRollbackPlan -SnapshotDir out/lab -CheckPath out/lab/wp4-redirect-check.csv -ChangeId LAB-1 -OutDir out/lab
   ./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/rollback-plan.json
   ./Invoke-AmIdentityApply.ps1 -PlanPath out/lab/rollback-plan.json -ApprovedSha256 <approved-sha256> -Apply
   (Get-MgApplication -ApplicationId $app.Id).Web.RedirectUris
   ```

   The unused name on the owned domain comes back; the `.invalid` one, on a domain the agency doesn't own, doesn't.

7. **Back it out:** delete the test app registration and the lab's files. Keep `out/lab` for Chapter 07's Lab 2 if you'll run it next, and delete it after:

   ```powershell
   Remove-MgApplication -ApplicationId $app.Id
   Remove-Item lab-owned-domains.txt, lab-assignments.json
   Disconnect-MgGraph
   ```

## Verified facts

| Item | Value | US Government | Source |
|---|---|---|---|
| Redirect URI practice | Own every URI, monitor DNS, no wildcards or insecure schemes, keep the list small | — | [^am06-best] |
| Unregistered redirect URI | `AADSTS50011`; URIs on the application object only; separate development registrations | — | [^am06-reply] |
| Dangling DNS | Remove the record or reclaim the resource first | — | [^am06-dangling] |
| Assignment required | Only assigned users and applications get tokens; Global Administrators aren't held | — | [^am06-props] |
| Assigning a client application | API only; `Update-MgServicePrincipal -AppRoleAssignmentRequired`; no user consent once required | — | [^am06-assign] |
| Unassigned user | `AADSTS50105`; group assignment needs P1 or P2 | — | [^am06-50105] |
| Graph endpoint | Application, service principal, owner, grant and assignment operations on the worldwide endpoint | GCC uses it | [^am06-graph-clouds] |

## Federal requirements and evidence

The records' controls and KSIs are the kit's `config/requirements.json`, steps `SNAPSHOT`, `WP4` and `WP5`, which follow Appendix A's requirements table.[^am06-oscal] [^am06-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The application's identity as it was before the change: the rollback source and an inventory record (Lab 1, step 1) | CM-8, System Component Inventory; CM-2, Baseline Configuration | KSI-PIY-GIV, KSI-SVC-ACM | The identity platform team, in the pack |
| No token can be sent to a host outside the agency's control, and the kept URIs still work (Lab 1, steps 3 to 6; Lab 2, steps 2 to 4) | SC-7, Boundary Protection; CM-3(2) | KSI-CNA-MAT, KSI-CMT-VTD | The technical owner tests; the pack holds the CSVs |
| Only assigned groups and clients can get a token (Lab 1, steps 7 and 8; Lab 2, step 5) | AC-2, Account Management; AC-6, Least Privilege | KSI-IAM-AAM, KSI-IAM-ELP | The business owner approves the list |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them. The kit's records support these controls; the agency's assessor decides them *(design guidance)*.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A redirect URI on a lapsed domain or dangling CNAME | Someone else receives authorization codes | AM-RU-03 to -05; the plan refuses to keep it; the rollback never restores it |
| A look-alike domain | `contoso.example.attacker` counted as owned | The host must be the domain or end with "." and it |
| Assignment required before anyone is assigned | Every user and client refused | AM-AS-01; assignments come first in the plan |
| User consent grants when assignment goes on | Users lose access they consented to | AM-AS-02: admin consent first |
| A plan edited after approval | An unreviewed change | The apply checks the SHA-256 |
| Testing WP5 as a Global Administrator | The test passes falsely | Test with the affected identity |

## Checklist

- [ ] The before snapshot is in the pack before any change.
- [ ] Every kept redirect URI is `https` (or loopback on a development registration) on an owned domain, and resolves.
- [ ] The domain owner reviewed every AM-RU-05 finding.
- [ ] The regression CSV shows every expected result, and the owner completed a real sign-in.
- [ ] Groups and client applications were assigned before assignment was required.
- [ ] Each plan's SHA-256 is in the change record, and the apply log matches it.
- [ ] The rollback was rehearsed in the test tenant.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 05 — The Front End, Its Accessibility Check and the Containers](05-the-front-end-its-accessibility-check-and-the-containers.md) · [Workbook index](index.md) · [Next: Chapter 07 — The Post-Change Test and the Evidence Pack →](07-the-post-change-test-and-the-evidence-pack.md)
:::

[^am06-best]: Microsoft Learn, "Security best practices for application properties in Microsoft Entra ID," section "Redirect URIs," <https://learn.microsoft.com/entra/identity-platform/security-best-practices-for-app-registration> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am06-reply]: Microsoft Learn, "Redirect URI (reply URL) outline and restrictions," <https://learn.microsoft.com/entra/identity-platform/reply-url> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am06-dangling]: Microsoft Learn, "Prevent dangling DNS entries and avoid subdomain takeover," <https://learn.microsoft.com/azure/security/fundamentals/subdomain-takeover> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am06-props]: Microsoft Learn, "Properties of an enterprise application," section "Assignment required," <https://learn.microsoft.com/entra/identity/enterprise-apps/application-properties> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am06-assign]: Microsoft Learn, "Restrict a Microsoft Entra app to a set of users," <https://learn.microsoft.com/entra/identity-platform/howto-restrict-your-app-to-a-set-of-users> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am06-50105]: Microsoft Learn, "Error AADSTS50105 — The signed-in user isn't assigned to a role for the application," <https://learn.microsoft.com/troubleshoot/entra/entra-id/app-integration/error-code-aadsts50105-user-not-assigned-role> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am06-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am06-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am06-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
