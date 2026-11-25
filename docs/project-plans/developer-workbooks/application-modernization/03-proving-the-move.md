---
title: "Chapter 03 — Proving the Move"
description: "How the migration tool proves a load three ways over both whole tables: row counts, a SHA-256 over every row in one canonical form, and aggregates each database computes on its own; what each check catches and what it can't; three kinds of damage (a changed amount, a deleted row, a truncated name) and the checks that catch each, by table and key; the delta from the previous run's watermark during coexistence, and what a delta can't see; and a report with keys, counts and digests but no row contents. Lab 1 reads the reports from the fixture runs and writes the step's evidence record; Lab 2 validates a test load and runs a delta against it."
doc-type: workbook-chapter
audience: [Technical]
family: dw-application-modernization
part: How
series-order: 3
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 03 — Proving the Move

*Every check has a blind spot. Choose three whose blind spots don't overlap, and break the data on purpose to show each one fires.*

::: {.callout-note}
## In this chapter
The proof half of [Book 18, Chapter 04](../../../books/b18-application-modernization/04-moving-the-data.md). You start with what the chapter asks a validation to show, then read the kit's three checks and the canonical row form the checksum depends on. Lab 1 reads the reports the fixture runs wrote: a clean load, three kinds of damage, and a delta after the legacy system kept changing. Lab 2 validates a test load and runs a delta against it.
:::

## Goal and audience

**Goal.** By the end of this chapter you can say what a passing validation report proves and what it doesn't, find the key behind a failure, and run a delta from the last watermark.

**Audience.** Data engineers, the data owner, and the ISSO who keeps the report with the change. You should have done Chapter 02's Lab 1.

## Start with the book and the standards

### What they give you

Book 18's Chapter 04 asks for validation that doesn't share the migration's own logic, because a check that reuses the transform can only show the migration did what it was told. It describes the coexistence period, when both systems are live and changes flow from the old one to the new, and change data capture for deletes. SHA-256 is the hash function NIST specifies in FIPS 180-4.[^am03-fips180]

### What they leave to you

Each row is pinned by a test in `MigrationTest.java`.

| What the book gives | Why it matters | What the kit adds |
|---|---|---|
| "Validate after the load" | Validating only the rows just loaded misses what was already wrong | Both whole tables, every run |
| "Use an independent check" | A checksum shares the transform with the load | Aggregates computed by each database in SQL, without the tool's transform |
| A hash over rows | Two engines render dates, decimals and nulls differently | One canonical row form, defined once in `Canonical.java` |
| "Find what differs" | A failed total doesn't say where | The checksum's detail lists the keys that differ, are missing or are extra |
| Coexistence | A full reload every night doesn't scale | `--since` loads rows changed at or after the last report's `nextWatermark` |
| A report for the change record | A report with row contents is a privacy problem | Keys, counts and digests only |

**The verdict.** Use SHA-256 and each engine's own SQL as published. Build the canonical form, the three-way check and the delta.

## The code

| Check | How | Proves | Doesn't prove |
|---|---|---|---|
| `row_count` | Rows on each side | Nothing dropped or duplicated wholesale | That the rows hold the right values |
| `checksum_sha256` | Each row rendered canonically, sorted by key, SHA-256 over all of them; source after the transform, target as stored | Every target row equals the transformed source row, field by field | That the transform is right: a wrong rule passes, because both sides share it |
| `aggregate` | `COUNT(*)` and `SUM` per status for cases, `COUNT(*)` and `SUM(APPL_ID)` for applicants, by each engine | Totals agree, computed without the transform | Text: a truncated name passes |

