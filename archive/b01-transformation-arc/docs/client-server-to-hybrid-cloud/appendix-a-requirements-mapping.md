# Appendix A — Federal Requirements Mapping

**How the series' outcomes line up with OMB M-22-09, the CISA Zero Trust Maturity Model v2, NIST SP 800-207, and NIST SP 800-53 Rev. 5**

This appendix is **compliance-enabling, not compliance-certifying**. It shows where the work in each chapter produces evidence an agency can use toward these requirements. Whether a control is satisfied depends on the agency's own system boundary, implementation, and assessor.

## OMB M-22-09 goals[^csap-m2209]

| M-22-09 area | Requirement (summarized) | Where the series contributes |
|---|---|---|
| Identity | Agency-managed identity systems; phishing-resistant MFA for staff, contractors, and partners; no password rotation or special-character rules | Ch 04 (Entra ID as the authoritative directory), Ch 08 (phishing-resistant methods, CBA with PIV/CAC) |
| Devices | A complete inventory of every device the agency operates; device-level signals in access decisions | Ch 02 (computer inventory), Ch 05 (compliance policies feeding Conditional Access), Ch 07 (Entra join, Arc) |
| Networks | Encrypt DNS and HTTP traffic where possible; stop relying on network location for trust | Ch 06 (DNS governance; encrypted DNS is not designed here, so treat it as a gap), Ch 08 (ZTNA in place of VPN) |
| Applications and workloads | Treat applications as internet-connected; enterprise identity in front of every application | Ch 07 (Kerberos/SPN retirement, modern authentication), Ch 08 (SASE/ZTNA) |
| Data | Categorize data; monitor access | Out of scope for this series |

## CISA Zero Trust Maturity Model v2 pillars[^csap-ztmm]

| Pillar / capability | Series chapters | Typical maturity movement |
|---|---|---|
| Identity | 04, 08 | Traditional → Advanced: centralized identity, phishing-resistant MFA, automated lifecycle |
| Devices | 05, 07 | Traditional → Advanced: managed and compliant devices as an access condition |
| Networks | 06, 08 | Traditional → Initial/Advanced: identity-based access in place of the perimeter |
| Applications and workloads | 07, 08 | Traditional → Initial: modern authentication; Kerberos islands documented |
| Data | — | Not addressed |
| Visibility and analytics (cross-cutting) | 03, 09 | Drift detection, evidence packets |
| Automation and orchestration (cross-cutting) | 01, 03 | Plan-and-deliver pipeline |
| Governance (cross-cutting) | 03, 09, 10 | Gates, separation of governance and execution |

## NIST SP 800-207 tenets[^csap-n207]

| Tenet (paraphrased) | Series mechanism |
|---|---|
| All data sources and computing services are resources | Ch 00's eleven dependency categories |
| All communication is secured regardless of network location | Ch 08 ZTNA, retirement of network-segment authority |
| Access is granted per session | Ch 05 Conditional Access, Ch 08 sign-in frequency and CAE |
| Access is decided by dynamic policy (identity, device, behavior) | Ch 05 compliance + Conditional Access; Ch 08 risk-based policy |
| The enterprise monitors the integrity and posture of its assets | Ch 05 compliance policies, Ch 07 Defender/machine configuration |
| Authentication and authorization are dynamic and strictly enforced | Ch 04 PIM-scoped roles, Ch 08 phishing-resistant MFA |
| The enterprise collects information to improve its security posture | Ch 03 evidence packets, Ch 09 drift reporting |

## NIST SP 800-53 Rev. 5 controls the series produces evidence for[^csap-n53]

| Control | Name | Series evidence |
|---|---|---|
| AC-2 | Account Management | HR-driven joiner/mover/leaver workflows (Ch 04); drift findings |
| AC-3 / AC-6 | Access Enforcement / Least Privilege | AU-scoped roles, PIM eligibility (Ch 04, 08) |
| AC-17 | Remote Access | ZTNA in place of VPN (Ch 08) |
| IA-2 / IA-2(1),(2),(12) | Identification and Authentication; MFA; PIV credentials | Phishing-resistant MFA and CBA (Ch 08) |
| IA-5 | Authenticator Management | CBA trust store, username bindings (Ch 08) |
| CM-2 / CM-6 | Baseline Configuration / Configuration Settings | Versioned Intune and machine-configuration manifests (Ch 05) |
| CM-3 | Configuration Change Control | Authorized plans, pull-request review (Ch 03) |
| CM-8 | System Component Inventory | Assessment streams (Ch 02), device inventory (Ch 07) |
| SC-20 / SC-21 / SC-22 | Secure name resolution | DNS architecture (Ch 06), partially |
| AU-6 / SI-4 | Audit Review / System Monitoring | Evidence packets, SIEM forwarding (Ch 03, 08) |
| CA-7 | Continuous Monitoring | Drift detection and steady state (Ch 09) |

## Gaps to plan for separately

Encrypted DNS (M-22-09), data categorization and the data pillar, and 802.1X/RADIUS successors are not designed in this series (see the [applicability note](00a-applicability.md)).

---

**Previous:** [Chapter 10 — Leadership Takeaway](10-leadership-takeaway.md)

[^csap-m2209]: OMB, *M-22-09: Moving the U.S. Government Toward Zero Trust Cybersecurity Principles* (January 2022). <https://www.whitehouse.gov/wp-content/uploads/2022/01/M-22-09.pdf>
[^csap-ztmm]: CISA, *Zero Trust Maturity Model*, Version 2.0 (five pillars and three cross-cutting capabilities). <https://www.cisa.gov/zero-trust-maturity-model>
[^csap-n207]: NIST, *SP 800-207, Zero Trust Architecture*, Section 2.1 (tenets). <https://csrc.nist.gov/pubs/sp/800/207/final>
[^csap-n53]: NIST, *SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations*. <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>
