# Verification — Chapter 03, Federal Requirements: NIST SP 800-81, FedRAMP and Zero Trust

Checked October 20, 2026. Sources: the existing series page (Next Generation DDI, Chapter 03) verified and upgraded in place, plus §7.8 "Why federal agencies need to get ahead of this now" of the archived whitepaper `docs/whitepapers/infoblox-hybrid-dns-unified-ddi.md`. Primary documents were downloaded and text-extracted: NIST SP 800-81r3 (nvlpubs PDF), OMB M-22-09, M-21-31, M-21-07, M-08-23, CISA Encrypted DNS Implementation Guidance, the CISA TIC 3.0 Security Capabilities Catalog (September 2026 edition), and the FedRAMP Marketplace product data (`products.json`, last changed 2026-10-20).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-22-09: "Agencies must resolve DNS queries using encrypted DNS wherever it is technically supported" | What the mandates say | verified | M-22-09, "Encrypting DNS traffic" (also listed under Actions) |
| 2 | M-22-09 detail: resolvers support DoH or DoT; endpoints enable encrypted DNS; explicitly configure endpoints; log at designated resolvers; FY24 plans | What the mandates say | verified (new) | M-22-09, same section |
| 3 | M-22-09: agencies "are already required to have DNS requests routed through CISA-operated infrastructure" | What the mandates say | verified | M-22-09, same section |
| 4 | Protective DNS: launched 2022, successor to E3A, upstream filtering, block/redirect/sinkhole, mobile/roaming/cloud direct, FCEB mandated | What the mandates say | verified (new) | CISA, Protective DNS Resolver service page |
| 5 | Protective DNS for all egress resolution under 6 U.S.C. § 663 note | What the mandates say; figure | verified | CISA Encrypted DNS Implementation Guidance, executive summary |
| 6 | CISA guidance "sets out phased implementation, names DoH, DoT and DoQ" | What the mandates say | verified / expanded | CISA guidance Sec. 2.1 (six phases; Phase 1 should already be done) and Sec. 3 (DoQ supported by fewer products; Protective DNS supports DoH and DoT) |
| 7 | M-21-31: DNS request logs required from tier "EL-1" | What the mandates say; figure | corrected | M-21-31 Table 2 (EL1 Basic): Passive DNS logging, including encrypted DNS requests, with analytics identifying the source host; tier written "EL1"; reach EL1 within one year |
| 8 | M-08-23: DNSSEC on federal systems by December 2009 | What the mandates say | verified | M-08-23 (also: follow SP 800-81) |
| 9 | SC-20/SC-21 carry signing and validating-resolver requirements | What the mandates say | verified | NIST SP 800-53 Rev. 5 (release 5.2.0 noted, August 27, 2025); control titles cross-checked on secondary control catalogs |
| 10 | M-21-07: 20% FY2023, 50% FY2024, 80% FY2025 IPv6-only | What the mandates say | verified | M-21-07 milestones a–c |
| 11 | M-21-07 milestones have passed | What the mandates say | verified (new) | Date arithmetic: FY2025 ended September 30, 2025 |
| 12 | TIC 3.0 DNS PEP capabilities: sinkholing, DNSSEC for clients, DNSSEC for agency domains, domain monitoring, CISA Protective DNS (replaced E3A); Web PEP domain resolution filtering vs. DoH | What the mandates say; figure; table | verified (new; brief required TIC 3.0) | CISA TIC 3.0 Security Capabilities Catalog v3.3, publication September 2026, Table 9 and Web PEP table |
| 13 | SP 800-81r3 published March 19, 2026 | NIST SP 800-81r3 | verified | CSRC page (final 03/19/26; draft 04/10/25); PDF cover "March 2026"; approved by NIST ERB 2026-03-04 |
| 14 | Supersedes SP 800-81-2 (2013) | NIST SP 800-81r3 | verified | PDF publication history (September 2013) |
| 15 | "Its authors include engineers from Infoblox as well as NIST" | NIST SP 800-81r3 | verified / made precise | PDF title page: Scott Rose (NIST); Cricket Liu and Ross Gibson (Infoblox Inc.) |
| 16 | Core recommendations: Protective DNS, encrypt, DNSSEC, hygiene, logging, PEP in ZTA aligned with SP 800-207 | NIST SP 800-81r3 | corrected / verified | Executive summary has five recommendations, one of which (dedicated DNS servers) the old text omitted; hygiene (Secs. 3.2, 3.6), logging (Sec. 2.1.3), PEP (Sec. 1.2) are in the body; SP 800-207 is a cited reference |
| 17 | "Protective DNS" in SP 800-81r3 is the general service, not CISA's program | NIST SP 800-81r3 | verified (new) | SP 800-81r3 Executive Summary footnote 1 |
| 18 | Block outbound DNS/DoT/DoH/DoQ to unauthorized providers; MDM to prevent unapproved encrypted DNS | NIST SP 800-81r3 | verified (new) | SP 800-81r3 Sec. 4.2.2 |
| 19 | SP 800-81r3 is guidance, not a mandate | NIST SP 800-81r3 | restated-as-design | NIST SP 800 series is guidance; mandates come from OMB/CISA |
| 20 | "FedRAMP authorizes cloud services... the agency still issues its own ATO for its use of it" | FedRAMP | corrected / verified | FedRAMP 2026 rules, Using a FedRAMP Certified Cloud Service: agencies authorize their own systems; never a standalone ATO for a cloud service offering. Terminology updated to "certifies"/"certification" as the Marketplace now uses |
| 21 | Infoblox Government Cloud FedRAMP Moderate authorized since December 2022 (FR2017257053) | FedRAMP | verified / terminology updated | FedRAMP Marketplace page and products.json: FedRAMP Certified, Class C (Moderate), Rev5, agency path, certified 2022-12-15, AWS GovCloud (US) |
| 22 | July 2026: Universal DDI Management, NIOS-X Servers and Universal Asset Insights added | FedRAMP | verified as the vendor's statement | Infoblox press release, July 22, 2026. Note: the Marketplace description lists Universal DDI, Universal Asset Insights, TIDE and Dossier, and does not name NIOS-X Servers; the chapter attributes the NIOS-X claim to the vendor |
| 23 | On-premises NIOS is not the FedRAMP-listed offering | FedRAMP | verified (new; brief item 4) | Marketplace data: the only Infoblox entry is Infoblox Government Cloud |
| 24 | Moderate doesn't cover High or DoD | FedRAMP | verified | Marketplace class definitions (Class C = Moderate; Class D = High) |
| 25 | Zero Trust mandate references services by FQDN; "ZTNA uses DNS as the service registry" (whitepaper §7.8) | Why the timing matters | restated-as-design | Program argument; "service registry" claim not carried |
| 26 | Microsoft recommends cloud-first; phased path to AD-minimized | Why the timing matters | verified | Learn, Microsoft Entra cloud-first identity guidance for IT architects |
| 27 | Agencies expanding across multiple CSPs; split-brain grows combinatorially | Why the timing matters | restated-as-design | Program argument |
| 28 | "Federal PKI is migrating RSA-2048 to ECDSA, SHA-1 to SHA-256, CRL to OCSP" (whitepaper §7.8) | Why the timing matters | removed | Not verified, and the CRL→OCSP direction is doubtful for public PKI; restated as the design point that every revocation-endpoint change is a DNS change |
| 29 | Rogue DHCP option 6 "observed in federal network incidents" (whitepaper §7.8) | Why the timing matters | removed (incident claim) | Unverifiable; the attack itself is Chapter 05's |
| 30 | "Management-plane authorization gap has just closed" (whitepaper §7.8) | Why the timing matters | restated-as-design | Reframed: a Moderate-listed management plane exists, so authorization alone is no longer a reason to defer |
| 31 | Control mapping table | Control mapping | restated-as-design | Program mapping; DNS query logging row added (AU-2, AU-12, SI-4; M-21-31), TIC references added |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch03 front matter, subtitle, "Download this chapter" callout | Front matter restyled; title per the Book 08 brief | Subtitle and per-page Word download removed |
| Series Ch03 · figure | Kept at the top; source updated (see below) | — |
| Series Ch03 · What the Mandates Say (five bullets and the "read together" paragraph) | What the mandates say | Expanded with Protective DNS and TIC 3.0 bullets; M-21-31 corrected (claim 7) |
| Series Ch03 · NIST SP 800-81 Rev. 3: Secure DNS Deployment Guide | NIST SP 800-81 Rev. 3 section | Corrected and expanded (claims 15–18) |
| Series Ch03 · FedRAMP Moderate and Agency Authorization | FedRAMP and agency authorization | Updated to 2026 FedRAMP terminology and rules (claims 20–24) |
| Series Ch03 · Control Mapping table | Control mapping | One row added (claim 31) |
| Series Ch03 · What this chapter establishes | Same callout, items updated | — |
| Series Ch03 · Previous/Next | "Continue the book" callout | — |
| Whitepaper · §7.8 Why federal agencies need to get ahead of this now | Why the timing matters now (seven drivers) | Two unverifiable claims removed (claims 28, 29); vendor framing neutralized (claim 30) |
| Whitepaper · Part 7 §§7.1–7.7 | — | Chapters 07, 08, 11 and 12 (product and platform material) |
| Whitepaper · Part 9 The Federal Sovereign Cloud Gap | — | Chapter 05 and Appendix C |
| Whitepaper · front matter "companion volumes" note (Vol VIII, Vol I Book 01) | — | Not carried here; those pages stay in place and are linked from the book index and Appendix B |
| Twin `next-generation-dns.md` | — | Contains no federal-requirements section |

## Diagram change

`docs/images/diagrams/b08-ddi/src/ch03-federal-drivers.flow.yaml`: M-21-31 card now reads "Passive DNS logging at tier EL1, encrypted queries included" (was "Required from event-logging tier EL-1"); new violet card "CISA TIC 3.0 — DNS enforcement points: Sinkholing, DNSSEC, domain monitoring, Protective DNS" with an edge to the NIST card. The left rank now holds six cards stacked vertically; check width and height after rendering. Needs re-rendering.
