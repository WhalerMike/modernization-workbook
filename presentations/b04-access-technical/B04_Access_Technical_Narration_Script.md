# Book 04 — Access & Privilege — technical deep dive — narration script (practice copy)

## Slide 1 — Access & Privilege: The Technical Deep Dive

Welcome. This is the technical deep dive for Book 04 of the Federal Modernization Workbook, Access and Privilege. The short briefing made the argument. This session is for the people who build and run it: identity engineers, architects, and the security and assessment staff who have to prove it works. It comes in five modules, and each one stands on its own, so you can watch it in parts. After a short orientation, we'll cover the Conditional Access policy library, then rollout, exclusions and break-glass accounts, then PIM self-request with approval, then access governance, and finally access as code and the evidence it produces. Every fact comes from a footnoted chapter of the book. The code and JSON stay in the book; the slides carry the design.

## Slide 2 — Every access decision is a policy decision

Start with why, because every design choice that follows comes from it. OMB M-22-09 says federal applications can't rely on the network perimeter. Every request for access should be evaluated, and an active session should be evaluated continuously. NIST's zero trust architecture adds the shape: no trust from network location, access per session, decided by dynamic policy, with deciding kept separate from enforcing. The program maps that onto Entra ID. Conditional Access is the policy engine, token issuance carries the decision out, the applications and gateways are the enforcement points, and Continuous Access Evaluation covers the active session. That mapping is the program's interpretation, not one Microsoft or NIST publishes. But it's why this session treats a Conditional Access policy as the unit of access control.

## Slide 3 — How Conditional Access computes the decision

Now the mechanism, because Conditional Access doesn't work like Group Policy, and Group Policy habits cause predictable mistakes. There's no precedence. Every policy that applies must be satisfied, the policy numbers are labels, not an order, a block wins, and exclusions are absolute. The rule that does the most damage is the default: if no policy applies, a token is issued. So a policy that makes Finance users use strong MFA for Payroll says nothing about anyone else, and a non-Finance user gets a Payroll token with no controls at all. Restricting a resource takes two policies, a grant for the population and a block for everyone else. And Conditional Access runs after the first factor, so it's no front-line defense against password spray. With that model in place, on to module one.

## Slide 4 — Module 1 — The Conditional Access policy library

Module one is the Conditional Access policy library. The chapter's test for a finished library: every sign-in in the tenant meets a policy that someone owns, and nothing depends on another policy running first. We'll cover numbering, personas, the five enforcement waves, and the BOD 25-01 answers.

## Slide 5 — One library, numbered once

The library is one policy set, numbered once. The baseline Book 02 builds during the migration keeps its numbers, Book 04 adds the policies for risk, privileged workstations, segmented applications and workload identities, and there's one permanent report-only probe. A retired number is never reused, and every name reads the same way: number, population, resource, then control, so you can read a policy on a call without opening it. The prerequisites matter more than people expect. Missing ones are the most common reason a report-only policy shows failures that aren't real: the emergency access group, the persona groups, named locations, a custom phishing-resistant strength, and device and application tags. And every policy is created in report-only first. Next, who those policies reach.

## Slide 6 — Personas decide who each policy reaches

Policies target populations, never people, and the populations are personas, kept identical to Book 02. Admins carry the most risk and get the strictest policies. Internals are employees and contractors. Externals are partner guests, Guests are everyone else from outside, and workload identities are service principals, which have to be assigned to a policy directly, not through a group. And break-glass, the two emergency accounts, are excluded from every enforced policy. Here's the failure mode that shapes the design. Persona groups are built from attributes, so a user with an empty attribute falls outside every policy that includes only that group. That's an exclusion nobody approved. So the library includes all users, excludes narrowly, and adds a deliberately redundant catch-all: MFA for all users on all resources.

## Slide 7 — Five enforcement waves, CA001 to CA090

The library is enforced in five waves, each closing a class of risk. Wave one is the foundation, and anyone already on modern clients won't notice it. It blocks legacy authentication, after at least two weeks of hunting down remaining clients like multifunction devices that send mail. It also stops an attacker with a password from registering their own MFA method, and blocks the flows used in device-code phishing. Wave two is administrators: phishing-resistant strength, compliant devices, trusted locations, and admin portals reachable only from privileged workstations. Wave three is the one users notice, the workforce MFA baseline, managed devices, partners and guests, and the catch-all. Wave four is risk and workloads. And wave five is the end state: phishing-resistant MFA for every member.

