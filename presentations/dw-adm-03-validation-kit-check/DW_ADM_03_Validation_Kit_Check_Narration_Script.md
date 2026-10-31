# Building the Attribute-Driven Migration, Chapter 03 — Writing a Validation Kit Check — narration script (practice copy)

## Slide 1 — Chapter 03: Writing a Validation Kit Check

Welcome to the Federal Modernization Workbook's developer workbook, Building the Attribute-Driven Migration. This is Chapter 3: writing a validation kit check. A check is only evidence if it can't change what it measures, can't pass when it failed to look, and asks for no more access than the question needs. We'll build one new check end to end, on soft match and hard match takeover, and along the way meet a read that only a Global Administrator can make. Then the tests, the safety rules, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why this check: soft match and hard match takeover

Why this check? Gate 3 of the implementation guide maps attributes through sync, and before the first user from Active Directory lands in a tenant that already has cloud accounts, the sync engine has to decide who matches whom. It can join on an email address or user name, which is soft match, or on the source anchor, which is hard match. Left open, either one lets an on-premises object take over a cloud account. Microsoft says keep both blocked except during an approved matching window. So the question is simple, which makes it a good first check. It also hides a lesson.

## Slide 3 — Which cloud: the Graph host and the read's reach

Next, which cloud. The kit reads Microsoft Graph, and the host depends on the tenant. A GCC tenant sits on the worldwide endpoints, so it reads the same Graph host as a commercial tenant; GCC High and the Defense cloud have their own. The sync read this chapter needs is available in all of them, at version one point oh. And the kit holds the line on hosts: if Graph hands back a next page that points anywhere other than the cloud's own Graph host, the kit refuses it, so the token never leaves.

## Slide 4 — The anatomy of a check: five parts

Every check in the kit has the same five parts, and once you see them, adding a check is mostly filling in a pattern. There's a catalog entry that says what the check is and what access it needs. A function, named from the check's ID. A read through the kit's single data path. Rows that turn what was read into findings and a status. And fixtures with tests, so the check has to pass clean data and fail planted problems, with an exact count. The README's permission table mirrors the catalog, and a test keeps them in step. Let's build each part.

## Slide 5 — The catalog entry, and the lesson in it

Here's the catalog entry, and the lesson hiding in it. The read itself is innocent: get the tenant's sync settings, with a read-only permission that sounds harmless. But Learn lists no application permission for it at all, and for a signed-in user it names exactly one supported role, Global Administrator. So a check that only reads, run live, would need the most powerful role in the tenant. Being read-only is necessary, but it isn't enough. The next slide shows what the check does about it.

## Slide 6 — When the only supported role is Global Administrator

So the check does three things differently. It's optional: it never runs unless you name it. It prefers an export: a Global Administrator who's already signed in for other reasons saves the response to a file, and the kit reads the file without ever needing the role. And it says so, in plain words in the catalog, so a security officer knows what a live run would demand before anyone tries it. The program's design guidance follows from that: never create a standing Global Administrator identity just so a check can run on a schedule.

## Slide 7 — The function, and the wrapper every check shares

Here's the function. It reads the export if there is one, otherwise it asks Graph, and if the tenant has no sync object at all, it says the check doesn't apply. The important part is the wrapper around it. Every check runs inside the same body wrapper, which looks up the catalog entry, records every read, and turns any exception into an error result. That means a read that throws can never come back as a pass. So resist the urge to catch exceptions inside your check to make it more robust. That's exactly how a check passes while blind.

## Slide 8 — One data path, and evidence of which path was used

There's exactly one way a check reads tenant data, and that's on purpose. In a fixture run, the data path reads a file from the fixture folder. Live, it calls Graph with the address. And an export comes in through the input reader. All three are logged the same way, so when a reviewer opens the evidence, they can tell from the evidence alone which path a result came from: a fixture, a live tenant, or a file a Global Administrator saved. That matters for this check above all, because the path is what tells you whether the powerful role was ever needed.

## Slide 9 — Rows and outcome: three severities, unsafe defaults

Now the rows. A block that's off is a finding, and the check fails. But if there's an approved matching window, the same state is a warning: someone should look, it isn't a failure. The window is a date, so the day after it closes, the warning turns back into a finding without anyone editing anything. Soft match on user name is just context, since Microsoft says it can't be turned off once enabled. And one rule matters more than it looks: a missing value is read as off. If the response shape changes, you get a finding, not a silent pass.

