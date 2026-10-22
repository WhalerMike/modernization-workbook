# Book 04 — Access & Privilege — technical deep dive — narration script (practice copy)

## Slide 1 — Access & Privilege: The Technical Deep Dive

This is the technical deep dive for Book 04 of the Federal Modernization Workbook, Access and Privilege.

The fifteen-minute briefing made the argument. This session is for the people who build and run it: identity engineers, architects, and the security and assessment staff who have to prove it works.

It runs about fifty minutes in five modules, and each module stands on its own, so you can watch it in parts. After a two-slide orientation, we'll cover the Conditional Access policy library; its rollout, exclusions and break-glass accounts; PIM self-request with approval; access governance; and finally access as code, and the evidence it produces.

Every fact comes from a footnoted chapter of the book, and each slide names its chapter. Code and JSON stay in the book; the slides carry the design.

## Slide 2 — Every access decision is a policy decision

Start with why, because every design choice in the next forty-five minutes follows from it.

OMB M-22-09 says federal applications can't rely on the network perimeter, and that every request for access should be evaluated, with the ability to evaluate an active session continuously. When undue risk appears, the answer can be re-authentication, limited access or denial. It also asks agencies to move past static roles toward more granular, dynamic permissions, and to use at least one device-level signal alongside identity.

NIST SP 800-207 gives the architecture. Three of its tenets carry this book: network location alone doesn't imply trust; access is granted per session, with least privilege; and access is determined by dynamic policy. It also separates deciding from enforcing. A policy decision point, made of a policy engine and a policy administrator, decides; policy enforcement points carry the decision out.

The table is how the program maps that onto Entra ID. Conditional Access is the policy engine. Entra ID's token issuance plays the policy administrator: it issues the token the decision allows, or it refuses. The applications that accept only Entra-issued tokens, and the gateways in front of older applications, are the enforcement points. And Continuous Access Evaluation answers M-22-09's active-session requirement, re-evaluating on critical events, such as a disabled account, a password reset or token revocation, and when location changes.

Be careful how you state that mapping in a security plan. It's the program's interpretation, not a mapping Microsoft or NIST publishes. But it explains why the rest of this session treats a Conditional Access policy as the unit of access control: one policy set the agency can read, test, change and prove.

## Slide 3 — How Conditional Access computes the decision

Now the mechanism, because Conditional Access doesn't work like Group Policy, and administrators who bring Group Policy habits to it make predictable mistakes.

There's no precedence. Within a policy, assignments combine with AND: the policy applies only when everything it's assigned to matches. Across policies, every applicable policy must be satisfied. If one requires MFA and another a compliant device, the user does both, and the policy numbers are labels, not an order. Block wins: if any applicable policy blocks, enforcement stops. Inside a policy, controls combine as configured, require all or require one. And exclusions are absolute.

The rule that causes the most damage is the default. If no policy's conditions trigger a control, a token is issued. A policy that says Finance users reaching Payroll must use phishing-resistant MFA says nothing about anyone else, so a non-Finance user gets a Payroll token with no controls at all. Restricting a resource takes two policies, written and reviewed together: a grant for the population, and a block for everyone else. Enterprise application assignment, with Assignment required set, is usually the cleaner first gate, but Global Administrators bypass it, which is why sensitive applications keep the block as well.

Two timing facts keep our claims honest. Conditional Access runs after first-factor authentication, so it isn't a front-line defense against password spray. And it evaluates token requests: at sign-in, and when a refresh token gets a new access token, about once an hour for modern clients. Continuous Access Evaluation closes part of that gap, and supporting services enforce critical events typically within fifteen minutes.

With that model in place, on to module one.

## Slide 4 — Module 1 — The Conditional Access policy library

Module one: the Conditional Access policy library.

The chapter sets a clear standard for when a library is finished: every sign-in in the tenant meets a policy that someone owns, and nothing in it depends on another policy running first.

In the next four slides we'll cover how the library is numbered and what it assumes already exists; the personas that every policy targets; the five enforcement waves, policy by policy; and how the library answers the configurations that CISA's BOD 25-01 requires. The deployable JSON template for every policy is in Appendix A.

## Slide 5 — One library, numbered once

The library is one policy set, numbered once. Policies CA001 to CA017 are the baseline that the Federal Modernization Workbook's Book 02 builds during the migration, and they keep their identifiers here. CA002 stays retired, so that's sixteen policies. Book 04 adds CA018 to CA038, for risk, privileged workstations, segmented applications and workload identities, plus CA090, the permanent report-only probe. Numbers 001 to 089 are for the library and 090 to 099 for report-only instruments. Numbers are labels, not order, and a retired number is never reused. The earlier library used a different numbering scheme, and the chapter maps every one of its policies to where it went.

