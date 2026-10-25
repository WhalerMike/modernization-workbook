# Verification — Chapter 12, The Migration Roadmap

Editor: W5. Sources: the series chapter in place (old Chapter 09, "Migration Roadmap: Phased Plan, Gates, Rollback"); the modernization whitepaper's journey, phases and roadmap parts (`docs/whitepapers/modernization-journey.md`), whose full section ledger is below. All checks October 21, 2026.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | 52-week program, five workstreams, seven gates; durations illustrative | Program claim | restated-as-design (kept the source's caveat) | — |
| 2 | AD conflated the directory (truth) with the DC (enforcer); "NIST SP 800-207 and OMB M-22-09 require" keeping them separate | Direction of travel | corrected: stated as program design consistent with 800-207, which separates PDP from PEP and the control plane from the data plane; 800-207 is guidance | NIST SP 800-207 §3, §3.4.1 |
| 3 | Five principles and their dependence (3 and 5 depend on 1) | Direction of travel | restated-as-design | Whitepaper Act 4 |
| 4 | Block legacy authentication; start in report-only | Phase 1 | verified | Microsoft Learn, Block legacy authentication |
| 5 | Emergency access: at least two cloud-only accounts, phishing-resistant, excluded from blocking policies, monitored, validated at least every 90 days | Phase 1 | verified (added detail) | Microsoft Learn, Manage emergency access admin accounts |
| 6 | G1 "no MFA-exempt users" | Phase 1 | corrected: no user outside the MFA requirement other than the documented emergency access accounts (which are excluded from blocking CA but use phishing-resistant methods) | Microsoft Learn, emergency access |
| 7 | FIDO2 for Tier 0 | Phase 1 | restated-as-design | — |
| 8 | Hybrid join is a waypoint with a cut date; Intune doesn't manage Windows Server; servers under Arc | Phase 2 | verified via settled book facts (Book 05 Ch 02, Ch 09), linked | Book 05 |
| 9 | Entra CBA supports PIV/CAC without a federated IdP | Phase 2 | verified | Microsoft Learn, Meet MFA requirements of M-22-09 |
| 10 | G4 "Zero AD-integrated DNS zones" | Phase 4 | corrected: the AD domain's zones, including `_msdcs`, stay on a DNS service accepting secure dynamic registration while any DC runs; they move last | Book 08 Ch 10 (settled) |
| 11 | G4 certificate issuance moved to a non-AD CA | Phase 4 | corrected/clarified: user and device issuance moves; DC and LDAPS certificates stay on AD CS until AD retires | Book 07 Ch 07 (settled) |
| 12 | Demoting the last DC needs Enterprise Admins and removes the domain (and forest if last domain) | Phase 5 | verified (added) | Microsoft Learn, Demote domain controllers and domains |
| 13 | "Keep the forest in backup" as a fallback | Phase 5 | corrected: a backup is valid for restore only within the tombstone lifetime, 180 days by default; archive is a records copy | Microsoft Learn, Back up and restore AD DCs using Azure Backup |
| 14 | Gate authority table, rollback triggers, cadence | Gates | restated-as-design | — |
| 15 | Whitepaper: Consolidated Rules published June 25, 2026 | Clocks | verified (announcement dated June 25; optional early adoption July 4). Book 02 Ch 10 says "launched June 24, 2026" — inconsistency flagged to the editor, not edited | FedRAMP announcement; FedRAMP timeline |
| 16 | Whitepaper key dates: Ready ends July 28; Class A Aug 3; Class B/C Aug 31; mandatory Jan 1, 2027; no new Rev5 June 11, 2027 | Clocks | verified | FedRAMP timeline |
| 17 | Whitepaper: periodic evidence replaced by KSIs enforced by IaC; "all ConMon evidence must meet machine-readable KSI format" by Jan 1, 2027; agencies that haven't modernized "will not be able to produce it" | Clocks | corrected: the rules govern cloud service certification; KSIs belong to the 20x certification rules for providers; each agency still authorizes its own systems | FedRAMP Using a certified service; FedRAMP KSIs page |
| 18 | BOD 25-01 as an agency clock | Clocks | verified (scope: tenants with a finalized SCuBA baseline) | CISA BOD 25-01 |
| 19 | Windows 10 end of support Oct 14, 2025; WS2012 ESU end Oct 13, 2026; WS2016 end Jan 12, 2027 | Clocks | verified (added) | Microsoft Learn lifecycle; Arc licensing page |
| 20 | M-26-14 logging plan | Clocks | verified | OMB M-26-14 |
| 21 | Mainframes may lack compatible EDR | Mainframe | verified (added) | OMB M-22-09 §III.B |
| 22 | Whitepaper mainframe pattern (z/OS Connect, PassTicket, identity propagation; "shipped for a decade," "PassTicket dates to the 1990s," banks under PSD2) | Mainframe | pattern verified and carried by Ch 04 and Ch 08 (W2, W4); here only the sequencing rule and a pointer. The decade, 1990s and PSD2 history claims weren't verified and aren't carried | Ch 08 footnotes |
| 23 | "Requires an inventory, an owner, and a date" | Where to start | restated-as-design | Whitepaper Call to Action |
| 24 | Old cross-references (Chapters 01–08, 02–03, "Chapter 10 — Leadership Takeaway") | Throughout | corrected to new numbering | — |
| 25 | Microsoft Learn "Authoritative references" list | End | removed as a list; sources footnoted | — |
| 26 | Review fix, Oct 21, 2026: the 2026 rules also include rules for agencies' use of certified services, and none of them sets a deadline for the agency's own migration | Key takeaways, item 4 | verified (added) | Opened: FedRAMP, "Agency Use of FedRAMP Certified Cloud Services," <https://www.fedramp.gov/2026/reference/agency-use/> (AGC and USE subsets apply to 20x and Rev5; no migration deadline for agency systems); ruleset `fedramp-consolidated-rules.json` v2026.10.13.01, family AGU, <https://github.com/FedRAMP/rules> (AGU-AGC-NAA and AGU-USE-RSG statements read from the file). New note [^c12-agu]. |
| 27 | Review fix 2, Oct 21, 2026 (revision-history trim): "The source made 'zero AD-integrated DNS zones' a G4 criterion" | Gate G4 criteria | wording-only | Now "Don't make 'zero AD-integrated DNS zones' a G4 criterion". Rationale unchanged; links Book 08 Ch10. No new claim. |
| 28 | Review fix 2, Oct 21, 2026 (revision-history trim): "The source kept 'the forest in backup' as the fallback" | Rollback | wording-only | Now "'The forest in backup' isn't a lasting fallback". Tombstone-lifetime fact unchanged under [^c12-tsl]. No new claim. |
| 29 | Review fix 2, Oct 21, 2026 (revision-history trim): "the source conflated them" and "the source's claim that agencies which haven't modernized 'will not be able to produce' FedRAMP evidence by 2027 is wrong as stated" | External clocks | wording-only | Now "they are easy to conflate" and "the 2027 date doesn't stop an agency that hasn't modernized from producing the evidence its own authorization needs", which follows from the cited [^c12-fedramp-use] (agency authorizes its own systems). No new claim. |

