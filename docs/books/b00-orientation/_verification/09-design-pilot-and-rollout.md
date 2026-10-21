# Verification — Chapter 09, Design, Pilot and Rollout

Writer: W4. Source: `docs/operational-guides/program-management/master-project-plan.md` (the master plan; `aspirational: true`), §4.2 week 9, §5 (Planning and Design), §6 (Pilot), §7 (Scale), and the related dependency and risk entries. Book 01 Chapters 09 and 12, Book 03 Chapter 06, Book 02 Chapter 09, Book 04 Chapter 07, Book 05 Chapters 02/07/08, Book 07 Chapters 04/07 and Book 08 Chapter 10 read as settled facts. All checks October 21, 2026.

Alignment note: following Chapter 05 (W3), Phase 1 opens with plan generation and approval (M-011, M-012) and includes pre-pilot readiness (M-013); G1 requires them and the Arc connection of the platform host and pilot servers.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Dimensions Region, Site, Department, Role, Environment mapped to extensionAttribute1–15 locally | Attribute taxonomy | corrected: use the program attribute map (Book 03 Ch06); Site has no slot; OU tree is a seed, not the authority | Book 03 Ch06 (settled) |
| 2 | Dynamic group security depends on attribute write permissions | Attribute taxonomy | verified (added) | Microsoft Learn, Manage rules for dynamic membership groups |
| 3 | Extension attributes 1–15 sync from AD; supported by both sync engines | Attribute taxonomy | verified | Microsoft Learn, groups-dynamic-membership; Cloud Sync decision guide |
| 4 | Device extension attributes set on the device via Graph | Attribute taxonomy | verified | Microsoft Learn, groups-dynamic-membership; Graph Update device |
| 5 | Dynamic groups need P1 per unique member user; devices need none | Dynamic groups | verified (added) | Microsoft Learn, groups-dynamic-membership |
| 6 | Dynamic group processing "<15 min refresh" | Dynamic groups | corrected: usually within a few hours, can exceed 24 hours; operators Match/Contains/memberOf slower | Microsoft Learn, Understand and manage dynamic group processing |
| 7 | GPO intents mapped to Settings Catalog etc. | Intune policy | verified (Group Policy analytics imports GPOs and creates settings catalog policies) | Microsoft Learn, Group Policy analytics; migrate-group-policy |
| 8 | "15+ Conditional Access policies" | Conditional Access | corrected: the program library is Book 04 Ch07 (one numbered set, five waves) | Book 04 Ch07 (settled) |
| 9 | Report-only for 7+ days | Conditional Access | verified (report-only evaluates and logs without enforcing; Microsoft: at least one week) | Microsoft Learn, CA report-only; Plan a CA deployment |
| 10 | Emergency access accounts / "zero permanent Global Admins" | CA design; M-026 | corrected: emergency access accounts hold GA as permanent active; all others eligible via PIM | Microsoft Learn, Manage emergency access accounts |
| 11 | Entra Connect with staging mode; PHS recommended, PTA alternative | Sync | corrected/updated: Cloud Sync is Microsoft's strategic direction; program rule in Book 02 Ch09; staging mode is Connect-only | Microsoft Learn, Cloud Sync decision guide; Book 02 Ch09 (settled) |
| 12 | Private Resolver inbound/outbound endpoints, forwarding rulesets | DNS | verified (dedicated subnets; up to 1,000 rules per ruleset) | Microsoft Learn, What is Azure DNS Private Resolver? |
| 13 | Cloud PKI root vs BYOCA | Cloud PKI | verified | Microsoft Learn, Cloud PKI deployment models |
| 14 | Cloud PKI SCEP-only to Intune-enrolled devices; max three CAs; CRL seven days | Cloud PKI | verified (added) | Microsoft Learn, Cloud PKI overview |
| 15 | Server/DC/LDAPS certs stay on AD CS | Cloud PKI | verified via settled facts | Book 07 Ch04, Ch07 |
| 16 | PKI depends on identity | Design milestones | restated-as-design (master plan dependency) | — |
| 17 | Pilot scope: 50–100 devices, 20–50 users, etc. | Pilot scope | restated-as-design, reconciled with Book 01's one-division scope (sizes as a floor) | Book 01 Ch12 (settled) |
| 18 | Pilot device mix "Windows 10/11" | Pilot scope | corrected: Windows 10 end of support Oct 14, 2025; Intune treats it as "allowed", not guaranteed; target Windows 11 | Microsoft Learn, Windows 10 end of support; Intune supported OS |
| 19 | Entra CBA "staged rollout for pilot users" | M-029 | verified and qualified: staged rollout supports CBA; not designed to be permanent; domain cutover separate | Microsoft Learn, Staged Rollout |
| 20 | Pilot devices Entra-joined or hybrid-joined | M-023 | corrected: hybrid join only with a cut date | Book 05 Ch02 (settled) |
| 21 | Arc "Guest Configuration" | M-030 | corrected: machine configuration (cited in Ch08) | Microsoft Learn (Ch08 claim 10) |
| 22 | Pilot success criteria table | Success criteria | restated-as-design (illustrative thresholds) | — |
| 23 | M-031 "zero auth failures" | Success criteria | corrected: contradicts the >99% target; table governs | Source internal inconsistency |
| 24 | Rollback procedures table | Rollback | restated-as-design with corrections: Cloud Sync has no staging server; GPO relink only helps domain/hybrid-joined devices; CA rollback to report-only, never delete (Book 04); DNS rollback can delete Azure private records (Book 08); AD CS autoenrollment only for domain-joined | Book 04 Ch07, Book 08 Ch10 (settled) |
| 25 | Arc rollback "uninstall agent, remove resource" | Rollback | corrected: `azcmagent disconnect` deletes the resource; the agent can stay | Microsoft Learn, rename/migrate Arc-enabled servers |
| 26 | Four waves of ~25%, 3 weeks each, Region → Site → Department | Waves | restated-as-design, reconciled with Book 01 division-by-division (a wave = set of divisions chosen by attribute value) | Book 01 Ch12 (settled) |
| 27 | Drift detection daily from Wave 1 | Waves | restated-as-design | — |
| 28 | GPO links kept during wave; unlink after 7-day compliance | Waves | restated-as-design; GPO objects retired in Phase 4 | Book 05 Ch07 (settled) |
| 29 | Cloud PKI capacity limits during mass issuance | Scaling risks | unverifiable: Microsoft publishes no issuance rate limit found; restated as program risk, measure in pilot | — |
| 30 | Gate authorities G1 steward; G2 steward + sponsor; G3 sponsor + steering committee | Gates | verified against settled facts | Book 01 Ch09, Ch12 |
| 31 | G1/G2/G3 criteria | Gates | verified against Book 01 Ch12 and extended with master plan milestones (design approvals, pre-pilot readiness, success criteria, M-036/M-037) | Book 01 Ch12 (settled) |
| 32 | Week ranges (master 9–33 vs Book 01 5–36) | Intro | restated-as-design (illustrative) | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| §4.2 Week 9 pre-pilot T-9.1–T-9.7, M-013 | Ch09 "Foundation build and pre-pilot readiness" and G1 checklist | Hours and companion references not carried |
| §5 Phase 2 objective, reference documents | Ch09 Phase 1 intro | Reference list not carried (archived companions) |
| §5.1 Phase 2 milestone table M-014–M-021 | Ch09 "Design milestones" (kept) | — |
| §5.2 M-014 tasks (attribute taxonomy) | Ch09 "The attribute taxonomy" | Slot assignment replaced by Book 03 map |
| §5.2 M-015 tasks (dynamic groups) | Ch09 "Dynamic groups, policy and access" | <15 min threshold corrected |
| §5.2 M-016 tasks (Intune) | Same section; Book 05 links | — |
| §5.2 M-017 tasks (CA) | Same section; Book 04 link | — |
| §5.2 M-018 tasks (sync) | Same section; Book 02 link | — |
| §5.2 M-019 tasks (DNS resolver) | Same section; Book 08 links | — |
| §5.2 M-020 tasks (Cloud PKI) | Same section; Book 07 links | — |
| §6 Phase 3 objective | Ch09 Phase 2 intro | — |
| §6.1 Pilot scope table | Ch09 "Scope" (kept, reconciled) | — |
| §6.2 Phase 3 milestones M-022–M-031 | Ch09 pilot milestones table (kept, corrected) | — |
| §6.3 Pilot success criteria | Ch09 "Pilot success criteria" (kept) | — |
| §6.4 Rollback procedures | Ch09 "Rollback, surface by surface" (kept, corrected) | Companion § references not carried |
| §7 Phase 4 objective, §7.1 scaling strategy | Ch09 "Waves defined by attribute values" | — |
| §7.2 Phase 4 milestones M-032–M-037 | Ch09 rollout milestones (kept) | — |
| §7.3 Scaling risk management | Ch09 "Scaling risks" (kept) | — |
| §10 Risk register R-003, R-004, R-005, R-007, R-009, R-010, R-011, R-015, R-016, R-017, R-022 | Reflected where they bear on Phases 1–3 (mid-pilot check-in, staged CBA, dynamic group validation); full register in Appendix A (W5) | — |
| §11 Phase 2/3 parallelism and the PKI-follows-identity rule | Ch09 design milestones paragraph | Full dependency table → Ch05 (W3) |
| §12.1 License requirements | Ch09 states only dynamic-group P1 need | License table → Ch05 (W3) |
| Appendix A milestone register (M-014–M-037) | Ch09 milestone tables | Status column not carried |
| Appendix C RACI (design, pilot, scaling rows) | — | Ch07 (W3) |