Every name follows one pattern: number, population, resource or condition, then control. You can read a policy on a call without opening it.

On the right are the prerequisites, and missing ones are the most common reason a report-only policy shows failures that aren't real. The emergency access group. Persona groups, the two big ones dynamic from extension attributes in Book 03's attribute map. Access groups for restricted populations. Three named locations. A custom authentication strength that accepts FIDO2 keys from an approved AAGUID list, or certificate-based authentication. It leaves out Windows Hello for Business on purpose: for privileged accounts, a credential held in the device gaining access doesn't count as a separate device. A device label in extension attribute twelve. And a custom security attribute that tags each application's environment.

Four conventions apply everywhere. The emergency access exclusion is implicit. Every policy needs Entra ID P1; risk policies need P2; workload identity policies need Workload ID Premium. Every policy is created in report-only. And none uses the approved client app grant, which became read-only on June 30, 2026.

## Slide 6 — Personas decide who each policy reaches

Policies target populations, never people, and the populations are personas. They're defined in the Federal Modernization Workbook's Book 02 and kept identical here.

Admins are users eligible for or holding privileged roles, from the account-type attribute or the PIM-eligible population. They carry the highest risk and get the strictest policies: phishing-resistant MFA, a compliant device, trusted networks, and privileged workstations. Internals are employees and contractors with standard access, built dynamically from the worker-type attribute. Externals are B2B guests from partner organizations; Guests are ad hoc external users from anywhere else. Workload identities are single-tenant service principals. They must be assigned to a policy directly, because a policy assigned to a group that contains a service principal isn't enforced for it, and only two policies reach them, CA015 and CA037. And break-glass: the two emergency accounts, excluded from every enforced policy, and still recorded by CA090, which is report-only.

The library adds named sub-populations inside the personas: web-only users without a managed device, shared-device frontline staff, server administrators, Azure operators and production operators. Each is a governed group.

Now the failure mode that drives one of the library's most important design choices. Persona groups are dynamic, built from attributes. A user whose attribute is empty falls outside every persona group, and therefore outside every policy that includes only that group. That's an exclusion nobody approved. So the library includes all users and excludes narrowly, and it adds CA018, deliberately redundant: MFA for all users and all resources, with no resource exclusions. It uses the plain require-MFA control rather than a strength, so guests who sign in with email one-time passcodes can still satisfy it.

## Slide 7 — Five enforcement waves, CA001 to CA090

The library is enforced in five waves, each closing a class of risk.

Wave one is the foundation, and it has no visible effect for anyone already on modern clients. CA001 blocks legacy authentication, which can't do MFA or present device state. Run the legacy query for at least two weeks first and move every remaining client, including service accounts and multifunction devices that send mail. CA020 requires a managed device to register security information, so an attacker with a password can't register their own method. CA021 blocks device code flow and authentication transfer, the flows used in device-code phishing. And CA090, the probe, never moves to On.

Wave two is administrators. CA003 requires the separate-device strength with a four-hour sign-in frequency, targeting the Admins persona and the highly privileged built-in roles, because role targeting also catches an assignment made outside the persona process. CA004 requires a compliant device, CA005 blocks untrusted locations, and CA025 blocks the admin portals and Azure management from anything that isn't a PAW. That block is written as an exclusion of devices labeled PAW: a positive-operator filter never matches an unregistered device, so an unregistered device isn't excluded, and it's blocked. CA026 gives server and Arc administration the same assurance, and CA027 blocks the Azure management plane for everyone who isn't an administrator or operator.

Wave three is the one users notice: the workforce MFA baseline, managed devices, the country block, partner and guest policies, mobile app protection, the CA018 catch-all, and CA038, without which CA011's limited guest access isn't limited at all.

Wave four is risk and workloads. Wave five is segments and the end state: CA022, phishing-resistant MFA for every member.

## Slide 8 — Why the library looks like this: BOD 25-01

Why does the library look this way? Much of it is the answer to CISA's BOD 25-01, which requires federal civilian agencies to implement CISA's mandatory configurations for in-scope cloud tenants. The deadline for the configurations effective at issuance was June 20, 2025.

