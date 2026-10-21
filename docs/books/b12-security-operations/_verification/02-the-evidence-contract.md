# Verification — Chapter 02, Telemetry Is the Precondition: The Evidence Contract

Checked October 21, 2026 by writer W1. Sources: `docs/compliance/Vol_III_Book_07_Multi_Cloud_Evidence_Fabric.md` (2,045 words) and `docs/modernization-specs/telemetry.md` (160 words; archived after the book, so it isn't linked). Both also feed Ch12, which belongs to W6. Here they are carried as far as the contract, the join key and the pipeline; metrics and the ongoing reporting cycle are left to Ch12. Control text comes from NIST's OSCAL catalog (SP 800-53 Rev. 5.2.0). Baseline membership comes from NIST's OSCAL SP 800-53B Moderate and High profiles and from FedRAMP's Rev. 5 baseline workbook (FedRAMP/docs-legacy on GitHub; the former GSA/fedramp-automation repository returned 404). Microsoft claims come from the Microsoft Learn MCP tools. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Five stacks produce five inventories and five formats, so an assessor's estate-wide question can't be answered | Opening | restated-as-design | Vol III Book 07 problem statement (program argument). Product names generalized |
| 2 | AU-3 requires records to establish type, when, where, source, outcome and identity | Contract; decision makers | verified | SP 800-53 AU-3 |
| 3 | Eight-field contract (`asset_id` … `disposition`) | Contract | restated-as-design | Vol III Book 07 table. AU-3 mapping column added; `disposition` marked as not an AU-3 element |
| 4 | Contract is a "closure necessity"; no dashboard recovers a schema the sources never agreed on | Contract | restated-as-design | Vol III Book 07 |
| 5 | Provenance envelope (issuer, source classification, transformation chain, lineage hash); telemetry as control input; deterministic sealed bundles; reproducible; drift findings first-class | Contract | restated-as-design | Telemetry spec (program design) |
| 6 | M-26-14 Level 3 log management: "encrypted in transit and at rest, and regularly hashed for veracity" | Contract | verified (new) | M-26-14 App. C |
| 7 | ASIM is a normalization layer; schemas listed; cross-source detection | Contract | verified (new) | Learn, ASIM overview |
| 8 | ASIM DvcIdType values (MDEid, AzureResourceId, MD4IoTid, VMConnectionId, AwsVpcId, …); FQDN as ID "only as a last resort" | Join key; decision makers | verified (new) | Learn, ASIM common fields; Device entity |
| 9 | CM-8 inventory: accurate, includes all components, no duplicate accounting | Join key | verified | SP 800-53 CM-8 |
| 10 | CMDB reconciles to IPAM/DDI and doesn't replace the join key | Join key; realizations | restated-as-design | Vol III Book 07. Vendor name (ServiceNow) generalized to "IT service management platform" |
| 11 | AU-12(1) text ("system-wide (logical or physical) audit trail that is time-correlated to within …") | Join key; decision makers | verified | SP 800-53 AU-12(1) |
| 12 | AU-8 time stamps in UTC or with offset; M-26-14 requires NTP sync to a traceable source and encourages USNO/NIST | Join key | verified (new) | SP 800-53 AU-8; M-26-14 App. B item 3 |
| 13 | Example story at 06:00 (unpatched, unencrypted segment, out of baseline) | Join key; figure | restated-as-design | Vol III Book 07 illustration |
| 14 | VPC flow logs in a custom format need the *start* attribute, otherwise TimeGenerated is ingestion time. GuardDuty findings export every 6 hours by default; TimeGenerated is the finding's update time | Join key | verified (new) | Learn, Set up your AWS environment for Sentinel |
| 15 | BOD 23-01: discovery every 7 days, enumeration every 14 days, CDM within 72 hours | Join key | verified | BOD 23-01 page |
| 16 | Source: AU-12(1) depends on the naming plane and BOD 23-01; it shares a join key with the patch plane | Join key | restated-as-design | Vol III Book 07 callout (program argument) |
| 17 | All finding streams are records of one contract in one queue | One queue | restated-as-design | Book brief / program design |
| 18 | Finding-stream control assignments (RA-5, SI-2, CM-6, CM-7, AC-3, AC-4, SC-28, SI-4, AU-6) | One queue table | restated-as-design | Labeled as the program's mapping, not a published crosswalk |
| 19 | Defender for Cloud continuous export: recommendations, secure score, alerts, regulatory compliance and attack paths, to Log Analytics or Event Hubs. Sub-recommendations per update and per vulnerability. SecurityAlert/SecurityRecommendation tables. Streaming sends nothing when state doesn't change | One queue; decision makers | verified (new) | Learn, Export alerts and recommendations with continuous export; Set up continuous export |
| 20 | DLP alerts go to the Defender XDR incident queue and correlate with MDE/MDO/Sentinel. A built-in tuning rule (early Oct 2026) turns DLP signals into behaviors that don't appear in the queue; disabling the rule restores them | One queue; decision makers | verified (new) | Learn, Investigate DLP alerts with Microsoft Defender XDR |
| 21 | Disposition: applied / accepted risk with POA&M reference / open. Only the AO accepts residual risk | One queue | restated-as-design | Vol III Book 07 field definition. AO rule from settled Book 01 Ch09 |
| 22 | Source: Sentinel ingests "AWS (Security Hub / GuardDuty / CloudTrail), OCI, GCP, and NEM syslog/CEF" | Realizations | corrected | Learn lists CloudTrail, VPC Flow Logs, GuardDuty and CloudWatch for the AWS S3 connector, plus syslog/CEF via an AMA log forwarder. Security Hub, OCI and GCP were not verified and aren't carried |
| 23 | Source: Sentinel and Splunk Cloud are both "owned", run as dual-SIEM redundancy; ServiceNow is owned; both are FedRAMP-authorized; a "Microsoft-preference rule" applies | Realizations | restated-as-design / removed | Agency-specific ownership and procurement facts removed (the workbook is agency-agnostic). Generalized to "a second SIEM can run the same contract." Marketplace status not asserted; readers sent to the Marketplace and Book 10 |
| 24 | "The fabric mandates the contract, never the vendor" | Realizations | restated-as-design | Vol III Book 07 |
| 25 | CDM Agency and Federal Dashboards; agency dashboards push summarized information onward | Realizations | verified | CISA CDM page |
| 26 | Pipeline: emit, normalize, correlate, aggregate, roll up to CDM, attest | Pipeline | restated-as-design | Vol III Book 07 |
| 27 | CA-7 items d–g (ongoing monitoring; correlation and analysis; response actions; reporting) | Pipeline | verified | SP 800-53 CA-7 |
| 28 | SP 800-137 ISCM purpose | Pipeline | verified | SP 800-137 §2 |
| 29 | AU-6(1), AU-6(3), SI-4(16) statement text | Pipeline | verified | SP 800-53 |
| 30 | OSCAL assessment layer: assessment plan, assessment results, POA&M | Pipeline | verified (new) | pages.nist.gov OSCAL layers and models |
| 31 | KSI-MLA-OSM related controls include AU-3, AU-6(1), AU-6(3), AU-8, AU-12(1) and SI-4(16). KSIs bind CSPs | Pipeline | verified (new) | fedramp.gov 2026 MLA page |
| 32 | Source: FedRAMP 20x KSI pipeline is one of "the two consumers a federal agency owes" | Opening; pipeline | corrected | KSIs apply to cloud service providers. The chapter names CDM as the consumer an agency owes and treats the KSI control set as program design for the agency's own estate |
| 33 | Source authorities table: every control, AU-12(1) included, gated at "FedRAMP Moderate" | Controls table; decision makers | corrected | FedRAMP Rev. 5 workbook: AU-3, AU-8, AU-12, AU-6(1), AU-6(3), SI-4(16), CA-7 are in Moderate; AU-12(1) is High only. NIST SP 800-53B: AU-12(1) High only; SI-4(16) in neither NIST baseline (FedRAMP adds it at Moderate). At Moderate the program selects AU-12(1) by design |
| 34 | FedRAMP marked its Rev. 5 baseline workbook legacy on June 23, 2026, being replaced by the Consolidated Rules for 2026 | Controls table | verified (new) | Workbook COVERSHEET legacy notice |
| 35 | Source: "M-26-14 … replaced its EL0–EL3 tiers with a five-level maturity model scored to the lowest watermark" | (Ch01 claims 6–8) | verified | M-26-14 App. C note 8. The source's M-26-14 reference row linked the M-21-31 PDF; corrected to the M-26-14 PDF in Ch01/Ch02 footnotes |
| 36 | Source: authorities AU-12 and AU-3 driven by "OMB M-26-14"; AU-12(1) by "CISA BOD 23-01" | Controls table | restated-as-design | Driver attribution is the source's mapping; the chapter cites the documents for what they say and leaves the per-control driver detail to the compliance volume (linked) |
| 37 | None of these controls is attestable by a single-tenant scan ("Tool-attestable? No") | Controls table | restated-as-design | Vol III Book 07 (program position) |
| 38 | `_GetWatchlist()` returns watchlist items and joins on SearchKey | Coverage query | verified (new) | Learn, Build queries with watchlists |
| 39 | Heartbeat written by agents once a minute; `Computer`, `TimeGenerated` columns | Coverage query | verified (new) | Learn, Heartbeat table reference |
| 40 | `FMP-AssetInventory` watchlist name and columns | Coverage query | restated-as-design | Program example, flagged in the warning callout |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Book 07: front matter, title, subtitle, aliases, format keys | Ch02 front matter (title per brief) | Site plumbing |
| Book 07: internal-distribution banner | — | Agency-profile banner; not carried |
| Book 07: "Draft Proposal — Subject to Review" callout and Date Code | — | Stamps dropped per brief |
| Book 07: "Provisional position" callout (drafted at temporary slot 23) | — | Internal numbering note; not carried |
| Book 07: "Series Context" callout (doctrine; native stacks emit the same record; CDM and KSIs; truth plane, plane 6) | Ch02 opening and case box; Ch01 "What the program adds" | Plane numbering and the doctrine label not carried; vendor list generalized |
| Book 07 § What This Document Addresses | Ch02 "Five stacks, five inventories" | KSI-as-agency-obligation corrected (claim 32) |
| Book 07: "What this book is not" callout (boundary with SIEM/XDR and ConMon books) | Ch02 "Five stacks", boundary paragraph | Cross-references re-pointed to Ch05, Ch11 and planned Book 14 |
| Book 07 § The Evidence Contract (AU-3), field table | Ch02 "The contract: one record, every source" | AU-3 mapping column added |
| Book 07 § The Join Key (AU-12(1)), 06:00 example | Ch02 "The join key"; figure ch02-one-asset-one-story | — |
| Book 07: Closure Necessity callout (correlation depends on the naming plane; BOD 23-01; shared with patch book) | Ch02 "The join key", last paragraph | — |
| Book 07 § Realizations table | Ch02 "Realizing the contract" | Corrected/generalized per claims 22–23 |
| Book 07 § Realizations, guardrail ("contract, never the vendor") | Ch02 "Realizing the contract" | — |
| Book 07 § Continuous-Monitoring Pipeline (CA-7; M-26-14; SP 800-137; AU-6(1); SI-4(16)) | Ch02 "The continuous-monitoring pipeline" | AU-6(3) added (in the FedRAMP Moderate baseline and the KSI-MLA-OSM related controls) |
| Book 07 § NIST 800-53 Control Closure (generated authorities table) | Ch02 "Controls this chapter closes" | Rebuilt by hand with a verified baseline column (claim 33); generator provenance note not carried; GitHub link to the volume for depth |
| Book 07 § FedRAMP 20x KSI Alignment | Ch02 "The continuous-monitoring pipeline" (KSI-MLA-OSM related controls) | Reframed: KSIs bind CSPs; the program uses the control set as design |
| Book 07: Realization Selection Status callout (agency owns Sentinel and Splunk; ServiceNow; Microsoft preference) | Ch02 "Realizing the contract" (generalized) | Agency-specific ownership removed (claim 23) |
| Book 07 § References table | Ch02 footnotes | Each reference re-verified. The M-26-14 row's M-21-31 URL replaced. Vendor Marketplace links (Splunk, ServiceNow) not carried |
| Telemetry spec: title, contract requirements (canonical claim form; control input; provenance envelope; deterministic bundles; drift findings first-class) | Ch02 "The contract" (provenance paragraph) | Program design |
| Telemetry spec: integration shape (normalized to one claim shape before any SIEM; reproducible from raw telemetry plus authoritative source) | Ch02 "The contract" (provenance and ASIM paragraphs) | — |
| Telemetry spec: control mapping (CA, AU, SI families; regenerable, hash-verifiable evidence) | Ch02 "Controls this chapter closes"; M-26-14 hashing note | Ch12 (W6) may carry the regeneration detail further |
| Telemetry spec: closing "cleaned extraction" note | — | Editorial note; not carried |
| (New) Coverage query | Ch02 "Checking coverage against the inventory" | Implements Ch01's coverage check; illustrative |
