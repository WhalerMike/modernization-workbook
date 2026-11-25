---
title: "Chapter 01 — Access and the Read Path"
description: "Who may read the Purview configuration, and how: every read the kit runs declared with its cmdlet, shell, role and Learn page; the settings with a named cloud (gcc or commercial) and tenant and no default; the snapshot's tenant checked against the settings; and the Purview role groups checked against the agency's role register, member by member, with review dates. Labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-information-protection
part: How
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 01 — Access and the Read Path

*Every check in this workbook reads through the same three shells. First, prove they read the right tenant, and that the people who can see what Purview holds are the ones the register names.*

::: {.callout-note}
## In this chapter
The code behind the access half of the guide's [G1 Classes, decisions and inventory](../../../books/guides/information-protection-implementation.md#step-1-classes-decisions-and-inventory) and the role check in [G10](../../../books/guides/information-protection-implementation.md#step-10-audit-insider-risk-and-communication-compliance). You start with what Learn and the guide give you: three shells with no extra parameters for GCC, read roles held through PIM, and `Get-RoleGroupMember` for each role group. Then you read how the kit declares every read in `config/calls.json` and how `Invoke-IpAccess` checks the snapshot's tenant and the role register. Lab 1 runs the check on the fixtures; Lab 2 runs it on a test tenant's export.
:::

## Goal and audience

For the developer who owns the kit's read path. By the end you can say:

- which cmdlet each file in a snapshot came from, in which shell, and with which role;
- that a snapshot came from the tenant and cloud the settings name;
- whether the Purview role groups hold exactly the people the role register names.

## Start with the guide's commands

### What the guide and Learn give you

The guide's [shells table](../../../books/guides/information-protection-implementation.md#prerequisites) names three shells. `Connect-IPPSSession` and `Connect-ExchangeOnline` need no connection URI in Microsoft 365 or Microsoft 365 GCC,[^ip01-scc] so a commercial test tenant and a GCC tenant connect the same way. G10 adds the role check that [Book 20, Chapter 10](../../../books/b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#role-separation) asks for:

```powershell
Get-RoleGroupMember -Identity '<irm-investigators-role-group-name>'
```

### What it leaves to you

