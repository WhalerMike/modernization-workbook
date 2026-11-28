---
title: "Chapter 08 — Drift, Metrics and the Monthly Evidence Run"
description: "Book 20, Chapter 12's drift signals as code: two exports a month apart compared item by item, each difference classified (a policy out of enforcement, label rights widened, a label unpublished, the super user feature on, audit off, a Copilot policy changed) and passed only when a change ticket approved in the window explains it. Then the monthly run: every check, drift and the metrics the kit can compute (plan conformance, synthetic-event success, unexplained drift, expired exceptions), with every other metric named as not computed rather than zero, and each run recorded as hashed, chained evidence with its controls and KSIs. Labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-information-protection
part: How
series-order: 8
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: approved
reviewed-sha256: c07c5163a244089e020c8b7d13a9e5fb0b7f87b134463bae52e6990f6bb289d5
last-reviewed: 2026-11-25
---
# Chapter 08 — Drift, Metrics and the Monthly Evidence Run

*Drift is a difference no one can explain. The audit log says who changed it; the drift run says that nobody approved it.*

::: {.callout-note}
## In this chapter
The code behind the guide's [G12 Operations and evidence](../../../books/guides/information-protection-implementation.md#step-12-operations-and-evidence): [Book 20, Chapter 12's drift signals](../../../books/b20-information-protection/12-operations-and-evidence.md#drift-detection), its [metrics](../../../books/b20-information-protection/12-operations-and-evidence.md#metrics) and its [evidence catalog](../../../books/b20-information-protection/12-operations-and-evidence.md#evidence-catalog). You read how `Invoke-IpDrift` classifies and explains differences, how `Invoke-IpMetrics` reports only what it can compute, and how `Invoke-IpEvidence` chains the records. Lab 1 runs a month on the fixtures; Lab 2 runs one on a test tenant.
:::

## Goal and audience

For the developer who owns the monthly run and the ISSO who files its evidence. By the end you can say what changed in Purview this month, which changes were approved, what the metrics are, and that the evidence hasn't been altered since it was recorded.

## Start with Book 20, Chapter 12

### What Chapter 12 gives you

Drift is "any difference between today's export and the last approved one that no change ticket explains." Chapter 12 names six signals to watch first, because each weakens protection quietly: a policy back in a test mode or disabled; a label's rights widened or encryption off; a label removed from a policy or a scope narrowed; the super user feature on; audit off; a Copilot policy changed. [Book 13, Chapter 06](../../../books/b13-governance/06-the-drift-engine.md) owns the drift engine and its severity ladder. Chapter 12 also lists twelve metrics, and says a metric that depends on a feature the tenant isn't licensed for, or that its cloud doesn't have, is reported as "not measured", never as zero.

### What it leaves to you

- **The comparison itself,** item by item and property by property, for each file.
- **"Explained".** The change list (`templates/changes.csv`) names a ticket, the file, the item and the approval date; a difference is explained when a ticket for that file and item was approved between the two exports.
- **Which metrics the configuration can give.** Most of Chapter 12's metrics need alert dispositions, test records or content data, not configuration.

## The code

`config/drift.json` lists, per file, the properties compared and the signal each difference raises, with the severity from Book 13's ladder (P1 halts and alerts; P2 goes to the platform owner within a business day). Two refinements: a DLP policy leaving `Enable` raises *enforcement off*; the super user feature turning `Enabled`, a super user appearing, or audit turning `False` raise P1. A difference on a policy the plan lists in `copilotPolicies`, or on its rules, raises the Copilot signal.

`Invoke-IpDrift` writes one `DRIFT-nn` row per difference: `Pass` with the ticket that explains it, `Fail` with the signal's action when none does. `drift.csv` keeps every difference with its old and new value.

`Invoke-IpMonthlyRun.ps1` runs every check from Chapters 01 to 07, drift, then `Invoke-IpMetrics`:

- plan conformance per check (passing rows of all passing and failing rows);
- M8, synthetic events found in time; M11, unexplained drift; M12, expired exceptions;
- M1 to M7, M9 and M10 as "not computed by the kit", each with where its data comes from.

With `-EvidencePath`, each run folder is recorded by `Write-IpEvidence`: a record with the step's controls and KSIs (`config/requirements.json`, the guide's pairs), the run's own check result, every file's SHA-256 and the hash of the record before it. `Invoke-IpEvidence.ps1 -Check` verifies the folder and the chain; `-Stage test` also asks whether every step the test stage needs has a record whose run passed.

