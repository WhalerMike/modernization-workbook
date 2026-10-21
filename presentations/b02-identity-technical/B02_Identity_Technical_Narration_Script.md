# Book 02 — Identity & Directory — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Identity & Directory: the technical deep dive

This is the technical deep dive for Book 02 of the Federal Modernization Workbook, Identity and Directory. It's for the architects and engineers who will actually run the move from Active Directory to Microsoft Entra ID.

It comes in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is assessing the forest: first what a standard account can learn without any elevated access, then the full privileged assessment and the evidence pipeline behind it. Part 2 is building the Entra ID target and migrating onto it: the sync, sign-in, group, service account, privileged access and Conditional Access decisions, then governance, the eleven-phase playbook, and a reference deployment that shows the whole sequence on one estate.

The slides show tables, flows and decision matrices. The code lives in the chapters and appendices; I'll point you to it rather than put it on screen.

## Slide 2 — Why this matters: identity now decides access

Why this matters. Federal policy moved the access decision off the network and onto identity. OMB M-22-09 requires centralized identity management, phishing-resistant multifactor authentication for staff, contractors and partners, and at least one device-level signal, and it says users should log into applications rather than networks. NIST SP 800-207 grants no implicit trust from network location: access is decided per session by dynamic policy. And CISA's Zero Trust Maturity Model makes identity the first of its five pillars, validated continuously at the optimal level.

So the identity provider is the policy decision point for the whole estate. Whatever it believes about a person, a group or a device is what gets enforced, everywhere, at machine speed.

Microsoft isn't retiring Active Directory; it says it continues to support and enhance it. The forcing comes from the direction of its investment. Cloud Sync is replacing Connect Sync, which retires once Cloud Sync reaches full functional parity. Microsoft recommends moving from AD FS to cloud authentication with password hash sync. All versions of NTLM were deprecated in June 2024, and NTLMv1 is removed in Windows 11 24H2 and Windows Server 2025. And since January 2026 you can convert a synced user to cloud-managed, one object at a time.

The trap is the lift and shift. Synchronize the forest as it stands, and stale accounts, undocumented trusts and synced privileged accounts arrive in the tenant, while the delegation and policy intent that the OU tree carried has nowhere to land.

## Slide 3 — What the migration actually has to move

What has to move. Chapters 02 through 04 make two points that drive everything in this session.

First, placement becomes attributes. In Active Directory, an object's position in the forest, domain and OU tree decides who administers it and which Group Policy applies. Move a user to another OU and its administrators, inherited policies and often its access all change without anyone editing the user. Entra ID has no tree. It governs objects by what they carry: attributes, memberships, role assignments and policy conditions. Two limits decide how far the usual answer, administrative units, gets you. Administrative units can't nest, so an OU tree becomes a flat set of units. An object can belong to at most thirty of them. And for synced users, Graph treats the extension attributes as read-only, because their source of authority is still Active Directory. So the values your rules match on are written on-premises and arrive with each sync cycle.

Second, the surface is bigger than users and groups. The program's inventory names eleven dependency types. The first five are what plans usually count. Types six through nine, DNS and DHCP, PKI, RADIUS and the Network Policy Server, and LDAP-bound applications, fail silently when AD goes away. Types ten and eleven, service principal names and trusts, have no direct counterpart in Entra ID.

Each dependency gets an adapter. The PKI, RADIUS and LDAP proxy adapters are critical, because they fail silently. The sync engine finishes last, because it's what keeps AD in production until everything else has moved. The rest of this session is how you find all of that, rebuild it, and prove it.

## Slide 4 — Module 1: Read-only discovery

Module 1: read-only discovery. An assessment team rarely gets privileged access on day one. Authorization paperwork, security review and trust between teams all take time. The program spends that window learning what the directory already tells every employee.

A standard domain account, with no rights beyond the default, can read most of what the migration plan needs. Starting there changes nothing in the directory, applies least privilege, NIST SP 800-53 control AC-6, to the assessment team itself, and turns the request for elevated access into a list built from evidence instead of a general request for Domain Admin.

## Slide 5 — What a standard account can read in a default forest

Here's what a standard account typically reads. Forest and domain topology, domain controllers, sites, subnets and site links are readable, which gives you scope, functional levels and the shape of replication. The OU hierarchy and Group Policy links are readable: that's the structure the attribute design later replaces. GPOs and their settings reports are usually readable, unless security filtering restricts a particular GPO. Users, groups, computers and service principal names are readable, which is your identity inventory and the start of service account discovery. Certificate templates and enrollment services sit in the configuration partition, so the AD CS dependency surface is visible too. AD-integrated DNS zones are often readable; test it. What you usually can't see is replication health and DNS server settings such as scavenging. Those need a right or server access, so they become a delegation item or an administrator-provided export.

