# Verification — Chapter 03, What Changed at FedRAMP

Writer W2. All sources opened October 21, 2026. The Consolidated Rules were checked in the machine-readable ruleset `fedramp-consolidated-rules.json` (version 2026.10.13.01, last updated 2026-10-13) downloaded from <https://github.com/FedRAMP/rules>, with counts computed over the whole file, and against the rule pages under <https://www.fedramp.gov/2026/reference/>. Marketplace facts come from <https://www.fedramp.gov/marketplace/products.json> (dataset last changed 2026-10-21T05:02Z).

Source: `docs/whitepapers/fedramp-20x-and-the-commercial-feature-gap.md` (*What Changed at FedRAMP*), §1 and the Rev5 item of §6.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | "FedRAMP Certified"; Certification Class A–D definition | Certification replaces authorization | verified | FedRAMP Definitions page; ruleset FRD |
| 2 | Class B = Li-SaaS/Low, C = Moderate, D = High; no "levels" to avoid DoD IL confusion | Certification replaces authorization | verified | NTC-0004 (Feb 25, 2026) |
| 3 | Agencies may use a package "at any security category they deem appropriate" | Certification replaces authorization | verified | NTC-0004 |
| 4 | MSO365MT listed FedRAMP Certified, Class C (Moderate) | Certification replaces authorization | verified | products.json |
| 5 | "Each agency still authorizes its own federal information systems"; no standalone ATO for a CSO; AO accepts risk of data, settings, integrations, agency controls | Certification replaces authorization | verified | fedramp.gov/2026/agencies/use/ |
| 6 | Timeline dates (Jul 4, Jul 6, Jan 1 2027, Jun 11 2027); Jun 11 2027 the only Rev5 date on the timeline page | Certification replaces authorization | verified | fedramp.gov/2026/timeline/ |
| 7 | Existing Rev5 end date "not finalized ... likely no later than 2029" | Certification replaces authorization; Rev5 section | verified | NTC-0013 (Jun 16, 2026) |
| 8 | "Authorization boundary" occurs zero times in the rules | No provider authorization boundary | verified | Ruleset JSON, whole-file count (version 2026.10.13.01) |
| 9 | "Boundary" occurs 8 times: 3 agency boundary, 4 tags, 1 supply chain | No provider authorization boundary | corrected | Ruleset JSON. Source attributed the supply-chain occurrence to SR-08; it is SR-03 guidance. Agency rules named: AGU-USE-ROR, CCM-AGM-ROR, CCM-AGM-CSC |
| 10 | Four families tagged `boundary` | No provider authorization boundary | corrected | Ruleset JSON `info.tag`. Source listed MAS, UCM, VDR, CDS; the published family is CMU (Cryptographic Module Use), not UCM |
| 11 | CMU force by class (MAY A/B, SHOULD C, MUST D) | No provider authorization boundary | verified | CMU-CSO-UVM |
| 12 | NIST authorization boundary definition (from OMB A-130) | No provider authorization boundary | verified | CSRC glossary, "authorization boundary" |
| 13 | MAS-CSO-IIR statement quoted | Minimum Assessment Scope | verified | MAS page and ruleset |
| 14 | MAS-CSO-FLO note "MAY vary by security category" | Minimum Assessment Scope | verified | MAS page and ruleset |
| 15 | MAS-CSO-TPR, -MDI, -SUP content | Minimum Assessment Scope | verified | MAS page and ruleset |
| 16 | MAS applies to Classes B–D; machine-readable output plus generating code | Minimum Assessment Scope | verified | MAS family applicability and artifacts |
| 17 | Metadata rule "tightened between the RFC-0005 draft and the published rule" | (source §1.2) | removed | Not checked against RFC-0005 text; dropped as non-essential |
| 18 | Agents and clients not operated in a shared-responsibility model are entirely outside FedRAMP | Minimum Assessment Scope | verified | MAS-CSO-IIR note. The rule text says "FedRAMP Certification Act"; the chapter doesn't name the statute (FedRAMP's scope page calls it the FedRAMP Authorization Act) |
| 19 | M-24-15 scope definition; "only a federal agency can determine..." | Minimum Assessment Scope | verified | fedramp.gov/2026/scope/ |
| 20 | An agent the agency installs and operates must be covered by the agency's own authorization | Minimum Assessment Scope | restated-as-design | Program inference from #18 |
| 21 | CDS-CSO-SVC public service list; CDS-CSO-PUB human-readable and JSON | Scope visible without asking | verified | CDS page and ruleset (added; not in source) |
| 22 | SCN evaluation order, including class change needs a new assessment | Change control | verified | SCN-CSO-EVA |
| 23 | Routine recurring exempt ("SHOULD NOT" notify); examples | Change control | verified | SCN-RTR-NNR and its examples |
| 24 | Adaptive: within 10 business days after | Change control | verified | SCN-ADP-NTF |
| 25 | Transformative: 30 and 10 business days before; 5 after finishing; 5 after verification; documentation within 30 business days | Change control | corrected | SCN-TRF-NIP/NFP/NAF/NAV/UPD. Source said "30 days before plans"; the rule says 30 business days. Added UPD |
| 26 | Emergency changes may go first, notified retroactively | Change control | verified | SCN-CSO-EMG |
| 27 | Human-readable and JSON notifications; 12 months of history | Change control | verified | SCN-CSO-HRM, SCN-CSO-HIS |
| 28 | Agencies MUST review each Ongoing Certification Report | Change control | verified | CCM-AGM-ROR |
| 29 | Providers MUST use a FedRAMP-compatible trust center; "complete and definitive source" | Certification data | verified | CDS-CSO-UTC; FRD "Trust Center" |
| 30 | TRC rules: uninterrupted, JIT preferred, programmatic access mandatory, inventory, six-month logs, HMR, self-service | Certification data | verified | CDS-TRC-USH/PAC/AAI/ACL/HMR/SSM |
| 31 | UTC subset applies to providers using a trust center instead of USDA Connect; 5-day denial notice | Certification data | verified | CDS UTC subset description; CDS-UTC-AAD |
| 32 | 110 of 781 Marketplace listings carry a trust_center value | Certification data | verified | products.json, computed |
| 33 | Boundary families and SCN list both 20x and Rev5 applicability | Rev5 side by side | verified | Ruleset `subsets.*.applicability.types` |
| 34 | Rev5 rulesets published for 15 families including MAS and SCN, Classes B–D | Rev5 side by side | verified | fedramp.gov/2026/reference/rev5/ |
| 35 | "FedRAMP 20x has no authorization boundary" (source framing) | Throughout | corrected | The absence is in the Consolidated Rules, which cover Rev5 as well as 20x; restated as "the rules have no provider authorization boundary" |
| 36 | Rev5 certifications "remain valid to at least 2028-12-31" | Rev5 side by side | corrected | Not in NTC-0013; replaced with the notice's wording (also settled in Book 09 Ch03) |
| 37 | The single-level habit is the origin of "we can't have that" reasoning | Security category per resource | restated-as-design | Author's analysis, presented as such |
| 38 | Five working conclusions | What changes for the agency | restated-as-design | Program positions |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Problem / solution / ask box | — | Ch01 (W1) frames the book thesis; the asks are in Appendix A |
| Executive summary | Ch03 opening (boundary point); Ch04 opening (GCC point and the High package) | Ch01 (W1) also draws on it |
| Relationship to existing papers (callout) | — | Internal cross-references to program papers and a register not published in the workbook |
| §1.1 The boundary is not a shape any more | Ch03 "The rules have no provider authorization boundary" | Corrected (SR-03, CMU) |
| §1.2 Minimum Assessment Scope, three provisions | Ch03 "Minimum Assessment Scope" | RFC-0005 remark removed (#17) |
| §1.3 Change control replaces re-authorization | Ch03 "Change control replaces re-authorization" and figure | Corrected business days; added class change and UPD |
| §1.4 Certification data becomes an API | Ch03 "Certification data becomes a feed" | — |
| §6 "Rev 5 and 20x coexist" | Ch03 "Rev5 and the 2026 rules side by side" | Date corrected (#36) |
| §6 certified level, naming, class caution | Ch04 | — |
| §6 Active Directory and synchronized-user items | — | Identity topics outside B10's scope; Book 02 covers them |
| §2, §3, §5 | Ch04 | — |
| §4 | Ch09 (W4); Ch03 "What changes for the agency" gives the rule basis and links Ch09 | — |
| §7 | Appendix A | — |
| References | Footnotes | Internal canon paths and findings not cited in a public workbook |

## Diagrams

- `docs/images/diagrams/b10-cloud-boundary/src/ch03-boundary-as-obligations.flow.yaml`
- `docs/images/diagrams/b10-cloud-boundary/src/ch03-change-classes.flow.yaml`