The table lists the Entra ID items that Conditional Access answers. Legacy authentication blocked: CA001. High-risk users blocked: CA013. High-risk sign-ins blocked: CA019. Phishing-resistant MFA for all users: CA022, with CA003 for administrators. Another MFA method until then: CA006, CA009 and CA018, as the interim. And phishing-resistant MFA for highly privileged roles: CA003. Two SHOULD items from the SCuBA baseline are met by CA007 and CA020. The other mandatory Entra items, such as authentication methods settings, application consent and the privileged-role rules, aren't Conditional Access settings, and the book covers them elsewhere.

One conflict is worth understanding. The Federal Modernization Workbook's Book 02 adopted Microsoft's current recommendation for high-risk users, require risk remediation. BOD 25-01 says high-risk users shall be blocked. Both can't win, because when several risk policies apply, block overrides remediation. So in any tenant within the directive's scope, CA013's grant is Block, it includes all users rather than only members, and recovery runs through the help desk: an administrator confirms the account, resets credentials and dismisses the risk. Where the directive doesn't apply, CA013 uses remediation for members.

Last, Microsoft-managed policies. Microsoft creates some policies itself, in report-only, and turns them on no less than thirty days later unless an administrator sets them to Off. The program writes down a decision for each, adopt or supersede, because a policy Microsoft enables on a schedule is a change the agency didn't make. Five are superseded by library policies.

## Slide 9 — Module 2 — Rollout, exclusions and break-glass

Module two: getting the library into production safely.

A policy that targets all users can lock out the whole organization, administrators included. So this module is about the gates every policy passes, how to read report-only results and roll back without deleting anything, why every exclusion is a governed object, how the break-glass accounts are built and watched, and what the sign-in logs must show once the policies are on.

## Slide 10 — Every policy passes the same gates

Every policy, in every wave, passes the same gates. The Federal Modernization Workbook's Book 02 set the durations, and Microsoft's own minimum is a week in report-only before enforcement.

Gate one is report-only, two to four weeks, while impact, gaps and exclusions are reviewed. Gate two is a pilot ring of IT and security staff for two weeks. Gate three expands ring by ring, one to two weeks each: headquarters, then field and remote staff, then everyone in scope. Then steady state: enforced, monitored, with drift alerts.

Inside that, the chapter consolidates a seven-step cycle. One, a pre-deployment check: prerequisites exist, readiness gates are met, the emergency exclusion is present, and the policy JSON has been reviewed in source control. Two, create the policy in report-only. One detail: a report-only policy that requires a compliant device can prompt users on macOS, iOS and Android to pick a certificate, so leave those platforms out of the report-only version. Three, measure for at least seven days. Four, analyze and remediate: missing registrations, noncompliant devices, untagged applications, empty attributes. Fix the cause; add an exclusion only as a governed object. Five, security and business owners approve the impact analysis, and that approval is kept as change evidence. Six, enforce for the pilot ring and expand. Turning a policy that targets all users straight from off to on is never allowed. Seven, watch for forty-eight hours after each ring.

The readiness gates are the program's numbers: at least ninety-five percent of in-scope users have a method that satisfies the policy's strength, and at least ninety percent of devices are enrolled and compliant, with the attributes populated. The point is that each wave starts with a measured number, not an estimate. And a wave starts only after the previous one has been enforced for a week without an incident.

## Slide 11 — Reading report-only, rolling back without deleting

Report-only is a policy state, not a test environment. The policy is evaluated at every sign-in and its result is logged, but nothing is enforced.

There are four results, and you'll see them in the sign-in logs and in Microsoft Graph under the names in the middle column. Success means the conditions matched and the controls were already satisfied, for example an MFA claim was already in the token. Failure means the conditions matched and a non-interactive control failed: that's what a block would do. User action required, which Graph calls report-only interrupted, means the user would have been prompted. And not applied means the conditions didn't match, often because the user is excluded. Two limits: user-action policies can't run in report-only at all, and GPS-based named locations still prompt users for location.

To change an enforced policy, Microsoft's practice is to create a report-only copy with the change, compare the two, and then update the original.

Rollback has four forms, from smallest to largest. Revert one policy to report-only when you need data while you investigate. Reduce scope with a time-bound exclusion group when one population is blocked, fix the cause, then remove the group. Turn a policy Off when it's causing widespread blocks. And when several policies in a wave interact badly, set the whole wave to report-only and open an incident.

What's never on the list is deletion. Microsoft does let you restore a deleted policy or named location within thirty days, but a deletion breaks the policy's change history in source control, and the drift record has to explain it. If the tenant is locked out entirely, an emergency account signs in and reverses the change. If no administrator can, Microsoft support can update the blocking policy after verification.

