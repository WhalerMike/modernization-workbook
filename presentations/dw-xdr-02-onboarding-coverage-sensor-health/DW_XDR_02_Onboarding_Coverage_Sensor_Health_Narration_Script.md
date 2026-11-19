# Building Defender XDR, Chapter 02 — Onboarding Coverage and Sensor Health — narration script (practice copy)

## Slide 1 — Chapter 02: Onboarding Coverage and Sensor Health

Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 2: onboarding coverage and sensor health. A policy assigned to a group says nothing about the devices that never checked in, so coverage is counted against the inventory, one device at a time. We'll start from the guide's coverage query and Learn's device checks, read how the kit joins each device to the inventory and the exception register, meet the device collector the next chapters use, and walk two labs. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.

## Slide 2 — Why coverage is a fraction of the inventory

Why count this way? A policy assigned to a group says nothing about the devices that never checked in. If you count against Defender's own list, a device that never onboarded is simply invisible. So the denominator is the inventory. By the end of this chapter you can produce the weekly coverage file the guide's evidence checklist asks for, with a ticket for every device that isn't protected and isn't excepted. It's for the developers who maintain the kit, the operator who owns onboarding, and the security officer who reconciles the system component inventory.

## Slide 3 — What the guide and Learn give you

Here's what's already there. On a device, Learn names the sense service and the registry value onboarding state, equal to one. Across the fleet, the guide's query takes the latest DeviceInfo row per Windows device and counts them by onboarding status and sensor health state, run through Graph and filed. Learn's device inventory reference lists the sensor health states: active; inactive, which typically means no contact for seven days or more; no sensor data; impaired communications; and misconfigured. Intune's onboarding report shows the same from the Intune side.

## Slide 4 — What a count leaves to you, and the verdict

What does a count leave to you? It can't name the device that needs a ticket, so the kit runs the same query one row per device, and keeps the guide's summary beside it. Defender only lists devices it knows, so every inventory device is classified, whether Defender reports it or not. A lab device with no path to the service looks like a gap forever, so the exception register makes it excepted, and a lapsed exception a ticket. Names differ, so they're compared without the DNS suffix. And Learn doesn't list the exact strings advanced hunting returns, so only listed values count as healthy; anything else is printed and flagged.

## Slide 5 — Seven statuses for every device

The coverage check gives every in-scope device one of seven statuses. Protected: onboarded with an active sensor. Not active: onboarded, but the sensor is in any other state. Not onboarded: not onboarded, or not reported at all, with no exception. Excepted: a valid exception, with an approver and an expiry still ahead. Exception expired. Not in inventory: Defender reports it, the inventory doesn't. And out of scope. Four of those are tickets. The run writes the coverage file, the tickets, a by-ring summary, the protected-coverage share, which is the guide's first metric, and a manifest. A missing column fails the run rather than reading as empty.

## Slide 6 — The device collector the next chapters read

The chapter also ships a device collector. It runs on one Windows device, elevated, reads only, and writes one JSON file: the sense service and the onboarding state and sensor version from the registry; tamper and real-time protection and the antivirus mode; network protection, controlled folder access and the attack surface reduction rules; and the firewall profiles as enforced. Chapters 3, 4 and 7 compare these files with the plans. For servers under Azure Arc that lack the Defender extension, the Microsoft automation kit already has a task, so this chapter links it instead of rebuilding it.

## Slide 7 — Who works the tickets, who keeps the file

Who's involved? The operator owns onboarding: every device that isn't active for a week is a ticket, worked within the week. The security officer reconciles coverage against the system component inventory and keeps the weekly file for twelve months. And the platform owner reviews the exception register each quarter. One caution: the onboarding and sensor strings in the kit's configuration are the ones the portal shows. Check them against your test tenant's raw output before the first live run.

## Slide 8 — Lab 1: run the coverage check

Lab 1, in the kit's folder. Step 1 runs the coverage check. Nine of fourteen in-scope devices are protected: sixty-four point three percent. Ring 0 is whole. Five tickets: a sensor with impaired communications, an inactive sensor, a device Defender can see but that was never onboarded, a server whose exception expired at the end of October, and a device Defender reports that the inventory doesn't list at all. The kiosk in the isolated lab isn't a ticket: its exception runs into next year.

## Slide 9 — Lab 1: tickets, the guide's count, one device

Step 2 reads the tickets as the operator gets them, each with its note: the expired exception names its reason and date. Step 3 reads the guide's own query for the same estate, as counts. It can't say which device is inactive, or that two in-scope devices aren't there at all. Step 4 reads one device's state, as the collector writes it. Look at tamper protection: false. Chapter 3 finds it. The last step runs the chapter's tests, and they all pass.

## Slide 10 — Lab 2: coverage live, and one test device

Lab 2 uses a test tenant, never production, with at least one Windows test device onboarded through Intune's endpoint detection and response policy. Sign in with the hunting read scope and run the coverage check without the fixture path. Then open the raw device rows and compare the onboarding and sensor strings with the kit's configuration. A row flagged unrecognized means they differ; record it before changing anything. On the test device, run the collector elevated: it should show the sense service running and onboarding state one. Nothing changed, so you just sign out.

## Slide 11 — Federal requirements and the evidence

Here's what the coverage check proves, against NIST's catalog. Every in-scope device onboarded with an active sensor, excepted, or a ticket, supports the system component inventory control. The sensor reporting, ring by ring, supports system monitoring. And a device that Defender sees but the inventory doesn't list is an inventory finding in its own right. The indicators are FedRAMP's, as the implementation guide maps them. The records support these controls; the assessor decides them.

## Slide 12 — Dangers, and the guard for each

What breaks in production? Counting against Defender's own list hides every device that never onboarded; the inventory is the denominator. An exception that never expires makes a gap permanent; an expired one is a ticket. A state string the kit doesn't know could make a healthy device look unhealthy, or the reverse; only listed values count, and unknown ones are flagged. A renamed column would make every device read as empty; a missing column fails the run. And servers aren't proven by the client report; the automation kit's Arc task finds servers without the extension.

## Slide 13 — Done when: the chapter's checklist

Here's what done looks like. The inventory and the exception register are current and named in the settings file. The state strings in the kit's configuration match the test tenant. Every ticket has an owner within the week. The guide's summary query is filed beside the per-device result. And the run folder is recorded as evidence. Next, Chapter 3 reads the device state files this chapter's collector writes, and checks prevention against each ring's stage. Thanks for watching.
