# Verification — Chapter 01, The Contract and the Schema the Service Owns

New material, written November 24, 2026. Code: `examples/app-modernization` as on main at 57843f00, plus this change's additions (`LabRecordsTest`, the PowerShell lab helpers). Facts carried from Book 18 keep that page's access date and say so; facts read for this chapter say "read November 24, 2026".

Lab 1 was run with `python scripts/kit_captures.py am` on Windows 11, PowerShell 7.6, Java 21.0.10 (Microsoft Build of OpenJDK) and Node.js 24.14.1, on November 24, 2026; the captured output is in `data/kit-captures/am/`. Lab 2 has not been run.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | RFC 9457 replaces RFC 7807; the problem details fields | Start with; Verified facts | carried (Book 18, Chapter 08) | `am01-rfc9457` |
| 2 | Spring Boot 4.1.2; PostgreSQL 18.6 | Start with; Verified facts | carried (Book 18, Chapter 08) | `am01-boot`, `am01-pg` |
| 3 | Zonky embedded PostgreSQL | Gap table | carried (Book 18, Chapter 08) | `am01-zonky` |
| 4 | The contract test compares both ways; the handler's mappings; one schema folder | Gap table; The code | read in the kit's source and tests | kit |
| 5 | A status the contract doesn't list is a 400 from Spring's own handler | Lab 1 step 4 | verified by running the lab: title "Bad Request" | `data/kit-captures/am/01-4.txt` |
| 6 | 28 service tests pass | Verified facts | verified: `mvnw verify` and Lab 1 | kit |
| 7 | Lab 2: jar name, `/actuator/health`, `/openapi.yaml`, demo data with three open cases | Lab 2 | read in `service/pom.xml`, `application.yml`, `V100__sample_data.sql`; not run | kit |

## Federal requirements and evidence

Controls and KSIs are only the kit's `config/requirements.json`, step `CONTRACT`. Every control-to-KSI pair there is one another kit in the repository already uses (provider notices, Azure security, the drift pipeline, Non-Person Identity Chapter 11): no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
