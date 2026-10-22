---
title: "What a Federal DDI Platform Must Do"
subtitle: "A 25-minute, vendor-neutral briefing: the requirements behind DNS, DHCP and IPAM, the evidence to check before buying, and how divisions manage their own DDI under central governance"
description: "Research under review: a narrated, vendor-neutral briefing for CIOs, CISOs, network and DDI leads, and acquisition teams on what federal requirements demand of a DNS, DHCP and IPAM platform and how to delegate it to divisions."
research-status: in review
research-type: explainer
research-book: "Book 08"
date-modified: 2026-10-22
---

# What a Federal DDI Platform Must Do {.unnumbered}

A companion briefing to [Book 08 — DNS, DHCP & IPAM](../books/b08-ddi/index.md), for CIOs, CISOs, network and DDI leads, and acquisition teams. It turns the book's argument into a buyer's and an operator's view: which federal requirements land on DNS, DHCP and IPAM, the capabilities a platform must deliver to meet them, the evidence to check before buying any product, and how an agency's divisions can manage their own DNS, DHCP and IPAM without breaking central governance. It recommends no product; vendors appear only as examples.

## Watch or download

| Edition | File |
|---|---|
| Deck | [B08_DDI_Requirements.pptx](../../presentations/research-ddi-requirements/B08_DDI_Requirements.pptx) |
| Narrated, self-running (about 26 minutes, captions) | [B08_DDI_Requirements_Narrated.pptx](../../presentations/research-ddi-requirements/B08_DDI_Requirements_Narrated.pptx) |
| Narration script and caption track | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-ddi-requirements/B08_DDI_Requirements_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-ddi-requirements/B08_DDI_Requirements_Narrated.vtt) |

## What it covers

- **Why:** DNS, DHCP and IPAM now form a control plane; no rule names a vendor, but the rules name capabilities (DNSSEC, encrypted DNS, CISA Protective DNS, address and domain inventory, IPv6, logging, validated cryptography).
- **What:** the capabilities a platform must deliver, each tied to its requirement: authoritative multi-cloud DNS with DNSSEC kept central; DNS security with agency policy first and Protective DNS upstream; IPAM as the address authority and DHCP that stays up; automation and logging that put every change and query on record.
- **Before you buy:** the evidence to check (FedRAMP listing and its scope, impact level, DISA STIG, an active FIPS 140-3 certificate, NIAP, the CDM Approved Products List, advisory response, licensing) and a status table for four DDI products as of October 22, 2026, presented as status, not a ranking.
- **Who:** divisions get a fenced, deny-by-default scope over their own address space, zones and servers; separate views handle overlapping address space; approvals work only if nothing goes around them; four delegation patterns with their trade-offs; a worked four-division example (illustrative design); and who decides, under Book 08's responsibility matrix.

## Status and review

**In review.** Every claim comes from Book 08 or from research checked against primary sources on October 22, 2026; the deck's backup section lists the sources and everything that could not be verified and so is not claimed. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

For a product-specific view, see the companion research item [Infoblox DDI for Federal Agencies](infoblox-ddi-federal.md).