Tests: `tests/Evidence.Tests.ps1` and tag `ch08` in `tests/Kit.Tests.ps1`.

::: {.callout-warning}
## Illustrative code
Lab 1 reads fictional fixtures. The drift run is a backstop, not the first alarm: the audit log records Purview changes as they happen, and Book 12 is where a detection for a policy-mode change belongs.
:::

## Lab 1: fixtures, no tenant

You need PowerShell 7.1 or later with Pester 5.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order. Each step below says what it does and what to look for.

```powershell
Set-Location C:\FMWLabs\information-protection-code\information-protection

$Run = "C:\FMWLabs\results\information-protection-08\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run

# Step 1: Compare October's approved export with November's
./Invoke-IpDrift.ps1 -SettingsPath tests/fixtures/settings.lab.json -BaselinePath tests/fixtures/snapshots/2026-10-24 -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath "$Run/drift" -AsOf 2026-11-24T12:00:00Z

# Step 2: Read the differences
Import-Csv "$Run/drift/drift.csv" | Format-Table Item, Property, Signal, Severity, Ticket -AutoSize

# Step 3: Run the month, with evidence
./Invoke-IpMonthlyRun.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -BaselinePath tests/fixtures/snapshots/2026-10-24 -SyntheticPath tests/fixtures/synthetic/2026-11-24.json -RunRoot "$Run/month" -EvidencePath "$Run/evidence" -AsOf 2026-11-24T15:00:00Z

# Step 4: Read the metrics
Get-Content "$Run/month/metrics/metrics.md"

# Step 5: Check the evidence, then the test stage's go/no-go
./Invoke-IpEvidence.ps1 -EvidencePath "$Run/evidence" -Check
./Invoke-IpEvidence.ps1 -EvidencePath "$Run/evidence" -Check -Stage test

# Step 6: Run the chapter's tests
Invoke-Pester -Path tests/Evidence.Tests.ps1 -Output None -PassThru | Select-Object PassedCount, FailedCount

# After the steps
Get-ChildItem C:\FMWLabs\results\information-protection-08\lab1 -Name
```

:::

<!-- labs:end -->

Every step runs in PowerShell 7, so you can follow it top to bottom in one window. Open **PowerShell 7** from the Start menu, then go to the kit's folder, where you unzipped it under [Get the code](../../../training/information-protection/index.md#get-the-code):

```powershell
Set-Location C:\FMWLabs\information-protection-code\information-protection
```

<!-- capture:begin 08-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/08-1.txt))](captures/08-1.png){.lightbox fig-alt="Terminal window showing Set-Location C:\FMWLabs\information-protection-code\information-protection and what it printed"}

<!-- capture:end -->

Then make this run's results folder. Its name is the date and time you start, in UTC, so each run keeps its own results and running the lab again never overwrites them:

```powershell
$Run = "C:\FMWLabs\results\information-protection-08\lab1\$(Get-Date -AsUTC -Format 'yyyy-MM-ddTHHmmssZ')"
New-Item -ItemType Directory -Path $Run -Force | Out-Null
$Run
```

<!-- capture:begin 08-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/08-2.txt))](captures/08-2.png){.lightbox fig-alt="Terminal window showing $Run = 'C:\FMWLabs\results\information-protection-08\lab1\$(Get-Date -AsUTC -… and what it printed"}

