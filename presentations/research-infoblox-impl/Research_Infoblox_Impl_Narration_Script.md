# Implementing Book 08 on Infoblox NIOS — Implementation Guide — narration script (practice copy)

## Slide 1 — Implementing Book 08 on Infoblox NIOS

This is an implementation guide. The Federal Modernization Workbook's Book 08 sets the program's design for DNS, DHCP and IP address management, and the Research section's deep dive explains why Infoblox is one of the strongest platforms for it. This guide shows how to build that design on Infoblox NIOS, version 9.1, and how to move off Microsoft DNS and DHCP without breaking anything.

It runs in four parts after a short orientation. Part 1 builds the Grid: the Grid Master, its candidate, members, time, licensing, and virtual appliances in the clouds. Part 2 migrates from Microsoft: managing the Windows servers first, importing zones, Active Directory zones and secure updates, and taking over DHCP. Part 3 signs and hardens: DNSSEC, the hardware security module, the DISA STIG, FIPS mode and administrator access. And Part 4 covers running it: upgrades, backup and recovery, logging, automation, and the build mapped onto Book 08's six phases.

The ground rules are the same as the other implementation guides. Every fact comes from a primary source; the new ones were opened on October twenty-third, 2026. Sequencing recommendations are labeled design guidance, and inferences are labeled as inferences.

Sources: Research brief, Implementing Book 08's DDI design on Infoblox NIOS (verified Oct. 23, 2026), with the earlier verified Infoblox briefs it reuses; Infoblox NIOS 9.1.x, NIOS upgrade and FIPS/CC documentation; DISA Infoblox NIOS 9.x STIG V1R1; Book 08, Chapters 04, 06, 08 to 11.

## Slide 2 — What this guide implements: Book 08 on a Grid

What does this guide implement? The Federal Modernization Workbook's Book 08's design, mapped onto the way Infoblox works.

Book 08 wants governed authoritative DNS and IP address management. On NIOS that's a Grid: one Grid Master holds the database, and every member gets its copy over an encrypted tunnel. Part 1 builds it.

Book 08 wants a coexistence period with Microsoft DNS and DHCP. On NIOS, managing members synchronize the Windows servers over Microsoft's remote procedure call protocol, read-only first. Book 08 moves zones and scopes one at a time; on NIOS that's zone import by transfer, and a DHCP takeover done by changing server assignments. Book 08's default keeps the Active Directory locator records on AD DNS until the last domain controller goes, and this guide keeps that default, showing NIOS hosting the AD zone only as the alternative. Part 2 covers all of that.

Book 08 Chapter 06 requires DNSSEC. On NIOS, the Grid Master signs as a hidden primary, with keys in its database or a hardware security module. That's Part 3. And Chapter 11's evidence becomes secure syslog to the SIEM, a copy of the audit log, backups and the STIG checklist, in Part 4.

Book 08's six phases still govern. This guide adds a Phase 0 of decisions, because some NIOS choices can't be undone cheaply.

Sources: Book 08, Chapters 04 (AD DNS departure), 06 (DNSSEC), 08 (reference architecture), 10 (six phases, cutover loop), 11 (operations and evidence); Infoblox NIOS 9.1.x About Grids, Managing Microsoft Windows servers, Importing zone data, DNSSEC on a Grid; research brief section 10.

## Slide 3 — Phase 0: decide these before you build anything

Before Phase 1, four decisions, because each is expensive to reverse.

First, FIPS mode. On NIOS you can set it only from the command line, and only after a factory reset, the reset all command. On a Grid you set it on the Grid Master, and members take it when they join. Turning it off again also needs reset all. And enabling it disables every cloud connection, including the Infoblox Portal. So a FIPS-mode Grid can't use Universal DDI hybrid management, and by my inference it loses the portal-managed Data Connector as well. Be precise about the claim, too: Infoblox says NIOS 9.0.7 and later is supported in FIPS and Common Criteria mode, but that the FIPS 140-3 and Common Criteria certifications are still pending. Running in FIPS mode isn't the same as holding a validated module.

Second, the Long Term Support train. One of the STIG's category one rules measures you against the current approved long-term-support version for federal systems.

Third, the DNSSEC defaults. NIOS defaults to RSA with SHA-1, and a 1024-bit zone-signing key. Change both before you sign anything, because fixing it later means an algorithm rollover and new DS records at the parent.

And fourth, the hardware security module. The STIG wants the Grid Master hidden from every zone's name server list, and HSM signing, or a documented exception.

Sources: Infoblox NIOS FIPS and CC mode: Enabling FIPS or CC mode, and Guidelines for FIPS/CC mode; NIOS 9.1.x Configuring DNSSEC parameters; DISA Infoblox NIOS 9.x STIG V1R1, rules V-285229, V-285269 and V-285308; research brief sections 0.1 to 0.3.

## Slide 4 — Part 1: Build the Grid

Part 1: build the Grid.

We'll start with the Grid Master, built as a high-availability pair, and its candidate, the appliance that takes over if the Grid Master is lost. Then how members join, the ports the Grid needs, time, and licenses, including one licensing trap that can evict a member from the Grid. And finally the virtual appliances, vNIOS, on VMware, Azure and AWS, where the government regions have a documentation gap.

