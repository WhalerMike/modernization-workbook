# Building Privileged Access, Chapter 01 — Privileged Inventory as Code — narration script (practice copy)

## Slide 1 — Chapter 01: Privileged Inventory as Code

Welcome to the Federal Modernization Workbook's developer workbook, Building Privileged Access. This is Chapter 1: privileged inventory as code. You can't make privilege just-in-time until you can list it: who holds which role, at which scope, standing or eligible, directly or through a group, and in which tier. We'll start from Microsoft's own samples for listing role assignments, see what they miss, then build the reader, the rows and the findings, and finish with two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why the inventory comes first

Why start with an inventory? Because you can't fix what you can't list. A role reaches a person in four ways that look the same on an admin's screen and very different to an attacker: permanent or time-bound, eligible or active. An activated role looks active for a while, and a role on a group reaches everyone in it. Microsoft's own target is zero permanently active assignments outside the emergency accounts, and the program wants roles to reach people only through named groups. So the first gate is simply this: know what's standing today, and classify it by tier.

## Slide 3 — Which cloud: Graph and Resource Manager hosts

Next, which cloud. For this estate's tenant, Microsoft 365 GCC with commercial Azure, every host is a worldwide one: the normal Graph endpoint and the normal Resource Manager endpoint. GCC High and the Defense Department cloud use their own hosts. The licenses for GCC are hosted in Azure commercial, and the governance product that PIM needs is available in every one of these clouds, as is every Graph call the chapter uses. The code never guesses: you name the cloud explicitly, and it refuses any name it doesn't recognize.

## Slide 4 — What the inventory reads: five collections

So what does the inventory actually read? On the Microsoft Entra side: the role definitions, so every row gets a name; the active assignments, with whether each one is assigned or activated, direct or through a group, and when it ends; the eligible assignments, with their expiration; and the members of each role-assignable group. On the Azure side, two Resource Manager collections give active and eligible role schedules for each scope you name. Everything is on the stable, generally available versions. Next, where the tier comes from.

## Slide 5 — The tier comes from the program, not Microsoft

Where does the tier come from? Not from Microsoft. Microsoft does label some roles as privileged, but that label is still a preview, read through the beta endpoint, so the program treats it as an input, not the answer. The tiers live in a small file the program owns, keyed by each role's template identifier, which is the same in every tenant. Any role that isn't in the file is reported as unclassified, never assumed safe. Azure roles get their tier from Book 04's placement table, by role and by scope. Both are labeled design guidance.

## Slide 6 — Learn's samples, pinned and run against stand-ins

Microsoft's starting point is Learn's page on listing role assignments. It covers the admin center, PowerShell and Graph itself, and its all-roles sample reads every role definition, then lists each role's assignments one by one. For Azure, Learn says there's no single command for both kinds, so you list eligible and active schedules separately. Those samples only live inside the web page, so the repository pins the page's source unmodified, checks its hash in a test, and watches for upstream changes. A harness then runs the samples, exactly as published, against stand-ins. Nothing signs in.

## Slide 7 — What the samples miss: eligibility, paging, groups

This is the heart of the chapter. Run against the fixture tenant, Learn's sample lists the active assignments well, so that part is kept as the model. But it can't see eligibility at all, and under PIM eligibility is where almost every human holder ends up, so an active-only list shrinks as the project succeeds and stops being an inventory. It also makes one call per role, never asks for every page, and treats a group as a single holder, so the people behind it are invisible. Each of those misses is pinned by a test.

## Slide 8 — What the samples miss: names, clouds, Azure

The rest of the gaps are about trust and reach. The sample prints raw identifiers with no names and no tier, and a reviewer can't act on an identifier. It signs in without naming a cloud or limiting its permissions. Its transitive read uses beta on a hard-coded worldwide host, which is wrong for the government clouds. And it says nothing about Azure, where Owner and User Access Administrator are just as privileged. So the verdict is: keep Learn's page as the model and the cross-check, but don't use its loop as the inventory.

## Slide 9 — The reader and its four rules

Now the code. It's one PowerShell module, two entry scripts, the call list and the tier map. Every call goes through one reader, built for one task in one cloud, and the only thing that touches the network is a small script block you hand it: a live one for real runs, or a fake for labs and tests. The reader enforces four rules, shown on the slide. It only makes calls the task declares, only reads, only sends its token to the cloud's own host, and always reads to the last page.

