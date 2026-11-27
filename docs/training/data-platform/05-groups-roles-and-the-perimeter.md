---
title: "Data Platform, Module 5: Groups, Roles and the Perimeter"
subtitle: "Sort every Active Directory group that reaches SQL Server into its Entra replacement, and keep privileged roles off rule-based groups"
description: "Module 5 of the Data Platform and SQL Server Identity learning path. You learn the four AD group patterns, why the dynamic rule reads an HR code with the disabled-account and guest exclusions, and why a privileged role belongs on an assigned group under PIM. Lab 1 maps the fictional estate's five groups and shows the guard on a privileged dynamic group. Runbook R07; workbook Chapter 05."
research-status: draft
research-type: training module
research-book: "Book 06"
series-order: 5
date-modified: 2026-11-25
review-status: approved
reviewed-sha256: 07719e766f03e502405106f5c5ae8112db2f294ddb59cbdbf0fff807e5ff5414
last-reviewed: 2026-11-27
---
# Data Platform, Module 5: Groups, Roles and the Perimeter {.unnumbered}

**Learning path:** [Data Platform and SQL Server Identity](index.md) · Module 5 of 10 · 45 minutes · Runbook [R07](../../books/b06-data-platform/r07-groups-aus-and-the-conditional-access-perimeter.md) · Workbook [Chapter 05](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md)

