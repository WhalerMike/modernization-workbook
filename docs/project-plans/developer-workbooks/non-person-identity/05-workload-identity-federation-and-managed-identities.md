---
title: "Chapter 05 — Workload Identity Federation and Managed Identities"
description: "Convert non-person identities wave by wave in the plan's order (managed identity, then federated credential, then certificate), starting from Learn's own samples for federated identity credentials on an app registration and on a user-assigned managed identity, the Graph create sample and the Managed Identity REST examples (all pinned in the repository), and adding what they leave to you: federated credentials held as reviewed JSON with a diff, a dry run and an approved plan hash, a pre-cutover check that each credential's issuer and subject match what the workload's issuer will present, a token exchange test against a fake token endpoint, managed identities created or recorded with their role assignments, and the 30-day parallel run tracked from sign-in evidence before the legacy account is disabled, never deleted, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-non-person-identity
part: How
series-order: 5
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: pending
---

# Chapter 05 — Workload Identity Federation and Managed Identities

*A federated credential with the wrong subject is accepted the day it's created and fails the day the workload depends on it, so the check belongs before the cutover, in code a reviewer has read.*

::: {.callout-note}
## In this chapter
The conversion behind the project plan's tasks N3.2 to N3.4: workload identities created in the plan's order (a managed identity, then a federated credential, then a certificate), each federated credential's token exchange tested, then a 30-day parallel run before the legacy account is disabled. You start with Learn's own samples for creating federated identity credentials, on an app registration and on a user-assigned managed identity, and the Managed Identity REST examples Learn's reference renders, all pinned in the repository, and you run them against fakes to see what they do and what they miss. Then you use `examples/non-person-identity` for what they leave to you: the credentials as reviewed JSON, a check of each one against the claims the workload's issuer will present, a token exchange test against a fake token endpoint, managed identities created or recorded with their role assignments, and the parallel run tracked from sign-in evidence, applied only through a separate, delegated write path after a reviewer approves the plan's SHA-256. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant, a test subscription and a test workflow.
:::

## Goal and audience

**Goal.** By the end of this chapter you can hold a wave's conversions as one reviewed file, and from it, in code: create the user-assigned managed identities and federated credentials the plan's task N3.2 asks for ("workload identities created (managed identity, then federated credential, then certificate); federated token exchange tested"), show before any cutover that each credential will match the token its workload presents, and track N3.3's and N3.4's parallel runs ("old and new credentials side by side for 30 days, then the legacy accounts disabled") to the disable. You can say, for each rule, whether it is Learn's, Learn's sample, or the program's design.

**Audience.** Developers who build the project's conversion code, the identity engineers who run the waves, and the application owners who switch each workload and approve each disable. You should read PowerShell 7 and know Chapters [01](01-non-person-identity-inventory-as-code.md) and [02](02-ownership-and-the-orphan-rule.md). You don't need a tenant until Lab 2.

## What the code depends on

**The order.** Book 02's Phase 4 converts HIGH-risk accounts first and creates "managed identities for Azure-hosted workloads, federated credentials for pipelines and other OIDC-capable hosts, certificates only where neither applies" ([Book 02, Chapter 10](../../../books/b02-identity/10-migrating-and-governing.md#phase-4-service-account-modernization)). The plan's decision D-N3 names the target for each account, and Chapter 03 builds the waves. This chapter takes the waves as given and holds the credentials.

**What a federated credential is.** A federated identity credential on an app registration or a user-assigned managed identity tells Microsoft Entra ID to trust tokens from an external issuer: GitHub Actions, a Kubernetes cluster, another cloud or any OIDC provider. The workload presents its issuer's token, and Entra ID exchanges it for an access token ([Book 02, Chapter 09](../../../books/b02-identity/09-building-the-entra-target.md#workload-identity-federation)).[^np05-concepts] Three values decide the match. The **issuer** must match the token's `iss` claim, the **subject** its `sub` claim, and the **audience** its `aud` claim; the audience is a single value, and for Entra ID it is `api://AzureADTokenExchange`, the value Learn recommends and the Graph reference says to set.[^np05-graph-create] [^np05-include] The match is exact and case-sensitive.[^np05-concepts] Wildcards aren't supported in any value; an issuer claim with leading or trailing whitespace blocks the exchange; a name is 3 to 120 characters of letters, digits, dashes or underscores, starting with a letter or digit, and can't be changed.[^np05-include] An app registration or a user-assigned managed identity holds at most 20.[^np05-include] A system-assigned managed identity can't hold one at all.[^np05-trust-uami]

**The risk this chapter exists for.** Learn says it twice: a federated credential with the wrong subject "is created successfully without error," and the error appears only when the token exchange fails; for GitHub, the exchange "fails without error."[^np05-include] The plan's risk register says the same, and its mitigation is to test each credential's token exchange before the parallel run starts (project plan, risks). That test is the center of this chapter.

**Managed identities.** A workload hosted in Azure uses a managed identity, and Azure manages its credential.[^np05-concepts] A user-assigned identity is created on its own and assigned to its hosts; creating one takes Managed Identity Contributor.[^np05-uami-rest] A system-assigned identity is turned on in the host's own deployment, and lives and dies with it. Either way, its access comes from Azure role assignments, which this chapter records and Chapter 07 narrows.

**The parallel run.** The implementation guide's Step 5 runs old and new together for 30 days with the legacy account still enabled, watching the new identity's sign-ins in Entra ID and the legacy account's logons on the domain controllers, then disables the legacy account, never deletes it. For an app registration losing a secret, it removes the secret only after the new credential has carried production traffic ([implementation guide, Step 5](../../../books/guides/non-person-identity-implementation.md#step-5-convert-with-a-parallel-run)). Book 02's rollback is to re-enable the legacy account and revert the application's configuration.

### Which cloud, for these reads and writes

