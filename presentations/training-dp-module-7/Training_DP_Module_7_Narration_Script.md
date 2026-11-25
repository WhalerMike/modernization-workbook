# Data Platform and SQL Server Identity learning path — Module 7: The Application Chain — narration script (practice copy)

## Slide 1 — Module 7: The Application Chain

Welcome to Module 7 of the Data Platform and SQL Server Identity learning path: the application chain. It goes with Runbook R oh eight and Chapter 07 of the developer workbook, Building SQL Server Identity. You'll find every connection string, mask every stored password, and place each string on the database axis before anything changes. Take this module after Modules 6 and 4.

## Slide 2 — Why the engine is only half the chain

Why does this matter? The engine is only half the chain. The other half is a connection string, and most of them hold a password or a Windows credential. Until each string moves to an Entra mode, the application keeps the instance tied to Windows Authentication. In this module you list every sequel server connection string an application holds, and say which ones carry a stored password. Then you say whether each move is a configuration change, a driver or code change, the vendor's decision, or already done. No string changes until the three gates hold.

## Slide 3 — What you'll be able to do in Module 7

Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll place a connection string in column A, B, C or D of the database axis, and say who decides column D. You'll name the managed identity and service-principal modes in each driver family, and say why the Entra password mode is never a target. You'll run the kit's connection scan over fixtures and read its masked strings, columns and targets. And you'll list the three gates that must hold before a string changes. Before you start, finish Module 6, and Module 4, for the Entra login that gate one checks for. The lab runs in PowerShell 7, in the kit you unzipped into the F M W Labs folder.

## Slide 4 — The database axis, and the column the scan sets

Unit 2 is the database axis. The data platform book's chapter on the four-class pattern for applications describes two independent axes: how users sign in to the application, and how the application connects to the database. On the database axis, evidence places each application in one of four columns. A is configuration only. B is a code change. C is vendor-dependent. And D is no Entra path today. The kit's scan reads each application's configuration files, masks every stored password, and sets A, B, C or done, from the driver, its version, the host, and whether a vendor owns the application. A string with no owner's file, or a driver the table doesn't know, goes to review. The scan never sets column D. Only the owner can say a vendor has no release coming or an application is to be retired, and that answer goes into the exception registry, with a date.

## Slide 5 — What Microsoft gives you: Entra modes by driver

Unit 3 starts with what Microsoft gives you. Each driver family added Entra modes in specific releases. Microsoft Data SQL Client added service principal in two point oh, managed identity in two point one, and Default in three point oh. The O D B C driver added managed identity in seventeen point three point one point one and service principal in seventeen point seven. The table gives the O L E D B driver eighteen point three and eighteen point five, and the J D B C driver twelve point two. In every family the Entra password mode is deprecated, so it's never a migration target. Microsoft also says a token doesn't grant database permissions by itself, and to prefer a specific mode in production, such as managed identity, over Default. And on an Arc-enabled Windows server, a process can get the machine's managed identity token only if it runs as a local administrator, or as a member of the Hybrid Agent Extension Applications group.

## Slide 6 — The change, and the three gates in front of it

Then the change. The data platform book's chapter on connection string migration gives it for an application on an Arc-enabled server. Integrated Security becomes Authentication equals Active Directory Managed Identity, and the application's process account must be allowed to request the host's token. Off Arc there's no managed identity, so the kit names the service-principal mode, with a certificate preferred. It never suggests Default. The change is simple, but gated. Gate one: the Entra login exists. Gate two: the role is granted. Gate three: the change is tested in a production-equivalent environment. A string changed before the gates hold fails at sign-in. And the scan's target is advice, not a change: the kit rewrites nothing.

## Slide 7 — Dangers, and the guard against each

Chapter 07 of the workbook names the dangers, and the guard against each. A password copied into a report turns the scan's output into a secret store, so the kit masks every password, and a test checks that no fixture password appears. The password mode counted as done would leave a deprecated flow that can't do M F A in production, so the finding names it. Active Directory Default in production makes the first connection slow, and the identity can change with host settings, so name the mode. Every application on a host shares the Arc identity, so one login's grants cover everything allowed to ask for the token. Keep the Hybrid Agent Extension Applications group to the accounts that need it, and give an application its own service principal where its grants differ. And a string changed before the gates hold fails at sign-in, so Lab 2 checks gates one to three, in that order.

## Slide 8 — Try it: scan the four applications

