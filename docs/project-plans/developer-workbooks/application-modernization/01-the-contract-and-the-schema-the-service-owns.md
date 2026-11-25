---
title: "Chapter 01 — The Contract and the Schema the Service Owns"
description: "The case service's hand-written OpenAPI 3.1 contract, checked against the code's request mappings in both directions by a test, its errors as RFC 9457 problem details, and its schema in one Flyway migration that the migration tool's tests also apply, all run against a real PostgreSQL 18 server the tests start themselves. Lab 1 lists the contract's operations, runs the contract and API tests, reads the problem details the service returns and writes the step's evidence record; Lab 2 runs the service against a test PostgreSQL server and drops the test database afterwards."
doc-type: workbook-chapter
audience: [Technical]
family: dw-application-modernization
part: How
series-order: 1
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
---
# Chapter 01 — The Contract and the Schema the Service Owns

*A contract nobody checks drifts from the code within a release. A test that compares the two in both directions makes drift a red build.*

::: {.callout-note}
## In this chapter
The service at the center of [Book 18's target architecture](../../../books/b18-application-modernization/03-the-target-reference-architecture.md): API-first, with one contract, errors a machine can read, and a schema the service owns. You start with what Book 18 and the standards it cites ask for, then read how the kit enforces each: a contract test that fails on an undocumented endpoint or an unimplemented path, problem details for every error, and one Flyway file as the only source of the schema. Lab 1 runs the tests on a laptop against a PostgreSQL 18 server the tests start; Lab 2 runs the service against a test server.
:::

## Goal and audience

**Goal.** By the end of this chapter you can show, from a test run, that the service implements exactly the operations its contract documents, that every error it returns is a problem details body, and that its schema exists in one file.

**Audience.** Developers who build services on the target architecture, and the architects who review them at [Book 18's Gate 2](../../../books/b18-application-modernization/07-who-governs-the-architecture.md). You should be able to read a Spring Boot controller and run a Maven build.

## Start with the book and the standards

### What they give you

Book 18's [Chapter 03](../../../books/b18-application-modernization/03-the-target-reference-architecture.md) sets the target: Spring Boot services over PostgreSQL, API-first, with the contract written before the code. RFC 9457, *Problem Details for HTTP APIs*, defines a JSON body for errors with `type`, `title`, `status`, `detail` and `instance`, and replaced RFC 7807 in July 2023.[^am01-rfc9457] Flyway applies versioned migrations to a database in order and records which it applied. The kit pins Spring Boot 4.1.2 and PostgreSQL 18, the versions current when it was built.[^am01-boot] [^am01-pg]

### What they leave to you

Each row is pinned by a test in `service/src/test/java`.

| What the book or standard gives | Why it matters | What the kit adds |
|---|---|---|
| "Write the contract first" | A contract written first is still wrong a release later if nothing compares it with the code | `OpenApiContractTest` reads `openapi.yaml` and compares its operations with the request mappings Spring registered, both ways |
| RFC 9457's body | A framework produces it for its own exceptions, not for the application's | `ApiExceptionHandler` maps not found to 404, a bad argument to 400 and a second decision to 409, each as `application/problem+json` (`CaseApiTest`, `TriageAndApprovalTest`) |
| Versioned migrations | Two copies of a schema drift apart | One file, `V1__baseline.sql`, applied by the service at startup and by the migration tool's tests from the same folder |
| A test database | An in-memory stand-in hides the real engine's behavior | Every service test runs on PostgreSQL 18.6, started by the tests from Zonky's embedded binaries;[^am01-zonky] one test asserts the engine and version |

**The verdict.** Use Spring Boot, Flyway and RFC 9457 as published. Build the two-way contract test, the error mapping and the single schema file.

## The code

| Part | File | What it does |
|---|---|---|
| Contract | `service/src/main/resources/static/openapi.yaml` | Five operations, served at `/openapi.yaml` |
| Contract test | `service/src/test/java/.../OpenApiContractTest.java` | Fails on an operation in the code but not the contract, or in the contract but not the code |
| Controllers | `cases/CaseController.java`, `cases/ProposalController.java` | `GET /api/cases`, `GET /api/cases/{caseNumber}`, `POST /api/cases/{caseNumber}/triage`, `GET /api/proposals`, `POST /api/proposals/{id}/decision` |
| Errors | `cases/ApiExceptionHandler.java` | Problem details for 404, 400 and 409; Spring's own for a parameter it can't convert |
| Schema | `db/migration/V1__baseline.sql` | `applicant`, `case_record`, `agent_proposal`, `agent_audit` |
| Lab records | `ai/LabRecordsTest.java` | Writes the API's answers to `service/target/lab/` for Lab 1 to read |

Case numbers are `C-` and six digits; a malformed one is refused before any query runs.

::: {.callout-important}
## Illustrative code
Lab 1 uses five fictional applicants and six cases, named `Applicant-0001` and `C-000001`. The service has no authentication: a real deployment puts it behind the agency's identity provider (Chapter 06). Run Lab 2 against a test database before the code goes near a real one.
:::

## Lab 1: fixtures, no tenant

You need Java 21 and PowerShell 7.4 or later; Maven, the PostgreSQL binaries and the test libraries download on the first run. Work in `examples/app-modernization`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/app-modernization`. Each step below says what it does and what to look for.

```powershell
# Step 1: List what the contract documents
Import-Module ./powershell/AppModernization/AppModernization.psm1
Get-AmContractOperation -Path service/src/main/resources/static/openapi.yaml | Format-Table

# Step 2: Run the contract and API tests, and the lab records
./mvnw -q -pl service test "-Dtest=OpenApiContractTest,CaseApiTest,LabRecordsTest"

# Step 3: Read the results
Get-AmTestResult -Path service/target/surefire-reports | Format-Table

# Step 4: See the problem details the service returned
foreach ($f in 'api-not-found', 'api-bad-number', 'api-bad-status') { $r = Read-AmJson -Path "service/target/lab/$f.json"; [pscustomobject]@{ File = $f; Status = $r.httpStatus; ContentType = $r.contentType; Title = $r.body.title; Detail = $r.body.detail } }

# Step 5: Find the schema's single source
Get-ChildItem -Recurse -Filter 'V*__*.sql' -Path service/src, migration/src | ForEach-Object { $_.FullName.Substring($PWD.Path.Length + 1) -replace '\\', '/' }

# Step 6: Write the step's evidence record
Write-AmEvidenceRecord -Step CONTRACT -Path service/src/main/resources/static/openapi.yaml, service/src/main/resources/db/migration/V1__baseline.sql, service/target/surefire-reports/TEST-gov.example.modernization.OpenApiContractTest.xml, service/target/surefire-reports/TEST-gov.example.modernization.CaseApiTest.xml -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-List Record, Step, Files, Controls, KSIs

# After the steps
Remove-Item -Recurse -Force out
```

:::

<!-- labs:end -->

1. **List what the contract documents:**

   ```powershell
   Import-Module ./powershell/AppModernization/AppModernization.psm1
   Get-AmContractOperation -Path service/src/main/resources/static/openapi.yaml | Format-Table
   ```

   <!-- capture:begin 01-1 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/01-1.txt))](captures/01-1.png){.lightbox fig-alt="Terminal window showing Import-Module ./powershell/AppModernization/AppModernization.psm1 and what it printed"}

   <!-- capture:end -->

   Five operations, each with an `operationId`.

2. **Run the contract and API tests, and the lab records:**

   ```powershell
   ./mvnw -q -pl service test "-Dtest=OpenApiContractTest,CaseApiTest,LabRecordsTest"
   ```

   <!-- capture:begin 01-2 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/01-2.txt))](captures/01-2.png){.lightbox fig-alt="Terminal window showing ./mvnw -q -pl service test '-Dtest=OpenApiContractTest,CaseApiTest,LabRecords… and what it printed"}

   <!-- capture:end -->

   Quiet means passed: Maven prints nothing unless a test fails. The tests' own log is in `service/target/surefire-reports`. The one line the JVM may print, a warning that class sharing is limited because the test agent extends the class path, is harmless.

3. **Read the results:**

   ```powershell
   Get-AmTestResult -Path service/target/surefire-reports | Format-Table
   ```

   <!-- capture:begin 01-3 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/01-3.txt))](captures/01-3.png){.lightbox fig-alt="Terminal window showing Get-AmTestResult -Path service/target/surefire-reports | Format-Table and what it printed"}

   <!-- capture:end -->

   No failures or errors in `OpenApiContractTest`, `CaseApiTest` or `LabRecordsTest`.

4. **See the problem details the service returned:** a case that doesn't exist, a malformed case number, and a status the contract doesn't list:

   ```powershell
   foreach ($f in 'api-not-found', 'api-bad-number', 'api-bad-status') { $r = Read-AmJson -Path "service/target/lab/$f.json"; [pscustomobject]@{ File = $f; Status = $r.httpStatus; ContentType = $r.contentType; Title = $r.body.title; Detail = $r.body.detail } }
   ```

   <!-- capture:begin 01-4 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/01-4.txt))](captures/01-4.png){.lightbox fig-alt="Terminal window showing foreach ($f in 'api-not-found', 'api-bad-number', 'api-bad-status') { $r = Re… and what it printed"}

   <!-- capture:end -->

   Every one is `application/problem+json`. The first two come from the kit's handler; the third, a value Spring can't convert to the `status` enumeration, from Spring's own.

5. **Find the schema's single source:**

   ```powershell
   Get-ChildItem -Recurse -Filter 'V*__*.sql' -Path service/src, migration/src | ForEach-Object { $_.FullName.Substring($PWD.Path.Length + 1) -replace '\\', '/' }
   ```

   <!-- capture:begin 01-5 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/01-5.txt))](captures/01-5.png){.lightbox fig-alt="Terminal window showing Get-ChildItem -Recurse -Filter 'V*__*.sql' -Path service/src, migration/src |… and what it printed"}

   <!-- capture:end -->

   Two files: the baseline, and the demo data the `demo` profile adds. The migration tool has no copy.

6. **Write the step's evidence record:**

   ```powershell
   Write-AmEvidenceRecord -Step CONTRACT -Path service/src/main/resources/static/openapi.yaml, service/src/main/resources/db/migration/V1__baseline.sql, service/target/surefire-reports/TEST-gov.example.modernization.OpenApiContractTest.xml, service/target/surefire-reports/TEST-gov.example.modernization.CaseApiTest.xml -OutputPath out/evidence -AsOf 2026-11-24T00:00:00Z | Format-List Record, Step, Files, Controls, KSIs
   ```

   <!-- capture:begin 01-6 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

   ![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/01-6.txt))](captures/01-6.png){.lightbox fig-alt="Terminal window showing Write-AmEvidenceRecord -Step CONTRACT -Path service/src/main/resources/static… and what it printed"}

   <!-- capture:end -->

**Expected result:** five operations, no failed tests, three problem details bodies and `record-001-CONTRACT.json` in `out/evidence`. Delete `out` when you're done:

```powershell
Remove-Item -Recurse -Force out
```

<!-- capture:begin 01-7 (generated by scripts/kit_captures.py; not part of the reviewed page) -->

![What the terminal shows, run on the kit's fixtures ([the same output as text](https://github.com/WhalerMike/modernization-workbook/blob/main/data/kit-captures/am/01-7.txt))](captures/01-7.png){.lightbox fig-alt="Terminal window showing Remove-Item -Recurse -Force out and what it printed"}

<!-- capture:end -->

## Lab 2: a test PostgreSQL server

Use a PostgreSQL 16 or later server for testing, never production, with an empty database you may drop afterwards. You need Java 21, PowerShell 7.4 or later and `psql`. Work in `examples/app-modernization`. You'll replace: `<pg-host>` (the server), `<database>` (the empty test database) and `<db-user>` (a user that owns it). The password is read at a prompt and kept only in the session's environment.

<!-- labs:begin lab-2-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-2-commands collapse="false" title="Every command in Lab 2"}
Every command in this lab, in order, from `examples/app-modernization`. Each step below says what it does and what to look for.

```powershell
# Step 1: Point the service at the test database
$env:DB_URL = 'jdbc:postgresql://<pg-host>:5432/<database>'
$env:DB_USER = '<db-user>'
$env:DB_PASSWORD = Read-Host 'Database password' -MaskInput

# Step 2: Build it and start it with the demo data
./mvnw -q -pl service package -DskipTests
$svc = Start-Process java -ArgumentList '-jar', 'service/target/case-service-0.1.0-SNAPSHOT.jar', '--spring.profiles.active=demo' -PassThru -NoNewWindow -RedirectStandardOutput service-test.log
do { Start-Sleep -Seconds 2 } until ((Invoke-RestMethod http://localhost:8080/actuator/health -ErrorAction SilentlyContinue).status -eq 'UP')

# Step 3: Call it as the contract says
Invoke-RestMethod 'http://localhost:8080/api/cases?status=OPEN' | Format-Table caseNumber, status, openedOn, amountClaimed
Invoke-WebRequest http://localhost:8080/api/cases/C-999999 -SkipHttpErrorCheck | Select-Object StatusCode, @{ n = 'ContentType'; e = { $_.Headers['Content-Type'] } }, Content
(Invoke-WebRequest http://localhost:8080/openapi.yaml).Content.Split("`n")[0..3]

# Step 4: Check Flyway applied one migration, and the demo data
psql -h <pg-host> -U <db-user> -d <database> -c 'select version, description, success from flyway_schema_history order by installed_rank'

# Step 5: Back it out
Stop-Process -Id $svc.Id
psql -h <pg-host> -U <db-user> -d postgres -c 'DROP DATABASE <database>'
Remove-Item service-test.log; Remove-Item Env:DB_URL, Env:DB_USER, Env:DB_PASSWORD
```

:::

<!-- labs:end -->

1. **Point the service at the test database:**

   ```powershell
   $env:DB_URL = 'jdbc:postgresql://<pg-host>:5432/<database>'
   $env:DB_USER = '<db-user>'
   $env:DB_PASSWORD = Read-Host 'Database password' -MaskInput
   ```

2. **Build it and start it with the demo data:**

   ```powershell
   ./mvnw -q -pl service package -DskipTests
   $svc = Start-Process java -ArgumentList '-jar', 'service/target/case-service-0.1.0-SNAPSHOT.jar', '--spring.profiles.active=demo' -PassThru -NoNewWindow -RedirectStandardOutput service-test.log
   do { Start-Sleep -Seconds 2 } until ((Invoke-RestMethod http://localhost:8080/actuator/health -ErrorAction SilentlyContinue).status -eq 'UP')
   ```

3. **Call it as the contract says:**

   ```powershell
   Invoke-RestMethod 'http://localhost:8080/api/cases?status=OPEN' | Format-Table caseNumber, status, openedOn, amountClaimed
   Invoke-WebRequest http://localhost:8080/api/cases/C-999999 -SkipHttpErrorCheck | Select-Object StatusCode, @{ n = 'ContentType'; e = { $_.Headers['Content-Type'] } }, Content
   (Invoke-WebRequest http://localhost:8080/openapi.yaml).Content.Split("`n")[0..3]
   ```

   Three open cases from the demo data, a 404 problem body, and the contract the service serves.

4. **Check Flyway applied one migration, and the demo data:**

   ```powershell
   psql -h <pg-host> -U <db-user> -d <database> -c 'select version, description, success from flyway_schema_history order by installed_rank'
   ```

5. **Back it out:** stop the service, then drop the test database from the `postgres` database:

   ```powershell
   Stop-Process -Id $svc.Id
   psql -h <pg-host> -U <db-user> -d postgres -c 'DROP DATABASE <database>'
   Remove-Item service-test.log; Remove-Item Env:DB_URL, Env:DB_USER, Env:DB_PASSWORD
   ```

## Verified facts

| Item | Value | Source |
|---|---|---|
| Problem details | RFC 9457, July 2023; obsoletes RFC 7807; media type `application/problem+json` | [^am01-rfc9457] |
| Spring Boot | 4.1.2, the latest generally available release on October 28, 2026 | [^am01-boot] |
| PostgreSQL | Version 18, minor release 18.6, supported | [^am01-pg] |
| Embedded PostgreSQL | Zonky `embedded-postgres` 2.2.2, real binaries from Maven Central | [^am01-zonky] |
| The kit's tests | 28 service tests, including the 3 lab record writers, pass on PostgreSQL 18.6 | This chapter's Lab 1 and `mvnw verify`, November 24, 2026 |

## Federal requirements and evidence

The record's controls and KSIs are the kit's `config/requirements.json`, step `CONTRACT`.[^am01-oscal] [^am01-ksi]

| What the output proves | Requirement it supports | KSI it aligns to | Who keeps it |
|---|---|---|---|
| The contract and the code agree in both directions, tested before the change ships (Lab 1, steps 2 and 3) | CM-3(2), Testing, Validation, and Documentation of Changes | KSI-CMT-VTD | The service's technical owner; the ISSO keeps the record and the test reports |
| The schema is one versioned file, and the contract one served document: the service's baseline (Lab 1, steps 1 and 5) | CM-2, Baseline Configuration | KSI-SVC-ACM | The service's technical owner |

KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them ([Book 00, Appendix B](../../../books/b00-orientation/appendix-b-engagement-archetype.md)). The kit's records support these controls; the agency's assessor decides them. Which output supports which control is the program's mapping *(design guidance)*.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| An endpoint added without the contract | Clients and the gateway don't know it exists; a security review misses it | The contract test fails the build |
| A contract path nobody implemented | Clients are built against an API that 404s | The contract test fails the build |
| An error page as HTML or a stack trace | A client can't tell the errors apart; internals leak | Problem details for every error the service raises |
| A second copy of the schema | The migration loads a schema the service doesn't have | One Flyway folder, read by both |
| Tests on an in-memory database | Engine differences appear only in production | PostgreSQL 18.6 in every test |

## Checklist

- [ ] The contract test passes, and runs in the pipeline on every change.
- [ ] Every error path returns `application/problem+json`.
- [ ] The schema exists only under `db/migration`.
- [ ] The service starts against the test database and Flyway records one migration.
- [ ] The test database was dropped.

::: {.callout-tip}
## Continue the book
[Workbook index](index.md) · [Next: Chapter 02 — Moving the Data: the Transform and the Load →](02-moving-the-data-the-transform-and-the-load.md)
:::

[^am01-rfc9457]: M. Nottingham, E. Wilde and S. Dalal, RFC 9457, *Problem Details for HTTP APIs*, July 2023 (obsoletes RFC 7807), <https://www.rfc-editor.org/rfc/rfc9457.html> (accessed Oct 28, 2026; carried from Book 18, Chapter 08).
[^am01-boot]: Maven Central, `org.springframework.boot:spring-boot` metadata, versions through 4.1.2 and 4.2.0-RC1, <https://repo1.maven.org/maven2/org/springframework/boot/spring-boot/maven-metadata.xml> (accessed Oct 28, 2026; carried from Book 18, Chapter 08).
[^am01-pg]: PostgreSQL Global Development Group, "Versioning Policy," <https://www.postgresql.org/support/versioning/> (accessed Oct 28, 2026; carried from Book 18, Chapter 08).
[^am01-zonky]: Zonky, `io.zonky.test:embedded-postgres` 2.2.2, <https://github.com/zonkyio/embedded-postgres> (accessed Oct 28, 2026; carried from Book 18, Chapter 08).
[^am01-oscal]: National Institute of Standards and Technology, SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0, <https://github.com/usnistgov/oscal-content/blob/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Nov 11, 2026; carried from Book 18, Appendix A).
[^am01-ksi]: FedRAMP, "Key Security Indicators," *FedRAMP Consolidated Rules for 2026*, <https://www.fedramp.gov/2026/providers/20x/key-security-indicators/> (read November 9, 2026; carried from *Building Provider Notices*).
