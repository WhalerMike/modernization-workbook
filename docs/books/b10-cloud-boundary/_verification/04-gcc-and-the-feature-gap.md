# Verification — Chapter 04, GCC, GCC High and the Commercial Feature Gap

Writer W2. All sources opened October 21, 2026. Microsoft facts checked with the Microsoft Learn MCP tools (search and fetch). Marketplace facts read from <https://www.fedramp.gov/marketplace/products.json> (dataset last changed 2026-10-21T05:02Z) by parsing the MSO365MT, MSO365MTA and FR1824057433 records.

Source: `docs/whitepapers/fedramp-20x-and-the-commercial-feature-gap.md`, §2, §3, §5 and the naming items of §6.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | GCC has no separate endpoint list; served by "Worldwide (including GCC)" | What GCC is | verified | Learn, GCC High endpoints page navigation |
| 2 | GCC pairs with Azure Commercial; GCC High and DoD with Azure Government | What GCC is | corrected | Learn "Cloud feature availability for US Government customers": the pairing is with **Microsoft Entra ID** in Azure or Azure Government. Stated as identity pairing |
| 3 | "Office 365 GCC operates in conjunction with Azure Public Cloud"; support outside the accreditation boundary | What GCC is | verified | Learn, Office 365 GCC service description (added) |
| 4 | "Secure enclave" framing applied to GCC High and DoD explicitly | What GCC is | corrected | Phrase not found on Learn. Replaced with Microsoft's wording: GCC High and DoD have "extra network restrictions on which external endpoints the services are permitted to access," with a three-week allowlist SLA |
| 5 | Marketplace GCC package description: "M365 GCC leverages Azure Government as the IaaS/PaaS" | What GCC is | verified | products.json MSO365MT `service_description` (added as a counterpoint to #2) |
| 6 | Windows release health available in GCC, not GCC High or DoD | What GCC is | verified | Learn, "How to check Windows release health" |
| 7 | Word version history and Excel Office Scripts: GCC yes, GCC High and DoD no | Gaps form a list | verified | Learn, "Office application and feature availability in Government plans" (added examples) |
| 8 | Network connectivity in the admin center not in GCC Moderate, GCC High, DoD (supported in WW and 21Vianet) | What agencies lose | verified | Learn, network connectivity overview note |
| 9 | Commercial tenants receive it at no additional cost | What agencies lose | verified | Learn FAQ: a license that provides admin center access |
| 10 | Assessment 0–100, daily, 80 the healthy baseline; average of TCP latency, download speed, UDP quality | What agencies lose | verified | Learn, "Microsoft 365 network assessment" |
| 11 | Same-city comparison; two-year history | What agencies lose | verified | Learn, network assessment page |
| 12 | Calculated latency improvement against same-city organizations; optimal front doors | What agencies lose | verified | Learn, network connectivity overview |
| 13 | Egress-distance insight (~500 miles / 25 ms) in the admin center | What agencies lose | corrected | The 500-mile / 25 ms insight is in the **network connectivity test tool**, which Learn lists as supported for US Government (GCC). Moved, and the correction stated |
| 14 | TLS-interception alert at "30% or more" of a location's requests | What agencies lose | corrected | Current Learn insights page lists TLS interception detection with no 30% threshold; threshold dropped |
| 15 | Per-provider scoring; types including "Overlay — VPN, Cloud Proxy, SD-WAN, and SASE"; metrics | What agencies lose | verified | Learn, "Network provider details and connectivity attribution" (types ISP, Overlay, Corporate; listed metrics) |
| 16 | Network Provider Index chart, United States only | What agencies lose | verified | Same page (added) |
| 17 | "Seven Adoption Score categories" unavailable | Other exclusions | corrected | Learn: the whole Adoption Score report "isn't available in GCC High, GCC, and DOD tenants"; current categories are five (six with Copilot) |
| 18 | INR not in GCC Moderate, GCC High, DoD, Germany, China | Other exclusions | verified | Learn, informed network routing |
| 19 | Office 365 CDN unavailable in US Government, China and Germany clouds | Other exclusions | verified | Learn, Office 365 CDN Quickstart |
| 20 | Register of 26 rows: 8 vendor-confirmed, 15 inferred, 3 retention-limited | Callout | removed | Internal program register not published in the workbook; replaced with the design rule "cite every row" |
| 21 | Microsoft uses "GCC Moderate" for the environment | A note on names | verified | Learn INR and network connectivity notes |
| 22 | MSO365MT: Certified, Class C, certification date 2014-11-20, authorizations | Pursuing High | corrected | products.json: **100** authorizations (source: 99), 91 agencies listed (source: "roughly ninety"); agency names dropped (the workbook names no agency) |
| 23 | MSO365MTA: In Process, Initial Implementation, Class D, 0 authorizations, identical name; status changes 2026-07-01 and 2026-07-20 | Pursuing High | verified | products.json; added a third event (2026-10-19), the same assessor and the same service description |
| 24 | FR1824057433: GCC High, Certified 2024-12-26, 5 authorizations, Class D | Pursuing High | verified | products.json |
| 25 | MSO365MTA is a High certification effort for GCC | Pursuing High | restated-as-design | Kept as a labeled inference; FedRAMP doesn't state it |
| 26 | A class change requires a new assessment | Pursuing High | verified | SCN-CSO-EVA (added; consistent with #25 but doesn't prove it) |
| 27 | Microsoft docs say GCC supports FedRAMP "at a High Impact level" and "FedRAMP High" | Pursuing High | verified | Learn GCC service description; Learn Azure feature availability (added; conflicts with the Class C record) |
| 28 | Agencies may use a package at any security category | Pursuing High | verified | NTC-0004 |
| 29 | A higher class doesn't restore excluded features; the network layer is absent at Class D in GCC High | Impact level vs feature | verified (facts) / restated-as-design (conclusion) | #8, #24 |
| 30 | Five practical conclusions | Closing | restated-as-design | Program positions |
| 31 | Review fix, Oct 21, 2026: removed "Earlier program material attributed that egress-distance insight to the admin center" | Network measurement that remains | wording-only | Kept a short clause that the insight comes from the test tool, not the admin center's network connectivity page (a common confusion). Existing [^c04-tool]; no new claim. |
| 32 | Review fix, Oct 21, 2026: removed "Earlier program material counted 'seven Adoption Score categories' as separate gaps" | Adoption Score bullet | wording-only | Body states five scored categories (six with Copilot) and that the whole report is unavailable in GCC, under the existing [^c04-adoption]. No new claim. |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| §2 The mis-diagnosis (table and argument) | Ch04 "What GCC is, in Microsoft's own words" and "The gaps form a list, not a ladder" | Corrected #2, #4; added #3, #5, #7 |
| §3 What agencies verifiably lose (network layer list) | Ch04 "What agencies verifiably lose" | Corrected #13, #14; added #16 |
| §3 eight further signals; CDN | Ch04 bullet list | Corrected #17 |
| §3 callout "Use the confirmed rows" | Ch04 callout "Build the register on documented exclusions only" | Internal register counts removed (#20) |
| §5 Pursuing High (table, fact and inference callout, why it matters, what it doesn't change) | Ch04 "Microsoft is pursuing High for GCC" and "Impact level and feature availability are different axes" | Counts updated; agency names removed |
| §6 "The certified level is Moderate" and naming | Ch04 "A note on names" and the documentation-discrepancy paragraph | FINDING-PGM-006 reference not carried (internal) |
| §6 class-versus-level caution | Ch03 and Ch04 (cite the class) | — |
| §4.1 Inventory the exclusions | Ch04 conclusions 1–2 state the register; the playbook is Ch09 (W4) | Linked to Ch09 |
| §4.2–4.4 | Ch09 (W4) | ExpressRoute used only as the model for asks in Appendix A |

## Diagrams

- `docs/images/diagrams/b10-cloud-boundary/src/ch04-exclusions-both-ways.flow.yaml`
- `docs/images/diagrams/b10-cloud-boundary/src/ch04-three-packages.flow.yaml`
