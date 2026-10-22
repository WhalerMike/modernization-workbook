# Who Names the Device After AD? — Explainer — narration script (practice copy)

## Slide 1 — Who Names the Device After AD?

When an agency retires Active Directory, two questions come up that nobody owned before, because AD answered them quietly. Who gives a device its name? And who puts that name into DNS, the system that turns names into network addresses, so other machines can find it?

This explainer walks through both. It's built for someone still learning, so every term is explained the first time it appears. We start with the two jobs AD did at once. Then who names each kind of device now. Then why devices can't register their own names securely without AD, what takes over, and where nothing does, such as IPv6 and remote clients. Then why names still matter, and a checklist of what the agency must do, before, during and after cutover.

This is research under review. Every fact comes from sources opened on October twenty-second, 2026. Where I drew a conclusion that no source states directly, I'll call it an inference. And recommendations are labeled program design guidance, not vendor requirements.

Sources: Research brief, After Active Directory: Who Names Devices, Who Registers Their DNS Records, and What an Agency Must Do (verified Oct. 22, 2026); Microsoft Learn, Apple, freedesktop.org, cloud-init, NetworkManager, FreeIPA, AWS and Infoblox NIOS 9.1 documentation; IETF RFCs; Book 05 Ch04; Book 08 Ch04, Ch07, Ch10.

## Slide 2 — Two jobs Active Directory did at once

In Active Directory, a Windows PC joined to the domain gets two jobs done almost for free.

Job one is the name. The PC has a computer name, say pc-zero-zero-four-two, and a primary DNS suffix, which is usually the name of the AD domain it joined. Put them together and you get its full name, its FQDN, or fully qualified domain name.

Job two is the DNS record. An A record maps a name to an IPv4 address; an AAAA record maps a name to an IPv6 address; and a PTR record goes the other way, address to name, in what's called a reverse zone. Dynamic update is the standard way to add or change those records over the network.

In AD, the domain's DNS zone lives in the directory, on domain controllers, and by default it accepts only secure dynamic updates. Secure means the update is signed with Kerberos, AD's ticket-based sign-in protocol, and once a name exists, only its owner can change it. The domain-joined PC has a machine account in AD, so it can sign. By default, the PC registers its own A record and the Windows DHCP server registers the PTR.

When AD retires, both jobs need a new owner, and the second one is harder.

Sources: Book 08, Chapter 04, What AD-integrated DNS actually is, and Secure dynamic updates and the DHCP server; Microsoft Learn, Dynamic update (Windows Server DNS) [S26]; Policy CSP ADMX_DnsClient [S27].

## Slide 3 — Who names the device now

So who names the device now? The short answer: whatever provisions it, at build time.

For Windows, that's usually Autopilot, which sets up a new PC out of the box. Classic Autopilot with Microsoft Entra join, which joins the PC to Microsoft's cloud directory instead of AD, has a name template: fifteen characters or fewer, with macros for the serial number or random digits. Hybrid join, which joins both AD and Entra, gets only a prefix, and the rest is random.

The newer Autopilot device preparation now has a name template too, up to sixty-three characters. The caveat matters: it works only for devices with device association, and has no effect on devices onboarded with corporate identifiers only. As an inference, Book 05's description of device preparation needs a review against this.

After enrollment, Intune's Rename action can rename corporate-owned Windows PCs and Macs, but not hybrid-joined devices, which need domain methods. Macs have no enrollment-time name template that I found; you rename after enrollment.

Linux takes its name from cloud-init or a static hostname. Azure Arc keeps the server's hostname as a fixed resource name. Cloud VMs get names at create time.

Sources: Microsoft Learn: Autopilot device preparation Entra join policy [S1], Compare device preparation and Autopilot [S2], Entra join Autopilot profile [S3], Hybrid join Domain Join profile [S4], Rename a device in Intune [S5], Accounts CSP [S6], macOS automated device enrollment [S7]; hostnamectl and hostname(5) [S10, S11]; cloud-init Set Hostname [S12]; azcmagent connect and Arc rename [S15, S16]; Azure ComputerName [S17]; EC2 hostname types [S21]; Book 05 Ch04, Naming.

## Slide 4 — Why devices can't register themselves securely

Here's the core problem. A PC joined only to Microsoft Entra ID still tries to register its name in DNS. What happens?

By default, Windows tries an unsigned update first, and only if that's refused does it try a secure one. A zone that is set to accept only secure updates refuses the unsigned attempt, as it should. Then the secure attempt: Microsoft documents that Windows dynamic update clients and DNS servers can use only Kerberos for secure update. As an inference, an Entra-joined PC has no machine account in the domain, so it can't sign, and the zone gets no record from that client at all.

