---
title: "Appendix A — Requirements Mapping"
subtitle: "Each book's controls and closure evidence, mapped to OMB M-22-09, the CISA Zero Trust Maturity Model v2 identity pillar, NIST SP 800-207 and NIST SP 800-53 Rev. 5"
description: "A compliance-enabling crosswalk, not a compliance claim. For each book it names the control the book puts in place and the evidence the book produces, and points to the federal requirement that evidence helps an agency show. Control selection, implementation statements and assessment remain the agency's."
doc-type: sql-server-narrative-book
audience: [Executive, Technical, Customer]
family: sql-server-narrative
series-order: 12
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

::: {.content-visible when-format="docx"}
# Appendix A — Requirements Mapping
:::

::: {.callout-important}
## Compliance-enabling, not a compliance claim
This appendix maps the series' controls and evidence to federal requirements so an agency can reuse them in its own system security plan. It does not claim that following the series satisfies any requirement, control or maturity stage. Control selection, tailoring, implementation statements and assessment belong to the agency and its assessors. Identifiers are from the sources' current editions, checked 19 October 2026.
:::

::: {.callout-tip}
## Download this appendix
**[Appendix_A-bundle.docx](../../../downloads/Appendix_A-bundle.docx)** — this appendix as one Word document. Regenerated on every site deploy.
:::

## The four frameworks

- **OMB M-22-09** sets the federal zero trust strategy's identity outcomes: centrally managed enterprise identity integrated into applications, phishing-resistant MFA enforced at the application layer, and at least one device-level signal considered when authorizing access.[^a-m2209] [^a-ms-m2209]
- **CISA Zero Trust Maturity Model v2.0** describes the identity pillar through four functions — Authentication, Identity Stores, Risk Assessments and Access Management — plus the cross-cutting Visibility and Analytics, Automation and Orchestration, and Governance capabilities, each at Traditional, Initial, Advanced and Optimal stages.[^a-ztmm] [^a-ms-ztmm]
- **NIST SP 800-207** states seven zero trust tenets, cited below by number: (1) all data sources and computing services are resources; (2) all communication is secured regardless of network location; (3) access is granted per session; (4) access is determined by dynamic policy; (5) the enterprise monitors the integrity and security posture of all assets; (6) authentication and authorization are dynamic and strictly enforced before access; (7) the enterprise collects information on the current state of assets, infrastructure and communications.[^a-207]
- **NIST SP 800-53 Rev. 5** supplies the control identifiers.[^a-53]

## Mapping by book

