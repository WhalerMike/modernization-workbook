// Azure Security Engineering learning path, Module 2: DDoS protection and the web application firewall — the module's
// narrated deck. Teaches docs/training/azure-security/02-ddos-protection-and-the-waf.md, Learn-style: objectives, the
// concepts (the DDoS tiers and their limits, the plan, logs, alert and exercise; the WAF from detection to prevention, the
// Zero Trust checks, the rule set, rate limit, tuning and rollback, Front Door), where agencies are, the lab's exact
// commands in a test subscription (not run by the authors, as the page says; the module has no Lab 1), the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page and the Azure
// Security Engineering implementation guide it sends the learner to (Steps 3 and 4, Government-cloud availability, The
// same controls on AWS, Google Cloud and Oracle Cloud, and their footnotes) or the path's verification log; the deck adds
// none. Helpers: ../training-azs-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-azs-module-2/build.js \
//                      presentations/training-azs-module-2/Training_AZS_Module_2.pptx
const P = require("../training-azs-module-1/shared.js")({
  title: "Module 2: DDoS protection and the web application firewall",
  footer: "Federal Modernization Workbook  ·  Azure Security Engineering learning path, Module 2: DDoS protection and the WAF",
});
const { HEX, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, title, objectives, check } = P;
const OUT = process.argv[2] || "Training_AZS_Module_2.pptx";
const M = "Training, Azure Security Engineering, Module 2";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";
const W2 = 5.95, G2 = 0.25;
const W3 = 3.9, G3 = 0.225;
const LAB = "LAB 2  ·  A TEST SUBSCRIPTION, NEVER PRODUCTION  ·  NOT RUN BY THE AUTHORS";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 2: DDoS protection and the web application firewall", "Azure Security Engineering · Layers 3 and 4, then layer 7, each in the mode that acts",
    ["DDoS tiers and their limits  ·  Plan, logs, alert, exercise  ·  The WAF, detection to prevention", "Rule sets and rate limits  ·  Where agencies are  ·  Lab 2 in a test subscription  ·  Evidence"]);
  notes(s,
`Welcome to Module 2 of the Azure Security Engineering learning path: DDoS protection and the web application firewall. In Module 1 you built the exposure register. In this module you take every public I P in it to DDoS protection, with logs and an alert, and every internet-facing web endpoint to a web application firewall in prevention mode. It covers Steps 3 and 4 of the Azure Security Engineering implementation guide, and takes about fifty minutes, plus a lab in your own test subscription.`,
  `${M} — "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why: two layers, and a mode that acts, not only logs");
  tag(s, "Why");
  const l = panel(s, "L34", 0.6, 1.45, W2, null, HEX.navy, HEX.navyTint, "LAYERS 3 AND 4", "Azure DDoS Protection", [
    "Absorbs volumetric and protocol attacks on public IPs",
    "Doesn't see layer 7: an HTTP flood needs the WAF",
  ], 13);
  const r = panel(s, "L7", 0.6 + W2 + G2, 1.45, W2, null, HEX.red, HEX.redTint, "LAYER 7", "Azure Web Application Firewall", [
    "In detection mode it only logs: attacks reach the backend",
    "Only prevention mode blocks",
  ], 13);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaShieldHalved", HEX.red, "This module: ",
    "every public IP in the register protected, logged and alerting; every HTTP endpoint behind a WAF in prevention.");
  sources(s, "Sources: Module 2, \"Introduction\"; Guide, Steps 3 and 4; What is Azure DDoS Protection?; Zero Trust recommendations for Application Gateway WAF.");
  notes(s,
`Why both? Learn's overview, What is Azure DDoS Protection, says it works at layers three and four, and that layer seven needs a web application firewall. So an internet-facing workload needs both. And each has to be in the mode that acts, not only the mode that logs. Learn's Zero Trust recommendations for the Application Gateway web application firewall put it plainly: in detection mode it logs and forwards; only prevention mode blocks. A firewall left in detection mode is the first danger in the guide's dangers table. So this module takes every public I P in the register to DDoS protection with logs and an alert, and every web endpoint to a firewall in prevention mode, tuned first so it doesn't block legitimate users.`,
  `${M} — "Introduction"; guide, Step 3 (opening), Step 4 (opening), "Dangers"; Microsoft Learn — "What is Azure DDoS Protection?," "Zero Trust recommendations for Application Gateway WAF."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 2", [
    "Say what each DDoS tier gives, and what neither paid tier covers",
    "Check every public IP is protected, logged and alerting",
    "Explain how a DDoS exercise may be run, and by whom",
    "Take a WAF policy from detection to prevention, tuned",
    "Prove the WAF blocks a test request; roll it back if needed",
  ], [
    "Module 1, and its public-ips query",
    "The guide's decision record template, for the tiers",
    "Lab 2: a test subscription, never production",
  ], 50);
  sources(s, "Sources: Module 2, \"Learning objectives,\" \"Prerequisites\"; Exercise: Lab 2.");
  notes(s,
`Here's what you'll be able to do by the end of this module. You'll say what DDoS infrastructure protection, I P Protection and Network Protection each give, and what neither paid tier covers. You'll check that every public I P is protected, logged and alerting. You'll explain why a simulation runs only through an approved partner, and only against your own protected I Ps. You'll take a web application firewall policy from detection to prevention, with request body inspection, the current rule set and a rate limit. And you'll prove it blocks a test request, and roll it back if it blocks legitimate traffic. You need Module 1 and its public I P query, and the guide's decision record template, because the DDoS tier and the Front Door tier are recorded there.`,
  `${M} — "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 Tiers
{
  const s = content(SC, "Unit 1: three DDoS tiers, and what none covers");
  tag(s, "What");
  const tb = table(s, "Tiers", 1.45, [3.1, 3.0, 3.0, 3.05], ["", "Infrastructure", "IP Protection", "Network Protection"], [
    ["Cost", "Free, every public IP", "Billed per protected IP", "Billed per plan"],
    ["Tuning, analytics, metrics, alerts, reports", "No", "Yes", "Yes"],
    ["Rapid Response, cost protection, WAF discount", "No", "No", "Yes"],
    ["Basic public IPs", "—", "Not protected", "Protected"],
    ["Best for", "—", "A few critical IPs", "Many IPs across subscriptions"],
  ], { fontSize: 12, limit: 4.9 });
  callout(s, "Limits", tb + 0.25, 1.0, "FaTriangleExclamation", HEX.red, "Neither paid tier covers ",
    "a public IP attached to a NAT gateway, and both work at layers 3 and 4 only. Record the tier in the decision record.");
  sources(s, "Sources: Module 2, Unit 1; Guide, Step 3; About Azure DDoS Protection tier comparison; DDoS Protection cost optimization principles.");
  notes(s,
`Unit 1 is the guide's Step 3. Learn's tier comparison is the source for this table. Every public I P in Azure gets infrastructure protection at no cost. I P Protection, billed per protected I P, and Network Protection, billed per plan, both add adaptive tuning, attack analytics, metrics, alerts and mitigation reports. Network Protection also adds the DDoS Rapid Response team, cost protection and a web application firewall discount, and it protects Basic public I Ps, which I P Protection doesn't. Learn's cost optimization guidance suggests Network Protection when many public I Ps across subscriptions need coverage, and I P Protection for a few critical ones. Two limits. Neither covers a public I P attached to a NAT gateway; the guide lists those as an exclusion. And both work at layers three and four only. Whichever you choose, record it in the decision record.`,
  `${M} — Unit 1; guide, Step 3 (opening, "Choose the tier," How template exclusions); Microsoft Learn — "About Azure DDoS Protection tier comparison," "DDoS Protection cost optimization principles."`);
}

// ================================================================== 5 DDoS commands
{
  const s = content(SC, "One plan, linked networks, logs and the attack alert");
  tag(s, "How");
  const c = code(s, "DDoS", 0.6, 1.45, 12.15, [
    "# One Network Protection plan in the connectivity subscription; link each virtual network that holds public IPs",
    "az network ddos-protection create --resource-group <rg> --name <ddos-plan>",
    "az network vnet update --resource-group <rg> --name <vnet> --ddos-protection-plan <ddos-plan> --ddos-protection true",
    "# Diagnostic logs on each protected public IP, to the workspace (shortened)",
    "az monitor diagnostic-settings create --name ddos-to-workspace --resource <pip-resource-id> --workspace <workspace-id> ...",
    "# Alert while under attack: IfUnderDDoSAttack is 1 during mitigation",
    "az monitor metrics alert create --name ddos-under-attack-<pip> --resource-group <rg> --scopes <pip-resource-id> `",
    "    --condition \"max IfUnderDDoSAttack >= 1\" --window-size 5m --evaluation-frequency 1m --action <action-group-id> --severity 1",
  ], { label: "THE GUIDE'S STEP 3 COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const p1 = panel(s, "Move", 0.6, c + 0.2, W2, null, HEX.amber, HEX.amberTint, "DON'T MOVE A PROTECTED NETWORK", null, [
    "It can't move between resource groups or subscriptions",
    "Disabling protection to move it resets the tuned thresholds",
  ], 12);
  const p2 = panel(s, "Hold", 0.6 + W2 + G2, c + 0.2, W2, null, HEX.navy, HEX.navyTint, "HOLD IT WITH POLICY (STEP 9)", null, [
    "Virtual networks protected by DDoS Protection: Modify or Audit",
    "Public IPs with DDoS resource logs enabled",
  ], 12);
  if (Math.max(p1, p2) > 6.61) console.warn("  ! DDoS panels may overflow");
  sources(s, "Sources: Module 2, Unit 1; Guide, Step 3; DDoS Network Protection CLI quickstart; Secure your Azure DDoS Protection deployment; Supported metrics for public IPs.");
  notes(s,
`Here are the guide's Step 3 commands, from Learn's DDoS quickstarts. Create one Network Protection plan in the connectivity subscription, and link each virtual network that holds public I Ps. Or, for I P Protection, enable it on one Standard public I P. Turn on diagnostic logs for each protected public I P, to the workspace. Then alert on attack. The metric called Under DDoS attack or not reads one during mitigation, and Learn's tutorial alerts at a maximum of one or more. One caution from Learn's quickstart: a virtual network with DDoS protection can't be moved between resource groups or subscriptions, and disabling protection to move it resets the tuned thresholds. Then hold it with policy in Step 9: Learn's page, Secure your Azure DDoS Protection deployment, names the built-in policies, one that protects virtual networks with a Modify or Audit effect, and one that requires the DDoS resource logs.`,
  `${M} — Unit 1; guide, Step 3 (steps 1 to 5); Microsoft Learn — "QuickStart: Create and configure Azure DDoS Network Protection using Azure CLI," "QuickStart: ... DDoS IP Protection using Azure CLI," "Secure your Azure DDoS Protection deployment," "Supported metrics for Microsoft.Network/publicIPAddresses," "Tutorial: Azure DDoS Protection simulation testing."`);
}

