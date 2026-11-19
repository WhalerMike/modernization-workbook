// Building Defender XDR, Chapter 02 — Onboarding Coverage and Sensor Health: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/defender-xdr/02-onboarding-coverage-and-sensor-health.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-xdr-02-onboarding-coverage-sensor-health/build.js
require("../_build/devwb.js")({
  workbook: "xdr", chapter: 2, dir: __dirname,
  base: "DW_XDR_02_Onboarding_Coverage_Sensor_Health",
  title: "Onboarding Coverage and Sensor Health",
  map: "Why count against the inventory · what Learn gives · what a count leaves · the seven statuses · the device collector · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 2: onboarding coverage and sensor health. A policy assigned to a group says nothing about the devices that never checked in, so coverage is counted against the inventory, one device at a time. We'll start from the guide's coverage query and Learn's device checks, read how the kit joins each device to the inventory and the exception register, meet the device collector the next chapters use, and walk two labs. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's G2 Endpoint onboarding. You start with the guide's coverage query, which counts devices by onboarding status and sensor health, and what a count leaves to you. Then you read how the kit joins each device to the CM-8 inventory and the exception register, and the device-side collector the next chapters use. Lab 1 runs the coverage check on fixtures and reads the five tickets. Lab 2 runs it in a test tenant and collects one test device's state.`,
      cite: [],
      ref: "Opening; “In this chapter”",
    },
    {
      part: "Why", title: "Why coverage is a fraction of the inventory",
      body: [
        { lead: "A policy assigned to a group says nothing about devices that never checked in. The denominator is the inventory, not Defender's own list." },
        { cols: [[{ bullets: [
          "Produce the weekly coverage file the guide's evidence checklist asks for",
          "Raise a ticket for every device that isn't protected and isn't excepted",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14.5 }], [{ bullets: [
          "Developers who maintain the kit",
          "The operator who owns onboarding",
          "The ISSO who reconciles the CM-8 inventory",
        ], label: "Who it's for", color: "teal", pt: 14.5 }]] },
      ],
      sources: "Sources: Chapter 02, opening, “Goal and audience,” “The verdict.”",
      say: `Why count this way? A policy assigned to a group says nothing about the devices that never checked in. If you count against Defender's own list, a device that never onboarded is simply invisible. So the denominator is the inventory. By the end of this chapter you can produce the weekly coverage file the guide's evidence checklist asks for, with a ticket for every device that isn't protected and isn't excepted. It's for the developers who maintain the kit, the operator who owns onboarding, and the security officer who reconciles the system component inventory.`,
      detail: `Goal: by the end of this chapter you can produce the weekly coverage file the guide's evidence checklist asks for, with a ticket for every device that isn't protected and isn't excepted. Audience: developers who maintain the kit, the operator who owns onboarding, and the ISSO who reconciles the CM-8 inventory. You should have run Chapter 01's Lab 1.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "Why", title: "What the guide and Learn give you",
      body: [
        { cols: [[{ bullets: [
          "The Sense service: sc query sense",
          "OnboardingState = 1 in the Windows Advanced Threat Protection Status key",
        ], label: "On a device", color: "navy", pt: 14 }], [{ bullets: [
          "DeviceInfo, latest row per device, Windows only",
          "Counted by OnboardingStatus and SensorHealthState",
          "Run through Graph and filed",
        ], label: "Across the fleet", color: "teal", pt: 14 }]] },
        { callout: "Active; Inactive (no contact, typically 7 days or more); No sensor data; Impaired communications; Misconfigured.", label: "Sensor health states: ", icon: "FaChartLine", color: "amber" },
      ],
      sources: "Sources: Learn, Troubleshoot onboarding; DeviceInfo; Device inventory field reference. Chapter 02, “What the guide and Learn give you.”",
      say: `Here's what's already there. On a device, Learn names the sense service and the registry value onboarding state, equal to one. Across the fleet, the guide's query takes the latest DeviceInfo row per Windows device and counts them by onboarding status and sensor health state, run through Graph and filed. Learn's device inventory reference lists the sensor health states: active; inactive, which typically means no contact for seven days or more; no sensor data; impaired communications; and misconfigured. Intune's onboarding report shows the same from the Intune side.`,
      detail: `On a device, Learn names the Sense service (sc query sense) and the registry value OnboardingState = 1 under HKLM\\SOFTWARE\\Microsoft\\Windows Advanced Threat Protection\\Status. Across the fleet, the guide runs: DeviceInfo | where Timestamp > ago(1d) | summarize arg_max(Timestamp, *) by DeviceId | where OSPlatform startswith "Windows" | summarize Devices = count() by OnboardingStatus, SensorHealthState. Learn's DeviceInfo reference names OnboardingStatus and SensorHealthState; the device inventory reference lists the sensor health states. Intune's EDR onboarding status report shows the same from the Intune side (Devices, Chapter 10).`,
      cite: ["xdr02-onboarding", "xdr02-deviceinfo", "xdr02-inventory"],
      ref: "“Start with Microsoft Learn's commands” — “What the guide and Learn give you”",
    },
    {
      part: "What", title: "What a count leaves to you, and the verdict",
      body: [
        { table: { head: ["The query gives", "Why it isn't enough", "What the kit adds"], w: [3.0, 3.9, 5.25], rows: [
          ["A count by status and health", "A count can't name the device", "The same query, one row per device, kept beside the guide's summary"],
          ["Devices Defender knows", "A device that never onboarded may not appear", "Every inventory device classified, reported or not"],
          ["No exception handling", "An isolated lab device looks like a gap forever", "Valid exception: Excepted; lapsed: a ticket"],
          ["Defender's device names", "FQDN against short names", "Names compared without the DNS suffix and case"],
          ["Learn's state names", "The exact hunting strings aren't listed", "Only listed values count; any other is printed and flagged"],
        ] }, pt: 12 },
        { lead: "Verdict: run the guide's query and file it; join its per-device form to the inventory." },
      ],
      sources: "Sources: examples/defender-xdr tests/Checks.Tests.ps1 (Chapter 02). Chapter 02, “What it leaves to you,” “The verdict.”",
      say: `What does a count leave to you? It can't name the device that needs a ticket, so the kit runs the same query one row per device, and keeps the guide's summary beside it. Defender only lists devices it knows, so every inventory device is classified, whether Defender reports it or not. A lab device with no path to the service looks like a gap forever, so the exception register makes it excepted, and a lapsed exception a ticket. Names differ, so they're compared without the DNS suffix. And Learn doesn't list the exact strings advanced hunting returns, so only listed values count as healthy; anything else is printed and flagged.`,
      detail: `Each row is pinned by a test in tests/Checks.Tests.ps1, Chapter 02. A count by status and health: the per-device form of the same query (coverage-devices), kept beside the guide's summary in raw/. Devices Defender knows about: every device in the CM-8 inventory is classified. No exception handling: the exception register; a valid exception makes a device Excepted; a lapsed one is a ticket. Defender's device names: Defender reports the FQDN; names compare without the DNS suffix and case. Learn's state names: only the values in config/coverage.json count as onboarded and active; any other value is printed as it came back, and one the kit has never seen is flagged unrecognized. A device Defender sees but the inventory doesn't: NotInInventory, a ticket.`,
      cite: [],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "Seven statuses for every device",
      body: [
        { table: { head: ["Status", "Meaning", "Ticket"], w: [2.9, 7.6, 1.65], rows: [
          ["Protected", "Onboarded, sensor active", "No"],
          ["NotActive", "Onboarded, sensor in any other state", "Yes"],
          ["NotOnboarded", "Not onboarded, or not reported, with no exception", "Yes"],
          ["Excepted", "A valid exception: approver, expiry ahead", "No"],
          ["ExceptionExpired", "An exception whose expiry has passed", "Yes"],
          ["NotInInventory", "Reported by Defender, absent from the inventory", "Yes"],
          ["OutOfScope", "Marked out of scope in the inventory", "No"],
        ] }, pt: 13 },
        { callout: "coverage.csv, tickets.csv, by-ring.csv, summary.json with the protected-coverage share, raw/ and the manifest. A missing column fails the run.", label: "It writes: ", icon: "FaTableList", color: "teal" },
      ],
      sources: "Sources: examples/defender-xdr (Invoke-XdrCoverage.ps1, config/coverage.json). Chapter 02, “The coverage check.”",
      say: `The coverage check gives every in-scope device one of seven statuses. Protected: onboarded with an active sensor. Not active: onboarded, but the sensor is in any other state. Not onboarded: not onboarded, or not reported at all, with no exception. Excepted: a valid exception, with an approver and an expiry still ahead. Exception expired. Not in inventory: Defender reports it, the inventory doesn't. And out of scope. Four of those are tickets. The run writes the coverage file, the tickets, a by-ring summary, the protected-coverage share, which is the guide's first metric, and a manifest. A missing column fails the run rather than reading as empty.`,
      detail: `Invoke-XdrCoverage.ps1 (Invoke-XdrCoverageCheck) runs both queries through runHuntingQuery, reads the inventory and the exception register named in the settings, and classifies each in-scope device: Protected (onboarded, sensor active; no ticket), NotActive (onboarded, sensor in any other state; ticket), NotOnboarded (not onboarded, or not reported by Defender, with no exception; ticket), Excepted (a valid exception, approver and expiry ahead; no ticket), ExceptionExpired (ticket), NotInInventory (reported by Defender, absent from the inventory; ticket), OutOfScope (no ticket). It writes coverage.csv, tickets.csv, by-ring.csv, summary.json (with the protected-coverage share, the guide's first metric), raw/ and the manifest. A response missing a column the kit reads fails the run, rather than reading as empty.`,
      cite: [],
      ref: "“The code” — “The coverage check”",
    },
    {
      part: "What", title: "The device collector the next chapters read",
      body: [
        { lead: "Get-XdrDeviceState.ps1 runs on one Windows device, elevated, read-only, and writes <device>.json." },
        { steps: [
          { title: "The sensor", text: "Sense service status; OnboardingState and MsSenseDllVersion from the registry" },
          { title: "Get-MpComputerStatus", text: "Tamper and real-time protection, antivirus mode" },
          { title: "Get-MpPreference", text: "Network protection, controlled folder access, the ASR rules and their actions" },
          { title: "Get-NetFirewallProfile -PolicyStore ActiveStore", text: "The firewall profiles as enforced" },
        ], pt: 13.5 },
        { callout: "Arc servers missing the MDE.Windows extension are the Microsoft automation kit's arc-extensions task; this chapter links it.", label: "Servers: ", icon: "FaServer", color: "navy" },
      ],
      sources: "Sources: Learn, Troubleshoot onboarding. examples/defender-xdr (Get-XdrDeviceState.ps1); examples/ms-automation. Chapter 02, “The device state collector.”",
      say: `The chapter also ships a device collector. It runs on one Windows device, elevated, reads only, and writes one JSON file: the sense service and the onboarding state and sensor version from the registry; tamper and real-time protection and the antivirus mode; network protection, controlled folder access and the attack surface reduction rules; and the firewall profiles as enforced. Chapters 3, 4 and 7 compare these files with the plans. For servers under Azure Arc that lack the Defender extension, the Microsoft automation kit already has a task, so this chapter links it instead of rebuilding it.`,
      detail: `Get-XdrDeviceState.ps1 runs on one Windows device, elevated, and writes <device>.json: the Sense service status, OnboardingState and MsSenseDllVersion from the registry, Get-MpComputerStatus (tamper and real-time protection, antivirus mode), Get-MpPreference (network protection, controlled folder access, the ASR rules and their actions) and Get-NetFirewallProfile -PolicyStore ActiveStore. It reads only. Chapters 03, 04 and 07 compare these files with the plans; the fixtures hold eleven of them. Servers under Azure Arc that lack the MDE.Windows extension are found by the Microsoft automation kit's arc-extensions task (examples/ms-automation); this chapter doesn't rebuild that.`,
      cite: ["xdr02-onboarding"],
      ref: "“The device state collector”",
    },
    {
      part: "Who", title: "Who works the tickets, who keeps the file",
      body: [
        { cards: [
          { title: "Operator", text: "Owns onboarding; every device not Active for 7 days is a ticket, worked within the week", color: "navy" },
          { title: "ISSO", text: "Reconciles coverage against the CM-8 inventory; keeps the weekly file 12 months", color: "teal" },
          { title: "Platform owner", text: "Reviews the exception register quarterly", color: "amber" },
        ], pt: 13.5 },
        { callout: "check the state strings in config/coverage.json against the test tenant before the first live run.", label: "Illustrative code: ", icon: "FaFileShield", color: "red" },
      ],
      sources: "Sources: Chapter 02, “Goal and audience,” the “Illustrative code” callout; the guide, G2 day-two ownership.",
      say: `Who's involved? The operator owns onboarding: every device that isn't active for a week is a ticket, worked within the week. The security officer reconciles coverage against the system component inventory and keeps the weekly file for twelve months. And the platform owner reviews the exception register each quarter. One caution: the onboarding and sensor strings in the kit's configuration are the ones the portal shows. Check them against your test tenant's raw output before the first live run.`,
      detail: `Audience: developers who maintain the kit, the operator who owns onboarding, and the ISSO who reconciles the CM-8 inventory. Evidence owners: the operator weekly; the ISSO keeps 12 months; the platform owner reviews the exception register quarterly (the guide's G2 day-two ownership). Illustrative code: Lab 1 reads a fictional estate of fifteen inventory rows. The onboarding and sensor strings in config/coverage.json are the ones the portal shows; check them against your test tenant's raw/coverage-devices.json before the first live run.`,
      cite: [],
      ref: "“Goal and audience”; the “Illustrative code” callout",
    },
    {
      part: "How", title: "Lab 1: run the coverage check",
      body: [
        { terminal: "02-1", lines: "1-8,11-17,19" },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 02, “Lab 1: fixtures, no tenant,” step 1.",
      say: `Lab 1, in the kit's folder. Step 1 runs the coverage check. Nine of fourteen in-scope devices are protected: sixty-four point three percent. Ring 0 is whole. Five tickets: a sensor with impaired communications, an inactive sensor, a device Defender can see but that was never onboarded, a server whose exception expired at the end of October, and a device Defender reports that the inventory doesn't list at all. The kiosk in the isolated lab isn't a ticket: its exception runs into next year.`,
      detail: `You need PowerShell 7.1 or later with Pester 5. Work in examples/defender-xdr. Step 1: ./Invoke-XdrCoverage.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/coverage -AsOf 2026-11-16T12:00:00Z. Nine of fourteen in-scope devices are protected, 64.3 percent. Five tickets: WKS-R1-03 (ImpairedCommunication), WKS-R2-03 (Inactive), WKS-R3-02 (Can be onboarded), SRV-LEGACY01 (exception expired October 31) and WKS-OLD-07 (not in the inventory). LAB-KIOSK01 isn't a ticket: its exception runs to February 2027. All fictional.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” step 1",
    },
    {
      part: "How", title: "Lab 1: tickets, the guide's count, one device",
      body: [
        { cols: [[{ terminal: "02-2" }, { terminal: "02-3" }], [{ terminal: "02-4", lines: "1-2,9-21" }]], split: 0.6 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 02, “Lab 1: fixtures, no tenant,” steps 2–4.",
      say: `Step 2 reads the tickets as the operator gets them, each with its note: the expired exception names its reason and date. Step 3 reads the guide's own query for the same estate, as counts. It can't say which device is inactive, or that two in-scope devices aren't there at all. Step 4 reads one device's state, as the collector writes it. Look at tamper protection: false. Chapter 3 finds it. The last step runs the chapter's tests, and they all pass.`,
      detail: `Step 2: Import-Csv out/coverage/tickets.csv | Format-Table DeviceName, Ring, Status, Note -AutoSize -Wrap. Step 3: (Get-Content out/coverage/raw/coverage-summary.json | ConvertFrom-Json).results | Format-Table -AutoSize: the same estate as counts; it can't say which device is Inactive, or that two in-scope devices aren't there at all. Step 4: Get-Content tests/fixtures/devices/WKS-R1-02.json: IsTamperProtected is false; Chapter 03 finds it (the ASR rule list is left out of the slide). Step 5: Invoke-Pester -Path tests/Checks.Tests.ps1: expected FailedCount 0. Delete out when you're done.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 2–5",
    },
    {
      part: "How", title: "Lab 2: coverage live, and one test device",
      body: [
        { steps: [
          { title: "Sign in and run the coverage check live", text: "Connect-MgGraph -Environment Global with ThreatHunting.Read.All; ./Invoke-XdrCoverage.ps1 -SettingsPath <settings-file>" },
          { title: "Check the strings", text: "Compare OnboardingStatus and SensorHealthState in raw/coverage-devices.json with config/coverage.json; record any difference first" },
          { title: "Collect a test device's state", text: "Elevated, on the device: ./Get-XdrDeviceState.ps1 -OutputPath <output-folder>/devices; expect sense Running, onboarding state 1" },
          { title: "Back it out", text: "Nothing changed: Disconnect-MgGraph" },
        ], pt: 13.5 },
        { callout: "a test tenant, never production, with a Windows test device onboarded through Intune's EDR policy.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, Onboard Windows devices with Intune; runHuntingQuery. Chapter 02, “Lab 2: a test tenant.”",
      say: `Lab 2 uses a test tenant, never production, with at least one Windows test device onboarded through Intune's endpoint detection and response policy. Sign in with the hunting read scope and run the coverage check without the fixture path. Then open the raw device rows and compare the onboarding and sensor strings with the kit's configuration. A row flagged unrecognized means they differ; record it before changing anything. On the test device, run the collector elevated: it should show the sense service running and onboarding state one. Nothing changed, so you just sign out.`,
      detail: `Use a test tenant, never production, with at least one Windows test device onboarded through Intune's EDR policy (package type Auto from connector), as the guide's G2 describes. Placeholders: <tenant-id>, <settings-file> (with inputs.inventory and inputs.exceptions naming the test tenant's inventory and register) and <output-folder>. 1 Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ThreatHunting.Read.All; ./Invoke-XdrCoverage.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/coverage. Check the strings in raw/coverage-devices.json against config/coverage.json. 2 On the test device, elevated: ./Get-XdrDeviceState.ps1 -OutputPath <output-folder>/devices. 3 Disconnect-MgGraph. Not run by the authors.`,
      cite: ["xdr02-intune", "xdr02-hunting"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.8, 1.7, 2.0, 2.65], rows: [
          ["Every in-scope device is onboarded with an active sensor, excepted, or a ticket (coverage.csv, tickets.csv)", "CM-8", "PIY-GIV", "Operator weekly; ISSO 12 months"],
          ["The sensor is reporting, ring by ring (by-ring.csv, summary.json)", "SI-4", "MLA-OSM", "Platform owner"],
          ["A device Defender sees that the inventory doesn't list (NotInInventory)", "CM-8", "PIY-GIV", "ISSO, as a finding"],
        ] }, pt: 12.5 },
        { lead: "The pairs are the guide's G2 row. The kit's records support these controls; the assessor decides them." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5; FedRAMP, Key Security Indicators. Chapter 02, “Federal requirements and evidence.”",
      say: `Here's what the coverage check proves, against NIST's catalog. Every in-scope device onboarded with an active sensor, excepted, or a ticket, supports the system component inventory control. The sensor reporting, ring by ring, supports system monitoring. And a device that Defender sees but the inventory doesn't list is an inventory finding in its own right. The indicators are FedRAMP's, as the implementation guide maps them. The records support these controls; the assessor decides them.`,
      detail: `Every in-scope device in the inventory is onboarded with an active sensor, excepted, or a ticket (Lab 1, steps 1 and 2: coverage.csv, tickets.csv): CM-8; KSI-PIY-GIV; the operator weekly, the ISSO keeps 12 months. The sensor is reporting, ring by ring (by-ring.csv, summary.json): SI-4; KSI-MLA-OSM; the platform owner. A device Defender sees that the inventory doesn't list (NotInInventory): CM-8; KSI-PIY-GIV; the ISSO, as a finding. The pairs are the guide's G2 row. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them.`,
      cite: [],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.8, 4.0, 4.35], rows: [
          ["Coverage counted against Defender's own list", "Devices that never onboarded are invisible", "The inventory is the denominator"],
          ["An exception that never expires", "A gap becomes permanent", "ExceptionExpired is a ticket"],
          ["A state string the kit doesn't know", "A healthy device reads as unhealthy, or the reverse", "Only listed values count; unknown values flagged"],
          ["A query column renamed", "Every device reads as empty", "A missing column fails the run"],
          ["Server onboarding assumed from the client report", "Arc servers without the extension go unseen", "The Microsoft automation kit's arc-extensions task"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: examples/defender-xdr (Get-XdrCoverage, Invoke-XdrHunting); examples/ms-automation. Chapter 02, “Dangers.”",
      say: `What breaks in production? Counting against Defender's own list hides every device that never onboarded; the inventory is the denominator. An exception that never expires makes a gap permanent; an expired one is a ticket. A state string the kit doesn't know could make a healthy device look unhealthy, or the reverse; only listed values count, and unknown ones are flagged. A renamed column would make every device read as empty; a missing column fails the run. And servers aren't proven by the client report; the automation kit's Arc task finds servers without the extension.`,
      detail: `Coverage counted against Defender's own list: devices that never onboarded are invisible; guard: the inventory is the denominator. An exception that never expires: a gap becomes permanent; guard: ExceptionExpired is a ticket. A state string the kit doesn't know: a healthy device reads as unhealthy, or the reverse; guard: only listed values count as protected; unknown values are flagged. A query column renamed: the check reads every device as empty; guard: a missing column fails the run. Server onboarding assumed from the client report: Arc servers without the extension go unseen; guard: the Microsoft automation kit's arc-extensions task.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { cols: [[{ bullets: [
          "The inventory and the exception register are current and named in the settings",
          "The state strings in config/coverage.json match the test tenant",
        ], label: "The inputs", color: "navy", pt: 14 }], [{ bullets: [
          "Every ticket has an owner within the week",
          "The guide's summary query is filed beside the per-device result",
          "The run folder is recorded as evidence (Chapter 08)",
        ], label: "The run", color: "teal", pt: 14 }]] },
        { callout: "Chapter 03, Prevention Through Audit, reads the device state files this chapter's collector writes.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 02, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. The inventory and the exception register are current and named in the settings file. The state strings in the kit's configuration match the test tenant. Every ticket has an owner within the week. The guide's summary query is filed beside the per-device result. And the run folder is recorded as evidence. Next, Chapter 3 reads the device state files this chapter's collector writes, and checks prevention against each ring's stage. Thanks for watching.`,
      detail: `Checklist: The inventory and the exception register are current and named in the settings. The state strings in config/coverage.json match the test tenant. Every ticket in tickets.csv has an owner within the week. The guide's summary query is filed beside the per-device result. The run folder is recorded as evidence (Chapter 08). Next: Chapter 03 — Prevention Through Audit.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
