# Verification — Chapter 05, The Service Catalogs: ITSM and Teams Telephony

Checked October 21, 2026 by writer W4. Sources: `docs/compliance/Vol_IX_Book_01_Helpdesk_ITSM_Catalog.md` (1,740 words) and `docs/compliance/Vol_IX_Book_04_Teams_Telephony_Catalog.md` (1,036 words); both are archived after the book is built and aren't linked. Microsoft facts from Microsoft Learn (MCP search and fetch, plus a direct download of the Teams service description). FCC rules: fcc.gov pages return HTTP 403 to automated retrieval from this session, so the Report and Order FCC 19-76 was read from docs.fcc.gov (the FCC's document server) and the rule text from the eCFR versioner API (47 CFR 9.3 and 9.16 as of October 1, 2026; the eCFR HTML pages redirect automated clients to a block page). ServiceNow facts from ServiceNow's Washington DC documentation (the Service Catalog overview pages returned 404 to automated retrieval, so no general Service Catalog claim is footnoted; ServiceNow coverage leans on Chapters 02 and 03, which verified the spoke, MID Server and approval action). NIST control text from the OSCAL catalog release 5.2.0. CISA BOD 25-01 and its required-configurations page read on cisa.gov. No personal data was sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Help-desk identity changes touch AC-2, IA-5, AC-6; portal clicks by standing admins erode them | Opening | restated-as-design | Source "What This Document Addresses", translated |
| 2 | Request → approve → execute through in-boundary connector → evidence loop | The loop | restated-as-design | Source "The Request Loop"; ties to Book 13 Ch10 and Book 14 Ch04 |
| 3 | Ten catalog items, control per item, approval gates | Identity catalog table | restated-as-design (controls verified as existing SP 800-53 identifiers) | Source catalog table; OSCAL catalog 5.2.0 |
| 4 | Conditional Access exception reuses one exception path | Identity catalog | restated-as-design | Source note; points to Book 04 Ch06 Exceptions instead of the internal volume reference |
| 5 | Five verbs (add, move, change, delete, reset) with origin, closing check, controls | Five verbs table | restated-as-design | Source matrix; internal doctrine names ("MACD-R Lifecycle Doctrine", "Human-Anchor Rule", "Closure Provenance Doctrine", "SSOT Registry") translated to plain language |
| 6 | Reset is the social-engineering entry; re-proof against held record | Reset subsection | restated-as-design | Source warning; Chapter 04 carries the NIST SP 800-63B-4 citation |
| 7 | AC-2(3) asks to disable accounts within a defined time when no longer associated with a user | Leaver | verified | OSCAL catalog 5.2.0, ac-2.3 |
| 8 | Entra ID spoke: Disable User, Revoke User SignIn Sessions; sample offboarding flow disables user and removes groups on deactivation | Leaver | verified | ServiceNow Washington DC docs, Microsoft Entra ID Spoke |
| 9 | MFA method reset has no spoke action | What the catalog doesn't fix | verified (by link) | Chapter 03 crosswalk (verified there) |
| 10 | Four PSTN options: Calling Plans, Operator Connect, Teams Phone Mobile, Direct Routing | Telephony | verified | Learn, PSTN connectivity options |
| 11 | PSTN calling via Teams Phone listed available in GCC; Direct Routing must be configured in GCC High and DoD | Telephony | verified | Learn, Teams service description footnote 2; Office 365 GCC High and DoD service description |
| 12 | Source: telephony items carry "lawful-access logging" implications | Telephony | removed | No primary source located; not carried |
| 13 | Kari's Law: direct 911 dialing without prefix, notification; applies to MLTS manufactured, imported, offered/first sold or leased, or installed after Feb 16, 2020 | Emergency calling | verified | FCC 19-76 paras 8–12 |
| 14 | RAY BAUM'S Act §506 directed FCC to consider dispatchable-location rules; FCC adopted Aug 1, 2019 | Emergency calling | verified | FCC 19-76 cover and para 12 |
| 15 | MLTS definition includes network- and premises-based systems, VoIP, and systems owned or leased by governmental agencies | Emergency calling | verified | 47 CFR 9.3 |
| 16 | Installer/manager/operator obligations: direct dial, notification (contemporaneous, no delay, where someone will see it), convey dispatchable location | Emergency calling | verified | 47 CFR 9.16(b) |
| 17 | Dispatchable location = validated street address plus suite/floor etc. | Emergency calling | verified | 47 CFR 9.3 |
| 18 | Dates: on-premises fixed Jan 6, 2021; on-premises non-fixed and off-premises Jan 6, 2022, with fallbacks | Emergency calling | verified | 47 CFR 9.16(b)(3)(i)–(iii) |
| 19 | Notification minimum content: 911 call made, callback number, location conveyed | Emergency calling | verified | 47 CFR 9.3, "MLTS notification" |
| 20 | Source: "E911 validation is a gate" | Emergency calling | restated-as-design, strengthened | Now tied to the operator obligation in 47 CFR 9.16 |
| 21 | Emergency address must be validated before assignment; map search validates and geocodes; places | How Teams meets the rules | verified | Learn, Manage emergency calling |
| 22 | Calling Plan US: emergency location required when a number is assigned | How Teams meets the rules | verified | Learn, Emergency calling considerations for Calling Plans |
| 23 | Dynamic emergency calling across four options; LIS match order WAP, port, switch, subnet; geocodes required; up to four hours propagation | How Teams meets the rules | verified | Learn, Plan and configure dynamic emergency calling |
| 24 | Emergency calling policy: security desk notification and conferencing; 933 handling; site overrides user | How Teams meets the rules | verified | Learn, dynamic emergency calling |
| 25 | Direct Routing: emergency call routing policy, PIDF-LO on SBC, ERS provider (US/Canada) or ELIN | How Teams meets the rules | verified | Learn, dynamic emergency calling |
| 26 | Web client unsupported; turn off Web PSTN calling via calling policy | How Teams meets the rules | verified | Learn, dynamic emergency calling |
| 27 | 933 test for Calling Plan, Operator Connect, Teams Phone Mobile in US/Canada; Direct Routing coordinates with ERSP | How Teams meets the rules | verified | Learn, dynamic emergency calling |
| 28 | Government support: GCC all clients; GCCH desktop, mobile, phones from a stated version; DoD desktop, mobile, Teams phone app via TAC | How Teams meets the rules | verified | Learn, dynamic emergency calling, Government support |
| 29 | Network-to-location mapping raised when DDI records a new subnet or access point | How Teams meets the rules | restated-as-design (new) | Program design; links Book 08 |
| 30 | Graph call records retained 30 days; subscription for near-real-time reporting and emergency-call alerts | Call records | verified (new) | Learn, Call records (Graph) |
| 31 | PSTN usage report retention by country; all other countries 365 days Calling Plans, 150 days Direct Routing | Call records | verified (new) | Learn, Teams PSTN usage report |
| 32 | Source: CDRs and admin actions "routed into the evidence contract at onboarding" | Call records | restated-as-design | Design, justified by the retention windows in 30–31 |
| 33 | SCuBA Teams baseline; BOD 25-01 requires mandatory policies; June 20, 2025 deadline; issued Dec 17, 2024 | Teams drift | verified | CISA BOD 25-01 page |
| 34 | Required Teams policies MS.TEAMS.1.2v2, 2.1v2, 2.2v2, 4.1v1 and their text | Teams drift | verified (new) | CISA BOD 25-01 required configurations |
| 35 | Source: authorities table drivers listed "CISA BOD 25-01" for CM-6 | Teams drift | verified | As 33 |
| 36 | Teams drift folds into the M365 loop (CM-6) | Teams drift | restated-as-design | Source Part 2; links Chapter 08 |
| 37 | Roles table | Who does what | restated-as-design (new) | Program design consistent with Chapters 03 and 10 |
| 38 | Source authorities tables: tool-attestable, evidence slot, KSI theme columns | — | removed | Internal spine projection and internal theme labels; KSIs bind providers, not agencies (book brief) |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Book 01 front matter, internal banner, draft box, Date Code, agency shortcode | — | Internal stamps and agency placeholders; never carried |
| Book 01 Series Context | Opening; The loop | Volume references translated; MID-routed actuation linked to Chapter 02 |
| Book 01 What This Document Addresses | Opening | Carried; machine-readable control-map file name dropped (internal artifact) |
| Book 01 The Catalog (ten items) | The identity catalog | Carried in full, notes expanded |
| Book 01 Reuse, don't reinvent | The identity catalog | Carried; points to Book 04 Ch06 Exceptions |
| Book 01 The Request Loop | The loop every item runs; figure ch05-request-loop | Carried as design |
| Book 01 The leaver fails audits | The leaver is the one that fails audits | Carried; spoke actions verified (#8) |
| Book 01 Identity MACD-R matrix | Five verbs | Carried; doctrine names translated (#5) |
| Book 01 Reset warning | Reset is the verb attackers order | Carried; links Chapter 04 and Book 14 Ch04 |
| Book 01 Closure Necessity box | Opening ("doesn't add a control...") | Restated plainly without the doctrine name |
| Book 01 Authorities Closed Here table | Control columns in the catalog table | Mechanism prose folded into the table; slot, KSI and tool-attestable columns not carried (#38) |
| Book 01 Honest Limits | What the catalog doesn't fix | Carried, plus connector-coverage limit |
| Book 01 Cross-References | Links to Book 03, Book 04, Chapters 06, 07, 11 | Internal volume references replaced by workbook links |
| Book 01 Provenance | — | Internal; figure redrawn as house-style source |
| Book 04 front matter, banners, Date Code, shortcode | — | Never carried |
| Book 04 Series Context | The telephony catalog | Architecture deferred to network design (Book 09 Ch12); internal volume reference dropped |
| Book 04 What This Document Addresses | The telephony catalog | Carried; "lawful-access logging" removed (#12) |
| Book 04 Part 1 telephony catalog table | Telephony catalog table | Carried; network-to-location mapping item added (#29) |
| Book 04 E911 is not optional metadata | Emergency calling is the agency's obligation; How Teams meets the rules; figure ch05-emergency-location | Expanded with FCC rules and Teams mechanics (#13–28) |
| Book 04 Part 2 Teams SCuBA drift | Teams configuration drift joins the Microsoft 365 loop | Carried; BOD 25-01 Teams policies added (#33–34) |
| Book 04 Closure Necessity box | Telephony intro ("usually run by ad hoc administrator action") | Restated plainly |
| Book 04 Authorities Closed Here table | Telephony table control column | CM-3, CM-6, AU-2 carried; internal columns dropped |
| Book 04 Honest Limits | Honest limits | Carried |
| Book 04 Cross-References | Book 09 Ch12; Chapter 08 | Internal volume references replaced; CISA SCuBA reference re-cited via BOD 25-01 pages |
| Book 04 Provenance | — | Internal |