## Slide 8 — Why the library looks like this: BOD 25-01

Why does the library look this way? Much of it answers CISA's BOD 25-01, which requires federal civilian agencies to implement CISA's mandatory configurations for in-scope cloud tenants, with a deadline of June 20, 2025 for the first set. The table maps each Entra ID item to the policy that meets it, from blocking legacy authentication to phishing-resistant MFA for everyone. One conflict is worth understanding. Book 02 adopted Microsoft's current advice for high-risk users, require risk remediation, but the directive says block them, and when both apply, block wins. So in a tenant within the directive's scope, high-risk users are blocked and recovered through the help desk. Last, Microsoft creates some policies itself and turns them on later, so the program records a decision for each: adopt or supersede.

## Slide 9 — Module 2 — Rollout, exclusions and break-glass

Module two is getting the library into production safely. A policy that targets all users can lock out the whole organization, administrators included. So this module covers the gates, reading report-only and rolling back, governed exclusions, break-glass accounts, and what the logs must show.

## Slide 10 — Every policy passes the same gates

Every policy, in every wave, passes the same gates. First report-only for two to four weeks, while impact and gaps are reviewed. Then a two-week pilot with IT and security staff. Then expansion ring by ring, and finally steady state, enforced and monitored. Inside that runs a seven-step cycle: check the prerequisites, create the policy in report-only, measure for at least a week, fix the causes rather than adding exclusions, get owner approval as change evidence, enforce ring by ring, and watch each ring for forty-eight hours. Turning an all-users policy straight from off to on is never allowed. And the readiness gates are measured numbers, not estimates: ninety-five percent of users ready for the policy's strength, and ninety percent of devices enrolled and compliant.

## Slide 11 — Reading report-only, rolling back without deleting

Report-only is a policy state, not a test environment. The policy is evaluated at every sign-in and the result is logged, but nothing is enforced. There are four results. Success means the controls were already satisfied. Failure means a block would have happened. User action required means the user would have been prompted. And not applied means the conditions didn't match, often because the user is excluded. To change an enforced policy, make a report-only copy, compare the two, then update the original. Rollback has four sizes, from reverting one policy to report-only up to setting a whole wave back and opening an incident. What's never on the list is deletion, because it breaks the policy's change history. And if the tenant locks out entirely, an emergency account reverses the change.

## Slide 12 — Exclusions are governed objects

An exclusion overrides everything, so each one is a standing hole in policy, and they pile up the way Group Policy exceptions did. That's why the program treats every exclusion as a governed object. The only permanent one is the emergency access group. Every other exclusion is tied to one policy and one reason. Approved travel, for example, lets a traveler past the country block for at most fourteen days, granted through PIM after an approved request. The rules apply to all of them: an exclusion is a group, never a named user, and it has an owner, a reason, an expiry and a review. Test the exclusion, not just the policy. And remember the quieter failure, an empty attribute that drops someone out of a dynamic group nobody meant to exclude.

## Slide 13 — Break-glass: the one standing exception

Every control that blocks an administrative path also creates a way to lock the agency out of its own tenant. Emergency access accounts, break-glass, are the answer, and they're the only standing privilege the program accepts by design. There are at least two, cloud-only, not tied to any one person, holding permanent Global Administrator, and signing in with a passkey or certificate. A password in a sealed envelope no longer works, because Microsoft's mandatory MFA now applies to the admin portals. They're excluded from every restrictive policy, and every use is a critical incident until it's reviewed. They're tested at least every ninety days, and because NIST expects such accounts to disable automatically, the security plan records a documented deviation. And they exist before any approval is switched on.

## Slide 14 — Monitoring: what the sign-in logs must show