The target estate is Microsoft 365 GCC with commercial Azure: Graph at `graph.microsoft.com`, Resource Manager at `management.azure.com`, sign-in at `login.microsoftonline.com`. GCC High and DoD use `graph.microsoft.us` and `dod-graph.microsoft.us`, Azure Government's `management.usgovcloudapi.net`, and `login.microsoftonline.us`.[^np05-deployments] Creating a federated credential on an application and listing sign-ins are both available in US Government L4 and L5.[^np05-graph-create] [^np05-signins] The Resource Manager pages read for user-assigned identities don't state Azure Government availability; this estate's Azure is commercial, so the code sends them to `management.azure.com` for `gcc`, and to Azure Government only for `gcchigh` and `dod`. The token exchange test goes only to the fake, but the request it builds is addressed to the cloud's own sign-in host.

## Start with Microsoft's sample

### What Microsoft gives you

Learn's *Configure an app to trust an external identity provider* is Microsoft's procedure for a federated credential on an app registration. It has samples for the admin center, the Azure CLI (`az ad app federated-credential create` with a `credential.json` body for GitHub Actions, Kubernetes and another provider), Azure PowerShell (`New-AzADAppFederatedCredential`) and Microsoft Graph through `az rest`.[^np05-trust-app] Its sibling, *Configure a user-assigned managed identity to trust an external identity provider*, does the same for a user-assigned managed identity, with the Azure CLI, Azure PowerShell, an ARM template that creates the identity and its credential, and a REST request.[^np05-trust-uami] Both pages share an include with the rules above.[^np05-include] The Graph reference *Create federatedIdentityCredential* has the HTTP request that creates one on an application.[^np05-graph-create] The Managed Identity REST reference renders Microsoft's examples for creating a federated credential on a user-assigned identity, and for creating and reading the identity, at API version 2024-11-30.[^np05-arm-fic] [^np05-arm-uami]

### The pinned copies

The samples exist only inside those pages and the REST examples, so the repository pins them unmodified:

- [`examples/third_party/entra-wif-create-trust-pages`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/third_party/entra-wif-create-trust-pages): both Learn pages and their shared include, from MicrosoftDocs/entra-docs at commit `d75a90e` (February 25, 2026, the last change to all three; unchanged on October 30, 2026), with the repository's licenses (MIT for code, Creative Commons Attribution 4.0 for documentation).[^np05-src-entra]
- [`examples/third_party/graph-fic-create-page`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/third_party/graph-fic-create-page): the Graph reference page's source from microsoftgraph/microsoft-graph-docs-contrib at commit `08b242e` (December 4, 2025; unchanged on October 30, 2026), same licenses.[^np05-src-graph]
- [`examples/third_party/msi-fic-rest-examples`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/third_party/msi-fic-rest-examples): `FederatedIdentityCredentialCreate.json`, `IdentityCreate.json` and `IdentityGet.json` from Azure/azure-rest-api-specs at commit `37886ac` (September 12, 2025; unchanged on October 30, 2026), MIT.[^np05-src-arm]

Each folder's `snapshot.json` records every file's SHA-256, checked against the upstream git blob hashes, and a unit test checks them. The weekly source watch reports new commits to each upstream path. Updating a copy is a reviewed pull request.

`tests/FederationSampleHarness.ps1` extracts the samples at test time: it checks the `credential.json` bodies and the template's audience with the chapter's credential checks, runs the Azure PowerShell command against a stand-in that records its parameters, sends the Graph, `az rest` and REST requests to the fake Graph and Resource Manager, and exchanges test assertions against the fake token endpoint.

### What they leave to you

Each row is pinned by a test: in `tests/NpiFederationSamples.Tests.ps1` for the samples, and in `tests/NpiFederation.Tests.ps1` for the example.

| Microsoft's sample, as published | Why it matters | What `examples/non-person-identity` adds |
|---|---|---|
| Graph creates a credential from name, issuer, subject and the one audience | — | Kept as the model for the application write; the fake enforces the creation errors Learn documents and nothing else |
| The Graph sample is accepted with any subject; a wrong one fails only at token exchange | The plan's risk, shown on Microsoft's own sample | Each credential is checked against the claims its workload presents, then exchanged against the fake token endpoint, before it's created (NPI-WIF-02, -08) |
| The Azure PowerShell GitHub sample uses `https://token.actions.githubusercontent.com/`, with a trailing slash; the CLI and REST create samples don't | Learn's own samples disagree, and the match is exact[^np05-concepts] | The issuer is compared exactly with what the workload's issuer presents (NPI-WIF-03; research gaps, row 41) |
| The managed identity page's ARM template defaults the audience to `" api://AzureADTokenExchange"`, with a leading space | A credential that can never match, accepted at creation | Exactly one audience, exactly `api://AzureADTokenExchange` (NPI-WIF-04) |
| GitHub subjects are given as formats; a pull request's is `repo:<org/repo>:pull-request` on the Entra page and `repo:<org/repo>:pull_request` on App Service's page[^np05-appservice] | Two Learn pages, two answers; GitHub's newer immutable format can't be derived at all[^np05-flexible] | Subjects derived only for environment, branch and tag in the name-based format; anything else needs the `sub` claim captured from a test run (research gaps, rows 42 and 43) |
| The `az rest` samples call `https://graph.microsoft.com/applications/...`, with no version segment | A request a reviewer can't place on v1.0 or beta | The code builds every URL from the call list, on `/v1.0` or `/beta` (research gaps, row 48) |
| The managed identity page's REST sample uses API version 2022-01-31-preview, and its curl payload isn't valid JSON | Preview versions in production code; a sample that can't run as written | The code uses the reference's 2024-11-30, which the pinned REST examples show (row 48) |
| Hard-codes `graph.microsoft.com` and `management.azure.com` | Wrong for GCC High and DoD | Hosts from the cloud table, checked on every request |
| One credential at a time, by hand; nothing compares the tenant with what was reviewed | Drift: a credential added in the portal is invisible | The reviewed file diffed against the tenant: create, no change, review, and unmanaged credentials reported, never deleted (NPI-WIF-07) |
| Nothing about the order, the 20-credential limit, a repeated issuer and subject, or a system-assigned identity | Learn states the limits;[^np05-include] the samples don't check them | NPI-WIF-01, -05, -06 before anything is sent |
| No managed identity record, no role assignments read, no parallel run, no disable | N3.3 and N3.4 are left to you | Identities created or recorded with their role assignments; the 30-day run from sign-in evidence; the disable through the reviewed write path |
| The ARM template creates credentials under one identity in parallel unless chained with `dependsOn`; Learn says concurrent creates fail with 409[^np05-considerations] | A pipeline that fails on its second credential | The writer sends one at a time, the identity before its credentials |

