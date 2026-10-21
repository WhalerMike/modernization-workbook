# Verification — Chapter 02, Drift Is the Primary Threat

Writer W1. Sources: `docs/executive-governance/ch03-drift-as-primary-threat/index.md` and `docs/executive-briefs/drift-engine-overview.md`. Primary sources opened October 21, 2026: SP 800-53 Rev. 5 publication page on csrc.nist.gov (release 5.2.0, August 27, 2025, noted there) with control statements read from the release 5.2.0 OSCAL catalog JSON (catalog last-modified 2026-05-11); SP 800-37 Rev. 2 and SP 800-137 PDFs (text extracted and read directly); CISA advisory AA23-278A on cisa.gov. Coordinated with W3's Chapter 06 (`06-the-drift-engine.md` and `ch06-one-drift-model.flow.yaml`), which owns the class-to-domain-check mapping and the severity table; this chapter names the classes once and links there.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Drift definition (record vs running estate) | Opening | restated-as-design | Source ch03; Book 00 principle 11 |
| 2 | NIST catalog doesn't use "drift" | What drift is | verified (full-text search of OSCAL 5.2.0 guidance and statements: no occurrence) | OSCAL catalog |
| 3 | CM-2 statement; CM-2(2) automation for currency, completeness, accuracy, availability | What drift is | verified | SP 800-53r5 CM-2, CM-2(2) |
| 4 | CM-3 a–g summary, "monitor and review activities…"; CM-3(5) automatic response "if baseline configurations are changed in an unauthorized manner" | What drift is | verified | SP 800-53r5 CM-3, CM-3(5) |
| 5 | CM-6 a–d; "monitor and control changes"; CM-6(1) manage/apply/verify; CM-6(2) respond to unauthorized changes | What drift is | verified | SP 800-53r5 CM-6, CM-6(1), CM-6(2) |
| 6 | CA-7 a–g; CA-7(6) accuracy, currency, availability of monitoring results | What drift is | verified | SP 800-53r5 CA-7, CA-7(6) |
| 7 | Reading CM-2/3/6 + CA-7 together as drift detection | What drift is | restated-as-design (program's reading) | — |
| 8 | Principle 11 and principle 1 wording | What drift is | verified against Book 00 Ch04 | Book 00 Ch04 |
| 9 | SP 800-37: "constant state of change" across technology, people, facilities | Where drift comes from | verified | SP 800-37r2 Task M-1 |
| 10 | Unauthorized changes from "purposeful attacks by adversaries or inadvertent errors by authorized personnel"; monitor and find root cause | Same | verified | SP 800-37r2 Task M-1 |
| 11 | Changes/patches "outside of the established configuration change control process" | Same | verified | SP 800-37r2 Task M-1 |
| 12 | "Changes made by external providers can be difficult to detect" | Same | verified | SP 800-37r2 Task M-1 |
| 13 | Staff turnover; hardware/software/firmware upgrades as change sources | Same | verified | SP 800-37r2 Task M-1 |
| 14 | Five-source grouping and examples (2 a.m. fix, agent self-update) | Same | restated-as-design (illustrative) | — |
| 15 | SP 800-137: CM family as volatile example; "high rates of change"; "unauthorized or unanalyzed changes … often render the system vulnerable to exploits"; CM-6, CM-8 more frequent, automated tools with alerts and status on demand | Same | verified (SP 800-137 also says "SCAP-validated"; not carried) | SP 800-137 §3.2.2 |
| 16 | Three properties: continuous, silent, the opening other threats use | Why primary | restated-as-design | Source ch03 |
| 17 | Paused AU rule leaves membership frozen while other checks pass | Why primary | verified via Book 02 Ch05 (Microsoft citation there) | Book 02 Ch05 |
| 18 | Telemetry gaps raise no alarm | Why primary | verified via Book 12 Ch01 | Book 12 Ch01 |
| 19 | Phishing / supply chain / insider examples | Why primary | restated-as-design (source stated them as fact; reframed as the program's reasoning) | Source ch03 |
| 20 | AA23-278A: NSA and CISA, October 5, 2023; ten misconfigurations from red and blue team assessments (five named); "systemic weaknesses across many networks" | Why primary | verified | CISA AA23-278A |
| 21 | Five drift classes and definitions | How the program names drift | restated-as-design; class codes (`DRIFT-*`) kept out of prose; definitions aligned with Ch06 | Source ch03; drift-engine brief; Ch06 |
| 22 | Example per class | Same | restated-as-design; mapping consistent with Ch06 (attribute → semantic, unauthorized write → authorization, orphan account → identity) | Book 00, B01, B02, B03 chapters |
| 23 | Severity from class plus active use | Same | restated-as-design; consistent with Book 02 and Ch06 | Ch06 |
| 24 | Source maturity statement on the brief's severity table (P1 = provenance/identity only) vs ch03 (P1 = authorization or identity) | Same | not carried: sources disagree; Ch06 (W3) resolves it (P1 = provenance, authorization or identity on a live claim) | Ch06 |
| 25 | Four-step discipline (detect, classify, remediate under contract, findings as evidence) | From naming to discipline | restated-as-design; "`fmp substrate walk` in CI on every PR" generalized to "checks on every proposed change, before it merges" | Source ch03 |
| 26 | Ladder: L1 detect, L2 propose, L3 gated default ceiling | Same | verified against Book 01 Ch11 | Book 01 Ch11 |
| 27 | SOC: structured stream; work shifts to tuning and escalations | SOC | restated-as-design | Source ch03 |
| 28 | Source SOC severity table (P1–P4 with 1 h / 24 h / 72 h) | SOC | not carried here: duplicated in Ch06 severity table | Ch06 |
| 29 | AO benefits list | AO | restated-as-design | Source ch03 |
| 30 | Tooling maturity: schema and provenance checks shipped; semantic partial; authorization and identity design-only | Honest limits | restated-as-design (program status, from source brief's maturity table); Ch06 shows the detail | Drift-engine brief |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| ch03: front matter, canon-source references | — | Replaced by workbook front matter; internal references dropped |
| ch03: "In this chapter" callout | Ch02 opening and "In this chapter" | "Substrate-anchored" translated |
| ch03 § Why drift is the primary threat (three properties, pull quote) | Ch02 §"Why drift is the primary threat" | Examples reframed as program reasoning; AA23-278A added as external support |
| ch03 § The five-class taxonomy (table, "five is not arbitrary") | Ch02 §"How the program names drift" (table and diagram `ch02-five-classes`) | Internal standard filename dropped; codes replaced by plain names; mapping to other books' checks linked to Ch06 |
| ch03 § From taxonomy to operational discipline (four steps; "governance signal") | Ch02 §"From naming to discipline" | CLI name and SSP/POA&M/KSI "emissions" generalized; tie to ladder added |
| ch03 § What changes for the SOC (severity table) | Ch02 §"What changes for security operations" | Table left to Ch06 (claim 28) |
| ch03 § What changes for the AO | Ch02 §"What changes for the authorizing official" | Tied to CA-7 and Task M-1; link to Book 12 Ch12 |
| ch03 § Honest limits | Ch02 §"Honest limits" | — |
| ch03 § Key takeaways | Ch02 "What this chapter establishes" | — |
| ch03: Continue the series / Related documents | — | Old series navigation |
| brief: opening ("are we still operating exactly as…") | Ch02 opening definition | Rephrased |
| brief § Canonical drift classes | Ch02 class table | Merged with ch03's table |
| brief § Severity model and operational obligation | — | Ch06 carries the severity table (W3); escalation to named internal roles not carried |
| brief § Where drift is detected (CI walker, runtime runner) | Ch02 §"From naming to discipline" step 1 | Workflow and CLI names dropped |
| brief § How leaders should consume drift output (governance tickets, evidence regeneration, enforcement feedback) | Ch02 steps 3–4 | "halt / fix / flag / log" outcome vocabulary left to Ch06 |
| brief § Maturity snapshot | Ch02 §"Honest limits" | Table left to Ch06 "What is built today" |
| brief § Where to go deeper; leadership takeaway | Ch02 links to Ch06 | — |
| CM-2 / CM-3 / CM-6 / CA-7 tie (book brief requirement) | Ch02 §"What drift is, in NIST's terms" | New content; claims 2–7 |