| Book | Control the book puts in place | Evidence it produces | M-22-09 | CISA ZTMM v2 identity | SP 800-207 tenet | SP 800-53 Rev. 5 |
|---|---|---|---|---|---|---|
| [02](Book_02.md) The Estate | Inventory every instance; retire, consolidate or retain each | Instance inventory with a disposition per instance | Enterprise identity applied to every system in scope | Identity Stores (know and reduce the stores); Governance | 1 | CM-8, PM-5 |
| [03](Book_03.md) The Audit | Classify every login and measure NTLM fallback | Per-instance login census by `sys.server_principals` type; `auth_scheme` counts | Inventory of legacy authentication to retire | Authentication (Traditional baseline); Visibility and Analytics | 5, 7 | AC-2, AU-2, AU-12, CM-8 |
| [04](Book_04.md) The Identity Bridge | A cloud identity for the engine: Arc managed identity (2025) or app registration and certificate (2022) | Arc and extension health; Graph permission grants per machine identity; local token test | Centrally managed identity integrated with the application | Identity Stores; Authentication (non-person entities) | 6 | IA-9, IA-5, AC-6 |
| [05](Book_05.md) Login Migration | Entra logins replace Windows and SQL logins through create → validate → disable → observe → drop | Parallel-run record; disabled-then-dropped legacy logins; `sa` disabled and renamed; SQL authentication refused | Enterprise identity at the application; MFA at the application layer through Conditional Access | Authentication (Advanced with phishing-resistant MFA); Access Management | 3, 6 | AC-2, AC-2(3), IA-2, IA-2(1), IA-2(2), IA-5, CM-3 |
| [06](Book_06.md) NTLM Elimination | SPN repair so connections negotiate Kerberos; restrict NTLM | `auth_scheme` trend to zero NTLM; NTLM audit events | Removes a legacy, replayable method on the way to phishing-resistant authentication | Authentication | 2, 6 | IA-2(8), CM-7, SC-8 |
| [07](Book_07.md) Access Control | One Entra group, one role, one database, one environment; dynamic membership from HR attributes; write control on the attributes; PIM for Groups; access reviews | Group-to-role map; attribute write-permission evidence; review completions; PIM activation logs | Attribute- and role-based authorization | Access Management (Initial → Advanced → Optimal JIT); Automation and Orchestration; Governance | 4 | AC-2(1), AC-3, AC-6, AC-6(7), AC-2(7), AC-16 |
| [08](Book_08.md) The Application Chain | Each application authenticates users and connects to the database with Entra tokens, or carries a dated exception | Per-application class, owner and exception register | Enterprise identity integrated into applications | Authentication; Access Management | 3, 6 | IA-2, IA-9, AC-3, CA-3 |
| [09](Book_09.md) Steady State | Entra-exclusive operational posture, re-evidenced on every audit run; drift alerts | Per-instance compliance record; drift events; sign-in logs | Continuous verification of the identity outcomes | Visibility and Analytics; Governance (Optimal) | 5, 7 | CA-7, AU-6, AU-12, AC-2(4), AC-6(9) |
| [10](Book_10.md) Certificate Authority | A replacement CA issuing before ADCS is retired; certificate inventory | Certificate inventory (subject, issuer, expiry) per instance | — | Identity (cross-cutting governance of credentials) | 2 | SC-17, SC-12, IA-5(2), SC-8 |
| [11](Book_11.md) Epilogue | Per-data-domain platform decision | Decision record per data domain | — | Governance | 1 | PM-5, SA-9 |

Book 01 states the case and produces no control evidence of its own. The [Applicability](Applicability.md) page decides which rows apply to an environment.

## Notes on the mapping

- **Mixed results are normal.** An instance can meet one row and miss another; the per-instance compliance record of Book 09 is what shows which.
- **MFA is a Conditional Access outcome, not an engine setting.** SQL Server accepts the Entra token; whether the human behind it used phishing-resistant MFA is decided by Conditional Access policy and evidenced in Entra sign-in logs.[^a-ca]
- **IA-9 applies to the engine's own identity.** The Arc managed identity or app registration authenticates SQL Server to Microsoft Entra ID and Microsoft Graph; the security-approval kit (Appendix B) gives the permission justification.
- **The 800-207 mapping is architectural.** SQL Server acts as the enforcement point that accepts only tokens Entra ID issued under policy; the series does not implement a full policy engine.

[^a-m2209]: Office of Management and Budget, [M-22-09, Moving the U.S. Government Toward Zero Trust Cybersecurity Principles](https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf) (January 2022).
[^a-ms-m2209]: Microsoft Learn, [Memo 22-09 identity requirements overview](https://learn.microsoft.com/en-us/entra/standards/memo-22-09-meet-identity-requirements) and [Meet authorization requirements of memorandum 22-09](https://learn.microsoft.com/en-us/entra/standards/memo-22-09-authorization).
[^a-ztmm]: CISA, [Zero Trust Maturity Model, Version 2.0](https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf) (April 2023).
[^a-ms-ztmm]: Microsoft Learn, [CISA Zero Trust Maturity Model for the identity pillar](https://learn.microsoft.com/en-us/security/zero-trust/cisa-zero-trust-maturity-model-identity).
[^a-207]: NIST, [SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final), Section 2.1, Tenets of Zero Trust.
[^a-53]: NIST, [SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final).
[^a-ca]: Microsoft Learn, [What is Conditional Access?](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview)

::: {.callout-tip}
## Continue the series
[← Previous: Book 11 — Epilogue](Book_11.md) · [Index](index.md)
:::
