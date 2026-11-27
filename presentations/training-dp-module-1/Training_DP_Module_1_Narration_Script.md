# Data Platform and SQL Server Identity learning path — Module 1: The Estate and the Consolidation Gate — narration script (practice copy)

## Slide 1 — Module 1: The Estate and the Consolidation Gate

Welcome to Module 1 of the Data Platform and SQL Server Identity learning path: the estate and the consolidation gate. It teaches Runbook R oh two, with Chapter 1 of the developer workbook, Building SQL Server Identity. Before any login moves, you count every SQL Server instance, and decide which ones the identity work is spent on. This is the first of ten modules.

## Slide 2 — Why the count comes before any login moves

Why does this matter? After twenty years across an Active Directory forest, the SQL Server estate is larger than anyone's list of it, and part of it shouldn't survive the transformation at all. Migrating the logins of an instance you retire three months later is wasted work. So the identity work starts with a count: one row per instance, classified retain, consolidate, retire or review, before any login is touched. Only retained instances and consolidation targets go on to the migration. In this module you see how that gate is decided, and run the kit's classifier over a fictional estate.

## Slide 3 — What you'll be able to do in Module 1

Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll name the three forms of sprawl in a twenty-year estate, and say why the inventory comes before the authentication audit. You'll apply the three rationalization lenses, utilization, version and dependencies, and say which classes enter the migration. You'll explain how a recorded constraint changes a first-pass answer, and why an instance nothing could read lands in review. And you'll classify a fictional estate with the kit, and show that a changed file no longer matches its manifest. Before you start, follow the path's get-the-code steps, and read the first chapter of Data Platform: SQL Server Identity, What Windows Authentication Actually Is.

## Slide 4 — Finding the estate: three kinds of sprawl

Unit 2 is finding the estate. An estate grows by accretion. A development instance becomes production. A vendor test instance is never decommissioned. An installer drops SQL Server Express on an application server. The data platform book's chapter, The Shape of Twenty Years, names three overlapping problems: too many instances, too many databases, and too many forest-spanning dependencies. The transformation doesn't begin until they're assessed. No single instrument finds every instance, so discovery combines the network and directory sweep, the trail of service principal names, or S P Ns, that SQL Server registers, and Microsoft's assessment tooling, and fuses them into one inventory that counts each instance once. The kit doesn't rebuild discovery. The Start Kit's SQL Server count finds the instances, and the kit classifies what it found.

## Slide 5 — What the inventory must capture

What does the inventory have to hold? The data platform book's chapter, The Estate Inventory, lists a consistent set of facts for every instance it can find. The version, edition and build number establish the support and licensing posture. The host operating system version establishes the Arc and upgrade envelope. The domain-join state and the owning domain establish the forest-entanglement picture. The service account and its source domain establish the credential dependencies. And for every database, the size, the last-access timestamp, the recovery model and the owning application establish the utilization and zombie picture that the lenses turn into a decision. The inventory isn't a point-in-time spreadsheet. It's designed to be re-run, because instances appear and disappear across a multi-month assessment, and the consolidation plan must track a moving estate.

## Slide 6 — The rights each depth of discovery needs

Runbook R oh two's first step sets out the rights each depth of discovery needs. Read access to Active Directory finds candidates; it doesn't complete the inventory. The directory depth gives candidate hosts and instances from S P Ns and directory objects, and needs nothing more: the SQL Server Browser probe needs only a network path. The host depth gives the instances installed and each service's account, and needs local administrator by default, or a least-privilege alternative. The instance depth gives the version, the mode, every login and the databases, and needs a Windows login with the Start Kit's read permissions. Never sysadmin. Azure Arc is an optional fourth depth. Run every depth under one dedicated discovery identity per forest, a group managed service account for scheduled runs, and add the host and instance rights for the assessment window only, recording each grant and its removal.

## Slide 7 — The three lenses turn the inventory into a judgment

Unit 3 is the gate. Three lenses turn the inventory into a judgment. Utilization finds zombies: a database with no connections in four hundred or more days, no restores consumed, and a retired owning application. Version decides what can take Entra logins at all, since the FROM EXTERNAL PROVIDER syntax needs SQL Server 2022 or later. And dependencies, such as linked servers, replication and S S I S packages, are what most often overturn a naive plan. The result is one class per instance: retain, consolidate into a target, or retire. One caution from R oh two. The index-usage counters reset when the engine starts, so a database on an instance that restarted last week can look unused. Read the start time, and take the long-horizon evidence from login auditing, backup history and the application portfolio, before you call anything a zombie.

## Slide 8 — The classifier's first pass, and the constraints

The kit's classifier follows R oh two's first pass, then applies the recorded constraints. An instance whose every database is idle past the zombie threshold, or whose every owning application is decommissioned, is retired. An instance with no version goes to review, never to retain. A version before SQL Server 2022 consolidates into a shared target, and 2022 or later is retained. Then the constraints. Collation conflicts, version-locked vendor applications, compliance isolation, indivisible dependencies and failover cluster instances turn an apparent consolidation into a dedicated target, or a retain in place. It's a first pass: the architects confirm or override every row, and record why.

