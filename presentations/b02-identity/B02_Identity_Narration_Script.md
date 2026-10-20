# Book 02 — Identity & Directory — narration script (practice copy)

## Slide 1 — Why Does Identity Matter?

This briefing comes from Book 02 of the Modernization Workbook, Identity and Directory: the move from Active Directory to Entra ID.

I'll take it through four questions. Why identity matters now. What actually changes when a directory moves to the cloud. Who has to own which decisions. And how to do it without losing the governance that twenty-five years of Active Directory quietly carried.

The short version: this is not a directory upgrade. It decides whether every security control after it works.

## Slide 2 — Identity is now where access is decided

Why. Federal Zero Trust policy moved the access decision. OMB memorandum M-22-09 requires agency staff to use enterprise-managed identities and phishing-resistant multifactor authentication. NIST Special Publication 800-207 removes implicit trust based on network location: every request is evaluated on its own. And CISA's Zero Trust Maturity Model puts identity first among its five pillars.

What that means in practice is that the identity provider enforces whatever it believes. Who is this person, and is that still true? Which groups and roles do they hold, and why? Is the device they're using managed and healthy? Conditional Access, Privileged Identity Management and device compliance all read those facts and act on them, on every sign-in.

So if the facts are wrong, every policy built on them is wrong, at machine speed. That's why moving from Active Directory to Entra ID isn't a directory upgrade. It decides whether every later control has true facts to act on.

## Slide 3 — AD isn't retiring — but every road now points to the cloud

Microsoft isn't retiring Active Directory. It still supports and develops Windows Server AD. But every road now points to the cloud, and the dates are real.

In June 2024 Microsoft deprecated all versions of NTLM, and NTLMv1 is removed from Windows 11 24H2 and Windows Server 2025. On July 1, 2026, Entra ID began blocking sync from taking over privileged or already-mapped cloud accounts. This month's security update restricts NTLMv1-derived single sign-on credentials by default on devices without Credential Guard. And by April 7, 2027, every Connect Sync server must run version 2.6.84.0 or later with application-based authentication, or synchronization stops.

Behind those dates is a direction: Cloud Sync replacing Connect Sync, cloud authentication instead of AD FS, and sources of authority converted to the cloud one object at a time.

The trap is the lift and shift. Synchronize the forest as it stands, and twenty-five years of organizational units, stale accounts and undocumented trusts arrive in the tenant. Meanwhile the governance that the hierarchy carried, who could manage what and where policy applied, is left behind, because Entra ID has no OU tree to carry it.

## Slide 4 — Two directories, two different models

What changes. These are two different models, not two versions of one product.

Active Directory is a hierarchy: a forest, domains, and nested organizational units. Entra ID is one flat tenant. Structure comes from attributes and administrative units instead.

In AD, much of what you are is where you sit in the OU tree. In Entra ID it should be attributes from an authoritative source, which for the workforce means HR.

Policy in AD is Group Policy linked to OUs. In the cloud it's Conditional Access and Intune, targeted by those attributes. The protocols change too: Kerberos, NTLM and LDAP give way to OpenID Connect, OAuth, SAML and SCIM. Standing Domain Admin membership gives way to least-privilege roles activated just in time through Privileged Identity Management. And management moves from the ActiveDirectory module to Microsoft Graph.

The key idea is the bottom line. In Active Directory, governance is implied by where an object sits. In Entra ID it has to be stated explicitly, as data and rules, or it simply doesn't exist.

## Slide 5 — The migration surface is much larger than users and groups

The second thing that changes is the size of the job. Most migration plans count users and groups. But Active Directory has also been holding the estate together.

DNS, DHCP and IP address management, with the zones applications depend on. Certificate Services, behind smart cards, Wi-Fi, VPN and servers. RADIUS through the Network Policy Server for Wi-Fi and VPN sign-in. Applications that bind to the directory over LDAP. The sync engine itself, which is a tier zero asset. Devices that are domain-joined and governed by Group Policy. Time, because Kerberos depends on synchronized clocks. And file services, whose permissions are bound to AD groups.

None of those move just because users sync to the cloud. Some, like the NPS extension for Entra multifactor authentication, are useful interim steps that still depend on AD.

The program's answer is an adapter for each dependency: an owner, a target, a cutover test and a validation check, retired in priority order rather than all at once.

## Slide 6 — Delegation has to be rebuilt without OUs

The third change is delegation. In Active Directory, who can manage what was largely expressed by OUs. Entra ID has no OUs, so delegation has to be rebuilt on purpose.

The program uses three tiers. Tier zero is tenant-wide control: Global Administrator and similar roles, plus break-glass accounts, all activated just in time. Tier one is service administration, such as Exchange, Intune and security. Tier two is departmental administration, like the help desk, scoped to administrative units.

The platform sets real limits, and the old design documents got several wrong. Administrative units can't be nested. Groups that hold roles can't have dynamic membership. Reader roles like Global Reader apply to the whole tenant. And restricted management is chosen when a unit is created; it can't be added later. It also takes those users and groups out of Entra ID Governance: no access reviews or lifecycle workflows for them.

