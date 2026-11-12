// Microsoft Automation learning path, Module 4: Azure Arc through Azure Resource Manager and Resource Graph — the module's
// narrated deck. Teaches docs/training/ms-automation-arc.md, Learn-style: objectives, the concepts, a "Try it" slide with the
// real Lab 1 command and output (run November 12, 2026 in examples/ms-automation, the same output the page shows),
// government-cloud differences, the federal requirement and evidence, a two-question check, and the summary. Every fact
// comes from the module page, its footnotes or the kit; the deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ms-automation-module-4/build.js \
//                      presentations/training-ms-automation-module-4/Training_MS_Automation_Module_4.pptx
const P = require("../training-ms-automation-module-1/shared.js")({
  title: "Module 4: Azure Arc through Resource Manager",
  footer: "Federal Modernization Workbook  ·  Microsoft Automation learning path, Module 4: Azure Arc through Resource Manager and Resource Graph",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_MS_Automation_Module_4.pptx";
const M = "Training, Microsoft Automation, Module 4";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SA = "Where agencies are";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Azure Arc through Resource Manager", "Microsoft Automation learning path · Reading and evidencing the Arc server estate, for federal agencies",
    ["Resource Manager versus Graph  ·  Resource Graph and its traps  ·  Machines, extensions, SQL Server, policy", "Product lifecycle  ·  The five checks  ·  Try it: Lab 1  ·  Where agencies are  ·  Evidence"]);
  notes(s,
`Welcome to Module 4 of the Microsoft Automation learning path: Azure Arc through Azure Resource Manager and Resource Graph. The Federal Modernization Workbook's Devices and Endpoints book puts the agency's servers under Azure Arc, and its Data Platform book uses Arc to bring SQL Server under Microsoft Entra I D. After onboarding, the question becomes evidence. None of that is in Microsoft Graph. Arc servers, their extensions, SQL Server instances and Azure Policy are Azure resources, managed through Azure Resource Manager and read in bulk through Azure Resource Graph. In this module you'll learn what changes when a script leaves Graph for Resource Manager, and how to read Resource Graph without silently losing rows. Then you'll run five read-only checks, in Python and PowerShell, against a fictional estate. Like the other modules' checks, they're illustrative: unit-tested against fixtures, not proven against live subscriptions.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the server estate needs its own evidence");
  tag(s, "Why");
  const l = panel(s, "Ask", 0.6, 1.45, 6.3, null, HEX.red, HEX.redTint, "AFTER ONBOARDING, THE QUESTIONS", null, [
    "Which servers lack the monitoring and endpoint protection agents?",
    "Which still reach Azure over the public internet?",
    "Which run an OS or SQL Server version past end of support?",
    "Is each SQL Server instance's host still connected?",
    "Which policy assignments fail, and which enforce nothing?",
  ], 13.5);
  const r = panel(s, "Kit", 7.15, 1.45, 5.6, null, HEX.navy, HEX.navyTint, "NOT A REPEAT OF VK-ARC-01 TO 07", "The validation kit reads other records", [
    "Tags, agent status, baseline compliance per server",
    "CMDB coverage, Update Manager, role assignments, two tools on one setting",
    "This module reads extensions, network path, lifecycle, SQL Server, assignments",
  ], 13);
  callout(s, "Std", Math.max(l, r) + 0.3, 0.95, "FaServer", HEX.teal, "The workbook's server standard: ",
    "Windows Server 2016 gone from production by its January 12, 2027 end of support; 2019 is the minimum. A planning assumption, not a requirement.");
  sources(s, "Sources: Module 4, Unit 1 \"Introduction\"; the validation kit's VK-ARC checks; Book 00, Ch 01, \"The workbook's server standard\"; Book 05, Ch 09.");
  notes(s,
`Why does this matter? Once the servers are under Arc, an assessor asks questions a script can answer. Which servers lack the monitoring and endpoint protection agents? Which still reach Azure over the public internet? Which run an operating system or SQL Server version past the end of support? Is each SQL Server instance's host still connected? And which policy assignments are failing, and which aren't enforcing anything? The validation kit already has seven Arc-track checks on Resource Graph: tags, agent status, baseline compliance, CMDB coverage, Update Manager, role assignments, and two tools on one setting. This module doesn't repeat them. Its checks read other records. One more thing frames the module: the workbook plans on Windows Server 2016 being gone from production by its January twelfth, 2027 end of support, with Windows Server 2019 the minimum. That's the program's planning assumption, not a federal requirement, and any 2016 server that remains is an exception.`,
  `${M} — Unit 1 "Introduction," "How this relates to the validation kit," "The workbook's server standard."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Explain the four ways Resource Manager differs from Graph",
    "Page a Resource Graph query to the end, and say when it can't page",
    "Explain why an empty result can mean no access",
    "Read the machine, extension, SQL Server, assignment and state records",
    "Say which versions are past support, and run the five checks on fixtures",
  ], [
    "Module 1: endpoints, app-only sign-in, paging, throttling",
    "Lab 1: the kit, Python and PowerShell; no subscription",
    "Lab 2: a commercial Azure test subscription with a few Arc servers",
  ], 95);
  sources(s, "Sources: Module 4, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Unit 9 \"Exercise: Lab 2.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about ninety-five minutes with the lab. You'll explain the four ways Resource Manager differs from Graph for a script. You'll page a Resource Graph query to the end, and say when Resource Graph can't page and why that must stop the run. You'll explain why an empty result can mean no access, not a clean estate. You'll read the Arc machine, extension, SQL Server instance, policy assignment and policy state records, and the traps in each. And you'll say which Windows Server and SQL Server versions are past support, and run the five checks on fixtures. You need Module 1. Lab 2 needs a test subscription in commercial Azure, never production, with a few Arc-enabled servers.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 ARM isn't Graph
{
  const s = content(SC, "Resource Manager isn't Graph: four things change");
  tag(s, "What");
  const b = table(s, "Arm", 1.45, [2.6, 4.5, 5.05], ["What changes", "Graph", "Resource Manager"], [
    ["Host and token", "graph.microsoft.com, the Graph scope", "management.azure.com for GCC and commercial; management.usgovcloudapi.net for Azure Government; its own token"],
    ["Who may call", "Application permissions in the token's roles claim", "Azure RBAC decides at each call; every call here needs only Reader (*/read)"],
    ["Versions", "v1.0 or beta", "An api-version on every call: subscriptions 2022-12-01, Resource Graph 2024-04-01, Arc machines 2026-09-01"],
    ["Paging", "@odata.nextLink", "nextLink; Resource Graph pages with $skipToken in the body"],
  ], { fontSize: 12, limit: 5.0 });
  line(s, "Two", "The five checks make two calls: GET /subscriptions, and POST to Resource Graph, a POST that only reads.", b + 0.25, 0.65, 14);
  sources(s, "Sources: Module 4, Unit 2: Learn, Compare Azure Government and global Azure; Azure built-in roles (Reader); Subscriptions - List; Resource Graph REST; Machines - Get.");
  notes(s,
`A script that already calls Graph correctly has four things to change. First, another host and another token. Resource Manager is management dot azure dot com in commercial Azure, and a GCC tenant's subscriptions are commercial Azure, so a GCC script calls that host. GCC High and DoD use Azure Government, management dot us gov cloud api dot net. A token is issued for one resource, so a Graph token can't call Resource Manager. Second, Azure role-based access control, not a permission list. A Resource Manager token carries no roles list; Azure decides at each call from the roles assigned. Every call here needs only the built-in Reader role, whose only action is read. Third, an api-version on every call, set by each resource provider. Fourth, paging: next link, not the O Data next link, and Resource Graph pages differently again. The five checks make just two calls, and the Resource Graph query is a POST only because the query travels in the body.`,
  `${M} — Unit 2 "Resource Manager isn't Graph."`);
}

// ================================================================== 5 Resource Graph traps
{
  const s = content(SC, "Resource Graph: four traps that lose rows quietly");
  tag(s, "What");
  const w = 5.95, g = 0.25;
  const p1 = panel(s, "Empty", 0.6, 1.45, w, null, HEX.red, HEX.redTint, "AN EMPTY RESULT CAN MEAN NO ACCESS", null, [
    "No Reader on a subscription: nothing back, and no error",
    "Every check reports machinesInScope and emptyScope; no scope is refused",
  ], 12.5);
  const p2 = panel(s, "Page", 0.6 + w + g, 1.45, w, null, HEX.navy, HEX.navyTint, "PAGING IS A TOKEN IN THE BODY", null, [
    "At most 1,000 records a page; $top can't exceed 1,000",
    "Repeat the same query and scopes with $skipToken until none comes back",
  ], 12.5);
  const top2 = Math.max(p1, p2) + 0.2;
  const p3 = panel(s, "Trunc", 0.6, top2, w, null, HEX.amber, HEX.amberTint, "SOME QUERIES CAN'T BE PAGED", null, [
    "limit, sample or take; or every output column dynamic or null",
    "resultTruncated with no token: the client raises IncompleteResult",
  ], 12.5);
  const p4 = panel(s, "Sort", 0.6 + w + g, top2, w, null, HEX.teal, HEX.tealTint, "SORT BY A UNIQUE COLUMN", null, [
    "Ties have no guaranteed order: pages can repeat or skip records",
    "Every query ends with order by id asc; a run is a snapshot",
  ], 12.5);
  callout(s, "Lag", Math.max(p3, p4) + 0.25, 0.85, "FaArrowsRotate", HEX.navy, "Not strongly consistent: ",
    "Resource Graph indexes changes with a short latency; policy is reevaluated every 24 hours. Quota: 15 queries per 5 seconds per user.");
  sources(s, "Sources: Module 4, Unit 3: Learn, Overview of Resource Graph; Work with large data sets; Guidance for pagination; throttled requests; policy compliance data.");
  notes(s,
`Resource Graph holds a copy of every resource's properties, in tables you query with the Kusto Query Language. It has four traps. One: an empty result can mean no access. Microsoft Learn says no results come back for objects you can't read, without an error. So every check reports machines in scope and empty scope, the client refuses a query with no scope, and the command line stops when the identity can see no subscriptions. Two: paging is a token in the body. A page holds at most a thousand records; repeat the same query with the skip token until none comes back. Three: some queries can't be paged at all, when they use limit, sample or take, or when every output column is dynamic, as project properties is. Then the client raises an incomplete result rather than return part of one. Four: sort by a unique column, or pages can repeat some records and skip others. Every query ends ordered by I D. And the data isn't strongly consistent, so a check run minutes after a change may not see it.`,
  `${M} — Unit 3 "Resource Graph": "Four traps," "Throttling."`);
}

// ================================================================== 6 Machines, extensions, SQL Server
{
  const s = content(SC, "Machines, extensions and SQL Server: what the checks read");
  tag(s, "What");
  const b = table(s, "Rec", 1.45, [3.5, 8.65], ["Record", "What the checks read"], [
    ["Arc machine", "status; osType, osName, osSku, osVersion; privateLinkScopeResourceId; licenseProfile.esuProfile"],
    ["Extension", "publisher, type, typeHandlerVersion, provisioningState; its ID begins with the machine's ID"],
    ["Required by default", "Azure Monitor Agent (AU-12, SI-4); Microsoft Defender for Endpoint, MDE.Windows or MDE.Linux (SI-3, SI-4)"],
    ["SQL Server instance", "version, edition, status; containerResourceId, the host's ID, for the join"],
  ], { fontSize: 12.5, limit: 4.4 });
  callout(s, "Never", b + 0.25, 0.95, "FaShieldHalved", HEX.red, "Never read the settings: ",
    "an extension's settings are public JSON, and Microsoft's own example is a command line. Every query names its properties; a test fails if one reads settings.");
  sources(s, "Sources: Module 4, Unit 4: Learn, Machines - Get; Machine Extensions - Get; Arc Resource Graph samples; Arc VM extensions; sqlServerInstances template.");
  notes(s,
`Unit 4 is the records. The Arc machine record carries its status, connected, disconnected, error or awaiting connection; its operating system type, name, S K U and version; the private link scope it's assigned to, if any; and its E S U profile, with eligibility and whether a license is assigned. Each extension is its own resource, whose I D begins with the machine's, which is how Microsoft's own sample joins them. The check reads the publisher, type, version and provisioning state. By default it requires two: Azure Monitor Agent, for log and performance collection, and Microsoft Defender for Endpoint, which Defender for Servers deploys. A SQL Server instance enabled by Arc carries its version, edition and status, and the I D of the machine that hosts it. One rule matters more than the rest: never read an extension's settings. They're public JSON, and Microsoft's example is a command line, so a collector that reads them copies commands into the evidence.`,
  `${M} — Unit 4 "Machines, extensions and SQL Server."`);
}

// ================================================================== 7 Policy and lifecycle
{
  const s = content(SC, "Policy enforcement and product lifecycle");
  tag(s, "What");
  const b = table(s, "Life", 1.45, [3.7, 2.6, 5.85], ["Product", "Extended support ends", "On November 3, 2026, the labs' date"], [
    ["Windows Server 2012 and 2012 R2", "October 10, 2023", "Unsupported: ESUs ended October 13, 2026"],
    ["Windows Server 2016", "January 12, 2027", "Ending soon; under the server standard, an exception after that date"],
    ["Windows Server 2019, 2022, 2025", "2029, 2031, 2034", "Supported; 2019 is the workbook's minimum"],
    ["SQL Server 2012", "July 12, 2022", "Unsupported: ESUs ended July 8, 2025"],
    ["SQL Server 2014, 2016", "July 9, 2024; July 14, 2026", "ESU years, through July 8, 2027 and July 17, 2029"],
  ], { fontSize: 11.5, limit: 4.6 });
  callout(s, "Mode", b + 0.2, 1.0, "FaScaleBalanced", HEX.amber, "Enforcement mode: ",
    "Default enforces; DoNotEnforce evaluates and reports but prevents nothing; Enroll enforces only where scopes enrolled. Each DoNotEnforce needs a dated decision.");
  sources(s, "Sources: Module 4, Unit 5: Learn, policy assignment structure; lifecycle pages (checked Nov 3, rechecked Nov 11, 2026); Windows Server 2012 ESUs; SQL Server ESU FAQ.");
  notes(s,
`Unit 5 covers policy and lifecycle. A policy assignment's enforcement mode decides whether its effect applies. Default enforces it. Do not enforce still evaluates and reports compliance, but prevents nothing: the right way to stage a deny policy, but one left there reports noncompliance forever, so each needs a dated decision. Enroll enforces only for enrolled resources. Running a version past its end of support is NIST special publication eight hundred fifty-three's S A twenty-two, unsupported system components. The dates come from Microsoft's lifecycle pages. Windows Server 2012 is unsupported: its extended security updates ended on October thirteenth, 2026, and Arc E S U licenses were deactivated the next day. Windows Server 2016's extended support ends January twelfth, 2027, and under the workbook's server standard, one still in production after that date is an exception. SQL Server 2012 is unsupported, and 2014 and 2016 are in their E S U years. Where two Learn pages disagree, the kit uses the earlier date.`,
  `${M} — Unit 5 "Policy and lifecycle": "Policy assignments and states," "Product lifecycle."`);
}

