---
title: "Module 14: Workload identity across AWS GovCloud (US) and OCI"
description: "The implementation guide's AWS GovCloud (US) and OCI steps (1g, 1h and 4f) with the developer workbook's Chapter 13: export each account's and tenancy's workload identities with read-only commands, join each one to its record by the SystemId, Owner1, Owner2 and Sponsor tags, treat every access key, API signing key, auth token and customer secret key as an exception with a replace-by date, check OIDC trusts for a subject condition and IAM Roles Anywhere trust anchors for an imported CRL, read dynamic groups and policies for reach; a lab on the kit's fixtures, the federal requirements and evidence, and a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04, 13"
series-order: 14
review-status: approved
reviewed-sha256: 3a92cf612cf20db2fae2667ecde18d86b4309962aaf5d91ecc01b77996afa345
last-reviewed: 2026-11-25
---
# Module 14: Workload identity across AWS GovCloud (US) and OCI {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). The implementation guide's [Step 1g](../../books/guides/non-person-identity-implementation.md#step-1g-aws), [Step 1h](../../books/guides/non-person-identity-implementation.md#step-1h-oci) and [Step 4f](../../books/guides/non-person-identity-implementation.md#step-4f-aws-oci), with workbook [Chapter 13](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md). About 60 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-npi-module-14) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_14_Narrated) (about 13 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_14_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-14/Training_NPI_Module_14_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-14/Training_NPI_Module_14_Narrated.vtt).

**Also:** the chapter's narrated tour, about 14 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_13_AWS_OCI_Workload_Narrated).

## Introduction (3 minutes)

The program's AWS estate is in AWS GovCloud (US) and its Oracle Cloud tenancy is in Oracle's US Government Cloud (realm OC2), and on November 24, 2026 the program added both clouds' workload identities to this track ([WD-171](../../about/decision-register.md#wd-171)). A workload in AWS or OCI that holds an access key is a service account with a password that never expires, in a console nobody in identity governance opens. This module brings those identities under the same rules as the rest of the track: listed, joined to a record with two owners and a sponsor, with every long-lived credential an exception with a replace-by date, and every trust no wider than its workload needs.

Take it after Modules 1 and 4. Module 1 builds the register for Entra ID and Active Directory; this module adds the other two clouds' identities to the same record.

**The federal requirement.** Chapter 13 writes one evidence row per step and control; these are the rows this module's lab produces:

| What the output shows | Requirement it supports | KSIs | Evidence the ISSO keeps |
|---|---|---|---|
| Every AWS and OCI workload identity, with its kind and whether it's joined to a record (`identities.json`) | AC-2 Account Management; CM-8 System Component Inventory; IA-4 Identifier Management | KSI-IAM-SNU (with APM, JIT, SUS); KSI-PIY-GIV; KSI-IAM-ELP, IAM-JIT | `identities.json` and the exports it read, by their SHA-256 in the manifest |
| Every long-lived credential, with its age, last use and exception (`credentials.csv`) | IA-5 Authenticator Management | KSI-IAM-APM | `credentials.csv` and the exception records it names |
| Every Roles Anywhere trust anchor, with its CA and imported CRLs (`trust.json`) | IA-5(2) Public Key-Based Authentication; SC-17 Public Key Infrastructure Certificates | KSI-IAM-APM, IAM-ELP, IAM-SNU, SVC-ASM; KSI-SVC-ASM | `trust.json` and the CRL import record |
| Every role's, dynamic group's and workload statement's trust and reach (`trust.json`) | AC-6 Least Privilege | KSI-IAM-ELP, IAM-JIT | `trust.json` and the owner's justification for each Finding kept |
| Unused keys, unowned identities and unused issuers, as orphan leads (`findings.json`) | AC-2(3) Disable Accounts | KSI-IAM-AAM, IAM-JIT, IAM-SUS | `findings.json` and the orphan or decommission ticket |