- **Which tenant answered.** A session connected to the wrong tenant returns a clean-looking answer. Learn's `Get-ConnectionInformation` returns each connection's `TenantID` and whether it is a Security & Compliance session (`IsEopSession`);[^ip01-conninfo] the kit compares it with the settings before it reads anything (Chapter 02).
- **What "right" means for a role group.** Learn says adding security groups to Purview role groups is supported only in commercial organizations, so in GCC the program assigns individual users and keeps a role register ([Book 20, Chapter 10](../../../books/b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#role-separation)). The register is the design; the export is what's there.
- **Which role each read needs.** The guide names roles per gate; the kit keeps them per cmdlet so a reviewer can see the whole read path at once.

## The code

### Declared reads

`config/calls.json` lists every read the export runs, in order: its `cmdlet`, the `shell` it runs in (`scc`, `exo` or `aip`), the `file` it writes, a `role` that can run it and the Learn page (`doc`). All are `Get-` or `Export-` cmdlets; a test fails if one isn't. Two reads are optional and run only when the settings turn them on: the Rights Management configuration (`reads.rightsManagement`) and the content explorer counts (`reads.inventory`). `Get-IpRequiredPermission` prints the table.

### The settings

`Read-IpSettings` reads one settings file per environment (`lab`, `test` or `production`). `cloud` must be `gcc` or `commercial`; anything else throws, and there is no default. `tenantId` and `tenantDomain` must be real values, not placeholders. Input paths resolve against the settings file's own folder.

### The access check

`Invoke-IpAccess` writes three files:

- `results.csv`: `ACC-01` the settings; `ACC-02` the snapshot's manifest names the settings' tenant and cloud; one `ROLE-nn` row per role group in the register.
- `role-groups.csv`: each finding, member by member: holds the role but isn't in the register (fail), in the register but doesn't hold it (fail), review overdue (warn).
- `permissions.csv`: the declared reads, for the ISSO's record.

Learn's `Get-RoleGroupMember` page lists no output properties,[^ip01-rgm] so the kit matches a member by any of its sign-in name, address or name.

### The tests

`tests/Kit.Tests.ps1`, tag `ch01`: the settings refuse an unknown cloud and a placeholder tenant; every read is a read cmdlet with a shell, file, role and Learn page; the access check finds the fixtures' role faults.

::: {.callout-warning}
## Illustrative code
Lab 1 reads fictional fixtures. The kit has not been run against a production tenant. Treat the result as a review aid for the ISSO, not as the authority on who holds what.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/information-protection`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/information-protection`. Each step below says what it does and what to look for.

```powershell
# Step 1: Run the access check on the November snapshot
./Invoke-IpAccess.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/access -AsOf 2026-11-24T12:00:00Z

# Step 2: Read the findings member by member
Import-Csv out/access/role-groups.csv | Format-Table -AutoSize

# Step 3: Read what each file in a snapshot needs
Import-Csv out/access/permissions.csv | Format-Table Read, Shell, Cmdlet, Role -AutoSize

# Step 4: Run the chapter's tests
Invoke-Pester -Path tests/Kit.Tests.ps1 -TagFilter ch01 -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Run the access check on the November snapshot:**

   ```powershell
   ./Invoke-IpAccess.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath out/access -AsOf 2026-11-24T12:00:00Z
   ```

   <!-- capture:begin 01-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/01-1.txt))](captures/01-1.png){.lightbox fig-alt="Terminal window showing ./Invoke-IpAccess.ps1 -SettingsPath tests/fixtures/settings.lab.json -Snapsho… and what it printed"}

   <!-- capture:end -->

   The snapshot came from the settings' tenant, so `ACC-02` passes. `ROLE-02` fails: `extra.person@contoso.example` holds Insider Risk Management Investigators but isn't in the register. `ROLE-01` warns: the Communication Compliance investigator's review date has passed.

2. **Read the findings member by member:**

   ```powershell
   Import-Csv out/access/role-groups.csv | Format-Table -AutoSize
   ```

   <!-- capture:begin 01-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/01-2.txt))](captures/01-2.png){.lightbox fig-alt="Terminal window showing Import-Csv out/access/role-groups.csv | Format-Table -AutoSize and what it printed"}

   <!-- capture:end -->

   Two rows: the overdue review and the person the register doesn't name. Each is a change to the role group or the register, under a change record.

3. **Read what each file in a snapshot needs:**

   ```powershell
   Import-Csv out/access/permissions.csv | Format-Table Read, Shell, Cmdlet, Role -AutoSize
   ```

   <!-- capture:begin 01-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/01-3.txt))](captures/01-3.png){.lightbox fig-alt="Terminal window showing Import-Csv out/access/permissions.csv | Format-Table Read, Shell, Cmdlet, Rol… and what it printed"}

   <!-- capture:end -->

   Sixteen reads: eleven in Security & Compliance PowerShell, four in Exchange Online PowerShell, one in the AIPService module.

4. **Run the chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/Kit.Tests.ps1 -TagFilter ch01 -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 01-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/01-4.txt))](captures/01-4.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/Kit.Tests.ps1 -TagFilter ch01 -Output None -PassThr… and what it printed"}

   <!-- capture:end -->

**Expected result:** `PassedCount` 8 and `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 01-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/01-5.txt))](captures/01-5.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant

Use a test tenant, never production. Sign in with an account that holds the read roles in `config/calls.json` through PIM. Work in `examples/information-protection`. You'll replace `<settings-file>` (your copy of `deploy/settings.template.json` for the test tenant, with `environment` `test`, the tenant's ID and domain, and the role register naming the test tenant's role groups) and `<output-folder>` (a folder inside the agency's boundary).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/information-protection`. Each step below says what it does and what to look for.

```powershell
# Step 1: Export the test tenant
./Export-IpBaseline.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/snapshot

