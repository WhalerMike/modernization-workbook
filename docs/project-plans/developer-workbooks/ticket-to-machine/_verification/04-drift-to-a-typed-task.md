# Verification — Chapter 04, Drift to a Typed Task

New material. Code: `clients/python/workflow_payload.py` (new); `tests/python/test_workflow_payload.py` (new, 7 tests); `tests/fixtures/events/` (three fictional inputs, new); `sailpoint/workflows/drift-to-servicenow.json` (sends `multi_value_changes`); `servicenow/scripted-rest-identity-finding.js` (reverts multivalued changes; the attribute in the de-duplication key); `tests/servicenow/servicenow_scripts.test.js` (two new tests); the kit README and two sentences of the implementation example updated for the new key. Tests on November 1, 2026: as Chapter 01's log.

Vendor pages opened on November 1, 2026: SailPoint Developer, Native Change Account Updated; Identity Attributes Changed; Provisioning Completed; Triggers; SailPoint's OpenAPI specification v2025, `WorkflowBody.yaml` and `workflows.yaml`; ServiceNow, Scripted REST APIs; NIST SP 800-53B Moderate profile 5.2.0.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Native change input fields, including `multiValueAttributeChanges` (`name`, `addedValues`, `removedValues`); conditions; fire-and-forget; `eventType` `ACCOUNT_UPDATED` | Fixes; Lab 1; facts | verified | SailPoint, Native Change Account Updated |
| 2 | The native change page gives no trigger ID, and the trigger table doesn't list it | Facts; not verified | verified (absence) | same; Triggers |
| 3 | Identity Attributes Changed input fields | Facts | verified | SailPoint, Identity Attributes Changed |
| 4 | Provisioning Completed input fields | Facts | verified to the level the page lists | SailPoint, Provisioning Completed |
| 5 | Workflows can't be created enabled; body properties | What exists; facts | verified | `WorkflowBody.yaml` |
| 6 | The old workflow dropped multivalued changes, giving a vacuous intended state | Fixes | verified by test against the pre-fix body | `test_without_multi_value_mapping_the_intended_state_is_vacuous` |
| 7 | The old key folded two attribute drifts on one subject | Fixes | verified: Chapter 01's payload check reported 1 de-duplication before the fix and 0 after | local run |
| 8 | ISC workflows call out from SailPoint's cloud | Lab 2 | inference, carried from kit verify list item 18 | — |
| 9 | Provenance drift on a claim in active use is P1 | Federal requirements | verified | Book 13, Appendix B |
| 10 | CM-3, SI-4, SA-11 at Moderate | Federal requirements | verified | OSCAL Moderate profile 5.2.0 |
| 11 | Lab 1 outputs | Lab 1 | verified by running the commands | local run |
| 12 | Lab 2 | Lab 2 | not run | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| Kit verify list, items 1, 2, 3, 5 and 18 | What couldn't be verified; Lab 2 | — |
| Implementation example, Build 1 and de-duplication | Linked; two sentences updated for the new key | — |
| Example guide, native change as unauthorized write (inference) | Federal requirements | — |
