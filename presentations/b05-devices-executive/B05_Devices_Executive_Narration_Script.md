# Book 05 — Devices & Endpoints — narration script (practice copy)

## Slide 1 — Devices & Endpoints: the executive briefing

Welcome. This is the executive briefing for Book 05 of the Federal Modernization Workbook, Devices and Endpoints. It's for the people who decide how the fleet moves. The argument is short. Group Policy governed devices by where they sat in the directory, and that quietly did a lot of governance. None of it comes to the cloud, so it has to be rebuilt on purpose. Hybrid join is a waypoint, not a destination. And servers take their own road, through Azure Arc. I'll take four questions: why, what, who and how. Each decision slide names the decision, its owner and when it's needed. First, where this book sits in the series.

## Slide 2 — Book 05 is the Intune and Arc tracks: devices, servers

Here's why this matters: the series moves four populations to the cloud, each on its own track, and Book 05 carries two of them. The Intune track is end-user devices, and the Arc track is servers. A device's attributes come from device provisioning, like the Autopilot group tag, never from HR, and a device rule can't read its owner. Devices are done when their policy targets those attributes and the computer-side GPO links are gone, one population at a time. Servers are done when each is Arc-enabled, tagged, and evaluated by Azure Policy. And Group Policy splits: user settings go with people, computer settings with devices and servers. First, which platforms each one reaches.

## Slide 3 — What Intune and Arc cover, and the strategy for the rest

Here's why this matters: an inventory that only covers Windows isn't an inventory. Intune isn't just for Microsoft platforms. It manages Windows, Apple and Android devices, and Linux desktops with limits, while ChromeOS stays in Google's console. Arc reaches Windows and Linux servers wherever they run: on premises, VMware VMs, and AWS and Google Cloud instances. Azure VMs don't need Arc at all. For what neither reaches, like printers, network gear, the mainframe or old Unix, every device still lands in one of four tiers: Intune or Arc; its own tool, with the CMDB holding its attributes; discovered and monitored only; or segmented and retired. A device in no tier is a finding. Now, what Group Policy was really doing.

## Slide 4 — Group Policy governed by position; the cloud has none

For twenty years, a device's settings came from where it sat in the tree of organizational units (OUs). That position quietly did five jobs: which settings applied, which one won, who could change it, how often it refreshed, and what evidence you had. A cloud-joined, Intune-managed device has no position. Policies are assigned flatly to groups, overlapping settings become reported conflicts that may not apply at all, and devices check in about every eight hours. Intune can deliver most of the settings. It can't deliver the governance around them. So treat this as a governance rebuild, not a settings migration. Next, why running both doesn't help.

## Slide 5 — Running both isn't a safe middle ground

The tempting middle ground is to keep the GPOs and add Intune. But when both touch a setting, nobody sees who wins. By default Group Policy wins. A switch reverses that, but only for some settings; for others, Microsoft warns it's a race with no guaranteed winner. Microsoft's own tool can measure how much of your Group Policy maps to Intune, but it doesn't close the gap, and nobody can tell you the percentage in advance. Microsoft's advice is to rebuild from today's requirements rather than copy. So the decision for the endpoint engineering lead: write down every overlapping setting before Intune enforces it, and give each GPO copy a retirement date. Next, the shortcut.

## Slide 6 — Hybrid join is a waypoint, not a destination

The obvious shortcut is hybrid join, and it's almost a switch. Change the sync scope, publish one setting per forest, and every domain-joined device registers itself. No approval, no ownership check. That effortlessness is the hazard. Microsoft says new devices should be cloud joined, and hybrid join is fine for existing devices, but never as the end state. And it's sticky: moving off it later means resetting the device, and it still needs a domain controller in sight. So every hybrid device needs an exit: a target of Entra join and a trigger, like its refresh date. The sponsor and CIO set the domain-unjoin waves, because unjoining ends everyone's fallback. Next, what the shortcut costs.

## Slide 7 — What an ungoverned flip loses, and never covers

Done as an unattended switch, hybrid join keeps the single sign-on and quietly spends the governance underneath. New device objects appear with no owner. Duplicates pile up. Turning on the managed-device policy too early locks people out. Thousands of changes can't be traced to a decision. And retired machines linger, padding the managed count. Even a perfect rollout only covers domain-joined Windows. Macs, phones, Linux, personal devices, kiosks and servers all need their own answer. So the decision: fleet-wide changes go wave by wave, approved by a person, with the access policy in report-only mode until coverage is measured. The endpoint lead calls each wave; the CISO decides the enforcement. Now, what a governed device needs.

