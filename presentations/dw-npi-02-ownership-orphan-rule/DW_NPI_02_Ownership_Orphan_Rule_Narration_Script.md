# Building Non-Person Identity, Chapter 02 — Ownership and the Orphan Rule — narration script (practice copy)

## Slide 1 — Chapter 02: Ownership and the Orphan Rule

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 2: ownership and the orphan rule. An account nobody will own is the one nobody will notice when it's misused, so the rule for it is decided once, written down, and run by code a reviewer has read. We'll start from Learn's own Graph samples for finding ownerless apps, see what they miss, then walk the ownership check, the orphan rule as a reviewed plan, the separate write path, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why ownership is the gate

Why does ownership come before everything else? Because an owner isn't just a name on a form. An owner can add a credential to an app and act as it, so an app nobody owns is an app nobody is watching. The plan's second gate asks that every non-person identity be owned, and that the ones nobody claims are disabled, never deleted, with a thirty-day window for someone to step forward. Learn points the same way: at least two owners, a reference to a team record that outlives any one person, and a short list reviewed regularly.

## Slide 3 — Which cloud, for this check and these writes

Which cloud? For this estate, a GCC tenant, every Graph read and write goes to the worldwide endpoint, and the three Graph calls this chapter writes with are all listed for the government service levels as well. The code takes the host from its cloud table and checks it on every request, which matters because Learn's tutorial simply hard-codes the worldwide host. On the directory side, the disables go only to the domain you name, and one detail to remember: the disable command won't work against a read-only domain controller.

## Slide 4 — The rule the code holds: stricter than Learn's

So what's the rule? Learn is permissive: a service principal's owners can be users or other service principals. The program is stricter, and this is labeled design guidance. Every app needs two human owners who are enabled members, not guests and not bots. Its reference has to point at a real record in the system inventory, not a line of free text. And every directory service account needs an application owner. Active Directory has no owners attribute the code can trust, so that owner comes from a file kept with the record.

## Slide 5 — The orphan rule: disable first, never delete

Now the orphan rule itself. The plan's decision, owned by the chief information security officer, is to disable first, once the identity governance officer confirms, then give the office thirty days to claim it. Book 04 runs the other way round, and the chapter keeps that difference open rather than quietly picking. Learn agrees on the shape: disable, don't delete. It offers two reversible switches. One deactivates the registration everywhere, but its procedure is still on the beta endpoint. The other disables sign-in in this tenant on the stable endpoint, and that's the one the code uses.

## Slide 6 — Learn's Graph samples, pinned and sent to a fake

Microsoft's starting point here is a Graph tutorial. It gives a query for service principals with no owner or just one, requests that add an owner, and a sample that sets the service reference. As before, those samples exist only inside the page, so the repository pins its source unchanged, with hashes a test checks and a weekly watch for changes. The harness then reads each request straight out of the page and sends it to a fake Graph, which behaves like the real one, right down to refusing an advanced query that's missing its required header.

## Slide 7 — What the query counts wrong

Sending the samples to the fake shows the problem quickly. The query's shape is right, so it's kept as the model. But most of what it calls ownerless is noise: managed identities, which have no owners to add, a third party's app, and Graph itself. It checks the service principal, when the owners who matter are the ones on the registration, where the credentials live. It counts a guest or a bot as an owner, just like a person. And it labels a simple read with a write permission. Each of these is pinned by a test.

## Slide 8 — What the samples leave out entirely, and the verdict

Then there's what the samples don't cover at all. They'll add any object as an owner, a bot included. The reference they set is free text, even though Learn's own guidance says to point at the service management database. They say nothing about directory service accounts, which is half the gate. And there's no orphan rule, no disable and no claim window. So the verdict: keep Learn's query and its owner requests as the model for the reads and for the one write that adds an owner, but don't use the query as the check. It counts the wrong owners, on the wrong object.

## Slide 9 — The check: nine rules, NPI-OWN-01 to NPI-OWN-09

