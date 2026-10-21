# Verification — Chapter 11, Field Office WAN Transformation

Source: `docs/whitepapers/field-office-wan-transformation-dp-consolidation.md` (v1.1), all sections except §4.5, §4.8, §4.9 and Appendix A.2, which Chapter 03 owns (summarized and linked here). External claims checked Oct 21, 2026 on Microsoft Learn, Cisco, CISA, DISA, Microsoft pricing and the FedRAMP Marketplace dataset (`products.json`, last_change 2026-10-21). Diagrams: `ch11-hub-content-tier.flow.yaml`, `ch11-retirement-gates.flow.yaml` (new; no staged `src-` source fit this chapter, so none was consumed).

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | 4,000 clients per DP; 250 standard + 2,000 pull DPs per site; 5,000 per primary incl. secondaries; 10,000 packages per DP; 150,000 Windows clients per stand-alone primary | Capacity limits | verified | Size and scale numbers |
| 2 | Actual clients per DP depends on network and hardware; pull DP acts like a client; pull DPs request content simultaneously and may request all content | Capacity limits; distributed-model costs | verified (added the first two caveats) | Size and scale numbers |
| 3 | 25,000 clients per management point, so ≥3 MPs for 70,000 | Capacity limits | verified (added; source silent) | Size and scale numbers |
| 4 | Stand-alone primary 175,000 devices total | Capacity limits | verified (added) | Size and scale numbers |
| 5 | DP = IIS + BITS + single-instance content library; no database | Why per-office DPs | verified (RDC added) | Site system prerequisites; Content library |
| 6 | ConfigMgr annual cadence from 2609; Intune gets all new innovation; ConfigMgr focus on security, stability, long-term support | Timing problem | verified | Tech Community announcement (title confirmed; body via search snippet) and Petri, Nov 7, 2025 |
| 7 | 2609 released Sept 28, 2026, supported to Mar 28, 2028; 18 months per version | Timing problem | verified (added) | Updates and servicing; Support for CB versions |
| 8 | ConfigMgr not end-of-life; DP role not deprecated | Timing problem | verified (2609 is current and supported; no deprecation listed) | Updates and servicing |
| 9 | "Intune-First Asset Onboarding doctrine (the program decision)" | Timing problem | restated-as-design; linked Book 05 Ch04 (no greenfield ConfigMgr, no co-management for new assets) | Book 05 Ch04 |
| 10 | M365 GCC aligned to FedRAMP Moderate | Scope | verified and made precise (MSO365MT FedRAMP Certified, Class C; MSO365MTA In Process, High) | FedRAMP Marketplace dataset |
| 11 | Intune gaps concentrate in GCC High/DoD; GCC tracks commercial | Scope | verified (Intune has no separate GCC instance; GCC uses commercial) | Intune government service description |
| 12 | Unit-cost table \$3,500 / \$12,000 / \$16,000 | Proposal | restated-as-design (program planning prices, labeled assumption) | — |
| 13 | Depreciation FY26–FY31; co-management 3–4 years | Timing problem | restated-as-design | — |
| 14 | 1.5–3 PB duplicated storage | Distributed-model costs | restated as worked arithmetic (1,500 × 1–2 TB) | — |
| 15 | Content from Microsoft CDN: Windows updates, M365 Apps, Defender definitions, Store apps, Intune Win32 apps; DO/MCC handle it | What changed | verified | MCC for Enterprise and Education overview |
| 16 | Peer Cache / BranchCache allow one WAN transfer per site, "no server, no accreditation" | What changed; keeping content local | verified, with requirements added (current boundary group only, domain-joined source, rejection conditions) | Peer cache |
| 17 | DIA 200 Mbps–1 Gbps costs "a fraction" of MPLS | What changed | restated-as-design (program working assumption tied to Assumption 1) | — |
| 18 | Peer Cache depends on workstation-to-workstation **SMB** | Risks; Assumption 9 | corrected: peer cache uses HTTP/HTTPS TCP 8003 and UDP 8004; DO peering uses TCP 7680; the question is client-to-client traffic on those ports | Client settings; Configure DO |
| 19 | DO LAN mode groups by shared public IP; in hub-and-spoke use Group mode and/or subnet restriction; Group mode recommended for most orgs | Keeping content local | verified (added; consequence for hub-egress phase) | Configure DO; DO reference |
| 20 | DP vs Intune compliance table: Intune "covered by the Microsoft 365 GCC Moderate FedRAMP ATO" | DP vs Intune | corrected: Intune serves GCC from its commercial instance, in scope for the Azure commercial FedRAMP High P-ATO | Intune government service; Microsoft FedRAMP offering; Azure services in FedRAMP audit scope |
| 21 | DISA Windows Server and IIS STIGs apply per server | DP vs Intune | verified for IIS 10.0 Server and Site STIGs; phrased as the agency's baselines "for example" | DISA July 2025 maintenance release |
| 22 | Intune compliance feeds Conditional Access; TLS by default | DP vs Intune | restated (link Book 04); general service behavior, not footnoted | — |
| 23 | Consolidating to 24 DPs shrinks compliance sustainment "to roughly a twelfth" | DP vs Intune | corrected: 24 of 1,500 is under 2 percent of the component count (1/62.5), labor not strictly proportional | arithmetic |
| 24 | 12 hubs, 24 DPs, 73% utilization, 96,000 capacity, 37% headroom, sizing trigger (8,000 / 3,200 / 90,000 → 28) | Content tier | verified arithmetic; inputs labeled assumptions | arithmetic |
| 25 | Pull DPs remove site-server distribution load | Content tier | verified | Fundamental concepts for content management |
| 26 | Boundary-group assignment of offices to hub DPs | Content tier | restated-as-design (added) | — |
| 27 | Cisco C8200L-1N-4T, C8200-1N-4T, C8300-1N1S-4T2X, C8500L-8S4X, P-5GS6-GL, CG522-E exist; 8200 IPsec 500 Mbps / 1 Gbps (400/900 IMIX) | Branch network | verified (models exist; throughput added) | Cisco 8200/8300/8500 data sheets; Cisco CG522-E/P-5GS6-GL troubleshooting doc (search) |
| 28 | Crypto throughput is license-tiered; "1 Gbps circuit vs 250 Mbps crypto tier" | Branch network | verified and sharpened: HSECK9 required above 250 Mbps except 8500/8500L, so Tier S at 300 Mbps needs it | Cisco licensing and throughput guide |
| 29 | 5G fixed wireless subject to deprioritization | Branch network | verified as an example of published carrier terms | T-Mobile network management practices (search result) |
| 30 | 300 Mbps DIA outperforms 1 Gbps cable for voice/VDI/Teams; shared conduit common | Branch network | restated-as-design | — |
| 31 | Cisco cloud SD-WAN controller FedRAMP status | Branch network | verified (added): SDWAN-G FedRAMP Certified, Class C | FedRAMP Marketplace dataset |
| 32 | INR: Cisco only listed solution; WW Commercial only, not GCC Moderate/High/DoD | M365 path optimization | verified (quote matches; min version 20.4/17.4) | Microsoft 365 INR |
| 33 | DSCP / app-aware routing / direct breakout available in GCC | M365 path optimization | restated-as-design; Ch12 linked for M365 traffic | — |
| 34 | TIC 3.0 Branch Office use case exists | Security and TIC 3.0 | verified (existence only; requirements left to Ch03) | CISA TIC 3.0 Branch Office Use Case |
| 35 | CISA SASE guidance, June 2026 | Security and TIC 3.0 | verified title and date (June 24, 2026); detailed CLAW/Protective DNS claims left to Ch03 | CISA resource page |
| 36 | Circuits orderable in 90 days; accreditation surface two orders of magnitude smaller | Security; roadmap | restated-as-design (90 days as planning assumption; 12 vs 1,500 arithmetic) | — |
| 37 | "Multiple SSE vendors hold FedRAMP Moderate" | Security; risks | verified and made precise (ZIA Gov and Palo Alto GCS Class C; Netskope NewEdge Gov and Skyhigh SSE Class D) | FedRAMP Marketplace dataset |
| 38 | "Seven workload sliders" listed as six with resource access "deprecated in 2203" | Retirement gates | corrected: Learn lists seven incl. resource access; unsupported from 2203, slider mandated to Intune from 2403 | Co-management workloads |
| 39 | Gate 1: until switched, apps stay in Software Center and pull from DP | Retirement gates | corrected: even after the client apps slider moves, ConfigMgr-deployed apps remain in Software Center; gate now requires no deployment still published from ConfigMgr | Co-management workloads |
| 40 | Gate 2: WU + device configuration pairing is Autopatch prerequisite | Retirement gates | verified (Pilot Intune or Intune); added that ConfigMgr software-update client setting must be turned off manually | Autopatch prerequisites; Co-management workloads |
| 41 | Gate 3: OSD isn't a co-management workload | Retirement gates | verified (not among the seven workloads) | Co-management workloads |
| 42 | Gate 4: MCC can run on a DP and serve Intune Win32 apps to co-managed clients | Retirement gates | verified; added: DP must have no other roles, Intune-shifted content only, same boundary group | MCC with Configuration Manager |
| 43 | Design principle 4: hubs become MCC footprint "without re-siting or re-accrediting" | Connected Cache at the hubs | corrected in detail: stand-alone MCC host can't share port 80 with a DP, needs Azure subscription; footprint = separate host or re-purposed DP inside the same boundary | MCC Ent requirements; MCC Ent overview |
| 44 | Risk "Connected Cache unavailable for GCC — confirm with account team" | Connected Cache; risks | corrected/narrowed: stand-alone MCC listed n/a only in GCC High/DoD; residual question is the Azure management resource's boundary/authorization — unverifiable here, left as a Phase 0 decision | Intune government service |
| 45 | MCC licensing (Windows E3/E5, A3/A5, VDA) | Connected Cache | verified (added) | MCC with ConfigMgr; MCC Ent requirements |
| 46 | Windows Server 2025 Standard 16-core \$1,036 | Bill of materials | corrected to \$1,176 suggested MSRP; hub subtotal \$1,048,224; Year 1 \$9,983,224 (still ~\$10.0M) | Microsoft Windows Server pricing |
| 47 | Cisco list prices, 40% discount, ZTP/field install/services, DIA/5G/subscription/SSE/transit unit costs, MPLS \$1,200 | Bill of materials; cost model | restated-as-design (labeled planning assumptions; no public list prices to verify) | — |
| 48 | Recurring \$15,714,000; net −\$5,886,000; breakeven \$873; sensitivity rows; five-year ramp; \$57.7M delta | Cost model | verified arithmetic | arithmetic |
| 49 | "Self-funds in ~20 months" (base case) | Sensitivity | corrected wording: 20 months is steady-state payback; phased model reaches positive cumulative in year 4 | arithmetic |
| 50 | 12-month accreditation slip pushes breakeven to year five but "does not change the five-year delta" | Risks | corrected: if every wave slips 12 months, five-year net ≈ +\$1.8M and delta ≈ \$51.8M | arithmetic |
| 51 | "Validate the nine assumptions" (table has ten) | Assumptions; recommendation | corrected to ten | source table |
| 52 | Phase 0 \$1.8M; relation to Year 1 capital | Roadmap | restated-as-design (funded first out of the Year 1 total; source didn't say) | — |
| 53 | Terrestrial unavailability 5–15% "historic rates" | Risks | restated-as-design (program planning range) | — |
| 54 | Windows Autopilot available to GCC | Retirement gates | verified implicitly (GCC uses commercial Intune; Autopilot n/a list is GCC High/DoD) | Intune government service |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter, download callout | — | Page furniture; not carried |
| Problem, solution, ask box | Opening prose; Recommendation | Merged; not repeated as a box |
| Read this first | "Read this first" callout | Carried; points to Assumptions |
| In this whitepaper | In this chapter callout; opening prose | Cross-references to the twin TIC paper replaced by Ch02/Ch03 links |
| Executive summary, Findings | Opening prose; capacity, cost and hub sections | Consolidated; each finding lives where it is argued |
| Headline comparison table | Five-year position and comparison prose | Folded into the cost model (−\$50M vs +\$7.7M, \$57.7M delta) |
| Recommendation callout | Recommendation | Merged with §10 |
| §1 Purpose; 1.1 In scope; 1.2 Out of scope | Scope | Carried in prose |
| §1.3 Cloud environment constraint | Scope; M365 path optimization | Carried; FedRAMP status made precise |
| §2 Proposal; 2.1 Unit cost reconciliation; decomposition callout | The proposal under review | Carried; prices labeled planning assumptions |
| §2.2 Timing problem; sizing-question callout | The timing problem | Carried; dates verified; doctrine linked to Book 05 Ch04 |
| §3 intro (DP is a content host) | Why per-office DPs… | Carried, verified |
| §3.1 Published capacity limits | Published capacity limits | Carried; MP and caveat rows added |
| §3.2 Cost of distributed model | What the distributed model costs | Carried |
| §3.3 What has changed | What changed since the model was adopted | Carried; transport economics restated as assumption |
| The accurate statement callout | Same callout | Carried |
| §3.4 DP vs Intune summary | DP vs Intune compliance section | Merged with Appendix A.1 |
| §4.1 Design principles | Design principles | Carried |
| §4.2 Hub topology | Hub topology: 12 sites | Carried; physics/TIC argument linked to Ch02/Ch03 |
| §4.3 Content tier, allocation, storage, sizing trigger | Content tier: 24 distribution points | Carried; boundary-group note added |
| §4.4 Branch network | Branch network | Carried; vendor models made an example column; HSECK9 detail added |
| §4.5 Security and TIC 3.0 | Security and TIC 3.0 (three consequences) → Ch03 | Owned by Chapter 03; summarized and linked |
| §4.6 INR | Microsoft 365 path optimization in GCC | Carried; Ch12 and Book 08 linked |
| §4.7 All-in trigger, five gates, gate callout | When to retire the last distribution point (+ diagram) | Carried; Gates 1, 2, 4 corrected |
| §4.8 Compliance and reporting drivers | Security and TIC 3.0, third bullet → Ch03 | Owned by Chapter 03; one-sentence finding kept |
| §4.9 CLAW and Protective DNS | Security and TIC 3.0, second bullet; roadmap; risks → Ch03 | Owned by Chapter 03; gating rule kept, detail linked |
| §5 Sizing and BOM intro; 5.1–5.4 | Sizing and bill of materials | Carried; Windows Server price corrected |
| §6.1 Recurring cost | Annual recurring cost at steady state | Carried; vendor-branded subscription lines made generic |
| §6.2 Five-year position + scope note | Five-year phased position | Carried |
| §6.3 Sensitivity; breakeven callout | Sensitivity to current MPLS cost | Carried; breakeven shown as arithmetic; Ch13 linked |
| §7 Roadmap table | Implementation roadmap | Carried; CLAW wording generalized to "replacement telemetry" with Ch03 link |
| §7.1 Sequencing rationale | Why this order | Carried |
| §8 Risks | Risks and mitigations | Carried; slip arithmetic, SMB, SSE, Connected Cache rows corrected |
| §9 Assumptions; confidence statement | Assumptions to validate | Carried; Assumption 9 reframed to ports |
| §10 Recommendation; actions; position statement | Recommendation | Carried; "nine" corrected to "ten" |
| Appendix A intro | DP vs Intune section | Merged |
| Appendix A.1 | Distribution points and Intune sit in different compliance postures | Carried; FedRAMP boundary and "a twelfth" corrected |
| Appendix A.2 (SC-7/SC-8/AC-4/SI-3/SI-4/AU-12/CP-8, ZTMM, BOD 25-01) | → Ch03 (and Ch02 for CP-8 telecom diversity) | Owned by Chapter 03 |
| Sources list | Footnotes | Replaced by footnotes; internal whitepaper links (twin TIC paper, ZT governance, BOD 25-01, ticket-to-machine) not carried — archived sources or other chapters' scope |
| Closing "prepared for internal review" note | Read this first callout | Intent carried; wording not |