## Slide 8 — Each fact about a device has one source

After modernization, one laptop shows up in five or six systems, most of them editable by someone. That only works if you decide, fact by fact, where the truth lives. The business facts, who owns it, what it's for and where it belongs in the organization, come from procurement. The technical facts come from the services: Entra ID for identity, Intune for management and compliance, Defender for threats, and Azure Arc for servers. Then one rule. Every derived value, a tag, a group, a category, has to trace back to its source. If it can't, it's drift, and you fix it at the source, never at the copy. Next, how new devices start out governed.

## Slide 9 — Intune-first: no ungoverned device, ever

For new devices, the doctrine is Intune-first: no ungoverned device, ever. A new laptop is governed from the moment it first powers on. It never joins the old domain, never gets co-managed later, and never runs without an organizational assignment. The most important change is upstream: procurement becomes the first governance step. The device's place in the organization is set when the purchase order goes out, the way HR records drive user accounts. If anything fails along the way, the device goes to quarantine instead of quietly running degraded. The decision for the sponsor and CIO: from the next purchase order, no new device takes the old path. Next, the access signal.

## Slide 10 — Compliance is the access signal; make it fail closed

Device compliance is where devices meet access. Intune decides whether a device is compliant, and Conditional Access, from Book 04, decides what it can reach. Out of the box, a device with no compliance policy counts as compliant. The program flips that, so a device that slips through every group can't pass. A device that stops reporting for two weeks loses access. And the grace period, how long a failing device keeps working, is a risk decision, not a technical one. On the most privileged workstations, a security detection also costs access. The decision for the CISO: make compliance fail closed, and set the grace period, before Conditional Access relies on it. Next, devices that can't enroll.

## Slide 11 — The device that can't enroll is a governed exception

The book allows four carve-outs: personal devices, Linux that Intune can't manage, older servers, and devices that can't enroll at all. That last group, lab instruments, factory-floor systems, PCs locked to a vendor's certified image, is the hard one. They can't pass a compliant-device policy, so their users are blocked. The program handles them in order: put them on their own network segment, protect them where they connect, and only then, if people must reach cloud resources, a named exclusion with an owner and a review every ninety days. Because that leaves a control unmet, it's a risk acceptance. So the authorizing official decides it, before those users get access. Next, the existing fleet.

## Slide 12 — Three paths to one governed end state

The existing fleet can get to the same governed end state three ways. The manual path uses the native tools by hand. The governed path runs the same steps, but every high-impact change is previewed, approved by a person and recorded. And the retrofit path adds that governance later, to an estate someone already modernized by hand. All three start the same way: measure before you change anything, and give it at least two weeks. Fully automatic change is refused. Intune also has a built-in second approver. The decision for the sponsor and CIO: use the governed path for anything over a few hundred devices, or wherever an authorizing official has to sign. Now, who owns it.

## Slide 13 — Who owns the endpoint: deciding isn't doing

Under Group Policy, whoever could edit and link a GPO decided for every machine beneath it. Now that job is split across several teams and three consoles. And Group Policy taught a generation of administrators that being able to change something meant having the right to decide it. That habit is how someone sets the agency's risk posture without noticing. A thirty-day grace period is a risk decision. So is leaving an old GPO in place, or exempting kiosks from encryption. The book's rule is one decider per row. And exceptions split by time: a temporary one with an end date is the CISO's call; a standing one goes to the authorizing official, on a schedule. Next, the full map.

## Slide 14 — Who decides what for devices and servers

The sponsor and CIO decide the path, the scope and when devices leave the domain. The CISO decides the baselines, the compliance rules, the update schedule, and how the help desk verifies someone before a wipe. Endpoint engineering decides when an old setting is retired and whether each wave goes. Application owners decide for their own apps, because only they can tell if it still works. And the authorizing official owns standing exceptions. The permissions live in three separate role systems, and two warnings stand out: keep the all-powerful Intune administrator role out of daily work, and treat anyone who can push extensions to a server as that server's administrator. The decision for the CISO: a second approver on high-impact changes. Now, how.

