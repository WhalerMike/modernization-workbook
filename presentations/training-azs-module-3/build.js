// Azure Security Engineering learning path, Module 3: The edge and the egress — the module's narrated deck.
// Teaches docs/training/azure-security/03-the-edge-and-the-egress.md, Learn-style: objectives, the concepts (choosing
// Front Door Premium, Application Gateway or both; locking the origin; TLS, probes and failover; Azure Firewall egress,
// the SKUs, alert then deny through a draft, TLS inspection and segmentation), where agencies are, the lab's exact
// commands in a test subscription (not run by the authors, as the page says; the module has no Lab 1), the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page and the Azure
// Security Engineering implementation guide it sends the learner to (Steps 5 and 6, Government-cloud availability, The
// same controls on AWS, Google Cloud and Oracle Cloud, What couldn't be verified, and their footnotes) or the path's
// verification log; the deck adds none. Helpers: ../training-azs-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-azs-module-3/build.js \
//                      presentations/training-azs-module-3/Training_AZS_Module_3.pptx
const P = require("../training-azs-module-1/shared.js")({
  title: "Module 3: The edge and the egress",
  footer: "Federal Modernization Workbook  ·  Azure Security Engineering learning path, Module 3: The edge and the egress",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_AZS_Module_3.pptx";
const M = "Training, Azure Security Engineering, Module 3";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;
const LAB = "LAB 2  ·  A TEST SUBSCRIPTION, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 3: The edge and the egress", "Azure Security Engineering · In through an edge nothing goes around; out through a firewall that denies",
    ["Front Door or Application Gateway  ·  Locking the origin  ·  TLS, probes and failover", "Azure Firewall egress  ·  Alert, then deny  ·  Lab 2 in a test subscription  ·  Evidence"]);
  notes(s,
`Welcome to Module 3 of the Azure Security Engineering learning path: the edge and the egress. Module 2 put a web application firewall in front of each web workload. This module makes sure nothing can go around it, and then turns to the other direction: traffic leaving Azure, through Azure Firewall, with threat intelligence and intrusion detection denying. It covers Steps 5 and 6 of the Azure Security Engineering implementation guide, and takes about fifty-five minutes, plus a lab in your own test subscription.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: a WAF around which traffic flows protects nothing");
  tag(s, "Why");
  const l = panel(s, "In", 0.6, 1.45, W2, null, HEX.red, HEX.redTint, "TRAFFIC IN", null, [
    "An attacker who calls the origin directly bypasses the WAF and DDoS controls",
    "The Front Door service tag alone admits any customer's Front Door",
  ], 13);
  const r = panel(s, "Out", 0.6 + W2 + G2, 1.45, W2, null, HEX.navy, HEX.navyTint, "TRAFFIC OUT", null, [
    "A workload whose traffic leaves uninspected can reach a command-and-control server unseen",
    "Egress through an inspecting firewall, with deny modes on",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaRoute", HEX.red, "This module: ",
    "origins only the edge can reach, TLS 1.2 or later, tested failover, and every workload subnet's default route through Azure Firewall.");
  sources(s, "Sources: Module 3, \"Introduction\"; Guide, Steps 5 and 6, \"Dangers\"; Secure traffic to Azure Front Door origins.");
  notes(s,
`Why does this matter? A web application firewall in prevention mode protects nothing if an attacker can call the origin directly. The guide's dangers table puts it this way: attackers bypass the firewall and the DDoS controls by calling the origin, and the Front Door backend service tag alone admits any customer's Front Door, as Learn's page, Secure traffic to Azure Front Door origins, explains. The other direction matters just as much. A workload whose traffic leaves Azure without inspection can reach a command-and-control server, or send data out, unseen. So this module covers both: origins only the edge can reach, with TLS one point two or later and tested failover, and every workload subnet's default route through Azure Firewall, with threat intelligence and intrusion detection in deny mode.`,
  `${M} — "Introduction"; guide, Step 5, Step 6, "Dangers" (origin reachable around the edge); Microsoft Learn — "Secure traffic to Azure Front Door origins."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 3", [
    "Choose Front Door Premium, Application Gateway or both",
    "Lock an origin to the edge, and say why the tag alone fails",
    "Check TLS, health probes and failover",
    "Route a subnet to Azure Firewall and check the effective routes",
    "Move threat intelligence and IDPS to deny through a draft",
  ], [
    "Module 2: the WAF the edge carries",
    "Network and Transport, for the agency edge and TIC: skim it",
    "Lab 2: a test subscription, never production",
  ], 55);
  sources(s, "Sources: Module 3, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll choose Front Door Premium, Application Gateway, or both, for an application, and say why. You'll lock an origin to the edge, and explain why the Front Door backend service tag alone isn't enough. You'll check TLS, health probes and failover. You'll route a workload subnet's default route to Azure Firewall, and check it with the effective routes. And you'll move threat intelligence and intrusion detection from alert to deny through a draft, and say what deploying a draft replaces. You need Module 2, and a skim of Network and Transport, which owns the agency's own edge and the trusted internet connection; the guide leaves those to it.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Selection
{
  const s = content(SC, "Unit 1: Front Door, Application Gateway, or both");
  tag(s, "What");
  const tb = table(s, "Sel", 1.45, [3.1, 9.05], ["Choose", "When (design guidance)"], [
    ["Front Door Premium", "Internet-facing applications that need global reach, Private Link origins or managed WAF rules"],
    ["Application Gateway WAF_v2", "Regional applications; traffic that must enter through the agency's own virtual network; where Front Door isn't available in the region"],
    ["Both", "The application needs regional inspection too: Front Door in front of Application Gateway, reached over Private Link"],
  ], { fontSize: 12.5, limit: 4.4 });
  const p1 = panel(s, "Global", 0.6, tb + 0.2, W2, null, HEX.navy, HEX.navyTint, "FRONT DOOR", null, [
    "Global, at the Microsoft edge, with built-in layer 3 and 4 DDoS protection",
  ], 12);
  const p2 = panel(s, "Classic", 0.6 + W2 + G2, tb + 0.2, W2, null, HEX.red, HEX.redTint, "CLASSIC RETIRES", null, [
    "Migrate classic Front Door before March 31, 2027; it takes no new profiles or domains",
  ], 12);
  if (Math.max(p1, p2) > 6.61) console.warn("  ! selection panels may overflow");
  sources(s, "Sources: Module 3, Unit 1; Guide, Step 5 (Selection); What is Azure Front Door?; Migrate Azure Front Door (classic); Front Door Private Link origins.");
  notes(s,
`Unit 1 is the guide's Step 5. Learn's overview, What is Azure Front Door, says Front Door is global and sits at the Microsoft edge with built-in layer three and four DDoS protection, while Application Gateway is regional, in the agency's own virtual network. Either carries the web application firewall from Module 2. The guide's selection is design guidance. Front Door Premium for internet-facing applications that need global reach, Private Link origins or managed firewall rules. Application Gateway for regional applications, for traffic that must enter through the agency's own network, or where Front Door isn't in the region. And both, with Front Door reaching Application Gateway over Private Link, where the application needs regional inspection too. One date to plan around: Learn's migration page says classic Front Door retires on March thirty-first, twenty twenty-seven, and already accepts no new profiles or domains.`,
  `${M} — Unit 1; guide, Step 5 (opening, Selection); Microsoft Learn — "What is Azure Front Door?," "Migrate Azure Front Door (classic) to Standard or Premium tier," "Secure your origin with Private Link in Azure Front Door Premium."`);
}

// ================================================================== 5 Lock the origin
{
  const s = content(SC, "Lock the origin: Private Link, or tag plus header");
  tag(s, "How");
  const p1 = panel(s, "PL", 0.6, 1.45, W2, null, HEX.teal, HEX.tealTint, "PRIVATE LINK, WHERE THE ORIGIN SUPPORTS IT", null, [
    "App Service, Blob Storage, internal load balancers, API Management, Application Gateway, Container Apps",
    "Approve the private endpoint connection Front Door requests",
    "Don't mix public and private origins in one origin group",
  ], 12.5);
  const p2 = panel(s, "Tag", 0.6 + W2 + G2, 1.45, W2, null, HEX.amber, HEX.amberTint, "OTHERWISE, BOTH TOGETHER", null, [
    "The AzureFrontDoor.Backend service tag",
    "And the X-Azure-FDID header: the tag's addresses are shared by every Front Door customer",
    "Behind Front Door, an application gateway: an NSG rule plus a WAF custom rule on the header",
  ], 12.5);
  code(s, "AR", 0.6, Math.max(p1, p2) + 0.2, 12.15, [
    "# An App Service origin: Learn's access restriction does both",
    "az webapp config access-restriction add --resource-group <rg> --name <app-name> --priority 100 `",
    "    --service-tag AzureFrontDoor.Backend --http-header x-azure-fdid=<front-door-id>",
  ], { label: "THE GUIDE'S STEP 5 COMMAND, FROM MICROSOFT LEARN", pt: 10.5 });
  sources(s, "Sources: Module 3, Unit 1; Guide, Step 5 (step 1); Front Door Private Link origins; Secure traffic to Azure Front Door origins; multi-region App Service tutorial.");
  notes(s,
`Now the origin. Use Private Link where the origin type supports it. Learn's page on Private Link in Front Door Premium lists App Service, Blob Storage, internal load balancers, API Management, Application Gateway and Container Apps. Approve the private endpoint connection Front Door requests, and don't mix public and private origins in one origin group. Where Private Link doesn't apply, Learn's page on securing traffic to Front Door origins says to use the Front Door backend service tag and the X Azure F D I D header together, because the tag's addresses are shared by every Front Door customer. The header carries your own profile's Front Door I D. For an App Service origin, one access restriction does both, as Learn's multi-region tutorial shows. For an application gateway behind Front Door, an N S G rule allows only the tag, and a firewall custom rule checks the header.`,
  `${M} — Unit 1; guide, Step 5 (step 1); Microsoft Learn — "Secure your origin with Private Link in Azure Front Door Premium," "Secure traffic to Azure Front Door origins," "Tutorial: Create a highly available multi-region app in Azure App Service."`);
}

// ================================================================== 6 TLS probes failover
{
  const s = content(SC, "TLS 1.2 or later, health probes, and failover");
  tag(s, "How");
  const c = code(s, "TLS", 0.6, 1.45, 12.15, [
    "# Application Gateway: a predefined TLS policy (Learn's Az PowerShell)",
    "$AppGw = Get-AzApplicationGateway -Name <appgw> -ResourceGroupName <rg>",
    "Set-AzApplicationGatewaySslPolicy -PolicyType Predefined -PolicyName \"AppGwSslPolicy20220101S\" -ApplicationGateway $AppGw",
    "Set-AzApplicationGateway -ApplicationGateway $AppGw",
    "# Front Door: an origin group with health probes; two origins in different regions (shortened)",
    "az afd origin-group create --resource-group <rg> --origin-group-name og --profile-name <afd-profile> --probe-request-type GET ...",
  ], { label: "THE GUIDE'S STEP 5 COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const p1 = panel(s, "TLS", 0.6, c + 0.2, W3, null, HEX.navy, HEX.navyTint, "TLS", null, [
    "TLS 1.2 or 1.3 only",
    "Front Door Standard and Premium require HTTPS on every custom domain",
  ], 12);
  const p2 = panel(s, "Fail", 0.6 + W3 + G3, c + 0.2, W3, null, HEX.teal, HEX.tealTint, "FAILOVER", null, [
    "Stop one origin: the application stays up through the other",
    "Exercised twice a year (design guidance)",
  ], 12);
  const p3 = panel(s, "Cut", 0.6 + 2 * (W3 + G3), c + 0.2, W3, null, HEX.amber, HEX.amberTint, "CUT OVER SAFELY", null, [
    "Run Front Door beside the old endpoint; compare logs before DNS",
    "Rollback: remove the restriction; restore DNS",
  ], 12);
  if (Math.max(p1, p2, p3) > 6.61) console.warn("  ! TLS panels may overflow");
  sources(s, "Sources: Module 3, Unit 1; Guide, Step 5 (steps 2 to 4, How template); Internet ingress; TLS policy on Application Gateway; Front Door CLI quickstart.");
  notes(s,
`Next, TLS. Learn's internet ingress design guide says TLS one point two or one point three only, and on Application Gateway, a predefined policy. The guide's command, from Learn's Az PowerShell page, sets the predefined policy twenty twenty-two oh one oh one S. Front Door Standard and Premium require H T T P S on every custom domain, with custom certificates kept in Key Vault. Then health probes and failover. Learn's Front Door quickstart builds an origin group with probes and two origins in different regions, then stops one origin to show the application stays available through the other. The program exercises that twice a year. Cutting over is gentle too: run Front Door beside the old public endpoint and compare logs before you change D N S, then close the origin's public path one application at a time. Rollback removes the access restriction and restores D N S.`,
  `${M} — Unit 1; guide, Step 5 (steps 2 to 4; How template: report-only phase, enforcement, rollback, day-two ownership); Microsoft Learn — "Internet ingress," "Configure TLS policy versions ... using PowerShell," "Quickstart: Create an Azure Front Door using Azure CLI," "Migrate Azure Front Door (classic)."`);
}

// ================================================================== 7 Firewall
{
  const s = content(SC, "Unit 2: Azure Firewall for egress and east-west");
  tag(s, "What");
  const tb = table(s, "SKU", 1.45, [5.6, 3.25, 3.3], ["Microsoft's Zero Trust recommendations check", "Needs", "Note"], [
    ["Outbound traffic from workloads routed through the firewall", "Any SKU", "A NAT gateway avoids SNAT exhaustion"],
    ["Threat intelligence in alert and deny", "Standard or Premium", ""],
    ["IDPS in alert and deny", "Premium", ""],
    ["Outbound TLS inspected", "Premium", "CA certificate in Key Vault"],
    ["Diagnostic logs on", "Any SKU", "Resource-specific tables"],
  ], { fontSize: 12, limit: 4.9 });
  callout(s, "Up", tb + 0.25, 0.95, "FaArrowsRotate", HEX.teal, "Standard upgrades to Premium without redeployment; ",
    "TLS inspection doesn't decrypt the Education, Finance, Government and Health categories.");
  sources(s, "Sources: Module 3, Unit 2; Guide, Step 6; Zero Trust recommendations for Azure Firewall; Azure Firewall and traffic inspection; Azure Firewall Premium features.");
  notes(s,
`Unit 2 is the guide's Step 6. Network and Transport owns the agency's own edge; inside Azure, Azure Firewall is the inspection point for egress and east-west traffic. Learn's Zero Trust recommendations for Azure Firewall check that outbound traffic from workloads routes through the firewall, that threat intelligence and intrusion detection are in alert-and-deny mode, that outbound TLS is inspected, and that diagnostic logs are on. The SKU matters. Threat intelligence deny needs Standard or Premium. Intrusion detection and prevention, TLS inspection and full URL filtering need Premium, and Learn says Standard upgrades to Premium without redeployment. For high-volume egress, Learn suggests a NAT gateway on the firewall subnet, to avoid running out of source ports. And TLS inspection needs an intermediate C A certificate in Key Vault that clients trust; it doesn't decrypt the Education, Finance, Government and Health categories.`,
  `${M} — Unit 2; guide, Step 6 (opening, steps 2 and 5); Microsoft Learn — "Zero Trust recommendations for Azure Firewall," "Azure Firewall and traffic inspection," "Azure Firewall Premium features implementation guide."`);
}

// ================================================================== 8 Draft
{
  const s = content(SC, "Alert first, then deny through one reviewed draft");
  tag(s, "How");
  const c = code(s, "FW", 0.6, 1.45, 12.15, [
    "# Create in alert mode (Premium); route each workload subnet's default to the firewall (shortened)",
    "az network firewall policy create --name <fw-policy> --resource-group <rg> --sku Premium --threat-intel-mode Alert --idps-mode Alert",
    "az network route-table route create ... --name default-to-firewall --address-prefix 0.0.0.0/0 --next-hop-ip-address <fw-private-ip> ...",
    "# After two weeks in alert: one draft to Deny, reviewed, deployed in a change window",
    "az network firewall policy draft create --policy-name <fw-policy> --resource-group <rg>",
    "az network firewall policy draft update --policy-name <fw-policy> --resource-group <rg> --threat-intel-mode Deny --idps-mode Deny",
    "az network firewall policy draft show --policy-name <fw-policy> --resource-group <rg>",
    "az network firewall policy deploy --name <fw-policy> --resource-group <rg>",
  ], { label: "THE GUIDE'S STEP 6 COMMANDS, FROM MICROSOFT LEARN (AZURE-FIREWALL EXTENSION 1.2.3 OR LATER)", pt: 10.5 });
  callout(s, "Replace", c + 0.25, 1.0, "FaTriangleExclamation", HEX.red, "Deploying replaces the whole applied policy: ",
    "live changes made after the draft was created are lost unless they're in the draft. One change path: drafts only.");
  line(s, "EW", "East-west (design guidance): spoke to spoke through the hub firewall, not direct peering; NSGs deny by default in each spoke.", c + 1.4, 0.55, 13.5);
  sources(s, "Sources: Module 3, Unit 2; Guide, Step 6 (steps 1 to 6); az network firewall policy; Integrate NAT gateway with Azure Firewall; Azure Firewall Draft + Deployment.");
  notes(s,
`Here are the guide's Step 6 commands. Create the firewall policy in alert mode, on Premium, from Learn's C L I reference. Route each workload subnet's default route, zero dot zero dot zero dot zero slash zero, to the firewall's private I P, with Learn's route table commands. Send the logs to the workspace. Leave threat intelligence and intrusion detection in alert for two weeks, reading their logs for hits on legitimate traffic. Then move to deny through a draft, so every change lands at once and can be reviewed: create the draft, update both modes to Deny, show it, and deploy it in a change window. Learn's page, Azure Firewall Draft plus Deployment, carries one warning that the guide repeats: deploying replaces the whole applied policy, so changes made to the live policy after the draft was created are lost unless they're in the draft too. Keep one change path, drafts only. And east-west, as design guidance: spoke to spoke through the hub firewall, with N S Gs denying by default.`,
  `${M} — Unit 2; guide, Step 6 (steps 1 to 6; How template); Microsoft Learn — "az network firewall policy create," "Integrate NAT gateway with Azure Firewall," "Azure Firewall Draft + Deployment."`);
}

// ================================================================== 9 Gov
{
  const s = content(SC, "Where agencies are: regions to check first");
  tag(s, "Who");
  const tb = table(s, "Gov", 1.45, [3.4, 3.4, 5.35], ["Service", "Commercial Azure (GCC)", "Azure Government (side note)"], [
    ["Front Door Standard and Premium", "Available", "Generally available in US Gov Arizona and US Gov Texas"],
    ["Front Door Private Link", "The listed regions", "Three listed, but needs availability zones, shown only in US Gov Virginia: test first"],
    ["Azure Firewall Premium", "Available", "Regions on the products-by-region page, not Learn: not yet specified"],
  ], { fontSize: 12, limit: 4.4 });
  line(s, "OCI", "Other clouds: OCI Network Firewall, built on Palo Alto Networks, with IDPS, TLS inspection and URL filtering, reached through VCN route tables. AWS Network Firewall and Cloud NGFW aren't compared.", tb + 0.3, 0.9, 13.5);
  sources(s, "Sources: Module 3, Unit 3; Guide, \"Government-cloud availability,\" \"What couldn't be verified,\" \"The same controls ... Oracle Cloud\"; OCI Network Firewall.");
  notes(s,
`Where are agencies? In commercial Azure, which a G C C tenant uses, both steps run as written. As side notes for Azure Government, check regions first. Learn's comparison page says Front Door Standard and Premium are generally available in U S Gov Arizona and U S Gov Texas. Front Door Private Link lists three government regions, but the same page limits it to regions with availability zones, and Learn's Azure Government region list shows zones only in U S Gov Virginia, so test before relying on it. Azure Firewall Premium's government regions are on the products-by-region page, not Learn, so the guide records them as not yet specified. On other clouds, the guide names O C I Network Firewall, built on Palo Alto Networks, with intrusion detection and prevention, TLS inspection and URL filtering, reached through V C N route tables. AWS Network Firewall and Google's Cloud N G F W aren't compared there.`,
  `${M} — Unit 3; guide, "Government-cloud availability" (Front Door, Private Link, Azure Firewall rows), "What couldn't be verified," "The same controls on AWS, Google Cloud and Oracle Cloud"; Microsoft Learn — "Compare Azure Government and global Azure," "What is Azure Government?"; Oracle — "Network Firewall overview."`);
}
endModule(SC);

// ================================================================== 10 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 5: origin, TLS and failover");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: the origin directly, then through Front Door (these requests are the path's)",
    "curl.exe -s -o NUL -w \"%{http_code}`n\" \"https://<origin-host>/\"",
    "curl.exe -s -o NUL -w \"%{http_code}`n\" \"https://<afd-endpoint-host>/\"",
    "# Step 2: the origin's access restriction",
    "az webapp config access-restriction show --resource-group <rg> --name <app-name>",
    "# Step 3: the application gateway's TLS policy",
    "Connect-AzAccount -Environment <cloud-environment>",
    "Get-AzApplicationGatewaySslPolicy -ApplicationGateway (Get-AzApplicationGateway -Name <appgw> -ResourceGroupName <rg>)",
    "# Step 4: failover. This writes: stop the second test origin, then call Front Door",
    "az webapp stop --name <app-name-2> --resource-group <rg>",
    "curl.exe -s -o NUL -w \"%{http_code}`n\" \"https://<afd-endpoint-host>/\"",
    "# Step 5: start it again",
    "az webapp start --name <app-name-2> --resource-group <rg>",
  ], { label: LAB, pt: 10 });
  line(s, "Expect", "Expected (the guide's Validate): the direct request refused (403, or no route) and Front Door's succeeds; the app stays up with one origin stopped.", c + 0.15, 0.55, 13);
  sources(s, "Sources: Module 3, \"Exercise: Lab 2,\" steps 1 to 5; Guide, Step 5 (Validate).");
  notes(s,
`The lab runs the guide's Step 5 and Step 6 checks in a test subscription where someone has applied those steps to a test application and a pilot spoke. The authors haven't run it. One part writes, and it's labeled. Step one calls the origin's own host name directly, then the same request through Front Door. The guide's Validate step says the direct request is refused, a four oh three or no route, and the one through Front Door succeeds. Step two exports the origin's access restriction: look for the service tag and the header together. Step three checks the application gateway's TLS policy, the predefined one the guide sets. Step four is the failover test, and it writes, so use only the test application: stop the second origin and call Front Door again. The application should stay available through the other origin. Step five starts the stopped origin again.`,
  `${M} — "Exercise: Lab 2, a test subscription," "You need," steps 1 to 5; guide, Step 5 (Validate).`);
}

