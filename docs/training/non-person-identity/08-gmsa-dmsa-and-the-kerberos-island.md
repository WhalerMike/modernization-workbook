---
title: "Module 8: Convert Kerberos accounts to gMSAs and dMSAs"
description: "Gate G5 and workbook Chapter 06: give every Kerberos account a reviewed disposition, plan its move to a gMSA or a Windows Server 2025 dMSA, list what stays on the Kerberos island with an SPN owner and an end date, reconcile every gMSA and dMSA with the end state, and run the plan only by its approved hash. About 60 minutes, with a lab on fixtures and a test domain lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04"
series-order: 8
review-status: approved
reviewed-sha256: e7185cd0fde5e4b86f9dd48f3ca8fb9bb7a5ede7d1e7de2a09d2ee0f58810fdf
last-reviewed: 2026-11-03
---
# Module 8: Convert Kerberos accounts to gMSAs and dMSAs {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). Gate G5 Conversion. Workbook [Chapter 06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md). About 60 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.4/Training_NPI_Module_8.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_8_Narrated) (about 16 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_8_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-8/Training_NPI_Module_8_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-8/Training_NPI_Module_8_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_06_gMSA_dMSA_Narrated).

## Introduction (3 minutes)

Some workloads can't leave Kerberos yet. A traditional service account with an SPN and a password that never expires is the riskiest of them. A gMSA gives the same workload a password that Windows changes for it. A dMSA, on a Windows Server 2025 domain, supersedes the old account and disables its password.

But a gMSA works only while Active Directory is authoritative. So converting isn't the end. Every gMSA and dMSA must either move to a workload identity, retire, or sit on a dated Kerberos island list with an SPN owner and an end date. In this module you plan all three, and you see the write path refuse a plan nobody approved.

**The federal requirement.** The Kerberos accounts are the on-premises part of Gate G5. The guide's [Validate (G5 Conversion)](../../books/guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run) step names IA-5, IA-9 and AU-2. The workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| IA-5 Authenticator Management; CM-3 Configuration Change Control | KSI-IAM-SNU; KSI-CMT-LMC | `kerberos-plan.json`, with the register's and each input's SHA-256 |
| AC-2 Account Management; IA-5 | KSI-IAM-SNU | `findings.json`, NPI-KRB-01 to -07 and -09 |
| AC-6 Least Privilege; CM-5 Access Restrictions for Change | KSI-IAM-ELP, KSI-IAM-JIT (AC-6); KSI-CMT-RVP (CM-5) | `Get-NpiKrbRequiredRight` for the read and write tasks; `password-retrievers.json` |
| CM-8 System Component Inventory; AC-2 | KSI-PIY-GIV; KSI-IAM-SNU | `island-list.csv`; `reconciliation.json` |
| CM-3; AC-2(3) Disable Accounts | KSI-CMT-LMC; KSI-IAM-AAM | `results.json` and `manifest.json` in the apply folder |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- name the four dispositions a Kerberos account can have, and what each one needs;
- explain why a dMSA can't be used for an MSA or an account with unconstrained delegation;
- read the plan, the island list and the reconciliation for a fictional domain;
- show that the write path runs only a plan whose SHA-256 was approved, and never deletes.

## Prerequisites (1 minute)

- [Module 1](01-inventory.md): the lab reads Chapter 01's register.
- [Module 3](03-decide-the-target.md): the matrix sends Kerberos-only accounts to a gMSA or a dMSA.

## Unit 1: The gate and the end date (8 minutes)

Read the guide's [Step 5](../../books/guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run): build the target, give it two owners, run old and new in parallel for 30 days, then disable, never delete. Then read:

- The guide's [Step 2](../../books/guides/non-person-identity-implementation.md#step-2-decide-each-identitys-target), its prerequisites for a gMSA: the KDS root key, and the wait of up to 10 hours.
- The guide's [Step 3](../../books/guides/non-person-identity-implementation.md#step-3-set-the-credential-rules), its step 7 on AD-side credentials.
- The guide's [Rollback](../../books/guides/non-person-identity-implementation.md#rollback) row for Step 5.

## Unit 2: The plan and the island (12 minutes)

Read the workbook chapter in this order:

- [The context the code depends on](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-context-the-code-depends-on): what a gMSA and a dMSA are, why the chapter has an end date built in, and the program's four rules *(design guidance)*.
- [The check and the plan](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-check-and-the-plan): NPI-KRB-01 to -09, and one action per account.
- [The island list and the reconciliation](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-island-list-and-the-reconciliation).
- [The separate write path](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-separate-write-path): why the read holds no domain administration and the write is a person's.

## Exercise: Lab 1, fixtures, no tenant (25 minutes)

