# Verification — Appendix C, Security Assessment Plan Template

New appendix (not a rewrite of a source volume). Written November 6, 2026. All sources opened November 6, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Task A-2 statement, expected output, primary responsibility | What NIST asks | verified (quoted) | SP 800-37 Rev. 2 §3.5, Task A-2 (PDF read) |
| 2 | Plan content: from security/privacy/common-control documentation; may be integrated; roles; objectives and procedures per control; types of assessment; AO review criteria; request provider plans | What NIST asks; section 1 | verified | SP 800-37 Rev. 2, Task A-2 discussion |
| 3 | CA-2 plan content (controls, procedures, environment, team, roles); AO approval before assessment | What NIST asks | verified | Release 5.2.0 OSCAL catalog, ca-2 |
| 4 | CA-2(1) in Moderate and High, not Low; CA-2 in all three | What NIST asks | verified (profiles read) | Release 5.2.0 OSCAL profiles |
| 5 | SP 800-53A §3.2 steps; methods examine, interview, test; depth and coverage basic/focused/comprehensive; partial assessment after change | What NIST asks; section 2, 5 | verified | SP 800-53A Rev. 5 §2.4, §3.2 (PDF read) |
| 6 | Default depth and coverage by impact | Section 5 | design, labelled; not NIST | — |
| 7 | OSCAL Assessment Plan imports the SSP (required) | Connection table | verified earlier | Chapter 11 note on OSCAL 1.2.3 (not re-opened) |
| 8 | Kits: validation-kit result carries queries, times, permissions; drift pipeline dispositions; no kit generates an OSCAL Assessment Plan | Kits table | verified against `examples/validation-kit/README.md`; the absence is by search of `examples/` | repo |

## Carry-forward ledger

Nothing carried from a source volume. The test-plan catalog rules and independence text are linked to Chapter 11, not restated.

## Not verified

- Copilot prompt behavior was not run against a Copilot service; it is a template.
- NIST publishes no SAP template; the section layout is the program's, built from A-2, CA-2 and SP 800-53A §3.2.
