# Verification — Chapter 02, Governance Principles for Zero Trust

Checked October 21, 2026 by writer W1. Sources: `docs/whitepapers/zero-trust-governance-principles.md` (whole page) and `docs/whitepapers/zero-trust-governance-whitepaper.md` (v1.3; §1, §3, §6 and §10 here; the substrate, drift, evidence, outlook, quarter-steps and honest-limits sections go to Ch10). ZTMM v2.0, NIST SP 800-207 and OMB M-22-09 were downloaded and text-extracted; Microsoft pages opened through the Microsoft Learn MCP tools; others fetched directly.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ZTMM: five pillars operated through three cross-cutting capabilities that support interoperability across pillars | Opening | verified | ZTMM pp. 10–11 |
| 2 | ZTMM Governance definition: "definition and associated enforcement … within and across pillars" | Opening; P4 | verified (new) | ZTMM p. 11 |
| 3 | Programs spend 2+ years buying per-pillar tools and stall at Initial/low Advanced; Governance is least funded | Opening; case box | restated-as-design | Program observation (both sources); no external statistic exists |
| 4 | Advanced/Optimal call for continuous verification, automated policy evaluation, cross-pillar correlation | Why programs stall | verified (reworded) | ZTMM §5 guiding criteria p. 9, quoted directly (cross-pillar coordination; centralized visibility and identity control; enforcement integrated across pillars; Optimal cross-pillar interoperability with continuous monitoring) |
| 5 | Traditional stage reads like the failure patterns (siloed enforcement, manual response, limited correlation) | Why programs stall | verified (new) | ZTMM p. 9 |
| 6 | Three failure patterns (administered not governed; per-tool evidence; drift at audit time) | Why programs stall | restated-as-design | Program argument |
| 7 | Model is a guide; no stage mandated | Decision makers | verified | ZTMM p. 12; Book 01 settled fact |
| 8 | Identity as root namespace; device claim keyed to Entra object ID; address derived from identity; workload decisions consume identity claims | P1 | restated-as-design | Program decision (governance whitepaper §3) |
| 9 | SP 800-207 enhanced identity governance: identity of actors as "the key component of policy creation" | P1 | verified (new) | SP 800-207 §3.1.1 |
| 10 | M-22-09: centralized identity management systems; consolidate authentication systems | P1 | verified (new) | M-22-09 pp. 5–6 |
| 11 | ZTMM Identity Stores Optimal: integrates stores across all partners and environments | P1 | verified (new) | ZTMM Table 2, p. 14 |
| 12 | Storm-0558 forged tokens with an acquired consumer key; validation flaw let them access enterprise mail | P1 | verified | CSRB report |
| 13 | "Continuous access evaluation, short token lifetimes, and phishing-resistant credentials are required" | P1 | corrected | Learn CAE: CAE sessions get long-lived tokens (up to 28 h) and configurable token lifetime isn't honored; non-CAE clients keep the 1-hour default. Rewritten as prompt revocation by whichever mechanism applies. "Required" restated: phishing-resistant MFA is required by M-22-09; CAE is the program's hardening position |
| 14 | CAE critical events and CA policy evaluation in EXO/SPO/Teams/Graph | P1 | verified (new) | Learn CAE |
| 15 | M-22-09 phishing-resistant MFA for staff/contractors/partners; definition | P1 | verified | M-22-09 p. 5, fn 6 |
| 16 | ZTMM phishing-resistant MFA (FIDO2/PIV) at Advanced; continuous validation at Optimal | P1 | verified | ZTMM Table 2, pp. 13–14; Book 01 settled fact |
| 17 | Identity plane needs its own telemetry; PE/PA config access risk | P1 | verified (new) | SP 800-207 §5.1 |
| 18 | ZTMM Access Management: permanent access with periodic review (Traditional) → JIT/just-enough (Optimal) | P2; Decision makers | verified (new) | ZTMM Table 2, p. 14 |
| 19 | PIM eligible/activate/JIT; zero permanently active assignments except emergency accounts | P2 | verified (new) | Learn PIM overview and deployment plan |
| 20 | Break-glass accounts are governed artifacts | P2 | verified (new detail) | Learn emergency access accounts: 2+ accounts, monitoring/alerting, validation at least every 90 days and after staff changes |
| 21 | CVE-2024-37085 as admin-by-name example | P2 | verified | Microsoft Security Blog, July 29, 2024 (see Ch01 claim 16 for the delete/recreate correction) |
| 22 | Evidence must be reproducible, machine-readable, regenerable; non-re-executable evidence is an assertion | P3 | restated-as-design | Program principle |
| 23 | OSCAL as machine-readable control-assessment format | P3 | verified (new) | NIST OSCAL site |
| 24 | ZTMM Visibility and Analytics Traditional → Optimal wording | P3 | verified (new) | ZTMM Table 7, p. 29 |
| 25 | ZTMM Governance capability Traditional → Optimal wording | P4 | verified (new) | ZTMM Table 7, pp. 29–30 |
| 26 | Gated actuation posture (human approval; high-blast-radius gated permanently) | P4 | restated-as-design | Program design; consistent with Book 01 Ch09 |
| 27 | A CSP's tool can only see its own platform; agency is the only party to hold one posture | P5 | restated-as-design | Program argument; supported by ZTMM p. 12 (service providers assessed as dependencies) |
| 28 | GCC-Moderate silently lacks Endpoint Analytics, Device Health Attestation, Network Fence, ARC Server Monitoring | P5 | corrected / removed | Learn Intune government service description: Intune has no separate GCC instance (GCC = commercial Intune); DHA is "planned" for GCC High/DoD, not GCC. Network Fence and Arc server monitoring couldn't be matched to Microsoft documentation. List dropped; principle kept |
| 29 | Government cloud feature availability differs from commercial | P5 | verified (new) | Learn, Office application and feature availability in Government plans; Intune government service description |
| 30 | CAE "inferred degraded" in GCC-Moderate (FINDING-006) | P5 | restated-as-design | Program finding (inferred), not a Microsoft statement; finding ID not carried (internal) |
| 31 | BOD 25-01 is M365-specific, doesn't extend to CSPs/network/VMware | P5 | corrected (precision) | BOD 25-01: tenants with a finalized SCuBA baseline, Microsoft Office 365 at issuance, other products as baselines are issued (Google Workspace since added — see Ch01 claim 20) |
| 32 | Named Commercial exceptions (Amazon Connect, SailPoint NERM) in a `gcc-boundary` schema; `commercial-general` and `state-local` boundaries | P5 | restated-as-design (generalized) | Kept as the program's governed-exception pattern; vendor and schema names not carried (program internals; detail for Ch10/Book 10) |
| 33 | Eight governance decisions this quarter | Decisions table | restated-as-design | Program guidance (principles page "Ask") |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Principles: title and subtitle | Ch02 thesis and opening | — |
| Principles: Problem, solution, ask | Ch02 "The case in one paragraph" | — |
| Principles: Why programs stall below Advanced (three patterns + criteria) | Ch02 "Why programs stall below Advanced" | Criteria quoted from ZTMM (claim 4) |
| Principles: The five principles (1–5) | Ch02 Principles one to five | P1 corrected (claim 13); P5 detail corrected (claim 28) |
| Principles: Leadership takeaway | Ch02 P5 and "What this chapter establishes" | — |
| Principles: closing italic note ("Cleaned extraction…") | — | Provenance note for the old page; not content |
| Governance WP: front matter and title | — | FMP-branded framing replaced by book structure |
| Governance WP: Problem, solution, ask | Ch02 case box (problem); Ch10 (substrate solution and four-step ask) | — |
| Governance WP: Executive summary | Ch02 opening (pillars, stages, two-year stall) | Substrate claims to Ch10 |
| Governance WP §1 Why programs stall | Ch02 "Why programs stall below Advanced" | — |
| Governance WP §2 Substrate contribution per pillar (table and "in practice" examples, KSI-IA-02 vs KSI-IAM-APM note) | Ch10 (W4) | FMP substrate detail is evidence-pipeline material; Ch02 keeps only the root-namespace consequence |
| Governance WP §3 Identity as root namespace | Ch02 Principle one | Restated as program design; naming-not-trust caveat kept |
| Governance WP §4 Continuous verification through drift (six drift classes; shipped vs partial) | Ch10 (W4); Ch02 P3 links to it | — |
| Governance WP §5 Evidence at Advanced/Optimal (continuous, cross-pillar, reproducible) | Ch02 P3 (principle level); Ch10 (shipped vs target detail) | — |
| Governance WP §6 Boundary problem (GCC-Moderate; probe, adapters, compensating enforcement, ATO; named exceptions; new boundaries) | Ch02 Principle five (principle and governed-exception pattern) | Feature list corrected (claim 28); mechanism detail to Ch10 and Book 10; vendor/schema names not carried (claim 32) |
| Governance WP §7 Pillar-by-pillar maturity outlook | Ch10 (W4) | Shipped/target status table belongs with evidence |
| Governance WP §8 What an agency can do this quarter (four FMP steps) | Ch10 (W4) | Ch02 carries the principles page's eight decisions instead |
| Governance WP §9 Honest limits (incl. CAE caveat) | Ch10 (W4); CAE caveat summarized in Ch02 P5 | — |
| Governance WP §10 Conclusion ("destination model"; not a product) | Ch02 opening and closing; Ch01 "What the program adds" | — |