Why is the default so broad? Read access is the sum of several default grants. Authenticated Users receives the general, public, personal and web information property sets on user objects. Pre–Windows 2000 Compatible Access receives list, read-all-properties and read-permissions rights on users, groups and InetOrgPerson objects. Its membership depends on a choice made when the domain was created: in the Windows 2000-and-later mode it contains Authenticated Users; in the older compatible mode, Everyone and Anonymous.

So in most domains a standard account reads most attributes of users and groups, but the exact result depends on the domain's history. The first step is therefore a pre-flight that tests what this account can actually read in this forest. Every later export records which access it relied on.

## Slide 6 — Where the default read boundary sits

The assessment report should never claim coverage it doesn't have, so you need to know exactly where the default read boundary sits. Four mechanisms set it, and several are commonly misstated.

Protected accounts and groups. The AdminSDHolder object holds template permissions for Domain Admins, Enterprise Admins, Schema Admins, the operator groups, krbtgt and others. A process called S D Prop runs every sixty minutes by default on the PDC emulator and resets those objects to match. It acts on current members only. An account removed from a protected group keeps admin count set to one unless someone clears it. So admin count lists accounts that are or were privileged: a good clean-up list, not the current privileged population.

Confidential attributes. Setting bit seven, value one hundred twenty-eight, of an attribute's search flags means reading it needs the control access right as well, which by default only administrators hold. You can still show where a capability is deployed without seeing the secret: with Windows LAPS, the presence and age of the password expiration attribute shows coverage. Legacy Microsoft LAPS is deprecated as of Windows 11 23H2, so a forest still on it has a finding before the assessment even reaches identity.

Secrets. Password hashes leave a domain controller only through replication, which needs Replicating Directory Changes and Replicating Directory Changes All. The assessment never requests those. But which accounts already hold them is a key later check: any holder that isn't a domain controller or the sync service account is a finding.

Restricted containers. Deleted Objects is visible only to System and Administrators. Restoring needs Reanimate Tombstone, which an assessment never needs. Fine-grained password policies belong to Domain Admins, so record them as not seen rather than inferring them.

Finally, report only measured coverage.

## Slide 7 — From gap list to a narrow, time-bound delegation request

Every gap read-only discovery couldn't close gets recorded with four facts: what's missing, the narrowest right or export that would close it, why the plan needs it, and whether there's a read-only substitute.

Replication health and domain controller event logs come from an administrator-run summary, a log export, or SIEM access; the event logs are where you see NTLM use. DNS server settings like aging and scavenging come from a DNS administrator export, because zone reads cover records but not server settings. The issued-certificate database comes from a CA administrator, and tells you which certificates must be reissued from a new PKI. Deleted Objects needs read on that one container for one named account. Fine-grained password policies need a Domain Admin export. And confidential attributes like LAPS and BitLocker recovery data are never requested at all: you report coverage only.

The gap list becomes a short written request, and it follows fixed rules, because the request is what makes the least-privilege position credible. Read only: no write, create, delete or permission rights, and never the rights that expose secrets. Specific: each line names the right, the exact object path and the business reason; "Domain Admin for the assessment" is not an acceptable line. Time-bound: each delegation expires with the assessment window, and the account's expiry is set to match. One named, dedicated account with no existing elevated memberships. And preferably an export: if the directory team can run the report and hand over the output, that beats granting a right. The directory team implements the delegation with its own change process.

Run it safely. Tell security operations first, because broad LDAP enumeration looks like reconnaissance, and Defender for Identity raises discovery alerts for it. The output is a map of the estate, so keep it encrypted on a dedicated workstation, record a SHA-256 hash of every file in a manifest and disable the account when you're done.

## Slide 8 — Module 2: Assessing the forest

Module 2: assessing the forest. Chapter 07 ends with a gap list. Chapter 08 fills it with the privileged half of discovery: the configuration partition, ACLs on OUs, every GPO's settings, DNS server configuration, the PKI containers and CA settings, and the delegation flags on every account.

The program's position is that the assessment is an evidence-producing process, not a set of scripts. Every run collects a fixed set of artifacts into a fixed directory layout, writes a manifest with a SHA-256 hash of every file, and commits the run to the program's Git repository. Appendix B carries the complete module, restored and corrected; Appendix C carries the identity-side module.

## Slide 9 — Eight collection areas, each on the narrowest right

The full assessment covers eight areas, run in a fixed order: forest topology, the OU hierarchy, Group Policy, DNS, AD CS, computers, users and groups, and trusts. Most of the forest is readable by any authenticated user. The parts that aren't are the reason Chapter 08 exists, so each collector runs on the narrowest right that works.

Topology, computers, and users and groups need only an authenticated user; delegation attributes are readable by default, though recursive group expansion is slow in big forests. The OU collector needs read permission on the OUs' security descriptors, because some ACLs aren't readable by default. Group Policy needs read on the GPOs and SYSVOL, plus the backup right through Group Policy Management delegation. DNS needs read on each DNS server, delegated on the server object. AD CS needs read on the Public Key Services containers and on each CA. And trusts: any user can list them, but verification needs domain administrator credentials.