## Slide 12 — Exclusions are governed objects

Because an exclusion overrides everything, each one is a standing hole in policy, and exclusions accumulate the way Group Policy exceptions did. So the program treats every exclusion as a governed object.

The only exclusion that's permanent by design is the emergency access group, which every enforced policy excludes. The others in the library are each tied to one policy and one reason. Approved travel lets a traveler past CA008's country block, granted through PIM for Groups after an approved request, for at most fourteen days, and the traveler must still meet CA006 and CA018. The device code flow group holds Teams Rooms and similar devices that genuinely need that flow, ideally narrowed further in a companion policy. The onboarding group lets remote new hires who don't have a managed device yet register MFA for a few days, using a Temporary Access Pass from the pre-hire workflow. And the not-ready group for CA022 is the enrollment backlog: it shrinks as users enroll, and every member has an expiry.

The rules on the right apply to all of them. An exclusion is a group, never a user named in a policy. It has an owner, a reason, an expiry, and a place in the access review schedule. Where a script or tool signs in as a user, the fix is a managed identity or workload identity, not an exclusion; the directory sync account is the documented exception. And test the exclusion, not just the policy, because an excluded user can still be prompted by another policy.

The opposite failure is quieter. A policy that includes a dynamic group misses every user whose attribute is empty. That's an exclusion nobody approved, which is why the baseline policies include all users and exclude narrowly, and why attribute completeness is checked before any attribute-scoped policy is enforced.

## Slide 13 — Break-glass: the one standing exception

Every control that blocks an administrative path also creates a way to lock the agency out of its own tenant: federation down, every administrator's MFA device unavailable, a misconfigured policy, or every privileged role eligible with no approver able to act. Emergency access accounts, break-glass, are the answer, and they're the only standing privilege the program accepts by design.

The standard is on the left. Two or more cloud-only accounts on the tenant's onmicrosoft dot com domain, neither synchronized nor federated, and not tied to one person or an employee's phone. Permanent active Global Administrator; together with service principals that can't perform an activation, they're the only standing active assignments in the tenant. Phishing-resistant authentication, a FIDO2 passkey or certificate-based authentication, using methods different from the normal administrator accounts. The older pattern of a password in sealed envelopes is superseded, because a password alone can no longer reach the admin portals where Microsoft's mandatory MFA applies. Excluded from every policy that blocks or restricts sign-in, through one dedicated group. Validated at least every ninety days by signing in and performing an administrative task.

On the right is how the build watches them. Report-only policies don't need the exclusion, so CA090 is the one policy that records their sign-ins. Alerts match the accounts' object IDs, because their names deliberately don't reveal their purpose. Every use is a critical incident until a post-use review closes it. And because NIST's AC-2(2) expects emergency accounts to be disabled automatically after a defined period, the system security plan records these as a documented deviation, with monitoring, post-use review and the ninety-day validation as compensating controls.

Finally, order. The accounts exist and pass a test before any role is made eligible or any approval is switched on. Module three explains the lockout that prevents.

## Slide 14 — Monitoring: what the sign-in logs must show

Once policies are on, the sign-in logs are the instrument. The queries run against the SigninLogs table in a Log Analytics workspace that receives Entra sign-in logs. The chapter gives them in full; they're illustrative and haven't been tested against a production workspace, so confirm column values against your own data before using them for alerting or evidence.

Six signals matter. Per-policy results over seven days, including report-only outcomes; after wave two, members of the Admins group should show no not-applied results for the administrator policies. Blocked sign-ins, error 53003, which is blocked by Conditional Access; a spike on a single application usually means a client that can't do modern authentication or app protection. The end-state gap: users who would fail CA022 while it's in report-only. That's the list that drives the enrollment campaign. Legacy authentication still in use, over fourteen days, which must be empty before CA001 is enforced. Coverage gaps: successful sign-ins that no policy applied to, which should be empty for interactive sign-ins once CA018 is on. And emergency account use, matched on object IDs, which should be zero outside scheduled validation.

Then drift. The policy set in the tenant must equal the policy set in source control, and the drift check alerts on a policy whose state changed without an approved change; a change to any exclusion group's membership, especially the emergency access group; a change to conditions, named locations, authentication strengths or controls; a policy created or deleted outside the pipeline, including a Microsoft-managed policy that Microsoft added or enabled; and users or devices missing the attributes that put them in scope.

