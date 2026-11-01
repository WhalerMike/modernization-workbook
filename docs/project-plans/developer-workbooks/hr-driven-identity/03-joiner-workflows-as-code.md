---
title: "Chapter 03 — Joiner Workflows as Code and the Temporary Access Pass Bridge"
description: "Keep the Lifecycle Workflows definitions as reviewed v1.0 request bodies, lint them against Learn's limits and the program's rules (scope by code, the Temporary Access Pass's lifetime and one-time use, access by package rather than group add, delete apart from disable, an execution limit for every scheduled workflow, the 50-workflow budget), plan each change as a new workflow or a new version against what the tenant holds, and measure day-one readiness, starting from Learn's Create workflow, createNewVersion and built-in task pages, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-hr-driven-identity
part: How
series-order: 3
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
last-reviewed: 2026-11-01
---
# Chapter 03 — Joiner Workflows as Code and the Temporary Access Pass Bridge

*A workflow edited in the portal is a change nobody reviewed. A workflow kept as a file is one a reviewer can read, a test can lint, and a plan can turn into exactly one new version.*

::: {.callout-note}
## In this chapter
The code behind the guide's Gate 3, "pre-hire and day-one workflows run with limits; day-one readiness measured." You start with Learn's procedure for creating a lifecycle workflow through Microsoft Graph: the v1.0 request body, the createNewVersion action, the built-in task table and the rule properties a scope may use. Then you use `examples/hr-lifecycle` for what Learn leaves to you: the workflows as reviewed files, a lint of fifteen rules including the Temporary Access Pass's lifetime, a plan that says which files become a new workflow and which a new version, and the day-one readiness rate. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can keep every joiner, mover and leaver workflow as a file a reviewer approves, catch the mistakes Learn's limits and the program's guardrails forbid before anything reaches the tenant, produce the exact request that creates a workflow or its next version, and report the share of new hires who were ready at the start of day one. For each rule you can say whether it is Learn's limit, Learn's recommendation, or the program's own design.

**Audience.** Developers who build the project's lifecycle automation, identity engineers who own the workflows, and the reviewers who approve them. You should read Python and JSON. You don't need a tenant until Lab 2.

## Why this gate needs code

The guide's [Step 3](../../../books/guides/hr-driven-identity-implementation.md#step-3-make-joiners-ready-on-day-one) asks for few workflows scoped by code, a pass that bridges to the card, baseline access by package, execution limits on every scheduled workflow and a measured readiness rate. Book 03, Chapter 08 explains why: its [guardrails at agency scale](../../../books/b03-hr-identity/08-joiner-mover-leaver.md#guardrails-at-agency-scale) and its [triggers and schedule](../../../books/b03-hr-identity/08-joiner-mover-leaver.md#triggers-and-schedule). Each of those is a property of a workflow definition, and Learn makes a definition change a new version rather than an in-place update.[^hw03-api] That is what makes code the right home for them: the file is the version, and the plan is the diff.

### Which cloud, for these reads and writes

