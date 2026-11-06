# Verification — Appendix E, Security Impact Analysis Template

New appendix. Written November 6, 2026. All sources opened November 6, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CM-4 statement and guidance (skills, plan review, design review, supply chain, privacy, risk assessments) | What NIST asks | verified (quoted) | Release 5.2.0 OSCAL catalog, cm-4 |
| 2 | CM-4(1) separate test environment; CM-4(2) verification of controls | What NIST asks | verified | catalog, cm-4.1 and cm-4.2 |
| 3 | Baselines: CM-4 in Low, Moderate, High; CM-4(1) High only; CM-4(2) Moderate and High | What NIST asks | verified (profiles read) | Release 5.2.0 OSCAL profiles |
| 4 | CM-3 approves changes "with explicit consideration for security and privacy impact analyses" | What NIST asks | verified | catalog, cm-3 |
| 5 | Task M-1 statement, outputs, responsibility, provider changes hard to detect, unauthorized change root cause, privacy posture | What NIST asks | verified (quoted) | SP 800-37 Rev. 2 §3.7, Task M-1 (PDF read) |
| 6 | Significant change definition, trigger list, examples, "only significant when", impact analysis may be used, target specific controls, most changes handled by monitoring | What NIST asks | verified (quoted) | SP 800-37 Rev. 2, Appendix F |
| 7 | Decision path, criteria table, two-business-day emergency window, residual impact scale | Decision path; sections 3, 5 | design, labelled; not NIST | — |
| 8 | Chapter 11 has no significant-change decision path | Decision path | verified by search of Chapter 11 on Nov 6, 2026 (it covers event-driven authorization in one sentence) | repo |
| 9 | Kits: validation-kit checks; drift-pipeline findings; no kit analyzes change impact or detects provider changes | Kits table | verified against repo | repo |

## Carry-forward ledger

Nothing carried from a source volume.

## Not verified

- Copilot prompt behavior not run.
- The criteria are not a NIST list; NIST says each organization sets its own.
