---
title: "Chapter 02 — The Baseline Export"
description: "Book 20, Chapter 12's configuration baseline as code: one export that runs every declared read, one shell at a time (Security & Compliance PowerShell, Exchange Online PowerShell, then the AIPService module), checks the session's tenant before it reads, writes Chapter 12's file names into a dated snapshot folder, lists each read and each skipped optional read in a manifest, and reads a fixture tenant through the same code path for the labs. Read cmdlets only."
doc-type: workbook-chapter
audience: [Technical]
family: dw-information-protection
part: How
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: adbae6e5c20d44eea7a2a8b7b20a3db5feaf50cffafcebdb78ba096ef622318b
last-reviewed: 2026-11-25
---
# Chapter 02 — The Baseline Export

*Every later check reads a file, not the tenant. The export is the one place the kit touches Purview, so it reads only, reads the right tenant, and says what it read.*

::: {.callout-note}
## In this chapter
The code behind the baseline export in the guide's [G12 Operations and evidence](../../../books/guides/information-protection-implementation.md#step-12-operations-and-evidence). [Book 20, Chapter 12](../../../books/b20-information-protection/12-operations-and-evidence.md#the-configuration-baseline) gives three blocks of commands that write nine JSON files. You read how `Export-IpBaseline` turns them into one export with a tenant check, seven more reads the later chapters need, and a manifest. Lab 1 lists the reads and exports a fixture tenant; Lab 2 exports a test tenant.
:::

## Goal and audience

For the developer who owns the export and the operator who schedules it. By the end you can say which files a snapshot holds, which shell each came from, which optional reads were skipped and why, and that the snapshot came from the tenant the settings name.

## Start with Book 20's commands

### What Book 20 gives you

Chapter 12's three blocks connect to Security & Compliance PowerShell and export `labels.json`, `label-policies.json`, `autolabel-policies.json`, `autolabel-rules.json`, `dlp-policies.json` and `dlp-rules.json`; connect to Exchange Online PowerShell for `irm-configuration.json` and `audit-status.json`; and connect to the AIPService module for `aipservice-configuration.json`. Audit status is read in Exchange Online PowerShell because in Security & Compliance PowerShell `UnifiedAuditLogIngestionEnabled` always reads `False`.[^ip02-audit] `Get-AipServiceConfiguration` is the only way to see the super user state: "You must use PowerShell to see a full list of protection configuration values."[^ip02-aip]

### What it leaves to you

- **Which tenant answered.** The blocks connect and read; nothing checks the tenant.
- **The reads the checks need beyond the nine:** the sensitive information type catalog, the policy configuration (co-authoring), audit retention policies, role group members, mail flow rules, the message encryption configuration and, optionally, content explorer counts.
- **One shell at a time.** Chapter 12 disconnects between blocks; the export does the same, in the same order.
- **A record of the export.** Which reads ran, how many items each returned, which optional reads were off.

## The code

### Runners

The export calls cmdlets through a *runner*, so the same code reads a tenant or a fixture:

- `New-IpLiveRunner` connects with `Connect-IPPSSession`, `Connect-ExchangeOnline -ShowBanner:$false` or `Connect-AipService`, delegated with the settings' `adminUpn`, or app-only with a certificate (`settings.app`) for the two Exchange module shells. After each Exchange module connection it calls `Get-ConnectionInformation` and stops if the connected session's `TenantID` isn't the settings' `tenantId`: "Nothing was read." It disconnects with `Disconnect-ExchangeOnline -Confirm:$false` or `Disconnect-AipService`. The Rights Management read runs delegated only; Learn's `Connect-AipService` page doesn't settle certificate sign-in clearly (Verified facts).
- `New-IpFixtureRunner` reads `tests/fixtures/tenant/<cmdlet>.json` instead, and logs each connect, read and disconnect, so a test can show the shells run one at a time.

### The export

