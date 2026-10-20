# Verification — Chapter 01 (Access Is a Policy Decision)

File covered: `01-access-is-a-policy-decision.md`.
Diagram sources: `docs/images/diagrams/b04-access/src/ch01-policy-decision.flow.yaml`, `ch01-membership-vs-policy.flow.yaml`.
All sources opened on October 20, 2026. M-22-09, NIST SP 800-207 and the CISA ZTMM v2.0 PDF were downloaded and read as extracted text; Microsoft Learn pages were fetched through the Microsoft Learn MCP tools.

## 1. Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | M-22-09: federal apps can't rely on perimeter protections; users log into applications, not networks | §Every request | verified | M-22-09, Overview (p. 2) |
| 2 | M-22-09: in ZTA every request for access should be evaluated; requires continuous evaluation of active sessions; mitigations = reauthentication, limited access, denial | §Every request | verified | M-22-09, §A.3 "User Authorization" |
| 3 | M-22-09: many federal models are static RBAC; ZTA should add granular, dynamic permissions (ABAC) | §Every request, §What goes wrong table | verified | M-22-09, §A.3 |
| 4 | M-22-09: at least one device-level signal alongside identity | §Every request | verified | M-22-09, §A.3 |
| 5 | SP 800-207 tenet 2: network location alone doesn't imply trust | §Every request, table | verified | SP 800-207 §2.1 tenet 2 |
| 6 | SP 800-207 tenet 3: per-session access, least privilege; auth to one resource doesn't grant another | §Every request | verified | SP 800-207 §2.1 tenet 3 |
| 7 | SP 800-207 tenet 4: dynamic policy on client identity, app/service, requesting asset, behavioral and environmental attributes | §Every request | verified | SP 800-207 §2.1 tenet 4 |
| 8 | ZTMM identity pillar: right resources, right time, right purpose, no excessive access; tailored context-based authorization | §Every request | verified | CISA ZTMM v2.0 §5.1 |
| 9 | PDP = policy engine (decides, logs; uses enterprise policy plus external inputs) + policy administrator (sets up/shuts down path, generates session token); PEP enables, monitors, terminates connections | §Decision point | verified | SP 800-207 §3 |
| 10 | One decision point vs per-app decisions: single readable, testable policy | §Decision point | restated-as-design | Program argument |
| 11 | Conditional Access is Microsoft's Zero Trust policy engine; brings signals together, decides, enforces | §CA as policy engine | verified | Learn, "What is Conditional Access?" |
| 12 | CA policies are if-then statements; signal list (user/group/agent, IP location, device, application, ID Protection risk); decisions block or grant with listed controls | §CA as policy engine | verified | Learn, "What is Conditional Access?" |
| 13 | Mapping: CA = PE, token issuance = PA, apps/gateways = PEP | §CA as policy engine | restated-as-design | Labeled in text as the program's interpretation, not a published mapping |
| 14 | CA enforced after first-factor authentication; not front-line DoS defense | §CA as policy engine | verified | Learn, "What is Conditional Access?" (Important note) |
| 15 | CAE re-evaluates on critical events (disable, password reset, token revocation) and CA condition changes (network location), near real time | §CA as policy engine, table | verified | Learn, "Best practices for Microsoft Entra roles," §10 table |
| 16 | All applicable policies must be satisfied (AND); no ordering | §How the decision is computed | verified | Learn, "Build a Conditional Access policy" |
| 17 | Block stops enforcement; user blocked | §How the decision is computed | verified | Learn, "Build a Conditional Access policy" (Phase 2, 2.2) |
| 18 | "Require one of the selected controls" prompts in defined order | §How the decision is computed | verified | Learn, "Build a Conditional Access policy" |
| 19 | Assignments inside a policy combine with AND | §How the decision is computed | verified | Learn, "Build a Conditional Access policy" |
| 20 | Exclude overrides include | §How the decision is computed | verified | Learn, "Conditional Access: Users, groups, agents, and workload identities" |
| 21 | Source principle 4: "Session controls are additive; most restrictive wins (shortest sign-in frequency)" | Not used | unverifiable | No Microsoft Learn statement found on combining session controls across policies; left to Chapter 03's writer to verify |
| 22 | Policies evaluated in report-only as well as enabled (phase 1); policy impact view and sign-in log report-only tab | §Deploy as a decision | verified | Learn, "Build a Conditional Access policy"; "Analyze Conditional Access policy impact" |
| 23 | Report-only first, measure, promote as separate change; confirm break-glass exclusion before enforcing | §Deploy as a decision | restated-as-design | Program deployment method (from the principles library); consistent with Book 02 Ch09 |
| 24 | Exclusions other than emergency access need owner, reason, expiry | §How the decision is computed | restated-as-design | Program policy |
| 25 | Dynamic groups usually processed within a few hours, can exceed 24 hours; factors | §Attribute-driven targeting | verified | Learn, "Understand and manage dynamic group processing" |
| 26 | Source GPO table: "Real-time group evaluation, no replication lag" | §From Group Policy | corrected | Dynamic membership is asynchronous and can take more than 24 hours (#25); table now notes the delay |
| 27 | Unpopulated attributes → users/devices fall outside dynamic groups → policy bypass | §Attribute-driven targeting | restated-as-design | Logical consequence of include-only targeting; program caution carried from the principles library |
| 28 | Risk-based CA requires Entra ID P2 (ID Protection) | §From Group Policy table | verified | Learn, "What is Conditional Access?" (License requirements) |
| 29 | Source GPO table row "Drive mapping / printer deployment → device configuration" | §From Group Policy | corrected | Not an access decision; moved out of the access table with a pointer to the devices book |
| 30 | Filters for devices can target policies (e.g., PAWs) | §From Group Policy table | verified | Learn, "What is Conditional Access?" (Device signals) |

## 2. Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| `docs/libraries/conditional-access-principles.md` — Purpose | Ch01 §CA as policy engine | — |
| conditional-access-principles — Policy evaluation model (additive; no priority) | Ch01 §How the decision is computed | — |
| conditional-access-principles — Key principles 1, 2, 3, 5 | Ch01 §How the decision is computed (rules 1–5) | — |
| conditional-access-principles — Key principle 4 (session controls additive) | Not carried | Unverified (claims log #21); flagged for Chapter 03 |
| conditional-access-principles — Deployment methodology | Ch01 §Deploy as a decision; links Book 02 Ch09 and Ch07 | — |
| conditional-access-principles — Break-glass procedure | Ch02 §Break-glass (corrected to current Microsoft guidance) | — |
| conditional-access-principles — GPO-to-CA transformation table | Ch01 §From Group Policy (corrected; drive/printer row moved out) | — |
| conditional-access-principles — Targeting (dynamic groups from extension attributes; unpopulated-attribute warning) | Ch01 §Attribute-driven targeting | — |
| conditional-access-principles — Full library pointer (40+ policies, JSON, named locations, strengths) | Not carried | Pointer to the source repo only; the library itself is Chapter 07 and Appendix A |
| `docs/operational-guides/access-plane/index.md` — intro (access plane as enforcement surface for CA, ZT segments, privileged workflows; replaces perimeter model) | Ch01 §Every request, §Decision point | — |
| access-plane/index — download bundle callout | Not carried | Site-build artifact; the book has its own Word edition |
| access-plane/index — F.1 MFA | Not carried here | Phishing-resistant MFA is Book 02 Ch10; authentication strengths are Chapter 03 |
| access-plane/index — F.2 Zero Trust model | Ch01 (closing link to `../../modernization-specs/zero-trust.md`) | — |
| access-plane/index — F.3 SASE | Not carried | Network-access topic; belongs to the Network & Transport book (B09) |
| access-plane/index — F.4 Certificate-based authentication | Not carried here | Book 02 Ch10 and the PKI book (B07) |
| access-plane/index — F.5 Privileged access management (PIM self-request; CyberArk adapter) | Ch02 §Just in time (links Ch08, Appendix B) | CyberArk adapter not carried: vendor integration, for the Chapter 04 or Chapter 10 writer |
| access-plane/index — F.6 Break-glass accounts | Ch02 §Break-glass | — |
