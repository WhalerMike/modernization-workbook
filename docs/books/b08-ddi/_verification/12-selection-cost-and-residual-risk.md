# Verification — Chapter 12, Platform Selection, Cost and Residual Risk

Checked October 20, 2026. Series chapter verified and upgraded in place (front matter to `workbook-chapter`,
`lifecycle_review: 2027-04-01`, title and H1 `Chapter 12 — …`, thesis, "In this chapter" and "Continue the book"
callouts, sentence-case headings, Word download callout removed, footnote keys `c11-` → `c12-`). Absorbed: the
whitepaper `docs/whitepapers/infoblox-hybrid-dns-unified-ddi.md` selection, platform, authorization, comparison and
vendor-question sections, and the DNS Modernization Guide cost guidance (§6.3, App. B). Diagram source
`ch12-residual-risks.flow.yaml`: stale "Chapter 11" comment fixed; content unchanged.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Licensing varies by deployment model; staffing goes to operation, sync monitoring, migration | Cost | restated-as-design | Program position |
| 2 | Resolution-path consistency as headline measure | Cost | restated-as-design | Program position |
| 3 | Commercial DDI licensing isn't published; get like-for-like quotes | Cost | restated-as-design | No public price lists found; no prices given |
| 4 | Private Resolver billed per inbound/outbound endpoint per month and per ruleset per month; no instance or query meter | Cost | verified | Azure Retail Prices API (Azure DNS meters); Azure DNS pricing page (units) |
| 5 | Zone 1 list prices: endpoints $180/mo each (eff. 2022-09-01), ruleset $2.50/mo, private zone $0.50/mo first 25 (2019-12-01), private queries $0.40/M, DNS security policy $0.60/M (2025-06-01) | Cost table | verified | Azure Retail Prices API, retrieved Oct 20, 2026 (dated, list price) |
| 6 | Worked example ≈ $362.50/month per region | Cost | verified | Arithmetic on #5 |
| 7 | Same endpoint price in US Gov zone | Cost | verified | Retail Prices API, US Gov Zone 1, $180 (eff. 2024-10-01) |
| 8 | Guide: resolver ~$0.18/hour (~$131/mo), endpoints ~$0.009/hour (~$6.50/mo), queries included, VNet links $0.50 after 2; example totals $144/$159/$327 | Cost callout | corrected | Retail Prices API and pricing page show endpoint-based pricing; no resolver-instance or VNet-link meter listed. Guide figures not carried |
| 9 | AWS VPC IPAM charges per active IP monitored in member accounts | Cost | verified | AWS, Integrate IPAM with accounts in an AWS Organization |
| 10 | Azure DNS security policy blocks known malicious domains (Microsoft threat intelligence) | Cost; comparison | verified | Learn, DNS security and private name resolution (cross-cloud) |
| 11 | Infoblox Government Cloud FR2017257053: FedRAMP Certified, Moderate, since 2022-12-15; SaaS in AWS GovCloud (US); description lists Universal DDI, Universal Asset Insights, TIDE, Dossier | Authorization table | verified | FedRAMP Marketplace products.json (data last changed 2026-10-20) |
| 12 | Whitepaper §7.8: "On 2026-07-22, Infoblox Government Cloud achieved FedRAMP Moderate certification" | Authorization table | corrected | Marketplace: certified since 2022-12-15. The July 22, 2026 vendor press release announced Universal DDI Management, NIOS-X servers and Universal Asset Insights through the authorized service (consistent with Ch 01/03 and Book 02 Ch 04) |
| 13 | Whitepaper §10.3: Universal DDI "Full" in GCC Moderate / GCC High / DoD | Authorization cautions | corrected | Moderate authorization only; does not cover High or DoD (Appendix C). Feature-parity table not carried |
| 14 | No Marketplace listing for BlueCat or EfficientIP | Authorization table | verified | products.json searched by provider and offering name |
| 15 | BlueCat Address Manager and DNS/DHCP Server appliances for Azure and Azure Government | Authorization table | verified | BlueCat docs, Azure Virtual Appliances 26.1.0 |
| 16 | Azure commercial FedRAMP High; Azure DNS in FedRAMP High audit scope (public regions) | Authorization table | verified | products.json F1209051525; Learn compliance scope page (updated 2026-10-12) |
| 17 | AWS US East/West Moderate, GovCloud High; Route 53 in scope in both | Authorization table | verified | products.json; AWS Services in Scope: FedRAMP |
| 18 | Cisco Catalyst SD-WAN for Government FR2012534927, Moderate, since 2024-03-14 | Authorization table | verified | products.json |
| 19 | Infoblox Universal DDI Management supports records in Route 53, Azure DNS, Google Cloud DNS, Cloudflare, Akamai | Comparison table | verified | Infoblox blog, Feb 19, 2026 (vendor) |
| 20 | Infoblox Azure DNS integration limits (tags, non-simple routing, multi-value split, NS read-only, SOA several intervals, MNAME/serial not synced) | Comparison; residual risk | verified | Infoblox docs, Limitations of Azure DNS Integration |
| 21 | BlueCat Cloud Discovery & Visibility imports AWS/Azure/GCP public and private zones; can't export Address Manager data into the clouds | Comparison table | verified | BlueCat docs, CDV Administration Guide 24.1 |
| 22 | EfficientIP DNS Cloud manages public and private DNS on Route 53, Google Cloud DNS, Azure DNS | Comparison table | verified | EfficientIP DNS Cloud product page (vendor) |
| 23 | Route 53 VPC Resolver rules shareable and centrally owned | Comparison table | verified | AWS, Managing forwarding rules |
| 24 | Series: "Infoblox, BlueCat and EfficientIP are the most widely deployed" | Comparison | removed | No neutral market-share source found; the three are kept as examples |
| 25 | Whitepaper §7: "Infoblox Universal DDI is the industry's most complete answer" | — | removed | Vendor positioning; not carried |
| 26 | Cloud-native path lacks single multi-cloud IPAM SoT and delegation model by itself | Comparison | restated-as-design | Series argument, kept |
| 27 | "Why decide now" forcing functions (M-22-09, multi-cloud growth, AD retirement, option 6) | Why decide now | verified (by link) | Verified in Chs 04, 05, 07; M-22-09 re-read for Ch 09 |
| 28 | Whitepaper §7.8 PKI timeline (RSA-2048→ECDSA, SHA-1→SHA-256, CRL→OCSP) | — | removed | Unsourced and partly stale; PKI is Book 07's subject |
| 29 | Whitepaper §7.8 option-6 attack "observed in federal network incidents" | — | removed | Unverifiable; the option-6 risk itself is kept via Ch 05 |
| 30 | Infoblox Endpoint listens on 127.0.0.1:53 (127.0.0.2 macOS) and forwards via DoT on TCP 443 | Vendor question 1 | verified | Infoblox docs, Managing Endpoint |
| 31 | INR: WW Commercial only, not GCC Moderate/High/DoD; only listed solution Cisco IOS XE SD-WAN 20.4/17.4 | Vendor Q5; residual risk | verified | Learn, Microsoft 365 informed network routing (footnote URL normalized, locale and view parameters removed) |
| 32 | Series residual-risk list (sync, concentration, authorization scope, loopback agents, bypass, open questions) | Residual risk | verified / restated-as-design | Design argument; factual parts verified above |
| 33 | Series conclusion | Conclusion | restated-as-design | Kept; one sentence added pointing to Ch 09 |
| 34 | Existing footnote c11-fedramp (FR2017257053, Moderate since Dec 15, 2022) | Authorization | verified | Replaced by c12-marketplace (products.json) |
| 35 | Existing footnote c11-inr | Residual risk | verified | Re-opened; kept as c12-inr |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Series Ch 12 — Cost, staffing and success measures | Cost, staffing and success measures | Kept; expanded with metered costs |
| Series Ch 12 — Selection criteria and decision framework table | Selection criteria | Kept; two evidence cells sharpened (boundary components; read vs write integrations) |
| Series Ch 12 — Options to evaluate (enterprise DDI; cloud-native as code) | Comparing the platform models (table and paragraph) | "Most widely deployed" removed (claim 24) |
| Series Ch 12 — Residual risk and limitations (+ diagram) | Residual risk and limitations | Kept; sync risk given a verified example |
| Series Ch 12 — Conclusion | Conclusion | Kept |
| Series Ch 12 — "What this chapter establishes" callout, Previous/Next links | Replaced by "In this chapter" and "Continue the book" callouts | Book styling |
| Series Ch 12 — Word download callout | — | Removed per brief |
| Whitepaper "Problem, solution, ask"; "For decision makers"; "In this whitepaper" | — | Ch 01 owns these |
| Whitepaper §7.1 What DDI is | — | Ch 01 / Ch 07 (DDI integration argument) |
| Whitepaper §7.2 NIOS (Grid, NIOS-X, RPZ, DNSSEC, conditional forwarding, WAN replication) | Authorization table (NIOS on-premises sits in agency boundary) | Product description is vendor material; technical behaviors covered in Chs 05–08; Grid latency arithmetic not carried (unverified) |
| Whitepaper §7.3 DHCP governance surface | — | Ch 05 (option 6, rogue DHCP) and Appendix A |
| Whitepaper §7.4 Universal DDI surfaces table, April 2026 release, overlay model, Endpoint, portal RBAC | Comparison table (surfaces, Azure limits); vendor Q1 (Endpoint); RBAC to Ch 11 | Superseded BloxOne naming not carried; April 2026 release list not verified, not carried |
| Whitepaper §7.5 platform services / ecosystem | — | Ch 11 (ITSM, Terraform) and Appendix A (ecosystem integrations) |
| Whitepaper §7.6 Threat Defense (TIDE, DGA, tunneling, lookalikes, SOC Insights) | Authorization table (TIDE and Dossier named in the Marketplace description) | Feature detail is vendor material; DNS security policy belongs to Chs 03, 05, 11 |
| Whitepaper §7.7 Network discovery and IPAM governance | — | Ch 07 and Ch 11 (CM-8 evidence) |
| Whitepaper §7.8 Why federal agencies need to get ahead of this now | Why decide now; authorization table (correction, claim 12) | PKI timeline and incident claim removed (claims 28–29) |
| Whitepaper §9 Federal sovereign cloud gap | Residual risk (INR); vendor Q5 | Detail in Ch 05 and Appendix C |
| Whitepaper §10.2 five decisions | Linked to Ch 08 | Ch 08 owns |
| Whitepaper §10.3 Commercial vs federal deployment comparison | Authorization cautions (claim 13) | Feature-parity table not carried |
| Whitepaper App. A source inventory | Footnotes (sources re-opened and cited directly) | Corrected citation entry (Cisco SD-WAN credentials page) not carried |
| Whitepaper App. B open questions for vendor engagement | Questions to put to every vendor (vendor-neutral, six questions) | Status notes updated from re-verification |
| Whitepaper Document status; Call to Action; Five steps | — | Five steps duplicate Ch 08 decisions and Ch 11 checklist |
| Short twin `docs/whitepapers/next-generation-dns.md` | — | Duplicates long whitepaper; no selection or cost content |
| Guide §6.3 Cost estimation guidance | Cost — what the cloud-native path meters | Cost drivers corrected (claim 8) |
| Guide App. B Private Resolver cost calculator (B.1–B.3) | Cost table and correction callout | Prices and example totals replaced with verified, dated meters |
| Guide App. D Cost Management Guide row | — | Internal companion document, not carried |
