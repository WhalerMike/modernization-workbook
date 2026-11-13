# Verification — Chapter 04, GCC and the Commercial Feature Gap

Writer W2. All sources opened October 21, 2026. Microsoft facts checked with the Microsoft Learn MCP tools (search and fetch). Marketplace facts read from <https://www.fedramp.gov/marketplace/products.json> (dataset last changed 2026-10-21T05:02Z) by parsing the MSO365MT and MSO365MTA records.

Source: `docs/whitepapers/fedramp-20x-and-the-commercial-feature-gap.md`, §2, §3, §5 and the naming items of §6.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | GCC has no separate endpoint list; served by "Microsoft 365 Worldwide (+GCC)" | What GCC is | verified | Learn, "Microsoft 365 URLs and IP address ranges" (the same page Book 09 Ch12 cites as [^c12-ww]); source changed Nov 13, 2026 |
| 2 | GCC pairs with Azure Commercial | What GCC is | corrected | Learn "Cloud feature availability for US Government customers": the pairing is with **Microsoft Entra ID** in Azure. Stated as identity pairing |
| 3 | "Office 365 GCC operates in conjunction with Azure Public Cloud"; support outside the accreditation boundary | What GCC is | verified | Learn, Office 365 GCC service description (added) |
| 4 | Marketplace GCC package description: "M365 GCC leverages Azure Government as the IaaS/PaaS" | What GCC is | verified | products.json MSO365MT `service_description` (added as a counterpoint to #2) |
| 5 | Network connectivity in the admin center not in GCC Moderate (supported in WW and 21Vianet) | What agencies lose | verified | Learn, network connectivity overview note |
| 6 | Commercial tenants receive it at no additional cost | What agencies lose | verified | Learn FAQ: a license that provides admin center access |
| 7 | Assessment 0–100, daily, 80 the healthy baseline; average of TCP latency, download speed, UDP quality | What agencies lose | verified | Learn, "Microsoft 365 network assessment" |
| 8 | Same-city comparison; two-year history | What agencies lose | verified | Learn, network assessment page |
| 9 | Calculated latency improvement against same-city organizations; optimal front doors | What agencies lose | verified | Learn, network connectivity overview |
| 10 | Egress-distance insight (~500 miles / 25 ms) in the admin center | What agencies lose | corrected | The 500-mile / 25 ms insight is in the **network connectivity test tool**, which Learn lists as supported for US Government (GCC). Moved, and the correction stated |
| 11 | TLS-interception alert at "30% or more" of a location's requests | What agencies lose | corrected | Current Learn insights page lists TLS interception detection with no 30% threshold; threshold dropped |
| 12 | Per-provider scoring; types including "Overlay — VPN, Cloud Proxy, SD-WAN, and SASE"; metrics | What agencies lose | verified | Learn, "Network provider details and connectivity attribution" (types ISP, Overlay, Corporate; listed metrics) |
| 13 | Network Provider Index chart, United States only | What agencies lose | verified | Same page (added) |
| 14 | "Seven Adoption Score categories" unavailable | Other exclusions | corrected | Learn: the whole Adoption Score report isn't available in GCC tenants; current categories are five (six with Copilot) |
| 15 | INR not in GCC Moderate | Other exclusions | verified | Learn, informed network routing |
| 16 | Office 365 CDN unavailable in US Government, China and Germany clouds | Other exclusions | verified | Learn, Office 365 CDN Quickstart |
| 17 | Register of 26 rows: 8 vendor-confirmed, 15 inferred, 3 retention-limited | Callout | removed | Internal program register not published in the workbook; replaced with the design rule "cite every row" |
| 18 | Microsoft uses "GCC Moderate" for the environment | A note on names | verified | Learn INR and network connectivity notes |
| 19 | MSO365MT: Certified, Class C, certification date 2014-11-20, authorizations | Pursuing High | corrected | products.json: **100** authorizations (source: 99), 91 agencies listed (source: "roughly ninety"); agency names dropped (the workbook names no agency) |
| 20 | MSO365MTA: In Process, Initial Implementation, Class D, 0 authorizations, identical name; status changes 2026-07-01 and 2026-07-20 | Pursuing High | verified | products.json; added a third event (2026-10-19), the same assessor and the same service description |
| 21 | MSO365MTA is a High certification effort for GCC | Pursuing High | restated-as-design | Kept as a labeled inference; FedRAMP doesn't state it |
| 22 | A class change requires a new assessment | Pursuing High | verified | SCN-CSO-EVA (added; consistent with #21 but doesn't prove it) |
| 23 | Microsoft docs say GCC supports FedRAMP "at a High Impact level" and "FedRAMP High" | Pursuing High | verified | Learn GCC service description; Learn Azure feature availability (added; conflicts with the Class C record) |
| 24 | Agencies may use a package at any security category | Pursuing High | verified | NTC-0004 |
| 25 | A higher class doesn't restore excluded features; the network layer exclusion is documented per environment, with no reference to a certification class | Impact level vs feature | verified (facts) / restated-as-design (conclusion) | #5 |
| 26 | Five practical conclusions | Closing | restated-as-design | Program positions |
| 27 | Review fix, Oct 21, 2026: removed "Earlier program material attributed that egress-distance insight to the admin center" | Network measurement that remains | wording-only | Kept a short clause that the insight comes from the test tool, not the admin center's network connectivity page (a common confusion). Existing [^c04-tool]; no new claim. |
| 28 | Review fix, Oct 21, 2026: removed "Earlier program material counted 'seven Adoption Score categories' as separate gaps" | Adoption Score bullet | wording-only | Body states five scored categories (six with Copilot) and that the whole report is unavailable in GCC, under the existing [^c04-adoption]. No new claim. |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| §2 The mis-diagnosis (table and argument) | Ch04 "What GCC is, in Microsoft's own words" and "The gaps form a list" | Corrected #2; added #3, #4 |
| §3 What agencies verifiably lose (network layer list) | Ch04 "What agencies verifiably lose" | Corrected #10, #11; added #13 |
| §3 eight further signals; CDN | Ch04 bullet list | Corrected #14 |
| §3 callout "Use the confirmed rows" | Ch04 callout "Build the register on documented exclusions only" | Internal register counts removed (#17) |
| §5 Pursuing High (table, fact and inference callout, why it matters, what it doesn't change) | Ch04 "Microsoft is pursuing High for GCC" and "Impact level and feature availability are different axes" | Counts updated; agency names removed |
| §6 "The certified level is Moderate" and naming | Ch04 "A note on names" and the documentation-discrepancy paragraph | FINDING-PGM-006 reference not carried (internal) |
| §6 class-versus-level caution | Ch03 and Ch04 (cite the class) | — |
| §4.1 Inventory the exclusions | Ch04 conclusions 1–2 state the register; the playbook is Ch09 (W4) | Linked to Ch09 |
| §4.2–4.4 | Ch09 (W4) | ExpressRoute used only as the model for asks in Appendix A |

## Diagrams

- `docs/images/diagrams/b10-cloud-boundary/src/ch04-exclusions-both-ways.flow.yaml`
- `docs/images/diagrams/b10-cloud-boundary/src/ch04-three-packages.flow.yaml`

## Learn gaps, November 9, 2026

New section "A worked case: Global Secure Access's network and privacy facts". Microsoft Learn pages read Nov 9, 2026.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| GSA-1 | GCC availability sentence (quoted) | Worked case | verified | Microsoft Learn "Known Limitations for Global Secure Access", read Nov 9, 2026 |
| GSA-2 | Same locations, Microsoft datacenters (quoted); North America list of commercial regions, no Azure Government; no dedicated or static IPs (quoted); anycast ingress | Worked case | verified | Microsoft Learn "Global Secure Access points of presence and IP addresses", read Nov 9, 2026 |
| GSA-3 | No Azure Government region in the remote network list | Worked case | verified | Microsoft Learn "Global Secure Access remote network configurations", read Nov 9, 2026 |
| GSA-4 | GCC traffic handled in commercial regions | Worked case | restated-as-design | inference, labeled in the text |
| GSA-5 | Egress ranges 128.94.0.0/19 and 151.206.0.0/16 | Worked case | verified | Microsoft Learn "Global Secure Access egress IP ranges", read Nov 9, 2026 |
| GSA-6 | Enriched logs subset, 24 hours, processing in the US or Europe (quoted) | Worked case | verified | Microsoft Learn "Microsoft Entra Private Access and Microsoft Entra Internet Access data storage and privacy", read Nov 9, 2026 |
| GSA-7 | Traffic and remote network health logs 30 days | Worked case | verified | Microsoft Learn "Global Secure Access logs and monitoring", read Nov 9, 2026 |
| GSA-8 | FedRAMP High; environment not stated | Worked case | verified | Microsoft Learn "Global Secure Access Certifications", read Nov 9, 2026 |
| GSA-9 | Connector TLS 1.2 and 1.3, default Windows ciphers; CBC and RSA suites marked weak | Worked case | verified | Microsoft Learn "Ciphers for Microsoft Entra Private Access", read Nov 9, 2026 |
