# Verification — Chapter 03, What CISA's Maturity Model and M-22-09 Actually Require

Checked October 21, 2026 by writer W2. Source: `docs/modernization-specs/zero-trust.md` (175 words; a substrate contract with no external claims). Because the source carries almost no factual content, the chapter is written fresh from the primary documents. ZTMM v2.0, OMB M-22-09, OMB M-26-14, NIST SP 800-207 and EO 14028 were downloaded and read as text (pdftotext); CISA, OMB, NIST and FedRAMP pages were fetched directly. NIST control data from the OSCAL Rev. 5 catalog, release 5.2.0.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | EO 14028: "advance toward Zero Trust Architecture"; 60-day plan incorporating NIST migration steps | Four documents | verified | EO 14028 §3(a), §3(b)(ii) |
| 2 | EO 14028 §10(k) definition: "eliminates implicit trust in any one element, node, or service"; "throughout all aspects of the infrastructure" | Four documents | verified | EO 14028 §10(k) |
| 3 | M-22-09 date, FY 2024 objectives, organized by ZTMM pillars | Four documents | verified | M-22-09 opening, §III |
| 4 | ZTMM v2.0 "should not be viewed as a strict set of requirements but as a general guide" | Four documents; maturity model | verified | ZTMM §5 (p. 12) |
| 5 | CISA revised ZTMM "to further align with M-22-09's direction" | Four documents | verified | ZTMM §2 |
| 6 | M-26-14 Logging Reference Architecture "will align with the Zero Trust Maturity Model" | Four documents | verified | M-26-14 Appendix A |
| 7 | M-22-09 is "a starting point, not a comprehensive guide"; Appendix A for maturity models | What M-22-09 requires | verified | M-22-09 §III |
| 8 | M-22-09 "also addresses on-premise and hybrid systems" | What M-22-09 requires | verified | M-22-09 §III |
| 9 | 30-day strategy lead; 60-day implementation plan and budget estimate | Program actions | verified | M-22-09 §III |
| 10 | "Entire 'C-suite'" aligned | Program actions | verified | M-22-09 §III |
| 11 | Identity actions (centralized IdM, MFA at app layer, phishing-resistant for staff/contractors/partners, option for public, password policy, device signal) | Pillar table | verified | M-22-09 §III.A |
| 12 | Devices actions (CDM inventories, EDR per M-22-01) | Pillar table | verified | M-22-09 §III.B |
| 13 | Networks actions (encrypted DNS, HTTPS for web and API, .gov preload, isolation plan with CISA) | Pillar table | verified | M-22-09 §III.C |
| 14 | Applications actions (testing program, third-party evaluation, VDP, one FISMA Moderate app on internet, non-.gov hostnames, immutable workloads "should") | Pillar table | verified | M-22-09 §III.D |
| 15 | Data actions (initial automation of categorization, audit access to data encrypted at rest in commercial cloud, logging "as described in M-21-31") | Pillar table | verified | M-22-09 §III.E |
| 16 | Phishing-resistant definition; discontinue SMS/voice/one-time codes/push for routine self-service; PIV and Derived PIV simplest; FIDO2/WebAuthn permitted | Pillar notes | verified | M-22-09 §III.A.2, footnote 6, §III.F.2 |
| 17 | Three SP 800-207 approaches; "may vary from agency to agency"; "move away from ... broad enterprise-wide network" | Pillar notes | verified | M-22-09 §III.C.5 |
| 18 | OMB policies "neither require nor prohibit inline decryption"; avoid static keys with broad decryption | Pillar notes; cited-but-don't-exist | verified | M-22-09 §III.C.1, §III.F.3 |
| 19 | M-22-09 not rescinded | Reading M-22-09 in 2026 | verified (negative search, stated with its basis) | OMB memoranda index lists no rescission of M-22-09 in M-25-xx or M-26-xx; PDF still served on whitehouse.gov |
| 20 | M-26-14 (May 22, 2026) rescinded M-21-31 | Reading M-22-09 in 2026 | verified | M-26-14 p. 1 |
| 21 | ZTMM v2.0 cover April 2023; revision table lists v2.0 as March 2022 | Maturity model | verified (discrepancy recorded) | ZTMM cover and Table 1 |
| 22 | ZTMM "one of many paths" | Maturity model | verified | ZTMM §1 |
| 23 | No later ZTMM version; CISA page marked "Archived Content"; points to zerotrust.cyber.gov | Maturity model | verified | CISA ZTMM page; web search found no newer version |
| 24 | zerotrust.cyber.gov didn't resolve | Maturity model | verified (observed: DNS lookup failed on Oct 21, 2026) | Direct fetch attempt |
| 25 | Five pillars, three cross-cutting capabilities, four stages | Structure | verified | ZTMM §5 |
| 26 | Function names per pillar | Structure table | verified | ZTMM Tables 2 to 6 |
| 27 | Functions marked new in v2.0 (Access Management, Device Threat Protection, Network Resilience, Data Categorization, among others) | Structure | verified | "(New Function)" labels in Tables 2 to 6 |
| 28 | Stage criteria quotes (Traditional, Advanced, Optimal) | Stages | verified | ZTMM §5 guiding criteria |
| 29 | Each pillar "can progress at its own pace"; coordination needs compatible capabilities | Stages | verified | ZTMM §5 |
| 30 | Identity Advanced/Optimal text; FIDO2 or PIV as examples | Stages | verified | ZTMM Table 2 |
| 31 | Networks Traditional/Optimal segmentation text | Stages | verified | ZTMM Table 4 |
| 32 | Aligned to single administrative domain or accreditation boundary; assess reliance on service providers | What the model says | verified | ZTMM §5 (p. 12) |
| 33 | Doesn't address incident response, logging specifics, OT, certain IoT | What the model says | verified | ZTMM §5 (p. 11) |
| 34 | Assess current state "before investing" | What the model says | verified | ZTMM §5 (p. 8) |
| 35 | "Careful to not create new opportunities for exploitation" | What the model says | verified | ZTMM §5 (p. 11) |
| 36 | SP 800-207 tenets quoted; "attempt to be technology agnostic" | SP 800-207 | verified | SP 800-207 §2.1 |
| 37 | PE, PA, PEP roles | SP 800-207 | verified | SP 800-207 §3 |
| 38 | "Not all enterprise resources are on enterprise-owned infrastructure"; consistent policy and posture moving to non-enterprise cloud | SP 800-207 | verified | SP 800-207 §2.2 assumptions 4 and 6 |
| 39 | "Incomplete knowledge will most often lead to a business process failure..." | SP 800-207 | verified | SP 800-207 §7.3 |
| 40 | SP 1800-35 final June 10, 2025; 19 example implementations; 24 collaborators | SP 800-207 | verified | NIST CSRC page |
| 41 | M-22-09 or FedRAMP requires a maturity stage | Cited-but-don't-exist | corrected (claim is false) | M-22-09 §III; ZTMM §5; FedRAMP "Using a FedRAMP Certified Cloud Service" |
| 42 | ZTMM requires certificate-based authentication | Cited-but-don't-exist | corrected (claim is false) | ZTMM Table 2 |
| 43 | "M-22-09 §4" | Cited-but-don't-exist | corrected (no such section; structure is I, II, III with §III.A to §III.F) | M-22-09 |
| 44 | A federal Zero Trust score exists | Cited-but-don't-exist | corrected (no document defines one) | ZTMM; M-22-09 |
| 45 | M-22-09 requires ScubaGear | Cited-but-don't-exist | corrected (the requirement is BOD 25-01's) | BOD 25-01 required actions |
| 46 | SP 800-207 makes the policy decision "infrastructure-agnostic" (source whitepaper phrasing) | Cited-but-don't-exist | corrected (800-207's wording is "technology agnostic" tenets plus consistent policy across infrastructure) | SP 800-207 §2.1, §2.2 |
| 47 | M-21-31 EL tiers still govern | Cited-but-don't-exist | corrected | M-26-14 |
| 48 | Design contract items 1 to 6 | Design contract | restated-as-design | Source spec contract requirements and integration shape |
| 49 | Contract closes access control, continuous monitoring, incident response controls (AC, CA-7, SI-4, IR-4) | Design contract | restated-as-design (control identifiers verified in OSCAL 5.2.0) | Source spec "Control mapping"; SP 800-53 Rev. 5.2.0 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Title and subtitle ("Cross-adapter contract for zero-trust implementation") | Ch03 "The design contract the program takes from the mandates" | "Adapter" and "substrate" vocabulary dropped as internal jargon; the idea (a contract every book applies) is kept |
| Opening sentence ("substrate contract for identity-anchored zero-trust execution across incumbent controls") | Ch03 design contract, introduction and item 6 | — |
| Contract requirements: claims anchored to a verified identity | Design contract item 1 | — |
| Contract requirements: bindings untrusted by default; cryptographic proof, independent corroboration or governance authorization | Design contract item 1 | Merged with the previous item |
| Contract requirements: identity necessary, not sufficient; continuous evaluation of multiple signals | Design contract item 2, tied to SP 800-207 tenets and M-22-09 device signal | — |
| Contract requirements: privileged identity needs its own controls | Design contract item 3; link to Book 04 | — |
| Contract requirements: continuous evidence is a governance property, not a tool feature | Design contract item 4; link to Ch10 | — |
| Contract requirements: governance must enforce, not only observe | Design contract item 5; link to Ch02 | — |
| Integration shape (sits above running systems; normalizes identity-linked signals; no rip-and-replace) | Design contract item 6 | — |
| Control mapping (access control, continuous monitoring, incident response; regenerable identity-anchored evaluation) | Design contract closing paragraph; Appendix A controls table | — |
| Footer ("Cleaned extraction for project use...") | — | Provenance note, not content |

## Source watch, October 26, 2026

Re-checked after the weekly source watch (issue #160) reported a change in a cited source. Checked October 26, 2026; no personal data sent to any site.

| Finding | Change |
|---|---|
| OMB memoranda index now runs to M-27-01 (Oct 23, 2026, not related to this chapter) | `c03-omb-index` updated |
