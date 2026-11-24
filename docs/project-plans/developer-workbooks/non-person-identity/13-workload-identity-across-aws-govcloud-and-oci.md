---
title: "Chapter 13 — Workload Identity Across AWS GovCloud (US) and OCI"
description: "Check the program's AWS GovCloud (US) account and OCI (OC2) tenancy workload identities from the files the implementation guide's Steps 1g and 1h export: every active IAM access key, service-specific credential, OCI API signing key, auth token and customer secret key with its age, last use and exception; roles, IAM users, OCI users and dynamic groups with no system ID, two owners and a sponsor; roles that trust an OIDC provider with no subject condition, an outside account or anyone; IAM Roles Anywhere trust anchors with no imported CRL; and dynamic groups and policy statements that reach too far. Read only and offline: the kit never runs the AWS CLI or the OCI CLI. Lab 1 runs on fixtures; Lab 2 on a test account's and tenancy's exports, with an evidence record per step mapped to NIST SP 800-53 controls and FedRAMP 20x KSIs."
doc-type: workbook-chapter
audience: [Technical]
family: dw-non-person-identity
part: How
series-order: 13
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: 3df3d087d4685063fa1489e978b2220abb1ae3a77b70110187788fb60deffc5b
last-reviewed: 2026-11-24
---
# Chapter 13 — Workload Identity Across AWS GovCloud (US) and OCI

*A workload in AWS or OCI that holds an access key is a service account with a password that never expires, in a console nobody in identity governance opens. This chapter reads both clouds' exports with the same rules as the rest of the track.*

::: {.callout-note}
## In this chapter
The code half of the implementation guide's AWS GovCloud (US) and OCI steps ([1g](../../../books/guides/non-person-identity-implementation.md#step-1g-aws), [1h](../../../books/guides/non-person-identity-implementation.md#step-1h-oci), [4f](../../../books/guides/non-person-identity-implementation.md#step-4f-aws-oci) and the [orphan rule](../../../books/guides/non-person-identity-implementation.md#orphans)), which the program added to the Non-Person Identity track on November 24, 2026 ([WD-171](../../../about/decision-register.md#wd-171)). An operator runs the guide's read-only export commands in each account and tenancy. This chapter reads those files and reports every long-lived credential, every identity that isn't joined to a record, and every trust that reaches further than its workload needs. It never runs the AWS CLI or the OCI CLI, and it writes nothing to either cloud. Lab 1 runs on fixtures; Lab 2 reads a test account's and a test tenancy's exports.
:::

## Goal and audience

**Goal.** By the end of this chapter you can produce, from the guide's exports and a reviewed settings file, the G1, G3, G4 and G6 evidence for the program's AWS GovCloud (US) and OCI workload identities: which identities exist and who owns them, which long-lived credentials remain and under what exception, and which trusts and grants are too broad, each with an `evidence.json` row naming the control it provides evidence for and the KSIs aligned with it.

**Audience.** The cloud engineers who run the exports in each AWS account and the OCI tenancy; the identity engineers who own the track's findings; and the ISSO who reads the evidence.

## What AWS, Oracle and Microsoft say

The rules come from the vendors, through the guide. This chapter adds no new rule; it checks the ones the guide sets.