Two rights the source design asked for are refused. DnsAdmins: Microsoft treats it as privileged, because its members control the DNS Server service, and Defender for Identity flags non-privileged members as a risk. Grant read on the DNS server object to a dedicated group instead. And standing Domain Admin: no assessment run uses one. Trust verification is the only step that needs those rights, and it runs separately under just-in-time elevation.

The host is a domain-joined Windows Server 2025 or Windows 11 machine with the Remote Server Administration Tools, at build 26100 or later. The account is a group managed service account, with delegated read and nothing more, so no password is ever stored. Two corrections from review: the AD CS administration module the source required isn't used by any function, and the PSPKI module is now optional, because its publisher no longer actively supports it.

## Slide 10 — Topology, OUs and Group Policy: what the inventory must get right

Three areas carry most of the planning weight.

Topology first. Active Directory has five operations master roles. Two are forest-wide, the schema master and the domain naming master. Three exist in every domain: the PDC emulator, the RID master and the infrastructure master. So a three-domain forest has eleven role holders to record, not five. The PDC emulator in the forest root is also the authoritative time source for the forest. Record every functional level and flag two conditions. A level below Windows Server 2016 blocks the domain controller refresh, because a Server 2025 controller can join only a domain at 2016 or higher. And mixed domain levels. Server 2025 is the first new functional level since 2016. Capture site links with cost and interval, and the subnet map: an unmapped subnet sends clients to arbitrary domain controllers.

Second, the OU hierarchy. The goal is to capture what the tree encodes so the attribute design reproduces intent, not structure. For each OU, record placement and size; its GPO links, preferably through Get-GP-Inheritance, which returns link order, enforcement, enabled state and inheritance blocking; its non-inherited access control entries, with built-in principals dropped, which are the delegations someone made by hand and become the administrative unit candidates; and a text rendering for review.

Third, Group Policy, the largest and most consequential artifact. Every live setting moves to Intune, moves elsewhere, or retires. Sort GPOs into three groups. Unlinked or empty ones are retirement candidates. Overlapping settings must be resolved first, because Intune's migration refuses conflicting values. Live settings need a decision. One correction: the source searched only OUs and the domain root, so site-linked GPOs looked unlinked. And Intune's Group Policy analytics imports XML reports under four megabytes, so check sizes in the manifest.

## Slide 11 — AD CS: the escalation patterns the assessment checks

AD CS matters twice in a migration. It issues the certificates devices, domain controllers and smart cards depend on, and its misconfigurations are among the most direct privilege-escalation paths in a forest.

The ESC naming comes from SpecterOps' 2021 research, which defined ESC1 through ESC8; its tooling now covers patterns through ESC16. Defender for Identity's definitions are the program's reference, and the assessment checks the ones it can see.

ESC1 is a template where the enrollee supplies the subject, an authentication extended key usage is allowed, no manager approval or authorized signature is required, and broad groups can enroll. ESC2 is a template with the Any Purpose usage, or none at all. ESC4 is a template ACL that gives a broad group rights such as Full Control or Write DACL. ESC6 is the CA flag that lets every requester specify the subject alternative name for every template; Microsoft's fix is to clear the flag and restart the service. ESC7 is broad groups holding Manage CA or Manage Certificates. That one needs the CA's own security settings, which Appendix B's collector doesn't read; Defender for Identity assesses it where a sensor runs on the CA.

The correction that matters most: the source's ESC1 check tested for the Digital Signature key usage. Almost every template has that, so it flagged nearly everything. The check has to test the extended key usage for an authentication purpose: client authentication, smart card logon, PKINIT client authentication, or Any Purpose. And a template that passes is a candidate only if a CA actually publishes it and broad groups can enroll.

Report only. Remediation belongs to the PKI owner, through Book 07. The same inventory also tells you whether user certificates can move to Entra certificate-based authentication.

## Slide 12 — Delegation, privileged groups and service accounts

Every computer object is a migration decision: Entra join, hybrid join, Azure Arc, retirement, or keep in Active Directory. The inventory carries the delegation attributes, and the source got two things wrong here, so classify by what's actually set, in this order.

Trusted for delegation set to true is unconstrained delegation. It lets a service impersonate any user who authenticates to it, to any service. Domain controllers are expected to have it, so exclude them as Defender for Identity does; every other unconstrained entry becomes a critical issue. A target list plus trusted-to-authenticate-for-delegation is constrained delegation with protocol transition. A target list alone is constrained, Kerberos only. The source labeled protocol transition even without a target list. And resource-based constrained delegation, which the source missed entirely, is configured on the resource side.

Staleness: Last Logon Date is a converted timestamp that can lag the true last logon by up to two weeks, so it's good enough for a ninety-day test, not a seven-day one. Pair it with Password Last Set, and treat a computer as stale only when both are old.

