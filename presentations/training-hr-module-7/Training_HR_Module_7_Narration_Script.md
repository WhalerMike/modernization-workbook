# HR-Driven Identity learning path — Module 7: Find lifecycle drift and file the evidence — narration script (practice copy)

## Slide 1 — Module 7: Find lifecycle drift and file the evidence

Welcome to Module 7, the last module of the HR-Driven Identity learning path: find lifecycle drift and file the evidence. This is Gate 7 of the implementation guide, and it goes with Chapter 07 of the developer workbook. The first six gates each produce a result. This gate keeps those results true over time, and hands the ISSO something they can check. In this module you'll write one read-only run of the lifecycle drift classes and the six lifecycle metrics, from the HR export, the directory, the card system and the earlier modules' outputs. Then you'll package each run with a hash chain, verify it, and assemble a reporting period. The module takes about an hour with its lab.

## Slide 2 — Why accounts drift, and why the record must last

Why does this gate exist? Because accounts drift from the HR record, even after every earlier gate is done right. A worker shows up in HR with no account. A terminated worker's account is still enabled. An account turns up that nobody owns. Someone other than the named writer changes a value. A card stays active after a separation. Each of those is a drift class, and the run in this module finds them all. There's a second problem: time. Entra keeps its own logs for only thirty days, and the evidence has to outlive the accounts it describes, which are eventually disposed of. So the findings and metrics have to leave the directory, in a form an ISSO can check later.

## Slide 3 — What you'll be able to do in Module 7

Here's what you'll be able to do by the end. You'll name the six lifecycle drift classes and the six metrics, and say which module's output feeds each. You'll write a run from the earlier modules' outputs and read its findings. You'll package runs with a hash chain, verify a package, and check it yourself with sha256sum. And you'll assemble a reporting period, and explain why it can be incomplete even when its chain is whole. This run reads the outputs of Modules 1, 2, 3, 4 and 6. You don't need to have kept them: the first step of the lab rebuilds them. The packaging builds on the drift pipeline in the Federal Modernization Workbook's Book 19's Chapter 09, and the lab calls it from the same clone.

## Slide 4 — What the evidence has to show: the guide's Step 7

Unit 1 reads the guide's Step 7, which asks for five things. Run the drift classes: that's the run command, with classes L D one to L D six. Fix at the source, not in the directory: the period counts findings opened and closed, and keeps each unauthorized-write finding's closure at the source. Report the six metrics: the run computes them and flags any out of bounds or not measured. Prove the sole source for each population: this code doesn't decide that; it's seven days of provisioning logs against the audit log, in Book 03's Appendix C. And keep the evidence outside the directory: that's the package, verify and period commands. Book 03's Chapter 11 has the design. Attribute drift isn't this module's; it belongs to Gate 9 of the attribute-driven migration guide.

## Slide 5 — The drift classes: LD-01 to LD-08

Unit 2 turns to the workbook chapter. Here are the classes. L D one, missing identity: an active worker record with no account. L D two, stale access: a worker terminated in HR whose account is still enabled, or a contractor past the earliest end and still enabled. L D three, orphan account: an enabled account that matches no worker or contractor record. L D four, unauthorized write: Module 1's audit scan found a second writer or a forbidden write. L D five, credential drift: an active PIV card for a separated worker. And L D six, the contractor version: an active card for someone whose engagement ended, or whom the contractor source doesn't hold at all. Those six are Findings. Two more rules are warnings about the metrics: L D seven, out of bounds, and L D eight, not measured.

## Slide 6 — The six metrics, and where each value comes from

The six metrics. Two come from Module 6: the ninetieth percentiles of separation-to-block, at most four hours, and separation-to-revocation, at most twenty-four. Transfer-to-review comes from Module 4's mover review, at most two hundred forty hours. The joiner readiness rate comes from Module 3, at least ninety-five percent. And two are computed by this run: correlation coverage, the share of enabled accounts that resolve to a current worker or contractor, at least ninety-nine percent; and derivation purity, the share of access-granting memberships computed by rule, at least eighty percent. Module 1's scan and Module 2's contractor decisions feed the drift classes instead. One rule matters most here: a metric with no input is not measured, never zero. And the thresholds are the program's starting values. Choosing them is the agency's decision under C A seven.

## Slide 7 — The run: one read-only folder per run

A run is one folder, and it only reads. Its run dot JSON records the tenant, the cloud and the mode, and a SHA-256 of each module output it read, so anyone can tell exactly which inputs produced it. Beside it, the lifecycle folder holds the findings, the metrics and a manifest. Before the run reads an earlier module's output, it checks that output against its own manifest, so a changed file is caught, not silently used. The tools also write each output folder once: they refuse a folder that already holds a manifest. That's why the lab's first step deletes the out folder and rebuilds the five module outputs. Lab 1 writes its runs in fixture mode. Lab 2 writes them in tenant mode, from your test tenant's exports.

## Slide 8 — The package, the chain and the period

The packaging is three commands in the drift pipeline. Package seals one run: a SHA-256 for every file, the tenant I D, and the hash of the previous package's manifest, which is what chains them. A package is written once, and a run from a different tenant is refused. Verify rechecks a package. But the ISSO doesn't need the kit to trust it: sha256sum, checking the SHA256SUMS file, is their own independent check. Period assembles the packages in a reporting window. If there's a gap in coverage or a broken link in the chain, the period isn't complete. It also scores Gate 7's criteria and maps the findings and metrics to five controls. That mapping is the program's design guidance; the assessor decides each control.

