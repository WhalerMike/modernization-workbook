# Verification — Chapter 15, The Three Phases of NTLM Elimination for SQL Server

Checked October 20, 2026. Source: the existing page (former Book 06, Chapter 2) verified and upgraded in place. The Book_06 front page was carried into Chapter 14.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Three phases; domain-wide block no later than 2027-04-01 | Opening | restated-as-design | Program decision; Microsoft has set no NTLMv2 removal date (Learn, Features removed … Windows Server) |
| 2 | Connection needing NTLM fails at the LSA; engine never sees the login | Opening | verified (mechanism) | Windows Authentication is negotiated by the Windows security layer (Learn, Register an SPN) |
| 3 | Phase A audit output contents | Phase A | restated-as-design | Program instrument (Chapter 07) |
| 4 | Events 4624/4625, logon type 3, package NTLM | Phase A | verified | Learn, Audit use of NTLMv1 on a DC (4624 sample: logon type 3, NtLmSsp, package NTLM) |
| 5 | NTLM V1 reported for anonymous logons — ignore | Phase A | verified (new) | Same |
| 6 | `sys.dm_exec_connections.auth_scheme` shows NTLM/KERBEROS per connection | Phase A | verified (new; carried from Book_06 references) | Learn, Register an SPN |
| 7 | Restrict NTLM audit policies; NTLM Operational log | Phase A | verified (new) | Learn, Policy CSP LocalPoliciesSecurityOptions |
| 8 | Event 8004 on DCs | Phase A | verified (new) | Learn, Defender for Identity — Configure Windows event auditing |
| 9 | Enhanced NTLM logging: events 4020–4023, 4030–4033; 24H2/WS2025; WS2022/2019 with Oct 13, 2026 updates | Phase A | verified (new; page carried from Book_06 references) | Microsoft Support, Overview of NTLM auditing enhancements |
| 10 | Primary Phase B control is NTLMv1 blocking (level 5) | Phase B | verified, clarified | Learn, How to enable NTLM 2 authentication: level 5 still accepts NTLMv2 |
| 11 | SPN correction converts NTLM to Kerberos | Phase B | verified; duplicate/wrong-account SPNs added as failures | Learn, Register an SPN |
| 12 | CKT doesn't remove DC reachability | Phase B | verified | Learn, Introduction to Microsoft Entra Kerberos |
| 13 | NTLMv2 restriction staged with Restrict NTLM deny settings | Phase B | verified (new; the source didn't name the control) | Learn, Policy CSP; Learn, Status code 0x32 (seven policies) |
| 14 | Exception lists exist only for client and DC roles; none for the server role | Phase B | verified (new) | Learn, Status code 0x32, More information |
| 15 | Phase C: "Group Policy … restricts NTLM authentication at the LSA layer on every host" | Phase C | edited | Named the Restrict NTLM deny settings; added NTLM policy CSP `BlockAll` (24H2+) from Learn, Policy CSP - NTLM |
| 16 | Entra logins (type E/X) don't use NTLM or Kerberos | Phase C | verified | Learn, Microsoft Entra authentication for SQL Server (token-based; SQL and Windows modes unchanged) |
| 17 | Source: "the login migration of Book 05" | Phase C | corrected | → Chapters 11–12 |
| 18 | Pre-2022 instances can't use Entra auth | Callout | verified (new detail) | Learn, Microsoft Entra authentication for SQL Server (SQL Server 2022 and later) |
| 19 | Certificate-based interim posture needs replacement CA before AD CS retires | Callout | restated-as-design | Program dependency (Chapter 22); "Book 10" → Chapter 22 |
| 20 | Callout "Known fact … (Chapter 1)" | Callout | corrected | → Chapter 14 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, H1 "Chapter 2 — …" | Front matter, H1 | edited |
| Thesis line | Thesis | kept |
| "In this chapter" | Same | edited |
| Opening two paragraphs | Opening | edited (program-date clarification; LSA sentence sourced) |
| Phase A — Discovery (+ diagram) | Same | edited: event sources turned into a four-item list with Restrict NTLM auditing and enhanced logging |
| Phase B — Restriction | Same | edited: work turned into a list by pattern; NTLMv2 deny staging and exception lists added |
| Phase C — Elimination (+ diagram) | Same | edited (claims 15–17) |
| "Unresolved: what happens to the long tail" warning callout | Same | kept; cross-references renumbered |
| "What Book 06 establishes — Chapter 2" | "What this chapter establishes" | edited |
| Footnotes (spn, ntlm-removed, ckt, linked) | Footnotes | re-keyed `c15-`; CKT footnote replaced by Entra Kerberos page; all re-opened |
| — (no Continue callout in source) | Continue the book | added |
