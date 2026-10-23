# Who Names the Device After AD? — Explainer — narration script (practice copy)

## Slide 1 — Who Names the Device After AD?

Welcome. This is research from the Federal Modernization Workbook's Research section, and it's still under review. When an agency retires Active Directory, two questions come up that nobody owned before, because AD answered them quietly. Who gives a device its name? And who puts that name into DNS, so other machines can find it? We'll look at the two jobs AD did at once, who names each kind of device now, why devices can't register their own names securely without AD, what takes over, and where nothing does. Then a checklist. Every fact comes from sources opened on October twenty-second, 2026, and I'll flag inferences and program design guidance as we go. Let's start with what AD did.

## Slide 2 — Two jobs Active Directory did at once

In Active Directory, a domain-joined PC gets two jobs done almost for free. Job one is the name: a computer name plus the domain's suffix makes its full name. Job two is the DNS record, the entries that map that name to an address and back again. In AD, the zone lives on the domain controllers and by default accepts only secure updates, signed with Kerberos, and once a name exists only its owner can change it. The PC has a machine account, so it can sign. It registers its own forward record, and the Windows DHCP server registers the reverse one. When AD retires, both jobs need a new owner, and the second one is harder.

## Slide 3 — Who names the device now

So who names the device now? The short answer: whatever provisions it, at build time. For Windows that's usually Autopilot. Classic Autopilot with Entra join has a name template, fifteen characters or fewer, using the serial number or random digits. The newer device preparation has a template too, but only for devices with device association, so, as an inference, Book 05's description of it needs a review. After enrollment, Intune can rename corporate Windows PCs and Macs, though not hybrid-joined ones. Macs have no enrollment-time template that this research found. Linux, Azure Arc servers and cloud VMs take their names from their own build tools. Naming has an owner; registering is the hard part.

## Slide 4 — Why devices can't register themselves securely

Here's the core problem. A PC joined only to Entra ID still tries to register its name in DNS. A secure zone refuses its unsigned attempt, as it should. And Microsoft documents that Windows can use only Kerberos for secure update. So, as an inference, with no machine account in the domain, the PC can't sign, and the zone gets no record from it at all. The tempting fix is to let the zone accept unsigned updates. Don't. Microsoft says that without secure update, any computer on the network can modify an existing record. Remote clients over VPN don't even try by default. So something else has to register endpoints, and it has to sign.

## Slide 5 — DHCP registers the record on the device's behalf

What takes over is the DHCP server. It hands every device its address for a set time, called a lease, so it already talks to every device and can register names for them. The device sends its name when it asks for an address, and the DHCP server, set to always update DNS, signs the update with a shared key or with Kerberos. On Infoblox, lock each zone so only the DHCP servers may update it. Two safeguards help: the server writes an ownership record beside each name, so only one client holds a name at a time, and it removes the records it created when the lease expires. But ownership records hide a migration trap.

## Slide 6 — The migration trap: who owns the existing names

Ownership records only help if the old and new systems agree on them. Infoblox has two modes, Interim and Standard, and documents that checking fails in three cases. The big one is migration from Microsoft systems, where, in Infoblox's words, new DDNS updates fail after the migration. The others are mixed DHCP vendors and laptops whose wired and Wi-Fi interfaces look like two clients. Macs add a twist: private Wi-Fi addresses can rotate, and, as an inference, that changes the identity the ownership record rests on. An MDM profile can turn it off on macOS fifteen and later. The design guidance: pick one mode once, migrate deliberately, and turn off address randomization on agency Wi-Fi. Next, IPv6.

## Slide 7 — IPv6: addresses that nobody registers

IPv6 adds addresses that nobody registers. If a DHCPv6 server assigns the address, it knows it and can register the record. But with SLAAC, the device builds its own address from what the router announces, and creates temporary privacy addresses too. As an inference, no server ever learns those addresses, so no server-side registration creates a record for them, and a post-AD Windows client can't register them securely itself. The consequence, also an inference: treat those records as absent by design. Find endpoints by their DHCP-assigned addresses, and track IPv6 activity from DHCP and neighbor logs, not DNS. Whether Windows registers temporary addresses couldn't be verified. Servers work differently.

