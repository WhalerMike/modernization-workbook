---
title: "Who Names the Device After AD?"
subtitle: "A plain-language explainer: what names client PCs, Macs, Linux machines, servers and cloud VMs once Active Directory is gone, what registers their DNS records, and what an agency must do to keep name resolution working"
description: "Research under review: a narrated explainer on device naming and DNS registration after Active Directory retires, the gaps that break things (IPv6, VPN clients, migration ownership records), and the agency checklist to keep names resolving."
research-status: in review
research-type: explainer
research-book: "Books 05, 08"
date-modified: 2026-10-22
---

# Who Names the Device After AD? {.unnumbered}

While a device is joined to Active Directory, AD quietly does two jobs at once: the device takes its name from the domain, and it registers its own DNS record with a Kerberos-signed update to AD-integrated DNS. When AD retires, both jobs need a new owner. This explainer, written for architects still learning the area, shows who takes each one, what breaks if nobody does, and what an agency must do before, during and after the cutover.

## Watch or download

| Edition | File |
|---|---|
| Deck | [Research_Device_Naming.pptx](../../presentations/research-device-naming/Research_Device_Naming.pptx) |
| Narrated, self-running (about 25 minutes, captions) | [Research_Device_Naming_Narrated.pptx](../../presentations/research-device-naming/Research_Device_Naming_Narrated.pptx) |
| Narration script and caption track | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-device-naming/Research_Device_Naming_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-device-naming/Research_Device_Naming_Narrated.vtt) |

## The answer in brief

- **The name comes from provisioning, not the directory.** Windows PCs are named by an Autopilot template (classic Autopilot: 15 characters; Autopilot device preparation: up to 63, but only for devices bound through device association) or renamed in Intune. Macs have no enrollment-time naming template in Intune and are renamed after enrollment. Linux takes its name from cloud-init or a static hostname, servers from the build pipeline, and cloud VMs from their deployment. Azure Arc keeps the hostname a server already has.
- **The DNS record should come from DHCP or the pipeline, not the device.** Without Kerberos, a device can't sign its own update to a secure-only zone, and Windows tries an unsigned update first, so the zone should accept updates only from the DHCP servers and the provisioning pipeline. DHCP registers the device's name for the life of its lease (DHCPv4 option 81; DHCPv6 option 39) and removes the records when the lease ends; servers get records from the same pipeline run that builds them.
- **Three gaps catch agencies out.** IPv6 addresses a device assigns itself (SLAAC and temporary "privacy" addresses) never reach a DHCP server, so endpoints get no AAAA records by design. Remote and VPN clients are resolved through services such as Microsoft's Global Secure Access but aren't documented as registered. And on migration, Infoblox's default ownership-record mode doesn't recognize records Microsoft DHCP created, so updates fail until the mode and the existing records are reconciled; rotating Wi-Fi addresses on Macs break the same ownership check.
- **Names still matter after AD**, for help desk tools, Kerberos islands, certificates with DNS names, and as the join key in the workbook's evidence contract (Book 12), so the checklist keeps them unique, registered and clean.

## Status and review

**In review.** Every claim was checked against primary sources (Microsoft Learn, Apple, the IETF RFCs, systemd and cloud-init, AWS and Infoblox documentation) on October 22, 2026; inferences are labeled as inferences, and what couldn't be verified (including macOS dynamic DNS behavior and Windows registration of temporary IPv6 addresses) is listed in the deck's backup section. This research also corrected [Book 05, Chapter 04](../books/b05-devices/04-intune-first-onboarding.md) for Autopilot device association. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Book 05 — Devices & Endpoints](../books/b05-devices/index.md), [Book 08 — DNS, DHCP & IPAM](../books/b08-ddi/index.md), and the research items [Trinzic Alone, or Trinzic Plus Cloud DDI?](trinzic-multicloud-ddi.md) and [DNS for HR-Driven Identity Across Clouds](hr-identity-dns.md).
