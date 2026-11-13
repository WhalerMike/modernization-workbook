// Global Secure Access learning path, Module 1: Decide, design and log first — the module's narrated deck.
// Teaches docs/training/global-secure-access/01-decide-design-and-log-first.md, Learn-style: objectives, the concepts
// (the run order and the beta API, the decision per function, where agencies are, the reference architecture, logs before
// the pilot), Lab 2's exact commands in a test tenant (not run by the authors, as the page says; the path has no Lab 1),
// the federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module page and
// the Global Secure Access implementation guide it sends the learner to (Steps 1, 2 and 12, the availability table, the
// reference architecture, TIC 3.0 alignment, and their footnotes); the deck adds none.
// Helpers: ./shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-gsa-module-1/build.js \
//                      presentations/training-gsa-module-1/Training_GSA_Module_1.pptx
const P = require("./shared.js")({
  title: "Module 1: Decide, design and log first",
  footer: "Federal Modernization Workbook  ·  Global Secure Access learning path, Module 1: Decide, design and log first",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_GSA_Module_1.pptx";
const M = "Training, Global Secure Access, Module 1";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;

// ================================================================== 1 Title
{
  const s = title(SI, "Module 1: Decide, design and log first", "Global Secure Access as the Identity-Aware Network · Steps 1, 2 and 12's logging",
    ["The run order  ·  The decision per function  ·  Where agencies are", "The reference architecture  ·  Logs before the pilot  ·  Lab 2 in a test tenant"]);
  notes(s,
`Welcome to Module 1 of Global Secure Access as the Identity-Aware Network: decide, design and log first. Global Secure Access is Microsoft's security service edge, Entra Internet Access and Entra Private Access, used as the agency's identity-aware network layer. This path teaches the twelve steps of the Global Secure Access implementation guide in six modules, in the order the guide runs them. This first module covers Step 1, the decision and licensing, Step 2, the reference architecture, and the logging half of Step 12. It takes about forty-five minutes, plus a lab in your own test tenant.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: three functions, three gates, and logs first");
  tag(s, "Why");
  const l = panel(s, "Gates", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "ONE NAME, THREE GATES", null, [
    "The Microsoft traffic profile comes with Entra ID P1 or P2",
    "Internet Access and Private Access are licensed separately, or with the Microsoft Entra Suite",
    "So the decision is made per function, not for the product",
  ], 13);
  const r = panel(s, "Logs", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "NOTHING BLOCKS WITHOUT A RECORD", null, [
    "The network logs go on before the first pilot user does",
    "Every later Validate step reads them",
    "Nothing blocks before its path exists",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaRoute", HEX.navy, "This module: ",
    "decide each function, write the architecture down for your tenant, take the first hashed export, and turn on the telemetry.");
  sources(s, "Sources: Module 1, \"Introduction\"; Guide, Step 1, Where each topic lives; Microsoft Learn, What is Global Secure Access? (licensing).");
  notes(s,
`Why start here? Global Secure Access is three things under one name. The Microsoft traffic profile comes with Entra I D P one or P two. Internet Access and Private Access are licensed separately, or come with the Microsoft Entra Suite. Each has its own gate, so the decision is made per function, not for the product. And because nothing should block before there is a record of what it blocked, the network logs go on before the first pilot user does. Every later Validate step in this path reads those logs. So in this module you decide each function, write the architecture down for your tenant, take the first hashed configuration export, and turn on the telemetry.`,
  `${M} — "Introduction"; guide, Step 1 (licensing per function), "Where each topic lives" (run order).`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Explain why the guide runs its steps out of numeric order",
    "Decide each function on its own gate, with an availability quote and exit criteria",
    "Name the reference architecture's seven zones and planes, and their owners",
    "Export the configuration as hashed evidence, and say why the beta API runs by hand",
    "Turn on the four network log categories and check each is fresh",
  ], [
    "Network and Transport, Chapter 05: the gates",
    "Security Operations and Telemetry, Chapter 03: the log categories",
    "Lab 2: a test tenant, never production",
  ], 45);
  sources(s, "Sources: Module 1, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll explain why the guide runs its steps out of numeric order. You'll decide each function on its own gate, and record the decision with a dated availability quote and exit criteria. You'll name the reference architecture's seven zones and planes, and who owns each. You'll export the configuration as hashed evidence, and say why the beta network access A P I is run by hand. And you'll turn on the four network log categories and check that each is fresh. Before you start, read Network and Transport, chapter five, for the gates, and skim Security Operations and Telemetry, chapter three, for the log categories. The lab runs in a test tenant, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Run order and beta
{
  const s = content(SC, "Unit 1: the run order, and a beta API run by hand");
  tag(s, "What");
  const tb = table(s, "Order", 1.45, [1.7, 10.45], ["Order", "Steps, as the guide runs them"], [
    ["First", "1 Decision and licensing  ·  2 Reference architecture  ·  12 Telemetry (logging only)"],
    ["Then", "3 Client  ·  4 Microsoft traffic  ·  7 Compliant network  ·  8 Tenant restrictions"],
    ["Then", "6 Private applications  ·  10 Privileged protocols  ·  5 Internet traffic  ·  9 TLS inspection"],
    ["Last", "11 Coexistence and migration  ·  12 again, for the evidence package"],
  ], { fontSize: 13, limit: 3.9 });
  const l = panel(s, "Beta", 0.6, tb + 0.25, W2, null, HEX.amber, HEX.amberTint, "THE GRAPH API IS BETA", null, [
    "Learn: beta APIs are subject to change, and not supported in production applications",
    "Run Learn's requests interactively; keep each result as evidence",
  ], 12.5);
  panel(s, "Place", 0.6 + W2 + G2, tb + 0.25, W2, l - tb - 0.25, HEX.teal, HEX.tealTint, "ONE SET OF PLACEHOLDERS", null, [
    "Every lab in the path uses the guide's placeholder table",
    "Replace each value once, everywhere",
  ], 12.5);
  sources(s, "Sources: Module 1, Unit 1; Guide, How to read this guide, Where each topic lives; Microsoft Learn, Microsoft Graph network access APIs (preview).");
  notes(s,
`Unit 1 is the order. The guide's steps are numbered to match the twelve network topics of the Zero Trust closure update, but they run in a different order, so the logs exist before anything is enforced, and nothing blocks before its path exists. First the decision, the architecture, and Step twelve's logging. Then the client, Microsoft traffic, the compliant network, and tenant restrictions. Then private applications, privileged protocols, internet traffic, and T L S inspection. Last, coexistence and migration, and Step twelve again, for the evidence package. This path follows that order. One more rule: Microsoft's network access A P I's are on the Graph beta endpoint. Learn says beta A P I's are subject to change and not supported in production applications. So the guide runs Learn's requests by hand, as an administrator, and keeps each result as evidence. Every lab uses the guide's placeholder table.`,
  `${M} — Unit 1 "The run order and the beta API"; guide, "How to read this guide" (the Graph API is beta; placeholders), "Where each topic lives" (run order); Microsoft Learn — Graph network access API overview.`);
}

// ================================================================== 5 Decision per function
{
  const s = content(SC, "Unit 2: one decision per function");
  tag(s, "What");
  const tb = table(s, "Funcs", 1.45, [2.6, 4.6, 4.95], ["Function", "License (with Entra ID P1 or P2)", "What it carries"], [
    ["Microsoft traffic", "Included in P1 or P2", "Source IP restoration, compliant network check, universal tenant restrictions"],
    ["Internet", "Internet Access or Microsoft Entra Suite", "Web content filtering, threat intelligence, TLS inspection"],
    ["Private", "Private Access or Microsoft Entra Suite", "Quick Access, per-app access, private DNS, DC sensors"],
    ["Branch", "At least 50 P1 and Internet Access licenses combined", "Remote networks over IPsec; no Private Access"],
  ], { fontSize: 12, limit: 4.7 });
  callout(s, "Choice", tb + 0.3, 1.25, "FaScaleBalanced", HEX.navy, "Each row decides: ",
    "adopt, retain the current VPN or SSE, coexist, or defer; with a dated availability quote, the license held, compensating controls, exit criteria and an approver.");
  sources(s, "Sources: Module 1, Unit 2; Guide, Step 1, Government cloud and licensing; Microsoft Learn, What is Global Secure Access?; Known limitations for Global Secure Access.");
  notes(s,
`Unit 2 is the decision, one row per function, because the gates differ. The Microsoft traffic profile is included in P one or P two, and with it come source I P restoration, the compliant network check, and universal tenant restrictions. Internet Access needs its own license or the Microsoft Entra Suite, and carries web content filtering, threat intelligence, and T L S inspection. Private Access is the same: its own license or the Suite, for Quick Access, per-app access, private D N S, and the domain controller sensors. Branches use remote networks, which need at least fifty P one and Internet Access licenses combined, and carry no Private Access. For each row, the decision record says adopt, retain the current V P N or S S E, coexist, or defer. And it carries a dated availability quote, the license held, compensating controls, exit criteria, and an approver.`,
  `${M} — Unit 2; guide, Step 1 (1.1, 1.2 decision record), "Government cloud and licensing, feature by feature" (table; remote network licensing from Book 09, Chapter 05).`);
}

// ================================================================== 6 Where agencies are
{
  const s = content(SC, "Where agencies are: available in GCC, feature by feature");
  tag(s, "Who");
  const l = panel(s, "GCC", 0.6, 1.45, W3, null, HEX.teal, HEX.tealTint, "GCC", "Available", [
    "Learn's product-wide sentence",
    "No feature page narrows or widens it",
  ], 12.5);
  const m = panel(s, "Preview", 0.6 + W3 + G3, 1.45, W3, null, HEX.amber, HEX.amberTint, "PREVIEW FEATURES", "Not yet specified", [
    "Cloud firewall for clients, Explicit Forward Proxy",
    "Adopted only by a decision record",
  ], 12.5);
  const r = panel(s, "Recheck", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.navy, HEX.navyTint, "RE-READ IT", "Before each ring", [
    "The table is as of November 11, 2026",
    "Learn's limitations page can change",
  ], 12.5);
  callout(s, "Interim", Math.max(l, m, r) + 0.3, 1.25, "FaRoute", HEX.teal, "Retain-current or defer: ",
    "the row names its compensating controls, such as the current FedRAMP-authorized SSE, per-application VPN access lists, and named-location Conditional Access.");
  sources(s, "Sources: Module 1, Unit 2; Guide, Government cloud and licensing, Step 1.2; Known limitations for Global Secure Access.");
  notes(s,
`Where are agencies? Learn's known limitations page covers the whole product: Global Secure Access is available in G C C. No feature page read for the guide narrows or widens that, so the G C C column rests on that one sentence. A preview feature, such as the cloud firewall for clients or the Explicit Forward Proxy, has a G C C availability that is not yet specified, and the guide adopts one only by a decision record. The table is as of November eleventh, 2026, so re-read the limitations page before each ring. And where a row of the decision record says retain the current service, or defer, it names its compensating controls: for example, the current fed-ramp authorized S S E, per-application V P N access lists, and named-location Conditional Access.`,
  `${M} — Unit 2 "Where agencies are, and the decision per function"; guide, "Government cloud and licensing, feature by feature," Step 1.2 (compensating_controls); Microsoft Learn — "Known limitations for Global Secure Access."`);
}

// ================================================================== 7 Architecture
{
  const s = content(SC, "Unit 3: the reference architecture's zones and planes");
  tag(s, "What");
  const tb = table(s, "Zones", 1.45, [2.65, 5.6, 3.9], ["Zone or plane", "What sits there", "Owner"], [
    ["Managed endpoint", "Windows client, Intune policy, device identity", "Platform owner (endpoint)"],
    ["Branch", "Customer premises equipment with an IPsec tunnel", "Platform owner (network)"],
    ["Control plane", "Conditional Access; decides, never carries traffic", "Policy owner"],
    ["Policy plane", "Forwarding and security profiles, TLS policies, signaling", "Platform owner"],
    ["Data plane", "Microsoft's service edge, commercial Azure regions", "Microsoft (provider)"],
    ["Private network", "Connector groups, private DNS, apps, DC sensors; outbound only", "Platform owner; app owners"],
    ["Evidence", "Log Analytics workspace, Sentinel, the evidence store", "Security monitor"],
  ], { fontSize: 11.5, limit: 5.6 });
  callout(s, "Make", tb + 0.2, 0.75, "FaClipboardCheck", HEX.teal, "Step 2 makes it the agency's: ",
    "profiles per population, connector groups (two connectors each), DNS suffixes, branches, and where telemetry lands.");
  sources(s, "Sources: Module 1, Unit 3; Guide, The reference architecture (trust boundaries and planes), Step 2.");
  notes(s,
`Unit 3 is the reference architecture, the first of the guide's six artifacts. It has seven zones and planes. Managed endpoints carry the Windows client, Intune policy and the device identity. Branches send traffic over an I P sec tunnel, with no user identity on it. The control plane, Conditional Access, decides, and never carries traffic. The policy plane holds the forwarding and security profiles, the T L S policies and signaling. The data plane is Microsoft's service edge in commercial Azure regions, and the provider owns it. The agency's private network holds connector groups, private D N S, applications and domain controller sensors, all outbound only. And the evidence zone is the workspace, Sentinel and the evidence store. Step 2 makes it the agency's: which profiles each population gets, how many connector groups and where, with two connectors minimum each, the private D N S suffixes, which branches use remote networks, and where telemetry lands.`,
  `${M} — Unit 3 "The reference architecture"; guide, "The reference architecture" (the trust boundaries and planes table), Step 2.`);
}

// ================================================================== 8 Logs first
{
  const s = content(SC, "Unit 4: logs before the pilot, and CISA's visibility");
  tag(s, "How");
  const l = panel(s, "Cats", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "ONE DIAGNOSTIC SETTING, FOUR CATEGORIES", null, [
    "NetworkAccessTrafficLogs",
    "NetworkAccessConnectionEvents",
    "RemoteNetworkHealthLogs",
    "NetworkAccessAlerts",
  ], 13);
  const r = panel(s, "Keep", 0.6 + W2 + G2, 1.45, W2, null, HEX.amber, HEX.amberTint, "WHY EXPORT", null, [
    "The service keeps traffic and remote network health logs for 30 days",
    "A freshness query runs daily",
    "A sudden drop in traffic volume is an alert in itself",
  ], 13);
  callout(s, "CISA", Math.max(l, r) + 0.3, 1.25, "FaShieldHalved", HEX.red, "TIC 3.0: ",
    "the Remote User Use Case says CISA's visibility must be preserved through telemetry sharing; agree the path with the TIC delegates before the VPN's web path is retired.");
  sources(s, "Sources: Module 1, Unit 4; Guide, Step 12, TIC 3.0 alignment; Microsoft Learn, Global Secure Access logs and monitoring; TIC 3.0 Remote User Use Case v2.2.");
  notes(s,
`Unit 4 is the logs, before the pilot. Learn says the service keeps traffic and remote network health logs for thirty days; longer retention needs export through diagnostic settings. So a dedicated Entra diagnostic setting sends four categories to the workspace: network access traffic logs, connection events, remote network health logs, and network access alerts. Sign-in and audit logs stay on the core setting. A freshness query runs daily, and a sudden drop in traffic volume is an alert in itself, because it covers offboarding, a disabled profile, or an outage. And there's a federal reason. CISA's Remote User Use Case says that as users connect more directly to external services, CISA's visibility must be preserved through telemetry sharing. Moving users off a full-tunnel V P N moves their telemetry to Microsoft, so agree how it reaches CISA with the agency's tick delegates before the V P N's web path is retired.`,
  `${M} — Unit 4 "Logs before the pilot"; guide, Step 12 (12.1 to 12.3), "TIC 3.0 alignment" (telemetry); Microsoft Learn — "Global Secure Access logs and monitoring," "Security operations for network access"; CISA — TIC 3.0 Remote User Use Case, §8.`);
}
endModule(SC);

// ================================================================== 9 Lab 2 part 1
{
  const s = content(SL, "Lab 2, steps 1 to 3: licenses, status, export");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Steps 1 and 2: the lab folder, the read scopes, the licenses and the onboarding state",
    "New-Item -ItemType Directory -Path <lab-folder>; Set-Location <lab-folder>",
    "Connect-MgGraph -Environment Global -Scopes \"Organization.Read.All\",\"NetworkAccess.Read.All\"",
    "Get-MgSubscribedSku | Select-Object SkuPartNumber, ConsumedUnits, ... | Export-Csv .\\gsa-01-licenses.csv -NoTypeInformation",
    "Invoke-MgGraphRequest -Method GET -Uri \"https://graph.microsoft.com/beta/networkAccess/tenantStatus\" |",
    "    ConvertTo-Json -Depth 5 | Out-File .\\gsa-01-tenant-status.json",
    "# Step 3: export the baseline, with the guide's scopes (nine Graph URIs: profiles, policies, settings,",
    "# connectors and connector groups, Conditional Access and named locations)",
    "foreach ($k in $uris.Keys) { Invoke-MgGraphRequest -Method GET -Uri $uris[$k] | ConvertTo-Json -Depth 20 | Out-File \"$out\\$k.json\" }",
    "Get-ChildItem $out | Get-FileHash -Algorithm SHA256 | Export-Csv \"$out\\manifest.csv\" -NoTypeInformation",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS  ·  FULL COMMANDS ON THE MODULE PAGE", pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The guide's Validate: ",
    "the tenant status shows the tenant onboarded; the license count covers the pilot and ring 1; the export folder and its hash manifest exist.");
  sources(s, "Sources: Module 1, \"Exercise: Lab 2,\" steps 1 to 3; Guide, Steps 1.1, 2.1 and their Validate.");
  notes(s,
`The lab runs in a test tenant, never production, and the authors haven't run it, as the page says. There's no fixture lab in this path, because the guide has no kit yet. You need a test tenant with Global Secure Access onboarded, an administrator with the Global Secure Access Administrator or Security Administrator role activated through pim, Graph PowerShell, and Azure C L I. Steps one and two make a lab folder, connect with read scopes, and export the licenses and the tenant's onboarding status. Compare the licenses by product name with Learn's licensing section. Step three takes the baseline export: nine Graph requests, each written to a file, then a S H A two fifty-six hash manifest. The slide abbreviates; the module page has every command in full. The guide's Validate: the tenant shows onboarded, the license count covers the pilot and the first ring, and the export folder and its manifest exist.`,
  `${M} — "Exercise: Lab 2, a test tenant," "You need," steps 1 to 3; guide, Step 1.1, Step 2.1, Validate.`);
}

// ================================================================== 10 Lab 2 part 2
{
  const s = content(SL, "Lab 2, steps 4 and 5: telemetry on, then freshness");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 4: turn on the network telemetry, in Bash (Security Administrator); Module 6 removes it",
    "az rest --method PUT \\",
    "  --uri \"${ARM}/providers/microsoft.aadiam/diagnosticSettings/gsa-network-telemetry?api-version=2017-04-01\" \\",
    "  --body \"{ workspaceId, and the four categories: NetworkAccessTrafficLogs, NetworkAccessConnectionEvents,",
    "            RemoteNetworkHealthLogs, NetworkAccessAlerts }\"",
    "az rest --method GET --uri \"${ARM}/providers/microsoft.aadiam/diagnosticSettings?api-version=2017-04-01\" -o jsonc",
    "# Step 5: in the workspace's Logs, the freshness query",
    "union isfuzzy=true withsource=Table NetworkAccessTraffic, NetworkAccessConnectionEvents, RemoteNetworkHealthLogs, NetworkAccessAlerts",
    "| where TimeGenerated > ago(1d)",
    "| summarize Rows = count(), Last = max(TimeGenerated) by Table",
  ], { label: "LAB 2  ·  A TEST TENANT, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS", pt: 10 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Expect: ",
    "the GET lists gsa-network-telemetry with the four categories. No pilot traffic yet, so few rows: run the query again after Module 2.");
  sources(s, "Sources: Module 1, \"Exercise: Lab 2,\" steps 4 and 5; Guide, Step 12.1 and Validate.");
  notes(s,
`Step four turns on the telemetry, in Bash, as a Security Administrator. The guide's command puts a diagnostic setting named G S A network telemetry on the tenant, pointing at your test workspace, with the four categories enabled. This is the lab's first write to the tenant, and Module 6 removes it. The GET that follows should list the setting, with the four categories and your workspace. Step five checks freshness. In the workspace's Logs, run the guide's union query across the four tables. The guide's Validate is that each category has rows within an hour of pilot traffic. There's no pilot traffic yet, so expect few or no rows now. Run the query again after Module 2's lab, and keep both results as evidence.`,
  `${M} — "Exercise: Lab 2," steps 4 and 5; guide, Step 12.1, Step 12 Validate.`);
}
endModule(SL);

