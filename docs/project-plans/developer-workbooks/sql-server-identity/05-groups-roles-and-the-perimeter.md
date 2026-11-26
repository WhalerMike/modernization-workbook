---
title: "Chapter 05 — Groups, Roles and the Perimeter"
description: "Book 06, Chapter 16's four Active Directory group patterns as code: a group map that sorts each group that reaches SQL Server into dynamic, assigned (PIM for a privileged role), mail-only or split, writes the dynamic rule on the HR organization code with the disabled-account and guest exclusions, and flags nesting and a privileged role on a rule-based group. Labs on the fictional estate's groups, then a read-only Microsoft Graph listing of a test tenant's groups compared with the map."
doc-type: workbook-chapter
audience: [Technical]
family: dw-sql-server-identity
part: How
series-order: 5
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: 6ff7be27988dcf1d97dbd325425df64d2dcb05ded8a1a30924513b0e41b8bc3f
last-reviewed: 2026-11-25
---
# Chapter 05 — Groups, Roles and the Perimeter

*Group-based access survives the move to Entra ID. Who keeps each group current, and what stands in front of it, changes.*

::: {.callout-note}
## In this chapter
The code behind [Book 06, Chapter 16](../../../books/b06-data-platform/16-groups-roles-and-membership.md)'s four group patterns, [Chapter 17](../../../books/b06-data-platform/17-dynamic-membership-delegation-and-privilege.md)'s rules for dynamic membership and privilege, and Phase 1 of [Runbook R07](../../../books/b06-data-platform/r07-groups-aus-and-the-conditional-access-perimeter.md). You start with what Learn gives you: dynamic membership rules, the Graph group properties, PIM for Groups and Conditional Access for SQL sign-ins. Then you read the kit's group map. Lab 1 maps the fictional estate's five groups and shows the guard on a privileged dynamic group. Lab 2 lists a test tenant's groups with Microsoft Graph PowerShell, read-only, and compares them with the map.
:::

## Goal and audience

**Goal.** By the end of this chapter you can take every Active Directory group that reaches SQL Server and say which Entra group replaces it, how its membership will be kept, and which ones belong under PIM.

**Audience.** Developers who build or maintain the kit, the identity engineer who builds the groups, and the DBA lead who will manage them. You don't need a tenant until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

A dynamic membership group computes its members from a rule over user properties, including `accountEnabled` and the fifteen `extensionAttribute1` to `extensionAttribute15` values; multi-value extension properties aren't supported, a rule body can't exceed 3,072 characters, and each unique member needs a Microsoft Entra ID P1 license.[^sq05-dyn] Microsoft Graph's group resource gives the properties that sort a group: `groupTypes` (`Unified` for a Microsoft 365 group, `DynamicMembership` for a rule-based one), `securityEnabled`, `mailEnabled`, `membershipRule`, `onPremisesSyncEnabled` and `onPremisesSamAccountName`, all returned by default.[^sq05-group] `Get-MgGroup` reads them in PowerShell, with `-All` for every page and `-Property` to choose the properties.[^sq05-get-mggroup] A Microsoft 365 GCC tenant uses the worldwide Graph endpoint, `https://graph.microsoft.com`.[^sq05-graph-clouds]

For privilege, PIM for Groups works on any security group or Microsoft 365 group except dynamic membership groups and groups synchronized from on premises.[^sq05-pim] For the perimeter, Microsoft documents Conditional Access for Azure SQL Database, Azure SQL Managed Instance and Azure Synapse against the **Azure SQL Database** enterprise application; it needs at least P1, and it applies only to users, not to programmatic connections such as service principals and managed identities.[^sq05-ca-sql] Conditional Access for workload identities covers single-tenant service principals with Workload Identities Premium, and doesn't cover managed identities.[^sq05-ca-wid]

### What it leaves to you

