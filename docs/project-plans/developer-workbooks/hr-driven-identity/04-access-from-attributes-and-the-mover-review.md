---
title: "Chapter 04 — Access from Attributes and the Mover's Residual Review"
description: "Keep access package assignment policies as reviewed v1.0 bodies and lint them before they reach the tenant (the memberOf rules quarantined from November 3, 2026, two automatic policies on one package that a user can match at once, Learn's 15,000-identity limit, rules on the coded slots, create and remove both on, a bounded grace period, privileged access kept out of rules, requests routed to the manager with a fallback), scan an export for memberOf policies, and list what a move leaves behind for the mover's residual review with the transfer-to-review interval, starting from Learn's automatic assignment policy page and its Create assignmentPolicies example, with labs against fixtures and a test tenant."
doc-type: workbook-chapter
audience: [Technical]
family: dw-hr-driven-identity
part: How
series-order: 4
status: draft
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-05-01
review-status: pending
last-reviewed: 2026-11-01
---
# Chapter 04 — Access from Attributes and the Mover's Residual Review

*An automatic policy removes what its rule granted. It never removes what someone granted by hand, and a move is exactly when that access stops being right.*

::: {.callout-note}
## In this chapter
The code behind the guide's Gate 4, "department access by automatic assignment; requests approved by the supervisor of record; residual access reviewed after a move." You start with Learn's procedure for an automatic assignment policy: a membership rule on user attributes, assignments created and removed as users enter and leave scope, a grace period, and Learn's warnings about overlapping policies, the 15,000-identity limit and the `memberOf` quarantine. Then you use `examples/hr-lifecycle` for what Learn leaves to you: the policies as reviewed files, a lint of nine rules that evaluates each rule over a population to find overlap, a scan of the tenant's policies for `memberOf`, and the mover's residual review with the transfer-to-review interval. Lab 1 runs on a laptop with no tenant; Lab 2 uses a test tenant.
:::

## Goal and audience

**Goal.** By the end of this chapter you can keep every access package assignment policy as a file a reviewer approves, catch the policy mistakes that silently drop or keep access before they reach the tenant, find the policies the November 3, 2026 change will quarantine, and hand the manager of record a sheet of exactly what a mover still holds outside the rules. For each rule you can say whether it is Learn's contract, Learn's warning, or the program's design.

**Audience.** Developers who build the project's access automation, the entitlement management owners, and the reviewers of access policy. You should read Python and JSON and know Microsoft Entra dynamic membership rules. You don't need a tenant until Lab 2.

## Why this gate needs code

