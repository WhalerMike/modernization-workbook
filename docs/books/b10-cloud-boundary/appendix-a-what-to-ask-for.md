---
title: "Appendix A — What to Ask a Cloud Provider For"
description: "Specific, evidenced requests an agency can put to a cloud provider about its government offering, each tied to a FedRAMP 2026 rule or to the provider's own documentation, with Microsoft 365 GCC as the worked example: a machine-readable exclusion list, a named exception path per feature, the network observability layer, a FedRAMP-compatible trust center, the relationship between same-named packages, and more."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b10-cloud-boundary
book: B10
part: Appendix
series-order: 90
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Appendix A — What to Ask a Cloud Provider For

*"Give us commercial parity" can't be answered; a specific question tied to a published rule or a published exclusion can.*

::: {.callout-note}
## In this appendix
A set of requests an agency can put to a cloud provider about its government offering, each with the rule or documented fact it rests on and what a useful answer looks like. Microsoft 365 GCC is the worked example throughout, because [Chapter 04](04-gcc-and-the-feature-gap.md) documents its gaps, but every request applies to any provider. [Chapter 09](09-equivalents-and-exceptions.md) covers what the agency does while it waits for an answer, and [Chapter 11](11-the-authorization-package.md) covers where the answers go in the authorization package.
:::

## How to make the ask

The productive conversation with a provider isn't "grant us commercial parity." It is a short list of questions, each of which the provider can answer yes, no, or with a date. Three habits make a request hard to deflect:

1. **Name the item.** One feature, one package, one rule. "GCC withholds telemetry" invites a general reply; "the admin center's network connectivity layer is documented as unavailable in GCC, GCC High and DoD"[^aA-netconn] doesn't.
2. **Cite the basis.** Quote the provider's own documentation or the FedRAMP rule, with a link. Microsoft's ExpressRoute for Microsoft 365 process is the model: Microsoft reviews each request and authorizes it only "when a customer's regulatory requirement mandates direct connectivity," and asks the customer for "the text excerpt and web link to the regulation."[^aA-er] A provider that uses that standard for its own exceptions can't object to it being used in return.
3. **Ask for data, not documents.** The 2026 FedRAMP rules make much of a provider's certification data machine-readable by requirement.[^aA-cds][^aA-scn] Ask for the feed and its documentation, not a PDF.

Each request below follows the same layout: what to ask, why the provider can answer it, and what a useful answer looks like.

## Requests about the offering's scope and gaps

### A1. Publish the per-feature exclusion list as data

**Ask.** Publish, for each government environment, the list of features that are unavailable or limited compared with the commercial service, as a machine-readable artifact with a stable identifier per feature and a date per entry.

**Basis.** The exclusions already exist as individual notes in the provider's documentation: Microsoft states them page by page for the admin center's network connectivity, Adoption Score, informed network routing, the Office 365 CDN, Windows release health and others ([Chapter 04](04-gcc-and-the-feature-gap.md)). The gap is that they can't be enumerated without reading every page. FedRAMP already requires a related list: a public list of the services in the offering and their security categories, complete enough for a customer "to determine which services are and are not included in the FedRAMP Minimum Assessment Scope without requesting access to underlying FedRAMP Certification Data" (CDS-CSO-SVC), with public offering information in human-readable and JSON form (CDS-CSO-PUB).[^aA-cds] That rule covers services, not features within them, so this request extends a list the provider already has to keep.

**A useful answer.** A JSON or CSV file, updated on a stated cadence, that an agency can diff month to month and load into its feature-gap register.

### A2. Name the exception path per feature

**Ask.** For each excluded feature, state whether any exception process exists, and if one does, what requirement (quoted, with a link) would move it, as ExpressRoute for Microsoft 365 already does.

**Basis.** The ExpressRoute process shows that feature-level exceptions exist and that the provider can describe their trigger precisely.[^aA-er] Note what that trigger is: a regulatory requirement that mandates the capability. FedRAMP certification and FISMA don't supply that hook by themselves, so an agency shouldn't assume an exception is available because it is a federal customer. [Chapter 09](09-equivalents-and-exceptions.md) walks through the ExpressRoute case.

**A useful answer.** Per feature: "no exception path," or "exception path exists; the trigger is X; the request goes to Y."

### A3. Restore the network observability layer, or publish the obstacle

**Ask.** Make the Microsoft 365 admin center's network connectivity layer available in GCC: network assessments per location, network insights, network provider attribution and the Network Provider Index. If it can't be, publish the specific obstacle (which data, which processing location, which control) that prevents it.

