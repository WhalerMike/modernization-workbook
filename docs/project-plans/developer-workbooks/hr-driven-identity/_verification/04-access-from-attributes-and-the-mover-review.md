# Verification — Chapter 04, Access from Attributes and the Mover's Residual Review

New material; it replaces no workbook page. Code: `examples/hr-lifecycle` (new kit): `python/access_assignment.py` (`lint`, `memberof-scan`, `residual`, and the rule evaluator), the three files in `config/access`, the `access-read` task in `config/calls.json`, the fixtures in `tests/fixtures/ch04` (`population.json`, `bad-access/`, `assignment-policies.json`, `mover.json`, `mover-assignments.json`, `mover-memberships.json`), and the Chapter 04 block of `tests/test_joiners_and_access.py`. No Microsoft sample is pinned: Learn's read-only `memberOf` script is cited and run beside the scan in Lab 2, not copied.

Test results on November 1, 2026, Windows 11, Python 3.14.3 with pytest: 57 passed across the kit; this chapter's are the nine in the Chapter 04 block of `tests/test_joiners_and_access.py`. Nothing was sent to a tenant.

Microsoft Learn pages opened on November 1, 2026 through the Microsoft Learn MCP tools: Configure an automatic assignment policy for an access package in entitlement management; Create assignmentPolicies (full page); accessPackageAutomaticRequestSettings resource type; attributeRuleMembers resource type; accessPackageAssignmentReviewSettings resource type; requestorManager resource type; Change request settings for an access package; View, add, and remove assignments for an access package; List a user's direct memberships; List a user's memberships (direct and transitive); New-MgEntitlementManagementAssignmentPolicy; Remove-MgEntitlementManagementAssignmentPolicy.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Automatic policy: rule in dynamic group syntax; assignments created and removed; grace period | Start with Microsoft | verified | Learn, automatic assignment policy |
| 2 | One automatic policy per package; more only if no overlap and no transitions, else users can lose access | AA-02 | verified | same |
| 3 | Hidden dynamic group per policy; don't modify or reuse | Dangers | verified | same |
| 4 | At most 15,000 identities per policy | AA-03 | verified | same |
| 5 | Identity Governance Administrator; catalog owners and access package managers can't create automatic policies | Start with Microsoft | verified | same |
| 6 | `memberOf` policies quarantined from November 3, 2026; read-only script | AA-01; memberof-scan | verified | same |
| 7 | Create assignmentPolicies: POST path, `EntitlementManagement.ReadWrite.All`, L4 and L5, example 3 body | Start with Microsoft; verified facts | verified | Learn, Create assignmentPolicies |
| 8 | accessPackageAutomaticRequestSettings's three properties | AA-05, AA-06 | verified | Learn, resource type |
| 9 | `requestorManager` for approvals, managerLevel 1 or 2, include another approver | AA-07; differences | verified | Learn, requestorManager |
| 10 | Assignments and policies readable with `EntitlementManagement.Read.All` | Permissions | verified | Learn, assignments page; request settings page |
| 11 | transitiveMemberOf for another user: application `User.Read.All`; direct memberOf: application `Directory.Read.All` | Permissions | verified | Learn, both membership pages |
| 12 | Dynamic administrative units only in global Azure | Which cloud | carried forward | the guide's verification log |
| 13 | Entitlement management, access reviews, PIM, dynamic groups available in Azure Government | Which cloud | carried forward | the guide's verification log (feature availability) |
| 14 | SCuBA MS.AAD.7.5v1 under BOD 25-01 | AA-09; federal requirements | carried forward | the guide's verification log |
| 15 | Cmdlets New- and Remove-MgEntitlementManagementAssignmentPolicy | Lab 2 | verified | Learn, cmdlet pages |
| 16 | Coded-slot rules, 14-day grace ceiling, privileged out of rules, residual classes, 10-day review target | Rules; residual | restated-as-design (labeled) | Book 03, Ch08 and Ch10; Book 04, Ch09; the guide, Step 4 |
| 17 | Lab 1 outputs (permission list; 0/0/0 lint; 5 Finding 2 Warn on the bad folder; 1 memberOf of 4; residual 8 items, 3 to review, RV-02 at 13 days; 57 tests) | Lab 1 | verified by running the commands as written | local run, November 1, 2026 |
| 18 | Lab 2 behavior (policy accepted; assignments in minutes; removal after grace) | Lab 2 | not run against a tenant | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| The guide, Step 4 (eight steps) | AA-01, AA-02, AA-06, AA-07, AA-09; residual | Step 8 (a reorganization as a mass mover) is Chapter 03's execution limit, not a policy property |
| The guide, Gate 4 Validate (VK-DG-05, VK-HR-03, the memberOf scan with zero rows) | Linked; memberof-scan; Lab 2 | — |
| Book 03, Chapter 10 (rule patterns, packages, where dynamic membership stops) | Why this gate; AA-04, AA-09 | Rule guards are Book 19, Chapter 04's lint |
| Book 04, Chapter 09 (grace for standard, zero for privileged; separation of duties) | AA-06; federal requirements | Separation-of-duties settings aren't read by this code |
| Book 19, Chapter 04 (dynamic-rules parser, lint, shadow diff) | Linked; AA-08 | Not rebuilt; the evaluator covers a subset only |
| *Building Privileged Access*, Chapter 05 (PIM for Groups) | Linked | — |

## What couldn't be verified

- Whether `requestorManager` is accepted as a **reviewer** in `reviewSettings` (Learn documents it for approvals). This chapter uses it only as an approver; Chapter 02's sponsor review records the open question.
- Overlap over time: AA-02 sees overlap only among the users in the population file, not a user moving between two policies later.
- How the portal's two removal checkboxes, offered when a policy is deleted, map to the Remove cmdlet; Lab 2 uses the portal for that choice.