Protected actions, which require fresh strong authentication to change policies and named locations, narrow who can cause drift in the first place. Module three builds them.

## Slide 15 — Module 3 — PIM self-request with approval

Module three: Privileged Identity Management, self-request with approval.

An eligible role is only as safe as the moment it turns active. So that moment needs fresh proof, a reason, a second person, and a record that outlives the audit window. We'll cover the two layers of self-request, the activation controls by tier, the build in the order that avoids locking yourself out, and the approvers, alerts and records an assessor will ask for. Appendix B has every role's settings.

## Slide 16 — Eligible, requested, approved: the activation gate

Self-request has two layers, and an agency can run either or both. Self-request for eligibility is a person asking to become eligible for a role. It's decided in entitlement management, through an access package for the role-assignable group, and it answers: may this person ever hold this role? Self-request for activation is an already-eligible person asking to turn the role on for a bounded window. It's decided in PIM, and it answers: may this person use this role right now? Microsoft's guidance for the DoD Zero Trust user pillar treats the two as composable.

This module builds the second layer, because it produces a per-use, time-bounded, individually justified record of privileged use, which is what AC-6(9) and AC-17(4) are tested against. Eligibility without an activation gate is standing privilege through a nicer front door. If an agency runs only one layer, it should run this one.

The sequence is six steps. The administrator requests activation with a duration within the role's maximum, a justification and a ticket number. PIM sends them through authentication context c1, which demands a fresh phishing-resistant sign-in. The request goes pending, and approvers are emailed. An approver from outside the requester's tier approves or denies, with their own justification. On approval, the role is active until the requested end time and returns to eligible with no action. Denied, or undecided after twenty-four hours, the role stays eligible and a new request is needed.

One dependency people miss. If the P2 or Governance license lapses, permanent assignments are unaffected, but eligible Entra role assignments are removed, PIM settings are removed and role reviews end. Treat a license expiry as a configuration-management event, and keep the role inventory exported so eligibility can be restored.

## Slide 17 — Activation controls, set per role and by tier

PIM settings are defined per role. Each role's settings are independent of every other role's, and every assignment of a role follows them. The program sets them by tier, from Chapter 04's tier model.

Tier 0 is the control plane: Global, Privileged Role, Privileged Authentication, Security and Conditional Access Administrator. Four-hour activations, authentication context c1, justification and ticket required, approval by the Tier 0 approver group, and eligibility that expires after ninety days. Tier 1, the management plane, such as Exchange, SharePoint, Intune and Application Administrator, gets eight hours, the Tier 1 approver group, and a hundred and eighty days. Tier 2, scoped operations inside administrative units, gets eight hours, and approval is optional, with a documented risk acceptance per role. Read-only roles need no approval, but still pass c1 with a justification, and their eligibility runs a year.

Now, what the controls really do, because the old guides got several wrong. The activation maximum runs from one to twenty-four hours, and it's the exposure window, so set the shortest the work needs. Require MFA on activation may not prompt at all if the user authenticated strongly earlier in the session, so it proves nothing at activation time. That's why every role uses the authentication context instead, which is Microsoft's recommendation when the goal is authentication during activation. Ticket information is recorded but never checked against a ticketing system; enforced correlation belongs in the SIEM or ITSM. And approval needs at least one approver, with two recommended.

The assignment controls close the side door, so a well-built gate can't be bypassed by simply granting someone a permanent active assignment. No permanent eligible assignments. No permanent active ones, except Global Administrator for the emergency accounts. And MFA and justification are required when an active assignment is made, because PIM can't apply an activation requirement to someone who's already active.

## Slide 18 — Build it in order: emergency access first

Work the build in order. Step zero isn't optional and can't be moved: configuring approval before emergency access accounts exist is the one sequence that can lock an agency out of its own tenant. Microsoft documents it. Every Privileged Role and Global Administrator assignment is eligible, approval is required, and no approvers are configured, so the default approvers, the active administrators, don't exist. Avoid it with both halves of the fix: emergency accounts with permanent active Global Administrator, and named approver groups on every role that needs approval.

Step one builds those approver groups, one per tier. Step two builds authentication context c1 and its Conditional Access policy: the separate-device strength and a compliant device, sign-in frequency every time, excluding the emergency group, and turned On, because Microsoft requires the policy to exist and be enabled before the context is selected in PIM. Three constraints. Don't scope that policy to a directory role, because at activation the user doesn't hold the role yet. The fallback to plain MFA happens only when no policy targets the context; it doesn't trigger if the policy is off, in report-only or excludes the user. And the context governs activation, not use, so CA003, CA004 and CA025 still apply to every privileged sign-in.