// ================================================================== 6 Exercise
{
  const s = content(SC, "Exercise the response: approved partners only");
  tag(s, "Who");
  const p1 = panel(s, "Rules", 0.6, 1.45, W3, null, HEX.red, HEX.redTint, "LEARN'S RULES", null, [
    "Only through approved partners: MazeBolt, Red Button, RedWolf",
    "Only against your own protected Azure public IPs",
    "Staging or off-peak windows",
  ], 12.5);
  const p2 = panel(s, "Before", 0.6 + W3 + G3, 1.45, W3, null, HEX.navy, HEX.navyTint, "BEFORE THE EXERCISE", null, [
    "Write the response team and runbook",
    "Know how to raise a severity A request to Rapid Response (Network Protection)",
  ], 12.5);
  const p3 = panel(s, "Prove", 0.6 + 2 * (W3 + G3), 1.45, W3, null, HEX.teal, HEX.tealTint, "WHAT IT PROVES", null, [
    "The alert fired",
    "The action group paged the security monitor",
    "The logs show the mitigation",
  ], 12.5);
  callout(s, "Pilot", Math.max(p1, p2, p3) + 0.3, 1.0, "FaRoute", HEX.amber, "Rollout: ",
    "a non-production network first; policy in Audit for a cycle; then the hub, Online and Corp landing zones in rings; then the Modify effect.");
  sources(s, "Sources: Module 2, Unit 1; Guide, Step 3 (step 6, How template, Validate); DDoS simulation testing; Secure your Azure DDoS Protection deployment.");
  notes(s,
`The response has to be exercised, and Learn sets the rules in its tutorial on DDoS simulation testing. Simulations run only through Microsoft's approved partners, MazeBolt, Red Button and RedWolf, only against the agency's own protected Azure public I Ps, and preferably in staging or off-peak windows. Before the exercise, write the response team and runbook that Learn's page on securing a DDoS deployment recommends, including how to raise a severity A support request to the Rapid Response team under Network Protection. The exercise proves three things the guide's Validate step asks for: the alert fired, the action group paged the security monitor, and the logs show the mitigation. The rollout itself is gentle: one non-production network first, the policy in audit for an evaluation cycle, then rings, the hub, then Online and Corp landing zones, and only then the policy's Modify effect.`,
  `${M} — Unit 1; guide, Step 3 (step 6; How template: pilot, audit phase, enforcement; Validate); Microsoft Learn — "Tutorial: Azure DDoS Protection simulation testing," "Secure your Azure DDoS Protection deployment."`);
}

