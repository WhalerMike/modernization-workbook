---
title: "Module 1: Inventory every non-person identity"
description: "Gate G1 and workbook Chapter 01: read every AD service account, MSA, gMSA, dMSA, app registration, service principal and managed identity into one register with a risk and a candidate target, see the reader refuse a call it doesn't declare, and hand SQL Server accounts to the Data Platform plan. About 55 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Books 02, 04"
series-order: 1
review-status: approved
reviewed-sha256: dc10fd1aa572447d64b1d7a14c6d99556cbc303cb0457fdf03da01e75330c58e
last-reviewed: 2026-11-25
---
# Module 1: Inventory every non-person identity {.unnumbered}

*Part of the [Non-Person Identity learning path](index.md). Gate G1 Inventory. Workbook [Chapter 01](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md). About 55 minutes.*

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.5/Training_NPI_Module_1.pptx) · [▶ Watch](../../presentations/watch.html?v=Training_NPI_Module_1_Narrated) (about 14 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_NPI_Module_1_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-1/Training_NPI_Module_1_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-npi-module-1/Training_NPI_Module_1_Narrated.vtt).

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
- The guide's [validation kit](../../books/guides/non-person-identity-implementation.md#how-to-read-this-guide) table: G1 is proved by VK-NPI-01, 06, 07 and 08, and, for the AWS GovCloud (US) and OCI identities, VK-NPI-10.