| 30 | Addition, Oct 25, 2026: Microsoft's cloud-first phase is a process and policy phase to stop new AD DS dependencies; change approval should evaluate whether a change adds one; added as a G0 condition | Phase 0 | verified (added) | Microsoft Learn, Implement a cloud-first approach ([^c12-cloudfirst]) |
| 31 | Addition, Oct 25, 2026: Microsoft leaves the end state to the organization (AD removed entirely, or some capability left in place); a provisional target end state is recorded at G0 and confirmed before Phase 5 | Phase 0; Phase 5 step 3 | verified (added); the G0 timing is program design | Microsoft Learn, Cloud transformation posture ([^c12-endstate]) |

## Carry-forward ledger — old Chapter 09

| Source page § | Went to | Or why not carried |
|---|---|---|
| Title and subtitle | H1 "Chapter 12 — The Migration Roadmap"; italic thesis | — |
| Dependency chain blockquote | Kept | — |
| The program claim | Same | — |
| Phase 0 — Pre-flight | Same; transaction profiling added to the work | — |
| Phase 1 — Foundation | Same; corrections 4–6 | — |
| Phase 2 — Pilot Division | Same; Book 05/08 links; CBA footnote | — |
| Phase 3 — General Rollout | Same | — |
| Phase 4 — Legacy Retirement | Same; G4 corrected (claims 10–11) | — |
| Phase 5 — AD DS Retirement | Same; demotion fact; backup caveat | — |
| Phase 6 — Steady State | Same | — |
| The five parallel workstreams (table) | Same, with Book 01 chapter and detailed phase-plan columns linking Books 02–09 | — |
| Gates, rollback and authority (criteria, triggers table, authority table) | Same | — |
| Common failure modes | Same; report-only and locator-zone mitigations added | — |
| Cadence and finish line | Same | — |
| Key takeaways | Same, two added | — |
| Authoritative references | Footnotes | List removed |
| Previous/Next links | "Continue the book" callout (Ch 11 → Appendix A) | — |
| Figure `../../images/cshc/migration-roadmap.svg` (Assess, Define, Plan, Pilot, Rollout; gates, rollback, evidence) | `ch12-phase-gates.flow.yaml` | Redrawn on the chapter's actual seven phases and six gates |

