---
title: "Appendix A — Requirements Mapping"
description: "A compliance-enabling crosswalk, not a compliance claim: for each part of the book, the control it puts in place and the evidence it produces, mapped to OMB M-22-09, the CISA Zero Trust Maturity Model v2.0 identity pillar, NIST SP 800-207 and NIST SP 800-53 Rev. 5. Control selection, implementation statements and assessment remain the agency's."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b06-data-platform
book: B06
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Requirements Mapping

*A crosswalk tells an agency where the book's evidence can be reused; it never tells the agency that a control is met.*

::: {.callout-note}
## In this appendix
The four federal frameworks the mapping uses, a table that maps each part of the book to the control it puts in place, the evidence it produces and the requirement that evidence helps an agency show, which mapped controls sit outside the SP 800-53B Moderate baseline, and notes on reading the mapping.
:::

::: {.callout-important}
## Compliance-enabling, not a compliance claim
This appendix maps the book's controls and evidence to federal requirements so an agency can reuse them in its own system security plan. It does not claim that following the book satisfies any requirement, control or maturity stage. The agency's SQL Server estate is part of the agency's own system, authorized by the agency's authorizing official under the Risk Management Framework,[^aA-rmf] not by FedRAMP; FedRAMP covers the cloud services the design leverages ([Appendix B](appendix-b-ato-kit.md)). Control selection, tailoring, implementation statements and assessment belong to the agency and its assessors. Identifiers are from the sources' current editions, checked October 20, 2026.
:::

## The four frameworks

- **OMB M-22-09** sets the federal zero trust strategy's identity actions: agencies must employ centralized identity management systems for agency users that can be integrated into applications and common platforms; must use strong MFA throughout the enterprise, enforced at the application layer and phishing-resistant for agency staff, contractors and partners; and must consider at least one device-level signal alongside identity information when authorizing users. Its goals were due by the end of fiscal year 2024.[^aA-m2209][^aA-ms-m2209]
- **CISA Zero Trust Maturity Model v2.0** describes the identity pillar through four functions (Authentication, Identity Stores, Risk Assessments and Access Management) plus the cross-cutting Visibility and Analytics, Automation and Orchestration, and Governance capabilities, each at Traditional, Initial, Advanced and Optimal stages.[^aA-ztmm][^aA-ms-ztmm]
- **NIST SP 800-207** states seven zero trust tenets, cited below by number: (1) all data sources and computing services are resources; (2) all communication is secured regardless of network location; (3) access is granted per session; (4) access is determined by dynamic policy; (5) the enterprise monitors the integrity and security posture of all assets; (6) authentication and authorization are dynamic and strictly enforced before access; (7) the enterprise collects information on the current state of assets, infrastructure and communications.[^aA-207]
- **NIST SP 800-53 Rev. 5** supplies the control identifiers (current release 5.2.0, August 27, 2025), and SP 800-53B supplies the baselines.[^aA-53][^aA-53b]

## Mapping by part