## Slide 15 — Sunset Group Policy setting by setting

Now the how. The Group Policy sunset runs one setting and one population at a time. Every setting gets asked, in order: is it still needed? Is there a direct Intune equivalent? Does a cloud service replace the need, the way OneDrive replaces redirected folders? Can a script enforce it? Anything that fails all four becomes a dated exception with an owner. Then the rules that keep it honest: retire before you translate, one owner per setting, and no GPO link switched off until its replacement shows success. GPOs are disabled first and kept ninety days as a safety net. The decision for the endpoint engineering lead: freeze every inventoried GPO, so new requirements go to Intune. Next, the timeline.

## Slide 16 — Seven phases, about 34 weeks, each with a gate

The migration runs in seven phases, each with an exit gate and a way back. On the book's planning estimates for a large fleet: inventory and classify, then plan the overlap, write the baselines, pilot on about five percent, cut over in four waves, verify, and formally retire. That's roughly thirty-four weeks, plus a ninety-day hold before the last GPOs are deleted. Months, not weeks. One sequencing rule matters under schedule pressure: on co-managed devices, the antivirus settings move before general device configuration, because moving configuration drags them along. The decision: endpoint engineering makes each go or no-go on measured results, not the calendar, and the sponsor sets the sequence. Next, servers.

## Slide 17 — Servers come under governance through Azure Arc

Servers take a different road, because Intune doesn't manage Windows Server. Azure Arc gives each server an Azure resource, with roles, tags and policy. But Arc is the management plane, not the identity plane. Onboarding doesn't take a server off the domain or change how people sign in. A connected server is only addressable, not governed, until three things are attached on day one: a configuration baseline, patching and Defender. Licensing changes the bill, but only once each server's license is attested. And cloud sign-in works only on Windows Server 2025, without Conditional Access. The decision: each server leaves the domain as its own decision, after its sign-in dependencies are known. Next, the dates.

## Slide 18 — The support dates that bind the fleet now

Windows Server 2012's extended updates ended on October 13, 2026. Any of those hosts still running gets no more security fixes from anywhere, so the book treats them as a red finding: migrate, upgrade or isolate. Windows Server 2016 reaches end of support on January 12, 2027, so any you can't upgrade in time should be enrolled for extended updates through Arc before then. Windows 11 version 23H2 stops getting updates on November 10, and Windows 10 is already out of support, so each one left is an exception with an upgrade date. The decision can't wait: server infrastructure acts on the 2012 hosts now, and the authorizing official accepts any that must stay. Next, patching.

## Slide 19 — Update rings set the patch clock

Once Intune owns the fleet, update rings set the patch clock. Each month's update flows through four rings: a lab, a small pilot, about a quarter of the fleet, then everyone. With the book's values, an update reaches every online device in about sixteen days, and a bad one can be paused before it reaches the broad ring. Windows Autopatch can run the rings for you, and it's included for GCC customers with the government G3 or G5 licenses. Why assessors care: the federal patching control asks for updates within a period the agency defines, and these ring deadlines are that period. So the decision for the CISO: approve the ring values as the agency's patch window. Next, running the fleet.

## Slide 20 — Run the fleet on records, and retire it in order

In the run state, three records replace the old tree: the policy library, what each device reports, and the log of every change. Running the fleet means keeping them in agreement. Proving it to an assessor means handing over those same records, not a document written for the audit, including the versioned policy library, per-setting status, a weekly reconciliation of the device inventories, and the update results. Retiring a device runs in order: save the encryption keys first, then wipe, and delete the cloud device record last, since deleting it deletes the keys. The decision for the CISO: own the drift findings and evidence from the first wave. Let's pull it together.

## Slide 21 — Decisions to make, owners and timing

So, the decisions. The sponsor and CIO set the shape: an exit plan for every hybrid-joined device, no new device on the old path from the next purchase order, the governed path for large estates, and each server's domain exit as its own decision. Endpoint engineering freezes the GPOs, records every overlap, and calls each wave on measured results. The CISO makes compliance fail closed, adds a second approver to high-impact changes, sets the patch window, owns the evidence, and decides temporary exceptions. And the authorizing official accepts the rest: devices that can't enroll, standing exceptions, and any 2012 server that has to stay. Rebuild on purpose what the tree did implicitly. Book 05 has the detail, every claim footnoted. Thank you.
