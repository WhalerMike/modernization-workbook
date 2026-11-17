// Building Defender XDR, Chapter 01 — Access and the Graph Read Path: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/defender-xdr/01-access-and-the-graph-read-path.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-xdr-01-access-graph-read-path/build.js
require("../_build/devwb.js")({
  workbook: "xdr", chapter: 1, dir: __dirname,
  base: "DW_XDR_01_Access_Graph_Read_Path",
  title: "Access and the Graph Read Path",
  map: "Why one read path · what Learn gives · what it leaves · declared calls · the role check · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to the Federal Modernization Workbook's developer workbook, Building Defender XDR. This is Chapter 1: access, and the Graph read path. Every check in this workbook reads through one door. Before anything else, we prove the door is the right one, in the right cloud, and that the people behind it hold only what the design gave them. We'll start from Microsoft Learn's commands, read how the kit declares its calls and checks its roles, and walk two labs, the evidence and the dangers. The chapter is a draft awaiting the owner's review, and the code is illustrative, tested against fixtures.`,
      detail: `The code behind the guide's G1 Service architecture and access. You start with the guide's Validate step, one Get-MgSecurityIncident call, and what it leaves to you. Then you read how the kit declares every call it makes, checks the Graph session before a live run, and compares the role export with the program's role design. Lab 1 runs the access check on fixtures and reads the three findings it raises. Lab 2 signs in to a test tenant and runs the same check.`,
      cite: [],
      ref: "Opening; “In this chapter”",
    },
    {
      part: "Why", title: "Why prove the read path first",
      body: [
        { lead: "Every later chapter reads incidents, hunting results and detection rules through Microsoft Graph. A session in the wrong tenant answers too, and a check that reads an empty list passes." },
        { cols: [[{ bullets: [
          "Run the kit's access check and read its findings",
          "Say which Graph permission and role each later chapter needs",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14.5 }], [{ bullets: [
          "Developers who maintain the kit",
          "The platform owner who owns G1",
          "The ISSO who reviews who holds Defender roles",
        ], label: "Who it's for", color: "teal", pt: 14.5 }]] },
      ],
      sources: "Sources: Chapter 01, opening, “Goal and audience,” “What it leaves to you.”",
      say: `Why start here? Because every later chapter reads through Microsoft Graph: incidents, advanced hunting results and custom detection rules. If the session behind those reads is in the wrong tenant, it still answers, and a check that reads an empty list passes. So by the end of this chapter you can run the kit's access check, read its findings, and say which Graph permission and which role each later chapter needs. It's for the developers who maintain the kit, the platform owner who owns this gate, and the security officer who reviews who holds Defender roles.`,
      detail: `Goal: by the end of this chapter you can run the kit's access check, read its findings, and say which Graph permission and role each later chapter needs. Audience: developers who maintain the kit, the platform owner who owns G1, and the ISSO who reviews who holds Defender roles. You need PowerShell 7.1 or later with Pester 5.`,
      cite: [],
      ref: "“Goal and audience”",
    },
    {
      part: "Why", title: "What the guide and Microsoft Learn give you",
      body: [
        { steps: [
          { title: "Create the custom roles in unified RBAC", text: "Permission groups: Security operations, Security posture, Authorization and settings, Data operations; roles assigned to groups and data sources" },
          { title: "Activate unified RBAC per workload", text: "At least Security Administrator, on Workload settings" },
          { title: "Connect the read path", text: "Connect-MgGraph -Environment Global; SecurityIncident.Read.All and ThreatHunting.Read.All" },
          { title: "Validate", text: "Get-MgSecurityIncident -Top 5: up to five incidents, or none in a new tenant, with no permission error" },
        ], pt: 13.5 },
        { callout: "GCC uses the worldwide Graph endpoint, graph.microsoft.com, so the environment is Global.", label: "GCC: ", icon: "FaCloud", color: "teal" },
      ],
      sources: "Sources: Learn, List incidents; National cloud deployments; Create custom roles with unified RBAC; Activate unified RBAC. Chapter 01, “What the guide and Learn give you.”",
      say: `Start from what the guide and Microsoft Learn already give you. Create the custom roles in Defender's unified role-based access control, in four permission groups, assigned to groups and data sources. Activate it per workload, which needs at least Security Administrator. Connect the read path with Connect M G Graph, the Global environment, and two scopes: security incident read, and threat hunting read. Then validate with Learn's own call: list up to five incidents with no permission error. Learn's national cloud page says GCC uses the worldwide Graph endpoint, so the environment is Global.`,
      detail: `The guide's G1 has three steps: create the custom roles in unified RBAC, activate unified RBAC per workload, and connect the read path with Connect-MgGraph -Environment Global and the scopes SecurityIncident.Read.All and ThreatHunting.Read.All. Its Validate step is Learn's Get-MgSecurityIncident -Top 5. Learn's List incidents page names SecurityIncident.Read.All as the least-privileged permission, and a delegated user also needs Security Reader, Global Reader, Security Operator or Security Administrator. GCC uses the worldwide Graph endpoint, graph.microsoft.com.`,
      cite: ["xdr01-incidents", "xdr01-deployments", "xdr01-rbac", "xdr01-rbac-activate"],
      ref: "“Start with Microsoft Learn's commands” — “What the guide and Learn give you”",
    },
    {
      part: "What", title: "What it leaves to you, and the verdict",
      body: [
        { table: { head: ["Learn and the guide give", "Why it isn't enough", "What the kit adds"], w: [3.2, 3.8, 5.15], rows: [
          ["A Connect-MgGraph line", "A session from another tenant answers too", "A live run refuses a session in another environment or tenant"],
          ["The permission per call, page by page", "Nobody sees the whole job's needs", "config/calls.json: every call, its permission, roles and Learn page"],
          ["A role design in prose", "A portal role list drifts", "The role export compared with config/roles.json"],
          ["Pass on “no permission error”", "A failed read stops a script without saying why", "The read is one result row; the other checks still run"],
        ] }, pt: 12.5 },
        { lead: "Verdict: keep Learn's calls and scopes; build the checks around them, because the read path is only as good as the session and the roles." },
      ],
      sources: "Sources: examples/defender-xdr tests/Core.Tests.ps1, tests/Checks.Tests.ps1. Chapter 01, “What it leaves to you,” “The verdict.”",
      say: `What does that leave to you? A connect line with an environment, but a session left over from another tenant answers too, so the kit refuses a live run in the wrong environment or tenant. Permissions page by page, but nobody sees the whole job's needs, so the kit declares every call with its permission, roles and Learn page. A role design in prose, but a portal role list drifts, so the kit compares the export with the design. And a pass on no permission error, so the kit makes the read one result row and keeps going. The verdict: keep Learn's calls; build the checks around them.`,
      detail: `Each row is pinned by a test in tests/Core.Tests.ps1 or tests/Checks.Tests.ps1. A Connect-MgGraph line with an environment: a session left from another tenant answers too; Assert-XdrGraphContext refuses a live run in another environment or tenant. The permission each call needs: config/calls.json declares every call with its permission, roles and Learn page; Get-XdrRequiredPermission prints them; a call that isn't declared, or one that writes, can't go through the read path. A role design in prose: Test-XdrRoleDesign compares the role export with config/roles.json. A Validate step that passes on no permission error: the read is one row in the results, with the error as its detail.`,
      cite: [],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "Declared calls, and one door for writes",
      body: [
        { table: { head: ["Call", "Method", "Least privilege", "Writes"], w: [3.6, 1.4, 4.6, 1.2], rows: [
          ["incidents-list", "GET", "SecurityIncident.Read.All", "No"],
          ["hunting-query", "POST", "ThreatHunting.Read.All", "No"],
          ["detection-rules-list", "GET", "CustomDetection.Read.All", "No"],
          ["detection-rule-create", "POST", "CustomDetection.ReadWrite.All", "Yes"],
          ["detection-rule-update", "PATCH", "CustomDetection.ReadWrite.All", "Yes"],
        ] }, pt: 13 },
        { cols: [[{ callout: "reads its file and sends nothing (Lab 1).", label: "Fixture invoker: ", icon: "FaClipboardCheck", color: "teal" }], [{ callout: "Invoke-MgGraphRequest on the settings' cloud, after the session check; follows nextLink only on the same host.", label: "Live invoker: ", icon: "FaCloud", color: "navy" }]] },
      ],
      sources: "Sources: Learn, List incidents; runHuntingQuery; List detectionRule. examples/defender-xdr config/calls.json. Chapter 01, “Declared calls and the two invokers.”",
      say: `Here's the call list. Three reads: list incidents, run a hunting query, and list custom detection rules, each with the least-privileged read permission Learn names. And two writes, create and update a detection rule, with the read-write permission. Reads go through one function and one of two invokers. The fixture invoker reads a file and sends nothing; that's Lab 1. The live invoker calls Graph on the settings file's cloud, after the session check, and follows next links only on the same host. A write never goes through the read path. Only the runbook's publish and rollback scripts send one, with an approved hash.`,
      detail: `config/calls.json lists the kit's five calls: three reads (GET /security/incidents, POST /security/runHuntingQuery, GET /security/rules/detectionRules) and two writes (POST and PATCH on detectionRules). Invoke-XdrCall sends a read through an invoker: the fixture invoker (-FixturePath) reads the call's file and sends nothing; the live invoker calls Invoke-MgGraphRequest on the settings file's cloud, after Assert-XdrGraphContext, and follows @odata.nextLink only on the same host. A write never goes through Invoke-XdrCall. Only deploy/Publish-XdrDetections.ps1 and the rollback use Invoke-XdrWrite, with -Apply and an approved SHA-256 (Chapter 09).`,
      cite: ["xdr01-incidents", "xdr01-hunting", "xdr01-rules-list"],
      ref: "“The code” — “Declared calls and the two invokers”",
    },
    {
      part: "What", title: "The role check: six rows",
      body: [
        { table: { head: ["Check", "Passes when"], w: [2.6, 9.55], rows: [
          ["CLOUD", "The settings name a known cloud; the Graph host and environment come from it"],
          ["READ", "incidents-list with $top=5 answers"],
          ["ROLE", "Each designed role exists with exactly its permissions; a role not in the design is a warning"],
          ["RESTRICTED", "Advanced live response is held only by the Tier 0 role"],
          ["PIM", "Every group a role is assigned to is one PIM governs"],
          ["EMERGENCY", "No emergency access group holds a Defender role"],
        ] }, pt: 13 },
        { callout: "the role export is a file the operator makes from the portal (System, Permissions, Microsoft Defender XDR, Roles). Learn names no API for unified RBAC roles on the pages read.", label: "Input: ", icon: "FaTableList", color: "amber" },
      ],
      sources: "Sources: examples/defender-xdr (Invoke-XdrAccess.ps1, config/roles.json). Chapter 01, “The role check,” the “Illustrative code” callout.",
      say: `The access check writes six kinds of row. Cloud: the settings name a known cloud, and the Graph host comes from it. Read: the first read of incidents answers. Role: each designed role exists with exactly its permissions, and a role that isn't in the design is a warning. Restricted: advanced live response is held only by the Tier 0 role. P I M: every group a role is assigned to is one that Privileged Identity Management governs. And emergency: no emergency access group holds a Defender role. The input is a role export the operator files from the portal. Learn names no API for those roles on the pages read.`,
      detail: `The operator files the role export from System > Permissions > Microsoft Defender XDR > Roles, one row per role, in the columns of templates/role-export.csv. Invoke-XdrAccess.ps1 writes results.csv, permissions.csv, the raw first read and a manifest. CLOUD: the settings name a known cloud; the Graph host and environment come from it. READ: incidents-list with $top=5 answers. ROLE: each designed role exists with exactly its permissions; a role not in the design is a warning. RESTRICTED: Advanced live response is held only by the Tier 0 role. PIM: every group a role is assigned to is in the settings' pimGroups. EMERGENCY: no emergency access group holds a Defender role. Illustrative code: the kit doesn't read Defender's roles through an API, and Learn names none for unified RBAC roles.`,
      cite: [],
      ref: "“The role check”; the “Illustrative code” callout",
    },
    {
      part: "Who", title: "Who owns the roles, who reads the result",
      body: [
        { cards: [
          { title: "Platform owner", text: "Owns G1: creates and assigns the roles; changes them under a change record when a row fails", color: "navy" },
          { title: "ISSO", text: "Reviews who holds Defender roles each quarter, with the PIM report", color: "teal" },
          { title: "Developers", text: "Maintain the call list, the invokers and the role check, with their tests", color: "amber" },
        ], pt: 13.5 },
        { callout: "treat the result as a review aid for the ISSO, not the authority on who holds what.", label: "Illustrative code: ", icon: "FaFileShield", color: "red" },
      ],
      sources: "Sources: Chapter 01, “Goal and audience,” the “Illustrative code” callout, “Federal requirements and evidence.”",
      say: `Who's involved? The platform owner owns this gate: creates and assigns the roles, and changes them under a change record when a row fails. The security officer reviews who holds Defender roles each quarter, alongside the Privileged Identity Management report. And developers maintain the call list, the invokers and the role check, with their tests. One caution: Lab 1 reads fictional fixtures, and the role export is a file someone makes. Treat the result as a review aid for the security officer, not as the authority on who holds what.`,
      detail: `Audience: developers who maintain the kit, the platform owner who owns G1, and the ISSO who reviews who holds Defender roles. Evidence owners: the platform owner, with the ISSO reviewing each quarter; the ISSO with the PIM report from Building Privileged Access. Illustrative code: Lab 1 reads fictional fixtures. The role export is a file the operator makes; treat the result as a review aid for the ISSO, not as the authority on who holds what.`,
      cite: [],
      ref: "“Goal and audience”; the “Illustrative code” callout",
    },
    {
      part: "How", title: "Lab 1: run the access check on fixtures",
      body: [
        { terminal: "01-1", lines: "1-3,5,8,10-11,13,17,19", pt: 11 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures). Chapter 01, “Lab 1: fixtures, no tenant,” step 1.",
      say: `Lab 1 needs PowerShell 7 with Pester, in the kit's folder. Step 1 runs the access check on the fixtures. The read passes: five incidents, no permission error. Then three rows fail. The detection engineer role holds advanced live response, which only the Tier 0 role may hold, so both its role row and the restricted row fail. And the responder role is also assigned to a standing group that Privileged Identity Management doesn't govern. The legacy role is a warning: it isn't in the design, so someone records a decision or removes it. Fourteen checks, three failed.`,
      detail: `You need PowerShell 7.1 or later with Pester 5. Work in examples/defender-xdr. Step 1: ./Invoke-XdrAccess.ps1 -SettingsPath tests/fixtures/settings.lab.json -FixturePath tests/fixtures/graph -OutputPath out/access -AsOf 2026-11-16T12:00:00Z. Three rows fail: the detection-engineer role holds Advanced live response (ROLE and RESTRICTED); the responder role is also assigned to SG-SOC-Standing, a group PIM doesn't govern. The Legacy SOC role is a warning. The slide leaves out the passing role rows and the wrapped lines. Access: 14 checks, 3 failed.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” step 1",
    },
    {
      part: "How", title: "Lab 1: the permissions, the manifest, the tests",
      body: [
        { cols: [[{ terminal: "01-2" }, { terminal: "01-4" }], [{ terminal: "01-3", lines: "1,3-6,9-16,24-26" }]], split: 0.56 },
      ],
      sources: "Sources: examples/defender-xdr (fictional fixtures; tests). Chapter 01, “Lab 1: fixtures, no tenant,” steps 2–4.",
      say: `Step 2 reads what each call needs: three reads, each with a read permission, and two writes with read-write custom detection. Step 3 reads the manifest: the task, the time, fixture mode, the one call the check made with its permission and Learn page, a hash for every file, and the result Chapter 8's evidence record carries. Step 4 runs the chapter's tests. All pass, none fail. Delete the output folder when you're done.`,
      detail: `Step 2: Import-Csv out/access/permissions.csv | Format-Table Call, Method, Permission, Writes -AutoSize. Three reads, each with a read permission, and two writes with CustomDetection.ReadWrite.All. Step 3: Get-Content out/access/manifest.json: the task, the time, the mode (Fixture), each call with its permission and Learn page, the SHA-256 of every file (left out of the slide), and the result. Step 4: Invoke-Pester -Path tests/Core.Tests.ps1 -Output None -PassThru | Select-Object PassedCount, FailedCount. Expected result: FailedCount 0. Delete out when you're done: Remove-Item -Recurse -Force out.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 2–4; expected result",
    },
    {
      part: "How", title: "Lab 2: the same check in a test tenant",
      body: [
        { steps: [
          { title: "Sign in to Graph in the environment GCC uses", text: "Connect-MgGraph -Environment Global -TenantId <tenant-id>, with the incident, hunting and detection read scopes" },
          { title: "Run the access check live", text: "./Invoke-XdrAccess.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/access" },
          { title: "Read the rows", text: "READ passes with up to five incidents; an error naming a role means the account lacks one Learn lists; every failing role row is a change record" },
          { title: "Back it out", text: "The check changed nothing: Disconnect-MgGraph" },
        ], pt: 13.5 },
        { callout: "a test tenant, never production, with Defender for Endpoint Plan 2 and the four roles created; an account holding Security Reader through PIM.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, List incidents; National cloud deployments. Chapter 01, “Lab 2: a test tenant.”",
      say: `Lab 2 uses a test tenant, never production, licensed for Defender for Endpoint Plan 2, with the four roles created, and an account that holds Security Reader through Privileged Identity Management. Sign in to Graph in the Global environment with the read scopes. Run the access check without the fixture path. The read row should pass with up to five incidents, or none in a new tenant. An error that names a role means the account lacks one of the four roles Learn lists. Every failing role row is a change under a change record. The check changed nothing, so backing out is just signing out.`,
      detail: `Use a test tenant, never production, licensed for Defender for Endpoint Plan 2, with the four roles created in unified RBAC as the guide's G1 describes. Sign in with an account that holds Security Reader through PIM. Placeholders: <tenant-id>, <settings-file> (your copy of deploy/settings.template.json for the test tenant, with inputs.roleExport naming the role export you filed) and <output-folder>. 1 Connect-MgGraph -Environment Global -TenantId <tenant-id> -Scopes SecurityIncident.Read.All,ThreatHunting.Read.All,CustomDetection.Read.All. 2 ./Invoke-XdrAccess.ps1 -SettingsPath <settings-file> -OutputPath <output-folder>/access. 3 Back it out: Disconnect-MgGraph. Not run by the authors.`,
      cite: ["xdr01-incidents", "xdr01-deployments"],
      ref: "“Lab 2: a test tenant”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.6, 2.3, 1.95, 2.3], rows: [
          ["Each role holds exactly the designed permissions; Advanced live response only in Tier 0", "AC-6", "IAM-ELP", "Platform owner; ISSO quarterly"],
          ["Every assignment to a PIM-governed group; no emergency access group holds a role", "AC-2", "IAM-ELP", "ISSO, with the PIM report"],
          ["The read path works in the tenant's own cloud, with the permissions listed", "AU-9 (4)", "MLA-ALA", "Platform owner"],
        ] }, pt: 12.5 },
        { lead: "The pairs are the guide's G1 row. The kit's records support these controls; the assessor decides them." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5; FedRAMP, Key Security Indicators. Chapter 01, “Federal requirements and evidence.”",
      say: `Here's what this gate proves, against NIST's control catalog. Each role holding exactly its designed permissions, with advanced live response only in Tier 0, supports least privilege. Every assignment going to a governed group, and no emergency access group in a Defender role, supports account management. And a working read path in the tenant's own cloud, with its permissions listed, supports restricting access to audit tools. The indicators are FedRAMP's, as the implementation guide maps them. The records support these controls; the assessor decides them.`,
      detail: `The mappings are the guide's Requirements and KSIs row for G1, held in the kit's config/requirements.json. Each Defender role holds exactly the designed permissions, Advanced live response only in Tier 0 (Lab 1, step 1: results.csv): AC-6; KSI-IAM-ELP; the platform owner, the ISSO reviews it each quarter. Every assignment is to a group PIM governs; no emergency access group holds a role (PIM and EMERGENCY rows): AC-2; KSI-IAM-ELP; the ISSO, with the PIM report from Building Privileged Access. The read path to the security tooling works in the tenant's own cloud, with the permissions listed (READ, permissions.csv): AU-9 (4); KSI-MLA-ALA; the platform owner. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them.`,
      cite: [],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.4, 4.2, 4.55], rows: [
          ["A Graph session in the wrong tenant", "Every check reads another estate, or nothing, and passes", "The live run refuses it"],
          ["A permission added to a role in the portal", "Someone can isolate devices or run live response who shouldn't", "ROLE and RESTRICTED rows"],
          ["A role assigned to a standing group", "Privilege that never expires", "PIM row"],
          ["An emergency access account in a Defender role", "The break-glass account becomes a daily account", "EMERGENCY row"],
          ["A write slipped into the read path", "A check changes the tenant", "The read path refuses any call marked writes"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: examples/defender-xdr (Assert-XdrGraphContext, Test-XdrRoleDesign, Invoke-XdrCall). Chapter 01, “Dangers.”",
      say: `What breaks in production? A Graph session in the wrong tenant: every check reads another estate, or nothing, and passes. The live run refuses it. A permission added to a role in the portal: someone can isolate devices or run live response who shouldn't; the role and restricted rows catch it. A role assigned to a standing group: privilege that never expires; the P I M row. An emergency access account in a Defender role, which turns the break-glass account into a daily account. And a write slipped into the read path: the read function refuses any call marked as a write.`,
      detail: `A Graph session in the wrong tenant: every check reads another estate, or nothing, and passes; guard: Assert-XdrGraphContext refuses the run. A permission added to a role in the portal: someone can isolate devices or run live response who shouldn't; guard: ROLE and RESTRICTED rows against the design. A role assigned to a standing group: privilege that never expires; guard: PIM row. An emergency access account in a Defender role: the break-glass account becomes a daily account; guard: EMERGENCY row; the guide keeps them out of Defender roles. A write slipped into the read path: a check changes the tenant; guard: Invoke-XdrCall refuses any call marked writes.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { cols: [[{ bullets: [
          "The settings file names gcc and the test tenant's ID; no secret in it",
          "The access check's READ row passes in the test tenant",
        ], label: "The read path", color: "navy", pt: 14 }], [{ bullets: [
          "Every ROLE, RESTRICTED, PIM and EMERGENCY row passes, or has a change record",
          "permissions.csv is filed with the role export",
          "The run folder is recorded as evidence (Chapter 08)",
        ], label: "The roles and the record", color: "teal", pt: 14 }]] },
        { callout: "Chapter 02, Onboarding Coverage and Sensor Health, uses the same read path to count the fleet against the inventory.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 01, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. The settings file names GCC and the test tenant's ID, with no secret in it. The read row passes in the test tenant. Every role, restricted, P I M and emergency row passes, or has a change record. The permissions file is filed with the role export. And the run folder is recorded as evidence, which Chapter 8 shows. Next, Chapter 2 uses the same read path to count the fleet against the inventory. Thanks for watching.`,
      detail: `Checklist: The settings file names gcc and the test tenant's ID; no secret in it. The access check's READ row passes in the test tenant. Every ROLE, RESTRICTED, PIM and EMERGENCY row passes, or has a change record. permissions.csv is filed with the role export. The run folder is recorded as evidence (Chapter 08). Next: Chapter 02 — Onboarding Coverage and Sensor Health.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
