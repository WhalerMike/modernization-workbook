# Verification — Chapter 01 (Why Modernization Is Hard)

File: `01-why-modernization-is-hard.md`. Diagram sources: `docs/images/diagrams/b01-transformation-arc/src/ch01-four-eras.flow.yaml`, `ch01-session-vs-token.flow.yaml`, `ch01-cascade.flow.yaml` (replace five inline mermaid diagrams).
Sources opened October 21, 2026. M-22-09, M-26-14, the FDCCI memo, the 25 Point Plan, the CISA ZTMM v2.0 PDF and ITU-T G.114 were downloaded and read as extracted text.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Mainframe era: one machine held data and enforced access; physical perimeter | §One machine | restated-as-design | Narrative framing from the whitepaper; no dates or product models asserted (whitepaper's "IBM System/360" and "1940s–1990s" dropped) |
| 2 | Late-1980s decentralization; regional databases and domains; "distributed truth" | §Distributed truth | restated-as-design | Narrative framing; "original sin" kept as the program's reading |
| 3 | FDCCI launched Feb 26, 2010; data centers 432 (1998) to >1,100 (2009) | §Consolidation | verified | OMB FDCCI memo, Feb 26, 2010 |
| 4 | Dec 9, 2010 reform plan: close ≥800 data centers by 2015; "Cloud First" | §Consolidation | verified | 25 Point Implementation Plan, items 1 and 3 |
| 5 | "Around 2010 your agency started consolidating compute" (whitepaper) | §Consolidation | corrected | Anchored to FDCCI and the 25 Point Plan instead of an agency-specific claim |
| 6 | Security layering (firewalls, NAT, IDS, proxies, DLP inline) | §Consolidation | restated-as-design | Program observation |
| 7 | M365, multi-cloud workloads, HR platform as next boundary; twelve regional AD domains | §Breaking point | restated-as-design | Generalized: whitepaper's agency-specific details (twelve domains, named states, named clouds, "OPM HRIT on Oracle OCI", "benefit") removed for agency neutrality; HR platform linked to Book 03 Ch 03 instead of restated |
| 8 | Same person as several contradictory records; errors hide (duplicates, unclosed records) | §Breaking point | restated-as-design | Whitepaper Figure 5 / Act 3 kept as a pattern; whitepaper's "duplicate payments across states" generalized |
| 9 | Commercial industries solved this 2014–2022 | §Breaking point | restated-as-design | Dates unverifiable as a single claim; kept as program position without dates |
| 10 | Default TGT lifetime 10 hours, renewal 7 days | §Session problem | verified | Learn, Max-Ticket-Age; Max-Renew-Age |
| 11 | Service tickets 600 minutes; open connections not interrupted; disabled accounts keep earlier tickets | §Session problem | verified | Learn, "Maximum lifetime for service ticket" |
| 12 | Zero Trust is the strategy M-22-09 directs agencies to adopt | §Session problem | verified | M-22-09 |
| 13 | SP 800-207: no implicit trust from network location; per-session access; dynamic policy | §Session problem | verified | NIST SP 800-207 page and abstract |
| 14 | "Each request carries short-lived proof… like text messages" (source) | §Session problem | corrected | CAE page: access tokens 1 hour by default; up to 28 hours in CAE sessions; revocation on critical events in near real time, up to 15 minutes propagation. Analogy changed to a badge checked at each door against a revocable central list |
| 15 | CAE can revoke on critical events (account disabled, password reset, high user risk) | §Session problem | verified | Learn, "Continuous access evaluation" |
| 16 | Long-lived-session apps break behind re-evaluation and inspection | §Session problem | restated-as-design | Program observation, stated as common not universal |
| 17 | NAT / source-IP change breaks Kerberos tickets (whitepaper figure 4: "80 ms against a 5 ms Kerberos timeout") | §Distance | corrected | RFC 4120 §5.3 (`caddr` optional, addressless tickets recommended because of NAT) and §3.2.3 (`KRB_AP_ERR_BADADDR` at the application server); Learn KDC keys (`ClientIpAddresses` 0 because of DHCP and NAT). No 5 ms timeout exists |
| 18 | Five-minute figure is clock skew; client waits 10 s, retries 3 times | §Distance | verified | Learn, Kerberos registry entries and KDC configuration keys |
| 19 | Hybrid joined devices need DC line of sight for initial sign-in, password change, policy updates | §Distance | verified | Learn, "Microsoft Entra joined vs. Hybrid Microsoft Entra joined in cloud-native endpoints" |
| 20 | Periodic line of sight; device password change, user password change (cached creds), TPM reset break | §Distance | verified | Learn, "Plan your Microsoft Entra hybrid join implementation" |
| 21 | Whitepaper: "SYSVOL/GPO, password change, hybrid join registration each documented as requiring line-of-sight" | §Distance | corrected | Restated to what Microsoft documents (row 19, 20); SYSVOL detail left to Book 09 Ch 06, which sources it |
| 22 | Fiber 5 µs/km (≈200,000 km/s) | §Physics callout | verified | ITU-T G.114 (05/2003) Table A.1 |
| 23 | Portland–Washington "≈4,500 km straight line, ≈5,400 km fiber, 27 ms one way, 54 ms RTT" | §Physics callout | corrected | Great-circle computation from city-center coordinates (haversine): ≈3,780 km. With the whitepaper's own 20% route allowance (labeled an assumption): ≈4,530 km, ≈23 ms one way, ≈45 ms RTT |
| 24 | Bandwidth doesn't change propagation | §Physics callout | verified | Follows from row 22 (propagation is distance × 5 µs/km) |
| 25 | Microsoft recommends Entra join where line of sight is a concern; hybrid join is a waypoint | §Distance | verified | Learn, "Microsoft Entra hybrid joined devices"; settled book fact (brief) |
| 26 | AD risk list (never set up cleanly; stacked consolidation; nobody owns it; ungoverned nested groups) | §Directory problem | restated-as-design | Program observation; the mermaid group example folded into prose |
| 27 | Microsoft continues to support and enhance Windows Server AD | §Directory problem | verified | Learn, "New name for Azure Active Directory" FAQ |
| 28 | AD DS still supported in WS2025, new functional levels | §Directory problem | verified | Learn, "What's new in Windows Server 2025" |
| 29 | Microsoft cloud-first guidance: Entra ID manages identity, AD minimized, phased SOA transfer | §Directory problem | verified | Learn, "Microsoft Entra cloud-first identity guidance for IT architects" |
| 30 | Five states, multi-year effort; transformation isn't only the identity team's job (names device, network, security, app, HR, procurement, operations teams) | §Directory problem | verified | Learn, "Cloud transformation posture" |
| 31 | M-22-09: centralized identity management; phishing-resistant MFA for staff, contractors, partners | §Directory problem | verified | M-22-09, Identity actions |
| 32 | M-22-09 targets end of FY2024 | §Cascade | verified | M-22-09 (goals "by the end of Fiscal Year (FY) 2024") |
| 33 | BOD 25-01 (Dec 17, 2024): SCuBA baselines for M365; mandatory policies by June 20, 2025; continuous reporting | §Cascade | verified | CISA BOD 25-01 page (added) |
| 34 | M-26-14 (May 22, 2026) rescinds M-21-31 | §Cascade, prerequisites table | verified | M-26-14 text ("Effective immediately, OMB Memorandum M-21-31 is rescinded") |
| 35 | "Five prerequisites recur in federal Zero Trust guidance" (source) | §What has to be true | restated-as-design | Not a published list; restated as the program's synthesis, with each row anchored to the specific source passage |
| 36 | ZTMM v2.0 (April 2023): five pillars, three cross-cutting capabilities, four stages | §What has to be true | verified | CISA ZTMM v2.0 PDF |
| 37 | Program activities per prerequisite (nightly drift compare, signed plans, eleven-category inventory) | §Book does about it | restated-as-design | Program design; chapter numbers updated (see ledger) |
| 38 | Dynamic membership groups need Entra ID P1; governance features in Entra ID Governance; Intune for devices | §Book does about it | verified | Learn, "Manage rules for dynamic membership groups"; Learn, "Microsoft Entra licensing" |
| 39 | Whitepaper: FedRAMP 20x Consolidated Rules make this "a compliance deadline" for agencies | not carried | removed | Out of this chapter's scope (FedRAMP authorizes cloud services; the whitepaper's framing of it as an agency deadline needs the roadmap owner's verification). Left to W5's roadmap/journey chapters |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Ch 01 (series prologue) — H1 "Prologue — Why Modernization Is Hard…" and bold subtitle | H1/title fixed to "Chapter 01 — Why Modernization Is Hard"; italic thesis line | Bold-paragraph subtitle replaced per style rules |
| Ch 01 — "Who this is for" blockquote | Opening paragraph after the figure | Old "chapters 00–10" reference replaced |
| Ch 01 — The World We Built (post-office analogy, mermaid "2003: Everything Local") | §How the estate got here (mainframe and distributed eras) and Figure ch01-four-eras | Post-office analogy merged into the eras narrative; mermaid removed |
| Ch 01 — Shift 1: Servers left the building | §Consolidation and the security era | Verified with FDCCI / 25 Point Plan |
| Ch 01 — Shift 2: The internet became the network | §The breaking point | — |
| Ch 01 — Shift 3: Security got layered on top (mermaid checkpoint chain) | §Consolidation and the security era | Mermaid removed; content in prose |
| Ch 01 — The Session Problem (mermaid phone vs text) | §The session problem; Figure ch01-session-vs-token | Analogy corrected (row 14); chapter refs 07/08 kept |
| Ch 01 — The Directory Problem Nobody Talks About (mermaid group sprawl) | §The directory problem | Mermaid example folded into the last bullet |
| Ch 01 — The Cascade (mermaid) | §The cascade; Figure ch01-cascade | BOD 25-01 and M-26-14 added as dated mandates |
| Ch 01 — What Has to Be True | §What has to be true | Restated as program synthesis (row 35); source column added |
| Ch 01 — What the Series Does About It | §What the book does about it | Chapter numbers renumbered: 04,09→04,12; 00,02→02,10; 05,08 unchanged; 03,09→11,12; 01,03→03,11; budget refs 01→03, 09→12, 10→09; "Depth" column links Books 02–05 |
| Ch 01 — The Bottom Line | §The bottom line | "Chapter 00" link renamed Chapter 02 |
| Ch 01 — Next link; Authoritative references list | "Continue the book" callout; footnotes | Reference list folded into footnotes |
| Whitepaper — Table of contents | not carried | Word artifact |
| Whitepaper — Executive Summary | §How the estate got here (four eras), §breaking point ("architecture gap"), §distance (physics) | FedRAMP 20x paragraph not carried (row 39); five-principles summary belongs to the journey chapters (W5) |
| Whitepaper — Figure 1 (rId19.png, forty years in one view) | Figure ch01-four-eras | Replaced with house-style source |
| Whitepaper — Prologue: The Mainframe Era (+ Figure 2, rId24) | §One machine, one truth; first card of ch01-four-eras | "Truth and enforcement in one box" kept as the seed of the way forward |
| Whitepaper — Act 1: The Great Decentralization (+ Figure 3, rId29) | §Distributed systems, distributed truth; second card | State names and "twelve regional offices" generalized |
| Whitepaper — Act 2: When Security Ate the Architecture (+ Figure 4, rId37) | §Consolidation and the security era; §What distance does and doesn't cost | Figure 4's "5 ms Kerberos timeout" removed as wrong (row 17); Kerberos ticket facts verified (rows 10, 11, 17, 18) |
| Whitepaper — Act 2 physics callout (Portland–Washington) | §Physics callout | Distance and floor corrected (row 23) |
| Whitepaper — Act 2: Asymmetric routing; SD-WAN overlay | not carried here | Network transport mechanics belong to Chapter 08 (W4) and Book 09 Ch 05; linked via Book 09 |
| Whitepaper — Act 3: The Breaking Point (+ Figure 5, rId43; "hard realization" box) | §The breaking point; fourth card of ch01-four-eras | Agency-specific environments generalized (row 7) |
| Whitepaper — The Physics Argument Decision Makers Have Not Heard; satellite; 5G (+ Figure 6, rId48) | not carried here | Transport content for Chapter 08 (W4) / Book 09 Ch 02 |
| Whitepaper — Application-aware networking; SD-WAN multipath; FEC; DIA tables; commercial-timeline table; DIA vs NIST controls (Figures 7, 8) | not carried here | Access plane and network content for Chapter 08 (W4); "commercial sectors moved first" kept only as a one-line position (row 9) |
| Whitepaper — Act 4 structural move (directory conflated truth and enforcement) | Fifth card of ch01-four-eras; Chapter 02 | Principles 1–5, FedRAMP 20x, mainframe gateway, framework alignment, call to action and provenance appendix belong to W5's journey/roadmap chapters |

Sections of `docs/modernization/index.md` and `00-introduction.md` are logged in `_verification/02-the-problem.md`.
