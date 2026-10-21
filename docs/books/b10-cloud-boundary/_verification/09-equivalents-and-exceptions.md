# Verification — Chapter 09, In-Boundary Equivalents and Documented Exceptions

Writer: W4. Verified 2026-10-21. Built from the *Boundary Impact Model* ("How FMP compensates: in-boundary equivalents") and *What Changed at FedRAMP* (§2 remedy argument, §3 register callout, §4.1–4.4, §5). Microsoft facts checked with the Microsoft Learn MCP tools; FedRAMP rules read on fedramp.gov/2026; Marketplace data from `products.json` (downloaded and parsed 2026-10-21); NIST SP 800-37 from the PDF text.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | SP 800-37: when trust is insufficient, compensating controls, accept greater risk, more trustworthy provider, or don't obtain the service | Opening | verified (new) | SP 800-37 Appendix G (c09-sp80037) |
| 2 | Admin-center network connectivity supports WW Commercial and China, not GCC Moderate, GCC High or DoD | Register; equivalents; higher class | verified | MS Learn network connectivity overview (c09-mac) |
| 3 | Register counts: 26 rows, 8 vendor-confirmed, 15 inferred, 3 limited | Register | restated-as-design | Program's own register (`gcc-moderate-telemetry-gaps.yaml`), as reported in the whitepaper §3; not an external fact |
| 4 | BIM worked example: Endpoint Analytics, DHA, Network Fence, Arc monitoring, Expedited Updates unavailable in GCC Moderate | Register | corrected | Intune has no GCC instance ("GCC is the same instance as Microsoft Intune in the commercial space"); DHA and Expedite updates are listed as not available for GCC High and DoD (c09-intune-gov). Chapter 02 corrects the full list; this chapter cites it |
| 5 | Boundary probe, capability disposition, rerun cadence | Probe | restated-as-design | Program design (BIM "boundary probe") |
| 6 | Four in-boundary mechanisms; `source_classification: derived` | Equivalents | restated-as-design | Program design (BIM) |
| 7 | Network connectivity test tool: GCC version supports login, save, share in tenant, health status, command line; public sharing disabled for GCC | Equivalents | verified (new) | MS Learn test tool page (c09-mac-tool) |
| 8 | Admin center insights are daily aggregated in-product measurements; test tool results run locally | Equivalents | verified (new) | c09-mac-tool |
| 9 | Commercial tenants get comparative per-provider scoring | Equivalents | verified (by reference) | Whitepaper §3; Chapter 04 owns the detail. Stated here only as not replaced by the test tool |
| 10 | INR not available to GCC Moderate | Equivalents | verified (by reference) | Settled fact; Book 08 App C, Book 09 Ch12 |
| 11 | ExpressRoute for M365: "do not recommend," authorization required, "only in the rare scenarios where it's necessary," unauthorized subscriptions get route-filter error | Provider exception | verified | MS Learn "Azure ExpressRoute for Microsoft 365" (c09-er) |
| 12 | Authorized "only when a customer's regulatory requirement mandates direct connectivity"; request needs "the text excerpt and web link to the regulation" | Provider exception | verified | MS Learn "Assessing Microsoft 365 network connectivity" (c09-er-assess) |
| 13 | "Neither FedRAMP nor FISMA supplies that hook" | Provider exception | restated-as-design | Not verifiable as an absolute; restated as "the program hasn't found a FedRAMP rule or FISMA provision that mandates private connectivity"; TIC 3.0 technology-neutral per Book 09 Ch03 |
| 14 | AO risk acceptance cannot be delegated | Agency risk acceptance | verified | SP 800-37 Task R-4 |
| 15 | CA-5 POA&M text | Agency risk acceptance | verified | SP 800-53 Rev. 5 OSCAL 5.2.0 (c09-sp80053) |
| 16 | MAS-CSO-FLO: resources "MAY vary by security category…" | Scope argument 1 | verified; corrected scope | fedramp.gov MAS page (c09-mas). The whitepaper presented it as an agency-side argument; the rule binds the provider's description of its offering. The agency's own categorization stays under RMF |
| 17 | MAS-CSO-IIR guidance: agents, clients, mobile apps not fully managed by CSP are "entirely outside the scope of FedRAMP" | Scope argument 2 | verified; limit added | c09-mas. Whitepaper said this "removes it from the scope conversation"; chapter adds that the software then sits inside the agency's own boundary and authorization. Whitepaper attributed it to the "FedRAMP Certification Act"; the page links the FedRAMP Authorization Act — not carried |
| 18 | SCN: routine recurring SHOULD NOT be notified; adaptive within 10 business days after; transformative 30 business days before, 10 before final, 5 after finish, 5 after verification | Scope argument 3 | corrected | fedramp.gov SCN page (c09-scn). Whitepaper said "30 days before" and "exempt"; rules are business days and SHOULD NOT |
| 19 | AGU-AGC-NAR and AGU-AGC-TPP | Scope argument 4 | verified (new) | c09-agu |
| 20 | MAS, SCN and CDS families apply to Rev5 Class C | Scope arguments | verified (new) | fedramp.gov/2026/reference/rev5/c (c09-rev5c) |
| 21 | Mandatory adoption January 1, 2027 | Scope arguments | verified | fedramp.gov/2026/timeline (c09-timeline) |
| 22 | Network Provider Program "no longer open for new network providers"; other pages still invite vendors to join | Buy the capability | verified; date removed | MS Learn (c09-npp). Whitepaper's "since at least March 2026" not verifiable; removed |
| 23 | Capability spec: Optimize/Allow bypass; `/version` once an hour | Buy the capability | verified | MS Learn "Managing Microsoft 365 endpoints" (c09-endpoints) |
| 24 | MSO365MT Certified Class C; MSO365MTA In Process, Initial Implementation, Class D, 0 authorizations; FR1824057433 GCC High Class D | Higher class | verified | products.json (c09-fr). Whitepaper's "99 authorizations" now 100 (not used in this chapter) |
| 25 | High certification wouldn't restore admin-center network connectivity | Higher class | verified (inference from documented facts) | Feature unavailable in GCC High (Class D) per c09-mac and c09-fr; stated as reasoning |
| 26 | Playbook steps and owners | Playbook | restated-as-design | Program model |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| *Boundary Impact Model* — "How FMP compensates" items 1–4 (probe, in-boundary telemetry, compensating enforcement, ATO documentation surface) | "Probe what actually works"; "Build in-boundary equivalents" table; item 4 points to Chapter 11 | — |
| *Boundary Impact Model* — four dimensions | Equivalents table (one row per dimension) | Model itself is Chapter 02's |
| *Boundary Impact Model* — invisible-boundary worked example (five features) | "Start with a register" (as the cautionary example, corrected) | Full correction in Chapter 02 |
| *What Changed at FedRAMP* — §2 "boundary vs. exclusion list have different remedies" | "Start with a register, not a boundary" | Evidence table is Chapter 04's |
| *What Changed at FedRAMP* — §3 callout "Use the confirmed rows" | Register (evidence classes and program counts) | Per-signal losses are Chapter 04's |
| *What Changed at FedRAMP* — §3 admin-center network observability layer | Worked equivalent example | Bullet-level detail (scores, 500 miles/25 ms, 30% TLS alert) left to Chapter 04 |
| *What Changed at FedRAMP* — §4.1 inventory feature by feature | "Start with a register" | — |
| *What Changed at FedRAMP* — §4.2 documented exception (ExpressRoute) | "The provider's own exception path" | — |
| *What Changed at FedRAMP* — §4.3 scope arguments 1–3 | "Make the scope arguments" 1–3, each with its limit; argument 4 added | — |
| *What Changed at FedRAMP* — §4.4 buy the capability | "Buy the capability, not the badge" | "Since at least March 2026" removed |
| *What Changed at FedRAMP* — §5 High package and "what it does not change" | "A higher class doesn't restore an excluded feature" | Full package table is Chapter 04's |
| *What Changed at FedRAMP* — §1, §6, §7 | Not carried here | Chapters 03, 04, 11 and Appendix A |
