# Verification — Appendix A, Control Crosswalk

Writer W7. Source: `docs/compliance/Vol_0_Book_02_Control_Crosswalk.md` (master table of 149 controls, coverage-by-volume table, KSI view, notes, and the generated "addressed but not yet closed" list).

Method, all on October 21, 2026:

- Control list parsed from the source's master table (149 rows); the "not yet closed" list (96 rows) taken from the same file.
- Titles: CSRC Cybersecurity and Privacy Reference Tool JSON export for SP_800_53_5_2_0 (csrc.nist.gov; the export arrived truncated twice in the relationships section, but every element title and the baseline relationships for all 149 controls were present) and the NIST OSCAL catalog 5.2.0 (last modified May 11, 2026). Every title matched between the two.
- NIST baselines: NIST OSCAL Low, Moderate, High and Privacy baseline profiles (usnistgov/oscal-content), cross-checked against the SB-Low, SB-Moderate, SB-High and PB-Yes relationships in the CPRT export: 0 differences across 149 controls. The SP 800-53B release 5.2.0 page confirms no baseline changes.
- FedRAMP classes: FedRAMP Full Rev5 Control Reference, 18 family pages fetched (AC, AT, AU, CA, CM, CP, IA, IR, MP, PL, PM, PS, PT, RA, SA, SC, SI, SR); "FedRAMP Rev5 Baselines" tags parsed under each control heading. The PM and PT pages carry no baseline line at all.
- Workbook chapter: grep of every B00–B13 page for each control identifier (counts per file), then chosen by subject. Where a control appears only in an appendix crosswalk, the chapter was chosen by reading the subject: AC-2(3) to B03 Ch08 (leaver disablement); IA-9 to B06 Ch09–10 (per B06 App A); PM-5 to B06 Ch04; SA-9(2) to B09 Ch12 (endpoint, address and port tables); SC-7(7) to B09 Ch12 (split tunneling); SC-5 to B09 App A (resiliency row); PL-8 to B00 Ch04 and B01 Ch03 (judgment call, weakest mapping in the table).
- Status (design): Closed = the source lists a machine-checked closure AND a B00–B13 chapter carries the control; Partly closed = exactly one of the two; Open = neither. Labeled as design throughout. B14 chapter links point to files named in the book brief that other writers are producing.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | IDs and titles of all 149 controls, release 5.2.0 | Tables | verified | CSRC CPRT export; OSCAL catalog |
| 2 | Release 5.2.0 issued August 27, 2025 | How to read | verified | CSRC SP 800-53 Rev. 5 page, planning note |
| 3 | SP 800-53B 5.2.0 made no baseline changes; privacy baseline applies irrespective of impact level | How to read | verified | CSRC SP 800-53B page |
| 4 | NIST baseline per control | Tables | verified (OSCAL and CPRT agree on all rows) | OSCAL profiles; CPRT |
| 5 | FedRAMP class per control | Tables | verified | FedRAMP Full Rev5 Control Reference |
| 6 | Class B = Li-SaaS and Low, C = Moderate, D = High | How to read | verified | FedRAMP NTC-0004, Feb 25, 2026 |
| 7 | SC-8, SC-8(1), SC-28 NIST M H but FedRAMP B C D | What it shows | verified | as 4, 5 |
| 8 | SI-2(3), SI-4(16) NIST none, FedRAMP C D; AU-6(4) NIST none, FedRAMP D | What it shows | verified | as 4, 5 |
| 9 | AU-12(1), SC-12(1), AU-10 H and D only | What it shows | verified | as 4, 5 |
| 10 | CA-5 in L M H, no FedRAMP class listed | What it shows | verified (a draft explanation of why was removed as unverified) | as 4, 5 |
| 11 | AT-2(1), AT-3(3), CA-7(3), IA-3(1), IA-9, SI-4(7) in no NIST or FedRAMP baseline | What it shows | verified | as 4, 5 |
| 12 | PM and PT carry no FedRAMP class; PT and PM-7, 9, 11, 14 privacy baseline only; other PM none | What it shows | verified | as 4, 5 |
| 13 | Class doesn't replace agency categorization; agency starts from the NIST baseline its categorization selects | What it shows | verified (FedRAMP page); the "starting point" phrasing is guidance | FedRAMP "Using a FedRAMP Certified Cloud Service" |
| 14 | 2026 KSIs: 46 indicators in 10 themes, e.g. KSI-CED-RAT; no KSI-022 | Corrections | verified (46 IDs parsed; themes CED, CMT, CNA, IAM, INR, MLA, PIY, RPL, SCR, SVC) | FedRAMP KSI page |
| 15 | KSIs bind providers, not agencies | Corrections | verified (settled in brief; Book 12 Ch12, Book 13 Ch11) | FedRAMP KSI page |
| 16 | Source's per-control "FedRAMP 20x KSI" column (KSI-IAM, KSI-MLA, KSI-022 …) | Corrections | corrected; column not carried | FedRAMP KSI page |
| 17 | Status per control (closed, partly closed, open) | Tables | restated-as-design | source not-closed list plus chapter grep |
| 18 | Chapter carrying each control | Tables | restated-as-design (workbook mapping) | grep of B00–B13 |
| 19 | Source's counts (149 controls, 53 and 96, per-volume counts, 21 of 72 books, 13 of 106 tests, 146 to 149) | — | removed (internal, dated) | — |

