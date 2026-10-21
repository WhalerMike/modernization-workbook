# Verification — Chapter 04, Logical Centralization and Token-Based Security

File: `docs/books/b09-network/04-logical-centralization-and-token-security.md`
Diagram sources: `docs/images/diagrams/b09-network/src/ch04-ssot-vs-fragmented.flow.yaml` (copied from `src-ch01-ssot-vs-fragmented`, header comment renumbered; content correct) and `ch04-perimeter-vs-token.flow.yaml` (copied from `src-ch02-perimeter-vs-token`, header renumbered; content correct). Both `src-` copies deleted.
Checked 2026-10-21 against Microsoft Learn (Msv3/M-family VM sizes; identity platform access tokens and claims validation; Azure Database for PostgreSQL Entra authentication and managed identity; Azure Cosmos DB consistency levels), NIST CSRC (SP 800-207), OMB M-22-09 (PDF text extracted) and the HAL/SSS 2011 record of the CRDT paper.
Sources: *The Physics of a Single Source of Truth* chapters 01 and 02 (primary), 06 (consistency techniques and decision procedure only; the class-to-network mapping table belongs to Ch08), 00 and 07 (only the points listed in the ledger). Footnote keys drop the `c04-` prefix.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | A single server carries "dozens of cores, hundreds of GB to multiple TB of RAM, NVMe delivering millions of IOPS" | Objection | corrected: stated with a documented example (up to 832 vCPUs, ~15 TiB, remote storage 130,000–260,000 IOPS); "millions of IOPS" dropped as unverified for a single documented VM | msv3 |
| 2 | "The overwhelming majority of organizations never outgrow a single well-provisioned database" | Objection | restated-as-design (scale up before scaling out; shard on a measured limit) | — |
| 3 | Copies are liabilities; reconciliation cost | Objection | restated-as-design (argument) | — |
| 4 | SSOT properties table | What SSOT buys | restated-as-design | — |
| 5 | Every claim has one canonical source (program operating principle) | What SSOT buys | restated-as-design; repo-internal `AGENTS.md`/ADR references removed (not workbook pages) | — |
| 6 | Logical vs physical centralization | Logical/physical | restated-as-design | — |
| 7 | Small databases repurposed as caches and stamps; SQLite-at-the-edge as derived copies | Small databases | restated-as-design ("SQLite" product name dropped; pattern kept generically) | — |
| 8 | Drift born from unofficial convenience copies | Drift | restated-as-design | — |
| 9 | Perimeter isolation drove fragmentation | Token security | restated-as-design | — |
| 10 | Zero trust: no implicit trust based on network location | Token security | verified (added) | sp800207 |
| 11 | M-22-09: MFA at application layer; network not less risky than internet | Token security | verified (added) | m2209 |
| 12 | Perimeter vs token table | Token security | restated-as-design | — |
| 13 | Multitenant service verifies signature against issuer keys (JWKS, RS256), reads `tid`, binds tenant per request | Inbound | verified and sharpened: Microsoft's documented checks (signing-key issuer, `tid` GUID matches `iss`, `tid` part of data key); "RS256" not repeated | access-tokens |
| 14 | Never allow one tenant's data to be accessed from another | Inbound / risk | verified (added) | claims |
| 15 | PostgreSQL flexible server accepts an Entra token as the password; managed identity; no stored credential | Outbound | verified | pg-mi; pg-entra |
| 16 | Token cached and refreshed before expiry | Outbound | corrected/sharpened: Microsoft documents token validity 5–60 minutes, acquired just before connecting; caching/refresh kept as general description, not as a product claim | pg-entra |
| 17 | OSSRDBMS audience differs for US Government clouds | Outbound / residual | verified in general form (resource value differs by cloud; look up per cloud) | pg-entra |
| 18 | AWS RDS-IAM token provider satisfies the same seam | Outbound | removed (program code detail; not needed for the argument) | — |
| 19 | Program's `fmp.saas.pg_auth`, `tid`-to-namespace middleware, ADR numbers | Inbound/outbound | not carried here: Ch08 owns the SaaS data-plane worked example; referenced by link | — |
| 20 | Inbound + outbound tokens remove shared trust zone, long-lived secret; per-request scoping | Why safe | restated-as-design | — |
| 21 | Token security removes access friction, so less forking | Why safe | restated-as-design | — |
| 22 | Blast radius moves into the isolation code path; must be small, tested, fail-closed | Risk | restated-as-design (from series ch06/07) | — |
| 23 | Data residency survives token security; stamp exception; sovereign audiences | Residual constraint | restated-as-design | — |
| 24 | Five consistency levels in a documented product | Consistency | verified (added) | cosmos |
| 25 | Multi-region strong write latency = 2 × RTT + 10 ms at P99; > 8,000 km blocked by default | Consistency | verified (added; replaces the series' undocumented "strong consistency across continents is a latency problem" with a vendor-documented figure) | cosmos |
| 26 | Bounded staleness: lag bounded by K versions or T time | Consistency | verified | cosmos |
| 27 | Strong-local / async-remote; causal; witness/learner placement | Consistency | restated-as-design | — |
| 28 | CRDTs (Shapiro et al., 2011) | Consistency | verified; full citation (SSS 2011, LNCS 6976; INRIA RR-7687) | crdt |
| 29 | Clock-based concurrency (Spanner/TrueTime) | Consistency | not carried here (clock distribution belongs to Ch05; mapping to Ch08) | — |
| 30 | Three-question decision procedure | Consistency | restated-as-design; question 3 handed to Ch08 | — |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| ssot 01 — The objection that no longer holds | Ch04 "The objection that no longer holds" | — (hardware figures corrected, claim 1) |
| ssot 01 — What a single source of truth actually buys (table) | Ch04 "What a single source of truth buys" | — |
| ssot 01 — Logical vs. physical: the distinction that does the work | Ch04 "Logical and physical centralization" (callout kept) | — |
| ssot 01 — Small databases are not dead — they are repurposed | Ch04 "Small databases survive, repurposed" | "Chapter 7, the program decision" stamp detail left to Ch08 |
| ssot 01 — Where drift is actually born | Ch04 "Where drift is born" | — |
| ssot 01 — Summary | Ch04 "What this chapter establishes" | — |
| ssot 01 — figure ch01-ssot-vs-fragmented | Ch04 figure `ch04-ssot-vs-fragmented` | — |
| ssot 02 — Why this is the keystone | Ch04 "Token-based security as the enabler" | — |
| ssot 02 — The shift: from perimeter to identity (table) | Ch04 same section, table kept | — |
| ssot 02 — figure ch02-perimeter-vs-token | Ch04 figure `ch04-perimeter-vs-token` | — |
| ssot 02 — Inbound: identity travels with the request | Ch04 "Inbound: identity travels with the request" (generalized to Microsoft's documented multitenant validation) | Program-specific middleware and ADR → Ch08 |
| ssot 02 — Outbound: the database password disappears (incl. callout) | Ch04 "Outbound: the database password disappears" (callout kept) | `fmp.saas.pg_auth`, RDS-IAM seam not carried (claims 18–19) |
| ssot 02 — Why this makes centralization safe | Ch04 "Why this makes centralization safe" | — |
| ssot 02 — paragraph on carrying token security to the transport path | Ch04 one-line pointer to Ch05 | Ch05 owns governed-path transport |
| ssot 02 — The friction it removes | Ch04 "Why this makes centralization safe" (last paragraph) | — |
| ssot 02 — The residual constraint | Ch04 "The constraint token security doesn't remove" | — |
| ssot 02 — Summary | Ch04 "What this chapter establishes" | — |
| ssot 06 — The single design rule | Ch04 "Consistency classes" (question 3) and pointer | Ch08 owns the rule and its mapping |
| ssot 06 — The mapping (table) and figure ch06-consistency-alignment | — | Ch08 owns (staged `src-ch06-consistency-alignment` left for W4) |
| ssot 06 — Techniques for needing less global synchronization | Ch04 "Consistency classes" bullet list | Clock-based concurrency → Ch05/Ch08 |
| ssot 06 — A decision procedure | Ch04 numbered procedure | — |
| ssot 06 — The risk this synthesis imports | Ch04 "The risk it imports" | Transport-governance paragraph → Ch05 |
| ssot 06 — Summary | Ch04 summary (consistency points) | — |
| ssot 00 — three forces; logical vs physical callout | Ch04 opening (by reference to Ch01) and callout | Ch01 owns the pendulum, forces table and figure |
| ssot 07 — The one risk, named plainly | Ch04 "The risk it imports" (generic form) | Program-specific form → Ch08 |
| ssot 07 — all other sections | — | Ch08 owns the SaaS data-plane worked example |
