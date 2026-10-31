---
title: "DNS for HR-Driven Identity Across Clouds"
subtitle: "A plain-language explainer: what the HR-to-identity pipeline must resolve across Oracle, Azure, AWS, VMware and on-premises, when private DNS and forwarding are needed, and how it breaks"
description: "Research under review: a narrated explainer on DNS for HR-driven identity with Oracle Fusion Cloud HCM, Microsoft Entra ID, AWS (including Amazon Connect), VMware and on-premises: public versus private names, government-cloud endpoints, cloud precedence differences, failure modes and the agency checklist."
research-status: in review
research-type: explainer
research-book: "Books 03, 08"
date-modified: 2026-10-22
last-reviewed: 2026-10-22
---

# DNS for HR-Driven Identity Across Clouds {.unnumbered}

Federal HR 2.0 puts an agency's core HR records in Oracle Fusion Cloud HCM, a SaaS service, and [Book 03](../books/b03-hr-identity/index.md) builds HR-driven identity on it: middleware reads changes from Oracle and posts them to Microsoft Entra ID's API-driven inbound provisioning, which feeds Entra accounts, Lifecycle Workflows and, while it exists, Active Directory. This explainer asks what that pipeline needs from DNS when the agency also runs Azure, AWS (including the Amazon Connect contact center), VMware and its own data centers, and whether that three- to five-way estate can break it.

## Watch or download

{{< fmw-video Research_HR_Identity_DNS_Narrated >}}

| Edition | File |
|---|---|
| Deck, presented live (about 17 minutes) | [Research_HR_Identity_DNS.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/Research_HR_Identity_DNS.pptx) |
| Narrated, self-running (about 9 minutes, captions) | [Research_HR_Identity_DNS_Narrated.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.10/Research_HR_Identity_DNS_Narrated.pptx) |
| Narration script and caption track | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-hr-identity-dns/Research_HR_Identity_DNS_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-hr-identity-dns/Research_HR_Identity_DNS_Narrated.vtt) |

## The answer in brief

- **Almost every name in the pipeline is public and vendor-owned:** the Oracle Fusion host, Microsoft Graph and Entra sign-in, the provisioning agent's relay names, and Amazon Connect's endpoints. The agency resolves them through public DNS and must never put them in a private zone. Private DNS and forwarding are needed only for the agency's own names (domain controllers, internal APIs, VMware) and for cloud private endpoints.
- **Oracle's "private access" for Fusion is routing, not DNS.** Traffic reaches Oracle's public addresses through a private path; the Fusion name keeps its public answer, so no private zone is built for it. Because the middleware pulls Oracle's change feeds and Oracle may purge feed data, a long DNS or network outage on the middleware can lose HR events; reconcile against full extracts.
- **Government clouds use different names.** Microsoft Graph and sign-in, and the provisioning agent's endpoints, differ between the commercial, GCC High and higher government clouds, and the agent must not sit behind TLS inspection.
- **The clouds disagree on precedence.** When a private zone and a forwarding rule both cover a name, AWS follows the rule, Azure uses the private zone and ignores the rule, and Oracle checks its private views first. One owner per name, with forwarding to it, is the only design that behaves the same everywhere.
- **Hub, not mesh.** Pairwise forwarding between five environments means up to twenty one-way rule sets; a hub (a DDI grid or one resolver hub) means about five, with one place to log every query. The three- to five-way estate doesn't break HR-driven identity as long as no one shadows a vendor's domain and every private zone has one owner.

## Status and review

**In review.** Every claim was checked against Oracle, Microsoft, AWS, Broadcom and Infoblox documentation and FedRAMP Marketplace data on October 22, 2026; facts taken from Microsoft Learn search excerpts are marked as such. Open checks, including which Oracle environment an agency's Core HCM tenant uses, whether Entra's bulk upload endpoint is available in the U.S. Government cloud, and Azure Government availability of DNS Private Resolver, are listed in the deck's backup section. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Book 03 — HR-Driven Identity](../books/b03-hr-identity/index.md), [Book 08 — DNS, DHCP & IPAM](../books/b08-ddi/index.md), and the research items [Trinzic Alone, or Trinzic Plus Cloud DDI?](trinzic-multicloud-ddi.md) and [Who Names the Device After AD?](device-naming-after-ad.md).
