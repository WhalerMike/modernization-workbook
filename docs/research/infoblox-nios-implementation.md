---
title: "Implementing Book 08 on Infoblox NIOS"
subtitle: "An implementation guide: building Book 08's DDI design on Infoblox NIOS 9.1, from the Grid build to migrating off Microsoft DNS and DHCP, signing, hardening and operating it"
description: "Research under review: a narrated implementation guide for building Book 08's DNS, DHCP and IPAM design on Infoblox NIOS: Phase 0 decisions, the Grid build, migration from Microsoft DNS and DHCP, DNSSEC and the HSM, the DISA NIOS 9.x STIG, FIPS mode, upgrades, recovery, logging and automation."
research-status: in review
research-type: implementation guide
research-book: "Book 08"
date-modified: 2026-10-23
last-reviewed: 2026-10-23
---

# Implementing Book 08 on Infoblox NIOS {.unnumbered}

[Book 08 — DNS, DHCP & IPAM](../books/b08-ddi/index.md) sets the program's design: one governed authoritative DDI plane, a coexistence period with Microsoft DNS and DHCP, zones and scopes moved one at a time, DNSSEC signing and validation, and six migration phases that end on evidence rather than dates. The product deep dive [Infoblox DDI for Federal Agencies](infoblox-ddi-federal.md) explains why Infoblox fits that design. This implementation guide shows how to build it on Infoblox NIOS 9.1, and how to move off Microsoft DNS and DHCP without breaking anything.

## Watch or download

| Edition | File |
|---|---|
| Deck, presented live (about 52 minutes) | [Research_Infoblox_Impl.pptx](../../presentations/research-infoblox-impl/Research_Infoblox_Impl.pptx) |
| Narrated, self-running (about 20 minutes, captions) | [Research_Infoblox_Impl_Narrated.pptx](../../presentations/research-infoblox-impl/Research_Infoblox_Impl_Narrated.pptx) |
| Narration script and caption track | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-infoblox-impl/Research_Infoblox_Impl_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-infoblox-impl/Research_Infoblox_Impl_Narrated.vtt) |

## What it covers

| Part | Content |
|---|---|
| Orientation | Book 08's design mapped onto a Grid; Phase 0, the decisions that can't be undone cheaply: FIPS mode, the long-term-support train, the DNSSEC defaults, and the HSM |
| 1. Build the Grid | The Grid Master HA pair and its switch ports; the Grid Master Candidate and its promote test; joining members and the Grid's ports; time and licensing; vNIOS on VMware, Azure and AWS |
| 2. Migrate from Microsoft | Managing the Windows servers before taking them over; zone import by transfer and bulk import; AD zones and Kerberos-signed updates; the DHCP takeover; DHCP failover and DHCPv6; rollback by method |
| 3. Sign and harden | DNSSEC parameters and signing; the HSM and DS publication; what the DISA NIOS 9.x STIG checks; the FIPS mode procedure; administrator access and the 9.1.0 upgrade gates |
| 4. Operate and evidence | Upgrades, revert and long-term support; hotfixes and known exploited vulnerabilities; backup, restore and Grid Master recovery; logging to the SIEM; Terraform and Ansible; the build mapped to Book 08's six phases; decisions, vendor asks and next steps |

The backup section holds an assessor's evidence checklist, a risks register, what couldn't be verified or sits behind a login, and the full source list.

## What the research found

Eight findings change how the build is planned:

- **Decide on FIPS mode first.** NIOS sets it only from the command line after a factory reset, and leaving it needs another reset. It disables every cloud connection and Infoblox Portal access, so a FIPS-mode Grid can't use Universal DDI hybrid management. Infoblox states that NIOS 9.0.7 and later runs in FIPS and CC-NIAP mode but that the FIPS 140-3 and Common Criteria certifications are still pending.
- **The DISA NIOS 9.x STIG (V1R1) covers DNS only.** Its 45 rules include five CAT I rules: a stealth Grid Master (not a finding with an HSM), DNSSEC enabled and validating, the approved federal long-term-support version, FIPS-validated cryptography, and no DSA.
- **The NIOS DNSSEC defaults fail that STIG.** The default algorithm is RSA/SHA1 and the default zone-signing key is 1024 bits. Change both before the first zone is signed; fixing it later means an algorithm rollover and new DS records at the parent.
- **The vendor's keytab example uses RC4.** Microsoft's July 2026 update puts Kerberos RC4 protections into enforcement on domain controllers, so generate keytabs for Kerberos-signed updates with AES256-SHA1.
- **vNIOS can't manage Microsoft servers.** The coexistence phase needs physical managing members near the domain controllers.
- **Removing a managed Microsoft DHCP server deletes its synced ranges, leases and fixed addresses.** Take the scopes over by changing server assignments first, and remove the server from management last.
- **Cloud HA documentation omits the government regions.** The AWS and Azure HA prerequisites list only commercial endpoints, so confirm vNIOS failover in AWS GovCloud and Azure Government with Infoblox before relying on it.
- **NIOS 9.1.0 is WAPI v2.14**, which settles an open question from the earlier research. It's stated in the Terraform NIOS provider's compatibility matrix.

The guide keeps Book 08's default that the Active Directory locator zones stay on AD DNS, reached by forwarding, until the last domain controller goes; NIOS hosting the AD zone is shown as the alternative, pending confirmation of support for Windows Server 2025 domain controllers.

## Status and review

**In review.** Every new claim was checked on October 23, 2026, against Infoblox's NIOS 9.1.x, upgrade, FIPS/CC and vNIOS documentation, the DISA Infoblox NIOS 9.x STIG V1R1, Microsoft Learn, the CISA Known Exploited Vulnerabilities catalog and the Infoblox Terraform and Ansible repositories; earlier facts come from the verified briefs behind the other Infoblox research items. Open items are listed as vendor asks in the deck: the current approved federal long-term-support build (behind the support login), the FIPS 140-3 and Common Criteria certificate dates, Kerberos-signed updates with Windows Server 2025 domain controllers, vNIOS HA in the government clouds, address continuity in a DHCP takeover, and a SHA-2 NTP key type. To move this guide to **Proved**, build it in a lab or pilot Grid and record the evidence on this page. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Book 08 — DNS, DHCP & IPAM](../books/b08-ddi/index.md), the [Book 08 technical deep dive](../presentations/index.md#technical-b08), the product deep dive [Infoblox DDI for Federal Agencies](infoblox-ddi-federal.md), the briefing [What a Federal DDI Platform Must Do](ddi-platform-requirements.md), and [Infoblox training and learning resources](infoblox-training.md).