- **The target is temporary credentials.** AWS says to require workloads to use temporary credentials with IAM roles and, where possible, not to create long-term credentials such as access keys.[^np13-aws-bp] Oracle recommends instance principals when software needs to call OCI, and rotating IAM passwords and API keys every 90 days or less.[^np13-oci-rules] The program makes every long-lived credential an exception under [Book 13, Chapter 14](../../../books/b13-governance/14-application-secret-and-configuration-governance.md#secrets-governance) with a replacement date ([WD-171](../../../about/decision-register.md#wd-171)).
- **What the credential report covers.** AWS's credential report lists every IAM user with its console password, its first two access keys (active, when last rotated, when last used) and its signing certificates. It leaves out service-specific credentials (such as CodeCommit passwords and Amazon Bedrock or CloudWatch Logs long-term API keys) and any access key beyond the first two, which AWS points to `ListServiceSpecificCredentials` and `ListAccessKeys` for. A field that doesn't apply reads `N/A`, a password never used `no_information`.[^np13-aws-credreport]
- **What the list calls leave out.** `ListRoles` doesn't return a role's tags or when it was last used, and `ListUsers` doesn't return a user's tags; `ListRoleTags` and `ListUserTags` do.[^np13-aws-tags] The guide joins every AWS identity to its record by tag (Step 1f), so Lab 2 adds the two tag reads to the guide's commands.
- **AWS GovCloud (US).** One IAM control plane, no global STS endpoint, no role that delegates access between a GovCloud account and a standard AWS account, and a root user with no console sign-in whose access keys come only through AWS Support. IAM Roles Anywhere is supported, but automatic revocation through CRL distribution points isn't: "import your CRLs instead".[^np13-aws-gov-iam] Roles Anywhere uses an imported CRL only for certificates from the same CA, and doesn't check an imported CRL's expiry date.[^np13-ra-revocation]
- **Trust policies.** An account in a trust policy's `Principal` is written as its ARN or its 12-digit ID, and the two behave the same. AWS strongly recommends against `*` as the principal of a resource-based policy with an Allow effect, "especially true for IAM role trust policies".[^np13-aws-principal] For OIDC federation, AWS's examples limit the token's `sub` claim to the one repository or workspace; without that condition, GitHub Actions from repositories outside your control can assume the role.[^np13-aws-oidc-role] A service-linked role sits under the path `/aws-service-role/`, and the linked service, not you, defines its permissions.[^np13-aws-slr]
- **OCI credentials.** A user can hold three API signing keys at a time; auth tokens and customer secret keys don't expire, two of each per user.[^np13-oci-creds] The list commands return each credential's OCID, never the secret.[^np13-oci-cli]
- **OCI workload principals.** An instance principal authenticates with certificates OCI creates and rotates; anyone who can sign in to the instance acts with its rights.[^np13-oci-instance] A function uses a resource principal.[^np13-oci-functions] Both are authorized through a dynamic group, whose matching rules (`ANY {...}` or `ALL {...}` over variables such as `instance.compartment.id`) decide its members; a dynamic group has no permissions until a policy names it.[^np13-oci-dg] A policy statement reads `Allow <subject> to <verb> <resource-type> in <location>`, `manage` includes all permissions for the resource, `all-resources` covers every resource in the compartment or tenancy, and `tenancy` covers the whole tenancy.[^np13-oci-policy] OKE workload identity is named in policy with `request.principal.type = 'workload'` and can't be used with dynamic groups.[^np13-oci-oke]
- **Oracle US Government Cloud.** The program's tenancy is in realm OC2, and Oracle says to make every IAM call against the home region.[^np13-oci-oc2]
- **Microsoft.** Entra accepts tokens from workloads in AWS through workload identity federation, and supports only issuers that sign with RS256.[^np13-wif] Whether a GovCloud account's outbound tokens work with Entra hasn't been tested by the program, so the guide uses that path only after a test ([WD-171](../../../about/decision-register.md#wd-171)). This chapter only reports OIDC trusts; it doesn't set any up.

Which identity holds a password, a certificate or neither, and CyberArk's part for each, are in the service accounts guide: [Passwords, certificates or neither](../../../books/guides/service-account-migration.md#credentials) and [CyberArk across the migration](../../../books/guides/service-account-migration.md#cyberark).

## Start with the vendors' own reads

AWS and Oracle each give a way to list what exists. Neither gives the program's view: one list, joined to owners, with every long-lived secret against its exception.

| What the vendor gives | What it leaves to you | What the kit adds |
|---|---|---|
| The IAM credential report: users, passwords, two access keys, certificates[^np13-aws-credreport] | Roles; keys beyond two; service-specific credentials; which report column is which key (the report names no key ID) | Reads `access-keys.json` and `service-specific-credentials.json` too, and joins each key to its report column by creation date (`access_key_N_last_rotated` is when the key was created), so a key's last use comes with its ID *(design guidance: the join is the kit's)* |
| `list-roles` with each trust policy[^np13-aws-tags] | Tags; which principal is a workload, an issuer, another account or anyone | Reads every Allow statement's principals and conditions into `trust.json`, names the workload kind (EC2, ECS task, Lambda, EKS Pod Identity, IRSA, Roles Anywhere, OIDC) and checks the `sub` condition, the account and the partition |
| IAM Access Analyzer's unused-access findings, charged per role and user analyzed[^np13-aws-aa] | Whether they run in GovCloud isn't stated on the pages read | Reports keys unused for 90 days from the credential report, at no charge; Access Analyzer stays an option once its GovCloud status is known |
| `oci iam user api-key list`, `auth-token list`, `customer-secret-key list` per user[^np13-oci-cli] | A view across users; ages; Oracle's 90-day rule; owners | One list of every active OCI credential with its age, checked against 90 days and the exception list |
| `oci iam dynamic-group list` and `policy list`[^np13-oci-cli] | Which policy names which group; groups that match a whole tenancy; `manage all-resources` grants | Joins policy statements to dynamic groups by name or OCID and checks both |

: What AWS's and Oracle's reads give, and what this chapter adds {.striped .hover}

## The inputs

The guide's Step 1g and 1h commands write the files; Lab 2 runs them. The kit reads the AWS files with the API's field names. The OCI CLI's reference pages show no output example, so its output field names (`time-created`, `timeCreated` or `time_created`) are not yet specified; the kit matches a field whatever its case, hyphens or underscores, and a test proves it reads both spellings the same.

| File | Written by | One item is |
|---|---|---|
| `aws/credential-report.csv` | Step 1g: `generate-credential-report`, `get-credential-report` | One IAM user, or the root user |
| `aws/access-keys.json` | Step 1g: `list-access-keys` per user | One access key: user, ID, status (`Active`, `Inactive`, `Expired`), created[^np13-aws-keys] |
| `aws/service-specific-credentials.json` | Step 1g: `list-service-specific-credentials --all-users` | One service-specific credential, with an expiry date where it has one[^np13-aws-ssc] |
| `aws/roles.json` | Step 1g: `list-roles` | One role and its trust policy |
| `aws/instance-profiles.json` | Step 1g: `list-instance-profiles` | One instance profile and its role |
| `aws/oidc-providers.json` | Step 1g: `list-open-id-connect-providers` | One trusted OIDC issuer's ARN |
| `aws/roles-anywhere-trust-anchors.json`, `aws/roles-anywhere-profiles.json` | Step 1g: `rolesanywhere list-trust-anchors`, `list-profiles` | One trust anchor (its CA source); one profile (its roles)[^np13-ra-api] |
| `aws/iam-tags.json` *(optional)* | Lab 2, beyond the guide: `list-user-tags`, `list-role-tags` | One user's or role's tags |
| `aws/roles-anywhere-crls.json` *(optional)* | Lab 2, beyond the guide: `rolesanywhere list-crls` | One imported CRL and its trust anchor[^np13-ra-api] |
| `oci/oci-users.json` | Step 1h: `oci iam user list` | One user with its tags |
| `oci/oci-user-credentials.json` | Step 1h: `api-key list`, `auth-token list`, `customer-secret-key list` per user | One user's three credential lists |
| `oci/oci-dynamic-groups.json`, `oci/oci-policies.json` | Step 1h: `dynamic-group list`, `policy list` | One dynamic group and its matching rule; one policy and its statements |
| `settings.json` | You | The AWS account, partition, Region and the program's account IDs; the OC2 tenancy OCID and the defined-tag namespace; the tag keys for the system ID, two owners and the sponsor |
| `exceptions.csv` *(optional)* | The exception register | One recorded exception: cloud, credential ID (the access key ID, credential ID, API key fingerprint or OCID), exception record, replace-by date |

: The inputs {.striped .hover}

The tag keys are the program's *(design guidance)*: `SystemId`, `Owner1`, `Owner2` and `Sponsor` on every role, workload IAM user, OCI user holding a credential and dynamic group, as Step 1f asks for two owners and a sponsor. AWS tag values can't hold a list separator, so each owner gets a key. In OCI they're read from freeform tags or from the settings' defined-tag namespace.

## The code: what `examples/non-person-identity` adds

`Invoke-NpiCloudWorkload.ps1` and the module `powershell/NpiCloudWorkload` add one read-only task, `cloud-workload`. `config/calls-ch13.json` declares the export commands an operator runs, every one a `generate`, `get` or `list`; the module runs none of them, and a test fails if its code ever calls `aws` or `oci` or makes a web request. Its controls and KSIs per step are in `config/requirements-ch13.json`. Every run writes a folder with `findings.json`, `identities.json`, `credentials.csv` (identifiers only, never a secret), `trust.json`, `evidence.json` and a `manifest.json` with each input's SHA-256, the export commands the inputs came from and any optional file not read. The same inputs and `-AsOf` date give byte-identical files.

| Check | Findings | What it reports |
|---|---|---|
| AWS long-lived credentials | NPI-AWS-01 to -07 | Every active access key with its age and last use, a Finding with no exception and a Warn under a current one (01); two active keys on one user (02); a key unused, or never used, for 90 days *(design guidance, the guide's inactivity window)* (03); a console password on a user that holds an active key (04); an active service-specific credential, a Warn when it has an expiry date (05); an active signing certificate (06); an active root user access key (07) |
| AWS owners and trust | NPI-AWS-08 to -13 | A role or workload IAM user missing the system ID, either owner or the sponsor, never a service-linked role; one Warn when `iam-tags.json` wasn't read (08); an OIDC trust with no `sub` condition (Finding) or a wildcard one (Warn) (09); an OIDC provider no role trusts, or a role trusting one that isn't listed (10); a trusted account outside the program's list (11); `*` as the principal (12); a principal in another partition, which AWS says a GovCloud role can't trust (13) |
| IAM Roles Anywhere and instance profiles | NPI-AWS-14 to -16 | An enabled trust anchor with no enabled imported CRL, a Warn when the CRLs weren't read (14); a profile naming a role that doesn't exist (15); an instance profile with no role (16, Info) |
| OCI credentials | NPI-OCI-01 to -05 | Every active API signing key, a Finding with no exception and a Warn under a current one (01); one older than Oracle's 90 days (02); more than one active (03); an active auth token (04) or customer secret key (05), which never expire |
| OCI owners, groups and policies | NPI-OCI-06 to -10 | A user holding a credential, or a dynamic group, missing the program's tags (06); a dynamic group no policy read names (07); a matching rule that names the tenancy (08); a statement granting a dynamic group or workload `manage all-resources` (09); OKE workload identity statements, listed for the inventory (10, Info) |

: What Chapter 13 checks {.striped .hover}

A user that holds no long-lived credential and has a console password (in AWS), or holds no API key, auth token or customer secret key (in OCI), is treated as a person, or unknown, and left out of the owner checks *(design guidance)*. Human access to AWS, through IAM Identity Center permission sets, is [Book 04, Chapter 04](../../../books/b04-access/04-privileged-roles-and-tiers.md)'s subject.

**What it never does.** It runs no AWS or OCI command and calls no API. It deactivates no key, deletes no identity and changes no policy. The guide's [orphan rule](../../../books/guides/non-person-identity-implementation.md#orphans) disables first and a person acts; the findings say what to do, and a person does it.

## Lab 1: fixtures, no account or tenancy

You need PowerShell 7.1 or later with Pester 5. Work in `examples/non-person-identity`. The fixtures are one fictional GovCloud account (`111122223333`, partition `aws-us-gov`) and one fictional OC2 tenancy.

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

**Step 1: Run the checks on the fixtures.** Seven IAM users (one a person, one root), eleven roles and a service-linked one, three OIDC providers, two trust anchors and profiles; five OCI users, three dynamic groups and three policies, each built to trip one or more rules. Two credentials are under a recorded exception.

```powershell
./Invoke-NpiCloudWorkload.ps1 -AwsPath tests/fixtures/ch13/aws -OciPath tests/fixtures/ch13/oci -SettingsPath tests/fixtures/ch13/settings.json -ExceptionsPath tests/fixtures/ch13/exceptions.csv -OutputPath out/cloud-workload -AsOf 2026-11-24
```

<!-- capture:begin 13-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/npi/13-1.txt))](captures/13-1.png){.lightbox fig-alt="Terminal window showing ./Invoke-NpiCloudWorkload.ps1 -AwsPath tests/fixtures/ch13/aws -OciPath tests… and what it printed"}

