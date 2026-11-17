# Building Global Secure Access, Chapter 02 — The Configuration Export and Logs First — narration script (practice copy)

## Slide 1 — Chapter 02: The Configuration Export and Logs First

Welcome back to Building Global Secure Access. This is Chapter 2: the configuration export, and logs first. Every later chapter reads the same export, and nothing is enforced before the logs exist, so this chapter builds both. We'll start from Learn's advice to back the configuration up as Graph JSON, see what it leaves to you, read the kit's collector, its manifest and five baseline checks, and walk two labs. The chapter is a draft awaiting review, and the code is illustrative, tested against fixtures.

## Slide 2 — Why one export, and why logs first

Why this chapter, now? The guide's run order is decision, architecture, then logging, and only then the client. So the logs exist before anything is enforced, and every later Validate step has a record to read. The goal: export the tenant's configuration in one read-only run whose files an assessor can re-hash; keep the architecture record that names every connector group and DNS suffix; and prove the network logs reach the workspace before anyone is in a pilot. It's for the developers, the platform owner who keeps the architecture record, and the security monitor who owns the workspace.

## Slide 3 — What Microsoft Learn gives you

Learn's operations guidance is to back the configuration up as Graph JSON, weekly and before every change, and the guide's export is that loop. Each read has a Learn page. Profiles, signaling and tagging need Network Access Read All, and Global Reader or the Global Secure Access Log Reader can read them. Named locations and the tenant restrictions default need Policy Read All. Connector groups and their members are the surprise: Learn names only Directory Read Write All, delegated, so there's no read-only permission for them. A connector reports active or inactive, and its version. And traffic logs stay thirty days, longer only through a diagnostic setting.

## Slide 4 — What it leaves to you

What does it leave to you? The guide's export covers nine addresses, but later chapters also need connector members, Private Access apps, licenses and the logs, so the kit has one collector for every read. The guide's hash list is something nobody checks, so the kit's manifest is checked every time a later step reads the collection. The connector reads need a write permission, so the call list says so, the reader only sends GET, and the lab signs out after. A diagnostic setting created by hand can lose a category, and an architecture record in prose drifts from the tenant. The kit checks both.

## Slide 5 — The collector, the manifest and the checks

Here's the code. The collector reads every declared call for the areas you name, all of them by default: seventeen calls, twenty-four reads in the fixture tenant, because connector members are read once per group and the guide's seven queries one by one. It writes each read, one collection file, and a manifest with each call's permission and every file's hash. Two reads aren't verified against a Learn page yet, and live runs refuse them unless you say so. Then five baseline checks: each connector group in the architecture record with two hosts, the forest in the DNS suffixes, the workspace named, the export complete, and the diagnostic setting sending all four network categories.

## Slide 6 — Who keeps the record, and the logs

Who does what? The platform owner keeps the architecture record and runs the export before every change. The security monitor owns the workspace and the diagnostic setting. The security officer keeps the export folders, in the evidence store, not on a personal drive. The reader holds Network Access Read All and Policy Read All for the configuration, and Directory Read Write All for the connectors, so the lab signs out right after the read. Creating the diagnostic setting takes Security Administrator, and roles are activated through privileged identity management for the change window only.

## Slide 7 — Lab 1: collect the whole pilot tenant

Lab 1, again in the kit's folder with no tenant. Step 1 lists what the baseline reads. Step 2 collects the whole pilot tenant: seventeen calls, each with its least-privileged permission and its beta and verified flags. The Private Access apps and the tenant restrictions partners are the two not yet verified against a Learn page. Twenty-four reads in all, eighteen files hashed. Step 3 checks the folder against its manifest: all eighteen files match.

## Slide 8 — Lab 1: the category the setting leaves out

Step 4 runs the baseline checks. Both connector groups are in the architecture record with two hosts each, the forest is in the DNS suffixes, and the workspace is named. One failure: the diagnostic setting doesn't send the remote network health logs. Step 5 reads the setting's categories as the collector saved them: three on, and remote network health off. No branch is on a remote network yet, but when one is, its health would never reach the workspace.

## Slide 9 — Lab 1: a changed file stops every later step

Step 6 is the one to remember. Copy the collection, add one space to one file, and try to read it. The read is refused: the licenses file changed since its manifest. Every later chapter reads the collection through that same check, so an edited export can't quietly become evidence. Step 7 runs this chapter's tests: eight passed, none failed. Then delete the output folder.

## Slide 10 — Lab 2: logs on, then the export

Lab 2 uses a test tenant and an Azure test subscription with a Log Analytics workspace, never production. Turn the network logs on first, with the guide's own command: one diagnostic setting, all four categories. Then sign in to Graph as a person with the baseline's permissions and collect. The two unverified reads need an extra switch, and you compare their results with the portal before trusting them. The logging check passes once the setting exists. Back it out by signing out first, because the session can write, and delete the setting only if this test tenant shouldn't keep it. The authors haven't run this lab.

## Slide 11 — Requirements, dangers, done

The export with its permissions and hashes supports baseline configuration and component inventory. The architecture record supports boundary protection and information flow. Logs in the workspace before the pilot support event logging and audit record generation, and a refused, changed export supports protecting audit information. The key security indicators are FedRAMP's, and which output supports which is the program's mapping; the assessor decides the controls. The dangers: a pilot before the logs, a write-capable session left open, and an edited export used as evidence. You're done when the setting existed before the pilot, and the export runs before every change. Next, Chapter 3: the client.