**Basis.** Microsoft documents the feature as supporting commercial and 21Vianet tenants "but not GCC Moderate, GCC High, or DoD."[^aA-netconn] It is the broadest documented loss for network decisions: it is the source of the per-location assessments and of the attribution of performance to named network providers, classified as ISP, Overlay ("VPN, Cloud Proxy, SD-WAN, and SASE") or Corporate.[^aA-npp] Without it, an agency funds its own measurement to choose between transport and SASE providers ([Book 09 Chapter 12](../b09-network/12-microsoft-365-traffic.md)).

**A useful answer.** A target date for GCC, or a named obstacle specific enough that the agency can judge whether a compensating capability or an alternative path is the better use of its money.

### A4. State what each environment's certification would and wouldn't change

**Ask.** Explain the relationship between packages that share a name. For Microsoft 365 GCC: does `MSO365MTA` (Class D, FedRAMP In Process) supersede `MSO365MT` (Class C, FedRAMP Certified), run alongside it, or get withdrawn; what is its target date; and which of the documented GCC exclusions, if any, a Class D certification would lift.

**Basis.** The Marketplace shows two packages with the identical offering name, one Certified at Class C and one In Process at Class D, and doesn't state how they relate.[^aA-fr] FedRAMP's rules say a change of certification class "requires a new assessment and cannot be done under the Significant Change Notification rules,"[^aA-scn] which is consistent with a separate package but doesn't explain it. Microsoft's own service description says GCC "supports" FedRAMP "at a High Impact level,"[^aA-gccsd] which the Class C Marketplace record doesn't match.

**A useful answer.** A plain statement of the plan and its date, and a per-exclusion answer to "would Class D change this?" An agency planning against a Moderate ceiling needs that answer before it commissions a compensating capability it may not need, or defers one it will.

### A5. Say which delivered software is outside the certified offering