<!-- capture:end -->

**Expected:** the summary, then one line per rule, then the manifest's SHA-256.

```text
As of 2026-11-24; AWS account 111122223333 (aws-us-gov): 7 IAM user(s), 11 role(s), 2 trust anchor(s); OCI tenancy (oc2): 5 user(s), 3 dynamic group(s)
Findings: 24 Finding, 11 Warn, 2 Info
Long-lived credentials: 7 AWS, 5 OCI; 2 under a current exception
Not read: nothing
  NPI-AWS-01  svc-app-sync, svc-ci-deploy, svc-legacy-ftp, svc-report-export
  ...
  NPI-OCI-10  hr-oke-workload
```

**Step 2: Read the findings.** Look for `svc-report-export`: two active keys (NPI-AWS-02), one of them never used, a console password beside them (NPI-AWS-04) and only one owner tagged (NPI-AWS-08). Then `dg-everything`: no tags, no policy names it, and its rule matches the whole tenancy.

```powershell
Get-Content out/cloud-workload/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object
```

<!-- capture:begin 13-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/npi/13-2.txt))](captures/13-2.png){.lightbox fig-alt="Terminal window showing Get-Content out/cloud-workload/findings.json -Raw | ConvertFrom-Json | Format… and what it printed"}

<!-- capture:end -->

**Step 3: Read the long-lived credentials.** One row per active access key, service-specific credential, API key, auth token and customer secret key, with its age, last use (AWS keys only) and exception. `svc-app-sync`'s key and `hr-report-reader`'s API key are under exceptions until 2027.

```powershell
Import-Csv out/cloud-workload/credentials.csv | Format-Table Cloud, Identity, Kind, AgeDays, LastUsedOn, Exception
```

<!-- capture:begin 13-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/npi/13-3.txt))](captures/13-3.png){.lightbox fig-alt="Terminal window showing Import-Csv out/cloud-workload/credentials.csv | Format-Table Cloud, Identity,… and what it printed"}

<!-- capture:end -->