Sources: Infoblox NIOS 9.1.x Grid setup, HA, joining members, ports, NTP and license documentation; vNIOS for VMware, Azure and AWS installation guides; the Federal Modernization Workbook's Book 08, Chapter 08.

## Slide 5 — The Grid Master: an HA pair, built in order

The Grid Master. Infoblox's sequence is simple: create the Grid Master first, then add members, and build the Grid Master as a high-availability pair.

Physically, cable each node's LAN1 and HA ports to the switch, and put the nodes on separate power circuits where you can. The pair uses VRRP, so the switch ports matter. Spanning tree off, or Portfast. No EtherChannel or port channeling. IGMP snooping off. Trunking off unless you tag VLANs. Speed and duplex matched. And DHCP snooping disabled or trusted; Infoblox says it must be disabled to run DHCP on the Grid.

On node one, run the wizard to configure a Grid Master. It enters the Grid name, the shared secret, a virtual router ID that's unique on the subnet, the virtual address, and each node's addresses, plus the time zone and NTP servers. On node two, run Join Existing Grid with the same name, the virtual address and the secret. After that, manage the pair through the virtual address.

Now the defaults, which you must change: the login is admin and infoblox, the Grid name is Infoblox, and the shared secret is the word test. Escrow the new secret; Infoblox says if you forget it, you have to contact their support. Two more rules: no IPv6 high availability on public clouds, and appliances with less than two hundred fifty gigabytes of disk shouldn't be Grid Masters.

Sources: Infoblox NIOS 9.1.x Creating a Grid Master; Setting up an HA Grid Master (physical placement, LCD); Guidelines for switch ports in an HA pair; Configure a Grid Master wizard; Join Existing Grid wizard; NIOS 9.x guide (disk size rule) from the earlier platform brief.

## Slide 6 — The candidate, joining members, and Grid ports

Next, the Grid Master Candidate. You designate it in the member's properties with the Master Candidate option. It holds a full copy of the database, and it should be the same model as the Grid Master. Infoblox gives you a promote test, which sends crafted packets from the candidate to the members you pick. It runs for at most a hundred twenty seconds, only one candidate can be tested at a time, and never during an upgrade. One quirk: behind NAT in Azure, the test fails but the real promotion works.

Joining members. Define each member on the Grid Master before you configure the appliance. Then join it with the Grid Master's virtual address, the Grid name and the shared secret, through the wizard, Grid Manager or the command line. Status icons show green for joined, yellow for joining and red for not joined. A dual-mode Grid needs a dual-mode candidate.

The ports. Members need UDP 2114 for key exchange and UDP 1194 for the Grid's VPN tunnel to the Grid Master and candidate. HA pairs use VRRP and must share a subnet. DHCP failover uses TCP 647, and 7911 for partner down. Managing Windows servers needs 135, 445 and the dynamic RPC range. And secure syslog uses 6514.

But FIPS mode changes this. The Grid's OpenVPN runs over TCP 22, and port 1023 carries HA passive to active. So, my inference, firewall rules written only for 1194 and 2114 won't be enough on a FIPS Grid.

Sources: Infoblox NIOS 9.1.x Designating a Grid Master Candidate; GMC Promote Test; Joining appliances to the Grid; Defining members; Source and destination ports for services (version 2, dated Oct. 6, 2026); NIOS FIPS/CC Enabling FIPS or CC mode; vNIOS for Azure limitations.

## Slide 7 — Time first, then licenses: two quiet failure modes

Two quiet failure modes, time and licenses.

Time first. Enable NTP and set the external servers at the Grid level before you configure the Grid Master and members as clients. The Grid Master then serves time to the members inside the encrypted tunnel, and if it goes offline, the candidate and members sync to the external servers. The STIG requires the external servers at the Grid level and recommends at least three. A clock more than five minutes off is stepped immediately; a smaller error is slewed. Time isn't cosmetic here: Grid synchronization, Kerberos-signed updates, and DHCP failover all depend on it. One gap to note for your control mapping: NIOS lists NTP authentication keys of MD5, DES and SHA-1 only, with no SHA-2 option.

Licenses. Member licenses bind to a hardware ID, Grid-wide licenses bind to the Grid Master and replicate, and subscriptions expire with the contract. The trap is the temporary license. It lasts sixty days and can't be renewed, and when it expires, the member's services stop and it's evicted from the Grid. So never let a production member run on one. Install licenses on both nodes of an HA pair, and expect the NIOS and some add-on licenses to restart the product. If the Microsoft Management license expires, synchronization to the Windows servers stops. For VMware, get permanent keys by submitting each VM's hardware ID, and allow a day or two.

Sources: Infoblox NIOS 9.1.x Configuring NTP (Grid and member), NTP clock behavior, NTP authentication keys; License types, Expiring licenses, Installing licenses; vNIOS for VMware obtaining permanent licenses; DISA Infoblox NIOS 9.x STIG V1R1, V-285309.

## Slide 8 — vNIOS on VMware, Azure and AWS

Virtual appliances, vNIOS, in each environment.

On VMware, the OVA comes from Infoblox's support site, which needs a login. Infoblox says not to change the VM's settings in vSphere, because that may violate the virtual licensing terms and stop the VM joining. Mixed SR-IOV and regular network cards aren't supported, and cloned VMs aren't either.