The tempting fix is to let the zone accept unsigned updates. Don't. Microsoft says that without secure update, any computer on the network can modify the existing A record.

More facts. Over a VPN, Windows doesn't attempt dynamic update by default. Since the May 2020 Windows 10 update, it also skips servers named in an NRPT rule, the Name Resolution Policy Table, which sends certain names to certain DNS servers. And Microsoft's advice to let clients register their own records assumes domain-joined clients. As an inference, it can't apply here.

So something else has to register endpoints, and it has to sign.

Sources: Microsoft Learn: Dynamic update (Windows Server DNS) [S26]; Policy CSP ADMX_DnsClient [S27]; How to enable or disable DNS updates in Windows [S28]; Troubleshooting DNS dynamic update issues [S29]; DirectAccess known issues (DNS registration and NRPT) [S56].

## Slide 5 — DHCP registers the record on the device's behalf

What takes over is the DHCP server. DHCP is the service that hands a device its address for a set time, called a lease. It already talks to every device, so it can register names for them.

Here's the flow. The device asks for an address and sends its host name, in DHCP option twelve, or its full name in option eighty-one, the client FQDN option. For IPv6 the equivalent is DHCPv6 option thirty-nine. The DHCP server is set to always update DNS, and signs its updates with TSIG, a shared-key signature, or GSS-TSIG, which uses Kerberos. On Infoblox NIOS, a DDI platform, meaning DNS, DHCP and IP address management in one product, a server accepts no dynamic updates by default; a setting called Allow updates from lists who may. Make that the DHCP servers only.

Two safeguards. Beside each name, the server writes an ownership record, so only one client holds a name at a time. That's a TXT record in Infoblox's default Interim mode, or a DHCID record in Standard mode. And when the lease expires, the server removes the records it created.

On Windows DHCP, always updating both records makes the client skip its own attempt.

Sources: RFC 4701 DHCID, RFC 4702 DHCPv4 Client FQDN option, RFC 4703 FQDN conflict resolution, RFC 4704 DHCPv6 Client FQDN option [S31–S34]; Microsoft Learn Dynamic update [S26]; Infoblox NIOS 9.1: Understanding DDNS Updates from DHCP, About the Client FQDN Option, Sending Updates for Zones on an External Name Server, Configuring DNS Servers for DDNS, Configuring DDNS Features, Accepting DDNS Updates from DHCP Clients [S40–S44, S47]; Book 08 Ch04, Secure dynamic updates and the DHCP server.

## Slide 6 — The migration trap: who owns the existing names

Now the migration trap. Ownership records only help if the old and new systems agree on them.

Infoblox's default mode, Interim, checks ownership with TXT records. Its Standard mode uses DHCID records, the format the standards define. Infoblox documents three cases where TXT checking fails. First, migration from Microsoft-based systems: those records have no TXT, and, in Infoblox's words, new DDNS updates fail after the migration. Second, a mix of Microsoft and ISC DHCP servers. Third, mobility: a laptop's wired and Wi-Fi interfaces look like two different clients.

The second trap is on Macs. Apple's private Wi-Fi address feature gives a Mac a different hardware address, its MAC address, on each network. Fixed is the default on WPA2 or better networks; Rotating changes the address every two weeks. An MDM, mobile device management, profile can turn it off with a key called DisableAssociationMACRandomization, on macOS fifteen and later. As an inference, a rotating address changes the DHCP identity that ownership records rest on, the same mobility failure. I didn't verify the Android or Windows equivalents.

The program design guidance: pick Standard or Interim once, migrate deliberately, and turn off address randomization on agency Wi-Fi.

Sources: Infoblox NIOS 9.1: Enabling DDNS for IPv4 and IPv6 DHCP Clients (Interim vs Standard) [S45], Configuring DDNS Update Verification [S46]; Apple Support, Use private Wi-Fi addresses on Apple devices [S49]; apple/device-management com.apple.wifi.managed.yaml [S50]; research checklist steps 6 and 7 (program design guidance).

## Slide 7 — IPv6: addresses that nobody registers

There are two ways a device gets an IPv6 address. In the first, a DHCPv6 server assigns it. The server knows the address, so it can register an AAAA record using option thirty-nine. In the second, called SLAAC, stateless address autoconfiguration, the device builds its own address from what the router announces. Devices also create temporary, or privacy, addresses, typically used for outgoing connections.

The DHCPv6 name option covers only addresses DHCPv6 assigned. So, as an inference, no DHCPv6 server ever learns a SLAAC address, and no server-side registration creates an AAAA record for it. The device could register it itself, but as we saw, a post-AD Windows client can't do that securely.

