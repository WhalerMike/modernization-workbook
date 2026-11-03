---
title: "Module 4: Set the credential rules"
description: "Gate G3 and workbook Chapter 04: hold the tenant's app management policy as reviewed JSON (no new secrets, certificates capped at 180 days, the app instance property lock), compare it with the tenant into a plan that never loosens a restriction, and plan certificate rotation through Key Vault with an owner's approval and an overlap. About 65 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 04, 17"
last-reviewed: 2026-11-02
series-order: 4
---

# Module 4: Set the credential rules {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). Gate G3 Credential rules. Workbook [Chapter 04](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md). About 65 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-npi-module-4) (the deck files come with the next edition) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_4_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_4_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-4/Training_NPI_Module_4_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-4/Training_NPI_Module_4_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_04_App_Policy_Rotation_Narrated).

## Introduction (3 minutes)

The program's credential rules are short: no long-lived secrets; managed identities first, then federated credentials, then certificates; every certificate in a vault and on a rotation calendar. The tenant can enforce part of that itself, with an application management policy that blocks new secrets and caps new certificates at 180 days.

The rest needs code. Key Vault can renew a certificate, but Entra ID renews nothing on the app registration. In this module you compare the policy with the tenant, and you plan a rotation from renewal to removal, each write approved by its hash.

**The federal requirement.** Gate G3 meets NIST SP 800-53 IA-5(2), SC-12 and SC-17, and CISA SCuBA MS.AAD.5.5v1 to 5.7v1. Those three SCuBA policies are SHOULD policies, not BOD 25-01 required configurations. The guide's [Validate (G3 Credential rules)](../../books/guides/non-person-identity-implementation.md#step-3-set-the-credential-rules) step names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| CM-6 Configuration Settings; SCuBA MS.AAD.5.5v1, 5.6v1 and 5.7v1 | KSI-SVC-ACM, KSI-MLA-EVC | `default-policy-before.json`, `policy-diff.json`; `config/app-management-policy.json` |
| IA-5 Authenticator Management | KSI-IAM-SNU | `policy-findings.json`, NPI-POL-01 to -06 |
| IA-5(2); SC-12; SC-17 | KSI-SVC-ASM, KSI-IAM-SNU | `rotation-plan.json`; `certificate-bindings.csv`; `rotation-findings.json`, NPI-ROT-01 to -07 |
| CM-3 Configuration Change Control; CM-5 Access Restrictions for Change | KSI-CMT-LMC, KSI-CMT-RVP; KSI-IAM-JIT | Each plan's approved SHA-256; `results.json` and `manifest.json` in each dry-run and apply folder |
| AC-6 Least Privilege | KSI-IAM-ELP, KSI-IAM-JIT | `Get-NpiCh04RequiredPermission` for each task |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*, and the SCuBA rows are mapped through CM-6.

## Learning objectives (1 minute)

After this module, you'll be able to:

- describe the tenant default policy and an app management policy, and how an exception overrides the default;
- explain why the policy plan never drops or loosens a restriction the tenant already holds;
- name the steps of a rotation, from the owner's approval to removing the old certificate;
- run both plans on the fixtures, dry-run them, and see the write path refuse a hash nobody approved.

## Prerequisites (1 minute)

- [Module 1](01-inventory.md): both plans read its register.
- [Module 3](03-decide-the-target.md): secrets aren't rotated, they're replaced by the target Module 3 decides.

## Unit 1: The rules in the guide (8 minutes)

Read the guide's [Step 3](../../books/guides/non-person-identity-implementation.md#step-3-set-the-credential-rules), all eight steps. Note three of them: the effective date that binds new registrations while old ones are fixed later; the two rotation numbers, 365 days for existing workloads and 180 days for new ones; and closing the loop between vault and directory, because a renewed certificate in Key Vault doesn't change the app registration.

## Unit 2: The policy and the rotation as code (15 minutes)

Read the workbook chapter in this order:

