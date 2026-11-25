# Data Platform and SQL Server Identity learning path — Module 5: Groups, roles and the perimeter — narration script (practice copy)

## Slide 1 — Module 5: Groups, roles and the perimeter

Welcome to Module 5 of the Data Platform and SQL Server Identity learning path: groups, roles and the perimeter. You sort every Active Directory group that reaches Sequel Server into its Entra replacement, and keep privileged roles off rule-based groups. The module follows runbook R seven, and Chapter 5 of the developer workbook, Building SQL Server Identity. Take it after Module 4.

## Slide 2 — Why the groups change keepers, not purpose

Why does this matter? Group-based access survives the move to Entra I D. What changes is who keeps each group current, and what stands in front of it. A group kept by hand from the org chart becomes a rule. A group of named administrators becomes an assigned group under pim. And a distribution list never becomes a login. In this module you take every Active Directory group that reaches Sequel Server, and say which Entra group replaces it.

## Slide 3 — What you'll be able to do in Module 5

Here's what you'll be able to do by the end of this module, which takes about forty-five minutes with the lab. You'll name the four Active Directory group patterns in the data platform book, Data Platform: SQL Server Identity, and the Entra replacement for each. You'll explain why a dynamic rule reads an H R maintained code, and excludes disabled accounts and guests. You'll run the kit's group map over fixtures, and read its flags for nesting and for a privileged role on a dynamic group. And you'll say which check enforces one group, one role, and why the map doesn't. Before you start, finish Module 4: its login plan is where the one-group-one-role warning comes from. Lab 1 needs no tenant.

## Slide 4 — One group, one role, flat by design

Unit 2 starts with how a group reaches the engine. An Entra group reaches Sequel Server as a group login, then a database user added to a role. The data platform book's Chapter 16, Groups, Roles and How Membership Reaches the Engine, makes one rule central. Each Entra group grants exactly one role, on one database, in one environment, so the group's name says what it grants. The model stays flat, because dynamic groups can't contain groups, and nesting builds on behavior that is unsupported, ending or undocumented. Members are listed directly, by rule or by assignment. One group, one role is checked where the roles are known: the login plan from Module 4 warns. The group map carries grants per instance, not roles per database, so it doesn't repeat the check.

## Slide 5 — The four AD group patterns and their Entra targets

Each legacy group then lands in one of four patterns. Pattern one: organization-derived groups, kept from the org chart, become dynamic. The kit writes the rule on the H R organization code in extension attribute ten, with clauses that require an enabled account and a member, not a guest. Never on department or job title. Pattern two: explicit role groups become assigned, managed by a delegated administrator, and eligible through pim when the group holds sys-admin or security admin. Pattern three: distribution lists become mail-only. Update the Sequel Server Agent operator's address, and give it no login. Pattern four: mail-enabled security groups split in two, a mail-only group and an assigned security group, with the pairing recorded in both descriptions. And when a group's codes aren't recorded, the target says to ask H R for the code before writing the rule.

## Slide 6 — The attribute, PIM and the perimeter

Unit 3 is the attribute, pim and the perimeter. Under dynamic membership, whoever can write the attribute a rule reads controls access. So the book's Chapter 17 has rules read H R owned codes, such as the organization code in extension attribute ten, never display strings such as department. And every access rule excludes disabled accounts and guests. Groups that hold sys-admin are never dynamic. Microsoft Learn says pim for Groups doesn't work on dynamic groups, or on groups synchronized from on premises. So privileged groups are cloud-only and assigned. Otherwise, whoever can write the attribute could make someone sys-admin. Conditional Access then sits in front of every user token. But it applies to users, not to managed identities, so applications are covered by the application chain in Chapter 7, not by Conditional Access.

## Slide 7 — Try it: map the fictional estate's five groups

Try it. Lab 1 runs in PowerShell 7, from the kit's folder, on the kit's fictional estate. First, make this run's results folder, named for the time you start, so every run keeps its own results. Step one maps the estate's groups. There's one group of each pattern, and a second dynamic group with a nested group. Contoso payroll users and Contoso H R analysts become dynamic groups, each rule on its own organization code, with the clauses that exclude disabled accounts and guests. Contoso sequel admins becomes an assigned group, eligible through pim. The agent alerts list becomes mail-only, with no login. And the claims team splits in two. Notice the flag on H R analysts: nested, flatten, because it contains H R leads. The rules are long, so PowerShell drops the flags column from the table on screen; step two prints it.

