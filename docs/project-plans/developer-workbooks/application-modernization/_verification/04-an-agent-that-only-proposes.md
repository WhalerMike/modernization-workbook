# Verification — Chapter 04, An Agent That Only Proposes

New material, written November 24, 2026. Code: `examples/app-modernization` as on main at 57843f00, plus this change's additions (`LabRecordsTest`). Facts carried from Book 18 keep that page's access date and say so; facts read for this chapter say "read November 24, 2026".

Lab 1 was run with `python scripts/kit_captures.py am` on Windows 11, PowerShell 7.6, Java 21.0.10 (Microsoft Build of OpenJDK) and Node.js 24.14.1, on November 24, 2026; the captured output is in `data/kit-captures/am/`. Lab 2 has not been run.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | OWASP LLM06: require approval for high-impact actions | Start with; Verified facts | carried (Book 18, Chapter 05) | `am04-owasp` |
| 2 | M-25-21 human oversight and fail-safe for high-impact AI | Start with; Verified facts | carried (Book 18, Chapter 05) | `am04-m2521` |
| 3 | The guards and their tests | Gap table; The code | read in `CaseTriageAgent.java`, `ProposalService.java` and the tests | kit |
| 4 | The proposal, the audit, the refusals and the misbehaviors | Lab 1 steps 3 to 6 | verified by running the lab | `data/kit-captures/am/04-*.txt` |
| 5 | Lab 2: the API calls | Lab 2 | from the contract and the controllers; not run | kit |

## Federal requirements and evidence

Controls and KSIs are only the kit's `config/requirements.json`, step `AGENT`. Every control-to-KSI pair there is one another kit in the repository already uses (provider notices, Azure security, the drift pipeline, Non-Person Identity Chapter 11): no new pair. Claim language: "supports", never "satisfies"; KSIs framed as FedRAMP 20x indicators for cloud service providers.

## Review gate

`review-status: pending`. Not approved here.
