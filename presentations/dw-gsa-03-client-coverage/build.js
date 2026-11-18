// Building Global Secure Access, Chapter 03 — The Client and Its Coverage: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/global-secure-access/03-the-client-and-its-coverage.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-gsa-03-client-coverage/build.js
require("../_build/devwb.js")({
  workbook: "gsa", chapter: 3, dir: __dirname,
  base: "DW_GSA_03_Client_Coverage",
  title: "The Client and Its Coverage",
  map: "Why the client is measured · what Learn gives and leaves · the device script · the seven checks · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome back to Building Global Secure Access. This is Chapter 3: the client and its coverage. Every later policy assumes the client is on the device, connected, current, and hard to turn off. This chapter measures that, device by device and across the fleet. The guide already holds Learn's Intune packaging and hardening, so we won't repeat them; we'll build the measurement. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's Step 3, Client deployment. The guide holds Learn's Intune packaging, detection rule, DNS-over-HTTPS profile and hardening remediation; this chapter doesn't repeat them. It builds the measurement: a device script that reads the guide's Validate values on one device, the beta device usage summary for the fleet, and checks GSA-CLI-01 to -07. Lab 1 finds the pilot's old client, its IPv6-preferred device, a browser still using DNS over HTTPS and a disconnected device. Lab 2 runs the device script on a test device.`,
      cite: ["gsa03-client"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why the client has to be measured",
      body: [
        { lead: "Every later policy assumes the client is on the device, connected, current and hard to turn off." },
        { cols: [[{ bullets: [
          "Say what **share of in-scope devices** carry an active client",
          "For each pilot device: current client, IPv4 preferred, DNS over HTTPS off, healthy",
          "From ring 2: the hardening values, with evidence for each",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who build or maintain the kit",
          "The endpoint engineer who owns the Intune app",
          "Help desk leads",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 03, opening, “Goal and audience.”",
      say: `Why measure the client? Because the compliant network check, the tenant restrictions and every private app assume it's there. If the client is missing or off, users are blocked, or traffic quietly goes around the policy. So the goal: say what share of in-scope devices carry an active client; for each pilot device, say whether it runs a current client with IPv4 preferred, DNS over HTTPS off and a healthy connection; and from ring 2, show the hardening values, with evidence for each. It's for the developers, the endpoint engineer who owns the Intune app, and help desk leads.`,
      detail: `Goal: by the end of this chapter you can say what share of in-scope devices carry an active client, and for each pilot device whether it runs a current client with IPv4 preferred, DNS over HTTPS off, a healthy connection and, from ring 2, the hardening values, with evidence for each. Audience: developers who build or maintain the kit, the endpoint engineer who owns the Intune app, and help desk leads.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.6, 8.55], rows: [
          ["Prerequisites", "Joined, hybrid joined or registered (registered: Private Access only, preview); admin to install; IPv4 only; no secure DNS"],
          ["Intune and hardening", "Win32 app values, DNS-over-HTTPS profile, four hardening registry values; restrict users later"],
          ["Device usage summary (beta)", "totalDeviceCount, activeDeviceCount, inactiveDeviceCount; NetworkAccessPolicy.Read.All, delegated only"],
          ["Universal CAE", "Windows client 1.8.239.0 or later"],
          ["A difference", "The summary's parameter table marks trafficType required; its example and the guide omit it"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, Install the client for Windows; getDeviceUsageSummary; Known limitations. Chapter 03, “What Microsoft gives you.”",
      say: `Learn's client page gives the prerequisites: a joined, hybrid joined or registered device, though registered devices carry only Private Access, in preview; an administrator to install; IPv4 only; and no secure DNS. It gives the Intune values, the DNS-over-HTTPS profile, four hardening registry values, and the advice to let users run unrestricted first. For the fleet, the beta device usage summary counts total, active and inactive devices, with Network Access Policy Read All. Clients 1.8.239 or later use Universal Continuous Access Evaluation. One difference: the summary's parameter table marks traffic type required, while its own example and the guide leave it out.`,
      detail: `Learn's client page: a device joined, hybrid joined or registered in the tenant (registered devices carry only Private Access, in preview), the Intune Win32 app values, the DNS-over-HTTPS settings catalog profile, the four hardening registry values with their remediation scripts, and the advice to let users run unrestricted first and restrict non-privileged users later. GET /networkAccess/reports/getDeviceUsageSummary (beta) returns totalDeviceCount, activeDeviceCount and inactiveDeviceCount with NetworkAccessPolicy.Read.All, delegated only; Global Reader and Global Secure Access Log Reader are enough. The Windows client 1.8.239.0 or later uses Universal Continuous Access Evaluation tokens. trafficType: the parameter table marks it required (microsoft365, private, internet); the page's example and the guide omit it (research gap 2).`,
      cite: ["gsa03-client", "gsa03-usage", "gsa03-limits"],
      ref: "“What Microsoft gives you”; “Verified facts”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["Learn, as published", "Why it matters", "What the kit adds"], w: [3.4, 3.4, 5.35], rows: [
          ["Validate commands typed on one device", "No record to compare across devices", "tools/Get-GsaClientState.ps1: the same reads, read-only, as one JSON record"],
          ["A device count from the service", "Means nothing without the count that should be there", "GSA-CLI-01: active ÷ Intune's in-scope count, against the target"],
          ["Hardening after users run unrestricted", "Hardening in the pilot hides who needs to disable", "GSA-CLI-06: information in the pilot, a check from ring 2"],
          ["A minimum version only for Universal CAE", "Older clients quietly lose a protection", "GSA-CLI-02 against minClientVersion"],
          ["Exclusions in prose", "An exclusion without an owner never ends", "GSA-CLI-07 on the exception register"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Learn, Install the client for Windows. Chapter 03, “What it leaves to you.”",
      say: `What does it leave to you? The Validate commands are typed on one device, with no record to compare across devices, so the kit's device script runs the same reads, read-only, and writes one record. A device count means nothing without the number that should be there, so coverage divides by Intune's in-scope count. Hardening in the pilot hides who needs to turn the client off, so it's information in the pilot and a check from ring 2. An old client quietly loses a protection, so there's a version check. And an exclusion without an owner never ends, so exclusions live in the exception register.`,
      detail: `Each row is pinned by a test in the Chapter 03 block of tests/GlobalSecureAccess.Tests.ps1. Validate commands typed on one device: tools/Get-GsaClientState.ps1, the same reads, read-only, as one JSON client record per device. A device count from the service: GSA-CLI-01 divides activeDeviceCount by the in-scope count from Intune (the settings file) against the target. Hardening after users run unrestricted: GSA-CLI-06 is information in the pilot and a check from ring 2. A minimum version only for Universal CAE: GSA-CLI-02 compares each device with minClientVersion. Exclusions (Hyper-V external switch, AVD multi-session) in prose: GSA-CLI-07 checks each client-exclusion row in the exception register.`,
      cite: ["gsa03-client"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "The seven client checks",
      body: [
        { table: { head: ["Check", "What it looks for"], w: [2.0, 10.15], rows: [
          ["GSA-CLI-01", "activeDeviceCount ÷ in-scope devices meets the target (98% after ring 3, the guide's)"],
          ["GSA-CLI-02", "Client at least minClientVersion (1.8.239.0 in the lab, for Universal CAE)"],
          ["GSA-CLI-03", "DisabledComponents is 0x20, IPv4 preferred, as Learn's install script sets it"],
          ["GSA-CLI-04", "DNS over HTTPS off in Edge and Chrome"],
          ["GSA-CLI-05", "Health is Connected, read from the tray's health check by a person"],
          ["GSA-CLI-06", "The four hardening values are 1, required from ring 2"],
          ["GSA-CLI-07", "Each client exclusion has an owner, an approver and an expiry in the future"],
        ] }, pt: 13 },
      ],
      sources: "Sources: examples/global-secure-access (Test-GsaClient). Chapter 03, “The code.”",
      say: `Here are the seven checks. Coverage: active devices over in-scope devices, against the target, ninety-eight percent after ring 3 in the guide. Each device's client is at least the minimum version, here the one Universal access evaluation needs. IPv4 is preferred, the value Learn's install script sets. DNS over HTTPS is off in Edge and Chrome. Health is connected. The four hardening values are set, from ring 2. And each client exclusion has an owner, an approver and an expiry. One honest note: the browser policy value the script expects is Chromium's, not stated on the Learn page read, and the research gaps say so.`,
      detail: `Test-GsaClient reads the collection's device usage summary, the settings (inScopeDevices, minClientVersion, targets.clientCoverage, ring) and inputs/client-records.json. GSA-CLI-01 activeDeviceCount ÷ in-scope devices meets targets.clientCoverage (98% after ring 3, the guide's target). GSA-CLI-02 client at least minClientVersion (1.8.239.0 in the lab, for Universal CAE). GSA-CLI-03 DisabledComponents is 0x20, IPv4 preferred, as Learn's install script sets it. GSA-CLI-04 DNS over HTTPS is off in Edge and Chrome. GSA-CLI-05 health is Connected (read from the tray's health check by a person and passed to the script). GSA-CLI-06 the four hardening values are 1, required from ring 2. GSA-CLI-07 each client exclusion has an owner, an approver and an expiry in the future. The device script reads DnsOverHttpsMode; the value the Intune setting writes (off for Disabled) is the Chromium policy's, not stated on the Learn page read (research gap 4).`,
      cite: ["gsa03-limits"],
      ref: "“The code”",
    },
    {
      part: "Who", title: "Who owns the client, and what they read",
      body: [
        { cols: [[{ bullets: [
          "**Endpoint engineer**: the Intune app, the DNS profile, hardening from ring 2",
          "**Help desk**: Collect logs and the health check before escalating",
          "**Policy owner**: approves client exclusions",
          "**ISSO**: keeps the runs and health check exports",
        ], label: "Roles", color: "teal", pt: 14 }], [{ bullets: [
          "device-usage: NetworkAccessPolicy.Read.All, beta, delegated only",
          "The device script: local administrator on the test device, reads only",
          "The in-scope count: from Intune, dated, in the settings file",
        ], label: "What each reads", color: "navy", pt: 14 }]] },
      ],
      sources: "Sources: Learn, getDeviceUsageSummary. Chapter 03, “Goal and audience,” Lab 2, “Federal requirements,” “Checklist.”",
      say: `Who owns this? The endpoint engineer owns the Intune app, the DNS-over-HTTPS profile, and the hardening from ring 2. The help desk uses the client's collect logs and health check before escalating. The policy owner approves exclusions, and the security officer keeps the runs and the health check exports. The fleet read needs only Network Access Policy Read All, delegated. The device script runs as an administrator on a test device and only reads. And the in-scope count comes from Intune, with its date, in the settings file.`,
      detail: `Evidence owners (Chapter 03): coverage, the endpoint engineer, the ISSO keeps the run; each device's values, the endpoint engineer; hardening from ring 2, the endpoint engineer; client exclusions, the policy owner. device-usage: NetworkAccessPolicy.Read.All, delegated only, beta (Global Reader, Global Secure Access Log Reader). The device script runs as an administrator and changes nothing. Checklist: the in-scope device count in the settings file comes from Intune, with its date.`,
      cite: ["gsa03-usage"],
      ref: "“Goal and audience”; “Lab 2”; “Checklist”",
    },
    {
      part: "How", title: "Lab 1: the fleet count and the four devices",
      body: [
        { terminal: "03-2", lines: "1-2,4,6-12" },
        { terminal: "03-3" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 03, “Lab 1: fixtures, no tenant,” steps 2–3.",
      say: `Lab 1, in the kit's folder, no tenant. Step 1 lists one read, the device usage summary. Step 2 reads the pilot tenant's summary: eighteen devices, fifteen active, three inactive. Step 3 reads the four pilot devices' client records, as the device script wrote them. Pilot 3 runs an older client with DisabledComponents zero, so IPv6 is preferred; pilot 4 is disconnected; and only pilot 1 has the hardening values.`,
      detail: `Step 1: Get-GsaRequiredPermission -Area client | Format-Table: device-usage, GET, NetworkAccessPolicy.Read.All, beta, verified. Step 2: ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -Area client -OutputPath out/client -AsOf 2026-11-16T12:00:00Z; Read-GsaJson -Path out/client/raw/device-usage.json: 18 total, 15 active, 3 inactive. Step 3: (Read-GsaInputs -Path tests/fixtures/pilot/inputs).clients | ForEach-Object { [pscustomobject]@{ Device; Version; DisabledComponents; Health; Hardening } } | Format-Table.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–3",
    },
    {
      part: "How", title: "Lab 1: five failures, and ring 2's rule",
      body: [
        { terminal: "03-4", lines: "2,13-15,21,25" },
        { terminal: "03-5", lines: "3-9" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 03, “Lab 1,” steps 4–5.",
      say: `Step 4 runs the client checks. Coverage is eighty-three percent against ninety-eight. Pilot 3 has an old client, IPv6 preferred, and DNS over HTTPS still on in Chrome. Pilot 4 is disconnected. The Hyper-V exclusion has an owner, an approver and an expiry. Hardening is only information in the pilot. Step 5 asks the same devices ring 2's question, where hardening is required: three devices fail, because only pilot 1 has the remediation.`,
      detail: `Step 4: ./Invoke-GsaCheck.ps1 -Area client ... -OutputPath out/check-client. client: 22 checks (5 Fail, 4 Info, 13 Pass). GSA-CLI-01 Fail: 15 active of 18 in-scope devices (83.3%), target 98%. PC-PILOT-03: GSA-CLI-02 Fail client 1.7.669.0, minimum 1.8.239.0; GSA-CLI-03 Fail DisabledComponents = 0x0; GSA-CLI-04 Fail DNS over HTTPS not off in Chrome. PC-PILOT-04: GSA-CLI-05 Fail health Disconnected. GSA-CLI-07 Pass for EX-06. Step 5: $s = Read-GsaSettings ...; $s.ring = 'ring2'; Test-GsaClient ... | Where-Object Id -EQ 'GSA-CLI-06' | Format-Table Object, Status, Detail: PC-PILOT-01 Pass 4 of 4; PC-PILOT-02, -03, -04 Fail 0 of 4. (Passing rows are left out of the slide.)`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 4–5",
    },
    {
      part: "How", title: "Lab 1: the device script, and the tests",
      body: [
        { terminal: "03-6" },
        { terminal: "03-7" },
      ],
      sources: "Sources: examples/global-secure-access. Chapter 03, “Lab 1,” steps 6–7.",
      say: `Step 6 reads the device script's header. It runs on a Windows device, not on the lab laptop, as an administrator, and only reads: the client's file version, the four hardening values, the IPv4 preference and the browsers' DNS-over-HTTPS policy. The health is read from the tray's health check by a person and passed in, because the script can't see it. Step 7 runs this chapter's tests: three passed, none failed. Then delete the output folder.`,
      detail: `Step 6: Get-Content ./tools/Get-GsaClientState.ps1 -TotalCount 11. The synopsis: run on a Windows device with the Global Secure Access client, as an administrator: reads the guide's Step 3 Validate values (the client's file version, the four hardening registry values, IPv4 preferred, the Edge and Chrome DNS-over-HTTPS policy) and prints one client record as JSON for inputs/client-records.json. Reads only; changes nothing. The tray's health (Advanced diagnostics > Health check) is read by a person and passed in. Step 7: Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Chapter 03*' -Output None -PassThru: 3 passed, 0 failed.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 6–7",
    },
    {
      part: "How", title: "Lab 2: a test device and tenant",
      body: [
        { steps: [
          { title: "On the device, read the client's state", text: "Health check first, then the device script as administrator, to a JSON file" },
          { title: "Run the guide's Validate reads beside it", text: "The file version and DisabledComponents, as a cross-check" },
          { title: "Add the record to your inputs", text: "The devices list of client-records.json, on agency storage" },
          { title: "Read the fleet's count and check", text: "NetworkAccessPolicy.Read.All; if activeDeviceCount is 0 with a connected client, record it (trafficType)" },
          { title: "Back it out", text: "Nothing changed: sign out, delete or file the outputs" },
        ], pt: 12.5 },
        { callout: "one Windows 11 test device, Entra joined, Intune enrolled, with the client from the guide's Step 3.2 app. Not run by the authors.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, Install the client; getDeviceUsageSummary. Chapter 03, “Lab 2: a test device and tenant.”",
      say: `Lab 2 needs one Windows 11 test device, joined to Entra ID and enrolled in Intune, with the client installed from the guide's Intune app. On the device, open the health check, then run the device script as an administrator. Run the guide's own reads beside it as a cross-check. Add the record to your inputs, on agency storage. Then read the fleet's count and check. If the service reports no active devices while the client is connected, record it: it may be the traffic type parameter Learn's table marks required. Nothing changed, so backing out is signing out. The authors haven't run this lab.`,
      detail: `Placeholders: <tenant-id>, <settings-file> (with inScopeDevices from Intune's count of in-scope Windows devices), <inputs-folder>, <device-name>. 1 On the device, as an administrator: open the tray's Advanced diagnostics > Health check; .\\tools\\Get-GsaClientState.ps1 -Health Connected | Out-File .\\client-<device-name>.json -Encoding utf8. 2 (Get-Item "C:\\Program Files\\Global Secure Access Client\\TrayApp\\GlobalSecureAccessClient.exe").VersionInfo.FileVersion; Get-ItemProperty ...Tcpip6\\Parameters -Name DisabledComponents. 3 Wrap the record as @{ devices = @($rec) } into <inputs-folder>/client-records.json. 4 Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes NetworkAccessPolicy.Read.All; ./Invoke-GsaCollect.ps1 -Area client; ./Invoke-GsaCheck.ps1 -Area client. The device should pass GSA-CLI-02 to -05. If activeDeviceCount is 0 with a connected client, record it: the guide's request omits the trafficType parameter that Learn's parameter table marks required (research gap 2). 5 Disconnect-MgGraph; Remove-Item the outputs.`,
      cite: ["gsa03-client", "gsa03-usage"],
      ref: "“Lab 2: a test device and tenant”",
    },
    {
      part: "How", title: "Requirements, dangers, done",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Keeps it"], w: [5.6, 2.2, 2.4, 1.95], rows: [
          ["Coverage against Intune's in-scope count", "SI-4; CM-8", "MLA-EVC, CNA-RNT", "Endpoint eng.; ISSO"],
          ["Each device's version, IPv4, DNS over HTTPS, health", "CM-6", "MLA-EVC", "Endpoint eng."],
          ["Users can't silently turn it off, from ring 2", "CM-7", "CNA-RNT", "Endpoint eng."],
          ["Client exclusions are owned and expire", "CM-6; CM-7", "MLA-EVC", "Policy owner"],
        ] }, pt: 12 },
        { cols: [[{ bullets: [
          "Hardening in the pilot: information until ring 2",
          "IPv6 preferred, or DNS over HTTPS on: GSA-CLI-03, -04",
          "A count read as coverage: divide by Intune's count",
        ], label: "Dangers and guards", color: "red", pt: 12.5 }], [{ bullets: [
          "In-scope count from Intune, dated",
          "A record and health export per pilot device",
          "Coverage meets the ring's target before exit",
        ], label: "Done when", color: "teal", pt: 12.5 }]] },
      ],
      sources: "Sources: kit config/requirements.json (the guide's requirements table). Chapter 03, “Federal requirements,” “Dangers,” “Checklist.”",
      say: `Coverage against Intune's count supports system monitoring and the component inventory. Each device's configuration supports configuration settings. Hardening from ring 2 supports least functionality, and governed exclusions support both. The indicators are FedRAMP's, mapped by the program, and the assessor decides the controls. The dangers: hardening in the pilot, which hides who needs to turn the client off; IPv6 preferred or DNS over HTTPS on, which lets traffic go around the client; and a raw count mistaken for coverage. You're done when the count comes from Intune with its date, every pilot device has a record, and coverage meets the target before the ring exits. Next, Chapter 4: Microsoft traffic, and change plans.`,
      detail: `Requirements (config/requirements.json): coverage against Intune's in-scope count: SI-4; CM-8; KSI-MLA-EVC, KSI-CNA-RNT. Each device's version, IPv4 preference, DNS-over-HTTPS policy and health: CM-6; KSI-MLA-EVC. Users can't silently turn the client off, from ring 2: CM-7; KSI-CNA-RNT. Client exclusions are owned and expire: CM-6, CM-7; KSI-MLA-EVC. The guide's requirements table also names the device inventory expectations of OMB M-22-09. The kit's records support these controls; the agency's assessor decides them. Dangers: hardening in the pilot (GSA-CLI-06 is information until ring 2); IPv6 preferred (GSA-CLI-03); DNS over HTTPS left on (GSA-CLI-04); a device count read as coverage (GSA-CLI-01 divides by Intune's count); an old client (GSA-CLI-02). Checklist: the in-scope count comes from Intune with its date; each pilot device has a client record and a health check export; coverage meets the ring's target before the ring exits; hardening from ring 2; every client exclusion has an owner, an approver and a review date. Next: Chapter 04 — Microsoft Traffic and Change Plans.`,
      cite: [],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