The tools read Microsoft Graph: `graph.microsoft.com` for GCC, `graph.microsoft.us` for GCC High and `dod-graph.microsoft.us` for DoD, chosen by `--cloud` with no default. Learn marks Create workflow, createNewVersion and the user processing results as available in US Government L4 and L5.[^hw03-create][^hw03-newversion][^hw03-upr] Lifecycle Workflows and entitlement management are available in Azure Government, and GCC uses the commercial service.[^hw03-availability] Learn's Azure Government table has no row for Temporary Access Pass, so its availability in GCC High wasn't confirmed; the guide records the same gap ([What couldn't be verified](../../../books/guides/hr-driven-identity-implementation.md#what-couldnt-be-verified)).

## Start with Microsoft's procedure

### What Microsoft gives you

Learn's *Create workflow* page gives the v1.0 request: `POST /identityGovernance/lifecycleWorkflows/workflows` with a category, a display name, `isEnabled`, `isSchedulingEnabled`, `executionConditions` (a `ruleBasedSubjectSet` scope and a trigger) and the tasks; it allows up to 100 workflows in a tenant and names Lifecycle Workflows Administrator as the least privileged role.[^hw03-create] *workflow: createNewVersion* posts a changed definition to `/workflows/{workflowId}/createNewVersion`.[^hw03-newversion] The time-based trigger takes `employeeHireDate`, `employeeLeaveDateTime` or `createdDateTime` and an offset from -180 to 180 days;[^hw03-timetrigger] the attribute-change trigger takes a list of trigger attributes.[^hw03-attrtrigger] The scope's rule may use only the user properties Learn lists, with `eq`, `ne`, `in` and `startsWith`, including `employeeType` and the on-premises extension attributes 1 to 15.[^hw03-scope]

Learn's *Lifecycle Workflow built-in tasks* table gives each task's definition ID. The *Generate Temporary Access Pass and send via email to user's manager* task uses the hire date as the pass's start time, takes a lifetime from 10 to 43,200 minutes and a one-time-use flag, needs the manager and the manager's mail, needs the tenant's pass policy enabled, and works only for a user with no other authentication methods, sign-ins or Microsoft Entra role assignments.[^hw03-tasks] Learn recommends a 24-hour maximum lifetime for a pass sent to a new hire.[^hw03-time] Learn's execution limits page sets tenant-wide or per-workflow limits that quarantine a scheduled run, and says an updated workflow limit "isn't currently reflected in the API."[^hw03-limits]

### What it leaves to you

Learn gives one request at a time, written by hand. It doesn't keep the definitions anywhere a reviewer approves them, check a definition against its own limits before the request, decide create versus new version, or measure what the workflows achieved. Each row is pinned by a test in `tests/test_joiners_and_access.py`.

| Learn, as published | Why it matters | What `examples/hr-lifecycle` adds | Test |
|---|---|---|---|
| One example body per request | A body pasted into a request is never reviewed or kept | One file per workflow in `config/workflows`, the v1.0 body plus a `_program` block the code strips | `test_the_body_never_carries_program_fields` |
| A scope rule can use any listed property | A rule on a department name drops users when the organization is renamed | JW-02 warns on a rule with no coded attribute or one that reads a display value; JW-12 refuses a property Learn doesn't list | `test_the_bad_workflows_raise_each_rule` |
| Offset -180 to 180; trigger attributes by category | A joiner triggered on the leave date runs on the wrong people | JW-03 and JW-04 | `test_the_bad_workflows_raise_each_rule` |
| The pass's lifetime, 10 to 43,200 minutes; 24 hours recommended | A three-day pass outlives the bridge it is for | JW-05: outside the range is a Finding, over 24 hours or reusable a Warn; both of Learn's argument names accepted | `test_tap_lifetime_accepts_both_of_learns_argument_names` |
| 25 tasks per workflow; task IDs in a table | A typo in a task ID fails only at the request | JW-06 and JW-10 | `test_unknown_task_and_too_many_tasks` |
| 100 workflows on the create page; 50 on the licensing page | The two ceilings disagree | JW-07 holds the budget to 50 and refuses more than 100 | `test_the_ceilings` |
| Execution limits set in the admin center, not in the API | A scheduled workflow with no limit runs a mass mistake to the end | JW-08 needs the limit recorded in `_program` | `test_the_bad_workflows_raise_each_rule` |
| A body for a new workflow, a separate action for a version | Recreating a workflow loses its history | `plan` compares each file with the tenant's export: create, new version or none; JW-15 warns on a workflow no file defines | `test_plan_creates_versions_and_leaves_alone` |
| — | A plan from a file with findings carries the mistake into the tenant | `plan` refuses to run while the files have a Finding | `test_plan_refuses_files_with_lint_findings` |
| Run history per user | Nobody counts who was ready on day one | `readiness`: the readiness rate and what each unready hire lacked | `test_readiness_counts_only_todays_hires_and_names_what_is_missing` |

**The verdict.** Keep Learn's request bodies exactly as Learn shapes them, and send them with Learn's cmdlets. Add the file, the lint and the plan in front of the request, and the readiness measure after it.

## The code: what `examples/hr-lifecycle` adds

Much of the joiner's code exists. The HR feed that sends the account early and disabled is [Book 19, Chapter 01](../../../books/b19-developer-workbook/01-the-hr-to-entra-middleware.md). Custom task extensions, and the check that a leaver blocks before its custom task, are [Book 19, Chapter 05](../../../books/b19-developer-workbook/05-lifecycle-workflows-custom-extensions.md#the-leaver-order) (`examples/lifecycle-extensions`). The validation kit's **VK-HR-05** reports users whose hire date passed with no processing record, and **VK-HR-06** reads whether execution limits are set and counts workflows against a ceiling ([Book 19, Chapter 03](../../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md)). This chapter adds `python/joiner_workflows.py`, its six workflow files and its fixtures, and links to those for the rest.

### The workflow files

`config/workflows` holds six files: a pre-hire workflow that sends the pass seven days before day one, a day-one workflow that requests the onboarding package, a mover on the organization code, a leaver, a post-separation delete 30 days after the leave date, and a contractor leaver. All of them scope on `employeeType` and the worker type code in `extensionAttribute11`, never on a name. The day-one workflow doesn't enable the account: in this program the pipeline's `active` value is the writer at hire, as the register in [Chapter 01](01-the-writer-register-as-code.md) records. Each file's `_program` block holds its version, its owner and its execution limit (*Design guidance*: a little above a normal week's volume).

### The lint

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| JW-01 | Finding | A category other than joiner, leaver or mover | Learn[^hw03-create] |
| JW-02 | Warn | A scope with no coded attribute, or one that reads a display value such as `department` | *Design guidance*, from Book 03, Chapter 08 |
| JW-03 | Finding | An offset outside -180 to 180 days | Learn[^hw03-timetrigger] |
| JW-04 | Finding | A trigger attribute that doesn't fit the category, or an attribute-change trigger on a workflow that isn't a mover | Learn[^hw03-timetrigger]; *Design guidance* |
| JW-05 | Finding; Warn | The pass's lifetime missing or outside 10 to 43,200 minutes (Finding); over 24 hours, or not one-time use (Warn) | Learn[^hw03-tasks][^hw03-time]; *Design guidance* for one-time use |
| JW-06 | Finding | More than 25 tasks | Learn[^hw03-limits-svc] |
| JW-07 | Finding | More workflows than the budget (50), or than Learn's 100 | Learn[^hw03-create][^hw03-lic] |
| JW-08 | Finding | A scheduled workflow with no execution limit recorded | *Design guidance*; Learn says the limit isn't in the API[^hw03-limits] |
| JW-09 | Finding | A joiner that adds the user to groups directly | *Design guidance*, from [Book 04, Chapter 09](../../../books/b04-access/09-access-governance.md#lifecycle-workflows-at-the-access-level) |
| JW-10 | Finding | A task definition ID not in Learn's table | Learn[^hw03-tasks] |
| JW-11 | Finding | Delete and disable in the same leaver workflow | *Design guidance*, from [Book 03, Chapter 08](../../../books/b03-hr-identity/08-joiner-mover-leaver.md#deletion) |
| JW-12 | Finding | A scope property Learn doesn't list | Learn[^hw03-scope] |
| JW-14 | Finding | Two files with the same display name | *Design guidance* |
| JW-15 | Warn | (`plan`) A workflow in the tenant that no file defines | *Design guidance* |

### The plan

`plan` lints the folder and refuses to go on if any file has a Finding. It then matches each file to the tenant's export by display name and compares the parts a definition owns: category, description, the enabled and scheduling flags, the execution conditions and each task's definition ID, arguments and flags. A file with no match becomes the body for `POST /identityGovernance/lifecycleWorkflows/workflows`; a changed one becomes `{"workflow": ...}` for `createNewVersion`; an unchanged one is left alone. It writes `plan.json`, one body per change and a manifest with a SHA-256 per file, and sends nothing. The read needs only `LifecycleWorkflows-Workflow.Read.All` (task `joiner-plan` in `config/calls.json`).

### Day-one readiness

`readiness` counts the hires whose hire date is the day of `--as-of`, and calls a hire ready when the account exists and is enabled, holds a license, has the onboarding package delivered and has a completed pre-hire run. It reads the hires from HR and three exports: the users with their hire date and licenses, the pre-hire workflow's user processing results, and the onboarding package's assignments. Run it on an export taken at the start of the day, because it measures state, not timestamps. The reads are task `joiner-readiness`:

| Call | Least-privileged permission | Delegated role |
|---|---|---|
| List users, with `employeeHireDate` and `assignedLicenses` | `User.Read.All`, with `User-LifeCycleInfo.Read.All` for the hire date | — |
| List userProcessingResults of the pre-hire workflow | `LifecycleWorkflows-Reports.Read.All`[^hw03-upr] | Global Reader or Lifecycle Workflows Administrator |
| List access package assignments, filtered by package | `EntitlementManagement.Read.All`[^hw03-assignments] | — |

### The tests

This chapter's tests are the nine in the Chapter 03 block of `tests/test_joiners_and_access.py`: the shipped files lint clean, the bad files raise each rule, both argument names, the task limits, the two ceilings, the stripped body, the plan, the refusal and readiness. The kit's 57 tests pass under Python 3.14 with no package, tenant or network.

::: {.callout-important}
## Illustrative code
The commands below run against the repository's workflow files and fictional exports. They show what the code does, not that a tenant returns the same shapes. Review the files and the plan, and run Lab 2 in a test tenant, before a body reaches production.
:::

## Lab 1: fixtures, no tenant

You need Python 3.10 or later. Work in `examples/hr-lifecycle`.

1. **List the reads and their permissions:**

   ```bash
   python python/graph_export.py --task joiner-plan --list
   python python/graph_export.py --task joiner-readiness --list
   ```

   ```text
   Task joiner-plan: LifecycleWorkflows-Workflow.Read.All
     GET /identityGovernance/lifecycleWorkflows/workflows  [LifecycleWorkflows-Workflow.Read.All]
   Task joiner-readiness: EntitlementManagement.Read.All, LifecycleWorkflows-Reports.Read.All, User-LifeCycleInfo.Read.All, User.Read.All
     GET /users  [User-LifeCycleInfo.Read.All, User.Read.All]
     GET /identityGovernance/lifecycleWorkflows/workflows/{workflowId}/userProcessingResults  [LifecycleWorkflows-Reports.Read.All]
     GET /identityGovernance/entitlementManagement/assignments  [EntitlementManagement.Read.All]
   ```

2. **Lint the program's workflows:**

   ```bash
   python python/joiner_workflows.py lint config/workflows --budget 50
   ```

   ```text
   Workflows: 6 files, budget 50
   Lint: 0 Finding, 0 Warn, 0 Info
   ```

3. **Lint three broken copies, with a budget of two to see JW-07:**

   ```bash
   python python/joiner_workflows.py lint tests/fixtures/ch03/bad-workflows --budget 2
   ```

   ```text
   Workflows: 3 files, budget 2
   Lint: 7 Finding, 4 Warn, 0 Info
     JW-03 Finding: Bad-DayOne-GroupAdd: offsetInDays 200 is outside -180 to 180
     JW-04 Finding: Bad-Leaver-DeleteSameDay: a leaver workflow triggered on employeeHireDate
     JW-07 Finding: workflow count: 3 workflows over the budget of 2 (Learn's licensing page says 50, its limits page 100)
     JW-08 Finding: Bad-PreHire-ByDepartment: scheduled with no execution limit recorded; set it in the admin center (Learn: not in the API) and record it in _program
     JW-09 Finding: Bad-DayOne-GroupAdd: joiner adds the user to groups directly; give baseline access by access package
     JW-11 Finding: Bad-Leaver-DeleteSameDay: delete and disable in one workflow; delete in a separate post-separation workflow
     JW-12 Finding: Bad-Leaver-DeleteSameDay: scope rule uses manager, which Learn doesn't list for a workflow scope
     JW-02 Warn: Bad-PreHire-ByDepartment: scope rule uses no coded attribute (employeeType or the coded extension slots); scope by code, not by name
     JW-02 Warn: Bad-PreHire-ByDepartment: scope rule reads the display value department; a renamed organization silently drops users
     JW-05 Warn: Bad-PreHire-ByDepartment: TAP lifetime 4320 minutes; Learn recommends at most 24 hours for a new hire
     JW-05 Warn: Bad-PreHire-ByDepartment: TAP isn't one-time use; the tenant policy can force it (design guidance: do)
   ```

   The exit code is 2. The broken pre-hire workflow uses `tapLifetimeInMinutes`, the name in Learn's table; the program's file uses `tapLifetimeMinutes`, the name in Learn's example. Both are read.

4. **Plan against the tenant's export:**

   ```bash
   python python/joiner_workflows.py plan config/workflows --current tests/fixtures/ch03/workflows.json --out out/ch03/plan
   ```

   ```text
     none        JML-Leaver-LastDay-Contractors
     new-version JML-Joiner-DayOne-Employees
     create      JML-Leaver-LastDay-Employees
     none        JML-Mover-OrgCode
     none        JML-Leaver-PostSeparation-Employees
     none        JML-Joiner-PreHire-Employees
   Plan: 0 Finding, 1 Warn, 0 Info
   Plan written to out/ch03/plan/plan.json; nothing was sent
   ```

   The exit code is 2: a Warn counts as well as a Finding.

   The day-one workflow in the tenant requests a different package, so it gets a new version; its body in `out/ch03/plan/bodies/day-one.json` is wrapped in `workflow` for `createNewVersion`. The employee leaver doesn't exist yet, so it gets a create. The Warn is JW-15 for `Onboard Marketing (legacy)`, a workflow made in the portal that no file defines. Try the same plan on the broken folder: it stops with an error, because those files have Findings.

5. **Measure day one:**

   ```bash
   python python/joiner_workflows.py readiness --hires tests/fixtures/ch03/hr-hires.csv --users tests/fixtures/ch03/hire-users.json \
       --prehire-results tests/fixtures/ch03/prehire-results.json --assignments tests/fixtures/ch03/joiner-assignments.json \
       --workflows config/workflows --as-of 2026-11-02T08:00:00Z --cloud gcc --out out/ch03/readiness
   ```

   ```text
   Day one 2026-11-02: 1 of 4 hires ready (25%)
   Readiness: 0 Finding, 3 Warn, 0 Info
   ```

   `findings.json` says why: `omar.haddad` lacks only the onboarding package (still delivering); `pia.santos` is disabled, unlicensed, without the package, and her pre-hire run failed; person `100104` has no account at all. The hire on November 9 isn't counted. `summary.json` holds the rate, 0.25, which Chapter 07 reads.

6. **Run the tests:**

   ```bash
   python -m pytest tests -q
   ```

**Expected result:** 57 tests passing. Delete `out/ch03` when you're done.

## Lab 2: test tenant

*Not run by the authors.* Use a test tenant in the worldwide or GCC cloud with Microsoft Entra ID Governance trial or test licenses, never production, and test users whose hire date is a few days away.

1. **Export.** Register a reader app with a certificate, grant `LifecycleWorkflows-Workflow.Read.All` with admin consent, put a token for it in `HRLC_GRAPH_TOKEN`, and run `python python/graph_export.py --task joiner-plan --cloud gcc --out exports/joiner`.
2. **Plan.** Edit one file (for example the pre-hire offset), then run `plan` with `--current exports/joiner/workflows.json`. Review `plan.json` and the bodies.
3. **Send one change.** As a Lifecycle Workflows Administrator, with Graph PowerShell: a create with `New-MgIdentityGovernanceLifecycleWorkflow -BodyParameter (Get-Content out/ch03/plan/bodies/<file> -Raw | ConvertFrom-Json -AsHashtable)`, or a new version with `New-MgIdentityGovernanceLifecycleWorkflowNewVersion -WorkflowId <id> -BodyParameter ...`.[^hw03-cmdlets] Leave scheduling off until the next step is done.
4. **Set the execution limit** in the admin center under the workflow's **Settings**, with the value from `_program.executionLimit`, as Learn's procedure describes.[^hw03-limits] Read it back with the validation kit's VK-HR-06.
5. **Check the pass.** Confirm the tenant's Temporary Access Pass policy allows the file's lifetime and one-time use;[^hw03-tap] run the pre-hire workflow on demand for one test user with no methods; confirm the manager's mailbox receives the pass.
6. **Measure.** On the test hire's start date, export the users, the pre-hire results and the onboarding assignments (`--task joiner-readiness`) and run `readiness`.
7. **Back it out.** Delete a workflow the lab created with `Remove-MgIdentityGovernanceLifecycleWorkflow -WorkflowId <id>` (it can be restored for 30 days);[^hw03-remove] for a new version, send the previous file's body as a further version; remove the reader app, its permission and certificate, and delete `exports` and `out/ch03`.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| Create workflow | `POST /identityGovernance/lifecycleWorkflows/workflows`; `LifecycleWorkflows-Workflow.ReadWrite.All`; Lifecycle Workflows Administrator; up to 100 workflows | L4 and L5 | v1.0 | [^hw03-create] |
| Create a new version | `POST /workflows/{workflowId}/createNewVersion`; same permission and role | L4 and L5 | v1.0 | [^hw03-newversion] |
| Versions, not in-place updates; one tenant schedule, every 3 hours by default, 1 to 24 | — | — | v1.0 | [^hw03-api] |
| Time-based trigger | `employeeHireDate`, `employeeLeaveDateTime`, `createdDateTime`; offset -180 to 180 | — | v1.0 | [^hw03-timetrigger] |
| Attribute-change trigger | `triggerAttributes`, each with a `name` | — | v1.0 | [^hw03-attrtrigger] |
| Scope rule | Listed user properties, including `employeeType` and `onPremisesExtensionAttributes/extensionAttribute1` to `15`; `eq`, `ne`, `in`, `startsWith` | — | v1.0 | [^hw03-scope] |
| Pass task | `1b555e50-7f65-41d5-b514-5894a026d10d`; lifetime 10 to 43,200 minutes; one-time use; manager and manager's mail; no other methods, sign-ins or role assignments | Not confirmed for GCC High | GA | [^hw03-tasks] |
| Pass for a new hire | 24-hour maximum recommended | — | — | [^hw03-time] |
| Other task IDs the files use | Request user access package assignment `c1ec1e76-…`; Disable `1dfdfcc7-…`; Revoke all refresh tokens `509589a4-…`; Delete user `8d18588d-…`; Remove access package assignment `4a0b64f2-…` | — | — | [^hw03-tasks] |
| Tasks per workflow | 25 | — | — | [^hw03-limits-svc] |
| Execution limits | Tenant or per workflow, percentage or count, quarantine on a scheduled run; on-demand runs aren't limited; a workflow limit "isn't currently reflected in the API" | — | GA | [^hw03-limits] |
| Catch-up window | A scheduled workflow processes a user up to three days after the trigger date | — | — | [^hw03-catchup] |
| List userProcessingResults | `LifecycleWorkflows-Reports.Read.All`; Global Reader or Lifecycle Workflows Administrator | L4 and L5 | v1.0 | [^hw03-upr] |
| List access package assignments | `EntitlementManagement.Read.All` | — | v1.0 | [^hw03-assignments] |
| Lifecycle Workflows, entitlement management | Available in Azure Government; Entra ID Governance in GCC, GCC High and DoD | Available | GA | [^hw03-availability] |

Places where Learn's pages differ, recorded so a later edit doesn't loosen the code:

- **The pass's lifetime argument.** Learn's built-in task table names it `tapLifetimeInMinutes`; the example under it uses `tapLifetimeMinutes`.[^hw03-tasks] JW-05 reads either; which one the service accepts is confirmed in Lab 2.
- **The custom task extension's ID.** The same page gives `4262b724-8dba-4fad-afc3-43fcbb497a0e` in its summary table and `d79d1fcc-16be-490c-a865-f4533b1639ee` in the task's own section.[^hw03-tasks] The lint knows the first, which Book 19, Chapter 05 also uses; none of this chapter's files carries the task.
- **The mover category.** The create page's property table lists the category values `joiner` and `leaver`, while its third example creates a `mover` workflow.[^hw03-create] The program's mover file follows the example; Lab 2 confirms it.
- **The workflow ceiling.** The create page and the service limits page say 100; the licensing page says 50.[^hw03-create][^hw03-lic] The budget is 50.

What couldn't be verified: the name a mover's `attributeChangeTrigger` takes for an extension attribute (the file uses the scope's form, `onPremisesExtensionAttributes/extensionAttribute10`; Learn's trigger page gives no example), and the execution limit, which the code can only record because the API doesn't carry it.

## Federal requirements and evidence

This chapter supports the guide's Gate 3. The [Gate 3 requirements table](../../../books/guides/hr-driven-identity-implementation.md#step-3-make-joiners-ready-on-day-one) maps it to NIST SP 800-53 AC-2(1) (automated system account management), IA-5 (the initial authenticator is time-limited and reaches an accountable person) and OMB M-22-09's phishing-resistant MFA, which the pass bridges to; the [federal framework crosswalk](../../../reference/federal-framework-crosswalk.md) lists each source. What this code gives the ISSO:

- the reviewed workflow files and the plan that changed each version, with its manifest's SHA-256, as the definitions and versions AC-2(1) asks for;
- the lint's clean run, showing a one-time pass of at most 24 hours and an execution limit on every scheduled workflow (IA-5 and the guardrails);
- the readiness summary per start date, the day-one readiness rate Book 03, Chapter 11 measures;
- the run history the workflows leave, exported past Entra's 30-day view, which this code doesn't keep (the guide's evidence list says where it goes).

Accounts still on a pass after the agreed window, when the card should have been bound ([Chapter 05](05-certificate-based-authentication-checks.md)), are a finding for the ISSO; this chapter's code doesn't read them.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| A workflow edited in the portal | The tenant drifts from the reviewed file | JW-15 in every plan; the file is the only source of a new version |
| A scope on a department name | A reorganization renames the department and the workflow silently stops | JW-02 |
| A long or reusable pass | The bridge outlives the card's arrival | JW-05 |
| A rehire whose old account kept its methods | The pass task fails for them | Learn's prerequisite stated in the chapter; the rehire workflow needs its own path (guide, Step 3) |
| No execution limit | A bad HR load runs to the end | JW-08; VK-HR-06 reads the limit back |
| A new hire added to an app group directly | Access no review or package knows about | JW-09 |
| Delete in the leaver | The account is gone before devices are retired | JW-11 |
| A plan from broken files | The mistake reaches the tenant as a new version | `plan` refuses while a Finding stands |
| More workflows than the licensing page allows | The tenant hits a ceiling Learn states two ways | JW-07 holds 50 |
| A readiness figure from a midday export | Late fixes count as ready | Run `readiness` on the start-of-day export |

## Checklist

- [ ] Every workflow in the tenant has a file in `config/workflows`, and the last plan showed no JW-15.
- [ ] The lint is clean with `--budget 50`.
- [ ] Every scheduled workflow's execution limit in the admin center matches `_program.executionLimit`, and VK-HR-06 agrees.
- [ ] The pass is one-time, at most 24 hours, and within the tenant's pass policy.
- [ ] Each change reached the tenant as the reviewed body in a plan whose manifest hash is recorded.
- [ ] The reader app holds only `LifecycleWorkflows-Workflow.Read.All` for planning, and the readiness reads hold only the four permissions in Lab 1.
- [ ] The day-one readiness rate is reported for each start date against the approved threshold.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 02 — Contractor Sources and Enforced End Dates](02-contractor-sources-and-end-dates.md) · [Workbook index](index.md) · [Next: Chapter 04 — Access from Attributes and the Mover's Residual Review →](04-access-from-attributes-and-the-mover-review.md)
:::

[^hw03-create]: Microsoft Learn, "Create workflow" (lifecycle workflows), national cloud deployments, permissions, request body and examples, <https://learn.microsoft.com/graph/api/identitygovernance-lifecycleworkflowscontainer-post-workflows?view=graph-rest-1.0> (read November 1, 2026).
[^hw03-newversion]: Microsoft Learn, "workflow: createNewVersion," <https://learn.microsoft.com/graph/api/identitygovernance-workflow-createnewversion?view=graph-rest-1.0> (read November 1, 2026).
[^hw03-api]: Microsoft Learn, "Overview of Lifecycle Workflows APIs," <https://learn.microsoft.com/graph/api/resources/identitygovernance-lifecycleworkflows-overview?view=graph-rest-1.0> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw03-timetrigger]: Microsoft Learn, "timeBasedAttributeTrigger resource type," <https://learn.microsoft.com/graph/api/resources/identitygovernance-timebasedattributetrigger?view=graph-rest-1.0> (read November 1, 2026).
[^hw03-attrtrigger]: Microsoft Learn, "attributeChangeTrigger resource type," <https://learn.microsoft.com/graph/api/resources/identitygovernance-attributechangetrigger?view=graph-rest-1.0> (read November 1, 2026).
[^hw03-scope]: Microsoft Learn, "ruleBasedSubjectSet resource type," supported user properties and query parameters, <https://learn.microsoft.com/graph/api/resources/identitygovernance-rulebasedsubjectset?view=graph-rest-1.0> (read November 1, 2026).
[^hw03-tasks]: Microsoft Learn, "Lifecycle Workflow built-in tasks," supported tasks and task details, <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-tasks> (read November 1, 2026).
[^hw03-time]: Microsoft Learn, "How to synchronize attributes for Lifecycle workflows," importance of time, <https://learn.microsoft.com/entra/id-governance/how-to-lifecycle-workflow-sync-attributes> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw03-limits]: Microsoft Learn, "Configure execution limits and quarantine for Lifecycle Workflows," <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-execution-limits> (read November 1, 2026).
[^hw03-limits-svc]: Microsoft Learn, "Microsoft Entra ID Governance service limits," Lifecycle Workflows, <https://learn.microsoft.com/entra/id-governance/governance-service-limits> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw03-lic]: Microsoft Learn, "Microsoft Entra ID Governance licensing fundamentals," <https://learn.microsoft.com/entra/id-governance/licensing-fundamentals> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw03-catchup]: Microsoft Learn, "Lifecycle workflows execution conditions and scheduling," Lifecycle workflow catch-up window, <https://learn.microsoft.com/entra/id-governance/lifecycle-workflow-execution-conditions> (read November 1, 2026).
[^hw03-upr]: Microsoft Learn, "List userProcessingResults," <https://learn.microsoft.com/graph/api/identitygovernance-workflow-list-userprocessingresults?view=graph-rest-1.0> (read November 1, 2026).
[^hw03-assignments]: Microsoft Learn, "View, add, and remove assignments for an access package in entitlement management," view assignments programmatically, <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-assignments> (read November 1, 2026).
[^hw03-availability]: Microsoft Learn, "Microsoft Entra feature availability," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw03-tap]: Microsoft Learn, "Configure Temporary Access Pass to register passwordless authentication methods," enable the Temporary Access Pass policy, <https://learn.microsoft.com/entra/identity/authentication/howto-authentication-temporary-access-pass> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw03-cmdlets]: Microsoft Learn, "New-MgIdentityGovernanceLifecycleWorkflow," <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.governance/new-mgidentitygovernancelifecycleworkflow?view=graph-powershell-1.0>, and "New-MgIdentityGovernanceLifecycleWorkflowNewVersion," <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.governance/new-mgidentitygovernancelifecycleworkflownewversion?view=graph-powershell-1.0> (read November 1, 2026).
[^hw03-remove]: Microsoft Learn, "Remove-MgIdentityGovernanceLifecycleWorkflow," <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.governance/remove-mgidentitygovernancelifecycleworkflow?view=graph-powershell-1.0> (read November 1, 2026).