Try it. Lab 1 runs in PowerShell 7 on the kit's four fictional applications, with no tenant. Go to the kit's folder and make this run's results folder, named for the time you start, in U T C. Step one scans the four applications. Two strings hold a stored password, and one is already on Entra. Payroll web's web dot config string uses Windows integrated authentication. It runs on an Arc host with Microsoft Data SQL Client five point two point two, at or above the managed identity release, so it's column A: a configuration change. Claims batch and reports O D B C use drivers with no Entra path, so they're column B. Vendor H R is column C because a vendor owns it. The target text there is the kit's generic advice; the vendor's release decides.

## Slide 9 — Try it: read the masked strings

Step two reads the masked strings. No password reaches the output. The scan replaces every password value with stars, and never returns or writes the password itself. That's the guard against a danger: a password copied into a report turns the scan's output into a secret store. Look at the two stored passwords: claims batch's sequel login, and vendor H R's. And look at payroll web's two strings: the archive database already uses Active Directory Managed Identity, and the payroll database still uses integrated security.

## Slide 10 — Try it: parse a deprecated password-mode string

Step three parses a string that uses the deprecated password mode. It parses as entra, because it is an Entra mode. But the mode is the deprecated one, so the scan reports it as a finding, and never as done. A careless scan would count it as done, and a deprecated flow that can't do M F A would stay in production. The kit's driver configuration lists the deprecated modes, and the finding names it. And notice the password: even here, it comes back masked.

## Slide 11 — Try it: read the kit's driver table

Step four reads the driver table the scan uses: the first release of each mode, as the data platform book's chapter on connection string migration gives it. Microsoft Data SQL Client has managed identity from two point one. That's why payroll web, on five point two point two, is column A. O D B C has managed identity from seventeen point three point one point one, so the reports application's O D B C thirteen driver has no Entra path, and it's column B. The last column is the credential chain mode. Microsoft lists Default from three point oh in the sequel client, and the kit never suggests it.

## Slide 12 — Try it: the manifest, the tests and your runs

Step five opens the manifest: the step, its mode, read-only, its controls, I A five and C M six, its two K S Is, and the S H A two fifty-six of each file. The kit wrote its own output and rewrote nothing. Step six runs this chapter's tests: seven pass, none fail. And step seven lists your runs. There's nothing to clean up: the kit's folder is as you unzipped it, and each run's results stay in their own folder.

## Slide 13 — Lab 2: one column-A test application

Lab 2 changes one string in one test application, never production. It was not run by the authors. It must be a column-A case: an I I S application on an Arc-enabled Windows host, using Microsoft Data SQL Client two point one or later with integrated security, against a test instance on sequel server twenty twenty-two or later with Entra authentication configured. Its owner writes the app file. You copy the configuration and scan the copy, then check gates one and two: the login exists and holds a role. You let the application pool ask for the token, keep the original file as the way back, and change the one string. Gate three is seeing the application arrive on its Entra login. Then a second scan should say Entra already, column done. Step nine backs it all out: it restores the original file, restarts the pool, removes it from the group and signs out of Azure.

## Slide 14 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 07 of the workbook maps both the scan and the change to I A five, Authenticator Management, and C M six, Configuration Settings, in NIST SP 800-53. The scan supports I A five: a stored password found, then removed. And it provides evidence for C M six: each string's authentication setting, recorded. For the scan, the I S S O keeps the connections file with masked strings and the manifest, and each application's app file. For a change, the gate queries' output, the before and after scans, the session read, and the change record. Runbook R oh eight lists the evidence for each state of the cutover. K S Is are FedRAMP twenty X indicators for cloud service providers; your providers report against them, the agency doesn't. The scan's records support these controls; the assessor decides whether each one is in place.

## Slide 15 — Check yourself: two questions on connection strings

Check yourself with two questions. First: payroll web's web dot config uses integrated security. Why does the scan put it in column A? The answer is b: it runs on an Arc host with Microsoft Data SQL Client five point two point two, at or above the managed identity release, so the move is a configuration change. Second: which three conditions must hold before a connection string changes? The answer is a: the Entra login exists, it holds the database role, and the change is tested in a production-equivalent environment. The module page has two more questions, each linked to the section that answers it.

## Slide 16 — Summary: every string found, masked and placed

To sum up. You scanned four fictional applications, found two stored passwords without writing either one out, and placed each string in column A, B, C or done, from its driver, host and owner. The scan advises; no string changes until the three gates hold. The I S S O keeps the connections files with masked strings and the manifest, each application's app file, and for a change, the gate queries' output, the before and after scans, the session read and the change record. Before shipping, work through the Chapter 07 checklist. Next is Module 8, A D C S dependencies.