- [The rules the code holds](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#the-rules-the-code-holds): the two kinds of policy, the program's policy *(design guidance)*, the app instance property lock, licensing and rotation.
- [The policy: read, compare, plan](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#the-policy-read-compare-plan): `Add`, `Change`, `KeepStricter`, `KeepExisting`, and NPI-POL-01 to -06.
- [Rotation: the plan](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#rotation-the-plan): each step, and NPI-ROT-01 to -07.
- [The separate write path](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#the-separate-write-path): the bodies it allows, and the prechecks before each write.

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Chapter 04, Lab 1](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/non-person-identity`, in PowerShell 7. The tenant and its key vault are fictional. Step 1 makes Chapter 01's register; the chapter's step 1 is this module's step 2, and so on.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Make Chapter 01's register
./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory

# Step 2: Send Microsoft's samples to the fakes
Invoke-Pester -Path tests/NpiCredentialPolicy.Tests.ps1 -FullNameFilter '*Microsoft*samples*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 3: List what each task needs
Import-Module ./powershell/NpiCredentialPolicy/NpiCredentialPolicy.psm1
foreach ($t in 'app-policy', 'policy-apply', 'rotation', 'rotation-apply') { $p = Get-NpiCh04RequiredPermission -Task $t; "$t : " + (($p.GraphPermissions + $p.AzureRoles) -join ', ') }

# Step 4: Compare the policy and build its plan
./Invoke-NpiCredentialPolicy.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/policy

# Step 5: Read the diff
Get-Content out/policy/policy-diff.json -Raw | ConvertFrom-Json | Format-Table Scope, RestrictionType, Change, Desired

# Step 6: Dry-run the policy plan with its approved hash, apply it to the fake, then try a hash nobody approved
$sha = (Get-FileHash out/policy/policy-plan.json -Algorithm SHA256).Hash.ToLower()
./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/policy/policy-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/policy-dryrun
./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/policy/policy-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/policy-apply -Apply
./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/policy/policy-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/policy-x

# Step 7: Build the rotation plan
./Invoke-NpiRotation.ps1 -Cloud gcc -RegisterRun out/inventory -InputPath tests/fixtures/ch04/inputs -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/rotation

# Step 8: Read the plan
(Get-Content out/rotation/rotation-plan.json -Raw | ConvertFrom-Json).actions | Format-Table Action, Name, Write

# Step 9: Dry-run the rotation, then apply it to the fake
$sha = (Get-FileHash out/rotation/rotation-plan.json -Algorithm SHA256).Hash.ToLower()
./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/rotation/rotation-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/rotation-dryrun
./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/rotation/rotation-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/rotation-apply -Apply

# Step 10: Run the tests
Invoke-Pester -Path tests

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Make Chapter 01's register:**

    ```powershell
    ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory
    ```

    It prints the three lines of Module 1's step 3, ending `Written to out/inventory`.

2. **Send Microsoft's samples to the fakes:**

    ```powershell
    Invoke-Pester -Path tests/NpiCredentialPolicy.Tests.ps1 -FullNameFilter '*Microsoft*samples*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 19`, `FailedCount 0`, `NotRunCount 32`. The 32 not run are the code's own tests.

3. **List what each task needs:**

    ```powershell
    Import-Module ./powershell/NpiCredentialPolicy/NpiCredentialPolicy.psm1
    foreach ($t in 'app-policy', 'policy-apply', 'rotation', 'rotation-apply') { $p = Get-NpiCh04RequiredPermission -Task $t; "$t : " + (($p.GraphPermissions + $p.AzureRoles) -join ', ') }
    ```

    ```text
    app-policy : Application.Read.All, Policy.Read.All
    policy-apply : Application.Read.All, Application.ReadWrite.All, Policy.Read.All, Policy.ReadWrite.ApplicationConfiguration
    rotation : Application.Read.All, User.Read.All, Key Vault Reader
    rotation-apply : Application.Read.All, Application.ReadWrite.All, Key Vault Certificates Officer, Key Vault Reader
    ```

4. **Compare the policy and build its plan:**

    ```powershell
    ./Invoke-NpiCredentialPolicy.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/policy
    ```

    ```text
    Policy: tenant default disabled; 1 app management policies; 7 app registrations
    Diff: 6 Add, 1 Change, 1 KeepExisting
    Findings: 12 Finding, 1 Warn, 1 Info
    Policy plan: 10 actions, 8 of them writes (1 AssignAppPolicy, 1 CreateAppPolicy, 5 LockApp, 1 PatchDefaultPolicy); nothing sent
    Plan SHA-256: 2d4c419a05b7792470e59a5969f94f1b6452cba079a47595336c4d451cbfa809
    ```

5. **Read the diff:**

    ```powershell
    Get-Content out/policy/policy-diff.json -Raw | ConvertFrom-Json | Format-Table Scope, RestrictionType, Change, Desired
    ```

    Expect eight rows. `passwordAddition`, `symmetricKeyAddition` and `asymmetricKeyLifetime` (`P180D`) are added on both application and service principal objects, for apps created after 2026-11-15. The tenant's own `customPasswordAddition` is `KeepExisting`: it stays in the PATCH body.

6. **Dry-run the policy plan with its approved hash, apply it to the fake, then try a hash nobody approved:**

    ```powershell
    $sha = (Get-FileHash out/policy/policy-plan.json -Algorithm SHA256).Hash.ToLower()
    ./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/policy/policy-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/policy-dryrun
    ./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/policy/policy-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/policy-apply -Apply
    ./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/policy/policy-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/policy-x
    ```

    Expect `DryRun: 8 WouldSend` (one PATCH of the default policy, a policy create and its assignment, and five `LockApp` PATCHes), then `Apply: 8 Sent`, then the refusal: `The plan's SHA-256 is 2d4c419a…, not the approved 0000…; refusing to run a plan nobody reviewed.`

7. **Build the rotation plan:**

    ```powershell
    ./Invoke-NpiRotation.ps1 -Cloud gcc -RegisterRun out/inventory -InputPath tests/fixtures/ch04/inputs -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/rotation
    ```

    ```text
    Rotation: 7 app registrations read; 7 steps
    Findings: 2 Finding, 0 Warn, 3 Info; 0 requests for owners
    Rotation plan: 3 writes (1 AttachNewCertificate, 1 RemoveOldCertificate, 1 RenewInKeyVault); nothing sent
    Plan SHA-256: d54726465dddc6ccdf03d9df2137e77e31547e9aade890d11bd7053653fa0d8f
    ```

8. **Read the plan:**

    ```powershell
    (Get-Content out/rotation/rotation-plan.json -Raw | ConvertFrom-Json).actions | Format-Table Action, Name, Write
    ```

    ```text
    Action               Name            Write
    ------               ----            -----
    AttachNewCertificate Deploy Bot       True
    RemoveOldCertificate HR Connector     True
    ReplaceSecret        Legacy Reports  False
    NoKeyVaultBinding    Legacy Reports  False
    ReplaceSecret        Mail Automation False
    ReplaceSecret        Payroll Export  False
    RenewInKeyVault      Vendor Portal    True
    ```

    Vendor Portal's certificate is due within 60 days and an owner approved: renew it in Key Vault. HR Connector's new certificate was verified and the 7-day overlap has passed: remove the old one. Three apps still hold secrets: replace them, don't rotate them.

9. **Dry-run the rotation, then apply it to the fake:**

    ```powershell
    $sha = (Get-FileHash out/rotation/rotation-plan.json -Algorithm SHA256).Hash.ToLower()
    ./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/rotation/rotation-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/rotation-dryrun
    ./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/rotation/rotation-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch04/tenant.json -OutputPath out/rotation-apply -Apply
    ```

    ```text
    DryRun: 3 WouldSend
      WouldSend AttachNewCertificate PATCH https://graph.microsoft.com/v1.0/applications/0a000000-0000-4000-8000-000000000007
      WouldSend RemoveOldCertificate PATCH https://graph.microsoft.com/v1.0/applications/0a000000-0000-4000-8000-000000000002
      WouldSend RenewInKeyVault      POST  https://kv-npi-contoso.vault.azure.net/certificates/vendor-portal/create?api-version=2025-07-01
    ```

    Then `Apply: 3 Sent`. For Vendor Portal, Key Vault created the next version; the next plan attaches it after a new review.

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

*Not run by the authors.* Follow the workbook's [Chapter 04, Lab 2](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#lab-2-test-tenant). It has the exact commands.

- **You need:** a test tenant in the worldwide or GCC cloud and a test key vault using Azure RBAC, never production, with fictional people, and Module 1's Lab 2 run (`out/inventory-test`).
- **What you do:** apply the policy from a test copy of the reviewed file, then check that the tenant refuses a new client secret and a 12-month certificate; then raise, approve, renew, attach, verify and remove a rotation for one test app, signed in as a person with Cloud Application Administrator and Key Vault Certificates Officer on the test vault.
- **Back-out:** step 8 is a person's PATCH of the default policy back to `default-policy-before.json`, because this code never loosens a policy. It also removes the test exception's assignment, deletes the test policy, both test apps and the test certificate, and deletes the `out` folders.

## Knowledge check (5 minutes)

1. Does the default app management policy stop tokens for an existing app that already holds a secret?
    a. Yes, at once
    b. No: neither kind of policy blocks token issuance for an existing app; only a create or update that breaks the policy is refused
    c. Only after 180 days
    d. Only for multitenant apps
2. The tenant already holds a restriction the reviewed file doesn't name. What does the plan do?
    a. Drops it from the PATCH body
    b. Sets it to disabled
    c. Keeps it as the tenant has it (`KeepExisting`)
    d. Refuses to run
3. Key Vault renewed a certificate on its own. What's still missing?
    a. Nothing: Entra ID picks it up
    b. The new certificate has to be added to the app registration, with the owner's approval, and the old one removed after the overlap
    c. A new client secret
    d. A new app registration
4. What does the rotation plan do with a client secret?
    a. Rotates it every 180 days
    b. Moves it into Key Vault
    c. Reports it for replacement by a certificate or a federated credential (`ReplaceSecret`)
    d. Deletes it
5. Does this chapter need Workload ID Premium?
    a. Yes, for app management policies
    b. No: Learn lists app management policies in both the free edition and Premium
    c. Only in GCC
    d. Only for the lock

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [The rules the code holds](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#the-rules-the-code-holds).
2. **c.** The PATCH never drops or loosens a live restriction. Taught in [The policy: read, compare, plan](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#the-policy-read-compare-plan) and shown in Lab 1, step 5.
3. **b.** Taught in the guide's [Step 3](../../books/guides/non-person-identity-implementation.md#step-3-set-the-credential-rules) and [Rotation: the plan](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#rotation-the-plan).
4. **c.** Taught in [Rotation: the plan](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#rotation-the-plan).
5. **b.** Premium is what Module 6's Conditional Access needs. Taught in [The rules the code holds](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#the-rules-the-code-holds).
:::

## Summary (2 minutes)

You compared a fictional tenant's default policy with the reviewed file, applied a plan that adds the program's restrictions and locks five apps, and carried three certificates through renewal, attach and removal on the fakes.

**The evidence an ISSO keeps** for G3 from this module: `default-policy-before.json`, `policy-diff.json`, both plans with their approved SHA-256, the findings, and the dry-run and apply folders with their `manifest.json`, dated; and, from Lab 2, the tenant's refusals and the ScubaGear result for MS.AAD.5.5v1 to 5.7v1. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/non-person-identity/04-app-management-policies-and-certificate-rotation.md#checklist).

**Next:** [Module 5: Cut the privilege of service principals](05-least-privilege.md).
