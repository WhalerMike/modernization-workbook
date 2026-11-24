# Non-Person Identity learning path — Module 15: Your first gMSA: set up the forest, then create a new gMSA — narration script (practice copy)

## Slide 1 — Module 15: Your first gMSA

Welcome to Module 15 of the Non-Person Identity learning path: your first G M S A. First you set up the forest, once. Then you create a new G M S A for a new application. It teaches two parts of the companion guide Service Accounts: set it up once, and a new G M S A for a new workload, with Chapters 6 and 12 of the developer workbook. Take it after Module 1 and before Module 8.

## Slide 2 — Why start from nothing

Why this module? Every other lab in this path starts from an account that already exists: a user account used as a service, a standalone managed service account, or a secret. You move its S P Ns, run in parallel, then disable it. This module starts from nothing. First the forest gets what every G M S A needs, once: a K D S root key, the O Us, a group that may create G M S As, and the pipeline's own G M S A. Then a new application gets its G M S A from the first day, by the managed service account standard, with no S P N to move, no parallel run and no old account to disable. That's why it comes before Module 8: Module 8 converts the accounts that already exist, into the forest this module sets up.

## Slide 3 — What you'll be able to do in Module 15

Here's what you'll be able to do by the end of this module, which takes about sixty minutes with Lab 1. You'll set up a forest for G M S As in the right order. You'll say when the backdated K D S key is allowed, and why a forest has only one key. You'll follow a new workload's G M S A from the request to a working service. You'll decide whether a new G M S A is outbound-only, and register an S P N when the workload needs one. And you'll run Chapter 12's request check and Chapter 6's one-account plan on fixtures. Before you start, finish Module 1 and read the standard's settings. You need PowerShell 7.1 or later with Pester 5, and no domain or tenant for Lab 1.

## Slide 4 — Set up the forest once, in this order

Unit 1 is the setup, and the order matters. First, the K D S root key, one per forest. A Domain Admin or Enterprise Admin creates it on a domain controller, confirms it with the K D S service's event forty oh oh four, and then waits: domain controllers wait up to ten hours before they allow a G M S A to be created, so the key replicates first. Second, the O Us: one for managed service accounts, and a holding O U for the disabled ones a migration retires. Third, the creators group, and the right to create G M S A objects on that O U. Microsoft Learn names the right but gives no command, so the guide uses D S A C L S, which is design guidance: run it in a test domain first, then check it. Fourth, the pipeline's own G M S A, made once by hand, by the standard, and then the group's only member. After that, nobody needs Domain Admins to create a G M S A.

## Slide 5 — The KDS root key: one per forest, and the wait

The K D S root key deserves its own slide. In any forest, you create it with Add K D S Root Key, dash Effective Immediately, and then you wait, up to ten hours, before a G M S A can be created. Learn's K D S page offers a key backdated ten hours, but only for a test environment with one domain controller, and Learn's containers page says not to use it in production. So: never in production. And create only one. Learn says more than one key makes G M S As start failing after a password rotation, and a deleted and re-created key can stay cached, so the K D C has to be restarted on every domain controller.

## Slide 6 — A new gMSA for a new application

Unit 2 follows one new application, timesheet, a service on two hosts. Its owner asks for a G M S A with no account to supersede. SailPoint approves, and Chapter 12 checks every field; the row it writes for Chapter 6 names the new G M S A itself, because there's no old account. The pipeline runs Chapter 6's one-account plan: the service-account O U, A E S two fifty-six, thirty days, its own hosts' group, and outbound-only. Each host restarts to pick up its group, then installs the G M S A and tests it. Then the service is switched to it, with a blank password, and given only the rights it needs. And look at what's skipped: no delegation to carry, no S P N to move, no thirty-day parallel run, no account to disable. Those steps exist to retire an old account, and a new application has none.

## Slide 7 — An SPN only when the new workload needs one

Does the new G M S A need an S P N? Timesheet is a service that only calls out, so nothing authenticates to it with Kerberos. Its G M S A is outbound-only, which is the standard's default. Visitor is an I I S site that browsers reach with Kerberos, so its G M S A needs the S P N H T T P slash visitor. It isn't outbound-only, and the reason is recorded in the request. A person registers the S P N once nothing else holds it, with set S P N dash S, which Learn says checks for a duplicate before it adds one. Then set S P N dash L confirms it's on the G M S A.

## Slide 8 — Try it: Learn's KDS and gMSA steps on the stand-ins

