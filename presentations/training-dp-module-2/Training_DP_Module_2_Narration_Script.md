# Data Platform and SQL Server Identity learning path — Module 2: The Authentication Audit — narration script (practice copy)

## Slide 1 — Module 2: The Authentication Audit

Welcome to Module 2 of the Data Platform and SQL Server Identity learning path: the authentication audit. It teaches Runbook R oh three, with Chapter 2 of the developer workbook, Building SQL Server Identity. Module 1 decided which instances survive. Now you measure how each survivor authenticates.

## Slide 2 — Why every later step depends on the audit

Why does this matter? For each instance that survived the gate, the audit records its authentication mode, every usable login by type, the state of the S A login, and the account the engine runs as. Every later step, Arc, login migration and N T L M elimination, depends on that record. And it's re-run after every change, to measure progress. In this module you audit four fictional instances, rank their findings, and rerun the audit thirty days later. Runbook R oh three is read-only from start to finish.

## Slide 3 — What you'll be able to do in Module 2

Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll explain what the audit reads on each instance, and why it runs only on what Module 1 retained or chose as a target. You'll rank the audit's findings, from an enabled S A down to the Arc-eligibility category. You'll say what each Arc-eligibility category means for the next step, and why engine Entra authentication doesn't wait for O S level Entra sign-in. And you'll explain why a single audit run can't show drift, and where the engine's service account goes. Before you start, finish Module 1.

## Slide 4 — What the audit reads on each instance

Unit 2 is what the audit reads. It runs only on instances classified retain or consolidation target. For each, it reads the authentication mode, and enumerates the logins from the server principals view by type: Windows users, Windows groups, SQL logins, logins mapped to a certificate or an asymmetric key, and the Entra types, E for a user or application and X for a group. It flags the S A account, and captures the engine's service account and its S P N. The running mode and the registry login mode are read in different places, and a change takes effect only after a restart, so the two can disagree. The kit reports that as a mode anomaly. And watch for this: a reader without the right permissions gets a short login list and no error. A short list means a missing permission, not a clean instance. The kit's census leaves out built-in principals, and counts only usable logins.

## Slide 5 — The findings, ranked by severity

The audit returns one row per finding, with a severity from the data platform book's chapter, The Authentication Audit. Highest is S A enabled: the login whose security identifier is oh x oh one is enabled, whatever its name. Critical is any other usable SQL login. High is mixed mode, where SQL authentication is accepted, and a mode anomaly, where the registry disagrees with the running mode. Medium is the engine running as a domain user account or a built-in account, and an S A that's disabled but keeps its name. And at the bottom, an information row for each instance's Arc-eligibility category. The kit's audit script writes the census and the findings, each as a C S V and a jay-son file, and one manifest that hashes all four. A disabled login still counts as existing: Chapter 9's closure record decides when it's gone.

## Slide 6 — The Arc-eligibility categories, and the engine's account

Unit 3 is reading the audit. Its most consequential output is the Arc-eligibility category. Category 1 is ready for Entra logins now. Category 2 needs Arc deployed and Entra authentication configured first. Within it, instances with many Windows logins, active SQL logins or missing S P Ns go first. Category 3 is a version before SQL Server 2022, or a failover cluster instance on any version, and must upgrade, re-platform or carry a dated exception. Engine Entra authentication, Layer 1, proceeds on a domain-joined host, and never waits for O S level Entra sign-in, Layer 2. The kit settles only the first pass here, Category 3 or "1 or 2"; Module 3 settles the rest. And the audit names the engine's service account and stops. Converting a user account used as a service belongs to the service account guide.

## Slide 7 — What each category asks of you

What does each category ask of you? The data platform book's chapter, Reading the Audit, takes them in turn. For a Category 1 instance, nothing in the infrastructure remains to be built: the audit has done its job when it delivers a precise login inventory. For Category 2, the Arc deployment is a server-level action, not a SQL Server change. The agent connects the server, and Arc installs the Azure extension for SQL Server automatically. Once Entra authentication is configured on the instance, the next audit re-classifies it to Category 1. A Category 3 instance has two paths: upgrade the engine to SQL Server 2022 or later and follow the Category 2 path, or document a formal exception with a sunset date. A failover cluster instance re-platforms to a standalone instance or an availability group. And mind the program's N T L M backstop, April 1, 2027. A Category 3 instance's remaining N T L M connections fail then, whether it's excepted or not. Its Kerberos connections don't.

## Slide 8 — When the audit degrades instead of failing