On Azure, marketplace deployment is supported on Azure public and Azure Government, with managed disks only. High availability arrived in 9.0.4, and needs a custom role and a managed identity. The limits to plan around: DHCP failover doesn't work behind NAT, there's no LAN2, no IPv6 high availability, and both HA nodes must be in the same region, resource group, availability zone and size.

On AWS, high availability also starts at 9.0.4, and needs the VPC and subnets, an HA IAM role, and a Grid DNS resolver that can reach the IAM and EC2 endpoints. Same limits: no IPv6 HA, same region, zone and instance type.

Now the gap. The HA prerequisites list only commercial endpoints. AWS lists the global and China endpoints, not GovCloud. Azure lists management dot azure dot com and login dot microsoftonline dot com, with no Azure Government equivalents. And failover time depends on the cloud's own API. So ask Infoblox, in writing, before you rely on vNIOS failover in either government cloud.

One more constraint that shapes Part 2: vNIOS members can't manage Microsoft servers.

Sources: Infoblox vNIOS for VMware installation guide (OVA, VM settings, SR-IOV); vNIOS for Azure (Marketplace support, managed disks, HA prerequisites, custom role and managed identity, limitations page version 19, Aug. 31, 2026); vNIOS for AWS (HA prerequisites and limitations); NIOS 9.1.x Guidelines for managing Microsoft servers.

## Slide 9 — Part 2: Migrate from Microsoft

Part 2: migrate from Microsoft. This is the longest part, because it's where a mistake hurts users.

We'll start with the method the Federal Modernization Workbook's Book 08's coexistence phase relies on: Infoblox managing the Windows servers before it takes them over. Then zone import, Active Directory zones and Kerberos-signed dynamic updates, where a Microsoft change from July 2026 breaks the vendor's example. Then the DHCP takeover, which has one destructive step to avoid, DHCP failover and IPv6, and finally how each method rolls back.

Sources: Infoblox NIOS 9.1.x Managing Microsoft Windows servers, Importing zone data, GSS-TSIG and DHCP failover documentation; Microsoft Learn DNS, DHCP and Kerberos RC4 pages; Book 08, Chapter 10.

## Slide 10 — Method A: manage the Windows servers, then take over

Method A, which the Federal Modernization Workbook's Book 08's coexistence phase leans on: manage the Windows servers first, then take them over.

Grid members manage Windows DNS and DHCP servers without an agent, over Microsoft's RPC protocol, in read-only or read-write mode. Edits sync in both directions. It needs the Microsoft Management license on the managing member, and as we saw, that member must be a physical appliance. Infoblox recommends dedicated managing members close to the Windows servers, not the Grid Master or candidate. The service account needs DnsAdmins for DNS, DHCP Administrators for DHCP, and the right to start and stop the services, rather than full administrator.

What syncs: forward and reverse zones, Active Directory-integrated zones, stub zones, delegations and most record types. What doesn't: conditional forwarders, trust anchors, cached and root zones, and a few legacy record types. So you still need Book 08's PowerShell export to recreate every forwarder.

Three rules that bite. Each Windows server syncs into one network view and one DNS view, so overlapping servers need separate views. Schedule the first sync off-hours. And if an HA managing member fails over mid-sync, that sync aborts, and Grid-side changes made since the last sync are lost.

The program's design guidance: in Phase 1, add the Windows servers read-only, and the synced views become a live inventory alongside the export.

Sources: Infoblox NIOS 9.1.x Managing Microsoft Windows servers; Guidelines for managing Microsoft servers; Requirements for the Microsoft server account; Synchronized data; Book 08, Chapter 10 (Phase 1 illustrative commands); research brief section 2.1.

## Slide 11 — Method B: import zones by transfer; bulk data by CSV

Method B: import zones by zone transfer.

On NIOS, zone import is a zone transfer. The Windows server must be authoritative and must allow transfers to the destination, which on a Grid is the Grid Master's address, or its virtual address for an HA pair. On Windows, that's one PowerShell command per zone, Set DNS Server Primary Zone, with the secure secondaries setting pointed at the Grid Master. Then create the zone on NIOS with the same name, import it, one zone with its subzones per run, and validate record counts and answers before you change any delegation or forwarder. That's the Federal Modernization Workbook's Book 08's cutover loop.

What the import does: it brings in address, alias, service, text, mail, pointer and host records. It recreates the NS and SOA records for the new primary rather than copying them, which matches Book 08's rule to never migrate the zone apex. Subzones become delegations, and their records aren't imported, so import them separately. If an import fails, the zone is left disabled. And records with a blank name need superuser rights or an explicit permission.

For bulk data, Infoblox's Data Import Wizard, from the support site, reads Microsoft, ISC, VitalQIP and CSV formats, and the CSV Import Manager can verify a file before it replaces anything. Infoblox warns that mass imports will significantly affect member performance, resulting in service outage, so run them in a change window.

Sources: Infoblox NIOS 9.1.x Importing zone data; Data Import Wizard; CSV Import Manager; Mass operations guidance; Microsoft Learn Set-DnsServerPrimaryZone (Windows Server 2025 PowerShell) and Configure zone transfer settings; Book 08, Chapter 10 (cutover loop).

## Slide 12 — AD zones and Kerberos-signed updates: use AES

