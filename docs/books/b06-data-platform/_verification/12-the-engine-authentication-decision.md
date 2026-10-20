# Verification — Chapter 12, What the Engine-Authentication Decision Settles

Checked October 20, 2026. Source: the existing page (former Book 05, Chapter 2), verified and upgraded in place.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Engine-authentication decision (proposed) as companion to the NTLM program and the Arc non-domain-join requirement | Opening | restated-as-design | Program canon (unchanged) |
| 2 | Consolidation gates migration; consolidation is the moment to retire sprawl | Decision 1 | restated-as-design | Program decision; "Established in Book 02" → Chapter 06 |
| 3 | `sys.server_principals.type` letters S, U, G, E; no type W | Decision 2 | verified | Learn, sys.server_principals (X added for groups) |
| 4 | 30-day window; non-prod compression with sign-off | Decision 2 | restated-as-design | Program decision |
| 5 | SQL Authentication "invisible to Conditional Access and Defender for Identity" | Decision 3 | edited / verified | Reasoned out: SQL logins are validated in `master` and never reach Entra or a DC; Learn, What is Conditional Access?; Learn, Defender for Identity sensor v2.x prerequisites (sensors on DCs, AD FS, AD CS, Entra Connect servers) |
| 6 | sa disabled and renamed; break-glass procedure | Decision 3 | restated-as-design | Program decision |
| 7 | SQL 2025 Disable SQL Authentication blocks sa and all SQL logins | Decision 3 | verified (new) | Learn, Disable SQL authentication for SQL Server enabled by Azure Arc |
| 8 | "External-provider logins require SQL Server 2022 or later with the Azure extension on an Arc-enabled host" | Decision 4 | corrected | Learn, Entra authentication for SQL Server: SQL 2022+ required; Arc is the program's path (non-Arc path exists); FCIs unsupported on any version (added) |
| 9 | Compensating control "applies MFA or block policies to Kerberos and NTLM at the domain controller" (Silverfort) | Decision 4 | corrected | Re-opened the Silverfort case study: it describes MFA/block policies on NTLM; Kerberos and DC-level enforcement aren't stated there, so the wording was narrowed |
| 10 | 2027-04-01 NTLM block "network-level", ignores engine exceptions | Decision 4 | restated-as-design | Program backstop and block, not a Microsoft deadline (Chapter 02); "network-level" reworded to "operating system's security layer" |
| 11 | CBA interim; AD CS→Cloud PKI "Not Yet Defined" hard dependency | Decision 4 | restated-as-design | Program position; links to Chapters 09 and 22 added |
| 12 | Closure: `LoginMode = 1`; SQL 2025 Disable SQL Authentication | Decision 5 | verified | Learn, Change server authentication mode; Learn, Disable SQL authentication (`IsExternalAuthenticationOnly` added) |
| 13 | Arc agent enrolled and healthy | Decision 5 | verified | Learn, What is Azure Arc-enabled servers? (agent status) |
| 14 | No engine setting blocks Windows authentication | Decision 5 | verified | Learn, Choose an authentication mode ("Windows Authentication is always available and can't be disabled") |
| 15 | "Book 09" reference | Decision 5 | corrected | → Chapter 20 |
| 16 | Continuous verification; drift = violation | Decision 5 | restated-as-design | Program position |

All eight original footnotes were re-opened and reformatted; none was broken. Two were added (Defender for Identity prerequisites, Choose an authentication mode).

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | Front matter | edited: title `Chapter 12 — What the Engine-Authentication Decision Settles`, `doc-type`, description, `lifecycle_review` |
| H1, thesis, In this chapter | Same | edited |
| Figure + opening paragraph | Same | kept; "Chapter 1's pattern" → Chapter 11 link |
| Decision 1 (+ "Established in Book 02" callout) | Decision 1 | edited: callout retitled "Established in Chapter 06" |
| Decision 2 | Decision 2 | edited (X added) |
| Decision 3 | Decision 3 | edited (claims 5, 7) |
| Decision 4 | Decision 4 | edited (claims 8–11) |
| Decision 5 | Decision 5 | edited: run-on criteria sentence turned into a list (parallel items); claims 12–15 |
| "What Book 05 establishes — Chapter 2" | "What this chapter establishes" | edited |
| (none) | Continue the book; Next → Chapter 13 — Who Owns the Data Platform | added |

Diagram source edited (labels only): `book-05-ch02-five-decisions` ("Book 02" → "Chapter 06"; "the program's" 2027-04-01 block).
