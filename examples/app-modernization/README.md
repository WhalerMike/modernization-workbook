# Application modernization: reference implementation

> **Status: illustrative. Tested against fixtures, not proven in production.**
> This is a small, runnable slice of the target reference architecture in [Book 18](../../docs/books/b18-application-modernization/index.md): a Java and Spring Boot REST service over PostgreSQL with an API-first contract, a React front end, a DB2/Oracle-to-PostgreSQL migration tool that proves what it moved, and an AI agent that can only propose changes for a person to approve. All data is synthetic. It isn't an endorsement of any product by any agency, and no agency has adopted it. [Chapter 08](../../docs/books/b18-application-modernization/08-the-reference-implementation.md) walks through it.

**Download:** [app-modernization.zip](https://whalermike.github.io/modernization-workbook/downloads/app-modernization.zip), rebuilt from this folder on every site deploy. It also holds a plain-text copy of every source and configuration file, named with `.txt` added (`pom.xml.txt`, `Dockerfile.txt`), for Microsoft 365 Copilot and other tools that refuse code files. Build and run from the originals.

## What is in it

| Part | What it does | Book 18 chapter |
|---|---|---|
| `service/` | Spring Boot REST service over PostgreSQL. Flyway owns the schema. Hand-written OpenAPI 3.1 contract, checked against the code by a test. Errors are RFC 9457 problem details. | [Chapter 03, target architecture](../../docs/books/b18-application-modernization/03-the-target-reference-architecture.md) |
| `service/.../ai/` | A provider-neutral agent loop: model interface, agent identity with a sponsor and a tool allow-list, step limit, argument validation, audit of every tool call, and a human approval step before anything changes. | [Chapter 05, generative and agentic AI](../../docs/books/b18-application-modernization/05-generative-and-agentic-ai.md) |
| `migration/` | Command-line tool that reads a legacy DB2 or Oracle schema over JDBC, transforms it, upserts it into PostgreSQL in batches, supports a delta mode for the coexistence period, and validates the result three ways. | [Chapter 04, moving the data](../../docs/books/b18-application-modernization/04-moving-the-data.md) |
| `web/` | React front end: case list with a status filter, case detail, **Run triage**, and a pending-proposals panel with **Approve** and **Reject**. | [Chapter 03](../../docs/books/b18-application-modernization/03-the-target-reference-architecture.md) |
| `docker-compose.yml` | PostgreSQL, the API and the web front end (nginx) as containers. | [Chapter 03](../../docs/books/b18-application-modernization/03-the-target-reference-architecture.md) |

## Versions

Checked against Maven Central, the npm registry and Docker Hub on October 28, 2026.

| Component | Version |
|---|---|
| Java | 21 (LTS); built and tested with Microsoft Build of OpenJDK 21.0.10 |
| Spring Boot | 4.1.2 (Spring Framework 7, Jackson 3, Flyway 12.4) |
| Maven | 3.9.16, through the Maven Wrapper 3.3.4 (`mvnw`, `mvnw.cmd`); the distribution's SHA-256 is pinned in `.mvn/wrapper/maven-wrapper.properties` |
| PostgreSQL JDBC driver | 42.7.14 |
| Embedded PostgreSQL for tests | Zonky `embedded-postgres` 2.2.2 with PostgreSQL 18.6 binaries |
| H2 (legacy stand-in in tests only) | 2.5.252 |
| React | 19.3.1 |
| Vite / Vitest | 8.3.5 / 5.0.5, with Testing Library and jsdom 30.1.3 |
| Container images | `postgres:18`, `eclipse-temurin:21-jdk` and `21-jre`, `node:24-alpine`, `nginx:1.30-alpine` |

jsdom 30 asks for Node.js 24.15 or later. The tests also pass on 24.14.1 with an engine warning.

## Run the tests

You need Java 21 and Node.js 24. You don't need Maven, Docker or a PostgreSQL server: the wrapper downloads Maven, and the tests download real PostgreSQL binaries from Maven Central and start them in-process.

```sh
# from examples/app-modernization
./mvnw verify            # Windows: mvnw.cmd verify
cd web && npm ci && npm test && npm run build
```

| Part | Tests | Against |
|---|---|---|
| `service` | 25: list, filter, get, 404 and 400 problem details, health, contract-versus-code, triage creates a PENDING proposal and leaves the case alone, re-triage doesn't duplicate, approval applies, rejection doesn't, a proposal is decided once, the agent can't approve its own proposal, a disallowed tool is denied and audited, a known tool left off the allow-list is neither offered nor run, the step limit stops a looping model, invalid arguments are rejected | Real PostgreSQL 18 (embedded), schema applied by Flyway at startup |
| `migration` | 12: full load through the CLI passes and writes the report, edge cases (padding, sentinel date, non-ASCII names, amounts), source time zone, a changed amount, a deleted row and a truncated name each fail the right checks, non-zero exit on mismatch, delta mode, idempotent re-run, Oracle-dialect stand-in, canonical form | Source: H2 in DB2 or Oracle mode. Target: real PostgreSQL 18 (embedded) with the service's own `V1__baseline.sql` |
| `web` | 6: renders the list, filters by status, shows a not-found message, runs triage and shows the proposal, approve and reject post the right body | jsdom, with `fetch` mocked |

The migration tests apply the service's Flyway folder (`service/src/main/resources/db/migration`) directly, so the target schema exists in exactly one file.

## Run it locally without containers

Start PostgreSQL (any 16 or later), create a database, then:

```sh
DB_URL=jdbc:postgresql://localhost:5432/cases DB_USER=cases DB_PASSWORD=... \
  SPRING_PROFILES_ACTIVE=demo ./mvnw -pl service spring-boot:run
cd web && npm run dev       # http://localhost:5173, proxies /api to http://localhost:8080
```

The `demo` profile loads five synthetic cases (`service/src/main/resources/db/sample`). Without it the service starts empty, ready for a migration run. The contract is served at `http://localhost:8080/openapi.yaml`; health is at `/actuator/health`.

## The API

| Method and path | Does |
|---|---|
| `GET /api/cases?status=` | Lists cases, newest first; `status` is `OPEN`, `PENDING` or `CLOSED` |
| `GET /api/cases/{caseNumber}` | One case; 404 problem details if it doesn't exist, 400 if the number isn't `C-` and six digits |
| `POST /api/cases/{caseNumber}/triage` | Runs the agent on the case and returns its answer and the PENDING proposals it recorded |
| `GET /api/proposals?status=PENDING` | Lists proposals |
| `POST /api/proposals/{id}/decision` | Body `{"decision":"APPROVED"\|"REJECTED","decidedBy":"..."}`. Approving `FLAG_FOR_REVIEW` moves an OPEN case to PENDING; approving `CLOSE_CASE` sets CLOSED and today's `closed_on`; rejecting changes no case. 409 if already decided |

`service/src/main/resources/static/openapi.yaml` is the contract. `OpenApiContractTest` reads it with SnakeYAML and compares its operations with the controllers' request mappings, in both directions: an undocumented endpoint or an unimplemented path fails the build.

## The agent

The agent follows the pattern in Chapter 05: the model decides what to ask for, and code the agency controls decides what runs.

| Piece | Where | What it does |
|---|---|---|
| `ModelClient` | `ai/ModelClient.java` | One method, `ModelReply next(ModelRequest)`. The request carries the system instruction, the conversation so far (with every tool result) and the tools on offer. The reply is a final answer or one tool call. |
| `StubModelClient` | `ai/StubModelClient.java` | The default (`app.ai.provider=stub`). Deterministic and rule-based, no API key, no network. It reads the case and the applicant's other cases, and proposes `FLAG_FOR_REVIEW` if the case is OPEN with no closing date and was opened more than 365 days before "today" (an injected `Clock`), or if the applicant has another OPEN case of the same type. Otherwise it answers "no action". Two test modes misbehave on purpose: one asks for a tool it was never offered, one never stops. |
| `AgentIdentity` | `ai/AgentIdentity.java` | `app.agent.id`, `app.agent.sponsor`, `app.agent.allowed-tools`. The service won't start without an id and a sponsor. Every proposal and audit row carries the agent id. |
| `CaseTriageAgent` | `ai/CaseTriageAgent.java` | The loop. It offers only allow-listed tools, refuses and audits any other tool name, validates arguments (case number format, known action, rationale length, no unexpected arguments, proposals only for the case being triaged), audits every call in `agent_audit`, and stops after `app.agent.max-steps` (default 5). |
| Tools | `get_case`, `list_related_cases`, `propose_action` | Two reads, and one write that only inserts a PENDING `agent_proposal` row. No tool can change a case. |
| Approval | `cases/ProposalService.java` | The only code that applies a proposal, and only when a person records a decision. A decision recorded in the agent's own name is refused. |

### Adding a real model provider

Write a class that implements `ModelClient` and register it as a bean conditional on `app.ai.provider=<name>`, next to the stub in `AiConfiguration`. Its `next` method:

1. turns `ModelRequest.tools()` into the provider's tool or function definitions (name, description, a JSON schema built from `parameters`);
2. turns the conversation into the provider's messages: `USER` text, `ASSISTANT` tool calls with their arguments, and `TOOL` results with `data` serialized as JSON;
3. sends the request with the system instruction, and reads back either text (return `FinalAnswer`) or one tool call (return `ToolCall` with the parsed arguments). If the provider returns several tool calls, return the first and let the loop come back for the rest.

The adapter needs no trust: the agent loop still filters the tools, validates every argument and enforces the step limit, whatever the model returns. Keep the API key in the platform's secret store, read it from the environment, and give the adapter its own outbound network allowance. No provider SDK is included here.

## The migration tool

### What it reads and writes

The legacy schema is synthetic: `migration/src/main/resources/legacy/db2-schema.sql`, with the same tables in Oracle syntax in `oracle-schema.sql` and about 50 seeded cases in `seed.sql`.

| Legacy (DB2) | Target (PostgreSQL) | Transform |
|---|---|---|
| `APPLICANT.APPL_ID INTEGER` | `applicant.id bigint` | none |
| `LAST_NM CHAR(30)`, `FIRST_NM CHAR(20)`, `ST_CD CHAR(2)` | `last_name varchar(30)`, `first_name varchar(20)`, `state_code char(2)` | trailing CHAR padding removed (leading spaces are data and kept) |
| `CASE_MSTR.CASE_NO CHAR(10)` | `case_record.case_number varchar(10)` | padding removed |
| `STAT_CD CHAR(1)` `O`/`P`/`C` | `status` `OPEN`/`PENDING`/`CLOSED` | mapped; any other code stops the run |
| `CLOSE_DT DATE NOT NULL`, `0001-01-01` meaning "no date" | `closed_on date null` | sentinel becomes NULL |
| `AMT_CLAIMED DECIMAL(11,2)` | `amount_claimed numeric(11,2)` | scale 2 kept exactly; a value needing rounding stops the run |
| `LAST_UPD_TS TIMESTAMP` (no zone) | `updated_at timestamptz` | read as wall-clock time in `--source-zone` (default UTC) |

All of the rules live in `Transform.java`. Dates are read as `LocalDate`, not through `java.sql.Date`, because the old calendar handling in `java.util.Date` shifts very old dates such as the sentinel.

### Running it

Build it with `./mvnw -pl migration package`, then put the PostgreSQL driver and your source database's JDBC driver on the class path. The DB2 (`com.ibm.db2:jcc`) and Oracle (`com.oracle.database.jdbc:ojdbc11`) drivers aren't included: get them under your own license terms.

```sh
export SOURCE_DB_PASSWORD=...   # passwords only from the environment, never arguments
export TARGET_DB_PASSWORD=...
java -cp "migration/target/legacy-migration-0.1.0-SNAPSHOT.jar:postgresql-42.7.14.jar:jcc.jar" \
  gov.example.modernization.migration.MigrateCli \
  --source-url jdbc:db2://legacy-host:50000/CASEDB --source-user migrator \
  --target-url jdbc:postgresql://localhost:5432/cases --target-user cases \
  --source-zone UTC --batch-size 500 --report validation-report.json
```

On Windows, separate class-path entries with `;`. Options:

| Option | Meaning |
|---|---|
| `--since 2026-10-01T00:00:00Z` | Delta mode: load only cases whose `LAST_UPD_TS` is at or after this instant, and the applicants they reference. Use the previous report's `nextWatermark`. The bound is inclusive, so the boundary row is loaded again, which is harmless because every write is an upsert. |
| `--validate-only` | Load nothing; compare the two sides and write the report. |
| `--source-zone` | The zone the legacy timestamps are in, for example `America/New_York`. |

The tool loads parents before children (`applicant`, then `case_record`) in one transaction, with `INSERT ... ON CONFLICT ... DO UPDATE` in batches, so a re-run is safe. Exit codes: 0 every check passed, 1 a check failed, 2 a usage or runtime error.

Delta mode has two limits a real coexistence design must cover. `APPLICANT` has no change timestamp, so an applicant whose name changes without a case change isn't picked up by a delta (the validation will show it). And a delta can't see deletes in the source: use change data capture for those, as Chapter 04 describes.

### The checks, and what each proves

After loading, the tool validates the whole of both tables, not just the rows it loaded.

| Check | How | Proves | Doesn't prove |
|---|---|---|---|
| `row_count` | Rows on each side | Nothing was dropped or duplicated wholesale | That the rows hold the right values |
| `checksum_sha256` | Each row rendered to a canonical string; rows sorted by primary key in Java; SHA-256 over `row + "\n"` for every row. Source rows are rendered after the transform, target rows as stored. On a mismatch the report lists which keys differ, are missing or are extra (keys only) | Every row in the target equals the transformed source row, field by field, including text and dates | That the transform itself is right: both sides share it, so a wrong rule (say, mapping `P` to `CLOSED`) passes |
| `aggregate` | Computed in SQL by each database on its own: for cases, `COUNT(*)` and `SUM(AMT_CLAIMED)` per status code; for applicants, `COUNT(*)` and `SUM(APPL_ID)` | Totals agree, computed by two different engines without the tool's transform (only the status-code names are shared) | Text columns: a truncated name passes this check, which is why the checksum exists |

The canonical row string, defined once in `Canonical.java`:

- fields in column order, separated by `|`; in text, `\` and `|` are escaped as `\\` and `\|`;
- NULL is the token `\N`, which escaped text can't produce;
- text exactly as given (source after padding is removed; target as stored, so stray padding or truncation in the target is a difference);
- dates as ISO 8601 `yyyy-MM-dd`; timestamps as UTC instants in ISO 8601, to the microsecond;
- amounts as plain decimals with scale 2 (`1234.50`).

For example: `C-000001|1|DEF|CLOSED|2024-02-02|2024-02-03|1234.56|2026-02-02T01:07:13.001234Z`.

The tests prove the checks catch damage: after a full load they change one amount (checksum and aggregate fail), delete one row (all three fail) and truncate one name (only the checksum fails), and each time the report names the table, the check and the key.

### The report

`validation-report.json` holds keys, counts and digests, never row contents, so it can go into the change record:

```json
{
  "generatedAt": "2026-10-28T14:00:00Z",
  "mode": "full",
  "since": null,
  "sourceZone": "UTC",
  "nextWatermark": "2026-09-27T02:02:38.032084Z",
  "loaded": { "applicant": 20, "case_record": 50 },
  "passed": false,
  "failures": [ "case_record/checksum_sha256", "case_record/aggregate" ],
  "tables": [
    {
      "table": "case_record",
      "sourceTable": "CASE_MSTR",
      "passed": false,
      "checks": [
        { "check": "row_count", "passed": true, "source": { "rows": "50" }, "target": { "rows": "50" } },
        { "check": "checksum_sha256", "passed": false,
          "source": { "sha256": "9f2c..." }, "target": { "sha256": "41ab..." },
          "detail": "differ 1 [C-000010]; missing from target 0; extra in target 0" },
        { "check": "aggregate", "passed": false,
          "source": { "CLOSED.count": "14", "CLOSED.sum_amount": "...", "OPEN.count": "23", "...": "..." },
          "target": { "CLOSED.count": "14", "CLOSED.sum_amount": "...", "OPEN.count": "23", "...": "..." } }
      ]
    }
  ]
}
```

The real report also has the `applicant` table entry; `mode` is `full`, `delta` or `validate-only`.

## Containers

```sh
cp .env.example .env    # set your own password; .env is gitignored
docker compose up --build
```

The web front end is on `http://localhost:8081`; nginx serves the built React app and forwards `/api/` to the `api` container. The API waits for PostgreSQL's health check, reads its datasource from environment variables, and runs with the `demo` profile. `service/Dockerfile` builds with the Maven Wrapper on a Temurin 21 JDK image and runs on a Temurin 21 JRE image as a non-root user; `web/Dockerfile` builds with Node.js 24 and serves with nginx.

**The compose file and both Dockerfiles were not run in CI or locally by the authors**: Docker wasn't available where this was built. The compose file was checked only with a YAML parser.

## What was verified, and what wasn't

| Claim | Status |
|---|---|
| The service runs against real PostgreSQL | Verified: every service test runs on PostgreSQL 18.6 (embedded binaries), with the Flyway migration applied, and one test asserts the engine version |
| The target schema is the one the service owns | Verified: the migration tests apply the service's Flyway folder, not a copy |
| The migration works against DB2 or Oracle | **Not verified.** The tests use H2 in DB2 and Oracle compatibility modes as a stand-in. H2 isn't DB2 or Oracle: CHAR comparison, date types, the Oracle `DATE` time part and driver behavior all differ. Run the tool against a copy of the real source before relying on it |
| The containers start | **Not verified** (see above) |
| The agent works with a real model | **Not verified.** Only the deterministic stub runs. The guard tests use the stub and scripted replies |
| The web front end works against the real API | Unit-tested with a mocked `fetch` only; the request shapes match the OpenAPI contract, but no end-to-end browser test runs |

## Security notes

- **No secrets in the repository.** Database passwords come from environment variables (`DB_PASSWORD`, `SOURCE_DB_PASSWORD`, `TARGET_DB_PASSWORD`); `.env.example` holds a placeholder and `.env` is gitignored. The stub model needs no key.
- **The agent can't change records.** Its tools are two reads and one insert into `agent_proposal`. A person approves or rejects each proposal through `POST /api/proposals/{id}/decision`, and only that path changes a case. The agent's own id can't be the decider.
- **Model output is untrusted.** Tool names are checked against the allow-list, arguments against strict formats, and every call (allowed, denied or rejected) is written to `agent_audit` with the agent id. A hard step limit stops runaway loops.
- **This example has no authentication.** A real deployment puts the API behind the agency's identity provider, takes `decidedBy` from the authenticated user rather than the request body, and gives the agent its own workload identity ([Book 17](../../docs/books/b17-ai-identity/index.md)).
- **Reports carry no personal data.** The validation report holds keys, counts and hashes only. The audit table stores reasons, not raw model arguments.
- **Synthetic data only.** Names such as `Applicant-0001`, case numbers `C-000001`, case types `ABC`/`DEF`/`GHI` and state codes `XA`-`XD` are made up.

## Layout

```
app-modernization/
  pom.xml, mvnw, mvnw.cmd, .mvn/wrapper/   Maven parent (modules: service, migration) and wrapper
  docker-compose.yml, .env.example
  service/    Spring Boot service; Dockerfile; db/migration/V1__baseline.sql; static/openapi.yaml
  migration/  migration CLI; legacy/ schemas and seed
  web/        React app (Vite); Dockerfile; nginx.conf
```
