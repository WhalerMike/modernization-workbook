# Verification — Appendix B, Requirements Mapping and Sources

Writer W2. All sources opened October 21, 2026. The appendix reuses the verification done for Chapter 03 (see `03-what-tic-3-requires.md` in this folder); entries below cover what the appendix adds or states differently.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Every requirement row in the mapping table | Requirements mapping | verified | As logged for Chapter 03, claims 1–81 |
| 2 | Remote User v2.2 and Cloud v1.2 cover pages; SASE at branches falls under Branch Office and Cloud | Mapping | verified | Use case cover pages; Long Interim §3.1 framing |
| 3 | Protective DNS launched 2022 as E3A successor; mandatory for FCEB; mobile/cloud direct | Mapping (PDNS row) | verified | CISA Protective DNS service page |
| 4 | IA-3 device identification and authentication before connection | Mapping | verified | OSCAL catalog; IA-3 in Moderate profile |
| 5 | SP 800-63B-4 final July 31, 2025, title "Authentication and Authenticator Management" | Mapping, sources | corrected | Branch Edge Gap §10 gave the subtitle "Authentication and Lifecycle Management" (the -3 title); CSRC page title |
| 6 | SP 800-63B-4 reauthentication intervals (30 days/24 h/12 h) | — | not carried | CSRC landing page doesn't show them; Ch04 owns token lifetimes and must verify against the PDF |
| 7 | SP 1800-35 final June 10, 2025 | Sources | verified | CSRC |
| 8 | SP 800-207 August 2020 | Sources | verified | Cited as current in CISA SASE guidance App B; CSRC URL (as in Book 08) |
| 9 | ITU-T G.114 in force May 2003 with Amendments 1 and 2 | Sources | verified | ITU recommendation page |
| 10 | INR quote: WW Commercial, not GCC Moderate, GCC High, DoD, Germany, China | Sources | verified | Microsoft Learn INR page (fetched via Learn MCP) |
| 11 | FedRAMP Marketplace products.json available | Sources | verified | HTTP 200, 4.6 MB |
| 12 | "SASE Roadmap for Federal Civilian Agencies (2023)" doesn't exist in CISA TIC guidance | Cited but don't exist | verified (negative) | Not in core guidance page; not in SASE guidance App B list of federal guidelines |
| 13 | M-22-09 sets no token lifetime | Cited but don't exist | verified | M-22-09 text search; no lifetime requirement |
| 14 | Baseline membership sentence (SC-7, SC-13, AC-17, SI-3, SI-4, CA-7, AU-12 L/M/H; SC-7(4), SC-7(8), SC-8, SC-8(1), AC-4, CM-7(1), CP-8, CP-8(1), CP-8(2) M/H; CP-8(3), CP-8(4) H; SC-8(2)–(5) none) | Reading the controls | verified | OSCAL Low/Moderate/High profiles |
| 15 | DoD ZT figures | Third-party sources | verified (third-party) | DefenseScoop, Breaking Defense |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Branch Edge Gap §2 (2.1–2.6) requirement statements | Mapping rows: M-19-26, SCC, Branch Office, telemetry, M-26-14, BOD 26-04, FedRAMP, GSA EIS; "cited but don't exist" | — |
| Branch Edge Gap §10 "Confirmed" list | Primary source list (OMB, CISA, NIST, FedRAMP, GSA) | Microsoft Kerberos/CAE/hybrid join and RFC 4120 are Ch04/Ch06 sources, cited in those chapters' footnotes |
| Branch Edge Gap §10 "Confirmed as not existing" | "Requirements that are cited but don't exist" | — |
| Branch Edge Gap §10 "Could not be verified" items 1–4 | Resolved: TIC versions (cover pages), SASE guidance (retrieved), CLAW (Comprehensive) — all now verified; item 4 (access-point reduction figures) still omitted | — |
| Long Interim §3 (3.1–3.6) | Mapping rows for Protective DNS, BOD 23-02, BOD 26-02, M-26-15, SC-7 family; "cited but don't exist" | — |
| Long Interim §4 (4.1–4.6) | Mapping rows for SC-8/SC-8(1)/SC-13, CM-7(1)/AC-4, M-22-09, EO 14028, BOD 18-01, SP 800-52, FIPS 140; "Reading the SP 800-53 controls" | — |
| Long Interim §10 Sources | Policy, TIC, standards sources carried into the source list | Microsoft ExpressRoute/endpoint pages, GSA pricing, GAO reports and cost-evidence sources not carried here: they support Ch10, Ch12 and Ch13 and are cited in those chapters, not in a requirement row |
| Field office §4.5 | Branch Office row (Ch 11 in "Addressed in") | — |
| Field office §4.8 / A.2 | SC-7, SC-8, AC-4, SI-4/AU-12, CP-8 rows; CP-8(3) High-only note | BOD 25-01 not a network requirement; omitted |
| Field office §4.9 | Telemetry continuity and Protective DNS rows | — |
| Book 08 Appendix B (format) | Same structure: callout, mapping table, controls notes, sources split primary/third-party | — |

## Notes for the editor

- The source list contains only sources this writer opened. When the other chapters land, add any further requirement-bearing sources they cite (for example Microsoft 365 network connectivity principles for Ch12, or Configuration Manager co-management workloads for Ch11) after checking each URL.
- "Addressed in" chapter assignments follow the division of work in `_BRIEF.md`; confirm against the finished chapters.

## Review fixes, 2026-10-21

Applied from the verified review findings (critique claims re-checked against primary sources on 2026-10-21). Every factual change was re-researched and carries its own footnote; wording-only changes are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| RF-1 | DoD Zero Trust Strategy entry in the source list (line 149) left on DefenseScoop | Third-party sources | unchanged | The official PDF returned HTTP 403 to automated fetch on 2026-10-21 |

**Manual check needed:** as for Chapter 03, open the official PDF in a browser, then list it as the primary source.
