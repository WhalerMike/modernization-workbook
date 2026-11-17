# Building Global Secure Access, Chapter 06 — Private Applications and Administrative Paths — narration script (practice copy)

## Slide 1 — Chapter 06: Private Applications and Administrative Paths

Welcome back to Building Global Secure Access. This is Chapter 6: private applications and administrative paths. A VPN gives a device an address range. Private Access gives a group one application, on its ports, behind its own Conditional Access. The code checks that each app is that narrow, and that administrative paths ask for phishing-resistant authentication. The chapter is a draft awaiting review, and the code is illustrative, tested against fixtures.

## Slide 2 — Why one application, not a range

Why narrow? Because a compromised user or device on a VPN address pool can move laterally across everything the pool reaches. Private Access replaces the range with one application for one group, behind that application's own policy. So the goal: show, application by application, that each reaches only its host and ports, only for its group, under a policy that excludes emergency access; that administrative RDP and SSH require phishing-resistant authentication; and that connectors survive a patch night. It's for the developers, the server and application owners, and the privileged access owner.

## Slide 3 — What Microsoft Learn gives you

Learn's Private Access tutorial creates an application from the custom template, marks it a Private Access app, binds it to a connector group, adds its segments and assigns a group with the app's user role. Segments may not overlap between per-app applications; a per-app segment overrides Quick Access; and clients can take fifteen minutes to see a change. Connectors are read with a write-capable permission and report active or inactive, and their version. Learn's Zero Trust recommendations ask for two healthy, current connectors per group, least-privilege segments and every app assigned. And for domain controllers, the sensor starts in audit, with application service names before the DC's own.

## Slide 4 — What it leaves to you

What does it leave to you? The requests create one app, but nothing reads all of them back with their segments and assignments, so the kit has a read for that, marked unverified, and the lab compares it with the portal. A group with one inactive connector looks fine in a list, so the kit counts active members. A wide range on every port is the VPN again, so wide segments and overlaps fail. A person assigned directly escapes the access review. Plain MFA on RDP passes a casual look, so any app covering port 22 or 3389 needs the phishing-resistant strength and a compliant device. And Quick Access is tracked until it's empty.

## Slide 5 — The nine private access checks

Nine checks. Two or more active connectors per group, each at the minimum version. Segments left in Quick Access, a warning until there are none. Each segment a host or a narrow range, on named ports, with no overlaps. Group assignments only. A policy that targets the app and excludes the emergency group. RDP and SSH apps that require the phishing-resistant strength and a compliant device. And the last day's private sessions by destination, to compare with the assignments. The administrative policy is a reviewed file, the guide's own; when the tenant's copy drifts, the plan brings it back.

## Slide 6 — Who owns apps, connectors and admin paths

Who owns what? Application owners own their app's assignment and review it each quarter. The platform owner for servers keeps two healthy, current connectors in every group. The privileged access owner owns the administrative apps and the domain controller sensor, and that's where Building Privileged Access comes in, for the privileged groups behind them. For permissions: a write-capable delegated permission for the connector reads, an application read for the apps, which isn't verified yet, the policy permissions, and three administrator roles activated just for the lab.

## Slide 7 — Lab 1: the connectors, group by group

Lab 1, after listing the reads and collecting the pilot. Step 3 reads the connectors group by group. Headquarters has two active connectors on the current version. The cloud group has one active and one inactive, and the active one is old. Step 4 runs the checks. Both connector problems fail. The Finance app is a slash sixteen on every port, assigned to a person, under an enforced policy that doesn't exclude emergency access. Because every port includes RDP, it's an administrative path too. The RDP app asks only for MFA. And Quick Access still holds two segments.

## Slide 8 — Lab 1: the plan restores the RDP policy

Step 5 plans the pilot and reads the administrative policy's fix. The plan has two Graph steps: the internet profile off, and a patch for the RDP policy, because the tenant's copy differs from the reviewed file. The body of that patch sets the built-in phishing-resistant authentication strength, the one ending in four, and a compliant device. That's the guide's Step 10 policy, as written. Nothing is sent: it's a dry run, and fixture mode never applies.

## Slide 9 — Lab 1: two weeks later, every app passes

Step 6 checks the tenant two weeks later. Finance is one host on port 443 for the pilot group, with the emergency group excluded. Both cloud connectors are active and current. The RDP policy has its strength and a compliant device. And Quick Access is empty. Every check passes. Step 7 runs this chapter's tests: four passed, none failed. Then delete the output folder.

## Slide 10 — Lab 2: publish one app, then remove it

Lab 2 needs a test tenant with Private Access licenses, a connector group with two connectors on Windows Server 2019 or later, a test server and a pilot group. Publish one app with the guide's own requests, named so the kit's reviewed policy file finds it, one host on 443, for the pilot group. Collect and check, comparing the app read with the portal first; the policy check fails, because there's no policy yet. Plan and apply its policy in report-only. Then validate: from a device off the corporate network, the host is reachable on 443 and not on another port. Back it out by deleting the policy, then the application. The authors haven't run this lab.

## Slide 11 — Requirements, dangers, done

Narrow apps for one group support access enforcement, least privilege and managed access control points. Resilient connectors support remote access. Phishing-resistant administrative paths support multifactor authentication and logging privileged functions; the guide lists OMB M-22-09's phishing-resistant MFA and VPN-free application access among the requirements this supports. The assessor decides the controls. The dangers: a wide segment, a group with one connector, plain MFA on RDP, Quick Access left as a range, and protecting a domain controller's own service name before the applications', which can lock administrators out. You're done when every group, every app and every administrative path passes. Next, Chapter 7.
