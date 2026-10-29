# Verification — Chapter 10, Analyzing the Estate

Editor: W5. Sources: the series chapter in place (old Chapter 02, "Analyzing the Client/Server Estate"); the modernization whitepaper's Principle 5 (`docs/whitepapers/modernization-journey.md`). All checks October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Enterprise CAs use AD DS data and certificate templates to decide issuance, so template permissions decide who gets which certificate | Assessment problem | verified | Microsoft Learn, Certification Authority Role Service |
| 2 | Least privilege for the assessment account is SP 800-53 AC-6 | Principle 2 | verified (title from OSCAL 5.2.0) | NIST SP 800-53 Rev. 5 r5.2.0 |
| 3 | Tier A (basic read-only) has "limited Group Policy, certificate-template and DNS/DHCP visibility" | Principle 2 | corrected: default Authenticated Users and Pre–Windows 2000 grants expose topology, OUs, GPO links and most settings, users, groups, computers, SPNs, templates and often AD DNS zones; what needs adding is server-side settings (DHCP, DNS server, CA database, replication, logs). Tiers redefined by what is added | Microsoft Learn, password writeback access rights; Book 02 Ch 07 |
| 4 | DHCP Users group is limited to read-only access to the DHCP server | Principle 2, Stream 9 | verified | Microsoft Learn, Active Directory security groups |
| 5 | Secret-exposing rights never requested | Principle 2 | restated-as-design (consistent with Book 02 Ch 07) | — |
| 6 | Read-only assessment may qualify for a lighter change process | Principle 1 | restated-as-design (kept the source's own caveat) | — |
| 7 | Enumeration looks like reconnaissance; notify SOC | Principle 1 | verified via Book 02 Ch 07 (MDI discovery alerts); linked, not re-footnoted | Book 02 Ch 07 |
| 8 | Windows Server 2025 functional level runs only on WS2025 DCs | Stream 1 | verified (added) | Microsoft Learn, AD DS functional levels |
| 9 | Unconstrained delegation lets a host impersonate any authenticating user; remove or move to constrained | Stream 4 | verified (added detail) | Microsoft Learn, MDI accounts posture assessments |
| 10 | WS2025 KDC no longer issues RC4 TGTs | Stream 4 | verified (added) | Microsoft Learn, What's new in Windows Server 2025 |
| 11 | WS2012/2012 R2 ESUs via Arc ended Oct 13, 2026; WS2016 end of support Jan 12, 2027 | Stream 4 | verified (added) | Microsoft Learn, Cloud-native licensing and cost management with Arc |
| 12 | gMSA preferred; document owner, purpose, permissions, risk, lifetime | Stream 5 | verified | Microsoft Learn, Introduction to AD service accounts |
| 13 | Delegated managed service accounts in WS2025 as a migration path | Stream 5 | verified (added) | Microsoft Learn, What's new in Windows Server 2025 |
| 14 | GPO stream "(Tier B)" | Stream 7 | corrected: mostly Tier A unless security filtering restricts a GPO | Book 02 Ch 07 table |
| 15 | DNS stream "(Tier B)" | Stream 8 | corrected: zone/record objects often Tier A; server settings Tier B | Book 02 Ch 07 |
| 16 | ESC1 pattern (supply SAN + client auth + unprivileged enrollment); MDI assessments for other ESC patterns | Stream 10 | verified; the posture list is ESC1–4, 6–8, 11, 15 (not "ESC2–15") | Microsoft Learn, MDI certificates assessment; MDI what's new archive |
| 17 | 90-day stale threshold | Analysis layer | restated-as-design (agency's choice) | — |
| 18 | Analyzer is Python | Analysis layer | restated-as-design ("in the program's reference build") | — |
| 19 | Signed commits, unique run IDs, provenance rejection | Provenance, artifact set | restated-as-design | — |
| 20 | Assessment output is sensitive; store encrypted | Artifact set | restated-as-design (consistent with Book 02 Ch 07) | — |
| 21 | Each synchronous call pays propagation delay; separation multiplies it; techniques list (BFF/aggregation, async, caching, batching, pooling, stateless conversion) | Profiling | restated-as-design; physics owned by Ch 07 and Book 09 (linked, not re-footnoted) | Whitepaper Principle 5; Ch 07; Book 09 Ch 01 |
| 22 | "Mirroring the eleven types from Chapter 00" | Streams intro | corrected: renumbered to Chapter 02 | — |
| 23 | Microsoft Learn "Authoritative references" list | End | removed as a list; both sources now footnoted inline | — |
| 24 | Review fix 3, Oct 21, 2026 (revision-history trim): "The source of this chapter assumed that a basic read-only account sees little Group Policy, certificate-template or DNS data. That understates the default." | Read tiers | wording-only | Now "A basic read-only account sees more ... than is often assumed"; the list of default-readable data is unchanged under [^c10-writeback]. |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Old Ch 02 title and subtitle line | H1 "Chapter 10 — Analyzing the Estate"; italic thesis | Subtitle replaced by thesis line per book style |
| Dependency chain blockquote | Kept | — |
| The assessment discipline | Same section | — |
| The assessment problem (seven bullets) | Same section; AD CS bullet expanded with its footnote | — |
| Three design principles: 1 Read-only by policy | Same; added the SOC-notification point and Book 02 link | — |
| 2 Least-privilege delegation (Tier A/Tier B) | "Least-privilege delegation in two tiers," tiers corrected (claims 3–5) | — |
| 3 Provenance-bound output | Same; hash type stated as SHA-256 (program design, as in Book 02) | — |
| The eleven ingestion streams, Streams 1–11 | Same, each with the corrected tier, added risk-scoring facts and consuming chapter or book | — |
| Python augmentation | "The analysis layer" | Renamed; Python kept as the reference build |
| Output format: one artifact set per run | "One artifact set per run"; added `transaction-profiles/` and the sensitivity paragraph | — |
| What happens next | Same | — |
| Key takeaways | Same, two added | — |
| Authoritative references | Footnotes | List removed (duplicate of footnotes) |
| Previous/Next links (old numbering) | "Continue the book" callout in reading order (Ch 09 → Ch 11) | — |
| Figure `../../images/cshc/analysis-pipeline.svg` (Discover, Inventory, Map, Risk Report) | `ch10-assessment-pipeline.flow.yaml` | Same content plus the tier split |
| Whitepaper Principle 5 (rule, techniques table, dependence on Principle 1, gated check) | "Profiling transactions before separation" | The network-physics argument stays with Ch 07 and Book 09 |

## Additions, October 23, 2026 (certificates and the CLM platform)

At the user's request, every certificate-dependent book maps its certificates to Book 07 and the CLM platform. Source: the certificate-touchpoints research brief (program working file), Book 07 Ch04/Ch05/Ch07/Ch08 and CyberArk 26.1 documentation (accessed Oct 23, 2026).

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Certificates section: class, issuer and renewal engine per certificate | Certificates in this book and the CLM platform | restated-as-design (Book 07's classes applied); items marked inference are labeled | Book 07 Ch04, Ch05 |
| 2 | CyberArk mechanism (disc) | Same section | verified (noted) | CyberArk 26.1 docs, note clm-disc |

## Additions, October 29, 2026 (Start Kit transaction profiles)

The Start Kit gained transaction profiling. Microsoft source opened October 29, 2026: sys.dm_exec_connections (Transact-SQL). No personal data sent to any site.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | The Start Kit's `Invoke-FMPTransactionProfile` builds `transaction-profiles/` from a team catalog and measured round trips (packet capture export, SQL Server connection counters, or a named tool), refuses estimates, and marks each application Pass or Blocked | Profiling transactions before separation | added; implementation | examples/start-kit (PR in this change); tests/powershell, 197 Pester tests passing on Windows PowerShell 5.1 and PowerShell 7, Oct 29, 2026 |
| 2 | SQL Server counter method reads `sys.dm_exec_connections.num_reads` (documented as byte reads) with SELECT-only T-SQL; needs VIEW SERVER STATE, or VIEW SERVER PERFORMANCE STATE on 2022 and later | Same (README carries the detail) | verified | Microsoft Learn, sys.dm_exec_connections (Transact-SQL) |