For users, expand the eight privileged groups recursively: Domain Admins, Enterprise Admins, Schema Admins, Administrators and the four operator groups. Then report orphaned admin count accounts, using recursive membership; the source's direct match missed nested members and over-reported orphans.

Service accounts come in four kinds. User accounts with service principal names are Kerberoastable and the highest priority to replace. Group managed service accounts span servers and stay the default for multi-server services. Delegated managed service accounts exist only in Server 2025 domains and disable the original password.

Two limits matter in large forests: a domain controller returns at most five thousand values of a multivalued attribute per response, and a principal can be in at most one thousand fifteen groups.

## Slide 13 — Trusts: decode the bits, state the direction plainly

Trusts are where undocumented history usually hides. Each trust is a trusted domain object in its domain's System container, and Get-AD-Trust returns them all.

Decode the trust attributes from the published bit values in the Active Directory technical specification, not from memory. One means non-transitive. Two, uplevel only: Windows 2000 and later clients. Four, quarantined domain: SID filtering applies. Eight, forest transitive: a cross-forest trust between forest root domains. Hex ten, cross-organization: the partner isn't part of your organization. Hex twenty, within forest. And hex forty, treat as external: a forest trust filtered as if it were external. The specification also defines later bits, for AES keys, RC4 and TGT delegation control, so record the raw value as well as the decoded list. That way, bits added later aren't lost.

Direction is relative, and access flows the opposite way to trust: members of the trusted domain can reach resources in the trusting domain. Seen from one domain, an inbound trust lets this domain's users reach the partner's resources, and an outbound trust lets the partner's users reach resources here. The source had this reversed. So for each trust, the assessment states plainly which side's users can reach which side's resources.

Then rate posture. Selective authentication on is hardened. SID filtering on is standard. Neither is a finding.

Verification: the source called Test-AD-Trust, which isn't a cmdlet in the ActiveDirectory module. Use netdom trust with the verify switch, which checks the secure channel secrets, or netdom query trust with verify for every outbound trust. Both need administrative credentials, so verification runs as its own elevated step, outside the scheduled collection.

Finally, a forest trust doesn't convert into anything in Entra ID. It identifies a partner whose access has to be redesigned with cross-tenant access settings, which Module 4 covers.

## Slide 14 — Every run is evidence: manifest, Git and drift

What makes a run evidence is the pipeline around the collectors.

The orchestrator runs them in the fixed order and writes the assessment manifest: a new GUID for the run; the domain, host and account; the start, end and duration; the staleness threshold; and every output file with its size, time and SHA-256 hash. A failed step is recorded in the manifest rather than stopping the run, so a partial run is visible as partial. Anyone holding the repository can recompute the hashes and show nothing changed after collection.

Then one run, one commit. The reference design uses a self-hosted Gitea instance. Each run gets its own branch, named for the domain and timestamp, and the multi-file contents endpoint commits the whole run, manifest included, as a single commit. The source committed one file per API call, hundreds of commits per run.

Issues are raised automatically for two classes only: critical PKI patterns, and unconstrained delegation on accounts that aren't domain controllers. Everything else goes to the planning documents: GPO reports to the Intune plan, computers to the device plan, the PKI report to certificate-based authentication readiness, trusts to the partner access plan, and users and groups to the identity design.

Drift: run weekly and compare with the last run. A changed hash tells you that something changed. To say what, compare parsed objects by a stable key, a GUID or SID, and exclude timestamps. Schedule under the managed service account, so no password is stored.

Handling: the data is a map for an attacker. Encrypt it, restrict the repository, keep runs at least twelve months and delete after thirty-six unless a legal hold applies, sign the module, and keep the API token in a credential store, never in a URL. Appendix B lists sixteen corrections made to the source design.

## Slide 15 — Module 3: Building the Entra ID target

Part 2: building the Entra ID target and migrating onto it. Module 3 is the target design.

The chapter's premise fits in one sentence. In Active Directory, where an object sits decides what applies to it. In Entra ID, what an object says about itself decides. So the target has to be built from attributes, not copied from containers. The environment throughout is a Microsoft 365 Government Community Cloud tenant, which uses the worldwide Microsoft Graph endpoint, not the separate endpoints that GCC High and DoD use. Check each feature against the government service descriptions, because some reach GCC later.

## Slide 16 — Decompose first: where each AD construct lands, and its license

Before any object moves, decompose the AD identity model into its parts, because each has its own path.

OUs do three jobs, and each goes somewhere different. Group Policy scoping becomes Conditional Access and Intune profiles, targeted by group membership, not container. Administrative delegation becomes administrative units, which are free to create, though each AU-scoped administrator needs P1. Logical organization becomes dynamic groups and attributes. The forest maps to the tenant: one trust boundary, no domain trusts inside it, and verified domains are routing suffixes, not security boundaries. Trusts become B2B and cross-tenant access settings. AdminSDHolder has no equivalent; Privileged Identity Management, which makes assignments eligible and time-bound, and protected actions, which demand an authentication context before high-impact permissions are used, together serve its purpose. And Schema Admins has none: Microsoft manages the schema.

