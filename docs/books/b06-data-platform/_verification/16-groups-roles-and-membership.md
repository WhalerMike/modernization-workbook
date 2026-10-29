# Verification — Chapter 16, Groups, Roles and How Membership Reaches the Engine

Checked October 20, 2026. Sources: the existing page (former Book 07, Chapter 1) verified and upgraded in place, plus the archived front page `docs/case-studies/sql-server-narrative/Book_07.md`, carried into the opening callout and diagram. Dynamic-group and PIM facts kept consistent with Book 03 Chapter 10 and Book 04.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | `CREATE LOGIN … FROM EXTERNAL PROVIDER`; type E and X | Mapping | verified | Learn, Tutorial: Set up Entra authentication for SQL Server enabled by Azure Arc (`type IN ('E','X')`) |
| 2 | Principal name: UPN for users, object name for groups/apps | Mapping | verified (new detail) | Same |
| 3 | Entra admin receives sysadmin | Mapping | verified | Same |
| 4 | Graph permissions `User.Read.All`, `GroupMember.Read.All`, `Application.Read.All`; Privileged Role Administrator grants | Mapping | verified; scoped to SQL Server 2025 managed identity (the cited page) | Learn, Set up managed identity and Entra auth for SQL Server enabled by Arc |
| 5 | Permissions assigned directly to each identity; Directory Readers alternative not recommended for least privilege | Mapping | verified (new) | Same |
| 6 | Entra connections require encryption / trusted certificate | Mapping | verified (new) | Learn, Tutorial (Arc) |
| 7 | One group, one role; access review answerable from name | One group, one role | restated-as-design | Program design; access reviews footnoted (Learn, What are access reviews?) |
| 8 | Dynamic groups select users/devices, not groups | Flat | verified | Learn, Manage rules for dynamic membership groups |
| 9 | `memberOf` preview ends Nov 3, 2026; groups stop updating, last known state | Flat | verified | Learn, Configure dynamic membership groups with memberOf (preview) |
| 10 | Role-assignable groups accept no group members | Flat | verified | Learn, Use Microsoft Entra groups to manage role assignments |
| 11 | 200 groups in JWT; overage indicator | Flat | verified; 150 SAML and "including nested groups" added | Learn, Configure group claims for applications |
| 12 | Nested-group evaluation undocumented for SQL Server | Flat | unverifiable → restated-as-design | Absence of documentation can't be cited; labelled as the program's reading |
| 13 | Processing "usually within a few hours … can take more than 24 hours" | When a change takes effect | verified | Learn, Understand and manage dynamic group processing |
| 14 | Default token lifetime random 60–90 minutes | Same | verified | Learn, Access tokens in the Microsoft identity platform |
| 15 | Urgent removal: disable account, revoke sessions, end SQL sessions | Same | verified (Entra steps) | Learn, Revoke user access in Microsoft Entra ID |
| 16 | Four AD group patterns and their replacements | Migrating | restated-as-design | Program taxonomy (Runbook R07) |
| 17 | Every token request passes CA; non-compliant device, location, high risk refused | CA perimeter | verified for users | Learn, What is Conditional Access?; What is Entra ID Protection? |
| 18 | Implied: CA covers every connection once logins are Entra-backed | CA perimeter | corrected | Learn, Conditional Access for workload identities: user-scoped policies don't block service principals; workload-identity CA covers single-tenant SPs only, needs Workload ID Premium, and doesn't cover managed identities |
| 19 | Source: "Book 05 therefore treats each surviving legacy login as … exception" | CA perimeter | corrected | → Chapter 12 |
| 20 | Source: "Book 09's continuous audit" | Mapping | corrected | → Chapter 20 |
| 21 | Source: "The Implementation Companion carries the full runbook" | Mapping | corrected | → Runbook R07 link |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, H1 "Chapter 1 — …" | Front matter, H1 | edited |
| Thesis, "In this chapter" | Same | edited (CA scope note) |
| Opening two paragraphs | Opening | kept |
| "How an Entra Group Becomes SQL Server Access" + callout + SQL block | Same | edited (claims 1–6; callout retitled "Established in Chapters 11–12"; warning callout added before code) |
| "One Group, One Role" | Same | kept |
| "Flat by Design" | Same | edited (claims 11–12) |
| "When a Change Takes Effect" | Same | edited (sources added) |
| "Migrating the Four AD Group Patterns" | Same | kept; "Chapter 2" → Chapter 17 |
| "Conditional Access as the Outer Perimeter" | Same | edited (claim 18 correction added as a paragraph) |
| "What Book 07 establishes — Chapter 1" | "What this chapter establishes" | edited (point 3) |
| "Authoritative references" list | Footnotes | converted: every link re-opened and cited at its claim |
| Footnotes (ca, graph-perms, ar, idp) | Footnotes | re-keyed `c16-` |
| Book_07 front matter, subtitle, description | Description, opening callout | carried |
| Book_07 callout (groups move, ticket removed, governance needed) | "Where this part of the book goes next" | carried |
| Book_07 diagram `book-07-two-halves-of-access.svg` | After opening callout | carried |
| Book_07 "Download this book" | — | removed: bundle .docx not on site; Runbook R07 link instead |
| Book_07 "Chapters" listing | — | removed (book index replaces it) |
| Book_07 "Place in the dependency chain: Step 5" | Opening callout | carried as text |
| Book_07 "Authoritative references" (5 links) | Footnotes in Chapters 16–17 | carried (dynamic rules, PIM for Groups, access reviews, AUs, CREATE LOGIN/Arc tutorial) |
| Book_07 "Continue the series" | Continue the book | edited |

