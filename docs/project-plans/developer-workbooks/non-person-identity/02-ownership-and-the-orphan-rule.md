---
title: "Chapter 02 — Ownership and the Orphan Rule"
description: "Check every identity in Chapter 01's register against the program's ownership rule as code, starting from Learn's own Graph samples for finding ownerless service principals, assigning owners and setting serviceManagementReference (pinned in the repository), and adding what they leave to you: two enabled human members as owners, not service principals or guests, a service-management reference that names an active record, an application owner for every Active Directory account, findings with stable IDs, AI sponsor fields recorded for Chapter 09, and the orphan rule (D-N2) as a dry-run plan that disables and never deletes, applied only through a separate, delegated, reviewed write path, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-non-person-identity
part: How
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
review-status: pending
---

# Chapter 02 — Ownership and the Orphan Rule

*An account nobody will own is the one nobody will notice when it's misused, so the rule for it is decided once, written down, and run by code a reviewer has read.*

::: {.callout-note}
## In this chapter
The check and the plan behind the project plan's Gate 1, "every non-person identity owned." You start with Learn's own Graph samples for finding service principals with no owner or one owner, adding an owner, and recording a `serviceManagementReference`, which the repository keeps as a pinned copy, and you send them to a fake Graph to see what they find and what they miss. Then you use `examples/non-person-identity` for what they leave to you: the ownership check over Chapter 01's register, findings with stable IDs, the AI sponsor fields Chapter 09 will check, and the orphan rule (decision D-N2) as a dry-run plan, applied only by a separate write path after a reviewer approves the plan's SHA-256. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant and a test domain.
:::

## Goal and audience

**Goal.** By the end of this chapter you can check, from code, the ownership the plan's task N1.1 asks for ("an application owner found for every service account; two human owners on every app registration and service principal; serviceManagementReference set"), and produce the orphan rule's plan for N1.3 ("unowned identities disabled, not deleted, under the orphan rule; each a retirement candidate with a 30-day claim window") as a file a reviewer approves before anything changes. You can say, for each rule, whether it is Learn's, Learn's sample, or the program's design.

**Audience.** Developers who build the project's ownership and lifecycle code, the identity governance officer who confirms each orphan, and the application owners and ISSOs who review the results. You should read PowerShell 7 and know Chapter 01's register. You don't need a tenant until Lab 2.

## The rule the code holds

