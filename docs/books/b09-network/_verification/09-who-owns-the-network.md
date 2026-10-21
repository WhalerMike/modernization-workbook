# Verification — Chapter 09, Who Owns the Network and Its Transport

Writer: W5. Verified 2026-10-21. New chapter. Built from `docs/projects/network-access-charter.md` and `network-access-plan.md`, the roles and gates named in `docs/whitepapers/tic3-sdwan-vs-dia.md`, `the-long-interim.md`, `field-office-wan-transformation-dp-consolidation.md`, `branch-edge-gap.md` and `docs/operational-guides/m365-optimize-exemption/index.md`, and the pattern of Book 08 Ch09 and Book 07 Ch05. The roles, matrix, sequence owners and role map are the program's recommended model and carry no footnotes; external facts are below.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Integrating SASE telemetry with CLAW "requires coordination among agencies, CISA, and SASE" | Where the roles come from; SecOps | verified | CISA, *The Journey to Zero Trust: Using SASE in a Modern TIC 3.0 Solution*, June 24, 2026, PDF text (c09-cisa-sase) |
| 2 | CLAW = "Cloud Log Aggregation Warehouse" (sources) | Where the roles come from | corrected | The CISA PDF expands CLAW as "Comprehensive Log Aggregation Warehouse" (C-CIRA, formerly NCIRA) (c09-cisa-sase) |
| 3 | SASE can replace MTIPS; agencies must engage CISA on telemetry | Where the roles come from | verified | c09-cisa-sase |
| 4 | AO accepts security and privacy risk under the RMF | Decision rights | verified | NIST SP 800-37 Rev. 2 (c09-sp80037) |
| 5 | Only contracting officers may enter into, administer or terminate contracts, within written delegation | Decision rights; Acquisition role | verified | FAR 1.602-1 (c09-far) |
| 6 | FedRAMP doesn't constrain routing / doesn't prohibit SD-WAN | Decision rights | verified (by reference) | Chapter 03 owns and footnotes it; *Branch Edge Gap* §2.6 |
| 7 | SC-7(4) requires documented exceptions with mission need and duration, reviewed on a cadence | AO role | verified | SP 800-53 Rev 5, OSCAL 5.2.0 (c09-sp80053) |
| 8 | Optimize exemption punctures SI-3, SI-4(10), AC-4, AU-3 | Decision rights | verified (by reference) | Chapter 12 / Appendix A own it; m365 instruments index |
| 9 | Signers: AO signs memo; system owner signs site register; architecture review board signs determination; ISSO concurs | Where the roles come from | restated-as-design | Program instruments (m365-optimize-exemption index, Attachment B) |
| 10 | "Federal budgets are formulated roughly two years ahead of execution" | Sponsor role | removed | Not re-verified here; restated generically ("lands in a later budget year"); Chapter 10 owns the interim's structural reasons |
| 11 | FIPS 140-2 validations moved to CMVP Historical List in September 2026; continued use in existing systems supported | CISO role | verified | NIST FIPS 140-3 Transition Effort (c09-fips1403). Sources say "22 September"; NIST's page gives Sept 21 (last active) / Sept 22 (historical list); chapter says "September 2026" |
| 12 | EIS: GSA multiple-award contract; option period 1 to 7/31/2027, option period 2 to 7/30/2032; task orders; solutions brokers | Acquisition role | verified | GSA EIS page (c09-gsa-eis) |
| 13 | CP-8 alternate telecommunications services text | Acquisition role | verified | c09-sp80053 |
| 14 | Transport closes exactly one control family (telecom diversity) | Acquisition role | restated-as-design | The series' argument; Chapter 02 owns it |
| 15 | Intune Policy and Profile Manager role suffices to create wired network profiles | Endpoint role; role map | verified | MS Learn configure wired networks, prerequisites (c09-intune-wired) |
| 16 | NAC product registered with Entra ID and granted delegated permissions to Intune NAC API | Identity role; role map | verified | MS Learn NAC integration with Intune (c09-intune-nac) |
| 17 | BOD 26-02: decommission milestones at 12 and 18 months from Feb 5, 2026; scope limited to devices on the network boundary | Matrix comment (refresh) | verified | cisa.gov BOD 26-02 (c09-bod2602). Source said "off FCEB networks by August 2027"; the boundary-only scope is added |
| 18 | "Telling BOD 26-02 scopers the target attributes in writing is the cheapest high-value action" | Matrix comment | restated-as-design | *The Long Interim* §5.2 / §6.9, attributed as the paper's recommendation |
| 19 | Competing mandates (M-26-14, M-26-15, BOD 26-04) | Sponsor role | removed | Not named here; Chapter 10 owns and verifies them |
| 20 | NPS exported configuration carries shared secrets in clear text | Role map notes | verified (by reference) | Chapter 07 (c07-nps-export) |
| 21 | Vacated space keeps live ports; MAB devices often owned by facilities | Facilities role | restated-as-design | From the Federal Compliance NAC book's physical-access list; program framing |
| 22 | Charter purpose, problem, objectives, scope, principles, success criteria, approach, risks, governance, next steps | Where the roles come from; plan table | restated-as-design | Program charter (no external claims) |
| 23 | Plan phases 0–4 and success measures | Plan table | restated-as-design | Program plan |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Charter §1 Purpose | Where the roles come from (charter paragraph) | — |
| Charter §2 Problem statement (perimeter-and-VPN, static WAN, fragmented DDI; four results) | Opening paragraph and charter paragraph | DDI fragmentation detail left to Book 08 |
| Charter §3 Objectives 1–5 | Charter paragraph; plan table | Objective 3 (certificate-anchored overlay) also in Chapter 05 |
| Charter §4 Scope (in and out) | Charter paragraph; "The charter's plan" (out-of-scope list) | — |
| Charter §5 Guiding principles | Charter paragraph | — |
| Charter §6 Success criteria | "The charter's plan" intro | — |
| Charter §7 High-level approach (name, identify, access, enforce, evidence) | Plan table phases | — |
| Charter §8 Risks and assumptions | Partly: naming-plane fragmentation and claims availability reflected in phases 1–2 | Vendor maturity in government clouds is Chapter 07 (FedRAMP status) and Chapter 05; assumptions are program-internal |
| Charter §9 Governance and ownership (sponsor, lead, four domain leads) | Where the roles come from (domain leads mapped to roles) | — |
| Charter §10 Next steps | "The charter's plan" closing sentence | — |
| Plan §1 Overview | Plan table | — |
| Plan §2 Phases 0–4 | Plan table | — |
| Plan §3 Success measures | "The charter's plan" intro | — |
| Plan §4 Immediate next actions | "The charter's plan" closing sentence | — |
| *TIC3 SD-WAN vs DIA* — Ask ("name an owner for each step") and Decision sequence | Opening; "An owner for each step"; Figure ch09-sequence-owners | Sequence argument owned by Chapters 02 and 13 |
| *The Long Interim* §5.1 structural reasons (acquisition, budget, logistics, authorization, TIC adoption, competing mandates) | Opening; Sponsor and Acquisition roles | Mandate list left to Chapter 10 |
| *The Long Interim* §5.2 BOD 26-02 refresh recommendation; §6.9 | Matrix comment (refresh row) | — |
| *The Long Interim* §6.8 chattiness belongs to application owners | Application owners role; matrix | — |
| *The Long Interim* §6.10 document the gap as accepted risk | AO role; matrix (interim posture row) | — |
| *The Long Interim* §4.6 FIPS 140-2 date | CISO role | — |
| Field-office paper §4.9 CLAW three-way coordination; MTIPS gated on parity; §7 risks (EIS task order mods, CLAW lag); §9 assumptions (telecom records, facilities headcount) | Where the roles come from; SecOps, Acquisition, Facilities roles; matrix telemetry rows | Cost and sizing stay in Chapter 11 |
| *Branch Edge Gap* §2.5 EIS/Networx transition; §2.6 FedRAMP doesn't constrain routing | Acquisition role; Decision rights | Contract history detail owned by Chapter 03 |
| m365-optimize-exemption index — "The set" signer table; separation of memo and determination | Where the roles come from; matrix SC-7(4) row | Instruments themselves are Appendix A |
| m365 Attachment A — revert owner | System owner role; matrix cutover row | — |
| Federal Compliance NAC book — physical-access list; D3 decision | Facilities role; matrix NAC rows | Design detail is Chapter 07 |
