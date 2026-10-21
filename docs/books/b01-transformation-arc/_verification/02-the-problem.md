# Verification — Chapter 02 (The Problem: Governance Hidden in the Directory)

File: `02-the-problem.md`. Diagram sources: `docs/images/diagrams/b01-transformation-arc/src/ch02-silent-dependencies.flow.yaml` (replaces `../../images/cshc/silent-dependencies.svg`), `ch02-ou-governance-tree.flow.yaml`, `ch02-dependency-chain.flow.yaml`.
Sources opened October 21, 2026.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | AD is the implicit governance model; failures surface months later | §Thesis | restated-as-design | Program thesis |
| 2 | "What was sold in 1999" (heading) | §What shipped with Windows 2000 | corrected | AD shipped with Windows 2000 (Learn, WS2025 what's new: ESE "since its introduction in Windows 2000"); heading changed |
| 3 | Kerberos-anchored replacement for NT domains | §What shipped | verified | Learn, SSPI Architecture ("Kerberos… default authentication protocol since Windows 2000") |
| 4 | "Over the following decades" / "next twenty-five years" | §What shipped | verified | Windows 2000 (2000) to 2026 |
| 5 | Every Windows-era service wired itself into AD; forest = most load-bearing governance infrastructure | §What shipped | restated-as-design | Program argument |
| 6 | "Microsoft is now deprecating the entire Client/Server stack" (00-introduction) | §What breaks | corrected | Learn, "New name for Azure AD" FAQ (continues to support and enhance Windows Server AD); WS2025 new functional levels |
| 7 | Microsoft cloud-first model; AD minimized; phased | §What breaks | verified | Learn, cloud-first identity guidance for IT architects |
| 8 | Entra ID has no domain/forest trusts; not like-for-like | §What breaks table | verified | Learn, "Cloud transformation posture" |
| 9 | "Intune takes over from Group Policy" | §What breaks table | corrected | Narrowed: Intune's supported OS list covers Windows client editions, not Windows Server (Learn, supported operating systems); servers go under Azure Arc (settled book fact) |
| 10 | Azure Arc extends management to on-premises hosts; machine configuration audits settings | §What breaks table | verified | Learn, "What is Azure Arc-enabled servers?" |
| 11 | Conditional Access takes over from the perimeter; "Zero Trust policy engine" | §What breaks table | verified | Learn, "What is Conditional Access?" |
| 12 | "Entra CBA takes over from AD CS-anchored smart-card logon" | §What breaks table | corrected | CBA removes the AD FS federation dependency but still relies on a PKI whose CAs are uploaded to Entra ID (Learn, CBA overview; Set up CBA). Linked to Book 07 |
| 13 | "Azure Private Resolver + Private DNS replace AD-integrated DNS zones" | §What breaks table | corrected | Private Resolver is a recursive resolver/conditional forwarder, not authoritative (Azure Architecture Center); zones live in Azure private DNS. Linked to Book 08 Ch 04 |
| 14 | Eleven object categories and their failure modes | §What breaks | restated-as-design | Program inventory taxonomy; matches Book 02 Ch 04 table |
| 15 | Silent failure examples | §Silent failure | restated-as-design | Illustrative patterns; "six-month tail" (00-introduction) softened to "long tail" |
| 16 | OUs group objects for Group Policy and delegation; delegated permissions inheritable | §OU tree | verified | Learn, "Delegating Administration by Using OU Objects"; "Understanding the Active Directory Logical Model" |
| 17 | OU is lowest container for GP; GPOs linked higher inherited below | §OU tree | verified | Learn, "Group Policy overview for Windows Server" |
| 18 | "Scoping the user to security groups that used OU-based rules" (00-introduction) | §OU tree bullets | corrected | AD has no native OU-based group rules; restated as "scripts or tools that built group membership from OU position" |
| 19 | Example DN `OU=IT,OU=Baltimore,OU=East,DC=contoso` | §OU tree | corrected | Domain changed to `DC=example,DC=gov` (neutral example) |
| 20 | Dynamic membership groups add/remove members as attributes change | §OU tree | verified | Learn, "Manage rules for dynamic membership groups" |
| 21 | Administrative units restrict role scope; can't be nested | §OU tree | verified | Learn, "Administrative units in Microsoft Entra ID" (nesting constraint added) |
| 22 | "Microsoft did not provide a framework" / reconstruction must be explicit; result equivalent and cleaner | §OU tree | restated-as-design | Program position, stated as such |
| 23 | "Visible ten percent / invisible ninety percent" (00-introduction) | §Why naive migrations fail | removed | Unverifiable ratio; kept the visible/invisible framing without numbers |
| 24 | Five-step discipline | §Why naive migrations fail | restated-as-design | Program method |
| 25 | Framework description; vendor-neutral adapter interfaces; no rip-and-replace; sits above tools | §What the program provides | restated-as-design | Program design (from modernization/index.md and 00-introduction) |
| 26 | "The Federal Modernization Program — the Unified Identity and Access Orchestrator" (00-introduction) | §What the program provides | removed | Only the program name is used, per the style rule |
| 27 | Platform host specifics (single WS2025 host, Gitea, IIS) | §What the program provides | restated-as-design | Kept generic and linked to Chapter 03, which owns the platform |
| 28 | MACD-R five-clause authorized path; per-class SSOTs; ownerless item is an orphan finding | §One lifecycle | restated-as-design | Program doctrine (modernization/index.md), linked to Compliance Vol 0 Book 00 |
| 29 | Hybrid join is a waypoint; moving away from on-prem domain means moving off hybrid join | §Dependency chain | verified | Learn, "Microsoft Entra joined vs. Hybrid Microsoft Entra joined in cloud-native endpoints" |
| 30 | Dependency chain steps and gates | §Dependency chain | restated-as-design | Program method; chapter numbers renumbered |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Ch 02 (series) — H1 "Chapter 00 — The Problem Nobody Talks About"; bold subtitle; prologue pointer blockquote | H1 fixed; italic thesis; pointer moved into "In this chapter" | — |
| Ch 02 — The thesis (+ silent-dependencies.svg) | §The thesis; Figure ch02-silent-dependencies | Old cshc SVG replaced by house-style source with the same AD → hidden coupling → explicit contracts content |
| Ch 02 — What was sold in 1999 | §What shipped with Windows 2000 | Heading corrected (row 2) |
| Ch 02 — What breaks when AD goes away (+ eleven-category table) | §What breaks; substitution table; eleven-category table | Substitutions split into a table with corrections (rows 9, 12, 13) and depth links to Books 02, 04, 05, 07, 08 |
| Ch 02 — Silent failure is the real enemy | §Silent failure | — |
| Ch 02 — The OU tree was the governance tree | §OU tree; Figure ch02-ou-governance-tree | Five-effects bullet list restored from 00-introduction |
| Ch 02 — Why naïve migrations fail | §Why naive migrations fail | — |
| Ch 02 — What the framework provides | §What the program provides | Merged with modernization/index.md content |
| Ch 02 — What this series covers | §What this book covers | Renumbered to the new reading order (00a → Appendix B; 01 → 03; 02 → 10; 03 → 11; 09 → 12; 10 → 09); links added |
| Ch 02 — The dependency chain | §The dependency chain; Figure ch02-dependency-chain | Chapter column renumbered (02 → 10; 01,03 → 03,11; 09 → 12; 09,10 → 12,09) |
| Ch 02 — The bottom line; Key takeaways | §The bottom line ("argument in brief") | Takeaways merged and extended with the OU and lifecycle points |
| Ch 02 — Authoritative references; Previous/Next | Footnotes; "Continue the book" callout | Next now Chapter 03 (Appendix B is linked from the coverage table) |
| 00-introduction — front matter, thesis callout | §The thesis | Duplicate of series chapter; consolidated |
| 00-introduction — What Microsoft sold you in 1999 | §What shipped with Windows 2000 | Duplicate; consolidated, corrected |
| 00-introduction — What breaks when AD goes away | §What breaks | "Microsoft is deprecating the entire stack" corrected (row 6) |
| 00-introduction — Silent failure callout (RADIUS and LDAP examples, "six-month tail") | §Silent failure | Softened (row 15) |
| 00-introduction — The OU tree was the governance tree (DN example, five bullets, Chapter 04 pointer) | §OU tree | DN neutralized (row 19); OU-based group rules corrected (row 18); link now to Chapter 04 and Book 02 Ch 05 |
| 00-introduction — Why naïve migrations fail ("visible ten percent") | §Why naive migrations fail | Ratio removed (row 23) |
| 00-introduction — What the Federal Modernization Program is (single host, Gitea, IIS, bridges, scripts, target surface) | §What the program provides | Product specifics left to Chapter 03 (row 27); alternate program name removed (row 26) |
| 00-introduction — What this series covers | §What this book covers | Duplicate; renumbered |
| 00-introduction — The bottom line | §The bottom line | Duplicate; consolidated |
| 00-introduction — Next link | not carried | Archived page link |
| modernization/index.md — title/subtitle ("migration without rip-and-replace, governed by the same spine") | §What the program provides | — |
| modernization/index.md — intro paragraph (adapter interfaces, assessment engine, target surface, program management; AD → Entra ID leading path) | §What the program provides | — |
| modernization/index.md — Compliance/Modernization "two expressions of one substrate" | not carried | Pillar positioning outside the book's scope; the MACD-R link carries the seam to Compliance |
| modernization/index.md — Download the whole family callout | not carried | Per-page download callouts removed (brief) |
| modernization/index.md — Ways in (entry-point table) | §What breaks (the substitution table's "Depth" column) and Chapter 01's "Depth" column | Entry points now map to Books 02–09, which own the detail |
| modernization/index.md — What Modernization modernizes (assessment engine, target surface, SQL Server worked consumer, long-form argument, sibling seam) | §What the program provides; Chapter 01 links | SQL Server worked consumer carried as a one-line link to Book 06; whitepaper reading-guide links not carried (whitepapers being archived) |
| modernization/index.md — One lifecycle, two pillars (MACD-R) | §One lifecycle for every change | Restated as program doctrine (row 28) |
| modernization/index.md — Current state (Substrate Status page) | not carried | Status tracking page is outside the book; not a claim |
