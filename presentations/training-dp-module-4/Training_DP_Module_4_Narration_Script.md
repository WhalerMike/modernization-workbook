# Data Platform and SQL Server Identity learning path — Module 4: Entra logins and the parallel run — narration script (practice copy)

## Slide 1 — Module 4: Entra logins and the parallel run

Welcome to Module 4 of the Data Platform and SQL Server Identity learning path: Entra logins and the parallel run. This is the migration itself. You add the Entra login beside the Windows one, prove it works, and only then turn the old one off. The module follows runbook R five, and Chapter 4 of the developer workbook, Building SQL Server Identity. Take it after Module 3.

## Slide 2 — Why the old login stays on until the new one is proven

Why does the order matter? On a Category 1 instance, every Windows and sequel login gets an Entra login beside it. The new login is proven with a real sign-in, and only then is the old one disabled, observed for thirty days and dropped. Two mistakes here can't be taken back. A wrong mapping locks people out, and a dropped login can't be rolled back. So the plan is written as reviewable T-SQL that executes nothing, and readiness is judged from evidence, not silence. In this module you write a fictional instance's plan and judge its parallel run on day one and day thirty.

## Slide 3 — What you'll be able to do in Module 4

Here's what you'll be able to do by the end of this module, which takes about sixty minutes with the lab. You'll name the three Entra principal types a login from an external provider maps to, and the login type each one shows. You'll turn a reviewed mapping into create, cutover and rollback scripts, and say why a Windows group is denied connect sequel instead of being disabled. You'll state the parallel run's order and its exit criteria, and why local sessions don't count. And you'll judge a parallel run from snapshots, and say what comes after the disable. Before you start, finish Module 3. Lab 1 runs in PowerShell 7 on the kit's fixtures, with no instance and no tenant.

## Slide 4 — Three principal types a login can map to

Unit 2 starts with the principals. Create login, from external provider, maps a login to one of three Entra principals. A user, named by its U P N. A security group, named by its display name. Or an application, also by display name. In sys dot server principals, users and applications show as type E, and groups as type X. Group logins are the target, because they remove per-user churn. And an application's sequel login with a stored password becomes an Entra application login, preferably a managed identity. Create user, from login, then makes the database user. One more thing to keep in mind: the engine has no M F A logic. Conditional Access decides before the token is issued.

## Slide 5 — The kit's login plan: reviewable, and it runs nothing

The kit's login plan reads one instance from the audit snapshot, and the reviewed mapping. It leaves out the S A account and the built-in principals. A login with no mapping is written as unresolved, instead of a guess. It mirrors server and database roles, and writes three scripts: create, cutover and rollback. It executes nothing. It also warns when a principal would hold more than one database role, or D B owner or sys-admin, because the data platform book gives each group exactly one role, on one database, in one environment. A warning doesn't stop the plan. It's for the identity engineer to split the group, or record why not. What the plan doesn't mirror is explicit permissions, default schemas and object ownership. Runbook R five's queries read those, and the D B A adds them by hand.

## Slide 6 — The parallel run: create, validate, disable, observe, drop

Unit 3 is the parallel run. The order is create, validate, disable, observe for thirty days, then drop, and it's required for production. While both logins work, there are three exit criteria. Every application and job also appears on its Entra login. No remote N T L M remains. And nothing still arrives only on the legacy login. Connections made on the server itself always report N T L M, so they don't count. A snapshot is only a moment. Sequel Server Audit's successful login group records the whole window. The cutover disables a Windows user or a sequel login, and the rollback enables it. A Windows group can't be disabled that way, so the kit denies it connect sequel, and the rollback grants it back. Nothing is dropped. The S A account is disabled and renamed, never migrated. And the kit's judge reports readiness for each legacy login. It never disables anything.

## Slide 7 — Try it: write SQLPRD01's login plan

Try it. Lab 1 runs in PowerShell 7, from the kit's folder, on the kit's fictional estate. First, make this run's results folder: its name is the time you start, in U T C, so every run keeps its own results. Step one writes sequel P R D oh one's login plan. Four legacy logins map to four Entra principals. The create script starts with a dry-run comment: nothing here has run. Notice that S Q L dash D B A dash Admins gets sys-admin, because the Windows group it replaces had it. The S A account and the built-in service login aren't in the plan. Then the summary: four logins mapped, none unresolved, and the create script's hash. And three warnings. Payroll web M I and the payroll users group would each hold three roles, and the D B A group would hold sys-admin. The plan is still written. Splitting the groups, or recording why not, is the identity engineer's call before the mapping is approved.

## Slide 8 — Try it: read the cutover and the rollback

