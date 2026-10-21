---
title: "Whitepaper Reading Guide"
subtitle: "How the 29 papers relate, and recommended paths through them"
doc-type: reference
author: Michael Stratton
date: "August 2026"
audience: "Federal CIO/CISO · assessors · architects · engineers · research audience"
canon-source: "docs/customer-documents/whitepapers/"
derived-from: "Synthesis of this section's own whitepapers — their frontmatter (status, canon anchors) and content. Makes explicit a set of cross-references that do not exist in any individual paper today; carries no independent canon claims of its own."
created-at: 2026-08-03
updated-at: 2026-08-03
version: "1.0"
lifecycle: adopted
tiers_adopted: [1]
lifecycle_review: 2026-11-22
---

# Whitepaper Reading Guide {.unnumbered}

The section index lists all 29 papers as a flat table —
good for lookup, silent on how the papers relate to each other or what
order to read them in. This page groups them into tracks and proposes
reading paths for common audiences. It is a companion to the index, not
a replacement, and states no doctrine of its own — every claim below is
about the papers' own content and status, not a canon claim.


::: {.callout-note}
## Identity papers moved to Book 02
The AD-to-Entra ID, Session vs. Telemetry, Federal SSOT Alignment and FMP vs. Native Tools papers are now chapters of [Book 02 — Identity & Directory](../books/b02-identity/index.md). Their links below go to the chapters that replaced them.
:::

## The corpus at a glance

The section splits into two genres:

- **Policy/architecture papers** — Executive Summary → numbered
 sections → Honest Limits → Conclusion. These state FMP's governance
 doctrine and map it onto a compliance framework (ZTMM, BOD-25-01,
 FedRAMP).
- **Narrative papers** — an "In this whitepaper" overview → Act/Part
 structure → a canon-mapping table → Provenance. These tell an
 operational or historical story and derive the doctrine from it
 rather than stating it up front.

Whichever genre a paper belongs to, it opens with the same three-part
box — **Problem, solution, ask** — immediately after the title: the
problem the paper exists to resolve, the position it takes, and the
specific thing it asks the reader to do or decide. Where a paper ends in
a Call to Action, the box points at it rather than restating it. Read
the box first if you have two minutes; read the paper if the ask is
yours to act on.

Two papers — [`ad-to-entraid-migration-problem`](../books/b02-identity/01-why-identity-matters.md)
and [`fmp-vs-native-tools`](../books/b02-identity/06-who-owns-the-migration.md) — predate both
genres: they're docx imports from before the canon-anchoring convention
existed. They carry real content (the original business case for the
whole program) but are the corpus's least structurally current papers;
read them for the argument, not as a canon-anchored reference.

## Start here if your question is "who does this mandate bind"

[Federal Compliance for Moderate Agencies](../books/b14-compliance/01-proof-not-a-promise.md)
sits outside the six tracks below by design — it's a short primer, not a
deep-dive, and its job is disambiguation and routing rather than argument.
If the question in front of you is "does FedRAMP 20x apply to my agency or
to our cloud provider," or "what's actually a hard deadline versus
guidance," read it first; it routes into whichever track below actually
answers your follow-up question. Everyone else should skip straight to the
tracks.

## Six tracks

Papers are grouped by the question they answer, not by filename.
Several papers earn a place in more than one track — that's
cross-listed, not a mistake.

### Track 1 — Governance Foundations

Start here for "what is FMP."

| Paper | Status | Role |
|---|---|---|
| [Zero Trust Governance](../books/b11-zero-trust/10-evidence-not-verdicts.md) | Active | Maps the substrate onto CISA's five ZTMM pillars, pillar by pillar. |
| [Zero Trust Governance Principles](../books/b11-zero-trust/02-governance-principles.md) | Active | Broader and newer than the paper above — whole-agency (Network+CSP+VMware) scope, cross-cutting capabilities, the "why programs stall below Advanced" argument. Read *after* the pillar-mapping paper, not instead of it. |
| [Zero Trust Requires Whole-Agency Scope](../books/b11-zero-trust/01-a-whole-agency-property.md) | Active | Companion to the paper above — the whole-agency unification argument and SCuBA/ZTA worked example, split out 2026-08-03 so the parent paper's core argument stays finishable in one sitting. Read immediately after it, not standalone. |
| [Modernization Governance](../books/b13-governance/01-why-governance-decays.md) | Active | Governance framing specifically for the AD → Entra ID migration — the bridge into Track 2. |

### Track 2 — Identity & Directory Modernization

The AD → Entra ID arc.

