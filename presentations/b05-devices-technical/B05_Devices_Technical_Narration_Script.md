# Book 05 — Devices & Endpoints — Technical Deep Dive — narration script (practice copy)

## Slide 1 — Devices & Endpoints: the technical deep dive

This is the technical deep dive for Book 05 of the Federal Modernization Workbook, Devices and Endpoints. It's for the architects and engineers who move a domain-joined fleet onto Intune, and its servers onto Azure Arc.

It comes in two parts of about twenty-five minutes each, and four modules you can watch separately. Part 1 is the endpoints. First, how a new device is governed from the moment it powers on, and the three paths an existing estate can take to the same end state. Then the Group Policy sunset: how every GPO is inventoried, classified, replaced and retired, and the policy library that replaces it. Part 2 is servers and the run state: bringing servers under Azure Arc with a day-one baseline, and then operating and evidencing the whole fleet once Intune is the authority.

The slides show tables, flows and decision matrices. The scripts and policy payloads live in the chapters and in Appendix A; they're marked there as illustrative and untested against a production tenant, and I'll point you to them rather than put them on screen.

## Slide 2 — Why Group Policy can't come to the cloud

Why this matters. For twenty years Group Policy did a great deal of governance without anyone writing it down. A computer sat in an organizational unit (OU), GPOs linked to that OU and its parents applied in a fixed order, and the closest container won. That one structure was the targeting model, the precedence model, the delegation model, a timing guarantee and an evidence source.

Microsoft's planning guidance says it plainly: Group Policy enforcement isn't possible on cloud-native endpoints, which are joined to Entra ID, not to a domain. Intune can deliver most of the settings, but each mechanism changes. Assignment to groups is flat. Assignment filters evaluate device properties at enrollment and check-in, up to two hundred per tenant. A platform script runs once and times out after thirty minutes; Remediations rerun every twenty-four hours by default. There's no built-in answer for mapped drives. Devices check in about every eight hours instead of every ninety minutes. And per-setting status is reported after check-in, so it can lag.

The conflict rules change too. When two Intune configuration policies set one setting differently, the conflict is reported and the setting may not apply at all. Compliance policies take the most restrictive value. And on a hybrid device that gets both a GPO and an MDM policy, Group Policy wins by default. MDM wins over GP reverses that only for the Policy CSP; for other CSPs, such as Defender, Microsoft warns of a race with no guaranteed winner.

So the program's rule is regenerate, not copy. Microsoft's own guidance is not to lift and shift: identify the mandatory settings, compare them with MDM, and treat the gaps as blockers.

## Slide 3 — The hybrid-join trap, and where each device fact lives

Two more ideas from the first part of the book frame everything in this session.

First, the hybrid-join trap. Converting a domain-joined fleet to hybrid join is close to a tenant-wide switch. Extend the sync scope to the computer OUs, publish a service connection point in each forest, or push the same two values by GPO, and every Windows device's Automatic Device Join task reads it and registers itself, retrying every hour. Nothing in that path checks ownership, organizational position or approval. Microsoft's guidance has two halves: Entra join is the default for new, refurbished or reset devices; hybrid join gives existing domain-joined devices a cloud identity with minimal impact, but it shouldn't be long term or the end goal. Converting a hybrid device to Entra join later needs a reset, and hybrid devices need periodic line of sight to a domain controller. Done ungoverned, the waypoint becomes the destination.

Second, where the truth lives. A modern laptop is described by a procurement record, an Autopilot registration, an Entra ID device object, an Intune record and a Defender machine; a server adds an Arc resource. The program decides, fact by fact, which one is authoritative. Procurement owns the business facts. The Entra object owns identity and join type. Intune owns management and evaluates compliance; Entra's is-compliant flag only reports it. Defender owns threat and exposure. Arc owns management for servers.

Correlate on the right key: the Entra device ID across Microsoft records, the serial number to procurement, and the Azure resource ID for Arc. And delete the Entra object last, because deleting it deletes the BitLocker recovery keys.

## Slide 4 — Module 1: Intune-first onboarding and the paths

Module 1: Intune-first onboarding and the paths. Migration takes a device that already exists and brings it under governance. Intune-first refuses to let an ungoverned device exist in the first place.

Chapter 04 covers devices bought after the modernization decision, net-new only; the program keeps the phrase Intune-first for that doctrine and doesn't use it for replacing Group Policy on the existing fleet. Chapter 05 then covers how existing workstations and servers reach the same end state, by one of three paths that share a single runbook.

## Slide 5 — Intune-first: five pillars and a five-phase process

The doctrine is simple to state. A net-new asset is governed from the moment it first powers on: by Intune for endpoints, and by Azure Arc for servers. There is no state where it joins on-premises Active Directory to wait for a migration, gets provisioned by Configuration Manager and co-managed later, runs without an organizational assignment, or reaches production without a compliance evaluation.