Active Directory zones and Kerberos-signed dynamic updates. Start with a correction to the vendor's documentation.

Infoblox's NIOS 9.1 page for generating the keytab, the key file NIOS uses for Kerberos-signed updates, shows the ktpass command with RC4 encryption. Microsoft's July 2026 security update moved Kerberos RC4 protections into enforcement mode on domain controllers, with no rollback, and Windows Server 2025 domain controllers don't issue RC4 ticket-granting tickets. So generate the keytab with AES 256. Note that ktpass also resets the account's password and increments its key version.

The Federal Modernization Workbook's Book 08's default is that the locator zones stay on AD DNS, reached by forwarding, until the last domain controller goes. Under that default, NIOS still needs AES keytabs, loaded in Phase 2, so that its DHCP can send signed updates. One limit: an Infoblox DHCP server sends signed updates for one domain only, though each member can serve a different domain. Keys survive upgrades.

The alternative is NIOS hosting the AD zone itself. Allow transfers from the domain controller, import the AES keytab, create the zone with the exact AD name, import it, and allow signed updates. The wizard creates the underscore zones, such as underscore msdcs and underscore sites. Then clear the option that allows unsigned updates. But the Infoblox pages list domain controllers up to 2016 on one page and 2022 on another, and none names Windows Server 2025. Confirm support before you take this path.

Sources: Infoblox NIOS 9.1.x Generating the keytab file (Windows Server 2016/2019/2022); Configuring DNS for Active Directory; Configure Active Directory wizard; About GSS-TSIG; Kerberos behavior; GSS-TSIG and upgrades; Microsoft Learn Detect and remediate RC4 usage in Kerberos; Windows message center (July 2026 enforcement); Book 08, Chapter 04.

## Slide 13 — DHCP takeover: change assignments, never remove first

The DHCP takeover, which has one destructive trap.

Infoblox documents that when you remove a managed Windows DHCP server from Grid management, Grid Manager deletes all the DHCP ranges, leases and fixed addresses associated with it. So the order is: take the scopes over first, and remove the server from management last.

The takeover itself is five steps, from Infoblox's page on modifying DHCP server assignments. Set every fixed address in the scope to the server None. Set every range served by the Windows server to None. In the network's member assignment, replace the Windows server with a Grid member. Assign the ranges to that member. Then restart services. Infoblox says you don't need to clear the old leases, because the member clears them when the assignment changes.

Now the client side, from Microsoft's documentation. Windows clients renew by unicast to the server that issued the lease at half the lease time, and rebind by broadcast to any server at eighty-seven and a half percent. So the old Windows scope must stop answering, deactivated or with the service stopped, or clients keep renewing with it and keep its options, including the DNS servers in option six.

What isn't documented is whether a client keeps the same address across the takeover. My inference: pilot it on one scope, and lower lease times beforehand to shorten the transition. Then follow the Federal Modernization Workbook's Book 08's last step, de-authorizing the old server.

Sources: Infoblox NIOS 9.1.x Modifying DHCP server assignments; Removing a Microsoft server from Grid management; Synchronized DHCP data; Microsoft Learn Troubleshoot problems on the DHCP client (renewal at 50 and 87.5 percent); Book 08, Chapter 10 (Phase 3 DHCP scopes, Phase 5 de-authorization).

## Slide 14 — DHCP failover and DHCPv6 on NIOS

DHCP failover, and IPv6.

The rules, from Infoblox's failover page. Peers are two NIOS servers, or NIOS and an ISC-compliant server; at least one must be NIOS. A mixed pair of Windows and NIOS isn't offered, and that's why the Federal Modernization Workbook's Book 08 says to move both partners of a Windows failover relationship together. Peers talk on TCP 647 by default, or 519 on Grids upgraded from older versions, and on 7911 for partner down. The defaults are a fifty-fifty load balance and a maximum client lead time of one hour, and Infoblox says not to change them unless you understand the consequences. Each pair of servers can be in only one association, covering IPv4 ranges in one network view. And configure everything before you enable DHCP.

One correction to a common assumption: the Grid Master plays no part in failover. The peers talk directly. On Azure, failover doesn't work behind NAT, and Universal DDI's portal can't manage NIOS failover associations.

Then IPv6. An IPv6 range is served by a single Grid member; there's no failover association for it. So redundancy comes from making that member an HA pair, served through its virtual address, or, by my inference, from non-overlapping ranges on two members. That isn't a regression: Microsoft's DHCPv6 has no failover either.

Sources: Infoblox NIOS 9.1.x Configuring DHCP failover associations (rules, ports, load balance, MCLT); IPv6 range wizard; About bloxHA; DHCPv6 lease affinity; vNIOS for Azure limitations; earlier platform brief (Universal DDI hybrid limits); Microsoft Learn DHCP failover overview.

## Slide 15 — Rollback: what reverses, and how

Rollback, method by method.

If you're managing the Windows servers read-only, rollback is simply to stop managing them; nothing on Windows changed. In read-write mode, be careful: changing the managing member, or switching to read-only, reverts any Grid Manager edits made since the last sync, silently.

For zone import, the Windows zone stays authoritative until you change delegation or forwarders, so the Federal Modernization Workbook's Book 08's cutover loop is the real rollback point, and NIOS can also restore zone data after an import.

