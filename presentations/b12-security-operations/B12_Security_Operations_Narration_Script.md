# Book 12 — Security Operations & Telemetry — narration script (practice copy)

## Slide 1 — Why Can't You Defend What You Can't See?

This briefing comes from Book 12 of the Federal Modernization Workbook, Security Operations and Telemetry: how an agency makes every part of its estate emit evidence, turns it into detection and response, and proves that it works.

I'll take four questions: why you can't defend what you can't see, what each plane must emit and how findings reach one queue, who runs security operations, and how to run detection, response and monitoring.

The short version: design visibility instead of assuming it, and close a finding only when the thing is fixed, with proof.

## Slide 2 — A log warehouse is not a detection engine

Why can't you defend what you can't see? Most agencies run a SIEM, pay for log storage, and can show an auditor millions of events a day. But each of those measures what arrived. None of them measures what didn't.

NIST keeps apart two things that are easy to buy as one. AU-12 says generate the audit records. AU-6 says review and analyze them for unusual activity and report what you find, and SI-4 adds detecting attacks. An agency can satisfy the first completely and still fail the other two.

OMB M-26-14 measures the same way. Logs must be searchable for six months and retrievable for a year, but its maturity model scores collection by alerting: under half of the baseline covered by actionable alerts at Level 1, at least 70 percent at Level 3.

And Microsoft says logs ingested only into the Sentinel data lake tier don't generate alerts. That source meets retention and detects nothing.

## Slide 3 — Coverage gaps raise no alarm on their own

Coverage gaps don't announce themselves, and there are four ways they stay quiet. Some sources are never connected: Azure resource logs aren't collected until each resource has a diagnostic setting. Some connected sources aren't flowing: Microsoft says the AWS connector's green status means a collection rule exists, not that data arrived. Some collected data is never analyzed. And some sources are switched off on purpose; CISA calls tampering with logging well-documented threat actor behavior.

In the 2023 Exchange Online intrusion, a federal victim caught it with its own alert on mailbox-access events that, at the time, came only with a premium audit license. Agencies without those events had nothing to look at.

None of these gaps shows up in what arrived, only in comparing what arrived with what was expected. That's why M-26-14 tells agencies to use CDM and asset data to confirm log coverage, and why BOD 23-01 calls asset visibility a basic pre-condition. The inventory is the denominator.

## Slide 4 — The evidence contract: one record, one join key

A multi-cloud agency runs several stacks: Azure Update Manager, AWS Systems Manager, a virtualization lifecycle manager, firewall syslog, a Linux host agent. Five partial views can't prove one vulnerability is fixed everywhere.

The program's answer is an evidence contract: one record shape every source emits, with eight fields fixed before any data flows. They carry the six things NIST's AU-3 asks a record to establish, plus the control it evidences, a verdict and a disposition.

The join key is authoritative asset identity plus time. Every stack has its own identifier. Even Microsoft's normalization model lists separate device IDs per product and calls a hostname a last resort. So the key comes from the naming plane, which has to exist before the pipeline. And time means when the state was observed, because arrival time joins the wrong records silently.

One caution: the system-wide, time-correlated trail, AU-12(1), is a High-baseline control. At Moderate, the program selects it by design.

## Slide 5 — What each plane must emit, and how each goes quiet

What must each plane emit? The program treats the estate as six planes: identity, cloud platform, Microsoft 365, endpoints, network and data. No one plane covers M-26-14's baseline, and systems a third party runs for the agency are in scope too.

Each plane has a default that looks instrumented and isn't. Entra ID shows sign-ins but keeps them only 30 days with P1 or P2, so the program streams all four sign-in streams, not just the interactive one, plus Microsoft Graph activity. Azure deletes its activity log after 90 days, and resource logs aren't collected at all until each resource has a diagnostic setting. Microsoft 365 audit records last 180 days on the Standard tier; the one-year default applies only to users with an E5-level license, everyone else, guests included, stays at 180.

