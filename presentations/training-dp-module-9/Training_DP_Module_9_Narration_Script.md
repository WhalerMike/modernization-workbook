# Data Platform and SQL Server Identity learning path — Module 9: Closure, Drift and Evidence — narration script (practice copy)

## Slide 1 — Module 9: Closure, Drift and Evidence

Welcome to Module 9 of the Data Platform and SQL Server Identity learning path: closure, drift and evidence. It teaches Runbook R nine, continuous monitoring and closure, with Chapter 9 of the developer workbook, Building SQL Server Identity. You'll project an audit run onto the five closure conditions, see which fields the audit can't settle by itself, and compare two runs so a regression becomes a task. Take this module after Module 8.

## Slide 2 — Why closure is a record, not a one-time action

Why does this matter? An instance brought to the Entra-exclusive posture can slide back. An administrator can switch it to mixed mode, create a SQL login, or add a Windows login. So closure isn't a one-time action. It's a record that keeps coming back clean on a schedule, and drift is the run that doesn't. In this module you project an audit run onto the five closure conditions, see which fields the audit can't settle by itself, and compare two runs so a regression becomes a task.

## Slide 3 — What you'll be able to do in Module 9

Here's what you'll be able to do by the end of this module, which takes about fifty-five minutes with the lab. You'll name the five closure conditions and the fields the closure record shows for each. You'll explain why two fields are always external, and why a record with nothing not met is ready for the assessor, never closed. You'll run the kit's closure record and drift comparison on the day-one and day-thirty fixtures, with and without the exception registry. And you'll say what the drift check catches, and why Arc going offline needs an Arc snapshot with each run. Before you start, finish Module 8. The closure record reads the audit from Module 2 and the Arc snapshot from Module 3.

## Slide 4 — The five closure conditions

Unit 2 is the five closure conditions. The data platform book, Data Platform: SQL Server Identity, defines the transformation as complete when five conditions hold at the same time on every production instance. One: no usable Windows-backed principal, other than the break-glass group in the exception registry. Two: SQL Authentication eliminated. No SQL logins outside the registry, the S A account disabled and renamed, and SQL logins refused, which on SQL Server 2025 also needs is external authentication only set to one. Three: Entra authentication observed working, and nothing else: every usable login is an Entra type, the sign-in logs and SQL Server Audit show it, and there are no remote N T L M or Kerberos connections. Four: a cloud identity for the engine: the Arc agent connected, the SQL extension deployed, and Entra configured, which failover cluster instances don't support. Five: M F A for every human. None of them is a single engine setting. Login mode one proves only that SQL logins are refused.

## Slide 5 — The closure record, and what it can't settle

The kit's closure record shows eleven fields per instance, and each one is met, not met, or external. Fields the audit can't see are external joins: Entra sign-ins and audit, and M F A for every human, are always external. The record points at those logs and doesn't copy them. Condition four comes from the Arc snapshot, and is external without it. The exception registry names a login, an instance or a star for every instance, an approver and an expiry. The record is narrower than the book's field set in two places, so read those by hand: condition three checks login types but doesn't join them to the Entra inventory, and the protocol field reads one snapshot, not the whole validation period. An instance with nothing not met is ready for the assessor, with the external evidence. It's never closed. The book's Chapter 21, What Done Looks Like, names six live evidence sets that close the transformation: the compliance records, the Entra sign-in logs, the N T L M telemetry, the S A status report, the Conditional Access report and the exception registry.

## Slide 6 — Drift as a compliance finding

Unit 3 is drift. A drift event is a regression between two runs, and the book treats each one as a compliance violation, not an advisory signal. The kit's comparison returns a row for a new usable Windows or SQL login, an Entra login removed, S A re-enabled, SQL authentication accepted again, remote N T L M back after none, or an instance not seen before. It applies the exception registry, so the break-glass group isn't drift. The Arc agent going offline changes nothing in the audit, so the comparison reports Arc regressed only when you give it both runs' Arc snapshots. And a mode changed in the registry but not yet restarted is invisible, because the audit reads the running mode. Runbook R nine adds a registry check of login mode for that. Each row is a finding: open a task for it. The workbook Building Ticket-to-Machine turns a drift row into a typed task.

## Slide 7 — Try it: project day 30 onto the closure conditions

Try it. Lab 1 runs on the kit's fictional estate, with no tenant. Open PowerShell 7, go to the kit's folder, and make this run's results folder, named for the time you start. Step one projects day thirty onto the closure conditions. Sequel P R D oh one, migrated in Chapter 4, has nine fields met, none not met, and two external, so it's ready for the assessor, with the external evidence. The other three are open. Sequel P R D oh six fails SQL logins refused, although is integrated security only is one, because it runs SQL Server 2025 and is external authentication only is zero. Sequel F C I oh four is a failover cluster instance. It can't take Entra authentication as built, so it needs a re-platform or a dated exception. The last line names the evidence: C A seven, C M six and A C two.

