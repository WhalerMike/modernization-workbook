// Building Defender XDR, Chapter 05 — Exposure and Incidents: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/defender-xdr/05-exposure-and-incidents.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-xdr-05-exposure-incidents/build.js
require("../_build/devwb.js")({
  workbook: "xdr", chapter: 5, dir: __dirname,
  base: "DW_XDR_05_Exposure_Incidents",
  title: "Exposure and Incidents",
  map: "Who has this? · what GCC can't do · what Learn leaves · the exposure check · the incident check · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 5: exposure and incidents. A vulnerability without an owner is an inventory finding, and an incident without an owner is a clock running. Both checks in this chapter ask the same question: who has this? We'll start from the guide's queries and Learn's incident list, and the government-cloud fact that shapes the exposure gate, then read both checks and walk two labs. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's G5 Exposure management and G6 XDR incidents. You start with the guide's two exposure queries, its incident export and the government-cloud fact that shapes G5, and what they leave to you. Then you read the exposure check, the Exposure Management disposition and the incident check. Lab 1 runs both on fixtures. Lab 2 runs them in a test tenant.`,
      cite: [],
      ref: "Opening; “In this chapter”",
    },
    {
      part: "Why", title: "Why both checks ask who has it",
      body: [
        { lead: "A vulnerability without an owner is an inventory finding; an incident without an owner is a clock running." },
        { cols: [[{ bullets: [
          "Route every exposed device to an owner",
          "Record Exposure Management correctly for a GCC tenant",
          "List every incident that broke the severity table",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who maintain the kit",
          "The vulnerability manager who owns G5",
          "The SOC lead who owns G6",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 05, opening, “Goal and audience.”",
      say: `Why put these two together? Because both ask who has this. A vulnerability with no owner isn't just unpatched; it's a gap in the inventory. And an incident with no owner is a clock running against the severity table. By the end of this chapter you can route every exposed device to an owner, record Security Exposure Management correctly for a GCC tenant, and list every incident that broke the severity table. It's for the developers, the vulnerability manager who owns the exposure gate, and the security operations lead who owns incidents.`,
      detail: `Goal: by the end of this chapter you can route every exposed device to an owner, record Exposure Management correctly for a GCC tenant, and list every incident that broke the severity table. Audience: developers who maintain the kit, the vulnerability manager who owns G5 and the SOC lead who owns G6. The remediation program and its clock are Book 12's Chapter 06 (Security Operations, Vulnerability Management); the response ladder and containment are Chapter 11.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "Why", title: "The government-cloud fact that shapes G5",
      body: [
        { table: { head: ["Feature", "GCC"], w: [7.0, 5.15], rows: [
          ["Microsoft Security Exposure Management: attack paths, the exposure graph, critical asset management", "Not available: Public Cloud only"],
          ["Defender Vulnerability Management, core and premium", "Available, without report inaccuracy and request CVE support"],
          ["DeviceInfo ExposureLevel, IsInternetFacing, AssetValue", "Available"],
          ["DeviceTvm tables", "Stay in Defender: not ingested into Sentinel"],
        ] }, pt: 13 },
        { callout: "prioritize by exposure level, internet-facing devices and asset value, and Vulnerability Management's recommendations; use the Tier 0 inventory as the critical-asset list.", label: "Interim path: ", icon: "FaRoute", color: "teal" },
      ],
      sources: "Sources: Learn, What is Microsoft Security Exposure Management?; Defender for Endpoint for US Government customers; DeviceInfo; DeviceTvmSoftwareVulnerabilities. Chapter 05.",
      say: `One government-cloud fact shapes the exposure gate. Learn says Microsoft Security Exposure Management, with its attack paths, exposure graph and critical asset management, is available in Public Cloud only, not in US Government clouds. Defender Vulnerability Management is available in GCC, core and premium, without two features. DeviceInfo still carries exposure level, internet facing, and asset value. And the vulnerability tables stay in Defender; they aren't ingested into Sentinel. So the guide's interim path prioritizes by those columns and Vulnerability Management's recommendations, with the Tier 0 inventory as the critical-asset list.`,
      detail: `Microsoft Security Exposure Management (attack paths, the exposure graph, critical asset management) is available in Public Cloud only, not in US Government clouds; Defender Vulnerability Management core and premium are available in GCC, without report inaccuracy and request CVE support. The guide's interim path prioritizes by ExposureLevel, IsInternetFacing and AssetValue from DeviceInfo and by Vulnerability Management's recommendations, and its two queries list high and critical vulnerabilities by software and update, and exposed or internet-facing devices. The DeviceTvm* tables stay in Defender; they aren't ingested into Sentinel.`,
      cite: ["xdr05-msem", "xdr05-gov", "xdr05-deviceinfo", "xdr05-tvm"],
      ref: "“Start with Microsoft Learn's commands” — “What the guide and Learn give you”",
    },
    {
      part: "What", title: "What the guide and Learn leave to you",
      body: [
        { table: { head: ["They give", "Why it isn't enough", "What the kit adds"], w: [3.2, 4.0, 4.95], rows: [
          ["Exposed devices", "Rows, not owners", "Each device's group matched to an owner; none is a finding"],
          ["“Exposure Management: not available”", "A ZTA test that needs it reads as a failure", "exposure-management.json: Skipped-Not-Applicable, the interim path"],
          ["An incident export", "A list, not a judgment", "Each incident read against the severity table"],
          ["One filter at a time", "An old incident still open is missed", "Created in 30 days, plus still active, merged by ID"],
          ["Triage windows", "Graph doesn't record first assignment", "Unowned past its window; no invented duration"],
        ] }, pt: 12 },
        { lead: "Verdict: run the guide's queries and Learn's list call as they are; add the owner, the table and the disposition." },
      ],
      sources: "Sources: examples/defender-xdr tests/Checks.Tests.ps1 (Chapter 05). Chapter 05, “What it leaves to you,” “The verdict.”",
      say: `What's left to you? The exposure query returns rows, not owners, so the kit matches each device's group to an owner, and no owner is a finding. Not available is a fact, but a Zero Trust Assessment test that needs Exposure Management would read as a failure, so the kit writes a disposition: skipped, not applicable, with the interim path. An incident export is a list, so each incident is read against the severity table. One filter misses an old incident that's still open, so the kit reads two and merges them. And Graph doesn't record when an incident was first assigned, so the kit reports unowned past its window, and invents no duration.`,
      detail: `Each row is pinned by a test in tests/Checks.Tests.ps1, Chapter 05. A query of exposed devices: each device's group matched to an owner in the agency's owners file; no owner is a finding. "Exposure Management: not available": a Zero Trust Assessment test that needs it reads as a failure; exposure-management.json: not available in GCC, normalized result Skipped-Not-Applicable, the interim path, the Learn page and date. An incident export: each incident read against the severity table: Triaged, Untriaged, OverdueTriage, Closed, ClosedWithoutClassification. One filter at a time: two reads, created in 30 days and still active, merged by ID. A table with triage windows: Graph doesn't record when an incident was first assigned; the kit reports an unowned incident past its window; it doesn't claim a time to triage it can't see.`,
      cite: [],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "The exposure check and its disposition",
      body: [
        { steps: [
          { title: "Run the guide's two queries", text: "High and critical vulnerabilities by software and update; exposed and internet-facing devices" },
          { title: "Match owners", text: "The agency's owners file maps each device group to a remediation owner; no owner is a CM-8 finding, not just RA-5" },
          { title: "Write the disposition", text: "For gcc: not available, Skipped-Not-Applicable, the interim path, the Learn page and date" },
        ], pt: 13.5 },
        { callout: "Skipped-Not-Applicable is one of the seven normalized results the Zero Trust Assessment results kit and the Zero Trust book use, so it lands in the closure register; a test keeps them equal.", label: "Reused: ", icon: "FaSitemap", color: "navy" },
      ],
      sources: "Sources: examples/defender-xdr (Invoke-XdrExposure.ps1, Get-XdrExposureDisposition); examples/zta-results. Chapter 05, “Exposure.”",
      say: `The exposure check runs the guide's two queries: high and critical vulnerabilities by software and recommended update, and exposed or internet-facing devices. It matches each exposed device's group to a remediation owner from the agency's owners file. A device with no owner is an inventory finding, not just a vulnerability finding. And it writes the disposition for the settings file's cloud. For GCC: not available, skipped, not applicable, with the interim path and the Learn page. That result name is one of the seven the Zero Trust Assessment results kit uses, so the same disposition lands in the closure register.`,
      detail: `Invoke-XdrExposure.ps1 (Invoke-XdrExposureCheck) runs the guide's two queries, reads the owners file named in the settings (machineGroups: device group to owner), and writes vulnerabilities.csv, exposed.csv, unowned.csv, exposure-management.json, summary.json, raw/ and the manifest. Get-XdrExposureDisposition writes the record for the settings' cloud: for gcc, not available, Skipped-Not-Applicable, the interim path. That result name is one of the seven the Zero Trust Assessment results kit and Book 11, Chapter 10 (Zero Trust, Evidence, Not Verdicts) use, so the same disposition lands in the closure register; a test reads that kit's taxonomy to keep them equal. A device with no owner is a finding against CM-8, not just RA-5 (risk-based recommended, the guide).`,
      cite: [],
      ref: "“The code” — “Exposure”",
    },
    {
      part: "What", title: "The incident check: five findings",
      body: [
        { table: { head: ["Finding", "When", "Result"], w: [3.8, 6.6, 1.75], rows: [
          ["Triaged", "Open, with an owner", "Pass"],
          ["Untriaged", "Open, no owner, inside its window", "Warn"],
          ["OverdueTriage", "Open, no owner, past its window", "Fail"],
          ["Closed", "Resolved with a classification and a determination", "Pass"],
          ["ClosedWithoutClassification", "Resolved with either still unknown", "Fail"],
        ] }, pt: 13 },
        { callout: "high 1 hour (L3 gated), medium 24 hours (L2 advise), low or informational 72 hours (L1 observe). Program design, from the guide's G6.", label: "Severity table: ", icon: "FaUserClock", color: "amber" },
      ],
      sources: "Sources: Learn, List incidents. examples/defender-xdr (Invoke-XdrIncidents.ps1, config/severity.json). Chapter 05, “Incidents.”",
      say: `The incident check reads incidents created in the last thirty days, and every incident still active, with their alerts, using Learn's list call with expand alerts. Each one gets a finding. Triaged: open, with an owner. Untriaged: open, no owner, but inside its window. Overdue triage: no owner, past its window, which fails. Closed: resolved with a classification and a determination. And closed without classification, which also fails. The windows come from the guide's severity table: one hour for high, twenty-four for medium, seventy-two for low and informational. Containment stays on the response ladder; the kit only prints each incident's rung.`,
      detail: `Invoke-XdrIncidents.ps1 (Invoke-XdrIncidentCheck) reads incidents created in the last 30 days and every incident still active, with $expand=alerts, and applies config/severity.json: Triaged (open, with an owner; Pass); Untriaged (open, no owner, inside its window; Warn); OverdueTriage (open, no owner, past its window; Fail); Closed (resolved with a classification and a determination; Pass); ClosedWithoutClassification (resolved with either still unknown; Fail). It writes incidents.csv, findings.csv, by-severity.csv, summary.json, raw/incidents.json and the manifest. The guide's severity table: high 1 hour, L3 gated; medium 24 hours, L2 advise; low or informational 72 hours, L1 observe (risk-based recommended; program design). Containment stays on Book 12's ladder; the kit only prints each incident's rung.`,
      cite: ["xdr05-incidents"],
      ref: "“The code” — “Incidents”",
    },
    {
      part: "Who", title: "Who owns the exposure, who owns the queue",
      body: [
        { cards: [
          { title: "Vulnerability manager", text: "Owns G5: every exposed device's owner; the weekly queue", color: "navy" },
          { title: "SOC lead", text: "Owns G6: daily queue review; every overdue incident owned today", color: "teal" },
          { title: "ISSO", text: "Files the disposition in the closure register; the inventory gaps", color: "amber" },
        ], pt: 13.5 },
        { callout: "the incident check reads; it never assigns, comments on or closes an incident.", label: "Illustrative code: ", icon: "FaFileShield", color: "red" },
      ],
      sources: "Sources: Chapter 05, “Goal and audience,” the “Illustrative code” callout, “Federal requirements and evidence.”",
      say: `Who's involved? The vulnerability manager owns the exposure gate: an owner for every exposed device, and the weekly queue. The security operations lead owns the incident gate: a daily queue review, and every overdue incident owned today. The security officer files the Exposure Management disposition in the closure register, and the inventory gaps. One caution: the incident check only reads. It never assigns, comments on or closes an incident. And the severity strings the exposure query filters on are as the portal shows them; check them in the test tenant.`,
      detail: `Audience: developers who maintain the kit, the vulnerability manager who owns G5 and the SOC lead who owns G6. Day-two: the vulnerability manager in Book 12's queue, weekly; the SOC lead, daily queue review, monthly metrics. The ISSO files exposure-management.json with the closure register. Illustrative code: the incident check reads; it never assigns, comments on or closes an incident. The guide's severity windows are the program's design, and the VulnerabilitySeverityLevel strings the exposure query filters on (Critical, High) are as the portal shows them; check them in the test tenant.`,
      cite: [],
      ref: "“Goal and audience”; the “Illustrative code” callout",
    },
    {
      part: "How", title: "Lab 1: the exposure check and its record",
      body: [
        { cols: [[{ terminal: "05-3", lines: "1-6,9-13", pt: 10.5 }], [{ terminal: "05-4", lines: "1-8", pt: 10.5 }]], split: 0.55 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 05, “Lab 1: fixtures, no tenant,” steps 1–2.",
      say: `Lab 1, in the kit's folder. Step 1 runs the exposure check. Three software rows with nine CVEs between them, and three exposed devices. Two have owners. The third sits in a group no owner covers: the same device Chapter 2 found missing from the inventory. Two findings, one cause. Step 2 reads the Exposure Management record: not available in GCC, skipped, not applicable, and the interim path in one sentence. That's what goes in the closure register, not a failed control.`,
      detail: `Work in examples/defender-xdr. Step 1: ./Invoke-XdrExposure.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/exposure -AsOf 2026-11-16T12:00:00Z. Three exposed devices; WKS-OLD-07 sits in a group no owner covers, the same device Chapter 02 found missing from the inventory. Two findings, one cause. Step 2: Get-Content out/exposure/exposure-management.json: not available in GCC; Skipped-Not-Applicable; the interim path in one sentence (the slide leaves out the interim path and the time). This is what goes in the closure register, not a failed control. All fictional.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the incident check and its findings",
      body: [
        { terminal: "05-5", lines: "2-10,12", pt: 11 },
        { terminal: "05-6", pt: 11 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 05, “Lab 1: fixtures, no tenant,” steps 3–4.",
      say: `Step 3 runs the incident check. Seven incidents. Incident 1002, high severity, has waited three and a half hours with no owner, against a one-hour window: overdue. Incident 1005 was resolved with its classification still unknown. And incident 1003, medium, has no owner yet, but it's inside its twenty-four hours. Step 4 reads the findings as the security operations lead gets them, each with its containment rung. The high one is the gated rung: the playbook prepares, and a named approver releases.`,
      detail: `Step 3: ./Invoke-XdrIncidents.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/incidents -AsOf 2026-11-16T12:00:00Z. Seven incidents: 1002, high, 3.5 hours with no owner against a one-hour window (OverdueTriage); 1005 resolved with classification unknown (ClosedWithoutClassification); 1003, medium, untriaged inside its 24 hours. Step 4: Import-Csv out/incidents/findings.csv | Format-Table Id, Severity, Finding, Rung -AutoSize -Wrap. Expected result: exposure 9 CVEs, 3 exposed devices, 1 with no owner; incidents 7, 1 overdue, 1 untriaged, 1 closed without a classification. Delete out when you're done.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 3–4",
    },
    {
      part: "How", title: "Lab 2: both checks in a test tenant",
      body: [
        { steps: [
          { title: "Sign in with both read scopes", text: "Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ThreatHunting.Read.All,SecurityIncident.Read.All" },
          { title: "Run both checks", text: "./Invoke-XdrExposure.ps1 and ./Invoke-XdrIncidents.ps1 -SettingsPath <settings-file>" },
          { title: "Check the severity strings", text: "An empty raw/tvm-high-critical.json in a tenant with known high vulnerabilities means the strings differ" },
          { title: "Back it out", text: "Nothing changed: Disconnect-MgGraph" },
        ], pt: 13.5 },
        { callout: "a test tenant, never production, with Vulnerability Management data and at least one incident; the guide's detection test makes one.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, List incidents; runHuntingQuery. Chapter 05, “Lab 2: a test tenant.”",
      say: `Lab 2 uses a test tenant, never production, with Vulnerability Management data on at least one device and at least one incident; the guide's detection test makes one. Sign in with both read scopes, and run both checks without the fixture path. Then look at the raw vulnerability file. If it's empty in a tenant you know has high vulnerabilities, the severity strings differ from the portal's, and that goes in the verification log. Nothing changed, so you just sign out.`,
      detail: `Use a test tenant, never production, with Defender Vulnerability Management data on at least one device and at least one incident (the detection test in the guide's G2 makes one). Placeholders: <tenant-id>, <settings-file> (with inputs.owners naming the test tenant's owners file) and <output-folder>. 1 Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ThreatHunting.Read.All,SecurityIncident.Read.All; ./Invoke-XdrExposure.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/exposure; ./Invoke-XdrIncidents.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/incidents. Check the VulnerabilitySeverityLevel values in raw/tvm-high-critical.json. 2 Disconnect-MgGraph. Not run by the authors.`,
      cite: ["xdr05-incidents"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.4, 2.5, 2.2, 2.05], rows: [
          ["Vulnerabilities by software and update (vulnerabilities.csv)", "RA-5, SI-2", "MLA-EVC", "Vulnerability manager"],
          ["Every exposed device owned, or a finding (exposed.csv, unowned.csv)", "CM-8", "PIY-GIV", "Vulnerability manager; ISSO"],
          ["Exposure Management recorded not applicable in GCC", "RA-5", "MLA-EVC", "ISSO"],
          ["Incidents owned in their window, closed with a classification", "IR-4, IR-5, AU-6", "INR-RIR, MLA-RVL", "SOC lead"],
          ["The incident record with its alerts (raw/incidents.json)", "IR-6", "INR-RPI", "IR lead"],
        ] }, pt: 12 },
        { lead: "The pairs are the guide's G5 and G6 rows. The kit's records support these controls; the assessor decides them." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5; FedRAMP, Key Security Indicators. Chapter 05, “Federal requirements and evidence.”",
      say: `Here's what these two gates prove, against NIST's catalog. Vulnerabilities by software and update support vulnerability monitoring and flaw remediation. Every exposed device owned, or a finding, supports the component inventory. The Exposure Management disposition supports vulnerability monitoring, honestly recorded. Incidents owned inside their windows and closed with a classification support incident handling, incident monitoring, and audit review. And the incident record with its alerts supports the reporting decision. The indicators are FedRAMP's, as the guide maps them. The records support these controls; the assessor decides them.`,
      detail: `High and critical vulnerabilities by software and update (vulnerabilities.csv): RA-5, SI-2; KSI-MLA-EVC; the vulnerability manager, into Book 12's queue. Every exposed device has an owner, or is a finding (exposed.csv, unowned.csv): CM-8; KSI-PIY-GIV; the vulnerability manager, the ISSO for the inventory gap. Exposure Management recorded as not applicable in GCC, with the interim path (exposure-management.json): RA-5; KSI-MLA-EVC; the ISSO, in the closure register. Every incident owned inside its window and closed with a classification (incidents.csv, findings.csv): IR-4, IR-5, AU-6; KSI-INR-RIR, KSI-MLA-RVL; the SOC lead, monthly. The incident record with its alerts, for the reporting decision (raw/incidents.json): IR-6; KSI-INR-RPI; the IR lead.`,
      cite: [],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.8, 4.1, 4.25], rows: [
          ["Exposure Management assumed in GCC", "Attack-path work stalls; a ZTA test reads failed", "The disposition and the interim path"],
          ["An exposed device with no owner", "Nobody patches it", "unowned.csv, a CM-8 finding"],
          ["Sentinel queries on DeviceTvm tables", "They return nothing", "The kit queries Defender's own hunting"],
          ["Only last month's incidents read", "An old open incident is missed", "The active filter too, merged by ID"],
          ["A time to triage from the wrong field", "A precise-looking, wrong metric", "Past-window, not a duration"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, What is Microsoft Security Exposure Management?; DeviceTvmSoftwareVulnerabilities. Chapter 05, “Dangers.”",
      say: `What breaks in production? Assuming Exposure Management in GCC stalls attack-path work, and makes a Zero Trust Assessment test look failed; the disposition and the interim path guard it. An exposed device with no owner never gets patched; it's a finding. Sentinel queries on the vulnerability tables return nothing, so the kit queries Defender's own advanced hunting. Reading only last month's incidents misses an old one still open, so the active filter is read too. And a time to triage computed from the wrong field is a precise-looking, wrong number, so the kit reports past-window instead.`,
      detail: `Exposure Management assumed in GCC: attack-path work stalls; a ZTA test reads as failed; guard: the disposition record and the interim path. An exposed device with no owner: nobody patches it; guard: unowned.csv, a CM-8 finding. Sentinel queries on DeviceTvm*: they return nothing; guard: the kit queries Defender's own advanced hunting. Only last month's incidents read: an old incident still open is missed; guard: the active filter is read too, merged by ID. A time to triage computed from the wrong field: a metric that looks precise and isn't; guard: the kit reports past-window, not a duration.`,
      cite: ["xdr05-msem", "xdr05-tvm"],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { cols: [[{ bullets: [
          "Every device group has an owner in the owners file",
          "exposure-management.json is filed with the closure register",
        ], label: "Exposure", color: "navy", pt: 14 }], [{ bullets: [
          "Every OverdueTriage incident has an owner today",
          "Every ClosedWithoutClassification incident is reopened and classified",
          "Both run folders are recorded as evidence (Chapter 08)",
        ], label: "Incidents and the record", color: "teal", pt: 14 }]] },
        { callout: "Chapter 06, Detections as Code, keeps the rules that raise these incidents as files, tested and deployed through Graph.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 05, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. Every device group has an owner in the owners file. The Exposure Management disposition is filed with the closure register. Every overdue incident has an owner today. Every incident closed without a classification is reopened and classified. And both run folders are recorded as evidence. Next, Chapter 6 keeps the rules that raise these incidents as files: tested, and deployed through Microsoft Graph. Thanks for watching.`,
      detail: `Checklist: Every device group has an owner in the owners file. exposure-management.json is filed with the closure register. Every OverdueTriage incident has an owner today. Every ClosedWithoutClassification incident is reopened and classified. Both run folders are recorded as evidence (Chapter 08). Next: Chapter 06 — Detections as Code.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