For the DHCP takeover, I found no Infoblox rollback procedure. My inference, mirroring the forward steps: reverse the server assignments, reactivate the Windows scope, and let clients renew.

For configuration mistakes on NIOS itself, there's the database snapshot, which you take from Grid Manager. Rolling back to it is faster than a restore, but it covers only the database. There's only one, and a candidate promotion, an upgrade or a restore deletes it. Don't use it to undo migration data that clients already depend on.

And Book 08's rule holds throughout: each phase ends with a rollback point and a resolution-path consistency test, not a calendar date, and the Windows exports are archived before anything is removed.

Sources: Infoblox NIOS 9.1.x Microsoft server management modes; Importing zone data and Restoring zone data; Modifying DHCP server assignments; Database snapshots; earlier divisions brief (read/write revert behavior); Book 08, Chapter 10.

## Slide 16 — Part 3: Sign and harden

Part 3: sign and harden.

First DNSSEC on NIOS: how signing works on a Grid, the parameters to set before you sign, and how to publish DS records. Then the hardware security module. Then what the DISA STIG for NIOS 9 actually checks, which is narrower than people assume. Then the FIPS mode procedure, and finally hardening administrator access, including two upgrade gates that can lock people out.

Sources: Infoblox NIOS 9.1.x DNSSEC and HSM documentation; NIOS FIPS and CC mode documentation; DISA Infoblox NIOS 9.x STIG V1R1; the Federal Modernization Workbook's Book 08, Chapter 06.

## Slide 17 — DNSSEC on NIOS: set parameters before you sign

DNSSEC on NIOS. On a Grid, only the Grid Master signs, acting as a hidden primary, and signing a zone makes it the zone's primary server. You set the parameters in the Grid's DNS properties, in advanced mode, and individual zones can override them.

Set them before you sign anything, because the defaults fail the STIG. The default algorithm is RSA with SHA-1, for both keys. Change it to RSA with SHA-256, or ECDSA with P-256 or P-384. The default zone-signing key is 1024 bits; raise it to 2048 for RSA, and keep the key-signing key at least as large, which is Infoblox's own advice. The Federal Modernization Workbook's Book 08 Chapter 06, citing NIST, says RSA keys of at least 2048 bits, with elliptic curve preferred.

The other defaults are fine. Signature validity is four days, inside the STIG's two-to-seven-day window. Denial of existence is NSEC3, which the STIG requires for external zones. Zone-signing keys roll every thirty days by pre-publication, which Infoblox recommends. Key-signing keys roll yearly, automatically, with notifications when the parent's DS record needs a manual update.

One decision to document: Book 08 records NIST's preference for NSEC, while the STIG requires NSEC3 externally. Decide it for internal zones.

And if you ever change a signed zone's algorithm: add the new one, wait longer than the record lifetimes, update the parent's DS, and only then remove the old one.

Sources: Infoblox NIOS 9.1.x Configuring DNSSEC parameters (defaults and recommendations); Signing a zone; ZSK rollover; KSK rollover and notifications; Changing algorithms; DISA Infoblox NIOS 9.x STIG V1R1 rules V-285246, V-285265, V-285274 and V-285279; Book 08, Chapter 06 (NIST SP 800-81r3).

## Slide 18 — The HSM and DS publication

The hardware security module, and publishing DS records.

The HSM is configured by a superuser, one HSM group at a time, and deleting a group is permanent. NIOS supports Thales Luna, on TCP 1792, and Entrust nShield, on TCP 9004. Register both the Grid Master and the candidate with it, because the candidate becomes the signer after a promotion. For Luna, generate client certificates for both, give HA nodes distinct names, and add a route for the Grid's virtual address. For nShield, enroll both addresses. Then enable HSM signing, which is a Grid-level setting. Signing moves to the HSM at the next key rollover, not immediately. Key lifecycle lives on the HSM, and NIOS never deletes keys from it. The Grid sends SNMP traps on signing success or failure.

Publishing DS records. If the parent zone is in the same Grid, NIOS inserts the DS records automatically. Otherwise, export the trust anchors, as DNSKEY, DS, or BIND format. The exported DS file carries both SHA-1 and SHA-256 digests; my inference is to submit only the SHA-256 one to the parent. And the Check KSK Rollover Due tool lists keys due within a week.

For zones already signed on Windows, follow the Federal Modernization Workbook's Book 08 Chapter 06's order: finish any rollover, sign on NIOS, publish the new DS, validate, and only then stop the old signing. NIOS doesn't sync Windows trust anchors, so recreate them.

Sources: Infoblox NIOS 9.1.x HSM groups overview, Thales Luna configuration, Entrust nShield configuration, Enabling HSM signing; Exporting trust anchors; Check KSK rollover due; Source and destination ports; Book 08, Chapter 06.

## Slide 19 — What the DISA NIOS 9.x STIG checks

What the DISA STIG for NIOS 9 actually checks.

Version one, release one, accepted in August 2026, has forty-five rules: five in category one and forty in category two. Its scope is only the DNS capabilities of the appliance. DHCP and IPAM hardening aren't in it, so those rely on the program's own baseline. It was written for the Department of War, and the overview says other agencies are free to use it, though some settings may not fit.