Once policies are on, the sign-in logs are the instrument. The chapter gives the queries in full, but they're illustrative and haven't been tested against a production workspace, so check them against your own data before you rely on them. Six signals matter. Per-policy results, blocked sign-ins, the users who would still fail the end-state policy, which drives the enrollment campaign, any legacy authentication still in use, successful sign-ins that no policy touched, and emergency account use, which should be zero outside testing. Then drift. The policies in the tenant must match the policies in source control, and any change outside the pipeline raises an alert, especially a change to the emergency group. Protected actions narrow who can cause drift at all. Module three builds them.

## Slide 15 — Module 3 — PIM self-request with approval

Module three is Privileged Identity Management, self-request with approval. An eligible role is only as safe as the moment it turns active. That moment needs fresh proof, a reason, a second person, and a record that outlives the audit window.

## Slide 16 — Eligible, requested, approved: the activation gate

Self-request has two layers. One asks whether a person may ever hold a role; that's eligibility, decided in entitlement management. The other asks whether they may use it right now; that's activation, decided in PIM. This module builds the second layer, because it leaves a per-use, time-bound, justified record of privileged use, which is what assessors test against. Eligibility without an activation gate is standing privilege through a nicer front door. The flow is simple. The admin requests activation with a reason and a ticket, signs in fresh with a phishing-resistant method, and an approver from outside their tier decides. Undecided after twenty-four hours, it lapses. One dependency people miss: if the license lapses, eligible assignments and PIM settings are removed, so keep the role inventory exported.

## Slide 17 — Activation controls, set per role and by tier

PIM settings are set per role, and the program sets them by tier. Tier 0, the control plane, gets four-hour activations, a fresh strong sign-in, a ticket, and approval from the Tier 0 group. Tier 1 gets eight hours, and lower tiers progressively less ceremony. Now, what the controls really do, because older guides got several wrong. The activation maximum is your exposure window, so keep it short. The plain MFA-on-activation setting may not prompt at all if the user signed in strongly earlier, so every role uses an authentication context instead. Ticket numbers are recorded but never checked. And the assignment rules close the side door: no permanent assignments, except Global Administrator for the emergency accounts, so nobody can bypass the gate by being made permanently active.

## Slide 18 — Build it in order: emergency access first

Order matters here more than anywhere. Step zero can't be skipped or moved: switching on approval before the emergency accounts exist is the one sequence that can lock an agency out of its own tenant, and Microsoft documents it. If every top role needs approval and no approvers are configured, nobody can approve. So build the emergency accounts first, then named approver groups for every tier. Next comes the authentication context and its Conditional Access policy, which must exist and be switched on before PIM can use it. Then apply the role settings, and convert standing assignments by creating the eligible one first, confirming it works, and only then removing the active one. Finally, protected actions guard editing policies themselves, which PIM alone doesn't cover.

## Slide 19 — Approvers, alerts and the record PIM leaves

The approval engine shapes the design. Approvers don't need a role, nobody can approve their own request, and service principals can't approve at all. From that come the separation rules. A tier's approvers aren't in that tier's eligible population, or approval turns into mutual sign-off. Keep at least two approvers per tier, held as governed groups, and require the approver's own justification, so the record holds a decision, not a click. The most important alert is a role assigned outside PIM, because that assignment never met the gate. The approval window is a fixed twenty-four hours, so out-of-hours emergencies use the emergency procedure, not a workaround. PIM history keeps thirty days, so export it before go-live. And the legacy beta API stops returning data on October 28, 2026.

## Slide 20 — Module 4 — Access governance

Module four is access governance. Conditional Access decides whether a session may proceed, and PIM whether a role may be active. Neither decides whether a person should still hold last year's access. Requests, reviews and lifecycle events close that gap without a ticket.

## Slide 21 — Access packages: who requests, who approves, how long

Entitlement management turns access into requests that someone approves and that end on a date. A catalog holds the resources for one business domain, an access package bundles them, and a policy says who may request, who approves, and when it expires. The approval chain follows the application's risk tier. Low-risk access goes to the manager and lasts a year, while the most sensitive tier adds a second stage with the identity governance office and expires in ninety days. External users get a stricter policy, and nothing ever lasts forever. Underneath, applications are assigned to groups, never users, and nested groups are prohibited, because only direct members get access. And privileged roles arrive through PIM eligibility, never through a package. Next, keeping those grants honest over time.

