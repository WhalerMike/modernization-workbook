---
title: "Module 1: Inventory every non-person identity"
description: "Gate G1 and workbook Chapter 01: read every AD service account, MSA, gMSA, dMSA, app registration, service principal and managed identity into one register with a risk and a candidate target, see the reader refuse a call it doesn't declare, and hand SQL Server accounts to the Data Platform plan. About 55 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04"
series-order: 1
review-status: approved
reviewed-sha256: e397092ed3a2eb4967961309b34ef9aee52322cc2ea87b72c70d2900cbc6b171
last-reviewed: 2026-11-08
---
# Module 1: Inventory every non-person identity {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). Gate G1 Inventory. Workbook [Chapter 01](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md). About 55 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.4/Training_NPI_Module_1.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_1_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_1_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-1/Training_NPI_Module_1_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-1/Training_NPI_Module_1_Narrated.vtt).

**Also:** the chapter's narrated tour, about 11 minutes: [▶ Watch](../../presentations/watch.html?v=DW_NPI_01_Inventory_as_Code_Narrated).

## Introduction (3 minutes)

Consent creates service principals, and Microsoft's own services create more. So the inventory is always larger than the list of apps anyone asked for. No attribute marks an Active Directory user as a service account, either: Learn finds candidates by an SPN, trust for delegation and a password that never expires, and warns that this might not find them all.

In this module you read every non-person identity into one register, with its type, owners, credentials, risk and candidate target. You decide nothing yet. Inventory first; decide later.

**The federal requirement.** Gate G1 supports NIST SP 800-53 AC-2, IA-4 and CM-8. The gate's output is evidence for these controls; your organization still sets their parameters, policy and procedures, and the assessor decides whether each is satisfied. The guide's [Validate (G1 Inventory)](../../books/guides/non-person-identity-implementation.md#step-1-inventory-every-non-person-identity) step names them, and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#federal-requirements-and-evidence) table has a row for every lab step.

| Requirement | KSI | Evidence |
|---|---|---|
| CM-8 System Component Inventory | KSI-PIY-GIV | `register.json` and `register.csv`; `data-platform-handoff.csv` |
| AC-2 Account Management; IA-4 Identifier Management | KSI-IAM-SNU (AC-2); KSI-IAM-ELP, KSI-IAM-JIT (IA-4) | `register.csv` columns `IdentityId`, `Type`, `OwnerCount`, `OwnerIds` |
| AC-6(5) Privileged Accounts; IA-5 Authenticator Management | KSI-IAM-SNU, KSI-IAM-JIT | `findings.json`, NPI-INV-01 (HIGH risk) |
| AC-6 Least Privilege, for the reading process | KSI-IAM-ELP, KSI-IAM-JIT | `Get-NpiRequiredPermission -Task inventory`; `config/calls.json` |
| AU-9 and SI-7, the run's integrity | KSI-MLA-OSM (AU-9); KSI-SVC-VRI (SI-7) | `manifest.json`: tenant, every request, a SHA-256 per file |

KSIs are FedRAMP 20x indicators for cloud service providers. The agency lines this evidence up with what its providers report against them; it doesn't report KSIs itself. Which file supports which indicator is the program's mapping *(design guidance)*. The guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) section explains both.

## Learning objectives (1 minute)

After this module, you'll be able to:

- name the identity types the register holds, and where each is read from;
- explain the program's HIGH, MEDIUM and LOW risk rule, and why a stale account is only a lead;
- run the inventory against the fixtures and read its HIGH-risk findings;
- show that the reader refuses a call the task doesn't declare and a cloud it doesn't know.

## Prerequisites (1 minute)

