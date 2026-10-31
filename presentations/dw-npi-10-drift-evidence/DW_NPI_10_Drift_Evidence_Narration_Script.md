# Building Non-Person Identity, Chapter 10 — Drift and Evidence for the ISSO — narration script (practice copy)

## Slide 1 — Chapter 10: Drift and Evidence for the ISSO

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 10, the last one: drift and evidence for the security officer. A register approved once proves only the day it was approved. The security officer needs to know what changed since, who changed it, and that nobody edited the record afterwards. We'll start from the Sentinel rule Learn links for added credentials, see what it misses, then walk the drift run, the approved baseline, the rules, the review cycle, the vintage comparison and the hash chain, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — What the evidence has to show

Why does this chapter come last? Because everything before it produces state, and state proves only the moment it was read. Four sources already say what the evidence is for. The plan asks for scheduled drift checks, a full review cycle, and evidence for specific controls. Book 2 sets the pattern: commit a baseline, compare every run with it, and close findings at the source. The companion guide maps the controls, while the assessor decides. And Book 17 adds the AI side. The code's job is to turn state, events and an approved baseline into evidence with no gaps.

## Slide 3 — Learn's facts, the cloud and the other chapters

Learn gives the facts the design turns on. A credential added to an existing app is high risk, and one added outside the expected process could be an attacker's. Learn names the exact audit events, keeps the log for thirty days with a premium license, and defines expiring as within thirty days and unused as over ninety. For this estate, Graph is the worldwide endpoint. One report, the service principal sign-in activity, is beta and worldwide only, so in the higher clouds the code records it as not read. And the other chapters feed in through a small contract.

## Slide 4 — Microsoft's Sentinel rule, pinned and run offline

Microsoft's starting point is the security operations guide for applications. It says what to watch, where to find it in the audit log, and when to alert: outside normal hours or workflows. And it links a ready-made Sentinel rule for new credentials added to an app or service principal. That rule lives in Microsoft's Sentinel repository, so it's pinned unmodified, with checked hashes and a weekly watch. A harness then splits the query into its twenty stages and runs each one over ten fictional audit rows. An unfamiliar stage throws, so an upstream change fails the tests rather than being half-run.

## Slide 5 — What the rule misses: initiators, keys, targets

Run over the fixture, the rule does catch the obvious case: a person adding a secret to an app that already had a certificate. But three filters make it blind in the riskiest places. It only looks at initiators with an at sign, so a credential added by an app is never seen, including an app abusing a broad permission. It drops events where the old key list was empty, so the very first secret on an app vanishes. And it keeps only application targets, so a credential added to a service principal is dropped too.

## Slide 6 — What it misses: the pipeline, names and scope

The other gaps are about noise, privacy and scope. The rule knows nothing about the pipeline, so every legitimate rotation alerts, and soon nobody reads the alerts. It parses only the first key in an event. It carries people's names into the alert, wherever that goes. And it needs a Sentinel workspace before any evidence exists, while covering only one of the plan's five drift items. So the verdict: use the rule's activity names and its key comparison as the model, and don't use it as the drift check.

## Slide 7 — The run, the approved baseline and the reads

So what does the code build? One run, written as one folder: Chapter 1's inventory and Chapter 2's ownership check, unchanged, plus this chapter's drift folder and a run record that ties them together by hash. A task that fails is recorded as an error, never as an empty result. The baseline is a fingerprint per identity over twenty governance columns, leaving out things like last logon that change daily, and it counts only once a reviewer approves its hash. The audit read is narrow: declared calls only, thirty days at most, and identifiers, not names.

## Slide 8 — The drift rules: NPI-DRF-01 to NPI-DRF-09

Nine drift rules run against the approved baseline. New and changed identities are warnings, with the exact columns that changed. Ownerless identities, passwords that never expire, and credentials added outside the pipeline are findings. Unused and expiring use Learn's ninety and thirty days. A new broad grant is a finding. And the ninth rule is the honest one: any gap in the evidence is reported, never treated as a pass. The key rule is what counts as the pipeline: both a listed identity and a logged key, so a stolen pipeline credential still shows up.

## Slide 9 — The review cycle and the annual vintage comparison

