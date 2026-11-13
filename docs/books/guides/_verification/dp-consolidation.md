# Verification — Guide: Distribution Point Consolidation (decision guide)

New guide, first pass of 2026-11-08. The guide is a decision guide over Book 09 Ch 11 (the worked case, cost model, capacity limits, retirement gates, Connected Cache, roadmap and recommendation), Book 05 Ch 04 (Intune-first pillars), Book 00 Appendices A and B, Book 13 Appendix A and Book 14 Ch 03 (control and KSI mappings), and the Ticket-to-Machine task catalog guide (Copilot in GCC). Facts carried from those pages are cited by link and rely on their own verification logs. New external facts are footnoted; each Microsoft Learn page marked "opened" was fetched or searched on 2026-11-08 through the Microsoft Learn documentation service. Pages marked "carried" were verified in the log of the page named and are cited at the same URL.

The case is a framing pattern: about 1,500 offices, about 70,000 endpoints, a request of about \$50M. No agency is named, and the guide says nowhere that an agency is about to spend.

## Claims log: new external claims (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | The DP role uses IIS, BITS and Remote Differential Compression | What changed | verified (opened) | `dpc-dp-prereq` |
| 2 | Windows devices can download Intune Win32 app content through Delivery Optimization, peer-to-peer on by default; Connected Cache can run on CM DPs | What changed; Availability | verified (opened) | `dpc-win32` ("Delivery optimization") |
| 3 | Intune's PowerShell script installer: up to 50 KB; return code decides status | Packaging | verified (opened) | `dpc-win32` ("PowerShell script installer") |
| 4 | Win32 apps must install silently; Content Prep Tool makes `.intunewin`; 30 GB per app | Packaging | verified (opened) | `dpc-win32-prep` |
| 5 | Peer cache serves clients in the current boundary group only; no peers from neighbor groups; partial download in parts | What changed; Target architecture | verified (opened) | `dpc-peercache` |
| 6 | Boundary group options: peer downloads, same-subnet only, prefer DPs over peers | Target architecture | verified (opened) | `dpc-bg-options` |
| 7 | Clients try the current boundary group until the fallback time, then neighbors | Target architecture | verified (opened) | `dpc-bg-dp` |
| 8 | 4,000 clients per DP (depends on network and hardware); 250 standard DPs per site plus 2,000 pull; 25,000 clients per MP | Question 3 | verified (carried, Book 09 Ch 11) | `dpc-sizescale` |
| 9 | DP role supported on Windows Server 2019, 2022 and 2025 | Target architecture | verified (opened) | `dpc-siteos` |
| 10 | Connected Cache for Enterprise and Education: Windows Server 2022+, Windows 11 or Ubuntu 24.04; Azure subscription; nothing else on port 80 | Target architecture | verified (carried, Book 09 Ch 11) | `dpc-mcc-ent`, `dpc-mcc-prereq` |
| 11 | CM-integrated cache on a DP with no other roles serves only Intune-shifted content, including Win32 apps | Target architecture | verified (carried) | `dpc-mcc-cm` |
| 12 | GCC uses commercial Intune; Connected Cache for Enterprise not listed as unavailable for GCC | Availability | verified (carried) | `dpc-intune-gov` |
| 13 | After the client apps workload moves, CM-deployed apps stay in Software Center | Retirement gates; Packaging | verified (opened) | `dpc-comanage` |
| 14 | After switching an app workload you can still deploy from CM | Packaging | verified (opened) | `dpc-comanage-faq` |
| 15 | PSAppDeployToolkit: "A PowerShell-based framework to simplify and standardize deploying software to Windows, at scale"; supports Intune and ConfigMgr | Packaging | verified (opened; **not a Learn source**) | `dpc-psadt` (project site) |
| 16 | PSAppDeployToolkit is LGPL-3.0; v4.2 RC2 published October 1, 2026 | Packaging | verified (opened; **not a Learn source**) | `dpc-psadt-gh` (GitHub) |
| 17 | KSIs whose related controls include CM-2, CM-3, CM-6, CM-7, CM-8, SI-2, RA-5, SC-8, CP-10, CA-7; SA-22 → KSI-SCR-MIT; MP-6 → none | Requirements | verified (opened) | `dpc-ksi`; matches Book 13 App A and Book 14 Ch 03 |
| 18 | M-22-09 device goal: complete inventory | Requirements | verified (carried, Book 01) | `dpc-m2209` |
| 19 | Copilot available in GCC; prompts and responses stay in the government cloud; enterprise data protection | Copilot prompts | verified (carried, task catalog guide) | `dpc-copilot-gov`, `dpc-copilot-edp` |

## Facts carried from the books (linked, not footnoted)

| Fact | Linked source |
|---|---|
| \$33,333 per office; about twice the fully loaded server case; decomposition request | Book 09 Ch 11, the proposal under review |
| Annual release cadence; 18 months per version; hardware depreciates through FY31 | Book 09 Ch 11, the timing problem |
| 18 at the ceiling, 24 with headroom, 96,000 capacity, 73% | Book 09 Ch 11, content tier |
| Breakeven \$873 per office per month | Book 09 Ch 11, sensitivity |
| 24 servers at \$12,000 and licences at \$1,176 (\$316,224, rounded to \$316,000) | Book 09 Ch 11, hub equipment (this guide's arithmetic) |
| Peer ports TCP 8003, UDP 8004, TCP 7680; Group mode | Book 09 Ch 11, keeping content local |
| The five gates and why each binds | Book 09 Ch 11, when to retire the last DP |
| No greenfield Configuration Manager | Book 05 Ch 04, the five pillars |
| KSIs are provider-side; the agency aligns evidence | Book 00 App B |
| CM-3 in Moderate, not Low | Book 00 App A |

## Design guidance (labeled in the page)

The recommendation (hub tier now, cloud-first as the end state); the five standard-wrapper rules; the read-only-then-30-days retirement of an office DP; the worksheet rows and Copilot prompts.

## Not verified

- Which PSAppDeployToolkit release is "current stable" on any given day; the guide says to pin a released version.
- Any agency's numbers: the worksheet is blank by design.

## Claim language, November 8, 2026

The claim language was narrowed under the workbook's supports-not-satisfies rule (CONTRIBUTING.md, Claim language). No source changed and no source was re-opened.

| Before | After | Source |
|---|---|---|
| The federal requirements each step meets | The federal requirements each step supports | no source change |
| Each step the project plan schedules meets a requirement. | Each step the project plan schedules supports a requirement and produces evidence for it; the organization still sets the control parameters and procedures, and the assessor decides whether each control is satisfied. | no source change |

## Consistency read, November 8, 2026

| Before | After | Source |
|---|---|---|
| Table caption: "The four pieces of an implementation guide, and the plan" (the table lists six rows) | "The pieces of the guide set, and the plan" | the table itself; no source change |
