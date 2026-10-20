# Verification — Chapter 06, Who Owns the Migration

Checked October 20, 2026. Sources: `docs/whitepapers/fmp-vs-native-tools.md` (main), with
`docs/operational-guides/identity/identity-modernization.md` and
`docs/reference-architecture/delegation.md` skimmed for roles only.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-19-17 requires an integrated agency-wide ICAM governance structure including CIO, CFO, HR, General Counsel, CISO, SAOP, CAO, physical security | Intro | verified | OMB M-19-17 PDF (text extracted, Governance §1) |
| 2 | RMF defines AO, SAISO, system owner, system security officer, system admin, system user | Intro, roles | verified | NIST SP 800-37 Rev. 2, Appendix D (PDF text extracted) |
| 3 | AO is the only official who can accept security and privacy risk | Decision rights; AO | verified | SP 800-37 Rev. 2 App. D |
| 4 | CIO designates the SAISO, maintains policy, oversees security personnel | Sponsor/CIO | verified | SP 800-37 Rev. 2 App. D |
| 5 | System owner responsible for procurement through disposal | Sponsor/CIO | verified | SP 800-37 Rev. 2 App. D |
| 6 | SAISO carries out CIO FISMA duties and is liaison to AOs, system owners, SSOs | CISO | verified | SP 800-37 Rev. 2 App. D |
| 7 | ISSO maintains posture day to day, advises on controls, works with system owner | ISSO | verified | SP 800-37 Rev. 2 App. D |
| 8 | System user responsibilities include reporting anomalous or suspicious behavior | End users | verified | SP 800-37 Rev. 2 App. D |
| 9 | BOD 25-01: explain deviations from mandatory SCuBA policies; AOs may accept risk; deploy CISA's SCuBA assessment tools and report | AO; tool table | verified | cisa.gov BOD 25-01 page |
| 10 | Who decides / does / consulted assignments; matrix; one decider per row | People | restated-as-design | Program model (no external source defines this matrix) |
| 11 | Cloud Sync agent server is tier 0; creating its gMSA needs Domain or Enterprise Admin | AD admins | verified | Learn, Cloud Sync prerequisites |
| 12 | App registrations need two human owners; app owners review app assignments | App owners | restated-as-design | identity-modernization.md §6.4, §9.1 (program guidance) |
| 13 | Authentication Administrator can create TAP for members; Privileged Authentication Administrator for admins | Help desk; roles table | verified | Learn, Temporary Access Pass |
| 14 | Hybrid Identity Administrator manages Cloud Sync/Connect, PHS, PTA, federation | Roles table | verified | Learn, Entra built-in roles |
| 15 | Lifecycle Workflows Administrator role exists and manages workflows | Roles table | verified | Learn, Entra built-in roles |
| 16 | Global Reader / Security Reader are least-privileged reader roles | Roles table | verified | Learn, least privileged roles by task |
| 17 | Restricted management AUs: tenant admins incl. Global Admin can't modify objects unless they self-assign at AU scope, which is audited | Roles | verified | Learn, restricted management AUs (also corrects delegation.md wording "cannot bypass", owned by Ch 05) |
| 18 | Cloud Sync: disconnected forests, multiple agents, 150K objects/domain, 50K-member groups, no PTA config, new features land in Cloud Sync | Tool table | verified | Learn, Connect-to-Cloud-Sync decision guide |
| 19 | Source: "Cloud Sync is the recommended future direction" | Tool table | corrected | Learn says Cloud Sync is *replacing* Connect Sync, which will retire after parity (Connect Sync overview) |
| 20 | Source: Entra Connect requires Entra ID P1 | Tool table | corrected | Learn: Connect is free with the Azure subscription; Connect Health requires P1/P2 |
| 21 | Connect Health licensing: 1 license for first agent, 25 per additional | Tool table | verified | Learn, Connect Health FAQ |
| 22 | Connect Sync must reach 2.6.84.0+ with application-based auth by April 7, 2027 | Tool table | verified | Learn, Connect prerequisites (new; not in source) |
| 23 | Cloud Sync group provisioning to AD needs P1 | Tool table | verified | Learn, Cloud Sync prerequisites |
| 24 | ID Governance features; Lifecycle Workflows and member access reviews need ID Governance or Entra Suite | Tool table | verified | Learn, ID Governance licensing fundamentals (corrects identity-modernization.md "access reviews (P2 feature)") |
| 25 | ID Governance available in GCC, GCC High, DoD | Tool table | verified | Learn, Entra feature availability |
| 26 | ID Protection full capability needs P2 / Entra Suite; some signals need Defender licenses | Tool table | verified | Learn, ID Protection overview |
| 27 | MDI posture assessments: six categories incl. certificates and Group Policy; CA assessments need AD CS sensor | Tool table; matrix | verified | Learn, MDI security posture assessments |
| 28 | Source: MDI has "no JSON/CSV structured export for automation" | Tool table | corrected | Learn: data available in advanced hunting, Defender XDR APIs, streaming to Sentinel; 30-day retention |
| 29 | Source: MDI licensing "E5 Security or standalone (expensive)" | Tool table | corrected | Learn: EMS E5, M365 E5/G5, E5/G5 Security, standalone; GCC: M365 GCC G5, G5 Security GCC, standalone (price wording dropped) |
| 30 | MDI certificate assessments cover ESC1–ESC4, ESC15 (templates) and ESC6/7/8/11 (CA) | Matrix | verified | Learn, MDI certificates assessment; what's new archive |
| 31 | Graph is the single endpoint for Entra users, groups, apps, devices, roles, governance | Tool table | verified | Learn, Microsoft Graph overview |
| 32 | Source: Group Policy analytics is "portal only, no bulk export"; "no GPO link analysis"; "no cross-GPO conflict detection" | Tool table; matrix | corrected | Learn: Export view to CSV; "Targeted in AD" column; conflicting settings detected at migration; 4 MB limit; English-only caveat |
| 33 | Intune licensed via Plan 1 / Plan 2 / Suite, usually inside Microsoft 365 bundles; API access still needs license | Tool table | verified | Learn, Intune licensing |
| 34 | Source: "No Microsoft tool provides cross-GPO conflict detection" | Matrix | corrected | Learn, SCT: Policy Analyzer highlights redundant settings and internal inconsistencies across a GPO set |
| 35 | SCT baselines include Windows Server 2025; tools Policy Analyzer, LGPO, SetObjectSecurity, GPO2PolicyRules | Tool table | verified | Learn, SCT how to use |
| 36 | Source: "Azure Policy / Arc Guest Configuration"; "~$6/server/month" | Tool table | corrected | Learn: renamed Azure Machine Configuration; no extra charge with Windows Server SA or PAYG attestation, otherwise billed per server (price removed) |
| 37 | Purview Audit Standard 180 days; Premium 1 year for Entra/Exchange/SharePoint, up to 10 years with add-on; CSV export and Management Activity API | Tool table | verified | Learn, Purview auditing solutions |
| 38 | Sentinel retires from the Azure portal after March 31, 2027 | Tool table | verified | Learn, Sentinel overview (date extended from July 2026) |
| 39 | Sentinel costs appear on the Azure bill | Tool table | verified | Learn, Reduce costs for Microsoft Sentinel |
| 40 | Secure Score recommended actions grouped by identity, device, apps, data | Tool table | verified | Learn, Microsoft Secure Score |
| 41 | Zero Trust Assessment: open source, read-only, local report, hundreds of checks; GA consent first run, reader roles after | Tool table | verified | Learn, ZTA overview and get started |
| 42 | ScubaGear assesses Entra ID and other M365 products; HTML, JSON, CSV output | Tool table | verified | GitHub cisagov/ScubaGear |
| 43 | Azure Migrate discovers and assesses servers, databases, web apps; no tool fee for 180 days of replication | Tool table | verified | Learn, Azure Migrate FAQ |
| 44 | Source: MAP Toolkit "effectively deprecated — Microsoft recommends Azure Migrate" | Tool table | corrected | Learn, Azure Migrate FAQ still directs MAP for OS migration planning and software usage tracking; deprecation claim dropped |
| 45 | Source: ADMT "still functions on newer servers" | Tool table | corrected | Learn: code base deprecated, no security or bug fixes, not updated for Server 2012 R2+, use at own risk |
| 46 | Source: Entra Health monitoring "Included with Entra ID" | Tool table | corrected | Learn: still preview; viewing health signals requires P1/P2 (Entra licensing page) |
| 47 | FastTrack: 150+ eligible licenses; covers Entra Connect, Cloud Sync, hybrid identity guidance | Tool table | verified | Learn, FastTrack eligibility and Entra pages |
| 48 | Source: FastTrack covers "Lifecycle Workflows, Application Proxy, Identity Governance" etc. | Tool table | removed | Not re-verified item by item; replaced with verified Entra ID Free scope list |
| 49 | Coverage percentages (30% / 22%; per-category 0–95%) | Capability matrix; gap analysis | removed | Source itself labeled them illustrative; replaced with qualitative levels and a run-your-own-assessment instruction |
| 50 | Import adapter design (file-based, `-ReportPath`/`-OutputPath`, never calls a live API), function roster, provenance envelope | Consume section | restated-as-design | Program spec FMP_182 (program fact, no footnote) |
| 51 | ADRecon: AGPL-3.0; collects forest…SPN data; CSV, XML, JSON, HTML, Excel | Third-party | corrected | GitHub adrecon/ADRecon (source said Excel only) |
| 52 | PingCastle is an AD security assessment tool, part of Netwrix | Third-party | verified | pingcastle.com |
| 53 | BloodHound CE: attack-path graph analysis, AD and Azure, Apache 2.0 | Third-party | verified | GitHub SpecterOps/BloodHound |
| 54 | Source: Purple Knight "150+ security indicators" | Third-party | corrected | semperis.com: free, AD/Entra ID/Okta, 218+ to 232+ indicators; stated as "more than 200" |
| 55 | Source licensing price table ($6–$57/user/month, $25–$57 bundle estimate) | Appendix B of source | removed | Brief: avoid unverified prices; tiers kept in tool table |
| 56 | Defender for Identity "good enough security layer" recommendation | Consume table | restated-as-design | Program recommendation |

