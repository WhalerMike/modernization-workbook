# Building the Attribute-Driven Migration, Chapter 06 — Moving Group Policy as Code — narration script (practice copy)

## Slide 1 — Chapter 06: Moving Group Policy as Code

Welcome to the Federal Modernization Workbook's developer workbook, Building the Attribute-Driven Migration. This is Chapter 6: moving Group Policy as code. Group Policy analytics tells you which settings Intune can take, but not which ones should move, who owns them, or what's already in the tenant. Those are the pipeline's questions. We'll start from Microsoft's own settings catalog samples, see what they leave out, then walk the move plan, the library, the linter and the sync, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Analytics finds the landing zone; it doesn't decide

Why does this need code at all? Because the operator side is already written, in Book 5's sunset program and the Intune track's gates, and what's missing is the software for two of those steps: importing the policies for analysis, and building the library. Two rules from those pages shape everything that follows. Every setting has exactly one owning policy and one owning tool, so the library only holds what Intune owns. And policies are built with no assignments; assigning them is a separate, reviewed step. Let's see what Microsoft's tools say about the stakes.

## Slide 3 — What Learn says about the tools sets the stakes

Here's what Microsoft itself says about these tools, and it's why a pipeline is worth building. Group Policy analytics reads your exports and tells you which settings have an equivalent, but only for Windows, and it only parses some settings, and only in English. The Migrate button is called best effort; Learn tells you not to move everything without review, and it simply stops when two policies disagree. And everything in Graph here, both the analytics reports and the settings catalog itself, is beta. Supported, but liable to change. Next, which cloud.

## Slide 4 — Which cloud: Graph host and Intune instance

Which cloud matters, because Microsoft's import sample always calls the worldwide Graph host. For a GCC tenant like this estate's, that's correct: GCC uses the worldwide Graph and the same Intune instance as commercial customers. GCC High and the Defense cloud have their own Graph hosts, a shared government Intune instance and their own admin center, and a token from one cloud won't work in another. So the example maps each cloud name to its host and refuses any name it doesn't recognize. Now, Microsoft's samples.

## Slide 5 — Microsoft's settings catalog samples, pinned

Microsoft does give you a starting point. Learn's Intune migration guide points to its Graph samples, and their settings catalog folder has two scripts: one exports every policy to a file, one imports a file as a new policy. Learn is candid that they change your tenant, come as-is, and should be tried somewhere safe first. The repository keeps an unmodified copy, with hashes a test checks, and a harness that runs both scripts against a fake Graph, replacing only the commands they call outside themselves. Notice what's absent: no sample reads the analytics through Graph.

## Slide 6 — What the samples get right, and the write gaps

Running the samples against the fake Graph shows what they do well, and the example keeps that: the same create call, the same filter, the same paging, and policies created with no assignments. The gaps are about safety. The import always calls the worldwide host. It writes with whatever session you happen to have open. There's no dry run. And if you run it twice, you get two policies with the same name, because it never looks at the tenant first. Each of those gaps is pinned by a test. There are more, on the record side.

## Slide 7 — The record gaps, and the verdict

The rest of the gaps are about the record. The import quietly edits the file before sending it, so what reached the tenant isn't what anyone reviewed; the example refuses such a file instead. The import leaves nothing for the security officer. The export stamps each file with the time, so Git can never show a change, and it drops the scope tags, so a re-imported policy is visible to the wrong administrators. And neither script knows who owns a setting. The verdict: keep Microsoft's create call as the model, and let the sync ask what's already there before it writes.

## Slide 8 — Read: the VK-INT-07 gate and the move plan

The read side has two parts. First, a gate from the validation kit, which works per policy object: anything targeted in the directory that isn't fully ready, or anything in scope that was never imported, fails it. Then the move plan works per setting. Every setting gets a row and a disposition: a candidate to move, a conflict between two policies, something that belongs in Endpoint security, something with no catalog equivalent, or something that stays behind. And here's the important part: the plan decides nothing. A person decides, and records why.

## Slide 9 — Write: one reviewed file per policy

On the write side, each policy is one file in Git, and the file has two halves. The policy half is exactly the body Graph will receive, in the shape Learn documents, so what's reviewed is what's sent. The other half is the record: who approves a change, which tool owns these settings, which old policies they came from, and a decision record for every single setting. The setting identifiers in the two sample files come from Learn's own examples, and the chapter's advice is to export one from the admin center and compare before trusting any other.

