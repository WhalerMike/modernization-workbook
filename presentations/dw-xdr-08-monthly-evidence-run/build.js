// Building Defender XDR, Chapter 08 — The Monthly Evidence Run: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/defender-xdr/08-the-monthly-evidence-run.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-xdr-08-monthly-evidence-run/build.js
require("../_build/devwb.js")({
  workbook: "xdr", chapter: 8, dir: __dirname,
  base: "DW_XDR_08_Monthly_Evidence_Run",
  title: "The Monthly Evidence Run",
  map: "Measure what the controls do · the guide's run · what it leaves · the run, the metrics, the record · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building Defender XDR, a developer workbook in the Federal Modernization Workbook. This is Chapter 8: the monthly evidence run. The metrics measure what the controls do, not whether a setting exists, and the evidence is a chain a security officer can check with one command. We'll start from the guide's monthly run, read the one command that replaces it, the metrics and the evidence record, and walk two labs, including one where we change a recorded file and watch the check catch it. The chapter has been reviewed and approved; the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's G10 Operations and evidence, its metrics and its evidence catalog. You start with the guide's monthly evidence run, a loop of queries and a SHA256SUMS.csv, and what it leaves to you. Then you read the monthly run, the metrics and the evidence record. Lab 1 runs the month on fixtures, reads the metrics, checks the chain, runs a stage's go/no-go and changes a file to watch the check fail. Lab 2 runs the month in a test tenant.`,
      cite: [],
      ref: "Opening; “In this chapter”",
    },
    {
      part: "Why", title: "Why the month needs one command and a chain",
      body: [
        { lead: "Measure what the controls do, not whether a setting exists; and keep evidence the ISSO can verify alone." },
        { cols: [[{ bullets: [
          "Produce the month's evidence package in one command",
          "Read the guide's metrics from it",
          "Show the ISSO it hasn't changed since",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who maintain the kit",
          "The platform owner who owns the run",
          "The ISSO who receives the package",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 08, opening, “Goal and audience.”",
      say: `Why one command, and why a chain? Because the guide's metrics measure what the controls actually do, not whether a setting exists, and those numbers have to come from the month's real runs. And because evidence the security officer can't verify alone is just a folder of files. By the end of this chapter you can produce the month's evidence package in one command, read the guide's metrics from it, and show the security officer it hasn't changed since. It's for the developers, the platform owner who owns the run, and the security officer who receives it.`,
      detail: `Goal: by the end of this chapter you can produce the month's evidence package in one command, read the guide's metrics from it, and show the ISSO it hasn't changed since. Audience: developers who maintain the kit, the platform owner who owns the run, and the ISSO who receives the package. The reporting rhythm and the metric set are Book 12's Chapter 12 (Security Operations, Evidence, Metrics and Continuous Monitoring). You should have run every earlier chapter's Lab 1.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "Why", title: "What the guide's monthly run gives you",
      body: [
        { steps: [
          { title: "Connect", text: "SecurityIncident.Read.All and ThreatHunting.Read.All, in the Global environment" },
          { title: "Three hunting queries into JSON files", text: "Coverage, ASR and prevention" },
          { title: "The month's incidents", text: "Get-MgSecurityIncident filtered on createdDateTime, which Learn lists as filterable" },
          { title: "Hash the folder", text: "SHA256SUMS.csv; next month's re-hash must match" },
        ], pt: 13.5 },
        { callout: "seven metric formulas, and an evidence catalog with each artifact's kind, gate and retention (program design).", label: "Also in the guide: ", icon: "FaTableList", color: "teal" },
      ],
      sources: "Sources: Learn, List incidents; runHuntingQuery. Chapter 08, “What the guide gives you.”",
      say: `Here's the guide's monthly run. Connect with the two read scopes. Run three hunting queries, coverage, attack surface reduction and prevention, into JSON files. Export the month's incidents, filtered on created date time, which Learn lists as filterable. And hash the folder, so a re-hash next month must match. The guide also gives seven metric formulas, and an evidence catalog with each artifact's kind, gate and retention, which are the program's design.`,
      detail: `The guide's monthly run connects with SecurityIncident.Read.All and ThreatHunting.Read.All, runs three hunting queries (coverage, ASR, prevention) into JSON files, exports the month's incidents with Get-MgSecurityIncident -Filter "createdDateTime ge ...", and hashes the folder into SHA256SUMS.csv. Its metrics table gives seven formulas, and its evidence catalog gives each artifact's kind, gate and retention (program design). Its Validate step: a re-hash next month matches, and the quarter's exercise raised the expected incident for each synthetic event.`,
      cite: ["xdr08-incidents", "xdr08-hunting"],
      ref: "“Start with Microsoft Learn's commands” — “What the guide gives you”",
    },
    {
      part: "What", title: "What the guide's run leaves to you",
      body: [
        { table: { head: ["The run gives", "Why it isn't enough", "What the kit adds"], w: [3.0, 4.3, 4.85], rows: [
          ["Three queries and an export", "Gates 1 and 4 to 9 have their own checks", "Every check into its own folder, with a manifest"],
          ["A hash list", "It can be regenerated after an edit", "Each record holds the hash of the one before"],
          ["Files with no controls named", "The ISSO maps them by hand", "Each record names its steps, controls and KSIs"],
          ["—", "A run with five tickets hashes as cleanly as one with none", "The run's own check result; the go/no-go fails until closed"],
          ["Seven formulas", "Someone computes them by hand", "metrics.md from the run folders, with sources"],
          ["Mean time to triage and contain", "Graph has no assignment or containment time", "Not computed, with where to get it"],
        ] }, pt: 11.5 },
        { lead: "Verdict: keep the guide's run as the floor; build the chain and the record." },
      ],
      sources: "Sources: examples/defender-xdr tests/Evidence.Tests.ps1. Chapter 08, “What it leaves to you,” “The verdict.”",
      say: `What does that leave to you? Seven gates' checks aren't in it, so the kit runs every check into its own folder with a manifest. A hash list can be regenerated after an edit, so each record holds the hash of the one before. Files don't name their controls, so each record does. A run that found five tickets hashes as cleanly as one that found none, so each record carries the run's own result, and the go or no-go fails until the findings close. Someone computes the metrics by hand, so the kit writes them. And Graph carries no assignment or containment time, so mean time to triage is reported as not computed, with where to get it.`,
      detail: `Each row is pinned by a test in tests/Evidence.Tests.ps1. Three queries and an incident export: every check, each into its own folder with a manifest. A hash list: each record holds the hash of the one before; removing or changing one breaks the chain. Files with no controls named: each record names its steps, their controls and KSIs, and the claim language. A run that found five tickets hashes as cleanly as one that found none: the run's own check result is in the record; the stage go/no-go fails until the findings are closed. Seven metric formulas: metrics.md from the run folders, with where each value came from. Mean time to triage and to contain: Graph's incident has no time of first assignment or containment; reported as not computed, with where to get it.`,
      cite: [],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "The run, the metrics and the record",
      body: [
        { cols: [[{ bullets: [
          "Invoke-XdrMonthlyRun.ps1: access, coverage, prevention, ASR, exposure, incidents, detections, signals, automation, each into <RunRoot>/<task>",
          "Then the metrics; with -EvidencePath, every folder recorded",
          "A check that throws is an Error row; the others still run",
        ], label: "The run", color: "navy", pt: 13 }], [{ bullets: [
          "Time, environment, mode, change record, command",
          "Integrity result and the run's own check result",
          "Steps with controls and KSIs; the claim",
          "Every file's SHA-256 and the previous record's",
        ], label: "Each record", color: "teal", pt: 13 }]] },
        { callout: "-Check re-hashes everything and walks the chain; -Check -Stage adds a row per step the stage needs, passing only with intact files and a passing check.", label: "The check: ", icon: "FaFingerprint", color: "amber" },
      ],
      sources: "Sources: examples/defender-xdr (Invoke-XdrRunAll, Invoke-XdrMetrics, Write-XdrEvidence, Test-XdrEvidence). Chapter 08, “The code.”",
      say: `One command runs every check from Chapters 1 to 7, each into its own folder, then the metrics, and with an evidence path, records every folder. A check that throws, a missing input or a refused session, is an error row, and the others still run. Each record holds the time, the environment, the change record, the command, two results, the files' integrity and the run's own check, the steps with their controls and indicators, the claim, every file's hash, and the previous record's hash. The check re-hashes everything and walks the chain. With a stage, it adds a row per step, which passes only with intact files and a passing check.`,
      detail: `Invoke-XdrMonthlyRun.ps1 (Invoke-XdrRunAll) runs access, coverage, prevention, ASR, exposure, incidents, detections, signals and automation into <RunRoot>/<task>, then the metrics into <RunRoot>/metrics, and with -EvidencePath records each folder. A check that throws (a missing input, a refused session) is an Error row; the others still run. Invoke-XdrEvidence.ps1 (Write-XdrEvidence) checks a run folder against its manifest, copies it to runs/<NNNN>-<task>, and writes records/<NNNN>-<task>.json: time, environment, mode, change record, command, the integrity result, the run's own check result, the steps with their controls and KSIs, the claim, every file's SHA-256 and the previous record's SHA-256. It appends records.csv and rewrites SHA256SUMS, which sha256sum -c reads. -Check re-hashes everything and walks the chain; -Check -Stage test or production adds a row per step the stage needs (config/requirements.json), passing only when a record covers it with intact files and a passing check.`,
      cite: [],
      ref: "“The code”",
    },
    {
      part: "What", title: "The metrics, and where each comes from",
      body: [
        { table: { head: ["Metric", "From"], w: [4.6, 7.55], rows: [
          ["Protected coverage; exception exposure", "coverage/summary.json"],
          ["Enforcement depth", "asr/summary.json and the onboarded count"],
          ["Prevention effectiveness", "prevention (7 days) and ASR (30 days, scaled to a week), per 1,000 onboarded devices"],
          ["Expired ASR exclusions", "asr/summary.json"],
          ["Mean time to triage and to contain", "Not computed: the ticketing system or the Action center history"],
          ["Detection validity", "detections/summary.json"],
          ["Synthetic-event success", "The quarter's exercise record"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: examples/defender-xdr (Invoke-XdrMetrics.ps1). Chapter 08, “The metrics.”",
      say: `Here's where each metric comes from. Protected coverage and exception exposure, from the coverage run. Enforcement depth, devices with every applicable rule in block, from the A S R run against the onboarded count. Prevention effectiveness, blocks per thousand onboarded devices per week, from the prevention events and the A S R events scaled to a week. Expired exclusions. Detection validity, from the detection run. And synthetic-event success, from the quarter's exercise record. Mean time to triage and to contain isn't computed: the kit says to take it from the ticketing system or the Action center history.`,
      detail: `Invoke-XdrMetrics.ps1 reads the run folders' summary.json files: protected coverage (coverage/summary.json); exception exposure (coverage/summary.json); enforcement depth (asr/summary.json, devices with every applicable rule in block, and the onboarded count); prevention effectiveness (prevention/summary.json, 7 days, and asr/raw/asr-events.json, 30 days scaled to a week, per 1,000 onboarded devices); expired ASR exclusions (asr/summary.json); mean time to triage and to contain (not computed: from the ticketing system or the Action center history); detection validity (detections/summary.json); synthetic-event success (the exercise record, inputs.exercise).`,
      cite: [],
      ref: "“The metrics”",
    },
    {
      part: "Who", title: "Who runs it, who receives it",
      body: [
        { cards: [
          { title: "Platform owner", text: "Owns the run: monthly, with the change record; the exercise each quarter", color: "navy" },
          { title: "ISSO", text: "Receives metrics.md and SHA256SUMS; re-checks last month's folder this month", color: "teal" },
          { title: "SOC lead", text: "Runs the quarter's synthetic events and files the exercise record", color: "amber" },
        ], pt: 13.5 },
        { callout: "the fixtures carry deliberate faults, so most runs record a failed check and the go/no-go fails. Evidence of a finding is still evidence, but it isn't a go.", label: "Illustrative code: ", icon: "FaFileShield", color: "red" },
      ],
      sources: "Sources: Chapter 08, “Goal and audience,” the “Illustrative code” callout; the guide, G10.",
      say: `Who's involved? The platform owner owns the run, monthly, with the change record. The security officer receives the metrics and the hash file, and re-checks last month's folder this month. The security operations lead runs the quarter's synthetic events and files the exercise record. One caution about Lab 1: the fixtures carry deliberate faults, so most runs record a failed check, and the go or no-go fails. That's the point. Evidence of a finding is still evidence, but it isn't a go.`,
      detail: `Audience: developers who maintain the kit, the platform owner who owns the run, and the ISSO who receives the package. The guide's G10: the platform owner owns the run; the ISSO receives the package; a quarterly exercise. Illustrative code: Lab 1's fixtures carry deliberate faults, so most runs record a failed check, and the go/no-go fails. That is the point: evidence of a finding is still evidence, but it isn't a go. Keep the evidence folder on agency storage with the access the ISSO sets.`,
      cite: [],
      ref: "“Goal and audience”; the “Illustrative code” callout",
    },
    {
      part: "How", title: "Lab 1: run the month, read the metrics",
      body: [
        { cols: [[{ terminal: "08-1", lines: "4-13", pt: 10.5 }], [{ terminal: "08-2", lines: "7-9,11,13-14", pt: 10 }]], split: 0.32 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 08, “Lab 1: fixtures, no tenant,” steps 1–2.",
      say: `Lab 1, in the kit's folder. Step 1 runs the month and records every run, with a lab change record. Ten run folders, ten records. Only signals and the metrics pass their own checks; every other run found something, as the earlier chapters showed. Step 2 reads the metrics. Protected coverage, sixty-four point three percent. Two of eleven onboarded devices have every rule in block. One of one enabled detection has a passing test. Four of five synthetic events did what they should. And mean time to triage says not computed, and why.`,
      detail: `Work in examples/defender-xdr. Step 1: ./Invoke-XdrMonthlyRun.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -RunRoot out/month -EvidencePath out/evidence -AsOf 2026-11-16T12:00:00Z -ChangeRecord CHG-LAB-0001. Ten run folders, ten records; only signals and the metrics pass their own checks. Step 2: Get-Content out/month/metrics/metrics.md. Protected coverage 64.3 percent; enforcement depth 2 of 11; prevention effectiveness 1,275.8 blocks per 1,000 devices per week (a small fictional fleet); expired ASR exclusions 1; detection validity 1 of 1; synthetic-event success 4 of 5; mean time to triage and to contain not computed. The slide's metrics lines are cut to the window's width.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the records, the chain, the go/no-go",
      body: [
        { cols: [[{ terminal: "08-3", lines: "1-13", pt: 10 }, { terminal: "08-4", pt: 10 }], [{ terminal: "08-5", lines: "1-8,15-17", pt: 10 }]], split: 0.52 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 08, “Lab 1: fixtures, no tenant,” steps 3–5.",
      say: `Step 3 reads the records' index. Result is the files' integrity, and every record passes. Check result is what the run found, and most fail. Step 4 checks the chain: every file matches its hash, ten records, chain unbroken. Step 5 runs the production stage's go or no-go, and it fails, saying why for each step: no pre-flight record, runs whose own checks failed, and no scheduled run yet. Only signals and the metrics pass. The command exits with an error, which is what a go or no-go should see.`,
      detail: `Step 3: Import-Csv out/evidence/records.csv | Format-Table sequence, task, result, checkResult, controls -AutoSize. result is the files' integrity; checkResult is what the run found. Step 4: ./Invoke-XdrEvidence.ps1 -EvidencePath out/evidence -Check: SUMS Pass, 86 files match SHA256SUMS; CHAIN Pass, 10 records, chain unbroken. Step 5: ./Invoke-XdrEvidence.ps1 -EvidencePath out/evidence -Check -Stage production: STEP-PRE no record; STEP-ACCESS and the others recorded, but the run's own check failed; STEP-SIGNALS and STEP-METRICS pass; STEP-RUN no record; exit code 1 (the slide leaves out some step rows).`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 3–5",
    },
    {
      part: "How", title: "Lab 1: change a recorded file; run the tests",
      body: [
        { terminal: "08-6", pt: 11 },
        { cols: [[{ terminal: "08-7", pt: 11 }], [{ bullets: [
          "Both checks fail, and name tickets.csv",
          "Before step 6, a folder whose SHA256SUMS you could hand to the ISSO",
          "Delete out when you're done",
        ], label: "Expected result", color: "navy", pt: 13.5 }]], split: 0.45 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures; tests). Chapter 08, “Lab 1: fixtures, no tenant,” steps 6–7.",
      say: `Step 6 is the one to remember. Append one line to a recorded tickets file, and check again. Both checks fail. The sums say the file changed, and the chain says it no longer matches its record, naming the file. That's what protects the evidence from an edit after the fact. Step 7 runs the evidence tests: all pass, none fail. Before step 6, you had a folder whose hash file you could hand to the security officer. Delete the output folder when you're done.`,
      detail: `Step 6: Add-Content -Path out/evidence/runs/0002-coverage/tickets.csv -Value '"edited after it was recorded"'; ./Invoke-XdrEvidence.ps1 -EvidencePath out/evidence -Check. SUMS Fail, runs/0002-coverage/tickets.csv changed; CHAIN Fail, runs/0002-coverage/tickets.csv doesn't match 0002-coverage.json; exit code 1. Step 7: Invoke-Pester -Path tests/Evidence.Tests.ps1 -Output None -PassThru | Select-Object PassedCount, FailedCount: FailedCount 0. Delete out when you're done: Remove-Item -Recurse -Force out.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 6–7; expected result",
    },
    {
      part: "How", title: "Lab 2: the month in a test tenant",
      body: [
        { steps: [
          { title: "Sign in with the read scopes", text: "Connect-MgGraph -Environment Global with SecurityIncident.Read.All, ThreatHunting.Read.All, CustomDetection.Read.All" },
          { title: "Run the month and check it", text: "./Invoke-XdrMonthlyRun.ps1 -SettingsPath <settings-file> -RunRoot <output-folder>/month -EvidencePath <output-folder>/evidence -ChangeRecord <change-record>; then -Check" },
          { title: "Hand it over", text: "metrics.md and SHA256SUMS to the ISSO; next month, re-run -Check: last month's files must still match" },
          { title: "Back it out", text: "Nothing changed in the tenant; the evidence stays with its change record: Disconnect-MgGraph" },
        ], pt: 13 },
        { callout: "a test tenant, never production, with every earlier chapter's Lab 2 inputs named in the settings; the evidence on agency storage.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, List incidents; runHuntingQuery. Chapter 08, “Lab 2: a test tenant.”",
      say: `Lab 2 uses a test tenant, never production, with every earlier chapter's Lab 2 inputs named in your settings file. Sign in with the read scopes. Run the month with an evidence path on agency storage and the change record, then check it. Give the metrics and the hash file to the security officer. Next month, run the check again on this month's folder: last month's files must still match. Nothing changed in the tenant, and the evidence stays with its change record, so you just sign out.`,
      detail: `Use a test tenant, never production, with every earlier chapter's Lab 2 inputs named in your settings file. Placeholders: <tenant-id>, <settings-file>, <output-folder> (on agency storage) and <change-record>. 1 Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All,CustomDetection.Read.All; ./Invoke-XdrMonthlyRun.ps1 -SettingsPath <settings-file> -RunRoot <output-folder>/month -EvidencePath <output-folder>/evidence -ChangeRecord <change-record>; ./Invoke-XdrEvidence.ps1 -EvidencePath <output-folder>/evidence -Check. Give metrics.md and SHA256SUMS to the ISSO. 2 Disconnect-MgGraph. Not run by the authors.`,
      cite: ["xdr08-incidents", "xdr08-hunting"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.4, 2.3, 2.45, 2.0], rows: [
          ["The month's metrics, from the month's runs (metrics.md)", "CA-7", "MLA-EVC", "Platform owner; ISSO"],
          ["Each run recorded with controls, KSIs, check result and hashes", "CA-7, AU-9", "MLA-EVC, MLA-OSM", "ISSO"],
          ["Kept and unchanged (SHA256SUMS, -Check)", "AU-9, AU-11", "MLA-OSM, MLA-EVC", "ISSO, to the catalog's retention"],
          ["The exercise's synthetic events", "IR-3", "INR-AAR", "SOC lead, quarterly"],
        ] }, pt: 12.5 },
        { lead: "The pairs are the guide's G10 row. Each record carries the claim: it supports the controls; the assessor decides." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5 OSCAL catalog 5.2.0; FedRAMP, Key Security Indicators. Chapter 08, “Verified facts,” “Federal requirements.”",
      say: `Here's what this gate proves, against NIST's catalog. The month's metrics, from the month's runs, support continuous monitoring. Each run recorded with its controls, indicators, check result and hashes supports continuous monitoring and protecting audit information. Kept and unchanged supports audit protection and retention. And the exercise's synthetic events support incident response testing. The indicators are FedRAMP's, as the guide maps them. Each record carries the claim itself: it supports the controls, and the assessor decides them.`,
      detail: `The month's metrics, from the month's runs (metrics.md, metrics.json): CA-7; KSI-MLA-EVC; the platform owner, the ISSO receives it. Each run recorded with its controls, KSIs, check result and hashes (records/, records.csv): CA-7, AU-9; KSI-MLA-EVC, KSI-MLA-OSM; the ISSO. Kept and unchanged (SHA256SUMS, -Check): AU-9, AU-11; KSI-MLA-OSM, KSI-MLA-EVC; the ISSO, to the evidence catalog's retention. The exercise's synthetic events (Synthetic-event success): IR-3; KSI-INR-AAR; the SOC lead, quarterly. Control titles from NIST's OSCAL catalog (release 5.2.0); the KSI pairs are the guide's, carried from the Security Operations and Devices books. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them.`,
      cite: ["xdr08-oscal", "xdr08-ksi"],
      ref: "“Verified facts”; “Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.9, 3.9, 4.35], rows: [
          ["A run with findings read as evidence of a control", "A go on a fleet with gaps", "checkResult; the go/no-go fails until the run passes"],
          ["A file edited after recording", "The evidence no longer shows what was read", "SHA256SUMS and record hashes; -Check names it"],
          ["A record removed", "A bad month disappears", "The chain"],
          ["Advanced hunting asked for last quarter", "It keeps 30 days", "The run files results every month"],
          ["A metric from a field that doesn't hold it", "A number that misleads", "Not computed, with where it lives"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: examples/defender-xdr (Write-XdrEvidence, Test-XdrEvidence, Invoke-XdrMetrics). Chapter 08, “Dangers.”",
      say: `What breaks in production? A run with findings read as evidence of a control leads to a go on a fleet with gaps; the check result in every record, and a go or no-go that fails until the run passes, guard it. A file edited after recording is caught by the hashes, by name. A removed record breaks the chain. Advanced hunting only keeps thirty days, so the run files results every month. And a metric computed from a field that doesn't hold it is a misleading number, so the kit says not computed, and where the number lives.`,
      detail: `A run with findings read as evidence of a control: a go on a fleet with gaps; guard: checkResult in every record; the go/no-go fails until the run passes. A file edited after recording: the evidence no longer shows what was read; guard: SHA256SUMS and each record's hashes; -Check names the file. A record removed: a bad month disappears; guard: the chain. Advanced hunting asked for last quarter: it keeps 30 days; guard: the monthly run files the results every month. A metric computed from a field that doesn't hold it: a number that misleads; guard: not computed, with where the number lives.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { cols: [[{ bullets: [
          "The monthly run is scheduled (Chapter 09) and runs with the change record",
          "metrics.md reaches the ISSO each month",
        ], label: "The run", color: "navy", pt: 13.5 }], [{ bullets: [
          "-Check passes on last month's folder this month",
          "The quarter's exercise record is named in the settings",
          "The evidence folder is on agency storage, kept to the catalog's retention",
        ], label: "The evidence", color: "teal", pt: 13.5 }]] },
        { callout: "Chapter 09, Deploying to Test and Production, schedules this run and takes the kit live, test first.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 08, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. The monthly run is scheduled and runs with the change record. The metrics reach the security officer each month. The check passes on last month's folder this month. The quarter's exercise record is named in the settings. And the evidence folder is on agency storage, kept to the evidence catalog's retention. Next, Chapter 9 schedules this run and takes the kit live, test first, then production. Thanks for watching.`,
      detail: `Checklist: The monthly run is scheduled (Chapter 09) and runs with the change record. metrics.md reaches the ISSO each month. Invoke-XdrEvidence.ps1 -Check passes on last month's folder this month. The quarter's exercise record is named in the settings. The evidence folder is on agency storage, kept to the catalog's retention. Next: Chapter 09 — Deploying to Test and Production.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