| Paper | Status | Role |
|---|---|---|
| [AD-to-Entra ID Structural Migration Problem](../books/b02-identity/01-why-identity-matters.md) | Moved to Book 02 | Original statement of the structural migration problem — read for the business case. |
| [The Session vs. Telemetry Divide](../books/b02-identity/02-the-structural-problem.md) | Moved to Book 02 | The architectural-tension argument split out of the paper above 2026-08-03 — strong enough to stand alone, was diluting the parent's focus. Read right after it. |
| [Modernization Journey](../books/b01-transformation-arc/01-why-modernization-is-hard.md) | Draft | The mainframe→cloud arc end to end. **The argument is vendor-neutral and product-neutral** — written to hand to an audience that isn't evaluating a platform — and a separable [closing appendix](../books/b01-transformation-arc/01-why-modernization-is-hard.md) maps Act 4 to the ADRs behind it. Cross-listed as the flagship of Track 4. |
| [Flipping 50,000 Devices to Hybrid Join](../books/b05-devices/02-the-hybrid-join-trap.md) | Draft | One concrete operation *inside* the arc above — governed vs. ungoverned hybrid join. Read after *Modernization Journey*; it assumes that paper's control-plane/data-plane framing. |
| [Federal SSOT Alignment](../books/b02-identity/02-the-structural-problem.md) | Moved to Book 02 | Same identity-modernization event, read through the data-governance/SSOT-mandate lens instead of the architecture lens. |
| [FMP vs. Native Tools](../books/b02-identity/06-who-owns-the-migration.md) | Moved to Book 02 | AD assessment methodology and gap analysis against Microsoft-native tooling — also anchors Track 6. |

### Track 3 — Zero Trust Assessment & Compliance Closure

BOD-25-01 and CISA SCuBA.

| Paper | Status | Role |
|---|---|---|
| [Assessment Tools vs. Closing BOD-25-01 Findings](../books/b11-zero-trust/08-close-before-you-assess.md) | Active | The sequencing argument — remediate before you assess — that the rest of this track assumes. Read first in this track. |
| [ScubaGear Integration](../books/b11-zero-trust/09-running-the-assessment.md) | Active | How CISA's ScubaGear assessor output feeds FMP's evidence pipeline. |
| [ZTA and SCuBA — How They Relate](../books/b11-zero-trust/05-two-assessment-tools.md) | Active | Disambiguates Microsoft's Zero Trust Assessment from CISA SCuBA — read when a stakeholder asks "aren't these the same tool?" |
| [Ticket-to-Machine, Not Ticket-to-Human](../books/b13-governance/10-ticket-to-machine.md) | Draft | Closure-evidence argument across Azure/AWS/VMware + ServiceNow/SailPoint — the "how do we know a finding is actually closed" question this track builds toward. |
| [Ticket-to-Machine Appendices](../books/b13-governance/appendix-b-ticket-to-machine-reference.md) | Active | Code review, access-governance extension, PKI exception, and vendor landscape — split out of the paper above 2026-08-03 so its core argument stays the single-paper read its frontmatter promises. Reference only; skip unless you need that level of detail. |

### Track 4 — Network & Infrastructure Modernization

| Paper | Status | Role |
|---|---|---|
| [Modernization Journey](../books/b01-transformation-arc/01-why-modernization-is-hard.md) | Draft | **Flagship of this track**, cross-listed from Track 2. The forty-year mainframe-to-Zero-Trust arc, argued **vendor-neutral and product-neutral**, with the canon trail confined to a separable closing appendix. Has this corpus's most fully worked Call to Action, and the FedRAMP 20x Consolidated Rules timeline. |
| [SD-WAN vs. DIA Under TIC 3.0](../books/b09-network/02-transport-is-physics-control-is-compliance.md) | Draft | The transport-and-policy layer underneath this track's Act 4 architecture. Read after the flagship's Act 4, or standalone for a network-engineering audience. |
| [Book 08 — DNS, DHCP & IPAM](../books/b08-ddi/index.md) | Draft | The DNS layer underneath the same Act 4 architecture — split-brain DNS, Universal DDI, Cisco SD-WAN interception. Sibling to the SD-WAN paper, not sequential to it. |
| [Book 08, Appendix A — DNS Record Types and Ecosystem Integrations](../books/b08-ddi/appendix-a-dns-record-types.md) | Draft | The record-type catalog and ecosystem-integration table — bookmarkable reference, not meant to be read start to finish. |
| [Field Office WAN Transformation and Distribution Point Consolidation](../books/b09-network/11-field-office-wan-transformation.md) | Draft | A worked capital-planning case built on the SD-WAN and TIC 3.0 arguments above, plus new content neither covers: Configuration Manager distribution-point unit economics against a proposed hardware refresh. Read after the SD-WAN paper; assumes its transport argument and the DNS paper's INR/GCC finding rather than re-deriving either. |
| [FMP Git Server Interfaces](../books/b10-cloud-boundary/appendix-b-platform-host-interfaces.md) | Draft | Platform deployment surface (Windows Server 2025) — narrower scope, useful once an agency has committed to an FMP deployment rather than during the architecture-decision phase the rest of this track addresses. |

::: {.callout-note}
## One arc, one paper — consolidated 2026-09-09

