---
title: "Appendix A — Optimize Exemption Decision Instruments"
description: "Templates for the three documents that exempt the Microsoft 365 Optimize endpoint set from TLS break-and-inspect at branch direct internet egress under NIST SP 800-53 SC-7(4): a skeleton for the authorizing official's exception memo, the pilot site register that serves as the exception record, and the architecture review determination against TIC 3.0 Security Capabilities Catalog version 3.3."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b09-network
book: B09
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — Optimize Exemption Decision Instruments

*Each signer answers one question that is actually theirs. The paperwork's shape is what makes the exemption a bounded decision instead of a quiet hole in the boundary.*

::: {.callout-note}
## In this appendix
The three instruments that [Chapter 12](12-microsoft-365-traffic.md) explains, as usable templates: a skeleton for the SC-7(4) traffic-flow exception memo, Attachment A (the pilot site register and egress IP ranges, which is the exception record itself), and Attachment B (the architecture review determination). Use them in that order of preparation, A then B, with the memo last, because the memo cites the versions of both.
:::

::: {.callout-warning}
## These are templates, not completed records
All three carry bracketed fields that need agency values, and Attachment A's example rows use documentation addresses reserved by RFC 5737 and RFC 3849.[^aA-rfc5737][^aA-rfc3849] Nothing here is an agency-approved form. Confirm the structure against your own risk-acceptance procedure and delegation of authority before use.
:::

## How the set fits together

| Document | What it decides | Who signs | Binds to |
|---|---|---|---|
| SC-7(4) traffic-flow exception memo | Whether to grant the exception, on named controls and stated compensating controls | Authorizing official | Attachment A version *[n]*; Attachment B date *[date]* |
| Attachment A — pilot site register | Which sites and circuits are in scope, why each needs it and when it ends | System owner | The memo cites its version |
| Attachment B — architecture review determination | Whether the design is TIC 3.0 conformant and where each PEP capability now sits | Architecture review board | Attachment A version *[n]*; catalog revision |

The architecture review doesn't accept risk, and the authorizing official doesn't re-run the architecture review. If the documents disagree about scope, the register version cited in the signed memo wins, and the disagreement is a finding.

## The SC-7(4) traffic-flow exception memo (skeleton)

The memo's full text isn't part of the published set. This skeleton carries only what the two attachments cite (clause 4 for tenant restrictions, clause 6 for compensating controls) and what SC-7(4)(d) and (e) require: a mission need, a duration and a review cadence.[^aA-sp80053] Write it in your agency's own memorandum format.

