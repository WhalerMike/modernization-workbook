---
title: "Chapter 04 — GCC and the Commercial Feature Gap"
description: "What Microsoft 365 GCC is in Microsoft's own documentation, why its feature gaps are published one feature at a time, what agencies verifiably lose (the admin center's network connectivity layer above all), the two Microsoft 365 GCC packages on the FedRAMP Marketplace including a second one pursuing Class D (High), and why impact level and feature availability are different axes."
doc-type: workbook-chapter
audience: [Executive, Technical, Customer]
family: b10-cloud-boundary
book: B10
part: What
series-order: 4
status: baseline
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
---

# Chapter 04 — GCC and the Commercial Feature Gap

*GCC isn't a compliance perimeter that dims the commercial service; it is the commercial footprint with a list of features left out, and a list can be read, argued and asked about one line at a time.*

::: {.callout-note}
## In this chapter
How Microsoft itself describes GCC; why its feature gaps form a list rather than a perimeter; what an agency in GCC verifiably loses, starting with the network connectivity layer of the Microsoft 365 admin center; the two Microsoft 365 GCC packages on the FedRAMP Marketplace, including a second one now pursuing Class D (High); and why a higher certification class would not by itself bring the missing features back. [Chapter 09](09-equivalents-and-exceptions.md) covers what to do about each gap.
:::

Federal reasoning about Microsoft 365 Government Community Cloud (GCC) usually starts from a picture: a compliance boundary drawn around the commercial service that filters out telemetry and withholds features for accreditation reasons. If that picture were right, an agency would have two moves: accept the boundary, or leave the service. Microsoft's documentation doesn't describe GCC that way. It describes a service that shares the commercial network footprint, with specific features excluded and each exclusion published in its own note. That is a different problem with different remedies, because a published list of exclusions can be inventoried, prioritized and argued feature by feature.

This chapter uses only what Microsoft and FedRAMP publish. It builds the case on documented exclusions because, for an agency arguing with a provider or an assessor, a documented exclusion is stronger evidence than any inference drawn from a boundary model.

## What GCC is, in Microsoft's own words

Three documented facts set the shape:

| Documented fact | What it means |
|---|---|
| GCC has no endpoint list of its own: Microsoft publishes one list for "Microsoft 365 Worldwide (+GCC)"[^c04-endpoints] | GCC users reach the same network endpoints as commercial users; it isn't a separate network regime |
| "Office 365 and Office 365 GCC are paired with Microsoft Entra ID in Azure"[^c04-azfeat] | Integration with Azure services follows the identity pairing: GCC integrates with commercial Azure |
| The GCC service description says "Office 365 GCC operates in conjunction with Azure Public Cloud," and that GCC customer support is "not included in the service accreditation boundary"[^c04-gccsd] | Even inside GCC, some parts of the service relationship sit outside the accredited scope, and Microsoft says so per item |

One documented fact points the other way and is worth knowing before a reviewer raises it. The FedRAMP Marketplace description of the GCC package says that "M365 GCC leverages Azure Government as the IaaS/PaaS for the underlying infrastructure and hardware."[^c04-fr] That is a statement about the infrastructure the package inherits controls from. It doesn't change the endpoint list or the Entra ID pairing an agency designs against, but an agency's system security plan should cite both statements and not paraphrase either into "GCC runs on commercial Azure" or "GCC runs on Azure Government."

### The gaps form a list

Microsoft publishes feature availability for government plans per product and per feature. A few examples from its own pages:

| Feature | Commercial | GCC |
|---|---|---|
| Network connectivity in the Microsoft 365 admin center[^c04-netconn] | Yes | No |
| Adoption Score[^c04-adoption] | Yes | No |
| Office 365 Content Delivery Network for SharePoint[^c04-cdn] | Yes | No |
| Microsoft 365 informed network routing[^c04-inr] | Yes | No |

