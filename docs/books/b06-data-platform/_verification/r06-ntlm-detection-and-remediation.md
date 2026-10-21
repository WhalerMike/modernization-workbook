# Verification — Runbook R06, NTLM Detection & Remediation

File: `docs/books/b06-data-platform/r06-ntlm-detection-and-remediation.md`
Source: the same file (former Implementation Companion Book 06)
Verified: 2026-10-20

Microsoft claims were checked on Microsoft Learn (MCP search and fetch) on 2026-10-20. Script and module claims were checked against the program's source (`tools/discovery/Spec1-D1.5`, `Spec3-D1.7`, `Spec1-D1.4`; `FMPSqlServerMigration.psm1`, published in the workbook under the `FMP` prefix).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SQL Server falls back to NTLM when Kerberos can't complete (no ticket obtainable) | The shape of the problem | verified | Register a Service Principal Name for Kerberos connections |
| 2 | (added) Local connections use NTLM even with a correct SPN; an SPN on the wrong account makes authentication fail, not fall back | The shape of the problem; Verification | verified (authentication-defaults table) | Same |
| 3 | D1.5 parameters include `-D4InputFile` | D1.5 table | corrected: no such parameter in the script; row removed and noted | program source (`param()` block) |
| 4 | D1.5 output: JSON (`Summary`, `SPNs[]`, `Duplicates[]`, `Orphans[]`), CSV, `_duplicates.csv`; `IsOrphan`, `DaysSinceLogon`, `HasDelegation`, `MigrationTarget` | D1.5 | verified; file-name pattern added (`*_SPNInventory_<domain>_<timestamp>`) | program source |
| 5 | MSSQLSvc migration target "Entra ID auth for SQL 2022+ via Arc"; Entra auth starts with SQL Server 2022 | D1.5 | verified (program string; Learn applies-to) | program source; Microsoft Entra authentication for SQL Server |
| 6 | Missing SPN is the most common silent-NTLM cause; duplicate is second | D1.5 | restated-as-design ("in the program's experience") | — |
| 7 | (added) SPN formats `MSSQLSvc/<FQDN>:<port>`, `/<FQDN>`, `/<FQDN>:<instance>`; automatic registration needs permission; failure logged | D1.5 | verified | Register a Service Principal Name… |
| 8 | D1.7 parameters and five collision types; CRITICAL rule; `_collisions.csv`, `_remediation.csv` | D1.7 | verified | program source |
| 9 | (added) SPNs are case-insensitive on Windows; `setspn -X` / `-F` | D1.7 | verified | setspn |
| 10 | Detection pass passes the D1.5 JSON to D1.7 with `-D5InputFile .\output\*KerberosSPNInventory.json` | Detection pass | corrected: D1.7 reads `SPNInventory[]`, D1.5 writes `SPNs[]`, and the glob doesn't match D1.5's file name; supplying the file suppresses the live query. Example changed to a live D1.7 query; defect callout added (same defect as R03 claim 7) | program source |
| 11 | D1.4 finds unconstrained/KCD/RBCD and NTLM indicators (Protected Users, Authentication Policies and Silos); `_findings.csv`, `_chains.csv`, `Risk`, `Remediation` | D1.4 | verified; JSON output and `-D1InputFile` noted | program source |
| 12 | (added) `setspn -L/-Q/-X/-F` spot checks | Detection pass | verified | setspn |
| 13 | (added) NTLMv1 found via Event ID 4624 on DCs; Restrict NTLM audit events in the NTLM Operational log | Detection pass | verified (consistent with Book 05, Chapter 05) | Audit use of NTLMv1…; Policy CSP LocalPoliciesSecurityOptions |
| 14 | `New-FMPSpnRemediationPlan` / `Get-FMPNtlmGpoReport` emit plans, run no setspn/GPO | Remediation callout; collision repair; GPO | verified (functions exist; parameters and classifications present; never calls `Set-GPRegistryValue`/`Set-GPO`) | program source |
| 15 | Use `setspn -S`, not `-A`; `-S` rejects a duplicate | Register a missing SPN | verified | setspn |
| 16 | Register `MSSQLSvc/sqlhost:1433` and FQDN forms | Register a missing SPN | corrected/qualified: Microsoft documents the FQDN form; short-name form kept only for short-name clients, as program practice | Register a Service Principal Name… |
| 17 | Collision repair with `setspn -D`, leave one enabled owner | Repair a collision | verified (Microsoft's `-L`/`-Q`/`-D` sequence) | Explicit misplaced SPN problem in SQL Server |
| 18 | Linked-server passthrough "silently negotiates NTLM"; fix with a defined security context | Linked-server passthrough | corrected: impersonation is a double hop that needs Kerberos delegation; over NTLM it fails with ANONYMOUS LOGON rather than running on NTLM. Options restated: Entra-authenticated linked server (2022+; managed identity 2025+), Kerberos constrained/RBCD delegation, or a mapped remote login as a documented exception | sp_addlinkedsrvlogin; SPN Support in Client Connections; gMSA troubleshooting; Linked server with Entra auth; unconstrained delegation article |
| 19 | "Re-audit with D1.8 (`LinkedServers`)" | Linked-server passthrough | verified (D1.8 emits `LinkedServers`); linked to Runbook R03 | program source |
| 20 | LAN Manager level "Send NTLMv2 response only. Refuse LM & NTLM" blocks NTLMv1 | Phase B | verified and clarified: level 5 makes DCs accept only NTLMv2; doesn't block NTLMv2 (consistent with Book 05, Chapter 05) | Policy CSP LocalPoliciesSecurityOptions |
| 21 | Program's block "runs ahead of Microsoft's NTLMv1-SSO enforcement default (flips via Windows Update in October 2026)" | Phase B | corrected and dated: the October 2026 security update (message center, Oct 14, 2026) restricts NTLMv1-derived SSO credentials on devices without Credential Guard (MS-CHAPv2 impact); it's a different mechanism from DC-side refusal and has already shipped. NTLMv1 removed in Windows 11 24H2 / Server 2025 (consistent with Book 02, Chapter 03) | Windows message center; Deprecated features for Windows client |
| 22 | Restrict NTLMv2 "to documented exception groups" | Phase B | corrected: exceptions are server-name lists for the DC and client roles; no exception list for the server role | Status code 0x32… (seven NTLM policies) |
| 23 | 2027-04-01 full block is the program's own date, not FedRAMP or Microsoft | Phase C | verified as program design; Microsoft lists NTLM as deprecated and still working | Deprecated features for Windows client |
| 24 | `Get-FMPNtlmGpoReport` classes `unconfigured` / `below_target` / `phase_b_ntlmv2_only` / `phase_c_full_block`; records 2027-04-01 as backstop | GPO report | verified | program source |
| 25 | `klist purge`, `klist`; (added) `klist get`; `auth_scheme = KERBEROS` | Verification | verified | klist; Register a Service Principal Name… |
| 26 | Rollback by `setspn -D` / re-add, restore LAN Manager level | Verification | verified (setspn); Restrict NTLM values added | setspn |
| 27 | Narrative Book 06, Book 09/D1.8 references, docx link | throughout | edited: Chapters 14–15, Runbook R03; docx callout removed | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | title `Runbook R06 — …`; `doc-type: workbook-chapter`; `status: draft`; `lifecycle_review: 2027-04-01`; `subtitle` and `canon-source` removed; description rewritten as one sentence |
| docx H1 block | removed | Word build artifact |
| Download this book callout (Book_06.docx) | removed | Word file not on the site; the runbook page is the link |
| Companion note callout | edited | became thesis, "In this runbook" callout and "Pairs with" paragraph (Chapters 14–15); canon citation "(the program decision, … §3.2)" removed |
| The shape of the problem | edited | claims 1–2 |
| Phase 1 — D1.5 | edited | claims 3–7; illustrative-code warning added before the first code block |
| Phase 1 — D1.7 | edited | claims 8–10; defect callout added |
| Phase 1 — D1.4 | edited | claim 11 |
| Detection code block | edited | claims 10, 12; setspn spot checks and NTLM auditing paragraph added (claim 13) |
| Phase 2 warning callout | edited | repository path removed; module named |
| Register a missing SPN | edited | claims 15–16 |
| Repair a collision | edited | claim 17; "Available" run-in label removed; canon residue removed |
| Linked-server passthrough | edited | claims 18–19; expanded into three options |
| Phased Group Policy block | edited | heading "Phased Group Policy restriction"; claims 20–24 |
| Verification & rollback | edited | claims 25–26 |
| Closing italic footer | removed | duplicated the body; repository paths and canon residue |
| — | added | "Continue the book" callout (R05 ← → R07); footnotes `[^r06-*]` (16) |

## Review fixes, 2026-10-21

Applied from the verified review findings (critique claims re-checked against primary sources on 2026-10-21). Every factual change was re-researched and carries its own footnote; wording-only changes are marked as such.

| # | Change | Where | Verdict | Source |
|---|---|---|---|---|
| RF-1 | Two bullets both labelled "Phase B —" relabelled "Phase B, step 1" (refuse LM and NTLMv1) and "Phase B, step 2" (restrict NTLMv2); phase name kept because `Get-FMPNtlmGpoReport` emits `phase_b_ntlmv2_only` | Phased Group Policy restriction (lines 143–144) | wording only, no new factual claim; no new footnote | — |
