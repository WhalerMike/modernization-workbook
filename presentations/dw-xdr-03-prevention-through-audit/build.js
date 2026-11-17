// Building Defender XDR, Chapter 03 — Prevention Through Audit: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/defender-xdr/03-prevention-through-audit.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-xdr-03-prevention-through-audit/build.js
require("../_build/devwb.js")({
  workbook: "xdr", chapter: 3, dir: __dirname,
  base: "DW_XDR_03_Prevention_Through_Audit",
  title: "Prevention Through Audit",
  map: "Why check on the device · Learn's three commands · what they leave · the checks · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 3: prevention through audit. A setting in a policy protects nothing until the device enforces it, so the check is on the device, against the stage the ring is meant to be at. We'll start from Learn's three device commands and the guide's event query, read how the kit compares every device with its ring's plan, and walk two labs, the evidence and the dangers. The chapter is a draft awaiting review; the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's G3 Endpoint prevention. You start with the guide's three device commands and its event query, and what running them by hand leaves to you. Then you read how the kit compares every device's state with its ring's stage. Lab 1 runs the check on eleven fictional devices and finds three drifts. Lab 2 runs it on one test device.`,
      cite: [],
      ref: "Opening; “In this chapter”",
    },
    {
      part: "Why", title: "Why the check is on the device",
      body: [
        { lead: "A value is only right or wrong against the stage its ring is at: 2 (audit) is correct on ring 2 and drift on ring 1." },
        { cols: [[{ bullets: [
          "Say, for each ring, whether its devices enforce the prevention settings at the stage the change record set",
          "List every device that doesn't",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14.5 }], [{ bullets: [
          "Developers who maintain the kit",
          "The platform owner who owns G3",
          "The SOC, which reads the events weekly",
        ], label: "Who it's for", color: "teal", pt: 14.5 }]] },
        { callout: "the setting values live in the Devices book's policies ES-001 and ES-003; this chapter checks them, it doesn't repeat them.", label: "Values: ", icon: "FaBook", color: "amber" },
      ],
      sources: "Sources: Chapter 03, opening, “Goal and audience.” Devices, Chapter 08, ES-001 and ES-003.",
      say: `Why check on the device? Because a value is only right or wrong against the stage its ring is at. Network protection reading two, audit, is exactly right on a ring still auditing, and drift on a ring that should be blocking. By the end of this chapter you can say, ring by ring, whether devices enforce the prevention settings at the stage the change record set, and list every device that doesn't. It's for the developers, the platform owner who owns this gate, and the security operations center, which reads the events every week. The setting values themselves live in the Devices book's policies; this chapter checks them.`,
      detail: `Goal: by the end of this chapter you can say, for each ring, whether its devices enforce the prevention settings at the stage the change record set, and list every device that doesn't. Audience: developers who maintain the kit, the platform owner who owns G3, and the SOC, which reads the audit and block events weekly. You should have run Chapter 02's Lab 1. The setting values live in Book 05's policies ES-001 and ES-003 (Devices, Chapter 08); this chapter checks them, it doesn't repeat them.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "Why", title: "What Learn's commands give you",
      body: [
        { table: { head: ["Command", "What it shows"], w: [4.6, 7.55], rows: [
          ["Get-MpComputerStatus", "Tamper and real-time protection, True when on"],
          ["Get-MpPreference", "Network protection 0 off, 1 block, 2 audit; the two Windows Server settings; controlled folder access 0 off, 1 block, 2 audit, 3 and 4 disk-only"],
          ["Get-NetFirewallProfile -PolicyStore ActiveStore", "The firewall as enforced"],
          ["The guide's event query", "Network protection and controlled folder access audited and blocked, and tampering attempts, in DeviceEvents over 7 days"],
        ] }, pt: 12.5 },
        { callout: "network protection needs active mode; on Windows Server 2019 and later, AllowNetworkProtectionOnWinServer; on domain controllers, DNS, file and SQL Server, AllowDatagramProcessingOnWinServer false.", label: "Learn also says: ", icon: "FaServer", color: "teal" },
      ],
      sources: "Sources: Learn, Configure tamper protection; Configure network protection; Evaluate network protection; Configure CFA; Get-NetFirewallProfile. Chapter 03.",
      say: `Here's what Learn gives you. Get M P computer status shows tamper and real-time protection, true when on. Get M P preference shows network protection, zero off, one block, two audit; the two Windows Server settings; and controlled folder access, with its disk-only modes too. Get net firewall profile, from the active store, shows the firewall as enforced. And the guide's query counts the audit and block events and tampering attempts over seven days. Learn adds three conditions: network protection needs the antivirus in active mode, needs its own setting on Windows Server 2019 and later, and needs datagram processing off on domain controllers, DNS, file and SQL servers.`,
      detail: `The guide's Validate step runs three commands on a device: Get-MpComputerStatus for tamper and real-time protection (True when on), Get-MpPreference for network protection (0 off, 1 block, 2 audit), the two Windows Server settings and controlled folder access (0 off, 1 block, 2 audit, 3 and 4 the disk-only modes), and Get-NetFirewallProfile -PolicyStore ActiveStore for the firewall as enforced. Learn says network protection needs Defender Antivirus in active mode, needs AllowNetworkProtectionOnWinServer on Windows Server 2019 and later, and needs AllowDatagramProcessingOnWinServer false on high-UDP roles: domain controllers, DNS, file and SQL Server. Across the fleet, the guide's query counts ExploitGuardNetworkProtectionAudited and Blocked, ControlledFolderAccessViolationAudited and Blocked, and TamperingAttempt in DeviceEvents over 7 days.`,
      cite: ["xdr03-tamper", "xdr03-np", "xdr03-np-eval", "xdr03-cfa", "xdr03-fw", "xdr03-np-hunt", "xdr03-cfa-mon"],
      ref: "“Start with Microsoft Learn's commands” — “What the guide and Learn give you”",
    },
    {
      part: "What", title: "What running them by hand leaves to you",
      body: [
        { table: { head: ["Learn's commands give", "Why it isn't enough", "What the kit adds"], w: [3.0, 4.0, 5.15], rows: [
          ["Values one device at a time", "Someone has to know what each ring should read", "The prevention plan names each ring's stage"],
          ["A number for each mode", "2 reads as fine on a ring that should block", "Expected and actual as number and name: 2 (audit)"],
          ["Server settings in prose", "A file server looks like any other", "The inventory's Role: the datagram check on dc, dns, file, sql"],
          ["The antivirus mode", "Passive mode silently disables network protection", "AntivirusMode must be Normal"],
          ["A fleet query", "Counts, not devices", "Filed and summarized; drift names the devices"],
          ["—", "A device nobody collected looks compliant", "Inventory devices with no state file are listed"],
        ] }, pt: 11.5 },
        { lead: "Verdict: keep Learn's commands as the collector; compare their output with the plan in code." },
      ],
      sources: "Sources: examples/defender-xdr tests/Checks.Tests.ps1 (Chapter 03). Chapter 03, “What it leaves to you,” “The verdict.”",
      say: `Run by hand, those commands leave a lot to you. Someone has to know what each ring should read, so the agency's prevention plan names each ring's stage. A bare two reads as fine on a ring that should block, so the kit prints expected and actual as number and name. A file server looks like any other, so the inventory's role column decides where the datagram check runs. Passive mode silently disables network protection, so the antivirus mode must be normal. The fleet query gives counts, so the drift list names devices. And a device nobody collected would look compliant, so it's listed. The verdict: Learn's commands collect; the kit compares.`,
      detail: `Each row is pinned by a test in tests/Checks.Tests.ps1, Chapter 03. Values on one device at a time: the agency's prevention plan names each ring's stage; each device is compared with its own ring's. A number for each mode: each check prints expected and actual as number and name, 2 (audit). Server settings in prose: the inventory's Role column; the datagram check runs on dc, dns, file and sql servers only. The antivirus mode in a column: AntivirusMode must be Normal. A fleet query: the query is filed and summarized; the drift list names the devices. A device nobody collected looks compliant: inventory devices with no state file are listed. The verdict: keep Learn's commands as the collector (Chapter 02). Compare their output with the plan in code.`,
      cite: [],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "The checks on each device",
      body: [
        { table: { head: ["Check", "Expected"], w: [5.0, 7.15], rows: [
          ["RealTimeProtection, TamperProtection", "True"],
          ["AntivirusMode", "Normal (active mode)"],
          ["NetworkProtection, ControlledFolderAccess", "The ring's stage from the plan: 1 (block) or 2 (audit)"],
          ["NetworkProtectionOnServer", "1, on servers"],
          ["DatagramProcessing (<role> role)", "0, on servers whose role is high-UDP"],
          ["Firewall <profile>", "True/Block for each profile"],
        ] }, pt: 13 },
        { callout: "rings move from audit to block by changing the plan file, under the change record that changes the Intune policy. The kit reads the plan; it never changes a policy.", label: "Moving a ring: ", icon: "FaRightLeft", color: "amber" },
      ],
      sources: "Sources: examples/defender-xdr (Invoke-XdrPrevention.ps1, Get-XdrPreventionFinding, config/prevention.json). Chapter 03, “The code.”",
      say: `For each in-scope device, the kit runs these checks. Real-time and tamper protection on. The antivirus in normal, active mode. Network protection and controlled folder access at the ring's stage from the plan, block or audit. On servers, network protection allowed on the server; and on high-UDP roles, datagram processing off. And each firewall profile on, with inbound blocked. It runs the guide's event query too, and writes the device checks, the drift, the events and a summary. Moving a ring from audit to block is a change to the plan file, under the same change record that changes the Intune policy. The kit never changes a policy.`,
      detail: `Invoke-XdrPrevention.ps1 (Invoke-XdrPreventionCheck) reads the device-state folder, the inventory and the prevention plan named in the settings, then runs Get-XdrPreventionFinding for each in-scope device: RealTimeProtection and TamperProtection True; AntivirusMode Normal (active mode); NetworkProtection and ControlledFolderAccess at the ring's stage from the plan, 1 (block) or 2 (audit); NetworkProtectionOnServer 1 on servers; DatagramProcessing (<role> role) 0 on servers whose role is high-UDP; Firewall <profile> True/Block for each profile. It runs the guide's event query and writes device-checks.csv, drift.csv, events.csv, summary.json, raw/ and the manifest. Rings move from audit to block by changing the plan file, under the change record that changes the Intune policy; the kit reads the plan, it never changes a policy.`,
      cite: [],
      ref: "“The code”",
    },
    {
      part: "Who", title: "Who moves the rings, who reads the events",
      body: [
        { cards: [
          { title: "Platform owner", text: "Owns G3: moves each ring under a change record; quarterly exclusion review", color: "navy" },
          { title: "SOC", text: "Reviews blocks and tampering attempts weekly, with the drift list", color: "teal" },
          { title: "Operator", text: "Collects a sample per ring per site; works the drift tickets", color: "amber" },
        ], pt: 13.5 },
        { callout: "on a real fleet, collect a sample per ring per site, not every device every week; the coverage check is the fleet-wide view.", label: "Illustrative code: ", icon: "FaFileShield", color: "red" },
      ],
      sources: "Sources: Chapter 03, “Goal and audience,” the “Illustrative code” callout; the guide, G3 day-two ownership.",
      say: `Who's involved? The platform owner owns this gate, moves each ring under a change record, and reviews the exclusions each quarter. The security operations center reviews blocks and tampering attempts every week, alongside the drift list. The operator collects a sample of device states per ring per site and works the drift tickets. One caution: the fixtures are eleven fictional devices. On a real fleet, sample per ring per site, as the guide's post-change validation says. The coverage check in Chapter 2 is the fleet-wide view.`,
      detail: `Audience: developers who maintain the kit, the platform owner who owns G3, and the SOC, which reads the audit and block events weekly. Day-two (the guide's G3): platform owner; weekly review of blocks and tampering attempts by the SOC; quarterly exclusion review. Illustrative code: the fixtures are eleven fictional device-state files. On a real fleet, collect a sample per ring per site (the guide's post-change validation), not every device every week; the coverage check (Chapter 02) is the fleet-wide view.`,
      cite: [],
      ref: "“Goal and audience”; the “Illustrative code” callout",
    },
    {
      part: "How", title: "Lab 1: the plan, then the check",
      body: [
        { cols: [[{ terminal: "03-1", lines: "1,4-12,21-25", pt: 10.5 }], [{ terminal: "03-2", lines: "1-5,15", pt: 10.5 }]], split: 0.36 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 03, “Lab 1: fixtures, no tenant,” steps 1–2.",
      say: `Lab 1, in the kit's folder. Step 1 reads the plan the devices are checked against. Rings 0 and 1 are in block; rings 2, 3 and the servers are still auditing. Step 2 runs the prevention check, and finds three drifts. One device in ring 1 has tamper protection off. One in ring 2 has network protection off, though its ring should be auditing. And the file server has datagram processing on, which Learn says to turn off on high-UDP roles. Three inventory devices have no state file: the two never onboarded, and the excepted kiosk.`,
      detail: `Work in examples/defender-xdr. Step 1: Get-Content tests/fixtures/inputs/prevention-plan.json; rings 0 and 1 are in block; rings 2, 3 and the servers are still in audit (rings 2 and 3 left out of the slide). Step 2: ./Invoke-XdrPrevention.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/prevention -AsOf 2026-11-16T12:00:00Z. Three drifts: WKS-R1-02 TamperProtection True expected, False actual; WKS-R2-01 NetworkProtection 2 (audit) expected, 0 (off) actual; SRV-FILE01 DatagramProcessing (file role) 0 expected, 1 actual. Three inventory devices have no state file: the two never onboarded and the excepted kiosk. 11 devices, 91 checks.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: one server's checks, and the week's events",
      body: [
        { cols: [[{ terminal: "03-3", pt: 10.5 }], [{ terminal: "03-4", pt: 10.5 }]], split: 0.55 },
        { callout: "a device with tamper protection off and a tampering attempt in the same week is an incident, not a ticket.", label: "Read it: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 03, “Lab 1: fixtures, no tenant,” steps 3–4.",
      say: `Step 3 reads every check on the file server. A server gets the two server checks the workstations don't: network protection allowed on the server, which passes, and datagram processing for its file role, which fails. Step 4 reads the week's events: network protection audited twelve times on four devices, three blocks, controlled folder access audited and blocked, and one tampering attempt. The security operations center reads that with the drift list. A device with tamper protection off and a tampering attempt in the same week is an incident, not a ticket.`,
      detail: `Step 3: Import-Csv out/prevention/device-checks.csv | Where-Object DeviceName -EQ 'SRV-FILE01' | Format-Table Check, Expected, Actual, Status -AutoSize. A server gets the two server checks the workstations don't. Step 4: Import-Csv out/prevention/events.csv | Format-Table -AutoSize: ExploitGuardNetworkProtectionAudited 12 events on 4 devices; Blocked 3 on 2; ControlledFolderAccessViolationAudited 7 on 3; Blocked 1 on 1; TamperingAttempt 1 on 1. The SOC reviews it with the drift list: a device with tamper protection off and a tampering attempt in the same week is an incident, not a ticket. Expected result: 91 checks on 11 devices, 3 drifts. Delete out when you're done.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 3–4",
    },
    {
      part: "How", title: "Lab 2: one test device in a test tenant",
      body: [
        { steps: [
          { title: "On the test device, collect its state", text: "Elevated: ./Get-XdrDeviceState.ps1 -OutputPath <output-folder>/devices" },
          { title: "Run the prevention check live", text: "Connect-MgGraph -Environment Global with ThreatHunting.Read.All; ./Invoke-XdrPrevention.ps1 -SettingsPath <settings-file>" },
          { title: "Test network protection Learn's way", text: "In a browser other than Edge, open smartscreentestratings2.net: audit logs event 1125; block blocks it and logs 1126" },
          { title: "Back it out", text: "Nothing changed on the device; delete the state file if it leaves ring 0" },
        ], pt: 13.5 },
        { callout: "a ring 0 test device in a test tenant, never production, with the policies assigned and network protection in audit.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, Evaluate network protection. Chapter 03, “Lab 2: a test device in a test tenant.”",
      say: `Lab 2 uses a ring 0 test device in a test tenant, never production, with the policies assigned and network protection in audit. On the device, collect its state, elevated. On your workstation, sign in and run the prevention check live. Then test network protection the way Learn does: in a browser other than Edge, open Learn's test site. In audit mode the site opens and event 1125 is logged; in block mode it's blocked, with event 1126. Run the check again the next day, and the audited event appears in the events file. Nothing changed on the device.`,
      detail: `Use a ring 0 test device in a test tenant, never production, with the antivirus and Attack Surface Reduction policies assigned as the guide's G3 describes, and network protection in audit. Placeholders: <tenant-id>, <settings-file> (with inputs.deviceStates naming <output-folder>/devices and inputs.prevention naming your plan), and <output-folder>. 1 On the test device, elevated: ./Get-XdrDeviceState.ps1 -OutputPath <output-folder>/devices. 2 Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ThreatHunting.Read.All; ./Invoke-XdrPrevention.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/prevention. 3 In a browser other than Edge, open https://smartscreentestratings2.net: audit logs 1125, block logs 1126. 4 Remove-Item <output-folder>/devices/*.json if the device leaves ring 0. Not run by the authors.`,
      cite: ["xdr03-np-eval"],
      ref: "“Lab 2: a test device in a test tenant”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.8, 1.7, 2.0, 2.65], rows: [
          ["Antivirus and real-time protection on, in active mode (device-checks.csv)", "SI-3", "SVC-ACM", "Platform owner"],
          ["The host firewall on with inbound blocked (Firewall rows)", "SC-7", "CNA-EIS", "Platform owner"],
          ["Network protection and controlled folder access at the ring's stage (drift.csv)", "CM-6", "SVC-ACM", "Platform owner, weekly"],
          ["Tamper protection on; tampering attempts counted (events.csv)", "SI-7", "MLA-EVC", "SOC"],
        ] }, pt: 12.5 },
        { lead: "The pairs are the guide's G3 row. The kit's records support these controls; the assessor decides them." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5; FedRAMP, Key Security Indicators. Chapter 03, “Federal requirements and evidence.”",
      say: `Here's what the prevention check proves, against NIST's catalog. Antivirus and real-time protection on, in active mode, supports malicious code protection. The host firewall on with inbound blocked supports boundary protection. Network protection and controlled folder access at the ring's stage supports configuration settings. And tamper protection on, with tampering attempts counted, supports software and information integrity. The indicators are FedRAMP's, as the guide maps them. The records support these controls; the assessor decides them.`,
      detail: `Antivirus and real-time protection on, in active mode, on every checked device (device-checks.csv): SI-3; KSI-SVC-ACM; the platform owner. The host firewall on with inbound blocked (Firewall rows): SC-7; KSI-CNA-EIS; the platform owner. Network protection and controlled folder access at the ring's stage (drift.csv): CM-6; KSI-SVC-ACM; the platform owner, drift reviewed weekly. Tamper protection on; tampering attempts counted (TamperProtection rows, events.csv): SI-7; KSI-MLA-EVC; the SOC. The pairs are the guide's G3 row. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them.`,
      cite: [],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.9, 4.0, 4.25], rows: [
          ["A ring moved to block in Intune but not in the plan", "Drift reported on every device", "Change the plan with the same change record"],
          ["Defender Antivirus in passive mode", "Network protection doesn't run", "AntivirusMode check"],
          ["Datagram processing on a domain controller", "Learn's performance risk on high-UDP roles", "DatagramProcessing on dc, dns, file, sql"],
          ["Tamper protection turned off locally", "Settings drift silently", "TamperProtection row; tampering attempts"],
          ["No state file for a device", "It looks compliant by absence", "Devices with no state file are listed"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: examples/defender-xdr (Get-XdrPreventionFinding). Chapter 03, “Dangers.”",
      say: `What breaks in production? A ring moved to block in Intune but not in the plan: every device reports drift, so change the plan with the same change record. Defender Antivirus in passive mode: network protection doesn't run; the antivirus mode check catches it. Datagram processing on a domain controller, the performance risk Learn documents for high-UDP roles. Tamper protection turned off locally, so settings drift silently. And a device with no state file, which looks compliant by absence; the kit lists it.`,
      detail: `A ring moved to block in Intune but not in the plan: the check reports drift on every device; guard: change the plan file with the same change record. Defender Antivirus in passive mode: network protection doesn't run; guard: AntivirusMode check. Datagram processing on a domain controller: Learn's documented performance risk on high-UDP roles; guard: DatagramProcessing on dc, dns, file, sql. Tamper protection turned off locally: settings drift silently; guard: TamperProtection row; tampering attempts in events.csv. No state file for a device: it looks compliant by absence; guard: inventory devices with no state file are listed. One value is not yet specified: that Get-MpComputerStatus reports active mode as AMRunningMode Normal; it is in the research gaps.`,
      cite: [],
      ref: "“Dangers”; “Verified facts”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { cols: [[{ bullets: [
          "The prevention plan matches the Intune policy for each ring",
          "Every ring has at least one sampled device state this week",
        ], label: "The plan and the sample", color: "navy", pt: 14 }], [{ bullets: [
          "Every drift row has a ticket; a tamper drift with a tampering attempt goes to the SOC",
          "Network protection's test site was blocked on a ring in block",
          "The run folder is recorded as evidence (Chapter 08)",
        ], label: "The findings and the record", color: "teal", pt: 14 }]] },
        { callout: "Chapter 04, Attack Surface Reduction: Audit, Warn, Block, reads the same device states for the ASR rules.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 03, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. The prevention plan matches the Intune policy for each ring. Every ring has at least one sampled device state this week. Every drift row has a ticket, and a tamper drift with a tampering attempt goes to the security operations center. Network protection's test site was blocked on a ring in block. And the run folder is recorded as evidence. Next, Chapter 4 reads the same device states for the attack surface reduction rules, ring by ring. Thanks for watching.`,
      detail: `Checklist: The prevention plan matches the Intune policy for each ring. Every ring has at least one sampled device state this week. Every drift row has a ticket; a tamper drift with a tampering attempt goes to the SOC. Network protection's test site was blocked on a ring in block. The run folder is recorded as evidence (Chapter 08). Next: Chapter 04 — Attack Surface Reduction: Audit, Warn, Block.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
