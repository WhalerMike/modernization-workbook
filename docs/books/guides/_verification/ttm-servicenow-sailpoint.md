# Verification — Guide: Ticket-to-Machine on ServiceNow and SailPoint, an Example Implementation Guide

No claims log existed for this page before this pass; the October 24, 2026 example was checked against vendor documentation and FedRAMP Marketplace data on that date, and its sources were listed on the page and in the deck's backup slides. This log starts with the rewrite of November 1, 2026, which turned the 140-line example into a seven-gate implementation guide and set `research-status: draft`.

Method. Every vendor page footnoted "read November 1, 2026" was opened on that date: SailPoint and ServiceNow documentation through a web fetch, Microsoft Learn through the Microsoft Learn documentation service, and the FedRAMP Marketplace by downloading `products.json` (meta `last_change` 2026-11-01T05:02:56Z) and reading the three listings by ID. Footnotes marked "read October 24, 2026" are carried from the earlier example without a new read. Facts carried from linked chapters (Book 13, Book 15, Book 03, Book 10) rely on those chapters' own logs. No personal name or email address was sent in any request. Neutrality: no agency is named; the Marketplace's partnering-agency field was read but not used.

## Claims log: new or re-read external claims (footnoted)

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | ServiceNow Government Community Cloud: FedRAMP Certified, High, Class D, JAB path, certified 2019-08-12 | G1 availability | verified, unchanged from Oct 24 | `ttm-fr` (F1305072116) |
| 2 | SailPoint ISC: FedRAMP Certified, Moderate, Class C, agency path, certified 2024-06-05 | G1 availability; prerequisites | verified, unchanged from Oct 24 | `ttm-fr` (FR2001938710A) |
| 3 | No other ServiceNow offering in the Marketplace, so a commercial-cloud ServiceNow instance has no listing of its own | G1 availability; Where agencies start | verified by searching every listing's JSON for "servicenow"; only F1305072116 is ServiceNow's own (others mention ServiceNow in leveraged-system lists) | `ttm-fr` |
| 4 | IdentityIQ has no listing of its own; appears in FR2208555094's component list | G1 availability | verified (service description lists "Sailpoint IdentityIQ (IIQ)") | `ttm-fr` |
| 5 | FedRAMP ISC hosted in AWS GovCloud; modules listed include Non-Employee Risk Management; no list of unavailable features | G1 step 2; G7 fixes table (contractor row); What couldn't be verified | verified (vendor page). Replaces the March 2025 press release the example cited for Non-Employee Risk Management | `ttm-sp-fedramp` |
| 6 | Service Desk integration: converts ISC provisioning actions into tickets; Service Request and Incident only; license required; revised 2026-09-21 | Gap 3; prerequisites; G4 step 4 | verified | `ttm-sdim` |
| 7 | Status mapping decides when the ISC provisioning task "is also treated as complete" | Gap 1; G6; dangers | verified | `ttm-sdim-bp` |
| 8 | Service Catalog app: roles, access profiles, entitlements; after SoD checks; approval "defined within ServiceNow"; ISC provisions; status written back | Gap 2; G4 step 3; dangers | verified on the apps overview page | `ttm-apps` |
| 9 | Service Catalog integration page (revised 2026-10-30) now describes a "ServiceNow Portal Integration," a separate Store app needing additional licensing; it no longer states where approval is defined | Prerequisites; What couldn't be verified | verified. **Discrepancy D1** below | `ttm-catalog` |
| 10 | IdentityIQ's ServiceNow integration offers ticket types serviceRequest, incident, changeRequest | Gap 3; G1 | verified at a new address; the Oct 24 address returns 404. No release or revision date on the page | `ttm-iiq-itsm` |
| 11 | Entra ID spoke: ten action categories; Integration Hub subscription; custom Entra app, delegated (auth code) or application (client credentials); connection alias `https://graph.microsoft.com`; no US Government cloud mentioned | Prerequisites; G5 step 2 and availability; What couldn't be verified | verified | `ttm-spoke` |
| 12 | ServiceNow government cloud has an isolated Store instance | G1 step 5 | verified (the page names the environment "Government Security Cloud (GCC)"; the guide says "government cloud") | `ttm-store` |
| 13 | SailPoint Entra connector GCC High endpoints `graph.microsoft.us` and `login.microsoftonline.us`, set through the source-update API | Prerequisites; G3 step 2; G5 availability | verified | `ttm-gov` |
| 14 | GCC uses worldwide Graph endpoints; GCC High `graph.microsoft.us`; US Gov sign-in `login.microsoftonline.us` | How to read; G2, G3, G6 availability | verified | `ttm-graph` |
| 15 | Azure for US Government: PIM, access reviews, entitlement management, Lifecycle Workflows, API-driven inbound provisioning available; ID Governance in GCC, GCC High, DoD | G2 and G5 availability | verified | `ttm-entra-gov` |
| 16 | Native Change Detection: out-of-band create, update, delete detected on aggregation; one event per changed account; not for NELM sources; page now says "SailPoint Human Fabric" | G1 step 3; G3 step 4 | verified | `ttm-ncd-help` |
| 17 | Entra SaaS connector features, including MFA attribute management and session sign-out on disable | G3 step 2; G5 steps 1, 6; G7 fixes; dangers | verified | `ttm-entra` |
| 18 | ServiceNow change types: standard pre-authorized (no group, peer or CAB step); normal two levels of approval; emergency straight to CAB authorization; unauthorized change request on unplanned CI change | G2 lane table | verified | `ttm-chg` |