**The verdict.** Use Learn's samples as the model for the three writes (a credential on an app, an identity, a credential on an identity). Don't use them as the conversion: they accept the wrong subject in silence, and two of them carry values that will never match a token.

## The code: what `examples/non-person-identity` adds

This chapter's code is `powershell/NpiFederation/NpiFederation.psm1`, one entry script, `Invoke-NpiFederation.ps1` (plan by default; the write path with `-PlanPath`), its own call list, `config/calls-ch05.json`, and the fixtures in `tests/fixtures/ch05`. It shares NpiCore's cloud table, host check, findings and hashes, and keeps its own client, fakes and manifest, so Chapters 01 and 02 are untouched.

### The inputs

| File | Who keeps it | What it holds |
|---|---|---|
| `conversions.json` | Identity engineering, reviewed with the application owners | One entry per legacy credential: wave, risk, owner; the legacy account or secret; what the host allows (`azureHosted`, `oidcIssuer`); the target (a user-assigned or system-assigned managed identity, an app registration's federated credentials, or a certificate); and for each federated credential its name, issuer, subject, audience and the **workload** whose issuer will present the token (`github` with repository, entity and value; `kubernetes` with issuer, namespace and service account; or a `capturedSubject` from a test run) |
| `cutover-log.csv` | The application owner | `ConversionId`, `CutoverOn` (the day the workload switched), `RecordedBy`, `DisableApprovedBy` (the owner's approval after a clean run), `DisabledOn` |

### The checks

`New-NpiWifPlan` reads, for each conversion, the app registration (`GET /applications/{id}`), its credentials, the user-assigned identity (a 404 means it doesn't exist yet) and its credentials, or the system-assigned identity's service principal; the managed identity's Azure role assignments (`$filter=assignedTo('{principalId}')`); the legacy AD account; and, once a cutover is recorded, the sign-ins since then.

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| NPI-WIF-01 | Finding | A target out of the plan's order: an Azure-hosted workload given anything but a managed identity, or an OIDC-capable one given a certificate | Book 02, Chapter 10; plan N3.2 (*Design guidance*) |
| NPI-WIF-02 | Finding | A subject that isn't, exactly and case for case, what the workload's issuer will present, or one that can't be checked because it can't be derived | Learn[^np05-include] [^np05-concepts] |
| NPI-WIF-03 | Finding | An issuer that isn't exactly the workload's (a trailing slash included), or one with whitespace | Learn[^np05-include] |
| NPI-WIF-04 | Finding | Not exactly one audience, or an audience that isn't exactly `api://AzureADTokenExchange` | Learn[^np05-graph-create] |
| NPI-WIF-05 | Finding | A name outside the rules, a value over 600 characters, a wildcard, a credential on a system-assigned identity, or a flexible credential's `claimsMatchingExpression` (preview; not in production, *Design guidance*) | Learn[^np05-include] [^np05-trust-uami] [^np05-flexible] |
| NPI-WIF-06 | Finding | More than 20 credentials on one parent, or the same issuer and subject twice | Learn[^np05-include] |
| NPI-WIF-07 | Warn | A credential in the tenant that the reviewed file doesn't hold; reported, never deleted | *Design guidance* |
| NPI-WIF-08 | Finding | The token exchange test failed | Project plan, risks |
| NPI-WIF-09 | Finding | A parallel run that isn't clean: the legacy credential still in use after cutover, failures or silence on the new one, or a cutover made while a credential fails its checks | Implementation guide, Step 5 (*Design guidance* for the thresholds) |

**What the workload presents.** `Get-NpiWifPresentedClaims` turns the workload record into the `iss`, `sub` and `aud` its issuer will put in the token. For GitHub it uses Learn's formats: `repo:<org/repo>:environment:<name>`, `repo:<org/repo>:ref:refs/heads/<branch>` and `repo:<org/repo>:ref:refs/tags/<tag>`, with the issuer `https://token.actions.githubusercontent.com`.[^np05-trust-app] It derives nothing for a pull request, whose format two Learn pages give differently, or for GitHub's immutable subject format, which Learn says GitHub applies from July 15, 2026 to repositories created, renamed or transferred.[^np05-flexible] Those need `capturedSubject`, the `sub` claim printed by a test run (Lab 2). For Kubernetes the subject is `system:serviceaccount:<namespace>:<name>`.[^np05-trust-app] Learn's guidance on mutable subjects, to prefer a subject built from a stable ID, is why the code records which source each subject came from.[^np05-mutable]

**The token exchange test.** `Test-NpiWifTokenExchange` builds Learn's client credentials request with a federated credential: `client_id`, a `scope` ending in `/.default`, `client_assertion_type` `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`, the assertion, and `grant_type` `client_credentials`, addressed to `{sign-in host}/{tenant}/oauth2/v2.0/token`.[^np05-clientcreds] The assertion carries the claims the workload presents and no valid signature. The code refuses to send it anywhere but `New-NpiWifFakeTokenEndpoint`, which matches it as Learn describes (issuer, subject and audience exactly and case-sensitively; whitespace around the issuer blocked; an expired assertion refused) against the parent's credentials as they will be after the plan, and passes only if the named credential is the one that matched. It checks no signature and fetches no issuer keys: that, and the real service's answer, are Lab 2's.

### The plan

Nothing in the plan writes. Each conversion gets one or more actions:

| Action | When | Writes? |
|---|---|---|
| `CreateIdentity` | A user-assigned identity the file asks for doesn't exist: `PUT {identity}?api-version=2024-11-30` with `location` and a `conversion` tag | Yes, after review |
| `IdentityExists` | Recorded: the identity's client and principal IDs, and its role assignments | No |
| `AwaitHost` | A system-assigned identity not yet turned on in the host's deployment | No |
| `CreateCredential` | A credential that passes every check and its exchange test: `POST /applications/{id}/federatedIdentityCredentials`, or `PUT {identity}/federatedIdentityCredentials/{name}` | Yes, after review |
| `NoChange`, `ReviewChange` | In the tenant as reviewed; or in the tenant with other values. Credentials aren't changed in place: a new name and its own parallel run (*Design guidance*) | No |
| `Blocked` | A credential or conversion that fails a check or its exchange test | No |
| `Unmanaged` | In the tenant, not in the file; reported, never deleted | No |
| `HandOffChapter04` | A certificate target: issued from the vault and rotated under Chapter 04 | No |
| `AwaitingCutover` | No cutover recorded; the conversion's cutover gate says Ready, NotReady or Blocked, and why | No |
| `ParallelRunning` | Day N of 30, with the date the window ends and the new identity's sign-ins | No |
| `LegacyStillInUse`, `NewCredentialFailing`, `NoSignInsOnNewCredential` | The run isn't clean (NPI-WIF-09) | No |
| `AwaitingOwnerApproval` | A clean 30 days; the application owner approves the disable in the cutover log | No |
| `DisableLegacy` | A clean 30 days and the owner's approval: `Disable-ADAccount -Identity <objectGUID>` | Yes, after review |
| `RemoveSecretByOwner` | A clean 30 days for an app registration's secret: the owner removes it through Chapter 04's reviewed change; this code removes no credential | No |
| `Converted` | `DisabledOn` recorded: record the target, the date and the disabled object's ID | No |

**The evidence for a clean run.** The new identity's sign-ins come from Graph's beta sign-in log, filtered by time, `appId` and `signInEventTypes` (`managedIdentity` or `servicePrincipal`), because only beta returns service principal and managed identity sign-ins, and only beta carries `clientCredentialType` and `federatedCredentialId`.[^np05-signins] [^np05-signin-resource] A new credential's sign-in is one with `clientCredentialType` `federatedIdentityCredential` and the credential's own ID, or `managedIdentity` for a managed identity. The legacy credential is in use if a `clientSecret` sign-in appears on the app after cutover, or the legacy AD account's `LastLogonDate` is after it, which is a lead to confirm on the domain controllers, not a fact (Chapter 01's research gaps, row 3). *Design guidance:* 30 days with no legacy use, no failed sign-ins on the new credential, at least one successful one, and a week with none is a finding.

The plan is written as `plan.json` with the conversion file's and cutover log's SHA-256, the tenant, the cloud and the date, and the run prints the plan's SHA-256. The same inputs give the same plan, byte for byte. The run also writes `findings.json`, `conversion-records.json` (each conversion's identity, role assignments, cutover gate and parallel run) and `exchange-tests.json`, with a manifest of every request and a SHA-256 per file.

### The separate write path

`Invoke-NpiFederation.ps1 -PlanPath` is the only code in the chapter that writes, through a client for the `federation-apply` task. It refuses to run unless the plan file's SHA-256 is the one passed as `-ApprovedSha256`, the plan is for this tenant and cloud, and it is no more than seven days old (*Design guidance*, as in Chapter 02). Each write must be a declared `federation-apply` call with its method and a target on the cloud's own host; a credential's body may hold only `name`, `issuer`, `subject`, `audiences` and `description` (or, on an identity, `properties` with the first three), and it is checked again, against the claims recorded in the plan, so a hand-edited plan can't create a credential the plan would have blocked. `DELETE` is never sent. A live run is delegated: a person signed in with Cloud Application Administrator (or the application's owner) and Managed Identity Contributor, never an unattended app.

Before each write it re-reads the target and skips the write if the identity now exists, a credential with that name or that issuer and subject appeared, the parent holds 20, or the AD account is already disabled. It sends one write at a time, in the plan's order, so an identity exists before its credentials and no two credentials under one identity are created together.[^np05-considerations] Without `-Apply` it stops after the prechecks and reports `WouldSend`. With `-Apply` it sends, records every request in its manifest, and tells the operator to record `DisabledOn`, and to wait for a new credential to propagate (Learn: `AADSTS70021` for a few minutes) before the first real exchange.[^np05-considerations]

| Task | Calls | Permissions and roles |
|---|---|---|
| `federation` (read) | `GET /applications/{id}`, its credentials, `GET /servicePrincipals/{id}`; `GET /beta/auditLogs/signIns`; `GET` user-assigned identity, its credentials, role assignments; `Get-ADUser`; the token exchange test (fake only) | `Application.Read.All`, `AuditLog.Read.All`; Reader; default AD read[^np05-graph-list] [^np05-signins] [^np05-roles-list] |
| `federation-apply` (write, delegated only) | Re-read credentials and identities; `POST` application credential; `PUT` identity; `PUT` identity credential; `Get-ADUser`, `Disable-ADAccount` | `Application.Read.All`, `Application.ReadWrite.All`; Managed Identity Contributor, Reader; a delegated right to disable accounts in the account's OU[^np05-graph-create] [^np05-mi-contrib] |

`Application.ReadWrite.All` is the only delegated permission Learn lists for creating a federated credential on an application; the application permission `Application.ReadWrite.OwnedBy` reaches only apps the caller owns, and a person needs Cloud Application Administrator or Application Administrator, or, for an app they own, Application Developer or a member's default permissions.[^np05-graph-create] Learn's trust page names Contributor or Owner on the identity for creating its credential; the Managed Identity Contributor built-in role holds the same `federatedIdentityCredentials/write` action and is what Learn names for creating the identity, so the call list declares it (research gaps, row 45).[^np05-trust-uami] [^np05-mi-contrib] [^np05-uami-rest]

### The tests

Pester 5 under PowerShell 7. This chapter's are:

- `tests/NpiFederationSamples.Tests.ps1`, 17 tests: Microsoft's samples, run as published.
- `tests/NpiFederation.Tests.ps1`, 38 tests: the call list and its least-privilege check, the client and the token exchange harness, the claims and credential checks, the order, each finding and plan action, the 20-credential limit, the deterministic plan hash, each parallel run status, the writer's refusals (hash, tenant, cloud, age, task, host, body, `DELETE`, a credential the checks would block), dry run, `-Apply` in order, the prechecks that skip, and the entry script and its manifest.

::: {.callout-important}
## Illustrative code
The commands below send Microsoft's pinned samples to fakes, and run the example against a fictional tenant. `-Apply` in Lab 1 changes only the fake, in memory. The token exchange test proves a credential will match the claims you recorded; it doesn't prove the workload's issuer presents them. Review the code, and run Lab 2 in a test tenant, before it reads or writes a real one.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/non-person-identity`.

1. **Send Microsoft's samples to the fakes:**

   ```powershell
   Invoke-Pester -Path tests/NpiFederationSamples.Tests.ps1 -Output None -PassThru |
       Select-Object PassedCount, FailedCount, NotRunCount
   ```

   `PassedCount 17`, `FailedCount 0`, `NotRunCount 0`. Read the test that sends the Graph sample and then exchanges a token with another subject: the create succeeds and the exchange fails with `AADSTS70021`.

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
   Parallel runs: conv-01 ReadyToDisableLegacy; conv-02 AwaitingCutover; conv-03 AwaitingCutover; conv-04 AwaitingCutover; conv-05 AwaitingCutover; conv-06 AwaitingCutover; conv-07 ParallelRunning; conv-08 LegacyStillInUse
   Plan SHA-256: cbfac196a59f7517304c5d13c49764f4b40e3ee4fff1b39d27063f36147a0006
   ```

   The plan's hash is the same on every run with these inputs.

4. **Read the findings:**

   ```powershell
   Get-Content out/federation/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, ObjectKey
   ```

   ```text
   Rule       Severity ObjectKey
   ----       -------- ---------
   NPI-WIF-03 Finding  conv-02/payroll-prod
   NPI-WIF-02 Finding  conv-02/payroll-prod
   NPI-WIF-08 Finding  conv-02/payroll-prod
   NPI-WIF-07 Warn     conv-02/payroll-test
   NPI-WIF-04 Finding  conv-03/github-intranet-tag
   NPI-WIF-08 Finding  conv-03/github-intranet-tag
   NPI-WIF-01 Finding  conv-06
   NPI-WIF-09 Finding  conv-08
   ```

   `payroll-prod` copies the Azure PowerShell sample's issuer, with its trailing slash, and names the environment `Production` where the workflow's is `production`: two findings, and an exchange test that fails. `payroll-test` was added in the portal and isn't in the file. `github-intranet-tag` copies the ARM template's audience, leading space and all. `conv-06` gives an Azure Functions app a certificate when a managed identity is available. `conv-08`'s secret still signed in on October 28, eight weeks after cutover.

5. **Read the exchange tests:**

   ```powershell
   Get-Content out/federation/exchange-tests.json -Raw | ConvertFrom-Json | Format-Table Credential, SubjectSource, Passed
   ```

   ```text
   Credential          SubjectSource Passed
   ----------          ------------- ------
   payroll-prod        derived        False
   github-main         derived         True
   github-intranet     derived         True
   github-intranet-tag derived        False
   aks-webfront        derived         True
   gh-reports          derived         True
   ```

   `aks-webfront` is on an identity the plan will create: its test ran against a client ID marked `pending:`, and its real exchange waits for Lab 2.

6. **Read the conversions:**

   ```powershell
   Get-Content out/federation/conversion-records.json -Raw | ConvertFrom-Json | ForEach-Object { [pscustomobject]@{ Id = $_.ConversionId; Target = $_.TargetKind; Gate = $_.CutoverGate; Run = $_.ParallelRun.Status; Day = $_.ParallelRun.Day } } | Format-Table
   ```

   ```text
   Id      Target              Gate     Run                  Day
   --      ------              ----     ---                  ---
   conv-01 managedIdentity     Ready    ReadyToDisableLegacy  40
   conv-02 federatedCredential Blocked  AwaitingCutover
   conv-03 federatedCredential Blocked  AwaitingCutover
   conv-04 managedIdentity     NotReady AwaitingCutover
   conv-05 certificate         NotReady AwaitingCutover
   conv-06 certificate         Blocked  AwaitingCutover
   conv-07 managedIdentity     Ready    ParallelRunning       15
   conv-08 federatedCredential Ready    LegacyStillInUse      59
   ```

   `conv-01` (`svc-hrsync` to the user-assigned identity `id-hrsync`) has run 40 days with the identity signing in and no logon by the old account since cutover, and its owner approved: the one disable in the plan. `conv-07`'s window ends November 14. `conv-03` is blocked by its tag credential, though `github-intranet` itself is created. `conv-05`, an on-premises task with no OIDC issuer, goes to a certificate under Chapter 04.

7. **Dry-run the plan with its approved hash:**

   ```powershell
   $sha = (Get-FileHash out/federation/plan.json -Algorithm SHA256).Hash.ToLower()
   ./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation-dryrun
   ```

   ```text
   DryRun: 4 WouldSend
     WouldSend DisableLegacy    WRITE Disable-ADAccount -Identity ad000000-0000-4000-8000-000000000001
     WouldSend CreateCredential POST  https://graph.microsoft.com/v1.0/applications/0a000000-0000-4000-8000-000000000004/federatedIdentityCredentials
     WouldSend CreateIdentity   PUT   https://management.azure.com/subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-identity/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-webfront?api-version=2024-11-30
     WouldSend CreateCredential PUT   https://management.azure.com/subscriptions/11111111-1111-4111-8111-111111111111/resourceGroups/rg-identity/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-webfront/federatedIdentityCredentials/aks-webfront?api-version=2024-11-30
   ```

8. **Apply it to the fake, then try a hash nobody approved:**

   ```powershell
   ./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation-apply -Apply
   ./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation/plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/ch05/tenant.json -OutputPath out/federation-x
   ```

   `Apply: 4 Sent`, in the same order, the identity before its credential; then the refusal, `The plan's SHA-256 is cbfac196…, not the approved 0000…; refusing to run a plan nobody reviewed.`

9. **Run the tests:**

   ```powershell
   Invoke-Pester -Path tests
   ```

**Expected result:** 152 tests passing across the example, `out/federation/manifest.json` listing 20 reads (5 application reads, 4 credential lists, 1 service principal, 4 sign-in pages, 2 identities, 2 role assignment reads, 2 AD reads) and 6 token exchange tests sent to the fake, and `out/federation-apply/manifest.json` listing the prechecks and the four writes. Delete `out` when you're done.

## Lab 2: test tenant

Use a test tenant in the worldwide or GCC cloud, a test subscription, a test Active Directory domain and a test repository, never production, with fictional names.

1. **Make a test conversion.** A test app registration with a client secret, an enabled test account (`svc-` prefix) in a test OU, and a test repository whose workflow signs in with Learn's Azure Login sample (pinned in [`examples/third_party/azure-login-oidc-sample`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/third_party/azure-login-oidc-sample)). Write a two-entry `conversions.json`: the test app getting a GitHub federated credential for the repository's `test` environment, and a new test user-assigned identity with no credential.
2. **Capture the claims.** Run the workflow once with a step that prints the decoded `iss` and `sub` of its OIDC token, never the token itself. Record them as `capturedSubject` and `capturedIssuer`, and record whether the `iss` ends with a slash (research gaps, row 41) and whether the repository uses the immutable subject format (row 43).
3. **Plan** with an app holding only `Application.Read.All` and `AuditLog.Read.All` and Reader on the test subscription, signed in as in Chapter 01:

   ```powershell
   ./Invoke-NpiFederation.ps1 -Cloud gcc -TenantId <tenant-id> -Domain <test-domain> -ConversionsPath <conversions> -CutoverLogPath <cutover-log> -OutputPath out/federation-test
   ```

   Have a second person review `plan.json` and pass you its SHA-256.
4. **Dry-run, then apply,** signed in as a person with Cloud Application Administrator and Managed Identity Contributor on the test resource group:

   ```powershell
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes Application.Read.All, Application.ReadWrite.All
   Connect-AzAccount -Environment AzureCloud -Tenant <tenant-id>
   ./Invoke-NpiFederation.ps1 -Cloud gcc -PlanPath out/federation-test/plan.json -ApprovedSha256 <sha> -Domain <test-domain> -OutputPath out/federation-test-apply -Apply
   ```

5. **Exchange for real.** Wait a few minutes for the credential to propagate,[^np05-considerations] run the workflow, and confirm its sign-in appears in the beta sign-in log with `clientCredentialType` `federatedIdentityCredential` and the credential's ID. Then add a second test credential with a deliberately wrong subject, run the workflow against it, and record the error the token endpoint returns (research gaps, row 44). Record whether a sign-in with the old client secret shows its key ID (row 47).
6. **Run the parallel run.** Record `CutoverOn` in the cutover log, plan again, and confirm `ParallelRunning` with one sign-in. To see the disable without waiting 30 days, run the plan with `-AsOf` 31 days later and the owner's approval recorded, review, and apply: the test account is disabled.
7. **Back it out.** Enable the test account, remove the test credentials and delete the test identity, the test app registration and the test account by hand in the test tenant and domain (this code never deletes), and delete the `out` folders: they name accounts and identities.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| Create a federated credential on an application | `POST /applications/{id}/federatedIdentityCredentials`; `audiences` one value, `api://AzureADTokenExchange` for Entra ID; name up to 120 characters, immutable; issuer and subject unique on the app; maximum 20; delegated `Application.ReadWrite.All`, application `Application.ReadWrite.OwnedBy`; Cloud Application Administrator or Application Administrator, or Application Developer or a member for apps they own | L4 and L5 | v1.0 | [^np05-graph-create] |
| List an application's federated credentials | `Application.Read.All` (the Get page differs; Chapter 01's row 4) | L4 and L5 | v1.0 | [^np05-graph-list] |
| Credential rules | Issuer, subject and audience must match the token; issuer whitespace blocks the exchange; 600 characters; one audience, `api://AzureADTokenExchange` recommended; name 3–120, alphanumeric first; no wildcards; 20 per app or user-assigned identity; a wrong subject is created without error | — | GA | [^np05-include] |
| Case | Issuer, subject and audience match case-sensitively | — | GA | [^np05-concepts] |
| System-assigned identity | Can't hold a federated credential | — | — | [^np05-trust-uami] |
| Create a federated credential on a user-assigned identity | `PUT {identity}/federatedIdentityCredentials/{name}?api-version=2024-11-30`; name pattern `^[a-zA-Z0-9]{1}[a-zA-Z0-9-_]{2,119}$`; Contributor or Owner on the trust page | Not stated on the pages read | GA (2024-11-30) | [^np05-arm-fic] [^np05-trust-uami] |
| Concurrency and propagation | Credentials under one identity created concurrently fail with 409; create them in sequence; a token request minutes after creating one may fail with `AADSTS70021`; retry | — | — | [^np05-considerations] |
| Create a user-assigned identity | `PUT {identity}?api-version=2024-11-30` with `location`; Managed Identity Contributor; reading needs Managed Identity Operator or Contributor | Not stated on the pages read | GA | [^np05-arm-uami] [^np05-uami-rest] |
| Managed Identity Contributor | Includes `userAssignedIdentities/write` and `federatedIdentityCredentials/write` | — | GA | [^np05-mi-contrib] |
| List role assignments | `GET {scope}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01&$filter=assignedTo('{objectId}')`; `roleAssignments/read`, such as Reader | — | GA | [^np05-roles-list] |
| Token request with a federated credential | Client credentials grant; `client_assertion_type` `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`; the assertion comes from the external issuer | — | GA | [^np05-clientcreds] |
| Sign-in log for service principals and managed identities | `GET /beta/auditLogs/signIns` with a `signInEventTypes` filter (only interactive sign-ins otherwise); `AuditLog.Read.All`; Reports Reader and others for delegated access; P1 or P2 license | L4 and L5 | Beta | [^np05-signins] |
| Sign-in properties | `clientCredentialType` (`clientSecret`, `federatedIdentityCredential`, `managedIdentity`, `certificate`, …), `federatedCredentialId`, `servicePrincipalCredentialKeyId` | — | Beta | [^np05-signin-resource] |
| Flexible federated credentials | `claimsMatchingExpression` instead of `subject`; Graph beta for apps; Resource Manager preview API versions for identities | — | Preview | [^np05-flexible] |
| GitHub immutable subjects | Applied automatically from July 15, 2026 to repositories created, renamed or transferred | — | — | [^np05-flexible] [^np05-mutable] |

Where Learn's pages differ: the GitHub issuer has no trailing slash in the CLI and REST create samples and on the flexible credential page, and has one in the Azure PowerShell sample, the CLI page's prose and the REST list response (research gaps, row 41); the pull request subject is `:pull-request` on the Entra page and `:pull_request` on App Service's (row 42); the trust page names Contributor or Owner for a credential on an identity, while Managed Identity Contributor holds the action and is what Learn names for creating the identity (row 45); and the how-to samples use API versions 2022-01-31-preview and 2015-08-31-preview where the reference is 2024-11-30 (row 48). The code follows the stricter reading in each case: an exact comparison against the claim captured from a real token, no derived pull request subject, the narrower role, and the GA API version.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A wrong subject | Accepted at creation; the workload fails at cutover, with no error from Entra ID | Checked against what the workload presents, then the exchange test; a cutover is blocked until both pass (NPI-WIF-02, -08) |
| A trailing slash or a stray space | The issuer or audience never matches | Exact comparison; exactly one audience, exactly `api://AzureADTokenExchange` (NPI-WIF-03, -04) |
| A subject derived from a guess | A pull request or immutable-format subject that GitHub never presents | Derived only for Learn's three name-based formats; otherwise captured from a test run |
| A mutable subject | A renamed repository's name passes to someone else's | The subject's source is recorded; prefer the immutable format where the issuer offers it[^np05-mutable] |
| A credential changed in place | The live workload's exchange breaks mid-run | `ReviewChange`: a new name and its own parallel run |
| A credential added outside the pipeline | A trust nobody reviewed | `Unmanaged` (NPI-WIF-07), reported every run, never deleted by code |
| Credentials created in parallel | 409 under one identity | One write at a time, the identity first |
| The first exchange right after creation | `AADSTS70021` during propagation | The apply says to wait; Lab 2 waits and retries |
| A disable on a stale lead | The job fails because the old account was still in use | 30 days, sign-ins on the new identity, no legacy use, the owner's approval, and a re-read before the write |
| A delete | The rollback is gone | No delete action; the writer refuses `DELETE`; secrets are removed by the owner through Chapter 04 |
| A secret removed too early | The workload falls back and fails | `RemoveSecretByOwner` only after a clean run; `clientSecret` sign-ins after cutover keep the run open |
| An assertion sent to a real endpoint | A token, or a test assertion, leaves the machine | The exchange test runs only against the fake; the manifest records the call, never the assertion |
| An unattended app with `Application.ReadWrite.All` | A standing permission that can add a credential to any app | The write path is a person's delegated session; the read path holds `Application.Read.All` and `AuditLog.Read.All` |
| A plan changed after review | Different writes from the ones approved | The approved SHA-256; this tenant and cloud; seven days; each credential re-checked before it's sent |
| A preview feature in production | Behavior that changes under you | Flexible credentials refused (NPI-WIF-05); the beta sign-in read labeled and its evidence kept |

## Checklist

- [ ] Every conversion's target follows the order, or has a recorded reason (NPI-WIF-01).
- [ ] Every federated credential's issuer and subject were checked against the claims captured from a real test run of its workload, and its token exchange test passed, before cutover.
- [ ] Every credential in the tenant on a converted app or identity is in the reviewed file, or its retirement is in review.
- [ ] Every user-assigned identity was created by the write path, and every managed identity's role assignments are in its record for Chapter 07.
- [ ] The plan's SHA-256 was approved by someone other than the person who applied it, and the write path ran as a person, delegated.
- [ ] Every cutover is in the cutover log, and every parallel run shows sign-ins on the new identity, no legacy use, and 30 days.
- [ ] Every disable has the owner's approval and a `DisabledOn`; every secret is removed through Chapter 04's change, after its run.
- [ ] Nothing was deleted by this code; rollback (re-enable, revert the configuration) is still possible.
- [ ] The pinned samples match their manifests, and every upstream commit since the pins has been reviewed.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 04 — App Management Policies and Certificate Rotation](04-app-management-policies-and-certificate-rotation.md) · [Workbook index](index.md) · [Next: Chapter 06 — gMSAs, dMSAs and the Kerberos Island →](06-gmsa-dmsa-and-the-kerberos-island.md)
:::

