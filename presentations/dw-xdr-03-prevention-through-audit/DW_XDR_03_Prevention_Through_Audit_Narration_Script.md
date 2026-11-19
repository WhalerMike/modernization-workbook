# Building Defender XDR, Chapter 03 — Prevention Through Audit — narration script (practice copy)

## Slide 1 — Chapter 03: Prevention Through Audit

Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 3: prevention through audit. A setting in a policy protects nothing until the device enforces it, so the check is on the device, against the stage the ring is meant to be at. We'll start from Learn's three device commands and the guide's event query, read how the kit compares every device with its ring's plan, and walk two labs, the evidence and the dangers. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.

## Slide 2 — Why the check is on the device

Why check on the device? Because a value is only right or wrong against the stage its ring is at. Network protection reading two, audit, is exactly right on a ring still auditing, and drift on a ring that should be blocking. By the end of this chapter you can say, ring by ring, whether devices enforce the prevention settings at the stage the change record set, and list every device that doesn't. It's for the developers, the platform owner who owns this gate, and the security operations center, which reads the events every week. The setting values themselves live in the Devices book's policies; this chapter checks them.

## Slide 3 — What Learn's commands give you

Here's what Learn gives you. Get M P computer status shows tamper and real-time protection, true when on. Get M P preference shows network protection, zero off, one block, two audit; the two Windows Server settings; and controlled folder access, with its disk-only modes too. Get net firewall profile, from the active store, shows the firewall as enforced. And the guide's query counts the audit and block events and tampering attempts over seven days. Learn adds three conditions: network protection needs the antivirus in active mode, needs its own setting on Windows Server 2019 and later, and needs datagram processing off on domain controllers, DNS, file and SQL servers.

## Slide 4 — What running them by hand leaves to you

Run by hand, those commands leave a lot to you. Someone has to know what each ring should read, so the agency's prevention plan names each ring's stage. A bare two reads as fine on a ring that should block, so the kit prints expected and actual as number and name. A file server looks like any other, so the inventory's role column decides where the datagram check runs. Passive mode silently disables network protection, so the antivirus mode must be normal. The fleet query gives counts, so the drift list names devices. And a device nobody collected would look compliant, so it's listed. The verdict: Learn's commands collect; the kit compares.

## Slide 5 — The checks on each device

For each in-scope device, the kit runs these checks. Real-time and tamper protection on. The antivirus in normal, active mode. Network protection and controlled folder access at the ring's stage from the plan, block or audit. On servers, network protection allowed on the server; and on high-UDP roles, datagram processing off. And each firewall profile on, with inbound blocked. It runs the guide's event query too, and writes the device checks, the drift, the events and a summary. Moving a ring from audit to block is a change to the plan file, under the same change record that changes the Intune policy. The kit never changes a policy.

## Slide 6 — Who moves the rings, who reads the events

Who's involved? The platform owner owns this gate, moves each ring under a change record, and reviews the exclusions each quarter. The security operations center reviews blocks and tampering attempts every week, alongside the drift list. The operator collects a sample of device states per ring per site and works the drift tickets. One caution: the fixtures are eleven fictional devices. On a real fleet, sample per ring per site, as the guide's post-change validation says. The coverage check in Chapter 2 is the fleet-wide view.

## Slide 7 — Lab 1: the plan, then the check

Lab 1, in the kit's folder. Step 1 reads the plan the devices are checked against. Rings 0 and 1 are in block; rings 2, 3 and the servers are still auditing. Step 2 runs the prevention check, and finds three drifts. One device in ring 1 has tamper protection off. One in ring 2 has network protection off, though its ring should be auditing. And the file server has datagram processing on, which Learn says to turn off on high-UDP roles. Three inventory devices have no state file: the two never onboarded, and the excepted kiosk.

## Slide 8 — Lab 1: one server's checks, and the week's events

Step 3 reads every check on the file server. A server gets the two server checks the workstations don't: network protection allowed on the server, which passes, and datagram processing for its file role, which fails. Step 4 reads the week's events: network protection audited twelve times on four devices, three blocks, controlled folder access audited and blocked, and one tampering attempt. The security operations center reads that with the drift list. A device with tamper protection off and a tampering attempt in the same week is an incident, not a ticket.

## Slide 9 — Lab 2: one test device in a test tenant

Lab 2 uses a ring 0 test device in a test tenant, never production, with the policies assigned and network protection in audit. On the device, collect its state, elevated. On your workstation, sign in and run the prevention check live. Then test network protection the way Learn does: in a browser other than Edge, open Learn's test site. In audit mode the site opens and event 1125 is logged; in block mode it's blocked, with event 1126. Run the check again the next day, and the audited event appears in the events file. Nothing changed on the device.

## Slide 10 — Federal requirements and the evidence

Here's what the prevention check proves, against NIST's catalog. Antivirus and real-time protection on, in active mode, supports malicious code protection. The host firewall on with inbound blocked supports boundary protection. Network protection and controlled folder access at the ring's stage supports configuration settings. And tamper protection on, with tampering attempts counted, supports software and information integrity. The indicators are FedRAMP's, as the guide maps them. The records support these controls; the assessor decides them.

## Slide 11 — Dangers, and the guard for each

What breaks in production? A ring moved to block in Intune but not in the plan: every device reports drift, so change the plan with the same change record. Defender Antivirus in passive mode: network protection doesn't run; the antivirus mode check catches it. Datagram processing on a domain controller, the performance risk Learn documents for high-UDP roles. Tamper protection turned off locally, so settings drift silently. And a device with no state file, which looks compliant by absence; the kit lists it.

## Slide 12 — Done when: the chapter's checklist

Here's what done looks like. The prevention plan matches the Intune policy for each ring. Every ring has at least one sampled device state this week. Every drift row has a ticket, and a tamper drift with a tampering attempt goes to the security operations center. Network protection's test site was blocked on a ring in block. And the run folder is recorded as evidence. Next, Chapter 4 reads the same device states for the attack surface reduction rules, ring by ring. Thanks for watching.
