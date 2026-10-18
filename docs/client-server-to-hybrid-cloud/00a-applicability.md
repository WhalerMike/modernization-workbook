# Applicability and Scope

**Read this before Chapter 01. It states which environments the target state in this series assumes, and where it doesn't apply as written.**

## The environment this series assumes

The target state described in Chapters 04–08 is built on Microsoft's **commercial cloud services**: Microsoft Entra ID, Microsoft Intune, Azure Arc, Azure DNS Private Resolver, Azure Private DNS, and Microsoft Defender, consumed from the commercial cloud. For a federal agency, that means:

| Environment | Fit |
|---|---|
| **Commercial cloud / GCC-Moderate** (FedRAMP Moderate system boundary; the underlying Azure commercial services carry FedRAMP High authorizations) | **Primary target.** The architecture applies as written, subject to the agency's own authorization boundary. |
| **GCC High / DoD** (Azure Government) | **Applies in principle, with checks.** Feature availability and timing differ in the sovereign clouds. Confirm each named capability (for example, Entra certificate-based authentication options, Lifecycle Workflows, Microsoft Cloud PKI, Global Secure Access, and Arc-enabled services) against the current per-cloud availability tables before you commit to it. |
| **Air-gapped / classified enclaves** | **Does not apply as written.** With no cloud control plane, Entra ID, Intune, and Arc aren't available. The assessment and plan-and-deliver discipline (Chapters 02–03) still apply to an on-premises target, which typically remains AD DS. |
| **OT, lab, and 802.1X-dependent networks** | **Partial.** Network access control that relies on NPS/RADIUS against AD needs an explicit successor (certificate-based EAP-TLS against a non-AD RADIUS, or a cloud RADIUS service). The series names the dependency but doesn't design the replacement. |

## Platform assumptions

- **Windows Server 2025** for the platform host (Chapter 01). Earlier supported versions work for the assessment role.
- **Windows 11** user devices for Entra join and Autopilot (Chapter 07).
- **Microsoft Entra ID P1** at minimum for dynamic groups, dynamic administrative units, and Conditional Access. **Entra ID P2 or Microsoft Entra ID Governance** for Privileged Identity Management, Identity Protection risk policies, access reviews, and Lifecycle Workflows.
- **Microsoft Intune** licensing for every managed user device.
- Azure subscriptions for Arc-connected servers, Azure Policy machine configuration, and Private Resolver. Some Arc-enabled capabilities are billed per server.

## What this series is, and isn't

- It is a **reference architecture and program model**. The "framework" (the platform host, plan engine, adapters, drift detection, and evidence packets) is a design to be built from standard components. It isn't an existing product.
- It doesn't replace Microsoft's product documentation or the agency's own authorization (ATO) process. Each new cloud dependency it introduces has to sit inside an authorized boundary.
- Numbers in the series (percentages, durations, user counts, thresholds) are **illustrative** unless a source is cited.
- Microsoft hasn't deprecated AD DS. Retiring it is an agency decision that this series supports. Partial outcomes are legitimate end states: a minimized AD, or documented Kerberos islands with end-of-life dates.

---

**Previous:** [Chapter 00 — The Problem](00-the-problem.md)  
**Next:** [Chapter 01 — Platform Foundation](01-platform-foundation.md)
