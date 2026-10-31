# Building the Attribute-Driven Migration, Chapter 09 — Drift Pipelines and Evidence to the ISSO — narration script (practice copy)

## Slide 1 — Chapter 09: Drift Pipelines and Evidence to the ISSO

Welcome to the Federal Modernization Workbook's developer workbook, Building the Attribute-Driven Migration. This is Chapter 9: drift pipelines and evidence to the ISSO. A check that runs when someone remembers is a spot check. A check that runs every day, says what moved since yesterday, and leaves evidence nobody can edit afterward is continuous monitoring. We'll start from Learn's sample workflows for signing in from GitHub Actions without a secret, see what they leave out, then walk the comparison, the findings, the evidence package, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — From spot check to continuous monitoring

Why build a pipeline at all? Because three earlier books already say what continuous monitoring must produce: drift measured against a versioned record, no closure without its proof, and a finding closed only when a later look shows it fixed. Each validation kit check already compares the tenant with the program's record. The pipeline adds one more comparison: today's run against yesterday's. That finds change. And it puts the closing rule into code. A finding is resolved only if the same check read the tenant again and didn't see it. A check that errored proves nothing.

## Slide 3 — Why GitHub Actions

Why GitHub Actions? Learn documents two ways to run a scheduled job that signs in to Azure with no stored secret. The chapter picks GitHub Actions for three reasons. Learn publishes complete sample workflows for it, including the US Government sign-in. The sign-in action is Microsoft's own, with its source published. And for the other option, Azure Pipelines, the automatic setup doesn't work in Azure Government. For this estate either would do, but one path that also documents the higher clouds is easier to hand on. And the comparator and packager work the same under either.

## Slide 4 — Which cloud: authority, Graph host, audience

Which cloud matters at every step: the sign-in authority, the Graph host, the Azure environment, the token audience and the Graph PowerShell environment all have to agree. For a GCC tenant like this estate's, Learn says apps keep using the worldwide endpoints. The higher clouds share a government sign-in authority, and here's the trap: the Azure sign-in environment is the same for GCC High and the Defense cloud, but their Graph hosts differ. So the Graph host must come from the cloud profile, never from the sign-in. An unknown cloud name is refused outright.

## Slide 5 — Learn's sample workflows, pinned and linted

Here's what Learn gives you: one page with three workflows. One signs in and runs a single Azure command, one adds PowerShell, and one signs in to Azure Government. Each job asks for exactly one permission, the right to request a sign-in token, and keeps its identifiers in secrets. Before any of it works, the app needs a federated credential that trusts the repository. Those workflows only exist inside the web page, so the repository pins the page and the action's own definition, and a linter checks each workflow offline against twelve rules. Nothing runs, nothing signs in.

## Slide 6 — What the samples leave to you: schedule and pins

Checking the samples offline shows what they do well, and the pipeline keeps all of it: the same sign-in, the same secrets, the single grant. What they leave out starts with timing: they run when someone pushes a commit, and drift doesn't wait for a commit. Their actions are referenced by tags that can be moved, and an older major version at that, so the pipeline pins each action to a commit. Tool versions say latest, so the tool that produced the evidence could change unreviewed. And the US Government sample, copied as is, doesn't even parse.

## Slide 7 — What the samples leave to you: subject and scope

The rest of the gaps are about identity and scope. The sample jobs name no environment, so the token's subject changes with the branch or event, and a federated credential matches one subject exactly. The pipeline runs in a named environment, so the subject is fixed. The samples stop right after signing in to Azure: no Graph token, nothing on the higher clouds. They don't stop two runs overlapping. And after sign-in there's nothing at all. The verdict: use Learn's sign-in exactly as published, pin it, schedule it, and put everything else behind it.

## Slide 8 — The workflow: one job reads, one job writes

The example is two Python files, one sample workflow and two test files. The workflow has two jobs with a deliberate wall between them. The first can read the tenant: it signs in, gets a Graph token for the right host, runs the validation kit, compares with the previous package and writes new evidence. The second can write to the issue tracker, but has no Azure access at all. So the identity that reads the tenant never writes to the tracker. One check is delegated only, so it's honestly listed as unverified on every run.

## Slide 9 — Compare: refuse what can't be compared