// ================================================================== 8 Five checks
{
  const s = content(SC, "The five checks and the controls they evidence");
  tag(s, "How");
  const b = table(s, "Checks", 1.45, [2.6, 6.35, 3.2], ["Check", "What it reports", "Evidences"], [
    ["arc-extensions", "Servers missing Azure Monitor Agent or Defender for Endpoint; extensions not Succeeded", "SI-4, SI-3, AU-12, CM-8"],
    ["arc-private-link", "Servers with no Arc private link scope; how many use each scope", "SC-7"],
    ["lifecycle", "Servers and SQL Server by support state; products not in the table", "SA-22, SI-2"],
    ["sql-inventory", "Instances by version and edition; disconnected, or host disconnected or not in scope", "CM-8, CM-8(1)"],
    ["policy-summary", "Enforcement mode and compliance counts; DoNotEnforce; no states; outside states", "CA-7, CM-6, CM-2"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Reader", b + 0.25, 0.95, "FaLock", HEX.teal, "Reader, and nothing else: ",
    "none of the five can change a resource. Extension state isn't agent health, and a private link scope isn't the whole network path (inference).");
  sources(s, "Sources: Module 4, Unit 7 \"The five checks\": NIST SP 800-53 Rev. 5 Moderate baseline (OSCAL 5.2.0); Learn, Arc private link; kit README.");
  notes(s,
`Five checks. Arc extensions lists servers missing Azure Monitor Agent or Defender for Endpoint, and extensions that didn't deploy. Arc private link lists servers with no private link scope, so they reach Azure over public endpoints. Lifecycle sorts servers and SQL Server instances by support state: unsupported, E S U not confirmed, E S U covered, ending soon, and products not in the table, which are never counted as supported. SQL inventory lists instances by version and edition, and the ones that are disconnected or whose host is out of scope. And policy summary shows each assignment's enforcement mode and compliance counts. Every control they evidence is in the NIST Moderate baseline; the mapping is the program's reading, and the assessor decides. All five need only Reader. Two limits to keep in mind: an extension that succeeded isn't proof the agent reports, and a private link scope isn't the whole network path. Confirm those for a sample of servers.`,
  `${M} — Unit 7 "The five checks."`);
}
endModule(SC);

// ================================================================== 9 Try it
{
  const s = content(SL, "Try it: find the servers past their support date");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, step 3, in examples/ms-automation (output trimmed)",
    "$ python python/arc_tasks.py --from-json tests/fixtures/arc.json --as-of 2026-11-03T00:00:00Z lifecycle",
    "  \"counts\": { \"unsupported\": 2, \"esuNotConfirmed\": 2, \"esuCovered\": 0, \"endingSoon\": 1, \"supported\": 4 },",
    "  SRV-LEG-01              Windows Server 2012 R2   \"unsupported\"      2026-10-14T06:59:59Z",
    "  OLD-SQL-07_MSSQLSERVER  SQL Server 2012          \"unsupported\"      2025-07-09T06:59:59Z",
    "  SRV-DB-01_MSSQLSERVER   SQL Server 2016          \"esuNotConfirmed\"  2029-07-17T08:00:00Z",
    "  SRV-LEG-01_MSSQLSERVER  SQL Server 2014          \"esuNotConfirmed\"  2027-07-09T06:59:59Z",
    "  SRV-APP-02              Windows Server 2016      \"endingSoon\"       2027-01-13T06:59:59Z",
    "# Lab 1, step 7: a Resource Graph query with no scope",
    "$ python -c \"...ArmClient('gcc', lambda s: 't').resource_graph('resources | project id')\"",
    "ValueError: give the subscriptions or management groups to query; an empty scope can't be told from no access",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 12, 2026 (AS OF NOVEMBER 3)", pt: 10.5 });
  line(s, "Read", "SRV-LEG-01 has an Arc ESU license Assigned, and is still unsupported: the ESU years ended. SRV-APP-02 is the server standard's case.", c + 0.2, 0.7, 13.5);
  sources(s, "Sources: Module 4, Unit 8 \"Exercise: Lab 1,\" steps 3 and 7; examples/ms-automation: arc_tasks.py, armkit.py, arc-lifecycle.json, tests/fixtures/arc.json.");
  notes(s,
`Try it. Lab 1 runs each check against the kit's fictional estate: one subscription with seven Arc servers, five SQL Server instances and four policy assignments. The from-json option evaluates saved Resource Graph rows instead of calling Azure, and as-of fixes the evaluation date. Here's step three, lifecycle. Two are unsupported. S R V L E G zero one runs Windows Server 2012 R2, and it has an Arc E S U license assigned, but the E S U years ended on October thirteenth, 2026, so no updates come through any channel. And a SQL Server 2012 instance. Two SQL Server instances, 2014 and 2016, are in their E S U years with no confirmed subscription. And S R V A P P zero two runs Windows Server 2016, ending soon: the case the workbook's server standard is about, upgraded before January twelfth, 2027, or a documented exception. Step seven asks for a query with no scope, and the client stops before any request. The lab repeats two checks in PowerShell, with the same results, and twenty-four Arc tests pass.`,
  `${M} — Unit 8 "Exercise: Lab 1 (fixtures, no subscription)," steps 3, 7, 8 and 9.`);
}

// ================================================================== 10 Lab 2
{
  const s = content(SL, "Lab 2: your test subscription, with Reader only");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.4, 9.75], ["Step", "What you do"], [
    ["You need", "A commercial Azure test subscription, never production, with a few Arc-enabled servers"],
    ["Register", "az ad sp create-for-rbac --role Reader --scopes /subscriptions/<id> --create-cert: a certificate, no secret"],
    ["Confirm", "az role assignment list --assignee <app-id> --all: one row, Reader; never Contributor or Owner"],
    ["Run", "arc_tasks.py --cloud gcc --tenant <id> --client <app-id> --cert app.pem --subscription <id> <check>"],
    ["Record", "The osSku your servers report; whether Reader can call Policy Insights' summarize; compare with the portal"],
    ["Back it out", "Delete the role assignment and the app, its certificate, and the saved results"],
  ], { fontSize: 12, limit: 5.4 });
  callout(s, "NotRun", b + 0.25, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "the saved results hold server names and resource IDs, so delete them when you're done.");
  sources(s, "Sources: Module 4, Unit 9 \"Exercise: Lab 2\": Learn, Azure CLI service principal with a certificate; sign in with a service principal; Get compliance data.");
  notes(s,
`Lab 2 runs the checks read-only against your own test subscription in commercial Azure, never production, with a few Arc-enabled servers. One Azure C L I command registers the app with a self-signed certificate and no password, and assigns it Reader on the test subscription. No Graph permission is needed, and never assign Contributor or Owner, which can change every resource in scope. Confirm the app holds one role, Reader, and nothing else. Then run each check, in Python or PowerShell. If machines in scope is zero and you know the subscription has Arc servers, the role hasn't taken effect yet, or it's on the wrong scope. Record two open review items: what operating system S K U your servers report, and whether Reader alone can call Policy Insights' summarize. Compare each result with the portal's Arc, extension, SQL Server and Policy views. Then back it out: remove the role, delete the app and its certificate, and delete the saved results, which hold server names and resource I Ds. The authors haven't run Lab 2.`,
  `${M} — Unit 9 "Exercise: Lab 2 (your test subscription)."`);
}
endModule(SL);