![Feature gaps are published one feature at a time, and the agency's register records each one with its citation.](../../images/diagrams/b10-cloud-boundary/svg/ch04-exclusions-both-ways.svg){#fig-ch04-exclusions-both-ways fig-alt="At the top, a slate box: Worldwide commercial, the full feature set; GCC rides the same Worldwide endpoints and gaps are documented feature by feature. An arrow leads down to a red box, missing in GCC: admin center network connectivity, Adoption Score, Office 365 CDN, informed network routing. It leads to a violet box: the agency's register, one row per feature with the citation, which feeds the compensate, exception or alternative-path decision in Chapter 09."}

The two diagnoses lead to different remedies. If GCC were a boundary, the only move would be to accept it or leave it. Because GCC is the worldwide service with an enumerated set of exclusions, each exclusion is its own question with its own answer, and some answers are obtainable: a compensating capability inside the boundary, a documented exception, or an alternative path ([Chapter 09](09-equivalents-and-exceptions.md) and [Chapter 10](10-alternative-collaboration-paths.md)).

## What agencies verifiably lose

The most consequential single exclusion isn't a telemetry detail. It is the whole network connectivity layer of the Microsoft 365 admin center, which Microsoft documents as supporting tenants in WW Commercial and China (operated by 21Vianet) but not GCC Moderate.[^c04-netconn] A commercial tenant gets all of the following at no extra license cost (the only requirement is a license that provides access to the admin center).[^c04-netconn]

- **A network assessment for the tenant and for each location,** a points value from 0 to 100 averaging TCP latency, download speed and UDP connection quality, compiled once a day. Microsoft treats 80 as the healthy baseline, "above which you shouldn't expect to receive regular user complaints."[^c04-score] Each location's assessment is compared with other Microsoft 365 customers in the same city, and history can be reported for up to two years.[^c04-score]
- **A per-location view of the network perimeter:** the egress point, the in-use and optimal Exchange and SharePoint front doors, the DNS recursive resolver and any proxy, with an estimated latency improvement calculated against other organizations in the same city.[^c04-netconn]
- **Network insights,** including detection of TLS interception, where users' connections present certificates not issued by Microsoft 365, with service health notifications.[^c04-insights]
- **Network provider attribution.** The admin center identifies each network provider between users and Microsoft's network as ISP, Overlay ("VPN, Cloud Proxy, SD-WAN, and SASE") or Corporate, and attributes performance and availability to each: Exchange, SharePoint and Teams assessments, SharePoint throughput, Exchange latency, and Teams packet loss, jitter and latency. A Network Provider Index chart, currently for the United States only, ranks the highest-performing providers in the same state.[^c04-npp]

An agency choosing between SASE or transport providers in a commercial tenant has comparative evidence about those providers, produced by Microsoft, in its own admin center. The same agency in GCC has none of it, and has to fund its own measurement to reach a decision a commercial enterprise makes from a dashboard. [Book 09 Chapter 12](../b09-network/12-microsoft-365-traffic.md) covers how a GCC agency steers and measures Microsoft 365 traffic without it.

Some measurement does remain. Microsoft's network connectivity test tool lists US Government (GCC) as a supported version, with public report sharing disabled.[^c04-tool] Its insights are run locally from the location being tested rather than aggregated daily from the tenant, but they include, for example, a flag when the network egress is more than 500 miles from the user's office, "since that's likely to increase the TCP latency by more than 25 ms."[^c04-tool] That insight comes from the test tool, which GCC can use, not from the admin center's network connectivity page.

Alongside that layer, other documented exclusions follow the same pattern:

- **Adoption Score**, the admin center's usage-and-readiness report, isn't available in GCC tenants.[^c04-adoption] Microsoft's page describes five scored categories (six with Copilot); in GCC the whole report is unavailable, not individual categories.
- **Informed network routing**, the feedback channel that lets a supported SD-WAN steer Microsoft 365 traffic between circuits, supports tenants in the WW Commercial cloud and not GCC Moderate.[^c04-inr] [Book 08 Appendix C](../b08-ddi/appendix-c-applicability.md) and [Book 09 Chapter 12](../b09-network/12-microsoft-365-traffic.md) record the same limit.
- **The Office 365 CDN** for SharePoint static assets "is only available to tenants in the production (worldwide) cloud"; tenants in the US Government, China and Germany clouds don't support it.[^c04-cdn]

::: {.callout-important}
## Build the register on documented exclusions only
Every row in an agency's exclusion register should carry a citation to the provider's own statement that the feature is unavailable in its environment. Gaps inferred from a boundary model, or from a feature that "seems" to return nothing, belong in the register marked as inferred, and stay out of any claim until they are tested ([Chapter 02](02-the-invisible-boundary.md)). An argument built on inferred rows won't survive a reviewer holding the provider's documentation; one built on cited rows can't be dismissed.
:::

## A note on names

"GCC Moderate" isn't a Microsoft offering name. The offering is Government Community Cloud, and its Marketplace package is Microsoft 365 Government Community Cloud & Supporting Services, `MSO365MT`.[^c04-fr] Microsoft does use the phrase for the environment, as the network connectivity and informed network routing pages above show,[^c04-netconn][^c04-inr] and the workbook's other books follow that usage. Writing "GCC Moderate" for the environment is fine. Treating it as the name of a distinct product or a distinct FedRAMP certification isn't, because there is neither.

## Microsoft is pursuing High for GCC, and what that doesn't change

The FedRAMP Marketplace carries two Microsoft 365 GCC packages that are routinely run together. Read from FedRAMP's Marketplace dataset on October 21, 2026:[^c04-fr]

| Package | Offering | Status | Class |
|---|---|---|---|
| `MSO365MT` | Microsoft 365 Government Community Cloud & Supporting Services | FedRAMP Certified (certification date November 20, 2014); 100 authorizations, 91 agencies listed | Class C (Moderate) |
| `MSO365MTA` | Microsoft 365 Government Community Cloud & Supporting Services (the identical name) | FedRAMP In Process, Initial Implementation; 0 authorizations | Class D (High) |

![The two Microsoft 365 GCC packages on the FedRAMP Marketplace, and the network connectivity exclusion that applies to both.](../../images/diagrams/b10-cloud-boundary/svg/ch04-three-packages.svg){#fig-ch04-three-packages fig-alt="Two boxes in a row. Green, MSO365MT, Microsoft 365 Government Community Cloud and Supporting Services: FedRAMP Certified, Class C Moderate, 100 authorizations, Worldwide endpoint set, paired with Entra ID in Azure. Amber, MSO365MTA, same name as MSO365MT: FedRAMP In Process, Class D High, Initial Implementation, 0 authorizations, relationship to MSO365MT not stated. Dashed red lines from both lead to a red box below: feature availability is a separate axis; admin center network connectivity is documented per feature as not in GCC, so a higher class for GCC would not by itself bring it back."}

`MSO365MT` is the GCC service most civilian agencies run, certified at Class C. It isn't new. `MSO365MTA` is. It carries the same offering name and the same service description as the certified GCC package, at Class D, with the same independent assessor; its Marketplace history starts with status changes on July 1 and July 20, 2026, and records another on October 19, 2026.[^c04-fr]

::: {.callout-note}
## Fact and inference, separated
The **fact** is the table above, read from FedRAMP's own dataset. The **inference** is that `MSO365MTA` is an effort to certify the GCC service at High, running in parallel with its existing Class C certification. That is the straightforward reading of a same-named Class D package in Initial Implementation, and it is consistent with FedRAMP's rule that a change of certification class "requires a new assessment and cannot be done under the Significant Change Notification rules."[^c04-scn] But the Marketplace doesn't state the relationship between two packages sharing a name, or whether one will supersede the other, run alongside it, or be withdrawn. Treat the reading as a question to put to Microsoft ([Appendix A](appendix-a-what-to-ask-for.md)), not as a roadmap commitment.
:::

Microsoft's own documentation adds a complication. Its GCC service description says that "Office 365 Government supports the Federal Risk and Authorization Management Program (FedRAMP) accreditation at a High Impact level,"[^c04-gccsd] and its Azure feature-availability page says the GCC environment "helps customers comply with US government requirements, including FedRAMP High."[^c04-azfeat] The Marketplace record for the certified GCC package says Class C (Moderate).[^c04-fr] For an authorization package, cite the Marketplace record and the package itself, and record the discrepancy; [Book 08 Appendix C](../b08-ddi/appendix-c-applicability.md) takes the same position.

**Why the High package matters.** A great deal of federal "we can't have that in GCC" reasoning rests on an assumed Moderate ceiling. If GCC is certified at Class D, that premise has a shelf life, and a multi-year architecture that hard-codes Moderate (in a schema value, a control-parameter narrative or an acquisition assumption) is building on a foundation that may move. FedRAMP's guidance already loosens the link from the other side: an agency may use a certification package for a cloud service "at any security category they deem appropriate following the Risk Management Framework."[^c04-ntc0004]

## Impact level and feature availability are different axes

Raising the certification class doesn't restore excluded features. The exclusions in this chapter are product decisions published per feature, not consequences of an impact level. Microsoft documents the admin center's network connectivity layer as unavailable in GCC on the feature's own page, by environment, with no reference to a certification class.[^c04-netconn] A Class D certification for GCC would change what data an agency may place in the service and how its authorizing official reasons about it. It would not, by itself, return the per-location network assessments, the provider attribution or informed network routing.

That distinction is the book's argument in small. The authorization boundary decides what an agency may put where; the provider's per-feature decisions decide what the service does in each environment. Conflating the two produces the boundary framing this chapter rejects, and it is why an agency waiting for a certification to restore a capability may wait indefinitely for something the certification was never going to deliver.

The practical conclusions:

1. Describe GCC as the worldwide service with a documented set of exclusions, and cite the exclusions; don't describe it as a perimeter.
2. Keep a per-feature register, one row per exclusion, each with its citation and its environment columns (commercial and GCC).
3. Treat the network connectivity layer as the largest documented loss for network decisions, and budget for the independent measurement that replaces it.
4. Cite the Marketplace class for the package the agency actually uses, and plan for `MSO365MTA` as an open question, not a commitment.
5. Never plan to recover a missing feature by waiting for a higher certification class. Ask the provider, per feature, what would move it.

## A worked case: Global Secure Access's network and privacy facts

A security service edge is where the boundary question gets concrete, because the agency's traffic, not only its data, passes through the provider. Microsoft's Global Secure Access shows what the register row has to carry ([Book 09, Chapter 05](../b09-network/05-sd-wan-sase-and-governed-transport.md#microsofts-security-service-edge-global-secure-access)).

- **Environment.** "Global Secure Access is available in the US Government Community Cloud (GCC)."[^c04-gsa-limits] The register row records that statement with its citation.
- **Where traffic is processed.** Microsoft states that Private Access and Internet Access "are available in the same locations" and that "These locations are Microsoft data centers." Its North American list names commercial Azure regions, such as East US, Central US and West US 2, and no Azure Government region.[^c04-gsa-pop] The remote network region list likewise has no Azure Government region.[^c04-gsa-rnconfig] The inference, labeled as one: a GCC tenant's traffic through Global Secure Access is handled in the commercial regions on that list, which the agency records in its boundary description and confirms with the provider.
- **Addresses.** Microsoft says the service "doesn't provide dedicated or static public IP addresses per individual data center or geographic location." Clients reach it on anycast ranges under `*.globalsecureaccess.microsoft.com`, and traffic leaves it from `128.94.0.0/19` and `151.206.0.0/16`, which any destination that filters by source address has to allow.[^c04-gsa-pop][^c04-gsa-egress] Location-based rules that key on the agency's own egress addresses stop matching unless source IP restoration is used for Microsoft Entra sign-in ([Book 09, Chapter 06](../b09-network/06-legacy-protocols-on-re-routed-paths.md)).
- **Data handling.** For Microsoft 365 enriched logs, Microsoft states that a subset of audit logs is copied to the service, retained for 24 hours, and that processing "strictly occurs within the US or Europe," with customers outside Europe processed in the United States.[^c04-gsa-privacy] Traffic logs and remote network health logs are kept for 30 days unless exported.[^c04-gsa-logs]
- **Certifications.** Microsoft's certifications page lists FedRAMP High for Global Secure Access, without saying which environment's authorization that is.[^c04-gsa-certs] That is a question for [Appendix A](appendix-a-what-to-ask-for.md): which package covers the GCC service, and at what class.
- **Ciphers.** The private network connector supports TLS 1.2 and 1.3 with default Windows cipher suites, and Microsoft's own table marks the CBC and RSA key-exchange suites as weak.[^c04-gsa-ciphers] Connector hosts follow the agency's server hardening, which removes them.

None of those facts is an impact level. They are what Microsoft documents about one service in one environment, which is the kind of row the register is built from.

[Chapter 09](09-equivalents-and-exceptions.md) turns the register into decisions, and [Appendix A](appendix-a-what-to-ask-for.md) lists the specific questions to put to the provider.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 03 — What Changed at FedRAMP](03-what-changed-at-fedramp.md) · [Book index](index.md) · [Next: Chapter 05 — The Landing Zone →](05-the-landing-zone.md)
:::

[^c04-endpoints]: Microsoft Learn, "Microsoft 365 URLs and IP address ranges" (Microsoft 365 Worldwide (+GCC)), <https://learn.microsoft.com/en-us/microsoft-365/enterprise/urls-and-ip-address-ranges?view=o365-worldwide> (accessed Oct 21, 2026).
[^c04-azfeat]: Microsoft Learn, "Cloud feature availability for US Government customers," section "Microsoft 365 integration," <https://learn.microsoft.com/azure/security/fundamentals/feature-availability#microsoft-365-integration> (accessed Oct 21, 2026).
[^c04-gccsd]: Microsoft Learn, "Office 365 GCC" (service description: US Government community compliance; customer support), <https://learn.microsoft.com/office365/servicedescriptions/office-365-platform-service-description/office-365-us-government/gcc> (accessed Oct 21, 2026).
[^c04-fr]: FedRAMP Marketplace product data, <https://www.fedramp.gov/marketplace/products.json>, dataset last changed October 21, 2026 (accessed Oct 21, 2026). Records MSO365MT and MSO365MTA: status, phase, certification class, impact level, authorization count, agency list, certification date, independent assessor, event log and service description.
[^c04-netconn]: Microsoft Learn, "Network connectivity in the Microsoft 365 Admin Center," <https://learn.microsoft.com/microsoft-365/enterprise/office-365-network-mac-perf-overview?view=o365-worldwide> (accessed Oct 21, 2026).
[^c04-adoption]: Microsoft Learn, "Microsoft Adoption Score" (prerequisites; score categories), <https://learn.microsoft.com/microsoft-365/admin/adoption/adoption-score?view=o365-worldwide> (accessed Oct 21, 2026).
[^c04-cdn]: Microsoft Learn, "Office 365 Content Delivery Network (CDN) Quickstart," <https://learn.microsoft.com/microsoft-365/enterprise/office-365-cdn-quickstart?view=o365-worldwide> (accessed Oct 21, 2026).
[^c04-inr]: Microsoft Learn, "Microsoft 365 informed network routing," <https://learn.microsoft.com/microsoft-365/enterprise/office-365-network-mac-perf-cpe?view=o365-worldwide> (accessed Oct 21, 2026).
[^c04-score]: Microsoft Learn, "Microsoft 365 network assessment," <https://learn.microsoft.com/microsoft-365/enterprise/office-365-network-mac-perf-score?view=o365-worldwide> (accessed Oct 21, 2026).
[^c04-insights]: Microsoft Learn, "Microsoft 365 Network Insights," <https://learn.microsoft.com/microsoft-365/enterprise/office-365-network-mac-perf-insights?view=o365-worldwide> (accessed Oct 21, 2026).
[^c04-npp]: Microsoft Learn, "Network provider details and connectivity attribution in the Microsoft 365 Admin Center," <https://learn.microsoft.com/microsoft-365/enterprise/office-365-network-mac-perf-nppdetails?view=o365-worldwide> (accessed Oct 21, 2026).
[^c04-tool]: Microsoft Learn, "Microsoft 365 network connectivity test tool" (version table; network egress distance insight), <https://learn.microsoft.com/microsoft-365/enterprise/office-365-network-mac-perf-onboarding-tool?view=o365-worldwide> (accessed Oct 21, 2026).
[^c04-scn]: FedRAMP, "Significant Change Notification," *FedRAMP Consolidated Rules for 2026* (SCN-CSO-EVA), <https://www.fedramp.gov/2026/reference/significant-change-notification/> (accessed Oct 21, 2026).
[^c04-ntc0004]: FedRAMP, Notice NTC-0004, *Initial Outcome from RFC-0020 FedRAMP Authorization Designations*, February 25, 2026, <https://www.fedramp.gov/notices/0004/> (accessed Oct 21, 2026).
[^c04-gsa-limits]: Microsoft Learn, "Known Limitations for Global Secure Access," section Global Secure Access In Government Cloud limitations, <https://learn.microsoft.com/entra/global-secure-access/reference-current-known-limitations> (accessed Nov 9, 2026).
[^c04-gsa-pop]: Microsoft Learn, "Global Secure Access points of presence and IP addresses," <https://learn.microsoft.com/entra/global-secure-access/reference-points-of-presence> (accessed Nov 9, 2026).
[^c04-gsa-rnconfig]: Microsoft Learn, "Global Secure Access remote network configurations" (valid regions), <https://learn.microsoft.com/entra/global-secure-access/reference-remote-network-configurations> (accessed Nov 9, 2026).
[^c04-gsa-egress]: Microsoft Learn, "Global Secure Access egress IP ranges," <https://learn.microsoft.com/entra/global-secure-access/reference-egress-ip-ranges> (accessed Nov 9, 2026).
[^c04-gsa-privacy]: Microsoft Learn, "Microsoft Entra Private Access and Microsoft Entra Internet Access data storage and privacy," <https://learn.microsoft.com/entra/global-secure-access/reference-data-storage-and-privacy> (accessed Nov 9, 2026).
[^c04-gsa-logs]: Microsoft Learn, "Global Secure Access logs and monitoring," <https://learn.microsoft.com/entra/global-secure-access/concept-global-secure-access-logs-monitoring> (accessed Nov 9, 2026).
[^c04-gsa-certs]: Microsoft Learn, "Global Secure Access Certifications," <https://learn.microsoft.com/entra/global-secure-access/reference-global-secure-access-certifications> (accessed Nov 9, 2026).
[^c04-gsa-ciphers]: Microsoft Learn, "Ciphers for Microsoft Entra Private Access," <https://learn.microsoft.com/entra/global-secure-access/reference-ciphers> (accessed Nov 9, 2026).
