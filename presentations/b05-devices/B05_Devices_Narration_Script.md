# Book 05 — Devices & Endpoints — narration script (practice copy)

## Slide 1 — Why Can't Group Policy Come to the Cloud?

This briefing comes from Book 05 of the Federal Modernization Workbook, Devices and Endpoints: the move from Group Policy to Intune for devices, and to Azure Arc for servers.

I'll take it through four questions: why Group Policy can't simply be carried to the cloud, what replaces it, who owns the endpoint, and how to migrate a fleet without losing the governance Group Policy quietly provided.

The short version: this is not a settings migration. It's a governance rebuild.

## Slide 2 — Group Policy governed by position. Intune has no position.

Why can't Group Policy come to the cloud? Because Group Policy governed by position, and an Intune-managed device has no position.

Where a computer sat in the organizational unit (OU) tree quietly did five jobs. It decided targeting: what settings the computer got. Precedence: link order and inheritance decided which setting won. Delegation: OU permissions decided who could change it. Timing: policy refreshed at startup, at sign-in and on a cycle. And evidence: the resultant set of policy told you what actually applied.

An Entra-joined, Intune-managed device has none of that. Policy is assigned flatly to groups, and nothing reads the OU tree. When two policies set the same thing, Intune reports a conflict; it doesn't resolve it by order. Devices check in about every eight hours. And some Group Policy jobs, mapped drives for example, have no built-in equivalent at all. Microsoft itself advises against copying GPOs one for one.

So this is not a settings migration. Teams that copy GPOs into Intune discover the governance loss after the targeting model has already changed. Every job the tree did implicitly has to be rebuilt explicitly.

## Slide 3 — Hybrid join is a waypoint, not a destination

The obvious shortcut is hybrid join, and the book calls it a trap, carefully.

Microsoft's guidance has two halves. New, refurbished or reset Windows devices should be Microsoft Entra joined by default. Existing domain-joined devices can be hybrid joined, which gives them a cloud identity with minimal impact on users. But Microsoft is explicit that hybrid join shouldn't be the long-term end state.

Here's the trap. Turning on hybrid join for a fleet is, mechanically, close to a single tenant-wide switch, so a control that assessments score as a multi-quarter program can look finished in a week. But the fleet keeps every on-premises dependency it had. And there's no Microsoft-supported way to convert a hybrid-joined device to Entra join without resetting Windows.

So the governed path uses hybrid join where it helps, and plans each device's move to Entra join at a natural event: the next hardware refresh, operating-system upgrade or rebuild. That way the waypoint doesn't quietly become the destination.

## Slide 4 — Devices and servers take different roads

What replaces it? Devices and servers take different roads.

For endpoints, the Entra ID device object carries the identity, Intune carries configuration and compliance, Autopilot provides zero-touch provisioning, and Defender for Endpoint covers threat and vulnerability.

Servers are different, and the old design documents got this wrong. Intune doesn't manage Windows Server. A server comes under governance through Azure Arc, which makes it an Azure resource. Azure Policy machine configuration sets its configuration, and Update Manager and Defender for Servers handle patching and protection.

For new devices, the book's doctrine is Intune-first: governed from day zero. The organizational assignment is set when the device is ordered, enrollment is zero-touch, and an onboarding failure goes to quarantine, never into production in a degraded state.

Because each system is authoritative for one thing, the program correlates them on stable keys and reconciles the inventory continuously, so the fleet has one answer to "what do we have, and is it governed?"

## Slide 5 — Intune-first: no ungoverned device, ever

For new devices, the book's doctrine is Intune-first, and it has five pillars.

One: no ungoverned device, ever. Every device is enrolled in governance before it goes into production use, and quarantine is the safety valve, not the steady state. Two: procurement is the first governance step. The organizational assignment is set when the order is placed, not when the box arrives, the same way HR feeds user provisioning. Three: zero-touch only. Manual enrollment is an exception that needs written justification, a time limit and an audit entry. Four: one management plane per asset. Intune for endpoints, Azure Arc with machine configuration for servers, and no greenfield Group Policy or hybrid join. And five: quarantine on failure. An onboarding failure opens a ticket; it never produces a device running in a degraded state.

One practical choice: in a GCC tenant, the book defaults to classic Autopilot, with devices registered by the manufacturer or reseller, because that registration can carry a group tag. The newer Autopilot device preparation has no registration step, so it can't.

These pillars are program doctrine for net-new devices. The existing fleet takes one of three paths.

## Slide 6 — Three paths to the same governed state

There are three paths to the same governed state, and the book uses them deliberately.

The governed path is program-orchestrated: every step is recorded, approved and evidenced. It's the default for any population in scope.

The manual path is operator-run with the native tools, without the orchestration platform. It's for when the platform isn't available yet, and it trades automation for more hand-collected evidence.