// ================================================================== 11 Lab part 2
{
  const s = content(SL, "Lab 2, steps 6 to 10: routes, deny modes, the log");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 6: the test VM's effective routes",
    "az network nic show-effective-route-table --resource-group <rg> --name <nic> -o table",
    "# Step 7: the firewall policy's modes",
    "az network firewall policy show --name <fw-policy> --resource-group <rg> --query \"{ti:threatIntelMode, idps:intrusionDetection.mode}\"",
    "# Step 8: on the test VM, the threat intelligence test domain (curl prints 000 when refused)",
    "curl.exe -s -o NUL -w \"%{http_code}`n\" --max-time 15 \"https://<ti-test-fqdn>/\"",
    "# Step 9: back on your machine, the denied request in AZFWThreatIntel",
    "az monitor log-analytics query --workspace <workspace-guid> --analytics-query \"AZFWThreatIntel | where TimeGenerated > ago(1h) | take 20\" -o table",
    "# Step 10: back it out: the second origin answers again",
    "az webapp show --name <app-name-2> --resource-group <rg> --query state",
  ], { label: LAB, pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Expected (the guide's Validate): ",
    "0.0.0.0/0 to the firewall's private IP; Deny and Deny; the request denied and logged; the origin Running.");
  sources(s, "Sources: Module 3, \"Exercise: Lab 2,\" steps 6 to 10; Guide, Step 6 (Validate); Monitoring data reference for Azure Firewall.");
  notes(s,
`Step six reads the test V M's effective routes. The guide's Validate step says the default route, zero dot zero dot zero dot zero slash zero, goes to the firewall's private I P. Step seven checks the firewall policy, with the guide's own query: threat intelligence and intrusion detection should both read Deny. Step eight runs on the test V M: request a test domain your security monitor confirms is on the threat intelligence feed. The request should be denied; curl prints three zeros when the connection is refused. Step nine, back on your machine, finds the denied request in the log. The guide sends the firewall's logs to resource-specific tables, and Learn's Azure Firewall monitoring reference names the threat intelligence table A Z F W Threat Intel. Step ten backs it out: step five already started the origin, so confirm it reads Running and answers through Front Door again. Nothing else changed.`,
  `${M} — "Exercise: Lab 2," steps 6 to 10; guide, Step 6 (Validate); Microsoft Learn — "Monitoring data reference for Azure Firewall" (read November 13, 2026, per the path's verification log).`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 3");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["Step 5: SC-7 boundary protection, SC-8 transmission confidentiality and integrity, CP-2 contingency plan", "KSI-CNA-MAT (cites SC-8), KSI-SVC-SIN (cites SC-8)", "The origin lock-down test, the TLS policy, the failover test"],
    ["Step 6: SC-7, SC-7(5) deny by default, SI-4 system monitoring", "KSI-CNA-RNT (cites SC-7(5)), KSI-CNA-ULN (cites SC-7)", "The firewall policy, the routes, the denied test request"],
  ], { fontSize: 12, limit: 4.8 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The steps support the controls; ",
    "the organization sets their parameters, and the assessor decides. KSIs are FedRAMP 20x indicators for cloud service providers.");
  sources(s, "Sources: Module 3, \"The federal requirement,\" \"Summary\"; Guide, \"Federal requirements and KSIs\"; NIST SP 800-53 Rev. 5; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five, as the guide's requirements table maps it. Step 5 supports S C seven, boundary protection, S C eight, transmission confidentiality and integrity, and C P two, the contingency plan, which the failover test exercises. Its evidence is the origin lock-down test, the TLS policy and the failover test. Step 6 supports S C seven and its enhancement five, deny by default, and S I four, system monitoring; its evidence is the firewall policy, the routes and the denied test request. Each row lines up with the fed-ramp twenty X key security indicators the guide names. The steps support these controls; the organization still sets their parameters, and the assessor decides whether each is satisfied.`,
  `${M} — "The federal requirement" table; "Summary"; guide, "Federal requirements and KSIs" (rows 5 and 6).`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on Module 3", [
    { q: "An App Service origin allows only the AzureFrontDoor.Backend service tag. Is it locked to your Front Door?", options: ["a. Yes: the tag lists only your Front Door's addresses", "b. No: the tag is shared by every Front Door customer; check X-Azure-FDID too, or use Private Link", "c. Yes, if TLS 1.2 is required"] },
    { q: "Someone changed the live firewall policy after a draft was created. What happens on deploy?", options: ["a. The two are merged", "b. The draft replaces the whole policy; the live change is lost unless it's in the draft", "c. The deployment fails"] },
  ], "1 b: tag plus header, or Private Link. 2 b: the draft replaces the applied policy.");
  sources(s, "Sources: Module 3, \"Knowledge check,\" questions 1 and 3; Units 1 and 2; Guide, Steps 5 and 6.");
  notes(s,
`Check yourself with two questions. First: an App Service origin allows traffic only from the Front Door backend service tag. Is it locked to your Front Door? The answer is b, no. The tag's addresses are shared by every Front Door customer, so check the X Azure F D I D header too, or use Private Link. Second: someone changed the live firewall policy after a draft was created. What happens when the draft is deployed? The answer is b: the draft replaces the whole applied policy, and the live change is lost unless it's in the draft too. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 3, and "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: no way around the edge, no way out unseen");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Chose the edge for an application, and locked its origin",
    "Checked TLS and tested failover",
    "Checked egress routes to Azure Firewall",
    "Proved threat intelligence denies, with its log row",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 4", [
    "Private Link, DNS and Key Vault: PaaS off the internet, and vaults behind RBAC",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "profile, route and access-restriction exports; the TLS policy; the refused request and failover test; the firewall policy and routes; the denied request; the bypass register.");
  sources(s, "Sources: Module 3, \"Summary\"; learning path index; Module 4.");
  notes(s,
`To sum up. You chose the edge for an application and locked its origin, so a direct request is refused. You checked TLS, and tested failover. You checked that the pilot subnet's egress routes to Azure Firewall, with threat intelligence and intrusion detection in deny mode, and found the denied request in its log. The evidence an I S S O keeps from this module: the profile, origin group, route and access-restriction exports; the TLS policy; the refused direct request and the failover test; the firewall policy export and route tables; the denied request and its log row; and the bypass and allow-list register. Next is Module 4: Private Link, D N S and Key Vault, taking pass off the internet and putting vaults behind role-based access.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 3 deck", [
  "Module page: docs/training/azure-security/03-the-edge-and-the-egress.md (Azure Security Engineering learning path, Module 3), a draft; the path's verification log is docs/training/azure-security/_verification/learning-path.md.",
  "Azure Security Engineering (implementation guide): Steps 5 and 6; Government-cloud availability; The same controls on AWS, Google Cloud and Oracle Cloud; Dangers; What couldn't be verified. Its footnotes carry each source, read November 11, 2026: Microsoft Learn, What is Azure Front Door?; Front Door Private Link origins; Secure traffic to Azure Front Door origins; Migrate Azure Front Door (classic); the Front Door CLI quickstart; the multi-region App Service tutorial; Internet ingress; TLS policy on Application Gateway; Zero Trust recommendations for Azure Firewall; Azure Firewall and traffic inspection; Azure Firewall Premium features; az network firewall policy; Integrate NAT gateway with Azure Firewall; Azure Firewall Draft + Deployment; Compare Azure Government and global Azure; OCI Network Firewall.",
  "Read for the lab, November 13, 2026: Microsoft Learn, Monitoring data reference for Azure Firewall; Azure CLI, az monitor log-analytics.",
  "NIST SP 800-53 Rev. 5 (SC-7, SC-7(5), SC-8, CP-2, SI-4); FedRAMP 20x KSIs, as the guide's requirements table maps them.",
  "The lab's commands are the page's, with its placeholders; the module has no Lab 1, and the lab wasn't run by the authors.",
]);

finish(OUT);
