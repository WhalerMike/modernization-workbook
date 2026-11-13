// Azure Security Engineering learning path, Module 1: The baseline and the exposure register — the module's narrated deck.
// Teaches docs/training/azure-security/01-the-baseline-and-the-exposure-register.md, Learn-style: objectives, the concepts
// (how the guide divides the work with the books, its labels and order, the landing-zone security baseline, the public
// exposure inventory, where agencies are and the other clouds), the lab's exact commands in a test subscription (not run
// by the authors, as the page says; the module has no Lab 1), the federal requirement and evidence, a two-question check,
// and the summary. Every fact comes from the module page and the Azure Security Engineering implementation guide it sends
// the learner to (How to read this guide, Where each topic is covered, Steps 1 and 2, Government-cloud availability, The
// same controls on AWS, Google Cloud and Oracle Cloud, and their footnotes); the deck adds none.
// Helpers: ./shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-azs-module-1/build.js \
//                      presentations/training-azs-module-1/Training_AZS_Module_1.pptx
const P = require("./shared.js")({
  title: "Module 1: The baseline and the exposure register",
  footer: "Federal Modernization Workbook  ·  Azure Security Engineering learning path, Module 1: The baseline and the exposure register",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_AZS_Module_1.pptx";
const M = "Training, Azure Security Engineering, Module 1";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;
const LAB = "LAB 2  ·  A TEST SUBSCRIPTION, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 1: The baseline and the exposure register", "Azure Security Engineering · How the guide is built, the security baseline, and the list of what's exposed",
    ["How the guide is built  ·  The landing-zone security baseline  ·  The exposure register", "Where agencies are  ·  Other clouds  ·  Lab 2 in a test subscription  ·  Evidence"]);
  notes(s,
`Welcome to Module 1 of the Azure Security Engineering learning path: the baseline and the exposure register. A landing zone decides what can be deployed. It doesn't decide what the internet can reach, and nothing later in this path can be proved complete without a list of what's exposed. In this module you learn how the Azure Security Engineering implementation guide is put together, add the security settings the baseline needs on top of the landing zone, and build the exposure register that every later module checks against. It covers Steps 1 and 2 of the guide, and takes about fifty minutes, plus a lab in your own test subscription.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: a landing zone isn't a defense on its own");
  tag(s, "Why");
  const l = panel(s, "Decides", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "WHAT A LANDING ZONE DECIDES", null, [
    "What can be deployed, where, and under which policies",
    "The management group hierarchy and the boundary policies",
    "The provisioning loop every change goes through",
  ], 13);
  const r = panel(s, "Doesnt", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "WHAT IT DOESN'T DECIDE", null, [
    "What the internet can reach",
    "What leaves the estate",
    "Who can read a key",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaListCheck", HEX.red, "This module: ",
    "the security settings the baseline adds, and the exposure register; nothing in Steps 3 to 8 can be proved complete without it.");
  sources(s, "Sources: Module 1, \"Introduction\"; Guide, opening statement, \"How to read this guide,\" Step 2.");
  notes(s,
`Why does this matter? A landing zone, as Cloud Boundary and Landing Zone designs it, decides what can be deployed: the management group hierarchy, the boundary policies, and the provisioning loop every change goes through. What it doesn't decide is what the internet can reach, what leaves the estate, or who can read a key. Those are engineered one service at a time, and each one has to be proved. The proving starts with a list. You can't show that every public endpoint sits behind DDoS protection and a web application firewall if you don't know every public endpoint. So this module adds the security settings the baseline needs, and builds the exposure register that Modules 2 to 5 check against.`,
  `${M} — "Introduction"; guide, opening statement, "How to read this guide," Step 2 (opening).`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 1", [
    "Say which parts the books design and which the guide engineers",
    "Protect the hierarchy; assign the security initiatives in DoNotEnforce",
    "Find platform resources that don't send logs to the workspace",
    "Build the exposure register and find rows with no owner",
    "Name what differs in Azure Government and on other clouds",
  ], [
    "Cloud Boundary and Landing Zone, Chapter 05: skim it",
    "The guide's prerequisites: roles eligible through PIM",
    "Lab 2: a test subscription, never production",
  ], 50);
  sources(s, "Sources: Module 1, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll say which parts of Azure security the books design and which the guide engineers, and read the guide's authority labels. You'll protect the management group hierarchy and assign the security initiatives in do-not-enforce mode at the intermediate root. You'll find platform resources that don't send their logs to the workspace. You'll build the exposure register from Resource Graph and find the rows with no owner. And you'll name what differs in Azure Government, and the equivalent controls on AWS, Google Cloud and Oracle Cloud Infrastructure. Before you start, skim Chapter 05 of Cloud Boundary and Landing Zone, and the guide's prerequisites: the roles, eligible through pim. The lab runs in a test subscription, never production.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Books design, guide engineers
{
  const s = content(SC, "Unit 1: the books design; the guide engineers");
  tag(s, "What");
  const tb = table(s, "Cover", 1.45, [3.2, 5.0, 3.95], ["Topic", "Designed in", "The guide adds"], [
    ["Landing-zone baseline", "Cloud Boundary and Landing Zone, Ch. 05, 07, 08", "Step 1: security settings, logs, the gate"],
    ["Public exposure", "Security Operations and Telemetry, Ch. 08", "Step 2: the inventory, owners, the register"],
    ["DDoS, WAF, Front Door", "None", "Steps 3 to 5"],
    ["Firewall and segmentation", "Network and Transport (the agency edge, TIC)", "Step 6: Azure Firewall egress"],
    ["Private Link and DNS", "DNS, DHCP and IPAM (DNS authority)", "Step 7"],
    ["Policy and drift", "Cloud Boundary, Ch. 05; Governance, Drift and Evidence, Ch. 02", "Step 9"],
  ], { fontSize: 11.5, limit: 5.3 });
  callout(s, "Link", tb + 0.25, 0.9, "FaSitemap", HEX.navy, "Link, don't repeat: ",
    "the guide engineers what a Zero Trust assessment tests, service by service, and links to the books for the design.");
  sources(s, "Sources: Module 1, Unit 1; Guide, \"How to read this guide,\" \"Where each topic is covered.\"");
  notes(s,
`Unit 1 is how the guide is built. The books already design most of this. Cloud Boundary and Landing Zone builds the management group hierarchy, the boundary policies, the provisioning loop, and who owns the boundary. Security Operations and Telemetry chooses the posture tool on each cloud. Network and Transport owns the agency's network edge and TIC. DNS, DHCP and IPAM owns DNS authority. Governance, Drift and Evidence explains why drift is the threat. What none of them gives is the service-by-service engineering of the Azure controls a Zero Trust assessment tests: DDoS protection on every public I P, a web application firewall in prevention mode, origins only the edge can reach, egress through an inspecting firewall, pass reachable only privately, and keys behind role-based access. The guide does that, in ten steps, and links to the books instead of restating them.`,
  `${M} — Unit 1; guide, "How to read this guide," "Where each topic is covered" (the ten topics table).`);
}

// ================================================================== 5 Labels and order
{
  const s = content(SC, "Labels, Skipped not Fail, and the order of the steps");
  tag(s, "What");
  const p1 = panel(s, "Labels", 0.6, 1.45, W3, null, HEX.navy, HEX.navyTint, "AUTHORITY LABELS", null, [
    "Mandated: only where a federal source requires it",
    "Microsoft-recommended: where Learn recommends it",
    "Risk-based recommended: the program's position",
  ], 12.5);
  const p2 = panel(s, "Skip", 0.6 + W3 + G3, 1.45, W3, null, HEX.amber, HEX.amberTint, "SKIPPED, NOT FAIL", null, [
    "A feature the tenant isn't licensed for, or a cloud doesn't offer, is a licensing or environment decision",
    "A test that can't run against it is Skipped",
  ], 12.5);
  const p3 = panel(s, "Order", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.teal, HEX.tealTint, "THE ORDER", null, [
    "Steps 1 and 2 first",
    "Steps 3 to 8 in parallel by workload",
    "Step 9 turns them into policy; Step 10 runs from the start",
  ], 12.5);
  callout(s, "Path", Math.max(p1, p2, p3) + 0.3, 0.95, "FaRoute", HEX.teal, "This path follows that order: ",
    "Module 1 is Steps 1 and 2; Modules 2 to 4 pair Steps 3 to 8; Module 5 is Steps 9 and 10.");
  sources(s, "Sources: Module 1, Unit 1; Guide, \"How to read this guide\" (Labels), \"The path on one page\"; Zero Trust and Assessment, Ch. 10.");
  notes(s,
`Two more things from the guide's opening. First, labels. Each step carries an authority label: Mandated only where a federal source requires it, Microsoft-recommended where Learn recommends it, and Risk-based recommended where it's the program's own position. Design guidance marks the program's choices in prose. And a control the tenant isn't licensed for, or a feature a cloud doesn't offer, is a licensing or environment decision, not a failed control. An assessment test that can't run against it is Skipped, not Fail, as Zero Trust and Assessment sets out. Second, order. Steps 1 and 2 come first. Steps 3 to 8 can run in parallel by workload once the inventory exists. Step 9 turns each of them into policy, and Step 10 runs from the start. This path follows that order: this module is Steps 1 and 2, the next three modules pair Steps 3 to 8, and Module 5 is Steps 9 and 10.`,
  `${M} — Unit 1; guide, "How to read this guide" (Labels), "The path on one page"; Book 11, Chapter 10 (normalized result taxonomy).`);
}

// ================================================================== 6 Step 1
{
  const s = content(SC, "Unit 2: the landing-zone security baseline, in audit");
  tag(s, "How");
  const c = code(s, "Base", 0.6, 1.45, 12.15, [
    "# Protect the hierarchy: authorization to create management groups; new subscriptions to a default group",
    "New-AzManagementGroupHierarchySetting -GroupName <tenant-root-group-id> -Authorization True -DefaultManagementGroup <sandbox-mg-id>",
    "# Assign the FedRAMP initiative (and the security benchmark) in audit at the intermediate root",
    "az policy assignment create --name azs-fedramp-mod --display-name \"FedRAMP Moderate (audit)\" `",
    "    --policy-set-definition <initiative-name> `",
    "    --scope /providers/Microsoft.Management/managementGroups/<mg-id> --enforcement-mode DoNotEnforce",
  ], { label: "THE GUIDE'S STEP 1 COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const p1 = panel(s, "Audit", 0.6, c + 0.2, W3, null, HEX.navy, HEX.navyTint, "DONOTENFORCE", null, [
    "Evaluates compliance without enforcing the effect",
    "One 24-hour cycle and a review with the ISSO; Step 9 enforces",
  ], 12);
  const p2 = panel(s, "Logs", 0.6 + W3 + G3, c + 0.2, W3, null, HEX.teal, HEX.tealTint, "LOGS AND DEFENDER", null, [
    "Every hub resource: a diagnostic setting to the workspace",
    "Defender for Cloud on every subscription, exported",
  ], 12);
  const p3 = panel(s, "Back", 0.6 + 2 * (W3 + G3), c + 0.2, W3, null, HEX.amber, HEX.amberTint, "ROLLBACK", null, [
    "Delete the assignment: minutes",
    "No exclusions at the root; exemptions only in Step 9, with expiry",
  ], 12);
  if (Math.max(p1, p2, p3) > 6.61) console.warn("  ! Step 1 panels may overflow");
  sources(s, "Sources: Module 1, Unit 2; Guide, Step 1; Protect your resource hierarchy; Azure Policy assignment structure.");
  notes(s,
`Unit 2 is the guide's Step 1, the landing-zone security baseline. It adds four things on top of the landing zone. First, protect the hierarchy, with the command from Learn's page, Protect your resource hierarchy: creating management groups needs authorization, and new subscriptions land in a default group. Second, assign the Microsoft cloud security benchmark and the fed-ramp initiative at the intermediate root, in do-not-enforce mode. Learn's Azure Policy assignment structure page says that mode evaluates compliance without enforcing the effect. Keep it there for at least one twenty-four-hour evaluation cycle and one compliance review with the I S S O; Step 9 enforces. Third, every hub resource sends its logs to the workspace. Fourth, Defender for Cloud on every subscription, with continuous export. Rollback is one command, deleting the assignment, in minutes. Nothing at the root is excluded; exemptions come only through Step 9, with an expiry.`,
  `${M} — Unit 2; guide, Step 1 (steps 1 to 4; How template); Microsoft Learn — "Protect your resource hierarchy," "Azure Policy assignment structure."`);
}

// ================================================================== 7 Step 2
{
  const s = content(SC, "Unit 3: the exposure register, from Resource Graph");
  tag(s, "How");
  const c = code(s, "Inv", 0.6, 1.45, 12.15, [
    "# Four queries, each written to a dated JSON file (shortened here; the full commands are on the module page)",
    "az graph query -q \"Resources | where type =~ 'microsoft.network/publicipaddresses' | project id, name, ... `",
    "    ddosMode = tostring(properties.ddosSettings.protectionMode), owner = tostring(tags['owner'])\" ... > out/public-ips.json",
    "az graph query -q \"Resources | where type =~ 'microsoft.cdn/profiles' | project ...\" ... > out/frontdoor.json",
    "az graph query -q \"Resources | where type =~ 'microsoft.network/applicationgateways' | project ...\" ... > out/appgw.json",
    "az graph query -q \"Resources | where ... tostring(properties.publicNetworkAccess) !~ 'Disabled' ...\" ... > out/paas-public.json",
  ], { label: "THE GUIDE'S STEP 2 QUERIES, BUILT FROM LEARN'S STARTER QUERY", pt: 10.5 });
  const p1 = panel(s, "Row", 0.6, c + 0.2, W2, null, HEX.navy, HEX.navyTint, "ONE ROW PER EXPOSURE", null, [
    "Owner, public name, DDoS state, WAF and mode",
    "Origin lock-down, certificate expiry, last reviewed",
  ], 12);
  const p2 = panel(s, "Care", 0.6 + W2 + G2, c + 0.2, W2, null, HEX.red, HEX.redTint, "TWO CAUTIONS", null, [
    "The public-access query is a starting list: the property varies by service",
    "The register is a map of the attack surface: keep it inside the boundary",
  ], 12);
  if (Math.max(p1, p2) > 6.61) console.warn("  ! Step 2 panels may overflow");
  sources(s, "Sources: Module 1, Unit 3; Guide, Step 2; Starter Resource Graph query samples; Secure your Azure DDoS Protection deployment.");
  notes(s,
`Unit 3 is Step 2, the public exposure inventory. Learn's page, Secure your Azure DDoS Protection deployment, recommends an inventory of every public I P and its protection status, kept with Resource Graph, and a quarterly review. The guide's four queries list public I Ps with their DDoS state, Front Door profiles, application gateways with their web application firewall policy, and pass resources whose public network access isn't disabled. The first is built from Learn's starter Resource Graph query. The register then adds what the queries can't: the owner, the D N S names and certificates that point at each exposure, and whether a web application firewall covers it. Two cautions. The public network access query is a starting list, not a complete one, because the property's name and values vary by service. And the register is a map of the attack surface: it stays inside the boundary, never in a public repository.`,
  `${M} — Unit 3; guide, Step 2 (steps 1 to 6); Microsoft Learn — "Starter Resource Graph query samples," "Secure your Azure DDoS Protection deployment," "DDoS Protection cost optimization principles."`);
}

// ================================================================== 8 Gov
{
  const s = content(SC, "Where agencies are: GCC uses commercial Azure");
  tag(s, "Who");
  const tb = table(s, "Gov", 1.45, [3.4, 3.85, 4.9], ["Topic", "Commercial Azure (GCC)", "Azure Government (side note)"], [
    ["Which tenants", "Microsoft 365 GCC pairs with it", "Pairs with GCC High and DoD"],
    ["Endpoints", "The guide's commands as written", "Resource Manager at management.usgovcloudapi.net"],
    ["Landing zone accelerators", "Supported", "Not supported unmodified: adapt the code"],
    ["Azure Lighthouse", "Available", "No PIM for delegated access; no cross-cloud delegation"],
    ["A listed service", "All features", "All features unless Learn lists a variation"],
  ], { fontSize: 12, limit: 5.0 });
  code(s, "Cloud", 0.6, tb + 0.25, 12.15, [
    "az cloud set --name <cloud>     # AzureCloud for a GCC tenant's subscriptions; AzureUSGovernment otherwise",
  ], { pt: 11 });
  sources(s, "Sources: Module 1, Unit 4; Guide, \"Government-cloud availability\"; Compare Azure Government and global Azure.");
  notes(s,
`Where are agencies? The workbook's baseline is G C C Moderate. Microsoft 365 G C C pairs with commercial Azure, so a G C C agency's subscriptions are usually commercial, and the guide's commands run as written, with the cloud set to Azure Cloud. Azure Government is a side note: it pairs with G C C High and D O D. Learn's page, Compare Azure Government and global Azure, says a service available there has all its features unless the page lists a variation. The differences that matter for this module: the endpoints differ, with Resource Manager at management dot U S gov cloud A P I dot net; the landing zone accelerators aren't supported unmodified, so the code has to be adapted; and Azure Lighthouse has no pim for delegated access and no delegation across clouds. Later modules name the gaps for their own steps.`,
  `${M} — Unit 4; guide, "Government-cloud availability" (table); Prerequisites ("The right cloud"); Microsoft Learn — "Compare Azure Government and global Azure."`);
}

// ================================================================== 9 Other clouds
{
  const s = content(SC, "The same controls on AWS, Google Cloud and Oracle");
  tag(s, "What");
  const tb = table(s, "Clouds", 1.45, [2.3, 2.45, 2.4, 2.4, 2.6], ["Control", "Azure", "AWS", "Google Cloud", "Oracle Cloud (OCI)"], [
    ["L3/L4 DDoS", "Infrastructure, Network or IP Protection", "Shield Standard and Advanced", "Cloud Armor", "Not compared; not yet specified"],
    ["Web application firewall", "Azure WAF on Front Door and App Gateway", "AWS WAF", "Cloud Armor policies (OWASP CRS)", "OCI WAF: regional or edge policy"],
    ["Inspecting firewall", "Azure Firewall Premium", "Network Firewall (not compared)", "Cloud NGFW (not compared)", "OCI Network Firewall: IDPS, TLS, URL"],
    ["Private access to PaaS", "Private Link endpoints", "PrivateLink (not compared)", "Private Service Connect", "Private endpoints in a VCN subnet"],
  ], { fontSize: 11, limit: 5.2 });
  callout(s, "OCI", tb + 0.25, 0.95, "FaCloud", HEX.teal, "An HR platform on Oracle Cloud Infrastructure: ",
    "engineer OCI WAF, Network Firewall and private endpoints the same way; their OCI Government Cloud availability is not yet specified.");
  sources(s, "Sources: Module 1, Unit 4; Guide, \"The same controls on AWS, Google Cloud and Oracle Cloud\"; AWS, Google Cloud and Oracle documentation.");
  notes(s,
`The guide also compares the same controls on other clouds, because an agency's estate spans them, and its HR platform may run on Oracle Cloud Infrastructure. For layer three and four DDoS: Azure's infrastructure, Network or I P Protection; AWS Shield Standard and Advanced; and Google Cloud Armor. Oracle's isn't compared. For a web application firewall: Azure W A F on Front Door and Application Gateway; AWS W A F; Cloud Armor security policies with the OWASP core rule set; and O C I W A F, as a regional policy on a load balancer or at the edge. For an inspecting firewall: Azure Firewall Premium, and O C I Network Firewall, built on Palo Alto Networks, with intrusion detection and prevention, TLS inspection and URL filtering. For private access to pass: Private Link, Private Service Connect, and O C I private endpoints. Each provider's own documentation carries the build. O C I Government Cloud availability of its W A F and Network Firewall isn't yet specified.`,
  `${M} — Unit 4; guide, "The same controls on AWS, Google Cloud and Oracle Cloud" (table and footnotes: AWS, Google Cloud and Oracle documentation, read November 11, 2026).`);
}
endModule(SC);

// ================================================================== 10 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 4: sign in, initiatives, logs");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: sign in to the cloud the subscription lives in, and add the extensions",
    "az cloud set --name <cloud>",
    "az login",
    "az account set --subscription <subscription-id>",
    "az extension add --name resource-graph",
    "az extension add --name azure-firewall",
    "# Step 2: the initiatives at the pilot group",
    "az policy assignment list --scope /providers/Microsoft.Management/managementGroups/<mg-id> -o table",
    "# Step 3: platform resources that need a diagnostic setting (query shortened)",
    "az graph query -q \"Resources | where type in~ ('microsoft.network/azurefirewalls', ...) | project id, type, subscriptionId\" --first 1000",
    "# Step 4: one of them, by its id from step 3",
    "az monitor diagnostic-settings list --resource <resource-id> -o table",
  ], { label: LAB, pt: 10.5 });
  line(s, "Expect", "Expected (the guide's Validate): the initiatives in DoNotEnforce; each resource has a diagnostic setting to the workspace.", c + 0.2, 0.5, 13.5);
  sources(s, "Sources: Module 1, \"Exercise: Lab 2,\" steps 1 to 4; Guide, Prerequisites, Step 1.");
  notes(s,
`The lab runs the guide's own checks in a test subscription, never production. The guide has no kit or developer workbook yet, so there's no fixture lab; this is Lab 2, and the authors haven't run it. You need a test subscription where someone has applied Step 1 to a pilot management group, and Reader on that group. Values you supply are in angle brackets. Step one signs in to the cloud the subscription lives in and adds the two Azure C L I extensions the guide needs. Step two lists the policy assignments at the pilot group. The guide's Validate step says you should see the initiatives in do-not-enforce mode. Step three lists the platform resources that need a diagnostic setting: firewalls, application gateways, Front Door profiles, key vaults and public I Ps. Step four takes one of them and lists its diagnostic settings. Each should send its logs to the platform team's workspace; one with none is a gap for the platform owner.`,
  `${M} — "Exercise: Lab 2, a test subscription," "You need," steps 1 to 4.`);
}