<!-- capture:end -->

Expected output, where `<run>` is your start time, such as `2026-11-25T143005Z`:

```text
C:\FMWLabs\results\information-protection-08\lab1\<run>
```

The run's date is only the folder's name. The data's date is `-AsOf`, which stays the same, so every run's results match this page. The results folder sits outside the kit, so unzipping a newer copy of the kit never touches it.

Prefer Git Bash? Go to the folder with `cd /c/FMWLabs/information-protection-code/information-protection`, then type `pwsh` to start PowerShell 7 and make the run folder there, as above: every step is a PowerShell command, and a `$Run` made in Git Bash wouldn't reach PowerShell. In a clone of the repository, use the `examples` folder of the same name.

1. **Compare October's approved export with November's:**

   ```powershell
   ./Invoke-IpDrift.ps1 -SettingsPath tests/fixtures/settings.lab.json -BaselinePath tests/fixtures/snapshots/2026-10-24 -SnapshotPath tests/fixtures/snapshots/2026-11-24 -OutputPath "$Run/drift" -AsOf 2026-11-24T12:00:00Z
   ```

   <!-- capture:begin 08-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/08-3.txt))](captures/08-3.png){.lightbox fig-alt="Terminal window showing ./Invoke-IpDrift.ps1 -SettingsPath tests/fixtures/settings.lab.json -Baseline… and what it printed"}

   <!-- capture:end -->

   Expected output:

   ```text
   DRIFT-01   Fail  dlp-policies.json: FMP-DLP-CUI-ExternalEmail-v1: Mode: 'Disable' -> 'TestWithNotifications'; A DLP or auto-labeling policy changed mode (P2); no change ticket: explain it with a change ticket or put the policy back in the mode its stage says
   DRIFT-02   Fail  autolabel-policies.json: FMP-Auto-CUIBasic-Batch2-v1: Mode: 'TestWithoutNotifications' -> 'Enable'; A DLP or auto-labeling policy changed mode (P2); no change ticket: explain it with a change ticket or put the policy back in the mode its stage says
   DRIFT-03   Pass  labels.json: CUI Basic: EncryptionRightsDefinitions: 'contoso.example:VIEW,VIEWRIGHTSDATA,DOCEDIT,EDIT,REPLY,REPLYALL,OBJMODEL' -> 'contoso.example:VIEW,VIEWRIGHTSDATA,DOCEDIT,EDIT,PRINT,EXTRACT,REPLY,REPLYALL,FORWARD,OBJMODEL'; A label's encryption or rights changed (P2); explained by CHG-1042
   DRIFT-04   Fail  labels.json: CUI-SP-TAX: EncryptionRightsDefinitions: 'fti-holders@contoso.example:VIEW,VIEWRIGHTSDATA,DOCEDIT,EDIT,REPLY,REPLYALL,OBJMODEL' -> 'fti-holders@contoso.example:VIEW,VIEWRIGHTSDATA,DOCEDIT,EDIT,REPLY,REPLYALL,OBJMODEL;j.doe@contoso.example:VIEW,VIEWRIGHTSDATA'; A label's encryption or rights changed (P2); no change ticket: content is re-protected as users next open it: restore or approve
   DRIFT-05   Fail  label-policies.json: B20-Labels-All: Labels: 'CUI; CUI Basic; CUI site; CUI Specified site; Internal; Internal site; Public' -> 'CUI; CUI Basic; CUI site; Internal; Internal site; Public'; A label or scope changed in a label policy (P2); no change ticket: users may no longer apply the label, or defaults stop applying
   DRIFT-06   Fail  aipservice-configuration.json: (tenant): SuperUsersEnabled: 'Disabled' -> 'Enabled'; The super user feature is on, or a super user was added (P1); no change ticket: a standing ability to decrypt everything: disable it unless a recovery ticket is open
   DRIFT-07   Fail  aipservice-configuration.json: (tenant): SuperUsers: '' -> 'recovery.operator@contoso.example'; The super user feature is on, or a super user was added (P1); no change ticket: a standing ability to decrypt everything: disable it unless a recovery ticket is open
   DRIFT-08   Pass  audit-retention-policies.json: FMP-Audit-InfoProtection-1y: RetentionDuration: 'SixMonths' -> 'TwelveMonths'; An audit retention policy changed (P2); explained by CHG-1050
   drift: Fail (2 pass, 6 fail, 0 other). Written to ../../results/information-protection-08/lab1/<run>/drift
   ```

   Eight differences. Two pass: CHG-1042 widened CUI Basic's rights to tenant users, and CHG-1050 set the information protection audit retention to a year. Six fail with no ticket: the retired DLP policy back in simulation; auto-labeling batch 2 turned on; a person added to the CUI Specified label's rights; a label dropped from the production policy; and, at P1, the super user feature turned on with a standing super user.

