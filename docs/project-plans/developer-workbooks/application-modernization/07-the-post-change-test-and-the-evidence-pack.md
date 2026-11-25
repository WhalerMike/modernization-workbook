---
title: "Chapter 07 — The Post-Change Test and the Evidence Pack"
description: "Book 18 Appendix A's WP6 for one application, in code: the after snapshot beside the before one, the application's sign-ins since the change with any error code that began with it flagged as a backout trigger until explained, the test record, a pack sealed with a SHA-256 manifest that refuses to seal without its snapshots and test record and finds any changed, missing or unlisted file afterwards, and the kit's evidence records for every chapter, each with its controls and KSIs and chained to the one before. Lab 1 builds and seals the fictional application's pack; Lab 2 reads a test app registration's real sign-ins and seals its pack."
doc-type: workbook-chapter
audience: [Technical]
family: dw-application-modernization
part: How
series-order: 7
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 07 — The Post-Change Test and the Evidence Pack

*Fifty applications through the factory should leave fifty packs an assessor can read the same way, each sealed so that a changed file shows.*

::: {.callout-note}
## In this chapter
[Appendix A's WP6](../../../books/b18-application-modernization/appendix-a-identity-remediation-work-packages.md#wp6-post-change-test) and its standard evidence pack, and the evidence record every chapter of this workbook writes. You start with what the appendix asks the post-change test and the pack to hold, then read the kit's sign-in check, the seal and the chained records. Lab 1 finishes the fictional application from Chapter 06 and seals its pack; Lab 2 does the same for the test app registration from Chapter 06's Lab 2.
:::

## Goal and audience

**Goal.** By the end of this chapter you can say whether a change broke anyone's sign-in, seal an application's pack, prove later that nothing in it changed, and line each step's evidence up with its controls and KSIs.

**Audience.** The identity platform team, the application's technical owner, who signs the test record, and the ISSO, who keeps the pack. You should have done Chapter 06's Lab 1.

## Start with the appendix and Microsoft Learn

### What they give you

Appendix A's WP6 reads the application's sign-ins since the change, treats any error code other than `0` that started after the change as a backout trigger until explained, takes the after snapshot, rebuilds the intake row, and seals the folder with a SHA-256 manifest and a test record. The sign-in log's `clientCredentialType` and `servicePrincipalCredentialKeyId` show which credential a service principal used; reading sign-ins through Graph needs Entra ID P1 or P2.[^am07-signin] [Book 13, Chapter 07](../../../books/b13-governance/07-evidence-over-attestation.md) says how the pack joins the evidence chain.

### What they leave to you

Each row is pinned by a test in `tests/Identity.Tests.ps1`.

| What the appendix gives | Why it matters | What the kit adds |
|---|---|---|
| "Any error that started after the change" | Errors that were there before look like new ones | `Get-AmSignInCheck` compares the codes after the change with the same window before it |
| "Until explained" | WP5 is meant to produce `AADSTS50105` for an unassigned user | `-Explained` lists the codes the change was meant to cause; the rest stay triggers |
| A hash manifest | A pack sealed without its snapshots or test record is incomplete | `Protect-AmEvidencePack` refuses to seal without both snapshots and `test-record.csv` (AM-PACK-01) |
| "Seal the pack" | A seal nobody checks proves nothing | `Test-AmEvidencePack` reports every changed, missing or unlisted file |
| One pack per application | The other chapters' evidence has nowhere to go | `Write-AmEvidenceRecord` for every kit step, chained by the hash of the record before |

**The verdict.** Use the sign-in log and SHA-256 as published. Build the comparison, the seal's checks and the chain.

## The code

| Function | What it does | Writes |
|---|---|---|
| `Get-AmSignInCheck` | Sign-ins after the change, and each failing code's status: new since the change, explained, a backout trigger | `wp6-signins-after.csv`, `wp6-backout-triggers.csv` |
| `New-AmTestRecord` | Appendix A's test record | `test-record.csv` |
| `Protect-AmEvidencePack` | The seal | `SHA256SUMS.txt` |
| `Test-AmEvidencePack` | Every file's state: ok, changed, missing or unlisted | Nothing |
| `Get-AmRequirement` | Each kit step's controls, KSIs and other requirements | Nothing |
| `Write-AmEvidenceRecord` | A record for one run of one step: its controls and KSIs, every file with its SHA-256, and the previous record's SHA-256 | `record-NNN-<step>.json` |
| `Test-AmEvidenceChain` | Each record's files still match, and each names the one before | Nothing |

The sign-in fixture covers a week before and a day after a change at 14:00 UTC on November 18, 2026: the reports job moving from a client secret to a certificate (WP3), the assigned users signing in, and an unassigned test user refused twice.

::: {.callout-important}
## Illustrative code
Lab 1's sign-ins and after snapshot are fixtures. The live sign-in read uses Graph beta and hasn't been run against a tenant. The seal shows that files changed; it doesn't protect them: keep the pack where the ISSO controls who can write.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.4 or later with Pester 5. Work in `examples/app-modernization`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/app-modernization`. Each step below says what it does and what to look for.

```powershell
# Step 1: Rebuild Chapter 06's pack
Import-Module ./powershell/AppModernization/AppModernization.psm1
$fx = 'tests/fixtures/identity'; $appId = '00001111-aaaa-2222-bbbb-3333cccc4444'
Get-AmAppSnapshot -AppId $appId -OutDir out/pack -Stage before -FixturePath $fx | Out-Null
Test-AmRedirectUri -SnapshotDir out/pack -OwnedDomainsPath $fx/owned-domains.txt -DnsPath $fx/dns.json -OutDir out/pack | Out-Null
New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -Keep 'https://cases.contoso.example/signin-oidc', 'https://cases.contoso.example/' -ChangeId CHG-0001 -OutDir out/pack | Out-Null
Test-AmOAuthRegression -PlanPath out/pack/wp4-redirect-plan.json -TenantId aaaabbbb-0000-cccc-1111-dddd2222eeee -FixturePath $fx/oauth-responses.json -OutDir out/pack | Out-Null
New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath $fx/reviewed-assignments.json -ChangeId CHG-0001 -OutDir out/pack | Out-Null
Get-ChildItem out/pack | ForEach-Object Name

# Step 2: Take the after snapshot, and compare it with the before
Get-AmAppSnapshot -AppId $appId -OutDir out/pack -Stage after -FixturePath $fx | Out-Null
'before', 'after' | ForEach-Object { Get-AmSnapshotSummary -SnapshotDir out/pack -Stage $_ } | Format-Table

# Step 3: Read the sign-ins since the change
Get-AmSignInCheck -AppId $appId -ChangeTime 2026-11-18T14:00:00Z -OutDir out/pack -FixturePath $fx/signins.json | Format-List
Import-Csv out/pack/wp6-backout-triggers.csv | Format-Table

# Step 4: Explain it
Get-AmSignInCheck -AppId $appId -ChangeTime 2026-11-18T14:00:00Z -OutDir out/pack -FixturePath $fx/signins.json -Explained 50105 | Format-List
Import-Csv out/pack/wp6-signins-after.csv | Format-Table

# Step 5: Try to seal the pack before the test record exists
Protect-AmEvidencePack -OutDir out/pack

# Step 6: Write the test record, and seal the pack
New-AmTestRecord -AppId $appId -ChangeId CHG-0001 -WorkPackages WP4, WP5, WP6 -Expected 'kept URIs accepted; removed refused; assigned users sign in; unassigned user gets AADSTS50105' -Observed 'as expected; 50105 explained' -Tester 'application technical owner' -Date 2026-11-19 -OutDir out/pack | Format-List
Protect-AmEvidencePack -OutDir out/pack | Format-List Files, Manifest

# Step 7: Check the seal, then change a file and check again
@(Test-AmEvidencePack -OutDir out/pack | Where-Object State -ne 'ok').Count
Add-Content out/pack/test-record.csv '"edited after sealing"'
Test-AmEvidencePack -OutDir out/pack | Where-Object State -ne 'ok' | Format-Table

# Step 8: Write the pack's evidence record, and check the chain
Get-AmRequirement -Step WP6 | Format-List
Write-AmEvidenceRecord -Step WP6 -Path out/pack/SHA256SUMS.txt, out/pack/wp6-signins-after.csv, out/pack/wp6-backout-triggers.csv -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
Test-AmEvidenceChain -Path out/evidence | Format-Table

# Step 9: Run this chapter's tests
Invoke-Pester -Path tests/Identity.Tests.ps1 -FullNameFilter 'WP6*', 'Evidence records*' -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **Rebuild Chapter 06's pack** in one step: the before snapshot, the redirect check, both plans and the regression test:

   ```powershell
   Import-Module ./powershell/AppModernization/AppModernization.psm1
   $fx = 'tests/fixtures/identity'; $appId = '00001111-aaaa-2222-bbbb-3333cccc4444'
   Get-AmAppSnapshot -AppId $appId -OutDir out/pack -Stage before -FixturePath $fx | Out-Null
   Test-AmRedirectUri -SnapshotDir out/pack -OwnedDomainsPath $fx/owned-domains.txt -DnsPath $fx/dns.json -OutDir out/pack | Out-Null
   New-AmRedirectPlan -SnapshotDir out/pack -CheckPath out/pack/wp4-redirect-check.csv -Keep 'https://cases.contoso.example/signin-oidc', 'https://cases.contoso.example/' -ChangeId CHG-0001 -OutDir out/pack | Out-Null
   Test-AmOAuthRegression -PlanPath out/pack/wp4-redirect-plan.json -TenantId aaaabbbb-0000-cccc-1111-dddd2222eeee -FixturePath $fx/oauth-responses.json -OutDir out/pack | Out-Null
   New-AmAssignmentPlan -SnapshotDir out/pack -AssignmentsPath $fx/reviewed-assignments.json -ChangeId CHG-0001 -OutDir out/pack | Out-Null
   Get-ChildItem out/pack | ForEach-Object Name
   ```

   <!-- capture:begin 07-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/07-1.txt))](captures/07-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/AppModernization/AppModernization.psm1 and what it printed"}

   <!-- capture:end -->

2. **Take the after snapshot, and compare it with the before:**

   ```powershell
   Get-AmAppSnapshot -AppId $appId -OutDir out/pack -Stage after -FixturePath $fx | Out-Null
   'before', 'after' | ForEach-Object { Get-AmSnapshotSummary -SnapshotDir out/pack -Stage $_ } | Format-Table
   ```

   <!-- capture:begin 07-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/07-2.txt))](captures/07-2.png){.lightbox fig-alt="Terminal window showing Get-AmAppSnapshot -AppId $appId -OutDir out/pack -Stage after -FixturePath $f… and what it printed"}

   <!-- capture:end -->

   Two owners (WP1), no application permission (WP2), no secret (WP3), two redirect URIs (WP4), two assignments with assignment required (WP5). The tenant-wide `User.Read` grant stays: the record justifies it.

3. **Read the sign-ins since the change:**

   ```powershell
   Get-AmSignInCheck -AppId $appId -ChangeTime 2026-11-18T14:00:00Z -OutDir out/pack -FixturePath $fx/signins.json | Format-List
   Import-Csv out/pack/wp6-backout-triggers.csv | Format-Table
   ```

   <!-- capture:begin 07-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/07-3.txt))](captures/07-3.png){.lightbox fig-alt="Terminal window showing Get-AmSignInCheck -AppId $appId -ChangeTime 2026-11-18T14:00:00Z -OutDir out/… and what it printed"}

   <!-- capture:end -->

   `50105` began with the change, so it's a backout trigger until someone explains it.

4. **Explain it:** WP5 was meant to refuse the unassigned test user:

   ```powershell
   Get-AmSignInCheck -AppId $appId -ChangeTime 2026-11-18T14:00:00Z -OutDir out/pack -FixturePath $fx/signins.json -Explained 50105 | Format-List
   Import-Csv out/pack/wp6-signins-after.csv | Format-Table
   ```

   <!-- capture:begin 07-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/07-4.txt))](captures/07-4.png){.lightbox fig-alt="Terminal window showing Get-AmSignInCheck -AppId $appId -ChangeTime 2026-11-18T14:00:00Z -OutDir out/… and what it printed"}

   <!-- capture:end -->

   No triggers. The reports job signed in with its certificate after the change.

5. **Try to seal the pack before the test record exists:**

   ```powershell
   Protect-AmEvidencePack -OutDir out/pack
   ```

   <!-- capture:begin 07-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/07-5.txt))](captures/07-5.png){.lightbox fig-alt="Terminal window showing Protect-AmEvidencePack -OutDir out/pack and what it printed"}

   <!-- capture:end -->

   Refused (AM-PACK-01).

6. **Write the test record, and seal the pack:**

   ```powershell
   New-AmTestRecord -AppId $appId -ChangeId CHG-0001 -WorkPackages WP4, WP5, WP6 -Expected 'kept URIs accepted; removed refused; assigned users sign in; unassigned user gets AADSTS50105' -Observed 'as expected; 50105 explained' -Tester 'application technical owner' -Date 2026-11-19 -OutDir out/pack | Format-List
   Protect-AmEvidencePack -OutDir out/pack | Format-List Files, Manifest
   ```

   <!-- capture:begin 07-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/07-6.txt))](captures/07-6.png){.lightbox fig-alt="Terminal window showing New-AmTestRecord -AppId $appId -ChangeId CHG-0001 -WorkPackages WP4, WP5, WP6… and what it printed"}

   <!-- capture:end -->

7. **Check the seal, then change a file and check again:**

   ```powershell
   @(Test-AmEvidencePack -OutDir out/pack | Where-Object State -ne 'ok').Count
   Add-Content out/pack/test-record.csv '"edited after sealing"'
   Test-AmEvidencePack -OutDir out/pack | Where-Object State -ne 'ok' | Format-Table
   ```

   <!-- capture:begin 07-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/07-7.txt))](captures/07-7.png){.lightbox fig-alt="Terminal window showing @(Test-AmEvidencePack -OutDir out/pack | Where-Object State -ne 'ok').Count and what it printed"}

   <!-- capture:end -->

   Nothing out of place, then `test-record.csv` changed.

8. **Write the pack's evidence record, and check the chain:**

   ```powershell
   Get-AmRequirement -Step WP6 | Format-List
   Write-AmEvidenceRecord -Step WP6 -Path out/pack/SHA256SUMS.txt, out/pack/wp6-signins-after.csv, out/pack/wp6-backout-triggers.csv -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-Table Record, Step, Files, KSIs
   Test-AmEvidenceChain -Path out/evidence | Format-Table
   ```

   <!-- capture:begin 07-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/07-8.txt))](captures/07-8.png){.lightbox fig-alt="Terminal window showing Get-AmRequirement -Step WP6 | Format-List and what it printed"}

   <!-- capture:end -->

9. **Run this chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/Identity.Tests.ps1 -FullNameFilter 'WP6*', 'Evidence records*' -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 07-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/07-9.txt))](captures/07-9.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/Identity.Tests.ps1 -FullNameFilter 'WP6*', 'Evidenc… and what it printed"}

   <!-- capture:end -->

**Expected result:** the after snapshot showing all five work packages done, one trigger that `-Explained` clears, the seal refused and then made, the edit found, a chain that checks, and the tests passing. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 07-10 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/07-10.txt))](captures/07-10.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test tenant

Use the test tenant and the test app registration from Chapter 06's Lab 2, after its step 5 and before its back-out, never production. You need what that lab needed, plus the `Microsoft.Graph.Beta.Reports` module and Reports Reader, and Entra ID P1 or P2 to read sign-ins through Graph. Work in `examples/app-modernization`, in the same session (`$app` and `out/lab`). You'll replace `<change-time>`, the UTC time WP4 was applied, such as `2026-11-24T15:00:00Z`.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/app-modernization`. Each step below says what it does and what to look for.

```powershell
# Step 1: Take the after snapshot
Connect-MgGraph -Scopes 'Application.Read.All','AuditLog.Read.All' -NoWelcome
Get-AmAppSnapshot -AppId $app.AppId -OutDir out/lab -Stage after | Format-List

# Step 2: Read the real sign-ins since the change
Get-AmSignInCheck -AppId $app.AppId -ChangeTime <change-time> -OutDir out/lab -Explained 50105 | Format-List
Import-Csv out/lab/wp6-signins-after.csv | Format-Table

# Step 3: Write the test record and seal the pack
New-AmTestRecord -AppId $app.AppId -ChangeId LAB-1 -WorkPackages WP4, WP5, WP6 -Expected 'kept URI accepted; removed refused; member signs in; non-member gets AADSTS50105' -Observed '<observed>' -Tester 'lab tester' -Date (Get-Date -Format 'yyyy-MM-dd') -OutDir out/lab
Protect-AmEvidencePack -OutDir out/lab | Format-List
Test-AmEvidencePack -OutDir out/lab | Where-Object State -ne 'ok'

# Step 4: Back it out
Remove-Item -Recurse -Force out/lab
```

:::

<!-- labs:end -->

1. **Take the after snapshot:**

   ```powershell
   Connect-MgGraph -Scopes 'Application.Read.All','AuditLog.Read.All' -NoWelcome
   Get-AmAppSnapshot -AppId $app.AppId -OutDir out/lab -Stage after | Format-List
   ```

2. **Read the real sign-ins since the change:** sign-in logs can take some minutes to appear:

   ```powershell
   Get-AmSignInCheck -AppId $app.AppId -ChangeTime <change-time> -OutDir out/lab -Explained 50105 | Format-List
   Import-Csv out/lab/wp6-signins-after.csv | Format-Table
   ```

   The member's sign-in with error `0`, and the other user's `50105`, explained.

3. **Write the test record and seal the pack:**

   ```powershell
   New-AmTestRecord -AppId $app.AppId -ChangeId LAB-1 -WorkPackages WP4, WP5, WP6 -Expected 'kept URI accepted; removed refused; member signs in; non-member gets AADSTS50105' -Observed '<observed>' -Tester 'lab tester' -Date (Get-Date -Format 'yyyy-MM-dd') -OutDir out/lab
   Protect-AmEvidencePack -OutDir out/lab | Format-List
   Test-AmEvidencePack -OutDir out/lab | Where-Object State -ne 'ok'
   ```

   Replace `<observed>` with what you saw.

4. **Back it out:** Chapter 06's Lab 2, step 7, then delete the pack, which names the test tenant's objects:

   ```powershell
   Remove-Item -Recurse -Force out/lab
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Sign-in fields | `clientCredentialType`, `servicePrincipalCredentialKeyId`, `signInEventTypes`; Graph beta; P1 or P2 | [^am07-signin] |
| Sign-in logs through Graph in GCC | Requires P1 or P2; cloud availability not stated on the resource page (*not yet specified*) | Book 18, [Appendix A](../../../books/b18-application-modernization/appendix-a-identity-remediation-work-packages.md#wp-government-clouds) |
| SHA-256 | FIPS 180-4 | [^am07-fips180] |
| The kit's tests | 37 Pester tests pass | Lab 1, November 24, 2026 |

## Federal requirements and evidence

The record's controls and KSIs are the kit's `config/requirements.json`, step `WP6`. Every chapter's step and its record:[^am07-oscal] [^am07-ksi]

| Step | Chapter | Controls it supports | KSIs it aligns to |
|---|---|---|---|
| `CONTRACT` | 01 | CM-2, CM-3(2) | KSI-SVC-ACM, KSI-CMT-VTD |
| `LOAD` | 02 | CM-3, CM-3(2) | KSI-CMT-LMC, KSI-CMT-VTD |
| `PROVE` | 03 | CM-3(2), CM-4(2) | KSI-CMT-VTD |
| `AGENT` | 04 | AC-6, AU-2, AU-12; OMB M-25-21 | KSI-IAM-ELP, KSI-MLA-LET |
| `A11Y` | 05 | CM-3(2); Section 508, M-24-08 | KSI-CMT-VTD |
| `SNAPSHOT` | 06 | CM-8, CM-2 | KSI-PIY-GIV, KSI-SVC-ACM |
| `WP4` | 06 | SC-7, CM-3(2) | KSI-CNA-MAT, KSI-CMT-VTD |
| `WP5` | 06 | AC-2, AC-6 | KSI-IAM-AAM, KSI-IAM-ELP |
| `WP6` | 07 | CA-7, CM-8, AU-9 | KSI-MLA-EVC, KSI-PIY-GIV, KSI-MLA-OSM |

: Every kit step, the controls its evidence supports and the KSIs it aligns to {.striped .hover}

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The change was followed by a test of real sign-ins, with any new failure explained (Lab 1, steps 3 and 4; Lab 2, step 2) | CA-7, Continuous Monitoring | KSI-MLA-EVC | The technical owner signs the test record |
| The governance record matches the tenant after the change (Lab 1, step 2) | CM-8, System Component Inventory | KSI-PIY-GIV | The identity governance office |
| The pack can't change unnoticed (Lab 1, steps 6 and 7; Lab 2, step 3) | AU-9, Protection of Audit Information | KSI-MLA-OSM | The ISSO keeps the pack where only they can write |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them. The kit's records support these controls; the agency's assessor decides them *(design guidance)*.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| An old failure read as new | A good change is backed out | The before window |
| A new failure explained away | A broken sign-in stays broken | Only codes named in `-Explained` are cleared, and the test record says why |
| A pack sealed without its test record | An assessor can't tell what was tested | AM-PACK-01 |
| A file edited after sealing | The pack no longer shows what happened | `Test-AmEvidencePack`; the chain's next record |
| Row contents or tokens in the pack | Personal data in the evidence | Snapshots hold object IDs and settings; secrets' values are never readable |

## Checklist

- [ ] The after snapshot is in the pack, and the summary shows each needed work package done or excused.
- [ ] No backout trigger is open; each explained code is in the test record.
- [ ] The technical owner signed the test record.
- [ ] The pack is sealed and `Test-AmEvidencePack` reports nothing.
- [ ] Each chapter's evidence record is in the chain, and the chain checks.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 06 — The Application's Identity: Redirect URIs and Assignment](06-the-applications-identity-redirect-uris-and-assignment.md) · [Workbook index](index.md)
:::

[^am07-signin]: Microsoft Learn, "signIn resource type" (Graph beta; P1 or P2 to read sign-in logs through Graph; `clientCredentialType` values; `servicePrincipalCredentialKeyId`; `signInEventTypes` filter), <https://learn.microsoft.com/graph/api/resources/signin?view=graph-rest-beta> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am07-fips180]: National Institute of Standards and Technology, FIPS 180-4, *Secure Hash Standard (SHS)*, August 2015 (its Explanation lists SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224 and SHA-512/256), <https://csrc.nist.gov/pubs/fips/180-4/upd1/final> and <https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf> (read November 24, 2026).
[^am07-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am07-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