This is the workbook's [Chapter 06, Lab 1](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#lab-1-fixtures-no-tenant), which explains each result. Its step 1 here makes Chapter 01's register, so the chapter's steps 1 to 9 are steps 2 to 10 below. Work in `examples/non-person-identity`, in PowerShell 7. The domain is fictional, and `-Apply` changes only a fake, in memory.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Make Chapter 01's register
./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory

# Step 2: Run Learn's procedures against the stand-ins
Invoke-Pester -Path tests/KerberosIslandSamples.Tests.ps1 -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 3: List what each task runs
Import-Module ./powershell/NpiKerberosIsland/NpiKerberosIsland.psm1
foreach ($t in 'kerberos-island', 'kerberos-apply') { $r = Get-NpiKrbRequiredRight -Task $t; "$t : " + ($r.Cmdlets -join ', ') }

# Step 4: Check the Kerberos accounts and build the plan
./Invoke-NpiKerberosIsland.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -InputPath tests/fixtures/ch06/inputs -OutputPath out/kerberos

# Step 5: Read the findings
Get-Content out/kerberos/findings.json -Raw | ConvertFrom-Json | Sort-Object Rule | Format-Table Rule, Severity, ObjectKey

# Step 6: Read the plan
Get-Content out/kerberos/kerberos-plan.json -Raw | ConvertFrom-Json | Select-Object -ExpandProperty actions | Format-Table Action, Account, Write, Cmdlet

# Step 7: Read the island list and the reconciliation
Import-Csv out/kerberos/island-list.csv | Format-Table Account, Type, SpnOwnerUpn, EndDate, ReadyForP46
Get-Content out/kerberos/reconciliation.json -Raw | ConvertFrom-Json | Format-Table Account, Type, Planned, Destination, Outcome

# Step 8: Dry-run the plan with its approved hash
$sha = (Get-FileHash out/kerberos/kerberos-plan.json -Algorithm SHA256).Hash.ToLower()
./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-dryrun

# Step 9: Apply it to the fake, then try a hash nobody approved
./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-apply -Apply
./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-x

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

    It prints three lines, ending `Written to out/inventory`.

2. **Run Learn's procedures against the stand-ins:**

    ```powershell
    Invoke-Pester -Path tests/KerberosIslandSamples.Tests.ps1 -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 17`, `FailedCount 0`, `NotRunCount 0`.

3. **List what each task runs:**

    ```powershell
    Import-Module ./powershell/NpiKerberosIsland/NpiKerberosIsland.psm1
    foreach ($t in 'kerberos-island', 'kerberos-apply') { $r = Get-NpiKrbRequiredRight -Task $t; "$t : " + ($r.Cmdlets -join ', ') }
    ```

    ```text
    kerberos-island : Get-ADComputer, Get-ADDomainController, Get-ADObject, Get-ADServiceAccount, Get-ADUser
    kerberos-apply : Complete-ADServiceAccountMigration, Disable-ADAccount, Get-ADComputer, Get-ADDomainController, Get-ADObject, Get-ADServiceAccount, Get-ADUser, New-ADServiceAccount, Set-ADServiceAccount, Start-ADServiceAccountMigration
    ```

    The read task runs only `Get-AD*` cmdlets. No cmdlet that removes or undoes is on either list.

4. **Check the Kerberos accounts and build the plan:**

    ```powershell
    ./Invoke-NpiKerberosIsland.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -InputPath tests/fixtures/ch06/inputs -OutputPath out/kerberos
    ```

    ```text
    Kerberos accounts: 9 in scope; KDS root key Ready
    Findings: 6 Finding, 1 Warn, 2 Info
    Plan: 9 actions, 4 of them writes (1 CompleteDmsaMigration, 2 CreateGmsa, 1 SetRetrievers); nothing sent
    Island list: 5 accounts, 3 ready for P4.6; hand-off ready: False
    Reconciliation (D11 KerberosIsland): 1 HandedOff, 1 MovesToWorkloadIdentity, 3 OnIslandList, 1 Unreconciled
    Plan SHA-256: 112f85a99407b2b256f7c520bf99245def7dcc8b2336726e4512e94b1624d94a
    ```

    The plan's hash is the same on every run with these inputs.

5. **Read the findings:**

    ```powershell
    Get-Content out/kerberos/findings.json -Raw | ConvertFrom-Json | Sort-Object Rule | Format-Table Rule, Severity, ObjectKey
    ```

    Expect nine rows. NPI-KRB-04 blocks `svc-webfront`'s dMSA, because the account is trusted for unconstrained delegation. NPI-KRB-05 and -06 flag `svc-intranet`: no SPN owner, and an end date after D08's. NPI-KRB-08 warns that `gmsa-ops$` is in Domain Admins.