Diagram source edited: `book-07-ch01-group-to-login-mapping.flow.yaml` ("Chapter 2" → "Chapter 17"). Needs re-render.

## Revision 2026-10-29 — companion-guide reconciliation

Finding D3 in the attribute-driven migration guide's verification log (`docs/books/guides/_verification/attribute-driven-migration.md`): rule inputs listed display strings, against Chapter 17's codes-only rule. Sources opened on Oct 29, 2026 through the Microsoft Learn documentation service; no personal data sent.

| # | Claim | Source (accessed 2026-10-29) | Old text | New text |
|---|---|---|---|---|
| G1 | Organization-derived groups' rules read HR codes | Manage rules for dynamic membership groups <https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership> (`extensionAttribute1`–`15` supported for users; `-in` with a bracketed string list; minimize `-contains` and `-match`); administrative-unit rules use the same attributes and syntax: <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-members-dynamic> | "rules read HR-maintained attributes such as `department`, `companyName`, `jobTitle`, an `extensionAttribute`, or a directory extension property ([Chapter 17](…))" | "rules read HR-maintained codes, such as the organization code in `extensionAttribute10` and the position category in `extensionAttribute12` from the [program attribute map](…), or a directory extension property, not display strings such as `department` or `jobTitle` ([Chapter 17](…#choosing-the-attributes))" |

## Revision 2026-10-29 — four tracks and companion-guide alignment

No new Microsoft or federal facts. Both additions carry existing material by link.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | People's group-derived logins are the HR track; service accounts and application principals are the non-person identity track, with no HR record | "Where this part of the book goes next" callout | restated-as-design | Program framing; companion guide, Non-person identity track |
| 2 | A surviving Windows-authenticated login is an IA-2 gap in the program's mapping | Conditional Access as the outer perimeter | carried | Appendix A, Mapping by part (Login Migration row maps IA-2, IA-2(1), IA-2(2)) |
| 3 | A surviving Windows login is an AD-retirement dependency: it authenticates only while AD does | Same | restated-as-design | Follows from Chapter 01 (Windows Authentication is Kerberos/NTLM against AD) |