This is the design principle: Entra ID inverts the governance model. Attributes decide memberships, and memberships decide policy. That's why attribute quality gates everything after it.

Licensing gates the governance features. Conditional Access needs P1. Dynamic groups need P1 per unique member. PIM, including PIM for Groups, and risk-based Conditional Access need P2. As of October 2026, access reviews and entitlement management need Entra ID Governance for the member users involved, with only some capabilities left under P2, and Lifecycle Workflows need Governance. Conditional Access for workload identities is a separate Workload Identities Premium license. The chapters assume P2 for everyone and Governance for the governed populations.

One date to act on: the preview member-of operator ends November 3, 2026. After that, dynamic groups, dynamic administrative units and auto-assignment policies that use it freeze. Replace those rules now.

## Slide 17 — Choosing the sync engine: Cloud Sync unless a Connect-only need applies

The first hybrid-period decision is the sync engine. Connect Sync is the long-standing, full-featured engine on a Windows Server. Cloud Sync is a lightweight agent with its configuration in the cloud, and Microsoft now calls it the strategic direction: new features are built primarily on it.

Here's the comparison from Microsoft's decision guide as of its October 2026 revision. Connect Sync runs on a server; Cloud Sync runs as agents, which can sit on existing domain controllers. Both handle connected multi-forest; only Cloud Sync handles disconnected forests, which matters after mergers. For availability, Connect has one active server with a staging standby; Cloud Sync runs multiple active agents with automatic failover. Scale: Cloud Sync supports up to a hundred fifty thousand objects per AD domain and groups up to fifty thousand members; Connect has no stated object limit and goes to two hundred fifty thousand members. Connect has advanced sync rules and cross-forest references; Cloud Sync has neither. And Cloud Sync can provision groups from Entra ID back to AD, and test with on-demand provisioning; Connect can't.

Two corrections to older guidance. Group Writeback version two in Connect Sync was a preview that Microsoft discontinued on June 30, 2024; Cloud Sync's group provisioning to AD replaces it. And Cloud Sync now handles Exchange hybrid writeback, so Exchange alone no longer forces Connect.

The program's rule: Cloud Sync for new deployments, and plan to migrate existing Connect installations. Stay on Connect only where a forest needs something Cloud Sync doesn't do: more than a hundred fifty thousand objects in a domain, groups over fifty thousand, advanced rules, cross-forest references, or attribute merging. Both engines can run in one forest with mutually exclusive scopes, so you can move in stages. And never run two Connect servers in active mode against one tenant.

## Slide 18 — Sign-in method and object matching

The second decision is where passwords are validated. With password hash sync, validation happens in the cloud against a synchronized hash of the password hash, with no extra infrastructure, and it survives an on-premises outage. Pass-through authentication validates in the cloud after an on-premises agent checks AD; Microsoft recommends at least three agents in production, treated as tier zero, and it doesn't survive an outage. Federation with AD FS validates on-premises and needs AD FS and Web Application Proxy farms, load balancers and certificates.

Leaked-credential detection needs password hash sync. Microsoft recommends enabling it whichever method you choose: it's the fallback if agents or federation fail, and organizations that had it on recovered from ransomware outages in hours rather than weeks. The failover is manual. So the program's position is password hash sync preferred everywhere, pass-through transitional, and AD FS a decommission target.

Then, matching. When sync adds an object that might already exist in the cloud, Entra ID tries a hard match first: the source anchor, by default the consistency GUID, against the cloud object's immutable ID. Without one, a soft match on UPN or primary SMTP address, which only works if the cloud object has no immutable ID yet. Either one overwrites the cloud object's attributes, including the password hash, so clean AD first. Two tenant settings block soft match and hard-match takeover; Microsoft advises leaving both blocked except in a planned matching window.

And since July 1, 2026, Entra ID blocks a hard match onto a cloud account that already has an on-premises object identifier, or holds or is eligible for a privileged role, for both engines. Don't plan to take over cloud administrator accounts by sync.

## Slide 19 — Groups and service accounts: one recorded decision per object

Groups and service accounts each get one recorded decision per object.

For groups, the AGDLP model doesn't map one to one, because Entra ID has no group scope. So every AD security group gets one of five decisions. Used only for on-premises resource ACLs: keep it in AD and don't sync it, since a cloud copy adds nothing. Used for both on-premises and cloud: synchronize it, with AD as the source of authority during the transition. Used only for cloud resources: convert it to cloud-only. Membership follows attributes exactly: convert it to a dynamic group. No members or no assignments: retire it. Where a cloud-only group still has to guard a Kerberos application, Cloud Sync provisions it back to AD as a universal group.

Nesting works for fewer things in Entra ID. Conditional Access follows nested members, but group-based application assignment and group-based licensing don't cascade to nested groups. So flatten deep AGDLP chains to direct membership or a dynamic rule, and record the mapping for the audit trail.