2. **Read the differences:**

   ```powershell
   Import-Csv "$Run/drift/drift.csv" | Format-Table Item, Property, Signal, Severity, Ticket -AutoSize
   ```

   <!-- capture:begin 08-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/08-4.txt))](captures/08-4.png){.lightbox fig-alt="Terminal window showing Import-Csv '$Run/drift/drift.csv' | Format-Table Item, Property, Signal, Seve… and what it printed"}

   <!-- capture:end -->

   Expected output:

   ```text
   Item                         Property                    Signal      Severity Ticket
   ----                         --------                    ------      -------- ------
   FMP-DLP-CUI-ExternalEmail-v1 Mode                        enforcement P2
   FMP-Auto-CUIBasic-Batch2-v1  Mode                        enforcement P2
   CUI Basic                    EncryptionRightsDefinitions rights      P2       CHG-1042
   CUI-SP-TAX                   EncryptionRightsDefinitions rights      P2
   B20-Labels-All               Labels                      published   P2
   (tenant)                     SuperUsersEnabled           superuser   P1
   (tenant)                     SuperUsers                  superuser   P1
   FMP-Audit-InfoProtection-1y  RetentionDuration           retention   P2       CHG-1050
   ```

3. **Run the month, with evidence:**

   ```powershell
   ./Invoke-IpMonthlyRun.ps1 -SettingsPath tests/fixtures/settings.lab.json -SnapshotPath tests/fixtures/snapshots/2026-11-24 -BaselinePath tests/fixtures/snapshots/2026-10-24 -SyntheticPath tests/fixtures/synthetic/2026-11-24.json -RunRoot "$Run/month" -EvidencePath "$Run/evidence" -AsOf 2026-11-24T15:00:00Z
   ```

   <!-- capture:begin 08-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/08-5.txt))](captures/08-5.png){.lightbox fig-alt="Terminal window showing ./Invoke-IpMonthlyRun.ps1 -SettingsPath tests/fixtures/settings.lab.json -Sna… and what it printed"}

   <!-- capture:end -->

   Expected output:

   ```text
   access      Fail    1 fail(s)  record 0001
   inventory   Fail    2 fail(s)  record 0002
   labels      Fail    4 fail(s)  record 0003
   protection  Fail    4 fail(s)  record 0004
   dlp         Fail    3 fail(s)  record 0005
   autolabel   Fail    1 fail(s)  record 0006
   audit       Fail    1 fail(s)  record 0007
   drift       Fail    6 fail(s)  record 0008
   metrics     Pass    0 fail(s)  record 0009
   ```

   Nine runs, nine records. Every check reports failures, because the fixtures carry the faults Chapters 01 to 07 found.

