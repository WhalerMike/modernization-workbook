---
title: "Chapter 02 — Federal HR 2.0 and the Core HCM Platform"
description: "What OPM HRIT is, the Federal HR 2.0 memo and the Oracle Core HCM award, the wave clock that sets an agency's provisioning deadline, why EHRI-shaped integrations have an expiry date, and what OPM does and doesn't require of the identity leg."
doc-type: hr-driven-iam-chapter
audience: [Executive, Technical, Customer]
family: hr-driven-iam
series-order: 2
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-01-01
---

# Chapter 02 — Federal HR 2.0 and the Core HCM Platform

*The deadline isn't the agency's to set. The provisioning feed has to be ready when the agency's onboarding reaches its interconnection slot.*

::: {.callout-note}
## In this chapter
What OPM HRIT is and who OPM is in this story. Five decades of federal HR consolidation. The Federal HR 2.0 program facts and the wave clock. Why integrations built against EHRI and eOPF have an expiry date. What OPM requires of the identity leg, and what it leaves to the agency.
:::

## OPM HRIT and Federal HR 2.0

OPM HRIT is the Office of Personnel Management's Human Resources Information Technology line — the shared-services program through which OPM delivers HR systems and workforce data services across the federal government: personnel action processing (the SF-50 pipeline), the electronic Official Personnel Folder (eOPF), and the government-wide HR data backbone, Enterprise Human Resources Integration (EHRI). Since December 2025 the program has a directing instrument: the joint OMB/OPM memorandum *Creating "Federal HR 2.0" by Consolidating Core Human Capital Management Across the Federal Government* (December 10, 2025), which consolidates 100+ agency Core HCM systems onto one government-wide platform and — significant for integration planning — schedules eOPF and EHRI to become **redundant and decommissioned** once the Core HCM platform absorbs their function. Anything built against the EHRI/eOPF feed shapes is building against systems the program has already scheduled for retirement; the durable integration surface is the Core HCM platform's own (federation, SCIM provisioning, extracts).

**Who OPM is in this story.** Not just a policy shop. Under OMB M-19-16 (*Centralized Mission Support Capabilities for the Federal Government*, April 2019), OPM was designated the **HR Quality Services Management Office (HR QSMO)** — the government-wide standards owner and storefront for HR IT. The policy direction is explicit: agencies procure HR technology through the QSMO's vetted marketplace rather than building bespoke systems.

## Fifty years of consolidation

Every milestone in the program's history moves the same direction: fewer systems, more authoritative data, shared delivery. The architecture in this series is not a novel invention — it is the landing point that five decades of federal HR consolidation policy have been driving toward.

| Year | Milestone | What Changed |
|---|---|---|
| 1972 | **CPDF** | The Central Personnel Data File — OPM's first government-wide personnel data system |
| 2002 | **e-Gov era** | e-Payroll consolidates 26 federal payroll providers to 4; eOPF begins digitizing the paper personnel folder |
| 2004 | **HR Line of Business** | OPM-led shared-services program; the federal HR business reference model; agency HR moves to shared service centers |
| ~2010 | **EHRI** | Enterprise Human Resources Integration replaces CPDF — the government-wide HR data warehouse plus electronic OPF |
| 2019 | **HR QSMO** | OMB M-19-16 designates OPM the HR Quality Services Management Office — standards owner and storefront |
| 2021 | **QSMO marketplace** | The vetted HR IT catalog opens; agencies steered to standards-aligned shared solutions |
| 2025 | **Federal HR 2.0** | The joint OMB/OPM memorandum (December 10, 2025) directs one government-wide Core HCM platform; agencies pause their own Core HCM modernization |
| 2026 | **Core HCM award** | The Federal HRIT Modernization Core HCM contract is awarded to Oracle (June 11, 2026) — **Oracle Fusion Cloud HCM**, SaaS, the system-of-record feed this series builds on; Wave 1 agency transitions begin |
| 2027 | **Wave transitions** | Wave 2 completes in FY 2027; each agency's onboarding runs ~8 months with interconnections live around month 5 |
| 2028 | **One system** | Government-wide adoption goal (FY 2028); eOPF and EHRI become redundant and are decommissioned |