// ================================================================== 11 Where agencies are
{
  const s = content(SA, "Where agencies are: GCC is commercial Azure");
  tag(s, "Who");
  const l = panel(s, "Start", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "THE STARTING STATE", "Onboarding in waves", [
    "Some servers onboarded but missing an agent",
    "Some on public endpoints before the private link scope is ready",
    "Arc makes end-of-support Windows Server and SQL Server visible",
  ], 13);
  const r = panel(s, "Gcc", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "GCC (MODERATE)", "The workbook's baseline", [
    "Subscriptions are in commercial Azure",
    "Scripts call management.azure.com and the commercial sign-in",
    "Use --cloud gcc, as in every module",
  ], 13);
  panel(s, "Int", 0.6, Math.max(l, r) + 0.2, 12.15, null, HEX.amber, HEX.amberTint, "INTERIM PATHS (DESIGN GUIDANCE)", null, [
    "No private link scope yet: arc-private-link findings with a target date; assign the policy in DoNotEnforce, then enforce",
    "Windows Server 2016: upgrade to 2019 or later before January 12, 2027, or an exception: ESUs through Arc, a signed risk acceptance, a retirement date",
  ], 12.5);
  sources(s, "Sources: Module 4, Unit 6 \"Where agencies are\"; Arc track guide, 1.1 and Step 3; Book 00, Ch 01; Book 05, Ch 09.");
  notes(s,
`Where are agencies? The agency in the Devices and Endpoints book is onboarding Windows and Linux servers to Arc in waves. During the move, some servers are onboarded but missing an agent, some connect over the public endpoints before the private link scope is ready, and Arc makes end-of-support Windows Server and SQL Server versions visible. A GCC Moderate estate's subscriptions are in commercial Azure, so its scripts call management dot azure dot com and the commercial sign-in endpoint; use the G C C cloud option, as in every module. The interim paths are design guidance. Servers onboarded before the private link scope exists are findings with a target date; assign the policy that requires the scope in do-not-enforce first, then enforce it. Windows Server 2012 servers still running are a red finding. And each Windows Server 2016 server is upgraded to 2019 or later before January twelfth, 2027, or becomes an exception, with E S Us through Arc, a signed risk acceptance and a retirement date.`,
  `${M} — Unit 6 "Where agencies are": the starting state, GCC, "Interim paths."`);
}

