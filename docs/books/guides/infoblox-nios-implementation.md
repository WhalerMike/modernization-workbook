---
title: "Implementing Book 08 on Infoblox NIOS"
subtitle: "An implementation guide: building Book 08's DDI design on Infoblox NIOS 9.1, from the Grid build to migrating off Microsoft DNS and DHCP, signing, hardening and operating it"
description: "Research under review: a narrated implementation guide for building Book 08's DNS, DHCP and IPAM design on Infoblox NIOS: Phase 0 decisions, the Grid build, migration from Microsoft DNS and DHCP, DNSSEC and the HSM, the agency's NIOS settings baseline, FIPS mode, upgrades, recovery, logging and automation."
research-status: in review
research-type: implementation guide
research-book: "Book 08"
date-modified: 2026-10-29
last-reviewed: 2026-10-23
aliases:
  - /docs/research/infoblox-nios-implementation.html
---

# Implementing Book 08 on Infoblox NIOS {.unnumbered}

[Book 08 — DNS, DHCP & IPAM](../b08-ddi/index.md) sets the program's design: one governed authoritative DDI plane, a coexistence period with Microsoft DNS and DHCP, zones and scopes moved one at a time, DNSSEC signing and validation, and six migration phases that end on evidence rather than dates. The product deep dive [Infoblox DDI for Federal Agencies](../../evaluations/infoblox-ddi-federal.md) explains why Infoblox fits that design. This implementation guide shows how to build it on Infoblox NIOS 9.1, and how to move off Microsoft DNS and DHCP without breaking anything.

## Watch or download

{{< fmw-video Research_Infoblox_Impl_Narrated >}}

