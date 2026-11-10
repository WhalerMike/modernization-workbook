---
title: "Module 12: Migrate a service account, from a user account to a gMSA, a dMSA or Microsoft Entra"
description: "The companion guide Service Accounts, with the developer workbook's Chapters 05 and 06: compare the kinds of service identity, choose a target with the decision path, follow Microsoft Learn's steps for a user account to a gMSA, to a Windows Server 2025 dMSA and to a Microsoft Entra workload identity, and see the kit plan the same moves on fixtures, approved by hash, with a 30-day parallel run and never a delete. About 65 minutes, with a lab on fixtures and a test domain lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04"
series-order: 12
last-reviewed: 2026-11-09
---
# Module 12: Migrate a service account, from a user account to a gMSA, a dMSA or Microsoft Entra {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). The companion guide [*Service Accounts: From User Accounts to gMSAs to Microsoft Entra Workload Identities*](../../books/guides/service-account-migration.md), with workbook [Chapter 06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md) and [Chapter 05](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md). About 65 minutes.*

**Watch:** the guide's narrated deck, about 16 minutes, with captions: [▶ Watch](../../presentations/watch.html?v=Guide_Service_Account_Migration_Narrated) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Guide_Service_Account_Migration_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-service-account-migration/Guide_Service_Account_Migration_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/guide-service-account-migration/Guide_Service_Account_Migration_Narrated.vtt). The deck itself joins the next edition; until then it's built from its [folder](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/guide-service-account-migration).

## Introduction (3 minutes)

A service account's password is the one nobody changes, because changing it breaks something. Modules 7 and 8 taught the kit's plans for converting those accounts. This module takes one account at a time and walks it through each move by hand, with Microsoft Learn's own commands, so you know what the plans send before you approve one: a user account to a group managed service account (gMSA), the same account to a Windows Server 2025 delegated managed service account (dMSA), and an account to a Microsoft Entra workload identity once the workload moves or gains a cloud path. Then you watch the kit plan the same moves on fixtures.

Take it after Module 8, or on its own when you have one account to move. It adds no gate of its own: its moves are Gate G5's, and its rules are the track's.

**The federal requirement.** The guide's [Federal requirements and evidence](../../books/guides/service-account-migration.md#evidence) table has a row for every step; these are the rows this module practices:

| Step | Requirement it supports | KSI | Evidence the ISSO keeps |
|---|---|---|---|
| A3, B1 Create | AC-6 Least Privilege; IA-5 Authenticator Management; CM-3 Configuration Change Control | KSI-IAM-ELP; KSI-IAM-SNU; KSI-CMT-LMC | The approved plan and the apply run's manifest (Chapter 06); `Get-ADServiceAccount` output |
| A4 Install and test | AC-6 | KSI-IAM-ELP | `Test-ADServiceAccount` `True` per host; `password-retrievers.json` |
| A6, B3 Parallel run and complete | AC-2(3) Disable Accounts; IA-5 | KSI-IAM-AAM; KSI-IAM-SNU | `HostChangedOn` or `MigrationStartedOn`; the disable or complete in the apply manifest |
| C1 to C4 Cloud identity | IA-9 Service Identification and Authentication (tailored in); IA-5; AC-6 | None for IA-9; KSI-IAM-SNU; KSI-IAM-ELP | Chapter 05's plan and apply manifests; Graph grants and role assignments |
| Island | CM-8 System Component Inventory; AC-2 Account Management | KSI-PIY-GIV; KSI-IAM-SNU | Chapter 06's `island-list.csv` |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*, as the guide says.

## Learning objectives (1 minute)

After this module, you'll be able to:

- compare a user account used as a service with an sMSA, a gMSA, a dMSA, a managed identity, an app registration with a certificate and a federated credential: who holds the credential, where it runs and how exposed it is to Kerberoasting;
- choose a target for a workload with the guide's decision path, and name the Chapter 03 disposition it lines up with;
- follow Learn's steps to move a user account to a gMSA and to a dMSA, with the checks that come before the switch and the rollback after it;
- say what moves to Microsoft Entra ID, what can't, and why a hybrid workload keeps both;
- match each step to the kit's plan action, and show that the plan runs only by its approved hash and never deletes.

## Prerequisites (1 minute)

- [Module 3](03-decide-the-target.md): the dispositions the decision path lines up with.
- [Module 8](08-gmsa-dmsa-and-the-kerberos-island.md) is recommended: this module reruns part of its lab and explains the Learn steps behind it.

