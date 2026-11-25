// Building Global Secure Access, Chapter 02 — The Configuration Export and Logs First: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/global-secure-access/02-configuration-export-and-logs-first.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-gsa-02-configuration-export-logs/build.js
require("../_build/devwb.js")({
  workbook: "gsa", chapter: 2, dir: __dirname,
  base: "DW_GSA_02_Configuration_Export_Logs",
  title: "The Configuration Export and Logs First",
  map: "Why one export and logs first · what Learn gives and leaves · the collector and manifest · the baseline checks · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome back to Building Global Secure Access. This is Chapter 2: the configuration export, and logs first. Every later chapter reads the same export, and nothing is enforced before the logs exist, so this chapter builds both. We'll start from Learn's advice to back the configuration up as Graph JSON, see what it leaves to you, read the kit's collector, its manifest and five baseline checks, and walk two labs. The chapter has been reviewed and approved, and the code is illustrative, tested against fixtures.`,
      detail: `The chapter is the code behind the guide's Step 2, Reference architecture, and the logging half of its Step 12, which its run order puts before the pilot. It starts with Learn's operations guidance (back up the configuration as Graph JSON weekly and before every change) and the guide's export loop and diagnostic setting. Then the kit's collector, its manifest, and the baseline checks GSA-ARC-01 to -04 and GSA-LOG-01. Lab 1 collects the fictional tenant, finds the category the setting leaves out, and shows that a changed file stops every later step. Lab 2 collects a test tenant and turns its network logs on.`,
      cite: ["gsa02-ops"],
      ref: "“In this chapter”; “Goal and audience”",
    },
    {
      part: "Why", title: "Why one export, and why logs first",
      body: [
        { lead: "Every later chapter reads the same export, and nothing is enforced before the logs exist." },
        { cols: [[{ bullets: [
          "Export the tenant's configuration in **one read-only run** whose files an assessor can re-hash",
          "Keep the architecture record: every connector group and DNS suffix",
          "Prove the network logs reach the workspace **before anyone is in a pilot**",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14 }], [{ bullets: [
          "Developers who build or maintain the kit",
          "The platform owner who keeps the architecture record",
          "The security monitor who owns the workspace",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 02, opening, “In this chapter,” “Goal and audience”; guide, run order.",
      say: `Why this chapter, now? The guide's run order is decision, architecture, then logging, and only then the client. So the logs exist before anything is enforced, and every later Validate step has a record to read. The goal: export the tenant's configuration in one read-only run whose files an assessor can re-hash; keep the architecture record that names every connector group and DNS suffix; and prove the network logs reach the workspace before anyone is in a pilot. It's for the developers, the platform owner who keeps the architecture record, and the security monitor who owns the workspace.`,
      detail: `Goal: export a tenant's Global Secure Access configuration in one read-only run whose files an assessor can re-hash, keep the architecture record that names every connector group and DNS suffix, and prove the network logs reach the workspace before anyone is in a pilot. Audience: developers who build or maintain the kit, the platform owner who keeps the architecture record, and the security monitor who owns the workspace. The guide's run order: 1, 2, 12 (logging only), 3, 4, 7, 8, 6, 10, 5, 9, 11, then 12 again for the evidence package.`,
      cite: [],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [4.0, 8.15], rows: [
          ["Configuration backup", "Graph JSON exports weekly and before every change"],
          ["Forwarding and security profiles, signaling, tagging", "NetworkAccess.Read.All, delegated or application; Global Reader or GSA Log Reader can read"],
          ["Named locations; TRv2 default", "Policy.Read.All"],
          ["Connector groups and members", "Directory.ReadWrite.All, delegated only: no read-only permission"],
          ["Connector", "status active or inactive; version"],
          ["Logs", "Traffic logs kept 30 days; longer through diagnostic settings (microsoft.aadiam, 2017-04-01)"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, Common operations; forwarding and filtering profiles; settings; connectors; named locations; TRv2 default; logs. Book 12, Ch 03.",
      say: `Learn's operations guidance is to back the configuration up as Graph JSON, weekly and before every change, and the guide's export is that loop. Each read has a Learn page. Profiles, signaling and tagging need Network Access Read All, and Global Reader or the Global Secure Access Log Reader can read them. Named locations and the tenant restrictions default need Policy Read All. Connector groups and their members are the surprise: Learn names only Directory Read Write All, delegated, so there's no read-only permission for them. A connector reports active or inactive, and its version. And traffic logs stay thirty days, longer only through a diagnostic setting.`,
      detail: `Learn's operations guidance is to back up the Global Secure Access configuration through Microsoft Graph JSON exports weekly and before every change. The forwarding profiles, security (filtering) profiles, Conditional Access signaling and cross-tenant tagging settings need NetworkAccess.Read.All, delegated or application, with Global Reader or Global Secure Access Log Reader enough to read; named locations and the tenant restrictions v2 default need Policy.Read.All; connector groups and their members need Directory.ReadWrite.All, delegated only: Learn gives no read-only permission for them. A connector has status (active, inactive), version, machineName, externalIp. Traffic logs stay in the service for 30 days; longer retention needs export through diagnostic settings, microsoft.aadiam/diagnosticSettings, API 2017-04-01, tenant scope (Book 12, Chapter 03).`,
      cite: ["gsa02-ops", "gsa02-fp", "gsa02-sp", "gsa02-sig", "gsa02-tag", "gsa02-cg", "gsa02-cgm", "gsa02-conn", "gsa02-nl", "gsa02-trv2", "gsa02-logs", "gsa02-b12"],
      ref: "“Start with Microsoft's documentation” — “What Microsoft gives you”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["Learn, as published", "Why it matters", "What the kit adds"], w: [3.4, 3.4, 5.35], rows: [
          ["Backup advice; the guide exports nine URIs", "Connector members, apps, licenses and logs aren't in it", "One collector for every read later chapters need"],
          ["A hash CSV nobody checks", "A changed export reads like the real one", "manifest.json; Read-GsaCollection refuses a folder that doesn't match"],
          ["Connector reads need a write permission", "A read-only job holds a write permission", "The call list says so; GET only; sign out after"],
          ["A diagnostic setting made by hand", "Nobody checks it stays complete", "GSA-LOG-01 names any category not sent"],
          ["An architecture record in prose", "Groups and suffixes drift from the tenant", "A template; GSA-ARC-01 to -03 compare it with the collection"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Learn, Common operations; List connectorGroups. Chapter 02, “What it leaves to you.”",
      say: `What does it leave to you? The guide's export covers nine addresses, but later chapters also need connector members, Private Access apps, licenses and the logs, so the kit has one collector for every read. The guide's hash list is something nobody checks, so the kit's manifest is checked every time a later step reads the collection. The connector reads need a write permission, so the call list says so, the reader only sends GET, and the lab signs out after. A diagnostic setting created by hand can lose a category, and an architecture record in prose drifts from the tenant. The kit checks both.`,
      detail: `Each row is pinned by a test in the Collection or Chapter 02 blocks of tests/GlobalSecureAccess.Tests.ps1. A backup recommendation and the guide's nine-URI loop: connector membership, Private Access apps, licenses and the logs aren't in it; one collector for every read the later chapters need, connector members once per group and the guide's queries once each. The guide's manifest is a CSV of hashes nobody checks: manifest.json lists each call with its permission and every file's SHA-256; Read-GsaCollection refuses a folder that doesn't match. Connector reads need Directory.ReadWrite.All: the call list says so; the reader sends only GET, and Lab 2 signs out after the read. A diagnostic setting created by hand: GSA-LOG-01 names any of the four categories that isn't sent, and the workspace it goes to. An architecture record in prose: templates/architecture.template.json; GSA-ARC-01 to -03 compare it with the collection.`,
      cite: ["gsa02-ops", "gsa02-cg"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "The collector, the manifest and the checks",
      body: [
        { cols: [[{ bullets: [
          "Every declared read for the areas named: **17 calls, 24 reads** in the fixture tenant",
          "raw/<call>.json, collection.json, manifest.json",
          "The manifest: time, mode, tenant, cloud, ring, each call's permission, beta and verified flags, every file's SHA-256",
          "Two unverified reads refused live without -AllowUnverified",
        ], label: "Invoke-GsaCollect.ps1", color: "navy", pt: 13 }], [{ table: { head: ["Check", "Looks for"], w: [1.7, 4.0], rows: [
          ["ARC-01", "Each connector group in the record, two hosts"],
          ["ARC-02", "DNS suffixes include the forest"],
          ["ARC-03", "The workspace named"],
          ["ARC-04", "Every baseline read present"],
          ["LOG-01", "gsa-network-telemetry sends all four categories"],
        ] }, pt: 12 }]], split: 0.52 },
      ],
      sources: "Sources: examples/global-secure-access (Invoke-GsaCollection, Test-GsaBaseline). Chapter 02, “The code.”",
      say: `Here's the code. The collector reads every declared call for the areas you name, all of them by default: seventeen calls, twenty-four reads in the fixture tenant, because connector members are read once per group and the guide's seven queries one by one. It writes each read, one collection file, and a manifest with each call's permission and every file's hash. Two reads aren't verified against a Learn page yet, and live runs refuse them unless you say so. Then five baseline checks: each connector group in the architecture record with two hosts, the forest in the DNS suffixes, the workspace named, the export complete, and the diagnostic setting sending all four network categories.`,
      detail: `Invoke-GsaCollection (and Invoke-GsaCollect.ps1) reads every declared call for the areas named, all of them by default: 17 calls, 24 reads in the fixture tenant. It writes raw/<call>.json, one collection.json, and manifest.json with the time, mode, environment, tenant, cloud, ring, each call (method, permissions, beta, verified, Learn page) and the SHA-256 of every file. Two reads aren't verified against a Learn page (the tenant restrictions partners list and the Private Access application read); the live reader refuses them unless the run passes -AllowUnverified. Checks: GSA-ARC-01 each connector group in the tenant is in the architecture record with two or more hosts; GSA-ARC-02 the private DNS suffixes include the Active Directory forest name; GSA-ARC-03 the record names the workspace; GSA-ARC-04 the collection holds every baseline read; GSA-LOG-01 a diagnostic setting named gsa-network-telemetry sends NetworkAccessTrafficLogs, NetworkAccessConnectionEvents, RemoteNetworkHealthLogs and NetworkAccessAlerts to the record's workspace.`,
      cite: [],
      ref: "“The code”",
    },
    {
      part: "Who", title: "Who keeps the record, and the logs",
      body: [
        { cols: [[{ bullets: [
          "**Platform owner**: the architecture record, the export before every change",
          "**Security monitor**: the workspace and the diagnostic setting",
          "**ISSO**: keeps the export folders in the evidence store",
        ], label: "Roles", color: "teal", pt: 14 }], [{ bullets: [
          "NetworkAccess.Read.All, Policy.Read.All for the configuration",
          "Directory.ReadWrite.All for connectors: **sign out after the read**",
          "Security Administrator for the diagnostic setting",
          "Global Secure Access Administrator through PIM, for the lab only",
        ], label: "Permissions and roles", color: "navy", pt: 14 }]] },
      ],
      sources: "Sources: Learn, connector and settings pages. Chapter 02, “Goal and audience,” “Lab 2,” “Federal requirements.”",
      say: `Who does what? The platform owner keeps the architecture record and runs the export before every change. The security monitor owns the workspace and the diagnostic setting. The security officer keeps the export folders, in the evidence store, not on a personal drive. The reader holds Network Access Read All and Policy Read All for the configuration, and Directory Read Write All for the connectors, so the lab signs out right after the read. Creating the diagnostic setting takes Security Administrator, and roles are activated through privileged identity management for the change window only.`,
      detail: `Evidence owners (Chapter 02, Federal requirements): the configuration export (the platform owner; the ISSO keeps the folder); the architecture record (the platform owner); the network categories reaching the workspace before the pilot (the security monitor); a changed export refused (the repository's tests). Lab 2: activate Global Secure Access Administrator and Security Administrator through PIM for the lab only; Connect-MgGraph -Environment Global with NetworkAccess.Read.All, Policy.Read.All, Directory.ReadWrite.All, LicenseAssignment.Read.All, NetworkAccessPolicy.Read.All; sign out first in the back-out step because the session holds Directory.ReadWrite.All.`,
      cite: ["gsa02-cg"],
      ref: "“Goal and audience”; “Lab 2”; “Federal requirements and evidence”",
    },
    {
      part: "How", title: "Lab 1: collect the whole pilot tenant",
      body: [
        { terminal: "02-4", lines: "1-2,4-9,15-21,23" },
        { terminal: "02-5" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 02, “Lab 1: fixtures, no tenant,” steps 2–3.",
      say: `Lab 1, again in the kit's folder with no tenant. Step 1 lists what the baseline reads. Step 2 collects the whole pilot tenant: seventeen calls, each with its least-privileged permission and its beta and verified flags. The Private Access apps and the tenant restrictions partners are the two not yet verified against a Learn page. Twenty-four reads in all, eighteen files hashed. Step 3 checks the folder against its manifest: all eighteen files match.`,
      detail: `Step 1: Import-Module ./powershell/GlobalSecureAccess/GlobalSecureAccess.psm1; Get-GsaRequiredPermission -Area baseline | Format-Table. Step 2: ./Invoke-GsaCollect.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/pilot -OutputPath out/pilot -AsOf 2026-11-16T12:00:00Z. 17 calls, 24 reads, 18 files hashed. private-apps and trv2-partners are the two with Verified False. (The rows from diagnostic-settings to licenses are left out of the slide.) Step 3: (Test-GsaRunFolder -Path out/pilot).Detail: 18 files match the manifest.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–3",
    },
    {
      part: "How", title: "Lab 1: the category the setting leaves out",
      body: [
        { terminal: "02-6" },
        { terminal: "02-7" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 02, “Lab 1,” steps 4–5.",
      say: `Step 4 runs the baseline checks. Both connector groups are in the architecture record with two hosts each, the forest is in the DNS suffixes, and the workspace is named. One failure: the diagnostic setting doesn't send the remote network health logs. Step 5 reads the setting's categories as the collector saved them: three on, and remote network health off. No branch is on a remote network yet, but when one is, its health would never reach the workspace.`,
      detail: `Step 4: ./Invoke-GsaCheck.ps1 -Area baseline -SettingsPath tests/fixtures/settings.lab.json -CollectionPath out/pilot -InputsPath tests/fixtures/pilot/inputs -OutputPath out/check-baseline -AsOf 2026-11-16T12:00:00Z. baseline: 6 checks (1 Fail, 5 Pass): GSA-LOG-01 Fail, not sent: RemoteNetworkHealthLogs. Step 5: (Read-GsaJson -Path out/pilot/raw/diagnostic-settings.json).value | Where-Object { $_.name -eq 'gsa-network-telemetry' } | ForEach-Object { $_.properties.logs } | ForEach-Object { [pscustomobject]$_ } | Format-Table category, enabled.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 4–5",
    },
    {
      part: "How", title: "Lab 1: a changed file stops every later step",
      body: [
        { terminal: "02-8" },
        { terminal: "02-9" },
      ],
      sources: "Sources: examples/global-secure-access (fictional fixtures). Chapter 02, “Lab 1,” steps 6–7.",
      say: `Step 6 is the one to remember. Copy the collection, add one space to one file, and try to read it. The read is refused: the licenses file changed since its manifest. Every later chapter reads the collection through that same check, so an edited export can't quietly become evidence. Step 7 runs this chapter's tests: eight passed, none failed. Then delete the output folder.`,
      detail: `Step 6: Copy-Item -Recurse out/pilot out/tampered; Add-Content -Path out/tampered/raw/licenses.json -Value ' '; Read-GsaCollection -Path out/tampered. Exception: Collection out/tampered doesn't match its manifest: raw/licenses.json changed since its manifest. Step 7: Invoke-Pester -Path tests/GlobalSecureAccess.Tests.ps1 -FullNameFilter 'Collection*', 'Chapter 02*' -Output None -PassThru | Select-Object PassedCount, FailedCount: 8 passed, 0 failed. Delete out: Remove-Item -Recurse -Force out.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 6–7",
    },
    {
      part: "How", title: "Lab 2: logs on, then the export",
      body: [
        { steps: [
          { title: "Turn the network logs on first", text: "The guide's Step 12.1 az rest PUT for gsa-network-telemetry, all four categories, in Bash" },
          { title: "Sign in to Graph as a person", text: "The baseline's scopes, including Directory.ReadWrite.All for connectors; az login" },
          { title: "Collect and check", text: "-AllowUnverified for the two unverified reads; compare them with the portal first. GSA-LOG-01 passes" },
          { title: "Back it out", text: "Disconnect-MgGraph first; delete the setting only if the test tenant shouldn't keep it; delete outputs" },
        ], pt: 13 },
        { callout: "a test tenant and an Azure test subscription with a workspace, never production. Not run by the authors.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Book 12, Ch 03 (diagnostic settings); Learn, connector pages. Chapter 02, “Lab 2: a test tenant.”",
      say: `Lab 2 uses a test tenant and an Azure test subscription with a Log Analytics workspace, never production. Turn the network logs on first, with the guide's own command: one diagnostic setting, all four categories. Then sign in to Graph as a person with the baseline's permissions and collect. The two unverified reads need an extra switch, and you compare their results with the portal before trusting them. The logging check passes once the setting exists. Back it out by signing out first, because the session can write, and delete the setting only if this test tenant shouldn't keep it. The authors haven't run this lab.`,
      detail: `Placeholders: <tenant-id>, <settings-file>, <inputs-folder>, <subscription-id>, <resource-group>, <workspace>. 1 In Bash: ARM=https://management.azure.com; WORKSPACE_ID=/subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.OperationalInsights/workspaces/<workspace>; az rest --method PUT --uri the ARM host's /providers/microsoft.aadiam/diagnosticSettings/gsa-network-telemetry?api-version=2017-04-01 with the four categories. 2 Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes NetworkAccess.Read.All, Policy.Read.All, Directory.ReadWrite.All, LicenseAssignment.Read.All, NetworkAccessPolicy.Read.All; az login --tenant <tenant-id>. 3 ./Invoke-GsaCollect.ps1 -SettingsPath <settings-file> -OutputPath out/baseline-test -AllowUnverified; ./Invoke-GsaCheck.ps1 -Area baseline. Record each connector group the portal shows that the record doesn't. 4 Disconnect-MgGraph; az rest --method DELETE on the setting (only if the test tenant shouldn't keep it: deleting it ends the evidence trail); remove the outputs.`,
      cite: ["gsa02-b12", "gsa02-cg"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Requirements, dangers, done",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Keeps it"], w: [5.3, 2.3, 2.6, 1.95], rows: [
          ["The export, each call's permission, a SHA-256 per file", "CM-2, CM-8", "CNA-ULN, PIY-GIV", "Platform owner; ISSO"],
          ["Groups, suffixes and workspace in the architecture record", "SC-7, AC-4", "CNA-ULN", "Platform owner"],
          ["The network categories reach the workspace before the pilot", "AU-2, AU-12", "MLA-OSM, MLA-LET", "Security monitor"],
          ["A changed export is refused", "CM-2; AU-9", "MLA-OSM", "The tests"],
        ] }, pt: 12 },
        { cols: [[{ bullets: [
          "A pilot before the logs: GSA-LOG-01, preflight PF-04",
          "A write-capable session left open: sign out after the read",
          "An edited export as evidence: the manifest check",
        ], label: "Dangers and guards", color: "red", pt: 12.5 }], [{ bullets: [
          "Setting with all four categories before the pilot",
          "Export weekly and before every change, filed",
          "Every connector group, two hosts, in the record",
        ], label: "Done when", color: "teal", pt: 12.5 }]] },
      ],
      sources: "Sources: kit config/requirements.json (the guide's requirements table). Chapter 02, “Federal requirements,” “Dangers,” “Checklist.”",
      say: `The export with its permissions and hashes supports baseline configuration and component inventory. The architecture record supports boundary protection and information flow. Logs in the workspace before the pilot support event logging and audit record generation, and a refused, changed export supports protecting audit information. The key security indicators are FedRAMP's, and which output supports which is the program's mapping; the assessor decides the controls. The dangers: a pilot before the logs, a write-capable session left open, and an edited export used as evidence. You're done when the setting existed before the pilot, and the export runs before every change. Next, Chapter 3: the client.`,
      detail: `Requirements (config/requirements.json): the configuration export, each call with its permission, and a SHA-256 per file: CM-2, CM-8; KSI-CNA-ULN, KSI-PIY-GIV. Every connector group, suffix and the workspace in the architecture record: SC-7, AC-4; KSI-CNA-ULN. The network categories reach the workspace before the pilot: AU-2, AU-12; KSI-MLA-OSM, KSI-MLA-LET. A changed export is refused: CM-2; AU-9; KSI-MLA-OSM. The kit's records support these controls; the agency's assessor decides them. Dangers: a pilot before the logs (GSA-LOG-01; the runbook's preflight PF-04); a category left out (GSA-LOG-01 names it); a write-capable session left open after the connector read (Lab 2 signs out; the call list says why); an edited export used as evidence (Read-GsaCollection refuses a folder that doesn't match); a connector group the record doesn't know (GSA-ARC-01). Checklist: the setting existed with all four categories before the pilot; the export runs weekly and before every change and goes to the evidence store; the record names every connector group (two hosts or more), every suffix, the forest and the workspace; the two unverified reads compared with the portal; the Graph session that read connectors closed after the read. Next: Chapter 03 — The Client and Its Coverage.`,
      cite: ["gsa02-logs"],
      ref: "“Federal requirements and evidence”; “Dangers”; “Checklist”",
    },
  ],
});