`Export-IpBaseline` runs every read in `config/calls.json` for one shell, disconnects, and moves to the next: `scc`, then `exo`, then `aip`. Two reads expand:

- **Role group members** run `Get-RoleGroupMember -Identity` for each role group the role register names.
- **Content explorer counts** run `Export-ContentExplorerData` for each sensitive information type the class register names that is in the catalog the export has just read, in each workload (`EXO`, `ODB`, `SharePoint`), and keep `TotalCount`.[^ip02-ce] A type the tenant doesn't have isn't sent; Chapter 03 reports it.

The snapshot folder gets one JSON file per read and a `manifest.json` with the tenant, cloud, mode, each read's status and count, and every file's SHA-256.

### The tests

`tests/Kit.Tests.ps1`, tag `ch02`: the export connects one shell at a time and disconnects each; writes every declared file and the tenant in the manifest; reads the same items as the committed November snapshot; counts only types the tenant has; and skips an optional read the settings turn off, saying so.

::: {.callout-warning}
## Illustrative code
Lab 1 reads a fictional fixture tenant. The fixtures' property names follow the cmdlets' parameter names on Learn, which doesn't list the cmdlets' output properties; Lab 2 is where a real export shows the real names. The kit hasn't been run against a production tenant.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/information-protection`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/information-protection`. Each step below says what it does and what to look for.

