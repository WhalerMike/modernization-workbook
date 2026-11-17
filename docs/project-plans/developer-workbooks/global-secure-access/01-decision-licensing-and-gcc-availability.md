---
title: "Chapter 01 — Decision, Licensing and GCC Availability"
description: "The guide's Step 1 as code: read the tenant's licenses and onboarding state with the least-privileged permissions, hold the decision record per function as reviewed JSON, and check it: a dated availability quote, enough licenses, an approver, exit criteria, compensating controls for a deferred function, and no preview feature whose GCC availability is not yet specified without an approved exception, each finding naming the guide's interim path. Labs against a fictional tenant's fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-global-secure-access
part: How
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
last-reviewed: 2026-11-17
---
# Chapter 01 — Decision, Licensing and GCC Availability

*A network control is adopted by a written decision with exit criteria, not by turning on a toggle. The first code reads what the tenant holds and checks the decision against it.*

::: {.callout-note}
## In this chapter
The code behind the guide's [Step 1: Decision and licensing](../../../books/guides/global-secure-access-implementation.md#step-1-decision-and-licensing) and its [GCC and licensing table](../../../books/guides/global-secure-access-implementation.md#availability). You start with what Microsoft Learn gives you: the product-wide GCC statement, the license each function needs, and two Graph reads. Then you read the kit's call list, its copy of the availability table with an interim path for every preview feature, and the decision checks GSA-DEC-01 to -09. Lab 1 runs them on a fictional tenant's pilot and again two weeks later. Lab 2 runs the same reads in a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can read a tenant's licenses and Global Secure Access onboarding state with the least-privileged permissions, keep one decision record per function (Microsoft traffic, internet, private, branch) as reviewed JSON, and show an assessor that each record is current, licensed, approved and honest about GCC.

**Audience.** Developers who build or maintain the kit, the policy owner who signs the decision records, and the ISSO who keeps them. You should read PowerShell 7. You don't need a tenant until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

Learn's known limitations page states, for the whole product, that Global Secure Access is available in the US Government Community Cloud (GCC); no feature page the guide read narrows or widens that, so a preview feature's GCC availability is *not yet specified*.[^gsa01-limits] Learn's overview names the licenses: the Microsoft traffic profile comes with Microsoft Entra ID P1 or P2, while Internet Access and Private Access are licensed separately or through the Microsoft Entra Suite.[^gsa01-overview] Two Graph reads tell you what the tenant holds. `GET /subscribedSkus` (v1.0) lists the subscriptions, with `LicenseAssignment.Read.All` as its least-privileged permission, delegated or application.[^gsa01-skus] `GET /networkAccess/tenantStatus` (beta) returns `onboardingStatus`, with `NetworkAccessPolicy.Read.All` as its least-privileged permission, delegated only.[^gsa01-status] Both are available on the global service, which GCC uses.[^gsa01-deployments]

### What it leaves to you