4. **Read the metrics:**

   ```powershell
   Get-Content "$Run/month/metrics/metrics.md"
   ```

   <!-- capture:begin 08-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/08-6.txt))](captures/08-6.png){.lightbox fig-alt="Terminal window showing Get-Content '$Run/month/metrics/metrics.md' and what it printed"}

   ::: {.callout-note title="metrics.md, formatted"}
   **Information protection metrics, 2026-11-24 (lab)**

   | Metric | Value | Source |
   |---|---|---|
   | Plan conformance: access | 2 of 3 checks pass | access/results.csv |
   | Plan conformance: inventory | 1 of 3 checks pass | inventory/results.csv |
   | Plan conformance: labels | 9 of 13 checks pass | labels/results.csv |
   | Plan conformance: protection | 4 of 8 checks pass | protection/results.csv |
   | Plan conformance: dlp | 6 of 9 checks pass | dlp/results.csv |
   | Plan conformance: autolabel | 3 of 4 checks pass | autolabel/results.csv |
   | Plan conformance: audit | 4 of 5 checks pass | audit/results.csv |
   | M8 Audit-search success for synthetic events | 2 of 3 | audit/results.csv |
   | M11 Unexplained drift | 6 | drift/results.csv |
   | M12 Expired exceptions | 1 of 3 | the exception register |
   | M1 Container label coverage of CUI-bearing sites | not computed by the kit | the SharePoint site list with labels (guide G4), joined to the inventory |
   | M2 Labeled share of sensitive content | not computed by the kit | content explorer by label and by type (Book 20, Chapter 09) |
   | M3 Encrypted share of CUI | not computed by the kit | content explorer by label, with the label definitions |
   | M4 DLP true-positive rate after tuning | not computed by the kit | DLP alert dispositions |
   | M5 Override rate | not computed by the kit | activity explorer DLP events |
   | M6 Mean time to triage | not computed by the kit | the alert queue's timestamps |
   | M7 Decryption-recovery test pass | not computed by the kit | the quarterly test records (guide G5) |
   | M9 Encrypted-mail test pass | not computed by the kit | the quarterly test records (guide G6) |
   | M10 Oversharing trend | not computed by the kit | DSPM data risk assessment exports |

   Metrics follow Book 20, Chapter 12. A metric the kit cannot compute is reported as such, never as zero.
   :::

   <!-- capture:end -->

   Expected output:

   ```text
   # Information protection metrics, 2026-11-24 (lab)

   | Metric | Value | Source |
   |---|---|---|
   | Plan conformance: access | 2 of 3 checks pass | access/results.csv |
   | Plan conformance: inventory | 1 of 3 checks pass | inventory/results.csv |
   | Plan conformance: labels | 9 of 13 checks pass | labels/results.csv |
   | Plan conformance: protection | 4 of 8 checks pass | protection/results.csv |
   | Plan conformance: dlp | 6 of 9 checks pass | dlp/results.csv |
   | Plan conformance: autolabel | 3 of 4 checks pass | autolabel/results.csv |
   | Plan conformance: audit | 4 of 5 checks pass | audit/results.csv |
   | M8 Audit-search success for synthetic events | 2 of 3 | audit/results.csv |
   | M11 Unexplained drift | 6 | drift/results.csv |
   | M12 Expired exceptions | 1 of 3 | the exception register |
   | M1 Container label coverage of CUI-bearing sites | not computed by the kit | the SharePoint site list with labels (guide G4), joined to the inventory |
   | M2 Labeled share of sensitive content | not computed by the kit | content explorer by label and by type (Book 20, Chapter 09) |
   | M3 Encrypted share of CUI | not computed by the kit | content explorer by label, with the label definitions |
   | M4 DLP true-positive rate after tuning | not computed by the kit | DLP alert dispositions |
   | M5 Override rate | not computed by the kit | activity explorer DLP events |
   | M6 Mean time to triage | not computed by the kit | the alert queue's timestamps |
   | M7 Decryption-recovery test pass | not computed by the kit | the quarterly test records (guide G5) |
   | M9 Encrypted-mail test pass | not computed by the kit | the quarterly test records (guide G6) |
   | M10 Oversharing trend | not computed by the kit | DSPM data risk assessment exports |

   Metrics follow Book 20, Chapter 12. A metric the kit cannot compute is reported as such, never as zero.
   ```

   Six unexplained drifts (M11), one expired exception of three (M12), two synthetic events of three in time (M8), and nine metrics the kit says plainly it doesn't compute.

