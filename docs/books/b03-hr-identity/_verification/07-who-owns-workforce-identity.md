# Verification — Chapter 07 — Who Owns Workforce Identity

New chapter (no source page). Written 2026-10-20. All external claims were checked against the primary
source on that date; the local text extractions used are noted where a PDF was read.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-19-17 directs each agency to designate an integrated agency-wide ICAM office, team or governance structure | Opening | verified | OMB M-19-17 §IV Governance item 1 (`c07-m1917`) |
| 2 | That structure should include CIO, CFO, HR, General Counsel, CISO, SAOP, CAO and physical-security officials | Opening | verified | OMB M-19-17 §IV, first bullet (`c07-m1917`) |
| 3 | RMF defines information owner/steward, system owner, system security officer, AO | Opening | verified | SP 800-37 Rev. 2 App. D (`c07-sp80037`) |
| 4 | None of the federal documents assigns attribute meaning, person-key or contractor-access accountability | Opening | restated-as-design | Program position; stated as such |
| 5 | OPM data-standards guidance is addressed to agency officials who prepare, submit and correct HR, payroll and training data | HR owns | verified | OPM Data Policy & Guidance (`c07-opm-data`) |
| 6 | Information owner/steward definition; retains responsibility when information is shared | HR owns | verified | SP 800-37 Rev. 2 App. D, p. 119 (`c07-sp80037`) |
| 7 | HR owns code lists; HR writes new supervisor after supervisor separates | HR owns | verified (internal) | Consistent with Chapter 10 and Appendix A |
| 8 | OPM data standards kept in an online Metadata Repository; changes via a Data Element Request Form | OPM owns | verified | OPM Data Policy & Guidance (`c07-opm-data`) |
| 9 | HR 2.0 memo asks for IPT POC and policy/data/learning/super-user working-group POCs; define integration points, interfacing systems, data flows | OPM owns | verified | Memo Appendix C (`c07-hr20`) |
| 10 | Memo: Federal HR 2.0 Advisory Board; councils including the CDO Council used for updates | OPM owns | verified | Memo p. 3 (`c07-hr20`) |
| 11 | Identity feed named in the integration inventory; data WG rep carries identity view | OPM owns | restated-as-design | Program position (consistent with Chapter 12 Phase 0) |
| 12 | Contractor ownership split (COR, register keeper, PIV office, contingent worker) | Contractor sources | verified (internal) | Consistent with Chapter 06 "One fact, one authority" |
| 13 | Only the organization can decide sponsorship and adjudication; these can't be outsourced | Contractor sources | verified | SP 800-79-2 §2.3 (`c07-sp80079`) |
| 14 | Configuring API-driven inbound provisioning needs at least Application Administrator, plus Hybrid Identity Administrator for AD | Who uses | verified | Microsoft Learn, configure API-driven app, prerequisites (`c07-api-config`) |
| 15 | Lifecycle Workflows Administrator and Identity Governance Administrator are privileged roles | Who uses | verified | Microsoft Entra built-in roles (`c07-entra-roles`) |
| 16 | Security owns the leaver path end to end | Who uses | restated-as-design | Author's framing (interview deck, Who slide); program design |
| 17 | User Administrator can update most user properties for all users | Who uses | verified | Microsoft Entra built-in roles, User Administrator (`c07-entra-roles`) |
| 18 | Helpdesk Administrator resets passwords and invalidates refresh tokens; delegation via administrative units | Who uses | verified | Microsoft Entra built-in roles, Helpdesk Administrator (`c07-entra-roles`) |
| 19 | Responsibility for deciding who may access specific information may reside with the information owner/steward | Who uses | verified | SP 800-37 Rev. 2 App. D, System Owner note 122 (`c07-sp80037`) |
| 20 | Privacy Act: disclosure to agency officers/employees with need; routine use = compatible purpose, described in the SORN | Privacy | verified | 5 U.S.C. 552a(a)(7), (b)(1), (b)(3), (e)(4)(D) (`c07-privacy-act`) |
| 21 | A-108: routine use is a disclosure outside the maintaining agency; narrowly tailored; new/modified routine use needs at least 30 days after FR publication | Privacy | verified | OMB A-108 §6 and §6.k (`c07-a108`) |
| 22 | Which Privacy Act basis applies to the feed depends on who maintains the records; privacy office decides | Privacy | corrected (precision) | See note 1 below. Appendix B and Chapter 04 call identity a "routine-use consumer"; that is right when the records leave the maintaining agency (e.g. a platform operated by another agency or provider) but an intra-agency disclosure normally rests on (b)(1) need-to-know. This chapter states both and leaves the determination to the privacy office, without contradicting Appendix B's instruction to confirm the basis |
| 23 | SAOP has agency-wide responsibility and accountability; A-130 minimization ("legally authorized, relevant, and reasonably deemed necessary") | Privacy | verified | OMB A-130 §5.f.1, App. I §4.e (`c07-a130`) |
| 24 | SAOP reviews and approves privacy plans before authorization | Privacy | verified | SP 800-37 Rev. 2 App. D, SAOP (`c07-sp80037`) |
| 25 | PIA triggers include significant merging/matching of databases and internal-flow changes creating significant new uses or disclosures | Privacy | verified | OMB M-03-22 §II.B items 4 and 8 (`c07-m0322`) |
| 26 | FIPS 201-3: issue only after proper authority authorizes, identity verified, individual vetted; separation of duties so no single individual can issue a card | PIV office | verified | FIPS 201-3 §2.1, §2.7 (`c07-fips201`) |
| 27 | Issuer processes: sponsorship, identity proofing/registration, adjudication, card production, activation/issuance, maintenance | PIV office | verified | SP 800-79-2 §2.1 (`c07-sp80079`) |
| 28 | "FIPS 201-3 sponsor, registrar, issuer roles" (as phrased in the assignment) | PIV office | corrected | FIPS 201-3 does not define named sponsor/registrar/issuer roles; it states a separation-of-duties requirement (§2.7). Chapter says the named roles are agency practice and that SP 800-79-2 expects roles in the issuer's operations plan |
| 29 | Issuer operations plan includes roles and responsibilities | PIV office | verified | SP 800-79-2 §2.1 (`c07-sp80079`) |
| 30 | Termination required when an employee separates or a contractor changes positions and no longer needs access; uncollected card termination within 18 hours of notification | PIV office | verified | FIPS 201-3 §2.9.4 (`c07-fips201`) |
| 31 | ISSO maintains posture day to day and advises on controls; AO is the only official who can accept risk; AO approves MOAs/MOUs | ISSO and AO | verified | SP 800-37 Rev. 2 App. D (`c07-sp80037`) |
| 32 | SP 800-47 Rev. 1 covers agreements for information exchanges (July 2021) | ISSO and AO | verified | csrc.nist.gov SP 800-47 Rev. 1 (`c07-sp80047`) |
| 33 | Enterprise architects build a holistic view of missions, processes, information and IT assets | Data architect | verified | SP 800-37 Rev. 2 App. D, Enterprise Architect (`c07-sp80037`) |
| 34 | Data governance is shared among many data stewards, convened by the CDO through the Data Governance Body | Data architect | verified | OMB M-19-23 §IV and Phase 1 actions (`c07-m1923`) |
| 35 | Model placed under the Data Governance Body; four rules; per-attribute record | Data architect | restated-as-design | Program design; record fields taken from Chapter 01 "Authority boundaries" |
| 36 | Microsoft: review write permissions for rule attributes in Entra ID and source directories; restrict self-service write | Data architect | verified | Microsoft Learn, dynamic membership rules, security consideration (`c07-dyn-rules`) |
| 37 | Responsibility matrix and comments | Matrix | restated-as-design | Program's recommended model; one-decider convention follows Book 02 Chapter 06 |
| 38 | Failure modes and countermeasures | Failures | restated-as-design | Program design; cross-references to Chapters 04, 06, 09–12 checked |
| 39 | Contractor access ends at the earliest end condition | Failures | verified (internal) | Chapter 06 |

