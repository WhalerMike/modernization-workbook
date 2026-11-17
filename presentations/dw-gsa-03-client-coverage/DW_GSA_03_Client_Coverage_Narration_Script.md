# Building Global Secure Access, Chapter 03 — The Client and Its Coverage — narration script (practice copy)

## Slide 1 — Chapter 03: The Client and Its Coverage

Welcome back to Building Global Secure Access. This is Chapter 3: the client and its coverage. Every later policy assumes the client is on the device, connected, current, and hard to turn off. This chapter measures that, device by device and across the fleet. The guide already holds Learn's Intune packaging and hardening, so we won't repeat them; we'll build the measurement. The chapter is a draft awaiting review, and the code is illustrative, tested against fixtures.

## Slide 2 — Why the client has to be measured

Why measure the client? Because the compliant network check, the tenant restrictions and every private app assume it's there. If the client is missing or off, users are blocked, or traffic quietly goes around the policy. So the goal: say what share of in-scope devices carry an active client; for each pilot device, say whether it runs a current client with IPv4 preferred, DNS over HTTPS off and a healthy connection; and from ring 2, show the hardening values, with evidence for each. It's for the developers, the endpoint engineer who owns the Intune app, and help desk leads.

## Slide 3 — What Microsoft Learn gives you

Learn's client page gives the prerequisites: a joined, hybrid joined or registered device, though registered devices carry only Private Access, in preview; an administrator to install; IPv4 only; and no secure DNS. It gives the Intune values, the DNS-over-HTTPS profile, four hardening registry values, and the advice to let users run unrestricted first. For the fleet, the beta device usage summary counts total, active and inactive devices, with Network Access Policy Read All. Clients 1.8.239 or later use Universal Continuous Access Evaluation. One difference: the summary's parameter table marks traffic type required, while its own example and the guide leave it out.

## Slide 4 — What it leaves to you

What does it leave to you? The Validate commands are typed on one device, with no record to compare across devices, so the kit's device script runs the same reads, read-only, and writes one record. A device count means nothing without the number that should be there, so coverage divides by Intune's in-scope count. Hardening in the pilot hides who needs to turn the client off, so it's information in the pilot and a check from ring 2. An old client quietly loses a protection, so there's a version check. And an exclusion without an owner never ends, so exclusions live in the exception register.

## Slide 5 — The seven client checks

Here are the seven checks. Coverage: active devices over in-scope devices, against the target, ninety-eight percent after ring 3 in the guide. Each device's client is at least the minimum version, here the one Universal access evaluation needs. IPv4 is preferred, the value Learn's install script sets. DNS over HTTPS is off in Edge and Chrome. Health is connected. The four hardening values are set, from ring 2. And each client exclusion has an owner, an approver and an expiry. One honest note: the browser policy value the script expects is Chromium's, not stated on the Learn page read, and the research gaps say so.

## Slide 6 — Who owns the client, and what they read

Who owns this? The endpoint engineer owns the Intune app, the DNS-over-HTTPS profile, and the hardening from ring 2. The help desk uses the client's collect logs and health check before escalating. The policy owner approves exclusions, and the security officer keeps the runs and the health check exports. The fleet read needs only Network Access Policy Read All, delegated. The device script runs as an administrator on a test device and only reads. And the in-scope count comes from Intune, with its date, in the settings file.

## Slide 7 — Lab 1: the fleet count and the four devices

Lab 1, in the kit's folder, no tenant. Step 1 lists one read, the device usage summary. Step 2 reads the pilot tenant's summary: eighteen devices, fifteen active, three inactive. Step 3 reads the four pilot devices' client records, as the device script wrote them. Pilot 3 runs an older client with DisabledComponents zero, so IPv6 is preferred; pilot 4 is disconnected; and only pilot 1 has the hardening values.

## Slide 8 — Lab 1: five failures, and ring 2's rule

Step 4 runs the client checks. Coverage is eighty-three percent against ninety-eight. Pilot 3 has an old client, IPv6 preferred, and DNS over HTTPS still on in Chrome. Pilot 4 is disconnected. The Hyper-V exclusion has an owner, an approver and an expiry. Hardening is only information in the pilot. Step 5 asks the same devices ring 2's question, where hardening is required: three devices fail, because only pilot 1 has the remediation.

## Slide 9 — Lab 1: the device script, and the tests

Step 6 reads the device script's header. It runs on a Windows device, not on the lab laptop, as an administrator, and only reads: the client's file version, the four hardening values, the IPv4 preference and the browsers' DNS-over-HTTPS policy. The health is read from the tray's health check by a person and passed in, because the script can't see it. Step 7 runs this chapter's tests: three passed, none failed. Then delete the output folder.

## Slide 10 — Lab 2: a test device and tenant

Lab 2 needs one Windows 11 test device, joined to Entra ID and enrolled in Intune, with the client installed from the guide's Intune app. On the device, open the health check, then run the device script as an administrator. Run the guide's own reads beside it as a cross-check. Add the record to your inputs, on agency storage. Then read the fleet's count and check. If the service reports no active devices while the client is connected, record it: it may be the traffic type parameter Learn's table marks required. Nothing changed, so backing out is signing out. The authors haven't run this lab.

## Slide 11 — Requirements, dangers, done

Coverage against Intune's count supports system monitoring and the component inventory. Each device's configuration supports configuration settings. Hardening from ring 2 supports least functionality, and governed exclusions support both. The indicators are FedRAMP's, mapped by the program, and the assessor decides the controls. The dangers: hardening in the pilot, which hides who needs to turn the client off; IPv6 preferred or DNS over HTTPS on, which lets traffic go around the client; and a raw count mistaken for coverage. You're done when the count comes from Intune with its date, every pilot device has a record, and coverage meets the target before the ring exits. Next, Chapter 4: Microsoft traffic, and change plans.
