---
title: "Federal Compliance Series"
subtitle: "An eleven-volume, 60-book FedRAMP Moderate compliance program — the federal edition, generic to any agency"
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: federal-compliance-series
lifecycle: adopted
tiers_adopted: [1]
lifecycle_review: 2026-12-17
aliases:
  - /customer-documents/federal-aan-series/index.html
  - /customer-documents/compliance/index.html
  - /customer-documents/compliance/federal-mandates/index.html
  - /customer-documents/compliance/policy-libraries/index.html
  - /customer-documents/compliance/incident-response/index.html

---

# Federal Compliance Series {.unnumbered}

The **Federal Compliance** is an eleven-volume, 60-book program
covering the network, identity, data-platform, security-operations, governance,
training, ServiceNow-automation, multi-cloud DDI, and day-2 architecture required
for **FedRAMP Moderate** authorization under FedRAMP 20x rules (mandatory
January 1, 2027).

## How Compliance and OrgMod relate {#pillars}

**Compliance** and **OrgMod** are two operational
expressions of one governance substrate — **Compliance**
proves federal organizational compliance, **OrgMod** modernizes — and both
are designed to be adopted **together or entirely independently**.
Compliance's independence is structural, not aspirational: the series speaks
only to the open Evidence & Authorization Contract, so it stands alone
without OrgMod or any particular engine behind it.

::: {.callout-note collapse="true"}
## Formerly the "Federal Compliance AAN Series"
**AAN — Application-Aware Networking — was the program's original naming
concept**, born in the network-modernization work where the series began. As
FedRAMP 20x made continuous evidence mandatory, the program grew into this
site's compliance pillar, and its name now reflects that role. File paths and
URLs retain the historical `aan` / `Compliance` names so existing links keep
working; application-aware networking itself remains a technical subject of
Vol I, unchanged.
:::

Start with the **[two-page Executive Brief](Vol_0_Book_00a_Executive_Brief.md)**,
then the **[Executive Summary and control compendium](Vol_0_Book_00_Executive_Summary.md)**.
Every book is browsable here and carries a Word download button.

The series is engine-neutral by design: wherever a book needs evidence or
authorization tooling, it speaks to the
**Compliance Evidence & Authorization Contract** —
the open specification (compliance spine + eight evidence slots + OSCAL
AP/AR/POA&M boundary) that any conformant evidence engine can satisfy.

## Three ways in {#three-ways-in}

Pick the entry point that matches your role — the full eleven volumes will
still be there:

| Entry point | For | Start here |
|---|---|---|
| **Executive Brief** | Leadership, sponsors, procurement | The [two-page Executive Brief](Vol_0_Book_00a_Executive_Brief.md), then the [Executive Summary](Vol_0_Book_00_Executive_Summary.md) and the [Product Inventory Questionnaire](Vol_0_Book_01_Product_Inventory_Questionnaire.md) |
| **Practitioner Quickstart** | ISSOs and engineers who need the working core first | The training program's Core Compliance Pathway (nine-book spine + four labs), the `<engine>` tooling note, and the deployable kits — the [ServiceNow compliance app](Vol_VII_Book_05_ServiceNow_Compliance_App.md) and the Day-2 catalog (Vol IX) — via the Downloads page |
| **Full Academy** | Anyone pursuing the credentials | [Vol V — Training & Certification](Vol_V_Book_00_Training_Certification_Overview.md) and the two-track Compliance Training Program with its capstones and rubrics |

## One lifecycle, two pillars {#macdr}

Every operational change the substrate touches — every **Move, Add, Change,
Deletion, and Reset (MACD-R)** — travels the same five-clause authorized
path: **it originates with the SSOT → carries an authoritative authorization
→ executes under least privilege with just-in-time elevation (PIM) → closes
with provenance → emits verified, secured evidence automatically to
continuous monitoring.** Compliance applies the law to control remediation and
attestation: drift against the compliance spine originates the work, the
day-2 lanes carry the authorization and elevation discipline, and the
closure stream is what the attestation pipeline (Vol VII Book 04) lifts
into OSCAL and KSI evidence. Clause 1 is answered per object class by the
**[SSOT Registry](Vol_0_Book_00_Executive_Summary.md#ssot-registry)**
— one designated source of truth for every class including the non-human
ones (service accounts, devices, AI systems, declared infrastructure),
each anchored to a human owner resolvable in the HR SSOT. The doctrine —
including Closure Provenance ("no closure counts unless it carries its
proof") — is stated in
[Vol 0 Book 00](Vol_0_Book_00_Executive_Summary.md#macdr-lifecycle).

::: {.callout-tip}
## Download the full series
**[federal-compliance-series-bundle.docx]** — every book
and training-academy page concatenated into one Word document.

For the complete kit — one `.docx` volume bundle per volume plus every book as
`.pptx`, per-volume folders, plus the deployable operator kits — see
**the Downloads page**.
:::

::: {.callout-note}
## Two editions, one source
This is the **federal edition**: written for any federal agency, with no agency
named. An **agency edition** renders from the same source with an agency's own
facts substituted — its enabling statute, namespace, tenant, and pre-filled tool
inventory. That edition is not published: its facts live inside the agency
boundary, and the published tree cannot render it.
:::

## The eleven volumes

| Volume | Theme | Books | One Word file |
|---|---|---|---|
| **Vol 0** | Executive Summary, Questionnaire & Control Crosswalk | 4 | [`Vol_0-Executive Summary, Questionnaire & Control Crosswalk-Bundle.docx`] |
| **Vol I** | Foundation & Transport | 8 | [`Vol_I-Foundation & Transport-Bundle.docx`] |
| **Vol II** | Data Platform | 4 | [`Vol_II-Data Platform-Bundle.docx`] |
| **Vol III** | Security Operations | 8 | [`Vol_III-Security Operations-Bundle.docx`] |
| **Vol IV** | Governance & Assurance | 7 | [`Vol_IV-Governance & Assurance-Bundle.docx`] |
| **Vol V** | Training & Certification | 5 | [`Vol_V-Training & Certification-Bundle.docx`] |
| **Vol VI** | Implementation | 9 | [`Vol_VI-Implementation-Bundle.docx`] |
| **Vol VII** | ServiceNow Automation | 6 | [`Vol_VII-ServiceNow Automation-Bundle.docx`] |
| **Vol VIII** | Multi-Cloud DDI | 1 | [`Vol_VIII-Multi-Cloud DDI-Bundle.docx`] |
| **Vol IX** | Day-2 Operations | 7 | [`Vol_IX-Day-2 Operations-Bundle.docx`] |
| **Vol X** | Governance-Substrate Integration (optional binding) | 1 | [`Vol_X-Governance-Substrate Integration-Bundle.docx`] |
| **Total** | — | **60** | — |

A companion **Training Academy** — 20 per-book courseware modules, 5 vendor labs,
and two tracks (compliance and implementation) — is published alongside the series.

## How the series closes controls

Each book generates its "Authorities Closed Here" table from a single compliance
spine (`federal-compliance-compliance-spine.yml`): the SSOT that maps every NIST SP 800-53 Rev 5
control the series closes to the book that closes it, the mechanism, the
accreditation gate, the FedRAMP 20x KSI theme, and the evidence slot. The tables
are generated, never hand-edited, so the series cannot claim a closure the spine
does not record.
