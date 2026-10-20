# Verification — Runbook R10, Certificate Discovery for SQL Server's ADCS Dependencies

File: `docs/books/b06-data-platform/r10-certificate-discovery-for-adcs.md`
Source: the same file (former Implementation Companion Book 10)
Verified: 2026-10-20

Microsoft claims were checked on Microsoft Learn on 2026-10-20; the NIST baseline claim against the SP 800-53B control-baselines spreadsheet downloaded from csrc.nist.gov. Script and function claims were checked against the program's `tools/discovery/Spec3-D1.10-Get-CertBasedAuthAudit.ps1`, `FMPSqlServerMigration.psm1` and `FMPPlanGenerators.psm1` (published under the `FMP` prefix). Kept consistent with Chapter 22.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | No normative decision governs AD CS → cloud PKI ("§3.3 Not Yet Defined") | Opening | restated-as-design (program gap); canon section number removed | — |
| 2 | D1.10 parameters | Parameter table | verified; `-IncludePKIAudit` clarified as `certutil -TCAInfo`; `-D1InputFile` Spec3-D1.1 flagged as unpublished | program source |
| 3 | Six analysis sections incl. LDAPS on DCs | D1.10 | verified (program); (added) LDAPS certificate requirements | program source; Configure certificates for LDAP over SSL |
| 4 | "Enterprise Admin for full templates" | Code comment | restated as the script's own guidance (unverified as a Microsoft requirement) | program source |
| 5 | Output file name, `_machines.csv`, `_users.csv` | Output schema | verified | program source |
| 6 | `SmartCardRequired` from UAC `SMARTCARD_REQUIRED` | Output schema | verified (0x40000) | UserAccountControl flags |
| 7 | `HasSmartCardLogon` is a user field | Output schema | corrected: it's a template field (Smart Card Logon EKU) | program source |
| 8 | `altSecurityIdentities` binding; (added) KB5014754 strong mapping and certificateUserIds sync limits | Output schema | verified | Mapping to the certificateUserIds attribute |
| 9 | D1.10 doesn't reach the engine's TLS certificate or type-C logins | What D1.10 gives you | verified (program reads AD only) | program source |
| 10 | `New-FMPSqlCertificatePlan` classes `tls_server_cert`, `certificate_mapped_login`, `cba_posture`; `requires_review` | What D1.10 gives you | verified | program source |
| 11 | `sys.dm_server_registry` query for `SuperSocketNetLib` `Certificate` | In-engine reads | verified; columns made explicit | sys.dm_server_registry; Encrypt connections… |
| 12 | (added) Empty registry value ≠ no certificate: auto-selected FQDN cert or self-generated; error log records the loaded cert | In-engine reads | verified | Encrypt connections… (certificate precedence); OS error 10054 article |
| 13 | Type-C join `c.principal_id = sp.principal_id` | In-engine reads | corrected: link is `sid` (login SID for the certificate); `principal_id` is the owning database principal; run in `master`; `issuer_name` added | sys.certificates |
| 14 | (added) Mirroring/AG endpoint authentication (`connection_auth_desc`) | In-engine reads | verified | Transport security in AGs and mirroring; sys.database_mirroring_endpoints |
| 15 | TLS "required under FedRAMP-Moderate" | Step 2 table | corrected/sourced: SC-8 and SC-8(1) are in the NIST SP 800-53B moderate baseline; FedRAMP wording dropped | NIST SP 800-53B baselines spreadsheet |
| 16 | (added) Entra connections require encryption | Step 2 table | verified | Entra auth setup tutorial |
| 17 | Expired TLS cert → validating clients reject | Step 2 table | verified (cert must be within validity; clients validate) | Certificate requirements for SQL Server |
| 18 | Type-C login: "client presents a cert as the credential"; "login fails when cert expires"; fix by type-E SP login | Step 2 table and note | corrected: certificate/asymmetric-key logins are for code signing only and can't connect; built-in signing functions don't check expiry; most such certificates are self-signed by SQL Server; real AD CS dependency only for imported AD CS-issued certificates (consistent with Chapter 22) | CREATE LOGIN (Remarks); CREATE CERTIFICATE |
| 19 | CBA as NTLM-replacement interim posture | Step 2 table | restated-as-design and defined as in Chapter 22 | — |
| 20 | `New-FMPPKIMigrationPlan` params, topological order, blockers, `migrate_ca` | Step 3 | verified (function and parameters exist) | program source |
| 21 | (added) Microsoft Cloud PKI issues via SCEP to Intune-managed devices; Intune doesn't support Windows Server | Step 3 | verified; stated as an observation for the pending decision | Overview of Microsoft Cloud PKI; Book 05, Chapter 09 |
| 22 | Sequencing against 2027-04-01 (Book 06, Book 09) | Sequencing finding | edited: program date; Runbooks R06, R09 | — |
| 23 | Narrative Book 10, Books 02/05/07 | throughout | edited: Chapter 22; Runbooks R02, R05, R07 | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited | title `Runbook R10 — …`; `doc-type`, `status: draft`, `lifecycle_review: 2027-04-01`; `subtitle`, `canon-source` removed; one-sentence description |
| docx H1 block; Download callout (Book_10.docx) | removed | Word file not on the site |
| "Not Yet Defined" warning callout | edited | folded into "In this runbook" and "Pairs with" (Chapter 22); the not-governance caution kept; claim 1 |
| Why discovery comes long before any decommission date | edited | "three capabilities fail" softened to "capabilities fail" (claim 18) |
| Step 1 — D1.10 | edited | claims 2–4; illustrative-code warning added before the first code block; broken bracket link removed |
| Output schema | edited | claims 5–8 |
| What D1.10 does and does not give you | edited | claims 9–14; queries corrected and extended |
| Step 2 — three dependencies table | edited | claims 15–19 |
| Step 3 — CA migration order | edited | claims 20–21 |
| The sequencing finding | edited | claim 22 |
| Safety | kept | wording aligned |
| Closing italic footer | removed | duplicated the body; paths and canon residue |
| — | added | "Continue the book" callout (R09 ← → Appendix A); footnotes `[^r10-*]` (14) |
