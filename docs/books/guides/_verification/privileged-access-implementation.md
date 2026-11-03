# Verification — Guide: Privileged Access, an Implementation Guide

New guide, first pass of 2026-11-02. The guide is a gated operator layer over the developer workbook *Building Privileged Access* (Chapters 01 to 08, their Verified facts and Federal requirements and evidence tables, and the research gaps log), the project plan `docs/project-plans/privileged-access.md` (gates, decisions and work breakdown), Book 04 (Ch 02, 04, 07, 08, 09, 10 and Appendix B), Book 02 Appendix A (the BOD 25-01 Entra ID list), the `examples/privileged-access` scripts and the `examples/validation-kit` README (VK-CA-01). The Federal Compliance book `Vol_III_Book_01_Privileged_Access_Management.md` is linked only for the PAW hardware baseline, as Book 04 Ch 04 links it; no fact is taken from it. The workbook's Chapter 09 (deployment runbook) wasn't on `origin/main` on 2026-11-02 (`git log origin/main -- docs/project-plans/developer-workbooks/privileged-access/09-*` returned nothing), so the guide links the workbook index instead.

Facts carried from the chapters and books are cited by link and rely on those pages' own verification logs. Microsoft Learn facts reuse the chapters' footnotes, with each chapter's access date. One Learn page was read again on 2026-11-02 through the Microsoft Learn documentation service (claim 10). No personal name or email address was sent in any request.

## Claims log: Learn and federal facts (footnoted, carried from the chapters)

