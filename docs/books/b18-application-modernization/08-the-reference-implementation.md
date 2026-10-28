---
title: "Chapter 08 — The Reference Implementation"
description: "A small, runnable slice of the book's target architecture in the repository's examples/app-modernization folder: a Spring Boot REST service over PostgreSQL with an OpenAPI contract the build checks against the code, a React front end, a DB2/Oracle to PostgreSQL migration tool that proves the move with row counts, checksums and independent aggregates, and an AI agent with an identity, a sponsor, a tool allow-list and a step limit that can only propose changes a person approves; what its tests prove, and what they don't."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b18-application-modernization
book: B18
part: How
series-order: 8
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 08 — The Reference Implementation

*An architecture is easier to trust when it runs: a small, tested slice shows each pattern in code and states plainly what the tests don't prove.*

::: {.callout-note}
## In this chapter
What the reference implementation in [`examples/app-modernization`](https://github.com/WhalerMike/modernization-workbook/tree/main/examples/app-modernization) contains and which chapter each part illustrates. The service and its contract test, the migration tool and its three checks, and the agent and its guardrails. How to run the tests, what was verified on October 28, 2026, and what wasn't.
:::

The chapters before this one argue for a target architecture ([Chapter 03](03-the-target-reference-architecture.md)), a way of moving data with proof ([Chapter 04](04-moving-the-data.md)) and guardrails for agents ([Chapter 05](05-generative-and-agentic-ai.md)). Arguments about architecture are cheap; code that runs is not. The workbook therefore ships a small reference implementation beside this book, in the repository's `examples/app-modernization` folder. It is one mission application in miniature: a case-management service with a front end, a legacy database it was moved from, and an AI agent that helps triage cases. It is deliberately small, so that a reader can understand the whole of it in an afternoon, and every part has automated tests.

It is illustrative, not production code. All its data is synthetic, it has no authentication, and it has not been run against a real DB2 or Oracle database or in production. The last section of this chapter says exactly what was verified.

![The parts of the reference implementation: a React front end calls the Spring Boot service; the service owns the PostgreSQL schema and runs the triage agent, which can only record proposals a person decides; the migration tool loads the legacy schema into the same PostgreSQL schema and proves the load.](../../images/diagrams/b18-application-modernization/svg/ch08-reference-implementation.svg){#fig-ch08-reference-implementation fig-alt="Eight cards. On the left, a blue card for the React front end in the web folder (case list, triage, approve or reject) has an arrow labeled /api to a blue card for the Spring Boot REST service in the service folder (OpenAPI contract checked by a test; problem details for errors). The service has an arrow labeled triage to a violet card for the triage agent (identity, sponsor, tool allow-list; step limit, every call audited; writes only PENDING proposals). The agent has a green arrow labeled proposal to a green card, a person decides (only an approval changes a case), and a dashed arrow to a slate card, ModelClient (provider-neutral, stub by default). On the right, a slate card for the synthetic legacy DB2 or Oracle schema (H2 stand-in in tests) has an arrow to an amber card for the migration tool (transform, upsert, delta mode; row counts, checksum, aggregates), which has an arrow labeled load and prove to a blue card for PostgreSQL (schema owned by the service through Flyway, file V1 baseline). The service also has an arrow to PostgreSQL."}

## What is in it

| Part | Folder | What it shows | Chapter |
|---|---|---|---|
| REST service | `service/` | Spring Boot over PostgreSQL; the schema owned by the service through versioned Flyway migrations; an OpenAPI contract checked against the code by a test; errors as RFC 9457 problem details | [03](03-the-target-reference-architecture.md) |
| Front end | `web/` | React: a case list with a status filter, case detail, **Run triage**, and a panel of pending proposals with **Approve** and **Reject** | [03](03-the-target-reference-architecture.md) |
| Migration tool | `migration/` | A command-line tool that reads a legacy DB2 or Oracle schema over JDBC, transforms and loads it into PostgreSQL, supports a delta mode for coexistence, and validates the result three ways | [04](04-moving-the-data.md) |
| Agent | `service/.../ai/` | A provider-neutral model interface with a deterministic stub; an agent identity with a human sponsor and a tool allow-list; a step limit; an audit row for every tool call; a write path that only records proposals | [05](05-generative-and-agentic-ai.md) |
| Containers | `docker-compose.yml`, two `Dockerfile`s | PostgreSQL, the service and the front end as containers | [03](03-the-target-reference-architecture.md) |

The versions were current when it was built. Spring Boot is 4.1.2, the latest generally available release on Maven Central on October 28, 2026, when the 4.2 line was at its first release candidate.[^c08-boot] PostgreSQL is major version 18, the newest supported release, in its 18.6 minor release.[^c08-pg] React is 19.3.1, the version the npm registry marked latest.[^c08-react] Two choices differ from Chapter 03's target and should be read that way. The code is compiled for Java 21, not Java 25, only because the machine it was built on had a Java 21 development kit; it uses nothing Java 25 would reject. And the contract is written in OpenAPI 3.1, not 3.2, the version Chapter 03 recommends for new contracts; moving it is a header change and a test run.

## The service and its contract

The service is a plain Spring Boot application with five endpoints: list cases (optionally by status), get one case, run triage on a case, list proposals, and record a person's decision on a proposal. Its database schema is one Flyway migration, `V1__baseline.sql`, applied when the service starts. The service owns that schema; nothing else creates tables. That is Chapter 03's rule that each service owns its data, made concrete, and it pays off in the migration tool, whose tests apply the same file rather than a copy.

The contract comes first. `openapi.yaml` is written by hand and served by the service, and a test, `OpenApiContractTest`, reads it and compares its operations with the request mappings Spring actually registered, in both directions. An endpoint that exists in code but not in the contract fails the build, and so does a documented path nobody implemented. That is the cheapest form of the contract-first discipline [Chapter 07](07-who-governs-the-architecture.md) asks review gates to enforce: the contract can't drift from the code without a red build.

Errors follow RFC 9457, *Problem Details for HTTP APIs*, the IETF standard for machine-readable error bodies, which replaced RFC 7807 in July 2023.[^c08-rfc9457] A missing case returns a 404 with a problem body; a malformed case number returns a 400; deciding a proposal twice returns a 409.

## The migration tool and its three checks

The legacy side is a synthetic schema in DB2 style: an applicant table and a case master table with the habits real legacy schemas have. Text is in fixed-width `CHAR` columns padded with spaces. Status is a one-letter code. A closing date that hasn't happened is stored as `0001-01-01`, because the column was declared `NOT NULL` decades ago. Timestamps carry no time zone. The same tables are given in Oracle syntax for comparison, and the seed data includes the cases that break careless migrations: padded text, the sentinel date, names with non-ASCII letters, and amounts at the edges of the column's precision.

The tool reads the source over JDBC, so the same code runs against DB2 or Oracle once their drivers are on the class path. It applies a short list of documented transforms: trailing padding removed, status codes mapped to words, the sentinel date turned into a null, and timestamps read in a stated source time zone. Any value it can't map, such as an unknown status code or an amount that would need rounding, stops the run rather than being guessed at. It loads parents before children in one transaction, with upserts in batches, so a re-run is safe. A `--since` option loads only the rows changed since the last run's watermark, which is the coexistence pattern Chapter 04 describes for the period when both systems are live. The README states the two things a delta can't see in this schema: applicant changes, because that table has no change timestamp, and deletes, which need change data capture.

After every load it validates both whole tables, not just the rows it loaded, and writes a JSON report that holds keys, counts and digests, never row contents, so it can go straight into the change record.

| Check | How | Catches | Doesn't catch |
|---|---|---|---|
| Row count | Rows on each side | Rows dropped or duplicated | Wrong values in rows that arrived |
| Checksum | Each row rendered to one canonical string; rows sorted by key; SHA-256 over all of them; the source rendered after the transform, the target as stored | Any changed, truncated or missing field, with the keys that differ | A wrong transform rule, because both sides share it |
| Aggregates | Count and sum of amounts per status, computed in SQL by each database on its own | Totals that disagree, computed without the tool's transform | Text damage: a truncated name passes, which is why the checksum exists |

The table's last column is the point. Each check has a blind spot, and the three are chosen so that each covers another's. The checksum is strong but shares the transform with the thing it checks; the aggregate check is weaker but independent. Chapter 04 makes the same argument for a real migration: validation that reuses the migration's own logic can only prove the migration did what it was told.

The tests prove the checks work by breaking things. After a clean load, one test changes a single amount in the target, and both the checksum and the aggregate check fail; another deletes a row, and all three fail; a third truncates one name, and only the checksum fails. Each time, the report names the table, the check and the key.

## The agent and its guardrails

The agent triages a case: it reads the case and the applicant's other cases, and proposes flagging the case for review if it has been open for more than a year or looks like a duplicate. It follows Chapter 05's pattern exactly: the model decides what to ask for, and code the agency controls decides what runs.

- **One provider-neutral interface.** The agent depends only on `ModelClient`, a single method that takes the instruction, the conversation so far and the tools on offer, and returns either a final answer or one tool call. The default implementation is a deterministic, rule-based stub that needs no API key and no network, so every test is repeatable. The README describes how an adapter for a real provider implements the same interface; none is included.
- **An identity with an owner.** The agent's id and its human sponsor are configuration, and the service won't start without both. Every proposal and every audit row carries the agent id. This is the record [Book 17, Chapter 05](../b17-ai-identity/05-owners-sponsors-and-lifecycle.md) asks every AI identity to have.
- **A tool allow-list.** The model is offered only the tools on the agent's list. A call to any other tool, including a real tool left off the list, is refused and written to the audit table.
- **Untrusted output.** Every argument is validated before it reaches a query: the case number's format, the action's name, the rationale's length, no unexpected arguments, and proposals only for the case being triaged.
- **A hard step limit.** The loop stops after a configured number of steps, five by default, and records that it did.
- **No write power.** The agent's only write is a row in a proposals table with status PENDING. Nothing the agent can call changes a case. A person approves or rejects each proposal through the decision endpoint, and that is the only code path that applies one. A decision recorded in the agent's own name is refused.

Two test modes make the stub misbehave on purpose, one asking for a tool it was never offered and one that never stops, so that the guardrails are tested against the failures they exist for, not only against a well-behaved model.

## Running it

The tests need only Java 21 and Node.js 24. The Maven Wrapper downloads Maven, and the service and migration tests download real PostgreSQL binaries from Maven Central through Zonky's embedded PostgreSQL library and start them in the test process, so no database server or Docker is needed.[^c08-zonky]

```sh
# from examples/app-modernization
./mvnw verify            # Windows: mvnw.cmd verify
cd web && npm ci && npm test && npm run build
```

The README covers running the service against a local PostgreSQL, the migration tool's options and exit codes, the validation report's format, and the containers.

## What was verified, and what wasn't

| Claim | Status on October 28, 2026 |
|---|---|
| The service works against real PostgreSQL | Verified: 25 service tests pass against PostgreSQL 18.6, with the Flyway migration applied, and one test asserts the engine and version |
| The contract matches the code | Verified by the contract test, in both directions |
| The migration tool's transforms and checks work | Verified: 12 migration tests pass, loading into real PostgreSQL with the service's own schema |
| The migration works against real DB2 or Oracle | **Not verified.** The tests use the H2 database's DB2 and Oracle compatibility modes as a stand-in. H2 isn't either engine: fixed-width text comparison, date types and driver behavior differ, and one difference has already shown up. Run the tool against a copy of the real source before relying on it |
| The agent's guardrails hold | Verified against the stub and scripted misbehaving replies; **not** run against a real model |
| The front end works | 6 component tests pass with the network calls mocked; no end-to-end browser test |
| The containers start | **Not verified.** Docker wasn't available where the example was built; the compose file was checked only as YAML |

A production version would add what the example leaves out on purpose: authentication through the agency's identity provider, with the decider taken from the signed-in user rather than the request; a workload identity for the agent ([Book 17, Chapter 06](../b17-ai-identity/06-credentials-and-least-privilege.md)); secrets from a vault; and the pipeline evidence [Chapter 06](06-compliance-by-design.md) and [Chapter 07](07-who-governs-the-architecture.md) describe, such as a software bill of materials and signed builds.

[Chapter 09](09-togaf-and-zachman.md) places these artifacts, and the rest of the book, in TOGAF's phases and Zachman's cells.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 07 — Who Governs the Architecture](07-who-governs-the-architecture.md) · [Book index](index.md) · [Next: Chapter 09 — Mapping the Work to TOGAF and Zachman →](09-togaf-and-zachman.md)
:::

[^c08-boot]: Maven Central, `org.springframework.boot:spring-boot` metadata, versions through 4.1.2 and 4.2.0-RC1, last updated October 22, 2026, <https://repo1.maven.org/maven2/org/springframework/boot/spring-boot/maven-metadata.xml> (accessed Oct 28, 2026).
[^c08-pg]: PostgreSQL Global Development Group, "Versioning Policy," supported versions table (18.6 current minor of version 18), <https://www.postgresql.org/support/versioning/> (accessed Oct 28, 2026).
[^c08-react]: npm registry, `react` package, `latest` dist-tag 19.3.1, <https://registry.npmjs.org/react/latest> (accessed Oct 28, 2026).
[^c08-rfc9457]: M. Nottingham, E. Wilde and S. Dalal, RFC 9457, *Problem Details for HTTP APIs*, July 2023 (obsoletes RFC 7807), <https://www.rfc-editor.org/rfc/rfc9457.html> (accessed Oct 28, 2026).
[^c08-zonky]: Zonky, `io.zonky.test:embedded-postgres` 2.2.2 on Maven Central, <https://repo1.maven.org/maven2/io/zonky/test/embedded-postgres/maven-metadata.xml>, and project README, <https://github.com/zonkyio/embedded-postgres> (both accessed Oct 28, 2026).