Five pillars carry it, and they're the program's doctrine, not Microsoft requirements. No ungoverned device, ever; quarantine is the safety valve. Procurement is the first governance step: the assignment is set when the purchase order is issued, the way HR feeds user provisioning. Zero-touch only. One management plane per asset, so no greenfield Configuration Manager, Group Policy or hybrid join. And quarantine on failure: an onboarding failure produces a quarantine entry and a ticket, never a degraded production device.

Every asset follows the same five phases. Procure, with the assignment validated against the organizational registry. Pre-stage, where the vendor record carries it. Position, where the governance pipeline commits a mapping keyed on the serial number. Note that phase 3 doesn't pre-stage an Entra object; classic Autopilot creates that automatically at registration, so phase 3 confirms the registration carries the right group tag. Provision, zero-touch. And validate.

The assignment comes from the first source that can supply it: procurement, then the vendor carrier, then derivation from the user, and finally an explicit unpositioned marker. A known nowhere is still a value a rule can match. The latency target is fourteen calendar days from purchase order, five for expedited orders.

## Slide 6 — Windows in a GCC tenant: Autopilot or device preparation

Microsoft now ships two Windows provisioning solutions. Windows Autopilot device preparation is a re-architecture with simpler configuration and near real-time reporting; classic Windows Autopilot remains more feature-rich. The rows on the left are the differences that matter. Device preparation needs no registration, so it has no group tag. It can't do hybrid join, pre-provisioning or self-deploying mode. It applies up to ten apps and ten scripts during setup, can't hold the desktop until user configuration lands, and doesn't use the Enrollment Status Page. But it's available in GCC High and DoD, where classic Autopilot isn't.

The workbook assumes a Microsoft 365 GCC tenant. Intune has no separate GCC instance: GCC uses the commercial Intune service, so both solutions are available. Only GCC High and DoD use the separate government instance.

The program's default for standard hardware in GCC is classic Windows Autopilot, user-driven, with Entra join, and OEM or reseller registration carrying a group tag. The reason is pillar 2. Classic Autopilot's registration carries the procurement attribute, the group tag and the purchase order ID, from the vendor to the Entra device object before the device is powered on. Device preparation adds devices to a group at enrollment, so the assignment has to come from the procurement mapping table afterward.

Use device preparation where its advantages matter, such as faster provisioning or a tenant that might later move to GCC High. It needs Windows 11 24H2, or 23H2 or 22H2 with KB5035942, and automatic enrollment. And the first user must be allowed to join devices: on that path, the user's own join permission brings the device in. Never use either with hybrid join for new devices.

## Slide 7 — Carrying the purchase order to the device's configuration

Here's how the procurement decision reaches a device's configuration without anyone touching it.

The purchase order carries an organizational node code and the serial number. The OEM, reseller or distributor registers the hardware hash at purchase, which is also what makes it zero-touch. A supplier can register devices only after the organization's Global Administrator authorizes it; Microsoft calls out that this one feature needs that role, so plan the consent as a one-time, recorded approval per supplier. The group tag Intune stores on the registration appears on the Entra device as an Order ID physical ID, and the purchase order as a Purchase Order ID. A dynamic group rule matches on them, and the Autopilot profile, compliance and configuration are assigned to that group. The program's convention is that the tag holds the node identifier, never a free-text department name, so a reorganization changes the mapping table, not thousands of registrations.

Enrollment restrictions give the doctrine its enforcement point. Block personally owned Windows enrollment, and Intune authorizes corporate enrollment only through approved paths, of which Autopilot is one. Device preparation devices are blocked unless they're pre-identified with corporate identifiers or bound by device association. An unregistered device then fails with an enrollment restriction error, which is pillar 5 in practice.

Naming: fifteen characters or fewer, letters, numbers and hyphens, not all numbers. The program uses a short asset-class prefix plus the serial macro, because the serial is the procurement join key. Position goes in the tag.

And the Enrollment Status Page: use a custom one, block on a Selected list of security-critical items, and don't let users bypass it for those.

## Slide 8 — The day-zero baseline, and the four exception paths

A net-new device should arrive at a known baseline before anyone uses it, in two halves.

Compliance decides access. First set the tenant-wide setting, mark devices with no compliance policy assigned as Not compliant, so an unassigned device can't pass Conditional Access by default; Microsoft recommends this whenever compliance feeds Conditional Access. The Windows policy typically requires BitLocker, Secure Boot and code integrity; firewall, TPM, antivirus and antispyware; current Defender intelligence with real-time protection; and a minimum OS. With Defender for Endpoint connected, add a machine risk score ceiling.

Configuration sets the device up. Start from the Windows security baseline, version 25H2 being the latest, and the Defender for Endpoint baseline. Existing baseline profiles don't move to a new version automatically, and different baselines can set the same setting differently, so review overlaps. Then BitLocker with escrow to Entra ID, Windows Hello for Business, firewall and Windows LAPS. Because these devices never had Group Policy, there's nothing to conflict with. That's the payoff.