## Carry-forward ledger — whitepaper `docs/whitepapers/modernization-journey.md`

W5 owns the journey, phases and roadmap parts. Other parts are listed with their owner so the ledger covers the whole paper.

| Whitepaper § | Went to | Or why not carried |
|---|---|---|
| Executive Summary — four eras, architecture gap, commercial precedent | — | W1 (Chapters 01–02) |
| Executive Summary — FedRAMP 20x deadline paragraph, "five principles," pointer to the Call to Action | Ch 12 "The clocks the roadmap runs against" and "Where to start" | Deadline framing corrected (claim 17) |
| Figure 1 (`rId19.png`) | — | W1 (`ch01-four-eras`) |
| Prologue; Acts 1–3; asymmetric routing | — | W1 (Chapters 01–02) |
| The physics argument; satellite; 5G; application-aware networking; SD-WAN; FEC; active-active; "DIA to M365"; commercial precedent; DIA and NIST controls | — | W3/W4 (Chapters 06–08) and Book 09 |
| Act 4 introduction — the structural move | Ch 12 "The direction of travel" | Also in Ch 03 (W2) and Ch 01 (W1); Ch 12 keeps the program-level statement and links them; "require" corrected (claim 2) |
| Figure 9 (`rId71.png`, five principles around a hub) | `ch12-five-principles.flow.yaml` | — |
| Principle 1 — single source of truth; FICAM; Evidence Act and Federal Data Strategy | Ch 12 principles table row; Appendix A (Evidence Act row and "cited but don't say" row) | Detail owned by Ch 04 (W2) and Book 03; the "twelve regional silos" example belongs to W1's narrative; FICAM/Federal Data Strategy mandate claims corrected in Appendix A |
| Figure 10 (`rId75.png`) | — | Not redrawn here; Ch 04 (W2) owns Principle 1 |
| Principle 2 — application-aware networking; TIC 3.0 versions; SD-WAN/SASE/ZTMM bullets | Ch 12 principles table row; Appendix A (TIC versions row) | Detail owned by Ch 06/08 and Book 09; TIC version dates stale (claim in Appendix A) |
| Principle 3 — session to token; BOD 25-01; M-22-09; ZTMM CBA claim; NTLM | Ch 12 principles table row; Appendix A corrections (BOD 25-01 scope, ZTMM wording) | Detail owned by Ch 04/08 (W2, W4) |
| Figure 11 (`rId81.png`) | — | W2/W1 (`ch04-session-vs-token`, `ch01-session-vs-token`) |
| FedRAMP 20x Consolidated Rules section (requirement/provides table, key dates) | Ch 12 clocks; Appendix A FedRAMP rows | Product-specific rows (InfoBlox WAPI, Terraform provider, DoH/DoT on Grid Members, SCEP/EST) not carried: they are vendor mappings, not FedRAMP requirements, and the "automated KSI: all DNS encrypted," "no CIDR overlap" and "every workload has machine identity" rows don't match FedRAMP's KSI themes as published |
| Figure 12 (`rId90.png`, timeline) | — | Not redrawn; the dates are in Ch 12 prose and Appendix A |
| Principle 4 — govern actively; ZT stage table; AO callout | Ch 11 "How far automation may go" | Also Ch 03 (W2); corrected (Ch 11 claim 10) |
| Figure 13 (`rId94.png`) | Ch 11 `ch11-actuation-ladder.flow.yaml` | — |
| Principle 5 — round trips; techniques table | Ch 10 "Profiling transactions before separation" | Rule also in Ch 07 (W3) |
| Mainframe Access Modernization (current state, gateway, what doesn't change, recommendation) | Ch 12 "Mainframe access in the sequence" (sequencing rule and pointer) | Pattern carried in full by Ch 08 (W4) and Ch 04 (W2); history claims not carried (claim 22) |
| Figure 14 (`rId106.png`) | — | W4 (`ch08-mainframe-token-boundary`) |
| Federal Framework Alignment table | Appendix A requirements mapping and "cited but don't say" table | Each row checked; corrections listed in Appendix A's verification file |
| Call to Action | Ch 12 "Where to start" | — |
| Appendix — Narrative provenance mapped to program canon | — | Not carried: it maps the paper to internal decision records and names internal series; the workbook is self-contained and the paper itself marks the appendix as separable |
