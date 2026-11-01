# Microsoft Automation learning path — Module 2: Microsoft Entra ID through Microsoft Graph — narration script (practice copy)

## Slide 1 — Module 2: Microsoft Entra ID through Graph

Welcome to Module 2 of the Microsoft Automation learning path: Microsoft Entra ID through Microsoft Graph. The Federal Modernization Workbook's Book 02 builds the Entra ID target, and Book 04 puts access behind Conditional Access, PIM and application governance. Both ask for evidence a script can collect. In this module you'll map each of those evidence questions to the Graph API that answers it, its least-privileged permission, and the shape of its data. Then you'll run five read-only checks, in Python and PowerShell, against a fictional tenant. They're illustrative: unit-tested against fixtures, not proven against live tenants. Module 1's foundations, the right cloud, sign-in without a secret, and paging, apply throughout.

## Slide 2 — Why script the evidence your ISSO asks for

Why script it? Your ISSO asks the same questions every month. Who hasn't signed in? What do the Conditional Access policies say? Who holds a privileged role permanently? Which applications still have passwords? And who can't yet use phishing-resistant multifactor authentication? Too often, someone answers by clicking through the admin center and pasting screenshots, and the answer can't be reproduced next month. In this module each question becomes a Graph call with a least-privileged permission, and five of them become read-only checks you can rerun on a schedule, with output an assessor can diff from one month to the next.

## Slide 3 — What you'll be able to do in Module 2

Here's what you'll be able to do by the end of this module, which takes about ninety-five minutes with the lab. You'll name the Graph API and least-privileged permission for each of the books' evidence questions. You'll read sign-in activity, group membership, Conditional Access, PIM schedules, application credentials and registration details, and know the trap in each. You'll explain why a script checks Entra's logs but doesn't keep them. You'll say what differs in GCC High and DoD. And you'll run the five checks and read each finding against its ScubaGear policy. You need Module 1 first. Lab 1 needs no tenant; Lab 2 needs a test tenant with Entra ID P1 or P2.

## Slide 4 — Evidence questions mapped to Graph APIs

Here are six of the module's sixteen evidence questions, with the Graph call and the least-privileged application permission for each. Who signed in, and when: list users with sign-in activity selected, which needs User dot Read dot All plus AuditLog dot Read dot All. Who's in a group, nested groups included: transitive members, with GroupMember dot ReadBasic dot All. What the Conditional Access policies say: Policy dot Read dot All. Who holds a role now: the role assignment schedules. Which applications have secrets or certificates: Application dot Read dot All. And who registered which authentication methods: the registration details report. Every one of these is generally available in Graph version one point oh, and each page lists it in the global service, which GCC uses, and in the GCC High and DoD clouds.

## Slide 5 — Sign-in activity and membership: the traps

Sign-in activity is how a script finds dormant accounts, and it has traps. Use both dates, the interactive and the non-interactive sign-in, because Microsoft notes some users reach resources only through clients. It needs Entra ID P1 or P2 and the AuditLog dot Read dot All permission. Selecting it caps the page at five hundred users. And it's returned only when you name it in select. For groups, transitive members is effective membership, nested groups included; members is direct only. The transitive call costs five resource units against three. The basic membership read permission is enough, and members of a type you can't read come back with only an ID and a type. For change tracking, the users delta call follows Module 1's pattern.

## Slide 6 — Conditional Access: read it with one permission

Conditional Access is the easiest read in the module: it needs only Policy dot Read dot All. Each policy's state is enabled, disabled, or enabled for reporting but not enforced, which is report-only. Book 04's rollout depends on knowing which policies are report-only; its phishing-resistant policy for everyone starts that way. The collector reads. The ca-export check writes one sorted JSON file per policy, so any change shows up as a readable diff between two exports. Writing is different: creating a policy needs the Conditional Access read-write permission too. Book 04 keeps the policies as code, so as design guidance, a pipeline holds the write permission and the evidence collector holds only the read.

## Slide 7 — PIM: eligible, active, and permanent active

Privileged Identity Management's current APIs are under role management slash directory, and two schedules matter. Eligibility schedules say who may activate a role. Assignment schedules say who holds it now. The assignment type is Assigned for a direct assignment, or Activated for an activation, and the member type says whether it's direct, through a group, or inherited. An assignment's end is in its expiration, whose type can be no expiration. Put those together: an Assigned schedule with no expiration is permanent active, which ScubaGear's policy seven point four forbids for highly privileged roles. Role template IDs are stable; Global Administrator's is on the slide. Changes need a read-write permission, which the collector never asks for.

## Slide 8 — Application credentials against three ScubaGear rules

An application's secrets and certificates each carry a start and an end date, in U T C, and those dates are enough to test ScubaGear's three application rules: no application passwords, passwords valid for at most a hundred eighty days, and certificates valid for at most three hundred sixty-five days. Microsoft's app management policies enforce the same limits going forward; the check finds what existed before they were turned on. Two related reads support consent review: who has been given an application's roles, and which delegated permissions have been consented, which needs Directory dot Read dot All.

## Slide 9 — Logs, retention, and authentication methods