Four exception paths cover what can't follow the main path, each with written justification, a compensating control and an audit entry. A: personal devices, governed at lower assurance. B: Linux that Intune can't manage, under Arc. C: Server 2019 and 2022, under Arc without Entra sign-in, which is Microsoft's support boundary. D: Windows that can't enroll, such as instrument PCs or disconnected enclaves.

Path D can't pass a compliant-device policy. So isolate it first. Manage its Defender settings through security settings management, which doesn't make it compliant. And if its users must reach a protected resource, record a named exclusion, paired with a policy that blocks that group from every device not on the approved list.

## Slide 9 — Three paths to one end state: governed, manual and retrofit

Chapter 05 is about how the existing estate gets there. The workbook's sources described three separate kits that repeated most of the same steps, because the destination is the same: servers in Arc, workstations in Intune, NTLM restricted after it's measured, clean service principal names, hardened SQL Server, and Conditional Access enforced. What differs is who holds the decision record.

The rule all three obey: the control plane governs, the data plane executes. The program holds desired state, observes, classifies drift and reconciles. Entra ID, Intune, Azure Policy and Active Directory do the runtime work. An adapter may call a management API; it never sits inline in a sign-in.

Every path runs four phases in order, and nothing is restricted until it has been measured. Observe is read-only. Onboard attaches the management planes. Harden closes the identity gaps, only after Phase 1 is signed off. Watch keeps the estate from drifting back. Budget at least two weeks of assessment, treat every first run as a dry run, deploy Conditional Access report-only first, and exclude the emergency access accounts before enforcing. Domain unjoin is a separate decision.

The manual path suits small estates and pilots; the operator owns the change record. The governed path is for larger estates, or where an authorizing official must sign: every state-changing step carries an approval reference. The retrofit adopts a hand-modernized estate without re-enrollment. Its risk is that registering the current state as desired blesses whatever drift is there.

Every governed operation declares a rung. The federal ceiling is L3, human approval, and autonomous L4 is refused. Where Intune Multi Admin Approval covers a workload, it is the L3 approval.

## Slide 10 — The runbook's sharp edges: precedence, NTLM and SPNs

Three places in the shared runbook cause most of the outages.

Precedence first. Moving the existing fleet into Intune usually goes through Group Policy triggered automatic enrollment of hybrid joined devices: no reimage, no user interaction. Confirm with dsregcmd that the device shows both Azure AD joined and domain joined. But while the GPOs are still linked, overlaps are dangerous. When the same policy is set in both, Group Policy takes precedence. MDM wins over GP reverses that only for the Policy CSP. For the Defender CSP and others, it's a race. And Windows Hello for Business, in the PassportForWork CSP, won't take the Intune settings until the Group Policy settings are cleared. So document every overlap before Intune enforces anything.

NTLM second. It's deprecated in all versions, and NTLMv1 is removed in Windows 11 24H2 and Server 2025. A common mistake is treating LAN Manager level 5 as block all NTLM. Level 5 makes domain controllers refuse LM and NTLMv1, but they still accept NTLMv2. Blocking is done by the Restrict NTLM policies. So stage it: audit, refuse the legacy variants, then deny all, removing exceptions as each dependency retires, and only after a fourteen to thirty day audit and application owner sign-off. Conditional Access can't help here: a Kerberos or NTLM exchange with a domain controller never reaches it.

SPNs third. A missing SPN is the silent case: Kerberos isn't attempted, and NTLM usually succeeds, until stage 3 makes it an outage. A duplicate is the loud case. Validate each repair by purging the ticket cache and checking that SQL Server reports Kerberos.

## Slide 11 — Module 2: The GPO sunset and policy migration

Module 2: the GPO sunset and policy migration. This is the existing-fleet program. It replaces Group Policy Objects on endpoints that are already deployed, and it ends when those GPOs are formally retired.

The program measures it by GPOs retired with evidence, not by settings copied. Chapter 07 runs it as a program, Chapter 08 is what an endpoint engineer works from inside those rules, and Appendix A is the crosswalk: where a control lands in Intune, not what its value should be.

## Slide 12 — The sunset pipeline and Group Policy analytics

Three efforts touch Intune and the program keeps them apart: Intune-first onboarding for new devices, this sunset for the existing fleet, and regenerate-not-copy, the philosophy for authoring the replacements. Microsoft's own guidance is that assessing every GPO and every setting is likely impractical; identify the mandatory settings and treat the gaps as blockers. The program turns that into seven steps, each with an exit condition.

Step 1: nothing is translated or retired until it's inventoried. Get-GPO-Report produces each GPO's links, security filtering, WMI filtering and settings as XML, which is the shape Group Policy analytics imports. Record the targeting too, because it's the part that doesn't survive the move. The program's triage script sorts each live GPO onto a target plane, Intune for workstations and Arc for servers, using two classifiers side by side, so disagreements surface instead of hiding behind one guess.

