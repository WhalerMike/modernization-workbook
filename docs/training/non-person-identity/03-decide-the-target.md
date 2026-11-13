---
title: "Module 3: Decide each identity's target"
description: "Gate G2 and workbook Chapter 03: turn Book 02's migration path matrix into a proposed target for every identity, check each owner's disposition against it, put HIGH-risk accounts in the first wave with a rollback, and scope Workload ID Premium. About 55 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04"
series-order: 3
review-status: approved
reviewed-sha256: 07acf30a6ccae832d850bd460accbacd4c3e471a33ba105076c1c575d96c3bbb
last-reviewed: 2026-11-09
---
# Module 3: Decide each identity's target {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). Gate G2 Decision. Workbook [Chapter 03](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md). About 55 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_NPI_Module_3.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_3_Narrated) (about 13 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_3_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-3/Training_NPI_Module_3_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-3/Training_NPI_Module_3_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_03_Migration_Path_Matrix_Narrated).

## Introduction (3 minutes)

Each identity ends in one of five places: retire it, move it to a gMSA or dMSA, or move it to a managed identity, a federated credential or a certificate. Book 02's matrix decides by account type and by where the workload runs. Its rule: no stored secrets.

Three things are easy to blur, and the code keeps them apart. The matrix *proposes* a target. The application owner *decides* the disposition. The ISSO checks the *gate*. In this module you run all three on the fixtures and read why Gate 2 isn't met yet.