The canonical form: fields in column order separated by `|`, with `\` and `|` escaped; NULL as `\N`; text exactly as given; dates as `yyyy-MM-dd`; timestamps as UTC instants to the microsecond; amounts with scale 2. `Validator.java` runs the checks; `ValidationReport.java` and `Migrator.toJson` write the report.

A delta has two limits the README states. `APPLICANT` has no change timestamp, so a name change without a case change isn't picked up (the next validation shows it). And a delta can't see a delete in the source: use change data capture for those.

::: {.callout-important}
## Illustrative code
The damage in Lab 1 is made by `LabReportsTest` on the fixture's target: it changes, deletes and truncates rows after a clean load, then validates. The source is the H2 stand-in, not real Db2 or Oracle.
:::

## Lab 1: fixtures, no tenant

You need Java 21 and PowerShell 7.4 or later. Work in `examples/app-modernization`.

1. **Run the lab reports:**

   ```powershell
   ./mvnw -q -pl migration test "-Dtest=LabReportsTest"
   Import-Module ./powershell/AppModernization/AppModernization.psm1
   ```

   <!-- capture:begin 03-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/03-1.txt))](captures/03-1.png){.lightbox fig-alt="Terminal window showing ./mvnw -q -pl migration test '-Dtest=LabReportsTest' and what it printed"}

   <!-- capture:end -->

2. **Read the clean load's checks:**

   ```powershell
   Get-AmValidationSummary -Path migration/target/lab/load-full.json | Format-Table Table, Check, Passed, Detail
   ```

   <!-- capture:begin 03-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/03-2.txt))](captures/03-2.png){.lightbox fig-alt="Terminal window showing Get-AmValidationSummary -Path migration/target/lab/load-full.json | Format-Ta… and what it printed"}

   <!-- capture:end -->

   Six checks, all passed: three for each table.

3. **Change one amount by a cent, and see who notices:**

   ```powershell
   Get-AmValidationSummary -Path migration/target/lab/damage-amount.json | Where-Object { -not $_.Passed } | Format-Table Table, Check, Detail
   ```

   <!-- capture:begin 03-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/03-3.txt))](captures/03-3.png){.lightbox fig-alt="Terminal window showing Get-AmValidationSummary -Path migration/target/lab/damage-amount.json | Where… and what it printed"}

   <!-- capture:end -->

   The checksum names `C-000010`; the aggregate's totals disagree; the row count doesn't notice.

4. **Delete one row:**

   ```powershell
   Get-AmValidationSummary -Path migration/target/lab/damage-delete.json | Where-Object { -not $_.Passed } | Format-Table Table, Check, Detail
   ```

   <!-- capture:begin 03-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/03-4.txt))](captures/03-4.png){.lightbox fig-alt="Terminal window showing Get-AmValidationSummary -Path migration/target/lab/damage-delete.json | Where… and what it printed"}

   <!-- capture:end -->

   All three fail, and the checksum says `C-000020` is missing from the target.

5. **Truncate one name:**

   ```powershell
   Get-AmValidationSummary -Path migration/target/lab/damage-truncate.json | Where-Object { -not $_.Passed } | Format-Table Table, Check, Detail
   ```

   <!-- capture:begin 03-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/03-5.txt))](captures/03-5.png){.lightbox fig-alt="Terminal window showing Get-AmValidationSummary -Path migration/target/lab/damage-truncate.json | Whe… and what it printed"}

   <!-- capture:end -->

   Only the checksum fails, on applicant `7`: counts and sums can't see text. This is why the checksum exists.

6. **Follow the coexistence period:** the full load, the legacy system changing two cases and adding one, then the delta from the first watermark:

   ```powershell
   foreach ($f in 'delta-0-full', 'delta-1-drift', 'delta-2-after') { $r = Read-AmJson -Path "migration/target/lab/$f.json"; [pscustomobject]@{ Report = $f; Mode = $r.mode; Since = $r.since; Cases = $r.loaded.case_record; Passed = $r.passed; Failures = $r.failures -join ' '; NextWatermark = $r.nextWatermark } }
   ```

   <!-- capture:begin 03-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/03-6.txt))](captures/03-6.png){.lightbox fig-alt="Terminal window showing foreach ($f in 'delta-0-full', 'delta-1-drift', 'delta-2-after') { $r = Read-… and what it printed"}

   <!-- capture:end -->

   The drift shows before the delta runs. The delta loads four cases: the two changed, the new one, and the boundary row at the watermark itself, because the bound is inclusive and every write is an upsert.

7. **Check the reports hold no row contents:**

   ```powershell
   Select-String -Path migration/target/lab/*.json -Pattern 'Applicant-0001', 'Peña' -Quiet
   ```

   <!-- capture:begin 03-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/03-7.txt))](captures/03-7.png){.lightbox fig-alt="Terminal window showing Select-String -Path migration/target/lab/*.json -Pattern 'Applicant-0001', 'P… and what it printed"}

   <!-- capture:end -->

   `False`.

8. **Write the step's evidence record:**

   ```powershell
   Write-AmEvidenceRecord -Step PROVE -Path migration/target/lab/load-full.json, migration/target/lab/damage-amount.json, migration/target/lab/damage-delete.json, migration/target/lab/damage-truncate.json, migration/target/lab/delta-2-after.json -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-List Record, Step, Files, Controls, KSIs
   ```

   <!-- capture:begin 03-8 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/03-8.txt))](captures/03-8.png){.lightbox fig-alt="Terminal window showing Write-AmEvidenceRecord -Step PROVE -Path migration/target/lab/load-full.json,… and what it printed"}

   <!-- capture:end -->

**Expected result:** a clean load, each kind of damage caught by the checks that should catch it with the key named, a passing delta of four cases, no row contents in any report, and `record-001-PROVE.json`. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 03-9 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/03-9.txt))](captures/03-9.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test load and a delta

Use the test PostgreSQL database and the copy of the legacy database from Chapter 02's Lab 2, before its back-out step, never production. You need what that lab needed, with the same placeholders and the same session (the class path in `$cp` and the passwords in the environment). You'll also replace `<last-watermark>`, the `nextWatermark` from the load's report.

1. **Validate without loading:**

   ```powershell
   java -cp $cp gov.example.modernization.migration.MigrateCli --source-url '<source-jdbc-url>' --source-user '<source-user>' --target-url "jdbc:postgresql://<pg-host>:5432/<database>" --target-user '<db-user>' --source-zone '<source-zone>' --validate-only --report validate-only.json
   Import-Module ./powershell/AppModernization/AppModernization.psm1
   Get-AmValidationSummary -Path validate-only.json | Format-Table Table, Check, Passed, Detail
   ```

2. **Run a delta from the last watermark** after the copy has had changes applied, or straight away to see the boundary row reloaded:

   ```powershell
   (Read-AmJson -Path validation-report.json).nextWatermark
   java -cp $cp gov.example.modernization.migration.MigrateCli --source-url '<source-jdbc-url>' --source-user '<source-user>' --target-url "jdbc:postgresql://<pg-host>:5432/<database>" --target-user '<db-user>' --source-zone '<source-zone>' --since '<last-watermark>' --report delta.json
   $d = Read-AmJson -Path delta.json; [pscustomobject]@{ Mode = $d.mode; Since = $d.since; Cases = $d.loaded.case_record; Passed = $d.passed; NextWatermark = $d.nextWatermark }
   ```

3. **If a check fails,** list the keys it names and give them to the data owner; don't rerun until the cause is known:

   ```powershell
   Get-AmValidationSummary -Path delta.json | Where-Object { -not $_.Passed } | Format-Table Table, Check, Detail
   ```

4. **Back it out:** Chapter 02's Lab 2, step 5, and delete these reports:

   ```powershell
   Remove-Item validate-only.json, delta.json
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| SHA-256 | Specified in FIPS 180-4 | [^am03-fips180] |
| The three checks and the damage | Each kind of damage fails exactly the checks Lab 1 shows, with the key named | `MigrationTest` and `LabReportsTest`, November 24, 2026 |
| The delta | Inclusive bound; four cases reloaded in the fixture | Lab 1, step 6 |
| Real Db2 or Oracle | *Not verified* | Book 18, [Chapter 08](../../../books/b18-application-modernization/08-the-reference-implementation.md#what-was-verified-and-what-wasnt) |

## Federal requirements and evidence

The record's controls and KSIs are the kit's `config/requirements.json`, step `PROVE`.[^am03-oscal] [^am03-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The load was validated three ways over both whole tables, and the report names any key that differs (Lab 1, steps 2 to 5; Lab 2, step 1) | CM-3(2), Testing, Validation, and Documentation of Changes | KSI-CMT-VTD | The data owner; the change record holds the report |
| After the move, the checks were run again and shown to catch damage, so a passing report means something (Lab 1, steps 3 to 5) | CM-4(2), Verification of Controls | KSI-CMT-VTD | The ISSO keeps the record |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them. The kit's records support these controls; the agency's assessor decides them *(design guidance)*.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| Only a row count | Wrong values pass | Checksum and aggregates as well |
| Only a checksum | A wrong transform rule passes | Aggregates computed without the transform |
| Validating only the rows loaded | Earlier damage stays hidden | Both whole tables, every run |
| A delta trusted for deletes | Deleted source rows live on in the target | The README's limit; change data capture |
| A report with row contents in the change record | Personal data spreads to every reader | Keys, counts and digests only |

## Checklist

- [ ] Every load has a report in the change record, and it passed.
- [ ] A failed report's keys went to the data owner before any rerun.
- [ ] The data owner reviewed the transform rules (the checksum can't).
- [ ] Deltas run from the previous report's `nextWatermark`.
- [ ] Deletes during coexistence are handled by change data capture, or recorded as a gap.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 02 — Moving the Data: the Transform and the Load](02-moving-the-data-the-transform-and-the-load.md) · [Workbook index](index.md) · [Next: Chapter 04 — An Agent That Only Proposes →](04-an-agent-that-only-proposes.md)
:::

[^am03-fips180]: National Institute of Standards and Technology, FIPS 180-4, *Secure Hash Standard (SHS)*, August 2015 (its Explanation lists SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-512/224 and SHA-512/256), <https://csrc.nist.gov/pubs/fips/180-4/upd1/final> and <https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf> (read November 24, 2026).
[^am03-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am03-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