Group Policy analytics shows, per setting, the CSP and OMA-URI behind it, and sorts settings into ready for migration, not supported or deprecated. Plan around its limits: each export under four megabytes with proper Unicode, the five CSPs plus preferences it parses, non-ADMX settings read accurately only in English, and scope tags that hide imports from admins without them.

The Migrate step is, in Microsoft's words, best effort. Firewall rules and AppLocker can't move that way. And when several GPOs set one setting differently, migration stops and asks you to pick, which usefully surfaces the conflicts OU precedence used to hide. The program treats the readiness report as evidence that an equivalent exists, never that a setting is needed. And it quotes no percentage: Microsoft publishes none.

## Slide 13 — Classify, then dispose: tags, questions, landing zones

Step 2 gives every setting in the inventory one tag. Required: still needed, so it's translated to a modern control. Obsolete: an old Windows version, a retired product, a network assumption that no longer holds, so it's retired. High-risk: it weakens security, so it's retired or replaced with something stronger. Redundant: already enforced by another control or a Windows default, so it's retired.

A required setting then gets a disposition from four questions, asked in order, where the first yes decides. Is it still required in the target operating model? Group Policy accumulated settings that existed only because it could set them. Does a native Intune equivalent exist? Most do. Does a cloud-native pattern remove the need? Folder redirection becomes OneDrive Known Folder Move, mapped printers become Universal Print, WSUS targeting becomes update rings. And can a script enforce and prove it? Then it's a Remediation, reviewed later for a native replacement. A setting that fails all four is a dated exception, and its GPO stays linked for that population and no other. For each one, also record whether it's configuration, compliance, or both, and what evidence proves it.

The questions send settings to four landing zones. The settings catalog holds most ADMX and security settings; the old Administrative Templates profile has been read-only since the 2412 release. Imported ADMX is for third-party templates: public preview, twenty files of a megabyte or less, en-us only. Endpoint security owns antivirus, encryption, firewall, attack surface reduction, account protection and EDR, and Microsoft's practice is one method per setting. Remediations need Enterprise, Education or VDA licensing, up to two hundred packages per tenant.

## Slide 14 — Coexistence: who wins while GPOs and Intune both apply

While a population has both GPOs and Intune policies, three conflict systems are in play, and the program plans against each one.

Inside Intune: two compliance policies take the most restrictive value; a compliance setting beats the same setting in a configuration policy; and between configuration policies of any type, settings catalog, endpoint security, security baselines, there is no precedence. The conflict is reported and the setting might not apply until it's fixed. The chapter states two corrections to earlier program material: profiles don't resolve by last write wins, and endpoint security doesn't automatically beat configuration profiles. So each setting has exactly one owning policy.

Between Group Policy and MDM: in the Policy CSP, Group Policy keeps winning unless MDM wins over GP is set to one; set it where a population is in transition and remove the GPO copy as Intune takes the setting. Outside the Policy CSP it's a race, and Windows Hello for Business shouldn't be configured through both at all. For Windows Update, Microsoft recommends Ignore Windows Update Group Policies instead, on Windows 11 24H2 with KB5101684 and later.

Between Configuration Manager and Intune, the co-management slider sets one authority per workload. Note two traps: switching device configuration also moves resource access and Endpoint Protection; and with Pilot Intune selected, Intune deploys policies but doesn't remove them on unassignment.

Disabling a link is the moment production behavior changes, so it's gated. Freeze the GPO, back it up, prove the replacement reports success, then disable the link, not the GPO, with one reversible command. And remember that preference items stay on the device unless configured to remove themselves.

## Slide 15 — Seven phases at working level: durations, gates and waves

Chapter 08 breaks the seven phases into working tasks. The durations come from the program's reference plan for a large fleet with an existing Configuration Manager estate; a fleet without one skips most of Phase 2.

Phase 1, three to five weeks: export and import every GPO, find the GPO-on-GPO conflicts that OU precedence hid, classify every setting, and capture an effective-policy baseline per device tier with gpresult on a sample. Phase 2, two to three weeks: enable co-management for a pilot collection, set the first workloads to Pilot Intune, and decide MDM wins over GP per population. The matching Intune policy must already exist, because a co-managed device syncs MDM policy as soon as a workload moves. Phase 3, three to four weeks, can overlap it: build every policy unassigned, with attack surface reduction and controlled folder access in audit mode, and peer review that every setting traces to a decision record and no setting appears twice.

Phase 4 is the pilot, about five percent of the fleet, representative across tiers, regions and departments, with a seven-day grace period instead of one. GPOs stay linked: the pilot measures conflicts by comparing gpresult with Intune's per-setting status. Phase 5 is four waves of three weeks each, watched for seventy-two hours. Endpoint Protection goes before device configuration, because moving device configuration drags Endpoint Protection and resource access with it. Phases 6 and 7 disable the remaining links, clear tattooed preferences, then disable each GPO, keep it ninety days, back it up, archive and delete.

