# Verification — Chapter 08, Reference Architecture and the Five Critical Decisions

Checked 2026-10-20 against CISA, Microsoft Learn (Learn MCP), AWS documentation, Infoblox documentation and press material, and the FedRAMP Marketplace dataset (`products.json`, last change 2026-10-20).

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Internet-bound recursion through CISA Protective DNS | Flow | verified (re-opened); added: required for FCEB agencies, blocks/redirects/sinkholes matching queries | c08-cisapdns |
| 2 | Five decisions carry almost all operational risk; each fails silently | Flow | restated-as-design | — |
| 3 | WP 10.2 Decision 1 "redirect-dns must designate the local BloxOne Endpoint" | Decision 1 | corrected (series already had): a loopback agent cannot be a network redirect target; network-addressable agency resolver required | c08-ibxendpoint |
| 4 | Infoblox Endpoint listens on 127.0.0.1:53 (127.0.0.2 on macOS) and forwards over DoT on TCP 443 | Decision 1, vendor questions | verified | c08-ibxendpoint |
| 5 | WP Decision 2 "Umbrella downstream of BloxOne DDI"; chain order | Decision 2 | restated vendor-neutrally (SASE DNS service) as program design | — |
| 6 | Per-cloud forwarding targets: Azure public service zones to Private Resolver inbound | Decision 3 table | verified | c08-azpe |
| 7 | Route 53 private hosted zones forwarded to VPC Resolver inbound endpoints | Decision 3 table | verified | c08-r53 |
| 8 | Google Cloud private zones via inbound server policy entry points | Decision 3 table | verified in Ch07 (c07-gcpserver); cross-referenced | Ch07 |
| 9 | WP 7.2 example "queries for `*.compute.internal` to the GCP Cloud DNS resolver" | — | removed: misattributed example namespace, not needed | — |
| 10 | WP Decision 3 "rules maintained only in NIOS leave BloxOne Endpoint branches without private resolution" | Decision 3 | restated vendor-neutrally as design | — |
| 11 | Decision 4 irreversible to skip | Decision 4 | restated-as-design (logical consequence) | Ch04 |
| 12 | Decision 5 OCSP/CRL names private-only in AD DNS must be published in the policy plane | Decision 5 | restated-as-design | Ch06 |
| 13 | "How to check" items for each decision | Decisions 1–5 | restated-as-design (from WP Call to Action) | — |
| 14 | WP 7.2 NIOS grid: authoritative and recursive, RPZ, DNSSEC, members serve from local copy | Policy-plane components | restated generically as design | — |
| 15 | WP 7.2 propagation physics "about 5 ms per 1,000 km; 25–30 ms coast to coast; changes propagate within seconds" | Policy-plane components | restated-as-design without figures (not re-verified; vendor convergence claim unsourced) | — |
| 16 | WP 7.4 overlay management: Universal DDI does not replace per-CSP DNS | Policy-plane components | restated-as-design (architecture characterization) | — |
| 17 | Universal DDI formerly BloxOne DDI; manages records in Route 53, Azure DNS, Google Cloud DNS; Windows Server DNS and DHCP; Cloudflare and Akamai | Policy-plane components | verified (vendor) | c08-ibxrelease |
| 18 | WP 7.4 table "Microsoft Windows Server DNS: agent-based"; April 2026 release items (SASE integration, split ranges, Trinzic X6) | — | removed: integration type and April 2026 items not re-verified; not needed for the argument | — |
| 19 | Infoblox Government Cloud: FedRAMP Certified, Moderate, FR2017257053, since 2022-12-15, AWS GovCloud (US); listed scope includes Universal DDI and Universal Asset Insights | Policy-plane components, comparison table | verified (Marketplace dataset) | c08-fedramp |
| 20 | July 22, 2026 announcement adding Universal DDI Management, NIOS-X Servers, Universal Asset Insights to the authorized offering | Policy-plane components | verified (vendor press release) | c08-ibxpr |
| 21 | WP 7.8 "On 2026-07-22 Infoblox Government Cloud achieved FedRAMP Moderate certification" | Policy-plane components | corrected: the offering has been authorized since Dec 2022; July 2026 added services | c08-fedramp, c08-ibxpr |
| 22 | On-premises NIOS is not a FedRAMP cloud service; sits inside agency boundary | Policy-plane components | restated-as-design (consistent with Ch03, Book 02 Ch04) | Ch03 |
| 23 | Target operating model; expected improvements | Unified control plane | restated-as-design (series text kept) | — |
| 24 | WP 10.3 "Infoblox Universal DDI: Full" in GCC High/DoD | Comparison table | corrected: Moderate authorization does not cover High; use a High-authorized service or keep the plane in the agency boundary | c08-fedramp, Appendix C |
| 25 | Azure Government private endpoint zone names differ (`usgovcloudapi.net`, `azure.us`) | Comparison table | verified (added) | c08-azpezones |
| 26 | AWS VPC IPAM external IPAM not in GovCloud | Comparison table | verified (added) | c08-awsipam |
| 27 | INR Worldwide commercial only; not GCC-Moderate, GCC High, DoD | Comparison table | verified (WP 10.3 column header grouped GCC-Moderate with the federal clouds correctly for INR; table re-cut by authorization level) | c08-inr |
| 28 | WP 9.2 M365 optimization via direct breakout and application-aware routing | Comparison table | cross-referenced to Ch05, not re-stated | Ch05 |
| 29 | WP Appendix B open questions Q1–Q6 | Questions to settle with vendors | carried, vendor-neutral; Q1 status updated with verified Endpoint behavior; Q2 status updated (limits published, private-endpoint effect not) | c08-ibxendpoint, Ch07 |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch08 — The End-to-End Resolution Flow and Five Decisions | The end-to-end resolution flow and five decisions | Each decision now its own subsection with a check |
| Series Ch08 — Moving from Per-Cloud Local Syncs (intro) | Moving from per-cloud local syncs | — |
| Series Ch08 — Target Operating Model | Target operating model | Book 02 link added |
| Series Ch08 — Expected Improvements | Expected improvements | — |
| Series Ch08 — What this chapter establishes | Callout | Items 2–3 extended; item 4 added |
| Series Ch08 — Download callout, Previous/Next lines | — | Removed per brief; Continue the book callout points to Ch09 |
| WP Part 7.1 — What DDI is | — | Duplicate of Ch01 (Hybrid cloud IPAM and DHCP) |
| WP Part 7.2 — Infoblox NIOS: on-premises DDI | What a DDI policy plane is made of | Generalized; physics figures and `*.compute.internal` example dropped (rows 9, 15) |
| WP Part 7.3 — DHCP: the full governance surface | — | Ch05 (rogue DHCP) and Ch11 scope |
| WP Part 7.4 — Universal DDI: the SaaS management plane | What a DDI policy plane is made of | Integration table reduced to verified items (rows 17–18); Azure limits in Ch07; BloxOne Endpoint and CSP console material not carried (endpoint behavior in Decision 1; delegation in Ch11) |
| WP Part 7.5 — Platform services and ecosystem | — | Appendix A (ecosystem integrations) and Ch11 (automation) |
| WP Part 7.6 — Threat Defense | — | Ch05 and Ch11 scope |
| WP Part 7.8 — Why agencies need to get ahead now | Authorization paragraph only | Drivers are in Ch01 and Ch03; authorization date corrected (row 21) |
| WP Part 9.1–9.2 — Sovereign cloud gap | Comparison table (INR, M365 optimization rows) | Detail in Ch05 and Appendix C |
| WP Part 10.1 — End-to-end resolution flow | Flow section | — |
| WP Part 10.2 — Five critical configuration decisions | Decisions 1–5 | Vendor-specific targets corrected or generalized (rows 3, 5, 10) |
| WP Part 10.3 — Deployment comparison | Commercial and federal clouds compared | Corrected (row 24); rows added (25, 26) |
| WP Appendix A — Source inventory | Footnotes | Sources re-opened individually where used |
| WP Appendix B — Open questions for vendor engagement | Questions to settle with vendors | Carried (row 29) |
| WP Document status | — | Draft status note; not carried per brief |
| WP Call to Action / Five steps | "Check" bullet under each decision | Merged into decisions |
| Short twin `whitepapers/next-generation-dns.md` — One policy plane; Five configuration decisions | Policy-plane components; decisions | Duplicates; nothing additional |
| Diagram `ch08-reference-architecture` | Kept unchanged | Facts and chapter numbers current |

