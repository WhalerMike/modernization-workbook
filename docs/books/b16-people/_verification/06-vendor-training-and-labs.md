# Verification — Chapter 06, Vendor Training and Lab Environments

Writer W3. Source: `docs/compliance/Vol_V_Book_04_Vendor_Training_Lab_Environments.md` (about 2,350 words). All sources opened October 21, 2026. Microsoft claims checked with the Microsoft Learn tools (search and fetch). Vendor claims read on each vendor's own site with WebFetch; several vendor sites render only with JavaScript, noted below. SP 800-53 statements and baselines from the Release 5.2.0 OSCAL catalog and SP 800-53B profiles; SP 800-50 Rev. 1 read as extracted PDF text. No personal data sent to any site.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Vendor names imply no endorsement; verify FedRAMP status at purchase | Opening | restated-as-design | — |
| 2 | SP 800-50r1: evaluate external materials (federal, vendors, academic); some low cost or free; may license and curate a vendor library; understand needs, judge fit, consider who owns material; contracting officer | Opening | verified | SP 800-50r1 §3.2.1.2.1, §4.1.5 |
| 3 | Four tests for a vendor course | Choosing vendor training | restated-as-design | — |
| 4 | AZ-500 certification, exam and renewal retired August 31, 2026; SC-500 Cloud and AI Security Engineer Associate as transition | Choosing; What changed | verified | Microsoft Learn AZ-500 cert page warning; Partner Center May 2026 announcements |
| 5 | Microsoft recommends registering exams with a personal Microsoft account; work/school account records lost on leaving | Choosing | verified | Microsoft Learn SC-401 exam page |
| 6 | SP 800-50r1 learning-data sensitivity and LMS risk | Choosing | verified | SP 800-50r1 §2.4.1 |
| 7 | Microsoft Learn self-paced training free; many modules interactive | Vendor training | verified | Microsoft Learn "content and resource types" |
| 8 | Microsoft Learn sandboxes no longer available; exercises need an Azure subscription, e.g. free 30-day trial | Vendor training; Lab sources; What changed | corrected | Microsoft Learn training FAQ (source assumed sandboxes) |
| 9 | Applied Skills: scenario-based; interactive lab-based assessment | Vendor training | verified | Microsoft Learn Applied Skills (educator center) |
| 10 | Source Microsoft cert table (AZ-700, SC-300, SC-200, SC-401, DP-300, AZ-500, SC-100) | Vendor training | corrected | Moved to Ch04 (W2), which carries current status; AZ-500 retired. I also confirmed SC-300, SC-200, SC-401, DP-300, AZ-700, SC-100, MD-102 current on Microsoft Learn |
| 11 | Infoblox Launchpad: official platform; product training, hands-on labs, certifications; free with all products; free industry learning for non-customers | Vendor table | verified | infoblox.com/infoblox-education |
| 12 | BlueCat Learning: self-paced, lab training in personal environment; Associate/Professional/Advanced certs; product-agnostic DDI stream | Vendor table | verified | bluecatnetworks.com/services/training |
| 13 | Cisco U.: cert prep, tutorials, hands-on labs, learning paths, CE credits; Networking Academy for beginners | Vendor table | verified | cisco.com training-certifications page (u.cisco.com and netacad.com render only with JavaScript) |
| 14 | Fortinet Training Institute; NSE certification program; updates July 15, 2026 | Vendor table | verified | training.fortinet.com (free-course claim in source not confirmed; not carried) |
| 15 | Palo Alto: free digital learning modules; ILT with labs; role-based certs; learning subscription | Vendor table | verified | paloaltonetworks.com/services/education |
| 16 | Zscaler Cyber Academy: role-based paths; proctored certs; separate government customer sign-in | Vendor table | verified | zscaler.com/zscaler-cyber-academy (source's "ZDTA/ZTCA" names not confirmed; not carried) |
| 17 | SailPoint Identity University: on-demand and ILT; role/product paths; knowledge credentials and professional certs with experience and proctored exam | Vendor table | verified | sailpoint.com/university |
| 18 | AWS Skill Builder: 1,000+ free resources; Individual/Team subscriptions add exam prep and full immersive experiences | Vendor table | verified | aws.amazon.com/training/digital; immersive learning page |
| 19 | Source: AWS Skill Builder for Amazon Connect "N8NN contact-center boundary exception" | Vendor table | removed | Internal boundary exception; row recast to Book 15 Ch09 AWS |
| 20 | Broadcom VCF learning entitlements free for VCF Platform and Strategic customers (digital and ILT) | Vendor table | verified | VCF Learning Entitlements eBook (vmware.com docs PDF) |
| 21 | VCP-VCF/VVF certifications; personal-use home-lab license on passing | Vendor table | verified | VMware Cloud Foundation Blog, April 14, 2025 |
| 22 | ServiceNow University is ServiceNow's training portal at learning.servicenow.com | Vendor table | verified (name only) | Page title of learning.servicenow.com KB page; servicenow.com/university returned 403; developer.servicenow.com requires a supported browser. Offerings unverifiable, stated as such |
| 23 | Personal-use license not for agency lab; use vendor's government academy when running its government offering | Vendor table | restated-as-design | — |
| 24 | CISA Learning replaced FedVTE and other LMSs; no-cost; federal/SLTT staff and contractors, veterans, military, U.S. residents; Login.gov | Federal sources | verified | niccs.cisa.gov/training/cisa-learning |
| 25 | FedRAMP 2026 KSIs as provider reporting structure | Federal sources | verified | fedramp.gov 2026 KSI page |
| 26 | M365 Developer Program: E5 developer subscription, 25 licenses, up to 90 days, renews with dev activity; includes Intune; development purposes only | Lab sources | verified | Microsoft Learn developer program pages |
| 27 | Developer Program eligibility: Visual Studio Pro/Enterprise, ISV Success/partner program, Premier/Unified Support; not offered in government clouds | Lab sources | verified | Microsoft Learn developer program eligibility overview |
| 28 | Source: "M365 E5 developer/trial tenants cover Entra ID P2, Purview, Defender" freely available | Lab sources; What changed | corrected | Eligibility limited (claim 27); P2 inclusion in E5 verified separately |
| 29 | Microsoft 365 E5 includes Entra ID P2; PIM needs P2 or ID Governance | Lab sources | verified | Microsoft Entra licensing; PIM getting started |
| 30 | GCC: free one-month trial for GCC only; no GCC High/DoD trials; trials only for U.S. government entities | Lab sources | verified | Microsoft 365 Government how to buy; Office 365 GCC service description |
| 31 | Azure Government customers subject to eligibility validation; trial by request | Lab sources | verified | "What is Azure Government?" |
| 32 | AWS GovCloud (US): isolated U.S. regions for verified government agencies and entities; root account U.S. person screening; separate IAM and credentials | Lab sources | verified | aws.amazon.com/govcloud-us |
| 33 | Government feature gap | Government clouds | verified (by link) | Book 10 Ch04 (published) |
| 34 | Azure Government portal portal.azure.us; `Connect-AzAccount -Environment AzureUSGovernment` | Government clouds | verified | Microsoft Learn Azure Government quickstarts (portal, PowerShell) |
| 35 | Two-step lab path (commercial sandbox, then agency non-production government tenant before gate) | Government clouds | restated-as-design | — |
| 36 | Lab tiers (fixture, sandbox, product evaluation) | Lab tiers | restated-as-design | Source tier names F/T/P translated |
| 37 | CA report-only evaluates at sign-in without enforcing; results in sign-in logs | Rules | verified | Microsoft Learn "Analyze Conditional Access Policy Impact" |
| 38 | Exclude emergency access accounts from CA; create before lockdown | Rules | verified | Microsoft Learn "Plan a Conditional Access deployment"; MCSB v2 PA-5 |
| 39 | CM-4(1) Separate Test Environments; High baseline only | Rules | verified | OSCAL 5.2.0 catalog and profiles |
| 40 | SA-3(2) Use of Live or Operational Data: approve, document, control; protect at same impact level; not in baselines | Rules | verified | OSCAL 5.2.0 catalog and profiles |
| 41 | No sync/federation/shared credentials with production; synthetic data; lab artifacts out of workbook | Rules | restated-as-design | Book 04 Ch08 linked for tenant artifacts |
| 42 | Sentinel free trial: first 10 GB/day analytics tier free for 31 days; automation and some charges still apply | Rules (costs) | verified | Microsoft Learn Sentinel billing, Free trial |
| 43 | Source: "Sentinel bills per GB ingested… free-tier range" | Rules (costs) | corrected | Restated against the documented trial |
| 44 | Labs mapped to book procedures and Ch04 modules | Labs mapped | restated-as-design | Module numbers from Ch04 (W2) |
| 45 | SP 800-50r1 phishing exercise guidance: legal review; no legitimate brands or federal organizations as bait; tell staff; not punitive | Labs mapped (help desk drill) | verified | SP 800-50r1 §2.7.2 |
| 46 | Earlier catalog's other vendors (Juniper, Netskope, Splunk, Elastic, SANS, Tenable, Qualys, OpenSSF, Linux Foundation, IAPP) | What changed | removed | Not verified for this chapter; ISC2 and ISACA covered in Ch05 |
| 47 | Common final step: engine `oscal ksi-ar` command | Every lab ends | restated-as-design | Engine command removed; described by function |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, FOUO banner, draft-proposal callout, Date Code | — | Not carried: publication stamps and agency shortcode (brief) |
| "Operational appendix — vendor-named by necessity" callout | Opening paragraph | Internal "Theme F" framing dropped; non-endorsement and FedRAMP check kept |
| What This Document Addresses | Opening; "In this chapter" | — |
| Living catalog / link-check note | — | Not carried: repository CI detail; currency handled by test 2 in "Choosing vendor training" |
| How to Use This Catalog | Vendor training by book; Labs mapped | Volume columns replaced with workbook books |
| Microsoft Role-Based Training (table) | Ch04 (W2) table, linked | Not duplicated; AZ-500 retirement noted; Learn, sandbox and Applied Skills facts added |
| Networking & DDI (Cisco, Juniper, Infoblox, BlueCat, CompTIA) | Vendor table (Cisco, Infoblox, BlueCat) | Juniper not verified, removed; CompTIA moved to Ch05 |
| Identity & Zero Trust (Microsoft, SailPoint, Fortinet, Palo Alto, Zscaler, Netskope) | Vendor table (SailPoint, Fortinet, Palo Alto, Zscaler) | Netskope not verified, removed; NERM exception internal, dropped |
| Data Platform | Labs mapped (module 7) | Microsoft certs in Ch04 |
| Security Operations (Splunk, Elastic, SANS, ISC2, Tenable, Qualys) | — | Not verified, removed; ISC2 in Ch05 |
| Federal & Compliance (CISA, FedRAMP, NIST NICE, AWS, OpenSSF, Linux Foundation, ISACA, IAPP, ServiceNow) | Federal sources (CISA, NICE, FedRAMP); vendor table (AWS, ServiceNow) | OpenSSF, Linux Foundation, IAPP not verified, removed; ISACA in Ch05 |
| Lab Environments intro (scripts embedded in manuscripts) | — | Not carried: internal repository detail |
| Lab Tiers | Lab tiers | Tier names translated |
| Safety Rules (four) | Rules for every lab, 1–4 | Microsoft citations added; rules 5–7 added (separation, data, artifacts) |
| Lab Environment Setups (table) | Labs mapped to the books' procedures | Module IDs B1–B8 replaced with Ch04 module numbers and book procedures |
| Modules with no tenant lab | Labs mapped, closing paragraph | — |
| The Common Final Step — Bind the Evidence | Every lab ends the same way | Engine command removed |
| Cost Notes | Rules (costs paragraph); Lab sources | Corrected: dev tenant eligibility; Sentinel trial terms; vendor-eval note folded into vendor table |
| Research Queue | — | Not carried: internal backlog; KnowBe4/Proofpoint not verified |
| Series Context — Vol V Book 04 | — | Not carried: internal series map |
| Closing italic note | Opening paragraph | Non-endorsement kept |
| (new) Government-cloud differences | What changes in the government clouds | Brief asked for it |
| (new) Data handling for labs | Rules 5–7 | Brief asked for it |