On these estimates the program reaches Phase 7 in roughly thirty-four weeks, with the last deletions about three months later. Remember that rolling back a pilot means reassigning a policy with the old value, not just removing the assignment.

## Slide 16 — The policy library: attribute targeting and the compliance set

The policy library has five types, each with an ID prefix: compliance policies, CP; settings catalog profiles, SC; endpoint security, ES; app protection, AP; and app configuration, AC. Every one is assigned to dynamic device groups built from attributes, which replaces OU-linked scoping.

Entra dynamic rules for devices can use extension attributes one through fifteen, but the values have to be written to the device object through Microsoft Graph first; they're the device's own set, not the user attributes. The program uses one numbering: one for region, three for department, eleven for security tier, twelve for device role and thirteen for environment, with one fixed spelling per value. Assignments then add exclude groups for break-glass and staging, and assignment filters. The correction that matters: filters can't read extension attributes. A filter on attribute eleven doesn't evaluate. Attribute targeting belongs in the group rule; filters work on Intune properties such as join type, ownership, model and OS edition.

Three Microsoft facts shape every compliance template. Noncompliance actions are scheduled in days, zero to three hundred sixty-five, not hours. Windows supports only three actions: mark noncompliant, email the user, and add to the retire list, which retires nothing by itself. There is no block action; blocking is what Conditional Access does with a noncompliant device. And BitLocker, Secure Boot and code integrity are measured at boot, so a newly encrypted device needs a restart.

The set: a workstation baseline with a 24H2 floor; a strict Tier 0 policy with a 25H2 floor, a Clear risk score and no grace period; a Tier 2 policy; and a kiosk policy. The server baseline, CP-004, can't be built in Intune, so it moves to Chapter 09.

## Slide 17 — Endpoint security settings, and the crosswalk traps

Endpoint security policies aren't a higher-priority source; they have the same standing as configuration profiles. In the program's library they own every Defender, BitLocker, firewall, account protection and LAPS setting, and the four settings catalog IDs that duplicated them, SC-002, 006, 007 and 008, are retired and never reused.

ES-001, antivirus: cloud block level High, a fifty-second extended timeout, which is the maximum, and safe samples sent automatically. Sending all samples can upload documents with organizational data, so that's the data owner's decision. Tamper protection needs Defender onboarding and isn't supported this way on co-managed devices until Endpoint Protection moves. ES-002, BitLocker: silent encryption and a TPM PIN can't apply to the same device, so standard and kiosk devices encrypt silently with TPM only, and Tier 0 uses TPM plus PIN in a separate policy. ES-003, firewall: on an Entra-joined device the domain profile doesn't apply, so management rules need a private-profile equivalent, and Group Policy analytics can't migrate firewall rules. ES-004, EDR: automated investigation, live response and web content filtering are set in the Defender portal, not here. ES-005: attack surface reduction rules in audit for thirty days, then block; the PSExec and WMI rule stays off Configuration Manager devices, because its client depends on WMI. ES-006: Credential Guard, which needs Enterprise or Education, Hello for Business, and Windows LAPS with an eight-hour post-authentication reset.

Appendix A flags the traps. Account lockout maps to the DeviceLock lockout policy. Audit Logon sits under the logon-logoff path. A logon message breaks Autopilot pre-provisioning. And Known Folder Move won't carry folders redirected to a share: copy them first with Migration Manager.

## Slide 18 — Module 3: Servers under Azure Arc

Module 3: servers under Azure Arc. Group Policy reached servers through OU placement, the same way it reached workstations. Intune doesn't take over that job, because Intune's supported platforms don't include Windows Server.

The cloud equivalent is Azure Arc. A server outside Azure runs the Connected Machine agent and appears as an Azure resource, managed the way native virtual machines are. Arc gives the server an address in the control plane; everything that makes it governed is what you then attach to that address.

## Slide 19 — What Arc changes, and what it doesn't

Arc is the management plane. It isn't the identity plane, and onboarding doesn't change how the server authenticates users or whether it's joined to a domain. Keep the two separate in every plan.

What changes: the server gets an Azure resource ID in a resource group alongside other Azure resources; Azure RBAC, tags and Azure Policy apply to it; it gets a system-assigned managed identity in Entra ID; and extensions can be installed from Azure, running with full privileges on the server. What doesn't: its domain membership; how users and services authenticate to it, unless you enable Entra ID sign-in; the workload, since an Arc outage impairs management only; and where it runs. Arc isn't a migration to Azure.

Two properties shape the operating model. Azure is the source of truth for the agent: the only way to tell it to do something is to act on the server's Azure representation, so RBAC and policy are evaluated before any change reaches the server. And connection state is evidence. The agent sends a heartbeat every five minutes. A server that stops shows Disconnected within fifteen to thirty minutes, and one disconnected for forty-five days can become Expired, unmanageable until an administrator disconnects and reconnects it. If a server disconnects, its guest assignments are kept for fourteen days and then deleted, so a long outage silently removes its baseline evaluation.