For service accounts, the rule is to eliminate stored secrets. A traditional account that calls Microsoft 365 or other Entra-protected APIs becomes an application registration with a certificate, or a federated credential where the host has an OIDC issuer. One whose workload runs on an Azure resource becomes a managed identity, user-assigned preferred. On-premises Kerberos workloads, and standalone MSAs, go to a group managed service account. A gMSA whose workload moves to the cloud goes to workload identity federation.

A federated credential has three working parts: the issuer, a subject that must match exactly with no wildcards, and an audience. An application holds at most twenty, and a wrong subject fails only at token exchange, so test each one. Every application gets two human owners, and no client secrets in production.

## Slide 20 — Privileged access: no standing admin, two break-glass accounts

Privileged access has one core rule: no standing access to privileged roles. Every privileged assignment is eligible and activated just in time. The only permanent active assignments are the two emergency accounts. The mapping from AD groups is the program's design, not an equivalence.

Domain Admins maps to Global Administrator, held by very few; Microsoft recommends fewer than five, and most Domain Admin duties map to narrower roles. Enterprise Admins maps to Privileged Role Administrator, with its own approval chain. Account Operators becomes User Administrator scoped to administrative units; Conditional Access can't target AU-scoped assignments, so put those administrators in a group for policy targeting. Server Operators moves to Intune or Azure role-based access, Backup Operators to service-specific roles, and Group Policy Creator Owners to the Intune Policy and Profile Manager role.

The PIM standards: Global Administrator and Privileged Role Administrator activate for at most four hours, with approval, justification and a ticket number. Security Administrator gets eight hours with approval. Most other admin roles get eight hours without approval, and the reader roles twelve. Eligibility expires within twelve months and renews through an access review. And because PIM's own MFA setting can be satisfied by an earlier sign-in, the program uses PIM's authentication context option to force fresh, phishing-resistant authentication at activation. Configure named approvers outside the requester's chain, because with none configured, PIM falls back to active admins and can lock the tenant.

Emergency access: two cloud-only accounts in the onmicrosoft domain, permanent active Global Administrator, on a passkey security key or certificate-based authentication, each credential stored separately. Microsoft's mandatory MFA for admin portals applies to them too, so a password in a safe isn't enough. Exclude them from every restrictive policy, alert on every sign-in, and test them at least every ninety days.

## Slide 21 — Conditional Access: personas, a baseline, and a staged rollout

Conditional Access replaces the logon restrictions and network controls that Active Directory enforced through Group Policy. The program organizes it around personas: populations with distinct needs and risk.

Internals are employees and contractors, identified by the worker type code. Admins are users eligible for or holding privileged roles, identified by account type or a group of PIM-eligible users; target them by group, because role targeting supports built-in directory roles only, not AU-scoped or custom ones. Externals are guests from partner organizations, Guests are ad hoc external users, Service accounts are single-tenant workload identities, and Break-glass is the dedicated exclusion group.

The baseline set runs from CA001 through CA017. A few anchors. CA001 blocks legacy authentication for all users. CA003 requires the phishing-resistant authentication strength for admins, with a four-hour sign-in frequency. CA006 requires MFA for internals, phishing-resistant as the end state. CA008 blocks internals outside trusted countries. CA013 uses Microsoft's newer require risk remediation control for high user risk; it isn't supported for guests, so CA012 blocks risky guest sign-ins instead. CA015 blocks workload identities outside trusted networks. CA002, the old break-glass grant policy, is retired: a policy can't create an exemption; the exclusion on every other policy is the exemption. Appendix C carries Graph JSON templates, all created in report-only state. Book 04's library is authoritative and adds CA018 through CA038 for the CISA BOD 25-01 baseline.

Authentication strengths name what's accepted: phishing-resistant MFA is Windows Hello for Business, FIDO2 passkeys, or multifactor certificate-based authentication. Authenticator push and phone sign-in aren't phishing-resistant on their own.

Rollout has three stages: report-only for two to four weeks, a two-week pilot, then phased waves over four to eight weeks, each behind a monitoring gate. And never switch an all-users policy straight from off to on. Confirm the break-glass exclusion, and that both emergency accounts still sign in.

## Slide 22 — Module 4: Migrating, governing and proving it

Module 4: migrating, governing, and proving it. Chapter 10 states the finish line: the migration ends when governance runs on its own. Joiners, movers and leavers flow from the HR record without a ticket, every privileged session starts with a phishing-resistant credential, and drift shows up in a diff instead of an incident.

We'll cover the governance machinery, the authentication roadmap and the eleven-phase playbook from Chapter 10, then Chapter 11's reference deployment, which runs the whole sequence on one representative two-forest estate and shows what the assessor receives at the end.

## Slide 23 — Governance runs as a loop: joiner, mover, leaver, review