Step two reads the cutover and the rollback. The user and the sequel login are disabled, and the rollback enables them. Contoso payroll users and Contoso sequel admins are Windows groups, so their lines are deny connect sequel and grant connect sequel. Alter login disable can't deny a Windows group, and a server-permission deny can. Contoso sequel admins is also a sys-admin member, and a deny doesn't apply to members of sys-admin. So the cutover takes the group out of the role first, and the rollback puts it back. Nothing is dropped.

## Slide 9 — Try it: leave one login out of the mapping

Step three leaves one login out of the mapping: the sequel login payroll report. It loads the kit's module, reads the day-one snapshot, drops that row from the mapping, and builds the plan again. The create script now carries an unresolved line: map it, or record why it isn't migrated. And the cutover leaves payroll report out. Its disable line is gone, so the login keeps working until someone maps it. The plan never guesses an Entra principal.

## Slide 10 — Try it: judge the parallel run on day 1

Step four judges the parallel run on day one. Nothing connects through Entra yet, so nothing is ready: zero of four, keep the parallel run going. Read the Why column. Every Entra principal is not yet seen connecting. Contoso S V C payroll still has forty-one remote N T L M sessions. And three legacy logins still carry traffic that arrives nowhere else. Now look at Contoso sequel admins. It shows zero legacy sessions. Its one session was local, and local sessions always report N T L M, so they don't count.

## Slide 11 — Try it: judge the parallel run on day 30

Step five judges day thirty. Every Entra principal is seen connecting, and no legacy session remains: four of four, every exit criterion met. This snapshot is after the cutover. Contoso S V C payroll and payroll report are disabled, and the two groups are denied connect sequel. The judge reads that state, and says what runbook R five says comes next: observe for thirty days, then drop. Nothing has been dropped yet.

## Slide 12 — Try it: the manifest, the re-hash and the tests

Step six opens the day-thirty manifest. It names the step, parallel, its mode, read-only, its controls, A C two and C A seven, its K S I, and the hash of each file it wrote. Step seven re-hashes the plan. Every file's recorded hash matches the file on disk, and that matters: the hash a reviewer approves is the hash of the files on disk. Step eight runs this chapter's tests: eleven pass, none fail. And step nine lists your runs. There's nothing to clean up. The kit's folder is as you unzipped it, and this run's results stay in its own folder.

## Slide 13 — Lab 2: one mapping on your test instance

Lab 2 runs one mapping on your own test instance. It's not run by the authors. You need a test instance, never production: Sequel Server 2022 or later, not a failover cluster instance, Arc-enabled in a commercial Azure test subscription, which is where a Microsoft 365 G C C Moderate tenant's Arc resources live. It needs Entra authentication configured, an Entra admin set, as in Module 3, and a certificate your client trusts. Write a one-row mapping for one Windows login, read the create script, and run it as the Entra admin. That's the only step that changes anything. Then sign in as a member of the test Entra group, validate a real Entra connection, and judge the run. To back it out, sign in as the Entra admin, drop the database users the script created, then the login, and delete the lab's files. Drop login fails while the login is connected, so wait for the member's session to close and run that line again.

## Slide 14 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 4's table maps the login plan to NIST SP 800-53 A C two, Account Management, C M three, Configuration Change Control, and C M four, Impact Analyses, with two K S Is. The plan also supports I A two, Identification and Authentication for organizational users, which has no K S I pairing in the kit. The evidence is the reviewed create, cutover and rollback scripts, the plan file, the mapping, and the manifest with each file's hash. The parallel-run judge supports A C two and C A seven, Continuous Monitoring. Its evidence is the parallel file for each snapshot with its manifest, kept with the Sequel Server Audit files runbook R five keeps for the window. K S Is are FedRAMP twenty X indicators for cloud service providers; your providers report against them, the agency doesn't. The records provide evidence for a control; the agency sets each control's parameters, and the assessor decides.

## Slide 15 — Check yourself: two questions on the cutover

Check yourself with two questions. First: why does sequel P R D oh one's cutover deny connect sequel to the Contoso payroll users group, instead of disabling the login? The answer is a. Alter login disable can't deny a Windows group: it returns error fifteen one fifty-one. A server-permission deny can. Second: a legacy login has been disabled at cutover. When can it be dropped? The answer is b: after thirty days' observation, when the audit record, with failed logins for the disabled login, shows nothing still depends on it. The module page has two more questions, each linked to the section that answers it.

## Slide 16 — Summary: proven first, then turned off

To sum up. A reviewed mapping becomes Entra logins beside the Windows ones, as T-SQL that executes nothing until it's approved. The parallel run decides from evidence when a legacy login can be turned off, and nothing is dropped until thirty days' observation. You wrote a fictional instance's plan and judged its parallel run before and after the cutover. The I S S O keeps the reviewed scripts, the plan, the mapping and the manifest with each hash, and the parallel file for each snapshot, kept with the audit files. Before shipping, work through Chapter 4's checklist. Next, Module 5: groups, roles and the perimeter.