**Ask.** List the agents, clients and other software the provider delivers for installation on agency systems, and state for each whether it is operated in a shared-responsibility model (and so inside the certified offering) or delivered to the agency to operate (and so outside FedRAMP's scope).

**Basis.** The Minimum Assessment Scope rules say software "delivered separately for installation on agency systems and not operated in a shared responsibility model" is "entirely outside the scope of FedRAMP."[^aA-mas] Whatever falls outside has to be covered by the agency's own authorization ([Chapter 03](03-what-changed-at-fedramp.md)).

**A useful answer.** A list the agency can reconcile against its own software inventory, one line per component.

## Requests about evidence and change

### A6. Provide a FedRAMP-compatible trust center with programmatic access

**Ask.** Provide certification data through a FedRAMP-compatible trust center with documented programmatic access, just-in-time access provisioning, and self-service access management for agency users and systems.

**Basis.** The 2026 rules require providers to "use a FedRAMP-compatible trust center to store and share FedRAMP Certification Data" (CDS-CSO-UTC), and require trust centers to "provide documented programmatic access to all FedRAMP Certification Data, including programmatic access to human-readable materials" (CDS-TRC-PAC), to share it "without interruption" (CDS-TRC-USH) and to log access for at least six months (CDS-TRC-ACL).[^aA-cds] On October 21, 2026, the Marketplace data showed a trust-center entry for 110 of its 781 listings and none for the three Microsoft 365 government packages.[^aA-fr]

**A useful answer.** A trust-center URL, API documentation, and an access process the agency's governance tooling can use without a human request each time.

### A7. Deliver Significant Change Notifications as a feed

**Ask.** Deliver Significant Change Notifications in JSON through a documented mechanism the agency can subscribe to, with the 12-month history the rules require.

**Basis.** Providers must make all notifications and related audit records available "in human-readable and JSON formats" (SCN-CSO-HRM) and keep 12 months of them with the certification data (SCN-CSO-HIS); the notification mechanism must be documented in the certification package (SCN-CSO-NOM).[^aA-scn] Agencies, for their part, must review ongoing certification reports for changes that affect their own authorization.[^aA-crjson]

**A useful answer.** An endpoint or subscription, a schema, and a statement of which changes the provider classes as routine recurring and so won't notify.

### A8. Document the cryptographic modules per service

**Ask.** Provide the list of cryptographic modules used to protect federal customer data in each service, with their CMVP validation status, and the defaults applied to agency tenants.

**Basis.** CMU-CSO-CMD requires that documentation; CMU-CSO-UVM makes validated modules a SHOULD at Class C and a MUST at Class D; CMU-CSO-CAT asks providers to configure agency tenants by default to use validated modules where available.[^aA-cmu] NIST moved all FIPS 140-2 certificates to the Historical List on September 22, 2026 ([Book 09 Chapter 03](../b09-network/03-what-tic-3-requires.md)), so the validation status of each module is now a live question.

**A useful answer.** A per-service module list with certificate numbers and the tenant defaults, in machine-readable form.

## Summary

| # | Request | Rule or documented basis |
|---|---|---|
| A1 | Per-feature exclusion list as data | Provider's per-feature notes; extends CDS-CSO-SVC and CDS-CSO-PUB |
| A2 | Exception path per feature | ExpressRoute for Microsoft 365 authorization process |
| A3 | Network observability layer in GCC, or the named obstacle | Admin center network connectivity documented as not in GCC |
| A4 | What each certification would and wouldn't change | Same-named packages on the Marketplace; class change needs a new assessment |
| A5 | Delivered software outside the offering | MAS-CSO-IIR guidance on agents and clients |
| A6 | FedRAMP-compatible trust center with programmatic access | CDS-CSO-UTC; CDS-TRC-USH, -PAC, -ACL |
| A7 | Change notifications as a feed | SCN-CSO-HRM, -HIS, -NOM |
| A8 | Cryptographic modules per service | CMU-CSO-CMD, -UVM, -CAT |

Each request is answerable, none needs a boundary argument, and A1, A5, A6, A7 and A8 rest on obligations the 2026 rules already place on providers. Record each request, its date and the provider's answer in the authorization package ([Chapter 11](11-the-authorization-package.md)): a documented "no" is evidence too. The research page [Federal HR 2.0 Across Agencies and Boundaries](../../research/hr2-shared-governance-fedramp-boundary.md#questions-to-ask) works through A6 and A8 against one Rev5 SaaS platform, with the questions an agency would put to its provider.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 11 — Evidencing the Boundary in the Authorization Package](11-the-authorization-package.md) · [Book index](index.md) · [Next: Appendix B — Platform Host Interface Reference →](appendix-b-platform-host-interfaces.md)
:::

[^aA-netconn]: Microsoft Learn, "Network connectivity in the Microsoft 365 Admin Center," <https://learn.microsoft.com/microsoft-365/enterprise/office-365-network-mac-perf-overview?view=o365-worldwide> (accessed Oct 21, 2026).
[^aA-er]: Microsoft Learn, "Assessing Enterprise network last mile" (note on ExpressRoute for Microsoft 365 authorization), <https://learn.microsoft.com/microsoft-365/enterprise/assessing-network-connectivity?view=o365-worldwide> (accessed Oct 21, 2026).
[^aA-cds]: FedRAMP, "Certification Data Sharing," *FedRAMP Consolidated Rules for 2026* (CDS-CSO-PUB, CDS-CSO-SVC, CDS-CSO-UTC, CDS-TRC-USH, -PAC, -ACL), <https://www.fedramp.gov/2026/reference/certification-data-sharing/> (accessed Oct 21, 2026).
[^aA-scn]: FedRAMP, "Significant Change Notification," *FedRAMP Consolidated Rules for 2026* (SCN-CSO-EVA, -HIS, -HRM, -NOM), <https://www.fedramp.gov/2026/reference/significant-change-notification/> (accessed Oct 21, 2026).
[^aA-npp]: Microsoft Learn, "Network provider details and connectivity attribution in the Microsoft 365 Admin Center," <https://learn.microsoft.com/microsoft-365/enterprise/office-365-network-mac-perf-nppdetails?view=o365-worldwide> (accessed Oct 21, 2026).
[^aA-fr]: FedRAMP Marketplace product data, <https://www.fedramp.gov/marketplace/products.json>, dataset last changed October 21, 2026 (accessed Oct 21, 2026). Records MSO365MT, MSO365MTA and FR1824057433; count of listings with a populated `trust_center` field computed from the same file.
[^aA-gccsd]: Microsoft Learn, "Office 365 GCC" (service description), <https://learn.microsoft.com/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/gcc> (accessed Oct 21, 2026).
[^aA-mas]: FedRAMP, "Minimum Assessment Scope," *FedRAMP Consolidated Rules for 2026* (MAS-CSO-IIR and its notes), <https://www.fedramp.gov/2026/reference/minimum-assessment-scope/> (accessed Oct 21, 2026).
[^aA-crjson]: FedRAMP, *FedRAMP Consolidated Rules for 2026*, machine-readable ruleset `fedramp-consolidated-rules.json`, version 2026.10.13.01 (agency rule CCM-AGM-ROR), <https://github.com/FedRAMP/rules> (accessed Oct 21, 2026).
[^aA-cmu]: FedRAMP, "Cryptographic Module Use," *FedRAMP Consolidated Rules for 2026* (CMU-CSO-CMD, CMU-CSO-UVM, CMU-CSO-CAT), <https://www.fedramp.gov/2026/reference/cryptographic-module-use/> (accessed Oct 21, 2026).
