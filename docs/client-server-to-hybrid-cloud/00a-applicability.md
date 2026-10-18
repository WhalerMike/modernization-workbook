# Applicability and Scope

**Read this before Chapter 01. It states which environments the target state in this series assumes, and where it doesn't apply as written.**

## The environment this series assumes

The target state described in Chapters 04–08 is built on Microsoft's **commercial cloud services**: Microsoft Entra ID, Microsoft Intune, Azure Arc, Azure DNS Private Resolver, Azure Private DNS, and Microsoft Defender, consumed from the commercial cloud. For a federal agency, that means:

| Environment | Fit |
|---|---|
| **Commercial cloud / GCC-Moderate** (FedRAMP Moderate system boundary; the underlying Azure commercial services carry FedRAMP High authorizations)[^cs00a-fre] | **Primary target.** The architecture applies as written, subject to the agency's own authorization boundary. |
| **GCC High / DoD** (Azure Government) | **Applies in principle, with checks.** Feature availability and timing differ in the sovereign clouds. Confirm each named capability (for example, Entra certificate-based authentication options, Lifecycle Workflows, Microsoft Cloud PKI, Global Secure Access, and Arc-enabled services)[^cs00a-cpki] against the current per-cloud availability tables before you commit to it.[^cs00a-entragov] |
| **Air-gapped / classified enclaves** | **Does not apply as written.** With no cloud control plane, Entra ID, Intune, and Arc aren't available. The assessment and plan-and-deliver discipline (Chapters 02–03) still apply to an on-premises target, which typically remains AD DS. |
| **OT, lab, and 802.1X-dependent networks** | **Partial.** Network access control that relies on NPS/RADIUS against AD needs an explicit successor (certificate-based EAP-TLS against a non-AD RADIUS, or a cloud RADIUS service). The series names the dependency but doesn't design the replacement. |

## Platform assumptions

- **Windows Server 2025** for the platform host (Chapter 01). Earlier supported versions work for the assessment role.
- **Windows 11** user devices for Entra join and Autopilot (Chapter 07).
- **Microsoft Entra ID P1** at minimum for dynamic groups, dynamic administrative units, and Conditional Access.[^cs00a-dyn] **Entra ID P2 or Microsoft Entra ID Governance** for Privileged Identity Management, Identity Protection risk policies, access reviews, and Lifecycle Workflows.[^cs00a-lcw]
- **Microsoft Intune** licensing for every managed user device.[^cs00a-intunegov]
- Azure subscriptions for Arc-connected servers, Azure Policy machine configuration, and Private Resolver. Some Arc-enabled capabilities are billed per server.

## What this series is, and isn't

- It is a **reference architecture and program model**. The "framework" (the platform host, plan engine, adapters, drift detection, and evidence packets) is a design to be built from standard components. It isn't an existing product.
- It doesn't replace Microsoft's product documentation or the agency's own authorization (ATO) process. Each new cloud dependency it introduces has to sit inside an authorized boundary.
- Numbers in the series (percentages, durations, user counts, thresholds) are **illustrative** unless a source is cited.
- Microsoft hasn't deprecated AD DS.[^cs00a-adds2025] Retiring it is an agency decision that this series supports. Partial outcomes are legitimate end states: a minimized AD, or documented Kerberos islands with end-of-life dates.


## Authoritative references

- Microsoft Learn, [Configure Microsoft Entra ID to meet FedRAMP High Impact level - Microsoft Entra](https://learn.microsoft.com/en-us/entra/standards/configure-for-fedramp-high-impact)
- Microsoft Learn, [Microsoft Entra feature availability in Azure for US Government - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/authentication/feature-availability)
- Microsoft Learn, [Microsoft Cloud PKI for Microsoft Intune - Microsoft Intune](https://learn.microsoft.com/en-us/intune/cloud-pki/)
- Microsoft Learn, [Microsoft Intune Government Service overview - Microsoft Intune](https://learn.microsoft.com/en-us/intune/fundamentals/government-service)
- Microsoft Learn, [Manage rules for dynamic membership groups in Microsoft Entra ID - Microsoft Entra ID](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership)
- Microsoft Learn, [What are lifecycle workflows? - Microsoft Entra ID Governance](https://learn.microsoft.com/en-us/entra/id-governance/what-are-lifecycle-workflows)
- Microsoft Learn, [What's new in Windows Server 2025](https://learn.microsoft.com/en-us/windows-server/get-started/whats-new-windows-server-2025)

---

**Previous:** [Chapter 00 — The Problem](00-the-problem.md)  
**Next:** [Chapter 01 — Platform Foundation](01-platform-foundation.md)

[^cs00a-fre]: Microsoft Learn, *Configure Microsoft Entra ID to meet FedRAMP High Impact level - Microsoft Entra*. Microsoft states that Azure supports services at FedRAMP High in the Azure public cloud and gives the Entra configuration needed to meet the High baseline. <https://learn.microsoft.com/en-us/entra/standards/configure-for-fedramp-high-impact>
[^cs00a-entragov]: Microsoft Learn, *Microsoft Entra feature availability in Azure for US Government - Microsoft Entra ID*. Entra feature availability in Azure for US Government. <https://learn.microsoft.com/en-us/entra/identity/authentication/feature-availability>
[^cs00a-cpki]: Microsoft Learn, *Microsoft Cloud PKI for Microsoft Intune - Microsoft Intune*. Microsoft Cloud PKI is available in GCC High but not in DoD environments. <https://learn.microsoft.com/en-us/intune/cloud-pki/>
[^cs00a-intunegov]: Microsoft Learn, *Microsoft Intune Government Service overview - Microsoft Intune*. Intune service description for GCC High and DoD. <https://learn.microsoft.com/en-us/intune/fundamentals/government-service>
[^cs00a-dyn]: Microsoft Learn, *Manage rules for dynamic membership groups in Microsoft Entra ID - Microsoft Entra ID*. Dynamic membership requires Microsoft Entra ID P1 for each member. <https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership>
[^cs00a-lcw]: Microsoft Learn, *What are lifecycle workflows? - Microsoft Entra ID Governance*. Lifecycle Workflows require Microsoft Entra ID Governance or Microsoft Entra Suite licenses. <https://learn.microsoft.com/en-us/entra/id-governance/what-are-lifecycle-workflows>
[^cs00a-adds2025]: Microsoft Learn, *What's new in Windows Server 2025*. <https://learn.microsoft.com/en-us/windows-server/get-started/whats-new-windows-server-2025>
