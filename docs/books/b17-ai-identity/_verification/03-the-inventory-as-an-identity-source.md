# Verification — Chapter 03, The AI Use-Case Inventory as an Identity Source

Checked October 21, 2026 by writer W2. Sources: `docs/operational-guides/ai-identity-governance/index.md` (540 words) and `docs/whitepapers/federal-ai-governance-submission-readiness.md` (1,750 words), both archived after the book is built and not linked. Federal facts from the M-25-21 PDF on whitehouse.gov (downloaded and text-extracted), the OMB memoranda index on whitehouse.gov, and OMB's `ombegov` GitHub organization: the 2025 repository's README, `Validation/data_dictionary.md`, the reporting guidance PDF in `Reporting Instructions/`, and both data files, downloaded and parsed with Python (`utf-8-sig`); counts were computed from the files and are labeled as computed. The 2024 repository README for the prior-year total. NIST control text from the SP 800-53 Rev. 5 OSCAL catalog, release 5.2.0. Microsoft facts from Microsoft Learn via the MCP fetch and search tools. `ai.gov` was checked for an inventory page: it redirects to another White House site and carries no inventory link, so GitHub is the primary source. The PowerShell snippet uses only `Import-Csv`, `Where-Object`, `Select-Object` and `Group-Object`; it wasn't run against an agency file. No personal data was sent to any site, and no contact addresses from the inventory are reproduced; only aggregate counts are reported.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-25-21: annual inventory, submit to OMB, post publicly; DoD and IC excepted; OMB to issue instructions | Opening | verified | M-25-21 §3(b)(v) |
| 2 | 2025 guidance cites Advancing American AI Act, EO 13960, M-25-21 | What the inventory is | verified | OMB 2025 guidance, intro |
| 3 | Individually reported: all stages, standalone or embedded, agency or third party; err toward inclusion | What the inventory is | verified | Guidance §1(a)(ii) |
| 4 | Consolidated COTS reporting: 20 tasks; examples; high-impact not eligible | What the inventory is | verified | Guidance §1(a)(i); repository README |
| 5 | Exclusions: NSS/IC, basic and applied research with three exceptions | What the inventory is | verified | Guidance §1(a)(iii) |
| 6 | Withholding rules; not public-facing isn't a reason | What the inventory is | verified | Guidance §1(b)(i) |
| 7 | Deadlines Dec 22, 2025 (OMB) and Jan 28, 2026 (public CSV at /ai) | What the inventory is | verified | Guidance §1(a)(ii), §1(b), §4 |
| 8 | Repository summary as of Apr 13, 2026: 56 submissions, 41 individual, 3,611 use cases, 1,818 deployed and piloted, 445 high-impact | What the inventory is | verified (new) | 2025 repository README |
| 9 | 2024 inventory: 2,133 use cases | What the inventory is | verified (new) | 2024 repository README (as of Jan 23, 2025) |
| 10 | Last repository update May 2026; no 2026 repository; no newer AI memo replacing the inventory | What the inventory is | verified (new) | GitHub API commit list and org repo list; OMB memoranda index through M-26-19 |
| 11 | Source: "over 1,800 AI systems … deployed" | About "over 1,800" callout | corrected | The published figure is 1,818 deployed and piloted *use cases* (README); use cases aren't systems |
| 12 | Data dictionary: 36 columns, two added by OMB; requirements by stage and impact | What it records | verified (new) | data_dictionary.md; guidance §5 |
| 13 | Field-group table and "required for" column | What it records | verified | data_dictionary.md, per-field "Required" text |
| 14 | COTS file fields; 45 agencies × 20 tasks = 900 rows; 468 yes | What it records | verified (computed) | 2025_consolidated_COTS_AI_use_cases.csv |
| 15 | `id` stable year to year; retired IDs not repeated | Anchors | verified | data_dictionary.md #3; guidance fn 8 |
| 16 | IA-4 prevents identifier reuse; covers service identifiers | Anchors | verified | OSCAL 5.2.0, IA-4 |
| 17 | `agency_bureau` = responsible organization, free text | Anchors | verified | data_dictionary.md #5 |
| 18 | `development_stage` values; retired reported once | Anchors | verified | data_dictionary.md #8; guidance fn 8 |
| 19 | Retired = leaver event | Anchors | restated-as-design | Program reading |
| 20 | `contact_email` = individual or team; may be replaced publicly | Leads | verified | data_dictionary.md #6; guidance §1(b)(i) |
| 21 | 1,115 of 3,611 rows blank contact; 189 distinct addresses | Leads | verified (computed) | Individual CSV |
| 22 | Pilot/deployed with stage: 1,480; 552 vendor-purchased, 387 both | Leads | verified (computed) | Individual CSV |
| 23 | `have_ato` covers own ATO or parent system's; `system_name_ato` per ATO | Leads | verified | data_dictionary.md #19–20 |
| 24 | Pilot/deployed: 681 yes, 596 no, 203 blank; 58 yes with no system name | Leads | verified (computed) | Individual CSV |
| 25 | Agentic AI definition in classification field | Leads | verified | data_dictionary.md #12 |
| 26 | 117 agentic; 38 pilot or deployed | Leads | verified (computed) | Individual CSV |
| 27 | `has_pii` as A-130 PII | Leads | verified | data_dictionary.md #23 |
| 28 | Gaps table: identity facts not in inventory | Gaps | verified (absence) / restated-as-design (mapping) | data_dictionary.md lists no such fields; control mapping is program design |
| 29 | Impact assessment requires risk-acceptor signature; accountable officials encouraged | Gaps | verified | M-25-21 §4(b)(ii)(G); fn 21 |
| 30 | AC-2 and CM-8 statements | Gaps | verified | OSCAL 5.2.0 |
| 31 | "Use case" definition | A use case isn't an identity | verified | Guidance §3 |
| 32 | Agencies may drop `id` publicly | A use case isn't an identity | verified | Guidance §1(b)(i) |
| 33 | 704 rows with no id; 15 duplicated ids | A use case isn't an identity | verified (computed) | Individual CSV |
| 34 | Join on the identity side; internal submission as source | A use case isn't an identity | restated-as-design | Program design |
| 35 | Custom security attributes on agent identities; CA targets agents by attribute | A use case isn't an identity | verified | Learn, Conditional Access for agents; Graph agentIdentity v1.0 |
| 36 | Seven minimum practices; independent review inside impact assessment | High-impact fields | verified | M-25-21 §4(b)(i)–(vii), §4(b)(ii)(F) |
| 37 | 365 days to document; discontinue non-compliant AI | High-impact fields | verified | M-25-21 §4(a)(i) |
| 38 | Source: "six `hi_*` fields cannot evidence all seven … training and public feedback have no inventory field at all" | Correction callout | corrected | 2025 data dictionary has nine `hi_*` fields including `hi_training_established` (4(b)(iv)) and `hi_public_consultation` (4(b)(vii)); the source read an older schema. Point restated: every practice has a status field, none is evidence |
| 39 | `hi_*` values: Yes / In-progress / CAIO waived; N/A and precluded options | High-impact fields | verified | data_dictionary.md #28–36 |
| 40 | Status isn't evidence; attestation vs evidence | High-impact fields | restated-as-design | Links Book 13, Book 12 Ch02 |
| 41 | Monitoring quote (changes after deployment, context of use) | High-impact fields | verified | M-25-21 §4(b)(iii) |
| 42 | Training quote (operators interpret and act on output) | High-impact fields | verified | M-25-21 §4(b)(iv) |
| 43 | Fail-safe = ability to disable the identity | High-impact fields | restated-as-design | Program reading of §4(b)(v) |
| 44 | 227 high-impact deployed; 101 no answers; in-progress outnumbers yes; testing 81 vs 44 | High-impact fields | verified (computed) | Individual CSV |
| 45 | Agencies told to update inventory after Dec 2, 2025 for the Apr 3, 2026 deadline | High-impact fields | verified | Guidance §1(b) |
| 46 | Pilot exemption conditions; CAIO waivers, 30-day report, annual re-certification | High-impact fields | verified | M-25-21 §4(a)(i)–(iii) |
| 47 | Pilot identity's review date = certification end | High-impact fields | restated-as-design | Program design |
| 48 | No AI-specific ATO; follow A-130; risk acceptance separate; update authorization processes | Authorization | verified | M-25-21 fn 29, fn 22, fn 11 |
| 49 | Source: `have_ato = No` is a drift finding; registry mismatch is reciprocity lookup | Authorization | restated-as-design | Kept as program finding against agency policy; "reciprocity" registry language dropped |
| 50 | Seed-list method and finding types | Seed list | restated-as-design | Source "six identity governance gaps", made explicit; internal drift-class code translated |
| 51 | Exclusions and withheld AI not visible | What it can't see | verified | Guidance §1(a)(iii), §1(b)(i) |
| 52 | COTS aggregate records no instances | What it can't see | verified | COTS CSV columns |
| 53 | Shadow AI not in inventory | What it can't see | restated-as-design | Links Ch07 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| index.md, opening ("over 1,800 AI systems … almost none governed") | Ch03 callout About "over 1,800" | Number corrected to 1,818 use cases with source; "almost none governed" is unverifiable and left to Ch01's argument |
| index.md, two paths (manual / governed) | — | Program-path framing belongs to Ch09 (W5) |
| index.md, Download kit callout (`Invoke-AIInventoryScan.ps1`) | Ch03 "Using the inventory as the seed list" (method only; illustrative snippet) | Script isn't in the repository; described as method per brief; full scan in Ch09 |
| index.md, "The problem this kit solves" (no identity fields in inventory) | Ch03 Gaps | Kept and made concrete against the 2025 dictionary; "OMB 2025 inventory" schema confirmed |
| index.md, What the kit does (four phases) | Ch03 seed-list steps 1–4 | Re-expressed as method; registry and drift-class wording dropped |
| index.md, Who this is for | — | Audience framing; not carried |
| index.md, Background reading (internal specs, drift code) | Ch03 seed-list finding list | Drift-class code translated to "an agentic AI system with no governed identity"; internal IDs dropped |
| index.md, Deployment options (adapter slot) | — | Internal engine detail; not carried per brief |
| whitepaper, Problem/solution/ask box | — | Competitive framing (submission, Keycloak demo, vendor carve-out); dropped per brief |
| whitepaper, Purpose | — | Solicitation framing; dropped |
| whitepaper, What M-25-21 actually requires (seven practices, inventory, compliance plans, CAIO) | Ch03 high-impact section (practices, inventory); Ch02 (W1) for plans and CAIO | Practices and dates re-verified on the memo |
| whitepaper, "does not impose an AI-specific ATO"; `have_ato` reports posture | Ch03 Authorization | Verified against fn 22 and fn 29 |
| whitepaper, Companion memoranda callout (M-25-22, M-26-04) | — | Ch02 (W1) |
| whitepaper, Differentiator re-based (fields as IAM obligations: `contact_email` owner anchor, `agency_bureau` node, `have_ato`/`system_name_ato`) | Ch03 Anchors and Leads | `contact_email` downgraded from anchor to lead after checking the public-inquiry rule and the data |
| whitepaper, "six `hi_*` fields cannot evidence all seven" | Ch03 correction callout and high-impact section | Corrected: nine fields cover all seven; the evidence point is kept |
| whitepaper, figure 01 coverage ledger | — | Product coverage ledger; dropped per brief |
| whitepaper, Coverage ledger table | — | Dropped per brief (deployed-vs-proposed product ledger) |
| whitepaper, SSOT Registry note (inventory as object class with joiner/mover/leaver) | Ch03 Anchors (stage as lifecycle state) | Internal series reference dropped; idea carried |
| whitepaper, Where we are strong / evaluator gaps | — | Competitive framing; dropped |
| whitepaper, figure 02 and Three moves | — | Win-probability content; dropped |
| whitepaper, Bottom line | — | Competitive framing; dropped |
| whitepaper, References (internal decisions, compliance series) | — | Internal references; not linked |
