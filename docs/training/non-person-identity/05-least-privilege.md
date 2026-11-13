---
title: "Module 5: Cut the privilege of service principals"
description: "Gate G4 and workbook Chapter 07: sweep every service principal's application permissions, delegated grants, directory roles and managed identities' Azure roles, flag broad grants without a current exception, hand privileged service principals to the Privileged Access plan, build the quarterly owner review, and apply only the owners' decisions through a plan whose SHA-256 a reviewer approved. About 60 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04"
series-order: 5
review-status: approved
reviewed-sha256: 050492ce82a01e923235556b6798397e37319aa627ad70e4ff45c29a0352b191
last-reviewed: 2026-11-08
---
# Module 5: Cut the privilege of service principals {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). Gate G4 Least privilege. Workbook [Chapter 07](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md). About 60 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_NPI_Module_5.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_5_Narrated) (about 15 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_5_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-5/Training_NPI_Module_5_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-5/Training_NPI_Module_5_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_07_Least_Privilege_Narrated).

## Introduction (3 minutes)

A workload can use its access faster and more widely than any person. An application permission gives an app everything its scope allows, across the tenant. A permission like `Directory.ReadWrite.All` granted "to make it work" stays until someone takes it away.

In this module you sweep every service principal for what it holds, flag the broad grants that have no current exception, and hand the privileged ones to the Privileged Access plan. Then you turn the owners' decisions into a plan. Nothing is removed until a second person approves the plan's SHA-256, and the code removes a grant, never an app.