Each row is pinned by a test in the `Chapter 05` block of `tests/SqlIdentity.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| Group properties, one group at a time | Nobody says which AD group becomes which kind of Entra group | `Get-SqlGroupPattern`: Chapter 16's four patterns, one target per group |
| Dynamic rules over any supported property | A rule on `department` breaks the next time someone retypes it, and a rule on a code alone admits disabled accounts and guests | The rule written on the HR organization code in `extensionAttribute10`, with `accountEnabled` and `userType` clauses; no code recorded means ask HR for it, never a guess |
| PIM for Groups excludes dynamic and synced groups | A privileged role on a rule-based group can't be made just-in-time | A flag on a privileged server role on a dynamic group: use an assigned group under PIM |
| Dynamic rules can't select groups | A nested AD group silently loses its inner members | A `nested: flatten` flag naming the inner groups |
| Conditional Access for users only | Application connections pass no device or MFA check | Nothing in the kit; Chapter 07 moves applications to managed identity |

## The code

### The group map

`Get-SqlGroupPattern` reads the groups file: for each AD group, its category, mail state, how its membership is kept (`org-chart` or `explicit`), the organization codes, member count, nested groups and the grants it carries on each instance. `Invoke-SqlGroupMap.ps1` writes `groups.csv`, `groups.json` and `manifest.json`. The rules, in order:

| Pattern | Signal in the groups file | Target |
|---|---|---|
| 3 | `category` is `Distribution` | Mail-only group; update the SQL Server Agent operator address; no login |
| 4 | A security group with `mailEnabled` | Split: a mail-only group and an assigned security group, the pairing recorded in both descriptions |
| 1 | `membershipBasis` is `org-chart` | Dynamic group with a rule on `user.extensionAttribute10` that also requires `user.accountEnabled -eq true` and `user.userType -eq "Member"`, never on `department` or `jobTitle`; with no code recorded, ask HR for the code first |
| 2 | Anything else | Assigned group, managed by a delegated administrator; eligible through PIM when it holds `sysadmin` or `securityadmin` |

The map is flat by design: Entra groups that grant SQL Server access list their members directly, by rule or by assignment ([Chapter 16](../../../books/b06-data-platform/16-groups-roles-and-membership.md#flat-by-design)). The organization code's carrier is fixed in [Book 03's program attribute map](../../../books/b03-hr-identity/06-canonical-attribute-schema.md#program-attribute-map). PIM for the `sysadmin` group, and the emergency access path that must not depend on it, are built in [Building Privileged Access, Chapter 05](../privileged-access/05-pim-for-groups.md); this kit only names which groups need it.

The rule the kit writes is `(user.extensionAttribute10 -in [...]) -and (user.accountEnabled -eq true) -and (user.userType -eq "Member")`: the organization code, and the exclusion of disabled accounts and guests that Chapter 17 and R07's example rule carry. When a group's codes aren't recorded, the target says to ask HR for the code before writing the rule.

One group, one role is checked where the roles are known: `New-SqlLoginPlan` in [Chapter 04](04-entra-logins-and-the-parallel-run.md) warns when the login mapping would give a principal more than one database role, or `db_owner` or `sysadmin`. The groups file carries grants per instance, not roles per database, so the map doesn't repeat that check.

::: {.callout-important}
## Illustrative code
Lab 1 reads fixtures; nothing connects. Tested against fixtures, not a live directory or tenant.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\sql-server-identity-05\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Map the fictional estate's groups
./Invoke-SqlGroupMap.ps1 -GroupsPath tests/fixtures/groups/groups.json -OutputPath "$Run/groups"

# Step 2: Read what each group grants
Import-Csv "$Run/groups/groups.csv" | Format-Table Group, Members, Grants, Flags -Wrap

# Step 3: Pretend the sysadmin group were kept by the org chart
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$admins = (Read-SqlJson tests/fixtures/groups/groups.json).groups | Where-Object name -eq 'CONTOSO\SQL-Admins'
$admins.membershipBasis = 'org-chart'
Get-SqlGroupPattern -Groups $admins | Format-List Group, Pattern, Target, Flags

# Step 4: Open the manifest
Get-Content "$Run/groups/manifest.json"

# Step 5: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 05*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# After the steps
Get-ChildItem C:\FMWLabs\results\sql-server-identity-05\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped `sql-server-identity-code.zip` under the learning path's [Get the code](../../../training/data-platform/index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

<!-- capture:begin 05-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/05-1.txt))](captures/05-1.png){.lightbox fig-alt="Terminal window showing Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity and what it printed"}

<!-- capture:end -->

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\sql-server-identity-05\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

<!-- capture:begin 05-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/05-2.txt))](captures/05-2.png){.lightbox fig-alt="Terminal window showing $Run = 'C:\FMWLabs\results\sql-server-identity-05\lab1\$(Get-Date -AsUTC -For… and what it printed"}

<!-- capture:end -->

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\sql-server-identity-05\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Map the fictional estate's groups.** One of each pattern, and a second dynamic group with a nested group:

   ```powershell
   ./Invoke-SqlGroupMap.ps1 -GroupsPath tests/fixtures/groups/groups.json -OutputPath "$Run/groups"
   ```

   ```text
   Group                    Pattern Target                                                                                                                                                              Flags
   -----                    ------- ------                                                                                                                                                              -----
   CONTOSO\PayrollUsers           1 Dynamic group, rule (user.extensionAttribute10 -in ["FIN-PAY"]) -and (user.accountEnabled -eq true) -and (user.userType -eq "Member"); never department or jobTitle
   CONTOSO\SQL-Admins             2 Assigned group, eligible through PIM (privileged server role)
   CONTOSO\SQL-Agent-Alerts       3 Mail-only group; update the SQL Server Agent operator address; no login
   CONTOSO\ClaimsTeam             4 Split: a mail-only group plus an assigned security group; record the pairing in both descriptions
   CONTOSO\HR-Analysts            1 Dynamic group, rule (user.extensionAttribute10 -in ["HR-ANL"]) -and (user.accountEnabled -eq true) -and (user.userType -eq "Member"); never department or jobTitle  nested: flatten (CONTOSO\HR-Leads)

   Wrote 2 files and manifest.json to C:/FMWLabs/results/sql-server-identity-05/lab1/<run>/groups
   Evidence for GROUPS (Map each AD group pattern to its Entra group): AC-2, AC-6; KSI-IAM-ELP
   ```

   <!-- capture:begin 05-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/05-3.txt))](captures/05-3.png){.lightbox fig-alt="Terminal window showing ./Invoke-SqlGroupMap.ps1 -GroupsPath tests/fixtures/groups/groups.json -Outpu… and what it printed"}

   <!-- capture:end -->

   Each dynamic rule carries the code and the exclusion of disabled accounts and guests. With the rules this long, PowerShell drops the `Flags` column from the table; step 2 prints it.

2. **Read what each group grants.** `CONTOSO\SQL-Admins` holds `sysadmin`; the distribution list grants nothing:

   ```powershell
   Import-Csv "$Run/groups/groups.csv" | Format-Table Group, Members, Grants, Flags -Wrap
   ```

   ```text
   Group                    Members Grants              Flags
   -----                    ------- ------              -----
   CONTOSO\PayrollUsers     214     SQLPRD01
   CONTOSO\SQL-Admins       6       SQLPRD01 (sysadmin)
   CONTOSO\SQL-Agent-Alerts 9
   CONTOSO\ClaimsTeam       31      SQLPRD02
   CONTOSO\HR-Analysts      18      SQLFCI04            nested: flatten (CONTOSO\HR-Leads)
   ```

   <!-- capture:begin 05-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/05-4.txt))](captures/05-4.png){.lightbox fig-alt="Terminal window showing Import-Csv '$Run/groups/groups.csv' | Format-Table Group, Members, Grants, Fl… and what it printed"}

   <!-- capture:end -->

   `CONTOSO\PayrollUsers` reaches two databases on SQLPRD01 (see the fixture). Chapter 16's rule is one group, one role, one database; the map doesn't check roles, and Chapter 04's login plan does: its `Warning:` line for `SQL-Payroll-Users` names the three roles. Split such a group before the mapping is approved.

3. **Pretend the `sysadmin` group were kept by the org chart.** The map refuses to make it dynamic:

   ```powershell
   Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
   $admins = (Read-SqlJson tests/fixtures/groups/groups.json).groups | Where-Object name -eq 'CONTOSO\SQL-Admins'
   $admins.membershipBasis = 'org-chart'
   Get-SqlGroupPattern -Groups $admins | Format-List Group, Pattern, Target, Flags
   ```

   ```text
   Group   : CONTOSO\SQL-Admins
   Pattern : 1
   Target  : Dynamic group on an HR-maintained code: no code recorded yet, so ask HR for it before writing the rule
   Flags   : privileged role on a dynamic group: use an assigned group under PIM instead
   ```

   <!-- capture:begin 05-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/05-5.txt))](captures/05-5.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1 and what it printed"}

   <!-- capture:end -->

   The group has no organization codes, so the target says to ask HR for the code rather than write a rule. The flag is what matters: a privileged role never sits on a rule.

4. **Open the manifest.** GROUPS supports AC-2 and AC-6:

   ```powershell
   Get-Content "$Run/groups/manifest.json"
   ```

   ```text
   {
     "step": "GROUPS",
     "title": "Map each AD group pattern to its Entra group",
     "mode": "read-only",
     "asOf": "2026-11-20",
     "controls": [
       "AC-2",
       "AC-6"
     ],
     "ksis": [
       "KSI-IAM-ELP"
     ],
     "files": [
       {
         "file": "groups.csv",
         "sha256": "39363fb3f917b69eee3b9130ea3d4116ccc7b9326866f3b1bdc189cc505a377f"
       },
       {
         "file": "groups.json",
         "sha256": "fe56744856c5a4e5a3a70b63d2ded19a21feba928b374db4727613e0aac76340"
       }
     ]
   }
   ```

   <!-- capture:begin 05-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/05-6.txt))](captures/05-6.png){.lightbox fig-alt="Terminal window showing Get-Content '$Run/groups/manifest.json' and what it printed"}

   <!-- capture:end -->

5. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 05*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             4           0
   ```

   <!-- capture:begin 05-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/05-7.txt))](captures/05-7.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 05*'… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\sql-server-identity-05\lab1 -Name
```

<!-- capture:begin 05-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/sql/05-8.txt))](captures/05-8.png){.lightbox fig-alt="Terminal window showing Get-ChildItem C:\FMWLabs\results\sql-server-identity-05\lab1 -Name and what it printed"}

<!-- capture:end -->

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Lab 2: a test tenant

**The authors haven't run this lab.** Use a test tenant whose groups are synchronized from a test domain, never production. Nothing in this lab writes to the tenant. You need PowerShell 7 with the Microsoft Graph PowerShell SDK (`Microsoft.Graph.Groups`), and an account that can consent to the delegated `Group.Read.All` permission. Learn's permissions table for listing groups puts `Group.Read.All` among the higher-privileged permissions; it is read-only, and the lab uses it because the table's least-privileged entry is a write permission (see the verification log). Work in `examples/sql-server-identity`, all steps in one PowerShell session. You'll replace: `<tenant-id>` and `<groups-file>` (your test domain's groups that reach SQL Server, written in the shape of `tests/fixtures/groups/groups.json`).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/sql-server-identity`. Each step below says what it does and what to look for.

```powershell
# Step 1: Map your test groups with the kit
./Invoke-SqlGroupMap.ps1 -GroupsPath <groups-file> -OutputPath out/lab2-groups

# Step 2: Sign in to Microsoft Graph, read-only, on the worldwide endpoint
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes 'Group.Read.All'

# Step 3: List the tenant's groups with the properties that decide the pattern
$tenantGroups = Get-MgGroup -All -Property Id, DisplayName, GroupTypes, SecurityEnabled, MailEnabled, MembershipRule, OnPremisesSyncEnabled, OnPremisesSamAccountName
$tenantGroups | Where-Object OnPremisesSyncEnabled | Select-Object DisplayName, OnPremisesSamAccountName, SecurityEnabled, MailEnabled | Sort-Object DisplayName | Format-Table

# Step 4: Put the kit's answer beside what the tenant has
Import-Csv out/lab2-groups/groups.csv | ForEach-Object {
    $sam = ($_.Group -split '\\')[-1]
    $t = $tenantGroups | Where-Object OnPremisesSamAccountName -eq $sam | Select-Object -First 1
    [pscustomobject]@{ Group = $_.Group; Pattern = $_.Pattern; InTenant = [bool]$t; Synced = $t.OnPremisesSyncEnabled; Security = $t.SecurityEnabled; Mail = $t.MailEnabled }
} | Format-Table

# Step 5: Look for cloud groups that already exist
Get-MgGroup -All -Filter "startswith(displayName,'SQL-')" -Property DisplayName, GroupTypes, MembershipRule, OnPremisesSyncEnabled | Select-Object DisplayName, @{ n = 'Dynamic'; e = { $_.GroupTypes -contains 'DynamicMembership' } }, MembershipRule | Format-Table -Wrap

# Step 6: Back it out
Disconnect-MgGraph
Remove-Item -Recurse -Force out/lab2-groups
```

:::

<!-- labs:end -->

1. **Map your test groups with the kit:**

   ```powershell
   ./Invoke-SqlGroupMap.ps1 -GroupsPath <groups-file> -OutputPath out/lab2-groups
   ```

2. **Sign in to Microsoft Graph, read-only, on the worldwide endpoint:**

   ```powershell
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes 'Group.Read.All'
   ```

3. **List the tenant's groups with the properties that decide the pattern:**

   ```powershell
   $tenantGroups = Get-MgGroup -All -Property Id, DisplayName, GroupTypes, SecurityEnabled, MailEnabled, MembershipRule, OnPremisesSyncEnabled, OnPremisesSamAccountName
   $tenantGroups | Where-Object OnPremisesSyncEnabled | Select-Object DisplayName, OnPremisesSamAccountName, SecurityEnabled, MailEnabled | Sort-Object DisplayName | Format-Table
   ```

4. **Put the kit's answer beside what the tenant has.** One row per group in your groups file:

   ```powershell
   Import-Csv out/lab2-groups/groups.csv | ForEach-Object {
       $sam = ($_.Group -split '\\')[-1]
       $t = $tenantGroups | Where-Object OnPremisesSamAccountName -eq $sam | Select-Object -First 1
       [pscustomobject]@{ Group = $_.Group; Pattern = $_.Pattern; InTenant = [bool]$t; Synced = $t.OnPremisesSyncEnabled; Security = $t.SecurityEnabled; Mail = $t.MailEnabled }
   } | Format-Table
   ```

   What to look for. A Pattern 2 group that holds `sysadmin` and shows `Synced` True can't go into PIM for Groups;[^sq05-pim] its replacement is a new cloud-only assigned group. A Pattern 4 group should show both `Security` and `Mail` True. A group with `InTenant` False isn't synchronized, so its replacement is built from the AD group's members.

5. **Look for cloud groups that already exist.** A target group may already be there, dynamic or assigned:

   ```powershell
   Get-MgGroup -All -Filter "startswith(displayName,'SQL-')" -Property DisplayName, GroupTypes, MembershipRule, OnPremisesSyncEnabled | Select-Object DisplayName, @{ n = 'Dynamic'; e = { $_.GroupTypes -contains 'DynamicMembership' } }, MembershipRule | Format-Table -Wrap
   ```

   Compare any rule you find with the kit's: a rule on `department` or `jobTitle`, or one without the disabled-account and guest exclusions, is a finding.

6. **Back it out.** Nothing was written; sign out and delete the files:

   ```powershell
   Disconnect-MgGraph
   Remove-Item -Recurse -Force out/lab2-groups
   ```

## Verified facts

| Item | Value | GCC | Source |
|---|---|---|---|
| Dynamic rules | `accountEnabled`, `extensionAttribute1` to `15`; no multi-value extension properties; 3,072-character body; P1 per unique member | — | [^sq05-dyn] |
| Group properties | `groupTypes`, `securityEnabled`, `mailEnabled`, `membershipRule`, `onPremisesSyncEnabled`, `onPremisesSamAccountName`, returned by default | Worldwide endpoint | [^sq05-group] [^sq05-graph-clouds] |
| Listing groups | `GET /groups`; delegated and application; `Group.Read.All` among the accepted permissions | Global service | [^sq05-list] [^sq05-get-mggroup] |
| PIM for Groups | Not for dynamic groups or groups synchronized from on premises | — | [^sq05-pim] |
| Conditional Access for SQL | Target **Azure SQL Database**; P1; users only, not service principals or managed identities | — | [^sq05-ca-sql] |
| Workload identities | Single-tenant service principals; Workload Identities Premium; managed identities not covered | — | [^sq05-ca-wid] |
| Graph sign-in | `Connect-MgGraph` targets the global cloud by default; `-Environment` names it | Worldwide | [^sq05-connect] |

## Federal requirements and evidence

| Step | NIST SP 800-53 Rev 5 controls it supports | FedRAMP 20x KSIs | Evidence the ISSO keeps |
|---|---|---|---|
| GROUPS: the map (Lab 1, steps 1 to 4; Lab 2, steps 1 and 4) | AC-2, AC-6 | KSI-IAM-ELP | `groups.csv` with its manifest; the Lab 2 comparison; the record of which groups went under PIM |

The map provides evidence for account management and least privilege: which group grants what, how its membership is kept, and which privileged groups are eligible rather than standing. The agency still sets the parameters, policy and procedures, and the assessor decides whether each control is satisfied. KSIs are FedRAMP 20x indicators for cloud service providers: the agency lines its own evidence up with them and doesn't report KSIs itself.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A privileged role on a dynamic group | Whoever can write the attribute can make someone `sysadmin` | The flag in Lab 1, step 3; assigned groups under PIM ([Building Privileged Access](../privileged-access/05-pim-for-groups.md)) |
| A rule without the account and guest exclusions | Disabled accounts and guests that match the code join | The kit's rule carries `accountEnabled` and `userType` clauses, as R07's example does; Lab 2, step 5 flags a tenant rule without them |
| A nested AD group rebuilt as a dynamic group | The inner group's members drop out | The `nested: flatten` flag |
| One group reaching several databases or roles | An access review can't tell what the group grants | Chapter 16's one group, one role rule: Chapter 04's login plan warns, and the identity engineer splits the group |
| A mail-enabled security group moved as one object | Mail and access stay coupled | Pattern 4's split |
| Conditional Access treated as covering applications | Managed identities pass with no device or MFA check | Chapter 07's application chain; Azure role assignments and access reviews |

## Checklist

- [ ] Every AD group that reaches SQL Server is in the groups file, with its grants.
- [ ] Every dynamic rule reads an HR-maintained code and excludes disabled accounts and guests.
- [ ] No group holding `sysadmin`, `securityadmin` or the Entra admin role is dynamic or synchronized.
- [ ] Every nested group is flattened, and every split pair is recorded in both descriptions.
- [ ] The Conditional Access policies that cover the Azure SQL Database application are named in the system security plan.

::: {.callout-tip}
## Continue the book
[← Chapter 04 — Entra Logins and the Parallel Run](04-entra-logins-and-the-parallel-run.md) · [Workbook index](index.md) · [Next: Chapter 06 — NTLM and the SPNs →](06-ntlm-and-the-spns.md)
:::

[^sq05-dyn]: Microsoft Learn, "Manage rules for dynamic membership groups in Microsoft Entra ID" (supported properties, extension attributes, rule length, license requirements), <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (accessed Nov 24, 2026).
[^sq05-group]: Microsoft Learn, "group resource type" (Microsoft Graph v1.0), properties, <https://learn.microsoft.com/graph/api/resources/group> (accessed Nov 24, 2026).
[^sq05-list]: Microsoft Learn, "List groups" (Microsoft Graph v1.0), Permissions, <https://learn.microsoft.com/graph/api/group-list> (accessed Nov 24, 2026).
[^sq05-get-mggroup]: Microsoft Learn, "Get-MgGroup" (Microsoft.Graph.Groups module; `-All`, `-Property`, `-Filter`), <https://learn.microsoft.com/powershell/module/microsoft.graph.groups/get-mggroup> (accessed Nov 24, 2026).
[^sq05-graph-clouds]: Microsoft Learn, "Microsoft Graph national cloud deployments" (a Microsoft 365 GCC tenant keeps using `https://graph.microsoft.com`), <https://learn.microsoft.com/graph/deployments> (accessed Nov 24, 2026).
[^sq05-connect]: Microsoft Learn, "Connect-MgGraph," parameter `-Environment` (global cloud by default), <https://learn.microsoft.com/powershell/module/microsoft.graph.authentication/connect-mggraph> (accessed Nov 24, 2026).
[^sq05-pim]: Microsoft Learn, "Privileged Identity Management (PIM) for Groups," <https://learn.microsoft.com/entra/id-governance/privileged-identity-management/concept-pim-for-groups> (accessed Nov 24, 2026).
[^sq05-ca-sql]: Microsoft Learn, "Conditional access" (Azure SQL Database, Azure SQL Managed Instance and Azure Synapse Analytics), <https://learn.microsoft.com/azure/azure-sql/database/conditional-access-configure> (accessed Nov 24, 2026).
[^sq05-ca-wid]: Microsoft Learn, "Conditional Access for workload identities," <https://learn.microsoft.com/entra/identity/conditional-access/workload-identity> (accessed Nov 24, 2026).
