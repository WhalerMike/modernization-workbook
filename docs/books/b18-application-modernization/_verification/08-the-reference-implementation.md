# Verification — Chapter 08, The Reference Implementation

Editor. Sources opened October 28, 2026: Maven Central metadata for `org.springframework.boot:spring-boot` (versions to 4.1.2 and 4.2.0-RC1, last updated 2026-10-22) and `io.zonky.test:embedded-postgres` (2.2.2); the spring.io Spring Boot project page (4.1.2 listed); PostgreSQL "Versioning Policy" (18.6 current minor of 18); npm registry `react` latest (19.3.1); RFC 9457 HTML and text (Nottingham, Wilde, Dalal; July 2023; obsoletes 7807); Zonky embedded-postgres README on GitHub. Claims about the example itself were checked against its source in `examples/app-modernization/` and by running its tests: `mvnw -B clean verify` (25 service and 12 migration tests, BUILD SUCCESS) and `npm ci && npm test && npm run build` in `web/` (6 tests passed; build succeeded), on Windows 11 with Microsoft OpenJDK 21.0.10 and Node.js 24.14.1.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Spring Boot 4.1.2 is the latest GA on Maven Central; 4.2 at RC1 | What is in it | verified | Maven Central metadata; spring.io |
| 2 | PostgreSQL 18 is the newest supported major; 18.6 its current minor | What is in it | verified | postgresql.org versioning page |
| 3 | React 19.3.1 is the npm `latest` | What is in it | verified | npm registry |
| 4 | Example compiled for Java 21, not Java 25; OpenAPI 3.1 not 3.2 | What is in it | verified against `pom.xml` and `openapi.yaml`; the reason (JDK available on the build machine) restated as fact about the build | Example source |
| 5 | RFC 9457, Problem Details for HTTP APIs, July 2023, obsoletes RFC 7807 | The service | verified | RFC 9457 |
| 6 | The contract test compares the OpenAPI operations with the registered request mappings in both directions | The service | verified | `OpenApiContractTest.java`; test passes |
| 7 | Migration tests apply the service's own `V1__baseline.sql` | The service; verified table | verified | `migration/.../Fixtures.java`; README |
| 8 | Transforms: padding, status codes, sentinel date, stated time zone; unmappable values stop the run | Migration | verified | `Transform.java`; tests |
| 9 | Delta mode cannot see applicant-only changes or deletes | Migration | verified | README; schema has no applicant timestamp |
| 10 | Tampering tests: amount → checksum and aggregate fail; delete → all three; truncated name → checksum only | Migration | verified | `MigrationTest.java`; tests pass |
| 11 | Agent guardrails (identity and sponsor required at startup, allow-list, argument validation, step limit default 5, only PENDING proposals, self-approval refused) | The agent | verified | `CaseTriageAgent.java`, `AgentIdentity.java`, `ProposalService.java`; `AgentGuardrailTest`, `TriageAndApprovalTest` pass |
| 12 | Zonky downloads real PostgreSQL binaries from Maven Central and runs them in-process | Running it | verified | Zonky README; test log shows PostgreSQL 18.6 started |
| 13 | Test counts 25 / 12 / 6 | Verified table | verified | Local runs, October 28, 2026 |
| 14 | H2 differs from DB2/Oracle in CHAR comparison; one difference already found (a test uses RTRIM) | Verified table | verified | `MigrationTest.java`; example README |
| 15 | Docker compose not run | Verified table | verified (Docker not installed on the build machine) | — |
