# Building Global Secure Access, Chapter 08 — Rings, Metrics and the Evidence Package — narration script (practice copy)

## Slide 1 — Chapter 08: Rings, Metrics and the Evidence Package

Welcome back to Building Global Secure Access. This is Chapter 8: rings, metrics, and the evidence package. A ring exits on numbers, not on a quiet week. This chapter computes the guide's numbers, says go or no-go, writes the rollback before it's needed, and hands the security officer a package an assessor can re-hash. The chapter is a draft awaiting review, and the code is illustrative, tested against fixtures.

## Slide 2 — Why a ring exits on numbers

Why numbers? Because a ring that exits on the calendar carries its problems to a larger group: users the client doesn't cover, policies that would block people the service carries, a certificate about to expire. So the goal: decide each ring's exit from measured values; roll back in the guide's order from a plan a reviewer approved, written before it's needed; and give the security officer and the assessor one evidence folder, with the controls and indicators each run supports, where every file can be verified. It's for the developers, the program manager who runs the rings, the security monitor, and the security officer.

## Slide 3 — What Learn and the guide give you

Learn says traffic and remote network health logs stay thirty days, names the four tables, and says a sudden drop in traffic volume is an alert, because offboarding has no audit signal. Its deployment guide asks for a rollback plan, and its operations guide for at least two people per role. The guide adds the rings, the metrics and the rollback order, with signaling last. And CISA's remote user use case says visibility must be preserved through telemetry sharing. One thing isn't rebuilt: the Zero Trust Assessment results kit already turns an assessment into the closure register, and its network family points at the guide. This chapter's evidence is what that register cites.

## Slide 4 — Eight metrics, eight exit criteria

Here are the numbers. Eight metrics from one collection and the inputs: client coverage, sign-ins through the service, compliant network enforcement, Private Access least privilege, connector resilience, bypass exposure, TLS health, and telemetry freshness, each with a target from the settings. And eight exit criteria from the guide's ring table: business days in the ring, open severity-two tickets, help desk volume, the client on every in-scope device, clean report-only results, TLS failures under one percent, the emergency exclusion tested on the ring's start date, and break-glass rehearsed. The ring exits only if every criterion passes.

## Slide 5 — The rollback plan and the evidence chain

The rollback plan follows the guide's order. Enforced policies go to report-only, from Step 10 back to Step 5. Profile links come off, which is a portal step, and tagging goes off while the tenant restrictions policy stays. The groups come off the profiles and the VPN route comes back. Signaling is last, and only on request; the plan refuses it if a compliant network policy would stay enforced. The evidence chain copies each run with its manifest, adds its controls and indicators, every file's hash and the previous record's hash. A check with a failure is recorded as findings, not pass, and doesn't count toward a stage.

## Slide 6 — Who runs rings, watches logs, keeps evidence

Who does this? The technical program manager runs the waves and keeps the ring record. The service owner approves each ring's exit. The security monitor watches freshness and agrees the CISA telemetry path with the TIC delegates. The security officer keeps the evidence folder, inside the boundary. And the assessor or authorizing official decides each finding's closure: the kit only says the evidence is ready. Learn's advice is at least two people per role. The reads are Chapter 2's, plus the workspace, and nothing writes unless a rollback is applied with its approved hash.

## Slide 7 — Lab 1: telemetry, and the pilot's No-go

Lab 1. After collecting the pilot, step 2 runs the telemetry checks. The setting misses a category; branch health has no rows because no branch is on a remote network yet; alerts are twenty-seven hours old; and CISA telemetry isn't agreed. Step 3 computes the metrics and the pilot's exit. No metric is met, and the pilot is no-go, for five reasons: five business days in, one severity-two ticket open, eighty-three percent coverage, three report-only failures carried by the service, and one and a half percent TLS failures. The emergency exclusion was tested at ring start and break-glass was rehearsed.

## Slide 8 — Lab 1: ring 1 says Go; plan its rollback

Step 4 does the same for ring 1, two weeks later: every metric is met, every criterion passes, and the ring says go. Step 5 plans ring 1's rollback before it's needed. Three enforced policies go to report-only in the guide's order, Step 7, then 6, then 5. Tagging goes off. The profile links and group assignments are portal steps, and the VPN route is the agency's own change. Signaling stays on. The plan's hash is printed, and it's a dry run: nothing changed.

## Slide 9 — Lab 1: signaling last, and the evidence

Step 6 asks for signaling off as well. The plan adds it as the very last step, after its own steps have moved the enforced compliant network policy to report-only; it would refuse if any compliant network policy stayed enforced. Step 7 records the collection, the metrics and the rollback plan as evidence, and checks the folder: every file matches its hash, the three records form an unbroken chain, and each record lists its steps. Step 8 runs the tests: ten passed, none failed.

## Slide 10 — Lab 2: a ring in a test tenant

Lab 2 uses the test tenant from Chapters 4 to 7, with the diagnostic setting on and at least a day of pilot traffic. Run the guide's freshness query. Collect, check telemetry, and compute the ring's metrics and exit, using your own ring record from the template, kept on agency storage. Plan the rollback and file it with the change record, without applying it. Record every run in a protected evidence folder inside the boundary and check it. Nothing changed in the tenant, so there's nothing to back out but the working copies. Then re-run the Zero Trust Assessment and point each network finding at this evidence. The authors haven't run this lab.

## Slide 11 — Requirements, dangers, done

Fresh tables and an agreed CISA path support event logging, audit review and monitoring, with OMB M-26-14 and TIC 3.0's telemetry requirement behind them. Ring exits on measured criteria support change control and impact analysis. A rollback planned before it's needed supports the contingency plan. And the hashed chain supports protecting audit information. The assessor or authorizing official decides the controls, and closure. The dangers: a ring that exits on the calendar, the VPN's web path retired without CISA telemetry, and signaling turned off first in an incident. You're done when the tables are fresh, each ring's exit is filed, and its rollback was reviewed before it started. Next, Chapter 9: deploying to test, and production.