## Carry-forward ledger

### `docs/whitepapers/fmp-vs-native-tools.md`

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, DOCX download callout | — | Page furniture; not carried |
| Opening figure (fmp-vs-native-orchestration.svg) | Replaced by `ch06-instruments-and-orchestra` | Old figure not reused, per brief |
| Problem, solution, ask callout | Tools intro; "Consume and build" | Percentages removed (claim 49); "carry positioning to FedRAMP CWGs, CISA, partners" not carried (sales/outreach) |
| §1 Executive summary, key finding callout | Tools intro | Percentages removed (claim 49) |
| §1 "Illustrative — replace before release" callout | Capability matrix closing paragraph | Turned into the instruction to run the assessment |
| §2 intro | Tool table lead-in | Re-dated to Oct 20, 2026 |
| §2.1 MAP Toolkit | Azure Migrate row | Corrected (claim 44); no separate row |
| §2.2 Azure Migrate | Tool table | — |
| §2.3 Group Policy Analytics | Tool table; matrix | Corrected (claim 32); link to GPO-cloud governance gaps page not carried (outside B02 scope) |
| §2.4 Entra Connect / Cloud Sync | Tool table (two rows) | Corrected (claims 19, 20) |
| §2.5 Defender for Identity | Tool table; matrix | Corrected (claims 28, 29) |
| §2.6 Security Compliance Toolkit | Tool table; matrix | Corrected (claim 34) |
| §2.7 ADMT | Tool table | Corrected (claim 45) |
| §2.8 FastTrack | Tool table | Corrected (claims 47, 48) |
| §2.9 Entra Connect Health | Tool table | Licensing detail added (claim 21) |
| §2.10 Entra Health Monitoring | Tool table | Corrected (claim 46) |
| §2.11 Azure Policy / Arc Guest Configuration | Tool table | Renamed, corrected (claim 36) |
| §2.12 PowerShell AD module and RSAT | Capability matrix ("raw cmdlets"); consume/build prose | Folded in; no separate row |
| (new) Entra ID Governance, ID Protection, Graph, Purview, Sentinel, Secure Score, Zero Trust Assessment, ScubaGear | Tool table | Added per assignment |
| §3 Capability matrix (12 rows) | Capability matrix (12 rows, compressed) | Coverage levels updated; "Cloud tenant configuration" row added |
| §4 Gap analysis summary and overall-assessment callout | Gap analysis table | Percentages removed (claim 49) |
| §5 Third-party landscape (ADRecon, PingCastle, BloodHound, Purple Knight) | Third-party tools list | Overlap ratings and "what FMP adds" positioning dropped; facts verified (claims 51–54) |
| §6.1 Orchestration layer pattern and "instruments / orchestra" metaphor | Tools intro; diagram 2 | — |
| §6.2 Consumption model | Consume/build table; adapter section | — |
| §6.3 SCuBA parallel table | Tools intro (one sentence) | Compressed |
| §7 Consume vs build | Consume/build table | ScubaGear and Entra ID Governance rows added |
| §8.1–8.3 Competitive messaging (VCs, federal customers, legacy engineers) | — | Not carried: sales and competitive messaging |
| §9.1 Import adapters (implemented) | "How the program consumes native output" | — |
| §9.2 Import module specification | Same section (envelope fields) | Classification-marking and Authenticode notes not carried (packaging detail) |
| §10.1 Bottom line | Tools intro; "Ownership in practice" | — |
| §10.2 Strategic recommendations | Consume/build table; third-party list | "Do not position as competing" kept as positioning sentence |
| §10.3 Engagement channels | — | Not carried: outreach/sales |
| Appendix A tool-by-tool matrix (~156 cells) | Capability matrix "native tools" column | Compressed into the domain matrix, per assignment |
| Appendix B license and cost comparison | Tool table "license tier" column | Prices removed (claim 55) |
| Appendix C companion document cross-reference | — | Replaced by B02 chapter links |
| Footer (version, classification, boundary) | — | Classification stamps not carried |

