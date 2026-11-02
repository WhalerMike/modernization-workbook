# Building HR-Driven Identity, Chapter 04 — Access from Attributes and the Mover's Review — narration script (practice copy)

## Slide 1 — Chapter 04: Access from Attributes and the Mover's Review

Welcome back to Building HR-Driven Identity. This is Chapter 4: access from attributes and the mover's residual review. An automatic policy removes what its rule granted. It never removes what someone granted by hand, and a move is exactly when that access stops being right. So this chapter starts from Learn's procedure for an automatic assignment policy, then adds what Learn leaves to you: the policies as reviewed files, a lint of nine rules, a scan for the member-of operator, and the mover's residual review. Then two labs, and the dangers.

## Slide 2 — Why Gate 4 needs code

Why does this gate need code? The guide's Step 4 assigns department packages by rule, one automatic policy per package, with no member-of operator, a grace period for movers, manager approval for requests, and a review of what's left after a move. Each of those is a property of a policy body or a fact about what a user holds. That means code can check it every time, instead of someone checking it once. And for every rule, you'll know whether it's Learn's contract, Learn's warning, or the program's own design.

## Slide 3 — What Learn gives you: the automatic policy

Learn's page on automatic assignment policies is the procedure. A policy carries a membership rule in the dynamic group syntax. Entitlement management creates assignments for users who match, removes them for users who stop matching, and a grace period can keep access for a while. Learn suggests one automatic policy per package, warns that overlap can lose users their access, caps a rule at fifteen thousand identities, and needs the Identity Governance Administrator. And from November third, 2026, a policy using member-of is quarantined: it stays, but does nothing.

## Slide 4 — The request body, and the manager as approver

Learn's Create assignment policies page, example three, gives the request: a post to the assignment policies endpoint, scoped to specific directory users, with an attribute rule target holding the rule, the automatic request settings and the access package. Those settings have just three properties: create for those in scope, remove when they leave, and the grace period. For request policies, the requestor manager setting makes the requester's manager the approver, and Learn says to add another approver in case there's no manager.

## Slide 5 — What Learn leaves to you

Learn gives the portal steps and one request body. It doesn't keep policies where a reviewer approves them, test a rule against the population before it goes live, find overlap between two policies, or say what a move leaves outside the rules. So the kit keeps one file per policy, turns Learn's warnings into lint rules, scans the tenant's export for member-of, refuses privileged packages by rule, and lists the mover's residual. The verdict: keep Learn's body and checkboxes as they are, and enforce its warnings in code.

## Slide 6 — The policy files and the evaluator

Here's what the kit ships. The config access folder holds two automatic policies, one per department package, each written on the organization code and the worker type, with a seven-day grace. And one request policy for infrastructure administrator eligibility, which the manager approves, with a fallback. It grants eligibility only; the role is activated through PIM. Each file's program block records its tier and the groups it grants. A small evaluator reads only the rule operators these policies use, and raises an error on anything else.

## Slide 7 — The lint: nine rules

The lint has nine rules. Member-of in a rule is a finding. Two automatic policies on one package that a user matches at once is a finding, and two disjoint ones a warning. More than fifteen thousand identities is a finding. A rule with no coded slot or worker type warns, because a department name breaks on a rename. A policy must both create and remove. A grace over fourteen days warns. Requests need the manager and a fallback. And no privileged package may be assigned by rule.

## Slide 8 — The mover's residual review

The residual review takes the mover's old and new attributes, the effective date, their package assignments, their group memberships and the policy files. For each automatic assignment, it re-evaluates the rule on the new attributes: kept, or removed at the end of the grace. Anything from another policy is marked for review. Dynamic groups are rule-managed, groups a held package grants are package-managed, and anything else goes to review. The sheet goes to the manager of record, and the interval from transfer to review is measured.

## Slide 9 — The reads, the clouds and the tests

The reads are one task. Listing policies and assignments needs entitlement management read. Group memberships use the transitive call on purpose, because it needs only user read, while another user's direct memberships need directory read. The tools read Graph on the cloud you name. One gap matters here: administrative units with dynamic rules exist only in global Azure, so a GCC High tenant uses the guide's interim path. Nine tests cover this chapter, and all fifty-seven of the kit's tests pass with no tenant.