| Chapters | Control the chapters put in place | Evidence they produce | M-22-09 | CISA ZTMM v2 identity | SP 800-207 tenet | SP 800-53 Rev. 5 |
|---|---|---|---|---|---|---|
| [03–06](03-the-shape-of-twenty-years.md) The Estate | Inventory every instance; retire, consolidate or retain each | Instance inventory with a disposition per instance | Enterprise identity applied to every system in scope | Identity Stores (know and reduce the stores); Governance | 1 | CM-8, PM-5 |
| [07–08](07-the-authentication-audit.md) The Audit | Classify every login and measure NTLM fallback | Per-instance login census by `sys.server_principals` type; `auth_scheme` counts | Inventory of legacy authentication to retire | Authentication (Traditional baseline); Visibility and Analytics | 5, 7 | AC-2, AU-2, AU-12, CM-8 |
| [09–10](09-what-arc-provides-to-sql-server.md) The Identity Bridge | A cloud identity for the engine: Arc managed identity (2025) or app registration and certificate (2022) | Arc and extension health; Graph permission grants per machine identity; local token test | Centrally managed identity integrated with the application | Identity Stores; Authentication (non-person entities) | 6 | IA-9, IA-5, AC-6 |
| [11–12](11-three-principal-types.md) Login Migration | Entra logins replace Windows and SQL logins through create → validate → disable → observe → drop | Parallel-run record; disabled-then-dropped legacy logins; `sa` disabled and renamed; SQL authentication refused | Enterprise identity at the application; MFA at the application layer through Conditional Access | Authentication (Advanced with phishing-resistant MFA); Access Management | 3, 6 | AC-2, AC-2(3), IA-2, IA-2(1), IA-2(2), IA-5, CM-3 |
| [14–15](14-ntlm-and-the-patterns-that-generate-it.md) NTLM Elimination | SPN repair so connections negotiate Kerberos; restrict, then block, NTLM | `auth_scheme` trend to zero NTLM; NTLM audit events | Removes a legacy, replayable method on the way to phishing-resistant authentication | Authentication | 2, 6 | IA-2(8), CM-7, SC-23 |
| [16–17](16-groups-roles-and-membership.md) Access Control | One Entra group, one role, one database, one environment; dynamic membership from HR attributes; write control on the attributes; PIM for Groups; access reviews | Group-to-role map; attribute write-permission evidence; review completions; PIM activation logs | Attribute- and role-based authorization | Access Management (Initial → Advanced → Optimal just-in-time); Automation and Orchestration; Governance | 4 | AC-2(1), AC-3, AC-3(13), AC-6, AC-6(7), AC-2(7), AC-16 |
| [18–19](18-the-four-class-pattern-for-applications.md) The Application Chain | Each application authenticates users and connects to the database with Entra tokens, or carries a dated exception | Per-application class, owner and exception register | Enterprise identity integrated into applications | Authentication; Access Management | 3, 6 | IA-2, IA-9, AC-3, CA-3 |
| [20–21](20-the-closure-condition.md) Steady State | Entra-exclusive operational posture, re-evidenced on every audit run; drift alerts | Per-instance compliance record; drift events; sign-in logs; host NTLM telemetry | Continuous verification of the identity outcomes | Visibility and Analytics; Governance (Optimal) | 5, 7 | CA-7, AU-6, AU-12, AC-2(4), AC-6(9) |
| [22](22-where-sql-server-touches-adcs.md) Certificate Authority | A replacement CA issuing before AD CS is retired; certificate inventory | Certificate inventory (subject, issuer, expiry) per instance | — | Identity (cross-cutting governance of credentials) | 2 | SC-17, SC-12, IA-5(2), SC-8, SC-8(1) |
| [23](23-epilogue-the-platform-question.md) Epilogue | Per-data-domain platform decision | Decision record per data domain | — | Governance | 1 | PM-5, SA-9 |

Chapters 01–02 state the case and produce no control evidence of their own. [Appendix C — Applicability](appendix-c-applicability.md) decides which rows apply to an environment.

## Controls outside the Moderate baseline

Five identifiers in the table are in neither the SP 800-53B Moderate nor the High baseline. An agency that wants to claim them selects them during tailoring; an agency that doesn't can still use the evidence under the baseline controls in the same row.[^aA-53b]

| Control | Title | In the Moderate baseline | In the High baseline |
|---|---|---|---|
| PM-5 | System Inventory | No (program management control) | No |
| IA-9 | Service Identification and Authentication | No | No |
| AC-2(7) | Privileged User Accounts | No | No |
| AC-3(13) | Attribute-based Access Control | No | No |
| AC-16 | Security and Privacy Attributes | No | No |

Every other control in the table is in the Moderate baseline.[^aA-53b]

## Notes on the mapping

