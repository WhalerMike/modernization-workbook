# Verification — Chapter 01, Why Compliance Decays the Day After the Audit

Writer W1. Sources: `docs/executive-governance/ch01-why-governance-fails/index.md`, `docs/executive-governance/ch02-compliance-paradox/index.md`, the opening of `docs/whitepapers/modernization-governance-whitepaper.md` (problem/solution/ask box, executive summary, §§1–2), and `docs/executive-governance/index.md` (series landing; shared with Ch09). Primary sources opened October 21, 2026: SP 800-37 Rev. 2 PDF and SP 800-137 PDF (text extracted with PyMuPDF and read directly), 44 U.S.C. § 3554 on govinfo.gov (2023 edition), OMB Circular A-130 PDF on whitehouse.gov, the SP 800-53 Rev. 5 publication page on csrc.nist.gov and the release 5.2.0 OSCAL catalog JSON.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Opening scenario (firewall change, contractor account, provider default, agent update) | Opening | restated-as-design (illustrative framing, not a real engagement) | — |
| 2 | Four structural failure modes; "not personnel failures" | Four failure modes | restated-as-design | Source ch01 |
| 3 | AD OU tree encoded delegation, policy scope, accountability; flat cloud directory has no equivalent | Tool-shaped policy | verified (via Book 02 Ch01 / Book 01 Ch04, which carry the Microsoft citations) | Book 02 Ch01; Book 01 Ch04 |
| 4 | Failure-mode-to-fix table | Four failure modes | restated-as-design | Source ch01 table, vocabulary translated |
| 5 | "More tooling can't fix it"; fixes live beneath the tools; not the only possible design | Why more tooling | restated-as-design | Source ch01 |
| 6 | Paradox: three observations | Compliance paradox | restated-as-design | Source ch02 |
| 7 | Source: audit cycles "quarterly, annual, or 3-year for ATO" | Compliance paradox | corrected: no federal rule sets a three-year ATO; FISMA sets an annual testing floor and A-130 leaves authorization termination dates to the agency | 44 U.S.C. 3554(b)(5); A-130 App. I §4.d, §5.h |
| 8 | SP 800-37: systems "in a constant state of change"; external-provider changes "difficult to detect"; unauthorized changes from adversaries or "inadvertent errors by authorized personnel" | Compliance paradox | verified | SP 800-37r2 Task M-1 discussion (p. 77) |
| 9 | SP 800-137: initial authorization "based on evidence available at one point in time, but systems and environments of operation change" | Compliance paradox | verified | SP 800-137 §2.2 |
| 10 | Checkbox governance patterns (reviewer fatigue, document as artifact, permanent backlog) | Checkbox governance | restated-as-design (program observation) | Source ch02 |
| 11 | FISMA: periodic testing "with a frequency depending on risk, but no less than annually"; shall include automated tools consistent with NIST standards | Federal guidance | verified | 44 U.S.C. 3554(b)(5)(A)–(C) |
| 12 | SP 800-137 ISCM definition; "continuous"/"ongoing" = frequency sufficient; "data collection, no matter how frequent, is performed at discrete intervals" | Federal guidance | verified | SP 800-137 §1 and footnote 2 |
| 13 | SP 800-137: ISCM keeps SSP, RAR, SAR, POA&M current; process "otherwise static between authorizations" becomes dynamic | Federal guidance | verified | SP 800-137 §2.2 |
| 14 | CA-7 statement items a–g | Federal guidance | verified | SP 800-53r5 CA-7, OSCAL 5.2.0 |
| 15 | SP 800-37 Executive Summary: "make the transition to ongoing authorization a priority and use continuous monitoring approaches…" | Federal guidance | verified (first draft said "outcomes of preparing"; reworded to match the text) | SP 800-37r2 Executive Summary |
| 16 | Task M-6 wording "on an ongoing basis to determine whether the risk remains acceptable" | Federal guidance | verified | SP 800-37r2 Task M-6 |
| 17 | Appendix F: reauthorization "static, single point-in-time"; ongoing authorization definition, time- or event-driven, "dependent on a robust continuous monitoring program" | Federal guidance | verified | SP 800-37r2 App. F |
| 18 | A-130: transition to ongoing authorization when eligible with AO approval; reauthorize time- or event-driven; two conditions; static authorization with termination dates until AO approves | Federal guidance | verified | A-130 App. I §4.d(3)–(4), §5.h |
| 19 | A-130 date July 2016 | Footnote | verified (Federal Register notice 2016-17872, 81 FR 49689, July 28, 2016, via search result metadata); current status: still hosted by OMB on whitehouse.gov; no rescission found | A-130 PDF; web search |
| 20 | SP 800-37: without substantial automation, ongoing authorization not "feasible or practical"; phased approach, start with automated info plus manual gaps, low-impact systems first | Federal guidance; Honest limits | verified | SP 800-37r2 App. F "Transitioning from Static Authorization…" |
| 21 | Paradox = policy without automation | Federal guidance | restated-as-design (program's reading) | — |
| 22 | Four deterministic properties; identical bundle on re-run | Deterministic response | restated-as-design | Source ch02 (source's program-decision reference dropped) |
| 23 | Four AO properties (re-execution, per-record hashes and bundle hash, findings between audits, citation per control) | AO | restated-as-design; "canon citation per control" translated to "an entry in the authoritative record"; "OSCAL pipeline" and CI wording generalized | Source ch02 |
| 24 | AO alone accepts residual risk | AO | verified (settled fact in Book 01 Ch09) | Book 01 Ch09 |
| 25 | Governance must lead: three failures (wrong attributes, consumers drift first, evidence uncorrelatable) | Governance leads | restated-as-design | Whitepaper §2 |
| 26 | Attribute-driven directory computes access from attributes | Governance leads | verified via Book 01 Ch04 / Book 02 (not re-footnoted) | Book 01 Ch04 |
| 27 | Migration is multi-quarter; governance timeline shortened, not technical | Honest limits | restated-as-design | Whitepaper §6 |
| 28 | Determinism covers evidence not truth | Honest limits | restated-as-design | Source ch02 "Honest limit" |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| ch01: front matter | — | Replaced by workbook chapter front matter |
| ch01: "In this chapter" callout | Ch01 "In this chapter" and §"Four structural failure modes" intro | "Substrate problem" restated as "beneath the tools" |
| ch01 § The four structural failure modes (four subsections) | Ch01 §"Four structural failure modes" | "Canonical resolution moment" and "pillar" translated; tool-shaped policy given the OU-tree example with a link to Book 02 |
| ch01: at-a-glance table | Ch01 table "The four failure modes and where the fix lives" | Column "substrate-level" renamed; "canon" and "registry" translated |
| ch01 § Why "more tooling" cannot fix it, and pull quote | Ch01 §"Why more tooling doesn't fix it" | Pull quote folded into prose |
| ch01 § What this chapter does not claim | Ch01 §"Four structural failure modes" intro and end of §"Why more tooling" | — |
| ch01 § Where this leads (series chapter list) | — | Old series' chapter map; replaced by this book's links in context |
| ch01 § Key takeaways | Ch01 "What this chapter establishes" | Merged with ch02 takeaways |
| ch01: Continue the series / Related documents | — | Old series navigation; replaced by book navigation |
| ch02: front matter; program-decision reference | — | Internal decision reference dropped per brief |
| ch02: "In this chapter" callout | Ch01 §"The compliance paradox" | — |
| ch02 § The paradox stated (three observations) | Ch01 §"The compliance paradox" | Third observation corrected (claim 7) |
| ch02 § Why "checkbox governance" makes it worse, pull quote | Ch01 §"Why checkbox governance makes it worse" | Pull quote restated as prose |
| ch02 § The deterministic response (four properties) | Ch01 §"The deterministic response" | Kept short; full treatment is Ch05 (W3) |
| ch02: at-a-glance table (checkbox vs deterministic) | Ch01 table and diagram `ch01-two-responses` | "Re-run the assembly, compare hashes" kept as "compare the result" |
| ch02 § What changes for an authorizing official | Ch01 §"What changes for an authorizing official" | "Substrate walk", "OSCAL pipeline", "numbered canon document" generalized |
| ch02 § Honest limit | Ch01 §"Honest limits" | "ADR review" and "canon-change process" replaced by a link to Ch04 |
| ch02 § Key takeaways | Ch01 "What this chapter establishes" | — |
| ch02: Continue the series / Related documents | — | Old series navigation |
| executive-governance index: chapter table, reading paths, download bundle callout | — | Series landing for the archived series; the book index (editor) replaces it. Shared with Ch09 (W5) |
| whitepaper: front matter, author/version | — | Not carried |
| whitepaper: Problem/solution/ask box | Ch01 §"Governance has to lead the change, not follow it" | Generalized from AD→Entra to the book's argument; GCC-Moderate compensating-enforcement detail not carried (Book 10 owns the boundary) |
| whitepaper: Executive summary (architectural inversion; tools-project framing) | Ch01 §"Governance has to lead" | Inversion detail lives in Book 01 Ch04 and Book 02; linked, not repeated |
| whitepaper §1 The architectural inversion (five consequences) | — | Carried in depth by Book 01 Ch04 and Book 02; linked |
| whitepaper §2 Why governance must lead (three failures) | Ch01 §"Governance has to lead" | — |
| whitepaper §§3–7 (mechanisms, phases, worked attribute, ATO package, honest limits, conclusion) | — (one limit carried to Ch01 "Honest limits") | Beyond "the opening"; feeds Ch09 per the book brief. Adapter counts and product names not carried |
