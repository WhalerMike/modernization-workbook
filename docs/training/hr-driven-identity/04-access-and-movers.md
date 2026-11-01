---
title: "Module 4: Assign access from attributes and review what a move leaves"
description: "Gate G4 and workbook Chapter 04: lint access package assignment policies before they reach the tenant (memberOf quarantine, overlapping automatic policies, rules on coded slots, a bounded grace period, privileged access kept out of rules, manager approval with a fallback), scan an export for memberOf, and list a mover's residual access for review. About 50 minutes, with a lab on fixtures and a test tenant lab."
doc-type: training-module
research-status: draft
research-type: training module
research-book: "Book 03"
last-reviewed: 2026-11-01
series-order: 4
---

# Module 4: Assign access from attributes and review what a move leaves {.unnumbered}

*Part of the [HR-Driven Identity learning path](index.md). Gate G4 Access and movers. Workbook [Chapter 04](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md). About 50 minutes.*

## Introduction (3 minutes)

When HR moves a person to a new organization, a rule on the organization code should take away the old department's access and give the new one. Automatic assignment policies in entitlement management do that. But a rule can be wrong in ways the portal won't tell you: two policies on one package that a user matches at once, a rule that reads a display name, or a rule on `memberOf`, which Learn quarantines from November 3, 2026. And a rule can't see access the person was given by hand.

In this module you lint the policies before they reach the tenant, scan the tenant's policies for `memberOf`, and list what a move leaves behind for the manager of record to review.