The five category one rules. The Grid Master is stealth, hidden, in every zone and name server group, which isn't a finding if the keys are on an HSM. DNSSEC is enabled and validating. NIOS runs the current approved long-term-support version for federal systems, under maintenance. Cryptography is FIPS-validated, so no RSA with SHA-1, which doesn't apply on a FIPS-mode Grid. And no DSA for DNSSEC.

The forty category two rules group into areas. Zone transfers only to named secondaries, and dynamic updates restricted by Kerberos signing or access lists. Internal and external roles kept apart, with no recursion on external authoritative servers. Administrator access through a multi-factor policy with a remote service, a password policy, and only approved CAs. External syslog plus a copy of the audit log to syslog. And resilience: a documented primary promotion procedure, HSM signing, and NTP.

One practical point from the overview: check these settings at the zone level, not only at the Grid level.

Sources: DISA Infoblox NIOS 9.x STIG V1R1: XCCDF benchmark (July 28, 2026) and Overview document, downloaded Oct. 22, 2026 and re-read Oct. 23, 2026; rules V-285229, V-285259, V-285269, V-285274, V-285279 and the CAT II rules cited in research brief section 5.1; earlier federal brief (Infoblox 8.x DNS STIG V1R4).

## Slide 20 — FIPS mode: the procedure and what it changes

FIPS mode: the procedure, and what it changes.

The procedure has five steps. Run reset all, the factory reset. Configure the network and licenses. Change the Grid's shared secret, which in FIPS or Common Criteria mode must be twenty to sixty-four characters. Run set fips mode, or set cc mode. The appliance reboots and runs self-tests, and if a self-test fails, it loops on the console. On an HA pair, set the mode on each node before you form the pair. Join any reporting or other special members before you enable it. And after you upgrade a FIPS Grid, run the distributed Grid communication mode command to make Grid traffic compliant; a banner reminds you until you do.

What changes. Only TLS 1.2 and 1.3 stay enabled, and Infoblox flags DES, DSA, RSA with SHA-1 and MD5 as not compliant with FIPS 140-3. Portal and cloud connections are disabled, and they aren't restored if FIPS mode is later turned off. Threat rulesets and module sets have to be uploaded by hand. In Common Criteria mode the command line is console-only. The local admin password must be changed on first login.

On the STIG side, the rule against RSA with SHA-1 doesn't apply to a FIPS-mode Grid. But remember slide three: the certificates themselves are still pending.

Sources: Infoblox NIOS FIPS and CC mode: Enabling FIPS or CC mode (procedure, HA, shared secret, distributed Grid communication mode); Guidelines for FIPS/CC mode (algorithms, TLS, portal, rulesets, CLI); DISA Infoblox NIOS 9.x STIG V1R1, V-285274.

## Slide 21 — Administrator access and two upgrade gates

Administrator access, and two upgrade gates.

Administrators sign in with PIV through X.509 client-certificate authentication, checked by OCSP. The administrator's name must match the certificate's common name, or NIOS can match on the UPN or email in the subject alternative name. SAML works too, with Entra and group mapping, but SAML-only users have no command line. Put the GUI and API on the management port; serving them on both management and LAN1 is off by default. Use the set security command to restrict which source addresses can reach the GUI. Add the notice and consent banner, which can be up to ten thousand characters. And keep the local admin as break-glass for directory outages.

Now two gates in the 9.1.0 upgrade that can lock people out. The test upgrade fails on administrator usernames that don't comply, for example ones that don't start with a letter or that mix scripts, and non-compliant users can't log in after the upgrade. Check first with the show non-compliant usernames command. And TLS 1.0 and 1.1 must be turned off before the upgrade.

For the STIG, the evidence is an authentication policy that includes at least one remote service, with the two-factor banner showing, a password policy, and only approved CAs in the certificate list. The STIG names the Department of War's PKI; my inference is that a civilian agency reads that as its own approved CA set.

Sources: Earlier divisions brief (CAC/PIV and SAML authentication on NIOS); Infoblox NIOS 9.1.x set security command; Using the MGMT port; Notice and consent banner; NIOS upgrade guidelines for 9.1.0 (usernames, TLS); DISA Infoblox NIOS 9.x STIG V1R1, V-285296, V-285297 and V-285260.

## Slide 22 — Part 4: Operate and evidence

Part 4: operate and evidence.

First upgrades: the five steps, the point at which you can no longer go back, and long-term support. Then patching. Then backup and restore, and how to recover if the Grid Master is lost. Then logging to the SIEM, and what can and can't be automated. And finally the whole build mapped onto the Federal Modernization Workbook's Book 08's six phases, with the decisions and vendor asks to close.

Sources: Infoblox NIOS upgrade, backup and restore, Grid Master Candidate, logging and Data Connector documentation; terraform-provider-nios and infoblox-ansible repositories; CISA KEV catalog; Book 08, Chapters 10 and 11.

## Slide 23 — Upgrades: five steps, and the point of no return

Upgrades. Infoblox's process has five steps: download, upload to the Grid Master, distribute, test, and upgrade. Read the release notes first; they list the addressed CVEs, and they're behind the support login.

Upload goes to the active Grid Master node. If it fails over before distribution, upload again.