[^np05-concepts]: Microsoft Learn, "Workload identity federation concepts," how it works (the case-sensitive match), <https://learn.microsoft.com/entra/workload-id/workload-identity-federation> (accessed Oct 30, 2026).
[^np05-include]: Microsoft Learn, "Configure an app to trust an external identity provider," important considerations and restrictions (the include shared with the managed identity page), <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust> (accessed Oct 30, 2026); pinned in `examples/third_party/entra-wif-create-trust-pages/includes`.
[^np05-trust-app]: Microsoft Learn, "Configure an app to trust an external identity provider," Azure CLI, Azure PowerShell and Microsoft Graph samples, <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust> (accessed Oct 30, 2026).
[^np05-trust-uami]: Microsoft Learn, "Configure a user-assigned managed identity to trust an external identity provider," introduction, prerequisites, ARM template and REST samples, <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-create-trust-user-assigned-managed-identity> (accessed Oct 30, 2026).
[^np05-considerations]: Microsoft Learn, "Important considerations and restrictions for federated identity credentials," propagation; concurrent updates; errors, <https://learn.microsoft.com/entra/workload-id/workload-identity-federation-considerations> (accessed Oct 30, 2026).
[^np05-graph-create]: Microsoft Learn, "Create federatedIdentityCredential," permissions, request body, national cloud deployments, <https://learn.microsoft.com/graph/api/application-post-federatedidentitycredentials?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^np05-graph-list]: Microsoft Learn, "List federatedIdentityCredentials," permissions, <https://learn.microsoft.com/graph/api/federatedidentitycredential-list?view=graph-rest-1.0> (accessed Oct 30, 2026; read for Chapter 01).
[^np05-arm-fic]: Microsoft Learn, "Federated Identity Credentials - Create Or Update" (Managed Identity REST, 2024-11-30), <https://learn.microsoft.com/rest/api/managedidentity/federated-identity-credentials/create-or-update> (accessed Oct 30, 2026).
[^np05-arm-uami]: Microsoft Learn, "User Assigned Identities - Create Or Update" (Managed Identity REST, 2024-11-30), <https://learn.microsoft.com/rest/api/managedidentity/user-assigned-identities/create-or-update> (accessed Oct 30, 2026).
[^np05-uami-rest]: Microsoft Learn, "Manage user-assigned managed identities using REST," create and list, <https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/manage-user-assigned-managed-identities-rest> (accessed Oct 30, 2026).
[^np05-mi-contrib]: Microsoft Learn, "Azure built-in roles for Identity," Managed Identity Contributor, <https://learn.microsoft.com/azure/role-based-access-control/built-in-roles/identity#managed-identity-contributor> (accessed Oct 30, 2026).
[^np05-roles-list]: Microsoft Learn, "List Azure role assignments using the REST API," <https://learn.microsoft.com/azure/role-based-access-control/role-assignments-list-rest>, and "List Azure role assignments using the Azure portal," prerequisites, <https://learn.microsoft.com/azure/role-based-access-control/role-assignments-list-portal> (accessed Oct 30, 2026).
[^np05-clientcreds]: Microsoft Learn, "Microsoft identity platform and the OAuth 2.0 client credentials flow," third case: access token request with a federated credential, <https://learn.microsoft.com/entra/identity-platform/v2-oauth2-client-creds-grant-flow> (accessed Oct 30, 2026).
[^np05-signins]: Microsoft Learn, "List signIns" (beta), permissions, national cloud deployments, the `signInEventTypes` note, <https://learn.microsoft.com/graph/api/signin-list?view=graph-rest-beta> (accessed Oct 30, 2026).
[^np05-signin-resource]: Microsoft Learn, "signIn resource type" (beta), <https://learn.microsoft.com/graph/api/resources/signin?view=graph-rest-beta> (accessed Oct 30, 2026).
[^np05-flexible]: Microsoft Learn, "Flexible federated identity credentials (preview)," properties; issuer URLs, supported claims and operators by platform, <https://learn.microsoft.com/entra/workload-id/workload-identities-flexible-federated-identity-credentials>, and "Set up a Flexible Federated identity credential (preview)," <https://learn.microsoft.com/entra/workload-id/workload-identities-set-up-flexible-federated-identity-credential> (accessed Oct 30, 2026).
[^np05-mutable]: Microsoft Learn, "Mutable subjects in federated identity credentials," recommended hygiene, <https://learn.microsoft.com/entra/workload-id/workload-identities-federated-credential-mutable-subjects> (accessed Oct 30, 2026).
[^np05-appservice]: Microsoft Learn, "Deploy to Azure App Service by using GitHub Actions," manually set up a GitHub Actions workflow (OpenID Connect), <https://learn.microsoft.com/azure/app-service/deploy-github-actions> (accessed Oct 30, 2026).
[^np05-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
[^np05-src-entra]: Microsoft, MicrosoftDocs/entra-docs, `docs/workload-id/workload-identity-federation-create-trust.md`, `docs/workload-id/workload-identity-federation-create-trust-user-assigned-managed-identity.md` and `docs/workload-id/includes/federated-credential-configuration-considerations.md` at commit `d75a90ea1b07d0d2007cfab256c1ad02653d1e35` (February 25, 2026), code MIT License, documentation Creative Commons Attribution 4.0, <https://github.com/MicrosoftDocs/entra-docs/tree/d75a90ea1b07d0d2007cfab256c1ad02653d1e35/docs/workload-id> (accessed Oct 30, 2026); pinned copy in `examples/third_party/entra-wif-create-trust-pages`.
[^np05-src-graph]: Microsoft, microsoftgraph/microsoft-graph-docs-contrib, `api-reference/v1.0/api/federatedidentitycredential-post.md` at commit `08b242e8a85a03db4c4d1f41564cfc81632d5cd1` (December 4, 2025), code MIT License, documentation Creative Commons Attribution 4.0, <https://github.com/microsoftgraph/microsoft-graph-docs-contrib/blob/08b242e8a85a03db4c4d1f41564cfc81632d5cd1/api-reference/v1.0/api/federatedidentitycredential-post.md> (accessed Oct 30, 2026); pinned copy in `examples/third_party/graph-fic-create-page`.
[^np05-src-arm]: Microsoft, Azure/azure-rest-api-specs, `specification/msi/resource-manager/Microsoft.ManagedIdentity/ManagedIdentity/stable/2024-11-30/examples` (three files) at commit `37886acc4980d7ac8753fafe90619cae296eb477` (September 12, 2025), MIT License, <https://github.com/Azure/azure-rest-api-specs/tree/37886acc4980d7ac8753fafe90619cae296eb477/specification/msi/resource-manager/Microsoft.ManagedIdentity/ManagedIdentity/stable/2024-11-30/examples> (accessed Oct 30, 2026); pinned copy in `examples/third_party/msi-fic-rest-examples`.