// ================================================================== 7 WAF checks
{
  const s = content(SC, "Unit 2: the WAF, and what Zero Trust checks");
  tag(s, "What");
  const tb = table(s, "ZT", 1.45, [5.0, 3.55, 3.6], ["Microsoft's Zero Trust recommendations check", "Application Gateway", "Front Door"], [
    ["Prevention mode; request body inspection", "Yes", "Yes"],
    ["Default rule set; bot protection rule set", "Yes", "Yes"],
    ["Rate limiting; JavaScript challenge", "Yes", "Yes"],
    ["HTTP DDoS rule set", "Yes", "—"],
    ["CAPTCHA challenge", "—", "Yes"],
    ["Diagnostic logging", "Yes", "Yes"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Where", tb + 0.25, 0.95, "FaGlobe", HEX.navy, "Two places: ",
    "Front Door (global, Premium for managed rules) and Application Gateway WAF_v2 (regional), as a policy of managed rules, custom rules and settings.");
  sources(s, "Sources: Module 2, Unit 2; Guide, Step 4; Azure network security Zero Trust recommendations; Zero Trust recommendations for Application Gateway WAF.");
  notes(s,
`Unit 2 is the guide's Step 4, the web application firewall. Azure W A F runs in two places: on Front Door, which is global, and on Application Gateway W A F version two, which is regional. Either way it's a policy of managed rules, custom rules and settings. Front Door's managed rules need the Premium tier. Microsoft's Azure network security Zero Trust recommendations check the same things on both: prevention mode, request body inspection, the default rule set, the bot protection rule set, rate limiting, a JavaScript challenge, and diagnostic logging. Application Gateway adds the H T T P DDoS rule set; Front Door adds a CAPTCHA challenge. The Zero Trust Assessment automates these checks, so a policy that misses one shows up as a finding.`,
  `${M} — Unit 2; guide, Step 4 (opening); Microsoft Learn — "Azure network security Zero Trust recommendations," "Zero Trust recommendations for Application Gateway WAF."`);
}

// ================================================================== 8 WAF commands
{
  const s = content(SC, "Detection first, then tune, then prevention");
  tag(s, "How");
  const c = code(s, "WAF", 0.6, 1.45, 12.15, [
    "# Create in detection mode with request body inspection; name the rule set version you validated",
    "az network application-gateway waf-policy create --name <waf-policy> --resource-group <rg> --type Microsoft_DefaultRuleSet --version 2.1",
    "az network application-gateway waf-policy policy-setting update --policy-name <waf-policy> --resource-group <rg> `",
    "    --mode Detection --state Enabled --request-body-check true",
    "# Bot protection (commercial Azure only); a rate limit by client address on the login path (shortened)",
    "az network application-gateway waf-policy managed-rule rule-set add ... --type Microsoft_BotManagerRuleSet --version 1.1",
    "az network application-gateway waf-policy custom-rule create ... --name LoginRateLimitRule --rule-type RateLimitRule ...",
    "# After tuning: prevention. Rollback is the same command with --mode Detection",
    "az network application-gateway waf-policy policy-setting update ... --mode Prevention --state Enabled --request-body-check true",
  ], { label: "THE GUIDE'S STEP 4 COMMANDS, FROM MICROSOFT LEARN", pt: 10.5 });
  const p1 = panel(s, "Rules", 0.6, c + 0.2, W3, null, HEX.navy, HEX.navyTint, "THE RULE SET", null, [
    "CLI default: DRS 2.1",
    "Learn recommends the latest, 2.2, validated in log mode",
  ], 12);
  const p2 = panel(s, "Tune", 0.6 + W3 + G3, c + 0.2, W3, null, HEX.amber, HEX.amberTint, "TUNE", null, [
    "A full business cycle in detection (two weeks: design guidance)",
    "Exceptions scoped to the narrowest rule",
  ], 12);
  const p3 = panel(s, "Back", 0.6 + 2 * (W3 + G3), c + 0.2, W3, null, HEX.teal, HEX.tealTint, "ROLL BACK", null, [
    "Mode back to Detection, in minutes",
    "Same policy as Bicep, from Azure Verified Modules",
  ], 12);
  if (Math.max(p1, p2, p3) > 6.61) console.warn("  ! WAF panels may overflow");
  sources(s, "Sources: Module 2, Unit 2; Guide, Step 4; az network application-gateway waf-policy; rate limit custom rules; Secure your Azure Application Gateway; WAF troubleshooting.");
  notes(s,
`Here are the guide's Application Gateway commands, from Learn's Azure C L I reference. Create the policy in detection mode, with request body inspection on. The C L I's default rule set is version two point one; Learn's page, Secure your Azure Application Gateway, recommends the latest, two point two at the guide's reading, validated in log mode before blocking. So name the version you've validated. Add the bot protection rule set, in commercial Azure, and a rate limit grouped by client address on the login path, from Learn's rate limit examples. Then tune: detection for at least one full business cycle, two weeks by the program's default, reading the firewall log for matches on legitimate traffic, and scoping each exception to the narrowest rule. Then switch to prevention, one application at a time. Rollback is the same command with the mode back to detection, which Learn documents for false positives. The guide also gives the policy as Bicep, from Azure Verified Modules.`,
  `${M} — Unit 2; guide, Step 4 (steps 1 to 4, As code, How template); Microsoft Learn — "az network application-gateway waf-policy," "Configure rate limit custom rules," "Secure your Azure Application Gateway," "Troubleshoot Application Gateway WAF blocking legitimate requests"; Azure Verified Modules.`);
}

// ================================================================== 9 Gov and other clouds
{
  const s = content(SC, "Where agencies are: the WAF's sovereign-cloud gaps");
  tag(s, "Who");
  const tb = table(s, "Gov", 1.45, [3.4, 3.55, 5.2], ["Service", "Commercial Azure (GCC)", "Azure Government (side note)"], [
    ["Application Gateway WAF", "Everything in this module", "Supported; no bot protection rule sets, no geo-filtering custom rules"],
    ["Front Door WAF", "Everything; Premium for managed rules", "Sovereign-cloud limits not yet specified: assume the Application Gateway ones"],
    ["DDoS Protection", "Available", "No variation listed; partners other than Red Button not yet specified"],
  ], { fontSize: 12, limit: 4.4 });
  callout(s, "Skip", tb + 0.2, 0.95, "FaClipboardCheck", HEX.amber, "In Azure Government: ",
    "leave out the bot manager rule set, and record its Zero Trust test as Skipped-Not-Applicable (environment), not Fail.");
  line(s, "Other", "Other clouds: AWS Shield and AWS WAF; Google Cloud Armor; OCI WAF as a regional or edge policy (OCI DDoS not compared).", 5.95, 0.6, 13.5);
  sources(s, "Sources: Module 2, Unit 3; Guide, \"Government-cloud availability,\" \"The same controls on AWS, Google Cloud and Oracle Cloud\"; Application Gateway WAF FAQ.");
  notes(s,
`Where are agencies? In commercial Azure, which a G C C tenant uses, everything in this module is available. As a side note for Azure Government: Learn's frequently asked questions for the Application Gateway firewall say it's supported in sovereign clouds, but geo-filtering custom rules and bot protection rule sets aren't. So leave the bot manager rule set out, and record that Zero Trust test as skipped, not applicable, for the environment, not as a failure. Front Door's own sovereign-cloud limits aren't yet specified; assume the Application Gateway ones until a test policy shows otherwise. DDoS Protection has no variation listed, but which simulation partners serve Azure Government isn't specified, and Red Button is public cloud only. On other clouds, the guide names AWS Shield and AWS W A F, Google Cloud Armor, and O C I W A F as a regional policy on a load balancer or at the edge. DDoS protection on Oracle Cloud Infrastructure isn't compared there.`,
  `${M} — Unit 3; guide, "Government-cloud availability" (WAF and DDoS rows), "The same controls on AWS, Google Cloud and Oracle Cloud"; Microsoft Learn — "Frequently asked questions for Azure Web Application Firewall on Application Gateway," "Tutorial: Azure DDoS Protection simulation testing."`);
}
endModule(SC);

// ================================================================== 10 Lab part 1
{
  const s = content(SL, "Lab 2, steps 1 to 3: every public IP's DDoS state");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 1: every public IP's DDoS state (Module 1's query, narrowed)",
    "az graph query -q \"Resources | where type =~ 'microsoft.network/publicipaddresses' | project name, resourceGroup, `",
    "    ddosMode = tostring(properties.ddosSettings.protectionMode)\" --first 1000 -o table",
    "# Step 2: the plan and its linked networks",
    "az network ddos-protection show --resource-group <rg> --name <ddos-plan>",
    "# Step 3: the protected IP's logs and alert",
    "az monitor diagnostic-settings list --resource <pip-resource-id> -o table",
    "az monitor metrics alert show --name ddos-under-attack-<pip> --resource-group <rg>",
  ], { label: LAB, pt: 10.5 });
  line(s, "Expect", "Expected (the guide's Validate): every public IP shows Enabled, or VirtualNetworkInherited in a linked network.", c + 0.2, 0.5, 13.5);
  callout(s, "Sim", c + 0.85, 0.95, "FaTriangleExclamation", HEX.red, "Not in the lab: ",
    "the DDoS simulation. Learn allows it only through an approved partner, against your own protected IPs.");
  sources(s, "Sources: Module 2, \"Exercise: Lab 2,\" steps 1 to 3; Guide, Step 3 (Validate, evidence checklist).");
  notes(s,
`The lab runs the guide's Step 3 and Step 4 checks in a test subscription where someone has applied those steps to a test application. Nothing in Azure changes, and the authors haven't run it. You need a DDoS Network Protection plan linked to a test virtual network, a protected Standard public I P with its diagnostic setting and alert, and a test application behind an Application Gateway firewall in prevention mode. Step one lists every public I P's DDoS state. The guide's Validate step says each should show Enabled, or Virtual Network Inherited in a linked network. Step two exports the plan and its linked networks, which the guide's evidence checklist names. Step three checks the protected I P's diagnostic setting and the alert on the under-attack metric. The simulation isn't part of the lab: Learn allows it only through an approved partner.`,
  `${M} — "Exercise: Lab 2, a test subscription," "You need," steps 1 to 3.`);
}