Runbook R oh three's audit script degrades rather than crashing, so know what each state means. If the Active Directory module is absent, S P N discovery is skipped: only the hosts you name are audited, and orphaned logins can't be checked. If the domain controller is unreachable, the S P N query returns nothing, so target a reachable one. If a host can't be reached for its service details, the service-account fields stay unknown for that host. If the SQL connection fails, the instance is recorded as query failed, with an empty login inventory, rather than aborting the run. And a T C P timeout is recorded as timeout, as opposed to yes or no. An empty or unknown field is a state to read, not a clean result.

## Slide 9 — Try it: make the run's folder, read the instances

Try it. Lab 1 runs in PowerShell 7 on the kit's fictional estate, with no instance and no tenant. Go to the kit's folder, and make this run's results folder, named for the time you start, so running the lab again never overwrites a run. Step one reads the four audited instances. Only the instances Chapter 1 retained are audited. Look at sequel P R D oh one: it runs in mixed mode, zero, while its registry says Windows only, one. Sequel F C I oh four is clustered, and its registry says mixed. Three of the four engines run as domain user accounts, the S V C accounts in the contoso domain. And sequel P R D oh six, on SQL Server 2025, runs as a group managed service account, whose name ends in a dollar sign.

## Slide 10 — Try it: run the audit

Step two runs the audit. First the census: one row per instance, with usable logins counted by type, and disabled ones counted separately. Then the findings. Sequel P R D oh one has the full set: S A enabled, highest; a usable SQL login, payroll report, critical; mixed mode and a mode anomaly, both high, because the mode was changed without a restart; and a service account that's a user account with a password, medium. The cut rows give sequel F C I oh four almost the same list, with its own usable SQL login, vendor H R app. That login has a dated exception, but the audit reports it anyway; Chapter 9's closure record applies the exception. Sequel F C I oh four is Category 3, as a failover cluster instance. Sequel P R D oh two has only its service-account finding and its category. Sequel P R D oh six already has Entra logins, runs as a group managed service account, and has no finding but its category. The last line names the evidence: A C two, I A five and C M six.

## Slide 11 — Try it: open the manifest, count by severity

Step three opens the manifest: four files, three controls and three K S Is, with each file's hash. The run was read-only. Step four counts the findings by severity: two highest, the two enabled S A logins; two critical, the two usable SQL logins; three high; three medium, the three service accounts; and four information rows, one category per instance.

## Slide 12 — Try it: rerun the audit on day 30

Step five reruns the audit on day 30. Sequel P R D oh one has moved to Entra logins. Its S A, renamed, a Windows login and payroll report are disabled, so disabled is three. Its two superseded Windows groups were denied connect SQL instead, so they leave the usable count without being counted as disabled. Nothing was dropped, and only its service-account finding and category remain. Now look at sequel P R D oh six. Its Windows user count went from zero to one, and no finding says so. A single audit doesn't compare runs; Chapter 9's drift check does. Step six runs this chapter's tests: six pass, none fail. Step seven lists your runs. There's nothing to clean up: the results stay in the run's own folder.

## Slide 13 — Lab 2: audit a test instance's snapshot

Lab 2 runs on your own test instance. It hasn't been run by the authors. You need a test SQL Server instance, never production, PowerShell 7 with the SQL Server module, and read permissions granted for the lab only. Never sysadmin. Check the reading login's own permissions first. Then export a SELECT-only audit snapshot, and compare its login count with one the instance's administrator trusts: a short list means a missing permission. Then audit it. Nothing on the instance changes. To back it out, delete the audit run, and have the administrator remove the lab's grants. Keep the snapshot if you go on to Module 3's Lab 2.

## Slide 14 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 2's table maps the audit to three controls in NIST SP 800-53. The login census supports A C two, Account Management, with the census files and the manifest as evidence. The S A, SQL login and service-account findings support I A five, Authenticator Management. And the mode findings support C M six, Configuration Settings. Runbook R oh three is read-only from start to finish, and its output feeds continuous-monitoring closure. K S Is are FedRAMP twenty X indicators for cloud service providers: the agency lines its own evidence up with them. The run's files provide evidence for each control; the agency still sets its parameters, and the assessor decides.

## Slide 15 — Check yourself: two questions on the audit

Check yourself with two questions. First: which finding does the audit rank highest? The answer is b: S A enabled. Second: on day 30, sequel P R D oh six has gained a Windows login. What does the day-30 audit say about it? The answer is a: nothing. A single audit doesn't compare runs; Chapter 9's drift check does. The module page has two more questions, each linked to the section that answers it.

## Slide 16 — Summary: measure how each survivor authenticates

To sum up. You learned what the audit reads on each surviving instance, how its findings rank, and what each Arc-eligibility category means for the next step. You audited four fictional instances, and saw why one audit run, on its own, can't show drift. The evidence an I S S O keeps from this module is the run folder, the census and findings files, and the manifest holding each file's hash. Before shipping, work through Chapter 2's checklist. Next is Module 3, Arc and the engine's identity.