# Step 2: Run the access check on it
./Invoke-IpAccess.ps1 -SettingsPath <settings-file> -SnapshotPath <output-folder>/snapshot -OutputPath <output-folder>/access

# Step 3: Back it out
Remove-Item -Recurse -Force <output-folder>
```

:::

<!-- labs:end -->

1. **Export the test tenant** (Chapter 02 explains the export):

   ```powershell
   ./Export-IpBaseline.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/snapshot
   ```

2. **Run the access check on it:**

   ```powershell
   ./Invoke-IpAccess.ps1 -SettingsPath <settings-file> -SnapshotPath <output-folder>/snapshot -OutputPath <output-folder>/access
   ```

   `ACC-02` passes. Each failing `ROLE` row is a member to remove or a register entry to add, under a change record.

3. **Back it out.** The check changed nothing in the tenant. Delete the folder if you don't keep it as evidence:

   ```powershell
   Remove-Item -Recurse -Force <output-folder>
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Security & Compliance and Exchange Online in GCC | No `ConnectionUri` or `AzureADAuthorizationEndpointUri` needed in Microsoft 365 or Microsoft 365 GCC | [^ip01-scc] |
| The session's tenant | `Get-ConnectionInformation` returns `TenantID`, `State` and `IsEopSession` (True for Security & Compliance); module 3.0.0 or later | [^ip01-conninfo] |
| Role group members | `Get-RoleGroupMember -Identity`; the page lists no output properties | [^ip01-rgm] |
| Security groups in Purview role groups | Supported only in commercial organizations, per Learn's wording; GCC unclear, so individual users and a register | [Book 20, Chapter 10](../../../books/b20-information-protection/10-audit-insider-risk-and-communication-compliance.md#role-separation) |

: Facts this chapter's code depends on {.striped .hover}

## Federal requirements and evidence

| Requirement it supports | KSI | What the ISSO keeps |
|---|---|---|
| AC-5 Separation of Duties; AC-6 Least Privilege | KSI-IAM-ELP | `role-groups.csv`, `permissions.csv`, the role register |

The check supports these controls; the agency's assessor decides whether a control is satisfied. KSIs are FedRAMP's indicators for cloud service providers; the agency uses them as a vocabulary for its own evidence.

## Dangers

| Danger | Mitigation |
|---|---|
| A clean answer from the wrong tenant | The export stops when `TenantID` isn't the settings' tenant; `ACC-02` checks the snapshot again |
| A reader role held standing | Hold the read roles through PIM ([Book 04](../../../books/b04-access/index.md)); the export runs only while the role is active |
| The register drifts from the charter | The register's `approvedBy` and `reviewBy` columns; `ROLE` rows warn when a review is overdue |

: Dangers in the read path {.striped .hover}

## Checklist

- [ ] Settings for each environment, with `cloud` and the tenant filled in
- [ ] The read roles in `config/calls.json` assigned through PIM to the operator account
- [ ] The role register filled from the insider risk charter
- [ ] `Invoke-IpAccess` passes on the test tenant's export

## Continue the book

[Workbook index](index.md) · [Next: Chapter 02 — The Baseline Export →](02-the-baseline-export.md)

[^ip01-scc]: Microsoft Learn, "Connect to Security & Compliance PowerShell" (Microsoft 365 or Microsoft 365 GCC: no *ConnectionUri* or *AzureADAuthorizationEndpointUri*), <https://learn.microsoft.com/powershell/exchange/connect-to-scc-powershell> (accessed Nov 24, 2026).
[^ip01-conninfo]: Microsoft Learn, "Get-ConnectionInformation" (Exchange Online PowerShell module 3.0.0 or later; output properties include State, TenantID and IsEopSession, True for Security & Compliance PowerShell connections), <https://learn.microsoft.com/powershell/module/exchangepowershell/get-connectioninformation> (accessed Nov 24, 2026).
[^ip01-rgm]: Microsoft Learn, "Get-RoleGroupMember" (Identity applicable to Security & Compliance; no output properties listed), <https://learn.microsoft.com/powershell/module/exchangepowershell/get-rolegroupmember> (accessed Nov 24, 2026).