Before comparing anything, the pipeline makes sure the comparison means something. It checks each run against the kit's own manifest, so a run edited after the fact is refused. Then it refuses to compare runs from different modes or clouds, or out of order. The subtle one is tenants: a test tenant and production can share a cloud and look alike. The kit records the tenant the token was issued for, and the pipeline refuses to compare two different tenants, or a run with no tenant recorded at all, unless someone records a reviewed exception.

## Slide 10 — Five results, fingerprints, and no names

Every difference between runs lands in one of five results. New and changed findings open issues. A change only in the detail is recorded but opens nothing. A finding is resolved only when its check actually read the tenant this run. And anything from a check that errored or didn't run is unverified, so earlier findings stay open. Each finding has a fingerprint that's the same every run, so there are never duplicate issues. Issues carry object identifiers, not people's names, because the tracker has a wider audience than the evidence store.

## Slide 11 — The evidence package and its hash chain

Each run becomes an evidence package: the kit's run as written, the drift report, the latest provenance from the other kits, a manifest, and a list of file hashes the security officer can check with a standard tool and nothing else. Each manifest records the hash of the previous one, so the packages form a chain: a replaced package or a missing day shows up as a break. The packager doesn't sign, though. Locked retention stops changes after the fact, and signing with a key the pipeline holds is a choice left to the security officer.

## Slide 12 — Where the sources differ, and release stage

The chapter records three places where sources disagree, so nobody quietly loosens the code later. The biggest is the type of the Graph token: the reference page says one thing, a troubleshooting article says another, and the module's own source sides with the reference. The pipeline passes the safer form and confirms it in the second lab. The other two are small: a trailing slash on the issuer, and how a pull-request subject is spelled. The action version and the one preview feature, which isn't used, are on the slide.

## Slide 13 — Who owns the pipeline, who receives the evidence

Who's involved? The platform and pipeline engineers who own the scheduled checks, and the security officers and reviewers who receive the evidence and verify it. The permissions are deliberately split. A handful of administrator roles, or the app's owner, can add the federated credential. The pipeline's identity gets only the read permissions its checks need, plus write access to one evidence container. And only the second job, which has no Azure access at all, can write issues. No identity both reads the tenant and writes to the tracker.

## Slide 14 — Lab 1: lint the samples, record a baseline

Lab 1 runs on a laptop with Python and no tenant. First, lint Learn's three samples as published: the first two have several findings each, unpinned actions and latest versions among them, and the Government sample fails because it isn't valid at all. Then lint the chapter's own workflow, and it's clean. Print the Defense cloud's profile to see its hosts, and try a cloud name that doesn't exist: refused. Then record the first day's run as a baseline and package it. Note the manifest hash; the next package will point back to it.

## Slide 15 — Lab 1: the next day, issues, chain, tamper

Now compare the second day with the first. You'll see each kind of result, and one matters most: a check whose read failed with an access-denied error. Its finding isn't resolved; it's unverified, and stays open. Draft the issues and search for a person's name: it isn't there, only the object identifier. Package the second run, chained to the first, and verify it with the pipeline and with the standard tool. Then tamper with one file, and verification fails. Swap the runs, and the comparison refuses. Run the tests, and seventy-four pass.

## Slide 16 — Lab 2: a test tenant, a federated credential

Lab 2 uses a test tenant, a test subscription and a private test repository, never production. Register an app and give it a federated credential that trusts exactly one environment in the repository; Learn warns that a wrong subject is accepted silently and only fails at sign-in. Grant only the reads, and write access to one evidence container whose retention policy stays unlocked, so the lab can be cleaned up. Run it by hand to set the baseline, make one change, run again, and check the chain. Then let the schedule run, and back everything out.

## Slide 17 — Dangers, and the guard for each

The most important danger is the first: a failed read reported as a fix. An access error makes yesterday's findings disappear, and without a guard their issues would close. Here they stay unverified. The rest follow from the same habit of not trusting what you can't prove: refuse runs that can't be compared, keep secrets out entirely, pin every action, take the Graph host from the profile, keep reading and writing in separate jobs, keep names out of the tracker, and make the evidence unchangeable, chained, and checked every day.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. The workflow lints clean, with every action pinned. The app signs in with a federated credential and nothing stored, holds only the reads it needs, and the cloud settings all agree. Reading and writing stay in separate jobs. Findings from a failed check stay open, and issues carry identifiers, not names. Every package verifies with a standard tool and chains to the one before, retention is locked in production, and someone checks every day that a package arrived. That's the last chapter of the workbook. Thanks for watching.