The guide's [Step 4](../../../books/guides/hr-driven-identity-implementation.md#step-4-assign-access-from-attributes-and-review-what-a-move-leaves) assigns department packages by rule, one automatic policy per package, no `memberOf`, a grace period for movers, manager approval for requests and a review of the residual. Book 03, Chapter 10 holds the design: its [rule patterns](../../../books/b03-hr-identity/10-from-attributes-to-access.md#rule-patterns), its [access packages and reviews](../../../books/b03-hr-identity/10-from-attributes-to-access.md#access-packages-and-access-reviews) and [where dynamic membership stops](../../../books/b03-hr-identity/10-from-attributes-to-access.md#where-dynamic-membership-stops); Chapter 08's [mover](../../../books/b03-hr-identity/08-joiner-mover-leaver.md#mover) says what the move must start. Each rule is a property of a policy body or a fact about a user's holdings, so code can check it every time instead of once.

### Which cloud, for these reads

The tools read Microsoft Graph on the cloud `--cloud` names: `graph.microsoft.com` for GCC, `graph.microsoft.us` for GCC High, `dod-graph.microsoft.us` for DoD. Learn marks Create assignmentPolicies as available in US Government L4 and L5,[^hw04-create] and entitlement management, access reviews and dynamic groups as available in Azure Government; GCC uses the commercial service.[^hw04-availability] One gap matters to this gate: administrative units with dynamic membership rules exist only in the global Azure cloud, not in Azure Government, so a GCC High tenant can't scope administration by a rule-based unit; the guide's interim path covers it.[^hw04-audyn]

## Start with Microsoft's procedure

### What Microsoft gives you

Learn's *Configure an automatic assignment policy for an access package* page is the procedure.[^hw04-auto] A policy carries a membership rule in the dynamic group syntax; entitlement management creates assignments for users who match and removes them for users who stop matching; a grace period can keep access for a while after a user leaves scope. Learn suggests one automatic policy per package, and supports more only if no user ever matches two at once or moves from one to another, "otherwise users can lose access." It creates a hidden dynamic group per policy that nobody should modify or reuse, allows at most 15,000 identities in a policy's rule, and needs Identity Governance Administrator: catalog owners and access package managers can't create automatic policies. From November 3, 2026, a policy whose rule uses `memberOf` is quarantined: it stays, but adds and removes nothing until the operator is removed; Learn publishes a read-only script to find them.[^hw04-auto]

Learn's *Create assignmentPolicies* page, example 3, gives the request: `POST /identityGovernance/entitlementManagement/assignmentPolicies` with `allowedTargetScope` `specificDirectoryUsers`, an `attributeRuleMembers` target holding the rule, `automaticRequestSettings` and the access package, with `EntitlementManagement.ReadWrite.All`.[^hw04-create] `accessPackageAutomaticRequestSettings` has three properties: `requestAccessForAllowedTargets`, `removeAccessWhenTargetLeavesAllowedTargets` and `gracePeriodBeforeAccessRemoval`.[^hw04-ars] For request policies, `requestorManager` makes the requester's manager the approver, and Learn says to include another approver in case the requester has no manager.[^hw04-mgr]

### What it leaves to you

Learn gives the portal steps and one request body. It doesn't keep policies where a reviewer approves them, test a rule against the population before it goes live, find overlap between two policies, or say what a move leaves outside the rules. Each row is pinned by a test in `tests/test_joiners_and_access.py`.

| Learn, as published | Why it matters | What `examples/hr-lifecycle` adds | Test |
|---|---|---|---|
| One example body | A policy written by hand in the portal isn't reviewed or kept | One file per policy in `config/access`, the v1.0 body plus a `_program` block (tier, resource groups) | `test_the_shipped_policies_lint_clean` |
| `memberOf` policies quarantined from November 3, 2026; a script to find them | A quarantined policy stops removing access without an error | AA-01 refuses `memberOf` in a file; `memberof-scan` runs the same test over the tenant's export, for the pipeline | `test_the_bad_policies_raise_each_rule`, `test_memberof_scan_over_an_export` |
| More than one automatic policy only if users never match two or move between them | A user in two policies can lose access | AA-02 evaluates each rule over a population: overlap is a Finding, two disjoint policies a Warn | `test_the_bad_policies_raise_each_rule`, `test_disjoint_policies_on_one_package_warn_instead` |
| At most 15,000 identities per policy | A rule over the limit doesn't cover everyone | AA-03 from the declared or evaluated scope | `test_scope_over_learns_limit` |
| A rule on any user property | A rule on a department name breaks on a rename | AA-04 warns on a rule with no coded slot or worker type | `test_the_bad_policies_raise_each_rule` |
| Create and remove are checkboxes | A policy that creates but never removes keeps a mover's access forever | AA-05 needs both | `test_the_bad_policies_raise_each_rule` |
| A grace period of any length | A long grace is a second job | AA-06 warns over 14 days (*Design guidance*) | `test_the_bad_policies_raise_each_rule` |
| — | A privileged role granted by rule is standing privilege | AA-09 refuses automatic assignment for tier T0, T1 or privileged packages | `test_the_bad_policies_raise_each_rule` |
| `requestorManager` with another approver | A request from someone with no manager waits forever | AA-07 needs the manager and a fallback | `test_the_bad_policies_raise_each_rule` |
| The rule syntax in the portal's builder | A rule nobody evaluated grants something unexpected | A small evaluator for the subset the policies use, which refuses anything else | `test_evaluator_handles_the_subset_and_refuses_the_rest` |
| — | A move leaves requested and hand-granted access behind | `residual` classifies everything the mover holds and writes the review sheet | `test_residual_review_lists_requested_and_outside_package_access` |
| — | Nobody measures how long the review took | The transfer-to-review interval, and RV-02 when it runs past ten days | `test_a_completed_review_gives_the_interval` |

**The verdict.** Keep Learn's body and its checkboxes as they are, and follow its warnings as rules the code enforces. Add the population test, the export scan and the residual review, which Learn leaves to the operator.

## The code: what `examples/hr-lifecycle` adds

Dynamic group rules as code, with a full parser, a lint and the shadow diff that shows a membership change before it happens, are [Book 19, Chapter 04](../../../books/b19-developer-workbook/04-dynamic-rules-as-code.md) (`examples/dynamic-rules`); this chapter's evaluator handles only the subset its policies use and sends anything else there. The validation kit's **VK-DG-05** compares group counts with a snapshot taken before a test move, and **VK-HR-03** reconciles counts per organization code with HR ([Book 19, Chapter 03](../../../books/b19-developer-workbook/03-writing-a-validation-kit-check.md)). The mover workflow that removes the old package and notifies the manager is [Chapter 03](03-joiner-workflows-as-code.md)'s `mover.json`. Eligibility for privileged groups through PIM is [*Building Privileged Access*, Chapter 05](../privileged-access/05-pim-for-groups.md). This chapter adds `python/access_assignment.py`, the three policy files and their fixtures.

### The policy files

`config/access` holds two automatic policies, one per department package, each on the organization code in `extensionAttribute10` and the worker type, with a seven-day grace; and one request policy for infrastructure administrator eligibility, where ORG-210 employees may request and the manager approves, with a fallback. The request policy grants eligibility only: the role is activated through PIM, as the guide's step 7 requires. Each file's `_program` block holds its tier, the package's name, the expected scope, and the groups the package grants, which the residual review uses.

### The lint

| Rule | Severity | What it flags | Source |
|---|---|---|---|
| AA-01 | Finding | A rule that uses `memberOf` | Learn: quarantined from November 3, 2026[^hw04-auto] |
| AA-02 | Finding; Warn | Two automatic policies on one package that a user matches at once (Finding); two disjoint ones (Warn) | Learn[^hw04-auto] |
| AA-03 | Finding | More than 15,000 identities in scope | Learn[^hw04-auto] |
| AA-04 | Warn | A rule on no coded slot or worker type | *Design guidance*, from Book 03, Chapter 10 |
| AA-05 | Finding | An automatic policy that doesn't both create and remove | *Design guidance*; Learn's defaults[^hw04-auto] |
| AA-06 | Warn | A grace period over 14 days | *Design guidance*, from [Book 04, Chapter 09](../../../books/b04-access/09-access-governance.md#lifecycle-workflows-at-the-access-level) |
| AA-07 | Finding | A request policy without the manager as approver and a fallback | Learn[^hw04-mgr]; the guide's step 5 |
| AA-08 | Warn | A rule outside the evaluator's subset | — (lint it with `examples/dynamic-rules`) |
| AA-09 | Finding | A tier T0, T1 or privileged package assigned by rule | The guide's step 7; SCuBA MS.AAD.7.5v1[^hw04-bod] |

The evaluator reads `-eq`, `-ne`, `-in`, `-startsWith`, `-and`, `-or`, `-not` and parentheses over `user.<property>`, compares strings without regard to case, and raises an error for any other operator. The population file is a list of users with their coded attributes; a real run uses an export of the users in scope.

### The mover's residual review

`residual` takes the mover (old and new attributes, the effective date, and the review's completion once it closes), the mover's access package assignments, their group memberships and the policy files. For each assignment, it re-evaluates the automatic policy's rule against the new attributes: kept by rule, or removed by rule at the end of the grace period, with the date. An assignment from any other policy is *requested: review*. For each group, a dynamic group is rule-managed, a group a held package grants is package-managed, and anything else is *outside packages: review*. The review items go to `residual-review.csv` for the manager of record; `summary.json` holds the transfer-to-review interval (PS-5's metric) once the review closes, which Chapter 07 reads. The reads are task `access-read`:

| Call | Least-privileged permission | Delegated role |
|---|---|---|
| List assignment policies | `EntitlementManagement.Read.All`[^hw04-assign] | — |
| List the mover's access package assignments | `EntitlementManagement.Read.All`[^hw04-assign] | — |
| List the mover's group memberships, direct and transitive | `User.Read.All` (application)[^hw04-transitive] | — |

The code reads `transitiveMemberOf` rather than `memberOf` on purpose: for another user's direct memberships Learn's least-privileged application permission is `Directory.Read.All`, while the transitive call needs only `User.Read.All`.[^hw04-memberof][^hw04-transitive]

### The tests

This chapter's tests are the nine in the Chapter 04 block of `tests/test_joiners_and_access.py`: the evaluator, the shipped policies, each rule on the broken files, disjoint policies, the scope limit, the export scan, the residual's classes, the completed review's interval and the review sheet. The kit's 57 tests pass under Python 3.14 with no package, tenant or network.

::: {.callout-important}
## Illustrative code
The commands below run against the repository's policy files and fictional exports. They show what the code does, not that a tenant returns the same shapes. Review the files, test each rule against a real population export, and run Lab 2 in a test tenant, before a policy reaches production.
:::

## Lab 1: fixtures, no tenant

You need Python 3.10 or later. Work in `examples/hr-lifecycle`.

1. **List the reads and their permissions:**

   ```bash
   python python/graph_export.py --task access-read --list
   ```

   ```text
   Task access-read: EntitlementManagement.Read.All, User.Read.All
     GET /identityGovernance/entitlementManagement/assignmentPolicies  [EntitlementManagement.Read.All]
     GET /identityGovernance/entitlementManagement/assignments  [EntitlementManagement.Read.All]
     GET /users/{userId}/transitiveMemberOf/microsoft.graph.group  [User.Read.All]
   ```

2. **Lint the program's policies over the population:**

   ```bash
   python python/access_assignment.py lint config/access --population tests/fixtures/ch04/population.json
   ```

   ```text
   Policies: 3 files
   Lint: 0 Finding, 0 Warn, 0 Info
   ```

3. **Lint five broken policies:**

   ```bash
   python python/access_assignment.py lint tests/fixtures/ch04/bad-access --population tests/fixtures/ch04/population.json
   ```

   ```text
   Policies: 5 files
   Lint: 5 Finding, 2 Warn, 0 Info
     AA-01 Finding: AUTO via group membership: rule uses memberOf; from November 3, 2026 the policy is quarantined and adds and removes nothing
     AA-02 Finding: auto-by-department.json, auto-second-policy.json: 2 users match more than one automatic policy on one package; they can lose access
     AA-05 Finding: AUTO infra admin eligibility: automatic policy doesn't both create and remove assignments
     AA-07 Finding: REQUEST with no fallback: request policy doesn't route to the manager with a fallback approver
     AA-09 Finding: AUTO infra admin eligibility: tier T1 access assigned by rule; privileged access is requested and activated through PIM
     AA-04 Warn: AUTO Program Ops by department name: rule reads no coded slot or worker type; write it on the codes HR owns
     AA-06 Warn: AUTO Program Ops by department name: grace period 30 days is over the program's 14
   ```

   The exit code is 2. The two Program Operations policies overlap on the two employees of ORG-100 in the population: one rule reads the department name, the other every employee.

4. **Scan the tenant's policies for `memberOf`:**

   ```bash
   python python/access_assignment.py memberof-scan --policies tests/fixtures/ch04/assignment-policies.json
   ```

   ```text
   Assignment policies read: 4; using memberOf: 1
     MS-01 Finding: Shared drives (legacy): AUTO via group membership
   ```

   Run Learn's own script too; this scan is the same test in the pipeline, over the export `graph_export.py` writes.

5. **List a mover's residual:**

   ```bash
   python python/access_assignment.py residual --mover tests/fixtures/ch04/mover.json --assignments tests/fixtures/ch04/mover-assignments.json \
       --memberships tests/fixtures/ch04/mover-memberships.json --policies config/access --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch04/residual
   ```

   ```text
   Mover jordan.diaz@contoso.example: 8 items held, 3 to the residual review
   Residual: 1 Finding, 3 Warn, 0 Info
   Written to out/ch04/residual (residual-review.csv goes to the manager of record)
   ```

   Jordan moved from ORG-100 to ORG-210 on October 19. `residual.json` shows the Program Operations baseline *removed by rule after grace* on October 26, the Infrastructure Services baseline *kept by rule*, the two packages' app groups *package-managed* and the ORG-210 dynamic group *rule-managed*. The review sheet holds the other three:

   ```text
   item,kind,via,class
   Grants reporting workspace,access package,REQUEST Grants reporting,requested: review
   APP-Legacy-Timekeeping-Approvers,group,direct or nested assignment,outside packages: review
   SHARE-ProgramOps-Finance,group,direct or nested assignment,outside packages: review
   ```

   The Finding is RV-02: the review is still open 13 days after the move, past the program's ten.

6. **Run the tests:**

   ```bash
   python -m pytest tests -q
   ```

**Expected result:** 57 tests passing. Delete `out/ch04` when you're done.

## Lab 2: test tenant

*Not run by the authors.* Use a test tenant in the worldwide or GCC cloud with Microsoft Entra ID Governance trial or test licenses, never production, two test access packages and three test users with coded attributes.

1. **Export.** Register a reader app with a certificate, grant `EntitlementManagement.Read.All` and `User.Read.All` with admin consent, put a token in `HRLC_GRAPH_TOKEN`, and run `python python/graph_export.py --task access-read --cloud gcc --param userId=<test-user-id> --out exports/access`. Run `memberof-scan` on `exports/access/assignment-policies.json`, and Learn's read-only script beside it; the two lists must match.
2. **Create one policy.** Point a copy of `auto-program-operations.json` at your test package, lint it, strip `_program` and send it as an Identity Governance Administrator with `New-MgEntitlementManagementAssignmentPolicy -BodyParameter ...`.[^hw04-cmdlets] Wait several minutes, as Learn says, and confirm the matching test users receive assignments.
3. **Move a test user.** Change the user's organization code through the pipeline (never by hand: [Chapter 01](01-the-writer-register-as-code.md)), wait for the grace period you set (use `PT1H` in the test copy), and confirm the old assignment is removed and the new one created. Run VK-DG-05 against the snapshot you took before the move.
4. **Run the residual.** Export the user's assignments and memberships again and run `residual`. Give the sheet to the test manager, record the review's completion in the mover file, and run it again for the interval.
5. **Back it out.** Remove the test policy with `Remove-MgEntitlementManagementAssignmentPolicy -AccessPackageAssignmentPolicyId <id>`,[^hw04-remove] choosing in the portal whether its assignments are removed, as the guide's rollback says; restore the test user's code through the pipeline; remove the reader app, its permissions and certificate; delete `exports` and `out/ch04`.

## Verified facts

| Item | Value | US Government clouds | Stage | Source |
|---|---|---|---|---|
| Automatic assignment policy | Rule on user attributes; assignments created and removed; grace period; one per package unless scopes never overlap; hidden dynamic group per policy; at most 15,000 identities; Identity Governance Administrator, not catalog owners or access package managers | — | GA | [^hw04-auto] |
| `memberOf` in a policy rule | Quarantined from November 3, 2026: no assignments added or removed until removed; read-only script | — | — | [^hw04-auto] |
| Create assignmentPolicies | `POST /identityGovernance/entitlementManagement/assignmentPolicies`; `EntitlementManagement.ReadWrite.All`; example 3 with `attributeRuleMembers` and `automaticRequestSettings` | L4 and L5 | v1.0 | [^hw04-create] |
| `accessPackageAutomaticRequestSettings` | `requestAccessForAllowedTargets`, `removeAccessWhenTargetLeavesAllowedTargets`, `gracePeriodBeforeAccessRemoval` | — | v1.0 | [^hw04-ars] |
| `requestorManager` | The requester's manager as approver, `managerLevel` 1 or 2; include another approver | — | v1.0 | [^hw04-mgr] |
| List assignments and policies | `EntitlementManagement.Read.All` (application, across catalogs) | — | v1.0 | [^hw04-assign] |
| A user's memberships, direct and transitive | `User.Read.All` (application) | L4 and L5 | v1.0 | [^hw04-transitive] |
| A user's direct memberships | `Directory.Read.All` (application) | — | v1.0 | [^hw04-memberof] |
| Dynamic administrative units | Global Azure only, not Azure Government | Not available | — | [^hw04-audyn] |
| Entitlement management, access reviews, PIM, dynamic groups | Available in Azure Government | Available | GA | [^hw04-availability] |

Places where Learn's pages differ or stop, recorded so a later edit doesn't loosen the code:

- **The manager as approver.** `requestorManager` is documented for approval stages, with the instruction to add another approver; the code requires the fallback rather than treating it as optional.[^hw04-mgr]
- **Overlap.** Learn says overlapping automatic policies on one package can lose access but gives no test for overlap. AA-02 evaluates the rules over a population, which finds overlap only among the users the population holds; a transition between policies over time can't be seen from one population and stays a Warn.

## Federal requirements and evidence

This chapter supports the guide's Gate 4. The [Gate 4 requirements table](../../../books/guides/hr-driven-identity-implementation.md#step-4-assign-access-from-attributes-and-review-what-a-move-leaves) maps it to NIST SP 800-53 AC-2 (authorize access on organization-defined attributes, and account review), AC-6 (least privilege), AC-5 (separation of duties), PS-5 (personnel transfer) and CISA SCuBA MS.AAD.7.5v1 (highly privileged roles only through a privileged access management system, required under BOD 25-01); the [federal framework crosswalk](../../../reference/federal-framework-crosswalk.md) lists each source. What this code gives the ISSO:

- the reviewed policy files, the lint's clean run and the hash of each body sent, as the assignment policy exports with their rules (AC-2, AC-6);
- the `memberof-scan` output with zero rows, which the guide's Validate step asks for;
- AA-09's clean run, showing no privileged role reached by rule (MS.AAD.7.5v1);
- each mover's residual sheet, the manager's decisions and the transfer-to-review interval (PS-5);
- the separation-of-duties settings themselves stay in the package configuration ([Book 04, Chapter 09](../../../books/b04-access/09-access-governance.md#separation-of-duties)); this code doesn't read them.

## Dangers

| Danger | What happens | The guard |
|---|---|---|
| `memberOf` in a rule after November 3, 2026 | The policy is quarantined and stops removing access | AA-01 for files; `memberof-scan` for the tenant |
| Two automatic policies a user can match | The user can lose access | AA-02 over the population; one policy per package |
| A rule on a display name | A rename drops everyone from the package | AA-04 |
| A policy that never removes | A mover keeps the old department's access | AA-05 |
| A long grace | Access outlives the handover | AA-06; zero for privileged access by design |
| Privileged access by rule | Standing privilege no one requested | AA-09; eligibility by request, activation through PIM |
| A request with no fallback approver | Requests from users without a manager wait to expire | AA-07 |
| Hand-granted access on a mover | It stays forever, because no rule granted it | `residual` and the review sheet; RV-02 when the review runs late |
| An edit to the hidden dynamic group | Entitlement management overwrites it, or the policy misbehaves | Never touched by the code; Learn says not to modify it |
| A rule the evaluator can't read | A lint that pretends to understand it | The evaluator raises an error; AA-08 sends the rule to `examples/dynamic-rules` |

## Checklist

- [ ] Every assignment policy in the tenant has a file in `config/access`, and the lint is clean over a current population export.
- [ ] `memberof-scan` and Learn's script both return no policies.
- [ ] Each package has one automatic policy, or two whose disjointness is recorded and reviewed.
- [ ] No tier T0, T1 or privileged package has an automatic policy.
- [ ] Every request policy routes to the manager with a fallback approver.
- [ ] Every move in the period has a residual sheet, a decision for each item and a transfer-to-review interval within the threshold.
- [ ] The reader app holds only `EntitlementManagement.Read.All` and `User.Read.All`.
- [ ] In GCC High, the interim path for administrative units (a scheduled job, compared in Gate 7) is in place.

::: {.callout-tip}
## Continue the book
[← Previous: Chapter 03 — Joiner Workflows as Code and the Temporary Access Pass Bridge](03-joiner-workflows-as-code.md) · [Workbook index](index.md) · [Next: Chapter 05 — Certificate-Based Authentication Checks →](05-certificate-based-authentication-checks.md)
:::

[^hw04-auto]: Microsoft Learn, "Configure an automatic assignment policy for an access package in entitlement management," <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-auto-assignment-policy> (read November 1, 2026).
[^hw04-create]: Microsoft Learn, "Create assignmentPolicies," national cloud deployments, permissions and example 3, <https://learn.microsoft.com/graph/api/entitlementmanagement-post-assignmentpolicies?view=graph-rest-1.0> (read November 1, 2026).
[^hw04-ars]: Microsoft Learn, "accessPackageAutomaticRequestSettings resource type," <https://learn.microsoft.com/graph/api/resources/accesspackageautomaticrequestsettings?view=graph-rest-1.0> (read November 1, 2026).
[^hw04-mgr]: Microsoft Learn, "requestorManager resource type," <https://learn.microsoft.com/graph/api/resources/requestormanager?view=graph-rest-1.0> (read November 1, 2026).
[^hw04-assign]: Microsoft Learn, "View, add, and remove assignments for an access package in entitlement management," view assignments programmatically, <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-assignments>, and "Change request settings for an access package in entitlement management," create an access package assignment policy programmatically, <https://learn.microsoft.com/entra/id-governance/entitlement-management-access-package-request-policy> (read November 1, 2026).
[^hw04-transitive]: Microsoft Learn, "List a user's memberships (direct and transitive)," permissions for another user's memberships, <https://learn.microsoft.com/graph/api/user-list-transitivememberof?view=graph-rest-1.0> (read November 1, 2026).
[^hw04-memberof]: Microsoft Learn, "List a user's direct memberships," permissions for another user's direct memberships, <https://learn.microsoft.com/graph/api/user-list-memberof?view=graph-rest-1.0> (read November 1, 2026).
[^hw04-audyn]: Microsoft Learn, "Manage users or devices for an administrative unit with rules for dynamic membership groups," prerequisites, <https://learn.microsoft.com/entra/identity/role-based-access-control/admin-units-members-dynamic> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw04-availability]: Microsoft Learn, "Microsoft Entra feature availability," <https://learn.microsoft.com/entra/identity/authentication/feature-availability> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw04-bod]: Cybersecurity and Infrastructure Security Agency, "BOD 25-01: Implementing Secure Practices for Cloud Services Required Configurations," MS.AAD.7.5v1, <https://www.cisa.gov/resources-tools/services/bod-25-01-implementing-secure-practices-cloud-services-required-configurations> (read November 1, 2026; carried from the HR-driven identity implementation guide's verification log).
[^hw04-cmdlets]: Microsoft Learn, "New-MgEntitlementManagementAssignmentPolicy," <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.governance/new-mgentitlementmanagementassignmentpolicy?view=graph-powershell-1.0> (read November 1, 2026).
[^hw04-remove]: Microsoft Learn, "Remove-MgEntitlementManagementAssignmentPolicy," <https://learn.microsoft.com/powershell/module/microsoft.graph.identity.governance/remove-mgentitlementmanagementassignmentpolicy?view=graph-powershell-1.0> (read November 1, 2026).