So emission is enforced by policy, and verified by a query that names every expected table, so a missing one shows up as a row instead of silently disappearing.

## Slide 6 — Warehouse to detection: rules, incidents, closure

A workspace full of tables is still a warehouse. Rules, incidents and automation make it a detection engine, and the program's rule is strict: no source counts as monitored until an enabled rule reads it, and no rule counts until its output reaches a queue someone owns.

The engine also sets a floor on time to detect. A scheduled rule runs every five minutes at best, with a five-minute delay for ingestion. A near-real-time rule runs every minute on a two-minute delay, and a workspace can enable only 50 of them. Behavioral baselines are slower by design.

Defender XDR detects what its own sensors see on endpoints, identities and email. Sentinel rules cover what Defender can't see: DNS, SASE, SQL audit and other clouds.

Then prepare for the assessor's test: show an alert from the last 30 days, the incident it opened and what was done. That takes four records: the alert, the ticket, the response notes and the closure.

## Slide 7 — The federal clocks: BOD 26-04 and M-26-14

Two federal clocks run against this work. CISA's BOD 26-04, issued June 10, 2026, revoked BOD 22-01 and BOD 19-02, and replaced severity buckets with four questions about each vulnerable asset: is it publicly exposed, is the flaw in the Known Exploited Vulnerabilities catalog, can exploitation be automated, and does it give partial or total control?

The answers set a maximum timeline. Three days, with forensic triage on the worst rows, because, in CISA's words, applying a patch generally does not evict a threat actor. Then 14 days, 60 days, or the next system upgrade. The clock starts when CISA lists the flaw or when the agency finds it and updates CDM, whichever comes first, and there are no waivers. Phase III, remediation within the table, applies from December 7.

M-26-14's clock runs from CISA's Logging Reference Architecture, published August 20, 2026: the Agency Logging Plan within 90 days, and maturity Levels 1, 2 and 3 within 120, 180 and 320 days.

## Slide 8 — Vulnerability and patch: a scanner fixes nothing

Vulnerability management fails at three points assessors probe: a stale inventory, prioritization by score alone, and no record of found, due and fixed. The program's answer is a daily queue. Pull the KEV feed before the morning review. Pull findings from Defender Vulnerability Management. Join each device to the authoritative asset record and its exposure tag. Look up CISA's automation and impact data, apply the directive's table, and keep the first-detected date, never resetting it.

Use the catalog's due date, because Defender's vulnerability data carries no KEV flag. Treat an asset with no exposure tag as publicly exposed. And Defender's exports carry no history, so the program keeps its own.

A scanner authors no state; it measures a gap. Each platform patches with its own native stack, and every stack returns the same remediation record, keyed to the same asset. A finding closes when the fix is recorded and the next scan no longer sees it.

## Slide 9 — Configuration, posture and CUI data share the queue

Three more streams share the queue. Configuration first: a patched host that drifts from its baseline isn't remediated. Baselines come from SCuBA, CIS or DISA STIGs. Azure machine configuration's auto-correct mode fixes drift without recording it, so the program keeps it for low-risk settings.

Cloud posture next. A storage account open to the internet has no missing patch, so a scanner never reports it. Each provider's native posture tool is primary for its own platform. Defender for Cloud doesn't cover Oracle Cloud, and its AWS connector isn't available in Azure Government.

Then data. The CUI framework has two levels, Basic and Specified, decided by the authority in the CUI Registry: Privacy Act records are Basic, and federal taxpayer information is Specified. Labels drive data loss prevention on the service, the endpoint and the CASB.

And check queue membership. Since early October 2026, a built-in Microsoft tuning rule keeps DLP signals out of the incident queue unless an administrator turns it off.

## Slide 10 — Who runs security operations, and who decides

Who runs security operations? Most agencies can name their SOC. Fewer can say who decided that a log source is collected, how long it's kept, or who accepted the risk when it went quiet for three weeks.

