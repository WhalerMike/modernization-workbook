# Building the Attribute-Driven Migration, Chapter 01 — The HR-to-Entra Middleware — narration script (practice copy)

## Slide 1 — Chapter 01: The HR-to-Entra Middleware

Welcome to the Federal Modernization Workbook's developer workbook, Building the Attribute-Driven Migration. This is Chapter 1: the middleware between the H R extract and Microsoft Entra I D. The provisioning service will do whatever the payload tells it, so the code that builds the payload is where the H R record stays true. We'll start from Microsoft's own sample, C S V to SCIM, see what it leaves to you, then walk the hardened client, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — Why the payload is where the record stays true

Why does this chapter matter so much? Because the provisioning service is obedient. It owns the mapping to directory attributes, the matching and the write, and Microsoft deliberately keeps the comparison logic out of the client. That means everything before the post belongs to you: what gets sent, in what order, how fast, and what record you keep. And the endpoint is asynchronous. An accepted response only means the batch was staged, not that anyone was written, so reading the logs afterwards is part of the job. Next, which cloud.

## Slide 3 — Which cloud: the Graph host and the token authority

Which cloud you're in decides which Graph host you call and where your token comes from, and a token from one cloud simply doesn't work in another. A G C C tenant like this estate's uses the worldwide endpoint, so Microsoft's sample works here as written. The higher government clouds have their own hosts, and the sample's address is hard-coded, so it can't reach them. The hardened client takes its endpoint from settings and only accepts one of the three Graph hosts. Now let's see what Microsoft actually gives you.

## Slide 4 — Where the middleware sits, and what it writes

Here's the whole pipeline on one slide. An H R extract comes in as a C S V file. The middleware validates it, normalizes it, orders it, batches it and paces the calls, then posts bulk requests to the provisioning endpoint. Along the way it writes four files. Three of them carry only keys and hashes, so they can live in the evidence store. The quarantine file holds the refused rows, real personal data, so it goes only to the access-controlled audit store. Keep those four files in mind; the labs read every one.

## Slide 5 — Microsoft's sample: CSV2SCIM and its five modes

Microsoft publishes a PowerShell sample for exactly this integration, and Learn walks through it step by step. It has five modes. Two run entirely offline: checking your mapping file and generating the payload. The other three talk to Graph: sending, extending the provisioning app's schema, and summarizing what happened in recent sync cycles. The chapter's advice is simple: use it. Most of what a first integration needs is already there, maintained by Microsoft, with a Learn page behind every step. Next, the idea at its center.

## Slide 6 — The mapping file, and the pinned copy

The sample's main idea is its mapping file. Each SCIM attribute names a column in your extract, or a tiny script that computes the value, like turning a worker status into active or inactive. Learn is careful to say this only maps the file to SCIM; mapping SCIM to the directory stays in the provisioning app. And because a link to a sample's main branch changes under you, the repository keeps an unmodified, hashed copy, with a weekly watch on upstream. A new version becomes a decision someone reviews, never a surprise.

## Slide 7 — What the sample leaves to you: the record

This is the heart of the chapter. Run Microsoft's sample on the book's nineteen-row fixture and it sends all nineteen. That's not a bug; it's a converter, and Learn says validation is something you add. But look at what gets through: a blank key, a pending worker sent as active, the same person twice, a future hire who could sign in before day one. The hardened client refuses nine of those rows, sends leavers first and managers before their reports, and holds a run that would disable too many people. There's a second half to this table.

## Slide 8 — What it leaves to you: pacing, clouds and evidence

The second half is about running it safely. The sample has no pacing of its own, it only reaches the worldwide endpoint, and its sign-in asks for a permission that can change any app in the tenant. It also gives every operation a fresh random identifier, so the same input never produces the same batch, and its only record is the console. The verdict is balanced: keep using the sample where it's strong, for checking mappings, extending the schema and reading logs, and send production data through the hardened client. Or contribute these changes upstream.

## Slide 9 — The code: two equivalent clients, one mapping

So what does the example add? Two clients, one in Python and one in PowerShell, that read the same mapping file and produce exactly the same output for the same input. The Python one needs nothing beyond the standard library. One mapping file holds the column map, the code lists, the worker types and the length limits, and a settings file holds the non-secret knobs, like the disable threshold and the call budget. The payload itself keeps the shape of Learn's own examples. Let's look at the rules it applies.

