# Verification — Runbook R03, The Authentication Audit

File: `docs/books/b06-data-platform/r03-the-authentication-audit.md`
Source: the same file (former Implementation Companion Book 03)
Verified: 2026-10-20

Script claims were checked line by line against the program's `tools/discovery/Spec3-D1.8-Get-SQLServerAuthAudit.ps1` and the D1.4, D1.5, D1.7, D1.10 and D1.12 scripts.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Prerequisite: SqlServer PowerShell module (optional) for `-QueryInstances` | Prerequisites | corrected: the script uses .NET `System.Data.SqlClient` with integrated security; the module isn't used | program source |
| 2 | Prerequisite: remote registry access for instance enumeration | Prerequisites | corrected: remote CIM (`Win32_Service`) access; no registry enumeration in the code | program source |
| 3 | (added) Catalog views show only metadata the caller has permission on, so a weak audit account returns a partial list silently | Prerequisites | verified (general metadata-visibility rule) | sys-linked-logins-transact-sql (permissions) |
| 4 | Parameter table (8 parameters, types, defaults) | Parameters | verified (program source `param()` block) | program source |
| 5 | `-D1InputFile` = "Spec3-D1.1 service-account scan" | Parameters, defects callout | corrected/flagged: Spec3-D1.1 isn't among the program's published discovery scripts (pending per the program changelog); described by required shape | program source and changelog |
| 6 | `-TargetServers` "otherwise auto-discovers" | Parameters | corrected: targets are *added* to the SPN-discovered set | program source |
| 7 | Usage example 2 passes the D1.5 JSON via `-D5InputFile` | Usage | corrected/flagged: D1.8 and D1.7 read `SPNInventory[]` (with `Hostname`, `RawSPN`, `AccountName`) but D1.5 emits top-level `SPNs[]` (`Host`, `SPN`, `SamAccountName`); passing the file yields zero SPN instances and suppresses the live query. Example replaced with `-TargetServers`; defect callout added | program source (D1.5 output block; D1.8/D1.7 input blocks) |
| 8 | Output file names `*_SQLServerAuthAudit.json`, `*_instances.csv`, `*_logins.csv` | Output schema | verified with pattern added (`<prefix>_Spec3_D1.8_SQLServerAuthAudit_<domain>_<timestamp>`) | program source |
| 9 | InstanceAudits field list | Output schema | verified; service-identity fields named explicitly | program source |
| 10 | logins.csv columns `LoginName`, `Type`, `Disabled`, the `sa` flag, `PasswordLastSet` | Output schema | corrected to `ServerName`, `InstanceName`, `LoginName`, `LoginType`, `IsDisabled`, `IsSA`, `CreatedDate`, `PasswordLastSet`; file written only when logins were returned | program source |
| 11 | MigrationTarget strings for v16+ and pre-2022 | Reading the result | verified (program strings; residue "(the program decision)" dropped) | program source |
| 12 | Entra auth for SQL Server on premises starts with SQL Server 2022 | Reading the result | verified | azure-ad-authentication-sql-server-overview |
| 13 | Blockers: mixed mode, enabled `sa`, orphaned logins, linked servers | Reading the result | verified | program source |
| 14 | (added) FCI hard blocker not detected by the script | Reading the result | verified (FCIs unsupported) | azure-ad-authentication-sql-server-overview |
| 15 | D1.5 "Every MSSQLSvc SPN" | Family table | corrected: every SPN in the domain (MSSQLSvc among them) | program source |
| 16 | D1.7 collisions break Kerberos → NTLM fallback | Family table | verified (duplicate SPNs cause Kerberos errors); NTLM fallback is the narrative's mechanism (Chapter 01) | kerberos-error-kdc-err-s-principal-unknown-or-not-unique |
| 17 | D1.10 "certificate-mapped logins / smart-card auth touching SQL" | Family table | corrected: directory-wide certificate-based-auth audit (PKI inventory, machine/user certificates, smart-card-required accounts) | program source |
| 18 | D1.12 owner matrix and waves | Family table | verified; noted D1.8 is passed via `-D8InputFile` | program source |
| 19 | Run order "pass the D1.5 JSON into both D1.7 and D1.8 via -D5InputFile" | Run order | corrected (claim 7) | program source |
| 20 | AD module absent → "instances still found via registry/-TargetServers" | Failure modes | corrected: only `-TargetServers` hosts; orphaned-login check also skipped | program source |
| 21 | `Query Failed` recorded; 3-second TCP budget; Timeout/Yes/No | Failure modes | verified; added that `No` hosts are skipped by `-QueryInstances` and the CIM failure state | program source |
| 22 | "the discovery pipeline feeds D2.1/D2.3"; "CCM-BIR" | Feeding closure | edited: internal deliverable IDs removed; CCM-BIR kept as the program's tool name (also used in R09); narrative Book 09 → Chapters 20–21 | — |
| 23 | Provenance "FMP_136 Spec 1 and Spec 3, Phase 1; the program decision" | Start here, footer | restated as "Phase 1 deliverables of the program's discovery specifications"; residue removed | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | title, `doc-type`, `status`, `lifecycle_review` 2027-04-01; `subtitle` folded into description; `canon-source` removed |
| docx H1 block; Download callout (Book_03.docx) | removed | Word file not on the site |
| Companion note callout | edited | thesis, "In this runbook" and "Pairs with" (Chapters 07–08) |
| Start here: the audit is the foundation | edited | claim 23; bracket link without target removed |
| The primary script (intro) | kept | — |
| Prerequisites | edited | claims 1–3 |
| Parameters | edited | claims 5–6 |
| Usage | edited | claim 7; illustrative-code warning added before the first code block |
| Output schema | edited | claims 8–10 |
| Reading the result: migration readiness | edited | claims 11–14; Book 04/05 → R04/R05; Category 3 → Chapter 07 |
| The supporting discovery family | edited | claims 15–19; Book 06/10 → R06/R10; narrative Book 10 → Chapter 22 |
| — | added | "Known defects in the input handoff" callout (claims 5, 7) |
| Failure modes | edited | claims 20–21 |
| Feeding CCM-BIR closure | edited | heading to "Feeding continuous-monitoring closure"; claim 22 |
| Safety | edited | discovery-only reads AD and host services (no SQL connection); renumbered |
| Closing italic footer | removed | duplicated the body; canon residue |
| — | added | "Continue the book" callout (R02 ← → R04) |