// ================================================================== 11 Lab part 2
{
  const s = content(SL, "Lab 2, steps 4 to 7: the WAF blocks a test request");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Step 4: the policy's mode, body inspection and rule sets",
    "az network application-gateway waf-policy show --name <waf-policy> --resource-group <rg> `",
    "    --query \"{mode:policySettings.mode, body:policySettings.requestBodyCheck, sets:managedRules.managedRuleSets[].ruleSetType}\"",
    "# Step 5: a benign SQL injection string on the test path (this request is the path's)",
    "curl.exe -s -o NUL -w \"%{http_code}`n\" \"https://<test-host>/<test-path>?id=1%27%20OR%201%3D1--\"",
    "# Step 6: the row in the firewall log (resource-specific table AGWFirewallLogs)",
    "az extension add --name log-analytics",
    "az monitor log-analytics query --workspace <workspace-guid> --analytics-query \"AGWFirewallLogs | where TimeGenerated > ago(1h) | take 20\" -o table",
    "# Step 7: nothing to undo; if step 5 wasn't 403, report it to the application owner",
  ], { label: LAB, pt: 10.5 });
  callout(s, "Expect", c + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "Expected (the guide's Validate): ",
    "Prevention, true and the rule sets; the request returns 403; the firewall log has the matching row.");
  sources(s, "Sources: Module 2, \"Exercise: Lab 2,\" steps 4 to 7; Guide, Step 4 (Validate); Diagnostic logs for Application Gateway; az monitor log-analytics.");
  notes(s,
`Step four checks the policy, with the guide's own Validate query: mode, request body inspection and the managed rule sets. Expect Prevention, true, and the rule sets. Step five sends a test request carrying a benign SQL injection string to a path on the test application. That request is the path's; the guide says to send one and expect a four oh three. Step six finds the matching row in the firewall log. The guide's Step 4 sends the log to resource-specific tables, and Learn's page, Diagnostic logs for Application Gateway, names the firewall table A G W Firewall Logs. The query command comes from the Azure C L I's log analytics extension, and takes the workspace's I D, a GUID, not its resource I D. Logs can take a few minutes to arrive. Step seven: nothing changed, so there's nothing to undo. If step five returned anything but four oh three, the firewall isn't blocking: report it to the application owner, and don't fix it in the lab.`,
  `${M} — "Exercise: Lab 2," steps 4 to 7; guide, Step 4 (Validate); Microsoft Learn — "Diagnostic logs for Application Gateway," Azure CLI "az monitor log-analytics" (read November 13, 2026, per the path's verification log).`);
}
endModule(SL);