: The OPM HRIT timeline — five decades of consolidation {.striped .hover}

## The program facts

| Fact | Value | Source |
|---|---|---|
| Directing instrument | OMB/OPM memo, *Creating "Federal HR 2.0" by Consolidating Core Human Capital Management Across the Federal Government* | Dec 10, 2025 (Vought/Kupor) |
| Platform | **Oracle Fusion Cloud HCM** (SaaS) | Award announced Jun 11, 2026 |
| Wave 1 (begins FY26, concludes FY27) | DHS, USDA, HHS, DOI, OPM, DOT, VA, EPA (~900K FTE) | Memo, Appendix A |
| Wave 2 (fully in FY27) | SSA, DOC, ED, HUD, DOL, SBA, State, DOE, DoW, NASA, GSA, DOJ, Treasury, other (~1.1M FTE) | Memo, Appendix A |
| First go-lives | Initial deployments slated to go live **January–March 2027**, with the first agencies starting onboarding as FY27 begins | OPM Director, reported Sep 1, 2026[^c02-mt] |
| Agency onboarding shape | ~8 months; **interconnection(s) go-live ≈ month 5**; legacy systems discontinued at cutover | Memo, Appendix B |
| Government-wide adoption goal | FY 2028 | Memo |
| Standing systems | eOPF and EHRI continue near-term, then are made **redundant and decommissioned** by Core HCM | Memo |
| Agency obligation now | **Pause own Core HCM modernization**; execute the Appendix C preparation actions | Memo, §II |
| Interface requirement (procurement) | PWS Appendix A Requirements Checklist Req #5: **SCIM 2.0 near-real-time provisioning** | Solicitation 24322626R0007 (verified 2026-04-30) |

Two planning consequences follow directly:

1. **The deadline is not the agency's to set.** The first Wave 1 agencies go live
   between January and March 2027. For a Wave 2 agency the provisioning feed
   must be integration-ready when the agency's onboarding reaches its
   interconnection slot (~month 5 of the wave window). Build backward from that.
2. **EHRI-shaped thinking has an expiry date.** Anything that treats the EHRI/eOPF
   feeds as the durable HR data interface is building against a system the memo
   has already scheduled for decommissioning. The durable interface is the Core
   HCM platform's own surface: HCM Extracts, ATOM feeds, REST/SCIM.


## What OPM requires, and what it leaves to the agency

No OPM document mandates or specifies Entra ID integration. The program fixes the HR side — the platform, the waves, the interface requirements in the solicitation — and leaves the identity side to each agency. The Entra-specific design in Chapters 04–08 is an agency implementation decision built on Microsoft's own Oracle HCM integration guidance. Until mid-2026 the HR side of this architecture had to be planned agnostically, because the government-wide vendor was undecided. The award removed that uncertainty without changing the architecture: the pipe is source-shaped, not source-bound, so if the program changes again the adapter changes and nothing else does.

::: {.callout-tip}
## Continue the series
[← Previous: Chapter 01 — Why HR Is the Source of Authority](01-why-hr-is-the-source-of-authority.md) · [Index](index.md) · [Next: Chapter 03 — Attribute Authority →](03-attribute-authority.md)
:::

<!-- Third-party sources (kept separate from Microsoft and federal primary sources) -->

[^c02-mt]: **Third-party source (trade press).** MeriTalk, "OPM Eyes $40M Annual Cost for Governmentwide HR Platform," Sep 1, 2026, <https://www.meritalk.com/articles/opm-eyes-40m-annual-cost-for-governmentwide-hr-platform/> (accessed Oct 19, 2026). Reports OPM Director Scott Kupor's statement that initial deployments are slated to go live between January and March.