Two more kinds of evidence sit beside the drift. The review cycle belongs to the identity governance officer: the reviews are built in Chapters 7 and 9, and this chapter only reads their records. It flags an app whose owners haven't reviewed it this quarter, an agent whose sponsor hasn't attested this year, and agent access with no end date. And crucially, a missing record isn't a passed review. Then once a year, the AI use-case inventory is compared with last year's, catching new systems with no identity, and retired ones whose identities are still switched on.

## Slide 10 — The package, the chain and what the ISSO receives

Here's what the security officer actually receives. Each run is packaged with a summary that carries rule IDs and fingerprints but no names, and a checksum file anyone can verify with a standard tool. Before packaging, the run itself is checked end to end. Each package records the previous package's hash, so the packages form a chain, and a replaced package or a missing day shows up as a break. Then a period summary verifies every package, checks for gaps, and maps findings to each control as evidence. The assessor, not the code, decides each control.

## Slide 11 — Who runs it, who signs it, and what it may read

Who's involved? Developers and pipeline engineers own the scheduled checks. The identity governance officer owns the review cycle and the evidence, and signs the period summary. And the security officer receives it, verifies it with nothing more than a checksum tool, and signs the gate. The permissions are deliberately small. This chapter adds only the audit log read; the whole run, together with Chapters 1 and 2, needs four Graph read permissions, Reader on the managed identities, and the default directory read. None of it can write.

## Slide 12 — Lab 1: the rule, then two days of runs

Lab 1 needs PowerShell and Python on a laptop, and nothing else. First, run Microsoft's rule over the fixture: of four credentials added on the second day, it finds one. Then confirm the run needs four read permissions and nothing that writes. Run the first day with no baseline, and it writes a baseline candidate with its hash. In real life a second person reviews that candidate and passes you the hash. Then run the second day against the approved baseline, and the drift appears: more findings and more warnings than day one.

## Slide 13 — Lab 1: reading the drift and the vintage

Reading day two's drift, the three credentials the rule couldn't see are all there: one added by a person, one added by another app abusing a broad permission, and the very first secret on an app. Just as important is what's missing: the pipeline's own two rotations, because both the identity and the key log agree. An expiring certificate from day one is gone, because it was rotated. A chapter file with a forged fingerprint is refused. Then the vintage comparison finds a new deployed agent with no identity, and a retired use case whose app is still enabled.

## Slide 14 — Lab 1: package, verify, the period, then break it

Now switch to the Python side. Package both days, the second chained to the first: nineteen findings opened on day two, and one closed, the rotated certificate. Verify the package with the code and with a plain checksum tool, and confirm no names appear in the summary. Then assemble the period for the security officer. It's honestly incomplete: some controls wait on other chapters, and Gate 7 isn't met yet, with passwords that never expire, orphans, and open reviews. Finally, break it on purpose: edit a file, or swap the order of days, and verification fails.

## Slide 15 — Lab 2: a test tenant, three changes to see

Lab 2 uses a test tenant with fictional people, and the run only reads. Register a reader with exactly the four permissions, run once, and have a second person approve the baseline. Then make three changes by hand: a secret on an app that already has a certificate, a first secret on an app with none, and a consent grant. Run the drift run, and check what the fixture assumed against reality, like the exact activity names. Cross-check against Learn's own audit log procedure, package and verify, then back it all out.

## Slide 16 — Dangers, and the guard for each

Evidence fails in quiet ways, so each of these has a guard. A baseline nobody approved lets a malicious change become normal. A failed read can look like a fix, because yesterday's findings simply disappear. A day nobody read leaves a gap where a credential could be added. Trusting the Sentinel rule misses the riskiest credentials, while alerting on every rotation teaches people to ignore alerts. And a package edited or swapped after the fact describes a run that never happened. The hash chain, the approved baseline and honest gap reporting close each one.

## Slide 17 — Done when: the checklist, and the workbook's end

Here's what done looks like. Every run reads all three parts and says so. The reader holds exactly four read permissions. The baseline was approved by someone else, each window picks up where the last ended, and every credential added outside the pipeline has an explanation or an incident. The review records arrive, every package verifies, the chain has no breaks, and the evidence store is locked. And the period summary is signed and reviewed. That's the end of this workbook: every chapter's checks now feed one verifiable period. Thanks for watching.
