# Building Non-Person Identity, Chapter 03 — The Migration Path Matrix as Code — narration script (practice copy)

## Slide 1 — Chapter 03: The Migration Path Matrix as Code

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 3: the migration path matrix as code. Every service account and app needs a decision before anything is converted, and this chapter turns the book's matrix into reviewed data and code that proposes a target, checks the owner's choice, sequences the waves and checks the gate. We'll start from Learn's own decision tables, see what they leave out, then walk the code, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Three things to keep apart: proposal, decision, gate

Why does this chapter matter? Because three different things get blurred together, and the code keeps them apart. The matrix proposes a target for each account, based on what it is, where it runs and what credential it holds. The application owner decides, and may disagree, as long as the reason is on the record. And the security officer's gate checks that every account has both, that the riskiest go first, and that there's a way back. Treat a proposal as a decision and you convert accounts nobody agreed to. First, which cloud this runs against.

## Slide 3 — Which cloud: Graph hosts, licenses and the trial

Which cloud? Most of this chapter never touches a cloud at all: the matrix is offline logic over the files from the first two chapters. It makes just two reads, both to Microsoft Graph, and for a GCC tenant like this estate's, that's the worldwide endpoint. The higher government clouds have their own hosts. One open question is the licensing trial: Learn says there's no free trial in the Azure Government clouds, but a GCC tenant signs in to the worldwide cloud, so the chapter leaves it as something to check in the test tenant. Now, what Microsoft gives you.

## Slide 4 — What Learn gives: a preference order and two tables

Here's what Microsoft gives you, and its order of preference is one the matrix keeps. On premises, a group managed service account whenever possible, and a plain user account only as a last resort. In the cloud, a managed identity if the service runs in Azure and supports one, a service principal otherwise, never a user account. Windows Server adds the delegated managed service account, which has real limits: you can't move a managed service account onto one, and delegation stops working. Learn turns this into two decision tables, but no code. So the repository pins the pages unmodified, and a small harness evaluates each table exactly as published.

## Slide 5 — What Learn's tables miss: dMSA, retire, the facts

This is the heart of the chapter, in two parts. Learn's ordering is kept as the model. But the on-premises table has no column for the delegated managed service account at all, so the best target on a new domain never comes out of it. It admits a plain user account in every situation, so it never tells you to move off one. It has no way to say retire, so an orphaned or disabled account would just get a new account type. And it decides on facts like server counts that no register holds. The code fills each gap, and a test pins every row.

## Slide 6 — What they miss: federation, coverage, a record

The cloud side has gaps too. The table recommends a managed identity if the service supports one, but leaves you to find out whether it does, so the code makes that a required fact. It offers a service principal only certificates and secrets, missing federation, which the book prefers. It happily recommends a service principal for a multitenant app, without saying that Conditional Access can't cover one, so you could license something and buy nothing. And nothing records a decision at all. The verdict: Learn's tables define preference, but they aren't the matrix. Let's look at the code.

## Slide 7 — The code and the inputs it reads

So what does the code add? One module and an entry script, built on the module from Chapter 2, and changing nothing in the earlier chapters. What matters most is who keeps each input. The matrix itself belongs to identity engineering and changes only in a reviewed pull request. The application owners keep two files: where each workload runs, and what they decided for each account. The waves, the program's dates and the licensing decision each have their own keeper. And the earlier chapters' outputs are refused if their hashes don't match the manifests, so nobody decides on evidence the reviewer never saw.

## Slide 8 — The proposal: scope first, then the matrix rows

Here's how a proposal is made. First, scope: some accounts belong to another plan, some are covered by their app registration, and some are out of scope with a reason written down. Then retirement comes first: if Chapter 2 found an account unowned, or it's already disabled, the proposal is to retire it. Otherwise, the first matrix row that matches the account's type, where it runs and its credential proposes the target. And each proposal carries Learn's cautions, like the fact that an Arc server's managed identity is shared by every app its administrators allow.

## Slide 9 — The decision check: nine rules, NPI-MAT-01 to -09

The decision check reads each owner's row and turns what's missing or wrong into findings with stable IDs. In plain terms: every account needs a decision; every account needs enough facts for a proposal; the target has to fit the decision, and Learn's delegated account limits are enforced; an owner who departs from the matrix has to say why; anything kept needs an end date, and anything kept on Kerberos needs an owner for its service principal name; high-risk accounts go first; every wave needs a way back; and the licensing scope has to make sense. The exact wording is on the slide.