Governance in Active Directory was mostly a ticket queue: someone asked for membership, someone added it, and nobody took it away. The target replaces that with a loop. HR-driven provisioning creates and updates the account. Lifecycle Workflows run the joiner, mover and leaver tasks. Access packages grant access with an expiry. And access reviews remove what's no longer justified.

Lifecycle Workflows act on accounts that already exist; they don't create them. The time-based triggers key on the native employee hire date and leave date attributes, with an offset of up to a hundred eighty days. For synced users, those dates must be synced into Entra ID first.

Pre-hire runs seven days before the hire date: confirm the account exists, disabled; request the onboarding access package; and generate a Temporary Access Pass emailed to the manager, so the new hire registers a phishing-resistant credential on day one. Joiner runs on the day: enable the account, assign licenses by group, send the welcome email, request the department package. Mover fires on a change to department, division code or position category: remove the old department's package, request the new one, let dynamic groups and a dynamic administrative unit adjust, and review what's left. Leaver runs on the leave date: disable the account, revoke refresh and session tokens, remove access packages and then licenses after the mailbox is converted, remove group memberships at thirty days and delete at ninety.

Two cautions. The delete task doesn't support users holding Entra roles or role-assignable group membership, so remove privileged access first. And a synced user deleted only in the cloud comes back on the next sync; delete it in AD.

Reviews close the loop. PIM-eligible role assignments are reviewed quarterly by the security team, not by self-review, which leaves role-assignable groups out; that review is the AC-6(7) evidence. Sensitive groups go quarterly to owners, guests quarterly to sponsors.

## Slide 24 — Phishing-resistant authentication, then the legacy cutoff

Authentication modernization starts from the federal requirement. OMB M-22-09 requires phishing-resistant MFA for staff, contractors and partners, and requires agencies to stop supporting methods that fail to resist phishing, such as SMS and voice codes, for routine access. It names PIV as the simplest route. Its targets were set for the end of fiscal year 2024, so as of October 2026 these are requirements to meet, not goals.

That reorders the roadmap. Older plans put smart-card sign-in last. But a federal workforce already carries PIV or CAC cards, so Entra certificate-based authentication is the fastest path: the credential is issued, and it works directly against Entra ID without a federation server.

Phase one, privileged accounts: FIDO2 passkeys with attestation enforced, plus PIV or CAC through certificate-based authentication where the admin holds a card, in four to six weeks. Phase two, every PIV and CAC holder through certificate-based authentication. Phase three, managed Windows devices on Windows Hello for Business. Phase four, everyone else, including mobile, on passkeys in Microsoft Authenticator. Those last three are eight to twelve weeks each, and all four methods meet the built-in phishing-resistant strength. For NIST control IA-2(6), separate device, the program counts PIV cards and FIDO2 keys; Windows Hello lives in the device gaining access, so it isn't counted for privileged accounts.

The authentication methods policy: SMS and voice off for staff. Temporary Access Pass is one-time use with a one-hour life, against Microsoft's multi-use default. Passkey registration needs MFA in the last five minutes.

Then the legacy cutoff. Discover remaining legacy sign-ins in the logs. Remediate onto OAuth, the Graph mail APIs, or a supported relay. Block with CA001. And monitor for thirty days until there are zero successful legacy sign-ins.

## Slide 25 — The eleven-phase playbook: each phase gated on validation

The migration runs in eleven phases, zero through ten. Each has prerequisites, steps, validation criteria, a rollback procedure and a duration estimate, and a phase starts only when the previous one's validation criteria are met. The durations are planning estimates, not measured results; the total runs forty to seventy weeks.

Phase zero is assessment: the forest and identity inventories in Git, a UPN remediation plan, a recorded decision for every group, and every service account classified. Phase one deploys sync: at least two Cloud Sync agents, or Connect where required, password hash sync on, validated by object counts within one percent and no sync errors. Rollback removes objects from scope, recoverable for thirty days. Phase two sets the sign-in method and puts every Conditional Access policy in report-only, with the emergency account sign-in tested and logged.

Phase three migrates groups, with dynamic membership validated within two percent. Phase four modernizes service accounts, high-risk first, running old and new credentials in parallel for thirty days. Phase five rolls out PIM: zero permanent active assignments except the emergency accounts. Phase six enforces Conditional Access in waves, but only after MFA registration passes ninety-five percent in each targeted population. Phase seven is the phishing-resistant roadmap, validated by every privileged account on FIDO2 or certificate-based authentication, over eighty percent of managed-device users on Windows Hello, and over seventy percent of all users on a phishing-resistant method.

Phase eight cuts off legacy authentication after thirty consecutive days with zero legacy sign-ins. Phase nine decommissions federation, where it exists: staged rollout moves users to password hash sync in waves, then each domain is converted to managed with Graph PowerShell, never the retired MSOnline cmdlet, and AD FS stays recoverable for ninety days. Phase ten is steady-state governance: workflows, access packages, reviews and drift detection running, and the operations runbook committed to Git.