// ================================================================== 11 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 1");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.0, 3.0, 4.15], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["PL-2, SA-9, CA-3: each function decided and approved", "Not mapped (a decision record)", "Decision record, license export, tenant status, availability quote"],
    ["SC-7, AC-4, CM-2, CM-8: boundaries, planes and flows documented", "KSI-CNA-ULN, KSI-PIY-GIV", "Architecture record; the hashed export"],
    ["AU-2, AU-6, AU-12, SI-4: network logs exported and fresh", "KSI-MLA-OSM, KSI-MLA-LET, KSI-MLA-RVL", "Diagnostic setting GET; freshness result"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The evidence supports the controls; ",
    "the assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers that the agency lines its evidence up with.");
  sources(s, "Sources: Module 1, \"The federal requirement,\" \"Summary\"; Guide, Federal requirements and KSIs, by step; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five. The decision supports P L two, S A nine and C A three: each function decided and approved, with its availability, license, compensating controls and exit criteria. A decision record isn't mapped to a key security indicator. The architecture supports S C seven, A C four, C M two and C M eight: boundaries, planes and flows documented and exported, lined up with two fed-ramp twenty X indicators. And the telemetry supports A U two, A U six, A U twelve and S I four: the network logs exported and fresh, lined up with three monitoring indicators. The evidence supports the controls; your organization still sets their parameters and owns the policy, and the assessor decides whether each is satisfied.`,
  `${M} — "The federal requirement" table; guide, "Federal requirements and KSIs, by step" (Steps 1, 2 and 12).`);
}

