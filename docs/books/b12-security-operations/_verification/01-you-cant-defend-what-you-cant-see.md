# Verification — Chapter 01, You Can't Defend What You Can't See

Checked October 21, 2026 by writer W1. Source: `docs/compliance/Vol_III_Book_00_Security_Operations_Overview.md` (550 words: volume purpose, books table, fit with the program, optional substrate binding). Most of the chapter is new framing the book brief requires (warehouse vs detection, the six planes, silent gaps, federal drivers), so most claims below are new and were researched from scratch. Federal PDFs (OMB M-26-14, TIC 3.0 Program Guidebook v1.2, CISA Microsoft Expanded Cloud Logs Playbook May 2026, NIST SP 800-137) were downloaded and their text extracted. NIST SP 800-53 Rev. 5.2.0 control text was read from NIST's OSCAL catalog JSON. CISA HTML pages were fetched directly, and Microsoft claims came from the Microsoft Learn MCP tools. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AU-12 generates records. AU-6 requires review and analysis "for indications of" inappropriate or unusual activity, plus reporting and adjustment when risk changes. SI-4 requires detecting attacks and analyzing events | Warehouse; decision makers | verified (new) | SP 800-53 Rev. 5.2.0 OSCAL catalog, AU-6, AU-12, SI-4 statements |
| 2 | M-26-14 (May 22, 2026) rescinded M-21-31 "effective immediately." Reason given: retention "without clear utility" wasn't feasible or cost-effective. Replaced by a risk-based, prioritized approach | Federal drivers | verified | M-26-14 pp. 1–2 |
| 3 | Two objectives, CEM and THIRF, for all systems owned or operated by or for the agency, including IoT and OT | Warehouse; planes; drivers | verified | M-26-14 "Prioritization" |
| 4 | "Searchable" means immediately usable, with detections applied without preparation. "Retrievable" means usable after intermediary steps. Six months and one year | Warehouse; drivers | verified | M-26-14 App. B item 1, notes 6–7 |
| 5 | Baseline item 5(k): "Generating appropriate automated alerts for all of the above" | Warehouse | verified | M-26-14 App. B item 5 |
| 6 | Maturity model: Levels 0–4 across five elements. Collection Operations is scored by the share of the baseline with actionable alerts (<50%, 50–70%, ≥70%, ≥95%). Overall maturity is the lowest watermark | Warehouse; decision makers | verified (new) | M-26-14 App. C and note 8. Consistent with the source's "five-level … lowest watermark" (Vol III Book 07) |
| 7 | Level 1 is named "Initial" in the table and "Basic" in the action timeline | Warehouse | verified (new) | M-26-14 p. 4 vs App. C |
| 8 | Levels 1, 2 and 3 due within 120, 180 and 320 days of the LRA. Plan due within 90 days. LRA published Aug 20, 2026 | Warehouse; drivers | verified | M-26-14 "Agency Actions"; CISA Logging page (publish date). Calendar dates left to Book 00 Ch01 |
| 9 | Sentinel has an analytics tier and a data lake tier. Quote: "You can't run analytics rules or custom detections on data in the data lake tier … don't generate alerts" | Warehouse; silent gaps | verified (new) | Learn, data lake direct ingestion guidance |
| 10 | Lake-only data may meet retention but not M-26-14's alerting measure | Warehouse | restated-as-design | Program reading, labeled as such in the text |
| 11 | Six planes: identity, cloud platform, M365, endpoints, network, data | Planes | restated-as-design | Book brief / program design |
| 12 | Plane-to-baseline mapping, items (a)–(j) | Planes table | verified (quoted items) / restated-as-design (mapping) | M-26-14 App. B item 5 text. The mapping is labeled program design |
| 13 | Azure resource logs aren't collected by default and need a diagnostic setting per resource. Activity log kept 90 days | Silent gaps | verified (new) | Learn, Activity log; Resource logs |
| 14 | AWS S3 connector status "indicates that a collection rule exists; it doesn't indicate that data was ingested" | Silent gaps; decision makers | verified (new) | Learn, Troubleshoot AWS S3 connector issues |
| 15 | SentinelHealth has to be turned on, and it supports only the listed connectors | Silent gaps | verified (new) | Learn, Monitor the health of your data connectors |
| 16 | "Tampering with or disabling logging capabilities is a well-documented threat actor behavior" | Silent gaps | verified (new) | CISA Expanded Cloud Logs Playbook (May 2026), §2.1 |
| 17 | 2023 Exchange Online intrusion. First detected by a federal victim's in-house alert on mailbox-access logs that were then available only with Purview Audit (Premium). Microsoft used MailItemsAccessed to identify victims, then expanded the logs to E3/G3 and above and raised Audit Standard retention from 90 to 180 days | Silent gaps | verified (new) | CISA playbook background and FAQ. The playbook names the agencies involved. The chapter deliberately leaves them out, per the no-agency rule |
| 18 | M-26-14 directs agencies to use CDM, HWAM and SWAM data to determine log coverage. The inventory element starts at 70% at Level 1 | Silent gaps; decision makers | verified | M-26-14 App. B item 4; App. C |
| 19 | BOD 25-01 (Dec 17, 2024): tenant inventory, deploy SCuBA tools, mandatory policies by June 20, 2025. Report via "CISA's continuous monitoring solution" or by quarterly manual submission in a machine-readable format | Drivers | verified | BOD 25-01 page. BOD 25-01 doesn't mention CLAW or logging (confirmed) |
| 20 | BOD 25-01 automated reporting has two routes: CISA-hosted ScubaConnect (results via the CDM dashboard), or agency-hosted ScubaConnect with CLAW/TALON integration, run at least quarterly | Drivers; decision makers | verified (new) | CISA BOD 25-01 Implementation Guidance, updated July 27, 2026 |
| 21 | CLAW definition. Deployed because cloud traffic no longer passes the EINSTEIN sensors. C-CIRA (formerly NCIRA) gives the telemetry guidance | Drivers | verified | TIC 3.0 Program Guidebook v1.2 §13, App. C |
| 22 | TIC "does not replace or negate" telemetry requirements, including sharing with CISA. The Catalog doesn't detail the telemetry owed to CISA. Information cycle step 3: agencies provide telemetry to CISA | Drivers | verified | Guidebook §10, §10.1 (source supplied by the coordinator; opened and read) |
| 23 | The Guidebook's July 2025 revision changed "Cloud" to "Comprehensive" for CLAW | Drivers | verified | Guidebook revision history; consistent with Book 09 Ch03 |
| 24 | ED 26-03 V1 (Mar 11, 2026) required all Cisco SD-WAN syslog through CLAW by Mar 23, 2026, plus other applicable cloud logs | Drivers; decision makers | verified (new) | CISA V1 ED 26-03 page. The directive uses "Cloud Logging Aggregation Warehouse," which the text notes |
| 25 | BOD 23-01 (Oct 3, 2022): discovery every 7 days, enumeration every 14 days including roaming devices, results in the CDM dashboard within 72 hours. "Basic pre-condition" quote | Decision makers; drivers | verified | BOD 23-01 page |
| 26 | CDM delivers tools, integration services and dashboards. Agency dashboards push summarized information onward | Drivers | verified | CISA CDM program page |
| 27 | SP 800-137 definition of ISCM | Drivers | verified | SP 800-137 §1/§2 |
| 28 | KSI-MLA-OSM: a SIEM, persistently reviewed, for centralized tamper-resistant logging. KSI-MLA-RVL: "Logs are persistently reviewed and audited." KSIs bind CSPs | Drivers | verified (new) | fedramp.gov 2026 MLA page (updated Oct 13, 2026) |
| 29 | Source: evidence "flows to CISA CDM and the FedRAMP 20x KSI pipeline," treated as what an agency owes | What the program adds; drivers | corrected | KSIs apply to cloud service providers seeking FedRAMP. The chapter says instead that the program uses the same distinction for its own estate |
| 30 | Actuation is platform-native while governance and evidence are unified. The question is "which native stack actuates, and how does its evidence join" | What the program adds | restated-as-design | Vol III Book 00 (program doctrine) |
| 31 | Security operations depends on the naming-plane join key (CM-8). Five stacks produce five inventories | What the program adds | restated-as-design | Vol III Book 00; developed in Ch02 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Book 00: front matter, title, subtitle, aliases, format keys | Ch01 front matter (new title per brief) | Quarto format keys and aliases are site plumbing |
| Book 00: internal-distribution banner (profile-gated) | — | Agency-profile banner; not carried |
| Book 00: "Draft Proposal — Subject to Review" callout and Date Code | — | Stamps dropped per brief |
| Book 00 § Volume Purpose: the doctrine split (actuation platform-native; governance and evidence unified into one contract flowing to CDM and KSIs) | Ch01 "What the program adds" | The coined doctrine name isn't carried; the substance is kept as program design. The KSI claim is corrected (claim 29) |
| Book 00 § Volume Purpose ("not which single console runs everything") | Ch01 "What the program adds" | — |
| Book 00 § Books in This Volume (table of seven books) | Ch01 "How the rest of the book is organized" | Replaced by this book's chapter map; per-book content is in Ch03–Ch12. Vendor names in the PAM row aren't carried; PAM belongs to Book 04 |
| Book 00 § How This Volume Fits: depends on the naming-plane join key (Vol I Book 01, CM-8); produces evidence for Vol IV Book 06 | Ch01 "What the program adds"; Ch02 join key | Volume cross-references replaced by GitHub links to the two compliance books and links to Books 08 and 10 |
| Book 00 § How This Volume Fits: "truth separated from enforcement"; truth plane vs enforcement planes | Ch01 "What the program adds" (actuation vs evidence) | Internal plane labels not carried |
| Book 00 § Where This Volume's Evidence Lands — Volume X (optional governance-substrate binding) | — | Engine-specific optional binding; not carried, because the workbook names no engine. Book 13 may treat governance evidence in general terms |
| Book brief requirements (warehouse vs detection, planes, silent gaps, federal drivers) | Ch01 sections on each | New content; claims 1–28 |
