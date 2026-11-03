// Attribute-Driven Migration learning path, Module 4: Move Group Policy as code — the module's narrated deck.
// Teaches docs/training/attribute-driven-migration/04-group-policy-as-code.md, Learn-style: objectives, the concepts,
// "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of examples/
// group-policy-as-code, examples/validation-kit and examples/third_party), Lab 2, the federal requirement and evidence,
// a two-question check, and the summary. Every fact comes from the module page, the learning path's verification log,
// Book 19 Chapter 06, or the kit (examples/group-policy-as-code); the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-adm-module-4/build.js \
//                      presentations/training-adm-module-4/Training_ADM_Module_4.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 4: Move Group Policy as code",
  footer: "Federal Modernization Workbook  ·  Attribute-Driven Migration learning path, Module 4: Group Policy as code",
});
const { D, HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
D.pres.title = "Attribute-Driven Migration learning path — Module 4: Move Group Policy as code";
const OUT = process.argv[2] || "Training_ADM_Module_4.pptx";
const M = "Training, Attribute-Driven Migration, Module 4";

// The title slide, as shared.js draws it, with this path's name over the units.
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "ATTRIBUTE-DRIVEN MIGRATION LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Move Group Policy as code", "Attribute-Driven Migration learning path · Guide Gates 0, 5 and 8, with Book 19 Chapter 06",
    ["The gate and the move plan  ·  What Microsoft's samples leave to you  ·  One file per policy", "The linter  ·  Diff, then create  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 4 of the Attribute-Driven Migration learning path: move Group Policy as code. This module serves three of the implementation guide's gates, 0, 5 and 8, and takes Chapter 06 of Building the Attribute-Driven Migration. You'll read Group Policy analytics into a move plan, one row per setting. You'll keep each settings catalog policy as a reviewed file, with an owner and a decision record for every setting. And you'll run a sync that reads the tenant first, and creates only what its dry run showed. Then you'll run it all on your laptop, against a fake Graph and a fixture tenant, and break it on purpose. The code is illustrative: tested against fixtures, not against a production tenant.`,
  `${M} — Unit 1 "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why Group Policy has to move as code");
  tag(s, "Why");
  const b = table(s, "Gates", 1.45, [2.3, 9.85], ["Gate", "What it asks of Group Policy"], [
    ["Gate 0", "Split every GPO by track; the Validate step runs VK-INT-07 on Group Policy analytics"],
    ["Gate 5", "Move each setting to exactly one owner"],
    ["Gate 8", "Cut over by disabling GPO links, never deleting them"],
  ], { fontSize: 13.5, limit: 4.0 });
  callout(s, "Point", b + 0.35, 1.05, "FaUserShield", HEX.red, "The stakes: ",
    "the OU tree scoped Group Policy, and its inheritance retires with it. Moving to Intune changes the baseline of every device.");
  sources(s, "Sources: Module 4, Unit 1 \"Introduction\"; the federal requirement.");
  notes(s,
`Why does this need code? The OU tree scoped Group Policy, and Group Policy inheritance retires with it. So every GPO setting has to land somewhere on purpose. Gate 0 splits every GPO by track, and its Validate step runs VK-INT-07, to show which GPOs Group Policy analytics has imported and how ready they are. Gate 5 moves each setting to exactly one owner. And Gate 8 cuts over by disabling GPO links, never deleting them. Moving Group Policy to Intune changes the baseline of every device. This module is the code between those gates: a plan per setting, a library of reviewed files, and a sync that creates only what a dry run showed.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Explain what VK-INT-07 checks per GPO, and what the move plan adds per setting",
    "Name the plan's dispositions, and what happens to a Conflict",
    "Describe a library file: the policy body Graph receives, and the record around it",
    "Run the dry run and the apply, and read the sync record",
    "Explain why a Drift stops the release, and why the sync never sends PATCH or DELETE",
  ], [
    "Module 2, for how VK-INT-07 is built",
    "Optional: Microsoft Automation, Module 3, for the settings catalog",
    "PowerShell 7.1 or later and Pester 5; no tenant",
  ], 50);
  sources(s, "Sources: Module 4, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about fifty minutes with the lab. You'll explain what VK-INT-07 checks per GPO, and what the move plan adds per setting. You'll name the plan's dispositions, and say what happens to a conflict. You'll describe a library file: the policy body Graph receives, and the record around it. You'll run the dry run and the apply, and read the sync record. And you'll explain why a drift stops the release, and why the sync never sends PATCH or DELETE. Before you start, do Module 2, for how VK-INT-07 is built. Microsoft Automation Module 3 is optional background on the settings catalog and Intune's v1.0 and beta APIs. Lab 1 needs PowerShell 7.1 or later and Pester 5, and no tenant.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 Where this sits
{
  const s = content(SC, "Where the code sits: two rules and beta APIs");
  tag(s, "What");
  const l = panel(s, "Rules", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "TWO RULES SHAPE THE CODE", null, [
    "One owning policy, and one owning tool, per setting: the library holds only settings Intune owns",
    "Build unassigned: assigning is a later, reviewed step",
  ], 13);
  const r = panel(s, "Learn", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "WHAT LEARN SAYS", null, [
    "Group Policy analytics: Windows only, imports GPO XML exports under 4 MB",
    "Migrate is best effort, and stops when two GPOs set one setting differently",
    "The reports and settings catalog policies are beta APIs",
  ], 13);
  callout(s, "Ops", Math.max(l, r) + 0.3, 0.95, "FaListCheck", HEX.navy, "The two rules are this workbook's guidance: ",
    "the operator steps for the GPO sunset are written elsewhere in the workbook. This is the code for two of them.");
  sources(s, "Sources: Module 4, Unit 2; Microsoft Learn: \"Import and analyze your on-premises GPOs using Group Policy analytics,\" \"Create a Settings Catalog policy using your imported GPOs.\"");
  notes(s,
`Start with where the code sits. The operator steps for retiring Group Policy are already written, in this workbook's own guidance. This code serves two of them: importing every in-scope GPO into Group Policy analytics, and creating the policy library as code. Two rules shape it, and both are this workbook's guidance. One owning policy, and one owning tool, per setting, so the library holds only settings Intune owns. And build unassigned: the code creates policies with no assignments, and assigning them is a later, reviewed step. Microsoft Learn sets the stakes. Its page on importing GPOs into Group Policy analytics says the tool is for Windows only, and imports GPO exports under four megabytes. Its page on creating a settings catalog policy from imported GPOs calls the Migrate step best effort, and says it stops when two GPOs set one setting to different values. And Learn's Microsoft Graph reference documents the migration reports and settings catalog policies in beta only.`,
  `${M} — Unit 2 "The gate and the move plan"; Book 19, Chapter 06 — "Where this sits."`);
}

// ================================================================== 5 What the samples leave
{
  const s = content(SC, "What Microsoft's samples leave to you");
  tag(s, "What");
  const b = table(s, "Gaps", 1.45, [5.6, 6.55], ["Microsoft's import sample, run as published", "What examples/group-policy-as-code adds"], [
    ["One POST, created unassigned", "Kept as the model; GPC-04 also refuses assignments in a file"],
    ["Run twice, it creates a second policy with the same name", "The sync reads the tenant first and creates only what's missing"],
    ["Sends to graph.microsoft.com whatever the cloud", "Get-GpcCloud maps each cloud to its host"],
    ["Uses the caller's session, whatever its scopes", "Read.All for the dry run; ReadWrite.All only with -Apply"],
    ["Strips service-set properties silently", "GPC-03 and GPC-07 refuse the file, so the reviewed file is the body"],
    ["Records nothing beyond the screen", "sync-record.json: cloud, scopes, file hashes, IDs created"],
  ], { fontSize: 12.5, limit: 5.4 });
  callout(s, "Verdict", b + 0.25, 0.85, "FaListCheck", HEX.navy, "The verdict: ",
    "use Microsoft's import call as the model for the create; use the sync, which asks what is already there before it writes.");
  sources(s, "Sources: Module 4, Unit 2; Microsoft Learn, \"Migration guide: Set up or move to Microsoft Intune,\" \"Microsoft Graph national cloud deployments\"; microsoft/mggraph-intune-samples.");
  notes(s,
`Microsoft Learn's Intune migration guide points to Microsoft's Intune Graph samples, on GitHub, for exporting and importing policies, and says the scripts change your tenant and come as-is. Their settings catalog folder has an import script. The repository keeps a pinned copy, and a test harness runs it, unmodified, against a fake Graph. Here's what that shows. The import creates the policy with one POST, unassigned. That's kept as the model. But run it twice and it creates a second policy with the same name, because it never reads the tenant. It sends to the worldwide Graph host whatever cloud you signed in to, and Learn's page on Microsoft Graph national cloud deployments gives each cloud its own host. It uses whatever session you opened, whatever its scopes. It silently strips service-set properties, so the body sent isn't the file reviewed. And it records nothing beyond the screen. The example adds a sync that reads the tenant first, a host per cloud, a read-only scope for the dry run, refusals instead of silent edits, and a sync record.`,
  `${M} — Unit 2; Book 19, Chapter 06 — "Start with Microsoft's sample," "The pinned copy," "What it leaves to you."`);
}

// ================================================================== 6 Gate and plan
{
  const s = content(SC, "The gate per GPO, and the move plan per setting");
  tag(s, "What");
  const b = table(s, "Disp", 1.45, [2.5, 4.8, 4.85], ["Disposition", "When", "What happens next"], [
    ["Candidate", "Supported, with an Intune setting definition ID", "A person decides whether it moves, and records it"],
    ["Conflict", "Two GPOs set one definition ID to different values", "The decision record picks the value"],
    ["EndpointSecurity", "An AppLocker or firewall setting", "Built in Endpoint security"],
    ["NoCatalogSetting", "Supported, but no settings catalog definition", "An OMA-URI for a custom profile"],
    ["NotSupported, Deprecated, Unknown", "mdmSupportedState says so", "Stays with the GPO, or is dropped by decision"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Plan", b + 0.25, 0.95, "FaTriangleExclamation", HEX.navy, "The plan decides nothing: ",
    "VK-INT-07 is the gate, per GPO; Get-GpcMovePlan gives each setting a disposition, and a person decides.");
  sources(s, "Sources: Module 4, Unit 2; Microsoft Learn: \"groupPolicySettingMapping resource type\" (Graph beta), \"Create a Settings Catalog policy using your imported GPOs.\"");
  notes(s,
`The read side has two parts. VK-INT-07 is the gate. The validation kit's check reads the migration reports, and fails on any GPO targeted in Active Directory whose readiness isn't complete, and on any in-scope GPO that was never imported. It works per GPO, and doesn't read the settings. The move plan works per setting. It reads each report's setting mappings, which Learn's Graph beta reference documents, and gives every row a disposition. The dispositions are the kit's design. A candidate is supported and has an Intune setting definition, and a person decides whether it moves. A conflict is two GPOs setting one definition to different values: Learn's page on creating a settings catalog policy from imported GPOs says Migrate stops on that case. The decision record picks the value. AppLocker and firewall settings go to Endpoint security, as that page says. And, in this workbook's guidance, the plan decides nothing: Group Policy analytics finds the landing zone, never whether a setting is still needed.`,
  `${M} — Unit 2; Book 19, Chapter 06 — "Read: the gate and the move plan."`);
}

// ================================================================== 7 Library and lint
{
  const s = content(SC, "One file per policy, and the linter's rules");
  tag(s, "What");
  const l = panel(s, "File", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "A LIBRARY FILE IN POLICIES/", "The body, and the record around it", [
    "policy: the body Graph receives, exactly as reviewed",
    "owner and configOwner: who approves a change, which tool owns it",
    "sourceGpos, and a decision record ID per setting",
  ], 13);
  const r = panel(s, "Lint", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "TEST-GPCLIBRARY: GPC-01 TO GPC-10", null, [
    "GPC-02: configOwner must be Intune",
    "GPC-06: one setting definition ID in one policy",
    "GPC-09: every setting has a decision record",
    "GPC-08: a setting that isn't a Candidate is shown",
  ], 13);
  callout(s, "Secret", Math.max(l, r) + 0.3, 0.85, "FaFileShield", HEX.navy, "GPC-10 ",
    "warns on a string whose setting name suggests a secret: anyone who can read device configuration can read it.");
  sources(s, "Sources: Module 4, Unit 3; Microsoft Learn: \"Create deviceManagementConfigurationPolicy\" (Graph beta), \"Apply features and settings on your devices using device profiles.\"");
  notes(s,
`Each settings catalog policy is a JSON file. The policy part is the body Graph receives, exactly as reviewed, in the shape Microsoft Learn's Graph beta reference documents for creating a configuration policy. The rest is the record: who approves a change, which tool owns the settings, which GPOs they came from, and the I D of each setting's decision record. The linter applies ten rules, and they're the kit's design. Four carry this workbook's rules. GPC oh two: the config owner must be Intune, because a setting another tool owns stays with that tool. GPC oh six: one setting definition in one policy, because two policies on one setting is a conflict. GPC oh nine: every setting has a decision record. And GPC oh eight, with the move plan: a setting that isn't a candidate is shown, with its decision. GPC ten warns on a value that looks like a secret: Learn's page on device profiles says anyone who can read device configuration can read such values.`,
  `${M} — Unit 3 "The library, the linter and the sync"; Book 19, Chapter 06 — "Write: one file per policy," "Lint."`);
}

// ================================================================== 8 Diff then create
{
  const s = content(SC, "Diff, then create: one action per policy");
  tag(s, "What");
  const b = table(s, "Act", 1.45, [2.2, 8.65, 1.3], ["Action", "Meaning", "Exit"], [
    ["Create", "Not in the tenant", "0"],
    ["NoChange", "Same settings, description, platform, technology and scope tags", "0"],
    ["Drift", "Differs; the row names each setting added, removed or changed", "2"],
    ["Duplicate", "Two tenant policies have the library's name", "2"],
  ], { fontSize: 13, limit: 3.8 });
  const l = panel(s, "Dry", 0.6, b + 0.25, 6.0, null, HEX.navy, HEX.navyTint, "INVOKE-GPCSYNC.PS1", null, [
    "Without -Apply: a dry run, Read.All, GET only",
    "With -Apply: ReadWrite.All, POST each Create, read it back",
    "Writes nothing on a lint finding, a Drift or a Duplicate",
  ], 13);
  panel(s, "Never", 6.85, b + 0.25, 5.9, null, HEX.red, HEX.redTint, "NEVER PATCH OR DELETE", null, [
    "A policy that differs from Git is a decision for a person",
    "A change is a new version under a new name (design guidance)",
  ], 13);
  sources(s, "Sources: Module 4, Unit 3; Microsoft Learn (Graph beta): \"List deviceManagementConfigurationPolicies,\" \"Update ...\" and \"Delete deviceManagementConfigurationPolicy.\"");
  notes(s,
`The sync is the kit's design. It reads the tenant's settings catalog policies, through the list call Learn's Graph beta reference documents, normalizes both sides, and gives each library policy one action. Create: it isn't in the tenant. No change: the same settings, description, platform, technology and scope tags. Drift: it differs, and the row names each setting that changed. Duplicate: two tenant policies have the library's name. Drift and duplicate exit two. Without the apply option, the sync is a dry run: it signs in with read only, and sends only GET. With apply, it signs in with read-write, POSTs each create, reads it back and compares again. And it writes nothing at all if the lint has a finding, or any policy is drift or duplicate. It never sends PATCH or DELETE, although Learn documents both. A policy that differs from Git is a decision for a person, and, in this workbook's guidance, a change becomes a new version under a new name.`,
  `${M} — Unit 3; Book 19, Chapter 06 — "Diff, then create."`);
}
endModule(SC);

// ================================================================== 9 Try it: gate and sample
{
  const s = content(SL, "Try it: run the gate, then Microsoft's sample twice");
  tag(s, "How");
  const c = code(s, "Gate", 0.6, 1.45, 12.15, [
    "# Step 1, in examples/validation-kit: VK-INT-07 on the fail fixture",
    "PS> (Invoke-VkCheck -CheckId VK-INT-07 -Context $ctx).Details | Format-Table Severity, Object, Issue",
    "Info     FMP-Workstation-Baseline Imported GPO",
    "Finding  Workstation-Drive-Maps   Targeted in AD, migration readiness 'partial': settings Intune can't take over",
    "Finding  Workstation-Scripts      Targeted in AD, migration readiness 'error': settings Intune can't take over",
    "Warn     Workstation-Empty        Targeted in AD, readiness notApplicable: confirm where its settings go",
    "Finding  Workstation-Printers     In scope, but not imported into Group Policy analytics",
    "# Step 2, in examples/group-policy-as-code: the import sample, twice, against the fake Graph",
    "PS> $g.Policies | ForEach-Object { $_['name'] }",
    "FMP-SC-202-Sign-in-and-power",
    "Contoso kiosk lockdown (portal)",
    "FMP-SC-201-Error-reporting-and-dumps",
    "FMP-SC-201-Error-reporting-and-dumps",
    "PS> $g.Calls | Format-Table Method, Uri",
    "POST   https://graph.microsoft.com/beta/deviceManagement/configurationPolicies",
    "POST   https://graph.microsoft.com/beta/deviceManagement/configurationPolicies",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TABLE HEADERS TRIMMED)", pt: 10 });
  line(s, "Read", "Three findings and a warning from the gate. Two POSTs and no GET: the sample never looked.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 1 and 2; examples/validation-kit, examples/group-policy-as-code (fictional).");
  notes(s,
`Try it. Lab 1 runs in PowerShell 7, against fixtures, and nothing signs in. Step one starts in the validation kit, and runs VK-INT-07 on its fail fixture. One GPO is imported. Two are targeted in Active Directory with a readiness of partial or error, so they hold settings Intune can't take over. Those are findings. An empty GPO is a warning: confirm where its settings go. And one in-scope GPO was never imported at all. Step two moves to the group policy folder, and runs Microsoft's import sample twice, with the same file, against the fake Graph. Now the tenant holds error reporting and dumps twice, two policies with the same name. And the calls are two POSTs and no GET. The sample never looked.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 1 and 2.`);
}

// ================================================================== 10 Try it: plan and lint
{
  const s = content(SL, "Try it: build the move plan, and lint the library");
  tag(s, "How");
  const c = code(s, "Plan", 0.6, 1.45, 12.15, [
    "# Step 3: the move plan",
    "PS> $plan | Format-Table Gpo, Setting, Scope, Disposition",
    "FMP-Workstation-Baseline Disable Windows Error Reporting                       device Candidate",
    "FMP-Workstation-Baseline Allow crash dump                                      device Candidate",
    "FMP-Workstation-Baseline Allow live dump                                       device Candidate",
    "FMP-Workstation-Baseline Sign-in and lock last interactive user ...            device Candidate",
    "FMP-Workstation-Baseline Allow hibernate                                       device Conflict",
    "FMP-Workstation-Baseline Inbound rule: Contoso line-of-business app            device EndpointSecurity",
    "FMP-Workstation-Baseline Configure Windows NTP Client                          device NotSupported",
    "FMP-Workstation-Baseline Turn off Internet Explorer 11 First Run               user   Deprecated",
    "Workstation-Power        Allow hibernate                                       device Conflict",
    "Workstation-Power        Prohibit access to Control Panel and PC settings      user   Candidate",
    "Workstation-Drive-Maps   Drive map H: to the home share on fs01.contoso.example user   NotSupported",
    "# Step 4: lint the library against the plan",
    "PS> Test-GpcLibrary -Library (Read-GpcLibrary -Path ./policies) -Plan $plan | Format-List",
    "Severity : Info     Rule : GPC-08     File : fmp-sc-202-sign-in-and-power.json",
    "Issue    : ... allowhibernate has conflicting GPO values ...; decision DR-0105 picks the value",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10 });
  line(s, "Read", "Eleven rows from three GPOs: five Candidate, a two-row Conflict, one EndpointSecurity, two NotSupported, one Deprecated.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 3 and 4; examples/group-policy-as-code/tests/fixtures/tenant.json (fictional).");
  notes(s,
`Step three builds the move plan from the fixture tenant: eleven rows, from three GPOs. Five are candidates, such as disabling Windows Error Reporting and allowing crash dumps. Allow hibernate is a conflict, on two rows, because the baseline GPO and the power GPO set it to different values. The firewall rule goes to Endpoint security. Two rows aren't supported, including a drive map, and one is deprecated. Notice the user-scope rows keep their scope: user settings go to user groups on the HR track. Step four lints the library against that plan. There's one row, an information item, GPC oh eight: the hibernate setting has conflicting GPO values, and decision D R oh one oh five picks the value. That's the conflict shown, with the decision that resolves it. The output on the slide is trimmed.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 3 and 4.`);
}

// ================================================================== 11 Try it: sync and break
{
  const s = content(SL, "Try it: dry run, apply, then break it on purpose");
  tag(s, "How");
  const c = code(s, "Sync", 0.6, 1.45, 12.15, [
    "# Step 5: the dry run, then the apply (both exit 0)",
    "PS> pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -WithPlan",
    "DryRun against https://graph.microsoft.com (2 library file(s))  ...",
    "Create          FMP-SC-201-Error-reporting-and-dumps",
    "NoChange        FMP-SC-202-Sign-in-and-power",
    "PS> pwsh ./powershell/Invoke-GpcSync.ps1 -FixturePath ./tests/fixtures/tenant.json -Apply",
    "Created         FMP-SC-201-Error-reporting-and-dumps",
    "PS> Get-Content ./out/sync-record.json -Raw | ConvertFrom-Json | Format-List Scopes, Created",
    "Scopes  : {DeviceManagementConfiguration.ReadWrite.All}",
    "Created : {00000000-0000-4000-9000-000000000001}",
    "# Step 6: change the hibernate value in one library file, then run the dry run",
    "Drift           FMP-SC-202-Sign-in-and-power: changes device_vendor_msft_policy_config_power_allowhibernate",
    "(exit code 2; with -Apply, still exit 2, and nothing is created, not even SC-201)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10 });
  line(s, "More", "-Cloud usgov exits 1: not one of gcc, global, gcchigh, dod. Step 7: Invoke-Pester ./tests gives Tests Passed: 46.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 5 to 8; examples/group-policy-as-code: Invoke-GpcSync.ps1, tests.");
  notes(s,
`Step five runs the sync. The dry run says create for the error reporting policy, which isn't in the tenant, and no change for sign-in and power, which already matches. Then the apply says created, and both exit zero. The sync record shows the scope the apply asked for, read-write, and the I D it created. Ask for a cloud name the script doesn't know, U S gov, and it exits one: the cloud must be G C C, global, G C C High or D O D. Step six breaks something on purpose. Change the hibernate value in one library file, and the dry run exits two, with a drift that names the setting. Run it with apply, and it still exits two, and nothing is created, not even the error reporting policy. Put the value back. Step seven runs the tests: forty-six pass. Step eight deletes the out folder.`,
  `${M} — Unit 4 "Exercise: Lab 1 (fixtures, no tenant)," steps 5 to 8.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: plan, sync and drill drift in a test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A test tenant with Intune licenses and a test GPO export, never production"],
    ["Read", "Import a test GPO into Group Policy analytics; run VK-INT-07 live as a read-only operator; build the plan live"],
    ["Write", "Dry-run and apply as a Policy and Profile Manager"],
    ["Compare and drill", "Compare with what Migrate builds; change a value in the admin center, and see the Drift"],
    ["Clouds", "In GCC High and DoD, use -Cloud gcchigh or -Cloud dod"],
    ["Back it out", "Step 8 deletes the created policies by the IDs in out/apply/sync-record.json, and the Migrate policy"],
  ], { fontSize: 12.5, limit: 5.3 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow Book 19, Chapter 06, Lab 2, step by step.");
  sources(s, "Sources: Module 4, Unit 5 \"Exercise: Lab 2 (your test tenant)\"; Book 19, Ch 06 \"Lab 2: test tenant.\"");
  notes(s,
`Lab 2 runs the same code against a test tenant with Intune licenses and a test GPO export, never production. Import a test GPO into Group Policy analytics. Run VK-INT-07 live, as a read-only operator, and build the move plan live. Then dry-run and apply as a Policy and Profile Manager. Compare the result with what Group Policy analytics' own Migrate step builds. And drill drift: change a value in the admin center, and watch the dry run report it. In G C C High and D O D, pass the matching cloud option. To back it out, step eight deletes the created policies by the I D's in the sync record, and the Migrate comparison policy. The authors haven't run Lab 2. Follow Chapter 06's Lab 2, step by step.`,
  `${M} — Unit 5 "Exercise: Lab 2 (your test tenant)"; Book 19, Chapter 06 — "Lab 2: test tenant."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 4");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.3, 3.1, 3.75], ["Requirement", "KSI", "Evidence the ISSO keeps"], [
    ["CM-2; CA-7: every in-scope GPO imported and ready, or listed", "KSI-MLA-EVC", "VK-INT-07's ValidationResults.json"],
    ["CM-2; CM-6: each setting has a disposition; conflicts shown", "KSI-SVC-ACM", "The move plan, with the pull request"],
    ["CM-3; CM-6: one owner and one decision record per setting", "KSI-CMT-VTD", "The library in Git, and the decisions"],
    ["CM-3; AC-6: dry run first, then only that; read-only dry run", "KSI-CMT-LMC; KSI-CMT-RMV; KSI-IAM-ELP", "out/sync-record.json"],
    ["CM-3; CA-7: a library that differs stops the release", "KSI-MLA-EVC; KSI-CMT-VTD", "The run log and the pull request"],
    ["SA-11; SR-3: Microsoft's sample pinned and tested", "KSI-SCR-MIT; KSI-CMT-VTD", "snapshot.json and the sample tests"],
  ], { fontSize: 11.5, limit: 5.7 });
  line(s, "KSI", "KSIs are FedRAMP 20x indicators for providers; the agency lines its evidence up with them (design guidance).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 4, Units 1 and 7; NIST SP 800-53 (the SP 800-53B Moderate baseline); FedRAMP, \"Key Security Indicators,\" FedRAMP Consolidated Rules for 2026.");
  notes(s,
`The federal requirement. Moving Group Policy to Intune changes the baseline of every device, so the plan, the library and the sync record are evidence for NIST special publication eight hundred fifty-three's configuration-management controls: C M two, baseline configuration, C M three, configuration change control, and C M six, configuration settings, with C A seven and A C six. VK-INT-07's results show every in-scope GPO imported and ready, or listed. The move plan, saved with the pull request, gives each setting a disposition and shows the conflicts. The library and its decision records give one owner and one decision per setting. The sync record shows what the sync would create, then wrote only that, with a read-only scope for the dry run. A library that differs from the tenant stops the release, and the run log shows it. And Microsoft's sample is pinned and its behavior tested. The Key Security Indicators come from FedRAMP's Consolidated Rules for 2026: they're FedRAMP 20x indicators for providers, and the agency lines its evidence up with them. Which output supports which control is this workbook's reading.`,
  `${M} — Unit 1 "Introduction" (Chapter 06's requirements, KSIs and evidence); Unit 7 "Summary."`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on Group Policy", [
    { q: "Microsoft's import sample runs twice with the same file. What happens?", options: ["a. The second run finds the policy and does nothing", "b. Two policies with the same name are created, because the sample never reads the tenant", "c. The second run updates the first policy"] },
    { q: "One library file differs from the tenant's copy, and you run the sync with -Apply. What does it create?", options: ["a. Only the policies marked Create", "b. Nothing: it exits 2 and writes nothing while any policy is Drift", "c. It updates the drifted policy"] },
  ], "1 b: two POSTs and no GET (step 2). 2 b: a Drift stops the whole apply (step 6).");
  sources(s, "Sources: Module 4, Unit 6 \"Knowledge check,\" questions 1 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: Microsoft's import sample runs twice with the same file. What happens? The answer is b: two policies with the same name are created, because the sample never reads the tenant. You saw the two POSTs and no GET in step two. Second: one library file differs from the tenant's copy, and you run the sync with apply. What does it create? The answer is b: nothing. It exits two, and writes nothing while any policy is drift. Not even the policy that was marked create. You saw that in step six. The module page has two more questions, on the conflict disposition and on the dry run's permission, each linked to the section that answers it.`,
  `${M} — Unit 6 "Knowledge check," questions 1 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 5, machine configuration");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Read Group Policy analytics into a plan per setting",
    "Kept the policies as reviewed files, with decisions",
    "Saw the sync create only what its dry run showed",
    "And nothing at all when library and tenant disagree",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 5: Build machine configuration packages", [
    "A MOF that is the same every time",
    "The release registry",
    "Refuse what it doesn't allow",
  ], 13.5);
  callout(s, "Before", Math.max(l, r) + 0.3, 0.85, "FaListCheck", HEX.teal, "Before shipping: ",
    "work through the Chapter 06 checklist in Book 19.");
  sources(s, "Sources: Module 4, Unit 7 \"Summary\"; Module 5, \"Unit 1: Introduction.\"");
  notes(s,
`To sum up. You read Group Policy analytics into a plan per setting, kept the policies as reviewed files, and saw the sync create only what its dry run showed, and nothing at all when the library and the tenant disagree. The evidence an ISSO keeps: VK-INT-07's run, the move plan with each pull request, the library and its decision records in Git, and the sync record with its scopes, file hashes and created I D's. In Lab 2, add the Intune audit log for the import, the creation and the drift drill. At deployment, Chapter 10 adds the GPO link states before and after. Before shipping, work through the Chapter 06 checklist. Next is Module 5: build machine configuration packages, for the server settings machine configuration owns, with a build that makes the same MOF every time.`,
  `${M} — Unit 7 "Summary"; Module 5 — "Unit 1: Introduction."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/attribute-driven-migration/04-group-policy-as-code.md (Attribute-Driven Migration learning path, Module 4): Units 1 to 7, Lab 1, Lab 2, knowledge check and summary. The learning path index: prerequisites and what you need for the labs.",
  "What the module links for the design: Book 19, Chapter 06 \"Where this sits,\" \"What it leaves to you,\" \"Read: the gate and the move plan,\" \"Write: one file per policy,\" \"Lint,\" \"Diff, then create,\" Lab 2, Checklist; the implementation guide's Gates 0, 5 and 8.",
  "Kit: examples/group-policy-as-code (powershell/GroupPolicyAsCode.psm1; powershell/Invoke-GpcSync.ps1; policies/; tests/fixtures/tenant.json; tests/MicrosoftSampleHarness.ps1), examples/validation-kit (VK-INT-07), examples/third_party/mggraph-intune-samples. Fictional data. Illustrative: tested against fixtures, not against a production tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7.6.9 in a scratch copy of the examples; it matches the module page and data/kit-captures/adm (06-1 to 06-10). Verification: docs/training/attribute-driven-migration/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
