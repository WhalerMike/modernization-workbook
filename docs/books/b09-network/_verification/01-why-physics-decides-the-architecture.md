# Verification — Chapter 01, Why Physics Decides the Architecture

Checked October 20–21, 2026 by writer W1. Sources: *The Physics of a Single Source of Truth* (`docs/ssot-network-physics/index.md`, `00-executive-summary.md`, `03-speed-of-light-tax.md`; the physics sections of the other series chapters are owned by Ch04, Ch05 and Ch08), and the physics and "false versus" sections of the twin papers `docs/whitepapers/tic3-sdwan-vs-dia.md` and `docs/whitepapers/network-transport-and-governance.md` (the rest of the twins went to Ch02). Microsoft sources opened through the Microsoft Learn MCP tools; ITU-T G.114 (05/2003), the Raft paper, the CISA SASE guidance and the TIC 3.0 Branch Office use case were downloaded as PDFs and text-extracted; other pages were fetched directly.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Microservices guidance: two services shouldn't share a data store; each manages its own private store | The pendulum | verified (new) | Learn, Data considerations for microservices |
| 2 | Same guidance: use a single source of truth where strong consistency is required; other copies eventually consistent; prefer eventual consistency where possible | The pendulum; Need less global sync | verified (new) | Learn, Data considerations for microservices |
| 3 | Three forces (fat WAN, token security, SSOT discipline) push toward logical centralization | Three forces table | restated-as-design | Program argument (series Ch00). Wording sharpened: the WAN removes a *bandwidth* penalty, not a latency one (series said "latency penalty", which contradicts its own Ch03) |
| 4 | Logical vs physical centralization; three walls (speed of light, blast radius, residency) | Logical centralization section | restated-as-design | Program argument (series Ch00) |
| 5 | Speed of light in vacuum 299,792,458 m/s exact | The numbers | verified (new) | NIST CODATA 2022 |
| 6 | Light in fiber ~200,000 km/s, ~5 µs/km, ~1 ms per 200 km one way | Decision makers; The numbers | verified | ITU-T G.114 Table A.1 (optical fibre cable planning value 5 µs/km, marked provisional). Source gave no citation; refractive-index wording replaced by "about two-thirds of the vacuum speed" (arithmetic) |
| 7 | Floors: metro 50 km 0.25/0.5 ms; 1,000 km 5/10 ms; NY–London ~5,600 km 28/56 ms; NY–Singapore ~15,300 km 77/153 ms | Floors table; diagram | corrected (minor) / arithmetic | Recomputed by haversine (R = 6,371 km, city-center coordinates): NY–London 5,570 km, NY–Singapore 15,332 km; floors unchanged at rounding. Labeled as arithmetic |
| 8 | "Internet routes commonly run 1.5× to 3× the great-circle distance" | The numbers | corrected | Unsourced in the series. Replaced with the 2017 PAM measurement (Bozkurt et al., via RIPE Labs): median ping more than 3× the vacuum c-latency bound, i.e. roughly 2× the straight-fiber floor |
| 9 | The gap above the floor is "frequently 2× to 10× the floor" | Two latencies | removed | No source found. Restated as "often several times the floor on real internet paths", supported by #8 |
| 10 | Optimization attacks the gap, never the floor | Two latencies callout | restated-as-design | Program argument; follows from #6 |
| 11 | ITU-T G.114 "budgets 150 ms one way" for acceptable conversational quality (twin papers) | 150 ms budget section | corrected | G.114 clause 4: 400 ms is the general planning limit; below 150 ms end to end (mouth-to-ear) most applications are "essentially transparent". The 150 ms includes terminals |
| 12 | Terminals contribute 50 ms (10 ms packets) or 80 ms (20 ms packets); Y.1541 Class 0 network objective 100 ms | 150 ms budget section; diagram | verified (new) | G.114 Appendix II.2 |
| 13 | Network share of the budget is roughly 70–100 ms | 150 ms budget section; diagram | arithmetic | 150 − (50 to 80); consistent with Y.1541 Class 0 (#12) |
| 14 | Local and regional calls should be delay-transparent; mid-200 ms tolerable only on long inter-regional calls | 150 ms budget section | verified (new) | G.114 Appendix II.2 |
| 15 | "A field office hairpinning through a distant data center spends 100–130 ms one-way on the detour" (tic3-sdwan-vs-dia) | What a hairpin costs | corrected | No source or method. Worked example (Seattle → northern Virginia → Seattle, 7,390 km, ×1.5 assumed route factor, +5 ms assumed stack) gives about 60 ms one way; 100+ ms is plausible only for non-contiguous offices or as a round trip. Inputs labeled |
| 16 | "Local breakout reduces the path to a nearby region and measures 5–15 ms one-way" (network-transport-and-governance) | What a hairpin costs | restated-as-design | No measurement method in any source. Kept as a planning assumption, flagged for replacement by agency measurement (consistent with branch-edge-gap §4.3 "best case" column) |
| 17 | Honolulu–northern Virginia great circle 7,730 km, 39 ms one-way floor | What a hairpin costs | arithmetic (new) | Haversine as #7 |
| 18 | CISA: MTIPS backhaul increases contention and latency for remote and branch users | What a hairpin costs | verified (new) | CISA, Journey to Zero Trust: Using SASE in a Modern TIC 3.0 Solution v1.0, June 2026, §5.1 |
| 19 | Branch Office use case helps agencies gain application performance (latency, throughput, jitter) | What a hairpin costs | verified (new) | TIC 3.0 Branch Office Use Case v3.0 (publication Sept 2026), §3 |
| 20 | Distance is the only latency variable a buyer controls; carrier topology is not geometry; a faster circuit doesn't straighten the path | No product shortens a fiber path | restated-as-design | Program argument (twin paper) |
| 21 | Microsoft: egress locally, avoid hairpins; hairpin defined as traffic first directed to a security stack, CASB or cloud web gateway | No product shortens a fiber path | verified (new) | Learn, Microsoft 365 network connectivity principles |
| 22 | Local breakout solves one thing; ungoverned breakout is a compliance regression | No product shortens a fiber path | restated-as-design | Program argument; developed and sourced in Ch02 |
| 23 | Synchronous commit pays ≥1 round trip; consensus pays a round trip to a quorum | Strong consistency | verified | Ongaro & Ousterhout (Raft), §2: command completes once a majority has responded to a single round of RPCs. Series' "one to two round trips (Paxos, Raft)" narrowed to what was verified |
| 24 | Quorum commit latency is a tail statistic; tail dominates at scale | Strong consistency | verified (new citation) | Dean & Barroso, "The Tail at Scale," CACM 56 (2013) — abstract-level support only (full text not retrievable: ACM 403) |
| 25 | Propagation is tail-neutral; congestion/loss/jitter widen the tail | Strong consistency | restated-as-design | Program argument (series Ch03) |
| 26 | Keep strong consistency in-region; minimize synchronous cross-region crossings | Need less global sync | restated-as-design | Program design rule; supported by #2 |
| 27 | Azure Database for PostgreSQL accepts a Microsoft Entra access token as the password | Need less global sync | verified (new) | Learn, Entra authentication concepts and configure pages |
| 28 | Program SaaS data plane: single-region PostgreSQL system of record; dedicated stamps only where compliance requires; no global synchronous write path | Need less global sync | restated-as-design | Program decision (series Ch00/Ch07); detail owned by Ch08 |
| 29 | Data residency is a legal/contractual constraint no technology removes | Logical centralization | restated-as-design | Program argument |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| ssot index — Thesis in one paragraph | Ch01 opening, case paragraph, pendulum | — |
| ssot index — Who this is for | — | Audience list superseded by the book index (editor) |
| ssot index — Chapters list and series diagram | — | Series navigation; staged `src-series-00-argument-path` left for the editor's index |
| ssot index — Provenance | Ch01 "Need less global sync" (program design choices stated as such) | ADR references dropped; workbook doesn't cite internal decision records |
| ssot index — A note on figures | — | House-style note; the book uses the same committed-SVG house style |
| ssot 00 — The question | Ch01 The pendulum | — |
| ssot 00 — Three forces table and figure | Ch01 Three forces table; `ch01-three-forces` (from `src-ch00-three-forces`, wording fixed) | — |
| ssot 00 — The distinction that prevents the trap (callout, three walls) | Ch01 Logical centralization is not physical centralization | — |
| ssot 00 — The wall, and the way around it | Ch01 Two latencies; Need less global sync | SD-WAN detail to Ch05 |
| ssot 00 — Reference example (four bullets) | Ch01 Need less global sync (one paragraph) | Full walk-through owned by Ch08 |
| ssot 00 — How to read this paper | — | Series reading guide; replaced by cross-links to Ch04, 05, 06, 08 |
| ssot 03 — The wall that does not move | Ch01 Speed-of-light floor (intro) | — |
| ssot 03 — Two latencies, added together (table, callout) | Ch01 Two latencies | — |
| ssot 03 — The numbers (table, 1.5×–3× claim, figure) | Ch01 The numbers; `ch01-propagation-floor` (from `src-ch03-propagation-floor`, distances and note corrected) | Inflation claim corrected (#8) |
| ssot 03 — Why strong consistency is a latency problem | Ch01 Strong consistency is a latency problem | — |
| ssot 03 — Tail latency | Ch01 Strong consistency (second paragraph) | — |
| ssot 03 — What follows for architecture | Ch01 Need less global synchronization | — |
| ssot 03 — Summary | Ch01 "What this chapter establishes" | — |
| ssot 01, 02 (logical centralization, token security) | — | Owned by Ch04 (W3); Ch01 links Ch04 |
| ssot 04, 05 (SD-WAN differentiated transport; governed path) | — | Owned by Ch05 (W4); Ch01 links Ch05 |
| ssot 06, 07 (consistency vs network classes; reference architecture) | — | Owned by Ch08 (W4); Ch01 links Ch08 |
| tic3-sdwan-vs-dia — The physics | Ch01 150 ms budget, What a hairpin costs, No product shortens a fiber path | 150 ms and 100–130 ms claims corrected (#11, #15); transport menu paragraph to Ch02 |
| network-transport-and-governance — The physics | Ch01 What a hairpin costs; No product shortens a fiber path | 5–15 ms restated as assumption (#16) |
| Both twins — all other sections | Ch02 | See Ch02 ledger |
