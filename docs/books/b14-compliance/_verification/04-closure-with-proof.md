# Verification — Chapter 04, Closure: A Control Closes Only With Its Proof

Writer W2. Source: `docs/compliance/Vol_0_Book_00_Executive_Summary.md`, the closure, provenance, vendor-currency and lifecycle sections (the Closure Necessity section with its SC-8 counter-sources box, Closure Provenance, Vendor Currency, the five-clause lifecycle with its source-of-truth registry, "Mechanism, Not Product", "DIA Is a Pipe", and "What 'Closed' Means Under FedRAMP 20x"). Other sections of that compendium feed Chapters 02 and 12 (other writers).

Method, October 21, 2026: control statements from the NIST OSCAL catalog 5.2.0 and titles from the CSRC CPRT export (see the Chapter 03 verification note on the export file); baselines from NIST OSCAL profiles and FedRAMP's 2026 Rev5 control reference (parsed per control); FedRAMP rules and indicator pages, timeline, Marketplace `products.json`, the FedRAMP/rules GitHub repository; OMB M-25-21 PDF on whitehouse.gov.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | CA-2(d): assess whether controls are "implemented correctly, operating as intended, and producing the desired outcome" | What closed means | verified | OSCAL catalog CA-2 |
| 2 | CA-5: POA&M documents planned remediation; updated from assessments, audits, continuous monitoring | What closed means; controls table | verified | OSCAL catalog CA-5 |
| 3 | Two closure tests | What closed means | restated-as-design | — |
| 4 | Necessity anchors as falsifiable mechanism-class claims | Rule 1 | restated-as-design | — |
| 5 | SC-20 statement (origin and integrity artifacts); CM-8 statement | Anchors table | verified | OSCAL catalog |
| 6 | Source cites SC-20(1) | Anchors table | corrected: withdrawn, incorporated into SC-20 | OSCAL catalog (status withdrawn) |
| 7 | IA-9 a necessity anchor | Anchors table | corrected/qualified: in no NIST baseline; FedRAMP lists no class | NIST profiles; FedRAMP IA page |
| 8 | SC-8(1) asks for cryptographic mechanisms and names no protocol | Anchors table | verified | OSCAL catalog; FedRAMP SC page (no additional FedRAMP guidance) |
| 9 | SC-8 claim is completeness, not exclusivity; other overlays also encrypt | Anchors table | verified against source's own SC-8 box; restated-as-design | Source; Book 09 Ch02 consistent |
| 10 | SC-5 "traffic-class separation" | Anchors table | restated-as-design (SC-5 is denial-of-service protection) | OSCAL catalog SC-5 |
| 11 | SC-7(7) split tunneling statement; AC-4 | Anchors table | verified | OSCAL catalog |
| 12 | Source SC-8 box: FedRAMP July 2023 "Rev. 5 Approach to SC-8" (FIPS-validated, CAA, SC-8(5)) | Anchors | removed: the fedramp.gov page returns 404 (archived; only search snippets seen); not cited. Note: SC-8(5) title is "Protected Distribution System", in no NIST baseline and no FedRAMP class | OSCAL catalog; FedRAMP SC page |
| 13 | Source: M365 TLS, Microsoft connectivity principles, ITU-T G.114 150 ms, DIA three-step argument | Anchors | not carried; linked to Book 09 Ch02 and Ch05, which verified them | Book 09 |
| 14 | TIC 3.0 "commensurate with risk tolerance" | Anchors | not carried; linked to Book 09 Ch05 | — |
| 15 | Mechanism, not product; one path per layer after choice | Mechanism, not product | restated-as-design | — |
| 16 | Closure provenance three requirements; human-only closure exception; reports derived | Rule 2 | restated-as-design; consistent with Book 13 Ch04 | Book 13 Ch04 |
| 17 | Proof is a read; full automation under the actuation cap | Rule 2 | restated-as-design | Book 01 Ch11 linked |
| 18 | "13 of 106 claims carry a named test" | Rule 2 | removed (internal dated count); principle kept | — |
| 19 | Source: under FedRAMP 20x a control is "closed" when evidence is automatic, machine-readable, continuous, validated against the published KSI schema on GitHub | Continuous evidence | corrected: FedRAMP defines no such closure; KSIs bind providers; FedRAMP publishes machine-readable rules (incl. indicators) with schemas on GitHub; four properties restated as program design | FedRAMP providers KSI page; FedRAMP/rules repo |
| 20 | Indicators "aren't one-time requirements"; processes should continuously collect evidence, detect drift, monitor effectiveness, alert on deviations | Continuous evidence | verified | FedRAMP providers KSI page |
| 21 | AGU-AGC-GRC: agency GRC tools produce and ingest OSCAL JSON | Continuous evidence | verified | FedRAMP Agency Use page |
| 22 | Source: "the architectural transition IS the FedRAMP 20x compliance posture"; per-product evidence bullets (InfoBlox WAPI etc.) | Continuous evidence | removed (overclaim; vendor specifics belong to the volumes) | — |
| 23 | Program drafting anecdote (C1Secure SmartRAMP 20x; ServiceNow↔VMware connectors) | Vendor rule | restated generically as program experience; vendor names dropped | — |
| 24 | FedRAMP Ready goes legacy July 28, 2026 | Vendor rule | verified | FedRAMP Important Dates |
| 25 | 53 of 781 Marketplace listings "Legacy FedRAMP Ready" on Oct 21, 2026 | Vendor rule | verified (new) | products.json |
| 26 | Vendor rule's three requirements | Vendor rule | restated-as-design (vendor list generalized) | — |
| 27 | SA-4 statement; NIST L M H; FedRAMP B C D | Vendor rule; controls table | verified (new) | OSCAL catalog; NIST profiles; FedRAMP SA page |
| 28 | Five-clause lifecycle | Rule 4 | verified (in workbook); not restated | Book 13 Ch04; Book 00 Ch04 principle 2 |
| 29 | AC-6 statement; NIST M H; FedRAMP C D | Rule 4; controls table | verified | OSCAL catalog; profiles; FedRAMP AC page |
| 30 | Extended source-of-truth rows (DDI, assets, NHI, AI, applications, certificates, org/location) | Registry | restated-as-design | — |
| 31 | OMB: agencies keep annual AI use case inventory updated; CAIO maintains it | Registry | verified (new) | M-25-21 (April 3, 2025), introduction and CAIO item E; no rescission found by search on Oct 21, 2026 |
| 32 | Human-anchor rule; non-human JML; reset as high-risk verb; orphan finding | Registry | restated-as-design | — |
| 33 | Controls table baselines: CA-2, CA-7, CM-8 L M H / B C D; CA-5 L M H / none; AC-6 M H / C D; SA-4 L M H / B C D; PM-4 none / none | Controls table | verified | NIST profiles; FedRAMP pages (PM-04 no class line checked in page text) |
| 34 | Only the AO accepts residual risk | Honest limits | verified (settled in workbook) | Book 13 Ch09 linked |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| The Closure Necessity Doctrine (intro and Three Necessity Anchors table) | Ch04 "A control closes only when the mechanism that closes it exists" and anchors table | Doctrine name dropped; IA-9 and SC-20(1) corrected |
| Baseline caveat (CR26 dates, validate with OIS) | Ch04 framing (program design, not federal requirement); dates are Chapter 02's | Internal office name dropped |
| The SC-8 Row Against Its Strongest Counter-Sources | Ch04 anchors table, SC-8 row (completeness, not exclusivity; other overlays) | FedRAMP 2023 SC-8 page unreachable (404), not cited; M365/G.114 detail deferred to Book 09 |
| The Closure Provenance Doctrine (three requirements, read-not-write automation, self-measurement) | Ch04 "No closure counts without its proof" and subsections | Internal counts and volume/book identifiers dropped; full statement linked to Book 13 Ch04 |
| The Vendor Currency Doctrine (anecdote, three requirements, caveat) | Ch04 "A vendor roadmap is not a commitment" | Vendor names in anecdote and named-vendor list generalized |
| The MACD-R Lifecycle Doctrine (five clauses) | Ch04 "Every operation travels the authorized path" (linked, not restated) | Already in Book 13 Ch04 |
| The SSOT Registry (table, Human-Anchor Rule, non-human JML) | Ch04 "A source of truth for every object class" (rows Book 13 omitted) and two rules | Employees/contractors/devices/IaC rows already in Book 13 Ch04 |
| Mechanism, Not Product box | Ch04 "Mechanism, not product" | Product list and "Gap Roadmap" companion reference dropped |
| DIA Is a Pipe box | Ch04 one-paragraph pointer to Book 09 Ch02 | Book 09 carries it in full |
| What "Closed" Means Under FedRAMP 20x | Ch04 "What 'closed' means when the evidence is continuous" (corrected) | Per-product evidence bullets and the "IS the posture" claim removed |
| Combined Control Closure Summary and Control Count Comparison (adjacent tables) | — | Chapter 12's scope (series map); internal counts |
