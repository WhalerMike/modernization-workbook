---
title: "Chapter 02 — Moving the Data: the Transform and the Load"
description: "The migration tool that reads a legacy Db2 or Oracle schema over JDBC and loads it into the service's own PostgreSQL schema: trailing CHAR padding removed, one-letter status codes mapped, the 0001-01-01 sentinel turned into a null, amounts kept at scale 2, legacy timestamps read in a stated time zone, parents before children in one transaction with upserts in batches, and any value it can't map stopping the run. Lab 1 loads the synthetic legacy database, shows each edge case side by side and writes the step's evidence record; Lab 2 loads a copy of a real legacy database into a test PostgreSQL server."
doc-type: workbook-chapter
audience: [Technical]
family: dw-application-modernization
part: How
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 02 — Moving the Data: the Transform and the Load

*Legacy data breaks careless migrations in the same few places: padding, codes, sentinel dates, precision and time zones. Name each rule, and stop on anything no rule covers.*

::: {.callout-note}
## In this chapter
The load half of [Book 18, Chapter 04](../../../books/b18-application-modernization/04-moving-the-data.md). You start with what the chapter asks of a migration, then read the transform rules in the kit's `migration/` tool, each one written down in one class, and how the tool loads parents before children in one transaction so a re-run is safe. Lab 1 loads a synthetic Db2-style database into the service's own schema and puts the legacy value beside the loaded one for each rule; Lab 2 loads a copy of a real legacy database into a test server. Chapter 03 proves the load.
:::

## Goal and audience

**Goal.** By the end of this chapter you can load a legacy schema into PostgreSQL with the kit's tool, say which rule changed each value, and show that nothing was guessed.

**Audience.** Data engineers and developers who move an application's data, and the data owner who signs off the rules. You should have read Chapter 01.

## Start with the book and the standards

### What they give you

Book 18's [Chapter 04](../../../books/b18-application-modernization/04-moving-the-data.md) covers choosing the target engine, converting the schema, the conversion tools as of October 2026, and coexistence while both systems are live. JDBC gives one interface to Db2 (`com.ibm.db2:jcc`) and Oracle (`ojdbc11`), each under its vendor's license terms; the kit includes neither. PostgreSQL's `INSERT ... ON CONFLICT ... DO UPDATE` makes a write an upsert.[^am02-upsert]

### What they leave to you

Each row is pinned by a test in `migration/src/test/java/.../MigrationTest.java`.

| What the book or the engines give | Why it matters | What the kit adds |
|---|---|---|
| `CHAR(n)` columns return padded values | A padded key never matches the new system's | Trailing padding removed; leading spaces kept as data |
| A one-letter status code | The new schema stores words, and an unknown letter has no right answer | `O`, `P`, `C` mapped to `OPEN`, `PENDING`, `CLOSED`; any other code stops the run |
| `CLOSE_DT NOT NULL` with `0001-01-01` meaning "no date" | Carried across, every open case looks closed in year 1 | The sentinel becomes NULL |
| `DECIMAL(11,2)` | A float or a rounding loses cents | `numeric(11,2)` kept exactly; a value needing rounding stops the run |
| `TIMESTAMP` with no zone | Read in the machine's zone, every time shifts | Read as wall-clock time in `--source-zone` (default UTC) |
| `java.sql.Date` | The old calendar handling shifts very old dates, the sentinel among them | Dates read as `LocalDate` |
| Rows written one by one | A failure half way leaves half a load | Parents before children, in one transaction, upserted in batches; a re-run is safe |

**The verdict.** Use JDBC and PostgreSQL's upsert as published. Write every transform rule down in one place, and stop on anything outside the rules.

## The code

| Part | File | What it does |
|---|---|---|
| CLI | `MigrateCli.java` | Options, passwords from `SOURCE_DB_PASSWORD` and `TARGET_DB_PASSWORD` only, exit codes 0, 1 and 2 |
| Read | `LegacySource.java` | Reads `APPLICANT` and `CASE_MSTR` over JDBC |
| Rules | `Transform.java` | Every rule in the table above |
| Write | `TargetStore.java` | Upserts `applicant`, then `case_record`, in batches, in one transaction |
| Run | `Migrator.java` | Load, then validate both whole tables (Chapter 03), then the report |
| Fixtures | `src/main/resources/legacy/` | The synthetic schema in Db2 and Oracle syntax and about 50 seeded cases |
| Lab reports | `src/test/java/.../LabReportsTest.java` | Writes the reports and `edge-cases.csv` to `migration/target/lab/` |

The target schema is the service's `V1__baseline.sql`, applied from the service's folder (Chapter 01).

