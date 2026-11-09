---
title: "Chapter 09 — Deploying to Test and Production"
description: "A runbook that takes the kit from the labs to a live test tenant and subscription, then to production, with the same commands and one settings file per environment: roles, approvals and the change record; a settings file with no secrets; pre-flight checks that verify the emergency access accounts and their exclusion from every Conditional Access policy before anything else; a stage order that prevents lockout; a smoke test with a synthetic administrator; go/no-go criteria; production waves; first-week monitoring with drift; rollback; and the evidence the ISSO keeps. Every step is a command or an exact portal path. Nobody has run it against a live tenant yet."
doc-type: workbook-chapter
audience: [Technical]
family: dw-privileged-access
part: How
series-order: 9
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: approved
reviewed-sha256: 54965996f1234dc7195bfc1bba90b842a324044afa535fff59ca781651188bc7
last-reviewed: 2026-11-09
---
# Chapter 09 — Deploying to Test and Production

*The labs prove the code. A deployment proves the order: emergency access first, report-only before enforcement, one role before every role, and a way back at every step.*

::: {.callout-note}
## In this chapter
The runbook the owner asked for: Chapters 02 to 08 deployed to a live test tenant with PIM and a test Azure subscription, then to the production tenant. The commands are the same in both stages; only the settings file changes. The order of work is built so a lockout can't happen: the emergency access accounts are verified and excluded from every Conditional Access policy first, new policies go in report-only, and approval is switched on only after both hold. Six scripts in `examples/privileged-access/deploy` do what the earlier chapters' code doesn't: write each chapter's input files from the settings file, run the pre-flight checks, read the smoke test's evidence, plan the rollback, and record and check the evidence. Each step shows the NIST SP 800-53 controls, OMB and CISA requirements it supports and the FedRAMP 20x indicator its evidence lines up with, and writes an evidence record the ISSO keeps; the go/no-go checks that every record is present and passing. This chapter has no labs of its own. Each step points back to the chapter whose code it runs.
:::

::: {.callout-important}
## Status: not run against a live tenant
Nobody has run this runbook against a live tenant or subscription. The six `deploy` scripts were run in fixture mode against a fictional tenant on November 2, 2026, and their output below is that run. Every "expected result" for a live step is what the code and Microsoft Learn lead us to expect, not something we've seen. Run Stage 1 completely, record what really happened against each expectation, and settle the open questions in the [research gaps](#open-questions) before Stage 2.
:::

## Requirements, indicators and evidence

Every step below has a requirements table: the requirement it helps meet, what the step does for it, the FedRAMP 20x Key Security Indicator its evidence lines up with, and the evidence the ISSO keeps. The requirements are NIST SP 800-53 Rev. 5 controls at the system's baseline,[^pa09-sp80053] [^pa09-fedramp-controls] OMB M-22-09's identity actions,[^pa09-m2209] CISA BOD 25-01's required Microsoft Entra ID configurations (SCuBA),[^pa09-bod] [^pa09-scuba] and the agency's use of a FedRAMP-authorized cloud service.[^pa09-agu] The control and indicator mappings are the ones the repository already verified, in [Book 04, Chapter 10](../../../books/b04-access/10-access-as-code-and-evidence.md#control-mapping), [Book 13, Appendix A](../../../books/b13-governance/appendix-a-requirements-mapping.md) and [Book 12, Chapter 12](../../../books/b12-security-operations/12-evidence-metrics-and-continuous-monitoring.md); which step supports which is the program's mapping (*design guidance*).

**Key Security Indicators belong to the providers.** KSIs are part of FedRAMP's 20x certification rules for cloud service providers.[^pa09-ksi-providers] [^pa09-ksi] The agency authorizes its own system. It lines its own evidence up with what its providers report against the indicators; it doesn't report KSIs itself ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). The KSI column below says which indicator a step's evidence lines up with, nothing more.

**The evidence is produced, not just named.** Each `deploy` script writes an evidence record for its run, and `deploy/Add-PaEvidenceRecord.ps1` records each earlier chapter's run: a JSON file in `<outputRoot>/evidence` with the time, the environment, the change record, the command, the result and its reason, the step's controls and indicators from `deploy/requirements.json`, the SHA-256 of every file in the step's run folder, and the SHA-256 of the record before it, so the records form a hash chain, as Chapter 08's packages do. `records.csv` lists them in order. `deploy/Test-PaEvidence.ps1` checks, for the go/no-go, that every required step has its record, passing and unchanged.

## Goal and audience

**Goal.** By the end of this chapter you can take the kit from Lab 2 to a live test tenant, prove it there with a synthetic administrator, roll it back and put it back, and then deploy it to production in waves, with a record the ISSO can check at every stage.

**Audience.** The deployment operator who types the commands, the change owner who approves each stage, the approvers and reviewers who act in the smoke test, and the ISSO who keeps the evidence. You should have run Lab 1 and Lab 2 of [Chapters 02](02-emergency-access-as-code.md) to [08](08-evidence-and-drift.md).

## Placeholders