- The guide's [track at a glance](../../books/guides/non-person-identity-implementation.md#the-track-at-a-glance): the system inventory or CMDB, not HR, is this track's source of truth.
- [Microsoft Automation, Module 1: permissions](../ms-automation-foundations.md#permissions).

## Unit 1: What the gate asks for (8 minutes)

Read the guide's [Step 1](../../books/guides/non-person-identity-implementation.md#step-1-inventory-every-non-person-identity): six sub-steps, from AD service accounts (1a) to joining each identity to its record (1f). Then read:

- The guide's [record each identity joins to](../../books/guides/non-person-identity-implementation.md#the-record-each-identity-joins-to): the fields every record carries.
- The guide's [validation kit](../../books/guides/non-person-identity-implementation.md#how-to-read-this-guide) table: G1 is proved by VK-NPI-01, 06, 07 and 08.

## Unit 2: The register as code (12 minutes)

Read the workbook chapter in this order:

- [What the register has to hold](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#what-the-register-has-to-hold): two AD collections, nine Graph collections and one Resource Manager one.
- [The reader](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#the-reader): its five rules, and why `Directory.Read.All` is held only to list delegated grants.
- [Risk, targets, stale leads and the hand-off](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#risk-targets-stale-leads-and-the-hand-off): the program's rule *(design guidance)*.
- [The findings](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#the-findings): NPI-INV-01 to -09.

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This is the workbook's [Chapter 01, Lab 1](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#lab-1-fixtures-no-tenant), which explains each result. Work in `examples/non-person-identity`, in PowerShell 7. The estate is fictional.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/non-person-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Run Learn's samples against the stand-ins
Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 -FullNameFilter '*Chapter 01*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 2: List what the inventory needs
Import-Module ./powershell/NpiInventory/NpiInventory.psm1
$p = Get-NpiRequiredPermission -Task inventory
$p.GraphPermissions -join ', '; $p.AzureRoles -join ', '; $p.AdRights -join ', '

# Step 3: Run the inventory against the fictional estate
./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory

# Step 4: Read the HIGH-risk identities
Get-Content out/inventory/findings.json -Raw | ConvertFrom-Json | Where-Object Rule -eq 'NPI-INV-01' | Format-Table Object, Issue -Wrap

# Step 5: See the reader refuse
$r = New-NpiReader -Cloud gcc -Task inventory -Invoke (New-NpiFixtureInvoker -Path tests/fixtures/estate.json).Invoke
Invoke-NpiList -Reader $r -CallId graph-user -Bind @{ id = 'x' }
Get-NpiCloud GCC

# Step 6: Read the hand-off to the Data Platform plan
Import-Csv out/inventory/data-platform-handoff.csv | Format-Table Name, Type, Spns, Risk

# Step 7: Run the tests
Invoke-Pester -Path tests

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Run Learn's samples against the stand-ins:**

    ```powershell
    Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 -FullNameFilter '*Chapter 01*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expect `PassedCount 20`, `FailedCount 0`, `NotRunCount 10`. The ten not run are Chapter 02's.

2. **List what the inventory needs:**

    ```powershell
    Import-Module ./powershell/NpiInventory/NpiInventory.psm1
    $p = Get-NpiRequiredPermission -Task inventory
    $p.GraphPermissions -join ', '; $p.AzureRoles -join ', '; $p.AdRights -join ', '
    ```

    ```text
    Application.Read.All, Directory.Read.All
    Reader
    Read (default for authenticated domain users)
    ```

    Nothing ends in `ReadWrite`.

3. **Run the inventory against the fictional estate:**

    ```powershell
    ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath out/inventory
    ```

    ```text
    Register: 35 identities (AD 15, Entra 20); risk HIGH 8, LOW 19, MEDIUM 8
    Findings: 8 Finding, 11 Warn, 3 Info; 3 handed to the Data Platform plan
    Written to out/inventory (manifest.json: tenant c0ffee00-0000-4000-8000-000000000001, every request, a SHA-256 per file)
    ```

4. **Read the HIGH-risk identities:**

    ```powershell
    Get-Content out/inventory/findings.json -Raw | ConvertFrom-Json | Where-Object Rule -eq 'NPI-INV-01' | Format-Table Object, Issue -Wrap
    ```

    Expect eight rows: `svc-hrsync`, `svc-sqlprod`, `svc-backup`, `svc-oldftp`, `jdoe`, `svc-webfront`, `gmsa-ops$` and the Mail Automation app registration. `jdoe` was found only by a password that never expires, so it may be a person.

5. **See the reader refuse:**

    ```powershell
    $r = New-NpiReader -Cloud gcc -Task inventory -Invoke (New-NpiFixtureInvoker -Path tests/fixtures/estate.json).Invoke
    Invoke-NpiList -Reader $r -CallId graph-user -Bind @{ id = 'x' }
    Get-NpiCloud GCC
    ```

    Expect two errors: `Undeclared call 'graph-user' for task 'inventory'; add it to config/calls.json with its permission.` and `Unknown cloud 'GCC'. Use global, gcc, gcchigh or dod.`

6. **Read the hand-off to the Data Platform plan:**

    ```powershell
    Import-Csv out/inventory/data-platform-handoff.csv | Format-Table Name, Type, Spns, Risk
    ```

    Expect `svc-sqlprod` and `gmsa-sql$`, by their `MSSQLSvc/` SPNs, and `svc-ldapbind`, by name.

7. **Run the tests:**

    ```powershell
    Invoke-Pester -Path tests
    ```

    Expect 513 tests passed, 0 failed.

Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Chapter 01, Lab 2](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#lab-2-test-tenant). It has the exact commands.

- **You need:** a test tenant in the worldwide or GCC cloud with a test Azure subscription, and a test Active Directory domain, never production, with fictional people.
- **What you do:** register a reader app with a certificate, grant it `Application.Read.All`, `Directory.Read.All` and Reader on one resource group, run the inventory live, and compare the register with the admin center's lists.
- **Back-out:** step 8 removes the Reader assignment and the two permissions, deletes the app registration and its certificate, and deletes `out/inventory-test`.

## Knowledge check (5 minutes)

1. Why does the inventory hold `Directory.Read.All`?
    a. To read users' passwords
    b. Because Learn's least-privileged permission for listing delegated permission grants is `Directory.Read.All`
    c. To read service principal sign-in activity
    d. Because `Application.Read.All` can't list app registrations
2. An enabled AD account has had no logon for 90 days. What does the code do?
    a. Disables it
    b. Moves it to a holding OU
    c. Raises a stale lead (NPI-INV-02) to confirm against domain controller and Entra sign-in logs, and changes nothing
    d. Deletes it after 30 days
3. `jdoe` is HIGH risk and also carries NPI-INV-08. Why does that matter?
    a. It was found only by a password that never expires, so it may be a person, not a service account
    b. It's a gMSA
    c. It holds a client secret
    d. It belongs to another tenant
4. Which accounts go to the Data Platform plan?
    a. Every gMSA
    b. Accounts with an `MSSQLSvc/` SPN, or names that match the program's SQL Server and LDAP-bind patterns
    c. Every HIGH-risk account
    d. Managed identities
5. Which KSI does the guide's evidence table align with CM-8 System Component Inventory?
    a. KSI-IAM-JIT
    b. KSI-PIY-GIV
    c. KSI-MLA-EVC
    d. KSI-SVC-ASM

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** It's the broadest read the inventory holds, and the only reason it holds it. Taught in [The reader](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#the-reader).
2. **c.** A stale account is a lead only, and the code never disables, moves or deletes anything. Taught in [Risk, targets, stale leads and the hand-off](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#risk-targets-stale-leads-and-the-hand-off).
3. **a.** Learn's criteria can find people too. Taught in [The findings](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#the-findings) and the chapter's [Dangers](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#dangers).
4. **b.** The plan's task NP0.4. Taught in [Risk, targets, stale leads and the hand-off](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#risk-targets-stale-leads-and-the-hand-off).
5. **b.** Taught in the guide's [Evidence](../../books/guides/non-person-identity-implementation.md#evidence) table.
:::

## Summary (2 minutes)

You read a fictional estate of 35 identities into one register, found the eight HIGH-risk ones, saw the reader refuse an undeclared call, and handed three SQL Server and LDAP-bind accounts to the Data Platform plan.

**The evidence an ISSO keeps** for G1 from this module: `register.json`, `register.csv`, `findings.json`, `data-platform-handoff.csv` and the `manifest.json` that hashes them, dated; the permission list from step 2; and the test result. Before shipping, work through the chapter's [Checklist](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#checklist).

**Next:** [Module 2: Owners, sponsors and the orphan rule](02-owners-and-the-orphan-rule.md).
