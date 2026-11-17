---
title: "Chapter 05 — The Compliant Network and Tenant Restrictions"
description: "The guide's Steps 7 and 8 as code: the compliant network policy as a reviewed file, checked for its block outside the compliant network location, its emergency access and Intune exclusions, no Private Access app in scope, and ten business days in report-only with no failure carried by the service before -AllowEnforce lets a plan enforce it; universal tenant restrictions checked for a blocking TRv2 default, every partner allowance in the exception register, and tagging only after the default blocks. Labs against a fictional tenant's fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-global-secure-access
part: How
series-order: 5
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
last-reviewed: 2026-11-17
---
# Chapter 05 — The Compliant Network and Tenant Restrictions

*Two settings that only Microsoft Entra can provide, and two of the easiest ways to lock users out. The code's job is to say when each is safe to enforce.*

::: {.callout-note}
## In this chapter
The code behind the guide's [Step 7: Compliant network](../../../books/guides/global-secure-access-implementation.md#step-7-compliant-network) and [Step 8: Tenant restrictions](../../../books/guides/global-secure-access-implementation.md#step-8-tenant-restrictions). The design is [Book 04, Chapter 07's network traffic family](../../../books/b04-access/07-the-conditional-access-policy-library.md#optional-family-conditional-access-on-network-traffic) and [Book 04, Appendix C's TRv2 policy](../../../books/b04-access/appendix-c-partner-access-profile-entra.md#tenant-restrictions-v2-the-outbound-edge). You read checks GSA-CN-01 to -07 and GSA-TR-01 to -04 and the plan's `-AllowEnforce` gate. Lab 1 finds the pilot's compliant network policy not ready (the service carried three report-only failures) and an unregistered partner tenant, and shows the plan refusing to enforce. Lab 2 creates the policy report-only in a test tenant, runs Learn's disable-and-retry test, turns tagging on and backs both out.
:::

## Goal and audience

**Goal.** By the end of this chapter you can keep the compliant network policy and the tenant restrictions as reviewed configuration, show when the compliant network policy is ready to enforce, and show that agency devices can sign in only to the tenants the register allows.

**Audience.** Developers who build or maintain the kit, the identity engineer who runs the policies, and the policy owner who decides enforcement. You don't need a tenant until Lab 2.

## Start with Microsoft's documentation

### What Microsoft gives you

The compliant network check passes only for users connected through the tenant's own Global Secure Access; Learn's example policy blocks all resources outside the **All Compliant Network locations** named location, excludes **Microsoft Intune Enrollment** and **Microsoft Intune** to avoid a circular dependency, and excludes emergency access; the check isn't supported for Private Access apps; and turning signaling off while policies depend on it can block users.[^gsa05-cn] [^gsa05-limits] The named location is listed with `$filter=isof('microsoft.graph.compliantNetworkNamedLocation')`, with `Policy.Read.All`.[^gsa05-nl] Learn's tutorial validates by disabling the client and signing in again.[^gsa05-tut] Universal tenant restrictions apply the TRv2 policy to traffic the Microsoft profile carries, with `networkPacketTaggingStatus` on `/networkAccess/settings/crossTenantAccess`; Learn's test is four cases (member, allowed partner, blocked tenant, guest) and its block query looks for error `5000211`.[^gsa05-utr] [^gsa05-tag] [^gsa05-opsms] The TRv2 default is read from `/policies/crossTenantAccessPolicy/default` with `Policy.Read.All`.[^gsa05-trv2]

### What it leaves to you

Each row is pinned by a test in the `Chapter 05` and `Plans` blocks of `tests/GlobalSecureAccess.Tests.ps1`.

| Learn's material, as published | Why it matters | What the kit adds |
|---|---|---|
| Learn's example creates the policy **On** | The guide starts every library policy in report-only | `config/policies/NET-CN-Require-Compliant-Network-Pilot.json` is report-only; the plan keeps new policies report-only |
| No rule for when report-only is done | Enforcement by calendar, or by feel | GSA-CN-06: 10 business days since the policy was created and no `reportOnlyFailure` with `Through` `true` (the guide's defect rule); the plan won't enforce without `-AllowEnforce` |
| Exclusions in prose | One missing exclusion locks out enrollment or the emergency accounts | GSA-CN-03 and -04 check both; the plan refuses a file without the emergency exclusion |
| "Not supported for Private Access apps" | A tenant-wide policy can still include one | GSA-CN-05 compares the policy's apps with the Private Access apps |
| Tagging is a tenant-wide toggle | Turned on with a default that allows everything, it enforces nothing; with a default that blocks, it is the control | GSA-TR-03 and the plan require a blocking default before tagging |
| Partner allowances in the cross-tenant policy | Nobody remembers why a tenant is allowed | GSA-TR-02 requires a `trv2-partner` row in the exception register with an owner and a review date |

## The code

| Check | What it looks for |
|---|---|
| GSA-CN-01 | A `compliantNetworkNamedLocation` exists (it appears when signaling is turned on) |
| GSA-CN-02 | Each `NET-CN-` policy blocks, and excludes that location |
| GSA-CN-03, -04 | The emergency access group and both Intune applications are excluded |
| GSA-CN-05 | No Private Access app is in the policy's scope |
| GSA-CN-06 | In report-only: business days since creation, and failures carried by the service; *Info* until ready |
| GSA-CN-07 | When enforced, signaling is on |
| GSA-TR-01 | The TRv2 default blocks all users and all applications |
| GSA-TR-02 | Each partner with a tenant restrictions allowance is in the register, current |
| GSA-TR-03 | Tagging is on only with a blocking default |
| GSA-TR-04 | Each resource tenant in the block query, flagged when it isn't a registered partner (*Info*, for the weekly review) |

::: {.callout-important}
## Illustrative code
Lab 1 reads fixtures; nothing signs in. Tested against fixtures and stand-in runners, not a live tenant.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5. Work in `examples/global-secure-access`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/global-secure-access`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what the two areas read
Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1
Get-GsaRequiredPermission -Area compliant-network | Format-Table
Get-GsaRequiredPermission -Area tenant-restrictions | Format-Table

# Step 2: Collect the pilot tenant
./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -OutputPath out/pilot -AsOf 2026-11-16T12:00:00Z

# Step 3: Check the compliant network policy
./Invoke-GsaCheck.ps1 -Area compliant-network -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-cn -AsOf 2026-11-16T12:00:00Z

# Step 4: Read the guide's report-only query
(Read-GsaCollection -Path out/pilot)['law-query']['cn-report-only'] | ForEach-Object { [pscustomobject]$_ } | Format-Table Result, Through, count_

# Step 5: Check the tenant restrictions
./Invoke-GsaCheck.ps1 -Area tenant-restrictions -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-tr -AsOf 2026-11-16T12:00:00Z

# Step 6: Plan ring 1, which wants the policy enforced
./Invoke-GsaPlan.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -DesiredPath config/desired.ring1.json -OutputPath out/plan-ring1 -AsOf 2026-11-16T12:00:00Z

# Step 7: Check the same policy two weeks later, enforced
./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json -FixturePath tests/fixtures/ring1 -OutputPath out/ring1 -AsOf 2026-11-30T12:00:00Z
./Invoke-GsaCheck.ps1 -Area compliant-network, tenant-restrictions -SettingsPath tests/fixtures/settings.lab-ring1.json -CollectionPath out/ring1 -InputsPath tests/fixtures/ring1/inputs -OutputPath out/check-ring1 -AsOf 2026-11-30T12:00:00Z

# Step 8: Run this chapter's tests
Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Chapter 05*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what the two areas read:**

   ```powershell
   Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1
   Get-GsaRequiredPermission -Area compliant-network | Format-Table
   Get-GsaRequiredPermission -Area tenant-restrictions | Format-Table
   ```

   <!-- capture:begin 05-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/05-1.txt))](captures/05-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1 and what it printed"}

   <!-- capture:end -->

2. **Collect the pilot tenant:**

   ```powershell
   ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -OutputPath out/pilot -AsOf 2026-11-16T12:00:00Z
   ```

   <!-- capture:begin 05-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/05-2.txt))](captures/05-2.png){.lightbox fig-alt="Terminal window showing ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -Fixtu… and what it printed"}

   <!-- capture:end -->

3. **Check the compliant network policy:**

   ```powershell
   ./Invoke-GsaCheck.ps1 -Area compliant-network -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-cn -AsOf 2026-11-16T12:00:00Z
   ```

   <!-- capture:begin 05-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/05-3.txt))](captures/05-3.png){.lightbox fig-alt="Terminal window showing ./Invoke-GsaCheck.ps1 -Area compliant-network -SettingsPath tests/fixtures/se… and what it printed"}

   <!-- capture:end -->

   The policy is built right (GSA-CN-01 to -05 pass), and it has been in report-only for 10 business days, but GSA-CN-06 says it isn't ready: the service carried three report-only failures.

4. **Read the guide's report-only query,** as the workspace returned it. The 41 failures with `Through` `false` are users off the service, which is what the policy is for; the three with `Through` `true` are defects:

   ```powershell
   (Read-GsaCollection -Path out/pilot)['law-query']['cn-report-only'] | ForEach-Object { [pscustomobject]$_ } | Format-Table Result, Through, count_
   ```

   <!-- capture:begin 05-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/05-4.txt))](captures/05-4.png){.lightbox fig-alt="Terminal window showing (Read-GsaCollection -Path out/pilot)['law-query']['cn-report-only'] | ForEach… and what it printed"}

   <!-- capture:end -->

5. **Check the tenant restrictions:**

   ```powershell
   ./Invoke-GsaCheck.ps1 -Area tenant-restrictions -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-tr -AsOf 2026-11-16T12:00:00Z
   ```

   <!-- capture:begin 05-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/05-5.txt))](captures/05-5.png){.lightbox fig-alt="Terminal window showing ./Invoke-GsaCheck.ps1 -Area tenant-restrictions -SettingsPath tests/fixtures/… and what it printed"}

   <!-- capture:end -->

   The default blocks and tagging is on, but one partner tenant is allowed with no register entry, and the block query shows an unregistered tenant to review.

6. **Plan ring 1, which wants the policy enforced.** Without `-AllowEnforce` the plan leaves it report-only and says why:

   ```powershell
   ./Invoke-GsaPlan.ps1 -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -DesiredPath config/desired.ring1.json -OutputPath out/plan-ring1 -AsOf 2026-11-16T12:00:00Z
   ```

   <!-- capture:begin 05-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/05-6.txt))](captures/05-6.png){.lightbox fig-alt="Terminal window showing ./Invoke-GsaPlan.ps1 -SettingsPath tests/fixtures/settings.lab.json -Collecti… and what it printed"}

   <!-- capture:end -->

   Look for `MAN-ENF`. A reviewer passes `-AllowEnforce` only once step 3's check passes.

7. **Check the same policy two weeks later, enforced:**

   ```powershell
   ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json -FixturePath tests/fixtures/ring1 -OutputPath out/ring1 -AsOf 2026-11-30T12:00:00Z
   ./Invoke-GsaCheck.ps1 -Area compliant-network, tenant-restrictions -SettingsPath tests/fixtures/settings.lab-ring1.json -CollectionPath out/ring1 -InputsPath tests/fixtures/ring1/inputs -OutputPath out/check-ring1 -AsOf 2026-11-30T12:00:00Z
   ```

   <!-- capture:begin 05-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/05-7.txt))](captures/05-7.png){.lightbox fig-alt="Terminal window showing ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json … and what it printed"}

   <!-- capture:end -->

   GSA-CN-07 passes (enforced, signaling on), and the unregistered partner is gone.

8. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Chapter 05*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 05-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/05-8.txt))](captures/05-8.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Chapt… and what it printed"}

   <!-- capture:end -->

**Expected result:** `FailedCount` 0. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 05-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/gsa/05-9.txt))](captures/05-9.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant

Use a test tenant with the Microsoft traffic profile on for a pilot group (Chapter 04), a test device with the client, an emergency access group, and a second test tenant to act as the partner, never production. **The authors haven't run this lab.** Work in `examples/global-secure-access`. Activate Conditional Access Administrator and Global Secure Access Administrator through PIM for the lab only. You'll replace: `<tenant-id>`, `<settings-file>` (with `apps.intuneEnrollment` and `apps.intune` from step 2), `<inputs-folder>`, `<desired-file>` (a copy of `config/desired.lab.json` whose `conditionalAccess` lists only the compliant network policy file), `<plan-sha256>`, `<workspace-guid>` and `<policy-id>` (the policy the plan created).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/global-secure-access`. Each step below says what it does and what to look for.

```powershell
# Step 1: Sign in
Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes "NetworkAccess.ReadWrite.All","Policy.Read.All","Policy.ReadWrite.ConditionalAccess","Application.Read.All","Directory.ReadWrite.All","LicenseAssignment.Read.All","NetworkAccessPolicy.Read.All"

# Step 2: Find the two Intune applications to exclude
Get-MgServicePrincipal -Filter "displayName eq 'Microsoft Intune Enrollment'" | Select-Object AppId
Get-MgServicePrincipal -Filter "displayName eq 'Microsoft Intune'" | Select-Object AppId

# Step 3: Collect, plan and apply the report-only policy
./Invoke-GsaCollect.ps1 -SettingsPath <settings-file> -OutputPath out/before -AllowUnverified
./Invoke-GsaPlan.ps1 -SettingsPath <settings-file> -CollectionPath out/before -DesiredPath <desired-file> -OutputPath out/plan-cn
./Invoke-GsaPlan.ps1 -SettingsPath <settings-file> -CollectionPath out/before -DesiredPath <desired-file> -OutputPath out/plan-cn -Apply -ApprovedSha256 <plan-sha256>

# Step 4: Run Learn's test
az monitor log-analytics query --workspace <workspace-guid> --analytics-query "SigninLogs | where TimeGenerated > ago(1d) | mv-expand CAP = ConditionalAccessPolicies | where tostring(CAP.displayName) == 'NET-CN-Require-Compliant-Network-Pilot' | summarize count() by Result = tostring(CAP.result), Through = tostring(IsThroughGlobalSecureAccess)" -o table

# Step 5: Read the TRv2 policy and check the tenant restrictions
./Invoke-GsaCollect.ps1 -SettingsPath <settings-file> -OutputPath out/after -AllowUnverified
./Invoke-GsaCheck.ps1 -Area compliant-network, tenant-restrictions -SettingsPath <settings-file> -CollectionPath out/after -InputsPath <inputs-folder> -OutputPath out/check-test

# Step 7: Back it out
Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<policy-id>"
Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess" -Body '{"networkPacketTaggingStatus":"disabled"}' -ContentType "application/json"
Disconnect-MgGraph
Remove-Item -Recurse -Force out/before, out/plan-cn, out/after, out/check-test
```

:::

<!-- labs:end -->

1. **Sign in:**

   ```powershell
   Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes "NetworkAccess.ReadWrite.All","Policy.Read.All","Policy.ReadWrite.ConditionalAccess","Application.Read.All","Directory.ReadWrite.All","LicenseAssignment.Read.All","NetworkAccessPolicy.Read.All"
   ```

2. **Find the two Intune applications to exclude** (the guide's Step 7.2), and put their app IDs in the settings file:

   ```powershell
   Get-MgServicePrincipal -Filter "displayName eq 'Microsoft Intune Enrollment'" | Select-Object AppId
   Get-MgServicePrincipal -Filter "displayName eq 'Microsoft Intune'" | Select-Object AppId
   ```

3. **Collect, plan and apply the report-only policy:**

   ```powershell
   ./Invoke-GsaCollect.ps1 -SettingsPath <settings-file> -OutputPath out/before -AllowUnverified
   ./Invoke-GsaPlan.ps1 -SettingsPath <settings-file> -CollectionPath out/before -DesiredPath <desired-file> -OutputPath out/plan-cn
   ./Invoke-GsaPlan.ps1 -SettingsPath <settings-file> -CollectionPath out/before -DesiredPath <desired-file> -OutputPath out/plan-cn -Apply -ApprovedSha256 <plan-sha256>
   ```

4. **Run Learn's test.** On the test device, signed in as a pilot user: sign in to an in-scope app with the client on; disable the client from the tray, open a new browser session and sign in again; the report-only result is a failure (enforced, it would be "You can't access this right now"); re-enable the client. Then read the results:

   ```powershell
   az monitor log-analytics query --workspace <workspace-guid> --analytics-query "SigninLogs | where TimeGenerated > ago(1d) | mv-expand CAP = ConditionalAccessPolicies | where tostring(CAP.displayName) == 'NET-CN-Require-Compliant-Network-Pilot' | summarize count() by Result = tostring(CAP.result), Through = tostring(IsThroughGlobalSecureAccess)" -o table
   ```

5. **Read the TRv2 policy and check the tenant restrictions.** If the default doesn't block, stop: set it from Book 04, Appendix C first:

   ```powershell
   ./Invoke-GsaCollect.ps1 -SettingsPath <settings-file> -OutputPath out/after -AllowUnverified
   ./Invoke-GsaCheck.ps1 -Area compliant-network, tenant-restrictions -SettingsPath <settings-file> -CollectionPath out/after -InputsPath <inputs-folder> -OutputPath out/check-test
   ```

6. **Run Learn's four-case test** from the test device with the client on: a member signs in normally; an account from the partner test tenant signs in; an account from a tenant the policy doesn't allow is blocked; a guest in the test tenant isn't evaluated. Record each outcome in the change record.

7. **Back it out:** delete the lab's policy and turn tagging off if the lab turned it on. The TRv2 policy stays:

   ```powershell
   Invoke-MgGraphRequest -Method DELETE -Uri "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies/<policy-id>"
   Invoke-MgGraphRequest -Method PATCH -Uri "https://graph.microsoft.com/beta/networkAccess/settings/crossTenantAccess" -Body '{"networkPacketTaggingStatus":"disabled"}' -ContentType "application/json"
   Disconnect-MgGraph
   Remove-Item -Recurse -Force out/before, out/plan-cn, out/after, out/check-test
   ```

## Verified facts

| Item | Value | GCC | Stage | Source |
|---|---|---|---|---|
| Compliant network check | Client or remote network of this tenant; Intune exclusions; emergency access excluded; not for Private Access apps | Available (product-wide) | GA | [^gsa05-cn] [^gsa05-limits] |
| Named location | `compliantNetworkNamedLocation`; `Policy.Read.All` | Global service | Beta | [^gsa05-nl] |
| Signaling caution | Turning it off with dependent policies can block users | — | — | [^gsa05-cn] |
| Tagging | `networkPacketTaggingStatus`; read `NetworkAccess.Read.All`, update `NetworkAccess.ReadWrite.All` | Global service | Beta | [^gsa05-tag] |
| TRv2 default | `GET /policies/crossTenantAccessPolicy/default`; `Policy.Read.All`; `tenantRestrictions.usersAndGroups` and `.applications` `accessType` | Global service | Beta (read here) | [^gsa05-trv2] |
| Tests | Disable-and-retry; four-case matrix; block error `5000211` | — | — | [^gsa05-tut] [^gsa05-utr] [^gsa05-opsms] |

The partners list (`/policies/crossTenantAccessPolicy/partners`) wasn't read on Learn for the kit; its call is marked unverified (research gap 3).

## Federal requirements and evidence

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The compliant network policy as a reviewed file, with its exclusions (Lab 1, step 3; Lab 2, step 3: `plan.json`) | AC-3 (access enforcement), SC-23 (session authenticity) | KSI-IAM-ELP, KSI-CNA-ULN | The identity engineer |
| Report-only results read before enforcement, and enforcement only with `-AllowEnforce` (Lab 1, steps 3, 4 and 6; Lab 2, step 4) | AC-3; AC-12 (session termination); CM-4 | KSI-IAM-APM | The policy owner approves enforcement |
| The TRv2 default blocks, partners are registered, tagging is on (Lab 1, steps 5 and 7; Lab 2, steps 5 and 6) | AC-20 (use of external systems), AC-20(1), AC-4 | KSI-IAM-ELP, KSI-CNA-MAT | The identity engineer, with the partner register |

The kit's records support these controls; the agency's assessor decides them.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Enforced before the client is everywhere | Users without a working client are blocked | GSA-CN-06; `-AllowEnforce`; Chapter 03's coverage first |
| The Intune applications not excluded | New devices can't enroll, so they never get the client | GSA-CN-04 |
| The emergency group in scope | Lockout during an incident | GSA-CN-03; the plan refuses the file |
| A Global Secure Access outage | Compliant-network-protected resources unreachable | Microsoft's break-glass scripts, rehearsed (Chapter 08's ring record) |
| Tagging with an allowing default | Looks enabled, restricts nothing | GSA-TR-03; the plan refuses |
| A partner allowance nobody owns | Data can leave to that tenant indefinitely | GSA-TR-02 |

## Checklist

- [ ] The compliant network policy was report-only for 10 business days with no failure carried by the service.
- [ ] Both Intune applications and the emergency access group are excluded; no Private Access app is in scope.
- [ ] `-AllowEnforce` was passed by the policy owner, on the record, after the report-only result was clean.
- [ ] Learn's disable-and-retry test and the four-case tenant restrictions test were run and recorded.
- [ ] The TRv2 default blocks, and every partner allowance has a register entry with an owner and a review date.

::: {.callout-tip}
## Continue the book
[← Chapter 04 — Microsoft Traffic and Change Plans](04-microsoft-traffic-and-change-plans.md) · [Workbook index](index.md) · [Next: Chapter 06 — Private Applications and Administrative Paths →](06-private-apps-and-admin-paths.md)
:::

[^gsa05-cn]: Microsoft Learn, "Enable compliant network check with Conditional Access," <https://learn.microsoft.com/entra/global-secure-access/how-to-compliant-network> (read November 11, 2026, for the guide).
[^gsa05-limits]: Microsoft Learn, "Known limitations for Global Secure Access," access controls, <https://learn.microsoft.com/entra/global-secure-access/reference-current-known-limitations> (read November 11, 2026, for the guide).
[^gsa05-nl]: Microsoft Learn, "List namedLocations" (Microsoft Graph beta), Example 5, <https://learn.microsoft.com/graph/api/conditionalaccessroot-list-namedlocations?view=graph-rest-beta> (accessed November 17, 2026).
[^gsa05-tut]: Microsoft Learn, "Tutorial: Enable the compliant network check," <https://learn.microsoft.com/entra/global-secure-access/tutorial-microsoft-traffic-compliant-network> (read November 11, 2026, for the guide).
[^gsa05-utr]: Microsoft Learn, "Turn on Universal Tenant Restrictions," <https://learn.microsoft.com/entra/global-secure-access/how-to-universal-tenant-restrictions> (read November 11, 2026, for the guide).
[^gsa05-tag]: Microsoft Learn, "Get crossTenantAccessSettings" (Microsoft Graph beta), <https://learn.microsoft.com/graph/api/networkaccess-crosstenantaccesssettings-get?view=graph-rest-beta> (accessed November 17, 2026).
[^gsa05-opsms]: Microsoft Learn, "Operate Microsoft Entra Global Secure Access Microsoft traffic profile," tenant restriction block query, <https://learn.microsoft.com/entra/global-secure-access/how-to-operate-microsoft-traffic> (read November 11, 2026, for the guide).
[^gsa05-trv2]: Microsoft Learn, "Get crossTenantAccessPolicyConfigurationDefault" (Microsoft Graph beta), <https://learn.microsoft.com/graph/api/crosstenantaccesspolicyconfigurationdefault-get?view=graph-rest-beta> (accessed November 17, 2026).