::: {.callout-important}
## Illustrative code
The source in Lab 1 is H2 in Db2 compatibility mode, a stand-in: fixed-width text comparison, date types and driver behavior differ from real Db2 and Oracle. The fixture's `CHECK` constraint allows only `O`, `P` and `C`, so Lab 1 can't show an unknown code stopping the run; the rule is in `Transform.java`. Run Lab 2 against a copy of the real source before relying on the tool.
:::

## Lab 1: fixtures, no tenant

You need Java 21 and PowerShell 7.4 or later; Maven, the PostgreSQL binaries and H2 download on the first run. Work in `examples/app-modernization`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/app-modernization`. Each step below says what it does and what to look for.

```powershell
# Step 1: See the legacy habits in the schema
Select-String -Path migration/src/main/resources/legacy/db2-schema.sql -Pattern 'CHAR\(|DATE|DECIMAL|TIMESTAMP' | ForEach-Object { $_.Line.Trim() }

# Step 2: Run the migration tests and the lab reports
./mvnw -q -pl migration test "-Dtest=MigrationTest,LabReportsTest"
Import-Module ./powershell/AppModernization/AppModernization.psm1
Get-AmTestResult -Path migration/target/surefire-reports | Format-Table

# Step 3: Put each legacy value beside the loaded one
Import-Csv migration/target/lab/edge-cases.csv | Format-Table

# Step 4: Read what the full load did
$r = Read-AmJson -Path migration/target/lab/load-full.json
[pscustomobject]@{ Mode = $r.mode; SourceZone = $r.sourceZone; Applicants = $r.loaded.applicant; Cases = $r.loaded.case_record; Passed = $r.passed; NextWatermark = $r.nextWatermark } | Format-List

# Step 5: Write the step's evidence record
Write-AmEvidenceRecord -Step LOAD -Path migration/target/lab/load-full.json, migration/target/lab/edge-cases.csv, migration/target/surefire-reports/TEST-gov.example.modernization.migration.MigrationTest.xml -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-List Record, Step, Files, Controls, KSIs

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **See the legacy habits in the schema:**

   ```powershell
   Select-String -Path migration/src/main/resources/legacy/db2-schema.sql -Pattern 'CHAR\(|DATE|DECIMAL|TIMESTAMP' | ForEach-Object { $_.Line.Trim() }
   ```

   <!-- capture:begin 02-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/02-1.txt))](captures/02-1.png){.lightbox fig-alt="Terminal window showing Select-String -Path migration/src/main/resources/legacy/db2-schema.sql -Patte… and what it printed"}

   <!-- capture:end -->

   Fixed-width text, a `NOT NULL` closing date with a default of `0001-01-01`, a decimal amount and a timestamp with no zone.

2. **Run the migration tests and the lab reports:**

   ```powershell
   ./mvnw -q -pl migration test "-Dtest=MigrationTest,LabReportsTest"
   Import-Module ./powershell/AppModernization/AppModernization.psm1
   Get-AmTestResult -Path migration/target/surefire-reports | Format-Table
   ```

   <!-- capture:begin 02-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/02-2.txt))](captures/02-2.png){.lightbox fig-alt="Terminal window showing ./mvnw -q -pl migration test '-Dtest=MigrationTest,LabReportsTest' and what it printed"}

   <!-- capture:end -->

   No failures or errors in `MigrationTest` or `LabReportsTest`.

3. **Put each legacy value beside the loaded one:**

   ```powershell
   Import-Csv migration/target/lab/edge-cases.csv | Format-Table
   ```

   <!-- capture:begin 02-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/02-3.txt))](captures/02-3.png){.lightbox fig-alt="Terminal window showing Import-Csv migration/target/lab/edge-cases.csv | Format-Table and what it printed"}

   <!-- capture:end -->

   Padding gone from keys and names (quoted so you can see it), `C`/`P`/`O` as words, the sentinel as `NULL`, the smallest and largest amounts exact, the timestamp as a UTC instant to the microsecond, and `Peña` and `Zoë` intact.

4. **Read what the full load did:**

   ```powershell
   $r = Read-AmJson -Path migration/target/lab/load-full.json
   [pscustomobject]@{ Mode = $r.mode; SourceZone = $r.sourceZone; Applicants = $r.loaded.applicant; Cases = $r.loaded.case_record; Passed = $r.passed; NextWatermark = $r.nextWatermark } | Format-List
   ```

   <!-- capture:begin 02-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/02-4.txt))](captures/02-4.png){.lightbox fig-alt="Terminal window showing $r = Read-AmJson -Path migration/target/lab/load-full.json and what it printed"}

   <!-- capture:end -->

   Twenty applicants and fifty cases, every check passed, and the watermark Chapter 03's delta starts from.

