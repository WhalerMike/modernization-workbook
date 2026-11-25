# Verification — Chapter 02, Moving the Data: the Transform and the Load

New material, written November 24, 2026. Code: `examples/app-modernization` as on main at 57843f00, plus this change's additions (`LabReportsTest`). Facts carried from Book 18 keep that page's access date and say so; facts read for this chapter say "read November 24, 2026".

Lab 1 was run with `python scripts/kit_captures.py am` on Windows 11, PowerShell 7.6, Java 21.0.10 (Microsoft Build of OpenJDK) and Node.js 24.14.1, on November 24, 2026; the captured output is in `data/kit-captures/am/`. Lab 2 has not been run.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | PostgreSQL `INSERT ... ON CONFLICT ... DO UPDATE` | Start with; Verified facts | verified November 24 on the PostgreSQL 18 documentation | `am02-upsert` |
| 2 | Every transform rule and its test | Gap table | read in `Transform.java` and `MigrationTest` | kit |
| 3 | An unknown status code stops the run, but the fixture's CHECK constraint prevents one | Illustrative code | read in `Transform.java` line 38 and `db2-schema.sql` | kit |
| 4 | Edge cases side by side; 20 applicants and 50 cases | Lab 1 steps 3 and 4 | verified by running the lab | `data/kit-captures/am/02-*.txt` |
| 5 | `dependency:copy` fetches the PostgreSQL driver; class path separator | Lab 2 step 2 and 3 | standard Maven Dependency Plugin goal; not run | — |
| 6 | Real Db2 or Oracle not verified | Illustrative code; Verified facts | carried (Book 18, Chapter 08) | Book 18 |

## Federal requirements and evidence

Controls and KSIs are only the kit's `config/requirements.json`, step `LOAD`. Every control-to-KSI pair there is one another kit in the repository already uses (provider notices, Azure security, the drift pipeline, Non-Person Identity Chapter 11): no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