![What the inventory reads in Microsoft Entra, from Book 04, Chapter 05: an application object is the template for a service principal in each tenant that uses the app, managed identities are service principals without an application object, and governance attaches to both.](../../images/diagrams/b04-access/svg/ch05-app-object-model.svg){#fig-ch05-app-object-model fig-alt="A left-to-right diagram. On the left, a violet governance card lists a registry owner and two technical people on the Entra Owners list, an app management policy on credentials, and audit-log consent and credential events; arrows go from it to two blue cards. The first blue card, labeled App registrations, is the application object: one per application in its home tenant, holding credentials, redirect URIs, app roles and requested API permissions. An arrow labeled template for leads to the second blue card, labeled Enterprise applications: the service principal, one per tenant that uses the app, holding consent grants, app role assignments, user and group assignment, and acting as the Conditional Access target. A dashed arrow labeled multitenant only leads from the application object to a slate card for service principals created in other tenants when an admin or user consents. A green card for a managed identity, a service principal with no application object whose credential Azure manages, has a dashed arrow labeled is a kind of pointing to the service principal card."}

## Unit 2: The register as code (12 minutes)

Read the workbook chapter in this order:

- [What the register has to hold](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#what-the-register-has-to-hold): two AD collections, nine Graph collections and one Resource Manager one.
- [The reader](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#the-reader): its five rules, and why `Directory.Read.All` is held only to list delegated grants.
- [Risk, targets, stale leads and the hand-off](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#risk-targets-stale-leads-and-the-hand-off): the program's rule *(design guidance)*.
- [The findings](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#the-findings): NPI-INV-01 to -09.

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This is the workbook's [Chapter 01, Lab 1](../../project-plans/developer-workbooks/non-person-identity/01-non-person-identity-inventory-as-code.md#lab-1-fixtures-no-tenant), which explains each result. The estate is fictional.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\non-person-identity-code\non-person-identity

$Run = "C:\FMWLabs\results\non-person-identity-01-inventory\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Run Learn's samples against the stand-ins
Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 -FullNameFilter '*Chapter 01*' -Output None -PassThru |
    Select-Object PassedCount, FailedCount, NotRunCount

# Step 2: List what the inventory needs
Import-Module ./powershell/NpiInventory/NpiInventory.psm1
$p = Get-NpiRequiredPermission -Task inventory
$p.GraphPermissions -join ', '; $p.AzureRoles -join ', '; $p.AdRights -join ', '

# Step 3: Run the inventory against the fictional estate
./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath "$Run\inventory"

# Step 4: Read the HIGH-risk identities
Get-Content "$Run\inventory\findings.json" -Raw | ConvertFrom-Json | Where-Object Rule -eq 'NPI-INV-01' | Format-Table Object, Issue -Wrap

# Step 5: See the reader refuse
$r = New-NpiReader -Cloud gcc -Task inventory -Invoke (New-NpiFixtureInvoker -Path tests/fixtures/estate.json).Invoke
try { Invoke-NpiList -Reader $r -CallId graph-user -Bind @{ id = 'x' } } catch { $_.Exception.Message }
try { Get-NpiCloud GCC } catch { $_.Exception.Message }

# Step 6: Read the hand-off to the Data Platform plan
Import-Csv "$Run\inventory\data-platform-handoff.csv" | Format-Table Name, Type, Spns, Risk

# Step 7: Run the tests
Invoke-Pester -Path tests

# After the steps
Get-ChildItem C:\FMWLabs\results\non-person-identity-01-inventory\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\non-person-identity-code\non-person-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\non-person-identity-01-inventory\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\non-person-identity-01-inventory\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, which stay the same, so every run's results match this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Every step is PowerShell 7: type `pwsh` to start it, then run the two blocks above. In a clone of the repository, use the `examples` folder of the same name.

1. **Run Learn's samples against the stand-ins:**

    ```powershell
    Invoke-Pester -Path tests/MicrosoftSamples.Tests.ps1 -FullNameFilter '*Chapter 01*' -Output None -PassThru |
        Select-Object PassedCount, FailedCount, NotRunCount
    ```

    Expected output:

    ```text
    PassedCount FailedCount NotRunCount
    ----------- ----------- -----------
             20           0          10
    ```

    The ten not run are Chapter 02's.

2. **List what the inventory needs:**

    ```powershell
    Import-Module ./powershell/NpiInventory/NpiInventory.psm1
    $p = Get-NpiRequiredPermission -Task inventory
    $p.GraphPermissions -join ', '; $p.AzureRoles -join ', '; $p.AdRights -join ', '
    ```

    Expected output:

    ```text
    Application.Read.All, Directory.Read.All
    Reader
    Read (default for authenticated domain users)
    ```

    Nothing ends in `ReadWrite`.

3. **Run the inventory against the fictional estate:**

    ```powershell
    ./Invoke-NpiInventory.ps1 -Cloud gcc -FixturePath tests/fixtures/estate.json -OutputPath "$Run\inventory"
    ```

    Expected output:

    ```text
    Register: 35 identities (AD 15, Entra 20); risk HIGH 8, LOW 19, MEDIUM 8
    Findings: 8 Finding, 11 Warn, 3 Info; 3 handed to the Data Platform plan
    Written to C:\FMWLabs\results\non-person-identity-01-inventory\lab1\<run>\inventory (manifest.json: tenant c0ffee00-0000-4000-8000-000000000001, every request, a SHA-256 per file)
    ```

4. **Read the HIGH-risk identities:**

    ```powershell
    Get-Content "$Run\inventory\findings.json" -Raw | ConvertFrom-Json | Where-Object Rule -eq 'NPI-INV-01' | Format-Table Object, Issue -Wrap
    ```

    Expected output, eight rows:

    ```text
    Object                            Issue
    ------                            -----
    svc-hrsync (Traditional)          HIGH risk: password never expires; password not changed in 2800 days. Candidate:
                                      gMSA, or a dMSA on a Windows Server 2025 domain (Kerberos service)
    svc-sqlprod (Traditional)         HIGH risk: password never expires; password not changed in 1968 days. Candidate:
                                      Data Platform plan (SPN MSSQLSvc/sql01.corp.contoso.example:1433): gMSA, or a dMSA
                                      on a Windows Server 2025 domain (Kerberos service)
    svc-backup (Traditional)          HIGH risk: member of Backup Operators. Candidate: Managed identity if the workload
                                      runs in Azure; otherwise an app registration with a federated credential or
                                      certificate
    svc-oldftp (Traditional)          HIGH risk: password never expires; password not changed in 3215 days. Candidate:
                                      Verify use first (stale lead); retirement candidate if unused
    jdoe (Traditional)                HIGH risk: password never expires. Candidate: Managed identity if the workload runs
                                      in Azure; otherwise an app registration with a federated credential or certificate
    svc-webfront (Traditional)        HIGH risk: trusted for unconstrained delegation. Candidate: gMSA, or a dMSA on a
                                      Windows Server 2025 domain (Kerberos service)
    gmsa-ops$ (gMSA)                  HIGH risk: member of Domain Admins. Candidate: Keep for on-premises Kerberos;
                                      workload identity federation or a managed identity when the workload moves
    Mail Automation (AppRegistration) HIGH risk: holds Directory.ReadWrite.All. Candidate: Replace the client secret:
                                      managed identity, then federated credential, then certificate
    ```

    `jdoe` was found only by a password that never expires, so it may be a person.

5. **See the reader refuse.** Each refusal is an error; `try` and `catch` print its message and keep the window going:

    ```powershell
    $r = New-NpiReader -Cloud gcc -Task inventory -Invoke (New-NpiFixtureInvoker -Path tests/fixtures/estate.json).Invoke
    try { Invoke-NpiList -Reader $r -CallId graph-user -Bind @{ id = 'x' } } catch { $_.Exception.Message }
    try { Get-NpiCloud GCC } catch { $_.Exception.Message }
    ```

    Expected output:

    ```text
    Undeclared call 'graph-user' for task 'inventory'; add it to config/calls.json with its permission.
    Unknown cloud 'GCC'. Use global or gcc.
    ```

6. **Read the hand-off to the Data Platform plan:**

    ```powershell
    Import-Csv "$Run\inventory\data-platform-handoff.csv" | Format-Table Name, Type, Spns, Risk
    ```

    Expected output:

    ```text
    Name         Type        Spns                                     Risk
    ----         ----        ----                                     ----
    svc-sqlprod  Traditional MSSQLSvc/sql01.corp.contoso.example:1433 HIGH
    svc-ldapbind Traditional                                          MEDIUM
    gmsa-sql$    gMSA        MSSQLSvc/sql02.corp.contoso.example:1433 MEDIUM
    ```

    `svc-sqlprod` and `gmsa-sql$` are there by their `MSSQLSvc/` SPNs, and `svc-ldapbind` by name.

7. **Run the tests:**

    ```powershell
    Invoke-Pester -Path tests
    ```

    It prints a line for each test file, with the time it took, then this last line:

    ```text
    Tests Passed: 554, Failed: 0, Skipped: 0, Inconclusive: 0, NotRun: 0
    ```

Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\non-person-identity-01-inventory\lab1 -Name
```

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
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
