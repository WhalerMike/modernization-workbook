# Implementing Book 08 on Infoblox NIOS — Implementation Guide — narration script (practice copy)

## Slide 1 — Implementing Book 08 on Infoblox NIOS

Welcome. This is an implementation guide, and it's research from the Federal Modernization Workbook's Research section, still under review. Book 08 of the workbook sets the program's design for DNS, DHCP and address management, and this guide shows how to build that design on Infoblox NIOS, version 9.1, and how to move off Microsoft DNS and DHCP without breaking anything. After a short orientation, it runs in four parts: build the Grid, migrate from Microsoft, sign and harden, and run it day to day. Every fact comes from a primary source, the new ones opened on October twenty-third, 2026, and I'll flag design guidance and inferences as we go. The slides and notes carry the detail.

## Slide 2 — What this guide implements: Book 08 on a Grid

Here's the frame for the whole guide: Book 08's design, mapped onto the way Infoblox works. Book 08 wants governed DNS and address management, and on NIOS that's a Grid, one Grid Master holding the database and every member getting its copy over an encrypted tunnel. Book 08 wants a period of coexistence with Microsoft, so NIOS first manages the Windows servers read-only, then takes over zones and scopes one at a time. Book 08 requires DNSSEC, so the Grid Master signs as a hidden primary. And its evidence becomes syslog, audit logs, backups and the STIG checklist. Book 08's six phases still govern, but this guide adds a Phase 0 of decisions.

## Slide 3 — Phase 0: decide these before you build anything

Before you build anything, four decisions, because each is expensive to reverse. First, FIPS mode. You can only turn it on after a factory reset, turning it off needs another, and it disables every cloud connection, including the Infoblox Portal. Be precise about the claim, too: NIOS is supported in FIPS mode, but the FIPS 140-3 and Common Criteria certifications are still pending. Running in FIPS mode isn't the same as holding a validated module. Second, pick the long-term-support train, because the STIG measures you against it. Third, fix the weak DNSSEC defaults before you sign anything. And fourth, decide on a hardware security module, since the STIG expects one or a documented exception.

## Slide 4 — Part 1: Build the Grid

Part 1 is building the Grid. We'll cover the Grid Master pair and its candidate, how members join, time and licensing, including one trap that can evict a member, and virtual appliances in the clouds.

## Slide 5 — The Grid Master: an HA pair, built in order

The Grid Master comes first, built as a high-availability pair, and members come after. The pair depends on the switch being set up right, so the physical cabling and switch-port settings on the slide matter more than they look. You run a wizard on node one to create the Grid, then join node two with the same name, virtual address and shared secret, and manage the pair through the virtual address from then on. The step people skip is the defaults: the login, the Grid name and the shared secret all ship with default values you must change, and escrow the new secret, because Infoblox says if you forget it, you have to contact their support. Next, the backup Grid Master.

## Slide 6 — The candidate, joining members, and Grid ports

Next comes the Grid Master Candidate, the appliance that takes over if the Grid Master is lost. It holds a full copy of the database, should be the same model, and Infoblox gives you a promote test to check it can reach the members. Members are defined on the Grid Master first, then joined with its virtual address, Grid name and shared secret. The ports the Grid needs are listed on the slide. The one to watch is FIPS mode, which moves the Grid's tunnel onto different ports. So, as an inference, firewall rules written only for the usual ports won't be enough on a FIPS Grid. Next, two quiet failure modes.

## Slide 7 — Time first, then licenses: two quiet failure modes

Two things fail quietly here: time and licenses. Set NTP at the Grid level first, with at least three external servers as the STIG recommends, and let the Grid Master serve time to the members. Time isn't cosmetic: Grid sync, Kerberos-signed updates and DHCP failover all depend on it. One gap for your control mapping: NIOS offers no SHA-2 key type for NTP authentication. Then licenses. The trap is the temporary license. It lasts sixty days, can't be renewed, and when it expires the member's services stop and it's evicted from the Grid. So never let a production member run on one. And if the Microsoft Management license lapses, sync to the Windows servers stops. Now, the virtual appliances.

## Slide 8 — vNIOS on VMware, Azure and AWS