## Slide 26 — Proving it: logs, FedRAMP 20x indicators and drift

Proving it starts with logs, because Entra ID keeps them only briefly. Sign-in and audit logs are kept seven days on the free tier and thirty on P1 or P2. Risky sign-ins reach ninety days only with P2. Microsoft Graph activity logs aren't retained at all; they're export only. And upgrading a license doesn't recover older data. So stream every category to a Log Analytics workspace and keep sign-in and audit logs three hundred sixty-five days.

On top of that, scheduled detections: stale accounts over ninety days; PIM activation between ten at night and six in the morning, after converting from UTC; interactive sign-ins with no Conditional Access applied; application credentials expiring within thirty days; any emergency account sign-in, which is critical; and more than fifty membership changes to one group in an hour.

For compliance, Compliance Manager has templates for NIST 800-53 Revision 5 and FedRAMP Moderate, but they don't produce indicator evidence, so treat them as a readiness check. Under FedRAMP 20x's Consolidated Rules for 2026, the controls map to Key Security Indicators. Account management maps to automating account management, evidenced by the workflows and reviews. Least privilege maps to ensuring least privilege and authorizing just-in-time, evidenced by groups and PIM. Authentication maps to adopting passwordless methods. Non-user authentication maps to securing non-user authentication, the service account work. And event logging maps to logging event types and reviewing logs.

Drift lives in Git. The identity assessment commits its JSON to an identity baseline branch, a weekly scan on Sunday at two in the morning compares against it, and drift opens an issue with the diff. The rule: close each finding at the source, never by editing the copy. Be clear about maturity: the comparison covers user additions and removals today; attribute, membership and policy diffs are planned.

## Slide 27 — Reference deployment: one estate, five gated phases

Chapter 11 puts it together on one representative estate. It's a framing pattern, not a report on a real engagement: the agency is a composite and the counts are illustrative orders of magnitude.

The archetype has about fifty thousand users in two forests, one inherited from an absorbed component, joined by a forest trust nobody documented or owns. About seventy thousand computer accounts, twelve thousand groups, several thousand service accounts, and about ninety SQL Server instances. The destination is Microsoft 365 GCC. Each phase ends with a signed readiness bundle, and the next phase starts only from that bundle.

Discover: the read-only survey of both forests, plus the service account scan. About four hundred accounts carry SPNs; about sixty rate critical and a hundred high. Every SQL Server SPN is captured with a pre-migration tag, because a missing or wrong SPN silently falls back to NTLM. About ten instances raise findings because their service accounts can't be attributed.

Normalize: both forests have an Operations OU holding different people. The agency builds an organizational registry and resolves the collision there, not by renaming groups. About two thousand users and several hundred service accounts get findings, resolved by the governance team, never auto-assigned.

Map: an adapter contract for each surface. Four carry the risk. Sync, where cross-forest manager chains decide the engine, since Cloud Sync doesn't support cross-forest references. PKI and RADIUS, which move in lockstep because 802.1X EAP-TLS depends on the same CA. And SQL Server, whose Entra authentication needs SQL Server 2022 or later and isn't supported on failover cluster instances.

Migrate: every operation is a provenance-chained record. About three hundred drift findings appear; one P1 stops a SQL Server migration until a role assignment is reduced. Validate compares the SPN inventories; about three P1 findings are re-registered.

## Slide 28 — What the assessor receives, and what the agency keeps

Last, what all this produces. During migration the program classifies drift into five classes. Schema drift: an attribute encoding that doesn't match the current schema version. Provenance drift: a state change with no provenance event in the chain, which halts the run. Semantic drift: a value slipping back into a deprecated naming pattern. Authorization drift: a Conditional Access policy that contradicts the assurance level recorded for the principal,. And identity drift: a principal in the tenant with no counterpart in the registry. Be honest about maturity. Schema and provenance detection are shipped, semantic is partial, and authorization and identity detection are design-only; today, people reviewing the assessment modules find those.

From Phase 2 on, the agency can produce an evidence bundle at any time: each phase's signed readiness bundle, both phase-tagged SPN inventories and their comparison, the provenance chain for every adapter operation, every drift finding with its remediation, and the GCC boundary finding with its compensating controls and when each was last verified.

Who reads it matters. FedRAMP authorizes cloud service offerings, and third-party assessment organizations assess providers. The agency's own system is authorized by its authorizing official under the Risk Management Framework, SP 800-37, which supports ongoing authorization. So the bundle goes to the security control assessor and the authorizing official, as it happens, not assembled over most of a year afterward.

And it belongs to the agency. When the integrator leaves, the registry, schemas, findings and evidence stay for the next authorization cycle.

So, from Monday: start read-only discovery with a pre-flight; turn the gaps into a narrow, time-bound request; make every run evidence; and gate every phase on its validation. Chapters 07 through 11 and the appendices carry the full detail and the code. Book 03, HR-Driven Identity, picks up where the attributes should come from. Thank you.
