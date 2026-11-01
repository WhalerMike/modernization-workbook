# Verification — Chapter 03, Joiner Workflows as Code and the Temporary Access Pass Bridge

New material; it replaces no workbook page. Code: `examples/hr-lifecycle` (new kit): `python/joiner_workflows.py` (`lint`, `plan`, `readiness`), the six files in `config/workflows`, the `joiner-plan` and `joiner-readiness` tasks in `config/calls.json`, the fixtures in `tests/fixtures/ch03` (`bad-workflows/`, `workflows.json`, `hr-hires.csv`, `hire-users.json`, `prehire-results.json`, `joiner-assignments.json`), and the Chapter 03 block of `tests/test_joiners_and_access.py`. No Microsoft sample is pinned: Learn's procedure is request examples and portal steps, which the code follows.

Test results on November 1, 2026, Windows 11, Python 3.14.3 with pytest: 57 passed across the kit; this chapter's are the nine in the Chapter 03 block of `tests/test_joiners_and_access.py`. Nothing was sent to a tenant.

Microsoft Learn pages opened on November 1, 2026 through the Microsoft Learn MCP tools: Create workflow (full page); workflow: createNewVersion; Lifecycle Workflow built-in tasks (full page); timeBasedAttributeTrigger resource type; attributeChangeTrigger resource type; triggerAttribute resource type; ruleBasedSubjectSet resource type; Configure execution limits and quarantine for Lifecycle Workflows (full page); Lifecycle workflows execution conditions and scheduling (catch-up window); Understanding lifecycle workflows; List userProcessingResults; userProcessingResult resource type; View, add, and remove assignments for an access package; New-MgIdentityGovernanceLifecycleWorkflow; New-MgIdentityGovernanceLifecycleWorkflowNewVersion; Remove-MgIdentityGovernanceLifecycleWorkflow.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Create workflow: POST path, body properties, up to 100 workflows, `LifecycleWorkflows-Workflow.ReadWrite.All`, Lifecycle Workflows Administrator, L4 and L5 | Start with Microsoft; verified facts | verified | Learn, Create workflow |
| 2 | Category values `joiner`, `leaver` in the property table; example 3 creates a `mover` workflow | Differences | verified (both on the page) | same |
| 3 | createNewVersion: POST path, same permission and role, L4 and L5; body `{"workflow": ...}` | Plan; verified facts | verified (path, permission); body shape from the cmdlet examples | Learn, createNewVersion; New-MgIdentityGovernanceLifecycleWorkflowNewVersion |
| 4 | Versions instead of in-place updates; tenant schedule default 3 h, 1 to 24 | Why this gate | carried forward | the guide's verification log (Overview of Lifecycle Workflows APIs) |
| 5 | Time trigger attributes and offset -180 to 180 | JW-03, JW-04 | verified | Learn, timeBasedAttributeTrigger |
| 6 | Attribute-change trigger with `triggerAttributes[].name` | Mover file; verified facts | verified (shape); the name for an extension attribute isn't documented | Learn, attributeChangeTrigger, triggerAttribute |
| 7 | Scope rule: listed properties incl. `employeeType` and `onPremisesExtensionAttributes/extensionAttribute1-15`; `eq`, `ne`, `in`, `startsWith` | JW-02, JW-12 | verified | Learn, ruleBasedSubjectSet |
| 8 | Built-in task IDs used by the files and the lint table | JW-10; verified facts | verified | Learn, built-in tasks |
| 9 | Pass task: hire date as start; lifetime 10 to 43,200; one-time flag; manager and manager's mail; pass policy enabled; no other methods, sign-ins or role assignments | Start with Microsoft; JW-05 | verified | same |
| 10 | Pass argument named `tapLifetimeInMinutes` in the table and `tapLifetimeMinutes` in the example | Differences | verified (both on the page); which the service accepts is open | same |
| 11 | Custom task extension ID `4262b724-…` in the summary table, `d79d1fcc-…` in the task section | Differences | verified (both on the page) | same |
| 12 | 24-hour maximum pass lifetime recommended for new hires | JW-05 | carried forward | the guide's verification log (How to synchronize attributes for Lifecycle workflows) |
| 13 | 25 tasks per workflow; 100 workflows on the limits page | JW-06, JW-07 | carried forward | the guide's verification log (service limits) |
| 14 | 50 workflows on the licensing page | JW-07; differences | carried forward | the guide's verification log (licensing fundamentals) |
| 15 | Execution limits: tenant or workflow, percentage or count, OR logic, quarantine; on-demand runs not limited; an updated workflow limit isn't reflected in the API | JW-08; Lab 2 | verified | Learn, execution limits |
| 16 | Catch-up window of three days | Verified facts | verified | Learn, execution conditions and scheduling |
| 17 | List userProcessingResults: `LifecycleWorkflows-Reports.Read.All`; Global Reader or Lifecycle Workflows Administrator; L4 and L5 | Readiness permissions | verified | Learn, List userProcessingResults |
| 18 | List access package assignments with `EntitlementManagement.Read.All` | Readiness permissions | verified | Learn, View, add, and remove assignments |
| 19 | Lifecycle Workflows and entitlement management available in Azure Government; Governance in GCC, GCC High, DoD; no Azure Government row for TAP | Which cloud | carried forward | the guide's verification log (feature availability) |
| 20 | Cmdlets New-MgIdentityGovernanceLifecycleWorkflow, ...NewVersion, Remove-...Workflow (restorable 30 days) | Lab 2 | verified | Learn, cmdlet pages |
| 21 | Scope by code, one-time pass, access by package, delete apart from disable, execution limit recorded, budget of 50, plan refuses on Findings, readiness on a start-of-day export | Rules | restated-as-design (labeled) | Book 03, Ch08; Book 04, Ch09; the guide |
| 22 | Lab 1 outputs (permission lists; 0/0/0 lint; 7 Finding 4 Warn on the bad folder; plan actions and JW-15; readiness 1 of 4; 57 tests) | Lab 1 | verified by running the commands as written | local run, November 1, 2026 |
| 23 | Lab 2 behavior (bodies accepted; limit set in the portal; pass delivered) | Lab 2 | not run against a tenant | — |

## Carry-forward ledger

| Source | Went to | Or why not carried |
|---|---|---|
| The guide, Step 3 (workflows by code, schedule, TAP bridge, package not group, execution limits, readiness) | Rules JW-02, JW-05, JW-08, JW-09; readiness | The tenant schedule is one setting, not a workflow file; not linted |
| The guide, What couldn't be verified (TAP in GCC High; ceiling 50 vs 100) | Which cloud; differences | — |
| Book 03, Chapter 08 (guardrails, triggers, deletion) | Why this gate; JW-11 | The rehire workflow's own path is design, left to the guide |
| Book 03, Chapter 11 (joiner readiness rate) | Readiness; Chapter 07 reads it | — |
| Book 19, Chapter 05 (custom task extensions; leaver order check) | Linked | Not rebuilt; this chapter's files carry no custom task |
| Validation kit VK-HR-05, VK-HR-06 | Linked; Lab 2 step 4 | The kit reads the tenant; this code lints the files |

## What couldn't be verified

- Which of Learn's two names for the pass's lifetime argument the service accepts.
- The name an `attributeChangeTrigger` takes for an on-premises extension attribute.
- Whether `createNewVersion` accepts a body that omits read-only fields the GET returns (the plan sends the reviewed body, not a merged one).
- The execution limit's value through Graph: Learn says the per-workflow limit isn't reflected in the API, so the code records it and the validation kit reads what it can.
