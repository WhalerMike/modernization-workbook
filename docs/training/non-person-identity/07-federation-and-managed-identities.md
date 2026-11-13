---
title: "Module 7: Convert to managed identities and federation"
description: "Gate G5 and workbook Chapter 05: convert legacy credentials in the plan's order (a managed identity, then a federated credential, then a certificate), check each federated credential's issuer, subject and audience against what the workload presents, test its token exchange against a fake, track the 30-day parallel run, and disable the legacy account only through a plan whose SHA-256 a reviewer approved. About 60 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04"
series-order: 7
review-status: approved
reviewed-sha256: d2b6d44cac9390b146b8c79e8779d802f52dacee3a0a1ce430f4b46b0e6602d5
last-reviewed: 2026-11-08
---
# Module 7: Convert to managed identities and federation {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). Gate G5 Conversion. Workbook [Chapter 05](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md). About 60 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_NPI_Module_7.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_7_Narrated) (about 15 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_7_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-7/Training_NPI_Module_7_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-7/Training_NPI_Module_7_Narrated.vtt).

**Also:** the chapter's narrated tour, about 12 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_05_Workload_Federation_Narrated).

## Introduction (3 minutes)

A federated credential tells Microsoft Entra ID to trust tokens from an outside issuer, such as GitHub Actions or a Kubernetes cluster. Three values must match the workload's token exactly, case for case: the issuer, the subject and the audience. And a credential with the wrong subject is created without any error. It fails only when the workload tries to exchange its token.

In this module you plan conversions in the program's order: a managed identity for an Azure-hosted workload, a federated credential where the host has an issuer, and a certificate only where neither applies. Each federated credential is checked against the claims the workload will present and tested against a fake token endpoint before it is created. Then the old and new credentials run side by side for 30 days, and the legacy account is disabled, never deleted.

**The federal requirement.** Gate G5 supports NIST SP 800-53 IA-5, IA-9 and AU-2. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Validate (G5 Conversion)](../../books/guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run) step names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| IA-5 and IA-5(2) Authenticator Management; IA-9 Service Identification and Authentication | KSI-IAM-SNU (IA-5); none cites IA-9 | `conversions.json`; `plan.json`; `findings.json`, NPI-WIF-01 to -09 |
| IA-9; CM-4(2) Verification of Controls | KSI-CMT-VTD, KSI-CMT-LMC (CM-4(2)) | `exchange-tests.json` |
| AC-2 Account Management; AC-2(3) Disable Accounts | KSI-IAM-SNU (AC-2); KSI-IAM-AAM (AC-2(3)) | `conversion-records.json`; `cutover-log.csv`; the apply folder's `results.json` |
| AC-6 Least Privilege; CM-5 Access Restrictions for Change | KSI-IAM-ELP, KSI-IAM-JIT (AC-6); KSI-CMT-RVP (CM-5) | The permissions for `federation` and `federation-apply` |
| CM-3 Configuration Change Control | KSI-CMT-RMV, KSI-CMT-LMC | The plan's SHA-256; the dry-run and apply folders |
| AU-2 and AU-12, the new identity's sign-ins | KSI-MLA-LET | Lab 2: the beta sign-in log entry with `clientCredentialType` `federatedIdentityCredential` |
| AU-9 and SI-7, the run's integrity | KSI-MLA-OSM (AU-9); KSI-SVC-VRI (SI-7) | `manifest.json` in each output folder |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- state the order of targets, and the finding a target out of order raises;
- name the three values a federated credential must match, and the audience Entra ID expects;
- explain why every federated credential gets a token exchange test before it's created;
- read a conversion's cutover gate and parallel run status, and say when the legacy account may be disabled.

## Prerequisites (1 minute)

- [Module 3](03-decide-the-target.md): the conversions follow the target and the wave Module 3 decides.
- [Module 4](04-credential-rules.md): a certificate target is issued and rotated under Module 4's rules.

## Unit 1: What the gate asks for (7 minutes)