## Slide 10 — The verified facts, and where Learn stops

The verified facts, each read on November first. The automatic policy is generally available, with the limits we've seen. Member-of rules are quarantined from November third. The create call is in version one point oh, available in the L4 and L5 clouds. And dynamic administrative units aren't available in Azure Government. Two places where Learn stops are recorded so a later edit doesn't loosen the code: the fallback approver is required, not optional, and overlap is found only among the users the population holds.

## Slide 11 — What the output proves, and for whom

What does this give the I S S O? The reviewed policy files, the lint's clean run and the hash of each body sent, for account management and least privilege, AC-2 and AC-6. The member-of scan with zero rows, which the guide's validate step asks for. A clean run of the privileged-package rule, showing no privileged role reached by rule, which SCuBA requires under BOD 25-01. And each mover's residual sheet, the manager's decisions and the interval, for personnel transfer, PS-5. Separation of duties stays in the package configuration.

## Slide 12 — Who builds, who owns, who reviews

Who does what? Developers build the access automation; they read Python and JSON and know dynamic membership rules. Entitlement management owners keep the packages, and only an Identity Governance Administrator can create an automatic policy. Policy reviewers approve each file before it reaches the tenant. The manager of record approves requests and decides each item on a mover's residual sheet. And the I S S O files the evidence: the lint runs, the empty scan, the sheets and the intervals.

## Slide 13 — Lab 1: the reads, and a clean lint

Lab 1 runs on a laptop with Python and no tenant. Step one lists the reads and their permissions: the assignment policies and the assignments under entitlement management read, and the transitive memberships under user read. Nothing writes. Step two lints the program's three policy files, evaluating each rule over the fixture population. Zero findings, zero warnings. That's the baseline every new policy file has to keep.

## Slide 14 — Lab 1: five broken policies

Step three lints five broken policies, and the lint exits with code two. A rule using member-of would be quarantined. Two Program Operations policies overlap on two employees of ORG-100, because one rule reads the department name and the other matches every employee; those two can lose access. One automatic policy doesn't remove, and it also hands tier one access out by rule. A request policy has no fallback approver. And the department-name rule warns twice: no coded slot, and a thirty-day grace.

## Slide 15 — Lab 1: the memberOf scan and a mover's residual

Step four scans an export of the tenant's policies: four read, one uses member-of, the legacy shared drives policy. Learn's own script runs the same test against a tenant; this one runs in the pipeline. Step five lists a mover's residual. Jordan moved from ORG-100 to ORG-210 on October nineteenth: eight items held, three go to review. A requested package and two groups granted outside any package land on the sheet for the manager. The one finding: the review is still open thirteen days after the move. Step six: fifty-seven tests pass.

## Slide 16 — Lab 2: one policy and one move, in a test tenant

Lab 2 uses a test tenant, never production; the authors haven't run it. Export with a read-only app, and run the member-of scan beside Learn's script: the lists must match. Create one policy from a copy of the program's file, with a one-hour grace, linted first and sent by an Identity Governance Administrator. Move a test user through the pipeline, never by hand, with the validation kit's snapshot before and after. Run the residual, give the sheet to the test manager, and measure the interval. Then back everything out.

## Slide 17 — Dangers, and the guard for each

The dangers. Member-of in a rule after November third quietly stops removal; the lint and the scan catch it. Two policies a user can match lose access. A rule on a display name drops everyone on a rename. A policy that never removes, or a long grace, lets access outlive the move. Privileged access by rule is standing privilege. Hand-granted access on a mover stays forever, which is what the residual sheet is for. Never edit the hidden group. And a rule the evaluator can't read raises an error instead of pretending.

## Slide 18 — Done when: the Gate 4 checklist

Here's what done looks like. Every policy in the tenant has a reviewed file, and the lint is clean over a current population. The member-of scan and Learn's script both come back empty. Each package has one automatic policy, or two whose disjointness is recorded. No privileged package is assigned by rule, and every request has a fallback approver. Every move has a residual sheet, a decision for each item, and an interval within the threshold. Next, Chapter 5 covers certificate-based authentication checks. Thanks for watching.