Try it. Lab 1 runs in the non-person identity folder, with no domain. Step one runs the kit's tests of Microsoft Learn's own K D S and G M S A procedures, against stand-ins for the Active Directory cmdlets. Six pass, each a fact about Learn's pages. Get K D S Root Key returns the key's value itself, so only an admin who would create the key runs it. The backdated key is for a test environment with one domain controller. Learn's G M S A sample sets its retrievers at creation, and sets no Kerberos encryption type, which is why the standard adds A E S two fifty-six. And installing the G M S A on each host is a person's step.

## Slide 9 — Try it: check the three requests (S1)

Step two runs Chapter 12's request check on three approved requests for new workloads. The domain has no G M S A yet, so there's nothing to certify or retire. Two requests pass: timesheet and visitor. One is held. Step three reads why. Its name is nineteen characters before the dollar sign, and the standard allows fifteen. And it names only one owner, where the standard needs exactly two. SailPoint approved it, and the code still holds it. The approvers decide on the purpose and the risk; the code checks the standard, field by field, before anything is created.

## Slide 10 — Try it: what goes to Chapter 06, with no old account

Step four reads what Chapter 12 hands to Chapter 6. Two rows, one for each request that passed, each with its request and its change record. Look at the first two columns. In a migration, the first one is the old account. Here it's the new G M S A itself, because there's no old account. And the retrievers file gives each G M S A its own domain local group of the hosts that run it.

## Slide 11 — Try it: plan the timesheet gMSA (S4)

Step five builds Chapter 6's one-account plan, the plan for a G M S A that replaces no account. One action: create G M S A, run by the pipeline, with its request and change record. Its precheck names two things: the K D S root key must be ready, and the G M S A must not exist yet. The parameters are the standard's: the service-account O U, the hosts' group as the only retriever, A E S two fifty-six, thirty days, and outbound-only. A name that breaks the standard, like step three's, makes the plan throw instead of planning.

## Slide 12 — Try it: the same plan, before and after the setup

Step six dry-runs the plan, as the pipeline, with its approved hash, in a copy of the fictional forest before its setup, with no K D S root key. The create is skipped, and the detail says why: K D S root key missing. That's why Unit 1 comes first. Step seven runs the same plan, with the same hash, in the forest after its setup. Now the pipeline would send New A D Service Account. Nothing is sent in either run: they're dry runs. Step eight runs the module's nine tests, and cleans up.

## Slide 13 — Lab 2: the setup and the gMSA in a test domain

Lab 2 does it for real, in a test domain with one domain controller, never production, as a Domain Admin, with a member server for the host. Nobody has run it yet, so no step's output has been seen. Steps one to four are the setup: the K D S root key, backdated only in this single domain controller test domain and only if none exists, the two O Us, the creators group with its right, and the pipeline's G M S A. Step five creates the timesheet G M S A by hand, the way the pipeline would. Step six, on the host after a restart, installs and tests it, and sets a test service to run as it. Step seven backs out the G M S A and its group, and keeps the setup, which is made once. In any domain with more than one domain controller, use Effective Immediately and wait ten hours.

## Slide 14 — The federal requirement and the evidence the ISSO keeps

The federal requirement. The standard's steps each name what they support, and these are the rows this module's labs produce evidence for. The request check in S1 supports A C two, Account Management, I A four, Identifier Management, and C M eight, System Component Inventory, in NIST SP 800-53. The approval in S3 supports A C two, C M three, Configuration Change Control, and A C five, Separation of Duties, with the request and change carried on every write in the plan. The create in S4 supports A C six, Least Privilege, I A five, Authenticator Management, C M three and A C two enhancement one, automated account management, with the plan's hash and its results. And the install in S5 supports A C six, A C six enhancement five, and C M six, Configuration Settings. K S Is are FedRAMP twenty X indicators for cloud service providers. A row provides evidence for a control; the assessor decides.

## Slide 15 — Check yourself: two questions on your first gMSA

Check yourself with two questions. First: when may you use the K D S root key backdated ten hours? The answer is b: only in a test environment with one domain controller, never in production. Second: a new I I S site needs the S P N H T T P slash visitor. What does the standard say? The answer is b: create the G M S A without the outbound-only restriction, record why, and register the S P N with set S P N dash S, which checks for duplicates first. Outbound-only is for a G M S A with no S P N. The module page has three more questions, each linked to the section that answers it.

## Slide 16 — Summary: set up once, then the standard from day one

To sum up. A forest is set up for G M S As once: one K D S root key, aged ten hours, the O Us, the creators group with its delegated right, and the pipeline's own G M S A. After that, a new application's G M S A follows the standard from the first day. It's requested and checked, planned and created by the pipeline with the standard's settings, installed and tested on its hosts, and given to the workload with a blank password. It's outbound-only unless the workload needs an S P N, and it has nothing to migrate from. Next, Module 8 converts the Kerberos accounts that already exist, into the forest you just set up.