**Step 4: Read who isn't joined to a record, and one trust.** `ci-pipeline-oidc` trusts GitHub's issuer with only an `aud` condition, so any repository's workflow could present a token for it (NPI-AWS-09).

```powershell
Get-Content out/cloud-workload/identities.json -Raw | ConvertFrom-Json | Where-Object Joined -EQ 'no' | Format-Table Cloud, Type, Name, WorkloadKind
(Get-Content out/cloud-workload/trust.json -Raw | ConvertFrom-Json | Where-Object Object -EQ 'ci-pipeline-oidc').Principals | Format-List type, value, kind, conditions
```

<!-- capture:begin 13-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/npi/13-4.txt))](captures/13-4.png){.lightbox fig-alt="Terminal window showing Get-Content out/cloud-workload/identities.json -Raw | ConvertFrom-Json | Wher… and what it printed"}

<!-- capture:end -->

**Step 5: Run without the two optional files.** The guide's commands alone don't write the tags or the CRLs. The kit still runs, and says what it couldn't check: one NPI-AWS-08 Warn for the account instead of a Finding per identity, and an NPI-AWS-14 Warn for each trust anchor.

```powershell
Copy-Item -Recurse tests/fixtures/ch13/aws out/aws-min
Remove-Item out/aws-min/iam-tags.json, out/aws-min/roles-anywhere-crls.json
./Invoke-NpiCloudWorkload.ps1 -AwsPath out/aws-min -SettingsPath tests/fixtures/ch13/settings.json -OutputPath out/cloud-workload-min -AsOf 2026-11-24
```

<!-- capture:begin 13-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/npi/13-5.txt))](captures/13-5.png){.lightbox fig-alt="Terminal window showing Copy-Item -Recurse tests/fixtures/ch13/aws out/aws-min and what it printed"}

<!-- capture:end -->

**Expected:** `Not read: aws/iam-tags.json, aws/roles-anywhere-crls.json`, and `svc-app-sync`'s key back to a Finding, because no exception list was given.

**Step 6: Read the evidence.** One row per step and control, with the KSIs aligned with it and the SHA-256 of the file that provides the evidence.

```powershell
(Get-Content out/cloud-workload/evidence.json -Raw | ConvertFrom-Json).rows | Format-Table step, control, evidence, @{ n = 'ksi'; e = { $_.ksi -join ', ' } }
```

<!-- capture:begin 13-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/npi/13-6.txt))](captures/13-6.png){.lightbox fig-alt="Terminal window showing (Get-Content out/cloud-workload/evidence.json -Raw | ConvertFrom-Json).rows |… and what it printed"}

<!-- capture:end -->

**Step 7: Run the tests.** They sit in `tests-ch13`, outside `tests`, so the count the other chapters' labs print doesn't change.

```powershell
Invoke-Pester -Path tests-ch13/NpiCloudWorkload.Tests.ps1
```

<!-- capture:begin 13-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/npi/13-7.txt))](captures/13-7.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests-ch13/NpiCloudWorkload.Tests.ps1 and what it printed"}

<!-- capture:end -->

**Expected:** `Tests Passed: 34, Failed: 0`.

**After the steps:**

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 13-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/npi/13-8.txt))](captures/13-8.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: test account and tenancy

Use one AWS GovCloud (US) account and one OCI tenancy that aren't production, with a role in the account that can read IAM and IAM Roles Anywhere, and a user or principal in the tenancy that can read IAM, as the guide's Steps 1g and 1h say. You need the AWS CLI and the OCI CLI signed in to them, in PowerShell 7. Lab 2 has not been run by anyone: no step's output below has been seen.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
New-Item -ItemType Directory -Force <exports>/aws, <exports>/oci | Out-Null
Copy-Item tests/fixtures/ch13/settings.json <exports>/settings.json
Get-Content tests/fixtures/ch13/exceptions.csv -TotalCount 1 | Set-Content <exports>/exceptions.csv
code <exports>/settings.json

$here = Get-Location
Set-Location <exports>/aws
$r = 'us-gov-west-1'
do { $state = (aws iam generate-credential-report --region $r --output json | ConvertFrom-Json).State; if ($state -ne 'COMPLETE') { Start-Sleep -Seconds 10 } } until ($state -eq 'COMPLETE')
$csv = aws iam get-credential-report --region $r --query Content --output text
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($csv)) | Set-Content credential-report.csv
$users = (aws iam list-users --region $r --output json | ConvertFrom-Json).Users
$users | ForEach-Object { (aws iam list-access-keys --user-name $_.UserName --region $r --output json | ConvertFrom-Json).AccessKeyMetadata } |
    ConvertTo-Json -Depth 4 | Set-Content access-keys.json
aws iam list-service-specific-credentials --all-users --region $r --output json > service-specific-credentials.json
aws iam list-roles --region $r --output json > roles.json
aws iam list-instance-profiles --region $r --output json > instance-profiles.json
aws iam list-open-id-connect-providers --region $r --output json > oidc-providers.json
aws rolesanywhere list-trust-anchors --region $r --output json > roles-anywhere-trust-anchors.json
aws rolesanywhere list-profiles --region $r --output json > roles-anywhere-profiles.json
$tags = @(
    foreach ($u in $users) { [pscustomobject]@{ Type = 'User'; Name = $u.UserName; Tags = @((aws iam list-user-tags --user-name $u.UserName --region $r --output json | ConvertFrom-Json).Tags) } }
    foreach ($ro in (Get-Content roles.json -Raw | ConvertFrom-Json).Roles) { [pscustomobject]@{ Type = 'Role'; Name = $ro.RoleName; Tags = @((aws iam list-role-tags --role-name $ro.RoleName --region $r --output json | ConvertFrom-Json).Tags) } }
)
ConvertTo-Json -InputObject $tags -Depth 5 | Set-Content iam-tags.json
aws rolesanywhere list-crls --region $r --output json > roles-anywhere-crls.json
Set-Location $here

