# Verification — appendix-c-acceptance-and-cutover.md

Editor pass 2026-10-20. The appendix had no footnotes. The acceptance scenarios, the seven-day sole-source window and the sign-off roles are program design.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Account exists disabled before day one; baseline ready on day one | Acceptance table | verified mechanism (LCW pre-hire template: TAP; new-hire template: enable account, add to groups) | MS Learn, Plan a Lifecycle Workflow deployment (`[^aC-lcw-deploy]`) |
| 2 | Sign-in blocked and sessions revoked at separation | Acceptance table | verified mechanism (LCW Disable user account; Revoke all refresh tokens for user) | MS Learn, Lifecycle Workflow built-in tasks |
| 3 | New sentence mapping LCW templates onto the scenarios | after the table | added (verified) | as #1 and #2 |
| 4 | Rollback by pausing the provisioning job | Dry run, cutover and rollback | verified; added that a paused job keeps state and resumes where it left off | MS Learn, synchronizationJob: pause |
| 5 | Every change traces to an HR event and a provenance record | Proving HR is the sole source | restated-as-design; added how to check it (provisioning logs compared with the directory audit log), with the logs fact footnoted | MS Learn, API-driven inbound provisioning concepts |
| 6 | Keep the old connector's state and logs for the records schedule | Where an HR connector already exists | verified pointer: NARA GRS 3.2 items 030/031 (system access records) as the usual schedule, confirmed by the agency records officer | NARA GRS 3.2, Transmittal 33, Jan 2023 |
| 7 | Seven-day proof window; severity grading; four signatories; validation report contents | throughout | restated-as-design | — |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| Front matter | edited: `part: Appendix`, `series-order` 22 → 92, `lifecycle_review` → 2027-04-01 | — |
| Thesis, In this appendix | kept | — |
| Diagram appc-cutover-sequence | kept; source unchanged | — |
| Acceptance (table and sign-off) | edited (footnotes; LCW mapping sentence) | — |
| The validation report | kept | — |
| Dry run, cutover and rollback | edited (pause behavior) | — |
| Proving HR is the sole source | edited (how to check it) | — |
| Closing the ticket path | kept | — |
| Where an HR connector already exists | edited (records schedule pointer) | — |
| Continue callout | edited to "Continue the book"; Previous = Appendix B, Book index, no Next | — |
