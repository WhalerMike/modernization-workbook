---
title: "Module 15: Your first gMSA: set up the forest, then create a new gMSA"
description: "The managed service account standard's one-time setup in a forest (the KDS root key and its 10-hour wait, the service-account and holding OUs, DL-gMSA-Creators and its delegated create right, the pipeline's own gMSA) and a gMSA for a new workload that replaces no account: Chapter 12's request check, Chapter 06's one-account plan and its dry run before and after the forest has a KDS root key, then install, test and configure the workload in a test domain; with the federal requirements and evidence, and a knowledge check. Take it before Module 8."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 13"
series-order: 15
review-status: approved
reviewed-sha256: 7bed49ed13c179c736fa4066c6001bfbd5a34383856a45941222d5eae032f819
last-reviewed: 2026-11-25
---
# Module 15: Your first gMSA: set up the forest, then create a new gMSA {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). The companion guide's [Set it up once](../../books/guides/service-account-migration.md#msa-standard-setup) and [A new gMSA for a new workload](../../books/guides/service-account-migration.md#msa-standard-new-gmsa), with workbook Chapters [06](../../project-plans/developer-workbooks/non-person-identity/06-gmsa-dmsa-and-the-kerberos-island.md) and [12](../../project-plans/developer-workbooks/non-person-identity/12-the-managed-service-account-standard.md). About 60 minutes. Take it before Module 8.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-npi-module-15) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_15_Narrated) (about 12 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_15_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-15/Training_NPI_Module_15_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-15/Training_NPI_Module_15_Narrated.vtt).

## Introduction (3 minutes)

Every other lab in this path starts from an account that already exists: a user account used as a service, an sMSA, a secret. This module starts from nothing. First the forest gets what every gMSA needs, once: a KDS root key, the OUs, a group that may create gMSAs, and the pipeline's own gMSA. Then a new application gets its gMSA from the start, by the [managed service account standard](../../books/guides/service-account-migration.md#msa-standard), with no SPN to move, no parallel run and no old account to disable.

Take it after Module 1 and before Module 8. Module 8 converts the Kerberos accounts that already exist; this module sets up the forest they convert into.

**The federal requirement.** The standard's [steps](../../books/guides/service-account-migration.md#msa-standard-steps) each name what they support; these are the rows this module's labs produce evidence for:

| Step | Requirement it supports | KSIs | Evidence the ISSO keeps |
|---|---|---|---|
| S1 Request | AC-2 Account Management; IA-4 Identifier Management; CM-8 System Component Inventory | KSI-IAM-SNU; KSI-IAM-ELP, IAM-JIT; KSI-PIY-GIV | Chapter 12's `request-check.json` and `findings.json` |
| S3 Approve | AC-2; CM-3 Configuration Change Control; AC-5 Separation of Duties | KSI-IAM-SNU; KSI-CMT-LMC; KSI-IAM-JIT | The SailPoint request and ServiceNow change, carried on every write in `kerberos-plan.json` |
| S4 Create | AC-6 Least Privilege; IA-5 Authenticator Management; CM-3; AC-2(1) Automated System Account Management | KSI-IAM-ELP, IAM-JIT; KSI-IAM-SNU, IAM-APM; KSI-CMT-LMC | The plan's SHA-256, the dry run's `results.json`, and in production the apply manifest and its re-read |
| S5 Install and restrict | AC-6; AC-6(5) Privileged Accounts; CM-6 Configuration Settings | KSI-IAM-ELP; KSI-IAM-JIT, IAM-SNU; KSI-CMT-LMC | `Test-ADServiceAccount` `True` on each host; the Group Policy report |

: The rows this module practices, from the standard's steps {.striped .hover}

KSIs are FedRAMP 20x indicators for cloud service providers. A row provides evidence for a control; the assessor decides.

## Learning objectives (1 minute)

By the end of this module you can:

- set up a forest for gMSAs in order: the KDS root key and its 10-hour wait, the OUs, `DL-gMSA-Creators` and its delegated right, and `gmsa-msapipe`;
- say when the backdated KDS key is allowed, and why a forest has only one key;
- follow a new workload's gMSA from request to a working service: request, plan, create, install, test and configure;
- decide whether a new gMSA is outbound-only, and register an SPN with `setspn -S` when the workload needs one;
- run Chapter 12's request check and Chapter 06's one-account plan on fixtures, and read why a plan won't create a gMSA in a forest with no KDS root key.