Virtual appliances, vNIOS, run on VMware, Azure and AWS. On VMware, the advice is to leave the VM's settings alone, because changing them may violate the licensing terms and stop it joining. On Azure and AWS, high availability arrived in 9.0.4, with limits to plan around, such as both nodes in the same region and zone, and no IPv6 failover. Here's the gap that matters for government: the HA prerequisites list only commercial cloud endpoints, with nothing for GovCloud or Azure Government. So ask Infoblox, in writing, before you rely on vNIOS failover there. And one constraint that shapes Part 2: vNIOS members can't manage Microsoft servers.

## Slide 9 — Part 2: Migrate from Microsoft

Part 2 is the migration from Microsoft, and it's the longest part, because it's where a mistake hurts users. We'll cover managing, importing, signed updates, the DHCP takeover and its one destructive trap, failover, and rollback.

## Slide 10 — Method A: manage the Windows servers, then take over

Method A is the one Book 08's coexistence phase leans on: manage the Windows servers first, then take them over. Grid members manage Windows DNS and DHCP without an agent, read-only or read-write, using a physical member with the Microsoft Management license. Most zone types and records sync, but conditional forwarders don't, so you still need Book 08's PowerShell export to recreate them. A few rules bite: each Windows server syncs into one view, the first sync belongs off-hours, and a failover mid-sync loses recent Grid-side changes. The design guidance is to add the Windows servers read-only in Phase 1, so the synced views become a live inventory. Then you move the zones.

## Slide 11 — Method B: import zones by transfer; bulk data by CSV

Method B moves zones by zone transfer. You let the Windows server transfer each zone to the Grid Master, create the same zone on NIOS, import it, and check the record counts and answers before you change any delegation or forwarder. That's Book 08's cutover loop. The import brings in the ordinary records, but recreates the zone's own name server and start-of-authority records rather than copying them, which matches Book 08's rule never to migrate the zone apex. Subzones come in as delegations, so import them separately. For bulk data there's an import wizard, but Infoblox warns mass imports can cause a service outage, so run them in a change window. Next, Active Directory zones.

## Slide 12 — AD zones and Kerberos-signed updates: use AES

Active Directory zones and Kerberos-signed updates start with a correction to the vendor's documentation. Infoblox's page for generating the key file shows RC4 encryption. But Microsoft's July 2026 update moved Kerberos RC4 protections into enforcement on domain controllers, so generate the key file with AES 256 instead. Book 08's default keeps the AD locator zones on AD DNS until the last domain controller goes, and even then NIOS needs AES keys so its DHCP can send signed updates. The alternative, NIOS hosting the AD zone itself, works, but no Infoblox page names Windows Server 2025 domain controllers. Confirm support before you take that path. Now, the DHCP takeover.

## Slide 13 — DHCP takeover: change assignments, never remove first

The DHCP takeover has one destructive trap. Infoblox documents that removing a managed Windows DHCP server from Grid management deletes all its ranges, leases and fixed addresses. So take the scopes over first, and remove the server from management last. The takeover itself is a handful of steps that move each range and fixed address from the Windows server to a Grid member. On the client side, Windows clients keep renewing with the server that issued their lease, so the old Windows scope has to stop answering, or clients keep its settings. Whether a client keeps its address isn't documented, so, as an inference, pilot one scope and lower lease times first. Then failover.

## Slide 14 — DHCP failover and DHCPv6 on NIOS

DHCP failover pairs two servers, and at least one must be NIOS. A mixed Windows and NIOS pair isn't offered, which is why Book 08 says to move both partners of a Windows failover relationship together. Leave the default settings alone unless you understand the consequences, and configure everything before you turn DHCP on. One common assumption is wrong: the Grid Master plays no part in failover; the peers talk directly. IPv6 is different. An IPv6 range is served by a single member with no failover, so redundancy comes from making that member a high-availability pair. That's not a regression, since Microsoft's DHCPv6 has no failover either. Now, how to back out.

## Slide 15 — Rollback: what reverses, and how