| # | Claim (short) | Where in the guide | Verdict | Source (chapter footnote reused) |
|---|---|---|---|---|
| 1 | Zero permanently active assignments except emergency accounts | Track at a glance | carried | `pag-pim-plan` = `pa01-pim-plan` |
| 2 | Role-assignable at creation only; at most 500; P1, P2 for PIM | Prerequisites; Step 5 | carried | `pag-rag` = `pa05-rag` |
| 3 | Only users eligible for Azure roles; P2 or ID Governance | Prerequisites; Step 6 | carried | `pag-az-integration` = `pa06-integration` |
| 4 | Access reviews need ID Governance (stricter page); SP reviews need Workload ID Premium; monthly review ≤ 27 days | Prerequisites; Step 7 | carried | `pag-ar-licensing`, `pag-ar-pim-review` = `pa07-licensing`, `pa07-pim-review` |
| 5 | Audit retention 30 days P1/P2, 7 Free, not retroactive; diagnostic setting categories; Security Administrator | Prerequisites | carried | `pag-retention`, `pag-streams` = `pa08-retention`, `pa02-streams`, `pa02-integrate` |
| 6 | The lockout; approvers default; context before PIM; fallback not on off/report-only/excluded; don't scope to roles; every time; 10-minute window; CA roles highly privileged; activation 1–24 h | Steps 2, 3, 4; Dangers | carried | `pag-pim-settings` = `pa03-pim-settings`, `pa04-settings`, `pa04-settings-reauth` |
| 7 | Activation at most 8 h (PIM API overview) | Step 4 | carried; Learn conflict recorded in research gaps row 41 | `pag-pim-api` = `pa04-pim-api` |
| 8 | Emergency access standard | Step 2 | carried | `pag-emergency` = `pa02-emergency` |
| 9 | FIDO2 refresh-token sign-ins logged as non-interactive | Step 2 | carried | `pag-noninteractive` = `pa02-noninteractive` |
| 10 | Azure PIM through Resource Manager; Owner or UAA; Iteration 2 "will stop returning data on October 28, 2026"; **PIM alerts APIs preview** | Step 6; What couldn't be verified | **re-read 2026-11-02**: the page still says "will stop" although the date has passed; the guide says so. The PIM alerts preview statement is new to the guide and verified on this read | `pag-pim-apis` = `pa06-pim-apis` |
| 11 | Settings not inherited from subscription to resource group | Step 6 | carried | `pag-az-settings` = `pa06-settings` |
| 12 | Elevate access grants UAA on all subscriptions; max three subscription owners; Azure privileged administrator roles | Steps 1, 6 | carried | `pag-elevate`, `pag-az-best`, `pag-az-roles` |
| 13 | Fewer than five Global Administrators | Step 1; What couldn't be verified | carried | `pag-best` = `pa01-best` |
| 14 | 14 roles for admin phishing-resistant policy; register first | Step 3 | carried | `pag-admin-phish` = `pa03-admin-phish` |
| 15 | Report-only compliant-device prompts on macOS, iOS, Android | Step 3 | carried | `pag-report-only` |
| 16 | Protected actions; Graph assignment beta | Step 3 | carried | `pag-protected` |
| 17 | PIM for Groups: dynamic/synced not managed; last active owner; can't leave PIM | Step 5; Dangers | carried | `pag-pim-groups`, `pag-pim-groups-api` |
| 18 | Auto-apply with a default decision can revoke all access | Step 7 | carried | `pag-ar-settings` |
| 19 | PIM for Groups reviews preview; Azure review API preview only | Step 7 | carried | `pag-ar-pim-groups`, `pag-ar-arm` |
| 20 | `roleAssignmentRequestId` correlation; outside-PIM high risk; alert on PIM setting changes | Step 8 | carried | `pag-pim-audit`, `pag-secops` |
| 21 | Feature availability in Azure for US Government; ID Governance in GCC, GCC High, DoD | Every gate | carried | `pag-availability` |
| 22 | Graph and Resource Manager hosts per cloud | How to read | carried | `pag-deployments` |
| 23 | Moderate baseline membership of every control named; AC-2(7) not selected | Every gate; Evidence | carried (union of the chapters' OSCAL reads, Nov 2, 2026) | `pag-moderate` |
| 24 | KSI related controls | Every gate | carried (chapters' KSI reads, Nov 2, 2026) | `pag-ksi` |
| 25 | BOD 25-01 MS.AAD.3.6v1, 7.1v1, 7.3v1, 7.4v1, 7.5v1, 7.6v1; ScubaGear 7.4v1 emergency exception | Gates 1–5, 8 | carried | `pag-bod`, `pag-scuba` |
| 26 | MS.AAD.7.7v1 and 7.8v1 on the BOD 25-01 mandatory list | Dangers; What couldn't be verified | carried by link | Book 02, Appendix A |
| 27 | M-22-09 phishing-resistant MFA | Step 3 | carried | `pag-m2209` |

## Claims log: carried from the books, plan and chapters (linked, not footnoted)

| Claim (short) | Where in the guide | Carried from |
|---|---|---|
| Tiers, PRV groups, emergency standard, PAW enforcement | Track at a glance; Steps 2, 3 | Book 04 Ch 04 |
| Settings by tier; Steps 0, 2, 5, 7, 8; validation test plan; assessment evidence | Steps 2–4, 7, 8 | Book 04 Ch 08 |
| Wave 2 policies; government cloud notes; rollback | Step 3 | Book 04 Ch 07 |
| Review cadence and PRV group reviews | Step 7 | Book 04 Ch 09 |
| Change control; drift; Tier 0 drift as incident | Steps 3, 8 | Book 04 Ch 10 |
| Plan gates 0–4, decisions D-A1 to D-A7, tasks A0.1–A4.3 | Path on one page; every gate | Project plan |
| D-A5 = Tier 1 pilot; 15-day active maximum; GA review "no change" | Steps 4, 7 | Workbook Ch 04 and 07 (research gaps rows 48, 49, 73, 74) |
| Rule IDs PA-INV, PA-EA, PA-CA, PA-PIM, PA-PG, PA-AZ, PA-AR, PA-AUD and what each flags | Every Validate | Workbook Ch 01–08 and the entry scripts' headers |
| Permissions per task | Prerequisites | Workbook Ch 01–08 least-privilege tables |
| Open items (rows 7, 38, 42, 58, 65, 69, 72, 85, 88, 89, 91) | What couldn't be verified | Workbook research gaps log |
| VK-CA-01 checks the emergency-access exclusion on persona policies | How to read; Step 2 | `examples/validation-kit` |

## The two SCuBA gaps, as recorded

- **MS.AAD.7.7v1.** No kit artifact alerts on every eligible or active highly privileged assignment. Chapter 02's alert covers the emergency accounts; Chapter 08's PA-AUD-01 flags outside-PIM assignments on a schedule. Recorded in Dangers and What couldn't be verified. MS.AAD.7.8v1 (alert on Global Administrator activation) is noted beside it.
- **MS.AAD.7.1v1 minimum of two.** Chapter 01's federal table says PA-INV-04 doesn't check the minimum. The guide notes that two emergency accounts with Global Administrator meet the floor in practice, marked *(inference)*.

### Closed by PR #326 (2026-11-02)

- **MS.AAD.7.1v1.** PA-INV-04 now also flags fewer than two users (Chapter 01's rule table). The guide's G1 row, Dangers and What couldn't be verified were updated; the *(inference)* note is gone.
- **MS.AAD.7.7v1 and MS.AAD.7.8v1.** `Invoke-PaPimAlertCheck.ps1` adds PA-PIM-10 and PA-PIM-11 (Chapter 04, "The alert check"; AU-6 and KSI-MLA-RVL as Chapter 04 cites them). The guide adds a G4 Validate line, a G4 requirement row and the evidence row. The danger is reworded to the alert nobody reads. What couldn't be verified keeps what the check doesn't reach: PIM for Groups member settings, delivery of the mail, and GCC High and DoD.
- **MS.AAD.7.7v1 and MS.AAD.7.8v1 on PIM for Groups (added November 2, 2026).** The check now also reads the PIM for Groups member policy of each group that holds one of the eight roles, eligible or active, and reports PA-PIM-12 and PA-PIM-13 (Chapter 04, "The alert check"; its log, F8; research gaps, rows 111 and 113). CISA's `aad.md` implementation steps and ScubaGear's provider and Rego were read at commit `997f933`. The G4 Validate line, the G4 requirement row, the read permissions table and the danger name PA-PIM-12 and PA-PIM-13. What couldn't be verified drops PIM for Groups and keeps delivery of the mail and GCC High and DoD, which now also covers the group read.

### Chapter 09 linked (2026-11-02)

- The workbook's Chapter 09 (deployment runbook) is on `origin/main` (PR #311, commit `02a3733a`). The path on one page now links it in place of the workbook index, and What couldn't be verified says the runbook exists but hasn't been run against a live tenant, as Chapter 09's own description says.

## Neutrality

Fictional data only (`contoso.example`). No agency named. No prohibited terms.