Each row is pinned by a test in the `Chapter 01` block of `tests/GlobalSecureAccess.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| One sentence on GCC for the whole product | Nothing per feature, and preview features are silent | `config/availability.json`: the guide's table, one row per feature, with `gcc` (`available` or `not yet specified`), the license, the release stage, the step and, for every feature that isn't available, the guide's interim path |
| License names, but no service plan identifiers on the pages read | A script can't match a license by ID | The decision record names the SKU part number the agency reads from its own export; GSA-DEC-04 compares the count with `license_needed` |
| A beta read of the onboarding state | Beta APIs "are subject to change" | The call list marks every beta call; the live reader refuses an app-only session, so the beta API runs interactively, as the guide asks |
| Nothing about the decision itself | The guide's record is YAML in a page | `templates/decision-record.template.json`, read from an inputs folder, and nine checks on it |

**The verdict.** Keep Learn's statements and reads as they are. Build the availability table, the decision record and its checks, because Learn leaves those to the agency.

## The code

### The calls

`config/calls.json` declares every call the kit makes: its method and URI, the least-privileged permission and roles Learn names, the Learn page, whether it is beta, and whether the row was checked against that page. `Get-GsaRequiredPermission -Area decision` prints the two this chapter needs. The guide's Step 1.1 connects with `Organization.Read.All`, a higher-privileged permission Learn also lists for `subscribedSkus`; the kit asks for the least-privileged one. In live mode the reader sends nothing until `Assert-GsaLiveContext` has seen a Microsoft Graph session in the `Global` environment, in the settings' tenant, signed in as a person.

### The availability table

`Get-GsaAvailability -NotAvailable` lists the features whose GCC availability isn't stated, each with its interim path:

| Feature | Stage | Interim path |
|---|---|---|
| Client on Microsoft Entra registered devices | Preview | Joined or hybrid joined devices only |
| Cloud firewall for clients | Preview | Block QUIC (outbound UDP 443) with an Intune-delivered Windows Firewall rule (the guide's Step 5.6) |
| Explicit Forward Proxy | Preview | Client acquisition only; a PAC file excludes everything the client tunnels |
| Source traffic type and HTTP method filtering | Preview | Category and FQDN filtering in security profiles |
| Custom Private Access profiles | Preview | Per-app applications in the one Private Access profile |
| Enriched Microsoft 365 and generative AI log categories | Preview | Not exported without a decision record |
| Intelligent Local Access; AI gateway prompt injection protection | Preview | Not adopted; a Zero Trust Assessment test against them is *not applicable*, with the decision record as exception evidence |

### The decision checks

`Test-GsaDecision` reads the collection and the decision records (`inputs/decisions/*.json`) and returns:

| Check | What it looks for |
|---|---|
| GSA-DEC-01 | `onboardingStatus` is `onboarded` |
| GSA-DEC-02 | One record for each of the four functions |
| GSA-DEC-03 | The availability quote was read within 30 days of the run |
| GSA-DEC-04 | For `adopt` or `coexist`, the named SKU has at least `license_needed` enabled units |
| GSA-DEC-05 | An approver and an approval date |
| GSA-DEC-06 | For `retain-current` or `defer`, at least one compensating control |
| GSA-DEC-07 | Each preview feature used has an approved exception; otherwise the finding's fix is the interim path |
| GSA-DEC-08 | Exit criteria |
| GSA-DEC-09 | A review date within 12 months |

### The tests

Pester 5 under PowerShell 7: the `Calls and availability`, `Settings`, `Collection` and `Chapter 01` blocks of `tests/GlobalSecureAccess.Tests.ps1`.

::: {.callout-important}
## Illustrative code
Lab 1 reads a fictional tenant's fixtures; nothing signs in and nothing leaves the machine. The kit has been tested against fixtures and stand-in runners, not against a live tenant. Review the code, and run Lab 2 in a test tenant, before it reads a real one.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/global-secure-access`. The fixtures are one fictional tenant, `contoso.example`: `tests/fixtures/pilot` on November 16, 2026, during its pilot, and `tests/fixtures/ring1` two weeks later. Each holds the tenant's reads under `tenant/` and the agency's own records under `inputs/`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/global-secure-access`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what the decision area reads
Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1
Get-GsaRequiredPermission -Area decision | Format-Table

# Step 2: List the features GCC doesn't state, with their interim paths
Get-GsaAvailability -NotAvailable | Format-Table id, status, step, interim -Wrap

# Step 3: Read the pilot tenant's licenses and onboarding state
./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -Area decision -OutputPath out/decision -AsOf 2026-11-16T12:00:00Z

# Step 4: Check the four decision records
./Invoke-GsaCheck.ps1 -Area decision -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/decision -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-decision -AsOf 2026-11-16T12:00:00Z

# Step 5: Read the preview finding
Import-Csv out/check-decision/findings.csv | Where-Object Id -EQ 'GSA-DEC-07' | Format-List Object, Detail, Fix

# Step 6: Check the records two weeks later
./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json -FixturePath tests/fixtures/ring1 -Area decision -OutputPath out/decision-ring1 -AsOf 2026-11-30T12:00:00Z
./Invoke-GsaCheck.ps1 -Area decision -SettingsPath tests/fixtures/settings.lab-ring1.json -CollectionPath out/decision-ring1 -InputsPath tests/fixtures/ring1/inputs -OutputPath out/check-decision-ring1 -AsOf 2026-11-30T12:00:00Z

# Step 7: Run this chapter's tests
Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Calls and availability*', 'Settings*', 'Chapter 01*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what the decision area reads.** This is what a reviewer reads before granting anything:

   ```powershell
   Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1
   Get-GsaRequiredPermission -Area decision | Format-Table
   ```

   <!-- capture:begin 01-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/01-1.txt))](captures/01-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1 and what it printed"}

   <!-- capture:end -->

   Two calls: `subscribedSkus` on v1.0 with `LicenseAssignment.Read.All`, and `tenantStatus` on beta with `NetworkAccessPolicy.Read.All`.

2. **List the features GCC doesn't state, with their interim paths:**

   ```powershell
   Get-GsaAvailability -NotAvailable | Format-Table id, status, step, interim -Wrap
   ```

   <!-- capture:begin 01-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/01-2.txt))](captures/01-2.png){.lightbox fig-alt="Terminal window showing Get-GsaAvailability -NotAvailable | Format-Table id, status, step, interim -Wrap and what it printed"}

   <!-- capture:end -->

3. **Read the pilot tenant's licenses and onboarding state:**

   ```powershell
   ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -Area decision -OutputPath out/decision -AsOf 2026-11-16T12:00:00Z
   ```

   <!-- capture:begin 01-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/01-3.txt))](captures/01-3.png){.lightbox fig-alt="Terminal window showing ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -Fixtu… and what it printed"}

   <!-- capture:end -->

   Two calls, each with its permission, and a manifest that hashes every file.

4. **Check the four decision records:**

   ```powershell
   ./Invoke-GsaCheck.ps1 -Area decision -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/decision -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-decision -AsOf 2026-11-16T12:00:00Z
   ```

   <!-- capture:begin 01-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/01-4.txt))](captures/01-4.png){.lightbox fig-alt="Terminal window showing ./Invoke-GsaCheck.ps1 -Area decision -SettingsPath tests/fixtures/settings.la… and what it printed"}

   <!-- capture:end -->

   Four failures. The internet decision's availability quote is 46 days old, its SKU has 25 units for 60 users, and it uses the cloud firewall for clients, a preview feature, without an exception. The branch decision defers remote networks without naming what protects branches meanwhile.

5. **Read the preview finding.** Its fix is the guide's interim path, not "enable the preview":

   ```powershell
   Import-Csv out/check-decision/findings.csv | Where-Object Id -EQ 'GSA-DEC-07' | Format-List Object, Detail, Fix
   ```

   <!-- capture:begin 01-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/01-5.txt))](captures/01-5.png){.lightbox fig-alt="Terminal window showing Import-Csv out/check-decision/findings.csv | Where-Object Id -EQ 'GSA-DEC-07'… and what it printed"}

   <!-- capture:end -->

6. **Check the records two weeks later.** The internet record was re-read on Learn, drops the preview feature, and its SKU now has 75 units; the branch record names its compensating controls:

   ```powershell
   ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json -FixturePath tests/fixtures/ring1 -Area decision -OutputPath out/decision-ring1 -AsOf 2026-11-30T12:00:00Z
   ./Invoke-GsaCheck.ps1 -Area decision -SettingsPath tests/fixtures/settings.lab-ring1.json -CollectionPath out/decision-ring1 -InputsPath tests/fixtures/ring1/inputs -OutputPath out/check-decision-ring1 -AsOf 2026-11-30T12:00:00Z
   ```

   <!-- capture:begin 01-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/01-6.txt))](captures/01-6.png){.lightbox fig-alt="Terminal window showing ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json … and what it printed"}

   <!-- capture:end -->

   Every check passes.

7. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Calls and availability*', 'Settings*', 'Chapter 01*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 01-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/01-7.txt))](captures/01-7.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Calls… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 01-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/01-8.txt))](captures/01-8.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant

Use a test tenant, never production; a tenant with no Global Secure Access licenses is a valid result (GSA-DEC-04 fails, which is the point). Work in `examples/global-secure-access`, in PowerShell 7 with the Microsoft Graph PowerShell SDK. **The authors haven't run this lab**; each expected result is what the guide or the Learn page it cites says. You'll replace: `<tenant-id>` (the test tenant), `<settings-file>` (your copy of `deploy/settings.template.json` with `environment` `test` and every placeholder filled) and `<inputs-folder>` (a folder with your own decision records, from `templates/decision-record.template.json`, kept on agency storage, never in this repository).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/global-secure-access`. Each step below says what it does and what to look for.

```powershell
# Step 1: Sign in as a person with the two least-privileged permissions
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes "LicenseAssignment.Read.All","NetworkAccessPolicy.Read.All"

# Step 2: Run the guide's own reads, as a cross-check
Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits, @{n="Enabled";e={$_.PrepaidUnits.Enabled}} | Format-Table
Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/tenantStatus"

# Step 3: Collect and check with the kit
./Invoke-GsaCollect.ps1 -SettingsPath <settings-file> -Area decision -OutputPath out/decision-test
./Invoke-GsaCheck.ps1 -Area decision -SettingsPath <settings-file> -CollectionPath out/decision-test -InputsPath <inputs-folder> -OutputPath out/check-decision-test

# Step 4: Back it out
Disconnect-MgGraph
Remove-Item -Recurse -Force out/decision-test, out/check-decision-test
```

:::

<!-- labs:end -->

1. **Sign in as a person with the two least-privileged permissions,** with a role that can read them (Global Reader is enough for both):

   ```powershell
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes "LicenseAssignment.Read.All","NetworkAccessPolicy.Read.All"
   ```

2. **Run the guide's own reads, as a cross-check:**

   ```powershell
   Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits, @{n="Enabled";e={$_.PrepaidUnits.Enabled}} | Format-Table
   Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/beta/networkAccess/tenantStatus"
   ```

3. **Collect and check with the kit:**

   ```powershell
   ./Invoke-GsaCollect.ps1 -SettingsPath <settings-file> -Area decision -OutputPath out/decision-test
   ./Invoke-GsaCheck.ps1 -Area decision -SettingsPath <settings-file> -CollectionPath out/decision-test -InputsPath <inputs-folder> -OutputPath out/check-decision-test
   ```

   The kit's SKU counts match step 2's. If `onboardingStatus` isn't `onboarded`, onboard the tenant in the admin center before any later chapter.

4. **Back it out.** The lab only reads; sign out and delete what it wrote, or move it to the evidence store if the ISSO keeps it:

   ```powershell
   Disconnect-MgGraph
   Remove-Item -Recurse -Force out/decision-test, out/check-decision-test
   ```

## Verified facts

| Item | Value | GCC | Stage | Source |
|---|---|---|---|---|
| Product availability | "available in the US Government Community Cloud (GCC)", product-wide | Available | — | [^gsa01-limits] |
| Licenses | Microsoft traffic with Entra ID P1 or P2; Internet Access, Private Access, or the Entra Suite | — | — | [^gsa01-overview] |
| `GET /subscribedSkus` | `LicenseAssignment.Read.All`, delegated and application; Global Reader, Directory Readers | Global service | v1.0 | [^gsa01-skus] |
| `GET /networkAccess/tenantStatus` | `NetworkAccessPolicy.Read.All`, delegated only; Global Reader, Global Secure Access Log Reader | Global service | Beta | [^gsa01-status] |
| GCC endpoints | `graph.microsoft.com`, `login.microsoftonline.com` | — | — | [^gsa01-deployments] |
| Beta | "subject to change"; not supported in production applications | — | Beta | [^gsa01-beta] |

Where Learn's pages differ: the guide's Step 1.1 connects with `Organization.Read.All` and `NetworkAccess.Read.All`; Learn's own permission tables name `LicenseAssignment.Read.All` and `NetworkAccessPolicy.Read.All` as least privileged for these two reads. The kit follows Learn's tables (research gap 1).

## Federal requirements and evidence

The decision record is what the guide's [Step 1](../../../books/guides/global-secure-access-implementation.md#step-1-decision-and-licensing) asks the agency to keep. The mappings are the kit's [`config/requirements.json`](https://github.com/WhalerMike/modernization-workbook/blob/main/examples/global-secure-access/config/requirements.json), taken from the guide's [requirements table](../../../books/guides/global-secure-access-implementation.md#requirements).

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The tenant's licenses and onboarding state, read with the least-privileged permissions and hashed (Lab 1, step 3; Lab 2, step 3: `raw/`, `manifest.json`) | PL-2 (system security plan), SA-9 (external system services) | Not mapped: the guide maps no indicator to a decision record | The ISSO, with the decision records |
| Each function's decision is current, licensed, approved, with exit criteria and compensating controls (Lab 1, steps 4 to 6: `findings.json`) | PL-2; SA-9; CA-3 (information exchange); TIC 3.0 use case selection | Not mapped | The policy owner signs; the ISSO keeps |
| A preview feature without a stated GCC availability is used only with an approved exception, or not at all (Lab 1, step 5) | SA-9 | Not mapped | The policy owner |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its own evidence up with what its providers report and doesn't report KSIs itself ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). The kit's records support these controls; the agency's assessor decides them.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A preview feature adopted because the product is "available in GCC" | A control rests on a feature whose GCC availability nobody stated | GSA-DEC-07 fails it and names the interim path |
| An availability quote from months ago | Learn's GCC sentence changed and nobody noticed | GSA-DEC-03 fails a quote older than 30 days; the Provider Notices guide routes Learn changes |
| Reading licenses with `Directory.Read.All` | A reader that can see far more than it needs | `config/calls.json` names the least-privileged permission; the manifest records what was used |
| A deferred function with no protection | Branch users fall outside every policy point | GSA-DEC-06 |
| Beta reads in an unattended job | A silent API change breaks the evidence | The live reader refuses an app-only Graph session |

## Checklist

- [ ] One decision record per function, from the template, on agency storage.
- [ ] Each record's availability quote is dated within 30 days, with Learn's sentence as written.
- [ ] Licenses cover the pilot and the first ring for every adopted function.
- [ ] No preview feature is used without an approved exception; the interim path is in place instead.
- [ ] A deferred or retained function names its compensating controls.
- [ ] The reader signed in with `LicenseAssignment.Read.All` and `NetworkAccessPolicy.Read.All`, and nothing broader.

::: {.callout-tip}
## Continue the book
[Workbook index](index.md) · [Next: Chapter 02 — The Configuration Export and Logs First →](02-configuration-export-and-logs-first.md)
:::

[^gsa01-limits]: Microsoft Learn, "Known limitations for Global Secure Access," Global Secure Access in Government Cloud, <https://learn.microsoft.com/entra/global-secure-access/reference-current-known-limitations> (read November 11, 2026, for the guide; its verification log).
[^gsa01-overview]: Microsoft Learn, "What is Global Secure Access?," licensing overview, <https://learn.microsoft.com/entra/global-secure-access/overview-what-is-global-secure-access> (read November 11, 2026, for the guide).
[^gsa01-skus]: Microsoft Learn, "List subscribedSkus" (Microsoft Graph v1.0), permissions and national cloud table, <https://learn.microsoft.com/graph/api/subscribedsku-list?view=graph-rest-1.0> (accessed November 17, 2026).
[^gsa01-status]: Microsoft Learn, "Get tenantStatus" (Microsoft Graph beta), permissions, roles and national cloud table, <https://learn.microsoft.com/graph/api/networkaccess-tenantstatus-get?view=graph-rest-beta> (accessed November 17, 2026).
[^gsa01-deployments]: Microsoft Learn, "Microsoft Graph national cloud deployments," <https://learn.microsoft.com/graph/deployments> (read for the program's other workbooks; carried).
[^gsa01-beta]: Microsoft Learn, the beta notice on each Microsoft Graph beta page, for example "Get tenantStatus," <https://learn.microsoft.com/graph/api/networkaccess-tenantstatus-get?view=graph-rest-beta> (accessed November 17, 2026).