Logs first. Directory audits and sign-ins both need AuditLog dot Read dot All, and the Conditional Access policies applied to a sign-in show up only for callers allowed to read Conditional Access data. Entra keeps audit and sign-in logs for seven days on the free tier and thirty days with P1 or P2. That's why ScubaGear requires sending the logs to the security operations center. A Graph script checks logs; it doesn't keep them. Authentication methods: the registration details report gives one row per user, with MFA registration, admin status, user type and the methods registered. One caution: Microsoft documents the method names only by example, so a count of phishing-resistant users has to choose which names to count, and should be confirmed against a real report.

## Slide 10 — The five checks, and a reader's permissions

Five of those reads are built as checks. Stale-users lists enabled members with no sign-in of either kind in ninety days, and never-signed-in accounts older than that. Ca-export writes every policy as sorted JSON with counts by state, evidence for ScubaGear's Conditional Access settings. Pim-report counts Global Administrators and lists every permanent active assignment to a role you name as privileged, for policies seven point one and seven point four. App-credentials lists every secret and certificate with its lifetime and days to expiry. And mfa-registration counts members without MFA or without a phishing-resistant method, and names administrators without one. The permissions for all five are a reader's set. None of them can change the tenant, and you grant only the ones for the checks you run.

## Slide 11 — Try it: find permanent privileged assignments

Try it. In the lab, you run each check against a fictional tenant with the from-json option, which evaluates a saved Graph response instead of calling Graph. Here's step three: the PIM report, with the Privileged Role Administrator role added. Global Administrator is always included. The fixture has three Global Administrators, which is within two to eight, so policy seven point one passes. But two principals hold privileged roles permanently, with no expiration, so policy seven point four fails. The PowerShell function returns exactly the same JSON, and the Pester tests compare every PowerShell check with the Python results, so the two can't drift apart. The lab runs all five checks this way.

## Slide 12 — Lab 2: run the checks read-only in a test tenant

Lab 2 runs the same checks read-only against your own test tenant, worldwide or GCC, never production, with Entra ID P1 or P2 for sign-in and PIM data. Register one app in the tenant's own cloud with a certificate, and grant only the read permissions for the checks you run; the module lists them per check, straight from graph-calls dot JSON. Run each task in Python, or connect in PowerShell and run the same task there. The client checks the token first: a missing permission stops the run before any Graph call, and an extra one prints a warning. Compare each result with the admin center. Then back it out: remove the permissions, delete the app registration and its certificate, and delete the saved output, which holds user names and policies. The authors haven't run Lab 2.

## Slide 13 — Where agencies are: Entra ID in GCC High and DoD

Where are agencies? Most on this path run a GCC tenant synchronized from Active Directory, with some Conditional Access policies still report-only, permanent role assignments left from before PIM, and applications that still hold secrets. The APIs are the same in GCC High and DoD; the endpoints differ, and so do some features. Microsoft's U S Government feature table lists Conditional Access, PIM, access reviews, entitlement management and Lifecycle Workflows as available, HR-driven provisioning as partial, and two features as not available. GCC uses the commercial Entra service, so the table doesn't apply to it. One Azure Government difference matters for the export: multifactor authentication's Trusted IPs isn't supported there, so network-based exceptions live in Conditional Access named locations. The interim paths are on the right.

## Slide 14 — The federal requirement and evidence for Entra ID

The federal requirement. BOD 25-01 makes ScubaGear's mandatory Entra ID policies required for in-scope tenants, with continuous reporting to CISA. Four of the checks produce evidence for those: the Conditional Access settings, the Global Administrator count, permanent privileged assignments, and phishing-resistant registration. In NIST special publication eight hundred fifty-three terms, that's account management, A C two; least privilege for privileged accounts; multifactor authentication; and continuous monitoring. M-22-09's phishing-resistant requirement is what the registration check measures progress toward. Book 02's Appendix A has which policies are mandatory, and the mapping. The evidence an ISSO keeps: each check's dated output with the app's permissions, the Conditional Access export in Git, and the findings with the change records that closed them.

## Slide 15 — Check yourself: two questions on Entra ID

Check yourself with two questions. First: an Assigned role schedule has an expiration type of no expiration. What is it? The answer is b: it's permanent active, which ScubaGear forbids for highly privileged roles. Second: why doesn't a Graph script replace sending the logs to the security operations center? The answer is a. Entra keeps audit and sign-in logs for seven days on the free tier and thirty days with P1 or P2, so the record has to be kept somewhere else. The module page has three more questions, each linked to the unit that answers it.

## Slide 16 — Summary, and next: Module 3, Intune

To sum up. You mapped the books' Entra ID evidence questions to Graph APIs and their least-privileged permissions. You learned the traps in sign-in activity, group membership, PIM schedules, application credentials and registration details. You saw why a script checks Entra's logs but doesn't keep them, and what differs in GCC High and DoD. And you ran the five checks in Python and PowerShell. Book 04's Chapter 10 assembles the evidence package for a period. Next is Module 3, Intune through Microsoft Graph: devices, compliance, configuration and Autopilot, which APIs are only in beta, and five checks mapped to NIST special publication eight hundred fifty-three Moderate.