The consequence, also an inference: for Entra-joined endpoints, treat AAAA records for SLAAC or privacy addresses as absent by design. Find endpoints by their DHCP-assigned addresses, and correlate IPv6 activity from DHCP and neighbor logs, not DNS.

Two cloud notes: in AWS, only the instance resource name returns AAAA records, and Azure's DNS Private Resolver doesn't support IPv6-enabled subnets. And I couldn't verify whether Windows registers its temporary addresses.

Sources: RFC 4862 IPv6 Stateless Address Autoconfiguration [S37]; RFC 8981 Temporary Address Extensions [S38]; RFC 4704 DHCPv6 Client FQDN option [S34]; Amazon EC2 instance hostname types [S21]; Book 08 Ch07 (Azure DNS Private Resolver platform constraints); research brief, Couldn't verify (Windows temporary IPv6 addresses).

## Slide 8 — Servers and the cloud register differently

Servers and cloud machines don't follow the endpoint pattern.

On premises, servers with fixed addresses get static records in the IPAM and DDI system. Static records aren't removed by scavenging, the cleanup job that deletes stale entries. As program design guidance, the build pipeline that creates a server should also create and delete its A and PTR records. Linux servers in an identity domain can register themselves with GSS-TSIG, but watch for one documented behavior: if signing fails at install, the client falls back to unauthenticated updates. For Azure Arc, set the resource name to match the DNS name at connect time, because it can't change later.

In Azure, private DNS autoregistration does the job, with limits: virtual machines only, the primary network interface only, A records only, no PTR records, and one autoregistration zone per virtual network. Records disappear when the VM is deleted or stopped, deleted records can't be restored, and unlinking the network deletes them.

In AWS, instances get AWS-made names. An AWS blog from 2016 says VPC DNS doesn't create records dynamically, and offers a sample event-driven pipeline. I found no built-in registration into your own Route 53 zones in AWS's docs.

Sources: Microsoft Learn: DNS aging and scavenging [S30], azcmagent connect [S15], Rename Azure Arc-enabled servers [S16], VirtualMachineOSProfile.ComputerName [S17], Azure DNS private zones autoregistration [S20]; FreeIPA ipa-client-install [S14]; AWS: EC2 instance hostname types [S21], Working with private hosted zones [S22], AWS Compute Blog, Building a Dynamic DNS for Route 53 (2016) [S23]; Book 08 Ch07 and Ch10.

## Slide 9 — Remote and VPN clients: resolved, not registered

What about people working remotely?

Take Microsoft's Global Secure Access, which includes Entra Private Access. You list your private DNS suffixes, and its client on the laptop turns them into NRPT rules. Matching queries go to a DNS proxy at Microsoft's edge, and a connector inside your network resolves them against on-premises DNS. The laptop gets back a synthetic IP address, a stand-in that routes through the tunnel.

Notice what's missing: that's all about the laptop finding names. I found no primary source saying Global Secure Access registers the laptop's own name or address in agency DNS. So, as an inference, remote clients are resolvers of names, not registrants. Windows also skips dynamic update over VPN by default. Third-party VPN products weren't researched.

That changes how the help desk finds a remote device. Intune's Remote Help starts from the Intune admin center: you pick the device from the device list, and no DNS lookup is needed. But you pick it by its Intune device name. As an inference, that name must be unique and meaningful. One subtlety: renaming in the admin center doesn't change the management name or the name in the Company Portal app.

Sources: Microsoft Learn: Understand Microsoft Entra Private DNS and Troubleshoot application access (Global Secure Access) [S51]; Dynamic update [S26]; DirectAccess known issues (NRPT) [S56]; Using Remote Help with Microsoft Intune [S52]; TeamViewer integration in Intune [S53]; Rename a device in Intune [S5].

## Slide 10 — Why device names still matter after AD

If devices sign in with cloud tokens, why do names still matter? Four reasons.

First, Kerberos islands. Microsoft says an Entra-joined device signing in to on-premises resources needs line-of-sight to domain controllers, which clients find through DNS service records. And Book 08 explains that if a name resolves to the wrong host, a perfectly valid ticket is presented to the wrong machine and rejected. 

Second, certificates. A certificate binds a name to a key. Intune's SCEP certificate profiles, the protocol Intune uses to request device certificates, offer a device-name variable, but the full domain name variable is only for Windows domain-joined devices. As an inference, after AD the certificate's DNS name has to be built from the device name plus a fixed agency suffix, and it only matches DNS if that same name is registered.

Third, logs. Book 12 joins every evidence record on an asset identity from the naming plane. Microsoft's own log model calls a hostname used as a device ID a last resort. As an inference, an unregistered or duplicated name breaks that join.

Fourth, duplicates: Microsoft says its naming macros don't guarantee unique names.