### `docs/operational-guides/identity/identity-modernization.md` (skimmed for roles only)

| Source page § | Went to | Or why not carried |
|---|---|---|
| §1 Purpose and scope (1.1–1.4) | — | Owned by other B02 writers |
| §2 AD identity landscape decomposition | — | Owned by other B02 writers |
| §3 Entra ID identity architecture (incl. 3.3 licensing tiers) | — | Owned by other writers; its "access reviews (P2)" statement noted as corrected in claim 24 |
| §4 Entra Connect Sync architecture | — | Owned by other writers (Chapter 09) |
| §5 Group migration strategy | — | Owned by other writers |
| §6 Service account modernization (6.4 two-owner rule) | Application owners role | Role fact only (claim 12) |
| §7 Privileged access management (7.2 approvers from separate AU; notifications to security operations) | CISO role; roles table | Role facts only; PIM tables owned by other writers |
| §8 Conditional Access policy framework (8.6 helpdesk ticket monitoring) | Users role (registration and tickets as go/no-go) | Role fact only |
| §9 Identity governance and lifecycle (9.1 reviewers: owners, app owners, sponsors, security team) | App owners role; matrix row "access review" | Role facts only; schedules owned by other writers |
| §10 Cross-tenant and B2B (sponsors) | — | Owned by other writers |
| §11 Authentication modernization (11.3 TAP for helpdesk) | Help desk role | Role fact only, re-verified (claim 13) |
| §12 Monitoring, audit and compliance | — | Owned by other writers |
| §13 Migration execution playbook (wave monitoring, help desk tickets) | Matrix rows "pilot and wave go/no-go" | Role facts only |
| §14 Gitea integration and drift detection | — | Owned by other writers |
| §15 Troubleshooting reference | — | Owned by other writers |
| Appendices A–D | — | Owned by other writers |
| Compliance amendment (FIDO2/PIV, PAW) | — | Owned by other writers |

### `docs/reference-architecture/delegation.md` (skimmed for roles only)

| Source page § | Went to | Or why not carried |
|---|---|---|
| The delegation problem | Intro (one sentence) and link to Chapter 05 | Owned by Chapter 05 |
| Three-tier model | Help desk role (scoped roles) | Owned by Chapter 05 |
| Administrative unit registry | — | Owned by Chapter 05 |
| Role assignment matrix | Roles table (Helpdesk / Authentication Administrator scoped to AU) | Owned by Chapter 05 |
| Restricted management | Roles section (claim 17) | Owned by Chapter 05; Learn wording noted |
| Drift detection | — | Owned by Chapter 05 |
| Source callout (FMP_154) | — | Owned by Chapter 05 |