// ================================================================== 12 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Module 2");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [5.6, 2.9, 3.65], ["Requirement (NIST SP 800-53 Rev. 5)", "KSI", "Evidence"], [
    ["Step 3: SC-5 denial-of-service protection, SI-4 system monitoring", "KSI-CNA-RVP (cites SC-5), KSI-MLA-LET", "Coverage, metrics and logs, the simulation report"],
    ["Step 4: SC-7 boundary protection, SI-10 information input validation", "KSI-CNA-MAT (cites SI-10), KSI-CNA-RVP", "WAF exports, logs, the blocked test request"],
  ], { fontSize: 12.5, limit: 4.6 });
  callout(s, "Claim", b + 0.3, 1.0, "FaScaleBalanced", HEX.navy, "The steps support the controls; ",
    "the assessor decides. SC-5 itself is in the Moderate baseline; meeting it with Azure DDoS Protection on every public IP is Microsoft's recommendation.");
  sources(s, "Sources: Module 2, \"The federal requirement,\" \"Summary\"; Guide, Step 3 (Authority), \"Federal requirements and KSIs\"; NIST SP 800-53 Rev. 5 and 800-53B; FIPS 200; FedRAMP 20x KSIs.");
  notes(s,
`The federal requirement, from NIST special publication eight hundred fifty-three, revision five, as the guide's requirements table maps it. Step 3 supports S C five, denial-of-service protection, and S I four, system monitoring, aligned with the fed-ramp twenty X key security indicators the guide names; the evidence is the coverage, the metrics and logs, and the simulation report. The guide labels the control itself Mandated, because S C five is in the Moderate baseline that FIPS two hundred requires, and the way to meet it, DDoS Protection on every public I P, as Microsoft's recommendation. Step 4 supports S C seven, boundary protection, and S I ten, information input validation; its evidence is the policy exports, the logs and the blocked test request. The steps support these controls, and the assessor decides whether each is satisfied.`,
  `${M} — "The federal requirement" table; "Summary"; guide, Step 3 (Authority), "Federal requirements and KSIs" (rows 3 and 4); NIST SP 800-53 Rev. 5, SP 800-53B; FIPS 200.`);
}