## Slide 8 — Try it: read what each group grants

Step two reads what each group grants. Contoso sequel admins holds sys-admin on sequel P R D oh one. The distribution list grants nothing. And the nested flag shows on H R analysts. Now look at Contoso payroll users. It reaches two databases on sequel P R D oh one. The data platform book's rule is one group, one role, one database. The map doesn't check roles. Module 4's login plan does: its warning for the payroll users group names the three roles. Split a group like that before the mapping is approved.

## Slide 9 — Try it: pretend the sysadmin group were org-chart

Step three pretends the sys-admin group were kept by the org chart. It loads the kit's module, reads Contoso sequel admins from the fixture, and marks its membership as org-chart. The map now sorts it as pattern one, a dynamic group. The group has no organization codes, so the target says to ask H R for the code rather than write a rule. But the flag is what matters: a privileged role on a dynamic group. Use an assigned group under pim instead. A privileged role never sits on a rule.

## Slide 10 — Try it: the manifest, the tests and your runs

Step four opens the manifest. The step is groups, its mode is read-only, and it supports A C two and A C six, with one K S I. It records the hash of each file it wrote. Step five runs this chapter's tests: four pass, none fail. And step six lists your runs. There's nothing to clean up. The kit's folder is as you unzipped it, and this run's results stay in its own folder. Check your work: you can say which Entra group replaces each of the estate's five groups, and why the map refuses to make the sys-admin group dynamic.

## Slide 11 — Lab 2: compare the map with a test tenant's groups

Lab 2 compares the map with a real tenant. It's not run by the authors. Use a test tenant whose groups are synchronized from a test domain, never production. You need PowerShell 7 with the Microsoft Graph PowerShell S D K's groups module, an account that can consent to the delegated group read all permission, and a groups file for your test domain's groups, in the shape of the kit's fixture. Map your test groups with the kit. Sign in to Microsoft Graph, read-only. A Microsoft 365 G C C tenant uses the worldwide Graph endpoint. List the tenant's groups with the properties that decide the pattern, put the kit's answer beside what the tenant has, and look for cloud groups that already exist. Nothing in the lab writes to the tenant. To back it out, sign out of Graph and delete the lab's output folder.

## Slide 12 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 5's table maps the group map to NIST SP 800-53 A C two, Account Management, and A C six, Least Privilege, with one K S I. The map provides evidence for both: which group grants what, how its membership is kept, and which privileged groups are eligible rather than standing. The I S S O keeps the groups file and its manifest, which records the step, its controls and K S Is, and the hash of each file; the Lab 2 comparison; and the record of which groups went under pim. Runbook R seven lists the evidence each state of the provisioning phase needs. K S Is are FedRAMP twenty X indicators for cloud service providers; your providers report against them, the agency doesn't. The agency still sets the parameters, policy and procedures, and the assessor decides whether each control is in place.

## Slide 13 — Check yourself: two questions on groups

Check yourself with two questions. First: Contoso H R analysts contains Contoso H R leads. Why does the map flag it nested, flatten? The answer is a. A dynamic rule can't select groups, so the inner group's members would drop out. Second: Contoso payroll users reaches two databases on sequel P R D oh one. Which check catches the one-group-one-role problem? The answer is b: Chapter 4's login plan, whose warning names the roles. The map carries grants per instance, not roles per database. The module page has two more questions, each linked to the section that answers it.

## Slide 14 — Summary: rules for the org chart, PIM for privilege

To sum up. You sorted the fictional estate's groups into dynamic, assigned, mail-only and split targets, and saw the map refuse to put a privileged role on a rule. Group logins, pim and Conditional Access now decide who reaches Sequel Server, in place of hand-kept Active Directory groups. Before shipping, work through Chapter 5's checklist. Next, Module 6: N T L M and the S P Ns.