## Per-control check (titles, baselines, classes)

| Control | NIST title (5.2.0) | Source title matched | NIST SP 800-53B (OSCAL = CPRT) | FedRAMP 2026 |
|---|---|---|---|---|
| AC-2 | Account Management | yes | L M H | B C D |
| AC-2(1) | Automated System Account Management | yes | M H | C D |
| AC-2(3) | Disable Accounts | yes | M H | C D |
| AC-2(4) | Automated Audit Actions | yes | M H | C D |
| AC-2(13) | Disable Accounts for High-risk Individuals | yes | M H | C D |
| AC-3 | Access Enforcement | yes | L M H | B C D |
| AC-4 | Information Flow Enforcement | yes | M H | C D |
| AC-5 | Separation of Duties | yes | M H | C D |
| AC-6 | Least Privilege | yes | M H | C D |
| AC-6(1) | Authorize Access to Security Functions | yes | M H | C D |
| AC-6(2) | Non-privileged Access for Nonsecurity Functions | yes | M H | C D |
| AC-6(5) | Privileged Accounts | yes | M H | C D |
| AC-6(9) | Log Use of Privileged Functions | yes | M H | C D |
| AC-6(10) | Prohibit Non-privileged Users from Executing Privileged Functions | yes | M H | C D |
| AC-7 | Unsuccessful Logon Attempts | yes | L M H | B C D |
| AC-11 | Device Lock | yes | M H | C D |
| AC-12 | Session Termination | yes | M H | C D |
| AC-17 | Remote Access | yes | L M H | B C D |
| AC-19 | Access Control for Mobile Devices | yes | L M H | B C D |
| AC-20 | Use of External Systems | yes | L M H | B C D |
| AT-2 | Literacy Training and Awareness | yes | L M H + Privacy | B C D |
| AT-2(1) | Practical Exercises | yes | none | none |
| AT-2(2) | Insider Threat | yes | L M H | B C D |
| AT-3 | Role-based Training | yes | L M H + Privacy | B C D |
| AT-3(3) | Practical Exercises | yes | none | none |
| AT-3(5) | Processing Personally Identifiable Information | yes | none + Privacy | none |
| AT-4 | Training Records | yes | L M H + Privacy | B C D |
| AU-2 | Event Logging | yes | L M H + Privacy | B C D |
| AU-3 | Content of Audit Records | yes | L M H | B C D |
| AU-6 | Audit Record Review, Analysis, and Reporting | yes | L M H | B C D |
| AU-6(1) | Automated Process Integration | yes | M H | C D |
| AU-6(4) | Central Review and Analysis | yes | none | D |
| AU-7 | Audit Record Reduction and Report Generation | yes | M H | C D |
| AU-8 | Time Stamps | yes | L M H | B C D |
| AU-9 | Protection of Audit Information | yes | L M H | B C D |
| AU-10 | Non-repudiation | yes | H | D |
| AU-11 | Audit Record Retention | yes | L M H + Privacy | B C D |
| AU-12 | Audit Record Generation | yes | L M H | B C D |
| AU-12(1) | System-wide and Time-correlated Audit Trail | yes | H | D |
| CA-2 | Control Assessments | yes | L M H + Privacy | B C D |
| CA-3 | Information Exchange | yes | L M H | B C D |
| CA-5 | Plan of Action and Milestones | yes | L M H + Privacy | none |
| CA-6 | Authorization | yes | L M H + Privacy | B C D |
| CA-7 | Continuous Monitoring | yes | L M H + Privacy | B C D |
| CA-7(1) | Independent Assessment | yes | M H | C D |
| CA-7(3) | Trend Analyses | yes | none | none |
| CM-2 | Baseline Configuration | yes | L M H | B C D |
| CM-3 | Configuration Change Control | yes | M H | C D |
| CM-5 | Access Restrictions for Change | yes | L M H | B C D |
| CM-6 | Configuration Settings | yes | L M H | B C D |
| CM-7 | Least Functionality | yes | L M H | B C D |
| CM-7(1) | Periodic Review | yes | M H | C D |
| CM-8 | System Component Inventory | yes | L M H | B C D |
| CP-2 | Contingency Plan | yes | L M H | B C D |
| CP-2(1) | Coordinate with Related Plans | yes | M H | C D |
| CP-2(8) | Identify Critical Assets | yes | M H | C D |
| CP-3 | Contingency Training | yes | L M H | B C D |
| CP-4 | Contingency Plan Testing | yes | L M H | B C D |
| CP-4(1) | Coordinate with Related Plans | yes | M H | C D |
| CP-6 | Alternate Storage Site | yes | M H | C D |
| CP-6(1) | Separation from Primary Site | yes | M H | C D |
| CP-7 | Alternate Processing Site | yes | M H | C D |
| CP-7(1) | Separation from Primary Site | yes | M H | C D |
| CP-7(3) | Priority of Service | yes | M H | C D |
| CP-8 | Telecommunications Services | yes | M H | C D |
| CP-8(1) | Priority of Service Provisions | yes | M H | C D |
| CP-9 | System Backup | yes | L M H | B C D |
| CP-10 | System Recovery and Reconstitution | yes | L M H | B C D |
| IA-2 | Identification and Authentication (Organizational Users) | yes | L M H | B C D |
| IA-2(1) | Multi-factor Authentication to Privileged Accounts | yes | L M H | B C D |
| IA-2(2) | Multi-factor Authentication to Non-privileged Accounts | yes | L M H | B C D |
| IA-3 | Device Identification and Authentication | yes | M H | C D |
| IA-3(1) | Cryptographic Bidirectional Authentication | yes | none | none |
| IA-4 | Identifier Management | yes | L M H | B C D |
| IA-5 | Authenticator Management | yes | L M H | B C D |
| IA-5(1) | Password-based Authentication | yes | L M H | B C D |
| IA-5(2) | Public Key-based Authentication | yes | M H | C D |
| IA-9 | Service Identification and Authentication | yes | none | none |
| IA-11 | Re-authentication | yes | L M H | B C D |
| IR-2 | Incident Response Training | yes | L M H + Privacy | B C D |
| IR-4 | Incident Handling | yes | L M H + Privacy | B C D |
| IR-6 | Incident Reporting | yes | L M H + Privacy | B C D |
| IR-8 | Incident Response Plan | yes | L M H + Privacy | B C D |
| MP-2 | Media Access | yes | L M H | B C D |
| MP-3 | Media Marking | yes | M H | C D |
| MP-4 | Media Storage | yes | M H | C D |
| MP-5 | Media Transport | yes | M H | C D |
| PL-8 | Security and Privacy Architectures | yes | M H + Privacy | B C D |
| PM-1 | Information Security Program Plan | yes | none | none |
| PM-2 | Information Security Program Leadership Role | yes | none | none |
| PM-5 | System Inventory | yes | none | none |
| PM-7 | Enterprise Architecture | yes | none + Privacy | none |
| PM-9 | Risk Management Strategy | yes | none + Privacy | none |
| PM-11 | Mission and Business Process Definition | yes | none + Privacy | none |
| PM-14 | Testing, Training, and Monitoring | yes | none + Privacy | none |
| PM-15 | Security and Privacy Groups and Associations | yes | none | none |
| PM-30 | Supply Chain Risk Management Strategy | yes | none | none |
| PS-4 | Personnel Termination | yes | L M H | B C D |
| PS-5 | Personnel Transfer | yes | L M H | B C D |
| PT-1 | Policy and Procedures | yes | none + Privacy | none |
| PT-2 | Authority to Process Personally Identifiable Information | yes | none + Privacy | none |
| PT-3 | Personally Identifiable Information Processing Purposes | yes | none + Privacy | none |
| PT-4 | Consent | yes | none + Privacy | none |
| PT-5 | Privacy Notice | yes | none + Privacy | none |
| PT-7 | Specific Categories of Personally Identifiable Information | yes | none + Privacy | none |
| RA-3 | Risk Assessment | yes | L M H + Privacy | B C D |
| RA-5 | Vulnerability Monitoring and Scanning | yes | L M H | B C D |
| RA-5(2) | Update Vulnerabilities to Be Scanned | yes | L M H | B C D |
| RA-5(5) | Privileged Access | yes | M H | C D |
| SA-8 | Security and Privacy Engineering Principles | yes | L M H | B C D |
| SA-9 | External System Services | yes | L M H + Privacy | B C D |
| SA-9(2) | Identification of Functions, Ports, Protocols, and Services | yes | M H | C D |
| SA-11 | Developer Testing and Evaluation | yes | M H + Privacy | C D |
| SA-15 | Development Process, Standards, and Tools | yes | M H | C D |
| SC-5 | Denial-of-service Protection | yes | L M H | B C D |
| SC-7 | Boundary Protection | yes | L M H | B C D |
| SC-7(3) | Access Points | yes | M H | C D |
| SC-7(5) | Deny by Default — Allow by Exception | wording only | M H | C D |
| SC-7(7) | Split Tunneling for Remote Devices | yes | M H | C D |
| SC-7(8) | Route Traffic to Authenticated Proxy Servers | yes | M H | C D |
| SC-8 | Transmission Confidentiality and Integrity | yes | M H | B C D |
| SC-8(1) | Cryptographic Protection | yes | M H | B C D |
| SC-12 | Cryptographic Key Establishment and Management | yes | L M H | B C D |
| SC-12(1) | Availability | yes | H | D |
| SC-13 | Cryptographic Protection | yes | L M H | B C D |
| SC-17 | Public Key Infrastructure Certificates | yes | M H | C D |
| SC-20 | Secure Name/Address Resolution Service (Authoritative Source) | yes | L M H | B C D |
| SC-21 | Secure Name/Address Resolution Service (Recursive or Caching Resolver) | yes | L M H | B C D |
| SC-22 | Architecture and Provisioning for Name/Address Resolution Service | yes | L M H | B C D |
| SC-28 | Protection of Information at Rest | yes | M H | B C D |
| SI-2 | Flaw Remediation | yes | L M H | B C D |
| SI-2(2) | Automated Flaw Remediation Status | yes | M H | C D |
| SI-2(3) | Time to Remediate Flaws and Benchmarks for Corrective Actions | yes | none | C D |
| SI-3 | Malicious Code Protection | yes | L M H | B C D |
| SI-4 | System Monitoring | yes | L M H | B C D |
| SI-4(2) | Automated Tools and Mechanisms for Real-time Analysis | yes | M H | C D |
| SI-4(4) | Inbound and Outbound Communications Traffic | yes | M H | C D |
| SI-4(7) | Automated Response to Suspicious Events | yes | none | none |
| SI-4(16) | Correlate Monitoring Information | yes | none | C D |
| SI-5 | Security Alerts, Advisories, and Directives | yes | L M H | B C D |
| SI-12 | Information Management and Retention | yes | L M H + Privacy | B C D |
| SR-1 | Policy and Procedures | yes | L M H | B C D |
| SR-2 | Supply Chain Risk Management Plan | yes | L M H | B C D |
| SR-3 | Supply Chain Controls and Processes | yes | L M H | B C D |
| SR-5 | Acquisition Strategies, Tools, and Methods | yes | L M H | B C D |
| SR-6 | Supplier Assessments and Reviews | yes | M H | C D |
| SR-8 | Notification Agreements | yes | L M H | B C D |
| SR-10 | Inspection of Systems or Components | yes | L M H | B C D |
| SR-11 | Component Authenticity | yes | L M H | B C D |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Draft-proposal banner, internal banner, Date Code | Not carried | Internal status stamps; agency shortcode |
| Purpose | Intro, In this appendix | Volume numbering and counts dropped |
| Maintenance status (generated slice, render scripts, CI gate) | Status definitions (proof recorded in the authoritative record) | Internal tooling, file names and counts dropped |
| How this crosswalk was built | How to read; compliance-claim callout | Volume VI and VII–IX layering replaced by workbook chapters |
| Coverage-pointer note | Callout "A coverage index, not a compliance claim" | — |
| Master control crosswalk (149 rows) | Control tables by family, all 149 rows, re-verified, NIST and FedRAMP columns added | "Where addressed" volume and book IDs replaced by B00–B13 chapters; KSI column dropped |
| † coordination-only footnote (SA-9) | Not carried | Volume-level coordination distinction doesn't apply to workbook chapters |
| Control coverage by volume | Not carried | Internal per-volume counts |
| FedRAMP 20x KSI view | Corrections table | Pilot-era theme mappings superseded by the 2026 indicators |
| Notes and caveats | How to read (enhancement rows; dated status) | Regeneration instructions are internal |
| Controls addressed but not yet closed | Status column (partly closed, open); "What the crosswalk shows" | Family counts and back-fill-queue framing dropped |

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
| 2 | CyberArk mechanism (acme) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-acme |
