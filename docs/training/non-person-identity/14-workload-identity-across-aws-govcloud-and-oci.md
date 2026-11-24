---
title: "Module 14: Workload identity across AWS GovCloud (US) and OCI"
description: "The implementation guide's AWS GovCloud (US) and OCI steps (1g, 1h and 4f) with the developer workbook's Chapter 13: export each account's and tenancy's workload identities with read-only commands, join each one to its record by the SystemId, Owner1, Owner2 and Sponsor tags, treat every access key, API signing key, auth token and customer secret key as an exception with a replace-by date, check OIDC trusts for a subject condition and IAM Roles Anywhere trust anchors for an imported CRL, read dynamic groups and policies for reach; a lab on the kit's fixtures, the federal requirements and evidence, and a knowledge check."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04, 13"
series-order: 14
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

Work in `examples/non-person-identity`. These are Chapter 13's [Lab 1](../../project-plans/developer-workbooks/non-person-identity/13-workload-identity-across-aws-govcloud-and-oci.md#lab-1-fixtures-no-account-or-tenancy) steps; the chapter shows each one's expected output. The fixtures are one fictional GovCloud account (`111122223333`, partition `aws-us-gov`) and one fictional OC2 tenancy.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
./Invoke-NpiCloudWorkload.ps1 -AwsPath tests/fixtures/ch13/aws -OciPath tests/fixtures/ch13/oci -SettingsPath tests/fixtures/ch13/settings.json -ExceptionsPath tests/fixtures/ch13/exceptions.csv -OutputPath out/cloud-workload -AsOf 2026-11-24

Get-Content out/cloud-workload/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object

Import-Csv out/cloud-workload/credentials.csv | Format-Table Cloud, Identity, Kind, AgeDays, LastUsedOn, Exception

Get-Content out/cloud-workload/identities.json -Raw | ConvertFrom-Json | Where-Object Joined -EQ 'no' | Format-Table Cloud, Type, Name, WorkloadKind
(Get-Content out/cloud-workload/trust.json -Raw | ConvertFrom-Json | Where-Object Object -EQ 'ci-pipeline-oidc').Principals | Format-List type, value, kind, conditions

Copy-Item -Recurse tests/fixtures/ch13/aws out/aws-min
Remove-Item out/aws-min/iam-tags.json, out/aws-min/roles-anywhere-crls.json
./Invoke-NpiCloudWorkload.ps1 -AwsPath out/aws-min -SettingsPath tests/fixtures/ch13/settings.json -OutputPath out/cloud-workload-min -AsOf 2026-11-24

(Get-Content out/cloud-workload/evidence.json -Raw | ConvertFrom-Json).rows | Format-Table step, control, evidence, @{ n = 'ksi'; e = { $_.ksi -join ', ' } }

Invoke-Pester -Path tests-ch13/NpiCloudWorkload.Tests.ps1

Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

**Step 1: Run the checks on the fixtures.**

```powershell
./Invoke-NpiCloudWorkload.ps1 -AwsPath tests/fixtures/ch13/aws -OciPath tests/fixtures/ch13/oci -SettingsPath tests/fixtures/ch13/settings.json -ExceptionsPath tests/fixtures/ch13/exceptions.csv -OutputPath out/cloud-workload -AsOf 2026-11-24
```

Look for `Findings: 24 Finding, 11 Warn, 2 Info` and `Long-lived credentials: 7 AWS, 5 OCI; 2 under a current exception`.

**Step 2: Read the findings.**

```powershell
Get-Content out/cloud-workload/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object
```

Find `svc-report-export`: which four rules does it trip, and what does each one mean? Then find `dg-everything`: no tags, no policy names it, and its rule matches the whole tenancy.

**Step 3: Read the long-lived credentials.**

```powershell
Import-Csv out/cloud-workload/credentials.csv | Format-Table Cloud, Identity, Kind, AgeDays, LastUsedOn, Exception
```

Which two credentials are under an exception? Why does `svc-app-sync`'s key show as a Warn in step 2, not a Finding?

**Step 4: Read who isn't joined to a record, and one trust.**

```powershell
Get-Content out/cloud-workload/identities.json -Raw | ConvertFrom-Json | Where-Object Joined -EQ 'no' | Format-Table Cloud, Type, Name, WorkloadKind
(Get-Content out/cloud-workload/trust.json -Raw | ConvertFrom-Json | Where-Object Object -EQ 'ci-pipeline-oidc').Principals | Format-List type, value, kind, conditions
```

`ci-pipeline-oidc` has only an `aud` condition. Who could present a token for it?

**Step 5: Run without the two optional files.**

```powershell
Copy-Item -Recurse tests/fixtures/ch13/aws out/aws-min
Remove-Item out/aws-min/iam-tags.json, out/aws-min/roles-anywhere-crls.json
./Invoke-NpiCloudWorkload.ps1 -AwsPath out/aws-min -SettingsPath tests/fixtures/ch13/settings.json -OutputPath out/cloud-workload-min -AsOf 2026-11-24
```

Look for `Not read: aws/iam-tags.json, aws/roles-anywhere-crls.json`, one NPI-AWS-08 Warn for the account, and an NPI-AWS-14 Warn for each trust anchor. A missing file is a Warn, never a Pass.

**Step 6: Read the evidence.**

```powershell
(Get-Content out/cloud-workload/evidence.json -Raw | ConvertFrom-Json).rows | Format-Table step, control, evidence, @{ n = 'ksi'; e = { $_.ksi -join ', ' } }
```

Match each row to the federal requirement table in the introduction.

**Step 7: Run the tests.**

```powershell
Invoke-Pester -Path tests-ch13/NpiCloudWorkload.Tests.ps1
```

Look for `Tests Passed: 34, Failed: 0`.

**Step 8: Clean up.**

```powershell
Remove-Item -Recurse -Force out
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
