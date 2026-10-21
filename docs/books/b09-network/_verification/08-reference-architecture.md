# Verification — Chapter 08, Reference Architecture: Consistency Classes Meet Network Classes

Checked 2026-10-21 against Microsoft Learn (Learn MCP), AWS documentation, etcd documentation, CISA (TIC 3.0 Branch Office Use Case v3.0 and the June 2026 SASE guide, both PDFs text-extracted), the NIST SP 800-53 Rev. 5 OSCAL catalog (release 5.2.0) and the CRDT paper's bibliographic record.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Align consistency class with transport class; mismatch costs both ways | Design rule | restated-as-design | — |
| 2 | Six-row mapping table; only top two rows ride the lean path | Mapping | restated-as-design (diagram reused from staged src-ch06) | — |
| 3 | Azure PostgreSQL flexible server: HA RPO 0; read replicas async, RPO typically 30 s–5 min | Mapping | verified (new evidence for the mapping) | c08-pgbc |
| 4 | Cross-region replica lag typically at least several minutes; depends on write load and latency | Mapping | verified | c08-pgrel |
| 5 | Read replicas not intended for synchronous scenarios; geo-replicas lag more | Mapping | verified | c08-pgrr |
| 6 | ssot-06 "witness / learner replicas placed by path" | Mapping | verified for learners (etcd: non-voting, not counted toward quorum); "witness" term dropped | c08-etcd |
| 7 | CRDTs: local writes, deterministic merge (Shapiro et al. 2011) | Mapping | verified (SSS 2011 / RR-7687 record) | c08-crdt |
| 8 | Clock-based concurrency only where strong cross-region semantics required | Mapping | cross-referenced to Ch05 (verified there) | Ch05 |
| 9 | ssot-06 strong-local/async, bounded staleness, causal techniques list and the three-question procedure | Mapping | not repeated: Ch04 owns and verified them; linked | Ch04 |
| 10 | Program SaaS decision: one shared data plane, per-tenant namespace isolation, stamp option, single PostgreSQL flexible server | Worked example | restated-as-design (program decision record) | — |
| 11 | Doctrine-to-realization table | Worked example | restated-as-design; ssot-07 "Source" column (internal ADR IDs) replaced with plain decision names | — |
| 12 | Tenant lifecycle state machine; illegal transitions rejected; `t-<guid>` namespace | Worked example | restated-as-design (program code) | — |
| 13 | Multitenant API must match `tid` to stored tenant; never cross tenants | Worked example | verified | c08-claims |
| 14 | Managed identity passes access token in the password field | Worked example | verified | c08-pgmi |
| 15 | Token provider caches and refreshes off the hot path; never presents near-expired token | Worked example | restated-as-design (program code) | — |
| 16 | Same seam serves an AWS RDS-IAM token provider | Worked example | restated-as-design; RDS IAM token (15-minute lifetime, replaces password) verified | c08-rds |
| 17 | Stamp is dry-run by default; executor injected in production | Worked example | restated-as-design | — |
| 18 | Sovereign-cloud token audiences branch per cloud | Worked example | verified in substance (Azure PostgreSQL Entra token resource differs by cloud) | c08-pgentra |
| 19 | Review trigger: registry outgrows a single flexible server | Worked example | restated-as-design | — |
| 20 | No global synchronous commit path; SD-WAN helps only DR replication and read freshness | Worked example | restated-as-design | — |
| 21 | Cross-tenant blast radius lives in tenant-resolution code; highest-value test | Worked example | restated-as-design; mechanism detail left to Ch04 | Ch04 |
| 22 | Branch lean/bulk classes (AD operations, voice, sign-in vs backups, patches, content) | Branch architectures | restated-as-design; linked Ch06, Ch11 | — |
| 23 | Legacy TIC 2.0: branch offices tunnel to MTIPS; backhaul increases contention and latency | A. Hairpin | verified | c08-cisasase |
| 24 | Microsoft's definition of a network hairpin | A. Hairpin | verified | c08-m365 |
| 25 | Twin papers: bare local breakout is "a compliance regression with better latency" | B. Bare breakout | restated-as-design; argument owned by Ch02 | — |
| 26 | Governed local breakout as the program's reference pattern | C. Governed breakout | restated-as-design | — |
| 27 | SASE agents on devices, branch NGFW forwarding for others | D. Agent SASE | verified | c08-cisasase |
| 28 | Branch Office Use Case options: direct, via campus, via CASB/SECaaS; campus over private link or internet | Branch architectures | verified | c08-ticbo |
| 29 | Bare breakout isn't an option in the use case (every option has a PEP) | Branch architectures | restated-as-design (reading of the use case's options) | c08-ticbo |
| 30 | BEG §3.3 "second diagram is not more secure at the PoP; it is governed and measurable between user and PoP" | Branch architectures | carried in substance into the comparison table (telemetry row); the two-diagram version is Ch02's figure ch02-branch-edge | — |
| 31 | Hairpin latency figures (twin papers "100–130 ms one-way"; "5–15 ms" local) | — | not repeated: Ch01's worked hairpin budget owns the numbers; linked | Ch01 |
| 32 | INR unavailable to GCC Moderate; DNS redirect target | Branch architectures | cross-referenced to Book 08 App. C and Ch05 | B08 |
| 33 | SC-7(4): traffic-flow policy per external telecom interface; exceptions documented with need and duration, reviewed | Decision 2 | verified | c08-sp80053 |
| 34 | Long Interim §6.1 "write the policy before you can enforce it" | Decision 2 | restated-as-design; linked Ch10 | — |
| 35 | Boundary change before cutover is a significant change | Decision 3 | restated-as-design; Ch13 owns the evidence | — |
| 36 | Governor controls (BOD 26-02, BOD 26-04, ED 26-03 sequence) | Decision 4 | cross-referenced to Ch05 (verified there) | Ch05 |
| 37 | Replacing MTIPS requires equivalent telemetry (CLAW) | Decision 5 | verified | c08-cisasase |
| 38 | Five decisions carry most of the risk; each fails quietly | Decisions | restated-as-design | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| ssot-network-physics/06 — The single design rule (callout) | Ch08 "The single design rule" | — |
| ssot 06 — mismatch is expensive in both directions | Ch08 "The single design rule" | — |
| ssot 06 — The mapping (table, diagram) | Ch08 "The mapping" and Figure ch08-consistency-network-classes | — |
| ssot 06 — Techniques for needing less global synchronization | Ch08 "The mapping" (learner placement, CRDT merge, clock-based) | strong-local/async, bounded staleness and causal already carried and verified in Ch04; linked, not repeated |
| ssot 06 — A decision procedure | — | carried by Ch04; Ch08 references its third step |
| ssot 06 — The risk this synthesis imports | Ch08 "The one risk, named plainly" (brief) | full treatment in Ch04 "The risk it imports" |
| ssot 06 — parallel obligation: network classes must be governed | Ch08 "Where SD-WAN would enter" (last paragraph) and Ch05 | — |
| ssot 06 — Summary | Ch08 closing callout | — |
| ssot-network-physics/07 — Why the program is the worked example | Ch08 "Worked example" intro | — |
| ssot 07 — The decision, in the paper's terms (callout) | Ch08 "Worked example" paragraph | internal ADR numbers and `src/fmp/canon/adr/` path not carried (unlinkable) |
| ssot 07 — Mapping the architecture to the doctrine (table, diagram) | Ch08 doctrine-to-realization table and Figure ch08-saas-data-plane (reused from staged src-ch07, cross-region replica added) | — |
| ssot 07 — The source of truth: one registry, one writer | Ch08 "One registry, one writer" | — |
| ssot 07 — Token security: the secret that does not exist | Ch08 "Token security on both sides" | mechanism carried in Ch04; Ch08 keeps placement and the cache/refresh and AWS-seam details |
| ssot 07 — The escape hatch | Ch08 "The escape hatch, and the trigger to revisit" | — |
| ssot 07 — Centralize until you measurably cannot | Ch08 same subsection | — |
| ssot 07 — Where SD-WAN would enter — and where it would not | Ch08 "Where SD-WAN would enter, and where it wouldn't" | — |
| ssot 07 — The one risk, named plainly (callout) | Ch08 "The one risk, named plainly" | — |
| ssot 07 — Summary | Ch08 closing callout | — |
| branch-edge-gap §3.3 — The architectures (two ASCII diagrams) | Ch08 "Branch architectures" (architectures B/C and telemetry row) | the ASCII diagrams themselves are replaced by Ch02's figure ch02-branch-edge and Ch08's comparison table |
| branch-edge-gap §8 Rec. 5 — application-to-path routing policy as an authorization artifact | Ch08 Decision 2 and Decision 5 | — |
| tic3-sdwan-vs-dia / network-transport-and-governance — Decision sequence (governor before traffic; boundary change; M365 exception; evidence) | Ch08 Decisions 3–5 | sequence and phase inversion owned by Ch13 |
| the-long-interim §6.1 — write the policy before you can enforce it | Ch08 Decision 2 (linked Ch10) | interim posture owned by Ch10 |