Plan cost by service, not by connection. If the Windows Server licenses carry Software Assurance, or are subscription or pay-as-you-go, Windows Server Management enabled by Arc provides Update Manager, Change Tracking and Inventory and machine configuration at no extra cost. But it isn't automatic: you attest each server's licensing, and that becomes a recorded step in the runbook.

## Slide 20 — Before you onboard: roles, network, tags and images

Before the first server connects, settle roles, network, tags and images.

Use the narrowest built-in roles. Azure Connected Machine Onboarding goes to the onboarding service principal only: it can read and create Arc server resources, but not delete them or manage extensions. Azure Connected Machine Resource Administrator is for the server operations team. And Virtual Machine Administrator Login or User Login are for people who sign in with Entra ID; Owner and Contributor don't confer sign-in. Then remember what extensions can do. They run arbitrary scripts with full privileges, so Microsoft says to treat any Contributor on the Arc resource as an indirect administrator of the server, and the Cloud Adoption Framework warns that Contributor, Owner and the resource administrator role can effectively delegate root access. Scope those roles to the resource groups a team owns, and hold them through Privileged Identity Management.

Network: the agent communicates outbound over TCP 443, with no inbound rule. Allow the Azure Active Directory, Traffic Manager, Resource Manager, Arc Infrastructure and Storage service tags and, as of April 2026, Azure Front Door Frontend. A proxy doesn't add security, because the traffic is already encrypted; a private link scope keeps it off public networks. Run azcmagent check from a representative server first, adding the cloud parameter for Azure Government.

Tags: one taxonomy at connection time, which drives policy scope, Update Manager's dynamic scoping and cost reporting. They're plain text, so nothing sensitive. A server with SQL Server installed connects its instances to Arc automatically; opt out with a tag when you connect.

And images: install the agent in a golden image, but never connect the image, or every clone shares one resource ID.

## Slide 21 — Onboarding a wave with a least-privileged principal

Onboarding runs in waves. Each wave creates its credential, connects a defined set of servers, attaches the baseline on the same change, verifies, and closes by removing what onboarding needed.

Microsoft supports many methods: a portal-generated script, PowerShell, a service principal with the installation script, Ansible, Arc-enabled VMware vSphere, the multicloud connector for AWS, Windows Admin Center, Configuration Manager, and Group Policy. The program's recommendation is a dedicated service principal that authenticates with a certificate, deployed through the automation tool the server team already runs. The interactive script is for a handful of servers or a pilot.

The service principal exists only to connect machines, and the credential is needed only while azcmagent connect runs; if it expires afterward, the server stays connected. So keep its lifetime short and its scope small: the onboarding role, on the target resource group. Microsoft recommends a certificate over a secret, because a certificate credential can be controlled with Conditional Access. If you must use a secret, Microsoft's examples create one valid for a year; set it shorter and rotate it after each wave. A stolen onboarding credential lets an attacker connect servers outside your organization into your subscription, and private endpoints close that path.

Protect the credential in deployment. A secret in a hand-built startup script is readable by every domain user through SYSVOL. Microsoft's Group Policy method encrypts its configuration file so only computer accounts can decrypt it, which still means any computer account, so scope the GPO, rotate after the wave, and disable the GPO once servers connect.

For sensitive servers, set local controls that Azure can't override: an extension allowlist, and disabling remote connections.

## Slide 22 — The day-one baseline: configuration, patching and protection

A connected server is addressable, not yet governed. Attach three things on the same change.

Govern with Azure machine configuration, formerly Azure Policy Guest Configuration. It extends Azure Policy inside the operating system, using Desired State Configuration to audit or set OS settings, and reports compliance per machine. Unlike Group Policy it's scoped by Azure resource scope, subscription, resource group or machine, not by OU. The agent includes the service natively, so there's no extension to deploy. The Windows and Linux audit baselines are built-in definitions against the Azure compute security baseline, both customizable, and a CIS benchmark definition for Linux is in preview. Deploy the prerequisite initiative first, keep the customized baseline in the governance repository as policy-as-code, and treat noncompliance as a finding, not a failed deployment.

Patch with Azure Update Manager. It assesses every twenty-four hours when periodic assessment is on, patches in maintenance windows, and groups machines by tag through dynamic scoping, which is where the patch group tag earns its keep. It's charged per Arc server per month, except when the server is enabled for ESUs through Arc, when Defender for Servers Plan 2 covers the subscription, or with Software Assurance, a subscription or pay-as-you-go license.

Protect with Defender for Servers. Plan 1 centers on endpoint detection and response; Plan 2 adds agentless scanning, regulatory compliance, premium vulnerability management, configuration assessment and file integrity monitoring. The program's FedRAMP Moderate scope uses Plan 2, plus Defender for SQL on Arc-connected SQL hosts. Onboard through Arc rather than installing Defender directly, which gives only Plan 1 function. And if your only Defender entitlement comes through Defender for Servers, security settings management isn't available.

