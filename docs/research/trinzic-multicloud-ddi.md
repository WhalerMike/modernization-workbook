---
title: "Trinzic Alone, or Trinzic Plus Cloud DDI?"
subtitle: "A 15-minute, plain-language explainer: what Infoblox's on-premises appliances can and can't do in AWS, Azure and Google Cloud, the three ways to extend them, and which fits which agency"
description: "Research under review: a narrated explainer for architects learning DDI, on whether Infoblox Trinzic appliances can run an agency's DNS, DHCP and IPAM alone or should be combined with vNIOS, Universal DDI or native cloud DNS for multi-cloud."
research-status: in review
research-type: explainer
research-book: "Book 08"
date-modified: 2026-10-22
---

# Trinzic Alone, or Trinzic Plus Cloud DDI? {.unnumbered}

Trinzic is Infoblox's line of physical appliances that run NIOS, its DNS, DHCP and IPAM software, inside the agency's own data centers. This explainer is for architects still learning DDI. It defines the terms first, then answers one question: can Trinzic run an agency's DDI on its own, or does a multi-cloud agency need it to work with cloud-based DDI?

## Watch or download

| Edition | File |
|---|---|
| Deck | [Research_Trinzic_MultiCloud.pptx](../../presentations/research-trinzic-multicloud/Research_Trinzic_MultiCloud.pptx) |
| Narrated, self-running (about 15 minutes, captions) | [Research_Trinzic_MultiCloud_Narrated.pptx](../../presentations/research-trinzic-multicloud/Research_Trinzic_MultiCloud_Narrated.pptx) |
| Narration script and caption track | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-trinzic-multicloud/Research_Trinzic_MultiCloud_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-trinzic-multicloud/Research_Trinzic_MultiCloud_Narrated.vtt) |

## The answer in brief

**On its own, Trinzic can see into the clouds but can't control their DNS.** It discovers networks and virtual machines in AWS, Azure and Google Cloud, including AWS GovCloud and Azure Government, and it imports the clouds' DNS zones one way. It can't create or edit the clouds' private DNS zones, manage their resolver forwarding rules, act as AWS VPC IPAM's address authority, or hand out addresses inside cloud networks, which the clouds assign themselves. So an agency with workloads in the cloud needs Trinzic to work with cloud DNS, in one or more of three ways:

| Option | What it is | Its main limit |
|---|---|---|
| **A. vNIOS in each cloud** | Infoblox's virtual appliance runs inside each cloud as a member of the same Grid, so the agency's own DNS answers inside the cloud | Agency-operated, so the agency authorizes and runs every member; workloads must be pointed at it, or the cloud resolver must forward to it |
| **B. The Grid joined to Universal DDI** | Infoblox's cloud-delivered control plane manages the Grid and writes DNS records back into Route 53, Azure DNS and Google Cloud DNS | The only Infoblox path that writes back to cloud DNS, but its FedRAMP edition is Moderate only, with limited cloud discovery; some features run only on newer NIOS-X servers |
| **C. Trinzic alongside native cloud DNS** | Each cloud keeps its own private zones; Trinzic and each cloud forward the other's names both ways | Two systems to run, and the automated AWS address handoff isn't available in GovCloud |

**Design guidance (not an endorsement):** an agency that is mostly on premises can start with Trinzic and forwarding (option C). Hybrid with one cloud: add vNIOS in that cloud (A + C). Multi-cloud at Moderate and below: consider Universal DDI on top (B). GovCloud, Azure Government, High or DoD Impact Level 4–5 workloads: vNIOS and native cloud DNS only (A + C), without depending on the SaaS.

**Three rules hold in every option:** each DNS zone has exactly one writable owner, reached everywhere else by forwarding (for example, `corp.agency.gov` on the Grid and `aws.corp.agency.gov` in Route 53); DNSSEC keys stay on the Grid Master or a hardware security module; and the agency's address space stays authoritative on the Grid, handed out to each cloud in blocks.

## Status and review

**In review.** Every claim was checked against Infoblox, AWS, Microsoft and Google documentation and FedRAMP Marketplace data on October 22, 2026. Points that couldn't be verified, including Azure Government availability of Azure's DNS Private Resolver and IPAM, and which hybrid features Infoblox's government edition supports against GovCloud and Azure Government accounts, are marked "confirm" in the deck and listed in its backup section. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related research: [Infoblox DDI for Federal Agencies](infoblox-ddi-federal.md), the 50-minute deep dive, and [What a Federal DDI Platform Must Do](ddi-platform-requirements.md), the vendor-neutral briefing. The architecture both build on is [Book 08 — DNS, DHCP & IPAM](../books/b08-ddi/index.md).