## Slide 10 — Waves and their rollback (N2.2)

A conversion with no way back turns a failed change into an outage, so the waves get as much attention as the targets. Every rollback owner and service principal name owner is looked up once, and counts only if they're an enabled member, the same rule as Chapter 2. An account the owner didn't place in a wave is proposed for the first wave if it's high-risk, the second otherwise. And each wave's rollback is assembled from its members' targets, including Learn's own undo for a delegated account migration, which keeps the old account rather than deleting it.

## Slide 11 — The Workload ID Premium scope (D-N4) and Gate 2

The licensing decision belongs to the chief information security officer, and the code makes it checkable. Premium adds things like Conditional Access for workload identities, but that only covers single-tenant service principals: not managed identities, and not multitenant apps. So the code works out who could be covered today and who will leave or join after conversion, reads the tenant's subscriptions once, and checks the decision file against both. It never buys or assigns anything. Then the gate check reports Gate 2's five criteria, and the gate is met only when no finding is open. Who's involved?

## Slide 12 — Who proposes, decides, approves, and what it reads

Who's this for? Developers build the decision records. Identity engineers propose the targets and keep the matrix itself. The application owners make the real call, account by account, and say where each workload runs. The chief information security officer decides the licensing scope, and the security officer for the system approves the gate. As for the tenant, the code asks for very little: two read permissions, one to look up the owners and one to read the subscriptions, and it only ever reads.

## Slide 13 — Lab 1: Learn's tables, then the matrix run

Lab 1 needs only a laptop with PowerShell 7 and Pester, and no tenant. First you run Learn's tables exactly as published, and one test makes the point plainly: the on-premises table never rules out a user account. Then you list what the task needs, two read permissions and nothing but reads. Then you run the first two chapters and the matrix over the fictional estate. The summary tells you how many identities are in scope and proposed, how many owners have decided, and that the gate isn't met yet, which is exactly what we want to read next.

## Slide 14 — Lab 1: reading the proposals and the findings

Reading the output is where the rules turn real. Six accounts are proposed for retirement, the orphans and the disabled ones from Chapter 2. Others go to delegated or group managed accounts, some are kept, and one app has no proposal because nobody recorded where it runs. The findings tell the story: a high-risk account scheduled too late, a Kerberos account kept with no owner for its service principal name, an owner who overrode the matrix but gave a reason, and two apps on the licensing list that Conditional Access can't actually protect.

## Slide 15 — Lab 1: the waves, the D-N4 scope, the tests

Next, the waves. The first wave has a named rollback owner and a clear way back. The second has an empty owner, which is exactly why it drew a finding a moment ago. Then the licensing scope: six apps could be covered by Conditional Access today, but only four after conversion, because one moves to a managed identity and one is retired. That's the kind of thing you'd want to know before buying licenses. Finally, run the whole suite: five hundred thirteen tests pass, and the run made just three requests, all reads.

## Slide 16 — Lab 2: a test tenant, read only

Lab 2 moves to a test tenant with fictional people, never production, and it still only reads. You grant the same two read permissions, write a small set of inputs for the test accounts, and run it. Then come two checks the chapter couldn't settle from the documentation: what the license read actually shows in a GCC tenant, including whether a trial appears, and which identities the Conditional Access screen really lets you pick. Record both, discard the draft policy, and back everything out.

## Slide 17 — Dangers, and the guard for each

Each of these dangers has a guard in the code. The biggest is treating the matrix's proposal as the owner's decision, so they live in separate files, and the check flags every account until its owner signs. A guess about where a workload runs gets no proposal at all. Learn's limits on delegated accounts are enforced, not just noted. Kerberos accounts can't be kept forever, high-risk accounts can't wait, and no wave goes ahead without a way back. And this code never deletes anything: retirement still goes through Chapter 2's rule and the reviewed decommission process.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. Every account has a proposal, or a finding that names the missing fact. Every account has its owner's decision, with any departure from the matrix explained. Nothing kept lives forever, and every Kerberos keep has an owner and an accepted end date. The high-risk accounts go first, every wave has a way back, and the licensing scope holds only identities it can actually protect. With every account decided, Chapter 4 moves on to app management policies and certificate rotation. Thanks for watching.