## Prerequisites (1 minute)

- [Module 1](01-inventory.md), and the guide's [standard's settings](../../books/guides/service-account-migration.md#msa-standard-settings).
- PowerShell 7.1 or later with Pester 5. Lab 1 needs no domain or tenant.

## Unit 1: Set up the forest once (12 minutes)

Read the standard's [Set it up once](../../books/guides/service-account-migration.md#msa-standard-setup), then the guide's [A2](../../books/guides/service-account-migration.md#migration-a) for the key. The order matters:

1. **The KDS root key.** One per forest. A Domain Admin or Enterprise Admin creates it on a domain controller with `Add-KdsRootKey -EffectiveImmediately`, confirms it with the KDS service's Event ID 4004, and then waits: domain controllers wait up to 10 hours from its creation before they allow a gMSA to be created, so that the key replicates first. Learn's KDS page offers a key backdated 10 hours (`-EffectiveTime ((get-date).addhours(-10))`) only for a test environment with one domain controller; never use it in production. Create only one: Learn says more than one makes gMSAs fail after a password rotation.
2. **The OUs.** `<service-account-ou>` for managed service accounts and `<holding-ou>` for the disabled ones a migration retires.
3. **`DL-gMSA-Creators` and its right.** A Domain Admin creates the group and delegates the right to create `msDS-GroupManagedServiceAccount` objects on `<service-account-ou>` with `dsacls`, because Learn names the right but gives no delegation command *(design guidance: run it in the test domain first, then check it)*. Its only member is the pipeline's gMSA ([WD-163](../../about/decision-register.md#wd-163)).
4. **The pipeline's gMSA, `gmsa-msapipe`.** Created by hand once, by the standard, with its own `DL-gMSA-msapipe-Hosts` group of the pipeline's runner hosts, then added to `DL-gMSA-Creators`. Every gMSA after it is created by the pipeline through Chapter 06's approved plan.

Notice who does what: a person with Domain Admins does the setup once; after that, nobody needs Domain Admins to create a gMSA.

## Unit 2: A new gMSA for a new application (10 minutes)

Read the guide's [A new gMSA for a new workload](../../books/guides/service-account-migration.md#msa-standard-new-gmsa). Follow one new application, `timesheet`, through it:

- **S1 to S3.** Its owner asks for `gmsa-timesheet$` on hosts `TIME01` and `TIME02`, with two owners, a federal sponsor and no SPN. SailPoint approves; ServiceNow records the change. Chapter 12 checks every field, and the row it writes for Chapter 06 has no old account: its `SamAccountName` is the new gMSA itself.
- **S4.** The pipeline runs Chapter 06's one-account plan: the gMSA in `<service-account-ou>`, AES256, 30 days, retrieved only by `DL-gMSA-timesheet-Hosts`, and outbound-only, because nothing authenticates to it with an SPN. The plan won't create it while the forest has no KDS root key.
- **S5 and the workload.** Each host restarts, installs the gMSA and tests it (`True`), and the service is switched to it with a blank password.
- **What's missing, on purpose.** No delegation to carry, no SPN to move, no 30-day parallel run and no account to disable: those steps retire an old account, and a new application has none.

A second application, `visitor`, is an IIS site that browsers reach with Kerberos, so its gMSA needs the SPN `HTTP/visitor.corp.contoso.example`. It isn't outbound-only, the reason is recorded, and a person registers the SPN with `setspn -S`, which checks for a duplicate first.

## Exercise: Lab 1, fixtures, no domain (20 minutes)

The fixtures are three approved requests for new workloads that replace no account (`tests/fixtures/m15`), Chapter 06's fictional forest `corp.contoso.example`, and a copy of it before its setup, with no KDS root key. Nothing signs in to anything; the dry runs send nothing. The module's tests are in `tests-m15`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\non-person-identity-code\non-person-identity

$Run = "C:\FMWLabs\results\non-person-identity-15-your-first-gmsa\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: See Learn's KDS and gMSA steps run against the stand-ins
(Invoke-Pester -Path tests/KerberosIslandSamples.Tests.ps1 -FullNameFilter '*KdsRootKey*', '*Manage group Managed Service Accounts*' -Output None -PassThru).Tests | Where-Object Result -ne 'NotRun' | ForEach-Object { "$($_.Result)  $($_.Name)" }

# Step 2: Check the three requests (S1)
./Invoke-NpiGmsaStandard.ps1 -InputPath tests/fixtures/m15/inputs -StandardPath tests/fixtures/ch12/standard.json -OutputPath "$Run\first-gmsa" -AsOf 2026-11-20

# Step 3: Read why the third request is held
Get-Content "$Run\first-gmsa\findings.json" -Raw | ConvertFrom-Json | Format-List Rule, Object, Issue

# Step 4: Read what goes to Chapter 06
Import-Csv "$Run\first-gmsa\kerberos-replatform.csv" | Format-Table SamAccountName, NewAccount, Workload, Hosts, OutboundOnlyReason, RequestId, ChangeRecord
(Get-Content "$Run\first-gmsa\password-retrievers.json" -Raw | ConvertFrom-Json).accounts | Format-List

# Step 5: Plan the timesheet gMSA (S4)
Import-Module ./powershell/NpiKerberosIsland/NpiKerberosIsland.psm1 -Force
$tags = (Import-Csv out/first-gmsa/kerberos-replatform.csv | Where-Object NewAccount -EQ 'gmsa-timesheet$').Tags
$plan = New-NpiKrbGmsaPlan -Name 'gmsa-timesheet$' -RetrieverGroupDn 'CN=DL-gMSA-timesheet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example' -AdStandardPath tests/fixtures/ch06/inputs/ad-standard.json -RequestId REQ-2026-0301 -ChangeRecord CHG0041301 -Tags $tags -TenantId c0ffee00-0000-4000-8000-000000000001 -Domain corp.contoso.example -Cloud gcc -AsOf 2026-11-20 -Workload 'the timesheet service' -Hosts 'TIME01;TIME02'
$null = Export-NpiKrbRun -OutputPath "$Run\timesheet-plan" -Task kerberos-apply -Cloud gcc -Mode Plan -TenantId c0ffee00-0000-4000-8000-000000000001 -Domain corp.contoso.example -AsOf 2026-11-20 -Files @{ 'kerberos-plan.json' = $plan }
$plan.actions[0] | Select-Object Action, Account, Cmdlet, RunBy, RequestId, ChangeRecord, Precheck | Format-List
$plan.actions[0].Params

# Step 6: Dry-run the plan in a forest that isn't set up yet
$sha = (Get-FileHash "$Run\timesheet-plan\kerberos-plan.json" -Algorithm SHA256).Hash.ToLower()
./Invoke-NpiKerberosIslandAction.ps1 -PlanPath "$Run\timesheet-plan\kerberos-plan.json" -ApprovedSha256 $sha -RunAs Pipeline -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/m15/ad-kerberos-no-kds-key.json -OutputPath "$Run\timesheet-before-setup" -AsOf 2026-11-20
Get-Content "$Run\timesheet-before-setup\results.json" -Raw | ConvertFrom-Json | Format-List Action, Account, Outcome, Detail

# Step 7: Dry-run the same plan in the set-up forest
./Invoke-NpiKerberosIslandAction.ps1 -PlanPath "$Run\timesheet-plan\kerberos-plan.json" -ApprovedSha256 $sha -RunAs Pipeline -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath "$Run\timesheet-dryrun" -AsOf 2026-11-20

# Step 8: Run the module's tests
Invoke-Pester -Path tests-m15/NpiFirstGmsa.Tests.ps1

# After the steps
Get-ChildItem C:\FMWLabs\results\non-person-identity-15-your-first-gmsa\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\non-person-identity-code\non-person-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\non-person-identity-15-your-first-gmsa\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\non-person-identity-15-your-first-gmsa\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, which stay the same, so every run's results match this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Every step is PowerShell 7: type `pwsh` to start it, then run the two blocks above. In a clone of the repository, use the `examples` folder of the same name.

1. **See Learn's KDS and gMSA steps run against the stand-ins:**

    ```powershell
    (Invoke-Pester -Path tests/KerberosIslandSamples.Tests.ps1 -FullNameFilter '*KdsRootKey*', '*Manage group Managed Service Accounts*' -Output None -PassThru).Tests | Where-Object Result -ne 'NotRun' | ForEach-Object { "$($_.Result)  $($_.Name)" }
    ```

    Expected output:

    ```text
    Passed  checks the KDS root key with Get-KdsRootKey, which returns the root key value itself
    Passed  offers Add-KdsRootKey backdated 10 hours, which the KDS page reserves for a test environment with one domain controller
    Passed  creates a gMSA with its retrievers at creation: the model for CreateGmsa
    Passed  gives templates with angle-bracket placeholders that don't parse as PowerShell
    Passed  sets no Kerberos encryption type on the gMSA
    Passed  leaves installing and uninstalling the gMSA to a person on each host
    ```

    Six facts about Learn's published procedures. Match them to the guide: `Get-KdsRootKey` returns the key's value, so only an admin who would create the key runs it; the backdated key is for a single-DC test domain only; and the standard adds AES256, which Learn's sample leaves out.

2. **Check the three requests (S1):**

    ```powershell
    ./Invoke-NpiGmsaStandard.ps1 -InputPath tests/fixtures/m15/inputs -StandardPath tests/fixtures/ch12/standard.json -OutputPath "$Run\first-gmsa" -AsOf 2026-11-20
    ```

    Expected output:

    ```text
    As of 2026-11-20; 3 request(s), 0 AD managed account(s), 0 register row(s)
    Findings: 2 Finding, 0 Warn, 0 Info
    Requests: 2 passed (REQ-2026-0301, REQ-2026-0302); 1 held
    Chapter 06 inputs: 2 kerberos-replatform.csv row(s), 2 password-retrievers.json gMSA(s)
    Certification: ; 0 ServiceNow finding(s)
    Retirement: ; nothing deleted
      NPI-STD-03  REQ-2026-0303
      NPI-STD-04  REQ-2026-0303
    Manifest SHA-256: 9148e2e7a512c91667dd585e953735037b7709466f0fc8022edb14a27bc2eb23
    ```

    The domain has no gMSA yet, so there's nothing to certify or retire. Two requests pass; one is held.

3. **Read why the third request is held:**

    ```powershell
    Get-Content "$Run\first-gmsa\findings.json" -Raw | ConvertFrom-Json | Format-List Rule, Object, Issue
    ```

    Expected output:

    ```text
    Rule   : NPI-STD-03
    Object : REQ-2026-0303 (gmsa-kioskreporting$)
    Issue  : Name 'gmsa-kioskreporting$' isn't to the standard (WD-159): 19 characters before the $; the standard allows 15

    Rule   : NPI-STD-04
    Object : REQ-2026-0303 (gmsa-kioskreporting$)
    Issue  : 1 distinct owner(s); the standard needs exactly two named technical owners (WD-164)
    ```

    SailPoint approved it, and the code still holds it: the approvers decide on the purpose and the risk, and the code checks the standard.

4. **Read what goes to Chapter 06:**

    ```powershell
    Import-Csv "$Run\first-gmsa\kerberos-replatform.csv" | Format-Table SamAccountName, NewAccount, Workload, Hosts, OutboundOnlyReason, RequestId, ChangeRecord
    (Get-Content "$Run\first-gmsa\password-retrievers.json" -Raw | ConvertFrom-Json).accounts | Format-List
    ```

    Expected output:

    ```text
    SamAccountName  NewAccount      Workload   Hosts         OutboundOnlyReason RequestId     ChangeRecord
    --------------  ----------      --------   -----         ------------------ ---------     ------------
    gmsa-timesheet$ gmsa-timesheet$ Service    TIME01;TIME02                    REQ-2026-0301 CHG0041301
    gmsa-visitor$   gmsa-visitor$   IisAppPool VIS01                            REQ-2026-0302 CHG0041302


    gmsa-timesheet$ : {CN=DL-gMSA-timesheet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example}
    gmsa-visitor$   : {CN=DL-gMSA-visitor-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example}
    ```

    `SamAccountName` and `NewAccount` are the same: there's no old account. Each gMSA gets its own hosts' group.

5. **Plan the timesheet gMSA (S4):**

    ```powershell
    Import-Module ./powershell/NpiKerberosIsland/NpiKerberosIsland.psm1 -Force
    $tags = (Import-Csv out/first-gmsa/kerberos-replatform.csv | Where-Object NewAccount -EQ 'gmsa-timesheet$').Tags
    $plan = New-NpiKrbGmsaPlan -Name 'gmsa-timesheet$' -RetrieverGroupDn 'CN=DL-gMSA-timesheet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example' -AdStandardPath tests/fixtures/ch06/inputs/ad-standard.json -RequestId REQ-2026-0301 -ChangeRecord CHG0041301 -Tags $tags -TenantId c0ffee00-0000-4000-8000-000000000001 -Domain corp.contoso.example -Cloud gcc -AsOf 2026-11-20 -Workload 'the timesheet service' -Hosts 'TIME01;TIME02'
    $null = Export-NpiKrbRun -OutputPath "$Run\timesheet-plan" -Task kerberos-apply -Cloud gcc -Mode Plan -TenantId c0ffee00-0000-4000-8000-000000000001 -Domain corp.contoso.example -AsOf 2026-11-20 -Files @{ 'kerberos-plan.json' = $plan }
    $plan.actions[0] | Select-Object Action, Account, Cmdlet, RunBy, RequestId, ChangeRecord, Precheck | Format-List
    $plan.actions[0].Params
    ```

    Expected output:

    ```text
    Action       : CreateGmsa
    Account      : gmsa-timesheet$
    Cmdlet       : New-ADServiceAccount
    RunBy        : pipeline
    RequestId    : REQ-2026-0301
    ChangeRecord : CHG0041301
    Precheck     : krb-kds-root-keys: Ready; krb-service-accounts: gmsa-timesheet$ doesn't exist


    Name                                       Value
    ----                                       -----
    Name                                       gmsa-timesheet
    DNSHostName                                gmsa-timesheet.corp.contoso.example
    Path                                       OU=Service Accounts,DC=corp,DC=contoso,DC=example
    PrincipalsAllowedToRetrieveManagedPassword {CN=DL-gMSA-timesheet-Hosts,OU=Groups,DC=corp,DC=contoso,DC=example}
    KerberosEncryptionType                     AES256
    ManagedPasswordIntervalInDays              30
    Description                                SystemId=SYS-0618; Owner1=timesheet.owner@contoso.example; Owner2=timesheet.backup@contoso.example; Sponsor=hr.sponsor@contoso.example; Environment=prod; Tier=R3; EntraTarget=ManagedIdentity; Request=REQ-2026-0301; Change=CHG0041301
    RestrictToOutboundAuthenticationOnly       True
    ```

    Every setting is the standard's, and the precheck names the KDS root key. The description is the request's tags, which Chapter 12 wrote into the row's `Tags` column: the plan won't build without them, or with tags that name another request or change ([WD-175](../../about/decision-register.md#wd-175)). A name that breaks the standard, like step 3's, makes `New-NpiKrbGmsaPlan` throw instead of planning.

6. **Dry-run the plan in a forest that isn't set up yet:**

    ```powershell
    $sha = (Get-FileHash "$Run\timesheet-plan\kerberos-plan.json" -Algorithm SHA256).Hash.ToLower()
    ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath "$Run\timesheet-plan\kerberos-plan.json" -ApprovedSha256 $sha -RunAs Pipeline -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/m15/ad-kerberos-no-kds-key.json -OutputPath "$Run\timesheet-before-setup" -AsOf 2026-11-20
    Get-Content "$Run\timesheet-before-setup\results.json" -Raw | ConvertFrom-Json | Format-List Action, Account, Outcome, Detail
    ```

    Expected output:

    ```text
    DryRun as Pipeline: 1 Skipped
      Skipped    pipeline CreateGmsa            gmsa-timesheet$ New-ADServiceAccount


    Action  : CreateGmsa
    Account : gmsa-timesheet$
    Outcome : Skipped
    Detail  : KDS root key Missing
    ```

    This is why Unit 1 comes first: with no KDS root key, the plan creates nothing.

7. **Dry-run the same plan in the set-up forest:**

    ```powershell
    ./Invoke-NpiKerberosIslandAction.ps1 -PlanPath "$Run\timesheet-plan\kerberos-plan.json" -ApprovedSha256 $sha -RunAs Pipeline -FixturePath tests/fixtures/estate.json -KerberosFixturePath tests/fixtures/ch06/ad-kerberos.json -OutputPath "$Run\timesheet-dryrun" -AsOf 2026-11-20
    ```

    Expected output:

    ```text
    DryRun as Pipeline: 1 WouldSend
      WouldSend  pipeline CreateGmsa            gmsa-timesheet$ New-ADServiceAccount
    ```

    The same plan, the same hash: once the forest has its key, the pipeline would send `New-ADServiceAccount`.

8. **Run the module's tests:**

    ```powershell
    Invoke-Pester -Path tests-m15/NpiFirstGmsa.Tests.ps1
    ```

    It prints the test file's line, with the time it took, then this last line:

    ```text
    Tests Passed: 9, Failed: 0, Skipped: 0, Inconclusive: 0, NotRun: 0
    ```

Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\non-person-identity-15-your-first-gmsa\lab1 -Name
```

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Exercise: Lab 2, your test domain (25 minutes, plus the 10-hour wait)

Run it in a test Active Directory domain with one domain controller, never production, as a Domain Admin, on a domain controller with the Active Directory PowerShell module, and with a member server for `<host>`. **Lab 2 has not been run by anyone:** no step's output below has been seen. The values you supply: `<domain-dn>` (such as `DC=corp-test,DC=contoso,DC=example`), `<domain-fqdn>`, `<DOMAIN>` (the NetBIOS name), `<groups-ou>`, `<runner-host>`, `<host>`, and `<tags>`: the timesheet request's tags as Lab 1, step 5 printed them (`$tags`), with `Environment=test`.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Get-KdsRootKey | Select-Object KeyId, EffectiveTime, CreationTime
Add-KdsRootKey -EffectiveTime ((Get-Date).AddHours(-10))
Get-WinEvent -LogName 'Microsoft-Windows-KdsSvc/Operational' | Where-Object Id -eq 4004 | Select-Object -First 1 TimeCreated, Id, Message
Get-KdsRootKey | Test-KdsRootKey

New-ADOrganizationalUnit -Name "Service Accounts" -Path "<domain-dn>"
New-ADOrganizationalUnit -Name "Disabled Service Accounts" -Path "<domain-dn>"

New-ADGroup -Name "DL-gMSA-Creators" -SamAccountName "DL-gMSA-Creators" -GroupScope DomainLocal -Path "<groups-ou>"
dsacls "OU=Service Accounts,<domain-dn>" /G "<DOMAIN>\DL-gMSA-Creators:CC;msDS-GroupManagedServiceAccount"
dsacls "OU=Service Accounts,<domain-dn>" | Select-String "DL-gMSA-Creators"

New-ADGroup -Name "DL-gMSA-msapipe-Hosts" -SamAccountName "DL-gMSA-msapipe-Hosts" -GroupScope DomainLocal -Path "<groups-ou>"
Add-ADGroupMember -Identity "DL-gMSA-msapipe-Hosts" -Members "<runner-host>$"
New-ADServiceAccount -Name gmsa-msapipe -DNSHostName gmsa-msapipe.<domain-fqdn> -Path "OU=Service Accounts,<domain-dn>" -RestrictToOutboundAuthenticationOnly -ManagedPasswordIntervalInDays 30 -PrincipalsAllowedToRetrieveManagedPassword "DL-gMSA-msapipe-Hosts" -KerberosEncryptionType AES256
Add-ADGroupMember -Identity "DL-gMSA-Creators" -Members "gmsa-msapipe$"

New-ADGroup -Name "DL-gMSA-timesheet-Hosts" -SamAccountName "DL-gMSA-timesheet-Hosts" -GroupScope DomainLocal -Path "<groups-ou>"
Add-ADGroupMember -Identity "DL-gMSA-timesheet-Hosts" -Members "<host>$"
New-ADServiceAccount -Name gmsa-timesheet -DNSHostName gmsa-timesheet.<domain-fqdn> -Path "OU=Service Accounts,<domain-dn>" -RestrictToOutboundAuthenticationOnly -ManagedPasswordIntervalInDays 30 -PrincipalsAllowedToRetrieveManagedPassword "DL-gMSA-timesheet-Hosts" -KerberosEncryptionType AES256 -Description "<tags>"
Get-ADServiceAccount -Identity "gmsa-timesheet" -Properties PrincipalsAllowedToRetrieveManagedPassword, KerberosEncryptionType, msDS-ManagedPasswordInterval | Select-Object Name, ObjectClass, PrincipalsAllowedToRetrieveManagedPassword, KerberosEncryptionType, msDS-ManagedPasswordInterval

Install-ADServiceAccount -Identity gmsa-timesheet
Test-ADServiceAccount -Identity gmsa-timesheet
New-Service -Name TimesheetTest -BinaryPathName "C:\Windows\System32\svchost.exe -k netsvcs" -StartupType Manual
sc.exe config TimesheetTest obj= "<DOMAIN>\gmsa-timesheet$" password= ""
sc.exe qmanagedaccount TimesheetTest

sc.exe delete TimesheetTest
Uninstall-ADServiceAccount -Identity gmsa-timesheet

Remove-ADServiceAccount -Identity gmsa-timesheet -Confirm:$false
Remove-ADGroup -Identity "DL-gMSA-timesheet-Hosts" -Confirm:$false
```

:::

<!-- labs:end -->

**Step 1: The KDS root key.** In a single-DC test domain only, the backdated key lets you go on now; in any other domain, use `-EffectiveImmediately` and wait 10 hours.

```powershell
Get-KdsRootKey | Select-Object KeyId, EffectiveTime, CreationTime
Add-KdsRootKey -EffectiveTime ((Get-Date).AddHours(-10))
Get-WinEvent -LogName 'Microsoft-Windows-KdsSvc/Operational' | Where-Object Id -eq 4004 | Select-Object -First 1 TimeCreated, Id, Message
Get-KdsRootKey | Test-KdsRootKey
```

Run `Add-KdsRootKey` only if the first command returned nothing: one key per forest. Look for Event 4004 and `True` from `Test-KdsRootKey`, which checks that the key can generate derived keys ([service account guide, A2](../../books/guides/service-account-migration.md#migration-a)).

**Step 2: The OUs.**

```powershell
New-ADOrganizationalUnit -Name "Service Accounts" -Path "<domain-dn>"
New-ADOrganizationalUnit -Name "Disabled Service Accounts" -Path "<domain-dn>"
```

**Step 3: `DL-gMSA-Creators` and its delegated right.**

```powershell
New-ADGroup -Name "DL-gMSA-Creators" -SamAccountName "DL-gMSA-Creators" -GroupScope DomainLocal -Path "<groups-ou>"
dsacls "OU=Service Accounts,<domain-dn>" /G "<DOMAIN>\DL-gMSA-Creators:CC;msDS-GroupManagedServiceAccount"
dsacls "OU=Service Accounts,<domain-dn>" | Select-String "DL-gMSA-Creators"
```

**Expected:** `Allow <DOMAIN>\DL-gMSA-Creators` with `CREATE CHILD` for `msDS-GroupManagedServiceAccount`.

**Step 4: The pipeline's gMSA.**

```powershell
New-ADGroup -Name "DL-gMSA-msapipe-Hosts" -SamAccountName "DL-gMSA-msapipe-Hosts" -GroupScope DomainLocal -Path "<groups-ou>"
Add-ADGroupMember -Identity "DL-gMSA-msapipe-Hosts" -Members "<runner-host>$"
New-ADServiceAccount -Name gmsa-msapipe -DNSHostName gmsa-msapipe.<domain-fqdn> -Path "OU=Service Accounts,<domain-dn>" -RestrictToOutboundAuthenticationOnly -ManagedPasswordIntervalInDays 30 -PrincipalsAllowedToRetrieveManagedPassword "DL-gMSA-msapipe-Hosts" -KerberosEncryptionType AES256
Add-ADGroupMember -Identity "DL-gMSA-Creators" -Members "gmsa-msapipe$"
```

**Step 5: The timesheet gMSA.** In production the pipeline sends this from the approved plan; in the test domain you send it by hand, as a member of `DL-gMSA-Creators` or a Domain Admin.

```powershell
New-ADGroup -Name "DL-gMSA-timesheet-Hosts" -SamAccountName "DL-gMSA-timesheet-Hosts" -GroupScope DomainLocal -Path "<groups-ou>"
Add-ADGroupMember -Identity "DL-gMSA-timesheet-Hosts" -Members "<host>$"
New-ADServiceAccount -Name gmsa-timesheet -DNSHostName gmsa-timesheet.<domain-fqdn> -Path "OU=Service Accounts,<domain-dn>" -RestrictToOutboundAuthenticationOnly -ManagedPasswordIntervalInDays 30 -PrincipalsAllowedToRetrieveManagedPassword "DL-gMSA-timesheet-Hosts" -KerberosEncryptionType AES256 -Description "<tags>"
Get-ADServiceAccount -Identity "gmsa-timesheet" -Properties PrincipalsAllowedToRetrieveManagedPassword, KerberosEncryptionType, msDS-ManagedPasswordInterval | Select-Object Name, ObjectClass, PrincipalsAllowedToRetrieveManagedPassword, KerberosEncryptionType, msDS-ManagedPasswordInterval
```

**Expected:** `ObjectClass` `msDS-GroupManagedServiceAccount`, the hosts' group as the retriever, `AES256`, and `30`. `Get-ADServiceAccount -Identity gmsa-timesheet -Properties Description` shows the tags ([WD-175](../../about/decision-register.md#wd-175)).

**Step 6: Install, test and run a service as it, on `<host>`.** Restart `<host>` first, so it picks up its group membership. Then, in an elevated session on `<host>`, with the RSAT Active Directory module, run a test service as the gMSA:

```powershell
Install-ADServiceAccount -Identity gmsa-timesheet
Test-ADServiceAccount -Identity gmsa-timesheet
New-Service -Name TimesheetTest -BinaryPathName "C:\Windows\System32\svchost.exe -k netsvcs" -StartupType Manual
sc.exe config TimesheetTest obj= "<DOMAIN>\gmsa-timesheet$" password= ""
sc.exe qmanagedaccount TimesheetTest
```

**Expected:** `Test-ADServiceAccount` returns `True`, and `qmanagedaccount` reports `TRUE`. The test service is only there to take the identity; it isn't meant to start.

**Step 7: Back it out.** On `<host>`, then on the domain controller:

```powershell
sc.exe delete TimesheetTest
Uninstall-ADServiceAccount -Identity gmsa-timesheet
```

```powershell
Remove-ADServiceAccount -Identity gmsa-timesheet -Confirm:$false
Remove-ADGroup -Identity "DL-gMSA-timesheet-Hosts" -Confirm:$false
```

Keep the KDS root key, the OUs, `DL-gMSA-Creators` and `gmsa-msapipe`: they're the setup, made once. A test domain you'll rebuild can drop them with it.

## Knowledge check (5 minutes)

1. The forest has no KDS root key. In what order do you set it up?
    a. Create the gMSA, then the key
    b. The KDS root key (and its wait), the OUs, `DL-gMSA-Creators` and its right, then `gmsa-msapipe`
    c. `gmsa-msapipe` first, so the pipeline can do the rest
    d. Any order; Active Directory sorts it out
2. When may you use `Add-KdsRootKey -EffectiveTime ((get-date).addhours(-10))`?
    a. Whenever you can't wait 10 hours
    b. Only in a test environment with one domain controller, never in production
    c. In production, after a change record
    d. Never; Learn doesn't offer it
3. A new application has no old account. Which steps of a migration does it skip?
    a. None: every gMSA has a 30-day parallel run
    b. The SPN move, the delegation carry-over, the parallel run and disabling an old account
    c. The request and approval
    d. `Test-ADServiceAccount`
4. A new IIS site needs the SPN `HTTP/visitor.corp.contoso.example`. What does the standard say?
    a. Create the gMSA outbound-only and add the SPN later
    b. Create it without `-RestrictToOutboundAuthenticationOnly`, record why, and register the SPN with `setspn -S`, which checks for duplicates first
    c. Put the SPN on a user account instead
    d. Use `setspn -A` on every host
5. Chapter 06's plan for `gmsa-timesheet$` runs in a forest with no KDS root key. What happens?
    a. It creates the gMSA without a key
    b. The dry run skips the create: `KDS root key Missing`
    c. It creates a KDS root key first
    d. It fails the plan's hash check

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in [Set it up once](../../books/guides/service-account-migration.md#msa-standard-setup).
2. **b.** Taught in the guide's [A2](../../books/guides/service-account-migration.md#migration-a), from Learn's KDS and containers pages.
3. **b.** Taught in [A new gMSA for a new workload](../../books/guides/service-account-migration.md#msa-standard-new-gmsa).
4. **b.** Taught in [A new gMSA for a new workload](../../books/guides/service-account-migration.md#msa-standard-new-gmsa), step 5, and the standard's [settings](../../books/guides/service-account-migration.md#msa-standard-settings) ([WD-154](../../about/decision-register.md#wd-154)).
5. **b.** Taught in Lab 1, step 6: the plan's precheck reads the key.
:::

## Summary (2 minutes)

A forest is set up for gMSAs once: one KDS root key, aged 10 hours, the OUs, `DL-gMSA-Creators` with its delegated right, and `gmsa-msapipe`. After that, a new application's gMSA follows the standard from the first day: requested and checked, planned and created by the pipeline with the standard's settings, installed and tested on its hosts, and given to the workload with a blank password. It's outbound-only unless the workload needs an SPN, and it has nothing to migrate from. Next: [Module 8: Convert Kerberos accounts to gMSAs and dMSAs](08-gmsa-dmsa-and-the-kerberos-island.md), which brings the existing accounts into the same forest.