## Slide 22 — Reviews on a calendar, removals by default

Access reviews are recurring proof that each person still needs what they hold, on a schedule set by risk: privileged roles monthly for Tier 0, sensitive application groups quarterly in two stages, lower tiers less often, and guests quarterly by their sponsors. Four rules make reviews bite. Review the groups, not the applications, because reviewing an application doesn't remove the people who get access through its groups. Add a fallback reviewer for users with no manager. Choose the no-response default on purpose: remove access where an unreviewed grant is the bigger risk, like privileged roles and guests, and escalate instead for business applications, where a mass removal would stop work. And require a justification on every decision. Review history only stays downloadable for thirty days, so export it straight away.

## Slide 23 — Lifecycle events and guest access

The third mechanism is lifecycle events. The HR-driven lifecycle itself belongs to Book 03; this chapter covers only the workflow tasks that change access. A joiner gets access through packages, never a direct add. A move is a re-derivation, not an extra grant: the old department's access goes, the new department's arrives, and anything left over goes to review. A leaver loses every package, every group, and their refresh tokens. An inactivity workflow catches accounts whose HR record never produced a leaver event. Guests are where unreviewed access piles up fastest, because nobody's HR record ends when a partner project does. So guests arrive through a package with a sponsor and an expiry. All of this needs Entra ID Governance licensing for the whole workforce, or some people stay ungoverned.

## Slide 24 — Module 5 — Access as code, and the evidence

Module five is access as code, and the evidence it produces. A policy that exists only as portal clicks can't be diffed, reviewed or replayed, so it can't be assessed. So every decision gets a source of truth, a pipeline, and a monitor.

## Slide 25 — One file per object, one writer per class

Every access object the program governs has a file in the repository, one per object, and the safety rules travel with the files. Every policy excludes the emergency group, every package has an expiry, and leaver workflows revoke refresh tokens. Several tools can manage those objects, and they all end in Microsoft Graph. They differ in coverage, and the slide shows the gaps. The program's reference choice is Microsoft365DSC as the writer, because it's the only declarative tool that covers every class. It's a community project, so pin its version and read the release notes. A team already invested in Terraform can use it where it covers. The rule that matters is one writer per object class, recorded in the repository, with drift detection running alongside it.

## Slide 26 — Change control, and closing drift at the source

The repository is the only normal path to production, and six change-control rules make that true. Two people per change, with a security approver for Tier 0 objects. Automated checks before merge. Report-only first, then enabled in a second change that cites the impact review. A pipeline identity with no secret, treated as Tier 0, because it can change every policy in the tenant. Emergency portal changes back-ported within one business day. And rollback as a revert, so it leaves the same record. Drift detection catches what code can't stop, since a Global Administrator can still change the tenant directly. The monitor's results expire, so export them before changing a baseline. Every drift is either redeployed or back-ported, and drift on a Tier 0 object is a security incident.

## Slide 27 — What the assessor reads

Configuration evidence proves a setting existed. Operational evidence proves it did its job. An assessor needs both, for the whole assessment period, not just the day of the visit. The table maps each control family to what meets it and what proves it. Account management, for example, is met by packages, reviews and workflows, and proven by their run history, not by the configuration alone. Retention is only met by the export, and the test is an activation still queryable after thirty-one days. Under FedRAMP 20x, the same records support the identity and change-management indicators. And the honest limits: a correct policy file says nothing about whether reviewers read what they approved, native retention is short, and tool coverage moves. This is a design-intent mapping, not an assessment result.

## Slide 28 — Taking it back to the tenant

To close, here's what to take back to the tenant. Build the prerequisites before the first policy, measure readiness, create everything in report-only, and enforce the waves in order. Make every exclusion a governed group with an owner and an expiry, and test the break-glass accounts every ninety days. For PIM: emergency accounts first, then the authentication context policy, then named approvers. Make packages that always expire, and review groups, not applications. Keep one writer per object class and two people per change. And export the evidence before Microsoft's thirty-day window closes. In Zero Trust, every access decision is a policy decision, and this session has been about making those policies explicit, testing them, and keeping the proof. Book 05 covers the device compliance that Conditional Access reads. Thank you.