## Slide 9 — Try it: rebuild the inputs and write the first run

Try it. Step one deletes any out folder, then rebuilds five inputs, one command each: Module 1's writer scan, Module 2's contractor extract, Module 3's readiness, Module 4's mover residual and Module 6's separation timing. The full commands are on the module page; each one exits two, because each fixture holds findings. Step two writes the first run, for October. It reads four module outputs and prints the six metrics. Separation-to-block at five point five two hours, and revocation at a hundred ten, both out of bounds. Transfer-to-review isn't measured, because the mover's review is still open. Readiness is twenty-five percent, correlation coverage fifty-eight percent, and derivation purity seventy-six percent: all out of bounds. Fourteen Findings, six Warns.

## Slide 10 — Try it: read the run's findings

Step three prints the findings, one line each. There are fourteen Findings. One missing identity, a worker with no account. Three stale accounts, among them Drew and Harper, two of Module 6's leavers, still enabled, and a contractor past the earliest end. Two orphans, a print kiosk and an old temp account. Five unauthorized writes, which are Module 1's four second writers and its forbidden delete, carried forward. One active card for a separated worker, and two contractor cards that should be gone. Then six Warns: five L D seven, one for each metric out of bounds, and one L D eight, for the metric that wasn't measured. Notice how the earlier modules' results reappear here. This run is where they all meet.

## Slide 11 — Try it: package two runs, chained, and verify

Step four writes the next day's run, for the first of November, and it prints the same metrics and the same counts. Step five packages both runs. The first package opens twenty findings, the fourteen Findings and six Warns. The second package names the first one's manifest as its previous, which chains them. It opens nothing new and closes nothing, because the inputs didn't change between the two runs. Then verify confirms the second package: six files, and the same manifest hash the package command printed. Your hashes match these only if your fixtures are the committed ones. Finally, the ISSO's own check, with no kit at all: sha256sum, run inside the package folder, reports every file OK.

## Slide 12 — Try it: assemble the period, and read why it fails

Step six assembles the period, from the first of October to the second of November. Two packages, no chain breaks, no coverage gaps, twenty findings open at the end, and complete is false. Exit code two. Print the period summary and you see why. It scores Gate 7's criteria. The evidence criterion is met: kept outside the directory, with an unbroken chain. But drift is still open, so the first criterion isn't met, and five metrics are out of bounds, so the second isn't either. The fourth, the sole source, isn't decided by this code at all. That's the point of this step: an unbroken chain proves the record is intact, not that the gate is passed. Step seven runs both test suites, fifty-seven and a hundred forty-two tests, and deletes the out folder.

## Slide 13 — Lab 2: schedule the run in a test tenant

Lab 2 runs the same thing for real, in a worldwide or GCC test tenant, never production. The reader app uses a certificate or a federated credential, and holds only the two permissions the drift-read task lists, with admin consent. You export the workforce users, run Lab 2 of Modules 1 to 6 against the test tenant, and write a run in tenant mode. Then you schedule it in Book 19's Chapter 09 workflow, with each package written to an immutable test storage container, and assemble a period from the scheduled runs. To back it out, remove the schedule, delete the reader app, its credential and its consent, delete the test container if you created it for the lab, and delete the local folders. The authors haven't run Lab 2.

## Slide 14 — The federal requirement, and the evidence to keep

The federal requirement. In NIST special publication eight hundred fifty-three terms, this gate meets C A seven, continuous monitoring with system-level metrics, and A U six and A U eleven with S I twelve: the review and retention of audit records. It also meets BOD 25-01's continuous reporting. The evidence an ISSO keeps for Gate 7: every period's manifest, summary and checksum file, with the approved thresholds. The packages, with each unauthorized-write finding's closure at the source. The storage container's retention and immutability settings, set to the records schedule. And the ScubaGear results beside the period. The guide's Evidence section gathers all seven gates into one file per population.

## Slide 15 — Check yourself: two questions on drift and evidence

Check yourself with two questions from the module's knowledge check. First: Module 4's mover review is still open, so there's no transfer-to-review value. How does the run report it? The answer is c: as not measured, rule L D eight, never as zero. A zero would look like the best possible result, and it would be false. Second: the period reports zero chain breaks and zero coverage gaps, but complete is false. Why? The answer is a. Drift is still open and metrics are out of bounds, so Gate 7's criteria aren't met. The period scores the criteria, and an unbroken chain meets only the evidence criterion. The module page has three more questions, each linked to the section that teaches it.

## Slide 16 — Summary: you've finished the learning path

To sum up. You rebuilt the earlier modules' outputs, and wrote two daily runs of the lifecycle drift classes and metrics. You packaged them with a hash chain, verified a package with the kit and with sha256sum, and assembled a period that shows exactly which of Gate 7's criteria are met, and which aren't. And with that, you've finished the HR-Driven Identity learning path. Across seven modules you named one writer for every account state, ran contractors from their own source, made joiners ready on day one, assigned access from attributes, checked card sign-in, timed separations, and filed the evidence. Go back to the learning path, or check your agency's progress against the guide's checklist.