Every method needs a way back. Managing read-only is easy to undo, because nothing on Windows changed. Read-write is riskier, since switching back silently reverts recent Grid-side edits. For zone import, the Windows zone stays authoritative until you change delegation, so Book 08's cutover loop is the real rollback point. For the DHCP takeover, no Infoblox rollback procedure was found, so, as an inference, reverse the steps and reactivate the Windows scope. The NIOS database snapshot is a quick undo for configuration mistakes, but there's only one, and it isn't for migration data clients depend on. Throughout, each phase ends with a rollback point and a consistency test, not a calendar date.

## Slide 16 — Part 3: Sign and harden

Part 3 is signing and hardening. We'll cover DNSSEC on NIOS, the hardware security module, what the DISA STIG actually checks, FIPS mode, and administrator access, including two upgrade gates that can lock people out.

## Slide 17 — DNSSEC on NIOS: set parameters before you sign

On a Grid, only the Grid Master signs, acting as a hidden primary. The key rule is to set the parameters before you sign anything, because the defaults fail the STIG. Change the algorithm from RSA with SHA-1 to SHA-256 or an elliptic curve option, and raise the zone-signing key from 1024 bits to 2048, which lines up with Book 08's own guidance. The other defaults are fine, including automatic key rollovers. One decision to document: Book 08 records NIST's preference for NSEC, while the STIG requires NSEC3 for external zones, so decide it for internal zones. And if you ever change a signed zone's algorithm, add the new one before removing the old. Next, the HSM.

## Slide 18 — The HSM and DS publication

The hardware security module keeps the signing keys off the Grid. NIOS supports Thales Luna and Entrust nShield. The important step is registering both the Grid Master and the candidate, because the candidate becomes the signer after a promotion. Signing moves to the HSM at the next key rollover, not immediately, and NIOS never deletes keys from it. Then you publish DS records to the parent zone. If the parent is in the same Grid, that's automatic; otherwise you export them, and, as an inference, submit only the SHA-256 digest. For zones already signed on Windows, sign on NIOS and validate before you stop the old signing. Now, the STIG.

## Slide 19 — What the DISA NIOS 9.x STIG checks

The DISA STIG for NIOS 9 is narrower than people assume. Release one, accepted in August 2026, has forty-five rules, and it covers only the appliance's DNS capabilities. DHCP and address management hardening aren't in it, so those rely on the program's own baseline. The five most serious rules cover keeping the Grid Master hidden unless keys are on an HSM, DNSSEC validation, running the approved long-term-support version, validated cryptography, and no DSA keys. The rest cover zone transfers, dynamic updates, keeping internal and external roles apart, administrator sign-in, logging and resilience. One practical tip: check these settings at the zone level, not only at the Grid level. Next, FIPS mode.

## Slide 20 — FIPS mode: the procedure and what it changes

Turning on FIPS mode is a short procedure built around a factory reset, a longer shared secret, and a self-test reboot. The order matters: on a high-availability pair, set it on each node before forming the pair, and join special members before you enable it. After an upgrade, there's one extra command to make Grid traffic compliant. What changes is significant. Only modern TLS stays on, weak algorithms are flagged, and portal and cloud connections are disabled, and they aren't restored if FIPS mode is later turned off. Threat updates have to be uploaded by hand. And remember slide three: the certificates themselves are still pending. Next, administrator access.

## Slide 21 — Administrator access and two upgrade gates

Administrators should sign in with PIV, checked by OCSP, or with SAML through Entra, keeping the local admin as break-glass for directory outages. Put the GUI and API on the management port, restrict who can reach them, and add the consent banner. Now the two gates in the 9.1.0 upgrade that can lock people out. The test upgrade fails on administrator usernames that don't comply, and those users can't log in after the upgrade, so check them first. And older TLS versions must be turned off before you upgrade. For the STIG, the evidence is an authentication policy with a remote service, a password policy, and only approved CAs. That closes Part 3.

## Slide 22 — Part 4: Operate and evidence

Part 4 is running it and producing evidence. We'll cover upgrades and the point of no return, patching, backup and recovery, logging, automation, and the whole build mapped onto Book 08's six phases.

## Slide 23 — Upgrades: five steps, and the point of no return