The retrofit path brings an estate that was already modernized by hand, before the program existed, under governance after the fact.

All three end in the same place: the device or server enrolled, baselined and reconciled. What differs is how much of the proof is produced automatically and how much has to be collected by hand. The chapter also corrects a few things the old path guides got wrong, for example that LAN Manager authentication level five still accepts NTLM version two; blocking NTLM takes the separate Restrict NTLM policies.

## Slide 7 — Who decides, who does the work for the endpoint

Who owns the endpoint? The book separates who decides from who does the work.

Deciding: the CISO and ISSO own the baselines, the exceptions and the evidence. The endpoint engineering lead owns policy design and the rollout. And the change board owns the update rings, the migration waves and any pause.

Doing: endpoint engineering builds the Intune policies, Autopilot profiles and app deployments. The server team onboards servers to Azure Arc and owns machine configuration. Security operations runs Defender, the alerts and the response.

Consulted and affected: application owners supply test results and app packaging. The help desk handles enrollment, wipe and recovery. And end users join pilot waves and tell us what broke.

One rule applies to the people as much as the devices: least privilege. Day-to-day work runs on scoped Intune roles, not Intune Administrator; Microsoft advises against using the broad role for routine administration.

## Slide 8 — Sunset Group Policy as a program, setting by setting

How. The book runs the Group Policy sunset as a program, setting by setting, in seven steps: inventory and parse, classify each setting, crosswalk it, decide, sequence by population, freeze and unlink, and finally retire.

Every setting goes one of three ways: migrate it to Intune, replace it with a cloud-native pattern, or retire it.

The coexistence rules matter, and the old guides had them wrong. While a device is under both, Group Policy wins by default. The MDMWinsOverGP setting reverses that, but only for settings in the Policy configuration service provider; Defender settings and Windows Hello for Business have to be removed from Group Policy, not overridden. Group Policy preferences can leave their settings behind after a GPO is unlinked, so every preference item needs a planned cleanup. And the book unlinks one population at a time rather than blocking inheritance, because that's scoped and reversible.

One more thing: measure, don't assume. Microsoft publishes no typical percentage of settings that migrate, so the program runs Group Policy analytics against the estate's own exports.

## Slide 9 — Migrate the fleet in seven phases, about 34 weeks

The existing fleet then migrates in seven phases, about thirty-four weeks on the book's planning estimates.

Phase one inventories and classifies, ending with a decision record for every setting. Phase two plans coexistence, with pilot devices co-managed and syncing. Phase three authors the baselines, unassigned, until every setting is owned by exactly one policy. Phase four pilots on about five percent of devices. Phase five cuts over workload by workload in four waves, each watched for seventy-two hours. Phase six verifies that no migrated device still processes a GPO. And phase seven retires the GPOs, keeping them ninety days before they're archived and deleted.

The book also sets a floor: Windows 11 version 24H2. Windows 10 is out of support, and Windows 11 23H2 Enterprise stops getting updates on November 10, 2026.

These are planning estimates for a large fleet with an existing Configuration Manager estate, not promises. Every gate is the next phase's precondition, and every phase has a rollback while it's open.

## Slide 10 — Servers under Azure Arc, and the dates that matter

Servers come under governance through Azure Arc.

Onboarding uses the Connected Machine agent with least privilege: a certificate-based onboarding identity that's needed only at connect time. Configuration comes through Azure Policy machine configuration baselines, assigned by scope. And patching and protection come from Update Manager and Defender for Servers.

Two dates make this urgent. Extended security updates for Windows Server 2012 and 2012 R2 ended on October 13, 2026, a week ago, so any remaining 2012 host is a red finding. And Windows Server 2016 reaches end of support on January 12, 2027.

The book is careful about rollback too: remove extensions before disconnecting the agent, because disconnecting deletes the Azure resource, which the onboarding role isn't allowed to do.

## Slide 11 — Run it, prove it, and what we need

Finally, run it and prove it. In run-state, compliance feeds Conditional Access, which is Book 04. Updates flow through rings and Windows Autopatch, and in a GCC tenant the update evidence comes from Intune and Autopatch reports, because Windows Update for Business reports don't meet GCC compliance. The inventory is reconciled across Entra ID, Intune, Autopilot, Arc and the CMDB. Devices are retired and wiped before the account is deleted. And the evidence maps to the configuration-management and flaw-remediation controls: CM-2, CM-6, CM-7, CM-8 and SI-2.

What we need from leadership is four things. Approve Intune-first for every new device. Fund the Group Policy inventory and the Group Policy analytics run. Set the Windows 11 24H2 floor and a plan for servers reaching end of support. And name the owners for endpoints, servers and security.

Book 05 has the full migration, with every external claim footnoted. Book 04 covers what a compliant device may reach, and Book 02 the identity it rests on. Thank you.
