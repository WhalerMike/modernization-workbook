// Zero Trust Assessment learning path, Module 2: Running the assessment safely — the module's narrated deck.
// Teaches docs/training/zero-trust-assessment/02-running-the-assessment-safely.md, Learn-style: objectives, the concepts
// (the host and the output, consent and roles, what consent leaves behind, connecting in each cloud, the run), Lab 2's
// exact commands in a test tenant (not run by the authors, as the page says; the module has no Lab 1), the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the Zero Trust
// Assessment implementation guide it sends the learner to (Steps 2 to 5, "Government-cloud availability", and their
// footnotes); the deck adds none. The module page is a draft awaiting review, and the title slide says so.
// Helpers: ../training-zta-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-zta-module-2/build.js \
//                      presentations/training-zta-module-2/Training_ZTA_Module_2.pptx
const P = require("../training-zta-module-1/shared.js")({
  title: "Module 2: Running the assessment safely",
  footer: "Federal Modernization Workbook  ·  Zero Trust Assessment learning path, Module 2: Running the assessment safely",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_ZTA_Module_2.pptx";
const M = "Training, Zero Trust Assessment, Module 2";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 2: Running the assessment safely", "The Zero Trust Assessment as Evidence · The host, consent, each cloud, the run and its hashes",
    ["The host and the output  ·  Consent and roles  ·  What consent leaves behind", "Connecting in each cloud  ·  The run  ·  Lab 2 in a test tenant  ·  Evidence"]);
  notes(s,
`Welcome to Module 2 of The Zero Trust Assessment as Evidence: running the assessment safely. This module is a draft, awaiting the editor's review, so recheck it after the review. The assessment is read-only, but running it takes more privilege than that suggests, and its output is a map of where the tenant is weak. In this module you prepare a host, consent once, run as a reader, connect in the tenant's own cloud, and hash the output before anyone opens it. It covers Steps 2 to 5 of the Zero Trust Assessment implementation guide, and takes about thirty-five minutes, plus Lab 2 in your own test tenant.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: read-only, but privileged, and its output is a map");
  tag(s, "Why");
  const l = panel(s, "Priv", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "MORE PRIVILEGE THAN READ-ONLY SUGGESTS", null, [
    "An administrator consents to the tool's Graph read permissions",
    "The run account needs Global Reader, Security Reader and Azure Reader, among others",
    "SharePoint Administrator, a write-capable role, is one of them",
  ], 13);
  const r = panel(s, "Map", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "THE OUTPUT IS A MAP OF THE TENANT", null, [
    "Microsoft: share the report and export only with authorized personnel",
    "Store the report securely",
    "Delete the local folder once the assessment is complete",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaShieldHalved", HEX.red, "This module: ",
    "a clean host, consent once, run as a reader, connect in the tenant's own cloud, and hash the output before anyone opens it.");
  sources(s, "Sources: Module 2, \"Introduction\"; Guide, Steps 2 and 3; Microsoft Learn, Get started with the Zero Trust Assessment.");
  notes(s,
`Why does this matter? The assessment only reads, but running it takes real privilege. An administrator consents to the tool's Microsoft Graph read permissions, and the run account needs a set of roles: Global Reader, Security Reader, Reader on the Azure subscriptions in scope, and more. One of them, SharePoint Administrator, can write. And the output is sensitive. It's a map of where the tenant is weak. Microsoft's get-started page on Learn says to share the report and export folder only with authorized personnel, to store the report securely, and to delete the local folder once the assessment is complete. So this module treats the run like any other privileged operation: a clean host, consent once, a reader account, the right cloud, and a hash taken before anyone opens a file.`,
  `${M} — "Introduction"; guide, Step 2, Step 3; Microsoft Learn — "Get started with the Zero Trust Assessment."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "Prepare a clean host with PowerShell 7.6, the pinned module and a restricted folder",
    "Explain who consents, who runs, and why the sources' role lists differ",
    "Review the delegated grant consent leaves, and say when not to revoke it",
    "Connect in Commercial, GCC, GCC High or DoD, and confirm the session",
    "Run the assessment and hash its export",
  ], [
    "Module 1",
    "The Privileged Access guide's PIM model: skim it",
    "Lab 2: a test tenant, never production",
  ], 35);
  sources(s, "Sources: Module 2, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll prepare a clean host with PowerShell seven point six, the pinned module, and a restricted report folder. You'll explain who consents, who runs, and why the two sources' role lists differ. You'll review the delegated grant the consent leaves behind, and say when not to revoke it. You'll connect in Commercial, G C C, G C C High or D O D, and confirm the session's tenant and cloud. And you'll run the assessment and hash its export. You need Module 1, and a skim of the Privileged Access implementation guide's pim model, for the run account's eligible roles. Lab 2 runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Host
{
  const s = content(SC, "Unit 1: a clean host and a protected report folder");
  tag(s, "How");
  const l = panel(s, "Host", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "THE HOST", null, [
    "Learn asks for PowerShell 7; the tool's 3.1.0 guide asks for 7.6, for its pinned Exchange module",
    "A dedicated, clean Windows virtual machine",
    "On other platforms, SharePoint Online and Azure Information Protection checks are skipped",
  ], 13);
  const r = panel(s, "Folder", 0.6 + W2 + G2, 1.45, W2, null, HEX.teal, HEX.tealTint, "THE OUTPUT", null, [
    "A new, empty folder for every run",
    "Readable only by the run account and the evidence custodians",
    "The pinned module version, named in the decision record",
  ], 13);
  callout(s, "Logs", Math.max(l, r) + 0.3, 1.0, "FaTriangleExclamation", HEX.amber, "Deleting the report folder isn't enough: ",
    "PowerShell's separate logging folder can also hold tenant data.");
  sources(s, "Sources: Module 2, Unit 1; Guide, Step 2; Microsoft Learn, Get started with the Zero Trust Assessment; Run the Zero Trust Assessment (the tool's guide, 3.1.0).");
  notes(s,
`Unit 1 is the host and the output. Learn asks for PowerShell seven. Release three point one point oh's own guide asks for seven point six or later, because its pinned Exchange module needs it, and recommends a dedicated, clean Windows virtual machine. On other platforms, the SharePoint Online and Azure Information Protection checks are skipped. Install the module version the decision record pins, and nothing newer. Every run gets a new, empty folder that only the run account and the evidence custodians can read. And one thing people miss: deleting the report folder doesn't remove PowerShell's separate logging folder, which can also hold tenant data. The tool's guide says so, and the program treats that folder as part of the output.`,
  `${M} — Unit 1 "The host and the output"; guide, Step 2; Microsoft Learn — "Get started with the Zero Trust Assessment"; the tool's guide, 3.1.0.`);
}

// ================================================================== 5 Consent and roles
{
  const s = content(SC, "Unit 2: consent and roles, two sources side by side");
  tag(s, "Who");
  const tb = table(s, "Roles", 1.45, [2.6, 4.4, 5.15], ["Source", "First run (consent)", "Later runs"], [
    ["Learn, Get started", "Global Administrator, to connect and consent", "Four roles; the same page says a Global Reader is enough"],
    ["The tool's 3.1.0 guide", "Cloud Application Administrator or Application Administrator; consent assigns no runtime role", "Global Reader (validated); Security Reader; SharePoint Administrator for SharePoint tenant commands"],
    ["Graph permissions", "Learn lists 21", "Get-ZtGraphScope in 3.1.0 prints 34, all read"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Follow", tb + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The program follows the tool's guide, ",
    "because it describes the version being run. The consent administrator consents and doesn't run; the run account is a reader, eligible through PIM.");
  sources(s, "Sources: Module 2, Unit 2; Guide, Step 3; Microsoft Learn, Get started with the Zero Trust Assessment; Run the Zero Trust Assessment (the tool's guide, 3.1.0).");
  notes(s,
`Unit 2 is consent and roles, and the two sources don't agree. Learn's get-started page says the first connection needs a Global Administrator, lists four roles for later runs, and on the same page says a Global Reader is enough. The tool's guide for three point one point oh says a Cloud Application Administrator or Application Administrator can grant the delegated consent, and that consent assigns no runtime role. It says the module validates Global Reader for the Graph context, and that the SharePoint tenant commands need SharePoint Administrator. Learn lists twenty-one Graph permissions; Get Z T Graph Scope in three point one point oh prints thirty-four, all read. The program follows the tool's guide, because it describes the version being run. The consent administrator consents and doesn't run the assessment. The run account is a dedicated reader whose roles are activated through pim before each run.`,
  `${M} — Unit 2 "Consent and roles"; guide, Step 3 (the sources side by side; the program's role set); Microsoft Learn — "Get started with the Zero Trust Assessment"; the tool's guide and Get-ZtGraphScope, 3.1.0.`);
}

// ================================================================== 6 What consent leaves behind
{
  const s = content(SC, "What consent leaves behind: a delegated grant");
  tag(s, "What");
  const l = panel(s, "Grant", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "THE GRANT", null, [
    "Recorded on the application the tool signs in through",
    "By default the Microsoft Graph PowerShell app, which other scripts in the tenant share",
    "Every script that uses it inherits the consent",
  ], 13);
  const r = panel(s, "Dedicated", 0.6 + W2 + G2, 1.45, W2, null, HEX.teal, HEX.tealTint, "A DEDICATED APPLICATION", null, [
    "Learn recommends a custom application to isolate the consent",
    "The tool accepts one with -ClientId",
    "The program uses one (design guidance)",
  ], 13);
  const tb = table(s, "Review", Math.max(l, r) + 0.2, [3.3, 8.85], ["When", "What to do"], [
    ["After every version change", "Review the grant: compare its scopes with Get-ZtGraphScope's list"],
    ["When the tool is retired", "Revoke a dedicated application's grant; never the shared one without asking who relies on it"],
  ], { fontSize: 12.5, limit: 6.5 });
  sources(s, "Sources: Module 2, Unit 2; Guide, Step 3 (What consent leaves behind); Graph PowerShell authentication cmdlets; Grant and revoke API permissions in Microsoft Entra ID.");
  notes(s,
`Consent leaves something behind: a delegated permission grant, on the application the tool signs in through. By default that's the Microsoft Graph PowerShell application, which other scripts in the tenant share, so every script that uses it inherits the consent. Learn's page on the Graph PowerShell authentication commands recommends a custom application when you need to isolate the consent it holds, and the tool accepts one with the client I D parameter. The program uses a dedicated application; that's design guidance. Review the grant after every version change, and compare its scopes with the list Get Z T Graph Scope prints. When the tool is retired, revoke a dedicated application's grant, with Learn's revocation command. Never revoke the shared one without asking who else relies on it. Learn also notes that existing tokens stay valid for their lifetime after a grant is deleted.`,
  `${M} — Unit 2; guide, Step 3 ("What consent leaves behind," steps 2 and 4); Microsoft Learn — "Authentication module cmdlets in Microsoft Graph PowerShell" (custom application), "Grant and revoke API permissions in Microsoft Entra ID."`);
}

// ================================================================== 7 Connect
{
  const s = content(SC, "Unit 3: connect in the tenant's own cloud, GCC first");
  tag(s, "How");
  const c = code(s, "Connect", 0.6, 1.45, 12.15, [
    "# GCC (the workbook's baseline) and Commercial: the default Global environment, the worldwide endpoints",
    "Connect-ZtAssessment -Tenant <tenant> -Environment Global -SharePointAdminUrl <spo-admin-url> -UserPrincipalName <upn>",
    "# GCC High",
    "Connect-ZtAssessment -Tenant <tenant> -Environment USGov -ExchangeEnvironmentName O365USGovGCCHigh `",
    "    -SharePointAdminUrl <spo-admin-url> -UserPrincipalName <upn>",
    "# DoD",
    "Connect-ZtAssessment -Tenant <tenant> -Environment USGovDoD -ExchangeEnvironmentName O365USGovDoD `",
    "    -SharePointAdminUrl <spo-admin-url> -UserPrincipalName <upn>",
    "# Confirm the session's tenant and cloud",
    "Get-MgContext | Format-List TenantId, Environment, Account",
  ], { label: "THE GUIDE'S COMMANDS: THE TOOL'S 3.1.0 SOURCE, MATCHED TO LEARN'S PER-SERVICE PAGES", pt: 10.5 });
  const p1 = panel(s, "Silent", 0.6, c + 0.2, W3, null, HEX.navy, HEX.navyTint, "LEARN IS SILENT", null, [
    "Learn's Zero Trust Assessment pages don't mention government clouds; the tool's source does",
  ], 12);
  const p2 = panel(s, "SPO", 0.6 + W3 + G3, c + 0.2, W3, null, HEX.amber, HEX.amberTint, "ALWAYS PASS THE SPO URL", null, [
    "In every cloud; otherwise the tool infers it from the initial domain",
  ], 12);
  const p3 = panel(s, "DoD", 0.6 + 2 * (W3 + G3), c + 0.2, W3, null, HEX.red, HEX.redTint, "DOD: TWO ADDRESSES", null, [
    "Learn and the tool give different Security & Compliance addresses: check it first",
  ], 12);
  if (Math.max(p1, p2, p3) > 6.61) console.warn("  ! Connect panels may overflow");
  sources(s, "Sources: Module 2, Unit 3; Guide, Step 4, \"Government-cloud availability\"; Microsoft Graph national cloud deployments; Connect to Exchange Online PowerShell.");
  notes(s,
`Unit 3 connects. Learn's Zero Trust Assessment pages don't mention government clouds; the tool's source does, and the guide matches its parameters to Learn's page for each service. Start with G C C, the workbook's baseline. A G C C tenant uses the worldwide Graph and Azure endpoints, so it connects with the default Global environment, the same command as commercial. G C C High uses the U S Gov environment, with the Exchange environment name for G C C High. D O D uses U S Gov D O D, with its own Exchange environment name. Then confirm the session's tenant and cloud with Get M G Context. Pass the SharePoint admin U R L in every cloud; otherwise the tool infers one from the initial domain. And in D O D, Learn and the tool give different Security and Compliance addresses. If the data pillar's tests come back disconnected there, check that first.`,
  `${M} — Unit 3 "Connecting in each cloud"; guide, Step 4 (the commands), "Government-cloud availability"; Microsoft Learn — "Microsoft Graph national cloud deployments," "Connect to Exchange Online PowerShell," "Exchange app-only authentication"; the tool's 3.1.0 source, Connect-ZtAssessment.ps1.`);
}

// ================================================================== 8 Gov clouds table
{
  const s = content(SC, "Where agencies are: each service, cloud by cloud");
  tag(s, "Who");
  const tb = table(s, "Gov", 1.45, [2.75, 3.0, 3.1, 3.3], ["Service", "GCC and Commercial", "GCC High", "DoD"], [
    ["Microsoft Graph (Learn)", "graph.microsoft.com; GCC uses worldwide", "graph.microsoft.us", "dod-graph.microsoft.us"],
    ["Exchange Online (Learn)", "No parameter needed", "O365USGovGCCHigh", "O365USGovDoD"],
    ["Security & Compliance", "Default endpoint", "ps.compliance.protection.office365.us", { text: "Learn and the tool's source differ", options: { color: HEX.red, bold: true } }],
    ["Azure (Learn)", "AzureCloud", "AzureUSGovernment", "AzureUSGovernment"],
    ["SharePoint Online admin", "-admin.sharepoint.com", "Pass it explicitly", "DoD's URL not yet specified"],
  ], { fontSize: 11.5, limit: 4.9 });
  callout(s, "Interim", tb + 0.3, 1.05, "FaRoute", HEX.teal, "Interim path: ",
    "until a run is proved in your cloud, run one pillar at a time in a test tenant of the same cloud; ScubaGear stays the federal baseline tool.");
  sources(s, "Sources: Module 2, Unit 3; Guide, \"Government-cloud availability\"; Microsoft Graph national cloud deployments; Connect to Exchange Online PowerShell; Exchange app-only authentication.");
  notes(s,
`Here's where each service stands, cloud by cloud, from the guide's availability table. Microsoft Graph: G C C uses the worldwide graph dot microsoft dot com, G C C High uses graph dot microsoft dot U S, and D O D its own D O D graph host. Exchange Online: no parameter in G C C, and an environment name for each of the other two. Security and Compliance: the default endpoint in G C C; a dot U S address in G C C High; and in D O D, Learn and the tool's source give different addresses, and which one works wasn't tested. Azure: Azure Cloud for G C C, Azure U S Government for the other two. SharePoint admin: pass it explicitly; D O D's isn't yet specified. Until a run has been proved in your own cloud, run one pillar at a time in a test tenant of the same cloud, and keep ScubaGear as the federal baseline tool.`,
  `${M} — Unit 3; guide, "Government-cloud availability" (table and interim path); Microsoft Learn — "Microsoft Graph national cloud deployments," "Connect to Exchange Online PowerShell," "App-only authentication ... Security & Compliance PowerShell," "Quickstart: Connect to Azure Government with PowerShell."`);
}

// ================================================================== 9 The run
{
  const s = content(SC, "Unit 4: the run, then hash the export first");
  tag(s, "How");
  const p1 = panel(s, "Long", 0.6, 1.45, W3, null, HEX.amber, HEX.amberTint, "IT CAN BE LONG", null, [
    "More than 24 hours on a large tenant",
    "Microsoft says not to stop it",
  ], 13);
  const p2 = panel(s, "Tele", 0.6 + W3 + G3, 1.45, W3, null, HEX.navy, HEX.navyTint, "TELEMETRY", null, [
    "-DisableTelemetry suppresses the one event, which carries the tenant ID",
    "Using it is the CISO's decision",
  ], 13);
  const p3 = panel(s, "Hash", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.teal, HEX.tealTint, "HASH, THEN OPEN", null, [
    "Hash the export as soon as the run ends",
    "If it fails: a support package, in the same session",
  ], 13);
  code(s, "Run", 0.6, Math.max(p1, p2, p3) + 0.25, 12.15, [
    "Invoke-ZtAssessment -Path <report-folder> -DisableTelemetry -NoBrowser",
    "Get-FileHash -Algorithm SHA256 -LiteralPath <report-folder>\\zt-export\\ZeroTrustAssessmentReport.json",
  ], { label: "LAB 2, STEP 5 (THE GUIDE'S STEP 5)", pt: 11 });
  sources(s, "Sources: Module 2, Unit 4; Guide, Step 5; Microsoft Learn, Get started with the Zero Trust Assessment; Run the Zero Trust Assessment (the tool's guide, 3.1.0).");
  notes(s,
`Unit 4 is the run itself. On a large tenant it can take more than twenty-four hours, and Microsoft says not to stop it. The disable-telemetry switch suppresses the tool's one telemetry event, which carries the tenant I D. Whether to use it is the see-so's decision, written in the decision record. The no-browser switch keeps the report from opening on screen. As soon as the run ends, before anyone opens or copies a file, hash the export, S H A two fifty-six. That hash is what later shows the output wasn't changed. And if the run fails, capture a support package in the same session, before you close it. The guide's Step 5 has the command, and says to write the package to a separate protected folder.`,
  `${M} — Unit 4 "The run"; guide, Step 5; Microsoft Learn — "Get started with the Zero Trust Assessment"; the tool's guide, 3.1.0 (run, telemetry, support package).`);
}
endModule(SC);

// ================================================================== 10 Lab 2 part 1
{
  const s = content(SL, "Lab 2, steps 1 to 3: host, consent, review the grant");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: prepare the host, in a fresh PowerShell 7 session",
    "$PSVersionTable.PSVersion",
    "Install-PSResource -Name ZeroTrustAssessment -Version 3.1.0 -Scope CurrentUser",
    "New-Item -ItemType Directory -Path <report-folder>",
    "icacls <report-folder> /inheritance:r /grant:r \"${env:USERDOMAIN}\\${env:USERNAME}:(OI)(CI)F\" \"BUILTIN\\Administrators:(OI)(CI)F\"",
    "# Step 2: consent once, as the consent administrator",
    "Import-Module ZeroTrustAssessment",
    "Get-ZtGraphScope",
    "Connect-ZtAssessment -Tenant <tenant> -Service Graph",
    "# Step 3: review the grant, still as the consent administrator",
    "$clientId = (Get-MgContext).ClientId",
    "Connect-MgGraph -Scopes Application.Read.All, DelegatedPermissionGrant.Read.All",
    "$sp = Get-MgServicePrincipal -Filter \"appId eq '$clientId'\"",
    "Get-MgOauth2PermissionGrant -Filter \"clientId eq '$($sp.Id)'\" | Format-List Id, ConsentType, PrincipalId, Scope",
    "Disconnect-MgGraph",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10.5 });
  line(s, "Read", "Scope lists every permission the tool's application holds in the tenant: compare it with Get-ZtGraphScope's list.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 2, \"Exercise: Lab 2,\" steps 1 to 3; Guide, Steps 2 and 3.");
  notes(s,
`Lab 2 runs the real tool in a test tenant, never production. The authors haven't run it, as the page says. You need a test tenant in the cloud you'll assess, with fictional users; a consent administrator; a reader account with Global Reader, Security Reader and SharePoint Administrator, eligible through pim; and a Windows host with PowerShell seven point six. Values you supply are in angle brackets. Step one prepares the host: check the PowerShell version, install the pinned module, create the report folder, and restrict it. Step two consents once, as the consent administrator: print the scopes the tool will request, then connect to Graph and accept the prompt. Step three reviews the grant while you're still signed in. The scope field lists every permission the tool's application now holds in the tenant. Compare it with the list Get Z T Graph Scope printed, and keep the output.`,
  `${M} — "Exercise: Lab 2, a test tenant," "You need," steps 1 to 3.`);
}

// ================================================================== 11 Lab 2 part 2
{
  const s = content(SL, "Lab 2, steps 4 to 6: connect, run, hash, back out");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 4: connect as the reader, after activating its roles in PIM, in a new PowerShell 7 session",
    "Connect-ZtAssessment -Tenant <tenant> -Environment Global -SharePointAdminUrl <spo-admin-url> -UserPrincipalName <upn>",
    "Get-MgContext | Format-List TenantId, Environment, Account",
    "# Step 5: run it and hash the export; keep <report-folder> for Modules 3 and 4",
    "Invoke-ZtAssessment -Path <report-folder> -DisableTelemetry -NoBrowser",
    "Get-FileHash -Algorithm SHA256 -LiteralPath <report-folder>\\zt-export\\ZeroTrustAssessmentReport.json",
    "# Step 6: back it out when you finish the path",
    "Disconnect-ZtAssessment",
    "Connect-MgGraph -Scopes DelegatedPermissionGrant.ReadWrite.All",
    "Remove-MgOauth2PermissionGrant -OAuth2PermissionGrantId <grant-id>",
    "Remove-Item -Recurse -Force <report-folder>",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10.5 });
  callout(s, "Back", c + 0.3, 1.0, "FaTriangleExclamation", HEX.red, "Back it out: ",
    "remove the reader's roles; remove the grant only on a dedicated application, never the shared Graph PowerShell one if anything else uses it.");
  sources(s, "Sources: Module 2, \"Exercise: Lab 2,\" steps 4 to 6; Guide, Steps 4, 5 and 10.");
  notes(s,
`Step four connects as the reader, after activating its roles in pim, in a new PowerShell session. The command on the slide is for G C C and commercial; for G C C High or D O D, use the connection commands from the guide's Step 4 instead. Then confirm the session's tenant, environment and account. Step five runs the assessment and hashes the export. Keep the report folder: Modules 3 and 4 read it. Step six backs it all out, when you finish the path. Disconnect, and remove the reader's role assignments in the test tenant. If you consented on a dedicated application, remove its grant as a Cloud Application Administrator, with the grant I D from step three. Don't revoke the shared Microsoft Graph PowerShell grant if anything else in the tenant uses it. Then delete the report folder.`,
  `${M} — "Exercise: Lab 2," steps 4 to 6 ("You'll replace"; the GCC High and DoD note).`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 2");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["CM-6: the host's pinned versions", "KSI-SVC-ACM, KSI-MLA-EVC", "Module and PowerShell versions for each run"],
    ["AC-6: read roles only, just in time; consent separate from the run", "KSI-IAM-ELP, KSI-IAM-JIT", "Role assignments, PIM activations, the grant review"],
    ["CA-2 and CA-7: the run, in the tenant's own cloud", "KSI-PIY-RIS, KSI-MLA-EVC", "The connection context; the export's SHA-256"],
    ["AU-9: output protected from modification", "KSI-MLA-OSM", "Hashes taken before anyone opened the files"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers that the agency lines its evidence up with.");
  sources(s, "Sources: Module 2, \"The federal requirement,\" \"Summary\"; Guide, Steps 2 to 5; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five. C M six, configuration settings: the host's pinned module and PowerShell versions, recorded for each run. A C six, least privilege: read roles only, activated just in time, with the consent administrator separate from the run account; the evidence is the role assignments, the pim activations, and the grant review. C A two and C A seven: the assessment run, in the tenant's own cloud; the evidence is the connection context and the export's hash. And A U nine, protection of audit information: hashes taken before anyone opened the files. Each row lines up with a fed-ramp twenty X key security indicator. The evidence supports the controls; the assessor decides.`,
  `${M} — "The federal requirement" table; "Summary"; guide, Steps 2 to 5 (requirements and evidence).`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on Module 2", [
    { q: "Learn lists 21 Graph permissions; Get-ZtGraphScope in 3.1.0 prints 34. Which list does the consent review compare against?", options: ["a. Learn's, because Learn is the primary source", "b. Get-ZtGraphScope's, because it's what the version you're running requests", "c. Neither; consent is all or nothing"] },
    { q: "A GCC tenant connects with which -Environment value?", options: ["a. Global, because GCC uses the worldwide Graph and Azure endpoints", "b. USGov", "c. USGovDoD"] },
  ], "1 b: compare with the version you run. 2 a: GCC uses Global, the same as commercial.");
  sources(s, "Sources: Module 2, \"Knowledge check,\" questions 1 and 3; Units 2 and 3; Guide, Step 3, \"Government-cloud availability.\"");
  notes(s,
`Check yourself with two questions. First: Learn lists twenty-one Graph permissions, and Get Z T Graph Scope in three point one point oh prints thirty-four. Which list does the consent review compare against? The answer is b: Get Z T Graph Scope's, because it's what the version you're running requests. Second: a G C C tenant connects with which environment value? The answer is a, Global, because G C C uses the worldwide Graph and Azure endpoints. U S Gov is for G C C High, and U S Gov D O D for D O D. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 3, and "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: a safe run, hashed before it's opened");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Prepared a clean host with the pinned module and a restricted folder",
    "Consented once, and reviewed the grant consent left behind",
    "Connected in the tenant's own cloud, GCC first",
    "Ran the assessment as a reader and hashed its export",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3", [
    "From results to a closure register: normalize, dispose, register, route and weigh",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the module and PowerShell versions, the grant review, the reader's roles and PIM activations, the connection context, and the export's SHA-256.");
  sources(s, "Sources: Module 2, \"Summary\"; learning path index; Module 3.");
  notes(s,
`To sum up. You prepared a clean host with the pinned module and a restricted report folder. You consented once, as a consent administrator, and reviewed the grant the consent left behind. You connected in the tenant's own cloud, starting with G C C. And you ran the assessment as a reader and hashed its export before anyone opened it. The evidence an I S S O keeps from this module: the module and PowerShell versions, the grant review, the reader's role assignments and pim activations, the connection context, and the export's hash. Next is Module 3, from results to a closure register, where the kit turns an export into findings with owners.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/zero-trust-assessment/02-running-the-assessment-safely.md (The Zero Trust Assessment as Evidence, Module 2), a draft awaiting review; the path's verification log is docs/training/zero-trust-assessment/_verification/learning-path.md.",
  "Zero Trust Assessment: An Implementation Guide, Steps 2 to 5, \"Government-cloud availability\"; its footnotes carry each source, read November 11, 2026: Microsoft Learn, Get started with the Zero Trust Assessment; Graph PowerShell authentication cmdlets; Grant and revoke API permissions in Microsoft Entra ID; Microsoft Graph national cloud deployments; Connect to Exchange Online PowerShell; Exchange app-only authentication; Connect to Azure Government with PowerShell.",
  "The tool, release 3.1.0: Run the Zero Trust Assessment (the tool's guide); its source for Connect-ZtAssessment and Get-ZtGraphScope.",
  "NIST SP 800-53 Rev. 5 (CM-6, AC-6, CA-2, CA-7, AU-9); FedRAMP 20x KSIs, as Book 13, Appendix A maps them. The Privileged Access implementation guide (the PIM model).",
  "Lab 2's commands are the page's, with its placeholders; the module has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
