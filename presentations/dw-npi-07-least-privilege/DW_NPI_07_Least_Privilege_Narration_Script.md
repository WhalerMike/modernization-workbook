# Building Non-Person Identity, Chapter 07 — Least Privilege for Service Principals — narration script (practice copy)

## Slide 1 — Chapter 07: Least Privilege for Service Principals

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 7: least privilege for service principals. A permission nobody reviews stays forever, so this chapter's sweep reads every grant, asks its owner once a quarter, and removes only what a reviewer approved. We'll start from Learn's own review-and-revoke script, see why it shouldn't be run as published, then walk the sweep, the rules, the owner review, the plan and its write path, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — What an app can reach, and which cloud reads it

Start with what we're actually measuring. An app can hold two kinds of permission: an application permission, which is a role it holds on another app's service principal, and a delegated permission, which is a grant to act for one person or for everyone. Learn's way to see what an app can reach is to walk every service principal's role assignments, paying close attention to Microsoft Graph. And remember that directory roles and mail roles grant access too. For this estate, everything goes to the worldwide Graph and commercial Azure, and every call is available in the government clouds as well.

## Slide 3 — The program's rules: review, justify, narrow, hand off

The program adds its rules on top, marked as design guidance. Owners review every grant each quarter. No broad tenant-wide permission stands without a written, dated justification. Where Learn documents a narrower replacement, like selected sites, or scoped mail access, that's the target, and for mail the old unscoped grant has to go or the scope means nothing. Managed identities get Azure roles at the resource, not the subscription. Privileged service principals belong to the Privileged Access plan. And the code removes a grant, never an app.

## Slide 4 — Learn's review-and-revoke script, pinned and run

Here's Microsoft's starting point. Learn's review page has a PowerShell script that finds one app, removes all of its delegated grants, then tries to remove all of its application permissions, plus the matching Graph requests. A separate tutorial shows how to grant and revoke, which the second lab uses to restore what it removes. As in earlier chapters, the page is pinned unmodified with checked hashes and a weekly watch. The harness then runs the script exactly as published, against stand-ins that follow Learn's own API contract. That contract is where things get interesting.

## Slide 5 — What the script gets wrong: removals and targets

Run as published, the script has two opposite problems. First, it's indiscriminate: it removes every delegated grant and tries every application permission, with no list of what to keep and no dry run, so a permission someone formally approved goes along with the rest. Second, on Learn's own API contract, its application permission removals miss entirely: it passes the app's own ID where the reference says the resource belongs, so all three answer not found. The code keeps the requests as its model, and adds the keep list, the decisions and the plan.

## Slide 6 — What the script misses: reads, roles and hosts

The rest of the gaps are about scope and privilege. To find one app's grants, the script reads every grant in the tenant. To review, it signs in with write permissions, including the very broad directory one this chapter is trying to remove. It names a different administrator role than the API reference does. It hard-codes the worldwide host. And it never looks at directory roles or Azure role assignments, so an app in a directory role, or a managed identity that's Contributor on a subscription, passes unseen. So the verdict: use the requests, not the script.

## Slide 7 — The code, its inputs and the sweep

What does the code add? A module, two entry scripts, one that only reads and one that writes, its own call list, and a reviewed list of what counts as broad, with Learn's replacement for each class. Three small files carry the human decisions: exceptions from the security office, the owners' quarterly answers, and the Azure scopes to look at. The sweep then reads every service principal in the register: its roles on every resource, not just Graph, its delegated grants, its directory roles, and for a managed identity, its Azure roles. Every grant gets a stable key.

## Slide 8 — The check: nine rules, NPI-LP-01 to NPI-LP-09

The check compares the sweep with the reviewed list and the exceptions, and applies nine rules. The heart of it: a broad permission with no current, complete exception is a finding, whether it's an application permission or a delegated one granted to everyone. Two rules cover mail, including a subtle one: if the exception relies on scoped mail access but the unscoped grant is still there, the scope does nothing. Two more grade managed identities' Azure roles by how wide the scope is. Privileged apps are only noted here, because they're handed off.

## Slide 9 — The hand-off and the quarterly owner review

Two pieces sit between the check and the plan. First, the escalation class: a handful of permissions that let an app grant itself more, or act as others. Any app holding one is handed off whole to the Privileged Access plan, with everything it holds listed. Second, the quarterly owner review: one row per grant, sent to the owners, and only answers dated this quarter count. It closes when every row is decided and nothing approved for removal is still granted. Access reviews for privileged apps belong to the other workbook, and the chapter treats them as preview.