**The federal requirement.** Gate G2 supports NIST SP 800-53 AC-2 and IA-5. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Validate (G2 Decision)](../../books/guides/non-person-identity-implementation.md#step-2-decide-each-identitys-target) step names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| AC-2 Account Management; IA-5 Authenticator Management | KSI-IAM-SNU | `proposals.json`; `config/migration-matrix.json`; `decisions.json` |
| AC-6(5) Privileged Accounts (HIGH-risk first) | KSI-IAM-SNU, KSI-IAM-JIT | `findings.json`, NPI-MAT-01 to -09 |
| CM-3 Configuration Change Control (waves and rollback) | KSI-CMT-RVP | `waves.json` |
| AC-3 Access Enforcement (D-NP4 scope) | KSI-IAM-ELP, KSI-IAM-JIT | `workload-id-premium.json` |
| CA-7 Continuous Monitoring (gate status) | KSI-MLA-EVC | `gate2.json` |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*.

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain the difference between the matrix's proposal, the owner's disposition and Gate 2;
- name the target the matrix proposes for each account type and workload location;
- run the matrix on the fixtures and explain each finding;
- read a wave's rollback, and which identities Conditional Access for workload identities can cover now and after conversion.

## Prerequisites (1 minute)

- [Module 1](01-inventory.md) and [Module 2](02-owners-and-the-orphan-rule.md): the matrix reads both runs.
- [Book 02, Chapter 09: the migration path matrix](../../books/b02-identity/09-building-the-entra-target.md#the-migration-path-matrix).

## Unit 1: The decision in the guide (7 minutes)

Read the guide's [Step 2](../../books/guides/non-person-identity-implementation.md#step-2-decide-each-identitys-target): the condensed decision table, the order of work (high-risk accounts first), and the gMSA prerequisite, a KDS root key.

## Unit 2: The matrix as code (12 minutes)

Read the workbook chapter in this order:

- [The decisions the code holds](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#the-decisions-the-code-holds): proposal, disposition and gate, Learn's order of preference, and the Workload ID Premium decision D-NP4.
- [The proposal (NP2.1)](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#the-proposal-np2.1): matrix rows M01 to M19.
- [The disposition (D-NP3) and the waves (NP2.2)](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#the-disposition-d-np3-and-the-waves-np2.2): NPI-MAT-01 to -09, and how each wave's rollback is built.
- [Gate 2](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#gate-2): met only with no open Finding.

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This is the workbook's [Chapter 03, Lab 1](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/non-person-identity`, in PowerShell 7. The estate is fictional.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Evaluate Learn's tables as published
Invoke-Pester -Path tests/NpiMatrix.Tests.ps1 -FullNameFilter '*Chapter 03*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 2: List what the task needs
Import-Module ./powershell/NpiMatrix/NpiMatrix.psm1
$p = Get-NpiMatrixRequiredPermission; $p.GraphPermissions -join ', '; $p.Methods -join ', '

# Step 3: Run Chapters 01 and 02, then the matrix
./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory | Out-Null
./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -InputPath tests/fixtures/inputs -OutputPath out/ownership | Out-Null
./Invoke-NpiMatrix.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership -InputPath tests/fixtures/ch03/inputs -FixturePath tests/fixtures/estate.json -SkuFixturePath tests/fixtures/ch03/subscribed-skus.json -OutputPath out/matrix

# Step 4: Read the proposals
Get-Content out/matrix/proposals.json -Raw | ConvertFrom-Json | Where-Object Scope -eq 'Matrix' | Format-Table Name, Risk, Location, MatrixRow, Proposed

# Step 5: Read the findings
Get-Content out/matrix/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object

# Step 6: Read the waves and their rollback
Get-Content out/matrix/waves.json -Raw | ConvertFrom-Json | ForEach-Object { "Wave $($_.Wave): $(@($_.Members.Name) -join ', '); rollback owner '$($_.RollbackOwner)'"; $_.Rollback | ForEach-Object { "  $_" } }

# Step 7: Read the Workload ID Premium scope
$s = Get-Content out/matrix/workload-id-premium.json -Raw | ConvertFrom-Json
$s.conditionalAccessEligibleNow.Count; $s.conditionalAccessEligibleAfter.Count; $s.options | ConvertTo-Json -Compress

# Step 8: Run the tests
Invoke-Pester -Path tests

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Evaluate Learn's tables as published:**

    ```powershell
    Invoke-Pester -Path tests/NpiMatrix.Tests.ps1 -FullNameFilter '*Chapter 03*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 12`, `FailedCount 0`, `NotRunCount 31`. The 31 not run are the example's own tests.

2. **List what the task needs:**

    ```powershell
    Import-Module ./powershell/NpiMatrix/NpiMatrix.psm1
    $p = Get-NpiMatrixRequiredPermission; $p.GraphPermissions -join ', '; $p.Methods -join ', '
    ```

    ```text
    LicenseAssignment.Read.All, User.Read.All
    GET
    ```

3. **Run Chapters 01 and 02, then the matrix:**

    ```powershell
    ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory | Out-Null
    ./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -InputPath tests/fixtures/inputs -OutputPath out/ownership | Out-Null
    ./Invoke-NpiMatrix.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership -InputPath tests/fixtures/ch03/inputs -FixturePath tests/fixtures/estate.json -SkuFixturePath tests/fixtures/ch03/subscribed-skus.json -OutputPath out/matrix
    ```

    ```text
    Matrix: 21 identities in scope, 20 proposed (1 AppRegistrationFederated, 2 dMSA, 2 gMSA, 7 Keep, 2 ManagedIdentity, 6 Retire); 3 handed off, 1 to confirm first, 10 out of scope
    Dispositions: 18 decided of 22; waves 1 (1, 1 HIGH), 2 (4, 1 HIGH)
    Workload ID Premium (D-NP4): Tier1, 2 in scope; tenant holds 2 enabled units
    Findings: 7 Finding, 4 Warn, 1 Info
    ```

    A last line reports `Gate 2: not met`, with the open findings for each of its five criteria.

4. **Read the proposals:**

    ```powershell
    Get-Content out/matrix/proposals.json -Raw | ConvertFrom-Json | Where-Object Scope -eq 'Matrix' | Format-Table Name, Risk, Location, MatrixRow, Proposed
    ```

    Expect six Retire: Module 2's orphans and the disabled accounts. `svc-hrsync` and `svc-webfront` go to a dMSA (M06). Payroll Export and Deploy Bot go to a managed identity (M14), and Mail Automation to a federated credential (M15). HR Connector has no proposal: nobody recorded where it runs.

5. **Read the findings:**

    ```powershell
    Get-Content out/matrix/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object
    ```

    Expect twelve rows. `svc-hrsync` is HIGH-risk but in wave 2 (NPI-MAT-07). `svc-webfront` is kept on Kerberos with no SPN owner (NPI-MAT-06). `dmsa-hrsync$` has no end date before G5 (NPI-MAT-05). Vendor Portal is multitenant, so Conditional Access can't cover it (NPI-MAT-09).

6. **Read the waves and their rollback:**

    ```powershell
    Get-Content out/matrix/waves.json -Raw | ConvertFrom-Json | ForEach-Object { "Wave $($_.Wave): $(@($_.Members.Name) -join ', '); rollback owner '$($_.RollbackOwner)'"; $_.Rollback | ForEach-Object { "  $_" } }
    ```

    ```text
    Wave 1: Mail Automation; rollback owner 'carol@contoso.example'
      AppRegistrationFederated: Re-enable the legacy account or credential; revert the application's configuration; remove the federated credential
    Wave 2: svc-hrsync, svc-intranet, msa-print01$, Payroll Export; rollback owner ''
      dMSA: Undo-ADServiceAccountMigration (Learn's undo for a dMSA migration); the superseded account is kept, never deleted
      gMSA: Re-enable the legacy account; set the service back to it
      ManagedIdentity: Re-enable the legacy account; revert the application's configuration to it
    ```

    Wave 2 holds `svc-intranet`, which its owner re-platforms to the gMSA the matrix proposes. It has no rollback owner. That is NPI-MAT-08.

7. **Read the Workload ID Premium scope:**

    ```powershell
    $s = Get-Content out/matrix/workload-id-premium.json -Raw | ConvertFrom-Json
    $s.conditionalAccessEligibleNow.Count; $s.conditionalAccessEligibleAfter.Count; $s.options | ConvertTo-Json -Compress
    ```

    ```text
    6
    4
    {"Tier1":2,"Wide":4,"None":0}
    ```

    Six single-tenant app registrations can be covered today, and four after conversion.

8. **Run the tests:**

    ```powershell
    Invoke-Pester -Path tests
    ```

    Expect 511 tests passed, 0 failed.

Delete `out` when you're done. It names accounts and owners:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 03, Lab 2](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#lab-2-test-tenant). It has the exact commands.

- **You need:** a test tenant in the worldwide or GCC cloud, never production, with fictional people, and the Lab 2 runs of Modules 1 and 2 (`out/inventory-test`, `out/ownership-test`). The run only reads.
- **What you do:** grant `User.Read.All` and `LicenseAssignment.Read.All` to Module 1's reader app, write the owners' inputs for the test accounts, run the matrix, record what the license read shows, and check in the admin center which principals Conditional Access can target.
- **Back-out:** step 6 removes the two permissions and deletes `out/matrix-test`.

## Knowledge check (5 minutes)

1. Who decides an identity's disposition?
    a. The matrix
    b. The application owner, account by account (D-NP3)
    c. The ISSO
    d. The validation kit
2. An owner wants to move a gMSA to a dMSA. What does the code report?
    a. Nothing: it's allowed
    b. A Finding (NPI-MAT-03): an MSA or gMSA can't be migrated to a dMSA
    c. An Info only
    d. A retirement proposal
3. A HIGH-risk account is scheduled for re-platforming in wave 2. What happens?
    a. NPI-MAT-07 raises a Finding: HIGH-risk accounts go in wave 1
    b. Nothing, as long as wave 2 has a rollback
    c. The code moves it to wave 1 and sends nothing else
    d. It's retired
4. Why can't Conditional Access for workload identities cover Payroll Export after conversion?
    a. It will be deleted
    b. Its owner's decision moves it to a managed identity, and managed identities aren't covered
    c. It's multitenant
    d. It has no license
5. When is Gate 2 met?
    a. When every identity has a proposal
    b. When the waves are written
    c. Only when no finding of severity Finding is open
    d. When the CISO signs D-NP4

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** The matrix proposes; the owner decides. Taught in [The decisions the code holds](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#the-decisions-the-code-holds).
2. **b.** Taught in [The disposition (D-NP3) and the waves (NP2.2)](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#the-disposition-d-np3-and-the-waves-np2.2) and the guide's [Step 2](../../books/guides/non-person-identity-implementation.md#step-2-decide-each-identitys-target).
3. **a.** Taught in [The disposition (D-NP3) and the waves (NP2.2)](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#the-disposition-d-np3-and-the-waves-np2.2).
4. **b.** Taught in [The decisions the code holds](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#the-decisions-the-code-holds) and shown in Lab 1, step 5.
5. **c.** Taught in [Gate 2](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#gate-2).
:::

## Summary (2 minutes)

You proposed a target for 20 identities, checked the owners' dispositions, read two waves and their rollback, and scoped Workload ID Premium. Gate 2 isn't met on the fixtures, and you can say why.

**The evidence an ISSO keeps** for G2 from this module: `proposals.json`, `decisions.json`, `waves.json`, `workload-id-premium.json`, `findings.json`, `gate2.json` and the `manifest.json` that hashes them and the inputs, dated. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/non-person-identity/03-the-migration-path-matrix-as-code.md#checklist).

**Next:** [Module 4: Set the credential rules](04-credential-rules.md).
