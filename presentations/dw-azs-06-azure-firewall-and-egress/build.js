// Building Azure Security, Chapter 06 — Azure Firewall and Egress: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/azure-security/06-azure-firewall-and-egress.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-azs-06-azure-firewall-and-egress/build.js
require("../_build/devwb.js")({
  workbook: "azs", chapter: 6, dir: __dirname,
  base: "DW_AZS_06_Azure_Firewall_and_Egress",
  title: "Azure Firewall and Egress",
  map: "Why routes and policy together · what Learn gives and leaves · subnet states · the rules and the plan · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to Building Azure Security, Chapter 6: Azure Firewall and egress. A firewall nobody routes to inspects nothing. So the kit reads the policy and the routes together, and it admits what it can't see: the effective route on a running network interface. We'll start from Microsoft Learn's Zero Trust checks, route commands and Draft and Deployment procedure, see what they leave to you, read the kit's check and the plan it writes but never runs, then walk two labs, the evidence and the dangers. The chapter is a draft awaiting the owner's review, and the code is illustrative, tested against a fictional estate.`,
      detail: `The chapter is the code behind the Azure Security Engineering guide's Step 6, firewall and segmentation. You start with Learn's Zero Trust checks for Azure Firewall, its route table commands and its Draft + Deployment procedure. Then you read how the kit checks each policy and each workload subnet's default route, and writes the move to Deny as a draft a person deploys. Lab 1 checks Contoso's hub firewall and five workload subnets; Lab 2 checks a test subscription beside the effective routes and the guide's Validate query.`,
      cite: ["azs06-guide"],
      ref: "“In this chapter”",
    },
    {
      part: "Why", title: "Why the policy and the routes are read together",
      body: [
        { cols: [[{ bullets: [
          "Whether every firewall policy **denies** on threat intelligence and IDPS",
          "Whether each firewall has a **policy and logs**",
          "What share of workload subnets declare a **default route to a firewall**: the guide's egress-inspection metric",
          "Hand over the **move to Deny** as unrun commands",
        ], label: "By the end you can", color: "navy", pt: 14 }], [{ bullets: [
          "Platform owners, who own the policy and the routes",
          "Security monitors, who read the threat intelligence and IDPS logs",
          "Developers who review both",
        ], label: "Who it's for", color: "teal", pt: 14 }]] },
      ],
      sources: "Sources: Chapter 06, opening, “In this chapter,” “Goal and audience.”",
      say: `Why read the policy and the routes together? Because a policy that denies inspects nothing if workloads don't route to it, and a route to a firewall in alert mode lets everything through. By the end of this chapter you can say whether every firewall policy denies on threat intelligence and intrusion detection, whether each firewall has a policy and logs, and what share of workload subnets declare a default route to a firewall, which is the guide's egress-inspection metric. And you can hand the platform owner the commands that move a policy to deny, unrun. It's for platform owners, security monitors, and the developers who review both.`,
      detail: `Goal: by the end of this chapter you can say whether every firewall policy denies on threat intelligence and IDPS, whether each firewall has a policy and logs, and what share of workload subnets declare a default route to a firewall, the guide's egress-inspection metric; and you can hand the platform owner the Draft + Deployment commands that move a policy to Deny, unrun. Audience: platform owners, who own the firewall policy and the routes; security monitors, who read the threat intelligence and IDPS logs; the developers who review both.`,
      cite: [],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "What", title: "What Microsoft Learn gives you",
      body: [
        { table: { head: ["Learn gives", "What it says"], w: [3.4, 8.75], rows: [
          ["Zero Trust checks", "Outbound through the firewall; threat intelligence and IDPS in alert and deny; outbound TLS inspection; diagnostic logs"],
          ["SKU tiers", "Threat intelligence deny: Standard or Premium; IDPS and TLS inspection: Premium; Standard upgrades without redeployment"],
          ["Policy modes", "--threat-intel-mode and --idps-mode: Alert, Deny or Off"],
          ["The default route", "0.0.0.0/0, next hop VirtualAppliance, the firewall's private IP; the table attached to the subnet"],
          ["Draft + Deployment", "Stage every change in a draft and deploy it at once; deploying replaces the whole applied policy"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Learn, Zero Trust recommendations for Azure Firewall; Azure Firewall SKU tiers; az network firewall policy; NAT gateway route table; Draft + Deployment.",
      say: `Here's Microsoft's starting point. Learn's Zero Trust recommendations for Azure Firewall check that outbound traffic from workloads routes through the firewall, that threat intelligence and intrusion detection are in alert and deny, that outbound TLS is inspected, and that diagnostic logs are on. Threat intelligence deny needs Standard or Premium; intrusion detection and TLS inspection need Premium. The CLI sets each mode to alert, deny or off. Learn's route commands add a default route to the firewall's private IP. And Learn's Draft and Deployment procedure stages every change in a draft and deploys it at once, replacing the whole applied policy.`,
      detail: `Microsoft's Zero Trust recommendations for Azure Firewall check that outbound traffic from workloads routes through the firewall, that threat intelligence and IDPS are in "alert and deny", that outbound TLS is inspected, and that diagnostic logs are on; a NAT gateway on the firewall subnet for SNAT. Threat intelligence deny needs Standard or Premium; IDPS, TLS inspection and full URL filtering need Premium; Standard upgrades to Premium without redeployment. The CLI creates a policy with --threat-intel-mode and --idps-mode, each Alert, Deny or Off. Learn's route commands add a 0.0.0.0/0 route with next hop VirtualAppliance at the firewall's private IP and attach the table to the subnet. Draft + Deployment: draft create, draft update --threat-intel-mode Deny --idps-mode Deny, draft show, deploy; deploying replaces the applied policy; extension 1.2.3 or later. AZFWThreatIntel holds all threat intelligence events.`,
      cite: ["azs06-zt", "azs06-sku", "azs06-cli", "azs06-route", "azs06-draft", "azs06-monref"],
      ref: "“Start with Microsoft Learn” — “What Learn gives you”; “Verified facts”",
    },
    {
      part: "What", title: "What it leaves to you",
      body: [
        { table: { head: ["Learn gives", "Why it matters", "What the kit adds"], w: [3.3, 4.1, 4.75], rows: [
          ["A Validate query for one policy", "Policies drift one at a time", "Every policy's modes, tier and TLS inspection, weekly"],
          ["A route command per subnet", "A subnet added later has no route, or one to the internet", "Every workload subnet's declared default route"],
          ["VirtualAppliance at an IP", "Another appliance inspects nothing the guide counts", "Next hop compared with firewalls' IPs (AZS-FW-04)"],
          ["IDPS needs Premium", "A Standard policy can't deny on IDPS", "AZS-FW-02 says “IDPS needs Premium”"],
          ["Draft + Deployment commands", "Automation would deploy unreviewed, over live edits", "plan-deny.txt, never run"],
          ["show-effective-route-table", "System and BGP routes can win", "Declared routes only, and it says so; Lab 2 checks"],
        ] }, pt: 11.5 },
      ],
      sources: "Sources: Chapter 06, “What it leaves to you”; the kit's Firewall tests.",
      say: `What does Learn leave to you? The guide's Validate query reads one policy, and policies drift one at a time. A route command per subnet means a subnet added later has no route, or one to the internet. A virtual appliance at some address may not be the firewall at all. A Standard policy can't deny on intrusion detection whatever its mode says. Sent by automation, a draft would deploy without review and replace live edits made since. And the route a machine actually uses can include system routes that win. The kit answers each one, and is honest that it reads declared routes only.`,
      detail: `Each row is pinned by a test in the Firewall (Step 6) tests. The guide's Validate query for one policy: every policy's modes, tier and TLS inspection, every week. A route command per subnet: every workload subnet's declared default route, followed to its route table and next hop. VirtualAppliance at an IP: the next hop compared with the firewalls' private IPs; another appliance is a Warn (AZS-FW-04). IDPS needs Premium: AZS-FW-02 says "IDPS needs Premium" for a Standard policy. Draft + Deployment as commands: written to plan-deny.txt, never run. az network nic show-effective-route-table: the route a VM actually uses includes system routes and BGP; the kit reads declared routes only and says so; Lab 2 checks the effective routes.`,
      cite: ["azs06-draft"],
      ref: "“What it leaves to you”",
    },
    {
      part: "What", title: "Workload subnets and their default route",
      body: [
        { cols: [[{ bullets: [
          "Every subnet in the settings' **workload subscriptions**",
          "Except the reserved ones: GatewaySubnet, AzureFirewallSubnet, AzureFirewallManagementSubnet, AzureBastionSubnet, RouteServerSubnet",
        ], label: "Which subnets", color: "navy", pt: 13.5 }], [{ bullets: [
          "**Firewall**: 0.0.0.0/0 to a firewall's private IP",
          "**OtherAppliance**: to an IP the kit doesn't know",
          "**NoRouteTable** or **NoDefaultRoute**",
          "Or the next hop type it found, such as Internet",
        ], label: "One state each", color: "teal", pt: 13.5 }]] },
        { callout: "egress inspection is Firewall subnets over workload subnets, by declared route.", label: "The metric: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: examples/azure-security (Get-AzsFirewallCheck, config/baseline.json). Chapter 06, “The code: the firewall area.”",
      say: `Here's how the kit reads egress. It takes every subnet in the workload subscriptions the settings name, except the reserved ones: the gateway, firewall, firewall management, Bastion and route server subnets. Each gets one state. Firewall, when the default route goes to a firewall's private IP. Other appliance, when it goes to an address the kit doesn't know. No route table, or no default route. Or the next hop type it found, such as the internet. The guide's egress-inspection metric is the firewall subnets over all workload subnets, by declared route.`,
      detail: `Get-AzsFirewallCheck reads the firewall policies, the firewalls with their private IPs, the route tables and the virtual networks of the settings' workload subscriptions. Workload subnets are every subnet there except the reserved ones (GatewaySubnet, AzureFirewallSubnet, AzureFirewallManagementSubnet, AzureBastionSubnet, RouteServerSubnet, listed in config/baseline.json). Each gets one state: Firewall (a 0.0.0.0/0 route to a firewall's private IP), OtherAppliance, NoRouteTable, NoDefaultRoute, or the next hop type it found. egressPercent in summary.json is routed over workload subnets, declared routes.`,
      cite: ["azs06-route"],
      ref: "“The code: the firewall area”",
    },
    {
      part: "What", title: "The firewall rules, and the plan never run",
      body: [
        { table: { head: ["Rule", "Severity", "What it flags"], w: [1.6, 1.4, 9.15], rows: [
          ["AZS-FW-01", "Finding", "Threat intelligence not in Deny"],
          ["AZS-FW-02", "Finding", "IDPS not in Deny, or the policy isn't Premium"],
          ["AZS-FW-03", "Finding", "A workload subnet with no default route to the firewall"],
          ["AZS-FW-04", "Warn", "A default route to an appliance that isn't a known Azure Firewall"],
          ["AZS-FW-05", "Finding", "A firewall with no logs to the platform workspace"],
          ["AZS-FW-06 · 07", "Warn", "A firewall with no policy · a Premium policy with no TLS inspection"],
        ] }, pt: 12 },
        { lead: "plan-deny.txt: Learn's draft create, draft update to Deny, draft show, deploy. The kit never runs it." },
      ],
      sources: "Sources: examples/azure-security (config/rules.json); Learn, Draft + Deployment. Chapter 06, “The code: the firewall area.”",
      say: `The check reports seven rules. Threat intelligence not in deny, and intrusion detection not in deny or a policy that isn't Premium, are findings straight from Learn's Zero Trust checks. A workload subnet without a default route to the firewall is a finding; one routed to an unknown appliance is a warning. A firewall with no logs is a finding. A firewall with no policy, and a Premium policy with no TLS inspection, are warnings: the program pilots TLS inspection on one rule collection first. And for each policy not yet in deny, the kit writes Learn's four draft and deployment commands to a plan file, and never runs them.`,
      detail: `AZS-FW-01, Finding: threat intelligence not in Deny (Learn). AZS-FW-02, Finding: IDPS not in Deny, or the policy isn't Premium (Learn). AZS-FW-03, Finding: a workload subnet with no default route to the firewall (Learn). AZS-FW-04, Warn: a default route to an appliance that isn't a known Azure Firewall (design guidance). AZS-FW-05, Finding: a firewall with no logs to the platform workspace (Learn). AZS-FW-06, Warn: a firewall with no firewall policy (design guidance). AZS-FW-07, Warn: a Premium policy with no TLS inspection (Learn); TLS inspection needs an intermediate CA in Key Vault that clients trust, and the program pilots it first (design guidance). For each policy not yet in Deny, plan-deny.txt holds Learn's four commands: create a draft, update its modes to Deny, show it, deploy it. The deploy line replaces the applied policy, so the plan's header points at the guide's Step 6 and the change window.`,
      cite: ["azs06-zt", "azs06-draft"],
      ref: "“The code: the firewall area”",
    },
    {
      part: "Who", title: "Who owns the policy, the routes and the logs",
      body: [
        { cards: [
          { title: "Platform owner", text: "Owns the firewall policy and the routes; runs the draft in a change window", color: "navy" },
          { title: "Security monitor", text: "Reads the threat intelligence and IDPS logs", color: "teal" },
          { title: "Developers", text: "Review the check, the plan file and the routes it reads", color: "amber" },
        ], pt: 13.5 },
        { lead: "Every read is Reader; the plan is the platform owner's to run, after review." },
      ],
      sources: "Sources: Chapter 06, “Goal and audience”; “Federal requirements and evidence.”",
      say: `Who's involved? The platform owner owns the firewall policy and the routes, and runs the draft in a change window, after review. The security monitor reads the threat intelligence and intrusion detection logs the firewall sends. And developers review the check, the plan file and the routes it reads. Every read the check makes is Reader; the plan is the platform owner's to run.`,
      detail: `Audience: platform owners, who own the firewall policy and the routes; security monitors, who read the threat intelligence and IDPS logs; the developers who review both. In the evidence table: threat intelligence and IDPS in Deny, platform owner; default routes, platform owner; firewall logs, security monitor; the move to Deny reviewed before it is deployed, platform owner, through the guide's change record.`,
      cite: [],
      ref: "“Goal and audience”; “Federal requirements and evidence”",
    },
    {
      part: "How", title: "Lab 1: run the check, read each subnet",
      body: [
        { terminal: "06-1", label: "examples/azure-security  ·  fixture data  ·  real output" },
        { terminal: "06-2" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 06, “Lab 1: fixtures, no subscription,” steps 1–2.",
      say: `Lab 1 needs PowerShell 7 with Pester, in the kit's folder, and no subscription. Contoso's hub firewall has the private IP ten dot zero dot zero dot four and a Premium policy still in alert. Two workload networks hold five workload subnets. Step 1 runs the firewall check: two of five subnets route to the firewall, and the plan file is written. Step 2 reads each subnet. The payroll data subnet has no route table. The portal web subnet sends its default route to the internet. And the jump subnet sends it to ten dot nine dot nine dot nine, an appliance the kit doesn't know.`,
      detail: `You need PowerShell 7.1 or later with Pester 5, working in examples/azure-security. Contoso's hub firewall afw-hub has the private IP 10.0.0.4 and the Premium policy afwp-hub, still in Alert. Step 1: Invoke-AzsCheck.ps1 -Area firewall: two of five workload subnets route to the firewall; plan-deny.txt written, none run. Step 2: vnet-payroll/snet-app and vnet-portal/snet-pe route to 10.0.0.4 (afw-hub); snet-data has no route table; snet-web sends 0.0.0.0/0 to the internet; snet-jump sends it to 10.9.9.9, an appliance the kit doesn't know.`,
      cite: [],
      ref: "“Lab 1: fixtures, no subscription,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: the findings and the plan",
      body: [
        { terminal: "06-3" },
        { terminal: "06-4", lines: "1-2,4-7" },
      ],
      sources: "Sources: examples/azure-security (fictional fixtures). Chapter 06, “Lab 1: fixtures, no subscription,” steps 3–4.",
      say: `Step 3 reads the findings: threat intelligence and intrusion detection both in alert, no firewall logs, two subnets with no route to the firewall, an unknown appliance, and no TLS inspection. Step 4 reads the plan the kit wrote and didn't run: Learn's four draft and deployment commands for the hub policy, with its resource group and subscription, under a header that says the kit did not run them, and points at the guide's Step 6 and a change window. Step 5 runs this chapter's two tests.`,
      detail: `Step 3: AZS-FW-01 and AZS-FW-02 for afwp-hub (threat intelligence and IDPS in Alert); AZS-FW-05 for afw-hub (no logs); AZS-FW-03 for snet-data (no route table) and snet-web (next hop Internet); AZS-FW-07 (no TLS inspection); AZS-FW-04 for snet-jump (10.9.9.9). Step 4: plan-deny.txt holds draft create, draft update --threat-intel-mode Deny --idps-mode Deny, draft show and deploy for afwp-hub, with --resource-group rg-hub and its subscription. Step 5: two Firewall tests pass. Expected result: the policy's modes, every workload subnet's declared route, and the move to Deny as a draft a person deploys.`,
      cite: ["azs06-draft"],
      ref: "“Lab 1: fixtures, no subscription,” steps 3–5",
    },
    {
      part: "How", title: "Lab 2: a test subscription, effective routes",
      body: [
        { steps: [
          { title: "Sign in and write the settings", text: "az cloud set --name AzureCloud; az login --tenant; resource-graph and azure-firewall extensions" },
          { title: "Run the firewall check, live", text: "With -AllowUnverified for the policy, firewall and route table queries" },
          { title: "Compare with the guide's Validate", text: "az network firewall policy show for the modes; az network nic show-effective-route-table on a pilot VM" },
          { title: "Back it out", text: "Nothing changed in Azure, and the plan wasn't run: delete what the lab wrote, and sign out" },
        ], pt: 13 },
        { callout: "a test subscription with a firewall and a pilot spoke, never production. The authors haven't run this lab.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Chapter 06, “Lab 2: a test subscription.”",
      say: `Lab 2 moves to a test subscription with an Azure Firewall, its policy and a pilot spoke subnet routed to it, never production. Sign in to commercial Azure with the Resource Graph and firewall extensions, write the settings, and run the check live, allowing the unverified calls. Then compare with the guide's Validate commands: the policy's two modes, and the effective route table on a test machine in the pilot subnet. For a subnet the kit called firewall, the effective default route should go to the firewall's private IP. If it doesn't, record why. Nothing changed in Azure, and the plan wasn't run, so back out by deleting the output and signing out.`,
      detail: `Use a test tenant with a test management group and subscription in commercial Azure, never production, with an Azure Firewall, its policy and a pilot spoke subnet routed to it. You need Reader on the test management group, Azure CLI with the resource-graph and azure-firewall extensions. Steps: sign in; write the test settings file; run Invoke-AzsCheck.ps1 -Area firewall live with -AllowUnverified; compare az network firewall policy show --query "{ti:threatIntelMode, idps:intrusionDetection.mode}" with the policy's row, and az network nic show-effective-route-table on a test VM's NIC: the effective 0.0.0.0/0 route should go to the firewall's private IP for a subnet the kit called Firewall; if not, record why (research gaps, row 8). Back out: Remove-Item the output; az logout.`,
      cite: ["azs06-guide"],
      ref: "“Lab 2: a test subscription”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.6, 2.3, 1.9, 2.35], rows: [
          ["Threat intelligence and IDPS in Deny on every policy", "SC-7(5); SI-4", "CNA-RNT", "Platform owner"],
          ["Every workload subnet's declared route; egressPercent", "SC-7", "CNA-ULN", "Platform owner"],
          ["Firewall logs to the platform workspace", "SI-4", "CNA-RNT", "Security monitor"],
          ["The move to Deny reviewed before deploy: plan-deny.txt", "SC-7(5)", "CNA-RNT", "Platform owner"],
        ] }, pt: 12.5 },
        { lead: "The kit's output supports these controls; the assessor decides. KSIs are FedRAMP 20x indicators for providers." },
      ],
      sources: "Sources: the guide's Federal requirements and KSIs (Step 6). Chapter 06, “Federal requirements and evidence.”",
      say: `Each output is evidence for something specific, from the guide's requirements table against NIST SP 800-53. Threat intelligence and intrusion detection in deny on every policy supports deny by default, allow by exception, and system monitoring. Every workload subnet's declared route to the firewall, and the share that has one, supports boundary protection. Firewall logs to the platform workspace support system monitoring. And the move to deny, reviewed before it's deployed, supports deny by default too, through the change record. The kit's output supports these controls; the assessor decides. The key security indicators are FedRAMP's indicators for cloud providers, which the agency lines its own evidence up with.`,
      detail: `Threat intelligence and IDPS in Deny on every policy (AZS-FW-01 and AZS-FW-02, or none): SC-7(5), deny by default, allow by exception; SI-4, system monitoring; KSI-CNA-RNT; platform owner. Every workload subnet's declared default route to the firewall, and the share that has one (firewall.json subnet rows, egressPercent in summary.json): SC-7, boundary protection; KSI-CNA-ULN; platform owner. Firewall logs to the platform workspace (AZS-FW-05, or none): SI-4; KSI-CNA-RNT; security monitor. The move to Deny reviewed before it is deployed (plan-deny.txt, never run by the kit): SC-7(5); KSI-CNA-RNT; platform owner. The controls are the guide's Step 6 row (SC-7, SC-7(5), SI-4) and its KSIs; the guide notes KSI-CNA-RNT cites SC-7(5) and KSI-CNA-ULN cites SC-7.`,
      cite: ["azs06-guide"],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.4, 4.2, 4.55], rows: [
          ["A draft deployed over newer live edits", "The live edits are lost", "The kit never deploys; the plan names the change window"],
          ["A declared route that doesn't win", "The effective route bypasses the firewall", "The metric says “declared”; Lab 2 checks"],
          ["A route to an unknown appliance", "Egress through something that isn't the firewall", "AZS-FW-04 names it"],
          ["A Standard policy with IDPS set", "Reads as configured, inspects nothing", "AZS-FW-02 says Premium is needed"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Chapter 06, “Dangers”; Learn, Draft + Deployment.",
      say: `What breaks in production? A draft deployed over newer live edits loses them, because deploying replaces the whole applied policy; the kit never deploys, and the plan names the change window and the guide's single change path. A declared route that doesn't win sends traffic around the firewall; the metric says declared, and Lab 2 checks the effective route. A route to an unknown appliance sends egress through something that isn't the inspecting firewall; the kit names it. And a Standard policy with intrusion detection set reads as configured but inspects nothing; the kit says Premium is needed.`,
      detail: `A draft deployed over newer live edits: the live edits are lost; the kit never deploys; the plan's header names the change window and the guide's single change path. A declared route that doesn't win: the effective route bypasses the firewall; the metric says "declared"; Lab 2 checks the effective route. A route to an unknown appliance: egress through something that isn't the inspecting firewall; AZS-FW-04 names it. A Standard policy with IDPS set: it reads as configured and inspects nothing; AZS-FW-02 says Premium is needed.`,
      cite: ["azs06-draft", "azs06-sku"],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { bullets: [
          "Every policy denies on threat intelligence and IDPS, or has a dated plan to",
          "Every workload subnet is Firewall, or has a decision record",
          "The effective route was checked on a VM in each pilot subnet",
          "plan-deny.txt went through the change record before anyone ran it",
        ], pt: 15 },
        { callout: "Chapter 07: PaaS reached only through private endpoints, and the vaults behind them.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 06, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. Every policy denies on threat intelligence and intrusion detection, or has a dated plan to. Every workload subnet routes to the firewall, or has a decision record. The effective route was checked on a machine in each pilot subnet. And the plan file went through the change record before anyone ran it. Next, Chapter 7: platform services reached only through private endpoints, and the key vaults behind them.`,
      detail: `Checklist: every policy denies on threat intelligence and IDPS, or has a dated plan to; every workload subnet is Firewall, or has a decision record; the effective route was checked on a VM in each pilot subnet; plan-deny.txt went through the change record before anyone ran it. Next, Chapter 07: PaaS reached only through private endpoints, and the vaults behind them. The guide's Step 6 holds the commands that create the policy and the routes.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
