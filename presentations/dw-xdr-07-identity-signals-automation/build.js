// Building Defender XDR, Chapter 07 — Identity Signals and Automation Boundaries: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/defender-xdr/07-identity-signals-and-automation-boundaries.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-xdr-07-identity-signals-automation/build.js
require("../_build/devwb.js")({
  workbook: "xdr", chapter: 7, dir: __dirname,
  base: "DW_XDR_07_Identity_Signals_Automation",
  title: "Identity Signals and Automation Boundaries",
  map: "One story, one boundary · what Learn gives · what it leaves · signals · automation · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 7: identity signals and automation boundaries. The same account seen by the endpoint, the domain controller and a cloud app is one story. What Defender may do about it on its own is a decision the authorizing official made, and the settings have to match it. We'll start from the guide's cross-source query and Learn's automation levels and exclusions, read both checks, and walk two labs. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's G8 Identity and cloud-app signals and G9 Automation with approval boundaries. You start with the guide's cross-source query, the five device group levels and the attack disruption exclusions Learn describes, and what they leave to you. Then you read the two checks. Lab 1 runs both on fixtures. Lab 2 runs them in a test tenant from the portal's own exports.`,
      cite: [],
      ref: "Opening; “In this chapter”",
    },
    {
      part: "Why", title: "Why signals and automation share a chapter",
      body: [
        { lead: "Detection joined up across sources, and response kept inside the boundary the authorizing official set." },
        { cols: [[{ bullets: [
          "Show that identity and cloud-app sources feed incidents",
          "Show Defender's automation matches the response ladder",
          "Show every exclusion approved, and every emergency access account protected",
        ], label: "By the end of the chapter you can", color: "navy", pt: 13.5 }], [{ bullets: [
          "Developers who maintain the kit",
          "The SOC lead who owns G8 and G9",
          "The platform owner",
        ], label: "Who it's for", color: "teal", pt: 13.5 }]] },
      ],
      sources: "Sources: Chapter 07, opening, “Goal and audience.”",
      say: `Why these two together? Because they keep detection and response joined up. Detection should see one story across the endpoint, identity and cloud apps. And response should stay inside the boundary the authorizing official set. By the end of this chapter you can show that identity and cloud-app sources are feeding incidents, that Defender's automation matches the response ladder, and that every exclusion is approved, with every emergency access account protected. It's for the developers, the security operations lead who owns both gates, and the platform owner.`,
      detail: `Goal: by the end of this chapter you can show that identity and cloud-app sources feed incidents, and that Defender's automation matches the response ladder, with every exclusion approved and every emergency access account protected. Audience: developers who maintain the kit, the SOC lead who owns G8 and G9, and the platform owner. The ladder is Book 12's Chapter 11 (Security Operations); identity telemetry is Chapter 03. You should have run Chapter 06's Lab 1.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "Why", title: "What the guide and Learn give you",
      body: [
        { cols: [[{ bullets: [
          "AlertEvidence joined to AlertInfo on AlertId",
          "Users with alerts from more than one ServiceSource in 7 days",
          "GCC: App Governance alerts on the roadmap; Cloud Apps behaviors not in BehaviorInfo",
        ], label: "Signals (G8)", color: "navy", pt: 13 }], [{ bullets: [
          "Five device group levels, from Full to No automated response; Microsoft recommends Full",
          "User exclusions for service and emergency admin accounts; exclusions reduce protection",
          "Contain User needs the sensor at 10.8470 or later",
        ], label: "Automation (G9)", color: "teal", pt: 13 }]] },
        { callout: "attack disruption's GCC availability is not yet specified, and Learn names no Graph API for these settings: the portal holds them.", label: "Gaps: ", icon: "FaCloud", color: "red" },
      ],
      sources: "Sources: Learn, AlertEvidence; AlertInfo; Cloud Apps for US Government; advanced hunting schema; attack disruption exclusions; configure attack disruption. Chapter 07.",
      say: `Here's what's already there. For signals, the guide's query joins alert evidence to alert info, and keeps the users with alerts from more than one service in seven days. In GCC, Learn lists App Governance's alerts as roadmap items, and Cloud Apps behaviors aren't available in the behavior table. For automation, each device group has one of five levels, from full remediation to no automated response; Microsoft recommends full. User exclusions are for service and emergency admin accounts, and exclusions reduce protection. Contain User needs the sensor at 10.8470 or later. Attack disruption's GCC availability isn't specified, and the portal holds these settings; Learn names no Graph API for them.`,
      detail: `Signals: the guide's query joins AlertEvidence to AlertInfo and keeps the users with alerts from more than one ServiceSource in 7 days. In GCC, App Governance's predefined policy alerts are listed as roadmap items, and Cloud Apps behaviors in BehaviorInfo aren't available. Automation: each device group has one of five levels: Full - remediate threats automatically; Semi - require approval for core folders; Semi - require approval for non-temp folders; Semi - require approval for all folders; No automated response. Microsoft recommends Full; excluding a device group from attack disruption also affects automated investigation and response for it; user exclusions are for service and emergency admin accounts, and exclusions reduce protection. Contain User needs the sensor at version 10.8470 or later, read from MsSenseDllVersion. Attack disruption's GCC availability is not yet specified. The portal holds these settings; Learn names no Graph API for them.`,
      cite: ["xdr07-alertevidence", "xdr07-mdca", "xdr07-schema", "xdr07-exclusions", "xdr07-disruption"],
      ref: "“Start with Microsoft Learn's commands” — “What the guide and Learn give you”",
    },
    {
      part: "What", title: "What it leaves to you, and the verdict",
      body: [
        { table: { head: ["Learn gives", "Why it isn't enough", "What the kit adds"], w: [3.0, 4.2, 4.95], rows: [
          ["A query that returns users", "No order; no sign a source is missing", "A priority list; fail when only the endpoint feeds alerts"],
          ["The five levels", "The portal doesn't know the ladder", "config/ladder.json: workstation Full, pilot Semi all, server Semi"],
          ["Exclusions in the portal", "Nobody reviews them; the emergency account may be missing", "Approver and review date ahead; every emergency account excluded"],
          ["A minimum sensor version", "Contain User silently doesn't run", "Each device's senseVersion against the minimum"],
        ] }, pt: 12.5 },
        { lead: "Verdict: run the guide's query and read Learn's levels as they are; check them against the ladder and the register." },
      ],
      sources: "Sources: examples/defender-xdr tests/Checks.Tests.ps1 (Chapter 07). Chapter 07, “What it leaves to you,” “The verdict.”",
      say: `What's left to you? The query returns users in no order, and can't tell you a source has gone quiet, so the kit sorts a priority list, and fails when no row names a source beyond the endpoint. The portal shows five levels but doesn't know the ladder, so the kit's ladder says workstations get full, the pilot gets semi for all folders, and servers get a semi level. Exclusions sit in the portal unreviewed, so each needs an approver and a review date, and every emergency account must be there. And Contain User silently doesn't run on an old sensor, so each device's version is checked.`,
      detail: `Each row is pinned by a test in tests/Checks.Tests.ps1, Chapter 07. A query that returns users: a priority list (emergency access accounts first, then by sources and alerts); a fail when no row names a source beyond the endpoint. The five levels: config/ladder.json, workstation Full, pilot Semi for all folders, server any Semi level; each group checked. Exclusions in the portal: each exclusion needs an approver and a review date ahead; every emergency access account in the settings must be an identity exclusion. A minimum sensor version in prose: each device state's senseVersion against the minimum. The verdict: run the guide's query and read Learn's levels as they are. Check them against the ladder and the exclusion register, because automation is only safe inside the boundary the authorizing official set.`,
      cite: [],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "The two checks",
      body: [
        { cols: [[{ bullets: [
          "Runs the guide's cross-source query",
          "Emergency access accounts first: page the IR lead; a human decides any containment",
          "Three or more sources: a priority",
          "Writes priority.csv",
        ], label: "Invoke-XdrSignals.ps1", color: "navy", pt: 13.5 }], [{ bullets: [
          "Reads files, no API: the device groups export, the attack disruption exclusions, device states",
          "A workstation group below Full passes only with a recorded exception ID",
          "Writes groups.csv, exclusions.csv, sensor.csv",
        ], label: "Invoke-XdrAutomation.ps1", color: "teal", pt: 13.5 }]] },
        { callout: "the exports come from Settings, Endpoints, Device groups and Settings, Microsoft Defender XDR, Automated response, in the template columns.", label: "Inputs: ", icon: "FaTableList", color: "amber" },
      ],
      sources: "Sources: examples/defender-xdr (Invoke-XdrSignalsCheck, Invoke-XdrAutomationCheck, config/ladder.json). Chapter 07, “The code.”",
      say: `Two checks. The signals check runs the guide's cross-source query and writes a priority list. An emergency access account goes first, with one instruction: page the incident response lead, and a human decides any containment. Three or more sources is a priority. The automation check reads three files and calls nothing: the device groups export, the attack disruption exclusions, and the device states. A workstation group below full passes only with a recorded exception. The exports come from two portal pages, copied into the template columns.`,
      detail: `Invoke-XdrSignals.ps1 (Invoke-XdrSignalsCheck) runs the guide's query and writes priority.csv, summary.json, raw/ and the manifest. An emergency access account (settings emergencyAccessAccounts) is flagged page the IR lead; a human decides any containment; three or more sources is a priority. Invoke-XdrAutomation.ps1 (Invoke-XdrAutomationCheck) reads three files, no API: the device groups export (Name, Rank, Kind, RemediationLevel, ExceptionId), the attack disruption exclusions (Type, Value, Reason, Approver, ReviewBy) and the device states. It writes groups.csv, exclusions.csv, sensor.csv, summary.json and the manifest. A workstation group below Full passes only with a recorded exception ID. The two exports are files the operator makes from Settings > Endpoints > Device groups and Settings > Microsoft Defender XDR > Automated response, in the columns of templates/.`,
      cite: [],
      ref: "“The code”; the “Illustrative code” callout",
    },
    {
      part: "Who", title: "Who sets the boundary, who keeps it",
      body: [
        { cards: [
          { title: "Authorizing official", text: "Decides attack disruption as a ladder class; approves each exclusion", color: "navy" },
          { title: "SOC lead", text: "Owns G8 and G9: the weekly hunt; exclusions reviewed quarterly", color: "teal" },
          { title: "Platform owner", text: "Sets the device group levels with the SOC lead", color: "amber" },
        ], pt: 13.5 },
        { callout: "the ladder's mapping is the program's design, and the authorizing official's attack disruption decision comes first.", label: "Illustrative code: ", icon: "FaFileShield", color: "red" },
      ],
      sources: "Sources: Chapter 07, “Goal and audience,” the “Illustrative code” callout; the guide, G9.",
      say: `Who's involved? The authorizing official decides attack disruption as a class on the response ladder, and approves each exclusion. The security operations lead owns both gates: the weekly hunt, and a quarterly review of the exclusions. The platform owner sets the device group levels with the security operations lead. One note: the ladder's mapping is the program's design, and the authorizing official's attack disruption decision comes first. The kit checks the settings against it; it doesn't make the decision.`,
      detail: `Audience: developers who maintain the kit, the SOC lead who owns G8 and G9, and the platform owner. The guide's G9: the authorizing official's recorded decision on attack disruption as an L4 class; exclusions each in the register with the authorizing official's approval; SOC lead with the platform owner; exclusions reviewed quarterly. Illustrative code: the ladder's mapping is the program's design, and the authorizing official's attack disruption decision comes first (Security Operations, Chapter 11).`,
      cite: [],
      ref: "“Goal and audience”; the “Illustrative code” callout",
    },
    {
      part: "How", title: "Lab 1: the signals check",
      body: [
        { terminal: "07-3", lines: "1-6,8", pt: 11 },
        { callout: "an emergency access account with identity and cloud-app alerts in the same week. Nobody's playbook touches it; the IR lead decides.", label: "Read it: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 07, “Lab 1: fixtures, no tenant,” step 1.",
      say: `Lab 1, in the kit's folder. Step 1 runs the signals check. The first row is an emergency access account, with identity and cloud-app alerts in the same week. Nobody's playbook touches it; the incident response lead decides. Then a user seen by three sources, a priority, and one seen by two. The last line says identity or cloud-app sources are feeding alerts, so the check passes.`,
      detail: `Work in examples/defender-xdr. Step 1: ./Invoke-XdrSignals.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/signals -AsOf 2026-11-16T12:00:00Z. breakglass01 comes first: an emergency access account with identity and cloud-app alerts in the same week. j.rivera, three sources, is a priority; a.chen, two sources, is for the weekly hunt. The identity and cloud-app sources are feeding alerts, so the check passes. All fictional.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” step 1",
    },
    {
      part: "How", title: "Lab 1: the automation check, and the ladder",
      body: [
        { terminal: "07-4", lines: "2-8,11-14,17-19,21", pt: 10 },
        { terminal: "07-5", lines: "2-4", pt: 10 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures; config/ladder.json). Chapter 07, “Lab 1: fixtures, no tenant,” steps 2–3.",
      say: `Step 2 runs the automation check, and finds four things. The ring 3 workstation group sits at a semi level with no exception: off the ladder. The scanner subnet's exclusion passed its review date in October. The second emergency access account isn't in the identity exclusions, so attack disruption could contain it. And one device runs a sensor below 10.8470, so Contain User won't act there. Step 3 reads the ladder the groups are checked against: full for workstations, semi for all folders for the pilot, and any semi level for servers.`,
      detail: `Step 2: ./Invoke-XdrAutomation.ps1 -SettingsPath tests/fixtures/settings.lab.json -OutputPath out/automation -AsOf 2026-11-16T12:00:00Z. Ring3-Workstations sits at a Semi level with no exception: off the ladder. The scanner subnet's exclusion (192.0.2.0/24) passed its review date in October. breakglass02 isn't in the identity exclusions. WKS-R3-01 runs a sensor below 10.8470. Step 3: (Get-Content config/ladder.json | ConvertFrom-Json).allowed | Format-List. Expected result: signals 3 users, 1 emergency access account; automation 1 group off the ladder, 1 lapsed exclusion, 1 emergency access account not excluded, 1 device below the sensor version. Delete out when you're done.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 2–3",
    },
    {
      part: "How", title: "Lab 2: signals live, automation from exports",
      body: [
        { steps: [
          { title: "Sign in and run the signals check", text: "Connect-MgGraph -Environment Global with ThreatHunting.Read.All; ./Invoke-XdrSignals.ps1 -SettingsPath <settings-file>" },
          { title: "Export the two portal pages to the template columns", text: "Device groups: name, rank, level, kind. Automated response: each Identities and Devices exclusion, with approver and review date" },
          { title: "Run the automation check", text: "./Invoke-XdrAutomation.ps1 -SettingsPath <settings-file>" },
          { title: "Back it out", text: "Nothing changed: Disconnect-MgGraph" },
        ], pt: 13.5 },
        { callout: "in a quiet test tenant the query may return no rows, and the check fails: no identity alert met an endpoint alert this week. Check sensor health in Settings, Identities.", label: "Read it: ", icon: "FaLightbulb", color: "teal" },
      ],
      sources: "Sources: Learn, attack disruption exclusions. Chapter 07, “Lab 2: a test tenant.”",
      say: `Lab 2 uses a test tenant, never production, with Defender for Identity on at least one test domain controller. Sign in and run the signals check. In a quiet test tenant the query may return no rows, and the check fails: that says no identity or cloud-app alert met an endpoint alert this week, not that the sensors are broken; check sensor health in the Identities settings. Then copy the two portal pages into the template columns: the device groups, and the automated response exclusions with their approvers and review dates. Run the automation check. Nothing changed, so you just sign out.`,
      detail: `Use a test tenant, never production, with Defender for Identity on at least one test domain controller, as the guide's G8 describes. Placeholders: <tenant-id>, <settings-file> (with inputs.deviceGroups and inputs.automationExclusions naming the exports you make in step 2), and <output-folder>. 1 Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes ThreatHunting.Read.All; ./Invoke-XdrSignals.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/signals. 2 In the Defender portal: Settings > Endpoints > Device groups into templates/device-groups.csv's columns, with the kind; Settings > Microsoft Defender XDR > Automated response, each Identities and Devices exclusion into templates/automation-exclusions.csv's columns. 3 ./Invoke-XdrAutomation.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/automation. 4 Disconnect-MgGraph. Not run by the authors.`,
      cite: ["xdr07-exclusions"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.4, 2.6, 2.15, 2.0], rows: [
          ["Identity and cloud-app alerts correlate with the endpoint's (priority.csv)", "SI-4, AU-6 (3)", "MLA-OSM, MLA-RVL", "SOC lead"],
          ["Emergency access accounts flagged for a person", "AC-2 (12)", "MLA-OSM", "IR lead"],
          ["Each device group's level matches the ladder (groups.csv)", "IR-4 (1), SI-4 (7)", "INR-RIR", "SOC lead, platform owner"],
          ["Exclusions approved and reviewed; emergency accounts excluded", "IR-4 (1)", "INR-RIR", "AO's register"],
        ] }, pt: 12.5 },
        { lead: "The pairs are the guide's G8 and G9 rows. The kit's records support these controls; the assessor decides them." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5; FedRAMP, Key Security Indicators. Chapter 07, “Federal requirements and evidence.”",
      say: `Here's what these gates prove, against NIST's catalog. Identity and cloud-app alerts correlating with the endpoint's supports system monitoring and correlating audit repositories. Emergency access accounts flagged for a person supports account monitoring. Each device group's level matching the ladder supports automated incident handling and automated response. And exclusions approved and reviewed, with every emergency account excluded, supports automated incident handling done safely. The indicators are FedRAMP's, as the guide maps them. The records support these controls; the assessor decides them.`,
      detail: `Identity and cloud-app alerts correlate with the endpoint's, by user (priority.csv): SI-4, AU-6 (3); KSI-MLA-OSM, KSI-MLA-RVL; the SOC lead, weekly. Emergency access accounts flagged for a person (priority.csv, EmergencyAccess): AC-2 (12); KSI-MLA-OSM; the IR lead. Each device group's automation level matches the ladder (groups.csv): IR-4 (1), SI-4 (7); KSI-INR-RIR; the SOC lead with the platform owner. Exclusions approved and reviewed; emergency accounts excluded (exclusions.csv): IR-4 (1); KSI-INR-RIR; the authorizing official's register, quarterly. The pairs are the guide's G8 and G9 rows.`,
      cite: [],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.9, 3.9, 4.35], rows: [
          ["Attack disruption contains an emergency account", "Lockout during the incident", "Every emergency account an identity exclusion"],
          ["A server group at Full", "A server remediated or isolated without a person", "The ladder allows servers only Semi"],
          ["An exclusion nobody reviews", "Protection quietly withdrawn", "A review date ahead is required"],
          ["An old sensor", "Contain User does nothing", "sensor.csv"],
          ["The identity sensors stop", "The query goes quiet and looks calm", "No source beyond the endpoint fails"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, attack disruption exclusions; configure attack disruption. Chapter 07, “Dangers.”",
      say: `What breaks in production? Attack disruption containing an emergency access account locks you out during the incident; every emergency account must be excluded. A server group at full means a server remediated or isolated without a person; the ladder allows servers only semi levels. An exclusion nobody reviews quietly withdraws protection; a review date ahead is required. An old sensor means Contain User does nothing. And when the identity sensors stop, the query goes quiet and looks calm, so no source beyond the endpoint is a failure.`,
      detail: `Attack disruption contains an emergency access account: lockout during the incident; guard: every emergency account must be an identity exclusion. A server group at Full: a server remediated or isolated without a person; guard: the ladder allows servers only Semi levels. An exclusion nobody reviews: protection quietly withdrawn; guard: a review date ahead is required. An old sensor: Contain User does nothing; guard: sensor.csv. The identity sensors stop: the cross-source query goes quiet and looks calm; guard: no source beyond the endpoint fails the check.`,
      cite: ["xdr07-exclusions", "xdr07-disruption"],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { cols: [[{ bullets: [
          "The cross-source query names an identity or cloud-app source each week",
          "Every emergency access account in the settings is an identity exclusion",
        ], label: "Signals and accounts", color: "navy", pt: 13.5 }], [{ bullets: [
          "Every device group is at the ladder's level, or has an exception ID",
          "Every exclusion has an approver and a review date ahead",
          "Every device runs a sensor at or above the Contain User minimum",
        ], label: "Automation", color: "teal", pt: 13.5 }]] },
        { callout: "Chapter 08, The Monthly Evidence Run, runs every check in one command and records them for the ISSO.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 07, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. The cross-source query names at least one identity or cloud-app source each week. Every emergency access account in the settings is an identity exclusion. Every device group is at the ladder's level, or has an exception. Every exclusion has an approver and a review date ahead. And every device runs a sensor at or above the Contain User minimum. Next, Chapter 8 runs every check in one command, computes the guide's metrics, and records it all for the security officer. Thanks for watching.`,
      detail: `Checklist: The cross-source query names at least one identity or cloud-app source each week. Every emergency access account in the settings is an identity exclusion. Every device group is at the ladder's level, or has an exception ID. Every exclusion has an approver and a review date ahead. Every device runs a sensor at or above the Contain User minimum. Next: Chapter 08 — The Monthly Evidence Run.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