Steps three and four apply role settings, in the portal for one role and in Microsoft Graph for thirty. Each role's policy has seventeen rules. Step five converts standing assignments: create the eligible assignment first, confirm the person can activate, then remove the active one.

Step six closes a gap PIM leaves. PIM protects becoming a Conditional Access Administrator, but not editing a policy once someone holds that permission. Protected actions attach a second context, c2, to those permissions. Steps seven to nine are notifications and alerts, reviews, and log export, on the next slide.

## Slide 19 — Approvers, alerts and the record PIM leaves

The approval engine has three properties that shape the design. Approvers don't need to hold any role. Approvers can't approve their own requests, and service principals can't approve at all; that's enforced by the platform, which is worth saying in the security plan. And approvers need a P2 or Governance license.

From those, the separation rules. A tier's approvers aren't members of that tier's eligible population; otherwise the approvers and the requesters are the same set, and approval degrades to mutual sign-off. The platform blocks self-approval; only group design blocks collusion. At least two approvers per tier, held as governed groups, because named individuals leave. Tier 0 approvers sit outside the Tier 0 population, for example in the security office. The approver's own justification is required, so the record holds a decision, not a click. And approver groups are reviewed like the privileged objects they are.

On the right, the signals and records. The most important PIM alert is roles assigned outside PIM, high severity, because an assignment made outside PIM never met the gate. It detects rather than prevents; limiting who holds Privileged Role Administrator is the prevention. The approval window is a fixed twenty-four hours with a single stage, so a Tier 0 path staffed by two people in one time zone will strand out-of-hours requests; the documented answer to "the approvers are unavailable and production is down" is the emergency procedure, not a workaround. Role reviews run monthly for Tier 0 and quarterly otherwise, and never as self-review, because self-review leaves role-assignable groups out entirely. And PIM's audit history keeps thirty days, so the logs are exported for AU-11 before go-live.

One date to act on: the legacy beta privileged-access API stops returning data on October 28, 2026. Anything still calling it must move now.

## Slide 20 — Module 4 — Access governance

Module four: access governance.

Conditional Access decides whether a session may proceed, and PIM decides whether a privileged role may be active. Neither decides whether a person should still hold the access they were given last year. A grant nobody re-confirms is a decision made once and trusted forever. Three mechanisms close that gap without anyone opening a ticket: requests through access packages, reviews on a calendar, and lifecycle events.

## Slide 21 — Access packages: who requests, who approves, how long

Entitlement management automates access requests, assignments, reviews and expiration for groups, applications and SharePoint sites, for internal and external users. It has three building blocks. A catalog is the container and the unit of delegation; the program creates one per business domain, with the domain's business owner as catalog owner, and doesn't use the automatic General catalog. An access package bundles resource roles. And a policy says who may request, who approves, and when the assignment ends.

The approval chains follow the application's risk tier, as design positions. Tier 3: the department owner, which is the requestor's manager with a fallback approver for anyone with no manager in the directory, seven days to decide, and a one-year expiry that extends without approval while the user is still in scope. Tier 2: the application owner, with the backup owner as alternate, five days, a hundred and eighty days. Tier 1 adds a second stage, the identity governance office, and expires in ninety days. The earlier procedure only notified the office of Tier 1 grants; a second stage costs a few hours and leaves an approval record instead of an email. External users get a separate, stricter policy and at most a year. The program never uses "never."

Underneath is the group substrate. Applications are assigned to groups, never to users directly. Nested groups are prohibited, because group assignment to an application gives access only to direct members, and a group review shows nested users but can only remove direct members. And names follow one convention, so a group's purpose and tier can be read from it.

Separation of duties: a package can list incompatible packages and groups, but the check is one-way, so each package must list the other. A legitimate exception becomes its own combined package with a shorter expiry and more frequent reviews. And privileged access arrives through PIM eligibility, never through a package that grants an active role.

## Slide 22 — Reviews on a calendar, removals by default

Access reviews are recurring attestation that each person still needs what they hold. Each instance captures a snapshot of access when it starts, and changes during a review show up in the next cycle.