## Slide 9 — Try it: make the run's folder, classify the estate

Try it. Lab 1 runs in PowerShell 7 on the kit's fictional estate, with no instance and no tenant. Go to the kit's folder, and make this run's results folder, named for the time you start in U T C, so running the lab again never overwrites a run. Step one classifies eight instances for contoso dot example. Look at the reasons. Sequel P R D oh one and oh two run SQL Server 2022 and are retained, and sequel P R D oh six, on 2025, is retained as the consolidation target. Sequel L E G oh three, on 2016, can't take Entra logins, so it consolidates into the shared target. Sequel O L D oh five is retired: every database idle four hundred days or more. Sequel L E G oh seven's collation conflict sends it to a dedicated target. Sequel D E V oh eight has no version, so it's in review. And the denominator line counts each class: two consolidate, four retain, one retire and one review. Sequel F C I oh four is retained only because of its vendor constraint. It's also a failover cluster instance, which Chapter 3 puts in Category 3.

## Slide 10 — Try it: open the manifest, check the folder

Step two opens the manifest. It names the step, estate, and says the run was read-only. It names the step's control, C M eight, and its K S I, and the S H A two fifty-six hash of each file the run wrote: the C S V and the jay-son. Step three imports the kit's module and checks the folder against its manifest. Both files match the hashes recorded when the run wrote them. This is why the manifest matters to an assessor: the I S S O keeps the run folder, and reruns the check on the stored copy, so the inventory kept is the one the run wrote.

## Slide 11 — Try it: the two instances that don't enter

Step four looks at the two instances that don't enter the migration. Sequel O L D oh five's only database was last used nine hundred and twelve days ago, well past the four-hundred-day threshold, so it's retired. Sequel D E V oh eight is known only by its S P N: discovery found it, but nothing read its version. It stays in review until someone reads it, or confirms the host is gone. Review is never retain.

## Slide 12 — Try it: change a file, run the tests, list runs

Step five copies the run's folder, adds a row by hand to the copy's C S V, and checks it again. The C S V no longer matches its recorded hash; the jay-son still does. That's how the manifest catches a file changed after the run. Step six runs this chapter's tests: eight pass, none fail. Step seven lists your runs, one line per run, oldest first. There's nothing to clean up: the kit's folder is as you unzipped it, and this run's results stay in its own folder.

## Slide 13 — Lab 2: classify a test domain's instances

Lab 2 runs on your own test domain. It hasn't been run by the authors. You need a test domain with at least one test SQL Server instance, never production; a repository checkout, so the Start Kit is beside the kit; PowerShell 7 with the Active Directory module on a domain-joined machine; a network path to the instance's port and U D P fourteen thirty-four; and a Windows login holding the Start Kit's read permissions. Never sysadmin. Run the Start Kit's discovery, turn its output into the kit's inventory, and classify it. Compare each row with the Start Kit's own first pass, add the owners' constraints and application status, and classify again. The second run is the one to keep. Nothing on the instance or in the directory changes. To back it out, delete the lab's files, and have the administrator remove the read permissions if they were granted for the lab.

## Slide 14 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 1's table maps the classification and the manifest check to C M eight, System Component Inventory, in NIST SP 800-53, with the K S I for the inventory. Classifying every instance and counting the denominator once supports C M eight, with the C S V, the jay-son and the manifest as evidence. Showing that a changed file no longer matches its run provides evidence that the inventory kept is the one the run wrote. Runbook R oh two also maps the rights each depth of discovery needs, and its reconciliation with Azure Arc. K S Is are FedRAMP twenty X indicators for cloud service providers: the agency lines its own evidence up with them. The run's files provide evidence for a control; the agency still sets its parameters, and the assessor decides.

## Slide 15 — Check yourself: two questions on the gate

Check yourself with two questions. First: sequel D E V oh eight was found only by its S P N, and nothing read its version. How does the kit classify it? The answer is c: review, until someone reads it or confirms the host is gone. No version means review, never retain. Second: sequel F C I oh four runs SQL Server 2019, yet the kit retains it. Why? The answer is a: a recorded vendor constraint keeps it in place, and an upgrade or exception is still needed. That's rule six of the classifier. The module page has two more questions, each linked to the section that answers it.

## Slide 16 — Summary: count the estate, then pass the gate

To sum up. You learned why the estate is counted and rationalized before any login moves, and how the gate sorts every instance into retain, consolidate, retire or review. You classified a fictional estate, and saw its manifest catch a file changed after the run. The evidence an I S S O keeps from this module is the run folder, the C S V, the jay-son and the manifest with each file's hash, and the manifest check's output beside it, rerun on the stored copy. Before shipping, work through Chapter 1's checklist. Next is Module 2, the authentication audit.