$here = Get-Location
Set-Location <exports>/oci
$users = (oci iam user list --all | ConvertFrom-Json).data
$users | ConvertTo-Json -Depth 5 | Set-Content oci-users.json
$creds = foreach ($u in $users) {
    [pscustomobject]@{
        User               = $u.name
        ApiKeys            = (oci iam user api-key list --user-id $u.id | ConvertFrom-Json).data
        AuthTokens         = (oci iam auth-token list --user-id $u.id | ConvertFrom-Json).data
        CustomerSecretKeys = (oci iam customer-secret-key list --user-id $u.id | ConvertFrom-Json).data
    }
}
$creds | ConvertTo-Json -Depth 6 | Set-Content oci-user-credentials.json
oci iam dynamic-group list > oci-dynamic-groups.json
oci iam policy list --compartment-id <tenancy-ocid> > oci-policies.json
Set-Location $here

./Invoke-NpiCloudWorkload.ps1 -AwsPath <exports>/aws -OciPath <exports>/oci -SettingsPath <exports>/settings.json -ExceptionsPath <exports>/exceptions.csv -OutputPath out/cloud-workload-test

Get-Content out/cloud-workload-test/findings.json -Raw | ConvertFrom-Json | Sort-Object Rule | Format-Table Rule, Severity, Object
(Get-Content out/cloud-workload-test/manifest.json -Raw | ConvertFrom-Json).exportCommands | Format-Table call, command

Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

The values you supply: `<exports>` (a folder outside the repository for this lab's files), `<tenancy-ocid>` (the tenancy's OCID), and in `settings.json` the account ID, the program's account IDs, the tenancy OCID and the defined-tag namespace.

**Step 1: Write the settings and an empty exception list.**

```powershell
New-Item -ItemType Directory -Force <exports>/aws, <exports>/oci | Out-Null
Copy-Item tests/fixtures/ch13/settings.json <exports>/settings.json
Get-Content tests/fixtures/ch13/exceptions.csv -TotalCount 1 | Set-Content <exports>/exceptions.csv
code <exports>/settings.json
```

Edit `settings.json` in the editor that opened. Add a row to `exceptions.csv` for each credential the exception register already covers.

**Step 2: Export the AWS account.** These are the guide's Step 1g commands, with the credential report's wait written as a loop, then the two reads the guide doesn't have: the tags (`ListUsers` and `ListRoles` return none) and the imported CRLs.

```powershell
$here = Get-Location
Set-Location <exports>/aws
$r = 'us-gov-west-1'
do { $state = (aws iam generate-credential-report --region $r --output json | ConvertFrom-Json).State; if ($state -ne 'COMPLETE') { Start-Sleep -Seconds 10 } } until ($state -eq 'COMPLETE')
$csv = aws iam get-credential-report --region $r --query Content --output text
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($csv)) | Set-Content credential-report.csv
$users = (aws iam list-users --region $r --output json | ConvertFrom-Json).Users
$users | ForEach-Object { (aws iam list-access-keys --user-name $_.UserName --region $r --output json | ConvertFrom-Json).AccessKeyMetadata } |
    ConvertTo-Json -Depth 4 | Set-Content access-keys.json
aws iam list-service-specific-credentials --all-users --region $r --output json > service-specific-credentials.json
aws iam list-roles --region $r --output json > roles.json
aws iam list-instance-profiles --region $r --output json > instance-profiles.json
aws iam list-open-id-connect-providers --region $r --output json > oidc-providers.json
aws rolesanywhere list-trust-anchors --region $r --output json > roles-anywhere-trust-anchors.json
aws rolesanywhere list-profiles --region $r --output json > roles-anywhere-profiles.json
$tags = @(
    foreach ($u in $users) { [pscustomobject]@{ Type = 'User'; Name = $u.UserName; Tags = @((aws iam list-user-tags --user-name $u.UserName --region $r --output json | ConvertFrom-Json).Tags) } }
    foreach ($ro in (Get-Content roles.json -Raw | ConvertFrom-Json).Roles) { [pscustomobject]@{ Type = 'Role'; Name = $ro.RoleName; Tags = @((aws iam list-role-tags --role-name $ro.RoleName --region $r --output json | ConvertFrom-Json).Tags) } }
)
ConvertTo-Json -InputObject $tags -Depth 5 | Set-Content iam-tags.json
aws rolesanywhere list-crls --region $r --output json > roles-anywhere-crls.json
Set-Location $here
```

**Step 3: Export the OCI tenancy.** These are the guide's Step 1h commands, run against the tenancy's home region.

```powershell
$here = Get-Location
Set-Location <exports>/oci
$users = (oci iam user list --all | ConvertFrom-Json).data
$users | ConvertTo-Json -Depth 5 | Set-Content oci-users.json
$creds = foreach ($u in $users) {
    [pscustomobject]@{
        User               = $u.name
        ApiKeys            = (oci iam user api-key list --user-id $u.id | ConvertFrom-Json).data
        AuthTokens         = (oci iam auth-token list --user-id $u.id | ConvertFrom-Json).data
        CustomerSecretKeys = (oci iam customer-secret-key list --user-id $u.id | ConvertFrom-Json).data
    }
}
$creds | ConvertTo-Json -Depth 6 | Set-Content oci-user-credentials.json
oci iam dynamic-group list > oci-dynamic-groups.json
oci iam policy list --compartment-id <tenancy-ocid> > oci-policies.json
Set-Location $here
```

`oci iam policy list` reads the one compartment it's given, so a policy in a child compartment that names a dynamic group isn't in this file, and that group shows as NPI-OCI-07. Add each such compartment's policies to the file's `data` list, or record why the group has none.

**Step 4: Run the checks on the exports.**

```powershell
./Invoke-NpiCloudWorkload.ps1 -AwsPath <exports>/aws -OciPath <exports>/oci -SettingsPath <exports>/settings.json -ExceptionsPath <exports>/exceptions.csv -OutputPath out/cloud-workload-test
```

**Expected:** the summary as in Lab 1 for the test account and tenancy, with `Not read: nothing`. Look at the OCI findings first: if every OCI user shows as having no credentials while the console shows keys, the CLI's field names differ from those the kit reads; record what they are (research gap, row 124).

**Step 5: Read the findings and what the manifest records.**

```powershell
Get-Content out/cloud-workload-test/findings.json -Raw | ConvertFrom-Json | Sort-Object Rule | Format-Table Rule, Severity, Object
(Get-Content out/cloud-workload-test/manifest.json -Raw | ConvertFrom-Json).exportCommands | Format-Table call, command
```

**Expected:** an empty `requests` list in the manifest (the kit called nothing) and the fourteen export commands.