- **Mixed results are normal.** An instance can meet one row and miss another; the per-instance compliance record of [Chapter 20](20-the-closure-condition.md) is what shows which.
- **MFA is a Conditional Access outcome, not an engine setting.** SQL Server accepts the Entra token; whether the human behind it used phishing-resistant MFA is decided by Conditional Access policy and evidenced in Entra sign-in logs.[^aA-ca] Conditional Access applies to users, not to service principals or managed identities,[^aA-ca-sql] and Microsoft states that FIDO2 isn't currently supported for Entra authentication to SQL Server on Arc machines,[^aA-mi] so plan the phishing-resistant method (for example, certificate-based authentication with PIV) accordingly.
- **IA-9 applies to the engine's own identity.** The Arc managed identity or app registration authenticates SQL Server to Microsoft Entra ID and Microsoft Graph; [Appendix B — Security-Approval (ATO) Kit](appendix-b-ato-kit.md) gives the permission justification.
- **IA-2(8) and SC-23 carry the NTLM row.** NTLM elimination removes a relayable, replayable method (IA-2(8), replay-resistant authentication) and moves sessions to mutually authenticated Kerberos or Entra tokens (SC-23, session authenticity); CM-7 covers prohibiting the protocol itself. SC-8 belongs to the certificate row, where the TLS server certificate protects data in transit.
- **The 800-207 mapping is architectural.** SQL Server acts as the enforcement point that accepts only tokens Entra ID issued under policy; the book doesn't implement a full policy engine.

::: {.callout-tip}
## Continue the book
[← Previous: Runbook R10 — Certificate Discovery for SQL Server's AD CS Dependencies](r10-certificate-discovery-for-adcs.md) · [Book index](index.md) · [Next: Appendix B — Security-Approval (ATO) Kit →](appendix-b-ato-kit.md)
:::

[^aA-rmf]: NIST, SP 800-37 Rev. 2, *Risk Management Framework for Information Systems and Organizations: A System Life Cycle Approach for Security and Privacy*, December 2018, <https://csrc.nist.gov/pubs/sp/800/37/r2/final> (accessed Oct 20, 2026); SP 800-53 Rev. 5, CA-6, Authorization (assign a senior official as the authorizing official for the system), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (accessed Oct 20, 2026).
[^aA-m2209]: Office of Management and Budget, M-22-09, *Moving the U.S. Government Toward Zero Trust Cybersecurity Principles*, January 26, 2022 (§III.A, Identity, actions 1–3; goals due by the end of FY 2024), <https://bidenwhitehouse.archives.gov/wp-content/uploads/2022/01/M-22-09.pdf> (accessed Oct 20, 2026).
[^aA-ms-m2209]: Microsoft Learn, "Memo 22-09 identity requirements overview," <https://learn.microsoft.com/en-us/entra/standards/memo-22-09-meet-identity-requirements>, and "Meet authorization requirements of memorandum 22-09," <https://learn.microsoft.com/en-us/entra/standards/memo-22-09-authorization> (both accessed Oct 20, 2026).
[^aA-ztmm]: Cybersecurity and Infrastructure Security Agency, *Zero Trust Maturity Model*, Version 2.0, April 2023 (Table 2, Identity Pillar), <https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf> (accessed Oct 20, 2026).
[^aA-ms-ztmm]: Microsoft Learn, "CISA Zero Trust Maturity Model for the identity pillar," <https://learn.microsoft.com/en-us/security/zero-trust/cisa-zero-trust-maturity-model-identity> (accessed Oct 20, 2026).
[^aA-207]: NIST, SP 800-207, *Zero Trust Architecture*, August 2020, §2.1, Tenets of Zero Trust, <https://csrc.nist.gov/pubs/sp/800/207/final> (accessed Oct 20, 2026).
[^aA-53]: NIST, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations* (Release 5.2.0, August 27, 2025), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final> (accessed Oct 20, 2026).
[^aA-53b]: NIST, SP 800-53B, *Control Baselines for Information Systems and Organizations*, <https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final>; baseline membership checked against NIST's OSCAL Rev. 5 Moderate and High baseline profiles, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (both accessed Oct 20, 2026).
[^aA-ca]: Microsoft Learn, "What is Conditional Access?," <https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview> (accessed Oct 20, 2026).
[^aA-ca-sql]: Microsoft Learn, "Conditional access" for Azure SQL Database and Azure SQL Managed Instance (policies apply only to users, not to service principals and managed identities), <https://learn.microsoft.com/en-us/azure/azure-sql/database/conditional-access-configure?view=azuresql> (accessed Oct 20, 2026).
[^aA-mi]: Microsoft Learn, "Managed identity for SQL Server enabled by Azure Arc," Limitations, <https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/managed-identity?view=sql-server-ver17> (accessed Oct 20, 2026).