5. **Write the step's evidence record:**

   ```powershell
   Write-AmEvidenceRecord -Step LOAD -Path migration/target/lab/load-full.json, migration/target/lab/edge-cases.csv, migration/target/surefire-reports/TEST-gov.example.modernization.migration.MigrationTest.xml -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-List Record, Step, Files, Controls, KSIs
   ```

   <!-- capture:begin 02-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/02-5.txt))](captures/02-5.png){.lightbox fig-alt="Terminal window showing Write-AmEvidenceRecord -Step LOAD -Path migration/target/lab/load-full.json, … and what it printed"}

   <!-- capture:end -->

**Expected result:** no failed tests, every edge case transformed by its rule, 20 applicants and 50 cases loaded, and `record-001-LOAD.json` in `out/evidence`. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 02-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/02-6.txt))](captures/02-6.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a copy of the legacy database

Use a copy of the legacy database made for testing and a test PostgreSQL 16 or later server with an empty database, never production. The copy holds real records: handle it under the system's own privacy rules, and keep the run's report, which holds keys, counts and hashes but no row contents. You need Java 21, PowerShell 7.4 or later, `psql`, and the source's JDBC driver under your own license. Work in `examples/app-modernization`. You'll replace: `<source-jdbc-url>` (for example `jdbc:db2://<host>:50000/<db>`), `<source-user>`, `<source-driver-jar>` (the path to `jcc.jar` or `ojdbc11.jar`), `<pg-host>`, `<database>`, `<db-user>` and `<source-zone>` (the zone the legacy timestamps are in, such as `America/New_York`).

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/app-modernization`. Each step below says what it does and what to look for.

```powershell
# Step 1: Create the target schema
$env:DB_URL = 'jdbc:postgresql://<pg-host>:5432/<database>'; $env:DB_USER = '<db-user>'; $env:DB_PASSWORD = Read-Host 'Target password' -MaskInput
./mvnw -q -pl service package -DskipTests
$svc = Start-Process java -ArgumentList '-jar', 'service/target/case-service-0.1.0-SNAPSHOT.jar' -PassThru -NoNewWindow -RedirectStandardOutput service-test.log
do { Start-Sleep -Seconds 2 } until ((Invoke-RestMethod http://localhost:8080/actuator/health -ErrorAction SilentlyContinue).status -eq 'UP')
Stop-Process -Id $svc.Id

# Step 2: Build the tool and fetch the PostgreSQL driver
./mvnw -q -pl migration package -DskipTests
./mvnw -q dependency:copy -Dartifact=org.postgresql:postgresql:42.7.14 -DoutputDirectory=lib

# Step 3: Load the copy
$env:SOURCE_DB_PASSWORD = Read-Host 'Source password' -MaskInput
$env:TARGET_DB_PASSWORD = $env:DB_PASSWORD
$cp = @('migration/target/legacy-migration-0.1.0-SNAPSHOT.jar', 'lib/postgresql-42.7.14.jar', '<source-driver-jar>') -join [IO.Path]::PathSeparator
java -cp $cp gov.example.modernization.migration.MigrateCli --source-url '<source-jdbc-url>' --source-user '<source-user>' --target-url "jdbc:postgresql://<pg-host>:5432/<database>" --target-user '<db-user>' --source-zone '<source-zone>' --batch-size 500 --report validation-report.json
"exit $LASTEXITCODE"

# Step 4: Spot-check the rules on real rows
psql -h <pg-host> -U <db-user> -d <database> -c "select status, count(*), count(closed_on) as with_closing_date, max(length(case_number)) as longest_key from case_record group by status order by status"

# Step 5: Back it out
psql -h <pg-host> -U <db-user> -d postgres -c 'DROP DATABASE <database>'
Remove-Item -Recurse -Force lib; Remove-Item service-test.log, validation-report.json
Remove-Item Env:DB_URL, Env:DB_USER, Env:DB_PASSWORD, Env:SOURCE_DB_PASSWORD, Env:TARGET_DB_PASSWORD
```

:::

<!-- labs:end -->

1. **Create the target schema** by starting the service once against the empty database (Chapter 01, Lab 2, steps 1 and 2, without the `demo` profile), then stop it:

   ```powershell
   $env:DB_URL = 'jdbc:postgresql://<pg-host>:5432/<database>'; $env:DB_USER = '<db-user>'; $env:DB_PASSWORD = Read-Host 'Target password' -MaskInput
   ./mvnw -q -pl service package -DskipTests
   $svc = Start-Process java -ArgumentList '-jar', 'service/target/case-service-0.1.0-SNAPSHOT.jar' -PassThru -NoNewWindow -RedirectStandardOutput service-test.log
   do { Start-Sleep -Seconds 2 } until ((Invoke-RestMethod http://localhost:8080/actuator/health -ErrorAction SilentlyContinue).status -eq 'UP')
   Stop-Process -Id $svc.Id
   ```

2. **Build the tool and fetch the PostgreSQL driver:**

   ```powershell
   ./mvnw -q -pl migration package -DskipTests
   ./mvnw -q dependency:copy -Dartifact=org.postgresql:postgresql:42.7.14 -DoutputDirectory=lib
   ```

3. **Load the copy,** with the passwords only in the environment:

   ```powershell
   $env:SOURCE_DB_PASSWORD = Read-Host 'Source password' -MaskInput
   $env:TARGET_DB_PASSWORD = $env:DB_PASSWORD
   $cp = @('migration/target/legacy-migration-0.1.0-SNAPSHOT.jar', 'lib/postgresql-42.7.14.jar', '<source-driver-jar>') -join [IO.Path]::PathSeparator
   java -cp $cp gov.example.modernization.migration.MigrateCli --source-url '<source-jdbc-url>' --source-user '<source-user>' --target-url "jdbc:postgresql://<pg-host>:5432/<database>" --target-user '<db-user>' --source-zone '<source-zone>' --batch-size 500 --report validation-report.json
   "exit $LASTEXITCODE"
   ```

   Exit 0 means every check passed; 1, a check failed (Chapter 03 reads why); 2, a usage or runtime error, such as a status code no rule covers.

4. **Spot-check the rules on real rows:**

   ```powershell
   psql -h <pg-host> -U <db-user> -d <database> -c "select status, count(*), count(closed_on) as with_closing_date, max(length(case_number)) as longest_key from case_record group by status order by status"
   ```

   No `OPEN` or `PENDING` case with a closing date, and no padded key.

5. **Back it out:** drop the test database, and delete the drivers, the report and the session's passwords:

   ```powershell
   psql -h <pg-host> -U <db-user> -d postgres -c 'DROP DATABASE <database>'
   Remove-Item -Recurse -Force lib; Remove-Item service-test.log, validation-report.json
   Remove-Item Env:DB_URL, Env:DB_USER, Env:DB_PASSWORD, Env:SOURCE_DB_PASSWORD, Env:TARGET_DB_PASSWORD
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Upsert | `INSERT ... ON CONFLICT ... DO UPDATE` | [^am02-upsert] |
| PostgreSQL JDBC driver | 42.7.14, the version the kit pins | The kit's README, checked against Maven Central on October 28, 2026 |
| The rules and their tests | 15 migration tests (12, and 3 lab report writers) pass against PostgreSQL 18.6 and H2 in Db2 and Oracle modes | This chapter's Lab 1, November 24, 2026 |
| Real Db2 or Oracle | *Not verified*: the tool has not been run against either | Book 18, [Chapter 08](../../../books/b18-application-modernization/08-the-reference-implementation.md#what-was-verified-and-what-wasnt) |

## Federal requirements and evidence

The record's controls and KSIs are the kit's `config/requirements.json`, step `LOAD`.[^am02-oscal] [^am02-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The transform rules were tested on the edge cases before the move (Lab 1, steps 2 and 3) | CM-3(2), Testing, Validation, and Documentation of Changes | KSI-CMT-VTD | The data owner; the ISSO keeps the record |
| The load is one recorded change with its report: what was loaded, from which zone, to which watermark (Lab 1, step 4; Lab 2, step 3) | CM-3, Configuration Change Control | KSI-CMT-LMC | The change record holds the report |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them. The kit's records support these controls; the agency's assessor decides them *(design guidance)*.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A rule guessed for an unknown code | Wrong data, silently | The run stops (exit 2) |
| An amount rounded | Cents lost or gained | The run stops |
| Timestamps read in the server's zone | Every time shifts by hours | `--source-zone`, recorded in the report |
| A half-finished load | Children without parents, or half a table | One transaction, parents first |
| A password on the command line | It shows in process lists and shell history | Environment variables only |
| The copy of real data left on a laptop | A privacy incident | Lab 2's back-out; the report holds no row contents |

## Checklist

- [ ] Every transform rule is in `Transform.java`, and the data owner signed off the list.
- [ ] The source zone is stated and recorded in the report.
- [ ] The edge cases came across as the rules say.
- [ ] The run exited 0, or Chapter 03 explains why not.
- [ ] The test database, the copy and the passwords were removed.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 01 — The Contract and the Schema the Service Owns](01-the-contract-and-the-schema-the-service-owns.md) · [Workbook index](index.md) · [Next: Chapter 03 — Proving the Move →](03-proving-the-move.md)
:::

[^am02-upsert]: PostgreSQL Global Development Group, *PostgreSQL 18 Documentation*, "INSERT," section "ON CONFLICT Clause," <https://www.postgresql.org/docs/18/sql-insert.html> (read November 24, 2026).
[^am02-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am02-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