This track's flagship and Track 2's narrative used to be two papers telling the
same forty-year arc: an external vendor-neutral edition and an internal
canon-anchored one. Handing the wrong one to an audience was the single most
common mis-sequencing risk in this corpus, so they were merged into
*Modernization Journey*, which keeps the vendor-neutral voice. The canon trail
the other edition carried survives as that paper's
[closing appendix](../books/b01-transformation-arc/01-why-modernization-is-hard.md),
placed after the Call to Action so the argument still reads end to end without
it — and so it can be dropped when the paper is handed outward. the compliance series Vol I
Book 05 tells the same arc in federal control-closure terms and names no
automation engine at all, so the appendix, not the book, is where the ADR
provenance lives.
:::

### Track 5 — Federal Program-Specific Alignment

| Paper | Status | Role |
|---|---|---|
| [HR-Driven Identity](../books/b03-hr-identity/index.md) (series; replaces the Federal HRIT Productization paper) | Active | Inbound HR provisioning into Entra ID — a specific integration domain, not a general-purpose entry point. |
| [AI Identity Governance](../books/b17-ai-identity/index.md) (Book 17; replaces the Federal AI Governance readiness brief) | Moved to Book 17 | AI-system identity governance under M-25-21: the inventory as an identity source, agent identities, owners and evidence for authorization. |
| [Federal SSOT Alignment](../books/b02-identity/02-the-structural-problem.md) | Moved to Book 02 | Cross-listed from Track 2 — also a data-governance-mandate alignment paper. |

### Track 6 — Positioning, Comparison & Vendor Reads

| Paper | Status | Role |
|---|---|---|
| [FMP vs. Native Tools](../books/b02-identity/06-who-owns-the-migration.md) | Moved to Book 02 | Cross-listed from Track 2 — the build-vs-buy / gap-analysis anchor for this track. |

## Recommended reading paths

Pick the path that matches why the reader opened the site, not the
alphabetical file list.

**A federal CIO/CISO with 30 minutes (first exposure)**

1. [Modernization Journey](../books/b01-transformation-arc/01-why-modernization-is-hard.md) — the compliance-deadline argument (FedRAMP 20x) and its Call to Action, written to be handed off without modification.

**An assessor validating BOD-25-01 / ZTMM claims**

0. [Federal Compliance for Moderate Agencies](../books/b14-compliance/01-proof-not-a-promise.md) — confirm which mandates in play actually bind the agency you're assessing versus its vendors, before diving into any one of them.
1. [Assessment Tools vs. Closing BOD-25-01 Findings](../books/b11-zero-trust/08-close-before-you-assess.md) — the sequencing argument.
2. [ScubaGear Integration](../books/b11-zero-trust/09-running-the-assessment.md) → [ZTA and SCuBA — How They Relate](../books/b11-zero-trust/05-two-assessment-tools.md) — how the evidence is produced and how it differs from Microsoft's own assessment.
3. [Zero Trust Governance Principles](../books/b11-zero-trust/02-governance-principles.md) — the maturity-model context for what "closed" is being measured against.
4. [Ticket-to-Machine, Not Ticket-to-Human](../books/b13-governance/10-ticket-to-machine.md) — how closure evidence is distinguished from a changed setting.

**A network/infrastructure architect**

1. [Modernization Journey](../books/b01-transformation-arc/01-why-modernization-is-hard.md) — the full arc and the physics argument.
2. [SD-WAN vs. DIA Under TIC 3.0](../books/b09-network/02-transport-is-physics-control-is-compliance.md) and [Book 08 — DNS, DHCP & IPAM](../books/b08-ddi/index.md) — read in either order; both sit under Act 4 independently.
3. [FMP Git Server Interfaces](../books/b10-cloud-boundary/appendix-b-platform-host-interfaces.md) — once an FMP deployment is actually being planned.

**An identity/directory team running an AD → Entra ID modernization**

1. [AD-to-Entra ID Structural Migration Problem](../books/b02-identity/01-why-identity-matters.md) — the original problem statement.
2. [Modernization Governance](../books/b13-governance/01-why-governance-decays.md) → [Modernization Journey](../books/b01-transformation-arc/01-why-modernization-is-hard.md) — governance framing, then the full arc.
3. [Flipping 50,000 Devices to Hybrid Join](../books/b05-devices/02-the-hybrid-join-trap.md) — the first concrete operation to execute inside that arc.
4. [Federal SSOT Alignment](../books/b02-identity/02-the-structural-problem.md) — the data-governance-mandate framing of the same event.

**Someone evaluating FMP against Microsoft-native tools or a build-vs-buy decision**

1. [FMP vs. Native Tools](../books/b02-identity/06-who-owns-the-migration.md) — the gap analysis.

**Reading the whole corpus, start to finish**

Track 1 (all four) → Track 2 (all six) → Track 3 (all four) → Track 4
(all four) → Track 5 (the two papers not already read in Track 2). This order
front-loads the doctrine (Track 1) before any domain paper assumes it,
and reads the two mainframe-to-Zero-Trust narratives back-to-back
(Track 2 then Track 4) so the vendor-neutral vs. canon-anchored
contrast is visible rather than discovered by accident months apart.