Distribution is the point of no return. It loads the new software into the alternate partition, which removes the ability to revert to the version you had before. And once it starts, you can't add, remove or regroup members.

The test upgrade is mandatory from 9.1.0 onward. It doesn't affect services, and it reports data translation errors before they hurt you.

Then the upgrade itself runs by upgrade group. During a full upgrade, scheduled and approval tasks are deleted, so recreate them after. Don't change member DNS or DHCP properties, restart members not yet upgraded, or rename members. HA pairs fail over, and if DNSSEC operations are in flight, upgrade the candidate right after the Grid Master. Infoblox expects you to finish within a couple of days, and warns at nine.

Reverting one member is possible only while the upgrade is paused, within its revert window, twenty-four hours by default. Reverting the whole Grid restarts it at once and loses every change since, including new leases.

Long-term support: 9.0.6 in April 2025 started a twenty-four-month train, so by my inference its window runs to about April 2027. Confirm the approved federal build on the support portal.

Sources: Infoblox NIOS upgrade guide: Upgrading NIOS (five steps), Uploading, Distributing, Test upgrade, Full and lite upgrades, Upgrade groups, During the upgrade, Reverting a member, Reverting the Grid; Upgrade guidelines for NIOS 9.1.0; earlier platform brief (LTS program).

## Slide 24 — Patching: hotfixes, images and known exploits

Patching.

Infoblox's hotfix procedure: back up first, then in Grid Manager apply the hotfix to the Grid Master and every member, upload it, and use the show action to activate hotfix command to see whether a member needs a reboot. Two catches. Members that join the Grid after a hotfix must have it applied again. And a custom hotfix has to go through Infoblox Support first.

On a Common Criteria Grid, upload the dot bin two upgrade image, not the plain dot bin. And in 9.1.0, if the Grid has Threat Insight or flex licenses, use the image that includes Threat Insight, or distribution fails.

For known exploited vulnerabilities, I checked CISA's catalog, version 2026.10.21, with 1,754 entries. It lists no Infoblox product. It does list an old ISC BIND vulnerability, CVE-2015-5477, added on October eighth, 2026, with a short remediation deadline. Because NIOS 9.1 ships BIND 9.20, the program's patch watch covers ISC's BIND advisories and the catalog's BIND entries, not only Infoblox's own notices. Map each against the release notes' list of addressed CVEs.

Sources: Infoblox NIOS upgrade guide: Applying consolidated hotfixes; NIOS 9.1.x uploading upgrade images (bin2 for CC); Upgrade guidelines for NIOS 9.1.0 (Threat Insight image); CISA Known Exploited Vulnerabilities catalog JSON feed, catalog version 2026.10.21; earlier platform brief (BIND 9.20).

## Slide 25 — Backup, restore and Grid Master recovery

Backup, restore, and recovering the Grid Master.

Backup first. Automatic backup is off by default, so schedule it. Send it by SCP, over SSH version two, not FTP, which sends credentials in clear text. One detail: SCP uses LAN1 even when the management port is enabled, so the firewall path has to allow it. Back up before every upgrade, restore or revert, and again after changing the Grid's IP mode, because restoring an older backup afterward can stop members rejoining.

Restore. SCP isn't listed as a restore source; the choices are your computer, TFTP, FTP or the Grid Master's local backups. My inference is to copy SCP backups back to the management system and restore from there, and to rehearse that. You can restore to the same version, or to a later one on a supported path. A restore overwrites everything and reboots, and a backup taken in Common Criteria mode restores only to compliant appliances.

Recovering from the loss of the Grid Master means promoting the candidate. Confirm UDP 1194 and 2114 are open from the candidate to every member. On the candidate's console or SSH, run set promote master. Choose to notify members sequentially, which Infoblox says can minimize DNS outages; the default spacing is a hundred twenty seconds. Then log in to the new Grid Master and check every member has reconnected. Afterward, wait up to two hours before any further promotion, and update anything that points at the old Grid Master's address, including HSM registrations. Written down, those steps are the STIG's documented promotion procedure.

Sources: Infoblox NIOS Backing up and restoring configuration files; Restoring backups; Database snapshots; NIOS 9.1.x Promoting a Grid Master Candidate; DISA Infoblox NIOS 9.x STIG V1R1, V-285271 and V-285273 (mapping is inference).

## Slide 26 — Logging and evidence for the SIEM

Logging, and the evidence it produces.

Syslog: in the Grid's monitoring properties, log to external syslog servers over Secure TCP, on port 6514, with the server's certificate uploaded, and send it out the management interface.

The audit log: use the Detailed type, or WAPI Detailed, which also records API calls. And turn on Copy Audit Log Message to Syslog, which the STIG requires in addition to external syslog.

DNS queries and responses: Infoblox warns that turning on the queries and responses logging categories will significantly affect system performance. Use the capture feature or dnstap instead, and note dnstap drops data if its receiver is down.

DHCP lease history is archived and exportable, and it's the source the Federal Modernization Workbook's Book 08 Chapter 11 needs to tie an address to a device at a point in time.

The Data Connector forwards DNS data to a SIEM in CEF or LEEF format, but it's managed from the Infoblox Portal, so by my inference it isn't available on a FIPS-mode Grid. There, use Secure TCP syslog or dnstap.

