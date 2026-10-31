# Building Non-Person Identity, Chapter 01 — Non-Person Identity Inventory as Code — narration script (practice copy)

## Slide 1 — Chapter 01: Non-Person Identity Inventory as Code

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 1: the non-person identity inventory, as code. No account can be given an owner, a decision or a new credential until it's on one list, and Microsoft's own commands give you several lists that don't agree. We'll run Learn's commands and export script against stand-ins, see what they miss, then build one register with owners, credentials, permissions and risk, and walk two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why the inventory comes first

Why start with an inventory? Because everything else in this project acts on an account, and you can't act on an account you haven't found. The plan's first gate asks for every service account, app registration, service principal and managed identity in one register, with a type, a risk and a candidate target. The plan's critical path runs through ownership, and an owner has to be found before anything is touched, so this chapter and the next come first. The trouble is that Microsoft's own commands give you several lists, and they don't agree.

## Slide 3 — Which cloud and which directory, for this read

Next, which cloud. This estate is a GCC tenant with commercial Azure, so every host the read touches is a worldwide one: the worldwide Graph endpoint and the commercial Resource Manager endpoint. GCC High and the Defense Department clouds have their own hosts, and the Graph pages this chapter relies on list the government service levels. The code never guesses: you name the cloud explicitly, and it refuses one it doesn't know. The directory reads work the same way, going only to the domain you name, never to whatever domain the machine happens to be in.

## Slide 4 — What the register has to hold

So what does the register have to hold? On the directory side, Book 02 gives the types: the traditional user account used as a service, the managed service account tied to one server, the group managed service account shared by several, and on newer domains the delegated managed service account, which takes over from a traditional account. Learn warns that nothing marks a service account as one, so its search criteria can miss some. On the Entra side, the list is always longer than the apps anyone asked for, and each service principal carries a type that tells you what it really is.

## Slide 5 — Two directory reads, nine Graph, one Resource Manager

Put together, the register reads two collections from Active Directory, nine from Graph, and one from Resource Manager. The slide shows each read and why it was chosen. The pattern is worth noticing: one server-side query for the user accounts instead of reading every user three times, owners and credentials read where they actually live, on the app registration, and Graph's own app roles read so a permission shows up by name rather than as a number. And one read that people forget: a user-assigned identity's federated credentials live in Resource Manager, not in Graph.

## Slide 6 — Risk, candidate target and stale lead: the program's

Here's an important line between Microsoft and the program. Microsoft tells you how to find accounts; it doesn't tell you which ones are risky. The risk rules, the candidate target and the stale threshold are the program's, from the plan and Book 02, and the code keeps them in one configuration file and labels them as design guidance. And notice why stale is only ever a lead: the last logon attribute isn't updated on every sign-in, so an account that looks idle may not be. The plan says to confirm against the sign-in logs before retiring anything.

## Slide 7 — What Learn gives you, and the pinned copies

Now Microsoft's starting point. Learn's service account series is Microsoft's procedure for this read: a few PowerShell commands for user accounts, managed service accounts and service principals, a page that says what to record about each account, and a script that exports every app registration's secrets and certificates. Those commands live only inside web pages, so the repository pins the pages' source, unchanged, with hashes a test checks and a weekly watch for changes. A harness then runs them exactly as published, against stand-ins built from a fictional estate. Nothing is installed, and nothing signs in.

## Slide 8 — What the samples miss in Active Directory

This is where running the samples pays off. On the directory side, the criteria are right, so the code keeps them. But the samples read every user three times and give you three overlapping lists, not a register. The never-expires query happily returns a person. The delegation query returns servers. Nothing reads last logon or group membership, so you can't compute stale or over-privileged. And a delegated managed service account comes back unlabeled, while the group managed filter drops it entirely. Each row on the slide is pinned by a test.

## Slide 9 — What the samples miss in Entra, and the verdict

On the Entra side, the export script is a good model for the credential columns, so the code keeps it as one. But the multitenant filter it suggests actually returns single-tenant apps too. The script stops to ask for an output path, so it can't run on a schedule. It makes extra calls per app and per credential, never counts owners, and misses an app with no credential at all. And it ignores federated credentials, managed identities, permissions and consent, which is most of what the gate needs. So the verdict: use Learn's commands as the definition, not as the register.