The schedule is set by risk. Privileged roles are reviewed in PIM, monthly for Tier 0 by the Tier 0 approver group, and quarterly for the other tiers, with removal if nobody responds. Tier 1 application groups are reviewed quarterly in two stages of seven days: the manager first, then the application owner for everyone the manager approved or marked don't know. That replaces the old manual escalation step. Tier 2 groups are semiannual and Tier 3 annual, by the application or department owner. Guests are reviewed quarterly by their sponsors, and denied guests are blocked and then removed.

Four rules make reviews bite. First, review the groups, not the applications. Microsoft notes that reviewing an application that uses group assignment doesn't remove the members of those groups; they keep their access through the group. Second, whenever reviewers are managers or group owners, add a fallback reviewer for users with no manager and groups with no owner. Third, choose the no-response default deliberately. Microsoft warns that combining remove access with auto-apply can revoke all access to a resource if reviewers don't respond. So the program sets remove only where an unreviewed grant is riskier than a lost one, privileged roles and guests, and no change with escalation for business applications, where a mass removal would stop work. Fourth, justification on every decision, and no bulk decisions on privileged reviews. The service can't prevent a bulk action, so the history is checked for one reviewer recording many identical decisions within minutes.

The records: results download as a CSV, and review history reports stay downloadable for only thirty days, so each one goes straight to the evidence store.

## Slide 23 — Lifecycle events and guest access

The third mechanism is lifecycle events. The HR-driven lifecycle itself, from attributes to joiner, mover and leaver design, belongs to the Federal Modernization Workbook's Book 03. This chapter covers only the Lifecycle Workflows tasks that change access, because those tasks are where mover and leaver problems turn into access decisions.

A joiner gets the onboarding package and the department package, never a direct add to an application group. A move is a re-derivation, not an additional grant: remove the previous department's packages, request the new department's package, and send everything the person still holds outside packages to a review. Microsoft's built-in job profile change template does the first two steps, and its remove-all-assignments task defaults to fifteen days after the trigger, a grace period for handover. The program keeps that grace for standard access and sets it to zero for Tier 1 and privileged access. A leaver's workflow cancels pending requests, removes every package assignment, removes the user from all groups and teams, and revokes refresh tokens. And an inactivity workflow is the backstop for accounts whose HR record never produced a leaver event. A tenant can have fifty workflows, so spend them on events, not on applications.

Guests are where unreviewed access piles up fastest, because nobody's HR record ends when a partner project does. Four layers. Invite through a package, so every guest arrives with an approver, a sponsor and an expiry. When a governed guest loses their last assignment, they're blocked and, by default, removed after thirty days; ungoverned guests stay in the tenant indefinitely, so the program marks existing guests with assignments as governed. Sponsors review guests quarterly. And guest lifecycle policies, still in preview, will be adopted when they're generally available.

All of this is licensed by Entra ID Governance, so plan it for the whole workforce. Partial licensing produces a program that governs some people and leaves the rest ungoverned.

## Slide 24 — Module 5 — Access as code, and the evidence

Module five: access as code, and the evidence it produces.

An access policy that exists only as portal clicks can't be diffed, reviewed or replayed, so it can't be assessed. The invariant this module enforces: every access decision has a reviewable source of truth, a pipeline applies that source, and a monitor checks the tenant against it. Then the evidence is produced by doing the work, not reconstructed for the assessment.

## Slide 25 — One file per object, one writer per class

Every access object the program governs has a file in the repository, one per object, and the safety rules travel with the files. Every blocking or grant policy excludes the emergency access group, and new and changed policies deploy as report-only. PIM settings require an authentication context or MFA, justification, and approval for Tier 0, with no permanent active assignment except the emergency accounts. Groups follow the naming convention with no nested members. Packages have an expiry, and incompatible packages are listed both ways. Review definitions have a fallback reviewer and auto-apply. Leaver workflows remove all package assignments and revoke refresh tokens.

Four tools can hold those objects, and every one ends in Microsoft Graph. Graph covers everything, but holds no state, so desired state has to live in the repository and the comparison has to be written. The Terraform azuread provider, at version 3.10.0 as of October 2026, covers most classes but has no access review definitions, no Lifecycle Workflows, and no role management policy for Entra directory roles. Microsoft365DSC, an open-source community module, covers every class in the table. And Microsoft Entra Tenant Governance configuration management, built on generally available Graph APIs, monitors a baseline but doesn't cover review definitions or workflows.

The program's reference choice minimizes write paths while keeping drift detection native. Microsoft365DSC writes, because it's the only declarative tool that covers every class; treat it as a community project, check its release notes, and pin its version. A team already invested in Terraform can use it where it covers, and Graph PowerShell for the rest. The rule that matters is one writer per object class, recorded in the repository. The tenant monitor detects drift where it covers; a daily read-only comparison handles reviews and workflows. And Entra Exporter takes a weekly backup, kept separate from the baselines, as Microsoft advises.