// ================================================================== 12 GCC High and DoD
{
  const s = content(SA, "GCC High and DoD: Azure Government differences");
  tag(s, "Who");
  const b = table(s, "Gov", 1.45, [5.2, 2.3, 2.3, 2.35], ["Service (Azure Government roadmap, Nov 11, 2026)", "FedRAMP High", "DoD IL4", "DoD IL5"], [
    ["Resource Manager; Resource Graph; Arc-enabled servers", "GA", "GA", "GA"],
    ["Arc-enabled SQL Server", "GA", "Awaiting review", "Awaiting review"],
    ["Azure Policy; Azure Private Link", "GA", "GA", "GA"],
  ], { fontSize: 12.5, limit: 3.4 });
  panel(s, "Diff", 0.6, b + 0.25, 12.15, null, HEX.navy, HEX.navyTint, "WHAT CHANGES FOR THE CHECKS", null, [
    "Host management.usgovcloudapi.net, the US Government sign-in, Connect-AzAccount -Environment AzureUSGovernment",
    "SQL Server enabled by Arc: US Gov Virginia only, Windows only, no Entra authentication; sql-inventory sees only those",
    "ESU-only Arc servers need fewer endpoints; Learn doesn't say whether Resource Graph's quota or paging differ",
  ], 12.5);
  sources(s, "Sources: Module 4, Unit 6: Learn, Azure Government GA roadmap; SQL Server enabled by Arc in US Government; Compare Azure Government; Arc ESUs (Nov 11, 2026).");
  notes(s,
`GCC High and DoD estates use Azure Government: management dot us gov cloud api dot net, the US Government sign-in authority, and the Azure US Government environment in PowerShell. Microsoft's Azure Government availability roadmap, read on November eleventh, 2026, shows Resource Manager, Resource Graph, Arc-enabled servers, Azure Policy and Private Link generally available and authorized at FedRAMP High and DoD impact levels four and five. Arc-enabled SQL Server is available at FedRAMP High, and awaiting review at levels four and five. Three differences affect the checks. SQL Server enabled by Arc is a subset there: the US Gov Virginia region only, on Windows only, with no Entra authentication, so SQL inventory sees only those instances. The private link scope is available, with its own endpoints. And E S U-only Arc servers need a smaller set of endpoints. Learn doesn't say whether Resource Graph's quota, paging or tables differ in Azure Government: not yet specified.`,
  `${M} — Unit 6 "Where agencies are": GCC High and DoD.`);
}
endModule(SA);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Arc servers");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.6, 8.55], ["NIST SP 800-53 Rev. 5 Moderate", "What the checks evidence"], [
    ["SI-4, SI-3, AU-12", "System monitoring, malicious code protection and audit records, through the agents"],
    ["SC-7", "Boundary protection, through the network path"],
    ["SA-22, SI-2", "Unsupported system components and flaw remediation"],
    ["CM-8, CM-8(1); CA-7, CM-6, CM-2", "The component inventory; continuous monitoring and configuration settings"],
  ], { fontSize: 12.5, limit: 4.0 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "Each check's dated output with its evidences list and machinesInScope; the app's Reader assignment and scope",
    "A decision for each unsupported server; the ESU record for each esuNotConfirmed instance; a dated decision per DoNotEnforce",
    "Each 2016 server past January 12, 2027: ESUs through Arc, a signed risk acceptance, a retirement date",
  ], 12.5);
  sources(s, "Sources: Module 4, Unit 1 \"The federal requirement\"; Unit 7; Unit 11: NIST SP 800-53 Rev. 5 Moderate baseline (OSCAL 5.2.0); Arc track guide, Step 8.");
  notes(s,
`The federal requirement. Every control the checks evidence is in the NIST special publication eight hundred fifty-three, revision five, Moderate baseline: system monitoring, malicious code protection and audit record generation, through the agents; boundary protection, through the network path; unsupported system components and flaw remediation; the component inventory; and continuous monitoring and configuration settings. The mapping is the program's reading; the agency's assessor decides. The evidence an ISSO keeps: each check's dated output, with its evidences list and machines in scope; the app's Reader role assignment and its scope; a decision for each unsupported server, migrate, upgrade, or isolate and accept the risk; the E S U subscription record for each instance whose coverage isn't confirmed; the dated decision behind each do-not-enforce assignment; and for each Windows Server 2016 server still in production after January twelfth, 2027, the exception record. The Arc track implementation guide's Step 8 puts this on a schedule.`,
  `${M} — Unit 1 "The federal requirement"; Unit 7 "The five checks"; Unit 11 "Summary"; Arc track guide — Step 8, Gate 8.`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on Arc", [
    { q: "A Resource Graph query returns no Arc servers. What's the first thing to check?", options: ["a. Whether Resource Graph is available in the region", "b. Whether the identity has Reader on the scope: Resource Graph returns nothing it can't read", "c. Whether the query used $top"] },
    { q: "A Windows Server 2012 R2 machine has an Arc ESU license Assigned. What does lifecycle report on November 3, 2026?", options: ["a. esuCovered", "b. unsupported: the ESU years ended on October 13, 2026", "c. endingSoon"] },
  ], "1 b: an empty result can mean no access. 2 b: no updates come through any channel after the ESU years.");
  sources(s, "Sources: Module 4, Unit 10 \"Knowledge check,\" questions 1 and 3; Unit 3, \"Four traps\"; Unit 5, \"Product lifecycle.\"");
  notes(s,
`Check yourself with two questions. First: a Resource Graph query returns no Arc servers. What's the first thing to check? The answer is b: whether the identity has Reader on the scope, because Resource Graph returns nothing for resources the caller can't read, and no error. Second: a Windows Server 2012 R2 machine has an Arc E S U license assigned. What does lifecycle report on November third, 2026? The answer is b, unsupported. The E S U years ended on October thirteenth, 2026, so no updates come through any channel, license or not. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — Unit 10 "Knowledge check," questions 1 and 3.`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary: you've finished the path");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Left Graph for Resource Manager: host, token, Azure RBAC, api-versions",
    "Paged Resource Graph without losing rows, and saw when it can't page",
    "Read the machine, extension, SQL Server and policy records",
    "Checked support dates against Microsoft's lifecycle pages",
    "Ran the five checks on fixtures in Python and PowerShell",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "WHERE NEXT", "Put it on a schedule", [
    "The Arc track guide's Step 8 and Gate 8",
    "Planned modules: Teams Phone and Teams administration; monitoring and evidence",
  ], 13.5);
  callout(s, "Path", Math.max(l, r) + 0.3, 0.85, "FaRoute", HEX.teal, "The learning path: ",
    "four modules, about 5 hours 55 minutes in all.");
  sources(s, "Sources: Module 4, Unit 11 \"Summary\"; Module 1, Unit 1 (the modules); Training index; Arc track guide, Step 8 and Gate 8.");
  notes(s,
`To sum up. You learned what changes when a script leaves Graph for Resource Manager: another host and token, Azure role-based access control instead of a permission list, api-versions, and next link. You paged Resource Graph without losing rows, and saw when it can't page and why an empty result can mean no access. You read the Arc machine, extension, SQL Server, policy assignment and policy state records, and checked support dates against Microsoft's lifecycle pages. And in Lab 1 you ran the five checks on fixtures in Python and PowerShell, and read each finding against its control. That finishes the Microsoft Automation learning path as it stands: four modules, about five hours and fifty-five minutes in all. To put the checks on a schedule, go to the Azure Arc track implementation guide's Step 8, and its Gate 8 checks it. Modules on Teams Phone and Teams administration, and on monitoring and evidence, are planned.`,
  `${M} — Unit 11 "Summary"; Module 1 — Unit 1 "Introduction" (the modules).`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/ms-automation-arc.md (Microsoft Automation learning path, Module 4), Units 1 to 11; its footnotes carry each Microsoft Learn page, read November 3, 2026 and rechecked November 11, 2026; its verification log is docs/training/_verification/ms-automation-arc.md.",
  "Microsoft Learn pages the module cites: Compare Azure Government and global Azure; Azure built-in roles (Reader); Subscriptions - List; Resource Graph REST (Resources); Azure permissions for Management and governance; Resource Graph tables; Overview of Resource Graph; Work with large data sets; Guidance for pagination; throttled requests; Resource Manager throttling; Search-AzGraph; Invoke-AzRestMethod.",
  "Also: Machines - Get; Machine Extensions - Get; Arc Resource Graph samples; Azure Monitor Agent; Arc VM extensions; Defender for Endpoint integration; sqlServerInstances template; policy assignment structure; policy compliance data; Policy Resource Graph samples; lifecycle pages; Windows Server 2012 ESUs; Arc ESUs; SQL Server ESUs and FAQ; Arc private link; Azure Government GA roadmap; SQL Server enabled by Arc in US Government; Azure CLI service principals.",
  "NIST SP 800-53 Rev. 5 Moderate baseline (OSCAL 5.2.0). The workbook's server standard: Book 00, Chapter 01. Federal context: Book 05, Chapter 09; the Arc track implementation guide.",
  "Lab output: examples/ms-automation (arc_tasks.py, armkit.py, arm-calls.json, arc-lifecycle.json, FmwArm.psm1, tests/fixtures/arc.json), run November 12, 2026 with Python 3.14.3, as of November 3, 2026, and the same as the page; the Try it output is trimmed. Lab 2 not run by the authors. Design guidance and inferences are labeled.",
]);

finish(OUT);
