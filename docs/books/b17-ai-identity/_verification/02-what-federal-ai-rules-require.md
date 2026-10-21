# Verification — Chapter 02, What Federal AI Rules Require, and What They Don't

Writer W1. Source: `docs/whitepapers/federal-ai-governance-submission-readiness.md` (all sections), plus new research on federal AI policy. Primary sources opened October 21, 2026: OMB M-25-21, M-25-22 and M-26-04 PDFs (whitehouse.gov); OMB memoranda index page (list through M-26-19); Federal Register API (executive orders since January 1, 2025, filtered for AI) and raw text of EOs 14179, 14319, 14365, 14409, 14432 and 14434; OMB 2025 AI Use Case Inventory repository (README, data dictionary, 2025 reporting guidance PDF); NIST AI RMF page (nist.gov), NIST AI 100-1 and AI 600-1 PDFs; CSRC COSIS (formerly COSAiS) project page; CISA BOD 26-04 page; CISA AI topic page; CISA "Deploying AI Systems Securely" alert; CISA "Careful Adoption of Agentic AI Services" resource page; FedRAMP AI page.

Manual checks: the NSA/CISA *AI Data Security* information sheet PDF on media.defense.gov returned an HTML block page, and the full agentic AI guide on cyber.gov.au timed out; neither was circumvented. The chapter cites the CISA AI page's listing for the data-security sheet and CISA's resource page for the agentic guide.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | EO 14179 (Jan 23, 2025) directs OMB to revise M-24-10 and M-24-18 within 60 days; refers to EO 14110 as revoked | Opening; rule-set table | verified | EO 14179 §5, 90 FR 8741 |
| 2 | M-25-21 and M-25-22 both dated April 3, 2025; M-25-21 rescinds M-24-10; M-25-22 rescinds M-24-18 | Opening; table | verified | Both memos |
| 3 | Source's earlier revision read an AI-specific ATO gate into M-25-21 | Opening | verified as a correction already made in the source (v1.3); restated without competitive framing | Whitepaper |
| 4 | EO 14319 (July 23, 2025), two Unbiased AI Principles | Table; M-26-04 section | verified | M-26-04 Overview; FR listing |
| 5 | M-26-04 dated Dec 11, 2025; new solicitations; existing contracts by next option; policies by March 11, 2026; minimum vendor documentation; sunsets two years after issuance | M-26-04 section | verified | M-26-04 |
| 6 | Source: M-26-04 "self-sunsets on 11 December 2027" | M-26-04 section | verified (two years after Dec 11, 2025, unless OMB provides otherwise) | M-26-04 (d) |
| 7 | M-26-04 footnote 1 cites "Executive Order 14139" for the Woke AI order | — | not carried; noted: typo in the memo, the order is EO 14319 (Federal Register) | M-26-04; FR |
| 8 | EO 14409 (June 2, 2026): CNSS and War prioritize cyber defense; CISA BODs and guidance; clearinghouse; voluntary frontier-model framework, up to 30 days' access; no licensing requirement | 2026 orders | verified | EO 14409, 91 FR 34565 |
| 9 | BOD 26-04 (June 10, 2026) cites EO 14409 among priorities | 2026 orders | verified | CISA BOD 26-04 page |
| 10 | EO 14434 (Sept 29, 2026): use "Super Intelligence"/"SI" in non-statutory documents; doesn't alter previous documents; defines SI by the statutory AI definition | 2026 orders | verified | EO 14434, 91 FR 63129 |
| 11 | NIST renamed COSAiS to COSIS on Oct 20, 2026; CISA AI pages now use SI | 2026 orders; NIST | verified | CSRC project page; CISA AI page |
| 12 | No other OMB AI memorandum through M-26-19 | Rule set | verified | OMB memoranda page |
| 13 | Other AI EOs (14141, 14277, 14320, 14355, 14363, 14365) don't set agency AI-governance requirements | Rule set | verified by title and, for 14365, text read | Federal Register |
| 14 | M-25-21 scope: 44 USC 3502(1); CFO Act-only items; IC exceptions; NSS excluded | M-25-21 | verified | M-25-21 App. §1 |
| 15 | Requirements/deadline table (60/90/180/180+biennial to 2036/270/270 should/annual/365/30) | M-25-21 | verified | M-25-21 sections and Consolidated Table |
| 16 | Source: practices "due 3 April 2026" | M-25-21 | verified (365 days; OMB's 2025 guidance states the April 3, 2026 deadline) | M-25-21 §4(a)(i); OMB guidance §1(b) |
| 17 | Source: CAIO "within 60 days"; compliance plans 180 days and every two years until 2036 | M-25-21 | verified | M-25-21 §3(a)(i), §3(b)(ii) |
| 18 | CAIO duties: maintain inventory; high-impact determination process; central tracking; independent review before risk acceptance | M-25-21 | verified | M-25-21 §3(a)(i)(E)–(F) |
| 19 | "trained and accountable agency officials at the lowest appropriate level" | M-25-21 | verified | M-25-21 §3(b)(i) |
| 20 | High-impact definition quoted; Section 6 presumed categories | Seven practices | verified | M-25-21 §4(a), §5, §6 |
| 21 | Seven practices and the quoted text in the table | Seven practices | verified | M-25-21 §4(b)(i)–(vii) |
| 22 | Identity-question column | Seven practices | restated-as-design | — |
| 23 | Independent review is part of the impact assessment (item F), not an eighth practice | Seven practices | verified | M-25-21 §4(b)(ii)(F) |
| 24 | Pilot exemption conditions; CAIO waivers, non-delegable | Seven practices | verified | M-25-21 §4(a)(i)–(ii) |
| 25 | No AI-specific ATO: fn 29 quote; fn 22 quote; §3(b)(iii) "continuous authorizations for AI"; fn 11 | What M-25-21 doesn't do | verified | M-25-21 |
| 26 | Applies to functionality not whole system; doesn't address general information-system issues | What M-25-21 doesn't do | verified | M-25-21 App. §1, §1(b) |
| 27 | M-25-21 sets no identity requirements and doesn't cite NIST/AI RMF | What M-25-21 doesn't do | verified (full-text search of the memo) | M-25-21 |
| 28 | M-25-22 applicability (solicitations 180 days after issuance; options), NSS excluded; 270-day policy update | M-25-22 | verified | M-25-22 §2(c)–(d), §3(b) |
| 29 | M-25-22 §4(e)(i) ATO before deployment quote | M-25-22 | verified | M-25-22 |
| 30 | M-25-22 permanent prohibition on training with non-public agency data quote | M-25-22 | verified | M-25-22 §3(e)(iv) |
| 31 | Sunset criteria and closeout terms; read as a leaver process | M-25-22 | verified; leaver reading restated-as-design | M-25-22 §4(e)(iv), §4(f) |
| 32 | Source: "M-25-22 is the memo a contracting officer actually works from — directly relevant to a solicitation response" | — | removed (competitive framing) | — |
| 33 | 2025 inventory: OMB submission Dec 22, 2025; public posting Jan 28, 2026; consolidated COTS certification | Inventory | verified | OMB 2025 guidance |
| 34 | 3,611 use cases, 445 high-impact (April 13, 2026) | Inventory | verified | OMB repo README |
| 35 | No 2026 inventory guidance published as of writing | Inventory | verified (repository and memoranda page show none) | OMB repo; memoranda page |
| 36 | Source: "The inventory's six `hi_*` fields cannot evidence all seven practices — human training and public feedback have no inventory field at all" | Inventory | corrected: the 2025 schema has nine `hi_*` fields covering all seven practices (incl. `hi_training_established`, `hi_public_consultation`); the accurate point is status, not evidence | OMB 2025 guidance §5; data dictionary |
| 37 | Inventory has no identity fields; `have_ato` reports existing posture, not a gate | Inventory; no AI-specific ATO | verified (field list); reading consistent with Ch03 | OMB 2025 guidance §5 |
| 38 | AI RMF 1.0 released Jan 26, 2023; "intended for voluntary use"; four functions | NIST | verified | NIST AI RMF page; AI 100-1 |
| 39 | AI RMF "is being revised as part of the White House AI Action Plan"; critical-infrastructure concept note April 7, 2026 | NIST | verified | NIST AI RMF page |
| 40 | AI 600-1 July 26, 2024; twelve risks "unique to or exacerbated by" GAI; information security; value chain "improper supplier vetting across the AI lifecycle" | NIST | verified | AI 600-1 §2 |
| 41 | COSIS: proposed use cases; concept paper Aug 14, 2025; annotated outline Jan 8, 2026; feedback by Feb 13, 2026; no public draft yet | NIST | verified | CSRC project page (Recent Updates) |
| 42 | CISA "Deploying AI Systems Securely" April 15, 2024 | CISA | verified | CISA alert page |
| 43 | AI data security information sheet (joint) | CISA | verified as listed on CISA AI page; PDF manual check | CISA AI page |
| 44 | "Careful Adoption of Agentic AI Services," May 1, 2026, with ASD's ACSC | CISA | verified (resource page) | CISA resource page |
| 45 | FedRAMP AI Prioritization Aug 2025–Apr 2026, closed; criteria (SSO, SCIM, RBAC, data separation, five CFO Act agencies or CIO Council, MAS) | FedRAMP | verified | fedramp.gov/ai |
| 46 | Provider authorization covers the provider; agency authorizes its own use | FedRAMP | verified (settled fact) | Book 10 Ch03 |
| 47 | Book 14 characterization: no three-year rule, annual testing, ongoing authorization, AO alone accepts risk | No AI-specific ATO | verified (settled fact) | Book 14 |
| 48 | Two decisions (M-25-21 risk acceptance and ATO) tied to one identity record | No AI-specific ATO | M-25-21 parts verified; tying record restated-as-design | M-25-21 fn 21, 22, 29; §4(b)(ii)(G) |
| 49 | `have_ato` = No on a deployed use case is a finding against agency policy, not M-25-21 | No AI-specific ATO | restated-as-design (carried from source; consistent with Ch03) | Whitepaper |
| 50 | Rules-as-identity-obligations table | Reading the rules | restated-as-design | — |
| 51 | DoD doesn't inventory individual use cases; IC outside practices; NSS outside both memos | Honest limits | verified | M-25-21 Consolidated Table notes and §1(c), §4; M-25-22 §2(d) |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, subtitle ("moves that raise win probability") | — | Competitive framing dropped |
| Problem/Solution/Ask box | Problem: Ch02 "What M-25-21 doesn't do" and Ch01 framing; Solution: Ch01 thesis | Ask (demo moves, ATO-inheritance posture for the product, Keycloak activation) dropped as competitive and product framing |
| Purpose ("how the program competes") | — | Competitive framing dropped |
| What M-25-21 actually requires (items 1–4) | Ch02 M-25-21 tables and "Seven minimum practices" | All facts re-verified on the memo; internal "Book 21 Chapter 2" and decision references removed |
| No AI-specific ATO paragraph | Ch02 "What M-25-21 doesn't do" and "There is no AI-specific ATO" | Quotes added from M-25-21 fn 22, 29 and M-25-22 §4(e)(i); evaluator framing dropped |
| Callout: companion memoranda (M-24-10 rescinded; M-25-22; M-26-04 dated and sunset) | Ch02 rule-set table, M-25-22 and M-26-04 sections | Re-verified |
| The differentiator, re-based (contact email as owner anchor; bureau as organizational node; `have_ato` as ATO enumeration source; reciprocity candidate) | Ch02 inventory section and two-decisions section; detail to Ch03 | "Differentiator" and "vendor" framing dropped; reciprocity lookup left to Ch03/Ch10 |
| Inventory cannot evidence all seven practices | Ch02 inventory section | Corrected (see claim 36) |
| Figure 01 (coverage ledger) | — | Product coverage ledger dropped per brief; replaced by house-style diagrams |
| Coverage ledger table (deployed vs proposed) | — | Product coverage ledger dropped per brief |
| SSOT registry note (inventory as SSOT object class with JML lifecycle) | Ch01 item 6 (lifecycle) and Ch02 obligations table | Internal volume reference not carried |
| Where we are strong | — | Competitive framing |
| Where an evaluator will find gaps | — | Competitive framing; product authorization posture not relevant to agencies |
| Figure 02 (three moves) and The three moves | — | Competitive framing |
| Bottom line | — | Competitive framing |
| References (program decisions; compliance series volume) | — | Internal references |