## Slide 8 — Servers and the cloud register differently

Servers and cloud machines don't follow the endpoint pattern. On premises, servers with fixed addresses get static records in the IPAM and DDI system, and, as program design guidance, the pipeline that builds a server should create and delete its records. Linux servers in an identity domain can sign their own updates, but watch for a fallback to unauthenticated updates if signing fails at install. In Azure, private DNS autoregistration does the job, with real limits: VMs only, forward records only, and records that disappear when the VM is stopped or the network is unlinked. In AWS, this research found no built-in registration into your own zones, so you build a pipeline. Now, remote workers.

## Slide 9 — Remote and VPN clients: resolved, not registered

Remote clients are a different story: they find names, but they don't register them. With Microsoft's Global Secure Access, the laptop's client sends matching queries through Microsoft's edge to a connector inside your network, and gets back a stand-in address that routes through the tunnel. But no primary source found says it registers the laptop's own name in agency DNS. So, as an inference, remote clients are resolvers of names, not registrants. That changes how the help desk finds a remote device. Intune's Remote Help starts from the device list, with no DNS lookup, but you pick by the Intune device name. As an inference, that name must be unique and meaningful.

## Slide 10 — Why device names still matter after AD

If devices sign in with cloud tokens, why do names still matter? Four reasons. First, Kerberos islands: an Entra-joined device reaching on-premises resources still finds domain controllers through DNS, and Book 08 explains that a name pointing at the wrong host gets a valid ticket rejected. Second, certificates bind a name to a key, so, as an inference, after AD the certificate's name has to be built from the device name plus a fixed agency suffix, and it only matches DNS if that name is registered. Third, logs: Book 12 joins evidence on the device's identity, so a missing or duplicated name breaks that join. Fourth, Microsoft says its naming macros don't guarantee unique names.

## Slide 11 — Platform by platform: who names, who registers

Here's the whole picture on one page, with the full version in the backup. Entra-joined Windows is named by Autopilot or Intune and registered by the DHCP server with signed updates. Hybrid-joined Windows keeps working through AD until it's rebuilt. Macs are renamed in Intune, and DHCP should register them, though that's an inference. Linux is registered by DHCP unless it signs its own updates. On-premises servers get static records, Azure VMs are autoregistered within limits, and AWS needs your own pipeline. And printers and other unmanaged devices get names from a reservation or the device itself, with DHCP registering for them. Now, what the agency must do.

## Slide 12 — What the agency must do: before, cutover, after

Here's what the agency must do, condensed from a seventeen-step checklist, and all of it is program design guidance. Before AD DNS retires, choose one naming authority per platform, make the DHCP server the registrant, and lock each zone so only the DHCP servers' keys can update it. Pick one ownership-record format, turn off address randomization on agency Wi-Fi, and create reverse zones. At cutover, deliver DNS suffixes through DHCP and Intune, and for Entra-joined Windows, either turn client registration off or accept refused attempts, but never open zones to unsigned updates. Afterward, turn on cleanup only after a quiet period, and monitor duplicates and devices with no record.

## Slide 13 — Decisions, next steps and where this fits

To close. The decisions are which tool names each kind of device, the DHCP server as registrant and which keys may update each zone, which ownership-record format, and whether Entra-joined PCs try to register at all. The next steps are the things that couldn't be verified, such as how Macs handle rename and DHCP names, and a recheck of Book 05's device preparation description. Ask any third-party VPN vendor whether its concentrator registers clients. In the workbook, Book 05 covers onboarding and naming, Book 08 covers the AD DNS departure, and two related research items sit beside this one. This is research under review, not an endorsement by any federal agency. Thank you.