Read the guide's [Step 5](../../books/guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run): build the target, give it two human owners, run old and new for 30 days, disable the legacy account, and record the result. Then read the guide's [Step 2](../../books/guides/non-person-identity-implementation.md#step-2-decide-each-identitys-target) decision table again, and the [Dangers](../../books/guides/non-person-identity-implementation.md#dangers) row "Federation trusts too much".

## Unit 2: What a federated credential must match (10 minutes)

Read the workbook chapter in this order:

- [What the code depends on](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#what-the-code-depends-on): the order, the three values, the limit of 20, and why a wrong subject is created without error.
- [The checks](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#the-checks): NPI-WIF-01 to -09, what the workload presents, and the token exchange test.

## Unit 3: The plan, the parallel run and the write path (8 minutes)

- [The plan](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#the-plan): the actions, and the evidence for a clean run *(design guidance for the thresholds)*.
- [The separate write path](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#the-separate-write-path): the approved hash, one write at a time, never a `DELETE`, and a person with Cloud Application Administrator and Managed Identity Contributor.

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This is the workbook's [Chapter 05, Lab 1](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/non-person-identity`, in PowerShell 7. The tenant is fictional.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Send Microsoft's samples to the fakes
Invoke-Pester -Path tests/NpiFederationSamples.Tests.ps1 -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 2: List what each task needs
Import-Module ./powershell/NpiFederation/NpiFederation.psm1
foreach ($t in 'federation', 'federation-apply') { $p = Get-NpiWifRequiredPermission -Task $t; "$t : " + ($p.GraphPermissions -join ', ') + ' | ' + ($p.AzureRoles -join ', ') }

# Step 3: Build the plan
./Invoke-NpiFederation.ps1 -Cloud gcc -ConversionsPath tests/fixtures/ch05/conversions.json -CutoverLogPath tests/fixtures/ch05/cutover-log.csv -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation

# Step 4: Read the findings
Get-Content out/federation/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, ObjectKey

# Step 5: Read the exchange tests
Get-Content out/federation/exchange-tests.json -Raw | ConvertFrom-Json | Format-Table Credential, SubjectSource, Passed

# Step 6: Read the conversions
Get-Content out/federation/conversion-records.json -Raw | ConvertFrom-Json | ForEach-Object { [pscustomobject]@{ Id = $_.ConversionId; Target = $_.TargetKind; Gate = $_.CutoverGate; Run = $_.ParallelRun.Status; Day = $_.ParallelRun.Day } } | Format-Table

# Step 7: Dry-run the plan with its approved hash
$sha = (Get-FileHash out/federation/plan.json -Algorithm SHA256).Hash.ToLower()
./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation-dryrun

# Step 8: Apply it to the fake, then try a hash nobody approved
./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation-apply -Apply
./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation-x

# Step 9: Run the tests
Invoke-Pester -Path tests

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Send Microsoft's samples to the fakes:**

    ```powershell
    Invoke-Pester -Path tests/NpiFederationSamples.Tests.ps1 -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 17`, `FailedCount 0`, `NotRunCount 0`. One test creates a credential from the Graph sample, then exchanges a token with another subject: the create succeeds and the exchange fails with `AADSTS70021`.

2. **List what each task needs:**

    ```powershell
    Import-Module ./powershell/NpiFederation/NpiFederation.psm1
    foreach ($t in 'federation', 'federation-apply') { $p = Get-NpiWifRequiredPermission -Task $t; "$t : " + ($p.GraphPermissions -join ', ') + ' | ' + ($p.AzureRoles -join ', ') }
    ```

    ```text
    federation : Application.Read.All, AuditLog.Read.All | Reader
    federation-apply : Application.Read.All, Application.ReadWrite.All | Managed Identity Contributor, Reader
    ```

3. **Build the plan:**

    ```powershell
    ./Invoke-NpiFederation.ps1 -Cloud gcc -ConversionsPath tests/fixtures/ch05/conversions.json -CutoverLogPath tests/fixtures/ch05/cutover-log.csv -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation
    ```

    ```text
    Conversions: 8 in 2 wave(s); token exchange tests: 4 passed, 2 failed
    Findings: 7 Finding, 1 Warn
    Plan: 20 actions, 4 of them writes (2 CreateCredential, 1 CreateIdentity, 1 DisableLegacy); nothing sent
    ```

    It also prints each conversion's parallel run status and the plan's SHA-256, `5ec0a52c70dc49ac6904c6923ac9b292e3c312d38594b6210cc9178c9f188bf2`. The hash is the same on every run with these inputs.

4. **Read the findings:**

    ```powershell
    Get-Content out/federation/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, ObjectKey
    ```

    Expect eight rows. `payroll-prod` has an issuer with a trailing slash and the environment `Production` where the workflow's is `production`: NPI-WIF-03, NPI-WIF-02 and a failed exchange, NPI-WIF-08. `github-intranet-tag` has an audience with a leading space: NPI-WIF-04 and NPI-WIF-08. `conv-06` gives an Azure Functions app a certificate when a managed identity is available: NPI-WIF-01. `conv-08`'s secret still signs in after cutover: NPI-WIF-09.

5. **Read the exchange tests:**

    ```powershell
    Get-Content out/federation/exchange-tests.json -Raw | ConvertFrom-Json | Format-Table Credential, SubjectSource, Passed
    ```

    Expect six tests: `payroll-prod` and `github-intranet-tag` fail, and the other four pass.

6. **Read the conversions:**

    ```powershell
    Get-Content out/federation/conversion-records.json -Raw | ConvertFrom-Json | ForEach-Object { [pscustomobject]@{ Id = $_.ConversionId; Target = $_.TargetKind; Gate = $_.CutoverGate; Run = $_.ParallelRun.Status; Day = $_.ParallelRun.Day } } | Format-Table
    ```

    Expect `conv-01` `ReadyToDisableLegacy` on day 40, `conv-07` `ParallelRunning` on day 15 and `conv-08` `LegacyStillInUse` on day 59. The other five are `AwaitingCutover`.

7. **Dry-run the plan with its approved hash:**

    ```powershell
    $sha = (Get-FileHash out/federation/plan.json -Algorithm SHA256).Hash.ToLower()
    ./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation-dryrun
    ```

    Expect `DryRun: 4 WouldSend`: `Disable-ADAccount` for `conv-01`'s legacy account, one `POST` of an application's federated credential, then a `PUT` of the identity `id-webfront` before a `PUT` of its credential.

8. **Apply it to the fake, then try a hash nobody approved:**

    ```powershell
    ./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation-apply -Apply
    ./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation-x
    ```

    Expect `Apply: 4 Sent`, in the same order, then the refusal: `The plan's SHA-256 is 5ec0a52c…, not the approved 0000…; refusing to run a plan nobody reviewed.`

9. **Run the tests:**

    ```powershell
    Invoke-Pester -Path tests
    ```

    Expect 511 tests passed, 0 failed.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 05, Lab 2](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#lab-2-test-tenant). It has the exact commands.

- **You need:** a test tenant in the worldwide or GCC cloud, a test subscription, a test Active Directory domain and a test repository, never production, with fictional names; a reader app with `Application.Read.All`, `AuditLog.Read.All` and Reader; and a person with Cloud Application Administrator and Managed Identity Contributor for the write.
- **What you do:** make a test conversion from a client secret to a federated credential, capture the real `iss` and `sub` from one workflow run, plan, apply, exchange for real, and run the parallel run through to the legacy account's disable.
- **Back-out:** step 7 enables the test account again, removes the test credentials, deletes the test identity, the test app registration and the test account by hand (this code never deletes), and deletes the `out` folders.

## Knowledge check (5 minutes)

1. A credential's subject has `Production` where the workflow presents `production`. What happens when it's created in Entra ID?
    a. Creation fails with an error
    b. It's created without error, and the token exchange fails later; the check flags it first (NPI-WIF-02)
    c. Entra ID corrects the case
    d. It works, because matching ignores case
2. What audience does Entra ID expect on a federated credential?
    a. Any value the workload sends
    b. Exactly one audience, `api://AzureADTokenExchange`
    c. `https://graph.microsoft.com`
    d. The app's client ID
3. An Azure Functions app is given a certificate. Why is that a finding?
    a. Certificates are banned
    b. The plan's order puts an Azure-hosted workload on a managed identity (NPI-WIF-01)
    c. Functions can't use certificates
    d. The certificate is too long-lived
4. `conv-01` ran 40 days with no logon by the old account, and the owner approved. What does the plan do with the legacy account?
    a. Deletes it
    b. Disables it with `Disable-ADAccount`, after review; it's never deleted by this code
    c. Leaves it enabled for another 30 days
    d. Moves it to another domain
5. What does the token exchange test in Lab 1 prove?
    a. That the workload's issuer will present those claims
    b. That a credential will match the claims you recorded, against a fake that matches as Learn describes; the real issuer's answer is Lab 2's
    c. That the token's signature is valid
    d. That the credential has propagated

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Learn says a wrong subject is created successfully and fails only at the exchange. Taught in [What the code depends on](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#what-the-code-depends-on) and [The checks](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#the-checks).
2. **b.** Taught in [What the code depends on](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#what-the-code-depends-on) and the guide's [Step 3](../../books/guides/non-person-identity-implementation.md#step-3-set-the-credential-rules), item 8.
3. **b.** Taught in [The checks](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#the-checks) and the guide's [Step 2](../../books/guides/non-person-identity-implementation.md#step-2-decide-each-identitys-target).
4. **b.** Disable, never delete. Taught in [The plan](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#the-plan) and the guide's [Step 5](../../books/guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run).
5. **b.** Taught in [The checks](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#the-checks) and the chapter's illustrative code note above [Lab 1](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#lab-1-fixtures-no-tenant).
:::

## Summary (2 minutes)

You planned eight conversions in two waves, caught a trailing slash, a wrong case and a stray space before any credential reached the tenant, read each conversion's parallel run, and applied four approved writes to the fake, an identity before its credential. The write path refused a plan nobody reviewed.

**The evidence an ISSO keeps** for G5 from this module: `conversions.json`, `cutover-log.csv`, `plan.json` with its approved SHA-256, `findings.json`, `exchange-tests.json`, `conversion-records.json`, and the apply folder's `results.json` and `manifest.json`, dated. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/non-person-identity/05-workload-identity-federation-and-managed-identities.md#checklist).

**Next:** [Module 8: Convert Kerberos accounts to gMSAs and dMSAs](08-gmsa-dmsa-and-the-kerberos-island.md).
