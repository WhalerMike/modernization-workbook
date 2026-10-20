# Verification — Chapter 21, What Done Looks Like

Source: the existing page `21-what-done-looks-like.md` (former narrative Book 09, Chapter 2, "The 2027 Milestone: What Done Looks Like"). Book_09's front page is carried into Chapter 20. All sources accessed Oct 20, 2026.

## What is externally due in 2027 (the brief's question)

| Candidate | Finding | Source |
|---|---|---|
| Microsoft NTLM removal or default-off date | None in 2027. Roadmap of Jan 29, 2026: Phase 1 auditing (now); Phase 2 fallback fixes (H2 2026, Server 2025 / Win 11 24H2+); Phase 3 network NTLM disabled by default "in the next major Windows Server release", re-enable by policy; "subject to change"; no date | Windows IT Pro Blog, Advancing Windows security: Disabling NTLM by default |
| NTLM deprecation / NTLMv1 removal | Deprecated June 2024; NTLMv1 removed from Win 11 24H2 / Server 2025 | Learn, Deprecated features for Windows client |
| OMB M-22-09 | Goals due end of FY 2024; no 2027 date | M-22-09 PDF |
| Windows Server 2016 | End of extended support Jan 12, 2027 | Learn lifecycle, Windows Server 2016 |
| SQL Server 2014 ESU Year 3 | Ends Jul 12, 2027 | Learn, Ending Support in 2027 |
| SQL Server 2017 | End of support Oct 12, 2027 | Learn, Ending Support in 2027 |
| 2027-04-01 | Program's own Phase C date (Kerberos/NTLM-elimination program); consistent with Chapters 02, 14, 15 and Runbook R06 | program design |

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Six evidence artifact sets, live outputs of monitoring | Evidence | restated-as-design (program closure model) | — |
| 2 | Per-instance compliance record field set defined by the engine-authentication decision | Evidence | restated-as-design; linked Chapter 12 | — |
| 3 | Sign-in log set shows "zero failed token requests attributable to NTLM or Kerberos fallback" | Evidence | corrected: Entra sign-in logs can't record NTLM/Kerberos fallback; they record token issuance and CA results; the shared audience means they don't name the instance; NTLM absence is shown by host telemetry, `auth_scheme` and SQL Server Audit | Learn, Sign-in logs; Entra auth for SQL Server (audience) |
| 4 | NTLM telemetry from Windows Security and NTLM operational logs in Log Analytics | Evidence | verified | Learn, Policy CSP (NTLM Operational log); SQL Server Audit |
| 5 | CA report: MFA for 100% of human SQL sign-ins | Evidence | verified mechanism; target is program design | Learn, What is Conditional Access? |
| 6 | Agency's SQL estate is authorized by the agency AO under RMF, not FedRAMP; CA-7 continuous monitoring | Evidence (new paragraph) | added (verified) | NIST SP 800-37 Rev. 2; SP 800-53 Rev. 5 CA-6, CA-7 |
| 7 | Title "The 2027 Milestone" | Title | corrected to "What Done Looks Like" per brief; no external 2027 NTLM milestone exists | see table above |
| 8 | "2027-04-01 NTLM elimination deadline" | Consequence section | restated-as-design: program backstop; new section "What is due in 2027, and what isn't" | see table above |
| 9 | "network-level NTLM block" | Consequence section | corrected: domain-wide block enforced by Windows Restrict NTLM policies on clients, servers and DCs | Learn troubleshoot, Status code 0x32 (seven Restrict NTLM policies) |
| 10 | Block "does not honor engine-layer exception status at all" | Consequence section | verified with nuance: Restrict NTLM honors only its own client and DC exception lists, never the engine registry | same |
| 11 | SQL Server 2014 and 2017 can't use Entra authentication | 2027 section | added (verified) | Learn, Arc SQL overview, version table |
| 12 | Excepted connections on CBA must still negotiate Kerberos to survive the block | Consequence section | restated-as-design, consistent with Chapter 22 | — |
| 13 | "The block is network-level and fixed" | Consequence section | restated: "The program has fixed the block date" | program design |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter / H1 "Chapter 2 — The 2027 Milestone: What Done Looks Like" | "Chapter 21 — What Done Looks Like"; description; house front matter | edited |
| Thesis line | Kept verbatim | kept |
| "In this chapter" callout | Kept; adds the external-vs-program 2027 question | edited |
| Opening paragraph | Kept; "Chapter 1" → Chapter 20 link | edited |
| § The Evidence Artifacts as Live Outputs (+ diagram) | Kept, split into paragraphs; second artifact corrected (row 3); third clarified; new paragraph on RMF/CA-7 | edited |
| (new) § What is due in 2027, and what isn't | Added to answer the brief | added |
| § 2027-04-01: A Consequence, Not a Completion Date (+ diagram) | Kept argument; "network-level" corrected; links to R05, Chapters 15 and 22 | edited |
| Diagram source `book-09-ch02-reading-2027-04-01.flow.yaml` | Node b: tag "2027-04-01 (program date)"; body "Domain-wide; ignores the engine exception registry" (was "Network-level; ignores exceptions") | edited (needs re-render) |
| "What Book 09 establishes — Chapter 2" callout | "What this chapter establishes"; item 3 restated; item 4 added | edited |