Upgrades follow five steps: download, upload, distribute, test, and upgrade. The step to respect is distribution, because it's the point of no return. It removes the ability to revert to the version you had before. The test upgrade is mandatory from 9.1.0 onward, and it catches data errors before they hurt you. During the upgrade, avoid changing or restarting members, and recreate scheduled tasks afterward, because a full upgrade deletes them. Reverting a single member is possible only in a short window, and reverting the whole Grid loses every change since. As for long-term support, by inference the current train runs to about April 2027, so confirm the approved federal build. Next, patching.

## Slide 24 — Patching: hotfixes, images and known exploits

Patching has a couple of catches. Hotfixes go to the Grid Master and every member, and members that join later need them applied again. Common Criteria Grids need a different upgrade image, so check which one you upload. The bigger point is what to watch. CISA's catalog of known exploited vulnerabilities lists no Infoblox product, but it does list an old BIND vulnerability, added on October eighth, 2026. Because NIOS ships BIND, the program's patch watch covers BIND advisories too, not only Infoblox's own notices, mapped against the release notes. Next, backup and recovery.

## Slide 25 — Backup, restore and Grid Master recovery

Backup is off by default, so schedule it, and send it by SCP rather than FTP, which sends credentials in clear text. Back up before every upgrade, restore or revert. Restoring has a wrinkle: SCP isn't listed as a restore source, so, as an inference, copy backups back to the management system and rehearse restoring from there. Losing the Grid Master means promoting the candidate from its console. Notify members one at a time, which Infoblox says can minimize DNS outages, then confirm every member has reconnected, and update anything that pointed at the old Grid Master, including the HSM. Written down, those steps are the STIG's documented promotion procedure. Next, logging.

## Slide 26 — Logging and evidence for the SIEM

Logging is where the evidence comes from. Send syslog to external servers over secure TCP, use the detailed audit log, which also records API calls, and copy the audit log to syslog, which the STIG requires. Be careful with full DNS query logging, because Infoblox warns it significantly affects performance, so use capture or dnstap instead. DHCP lease history is what ties an address to a device at a point in time. On a FIPS Grid, the portal-managed Data Connector is likely unavailable, as an inference, so rely on syslog or dnstap. And the SIEM is the system of record, because local retention can't meet the six-month and twelve-month requirement. Next, automation.

## Slide 27 — Automation: what you can codify, and what you can't

Much of the Grid can be codified, but not all of it. Terraform's NIOS provider version 2 needs NIOS 9.1.0 and covers most of the build, from members and zones to DHCP, failover and admin roles. A new combined provider is in beta and isn't backward compatible, so, as an inference, build on version 2 now and plan to re-import state later. Ansible covers a lot too, but has nothing for failover or DNSSEC. And some things stay manual: FIPS mode, the factory reset, promoting the candidate, the HSM and DNSSEC signing. Write those as runbooks that capture their evidence as they go. Now, the whole build in order.

## Slide 28 — The build mapped to Book 08's six phases

Here's the whole build laid onto Book 08's phases, and the order is the program's design guidance. Phase 0 makes the four decisions. Phase 1 builds a lab Grid, then production in order, from the Grid Master pair and candidate to sign-in, logging and backups, with the Windows servers added read-only. Phase 2 coexists, adding members on premises and in each cloud hub. Phase 3 moves authority zone by zone and scope by scope, re-signing signed zones on NIOS. Phase 4 federates the clouds, with Universal DDI only on non-FIPS scopes. Phase 5 decommissions behind Book 08's gates, locator zones last. And Phase 6 finishes the STIG items and evidence.

## Slide 29 — Decisions, vendor asks and next steps

To close. The decisions are yours: FIPS mode, knowing it costs cloud management, an HSM or a documented exception, NSEC or NSEC3 for internal zones, where the locator zones live, and how many physical managing members you need. There are questions to put to Infoblox in writing, mainly around the approved federal build, certification timing, Windows Server 2025, and failover in the government clouds. The next steps are concrete: stand up a lab Grid, sign a test zone, pilot one DHCP takeover, and run the STIG checklist. The program's view is plain: NIOS can carry Book 08's design, and its risks are manageable if the Phase 0 decisions come first. This is the program's research, under review, not an endorsement by any federal agency. Thank you.