| Edition | File |
|---|---|
| Deck, presented live (about 52 minutes) | [Research_Infoblox_Impl.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.1/Research_Infoblox_Impl.pptx) |
| Narrated, self-running (about 22 minutes, captions) | [Research_Infoblox_Impl_Narrated.pptx](https://github.com/WhalerMike/modernization-workbook/releases/download/edition-2026.11.1/Research_Infoblox_Impl_Narrated.pptx) |
| Narration script and caption track | [Script](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-infoblox-impl/Research_Infoblox_Impl_Narration_Script.md) · [Captions](https://github.com/WhalerMike/modernization-workbook/blob/main/presentations/research-infoblox-impl/Research_Infoblox_Impl_Narrated.vtt) |

## What it covers

| Part | Content |
|---|---|
| Orientation | Book 08's design mapped onto a Grid; Phase 0, the decisions that can't be undone cheaply: FIPS mode, the long-term-support train, the DNSSEC defaults, and the HSM |
| 1. Build the Grid | The Grid Master HA pair and its switch ports; the Grid Master Candidate and its promote test; joining members and the Grid's ports; time and licensing; vNIOS on VMware, Azure and AWS |
| 2. Migrate from Microsoft | Managing the Windows servers before taking them over; zone import by transfer and bulk import; AD zones and Kerberos-signed updates; the DHCP takeover; DHCP failover and DHCPv6; rollback by method |
| 3. Sign and harden | DNSSEC parameters and signing; the HSM and DS publication; the agency's NIOS settings baseline, with the DISA NIOS 9.x STIG as an optional cross-check (High only); the FIPS mode procedure; administrator access and the 9.1.0 upgrade gates |
| 4. Operate and evidence | Upgrades, revert and long-term support; hotfixes and known exploited vulnerabilities; backup, restore and Grid Master recovery; logging to the SIEM; Terraform and Ansible; the build mapped to Book 08's six phases; decisions, vendor asks and next steps |

*High only* marks material that applies to FedRAMP High or Defense environments, such as DISA STIGs and DoD Impact Levels, not to the Moderate civilian baseline this workbook targets. It's kept as an optional reference.

The backup section holds an assessor's evidence checklist, a risks register, what couldn't be verified or sits behind a login, and the full source list.

## What the research found

Eight findings change how the build is planned:

- **Decide on FIPS mode first.** NIOS sets it only from the command line after a factory reset, and leaving it needs another reset. It disables every cloud connection and Infoblox Portal access, so a FIPS-mode Grid can't use Universal DDI hybrid management. Infoblox states that NIOS 9.0.7 and later runs in FIPS and CC-NIAP mode but that the FIPS 140-3 and Common Criteria certifications are still pending.
- **The hardening baseline is the agency's own.** NIST SP 800-53 control CM-6 has the agency establish and document configuration settings from common secure configurations it chooses, and approve deviations.[^nimp-cm6] CIS publishes no benchmark for NIOS,[^nimp-cis] so the guide writes the NIOS settings from NIST SP 800-81r3, the civilian DNS deployment guide (hidden primary, separate authoritative and recursive roles, TSIG-protected transfers, DNSSEC algorithms, DNS logs in the SIEM),[^nimp-80081] and Infoblox's documentation. The DISA NIOS 9.x STIG (V1R1) is the only published product-specific checklist. It covers DNS only, with 45 rules, and the guide uses it as an optional cross-check (High only).
- **The NIOS DNSSEC defaults are weak.** The default algorithm is RSA/SHA1 and the default zone-signing key is 1024 bits. SP 800-81r3's table of DNSSEC algorithms lists RSA/SHA-256 only at 2048 bits or more, plus ECDSA P-256 and P-384, Ed25519 and Ed448, and calls ECDSA and Ed448 preferable for their smaller keys and signatures; RSA/SHA1 isn't in it.[^nimp-80081-t1] Change both before the first zone is signed; fixing it later means an algorithm rollover and new DS records at the parent.
- **The vendor's keytab example uses RC4.** Microsoft's July 2026 update puts Kerberos RC4 protections into enforcement on domain controllers, so generate keytabs for Kerberos-signed updates with AES256-SHA1.
- **vNIOS can't manage Microsoft servers.** The coexistence phase needs physical managing members near the domain controllers.
- **Removing a managed Microsoft DHCP server deletes its synced ranges, leases and fixed addresses.** Take the scopes over by changing server assignments first, and remove the server from management last.
- **Cloud HA documentation omits the government regions.** The AWS and Azure HA prerequisites list only commercial endpoints, so confirm vNIOS failover in AWS GovCloud and Azure Government with Infoblox before relying on it.
- **NIOS 9.1.0 is WAPI v2.14**, which settles an open question from the earlier research. It's stated in the Terraform NIOS provider's compatibility matrix.

The guide keeps Book 08's default that the Active Directory locator zones stay on AD DNS, reached by forwarding, until the last domain controller goes; NIOS hosting the AD zone is shown as the alternative, pending confirmation of support for Windows Server 2025 domain controllers.

## Status and review

**In review.** Every new claim was checked on October 23, 2026, against Infoblox's NIOS 9.1.x, upgrade, FIPS/CC and vNIOS documentation, the DISA Infoblox NIOS 9.x STIG V1R1 (High only), Microsoft Learn, the CISA Known Exploited Vulnerabilities catalog and the Infoblox Terraform and Ansible repositories; earlier facts come from the verified briefs behind the other Infoblox research items. The civilian baseline sources (NIST SP 800-53 CM-6, NIST SP 800-81r3 and the CIS Benchmarks list) were read on October 29, 2026. Open items are listed as vendor asks in the deck: the current approved federal long-term-support build (behind the support login), the FIPS 140-3 and Common Criteria certificate dates, Kerberos-signed updates with Windows Server 2025 domain controllers, vNIOS HA in the government clouds, address continuity in a DHCP takeover, and a SHA-2 NTP key type. To move this guide to **Proved**, build it in a lab or pilot Grid and record the evidence on this page. Comments and corrections are welcome as [issues on GitHub](https://github.com/WhalerMike/modernization-workbook/issues).

Related: [Book 08 — DNS, DHCP & IPAM](../b08-ddi/index.md), the [Book 08 technical deep dive](../../presentations/index.md#technical-b08), the product deep dive [Infoblox DDI for Federal Agencies](../../evaluations/infoblox-ddi-federal.md), the briefing [What a Federal DDI Platform Must Do](../explainers/ddi-platform-requirements.md), and [Infoblox training and learning resources](../../training/infoblox-training.md).

<!-- revisions:start: generated by scripts/generate_revisions.py from data/editions.yml; edit those, not this section -->

## Version and revision history {#version-history}

**Version 1.1**, in [edition 2026.11.1](../../about/archive.md#edition-2026-11-1) (November 1, 2026). Every edition is kept on the [Archive](../../about/archive.md) page; every change between editions is in the [commit history](https://github.com/WhalerMike/modernization-workbook/commits/main/docs/books/guides/infoblox-nios-implementation.md).

| Version | Edition | Date | Changes |
|---|---|---|---|
| 1.1 | [2026.11.1](../../about/archive.md#edition-2026-11-1) | 2026-11-01 | Edition 2026.11: record the edition, and publish the four gate-level decks and videos ([#282](https://github.com/WhalerMike/modernization-workbook/pull/282)) |
| 1.0 | [2026.11](../../about/archive.md#edition-2026-11) | 2026-11-01 | Retire Research: move each page to a home by type (guides, training, reference, evaluations, explainers) ([#269](https://github.com/WhalerMike/modernization-workbook/pull/269)) |

: Versions of this guide, newest first {.striped .hover}

<!-- revisions:end -->

[^nimp-cm6]: National Institute of Standards and Technology, SP 800-53 Rev. 5, *Security and Privacy Controls for Information Systems and Organizations*, controls CM-2 and CM-6 (statement and discussion: settings that "reflect the most restrictive mode consistent with operational requirements" using organization-defined common secure configurations, which product vendors, federal agencies, consortia and others may develop), <https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final>; read from NIST's OSCAL Rev. 5 catalog, <https://github.com/usnistgov/oscal-content/tree/main/nist.gov/SP800-53/rev5> (accessed Oct 29, 2026).
[^nimp-cis]: Center for Internet Security, "CIS Benchmarks" (benchmark list; no benchmark for Infoblox NIOS, only a CIS-formatted "Infoblox 8.x DNS STIG"), <https://www.cisecurity.org/cis-benchmarks> (accessed Oct 29, 2026).
[^nimp-80081]: S. Rose (NIST), C. Liu and R. Gibson (Infoblox), NIST SP 800-81r3, *Secure Domain Name System (DNS) Deployment Guide*, March 2026, sections 2.1.3 (DNS logs integrated with the SIEM), 2.3 (authoritative and recursive roles under separate security policies) and 2.3.2 ("a network administrator should use a 'hidden' primary authoritative server"), 3.1 (zone transfers and TSIG) and 3.3 (dynamic updates), <https://csrc.nist.gov/pubs/sp/800/81/r3/final> (PDF read Oct 29, 2026).
[^nimp-80081-t1]: NIST SP 800-81r3, section 3.8.1 and Table 1, "DNSSEC key parameters based on algorithm" (RSA with SHA-256 at "2048 bits or greater"; ECDSA P-256 and P-384; Ed25519; Ed448; "algorithms like ECDSA and ed448 are preferable to RSA, as they produce smaller key and signature sizes"), <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-81r3.pdf> (accessed Oct 29, 2026).