Notes:

1. **For the editor (Appendix B, Chapter 04):** the "routine-use consumer" phrasing is accurate only where the
   disclosure leaves the agency that maintains the records. A-108 §6.k defines a routine use as a disclosure
   outside the maintaining agency; 5 U.S.C. 552a(b)(1) covers intra-agency need-to-know. Consider "confirm the
   Privacy Act basis (need-to-know within the agency, or a routine use where the records leave it)". Not edited here.
2. **For the editor (assignment wording):** FIPS 201-3 has no named sponsor/registrar/issuer roles (see claim 28).
3. OMB A-108's issue date isn't printed in the PDF text; the footnote gives the year (2016) only.

## Carry-forward ledger (sections and the existing pages they draw on)

| Source page § | Went to | Or why not carried |
|---|---|---|
| Interview deck script, Slide 5 "Who" (owners, users, guards, partners, data architect role) | Whole chapter structure; owners/users/guards sections; data architect section; diagram ch07-owners-users-guards | First-person "my role" restated as the enterprise data architect role; "partner agencies" folded into the OPM section (working groups, shared standard) |
| Interview deck script, Slide 7 (sponsor across HR, CIO identity team and privacy; data owners designated; person key confirmed) | Matrix (governance body, person key row); failure table | Kept as design |
| Book 02 Ch 06 "The people", "The responsibility matrix", "Entra roles for each team" | Linked from opening and Who uses; matrix convention (D/R/C, one decider) | Migration roles not repeated, per assignment |
| Ch 01 "Authority boundaries" (owner, meaning, values, quality, correction path, permitted use) | Data architect section, per-attribute record | — |
| Ch 01 "The enterprise data architecture contribution" | Data architect section | — |
| Ch 03 program facts, Phase 0 actions | OPM owns section | Wave membership and dates not repeated (Chapter 03 owns them) |
| Ch 04 system-of-record split, identifier decision, operating rules, writeback rule | HR owns; data architect "one key"; failure table | — |
| Ch 06 contractor options, "One fact, one authority", earliest-end rule, writers | Contractor sources; failure table; data architect section | — |
| Ch 08 leaver and emergency termination | Who uses (security); matrix leaver and exception rows | — |
| Ch 09 PIV leaver steps, 18-hour rule | PIV office section | — |
| Ch 10 code lists owned by HR; rule governance | HR owns; matrix | — |
| Ch 11 drift classes (unauthorized write) | Failure table | — |
| Ch 12 Phase 0/1/6 items; Roles table | OPM owns; privacy timing; failure table; pointer to Roles table | Roles table left in Ch 12 (it lists who does each phase's work) |
| Appendix A quarantine contract; manager links | Help desk bullet; HR owns; matrix | — |
| Appendix B privacy basis, ISSO checklist | Privacy section; ISSO and AO section | See note 1 |