// ================================================================== 13 Check
{
  const s = check(SS, "Check yourself: two questions on Module 2", [
    { q: "A public IP is attached to a NAT gateway. What does DDoS Network Protection do for it?", options: ["a. Protects it like any other Standard public IP", "b. Nothing: NAT gateway IPs aren't supported, so they're an exclusion", "c. Protects it only at layer 7"] },
    { q: "A WAF policy shows Detection. What happens to an attack request?", options: ["a. It is blocked and logged", "b. It is logged and forwarded to the backend", "c. It is dropped silently"] },
  ], "1 b: NAT gateway IPs aren't supported. 2 b: detection logs; only prevention blocks.");
  sources(s, "Sources: Module 2, \"Knowledge check,\" questions 1 and 4; Units 1 and 2; Guide, Steps 3 and 4.");
  notes(s,
`Check yourself with two questions. First: a public I P is attached to a NAT gateway. What does DDoS Network Protection do for it? The answer is b, nothing. Learn's tier comparison says NAT gateway I Ps aren't supported, so the guide lists them as an exclusion. Second: a web application firewall policy shows Detection. What happens to an attack request? The answer is b: it's logged and forwarded to the backend. Only prevention mode blocks. The module page has three more questions, each linked to the unit that answers it.`,
  `${M} — "Knowledge check," questions 1 and 4, and "Check your answers."`);
}