## Unit 1: The kinds of service identity, and the decision path (8 minutes)

Read in the guide:

- [The kinds of service identity compared](../../books/guides/service-account-migration.md#comparison): the table, then the three things it makes plain. Note who manages each credential, and which kinds speak Kerberos.
- [The decision path](../../books/guides/service-account-migration.md#decision-path): nine questions in order, the first "yes" is the target, each with its Chapter 03 disposition.
- [The program's rules for every migration](../../books/guides/service-account-migration.md#rules): two owners and a sponsor, a reviewed disposition first, a 30-day parallel run, no client secrets, no privileged groups, and reviewed changes.

## Unit 2: Migrations A and B, by hand (12 minutes)

Read in the guide:

- [Migration A: a user account to a gMSA](../../books/guides/service-account-migration.md#migration-a), steps A1 to A7 and its rollback. Watch for the order: one KDS root key for the forest and its 10-hour wait, then create, install and test on every host, then switch the workload and move the SPNs in one window.
- [Migration B: a user account to a dMSA](../../books/guides/service-account-migration.md#migration-b): Learn's limits first, then create, start, wait at least two ticket lifetimes and complete. The program's 30 days covers four.
- [Special cases Learn documents](../../books/guides/service-account-migration.md#special-cases): skim the table, and stop on failover clusters and Microsoft Entra Domain Services.

## Unit 3: Migration C, and what can't move (8 minutes)

Read in the guide:

- [Migration C: from AD to a Microsoft Entra workload identity](../../books/guides/service-account-migration.md#migration-c): Learn's order of preference for a credential, then the four targets (a user-assigned managed identity, an Arc-enabled server's identity, an app registration with a certificate, workload identity federation), the retirement, **What can't move** and the rollback.
- [Dangers and how to avoid them](../../books/guides/service-account-migration.md#dangers).
- The scripted versions: Chapter 06's [check and plan](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#the-check-and-the-plan) and [what Learn's samples leave to you](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#what-it-leaves-to-you); Chapter 05's [plan](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#the-plan).

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This lab reruns parts of the workbook's [Chapter 06, Lab 1](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#lab-1-fixtures-no-tenant) and [Chapter 05, Lab 1](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#lab-1-fixtures-no-tenant), which explain each result, to show where each of the guide's migrations sits in the kit. Work in `examples/non-person-identity`, in PowerShell 7. The domain and tenant are fictional, nothing signs in, and nothing is sent.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Make the runs Chapter 06 reads
./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory | Out-Null
./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -InputPath tests/fixtures/inputs -OutputPath out/ownership | Out-Null
./Invoke-NpiMatrix.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership -InputPath tests/fixtures/ch03/inputs -FixturePath tests/fixtures/estate.json -SkuFixturePath tests/fixtures/ch03/subscribed-skus.json -OutputPath out/matrix | Out-Null

# Step 2: See Learn's gMSA, dMSA and KDS steps run against the stand-ins
(Invoke-Pester -Path tests/KerberosIslandSamples.Tests.ps1 -Output None -PassThru).Tests | ForEach-Object { "$($_.Result)  $($_.Name)" }

# Step 3: Check the Kerberos accounts and build the plan
./Invoke-NpiKerberosIsland.ps1 -Cloud gcc -RegisterRun out/inventory -MatrixRun out/matrix -ProgramDatesPath tests/fixtures/ch03/inputs/program-dates.json -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -InputPath tests/fixtures/ch06/inputs -OutputPath out/kerberos

# Step 4: Read the two migrations the plan sends
(Get-Content out/kerberos/kerberos-plan.json -Raw | ConvertFrom-Json).actions | Where-Object Account -in 'svc-intranet', 'svc-hrsync' | Select-Object Action, Account, Cmdlet, Params | ConvertTo-Json -Depth 4

# Step 5: Dry-run the plan with its approved hash
$sha = (Get-FileHash out/kerberos/kerberos-plan.json -Algorithm SHA256).Hash.ToLower()
./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-dryrun

# Step 6: Build Chapter 05's conversion plan (Migration C)
./Invoke-NpiFederation.ps1 -Cloud gcc -ConversionsPath tests/fixtures/ch05/conversions.json -CutoverLogPath tests/fixtures/ch05/cutover-log.csv -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation

# Step 7: Read what each conversion replaces, and its parallel run
Get-Content out/federation/conversion-records.json -Raw | ConvertFrom-Json | ForEach-Object { [pscustomobject]@{ Id = $_.ConversionId; Legacy = $_.Legacy; Target = $_.TargetKind; Run = $_.ParallelRun.Status; Day = $_.ParallelRun.Day } } | Format-Table

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Make the runs Chapter 06 reads:**

    ```powershell
    ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory | Out-Null
    ./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -InputPath tests/fixtures/inputs -OutputPath out/ownership | Out-Null
    ./Invoke-NpiMatrix.ps1 -Cloud gcc -RegisterRun out/inventory -OwnershipRun out/ownership -InputPath tests/fixtures/ch03/inputs -FixturePath tests/fixtures/estate.json -SkuFixturePath tests/fixtures/ch03/subscribed-skus.json -OutputPath out/matrix | Out-Null
    ```

    It prints nothing. The three folders hold Chapter 01's register, Chapter 02's owners and Chapter 03's dispositions: no account moves without its disposition.

2. **See Learn's gMSA, dMSA and KDS steps run against the stand-ins:**

    ```powershell
    (Invoke-Pester -Path tests/KerberosIslandSamples.Tests.ps1 -Output None -PassThru).Tests | ForEach-Object { "$($_.Result)  $($_.Name)" }
    ```

    ```text
    Passed  creates a dMSA with New-ADServiceAccount -CreateDelegatedServiceAccount and AES256: the model for CreateDmsa
    Passed  runs with placeholder names, and names the account differently in each step
    Passed  grants password retrieval to one machine typed by hand
    Passed  sets msDS-DelegatedMSAState with -Properties, which Set-ADServiceAccount doesn't take: it fails as published
    Passed  starts the migration with Start-ADServiceAccountMigration and a distinguished name: the model for StartDmsaMigration
    Passed  restarts every running service on the host, not only the ones that run as the account
    Passed  writes the registry on the host: a host step, outside Active Directory
    Passed  completes with the same two parameters, with no waiting step between start and complete
    Passed  warns never to delete the original account, and offers Undo and Reset
    Passed  checks the KDS root key with Get-KdsRootKey, which returns the root key value itself
    Passed  offers Add-KdsRootKey backdated 10 hours, which the KDS page reserves for a test environment with one domain controller
    Passed  states the limits the plan enforces: no MSA or gMSA to dMSA, unconstrained delegation stops, every host must support dMSA
    Passed  creates a gMSA with its retrievers at creation: the model for CreateGmsa
    Passed  gives templates with angle-bracket placeholders that don't parse as PowerShell
    Passed  sets no Kerberos encryption type on the gMSA
    Passed  leaves installing and uninstalling the gMSA to a person on each host
    Passed  ends its move to a gMSA by deleting the old service account identity
    ```

    Seventeen tests, each a fact about one of Learn's published procedures. Match them to the guide: B1 skips Learn's `msDS-DelegatedMSAState` step because it fails as published; B2 restarts only the service that uses the account; A3 adds `AES256`, which Learn's gMSA sample leaves out; A4 is a person's step on each host; and A7 disables the old account where Learn's Entra page deletes it.

3. **Check the Kerberos accounts and build the plan:**

    ```powershell
    ./Invoke-NpiKerberosIsland.ps1 -Cloud gcc -RegisterRun out/inventory -MatrixRun out/matrix -ProgramDatesPath tests/fixtures/ch03/inputs/program-dates.json -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -InputPath tests/fixtures/ch06/inputs -OutputPath out/kerberos
    ```

    ```text
    Kerberos accounts: 9 in scope; KDS root key Ready
    Findings: 5 Finding, 1 Warn, 2 Info
    Plan: 9 actions, 4 of them writes (1 CompleteDmsaMigration, 2 CreateGmsa, 1 SetRetrievers); nothing sent
    Island list: 6 accounts, 4 ready for P4.6; hand-off ready: False
    Reconciliation (D11 KerberosIsland): 1 HandedOff, 4 OnIslandList, 1 Unreconciled
    Plan SHA-256: e8fb8355ee0989d9ce9d7b107cd52f45d0eea5f155a49c1667a1bf5840de9cca
    ```

    `KDS root key Ready` is the guide's step A2: the check reads the key's start time, with a delegated read, and never creates a key.

4. **Read the two migrations the plan sends:**

    ```powershell
    (Get-Content out/kerberos/kerberos-plan.json -Raw | ConvertFrom-Json).actions | Where-Object Account -in 'svc-intranet', 'svc-hrsync' | Select-Object Action, Account, Cmdlet, Params | ConvertTo-Json -Depth 4
    ```

    ```text
    [
      {
        "Action": "CompleteDmsaMigration",
        "Account": "svc-hrsync",
        "Cmdlet": "Complete-ADServiceAccountMigration",
        "Params": {
          "Identity": "dmsa-hrsync$",
          "SupersededAccount": "CN=svc-hrsync,OU=Service Accounts,DC=corp,DC=contoso,DC=example"
        }
      },
      {
        "Action": "CreateGmsa",
        "Account": "svc-intranet",
        "Cmdlet": "New-ADServiceAccount",
        "Params": {
          "Name": "gmsa-intranet",
          "DNSHostName": "gmsa-intranet.corp.contoso.example",
          "PrincipalsAllowedToRetrieveManagedPassword": [
            "CN=GG-gMSA-Intranet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example"
          ],
          "KerberosEncryptionType": "AES256"
        }
      }
    ]
    ```

    `CreateGmsa` for `svc-intranet` is the guide's step A3, with the same four parameters: a name, its DNS host name, a group of hosts as the retrievers, and `AES256`. `CompleteDmsaMigration` for `svc-hrsync` is step B3, with the dMSA and the superseded account's distinguished name; its migration started 40 days before, more than the program's 30.

5. **Dry-run the plan with its approved hash:**

    ```powershell
    $sha = (Get-FileHash out/kerberos/kerberos-plan.json -Algorithm SHA256).Hash.ToLower()
    ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath out/kerberos-dryrun
    ```

    ```text
    DryRun: 4 WouldSend
      WouldSend SetRetrievers         gmsa-web$       Set-ADServiceAccount
      WouldSend CreateGmsa            msa-print01$    New-ADServiceAccount
      WouldSend CompleteDmsaMigration svc-hrsync      Complete-ADServiceAccountMigration
      WouldSend CreateGmsa            svc-intranet    New-ADServiceAccount
    ```

    The program's rule that changes are reviewed: the write path sends only a plan whose SHA-256 was approved. `msa-print01$` is an sMSA, so it goes to a gMSA, never to a dMSA. No action deletes anything.

6. **Build Chapter 05's conversion plan (Migration C):**

    ```powershell
    ./Invoke-NpiFederation.ps1 -Cloud gcc -ConversionsPath tests/fixtures/ch05/conversions.json -CutoverLogPath tests/fixtures/ch05/cutover-log.csv -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation
    ```

    ```text
    Conversions: 8 in 2 wave(s); token exchange tests: 4 passed, 2 failed
    Findings: 7 Finding, 1 Warn
    Plan: 20 actions, 4 of them writes (2 CreateCredential, 1 CreateIdentity, 1 DisableLegacy); nothing sent
    Parallel runs: conv-01 ReadyToDisableLegacy; conv-02 AwaitingCutover; conv-03 AwaitingCutover; conv-04 AwaitingCutover; conv-05 AwaitingCutover; conv-06 AwaitingCutover; conv-07 ParallelRunning; conv-08 LegacyStillInUse
    Plan SHA-256: 5ec0a52c70dc49ac6904c6923ac9b292e3c312d38594b6210cc9178c9f188bf2
    ```

7. **Read what each conversion replaces, and its parallel run:**

    ```powershell
    Get-Content out/federation/conversion-records.json -Raw | ConvertFrom-Json | ForEach-Object { [pscustomobject]@{ Id = $_.ConversionId; Legacy = $_.Legacy; Target = $_.TargetKind; Run = $_.ParallelRun.Status; Day = $_.ParallelRun.Day } } | Format-Table
    ```

    ```text
    Id      Legacy                               Target              Run                  Day
    --      ------                               ------              ---                  ---
    conv-01 svc-hrsync                           managedIdentity     ReadyToDisableLegacy  40
    conv-02 Payroll Export secret payroll-2026   federatedCredential AwaitingCutover
    conv-03 svc-intranet                         federatedCredential AwaitingCutover
    conv-04 svc-webfront                         managedIdentity     AwaitingCutover
    conv-05 Mail Automation secret mail-secret   certificate         AwaitingCutover
    conv-06 svc-mailer                           certificate         AwaitingCutover
    conv-07 svc-batch                            managedIdentity     ParallelRunning       15
    conv-08 Legacy Reports secret reports-secret federatedCredential LegacyStillInUse      59
    ```

    Five AD accounts and three client secrets, each going to a managed identity, a federated credential or a certificate, and the plan holds each to Learn's order of preference: `conv-06` gives an Azure Functions app a certificate where a managed identity is available, and Chapter 05 flags it (NPI-WIF-01). `conv-01` has run 40 days on its user-assigned managed identity, so its old account is ready to disable (the guide's step C5). `conv-08`'s old secret still signs in on day 59, so it stays. `svc-intranet` is in both plans: in Chapter 06's fixture it runs an IIS application pool on two hosts and gets a gMSA; in Chapter 05's it also deploys the intranet site from GitHub Actions and gets a federated credential. Each use gets its own target, as the guide's decision path says for a hybrid workload.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test domain (5 minutes to read)

*Not run by the authors.* Two ways to do the moves for real, in a test domain, never production:

- **By hand, one account:** the guide's [Migration A](../../books/guides/service-account-migration.md#migration-a), steps A1 to A7, with Learn's commands and the expected output after each one. You need a test domain with a KDS root key older than 10 hours, a test user account with an SPN, and a member server that runs a test service as it. Back out with the guide's **Rollback (A)**.
- **Through the kit:** the workbook's [Chapter 06, Lab 2](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md#lab-2-test-domain), which makes a traditional test account and a test MSA, applies the plan as a person, and runs a dMSA migration to completion on a Windows Server 2025 domain. Its step 6 backs it out.

## Knowledge check (5 minutes)

1. A workload stays on premises and needs Kerberos. The domain has a Windows Server 2025 domain controller, but one of the two hosts that run the service is on Windows Server 2022. What's the target?
    a. A dMSA
    b. A gMSA
    c. A user-assigned managed identity
    d. Keep the user account with a longer password
2. How many KDS root keys does a forest need?
    a. One per domain
    b. One per domain controller
    c. One for the forest; more than one makes gMSAs fail after a password rotation
    d. One per gMSA
3. `Test-ADServiceAccount` returns `False` on one host. What do you do?
    a. Switch the service anyway and watch the logs
    b. Fix the host first: it isn't an allowed retriever, its group membership isn't current, or it doesn't support the account's encryption types
    c. Add the host to Domain Admins
    d. Create a second KDS root key
4. Learn's Entra page ends a move to a gMSA by deleting the old account. What does the program do?
    a. The same, right after the switch
    b. Disables it after a clean 30-day parallel run, and deletes it only later through the decommission process
    c. Leaves it enabled for good
    d. Resets its password and keeps both
5. A workload reads a file share with Kerberos and also calls Microsoft Graph, on a host with no Azure Arc agent. Where does it end up?
    a. A Microsoft Entra managed identity for both
    b. A gMSA or dMSA for the file share, and an app registration with a certificate for Graph
    c. An app registration with a client secret for both
    d. Nothing changes until the file share is retired

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** A dMSA needs every host that uses it on Windows Server 2025; otherwise the target is a gMSA. Taught in [The decision path](../../books/guides/service-account-migration.md#decision-path) and Migration B's [limits](../../books/guides/service-account-migration.md#migration-b).
2. **c.** Taught in [Migration A](../../books/guides/service-account-migration.md#migration-a), step A2, and [Dangers](../../books/guides/service-account-migration.md#dangers).
3. **b.** Taught in [Migration A](../../books/guides/service-account-migration.md#migration-a), step A4.
4. **b.** The program follows the stricter reading. Taught in [The program's rules for every migration](../../books/guides/service-account-migration.md#rules).
5. **b.** Nothing in Microsoft Entra ID speaks Kerberos for a service, and a managed identity needs an Azure resource or an Arc-enabled server. Taught in [The kinds of service identity compared](../../books/guides/service-account-migration.md#comparison) and [Migration C](../../books/guides/service-account-migration.md#migration-c), step C3 and **What can't move**.
:::

## Summary (2 minutes)

You compared the kinds of service identity, chose targets with the decision path, read Learn's steps for a user account to a gMSA, a dMSA and a Microsoft Entra workload identity, and saw the kit plan the same moves: a gMSA with the guide's four parameters, a dMSA migration completed after its parallel run, five AD accounts and three secrets converted in Learn's order of preference, and every plan sent only by its approved hash.

**The evidence an ISSO keeps** for a migration: the guide's [evidence table](../../books/guides/service-account-migration.md#evidence) by step, with the kit's `kerberos-plan.json` and `plan.json` and their approved SHA-256, the apply manifests, `Test-ADServiceAccount` per host, and `island-list.csv` for what stays. Before you move an account, work through the guide's [Checklist](../../books/guides/service-account-migration.md#checklist).

**Next:** back to the [learning path](index.md), or [Module 11: Deploy to test, then production](11-deploying-to-test-and-production.md) if you haven't taken it.
