# Verification — Chapter 10, Retirement, Steady State and Measuring Success

Writer: W5. Sources: `docs/operational-guides/program-management/master-project-plan.md` §8 (Phase 5 Cutover), §9 (Phase 6 Steady State), Appendix A rows M-038 to M-048, §11 rows for those milestones; `PROJECT-PLAN.md` Phase 5 exit criteria and §7; `PROJECT-CHARTER.md` §6. Canonical frame: Book 01 Chapter 12 (phases, gates) and Chapter 09 (gate owners). All checks October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Master plan Phase 5 = Book 01 Phase 4 / G4; no master-plan counterpart to Phase 5; master Phase 6 = Book 01 Phase 6 | Mapping table | verified against Book 01 Ch12 and B00 Ch05 mapping (consistent) | Book 01 Ch12; B00 Ch05 |
| 2 | Gate owners: G4 steward (backup sponsor); G5 sponsor and CIO | Mapping table; gates | verified (settled) | Book 01 Ch09, Ch12 |
| 3 | Master plan: "each cutover action is irreversible" | Phase 4 intro | corrected: the plan's own rollback table shows most actions reversible; the program keeps each rollback working until the next gate | Master plan §8.3 |
| 4 | AD FS conversion via Graph cmdlets; up to 60 minutes per domain; rollback with `New-MgDomainFederationConfiguration` | M-038; rollback | verified | MS Learn, Migrate from federation to cloud authentication |
| 5 | Test cloud auth at least one week, Connect Health for at least a week, before AD FS decommission | M-038 | verified (added) | MS Learn, AD FS decommission guide |
| 6 | AD FS rollback window 72 hours | Rollback table | corrected: shorter than Microsoft's one-week observation; program uses Book 07 (30 days out of path) and Book 02 (restorable 90 days after decommission) windows. Note to editor: B02 and B07 windows describe different intervals; not a contradiction but worth a look | MS Learn; Book 02 Ch10; Book 07 Ch07 |
| 7 | M-039 "auto-enrollment disabled; templates locked" on all templates | M-039; checklist item 8 | corrected: user/device templates only; DC and LDAPS stay on AD CS until AD retires | Book 07 Ch07 (settled) |
| 8 | M-040 "on-prem forwarders removed" | M-040; item 12 | corrected/scoped: only for zones that have moved; AD domain zones incl. `_msdcs` move last | Book 08 Ch10 (settled) |
| 9 | M-041 / item 5 "all GPOs unlinked from all OUs" | M-041; item 5 | corrected: DCs take account (password, lockout, Kerberos) policy only from a domain-linked GPO, so a minimum set remains | MS Learn, Group Policy application rules for domain controllers (KB 259576) |
| 10 | Item 5 method `Get-GPLink` | Checklist | corrected: no such cmdlet; `Get-GPInheritance` `.GpoLinks` | MS Learn, Get-GPInheritance |
| 11 | M-043 decommission secondary issuing CAs | M-043 | corrected: only after certificates expired/superseded; final CRL kept published while any certificate could be validated | MS Learn, decommission enterprise CA (KB 889250); MS Learn, Operate certificate revocation, CRL, CDP |
| 12 | Item 2 "zero permanent Global Admin assignments" | Checklist | corrected: emergency access accounts hold GA as permanent active | MS Learn, Manage emergency access accounts |
| 13 | Item 23 break-glass tested | Checklist | verified; added 90-day minimum | MS Learn, emergency access |
| 14 | Item 4 "all devices enrolled in Intune" | Checklist | corrected: user devices; servers are Arc (item 14) | Book 01 Ch12 / Book 05 Ch09 (settled) |
| 15 | Item 13 SRV `_ldap._tcp.domain` | Checklist | corrected to the DC locator record `_ldap._tcp.dc._msdcs.<domain>` | Book 08 Ch10 (settled; locator records) |
| 16 | "Guest Configuration" | Item 15; cadence | corrected: Azure machine configuration, previously Guest Configuration | MS Learn, Cloud-native governance with Arc-enabled servers |
| 17 | Book 01 G4 adds OU groups, DHCP, SPNs, AD auth threshold | Phase 4 | verified (settled) | Book 01 Ch12 |
| 18 | CA restore 8–12 hours | Rollback table | restated-as-design (Book 07's program value) | Book 07 Ch07 |
| 19 | Phase 5 steps; last-DC demotion removes the domain; tombstone lifetime limits backup | Phase 5 | verified (settled, linked, not re-footnoted) | Book 01 Ch12 |
| 20 | Records officer consulted before decommission | Phase 5 | verified (settled) | Book 01 Ch09 |
| 21 | DCs store password hashes of all domain accounts | Phase 5 | verified (added) | MS Learn, Active Directory accounts |
| 22 | SP 800-88 Rev. 2, September 2025, supersedes Rev. 1 | Phase 5 | verified (added) | csrc.nist.gov SP 800-88 r2 |
| 23 | Steady-state finish line (zero drift, zero-action plans, signed evidence) | Phase 6 | verified (settled) | Book 01 Ch12 |
| 24 | CA-7 Continuous Monitoring content (metrics, frequencies, ongoing assessment, analysis, response, reporting) | Phase 6 | verified | SP 800-53 r5 5.2.0 via OSCAL catalog; csrc pub page (5.2.0, Aug 27, 2025) |
| 25 | Weekly reassessment via the AD assessment cmdlet | Cadence | corrected/scoped: reads the forest only while AD runs; afterward the cloud surfaces | Design |
| 26 | Access reviews need Entra ID P2 (master plan, implied) | Cadence | corrected: member-user access reviews need Entra ID Governance or Entra Suite, some capabilities on P2; PIM needs P2 or Governance | MS Learn, What are access reviews?; ID Governance licensing fundamentals |
| 27 | Cert expiry alerts 30/14/7; DNS failure rate >0.1%; milestones M-045–M-048; SLA table | Cadence; SLAs | restated-as-design (program defaults; agency sets values) | Master plan §9 |
| 28 | Case study SLA tempo (P1 immediate/P2 1h/P3 24h/P4 72h) differs from master plan SLAs | SLAs | restated-as-design; inconsistency between sources surfaced, not resolved by fiat | Case study; master plan |
| 29 | Handover criteria (charter criteria met or deferred; ownership to operations) | Handover | restated-as-design | PROJECT-PLAN Phase 5 exit |
| 30 | Scorecard measures and gate mapping | Scorecard | restated-as-design; gate mapping kept consistent with B00 Ch05 | Charter §6; PROJECT-PLAN §7; B00 Ch05 |
| 31 | Outcome measures | Scorecard | restated-as-design | Book 01 Ch12 finish line; master plan §9 |
| 32 | `Get-ADDomain`, `Get-ADOrganizationalUnit`, `Get-GPInheritance`, `GpoLinks.DisplayName` | Code | verified (Get-GPInheritance doc shows GpoLink objects with DisplayName); AD module cmdlets are standard | MS Learn, Get-GPInheritance |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Master plan §8 intro (objective; "irreversible") | Phase 4 intro | "Irreversible" corrected (claim 3) |
| §8.1 Phase 5 milestones M-038–M-044 | "The retirement actions" table | — |
| §8.2 Cutover validation checklist (25 items) | "The cutover validation checklist" table | Items 2, 3, 4, 5, 7, 8, 12, 13, 15 corrected |
| §8.3 Rollback plan | "Rollback for each retirement action" table | AD FS window corrected |
| §9 intro (objective) | Phase 6 intro | — |
| §9.1 Continuous governance operations | "The operating cadence" table | Tool names generalized; Guest Configuration renamed |
| §9.2 Steady-state milestones M-045–M-048 | Milestone table | — |
| §9.3 SLA framework | "Drift remediation SLAs" table; diagram 2 | — |
| §11.1 dependency rows M-038–M-048; §11.2 Phase 5 parallelism | "The retirement actions" lead-in sentence | Full critical path is B00 Ch05 |
| Appendix A rows M-038–M-048 | Milestone tables | Duplicates §8.1/§9.2 |
| Appendix D gate review template | Referred to ("the program's gate review template") | Owned by another chapter (Ch05/Ch07) |
| Master plan §1–§7, §10, §12–§15, App B, C, E | — | Other chapters (Ch05, Ch07–Ch09) and App A |
| PROJECT-PLAN Phase 5 (rollout and steady state) exit criteria | "Handing over to operations" | Activities covered by Ch09 (rollout) |
| PROJECT-PLAN §7 Success measures | Scorecard, delivery measures 1, 2, 5, 6, 7, 8 | — |
| PROJECT-CHARTER §6 Success criteria | Scorecard, delivery measures 1–4, 6, 8 | — |
| Book 01 Phase 5 (AD DS retirement) | Phase 5 section (summarized, linked) | Canonical in Book 01 Ch12 |

## Diagrams

- `docs/images/diagrams/b00-orientation/src/ch10-retirement-to-steady-state.flow.yaml`
- `docs/images/diagrams/b00-orientation/src/ch10-steady-state-loop.flow.yaml`
