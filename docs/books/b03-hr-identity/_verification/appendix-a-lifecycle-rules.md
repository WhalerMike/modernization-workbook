# Verification — appendix-a-lifecycle-rules.md

Editor pass 2026-10-20. The appendix had no footnotes; external claims are now footnoted. Lifecycle rules themselves (precedence, quarantine contract, manager-link rules, rehire/conversion handling) are program design.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Entra provisioning applies its own scoping filter | Scope | verified | MS Learn, API-driven inbound provisioning FAQ (`[^aA-api-faqs]`) |
| 2 | 4xx NOA family = nonpay/nonduty status; furlough, LWOP, suspension | Leave is not a leaver | verified; added examples 450 Suspension, 460 LWOP, 471/472 Furlough | OPM GPPA Oct 2026, Ch. 1 and Ch. 15 (`[^aA-gppa]`) |
| 3 | 2xx NOA family = return to duty | Leave is not a leaver | verified | GPPA Ch. 1, Ch. 16 |
| 4 | NOA 001/002 = cancellation/correction | Rescinded offers | verified; named (001 Cancellation, 002 Correction) | GPPA Ch. 32 |
| 5 | Details and secondments are movers | Leave is not a leaver | restated-as-design | — |
| 6 | Block steps: disable and revoke sessions | Partial leavers | verified; added that LCW has built-in "Disable user account" and "Revoke all refresh tokens for user" tasks and that the disable task doesn't support users with Entra role assignments or role-assignable group membership/ownership, so privileged leavers need their own path | MS Learn, Lifecycle Workflow built-in tasks (`[^aA-lcw-tasks]`) |
| 7 | Rehire re-links via the enterprise person key | Rehire and conversion | verified mechanism; added that matching uses a configured attribute pair (default `externalId` ↔ `employeeId`) | API-driven inbound provisioning FAQ |
| 8 | `manager` carries approvals | Manager links | verified (entitlement management finds the approving manager from the Manager attribute) | MS Learn, access package approval settings (`[^aA-ap-approval]`) |
| 9 | Scope filter, precedence rules, quarantine contract, manager-link integrity, conversion risk review | throughout | restated-as-design | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited: `part: Appendix`, `series-order` 20 → 90, `lifecycle_review` → 2027-04-01 | — |
| Thesis, In this appendix | kept | — |
| Scope | edited (scoping-filter footnote) | — |
| Leave is not a leaver | edited (NOA examples, footnotes) | — |
| Precedence + diagram appa-event-precedence | kept; source unchanged | — |
| Rescinded offers and cancellations | edited (NOA names, footnote) | — |
| Partial leavers | edited (LCW task names and the role-assignment limitation) | — |
| The quarantine contract | kept | — |
| Manager links | edited (footnote) | — |
| Rehire and conversion | edited (matching-pair sentence) | — |
| Continue callout | edited to "Continue the book" / "Book index"; Previous title now "Chapter 13 — Reference Deployment (Illustrative)" | — |

## Addition, October 25, 2026: Oracle Core HCM to Entra implementation research

Applied from the research page `docs/research/hcm-entra-implementation.md`; every source below was opened on Oct 25, 2026.

| # | Claim | Where | Verdict | Source note |
|---|---|---|---|---|
| 1 | Quarantine contract = middleware quarantine of failed records | The quarantine contract | confirmed; distinguished from Microsoft's provisioning-job quarantine | — |
| 2 | Microsoft job quarantine: causes incl. empty notification email and accidental-deletion trips; notification email; cycles daily; disabled after four weeks | The quarantine contract | added | aA-ms-quar; aA-ms-config; aA-ms-accdel |
| 3 | Each quarantine needs its own runbook | The quarantine contract | added (design guidance) | aA-ms-quar |

## Additions, October 30, 2026 (the contractor PIV path)

Added at the author's request. The path is set in Chapter 09, "The contractor PIV path", and its sources are logged in `_verification/09-credentials-and-certificates.md` (October 29) and the research page's log.

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Contractor leavers: earliest end wins (conditions from Ch06); the middleware computes and sends the leave date and `active` false | Contractor leavers | design (labelled); conditions restated from Ch06 | — |
| 2 | The card system is a leaver input for contractors and drift for employees | Contractor leavers | design; restated from Ch09 | — |
| 3 | The end date as the notice that starts the 18-hour clock | Contractor leavers | restated from Ch09 (FIPS 201-3 §2.9.4 verified there) and linked | — |
| 4 | No record, no card | Contractor leavers | design | — |
| 5 | "In this appendix" lists the new section | Callout | editorial | — |