## Cross-chapter consistency pass (October 21, 2026)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| CP-1 | July 2026 Infoblox release: restated as describing the offering's components; no longer says they "had been added"; footnote explains the date difference | Infoblox example paragraph; c08-ibxpr | corrected | Infoblox press release, July 22, 2026 (opened Oct 21, 2026): headline announces Moderate certification; lists Universal DDI Management, NIOS-X Servers, Universal Asset Insights; gives no certification date, no prior authorization, no Rev5/20x mention. FedRAMP `products.json` (fetched Oct 21, 2026, last_change 2026-10-22T00:15Z), FR2017257053: event log 2020-09-24 Agency In Process, 2022-07-01 FedRAMP In Process, 2022-12-15 FedRAMP Certified; no later status change; cert_class Class C, Moderate |

## Moderate-civilian sweep (October 29, 2026)

The workbook targets FedRAMP Moderate civilian agencies. Configuration authority is the agency's CM-6 settings drawn from civilian sources; DISA STIGs and DoD Impact Levels survive only as optional references labelled *High only*; AWS GovCloud (US) and Azure Government are treated as valid Moderate locations. Facts from the coordinator's verified fact pack (read 2026-10-29) or re-read by this writer on 2026-10-29 as noted.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| MS-1 | AWS US East/West FedRAMP Certified Class C (formerly Moderate); GovCloud (US) Class D (formerly High); scope per service and per Region | Commercial and federal clouds compared, intro | verified 2026-10-29 (fact pack) | c08-aws-fedramp: AWS FedRAMP; Services in Scope |
| MS-2 | Table restructured: Moderate commercial; Moderate GovCloud/Azure Government; GCC High, FedRAMP High and DoD (High only). Previously GovCloud and Azure Government sat in the High column | Comparison table | reframed; every cell's fact unchanged and carried from existing footnotes | c08-fedramp, c08-azpezones, c08-awsipam, c08-inr |
| MS-3 | Infoblox Government Cloud is hosted in AWS GovCloud (US) at Moderate | Comparison table | verified (existing footnote, Oct 20, 2026) | c08-fedramp |
| MS-4 | High only explanation line added | Before the table | label per brief | — |