## Slide 26 — Change control, and closing drift at the source

The repository is the only normal path to production. Six change-control rules, which together are how the program meets CM-3 and CM-5 for the identity plane and FedRAMP 20x's change-management indicators.

One, two people per change: the author of a pull request can't approve it, and Tier 0 objects, such as emergency exclusions and Tier 0 PIM settings, need a second approver from the security team. Two, checks before merge: schema validation, the emergency exclusion check, the safety rules, and a plan or dry run attached to the pull request. Three, report-only first; a policy runs at least a week against the sign-in logs and is enabled in a second pull request that cites the impact review. Four, the pipeline signs in as a service principal with workload identity federation, no secret. It can change every access policy in the tenant, so it's a Tier 0 asset, with two owners, quarterly permission reviews and a workload identity policy restricting where it signs in from. Five, emergency changes in the portal happen under a PIM activation with a ticket, and are back-ported within one business day; until then the drift monitor reports them, which is the point. Six, rollback is a revert, so it has the same record as the change.

Drift detection catches what code can't stop, because a Global Administrator can still change the tenant directly. The tenant monitor's limits shape how it's used. It runs every six hours, fixed. Snapshots expire after seven days, resolved drifts are deleted thirty days after they're resolved, and updating a baseline deletes that monitor's earlier results. Those are evidence rules in disguise: export every result before changing a baseline.

Every drift is one of two things. Unauthorized or accidental: redeploy the repository's version and investigate from the audit log. Intended but not yet in code: back-port it by pull request. A drift open more than one business day goes to the governance office, and drift on a Tier 0 object is a security incident.

## Slide 27 — What the assessor reads

Configuration evidence proves a setting existed. Operational evidence proves the setting did its job. An assessor needs both, for the whole assessment period, not just the day of the visit.

The table is the program's mapping. AC-2, account management, is met by access packages with approval and expiry, scheduled reviews, and Lifecycle Workflows; the evidence is the package files, the entitlement audit records for each request, the review history and the workflow run history. AC-3, access enforcement, is the Conditional Access library and group-based assignment, evidenced by policy files, their deployment history, monitor results showing no unresolved drift, and sign-in logs showing policies applied. AC-5, separation of duties, is the three-party group model, incompatible packages and two-person pull requests. AC-6 and its review enhancement are PIM eligibility instead of standing roles, with reviews monthly for Tier 0 and quarterly otherwise. IA-2's MFA enhancements are the phishing-resistant strength, shown in policy files, sign-ins and the registration report. AU-11 isn't met by PIM configuration at all, only by the export, and the validation test is an activation still queryable after thirty-one days. And CA-7, continuous monitoring, is the six-hourly monitor, the daily comparisons and the drift issues with their resolutions.

FedRAMP doesn't set the account-review or privilege-review frequencies; they stay organization-defined, so the security plan states the program's schedule. Under FedRAMP 20x, the same records support the identity indicators, for automated account management, least privilege, just-in-time authorization and passwordless methods, and the change-management indicators for logging, redeploying and validating changes.

And the honest limits. A correct policy file says nothing about whether reviewers read what they approved; the review history carries that. Native retention is short. And tool coverage moves, so re-check the coverage table at every upgrade. This is a design-intent mapping, not an assessment result.

## Slide 28 — Taking it back to the tenant

To close, here's what to take back to the tenant.

The library: build the prerequisites before the first policy, measure readiness rather than estimating it, create every policy in report-only, and enforce the waves in order. Exceptions: every exclusion is a governed group with an owner and an expiry, and the break-glass accounts are alerted on every use and tested every ninety days. PIM: emergency accounts first, then the c1 policy switched On, then named approver groups, with every human administrator eligible only. Governance: packages that always expire, reviews of groups rather than applications, and auto-apply turned on. Code: one writer per object class, two people per change, and drift monitored against the baseline. And evidence: exported before Microsoft's thirty-day window closes, and assembled every month.

In Zero Trust, every access decision is a policy decision. This session has been about making those policies explicit, testing them before they enforce, and keeping the proof that they ran.

Keep Appendix A at hand for every policy's template, Appendix B for every role's settings, and the Federal Modernization Workbook's Book 05 for the device compliance that Conditional Access reads. Thank you.
