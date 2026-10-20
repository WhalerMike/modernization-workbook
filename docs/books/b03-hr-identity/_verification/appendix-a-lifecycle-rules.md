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