## Slide 10 — The reader: five rules every call obeys

So what does the code build? It starts with one reader that every chapter in this workbook shares. Its script blocks are the only things that touch the network, a live one for real runs and a fake one for labs. And it enforces five simple rules: it makes only the calls the configuration declares, it only reads, it sends the token only to the cloud's own host, it checks it's signed in to the right tenant, and it reads every page. The fake hands back tiny pages on purpose, so paging gets tested everywhere.

## Slide 11 — The register: one row, the same columns, every type

The register gives every identity one row with the same columns, whatever its type, so it all lands in one file. Directory accounts carry password age, last logon and privileged groups; Entra objects carry owners, credentials and permissions. An app's permissions are counted once, so nothing high risk is counted twice. Then the program's rules apply: high, medium or low risk, and a candidate target from Book 02's matrix. That target is only a candidate, Chapter 3 makes the decision. And SQL Server accounts are handed to the Data Platform plan.

## Slide 12 — The findings, the manifest and the tests

The register then becomes findings, nine rules, each with a stable ID so the same gap keeps its name from run to run. Only one is a hard finding: a high-risk identity. The rest are warnings to act on, like a stale lead to confirm, an app with fewer than two owners, a client secret, consent granted for everyone, or an account that might really be a person. The run writes a manifest with the tenant, every request and a hash of every file, and Chapter 2 refuses a register whose hash doesn't match. All of it is covered by tests that need no network.

## Slide 13 — Who builds it, who runs it, what it may read

Who is this for? Developers build the read path, the identity and directory engineers run it, and the security officers review it. Nobody needs a tenant or a domain until the second lab. What it may read is short: an ordinary domain user's read on the directory, two Graph permissions and Reader on the identities. One choice deserves attention: listing delegated consent grants needs the broad directory read, and that's the only reason the inventory holds it. Without permission to read users, owners come back as bare IDs, which is all a count needs.

## Slide 14 — Lab 1: Learn's samples, the permissions, the run

Lab 1 needs only a laptop with PowerShell 7 and Pester: no tenant, no domain. First, run Learn's own samples against the stand-ins, and read the test for the delegated managed service account: Microsoft's command returns it, and nothing says what it is. Second, list what the inventory needs, and notice that nothing can write. Third, run the inventory over the fictional estate. You get thirty-five identities, eight of them high risk, a set of findings and warnings, and three accounts handed to the Data Platform plan. Next, we read them.

## Slide 15 — Lab 1: the eight HIGH rows, the guards, the hand-off

Reading the high-risk rows is where the rules become real. Two accounts have passwords that haven't changed in years; others sit in powerful groups or are trusted for unconstrained delegation; one app holds a directory-wide write permission. One account is also a stale lead, so the note says to verify use first. And one looks like a person, so it's flagged to confirm rather than treated as a service account. Then you watch the reader refuse an undeclared call and a cloud name in the wrong case, and you see who's handed to the Data Platform plan.

## Slide 16 — Lab 2: a test tenant and a test domain

Lab 2 moves to a test tenant and a test domain, never production, and it only reads. You register the app in the tenant's own cloud with a certificate, grant exactly the two permissions, and give it Reader where one test identity lives. Then you run it from a domain-joined host as an ordinary user. The point of this lab is to check what the permissions assumed: that federated credentials are actually readable, that a delegated managed service account is recognized, and that an ordinary user can read the directory attributes. Then cross-check the admin center, and back it all out.

## Slide 17 — Dangers, and the guard for each

Each of these dangers has a guard in the code. The two that hurt people most: a person mistaken for a service account, which the orphan rule could disable, and a stale account retired on a guess, which breaks the job that only runs once a quarter. The code flags the first, and never disables or deletes anything for the second. Others are quieter: a broad permission granted just to make it work, the wrong cloud, throttling on credential reads, and the register itself as a map for an attacker. Notice the guards are rules and tests, not memory.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. On the register side: every account and every app in the test estate appears exactly once, anything that might be a person has been confirmed, every high-risk row is lined up for the first wave, every stale lead has been checked against the logs, and the database accounts have gone to their own plan. On the code side: exactly two Graph permissions with a certificate, an explicit cloud, hashes that match what the security officer received, and pinned pages still reviewed. Next, Chapter 2 finds an owner for every account, and applies the orphan rule. Thanks for watching.