The program assigns them. The CIO sets scope and funding and designates the top-level SOC. The CISO decides what each plane must emit, owns the Agency Logging Plan, and approves any playbook that acts on production. Platform owners keep their own planes emitting. Security engineering builds the SIEM, the rules, the playbooks and the evidence pipeline. The SOC runs the queue, and CISA's one-hour clock starts there.

Two roles are easy to forget. The records officer decides disposition, and must concur before anyone shortens retention, because evidence that's gone can't come back. And the authorizing official, the only official who can accept risk, accepts the risk of not seeing: a gap carried rather than closed, a suppression with no end date, a missed deadline.

## Slide 11 — Detection engineering: rules as code, tested, owned

How do detections get built? As code. The rule library lives in version control, and nobody edits a production rule in the portal; a change is a reviewed commit. Every rule has one named owner, a test and a review date.

Each rule moves through five steps. Author it, starting from Microsoft's template where one exists. Test it against history and replay a known-bad sample, because a rule that can't be shown to fire isn't finished. Run it alert-only for at least two weeks, and until its false positives are documented. Promote it. Then review it at least quarterly.

Where a vendor analytic isn't available in the agency's cloud, the program rebuilds an equivalent inside its own boundary, and says it isn't parity.

Plan for rot. Thresholds drift, sources stop without an error, and Sentinel disables a rule after repeated failures and marks it auto disabled. The standing tuning effort is the real cost of having a library.

## Slide 12 — Response within the actuation ladder

Detection without response shortens the investigation, not the exposure. So every playbook is confidence-gated: high confidence prepares containment, medium confidence enriches and tickets for a human, and low confidence never acts.

Responses sit on the workbook's actuation ladder. L1 observes. L2 advises. L3, gated actuation, is the default for anything with a large blast radius: the playbook checks its preconditions and prepares the action, and a named approver releases it. L4 runs alone, logged and reversible, for enumerated classes such as closing known-benign incidents. Three classes stay at L3 permanently: isolating a server, disabling a privileged or emergency account, and any tenant-wide change.

Defender XDR's attack disruption acts on its own, so the authorizing official decides whether to accept it as L4.

Latency is real. Session revocation can take up to 15 minutes in services that support continuous access evaluation, and a hybrid user must be disabled in Active Directory too, or the next synchronization undoes it.

## Slide 13 — Continuous monitoring: metrics that prove it works

Last, prove it works. Continuous monitoring is a pipeline: emit, normalize, correlate, bind each record to its control, report, and respond.

The metrics are built so they can't flatter. Detection coverage counts how many of M-26-14's eleven baseline activities have an enabled, tested rule over a fresh source, not how many rules exist. Telemetry completeness treats a stale required source as an AU-5 failure. KEV remediation counts closures within the BOD 26-04 timeline, plus open items past it, because a share of the open queue improves every time new findings arrive. And configuration reports passing, failing and excepted settings separately.

Read outside scores carefully. M-26-14 scores each system at its lowest element, and a system can reach Advanced while missing the six-month searchable floor. FedRAMP's 46 Key Security Indicators bind cloud providers, not agencies; the agency reviews each provider's quarterly report.

A finding closes on re-test evidence, or the authorizing official carries it with an end date.

## Slide 14 — Decisions to make, and next steps

So, four decisions.

Name the planes and assets that are expected to emit, and check each one against what actually arrives.

Stand up the naming plane before the evidence pipeline, so every record joins on one asset identity.

Fund the Agency Logging Plan as the program's visibility plan, not as a storage purchase.

And send every blind spot to the authorizing official: a telemetry gap, a suppression with no end date, a missed BOD 26-04 deadline, each with an end date.

The next step needs no procurement. Run the coverage check against the inventory, tag the exposure of every externally reachable asset before December 7, and count a source as covered only when a tested rule reads it.

You can't defend what you can't see, and a finding closes only when the thing is fixed, with proof. Book 12 has the detail, every claim footnoted. Thank you.