## Claims carried from the October 24, 2026 example (footnoted, not re-read)

| # | Claim (short) | Where | Source |
|---|---|---|---|
| 19 | Human Fabric naming on SailPoint's product page | G1 step 3 | `ttm-hf` |
| 20 | Service Desk status mapping and configuration; "Failed" status | G6 step 2; G7 fixes | `ttm-status` |
| 21 | Lifecycle states evaluated on refresh; previous-state access revoked; leaver disables | Loop at a glance; G7 fixes | `ttm-lcs` |
| 22 | Identity Attributes Changed trigger | Loop at a glance; G7 fixes | `ttm-trig` |
| 23 | Native Change Account Updated trigger | Loop at a glance; G7 fixes | `ttm-ncd` |
| 24 | Certifications; unsigned revoke decisions not applied | Loop at a glance; G7 fixes | `ttm-certs` |
| 25 | Workflows; can't be created enabled | Loop at a glance; G4 step 2; G7 fixes | `ttm-wf` |
| 26 | Cloud connectors call Graph from SailPoint's cloud; AD through the virtual appliance | G1 step 4; G3 step 2; dangers | `ttm-ad` |
| 27 | ISC Search | G6 step 3 | `ttm-search` |
| 28 | Access-request approvals by owner, manager or governance group | G2 step 2 | `ttm-appr` |
| 29 | Oracle HCM Cloud connector: direct read, no appliance; writes back only user name and work email; partial mover support | G2 step 1; G7 fixes | `ttm-hcm` |

## Claims carried from the books and the kit (linked, not footnoted)

| # | Claim (short) | Where in guide | Source section |
|---|---|---|---|
| 30 | The loop's five steps; lanes; tempo P1–P4; evidence record; five measures | Throughout | B13 Ch10; App B |
| 31 | CM-3(1) and CM-6(1) are High only; CM-3, CM-3(2), CM-4(2) Moderate; AU-14 in no baseline; SA-9 L M H | Gate requirement tables | B13 App A |
| 32 | Authority classes A0–A3 and the triage order; Ask for Approval timeout | G2; G4; G5 | B15 Ch03 |
| 33 | Spoke coverage and gaps (no MFA-reset action; reset for cloud-only users) | G5 step 2 | B15 Ch03 |
| 34 | PIM ticket number not checked; SIEM rule; Entra log retention 30 days on P1/P2 | G5 step 5; Evidence | B15 Ch03 |
| 35 | Help desk verification follows SP 800-63B-4 | G5 step 6 | B15 Ch03 |
| 36 | Drift classes and severities; first-month burst | G3 | B03 Ch11 |
| 37 | Entra inbound provisioning as the one writer; middleware duties | Gap 4; G2 | B03 Ch05 |
| 38 | Kit builds 1–3, permissions, tests (45 pytest, 40 Pester, 13 node:test on Oct 24), lab items, Pass 2 plan, verify list | G3–G7 Validate | Integration kit page and README. Re-run on November 1, 2026: pytest 45 passed, node:test 13 passed (Pester not run) |
| 39 | VK-HR-01 (no employeeId), VK-HR-04 (duplicate employeeId), VK-NPI-02, VK-NPI-05 exist and report what the guide says | G1, G3, G5 Validate | `examples/validation-kit` catalog |

## Design guidance and inference introduced in this rewrite

The lane-to-product mapping (G2), the approver-per-class example, the one-writer patterns, the interim paths, the gate structure and the treatment of vendor-cloud actions as recorded data flows are the program's, labeled on the page. The CM-8 reading for identities in G3 is marked *(inference)*.

## Discrepancies

- **D1.** SailPoint's apps overview says Service Catalog requests follow the approval process defined in ServiceNow and write status back; its Service Catalog integration page, revised October 30, 2026, now describes a "ServiceNow Portal Integration" and states neither. The guide cites the overview for the behavior and lists the change under What couldn't be verified.
- **D2.** The IdentityIQ ServiceNow page moved; the old address returns 404. The new page lists `changeRequest` without a release or date.

## Removed from the page in this rewrite

- The "loop, step by step" table and the "federal availability and cautions" section: their content moved into the loop at a glance and each gate's Availability and steps.
- The availability matrix row for SailPoint's ServiceNow apps in GCC and GCC High ("not confirmed"): replaced by the government-Store check in G1 and the What couldn't be verified list.
- The March 4, 2025 SailPoint press release on Non-Employee Risk Management: replaced by SailPoint's current FedRAMP page (claim 5).