## Slide 10 — Fixtures and tests: both directions, exact counts

A check is tested in both directions. The fixtures are a fictional tenant in two states: one with both blocks on, one with both off. Each copies the shape of Learn's example response, with one extra property the check shouldn't read, so a check that reads the wrong one gets caught. Adding the check to the table-driven test is a single line, and that line buys four tests, including an exact failure count. Then a short block covers what's particular to this check: the window, the export, and the empty tenant. With the README and catalog updated, the whole suite passes.

## Slide 11 — The safety tests, and why the fix stays out

The safety tests are why you can trust a new check without re-proving it. They parse every script in the kit and fail the build on anything that could change state, and every Graph call has to say, literally, that it's a read. There's one pinned exception, a beta action that evaluates a rule and changes nothing. Because this check reads only through the shared data path, it passes those tests untouched. And the fix for a finding is a write, so it never goes in the check. It goes in the change record, run by the identity team under change control.

## Slide 12 — Verified facts: the calls behind the check

This is the chapter's verified-facts table, the calls the check depends on. The read needs only a read permission, but only a Global Administrator can make it, and only as a signed-in user. The fix needs the matching write permission and the same role. The kit's one exception to read-only, the rule evaluation, is still in beta, and that's labeled wherever it appears. Underneath it all, the shared reader does two things every Graph client must: it follows the next page link as given until there isn't one, and when Graph says slow down, it waits as told.

## Slide 13 — Who extends the kit, who runs what, with which role

Who's involved? Developers and engineers extend the kit, and they need PowerShell and the basics of Pester. Security officers read the results, and the catalog tells them up front what access a live run would take. A Global Administrator appears exactly once, to save the export while they're already signed in for something else. Nothing in the kit itself ever runs with that role. And when a finding needs fixing, the identity team makes the change, from the change record, under change control. The check only ever reports.

## Slide 14 — Lab 1: run the check on the fixtures

Lab 1 runs on a laptop with PowerShell 7 and Pester; nothing signs in. First you run the new check against the failing fixture and see a failure with a count of two: two findings, one informational row, and one read logged from the fixture. Then you open a matching window that ends tomorrow, and the result becomes a warning. Move the date a day past the window, and it's a failure again. Finally you hand it a small export file, and the evidence shows the result came from the input, not from Graph.

## Slide 15 — Lab 1: scope, default run, and a planted mistake

The rest of Lab 1 shows the guardrails. You ask the kit what a live run would need, and it prints the permission and names the Global Administrator role, before anyone signs in. You confirm the check isn't part of a default run. You run the kit's whole test suite. And then the best step: you deliberately break the check so it reads a property that doesn't exist. The failing fixture still fails, but now the passing one fails too, because a missing value reads as off. That's the unsafe default doing its job. Put it back, and you've seen every outcome.

## Slide 16 — Lab 2: an export from a test tenant

Lab 2 uses a test tenant that already syncs from Active Directory. The export is the only step that needs a Global Administrator: they sign in, save the response to a file, and sign out. Read that file before you take it; it's configuration, not personal data. Then anyone runs the check on the export, without signing in, and the evidence says the result came from the input. Compare it line by line with the file, because that's how you catch a response shape that differs from Learn's example. Then delete the export; the run's manifest is the evidence.

## Slide 17 — Dangers, and the guard for each

Each of these dangers is a way a check can quietly stop being evidence, and each has a guard. The most tempting is creating a standing Global Administrator so a check can run on a timer; the guard is an optional check that reads an export. The most dangerous is a failed read that reports a pass; the wrapper turns every exception into an error. Others are subtler: a missing property read as on, a fixture that matches the code instead of the service, a warning that never expires. Notice that every guard is built in, not remembered.

## Slide 18 — Done when: the reviewer's checklist

Here's what a reviewer checks before a new check ships. The name, function and track agree. The catalog names the least privilege and the role straight from Learn, and if that role is privileged, the check is optional and reads an export. It reads only through the shared data path, hides no failed read, and treats every missing control as off. Its fixtures follow Learn's shape, its tests cover every status, the README knows about it, and the safety tests pass untouched. Next up is Chapter 4, dynamic rules as code. Thanks for watching.