**After the steps:** the exports hold account IDs, ARNs, OCIDs and key IDs, never a secret. Keep them with the run's evidence, not in the repository, or delete them with the output:

```powershell
Remove-Item -Recurse -Force out
```

## Verified facts

| Fact | Source |
|---|---|
| Require workloads to use temporary credentials with IAM roles; where possible, don't create access keys; last accessed information shows unused credentials | [^np13-aws-bp] |
| The credential report's 23 columns, `N/A`, `no_information` and `not_supported`; it leaves out service-specific credentials and keys beyond the first two | [^np13-aws-credreport] |
| `ListRoles` doesn't return tags, the permissions boundary or `RoleLastUsed`; `ListUsers` doesn't return tags; `ListRoleTags` and `ListUserTags` return them | [^np13-aws-tags] |
| An access key's status is `Active`, `Inactive` or `Expired` | [^np13-aws-keys] |
| `ListServiceSpecificCredentials` has an `AllUsers` flag; `ExpirationDate` is set only for Bedrock and CloudWatch Logs API keys created with an expiry | [^np13-aws-ssc] |
| GovCloud: no global STS endpoint; no role between a GovCloud and a standard account; the root user; IAM Roles Anywhere supported, CRL distribution point revocation not, import CRLs instead | [^np13-aws-gov-iam] |
| Roles Anywhere: imported CRLs apply to the same CA's certificates; their expiry isn't checked; `crlDpRevocationEnabled` is off by default | [^np13-ra-revocation] |
| `ListTrustAnchors`, `ListProfiles` and `ListCrls` return `trustAnchors`, `profiles` and `crls`, each CRL with its `trustAnchorArn` and `enabled` | [^np13-ra-api] |
| An account principal as ARN or ID; don't use `*` in a role trust policy | [^np13-aws-principal] |
| Limit an OIDC role's `sub` condition (AWS's GitHub and HCP Terraform examples) | [^np13-aws-oidc-role] |
| Service-linked roles sit under `/aws-service-role/`; you can view but not edit their permissions | [^np13-aws-slr] |
| An instance profile holds roles; `ListOpenIDConnectProviders` returns each provider's ARN | [^np13-aws-ip] |
| IAM Access Analyzer's unused-access findings are charged per role and user analyzed | [^np13-aws-aa] |
| Three API keys per OCI user; auth tokens and customer secret keys don't expire, two each | [^np13-oci-creds] |
| Use instance principals; rotate API keys every 90 days or less | [^np13-oci-rules] |
| `oci iam user list` and `dynamic-group list` default to the tenancy; `policy list` needs `--compartment-id`; the credential lists return OCIDs, not secrets; no page shows an output example | [^np13-oci-cli] |
| The SDK's models name the fields: an API key's `fingerprint`, `key_id`, `time_created`, `lifecycle_state`; an auth token's `time_expires`, null if it never expires; a dynamic group's `matching_rule` and tags; a policy's `statements` | [^np13-oci-sdk] |
| Matching rule syntax; no permissions until a policy names the group | [^np13-oci-dg] |
| Policy syntax; `manage` includes all permissions; `all-resources`; `tenancy` | [^np13-oci-policy] |
| Instance principals, resource principals and OKE workload identity; OC2 home-region IAM | [^np13-oci-instance] [^np13-oci-functions] [^np13-oci-oke] [^np13-oci-oc2] |
| Entra supports only RS256-signed issuer tokens for workload identity federation, and lists workloads in AWS | [^np13-wif] |

: Verified facts (read November 24, 2026) {.striped .hover}

**Not yet specified.** These are open, and the kit doesn't assume an answer:

