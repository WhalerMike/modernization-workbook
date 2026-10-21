---
title: "Modernization"
subtitle: "Microsoft Client-Server to Hybrid-Cloud — transformation engine, target surface, program management"
doc-type: pillar-landing
audience: "CIOs · IT modernization leads · platform engineers · identity architects"
canon-source: "docs/planning/customer-documents-taxonomy.md §2.1"
pillar: modernization
date: 2026-04-24
aspirational: true
lifecycle: adopted
tiers_adopted: [1]
lifecycle_review: 2026-11-22
---

# Modernization {.unnumbered}

::: {.callout-tip}
## Download the full section
These guides are the operational home of **OrgMod — Organizational
Modernization**, one of the operational expressions of the Federal Modernization Program
substrate (alongside Compliance, which proves
compliance, and OrgLink, which governs external interconnection) —
adoptable together or entirely independently. The
OrgMod hub is the pillar's front door.

**[operational-guides-bundle.docx](../../downloads/operational-guides-bundle.docx)** — every page in this section (all sub-categories) concatenated into one Word document. Regenerated on every site deploy.
:::

::: {.callout-note title="One sub-section here belongs to a sibling pillar"}
This directory is OrgMod's operational home, but that is a statement about
where the pages live rather than a claim on every sub-section inside it. The
dividing question is whether a page's deliverable exists because an estate is
*moving* (OrgMod) or because a change has to be *proven* (Compliance) — a
modernization runbook such as the
[Intune + Azure Arc governed path](../books/b05-devices/05-the-governed-manual-and-retrofit-paths.html)
is still OrgMod.

One sub-section is Compliance's and ships in the
Compliance kit:

- SIEM Telemetry Emission — the *emission* side of the evidence pipeline whose *consumption* side is [Vol III Book 06](../compliance/Vol_III_Book_06_SIEM_XDR_Detection.md).

Every page in this tree reaches exactly one of the two kits; the section
bundle above still carries both.
:::

The **what transforms, what it transforms into, and the machinery that moves
data between the two.** the Federal Modernization Program modernization retires the AD-centric
Client/Server-era estate — Active Directory, GPO, DNS, DHCP, Kerberos, ADCS,
domain-joined devices — and governs its replacement in the Hybrid-Cloud
target surface of Entra ID, Intune, Azure Arc, IPAM, SASE, and Zero Trust.

::: {.callout-note title="Narrative entry point"}
New here? Start with Client-Server to Hybrid-Cloud
— the 11-chapter narrative series that walks the full transformation arc,
from AD's hidden governance surface to the Hybrid-Cloud access plane.
:::

## Sub-categories

| Section | Scope | Leaf count |
|---|---|---|
| [A. Platform Substrate](platform-substrate/index.html) | WS2025, IIS, Gitea, Kerberos, PKI, backup, hardening — the host that runs everything | 8 |
| [B. Transformation Engine](transformation-engine/index.html) | PowerShell + Python + API scripts that analyse, plan, and deliver | 7 |
| C. Identity (MOD_\*) | Dynamic groups, AUs, delegation, migration runbook | 11 |
| [D. Directory Migration (DM_\*)](../books/b02-identity/04-the-hidden-migration-surface.html) | IPAM, DNS, DHCP, PKI, RADIUS, LDAP, sync, devices, NTP, DFS, SPN, Trusts | 12 |
| [E. Target Surface](../books/b05-devices/08-gpo-to-intune-policy-migration.html) | Entra ID, Intune, Azure Arc, M365, AUs, CA, PIM | 7 |
| [F. Access Plane](../books/b04-access/index.html) | MFA, Zero Trust, SASE, CBA, PAM, break-glass | 6 |
| [G. Network Transformation](../books/b09-network/index.html) | SD-WAN, IPAM, DNS, DHCP, firewall, 802.1X | 6 |
| [H. Program Management](program-management/index.html) | Master Project Plan, roadmap, ADRs, ServiceNow, SAM, training | 6 |

## Cross-cutting guides

Guides that span several of the sub-categories above rather than sitting
inside one of them:

- SIEM Telemetry Emission — configuring
  Entra ID, Azure, and Microsoft 365 to emit audit events to a SIEM at the
  fidelity and retention OMB M-26-14, NIST SP 800-53, CISA, and FedRAMP
  require. Touches Target Surface (E), Access Plane (F), and Program
  Management (H); the emission side of the evidence pipeline whose
  consumption side is
  [Vol III Book 06](../compliance/Vol_III_Book_06_SIEM_XDR_Detection.md).
  Because that is what it is, it ships in the **Compliance** kit's
  `Evidence_Emission/` folder rather than the OrgMod one — see the note above.

## Flagship narrative

- Client-Server to Hybrid-Cloud — 11 chapters
  covering the full modernization arc from AD forest to governed Hybrid-Cloud
  target surface.

## Canonical invariants

Every page respects:

- **Assessment scope (FedRAMP 20x / CR26):** scope is set by the
  **Minimum Assessment Scope** inclusion test — an information resource is
  in scope if it handles federal information and/or likely impacts the
  confidentiality, integrity, or availability of federal information — not
  by a drawn network perimeter. Resources and most metadata that meet
  neither prong sit outside the assessed scope. See
  the program decision.
- **Deployment boundary:** GCC-Moderate for M365 SaaS; IaaS (Arc, Azure) per
  the program decision commercial-FedRAMP exception. This is a deployment fact about
  where the estate runs, distinct from the assessment scope above.
- **Evidence format:** machine-readable, continuously-validated **Key
  Security Indicator (KSI)** payloads against the FedRAMP **Consolidated
  Rules for 2026 (CR26)** catalog — 10 themes, 46 indicators — not an SSP
  narrative. CR26 is mandatory for all FedRAMP stakeholders from
  **2027-01-01**; no new Rev5 certifications are issued after 2027-06-11.
  See the program decision.
- **Source of truth:** every target surface state derives from a canonical
  plan stored in Gitea. The Federal Modernization Program does not mutate SSOT; it governs it.
- **Determinism:** the same inputs produce the same outputs. No hidden state,
  no human-in-the-loop interpretation.
- **Provenance:** every delivered change is attributable to a Git commit + a
  plan artifact + an operator or automation.
