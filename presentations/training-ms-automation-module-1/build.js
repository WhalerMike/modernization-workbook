// Microsoft Automation learning path, Module 1: Graph and Azure Foundations — the module's narrated deck.
// Teaches docs/training/ms-automation-foundations.md, Learn-style: objectives, the concepts, a "Try it" slide with the
// real Lab 1 commands and output (run November 1, 2026 in examples/ms-automation), government-cloud differences, the
// federal requirement and evidence, a two-question check, and the summary. Every fact comes from the module page or the
// kit; the deck adds none. Helpers: ./shared.js (the technical deep dive's slides.js and the deeper dive's code panel).
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-ms-automation-module-1/build.js \
//                      presentations/training-ms-automation-module-1/Training_MS_Automation_Module_1.pptx
const P = require("./shared.js")({
  title: "Module 1: Graph and Azure Foundations",
  footer: "Federal Modernization Workbook  ·  Microsoft Automation learning path, Module 1: Graph and Azure Foundations",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_MS_Automation_Module_1.pptx";
const M = "Training, Microsoft Automation, Module 1";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SA = "Where agencies are";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 1: Graph and Azure foundations", "Microsoft Automation learning path · Graph and Azure Foundations, for federal tenants",
    ["Clouds and endpoints  ·  Signing in as a workload  ·  Permissions and tools", "Four request patterns  ·  Try it: Lab 1  ·  Where agencies are  ·  Evidence"]);
  notes(s,
`Welcome to Module 1 of the Microsoft Automation learning path: Graph and Azure foundations. The books keep asking for evidence a script collects: Conditional Access exported as code, device compliance read back, control evidence gathered on a schedule. Almost all of it goes through Microsoft Graph. This module covers what every such script has to get right before it does anything useful: which cloud it calls, how it signs in without a secret, which permissions it asks for, and four request patterns. Then you'll see the example client prove each rule on a laptop, with no tenant. Modules 2 and 3 apply all of this to Entra ID and Intune.`,
  `${M} — Unit 1 "Introduction."`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the collector has to be right first");
  tag(s, "Why");
  const b = table(s, "Traps", 1.45, [3.4, 4.6, 4.15], ["What the first collector does", "What goes wrong", "What this module teaches"], [
    ["Works in a commercial test tenant", "Fails, or sends its token to the wrong host, the day it points at GCC High", "Pick the cloud first"],
    ["Reads the first page of users", "Reports a 100-user tenant and looks correct", "Follow every next link"],
    ["Signs in with a client secret", "Nobody rotates it; ScubaGear says block application passwords", "Sign in as a workload, without a secret"],
    ["Asks for broad permissions", "A compromised job can do more than read", "Least-privileged application permissions"],
  ], { fontSize: 13, limit: 4.9 });
  callout(s, "Point", b + 0.3, 0.95, "FaTriangleExclamation", HEX.red, "The cost: ",
    "a collector that doesn't page, retry and keep delta links produces evidence that looks complete, and isn't.");
  sources(s, "Sources: Module 1, Unit 1 \"Introduction,\" \"The answer in brief\"; Unit 5 \"What this means for the books.\"");
  notes(s,
`Why start here? Picture your first evidence collector. It works in a commercial test tenant. Then, the day it points at a GCC High tenant, it fails, or worse, sends its token to the wrong host. It reads the first page of users and reports a tenant of a hundred people, and nobody notices because the number looks plausible. It signs in with a client secret that nobody rotates, though ScubaGear says application passwords should be blocked. And it asks for broad permissions, so a compromised job could do more than read. Each of those has a fix, and each fix is a unit in this module. The cost of skipping them is simple: a collector that doesn't page, retry and keep delta links produces evidence that looks complete, and isn't.`,
  `${M} — Unit 1 "Introduction," "The answer in brief"; Unit 5 "What this means for the books."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Choose the sign-in host, Graph host and PowerShell environment for commercial, GCC, GCC High or DoD",
    "Pick a credential for a scheduled script, and say who can consent to its permissions",
    "Find the least-privileged application permission, and what a narrow one hides",
    "Describe the four request patterns and the advanced-query header",
    "Run the client's cloud, permission and host checks on a laptop",
  ], [
    "A terminal; Python or PowerShell you can read",
    "You know what an access token is",
    "Lab 1: Python 3.10+, pytest, PowerShell 7.5+ with Pester 5",
    "No tenant until Lab 2",
  ], 85);
  sources(s, "Sources: Module 1, Unit 1 \"Learning objectives,\" \"Prerequisites\"; Training index, \"What you need for the Microsoft Automation labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of the module, which takes about eighty-five minutes with the lab. You'll choose the right sign-in host, Graph host and PowerShell environment for a commercial, GCC, GCC High or DoD tenant. You'll pick a credential for a scheduled script and know who can consent to its permissions. You'll find the least-privileged permission for a call, and know what a narrow permission hides. You'll describe the four request patterns. And you'll run the example client's checks yourself. For the lab you need Python and PowerShell on a laptop. You don't need a tenant until Lab 2.`,
  `${M} — Unit 1 "Learning objectives," "Prerequisites"; Training index, "What you need for the Microsoft Automation labs."`);
}
endModule(SI);

// ================================================================== 4 Clouds and endpoints
{
  const s = content(SC, "Clouds and endpoints: pick the cloud first");
  tag(s, "What");
  const b = table(s, "Clouds", 1.45, [2.3, 3.2, 3.15, 1.6, 1.9], ["Tenant", "Sign-in (authority)", "Microsoft Graph", "Graph PS", "Az / CLI"], [
    ["Commercial", "login.microsoftonline.com", "graph.microsoft.com", "Global", "default"],
    ["Microsoft 365 GCC", "login.microsoftonline.com", "graph.microsoft.com", "Global", "default"],
    ["Microsoft 365 GCC High", "login.microsoftonline.us", "graph.microsoft.us", "USGov", "AzureUSGovernment"],
    ["Microsoft 365 DoD", "login.microsoftonline.us", "dod-graph.microsoft.us", "USGovDoD", "as GCC High"],
  ], { fontSize: 13, limit: 4.4 });
  callout(s, "GCC", b + 0.3, 1.0, "FaCloud", HEX.navy, "GCC is the worldwide service: ",
    "Microsoft says a GCC environment should \"continue using the worldwide endpoints.\" GCC High and DoD have their own hosts.");
  sources(s, "Sources: Module 1, Unit 2: Microsoft Learn, Graph national cloud deployments; Get-MgEnvironment; Azure Government connection guides (Oct. 25, 2026).");
  notes(s,
`Microsoft Graph and Entra ID run as separate national cloud deployments, and a script has to call the hosts of the cloud its tenant lives in. Commercial and Microsoft 365 GCC tenants use the same worldwide hosts: login dot microsoftonline dot com for sign-in and graph dot microsoft dot com for Graph, with the Global environment in Graph PowerShell. Microsoft's own words are that a GCC environment should continue using the worldwide endpoints. GCC High and DoD both sign in at login dot microsoftonline dot U S. GCC High's Graph host is graph dot microsoft dot U S, and DoD's is dod dash graph dot microsoft dot U S. In Graph PowerShell those are the U S Gov and U S Gov DoD environments, and Azure PowerShell and the Azure CLI switch to Azure U S Government.`,
  `${M} — Unit 2 "Clouds and endpoints."`);
}

// ================================================================== 5 Government cloud beyond hosts
{
  const s = content(SC, "What changes in a government cloud beyond hosts");
  tag(s, "What");
  const l = panel(s, "Changes", 0.6, 1.45, 7.6, null, HEX.navy, HEX.navyTint, "BEYOND THE HOSTS", null, [
    "The scope names the cloud: https://graph.microsoft.us/.default for GCC High",
    "azure-identity signs in to the public cloud unless given the government authority",
    "Apps are registered per cloud: a commercial app can't read a GCC High tenant",
    "Graph Explorer isn't supported on the GCC High, DoD or China endpoints",
    "Every Graph API page has a national cloud table: check it first",
  ], 14);
  panel(s, "Retest", 8.45, 1.45, 4.3, null, HEX.amber, HEX.amberTint, "DESIGN GUIDANCE", "Retest in the real cloud", [
    "A query proved in Graph Explorer has to be retested against the government endpoint",
    "GCC's gaps are features, not endpoints: Book 10, Chapter 04",
  ], 13.5);
  callout(s, "Quote", l + 0.3, 0.9, "FaKey", HEX.navy, "Microsoft: ",
    "\"Apps can only access organizational data through the national cloud endpoints.\"");
  sources(s, "Sources: Module 1, Unit 2: Learn, Graph national cloud deployments; national clouds with the Graph SDKs; Azure Identity for Python; List methods (Oct. 25, 2026).");
  notes(s,
`Beyond the hosts, five things change. The token's scope names the cloud, so app-only tokens for GCC High ask for graph dot microsoft dot U S slash dot default. The Python azure-identity credential signs in to the public cloud unless you give it the Azure Government authority. Apps are registered per cloud: an app registered in a commercial tenant can't read a GCC High tenant's data. Graph Explorer isn't supported on the GCC High, DoD or China endpoints, so a query you proved in Graph Explorer has to be retested against the government endpoint. That's design guidance. And every Graph API reference page has a national cloud table; check it before you rely on an API in a new cloud. GCC needs none of this, but it can lack features, which is Book 10's subject.`,
  `${M} — Unit 2 "Clouds and endpoints," "What changes in a government cloud."`);
}

// ================================================================== 6 Signing in as a workload
{
  const s = content(SC, "Sign in as a workload, without a secret");
  tag(s, "How");
  const b = table(s, "Creds", 1.45, [2.6, 4.4, 5.15], ["Credential, in order", "Use it when", "Why"], [
    ["Managed identity", "The script runs on an Azure resource or an Arc-enabled server", "No credential to store or rotate, at no extra cost"],
    ["Workload identity federation", "GitHub Actions, Kubernetes, or a platform that issues its own tokens", "The app trusts the platform's tokens; no secret is stored"],
    ["Certificate", "Anywhere else, such as an on-premises scheduler", "Microsoft recommends a CA-issued certificate over a secret"],
    ["Client secret", "Avoid", "ScubaGear: block application passwords (MS.AAD.5.5v1)"],
  ], { fontSize: 13, limit: 4.7 });
  callout(s, "Consent", b + 0.3, 1.05, "FaUserShield", HEX.amber, "Consent: ",
    "Microsoft Graph application permissions need a Privileged Role Administrator. The two application administrator roles can't consent to Graph app roles.");
  sources(s, "Sources: Module 1, Unit 3: Learn, managed identities; Arc managed identity; workload identity federation; certificate credentials; admin consent. ScubaGear aad.md.");
  notes(s,
`A scheduled script signs in as itself, not as a person: an app registration and its service principal, with application permissions, using the client credentials flow. What matters is what the app proves its identity with. In order of preference, which is design guidance from the sources: a managed identity when the script runs on an Azure resource or an Arc-enabled server, because there's no credential to store or rotate. Workload identity federation for GitHub Actions, Kubernetes, or any platform that issues its own tokens. A certificate issued by a certificate authority anywhere else, which Microsoft recommends over a secret. And a client secret, which you avoid: ScubaGear says application passwords should be blocked. Then consent. Graph application permissions need a Privileged Role Administrator. Plan that approval step: it's the moment someone with privilege decides what the script may read.`,
  `${M} — Unit 3 "Signing in as a workload."`);
}

// ================================================================== 7 Permissions
{
  const s = content(SC, "Least-privileged permissions, and what they hide");
  tag(s, "What");
  const l = panel(s, "Perms", 0.6, 1.45, 6.6, null, HEX.navy, HEX.navyTint, "PERMISSIONS", "Ask for the least that does the job", [
    "Delegated permissions act for a signed-in user; application permissions act as the app, tenant-wide",
    "Every API page lists permissions from least to most privileged",
    "Find-MgGraphCommand and Find-MgGraphPermission find them",
    "Example: User.EnableDisableAccount.All plus User.Read.All, not User.ReadWrite.All",
  ], 13.5);
  const r = panel(s, "Hide", 7.45, 1.45, 5.3, null, HEX.red, HEX.redTint, "WHAT A NARROW PERMISSION HIDES", null, [
    "Objects you can't fully read still come back, with only id and @odata.type",
    "Treat a null property as possibly \"not permitted,\" not \"empty\"",
  ], 13.5);
  callout(s, "Calls", Math.max(l, r) + 0.3, 0.95, "FaListCheck", HEX.teal, "In the kit: ",
    "graph-calls.json lists every call with its least-privileged permission, and a task can make only the calls listed for it.");
  sources(s, "Sources: Module 1, Unit 4: Learn, Graph permissions overview; best practices; Find-MgGraphCommand; Find-MgGraphPermission; List users (Oct. 25, 2026). Kit README.");
  notes(s,
`Graph has two kinds of permission. Delegated permissions act for a signed-in user and are limited by what that user can do. Application permissions act as the app, across the whole tenant. Every API reference page lists permissions in order, least privileged first, and you ask for the least one that does the job. In Graph PowerShell, Find dash Mg Graph Command and Find dash Mg Graph Permission help you find them. Where a narrower permission exists, use it: enabling and disabling accounts needs User dot Enable Disable Account dot All plus User dot Read dot All, not read-write on all users. And watch what a narrow permission hides. Objects you can't fully read still come back, with only an ID and a type. A null property may mean not permitted, not empty. The example kit keeps every call and its permission in one file, graph-calls dot JSON, and a task can make only the calls listed for it.`,
  `${M} — Unit 4 "Permissions and tools," "Permissions."`);
}

// ================================================================== 8 Tools
{
  const s = content(SC, "Use the current tools; the old modules are retired");
  tag(s, "What");
  const b = table(s, "Tools", 1.45, [3.6, 3.0, 5.55], ["Tool", "Install", "Use it for"], [
    ["Microsoft Graph PowerShell SDK", "Install-Module Microsoft.Graph", "Interactive and scheduled administration; Invoke-MgGraphRequest for any endpoint"],
    ["Microsoft Graph Python SDK", "pip install msgraph-sdk", "Services and pipelines; PageIterator follows pages for you"],
    ["azure-identity (Python)", "pip install azure-identity", "Managed identity, certificate and federated credentials"],
    ["Az PowerShell, Azure CLI", "(Module 4, planned)", "Azure Resource Manager: subscriptions, Arc, Policy"],
    ["AzureAD, AzureAD Preview, MSOnline", "Don't", "Deprecated March 30, 2024; Microsoft said they'd work only until March 30, 2025"],
  ], { fontSize: 12.5, limit: 5.1 });
  line(s, "Why", "The example client calls the REST API with the standard library so every request is visible and testable (design guidance).", b + 0.3, 0.65, 14);
  sources(s, "Sources: Module 1, Unit 4 \"Tools\": Learn, Install a Graph SDK; paging with the SDKs; Azure Identity for Python; Azure AD PowerShell deprecation; migration steps.");
  notes(s,
`Use the current tools. The Microsoft Graph PowerShell S D K, for interactive and scheduled administration, with Invoke dash Mg Graph Request for any endpoint. The Microsoft Graph Python S D K for services and pipelines, where a page iterator follows pages for you. azure-identity in Python, for managed identity, certificate and federated credentials. Az PowerShell and the Azure CLI for Azure Resource Manager, which a planned Module 4 covers. And not AzureAD, AzureAD Preview or MSOnline. Microsoft deprecated them on March 30, 2024, said they'd work only until March 30, 2025, and recommends Microsoft Graph PowerShell. The example client calls the REST API directly with the standard library. That isn't advice against the S D Ks. It keeps every request visible, so you can read and test each pattern line by line.`,
  `${M} — Unit 4 "Permissions and tools," "Tools."`);
}

// ================================================================== 9 Four patterns
{
  const s = content(SC, "Four request patterns every Graph script needs");
  tag(s, "How");
  const w = 2.9, gap = 0.18;
  const items = [
    ["1 PAGING", "Follow @odata.nextLink", ["100 users by default; 999 with $top; 500 with signInActivity", "Call the link unchanged until it stops"]],
    ["2 THROTTLING", "Wait for Retry-After", ["429 Too Many Requests", "Retrying at once keeps counting against the limit"]],
    ["3 BATCHING", "At most 20 per $batch", ["Each request is still throttled on its own", "Check every response's status"]],
    ["4 DELTA", "Keep the delta link", ["Follow nextLink until @odata.deltaLink", "Users and groups: $deltatoken=latest"]],
  ];
  let bottom = 0;
  items.forEach(([lab, head, pts], k) => {
    bottom = Math.max(bottom, panel(s, `P${k + 1}`, 0.6 + k * (w + gap), 1.45, w, 2.2, [HEX.navy, HEX.amber, HEX.teal, HEX.navy][k],
      [HEX.navyTint, HEX.amberTint, HEX.tealTint, HEX.navyTint][k], lab, head, pts, 13));
  });
  callout(s, "Adv", bottom + 0.3, 1.0, "FaFilter", HEX.navy, "Advanced queries: ",
    "$count, $search and some $filter and $orderby forms need ConsistencyLevel: eventual, and $count too except for $search.");
  sources(s, "Sources: Module 1, Unit 5: Learn, List users; paging; throttling guidance; JSON batching; delta query; advanced query capabilities (Oct. 25, 2026).");
  notes(s,
`Every Graph script needs the same four patterns. One, paging. Collections come back a page at a time: a hundred users by default, up to nine hundred ninety-nine with top, or five hundred when you select sign-in activity. Follow the next link, unchanged, until it stops appearing. Two, throttling. Over a limit, Graph answers four twenty-nine with a Retry-After header. Wait that long, because retrying at once keeps counting against you. Three, batching. A batch takes at most twenty requests, and each one is still throttled on its own, so a batch can succeed while some requests inside it fail. Check every status. Four, delta. Follow the next links until you get a delta link, store it, and next time you get only the changes. And some advanced Entra queries, like count and search, need the ConsistencyLevel eventual header, or they fail or return something different.`,
  `${M} — Unit 5 "Four request patterns."`);
}

// ================================================================== 10 Limits
{
  const s = content(SC, "Throttling limits, and what changes a request's cost");
  tag(s, "What");
  const b = table(s, "Limits", 1.45, [3.2, 8.95], ["Limit", "Value"], [
    ["Every service", "130,000 requests per 10 seconds per app, across all tenants"],
    ["Entra ID objects, per app and tenant", "3,500, 5,000 or 8,000 resource units per 10 seconds, for under 50, 50 to 500, and over 500 users"],
    ["Entra ID writes", "3,000 per 2 min 30 s per app and tenant; 18,000 per 5 minutes per tenant"],
    ["Request cost", "$select lowers it by 1; $expand raises it by 1; $top under 20 lowers it by 1"],
    ["Group membership", "transitiveMembers costs 5, against 3 for members"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Pri", b + 0.3, 0.95, "FaArrowDownWideShort", HEX.teal, "Priority: ",
    "a background job can send x-ms-throttle-priority: Low. Microsoft recommends High only for requests a user started.");
  sources(s, "Sources: Module 1, Unit 5: Microsoft Learn, Microsoft Graph service-specific throttling limits (accessed Oct. 25, 2026).");
  notes(s,
`The limits are layered, and the first one you reach applies. Every service allows a hundred thirty thousand requests per ten seconds per app, across all tenants. Entra ID objects, like users, groups and applications, use cost-based resource units instead: thirty-five hundred, five thousand or eight thousand per ten seconds per app and tenant, depending on the tenant's size. Writes have their own limits. A request's cost changes with what you ask for. Select lowers it by one, expand raises it by one, and a top under twenty lowers it by one. Listing a group's transitive members costs five, against three for direct members. And a background job, like an evidence collector, can send a low throttle priority. Microsoft recommends high priority only for requests a user started.`,
  `${M} — Unit 5 "Four request patterns," throttling.`);
}
endModule(SC);

// ================================================================== 11 Try it
{
  const s = content(SL, "Try it: the client refuses the wrong cloud and call");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Lab 1, steps 2 to 4, in examples/ms-automation (fixtures, no tenant)",
    "$ python -c \"...from graphkit import endpoints; endpoints('GCCHigh')\"",
    "ValueError: unknown cloud 'GCCHigh'; one of ['dod', 'gcc', 'gcchigh', 'global']",
    "$ python -c \"...print(permissions_for(load_calls('stale-users')))\"",
    "['AuditLog.Read.All', 'User.Read.All']",
    "$ python -c \"...GraphClient('gcc', ..., calls=load_calls('ca-export')).request('GET', '/users')\"",
    "PermissionError: undeclared call: GET /v1.0/users; add it to graph-calls.json with its permission",
    "$ python -c \"...GraphClient('gcchigh', ...).request('GET', 'https://graph.microsoft.com/v1.0/users')\"",
    "ValueError: refusing to send the token to https://graph.microsoft.com/v1.0/users: not https://graph.microsoft.us",
    "$ python -m pytest -q tests/python/test_graphkit_and_tasks.py -k \"paging or ... or delta or advanced\"",
    "9 passed, 11 deselected",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 1, 2026", pt: 11 });
  line(s, "Then", "Then the same rules in PowerShell (Get-FmwCloud, Get-FmwCallPermission, Assert-FmwGraphCall), and the full suites: 70 pytest, 44 Pester.", c + 0.25, 0.65, 14);
  sources(s, "Sources: Module 1, Unit 7 \"Exercise: Lab 1\"; examples/ms-automation: graphkit.py, graph-calls.json, tests/python, tests/powershell.");
  notes(s,
`Try it. Lab 1 runs on a laptop in the examples folder, against fixtures, with no tenant. Ask for a cloud name the client doesn't know, G C C High with capitals, and you get a value error that lists the four names it accepts. An unknown name is an error, never a default. List the permissions the stale-users task needs, and you get exactly two: AuditLog dot Read dot All and User dot Read dot All, computed from the calls it declares. Make a call the Conditional Access task doesn't declare, and it refuses, telling you to add it to graph-calls dot JSON with its permission. Send a GCC High token to the worldwide Graph host, and it refuses again. Nothing was sent in either case. Then nine tests prove paging, retries, batching, delta and the advanced-query header against a fake transport. The lab repeats the rules in PowerShell, and the full suites pass: seventy in pytest and forty-four in Pester.`,
  `${M} — Unit 7 "Exercise: Lab 1 (fixtures, no tenant)," steps 2 to 7.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: one permission, in your own test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.6, 9.55], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant, never production, with fictional data; a Privileged Role Administrator for consent"],
    ["Register", "One app in the tenant's own cloud, with a certificate credential and no secret"],
    ["Grant", "Policy.Read.All only, with admin consent"],
    ["Run", "python python/entra_tasks.py --cloud gcc --tenant <tenant-id> --client <app-id> --cert app.pem ca-export --out ca"],
    ["Back it out", "Remove the permission, delete the app registration and its certificate, delete the ca folder"],
  ], { fontSize: 12.5, limit: 5.2 });
  callout(s, "NotRun", b + 0.3, 0.9, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "Lab 2 follows the developer workbook's Chapter 02, Lab 2, step by step.");
  sources(s, "Sources: Module 1, Unit 8 \"Exercise: Lab 2\"; Book 19, Chapter 02, \"Lab 2: test tenant.\"");
  notes(s,
`Lab 2 moves to your own test tenant, worldwide or GCC, never production, with fictional data. You register one app in the tenant's own cloud, with a certificate and no secret. You grant it one application permission, Policy dot Read dot All, with admin consent from a Privileged Role Administrator. You run the Conditional Access export, which only reads. The developer workbook's Chapter 02 then has you see the token check work, by adding a permission the task doesn't need, and the wrong cloud fail closed. And you back it out: remove the permission, delete the app registration and its certificate, and delete the output folder, because it holds the tenant's policies. The authors haven't run Lab 2; it follows the workbook chapter step by step.`,
  `${M} — Unit 8 "Exercise: Lab 2 (your test tenant)"; Book 19, Chapter 02 — "Lab 2: test tenant."`);
}
endModule(SL);

// ================================================================== 13 Where agencies are
{
  const s = content(SA, "Where agencies are: GCC, GCC High and DoD");
  tag(s, "Who");
  const b = table(s, "Avail", 1.45, [3.4, 3.6, 5.15], ["What the module relies on", "Commercial and GCC", "GCC High and DoD"], [
    ["App registration", "Worldwide admin center", "In the government cloud itself"],
    ["Graph Explorer", "Supported", "Not supported"],
    ["Workload identities", "Available", "Roadmap: GA at FedRAMP High, DoD IL4 and IL5"],
    ["Managed identity as an app's federated credential", "Audience api://AzureADTokenExchange", "Audience api://AzureADTokenExchangeUSGov"],
  ], { fontSize: 12.5, limit: 4.3 });
  panel(s, "Interim", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "INTERIM PATHS (DESIGN GUIDANCE)", null, [
    "Scripts on AzureAD or MSOnline: rewrite on Graph PowerShell, and move to app-only sign-in while you're there",
    "A collector that stays on premises: a CA-issued certificate now, a managed identity on Arc later",
    "A move from GCC to GCC High: a new app registration and a changed cloud name, never a host in the code",
  ], 13);
  sources(s, "Sources: Module 1, Unit 6: Learn, Graph deployments (Oct. 25, 2026); Azure Government GA roadmap; trust a managed identity (read Nov. 1, 2026).");
  notes(s,
`Where are agencies? Most on this path run a Microsoft 365 GCC tenant with commercial Azure. Their scripts are often older than the current tools: AzureAD cmdlets, a client secret in a scheduled task, a host name written into the code. Some run GCC High. For what this module relies on: in GCC High and DoD, the app is registered in the government cloud itself, and Graph Explorer isn't supported. Microsoft's Azure Government roadmap lists workload identities as generally available at FedRAMP High and DoD impact levels four and five. And when a managed identity is an app's federated credential, the audience value differs: the U S Gov token exchange audience in the government cloud. The interim paths: rewrite retired-module scripts on Graph PowerShell, use a certificate on premises until the server is on Arc, and treat a GCC High move as a configuration change.`,
  `${M} — Unit 6 "Where agencies are."`);
}
endModule(SA);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement, and the evidence to keep");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.0, 9.15], ["Requirement", "What the collector shows"], [
    ["NIST SP 800-53 AC-6", "Least privilege: each collector holds only the permissions its calls need"],
    ["IA-5", "Authenticator management: no long-lived secret; ScubaGear MS.AAD.5.5v1 and 5.6v1 apply to the program's own apps"],
    ["CA-7", "Continuous monitoring depends on collectors that return complete results"],
    ["BOD 25-01", "SCuBA assessment tools and continuous reporting for in-scope tenants"],
  ], { fontSize: 12.5, limit: 4.2 });
  panel(s, "Keep", 0.6, b + 0.25, 12.15, null, HEX.teal, HEX.tealTint, "EVIDENCE AN ISSO KEEPS", null, [
    "Per collector: cloud, endpoint, app registration, credential type (never a secret), exact permissions and the consent record",
    "graph-calls.json and its tests in the repository; the record that the retired modules are gone",
  ], 13);
  sources(s, "Sources: Module 1, Unit 1 \"The federal requirement\"; Unit 10 \"Summary\"; Book 02, Appendix A (BOD 25-01; NIST SP 800-53 control mapping).");
  notes(s,
`This module's subject is the collector itself, so its requirements are the ones the collector's identity has to meet. Least privilege, A C six in NIST special publication eight hundred fifty-three: each script holds only the permissions its calls need. Authenticator management, I A five: no long-lived secret, and ScubaGear's application-credential policies apply to the program's own apps too. Continuous monitoring, C A seven, depends on collectors that return complete results. And BOD 25-01 requires the SCuBA assessment tools and continuous reporting for in-scope tenants. Book 02's Appendix A has the mapping. The evidence an ISSO keeps: for each collector, its cloud, endpoint, app registration, credential type, exact permissions and consent record, plus the call list and its tests in the repository.`,
  `${M} — Unit 1 "The federal requirement"; Unit 10 "Summary"; Book 02, Appendix A — "CISA BOD 25-01 and the SCuBA baselines," "NIST SP 800-53 Rev. 5 control mapping."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on foundations", [
    { q: "Your tenant is Microsoft 365 GCC. Which Graph host does your collector call?", options: ["a. graph.microsoft.us", "b. graph.microsoft.com", "c. dod-graph.microsoft.us"] },
    { q: "A batch returns 200, but two of its 20 requests returned 429. What should the client do?", options: ["a. Treat the batch as successful", "b. Retry the whole batch at once", "c. Check each response, and retry the throttled ones after their wait"] },
  ], "1 b: GCC uses the worldwide endpoints. 2 c: each request in a batch is throttled on its own.");
  sources(s, "Sources: Module 1, Unit 9 \"Knowledge check,\" questions 1 and 5; Unit 2; Unit 5.");
  notes(s,
`Check yourself with two questions from the module's knowledge check. First: your tenant is Microsoft 365 GCC. Which Graph host does your collector call? The answer is b, graph dot microsoft dot com, because GCC uses the worldwide endpoints. Second: a batch returns two hundred, but two of its twenty requests returned four twenty-nine. What should the client do? The answer is c. Each request in a batch is throttled on its own, so check every response's status and retry the throttled ones after their wait. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — Unit 9 "Knowledge check," questions 1 and 5.`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary, and next: Module 2, Entra ID");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Matched each cloud to its hosts, scope and PowerShell environment",
    "Ordered the credentials, and found who consents to Graph permissions",
    "Found least-privileged permissions, and what a narrow one hides",
    "Learned paging, throttling, batching and delta",
    "Saw the client refuse an unknown cloud, an undeclared call and the wrong host",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2: Entra ID through Graph", [
    "Users, groups, Conditional Access, PIM, applications, logs",
    "Five read-only checks mapped to ScubaGear",
  ], 13.5);
  callout(s, "Ship", Math.max(l, r) + 0.3, 0.9, "FaListCheck", HEX.teal, "Before you ship a collector: ",
    "work through the developer workbook's Chapter 02 checklist.");
  sources(s, "Sources: Module 1, Unit 10 \"Summary\"; Module 2, Unit 1; Book 19, Chapter 02, \"Checklist.\"");
  notes(s,
`To sum up. You matched each cloud to its hosts, its scope and its PowerShell environment, and learned that GCC is the worldwide service. You put the credentials in order, managed identity, federation, certificate, never a secret, and found who consents to Graph permissions. You found least-privileged permissions and what a narrow one hides. You learned the four request patterns. And in the lab you saw the client refuse an unknown cloud, an undeclared call and the wrong host. Before you ship a collector, work through the developer workbook's Chapter 02 checklist. Next is Module 2, Entra ID through Microsoft Graph: users, groups, Conditional Access, PIM, applications and logs, with five read-only checks mapped to ScubaGear.`,
  `${M} — Unit 10 "Summary"; Book 19, Chapter 02 — "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/ms-automation-foundations.md (Microsoft Automation learning path, Module 1), Units 1 to 10; its footnotes carry each Microsoft Learn page and the date it was read (October 25, 2026; the two Unit 6 availability rows November 1, 2026).",
  "Microsoft Learn pages the module cites: Microsoft Graph national cloud deployments; Microsoft Entra authentication and national clouds; Get-MgEnvironment; Connect to Azure Government with PowerShell and with Azure CLI; national clouds with the Graph SDKs; Get access without a user; Azure Identity for Python.",
  "Also: managed identities; Arc-enabled server managed identity; workload identity federation and trust; app registration with a certificate; certificate credentials; tenant-wide admin consent; Graph permissions overview; best practices; Find-MgGraphCommand; Find-MgGraphPermission; List users; Graph SDK install and paging; Azure AD PowerShell deprecation and migration; paging; throttling and throttling limits; JSON batching; delta query; advanced queries; Azure Government GA roadmap; trust a managed identity.",
  "CISA ScubaGear Microsoft Entra ID baseline (aad.md), MS.AAD.5.5v1 and 5.6v1. Federal requirements by link: Book 02, Appendix A (BOD 25-01 and the SCuBA baselines; NIST SP 800-53 Rev. 5 control mapping).",
  "Lab output: examples/ms-automation (graphkit.py, graph-calls.json, powershell/FmwGraph.psm1, tests), run November 1, 2026 with Python 3.14.3 and PowerShell 7.6.9. Lab 2: Book 19, Chapter 02, not run by the authors. Design guidance is labeled on the slides.",
]);

finish(OUT);