// ================================================================== 12 Check
{
  const s = check(SS, "Check yourself: two questions on Module 1", [
    { q: "A preview feature is in your plan. What is its GCC availability in the guide's table?", options: ["a. Available, because the product is available in GCC", "b. Not yet specified: the product-wide sentence doesn't cover preview features", "c. Not available"] },
    { q: "Why does the guide run Step 12's logging before Step 3?", options: ["a. The diagnostic setting can't be created after the client is deployed", "b. So the logs exist before anything is enforced, and every later Validate step has a record to read", "c. Learn requires steps to run in numeric order"] },
  ], "1 b: preview features are not yet specified. 2 b: logs before anything is enforced.");
  sources(s, "Sources: Module 1, \"Knowledge check,\" questions 1 and 2; Units 1 and 2; Guide, availability table, Where each topic lives.");
  notes(s,
`Check yourself with two questions. First: a preview feature is in your plan. What is its G C C availability in the guide's table? The answer is b: not yet specified, because the G C C column rests on Learn's product-wide sentence, and that doesn't cover preview features. Second: why does the guide run Step twelve's logging before Step three? The answer is b: so the logs exist before anything is enforced, and every later Validate step has a record to read. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 2, and "Check your answers."`);
}

// ================================================================== 13 Summary
{
  const s = content(SS, "Summary: decided, designed, and logging first");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Decided each function on its own gate",
    "Wrote the architecture down for your tenant",
    "Took the first hashed configuration export",
    "Turned on the network telemetry before any pilot",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2", [
    "The client and Microsoft traffic: package, count, enable, and measure",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the decision record and its approver, the license and tenant status exports, the architecture record, the hashed export, the diagnostic setting GET and freshness result.");
  sources(s, "Sources: Module 1, \"Summary\"; learning path index; Module 2.");
  notes(s,
`To sum up. You decided each function on its own gate, wrote the architecture down for your tenant, took the first hashed configuration export, and turned on the network telemetry before anyone was in a pilot. The evidence an I S S O keeps from this module: the decision record with its dated availability quote and approver, the license and tenant status exports, the architecture record, the export folder with its manifest, the diagnostic setting GET, and the freshness result. Next is Module 2, the client and Microsoft traffic, where you package the client, count the devices the service sees, and enable the Microsoft traffic profile for the pilot.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/global-secure-access/01-decide-design-and-log-first.md (Global Secure Access as the Identity-Aware Network, Module 1); the path's verification log is docs/training/global-secure-access/_verification/learning-path.md.",
  "Global Secure Access & Zero Trust Network Engineering: An Implementation Guide: How to read this guide, Where each topic lives, Government cloud and licensing, TIC 3.0 alignment, The reference architecture, Steps 1, 2 and 12; its footnotes carry each source, read November 11, 2026.",
  "Microsoft Learn: What is Global Secure Access?; Known limitations for Global Secure Access; Microsoft Graph network access APIs (preview); Update conditionalAccessSettings (beta); Common operations for Global Secure Access; Global Secure Access logs and monitoring; Security operations for network access.",
  "CISA, TIC 3.0 Remote User Use Case v2.2 (telemetry requirements). NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.",
  "Lab 2's commands are the module page's, abbreviated on the slides, with the guide's placeholders; the path has no Lab 1, and Lab 2 wasn't run by the authors.",
]);

finish(OUT);