- **AWS GovCloud (US) and Entra, either way.** AWS documents GovCloud for outbound federation across AWS partitions, not to an outside relying party such as Entra; no page read walks through a customer Entra tenant federating into a GovCloud account. The guide uses either path only after a test ([WD-171](../../../about/decision-register.md#wd-171)).
- **IAM Access Analyzer's unused-access findings in GovCloud.** The GovCloud IAM page says policy generation isn't available and names no other gap; whether unused-access findings run there isn't stated. The kit's NPI-AWS-03 doesn't depend on it.
- **Instance principals, resource principals and OKE workload identity in OC2.** Oracle's OC2 page doesn't address them. Confirm them for the program's tenancy.
- **The OCI CLI's output field names.** Not shown on the CLI reference pages; the kit reads any spelling, and Lab 2, step 4 records what the CLI prints.
- **Which credential report column is which key.** The report names no key ID; the kit joins by creation date. A key with no matching column gets "last used unknown".
- **Users in an identity domain.** Whether `oci iam user list` returns every identity domain's users in a tenancy that has identity domains isn't stated on the page read; identity domains apply to OC2 tenancies created after January 17, 2023.[^np13-oci-oc2]

## Federal requirements and evidence

KSIs come from [Book 13, Appendix A](../../../books/b13-governance/appendix-a-requirements-mapping.md#controls-behind-service-accounts-and-other-non-person-identities), re-read from FedRAMP on November 20, 2026 ([WD-169](../../../about/decision-register.md#wd-169)), and the controls from the guide's [evidence table](../../../books/guides/non-person-identity-implementation.md#evidence). The kit writes each row to `evidence.json`.

| What the output shows | Requirement it supports | KSIs aligned | Evidence the ISSO keeps |
|---|---|---|---|
| Every AWS and OCI workload identity is listed with its kind and whether it's joined to a record with two owners and a sponsor (`identities.json`) | AC-2 Account Management; CM-8 System Component Inventory; IA-4 Identifier Management | KSI-IAM-SNU (with APM, JIT, SUS); KSI-PIY-GIV; KSI-IAM-ELP, IAM-JIT | `identities.json` and the exports it read, by their SHA-256 in the manifest |
| Every long-lived credential is listed with its age, last use and exception (`credentials.csv`) | IA-5 Authenticator Management | KSI-IAM-APM | `credentials.csv` and the exception records it names |
| Every Roles Anywhere trust anchor has its CA and its imported CRLs (`trust.json`) | IA-5(2) Public Key-Based Authentication; SC-17 Public Key Infrastructure Certificates | KSI-IAM-APM, IAM-ELP, IAM-SNU, SVC-ASM; KSI-SVC-ASM | `trust.json` and the CRL import record |
| Every role's, dynamic group's and workload statement's trust and reach (`trust.json`) | AC-6 Least Privilege | KSI-IAM-ELP, IAM-JIT | `trust.json` and the owner's justification for each Finding kept |
| Unused keys, unowned identities and unused issuers are orphan leads (`findings.json`) | AC-2(3) Disable Accounts | KSI-IAM-AAM, IAM-JIT, IAM-SUS | `findings.json` and the orphan or decommission ticket |
| The code passes its tests (Lab 1, step 7, 34 passed) | CM-3(2) Testing, Validation, and Documentation of Changes | KSI-CMT-VTD | The repository and the pull request's checks |

: What Chapter 13's output provides evidence for {.striped .hover}

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines its own evidence up with what its providers report against them; it doesn't report KSIs itself. A row provides evidence for a control; the assessor decides whether the control is satisfied.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| An access key nobody listed, beyond the report's first two, or a CodeCommit password | It stays out of every review | `access-keys.json` and `service-specific-credentials.json` are required inputs; NPI-AWS-01 and -05 read them, not the report |
| The tag export skipped | Every role looks fine because none was checked | NPI-AWS-08 warns once that tags weren't read; the manifest's `notRead` lists the file |
| An OIDC role that trusts a whole issuer | Any workload the issuer signs for can assume it | NPI-AWS-09 on every OIDC trust without a `sub` condition |
| A revoked certificate still working through Roles Anywhere | GovCloud can't fetch CRLs from the certificate, so revocation waits for an import | NPI-AWS-14; put CRL imports on the certificate calendar, and remember Roles Anywhere doesn't check an imported CRL's expiry |
| An OCI auth token or customer secret key left in place | It never expires | NPI-OCI-04 and -05 until an exception with a date exists, then a Warn until that date |
| A dynamic group matching the whole tenancy | Every instance becomes a member, and anyone who can sign in to one acts with its rights | NPI-OCI-08; narrow the rule to a compartment or tag |
| An OCI CLI version that prints other field names | Checks read empty fields and pass | Field names are matched whatever their spelling; Lab 2, step 4 says what to look for |
| An export committed to the repository | Account IDs, ARNs and OCIDs published | Lab 2 writes outside the repository; the exports hold no secret, but keep them with the evidence |

## Checklist

- [ ] The guide's Step 1g exports, the tag export and the CRL export run in every AWS GovCloud (US) account; Step 1h runs in the tenancy's home region.
- [ ] Every role, workload IAM user, OCI user holding a credential and dynamic group carries `SystemId`, two owners and a sponsor, or is in an orphan ticket (NPI-AWS-08, NPI-OCI-06).
- [ ] Every active long-lived credential has an exception with a replacement date in the exception register, or a ticket to replace it (NPI-AWS-01, -05; NPI-OCI-01, -04, -05).
- [ ] No OCI API key is older than 90 days (NPI-OCI-02), and no user holds a second active key or access key outside a rotation (NPI-AWS-02, NPI-OCI-03).
- [ ] No root user access key is active (NPI-AWS-07).
- [ ] Every OIDC trust names its workload in a `sub` condition (NPI-AWS-09); every outside account, `*` and other-partition principal is removed or justified (NPI-AWS-11 to -13).
- [ ] Every enabled Roles Anywhere trust anchor has an imported CRL, refreshed on the certificate calendar (NPI-AWS-14).
- [ ] No dynamic group matches the whole tenancy or holds `manage all-resources` without a recorded reason (NPI-OCI-08, -09).
- [ ] Each run's `evidence.json` and `manifest.json` are filed with the change record.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 12 — The Managed Service Account Standard](12-the-managed-service-account-standard.md) · [Workbook index](index.md) · [The implementation guide's AWS and OCI steps](../../../books/guides/non-person-identity-implementation.md#step-1g-aws)
:::

[^np13-aws-bp]: AWS, IAM User Guide, "Security best practices in IAM" (require workloads to use temporary credentials with IAM roles; rely on temporary credentials instead of access keys where possible; last accessed information), <https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html> (accessed Nov 24, 2026).
[^np13-aws-credreport]: AWS, IAM User Guide, "Generate credential reports" (columns, including `additional_credentials_info`; `N/A`, `no_information`, `not_supported`; leaves out service-specific credentials and access keys beyond the first two), <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_getting-report.html> (accessed Nov 24, 2026).
[^np13-aws-tags]: AWS, IAM API Reference, "ListRoles" and "ListUsers" (attributes not returned: tags, and for roles the permissions boundary and `RoleLastUsed`), "ListRoleTags" and "ListUserTags", <https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListRoles.html>, <https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListUsers.html>, <https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListRoleTags.html>, <https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListUserTags.html> (accessed Nov 24, 2026).
[^np13-aws-keys]: AWS, IAM API Reference, "AccessKeyMetadata" (`AccessKeyId`, `CreateDate`, `Status`: `Active`, `Inactive` or `Expired`; `UserName`), <https://docs.aws.amazon.com/IAM/latest/APIReference/API_AccessKeyMetadata.html> (accessed Nov 24, 2026).
[^np13-aws-ssc]: AWS, IAM API Reference, "ListServiceSpecificCredentials" (`AllUsers`) and "ServiceSpecificCredentialMetadata" (`ExpirationDate` for Bedrock and CloudWatch Logs API keys created with an expiry), <https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListServiceSpecificCredentials.html>, <https://docs.aws.amazon.com/IAM/latest/APIReference/API_ServiceSpecificCredentialMetadata.html> (accessed Nov 24, 2026).
[^np13-aws-gov-iam]: AWS, AWS GovCloud (US) User Guide, "AWS Identity and Access Management in AWS GovCloud (US)" (no global STS endpoint; no role between a GovCloud and a standard account; the root user; IAM Roles Anywhere supported, automatic revocation through CRL distribution points not available, import CRLs instead; no Access Analyzer policy generation), <https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-iam.html> (accessed Nov 24, 2026).
[^np13-ra-revocation]: AWS, IAM Roles Anywhere User Guide, "Trust model," revocation (imported CRLs; same CA only; expiry not checked; `crlDpRevocationEnabled` off by default), <https://docs.aws.amazon.com/rolesanywhere/latest/userguide/trust-model.html#revocation> (accessed Nov 24, 2026).
[^np13-ra-api]: AWS, IAM Roles Anywhere API Reference, "ListTrustAnchors," "ListProfiles" and "ListCrls," and the AWS CLI's `rolesanywhere list-crls`, <https://docs.aws.amazon.com/rolesanywhere/latest/APIReference/API_ListTrustAnchors.html>, <https://docs.aws.amazon.com/rolesanywhere/latest/APIReference/API_ListProfiles.html>, <https://docs.aws.amazon.com/rolesanywhere/latest/APIReference/API_ListCrls.html>, <https://docs.aws.amazon.com/cli/latest/reference/rolesanywhere/list-crls.html> (accessed Nov 24, 2026).
[^np13-aws-principal]: AWS, IAM User Guide, "AWS JSON policy elements: Principal" (account principals; don't use `*` with an Allow effect, especially in role trust policies; "Do not leave your role accessible to everyone"), <https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html> (accessed Nov 24, 2026).
[^np13-aws-oidc-role]: AWS, IAM User Guide, "Create a role for OpenID Connect federation" (limit the `sub` condition key; GitHub and HCP Terraform examples), <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html> (accessed Nov 24, 2026).
[^np13-aws-slr]: AWS, IAM User Guide, "Using service-linked roles" (the `/aws-service-role/` path in its ARNs; you can view but not edit their permissions), <https://docs.aws.amazon.com/IAM/latest/UserGuide/using-service-linked-roles.html> (accessed Nov 24, 2026).
[^np13-aws-ip]: AWS, IAM API Reference, "InstanceProfile" and "ListOpenIDConnectProviders," <https://docs.aws.amazon.com/IAM/latest/APIReference/API_InstanceProfile.html>, <https://docs.aws.amazon.com/IAM/latest/APIReference/API_ListOpenIDConnectProviders.html> (accessed Nov 24, 2026).
[^np13-aws-aa]: AWS, IAM User Guide, "IAM Access Analyzer findings" (unused access findings; pricing), <https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-findings.html> (accessed Nov 24, 2026).
[^np13-oci-creds]: Oracle, OCI documentation, "Working with API Keys" (three per user), "Working with Auth Tokens" and "Working with Customer Secret Keys" (don't expire; two per user), <https://docs.oracle.com/en-us/iaas/Content/Identity/access/working-with-console-passwords-and-API-keys.htm>, <https://docs.oracle.com/en-us/iaas/Content/Identity/access/working-with-auth-tokens.htm>, <https://docs.oracle.com/en-us/iaas/Content/Identity/access/working-with-customer-secret-keys.htm> (accessed Nov 24, 2026).
[^np13-oci-rules]: Oracle, OCI documentation, Securing IAM, "IAM Credentials" (use instance principals; rotate IAM passwords and API keys every 90 days or less), <https://docs.oracle.com/en-us/iaas/Content/Security/Reference/iam_security_topic-IAM_Credentials.htm> (accessed Nov 24, 2026).
[^np13-oci-cli]: Oracle, OCI CLI Command Reference 3.96.3: `iam user list` and `iam dynamic-group list` (the tenancy from the config file when no compartment is given), `iam user api-key list`, `iam auth-token list` and `iam customer-secret-key list` (the credential's OCID, not the secret), `iam policy list` (`--compartment-id` required), <https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/iam.html> (accessed Nov 24, 2026).
[^np13-oci-sdk]: Oracle, OCI Python SDK 2.192.0, identity models `ApiKey`, `AuthToken`, `CustomerSecretKeySummary`, `DynamicGroup`, `Policy` and `User`, <https://docs.oracle.com/en-us/iaas/tools/python/latest/api/identity/models/oci.identity.models.ApiKey.html> and the neighboring model pages (accessed Nov 24, 2026). The REST API reference pages didn't render when read.
[^np13-oci-dg]: Oracle, OCI documentation, "Managing Dynamic Groups" (matching rule syntax and variables; no permissions until a policy), <https://docs.oracle.com/en-us/iaas/Content/Identity/Tasks/managingdynamicgroups.htm> (accessed Nov 24, 2026).
[^np13-oci-policy]: Oracle, OCI documentation, "Policy Syntax" (statement form; `dynamic-group` subjects; `all-resources`; `tenancy`) and "Policy Reference" (verbs: `manage` includes all permissions for the resource), <https://docs.oracle.com/en-us/iaas/Content/Identity/Concepts/policysyntax.htm>, <https://docs.oracle.com/en-us/iaas/Content/Identity/Reference/policyreference.htm> (accessed Nov 24, 2026).
[^np13-oci-instance]: Oracle, OCI documentation, "Calling Services from an Instance" (instance principals; certificates rotated by OCI; anyone with access to the instance inherits its privileges), <https://docs.oracle.com/en-us/iaas/Content/Identity/Tasks/callingservicesfrominstances.htm> (accessed Nov 24, 2026).
[^np13-oci-functions]: Oracle, OCI documentation, "Accessing Other Oracle Cloud Infrastructure Resources from Running Functions" (resource principals), <https://docs.oracle.com/en-us/iaas/Content/Functions/Tasks/functionsaccessingociresources.htm> (accessed Nov 24, 2026).
[^np13-oci-oke]: Oracle, OCI documentation, "Granting Workloads Access to OCI Resources" (OKE workload identity; `request.principal.type = 'workload'`; not with dynamic groups; enhanced clusters), <https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contenggrantingworkloadaccesstoresources.htm> (accessed Nov 24, 2026).
[^np13-oci-oc2]: Oracle, OCI documentation, "Oracle US Government Cloud" (realm OC2; home-region IAM calls; identity domains for tenancies created after January 17, 2023), <https://docs.oracle.com/en-us/iaas/Content/gov-cloud/govfedramp.htm> (accessed Nov 24, 2026).
[^np13-wif]: Microsoft Learn, "Workload identity federation" (workloads running in AWS) and "Workload identity federation for app considerations" (only RS256-signed issuer tokens supported), <https://learn.microsoft.com/entra/workload-id/workload-identity-federation>, <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-considerations> (accessed Nov 24, 2026).