| Clause | Content |
|---|---|
| 1. Decision sought | Grant a documented exception to the traffic-flow policy for the Microsoft 365 **Optimize** endpoint sets (Worldwide instance IDs *[1, 11, 31 as current]*) at branch direct internet egress, so they're not subject to TLS break-and-inspect. |
| 2. Scope | The sites and circuits in Attachment A, version *[n]*, and no others. Adding a site, circuit or category is a scope change that returns to the authorizing official. |
| 3. Controls affected | SI-3, AC-4, AU-3 (with AU-12 by reference) and, where selected for this system, SI-4(10), on the exempt flows only. SC-8 and SC-7(4)(c) are **not** affected: the flows carry TLS or SRTP, and the overlay encrypts the rest. |
| 4. Tenant restrictions precondition | Tenant restrictions v2 is signaled from the Windows device and verified in force at each site before cutover (Attachment A, Table A3). The device and browser population it doesn't cover is listed: *[population]*. |
| 5. Telemetry | Branch telemetry reaches CISA services under *[reporting arrangement agreed with the agency's TIC delegates]* (Attachment B, B3). State any pilot gap. |
| 6. Compensating controls | *[Identity, service and endpoint controls in force: Conditional Access policies; Defender for Office 365 and Exchange Online Protection; Purview DLP and endpoint DLP; device-side tenant restrictions; steering log retention]*, as recorded in Attachment B, B2. |
| 7. Duration and review | In force from *[date]* until *[date or ending condition]*. Reviewed every *[frequency]*, with each review recorded in the Attachment A change log; exceptions without a current mission need are removed. |
| 8. Reversion | Reverting a site returns its Optimize traffic to the campus PEP and restores the prior posture. Revert owner per site in Attachment A, Table A3. |
| 9. Decision | ☐ Granted ☐ Granted with conditions *[conditions]* ☐ Not granted. Authorizing official signature, date. |

## Attachment A — pilot site register and egress IP ranges

*The SC-7(4) exception record: mission need, duration and review per site; egress ranges per circuit.*

::: {.callout-warning}
## Template — example rows use documentation addresses
The example rows use `203.0.113.0/24`, `198.51.100.0/24` and `192.0.2.0/24` (RFC 5737) and `2001:db8::/32` (RFC 3849), which are reserved for documentation and safe to publish.[^aA-rfc5737][^aA-rfc3849] Delete them once real rows exist, so no reader has to work out which is which.
:::

| Field | Value |
|---|---|
| Attaches to | SC-7(4) traffic-flow exception — Microsoft 365 Optimize endpoint set at branch direct internet egress |
| Prepared by | *[Name, title]* |
| Version | *[n]* — *[date]* |
| Site count | *[N]* sites, *[N]* circuits, approximately *[N]* users |
| Endpoint list version applied | *[Worldwide instance version, YYYYMMDDNN]* |

The sites listed here are the entire scope of the exemption. Adding a site is a scope change and requires a return to the authorizing official, so this register is a controlled document, and its version is what the signed memo refers to.

This register is the SC-7(4) exception record itself, not a supporting annex. SC-7(4)(d) requires each exception to the traffic-flow policy to be documented with its supporting mission or business need and the duration of that need; SC-7(4)(e) requires exceptions to be reviewed at an organization-defined frequency and removed when no explicit need supports them.[^aA-sp80053] Table A1 carries those fields. Tables A2 and A3 carry the network and readiness detail beneath them. A register that lists circuits but records no mission need and no expiry can't evidence the control the memo claims.

### Table A1 — Exception record

*One row per site: the SC-7(4)(d) and (e) fields.*

| Site ID | Supporting mission need | In force from | Expiry, or the condition that ends it | Last review |
|---|---|---|---|---|
| BR-001 | *[Mission need]* — **example** | *[date]* | *[date or condition]* | *[date]* |
| *[ID]* | *[Why this site needs the exemption, specific to the site, not the program]* | *[date]* | *[date or condition]* | *[date]* |
| *[ID]* | *[Why this site needs the exemption, specific to the site, not the program]* | *[date]* | *[date or condition]* | *[date]* |

Table A1 has one row per site, while A2 has one row per circuit: the mission need is a property of the site, and the egress range is a property of the circuit.

Two fields need careful writing. A **mission need** copied from the program justification isn't a site-level need. If the same sentence would serve every row, none of them answers the question. The **expiry** may be a date or a condition ("until the site moves to the SASE fabric"), but it may not be blank. An exception with no end is a permanent change to the traffic-flow policy, which is a different decision from the one the memo asks for.

### Table A2 — Scope

*One row per circuit: what the exemption covers.*

| Site ID | Location | Users | Circuit | Public egress range (post-NAT) | Egress model |
|---|---|---|---|---|---|
| BR-001 | *[City, ST]* — **example** | 140 | ISP-A primary | `203.0.113.16/28`; `2001:db8:10::/48` | Local direct internet access |
| BR-001 | *[City, ST]* — **example** | — | ISP-B secondary | `198.51.100.64/28` | Local direct internet access |
| BR-002 | *[City, ST]* — **example** | 62 | ISP-A primary | `192.0.2.128/28` | Local direct internet access, gateway fallback |
| *[ID]* | *[Location]* | *[n]* | *[Circuit]* | *[a.b.c.d/nn; IPv6 prefix]* | *[Local / gateway]* |
| *[ID]* | *[Location]* | *[n]* | *[Circuit]* | *[a.b.c.d/nn; IPv6 prefix]* | *[Local / gateway]* |

A site with two internet circuits occupies two rows that share a Site ID, because steering and attribution both work per circuit.

### Completion rules for egress ranges

*R1–R5, referenced by the admission checklist.* These are the errors that actually occur, roughly in the order they occur. Each one produces a fabric that looks configured but attributes traffic to the wrong place.

- **R1.** Record the **post-NAT public address** the branch presents to the internet, not the WAN interface address and not the inside pool. The post-NAT address is the source every external service sees, and the one the agency's probes and steering policy key on, so it's the one that identifies the circuit. An interface address recorded here silently mis-attributes every measurement from that site. In GCC-Moderate these ranges aren't registered with Microsoft's network connectivity or informed network routing features, which aren't available to those tenants; they serve the agency's own steering, probes and scope evidence.[^aA-netconn][^aA-inr]
- **R2.** Give each circuit a **unique** range. If two circuits at a site share a NAT pool, per-circuit attribution isn't possible. Fix the NAT design before listing the site, or accept that path comparison at that site is meaningless and record why.
- **R3.** Ranges must be **static and assigned to the agency** for the life of the exemption. Dynamically assigned or ISP-rotated addresses don't qualify. A changed egress address moves the site outside the approved scope without anyone deciding to move it.
- **R4.** Verify each range **from the branch itself** before listing it, not from documentation or the ISP order. Recorded and deployed ranges drift apart over time. The site is the authority; the record isn't.
- **R5.** Where IPv6 is enabled on the circuit, **list the IPv6 range too**. An IPv6-capable client leaving on an unlisted range is outside the recorded scope even though the site is listed. Microsoft publishes IPv6 prefixes for the Optimize endpoint sets, so IPv6 Optimize traffic is a real case, not a theoretical one.[^aA-ww]

### Table A3 — Readiness

*One row per site, completed before cutover. Product names in brackets are examples only.*

| Site ID | Edge platform / memory | On-box inspection co-resident *[e.g. Cisco UTD]* | Monitoring agent *[e.g. ThousandEyes]* | Government instance confirmed | TRv2 device signaling | Baseline captured | Probe verified | Cutover | Revert owner |
|---|---|---|---|---|---|---|---|---|---|
| BR-001 | *[Platform]* / *[n]* GB | Yes | Embedded | *[date]* | *[date]* | *[date]* | *[date]* | *[date]* | *[team]* |
| *[ID]* | *[Platform]* / *[n]* GB | *[Y/N]* | *[Embedded / standalone]* | *[date]* | *[date]* | *[date]* | *[date]* | *[date]* | *[team]* |

Use dates rather than ticks throughout. A tick records an intention; a date records an event, and a reviewer can check it.

**Government instance confirmed** is the date the monitoring agent was confirmed registered to the authorized government instance of the monitoring service and absent from any commercial console. Cisco ThousandEyes, for example, lists ThousandEyes for Government separately on the FedRAMP Marketplace, as FedRAMP Certified at Class C (Moderate).[^aA-fr]

**TRv2 device signaling** is the date tenant restrictions v2 was confirmed in force at the site *from the endpoint* rather than the proxy. Proxy header injection only ever protected sign-in, never the data plane, and Windows device signaling is the only documented path that protects the SharePoint Online and Exchange Online data plane.[^aA-trv2] Unless the device-side path is configured and verified, the site is cut over with data-plane tenant restrictions silently absent. Record alongside it the device and browser population that the Windows path doesn't cover. Microsoft documents coverage for Office apps, Universal Windows Platform .NET apps and Microsoft Edge on managed Windows 10 and 11 devices, and says it doesn't protect the .NET stack, Chrome or Firefox.[^aA-trv2] List what App Control for Business blocks and what remains.

### Admission checklist

Every line must be true before a site is listed in Table A2. A site that fails any line isn't ready to be in scope, and adding it later is a scope change.

- ☐ Egress ranges verified **from the site**, satisfying completion rules **R1–R5**.
- ☐ Table A1 complete for this site: a **site-specific mission need**, a start date, and an **expiry or ending condition** that isn't blank.
- ☐ Endpoint feed confirmed as the **Worldwide instance**, which is the one that includes GCC, not the DoD or GCC High instance.[^aA-ww]
- ☐ Exemption keyed to the **Optimize endpoint set IDs** from the current list version, with automated updates in place (Microsoft publishes new addresses 30 days before they go live).[^aA-ww]
- ☐ Teams media (endpoint set 11, UDP 3478–3481, IP ranges only) steered by **IP prefix**, not by name.[^aA-ww]
- ☐ Probe endpoint resolves and responds **from this branch**, not only from the datacenter.
- ☐ Name resolution for Microsoft 365 happens **local to this branch's egress**. No conditional forwarder returns these queries to a core resolver. Central resolution defeats local egress silently, and the probes won't report it.
- ☐ Monitoring agent registered to the **government instance** of the monitoring service, and absent from any commercial console.
- ☐ **Tenant restrictions v2 signaled from the endpoint** and verified in force, with the device and browser population it doesn't cover listed rather than assumed empty.
- ☐ Pre-cutover baseline captured and retained. This is the one step that can't be recovered afterward.
- ☐ Branch telemetry reaching CISA services under the arrangement named in the memo.
- ☐ Edge device sized for the finished architecture, including on-box inspection if the capability transfer places it there.
- ☐ Revert owner named, reachable and able to act within one shift without an approval cycle.

::: {.callout-important}
## Handling
Once completed, this register is a map of the agency's branch egress: public addresses, circuit topology, per-site user counts, which sites have reduced inline inspection and, with Table A1, why each was granted it. Handle and mark it under the agency's own rules for network architecture information, and check before circulating it beyond the signature chain.
:::

### Change log

Record every scope change here with its date and the authorizing official's decision that authorized it. The register version cited in the signed memo is the authoritative scope; a later version without a corresponding decision is a finding, not an update.

Record the **SC-7(4) reviews** here too, on the cadence the memo states, including reviews that change nothing. The control requires exceptions to be reviewed and removed when the supporting need lapses; a register that shows no reviews evidences no reviews, whatever happened in practice.

| Version | Date | Change or review | Authorizing decision |
|---|---|---|---|
| v1 | *[DD MMM YYYY]* | Initial scope, *[N]* sites | Approved *[DD MMM YYYY]* |
| *[v]* | *[date]* | *[Scope change, or "review: no change"]* | *[decision reference]* |

## Attachment B — architecture review determination

*TIC 3.0 classification and PEP capability transfer for Microsoft 365 Optimize local egress, against Security Capabilities Catalog version 3.3.*

::: {.callout-warning}
## Template — complete against the current catalog and Reference Architecture before the review convenes
:::

| Field | Value |
|---|---|
| Attaches to | SC-7(4) traffic-flow exception — Microsoft 365 Optimize endpoint set at branch direct internet egress |
| Scope | Sites listed in Attachment A, version *[n]* |
| Prepared by | *[Name, title]* |
| Reviewed by | *[Architecture review board / date convened]* |
| Guidance used | TIC 3.0 Security Capabilities Catalog **version 3.3** (publication September 2026); Reference Architecture version *[1.2 or current]*; Branch Office Use Case version *[3.0 or current]* |

::: {.callout-note}
## Sourcing of the catalog facts in this document
The catalog facts below were read from the current publication of the TIC 3.0 Security Capabilities Catalog, Version 3.3. Its cover is dated September 2026; its revision history dates version 3.3 to July 2025, and says the 2026 publication changed only footnote links.[^aA-scc] The twelve PEP capability groups below are Tables 4 through 15 of that document and match its own list in Section 4.2. The universal security capabilities in the separate table come from Table 3, with their capability identifiers.

The catalog says "the PEP security capability groups listing is not exhaustive" and that more groups may be developed for new use cases,[^aA-scc] so the count is a property of the revision. Confirm the revision in the header against the current one before the review convenes.

**The NIST control references in B2 are this document's own proposal and carry no external authority.** The catalog maps PEP capabilities to NIST Cybersecurity Framework categories, not to SP 800-53 controls.[^aA-scc] That column is the review board's work product and still needs confirming.
:::

::: {.callout-important}
## What this determination is, and isn't
This document records the architecture review's finding that the design is TIC 3.0 conformant and that campus PEP capabilities have been accounted for at the branch. **It doesn't accept risk.** The single item requiring the authorizing official's decision, the Optimize-category inspection exemption sought as a documented SC-7(4) traffic-flow exception, is referred to them in the covering memo. Keeping those decisions separate lets each signer answer a question that's actually theirs.
:::

### B1 — Security pattern classification

The Branch Office Use Case defines three security patterns, and an agency may implement a subset of them.[^aA-branch] Classification isn't bookkeeping: it decides which PEP capabilities apply, and a misclassification here carries into every row of B2.

- ☐ **Branch office to cloud service provider** — *proposed.* Branch users reaching an agency-sanctioned CSP. Microsoft 365 is a sanctioned service under *[reference]*, which places locally egressing Optimize traffic in this pattern. The use case permits direct access from the branch, with campus capabilities or commensurate ones deployed at the branch or the CSP "so long as policy enforcement parity is ensured."[^aA-branch]
- ☐ **Branch office to web** — generic internet destinations. Choosing this pattern for Microsoft 365 pulls in a general web-proxy capability set whose inspection expectations contradict the Optimize category's purpose.
- ☐ **Branch office to agency campus** — branch access to internal resources. Applies to the site's other traffic and is unchanged by this design; recorded here for completeness.

**Board rationale where the determination differs from the proposal:** *[record here]*

#### Trust zone and enforcement point

The Reference Architecture says PEPs may be devices, tools, services or applications and that enforcement "may occur at any point between endpoints."[^aA-ra] Record the definition this design adopts:

| Field | Value |
|---|---|
| Trust zone | *[Branch site as defined: scope and boundary]* |
| PEP location | *[Device and position relative to the zone]* |
| Prior state | Enforcement at the campus PEP, reached by backhaul |
| Reversion | Returns enforcement to the campus PEP; the prior posture is restored, not degraded |

### B2 — Capability transfer register

One row per PEP capability group in the catalog: **twelve in version 3.3**. Complete every row. A blank row is a gap, not an omission, and this review treats it as one.

The **control reference** column is the agency's own NIST SP 800-53 mapping, not a catalog citation. The entries shown are proposed; confirm or replace them.

| PEP capability group | What branch direct internet access changes | Where enforcement now sits | Control reference (proposed) | Status |
|---|---|---|---|---|
| Files | SharePoint and OneDrive transfers bypass campus file inspection when steered locally. | *[Defender for Office 365 Safe Attachments; Purview DLP; endpoint DLP]* | SI-3, AC-4 | Enforced tenant-side |
| Email | Exchange Online client traffic steered locally no longer passes campus email inspection on that path. | *[Exchange Online Protection; Defender for Office 365 policies in force]* | SI-3, SI-8, AC-4 | Enforced tenant-side |
| Web | Optimize traffic no longer crosses the campus web PEP. What that punctures, named: no inline malicious-code inspection (SI-3); no visibility into encrypted content (SI-4(10), where selected); no CASB information-flow enforcement (AC-4); and network audit records holding the five-tuple plus steering metadata rather than user, device, application, action and data type (AU-3). SC-8 isn't punctured: the flows carry TLS or SRTP, and the overlay encrypts the rest. | *[Identity, service and endpoint controls per memo clause 6]* | SI-3, SI-4(10), AC-4, AU-3/AU-12; sought under SC-7(4) | **Referred to AO** |
| Networking | Enforcement moves to the branch edge: NAT, access control lists and the SD-WAN policy that governs local egress. The steering log is the SC-7(4) enforcement evidence for the Web row. | *[Branch device and policy; steering log retention and location]* | SC-7, SC-7(4), AC-4 | Enforced at branch |
| Resiliency | Microsoft 365 reachability at the site now depends on the local circuit. Failure behavior must be defined, not incidental. | *[Failback to backhaul on loss of local access: state the trigger and timing]* | SC-5, SC-6, CP-8 | *[status]* |
| Domain Name System | Resolution moves local. DNS security enforcement on the campus path doesn't follow automatically, and resolver location also decides which Microsoft front door the site reaches. | *[Agency resolver as first hop at the branch; Protective DNS upstream]* | SC-21, SC-22 (SC-20 only where the branch hosts authoritative zones) | *[status]* |
| Intrusion Detection | Branch egress isn't seen by the sensors covering campus egress. | *[Branch on-box inspection or equivalent, or state the coverage gap plainly]* | SI-4, SI-4(4) | *[status]* |
| Enterprise | Identity enforcement doesn't change with routing but becomes the primary control on a less-inspected path. **Tenant restrictions v2 data-plane signaling has to come from the endpoint**: proxy header injection protects only sign-in, and Windows device signaling is the only documented path to the SharePoint and Exchange data plane. Global Secure Access is available in GCC but gives data-plane protection for Microsoft Graph only, and isn't supported in GCC High or DoD.[^aA-trv2][^aA-gsa] See memo clause 4. | *[Conditional Access policies; cross-tenant access policy; device-side TRv2 configuration and the population it doesn't cover]* | IA-2, AC-2, AC-6, AC-4 | Enforced tenant-side |
| Unified Communications and Collaboration | Teams media leaves locally. It's one of the workloads this design exists to improve, and squarely in scope. | *[UCC controls applying to Teams media at the branch]* | SC-8, SC-8(1), AC-4 | *[status]* |
| Data Protection | Content leaving by branch egress is outside campus data-protection enforcement on that path. | *[Purview DLP coverage; sensitivity labeling; endpoint DLP]* | AC-4, SC-8 (SC-28 only if the agency maps labeling at rest to it) | *[status]* |
| Services | Catalog Table 14: active content mitigation, data loss prevention, protocol compliance enforcement, malicious content filtering, access control. Several restate at the service layer what the Web row gives up at the network layer, so this row is where the exemption is answered rather than repeated. | *[Assess each against the design]* | *[map from catalog]* | *[status]* |
| Identity | Catalog Table 15: adaptive authentication, service identity, entitlement inventory, secrets management, behavioral baselining, enterprise identity, credential and access management, multifactor authentication and continuous authentication. Overlaps Enterprise, so record the split your agency uses. | *[Assess each; note which carry the tenant-restrictions signaling from the Enterprise row]* | *[map from catalog]* | *[status]* |

::: {.callout-warning}
## The group list is a property of the catalog revision, not of TIC 3.0
The list has grown, and not in the revision you might assume. The catalog's revision history records that **Services and Identity were added as groups in version 3.0 (April 2023)**, bringing the total to twelve. Version 3.1 (December 2023) removed the EINSTEIN 3 Accelerated email protections; version 3.2 (December 2024) remapped capabilities to NIST CSF 2.0 and added Govern; version 3.3 (July 2025) removed an NCPS reference in Appendix A; and the September 2026 publication changed only footnote links.[^aA-scc] A table copied forward from a pre-3.0 revision is two groups short and still reads as complete, which is why the revision must be named wherever the list is used.
:::

#### Universal security capabilities

**These aren't PEP capability groups and don't belong in the table above.** The catalog expects universal capabilities to apply in every use case, whereas PEP capabilities "may or may not be applicable based on the use case scope."[^aA-scc] Conflating the two is a common way for a capability-transfer register to look complete while leaving the enterprise layer unexamined.

Most universal capabilities are unchanged by a routing decision. Three aren't, and this review records them:

| Universal capability | What branch direct internet access changes | Where enforcement now sits | Status |
|---|---|---|---|
| Central Log Management with Analysis (`3.UNI.CLMAN`) | Branch egress doesn't cross the sensors that observed campus egress, so the log sources feeding central analysis change. | *[Branch PEP log sources; collection path; retention]* | *[status]* |
| Auditing and Accounting (`3.UNI.AACCO`) | Audit record content thins on the bypassed flows, as recorded in the Web row. | *[AU-3 content actually captured at the branch; CISA reporting arrangement]* | *[status]* |
| Policy Enforcement Parity (`3.UNI.PEPAR`) | **The capability this design is most in tension with.** The catalog defines it as "consistently applying security protections and other policies, independent of the communication mechanism, forwarding path, or endpoints used,"[^aA-scc] and a per-category exemption at one set of sites is, on its face, a departure from that. The SC-7(4) exception is the mechanism for recording the departure rather than denying it. | *[Statement of how parity is maintained, or the bounded departure and its review cadence]* | *[status]* |

Enumerate the remaining universal capabilities from catalog Table 3 and confirm each is genuinely unaffected before signing. "Unchanged by routing" is an assertion this review makes, not a default.

#### Status values

| Status | Meaning |
|---|---|
| Enforced at branch | The capability is delivered by a device or policy at the branch trust zone boundary. |
| Enforced tenant-side | Delivered by a service-side or endpoint control rather than a network device. A legitimate answer where the control is named and verifiable. |
| Referred to AO | Not transferred; a decision is sought in the covering memo. Permitted only for the item the memo actually covers. |
| Gap | Neither transferred nor referred. **A gap blocks sign-off.** Resolve it, or convert it to an explicit referral, before this determination is signed. |

### B3 — Telemetry

The Branch Office Use Case says that as branches connect directly to external services, "agencies must preserve CISA visibility through information sharing," and points agencies to their TIC delegates and to CISA points of contact for services such as the Comprehensive Log Aggregation Warehouse (CLAW), CDM and Protective DNS. Its July 2025 revision replaced the earlier NCPS references with CISA services.[^aA-branch]

| Field | Value |
|---|---|
| Reporting arrangement | *[Arrangement agreed with the agency's TIC delegates and CISA services, e.g. CLAW]* |
| Sources | *[Branch PEP log sources feeding the arrangement]* |
| Verified | *[Date telemetry confirmed arriving, per site or per arrangement]* |
| Gap during pilot | *[If any, state it; don't leave blank]* |

Telemetry reaching CISA is a condition of fleet rollout, not of pilot cutover. A pilot that runs without it should say so here rather than leave the reviewer to infer it.

### Architecture review determination

- ☐ **Conformant** — classification at B1 confirmed; capability transfer at B2 complete with no gaps.
- ☐ **Conformant with conditions** — conditions stated below; each must close before the site enters scope.
- ☐ **Not conformant** — basis stated below. The design returns for rework before it goes to the authorizing official.

**Conditions or basis:** *[record here]*

By signing, the review asserts that the classification at B1 is correct for this traffic; that every PEP capability group in the catalog revision named in the header has been assessed and recorded at B2, along with the universal capabilities; that the control references at B2 are the agency's considered mapping, not placeholders; and that the only capability forgone is the one referred to the authorizing official as an SC-7(4) exception. It asserts nothing about whether that exception should be granted.

| Signature block | |
|---|---|
| Architecture review chair — signature | |
| Date | |
| Concurrence — ISSO | |
| Next review or re-assessment trigger | |

::: {.callout-note}
## Re-assessment triggers
This determination is bound to Attachment A at the version cited above. Re-assess if sites are added; the exemption scope widens beyond the Optimize category (for example, to Allow); a control named at B2 changes or lapses, including device-side tenant restrictions or the arrival of a device or browser population it doesn't cover; Microsoft re-categorizes an endpoint set into or out of Optimize; the catalog is revised in a way that changes the group list; or the telemetry arrangement at B3 changes.
:::

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 13 — Sequencing, Cost and Evidence](13-sequencing-cost-and-evidence.md) · [Book index](index.md) · [Next: Appendix B — Requirements Mapping and Sources →](appendix-b-requirements-mapping.md)
:::

[^aA-rfc5737]: Internet Engineering Task Force, RFC 5737, *IPv4 Address Blocks Reserved for Documentation* (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24), <https://www.rfc-editor.org/rfc/rfc5737.html> (accessed Oct 21, 2026).
[^aA-rfc3849]: Internet Engineering Task Force, RFC 3849, *IPv6 Address Prefix Reserved for Documentation* (2001:DB8::/32), <https://www.rfc-editor.org/rfc/rfc3849.html> (accessed Oct 21, 2026).
[^aA-sp80053]: National Institute of Standards and Technology, SP 800-53 Rev. 5 control catalog (OSCAL), control SC-7(4) parts (c)–(e), <https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json> (accessed Oct 21, 2026).
[^aA-netconn]: Microsoft Learn, "Network connectivity in the Microsoft 365 Admin Center" (supports WW Commercial and China tenants, not GCC Moderate, GCC High or DoD), <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-overview?view=o365-worldwide> (accessed Oct 21, 2026).
[^aA-inr]: Microsoft Learn, "Microsoft 365 informed network routing" (WW Commercial only), <https://learn.microsoft.com/en-us/microsoft-365/enterprise/office-365-network-mac-perf-cpe?view=o365-worldwide> (accessed Oct 21, 2026).
[^aA-ww]: Microsoft Learn, "Microsoft 365 URLs and IP address ranges" (Worldwide (+GCC), last updated 08/14/2026; Optimize endpoint sets 1, 11 and 31; monthly updates with 30 days' notice), <https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges?view=o365-worldwide> (accessed Oct 21, 2026).
[^aA-fr]: FedRAMP Marketplace dataset, Cisco ThousandEyes for Government (FR2523656707): FedRAMP Certified, Class C (Moderate), <https://www.fedramp.gov/marketplace/products.json> (accessed Oct 21, 2026).
[^aA-trv2]: Microsoft Learn, "Configure tenant restrictions v2," supported scenarios, Windows device enforcement and App Control for Business, <https://learn.microsoft.com/en-us/entra/external-id/tenant-restrictions-v2> (accessed Oct 21, 2026).
[^aA-gsa]: Microsoft Learn, "Known limitations for Global Secure Access," section "Global Secure Access In Government Cloud limitations," <https://learn.microsoft.com/en-us/entra/global-secure-access/reference-current-known-limitations> (accessed Oct 21, 2026).
[^aA-scc]: Cybersecurity and Infrastructure Security Agency, *TIC 3.0 Core Guidance Volume 3: Security Capabilities Catalog*, Version 3.3, publication September 2026, Table 1 (Revision History), Table 3 and Section 4.2, <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Security_Capabilities_Catalogs_September_2026_17.pdf> (accessed Oct 21, 2026).
[^aA-branch]: Cybersecurity and Infrastructure Security Agency, *Trusted Internet Connections 3.0 Branch Office Use Case*, Version 3.0, publication September 2026, Revision History, Sections 3, 6.1 and 8, <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Branch_Office_Use_September_2026_6.pdf> (accessed Oct 21, 2026).
[^aA-ra]: Cybersecurity and Infrastructure Security Agency, *TIC 3.0 Core Guidance Volume 2: Reference Architecture*, Version 1.2, publication September 2026, Section 4.2, <https://www.cisa.gov/sites/default/files/2026-09/TIC_3.0_Reference_Architecture_September_2026_14.pdf> (accessed Oct 21, 2026).
