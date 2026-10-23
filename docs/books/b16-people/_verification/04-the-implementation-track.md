# Verification — Chapter 04, The Implementation Track

Writer W2. Source: `docs/compliance/Vol_V_Book_02_Implementation_Track.md` (all sections). Primary sources opened October 22, 2026 (Microsoft Learn via the Learn MCP tools): "Plan a Conditional Access deployment"; "Conditional Access report-only mode"; "Manage emergency access accounts in Microsoft Entra ID"; certification pages for Identity and Access Administrator Associate, Cloud and AI Security Engineer Associate, Endpoint Administrator Associate, Security Operations Analyst Associate, Azure Network Engineer Associate, Azure Database Administrator Associate, Azure Administrator Associate, Information Security Administrator Associate; study guides SC-500, MD-102, AZ-802, AZ-700, DP-300, AZ-104, SC-401; "Exam and assessment lab retirement"; "Course retirement"; Partner Center May 2026 announcements; "Practice Assessments for Microsoft Certifications". NICCS NICE Framework listing (v2.2.0). Workbook chapters read for consistency: Book 03 Ch12, Book 04 Ch03/04/07/08, Book 05 Ch04/09/10, Book 06 Ch15, Book 07 Ch04, Book 08 Ch10, Book 09 Ch05/07, Book 10 Ch05, Book 12 Ch11, Book 15 Ch08/12.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Track audience: engineers and administrators who build and run the estate | Opening | restated-as-design | Source "What This Document Addresses" |
| 2 | NICE v2.2.0 work roles Systems Administration, Network Operations, Infrastructure Support, Database Administration, Systems Security Analysis, Technical Support (IO); Defensive Cybersecurity, Incident Response, Vulnerability Analysis (PD) | Who the track is for | verified (names and categories) | NICCS NICE Framework |
| 3 | Role-to-work-role mapping | Who the track is for | restated-as-design (labelled example) | — |
| 4 | Rule: done = works + evidence lands | Rule of the track | restated-as-design | Source "The rule of the track" |
| 5 | Microsoft: deploy CA in phases; template policies start report-only; test before turning on | Rule, habit 1 | verified | MS Learn Plan a CA deployment; report-only |
| 6 | 802.1X monitor mode first | Rule; Module 6 | verified (settled in Book 09 Ch07 "Monitor mode (weeks 1–4)"); linked | Book 09 Ch07 |
| 7 | Provisioning shadow mode | Rule; Module 2 | verified (settled in Book 03 Ch12); linked | Book 03 Ch12 |
| 8 | Emergency access: ≥2 accounts, cloud-only, excluded from blocking CA, alert on use, validate at least every 90 days | Rule, habit 2 | verified | MS Learn emergency access |
| 9 | Source: "Conditional Access in report-only for 14+ days" | Module 4 | restated-as-design | Source B5 |
| 10 | Lab tiers (fixture, trial tenant, product evaluation) | Rule; capstone | restated-as-design; deferred to Ch06 | Source "Series Context" |
| 11 | Build order DDI → identity → transport → data; parallel modules | Diagram; Order and pairing | restated-as-design (source sequencing, extended) | Source "Module Sequencing" |
| 12 | Certificates before NAC enforcement | Module 3; diagram | restated-as-design (follows from EAP-TLS device certificates in Book 09 Ch07) | Book 09 Ch07 |
| 13 | Address inventory is the join key | Module 1 | verified (settled; Book 12 Ch02); linked | Book 12 Ch02 |
| 14 | AZ-700 covers Azure name resolution and private DNS zones | Module 1 | verified | AZ-700 study guide |
| 15 | SC-300 cert: design, implement, operate IAM with Microsoft Entra; English update Oct 28, 2026 | Module 2; table | verified | MS Learn cert page |
| 16 | SC-500 includes implementing PIM and Conditional Access | Module 4 | verified | SC-500 study guide |
| 17 | AZ-500 retired Aug 31, 2026; replaced by SC-500 | Module 4; table; corrections | corrected (source recommended AZ-500) | MS Learn exam retirement; Partner Center May 2026 |
| 18 | MD-102 / Endpoint Administrator Associate: Intune, Autopilot, Defender for Endpoint, Entra ID; English update Oct 27, 2026 | Module 5; table | verified | MS Learn cert page; MD-102 study guide |
| 19 | AZ-802 Administering Windows Server, includes Arc-enabled Windows Server; tied to Windows Server Hybrid Administrator Associate | Module 5; table | verified | AZ-802 study guide; practice assessments page |
| 20 | AZ-800/AZ-801 retired Sept 30, 2026; AZ-802T00 replacement course | Module 5; table | verified | MS Learn exam retirement; course retirement |
| 21 | DP-300: Azure SQL and SQL Server on-premises; secure environment | Module 7 | verified | DP-300 study guide |
| 22 | AZ-104: Azure Policy, management groups, role assignments | Module 8 | verified | AZ-104 study guide |
| 23 | SC-200: triage, IR, hunting, detection engineering with Defender XDR, Sentinel | Module 9 | verified | MS Learn cert page (updated Oct 21, 2026) |
| 24 | SC-401 Administering Information Security in Microsoft 365; cert name Information Security Administrator Associate | Module 9; table | verified | SC-401 study guide; cert page |
| 25 | MS-102 Microsoft 365 Administrator Expert retiring Nov 30, 2026 | Table | verified | MS Learn exam retirement |
| 26 | Associate/expert/specialty certs expire annually, renewed by free online assessment | Example certifications | verified | AZ-700 / SC-401 study guides "Useful links" |
| 27 | Source vendor list (Infoblox, BlueCat, Cisco U/Networking Academy, SailPoint Identity University, Fortinet/Palo Alto, AWS Skill Builder, SANS, Splunk/Elastic, CISA Learning, OWASP/Linux Foundation, NIST NICE) | Vendor training lines | not carried here; deferred to Chapter 06 (W3 verifies vendor programs) | — |
| 28 | Source: "Microsoft 365 Defender" | Module 9 | corrected in passing (Defender XDR, per SC-200 page) | SC-200 cert page |
| 29 | Source: Viva Learning Graph API → training-effectiveness JSON | B8 | not carried; training record export is Book 14 Ch09 / this book Ch10 | — |
| 30 | Source: Syft/Grype/OpenVEX SBOM pipeline, BOD 26-04 VDR/VER | B7 | not carried here (compliance subject; Book 14 Ch07); SBOM generation mentioned only as a lab inside owning modules | Book 14 Ch07 |
| 31 | Source: "29/29 KSI verdicts", zero-item POA&M target | B8 | removed (internal counts; zero-item target contradicts Book 14 Ch11) | Book 14 Ch11 |
| 32 | Source B1 bound IPAM export as slot-03 network while Book 01 track used slot 2 addressing | Corrections | corrected (internal inconsistency resolved to addressing) | Source A2 vs B1 |
| 33 | "Five-tier VLAN model", "six-step leaver", "CAA + ACME DNS-01" lab specifics | Source B2 | restated generically (internal specifics; workbook books carry the current design) | Books 03, 07, 09 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, FOUO banner, draft callout, Date Code | — | Not carried (stamps, agency shortcode) |
| What This Document Addresses | Opening prose | "Academy" and volume coordinates dropped |
| The rule of the track (callout) | The rule of the track (callout + three habits) | `fedramp_aan_catalog`, `<engine> oscal ksi-ar` dropped; restated as "the paired compliance module's check reads the record" |
| Build-order paragraph | Diagram ch04-build-sequence; Order and pairing | — |
| Prerequisite — Module A0 of Book 01 | Module 0 (links compliance Module 0) | — |
| Module B1 — Landing Zone, IPAM & DDI | Module 1 (DDI) and Module 8 (landing zone) | BlueCat/Infoblox adapters and vendor list → Ch06 |
| Module B2 — Access & Identity Foundations | Modules 2 (identity), 3 (certificates), 6 (NAC portion) | Split into separate modules to match Books 02/03, 07, 09 |
| Closure Necessity — monitor mode | Rule habit 1; Module 6 "lesson the lab teaches" | Doctrine name dropped |
| Module B3 — Network & Telecom | Module 6 | Theme B wording dropped; vendor names → Ch06; Amazon Connect not carried (contact center covered in Book 14 Ch06) |
| Module B4 — Data Platform | Module 7 | — |
| Module B5 — Privileged Access | Module 4 | Break-glass-first and report-only kept and verified |
| Module B6 — Detect & Protect | Module 9 | — |
| Module B7 — Resilience & Governance | Compliance track Modules 6, 7 (Ch03); corrections note | Compliance subjects; engineering labs folded into owning modules |
| Module B8 — Authorize & Operate | Compliance track Modules 8, 9 (Ch03); Module 10 here for operations | Authorization assembly is a compliance-track subject |
| The Capstone — One Module, Evidence-Complete | The capstone | CLI block dropped; "governance substrate's Operator track" dropped (internal); rubric deferred to Ch05 |
| Module Sequencing and Track Pairing (prose + table) | Order and pairing (two tables) | Pairings re-based on new module numbering |
| Series Context — Vol V Book 02 | Opening; links to Ch03, Ch05, Ch06 | — |
| Closing italic colophon | — | Internal KSI statement dropped |
| (new) Modules 5 devices, 8 cloud platform, 10 day-two | Added | Brief requires devices, cloud and day-two operations (Books 05, 10, 15) |
| (new) Example certifications table | Added | Microsoft certifications verified on Microsoft Learn |

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