## Slide 10 — Validate, fail closed, and send the whole record

Validation is where a bad H R row stops before it becomes a bad account. Each row either becomes a SCIM operation or is refused with reasons and goes to quarantine, along with the unchanged row and the payload it would have sent. Some things are only warnings: someone on leave isn't a leaver, and a departing manager never blocks a new hire. The chapter's rule of thumb is that every new check starts as a refusal until the H R owner agrees it can be a warning. And the client always sends the complete record, because with clearing switched on, a missing value can wipe the target.

## Slide 11 — Order, batch and hold; pace, retry and stop

Next, the order and the speed. Leavers go first, so a departing mover never briefly gains access, and managers go before their reports so the references resolve. Two guards hold the whole run until a person confirms it: too many disables, or more calls than the daily budget, which follows Microsoft's tenant quota by license. On speed, two Learn pages disagree on the rate limit, so the client paces to the stricter one, honors the retry header, and stops at the first failure rather than retrying in a loop. Next, the record it keeps.

## Slide 12 — The provenance manifest and the tests

This file is what an auditor will thank you for. It ties every batch to the exact extract and mapping that produced it, by hash, so you can walk from a line in the provisioning logs to a person, to a batch, to the input files. That only works because each operation's identifier is the person key, not a random value. It holds keys and hashes only, so it can live in the evidence store. Both clients pass the same tests, and seven of them pin the sample's behavior, so if Microsoft improves it, you'll know it's time to shrink your own code.

## Slide 13 — Who builds it, and what each identity may do

Who is this for? Developers who own the H R integration, comfortable in PowerShell or Python and familiar with SCIM, but they don't need to know the H R product. The engineers who review it, who should be able to say where every rule came from. And the security officer, who needs records rather than a screen. The permissions are the other half of who. The sender gets one upload permission and nothing else; reading the logs is a separate identity. And note that two Learn pages name different log permissions, so try the narrower one first in your test tenant.

## Slide 14 — Lab 1: Microsoft's sample, then the hardened client

Lab 1 runs on a laptop with no tenant and no network. First you run Microsoft's sample on the fixture. The mapping checks out, and the payload holds all nineteen operations. Then go looking: the pending worker is active, one person appears twice, and one operation has an empty key. Next you run the hardened client on the same file. It exits with a code that says rows were refused: nine ready, nine quarantined, one superseded, and the PowerShell client agrees exactly. Now compare the two.

## Slide 15 — Lab 1: compare, break it, hold it, test it

Now the comparison makes the gap table real. The pending worker sits in quarantine with its reason. Our first operation is the leaver, while the sample starts at the top of the file, and the future hire is disabled in ours but active in the sample's. Hash the extract yourself and it matches the manifest; run each tool twice and only ours gives identical batches. Then break things on purpose: a lower-case department code is refused, and a strict disable limit holds the run. Finish with the tests, forty-eight in each language.

## Slide 16 — Lab 2: a test tenant, five records, reconciled

Lab 2 moves to a test tenant with fictional records, never production. You create the provisioning app, extend its schema with Microsoft's sample, and give the sender one upload permission through a managed identity or a certificate, never a secret. Start the job with its safety nets on: the notification email and accidental-deletion prevention. Then send five records and get one accepted batch. The step people skip is the next one: reconcile. Every person key in the manifest should show up in the provisioning logs. Then back it all out.

## Slide 17 — Dangers, and the guard for each

Each of these dangers is ordinary, and each has a guard. The most tempting is sending a sample's output straight to production, which lets pending workers and duplicates into the directory. The most damaging is one bad extract disabling hundreds of people before anyone looks, and the hold stops that. The quietest is treating an accepted response as success, when the record may have failed inside the job. Notice that every guard is something the code does on every run, not something a person has to remember.

## Slide 18 — Done when: the chapter's checklist

Here's what done looks like. On the code side: the sample's mapping validates, the pinned copy is unchanged and reviewed, production goes through the hardened client, both clients pass, and new rules refuse by default. On the run side: the hold and the budget are set from your own numbers and license, the sender has one permission and no secret, the quarantine file stays in the audit store, every missing person key becomes a finding, and the endpoint matches the cloud. Chapter 2 builds Graph clients for the government clouds. Thanks for watching.