**The federal requirement.** Gate G4 supports NIST SP 800-53 AC-6, AC-6(5) and IA-9. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Validate (G4 Least privilege)](../../books/guides/non-person-identity-implementation.md#step-4-cut-privilege) step names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| AC-6 Least Privilege | KSI-IAM-ELP, KSI-IAM-JIT | `sweep.json`, `identities.json`, `skipped.json`; `findings.json`, NPI-LP-01 to -07 and -09 |
| AC-6(5) Privileged Accounts | KSI-IAM-SNU, KSI-IAM-JIT | `pa-handoff.json`; NPI-LP-08 |
| AC-6(7) Review of User Privileges | KSI-IAM-AAM, KSI-IAM-JIT | `owner-review.csv`, `review-status.json` |
| CM-3 Configuration Change Control; CM-5 Access Restrictions for Change | KSI-CMT-LMC, KSI-CMT-RVP | `lp-plan.json` and its SHA-256; `results.json` and `manifest.json` from the dry run and the apply |
| AC-5 Separation of Duties | KSI-IAM-JIT | The plan's SHA-256, approved by a second person |
| AU-9 and SI-7, the run's integrity | KSI-MLA-OSM (AU-9); KSI-SVC-VRI (SI-7) | `manifest.json` in each output folder |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain the difference between an application permission and a delegated grant, and why the type matters more than the name;
- name what makes a grant broad, and what a recorded exception must hold;
- say which service principals go to the Privileged Access plan, and why this chapter doesn't sweep them;
- run the sweep, read the owner review and the plan, and show the write path refusing a plan nobody approved.

## Prerequisites (1 minute)

- [Module 1](01-inventory.md): the sweep reads Chapter 01's register and checks it against its manifest.
- [Module 2](02-owners-and-the-orphan-rule.md): the owner review sends each row to the owners Module 2 checks.
- [Microsoft Automation, Module 1: permissions](../ms-automation-foundations.md#permissions).

## Unit 1: What the gate asks for (8 minutes)

Read the guide's [Step 4](../../books/guides/non-person-identity-implementation.md#step-4-cut-privilege), sub-steps 4a to 4c: Graph permissions by type, [directory roles](../../books/guides/non-person-identity-implementation.md#directory-roles) and Azure RBAC. Sub-steps 4d and 4e are Module 6's. Then read the guide's [Dangers](../../books/guides/non-person-identity-implementation.md#dangers) rows on privileged service principals and on "disabled" not being revoked.

## Unit 2: The sweep and the rule (10 minutes)

Read the workbook chapter in this order:

- [The rule the code holds](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-rule-the-code-holds): owners review every grant, no broad permission without a justification, Learn's narrower replacement, managed identities' roles at the resource, and "remove the grant, never the app".
- [The sweep](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-sweep) and [The check](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-check): NPI-LP-01 to -09, and the four escalation permissions that hand a service principal off whole.
- [The quarterly owner review](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-quarterly-owner-review): only decisions dated this quarter count.

## Unit 3: The plan and the write path (6 minutes)

- [The plan](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-plan): one action per broad grant and per decided change. Only `RemoveAppRole` and `NarrowGrant` write.
- [The separate write path](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-separate-write-path): the approved hash, seven days, a re-read before each write, and a person with Privileged Role Administrator, never an unattended app.

## Exercise: Lab 1, fixtures, no tenant (22 minutes)

This is the workbook's [Chapter 07, Lab 1](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/non-person-identity`, in PowerShell 7. The estate is fictional. First make Chapter 01's register; it prints the three lines of Module 1's step 3:

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory

# Step 1: Run Learn's script against the stand-ins
Invoke-Pester -Path tests/NpiLeastPrivilegeSamples.Tests.ps1 -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 2: List what each task needs
Import-Module ./powershell/NpiLeastPrivilege/NpiLeastPrivilege.psm1
foreach ($t in 'least-privilege', 'least-privilege-apply') { $p = Get-NpiLpRequiredPermission -Task $t; "$t : " + (@($p.GraphPermissions) + @($p.AzureRoles) -join ', ') }

# Step 3: Sweep, check, and build the review and the plan
./Invoke-NpiLeastPrivilege.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/ch07/estate-ch07.json -InputPath tests/fixtures/ch07/inputs -OutputPath out/least-privilege

# Step 4: Read the findings and the hand-off
Get-Content out/least-privilege/findings.json -Raw | ConvertFrom-Json | Group-Object Rule | Format-Table Name, Count
Get-Content out/least-privilege/pa-handoff.json -Raw | ConvertFrom-Json | Format-Table Name, Reasons -Wrap

# Step 5: Read the open rows of the owner review
Import-Csv out/least-privilege/owner-review.csv | Where-Object { -not $_.Decision } | Format-Table Name, Kind, Permission, Broad, LastDecision -AutoSize

# Step 6: Read the plan
Get-Content out/least-privilege/lp-plan.json -Raw | ConvertFrom-Json | Select-Object -ExpandProperty actions | Format-Table Action, Name, Write

# Step 7: Dry-run the plan with its approved hash
$sha = (Get-FileHash out/least-privilege/lp-plan.json -Algorithm SHA256).Hash.ToLower()
./Invoke-NpiLeastPrivilegeAction.ps1 -Cloud gcc -PlanPath out/least-privilege/lp-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch07/estate-ch07.json -OutputPath out/lp-dryrun

# Step 8: Apply it to the fake, then try a hash nobody approved
./Invoke-NpiLeastPrivilegeAction.ps1 -Cloud gcc -PlanPath out/least-privilege/lp-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch07/estate-ch07.json -OutputPath out/lp-apply -Apply
./Invoke-NpiLeastPrivilegeAction.ps1 -Cloud gcc -PlanPath out/least-privilege/lp-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/ch07/estate-ch07.json -OutputPath out/lp-x

# Step 9: Run the tests
Invoke-Pester -Path tests

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

```powershell
./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory
```

1. **Run Learn's script against the stand-ins:**

    ```powershell
    Invoke-Pester -Path tests/NpiLeastPrivilegeSamples.Tests.ps1 -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 10`, `FailedCount 0`, `NotRunCount 0`.

2. **List what each task needs:**

    ```powershell
    Import-Module ./powershell/NpiLeastPrivilege/NpiLeastPrivilege.psm1
    foreach ($t in 'least-privilege', 'least-privilege-apply') { $p = Get-NpiLpRequiredPermission -Task $t; "$t : " + (@($p.GraphPermissions) + @($p.AzureRoles) -join ', ') }
    ```

    ```text
    least-privilege : Application.Read.All, Directory.Read.All, RoleManagement.Read.Directory, Reader
    least-privilege-apply : Application.Read.All, AppRoleAssignment.ReadWrite.All, DelegatedPermissionGrant.ReadWrite.All, Directory.Read.All
    ```

    The sweep only reads. The write task is separate.

3. **Sweep, check, and build the review and the plan:**

    ```powershell
    ./Invoke-NpiLeastPrivilege.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/ch07/estate-ch07.json -InputPath tests/fixtures/ch07/inputs -OutputPath out/least-privilege
    ```

    ```text
    Sweep: 11 service principals, 20 grants (12 Application, 5 AzureRole, 3 Delegated); 2 skipped; 3 handed to the Privileged Access plan
    Findings: 7 Finding, 3 Warn, 3 Info
    Owner review 2026-Q4: 15 rows, 9 decided, 6 open, 4 changes pending; closed: False
    Plan: 11 actions, 3 of them writes (1 NarrowGrant, 2 RemoveAppRole); nothing sent
    Plan SHA-256: fca44f9f423c5c3590bf1b90b36e13a8cc9c4565dc0fdb30c9d6ef4ce1a1a0f8
    ```

    The two skipped are the agent identity and its blueprint, which are Module 9's.

4. **Read the findings and the hand-off:**

    ```powershell
    Get-Content out/least-privilege/findings.json -Raw | ConvertFrom-Json | Group-Object Rule | Format-Table Name, Count
    Get-Content out/least-privilege/pa-handoff.json -Raw | ConvertFrom-Json | Format-Table Name, Reasons -Wrap
    ```

    Expect NPI-LP-01 twice, -02, -03, -04, -05 once each, -06 twice, -07 once, -08 three times and -09 once. The hand-off lists Build Pipeline, Deploy Bot and id-deploy.

5. **Read the open rows of the owner review:**

    ```powershell
    Import-Csv out/least-privilege/owner-review.csv | Where-Object { -not $_.Decision } | Format-Table Name, Kind, Permission, Broad, LastDecision -AutoSize
    ```

    Expect six open rows. vm-batch01's `User.Read.All` shows `Keep on 2026-07-15, an earlier quarter`, so it's open again.

6. **Read the plan:**

    ```powershell
    Get-Content out/least-privilege/lp-plan.json -Raw | ConvertFrom-Json | Select-Object -ExpandProperty actions | Format-Table Action, Name, Write
    ```

    Expect eleven actions. Three write: `RemoveAppRole` for HR Connector and for Mail Automation, and `NarrowGrant` for Partner CRM.

7. **Dry-run the plan with its approved hash:**

    ```powershell
    $sha = (Get-FileHash out/least-privilege/lp-plan.json -Algorithm SHA256).Hash.ToLower()
    ./Invoke-NpiLeastPrivilegeAction.ps1 -Cloud gcc -PlanPath out/least-privilege/lp-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch07/estate-ch07.json -OutputPath out/lp-dryrun
    ```

    Expect `DryRun: 3 WouldSend`: two `DELETE` requests through `5b000000-0000-4000-8000-000000000010`, Microsoft Graph's service principal, and one `PATCH` of `oauth2PermissionGrants/og-01`.

8. **Apply it to the fake, then try a hash nobody approved:**

    ```powershell
    ./Invoke-NpiLeastPrivilegeAction.ps1 -Cloud gcc -PlanPath out/least-privilege/lp-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch07/estate-ch07.json -OutputPath out/lp-apply -Apply
    ./Invoke-NpiLeastPrivilegeAction.ps1 -Cloud gcc -PlanPath out/least-privilege/lp-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/ch07/estate-ch07.json -OutputPath out/lp-x
    ```

    Expect `Apply: 3 Sent`, then the refusal: `The plan's SHA-256 is fca44f9f…, not the approved 0000…; refusing to run a plan nobody reviewed.`

9. **Run the tests:**

    ```powershell
    Invoke-Pester -Path tests
    ```

    Expect 511 tests passed, 0 failed.

Delete `out` when you're done. The review names owners:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 07, Lab 2](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#lab-2-test-tenant). It has the exact commands.

- **You need:** a test tenant in the worldwide or GCC cloud and a test subscription, never production; a test app registration and a test user-assigned managed identity; a reader app with `Application.Read.All`, `Directory.Read.All`, `RoleManagement.Read.Directory` and Reader; and a person with Privileged Role Administrator for the write.
- **What you do:** grant the test app `Directory.ReadWrite.All`, sweep it, record the owner's `Remove` decision, have a second person approve the plan's SHA-256, dry-run and apply it, and confirm on the next sweep and in the audit log that the grant is gone.
- **Back-out:** step 6 grants the removed permissions again with Learn's grant request, removes the test identity's role assignments, deletes the test identity and the test app registration, and deletes the `out` folders.

## Knowledge check (5 minutes)

1. Learn's review script would remove every delegated grant on an app. What does the example remove?
    a. The whole service principal
    b. Only the grants an owner decided to remove or narrow, through a plan whose SHA-256 a reviewer approved
    c. Every broad grant, without asking
    d. Nothing; it only reports
2. Deploy Bot holds `Application.ReadWrite.All` and a directory role. What does the sweep do with it?
    a. Raises NPI-LP-01 and plans a removal
    b. Hands it whole to the Privileged Access plan (NPI-LP-08), and leaves it out of the owner review
    c. Deletes the role assignment
    d. Skips it as an agent identity
3. HR Connector's `Sites.FullControl.All` is removed in the plan. Why is the removal safe to send?
    a. Its replacement, `Sites.Selected`, is already granted; a `Remove` that names a replacement waits until it is
    b. The exception is still current
    c. SharePoint ignores application permissions
    d. The app is deactivated first
4. Who sends the plan's writes in a live run?
    a. An unattended app holding `AppRoleAssignment.ReadWrite.All`
    b. A person, signed in with Privileged Role Administrator, in a delegated session
    c. The reader app from step 2
    d. Any application owner
5. vm-batch01's owner decided `Keep` on July 15. Why is its row open in the 2026-Q4 review?
    a. Only decisions dated this quarter count; earlier ones show as `LastDecision`
    b. `Keep` isn't a valid decision
    c. Managed identities can't be kept
    d. The register's hash changed

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Remove the grant, never the app, and only after review. Taught in [The rule the code holds](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-rule-the-code-holds) and the chapter's [Dangers](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#dangers).
2. **b.** A directory role or an escalation permission hands the identity to the Privileged Access plan (A3.4). Taught in [The check](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-check).
3. **a.** `AwaitReplacement` holds a removal until the replacement is granted, and the precheck checks it again. Taught in [The plan](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-plan) and [Lab 1](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#lab-1-fixtures-no-tenant), step 6.
4. **b.** The write permissions can grant authorization themselves, so the write path is a person's delegated session. Taught in [The separate write path](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-separate-write-path).
5. **a.** Taught in [The quarterly owner review](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#the-quarterly-owner-review).
:::

## Summary (2 minutes)

You swept 11 service principals and 20 grants, found the broad grants with no current exception, handed three privileged service principals to the Privileged Access plan, read the open rows of the quarter's owner review, and applied three approved changes to the fake. The write path refused a plan nobody reviewed.

**The evidence an ISSO keeps** for G4 from this module: `sweep.json`, `findings.json`, `pa-handoff.json`, `owner-review.csv`, `review-status.json`, `lp-plan.json` with its approved SHA-256, and the apply folder's `results.json` and `manifest.json`, dated. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/non-person-identity/07-least-privilege-for-service-principals.md#checklist).

**Next:** [Module 6: Conditional Access for workload identities](06-conditional-access.md).