5. **Check the evidence, then the test stage's go/no-go:**

   ```powershell
   ./Invoke-IpEvidence.ps1 -EvidencePath "$Run/evidence" -Check
   ./Invoke-IpEvidence.ps1 -EvidencePath "$Run/evidence" -Check -Stage test
   ```

   <!-- capture:begin 08-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/08-7.txt))](captures/08-7.png){.lightbox fig-alt="Terminal window showing ./Invoke-IpEvidence.ps1 -EvidencePath '$Run/evidence' -Check and what it printed"}

   <!-- capture:end -->

   Expected output, the first check's two lines, then the go/no-go's:

   ```text
   SUMS               Pass  38 files match SHA256SUMS
   CHAIN              Pass  9 records, chain unbroken
   SUMS               Pass  38 files match SHA256SUMS
   CHAIN              Pass  9 records, chain unbroken
   STEP-PREFLIGHT     Fail  no record
   STEP-EXPORT        Fail  no record
   STEP-ACCESS        Fail  recorded, but the run's own check failed: close its findings and run it again
   STEP-LABELS        Fail  recorded, but the run's own check failed: close its findings and run it again
   STEP-PROTECTION    Fail  recorded, but the run's own check failed: close its findings and run it again
   STEP-DLP           Fail  recorded, but the run's own check failed: close its findings and run it again
   STEP-AUTOLABEL     Fail  recorded, but the run's own check failed: close its findings and run it again
   STEP-AUDIT         Fail  recorded, but the run's own check failed: close its findings and run it again
   ```

   The files and the chain pass. The go/no-go fails: the preflight and export steps have no record in this folder, and every check that ran found something. A run that found problems is evidence, but it isn't a go.

6. **Run the chapter's tests:**

   ```powershell
   Invoke-Pester -Path tests/Evidence.Tests.ps1 -Output None -PassThru | Select-Object PassedCount, FailedCount
   ```

   <!-- capture:begin 08-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/08-8.txt))](captures/08-8.png){.lightbox fig-alt="Terminal window showing Invoke-Pester -Path tests/Evidence.Tests.ps1 -Output None -PassThru | Select-… and what it printed"}

   <!-- capture:end -->

   Expected output:

   ```text
   PassedCount FailedCount
   ----------- -----------
            15           0
   ```

Nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in `$Run`. List every run you've made of this lab:

```powershell
Get-ChildItem C:\FMWLabs\results\information-protection-08\lab1 -Name
```

<!-- capture:begin 08-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/ip/08-9.txt))](captures/08-9.png){.lightbox fig-alt="Terminal window showing Get-ChildItem C:\FMWLabs\results\information-protection-08\lab1 -Name and what it printed"}

<!-- capture:end -->

Expected output: one line per run, oldest first, the last one this run:

```text
<run>
```

## Lab 2: a test tenant

Use a test tenant, never production, and two exports at least a day apart (Chapter 02). Between them, change one policy's mode under a test change record and add that record to your change list. Work in `examples/information-protection`. You'll replace `<settings-file>`, `<output-folder>`, `<first-export>` and `<second-export>`.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/information-protection`. Each step below says what it does and what to look for.

```powershell
# Step 1: Compare the two exports
./Invoke-IpDrift.ps1 -SettingsPath <settings-file> -BaselinePath <first-export> -SnapshotPath <second-export> -OutputPath <output-folder>/drift

# Step 2: Run the month with evidence, and check it
./Invoke-IpMonthlyRun.ps1 -SettingsPath <settings-file> -SnapshotPath <second-export> -BaselinePath <first-export> -RunRoot <output-folder>/month -EvidencePath <output-folder>/evidence
./Invoke-IpEvidence.ps1 -EvidencePath <output-folder>/evidence -Check

