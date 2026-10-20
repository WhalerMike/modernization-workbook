# Verification — Appendix B, Requirements Mapping and Sources

Checked October 20, 2026. Source: the existing series page (Next Generation DDI, Appendix B) verified and upgraded in place. Primary documents were downloaded and text-extracted: OMB M-22-09, M-21-31, M-21-07, M-08-23, NIST SP 800-81 Rev. 3 (nvlpubs PDF), the CISA TIC 3.0 Security Capabilities Catalog v3.3 (September 2026; v3.2, November 2024, also read). SP 800-53 control text and Moderate baseline membership were checked against NIST's OSCAL Rev. 5 catalog (version 5.2.0) and Moderate profile. Every URL in the Sources list was requested on October 20, 2026 (all returned 200, except the Cisco guide, which blocks scripted requests and was read through WebFetch); page titles were compared with the listed titles. No diagram (appendix).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-22-09: resolve DNS using encrypted DNS wherever technically supported | Table, encrypted DNS | verified; quoted; DoH/DoT named by the memo; endpoint, explicit-configuration and FY 2024 plan requirements added | M-22-09 §III.C and "Encrypting DNS traffic" |
| 2 | Evidence lists DoT, DoH and DoQ | Table | restated: DoQ marked "where supported" (the memo names DoH and DoT only) | M-22-09 |
| 3 | Protective DNS: "Route agency DNS egress through CISA-operated Protective DNS, including encrypted DNS" | Table | corrected to the memo's wording: agencies "are already required" to route DNS through CISA-operated infrastructure; memo directed CISA's service to support encrypted DNS; service description added | M-22-09; CISA Protective DNS page |
| 4 | CISA Encrypted DNS Implementation Guidance, May 2024 | Table, Sources | verified; date made exact (May 16, 2024) | CISA resource page |
| 5 | M-21-31: DNS logs at EL-1 | Table | verified and made specific: Passive DNS is an EL1 requirement, EL1 due within one year, includes encrypted DNS, source-host attribution | M-21-31 §II, Table 2, Appendix C |
| 6 | M-08-23 DNSSEC | Table | verified; December 2009 deployment and .gov signing deadline added | M-08-23 |
| 7 | SC-20/SC-21 "sign zones; validate on resolvers" | Table, notes | verified and quoted from control text; SC-20(2) for internal queries added | SP 800-53 Rev. 5 (OSCAL 5.2.0) |
| 8 | SC-22 "fault-tolerant, role-separated" | Table | verified (quote) | SP 800-53 Rev. 5 |
| 9 | TIC 3.0 | Table | added (missing from the series table; required by the brief): five DNS PEP capabilities and Web PEP domain resolution filtering, v3.3 September 2026 | TIC 3.0 SCC v3.3, Table 9 |
| 10 | M-21-07: 80% IPv6-only by end of FY2025 | Table | verified; 20%/FY23 and 50%/FY24 milestones added | M-21-07 |
| 11 | BOD 18-01: DMARC p=reject, SPF and DKIM for second-level domains | Table | corrected: BOD 18-01 requires SPF and DMARC (p=reject on second-level domains and mail-sending hosts by Oct 16, 2018) and CISA as a report recipient; it does not require DKIM | BOD 18-01 |
| 12 | CM-8 continuous accurate inventory | Table | verified against control text; ZTMM kept as supporting | SP 800-53 Rev. 5; CISA ZTMM v2.0 |
| 13 | AU-2, AU-6, AC-2, AC-3, AC-6 | Table | verified; AU-12 and CM-3 added (change control, from Appendix A) | SP 800-53 Rev. 5 |
| 14 | SP 800-81r3: protective DNS, encrypted DNS, DNSSEC, hygiene, logging, DNS as a ZT PEP | Table | verified; quoted the PEP sentence; noted it is guidance, not a mandate | SP 800-81r3 Executive Summary, §1.2 |
| 15 | FedRAMP: authorization at right level plus agency ATO | Table | corrected to FedRAMP 2026 terms: certification of the cloud service; agency authorizes its own system; never a standalone ATO for the CSO | FedRAMP, Using a FedRAMP Certified Cloud Service |
| 16 | Chapter references (Ch 10 for logging, inventory, audit) | Table | corrected to current numbering: logging and evidence → Ch 11; audit/access → Ch 03, Ch 09, Ch 11; FedRAMP → adds Ch 12; checklist in Ch 11 verified | book files |
| 17 | Baseline membership | Notes | added: all mapped controls in Moderate; SC-20(2) not | OSCAL Moderate profile |
| 18 | "Every URL checked as reachable on October 19, 2026" | Sources | updated to October 20, 2026 (re-checked) | — |
| 19 | FedRAMP Marketplace, Infoblox Government Cloud, "authorized at Moderate since December 15, 2022" | Sources | corrected to Marketplace terms: FedRAMP Certified, Class C (Moderate), Rev5, agency path, certified since December 15, 2022 | FedRAMP Marketplace FR2017257053 |
| 20 | Microsoft 365 GCC Marketplace listing | Sources | added (supports Appendix C) | FedRAMP Marketplace MSO365MT |
| 21 | RFC 4033 and RFC 9364 BCP 237, Feb 2023 | Sources | verified; RFC 4034 added | Datatracker RFC 9364; RFC 4034 |
| 22 | RFC 9989 obsoletes RFC 7489 | Sources | verified; also obsoletes RFC 9091 (added) | RFC 9989 |
| 23 | Other IETF entries (882, 1034, 1035, 6891, 7344, 7858, 8484, 9250, 8106, 8555, 6698, 8659) | Sources | verified reachable; titles unchanged | rfc-editor.org |
| 24 | RFC 9276, 9824, 7208, 6376, 8461, 9460, 9848, 9849, CA/B Ballot 187 | Sources | added (cited by Appendix A) | rfc-editor.org; cabforum.org |
| 25 | Azure DNSSEC "public zones only; Private DNS not supported; automatic ZSK rollover" | Sources | verified: signing prerequisite "must be hosted by Azure Public DNS"; ZSK rolled automatically; how-to page added | Learn, DNSSEC overview; How to sign |
| 26 | Azure Government roadmap | Sources | added (supports Appendix C) | Learn, Azure Government GA roadmap |
| 27 | INR "WW Commercial only; Cisco IOS XE SD-WAN 20.4/17.4" | Sources | verified; "not GCC Moderate, GCC High or DoD" made explicit | Learn, INR |
| 28 | Microsoft Learn titles (Private Endpoint DNS, Private Resolver, Private DNS, resolver policy, AVNM IPAM, Azure Gov compare, DoD overview, M365 endpoints, GCC, DNS and AD DS, SRV verify, DoH client) | Sources | verified (titles match) | Learn |
| 29 | AWS Route 53 DNSSEC signing/validation, DNS Firewall | Sources | verified (titles match); alias-records page added | AWS docs |
| 30 | AWS VPC IPAM–Infoblox (Nov 17, 2025; private scopes; not China/GovCloud) | Sources | verified; region restriction is in the announcement, private-scope and Advanced Tier in the user guide | AWS What's New; VPC IPAM User Guide |
| 31 | Google Cloud response policies; internal ranges | Sources | verified (titles match) | Google Cloud docs |
| 32 | Cisco redirect-dns restrictions (IPv4, UDP only, no overlay DNS, 17.8.1a/20.8.1) | Sources | verified | Cisco configuration guide |
| 33 | Infoblox press release, July 22, 2026 | Third-party | verified (Infoblox Government Cloud in AWS GovCloud (US): Universal DDI Management, NIOS-X Servers, Universal Asset Insights); note the Marketplace "certified since" date is December 15, 2022 | Infoblox press release; Marketplace |
| 34 | ESG survey, no public URL | Third-party | kept as stated (unverifiable; already labeled) | — |
| 35 | VMware VCF 9.1 blog, May 15, 2026 | Third-party | verified (title matches) | VMware blog |
| 36 | Vendor integration documentation | Third-party | added as a pointer to Appendix A's individual citations | — |
| 37 | Word download callout | Page | removed per brief | — |
| 38 | Front matter, thesis, callouts, Continue link (Next: Appendix C) | Page | restyled; Next corrected from book home to Appendix C per the reading order | brief |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Italic subtitle line | Thesis line (rewritten) and `description` | — |
| Download this appendix callout | Not carried | brief: remove per-page Word download callouts |
| Requirements Mapping (intro paragraph) | "Compliance-enabling" callout | — |
| Requirements Mapping table (11 rows) | "Requirements mapping" table (12 rows) | TIC 3.0 row added; wording corrected |
| — (new) | "Reading the SP 800-53 controls" | added to explain SC-20/SC-21/SC-22 and baseline |
| Sources (intro) | "Sources" intro | date updated |
| Primary sources: federal requirements and guidance | Same section | TIC, FedRAMP rules and GCC listing added |
| Primary sources: IETF and IANA standards | "IETF, IANA and CA/Browser Forum standards" | record-type RFCs from Appendix A added |
| Primary sources: cloud and platform provider documentation | Same section | Azure Gov roadmap, DNSSEC how-to, DC locator, Route 53 alias added |
| Third-party sources | Same section | integration-documentation pointer added |
| Previous/Next links | "Continue the book" callout | Next now Appendix C |