```powershell
# Step 1: List every read, its shell and its role, without connecting
./Export-IpBaseline.ps1 -SettingsPath tests/fixtures/settings.lab.json -ListOnly

# Step 2: Export the fixture tenant
./Export-IpBaseline.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/tenant -OutputPath out/snapshot -AsOf 2026-11-24T08:00:00Z

# Step 3: Read the manifest's record of the reads
(Get-Content out/snapshot/manifest.json | ConvertFrom-Json).reads | Format-Table shell, cmdlet, status, count -AutoSize

# Step 4: Run the chapter's tests
Invoke-Pester -Path tests/Kit.Tests.ps1 -TagFilter ch02 -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List every read, its shell and its role, without connecting:**

   ```powershell
   ./Export-IpBaseline.ps1 -SettingsPath tests/fixtures/settings.lab.json -ListOnly
   ```

   <!-- capture:begin 02-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/02-1.txt))](captures/02-1.png){.lightbox fig-alt="Terminal window showing ./Export-IpBaseline.ps1 -SettingsPath tests/fixtures/settings.lab.json -ListOnly and what it printed"}

   <!-- capture:end -->

   Sixteen reads, in the order the export runs them. The roles are where least privilege starts; the agency confirms them.

2. **Export the fixture tenant:**

   ```powershell
   ./Export-IpBaseline.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/tenant -OutputPath out/snapshot -AsOf 2026-11-24T08:00:00Z
   ```

   <!-- capture:begin 02-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/02-2.txt))](captures/02-2.png){.lightbox fig-alt="Terminal window showing ./Export-IpBaseline.ps1 -SettingsPath tests/fixtures/settings.lab.json -Fixtu… and what it printed"}

   <!-- capture:end -->

   One line per read, Security & Compliance first, then Exchange Online, then Rights Management. Nine labels, four DLP policies, nine content counts (three types the tenant has, in three workloads).

3. **Read the manifest's record of the reads:**

   ```powershell
   (Get-Content out/snapshot/manifest.json | ConvertFrom-Json).reads | Format-Table shell, cmdlet, status, count -AutoSize
   ```

   <!-- capture:begin 02-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/02-3.txt))](captures/02-3.png){.lightbox fig-alt="Terminal window showing (Get-Content out/snapshot/manifest.json | ConvertFrom-Json).reads | Format-Ta… and what it printed"}

   <!-- capture:end -->

   Every read says `read`. With `reads.rightsManagement` off, the last line would say `skipped`, and the file wouldn't be there.

4. **Run the chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/Kit.Tests.ps1 -TagFilter ch02 -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 02-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/02-4.txt))](captures/02-4.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/Kit.Tests.ps1 -TagFilter ch02 -Output None -PassThr… and what it printed"}

   <!-- capture:end -->

**Expected result:** `PassedCount` 8 and `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 02-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/02-5.txt))](captures/02-5.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant

Use a test tenant, never production, with PowerShell 7.6 or later, ExchangeOnlineManagement 3.10 or later and AIPService 3.1.0.0 or later. Sign in with an account that holds the read roles through PIM. Work in `examples/information-protection`. You'll replace `<settings-file>` and `<output-folder>` as in Chapter 01.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/information-protection`. Each step below says what it does and what to look for.

```powershell
# Step 1: Install the modules, if they aren't there
Install-Module -Name ExchangeOnlineManagement, AIPService -Scope CurrentUser

# Step 2: Export the test tenant
./Export-IpBaseline.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/snapshot

# Step 3: Compare the real property names with the fixtures'
(Get-Content <output-folder>/snapshot/labels.json | ConvertFrom-Json)[0] | Get-Member -MemberType NoteProperty | Select-Object Name

# Step 4: Back it out
Remove-Item -Recurse -Force <output-folder>
```

:::

<!-- labs:end -->

1. **Install the modules, if they aren't there:**

   ```powershell
   Install-Module -Name ExchangeOnlineManagement, AIPService -Scope CurrentUser
   ```

2. **Export the test tenant.** You sign in three times, once per shell:

   ```powershell
   ./Export-IpBaseline.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/snapshot
   ```

   If it stops with "Connected to tenant …, not the settings' tenant", the account signed in to another tenant; nothing was read.

3. **Compare the real property names with the fixtures':**

   ```powershell
   (Get-Content <output-folder>/snapshot/labels.json | ConvertFrom-Json)[0] | Get-Member -MemberType NoteProperty | Select-Object Name
   ```

   The checks read `EncryptionEnabled`, `EncryptionRightsDefinitions`, `ApplyContentMarkingHeaderEnabled`, `ApplyContentMarkingHeaderText` and `Priority` from a label. A name that differs is a change to the kit, made with a test.

4. **Back it out.** The export changed nothing in the tenant. The snapshot names groups, label rights and super users, so keep it with the system security plan's access, or delete it:

   ```powershell
   Remove-Item -Recurse -Force <output-folder>
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Audit status | Read `UnifiedAuditLogIngestionEnabled` in Exchange Online PowerShell; always `False` in Security & Compliance PowerShell | [^ip02-audit] |
| Rights Management configuration | `Get-AipServiceConfiguration` returns `SuperUsersEnabled` and `SuperUsers`; "You must use PowerShell to see a full list of protection configuration values" | [^ip02-aip] |
| Labels | `Get-Label`, Security & Compliance PowerShell only; `-IncludeDetailedLabelActions` expands label actions into properties | [^ip02-label] |
| Content counts | `Export-ContentExplorerData` returns `TotalCount`, `MorePagesAvailable`, `RecordsReturned`, `PageCookie`; one type or label per call | [^ip02-ce] |
| Module and PowerShell | ExchangeOnlineManagement 3.10.0 and later need PowerShell 7.6.0; AIPService needs 3.1.0.0 for PowerShell 7.4 and later | [^ip02-exo] [^ip02-aipinstall] |
| App-only | `Connect-IPPSSession` and `Connect-ExchangeOnline` with `-CertificateThumbPrint`, `-AppID` and `-Organization` (the primary `.onmicrosoft.com` domain); the thumbprint works only on Windows | [^ip02-app] |
| Rights Management unattended | `Connect-AipService`'s syntax block lists no certificate parameter set, while its Example 4 uses `-CertificateThumbprint` with `-ServicePrincipal`; the kit keeps this read delegated | [^ip02-aipconnect] |

: Facts this chapter's code depends on {.striped .hover}

## Federal requirements and evidence

| Requirement it supports | KSI | What the ISSO keeps |
|---|---|---|
| CM-3 Configuration Change Control; CA-7 Continuous Monitoring | KSI-SVC-ACM, KSI-CMT-LMC | The dated snapshot folder and its manifest, committed with the change ticket |

The export supports these controls; the agency's assessor decides whether a control is satisfied.

## Dangers

| Danger | Mitigation |
|---|---|
| Two Exchange module shells at once, with cmdlets of the same name | One shell at a time, disconnected before the next |
| An export from the wrong tenant | `Get-ConnectionInformation` against `tenantId` before any read |
| A snapshot in a public place | It names groups, rights and super users: keep it with the system security plan's access |
| A property name that differs from the fixtures | Lab 2 step 3; a kit change with a test, never a silent default |

: Dangers in the export {.striped .hover}

## Checklist

- [ ] Modules at the versions in Verified facts on the operator's workstation
- [ ] `Export-IpBaseline -ListOnly` reviewed with the ISSO
- [ ] A test-tenant export with the tenant check passing
- [ ] Real property names compared with the fixtures'

## Continue the book

[← Previous: Chapter 01 — Access and the Read Path](01-access-and-the-read-path.md) · [Workbook index](index.md) · [Next: Chapter 03 — The Data Inventory →](03-the-data-inventory.md)

[^ip02-audit]: Microsoft Learn, "Turn auditing on or off" (verify with `Get-AdminAuditLogConfig` in Exchange Online PowerShell; the value is always False in Security & Compliance PowerShell), <https://learn.microsoft.com/purview/audit-log-enable-disable> (accessed Nov 11, 2026, for Book 20).
[^ip02-aip]: Microsoft Learn, "Get-AipServiceConfiguration" (SuperUsersEnabled, SuperUsers; "You must use PowerShell to see a full list of protection configuration values"), <https://learn.microsoft.com/powershell/module/aipservice/get-aipserviceconfiguration> (accessed Nov 24, 2026).
[^ip02-label]: Microsoft Learn, "Get-Label" (available only in Security & Compliance PowerShell; `-IncludeDetailedLabelActions`), <https://learn.microsoft.com/powershell/module/exchangepowershell/get-label> (accessed Nov 24, 2026).
[^ip02-ce]: Microsoft Learn, "Export-ContentExplorerData" (TotalCount, MorePagesAvailable, RecordsReturned, PageCookie), <https://learn.microsoft.com/powershell/module/exchangepowershell/export-contentexplorerdata> (accessed Nov 11, 2026, for Book 20).
[^ip02-exo]: Microsoft Learn, "About the Exchange Online PowerShell module" (3.10.0 and later require PowerShell 7.6.0 or later), <https://learn.microsoft.com/powershell/exchange/exchange-online-powershell-v2> (accessed Nov 24, 2026).
[^ip02-aipinstall]: Microsoft Learn, "Install the AIPService PowerShell module for the Azure Rights Management service" (Windows PowerShell 5.1, or PowerShell 7.4 and later with 3.1.0.0), <https://learn.microsoft.com/purview/install-aipservice-powershell> (accessed Nov 24, 2026).
[^ip02-app]: Microsoft Learn, "App-only authentication for unattended scripts in Exchange Online PowerShell and Security & Compliance PowerShell" (the two connection commands; `.onmicrosoft.com` organization; thumbprint only in Windows; Security & Compliance needs module 3.0.0 or later), <https://learn.microsoft.com/powershell/exchange/app-only-auth-powershell-v2> (accessed Nov 24, 2026).
[^ip02-aipconnect]: Microsoft Learn, "Connect-AipService" (parameter sets Credential, AccessToken and Environment; Example 4 with `-CertificateThumbprint`, `-ApplicationId`, `-TenantId` and `-ServicePrincipal`), <https://learn.microsoft.com/powershell/module/aipservice/connect-aipservice> (accessed Nov 24, 2026).