# Step 3: Back it out
Remove-Item -Recurse -Force <output-folder>
```

:::

<!-- labs:end -->

1. **Compare the two exports:**

   ```powershell
   ./Invoke-IpDrift.ps1 -SettingsPath <settings-file> -BaselinePath <first-export> -SnapshotPath <second-export> -OutputPath <output-folder>/drift
   ```

   The policy change passes with your ticket. Remove the ticket from the change list and run it again: it fails.

2. **Run the month with evidence, and check it:**

   ```powershell
   ./Invoke-IpMonthlyRun.ps1 -SettingsPath <settings-file> -SnapshotPath <second-export> -BaselinePath <first-export> -RunRoot <output-folder>/month -EvidencePath <output-folder>/evidence
   ./Invoke-IpEvidence.ps1 -EvidencePath <output-folder>/evidence -Check
   ```

3. **Back it out.** Return the policy to its earlier mode under the same test change record. The run changed nothing; keep the evidence folder or delete it:

   ```powershell
   Remove-Item -Recurse -Force <output-folder>
   ```

To run this read-only assessment for real, outside the lab, see [Assessments you can run against production](../../../reference/permissions-by-run.md#production-assessments).

## Verified facts

| Item | Value | Source |
|---|---|---|
| Drift and its signals | Book 20, Chapter 12 | [Drift detection](../../../books/b20-information-protection/12-operations-and-evidence.md#drift-detection) |
| The severity ladder | Book 13, Chapter 06 | [The drift engine](../../../books/b13-governance/06-the-drift-engine.md) |
| Metrics and "not measured" | Book 20, Chapter 12 | [Metrics](../../../books/b20-information-protection/12-operations-and-evidence.md#metrics) |
| Changes to auditing are audited | `Search-UnifiedAuditLog -Operations Set-AdminAuditLogConfig` | [^ip08-audit] |

: Facts this chapter's code depends on {.striped .hover}

## Federal requirements and evidence

| Requirement it supports | KSI | What the ISSO keeps |
|---|---|---|
| CM-3 Configuration Change Control; CA-7 Continuous Monitoring | KSI-SVC-ACM, KSI-CMT-LMC | `drift.csv`, `metrics.md`, `records/`, `records.csv`, `SHA256SUMS` |

The run supports these controls; the agency's assessor decides whether a control is satisfied. KSIs are FedRAMP's indicators for cloud service providers; the agency uses them as a vocabulary for its own evidence.

## Dangers

| Danger | Mitigation |
|---|---|
| A ticket written after the fact to clear drift | The ticket must be approved between the two exports |
| A metric shown as zero when nothing measured it | "not computed by the kit", with the source named |
| Evidence edited after it was recorded | `SHA256SUMS` and the record chain; `-Check` fails on any change |
| A drift that weakens CUI protection handled as routine | It goes to the authorizing official as a possible significant change ([Book 20, Chapter 12](../../../books/b20-information-protection/12-operations-and-evidence.md#drift-detection)) |

: Dangers in the monthly run {.striped .hover}

## Checklist

- [ ] The change list kept with every Purview change, by file and item
- [ ] The monthly run scheduled (Chapter 09) against the last approved export
- [ ] Every unexplained drift explained or reversed within one business day
- [ ] The evidence folder checked before it goes to the assessor

## Continue the book

[← Previous: Chapter 07 — Audit and the Synthetic Events](07-audit-and-the-synthetic-events.md) · [Workbook index](index.md) · [Next: Chapter 09 — Deploying to Test and Production →](09-deploying-to-test-and-production.md)

[^ip08-audit]: Microsoft Learn, "Turn auditing on or off," section "Audit records when auditing status is changed," <https://learn.microsoft.com/purview/audit-log-enable-disable> (accessed Nov 11, 2026, for Book 20, Chapter 12).