: The rows this module practices, from Chapter 13's evidence table {.striped .hover}

KSIs are FedRAMP 20x indicators for cloud service providers. A row provides evidence for a control; the assessor decides.

## Learning objectives (1 minute)

By the end of this module you can:

- say why an AWS access key or an OCI API key, auth token or customer secret key is a long-lived secret, and what the program does with each one;
- name what the guide's Step 1g and 1h exports read, and what AWS's credential report and list calls leave out;
- join an AWS or OCI identity to its record with the `SystemId`, `Owner1`, `Owner2` and `Sponsor` tags;
- run Chapter 13's checks on fixtures and read the findings, the credentials, the unjoined identities, one OIDC trust and the evidence;
- name what's still unknown in GovCloud and OC2, and why the kit doesn't assume an answer.

## Prerequisites (1 minute)

Modules 1 and 4, and PowerShell 7.1 or later with Pester 5. No AWS account, OCI tenancy or Entra tenant.

## Unit 1: What the vendors say, and the program's rule (8 minutes)

Read Chapter 13's [What AWS, Oracle and Microsoft say](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#what-aws-oracle-and-microsoft-say). Notice three things.

- **The target is temporary credentials.** AWS says to require workloads to use temporary credentials with IAM roles and, where possible, not to create access keys. Oracle recommends instance principals, and rotating API keys every 90 days or less. The program makes every long-lived credential an exception with a replacement date ([WD-171](../../about/decision-register.md#wd-171)).
- **GovCloud is not commercial AWS.** It has one IAM control plane and no global STS endpoint, no role between a GovCloud account and a standard one, and a root user with no console sign-in. IAM Roles Anywhere works, but it can't fetch revocation lists from a certificate's CRL distribution points, so CRLs have to be imported.
- **OCI's workloads are principals.** An instance principal or a resource principal is authorized through a dynamic group, whose matching rule decides its members, and a dynamic group has no permissions until a policy names it. Anyone who can sign in to an instance acts with its rights.

Then read the guide's [Step 4f](../../books/guides/non-person-identity-implementation.md#step-4f-aws-oci): AWS's last accessed information and Access Analyzer for unused access, and narrow matching rules and policy statements in OCI.

## Unit 2: The exports and the join to the record (8 minutes)

Read the guide's [Step 1g](../../books/guides/non-person-identity-implementation.md#step-1g-aws) and [Step 1h](../../books/guides/non-person-identity-implementation.md#step-1h-oci). Every command is a read: the credential report, the access keys, service-specific credentials, roles, instance profiles, OIDC providers, Roles Anywhere trust anchors, profiles and CRLs, and each user's and role's tags in AWS; the users, their credentials, dynamic groups and policies in OCI, against the tenancy's home region.

Then read Chapter 13's [inputs](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#the-inputs) and [Start with the vendors' own reads](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#start-with-the-vendors-own-reads). The credential report covers only the first two access keys of each user and leaves out service-specific credentials, which is why the kit reads `access-keys.json` and `service-specific-credentials.json` too. `ListRoles` and `ListUsers` don't return tags, which is why Step 1g runs `list-role-tags` and `list-user-tags`.

**The join.** Every role, workload IAM user, OCI user holding a credential and dynamic group carries four tags: `SystemId` (the record), `Owner1` and `Owner2` (the two technical owners) and `Sponsor` ([WD-172](../../about/decision-register.md#wd-172)). Each owner has its own key, because AWS tag values allow only letters, numbers, spaces and `_ . : / = + - @`, so no comma or semicolon. An identity with no tags or record is an orphan, under the guide's [orphan rule](../../books/guides/non-person-identity-implementation.md#orphans): disable first, then a person acts.

## Unit 3: The checks, and VK-NPI-10 (6 minutes)

Read Chapter 13's [What Chapter 13 checks](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#the-code-what-examplesnon-person-identity-adds): NPI-AWS-01 to -16 and NPI-OCI-01 to -10. The kit reads the exports only. It runs no AWS or OCI command, calls no API, deactivates no key and changes no policy; the findings say what to do, and a person does it.

The guide's G1 and G3 gates name **VK-NPI-10**, which reads the same export folder in the validation kit and reports the gate's pass criteria: long-lived credentials without a current exception, missing tags, OIDC trusts without a `sub` condition, and trust anchors without an imported CRL ([the guide's validation kit table](../../books/guides/non-person-identity-implementation.md#how-to-read-this-guide)). Chapter 13 gives the full findings behind it.

**What's still unknown.** Read Chapter 13's [Not yet specified](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#verified-facts) list. Whether a GovCloud account and Entra ID can federate either way hasn't been tested, so the guide uses that path only after a test. Whether IAM Access Analyzer's unused-access findings run in GovCloud isn't stated. Whether instance principals, resource principals and OKE workload identity are available in OC2 isn't stated. And the OCI CLI's output field names aren't shown on its reference pages, so the kit reads any spelling.

## Exercise: Lab 1, fixtures, no account or tenancy (25 minutes)

These are Chapter 13's [Lab 1](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#lab-1-fixtures-no-account-or-tenancy) steps; the chapter shows each one's expected output. The fixtures are one fictional GovCloud account (`111122223333`, partition `aws-us-gov`) and one fictional OC2 tenancy.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\non-person-identity-code\non-person-identity

$Run = "C:\FMWLabs\results\non-person-identity-14-workload-identity-across-aws-govcloud-and-oci\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Run the checks on the fixtures
./Invoke-NpiCloudWorkload.ps1 -AwsPath tests/fixtures/ch13/aws -OciPath tests/fixtures/ch13/oci -SettingsPath tests/fixtures/ch13/settings.json -ExceptionsPath tests/fixtures/ch13/exceptions.csv -OutputPath "$Run\cloud-workload" -AsOf 2026-11-24

# Step 2: Read the findings
Get-Content "$Run\cloud-workload\findings.json" -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object

# Step 3: Read the long-lived credentials
Import-Csv "$Run\cloud-workload\credentials.csv" | Format-Table Cloud, Identity, Kind, AgeDays, LastUsedOn, Exception

# Step 4: Read who isn't joined to a record, and one trust
Get-Content "$Run\cloud-workload\identities.json" -Raw | ConvertFrom-Json | Where-Object Joined -EQ 'no' | Format-Table Cloud, Type, Name, WorkloadKind
(Get-Content "$Run\cloud-workload\trust.json" -Raw | ConvertFrom-Json | Where-Object Object -EQ 'ci-pipeline-oidc').Principals | Format-List type, value, kind, conditions

# Step 5: Run without the two optional files
Copy-Item -Recurse tests/fixtures/ch13/aws "$Run\aws-min"
Remove-Item "$Run\aws-min\iam-tags.json", "$Run\aws-min\roles-anywhere-crls.json"
./Invoke-NpiCloudWorkload.ps1 -AwsPath "$Run\aws-min" -SettingsPath tests/fixtures/ch13/settings.json -OutputPath "$Run\cloud-workload-min" -AsOf 2026-11-24

# Step 6: Read the evidence
(Get-Content "$Run\cloud-workload\evidence.json" -Raw | ConvertFrom-Json).rows | Format-Table step, control, evidence, @{ n = 'ksi'; e = { $_.ksi -join ', ' } }

# Step 7: Run the tests
Invoke-Pester -Path tests-ch13/NpiCloudWorkload.Tests.ps1

# After the steps
Get-ChildItem C:\FMWLabs\results\non-person-identity-14-workload-identity-across-aws-govcloud-and-oci\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\non-person-identity-code\non-person-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\non-person-identity-14-workload-identity-across-aws-govcloud-and-oci\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\non-person-identity-14-workload-identity-across-aws-govcloud-and-oci\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, which stay the same, so every run's results match this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Every step is PowerShell 7: type `pwsh` to start it, then run the two blocks above. In a clone of the repository, use the `examples` folder of the same name.

1. **Run the checks on the fixtures:**

    ```powershell
    ./Invoke-NpiCloudWorkload.ps1 -AwsPath tests/fixtures/ch13/aws -OciPath tests/fixtures/ch13/oci -SettingsPath tests/fixtures/ch13/settings.json -ExceptionsPath tests/fixtures/ch13/exceptions.csv -OutputPath "$Run\cloud-workload" -AsOf 2026-11-24
    ```

    Expected output:

    ```text
    As of 2026-11-24; AWS account 111122223333 (aws-us-gov): 7 IAM user(s), 11 role(s), 2 trust anchor(s); OCI tenancy (oc2): 5 user(s), 3 dynamic group(s)
    Findings: 24 Finding, 11 Warn, 2 Info
    Long-lived credentials: 7 AWS, 5 OCI; 2 under a current exception
    Not read: nothing
      NPI-AWS-01  svc-app-sync, svc-ci-deploy, svc-legacy-ftp, svc-report-export
      NPI-AWS-02  svc-report-export
      NPI-AWS-03  svc-legacy-ftp
      NPI-AWS-04  svc-report-export
      NPI-AWS-05  svc-bedrock-batch, svc-git-mirror
      NPI-AWS-06  svc-legacy-ftp
      NPI-AWS-08  app-etl-lambda, legacy-open-role, svc-legacy-ftp, svc-report-export
      NPI-AWS-09  ci-pipeline-oidc
      NPI-AWS-10  gitlab.example.com
      NPI-AWS-11  partner-audit-readonly
      NPI-AWS-12  legacy-open-role
      NPI-AWS-13  commercial-bridge
      NPI-AWS-14  ta-lab-ca
      NPI-AWS-15  prof-retired-batch
      NPI-AWS-16  old-batch-host
      NPI-OCI-01  hr-integration, hr-report-reader
      NPI-OCI-02  hr-integration
      NPI-OCI-03  hr-integration
      NPI-OCI-04  hr-build-push
      NPI-OCI-05  hr-object-sync
      NPI-OCI-06  dg-everything, hr-build-push, hr-object-sync
      NPI-OCI-07  dg-everything
      NPI-OCI-08  dg-everything
      NPI-OCI-09  hr-batch-policy
      NPI-OCI-10  hr-oke-workload
    Manifest SHA-256: 03f4376a836b0862512bd084731865ac6617ced980c457928f5c1b352b7f6400
    ```

2. **Read the findings:**

    ```powershell
    Get-Content "$Run\cloud-workload\findings.json" -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object
    ```

    Expected output:

    ```text
    Rule       Severity Object
    ----       -------- ------
    NPI-AWS-01 Warn     svc-app-sync (IAM user)
    NPI-AWS-01 Finding  svc-ci-deploy (IAM user)
    NPI-AWS-01 Finding  svc-legacy-ftp (IAM user)
    NPI-AWS-01 Finding  svc-report-export (IAM user)
    NPI-AWS-01 Finding  svc-report-export (IAM user)
    NPI-AWS-02 Finding  svc-report-export (IAM user)
    NPI-AWS-03 Warn     svc-legacy-ftp (IAM user)
    NPI-AWS-04 Finding  svc-report-export (IAM user)
    NPI-AWS-05 Warn     svc-bedrock-batch (IAM user)
    NPI-AWS-05 Finding  svc-git-mirror (IAM user)
    NPI-AWS-06 Warn     svc-legacy-ftp (IAM user)
    NPI-AWS-08 Finding  app-etl-lambda (IAM role)
    NPI-AWS-08 Finding  legacy-open-role (IAM role)
    NPI-AWS-08 Finding  svc-legacy-ftp (IAM user)
    NPI-AWS-08 Finding  svc-report-export (IAM user)
    NPI-AWS-09 Finding  ci-pipeline-oidc (IAM role)
    NPI-AWS-10 Warn     gitlab.example.com (OIDC provider)
    NPI-AWS-11 Finding  partner-audit-readonly (IAM role)
    NPI-AWS-12 Finding  legacy-open-role (IAM role)
    NPI-AWS-13 Warn     commercial-bridge (IAM role)
    NPI-AWS-14 Finding  ta-lab-ca (trust anchor)
    NPI-AWS-15 Warn     prof-retired-batch (Roles Anywhere profile)
    NPI-AWS-16 Info     old-batch-host (instance profile)
    NPI-OCI-01 Finding  hr-integration (OCI user)
    NPI-OCI-01 Finding  hr-integration (OCI user)
    NPI-OCI-01 Warn     hr-report-reader (OCI user)
    NPI-OCI-02 Finding  hr-integration (OCI user)
    NPI-OCI-03 Warn     hr-integration (OCI user)
    NPI-OCI-04 Finding  hr-build-push (OCI user)
    NPI-OCI-05 Finding  hr-object-sync (OCI user)
    NPI-OCI-06 Finding  dg-everything (dynamic group)
    NPI-OCI-06 Finding  hr-build-push (OCI user)
    NPI-OCI-06 Finding  hr-object-sync (OCI user)
    NPI-OCI-07 Warn     dg-everything (dynamic group)
    NPI-OCI-08 Warn     dg-everything (dynamic group)
    NPI-OCI-09 Finding  hr-batch-policy (policy), statement 2
    NPI-OCI-10 Info     hr-oke-workload (policy), statement 1
    ```

    Find `svc-report-export`: which four rules does it trip, and what does each one mean? Then find `dg-everything`: no tags, no policy names it, and its rule matches the whole tenancy.

3. **Read the long-lived credentials:**

    ```powershell
    Import-Csv "$Run\cloud-workload\credentials.csv" | Format-Table Cloud, Identity, Kind, AgeDays, LastUsedOn, Exception
    ```

    Expected output:

    ```text
    Cloud Identity          Kind                          AgeDays LastUsedOn Exception
    ----- --------          ----                          ------- ---------- ---------
    aws   svc-app-sync      Access key                    161     2026-11-23 EXC-2026-031
    aws   svc-bedrock-batch Service-specific (bedrock)    145
    aws   svc-ci-deploy     Access key                    623     2026-11-22
    aws   svc-git-mirror    Service-specific (codecommit) 387
    aws   svc-legacy-ftp    Access key                    905     2025-12-01
    aws   svc-report-export Access key                    83      2026-11-20
    aws   svc-report-export Access key                    39
    oci   hr-build-push     Auth token                    582
    oci   hr-integration    API signing key               295
    oci   hr-integration    API signing key               53
    oci   hr-object-sync    Customer secret key           357
    oci   hr-report-reader  API signing key               69                 EXC-2026-044
    ```

    Which two credentials are under an exception? Why does `svc-app-sync`'s key show as a Warn in step 2, not a Finding?

4. **Read who isn't joined to a record, and one trust:**

    ```powershell
    Get-Content "$Run\cloud-workload\identities.json" -Raw | ConvertFrom-Json | Where-Object Joined -EQ 'no' | Format-Table Cloud, Type, Name, WorkloadKind
    (Get-Content "$Run\cloud-workload\trust.json" -Raw | ConvertFrom-Json | Where-Object Object -EQ 'ci-pipeline-oidc').Principals | Format-List type, value, kind, conditions
    ```

    Expected output:

    ```text
    Cloud Type         Name              WorkloadKind
    ----- ----         ----              ------------
    aws   IamUser      svc-legacy-ftp    IAM user (long-lived credentials)
    aws   IamUser      svc-report-export IAM user (long-lived credentials)
    aws   IamRole      app-etl-lambda    Lambda execution role
    aws   IamRole      legacy-open-role  Anyone
    oci   OciUser      hr-build-push     OCI user (long-lived credentials)
    oci   OciUser      hr-object-sync    OCI user (long-lived credentials)
    oci   DynamicGroup dg-everything     Instance principal


    type       : Federated
    value      : arn:aws-us-gov:iam::111122223333:oidc-provider/token.actions.githubusercontent.com
    kind       : OIDC federation
    conditions : {StringEquals token.actions.githubusercontent.com:aud = sts.amazonaws.com}
    ```

    `ci-pipeline-oidc` has only an `aud` condition. Who could present a token for it?

5. **Run without the two optional files.** The copy goes in this run's folder, so the kit's fixtures stay as they are:

    ```powershell
    Copy-Item -Recurse tests/fixtures/ch13/aws "$Run\aws-min"
    Remove-Item "$Run\aws-min\iam-tags.json", "$Run\aws-min\roles-anywhere-crls.json"
    ./Invoke-NpiCloudWorkload.ps1 -AwsPath "$Run\aws-min" -SettingsPath tests/fixtures/ch13/settings.json -OutputPath "$Run\cloud-workload-min" -AsOf 2026-11-24
    ```

    Expected output:

    ```text
    As of 2026-11-24; AWS account 111122223333 (aws-us-gov): 7 IAM user(s), 11 role(s), 2 trust anchor(s)
    Findings: 11 Finding, 9 Warn, 1 Info
    Long-lived credentials: 7 AWS, 0 OCI; 0 under a current exception
    Not read: aws/iam-tags.json, aws/roles-anywhere-crls.json
      NPI-AWS-01  svc-app-sync, svc-ci-deploy, svc-legacy-ftp, svc-report-export
      NPI-AWS-02  svc-report-export
      NPI-AWS-03  svc-legacy-ftp
      NPI-AWS-04  svc-report-export
      NPI-AWS-05  svc-bedrock-batch, svc-git-mirror
      NPI-AWS-06  svc-legacy-ftp
      NPI-AWS-08  AWS account 111122223333
      NPI-AWS-09  ci-pipeline-oidc
      NPI-AWS-10  gitlab.example.com
      NPI-AWS-11  partner-audit-readonly
      NPI-AWS-12  legacy-open-role
      NPI-AWS-13  commercial-bridge
      NPI-AWS-14  ta-program-pki, ta-lab-ca
      NPI-AWS-15  prof-retired-batch
      NPI-AWS-16  old-batch-host
    Manifest SHA-256: a9720a04ac5c5e13671fa52bd42881bdbaae05547b25d2a8aebe7394f285f056
    ```

    One NPI-AWS-08 Warn for the account, and an NPI-AWS-14 Warn for each trust anchor. A missing file is a Warn, never a Pass.

6. **Read the evidence:**

    ```powershell
    (Get-Content "$Run\cloud-workload\evidence.json" -Raw | ConvertFrom-Json).rows | Format-Table step, control, evidence, @{ n = 'ksi'; e = { $_.ksi -join ', ' } }
    ```

    Expected output:

    ```text
    step                control evidence        ksi
    ----                ------- --------        ---
    inventory           AC-2    identities.json KSI-IAM-APM, KSI-IAM-JIT, KSI-IAM-SNU, KSI-IAM-SUS
    inventory           CM-8    identities.json KSI-PIY-GIV
    inventory           IA-4    identities.json KSI-IAM-ELP, KSI-IAM-JIT
    credentials         IA-5    credentials.csv KSI-IAM-APM
    certificates        IA-5(2) trust.json      KSI-IAM-APM, KSI-IAM-ELP, KSI-IAM-SNU, KSI-SVC-ASM
    certificates        SC-17   trust.json      KSI-SVC-ASM
    trust-and-privilege AC-6    trust.json      KSI-IAM-ELP, KSI-IAM-JIT
    lifecycle           AC-2(3) findings.json   KSI-IAM-AAM, KSI-IAM-JIT, KSI-IAM-SUS
    ```

    Match each row to the federal requirement table in the introduction.

7. **Run the tests:**

    ```powershell
    Invoke-Pester -Path tests-ch13/NpiCloudWorkload.Tests.ps1
    ```

    It prints the test file's line, with the time it took, then this last line:

    ```text
    Tests Passed: 34, Failed: 0, Skipped: 0, Inconclusive: 0, NotRun: 0
    ```

Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\non-person-identity-14-workload-identity-across-aws-govcloud-and-oci\lab1 -Name
```

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Exercise: Lab 2, your test account and tenancy (5 minutes to read)

Read Chapter 13's [Lab 2](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#lab-2-test-account-and-tenancy). It runs the guide's Step 1g and 1h commands in one AWS GovCloud (US) account and one OCI tenancy that aren't production, then the same checks on their exports. Nobody has run it yet, so no step's output has been seen. Its step 4 tells you what to look for if the OCI CLI prints field names the kit doesn't expect. Keep the exports with the run's evidence, never in the repository: they hold account IDs, ARNs, OCIDs and key IDs, never a secret.

## Knowledge check (5 minutes)

1. An IAM user has three access keys. Which file shows all three?
    a. The credential report
    b. `access-keys.json`, from `list-access-keys`: the credential report covers only the first two
    c. `roles.json`
    d. `iam-tags.json`
2. How does the program join an IAM role to its record?
    a. By its ARN in the CMDB
    b. By four tags: `SystemId`, `Owner1`, `Owner2` and `Sponsor`, one key per owner
    c. By one `Owners` tag listing both owners, separated by commas
    d. SailPoint joins it, so no tags are needed
3. A role trusts GitHub's OIDC issuer with only an `aud` condition. What does Chapter 13 report?
    a. Nothing: the issuer is trusted
    b. NPI-AWS-09, a Finding: without a `sub` condition, workflows from repositories outside your control can assume the role
    c. NPI-AWS-12, `*` as the principal
    d. A Warn, because OIDC is temporary credentials
4. An OCI auth token has been in place for 582 days. Why is it a Finding?
    a. Auth tokens expire after 90 days
    b. Auth tokens never expire, so it's a long-lived secret with no exception
    c. OCI doesn't allow auth tokens
    d. It isn't: only API keys are checked
5. Step 1g's export has no `iam-tags.json`. What does the kit do?
    a. Passes every role, because none is missing a tag
    b. Fails the run
    c. Runs, lists the file as not read, and raises one NPI-AWS-08 Warn for the account
    d. Calls `list-role-tags` itself

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Taught in Chapter 13's [What AWS, Oracle and Microsoft say](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#what-aws-oracle-and-microsoft-say).
2. **b.** Taught in the guide's [Step 1h](../../books/guides/non-person-identity-implementation.md#step-1h-oci) join and Chapter 13's [inputs](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#the-inputs) ([WD-172](../../about/decision-register.md#wd-172)); AWS tag values allow no comma or semicolon.
3. **b.** Taught in Chapter 13's [checks](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#the-code-what-examplesnon-person-identity-adds); Lab 1, step 4.
4. **b.** Taught in Chapter 13's [What AWS, Oracle and Microsoft say](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#what-aws-oracle-and-microsoft-say): auth tokens and customer secret keys don't expire (NPI-OCI-04).
5. **c.** Taught in Lab 1, step 5: a missing file is a Warn, never a Pass, and the kit never calls AWS.
:::

## Summary (2 minutes)

The program's AWS GovCloud (US) and OCI workload identities follow the track's rules: every one listed from read-only exports, joined to a record by four tags, its long-lived credentials exceptions with a date, its trusts named down to the workload, its unknowns kept as unknowns. Chapter 13 checks the exports on every run, VK-NPI-10 reports the gate's criteria, and the evidence names the control each row supports. Next: [the learning path's index](index.md).