So the program's decision is that administrative units are unrestricted by default. Restricted management is a per-unit choice for sensitive accounts, recorded in the registry before the unit exists.

## Slide 7 — Sign-in moves to phishing-resistant credentials

One more thing changes, and users will feel it: how they sign in.

OMB M-22-09 requires phishing-resistant multifactor authentication for agency staff, and it names PIV as the simplest route. That reorders the usual roadmap. Earlier plans treated smart-card sign-in as the last phase, for high-security users only. But a federal workforce already carries PIV or CAC cards, so Entra certificate-based authentication is the fastest path: the credential is already issued, and it works directly against Entra ID without a federation server.

The book runs four waves. Privileged accounts first, on FIDO2 security keys, or their PIV card. Then everyone who holds a PIV or CAC card, through certificate-based authentication. Then managed Windows devices, with Windows Hello for Business. And finally everyone else, including mobile users, with passkeys in Microsoft Authenticator. All four meet Entra's built-in phishing-resistant authentication strength.

Some things go away: SMS and voice codes for staff, which the memo requires agencies to stop using for routine access, and legacy protocols that send a password with every request. Those are found in the sign-in logs, fixed, then blocked, and watched for thirty days.

One thing stays on: password hash sync. It enables leaked-credential detection, and it's the manual fallback if pass-through agents or AD FS fail.

## Slide 8 — Who decides, who does the work

Who. A directory migration fails more often on ownership than on technology, so the book separates who decides from who does the work.

Deciding: the CIO and executive sponsor set scope, funding and sequence. The CISO sets the control requirements the target has to meet. And the authorizing official accepts any risk the program proposes to carry instead of remove, such as a service account that can't be converted yet.

Building and running: identity engineering designs and builds the target: sync, authentication, Conditional Access, PIM and administrative units. AD administrators clean the source and, at the end, retire it. The ISSO assembles the evidence and tracks findings to closure.

Supplying and accepting: HR supplies the facts the directory can't verify on its own, which is the subject of the HR-driven identity book. Application owners accept test results and cutover windows. And the help desk and users carry recovery, registration and wave readiness.

One owner is usually missing. Microsoft's native tools each own a slice of the picture. Nobody owns the gaps between them unless the program names someone.

## Slide 9 — How: discover, assess, build, migrate, prove

How. The book's How chapters follow five steps.

One, discover. Start with read-only access, which every employee already has, and learn the topology, OU tree, groups and Group Policy links. Then ask for narrow, time-bound access for only what you couldn't see. Two, assess: the full forest inventory, including certificate templates, trusts and delegation, without ever requesting the rights that expose secrets.

Three, build the target. The book recommends Cloud Sync unless a Connect-only requirement applies, password hash sync everywhere, Privileged Identity Management for every admin role, and a tested Conditional Access baseline. Four, migrate in waves: phishing-resistant authentication, including PIV and CAC through certificate-based authentication, and legacy authentication turned off. Five, prove it: drift checks against the baseline and an evidence bundle the authorizing official can rely on.

A few rules hold for every wave. Never enforce an untested policy on all users. Keep two cloud-only break-glass accounts on phishing-resistant credentials. Convert service accounts to managed or workload identities. And treat every closure as unproven until it carries its evidence.

## Slide 10 — What a reference deployment produces

Chapter 11 puts the steps together in a reference deployment. It's a framing pattern, not a real engagement: a civilian agency with two forests, a trust between them, and a fleet of SQL Server instances. The figures are illustrative; the mechanics are real.

It runs in five phases. Discover: a read-only survey of both forests, including the service accounts and every service principal name the SQL Server work will depend on. Normalize: an organizational registry built from that survey and checked against the agency's own chart, with a finding raised for every account the registry can't attribute to a real owner. Map: one adapter per surface, and four carry most of the risk here: synchronization, certificates, RADIUS and SQL Server. Migrate: every change recorded with who asked for it, on what authority, and a hash of the resulting state. And Validate: the before and after inventories compared, and every drift finding closed with evidence.

What comes out is an evidence bundle. It goes to the authorizing official and the security control assessor, who authorize the agency's own system under the Risk Management Framework. And it belongs to the agency. When the integrator leaves, the registry, the schemas, the findings and the evidence stay behind for the next authorization cycle.

## Slide 11 — What we're asking for

So, four asks.

Name the owners: the sponsor, the CISO, the authorizing official, the identity engineering lead, and someone who owns the gaps between the tools.

Start read-only discovery now. It needs no elevated access to begin, and the request for more access then follows the evidence rather than preceding it.

Put the dates on the plan. Connect Sync has to be upgraded by April 7, 2027. NTLM and legacy authentication should come off wave by wave, not in one weekend.

And agree what done means: every control backed by evidence an assessor can read, not a status in a ticket.

Identity matters because it is now where every access decision is made. Getting it right once, while the platform is being rebuilt anyway, is far cheaper than rebuilding the same gaps twice.

Book 02 has the full argument and the runbooks, with every external claim footnoted. Book 03, HR-Driven Identity, picks up where the facts in the directory should come from. Thank you.
