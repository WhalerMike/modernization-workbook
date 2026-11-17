// Building Global Secure Access, Chapter 08 — Rings, Metrics and the Evidence Package: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/global-secure-access/08-rings-metrics-and-evidence.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-gsa-08-rings-metrics-evidence/build.js
require("../_build/devwb.js")({
  workbook: "gsa", chapter: 8, dir: __dirname,
  base: "DW_GSA_08_Rings_Metrics_Evidence",
  title: "Rings, Metrics and the Evidence Package",
  map: "Why rings exit on numbers · what Learn and the guide give · metrics and ring exit · rollback · evidence and the closure register · who · two labs · dangers",
  slides: [
    {
      say: `Welcome back to Building Global Secure Access. This is Chapter 8: rings, metrics, and the evidence package. A ring exits on numbers, not on a quiet week. This chapter computes the guide's numbers, says go or no-go, writes the rollback before it's needed, and hands the security officer a package an assessor can re-hash. The chapter is a draft awaiting review, and the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's Step 11, Coexistence and migration, its Step 12, Telemetry and evidence, its metrics, rollback order and evidence catalog. The telemetry checks GSA-LOG-01 to -03, Get-GsaMetrics, Test-GsaRingExit, New-GsaRollbackPlan and the evidence records. Lab 1 says No-go for the pilot, with the five reasons, and Go for ring 1 two weeks later, plans ring 1's rollback without sending it, and records the runs as evidence. Lab 2 does the same in a test tenant.`,
      cite: ["gsa08-dg"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why a ring exits on numbers",
      body: [
        { lead: "A ring exits on numbers, not on a quiet week." },
        { cols: [[{ bullets: [
          "Decide a ring's exit from **measured values**",
          "Roll back in the guide's order from a plan a reviewer approved",
          "Give the ISSO and the assessor **one evidence folder**, with the controls and KSIs each run supports, every file verifiable",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who build or maintain the kit",
          "The technical program manager who runs the rings",
          "The security monitor",
          "The ISSO",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 08, opening, “Goal and audience.”",
      say: `Why numbers? Because a ring that exits on the calendar carries its problems to a larger group: users the client doesn't cover, policies that would block people the service carries, a certificate about to expire. So the goal: decide each ring's exit from measured values; roll back in the guide's order from a plan a reviewer approved, written before it's needed; and give the security officer and the assessor one evidence folder, with the controls and indicators each run supports, where every file can be verified. It's for the developers, the program manager who runs the rings, the security monitor, and the security officer.`,
      detail: `Goal: decide a ring's exit from measured values, roll back in the guide's order from a plan a reviewer approved, and give the ISSO and the assessor one evidence folder, with the controls and KSIs each run supports, whose every file they can verify. Audience: developers who build or maintain the kit, the technical program manager who runs the rings, the security monitor, and the ISSO.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "What", title: "What Learn and the guide give you",
      body: [
        { table: { head: ["Source", "What it says"], w: [3.4, 8.75], rows: [
          ["Learn: logs", "Traffic and remote network health logs kept 30 days; four tables; a sudden traffic drop is an alert"],
          ["Learn: deployment guide", "A rollback plan that defines the circumstances and procedures"],
          ["Learn: operations", "A RACI; at least two people per role"],
          ["The guide", "Rings and exit criteria; metrics with starting targets; the rollback order, signaling last"],
          ["CISA TIC 3.0 Remote User", "Visibility “must be preserved through telemetry sharing”"],
        ] }, pt: 13 },
        { callout: "the Zero Trust Assessment results kit already builds the closure register, and its network-access family points at the guide. This chapter's evidence folder is that register's ready-for-closure evidence.", label: "Reused: ", icon: "FaRightLeft", color: "teal" },
      ],
      sources: "Sources: Learn, logs; security operations; deployment guide; operations guide; CISA TIC 3.0 Remote User Use Case. Chapter 08, “Start with.”",
      say: `Learn says traffic and remote network health logs stay thirty days, names the four tables, and says a sudden drop in traffic volume is an alert, because offboarding has no audit signal. Its deployment guide asks for a rollback plan, and its operations guide for at least two people per role. The guide adds the rings, the metrics and the rollback order, with signaling last. And CISA's remote user use case says visibility must be preserved through telemetry sharing. One thing isn't rebuilt: the Zero Trust Assessment results kit already turns an assessment into the closure register, and its network family points at the guide. This chapter's evidence is what that register cites.`,
      detail: `Traffic and remote network health logs stay in the service for 30 days; Learn's security operations page lists the four tables (NetworkAccessTraffic, NetworkAccessConnectionEvents, RemoteNetworkHealthLogs, NetworkAccessAlerts) and says to treat a sudden drop in traffic volume as an alert, since tenant offboarding has no audit signal. Learn's deployment guide asks for a rollback plan that "defines the circumstances and procedures" for removing the client or disabling a profile; its operations guide gives a RACI and at least two people per role. The guide adds the rings and their exit criteria, the metrics with starting targets, the rollback order (policies to report-only from Step 10 back to Step 5, profile links removed, tagging off, groups off the profiles, the VPN route restored, signaling last), and CISA's Remote User Use Case: as users connect more directly to external services, "visibility by CISA must be preserved through telemetry sharing." Reused: examples/zta-results turns an assessment export into the closure register of Book 11, Chapter 10; its network-access finding family names the guide as the remediation page; that register's ready-for-closure evidence for a network finding is this chapter's evidence folder.`,
      cite: ["gsa08-logs", "gsa08-secops", "gsa08-dg", "gsa08-ops", "gsa08-tic"],
      ref: "“Start with Microsoft's documentation”; “Reused, not rebuilt”",
    },
    {
      part: "What", title: "Eight metrics, eight exit criteria",
      body: [
        { cols: [[{ table: { head: ["Metric", "Target (lab)"], w: [3.6, 2.35], rows: [
          ["Client coverage", "98%"],
          ["Sign-ins through the service", "95%"],
          ["Compliant network enforced", "On"],
          ["PA least privilege", "0; 0; 0"],
          ["Connector resilience", "100%"],
          ["Bypass exposure", "0; 0"],
          ["TLS health", "<1%; >90 days"],
          ["Telemetry freshness", "0 stale tables"],
        ] }, pt: 11.5 }], [{ table: { head: ["Criterion", "From"], w: [1.6, 4.35], rows: [
          ["RX-01", "Business days in the ring (10, or 20 for rings 2–3)"],
          ["RX-02, -03", "Open Sev-2s; help desk against threshold"],
          ["RX-04", "Client on 100% of in-scope devices"],
          ["RX-05", "No report-only failure carried by the service"],
          ["RX-06", "TLS failures under 1%"],
          ["RX-07, -08", "Emergency exclusion tested at ring start; break-glass rehearsed"],
        ] }, pt: 11.5 }]] },
      ],
      sources: "Sources: examples/global-secure-access (Get-GsaMetrics, Test-GsaRingExit). Chapter 08, “The metrics and the ring exit”; guide, Metrics and Step 11.1.",
      say: `Here are the numbers. Eight metrics from one collection and the inputs: client coverage, sign-ins through the service, compliant network enforcement, Private Access least privilege, connector resilience, bypass exposure, TLS health, and telemetry freshness, each with a target from the settings. And eight exit criteria from the guide's ring table: business days in the ring, open severity-two tickets, help desk volume, the client on every in-scope device, clean report-only results, TLS failures under one percent, the emergency exclusion tested on the ring's start date, and break-glass rehearsed. The ring exits only if every criterion passes.`,
      detail: `Get-GsaMetrics: client coverage, activeDeviceCount ÷ inScopeDevices (98%); sign-ins through the service, seven days of the sign-in query (95%); compliant network enforcement, a NET-CN- policy enforced for the ring (On); Private Access least privilege, Quick Access segments, apps without a group, apps without a policy (0; 0; 0); connector resilience, groups with two active, current connectors ÷ groups (100%); bypass exposure, bypasses past expiry and exceptions without an approver (0; 0); TLS inspection health, failure share and days to certificate expiry (under 1%; over 90); telemetry freshness, tables with no rows in 24 hours (0). Test-GsaRingExit: RX-01 business days since the ring record's started (10 for the pilot and ring 1, 20 for rings 2 and 3); RX-02, RX-03 open Sev-2 tickets, help desk tickets against the agreed threshold; RX-04 client coverage at 100%; RX-05 no report-only failure carried by the service and no compliant network check failing; RX-06 TLS failure share under 1%; RX-07, RX-08 the emergency access exclusion tested on or after the ring's start; break-glass rehearsed.`,
      cite: [],
      ref: "“The code” — “The metrics and the ring exit”",
    },
    {
      part: "What", title: "The rollback plan and the evidence chain",
      body: [
        { cols: [[{ steps: [
          { title: "Policies to report-only", text: "Enforced NET- policies, Steps 10, 7, 6, 5" },
          { title: "Profile links; tagging off", text: "Links are portal steps; the TRv2 policy stays" },
          { title: "Groups off; VPN route back", text: "Portal; the agency's own change" },
          { title: "Signaling, last", text: "Only with -DisableSignaling, refused while a compliant network policy stays enforced" },
        ], pt: 12 }], [{ bullets: [
          "Each run copied with its manifest",
          "The steps' **controls and KSIs** from the guide's requirements table",
          "Every file's SHA-256 and the **previous record's**",
          "A check with a failure is **Findings**, not Pass",
          "sha256sum -c SHA256SUMS works; -Check -Stage says what's missing",
        ], label: "Write-GsaEvidence", color: "navy", pt: 12.5 }]], split: 0.5 },
      ],
      sources: "Sources: examples/global-secure-access (New-GsaRollbackPlan, Write-GsaEvidence). Chapter 08, “What it leaves to you,” “The evidence”; guide, Rollback.",
      say: `The rollback plan follows the guide's order. Enforced policies go to report-only, from Step 10 back to Step 5. Profile links come off, which is a portal step, and tagging goes off while the tenant restrictions policy stays. The groups come off the profiles and the VPN route comes back. Signaling is last, and only on request; the plan refuses it if a compliant network policy would stay enforced. The evidence chain copies each run with its manifest, adds its controls and indicators, every file's hash and the previous record's hash. A check with a failure is recorded as findings, not pass, and doesn't count toward a stage.`,
      detail: `New-GsaRollbackPlan, from a collection: the NET- Conditional Access policies that are enforced go to report-only (Steps 10, 7, 6 and 5's policies, in that order); the security profile links are removed (a portal step: no request on the pages read); tagging is disabled; the ring's groups come off the profile assignments (portal); the VPN route is restored (the agency's own change); and signaling is disabled last, only with -DisableSignaling, and only when no policy still depends on it. Write-GsaEvidence: records one run folder: checks its manifest, copies it under runs/, writes a record with the time, environment, tenant, ring, command, result, the steps it covers with their SP 800-53 controls and FedRAMP 20x KSIs, every file's SHA-256 and the SHA-256 of the record before it; appends records.csv and rewrites SHA256SUMS. A check whose findings include a failure is recorded with result Findings, not Pass, and doesn't count toward a stage. Example: a tls check is the TLS step (SC-8, SC-12, SC-17, SI-4; KSI-SVC-SIN, KSI-SVC-ASM, KSI-CNA-MAT) plus the evidence step (AU-9, AU-6; KSI-MLA-OSM, KSI-MLA-RVL).`,
      cite: [],
      ref: "“What it leaves to you”; “The evidence”",
    },
    {
      part: "Who", title: "Who runs rings, watches logs, keeps evidence",
      body: [
        { cols: [[{ bullets: [
          "**Technical program manager**: runs the waves; the ring record",
          "**Service owner**: approves each ring's exit",
          "**Security monitor**: freshness, the CISA path with the TIC delegates",
          "**ISSO**: the evidence folder, inside the boundary",
          "**Assessor or AO**: decides each finding's closure",
        ], label: "Roles", color: "teal", pt: 13.5 }], [{ bullets: [
          "Learn: at least two people per role",
          "The reads of Chapter 02, and the workspace",
          "No writes unless a rollback is applied with its hash",
        ], label: "And", color: "navy", pt: 13.5 }]] },
      ],
      sources: "Sources: Learn, operations guide. Chapter 08, “Federal requirements”; guide, RACI and Step 11.",
      say: `Who does this? The technical program manager runs the waves and keeps the ring record. The service owner approves each ring's exit. The security monitor watches freshness and agrees the CISA telemetry path with the TIC delegates. The security officer keeps the evidence folder, inside the boundary. And the assessor or authorizing official decides each finding's closure: the kit only says the evidence is ready. Learn's advice is at least two people per role. The reads are Chapter 2's, plus the workspace, and nothing writes unless a rollback is applied with its approved hash.`,
      detail: `Evidence owners (Chapter 08): the network tables are fresh and the CISA path is agreed (the security monitor); each ring exited on its recorded criteria (the technical program manager; the service owner approves); a rollback plan in the guide's order exists before it is needed (the change record); every run is recorded with its hashes (the ISSO). The kit's records support the controls; the agency's assessor or authorizing official decides them, and decides closure of each finding through the closure chain. Learn's operations guide: at least two people per role.`,
      cite: ["gsa08-ops"],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Lab 1: telemetry, and the pilot's No-go",
      body: [
        { terminal: "08-2", lines: "2-7" },
        { terminal: "08-3", lines: "12-20" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 08, “Lab 1: fixtures, no tenant,” steps 2–3.",
      say: `Lab 1. After collecting the pilot, step 2 runs the telemetry checks. The setting misses a category; branch health has no rows because no branch is on a remote network yet; alerts are twenty-seven hours old; and CISA telemetry isn't agreed. Step 3 computes the metrics and the pilot's exit. No metric is met, and the pilot is no-go, for five reasons: five business days in, one severity-two ticket open, eighty-three percent coverage, three report-only failures carried by the service, and one and a half percent TLS failures. The emergency exclusion was tested at ring start and break-glass was rehearsed.`,
      detail: `Step 1: collect the pilot. Step 2: ./Invoke-GsaCheck.ps1 -Area telemetry ...: GSA-LOG-01 Fail not sent: RemoteNetworkHealthLogs; GSA-LOG-02 Pass for NetworkAccessTraffic and NetworkAccessConnectionEvents; Warn RemoteNetworkHealthLogs no rows in the last day; Warn NetworkAccessAlerts 26.8 hours before the run; GSA-LOG-03 Warn CISA telemetry not yet agreed. Step 3: ./Invoke-GsaMetrics.ps1 ... -OutputPath out/metrics: every metric Not met; RX-01 Fail 5 business days since 2026-11-09 (needs 10); RX-02 Fail 1 unresolved; RX-03 Pass 9 tickets (threshold 10); RX-04 Fail 83.3%; RX-05 Fail 3 report-only failures carried by the service; RX-06 Fail 1.50% failures, 74 days to expiry; RX-07 Pass; RX-08 Pass. Ring pilot: No-go. (The metric rows are left out of the slide.)`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–3",
    },
    {
      part: "How", title: "Lab 1: ring 1 says Go; plan its rollback",
      body: [
        { terminal: "08-4", lines: "24,34-41,43" },
        { terminal: "08-5", lines: "1-5,17-21" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 08, “Lab 1,” steps 4–5.",
      say: `Step 4 does the same for ring 1, two weeks later: every metric is met, every criterion passes, and the ring says go. Step 5 plans ring 1's rollback before it's needed. Three enforced policies go to report-only in the guide's order, Step 7, then 6, then 5. Tagging goes off. The profile links and group assignments are portal steps, and the VPN route is the agency's own change. Signaling stays on. The plan's hash is printed, and it's a dry run: nothing changed.`,
      detail: `Step 4: ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json -FixturePath tests/fixtures/ring1 -OutputPath out/ring1 -AsOf 2026-11-30T12:00:00Z; ./Invoke-GsaMetrics.ps1 ... -OutputPath out/metrics-ring1: every metric Met (client coverage 100.0%, sign-ins 97.8%, compliant network On for the ring, PA least privilege 0; 0; 0, connectors 100%, bypass exposure 0; 0, TLS 0.50% and 180 days, telemetry freshness 0); RX-01 to RX-08 Pass; Ring ring1: Go. (The metric rows and collection output are left out of the slide.) Step 5: ./deploy/Invoke-GsaRollback.ps1 -SettingsPath tests/fixtures/settings.lab-ring1.json -CollectionPath out/ring1 -OutputPath out/rollback: RB-01 Step 7 NET-CN... enabled -> report-only; RB-02 Step 6 NET-PA-PA-Finance...; RB-03 Step 5 NET-IA...; RB-04 Step 8 tagging disabled (the TRv2 policy stays); MAN-LINK (two), MAN-GROUPS, MAN-VPN; Plan SHA-256; Dry run: nothing changed.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 4–5",
    },
    {
      part: "How", title: "Lab 1: signaling last, and the evidence",
      body: [
        { terminal: "08-6", lines: "2-7" },
        { terminal: "08-7", lines: "16-24" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 08, “Lab 1,” steps 6–7.",
      say: `Step 6 asks for signaling off as well. The plan adds it as the very last step, after its own steps have moved the enforced compliant network policy to report-only; it would refuse if any compliant network policy stayed enforced. Step 7 records the collection, the metrics and the rollback plan as evidence, and checks the folder: every file matches its hash, the three records form an unbroken chain, and each record lists its steps. Step 8 runs the tests: ten passed, none failed.`,
      detail: `Step 6: (Read-GsaJson -Path (New-GsaRollbackPlan ... -DisableSignaling).FullName).steps | ForEach-Object { $_.why }: Step 7, Step 6, Step 5, Step 8, then "Last: signaling disabled, after no policy depends on it". Step 7: ./Invoke-GsaEvidence.ps1 -EvidencePath out/evidence -RunPath out/ring1, out/metrics-ring1, out/rollback; ./Invoke-GsaEvidence.ps1 -EvidencePath out/evidence -Check: SUMS Pass 29 files match SHA256SUMS; CHAIN Pass 3 records, chain unbroken; Import-Csv out/evidence/records.csv | Format-Table sequence, label, result, steps: 1 collect Pass BASELINE EVIDENCE; 2 metrics Pass RINGS TELEMETRY EVIDENCE; 3 rollback Pass RB EVIDENCE. Step 8: Invoke-Pester -FullNameFilter 'Chapter 08*', 'Evidence*': 10 passed, 0 failed.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 6–8",
    },
    {
      part: "How", title: "Lab 2: a ring in a test tenant",
      body: [
        { steps: [
          { title: "Run the guide's freshness query", text: "az monitor log-analytics query, with the workspace's GUID" },
          { title: "Collect; check telemetry; metrics and exit", text: "Your ring record from the template, on agency storage" },
          { title: "Plan the rollback and file it", text: "Don't apply it unless the ring is being rolled back" },
          { title: "Record the runs; check the folder", text: "A protected evidence folder inside the boundary" },
          { title: "Back it out", text: "Nothing changed in the tenant; the evidence folder stays" },
        ], pt: 13 },
        { callout: "after each ring, re-run the Zero Trust Assessment and point each network finding's closure register entry at this evidence. Not run by the authors.", label: "Then: ", icon: "FaClipboardCheck", color: "teal" },
      ],
      sources: "Sources: Learn, az monitor log-analytics. Chapter 08, “Lab 2: a test tenant,” “Checklist.”",
      say: `Lab 2 uses the test tenant from Chapters 4 to 7, with the diagnostic setting on and at least a day of pilot traffic. Run the guide's freshness query. Collect, check telemetry, and compute the ring's metrics and exit, using your own ring record from the template, kept on agency storage. Plan the rollback and file it with the change record, without applying it. Record every run in a protected evidence folder inside the boundary and check it. Nothing changed in the tenant, so there's nothing to back out but the working copies. Then re-run the Zero Trust Assessment and point each network finding at this evidence. The authors haven't run this lab.`,
      detail: `Placeholders: <tenant-id>, <settings-file>, <inputs-folder> (with your ring-record.json from templates/ring-record.template.json), <workspace-guid>, <evidence-folder> (a protected folder inside the boundary, not a personal drive). 1 az monitor log-analytics query --workspace <workspace-guid> --analytics-query with the guide's freshness query (union of the four tables, rows and last time by table) -o table. 2 Connect-MgGraph with the Chapter 02 reads; ./Invoke-GsaCollect.ps1 -AllowUnverified; ./Invoke-GsaCheck.ps1 -Area telemetry; ./Invoke-GsaMetrics.ps1. 3 ./deploy/Invoke-GsaRollback.ps1 -OutputPath out/rollback-test (file it with the change record; don't apply it unless the ring is being rolled back). 4 ./Invoke-GsaEvidence.ps1 -EvidencePath <evidence-folder> for each run; -Check. 5 Disconnect-MgGraph; delete the working copies; the evidence folder stays. Checklist: the Zero Trust Assessment re-run after the ring, and each network finding's closure register entry points to this evidence.`,
      cite: ["gsa08-cli"],
      ref: "“Lab 2: a test tenant”; “Checklist”",
    },
    {
      part: "How", title: "Requirements, dangers, done",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Keeps it"], w: [5.1, 2.9, 2.4, 1.75], rows: [
          ["Tables fresh; the CISA path agreed", "AU-2, AU-6, AU-12, SI-4", "MLA-OSM, MLA-LET, MLA-RVL", "Security monitor"],
          ["Each ring exited on recorded, measured criteria", "CM-3, CM-4", "CMT-LMC, CMT-VTD", "Program manager"],
          ["The rollback planned in the guide's order, before it's needed", "CP-2, CM-3", "CMT-LMC", "Change record"],
          ["Every run hashed and chained", "AU-9, AU-6", "MLA-OSM, MLA-RVL", "ISSO"],
        ] }, pt: 11.5 },
        { cols: [[{ bullets: [
          "A ring exits on the calendar: Test-GsaRingExit",
          "The VPN web path retired without CISA telemetry: LOG-03",
          "Signaling off first: the rollback puts it last",
        ], label: "Dangers and guards", color: "red", pt: 12 }], [{ bullets: [
          "Four tables fresh; CISA path dated",
          "Metrics and exit filed per ring",
          "Rollback reviewed before the ring",
        ], label: "Done when", color: "teal", pt: 12 }]] },
      ],
      sources: "Sources: kit config/requirements.json (the guide's requirements table). Chapter 08, “Federal requirements,” “Dangers,” “Checklist.”",
      say: `Fresh tables and an agreed CISA path support event logging, audit review and monitoring, with OMB M-26-14 and TIC 3.0's telemetry requirement behind them. Ring exits on measured criteria support change control and impact analysis. A rollback planned before it's needed supports the contingency plan. And the hashed chain supports protecting audit information. The assessor or authorizing official decides the controls, and closure. The dangers: a ring that exits on the calendar, the VPN's web path retired without CISA telemetry, and signaling turned off first in an incident. You're done when the tables are fresh, each ring's exit is filed, and its rollback was reviewed before it started. Next, Chapter 9: deploying to test, and production.`,
      detail: `Requirements (config/requirements.json): the network tables are fresh and the CISA path is agreed: AU-2, AU-6, AU-12, SI-4; OMB M-26-14 and TIC 3.0 telemetry; KSI-MLA-OSM, KSI-MLA-LET, KSI-MLA-RVL. Each ring exited on its recorded criteria, with measured values: CM-3, CM-4; KSI-CMT-LMC, KSI-CMT-VTD. A rollback plan in the guide's order exists before it is needed: CP-2, CM-3; KSI-CMT-LMC. Every run is recorded with its hashes and the record before it: AU-9, AU-6; KSI-MLA-OSM, KSI-MLA-RVL. The kit's records support these controls; the agency's assessor or authorizing official decides them, and decides closure of each finding through the closure chain. Dangers: a ring exits on the calendar (Test-GsaRingExit); the VPN's web path retired without CISA telemetry (GSA-LOG-03 before ring 3); a traffic table goes quiet (GSA-LOG-02); signaling turned off first (the rollback plan puts it last and refuses it while a compliant network policy stays enforced); evidence edited after the fact (the chain and SHA256SUMS; a check with failures is Findings, not Pass). Checklist: the four tables have rows from the last day and the CISA path is agreed and dated; each ring's metrics and exit computed from a fresh collection and filed; the rollback plan exists, reviewed, before the ring starts; every run in the evidence folder and -Check passes; the Zero Trust Assessment re-run after the ring. Next: Chapter 09 — Deploying to Test and Production.`,
      cite: ["gsa08-tic"],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