**Watch:** the narrated deck for this module: [Deck](https://github.com/WhalerMike/modernization-workbook/tree/main/presentations/training-dp-module-5) · [▶ Watch](../../presentations/watch.html?v=Training_DP_Module_5_Narrated) (about 10 minutes, captions) · [MP4](https://github.com/WhalerMike/modernization-workbook/releases/download/videos-2026-10-23/Training_DP_Module_5_Narrated.mp4) · [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-dp-module-5/Training_DP_Module_5_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/training-dp-module-5/Training_DP_Module_5_Narrated.vtt).

## Unit 1: Introduction

*3 minutes, with the objectives and prerequisites*

Group-based access survives the move to Entra ID. What changes is who keeps each group current and what stands in front of it. A group kept by hand from the org chart becomes a rule, a group of named administrators becomes an assigned group under PIM, and a distribution list never becomes a login. In this module you take every Active Directory group that reaches SQL Server and say which Entra group replaces it.

**The federal requirement.** [Chapter 05's federal requirements and evidence table](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#federal-requirements-and-evidence) maps the group map to NIST SP 800-53 AC-2 and AC-6, and to KSI-IAM-ELP. Runbook R07's [control states, change safety and evidence](../../books/b06-data-platform/r07-groups-aus-and-the-conditional-access-perimeter.md#b06-r07-control-states) lists the evidence each state of the provisioning phase needs. Each table's KSI column names the FedRAMP 20x Key Security Indicators to line your evidence up with; your cloud providers report against them, the agency doesn't. The map supports these controls; the assessor decides whether each one is in place.

### Learning objectives

In this module, you'll:

- Name the four AD group patterns in Book 06, *Data Platform: SQL Server Identity*, and the Entra replacement for each.
- Explain why a dynamic rule reads an HR-maintained code and excludes disabled accounts and guests.
- Run the kit's group map over fixtures and read its flags for nesting and for a privileged role on a dynamic group.
- Say which check enforces one group, one role, and why the map doesn't.

### Prerequisites

- [Module 4](04-entra-logins-and-the-parallel-run.md): its login plan is where the one-group-one-role warning comes from.

## Unit 2: One group, one role, flat by design

*8 minutes*

An Entra group reaches SQL Server as a group login, then a database user added to a role. Book 06, Chapter 16, *Groups, Roles and How Membership Reaches the Engine*, makes one rule central: each Entra group grants exactly one role, on one database, in one environment, so the group's name says what it grants. The model stays flat, because dynamic groups can't contain groups and nesting builds on behavior that is unsupported, ending or undocumented. Each legacy group then lands in one of four patterns: organization-derived groups become dynamic, explicit role groups become assigned, distribution lists become mail-only, and mail-enabled security groups split in two. Read:

- Book 06, Chapter 16: [one group, one role](../../books/b06-data-platform/16-groups-roles-and-membership.md#one-group-one-role), [flat by design](../../books/b06-data-platform/16-groups-roles-and-membership.md#flat-by-design) and [migrating the four AD group patterns](../../books/b06-data-platform/16-groups-roles-and-membership.md#migrating-the-four-ad-group-patterns).
- Runbook R07: [mapping to the four-pattern taxonomy](../../books/b06-data-platform/r07-groups-aus-and-the-conditional-access-perimeter.md#mapping-to-the-four-pattern-taxonomy).
- [Chapter 05: the group map](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#the-group-map).

## Unit 3: The attribute, PIM and the perimeter

*8 minutes*

Under dynamic membership, whoever can write the attribute a rule reads controls access. Book 06, Chapter 17, *Dynamic Membership, Delegation and Privileged Access*, therefore has rules read HR-owned codes, such as the organization code in `extensionAttribute10`, never display strings such as `department`, and every access rule excludes disabled accounts and guests. Groups that hold `sysadmin` are never dynamic: PIM for Groups doesn't work on dynamic groups or groups synchronized from on premises, so privileged groups are cloud-only and assigned. Conditional Access then sits in front of every user token, but it applies to users, not to managed identities. Read:

- Book 06, Chapter 17: [the attribute is the access control](../../books/b06-data-platform/17-dynamic-membership-delegation-and-privilege.md#the-attribute-is-the-access-control), [choosing the attributes](../../books/b06-data-platform/17-dynamic-membership-delegation-and-privilege.md#choosing-the-attributes) and [privileged access belongs in PIM, not in a rule](../../books/b06-data-platform/17-dynamic-membership-delegation-and-privilege.md#privileged-access-belongs-in-pim-not-in-a-rule).
- Book 06, Chapter 16: [Conditional Access as the outer perimeter](../../books/b06-data-platform/16-groups-roles-and-membership.md#conditional-access-as-the-outer-perimeter).
- Runbook R07: [provision attribute-based dynamic groups](../../books/b06-data-platform/r07-groups-aus-and-the-conditional-access-perimeter.md#provision-attribute-based-dynamic-groups-entra-dynamic-groups) and [the perimeter dividend](../../books/b06-data-platform/r07-groups-aus-and-the-conditional-access-perimeter.md#the-perimeter-dividend).
- [Chapter 05: what it leaves to you](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#what-it-leaves-to-you) and [dangers](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#dangers).

## Unit 4: Exercise: Lab 1 (fixtures, no tenant)

*19 minutes*

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity

$Run = "C:\FMWLabs\results\data-platform-05-groups-roles-and-the-perimeter\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Map the fictional estate's groups
./Invoke-SqlGroupMap.ps1 -GroupsPath tests/fixtures/groups/groups.json -OutputPath "$Run\groups"

# Step 2: Read what each group grants
Import-Csv "$Run\groups\groups.csv" | Format-Table Group, Members, Grants, Flags -Wrap

# Step 3: Pretend the sysadmin group were kept by the org chart
Import-Module ./powershell/SqlIdentity/SqlIdentity.psd1
$admins = (Read-SqlJson tests/fixtures/groups/groups.json).groups | Where-Object name -eq 'CONTOSO\SQL-Admins'
$admins.membershipBasis = 'org-chart'
Get-SqlGroupPattern -Groups $admins | Format-List Group, Pattern, Target, Flags

# Step 4: Open the manifest
Get-Content "$Run\groups\manifest.json"

# Step 5: Run this chapter's tests
Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 05*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table

# Step 6: List your runs
Get-ChildItem C:\FMWLabs\results\data-platform-05-groups-roles-and-the-perimeter\lab1 -Name
```

:::

<!-- labs:end -->

You run the workbook chapter's Lab 1 on the kit's fictional estate. [Chapter 05, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#lab-1-fixtures-no-tenant) explains each result in more depth.

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, maximize the window (a narrow window wraps or cuts the widest table columns), then go to the kit's folder, where you unzipped it under [Get the code](index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\sql-server-identity-code\sql-server-identity
```

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\data-platform-05-groups-roles-and-the-perimeter\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\data-platform-05-groups-roles-and-the-perimeter\lab1\<run>
```

The run's date is only the folder's name. The data's dates are the fixtures' own, so every run's output matches this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it. The kit prints the folders it writes with forward slashes (`C:/FMWLabs/results/...`), which Windows reads the same way.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/sql-server-identity-code/sql-server-identity`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Map the fictional estate's groups.** One of each pattern, and a second dynamic group with a nested group:

   ```powershell
   ./Invoke-SqlGroupMap.ps1 -GroupsPath tests/fixtures/groups/groups.json -OutputPath "$Run\groups"
   ```

   ```text
   Group                    Pattern Target                                                                                                                                                              Flags
   -----                    ------- ------                                                                                                                                                              -----
   CONTOSO\PayrollUsers           1 Dynamic group, rule (user.extensionAttribute10 -in ["FIN-PAY"]) -and (user.accountEnabled -eq true) -and (user.userType -eq "Member"); never department or jobTitle
   CONTOSO\SQL-Admins             2 Assigned group, eligible through PIM (privileged server role)
   CONTOSO\SQL-Agent-Alerts       3 Mail-only group; update the SQL Server Agent operator address; no login
   CONTOSO\ClaimsTeam             4 Split: a mail-only group plus an assigned security group; record the pairing in both descriptions
   CONTOSO\HR-Analysts            1 Dynamic group, rule (user.extensionAttribute10 -in ["HR-ANL"]) -and (user.accountEnabled -eq true) -and (user.userType -eq "Member"); never department or jobTitle  nested: flatten (CONTOSO\HR-Leads)

   Wrote 2 files and manifest.json to C:/FMWLabs/results/data-platform-05-groups-roles-and-the-perimeter/lab1/<run>/groups
   Evidence for GROUPS (Map each AD group pattern to its Entra group): AC-2, AC-6; KSI-IAM-ELP
   ```

   Each dynamic rule carries the code and the exclusion of disabled accounts and guests. With the rules this long, PowerShell drops the `Flags` column from the table; step 2 prints it.

2. **Read what each group grants.** `CONTOSO\SQL-Admins` holds `sysadmin`; the distribution list grants nothing:

   ```powershell
   Import-Csv "$Run\groups\groups.csv" | Format-Table Group, Members, Grants, Flags -Wrap
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

   The group has no organization codes, so the target says to ask HR for the code rather than write a rule. The flag is what matters: a privileged role never sits on a rule.

4. **Open the manifest.** GROUPS supports AC-2 and AC-6:

   ```powershell
   Get-Content "$Run\groups\manifest.json"
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

5. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/SqlIdentity.Tests.ps1 -FullNameFilter 'Chapter 05*' -Output None -PassThru | Select-Object PassedCount, FailedCount | Format-Table
   ```

   ```text
   PassedCount FailedCount
   ----------- -----------
             4           0
   ```

6. **List your runs.** Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

   ```powershell
   Get-ChildItem C:\FMWLabs\results\data-platform-05-groups-roles-and-the-perimeter\lab1 -Name
   ```

   Expected output: one line per run, oldest first, the last one this run:

   ```text
   <run>
   ```

**Check your work:** you can say which Entra group replaces each of the fictional estate's five groups, and why the map refuses to make the `sysadmin` group dynamic.

## Unit 5: Exercise: Lab 2 (your test instance)

*Not timed. Not run by the authors.*

Map your test domain's groups with the kit, list the test tenant's groups with Microsoft Graph PowerShell, read-only, and put the kit's answer beside what the tenant has. Nothing in the lab writes to the tenant. Follow [Chapter 05, Lab 2](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#lab-2-a-test-tenant).

<!-- labs:begin module-lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #module-lab-2-commands collapse="false" title="The Lab 2 commands, against your test environment"}
Every command in [Chapter 05, Lab 2](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#lab-2-a-test-tenant), in order, against your test environment, never production.

Replace each `<placeholder>` with your test environment's value.

The chapter's steps say what each command does and what to look for.

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

- **You need:** a test tenant whose groups are synchronized from a test domain, never production (a Microsoft 365 GCC tenant uses the worldwide Graph endpoint); PowerShell 7 with the Microsoft Graph PowerShell SDK (`Microsoft.Graph.Groups`); an account that can consent to the delegated `Group.Read.All` permission; and a groups file for your test domain's groups that reach SQL Server, in the shape of the kit's fixture.
- **Back it out:** nothing was written; step 6 signs out with `Disconnect-MgGraph` and deletes `out/lab2-groups`.

## Unit 6: Knowledge check

*5 minutes*

1. What does the kit's dynamic rule for an org-chart group read?
   a. `user.department`, with no other clauses.
   b. The HR organization code in `user.extensionAttribute10`, with `accountEnabled` and `userType` clauses.
   c. `user.jobTitle` and the group's nested members.

2. You mark `CONTOSO\SQL-Admins`, which holds `sysadmin`, as kept by the org chart. What does the map do?
   a. Writes a dynamic rule for it.
   b. Flags a privileged role on a dynamic group: use an assigned group under PIM instead.
   c. Drops it from the map as a distribution list.

3. `CONTOSO\HR-Analysts` contains `CONTOSO\HR-Leads`. Why does the map flag it `nested: flatten`?
   a. A dynamic rule can't select groups, so the inner group's members would drop out.
   b. Nested groups can't be synchronized to Entra ID.
   c. Conditional Access can't evaluate nested groups.

4. `CONTOSO\PayrollUsers` reaches two databases on SQLPRD01. Which check catches the one-group-one-role problem?
   a. The group map, with a flag on the group.
   b. Chapter 04's login plan, whose warning names the roles; the map carries grants per instance, not roles per database.
   c. Conditional Access, at sign-in.

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** See [Chapter 05: the group map](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#the-group-map) and Book 06, [Chapter 17: choosing the attributes](../../books/b06-data-platform/17-dynamic-membership-delegation-and-privilege.md#choosing-the-attributes).
2. **b.** See step 3 of [Chapter 05, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#lab-1-fixtures-no-tenant) and Book 06, [Chapter 17: privileged access belongs in PIM, not in a rule](../../books/b06-data-platform/17-dynamic-membership-delegation-and-privilege.md#privileged-access-belongs-in-pim-not-in-a-rule).
3. **a.** See Book 06, [Chapter 16: flat by design](../../books/b06-data-platform/16-groups-roles-and-membership.md#flat-by-design) and [Chapter 05: dangers](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#dangers).
4. **b.** See step 2 of [Chapter 05, Lab 1](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#lab-1-fixtures-no-tenant) and [Chapter 05: the group map](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#the-group-map).
:::

## Unit 7: Summary

*2 minutes*

You sorted the fictional estate's groups into dynamic, assigned, mail-only and split targets, and saw the map refuse to put a privileged role on a rule. Group logins, PIM and Conditional Access now decide who reaches SQL Server, in place of hand-kept AD groups.

**Evidence an ISSO keeps from this module:** `groups.csv` and `groups.json` with `manifest.json`, which records the step, its controls and KSIs, and the SHA-256 of each file; the Lab 2 comparison; and the record of which groups went under PIM (Chapter 05). Before shipping, work through the [Chapter 05 checklist](../../project-plans/developer-workbooks/sql-server-identity/05-groups-roles-and-the-perimeter.md#checklist).

::: {.callout-tip}
## Continue the path
[Previous: Module 4](04-entra-logins-and-the-parallel-run.md) · [Learning path](index.md) · [Next: Module 6, NTLM and the SPNs →](06-ntlm-and-the-spns.md)
:::
