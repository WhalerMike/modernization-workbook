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
| 32 | 2026-10-21 correction: M-21-31 presented as current (mandates bullet, In this chapter, description, figure alt text, control-mapping row, "What this chapter establishes") | What the mandates say; figure; control mapping | corrected: M-21-31 was rescinded by M-26-14 (May 22, 2026); bullet rewritten to M-26-14's CEM/THIRF objectives, minimum baseline (6 months searchable, 1 year retrievable; traceable timestamps; source/destination address, protocol, port and session logs), maturity model, and plan/Level 1–3 deadlines worked from the LRA date; M-26-14 does not name DNS, so the EL1 passive-DNS claim was dropped; footnote c03-m2131 replaced by c03-m2614 and c03-lra; diagram card m2131 replaced by m2614 in `ch03-federal-drivers.flow.yaml` (needs re-rendering) | OMB M-26-14 PDF (whitehouse.gov, text extracted with pdftotext): rescission paragraph, "Prioritization," "Agency Logging Plan," "Agency Actions," Appendix B items 1–5, Appendix C; CISA Logging Reference Architecture page (cisa.gov/logging, publish date August 20, 2026) |

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

## Cross-chapter consistency pass (October 21, 2026)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| CP-1 | M-26-14 footnote cites Appendix B items 1, 3 and 5 | c03-m2614 | verified (no change) | M-26-14 PDF, whitehouse.gov (opened Oct 21, 2026), Appendix B: item 1 retention 6 months searchable / 1 year retrievable; item 2 storage readily available to the top-level SOC; item 3 timestamp and traceable time source; item 5 activities incl. 5a identity and 5b network address. Chapter 03 uses 1, 3 and 5 only; Chapter 11 also uses item 2, so its "1, 2, 3 and 5" is also correct |
| CP-2 | July 2026 Infoblox release: restated as the vendor describing what the offering includes, not as new scope; footnote explains why its 2026 date differs from the 2022 Marketplace certification date | FedRAMP example paragraph; c03-ibxpr | corrected (release says "includes," not "now includes" or "added") | Infoblox press release, July 22, 2026 (opened Oct 21, 2026): headline announces Moderate certification; lists Universal DDI Management, NIOS-X Servers, Universal Asset Insights; gives no certification date, no prior authorization, no Rev5/20x mention. FedRAMP `products.json` (fetched Oct 21, 2026, last_change 2026-10-22T00:15Z), FR2017257053: event log 2020-09-24 Agency In Process, 2022-07-01 FedRAMP In Process, 2022-12-15 FedRAMP Certified; no later status change; cert_class Class C, Moderate |

## Moderate-civilian sweep (October 29, 2026)

The workbook targets FedRAMP Moderate civilian agencies. Configuration authority is the agency's CM-6 settings drawn from civilian sources; DISA STIGs and DoD Impact Levels survive only as optional references labelled *High only*; AWS GovCloud (US) and Azure Government are treated as valid Moderate locations. Facts from the coordinator's verified fact pack (read 2026-10-29) or re-read by this writer on 2026-10-29 as noted.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| MS-1 | CM-2 baseline; CM-6 settings "reflect the most restrictive mode consistent with operational requirements" from agency-defined common secure configurations developed by vendors, agencies, consortia and others | New subsection Configuration baselines; control-mapping row | verified 2026-10-29 (fact pack; OSCAL catalog) | c03-cm6: NIST SP 800-53 Rev. 5 CM-2, CM-6 |
| MS-2 | NCP: SP 800-70 Rev. 5 (May 2026); checklists typically created by IT vendors for their own products | Configuration baselines | verified 2026-10-29 (fact pack) | c03-ncp: SP 800-70 Rev. 5; NIST NCP page |
| MS-3 | CIS lists Windows Server 2022 (5.1.0) and 2025 (2.1.0); no Infoblox NIOS benchmark (only a CIS-formatted Infoblox 8.x DNS STIG) | Configuration baselines | verified 2026-10-29 (fact pack) | c03-cisbench: CIS Benchmarks list |
| MS-4 | Agency writes NIOS settings from SP 800-81r3 and vendor documentation where no civilian benchmark exists | Configuration baselines | design (labelled) | — |
| MS-5 | DISA DDI STIGs (e.g., Infoblox NIOS 9.x) are optional cross-checks, not requirements (High only) | Configuration baselines; High only line added | framing per brief; STIG existence carried from the Research guide's Oct 22-23 check | Research: Implementing Book 08 on Infoblox NIOS |
| MS-6 | Control mapping: hardening of DDI servers and appliances → CM-2, CM-6, CM-7 | Control mapping table | mapping (illustrative, as the table states) | c03-cm6 |
