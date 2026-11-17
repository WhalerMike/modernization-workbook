// Building Azure Security, Chapter 01 — The Landing-Zone Baseline: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/azure-security/01-the-landing-zone-baseline.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-azs-01-landing-zone-baseline/build.js
require("../_build/devwb.js")({
  workbook: "azs", chapter: 1, dir: __dirname,
  base: "DW_AZS_01_Landing_Zone_Baseline",
  title: "The Landing-Zone Baseline",
  map: "Why read it back · what Learn gives and leaves · the call list and invokers · the baseline rules · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to the Federal Modernization Workbook's developer workbook, Building Azure Security. This is Chapter 1: the landing-zone baseline. A baseline nobody reads back is a wish, so the first thing the kit does is read it back, the same way, every week, with nothing it could change. We'll start from Microsoft Learn's own commands, see what they leave to you, read the kit's spine and its baseline check, and walk two labs, the evidence and the dangers. The chapter is a draft awaiting the owner's review, and the code is illustrative, tested against a fictional estate.`,
      detail: `The chapter is the code behind the Azure Security Engineering guide's Step 1, the landing-zone security baseline, and the parts of the kit every later chapter uses. You start with what the guide's Learn commands give you: a hierarchy setting, an assignment in DoNotEnforce, a Resource Graph query that lists the platform resources. Then you read the kit's spine: the call list, the two invokers, the run folder and its manifest. Lab 1 runs the baseline check on the fictional Contoso estate and shows the exact az command a live run would send. Lab 2 runs it against a test management group, beside the guide's own Validate commands.`,
      cite: ["azs01-guide"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why the baseline is read back as code",
      body: [
        { cols: [[{ bullets: [
          "Whether creating management groups needs **authorization**, and new subscriptions land in a **default group**",
          "Whether the required initiatives sit at the **intermediate root**, in audit",
          "Whether every platform resource sends **logs to the platform workspace**",
          "Whether every subscription has the required **Defender for Cloud plans**",
        ], label: "By the end you can read", color: "navy", pt: 14 }], [{ bullets: [
          "Platform engineers who own the management group hierarchy",
          "Developers and ISSOs who review their automation",
          "Read PowerShell 7; no subscription until Lab 2",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
        { callout: "every read is declared, every finding names its source, and nothing the kit runs can change the estate.", label: "The rule: ", icon: "FaShieldHalved", color: "teal" },
      ],
      sources: "Sources: Chapter 01, opening, “In this chapter,” “Goal and audience.”",
      say: `Why read the baseline back as code? Because the guide's Step 1 sets four things once, and nobody checks them every week across every subscription. By the end of this chapter you can read all four: whether creating management groups needs authorization and new subscriptions land in a default group, whether the required initiatives sit at the intermediate root in audit, whether every platform resource sends logs to the platform workspace, and whether every subscription has the required Defender for Cloud plans. It's for platform engineers who own the hierarchy, and for the developers and security officers who review their automation. And one rule holds throughout: every read is declared, every finding names its source, and nothing the kit runs can change the estate.`,
      detail: `Goal: by the end of this chapter you can read an Azure landing zone's security baseline as code: whether creating management groups needs authorization and new subscriptions land in a default group, whether the required initiatives are assigned at the intermediate root, whether every platform resource sends logs to the platform workspace, and whether every subscription has the required Defender for Cloud plans. Audience: platform engineers who own the management group hierarchy, and the developers and ISSOs who review their automation. You should read PowerShell 7 and know what a management group, a policy assignment and a diagnostic setting are. You don't need a subscription until Lab 2.`,
      cite: [],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.6, 8.55], rows: [
          ["Protect the hierarchy", "New-AzManagementGroupHierarchySetting sets -Authorization and -DefaultManagementGroup on the tenant root group"],
          ["Hierarchy Settings - Get", "GET .../managementGroups/{groupId}/settings/default, API version 2020-05-01, returns both settings"],
          ["Enforcement mode", "DoNotEnforce evaluates compliance without enforcing the effect"],
          ["Diagnostic Settings - List", "GET {resourceUri}/providers/Microsoft.Insights/diagnosticSettings: workspace, log categories, enabled"],
          ["Pricings - List", "GET {scopeId}/providers/Microsoft.Security/pricings: each plan's pricing tier, Free or Standard"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, Protect your resource hierarchy; Hierarchy Settings - Get; assignment structure; Diagnostic Settings - List; Pricings - List.",
      say: `Here's Microsoft's starting point. Learn's Az PowerShell for protecting the hierarchy sets two things on the tenant root group: that creating a management group needs authorization, and which group new subscriptions land in. Learn's REST reference reads both back with one call. The guide assigns the security benchmark and the FedRAMP initiative in DoNotEnforce, which evaluates compliance without enforcing. And two more REST references give the reads the kit needs: diagnostic settings, with the workspace and the log categories each one sends, and Defender for Cloud's pricings, with each plan's tier.`,
      detail: `Learn's Az PowerShell for protecting the hierarchy, New-AzManagementGroupHierarchySetting with -Authorization and -DefaultManagementGroup, sets two things on the tenant root group. Learn's REST reference reads the same two settings back with one GET on /providers/Microsoft.Management/managementGroups/{groupId}/settings/default, API version 2020-05-01, returning requireAuthorizationForGroupCreation and defaultManagementGroup; settings can only be set on the root group. DoNotEnforce evaluates compliance without enforcing the effect; remediation can still run for deployIfNotExists. Diagnostic Settings - List, API version 2021-05-01-preview, returns workspaceId and logs with category, categoryGroup and enabled. Pricings - List, API version 2024-01-01, returns each plan's pricingTier, Free or Standard. Policy assignments are in the PolicyResources table of Resource Graph.`,
      cite: ["azs01-mg-protect", "azs01-hier-get", "azs01-enforcement", "azs01-diag", "azs01-pricings", "azs01-arg-policy"],
      ref: "“Start with Microsoft Learn” — “What the guide's Learn commands give you”; “Verified facts”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["As published", "Why it matters", "What the kit adds"], w: [3.4, 3.9, 4.85], rows: [
          ["One command per setting, by hand", "Nobody runs them weekly, everywhere", "One check reads all four parts in one run"],
          ["az graph query with no scope", "Reads whatever the account happens to see", "Every query scoped to the intermediate root"],
          ["Compare diagnostic settings by eye", "Misses the resource logging to the wrong workspace", "A log counts only if enabled, to the platform workspace"],
          ["az login with the default cloud", "A session on another cloud reads another estate", "A live run refuses another cloud, tenant or host"],
          ["Nothing records what was read", "No proof of which run a finding came from", "A run folder: every response, every file hashed"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 01, “What it leaves to you”; the kit's tests (Core and Baseline).",
      say: `What does Learn leave to you? Each command is run by hand, once, so nobody runs it every week across every subscription. A Resource Graph query with no scope reads whatever the signed-in account happens to see. Comparing diagnostic settings by eye misses the one resource that logs to the wrong workspace. A session left on another cloud reads another estate. And nothing records what was read, so an assessor can't tell which run a finding came from. The kit answers each of those, and a test pins each answer.`,
      detail: `Each row is pinned by a test. One command per setting, run by hand: one check reads all four parts of the baseline in one run (the Baseline tests). az graph query with no scope: every query is scoped to the settings' intermediate root (Core: the live commands). "Compare the list with az monitor diagnostic-settings list for each": Test-AzsDiag counts a setting only if it sends an enabled log to the platform workspace (Core: findings and rules). az login with the default cloud: a live run refuses an Azure CLI on another cloud or tenant, and a REST call to any host but management.azure.com. Nothing records what was read: a run folder with every raw response and a manifest of SHA-256 hashes (Run folders tests). Defender for Cloud "on every subscription": the required plans from config/baseline.json, read per subscription from the pricings API.`,
      cite: ["azs01-guide"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "The spine: one call list, two invokers",
      body: [
        { cols: [[{ bullets: [
          "**33 reads**: 24 Resource Graph queries, 9 Resource Manager GETs",
          "Each with its query or path, API version, role (**Reader**) and Learn page",
          "15 verified on Learn; 18 say what's missing, and a live run refuses them without **-AllowUnverified**",
        ], label: "config/calls.json", color: "navy", pt: 13.5 }], [{ bullets: [
          "**Fixture**: reads files, sends nothing",
          "**Live**: az graph query --management-groups, or az rest --method get on management.azure.com",
          "Checks az's cloud and tenant before the first call",
        ], label: "The invokers", color: "teal", pt: 13.5 }]] },
        { callout: "the kit knows one cloud, AzureCloud, and has no default. Microsoft 365 GCC pairs with commercial Azure.", label: "One cloud: ", icon: "FaCloud", color: "amber" },
      ],
      sources: "Sources: examples/azure-security (config/calls.json, the invokers). Chapter 01, “The code.”",
      say: `Now the kit's spine. One call list declares thirty-three reads: twenty-four Resource Graph queries and nine Resource Manager GETs, each with its query or path, its API version, its role, which is Reader everywhere, and the Learn page it comes from. Fifteen are verified on Learn. The other eighteen say what's missing, and a live run refuses them unless you allow it. Two invokers serve the calls: the fixture invoker reads files and sends nothing; the live invoker runs a scoped Resource Graph query or a GET on the commercial Resource Manager host, after checking the CLI's cloud and tenant. The kit knows one cloud, commercial Azure, which Microsoft 365 GCC pairs with, and has no default.`,
      detail: `config/calls.json declares 33 reads: 24 Resource Graph queries and 9 Resource Manager GETs. Each has its query or path and API version, the areas that use it, its least-privileged role (Reader, which holds */read, everywhere) and the Learn page it comes from. Fifteen are verified: their query, path, API version and properties were read on the cited page. The other eighteen say what is missing; a live run refuses them unless -AllowUnverified, and each chapter's Lab 2 checks their output against the portal. The fixture invoker reads each call's file and sends nothing. The live invoker runs az graph query -q <query> --first 1000 --management-groups <mg-id>, following skip tokens, or az rest --method get on management.azure.com, following nextLink only on the same host; before its first call it checks az cloud show and az account show against the settings. The run folder: rows, findings.json and findings.csv, summary.json, raw/, and manifest.json with every file's SHA-256.`,
      cite: ["azs01-gov"],
      ref: "“The code: the spine of examples/azure-security”",
    },
    {
      part: "What", title: "The baseline check: six rules",
      body: [
        { table: { head: ["Rule", "Severity", "What it flags", "Source"], w: [1.6, 1.4, 6.0, 3.15], rows: [
          ["AZS-BL-01", "Finding", "Creating management groups doesn't need authorization", "Learn"],
          ["AZS-BL-02", "Finding", "No default management group, or the tenant root", "Learn"],
          ["AZS-BL-03", "Finding", "A required assignment isn't at the intermediate root", "Design guidance"],
          ["AZS-BL-04", "Info", "A required assignment in DoNotEnforce, as Step 1 intends", "Learn"],
          ["AZS-BL-05", "Finding", "A platform resource with no log to the platform workspace", "Learn, per service"],
          ["AZS-BL-06", "Finding", "A required Defender for Cloud plan not on Standard", "Design guidance"],
        ] }, pt: 12.5 },
        { lead: "Platform types and required plans live in config/baseline.json; change them in a reviewed pull request." },
      ],
      sources: "Sources: examples/azure-security (config/rules.json, config/baseline.json). Chapter 01, “The baseline check.”",
      say: `The baseline check reports six rules. Two come straight from Learn's hierarchy guidance: creating management groups must need authorization, and new subscriptions must land in a default group, not the tenant root. One is the program's design: the required assignments must sit at the intermediate root. One is information, not a finding: an initiative in DoNotEnforce is exactly what Step 1 intends. Then logs: every platform resource must send an enabled log to the platform workspace. And Defender for Cloud: the required plans must be on Standard. The types and plans it checks live in a configuration file you change only in a reviewed pull request.`,
      detail: `Get-AzsBaselineCheck reads the hierarchy settings, the policy assignments, the platform resources with their diagnostic settings, and each subscription's Defender for Cloud pricings. AZS-BL-01, Finding: requireAuthorizationForGroupCreation isn't true (Learn). AZS-BL-02, Finding: no default management group, or the tenant root group (Learn). AZS-BL-03, Finding: a required assignment (the settings' requiredAssignments) isn't at the intermediate root (design guidance). AZS-BL-04, Info: a required assignment is in DoNotEnforce, as Step 1 intends; Step 9 enforces (Learn). AZS-BL-05, Finding: a platform resource sends no enabled log to the platform workspace (Learn, through the guide's per-service pages). AZS-BL-06, Finding: a required Defender for Cloud plan isn't on the Standard tier (design guidance). The platform types are Azure Firewall, application gateways, Front Door profiles, key vaults and public IPs; the required plans are CloudPosture, KeyVaults and Arm.`,
      cite: ["azs01-mg-protect", "azs01-enforcement"],
      ref: "“The baseline check”",
    },
    {
      part: "Who", title: "Who owns the baseline, and what the reader may do",
      body: [
        { cards: [
          { title: "Platform owner", text: "Owns the hierarchy, the logging and the run; answers for the findings", color: "navy" },
          { title: "Developers", text: "Build and review the kit; keep calls.json and rules.json honest", color: "teal" },
          { title: "ISSO", text: "Reviews compliance with the platform owner; keeps the run folder", color: "amber" },
        ], pt: 13.5 },
        { table: { head: ["Read", "Least-privileged role"], w: [5.2, 6.95], rows: [
          ["Hierarchy settings", "Reader on the tenant root group"],
          ["Assignments, platform resources, subscriptions", "Reader on the intermediate root"],
          ["Diagnostic settings, Defender pricings", "Reader"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Chapter 01, “Goal and audience,” Lab 1 step 1; the guide's Step 1 (gate owner).",
      say: `Who's involved? The platform owner owns the hierarchy, the logging and the weekly run, and answers for the findings, with the security officer reviewing compliance beside them, as the guide's Step 1 names the gate owner. Developers build and review the kit and keep its call list and rules honest. And the reader the kit signs in as needs only Reader: on the tenant root group for the hierarchy settings, and on the intermediate root for everything else. Nothing in this chapter writes.`,
      detail: `Gate owner for the guide's Step 1: the platform owner, with the ISSO. The kit's reads: hierarchy settings, Reader at the tenant root group; policy assignments, platform resources and subscriptions through Resource Graph, Reader at the intermediate root; diagnostic settings and Defender for Cloud pricings through Resource Manager, Reader. Lab 1 step 1 prints each call and its role with Get-AzsRequiredRole -Area baseline: six calls, every one Reader, all six verified on Learn.`,
      cite: ["azs01-guide"],
      ref: "“Goal and audience”; Lab 1, step 1",
    },
    {
      part: "How", title: "Lab 1: the calls, and the check on week one",
      body: [
        { terminal: "01-1", label: "examples/azure-security  ·  fixture data  ·  real output" },
        { terminal: "01-2" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 01, “Lab 1: fixtures, no subscription,” steps 1–2.",
      say: `Lab 1 needs only PowerShell 7 with Pester, in the kit's folder, against the fictional Contoso estate: an intermediate root, four subscriptions and a platform workspace. No subscription. Step 1 lists the six calls this chapter makes, every one Reader, every one verified. Step 2 runs the baseline check on the first week's estate: hierarchy settings, four policy assignments, sixteen platform resources and four subscriptions read. Twelve findings and one information row, from six calls, every one a read, with a manifest that lists each file's hash.`,
      detail: `You need PowerShell 7.1 or later with Pester 5, working in examples/azure-security. The fixture estate is Contoso's: an intermediate root contoso, four subscriptions (connectivity, management and two workloads), a platform workspace law-contoso-platform, and the resources the later chapters read. Step 1: Get-AzsRequiredRole -Area baseline lists six calls, every one Reader, the hierarchy settings at the tenant root group, all verified. Step 2: Invoke-AzsCheck.ps1 -Area baseline on week1: twelve Findings and one Info, from six calls, every one a read.`,
      cite: [],
      ref: "“Lab 1: fixtures, no subscription,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the findings, the summary, the command",
      body: [
        { terminal: "01-3", lines: "1-4,9,13-14" },
        { cols: [[{ terminal: "01-4", lines: "1,11-15" }], [{ terminal: "01-5" }]], split: 0.45 },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 01, “Lab 1: fixtures, no subscription,” steps 3–5.",
      say: `Step 3 reads the findings. Creating management groups doesn't need authorization. Ten resources send no log to the platform workspace; one of them, the firewall's public IP, does send logs, but to an application team's workspace, which doesn't count. The online subscription's Key Vault plan is Free. And the FedRAMP initiative is in audit, as Step 1 intends. Step 4 reads the summary the metrics use: six of sixteen platform resources log to the workspace. Step 5 prints, without sending it, the exact command a live run would send: the guide's own query, scoped to the intermediate root.`,
      detail: `Step 3: AZS-BL-01, creating management groups doesn't need authorization. Ten AZS-BL-05 rows: the firewall, one application gateway, one Front Door profile, one vault and six public IPs send no log to the platform workspace; pip-afw-hub sends its logs to an application team's workspace, which doesn't count. AZS-BL-06: the online subscription's Key Vault plan is Free. AZS-BL-04 is the FedRAMP initiative in audit. No AZS-BL-02: new subscriptions land in contoso-sandbox. Step 4: 6 of 16 platform resources log to the workspace (37.5%); 3 of 4 subscriptions have the required plans. Step 5: Get-AzsLiveCommand prints the guide's Step 1 query, ordered for paging, with --management-groups contoso. Step 6 runs the chapter's two tests.`,
      cite: ["azs01-guide"],
      ref: "“Lab 1: fixtures, no subscription,” steps 3–6",
    },
    {
      part: "How", title: "Lab 2: a test subscription",
      body: [
        { steps: [
          { title: "Sign in to commercial Azure", text: "az cloud set --name AzureCloud; az login --tenant; the resource-graph extension" },
          { title: "Write the test settings file", text: "From deploy/settings.template.json, every placeholder filled, outside any repository" },
          { title: "Run the baseline check, live", text: "Every call it makes is verified, so no -AllowUnverified" },
          { title: "Compare with the guide's Validate", text: "az policy assignment list; the hierarchy settings GET; one resource's diagnostic settings in the portal" },
          { title: "Back it out", text: "Nothing changed in Azure: delete what the lab wrote, and sign out" },
        ], pt: 12.5 },
        { callout: "a test tenant and test management group, never production. The authors haven't run this lab.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Chapter 01, “Lab 2: a test subscription.”",
      say: `Lab 2 moves to a test tenant with a test management group and subscription, never production. Sign in to commercial Azure, write the settings file from the template with every placeholder filled, and run the same check live. Every call this check makes is verified on Learn, so it needs no special flag. Then compare with the guide's own Validate commands: the assignment list, the hierarchy settings read straight from Resource Manager, and one flagged resource's diagnostic settings in the portal. Nothing changed in Azure, so backing out means deleting what the lab wrote, which maps the test estate, and signing out. The authors haven't run this lab.`,
      detail: `Use a test tenant with a test management group and subscription in commercial Azure, never production. You need Reader on the test management group and on the tenant root group, Azure CLI with the resource-graph extension, and PowerShell 7. Steps: az cloud set --name AzureCloud; az login --tenant <tenant-id>; az extension add --name resource-graph. Write <output-folder>/settings.test.json from deploy/settings.template.json. Run Invoke-AzsCheck.ps1 -Area baseline live. Compare with az policy assignment list --scope <mg> and az rest GET of the hierarchy settings; check one AZS-BL-05 resource in Monitor > Diagnostic settings. Back out: Remove-Item the output; az logout.`,
      cite: ["azs01-hier-get"],
      ref: "“Lab 2: a test subscription”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.6, 2.3, 2.0, 2.25], rows: [
          ["Hierarchy settings, initiatives at the root and their mode (baseline.json)", "CM-2; CM-6", "SVC-ACM", "Platform owner, ISSO"],
          ["Which resources log to the workspace; which subscriptions have the plans", "CA-7", "MLA-EVC", "Platform owner"],
          ["Every call a read, as Reader, every response kept and hashed", "CA-7; AC-6", "MLA-EVC", "ISSO, with Chapter 08's record"],
        ] }, pt: 12.5 },
        { lead: "The kit's output supports these controls; the assessor decides. KSIs are FedRAMP 20x indicators for providers." },
      ],
      sources: "Sources: the guide's Federal requirements and KSIs (Step 1). Chapter 01, “Federal requirements and evidence.”",
      say: `Each output is evidence for something specific, from the guide's requirements table. The hierarchy settings, the initiatives at the intermediate root and their enforcement mode support baseline configuration and configuration settings. Which resources log to the workspace, and which subscriptions have the required plans, support continuous monitoring. And the manifest shows every call was a read, as Reader, with every response kept and hashed. The kit's output supports those controls; the assessor decides. And the key security indicators are FedRAMP's indicators for cloud providers: the agency lines its own evidence up with them, and doesn't report them.`,
      detail: `Hierarchy settings, the initiatives at the intermediate root and their enforcement mode, as read (baseline.json rows hierarchy and assignment, Lab 1 step 2): CM-2, baseline configuration; CM-6, configuration settings; KSI-SVC-ACM; platform owner with the ISSO. Which platform resources send logs to the platform workspace, and which subscriptions have the required Defender for Cloud plans (AZS-BL-05 and AZS-BL-06, summary.json): CA-7, continuous monitoring; KSI-MLA-EVC; platform owner. Every call was a read, as Reader, with every response kept and hashed (manifest.json and raw/): CA-7; AC-6, least privilege; KSI-MLA-EVC; the ISSO, with Chapter 08's evidence record. The controls are the guide's Step 1 row (CM-2, CM-6, CA-7) and its KSIs.`,
      cite: ["azs01-guide"],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.2, 4.2, 4.75], rows: [
          ["A live run on the wrong cloud or tenant", "Another estate reported as this one", "az cloud show and az account show checked first; no default cloud"],
          ["A query without a scope", "The run covers what the account happens to see", "--management-groups from the settings, always"],
          ["A link that leads elsewhere", "A nextLink points at another host", "Any URL not on management.azure.com is refused"],
          ["An unverified call trusted silently", "A misnamed property reads as a gap", "Refused live without -AllowUnverified; Lab 2 compares"],
          ["The run folder in a public repository", "A map of the estate published", "Output outside the repository; the runbook's preflight"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 01, “Dangers.”",
      say: `What breaks in production, and what guards against it? A live run on the wrong cloud or tenant reports another estate as this one, so the kit checks the CLI's cloud and tenant before its first call, and has no default cloud. A query without a scope covers whatever the account happens to see, so every query takes the management group from the settings. A response's next link could point at another host, so any URL off the commercial Resource Manager host is refused. An unverified call could misread a property and report a false gap, so it's refused in a live run unless you allow it, and Lab 2 compares. And the run folder never goes in a public repository.`,
      detail: `A live run on the wrong cloud or tenant: the kit reads another estate and reports it as this one; Assert-AzsLiveContext checks az cloud show and az account show before the first call; the settings have no default cloud. A query without a scope: every Resource Graph query takes --management-groups from the settings. A REST call that follows a link elsewhere: Get-AzsLiveCommand refuses any URL not on management.azure.com. An unverified call trusted silently: unverified calls stop a live run unless -AllowUnverified; Lab 2 compares the output with the portal. The run folder in a public repository: the README, the labs and the runbook's preflight keep the output outside the repository.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { bullets: [
          "Every call the code makes is in config/calls.json, with its role and Learn page, and the declared-versus-made test passes",
          "Every rule the code can report is in config/rules.json, with its source",
          "The required plans and platform types in config/baseline.json match the agency's decision records",
          "Lab 2 ran in a test subscription, and the unverified calls' output was checked against the portal",
          "Output folders are outside any repository",
        ], pt: 14.5 },
        { callout: "Chapter 02, the public exposure register, builds on the same spine.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 01, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. Every call the code makes is in the call list, with its role and Learn page, and the test that compares declared and made calls passes. Every rule the code can report is in the rules file, with its source. The required plans and platform types match the agency's decision records. Lab 2 ran in a test subscription, and the unverified calls' output was checked against the portal. And output folders live outside any repository. Next, Chapter 2 builds the public exposure register on the same spine.`,
      detail: `Checklist: every call the code makes is in config/calls.json, with its role and Learn page, and the test that compares declared and made calls passes; every rule the code can report is in config/rules.json, with its source; the required plans and platform types in config/baseline.json match the agency's decision records; Lab 2 ran in a test subscription, and the unverified calls' output was checked against the portal; output folders are outside any repository. Next, Chapter 02 builds the public exposure register on the same spine. The guide's Step 1 holds the commands that change the baseline; this chapter only reads it.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