Sources: Microsoft Learn: How SSO to on-premises resources works on Microsoft Entra joined devices [S55]; Create and assign SCEP certificate profiles in Intune [S54]; Accounts CSP [S6]; Infoblox NIOS 9.1 About the Client FQDN Option [S41]; Book 08 Ch04 (What Kerberos needs from DNS); Book 12 Ch02 (evidence contract, ASIM); Book 15 Ch07 (CMDB reconcile); Book 07 Ch01.

## Slide 11 — Platform by platform: who names, who registers

Here's the whole picture. The full version, with notes, is in the backup.

For Windows devices joined to Entra, Autopilot or Intune names the device, and the DHCP server registers it, with signed updates. Hybrid-joined Windows, during the transition, keeps working as it does today, through AD; it moves to the first row when it's rebuilt.

Macs are renamed in Intune after enrollment. The DHCP server should register them, but that's an inference: I couldn't verify how macOS behaves with dynamic DNS.

Linux gets its name from cloud-init or a static hostname, and DHCP registers it, unless it's in an identity domain that signs its own updates.

On-premises servers with fixed addresses get static records. Azure VMs are named at create time and autoregistered, within the limits we saw. AWS instances get AWS names, and anything custom needs your own pipeline or IPAM integration. And printers and other devices that can't be managed get their names from a reservation or the device itself, with DHCP registering on their behalf.

Sources: Research brief, Per-platform table, and the sources cited in each row: Autopilot and Rename [S1, S3–S5], Accounts CSP [S6], macOS ADE and Apple MDM [S7, S9], systemd, cloud-init, NetworkManager, FreeIPA [S10–S14], Arc and Azure [S15–S17, S19, S20], AWS [S21–S23], Dynamic update and ADMX_DnsClient [S26, S27], aging [S30], NIOS [S41, S42, S48]; Book 08 Ch04 and Ch10.

## Slide 12 — What the agency must do: before, cutover, after

So what must the agency do? Everything on this slide is program design guidance, not a vendor or standards requirement, condensed from a seventeen-step checklist.

Before AD DNS retires: choose one naming authority for each platform and write down its length limit. For Windows, default to classic Autopilot with Entra join and the serial number, and use device preparation naming only once device association is in place. Inventory who registers each record today. Make the DHCP server the registrant, and lock each zone so only the DHCP servers' keys can update it. Pick DHCID or TXT ownership records once, turn off address randomization on agency Wi-Fi, and create reverse zones for every DHCP scope.

At cutover: deliver DNS suffixes both ways, through DHCP options and router announcements, and through Intune policy. For Entra-joined Windows, either turn client registration off or accept refused attempts, but never open zones to unsigned updates. Handle cloud names and servers separately.

After: turn on scavenging only after a quiet period, with lease times matched to its timers. Monitor duplicates, mismatched records and devices with no record. Expect no AAAA records for SLAAC addresses. And build certificate names from the registered device name.

Sources: Research brief, Agency checklist (steps 1–17, all PROGRAM DESIGN GUIDANCE) and the facts each step cites: [S1–S6, S10, S12, S14–S17, S19–S21, S23, S26, S27, S29, S30, S34–S39, S41, S43–S46, S48–S52, S54]; Book 08 Ch04 and Ch10; Book 12 Ch02; Book 15 Ch07; Book 07 Ch01.

## Slide 13 — Decisions, next steps and where this fits

The decisions: which tool names each kind of device, and how long names may be. The DHCP server as the registrant for endpoints, and exactly which keys may update each zone. DHCID or TXT ownership records. And whether Entra-joined Windows PCs try to register at all.

The next steps are the things I couldn't verify. Which Apple setting Intune's Mac rename actually sends, and how Macs handle DHCP names. Whether an Entra-joined device's display name follows an Intune rename. Book 05's description of device preparation, and its note on availability in the higher government clouds, both need a recheck. And ask any third-party VPN vendor whether its concentrator registers clients.

Where does this fit? Book 05, Chapter 04 covers Intune-first onboarding and the naming convention. Book 08 covers the AD DNS departure in Chapter 04, cloud private DNS in Chapter 07, and the migration sequence in Chapter 10. And two research items sit beside this one: Trinzic Alone, or Trinzic Plus Cloud DDI, and Infoblox DDI for Federal Agencies.

One note on standing: this is research under review, not an endorsement by any federal agency. Thank you.

Sources: Research brief, Couldn't verify and Agency checklist; Book 05 Ch04, Intune-First Onboarding; Book 08 Ch04, Ch07 and Ch10; research items Trinzic Alone, or Trinzic Plus Cloud DDI? and Infoblox DDI for Federal Agencies.