And the SIEM is the system of record. OMB memorandum M-26-14 requires logs searchable for six months and retrievable for twelve, which NIOS's local retention can't meet.

Sources: Infoblox NIOS 9.1.x Logging to external syslog servers; Audit log types and rolling; DNS logging categories; Capturing DNS queries and responses; dnstap; Data Connector overview and registration; DISA Infoblox NIOS 9.x STIG V1R1, V-285237; earlier federal brief (OMB M-26-14); Book 08, Chapter 11.

## Slide 27 — Automation: what you can codify, and what you can't

Automation, and its limits.

Terraform's NIOS provider, version 2.1.0 from July 2026, needs NIOS 9.1.0 or later and WAPI version 2.14. That settles a question the earlier research left open: 9.1.0 is WAPI 2.14. The older 1.x provider works with 9.0.6 and WAPI 2.13.6. Version 2 identifies resources by UUID, and its resources cover Grid members, upgrade groups and schedules, zones, views, records, networks, DHCP ranges, failover, fixed addresses, managed Microsoft servers, admin groups and roles, SAML, and syslog endpoints.

There's also a new combined provider, version 3.0.0 beta from October 2026, for NIOS and Universal DDI together. It isn't backward compatible, so moving to it means re-importing state. My inference: build on the NIOS version 2 provider now, and plan a state re-import when version 3 is generally available.

Ansible's NIOS collection, version 1.10.0, needs WAPI 2.12.3 or later and Python 3.10. It covers zones, records, networks, ranges, members and more, but it has no module for failover associations or DNSSEC.

And some things stay manual. FIPS and Common Criteria mode, the factory reset, promoting the candidate, and temporary licenses are command-line only. HSM groups and DNSSEC signing have no Terraform or Ansible resource in those listings. Write those as runbooks that capture their evidence as they go.

Sources: GitHub infobloxopen/terraform-provider-nios README compatibility matrix and resource listing (v2.1.0); infobloxopen/terraform-provider-infoblox releases (v3.0.0-beta); infobloxopen/infoblox-ansible README and modules (v1.10.0); all accessed Oct. 23, 2026; research brief section 9.

## Slide 28 — The build mapped to Book 08's six phases

Here's the whole build mapped onto the Federal Modernization Workbook's Book 08's six phases. This is the program's design guidance: the order is a recommendation, and each step rests on the facts from earlier slides.

Phase 0, decide: FIPS mode, the long-term-support train, the DNSSEC defaults, and the HSM.

Phase 1, inventory and baseline: build a lab Grid first. Then production in order: the Grid Master pair with NTP set at the Grid level, the candidate with a promote test, permanent licenses, PIV and SAML sign-in with the banner and the management port, syslog, and scheduled SCP backups. Then physical managing members next to the domain controllers, with the Windows servers added read-only.

Phase 2, coexist: DNS and DHCP members on-premises, and vNIOS in each cloud hub, with high availability only where the region is documented. Recreate the forwarders, and load AES keytabs.

Phase 3, migrate authority: import each zone, validate, and flip delegation. Re-sign signed zones on NIOS and publish the new DS. For DHCP, scope by scope: lower lease times, take the scope over, create the failover association, confirm the DNS server option, and deactivate the Windows scope.

Phase 4, federate the clouds, with Universal DDI only on non-FIPS scopes.

Phase 5, decommission, behind Book 08's five gates, with the locator zones last. Disable sync, remove the managed servers, archive the exports, and de-authorize the old DHCP servers.

And Phase 6: the remaining STIG items, the approved long-term-support build through a test upgrade, and the evidence checklist in the backup slides.

Sources: Research brief section 10 (phase-by-phase build sequence, program design guidance); Book 08, Chapter 10 (six phases, Phase 5 gates, cutover loop); Infoblox NIOS and DISA STIG sources cited in Parts 1 to 3.

## Slide 29 — Decisions, vendor asks and next steps

To close: decisions, vendor asks, and next steps.

The decisions to take. FIPS mode, knowing it costs cloud management. A hardware security module, or a stealth Grid Master with a documented exception. NSEC or NSEC3 for internal zones. Whether the locator zones stay on AD DNS, which is the Federal Modernization Workbook's Book 08's default, or move to NIOS. And how many physical managing members you need, and where.

Ask Infoblox, in writing: which build is the current approved federal long-term-support release; when the FIPS 140-3 and Common Criteria certificates are expected; whether Kerberos-signed updates are supported with Windows Server 2025 domain controllers; whether vNIOS high availability works in GovCloud and Azure Government; whether clients keep their addresses in a DHCP takeover; and whether a SHA-2 NTP key type is coming.

Next steps. Stand up a lab Grid on Infoblox's evaluation images. Set the DNSSEC defaults, then sign a test zone and validate it. Pilot one DHCP scope takeover end to end. And run the STIG checklist against the lab.

The program's view is plain: Infoblox NIOS can carry Book 08's design, and its risks are known and manageable if the Phase 0 decisions come first. The backup slides list the assessor evidence, the risks, and what couldn't be verified. This is the program's research, under review, not an endorsement by any federal agency. Thank you.

Sources: Research brief sections 0 and 12, and Couldn't verify; Book 08, Chapters 04, 06, 10 and 11; Infoblox NIOS and DISA STIG sources cited in Parts 1 to 3.