## Slide 10 — Lint: ten rules, four that carry the program

The linter is where the program's own rules live. Four rules carry most of the weight. Only settings Intune owns go in the library. No setting may appear in two policies, which is exactly the conflict a peer reviewer hunts for. Every setting needs a decision record. And anything that isn't a clean candidate from the plan raises a warning, so a setting added by hand is a choice someone made on purpose. One more rule watches for secrets, because Learn says anyone who can read device configuration can read those values. Then comes the diff.

## Slide 11 — Diff, then create only what is missing

Now the heart of the sync: it diffs before it writes. It reads the tenant's policies, normalizes both sides so harmless formatting differences don't count, and gives each policy one action. New ones get created. Matching ones are left alone. Anything that has drifted, or appears twice, stops the whole release. By default it's a dry run with read-only permission; only with the apply switch does it ask for write. And it never updates or deletes, even though Graph allows both. A policy that differs from Git is a question for a person, not something to overwrite.

## Slide 12 — Verified calls, beta stage and open questions

Here are the facts the code depends on, as Learn states them. Every call is beta, every read needs only the device configuration read permission, and only the create needs write. Learn lists all of them for the worldwide and both US Government levels. The chapter is just as careful about what Learn doesn't say. There's no Graph equivalent of the Migrate button, so the second lab compares the two by hand. And no Learn page confirms the analytics import itself works in GCC High or the Defense cloud, so that gets confirmed in a test tenant first.

## Slide 13 — Who builds it, who approves it, which roles

Who's involved? The developers and Intune engineers who build the library, the reviewers who approve each file, and the owner named in every file, who approves changes to that policy. The roles follow the same least-privilege line as the code. Importing a policy object for analysis needs an Intune administrator or a role with two specific permissions. Reading, planning and the dry run need only a read-only operator. Only the final apply needs the built-in role that manages configuration profiles, with write permission.

## Slide 14 — Lab 1: the gate, the sample twice, the plan

Lab 1 runs on a laptop with no tenant. First you run the validation kit's gate against its failing fixture, and see three real findings and a warning. Then comes the revealing step: you run Microsoft's own import sample twice against the fake Graph, and the policy appears twice. The call log shows two creates and not a single read; the script never looked. Then you build the move plan, and the eleven rows show every kind of disposition, including a hibernate setting where two old policies disagree. Next, the lint and the sync.

## Slide 15 — Lab 1: lint, dry run, apply, break it on purpose

Then you lint the library against the plan, and the only thing it reports is that hibernate conflict, with the decision that settled it. The dry run says one policy will be created and one is already in place, and applying it creates exactly that one and writes a record. Point it at another cloud and the host changes; give it a name it doesn't know and it refuses. Then break something on purpose: change one value in a file, and the sync reports drift and refuses to write anything at all. Run the tests, and forty-six pass.

## Slide 16 — Lab 2: a test tenant, a real import, Migrate

Lab 2 moves to a test tenant with Intune licenses, never production. You import a test policy object into analytics, then run the gate and build the plan for real, with read-only access. Any setting in your library that isn't in the plan is a finding. The dry run asks only for read; the apply, under the profile manager role, creates policies with no assignments. Then the interesting comparison: run Microsoft's Migrate button on the same settings, and compare. Drill drift by editing a value by hand, and finally delete everything the lab made. The sync itself never deletes.

## Slide 17 — Dangers, and the guard for each

Each of these dangers has a guard, and most of them come back to the same few ideas. One setting, one policy, one owning tool, checked in the pull request, so two systems never fight over a value. Read before you write, so running twice is harmless. Treat drift as a stop, never something to overwrite. Keep the write permission for the moment of writing. And because the APIs are beta, keep the pinned tests and run the test-tenant lab before each release. When the policies are assigned later, Learn prefers filters over dynamic groups that only Intune uses.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. The gate passes for the whole population. The move plan travels with the pull request, and every conflict has a decision. Each library file names its owner, its source policies and a decision per setting, and no setting appears twice. The dry run is clean and someone actually read what it will create. The release wrote its record, and afterward the dry run shows nothing left to do. Everything was created unassigned, and the pinned samples are still the ones you reviewed. Next, Chapter 7 builds machine configuration packages. Thanks for watching.