// ================================================================== 11 Lab part 2
{
  const s = content(SL, "Lab 2, steps 5 to 7: the inventory and its owners");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 5: a folder for the inventory, and the four queries of the guide's Step 2 (full text on the module page)",
    "New-Item -ItemType Directory -Force -Path out",
    "az graph query -q \"Resources | where type =~ 'microsoft.network/publicipaddresses' | project ...\" --first 1000 -o json > out/public-ips.json",
    "#   ... and out/frontdoor.json, out/appgw.json, out/paas-public.json",
    "# Step 6: the public IPs with no owner (this filter is the path's: it reads the data array the extension writes)",
    "(Get-Content -Raw out/public-ips.json | ConvertFrom-Json).data | Where-Object { -not $_.owner } |",
    "    Format-Table name, resourceGroup, ip, ddosMode",
    "# Step 7: back it out; the folder is a map of the test subscription's attack surface",
    "Remove-Item -Recurse -Force out",
  ], { label: LAB, pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Expected (the guide's Validate): ",
    "every row has an owner, or each ownerless row has a ticket. Module 5 counts the rows again for the metrics.");
  sources(s, "Sources: Module 1, \"Exercise: Lab 2,\" steps 5 to 7; Guide, Step 2.");
  notes(s,
`Step five makes a folder for the inventory and runs the guide's four Step 2 queries, writing each to a J SON file: public I Ps, Front Door profiles, application gateways, and pass with public access on. The full commands are on the module page. Step six finds the public I Ps with no owner. That filter is the path's own, not the guide's: it reads the data array that the Resource Graph extension writes, and keeps the rows whose owner tag is empty. The guide's Validate step says every row should have an owner, or each ownerless row should have a ticket. Module 5 counts these rows again, to compute the metrics. Step seven backs it out. The lab created nothing in Azure, but the out folder is a map of the test subscription's attack surface, so delete it.`,
  `${M} — "Exercise: Lab 2," steps 5 to 7; guide, Step 2 (Validate).`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 1");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["Step 1: CM-2 baseline configuration, CM-6 configuration settings, CA-7 continuous monitoring", "KSI-SVC-ACM, KSI-MLA-EVC", "Initiative assignments, the compliance export"],
    ["Step 2: CM-8 system component inventory, SC-7 boundary protection", "KSI-CNA-MAT", "The dated register, reconciled with Defender for Cloud"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The steps support the controls; ",
    "the organization sets their parameters, and the assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers that the agency lines its evidence up with.");
  sources(s, "Sources: Module 1, \"The federal requirement,\" \"Summary\"; Guide, \"Federal requirements and KSIs\"; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five, as the guide's requirements table maps it. Step 1 supports C M two, baseline configuration, C M six, configuration settings, and C A seven, continuous monitoring, aligned with the fed-ramp twenty X key security indicators the guide names. The evidence is the initiative assignments and the compliance export. Step 2 supports C M eight, system component inventory, and S C seven, boundary protection; its evidence is the dated register, reconciled with Defender for Cloud. The steps support these controls. The organization still sets their parameters, and the assessor decides whether each is satisfied. The key security indicators are written for cloud service providers; the agency lines its own evidence up with them.`,
  `${M} — "The federal requirement" table; "Summary"; guide, "Federal requirements and KSIs" (rows 1 and 2).`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on Module 1", [
    { q: "Why does Step 1 assign the security initiatives in DoNotEnforce?", options: ["a. Because the FedRAMP initiative can't be enforced", "b. To evaluate compliance without enforcing until a cycle and an ISSO review; Step 9 enforces", "c. Because DoNotEnforce stops remediation tasks"] },
    { q: "Where does the exposure register live?", options: ["a. In a public repository, so assessors can find it", "b. Inside the boundary: it's a map of the attack surface", "c. Only in Defender for Cloud"] },
  ], "1 b: audit first; Step 9 enforces. 2 b: keep the register inside the boundary.");
  sources(s, "Sources: Module 1, \"Knowledge check,\" questions 1 and 3; Units 2 and 3; Guide, Steps 1 and 2.");
  notes(s,
`Check yourself with two questions. First: why does Step 1 assign the security initiatives in do-not-enforce mode? The answer is b: to evaluate compliance without enforcing the effect, until at least one evaluation cycle and a compliance review with the I S S O. Step 9 enforces. Second: where does the exposure register live? The answer is b, inside the boundary, because it's a map of the attack surface. It never goes in a public repository. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 3, and "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: a baseline in audit, and a list with owners");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Saw how the guide divides the work with the books",
    "Checked the initiatives in audit and the platform logs",
    "Built the exposure register, with an owner on every row",
    "Saw what differs in Azure Government and on other clouds",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 2", [
    "DDoS protection on every public IP, and the web application firewall from detection to prevention",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the hierarchy and assignment exports, policy compliance in the workspace, the query text and dated register, and the reconciliation with Defender for Cloud.");
  sources(s, "Sources: Module 1, \"Summary\"; learning path index; Module 2.");
  notes(s,
`To sum up. You saw how the guide divides the work with the books, and how its labels work. You checked the baseline's initiatives in audit at the pilot group, and the platform logs. You built the exposure register, with an owner on every row. And you saw what differs in Azure Government, and the same controls on AWS, Google Cloud and Oracle Cloud Infrastructure. The evidence an I S S O keeps from this module: the hierarchy settings and initiative assignment exports, policy compliance in the workspace, the query text and the dated register, and its reconciliation with Defender for Cloud. Next is Module 2: DDoS protection on every public I P in that register, and the web application firewall, from detection to prevention.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 1 deck", [
  "Module page: docs/training/azure-security/01-the-baseline-and-the-exposure-register.md (Azure Security Engineering learning path, Module 1), a draft; the path's verification log is docs/training/azure-security/_verification/learning-path.md.",
  "Azure Security Engineering (implementation guide): How to read this guide; Where each topic is covered; Prerequisites; Government-cloud availability; The same controls on AWS, Google Cloud and Oracle Cloud; Steps 1 and 2. Its footnotes carry each source, read November 11, 2026: Microsoft Learn, Protect your resource hierarchy; Azure Policy assignment structure; Starter Resource Graph query samples; Secure your Azure DDoS Protection deployment; Compare Azure Government and global Azure; AWS, Google Cloud and Oracle documentation.",
  "Cloud Boundary and Landing Zone, Chapters 05, 07 and 08; Security Operations and Telemetry, Chapter 08; Zero Trust and Assessment, Chapter 10.",
  "NIST SP 800-53 Rev. 5 (CM-2, CM-6, CA-7, CM-8, SC-7); FedRAMP 20x KSIs, as the guide's requirements table maps them.",
  "The lab's commands are the page's, with its placeholders; the module has no Lab 1, and the lab wasn't run by the authors.",
]);

finish(OUT);
