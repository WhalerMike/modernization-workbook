# Building Azure Security, Chapter 01 — The Landing-Zone Baseline — narration script (practice copy)

## Slide 1 — Chapter 01: The Landing-Zone Baseline

Welcome to the Federal Modernization Workbook's developer workbook, Building Azure Security. This is Chapter 1: the landing-zone baseline. A baseline nobody reads back is a wish, so the first thing the kit does is read it back, the same way, every week, with nothing it could change. We'll start from Microsoft Learn's own commands, see what they leave to you, read the kit's spine and its baseline check, and walk two labs, the evidence and the dangers. The chapter has been reviewed and approved, and the code is illustrative, tested against a fictional estate.

## Slide 2 — Why the baseline is read back as code

Why read the baseline back as code? Because the guide's Step 1 sets four things once, and nobody checks them every week across every subscription. By the end of this chapter you can read all four: whether creating management groups needs authorization and new subscriptions land in a default group, whether the required initiatives sit at the intermediate root in audit, whether every platform resource sends logs to the platform workspace, and whether every subscription has the required Defender for Cloud plans. It's for platform engineers who own the hierarchy, and for the developers and security officers who review their automation. And one rule holds throughout: every read is declared, every finding names its source, and nothing the kit runs can change the estate.

## Slide 3 — What Microsoft Learn gives you

Here's Microsoft's starting point. Learn's Az PowerShell for protecting the hierarchy sets two things on the tenant root group: that creating a management group needs authorization, and which group new subscriptions land in. Learn's REST reference reads both back with one call. The guide assigns the security benchmark and the FedRAMP initiative in DoNotEnforce, which evaluates compliance without enforcing. And two more REST references give the reads the kit needs: diagnostic settings, with the workspace and the log categories each one sends, and Defender for Cloud's pricings, with each plan's tier.

## Slide 4 — What it leaves to you

What does Learn leave to you? Each command is run by hand, once, so nobody runs it every week across every subscription. A Resource Graph query with no scope reads whatever the signed-in account happens to see. Comparing diagnostic settings by eye misses the one resource that logs to the wrong workspace. A session left on another cloud reads another estate. And nothing records what was read, so an assessor can't tell which run a finding came from. The kit answers each of those, and a test pins each answer.

## Slide 5 — The spine: one call list, two invokers

Now the kit's spine. One call list declares thirty-three reads: twenty-four Resource Graph queries and nine Resource Manager GETs, each with its query or path, its API version, its role, which is Reader everywhere, and the Learn page it comes from. Fifteen are verified on Learn. The other eighteen say what's missing, and a live run refuses them unless you allow it. Two invokers serve the calls: the fixture invoker reads files and sends nothing; the live invoker runs a scoped Resource Graph query or a GET on the commercial Resource Manager host, after checking the CLI's cloud and tenant. The kit knows one cloud, commercial Azure, which Microsoft 365 GCC pairs with, and has no default.

## Slide 6 — The baseline check: six rules

The baseline check reports six rules. Two come straight from Learn's hierarchy guidance: creating management groups must need authorization, and new subscriptions must land in a default group, not the tenant root. One is the program's design: the required assignments must sit at the intermediate root. One is information, not a finding: an initiative in DoNotEnforce is exactly what Step 1 intends. Then logs: every platform resource must send an enabled log to the platform workspace. And Defender for Cloud: the required plans must be on Standard. The types and plans it checks live in a configuration file you change only in a reviewed pull request.

## Slide 7 — Who owns the baseline, and what the reader may do

Who's involved? The platform owner owns the hierarchy, the logging and the weekly run, and answers for the findings, with the security officer reviewing compliance beside them, as the guide's Step 1 names the gate owner. Developers build and review the kit and keep its call list and rules honest. And the reader the kit signs in as needs only Reader: on the tenant root group for the hierarchy settings, and on the intermediate root for everything else. Nothing in this chapter writes.

## Slide 8 — Lab 1: the calls, and the check on week one

Lab 1 needs only PowerShell 7 with Pester, in the kit's folder, against the fictional Contoso estate: an intermediate root, four subscriptions and a platform workspace. No subscription. Step 1 lists the six calls this chapter makes, every one Reader, every one verified. Step 2 runs the baseline check on the first week's estate: hierarchy settings, four policy assignments, sixteen platform resources and four subscriptions read. Twelve findings and one information row, from six calls, every one a read, with a manifest that lists each file's hash.

## Slide 9 — Lab 1: the findings, the summary, the command

Step 3 reads the findings. Creating management groups doesn't need authorization. Ten resources send no log to the platform workspace; one of them, the firewall's public IP, does send logs, but to an application team's workspace, which doesn't count. The online subscription's Key Vault plan is Free. And the FedRAMP initiative is in audit, as Step 1 intends. Step 4 reads the summary the metrics use: six of sixteen platform resources log to the workspace. Step 5 prints, without sending it, the exact command a live run would send: the guide's own query, scoped to the intermediate root.

## Slide 10 — Lab 2: a test subscription

Lab 2 moves to a test tenant with a test management group and subscription, never production. Sign in to commercial Azure, write the settings file from the template with every placeholder filled, and run the same check live. Every call this check makes is verified on Learn, so it needs no special flag. Then compare with the guide's own Validate commands: the assignment list, the hierarchy settings read straight from Resource Manager, and one flagged resource's diagnostic settings in the portal. Nothing changed in Azure, so backing out means deleting what the lab wrote, which maps the test estate, and signing out. The authors haven't run this lab.

## Slide 11 — Federal requirements and the evidence

Each output is evidence for something specific, from the guide's requirements table. The hierarchy settings, the initiatives at the intermediate root and their enforcement mode support baseline configuration and configuration settings. Which resources log to the workspace, and which subscriptions have the required plans, support continuous monitoring. And the manifest shows every call was a read, as Reader, with every response kept and hashed. The kit's output supports those controls; the assessor decides. And the key security indicators are FedRAMP's indicators for cloud providers: the agency lines its own evidence up with them, and doesn't report them.

## Slide 12 — Dangers, and the guard for each

What breaks in production, and what guards against it? A live run on the wrong cloud or tenant reports another estate as this one, so the kit checks the CLI's cloud and tenant before its first call, and has no default cloud. A query without a scope covers whatever the account happens to see, so every query takes the management group from the settings. A response's next link could point at another host, so any URL off the commercial Resource Manager host is refused. An unverified call could misread a property and report a false gap, so it's refused in a live run unless you allow it, and Lab 2 compares. And the run folder never goes in a public repository.

## Slide 13 — Done when: the chapter's checklist

Here's what done looks like. Every call the code makes is in the call list, with its role and Learn page, and the test that compares declared and made calls passes. Every rule the code can report is in the rules file, with its source. The required plans and platform types match the agency's decision records. Lab 2 ran in a test subscription, and the unverified calls' output was checked against the portal. And output folders live outside any repository. Next, Chapter 2 builds the public exposure register on the same spine.