## Slide 23 — Extended Security Updates, Entra ID sign-in and rollback

Arc is also how many organizations keep end-of-support servers patched while they migrate. As of October twentieth, 2026: the Windows Server 2012 and 2012 R2 ESU period ended on October thirteenth, and Arc ESU licenses deactivated the next day. Any such host still running receives no further security updates through any channel. Treat it as a red finding: migrate, upgrade, or isolate it and record the risk acceptance. Windows Server 2016 reaches end of support on January twelfth, 2027, with ESUs for up to three years; connect and enroll those hosts before then if they won't be upgraded in time. SQL Server 2014 is in its third ESU year, until July 2027, and SQL Server 2016 in its first, until July 2029. ESUs through Arc are billed monthly, need no product keys, and show coverage per server.

Entra ID sign-in. Arc-enabled Windows servers can use Entra ID for Remote Desktop, with Azure RBAC deciding who signs in. It needs Windows Server 2025 or later with Desktop Experience, or Windows 11 24H2; 2019 and 2022 aren't supported, which is exception C from Module 1. It's available in Azure Global and Azure Government. Installing the sign-in extension Entra-joins the server, so it's for servers that won't be domain-joined. Only member users of the same tenant can sign in. And Conditional Access isn't supported with the join extension on Arc servers. That corrects a common assumption: the control you get is RBAC on who may sign in, held through PIM, not workstation Conditional Access. Linux uses SSH through Arc with its own extension and the same roles.

Rollback order matters: remove extensions first, because uninstalling the agent leaves them behind; then disconnect, which needs the resource administrator role; then uninstall.

## Slide 24 — Module 4: Operating and evidencing the fleet

Module 4: operating and evidencing the fleet. Once the GPOs are gone, a device's state is no longer explained by where it sits. It has to be proved, continuously, from records the services already keep.

The run state replaces the OU answer with three records: the policy library from Chapter 08, which says what each device should be; the status Intune and Defender report per device, which says what it is; and the audit log of every change. Operating the fleet means keeping those three in agreement. Evidencing it means handing an assessor the same records, not a document written for the audit.

## Slide 25 — Making the compliance signal accurate

The compliance policies decide whether a device is compliant; Conditional Access decides what a noncompliant device can reach. Book 04 owns that second decision. This book's side of the hand-off is making sure the compliance signal is accurate, and remember that the compliant-device grant works only for devices registered in Entra ID and enrolled in Intune.

Two tenant settings sit above every policy. Devices with no compliance policy assigned default to Compliant; the program sets Not compliant, so a device that falls outside every group, a missing tier attribute for example, can't pass Conditional Access by default. And the compliance status validity period defaults to thirty days, with a range of one to a hundred twenty; the program uses fourteen. That's a program choice: short enough that a device left in a drawer loses access before its posture is stale by a whole patch cycle, long enough not to catch staff on leave.

Read the dashboard carefully. In grace period means noncompliant, but inside the schedule on the mark noncompliant action. Not evaluated is a new device, or one that hasn't checked in since a policy changed. A compliance setting that returns Error keeps the existing status for up to seven days, then the device becomes noncompliant. The program reviews Not evaluated and Error weekly, because both hide devices from the noncompliant count.

Configuration status is per device and per setting: Succeeded, Error, or Conflict, which means another policy sets the same setting differently. A conflict is a defect in the library. Move the setting into the one policy that owns it.

And on Tier 0, the risk score requirement means a Defender detection on a privileged access workstation becomes a compliance failure, and through Conditional Access, a loss of access.

## Slide 26 — Windows updates: rings, Autopatch and version currency

Intune manages Windows updates through four policy types built on the Windows Update client policies: update rings for deferrals, deadlines and restarts; feature update policies that pin a Windows version; quality update policies, which can expedite a critical update or deliver hotpatches; and driver update policies.

Rings stage each month's quality update. The names follow Windows Autopatch, Test, First, Fast and Broad; the values are the program's design. Test is the engineering lab, with no deferral and a two-day deadline. First is the pilot cohort, about five percent. Fast is about a quarter of the fleet. Broad is everyone else, with a seven-day deferral, a seven-day deadline and a two-day grace period. Rings allow deferrals of zero to thirty days, deadlines of two to thirty and grace of zero to seven. With these values a quality update reaches every online device within about sixteen days of release, and an update that breaks Test or First can be paused before Broad. Feature deferral is zero everywhere, because a feature update policy pins the version.

Windows Autopatch automates ring management, sequencing and reporting. For government tenants, it's included for GCC customers with Microsoft 365 G3 GCC or G5 GCC, and isn't supported in GCC High or DoD. Devices must be Entra joined or hybrid joined, and co-managed devices need the update and device configuration workloads at Intune or Pilot Intune. Autopatch creates and maintains its own rings, so don't assign yours to its devices. The program's position: use it where licensed, and keep the ring table as the specification its groups are configured to.