6. **Read the plan:**

    ```powershell
    Get-Content out/kerberos/kerberos-plan.json -Raw | ConvertFrom-Json | Select-Object -ExpandProperty actions | Format-Table Action, Account, Write, Cmdlet
    ```

    Expect nine actions, four of them writes: `SetRetrievers` for `gmsa-web$`, `CreateGmsa` for `msa-print01$` and `svc-intranet`, and `CompleteDmsaMigration` for `svc-hrsync`, whose migration started 40 days ago. `svc-webfront` is `Blocked`.

7. **Read the island list and the reconciliation:**

    ```powershell
    Import-Csv out/kerberos/island-list.csv | Format-Table Account, Type, SpnOwnerUpn, EndDate, ReadyForP46
    Get-Content out/kerberos/reconciliation.json -Raw | ConvertFrom-Json | Format-Table Account, Type, Planned, Destination, Outcome
    ```

    Expect five island rows. `gmsa-intranet$` has no SPN owner and ends `2028-12-31`, so it isn't ready for P4.6, and its reconciliation outcome is `Unreconciled`.

8. **Dry-run the plan with its approved hash:**

    ```powershell
    $sha = (Get-FileHash out/kerberos/kerberos-plan.json -Algorithm SHA256).Hash.ToLower()
    ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-dryrun
    ```

    Expect `DryRun: 4 WouldSend`, one line for each write.

9. **Apply it to the fake, then try a hash nobody approved:**

    ```powershell
    ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-apply -Apply
    ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-x
    ```

    Expect `Apply: 4 Sent`. Then the refusal: `The plan's SHA-256 is 112f85a9…, not the approved 0000…; refusing to run a plan nobody reviewed.`

10. **Run the tests:**

    ```powershell
    Invoke-Pester -Path tests
    ```

    Expect 513 tests passed, 0 failed.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test domain (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 06, Lab 2](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#lab-2-test-domain). It has the exact commands.

- **You need:** a test Active Directory domain, never production, with at least one Windows Server 2025 domain controller, a Windows Server 2025 member server, an existing KDS root key, and Chapter 01's Lab 2 run.
- **What you do:** make a traditional test account and a test MSA, grant the read only `msKds-UseStartTime` and `msKds-CreateTime`, run the check, then apply the plan as a person with Domain Admins or equivalent rights, start the dMSA migration, and complete it after the 30-day parallel run.
- **Back-out:** step 6 runs Learn's `Undo-ADServiceAccountMigration` by hand (the code never runs it), re-enables the test account, removes the test objects by hand, and deletes the `out` folders.

## Knowledge check (5 minutes)

1. A Kerberos account stays on the island. What must it have?
    a. A client secret in Key Vault
    b. An SPN owner and an end date no later than D08's
    c. A Conditional Access policy
    d. Nothing, until G5
2. Why is `svc-webfront`'s dMSA blocked?
    a. It's a SQL Server account
    b. It's trusted for unconstrained delegation, which stops working once a dMSA migration completes
    c. Its domain has no KDS root key
    d. It already has a gMSA
3. What does the write path do to the old account when a dMSA migration completes?
    a. Deletes it
    b. Moves it to another domain
    c. Nothing: `Complete-ADServiceAccountMigration` disables it and moves its SPNs to the dMSA; no delete cmdlet exists in the code
    d. Resets its password
4. You pass a hash of zeros to `Invoke-NpiKerberosIslandAction.ps1`. What happens?
    a. It runs in dry-run mode
    b. It refuses, because the plan's SHA-256 isn't the approved one
    c. It applies the plan and logs a warning
    d. It asks for confirmation
5. Why does the read task hold no domain administration?
    a. It reads only the KDS root key's start and create times, with a delegated read, plus the default read
    b. Domain administration isn't available in GCC
    c. The read runs as a gMSA
    d. Learn forbids it

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** The program's rule for every account that stays on Kerberos. Taught in [The context the code depends on](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-context-the-code-depends-on).
2. **b.** NPI-KRB-04. Taught in [The check and the plan](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-check-and-the-plan) and the chapter's [Lab 1](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#lab-1-fixtures-no-tenant).
3. **c.** Never delete. Taught in [The check and the plan](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-check-and-the-plan) and the chapter's [Dangers](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#dangers).
4. **b.** Taught in [The separate write path](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-separate-write-path).
5. **a.** Taught in [The separate write path](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-separate-write-path).
:::

## Summary (2 minutes)

You checked nine Kerberos accounts in a fictional domain, read a plan with four writes, an island list and a reconciliation, applied the plan to a fake by its hash, and saw a plan nobody approved refused.

**The evidence an ISSO keeps** for G5 from this module: `kerberos-plan.json` with its approved SHA-256, `findings.json`, `island-list.csv`, `reconciliation.json`, and the apply folder's `results.json` and `manifest.json`, dated; and the test result. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#checklist).

**Next:** [Module 9: Govern AI agent identities](09-ai-agent-identities.md).