## Slide 8 — Try it: one instance's record, and the registry

Step two reads sequel P R D oh one's whole record. Every field the audit can settle is met. The two external rows are condition three's Entra sign-ins and audit, and condition five's M F A for every human. They're evidence sets two and five of the book's Chapter 21: the Entra sign-in logs and the Conditional Access report. Step three reads the exception registry. The break-glass group is excepted on every instance, with no expiry, approved by the authorizing official. The vendor login on sequel F C I oh four has a date: June 30, 2027, approved by the I S S O.

## Slide 9 — Try it: see what the registry does

Step four shows what the registry does. It builds the same instance's record with no exception registry and no Arc snapshot, and lists every field that isn't met. Without the registry, sequel P R D oh one's enabled break-glass group fails conditions one and three: it's a usable Windows login, and it isn't an Entra one. Without the Arc snapshot, all three fields of condition four become external. Nothing about the instance changed. Only what the record was given.

## Slide 10 — Try it: compare day 1 with day 30

Step five compares day one with day thirty, with the exception registry applied. One row comes back: a Windows user, contoso J doe, added to the sys-admin role on sequel P R D oh six. That's a new legacy login, and a compliance finding: open a task for it. The break-glass group is in both runs and in the registry, so it isn't drift. Notice what this run wasn't given: either run's Arc snapshot, so it doesn't read Arc at all.

## Slide 11 — Try it: the manifest, the tests and your runs

Step six opens the drift manifest. It records the step, drift; its mode, read-only; the snapshot's date; the controls, C A seven and C M six; the K S Is to line up with; and the S H A two fifty-six of each file it wrote. Step seven runs this chapter's tests: eight pass, none fail. Step eight lists your runs, one line per run. There's nothing to clean up. The kit's folder is as you unzipped it, and this run's results stay in the run folder. Check your work: you can say why sequel P R D oh one is ready for the assessor but not closed, why sequel P R D oh six fails SQL logins refused, and why the new sys-admin login is drift while the break-glass group isn't.

## Slide 12 — Lab 2: schedule the runs against a test instance

Lab 2 schedules the same runs against one test instance. It wasn't run by the authors. You need a test job host and a test instance, never production, and a group managed service account on the host. Its Windows login on the instance holds the read rights the audit exporter states, never sys-admin, and it's recorded in the test exception registry with an approver and an expiry. Write a run script that takes one audit snapshot, projects it onto the closure record, and compares it with the previous run. Run it once by hand, then schedule it weekly as the group managed service account. The runs are read-only. For condition four, someone with Reader in commercial Azure exports an Arc snapshot before each run, because the service account can't sign in to Azure. Step five backs it out by removing the scheduled task. The run folders stay as evidence, inside your boundary.

## Slide 13 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 9 maps the closure record to three NIST SP 800-53 controls: C A seven, continuous monitoring; C M six, the authentication settings, read every run; and A C two, which accounts can sign in. It maps the drift comparison to C A seven and C M six. Keep the closure file and its manifest per instance per run, the exception registry with its approvers, and the external evidence each external field names. For drift, keep the drift file, its manifest, and the task opened for each row. Each manifest records the step, its controls and K S Is, and the S H A two fifty-six of each file. Runbook R nine lists the evidence for the evidenced and operated control states. K S Is are FedRAMP twenty X indicators for cloud service providers: your cloud providers report against them, the agency doesn't. The records support these controls; the assessor decides whether the closure posture holds.

## Slide 14 — Check yourself: two questions on closure

Check yourself with two questions. First: sequel P R D oh one's day-thirty record has nine fields met, none not met, and two external. What does the kit call it? The answer is b: ready for the assessor, with the external evidence. The two external fields still need their evidence, and the assessor decides. Second: sequel P R D oh six has is integrated security only set to one, yet SQL logins refused is not met. Why? The answer is a: it runs SQL Server 2025, and is external authentication only is zero. The module page has two more questions, each linked to the section that answers it.

## Slide 15 — Summary: closure that keeps coming back clean

To sum up. You projected an audit run onto the five closure conditions, saw which fields wait on evidence from outside the audit, saw what the exception registry and the Arc snapshot change, and compared two runs so a regression became a finding. Closure is the record that keeps coming back clean on a schedule, and each drift row is a task. Before shipping, work through the Chapter 9 checklist. Next, Module 10: deploying to test and production.