**The federal requirement.** This gate meets NIST SP 800-53 AC-2 (authorize access on organization-defined attributes, and account review), AC-6 (least privilege), AC-5 (separation of duties), PS-5 (personnel transfer) and CISA SCuBA MS.AAD.7.5v1 (highly privileged roles only through a privileged access management system, required under BOD 25-01). The requirements and evidence are in the [Gate 4 requirements table](../../books/guides/hr-driven-identity-implementation.md#step-4-assign-access-from-attributes-and-review-what-a-move-leaves) (under **Federal requirements and evidence** in Step 4) and the workbook chapter's [Federal requirements and evidence](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md#federal-requirements-and-evidence).

## Learning objectives (1 minute)

After this module, you'll be able to:

- explain why each package gets one automatic policy and no rule uses `memberOf`;
- run the policy lint over a population and explain AA-01, AA-02 and AA-09;
- run the `memberOf` scan on an export of the tenant's policies;
- list a mover's residual access, classify each item, and read the transfer-to-review interval.

## Prerequisites (1 minute)

- [Module 1](01-one-writer-per-state.md): a move reaches the directory through the pipeline, never by hand.
- [Module 3](03-joiners-and-the-temporary-access-pass.md): the day-one workflow requests the onboarding package; department access comes from this gate.

## Unit 1: Access from attributes (7 minutes)

Read the guide's [Step 4](../../books/guides/hr-driven-identity-implementation.md#step-4-assign-access-from-attributes-and-review-what-a-move-leaves): one automatic policy per package, no `memberOf`, a grace period for movers, manager approval with a fallback, the mover workflow's residual review, and privileged access kept out of rules.

Then read the design in [Book 03, Chapter 10](../../books/b03-hr-identity/10-from-attributes-to-access.md): its [rule patterns](../../books/b03-hr-identity/10-from-attributes-to-access.md#rule-patterns), [access packages and access reviews](../../books/b03-hr-identity/10-from-attributes-to-access.md#access-packages-and-access-reviews), and [where dynamic membership stops](../../books/b03-hr-identity/10-from-attributes-to-access.md#where-dynamic-membership-stops). [Book 03, Chapter 08, Mover](../../books/b03-hr-identity/08-joiner-mover-leaver.md#mover) says what a move must start.

If your agency is in GCC High, note the gate's availability gap and interim path in the guide: administrative units with dynamic membership rules aren't available in Azure Government.

## Unit 2: The lint and the residual review (8 minutes)

Read three sections of workbook Chapter 04:

- [The policy files](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md#the-policy-files): two automatic policies on the organization code and worker type, and one request policy that grants eligibility only.
- [The lint](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md#the-lint): AA-01 to AA-09, and how the evaluator checks a rule over a population to find overlap.
- [The mover's residual review](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md#the-movers-residual-review): kept by rule, removed by rule after grace, package-managed, rule-managed, or sent to review.

## Exercise: Lab 1, fixtures, no tenant (20 minutes)

This is the workbook's [Lab 1](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md#lab-1-fixtures-no-tenant). Work in `examples/hr-lifecycle`.

<!-- labs:begin lab-1-commands (generated by scripts/generate_labs.py; not part of the reviewed page) -->

::: {.callout-note #lab-1-commands collapse="false" title="Every command in Lab 1"}
Every command in this lab, in order, from `examples/hr-lifecycle`. Each step below says what it does and what to look for.

```bash
# Step 1
python python/graph_export.py --task access-read --list

# Step 2
python python/access_assignment.py lint config/access --population tests/fixtures/ch04/population.json

# Step 3
python python/access_assignment.py lint tests/fixtures/ch04/bad-access --population tests/fixtures/ch04/population.json

# Step 4
python python/access_assignment.py memberof-scan --policies tests/fixtures/ch04/assignment-policies.json

# Step 5
python python/access_assignment.py residual --mover tests/fixtures/ch04/mover.json --assignments tests/fixtures/ch04/mover-assignments.json --memberships tests/fixtures/ch04/mover-memberships.json --policies config/access --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch04/residual

# Step 6
python -m pytest tests -q
```

:::

<!-- labs:end -->

1. List the reads and their permissions:

    ```bash
    python python/graph_export.py --task access-read --list
    ```

    ```text
    Task access-read: EntitlementManagement.Read.All, User.Read.All
      GET /identityGovernance/entitlementManagement/assignmentPolicies  [EntitlementManagement.Read.All]
      GET /identityGovernance/entitlementManagement/assignments  [EntitlementManagement.Read.All]
      GET /users/{userId}/transitiveMemberOf/microsoft.graph.group  [User.Read.All]
    ```

2. Lint the program's policies over the population:

    ```bash
    python python/access_assignment.py lint config/access --population tests/fixtures/ch04/population.json
    ```

    ```text
    Policies: 3 files
    Lint: 0 Finding, 0 Warn, 0 Info
    ```

3. Lint five broken policies:

    ```bash
    python python/access_assignment.py lint tests/fixtures/ch04/bad-access --population tests/fixtures/ch04/population.json
    ```

    Expect `Lint: 5 Finding, 2 Warn, 0 Info` and exit code 2. Find AA-01 (a rule on `memberOf`), AA-02 (two users match two automatic policies on one package) and AA-09 (tier T1 access assigned by rule).

4. Scan the tenant's policies for `memberOf`:

    ```bash
    python python/access_assignment.py memberof-scan --policies tests/fixtures/ch04/assignment-policies.json
    ```

    ```text
    Assignment policies read: 4; using memberOf: 1
      MS-01 Finding: Shared drives (legacy): AUTO via group membership
    ```

5. List a mover's residual:

    ```bash
    python python/access_assignment.py residual --mover tests/fixtures/ch04/mover.json --assignments tests/fixtures/ch04/mover-assignments.json --memberships tests/fixtures/ch04/mover-memberships.json --policies config/access --as-of 2026-11-01T12:00:00Z --cloud gcc --out out/ch04/residual
    ```

    ```text
    Mover jordan.diaz@contoso.example: 8 items held, 3 to the residual review
    Residual: 1 Finding, 3 Warn, 0 Info
    Written to out/ch04/residual (residual-review.csv goes to the manager of record)
    ```

    Print the review sheet:

    ```bash
    cat out/ch04/residual/residual-review.csv
    ```

    It holds one requested package and two groups outside packages. The Finding is RV-02: the review is still open 13 days after the move, past the program's ten.

6. Run the tests:

    ```bash
    python -m pytest tests -q
    ```

    Expect `57 passed`. Delete `out/ch04` when you're done:

    ```bash
    rm -rf out/ch04
    ```

## Exercise: Lab 2, your test tenant (5 minutes to read)

*Not run by the authors.* Follow the workbook's [Lab 2](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md#lab-2-test-tenant) in a worldwide or GCC test tenant with Microsoft Entra ID Governance trial or test licenses, never production, two test access packages and three test users with coded attributes.

- **What you do:** export the policies and run the scan beside Learn's read-only script, create one automatic policy, move a test user through the pipeline, and run the residual review.
- **Permissions:** a reader app with a certificate holding `EntitlementManagement.Read.All` and `User.Read.All`; the Identity Governance Administrator role to create the policy.
- **Back-out:** remove the test policy, choosing whether its assignments are removed; restore the test user's code through the pipeline; remove the reader app, its permissions and certificate; delete the export and output folders.

## Knowledge check (5 minutes)

1. From November 3, 2026, what happens to an automatic assignment policy whose rule uses `memberOf`?
    a. It's deleted
    b. It's quarantined: it stays, but adds and removes nothing until the operator is removed
    c. It's converted to a request policy
    d. Nothing changes; `memberOf` is still supported
2. Two automatic policies on one package each match the same two users. Which rule flags it, and why does it matter?
    a. AA-02; users who match two policies, or move between them, can lose access
    b. AA-03; the package goes over 15,000 identities
    c. AA-06; the grace period doubles
    d. AA-08; the rule is outside the evaluator's subset
3. A package grants tier T1 administrator eligibility to everyone whose organization code matches. What's wrong?
    a. Nothing, if the grace period is zero
    b. Privileged access is assigned by rule; HR attributes should decide who may request eligibility, and the role is activated through PIM
    c. The rule must use `memberOf` instead
    d. Only the manager can be in scope
4. In the residual review, which items go to the manager of record?
    a. Every assignment and group the mover holds
    b. Only dynamic groups
    c. Assignments from request policies and groups held outside packages
    d. Only packages removed by rule after the grace period

::: {.callout-tip collapse="true"}
## Check your answers
1. **b.** Quarantined, adding and removing nothing; Learn publishes a read-only script to find them. Taught in the guide's [Step 4](../../books/guides/hr-driven-identity-implementation.md#step-4-assign-access-from-attributes-and-review-what-a-move-leaves) and [The lint](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md#the-lint).
2. **a.** One automatic policy per package unless scopes never overlap. Taught in [The lint](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md#the-lint) and the guide's [Dangers](../../books/guides/hr-driven-identity-implementation.md#dangers).
3. **b.** AA-09; SCuBA MS.AAD.7.5v1 keeps highly privileged roles in a privileged access management system. Taught in the guide's [Step 4](../../books/guides/hr-driven-identity-implementation.md#step-4-assign-access-from-attributes-and-review-what-a-move-leaves) and [Book 03, where dynamic membership stops](../../books/b03-hr-identity/10-from-attributes-to-access.md#where-dynamic-membership-stops).
4. **c.** *Requested: review* and *outside packages: review* items. Taught in [The mover's residual review](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md#the-movers-residual-review).
:::

## Summary (2 minutes)

You linted three good and five broken assignment policies over a population, found a `memberOf` policy in a tenant export, and listed one mover's residual access with an overdue review.

**The evidence an ISSO keeps** for Gate 4: the reviewed policy files, the lint's clean run and the hash of each body sent; the `memberof-scan` output with zero rows; AA-09's clean run; each mover's residual sheet, the manager's decisions and the transfer-to-review interval; and the separation-of-duties settings in the package configuration. The full list is in the workbook's [Federal requirements and evidence](../../project-plans/developer-workbooks/hr-driven-identity/04-access-from-attributes-and-the-mover-review.md#federal-requirements-and-evidence).

**Next:** [Module 5: Check certificate-based authentication](05-certificate-based-authentication.md).