## Slide 10 — The rows: one per assignment, counted once

What comes out is one row per assignment, with everything a reviewer needs on it: which plane, which role and tier, which scope, what state it's in, when it ends, and whether it arrived directly or through a group. The subtle part is counting each assignment exactly once. Microsoft returns group-delivered assignments as their own active rows, but the code expands the group itself, so it skips those. And Azure returns the same schedule from more than one scope, so the code removes duplicates and skips inherited rows. Next, the findings.

## Slide 11 — The findings: nine rules, PA-INV-01 to PA-INV-09

Test-PaInventory turns those rows into the nine findings on the slide. Two thresholds come straight from Learn: fewer than five Global Administrators, and no more than three owners on a subscription. Learn also backs the biggest one, standing privilege in the top tiers outside a short, owned exceptions list, and the root-scope finding, because elevating access hands someone User Access Administrator over every subscription. The rest are the program's own design, labeled that way: roles assigned straight to people, badly named groups, unmapped roles, and eligibility that never ends.

## Slide 12 — The manifest, the tests, and one known gap

Each run writes the inventory, the findings and a manifest the reviewer can check: which task, which cloud, every request with its time, and a hash of every file. The manifest names no one, but the inventory does, so treat the folder as sensitive. The chapter's tests run with no tenant at all. And here's an honest gap: Learn documents that the stable members call doesn't return service principals in a group. Neither workaround fits the reader's rules, so that gap is recorded rather than quietly papered over.

## Slide 13 — Who builds it, who reviews it, what it may read

Who is this for? Developers build the read path. Identity engineers and the I S S O's review what it produces. The app's permissions are the union of its calls, each the least privileged for the job, and nothing in the list can write. One choice is worth noticing: the basic user read permission is added alongside group members, because without it, Learn says, a member comes back with only an identifier and a type. If a member still comes back unnamed, the code keeps the row and raises a warning rather than dropping someone who holds a role.

## Slide 14 — Lab 1: run Learn's samples and the inventory offline

Lab 1 needs only a laptop: PowerShell 7 and Pester, no tenant, no network. First you run Learn's own samples against the stand-ins, and one test shows what you'd otherwise take on trust: the eligible-only holders simply never appear. Then you list the permissions, five of them, and none can write. Finally you run the inventory against a fictional tenant with three Azure scopes. It returns thirty rows across the tiers, ten findings, seven warnings and one informational item. Let's read those findings.

## Slide 15 — Lab 1: reading the findings and the refusals

Reading the findings is where the rules become real. Seven rows are standing privilege in the top tiers, including a service principal whose exception nobody owns, so the exception doesn't count. One Global Administrator also elevated to root. There are five Global Administrators once the group's members are counted, and five owners on one subscription. The emergency account is only informational, because it's a listed exception with an owner. Then you watch the reader refuse an undeclared call and an unknown cloud. The whole suite passes, three hundred thirty tests.

## Slide 16 — Lab 2: a test tenant, read-only, cross-checked

Lab 2 moves to a test tenant with fictional people, never production, and it only reads. You register the app in the tenant's own cloud with a certificate, grant exactly the five permissions plus Reader on a test subscription, sign in, and run. Then comes the useful part: download the admin center's list of assignments, as Learn describes, and compare. Every active row should be in the inventory, and the inventory should also hold the eligible rows the download can't see. Check the two assumptions the fixture made, then back everything out.

## Slide 17 — Dangers, and the guard for each

Every danger here has a guard in the code, and most of them are about something quietly going missing. The worst is an active-only inventory: as the project succeeds, the list shrinks, and the gate passes on an empty table. Close behind are a group counted as one person, a member dropped because its name couldn't be read, and an exceptions list nobody owns. Notice the one honest gap: service principals in a group aren't returned at all. And remember the inventory itself is sensitive, because it names every privileged holder.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. The inventory reads eligible as well as active assignments, and its counts match what the admin center and PIM show. Every group is expanded with nobody dropped, every role has a tier or an owned decision, and the exceptions list is short and owned. On the other side, the app holds exactly its five permissions and Reader with a certificate, the cloud is explicit, and the evidence hashes match. Next, Chapter 2 builds the emergency access accounts, the one exception this inventory lets through. Thanks for watching.
