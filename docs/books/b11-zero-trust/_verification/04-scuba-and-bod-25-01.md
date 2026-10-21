# Verification — Chapter 04, SCuBA and BOD 25-01

Writer W3. All sources opened October 21, 2026. CISA pages read with WebFetch; ScubaGear and ScubaGoggles release data and baseline documents read from GitHub (API and raw files at tag `v1.8.0` and branch `main`); PowerShell Gallery version history read directly. Policy counts per baseline were computed by the writer from the v1.8.0 baseline documents (distinct `#### MS.<PRODUCT>.n.mvN` headings).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SCuBA established 2022; baselines for M365 and Google Workspace; ScubaGear and ScubaGoggles no-cost tools; Hybrid Identity Solutions guidance; TRA | What SCuBA is | verified | CISA SCuBA project page |
| 2 | Baseline policies are SHALL/SHOULD with versioned IDs; MS.AAD.1.1v1 "Legacy authentication SHALL be blocked" | What SCuBA is | verified | ScubaGear `aad.md` |
| 3 | ScubaGear 1.8.0 released May 7, 2026; products Entra ID, Defender, Exchange Online, Power BI, Power Platform, SharePoint, Teams | What SCuBA is | verified | GitHub releases API (2026-05-07T21:44Z); v1.8.0 README |
| 4 | 2.0.0-rc1 and rc2 prereleases, Oct 8, 2026; baselines differ from 1.8.0 | What SCuBA is | verified | PowerShell Gallery; `aad.md` main (34 policies) vs v1.8.0 (30) |
| 5 | BOD 25-01 issued Dec 17, 2024; FCEB; production/operational tenants with finalized baseline; M365 only at issuance; later baselines come into scope | What BOD 25-01 requires | verified | BOD 25-01 page |
| 6 | Six required actions and dates (Feb 21, 2025 with annual Q1 update; Apr 25, 2025 with continuous or quarterly manual reporting; Jun 20, 2025; future updates on CISA timelines; new tenants before ATO; explain deviations) | Required actions table | corrected | BOD 25-01 page. Source tabulated five obligations ending in a "Remediation" row; the directive has six required actions and no separate remediation action |
| 7 | AOs may accept risk for deviations; CISA reviews/resolves AO deviations; CISA maintains list and notifies; baselines not updated within one year fall out of scope | Required actions | verified | BOD 25-01 page |
| 8 | Background: "remediate deviations from the secure configuration baselines" | Required actions | verified | BOD 25-01 page (quoted) |
| 9 | Inventory not one-time; refreshed each first quarter | Required actions table | verified | BOD 25-01 page (source correct) |
| 10 | In-scope definitions: official business; test/dev excluded; inside authorization boundary; SaaS only, IaaS/PaaS out even sharing Entra ID; only mandatory "shall" policies | What "in scope" means | verified | Implementation guidance (updated Jul 27, 2026) |
| 11 | Required Configurations M365 counts: Entra 20, Defender 8, EXO 10, Power Platform 4, SharePoint/OneDrive 4, Teams 4 = 50; no Power BI | Mandatory list table | verified | Required Configurations page |
| 12 | Baseline policy counts at v1.8.0: aad 30, defender 19, exo 40, powerbi 8, powerplatform 9, sharepoint 8, teams 20 | Mandatory list table | verified (writer's count) | v1.8.0 baseline documents |
| 13 | MS.AAD.3.5v2 not on mandatory list | Mandatory list | verified | Required Configurations page (absent from 20 listed Entra IDs) |
| 14 | MS.AAD.3.3v2 modified Jul 2025; MS.TEAMS.1.2v2, 2.1v2, 2.2v2 modified Feb 2026 | Mandatory list | verified | Required Configurations page ("Date Added / Modified" 07/07/2025, 02/11/2026) |
| 15 | Main-branch baselines add MS.AAD.5.5v1–5.7v1 and 9.1v1; 22 Entra policies carry BOD 25-01 indicator vs 20 on CISA page | Mandatory list | corrected | `aad.md` main. Source said 5.5–5.7 "added 11 May 2026" and an AI-agent policy "added 22 Jun 2026" at v1.8.0; they are not in v1.8.0, and the baseline's own "last modified" dates read April 2026 and March 2026. Exact add dates not carried |
| 16 | Google Workspace on Required Configurations page: Common Controls, Gmail, Calendar, Chat, Drive and Docs, Groups for Business, Meet; due 12/01/2026 | Google Workspace | verified | Required Configurations page |
| 17 | GWS milestones: inventory Nov 2, 2026; tools Dec 1, 2026; mandatory policies Dec 31, 2026 | Google Workspace | verified (discrepancy with #16 recorded) | Implementation guidance (quoted dates) |
| 18 | Workspace "gained BOD 25-01 Requirement indicators on 10 Jul 2026" | Google Workspace | removed | Date not found; ScubaGoggles v1.0.0 release notes record adding the indicator (row 19) |
| 19 | ScubaGoggles v1.0.0 Jul 24, 2026 adds BOD 25-01 indicator, removes alpha warning; v1.0.1 Jul 28, 2026 dependency hotfix | Google Workspace | verified; "GA" wording corrected | GitHub releases API and notes. Release notes don't say "general availability" |
| 20 | Reporting options: CISA-hosted ScubaConnect (CDM dashboard), self-hosted, agency-hosted CLAW/TALON (at least quarterly), manual CyberScope quarterly from most recent tool version | How agencies report | verified (new) | Implementation guidance |
| 21 | ScubaConnect = GearConnect (ScubaGear) + GogglesConnect (ScubaGoggles) | How agencies report | verified | ScubaConnect README |
| 22 | Reported artifact `ScubaResults_<UUID>.json`, not renamed; "Omitted" with rationale; omissions approved via risk management; CSV/POA&M template | How agencies report | verified (new) | Implementation guidance |
| 23 | BOD 25-01 doesn't cover on-prem AD, NTLM, endpoints, networks, Azure IaaS/PaaS | What it doesn't cover | verified | Directive scope; guidance SaaS-only statement; settled fact (Book 09 Ch03, Book 01 App A) |
| 24 | Four administrative rows vs remediation; compliance measured by mandatory policies holding and owned deviations | Administrative obligations | restated-as-design | Program position; restructured onto the six actions |
| 25 | "Agencies met the early deadlines" | Administrative obligations | restated-as-design | Generalized framing; no compliance statistic cited |

## Carry-forward ledger

Source: `docs/whitepapers/bod-25-01-close-before-assess.md` (shared with Chapter 08).

| Source page § | Went to | Or why not carried |
|---|---|---|
| Download DOCX callout | — | Site artifact for the archived page |
| Problem, solution, ask box | Ch04 §Administrative obligations and substantive work (problem); Ch08 opening and §Route every finding (solution, ask) | — |
| Executive summary (BOD summary, early deadlines) | Ch04 §What BOD 25-01 requires; Ch08 opening (thermometer) | — |
| Executive summary ("ZTTT" naming note) | Ch05 §The Zero Trust Assessment | — |
| Figure (six-phase sequence SVG) | Ch08 `ch08-close-then-assess` | Replaced by house-style source |
| §1 What BOD-25-01 actually requires (table) | Ch04 §What BOD 25-01 requires, §Google Workspace is in scope, §Administrative obligations and substantive work | Table rebuilt on the six actual required actions (row 6) |
| §2 What the assessors measure | Ch08 §What the assessors can't do; tool comparison to Ch05 | — |
| §3 Coverage arithmetic + ILLUSTRATIVE callout | Ch08 §Two kinds of finding | — |
| §4 Correct sequence (table) | Ch08 §The sequence | — |
| §5 Closing findings first | Ch08 §Closing findings first | — |
| §6 Then assess continuously | Ch08 §Then assess, continuously | — |
| §7 Honest limits | Ch08 §Where this argument stops | — |
| §8 Conclusion | Ch08 closing paragraph | — |
