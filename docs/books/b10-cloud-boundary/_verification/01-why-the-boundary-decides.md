# Verification — Chapter 01, Why the Boundary Decides What You Can Use

Checked October 21, 2026 by writer W1. Sources: `docs/case-studies/cloud-boundary-case-study.md`, `docs/case-studies/cloud-boundary.md`, and the Ch01 share of `docs/whitepapers/fedramp-20x-and-the-commercial-feature-gap.md` (*What Changed at FedRAMP*). Microsoft facts via the Microsoft Learn MCP tools (search and fetch); FedRAMP facts from fedramp.gov pages fetched directly and from `products.json` (`meta.last_change` 2026-10-21T05:02:15.637Z, 781 products) downloaded and parsed.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Network connectivity in the M365 admin center not available to GCC Moderate, GCC High, DoD | Catalog; table | verified | MS Learn, Network connectivity in the M365 Admin Center (note) |
| 2 | INR supports WW Commercial only, not GCC Moderate/GCC High/DoD | Catalog; table | verified | MS Learn, informed network routing (note) |
| 3 | Adoption Score not available in GCC, GCC High, DoD | Catalog; table | verified (new) | MS Learn, Microsoft Adoption Score, prerequisites |
| 4 | Each agency "still authorizes its own federal information systems"; never a standalone ATO for a CSO; AO accepts risk of "the configuration selected, the integrations enabled"; "confirm that the planned use is within the scope of FedRAMP ... Certified version"; configure "including identity, logging, monitoring, data protection" | Three checks; decision makers; agency authorization; 2026 section | verified | FedRAMP, Using a FedRAMP Certified Cloud Service |
| 5 | Office 365 CDN not supported in US Government clouds | Decision makers; table | verified | MS Learn, Office 365 CDN Quickstart |
| 6 | Windows release health available in GCC, not GCC High/DoD | Decision makers; table | verified | MS Learn, How to check Windows release health |
| 7 | Office Scripts GCC yes / GCCH, DoD no; Analyze Data and Researcher no in all three | Decision makers; table | verified (new) | MS Learn, Office application and feature availability in Government plans |
| 8 | Marketplace: MSO365MT Class C (Moderate), FedRAMP Certified, cert date 2014-11-20, 100 authorizations | Decision makers; impact-level table | corrected | products.json. Source said 99 authorizations (read Sept 9); now 100. Source's "roughly ninety agencies" and named agency list not carried (agency-agnostic rule) |
| 9 | MSO365MTA same name, Class D (High), FedRAMP In Process, Initial Implementation, 0 authorizations; status events 2026-07-01, 2026-07-20 | Impact-level table | verified, extended | products.json; a third event dated 2026-10-19 ("FedRAMP In Process to FedRAMP In Process") added. The 2026-07-01 event reads "from FedRAMP Certified to Agency Authorization In Process"; not interpreted in the chapter |
| 10 | FR1824057433 GCC-High, Class D, certified 2024-12-26, 5 authorizations | Impact-level table | verified | products.json |
| 11 | MSO365MTA = High effort for GCC is an inference; Marketplace doesn't state the relationship | Impact-level section | restated-as-design (inference labeled) | products.json carries no relationship field |
| 12 | Minimum Assessment Scope: identify resources; categories "MAY vary by security category"; metadata included; agents/app clients not operated in shared responsibility excluded | Decision makers; agency authorization; 2026 section | verified | FedRAMP 20x MAS rules page |
| 13 | 20x rules page doesn't use "authorization boundary" | 2026 section | verified (narrowed) | MAS rules page fetch. Source said the phrase occurs zero times in the whole Consolidated Rules with an 8-occurrence breakdown; that full-corpus count wasn't re-run here and is left to Ch03 |
| 14 | Definitions: CSO "a specific, packaged cloud computing product or service"; Certification Class "increasing from minimal assurance at Class A to significant assurance at Class D" | Certification | verified (new) | FedRAMP Definitions |
| 15 | Azure publishes per-service FedRAMP High scope for Azure public and Azure Government | Certification | verified | MS Learn, services compliance scope |
| 16 | GCC customer support "is not included in the service accreditation boundary"; Viva Engage "does not support FedRAMP accreditation" | Certification | verified (new) | MS Learn, Office 365 GCC service description |
| 17 | GCC paired with Entra ID in Azure; GCC High/DoD with Entra ID in Azure Government | Environment | verified | MS Learn, Cloud feature availability for US Government customers |
| 18 | "GCC is the same instance as Microsoft Intune in the commercial space" | Environment | verified (new) | MS Learn, Intune US Government service description |
| 19 | Microsoft's GCC description says FedRAMP "at a High Impact level" vs Marketplace Class C | Impact-level section | verified (new) | MS Learn, Office 365 GCC; consistent with Book 08 App C treatment |
| 20 | Network connectivity, INR, Adoption Score also unavailable in GCC High/DoD; GCC High already Class D, so a higher class doesn't restore the features | Impact-level section | verified (argument on verified facts) | #1–#3, #10 |
| 21 | Rev5: no new certification requests after June 11, 2027; end date "not finalized but ... likely to be no later than 2029" | 2026 section | corrected | FedRAMP NTC-0013. Whitepaper §6 said Rev5 certifications "remain valid to at least 2028-12-31"; not in FedRAMP's notice, not repeated |
| 22 | Rev5 boundary was a CSP artifact drawn in the SSP | 2026 section | restated-as-design | Program characterization; detail owned by Ch03 |
| 23 | Network-edge framing pattern (model boundary; breakout only where capabilities satisfied at distributed PEP; telemetry obligations continue) | Network edge | restated-as-design | Program framing pattern; TIC detail is Book 09 Ch02/Ch03 |
| 24 | In GCC-Moderate, path selection rests on SD-WAN measurements; monitoring services need own authorization | Network edge | verified (consistent) | Book 09 Ch12 (settled, linked) |
| 25 | GCC engagement archetype: discovered late, SSP references features that don't behave as documented | Shows up late | restated-as-design | Framing pattern, labeled as such in a callout |
| 26 | Three responses (compensate, exception, alternative) | Three responses | restated-as-design | Book argument per `_BRIEF.md` |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| cloud-boundary-case-study — front matter, "Framing pattern, not a fabricated engagement" callout | Ch01 "Where the boundary shows up: late" callout | — |
| cloud-boundary-case-study — image-01 (PNG engagement diagram) | Replaced by `ch01-what-decides.flow.yaml` and Ch02 `ch02-invisible-boundary.flow.yaml` | Old PNG not reused (brief) |
| cloud-boundary-case-study — Engagement archetype | Ch01 "Where the boundary shows up: late" | Its five-feature premise corrected in Ch02 |
| cloud-boundary-case-study — Starting state (typical) | Ch01 "Where the boundary shows up: late" | — |
| cloud-boundary-case-study — Intervention pattern 1–4 (probe, telemetry, enforcement, ATO surface) | Ch02 "Making the boundary visible" | Duplicate of boundary-impact-model; stated once in Ch02; depth in Ch09/Ch11 |
| cloud-boundary-case-study — Substrate behaviors observed (disposition matrix, gap closure %, enforcement coverage, package change, 3PAO byte-identical rerun) | Disposition states (functional/partial/silent/blocked) in Ch02 probe item | Metrics list belongs with package evidence: Ch11 (W4). 3PAO byte-identical rerun is an untested program aspiration; not stated as fact |
| cloud-boundary-case-study — Why this is different from "remediating findings" | Ch01 "Where the boundary shows up: late" (last paragraph) | — |
| cloud-boundary-case-study — Lessons that propagate back into canon | — | Internal canon file paths and ADR process; not reader-facing, and the workbook doesn't name the program's canon files |
| cloud-boundary-case-study — Promotion to "real engagement" | — | Internal process; not carried |
| cloud-boundary-case-study — Related documents | — | Links to archived/unpublished canon; replaced by in-book links |
| cloud-boundary — Starting state | Ch01 "The same pattern at the network edge" | — |
| cloud-boundary — Intervention | Ch01 "The same pattern at the network edge" | Full treatment Book 09 Ch02/Ch03 (linked) |
| cloud-boundary — Observed behavior (intended) | Ch01 "The same pattern at the network edge" | — |
| cloud-boundary — Lessons (three) | Ch01 "The same pattern at the network edge" | — |
| fedramp-20x paper — Problem, solution, ask box | Ch01 case paragraph (reframed for this chapter) | Five asks owned by App A (W2) |
| fedramp-20x paper — Executive summary (no boundary; GCC not a perimeter; High package) | Ch01 three checks, impact-level section, 2026 section | Full argument Ch03/Ch04 (W2) |
| fedramp-20x paper — Relationship to existing papers callout | Ch02 register discussion (8 confirmed of 26) | Internal paper lineage not carried |
| fedramp-20x paper — §1.1 boundary not a shape | Ch01 2026 section (summary) | Occurrence counts owned by Ch03 (W2) |
| fedramp-20x paper — §1.2 MAS and three provisions | Ch01 decision makers, agency authorization, 2026 section (summary) | Detail Ch03 (W2) |
| fedramp-20x paper — §1.3 change control | — | Owned by Ch03 (W2) |
| fedramp-20x paper — §1.4 certification data as API (CDS-TRC) | — | Owned by Ch03/App A (W2) |
| fedramp-20x paper — §2 mis-diagnosis | Ch01 environment section (pairing, per-feature, both directions table) | Endpoint-list and enclave detail owned by Ch04 (W2) |
| fedramp-20x paper — §3 what agencies lose | Ch01 table rows (network connectivity, INR, CDN); Ch02 register | Admin-center feature detail (scores, 500 mi/25 ms, TLS alert, provider ranking) owned by Ch04 (W2) |
| fedramp-20x paper — §4.1 inventory per feature | Ch01 case paragraph and Ask; Ch02 evidence rules | — |
| fedramp-20x paper — §4.2 ExpressRoute exception | Ch01 three responses (pointer) | Owned by Ch09 (W4) |
| fedramp-20x paper — §4.3 scope arguments | Ch01 2026 section (one bullet) | Owned by Ch03/Ch09 |
| fedramp-20x paper — §4.4 buy the capability, not the badge | — | Owned by Ch04/App A (W2) |
| fedramp-20x paper — §5 three packages; what High doesn't change | Ch01 "Impact level and feature availability are different axes" | Counts updated (#8); agency names dropped |
| fedramp-20x paper — §6 Honest limits: Moderate level; "GCC Moderate" naming | Ch01 impact-level section (Marketplace vs service description) | Naming discussion owned by Ch04 (W2) |
| fedramp-20x paper — §6 Microsoft not forcing anyone off AD; synchronized users administered on-premises | — | Identity topics; covered by Book 02/Book 03, not this chapter |
| fedramp-20x paper — §6 Rev 5 and 20x coexist | Ch01 2026 section | Date corrected (#21) |
| fedramp-20x paper — §7 What to ask for | Ch01 links App A | Owned by App A (W2) |
| fedramp-20x paper — References | Footnotes | Internal canon paths not carried |