Here's the check. It reads each owner and each nominee once, with a single call and a single read permission, so it can tell a member from a guest and an enabled account from a disabled one. Then it applies nine rules. The findings are the ones that block the gate: no valid human owner, only one, a missing reference, a reference that points at nothing or at a retired record, and a directory account with no application owner. Guests, bots and disabled owners are warnings. And anything that might be a person isn't checked until someone confirms it.

## Slide 10 — The orphan rule as a plan nothing in it writes

The orphan rule becomes a plan, and nothing in the plan writes. Each orphan candidate and each claim turns into exactly one action. Most are bookkeeping: waiting for the officer's confirmation, a claim window still open, an exception with an end date, or a retirement candidate once the window closes. Only two actions ever write: disabling a confirmed orphan, and adding an owner someone claimed. Here's the clever part. The same inputs always give the same plan, byte for byte, so a reviewer doesn't approve a description. They approve a hash.

## Slide 11 — The separate write path, and why it's a person

This is the only code in the example that can write, and it's built to refuse. It won't run unless the plan's hash is the one the reviewer approved, the plan belongs to this tenant and cloud, and it's less than a week old. It can only send a body that disables, or one that adds an owner, and it never deletes. Before each write it looks again, and skips if an owner has appeared. And it runs only as a person, never an app, because the permission it needs could let an app act as every other app. Disabling is never automatic.

## Slide 12 — Who keeps each input, and who decides

Who's involved? Developers build the code. The identity governance officer confirms every orphan before anything is disabled, and the chief information security officer owns the rule itself. Application owners and security officers review the results, and a second person approves the plan. The inputs are deliberately plain files, each kept by the people who actually know the answer: application owners for directory accounts, the system inventory for records, the governance officer for confirmations, and the offices that claim an identity. You don't need a tenant until Lab 2.

## Slide 13 — Lab 1: samples, permissions, the check and the plan

Lab 1 runs on a laptop, using the register you built in Chapter 1's lab. First, send Learn's samples to the fake, and read the test that drops the required header: the fake refuses it, just as Graph would. Second, list what each task needs, and notice the split: the check needs one read permission, and only the write path asks for more. Third, run the check and build the plan. Twenty-two identities are checked, seven are orphan candidates, and the plan has ten actions, only three of which would write. Run it again, and the plan's hash is the same.

## Slide 14 — Lab 1: the findings, the plan, and a refused hash

Now read what it found. Two apps have no valid owner at all. Four have only one, and the other "owner" turns out to be a bot, a guest, or someone who's left. Several references are missing, free text, or point at a retired record, and five directory accounts have no application owner. The plan shows the rule at work: one account disabled last month and never claimed is now a retirement candidate, another's window is still open, and a claim naming a guest is refused. Then you dry-run the plan, apply it to the fake, and watch an unapproved hash get refused.

## Slide 15 — Lab 2: two test orphans, confirmed and disabled

Lab 2 moves to a test tenant and a test domain, never production. You create two deliberate orphans, an app with no owners and a service account with no application owner, and run the check with a single read permission. Both should show up. Then you do what the governance officer would: confirm them, and have a second person approve the plan's hash. Only then do you sign in as a person, dry-run, and apply. The admin center shows the app as deactivated, the account is disabled, and you record the date. Then put everything back the way it was.

## Slide 16 — Dangers, and the guard for each

Every danger here has a guard. The quiet one is counting the wrong owners, a guest, a bot or someone who's left, so the gate passes on people who can't answer for the app. The loud ones are a disable on a guess and a delete, and the code answers both: nothing is disabled without the officer's confirmation and a fresh look, and there is simply no delete. A plan changed after review won't run, and the write path can't send anything but a disable. Notice, again, that each guard is a rule the code enforces every time.

## Slide 17 — Done when: the chapter's checklist

Here's what done looks like. Every app has two owners who are real, enabled people, or a finding with someone assigned to fix it. Every reference points at a live record, and every directory account has an application owner or is a candidate. No orphan was disabled without the governance officer's confirmation. The plan's hash was approved by someone other than the person who applied it, the write ran as a person, and every disable has its date. With owners in place, Chapter 3 turns each account's candidate target into a decision. Thanks for watching.
