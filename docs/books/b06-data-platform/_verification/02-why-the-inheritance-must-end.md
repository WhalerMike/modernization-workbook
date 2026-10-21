# Verification — Chapter 02, Why the Inheritance Must End

Checked October 20, 2026. Source: the existing page (former Book 01, Chapter 2) verified and upgraded in place. Microsoft sources opened through the Microsoft Learn MCP tools; the Retiring NTLM FAQ was downloaded and text-searched (WebFetch returned only its title); the M-22-09 and SP 800-53 PDFs were downloaded and text-searched.

## The 2027 milestone — what is and isn't external

| Date | What | External? | Source |
|---|---|---|---|
| 2027-04-01 | Program's NTLM backstop (Phase C, LSA-layer disable) | No — program design (Kerberos/NTLM-elimination program, accepted 2026-05-13) | — |
| No date | Microsoft disables network NTLM by default in the "next major release of Server and Client (subject to change)" | External, undated | Retiring NTLM FAQ (Sept 9, 2026) |
| October 2026 | `BlockNTLMv1SSO` internal default → Enforce (Win 11 / WS 2025, Credential Guard off, value unset); MS-CHAPv2 SSO only | External | KB5066470 |
| January 12, 2027 | Windows Server 2016 end of extended support | External | Lifecycle, Windows Server 2016 |
| July 2027 | SQL Server 2014 ESU Year 3 (final) ends; SQL Server 2016 ESU Year 1 ends | External | Lifecycle, SQL Server 2014 / 2016 |
| October 12, 2027 | SQL Server 2017 end of extended support | External | Lifecycle, SQL Server 2017 |
| — | M-22-09 deadlines (end of FY2024) | Not 2027 | M-22-09 |

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Drivers follow from NTLM deprecation, the transformation inventory and M-22-09 | Opening | verified / edited | M-22-09 §III.A (phishing-resistant MFA; application-layer MFA; device-level signal) quoted |
| 2 | Operationalized as phishing-resistant MFA and CA (AC-17, IA-2) | Opening | verified (control names) / restated-as-design (mapping) | NIST SP 800-53 Rev. 5 (AC-17 Remote Access; IA-2 Identification and Authentication) |
| 3 | Kerberos/NTLM-elimination program accepted 2026-05-13 | Driver one | restated-as-design | Program record (unchanged) |
| 4 | Microsoft deprecated NTLM in June 2024 | Driver one | verified | Learn, Deprecated features for Windows client (all versions incl. LANMAN, NTLMv1, NTLMv2) |
| 5 | NTLMv1 removed in WS 2025 / Win 11 24H2; NTLMv2 to be removed from Windows Server in a future release | Driver one | verified (new detail) | Learn, Features removed or no longer developed in Windows Server |
| 6 | "Enhanced auditing in Windows Server 2025 / Windows 11 24H2" | Driver one | corrected | Retiring NTLM FAQ: Windows 11 24H2 **and 25H2** and WS 2025 (work under way for 2019/2022) |
| 7 | "`BlockNTLMv1SSO` enforcement default arriving via Windows Update in October 2026" as a step in disabling NTLM | Driver one | corrected | KB5066470: applies only to NTLMv1-derived SSO credentials (MS-CHAPv2 Wi-Fi/Ethernet/VPN) on devices without Credential Guard where the value is unset; doesn't affect SQL Server NTLM traffic |
| 8 | "Network NTLM off by default in the next major Windows Server release (~2027/2028)" | Driver one | corrected | Retiring NTLM FAQ: next major release of Server **and Client**, "subject to change", no date; "~2027/2028" removed; disabled not removed; re-enable by policy; in-market versions keep NTLM; interim milestones IAKerb, LocalKDC, auditing, blocking policies |
| 9 | No fixed calendar date; 2027-04-01 is the program's own anchor | Driver one | verified | Retiring NTLM FAQ |
| 10 | NTLMv1 blocked in Phase B through LAN Manager Authentication Level as soon as Phase A completes (targeted 2026-Q3) | Driver one | verified (mechanism) / restated-as-design (timing) | Learn, How to enable NTLM 2 authentication (level 5: DCs refuse LM and NTLM, accept only NTLMv2). Added that pre-2025 hosts can still negotiate NTLMv1. Note: 2026-Q3 has passed; text keeps it as the program's target, status not asserted |
| 11 | NTLMv2 disabled at the LSA layer on 2027-04-01; failure before the engine sees it | Driver one | restated-as-design | Program enforcement design (unchanged) |
| 12 | NTLM-generating conditions: missing SPN, non-Kerberos client, trust boundary, unjoined host | Driver one | verified | Learn, Register an SPN; Learn, Passwords technical overview |
| 13 | New callout "What is actually due in 2027" | Driver one | verified (new) | Lifecycle pages for Windows Server 2016, SQL Server 2014, 2016, 2017; Learn, Entra authentication for SQL Server (2022+) |
| 14 | CA enforces device compliance, named locations, MFA, sign-in risk "by intercepting token issuance" | Driver two | edited | Learn, What is Conditional Access? (signals and decisions; enforced when the sign-in requests access); wording moved off "intercepting" |
| 15 | Kerberos/NTLM involve no token request, so CA can't block | Driver two | verified | Same; Book figure unchanged |
| 16 | Elevated risk includes anonymous IP flagged by ID Protection | Driver two | verified | Learn, What is Microsoft Entra ID Protection? |
| 17 | Risk-based policies need Entra ID P2 | Driver two | verified (new) | Learn, Risk-based access policies |
| 18 | AD service accounts and gMSAs lose their governance foundation | Driver three | verified / restated-as-design | Learn, Service accounts (AD DS) — gMSAs are AD objects; "lose foundation" is program argument |
| 19 | Microsoft says inventory AD-dependent apps (Kerberos/NTLM/LDAP) before moving identities | Driver three | verified (new; from Book_01 references) | Learn, Microsoft Entra cloud-first identity guidance for IT architects |
| 20 | SQL 2025 uses the Arc server managed identity; SQL 2022 uses app registration cert fetched from Key Vault | Driver three | verified | Learn, Managed identity for SQL Server enabled by Azure Arc; Learn, Arc Entra setup tutorial |
| 21 | Arc-free certificate-only setup exists | Driver three | verified | Learn, Enable Entra authentication for SQL Server on Windows without Azure Arc (2022 and later) |
| 22 | Arc doesn't change the Windows service account | Driver three | verified | Learn, Managed identity for SQL Server enabled by Azure Arc |
| 23 | Renumbering: "Book 06" → Chapters 14–15; "Book 02" → Chapters 03–06; "series" → "book" | throughout | corrected | Brief map |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| In this chapter | In this chapter | edited (adds the 2027 question) |
| Opening paragraph | Opening paragraph | edited (claims 1–2) |
| Driver One — The NTLM Elimination Commitment | Driver one: the NTLM elimination commitment | edited (claims 3–12); split into shorter paragraphs; new callout "What is actually due in 2027" |
| Driver Two — The Zero-Trust Requirement | Driver two: the zero-trust requirement | edited (claims 14–17) |
| Driver Three — The Service Account Credential Problem | Driver three: the service account credential problem | edited (claims 18–22) |
| "What Book 01 establishes — Chapter 2" | "What this chapter establishes" | edited (2027 point added) |
| Footnotes (8) | Re-opened and reformatted; `ntlm-removed` now cites what it says; added deprecated-features, FAQ, KB5066470, LmCompat, lifecycle, risk-policies, cloud-first, without-Arc, SP 800-53 | edited |
| Diagram `book-01-ch02-three-drivers-and-order` | Same position | kept; source edited: step tags "Book 02/04/05/06" → "Chapters 03–06 / 09–10 / 11–12 / 14–15" (stale references) |
| Diagram `book-01-ch02-conditional-access-leverage` | Same position | kept; source unchanged |

## Consistency fixes, round 2 (2026-10-21)

Book-wide consistency pass. *Design-consistency* rows restate a program choice the same way everywhere and need no new note; *factual* rows were re-researched against the primary source on 2026-10-21 and carry their own footnote.

| # | Change | Where | Kind | Source |
|---|---|---|---|---|
| CR2-1 | October 2026 `BlockNTLMv1SSO` default change scoped to Windows 11, versions 24H2, 25H2, 26H1 and 26H2, and Windows Server 2025 (was "Windows 11" unqualified); new note `[^c02-ntlmv1-mc]`. Chapter 14 and Runbook R06 ("24H2 through 26H2") were already right | line 33; note line 102 | factual (corrected; this chapter was the wrong one) | Windows message center entry of Oct 14, 2026, <https://learn.microsoft.com/windows/release-health/windows-message-center>; KB5066470, <https://support.microsoft.com/help/5066470> |
| CR2-2 | `[^c02-blockntlmv1sso]` title updated to the KB's current title, "Manage NTLMv1 changes and prevent network authentication issues in Windows," with its applies-to list; accessed date Oct 21, 2026 | note line 86 | factual (citation corrected) | <https://support.microsoft.com/help/5066470> |
