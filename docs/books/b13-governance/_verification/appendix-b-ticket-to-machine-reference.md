# Verification — Appendix B, Ticket-to-Machine Reference

Writer W7. Sources: `docs/whitepapers/ticket-to-machine-appendices.md` (Appendices A–E and References), with the tempo tables of `docs/executive-governance/ch07-operational-tempo/index.md` and the core paper `docs/whitepapers/ticket-to-machine-not-ticket-to-human.md` where Appendix B needed them. Aligned on October 21, 2026 with Chapter 10 as written (L4 approval attaches to the class, accepted in advance by the authorizing official; escalation paths; window terminology) and with the five clauses of Book 00, Chapter 04, principle 2. All URLs opened October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | OMB asked FedRAMP to oversee the provider's change process rather than individual changes | Coordination loop | verified | M-24-15 §VI |
| 2 | Routine recurring changes exempt from SCN notification; auditable evaluation records; emergency changes with retroactive materials | Coordination loop, lanes | verified | FedRAMP SCN page (SCN-CSO-EVA, -MAR, -EMG, SCN-RTR-NNR) |
| 3 | KSI-CMT-RMV "wherever reasonable" | Coordination loop | verified | FedRAMP KSI page |
| 4 | Five clauses | Request chain | restated-as-design; aligned to Book 00 Ch04 principle 2 (source's reference-implementation clause names Origin/Authorize/Elevate/Actuate/Evidence remapped) | Book 00 Ch04 |
| 5 | Lanes, class assignments, ceilings | Lanes tables | restated-as-design; aligned to Chapter 10 (source said P3/P4 auto-remediate; now only L4 classes) | Chapter 10; Book 01 Ch11 |
| 6 | Permanent-L3 list | Lanes table | verified against Book 01 Ch11 | Book 01 Ch11 |
| 7 | Drift classes and default lanes | Drift table | restated-as-design | Book 02 Ch11 names |
| 8 | P1–P4 windows | Tempo | restated-as-design | ch07 source; Chapter 10 |
| 9 | BOD 26-04 timelines by exposure, KEV status, automatability, technical impact | Tempo | verified | BOD 26-04 Background, Table 1 |
| 10 | Leadership measures | Tempo | restated-as-design; aligned to Chapter 10 | Chapter 10 |
| 11 | SP 800-137 quote, manual processes repeatable and verifiable | Evidence record | verified | SP 800-137 Executive Summary |
| 12 | TLS max validity 398 to 47 days, March 2026 to March 2029 | Certificate exception | verified | CA/B Forum ballot SC-081v3 page |
| 13 | ACME automates issuance after proof of control | Certificate exception | verified | RFC 8555 |
| 14 | CAA lets a domain holder name authorized CAs | Certificate exception | verified | RFC 8659 abstract |
| 15 | Worked examples | Examples | restated-as-design; labeled illustrative, identifiers invented | — |
| 16 | Reference implementation review findings | Failure modes | restated-as-design (program's own review, generalized; no code, commits or file names) | source App A |
| 17 | SailPoint ISC/CIEM coverage, SAM = IdentityIQ, CyberArk/Keyfactor, Wiz, Vanta, C1Secure, VMware/ServiceNow connectors | — | removed (agency-specific or dated vendor claims not re-verified; generalized to the one-front-door rule and a coverage caution) | — |
| 18 | Coverage of on-premises virtualization platforms as the recurring gap | One front door | restated-as-design (program's own research; flagged open until vendor docs show otherwise) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Intro (companion to core paper) | Not carried | Describes the source's own structure |
| App A, MACD-R clause table | Request chain table (aligned to Book 00 clauses) | Script-include names and commit hash dropped |
| App A, code-level discipline, negative tests, build-time gates | Failure modes section | File names dropped |
| App A, honest scope note | Failure modes closing sentence | — |
| App A, disclosed security findings | Failure modes table | Generalized; no code or dates |
| App B, access governance domain extension | Lanes table (access request, over-privilege rows); worked example 2; one front door | Vendor product named only generically |
| App B, "Closed 2026-07-28" callout | Not carried | Internal decision records and slot names |
| App B, SAM vs ISC callout | Not carried | Agency-specific product deployment |
| App B, VMware/vCenter honest limit | One front door, first caution | Generalized |
| App C, certificates exception and reasoning | Certificate exception section | Internal quote dropped |
| App C, what still needs the front door | Lanes table (certificate anomaly); worked example 3 | — |
| App C, recommended tool CyberArk vs Keyfactor | Not carried | Agency-specific vendor recommendation; Book 07 Ch08 covers tooling |
| App D, market validation bullets | One front door (structural point only) | Dated vendor and analyst claims, not re-verified |
| App D, alternative architectures | One front door, second caution | Vendor names dropped |
| App D, consistency implication | One front door | — |
| App D, vendor currency caveat | Opening callout | — |
| App E (authority mapping) | Appendix A | See Appendix A ledger |
| References table | Not carried | Internal repository paths; external URLs not needed once vendor claims were removed |
| ch07 tempo: SLA table, commitments, auto vs escalation, ops and leadership views, does-not-require, honest limits | Tempo section and lanes table (shared with Chapter 10) | Internal CLI and role names translated |
| Core paper: three questions, coordination pattern, ticket-to-machine, declared exception | Coordination loop; lanes; worked example 4 | — |

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
| 2 | CyberArk mechanism (acme) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-acme |
| 3 | CyberArk mechanism (disc) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-disc |
| 4 | Routine issuance 'protocol-enforced' via ACME | The certificate exception | clarified: engine-driven (Intune, autoenrollment, CLM drivers); ACME where supported | Book 07 Ch08 |
