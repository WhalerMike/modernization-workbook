# Verification — Chapter 01, Why Modernize, and Why Now

Checked October 21, 2026 by writer W1. Sources: `docs/executive-briefs/modernization-overview.md` (730 words), `docs/case-studies/federal-modernization-case-study.md` and `docs/case-studies/federal-modernization.md` (framing pattern; shared with Appendix B). The chapter is written fresh: the sources carry the argument (sequence, gates on evidence, maturity honesty, typical starting state) but almost no checkable external facts, so the implicit-governance and external-clock sections are built from primary sources. Microsoft claims checked on Microsoft Learn (MCP search and fetch); OMB M-22-09 and M-26-14 downloaded and read as extracted text; CISA, FedRAMP and Microsoft lifecycle pages fetched directly.

Diagram sources: `docs/images/diagrams/b00-orientation/src/ch01-implicit-governance.flow.yaml`, `ch01-external-clocks.flow.yaml`.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Windows 2000 introduced the OU, used for delegating administrative rights and assigning policies | Governance nobody wrote down | verified | Learn, "Users in Active Directory Domain Services" |
| 2 | OU control set by ACLs; AD DS supports delegation of full or limited control | Governance nobody wrote down | verified | Learn, "Understanding the Active Directory Logical Model" |
| 3 | GPOs linked to sites, domains, OUs; processing order; closest container wins | Governance nobody wrote down | verified | Learn, "Group Policy processing" |
| 4 | AD-integrated DNS zones replicate via AD replication; secure dynamic updates | Governance nobody wrote down | verified | Learn, "Active Directory-Integrated DNS Zones" |
| 5 | AD CS uses identity information in AD; Group Policy designates which users/machines get which certificates | Governance nobody wrote down | verified | Learn, "What is Active Directory Certificate Services?" |
| 6 | Group membership granted access to shares, apps, databases | Governance nobody wrote down | restated-as-design (general description; depth in B02 Ch04) | — |
| 7 | "For a quarter century" | Governance nobody wrote down | verified, loosely (Learn confirms the OU arrived with Windows 2000; the February 2000 release date was confirmed only from secondary search results, so the chapter gives no exact date) | Learn, as #1 |
| 8 | Book 01 counts eleven categories of object AD governs | Governance nobody wrote down | verified (internal) | B01 Ch02 description |
| 9 | Entra administrative units restrict role scope, can't be nested, objects in several AUs | Why the cloud doesn't inherit it | verified | Learn, "Administrative units in Microsoft Entra ID" |
| 10 | M-22-09 date, FY 2024 objectives, also covers on-premises and hybrid | Federal policy table | verified | M-22-09 p. 1 and §III (extracted text) |
| 11 | BOD 25-01 date, scope, deadlines Feb 21 / Apr 25 / Jun 20, 2025; new tenants before ATO | Federal policy table; what the clocks don't require | verified | CISA BOD 25-01 page |
| 12 | BOD 26-02 issued Feb 5, 2026; edge device definition; 3/12/18/24-month actions | Federal policy table; vendor support | verified | CISA BOD 26-02 page |
| 13 | BOD 26-02 12-month date = Feb 5, 2027 | Federal policy table; diagram | verified (computed from issue date; matches B09 App B) | CISA BOD 26-02 page |
| 14 | M-26-14 May 22, 2026, rescinds M-21-31; CEM and THIRF; all info systems incl. third-party operated | Federal policy table; why one program | verified | M-26-14 pp. 1–2 (extracted text) |
| 15 | M-26-14 agency actions at 90/120/180/320 days from LRA release | Federal policy table | verified | M-26-14 "Agency actions" table |
| 16 | CISA LRA publish date August 20, 2026 | Federal policy text | verified | cisa.gov/Logging |
| 17 | Computed dates Nov 18, 2026; Dec 18, 2026; Feb 16, 2027; Jul 6, 2027 | Federal policy text | restated-as-design (program arithmetic, labeled as such in the chapter) | Computed from #15 and #16 |
| 18 | FedRAMP Consolidated Rules launched June 25, 2026 | Federal policy table | verified | FedRAMP announcement, June 25, 2026 |
| 19 | Mandatory January 1, 2027; no new Rev5 applications after June 11, 2027 | Federal policy table; diagram | verified | FedRAMP "Important Dates" page |
| 20 | End of support = no security/non-security updates, assisted support or content updates | Vendor support | verified | Learn, "Ending Support in 2026" |
| 21 | Windows 10 EOS Oct 14, 2025 | Vendor table | verified | Learn, "Ending Support in 2025" |
| 22 | Exchange Server 2016/2019, Office 2016/2019 EOS Oct 14, 2025 | Vendor table | verified | Learn, "Ending Support in 2025" |
| 23 | SQL Server 2016, SharePoint Server 2016/2019 EOS Jul 14, 2026 | Vendor table | verified | Learn, "Ending Support in 2026" |
| 24 | WS2012/2012 R2 ESU Year 3 ends Oct 13, 2026 | Vendor table | verified | Learn, "Ending Support in 2026" |
| 25 | Windows Server 2016 EOS Jan 12, 2027 | Vendor table | verified | Learn, "Ending Support in 2027" |
| 26 | SQL Server 2017 EOS Oct 12, 2027 | Vendor table | verified | Learn, "Ending Support in 2027" |
| 27 | Windows Server 2019 and MIM 2016 EOS Jan 9, 2029 | Vendor table | verified (the WS2019 product page shows 1/10/2029 06:59 UTC-converted; the 2029 list gives January 9, 2029, used here) | Learn, "Ending Support in 2029" |
| 28 | MIM 2016 end of support extended from Jan 13, 2026 to Jan 9, 2029 | Vendor support | verified | Learn, "Microsoft Identity Manager 2016 news and updates" |
| 29 | Windows Server 2016 is the OS of many domain controllers built in the last decade | Vendor support | restated-as-design (hedged observation; no statistic claimed) | — |
| 30 | FedRAMP: "each agency still authorizes its own federal information systems"; never a standalone ATO for a CSO | What the clocks don't require | verified | FedRAMP "Using a FedRAMP Certified Cloud Service" |
| 31 | Class C "will include the current Moderate baseline"; Class D High | What the clocks don't require | verified | FedRAMP NTC-0004 |
| 32 | No federal document requires a ZT maturity stage; ZTMM is a guide | What the clocks don't require | verified (settled in B11 Ch03; linked) | B11 Ch03 and its verification file |
| 33 | Source exec brief: modernization "directly supports FedRAMP 20x" continuous authorization; evidence for "FedRAMP Moderate environments" | Not carried as stated | corrected | FedRAMP certifies cloud offerings; agencies authorize their own systems (#30); "Moderate" is now Class C (#31) |
| 34 | Source exec brief: three leadership phases A–C | Why one program | corrected (Book 01's seven phases and six gates are canonical; linked to B01 Ch12 and Ch05) | B00 brief; B01 Ch12 |
| 35 | Sequencing identity → network services/addressing/certificates → telemetry and automated governance | Why one program | restated-as-design | Source exec brief "modernization arc", condensed |
| 36 | Typical starting state (six bullets) | A typical starting state | restated-as-design (framing pattern, labeled; "GCC-Moderate" restated as "Microsoft 365 in a government cloud") | Case-study sources |
| 37 | Fifteen principles; seven phases and six gates | What a governed program needs | verified (internal) | B00 brief; B01 Ch12 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| modernization-overview.md — hero image | — | Old NanoBanana-style PNG with a mismatched alt; replaced by two house-style diagrams |
| modernization-overview.md — intro paragraph | Ch01 opening | Restated |
| modernization-overview.md — Executive summary (incremental, dependency-aware; deliver value early) | Ch01 "Why one program" | Restated; reference to `src/fmp/canon/modernization-registry.yaml` adapter inventory not carried (engine-internal file outside the workbook's books) |
| modernization-overview.md — The modernization arc (six steps) | Ch01 "Why one program" (sequencing paragraph) | Condensed to identity → network services/addressing/certificates → telemetry and automated governance as a design position; "overlay activation" and "drop-in overlay … FedRAMP Moderate" positioning not carried |
| modernization-overview.md — Program model, Phases A–C | Ch01 points to Ch05 and B01 Ch12 | Superseded by Book 01's phases and gates (Ch05 carries the mapping) |
| modernization-overview.md — FedRAMP 20x continuous authorization relationship | Ch01 "What the clocks don't require" | Corrected (see claims #33); OSCAL/evidence-generation points belong to Book 13/14 and Ch10 |
| modernization-overview.md — Maturity and delivery expectation (TARGET/DESIGN-ONLY, aspirational) | Ch01 "What leadership should take from this" item 3; Ch02 "Three kinds of statement" | Restated without internal maturity labels |
| modernization-overview.md — Leadership implications | Ch01 "What leadership should take from this" items 1–2 | Carried; "Phase 2 architecture-series deep dives" not carried (obsolete internal sequencing) |
| modernization-overview.md — Where to go deeper | Ch01 links to Ch03–Ch10 and B01 | Old whitepaper/adapter-overview links not carried (pages being archived) |
| federal-modernization-case-study.md — framing callout | Ch01 "A typical starting state" (framing label); Ch02 "Three kinds of statement" | Carried |
| federal-modernization-case-study.md — Engagement archetype | Ch01 "A typical starting state" (lead-in); Appendix B | Detail left to Appendix B (W5) |
| federal-modernization-case-study.md — Starting state (typical) | Ch01 "A typical starting state" | Carried; "GCC-Moderate" restated |
| federal-modernization-case-study.md — Intervention phases 1–5, substrate behaviors, why structurally different, lessons, promotion | Appendix B (W5) | Not in Ch01 scope; CLI names and substrate vocabulary are engine-specific |
| federal-modernization.md — Starting state | Ch01 "A typical starting state" | Carried (client/server, AD, on-prem SQL Server, perimeter, independent projects, retrospective evidence) |
| federal-modernization.md — Intervention | Ch01 "Why one program" (sequencing) | Carried as design position |
| federal-modernization.md — Observed behavior (intended) | Ch01 "What leadership should take from this" item 2 | Gates on evidence carried |
| federal-modernization.md — Lessons | Ch01 "What leadership should take from this" items 1 and 3 | Carried |

## Cross-chapter consistency pass

Checked October 21, 2026. Book 00's chapters were reconciled with each other; each external fact touched was re-opened on its primary source.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| X1 | Jan 1, 2027: rules take mandatory effect "for all stakeholders," subject to area-specific applicability and effective dates; over the next year all CSPs must follow them to keep certification | Federal policy table | verified; wording made exact, and aligned with Ch05 (which had narrowed it to providers) | FedRAMP, "Important Dates for the Consolidated Rules for 2026" (fedramp.gov/2026/timeline), Mandatory Adoption entry, fetched Oct 21, 2026 |
