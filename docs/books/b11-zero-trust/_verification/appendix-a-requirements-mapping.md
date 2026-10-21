# Verification — Appendix A, Requirements Mapping: Pillars, Controls and Books

Checked October 21, 2026 by writer W2. No source page; the appendix is new, modeled on Book 09 Appendix B. Every requirement row was checked against the primary document named in its footnote (the same downloads as Chapters 03 and 06). Control titles, statements and Moderate-baseline membership were checked in the NIST OSCAL Rev. 5 catalog (release 5.2.0, downloaded from `usnistgov/oscal-content` and confirmed identical to the copy used for Book 09) and the SP 800-53B Moderate profile. Workbook link targets were checked on disk.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ZTMM is a guide; M-22-09 sets no stage; no document defines a score | Callout | verified | ZTMM §5; M-22-09 §III |
| 2 | ZTMM function lists per pillar | ZTMM table | verified | ZTMM Tables 2 to 6 |
| 3 | Identity Advanced/Optimal quotes; identity stores integrated across partners at Optimal; JIT/JEA access at Optimal | ZTMM table | verified | ZTMM Table 2 |
| 4 | Devices include servers, networking equipment, cloud and virtual assets; Optimal view across vendors and service providers | ZTMM table | verified | ZTMM §5.2, Table 3 |
| 5 | Networks Traditional and Optimal text | ZTMM table | verified | ZTMM Table 4 |
| 6 | Applications: contextual per-request authorization; public-network availability; immutable workloads and automated testing at Optimal | ZTMM table | verified | ZTMM Table 5 |
| 7 | Data: inventory, categorize, label; protect at rest and in transit; detect and stop exfiltration | ZTMM table | verified | ZTMM §5.5 |
| 8 | Visibility and Analytics definition; Optimal centralized dynamic monitoring; model doesn't address "specifics for logging" | ZTMM table | verified | ZTMM §5, §5.6 Table 7 |
| 9 | Automation and Orchestration definition and Optimal | ZTMM table | verified | ZTMM §5, Table 7 |
| 10 | Governance definition and Optimal | ZTMM table | verified | ZTMM §5, Table 7 |
| 11 | Data pillar not designed in the workbook | ZTMM table; M-22-09 table | restated-as-design | Survey of `docs/books/` chapter lists (B01 Appendix A makes the same statement) |
| 12 | M-22-09 program actions (30-day lead, 60-day plan and budget, C-suite) | M-22-09 table | verified | M-22-09 §III |
| 13 | M-22-09 pillar actions §III.A to §III.E | M-22-09 table | verified | M-22-09 |
| 14 | M-22-09 not rescinded; deadlines passed | M-22-09 intro | verified (negative search) | OMB memoranda index; Chapter 03 claim 19 |
| 15 | EO 14028 §3(b)(ii) and §10(k) | Adjacent instruments | verified | EO 14028 |
| 16 | BOD 25-01 actions (tenant reporting, tool deployment, mandatory policies, deviations, new tenants before ATO) | Adjacent instruments | verified | BOD 25-01 page |
| 17 | Required configurations: Microsoft 365 and Google Workspace, GWS due Dec 1, 2026 | Adjacent instruments; cited-but-don't-exist | verified | CISA Required Configurations page |
| 18 | BOD 23-01: 7-day discovery, 14-day enumeration, cloud VMs, 72-hour CDM | Adjacent instruments | verified | BOD 23-01 page |
| 19 | M-26-14 rescinds M-21-31; LRA aligns with ZTMM; CEM and THIRF | Adjacent instruments | verified | M-26-14 p. 1, Appendix A |
| 20 | FedRAMP certifies the service; agency authorizes its own systems; risk for configuration and integrations | Adjacent instruments; cited-but-don't-exist | verified | FedRAMP "Using a FedRAMP Certified Cloud Service" |
| 21 | Control titles for AC-2, AC-2(1), AC-3, AC-4, AC-6, AC-17, IA-2, IA-2(1), IA-2(2), IA-2(12), IA-3, IA-5, CM-2, CM-6, CM-8, SC-7, SC-7(5), SC-8, SC-12, SC-13, SC-20, SC-21, SC-22, SC-28, RA-2, RA-5, RA-5(11), SI-2, SI-3, SI-4, AU-2, AU-6, AU-12, CA-2, CA-5, CA-7, IR-4, PL-8, SA-8, SA-9, SR-3, SR-6 | Controls table | verified | OSCAL catalog 5.2.0 |
| 22 | Quoted statement text: AC-6, CM-6, CM-8, SC-20/21/22 summaries, IA-2(12), SC-7(5), RA-5(11), SA-9 | Controls table | verified | OSCAL catalog 5.2.0 |
| 23 | Every control and enhancement in the table is in the Moderate baseline | Reading the controls | verified | OSCAL Moderate profile (each ID checked; PM-5, AC-16 and CA-8, which are not in Moderate, were left out of the table) |
| 24 | No control, enhancement or discussion text in the 5.2.0 catalog mentions zero trust | Reading the controls | verified | Case-insensitive search of the full OSCAL catalog JSON: zero matches |
| 25 | CM-8 read as one reconciled inventory across estates | Reading the controls | restated-as-design | Labeled as the program's reading |
| 26 | ZTMM doesn't address incident response | Controls table (IR-4) | verified | ZTMM §5 (p. 11) |
| 27 | AWS "a subset"; Azure "only a partial view" | Cited-but-don't-exist | verified | AWS Security Hub User Guide; Microsoft Learn |
| 28 | Mapping of rows to Book 11 chapters and closing books | All tables | restated-as-design | Chapter files of Books 01 to 09 and Book 11 on this branch; Book 10 linked by path per the brief |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| (none) | — | The appendix has no source page. Requirements were drawn from the primary documents; the format follows `docs/books/b09-network/appendix-b-requirements-mapping.md`, with a "Closed by" column added because the brief asks for the books that close each requirement. The controls the Chapter 03 source spec names (access control, continuous monitoring, incident response) are carried into the controls table. |