// ================================================================== 14 Summary
{
  const s = content(SS, "Summary: protected, alerting, and blocking");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Chose a DDoS tier and named what it doesn't cover",
    "Checked every public IP is protected, logged and alerting",
    "Took the WAF from detection to prevention, tuned",
    "Proved it blocks a test request, with its log row",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 3", [
    "The edge and the egress: an origin nothing can reach around Front Door, and egress through Azure Firewall",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.0, "FaClipboardCheck", HEX.teal, "The ISSO keeps: ",
    "the plan and linked networks, per-IP modes, DDoS metrics, logs and alerts, the simulation report, WAF exports and logs, the blocked request, and the rule-exception register.");
  sources(s, "Sources: Module 2, \"Summary\"; learning path index; Module 3.");
  notes(s,
`To sum up. You chose a DDoS tier and named what it doesn't cover. You checked that every public I P is protected, logged and alerting. You took the web application firewall from detection to prevention, tuned first. And you proved it blocks a test request, with the matching row in its log. The evidence an I S S O keeps from this module: the plan and its linked networks, the per-I P mode export, DDoS metrics, logs and alert history, the simulation report when the exercise runs, the firewall policy exports and logs, the blocked test request, and the rule-exception register. Next is Module 3, the edge and the egress: an origin nothing can reach around Front Door, and egress through Azure Firewall.`,
  `${M} — "Summary," "Continue the path."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 2 deck", [
  "Module page: docs/training/azure-security/02-ddos-protection-and-the-waf.md (Azure Security Engineering learning path, Module 2), a draft; the path's verification log is docs/training/azure-security/_verification/learning-path.md.",
  "Azure Security Engineering (implementation guide): Steps 3 and 4; Government-cloud availability; The same controls on AWS, Google Cloud and Oracle Cloud; Dangers. Its footnotes carry each source, read November 11, 2026: Microsoft Learn, About Azure DDoS Protection tier comparison; What is Azure DDoS Protection?; DDoS Network Protection CLI quickstart; Secure your Azure DDoS Protection deployment; DDoS Protection cost optimization principles; DDoS simulation testing; Supported metrics for public IPs; Azure network security Zero Trust recommendations; Zero Trust recommendations for Application Gateway WAF; az network application-gateway waf-policy; rate limit custom rules; Secure your Azure Application Gateway; Application Gateway WAF FAQ; WAF troubleshooting; Azure Verified Modules.",
  "Read for the lab, November 13, 2026: Microsoft Learn, Diagnostic logs for Application Gateway; Azure CLI, az monitor log-analytics.",
  "NIST SP 800-53 Rev. 5 and SP 800-53B (SC-5, SI-4, SC-7, SI-10); FIPS 200; FedRAMP 20x KSIs, as the guide's requirements table maps them.",
  "The lab's commands are the page's, with its placeholders; the module has no Lab 1, and the lab wasn't run by the authors.",
]);

finish(OUT);