Two placeholders appear in the commands. Everything else comes from the settings file, whose own placeholders are listed in [One environment settings file](#one-environment-settings-file).

| Placeholder | What it is |
|---|---|
| `<kit-folder>` | Your clone's `examples/privileged-access` folder |
| `<settings-folder>` | A folder in the program's private repository that holds the filled settings files; never inside the kit |

Production adds four placeholders in [Step 2.4](#step-2.4-convert-standing-assignments-to-eligible-in-waves), one row per administrator converted: `<holder-object-id>`, `<role-template-id>`, `<confirmed-on>` and `<wave>`.

## Before you start

### Roles

| Role | Who | What they do here |
|---|---|---|
| Change owner | The identity engineering lead | Opens the change record, approves each stage, signs the go/no-go with the ISSO |
| Deployment operator | An engineer with no standing administrator role | Runs every command, signed in as the deployment apps below, never as a person |
| Privileged Role Administrator | A named administrator, activated through PIM for the task | Does the portal steps: creates the role-assignable groups, grants admin consent. The Azure role assignments for the deployment app are made by a named Owner or User Access Administrator on the scopes, since only those built-in roles can write role assignments |
| Approvers | Members of `PIM-Approvers-T1` (two or more) | Approve the synthetic administrator's activation in the smoke test |
| Reviewers | Members of the reviewers group | Decide the pilot access review in the smoke test |
| Security operations | The alert's action group | Receive the emergency access alert, and confirm the drill |
| ISSO | The system's information system security officer | Keeps the evidence listed in [Evidence the ISSO keeps](#evidence-the-isso-keeps), signs the go/no-go |

Two separations hold throughout (*design guidance*): the operator who applies a change is never the approver in the smoke test, and no approver group is eligible for the role it approves, as Chapter 04's PA-PIM-03 checks.

### Approvals

| Stage | Approved by | Before |
|---|---|---|
| Stage 1, live test | Change owner, on the test change record | The pre-flight |
| Enforcing a Conditional Access policy | Change owner, after seven days of report-only results | Each `-AllowEnforce` run |
| Promotion to production | Change owner and ISSO, against the [go/no-go criteria](#promotion-gono-go-criteria) | Stage 2's change record |
| Stage 2, production | The change advisory board, on the production change record | The production pre-flight |
| Each conversion wave | Change owner, after the wave's activations are confirmed | Each `-Convert` run |

### The change record

Open one change record for each stage. Its number goes in the settings file's `changeRecord`, and the code stamps it on every request's justification, every run's manifest and the rollback plan. The record holds, at least: the settings file's SHA-256 (from the inputs manifest), the stage's planned steps (this chapter's headings), the rollback plan (`rollback-plan.json`), and the go/no-go decision. The pre-flight refuses a production settings file without one (PA-DEP-08).

### What must exist first

Build these in the test tenant before Stage 1, and in production before Stage 2. Each is a portal step, with the exact path from the chapter that built it in Lab 2.

1. **Licenses.** Microsoft Entra ID P2 or Microsoft Entra ID Governance, enough for every user who is eligible, approves, or is assigned to or performs an access review.[^pa09-license] The pre-flight checks that a subscription carries one of the two service plans (PA-DEP-03); counting users against the units is yours. Chapter 07's program position is stricter for reviews: budget Microsoft Entra ID Governance for every reviewer and every reviewed privileged user, and PIM for Groups reviews need it. A subscription that passes PA-DEP-03 on P2 alone isn't yet licensed for that.
2. **The emergency access accounts**, built to the standard, and their exclusion group: [Chapter 02, Lab 2](02-emergency-access-as-code.md#lab-2-test-tenant). Learn asks for two or more cloud-only accounts on `*.onmicrosoft.com`, phishing-resistant methods different from the normal administrators', permanent active Global Administrator, exclusion from every policy that blocks or restricts sign-in, monitoring of their sign-ins and audit events, and validation at least every 90 days.[^pa09-emergency]
3. **The log workspace and action group**, with the diagnostic setting that sends `AuditLogs`, `SignInLogs` and `NonInteractiveUserSignInLogs`: [Chapter 02, Lab 2, step 1](02-emergency-access-as-code.md#lab-2-test-tenant).
4. **The groups.** `PIM-Approvers-T0` and `PIM-Approvers-T1` (security groups, two or more members each), the reviewers and fallback reviewers groups, `CA-Persona-Admins` and `CA-Access-AzureOperators`, and the role-assignable group `PRV-T1-TeamsAdmin`: **Entra ID** > **Groups** > **All groups** > **New group**, with **Microsoft Entra roles can be assigned to the group** set to **Yes** for the `PRV` group.[^pa09-rag-create]
5. **Two test people.** A synthetic administrator, `pim.smoke01`, with no role and no standing access, licensed for PIM; and an approver in `PIM-Approvers-T1`. In production the synthetic administrator is a dedicated account for smoke tests, never a real administrator's (*design guidance*).
6. **The six deployment apps**, each with the same certificate: **Entra ID** > **App registrations** > **New registration**, then **Certificates & secrets** > **Certificates** > **Upload certificate**, then **API permissions** > **Add a permission** > **Microsoft Graph** > **Application permissions**, the permissions below, **Add permissions** and **Grant admin consent for** the tenant. Graph PowerShell signs in as an app with its client ID, the tenant and the certificate's thumbprint.[^pa09-connect] A pipeline can sign in with a federated credential instead, which needs no secret or certificate at all;[^pa09-wif] the commands below show the certificate.

| App (`identity.apps`) | Microsoft Graph application permissions, or Azure roles | From |
|---|---|---|
| `reader` | `AccessReview.Read.All`, `AuditLog.Read.All`, `AuthenticationContext.Read.All`, `Group.ReadBasic.All`, `GroupMember.ReadBasic.All`, `LicenseAssignment.Read.All`, `Policy.Read.All`, `Policy.Read.AuthenticationMethod`, `PrivilegedAssignmentSchedule.Read.AzureADGroup`, `PrivilegedEligibilitySchedule.Read.AzureADGroup`, `RoleAssignmentSchedule.Read.Directory`, `RoleEligibilitySchedule.Read.Directory`, `RoleManagement.Read.Directory`, `RoleManagementPolicy.Read.AzureADGroup`, `RoleManagementPolicy.Read.Directory`, `User.Read.All`, `User.ReadBasic.All`, `UserAuthenticationMethod.Read.All` | The read tasks of Chapters 02 to 08, and the `deploy` scripts |
| `caWriter` | `AuthenticationContext.Read.All`, `Policy.Read.All`, `Policy.Read.AuthenticationMethod`, `Policy.ReadWrite.ConditionalAccess`, `AuthenticationContext.ReadWrite.All` | [Chapter 03](03-conditional-access-for-administrators.md) |
| `pimWriter` | `RoleAssignmentSchedule.Read.Directory`, `RoleEligibilitySchedule.Read.Directory`, `RoleManagementPolicy.Read.Directory`, `RoleEligibilitySchedule.ReadWrite.Directory`, `RoleManagementPolicy.ReadWrite.Directory`; `RoleAssignmentSchedule.ReadWrite.Directory` only during a conversion wave | [Chapter 04](04-pim-for-entra-roles-as-code.md) |
| `groupsWriter` | `Group.ReadBasic.All`, `PrivilegedAssignmentSchedule.Read.AzureADGroup`, `PrivilegedEligibilitySchedule.Read.AzureADGroup`, `RoleManagementPolicy.Read.AzureADGroup`, `PrivilegedAssignmentSchedule.ReadWrite.AzureADGroup`, `PrivilegedEligibilitySchedule.ReadWrite.AzureADGroup`, `RoleManagementPolicy.ReadWrite.AzureADGroup` | [Chapter 05](05-pim-for-groups.md) |
| `reviewsWriter` | `AccessReview.ReadWrite.All` | [Chapter 07](07-access-reviews-of-privileged-roles.md) |
| `azure` | No Graph permission. Reader on each scope in `azure.scopes`; Monitoring Contributor on the monitoring resource group; User Access Administrator, time-bound for one day, only while Step 1.5 applies | [Chapter 06](06-pim-for-azure-resources.md), [Chapter 02](02-emergency-access-as-code.md) |

One reader app holds every read permission the stages need, and none that writes. Each write app holds only its chapter's task. *Design guidance*: the kit's per-task split is kept for writes, where it matters most; the reads are merged so the operator signs in to one reader.

## One environment settings file

Everything that differs between the test tenant and production is in one JSON file, `deploy/environment.template.json`, copied once per environment. The commands read only that file. It names identities and objects; it never holds a secret. Each app signs in with a certificate, named by its thumbprint, or a federated credential. The pre-flight refuses a key that would hold a secret, key material in a value, a client secret as the credential, and any placeholder left unfilled (PA-DEP-01 and PA-DEP-02).

| Section | What you fill in |
|---|---|
| `environment`, `changeRecord`, `cloud`, `tenantId`, `outputRoot` | `test` or `production`; the stage's change record; `gcc`, `gcchigh` or `dod` (there is no default); the tenant ID; where the runs are written |
| `identity` | `certificate` or `federated`, the thumbprint, the six apps' client IDs, and the `azure` app's service principal object ID |
| `emergencyAccess` | The accounts and their exclusion group by object ID, their owner, and each account's last validation drill |
| `monitoring` | The workspace, action group, region and resource group for the emergency access alert |
| `conditionalAccess.map` | Chapter 03's placeholder map: the emergency group, the admins and Azure operators groups, the trusted location and the approved key models |
| `pimRoles` | The role files (test: `teams-administrator.json`; production: `["*"]`), the approver groups, one eligibility row per role, documented exceptions, and confirmed activations |
| `pimGroups` | The `PRV` groups' desired state, in Chapter 05's shape; in test, the synthetic administrator as a time-bound active member of `PRV-T1-TeamsAdmin`; in production, `previousDesiredPath`, the reviewed file before this change |
| `azure` | Chapter 06's desired state: scopes, tier settings, approver groups and eligible assignments |
| `accessReviews` | Chapter 07's review series; in test, the pilot series `PAR-T1-TeamsAdministrator-Pilot`; in production, `previousConfigPath` if a series is updated |
| `smokeTest` | The synthetic administrator, the approver, and the pilot role, role file and review |

### Step 0: start every session

Run this block at the start of every PowerShell session in this chapter. Stage 1 sets `$S` to the test file; Stage 2 sets it to the production file. Nothing else in the commands changes. In the very first session the settings file doesn't exist yet, so do [Step 0.1](#step-0.1-make-the-test-settings-file) first to make it, then run this block.

```powershell
Set-Location <kit-folder>
$S   = '<settings-folder>/environment.test.json'
$cfg = Get-Content $S -Raw | ConvertFrom-Json
$in  = "$($cfg.outputRoot)/inputs"
$run = $cfg.outputRoot
$t   = $cfg.tenantId
$tp  = $cfg.identity.certificateThumbprint
$app = $cfg.identity.apps
Import-Module ./powershell/PrivilegedAccess/PrivilegedAccess.psm1
$c   = Get-PaCloud -Cloud $cfg.cloud
```

`$c.GraphEnvironment` and `$c.AzureEnvironment` are the sign-in environments for the cloud the file names (for GCC, `Global` and `AzureCloud`), so no command names a cloud of its own.

### Step 0.1: make the test settings file

Copy the template, then fill every `<placeholder>` in the copy with the test tenant's values. The second command lists what is still unfilled; repeat until it prints nothing.

```powershell
Copy-Item deploy/environment.template.json <settings-folder>/environment.test.json
Import-Module ./deploy/PaDeploy.psm1
Test-PaDeploySettings -Settings (Read-PaDeploySettings -Path <settings-folder>/environment.test.json) | Format-Table Rule, Object, Issue
```

The template itself reports 57 placeholders and no secret. Run on November 2, 2026:

```powershell
Test-PaDeploySettings -Settings (Read-PaDeploySettings -Path deploy/environment.template.json) | Group-Object Rule | Select-Object Name, Count
```

```text
Name      Count
----      -----
PA-DEP-02    57
```

### Step 0.2: write every chapter's input files

```powershell
./deploy/New-PaDeployInputs.ps1 -SettingsPath $S
```

It writes, under `<outputRoot>/inputs`, each earlier chapter's input in its own shape: `emergency-access.json`, `emergency-validations.csv` and `exceptions.csv` (Chapters 02 and 04); `ca-map.json` and a copy of `ca-policies` (Chapter 03); `pim-roles`, `pim-bindings.json` and `confirmed-activations.csv` (Chapter 04); `prv-groups.json` (Chapter 05); `azure-desired.json` (Chapter 06); `access-reviews.json` (Chapter 07); and `manifest.json` with each file's SHA-256. Copy the manifest's SHA-256 values into the change record. Run in fixture mode on November 2, 2026, with the fictional test settings:

```powershell
./deploy/New-PaDeployInputs.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json
```

```text
Settings: environment test, change CHG-3001, tenant c0000000-0000-4000-8000-000000000009, cloud gcc
Settings check: 0 Finding
Inputs written to out/deploy-test/inputs: 21 files (1 role file(s), 1 PRV group(s), 1 review series); manifest.json lists each SHA-256
Evidence: out/deploy-test/evidence/20261102T123032446Z-settings.json (Pass, sha256 22bff1b12696)
```

Run this step again whenever the settings file changes. It replaces the whole `inputs` folder, and writes a new `settings` record.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 CM-3 Configuration Change Control | One reviewed settings file per environment, under a change record; the inputs written from it with a manifest | KSI-CMT-LMC | `inputs/manifest.json`; the `settings` record in `evidence/` |
| CM-5 Access Restrictions for Change | Changes are made only by the deployment apps, never by a person's account | KSI-CMT-RMV | The settings file's `identity` section; each run's manifest |
| IA-5(2) Public Key-based Authentication | Every app signs in with a certificate or federated credential; no secret is accepted (PA-DEP-01) | KSI-IAM-SNU | The `settings` record's reason (`0 Finding in the settings file`) |

## Pre-flight checks

Lockout is the danger that matters most. Learn names the case: every Privileged Role Administrator and Global Administrator eligible and none active, approval required, and no approvers, so nobody can approve and the tenant is locked.[^pa09-settings] A Conditional Access policy that the emergency accounts can't pass does the same during an outage, which is why Learn excludes them from every policy that blocks or restricts sign-in.[^pa09-emergency] So nothing in a stage runs until the pre-flight passes, and it runs again after every Conditional Access change.

`deploy/Test-PaPreflight.ps1` checks, in this order:

| Rule | Severity | What it checks | Source |
|---|---|---|---|
| PA-DEP-01 | Finding | No secret in the settings file, and each app uses a certificate or federated credential | *Design guidance* |
| PA-DEP-02 | Finding | No placeholder left | *Design guidance* |
| PA-DEP-08 | Finding | `test` or `production`, and production has a change record | *Design guidance* |
| PA-DEP-03 | Finding; Info | An enabled subscription carries `AAD_PREMIUM_P2` or `Entra_Identity_Governance`; Info names it, with its units; either plan passes, so read the plan it names against Chapter 07's Governance position for reviewers and reviewed users | Learn: PIM needs Microsoft Entra ID P2 or ID Governance[^pa09-license] [^pa09-service-plans] [^pa09-sku] |
| PA-DEP-04 | Finding | Every Finding of Chapter 02's check, PA-EA-01 to PA-EA-10, unchanged | Learn's standard[^pa09-emergency], [Chapter 02](02-emergency-access-as-code.md) |
| PA-DEP-05 | Finding | Every Conditional Access policy in the tenant, enabled, report-only or off, excludes every emergency account, through the group or directly | Learn excludes them from policies that block or restrict;[^pa09-emergency] *design guidance* for every state |
| PA-DEP-06 | Finding | Every policy file the stage will deploy excludes the emergency group | [Chapter 03](03-conditional-access-for-administrators.md), PA-CA |
| PA-DEP-09 | Finding | The synthetic administrator is neither an emergency account nor in their exclusion group | *Design guidance*: it would skip the policies the smoke test proves |

PA-DEP-05 is stricter than Chapter 02. Learn says report-only policies don't need the exclusion,[^pa09-emergency] and Chapter 02 reports them as Info. This stage will turn report-only policies on, and a policy that's off can be turned on with one click, so the pre-flight wants the exclusion in every policy before the stage starts (research gaps, row 104).

The pre-flight reads only. `LicenseAssignment.Read.All` is the least-privileged permission for the license read;[^pa09-sku] the rest are Chapter 02's six. Run it as the reader app; it refuses a Graph session in any other tenant than the settings file names:

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./deploy/Test-PaPreflight.ps1 -SettingsPath $S
```

**Expected result, live:** `PASS: the emergency access accounts are verified and excluded; the stage may start.` and exit code 0. Any Finding prints `BLOCKED` and exits 1; fix it in the tenant, not in the settings file, and run the pre-flight again.

Run in fixture mode on November 2, 2026. The fictional tenant's emergency accounts meet Chapter 02's standard, but one policy that's off, `CA099-Pilot-Block-Unknown-Platforms`, doesn't exclude them. Chapter 02 doesn't report it; the pre-flight blocks:

```powershell
./deploy/Test-PaPreflight.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json -FixturePath deploy/tests/fixtures/tenant.json -AsOf 2026-11-02
```

```text
Pre-flight (test, Fixture): 1 Finding, 0 Warn, 1 Info
  Info    PA-DEP-03 subscribedSkus: PIM licensed by: EMSPREMIUM_GOV (AAD_PREMIUM_P2, 25 enabled, 12 consumed). Count eligible users, approvers and reviewers against the enabled units
  Finding PA-DEP-05 CA099-Pilot-Block-Unknown-Platforms: State disabled: doesn't exclude 2 emergency account(s); add the exclusion group before this stage
BLOCKED: fix every Finding, then run the pre-flight again. Nothing in this stage may run.
Written to out/deploy-test/preflight (manifest.json lists every request and file hash)
Evidence: out/deploy-test/evidence/20261102T123035477Z-preflight.json (Fail, sha256 7b6274c26dca)
```

The run writes a `preflight` record, `Fail` here.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-2 Account Management | The emergency access accounts exist, are enabled, and are checked against the standard (PA-DEP-04) | KSI-IAM-ELP | `preflight/findings.json`; the `preflight` record |
| AC-6 Least Privilege | Licenses for PIM are present before any role is made eligible (PA-DEP-03) | KSI-IAM-ELP | The PA-DEP-03 Info row in `findings.json` |
| CA-7 Continuous Monitoring; CM-4(2) Verification of Controls | Every Conditional Access policy and policy file excludes the emergency accounts, checked before the stage and after every policy change (PA-DEP-05, PA-DEP-06) | KSI-MLA-EVC, KSI-CMT-VTD | Every `preflight*/` folder and its record |
| OMB M-22-09, phishing-resistant MFA; BOD 25-01 MS.AAD.3.6v1 | The emergency accounts hold only phishing-resistant methods (Chapter 02's PA-EA-06) | KSI-IAM-APM | `preflight/findings.json` with no PA-EA-06 Finding |

The same tenant with that exclusion added passes:

```powershell
./deploy/Test-PaPreflight.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json -FixturePath deploy/tests/fixtures/tenant-ready.json -AsOf 2026-11-02
```

```text
Pre-flight (test, Fixture): 0 Finding, 0 Warn, 1 Info
  Info    PA-DEP-03 subscribedSkus: PIM licensed by: EMSPREMIUM_GOV (AAD_PREMIUM_P2, 25 enabled, 12 consumed). Count eligible users, approvers and reviewers against the enabled units
PASS: the emergency access accounts are verified and excluded; the stage may start.
Written to out/deploy-test/preflight (manifest.json lists every request and file hash)
Evidence: out/deploy-test/evidence/20261102T123037944Z-preflight.json (Pass, sha256 4f7b18f539c6)
```

## Stage 1: live test

Use the test tenant with PIM and the test Azure subscription, with the fictional people from [Before you start](#before-you-start). Learn's deployment plan asks for exactly this: a pilot with test users first, a test plan that compares expected and actual results, and production only after thorough testing.[^pa09-pim-plan] Run Step 0 with `$S = '<settings-folder>/environment.test.json'`, then Step 0.2 and the pre-flight. The stage order below is fixed; each step starts only when the one before it shows its expected result.

### Step 1.1: emergency access accounts and their monitoring

Check the accounts again and write the alert, as [Chapter 02](02-emergency-access-as-code.md) does:

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./Invoke-PaEmergencyCheck.ps1 -Cloud $cfg.cloud -ConfigPath "$in/emergency-access.json" -ValidationsPath "$in/emergency-validations.csv" `
    -OutputPath "$run/emergency" -WorkspaceResourceId $cfg.monitoring.workspaceResourceId `
    -ActionGroupResourceId $cfg.monitoring.actionGroupResourceId -Location $cfg.monitoring.location -TenantId $t
```

**Expected:** `Emergency access: 0 Finding`. A PA-EA-06 Warn is acceptable only where certificate-based authentication is confirmed for that account.

Deploy the alert as the `azure` app, which holds Monitoring Contributor on the monitoring resource group:

```powershell
Connect-AzAccount -ServicePrincipal -Environment $c.AzureEnvironment -Tenant $t -ApplicationId $app.azure -CertificateThumbprint $tp
New-AzResourceGroupDeployment -ResourceGroupName $cfg.monitoring.resourceGroup -TemplateFile "$run/emergency/emergency-alert.json"
```

Then drill, as Learn's validation asks:[^pa09-emergency] tell security operations, sign in to the Microsoft Entra admin center with the first emergency account from the designated workstation, and open **ID Governance** > **Privileged Identity Management** > **Microsoft Entra roles** > **Roles**. **Expected:** the action group's mailbox receives the alert within two evaluation periods (ten minutes; Chapter 02's rule evaluates every five). Record the drill in the settings file and write the inputs again:

```powershell
$j = Get-Content $S -Raw | ConvertFrom-Json
$j.emergencyAccess.validations += [pscustomobject]@{ accountId = $j.emergencyAccess.accounts[0].id; date = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd'); result = 'Pass'; ticket = $j.changeRecord }
$j | ConvertTo-Json -Depth 30 | Set-Content $S
./deploy/New-PaDeployInputs.ps1 -SettingsPath $S
```

Record the step's evidence. The script judges the run folder as `deploy/requirements.json` says and writes the record to `<outputRoot>/evidence`:

```powershell
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step emergency-access -RunPath "$run/emergency" -Command './Invoke-PaEmergencyCheck.ps1 (Step 1.1)'
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-2 Account Management; AC-2(4) Automated Audit Actions | The accounts are checked against the standard, and their use raises an alert | KSI-MLA-LET | `emergency/findings.json`; `emergency-alert.json`; the `emergency-access` record |
| AU-2 Event Logging | Sign-ins, non-interactive sign-ins and audit events for the accounts are sent to the workspace and alerted on | KSI-MLA-LET | The diagnostic setting; the deployed alert rule |
| CA-7 Continuous Monitoring | The drill proves the alert fires; it repeats every 90 days | KSI-MLA-EVC | The alert email; the drill row in the settings file |
| BOD 25-01 MS.AAD.3.6v1 | The accounts use phishing-resistant methods | KSI-IAM-APM | `emergency/findings.json` with no PA-EA-06 Finding |

### Step 1.2: Conditional Access for administrators, report-only first

Plan as the reader, then apply as `caWriter`. Chapter 03's code creates every new policy report-only and enforces nothing without `-AllowEnforce`. The first apply creates the contexts and the authentication strength; the second, the policies that need them:

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./Invoke-PaCaAdmin.ps1 -Cloud $cfg.cloud -MapPath "$in/ca-map.json" -PolicyPath "$in/ca-policies" -OutputPath "$run/ca-plan" -TenantId $t
Get-Content "$run/ca-plan/plan.json" -Raw | ConvertFrom-Json | Format-Table Kind, Name, Action
```

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.caWriter -CertificateThumbprint $tp -NoWelcome
./Invoke-PaCaAdmin.ps1 -Cloud $cfg.cloud -MapPath "$in/ca-map.json" -PolicyPath "$in/ca-policies" -OutputPath "$run/ca-apply1" -TenantId $t -Apply
./Invoke-PaCaAdmin.ps1 -Cloud $cfg.cloud -MapPath "$in/ca-map.json" -PolicyPath "$in/ca-policies" -OutputPath "$run/ca-apply2" -TenantId $t -Apply
```

**Expected:** in **Entra ID** > **Conditional Access** > **Policies**, every new policy shows **Report-only**. Run the pre-flight again, to a new folder; it must still pass, now with the new policies in the tenant:

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./deploy/Test-PaPreflight.ps1 -SettingsPath $S -OutputPath "$run/preflight-after-ca"
```

Watch report-only for at least seven days. Learn's deployment plan for Conditional Access says to keep each policy report-only for at least a week before enforcing it, reviewing the sign-in logs; report-only policies are evaluated at sign-in but not enforced, and their results appear on the sign-in log's **Report-only** tab.[^pa09-ca-plan] [^pa09-report-only] During the week, sign in as a test administrator and as an emergency account, and read **Entra ID** > **Monitoring & health** > **Sign-in logs**, then each sign-in's **Report-only** tab. **Expected:** the test administrator's sign-ins show the policies applying; the emergency account's show **Report-only: Not applied** for every policy, because it is excluded.

Then enforce the activation gate alone, `PIM-Activation-c1`, because Chapter 04 won't set an authentication context on a role until its policy is on.[^pa09-settings] The first two commands copy the stage's policy files and edit the copy, so the inputs the `settings` record hashed stay unchanged:

```powershell
Copy-Item -Recurse "$in/ca-policies" "$run/ca-policies-gate"
$f = "$run/ca-policies-gate/policies/PIM-Activation-c1.json"
(Get-Content $f -Raw) -replace '"state":\s*"[^"]+"', '"state": "enabled"' | Set-Content $f -NoNewline
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.caWriter -CertificateThumbprint $tp -NoWelcome
./Invoke-PaCaAdmin.ps1 -Cloud $cfg.cloud -MapPath "$in/ca-map.json" -PolicyPath "$run/ca-policies-gate" -OutputPath "$run/ca-enforce-gate" -TenantId $t -Apply -AllowEnforce
```

**Expected:** the plan shows `PIM-Activation-c1` as an Update with the state change and nothing else; Chapter 03's PA-CA-04 clears for it. Run the pre-flight again to `"$run/preflight-after-gate"`, as above. Leave the other administrator policies report-only in this stage unless the change record says to enforce them; enforce each the same way, one per change, editing `"$run/ca-policies-gate"` and passing it as `-PolicyPath`. Every later Conditional Access run in the stage uses that folder.

Record the step's evidence. The script judges the run folder as `deploy/requirements.json` says and writes the record to `<outputRoot>/evidence`:

```powershell
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step conditional-access -RunPath "$run/ca-enforce-gate" -Command './Invoke-PaCaAdmin.ps1 -Apply -AllowEnforce (Step 1.2)'
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-3 Access Enforcement | The administrator policies are deployed from reviewed files, report-only first | KSI-IAM-ELP | `ca-plan/`, `ca-apply1/`, `ca-apply2/`; the `conditional-access` record |
| IA-2(1), IA-2(2) Multi-factor Authentication | The privileged authentication strength and the activation gate `c1` require phishing-resistant MFA | KSI-IAM-APM | The policy files; `ca-enforce-gate/`; sign-in logs showing the strength satisfied |
| CM-3(2) Testing, Validation, and Documentation of Changes | Seven days of report-only results before any policy is enforced, one per change | KSI-CMT-VTD | Sign-in log exports with the Report-only tab; the change record |
| OMB M-22-09, phishing-resistant MFA; BOD 25-01 MS.AAD.3.6v1 | Phishing-resistant MFA for highly privileged roles, through the policy and the gate | KSI-IAM-APM | The policy files and `ca-enforce-gate/plan.json` |

### Step 1.3: PIM role settings and eligible assignments for the pilot role

The pilot role is Teams Administrator, in Tier 1, the plan's pilot class (wave 1 in [Chapter 04](04-pim-for-entra-roles-as-code.md)). Dry-run as the reader, read the diff with a second person, then apply as `pimWriter`:

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./Invoke-PaPimRoleSettings.ps1 -Cloud $cfg.cloud -Wave 1 -RolesPath "$in/pim-roles" -BindingsPath "$in/pim-bindings.json" `
    -EmergencyConfigPath "$in/emergency-access.json" -ExceptionsPath "$in/exceptions.csv" -OutputPath "$run/pim-plan" -TenantId $t
Import-Csv "$run/pim-plan/diff.csv" | Format-Table Role, RuleId, Property, Tenant, Desired
```

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.pimWriter -CertificateThumbprint $tp -NoWelcome
./Invoke-PaPimRoleSettings.ps1 -Cloud $cfg.cloud -Wave 1 -RolesPath "$in/pim-roles" -BindingsPath "$in/pim-bindings.json" `
    -EmergencyConfigPath "$in/emergency-access.json" -ExceptionsPath "$in/exceptions.csv" -OutputPath "$run/pim-apply" -TenantId $t `
    -Apply -ActivationGateChecked
```

**Expected:** the dry run shows 0 Finding (PA-PIM-01 and PA-PIM-02 clear: approvers exist, and the emergency accounts hold permanent active Global Administrator); the apply ends with `0 differences from the role files after reading back`; and **ID Governance** > **Privileged Identity Management** > **Microsoft Entra roles** > **Roles** > **Teams Administrator** > **Role settings** matches `teams-administrator.json`: eight hours, context `c1`, justification and ticket, approval by `PIM-Approvers-T1`. `PRV-T1-TeamsAdmin` is eligible for the role. Keep `$run/pim-apply`: its `before.json` is the rollback.

Record the step's evidence. The script judges the run folder as `deploy/requirements.json` says and writes the record to `<outputRoot>/evidence`:

```powershell
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step pim-roles -RunPath "$run/pim-apply" -Command './Invoke-PaPimRoleSettings.ps1 -Wave 1 -Apply (Step 1.3)'
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-6 Least Privilege | The pilot role is eligible to its `PRV` group, for at most its tier's eligibility; activation lasts at most eight hours | KSI-IAM-JIT, KSI-IAM-ELP | `pim-plan/diff.csv`; `pim-apply/` with `before.json` and an empty `verify.csv`; the `pim-roles` record |
| AC-5 Separation of Duties | Approval by `PIM-Approvers-T1`, which isn't eligible for the role (PA-PIM-03) | KSI-IAM-JIT | `pim-plan/findings.json` with no PA-PIM-03 |
| CM-5 Access Restrictions for Change | Role settings change only through the writer app, from a reviewed file | KSI-IAM-JIT | `pim-apply/manifest.json` with each write's SHA-256 |
| BOD 25-01 MS.AAD.7.4v1 to MS.AAD.7.6v1 | Highly privileged roles are assigned through PIM, with no permanent active assignment except the emergency accounts | KSI-IAM-JIT | `pim-apply/verify.csv`; the role's settings in PIM |

### Step 1.4: PIM for Groups

[Chapter 05](05-pim-for-groups.md)'s code brings `PRV-T1-TeamsAdmin` under PIM and makes the synthetic administrator a time-bound active member, so they can activate the role the group is eligible for. Learn says a group can't be taken back out of PIM once it's onboarded,[^pa09-groups-concept] so use a group made for this deployment.

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./Invoke-PaPimGroups.ps1 -Cloud $cfg.cloud -DesiredPath "$in/prv-groups.json" -OutputPath "$run/groups-plan" -TenantId $t
Get-Content "$run/groups-plan/diff.txt"
```

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.groupsWriter -CertificateThumbprint $tp -NoWelcome
./Invoke-PaPimGroups.ps1 -Cloud $cfg.cloud -DesiredPath "$in/prv-groups.json" -OutputPath "$run/groups-apply" -TenantId $t -Apply -ActivationGateChecked
./Invoke-PaPimGroups.ps1 -Cloud $cfg.cloud -DesiredPath "$in/prv-groups.json" -OutputPath "$run/groups-replan" -TenantId $t
```

`-ActivationGateChecked` is the same statement as in Step 1.3: the group policies select `c1` too, and the apply refuses to set it without that statement. **Expected:** the apply reports `0 failed`, and the plan after it reports `Plan: 0 change(s)`. In **ID Governance** > **Privileged Identity Management** > **Groups** > `PRV-T1-TeamsAdmin`, the synthetic administrator is an active member until the end date in the settings file.

Record the step's evidence. The script judges the run folder as `deploy/requirements.json` says and writes the record to `<outputRoot>/evidence`:

```powershell
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step pim-groups -RunPath "$run/groups-apply" -Command './Invoke-PaPimGroups.ps1 -Apply (Step 1.4)'
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-2 Account Management | Group membership is time-bound, with an end date and a ticket per member | KSI-IAM-JIT | `groups-plan/diff.txt`; `groups-apply/results.json`; the `pim-groups` record |
| AC-6 Least Privilege | The `PRV` group's membership is governed by PIM for Groups, and the plan after the apply shows no change | KSI-IAM-ELP | `groups-replan/` with `Plan: 0 change(s)` |
| BOD 25-01 MS.AAD.7.5v1 | Privileged access through the group is provisioned in PIM, not assigned directly | KSI-IAM-JIT | The group under **Privileged Identity Management** > **Groups** |

### Step 1.5: Azure resource roles

As the `azure` app, plan with Reader, then grant the app User Access Administrator on the test scopes for one day (**Access control (IAM)** > **Add** > **Add role assignment**, **User Access Administrator**, the app, time-bound, **Review + assign**) and apply with the same run ID, so the dry run and the apply send the same request names:

```powershell
Connect-AzAccount -ServicePrincipal -Environment $c.AzureEnvironment -Tenant $t -ApplicationId $app.azure -CertificateThumbprint $tp
./Invoke-PaAzurePim.ps1 -Cloud $cfg.cloud -DesiredPath "$in/azure-desired.json" -CallerPrincipalId $cfg.identity.azureAppObjectId `
    -OutputPath "$run/azure-dry" -RunId $cfg.changeRecord -TenantId $t
Get-Content "$run/azure-dry/diff.txt"
```

```powershell
./Invoke-PaAzurePim.ps1 -Cloud $cfg.cloud -DesiredPath "$in/azure-desired.json" -CallerPrincipalId $cfg.identity.azureAppObjectId `
    -OutputPath "$run/azure-apply" -RunId $cfg.changeRecord -TenantId $t -Apply
Get-Content "$run/azure-apply/diff-after.txt"
```

**Expected:** `diff-after.txt` is empty, and the [Chapter 06](06-pim-for-azure-resources.md) findings show no PA-AZ-05 (the plan never removes the app's own access). Keep `$run/azure-dry`: its `state.json` holds the policies as they were, for the rollback. Then remove the app's User Access Administrator (**Access control (IAM)** > **Role assignments**, the row, **Remove**).

Record the step's evidence. The script judges the run folder as `deploy/requirements.json` says and writes the record to `<outputRoot>/evidence`:

```powershell
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step azure-roles -RunPath "$run/azure-apply" -Command './Invoke-PaAzurePim.ps1 -Apply (Step 1.5)'
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-6 Least Privilege | Azure role policies by tier; Owner eligible through a group, not standing | KSI-IAM-JIT, KSI-IAM-ELP | `azure-dry/state.json`; `azure-apply/` with an empty `diff-after.txt`; the `azure-roles` record |
| CM-5 Access Restrictions for Change | The app holds User Access Administrator for one day, for the apply only | KSI-IAM-JIT | The subscription's activity log: the grant and its removal |
| FedRAMP: agency use of an authorized cloud service | The subscription runs on the provider's authorized service; the agency's own configuration is what this step changes and evidences | — | The provider's authorization in the system security plan; this step's records |

### Step 1.6: access reviews

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./Invoke-PaAccessReviews.ps1 -Cloud $cfg.cloud -Mode Plan -ConfigPath "$in/access-reviews.json" -OutputPath "$run/reviews-plan" -SkipAzure -TenantId $t
Get-Content "$run/reviews-plan/plan.json" -Raw | ConvertFrom-Json | Format-Table name, action
```

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reviewsWriter -CertificateThumbprint $tp -NoWelcome
./Invoke-PaAccessReviews.ps1 -Cloud $cfg.cloud -Mode Plan -ConfigPath "$in/access-reviews.json" -OutputPath "$run/reviews-apply" -SkipAzure -TenantId $t -Apply
Get-Content "$run/reviews-apply/results.json" -Raw | ConvertFrom-Json | Format-Table Name, Action, Result, Note
```

**Expected:** `PAR-T1-TeamsAdministrator-Pilot` is `Create`, `Sent`, `read back`. [Chapter 07](07-access-reviews-of-privileged-roles.md)'s guard keeps silence from removing the emergency accounts' Global Administrator assignment (the series reviews them with "no change" on silence), and PA-AR-E08 flags a reviewer's denial, which can still land.

Record the step's evidence. The script judges the run folder as `deploy/requirements.json` says and writes the record to `<outputRoot>/evidence`:

```powershell
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step access-reviews -RunPath "$run/reviews-apply" -Command './Invoke-PaAccessReviews.ps1 -Apply (Step 1.6)'
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-2 Account Management | A review series for the pilot role, with reviewers, a fallback and auto-apply | KSI-IAM-JIT | `reviews-plan/`; `reviews-apply/results.json`; the `access-reviews` record |
| AC-6(7) Review of User Privileges | The role's privileges are reviewed on the program's schedule; the frequency is organization-defined | KSI-IAM-ELP | The decisions, read by Chapter 07's evidence mode after each instance |

### Step 1.7: smoke test with the synthetic administrator

Learn's deployment plan gives the test case for a role that needs approval: the activation asks for its controls, the approver is notified and approves, and the role expires after its set time.[^pa09-pim-plan] The smoke test walks that case with the synthetic administrator and adds the access review. People do the four actions in the portal; `deploy/Invoke-PaSmokeTest.ps1` reads the evidence after each and compares it with the expected result. It reads three things: the role's active instances, the directory audit log, and the review's decisions. It doesn't read the activation request itself, because Learn lists `RoleAssignmentSchedule.ReadWrite.Directory` as the least-privileged permission even for listing requests, and the smoke test holds no write permission (research gaps, row 103).[^pa09-ras-list]

First record when the test starts, so every phase reads from the same moment:

```powershell
(Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ') | Set-Content "$run/smoke-start.txt"
```

| Phase | The person's action | Expected result |
|---|---|---|
| Activate | The synthetic administrator signs in to the Microsoft Entra admin center, opens **ID Governance** > **Privileged Identity Management** > **My roles** > **Microsoft Entra roles**, selects **Activate** on Teams Administrator, completes the additional verification, sets the duration to one hour, enters the change record as the reason and ticket, and selects **Activate**[^pa09-activate] | The request is logged as `Add member to role requested (PIM activation)`; no instance is active, because approval holds; **My requests** shows it pending approval |
| Approve | The approver opens **ID Governance** > **Privileged Identity Management** > **Approve requests**, selects the request, enters a justification and selects **Submit**, within 24 hours[^pa09-approve] | `Add member to role request approved (PIM activation)` is logged; one instance is active, `assignmentType` `Activated`, `memberType` `Direct`, no longer than the role file's eight hours |
| Expire | Nobody: wait until the instance's end time | No instance remains; `Remove member from role (PIM activation expired)` is logged |
| Review | On the review's start date, a reviewer opens **ID Governance** > **Privileged Identity Management** > **Review access**, selects the pilot review, chooses **Approve** for the synthetic administrator and enters a reason[^pa09-review] | The pilot series has an instance with a decision on the synthetic administrator, not `NotReviewed`, with a justification |

The approver can't approve their own request, and service principals can't approve at all, so the approval is a person.[^pa09-approve] After each action, run its phase as the reader:

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath $S -Phase Activate -Since (Get-Content "$run/smoke-start.txt")
```

```powershell
./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath $S -Phase Approve -Since (Get-Content "$run/smoke-start.txt")
```

```powershell
./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath $S -Phase Expire -Since (Get-Content "$run/smoke-start.txt")
```

```powershell
./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath $S -Phase Review -Since $cfg.accessReviews.defaults.startDate
```

**Expected, live:** each ends `n of n checks passed` and exits 0; each writes `results.json` and a manifest to `$run/smoke-<phase>`. If an Activate or Approve event isn't in the audit log yet, wait a few minutes and run the phase again (research gaps, row 102). If the Approve phase finds the instance under the group rather than the user, or with `memberType` other than `Direct`, record it (row 101) before changing the check.

Run in fixture mode on November 2, 2026, one fictional tenant state per phase:

```powershell
$F = 'deploy/tests/fixtures/environment.test.json'
./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath $F -Phase Activate -Since 2026-11-02T14:00:00Z -AsOf 2026-11-02T14:06:00Z -FixturePath deploy/tests/fixtures/smoke-activate.json
./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath $F -Phase Approve -Since 2026-11-02T14:00:00Z -AsOf 2026-11-02T14:30:00Z -FixturePath deploy/tests/fixtures/smoke-approve.json
./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath $F -Phase Expire -Since 2026-11-02T14:00:00Z -AsOf 2026-11-02T22:20:00Z -FixturePath deploy/tests/fixtures/smoke-expire.json
./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath $F -Phase Review -Since 2026-11-09T00:00:00Z -AsOf 2026-11-10T00:00:00Z -FixturePath deploy/tests/fixtures/smoke-review.json
```

```text
  PASS Activation request logged: expected 'Add member to role requested (PIM activation)' for pim.smoke01@contoso.example; observed 1 event(s)
  PASS Role not active before approval: expected No active instance of the role (approval required); observed 0 active instance(s)
Smoke test Activate (test, Fixture): 2 of 2 checks passed
Written to out/deploy-test/smoke-activate (manifest.json lists every request and file hash)
Evidence: out/deploy-test/evidence/20261102T123039501Z-smoke-activate.json (Pass, sha256 5fddd91ae9a5)
  PASS Approval logged: expected 'Add member to role request approved (PIM activation)'; observed 1 event(s)
  PASS Role active by activation: expected One instance, assignmentType Activated; observed 1 activated instance(s)
  PASS Activation within the role file: expected At most PT8H (8 h); observed 8.00 h, ends 2026-11-02T22:12:40Z
  PASS Direct, not inherited: expected memberType Direct; observed memberType Direct
Smoke test Approve (test, Fixture): 4 of 4 checks passed
Written to out/deploy-test/smoke-approve (manifest.json lists every request and file hash)
Evidence: out/deploy-test/evidence/20261102T123040893Z-smoke-approve.json (Pass, sha256 a3ef640e0391)
  PASS Role no longer active: expected No active instance after 2026-11-02T22:20:00Z; observed 0 active instance(s)
  PASS Expiry logged: expected 'Remove member from role (PIM activation expired)'; observed 1 event(s)
Smoke test Expire (test, Fixture): 2 of 2 checks passed
Written to out/deploy-test/smoke-expire (manifest.json lists every request and file hash)
Evidence: out/deploy-test/evidence/20261102T123042137Z-smoke-expire.json (Pass, sha256 cf7a50bdb765)
  PASS Pilot review exists: expected Definition 'PAR-T1-TeamsAdministrator-Pilot'; observed 1 definition(s)
  PASS Instance started: expected An instance of the series; observed 1 instance(s); latest InProgress
  PASS Synthetic admin reviewed: expected A decision other than NotReviewed, with a justification; observed decision Approve, applyResult New
Smoke test Review (test, Fixture): 3 of 3 checks passed
Written to out/deploy-test/smoke-review (manifest.json lists every request and file hash)
Evidence: out/deploy-test/evidence/20261102T123044223Z-smoke-review.json (Pass, sha256 f53a57ac1207)
```

A failure looks like this: the Activate phase run against a tenant where the role is already active, as if approval had been skipped:

```powershell
./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath $F -Phase Activate -Since 2026-11-02T14:00:00Z -AsOf 2026-11-02T14:30:00Z -FixturePath deploy/tests/fixtures/smoke-approve.json -OutputPath out/deploy-test/smoke-negative
```

```text
  PASS Activation request logged: expected 'Add member to role requested (PIM activation)' for pim.smoke01@contoso.example; observed 1 event(s)
  FAIL Role not active before approval: expected No active instance of the role (approval required); observed 1 active instance(s)
Smoke test Activate (test, Fixture): 1 of 2 checks passed
Written to out/deploy-test/smoke-negative (manifest.json lists every request and file hash)
Evidence: out/deploy-test/evidence/20261102T123046577Z-smoke-activate.json (Fail, sha256 1f3aaef21daa)
```

It exits 1. A FAIL in Stage 1 is a no-go: roll back, fix, and run the stage again. Each phase writes its own record, `smoke-activate` to `smoke-review`.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-6 Least Privilege | The synthetic administrator holds no role until an approved activation, and loses it at the end time (Activate, Approve, Expire) | KSI-IAM-JIT | `smoke-activate/`, `smoke-approve/`, `smoke-expire/`, each `results.json`; their records |
| AC-5 Separation of Duties | A different person approves; nobody approves their own request | KSI-IAM-JIT | `smoke-approve/results.json` and the approval in the audit log |
| AC-2 Account Management; AC-6(7) Review of User Privileges | A reviewer decides the synthetic administrator's access, with a reason (Review) | KSI-IAM-ELP | `smoke-review/results.json`; its record |
| CM-4(2) Verification of Controls | After the change, the controls are shown to work as intended, against written expectations | KSI-CMT-VTD | All four `results.json`; the expected-result table in the change record |
| BOD 25-01 MS.AAD.7.4v1 | The activation is time-bound; no permanent active assignment results | KSI-IAM-JIT | `smoke-expire/results.json` |

### Step 1.8: capture the evidence

Run [Chapter 08](08-evidence-and-drift.md)'s evidence run as the reader, so the stage's end state is read by the same code that will watch production, then package it in `examples/drift-pipeline` with a SHA-256 per file:

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
Connect-AzAccount -ServicePrincipal -Environment $c.AzureEnvironment -Tenant $t -ApplicationId $app.azure -CertificateThumbprint $tp
./Invoke-PaEvidenceRun.ps1 -Cloud $cfg.cloud -TenantId $t -OutputPath "$run/evidence-run" -AzureScope $cfg.azure.scopes `
    -EmergencyConfigPath "$in/emergency-access.json" -ValidationsPath "$in/emergency-validations.csv" -ExceptionsPath "$in/exceptions.csv"
```

In a POSIX shell, from `<kit-folder>/../drift-pipeline`, with `RUN` set to the stage's `outputRoot` as a path from there:

```bash
RUN=../privileged-access/out/deploy-test
DAY1=$RUN/evidence-run/$(ls $RUN/evidence-run | sort | tail -n 1)
python python/pa_evidence.py compare --current $DAY1 --out $RUN/evidence-compare
python python/pa_evidence.py package --run $DAY1 --diff $RUN/evidence-compare/pa-drift-report.json --out $RUN/evidence-package
python python/pa_evidence.py verify $RUN/evidence-package/$(basename $DAY1)
```

**Expected:** `verify` passes. Then hash the whole stage folder for the change record:

```powershell
Get-ChildItem $run -Recurse -File | Get-FileHash -Algorithm SHA256 | ForEach-Object { "$($_.Hash.ToLowerInvariant())  $([IO.Path]::GetRelativePath((Resolve-Path $run), $_.Path))" } | Set-Content "$run.sha256"
```

Record the step's evidence. The script judges the run folder as `deploy/requirements.json` says and writes the record to `<outputRoot>/evidence`:

```powershell
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step evidence -RunPath "$run/evidence-run" -Command './Invoke-PaEvidenceRun.ps1 (Step 1.8)'
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AU-9 Protection of Audit Information | The stage's evidence is hashed per file and chained, then kept with the change record | KSI-MLA-OSM | `evidence-package/` and its `verify` output; `<outputRoot>.sha256`; `evidence/records.csv` |
| CA-7 Continuous Monitoring | Chapter 08's run reads the end state with the code that will watch production | KSI-MLA-EVC | `evidence-run/` (Chapter 08's run); the `evidence` record |
| CM-3 Configuration Change Control | The change record holds the hashes of what the stage produced | KSI-CMT-LMC | The change record; `evidence/records.csv` |
| FedRAMP: agency use of an authorized cloud service | The agency's evidence of its own configuration sits beside what its providers report | — | This step's package, filed with the providers' reports |

### Step 1.9: roll back, then deploy again

Rehearse the rollback in the test tenant, so the production one has been run once before it's needed. `deploy/Invoke-PaRollback.ps1` reads the stage's run folders and plans the reverse of the deployment order, so nobody is left without access at any point:

1. **Access reviews.** The code never deletes a review series; the plan names the series the stage created, for a person to delete after exporting its evidence.
2. **Azure resource roles.** Standing assignments the stage removed come back first, then the stage's eligible assignments go, then each policy is put back from `azure-dry/state.json`. Learn's rollback for PIM is the same idea: make the assignments active again.[^pa09-pim-plan]
3. **PIM for Groups.** The previous desired file is applied. In test, that is the stage's groups with their lists emptied; in production, a missing `previousDesiredPath` blocks the rollback rather than empty every `PRV` group.
4. **Microsoft Entra roles.** Standing assignments a conversion removed come back first, then Chapter 04's `-RestoreFrom` puts each wave's rules back and removes its eligibility.
5. **Conditional Access.** The policies the stage created are turned off and its new contexts made unavailable. Nothing is deleted. It runs after step 4, so no role rule still needs context `c1` when `c1` goes.
6. **Emergency access.** Never rolled back.

A restored standing assignment is time-bound, for 14 days: while the stage's role settings hold, an active assignment can't last more than Chapter 04's 15 days, so a permanent one would be refused. Once the settings are back, make it permanent again only if the change record says so (*design guidance*; research gaps, row 105).

Plan first; it sends nothing:

```powershell
./deploy/Invoke-PaRollback.ps1 -SettingsPath $S
Get-Content "$run/rollback/rollback-plan.json"
```

Run in fixture mode on November 2, 2026, over run folders made by the earlier chapters' Lab 1 commands:

```powershell
./deploy/Invoke-PaRollback.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json -RunRoot deploy/tests/fixtures/runs
```

```text
1. access-reviews [Manual] Export the evidence, then delete 1 series the stage created: PAR-T1-TeamsAdministrator-Pilot
     Portal: ID Governance > Privileged Identity Management > Microsoft Entra roles > select the access review > Delete
2. azure [Automatic] Restore 3 standing assignment(s) for P14D, then remove 5 eligible assignment(s), then put back 11 policy(ies) from azure-dry/state.json; wait five minutes after the stage's last assignment first
     20 command(s) in rollback-plan.json
3. pim-groups [Automatic] Apply the previous PRV groups desired state (test: the lab groups emptied)
     2 command(s) in rollback-plan.json
4. pim-roles [Automatic] Restore 1 standing Microsoft Entra role assignment(s) the conversion removed, for P14D, before anything else in this area
     2 command(s) in rollback-plan.json
5. pim-roles [Automatic] Put wave 1's role rules back from pim-apply/before.json and remove the eligibility it created
     2 command(s) in rollback-plan.json
6. conditional-access [Automatic] Turn off 5 policy(ies) the stage created (CA003-Admins-RequirePhishResistantMFA, CA025-Admins-BlockNonPAW, CA027-AllUsers-AzureManagement-BlockNonOperators, PIM-Activation-c1, ProtectedActions-c2) and make 1 context(s) unavailable; the emergency exclusion stays in every policy
     2 command(s) in rollback-plan.json
7. emergency-access [Keep] The emergency access accounts, their exclusion group and their alert stay as they are; run Chapter 02's check again after the rollback
Rollback plan (test, CHG-3001): 7 steps, 5 Automatic, 1 Manual, 0 Blocked
Dry run: nothing was sent. Review out/deploy-test/rollback/rollback-plan.json, then rerun with -Apply
Evidence: out/deploy-test/evidence/20261102T123050322Z-rollback.json (Planned, sha256 b0a2c53a89db)
```

The fixture runs come from every chapter's lab at once, which is why they hold more than the pilot. A live test stage plans one series, one role, one group and the Azure scopes in the settings file.

Read the plan with the change owner. Wait at least five minutes after the stage's last assignment: Learn says an assignment can't be removed within five minutes of being made.[^pa09-groups-assign] Then apply. Each Automatic step signs in as its own app, from the settings file:

```powershell
./deploy/Invoke-PaRollback.ps1 -SettingsPath $S -Apply
```

**Expected:** `Applied: n command(s) run`, and no error. Do the Manual step at its portal path. If a restore of a standing Microsoft Entra assignment is refused, a Privileged Role Administrator restores it the way Learn's rollback describes: in the role's **Assignments**, the eligible row's **...**, then **Make active** (research gaps, row 106).[^pa09-pim-plan] Then prove the tenant is safe and back where it was:

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./deploy/Test-PaPreflight.ps1 -SettingsPath $S -OutputPath "$run/preflight-after-rollback"
./Invoke-PaEmergencyCheck.ps1 -Cloud $cfg.cloud -ConfigPath "$in/emergency-access.json" -ValidationsPath "$in/emergency-validations.csv" -OutputPath "$run/emergency-after-rollback" -TenantId $t
./Invoke-PaPimRoleSettings.ps1 -Cloud $cfg.cloud -Wave 1 -RolesPath "$in/pim-roles" -BindingsPath "$in/pim-bindings.json" `
    -EmergencyConfigPath "$in/emergency-access.json" -ExceptionsPath "$in/exceptions.csv" -OutputPath "$run/pim-after-rollback" -TenantId $t
```

**Expected:** the pre-flight passes; Chapter 02's check shows 0 Finding; the role plan shows the same differences from the role file as `$run/pim-plan` did before the stage.

The applied rollback writes a `rollback` record, `Pass` when it ran with 0 Blocked; a dry run writes `Planned`, which the go/no-go doesn't accept.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 CM-3 Configuration Change Control | The change can be reversed from version-controlled records (`before.json`, `state.json`, the previous files), in a fixed order | KSI-CMT-RMV | `rollback/rollback-plan.json`; the `rollback` record |
| CM-4(2) Verification of Controls | After the rollback, the pre-flight, Chapter 02's check and the role plan show the tenant safe and as before | KSI-CMT-VTD | `preflight-after-rollback/`, `emergency-after-rollback/`, `pim-after-rollback/` |

Then deploy Stage 1 again, Steps 1.2 to 1.8, so the test tenant stays in the deployed state for the changes that follow. Use new output folders: move the first attempt aside first. The rollback rehearsal's evidence stays in `"$run-attempt1/evidence"`; copy its `rollback` record's result into the change record.

```powershell
Move-Item $run "$run-attempt1"
./deploy/New-PaDeployInputs.ps1 -SettingsPath $S
```

### Step 1.10: check the evidence

Before the go/no-go, check that every requirement row of the test stage has its evidence, passing and unchanged:

```powershell
./deploy/Test-PaEvidence.ps1 -SettingsPath $S
```

**Expected, live:** `GO on evidence: every requirement row has its evidence file, passing and unchanged.` and exit code 0. It writes `evidence/coverage.csv`, one row per step with its controls, indicators, status and record, for the change record. Because the second deployment starts a new folder, run the rollback rehearsal's check on the first attempt too: `./deploy/Test-PaEvidence.ps1` reads `outputRoot` from the settings file, so point a copy of the settings file at `"$run-attempt1"` and run it, or read `"$run-attempt1/evidence/records.csv"` for its `rollback` row.

Run in fixture mode on November 2, 2026, after the fixture commands above and a record for each earlier chapter's fixture run (Chapter 02's check run against `tenant-ready.json`; Chapters 03 to 07 from `deploy/tests/fixtures/runs`):

```powershell
$X = 'deploy/tests/fixtures'
./Invoke-PaEmergencyCheck.ps1 -Cloud gcc -FixturePath $X/tenant-ready.json -ConfigPath out/deploy-test/inputs/emergency-access.json `
    -ValidationsPath out/deploy-test/inputs/emergency-validations.csv -AsOf 2026-11-02 -OutputPath out/deploy-test/emergency
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $F -Step emergency-access -RunPath out/deploy-test/emergency -Command './Invoke-PaEmergencyCheck.ps1 -Cloud gcc -FixturePath deploy/tests/fixtures/tenant-ready.json'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $F -Step conditional-access -RunPath $X/runs/ca-plan -Command './Invoke-PaCaAdmin.ps1 (Chapter 03 Lab 1 fixture run)'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $F -Step pim-roles -RunPath $X/runs/pim-apply -Command './Invoke-PaPimRoleSettings.ps1 (Chapter 04 Lab 1 fixture run)'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $F -Step pim-groups -RunPath $X/runs/groups-apply -Command './Invoke-PaPimGroups.ps1 (Chapter 05 Lab 1 fixture run)'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $F -Step azure-roles -RunPath $X/runs/azure-apply -Command './Invoke-PaAzurePim.ps1 (Chapter 06 Lab 1 fixture run)'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $F -Step access-reviews -RunPath $X/runs/reviews-apply -Command './Invoke-PaAccessReviews.ps1 (Chapter 07 Lab 1 fixture run)'
./deploy/Test-PaEvidence.ps1 -SettingsPath $F
```

```text
PASS emergency-access: 0 Finding in findings.json
  Supports AC-2, AC-2(4), AU-2, CA-7; KSI KSI-MLA-LET, KSI-MLA-EVC
Evidence: out/deploy-test/evidence/20261102T123052596Z-emergency-access.json (Pass, sha256 c035d04f13d5)
FAIL conditional-access: 3 Blocked in plan.json
  Supports AC-3, IA-2(1), IA-2(2), CM-3(2); KSI KSI-IAM-APM, KSI-IAM-ELP, KSI-CMT-VTD
Evidence: out/deploy-test/evidence/20261102T123053432Z-conditional-access.json (Fail, sha256 374743ec9236)
PASS pim-roles: 0 difference(s) in verify.csv after reading back
  Supports AC-5, AC-6, CM-5; KSI KSI-IAM-JIT, KSI-IAM-ELP
Evidence: out/deploy-test/evidence/20261102T123054309Z-pim-roles.json (Pass, sha256 90e52adbef84)
PASS pim-groups: 0 failed in results.json
  Supports AC-2, AC-6; KSI KSI-IAM-JIT, KSI-IAM-ELP
Evidence: out/deploy-test/evidence/20261102T123055234Z-pim-groups.json (Pass, sha256 ac67b1e8bbc0)
PASS azure-roles: 0 line(s) left in diff-after.txt
  Supports AC-6, CM-5; KSI KSI-IAM-JIT, KSI-IAM-ELP
Evidence: out/deploy-test/evidence/20261102T123055640Z-azure-roles.json (Pass, sha256 16fc2fc13e18)
PASS access-reviews: 0 failed in results.json
  Supports AC-2, AC-6(7); KSI KSI-IAM-JIT, KSI-IAM-ELP
Evidence: out/deploy-test/evidence/20261102T123056489Z-access-reviews.json (Pass, sha256 1f9b5a967fdf)
  OK   settings           [Pass] CM-3, CM-5, IA-5(2); KSI KSI-CMT-LMC, KSI-CMT-RMV, KSI-IAM-SNU: 0 Finding in the settings file; 21 input files
  OK   preflight          [Pass] AC-2, AC-6, CA-7, CM-4(2); KSI KSI-IAM-ELP, KSI-MLA-EVC, KSI-CMT-VTD: 0 Finding
  OK   emergency-access   [Pass] AC-2, AC-2(4), AU-2, CA-7; KSI KSI-MLA-LET, KSI-MLA-EVC: 0 Finding in findings.json
  MISS conditional-access [Fail] AC-3, IA-2(1), IA-2(2), CM-3(2); KSI KSI-IAM-APM, KSI-IAM-ELP, KSI-CMT-VTD: 3 Blocked in plan.json
  OK   pim-roles          [Pass] AC-5, AC-6, CM-5; KSI KSI-IAM-JIT, KSI-IAM-ELP: 0 difference(s) in verify.csv after reading back
  OK   pim-groups         [Pass] AC-2, AC-6; KSI KSI-IAM-JIT, KSI-IAM-ELP: 0 failed in results.json
  OK   azure-roles        [Pass] AC-6, CM-5; KSI KSI-IAM-JIT, KSI-IAM-ELP: 0 line(s) left in diff-after.txt
  OK   access-reviews     [Pass] AC-2, AC-6(7); KSI KSI-IAM-JIT, KSI-IAM-ELP: 0 failed in results.json
  MISS smoke-activate     [Fail] AC-6, CM-4(2); KSI KSI-IAM-JIT, KSI-CMT-VTD: 1 of 2 checks passed
  OK   smoke-approve      [Pass] AC-5, AC-6, CM-4(2); KSI KSI-IAM-JIT, KSI-CMT-VTD: 4 of 4 checks passed
  OK   smoke-expire       [Pass] AC-6, CM-4(2); KSI KSI-IAM-JIT, KSI-CMT-VTD: 2 of 2 checks passed
  OK   smoke-review       [Pass] AC-2, AC-6(7), CM-4(2); KSI KSI-IAM-ELP, KSI-CMT-VTD: 3 of 3 checks passed
  MISS evidence           [Missing] AU-9, CA-7, CM-3; KSI KSI-MLA-OSM, KSI-MLA-EVC, KSI-CMT-LMC: no evidence record
  MISS rollback           [Planned] CM-3, CM-4(2); KSI KSI-CMT-RMV, KSI-CMT-VTD: 7 steps, 0 Blocked, 0 command(s) run
Evidence for test (CHG-3001): 10 of 14 required steps present and passing
NO-GO on evidence: every required step needs a passing, unchanged record.
Written to out/deploy-test/evidence/coverage.csv
```

The fixture run is a no-go on evidence, as it should be: Chapter 03's fixture plan has three policies Blocked; the latest Activate record is the deliberate failure from Step 1.7; nothing ran Chapter 08's evidence run; and the rollback was only planned. One of the records it checked, the Approve phase's, in full:

```json
{
  "recordedAt": "2026-11-02T12:30:40Z",
  "environment": "test",
  "changeRecord": "CHG-3001",
  "tenantId": "c0000000-0000-4000-8000-000000000009",
  "cloud": "gcc",
  "mode": "Fixture",
  "step": "smoke-approve",
  "title": "Smoke test: approve",
  "command": "./deploy/Invoke-PaSmokeTest.ps1 -SettingsPath deploy/tests/fixtures/environment.test.json -Phase Approve -Since 2026-11-02T14:00:00Z -AsOf 2026-11-02T14:30:00Z -FixturePath deploy/tests/fixtures/smoke-approve.json",
  "result": "Pass",
  "reason": "4 of 4 checks passed",
  "controls": [
    "AC-5",
    "AC-6",
    "CM-4(2)"
  ],
  "other": [],
  "ksi": [
    "KSI-IAM-JIT",
    "KSI-CMT-VTD"
  ],
  "runPath": "out/deploy-test/smoke-approve",
  "files": {
    "manifest.json": "f082b9525660b11c265b827b03e8146cd54defb813ff185c80922f46e0296716",
    "results.json": "9fc73de870525832fc59b2426d1415afb43ad19917f19bc96c077bc2b465981e"
  },
  "previousRecordSha256": "5fddd91ae9a59eb31665db7113c41acc20e4d4f5314bc97ec2a2eb4059a7ff90"
}
```

`previousRecordSha256` is the SHA-256 of the Activate phase's record, the one written before it. Editing any record, or any file a record hashed, makes `Test-PaEvidence.ps1` report `Chain broken` or `Changed` for that step.

## Promotion go/no-go criteria

The change owner and the ISSO sign the promotion only when every row holds. Each row names the file that proves it.

| # | Criterion | Evidence |
|---|---|---|
| 1 | The pre-flight passed before the stage, after each Conditional Access change, and after the rollback | `preflight*/findings.json` with no Finding, and their manifests |
| 2 | The emergency access drill raised the alert within two evaluation periods, and Chapter 02's check shows 0 Finding | The alert email, `emergency/findings.json`, the drill row in the settings file |
| 3 | Every administrator policy ran report-only for at least seven days, and no report-only result applied to an emergency account | Sign-in log exports, `ca-apply*/` |
| 4 | The activation gate is on, and every applied chapter reads back with no difference | `ca-enforce-gate/`, `pim-apply/verify.csv` empty, `groups-replan` with 0 changes, `azure-apply/diff-after.txt` empty, `reviews-apply/results.json` |
| 5 | All four smoke-test phases passed | `smoke-activate`, `smoke-approve`, `smoke-expire` and `smoke-review`, each `results.json` with every `Pass` true |
| 6 | The rollback ran with 0 Blocked, and the tenant read back as before | `rollback/rollback-plan.json`, `preflight-after-rollback`, `emergency-after-rollback`, `pim-after-rollback` |
| 7 | The stage was deployed again, and its smoke test passed again | The second attempt's folders |
| 8 | The evidence package verifies | `evidence-package/`, the `verify` output, `out/deploy-test.sha256` |
| 9 | Every live result that differed from this chapter's expectation is recorded, and research gaps rows 101 to 106, 113 and 114 have an answer | The change record, `_verification/research-gaps.md` |
| 10 | The production settings file differs from the test file only in values, and the production change record is approved | Step 2.1's comparison, the approved record |
| 11 | Every requirement row of the test stage has its evidence record present, passing and unchanged, with the records' hash chain intact | `./deploy/Test-PaEvidence.ps1` exit code 0 and `evidence/coverage.csv`, for the second deployment; the first attempt's `rollback` record `Pass` |

A single unmet row is a no-go.

## Stage 2: production

Production runs the same commands against `environment.production.json`. What's different is the scope (every role, in waves), the conversion of standing assignments, a week of watching, and the change board.

### Step 2.1: the change record and the settings file

Copy the test file, change only the values that differ, and fill `pimRoles.roleFiles` with `["*"]` and one eligibility row per role, `pimGroups.previousDesiredPath`, and `accessReviews.previousConfigPath` if a series changes. Then prove the two files have the same shape, so every command reads the same keys:

```powershell
Copy-Item <settings-folder>/environment.test.json <settings-folder>/environment.production.json
```

```powershell
Import-Module ./deploy/PaDeploy.psm1
$keys = { param($p) $o = Get-Content $p -Raw | ConvertFrom-Json; $o.PSObject.Properties.Name | Sort-Object }
Compare-Object (& $keys <settings-folder>/environment.test.json) (& $keys <settings-folder>/environment.production.json)
Test-PaDeploySettings -Settings (Read-PaDeploySettings -Path <settings-folder>/environment.production.json) | Format-Table Rule, Object, Issue
```

**Expected:** `Compare-Object` prints nothing, and `Test-PaDeploySettings` prints nothing: `environment` is `production` and `changeRecord` holds the approved production change. Record the file's SHA-256 in the change record:

```powershell
(Get-FileHash <settings-folder>/environment.production.json -Algorithm SHA256).Hash.ToLowerInvariant()
```

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 CM-3 Configuration Change Control | The production change is approved by the change board, with the settings file's hash in the record | KSI-CMT-LMC | The approved production change record; the file's SHA-256 |
| CM-3(2) Testing, Validation, and Documentation of Changes | Production runs only what passed in test: the same commands, a settings file of the same shape | KSI-CMT-VTD | The `Compare-Object` output (empty); the test stage's `evidence/coverage.csv` |
| IA-5(2) Public Key-based Authentication | Production apps use their own certificates or federated credentials; no secret (PA-DEP-01) | KSI-IAM-SNU | `Test-PaDeploySettings` output (empty) |

### Step 2.2: pre-flight

Run Step 0 with `$S = '<settings-folder>/environment.production.json'`, then:

```powershell
./deploy/New-PaDeployInputs.ps1 -SettingsPath $S
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./deploy/Test-PaPreflight.ps1 -SettingsPath $S
```

**Expected:** `PASS`. In production a PA-DEP-05 is more likely than in test: existing policies made by hand often leave the emergency group out. Fix each in the portal (**Entra ID** > **Conditional Access** > **Policies**, the policy, **Users** > **Exclude** > **Users and groups**, the emergency exclusion group, **Save**), then run the pre-flight again. Step 0.2 and the pre-flight write the production `settings` and `preflight` records to `out/deploy-production/evidence`.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-2 Account Management; AC-6 Least Privilege | Production's emergency access accounts meet the standard, and PIM is licensed, before any change | KSI-IAM-ELP | `out/deploy-production/preflight/findings.json`; the `preflight` record |
| CA-7 Continuous Monitoring; CM-4(2) Verification of Controls | Every production policy, including those made by hand, excludes the emergency accounts | KSI-MLA-EVC, KSI-CMT-VTD | Every `preflight*/` folder and record in production |
| OMB M-22-09; BOD 25-01 MS.AAD.3.6v1 | Phishing-resistant methods on the emergency accounts | KSI-IAM-APM | `findings.json` with no PA-EA-06 Finding |

### Step 2.3: deploy

Run, in order and with the production `$S`, the command blocks of [Step 1.1](#step-1.1-emergency-access-accounts-and-their-monitoring) to [Step 1.6](#step-1.6-access-reviews), with three differences:

- **Step 1.2:** watch report-only for at least seven days in production too, then enforce `PIM-Activation-c1` alone; enforce each other administrator policy in its own later change, one at a time, with the pre-flight after each.
- **Step 1.3:** run the dry run and the apply once per wave, with `-Wave 1`, then `-Wave 2`, `-Wave 3` and `-Wave 4`, and the output folders `"$run/pim-plan-w1"` and `"$run/pim-apply-w1"` (then `-w2`, `-w3`, `-w4`). Chapter 04's PA-PIM-07 refuses a wave until every earlier wave matches its files.
- **Step 1.5:** the app's User Access Administrator is granted for one day, for the apply only, and removed after it.

The wave dry run, as the reader, then the apply, as `pimWriter`. Set `$w` to 1, run both blocks, then set it to 2, 3 and 4 in turn:

```powershell
$w = 1
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
./Invoke-PaPimRoleSettings.ps1 -Cloud $cfg.cloud -Wave $w -RolesPath "$in/pim-roles" -BindingsPath "$in/pim-bindings.json" `
    -EmergencyConfigPath "$in/emergency-access.json" -ExceptionsPath "$in/exceptions.csv" -OutputPath "$run/pim-plan-w$w" -TenantId $t
Import-Csv "$run/pim-plan-w$w/diff.csv" | Format-Table Role, RuleId, Property, Tenant, Desired
```

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.pimWriter -CertificateThumbprint $tp -NoWelcome
./Invoke-PaPimRoleSettings.ps1 -Cloud $cfg.cloud -Wave $w -RolesPath "$in/pim-roles" -BindingsPath "$in/pim-bindings.json" `
    -EmergencyConfigPath "$in/emergency-access.json" -ExceptionsPath "$in/exceptions.csv" -OutputPath "$run/pim-apply-w$w" -TenantId $t `
    -Apply -ActivationGateChecked
```

**Expected per wave:** 0 Finding in the dry run, and `0 differences from the role files after reading back`.

Record each step's evidence as Stage 1 does, with the production `$S`. After the last wave, record the role settings from wave 4's apply, which reads back every role:

```powershell
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step emergency-access -RunPath "$run/emergency" -Command './Invoke-PaEmergencyCheck.ps1 (Step 2.3)'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step conditional-access -RunPath "$run/ca-enforce-gate" -Command './Invoke-PaCaAdmin.ps1 -Apply -AllowEnforce (Step 2.3)'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step pim-roles -RunPath "$run/pim-apply-w4" -Command './Invoke-PaPimRoleSettings.ps1 -Wave 4 -Apply (Step 2.3)'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step pim-groups -RunPath "$run/groups-apply" -Command './Invoke-PaPimGroups.ps1 -Apply (Step 2.3)'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step azure-roles -RunPath "$run/azure-apply" -Command './Invoke-PaAzurePim.ps1 -Apply (Step 2.3)'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step access-reviews -RunPath "$run/reviews-apply" -Command './Invoke-PaAccessReviews.ps1 -Apply (Step 2.3)'
```

The requirements are Stage 1's, Steps 1.1 to 1.6, now in production:

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-2, AC-2(4), AU-2, CA-7 | The emergency accounts checked, alerted on and drilled in production | KSI-MLA-LET, KSI-MLA-EVC | `out/deploy-production/emergency/`; the alert email; the `emergency-access` record |
| AC-3; IA-2(1), IA-2(2); CM-3(2); OMB M-22-09; BOD 25-01 MS.AAD.3.6v1 | Administrator policies report-only for seven days, then enforced one per change, the gate first | KSI-IAM-APM, KSI-IAM-ELP, KSI-CMT-VTD | `ca-*/` folders; sign-in log exports; the `conditional-access` record |
| AC-5, AC-6, CM-5; BOD 25-01 MS.AAD.7.4v1 to MS.AAD.7.6v1 | Every role's settings, wave by wave, each read back with no difference | KSI-IAM-JIT, KSI-IAM-ELP | `pim-plan-w1/` to `pim-apply-w4/`, each `verify.csv` empty; the `pim-roles` record |
| AC-2, AC-6; BOD 25-01 MS.AAD.7.5v1 | The production `PRV` groups under PIM for Groups | KSI-IAM-JIT, KSI-IAM-ELP | `groups-*/`; the `pim-groups` record |
| AC-6, CM-5; FedRAMP agency use | Azure role policies and eligibility in the production subscriptions | KSI-IAM-JIT, KSI-IAM-ELP | `azure-dry/`, `azure-apply/`; the activity log; the `azure-roles` record |
| AC-2, AC-6(7) | Review series for every privileged role | KSI-IAM-JIT, KSI-IAM-ELP | `reviews-*/`; the `access-reviews` record |

### Step 2.4: convert standing assignments to eligible in waves

Learn says to keep zero permanently active assignments except the emergency access accounts.[^pa09-pim-plan] Chapter 04's order holds: eligible first, activation confirmed, active removed. Do one wave at a time, after its role settings are applied (Step 2.3). List the wave's standing assignments and what each waits for:

```powershell
$w = 1
(Get-Content "$run/pim-apply-w$w/plan.json" -Raw | ConvertFrom-Json).actions | Where-Object Kind -EQ 'RemoveStanding' |
    Format-Table Role, Status, Detail, @{ n = 'PrincipalId'; e = { $_.Body.principalId } }, @{ n = 'RoleTemplateId'; e = { $_.Body.roleDefinitionId } }
```

Ask each holder listed to activate the role once through its `PRV` group, as in [Step 1.7](#step-1.7-smoke-test-with-the-synthetic-administrator)'s Activate row, with an approver approving. For each holder who did, add a row with their `PrincipalId`, `RoleTemplateId`, the date and the wave's ticket, then write the inputs again:

```powershell
$j = Get-Content $S -Raw | ConvertFrom-Json
$j.pimRoles.confirmedActivations += [pscustomobject]@{ principalId = '<holder-object-id>'; roleTemplateId = '<role-template-id>'; confirmedOn = '<confirmed-on>'; ticket = "$($j.changeRecord)-w<wave>" }
$j | ConvertTo-Json -Depth 30 | Set-Content $S
./deploy/New-PaDeployInputs.ps1 -SettingsPath $S
```

Grant `pimWriter` `RoleAssignmentSchedule.ReadWrite.Directory` for the conversion (**API permissions** > **Add a permission** > **Microsoft Graph** > **Application permissions**, the permission, **Add permissions**, **Grant admin consent for** the tenant), convert, and remove the permission straight after (**API permissions**, the permission's **...**, **Remove permission**):

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.pimWriter -CertificateThumbprint $tp -NoWelcome
./Invoke-PaPimRoleSettings.ps1 -Cloud $cfg.cloud -Wave $w -RolesPath "$in/pim-roles" -BindingsPath "$in/pim-bindings.json" `
    -EmergencyConfigPath "$in/emergency-access.json" -ExceptionsPath "$in/exceptions.csv" -OutputPath "$run/pim-convert-w$w" -TenantId $t `
    -Apply -Convert -ConfirmedPath "$in/confirmed-activations.csv"
```

**Expected:** only rows with status `Confirmed` are sent; the emergency accounts and documented exceptions are never planned for removal; service principals are reported, not removed. Record the wave's evidence:

```powershell
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step pim-convert -RunPath "$run/pim-convert-w$w" -Command "./Invoke-PaPimRoleSettings.ps1 -Wave $w -Apply -Convert (Step 2.4)"
```

Repeat with `$w = 2`, `3` and `4`, each after its wave's Step 2.3.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-6 Least Privilege | Standing assignments become eligible, wave by wave; zero permanent active except the emergency accounts | KSI-IAM-JIT, KSI-IAM-ELP | `pim-convert-w1/` to `-w4/`; each wave's `pim-convert` record |
| AC-2 Account Management | Each removal has a confirmed activation with a ticket, approved by the change owner | KSI-IAM-JIT | `inputs/confirmed-activations.csv`; the wave's change record |
| BOD 25-01 MS.AAD.7.4v1 | No permanent active assignment to a highly privileged role remains outside the documented exceptions | KSI-IAM-JIT | Chapter 01's inventory after the last wave, with no PA-INV standing-privilege finding |

### Step 2.5: smoke test

Run [Step 1.7](#step-1.7-smoke-test-with-the-synthetic-administrator) in production, with the production synthetic administrator, approver and reviewer, and the production `$S`: record the start, then the four actions and the four phase commands. **Expected:** all four phases pass. Remove the synthetic administrator's group membership after the Review phase, by setting its row's `endDateTime` to the next day in `pimGroups` and running Step 1.4's apply (*design guidance*). Each phase writes its production record.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 AC-5, AC-6, AC-6(7); BOD 25-01 MS.AAD.7.4v1 | Activation needs approval, ends on time, and is reviewed, in production | KSI-IAM-JIT, KSI-IAM-ELP | `out/deploy-production/smoke-*/results.json`; the four smoke records |
| CM-4(2) Verification of Controls | The controls work as intended after the production change | KSI-CMT-VTD | The four `results.json` against the expected-result table |

### Step 2.6: first-week monitoring with drift

For seven days after the production change, run Chapter 08's evidence run every day as the reader, and compare each day with the day before, as [Chapter 08, Lab 2](08-evidence-and-drift.md#lab-2-test-tenant) does. Learn's PIM deployment plan asks that someone read every PIM audit event weekly and export them monthly;[^pa09-pim-plan] the first week is read every day (*design guidance*). The daily run:

```powershell
Connect-MgGraph -Environment $c.GraphEnvironment -TenantId $t -ClientId $app.reader -CertificateThumbprint $tp -NoWelcome
Connect-AzAccount -ServicePrincipal -Environment $c.AzureEnvironment -Tenant $t -ApplicationId $app.azure -CertificateThumbprint $tp
./Invoke-PaEvidenceRun.ps1 -Cloud $cfg.cloud -TenantId $t -OutputPath "$run/week1" -AzureScope $cfg.azure.scopes `
    -EmergencyConfigPath "$in/emergency-access.json" -ValidationsPath "$in/emergency-validations.csv" -ExceptionsPath "$in/exceptions.csv"
```

The daily compare, in a POSIX shell from `examples/drift-pipeline`. On day 1 it sets the baseline; from day 2 it compares the last two runs:

```bash
RUN=../privileged-access/out/deploy-production/week1
TODAY=$RUN/$(ls $RUN | sort | tail -n 1)
python python/pa_evidence.py compare --current $TODAY --out $RUN-compare/$(basename $TODAY)
```

```bash
RUN=../privileged-access/out/deploy-production/week1
PREV=$RUN/$(ls $RUN | sort | tail -n 2 | head -n 1)
TODAY=$RUN/$(ls $RUN | sort | tail -n 1)
python python/pa_evidence.py compare --previous $PREV --current $TODAY --out $RUN-compare/$(basename $TODAY)
cat $RUN-compare/$(basename $TODAY)/pa-drift-summary.md
```

**Expected each day:** no assignment drift outside the waves' change records, every activation in the audit summary approved where its tier needs approval, no emergency access sign-in except a recorded drill, and Chapter 02's findings unchanged. Chapter 08 treats any Tier 0 drift as an incident: open one, then decide with the change owner whether to roll back. On day 7, package the week as Step 1.8 does, and lock the evidence container's retention policy if it isn't locked yet; Learn says an unlocked time-based policy is for testing only.[^pa09-immutable] Then record the week and check production's evidence. The production go/no-go for closing the change is the same check as the test stage's:

```powershell
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step evidence -RunPath "$run/week1" -Command './Invoke-PaEvidenceRun.ps1 (Step 2.6, day 7)'
./deploy/Add-PaEvidenceRecord.ps1 -SettingsPath $S -Step first-week -RunPath "$run/week1" -Command './Invoke-PaEvidenceRun.ps1, seven daily runs (Step 2.6)'
./deploy/Test-PaEvidence.ps1 -SettingsPath $S
```

**Expected:** `GO on evidence` and exit code 0, with every production step present and passing, including `pim-convert` and `first-week`.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 CA-7 Continuous Monitoring | Seven daily evidence runs, each compared with the day before | KSI-MLA-EVC | `week1/`, `week1-compare/`; the `first-week` record |
| CM-3 Configuration Change Control | Every assignment change in the week traces to a wave's change record | KSI-CMT-LMC | The daily `pa-drift-summary.md`; the change records |
| IR-4 Incident Handling | Tier 0 drift opens an incident, with the rollback as one response | KSI-INR-RIR | The incident record, if any; Chapter 08's drift report |
| FedRAMP: agency use of an authorized cloud service | The agency's monitoring of its own configuration sits beside its providers' ongoing reports | — | The week's package, filed with the providers' reports |

### Step 2.7: rollback

The production rollback is the same script. Plan it as soon as Step 2.3 ends, attach `rollback-plan.json` to the change record, and keep it current after each wave:

```powershell
./deploy/Invoke-PaRollback.ps1 -SettingsPath $S
```

**Expected:** 0 Blocked. A Blocked step means a previous file is missing from the settings (`pimGroups.previousDesiredPath` or `accessReviews.previousConfigPath`); name it and plan again. To roll back, the change owner approves, then:

```powershell
./deploy/Invoke-PaRollback.ps1 -SettingsPath $S -Apply
```

Then run the three checks at the end of [Step 1.9](#step-1.9-roll-back-then-deploy-again), with the production `$S`. Roll back one wave by hand rather than the stage, when only that wave misbehaves: Chapter 04's `-RestoreFrom "$run/pim-apply-w<wave>"` for that wave only, after restoring any standing assignments its conversion removed (*design guidance*). The rollback writes its record whether it is planned, applied or fails.

| Requirement | What this step does | KSI it aligns to | Evidence the ISSO keeps |
|---|---|---|---|
| NIST SP 800-53 CM-3 Configuration Change Control | A current rollback plan is attached to the change record after each wave | KSI-CMT-RMV | `out/deploy-production/rollback/rollback-plan.json`; the `rollback` record (`Planned`) |
| CM-4(2) Verification of Controls; IR-4 Incident Handling | If applied, the tenant is shown safe and as before, and the incident is closed with that evidence | KSI-CMT-VTD, KSI-INR-RIR | The `rollback` record (`Pass`); the three checks' folders; the incident record |

## Evidence the ISSO keeps

Every run folder holds a `manifest.json` with each file's SHA-256, the settings file's SHA-256, the change record, the mode and every request sent. The ISSO keeps:

| Stage | What | Where |
|---|---|---|
| Before each stage | The change record and its approval; the settings file's SHA-256; the inputs manifest | Change record; `inputs/manifest.json` |
| Pre-flight | Findings and manifest, before the stage and after every Conditional Access change | `preflight*/` |
| Emergency access | The check, the alert template as deployed, the drill and its alert email | `emergency/`, the deployment's record in the resource group, the settings file's drill row |
| Conditional Access | Plan, applies, the enforcement of the gate, seven days of report-only sign-in results | `ca-plan/`, `ca-apply*/`, `ca-enforce-*/`, sign-in log exports |
| PIM for Microsoft Entra roles | Each wave's dry run, apply with `before.json` and `verify.csv`, and conversion with the confirmed activations | `pim-plan*/`, `pim-apply*/`, `pim-convert*/`, `inputs/confirmed-activations.csv` |
| PIM for Groups | Plan, apply, the plan after it | `groups-plan/`, `groups-apply/`, `groups-replan/` |
| Azure resource roles | Dry run with `state.json`, apply with `diff-after.txt`, the time-bound User Access Administrator grant and its removal | `azure-dry/`, `azure-apply/`, the subscription's activity log |
| Access reviews | Plan and results; later, the decisions | `reviews-plan/`, `reviews-apply/`; Chapter 07's evidence mode |
| Smoke test | Each phase's results and manifest | `smoke-activate/` to `smoke-review/` |
| Rollback | The plan, and if applied, the checks after it | `rollback/`, `*-after-rollback/` |
| Evidence records | One record per step: the command, result, controls, indicators, file hashes and the previous record's hash | `evidence/*.json`, `evidence/records.csv` |
| Evidence coverage | Every required step's record present, passing and unchanged | `evidence/coverage.csv` from `Test-PaEvidence.ps1` |
| Go/no-go | The signed criteria table | Change record |
| Production, first week | Seven daily evidence runs, their comparisons, the week's package | `week1/`, `week1-compare/`, the package and its `verify` output |

Keep the whole stage folder and `<outputRoot>.sha256` with the change record. The folders name administrators and groups: store them as evidence, not in a shared drive (*design guidance*).

## The code: `examples/privileged-access/deploy`

The earlier chapters' entry scripts do every write in this runbook. The six `deploy` scripts add only what the runbook needs and the chapters didn't have:

| Script | What it does | Sends |
|---|---|---|
| `New-PaDeployInputs.ps1` | Checks the settings file, then writes each chapter's input files from it, with a manifest | Nothing |
| `Test-PaPreflight.ps1` | PA-DEP-01 to PA-DEP-06, PA-DEP-08 and PA-DEP-09 (there is no PA-DEP-07), in the order above; exit 1 when blocked | GETs: `subscribedSkus` and Chapter 02's reads |
| `Invoke-PaSmokeTest.ps1` | One phase's checks against its expected result; exit 1 on any FAIL | GETs: active instances, directory audits, access review definitions, instances and decisions |
| `Invoke-PaRollback.ps1` | The rollback plan in reverse order; `-Apply` runs it and refuses a plan with a Blocked step | Nothing in a dry run; with `-Apply`, the earlier chapters' scripts and the Azure requests in the plan |
| `Add-PaEvidenceRecord.ps1` | Judges an earlier chapter's run folder as `requirements.json` says, and writes the step's evidence record | Nothing |
| `Test-PaEvidence.ps1` | The evidence half of the go/no-go: every required step's record present, passing, unchanged, and the hash chain intact; exit 1 otherwise | Nothing |

Each of the first four also writes its own evidence record. `deploy/requirements.json` maps every step to its controls, other requirements and indicators, the stages that require it, and how its result is judged. They share `deploy/PaDeploy.psm1` and declare their calls in `deploy/calls-deploy.json`, each with its least-privileged permission and Learn page; the reader refuses an undeclared call, any method but GET, and a next link on another host. The live scripts refuse a Graph session signed in to another tenant than the settings file names. Each has a fixture mode, and the fixtures are a fictional `contoso.example` tenant.

The tests are 49 Pester tests in `deploy/tests/Deploy.Tests.ps1`: the calls and permissions, the settings checks, the input files and the earlier chapters' readers accepting them, each pre-flight rule on its own, each smoke phase passing and failing, the rollback's order, its refusals, and its dry run and apply, and the evidence records: the mapping uses only indicator IDs the repository cites, each run folder is judged, records chain, and an edited record or a changed file is caught. They are a separate suite from `tests/`, so the earlier chapters' "330 tests passing" stays true. Run on November 2, 2026, Windows 11, PowerShell 7.6.9, Pester 5.9.0:

```powershell
Invoke-Pester -Path deploy/tests
```

```text
Tests Passed: 49, Failed: 0, Skipped: 0, Inconclusive: 0, NotRun: 0
```

::: {.callout-important}
## Illustrative code
The `deploy` scripts were run against fixtures and a fake Graph, never against a live tenant or subscription. Their output above shows what the code does with fictional data, not that a tenant returns the same shapes or that its writes succeed. Run Stage 1 completely in a test tenant before Stage 2, and record every difference.
:::

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| PIM licenses | Microsoft Entra ID P2 or Microsoft Entra ID Governance, for users who are eligible, approve, or are assigned to or perform access reviews | Microsoft Entra ID Governance for Government is a product | GA | [^pa09-license] |
| Service plans | `AAD_PREMIUM_P2` `eec0eb4f-6444-4f95-aba0-50c24d67f998`; `Entra_Identity_Governance` `e866a266-3cff-43a3-acca-0c90a7e00c8b` | — | — | [^pa09-service-plans] |
| List subscribedSkus | `GET /subscribedSkus`; `LicenseAssignment.Read.All` least privileged; `capabilityStatus` `Enabled`, `Warning`, `Suspended`, `Deleted`, `LockedOut` | L4 and L5 | v1.0 | [^pa09-sku] [^pa09-sku-resource] |
| Emergency access standard | Two or more cloud-only accounts; phishing-resistant methods; permanent active Global Administrator; excluded from policies that block or restrict, report-only needing no exclusion; monitored; validated every 90 days | — | GA | [^pa09-emergency] |
| The lockout | All Privileged Role and Global Administrators eligible, approval required, no approvers | — | GA | [^pa09-settings] |
| Report-only | Evaluated at sign-in, not enforced; results on the sign-in log's Report-only tab; at least a week before enforcement | — | GA | [^pa09-report-only] [^pa09-ca-plan] |
| PIM deployment plan | Pilot with test users; expected against actual; production after testing; rollback by making assignments active again; zero permanent active except emergency accounts; read audit events weekly | — | — | [^pa09-pim-plan] |
| Activation in the portal | **ID Governance** > **Privileged Identity Management** > **My roles** > **Microsoft Entra roles**, **Activate** | — | GA | [^pa09-activate] |
| Approval | **ID Governance** > **Privileged Identity Management** > **Approve requests**; 24 hours; no self-approval; no service principal approves | — | GA | [^pa09-approve] |
| Request status | `Canceled`, `Denied`, `Failed`, `Granted`, `PendingAdminDecision`, `PendingApproval`, `PendingProvisioning`, `PendingScheduleCreation`, `Provisioned`, `Revoked`, `ScheduleCreated` | — | v1.0 | [^pa09-request] |
| List roleAssignmentScheduleRequests | `RoleAssignmentSchedule.ReadWrite.Directory` is the least-privileged permission, for reads too | L4 and L5 | v1.0 | [^pa09-ras-list] |
| Activate and remove with Graph PowerShell | `New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest` with `SelfActivate`, `AdminAssign`; eligible instances by `principalId` | — | v1.0 | [^pa09-ps-assign] |
| Azure active assignment request | `roleAssignmentScheduleRequests` `2020-10-01`: `requestType` `AdminAssign`, `AdminRemove`; expiration `AfterDateTime`, `AfterDuration`, `NoExpiration` | — | — | [^pa09-arm-ras] |
| Five-minute rule | A PIM for Groups assignment can't be removed within five minutes of being assigned; eligible members need P2 or ID Governance | — | GA | [^pa09-groups-assign] |
| Review in PIM | **ID Governance** > **Privileged Identity Management** > **Review access**, **Approve** or **Deny**, a reason | — | GA | [^pa09-review] |
| App-only sign-in | `Connect-MgGraph -ClientId -TenantId -CertificateThumbprint` | — | — | [^pa09-connect] |
| Federated credentials | A workload exchanges a trusted external token for an access token, with no secret to manage | — | GA | [^pa09-wif] |
| Directory audits, active instances, review decisions | `AuditLog.Read.All`; `RoleAssignmentSchedule.Read.Directory`; `AccessReview.Read.All` | L4 and L5 | v1.0 | [^pa09-audits] [^pa09-rasi] [^pa09-ar-list] |
| Graph hosts | GCC `graph.microsoft.com`; GCC High `graph.microsoft.us`; DoD `dod-graph.microsoft.us` | — | — | [^pa09-deployments] |
| FedRAMP 20x Key Security Indicators | KSI-IAM-JIT, KSI-IAM-ELP, KSI-IAM-APM, KSI-IAM-SNU, KSI-CMT-LMC, KSI-CMT-RMV, KSI-CMT-VTD, KSI-MLA-EVC, KSI-MLA-OSM, KSI-MLA-LET, KSI-INR-RIR, each on FedRAMP's 2026 reference; indicators for cloud service providers | — | — | [^pa09-ksi] [^pa09-ksi-providers] |

Where the sources differ, recorded so a later edit doesn't loosen the code:

- **Report-only and the exclusion.** Learn says report-only policies need no exclusion; the pre-flight wants it in every policy, in any state, because this stage enforces them later (research gaps, rows 5 and 104).
- **Reading requests.** The smoke test would be simpler reading the activation request's status, but Learn's least-privileged permission to list requests is a write permission. It reads the active instances and the audit log instead (row 103).
- **Rollback.** Learn's rollback makes eligible assignments active again in the portal; the code restores standing assignments with a request, time-bound under the stage's cap, and keeps Learn's portal path as the fallback (rows 105 and 106).

## Open questions {#open-questions}

The questions only a live tenant can answer are rows 101 to 106, 113 and 114 of the workbook's research gaps log, `_verification/research-gaps.md` in the repository. Row 113 is the group alert check's delegated role, group list, reads and sovereign-cloud calls, and row 114 is the Microsoft.Graph and Az module versions the first live run records. The rest: the principal on an activation through an eligible group (101), how soon the audit log shows a PIM event (102), the write permission Learn lists for reading requests (103), the stricter report-only rule (104), the time-bound restore (105), and an app-only restore under a rule that wants MFA on active assignment (106).

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Approval switched on before the emergency accounts hold Global Administrator | The documented lockout | The pre-flight carries Chapter 02's check (PA-DEP-04), and Chapter 04's PA-PIM-02 blocks every write |
| A policy that the emergency accounts can't pass | Nobody gets in during an outage | PA-DEP-05 for every policy in any state, PA-DEP-06 for every policy file; the pre-flight after every Conditional Access change |
| A policy enforced before anyone saw its report-only results | Administrators are blocked | Created report-only; seven days of report-only; enforcement only with `-AllowEnforce`, one policy per change |
| The production run pointed at the test tenant, or the reverse | Changes land in the wrong tenant | One settings file per environment; the live scripts refuse a Graph session in another tenant |
| A secret in the settings file | It ends up in a repository | PA-DEP-01; certificates or federated credentials only |
| A standing assignment removed before its holder can activate | An administrator is stranded | Eligible first, activation confirmed with a ticket, then `-Convert`, one wave at a time |
| A rollback that empties production groups | Every `PRV` holder loses access | Production needs `previousDesiredPath`, or the step is Blocked and `-Apply` refuses |
| A rollback in the wrong order | Rules still need context `c1` after it's gone, or access goes before it comes back | Reverse order; standing assignments restored before rules and eligibility go |
| A smoke test that grants itself access | It proves nothing | People act; the scripts only read; the synthetic administrator is kept out of the exclusion group (PA-DEP-09) |
| Evidence nobody can check | The ISSO can't prove what ran | A manifest with SHA-256 per run, the settings file's hash, and Chapter 08's hash-chained packages |
| A write permission left on an app | One stolen certificate changes the tenant | Conversion permission granted and removed per wave; User Access Administrator for one day |

## Checklist

- [ ] The test and production settings files hold no secret, have no placeholder left, and differ only in values.
- [ ] Each stage has an approved change record, with the settings file's SHA-256 and the rollback plan.
- [ ] The pre-flight passed before each stage and after every Conditional Access change.
- [ ] The emergency access drill raised the alert, and Chapter 02's check shows 0 Finding.
- [ ] Every administrator policy ran report-only for seven days before it was enforced, one per change.
- [ ] Every applied chapter read back with no difference.
- [ ] All four smoke-test phases passed in test and in production.
- [ ] The rollback was rehearsed in test, and the tenant read back as before.
- [ ] Every conversion had a confirmed activation with a ticket, one wave at a time.
- [ ] Seven days of production drift were read, and the week's package verifies.
- [ ] Every live result that differed from an expectation here is recorded, with research gaps rows 101 to 106, 113 and 114 answered.
- [ ] `Test-PaEvidence.ps1` reports GO for the test stage before promotion and for production at the end of the first week, and `coverage.csv` is in each change record.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 08 — Evidence and Drift for the ISSO](08-evidence-and-drift.md) · [Workbook index](index.md)
:::

[^pa09-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, September 2020 (with release 5.2.0, August 27, 2025), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (accessed Oct 20, 2026; cited in Book 04, Chapter 10).
[^pa09-fedramp-controls]: FedRAMP, "Full Rev5 Control Reference," *FedRAMP Consolidated Rules for 2026*, family pages, <https://www.fedramp.gov/2026/reference/controls/> (accessed Oct 21, 2026; cited in Book 13, Appendix A).
[^pa09-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, Ruleset Reference, <https://www.fedramp.gov/2026/reference/key-security-indicators/> (accessed Nov 2, 2026; the eleven IDs in this chapter checked on the page).
[^pa09-ksi-providers]: FedRAMP, "Key Security Indicators," FedRAMP 20x Certification Rules, *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (accessed Oct 21, 2026; cited in Book 00, Appendix B).
[^pa09-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022, section A, Identity (phishing-resistant MFA for agency staff, contractors and partners), pages 5 and 6, <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf> (read Nov 1, 2026; cited in the HR-Driven Identity implementation guide).
[^pa09-bod]: Cybersecurity and Infrastructure Security Agency, "BOD 25-01: Implementing Secure Practices for Cloud Services Required Configurations," Microsoft Entra ID policies including MS.AAD.3.6v1 and MS.AAD.7.5v1, <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations> (read Nov 1, 2026; cited in the HR-Driven Identity implementation guide).
[^pa09-scuba]: CISA, ScubaGear, "Microsoft Entra ID" secure configuration baseline (`aad.md`, policies MS.AAD.7.4v1 to MS.AAD.7.8v1), <https://github.com/cisagov/ScubaGear/blob/main/PowerShell/ScubaGear/baselines/aad.md> (accessed Oct 25, 2026; cited in the Graph practice crosswalk).
[^pa09-agu]: FedRAMP, "Agency Use of FedRAMP Certified Cloud Services," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/reference/agency-use/> (accessed Oct 21, 2026; cited in Book 13, Appendix A).
[^pa09-license]: Microsoft Learn, "Microsoft Entra ID Governance licensing fundamentals," Privileged Identity Management and types of licenses, <https://learn.microsoft.com/entra/id-governance/licensing-fundamentals> (accessed Nov 2, 2026).
[^pa09-service-plans]: Microsoft Learn, "Product names and service plan identifiers for licensing," <https://learn.microsoft.com/entra/identity/users/licensing-service-plan-reference> (accessed Nov 2, 2026).
[^pa09-sku]: Microsoft Learn, "List subscribedSkus," permissions, <https://learn.microsoft.com/graph/api/subscribedsku-list?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^pa09-sku-resource]: Microsoft Learn, "subscribedSku resource type," properties, <https://learn.microsoft.com/graph/api/resources/subscribedsku?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^pa09-emergency]: Microsoft Learn, "Manage emergency access accounts in Microsoft Entra ID," security guardrails summary and Conditional Access considerations, <https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access> (accessed Nov 2, 2026).
[^pa09-settings]: Microsoft Learn, "Configure Microsoft Entra role settings in Privileged Identity Management," require approval to activate, <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-change-default-settings> (accessed Nov 2, 2026).
[^pa09-report-only]: Microsoft Learn, "Analyze Conditional Access policy impact," overview and compare and validate policies before enforcement, <https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-report-only> (accessed Nov 2, 2026).
[^pa09-ca-plan]: Microsoft Learn, "Plan a Conditional Access deployment," deploy Conditional Access policies, <https://learn.microsoft.com/entra/identity/conditional-access/plan-conditional-access> (accessed Nov 2, 2026).
[^pa09-pim-plan]: Microsoft Learn, "Plan a Privileged Identity Management deployment," type of assignments, plan a pilot, plan testing and rollback, and view audit history, <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-deployment-plan> (accessed Nov 2, 2026).
[^pa09-activate]: Microsoft Learn, "Activate a Microsoft Entra role in PIM," activate a role and view the status of activation requests, <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-how-to-activate-role> (accessed Nov 2, 2026).
[^pa09-approve]: Microsoft Learn, "Approve or deny requests for Microsoft Entra roles in Privileged Identity Management," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-approval-workflow> (accessed Nov 2, 2026).
[^pa09-request]: Microsoft Learn, "request resource type," the status property, <https://learn.microsoft.com/graph/api/resources/request?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^pa09-ras-list]: Microsoft Learn, "List roleAssignmentScheduleRequests," permissions, <https://learn.microsoft.com/graph/api/rbacapplication-list-roleassignmentschedulerequests?view=graph-rest-1.0> (accessed Nov 2, 2026).
[^pa09-ps-assign]: Microsoft Learn, "Assign Microsoft Entra roles in Privileged Identity Management using Microsoft Graph PowerShell," steps 2, 4 and 6, <https://learn.microsoft.com/powershell/microsoftgraph/how-to-assign-microsoft-entra-roles-in-pim?view=graph-powershell-1.0> (accessed Nov 2, 2026).
[^pa09-arm-ras]: Microsoft Learn, "Microsoft.Authorization roleAssignmentScheduleRequests 2020-10-01" (ARM template reference), property values, <https://learn.microsoft.com/azure/templates/microsoft.authorization/2020-10-01/roleassignmentschedulerequests> (accessed Nov 2, 2026).
[^pa09-groups-assign]: Microsoft Learn, "Assign eligibility for a group in Privileged Identity Management," overview, <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/groups-assign-member-owner> (accessed Nov 2, 2026).
[^pa09-groups-concept]: Microsoft Learn, "Govern membership and ownership of groups by using PIM for Groups," <https://learn.microsoft.com/graph/api/resources/privilegedidentitymanagement-for-groups-api-overview?view=graph-rest-1.0> (accessed Oct 30, 2026; read for Chapter 05).
[^pa09-rag-create]: Microsoft Learn, "Create a role-assignable group in Microsoft Entra ID," <https://learn.microsoft.com/entra/identity/role-based-access-control/groups-create-eligible> (accessed Oct 30, 2026; read for Chapter 05).
[^pa09-review]: Microsoft Learn, "Perform an access review of Azure resource and Microsoft Entra roles in PIM," approve or deny access, <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/pim-perform-roles-and-resource-roles-review> (accessed Nov 2, 2026).
[^pa09-connect]: Microsoft Learn, "Use app-only authentication with the Microsoft Graph PowerShell SDK," authenticate the application, <https://learn.microsoft.com/powershell/microsoftgraph/app-only?view=graph-powershell-1.0> (accessed Nov 2, 2026).
[^pa09-wif]: Microsoft Learn, "Workload identity federation," why use workload identity federation and how it works, <https://learn.microsoft.com/entra/workload-id/workload-identity-federation> (accessed Nov 2, 2026).
[^pa09-audits]: Microsoft Learn, "List directoryAudits," permissions, <https://learn.microsoft.com/graph/api/directoryaudit-list?view=graph-rest-1.0> (accessed Oct 30, 2026; read for Chapter 08).
[^pa09-rasi]: Microsoft Learn, "List roleAssignmentScheduleInstances," <https://learn.microsoft.com/graph/api/rbacapplication-list-roleassignmentscheduleinstances?view=graph-rest-1.0> (accessed Oct 30, 2026; read for Chapter 02).
[^pa09-ar-list]: Microsoft Learn, "List decisions," <https://learn.microsoft.com/graph/api/accessreviewinstance-list-decisions?view=graph-rest-1.0> (accessed Oct 30, 2026; read for Chapter 07).
[^pa09-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026; read for Chapter 01).
[^pa09-immutable]: Microsoft Learn, "Store business-critical blob data with immutable storage in a write once, read many (WORM) state," <https://learn.microsoft.com/azure/storage/blobs/immutable-storage-overview> (accessed Oct 30, 2026; read for Chapter 08).