## Slide 10 — The plan: one action per broad grant or decision

The plan turns the owners' answers into one action each, and only two kinds ever write. Removing an application permission happens through the resource, and only once any replacement, like selected sites, is already in place. Narrowing a delegated grant can only make it smaller, never empty. Everything else is recorded: waiting for a decision or a replacement, kept under an exception, or handed to someone else's reviewed process, such as re-scoping an Azure role in infrastructure code. As before, identical inputs give an identical file, so a reviewer approves one hash.

## Slide 11 — The separate write path, and why it's a person

As in the last chapter, writing is a separate script with strict refusals. The plan must be the approved one, for this tenant and cloud, and less than a week old. It can only delete one kind of thing, a role assignment through its resource, and it can only shrink a delegated grant. And it runs as a person, signed in with the right administrator role. Why not an app? Because the permissions it needs are exactly the escalation permissions the sweep flags. Before each write it re-reads the target, and skips anything that changed.

## Slide 12 — Who answers the review, and what each task may hold

Who's involved? Developers build the tooling. Application owners answer the quarterly review. The identity governance officer closes it and receives the hand-off of privileged apps, and the security officers check the gate. The permission split mirrors the code. The sweep holds three read permissions in Graph and Reader in Azure, nothing that writes. The write task holds the two grant-management permissions and the administrator role, but only in a person's signed-in session, so nothing standing can grant itself more.

## Slide 13 — Lab 1: Learn's script, then the sweep

Lab 1 runs on a laptop with Chapter 1's inventory in place. First, Learn's script against the stand-ins: read the test where all three application permission removals come back not found, because the script named the wrong service principal. Then list the permissions each task needs, which match the table we just saw. Then run the sweep over a fictional estate: eleven service principals, twenty grants, three handed to the Privileged Access plan, and an owner review that isn't closed yet. Two agent identities are skipped, because they're Chapter 9's.

## Slide 14 — Lab 1: the findings, the hand-off and the review

Now read the findings, and each rule shows up in a realistic shape. A mail automation app holds the broad directory permission with no exception. A connector's exception quietly ended last month. A mail permission is "scoped" in Exchange, but the unscoped grant is still there, so the scope does nothing. A batch machine's managed identity holds roles at the subscription and the management group. Three apps can grant themselves more, so they're handed off. And in the review, one answer from July doesn't count any more, because it's a new quarter.

## Slide 15 — Lab 1: the plan, a dry run and a refusal

Then the plan. Of eleven actions, three write: a connector's full-control site permission is removed because its selected-sites replacement is already granted, the broad directory permission is removed, and a partner app's all-users grant is narrowed to just reading profiles. The dry run shows the point of the whole exercise: both removals go through Microsoft Graph's service principal, the resource, not the app. Applying it to the fake sends three writes, and a hash nobody approved is refused. Delete the output afterwards, because the review names real owners.

## Slide 16 — Lab 2: a test tenant, one real removal

Lab 2 uses a test tenant and subscription, never production, with fictional people. You create a broad grant and an over-scoped managed identity on purpose, then sweep with read-only permissions and confirm both findings appear. An owner decision of remove goes in, a second person approves the plan's hash, and you apply it as a person. You also try the script's original request shape once, and write down what Graph really answers. After a few minutes, the grant is gone and the audit log shows a person as the actor. Then restore everything.

## Slide 17 — Dangers, and the guard for each

Each danger here has a guard in the code. The most direct is simply running Learn's script against a real tenant, which removes far more than anyone planned. Close behind are deleting an app instead of a grant, and removing a broad permission before its replacement is in place, which takes a workload down in production. Then the subtle ones: a mail scope that does nothing while the old grant stays, a narrowing that actually widens, last quarter's answer passing as this quarter's, and a permission quietly re-granted at the next consent.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Every service principal was swept, or skipped with a reason. Every broad permission has a current, complete exception or a decision to remove or narrow it. No mail scope is pretending while the old grant stays, and every managed identity's Azure role sits at the resource. The privileged apps went to the Privileged Access plan and were closed there. The quarter's review is closed, and every write ran as a person, on a plan someone else approved. Next, Chapter 8 puts Conditional Access on workload identities. Thanks for watching.