Version currency: 23H2 Enterprise and Education stop receiving updates on November tenth, 2026. So the feature update policy targets 25H2 now, and the compliance floor of 24H2 rises each year.

## Slide 27 — Reconciling three inventories, and retiring a device in order

Three services keep their own device inventory, and they disagree in predictable ways. Intune's managed devices drift when devices stop checking in, and cleanup rules hide them. Entra ID accumulates stale objects from reimaging, broken hybrid trust, or devices that never enrolled. Defender has devices onboarded but not enrolled, or enrolled but never onboarded.

The program reconciles them weekly on the Entra device ID. Every enrolled device must have an Entra object with its tier, role and environment attributes set, and a healthy Defender sensor. Every Entra object for a corporate Windows device must have an Intune enrollment. A device missing from any one is a finding, and the same comparison is the evidence for CM-8's requirement of a complete inventory with no duplicates.

Stale records need care. Intune cleanup rules hide devices after thirty to two hundred seventy days, per platform; the program uses ninety for Windows. They don't wipe or retire anything, and hidden devices stay in Entra ID. Entra's last sign-in timestamp isn't updated on every sign-in, so Microsoft advises not treating anything newer than about twenty-one days as stale, and disabling before deleting. Hybrid devices are removed in Active Directory, and the change syncs.

Retirement follows a fixed order, because the order decides what can still be recovered. Record first: export the BitLocker keys and the LAPS password. Retiring or deleting the Intune object of an Entra-joined BitLocker device suspends BitLocker, so back up first. Then act on the device: wipe a corporate device, retire a personal one; actions run at next check-in. Deregister from Autopilot if it's leaving for good. Delete the Intune record. And delete the Entra object last, after a disable period, because that permanently deletes its keys. Plan mass refreshes in daily batches: the tenant limit is a thousand retires and a thousand deletes a day.

## Slide 28 — Drift detection: what the logs can tell you, and when

Drift is a difference between the policy library and a device's reported state that the policy should have prevented: BitLocker off, tamper protection off, an OS below the floor, a setting stuck in Conflict. The program detects it with the same loop Chapter 05 describes for the governed path, applied to Intune and Defender. A daily export of compliance, configuration and inventory status. A comparison against the template values in Chapter 08. Classification as a policy gap, a device fault, a conflict or an inventory mismatch, alerted by severity. And remediation: a device sync or a Remediation script, or a policy change through change control when the library itself is wrong. On the governed path every remediating write carries an approval reference.

Know what Log Analytics receives, and when. Intune's diagnostic settings send audit logs, operational logs, compliance organizational logs and the Intune devices inventory. Audit and operational logs are sent immediately. Compliance and inventory are exported once every twenty-four hours and can take up to forty-eight to arrive, and Microsoft says not to rely on a fixed delivery time. So those tables are for trends and evidence, not minute-level alerts. And per-setting configuration status isn't among them, so the configuration comparison comes from Microsoft Graph reports. Three query pitfalls: don't hard-code compliance state strings, don't join the operational logs on a device ID column it doesn't have, and don't look for configuration conflicts there.

The alerts follow from that. Fleet-wide noncompliance above ten percent comes from the daily export. But Tier 0 noncompliance is polled from Graph hourly: from the export, the alert would arrive two days late. Meanwhile Conditional Access blocks the device, because CP-002 has no grace period.

## Slide 29 — The evidence an assessor reads, and the GCC boundary facts

Last, what the assessor reads. The program's evidence is the records the services keep, exported on a schedule and retained, for the configuration management and flaw remediation controls. The control wording is from NIST SP 800-53 Revision 5, release 5.2.0, which FedRAMP's 2026 catalog uses without adding parameter values to these controls.

CM-2, baseline configuration: the policy library exported from Graph, under version control, with its review history. CM-6, configuration settings: per-setting status, the exception register with approvals, and the Intune audit log of every change. CM-7, least functionality: attack surface reduction in block, the firewall rule set, the Edge extension allow list. CM-8, inventory: the weekly reconciliation. SI-2, flaw remediation: the ring table and per-ring compliance. SI-2's defined period is the organization's parameter, and the ring deadlines are what set it.

Two GCC facts change where data and endpoints live. Intune in a GCC tenant isn't a separate government instance: GCC uses the commercial service and worldwide Graph, and only GCC High and DoD are separate. Defender for Endpoint for US Government is built in Azure US Government, with the GCC portal at security dot microsoft dot com. And Windows Update for Business reports don't meet GCC compliance requirements, so SI-2 evidence comes from Intune and Autopatch reports.

The program also maps this evidence to FedRAMP 20x Key Security Indicators, as its own claim, written for cloud service offerings, not an agency fleet.

So, from Monday: inventory and triage every GPO; set the tenant compliance defaults; carry procurement into the group tag; onboard servers with a short-lived certificate principal; and reconcile inventories weekly. Chapters 04 to 10 and Appendix A carry the detail. Thank you.