Owners are the most misunderstood control on an application: an owner can add a credential and act as the app ([Book 04, Chapter 05](../../../books/b04-access/05-applications-and-workload-identities.md#ownership)). Learn recommends monitoring so that every application has at least two owners where possible, and using the application's `serviceManagementReference` to reference the team contact from the organization's service or asset management database, so a contact survives any one person leaving.[^np02-ownership] Learn's owners of a service principal are users or service principals; groups can't own one.[^np02-sp-owners-cmdlet] Learn's guidance for application owners is to keep ownership to a minimal set of people and review the list every few months.[^np02-best]

The program's rule, from the plan and Book 02, is stricter *(Design guidance)*:

- **Two human owners** on every app registration and service principal, "never service accounts" ([Book 02, Chapter 09](../../../books/b02-identity/09-building-the-entra-target.md#governing-service-principals)), and, in the plan's ownership task, "not service principals or guests." The code counts an owner only if it is a user, a member and enabled.
- **A service-management reference** that names a record in the system inventory, the plan's source of record (D-N1), not free text.
- **An application owner for every Active Directory account**, found "before the account is touched" ([Book 02, Chapter 10](../../../books/b02-identity/10-migrating-and-governing.md#phase-4-service-account-modernization)). Active Directory has no owners attribute the code can trust, so the owner comes from an owners file kept with the record.

The orphan rule is the plan's decision D-N2, which the CISO owns: disable once the identity governance officer confirms the finding, then 30 days for the office to name an owner or retire it, "Book 04's rule, applied at once to agents because they can act." Book 04, Chapter 06's own policy runs the other way round, 30 days to assign an owner, then suspension on day 31 ([Book 04, Chapter 06](../../../books/b04-access/06-who-decides-access.md#ownership-changes-and-orphaned-apps)); Book 17 disables first, for agents ([Book 17, Chapter 05](../../../books/b17-ai-identity/05-owners-sponsors-and-lifecycle.md#the-orphaned-agent)). The code follows D-N2 as the plan states it, the stricter, and the difference stays open for the CISO (research gaps, row 11). Learn's own governance guidance agrees on the shape: if owners fail to review, disable the account but don't delete it until the review is complete; delete only after a defined period and a warning to owners.[^np02-govern-entra] [^np02-govern-onprem]

**Disable, never delete.** For an app registration, Learn offers two reversible switches: deactivating the registration (`isDisabled`, which blocks tokens in every tenant), and disabling sign-in on the tenant's service principal (`accountEnabled` false, which blocks tokens in that tenant only). Both keep the configuration; deletion leaves a 30-day recycle bin.[^np02-deactivate] [^np02-disable-signin] Learn's procedure for deactivation is on the beta endpoint,[^np02-deactivate] so the code disables the service principal, on v1.0 (research gaps, row 12). For Active Directory, `Disable-ADAccount` disables a user, computer or service account.[^np02-disable-adaccount]

### Which cloud, for this check and these writes

The reads and writes in this chapter go to Graph at `graph.microsoft.com` for the target estate, Microsoft 365 GCC; GCC High and DoD use `graph.microsoft.us` and `dod-graph.microsoft.us`.[^np02-deployments] Listing an application's owners, adding an owner and updating a service principal all list the global service, US Government L4 and US Government L5.[^np02-app-owners] [^np02-add-owner] [^np02-sp-update] The disables in Active Directory go to the domain named with `-Domain`; `Disable-ADAccount` doesn't work against a read-only domain controller.[^np02-disable-adaccount]

## Start with Microsoft's sample

### What Microsoft gives you

Learn's Graph tutorial *Manage Microsoft Entra applications using Microsoft Graph* is Microsoft's procedure for this chapter. Its "Manage owners" section gives three HTTP samples: a query for service principals with no owner or one owner (`owners/$count eq 0 or owners/$count eq 1`, with the `ConsistencyLevel: eventual` header that advanced queries need), a request that adds an owner to an application, and one that adds an owner to a service principal. Its "basic properties" sample sets an application's `serviceManagementReference`.[^np02-tutorial] *List applications* has the same `owners/$count` query for applications,[^np02-app-list] and *Add owner* documents the request and its permissions.[^np02-add-owner]

### The pinned copy

The samples exist only inside the Learn page, so the repository pins the page's source, unmodified, in [`examples/third_party/graph-applications-tutorial-page`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/third_party/graph-applications-tutorial-page): `tutorial-applications-basics.md` from microsoftgraph/microsoft-graph-docs-contrib at commit `a693031` (October 30, 2026), retrieved October 30, 2026, with the repository's licenses (MIT for code, Creative Commons Attribution 4.0 for documentation).[^np02-src] `snapshot.json` records each file's SHA-256, checked against the upstream git blob hashes, and a unit test checks them. The weekly source watch reports new commits to the page. Updating the copy is a reviewed pull request.

`tests/LearnSampleHarness.ps1` finds each HTTP sample by its name in the page's source, parses the method, URL, headers and body, and sends it unmodified to the fake Graph, which serves the fixture estate, evaluates the `owners/$count` filter, and refuses an advanced query without `ConsistencyLevel: eventual` as Learn says Graph does.

### What it leaves to you

Each row is pinned by a test: in `tests/MicrosoftSamples.Tests.ps1` for the samples, and in `tests/NpiOwnership.Tests.ps1` for the example.

| Learn's sample, as published | Why it matters | What `examples/non-person-identity` adds |
|---|---|---|
| Finds service principals with no owner or one owner, with `ConsistencyLevel: eventual` | — | Kept as the model: Chapter 01 reads owners for every app registration and legacy service principal, every page followed |
| Returns managed identities, an external app and Microsoft Graph's own service principal among the "ownerless" | The list is mostly noise nobody can act on: managed identities have no owners to add, and a third party's app is owned in its home tenant | Owner rules apply to app registrations and legacy service principals; managed identities, external apps and own apps' service principals are left out, with the reason in the register |
| Reads service principal owners, so an app registration with one owner is missed when its service principal has two | The credentials live on the registration; its owners are the ones who can add one | The rule is checked on the registration's owners (research gaps, row 19) |
| Counts a guest and a service principal as owners, like any person | An app owned by a guest and one member, or a person and a bot, passes the query | Each owner read with `userType` and `accountEnabled`; service principals, guests and disabled users don't count (NPI-OWN-03 to -05) |
| Labels this read with the least-privileged delegated permission `Application.ReadWrite.All` | A write permission for a read; List servicePrincipals names `Application.Read.All`[^np02-sp-list] | Owners are read in Chapter 01 with `Application.Read.All`; the people with `User.Read.All` (research gaps, row 13) |
| Adds any directory object as an owner, a service principal included | Learn allows it;[^np02-add-owner] the program's rule doesn't | An owner is added only from a claim, only if the nominee is an enabled member, and only through the reviewed write path |
| Hard-codes `graph.microsoft.com` | The host is wrong for GCC High and DoD | The host from the cloud table, checked on every request |
| Sets `serviceManagementReference` to free-text owner aliases | Learn's own guidance is a reference to the service management database;[^np02-ownership] free text can't be checked | A record key that must name an active record in the service records file (NPI-OWN-06, -07; research gaps, row 17) |
| Nothing about Active Directory service accounts | Half of Gate 1 | An application owner from the owners file, checked as an enabled member, and its record (NPI-OWN-08) |
| No step that disables an orphan, or records a claim window | The orphan rule is left to you | The rule as a dry-run plan, with the identity governance officer's confirmation, the 30-day claim window, and a separate write path |

**The verdict.** Use Learn's query and its owner requests as the model for the reads and the one write that adds an owner. Don't use the query as the ownership check: it counts the wrong owners on the wrong object and can't see Active Directory.

## The code: what `examples/non-person-identity` adds

This chapter's code is `powershell/NpiOwnership/NpiOwnership.psm1`, two entry scripts (`Invoke-NpiOwnership.ps1`, which only reads, and `Invoke-NpiOrphanAction.ps1`, the write path), the `ownership` and `orphan-apply` tasks in `config/calls.json`, and four input files kept with the records.

### The inputs

| File | Who keeps it | What it holds |
|---|---|---|
| Chapter 01's run folder | The pipeline | `register.json` and `manifest.json`; the check refuses a register whose SHA-256 isn't the manifest's |
| `application-owners.csv` | Application owners, through the identity governance office | For each AD account: `SamAccountName`, `OwnerUpn`, `ApplicationRecord` |
| `service-records.csv` | The system inventory (D-N1) | `RecordId`, `Name`, `Status` (`Active` or `Retired`), `IsAI` |
| `igo-confirmations.csv` | The identity governance officer | For each orphan: `IdentityId`, `Decision` (`Disable` or `Exception`), `ConfirmedBy`, `ConfirmedOn`, then `DisabledOn` after the disable, or `ExceptionEnds` |
| `owner-claims.csv` | The offices that claim an identity | `IdentityId`, `NomineeUpn`, `ClaimedBy`, `ClaimedOn` |

### The check

`Test-NpiOwnership` reads each owner and each nominated person once, through a reader for the `ownership` task, whose only call is `GET /users/{id}` with `$select=id,userPrincipalName,userType,accountEnabled` and `User.Read.All`.[^np02-user-get] A guest's user principal name holds `#`, which Learn says to encode as `%23`;[^np02-user-get] the reader encodes every key.

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| NPI-OWN-01 | Finding | An app registration or legacy service principal with no valid human owner: an orphan candidate | Book 02; Learn: at least two owners[^np02-ownership] |
| NPI-OWN-02 | Finding | One valid human owner | Book 02, Chapter 09 |
| NPI-OWN-03 | Warn | An owner that is a service principal | Book 02: "never service accounts" |
| NPI-OWN-04 | Warn | An owner that is a guest | Project plan, N1.1 (*Design guidance*; research gaps, row 16) |
| NPI-OWN-05 | Warn | An owner whose account is disabled or not found | *Design guidance* |
| NPI-OWN-06 | Finding | No service-management reference | Learn;[^np02-ownership] project plan, N1.1 |
| NPI-OWN-07 | Finding | A reference that isn't a record key, names no record, or names a retired one | D-N1 (*Design guidance*) |
| NPI-OWN-08 | Finding | An AD account with no valid application owner in the owners file: an orphan candidate | Book 02, Chapter 10 |
| NPI-OWN-09 | Info | An AD account found only by a password that never expires, not checked until someone confirms it's a service account | Chapter 01, NPI-INV-08 |

Every finding has a stable ID, `<rule>:<identity>`, so the same gap keeps its ID from run to run and the weekly comparison in Chapter 10 can tell a new finding from an old one.

**The AI sponsor fields.** The plan's task N1.2 asks every AI identity for a federal sponsor mastered in HR, a sponsoring group, a technical owner who isn't the sponsor and a matching inventory record ([Book 17, Chapter 05](../../../books/b17-ai-identity/05-owners-sponsors-and-lifecycle.md#the-programs-rule-two-named-humans-and-a-record)). This chapter records those four fields, empty, for every agent identity, agent identity blueprint and record marked `IsAI`, in `ai-sponsor-fields.json`, and checks none of them: Chapter 09 reads the sponsors and builds the check (research gaps, row 18). Agent identities and blueprints are left out of the owner rule here.

### The orphan rule as a plan

`New-NpiOrphanPlan` turns each orphan candidate and each claim into one action. Nothing in it writes.

| Action | When | Writes? |
|---|---|---|
| `AwaitConfirmation` | No confirmation from the identity governance officer, or one this code can't read | No |
| `Disable` | Confirmed, still enabled. A service principal gets `PATCH /servicePrincipals/{id}` with `{"accountEnabled": false}`; an AD account gets `Disable-ADAccount -Identity <objectGUID>`. The claim window is 30 days from the disable | Yes, after review |
| `AlreadyDisabled` | Confirmed, already disabled: record `DisabledOn` so the window has a start | No |
| `ClaimWindowOpen` | Disabled, inside the 30 days | No |
| `ClaimRecorded` | Disabled and claimed inside the window; re-enabling is a person's decision | No |
| `RetirementCandidate` | Disabled, the window closed, no claim: retire through the reviewed decommission process. This code never deletes | No |
| `ReEnabledOutsideRule` | Recorded as disabled, but enabled now: a new confirmation is needed | No |
| `Exception`, `ExceptionExpired` | A dated exception, still running or ended | No |
| `HandedOff` | A SQL Server account: the Data Platform plan decides | No |
| `AddOwner` | A claim names an enabled member for an app registration: `POST /applications/{id}/owners/$ref` | Yes, after review |
| `NomineeRefused`, `AlreadyOwner`, `RecordOwner` | The nominee is a guest, disabled or not found; already an owner; or the identity is an AD account, whose owner goes in the owners file in a reviewed change | No |

The plan is written as `orphan-plan.json` with the register's SHA-256, the tenant, the cloud and the date, and the run prints the plan's own SHA-256. The same inputs give the same plan, byte for byte, so a reviewer approves a hash.

### The separate write path

`Invoke-NpiOrphanAction.ps1` is the only code in the example that can write, and it writes only through `New-NpiWriter`, whose calls are the `orphan-apply` task's. It refuses to run unless:

- the plan file's SHA-256 is the one passed as `-ApprovedSha256`;
- the plan is for this tenant and this cloud, and no more than seven days old (*Design guidance*);
- each write is a declared `orphan-apply` call with the declared method; the only `PATCH` body allowed is `{"accountEnabled": false}`, the only `POST` body a `@odata.id` naming a directory object on the cloud's own Graph host, and `DELETE` is never sent;
- a live run is delegated: a person signed in with Cloud Application Administrator, never an unattended app. *Disabling is never automatic* ([Book 17, Chapter 05](../../../books/b17-ai-identity/05-owners-sponsors-and-lifecycle.md#the-orphaned-agent)).

Before each write it re-reads the target (the registration's or service principal's owners, the AD account's state) and skips the write if an owner has appeared or the account is already disabled since the plan was reviewed. Without `-Apply` it stops after the prechecks and reports `WouldSend`. With `-Apply` it sends, records every request in its manifest, and tells the operator the date to record as `DisabledOn` and when the claim window ends.

| Task | Calls | Permissions, role or right |
|---|---|---|
| `ownership` (read) | `GET /users/{id}` | `User.Read.All`[^np02-user-get] |
| `orphan-apply` (write, delegated only) | Re-read owners; read the nominee; `PATCH /servicePrincipals/{id}`; `POST /applications/{id}/owners/$ref`; `Get-ADUser`, `Get-ADServiceAccount`, `Disable-ADAccount` | `Application.Read.All`, `User.Read.All`, `Application.ReadWrite.All`, `Directory.Read.All`, Cloud Application Administrator;[^np02-sp-update] [^np02-add-owner] [^np02-disable-signin] a delegated right to disable accounts in the account's OU (research gaps, row 15) |

`Application.ReadWrite.All` is the least-privileged delegated permission for updating a service principal; the application permission `Application.ReadWrite.OwnedBy` reaches only service principals the caller owns, which an orphan isn't, and Learn says it isn't sufficient to add another owner.[^np02-sp-update] [^np02-add-owner] Learn's permissions reference warns that permissions that can manage credentials, such as `Application.ReadWrite.All`, let an app act as other entities.[^np02-perms-ref] That is why the write path is a person's delegated session, not an app's standing permission.

### The tests

Pester 5 under PowerShell 7. This chapter's are:

- `tests/MicrosoftSamples.Tests.ps1`, 10 tests in the Chapter 02 block: Learn's HTTP samples, sent as published.
- `tests/NpiOwnership.Tests.ps1`, 31 tests: the register's hash, the read-only task, each rule, stable IDs, the AI sponsor fields, each plan action, the deterministic plan hash, the writer's refusals (hash, tenant, age, method, body, host), dry run, `-Apply`, the precheck that skips a disable, and the entry scripts.

::: {.callout-important}
## Illustrative code
The commands below send Learn's pinned samples to a fake, and run the example against a fictional estate. `-Apply` in Lab 1 changes only the fake, in memory. Review the code, and run Lab 2 in a test tenant and test domain, before it reads or writes a real one.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/non-person-identity`, with Chapter 01's `out/inventory` in place (Lab 1 of [Chapter 01](01-non-person-identity-inventory-as-code.md#lab-1-fixtures-no-tenant), step 3).

1. **Send Learn's samples to the fake:**

   ```powershell
   Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 -FullNameFilter '*Chapter 02*' -Output None -PassThru |
       Select-Object PassedCount, FailedCount, NotRunCount
   ```

   `PassedCount 10`, `FailedCount 0`, `NotRunCount 20` (the twenty are Chapter 01's). Read the test that sends the query without its header: the fake answers `400`, as Graph does for an advanced query without `ConsistencyLevel: eventual`.

2. **List what each task needs:**

   ```powershell
   Import-Module ./powershell/NpiOwnership/NpiOwnership.psm1
   foreach ($t in 'ownership', 'orphan-apply') { $p = Get-NpiRequiredPermission -Task $t; "$t : " + ($p.GraphPermissions -join ', ') }
   ```

   ```text
   ownership : User.Read.All
   orphan-apply : Application.Read.All, Application.ReadWrite.All, Directory.Read.All, User.Read.All
   ```

3. **Check ownership and build the plan:**

   ```powershell
   ./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/estate.json -InputPath tests/fixtures/inputs -OutputPath out/ownership
   ```

   ```text
   Ownership: 22 identities checked; 7 orphan candidates
   Findings: 20 Finding, 3 Warn, 1 Info. AI sponsor fields recorded for Chapter 09: 2
   Orphan plan: 10 actions, 3 of them writes (1 AddOwner, 2 Disable); nothing sent
   Plan SHA-256: 073aea8a6a3ae6ed7e9b27ed9ff406e588b0af770ca2fcce00afee99019ecb84
   ```

   The plan's hash is the same on every run with these inputs.

4. **Read the findings:**

   ```powershell
   Get-Content out/ownership/findings.json -Raw | ConvertFrom-Json | Where-Object Severity -eq 'Finding' | Group-Object Rule | Format-Table Name, Count
   ```

   NPI-OWN-01 twice (Legacy Reports, Old SAML Connector), NPI-OWN-02 four times (HR Connector; Build Pipeline, whose other owner is a service principal; Vendor Portal, whose other owner is a guest; Mail Automation, whose other owner is disabled), NPI-OWN-06 six times, NPI-OWN-07 three times (Build Pipeline's free text, Vendor Portal's retired record, `svc-ldapbind`'s unknown one) and NPI-OWN-08 five times (`svc-backup`, whose only owner is disabled, and four AD accounts with none). Payroll Export and Deploy Bot pass. `jdoe` is the one Info: not checked until someone confirms it's a service account.

5. **Read the plan:**

   ```powershell
   Get-Content out/ownership/orphan-plan.json -Raw | ConvertFrom-Json | Select-Object -ExpandProperty actions | Format-Table Action, Name, Write
   ```

   ```text
   Action              Name               Write
   ------              ----               -----
   Disable             svc-backup          True
   AwaitConfirmation   svc-oldftp         False
   RetirementCandidate svc-reports        False
   ClaimWindowOpen     sa-printsvc        False
   Exception           gmsa-ops$          False
   Disable             Legacy Reports      True
   AwaitConfirmation   Old SAML Connector False
   AddOwner            HR Connector        True
   NomineeRefused      Build Pipeline     False
   RecordOwner         svc-oldftp         False
   ```

   `svc-reports` was disabled on September 12 and nobody claimed it by October 12: a retirement candidate, with no write. `sa-printsvc`'s window runs to November 15. The Build Pipeline claim named a guest and is refused.

6. **Dry-run the plan with its approved hash:**

   ```powershell
   $sha = (Get-FileHash out/ownership/orphan-plan.json -Algorithm SHA256).Hash.ToLower()
   ./Invoke-NpiOrphanAction.ps1 -Cloud gcc -PlanPath out/ownership/orphan-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/estate.json -OutputPath out/orphan-dryrun
   ```

   ```text
   DryRun: 3 WouldSend
     WouldSend Disable  WRITE Disable-ADAccount -Identity ad000000-0000-4000-8000-000000000003
     WouldSend Disable  PATCH https://graph.microsoft.com/v1.0/servicePrincipals/5b000000-0000-4000-8000-000000000003
     WouldSend AddOwner POST https://graph.microsoft.com/v1.0/applications/0a000000-0000-4000-8000-000000000002/owners/$ref
   ```

7. **Apply it to the fake, then try a hash nobody approved:**

   ```powershell
   ./Invoke-NpiOrphanAction.ps1 -Cloud gcc -PlanPath out/ownership/orphan-plan.json -ApprovedSha256 $sha -FixturePath tests/fixtures/estate.json -OutputPath out/orphan-apply -Apply
   ./Invoke-NpiOrphanAction.ps1 -Cloud gcc -PlanPath out/ownership/orphan-plan.json -ApprovedSha256 ('0' * 64) -FixturePath tests/fixtures/estate.json -OutputPath out/orphan-x
   ```

   `Apply: 3 Sent`, each disable's detail saying to record `DisabledOn 2026-10-30` and that the claim window ends `2026-11-29`; then the refusal, `The plan's SHA-256 is 073aea8a…, not the approved 0000…; refusing to run a plan nobody reviewed.`

8. **Run the tests:**

   ```powershell
   Invoke-Pester -Path tests
   ```

**Expected result:** 97 tests passing, `out/ownership/manifest.json` listing 14 user reads and the SHA-256 of the register and of each input, and `out/orphan-apply/manifest.json` listing the prechecks and the three writes. Delete `out` when you're done.

## Lab 2: test tenant

Use a test tenant in the worldwide or GCC cloud and a test Active Directory domain, never production, with fictional people, and Chapter 01's Lab 2 run (`out/inventory-test`).

1. **Make two test orphans:** a test app registration with no owners, and an enabled test service account (`svc-` prefix) in a test OU. Add both to `service-records.csv` and give the account no row in `application-owners.csv`.
2. **Run the check** with an app holding only `User.Read.All`, signed in as in Chapter 01:

   ```powershell
   ./Invoke-NpiOwnership.ps1 -Cloud gcc -RegisterRun out/inventory-test -InputPath <inputs> -OutputPath out/ownership-test
   ```

   Both test orphans should be candidates (NPI-OWN-01 and NPI-OWN-08). Confirm that a guest owner comes back with `userType` `Guest` (research gaps, row 16).
3. **Confirm them** as the identity governance officer would: add both to `igo-confirmations.csv` with `Decision` `Disable`, run step 2 again, and have a second person review `orphan-plan.json` and pass you its SHA-256.
4. **Dry-run, then apply,** signed in as a person with Cloud Application Administrator and a delegated right to disable accounts in the test OU:

   ```powershell
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes Application.Read.All, Application.ReadWrite.All, Directory.Read.All, User.Read.All
   ./Invoke-NpiOrphanAction.ps1 -Cloud gcc -PlanPath out/ownership-test/orphan-plan.json -ApprovedSha256 <sha> -Domain <test-domain> -OutputPath out/orphan-test
   ./Invoke-NpiOrphanAction.ps1 -Cloud gcc -PlanPath out/ownership-test/orphan-plan.json -ApprovedSha256 <sha> -Domain <test-domain> -OutputPath out/orphan-test-apply -Apply
   ```

5. **Check the result.** The test app's enterprise application shows **Activation status** Deactivated, from `accountEnabled` false;[^np02-app-props] the test account is disabled; record `DisabledOn` in the confirmations log. Confirm the right the AD disable needed (research gaps, row 15).
6. **Back it out.** Set the service principal's `accountEnabled` back to `true`, as Learn's restore step describes,[^np02-disable-signin] enable the test account, delete both test objects and the test app's registration, and delete the `out` folders: they name owners.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| Ownerless service principals | `GET /servicePrincipals?$filter=owners/$count eq 0 or owners/$count eq 1&$count=true`, `ConsistencyLevel: eventual` | — | v1.0 | [^np02-tutorial] |
| Applications with fewer than two owners | The same filter on `GET /applications` | L4 and L5 | v1.0 | [^np02-app-list] |
| List owners of an application | `Application.Read.All`; unreadable owners return `id` and `@odata.type` only | L4 and L5 | v1.0 | [^np02-app-owners] |
| Owners of a service principal | Users or service principals | — | v1.0 | [^np02-sp-owners-cmdlet] |
| Add owner | `POST /applications/{id}/owners/$ref`; delegated `Application.ReadWrite.All` and `Directory.Read.All`; `Application.ReadWrite.OwnedBy` not sufficient to add another owner; Hybrid Identity, Cloud Application or Application Administrator | L4 and L5 | v1.0 | [^np02-add-owner] |
| Get a user | Application `User.Read.All`; properties outside the default set need `$select`; encode `#` as `%23` in a guest's UPN | — | v1.0 | [^np02-user-get] |
| Update servicePrincipal | Delegated `Application.ReadWrite.All`; application `Application.ReadWrite.OwnedBy` | L4 and L5 | v1.0 | [^np02-sp-update] |
| Disable sign-in | `accountEnabled` false blocks tokens in this tenant only; Cloud Application Administrator, Application Administrator or the service principal's owner; restore by setting `true` | — | v1.0 | [^np02-disable-signin] |
| Deactivate an app registration | `isDisabled` on beta; reactivation shown on v1.0; existing tokens stay valid until they expire; remove owners to prevent reactivation | — | Beta (deactivate) | [^np02-deactivate] |
| Activation status | Shows Deactivated for `accountEnabled` false, `isDisabled` true, or Microsoft's disablement | — | — | [^np02-app-props] |
| `serviceManagementReference`; two owners | Reference the team contact in the service or asset management database; monitor for at least two owners | — | — | [^np02-ownership] |
| Disable, don't delete | Disable until the review is complete; delete after a defined period and warning | — | — | [^np02-govern-entra] [^np02-govern-onprem] |
| `Disable-ADAccount` | Disables a user, computer or service account; not against a read-only domain controller | n/a (Active Directory) | GA | [^np02-disable-adaccount] |

Where Learn's pages differ: the tutorial labels its ownerless read with `Application.ReadWrite.All` while List servicePrincipals names `Application.Read.All` (research gaps, row 13); Add owner's permission table and its note disagree about `Application.ReadWrite.OwnedBy` (row 14); the tutorial's `serviceManagementReference` sample is free text where the ownership overview says to reference the service management database (row 17); and deactivation is shown on beta while reactivation is shown on v1.0 (row 12). The code follows the stricter reading in each case.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A guest, a bot or a leaver counted as an owner | Gate 1 passes on owners who can't answer for the app | Each owner read with `userType` and `accountEnabled`; only enabled members count |
| A disable on a guess | A job fails, and nobody knew it was claimed | Only after the identity governance officer's confirmation; re-read before the write; skipped if an owner appeared |
| A delete | Configuration gone once the 30-day recycle bin empties[^np02-deactivate] | No delete action exists; the writer refuses `DELETE`; retirement goes through the reviewed decommission process |
| An unattended app with `Application.ReadWrite.All` | A standing permission that can act as every app | The write path is delegated only, a person with Cloud Application Administrator; the read path holds `User.Read.All` alone |
| A plan changed after review | Different writes from the ones approved | The approved SHA-256 is checked; the plan must be for this tenant and cloud, and no older than seven days |
| A body that does more than disable | A `PATCH` that also changes other properties | The only body allowed is `{"accountEnabled": false}`; the only `POST` body a directory object on the cloud's host |
| A register that changed since Chapter 01 | The check runs on evidence the ISSO never saw | The register's SHA-256 must match its manifest |
| A person treated as an orphaned account | Someone's account is disabled | Accounts found only by a password that never expires are skipped (NPI-OWN-09) |
| An app re-enabled after the rule disabled it | The orphan is back with nobody accountable | `ReEnabledOutsideRule`; a new confirmation is needed |
| The window never closes | Disabled orphans pile up | `RetirementCandidate` once 30 days pass with no claim |

## Checklist

- [ ] Every app registration and legacy service principal has two owners who are enabled members, or a finding with an owner of the fix.
- [ ] Every `serviceManagementReference` names an active record in the system inventory.
- [ ] Every AD service account has an application owner in the owners file, or is an orphan candidate.
- [ ] Every orphan candidate is confirmed, excepted with an end date, or awaiting the identity governance officer, and none was disabled without a confirmation.
- [ ] The plan's SHA-256 was approved by someone other than the person who applies it.
- [ ] The write path ran as a person, delegated, with Cloud Application Administrator, and its manifest is filed with the decision record.
- [ ] Every disable has its `DisabledOn` recorded, and every claim window that closed has a retirement decision.
- [ ] The AI sponsor fields file has gone to the Chapter 09 work.
- [ ] The pinned Learn page matches its manifest, and every upstream commit since the pin has been reviewed.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 01 — Non-Person Identity Inventory as Code](01-non-person-identity-inventory-as-code.md) · [Workbook index](index.md) · Next: Chapter 03 — The Migration Path Matrix as Code (planned)
:::

[^np02-ownership]: Microsoft Learn, "Overview of enterprise application ownership in Microsoft Entra ID," FAQ, <https://learn.microsoft.com/entra/identity/enterprise-apps/overview-assign-app-owners> (accessed Oct 30, 2026).
[^np02-sp-owners-cmdlet]: Microsoft Learn, "Get-MgServicePrincipalOwner," description, <https://learn.microsoft.com/powershell/module/microsoft.graph.applications/get-mgserviceprincipalowner?view=graph-powershell-1.0> (accessed Oct 30, 2026).
[^np02-best]: Microsoft Learn, "Security best practices for application properties in Microsoft Entra ID," app ownership configuration, <https://learn.microsoft.com/entra/identity-platform/security-best-practices-for-app-registration> (accessed Oct 30, 2026).
[^np02-govern-entra]: Microsoft Learn, "Governing Microsoft Entra service accounts," build a lifecycle process, <https://learn.microsoft.com/entra/architecture/govern-service-accounts> (accessed Oct 30, 2026).
[^np02-govern-onprem]: Microsoft Learn, "Govern on-premises service accounts," deprovision service accounts, <https://learn.microsoft.com/entra/architecture/service-accounts-govern-on-premises> (accessed Oct 30, 2026).
[^np02-deactivate]: Microsoft Learn, "Deactivate an app registration," <https://learn.microsoft.com/entra/identity/enterprise-apps/deactivate-app-registration> (accessed Oct 30, 2026).
[^np02-disable-signin]: Microsoft Learn, "Disable user sign-in for an application," prerequisites; Microsoft Graph and PowerShell; restore tenant-local sign-in, <https://learn.microsoft.com/entra/identity/enterprise-apps/disable-user-sign-in-portal> (accessed Oct 30, 2026).
[^np02-app-props]: Microsoft Learn, "Properties of an enterprise application," activation status, <https://learn.microsoft.com/entra/identity/enterprise-apps/application-properties> (accessed Oct 30, 2026).
[^np02-disable-adaccount]: Microsoft Learn, "Disable-ADAccount," description and notes, <https://learn.microsoft.com/powershell/module/activedirectory/disable-adaccount> (accessed Oct 30, 2026).
[^np02-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (accessed Oct 30, 2026).
[^np02-app-owners]: Microsoft Learn, "List owners of an application," <https://learn.microsoft.com/graph/api/application-list-owners?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^np02-add-owner]: Microsoft Learn, "Add owner" (application), <https://learn.microsoft.com/graph/api/application-post-owners?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^np02-sp-update]: Microsoft Learn, "Update servicePrincipal," permissions, <https://learn.microsoft.com/graph/api/serviceprincipal-update?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^np02-sp-list]: Microsoft Learn, "List servicePrincipals," permissions, <https://learn.microsoft.com/graph/api/serviceprincipal-list?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^np02-tutorial]: Microsoft Learn, "Manage Microsoft Entra applications using Microsoft Graph," manage owners; configure other basic properties, <https://learn.microsoft.com/graph/tutorial-applications-basics> (accessed Oct 30, 2026).
[^np02-app-list]: Microsoft Learn, "List applications," example 5, <https://learn.microsoft.com/graph/api/application-list?view=graph-rest-1.0> (accessed Oct 30, 2026).
[^np02-user-get]: Microsoft Learn, "Get a user," permissions and HTTP request, <https://learn.microsoft.com/graph/api/user-get?view=graph-rest-1.0>, and "Get-MgUser," <https://learn.microsoft.com/powershell/module/microsoft.graph.users/get-mguser?view=graph-powershell-1.0> (accessed Oct 30, 2026).
[^np02-perms-ref]: Microsoft Learn, "Microsoft Graph permissions reference," `Application.ReadWrite.All`, <https://learn.microsoft.com/graph/permissions-reference> (accessed Oct 30, 2026).
[^np02-src]: Microsoft, microsoftgraph/microsoft-graph-docs-contrib, `concepts/tutorial-applications-basics.md` at commit `a69303123e9701eecbf56568d152ece936a97f1e` (October 30, 2026; the page last changed July 3, 2026), code MIT License, documentation Creative Commons Attribution 4.0, <https://github.com/microsoftgraph/microsoft-graph-docs-contrib/blob/a69303123e9701eecbf56568d152ece936a97f1e/concepts/tutorial-applications-basics.md> (accessed Oct 30, 2026); pinned copy in `examples/third_party/graph-applications-tutorial-page`.
